import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { MarkingsService } from '../core/markings.service';
import { PlaceRating, RatingSummary } from '../core/models';
import { safetyColor, safetyIndicator, safetyLabel, safetySymbolColor } from '../core/safety';

/** Community ratings and short reviews of a place (LSA-F5). */
@Component({
  selector: 'app-place-ratings',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './place-ratings.html',
  styleUrl: './place-ratings.scss',
})
export class PlaceRatingsComponent implements OnInit {
  readonly poiId = input.required<string>();
  readonly placeName = input.required<string>();
  /** `verified`: a rating was saved, which the API counts as a confirmation. */
  readonly summaryChange = output<RatingSummary & { verified: boolean }>();
  readonly reportRating = output<{ id: string; name: string }>();

  private readonly markings = inject(MarkingsService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly isReviewer = this.auth.isReviewer;
  protected readonly ratings = signal<PlaceRating[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly mine = computed(() => this.ratings().find((r) => r.isMine) ?? null);
  protected readonly loginReturn = computed(() => ({ returnUrl: `/place/${this.poiId()}` }));

  protected readonly scale = [5, 4, 3, 2, 1];
  protected readonly label = safetyLabel;
  protected readonly color = safetyColor;
  protected readonly symbol = safetyIndicator;
  protected readonly symbolColor = safetySymbolColor;

  protected readonly form = this.fb.nonNullable.group({
    rating: [0, [Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(500)]],
    isAnonymous: [false],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.markings.getRatings(this.poiId()).subscribe({
      next: (ratings) => {
        this.ratings.set(ratings);
        this.loading.set(false);
        const mine = ratings.find((r) => r.isMine);
        if (mine) {
          this.form.reset({
            rating: mine.rating,
            comment: mine.comment,
            isAnonymous: mine.isAnonymous,
          });
        }
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Could not load ratings.');
      },
    });
  }

  protected submit(): void {
    const { rating, comment, isAnonymous } = this.form.getRawValue();
    if (rating < 1 || this.form.invalid) {
      this.formError.set('Pick how safe this place felt before saving.');
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    this.markings.rate(this.poiId(), { rating, comment: comment.trim(), isAnonymous }).subscribe({
      next: ({ rating: saved, summary }) => {
        this.saving.set(false);
        this.ratings.update((list) => [saved, ...list.filter((r) => r.id !== saved.id)]);
        this.summaryChange.emit({ ...summary, verified: true });
        this.message.set('Thanks! Your rating is saved.');
      },
      error: () => {
        this.saving.set(false);
        this.formError.set('Could not save your rating. Please try again.');
      },
    });
  }

  protected remove(rating: PlaceRating): void {
    const question = rating.isMine ? 'Delete your rating?' : 'Remove this rating for everyone?';
    if (!confirm(question)) return;
    this.markings.deleteRating(this.poiId(), rating.id).subscribe({
      next: (summary) => {
        this.ratings.update((list) => list.filter((r) => r.id !== rating.id));
        this.summaryChange.emit({ ...summary, verified: false });
        if (rating.isMine) {
          this.form.reset({ rating: 0, comment: '', isAnonymous: false });
        }
        this.message.set(rating.isMine ? 'Your rating was deleted.' : 'Rating removed.');
      },
      error: () => this.message.set('Could not delete the rating.'),
    });
  }
}
