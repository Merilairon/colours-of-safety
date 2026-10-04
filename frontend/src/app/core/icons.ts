import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Stroke icons (24×24, drawn with `currentColor`) that replace emoji in the UI
 * (LSA-A10). Emoji render differently per platform and screen readers read
 * them out ("thumbs up sign"), so every icon here is decorative: the control
 * that contains it must carry its own text or aria-label.
 */
export const ICON_PATHS = {
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M20 20l-4.35-4.35',
  locate:
    'M12 2v3 M12 19v3 M2 12h3 M19 12h3 M12 6a6 6 0 1 0 0 12a6 6 0 1 0 0-12z M12 10a2 2 0 1 0 0 4a2 2 0 1 0 0-4z',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
  flag: 'M5 21V4 M5 4h12l-2.5 4.5L17 13H5',
  edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6 M10 11v6 M14 11v6',
  'thumbs-up':
    'M7 10v11 M3 10h4v11H3z M7 10l4-8a3 3 0 0 1 3.5 3.5L14 9h5.5a2 2 0 0 1 2 2.4l-1.6 7.8A2 2 0 0 1 18 21H7',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2',
  list: 'M9 6h12 M9 12h12 M9 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
  filter: 'M3 5h18 M6 12h12 M10 19h4',
  plus: 'M12 5v14 M5 12h14',
  polygon: 'M5 9l6-5 9 4-2 11-12 1z',
  contrast: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 3a9 9 0 0 1 0 18z',
  close: 'M6 6l12 12 M18 6L6 18',
  layers: 'M12 3l9 5-9 5-9-5z M3 13l9 5 9-5',
  'external-link': 'M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
} as const;

export type IconName = keyof typeof ICON_PATHS;

/** The same icon as an HTML string, for Leaflet popups built outside Angular. */
export function iconSvg(name: IconName): string {
  return (
    `<svg class="icon" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" ` +
    `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="${ICON_PATHS[name]}"/></svg>`
  );
}

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'icon' },
  template: `
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      focusable="false"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path [attr.d]="path()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: -0.125em;
      flex-shrink: 0;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  protected readonly path = computed(() => ICON_PATHS[this.name()]);
}
