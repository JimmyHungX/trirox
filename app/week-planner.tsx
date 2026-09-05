'use client';

import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { motion, useDragControls, type PanInfo } from 'framer-motion';
import { Check, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useRef, useState, type CSSProperties } from 'react';
import { haptic } from '@/lib/haptics';
import type { AppState, Workout } from '@/lib/training';
import { Confirm } from './panels';
import { SportIcon } from './ui';

type WeekPlannerProps = {
  dates: string[];
  today: string;
  state: AppState;
  busy: boolean;
  open: (type: string, id?: string) => void;
  save: (next: AppState, message?: string) => Promise<boolean>;
};

export function WeekPlanner({
  dates,
  today,
  state,
  busy,
  open,
  save,
}: WeekPlannerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null);

  async function moveWorkout(event: DragEndEvent) {
    setActiveId(null);
    const workout = state.workouts.find((item) => item.id === event.active.id);
    const destination = event.over ? String(event.over.id) : '';
    if (
      !workout ||
      !dates.includes(destination) ||
      workout.date === destination ||
      state.logs.some((log) => log.planId === workout.id)
    )
      return;

    haptic('light');
    await save(
      {
        ...state,
        workouts: state.workouts.map((item) =>
          item.id === workout.id
            ? { ...item, date: destination, version: item.version + 1 }
            : item,
        ),
      },
      `已移至 ${shortDate(destination)}`,
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={(event) => setActiveId(String(event.active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={(event) => void moveWorkout(event)}
      >
        <p className="week-gesture-hint">
          <Trash2 size={15} />
          向右滑課表可刪除，刪除前會再次確認
        </p>
        <div className={`week-list${activeId ? ' is-dragging' : ''}`}>
          {dates.map((date) => (
            <WeekDay
              key={date}
              date={date}
              today={today}
              state={state}
              busy={busy}
              activeId={activeId}
              open={open}
              requestDelete={setPendingDelete}
            />
          ))}
        </div>
      </DndContext>
      <Confirm
        open={!!pendingDelete}
        setOpen={(isOpen) => !isOpen && setPendingDelete(null)}
        title="刪除這堂課表？"
        description={
          pendingDelete
            ? `${pendingDelete.title} 將從本週計畫移除。`
            : '這堂課表將從本週計畫移除。'
        }
        action="刪除課表"
        haptic="medium"
        busy={busy}
        onConfirm={async () => {
          if (!pendingDelete) return;
          if (
            await save(
              {
                ...state,
                workouts: state.workouts.filter(
                  (item) => item.id !== pendingDelete.id,
                ),
              },
              '課表已刪除',
            )
          )
            setPendingDelete(null);
        }}
      />
    </>
  );
}

function WeekDay({
  date,
  today,
  state,
  busy,
  activeId,
  open,
  requestDelete,
}: {
  date: string;
  today: string;
  state: AppState;
  busy: boolean;
  activeId: string | null;
  open: (type: string, id?: string) => void;
  requestDelete: (workout: Workout) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: date });
  const workouts = state.workouts
    .filter((workout) => workout.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div
      ref={setNodeRef}
      data-drop-date={date}
      className={`week-day${date === today ? ' current' : ''}${
        isOver && activeId ? ' drop-target' : ''
      }`}
    >
      <div className="day-label">
        <strong>{Number(date.slice(-2))}</strong>
        <span>週{'日一二三四五六'[new Date(date + 'T12:00:00').getDay()]}</span>
        {date === today && <span className="today-label">今天</span>}
      </div>
      <div>
        {workouts.length ? (
          workouts.map((workout) => (
            <SwipeableWorkout
              key={workout.id}
              workout={workout}
              completed={state.logs.some((log) => log.planId === workout.id)}
              busy={busy}
              open={open}
              requestDelete={requestDelete}
            />
          ))
        ) : (
          <button
            className="unscheduled"
            onClick={() => open('newWorkout', date)}
          >
            尚未安排
            <Plus size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function SwipeableWorkout({
  workout,
  completed,
  busy,
  open,
  requestDelete,
}: {
  workout: Workout;
  completed: boolean;
  busy: boolean;
  open: (type: string, id?: string) => void;
  requestDelete: (workout: Workout) => void;
}) {
  const locked = completed || busy;
  const controls = useDragControls();
  const swiping = useRef(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: workout.id, disabled: locked });
  const dragStyle: CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 5,
      }
    : undefined;

  function finishSwipe(_: PointerEvent, info: PanInfo) {
    swiping.current = Math.abs(info.offset.x) > 5;
    if (info.offset.x >= 88 || info.velocity.x >= 650) requestDelete(workout);
    window.setTimeout(() => {
      swiping.current = false;
    }, 0);
  }

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={`week-workout-drag${isDragging ? ' is-active' : ''}`}
    >
      <div className="swipe-delete-reveal" aria-hidden="true">
        <Trash2 size={19} />
        <span>刪除</span>
      </div>
      <motion.div
        className="week-workout-surface"
        drag={locked ? false : 'x'}
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ left: 0, right: 112 }}
        dragElastic={{ left: 0, right: 0.14 }}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 420, bounceDamping: 32 }}
        onDragStart={() => {
          swiping.current = true;
        }}
        onDragEnd={finishSwipe}
      >
        <button
          className="week-workout-main"
          onPointerDown={(event) => {
            if (!locked) controls.start(event);
          }}
          onClick={() => {
            if (!swiping.current) open('workout', workout.id);
          }}
        >
          <SportIcon sport={workout.sport} />
          <span>
            <strong>{workout.title}</strong>
            <small>
              {workout.minutes
                ? `${workout.minutes} 分鐘 · Zone ${workout.zone}`
                : '休息與恢復'}
            </small>
          </span>
        </button>
        {completed ? (
          <span className="week-workout-complete" aria-label="已完成">
            <Check size={18} />
          </span>
        ) : (
          <button
            type="button"
            className="week-drag-handle"
            aria-label={`拖曳移動${workout.title}`}
            title="拖曳移動"
            disabled={busy}
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={20} />
          </button>
        )}
      </motion.div>
    </div>
  );
}

function shortDate(date: string) {
  const parsed = new Date(date + 'T12:00:00');
  return parsed.toLocaleDateString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
}
