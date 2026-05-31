import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { MarkingsService } from '../core/markings.service';
import { District, Poi, ReviewStatus } from '../core/models';
import { safetyColor, safetyLabel } from '../core/safety';

interface SubmissionRow {
  id: string;
  kind: 'poi' | 'district';
  name: string;
  category?: string;
  safetyRating: number;
  status: ReviewStatus;
  reviewNote: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-my-submissions',
  imports: [RouterLink],
  templateUrl: './my-submissions.html',
  styleUrl: './my-submissions.scss',
})
export class MySubmissionsComponent implements OnInit {
  private readonly markings = inject(MarkingsService);

  protected readonly rows = signal<SubmissionRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly safetyLabel = safetyLabel;
  protected readonly colorFor = safetyColor;

  ngOnInit(): void {
    Promise.all([
      this.toRows(this.markings.getMyPois(), 'poi'),
      this.toRows(this.markings.getMyDistricts(), 'district'),
    ])
      .then(([pois, districts]) => {
        const all = [...pois, ...districts].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );
        this.rows.set(all);
        this.loading.set(false);
      })
      .catch(() => {
        this.error.set('Could not load your submissions.');
        this.loading.set(false);
      });
  }

  private toRows(
    obs: Observable<Array<Poi | District>>,
    kind: 'poi' | 'district',
  ): Promise<SubmissionRow[]> {
    return new Promise((resolve, reject) => {
      obs.subscribe({
        next: (items) =>
          resolve(
            items.map((item) => ({
              id: item.id,
              kind,
              name: item.name,
              category: kind === 'poi' ? (item as Poi).category : undefined,
              safetyRating: item.safetyRating,
              status: item.status,
              reviewNote: item.reviewNote,
              createdAt: item.createdAt,
            })),
          ),
        error: reject,
      });
    });
  }
}
