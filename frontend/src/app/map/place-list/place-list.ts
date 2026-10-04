import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../core/icons';

/** One row of the keyboard / screen-reader place list (LSA-A1). */
export interface PlaceListItem {
  id: string;
  name: string;
  category: string;
  ratingLabel: string;
  symbol: string;
  color: string;
  symbolColor: string;
  wheelchairAccessible: boolean;
  distance: string;
}

/**
 * Text alternative to the map: the approved places in the current view,
 * nearest first. Selecting one opens its popup on the map.
 */
@Component({
  selector: 'app-place-list',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './place-list.html',
  styleUrl: './place-list.scss',
})
export class PlaceListComponent {
  readonly places = input.required<PlaceListItem[]>();
  /** Places in view, including any beyond the rendered rows. */
  readonly total = input.required<number>();
  readonly nearUser = input(false);

  readonly selectPlace = output<{ id: string; trigger: HTMLElement }>();
  readonly closed = output<void>();
}
