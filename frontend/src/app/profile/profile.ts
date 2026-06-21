import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Profile } from '../core/models';
import { ProfileService } from '../core/profile.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly profile = signal<Profile | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly savingProfile = signal(false);
  protected readonly savingPassword = signal(false);
  protected readonly savingEmail = signal(false);
  protected readonly deleting = signal(false);
  protected readonly emailTokenSent = signal(false);

  protected readonly profileForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    avatar: [''],
    bio: ['', [Validators.maxLength(2000)]],
    emailUpdates: [true],
  });

  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  protected readonly emailForm = this.fb.nonNullable.group({
    newEmail: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    token: [''],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  protected loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.profileService.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.profileForm.patchValue({
          displayName: p.displayName,
          avatar: p.avatar ?? '',
          bio: p.bio ?? '',
          emailUpdates: p.notificationPreferences.emailUpdates,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load profile.');
        this.loading.set(false);
      },
    });
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid || this.savingProfile()) return;
    this.savingProfile.set(true);
    this.error.set(null);
    this.success.set(null);
    const { displayName, avatar, bio, emailUpdates } = this.profileForm.getRawValue();
    this.profileService
      .updateProfile({
        displayName,
        avatar: avatar.trim() || null,
        bio: bio.trim() || null,
        notificationPreferences: { emailUpdates },
      })
      .subscribe({
        next: (p) => {
          this.profile.set(p);
          this.auth.patchUser({ displayName: p.displayName });
          this.savingProfile.set(false);
          this.success.set('Profile saved.');
          this.clearSuccess();
        },
        error: (err: HttpErrorResponse) => {
          this.savingProfile.set(false);
          this.error.set(this.extractError(err));
        },
      });
  }

  protected changePassword(): void {
    if (this.passwordForm.invalid || this.savingPassword()) return;
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.error.set('New passwords do not match.');
      return;
    }
    this.savingPassword.set(true);
    this.error.set(null);
    this.success.set(null);
    this.profileService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.savingPassword.set(false);
        this.success.set('Password changed.');
        this.clearSuccess();
      },
      error: (err: HttpErrorResponse) => {
        this.savingPassword.set(false);
        this.error.set(this.extractError(err));
      },
    });
  }

  protected requestEmailChange(): void {
    if (this.emailForm.invalid || this.savingEmail()) return;
    const { newEmail, password } = this.emailForm.getRawValue();
    this.savingEmail.set(true);
    this.error.set(null);
    this.success.set(null);
    this.profileService.requestEmailChange({ newEmail, password }).subscribe({
      next: () => {
        this.savingEmail.set(false);
        this.emailTokenSent.set(true);
        this.success.set('Verification email sent. Enter the token below to confirm.');
      },
      error: (err: HttpErrorResponse) => {
        this.savingEmail.set(false);
        this.error.set(this.extractError(err));
      },
    });
  }

  protected confirmEmailChange(): void {
    const token = this.emailForm.getRawValue().token.trim();
    if (!token) return;
    this.savingEmail.set(true);
    this.error.set(null);
    this.success.set(null);
    this.profileService.confirmEmailChange({ token }).subscribe({
      next: () => {
        this.emailForm.patchValue({ token: '' });
        this.emailTokenSent.set(false);
        this.savingEmail.set(false);
        this.success.set('Email updated.');
        this.loadProfile();
        this.clearSuccess();
      },
      error: (err: HttpErrorResponse) => {
        this.savingEmail.set(false);
        this.error.set(this.extractError(err));
      },
    });
  }

  protected deleteAccount(): void {
    if (!confirm('Delete your account permanently? This cannot be undone.')) return;
    this.deleting.set(true);
    this.error.set(null);
    this.success.set(null);
    this.profileService.deleteAccount().subscribe({
      next: () => {
        this.auth.logout();
        void this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.deleting.set(false);
        this.error.set(this.extractError(err));
      },
    });
  }

  private extractError(err: HttpErrorResponse): string {
    return err.error?.message || 'Something went wrong. Please try again.';
  }

  private clearSuccess(): void {
    setTimeout(() => this.success.set(null), 3000);
  }
}
