class HapticFeedbackController {
  private enabled = true;

  public setEnabled(next: boolean): void {
    this.enabled = next;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public trigger(pattern: 'tap' | 'message' | 'achievement' | 'alert'): void {
    if (!this.enabled) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    try {
      switch (pattern) {
        case 'tap':
          navigator.vibrate(14);
          break;
        case 'message':
          navigator.vibrate([20, 40, 20]);
          break;
        case 'achievement':
          navigator.vibrate([30, 50, 45, 50, 70]);
          break;
        case 'alert':
          navigator.vibrate([45, 30, 45]);
          break;
      }
    } catch {
      // Ignore unsupported environments
    }
  }
}

export const haptics = new HapticFeedbackController();
