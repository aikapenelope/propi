/**
 * Haptic feedback for PWA interactions.
 * Uses the Vibration API (Android + Chrome). Silent no-op on iOS/unsupported.
 */

/** Light tap — button press, toggle, nav tap */
export function hapticLight() {
  navigator.vibrate?.(8);
}

/** Medium tap — drag drop, task complete, form submit */
export function hapticMedium() {
  navigator.vibrate?.(15);
}

/** Success pattern — save, publish, send */
export function hapticSuccess() {
  navigator.vibrate?.([10, 50, 10]);
}

/** Error pattern — validation fail, delete confirm */
export function hapticError() {
  navigator.vibrate?.([30, 50, 30]);
}
