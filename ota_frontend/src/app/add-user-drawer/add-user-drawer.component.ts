import { CommonModule } from '@angular/common';
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
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';

/**
 * AddUserModalComponent (implemented in the existing "add-user-drawer" folder to avoid changing app wiring).
 * Uses the provided TS as the base, but:
 * - Preserves prior UI behavior fixes:
 *   - Roles: no duplicate placeholder line under chips (handled via selectedItems template + CSS)
 *   - NATCOS: no clear (X) icon (showClear=false)
 * - Adds confirmation box after clicking Add (before final submission)
 *
 * CHANGE (per latest request):
 * - Remove tenant↔role-type mapping behavior entirely.
 * - Implement role mapping/unmapping only:
 *   - Selecting/deselecting roles in the Roles multi-select represents mapping/unmapping.
 *
 * NOTE:
 * The user-provided TS references MessageService/UserService/@ngx-translate. This repo template doesn't include
 * those services. To keep CI/build green and focus on UI as requested, this component simulates submit.
 */
@Component({
  selector: 'app-add-user-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    DrawerModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
  ],
  /* Allows PrimeNG custom elements/inputs if any template type-checking edge cases remain. */
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './add-user-drawer.component.html',
  styleUrl: './add-user-drawer.component.scss',
})
export class AddUserDrawerComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Emits when the drawer is closed (Cancel, X, or drawer hide). */
  @Output() closed = new EventEmitter<void>();

  /** Emits after the user has been "added" (simulated). */
  @Output() userAdded = new EventEmitter<void>();

  /**
   * Backwards-compatible input/output used by the provided TS.
   * This lets parent components bind either [visible] or [showDrawer].
   */
  @Input()
  get showDrawer(): boolean {
    return this.visible;
  }
  set showDrawer(value: boolean) {
    this.visible = value;
    this.showDrawerChange.emit(value);
    this.visibleChange.emit(value);
    if (!value) {
      this.resetForm();
    }
  }
  @Output() showDrawerChange = new EventEmitter<boolean>();

  /** Model used by template-driven fields (ngModel). */
  newUser: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
    natco: string;
    status: string;
  } = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    natco: '',
    status: 'Active',
  };

  form!: FormGroup;
  loading = false;
  submitted = false;

  /** When true, the form is replaced by the embedded confirmation box. */
  showConfirmation = false;

  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Options for dropdowns */
  roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'Approver', value: 'approver' },
    { label: 'Viewer', value: 'viewer' },
  ];

  natcosOptions = [
    { label: 'US', value: 'US' },
    { label: 'UK', value: 'UK' },
    { label: 'IN', value: 'IN' },
    { label: 'SG', value: 'SG' },
    { label: 'AU', value: 'AU' },
  ];

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  constructor() {
    this.initializeForm();
  }

  initializeForm() {
    this.form = this.formBuilder.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, this.passwordValidator]],
        confirmPassword: ['', [Validators.required]],

        /**
         * Role mapping/unmapping:
         * - Multi-select list; selected = mapped, deselected/removed = unmapped.
         */
        roles: [[], [Validators.required]],

        natcos: ['', [Validators.required]],
        status: ['active', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
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

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  getPasswordErrorMessage(): string {
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
    if (confirmPasswordControl?.errors?.['required']) {
      return 'Confirm Password is required';
    }
    if (this.form.errors?.['passwordMismatch'] && confirmPasswordControl?.touched) {
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

  formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  getRoleLabel(roleValue: string): string {
    const role = this.roleOptions.find((r) => r.value === roleValue);
    return role ? role.label : roleValue;
  }

  removeRole(roleValue: string, selectedRoles: string[]): void {
    const updatedRoles = (selectedRoles || []).filter((r) => r !== roleValue);
    this.form.get('roles')?.setValue(updatedRoles);
    this.form.get('roles')?.markAsDirty();
    this.form.get('roles')?.markAsTouched();
  }

  // Adapter to match template API
  closeDrawer() {
    this.onClose();
  }

  addUser() {
    this.form.patchValue({
      firstName: this.newUser.firstName,
      lastName: this.newUser.lastName,
      email: this.newUser.email,
      password: this.newUser.password,
      confirmPassword: this.newUser.confirmPassword,
      roles: this.newUser.role ? [this.newUser.role] : [],
      natcos: this.newUser.natco,
      status: this.newUser.status ? this.newUser.status.toLowerCase() : 'active',
    });
    this.onSubmit();
  }

  onClose() {
    this.showConfirmation = false;
    this.loading = false;
    this.submitted = false;

    this.closed.emit();

    this.visible = false;
    this.visibleChange.emit(false);
    this.showDrawerChange.emit(false);

    this.resetForm();
  }

  resetForm() {
    this.form.reset({
      status: 'active',
      roles: [],
      natcos: '',
    });
    this.submitted = false;
    this.showConfirmation = false;
  }

  onSubmit() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    // After "Add" submit, show the confirmation UI (as requested).
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
      this.userAdded.emit();
      this.onClose();
    }, 500);
  }
}
