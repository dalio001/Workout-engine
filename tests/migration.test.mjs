// tests/migration.test.mjs — versioned legacy migration on the REAL app code.
// 4. Old state without schemaVersion (KG and LBS) migrates correctly;
//    backup key created once and never overwritten.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, STATE_KEY, DRAFT_KEY, BACKUP_V1_KEY } from './harness.mjs';

function legacyState(unit, weight) {
  const s = {
    unit,
    defaultRest: 90,
    exercises: [{ id: 'ex1', name: 'Bench Press (Barbell)', muscle: 'Chest' }],
    routines: [],
    history: [{
      id: 'wk_old', title: 'Old', date: 1700000000000, durationSec: 3600,
      totalVolume: 999, totalSets: 1,
      exercises: [{ exId: 'ex1', sets: [{ weight, reps: 5 }] }],
    }],
  };
  if (unit === undefined) delete s.unit;
  return s;
}

describe('migration v1 -> v2', () => {
  it('LBS legacy 225 migrates to 102.06 kg and volume is recomputed', () => {
    const store = new Map();
    const raw = JSON.stringify(legacyState('LBS', 225));
    store.set(STATE_KEY, raw);
    const app = createApp({ store });
    assert.equal(app.api.state.schemaVersion, 2, 'stamped v2');
    assert.equal(app.api.state.history[0].exercises[0].sets[0].weight, 102.06);
    assert.equal(app.api.state.history[0].totalVolume, 510.3, 'volume recomputed in kg');
    assert.equal(store.get(BACKUP_V1_KEY), raw, 'untouched original preserved');
  });

  it('KG legacy 100 stays 100', () => {
    const store = new Map();
    store.set(STATE_KEY, JSON.stringify(legacyState('KG', 100)));
    const app = createApp({ store });
    assert.equal(app.api.state.history[0].exercises[0].sets[0].weight, 100);
    assert.equal(app.api.state.schemaVersion, 2);
  });

  it('missing unit defaults to KG', () => {
    const store = new Map();
    store.set(STATE_KEY, JSON.stringify(legacyState(undefined, 60)));
    const app = createApp({ store });
    assert.equal(app.api.state.history[0].exercises[0].sets[0].weight, 60);
    assert.equal(app.api.state.unit, 'KG');
  });

  it('live draft migrates with the same saved unit', () => {
    const store = new Map();
    store.set(STATE_KEY, JSON.stringify(legacyState('LBS', 225)));
    store.set(DRAFT_KEY, JSON.stringify({
      title: 'Old session', startTime: Date.now() - 60000,
      exercises: [{ exId: 'ex1', sets: [{ type: 'N', weight: 225, reps: 5, done: true }] }],
      restDeadline: null,
    }));
    const app = createApp({ store });
    const draft = app.api.loadActiveSessionDraft();
    assert.ok(draft, 'draft still loads');
    assert.equal(draft.exercises[0].sets[0].weight, 102.06, 'draft weight migrated');
    assert.equal(draft.exercises[0].sets[0].done, true, 'draft done flag kept');
  });

  it('backup key is created once and never overwritten', () => {
    const store = new Map();
    const first = JSON.stringify(legacyState('LBS', 225));
    store.set(STATE_KEY, first);
    createApp({ store });
    assert.equal(store.get(BACKUP_V1_KEY), first, 'backup created');

    // A second legacy save must not replace the first backup.
    store.set(STATE_KEY, JSON.stringify(legacyState('KG', 999)));
    createApp({ store });
    assert.equal(store.get(BACKUP_V1_KEY), first, 'backup not overwritten on second run');
  });
});
