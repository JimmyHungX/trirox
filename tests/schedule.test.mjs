import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveWorkoutToSlot, orderedWorkouts } from '../lib/schedule.ts';

const workouts = [
  { id: 'a', date: '2026-09-06', time: '07:00', version: 1 },
  { id: 'b', date: '2026-09-06', time: '12:00', version: 1 },
  { id: 'c', date: '2026-09-07', time: '18:00', version: 1 },
];

test('moving a workout can insert between two workouts on another day', () => {
  const result = moveWorkoutToSlot(workouts, 'c', '2026-09-06', 1);
  assert.equal(result.changed, true);
  assert.deepEqual(
    orderedWorkouts(
      result.workouts.filter((workout) => workout.date === '2026-09-06'),
    ).map((workout) => workout.id),
    ['a', 'c', 'b'],
  );
  assert.equal(
    result.workouts.find((workout) => workout.id === 'c').version,
    2,
  );
});

test('moving within one day preserves the selected insertion point', () => {
  const sameDay = workouts.map((workout) => ({
    ...workout,
    date: '2026-09-06',
  }));
  const result = moveWorkoutToSlot(sameDay, 'a', '2026-09-06', 2);
  assert.deepEqual(
    orderedWorkouts(result.workouts).map((workout) => workout.id),
    ['b', 'a', 'c'],
  );
});

test('dropping next to the original position is a no-op', () => {
  const result = moveWorkoutToSlot(workouts, 'a', '2026-09-06', 1);
  assert.equal(result.changed, false);
  assert.equal(result.workouts, workouts);
});
