import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { MarkingsService } from '../core/markings.service';
import { Poi, District } from '../core/models';
import { safetyColor, safetyLabel, safetyIndicator } from '../core/safety';
import { POI_CATEGORY_LABELS } from '../core/safety';

@Component({
  selector: 'app-place',
  imports: [RouterLink, DatePipe],
  templateUrl: './place.html',
  styleUrl: './place.scss',
})
export class PlaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly markings = inject(MarkingsService);

  protected readonly place = signal<Poi | District | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notFound = signal(false);

  protected readonly safetyLabel = safetyLabel;
  protected readonly colorFor = safetyColor;
  protected readonly indicatorFor = safetyIndicator;
  protected readonly categoryLabels = POI_CATEGORY_LABELS;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            this.notFound.set(true);
            this.loading.set(false);
            return [];
          }

          // Try POI first, then district
          return this.markings.getPoiById(id);
        }),
        switchMap((poi) => {
          if (poi) {
            return [poi];
          }

          const id = this.route.snapshot.paramMap.get('id')!;
          return this.markings.getDistrictById(id);
        }),
      )
      .subscribe({
        next: (place) => {
          if (place) {
            this.place.set(place);
          } else {
            this.notFound.set(true);
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Could not load place details.');
          this.loading.set(false);
        },
      });
  }

  protected isPoi(place: Poi | District): place is Poi {
    return 'category' in place;
  }

  protected getCoordinates(place: Poi | District): [number, number] {
    if (this.isPoi(place)) {
      const [lng, lat] = place.location.coordinates;
      return [lat, lng];
    } else {
      // For districts, use the first coordinate of the polygon
      const [lng, lat] = place.area.coordinates[0][0];
      return [lat, lng];
    }
  }

  protected getMapUrl(place: Poi | District): string {
    const [lat, lng] = this.getCoordinates(place);
    return `/#map=${lat}/${lng}`;
  }
}
