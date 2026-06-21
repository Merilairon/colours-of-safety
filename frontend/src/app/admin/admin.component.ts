import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { AuthUser, UserRole } from '../core/models';
import { UserService } from '../core/user.service';

interface UserRow extends AuthUser {
  busy: boolean;
  saved: boolean;
}

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'User',
  reviewer: 'Reviewer',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

@Component({
  selector: 'app-admin',
  imports: [FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly users = inject(UserService);
  private readonly auth = inject(AuthService);

  protected readonly items = signal<UserRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly searchQuery = signal('');
  protected readonly roleFilter = signal<UserRole | ''>('');

  protected readonly currentUserId = computed(() => this.auth.user()?.id ?? '');
  protected readonly isSuperAdmin = computed(() => this.auth.user()?.role === 'super_admin');

  protected readonly roleLabels = ROLE_LABELS;

  protected readonly availableRoles = computed<UserRole[]>(() =>
    this.isSuperAdmin()
      ? ['user', 'reviewer', 'admin', 'super_admin']
      : ['user', 'reviewer', 'admin'],
  );

  protected readonly filteredItems = computed(() => {
    let list = this.items();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(
        (u) => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    const role = this.roleFilter();
    if (role) {
      list = list.filter((u) => u.role === role);
    }
    return list;
  });

  protected readonly roleCounts = computed(() => {
    const all = this.items();
    return {
      user: all.filter((u) => u.role === 'user').length,
      reviewer: all.filter((u) => u.role === 'reviewer').length,
      admin: all.filter((u) => u.role === 'admin').length,
      super_admin: all.filter((u) => u.role === 'super_admin').length,
      total: all.length,
    };
  });

  protected readonly allRoles: UserRole[] = ['user', 'reviewer', 'admin', 'super_admin'];

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.users.getUsers().subscribe({
      next: (rows) => {
        this.items.set(rows.map((r) => ({ ...r, busy: false, saved: false })));
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
    if (user.id === this.currentUserId()) return;

    this.setBusy(user, true);
    this.users.updateUserRole(user.id, role).subscribe({
      next: (updated) => {
        this.items.update((list) =>
          list.map((u) => (u.id === user.id ? { ...updated, busy: false, saved: true } : u)),
        );
        this.clearSaved(user.id);
      },
      error: () => {
        this.setBusy(user, false);
        this.error.set('Could not update role. Please try again.');
      },
    });
  }

  protected ban(user: UserRow, reason?: string): void {
    if (user.id === this.currentUserId()) return;
    this.setBusy(user, true);
    this.users.banUser(user.id, reason).subscribe({
      next: (updated) => {
        this.items.update((list) =>
          list.map((u) => (u.id === user.id ? { ...updated, busy: false, saved: true } : u)),
        );
        this.clearSaved(user.id);
      },
      error: () => {
        this.setBusy(user, false);
        this.error.set('Could not ban user. Please try again.');
      },
    });
  }

  protected unban(user: UserRow): void {
    this.setBusy(user, true);
    this.users.unbanUser(user.id).subscribe({
      next: (updated) => {
        this.items.update((list) =>
          list.map((u) => (u.id === user.id ? { ...updated, busy: false, saved: true } : u)),
        );
        this.clearSaved(user.id);
      },
      error: () => {
        this.setBusy(user, false);
        this.error.set('Could not unban user. Please try again.');
      },
    });
  }

  private clearSaved(id: string): void {
    setTimeout(() => {
      this.items.update((list) => list.map((u) => (u.id === id ? { ...u, saved: false } : u)));
    }, 2000);
  }

  protected isCurrentUser(user: UserRow): boolean {
    return user.id === this.currentUserId();
  }

  private setBusy(user: UserRow, busy: boolean): void {
    this.items.update((list) => list.map((u) => (u.id === user.id ? { ...u, busy } : u)));
  }
}
