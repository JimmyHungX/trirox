'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Check,
  Pencil,
  Flag,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Navigation,
  Watch,
  Square,
} from 'lucide-react';
import {
  type Workout,
  type Sport,
  type Part,
  type Log,
  sports,
  sportNames,
  parts,
  uid,
  dayKey,
  conflict,
  generateWeek,
  addDays,
} from '@/lib/training';
import { Field, Choice, Range, Checks, SportIcon, Spark, Empty } from './ui';
import { Confirm, type PanelProps } from './panels';
export function WorkoutPanel(p: PanelProps) {
  const { state, panel, open } = p;
  const w = state.workouts.find((x) => x.id === panel.id);
  if (!w) return <div className="panel-body">找不到課表</div>;
  const log = state.logs.find((l) => l.planId === w.id),
    future = w.date > dayKey(),
    rest = w.sport === 'Rest',
    c = conflict(state, w);
  const warm = Math.min(10, Math.round(w.minutes * 0.2)),
    cool = Math.min(10, Math.round(w.minutes * 0.2)),
    main = w.minutes - warm - cool;
  const target =
    state.settings.baselinesKnown === false
      ? `體感強度 RPE ${w.zone === 2 ? '3–4' : '6–7'} / 10`
      : w.sport === 'Bike'
        ? Math.round(state.settings.ftp * (w.zone === 2 ? 0.65 : 0.9)) + ' W'
        : w.sport === 'Swim'
          ? state.settings.swimPace + ' /100m'
          : w.sport === 'Run'
            ? state.settings.runPace + ' /km'
            : '穩定動作品質';
  return (
    <div className="panel-body form">
      <div className="detail-hero">
        <SportIcon sport={w.sport} size={36} />
        <span className="eyebrow">
          {sportNames[w.sport]} · {w.date} {w.time}
        </span>
        <h2>{w.title}</h2>
        <p>
          {future
            ? '未來課表預覽'
            : log
              ? '訓練已完成'
              : w.adjusted
                ? 'AI 調整版 · v' + w.version
                : '原訂課表 · v' + w.version}
        </p>
      </div>
      <div className="detail-metrics">
        <div>
          <span>預計時長</span>
          <strong>
            {w.minutes}
            <small> 分鐘</small>
          </strong>
        </div>
        <div>
          <span>目標強度</span>
          <strong>Zone {w.zone}</strong>
        </div>
      </div>
      {rest ? (
        <p className="info-note">休息與輕量活動，以身體舒適為原則。</p>
      ) : (
        <div className="structure">
          {[
            {
              label: '熱身',
              time: warm + ' 分鐘',
              detail: '逐漸提升心率 · Zone 1–2',
            },
            {
              label: '主課表',
              time: main + ' 分鐘',
              detail: target + ' · Zone ' + w.zone,
            },
            {
              label: '收操',
              time: cool + ' 分鐘',
              detail: '降低強度 · 輕鬆伸展',
            },
          ].map((s, i) => (
            <div key={s.label}>
              <span className="step-number">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>
                <strong>{s.label}</strong>
                <p>{s.detail}</p>
              </span>
              <b>{s.time}</b>
            </div>
          ))}
        </div>
      )}
      {w.sport === 'HYROX' && (
        <div>
          <h3>關卡動作</h3>
          <div className="exercise-row">
            <span>划船機</span>
            <span>3 × 500 m</span>
          </div>
          <div className="exercise-row">
            <span>農夫走路</span>
            <span>3 × 40 m · 自選負重</span>
          </div>
          <div className="exercise-row">
            <span>平板支撐</span>
            <span>3 × 45 秒</span>
          </div>
        </div>
      )}
      {c.severity !== '無' && !rest && (
        <button
          className="info-note warning"
          onClick={() => open('suggestion', w.id)}
        >
          {c.reason} 查看建議 <ChevronRight size={16} />
        </button>
      )}
      {log && (
        <div className="info-note">
          <Check size={18} />
          已回報 {log.minutes} 分鐘 · RPE {log.rpe} / 10
        </div>
      )}
      <div className="workout-actions">
        {!future && !rest && !log && (
          <button
            className="primary full workout-start-button"
            disabled={c.restricted}
            onClick={() => open('timer', w.id)}
          >
            <Play size={22} fill="currentColor" />
            準備開始
          </button>
        )}
        <button className="secondary full" onClick={() => open('edit', w.id)}>
          <Pencil size={17} />
          編輯課表
        </button>
      </div>
      {!future && !rest && (
        <button className="text-action" onClick={() => open('report', w.id)}>
          {log ? '更新訓練回報' : '回報已完成訓練'}
          <ArrowRight size={17} />
        </button>
      )}
    </div>
  );
}
export function EditWorkout({
  state,
  panel,
  save,
  busy,
  open,
  close,
}: PanelProps) {
  const original = state.workouts.find((w) => w.id === panel.id),
    [w, setW] = useState<Workout>(
      original ?? {
        id: uid(),
        date:
          panel.id && /^\d{4}-\d{2}-\d{2}$/.test(panel.id)
            ? panel.id
            : dayKey(),
        time: state.settings.time,
        sport: 'Run',
        title: '有氧基礎跑',
        minutes: 45,
        distance: 8,
        zone: 2,
        version: 1,
      },
    ),
    [review, setReview] = useState(false),
    [remove, setRemove] = useState(false);
  const update = (v: Partial<Workout>) => {
    setW({ ...w, ...v });
    setReview(false);
  };
  const preview = conflict(state, w),
    logged = state.logs.some((l) => l.planId === w.id);
  return (
    <form
      className="panel-body form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!review) {
          setReview(true);
          return;
        }
        const next = {
          ...w,
          title: w.title.trim(),
          version: original ? original.version + 1 : 1,
        };
        if (
          await save(
            {
              ...state,
              workouts: [...state.workouts.filter((x) => x.id !== w.id), next],
            },
            '課表已儲存',
          )
        )
          open('workout', w.id);
      }}
    >
      <Field label="課表名稱">
        <input
          required
          maxLength={100}
          value={w.title}
          onChange={(e) => update({ title: e.target.value })}
        />
      </Field>
      <Choice
        label="運動項目"
        value={w.sport}
        options={sports.map((s) => ({ value: s, label: sportNames[s] }))}
        onChange={(v) =>
          update({
            sport: v as Sport,
            ...(v === 'Rest'
              ? { minutes: 0, distance: 0, zone: 1 }
              : { minutes: w.minutes || 45 }),
          })
        }
      />
      <div className="form-grid">
        <Field label="日期">
          <input
            type="date"
            required
            value={w.date}
            disabled={logged}
            onChange={(e) => update({ date: e.target.value })}
          />
        </Field>
        <Field label="開始時間">
          <input
            type="time"
            required
            value={w.time}
            onChange={(e) => update({ time: e.target.value })}
          />
        </Field>
      </div>
      {w.sport !== 'Rest' && (
        <>
          <Range
            label="訓練時長"
            value={w.minutes}
            min={5}
            max={240}
            step={5}
            unit="分鐘"
            onChange={(minutes) => update({ minutes })}
          />
          <Range
            label="目標強度"
            value={w.zone}
            min={1}
            max={5}
            unit="Zone"
            onChange={(zone) => update({ zone })}
          />
          <Field label="距離（km，選填）">
            <input
              type="number"
              min="0"
              max="500"
              step=".1"
              value={w.distance}
              onChange={(e) => update({ distance: Number(e.target.value) })}
            />
          </Field>
        </>
      )}
      <div
        className={
          'conflict-preview ' + (preview.severity === '無' ? '' : 'warning')
        }
      >
        <Sparkles size={20} />
        <div>
          <strong>
            {preview.severity === '無'
              ? '衝突預檢：未見明顯衝突'
              : '衝突預檢：' + preview.severity}
          </strong>
          <p>{preview.reason}</p>
          <small>依目前生理資料估算；未來日期將於當日重新評估。</small>
        </div>
      </div>
      {logged && (
        <p className="caption">
          已完成課表的日期鎖定，實際訓練數據請於回報中更新。
        </p>
      )}
      {review && (
        <div className="review-summary">
          <h3>確認變更</h3>
          <p>
            {original ? original.title + ' → ' : ''}
            {w.title}
          </p>
          <p>
            {w.date} {w.time} · {sportNames[w.sport]}
          </p>
          <p>
            {w.minutes} 分鐘 · Zone {w.zone} · {w.distance} km
          </p>
        </div>
      )}
      <button className="primary full" disabled={busy || preview.restricted}>
        {busy ? '儲存中…' : review ? '確認儲存' : '檢視變更'}
      </button>
      {preview.restricted && (
        <p className="caption">此項目已被傷病限制排除，請選擇其他項目。</p>
      )}
      {original && !logged && (
        <button
          type="button"
          className="danger-link"
          onClick={() => setRemove(true)}
        >
          刪除課表
        </button>
      )}
      <Confirm
        open={remove}
        setOpen={setRemove}
        title="刪除這堂課表？"
        description="將從訓練計畫移除這堂課表。"
        action="刪除課表"
        haptic="medium"
        busy={busy}
        onConfirm={async () => {
          if (
            await save(
              {
                ...state,
                workouts: state.workouts.filter((x) => x.id !== w.id),
              },
              '課表已刪除',
            )
          )
            close();
        }}
      />
    </form>
  );
}
export function ReportPanel({
  state,
  panel,
  save,
  busy,
  open,
  close,
}: PanelProps) {
  const w = state.workouts.find((x) => x.id === panel.id);
  const [log, setLog] = useState<Log>(
    () =>
      state.logs.find((l) => l.planId === panel.id) ?? {
        id: uid(),
        planId: panel.id ?? '',
        date: w?.date ?? dayKey(),
        sport: w?.sport ?? 'Run',
        minutes: w?.minutes || 45,
        distance: w?.distance ?? 0,
        zone: w?.zone ?? 2,
        rpe: 5,
        fatigue: 2,
        soreness: [],
        note: '',
      },
  );
  if (!w || w.date > dayKey())
    return (
      <div className="panel-body">
        <Empty title="未來課表不可回報" sub="請於訓練完成後再回報。" />
      </div>
    );
  const update = (v: Partial<Log>) => setLog({ ...log, ...v });
  return (
    <form
      className="panel-body form"
      onSubmit={async (e) => {
        e.preventDefault();
        const existing = state.checkins.find((c) => c.date === log.date);
        const check = {
          date: log.date,
          soreness: [],
          tags: [],
          note: '',
          exclusion_flag: false,
          ...existing,
          fatigue: log.fatigue,
        };
        const next = {
          ...state,
          logs: [...state.logs.filter((l) => l.planId !== w.id), log],
          checkins: [
            ...state.checkins.filter((c) => c.date !== log.date),
            check,
          ],
        };
        if (await save(next, '訓練已回報')) {
          const upcoming = next.workouts.find(
            (x) =>
              x.date === dayKey() &&
              !next.logs.some((l) => l.planId === x.id) &&
              x.sport !== 'Rest',
          );
          if (
            upcoming &&
            ['中度', '嚴重'].includes(conflict(next, upcoming).severity)
          )
            open('suggestion', upcoming.id);
          else close();
        }
      }}
    >
      <h3>{w.title}</h3>
      <p className="caption">裝置尚未同步，請填寫實際訓練結果。</p>
      <div className="form-grid">
        <Field label="實際時長（分鐘）">
          <input
            required
            type="number"
            min="1"
            max="1440"
            value={log.minutes}
            onChange={(e) => update({ minutes: Number(e.target.value) })}
          />
        </Field>
        <Field label="實際距離（km）">
          <input
            type="number"
            min="0"
            max="500"
            step=".01"
            value={log.distance}
            onChange={(e) => update({ distance: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="平均心率（bpm，選填）">
        <input
          type="number"
          min="30"
          max="250"
          value={log.heartRate ?? ''}
          onChange={(e) =>
            update({
              heartRate: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </Field>
      <Range
        label="實際平均強度區間"
        value={log.zone}
        min={1}
        max={5}
        onChange={(zone) => update({ zone })}
      />
      <Range
        label="主觀運動強度 RPE"
        value={log.rpe}
        min={1}
        max={10}
        onChange={(rpe) => update({ rpe })}
      />
      <Range
        label="整體疲勞"
        value={log.fatigue}
        min={1}
        max={5}
        onChange={(fatigue) => update({ fatigue })}
      />
      <Checks
        label="痠痛部位"
        options={parts}
        values={log.soreness}
        onChange={(v) => update({ soreness: v as Part[] })}
      />
      <Field label="訓練備註">
        <textarea
          value={log.note}
          maxLength={1000}
          placeholder="今天哪個部分需要留意？"
          onChange={(e) => update({ note: e.target.value })}
        />
      </Field>
      <button className="primary full" disabled={busy}>
        <Check size={18} />
        {busy ? '儲存中…' : '送出訓練回報'}
      </button>
    </form>
  );
}
export function SuggestionPanel({
  state,
  panel,
  save,
  busy,
  close,
}: PanelProps) {
  const w = state.workouts.find((x) => x.id === panel.id);
  if (!w) return <div className="panel-body">找不到課表</div>;
  const c = conflict(state, w);
  const hrv = state.checkins
    .filter((x) => x.hrv !== undefined)
    .slice(-7)
    .map((x) => x.hrv!);
  const decide = async (accepted: boolean) => {
    const next = {
      ...state,
      workouts: accepted
        ? state.workouts.map((x) =>
            x.id === w.id
              ? {
                  ...x,
                  sport: c.sport,
                  minutes: c.minutes,
                  zone: c.zone,
                  distance:
                    c.sport === 'Rest'
                      ? 0
                      : Number(
                          (
                            (x.distance * c.minutes) /
                            Math.max(x.minutes, 1)
                          ).toFixed(1),
                        ),
                  title:
                    c.sport === 'Rest' ? '恢復與休息' : x.title + ' · 降階',
                  version: x.version + 1,
                  adjusted: true,
                }
              : x,
          )
        : state.workouts,
      decisions: [
        ...state.decisions,
        { date: dayKey(), planId: w.id, accepted, severity: c.severity },
      ],
    };
    if (await save(next, accepted ? '已套用建議' : '已保留原課表')) close();
  };
  return (
    <div className="panel-body form">
      <div className="suggestion-heading">
        <Sparkles size={34} />
        <h2>
          {c.severity === '無' ? '目前不需要調整' : '建議為今天留一點餘裕'}
        </h2>
        <p>{c.reason}</p>
      </div>
      <div className="evidence">
        <div>
          <span>近 7 天 HRV</span>
          {hrv.length > 1 && <Spark values={hrv} label="HRV 趨勢" />}
        </div>
        <div>
          <span>相關肌群估算負荷</span>
          <strong>
            {c.relevant.toFixed(2)} <small>× 基準</small>
          </strong>
        </div>
      </div>
      <p className="caption">
        肌群負荷為代理估算，非直接生理量測。係數仍待校準。
      </p>
      {c.severity !== '無' && (
        <>
          <div className="compare-grid">
            <div>
              <span>原訂課表</span>
              <h3>{sportNames[w.sport]}</h3>
              <p>{w.minutes} 分鐘</p>
              <p>Zone {w.zone}</p>
            </div>
            <div>
              <span>建議方案 · {c.severity}</span>
              <h3>{sportNames[c.sport]}</h3>
              <p>{c.minutes} 分鐘</p>
              <p>Zone {c.zone}</p>
            </div>
          </div>
          <p className="info-note">AI 只提出建議，確認後才會修改課表。</p>
          <button
            className="primary full"
            data-haptic="medium"
            disabled={busy}
            onClick={() => decide(true)}
          >
            確認套用建議
          </button>
          <button
            className="secondary full"
            disabled={busy || c.restricted}
            onClick={() => decide(false)}
          >
            維持原課表
          </button>
          {c.restricted && (
            <p className="caption">傷病限制為硬性排除，請先調整課表項目。</p>
          )}
        </>
      )}
    </div>
  );
}
export function GeneratePanel({ state, panel, save, busy, close }: PanelProps) {
  const start = panel.id ?? dayKey();
  const [workouts] = useState(() => generateWeek(state, start));
  const removable = state.workouts.filter(
    (w) =>
      w.date >= start &&
      w.date <= addDays(start, 6) &&
      w.date >= dayKey() &&
      !state.logs.some((l) => l.planId === w.id),
  );
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="panel-body form">
      <p className="muted">
        根據可訓練時間、器材與傷病限制產生，套用前可先檢視。
      </p>
      {workouts.length ? (
        workouts.map((w) => (
          <div className="generated-row" key={w.id}>
            <SportIcon sport={w.sport} />
            <span>
              <strong>{w.title}</strong>
              <small>
                {w.date} · {w.time}
              </small>
            </span>
            <span>{w.minutes} 分鐘</span>
          </div>
        ))
      ) : (
        <Empty title="此週已過去" sub="請選擇本週或未來週次。" />
      )}
      <p className="caption">
        初始模板採能力設定與保守偏好。完整週期最佳化及自動能力校準尚待實際數據驗證。
      </p>
      {workouts.length > 0 && (
        <button
          className="primary full"
          disabled={busy}
          onClick={() => setConfirm(true)}
        >
          套用 {workouts.length} 天課表
        </button>
      )}
      <Confirm
        open={confirm}
        setOpen={setConfirm}
        title="套用這份課表？"
        description={
          '將替換本週 ' + removable.length + ' 堂未完成課表，已完成紀錄會保留。'
        }
        action="確認套用"
        busy={busy}
        onConfirm={async () => {
          const completedDates = new Set(
            state.workouts
              .filter((w) => state.logs.some((l) => l.planId === w.id))
              .map((w) => w.date),
          );
          if (
            await save(
              {
                ...state,
                workouts: [
                  ...state.workouts.filter(
                    (w) => !removable.some((x) => x.id === w.id),
                  ),
                  ...workouts.filter((w) => !completedDates.has(w.date)),
                ],
              },
              '週課表已更新',
            )
          )
            close();
        }}
      />
    </div>
  );
}
const stations = [
  'SkiErg',
  '雪橇推',
  '雪橇拉',
  '波比跳遠',
  '划船機',
  '農夫走路',
  '沙袋弓箭步',
  'Wall Balls',
];
export function TimerPanel({ state, panel, open }: PanelProps) {
  const w = state.workouts.find((x) => x.id === panel.id);
  const [running, setRunning] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [laps, setLaps] = useState<{ name: string; seconds: number }[]>([]),
    [mode, setMode] = useState(w?.sport === 'HYROX' ? 'hyrox' : 'standard');
  const start = useRef(0),
    acc = useRef(0);
  useEffect(() => {
    if (!running) return;
    start.current = Date.now();
    const t = setInterval(
      () =>
        setElapsed(
          acc.current + Math.floor((Date.now() - start.current) / 1000),
        ),
      250,
    );
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (running) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [running]);
  if (!w) return <div className="panel-body">找不到課表</div>;
  const segments =
    mode === 'hyrox'
      ? stations.flatMap((s, i) => ['跑步 ' + (i + 1), s]).concat('ROXZONE')
      : mode === 'triathlon'
        ? ['游泳', 'T1 轉換', '單車', 'T2 轉換', '跑步']
        : ['訓練'];
  const target =
    state.settings.baselinesKnown === false
      ? { value: `RPE ${w.zone === 2 ? '3–4' : '6–7'}`, unit: '' }
      : w.sport === 'Bike'
        ? {
            value: String(
              Math.round(state.settings.ftp * (w.zone === 2 ? 0.65 : 0.9)),
            ),
            unit: 'W',
          }
        : w.sport === 'Swim'
          ? { value: state.settings.swimPace, unit: '/100m' }
          : w.sport === 'Run'
            ? { value: state.settings.runPace, unit: '/km' }
            : { value: `Zone ${w.zone}`, unit: '' };
  const distanceValue =
    w.distance > 0
      ? state.settings.units === 'mi'
        ? (w.distance * 0.621371).toFixed(1)
        : String(w.distance)
      : `Zone ${w.zone}`;
  const distanceUnit =
    w.distance > 0 ? (state.settings.units === 'mi' ? 'mi' : 'km') : '';
  const activeSegment = segments[Math.min(laps.length, segments.length - 1)];
  const lapSeconds = laps.reduce((total, lap) => total + lap.seconds, 0);
  const segmentElapsed = Math.max(0, elapsed - lapSeconds);
  const pause = () => {
    acc.current += Math.floor((Date.now() - start.current) / 1000);
    setElapsed(acc.current);
    setRunning(false);
  };
  const completeSegment = () => {
    setLaps([
      ...laps,
      {
        name: activeSegment,
        seconds: elapsed - lapSeconds,
      },
    ]);
    if (laps.length === segments.length - 1 && running) pause();
  };

  if (!running && elapsed === 0) {
    return (
      <div className="panel-body timer-preflight">
        <div className="timer-intro">
          <SportIcon sport={w.sport} size={34} />
          <span className="eyebrow">準備開始 · {sportNames[w.sport]}</span>
          <h2>{w.title}</h2>
        </div>
        <div className="timer-target-grid" aria-label="本次訓練目標">
          <div>
            <span>目標時間</span>
            <strong>{w.minutes}</strong>
            <small>分鐘</small>
          </div>
          <div>
            <span>{w.distance > 0 ? '目標距離' : '目標強度'}</span>
            <strong>{distanceValue}</strong>
            <small>{distanceUnit}</small>
          </div>
          <div>
            <span>配速／強度</span>
            <strong>{target.value}</strong>
            <small>{target.unit}</small>
          </div>
        </div>
        <Choice
          label="計時模式"
          value={mode}
          options={[
            { value: 'standard', label: '一般訓練' },
            { value: 'hyrox', label: 'HYROX · 17 分段' },
            { value: 'triathlon', label: '鐵人三項 · T1 / T2' },
          ]}
          onChange={setMode}
        />
        <div className="preflight-status" aria-label="開始前連線狀態">
          <span>
            <Navigation size={17} />
            {w.sport === 'HYROX' ? '室內計時模式' : 'GPS 待支援裝置定位'}
          </span>
          <span>
            <Watch size={17} />
            穿戴裝置未連線
          </span>
        </div>
        <button
          className="primary full timer-start-button"
          data-haptic="light"
          onClick={() => setRunning(true)}
        >
          <Play size={27} fill="currentColor" />
          開始訓練
        </button>
        <p className="caption timer-disclaimer">
          目前使用前景計時；請保持此畫面開啟，完成後再送出訓練回報。
        </p>
      </div>
    );
  }

  return (
    <div
      className={`panel-body timer-live ${mode === 'hyrox' ? 'hyrox-hud' : ''}`}
    >
      <div className="timer-live-status">
        <span>
          <i className={running ? 'live-dot' : ''} />
          {running ? '進行中' : '已暫停'}
        </span>
        <span>
          {mode === 'hyrox'
            ? `${Math.min(laps.length + 1, segments.length)} / ${segments.length} 分段`
            : sportNames[w.sport]}
        </span>
      </div>
      <div className="timer-segment">
        <span>當前分段</span>
        <h2>
          {laps.length >= segments.length ? '所有分段完成' : activeSegment}
        </h2>
      </div>
      <output className="stopwatch" aria-label={`經過時間 ${clock(elapsed)}`}>
        {clock(elapsed)}
      </output>
      <div className="timer-live-metrics">
        <div>
          <span>{mode === 'hyrox' ? '本段時間' : '即時距離'}</span>
          <strong>{mode === 'hyrox' ? clock(segmentElapsed) : '—'}</strong>
          <small>{mode === 'hyrox' ? '' : distanceUnit || 'km'}</small>
        </div>
        <div>
          <span>目標配速／強度</span>
          <strong>{target.value}</strong>
          <small>{target.unit}</small>
        </div>
      </div>
      {elapsed > 0 && laps.length < segments.length && (
        <button
          className="primary full timer-segment-button"
          data-haptic={mode === 'hyrox' ? 'medium' : 'light'}
          onClick={completeSegment}
        >
          <Flag size={20} />
          {mode === 'standard' ? '完成此段' : '下一分段'}
        </button>
      )}
      <div className="timer-controls">
        <button
          className="secondary"
          data-haptic="light"
          disabled={laps.length >= segments.length}
          onClick={() => (running ? pause() : setRunning(true))}
        >
          {running ? <Pause size={21} /> : <Play size={21} />}
          {running ? '暫停' : '繼續'}
        </button>
        <button
          className="secondary timer-end"
          data-haptic="medium"
          onClick={() => {
            if (running) pause();
            open('report', w.id);
          }}
        >
          <Square size={18} fill="currentColor" />
          結束
        </button>
      </div>
      {mode === 'triathlon' && elapsed >= 1800 && (
        <p className="info-note">
          已訓練 {Math.floor(elapsed / 60)}{' '}
          分鐘，請依個人補給計畫補充水分與碳水化合物。
        </p>
      )}
      {laps.length > 0 && (
        <div className="timer-laps" aria-label="已完成分段">
          {laps.slice(-3).map((l, i) => (
            <div className="exercise-row" key={`${l.name}-${i}`}>
              <span>{l.name}</span>
              <strong>{clock(l.seconds)}</strong>
            </div>
          ))}
        </div>
      )}
      <p className="timer-footnote">前景計時中 · 關閉畫面前請先結束並回報</p>
    </div>
  );
}
function clock(s: number) {
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}
