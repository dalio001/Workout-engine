// tests/p2_week_plan.test.mjs — P2-10 personal week planner (planned / done /
// missed days on the training calendar + Today card). Every assertion runs
// against the REAL script through harness createApp(); all dates are built
// with local Date constructors because the day boundary is local phone time.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, loadIndexHtml, STATE_KEY } from './harness.mjs';

// Values returned from the vm context have a different prototype realm, so
// structural comparisons go through JSON (never deepStrictEqual).
function j(v) { return JSON.stringify(v); }

// 2026: Oct 12 = Mon, Oct 14 = Wed, Oct 19 = next Mon.
function ts(y, m, d, h = 10, min = 0) { return new Date(y, m, d, h, min, 0, 0).getTime(); }
function key(y, m, d) { return new Date(y, m, d).getFullYear() + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }

function histEntry(id, ms, exId, sets, routineId, title) {
  return {
    id, title: title || 'Workout', routineId: routineId === undefined ? null : routineId,
    date: ms, durationSec: 3600,
    totalVolume: 0, totalSets: sets.length, prCount: 0,
    exercises: [{ exId, note: '', sets }]
  };
}
function loadSet(weight, reps) { return { type: 'N', weight, reps, done: true }; }

// Deterministic exercise: no dependence on the shipped catalogue's metadata.
function addEx(app, id, primary) {
  app.api.state.exercises.push({
    id, name: 'Test ' + id, equipment: 'Barbell',
    primary, secondary: [], type: 'weight_reps'
  });
  return id;
}
// Deterministic routines: never rely on the seeded catalogue's ids.
function addRoutine(app, id, name) {
  app.api.state.routines.push({ id, name, exercises: [{ exId: addEx(app, 'ex_' + id, 'Chest'), sets: 1 }] });
  return id;
}

describe('P2-10 week planner (data + pure helpers)', () => {
  it('normalize-plans-is-idempotent', () => {
    const app = createApp();
    const dirty = {
      '2026-10-20': { routineId: 'rt_a', kind: 'routine', createdAt: 1 },
      '2026-10-21': { routineId: null, kind: 'rest', createdAt: 2 },
      '2026-10-22': { routineId: '  ', kind: 'routine', createdAt: 3 },
      '2026-10-23': 'nope',
      '2026-13-45': { routineId: 'rt_a', kind: 'routine', createdAt: 4 },
      '2026-02-30': { routineId: 'rt_a', kind: 'routine', createdAt: 5 },
      '2026-10-24': { routineId: 'rt_b', kind: 'routine', createdAt: 'x' },
      nested: { routineId: 'rt_a' }
    };
    const once = app.api.normalizePlans(dirty);
    assert.equal(j(once), j(app.api.normalizePlans(once)), 'idempotent');
    assert.equal(j(Object.keys(once).sort()), j(['2026-10-20', '2026-10-21', '2026-10-24']));
    assert.equal(once['2026-10-21'].routineId, null, 'rest -> routineId null');
    assert.equal(once['2026-10-24'].createdAt, 0, 'unusable createdAt -> 0');
    assert.equal(j(app.api.normalizePlans(null)), '{}', 'missing source -> {}');
    assert.equal(j(app.api.normalizePlans([])), '{}', 'array source -> {}');
    assert.equal(j(app.api.normalizePlans('nope')), '{}', 'non-object source -> {}');
    // Never rewrites history, never bumps the schema.
    assert.equal(app.api.SCHEMA_VERSION, 2);
  });

  it('plan-status-derives-done-and-missed-from-history', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    const today = key(2026, 9, 14);
    const past = key(2026, 9, 10);
    const future = key(2026, 9, 20);
    const plan = { routineId: 'rt_a', kind: 'routine', createdAt: 0 };

    assert.equal(app.api.planStatus(null, [], today, today), 'none', 'no plan -> none');
    assert.equal(app.api.planStatus(plan, [], today, today), 'planned', 'today, not done yet');
    assert.equal(app.api.planStatus(plan, [], future, today), 'planned', 'future day');
    assert.equal(app.api.planStatus(plan, [], past, today), 'missed', 'past, never done');
    assert.equal(app.api.planStatus(plan, [histEntry('w', ts(2026, 9, 10), 'ex_rt_a', [loadSet(50, 5)], 'rt_a')], past, today), 'done');
    // A different routine that day never satisfies the plan.
    assert.equal(app.api.planStatus(plan, [histEntry('w2', ts(2026, 9, 10), 'ex_x', [loadSet(50, 5)], 'rt_b')], past, today), 'missed');
    assert.equal(app.api.planStatus(plan, [histEntry('w3', ts(2026, 9, 10), 'ex_x', [loadSet(50, 5)], null)], past, today), 'missed', 'empty workout does not match a routine');
  });

  it('rest-day-plan-is-never-missed-and-never-done', () => {
    const app = createApp();
    const past = key(2026, 9, 10);
    const plan = { routineId: null, kind: 'rest', createdAt: 0 };
    assert.equal(app.api.planStatus(plan, [], past, key(2026, 9, 14)), 'planned', 'a past rest day is not missed');
    assert.equal(app.api.planStatus(plan, [histEntry('w', ts(2026, 9, 10), 'ex_a', [loadSet(50, 5)], 'rt_a')], past, key(2026, 9, 14)), 'planned', 'a workout on a rest day never makes it done');
    assert.equal(app.api.planDoneOn(plan, [histEntry('w', ts(2026, 9, 10), 'ex_a', [loadSet(50, 5)], 'rt_a')]), false);
  });

  it('plan-label-falls-back-to-deleted-routine', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    assert.equal(app.api.planLabel(null, app.api.state.routines), '');
    assert.equal(app.api.planLabel({ routineId: 'rt_a', kind: 'routine' }, app.api.state.routines), 'Push Day');
    assert.equal(app.api.planLabel({ routineId: 'rt_ghost', kind: 'routine' }, app.api.state.routines), 'Deleted routine');
    assert.equal(app.api.planLabel({ routineId: null, kind: 'rest' }, app.api.state.routines), 'Rest day');
  });

  it('compute-plan-week-counts-planned-and-done', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    const now = ts(2026, 9, 14, 12); // week of Mon 12 Oct 2026
    const plans = {
      '2026-10-12': { routineId: 'rt_a', kind: 'routine', createdAt: 0 },
      '2026-10-14': { routineId: 'rt_a', kind: 'routine', createdAt: 0 },
      '2026-10-15': { routineId: null, kind: 'rest', createdAt: 0 },
      '2026-10-11': { routineId: 'rt_a', kind: 'routine', createdAt: 0 } // previous week
    };
    const history = [histEntry('w', ts(2026, 9, 12, 9), 'ex_rt_a', [loadSet(100, 5)], 'rt_a')];
    const week = app.api.computePlanWeek(plans, history, now, 1);
    assert.equal(week.planned, 3, 'this week only');
    assert.equal(week.done, 1, 'only the matching routine');

    app.api.state.weekStart = 'sun';
    assert.equal(app.api.computePlanWeek(plans, history, now, undefined).planned, 4, 'Sunday-start week includes 11 Oct');
    app.api.state.weekStart = 'mon';
  });

  it('restore-old-backup-without-plans-keeps-working', () => {
    const app = createApp();
    const backup = {
      schemaVersion: 2, unit: 'KG', history: [], routines: [],
      exercises: [{ id: 'be', name: 'Bench', equipment: 'Barbell', primary: 'Chest', secondary: [], type: 'weight_reps' }]
    };
    const res = app.api.validateBackupData(backup);
    assert.equal(res.ok, true, 'old backup stays valid');
    assert.equal(j(res.data.plans), '{}', 'gains an empty plans map');
    app.api.pendingRestore = res.data;
    app.api.confirmRestore();
    assert.equal(j(app.api.state.plans), '{}', 'restore keeps working');
    assert.equal(JSON.parse(app.store.get(STATE_KEY)).plans !== undefined, true, 'plans saved');
  });

  it('restore-backup-with-plans-keeps-them', () => {
    const app = createApp();
    const backup = {
      schemaVersion: 2, unit: 'KG', history: [], routines: [],
      exercises: [{ id: 'be', name: 'Bench', equipment: 'Barbell', primary: 'Chest', secondary: [], type: 'weight_reps' }],
      plans: {
        '2026-10-20': { routineId: 'rt_a', kind: 'routine', createdAt: 1 },
        '2026-10-21': { routineId: null, kind: 'rest', createdAt: 2 },
        'not-a-date': { routineId: 'x', kind: 'routine', createdAt: 3 },
        '2026-10-22': { routineId: '', kind: 'routine', createdAt: 4 }
      }
    };
    const res = app.api.validateBackupData(backup);
    assert.equal(res.ok, true);
    assert.equal(j(Object.keys(res.data.plans).sort()), j(['2026-10-20', '2026-10-21']), 'valid plans kept, garbage dropped');
    assert.equal(j(res.data.plans['2026-10-21']), j({ routineId: null, kind: 'rest', createdAt: 2 }));
    app.api.pendingRestore = res.data;
    app.api.confirmRestore();
    assert.equal(app.api.getPlan('2026-10-20').routineId, 'rt_a', 'plans survive a restore');
  });

  it('plans-are-a-load-normalised-optional-field', () => {
    const app = createApp();
    // A saved state written before P2-10 (no plans) still loads, and gains {}.
    const raw = JSON.parse(app.store.get(STATE_KEY));
    delete raw.plans;
    app.store.set(STATE_KEY, JSON.stringify(raw));
    const app2 = createApp({ store: app.store });
    assert.equal(j(app2.api.state.plans), '{}', 'missing plans -> {}');
    assert.equal(JSON.parse(app2.store.get(STATE_KEY)).plans !== undefined, true, 'normalised on load');

    // A dirty saved plans map is cleaned on load, not thrown away.
    raw.plans = { '2026-10-20': { routineId: 'rt_a', kind: 'routine', createdAt: 1 }, junk: { routineId: 'x' } };
    app.store.set(STATE_KEY, JSON.stringify(raw));
    const app3 = createApp({ store: app.store });
    assert.equal(j(Object.keys(app3.api.state.plans)), j(['2026-10-20']), 'invalid entries dropped on load');
  });
});

describe('P2-10 week planner (calendar, day sheet, copy week)', () => {
  // A past plan is written straight into state, exactly like a plan made
  // before its day passed (the UI refuses to create past plans).
  function seedPlan(app, day, routineId, kind) {
    app.api.state.plans[day] = { routineId: kind === 'rest' ? null : routineId, kind: kind || 'routine', createdAt: 1 };
  }

  it('plan-a-future-day-stores-one-plan', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    const day = '2030-06-20';
    assert.equal(app.api.savePlanForDay(day, 'rt_a'), true);
    assert.equal(app.api.state.plans[day].routineId, 'rt_a');
    assert.equal(app.api.state.plans[day].kind, 'routine');
    assert.equal(Object.keys(app.api.state.plans).length, 1, 'exactly one plan');
    // Re-planning the same day replaces it, never duplicates.
    app.api.savePlanForDay(day, 'rt_b');
    assert.equal(Object.keys(app.api.state.plans).length, 1);
    assert.equal(app.api.state.plans[day].routineId, 'rt_b');
    assert.equal(JSON.parse(app.store.get(STATE_KEY)).plans[day].routineId, 'rt_b', 'saved to storage');
    // Today and future only: a past day is refused.
    assert.equal(app.api.savePlanForDay('2020-01-01', 'rt_a'), false, 'past days cannot be planned');
    assert.equal(app.api.getPlan('2020-01-01'), null);
  });

  it('planned-day-is-not-counted-as-trained', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    const day = '2030-06-20';
    app.api.savePlanForDay(day, 'rt_a');
    app.api.showCalendarMonth(2030, 5);
    const grid = app.document.getElementById('calendarGrid').innerHTML;
    assert.ok(grid.includes('data-key="' + day + '"'), 'planned cell present');
    assert.ok(!grid.includes('cal-day-filled'), 'a plan alone never fills a day');
    assert.ok(grid.includes('openPlanDay(\'' + day + '\')'), 'an untrained day is tappable');
    const week = app.api.computePlanWeek(app.api.state.plans, app.api.state.history, Date.now(), 1);
    assert.equal(week.done, 0, 'never counted as done');
  });

  it('finishing-a-routine-on-its-planned-day-marks-it-done', () => {
    const app = createApp();
    const rtId = addRoutine(app, 'rt_only', 'Plan Push');
    const todayKey = app.api.todayPlanKey();
    assert.equal(app.api.savePlanForDay(todayKey, rtId), true, 'plan the routine for today');

    // The real finish flow: start the routine, tick its set, finish.
    app.api.startRoutineWorkout(rtId);
    app.api.updateSetVal(0, 0, 'weight', '100');
    app.api.updateSetVal(0, 0, 'reps', '5');
    app.api.toggleSetDone(0, 0);
    app.api.finishWorkout();

    const saved = app.api.state.history[0];
    assert.ok(saved, 'the workout was saved');
    assert.equal(saved.routineId, rtId, 'history carries the routineId');
    assert.equal(app.api.planStatus(app.api.getPlan(todayKey), app.api.state.history, todayKey, todayKey), 'done');
    assert.equal(app.api.computePlanWeek(app.api.state.plans, app.api.state.history, Date.now(), 1).done, 1);
  });

  it('other-routine-same-day-still-counts-when-plan-was-any', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    addRoutine(app, 'rt_b', 'Pull Day');
    const day = '2020-01-06';
    seedPlan(app, day, 'rt_a');
    // A different routine was finished that day: the day is trained/registered…
    app.api.state.history = [histEntry('w_other', ts(2020, 0, 6, 9), 'ex_rt_b', [loadSet(80, 5)], 'rt_b', 'Pull Day')];
    app.api.showCalendarMonth(2020, 0);
    const grid = app.document.getElementById('calendarGrid').innerHTML;
    assert.ok(grid.includes('cal-day-filled'), 'the day still fills (registered)');

    // …but the plan itself is not done, and the sheet says so.
    assert.equal(app.api.openPlanDay(day), true);
    const body = app.document.getElementById('calDayBody').innerHTML;
    assert.ok(body.includes('Planned Push Day'), 'plan label shown: ' + body);
    assert.ok(body.includes('did another workout'), 'explains the mismatch');
    assert.equal(app.api.computePlanWeek(app.api.state.plans, app.api.state.history, Date.now(), 1).done, 0, 'never counted done');
  });

  it('missed-past-plan-shows-grey-and-offers-move-delete', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    const past = '2020-01-08';
    seedPlan(app, past, 'rt_a');
    app.api.showCalendarMonth(2020, 0);
    const grid = app.document.getElementById('calendarGrid').innerHTML;
    assert.ok(grid.includes('data-key="' + past + '"'), 'past planned cell renders');
    assert.ok(!grid.includes('cal-day-filled'), 'a missed plan is not filled');
    assert.ok(grid.includes('cal-day-missed'), 'missed cell marked');

    assert.equal(app.api.openPlanDay(past), true);
    const body = app.document.getElementById('calDayBody').innerHTML;
    assert.ok(body.includes('Missed'), 'missed line: ' + body);
    assert.ok(body.includes('type="date"'), 'Move offers a date input');
    assert.ok(body.includes('movePlanFromInput('), 'offers Move');
    assert.ok(body.includes('deletePlan('), 'offers Delete');
    assert.ok(!body.includes('savePlanFromSelect('), 'no re-planning a past day');
    assert.ok(!body.includes('openPlanEditor('), 'no editing a past plan');
  });

  it('move-plan-to-another-day', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    const from = '2020-01-08';
    const to = '2030-06-21';
    seedPlan(app, from, 'rt_a');
    assert.equal(app.api.movePlan(from, to), true);
    assert.equal(app.api.getPlan(from), null, 'old day cleared');
    assert.equal(app.api.getPlan(to).routineId, 'rt_a', 'plan moved');

    // An occupied target day is refused: never overwritten.
    seedPlan(app, from, 'rt_a');
    app.api.savePlanForDay(to, 'rt_a');
    assert.equal(app.api.movePlan(from, to), false, 'target taken -> refused');
    assert.ok(app.api.getPlan(from), 'source untouched when the target is taken');
    assert.equal(app.alerts.length > 0, true, 'explains why: ' + app.alerts.join(' | '));

    // Never lands in the past.
    assert.equal(app.api.movePlan(from, '2020-02-02'), false, 'refuses a past target');
    assert.ok(app.api.getPlan(from), 'source still there');
  });

  it('delete-plan', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    const day = '2030-06-22';
    app.api.savePlanForDay(day, 'rt_a');
    assert.equal(app.api.deletePlan(day), true);
    assert.equal(app.api.getPlan(day), null, 'plan gone');
    assert.equal(Object.keys(app.api.state.plans).length, 0, 'no orphans');
    assert.equal(JSON.parse(app.store.get(STATE_KEY)).plans[day], undefined, 'removal saved');
    assert.equal(app.api.deletePlan(day), false, 'deleting nothing is a no-op');
  });

  it('copy-week-skips-days-that-already-have-a-plan', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    // "Today" is resolved from Date.now(), so build the week around it.
    const todayKey = app.api.todayPlanKey();
    const [y, m, d] = todayKey.split('-').map(Number);
    const monday = new Date(y, m - 1, d);
    monday.setDate(monday.getDate() - ((monday.getDay() - 1 + 7) % 7)); // Monday of this week
    const mondayKey = app.api.dayKeyLocal(monday.getTime());
    assert.equal(mondayKey, app.api.dayKeyLocal(app.api.startOfWeekMs(Date.now(), 1)), 'week start resolved');

    app.api.savePlanForDay(mondayKey, 'rt_a');
    const wed = new Date(monday.getTime()); wed.setDate(wed.getDate() + 2);
    const wedKey = app.api.dayKeyLocal(wed.getTime());
    app.api.savePlanForDay(wedKey, 'rt_a');

    // …a plan made before its day passed is seeded straight into state, so the
    // test never depends on which weekday it runs on.
    app.api.state.plans = {};
    seedPlan(app, mondayKey, 'rt_a');
    seedPlan(app, wedKey, 'rt_a');

    // Next Monday is already planned with something else -> never overwritten.
    const nextMon = new Date(monday.getTime()); nextMon.setDate(nextMon.getDate() + 7);
    const nextMonKey = app.api.dayKeyLocal(nextMon.getTime());
    seedPlan(app, nextMonKey, 'rt_other');

    assert.equal(app.api.copyWeekToNextWeek(), 1, 'only the free day was copied');
    assert.equal(app.api.getPlan(nextMonKey).routineId, 'rt_other', 'existing plan kept');
    const nextWed = new Date(wed.getTime()); nextWed.setDate(nextWed.getDate() + 7);
    assert.equal(app.api.getPlan(app.api.dayKeyLocal(nextWed.getTime())).routineId, 'rt_a', 'free day copied');
    const msg = app.document.getElementById('planCopyMsg').innerText;
    assert.ok(msg.includes('1 plan'), 'reports what was copied: ' + msg);

    // Running it again copies nothing (targets are taken now).
    assert.equal(app.api.copyWeekToNextWeek(), 0);
    assert.ok(app.document.getElementById('planCopyMsg').innerText.includes('Nothing to copy'), 'honest empty message');
  });

  it('plan-pointing-at-a-deleted-routine-shows-deleted-routine-and-can-be-deleted', () => {
    const app = createApp();
    const day = '2030-06-23';
    app.api.savePlanForDay(day, 'rt_ghost');
    assert.equal(app.api.planLabel(app.api.getPlan(day), app.api.state.routines), 'Deleted routine');
    assert.equal(app.api.openPlanDay(day), true, 'sheet opens without crashing');
    const body = app.document.getElementById('calDayBody').innerHTML;
    assert.ok(body.includes('Deleted routine'), 'honest label');
    assert.ok(body.includes('deletePlan('), 'still deletable');
    assert.equal(app.api.deletePlan(day), true);
    assert.equal(app.api.getPlan(day), null);
  });

  it('rest-day-plan-is-never-missed-shows-as-rest-day', () => {
    const app = createApp();
    const day = '2030-06-24';
    assert.equal(app.api.saveRestPlanForDay(day), true);
    assert.equal(app.api.getPlan(day).kind, 'rest');
    assert.equal(app.api.getPlan(day).routineId, null);
    assert.equal(app.api.openPlanDay(day), true);
    const body = app.document.getElementById('calDayBody').innerHTML;
    assert.ok(body.includes('Rest day'), 'rest line: ' + body);
    assert.ok(!body.includes('Missed'), 'never missed');

    // A past rest plan stays 'planned' too.
    const past = '2020-01-09';
    seedPlan(app, past, null, 'rest');
    assert.equal(app.api.openPlanDay(past), true);
    assert.ok(app.document.getElementById('calDayBody').innerHTML.includes('Rest day'));
    assert.ok(!app.document.getElementById('calDayBody').innerHTML.includes('Missed'));
  });

  it('consistency-line-adds-planned-and-done', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    const now = Date.now();
    const todayKey = app.api.todayPlanKey();
    app.api.savePlanForDay(todayKey, 'rt_a');
    app.api.state.history = [histEntry('w1', now, 'ex_rt_a', [loadSet(100, 5)], 'rt_a', 'Push Day')];
    app.api.renderTrainingCalendar();
    const line = app.document.getElementById('calendarConsistency').innerHTML;
    assert.ok(line.includes('This week 1'), 'existing text kept: ' + line);
    assert.ok(line.includes('Streak'), 'existing text kept');
    assert.ok(line.includes('Planned this week 1, done 1'), 'append: ' + line);
  });

  it('day-sheet-handlers-compile-and-select-never-rebuilds-the-screen', () => {
    const app = createApp();
    addRoutine(app, 'rt_a', 'Push Day');
    const day = '2030-06-25';
    app.api.state.history = [histEntry('w1', ts(2030, 5, 25, 9), 'ex_rt_a', [loadSet(100, 5)], 'rt_a', 'Push Day')];
    app.api.savePlanForDay(day, 'rt_a');
    app.api.openCalendarDay(day);
    let n = 0;
    ['calDayBody'].forEach(id => {
      const html = app.document.getElementById(id).innerHTML || '';
      [...html.matchAll(/onclick="([^"]+)"/g)].forEach(m => { new Function(m[1]); n++; });
    });
    assert.ok(n >= 2, 'plan + workout handlers checked: ' + n);

    // The routine <select> is a change control, never a rebuild-on-typing input.
    app.api.openPlanEditor(day);
    const edit = app.document.getElementById('calDayBody').innerHTML;
    assert.ok(edit.includes('id="planRoutineSelect"'), 'select rendered');
    assert.ok(edit.includes('max-width:100%'), 'capped width');
    assert.ok(!edit.includes('oninput='), 'no oninput handler');
    assert.ok(edit.includes('<option value="rest"'), 'Rest day option');
    assert.equal(app.api.planEditKey, day, 'editing that day');

    app.document.getElementById('planRoutineSelect').value = 'rest';
    assert.equal(app.api.savePlanFromSelect(day), true, 'save from the select');
    assert.equal(app.api.getPlan(day).kind, 'rest');
    assert.equal(app.api.planEditKey, null, 'edit flag cleared after saving');
  });
});

// The day sheet is opened through the calendar tap path, exactly like a phone.

describe('P2-10 week planner (Today card on the Workout tab)', () => {
  it('today-plan-card-names-the-plan-and-starts-it', () => {
    const app = createApp();
    const rtId = addRoutine(app, 'rt_card', 'Card Day');
    const todayKey = app.api.todayPlanKey();

    // No plan -> no card at all.
    app.api.renderRoutines();
    assert.equal(app.document.getElementById('todayPlanCard').innerHTML, '', 'empty without a plan');

    app.api.savePlanForDay(todayKey, rtId);
    app.api.renderRoutines();
    let html = app.document.getElementById('todayPlanCard').innerHTML;
    assert.ok(html.includes('Today: Card Day'), 'names the plan: ' + html);
    assert.ok(html.includes('startTodayPlanWorkout()'), 'one-tap Start');
    assert.ok(html.includes('max-width:412px'), 'card capped at 412px');
    [...html.matchAll(/onclick="([^"]+)"/g)].forEach(m => new Function(m[1]));

    // Start actually begins that routine (the real logger path).
    assert.equal(app.api.startTodayPlanWorkout(), true);
    assert.equal(app.api.activeWorkout.routineId, rtId, 'the planned routine is live');
    app.api.discardWorkout();

    // Finishing it turns the card into a done card.
    app.api.startTodayPlanWorkout();
    app.api.updateSetVal(0, 0, 'weight', '90');
    app.api.updateSetVal(0, 0, 'reps', '6');
    app.api.toggleSetDone(0, 0);
    app.api.finishWorkout();
    app.api.renderRoutines();
    html = app.document.getElementById('todayPlanCard').innerHTML;
    assert.ok(html.includes('done'), 'done card: ' + html);
    assert.ok(!html.includes('startTodayPlanWorkout()'), 'no Start once done');
  });

  it('today-card-rest-day-and-deleted-routine', () => {
    const app = createApp();
    const todayKey = app.api.todayPlanKey();
    app.api.saveRestPlanForDay(todayKey);
    app.api.renderRoutines();
    let html = app.document.getElementById('todayPlanCard').innerHTML;
    assert.ok(html.includes('Today: Rest day'), 'rest card: ' + html);
    assert.ok(!html.includes('startTodayPlanWorkout()'), 'nothing to start on a rest day');

    // A plan pointing at a deleted routine: honest copy, no Start button.
    app.api.state.plans[todayKey] = { routineId: 'rt_gone', kind: 'routine', createdAt: 1 };
    app.api.renderRoutines();
    html = app.document.getElementById('todayPlanCard').innerHTML;
    assert.ok(html.includes('Today: Deleted routine'), 'honest label: ' + html);
    assert.ok(!html.includes('startTodayPlanWorkout()'), 'no Start for a missing routine');
  });

  it('switch-to-workout-tab-refreshes-the-today-card', () => {
    const app = createApp();
    const rtId = addRoutine(app, 'rt_switch', 'Switch Day');
    const todayKey = app.api.todayPlanKey();
    app.api.savePlanForDay(todayKey, rtId);
    // Clear the card, then prove that switching tabs re-renders it.
    app.document.getElementById('todayPlanCard').innerHTML = '';
    app.api.switchTab('workout', app.document.querySelectorAll('.nav-item')[0]);
    const html = app.document.getElementById('todayPlanCard').innerHTML;
    assert.ok(html.includes('Today: Switch Day'), 'card survives an open app: ' + html);
  });
});
