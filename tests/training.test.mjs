import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  seed,
  cns,
  acwr,
  metrics,
  conflict,
  generateWeek,
  dayKey,
  addDays,
  muscleLoads,
} from '../lib/training.ts';
const today = '2026-09-05';
test('today soreness raises related rolling muscle load', () => {
  const s = seed(today);
  const before = muscleLoads(s.logs, today, s.checkins);
  s.checkins.find((c) => c.date === today).soreness = ['下肢'];
  const after = muscleLoads(s.logs, today, s.checkins);
  assert.ok(after[1] > before[1]);
  assert.equal(after[0], before[0]);
});
test('CNS requires seven historical days and guards zero standard deviation', () => {
  assert.equal(cns([60, 61], 60).ready, false);
  assert.ok(Number.isFinite(cns(Array(30).fill(60), 59).z));
  assert.equal(cns(Array(7).fill(60), 57).level, '高負荷');
});
test('ACWR compares normalized daily averages', () => {
  const logs = Array.from({ length: 28 }, (_, i) => ({
    date: addDays(today, -i),
    minutes: 40,
    zone: 2,
  }));
  assert.equal(acwr(logs, today).value, 1);
  assert.equal(acwr([], today).value, null);
  assert.equal(acwr(logs, today).ready, true);
});
test('future logs never enter acute load', () => {
  const logs = [
    { date: today, minutes: 20, zone: 2 },
    { date: addDays(today, 1), minutes: 999, zone: 5 },
  ];
  assert.equal(acwr(logs, today).acute, 40 / 7);
});
test('flagged dates are excluded from attribution loads', () => {
  const logs = [
    {
      id: 'today',
      planId: 'today-plan',
      date: today,
      sport: 'Run',
      minutes: 40,
      distance: 8,
      zone: 2,
      rpe: 5,
      fatigue: 2,
      soreness: [],
      note: '',
    },
    {
      id: 'yesterday',
      planId: 'yesterday-plan',
      date: addDays(today, -1),
      sport: 'Run',
      minutes: 20,
      distance: 4,
      zone: 2,
      rpe: 5,
      fatigue: 2,
      soreness: [],
      note: '',
    },
  ];
  const checkins = [
    {
      date: today,
      soreness: [],
      tags: ['感冒'],
      note: '',
      exclusion_flag: true,
    },
  ];
  const attributedRatio = acwr(logs, today, {
    checkins,
    excludeFlagged: true,
  });
  assert.equal(attributedRatio.acute, 40 / 7);
  assert.equal(attributedRatio.chronic, 40 / 28);
  assert.deepEqual(
    muscleLoads(logs, today, checkins),
    muscleLoads([logs[1]], today, checkins),
  );
});
test('exclusion flag preserves current recovery score', () => {
  const s = seed(today),
    before = metrics(s, today).score;
  s.checkins.find((c) => c.date === today).exclusion_flag = true;
  assert.equal(metrics(s, today).score, before);
});
test('readiness stays within 0 to 100 and empty data stays provisional', () => {
  const s = seed(today, false);
  assert.equal(metrics(s, today).ready, false);
  for (const hrv of [1, 30, 70, 250]) {
    const d = seed(today);
    d.checkins.find((c) => c.date === today).hrv = hrv;
    const m = metrics(d, today);
    assert.ok(m.score >= 0 && m.score <= 100);
  }
});
test('conflict calculation never edits user plans', () => {
  const s = seed(today);
  s.checkins.find((c) => c.date === today).hrv = 20;
  const original = JSON.stringify(s.workouts);
  assert.ok(
    ['中度', '嚴重'].includes(
      conflict(
        s,
        s.workouts.find((w) => w.date === today),
        today,
      ).severity,
    ),
  );
  assert.equal(JSON.stringify(s.workouts), original);
});
test('conflict reason follows the strongest normalized cause', () => {
  const s = seed(today, false);
  s.logs = [
    { date: today, minutes: 40 },
    { date: addDays(today, -7), minutes: 20 },
    { date: addDays(today, -14), minutes: 20 },
    { date: addDays(today, -21), minutes: 20 },
  ].map((log, i) => ({
    id: `log-${i}`,
    planId: `plan-${i}`,
    sport: 'Run',
    distance: 0,
    zone: 2,
    rpe: 5,
    fatigue: 2,
    soreness: [],
    note: '',
    ...log,
  }));
  s.checkins = [
    ...Array.from({ length: 7 }, (_, i) => ({
      date: addDays(today, -i - 1),
      hrv: 60,
      soreness: [],
      tags: [],
      note: '',
      exclusion_flag: false,
    })),
    {
      date: today,
      hrv: 58.5,
      soreness: [],
      tags: [],
      note: '',
      exclusion_flag: false,
    },
  ];
  const result = conflict(
    s,
    {
      id: 'workout',
      date: today,
      time: '07:00',
      sport: 'Run',
      title: 'Test run',
      minutes: 40,
      distance: 8,
      zone: 3,
      version: 1,
    },
    today,
  );
  assert.equal(result.relevant, 2);
  assert.match(result.reason, /肌群/);
  assert.doesNotMatch(result.reason, /HRV/);
});
test('injuries override training capability', () => {
  const s = seed(today);
  s.injuries = [
    {
      id: 'i',
      part: '下肢',
      note: 'test',
      excluded: ['Run'],
      updatedAt: today,
    },
  ];
  const w = s.workouts.find((w) => w.sport === 'Run');
  assert.equal(conflict(s, w, today).restricted, true);
  assert.equal(conflict(s, w, today).sport, 'Rest');
  s.settings.days = [0, 1, 2, 3, 4, 5, 6];
  assert.ok(
    generateWeek(s, '2026-09-07', today).every((w) => w.sport !== 'Run'),
  );
});
test('generator respects duration, available sports and consecutive-day ceiling', () => {
  const s = seed(today, false);
  s.settings.days = [0, 1, 2, 3, 4, 5, 6];
  s.settings.equipment = ['Bike'];
  s.settings.maxMinutes = 30;
  s.settings.consecutive = 2;
  const ws = generateWeek(s, '2026-09-07', today);
  assert.equal(ws.length, 7);
  assert.ok(
    ws.every((w) => w.minutes <= 30 && ['Bike', 'Rest'].includes(w.sport)),
  );
  assert.equal(ws[2].sport, 'Rest');
});
test('unknown ability baselines do not fabricate a running distance', () => {
  const s = seed(today, false);
  s.settings.days = [1, 2, 3, 4, 5, 6, 0];
  s.settings.equipment = ['Run'];
  s.settings.baselinesKnown = false;
  const run = generateWeek(s, today, today).find((w) => w.sport === 'Run');
  assert.equal(run.distance, 0);
});
test('no equipment yields rest rather than an impossible workout', () => {
  const s = seed(today, false);
  s.settings.equipment = [];
  assert.ok(
    generateWeek(s, '2026-09-07', today).every((w) => w.sport === 'Rest'),
  );
});
test('date arithmetic survives month boundaries', () => {
  assert.equal(addDays('2026-08-31', 1), '2026-09-01');
  assert.equal(dayKey(new Date(2026, 8, 5, 12)), '2026-09-05');
});
