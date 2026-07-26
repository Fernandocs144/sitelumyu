/**
 * Single source of scroll input for the Experience Engine.
 * Reads browser scroll and exposes normalized progress (0 → 1).
 */
export class ScrollController {
  constructor() {
    this._progress = 0;
    this._active = false;
    this._onChange = null;
    this._handleScroll = this._handleScroll.bind(this);
  }

  get progress() {
    return this._progress;
  }

  init(onChange) {
    this._onChange = onChange ?? null;
    this._active = true;
    this._handleScroll();
    window.addEventListener('scroll', this._handleScroll, { passive: true });
    window.addEventListener('resize', this._handleScroll, { passive: true });
  }

  _handleScroll() {
    if (!this._active) return;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const nextProgress =
      maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

    this._progress = nextProgress;
    this._onChange?.(nextProgress);
  }

  dispose() {
    window.removeEventListener('scroll', this._handleScroll);
    window.removeEventListener('resize', this._handleScroll);
    this._active = false;
    this._onChange = null;
    this._progress = 0;
  }
}
