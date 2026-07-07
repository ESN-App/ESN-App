import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../core';

@Component({
  selector: 'app-auth-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-card appearance="outlined" class="auth-card">
      <mat-card-header>
        <mat-card-title>{{ mode() === 'login' ? 'Log in' : 'Create an account' }}</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            @if (form.controls.email.hasError('required')) {
              <mat-error>Email is required.</mat-error>
            } @else if (form.controls.email.hasError('email')) {
              <mat-error>Enter a valid email address.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input
              matInput
              type="password"
              formControlName="password"
              [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
            />
            @if (form.controls.password.hasError('required')) {
              <mat-error>Password is required.</mat-error>
            } @else if (form.controls.password.hasError('minlength')) {
              <mat-error>Password must be at least 8 characters.</mat-error>
            }
          </mat-form-field>

          @if (error(); as message) {
            <p class="error">{{ message }}</p>
          }

          <button mat-flat-button type="submit" [disabled]="submitting()">
            {{ mode() === 'login' ? 'Log in' : 'Register' }}
          </button>
        </form>
      </mat-card-content>

      <mat-card-actions>
        <button mat-button type="button" (click)="toggleMode()">
          {{ mode() === 'login' ? "Don't have an account? Register" : 'Already registered? Log in' }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .auth-card {
      max-width: 26rem;
      margin: 2rem auto;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 1rem;
    }

    .error {
      color: var(--mat-sys-error, #b3261e);
      margin: 0 0 0.5rem;
    }
  `,
})
export class AuthPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  toggleMode(): void {
    this.mode.update((mode) => (mode === 'login' ? 'register' : 'login'));
    this.error.set(null);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    const request =
      this.mode() === 'login'
        ? this.authService.login(email, password)
        : this.authService.register(email, password);

    this.submitting.set(true);
    this.error.set(null);

    request.subscribe({
      next: () => this.router.navigateByUrl('/events'),
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error ?? 'Something went wrong. Please try again.');
      },
    });
  }
}
