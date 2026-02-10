import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

/* PrimeNG modules used by the template */
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

type SelectOption = { label: string; value: string };

export type EditableUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status?: string; // 'active' | 'inactive' (case-insensitive)
  role?: string;
  natcos?: string;
};

/**
 * EditUserDrawerComponent
 *
 * A standalone PrimeNG Drawer that matches the existing Add User drawer UI but
 * is labeled for editing.
 *
 * Notes:
 * - This repo/template does not include real UserService/backend update calls yet.
 *   The component simulates submission and emits `userUpdated`.
 * - Roles + NATCOS options are loaded using the same API endpoints as AddUserDrawerComponent.
 */
@Component({
  selector: 'app-edit-user-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // Needed for API-based option loading (standalone DI scope).
    HttpClientModule,

    DrawerModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './edit-user-drawer.component.html',
  styleUrl: './edit-user-drawer.component.scss',
})
export class EditUserDrawerComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Emits when the drawer is closed (Cancel, X, or drawer hide). */
  @Output() closed = new EventEmitter<void>();

  /** Emits after the user has been "updated" (simulated). */
  @Output() userUpdated = new EventEmitter<void>();

  /** Selected user to edit. When set, the form is patched with its values. */
  @Input()
  set user(value: EditableUser | null) {
    this._user = value;
    this.patchFormFromUser();
  }
  get user(): EditableUser | null {
    return this._user;
  }
  private _user: EditableUser | null = null;

  form!: FormGroup;
  loading = false;
  submitted = false;

  /** When true, the form is replaced by the embedded confirmation box. */
  showConfirmation = false;

  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpClient);

  roleOptions: SelectOption[] = [];
  natcosOptions: SelectOption[] = [];

  /**
   * Endpoint base:
   * - Prefer NG_APP_API_BASE (e.g., "https://example.com")
   * - Fall back to NG_APP_BACKEND_URL
   *
   * IMPORTANT:
   * These env vars must be provided in the container .env by the orchestrator.
   */
  private readonly apiBase =
    (globalThis as any)?.process?.env?.['NG_APP_API_BASE'] ||
    (globalThis as any)?.process?.env?.['NG_APP_BACKEND_URL'] ||
    '';

  constructor() {
    this.initializeForm();
    this.loadDropdownOptions();
  }

  private initializeForm() {
    this.form = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],

      /**
       * For Edit User we do NOT require password fields by default.
       * Keeping the UI consistent with the Add drawer, but making them optional avoids
       * forcing a password reset for every edit.
       *
       * If your product requires password changes here, switch validators to required
       * and add password match validation similar to AddUserDrawerComponent.
       */
      password: ['', [this.passwordValidator]],
      confirmPassword: [''],

      role: ['', [Validators.required]],
      natcos: ['', [Validators.required]],
      status: ['active', [Validators.required]],
    });

    // On edit, only validate password mismatch if both fields are present.
    this.form.valueChanges.subscribe(() => {
      const password = this.form.get('password')?.value;
      const confirmPassword = this.form.get('confirmPassword')?.value;

      const mismatch = !!password && !!confirmPassword && password !== confirmPassword;
      if (mismatch) {
        this.form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      } else {
        // Clear mismatch error only (preserve other errors)
        const existing = this.form.get('confirmPassword')?.errors || null;
        if (existing && existing['passwordMismatch']) {
          const { passwordMismatch, ...rest } = existing;
          const remainingKeys = Object.keys(rest);
          this.form.get('confirmPassword')?.setErrors(remainingKeys.length ? rest : null);
        }
      }
    });
  }

  private patchFormFromUser() {
    if (!this.form) return;

    const u = this._user;
    if (!u) {
      this.resetForm();
      return;
    }

    this.form.patchValue(
      {
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        // Do not prefill password fields
        password: '',
        confirmPassword: '',
        role: u.role || '',
        natcos: u.natcos || '',
        status: (u.status || 'active').toLowerCase(),
      },
      { emitEvent: false },
    );

    this.submitted = false;
    this.showConfirmation = false;
    this.cdr.markForCheck();
  }

  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      // Optional on Edit
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const isLongEnough = value.length >= 8;

    const passwordValid = hasUpperCase && hasLowerCase && hasNumber && isLongEnough;

    if (!passwordValid) {
      return {
        invalidPassword: {
          hasUpperCase,
          hasLowerCase,
          hasNumber,
          isLongEnough,
        },
      };
    }
    return null;
  }

  private getPasswordErrorMessage(): string {
    const passwordControl = this.form.get('password');
    if (
      !passwordControl ||
      !passwordControl.errors ||
      !passwordControl.errors['invalidPassword']
    ) {
      return '';
    }

    const errors = passwordControl.errors['invalidPassword'];
    const messages: string[] = [];

    if (!errors.isLongEnough) messages.push('at least 8 characters');
    if (!errors.hasUpperCase) messages.push('1 uppercase letter');
    if (!errors.hasLowerCase) messages.push('1 lowercase letter');
    if (!errors.hasNumber) messages.push('1 number');

    return 'Password must contain ' + messages.join(', ');
  }

  getConfirmPasswordErrorMessage(): string {
    const confirmPasswordControl = this.form.get('confirmPassword');
    if (confirmPasswordControl?.errors?.['passwordMismatch'] && confirmPasswordControl?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  getFieldErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.formatFieldName(fieldName)} is required`;
    }
    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (fieldName === 'password' && control.errors['invalidPassword']) {
      return this.getPasswordErrorMessage();
    }

    return '';
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private buildApiUrl(path: string): string {
    if (!this.apiBase) {
      return path.startsWith('/') ? path : `/${path}`;
    }
    const base = String(this.apiBase).replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  private toOptions(values: string[]): SelectOption[] {
    return (values || [])
      .filter((v) => typeof v === 'string')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .map((v) => ({ label: v, value: v }));
  }

  private loadDropdownOptions() {
    const ROLE_OPTIONS_ENDPOINT = '/api/v1/user-roles';
    const NATCOS_OPTIONS_ENDPOINT = '/api/v1/natcos';

    this.http.get<string[]>(this.buildApiUrl(ROLE_OPTIONS_ENDPOINT)).subscribe({
      next: (roles) => {
        this.roleOptions = this.toOptions(roles);
        this.cdr.markForCheck();
      },
      error: (err) => {
        globalThis.console.error('Failed to load role options:', err);
        this.roleOptions = [];
        this.cdr.markForCheck();
      },
    });

    this.http.get<string[]>(this.buildApiUrl(NATCOS_OPTIONS_ENDPOINT)).subscribe({
      next: (natcos) => {
        this.natcosOptions = this.toOptions(natcos);
        this.cdr.markForCheck();
      },
      error: (err) => {
        globalThis.console.error('Failed to load NATCOS options:', err);
        this.natcosOptions = [];
        this.cdr.markForCheck();
      },
    });
  }

  onClose() {
    this.showConfirmation = false;
    this.loading = false;
    this.submitted = false;

    this.closed.emit();

    this.visible = false;
    this.visibleChange.emit(false);

    // Keep the last user selection in parent; the parent controls `user` input.
    this.resetForm();
  }

  private resetForm() {
    this.form.reset({
      status: 'active',
      role: '',
      natcos: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      email: '',
    });

    this.submitted = false;
    this.showConfirmation = false;
  }

  onSubmit() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    // Show confirmation box before final submission.
    this.showConfirmation = true;
    this.cdr.markForCheck();
  }

  // PUBLIC_INTERFACE
  onConfirmCancel() {
    /** Closes the confirmation box and returns to the form. */
    this.showConfirmation = false;
  }

  // PUBLIC_INTERFACE
  onConfirmProceed() {
    /**
     * Final submission after user confirmation.
     * Simulated here (service integration not included in this template).
     */
    this.loading = true;

    globalThis.setTimeout(() => {
      this.loading = false;
      this.userUpdated.emit();
      this.onClose();
    }, 500);
  }
}
