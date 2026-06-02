import { Component, ElementRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { MarkingsService } from '../core/markings.service';
import {
  CreateDistrictPayload,
  CreatePoiPayload,
  District,
  Poi,
  ReviewStatus,
} from '../core/models';
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
  description?: string;
  location?: Poi['location'];
  area?: District['area'];
}

@Component({
  selector: 'app-my-submissions',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './my-submissions.html',
  styleUrl: './my-submissions.scss',
})
export class MySubmissionsComponent implements OnInit {
  private readonly markings = inject(MarkingsService);
  private readonly fb = inject(FormBuilder);
  private readonly host = inject(ElementRef);
  private editTrigger: HTMLElement | null = null;
  private deleteTrigger: HTMLElement | null = null;

  protected readonly rows = signal<SubmissionRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly safetyLabel = safetyLabel;
  protected readonly colorFor = safetyColor;

  protected readonly editingRow = signal<SubmissionRow | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  protected readonly editForm = this.fb.group({
    name: ['', Validators.required],
    category: ['other'],
    safetyRating: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    description: [''],
  });

  ngOnInit(): void {
    Promise.all([
      this.toRows(this.markings.getMyPois(), 'poi'),
      this.toRows(this.markings.getMyDistricts(), 'district'),
    ])
      .then(([pois, districts]) => {
        const all = [...pois, ...districts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
              description: item.description,
              location: kind === 'poi' ? (item as Poi).location : undefined,
              area: kind === 'district' ? (item as District).area : undefined,
            })),
          ),
        error: reject,
      });
    });
  }

  protected startEdit(row: SubmissionRow, trigger?: HTMLElement): void {
    if (row.status !== 'pending') return;
    this.editTrigger = trigger ?? (document.activeElement as HTMLElement | null);
    this.editingRow.set(row);
    this.editForm.patchValue({
      name: row.name,
      category: row.category || 'other',
      safetyRating: row.safetyRating,
      description: row.description || '',
    });
    setTimeout(() => {
      const modal = this.host.nativeElement.querySelector(
        '[aria-labelledby="edit-modal-title"]',
      ) as HTMLElement | null;
      modal?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    });
  }

  protected cancelEdit(): void {
    this.editingRow.set(null);
    this.editForm.reset();
    this.editTrigger?.focus();
    this.editTrigger = null;
  }

  protected saveEdit(): void {
    const row = this.editingRow();
    if (!row || this.editForm.invalid) return;

    const formValue = this.editForm.value;
    const payload = {
      name: formValue.name!,
      description: formValue.description || '',
      category: row.kind === 'poi' ? formValue.category! : undefined,
      safetyRating: formValue.safetyRating!,
      location: row.location!,
      area: row.area,
    };

    const update$: Observable<unknown> =
      row.kind === 'poi'
        ? this.markings.updatePoi(row.id, payload as CreatePoiPayload)
        : this.markings.updateDistrict(row.id, payload as CreateDistrictPayload);

    update$.subscribe({
      next: () => {
        this.success.set(`${row.kind === 'poi' ? 'Place' : 'District'} updated successfully`);
        this.editingRow.set(null);
        this.reload();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: () => {
        this.error.set('Failed to update. Only pending submissions can be edited.');
        setTimeout(() => this.error.set(null), 3000);
      },
    });
  }

  protected startDelete(id: string, trigger?: HTMLElement): void {
    this.deleteTrigger = trigger ?? (document.activeElement as HTMLElement | null);
    this.deletingId.set(id);
    setTimeout(() => {
      const modal = this.host.nativeElement.querySelector(
        '[aria-labelledby="delete-modal-title"]',
      ) as HTMLElement | null;
      modal?.querySelector<HTMLElement>('button')?.focus();
    });
  }

  protected cancelDelete(): void {
    this.deletingId.set(null);
    this.deleteTrigger?.focus();
    this.deleteTrigger = null;
  }

  protected confirmDelete(row: SubmissionRow): void {
    const delete$: Observable<unknown> =
      row.kind === 'poi' ? this.markings.deletePoi(row.id) : this.markings.deleteDistrict(row.id);

    delete$.subscribe({
      next: () => {
        this.success.set(`${row.kind === 'poi' ? 'Place' : 'District'} deleted successfully`);
        this.deletingId.set(null);
        this.reload();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: () => {
        this.error.set('Failed to delete. You can only delete your own submissions.');
        this.deletingId.set(null);
        setTimeout(() => this.error.set(null), 3000);
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    Promise.all([
      this.toRows(this.markings.getMyPois(), 'poi'),
      this.toRows(this.markings.getMyDistricts(), 'district'),
    ])
      .then(([pois, districts]) => {
        const all = [...pois, ...districts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        this.rows.set(all);
        this.loading.set(false);
      })
      .catch(() => {
        this.error.set('Could not load your submissions.');
        this.loading.set(false);
      });
  }

  protected readonly categories = ['bar', 'cafe', 'community', 'health', 'other', 'shop', 'venue'];
}
