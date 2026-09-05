'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  Flag,
  HeartPulse,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  addDays,
  dayKey,
  generateWeek,
  seed,
  sportNames,
  type AppState,
  type Injury,
  type Part,
  type Race,
  type Sport,
} from '@/lib/training';
import { Checks, Choice, Field, Range } from './ui';

type Props = {
  save: (next: AppState, message?: string) => Promise<boolean>;
  busy: boolean;
  error: string;
  onExplore: () => Promise<void>;
};

const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];
const sportOptions: Sport[] = ['Run', 'Bike', 'Swim', 'HYROX'];

export function Onboarding({ save, busy, error, onExplore }: Props) {
  const today = dayKey();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<'none' | Race['type']>('HYROX');
  const [raceDate, setRaceDate] = useState(addDays(today, 84));
  const [days, setDays] = useState([1, 2, 4, 6]);
  const [equipment, setEquipment] = useState<Sport[]>([
    'Run',
    'Bike',
    'Swim',
    'HYROX',
  ]);
  const [maxMinutes, setMaxMinutes] = useState(75);
  const [level, setLevel] = useState('中階');
  const [showBaselines, setShowBaselines] = useState(false);
  const [runPace, setRunPace] = useState('5:30');
  const [ftp, setFtp] = useState(200);
  const [swimPace, setSwimPace] = useState('2:05');
  const [conservative, setConservative] = useState(65);
  const [hasInjury, setHasInjury] = useState(false);
  const [injuryPart, setInjuryPart] = useState<Part>('下肢');
  const [injuryNote, setInjuryNote] = useState('');
  const [excluded, setExcluded] = useState<Sport[]>([]);

  const trainingDays = useMemo(
    () =>
      days
        .slice()
        .sort((a, b) => a - b)
        .map((d) => '週' + dayLabels[d]),
    [days],
  );
  const canContinue =
    step === 1
      ? name.trim().length > 0 && (goal === 'none' || raceDate >= today)
      : step === 2
        ? days.length > 0 && equipment.length > 0
        : step === 3
          ? !hasInjury || injuryNote.trim().length > 0
          : true;

  async function finish() {
    const personal = seed(today, false);
    personal.onboardingDismissed = true;
    personal.user = {
      ...personal.user,
      name: name.trim(),
      experience: level,
    };
    personal.settings = {
      ...personal.settings,
      days,
      equipment,
      maxMinutes,
      level,
      runPace,
      ftp,
      swimPace,
      baselinesKnown: showBaselines,
      conservative,
      protect: equipment.includes('Run') ? 'Run' : equipment[0],
      consecutive: Math.min(3, days.length),
    };
    if (goal !== 'none') {
      const details = {
        HYROX: { name: '我的 HYROX', target: '01:20:00', category: 'Open' },
        Marathon: { name: '我的馬拉松', target: '04:00:00', category: '全馬' },
        Triathlon: {
          name: '我的鐵人三項',
          target: '03:00:00',
          category: '標準距離',
        },
      }[goal];
      personal.races = [
        {
          id: crypto.randomUUID(),
          name: details.name,
          type: goal,
          date: raceDate,
          target: details.target,
          location: '',
          priority: 1,
          completed: false,
          result: '',
          category: details.category,
        },
      ];
    }
    if (hasInjury) {
      const injury: Injury = {
        id: crypto.randomUUID(),
        part: injuryPart,
        note: injuryNote.trim(),
        excluded,
        updatedAt: new Date().toISOString(),
      };
      personal.injuries = [injury];
    }
    personal.workouts = generateWeek(personal, today, today);
    await save(personal, '你的第一週課表已建立');
  }

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <span className="wordmark">TRIROX</span>
        {step > 0 && step < 4 && (
          <button onClick={() => setStep(step - 1)} aria-label="上一步">
            <ArrowLeft size={21} />
          </button>
        )}
      </header>
      {step > 0 && (
        <div
          className="onboarding-progress"
          aria-label={`設定進度 ${step} / 4`}
        >
          {[1, 2, 3, 4].map((n) => (
            <i key={n} className={n <= step ? 'active' : ''} />
          ))}
        </div>
      )}
      {error && <p className="onboarding-error">{error}</p>}

      {step === 0 && (
        <section className="welcome-step">
          <div className="welcome-mark">
            <Activity size={42} />
          </div>
          <span className="eyebrow">FOR HYBRID ATHLETES</span>
          <h1>
            讓每一種訓練，
            <br />
            彼此配合。
          </h1>
          <p>
            用你的賽事目標、可訓練時間與身體狀態，建立第一週混合型訓練計畫。
          </p>
          <div className="welcome-proof">
            <span>
              <HeartPulse size={19} />
              每天知道身體能不能練
            </span>
            <span>
              <Sparkles size={19} />
              看懂跑步與肌力的干擾
            </span>
            <span>
              <ShieldCheck size={19} />
              所有調整都由你確認
            </span>
          </div>
          <div className="onboarding-actions">
            <button className="primary full" onClick={() => setStep(1)}>
              建立我的訓練計畫 <ArrowRight size={19} />
            </button>
            <button className="text-action" disabled={busy} onClick={onExplore}>
              先看看示範資料
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="onboarding-step">
          <span className="step-label">1 / 4 · 你的目標</span>
          <h1>你正在為什麼準備？</h1>
          <p>先決定主要方向，之後仍能在「我的賽事」修改。</p>
          <div className="onboarding-form">
            <Field label="怎麼稱呼你">
              <input
                required
                maxLength={80}
                value={name}
                placeholder="你的名字"
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Choice
              label="主要目標"
              value={goal}
              options={[
                { value: 'HYROX', label: 'HYROX' },
                { value: 'Marathon', label: '馬拉松' },
                { value: 'Triathlon', label: '鐵人三項' },
                { value: 'none', label: '先建立混合訓練習慣' },
              ]}
              onChange={(v) => setGoal(v as typeof goal)}
            />
            {goal !== 'none' && (
              <Field label="賽事日期">
                <input
                  type="date"
                  min={today}
                  value={raceDate}
                  onChange={(e) => setRaceDate(e.target.value)}
                />
              </Field>
            )}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="onboarding-step">
          <span className="step-label">2 / 4 · 你的時間</span>
          <h1>一週怎麼安排最實際？</h1>
          <p>選你真的能做到的時間，計畫才有機會長久。</p>
          <div className="onboarding-form">
            <Checks
              label="可訓練日"
              options={dayLabels}
              values={days.map((d) => dayLabels[d])}
              onChange={(values) =>
                setDays(values.map((v) => dayLabels.indexOf(v)))
              }
            />
            <Checks
              label="想納入的訓練"
              options={sportOptions.map((s) => sportNames[s])}
              values={equipment.map((s) => sportNames[s])}
              onChange={(values) =>
                setEquipment(
                  sportOptions.filter((s) => values.includes(sportNames[s])),
                )
              }
            />
            <Range
              label="單次最長訓練"
              value={maxMinutes}
              min={30}
              max={180}
              step={15}
              unit="分鐘"
              onChange={setMaxMinutes}
            />
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="onboarding-step">
          <span className="step-label">3 / 4 · 能力與限制</span>
          <h1>讓第一週更接近你。</h1>
          <p>不確定的數字可以先略過，課表會從時間與體感強度開始。</p>
          <div className="onboarding-form">
            <Choice
              label="目前訓練程度"
              value={level}
              options={['初階', '中階', '進階'].map((v) => ({
                value: v,
                label: v,
              }))}
              onChange={setLevel}
            />
            <div className="onboarding-toggle">
              <span>
                <label htmlFor="show-baselines">我知道自己的能力數據</label>
                <small>可填入配速與 FTP，讓強度起點更準確</small>
              </span>
              <input
                id="show-baselines"
                type="checkbox"
                checked={showBaselines}
                onChange={(e) => setShowBaselines(e.target.checked)}
              />
            </div>
            {showBaselines && equipment.includes('Run') && (
              <Field label="跑步輕鬆配速（分:秒 / km）">
                <input
                  pattern="[0-9]{1,2}:[0-5][0-9]"
                  value={runPace}
                  onChange={(e) => setRunPace(e.target.value)}
                />
              </Field>
            )}
            {showBaselines && equipment.includes('Bike') && (
              <Field label="單車 FTP（W）">
                <input
                  type="number"
                  min="30"
                  max="600"
                  value={ftp}
                  onChange={(e) => setFtp(Number(e.target.value))}
                />
              </Field>
            )}
            {showBaselines && equipment.includes('Swim') && (
              <Field label="游泳配速（分:秒 / 100m）">
                <input
                  pattern="[0-9]{1,2}:[0-5][0-9]"
                  value={swimPace}
                  onChange={(e) => setSwimPace(e.target.value)}
                />
              </Field>
            )}
            <Range
              label="AI 調整保守程度"
              value={conservative}
              min={0}
              max={100}
              step={5}
              unit="%"
              onChange={setConservative}
            />
            <div className="onboarding-toggle">
              <span>
                <label htmlFor="has-injury">目前有傷病或動作限制</label>
                <small>限制會優先於能力設定</small>
              </span>
              <input
                id="has-injury"
                type="checkbox"
                checked={hasInjury}
                onChange={(e) => setHasInjury(e.target.checked)}
              />
            </div>
            {hasInjury && (
              <div className="injury-setup">
                <Choice
                  label="主要部位"
                  value={injuryPart}
                  options={['上肢', '下肢', '核心'].map((v) => ({
                    value: v,
                    label: v,
                  }))}
                  onChange={(v) => setInjuryPart(v as Part)}
                />
                <Field label="限制說明">
                  <textarea
                    required
                    maxLength={1000}
                    value={injuryNote}
                    placeholder="例如：膝蓋不適，避免跑跳"
                    onChange={(e) => setInjuryNote(e.target.value)}
                  />
                </Field>
                <Checks
                  label="完全排除的訓練"
                  options={sportOptions.map((s) => sportNames[s])}
                  values={excluded.map((s) => sportNames[s])}
                  onChange={(values) =>
                    setExcluded(
                      sportOptions.filter((s) =>
                        values.includes(sportNames[s]),
                      ),
                    )
                  }
                />
              </div>
            )}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="onboarding-step review-step">
          <span className="step-label">4 / 4 · 準備完成</span>
          <h1>{name.trim()}，這是你的起點。</h1>
          <p>第一週會先採保守強度；每次回報後再逐步貼近你的狀態。</p>
          <div className="setup-summary">
            <div>
              <Flag size={21} />
              <span>
                <small>主要目標</small>
                <strong>{goal === 'none' ? '建立混合訓練習慣' : goal}</strong>
              </span>
            </div>
            <div>
              <Activity size={21} />
              <span>
                <small>訓練安排</small>
                <strong>
                  {trainingDays.join('、')} · 最長 {maxMinutes} 分
                </strong>
              </span>
            </div>
            <div>
              <ShieldCheck size={21} />
              <span>
                <small>調整原則</small>
                <strong>
                  {hasInjury ? '傷病限制優先' : '每次調整都由你確認'}
                </strong>
              </span>
            </div>
          </div>
          <div className="privacy-note">
            <Check size={18} /> 完成後會清除示範資料，建立你的個人課表與設定。
          </div>
        </section>
      )}

      {step > 0 && (
        <footer className="onboarding-footer">
          {step < 4 ? (
            <button
              className="primary full"
              disabled={!canContinue}
              onClick={() => setStep(step + 1)}
            >
              繼續 <ArrowRight size={19} />
            </button>
          ) : (
            <button className="primary full" disabled={busy} onClick={finish}>
              <Sparkles size={19} /> {busy ? '正在建立…' : '建立我的第一週課表'}
            </button>
          )}
        </footer>
      )}
    </main>
  );
}
