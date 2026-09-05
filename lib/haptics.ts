export type HapticStrength = 'light' | 'medium';

const patterns: Record<HapticStrength, number | number[]> = {
  light: 10,
  medium: [18, 24, 18],
};

export function haptic(strength: HapticStrength) {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.vibrate !== 'function'
  )
    return;

  try {
    navigator.vibrate(patterns[strength]);
  } catch {
    // Vibration is progressive enhancement; unsupported platforms stay silent.
  }
}
