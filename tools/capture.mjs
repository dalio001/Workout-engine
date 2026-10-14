#!/usr/bin/env node
/**
 * Capture before screenshots for P0-02 session recovery.
 * Opens index.html in Chrome at 390x844, seeds realistic history,
 * and saves 3 screenshots to shots/before/.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve('E:/My Apps/workout-worktrees/p0-02');
const INDEX_HTML = path.join(PROJECT_ROOT, 'index.html');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'shots', 'before');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9223; // Different from any existing Chrome
const USER_DATA_DIR = path.join(PROJECT_ROOT, '.chrome-profile-capture');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function launchChrome() {
  return new Promise((resolve, reject) => {
    const args = [
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--headless=new',
      `--window-size=390,844`,
      `--force-device-scale-factor=2`,
      INDEX_HTML
    ];
    const proc = spawn(CHROME_PATH, args, { detached: false, stdio: 'ignore' });
    proc.on('error', reject);
    setTimeout(() => resolve(proc), 3000);
  });
}

let wsCache = null;
function connectWS() {
  return new Promise((resolve, reject) => {
    if (wsCache && wsCache.readyState === 1) return resolve(wsCache);
    wsCache = new WebSocket(`ws://localhost:${DEBUG_PORT}/devtools/browser`);
    wsCache.addEventListener('open', () => resolve(wsCache));
    wsCache.addEventListener('error', reject);
  });
}

async function sendCDP(cmd) {
  const ws = await connectWS();
  return new Promise((resolve, reject) => {
    const id = Math.random();
    ws.send(JSON.stringify({ id, ...cmd }));
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
  });
}

async function getTarget() {
  const res = await sendCDP({ method: 'Target.getTargets' });
  const page = res.targetInfos.find(t => t.type === 'page' && t.url.includes('index.html'));
  if (!page) throw new Error('Page target not found');
  return page.targetId;
}

async function attachSession(targetId) {
  const res = await sendCDP({ method: 'Target.attachToTarget', params: { targetId, flatten: true } });
  return res.sessionId;
}

async function sendSession(sessionId, method, params = {}) {
  return sendCDP({ method: 'Target.sendMessageToTarget', params: { sessionId, message: JSON.stringify({ id: Math.random(), method, params }) } });
}

async function seedHistory() {
  const targetId = await getTarget();
  const sessionId = await attachSession(targetId);

  await sendSession(sessionId, 'Runtime.enable');

  const now = Date.now();
  const oneDay = 86400000;
  const DEFAULT_EXERCISES = [
    { id: 'ex1', name: 'Bench Press (Barbell)', muscle: 'Chest' },
    { id: 'ex2', name: 'Incline Dumbbell Press', muscle: 'Chest' },
    { id: 'ex3', name: 'Chest Fly (Cable)', muscle: 'Chest' },
    { id: 'ex4', name: 'Lat Pulldown (Cable)', muscle: 'Back' },
    { id: 'ex5', name: 'Bent Over Row (Barbell)', muscle: 'Back' },
    { id: 'ex6', name: 'Seated Cable Row', muscle: 'Back' },
    { id: 'ex7', name: 'Squat (Barbell)', muscle: 'Legs' },
    { id: 'ex8', name: 'Romanian Deadlift (Barbell)', muscle: 'Legs' },
    { id: 'ex9', name: 'Leg Press (Machine)', muscle: 'Legs' },
    { id: 'ex10', name: 'Leg Curl (Machine)', muscle: 'Legs' },
    { id: 'ex11', name: 'Overhead Press (Barbell)', muscle: 'Shoulders' },
    { id: 'ex12', name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders' },
    { id: 'ex13', name: 'Bicep Curl (Dumbbell)', muscle: 'Arms' },
    { id: 'ex14', name: 'Tricep Rope Pushdown', muscle: 'Arms' },
    { id: 'ex15', name: 'Hanging Leg Raise', muscle: 'Core' }
  ];

  const history = [];
  const routineTemplates = [
    { name: 'Push (Chest, Shoulders, Triceps)', exIds: ['ex1','ex2','ex11','ex12','ex14'], baseWeights: [80, 22, 50, 12, 35] },
    { name: 'Pull (Back, Biceps)', exIds: ['ex4','ex5','ex6','ex13'], baseWeights: [70, 60, 55, 16] },
    { name: 'Legs (Quads, Hamstrings, Abs)', exIds: ['ex7','ex8','ex9','ex10','ex15'], baseWeights: [100, 90, 140, 50, 0] }
  ];

  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 3; day++) {
      const template = routineTemplates[(week * 3 + day) % 3];
      const date = now - (27 - week * 7 - day * 2) * oneDay;
      const exercises = template.exIds.map((exId, i) => {
        const sets = 3;
        const baseWeight = template.baseWeights[i];
        const progression = week * 2.5 + day * 0.5;
        return {
          exId,
          sets: Array.from({ length: sets }, (_, s) => ({
            type: 'N',
            weight: baseWeight > 0 ? Math.round(baseWeight + progression + (s * 2.5)) : 0,
            reps: Math.max(6, 12 - s - week),
            done: true
          }))
        };
      });
      const totalVolume = exercises.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0);
      const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
      const durationSec = 45 * 60 + Math.floor(Math.random() * 15 * 60);
      history.push({
        id: `wk_${date}_${day}`,
        title: template.name,
        date,
        durationSec,
        totalVolume: Math.round(totalVolume),
        totalSets,
        prCount: 0,
        exercises
      });
    }
  }

  const state = {
    unit: 'KG',
    defaultRest: 90,
    exercises: DEFAULT_EXERCISES,
    routines: [
      { id: 'rt1', name: 'Push (Chest, Shoulders, Triceps)', exercises: [{ exId: 'ex1', sets: 3 }, { exId: 'ex2', sets: 3 }, { exId: 'ex11', sets: 3 }, { exId: 'ex12', sets: 3 }, { exId: 'ex14', sets: 3 }] },
      { id: 'rt2', name: 'Pull (Back, Biceps)', exercises: [{ exId: 'ex4', sets: 3 }, { exId: 'ex5', sets: 3 }, { exId: 'ex6', sets: 3 }, { exId: 'ex13', sets: 3 }] },
      { id: 'rt3', name: 'Legs (Quads, Hamstrings, Abs)', exercises: [{ exId: 'ex7', sets: 3 }, { exId: 'ex8', sets: 3 }, { exId: 'ex9', sets: 3 }, { exId: 'ex10', sets: 3 }, { exId: 'ex15', sets: 3 }] }
    ],
    history
  };

  await sendSession(sessionId, 'Runtime.evaluate', {
    expression: `localStorage.setItem('hevy_clone_state', ${JSON.stringify(JSON.stringify(state))}); location.reload();`,
    awaitPromise: true
  });

  await sleep(1500);
}

async function screenshot(name) {
  const targetId = await getTarget();
  const sessionId = await attachSession(targetId);
  const res = await sendSession(sessionId, 'Page.captureScreenshot', { format: 'png', fromSurface: true });
  const buffer = Buffer.from(res.data, 'base64');
  const outPath = path.join(OUTPUT_DIR, `${name}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`Saved: ${outPath}`);
}

async function click(selector) {
  const targetId = await getTarget();
  const sessionId = await attachSession(targetId);
  await sendSession(sessionId, 'Runtime.evaluate', {
    expression: `document.querySelector('${selector}').click();`
  });
}

async function waitForSelector(selector, timeout = 10000) {
  const targetId = await getTarget();
  const sessionId = await attachSession(targetId);
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await sendSession(sessionId, 'Runtime.evaluate', {
      expression: `!!document.querySelector('${selector}')`
    });
    if (res.result.value) return true;
    await sleep(100);
  }
  throw new Error(`Timeout waiting for ${selector}`);
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('Output dir:', OUTPUT_DIR);

  const chrome = await launchChrome();
  console.log('Chrome launched on port', DEBUG_PORT);

  try {
    await sleep(4000); // wait for page load

    // 1. Seed history first
    console.log('Seeding history...');
    await seedHistory();
    await sleep(2000);

    // 2. Screenshot 1: Workout tab
    console.log('Screenshot 1: Workout tab');
    await screenshot('01-workout-tab');

    // 3. Start a routine workout (Push routine - first card)
    console.log('Starting routine workout...');
    await click('.card button[onclick*="startRoutineWorkout"]');
    await waitForSelector('#activeWorkoutDrawer.open');
    await sleep(500);

    // 4. Tick 3 sets (first exercise, first 3 sets)
    console.log('Ticking 3 sets...');
    for (let i = 0; i < 3; i++) {
      const targetId = await getTarget();
      const sessionId = await attachSession(targetId);
      await sendSession(sessionId, 'Runtime.evaluate', {
        expression: `document.querySelectorAll('.check-btn')[${i}].click();`
      });
      await sleep(300);
    }

    // 5. Screenshot 2: Routine workout in progress with 3 sets ticked
    console.log('Screenshot 2: Workout in progress');
    await screenshot('02-workout-in-progress');

    // 6. Reload the page
    console.log('Reloading page...');
    const targetId = await getTarget();
    const sessionId = await attachSession(targetId);
    await sendSession(sessionId, 'Page.reload');
    await sleep(2000);

    // 7. Screenshot 3: After reload (workout should be gone)
    console.log('Screenshot 3: After reload');
    await screenshot('03-after-reload');

  } finally {
    chrome.kill();
  }

  console.log('\n✅ All before screenshots captured to:', OUTPUT_DIR);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});