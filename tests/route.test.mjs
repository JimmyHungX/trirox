import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  routeDistanceKm,
  routeSegmentKm,
  shouldRecordRoutePoint,
} from '../lib/route.ts';

const start = {
  lat: 25.033,
  lng: 121.5654,
  accuracy: 8,
  timestamp: 1000,
};

test('route distance follows consecutive GPS points', () => {
  const middle = { ...start, lng: 121.5664, timestamp: 2000 };
  const end = { ...start, lng: 121.5674, timestamp: 3000 };
  const segment = routeSegmentKm(start, middle);
  assert.ok(segment > 0.09 && segment < 0.11);
  assert.ok(
    Math.abs(routeDistanceKm([start, middle, end]) - segment * 2) < 0.001,
  );
});

test('route recording rejects weak, stale and tiny GPS changes', () => {
  assert.equal(
    shouldRecordRoutePoint(undefined, { ...start, accuracy: 61 }),
    false,
  );
  assert.equal(
    shouldRecordRoutePoint(start, { ...start, timestamp: 999 }),
    false,
  );
  assert.equal(
    shouldRecordRoutePoint(start, {
      ...start,
      lng: start.lng + 0.000001,
      timestamp: 2000,
    }),
    false,
  );
  assert.equal(
    shouldRecordRoutePoint(start, {
      ...start,
      lng: start.lng + 0.001,
      timestamp: 2000,
    }),
    true,
  );
});
