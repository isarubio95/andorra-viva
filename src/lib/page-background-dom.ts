import type { PageBackground } from '@/constants/page-backgrounds';

const CUSTOM_CLASS = 'page-bg-custom';
const COLOR_VAR = '--page-bg-color';
const IMAGE_VAR = '--page-bg-image';

export function clearPageBackgroundOnBody(target: HTMLElement = document.body): void {
  target.classList.remove(CUSTOM_CLASS);
  target.style.removeProperty(COLOR_VAR);
  target.style.removeProperty(IMAGE_VAR);
}

/** Aplica un fondo de página al body (o limpia si es default). */
export function applyPageBackgroundToBody(
  background: PageBackground,
  target: HTMLElement = document.body,
): void {
  if (background.mode === 'default') {
    clearPageBackgroundOnBody(target);
    return;
  }

  target.classList.add(CUSTOM_CLASS);

  if (background.mode === 'color') {
    target.style.setProperty(COLOR_VAR, background.color);
    target.style.removeProperty(IMAGE_VAR);
    return;
  }

  target.style.removeProperty(COLOR_VAR);
  target.style.setProperty(IMAGE_VAR, `url("${background.imageUrl}")`);
}
