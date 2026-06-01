import { Component, OnInit, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { MarkingsService } from '../core/markings.service';
import { District, Poi, ReviewStatus } from '../core/models';
import { safetyColor, safetyLabel } from '../core/safety';

interface QueueItem {
  id: string;
  kind: 'poi' | 'district';
  name: string;
  description: string;
  category?: string;
  safetyRating: number;
  author: string;
  note: string;
  busy: boolean;
}

@Component({
  selector: 'app-review',
  imports: [],
  templateUrl: './review.html',
  styleUrl: './review.scss',
})
export class ReviewComponent implements OnInit {
  private readonly markings = inject(MarkingsService);

  protected readonly items = signal<QueueItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly safetyLabel = safetyLabel;
  protected readonly colorFor = safetyColor;

  // Filter
  protected readonly filterType = signal<'all' | 'poi' | 'district'>('all');
  protected readonly filteredItems = signal<QueueItem[]>([]);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    Promise.all([
      this.fetch(this.markings.getPendingPois(), 'poi'),
      this.fetch(this.markings.getPendingDistricts(), 'district'),
    ])
      .then(([pois, districts]) => {
        const all = [...pois, ...districts];
        this.items.set(all);
        this.applyFilter();
        this.loading.set(false);
      })
      .catch(() => {
        this.error.set('Could not load the review queue.');
        this.loading.set(false);
      });
  }

  protected setFilter(type: 'all' | 'poi' | 'district'): void {
    this.filterType.set(type);
    this.applyFilter();
  }

  private applyFilter(): void {
    const type = this.filterType();
    const all = this.items();
    if (type === 'all') {
      this.filteredItems.set(all);
    } else {
      this.filteredItems.set(all.filter((item) => item.kind === type));
    }
  }

  private fetch(
    obs: Observable<Array<Poi | District>>,
    kind: 'poi' | 'district',
  ): Promise<QueueItem[]> {
    return new Promise((resolve, reject) => {
      obs.subscribe({
        next: (rows) =>
          resolve(
            rows.map((row) => ({
              id: row.id,
              kind,
              name: row.name,
              description: row.description,
              category: kind === 'poi' ? (row as Poi).category : undefined,
              safetyRating: row.safetyRating,
              author: row.createdBy?.displayName ?? 'Unknown',
              note: '',
              busy: false,
            })),
          ),
        error: reject,
      });
    });
  }

  protected setNote(item: QueueItem, value: string): void {
    this.items.update((list) =>
      list.map((it) => (it.id === item.id ? { ...it, note: value } : it)),
    );
  }

  protected decide(item: QueueItem, status: ReviewStatus): void {
    if (status !== 'approved' && status !== 'rejected') {
      return;
    }
    this.setBusy(item, true);
    const payload = { status, reviewNote: item.note || undefined };
    const obs: Observable<Poi | District> =
      item.kind === 'poi'
        ? this.markings.reviewPoi(item.id, payload)
        : this.markings.reviewDistrict(item.id, payload);

    obs.subscribe({
      next: () => this.items.update((list) => list.filter((it) => it.id !== item.id)),
      error: () => {
        this.setBusy(item, false);
        this.error.set('Could not save your decision. Please try again.');
      },
    });
  }

  private setBusy(item: QueueItem, busy: boolean): void {
    this.items.update((list) => list.map((it) => (it.id === item.id ? { ...it, busy } : it)));
  }
}
