'use client';
import { useEffect, useState, useRef } from 'react';
import {
  Home,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  UserRound,
  ChevronRight,
  ArrowRight,
  ChevronLeft,
  Plus,
  NotebookPen,
  Flag,
  Sparkles,
  Trophy,
  SlidersHorizontal,
  Watch,
  HeartPulse,
  Bell,
  Settings,
  Pencil,
  Check,
  Activity,
  Heart,
  Moon,
  Battery,
  Play,
  RotateCw,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Ring,
  SportIcon,
  IconButton,
  SectionHead,
  Row,
  Spark,
  Empty,
} from './ui';
import {
  dayKey,
  addDays,
  weekStart,
  daysUntil,
  metrics,
  conflict,
  firstUseState,
  load,
  sportNames,
  type AppState,
  type TimedWorkoutResult,
  type Workout,
} from '@/lib/training';
import { Panel } from './panels';
import { registerTrainingTools } from '@/lib/webmcp';
import { validState } from '@/lib/validation';
import { haptic } from '@/lib/haptics';
import { orderedWorkouts } from '@/lib/schedule';
import { Onboarding } from './onboarding';
import { WeekPlanner } from './week-planner';

declare const __TRIROX_STORAGE_MODE__: 'api' | 'local';

const localStateKey = 'trirox-state-v1';
export type PanelState = {
  type: string;
  id?: string;
  timedResult?: TimedWorkoutResult;
};
const navs = [
  { id: 'today', label: '今日', icon: Home },
  { id: 'plan', label: '計畫', icon: CalendarDays },
  { id: 'analysis', label: '分析', icon: ChartNoAxesColumnIncreasing },
  { id: 'profile', label: '我的', icon: UserRound },
];
const labels: Record<string, string> = {
  checkin: '快速紀錄',
  workout: '課表詳情',
  report: '訓練回報',
  edit: '編輯課表',
  newWorkout: '新增訓練',
  races: '我的賽事',
  race: '賽事詳情',
  newRace: '新增賽事',
  editRace: '編輯賽事',
  training: '訓練設定',
  devices: '裝置連線',
  injuries: '傷病與限制',
  notifications: '通知',
  settings: 'App 設定',
  profileEdit: '個人資料',
  suggestion: 'AI 調整建議',
  generate: '建立週課表',
  timer: '訓練計時',
};

function TodayTrainingShortcut({
  active,
  restricted,
  completedToday,
  restToday,
  today,
  open,
}: {
  active?: Workout;
  restricted: boolean;
  completedToday: Workout[];
  restToday?: Workout;
  today: string;
  open: (type: string, id?: string) => void;
}) {
  if (active)
    return (
      <button
        className={`today-training-shortcut${
          restricted ? ' is-restricted' : ''
        }`}
        data-haptic={restricted ? undefined : 'light'}
        onClick={() => open(restricted ? 'workout' : 'timer', active.id)}
      >
        <SportIcon sport={active.sport} />
        <span className="today-training-copy">
          <small>
            {restricted ? '今天需要先調整' : `今天 · ${active.time} 快速開始`}
          </small>
          <strong>{active.title}</strong>
          <span>
            {sportNames[active.sport]} · {active.minutes} 分鐘 · Zone{' '}
            {active.zone}
          </span>
        </span>
        <span className="today-training-action" aria-hidden="true">
          {restricted ? (
            <ChevronRight size={21} />
          ) : (
            <Play size={21} fill="currentColor" />
          )}
        </span>
      </button>
    );

  if (completedToday.length)
    return (
      <button
        className="today-training-shortcut is-complete"
        onClick={() => open('workout', completedToday[0].id)}
      >
        <Check size={24} />
        <span className="today-training-copy">
          <small>今天</small>
          <strong>今日訓練已完成</strong>
          <span>{completedToday.length} 堂訓練已回報</span>
        </span>
        <span className="today-training-action" aria-hidden="true">
          <ChevronRight size={21} />
        </span>
      </button>
    );

  if (restToday)
    return (
      <button
        className="today-training-shortcut is-rest"
        onClick={() => open('workout', restToday.id)}
      >
        <SportIcon sport="Rest" />
        <span className="today-training-copy">
          <small>今天</small>
          <strong>{restToday.title}</strong>
          <span>恢復日 · 查看今日安排</span>
        </span>
        <span className="today-training-action" aria-hidden="true">
          <ChevronRight size={21} />
        </span>
      </button>
    );

  return (
    <button
      className="today-training-shortcut is-empty"
      onClick={() => open('newWorkout', today)}
    >
      <Plus size={24} />
      <span className="today-training-copy">
        <small>今天</small>
        <strong>尚未安排訓練</strong>
        <span>新增一堂今日課表</span>
      </span>
      <span className="today-training-action" aria-hidden="true">
        <Plus size={21} />
      </span>
    </button>
  );
}

export default function TrainingApp() {
  const [state, setState] = useState<AppState | null>(null),
    [revision, setRevision] = useState(-1),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [tab, setTab] = useState('today'),
    [panel, setPanel] = useState<PanelState | null>(null),
    [toast, setToast] = useState(''),
    [offset, setOffset] = useState(0);
  const gate = useRef(false);
  const latest = useRef(state);
  const today = dayKey();
  useEffect(() => {
    latest.current = state;
  }, [state]);
  useEffect(() => {
    const onConfirmedAction = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? (event.target.closest(
              '[data-haptic], [data-slot="switch"]',
            ) as HTMLElement | null)
          : null;
      if (!target || target.matches(':disabled, [aria-disabled="true"]'))
        return;
      const strength =
        target.dataset.haptic ??
        (target.matches('[data-slot="switch"]') ? 'light' : '');
      if (strength === 'light' || strength === 'medium') haptic(strength);
    };
    const onFormSubmit = (event: SubmitEvent) => {
      const submitter = event.submitter;
      if (submitter instanceof Element && submitter.closest('[data-haptic]'))
        return;
      haptic('light');
    };
    document.addEventListener('click', onConfirmedAction);
    document.addEventListener('submit', onFormSubmit);
    return () => {
      document.removeEventListener('click', onConfirmedAction);
      document.removeEventListener('submit', onFormSubmit);
    };
  }, []);
  useEffect(
    () =>
      registerTrainingTools(
        () =>
          latest.current
            ? {
                date: dayKey(),
                recovery: metrics(latest.current).score,
                workouts: latest.current.workouts.filter(
                  (w) => w.date === dayKey(),
                ),
              }
            : { loading: true },
        (view) => {
          location.hash = view;
          setTab(view);
          setPanel(null);
        },
      ),
    [],
  );
  async function reload() {
    setError('');
    try {
      if (__TRIROX_STORAGE_MODE__ === 'local') {
        const stored = localStorage.getItem(localStateKey);
        const parsed = stored ? (JSON.parse(stored) as unknown) : null;
        const next = validState(parsed) ? parsed : firstUseState();
        latest.current = next;
        setState(next);
        setRevision(-1);
        return;
      }
      const r = await fetch('/api/state?date=' + dayKey());
      const data = (await r.json()) as {
        state: AppState;
        revision: number;
        error?: string;
      };
      if (!r.ok) throw new Error(data.error);
      latest.current = data.state;
      setState(data.state);
      setRevision(data.revision);
    } catch (e) {
      setError(e instanceof Error ? e.message : '讀取失敗');
    }
  }
  useEffect(() => {
    queueMicrotask(() => void reload());
    const update = () => {
      const t = location.hash.slice(1);
      if (navs.some((n) => n.id === t)) setTab(t);
    };
    queueMicrotask(update);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  async function save(next: AppState, message = '已儲存') {
    if (gate.current) return false;
    const previous = latest.current;
    const previousRevision = revision;
    let revisionConflict = false;
    gate.current = true;
    setBusy(true);
    setError('');
    latest.current = next;
    setState(next);
    try {
      if (__TRIROX_STORAGE_MODE__ === 'local') {
        localStorage.setItem(localStateKey, JSON.stringify(next));
        setToast(message);
        return true;
      }
      const r = await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: next, revision: previousRevision }),
      });
      const data = (await r.json()) as { revision: number; error?: string };
      revisionConflict = r.status === 409;
      if (!r.ok) throw new Error(data.error);
      setRevision(data.revision);
      setToast(message);
      return true;
    } catch (e) {
      if (previous) {
        latest.current = previous;
        setState(previous);
      }
      const message = e instanceof Error ? e.message : '儲存失敗';
      if (revisionConflict) {
        await reload();
        setError(message + ' 已重新載入最新資料。');
      } else setError(message);
      return false;
    } finally {
      gate.current = false;
      setBusy(false);
    }
  }
  function go(t: string) {
    setTab(t);
    location.hash = t;
    window.scrollTo({ top: 0, behavior: 'instant' });
    setPanel(null);
  }
  const open = (
    type: string,
    id?: string,
    timedResult?: TimedWorkoutResult,
  ) => {
    setToast('');
    setPanel({ type, id, timedResult });
  };
  if (!state)
    return (
      <main className="app startup">
        <div className="wordmark">TRIROX</div>
        <div className="startup-content">
          <div
            className={`startup-mark${error ? ' is-error' : ''}`}
            aria-label="TRIROX"
          >
            <Activity size={44} strokeWidth={2.25} />
          </div>
          <h1>{error ? '暫時無法連線' : '讀取訓練紀錄'}</h1>
          <p>{error || '正在準備你的今日課表'}</p>
          {error && (
            <button className="primary" onClick={reload}>
              <RotateCw size={18} />
              重試
            </button>
          )}
        </div>
      </main>
    );
  if (state.demo && state.onboardingDismissed === false)
    return (
      <Onboarding
        save={save}
        busy={busy}
        error={error}
        onExplore={async () => {
          await save({ ...state, onboardingDismissed: true }, '已開啟示範資料');
        }}
      />
    );
  const m = metrics(state),
    todays = orderedWorkouts(state.workouts.filter((w) => w.date === today)),
    completed = (w: Workout) => state.logs.some((l) => l.planId === w.id),
    race = state.races
      .filter((r) => !r.completed && r.date >= today)
      .sort(
        (a, b) => a.priority - b.priority || a.date.localeCompare(b.date),
      )[0];
  const active = todays.find((w) => w.sport !== 'Rest' && !completed(w)),
    suggestion = active ? conflict(state, active) : null;
  const completedToday = todays.filter(
      (w) => w.sport !== 'Rest' && completed(w),
    ),
    restToday = todays.find((w) => w.sport === 'Rest');
  const showSuggestion =
    active &&
    suggestion &&
    ['中度', '嚴重'].includes(suggestion.severity) &&
    !state.decisions.some((d) => d.date === today && d.planId === active.id);
  const start = addDays(weekStart(today), offset * 7),
    week = Array.from({ length: 7 }, (_, i) => addDays(start, i)),
    weekly = state.workouts.filter(
      (w) => week.includes(w.date) && w.sport !== 'Rest',
    ),
    done = weekly.filter(completed).length,
    percent = weekly.length ? Math.round((done / weekly.length) * 100) : 0;
  const dateText = new Date(today + 'T12:00:00').toLocaleDateString('zh-TW', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  function workoutRow(w: Workout, compact = false) {
    return (
      <button
        key={w.id}
        className={'workout-row ' + (completed(w) ? 'is-complete' : '')}
        onClick={() => open('workout', w.id)}
      >
        <div className="timeline-time">
          <i className={completed(w) ? 'dot done' : 'dot'} />
          <strong>{w.time}</strong>
          <small>{completed(w) ? '已完成' : '待開始'}</small>
        </div>
        <SportIcon sport={w.sport} />
        <span className="workout-copy">
          <strong>{w.title}</strong>
          <span>
            {w.distance > 0
              ? distance(w.distance, state!.settings.units) + ' · '
              : ''}
            {w.minutes > 0 ? w.minutes + ' 分鐘 · Zone ' + w.zone : '恢復身體'}
          </span>
          {!compact && (
            <small>
              {w.adjusted
                ? '已套用 AI 調整'
                : w.sport === 'Run'
                  ? '含熱身與收操'
                  : w.sport === 'HYROX'
                    ? '核心 · 肌力 · 穩定'
                    : sportNames[w.sport]}
            </small>
          )}
        </span>
        <ChevronRight size={18} />
      </button>
    );
  }
  return (
    <div className="app">
      <header className="app-header">
        <button
          className="wordmark"
          onClick={() => go('today')}
          aria-label="TRIROX 今日"
        >
          TRIROX
        </button>
        <div className="header-actions">
          <span>{dateText}</span>
          <IconButton
            label="週課表"
            icon={CalendarDays}
            onClick={() => go('plan')}
          />
        </div>
      </header>
      <div className="context-line">
        <span>
          {tab === 'today'
            ? '今天，' + state.user.name
            : tab === 'plan'
              ? '你的訓練週'
              : tab === 'analysis'
                ? '身體與表現'
                : '個人設定'}
        </span>
        <button onClick={() => open('settings')}>
          {state.demo ? '正在使用示範資料' : '個人紀錄'}
          <span className="tiny-dot" />
          {busy ? '儲存中' : '已就緒'}
        </button>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <IconButton
            label="關閉錯誤提示"
            icon={X}
            onClick={() => setError('')}
          />
        </div>
      )}
      <main className={'main-content ' + tab} key={tab}>
        {tab === 'today' && (
          <>
            <TodayTrainingShortcut
              active={active}
              restricted={Boolean(suggestion?.restricted)}
              completedToday={completedToday}
              restToday={restToday}
              today={today}
              open={open}
            />
            <section className="readiness-section">
              <SectionHead title="今天狀態">
                <IconButton
                  label="查看身體分析"
                  icon={ChevronRight}
                  onClick={() => go('analysis')}
                />
              </SectionHead>
              {!m.check ? (
                <button
                  className="first-action"
                  onClick={() => open('checkin')}
                >
                  <span className="first-action-number">01</span>
                  <span>
                    <small>建立今天的訓練依據</small>
                    <strong>先記錄身體狀態</strong>
                    <p>睡眠、疲勞與晨間 HRV，約 60 秒完成。</p>
                  </span>
                  <ArrowRight size={22} />
                </button>
              ) : (
                <>
                  <div className="readiness">
                    <Ring frameless score={m.ready ? m.score : null} />
                    <div className="readiness-copy">
                      <span
                        className={'status ' + (m.ready ? m.color : 'neutral')}
                      >
                        <i />
                        {m.ready ? '恢復狀態' : '建立基線中'}
                      </span>
                      <h1>{m.ready ? m.status : '認識你的身體'}</h1>
                      <p>
                        {m.ready
                          ? m.score >= 80
                            ? '身體狀態穩定，依照計畫前進。'
                            : '今天給身體多一點恢復時間。'
                          : '已累積 ' +
                            Math.min(
                              7,
                              state.checkins.filter(
                                (c) => c.date <= today && c.hrv !== undefined,
                              ).length,
                            ) +
                            ' / 7 天晨間 HRV。'}
                      </p>
                    </div>
                  </div>
                  <div className="metric-strip">
                    <div>
                      <span>HRV</span>
                      <strong>
                        {m.check?.hrv ?? '—'} <small>ms</small>
                        {m.hrvDelta !== null && (
                          <small
                            className={m.hrvDelta >= 0 ? 'positive' : 'warning'}
                          >
                            {' '}
                            {m.hrvDelta >= 0 ? '↑' : '↓'}
                          </small>
                        )}
                      </strong>
                    </div>
                    <div>
                      <span>睡眠</span>
                      <strong>
                        {m.check?.sleep !== undefined
                          ? Math.floor(m.check.sleep) +
                            ' 小時 ' +
                            Math.round((m.check.sleep % 1) * 60) +
                            ' 分'
                          : '—'}
                      </strong>
                    </div>
                    <div>
                      <span>主觀疲勞</span>
                      <strong>
                        {m.check?.fatigue !== undefined
                          ? m.check.fatigue <= 2
                            ? '低'
                            : m.check.fatigue === 3
                              ? '中'
                              : '高'
                          : '—'}{' '}
                        <i className={'tiny-dot ' + m.color} />
                      </strong>
                    </div>
                  </div>
                </>
              )}
            </section>
            {showSuggestion && (
              <button
                className="ai-suggestion"
                onClick={() => open('suggestion', active.id)}
              >
                <Sparkles size={26} />
                <span>
                  <strong>AI 建議調整今日訓練</strong>
                  <small>{suggestion.reason}</small>
                </span>
                <ArrowRight size={20} />
              </button>
            )}
            <section className="today-workouts">
              <SectionHead title="今日課表">
                <button className="text-link" onClick={() => go('plan')}>
                  <span>
                    {todays.filter(completed).length} / {todays.length} 完成
                  </span>
                  <ArrowRight size={22} />
                </button>
              </SectionHead>
              {todays.length ? (
                <div className="timeline">
                  {todays.map((w) => workoutRow(w))}
                </div>
              ) : (
                <Empty
                  title="今天沒有安排課表"
                  sub="安排訓練，或留一天給身體恢復。"
                  action="新增訓練"
                  onClick={() => open('newWorkout')}
                />
              )}
            </section>
            <div className="quick-grid">
              <button className="quick-tile" onClick={() => open('checkin')}>
                <div>
                  <NotebookPen size={23} />
                  <ArrowRight size={18} />
                </div>
                <h3>快速紀錄</h3>
                <p>{m.check ? '更新今天的身體感受' : '記下睡眠與身體感受'}</p>
                <span className="tile-bottom">
                  {m.check ? '今天已紀錄' : '今天感覺如何'}
                  {m.check ? <Check size={18} /> : <Plus size={20} />}
                </span>
              </button>
              <button
                className="quick-tile"
                onClick={() => (race ? open('race', race.id) : open('newRace'))}
              >
                <div>
                  <Flag size={23} />
                  <ArrowRight size={18} />
                </div>
                <h3>下一場賽事</h3>
                {race ? (
                  <>
                    <p className="race-name">{race.name}</p>
                    <span className="countdown">
                      {daysUntil(race.date)}
                      <small> 天後</small>
                    </span>
                  </>
                ) : (
                  <>
                    <p>設定你的下一個目標</p>
                    <span className="tile-bottom">
                      新增賽事
                      <Plus size={20} />
                    </span>
                  </>
                )}
              </button>
            </div>
            <p className="page-footnote">
              <span className="tiny-dot" />{' '}
              {state.demo
                ? '數據僅供體驗，非個人訓練建議'
                : '恢復指標為估算，請同時留意身體感受'}
            </p>
          </>
        )}
        {tab === 'plan' && (
          <>
            <div className="page-title">
              <h1>計畫</h1>
              <IconButton
                label="新增訓練"
                icon={Plus}
                onClick={() => open('newWorkout')}
              />
            </div>
            <TodayTrainingShortcut
              active={active}
              restricted={Boolean(suggestion?.restricted)}
              completedToday={completedToday}
              restToday={restToday}
              today={today}
              open={open}
            />
            <section className="plan-summary">
              <div>
                <span className="eyebrow">本週訓練</span>
                <h2>
                  {done}
                  <small> / {weekly.length} 完成</small>
                </h2>
                <span className="muted">
                  {weekly.reduce((n, w) => n + w.minutes, 0)} 分鐘 ·{' '}
                  {weekly.length} 堂訓練
                </span>
              </div>
              <Ring small score={percent} label={percent + '%'} />
            </section>
            <div className="phase-track">
              {['基礎期', '建構期', '巔峰期', '減量期'].map((x, i) => {
                const phase = race
                  ? daysUntil(race.date) > 84
                    ? 0
                    : daysUntil(race.date) > 28
                      ? 1
                      : daysUntil(race.date) > 14
                        ? 2
                        : 3
                  : 0;
                return (
                  <div key={x} className={i === phase ? 'active' : ''}>
                    <i />
                    <span>{x}</span>
                  </div>
                );
              })}
            </div>
            <section className="weekly-section">
              <SectionHead
                title={
                  new Date(start + 'T12:00:00').toLocaleDateString('zh-TW', {
                    month: 'long',
                  }) + ' · 週課表'
                }
              >
                <div className="week-controls">
                  <IconButton
                    label="上一週"
                    icon={ChevronLeft}
                    onClick={() => setOffset(offset - 1)}
                  />
                  <button onClick={() => setOffset(0)} className="week-reset">
                    {offset === 0
                      ? '本週'
                      : offset > 0
                        ? '下 ' + offset + ' 週'
                        : '前 ' + -offset + ' 週'}
                  </button>
                  <IconButton
                    label="下一週"
                    icon={ChevronRight}
                    onClick={() => setOffset(offset + 1)}
                  />
                </div>
              </SectionHead>
              <WeekPlanner
                dates={week}
                today={today}
                state={state}
                busy={busy}
                open={open}
                save={save}
              />
              <button
                className="secondary full"
                onClick={() => open('generate', start)}
              >
                <Sparkles size={18} />
                建立本週課表
              </button>
            </section>
            <section>
              <SectionHead title="備戰賽事">
                <IconButton
                  label="賽事中心"
                  icon={ArrowRight}
                  onClick={() => open('races')}
                />
              </SectionHead>
              {state.races
                .filter((r) => !r.completed)
                .map((r) => (
                  <button
                    className="race-row"
                    key={r.id}
                    onClick={() => open('race', r.id)}
                  >
                    <Flag size={22} />
                    <span>
                      <strong>{r.name}</strong>
                      <small>
                        {r.priority === 1 ? '主要賽事' : '次要賽事'} ·{' '}
                        {r.date.replaceAll('-', '.')}
                      </small>
                    </span>
                    <b>
                      {Math.max(0, daysUntil(r.date))}
                      <small> 天</small>
                    </b>
                    <ChevronRight size={16} />
                  </button>
                ))}
              {!state.races.length && (
                <button
                  className="secondary full"
                  onClick={() => open('newRace')}
                >
                  新增賽事
                </button>
              )}
            </section>
          </>
        )}
        {tab === 'analysis' && (
          <>
            <div className="page-title">
              <h1>分析</h1>
              <span className="muted">近 7 天</span>
            </div>
            {!state.checkins.length && !state.logs.length && (
              <section className="analysis-get-started">
                <span className="eyebrow">你的分析會從今天開始</span>
                <h2>先累積可比較的個人資料</h2>
                <p>
                  完成每日身體紀錄與訓練回報後，TRIROX
                  才會開始判斷恢復與訓練干擾。
                </p>
                <button onClick={() => open('checkin')}>
                  <span>
                    <i>1</i>完成今天的身體紀錄
                  </span>
                  <ArrowRight size={19} />
                </button>
                <button onClick={() => go('today')}>
                  <span>
                    <i>2</i>完成第一堂訓練並回報
                  </span>
                  <ArrowRight size={19} />
                </button>
              </section>
            )}
            <section className="analysis-recovery">
              <SectionHead title="身體狀況" />
              <div className="analysis-body">
                <div>
                  <Ring frameless score={m.ready ? m.score : null} />
                  <p className="ring-caption">恢復分數</p>
                </div>
                <div className="analysis-metrics">
                  {[
                    {
                      label: 'HRV',
                      icon: Heart,
                      value: m.check?.hrv ?? '—',
                      unit: 'ms',
                      values: state.checkins.slice(-7).map((c) => c.hrv ?? 0),
                    },
                    {
                      label: '睡眠',
                      icon: Moon,
                      value: m.check?.sleep ?? '—',
                      unit: '小時',
                      values: state.checkins.slice(-7).map((c) => c.sleep ?? 0),
                    },
                    {
                      label: '主觀疲勞',
                      icon: Battery,
                      value: m.check?.fatigue ?? '—',
                      unit: '/ 5',
                      values: state.checkins
                        .slice(-7)
                        .map((c) => c.fatigue ?? 0),
                    },
                  ].map((x) => (
                    <div className="analysis-metric" key={x.label}>
                      <x.icon size={20} />
                      <span>
                        <small>{x.label}</small>
                        <strong>
                          {x.value} <small>{x.unit}</small>
                        </strong>
                      </span>
                      {x.values.length > 1 && (
                        <Spark values={x.values} label={x.label} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="analysis-note">
                <Sparkles size={18} />
                <p>
                  {m.ready
                    ? m.score >= 80
                      ? '今天恢復良好，維持原訂訓練節奏。'
                      : '優先補足睡眠，視疲勞感降低訓練強度。'
                    : '尚在累積個人基線，暫採保守估算。'}
                </p>
              </div>
            </section>
            <section className="load-section">
              <SectionHead title="訓練負荷">
                <span className="muted">ACWR</span>
              </SectionHead>
              <div className="load-summary">
                <strong>{m.ratio.value?.toFixed(2) ?? '—'}</strong>
                <span
                  className={
                    m.ratio.value !== null && m.ratio.value > 1.3
                      ? 'warning'
                      : 'positive'
                  }
                >
                  {m.ratio.value === null
                    ? '尚無紀錄'
                    : m.ratio.value > 1.3
                      ? '負荷偏高'
                      : m.ratio.value < 0.8
                        ? '負荷偏低'
                        : '負荷適中'}
                </span>
                <small>參考區間 0.8–1.3</small>
              </div>
              <div className="bars" role="img" aria-label="近七天每日訓練負荷">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = addDays(today, i - 6),
                    v = state.logs
                      .filter((l) => l.date === date)
                      .reduce((n, l) => n + load(l), 0);
                  return (
                    <div key={date}>
                      <span>{v}</span>
                      <i
                        style={{ height: Math.max(3, Math.min(120, v / 3)) }}
                        className={i === 6 ? 'current' : ''}
                      />
                      <small>
                        {
                          '日一二三四五六'[
                            new Date(date + 'T12:00:00').getDay()
                          ]
                        }
                      </small>
                    </div>
                  );
                })}
              </div>
              {!m.ratio.ready && (
                <p className="caption">28 天資料尚未完整，比例僅供初步參考。</p>
              )}
            </section>
            <section className="insight-section">
              <SectionHead title="相關性洞察" />
              <div className="insight">
                <Sparkles size={25} />
                <span className="eyebrow">TRAINING INTELLIGENCE</span>
                <h3>
                  {m.check?.exclusion_flag
                    ? '今天的狀況，獨立看待。'
                    : '讓不同訓練，彼此配合。'}
                </h3>
                <p>
                  {m.check?.exclusion_flag
                    ? '已記錄生理狀況，今天的數據不會用於訓練干擾歸因。'
                    : '持續記錄疲勞與訓練，累積足夠資料後提供個人相關性洞察。'}
                </p>
                <span className="insight-foot">
                  {state.checkins.filter((c) => !c.exclusion_flag).length}{' '}
                  天有效紀錄 · 相關性不代表因果
                </span>
              </div>
            </section>
            <section>
              <SectionHead title="表現趨勢" />
              <div className="performance-grid">
                {(['Run', 'Bike', 'Swim', 'HYROX'] as const).map((s) => {
                  const logs = state.logs
                    .filter((l) => l.sport === s && l.distance > 0)
                    .sort((a, b) => a.date.localeCompare(b.date));
                  const paces = logs
                    .slice(-7)
                    .map((l) => l.minutes / l.distance);
                  const val =
                    s === 'Run'
                      ? paces.length
                        ? pace(paces.at(-1)!)
                        : state.settings.baselinesKnown === false
                          ? '—'
                          : state.settings.runPace
                      : s === 'Bike'
                        ? state.settings.baselinesKnown === false
                          ? '—'
                          : state.settings.ftp
                        : s === 'Swim'
                          ? state.settings.baselinesKnown === false
                            ? '—'
                            : state.settings.swimPace
                          : (state.races.find(
                              (r) => r.completed && r.type === 'HYROX',
                            )?.result ?? '—');
                  return (
                    <div key={s}>
                      <span>
                        <SportIcon sport={s} size={19} />
                        {s === 'Bike'
                          ? '單車 FTP'
                          : s === 'HYROX'
                            ? 'HYROX 成績'
                            : sportNames[s] + '配速'}
                      </span>
                      <strong>
                        {val}
                        <small>
                          {s === 'Run'
                            ? '/km'
                            : s === 'Bike'
                              ? 'W'
                              : s === 'Swim'
                                ? '/100m'
                                : ''}
                        </small>
                      </strong>
                      <small className="muted">
                        {state.settings.baselinesKnown === false &&
                        s !== 'HYROX' &&
                        !(s === 'Run' && logs.length)
                          ? '尚未設定'
                          : s === 'Run' && logs.length
                            ? '最近訓練平均'
                            : s === 'HYROX'
                              ? '已完成賽事'
                              : '能力基準'}
                      </small>
                      {s === 'Run' && paces.length > 1 ? (
                        <Spark values={paces} label="跑步配速" />
                      ) : (
                        <div className="trend-empty">等待更多紀錄</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="prediction">
              <SectionHead title="比賽預測">
                <Flag size={22} />
              </SectionHead>
              {race ? (
                <>
                  <h3>{race.name}</h3>
                  <div className="prediction-values">
                    <div>
                      <span>目標完賽時間</span>
                      <strong>{race.target}</strong>
                    </div>
                    <div>
                      <span>預估完賽時間</span>
                      <strong>—</strong>
                    </div>
                  </div>
                  <p className="caption">
                    尚缺足夠體能測試與比賽紀錄，暫不提供信心度。
                  </p>
                </>
              ) : (
                <Empty
                  title="還沒有目標賽事"
                  sub="新增一場賽事開始準備。"
                  action="新增賽事"
                  onClick={() => open('newRace')}
                />
              )}
            </section>
          </>
        )}
        {tab === 'profile' && (
          <>
            <button className="identity" onClick={() => open('profileEdit')}>
              <div className="avatar">
                <UserRound size={38} strokeWidth={1.4} />
              </div>
              <span>
                <h1>{state.user.name}</h1>
                <p>Hybrid Athlete</p>
              </span>
              <Pencil size={18} />
            </button>
            {race && (
              <button
                className="profile-race"
                onClick={() => open('race', race.id)}
              >
                <span>
                  <small>主要備戰賽事</small>
                  <h2>{race.name}</h2>
                  <p>
                    {race.date.replaceAll('-', '.')} · {race.location}
                  </p>
                </span>
                <span className="days">
                  {daysUntil(race.date)}
                  <small> 天</small>
                </span>
                <ChevronRight size={22} />
              </button>
            )}
            <div className="profile-menu">
              <Row
                icon={Trophy}
                title="我的賽事"
                sub="賽事目標與歷史紀錄"
                onClick={() => open('races')}
              />
              <Row
                icon={SlidersHorizontal}
                title="訓練設定"
                sub="可訓練時間、運動能力與 AI 偏好"
                onClick={() => open('training')}
              />
              <Row
                icon={Watch}
                title="裝置連線"
                sub="Apple Health、Garmin、COROS 連線"
                onClick={() => open('devices')}
              />
              <Row
                icon={HeartPulse}
                title="傷病與限制"
                sub={
                  state.injuries.length
                    ? state.injuries.length + ' 項需注意的限制'
                    : '管理長期傷病與動作限制'
                }
                onClick={() => open('injuries')}
              />
              <Row
                icon={Bell}
                title="通知"
                sub="課表、恢復與賽事提醒"
                onClick={() => open('notifications')}
              />
              <Row
                icon={Settings}
                title="App 設定"
                sub="單位、隱私與資料"
                onClick={() => open('settings')}
              />
            </div>
            <p className="profile-footer">
              TRIROX <span>WEB APP · 1.0</span>
            </p>
          </>
        )}
      </main>
      <nav className="bottom-nav" aria-label="主導航">
        {navs.map((n) => (
          <a
            href={'#' + n.id}
            key={n.id}
            className={tab === n.id ? 'active' : ''}
            aria-current={tab === n.id ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              go(n.id);
            }}
          >
            <n.icon size={25} strokeWidth={tab === n.id ? 2.3 : 1.6} />
            <span>{n.label}</span>
            <i />
          </a>
        ))}
      </nav>
      <Sheet
        open={!!panel}
        onOpenChange={(v) => {
          if (!v && !busy) setPanel(null);
        }}
      >
        <SheetContent
          side="bottom"
          spring
          motionOpen={!!panel}
          className={`app-sheet ${panel?.type === 'timer' ? 'timer-sheet' : ''}`}
          showCloseButton={false}
        >
          <SheetHeader className="panel-header">
            <div className="sheet-handle" />
            <div>
              <SheetTitle>{labels[panel?.type ?? ''] ?? 'TRIROX'}</SheetTitle>
              <IconButton
                label="關閉"
                icon={X}
                onClick={() => !busy && setPanel(null)}
              />
            </div>
            <SheetDescription className="sr-only">
              {labels[panel?.type ?? '']}表單與詳細資訊
            </SheetDescription>
          </SheetHeader>
          {error && (
            <p className="panel-error" role="alert">
              {error}
            </p>
          )}
          {panel && (
            <Panel
              key={panel.type + panel.id}
              panel={panel}
              state={state}
              save={save}
              busy={busy}
              open={open}
              close={() => setPanel(null)}
              notify={setToast}
            />
          )}
        </SheetContent>
      </Sheet>
      {toast && (
        <output className="toast" aria-live="polite">
          <Check size={18} />
          {toast}
        </output>
      )}
    </div>
  );
}
function distance(km: number, units: 'km' | 'mi') {
  return units === 'mi' ? (km * 0.621371).toFixed(1) + ' mi' : km + ' km';
}
function pace(n: number) {
  return (
    Math.floor(n) + ':' + String(Math.round((n % 1) * 60)).padStart(2, '0')
  );
}
