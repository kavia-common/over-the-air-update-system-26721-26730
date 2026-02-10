import { Component, EventEmitter, Input, Output, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

/* PrimeNG modules used by the template */
import { DrawerModule } from 'primeng/drawer';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

/**
 * Add User Drawer (PrimeNG Drawer) UI.
 * NOTE: This file is intentionally lightweight; the task focuses on matching template + SCSS to design.
 */
@Component({
  selector: 'app-add-user-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DrawerModule,
    MultiSelectModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
  ],
  /* Allows PrimeNG custom elements/inputs if any template type-checking edge cases remain. */
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './add-user-drawer.component.html',
  styleUrl: './add-user-drawer.component.scss',
})
export class AddUserDrawerComponent {
  /** Controls drawer visibility. */
  @Input() visible = false;

  /** Emits when the drawer is closed (Cancel, X, or drawer hide). */
  @Output() closed = new EventEmitter<void>();

  loading = false;

  // Simple options to keep template functional.
  roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Operator', value: 'operator' },
  ];

  natcosOptions = [
    { label: 'Lorem ipsum', value: 'lorem' },
    { label: 'Dolor sit', value: 'dolor' },
  ];

  form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        roles: [[], [Validators.required]],
        natcos: [null, [Validators.required]],
        status: ['active', [Validators.required]],
      },
      {
        validators: [(ctrl) => this.passwordMatchValidator(ctrl)],
      },
    );
  }

  private passwordMatchValidator(ctrl: AbstractControl) {
    const group = ctrl as FormGroup;
    const p = group.get('password')?.value;
    const cp = group.get('confirmPassword')?.value;
    return p && cp && p !== cp ? { passwordMismatch: true } : null;
  }

  onClose() {
    this.closed.emit();
  }

  onSubmit() {
    if (this.form.invalid) return;

    // Placeholder submission hook.
    this.loading = true;
    globalThis.setTimeout(() => {
      this.loading = false;
      this.onClose();
    }, 400);
  }

  isFieldInvalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  getFieldErrorMessage(name: string): string {
    const ctrl = this.form.get(name);
    if (!ctrl) return 'Invalid field';

    if (ctrl.errors?.['required']) return 'This field is required';
    if (ctrl.errors?.['email']) return 'Enter a valid email';
    if (ctrl.errors?.['minlength']) return 'Too short';
    return 'Invalid value';
  }

  getConfirmPasswordErrorMessage(): string {
    const ctrl = this.form.get('confirmPassword');
    if (ctrl?.errors?.['required']) return 'This field is required';
    if (this.form.errors?.['passwordMismatch']) return 'Passwords do not match';
    return 'Invalid value';
  }

  getRoleLabel(value: string): string {
    return this.roleOptions.find((o) => o.value === value)?.label ?? value;
  }

  removeRole(item: string, current: string[]) {
    const next = (current || []).filter((v) => v !== item);
    this.form.get('roles')?.setValue(next);
    this.form.get('roles')?.markAsDirty();
    this.form.get('roles')?.markAsTouched();
  }
}
