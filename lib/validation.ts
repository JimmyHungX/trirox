import type { AppState } from './training';
const text = (v: unknown, max = 1000) =>
  typeof v === 'string' && v.length <= max;
const num = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const date = (v: unknown) =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) === v;
const sport = (v: unknown) =>
  ['Run', 'Bike', 'Swim', 'HYROX', 'Rest'].includes(v as string);
const body = (v: unknown) =>
  Array.isArray(v) && v.every((x) => ['上肢', '下肢', '核心'].includes(x));
const id = (v: unknown) => text(v, 100) && String(v).length > 0;
const optional = (v: unknown, min: number, max: number) =>
  v === undefined || num(v, min, max);
const pace = (v: unknown) =>
  typeof v === 'string' &&
  /^\d{1,2}:[0-5]\d$/.test(v) &&
  v !== '0:00' &&
  v !== '00:00';
const unique = (values: unknown[]) => new Set(values).size === values.length;
export function validState(input: unknown): input is AppState {
  try {
    const s = input as AppState;
    if (
      !s ||
      s.schema !== 1 ||
      typeof s.demo !== 'boolean' ||
      (s.onboardingDismissed !== undefined &&
        typeof s.onboardingDismissed !== 'boolean') ||
      !text(s.user.name, 80) ||
      !s.user.name.trim() ||
      !num(s.user.height, 80, 250) ||
      !num(s.user.weight, 20, 350) ||
      !text(s.user.experience, 100)
    )
      return false;
    const t = s.settings;
    if (
      !Array.isArray(t.days) ||
      !t.days.every((d) => Number.isInteger(d) && num(d, 0, 6)) ||
      !Array.isArray(t.equipment) ||
      !t.equipment.every(sport) ||
      !text(t.time, 5) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time) ||
      !num(t.maxMinutes, 15, 240) ||
      !num(t.ftp, 30, 600) ||
      !pace(t.runPace) ||
      !pace(t.swimPace) ||
      (t.baselinesKnown !== undefined &&
        typeof t.baselinesKnown !== 'boolean') ||
      !text(t.level, 50) ||
      !num(t.conservative, 0, 100) ||
      !sport(t.protect) ||
      !num(t.consecutive, 1, 7) ||
      !['km', 'mi'].includes(t.units) ||
      !t.notifications ||
      !Object.values(t.notifications).every((v) => typeof v === 'boolean')
    )
      return false;
    if (
      ![s.workouts, s.logs, s.checkins, s.races, s.injuries, s.decisions].every(
        Array.isArray,
      )
    )
      return false;
    if (
      ![s.workouts, s.logs, s.races, s.injuries].every((xs) =>
        unique(xs.map((x) => x.id)),
      ) ||
      !unique(s.checkins.map((c) => c.date)) ||
      !unique(s.logs.map((c) => c.planId))
    )
      return false;
    if (
      !s.workouts.every(
        (w) =>
          id(w.id) &&
          date(w.date) &&
          text(w.time, 5) &&
          /^([01]\d|2[0-3]):[0-5]\d$/.test(w.time) &&
          sport(w.sport) &&
          text(w.title, 100) &&
          w.title.trim() &&
          num(w.minutes, 0, 1440) &&
          num(w.distance, 0, 500) &&
          Number.isInteger(w.zone) &&
          num(w.zone, 1, 5) &&
          Number.isInteger(w.version) &&
          w.version >= 1,
      )
    )
      return false;
    if (
      !s.logs.every(
        (l) =>
          id(l.id) &&
          id(l.planId) &&
          date(l.date) &&
          sport(l.sport) &&
          num(l.minutes, 1, 1440) &&
          num(l.distance, 0, 500) &&
          num(l.zone, 1, 5) &&
          Number.isInteger(l.zone) &&
          num(l.rpe, 1, 10) &&
          num(l.fatigue, 1, 5) &&
          body(l.soreness) &&
          optional(l.heartRate, 30, 250) &&
          text(l.note),
      )
    )
      return false;
    if (
      !s.checkins.every(
        (c) =>
          date(c.date) &&
          optional(c.sleep, 0, 24) &&
          optional(c.quality, 1, 5) &&
          optional(c.fatigue, 1, 5) &&
          optional(c.hrv, 1, 300) &&
          optional(c.weight, 20, 350) &&
          body(c.soreness) &&
          Array.isArray(c.tags) &&
          c.tags.every((t) => text(t, 100)) &&
          text(c.note) &&
          c.exclusion_flag === Boolean(c.tags.length || c.note.trim()),
      )
    )
      return false;
    if (
      !s.races.every(
        (r) =>
          id(r.id) &&
          text(r.name, 100) &&
          r.name.trim() &&
          ['HYROX', 'Marathon', 'Triathlon'].includes(r.type) &&
          date(r.date) &&
          text(r.target, 12) &&
          /^[0-9]{1,2}:[0-5][0-9]:[0-5][0-9]$/.test(r.target) &&
          text(r.location, 150) &&
          num(r.priority, 1, 3) &&
          typeof r.completed === 'boolean' &&
          text(r.result, 12) &&
          text(r.category, 100),
      )
    )
      return false;
    if (
      !s.injuries.every(
        (i) =>
          id(i.id) &&
          body([i.part]) &&
          text(i.note) &&
          Array.isArray(i.excluded) &&
          i.excluded.every(sport) &&
          text(i.updatedAt, 100),
      )
    )
      return false;
    if (
      !s.decisions.every(
        (d) =>
          date(d.date) &&
          id(d.planId) &&
          typeof d.accepted === 'boolean' &&
          ['無', '輕微', '中度', '嚴重'].includes(d.severity),
      )
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
