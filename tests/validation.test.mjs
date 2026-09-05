import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../lib/training.ts';
import { validState } from '../lib/validation.ts';
test('valid demo and empty personal records are accepted', () => {
  assert.equal(validState(seed('2026-09-05')), true);
  assert.equal(validState(seed('2026-09-05', false)), true);
});
test('malformed payloads never throw and are rejected', () => {
  for (const x of [null, {}, [], { schema: 1 }, 'text'])
    assert.equal(validState(x), false);
});
test('invalid dates, duplicate logs and impossible values are rejected', () => {
  const s = seed('2026-09-05');
  s.workouts[0].date = '2026-02-31';
  assert.equal(validState(s), false);
  s.workouts[0].date = '2026-08-31';
  s.logs.push(s.logs[0]);
  assert.equal(validState(s), false);
});
test('exclusion flags must match conditions', () => {
  const s = seed('2026-09-05');
  s.checkins[0].tags = ['感冒'];
  assert.equal(validState(s), false);
  s.checkins[0].exclusion_flag = true;
  assert.equal(validState(s), true);
});
test('zero running pace is rejected to prevent invalid generated distance', () => {
  const s = seed('2026-09-05');
  s.settings.runPace = '0:00';
  assert.equal(validState(s), false);
});
