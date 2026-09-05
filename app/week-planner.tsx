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
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { haptic } from '@/lib/haptics';
import { moveWorkoutToSlot, orderedWorkouts } from '@/lib/schedule';
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
    const target = event.over?.data.current as
      | { date?: unknown; index?: unknown }
      | undefined;
    const destination = typeof target?.date === 'string' ? target.date : '';
    const destinationIndex =
      typeof target?.index === 'number' ? target.index : -1;
    if (
      !workout ||
      !dates.includes(destination) ||
      destinationIndex < 0 ||
      state.logs.some((log) => log.planId === workout.id)
    )
      return;

    const result = moveWorkoutToSlot(
      state.workouts,
      workout.id,
      destination,
      destinationIndex,
    );
    if (!result.changed) return;

    haptic('light');
    await save(
      {
        ...state,
        workouts: result.workouts,
      },
      workout.date === destination
        ? `已調整 ${shortDate(destination)} 的課表順序`
        : `已插入 ${shortDate(destination)}，位於第 ${result.index + 1} 堂`,
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
          拖到課表之間可插入 · 向右滑可刪除
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
  const workouts = orderedWorkouts(
    state.workouts.filter((workout) => workout.date === date),
  );
  const { isOver, setNodeRef } = useDroppable({
    id: `empty-day:${date}`,
    data: { date, index: 0 },
    disabled: workouts.length > 0,
  });

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
          <div className="week-workout-stack">
            <InsertSlot date={date} active={Boolean(activeId)} />
            {workouts.map((workout, index) => (
              <WorkoutDropTarget
                key={workout.id}
                date={date}
                index={index + 1}
                workoutId={workout.id}
                active={Boolean(activeId)}
              >
                <SwipeableWorkout
                  workout={workout}
                  completed={state.logs.some(
                    (log) => log.planId === workout.id,
                  )}
                  busy={busy}
                  open={open}
                  requestDelete={requestDelete}
                />
              </WorkoutDropTarget>
            ))}
          </div>
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

function InsertSlot({ date, active }: { date: string; active: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `insert-before:${date}`,
    data: { date, index: 0 },
    disabled: !active,
  });
  return (
    <div
      ref={setNodeRef}
      className={`week-insert-slot${active ? ' is-active' : ''}${
        isOver ? ' is-over' : ''
      }`}
      aria-hidden="true"
    />
  );
}

function WorkoutDropTarget({
  date,
  index,
  workoutId,
  active,
  children,
}: {
  date: string;
  index: number;
  workoutId: string;
  active: boolean;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `insert-after:${workoutId}`,
    data: { date, index },
    disabled: !active,
  });
  return (
    <div
      ref={setNodeRef}
      className={`week-workout-drop${isOver ? ' is-over' : ''}`}
    >
      {children}
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
