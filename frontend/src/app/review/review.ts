import { Component, OnInit, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { MarkingsService } from '../core/markings.service';
import { District, EditProposal, EditProposalData, Poi, ReviewStatus } from '../core/models';
import { safetyColor, safetyLabel } from '../core/safety';

interface QueueItem {
  id: string;
  kind: 'poi' | 'district';
  isEdit: boolean;
  name: string;
  description: string;
  category?: string;
  safetyRating: number;
  author: string;
  note: string;
  busy: boolean;
  voteCount: number;
  originalData?: EditProposalData;
  proposedData?: EditProposalData;
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

  // Bulk actions
  protected readonly selectedIds = signal<Set<string>>(new Set());
  protected readonly bulkBusy = signal(false);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    Promise.all([
      this.fetch(this.markings.getPendingPois(), 'poi'),
      this.fetch(this.markings.getPendingDistricts(), 'district'),
      this.fetchEdits(),
    ])
      .then(([pois, districts, edits]) => {
        const all = [...pois, ...districts, ...edits];
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
    let all = this.items();
    if (type !== 'all') {
      all = all.filter((item) => item.kind === type);
    }
    // Sort by vote count descending (highest voted first)
    this.filteredItems.set(all.sort((a, b) => b.voteCount - a.voteCount));
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
              isEdit: false,
              name: row.name,
              description: row.description,
              category: kind === 'poi' ? (row as Poi).category : undefined,
              safetyRating: row.safetyRating,
              author: row.createdBy?.displayName ?? 'Unknown',
              note: '',
              busy: false,
              voteCount: row.voteCount || 0,
            })),
          ),
        error: reject,
      });
    });
  }

  private fetchEdits(): Promise<QueueItem[]> {
    return new Promise((resolve, reject) => {
      this.markings.getPendingEdits().subscribe({
        next: (edits) =>
          resolve(
            edits.map((edit) => ({
              id: edit.id,
              kind: edit.targetType,
              isEdit: true,
              name: edit.proposedData.name ?? edit.originalData.name ?? 'Unknown',
              description: edit.proposedData.description ?? edit.originalData.description ?? '',
              category:
                edit.targetType === 'poi'
                  ? (edit.proposedData.category ?? edit.originalData.category)
                  : undefined,
              safetyRating: edit.proposedData.safetyRating ?? edit.originalData.safetyRating ?? 0,
              author: edit.createdBy?.displayName ?? 'Unknown',
              note: '',
              busy: false,
              voteCount: 0,
              originalData: edit.originalData,
              proposedData: edit.proposedData,
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
    const obs: Observable<unknown> = item.isEdit
      ? this.markings.reviewEdit(item.id, payload)
      : item.kind === 'poi'
        ? this.markings.reviewPoi(item.id, payload)
        : this.markings.reviewDistrict(item.id, payload);

    obs.subscribe({
      next: () => {
        this.items.update((list) => list.filter((it) => it.id !== item.id));
        this.applyFilter(); // Refresh filtered items
      },
      error: () => {
        this.setBusy(item, false);
        this.error.set('Could not save your decision. Please try again.');
      },
    });
  }

  private setBusy(item: QueueItem, busy: boolean): void {
    this.items.update((list) => list.map((it) => (it.id === item.id ? { ...it, busy } : it)));
  }

  protected diff(item: QueueItem): Array<{ label: string; before: string; after: string }> {
    if (!item.originalData || !item.proposedData) return [];
    const o = item.originalData;
    const p = item.proposedData;
    const changes: Array<{ label: string; before: string; after: string }> = [];
    if (p.name !== undefined && p.name !== o.name) {
      changes.push({ label: 'Name', before: o.name ?? '', after: p.name });
    }
    if (p.category !== undefined && p.category !== o.category) {
      changes.push({ label: 'Category', before: o.category ?? '', after: p.category });
    }
    if (p.description !== undefined && p.description !== o.description) {
      changes.push({ label: 'Description', before: o.description ?? '', after: p.description });
    }
    if (p.safetyRating !== undefined && p.safetyRating !== o.safetyRating) {
      changes.push({
        label: 'Safety rating',
        before: String(o.safetyRating ?? ''),
        after: String(p.safetyRating),
      });
    }
    if (p.wheelchairAccessible !== undefined && p.wheelchairAccessible !== o.wheelchairAccessible) {
      changes.push({
        label: 'Wheelchair accessible',
        before: o.wheelchairAccessible ? 'Yes' : 'No',
        after: p.wheelchairAccessible ? 'Yes' : 'No',
      });
    }
    if (p.location !== undefined && JSON.stringify(p.location) !== JSON.stringify(o.location)) {
      changes.push({ label: 'Location', before: 'changed', after: 'changed' });
    }
    if (p.area !== undefined && JSON.stringify(p.area) !== JSON.stringify(o.area)) {
      changes.push({ label: 'Area', before: 'changed', after: 'changed' });
    }
    if (p.blendEdges !== undefined && p.blendEdges !== o.blendEdges) {
      changes.push({
        label: 'Blend edges',
        before: o.blendEdges ? 'Yes' : 'No',
        after: p.blendEdges ? 'Yes' : 'No',
      });
    }
    return changes;
  }

  protected toggleSelection(id: string): void {
    this.selectedIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  protected selectAll(): void {
    this.selectedIds.set(new Set(this.filteredItems().map((item) => item.id)));
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected bulkApprove(): void {
    this.bulkAction('approved');
  }

  protected bulkReject(): void {
    this.bulkAction('rejected');
  }

  private bulkAction(status: 'approved' | 'rejected'): void {
    const selectedIds = this.selectedIds();
    if (selectedIds.size === 0) return;

    this.bulkBusy.set(true);
    this.error.set(null);

    const promises = Array.from(selectedIds).map((id) => {
      const item = this.items().find((it) => it.id === id);
      if (!item) return Promise.resolve();

      this.setBusy(item, true);
      const payload = { status, reviewNote: item.note || undefined };
      const obs: Observable<unknown> = item.isEdit
        ? this.markings.reviewEdit(item.id, payload)
        : item.kind === 'poi'
          ? this.markings.reviewPoi(item.id, payload)
          : this.markings.reviewDistrict(item.id, payload);

      return new Promise<void>((resolve) => {
        obs.subscribe({
          next: () => {
            this.items.update((list) => list.filter((it) => it.id !== id));
            resolve();
          },
          error: () => {
            this.setBusy(item, false);
            resolve();
          },
        });
      });
    });

    Promise.all(promises).then(() => {
      this.bulkBusy.set(false);
      this.clearSelection();
      this.applyFilter(); // Refresh filtered items
      if (this.items().length === 0) {
        this.error.set(null);
      }
    });
  }
}
