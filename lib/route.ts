export type RoutePoint = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

export type GpsStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'paused'
  | 'denied'
  | 'unavailable'
  | 'error';

const earthRadiusKm = 6371;

export function routeSegmentKm(a: RoutePoint, b: RoutePoint) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitude = radians(b.lat - a.lat);
  const longitude = radians(b.lng - a.lng);
  const start = radians(a.lat);
  const end = radians(b.lat);
  const value =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(start) * Math.cos(end) * Math.sin(longitude / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function routeDistanceKm(points: RoutePoint[]) {
  return points.slice(1).reduce((total, point, index) => {
    return total + routeSegmentKm(points[index], point);
  }, 0);
}

export function shouldRecordRoutePoint(
  previous: RoutePoint | undefined,
  next: RoutePoint,
) {
  if (next.accuracy > 60) return false;
  if (!previous) return true;
  if (next.timestamp <= previous.timestamp) return false;
  return routeSegmentKm(previous, next) >= 0.003;
}
