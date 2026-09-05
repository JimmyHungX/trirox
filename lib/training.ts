export type Sport = 'Run' | 'Bike' | 'Swim' | 'HYROX' | 'Rest';
export type Part = '上肢' | '下肢' | '核心';
export type Workout = {
  id: string;
  date: string;
  time: string;
  sport: Sport;
  title: string;
  minutes: number;
  distance: number;
  zone: number;
  version: number;
  adjusted?: boolean;
};
export type Log = {
  id: string;
  planId: string;
  date: string;
  sport: Sport;
  minutes: number;
  distance: number;
  zone: number;
  rpe: number;
  fatigue: number;
  soreness: Part[];
  heartRate?: number;
  note: string;
};
export type CheckIn = {
  date: string;
  sleep?: number;
  quality?: number;
  fatigue?: number;
  weight?: number;
  hrv?: number;
  soreness: Part[];
  tags: string[];
  note: string;
  exclusion_flag: boolean;
};
export type Race = {
  id: string;
  name: string;
  type: 'HYROX' | 'Marathon' | 'Triathlon';
  date: string;
  target: string;
  location: string;
  priority: number;
  completed: boolean;
  result: string;
  category: string;
};
export type Injury = {
  id: string;
  part: Part;
  note: string;
  excluded: Sport[];
  updatedAt: string;
};
export type Settings = {
  days: number[];
  time: string;
  maxMinutes: number;
  ftp: number;
  runPace: string;
  swimPace: string;
  baselinesKnown?: boolean;
  level: string;
  equipment: Sport[];
  conservative: number;
  protect: Sport;
  consecutive: number;
  units: 'km' | 'mi';
  notifications: Record<string, boolean>;
};
export type AppState = {
  schema: 1;
  demo: boolean;
  onboardingDismissed?: boolean;
  user: { name: string; height: number; weight: number; experience: string };
  settings: Settings;
  workouts: Workout[];
  logs: Log[];
  checkins: CheckIn[];
  races: Race[];
  injuries: Injury[];
  decisions: {
    date: string;
    planId: string;
    accepted: boolean;
    severity: string;
  }[];
};
export const sportNames: Record<Sport, string> = {
  Run: '跑步',
  Bike: '單車',
  Swim: '游泳',
  HYROX: '功能性重訓',
  Rest: '休息',
};
export const sports: Sport[] = ['Run', 'Bike', 'Swim', 'HYROX', 'Rest'];
export const parts: Part[] = ['上肢', '下肢', '核心'];
export function dayKey(date = new Date()) {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}
export function addDays(date: string, n: number) {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
export function daysUntil(date: string, today = dayKey()) {
  return Math.round(
    (Date.parse(date + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) /
      86400000,
  );
}
export function weekStart(date = dayKey()) {
  const d = new Date(date + 'T12:00:00');
  return addDays(date, -((d.getDay() + 6) % 7));
}
export const uid = () => crypto.randomUUID();
export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
export const mean = (v: number[]) =>
  v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
// Provisional coefficients require sports-science calibration before production recommendations.
export const model = {
  zone: [0, 1, 2, 3, 4, 5],
  eccentric: { Run: 1, Bike: 0.25, Swim: 0.2, HYROX: 1.4, Rest: 0 },
  muscle: {
    Run: [0, 1, 0.2],
    Bike: [0.1, 0.7, 0.2],
    Swim: [0.8, 0.2, 0.5],
    HYROX: [0.7, 1, 0.8],
    Rest: [0, 0, 0],
  } as Record<Sport, number[]>,
};
export function load(log: Log) {
  return log.minutes * model.zone[log.zone];
}
export function cns(values: number[], current?: number) {
  const baseline = values.slice(-30);
  if (baseline.length < 7 || current === undefined)
    return { z: 0.5, level: '中負荷', ready: false, score: 70 };
  const avg = mean(baseline),
    sd = Math.sqrt(mean(baseline.map((x) => (x - avg) ** 2)));
  const z = (avg - current) / Math.max(sd, 1);
  return {
    z,
    level: z >= 1.5 ? '高負荷' : z >= 0.5 ? '中負荷' : '低負荷',
    ready: true,
    score: clamp(90 - z * 25, 0, 100),
  };
}
export function acwr(logs: Log[], today = dayKey()) {
  const sum = (days: number) =>
    logs
      .filter((l) => l.date <= today && l.date >= addDays(today, -days + 1))
      .reduce((n, l) => n + load(l), 0);
  const acute = sum(7) / 7,
    chronic = sum(28) / 28;
  // Compare daily averages; raw 7-day and 28-day sums use incompatible windows.
  return {
    value: chronic ? acute / chronic : null,
    acute,
    chronic,
    ready: logs.some((l) => l.date <= addDays(today, -27)),
  };
}
export function muscleLoads(
  logs: Log[],
  today = dayKey(),
  checkins: CheckIn[] = [],
) {
  return parts.map((part, i) =>
    logs
      .filter((l) => l.date <= today && l.date >= addDays(today, -6))
      .reduce(
        (sum, l) =>
          sum +
          load(l) *
            model.eccentric[l.sport] *
            model.muscle[l.sport][i] *
            (0.5 + l.rpe / 10) *
            (l.soreness.includes(part) ||
            checkins.find((c) => c.date === today)?.soreness.includes(part) ||
            checkins.find((c) => c.date === l.date)?.soreness.includes(part)
              ? 1.25
              : 1),
        0,
      ),
  );
}
export function metrics(state: AppState, today = dayKey()) {
  const check = state.checkins.find((c) => c.date === today);
  const previous = state.checkins
    .filter(
      (c) =>
        c.date < today && c.date >= addDays(today, -30) && c.hrv !== undefined,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const central = cns(
      previous.map((c) => c.hrv!),
      check?.hrv,
    ),
    ratio = acwr(state.logs, today);
  const sleep =
    check?.quality !== undefined
      ? check.quality * 20
      : check?.sleep !== undefined
        ? clamp((check.sleep / 8) * 100, 0, 100)
        : 70;
  const fatigue = check?.fatigue ?? 2,
    subjective = (5 - fatigue) * 25;
  const risk =
    ratio.value === null
      ? 70
      : ratio.value > 1.3
        ? clamp(100 - (ratio.value - 1.3) * 100, 0, 100)
        : ratio.value < 0.8
          ? 75
          : 100;
  const score = Math.round(
    central.score * 0.4 + sleep * 0.25 + subjective * 0.2 + risk * 0.15,
  );
  return {
    check,
    central,
    ratio,
    score,
    ready: central.ready && check !== undefined,
    status: score >= 80 ? '準備良好' : score >= 60 ? '留意恢復' : '需要恢復',
    color: score >= 80 ? 'positive' : score >= 60 ? 'warning' : 'critical',
    hrvDelta:
      check?.hrv !== undefined && previous.length
        ? check.hrv - previous.at(-1)!.hrv!
        : null,
  };
}
export function conflict(state: AppState, w: Workout, today = dayKey()) {
  const m = metrics(state, today),
    current = muscleLoads(state.logs, today, state.checkins);
  const history = [7, 14, 21].map((n) =>
    muscleLoads(state.logs, addDays(today, -n), state.checkins),
  );
  const ratios = current.map((x, i) =>
    mean(history.map((h) => h[i])) ? x / mean(history.map((h) => h[i])) : 0,
  );
  const relevant = Math.max(
    ...ratios.filter((_, i) => model.muscle[w.sport][i] >= 0.5),
    0,
  );
  const restricted = state.injuries.some((i) => i.excluded.includes(w.sport));
  const severity =
    restricted || m.central.z >= 2.5 || relevant >= 2
      ? '嚴重'
      : m.central.z >= 1.5 || relevant >= 1.5
        ? '中度'
        : relevant > 1.3
          ? '輕微'
          : '無';
  return {
    severity,
    restricted,
    relevant,
    current,
    reason: restricted
      ? '這項訓練與你設定的傷病限制衝突。'
      : m.central.z >= 1.5
        ? '今日 HRV 低於個人基線，中央神經負荷偏高。'
        : relevant > 1.3
          ? '相關肌群的近 7 天估算負荷高於歷史基準。'
          : '目前未偵測到明顯訓練衝突。',
    minutes:
      severity === '嚴重'
        ? 20
        : Math.round(w.minutes * (severity === '中度' ? 0.75 : 0.88)),
    sport: severity === '嚴重' ? ('Rest' as Sport) : w.sport,
    zone: Math.min(w.zone, 2),
  };
}
export function seed(today = dayKey(), demo = true): AppState {
  const state: AppState = {
    schema: 1,
    demo,
    user: { name: '訓練者', height: 175, weight: 70, experience: '中階' },
    settings: {
      days: [1, 2, 3, 4, 5, 6],
      time: '07:00',
      maxMinutes: 90,
      ftp: 230,
      runPace: '4:58',
      swimPace: '1:52',
      baselinesKnown: demo,
      level: '中階',
      equipment: ['Run', 'Bike', 'Swim', 'HYROX'],
      conservative: 60,
      protect: 'Run',
      consecutive: 3,
      units: 'km',
      notifications: {
        今日課表: true,
        明日課表: true,
        恢復警示: true,
        AI調整建議: true,
        賽事倒數: true,
      },
    },
    workouts: [],
    logs: [],
    checkins: [],
    races: [],
    injuries: [],
    decisions: [],
  };
  if (!demo) return state;
  state.races = [
    {
      id: 'race-hyrox',
      name: 'HYROX Taipei',
      type: 'HYROX',
      date: addDays(today, 72),
      target: '01:10:00',
      location: 'Taipei, Taiwan',
      priority: 1,
      completed: false,
      result: '',
      category: 'Open',
    },
    {
      id: 'race-run',
      name: '台北馬拉松',
      type: 'Marathon',
      date: addDays(today, 106),
      target: '03:30:00',
      location: 'Taipei, Taiwan',
      priority: 2,
      completed: false,
      result: '',
      category: '全馬',
    },
  ];
  const start = weekStart(today);
  const types: Sport[] = ['Run', 'HYROX', 'Swim', 'Run', 'Rest', 'Run', 'Bike'];
  const titles = [
    '有氧基礎跑',
    '全身力量訓練',
    '技術與耐力',
    '節奏跑',
    '主動恢復',
    '閾值間歇',
    '耐力騎乘',
  ];
  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    state.workouts.push({
      id: 'week-' + i,
      date,
      time: date === today ? '16:00' : '07:00',
      sport: types[i],
      title: titles[i],
      minutes: [45, 40, 45, 50, 0, 50, 90][i],
      distance: [8, 0, 2, 10, 0, 8, 45][i],
      zone: [2, 3, 2, 3, 1, 4, 2][i],
      version: 1,
    });
  }
  state.workouts.push({
    id: 'core-today',
    date: today,
    time: '19:00',
    sport: 'HYROX',
    title: '核心穩定訓練',
    minutes: 20,
    distance: 0,
    zone: 2,
    version: 1,
  });
  for (let i = 30; i >= 0; i--) {
    const date = addDays(today, -i);
    state.checkins.push({
      date,
      hrv: 68 + [0, -4, 2, -2, 3, -1, 1][i % 7],
      sleep: i === 0 ? 7.5 : 7 + [0.5, -0.3, 0.2, 0.8, 0.1][i % 5],
      fatigue: 2,
      soreness: [],
      tags: [],
      note: '',
      exclusion_flag: false,
    });
    if (i > 0 && i % 7 !== 3) {
      const plan = state.workouts.find((w) => w.date === date);
      if (plan?.sport === 'Rest') continue;
      state.logs.push({
        id: 'history-' + i,
        planId: plan?.id ?? 'history-' + i,
        date,
        sport:
          plan?.sport ?? (['Run', 'Bike', 'HYROX', 'Swim'] as Sport[])[i % 4],
        minutes: plan?.minutes || 45,
        distance: plan?.distance ?? 8,
        zone: plan?.zone ?? 2,
        rpe: 5,
        fatigue: 2,
        soreness: [],
        note: '',
      });
    }
  }
  return state;
}
export function generateWeek(
  state: AppState,
  start = weekStart(),
  today = dayKey(),
): Workout[] {
  let streak = 0;
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i),
      dow = new Date(date + 'T12:00:00').getDay();
    const allowed = state.settings.equipment.filter(
      (s) =>
        s !== 'Rest' && !state.injuries.some((x) => x.excluded.includes(s)),
    );
    const rest =
      !state.settings.days.includes(dow) ||
      !allowed.length ||
      streak >= state.settings.consecutive;
    const sport: Sport = rest
      ? 'Rest'
      : allowed[
          (i + (state.settings.protect === 'Run' ? 0 : 1)) % allowed.length
        ];
    streak = rest ? 0 : streak + 1;
    const duration =
      sport === 'Rest'
        ? 0
        : Math.min(
            state.settings.maxMinutes,
            sport === 'Bike' ? 75 : sport === 'HYROX' ? 40 : 45,
          );
    return {
      id: uid(),
      date,
      time: state.settings.time,
      sport,
      title:
        sport === 'Rest'
          ? '恢復日'
          : sportNames[sport] +
            ' ' +
            (state.settings.conservative >= 60 ? '基礎訓練' : '耐力訓練'),
      minutes: duration,
      distance:
        sport === 'Run' && state.settings.baselinesKnown !== false
          ? Number(
              (
                duration /
                (Number(state.settings.runPace.split(':')[0]) +
                  Number(state.settings.runPace.split(':')[1] || 0) / 60 +
                  0.5)
              ).toFixed(1),
            )
          : sport === 'Bike'
            ? duration / 3
            : sport === 'Swim'
              ? 1.5
              : 0,
      zone: state.settings.conservative >= 60 ? 2 : 3,
      version: 1,
    };
  }).filter((w) => w.date >= today);
}
