import * as Haptics from 'expo-haptics';

export async function hapticLight() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Ignore haptic failures gracefully on web and unsupported devices
  }
}

export async function hapticMedium() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Ignore haptic failures gracefully on web and unsupported devices
  }
}

export async function hapticSuccess() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignore haptic failures gracefully on web and unsupported devices
  }
}

export async function hapticError() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Ignore haptic failures gracefully on web and unsupported devices
  }
}

export async function hapticSelection() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ignore haptic failures gracefully on web and unsupported devices
  }
}
