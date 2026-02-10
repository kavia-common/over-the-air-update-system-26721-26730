import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  EditableUser,
  EditUserDrawerComponent,
} from '../edit-user-drawer/edit-user-drawer.component';

/**
 * EditUserModalComponent
 *
 * Compatibility wrapper similar to <app-add-user-modal>, exposing simple inputs/outputs:
 * - [visible]
 * - (visibleChange)
 * - (close)
 * - (userUpdated)
 * - [user] (selected user to edit)
 *
 * This avoids event-name mismatches in templates and keeps parent wiring simple.
 */
@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [EditUserDrawerComponent],
  template: `
    <app-edit-user-drawer
      [visible]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [user]="user"
      (closed)="close.emit()"
      (userUpdated)="userUpdated.emit()"
    />
  `,
})
export class EditUserModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() user: EditableUser | null = null;

  /** Emits when the modal/drawer is closed (matches template binding `(close)`). */
  @Output() close = new EventEmitter<void>();

  /** Emits when a user is successfully updated. */
  @Output() userUpdated = new EventEmitter<void>();
}
