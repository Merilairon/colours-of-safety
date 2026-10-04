import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MarkingsService } from './markings.service';
import { ReportReason, ReportTargetType } from './models';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  closed: 'It has closed or moved',
  wrong_location: 'The pin is in the wrong place',
  wrong_details: 'Details are wrong or misleading',
  not_safe: 'It is not safe for LGBTQIA+ people',
  not_lgbtq_related: 'It is not an LGBTQIA+ space',
  duplicate: 'It is listed twice',
  offensive: 'Offensive or hateful content',
  spam: 'Spam or advertising',
  other: 'Something else',
};

const REASONS_BY_TARGET: Record<ReportTargetType, ReportReason[]> = {
  poi: [
    'not_safe',
    'closed',
    'wrong_location',
    'wrong_details',
    'not_lgbtq_related',
    'duplicate',
    'offensive',
    'other',
  ],
  district: ['not_safe', 'wrong_details', 'offensive', 'other'],
  rating: ['offensive', 'spam', 'wrong_details', 'other'],
};

export interface ReportTarget {
  type: ReportTargetType;
  id: string;
  /** Shown in the heading, e.g. the place name. */
  name: string;
}

/**
 * In-app "Flag" form (LSA-F4). Uses the native <dialog> element, which traps
 * focus, closes on Escape and returns focus to the opener by itself.
 */
@Component({
  selector: 'app-report-dialog',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './report-dialog.html',
  styleUrl: './report-dialog.scss',
})
export class ReportDialogComponent {
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;

  private readonly markings = inject(MarkingsService);
  private readonly fb = inject(FormBuilder);

  protected readonly target = signal<ReportTarget | null>(null);
  protected readonly reasons = signal<ReportReason[]>([]);
  protected readonly submitting = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly labels = REPORT_REASON_LABELS;

  protected readonly form = this.fb.nonNullable.group({
    reason: ['' as ReportReason | '', Validators.required],
    details: ['', Validators.maxLength(1000)],
  });

  open(target: ReportTarget): void {
    this.target.set(target);
    this.reasons.set(REASONS_BY_TARGET[target.type]);
    this.form.reset({ reason: '', details: '' });
    this.sent.set(false);
    this.error.set(null);
    this.dialog.nativeElement.showModal();
  }

  protected close(): void {
    this.dialog.nativeElement.close();
  }

  protected submit(): void {
    const target = this.target();
    const { reason, details } = this.form.getRawValue();
    if (!target || !reason || this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Choose what is wrong before sending.');
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.markings
      .createReport({
        targetType: target.type,
        targetId: target.id,
        reason,
        details: details.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.sent.set(true);
        },
        error: (err: { status?: number }) => {
          this.submitting.set(false);
          this.error.set(
            err.status === 429
              ? 'Too many reports from this connection. Please try again later.'
              : 'Could not send the report. Please try again.',
          );
        },
      });
  }
}
