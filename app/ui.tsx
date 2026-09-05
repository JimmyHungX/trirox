'use client';
import {
  Activity,
  Bike,
  Waves,
  Dumbbell,
  BedDouble,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import type { ReactNode } from 'react';
import type { Sport } from '@/lib/training';
export function SportIcon({
  sport,
  size = 26,
}: {
  sport: Sport;
  size?: number;
}) {
  const Icon = {
    Run: Activity,
    Bike,
    Waves,
    Swim: Waves,
    HYROX: Dumbbell,
    Rest: BedDouble,
  }[sport];
  return <Icon size={size} strokeWidth={1.7} />;
}
export function IconButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={22} />
    </button>
  );
}
export function SectionHead({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Ring({
  score,
  label = '恢復分數',
  small = false,
  frameless = false,
}: {
  score: number | null;
  label?: string;
  small?: boolean;
  frameless?: boolean;
}) {
  return (
    <div
      className={
        'ring ' +
        (small ? 'ring-small ' : '') +
        (frameless ? 'ring-frameless' : '')
      }
      role={frameless ? undefined : 'img'}
      aria-label={frameless ? undefined : label + ' ' + (score ?? '尚無數據')}
    >
      {!frameless && (
        <svg viewBox="0 0 160 160" aria-hidden="true">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="#e8e9eb"
            strokeWidth="8"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="#111"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={440}
            strokeDashoffset={440 * (1 - (score ?? 0) / 100)}
            transform="rotate(-90 80 80)"
          />
        </svg>
      )}
      <div
        aria-label={frameless ? label + ' ' + (score ?? '尚無數據') : undefined}
      >
        <strong key={score ?? 'empty'} className="number-transition">
          {score ?? '—'}
        </strong>
        <span>{label === '恢復分數' ? '/100' : label}</span>
      </div>
    </div>
  );
}
export function Spark({ values, label }: { values: number[]; label: string }) {
  const min = Math.min(...values),
    max = Math.max(...values),
    points = values.map((v, i) => [
      4 + (i * 112) / Math.max(values.length - 1, 1),
      38 - ((v - min) / (max - min || 1)) * 30,
    ]);
  return (
    <svg
      className="spark"
      viewBox="0 0 120 44"
      role="img"
      aria-label={label + '：' + values.join('、')}
    >
      <polyline
        points={points.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="1.8" fill="currentColor" />
      ))}
    </svg>
  );
}
export function Row({
  icon: Icon,
  title,
  sub,
  onClick,
  tail,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  onClick: () => void;
  tail?: ReactNode;
}) {
  return (
    <button className="list-row" onClick={onClick}>
      <Icon size={26} strokeWidth={1.6} />
      <span>
        <strong>{title}</strong>
        {sub && <small>{sub}</small>}
      </span>
      {tail ?? <ChevronRight size={20} />}
    </button>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <Select
        value={value}
        onValueChange={(v) => v !== null && onChange(v)}
        items={options}
      >
        <SelectTrigger aria-label={label} className="choice">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="range-field">
      <div>
        <span>{label}</span>
        <strong>
          {value} {unit}
        </strong>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
      <div className="range-ends">
        <small>{min}</small>
        <small>{max}</small>
      </div>
    </div>
  );
}
export function Checks({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <fieldset className="checks">
      <legend>{label}</legend>
      <div>
        {options.map((o) => (
          <label key={o}>
            <Checkbox
              checked={values.includes(o)}
              onCheckedChange={(v) =>
                onChange(v ? [...values, o] : values.filter((x) => x !== o))
              }
            />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
export function Empty({
  title,
  sub,
  action,
  onClick,
}: {
  title: string;
  sub: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className="empty">
      <Activity size={28} />
      <h3>{title}</h3>
      <p>{sub}</p>
      {action && (
        <button className="secondary" onClick={onClick}>
          {action}
        </button>
      )}
    </div>
  );
}
