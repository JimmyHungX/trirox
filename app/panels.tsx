'use client';
import { useState } from 'react';
import { Check, ChevronRight, Flag, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  type AppState,
  type CheckIn,
  type Part,
  type Race,
  dayKey,
  daysUntil,
  exclusionTags,
  parts,
  shouldExcludeCheckIn,
  uid,
} from '@/lib/training';
import { Field, Choice, Checks, Empty, IconButton } from './ui';
import type { PanelState } from './training-app';
import {
  WorkoutPanel,
  EditWorkout,
  ReportPanel,
  SuggestionPanel,
  GeneratePanel,
  TimerPanel,
} from './workout-panels';
import {
  TrainingSettings,
  DevicesPanel,
  InjuriesPanel,
  NotificationsPanel,
  AppSettings,
  ProfileEdit,
} from './settings-panels';
export type PanelProps = {
  panel: PanelState;
  state: AppState;
  save: (next: AppState, message?: string) => Promise<boolean>;
  busy: boolean;
  open: (type: string, id?: string) => void;
  close: () => void;
  notify: (message: string) => void;
};
export function Panel(p: PanelProps) {
  const type = p.panel.type;
  if (type === 'checkin') return <CheckInPanel {...p} />;
  if (type === 'workout') return <WorkoutPanel {...p} />;
  if (type === 'edit' || type === 'newWorkout') return <EditWorkout {...p} />;
  if (type === 'report') return <ReportPanel {...p} />;
  if (type === 'suggestion') return <SuggestionPanel {...p} />;
  if (type === 'generate') return <GeneratePanel {...p} />;
  if (type === 'timer') return <TimerPanel {...p} />;
  if (type === 'races') return <RacesPanel {...p} />;
  if (type === 'race') return <RacePanel {...p} />;
  if (type === 'newRace' || type === 'editRace') return <RaceForm {...p} />;
  if (type === 'training') return <TrainingSettings {...p} />;
  if (type === 'devices') return <DevicesPanel {...p} />;
  if (type === 'injuries') return <InjuriesPanel {...p} />;
  if (type === 'notifications') return <NotificationsPanel {...p} />;
  if (type === 'settings') return <AppSettings {...p} />;
  if (type === 'profileEdit') return <ProfileEdit {...p} />;
  return (
    <div className="panel-body">
      <Empty title="找不到此頁面" sub="請關閉後重新開啟。" />
    </div>
  );
}
export function Confirm({
  open,
  setOpen,
  title,
  description,
  action,
  onConfirm,
  busy,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  title: string;
  description: string;
  action: string;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <div className="button-row">
          <AlertDialogCancel disabled={busy}>取消</AlertDialogCancel>
          <button className="primary" disabled={busy} onClick={onConfirm}>
            {action}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
function CheckInPanel({ state, save, busy, close }: PanelProps) {
  const today = dayKey();
  const [check, setCheck] = useState<CheckIn>(
    state.checkins.find((c) => c.date === today) ?? {
      date: today,
      soreness: [],
      tags: [],
      note: '',
      exclusion_flag: false,
    },
  );
  const update = (patch: Partial<CheckIn>) => setCheck({ ...check, ...patch });
  return (
    <form
      className="panel-body form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await save({
            ...state,
            checkins: [
              ...state.checkins.filter((c) => c.date !== today),
              {
                ...check,
                exclusion_flag: shouldExcludeCheckIn(check.tags),
              },
            ],
          })
        )
          close();
      }}
    >
      <p className="muted">今天的感受 · 所有欄位皆可選填</p>
      <div className="form-grid">
        <Field label="睡眠時長（小時）">
          <input
            type="number"
            min="0"
            max="24"
            step=".25"
            value={check.sleep ?? ''}
            placeholder="例如 7.5"
            onChange={(e) =>
              update({
                sleep: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </Field>
        <Field label="晨間 HRV（ms）">
          <input
            type="number"
            min="1"
            max="300"
            value={check.hrv ?? ''}
            placeholder="例如 68"
            onChange={(e) =>
              update({
                hrv: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </Field>
      </div>
      <Choice
        label="睡眠品質"
        value={check.quality === undefined ? '' : String(check.quality)}
        options={[
          { value: '', label: '未填寫' },
          ...['很差', '較差', '普通', '良好', '很好'].map((label, i) => ({
            value: String(i + 1),
            label,
          })),
        ]}
        onChange={(v) => update({ quality: v ? Number(v) : undefined })}
      />
      <Choice
        label="主觀疲勞"
        value={check.fatigue === undefined ? '' : String(check.fatigue)}
        options={[
          { value: '', label: '未填寫' },
          ...[
            '1 · 精神充足',
            '2 · 輕微疲勞',
            '3 · 普通',
            '4 · 明顯疲勞',
            '5 · 非常疲勞',
          ].map((label, i) => ({ value: String(i + 1), label })),
        ]}
        onChange={(v) => update({ fatigue: v ? Number(v) : undefined })}
      />
      <Field label="體重（kg）">
        <input
          type="number"
          min="20"
          max="350"
          step=".1"
          value={check.weight ?? ''}
          placeholder="選填"
          onChange={(e) =>
            update({
              weight: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </Field>
      <Checks
        label="肌肉痠痛部位"
        options={parts}
        values={check.soreness}
        onChange={(v) => update({ soreness: v as Part[] })}
      />
      <Checks
        label="生理狀況"
        options={[...exclusionTags]}
        values={check.tags}
        onChange={(tags) => update({ tags })}
      />
      <Field label="生理狀況備註">
        <textarea
          value={check.note}
          placeholder="其他需要記下的身體狀況"
          onChange={(e) => update({ note: e.target.value })}
          maxLength={1000}
        />
      </Field>
      {shouldExcludeCheckIn(check.tags) && (
        <p className="info-note">
          今天會排除於訓練干擾歸因，恢復分數仍照實計算。
        </p>
      )}
      <button className="primary full" disabled={busy}>
        <Check size={18} />
        {busy ? '儲存中…' : '儲存紀錄'}
      </button>
    </form>
  );
}
function RacesPanel({ state, open }: PanelProps) {
  const sorted = [...state.races].sort(
    (a, b) =>
      Number(a.completed) - Number(b.completed) ||
      a.priority - b.priority ||
      a.date.localeCompare(b.date),
  );
  return (
    <div className="panel-body">
      <div className="section-head">
        <h2>{sorted.length} 場賽事</h2>
        <IconButton
          label="新增賽事"
          icon={Plus}
          onClick={() => open('newRace')}
        />
      </div>
      {sorted.length ? (
        sorted.map((r) => (
          <button
            className="race-row"
            key={r.id}
            onClick={() => open('race', r.id)}
          >
            <Flag size={22} />
            <span>
              <strong>{r.name}</strong>
              <small>
                {r.date} ·{' '}
                {r.completed
                  ? '已完成 · ' + (r.result || '未填成績')
                  : r.priority === 1
                    ? '主要賽事'
                    : '次要賽事'}
              </small>
            </span>
            <ChevronRight size={18} />
          </button>
        ))
      ) : (
        <Empty
          title="下一個目標，從這裡開始"
          sub="加入馬拉松、HYROX 或鐵人三項賽事。"
        />
      )}
      <button className="secondary full spaced" onClick={() => open('newRace')}>
        <Plus size={18} />
        新增賽事
      </button>
    </div>
  );
}
function RacePanel({ panel, state, open, save, busy }: PanelProps) {
  const [confirm, setConfirm] = useState(false);
  const race = state.races.find((r) => r.id === panel.id);
  if (!race) return <div className="panel-body">找不到賽事</div>;
  const logs = state.logs.length,
    plans = state.workouts.filter((w) => w.sport !== 'Rest').length,
    done = state.workouts.filter((w) =>
      state.logs.some((l) => l.planId === w.id),
    ).length;
  return (
    <div className="panel-body form">
      <div className="detail-hero">
        <Flag size={32} />
        <span className="eyebrow">
          {race.type} · {race.category}
        </span>
        <h2>{race.name}</h2>
        <p>
          {race.date} · {race.location || '地點未填'}
        </p>
      </div>
      <div className="detail-metrics">
        <div>
          <span>{race.completed ? '完賽成績' : '備賽倒數'}</span>
          <strong>
            {race.completed
              ? race.result || '—'
              : Math.max(0, daysUntil(race.date))}
            <small>{!race.completed && ' 天'}</small>
          </strong>
        </div>
        <div>
          <span>目標成績</span>
          <strong className="time-value">{race.target}</strong>
        </div>
      </div>
      <div>
        <div className="section-head">
          <h3>課表完成率</h3>
          <span>
            {done} / {plans}
          </span>
        </div>
        <progress max={Math.max(plans, 1)} value={done} />
        <p className="caption spaced">
          目前共 {logs} 筆訓練紀錄。體能測試尚未接入，備賽綜合進度待計算。
        </p>
      </div>
      <Choice
        label="優先程度"
        value={String(race.priority)}
        options={[
          { value: '1', label: '主要賽事' },
          { value: '2', label: '次要賽事' },
          { value: '3', label: '練習賽事' },
        ]}
        onChange={async (v) => {
          if (!busy)
            await save({
              ...state,
              races: state.races.map((r) =>
                r.id === race.id
                  ? { ...r, priority: Number(v) }
                  : Number(v) === 1 && r.priority === 1
                    ? { ...r, priority: 2 }
                    : r,
              ),
            });
        }}
      />
      <button
        className="primary full"
        onClick={() => open('editRace', race.id)}
      >
        編輯賽事
      </button>
      <button className="danger-link" onClick={() => setConfirm(true)}>
        刪除賽事
      </button>
      <Confirm
        open={confirm}
        setOpen={setConfirm}
        title="刪除這場賽事？"
        description="將移除賽事與目標成績，訓練紀錄會保留。"
        action="刪除賽事"
        busy={busy}
        onConfirm={async () => {
          if (
            await save(
              { ...state, races: state.races.filter((r) => r.id !== race.id) },
              '已刪除賽事',
            )
          )
            open('races');
        }}
      />
    </div>
  );
}
function RaceForm({ panel, state, save, busy, open }: PanelProps) {
  const original = state.races.find((r) => r.id === panel.id);
  const [race, setRace] = useState<Race>(
    original ?? {
      id: uid(),
      name: '',
      type: 'HYROX',
      date: '',
      target: '01:10:00',
      location: '',
      priority: state.races.length ? 2 : 1,
      completed: false,
      result: '',
      category: 'Open',
    },
  );
  const update = (v: Partial<Race>) => setRace({ ...race, ...v });
  return (
    <form
      className="panel-body form"
      onSubmit={async (e) => {
        e.preventDefault();
        const next = {
          ...race,
          name: race.name.trim(),
          target: race.target.trim(),
        };
        if (!next.name) return;
        if (
          await save(
            {
              ...state,
              races: [
                ...state.races
                  .filter((r) => r.id !== race.id)
                  .map((r) =>
                    race.priority === 1 && r.priority === 1
                      ? { ...r, priority: 2 }
                      : r,
                  ),
                next,
              ],
            },
            '賽事已儲存',
          )
        )
          open('race', race.id);
      }}
    >
      <Choice
        label="賽事類型"
        value={race.type}
        options={[
          { value: 'HYROX', label: 'HYROX' },
          { value: 'Marathon', label: '馬拉松' },
          { value: 'Triathlon', label: '鐵人三項' },
        ]}
        onChange={(v) =>
          update({
            type: v as Race['type'],
            category:
              v === 'HYROX' ? 'Open' : v === 'Marathon' ? '全馬' : '標準距離',
          })
        }
      />
      <Choice
        label="組別"
        value={race.category}
        options={(race.type === 'HYROX'
          ? ['Open', 'Pro', 'Doubles', 'Relay']
          : race.type === 'Marathon'
            ? ['全馬', '半馬', '10K']
            : ['標準距離', '半程超鐵', '超級鐵人', '短距離']
        ).map((v) => ({ value: v, label: v }))}
        onChange={(category) => update({ category })}
      />
      <Field label="賽事名稱">
        <input
          required
          maxLength={100}
          value={race.name}
          placeholder="例如 HYROX Taipei"
          onChange={(e) => update({ name: e.target.value })}
        />
      </Field>
      <div className="form-grid">
        <Field label="賽事日期">
          <input
            required
            type="date"
            value={race.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </Field>
        <Field label="目標時間（時:分:秒）">
          <input
            required
            pattern="[0-9]{1,2}:[0-5][0-9]:[0-5][0-9]"
            value={race.target}
            onChange={(e) => update({ target: e.target.value })}
          />
        </Field>
      </div>
      <Field label="地點（選填）">
        <input
          maxLength={150}
          value={race.location}
          onChange={(e) => update({ location: e.target.value })}
        />
      </Field>
      <Choice
        label="優先程度"
        value={String(race.priority)}
        options={[
          { value: '1', label: '主要賽事' },
          { value: '2', label: '次要賽事' },
          { value: '3', label: '練習賽事' },
        ]}
        onChange={(v) => update({ priority: Number(v) })}
      />
      <Checks
        label="賽事狀態"
        options={['已完成賽事']}
        values={race.completed ? ['已完成賽事'] : []}
        onChange={(v) => update({ completed: v.length > 0 })}
      />
      {race.completed && (
        <Field label="完賽成績（時:分:秒）">
          <input
            pattern="[0-9]{1,2}:[0-5][0-9]:[0-5][0-9]"
            value={race.result}
            placeholder="選填"
            onChange={(e) => update({ result: e.target.value })}
          />
        </Field>
      )}
      {state.races.some((r) => r.id !== race.id) && (
        <p className="info-note">
          賽事將共用目前訓練週期；主要賽事優先影響備戰階段。
        </p>
      )}
      <button className="primary full" disabled={busy}>
        {busy ? '儲存中…' : '儲存賽事'}
      </button>
    </form>
  );
}
