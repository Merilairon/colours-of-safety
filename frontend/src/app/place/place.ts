import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, catchError, of, switchMap, throwError } from 'rxjs';
import { MarkingsService } from '../core/markings.service';
import { Poi, District } from '../core/models';
import { SeoService } from '../core/seo.service';
import { safetyColor, safetyLabel, safetyIndicator } from '../core/safety';
import { POI_CATEGORY_LABELS } from '../core/safety';

type Place = Poi | District;

const BASE_URL = 'https://coloursofsafety.com';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Maps a 404 to `null` so the caller can fall through to the next lookup. */
function nullIfNotFound<T>(request: Observable<T | null>): Observable<T | null> {
  return request.pipe(
    catchError((err: unknown) =>
      err instanceof HttpErrorResponse && err.status === 404 ? of(null) : throwError(() => err),
    ),
  );
}

@Component({
  selector: 'app-place',
  imports: [RouterLink, DatePipe],
  templateUrl: './place.html',
  styleUrl: './place.scss',
})
export class PlaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly markings = inject(MarkingsService);
  private readonly seo = inject(SeoService);

  protected readonly place = signal<Place | null>(null);
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
          const id = params.get('id') ?? '';
          this.loading.set(true);
          this.notFound.set(false);
          this.error.set(null);
          if (!UUID.test(id)) {
            return of(null);
          }
          // An id is either a place (POI) or a district; try both.
          return nullIfNotFound(this.markings.getPoiById(id)).pipe(
            switchMap((poi) =>
              poi ? of<Place>(poi) : nullIfNotFound(this.markings.getDistrictById(id)),
            ),
          );
        }),
      )
      .subscribe({
        next: (place) => {
          this.place.set(place);
          this.notFound.set(!place);
          this.loading.set(false);
          this.updateSeo(place);
        },
        error: () => {
          this.error.set('Could not load place details. Please try again later.');
          this.loading.set(false);
          this.seo.updateSeo({
            title: 'Place unavailable | Colours of Safety',
            description: 'This place could not be loaded.',
            robots: 'noindex,nofollow',
          });
        },
      });
  }

  protected isPoi(place: Place): place is Poi {
    return 'category' in place;
  }

  protected getCoordinates(place: Place): [number, number] {
    if (this.isPoi(place)) {
      const [lng, lat] = place.location.coordinates;
      return [lat, lng];
    }
    // Centre of the district's bounding box.
    const ring = place.area.coordinates[0];
    const lngs = ring.map(([lng]) => lng);
    const lats = ring.map(([, lat]) => lat);
    return [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];
  }

  protected mapQueryParams(place: Place): Record<string, string> {
    const [lat, lng] = this.getCoordinates(place);
    return { lat: lat.toFixed(6), lng: lng.toFixed(6), z: this.isPoi(place) ? '17' : '14' };
  }

  private updateSeo(place: Place | null): void {
    if (!place) {
      this.seo.updateSeo({
        title: 'Place not found | Colours of Safety',
        description: "This place doesn't exist or hasn't been approved yet.",
        robots: 'noindex,nofollow',
      });
      return;
    }
    const kind = this.isPoi(place) ? (this.categoryLabels[place.category] ?? 'Place') : 'District';
    const summary = place.description?.trim()
      ? place.description.trim()
      : `${kind} rated "${safetyLabel(place.safetyRating)}" for LGBTQIA+ safety on the Colours of Safety community map.`;
    this.seo.updateSeo({
      title: `${place.name} · ${kind} | Colours of Safety`,
      description: summary.length > 160 ? `${summary.slice(0, 157)}…` : summary,
      canonicalUrl: `${BASE_URL}/place/${place.id}`,
      // Only approved places are public; pending ones are visible to their author.
      robots: place.status === 'approved' ? 'index,follow' : 'noindex,nofollow',
    });
  }
}
