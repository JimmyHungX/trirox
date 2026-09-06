'use client';
import { useState } from 'react';
import {
  Download,
  Watch,
  Heart,
  Plus,
  Trash2,
  Smartphone,
  Database,
  RotateCcw,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  type Settings,
  type Sport,
  type Part,
  type Injury,
  sports,
  sportNames,
  parts,
  seed,
  uid,
} from '@/lib/training';
import { Choice, Field, Range, Checks, IconButton, Empty } from './ui';
import { Confirm, type PanelProps } from './panels';

declare const __TRIROX_STORAGE_MODE__: 'api' | 'local';

export function TrainingSettings({ state, save, busy, close }: PanelProps) {
  const [s, setS] = useState<Settings>(state.settings);
  const update = (v: Partial<Settings>) => setS({ ...s, ...v });
  return (
    <form
      className="panel-body form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await save({ ...state, settings: s }, '訓練設定已儲存')) close();
      }}
    >
      <h3>可訓練時間</h3>
      <Checks
        label="每週可訓練日"
        options={['日', '一', '二', '三', '四', '五', '六']}
        values={s.days.map((i) => '日一二三四五六'[i])}
        onChange={(v) =>
          update({ days: v.map((x) => '日一二三四五六'.indexOf(x)) })
        }
      />
      <Field label="偏好開始時間">
        <input
          type="time"
          required
          value={s.time}
          onChange={(e) => update({ time: e.target.value })}
        />
      </Field>
      <Checks
        label="可用器材與場地"
        options={sports.filter((x) => x !== 'Rest').map((x) => sportNames[x])}
        values={s.equipment.map((x) => sportNames[x])}
        onChange={(v) =>
          update({ equipment: sports.filter((x) => v.includes(sportNames[x])) })
        }
      />
      <hr />
      <h3>運動能力設定</h3>
      <div className="toggle-row">
        <label htmlFor="baselines-known">我知道自己的配速與 FTP</label>
        <Switch
          id="baselines-known"
          aria-label="我知道自己的配速與 FTP"
          checked={s.baselinesKnown !== false}
          onCheckedChange={(baselinesKnown) => update({ baselinesKnown })}
        />
      </div>
      {s.baselinesKnown !== false && (
        <>
          <div className="form-grid">
            <Field label="跑步基準配速（分:秒/km）">
              <input
                required
                pattern="[0-9]{1,2}:[0-5][0-9]"
                value={s.runPace}
                onChange={(e) => update({ runPace: e.target.value })}
              />
            </Field>
            <Field label="單車 FTP（W）">
              <input
                required
                type="number"
                min="30"
                max="600"
                value={s.ftp}
                onChange={(e) => update({ ftp: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="游泳配速（分:秒/100m）">
            <input
              required
              pattern="[0-9]{1,2}:[0-5][0-9]"
              value={s.swimPace}
              onChange={(e) => update({ swimPace: e.target.value })}
            />
          </Field>
        </>
      )}
      <Choice
        label="HYROX / 重訓程度"
        value={s.level}
        options={['初階', '中階', '進階'].map((v) => ({ value: v, label: v }))}
        onChange={(level) => update({ level })}
      />
      <hr />
      <h3>AI 訓練偏好</h3>
      <Range
        label="調整保守程度"
        value={s.conservative}
        min={0}
        max={100}
        unit="%"
        onChange={(conservative) => update({ conservative })}
      />
      <Choice
        label="優先保護的訓練"
        value={s.protect}
        options={sports
          .filter((x) => x !== 'Rest')
          .map((x) => ({ value: x, label: sportNames[x] }))}
        onChange={(v) => update({ protect: v as Sport })}
      />
      <Range
        label="最多連續訓練天數"
        value={s.consecutive}
        min={1}
        max={7}
        unit="天"
        onChange={(consecutive) => update({ consecutive })}
      />
      <Range
        label="單次最長訓練時間"
        value={s.maxMinutes}
        min={15}
        max={240}
        step={5}
        unit="分鐘"
        onChange={(maxMinutes) => update({ maxMinutes })}
      />
      <p className="info-note">
        AI 只能建議，不會自動修改課表。傷病限制永遠優先。
      </p>
      <button className="primary full" disabled={busy}>
        儲存訓練設定
      </button>
    </form>
  );
}
export function DevicesPanel(_props: PanelProps) {
  const [info, setInfo] = useState('');
  return (
    <div className="panel-body form">
      <p className="muted">
        在這裡管理訓練資料來源。目前使用手動紀錄，尚未連接穿戴裝置。
      </p>
      {[
        {
          name: 'Apple Health',
          icon: Heart,
          detail:
            '需透過原生 iOS App 的 HealthKit 授權，Safari 網頁無法直接讀取。',
        },
        {
          name: 'Garmin',
          icon: Watch,
          detail: '尚未配置 Garmin Health API 的應用授權與回呼服務。',
        },
        {
          name: 'COROS',
          icon: Watch,
          detail: '尚未配置 COROS 官方資料 API 授權。',
        },
      ].map((d) => (
        <button
          className="device-row"
          key={d.name}
          onClick={() => setInfo(d.detail)}
        >
          <d.icon size={25} />
          <span>
            <strong>{d.name}</strong>
            <small>未連線 · 尚無同步紀錄</small>
          </span>
          <span className="device-status">查看</span>
        </button>
      ))}
      {info && <p className="info-note">{info}</p>}
      <hr />
      <h3>資料權限</h3>
      <p className="caption">
        目前未授予任何外部裝置存取權。裝置連線啟用後，可在這裡查看授權範圍、最後同步時間與中止連線。
      </p>
    </div>
  );
}
export function InjuriesPanel({ state, save, busy }: PanelProps) {
  const [part, setPart] = useState<Part>('下肢'),
    [note, setNote] = useState(''),
    [excluded, setExcluded] = useState<string[]>([]),
    [editing, setEditing] = useState<string | null>(null),
    [remove, setRemove] = useState<string | null>(null);
  return (
    <div className="panel-body form">
      <p className="info-note">
        長期限制會優先排除訓練項目；當日痠痛請使用快速紀錄。
      </p>
      {state.injuries.length ? (
        state.injuries.map((x) => (
          <div className="injury-row" key={x.id}>
            <button
              onClick={() => {
                setEditing(x.id);
                setPart(x.part);
                setNote(x.note);
                setExcluded(x.excluded);
              }}
            >
              <strong>{x.part}</strong>
              <p>{x.note}</p>
              <small>
                排除：
                {x.excluded.map((s) => sportNames[s]).join('、') ||
                  '未指定項目'}
              </small>
            </button>
            <IconButton
              label={'刪除' + x.part + '限制'}
              icon={Trash2}
              onClick={() => setRemove(x.id)}
            />
          </div>
        ))
      ) : (
        <Empty
          title="目前沒有長期限制"
          sub="身體有需要留意的部位，可在下方加入。"
        />
      )}
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const injury: Injury = {
            id: editing ?? uid(),
            part,
            note: note.trim(),
            excluded: excluded as Sport[],
            updatedAt: new Date().toISOString(),
          };
          if (
            await save(
              {
                ...state,
                injuries: [
                  ...state.injuries.filter((i) => i.id !== injury.id),
                  injury,
                ],
              },
              '限制已更新',
            )
          ) {
            setEditing(null);
            setNote('');
            setExcluded([]);
          }
        }}
      >
        <h3>{editing ? '編輯限制' : '新增長期限制'}</h3>
        <Choice
          label="部位"
          value={part}
          options={parts.map((v) => ({ value: v, label: v }))}
          onChange={(v) => setPart(v as Part)}
        />
        <Field label="傷病或限制說明">
          <textarea
            required
            maxLength={1000}
            value={note}
            placeholder="例如膝蓋不適，避免跑跳"
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <Checks
          label="排除的訓練項目"
          options={sports.filter((s) => s !== 'Rest')}
          values={excluded}
          onChange={setExcluded}
        />
        <button className="primary full" disabled={busy}>
          <Plus size={18} />
          {editing ? '儲存修改' : '新增限制'}
        </button>
        {editing && (
          <button
            type="button"
            className="text-action"
            onClick={() => {
              setEditing(null);
              setNote('');
              setExcluded([]);
            }}
          >
            取消編輯
          </button>
        )}
      </form>
      <Confirm
        open={!!remove}
        setOpen={(v) => !v && setRemove(null)}
        title="刪除這項限制？"
        description="後續課表將不再排除此限制的項目。"
        action="確認刪除"
        haptic="medium"
        busy={busy}
        onConfirm={async () => {
          if (
            await save(
              {
                ...state,
                injuries: state.injuries.filter((i) => i.id !== remove),
              },
              '限制已刪除',
            )
          )
            setRemove(null);
        }}
      />
    </div>
  );
}
export function NotificationsPanel({ state, save, busy, close }: PanelProps) {
  const [n, setN] = useState(state.settings.notifications);
  return (
    <form
      className="panel-body form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await save(
            { ...state, settings: { ...state.settings, notifications: n } },
            '通知偏好已儲存',
          )
        )
          close();
      }}
    >
      <p className="info-note">此版本可儲存提醒偏好；背景推播服務尚未啟用。</p>
      <div>
        {Object.entries(n).map(([k, v]) => (
          <label className="toggle-row pressable" key={k}>
            <span>{k}</span>
            <Switch
              aria-label={k}
              checked={v}
              onCheckedChange={(checked) => setN({ ...n, [k]: checked })}
            />
          </label>
        ))}
      </div>
      <button className="primary full" disabled={busy}>
        儲存通知偏好
      </button>
    </form>
  );
}
export function AppSettings({ state, save, busy, close, notify }: PanelProps) {
  const [units, setUnits] = useState(state.settings.units),
    [confirm, setConfirm] = useState(false),
    [demoConfirm, setDemoConfirm] = useState(false);
  return (
    <div className="panel-body form">
      <Choice
        label="距離單位"
        value={units}
        options={[
          { value: 'km', label: '公里（km）' },
          { value: 'mi', label: '英里（mi）' },
        ]}
        onChange={(v) => setUnits(v as 'km' | 'mi')}
      />
      <div className="setting-static">
        <span>語言</span>
        <strong>繁體中文</strong>
      </div>
      <button
        className="secondary full"
        type="button"
        onClick={() => {
          location.href = '/?onboarding=1';
        }}
      >
        <RotateCcw size={18} />
        重新查看首次使用流程
      </button>
      <button
        className="primary full"
        data-haptic="light"
        disabled={busy}
        onClick={async () => {
          if (await save({ ...state, settings: { ...state.settings, units } }))
            close();
        }}
      >
        儲存設定
      </button>
      <hr />
      <h3>隱私與資料</h3>
      <p className="caption">
        {__TRIROX_STORAGE_MODE__ === 'local'
          ? '紀錄只保存在目前瀏覽器，不會跨裝置同步。清除瀏覽器資料前請先匯出備份。'
          : '此網站僅供擁有者存取，紀錄儲存在此網站的雲端資料庫。'}
        匯出檔包含課表、訓練回報、每日紀錄與設定，也可能包含身體狀況資料。
      </p>
      <button
        className="secondary full"
        data-haptic="light"
        onClick={() => {
          download(state);
          notify('資料已匯出');
        }}
      >
        <Download size={18} />
        匯出資料備份
      </button>
      {state.demo && (
        <>
          <p className="caption">
            目前是示範資料。開始個人紀錄會移除示範的賽事、課表與身體紀錄，保留你的訓練偏好。
          </p>
          <button className="secondary full" onClick={() => setConfirm(true)}>
            <UserIcon />
            開始我的個人紀錄
          </button>
        </>
      )}
      {!state.demo && (
        <>
          <p className="caption">
            示範資料包含 31
            天身體紀錄、歷史訓練、本週課表與賽事，可用來檢查完整介面。
          </p>
          <button
            className="secondary full"
            onClick={() => setDemoConfirm(true)}
          >
            <Database size={18} />
            載入完整示範資料
          </button>
        </>
      )}
      <hr />
      <h3>加入 iPhone 主畫面</h3>
      <p className="caption">
        在 Safari 開啟網站，點選分享，再選擇「加入主畫面」。
      </p>
      <div className="setting-static">
        <span>登入狀態</span>
        <strong>
          {__TRIROX_STORAGE_MODE__ === 'local' ? '本機資料模式' : '網站擁有者'}
        </strong>
      </div>
      <p className="caption">
        {__TRIROX_STORAGE_MODE__ === 'local'
          ? '此版本不需登入，資料由目前瀏覽器獨立保存。'
          : '存取由網站平台管理，帳號切換與登出請至 ChatGPT 帳號設定。'}
      </p>
      <Confirm
        open={confirm}
        setOpen={setConfirm}
        title="開始個人紀錄？"
        description="將移除目前示範資料，保留個人資料與訓練設定。建議先匯出備份。"
        action="開始個人紀錄"
        busy={busy}
        onConfirm={async () => {
          if (
            await save(
              {
                ...seed(undefined, false),
                user: state.user,
                settings: state.settings,
              },
              '已切換為個人紀錄',
            )
          )
            close();
        }}
      />
      <Confirm
        open={demoConfirm}
        setOpen={setDemoConfirm}
        title="載入示範資料？"
        description="目前的個人資料、課表與紀錄將由完整示範資料取代。需要保留時請先匯出備份。"
        action="載入示範資料"
        busy={busy}
        onConfirm={async () => {
          if (await save(seed(), '已載入完整示範資料')) close();
        }}
      />
    </div>
  );
}
function UserIcon() {
  return <Smartphone size={18} />;
}
export function ProfileEdit({ state, save, busy, close }: PanelProps) {
  const [user, setUser] = useState(state.user);
  return (
    <form
      className="panel-body form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await save(
            { ...state, user: { ...user, name: user.name.trim() } },
            '個人資料已儲存',
          )
        )
          close();
      }}
    >
      <Field label="名稱">
        <input
          required
          maxLength={80}
          value={user.name}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
        />
      </Field>
      <div className="form-grid">
        <Field label="身高（cm）">
          <input
            type="number"
            required
            min="80"
            max="250"
            value={user.height}
            onChange={(e) =>
              setUser({ ...user, height: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="體重（kg）">
          <input
            type="number"
            required
            min="20"
            max="350"
            step=".1"
            value={user.weight}
            onChange={(e) =>
              setUser({ ...user, weight: Number(e.target.value) })
            }
          />
        </Field>
      </div>
      <Choice
        label="運動經驗"
        value={user.experience}
        options={['初階', '中階', '進階'].map((v) => ({ value: v, label: v }))}
        onChange={(experience) => setUser({ ...user, experience })}
      />
      <button className="primary full" disabled={busy}>
        儲存個人資料
      </button>
    </form>
  );
}
function download(state: PanelProps['state']) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download =
    'TRIROX-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
