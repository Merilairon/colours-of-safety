import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EditProposal, ReviewStatus } from '../../core/models';
import { MarkingsService } from '../../core/markings.service';
import { safetyColor, safetyLabel } from '../../core/safety';

@Component({
  selector: 'app-my-edits',
  imports: [RouterLink],
  templateUrl: './my-edits.html',
  styleUrl: './my-edits.scss',
})
export class MyEditsComponent implements OnInit {
  private readonly markings = inject(MarkingsService);

  protected readonly edits = signal<EditProposal[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly safetyLabel = safetyLabel;
  protected readonly colorFor = safetyColor;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.markings.getMyEdits().subscribe({
      next: (items) => {
        this.edits.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your edit proposals.');
        this.loading.set(false);
      },
    });
  }

  protected statusClass(status: ReviewStatus): string {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }

  protected targetName(edit: EditProposal): string {
    return edit.proposedData.name ?? edit.originalData.name ?? 'Unknown';
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString();
  }
}
