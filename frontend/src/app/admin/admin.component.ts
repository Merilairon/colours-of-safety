import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthUser, UserRole } from '../core/models';
import { UserService } from '../core/user.service';

interface UserRow extends AuthUser {
  busy: boolean;
}

@Component({
  selector: 'app-admin',
  imports: [],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly users = inject(UserService);

  protected readonly items = signal<UserRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly roles: UserRole[] = ['user', 'reviewer', 'admin', 'super_admin'];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.users.getUsers().subscribe({
      next: (rows) => {
        this.items.set(rows.map((r) => ({ ...r, busy: false })));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load users.');
        this.loading.set(false);
      },
    });
  }

  protected setRole(user: UserRow, role: UserRole): void {
    if (user.role === role) return;

    this.setBusy(user, true);
    this.users.updateUserRole(user.id, role).subscribe({
      next: (updated) => {
        this.items.update((list) =>
          list.map((u) => (u.id === user.id ? { ...updated, busy: false } : u)),
        );
      },
      error: () => {
        this.setBusy(user, false);
        this.error.set('Could not update role. Please try again.');
      },
    });
  }

  private setBusy(user: UserRow, busy: boolean): void {
    this.items.update((list) =>
      list.map((u) => (u.id === user.id ? { ...u, busy } : u)),
    );
  }
}
