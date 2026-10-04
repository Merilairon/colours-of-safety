import { Location } from '@angular/common';
import { ElementRef, inject, signal } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

/**
 * Shared accessible-form behaviour for the auth pages (LSA-B15):
 * - field errors appear once a field was touched or the form was submitted,
 * - a failed client-side submit moves focus to the first invalid field,
 * - a failed server response moves focus to the error message.
 */
export class FormFeedback {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly submitted = signal(false);

  constructor(private readonly form: FormGroup) {}

  showError(name: string): boolean {
    const control: AbstractControl | null = this.form.get(name);
    return !!control && control.invalid && (control.touched || this.submitted());
  }

  hasError(name: string, error: string): boolean {
    return this.showError(name) && !!this.form.get(name)?.hasError(error);
  }

  /** Returns true when the form may be sent; otherwise focuses the first invalid field. */
  validate(): boolean {
    this.submitted.set(true);
    if (this.form.valid) {
      return true;
    }
    this.form.markAllAsTouched();
    // Read validity from the model, not the DOM: the ng-invalid classes are
    // only updated by the next change detection. Controls are declared in
    // the same order as the fields appear on screen.
    const firstInvalid = Object.entries(this.form.controls).find(([, c]) => c.invalid)?.[0];
    if (firstInvalid) {
      this.focus(`[formControlName="${firstInvalid}"]`);
    }
    return false;
  }

  /** Focuses the server error (`[data-form-error]`, tabindex=-1) after it renders. */
  focusError(): void {
    setTimeout(() => this.focus('[data-form-error]'));
  }

  private focus(selector: string): void {
    this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus();
  }
}

/**
 * Reads the single-use token from an email link (`/path#token=…`) and removes
 * it from the address bar, so it doesn't linger in history, get copied along
 * with the URL, or reach analytics and error reports.
 */
export function takeFragmentToken(): string | null {
  const route = inject(ActivatedRoute);
  const location = inject(Location);
  const fragment = route.snapshot.fragment ?? '';
  const token = new URLSearchParams(fragment).get('token');
  location.replaceState(location.path(false).split('#')[0]);
  return token;
}
