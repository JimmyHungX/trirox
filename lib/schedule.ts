import type { Workout } from './training';

export function orderedWorkouts(workouts: Workout[]) {
  return [...workouts].sort((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder || a.time.localeCompare(b.time);
  });
}

export function moveWorkoutToSlot(
  workouts: Workout[],
  workoutId: string,
  destinationDate: string,
  destinationIndex: number,
) {
  const moving = workouts.find((workout) => workout.id === workoutId);
  if (!moving) return { workouts, changed: false, index: destinationIndex };

  const source = orderedWorkouts(
    workouts.filter((workout) => workout.date === moving.date),
  );
  const originalIndex = source.findIndex((workout) => workout.id === workoutId);
  const sameDate = moving.date === destinationDate;
  const destination = orderedWorkouts(
    workouts.filter(
      (workout) => workout.date === destinationDate && workout.id !== workoutId,
    ),
  );
  let index = Math.max(0, Math.min(destinationIndex, destination.length));
  if (sameDate && originalIndex < destinationIndex) index -= 1;
  index = Math.max(0, Math.min(index, destination.length));

  if (sameDate && index === originalIndex)
    return { workouts, changed: false, index };

  destination.splice(index, 0, { ...moving, date: destinationDate });
  const orders = new Map<string, number>();
  destination.forEach((workout, position) => orders.set(workout.id, position));
  if (!sameDate)
    source
      .filter((workout) => workout.id !== workoutId)
      .forEach((workout, position) => orders.set(workout.id, position));

  return {
    changed: true,
    index,
    workouts: workouts.map((workout) => {
      const order = orders.get(workout.id);
      if (order === undefined) return workout;
      if (workout.id === workoutId)
        return {
          ...workout,
          date: destinationDate,
          order,
          version: workout.version + 1,
        };
      return { ...workout, order };
    }),
  };
}
