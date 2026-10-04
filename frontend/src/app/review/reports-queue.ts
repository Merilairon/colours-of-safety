import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarkingsService } from '../core/markings.service';
import { ModeratorReport, ReportStatus } from '../core/models';
import { REPORT_REASON_LABELS } from '../core/report-dialog';

interface ReportRow extends ModeratorReport {
  note: string;
  busy: boolean;
}

/** Moderator view of in-app reports (LSA-F4). */
@Component({
  selector: 'app-reports-queue',
  imports: [DatePipe, RouterLink],
  templateUrl: './reports-queue.html',
  styleUrl: './reports-queue.scss',
})
export class ReportsQueueComponent implements OnInit {
  private readonly markings = inject(MarkingsService);

  protected readonly status = signal<ReportStatus>('open');
  protected readonly rows = signal<ReportRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly announcement = signal('');
  protected readonly reasons = REPORT_REASON_LABELS;
  protected readonly kindLabels = { poi: 'Place', district: 'District', rating: 'Rating' };

  ngOnInit(): void {
    this.load();
  }

  protected show(status: ReportStatus): void {
    this.status.set(status);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.markings.getReports(this.status()).subscribe({
      next: (reports) => {
        this.rows.set(reports.map((r) => ({ ...r, note: '', busy: false })));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load reports.');
        this.loading.set(false);
      },
    });
  }

  protected setNote(row: ReportRow, note: string): void {
    row.note = note;
  }

  protected decide(row: ReportRow, status: 'resolved' | 'dismissed'): void {
    row.busy = true;
    this.rows.update((rows) => [...rows]);
    this.markings.resolveReport(row.id, status, row.note.trim() || undefined).subscribe({
      next: () => {
        this.rows.update((rows) => rows.filter((r) => r.id !== row.id));
        this.announcement.set(
          `Report about ${row.targetName ?? 'a removed item'} ${status === 'resolved' ? 'resolved' : 'dismissed'}.`,
        );
      },
      error: () => {
        row.busy = false;
        this.rows.update((rows) => [...rows]);
        this.error.set('Could not update the report. Please try again.');
      },
    });
  }
}
