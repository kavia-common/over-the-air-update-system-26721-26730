import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AddUserDrawerComponent } from '../add-user-drawer/add-user-drawer.component';

/**
 * Compatibility wrapper for templates using <app-add-user-modal>.
 *
 * IMPORTANT:
 * The user template (attached error log) binds to:
 * - [visible]
 * - (visibleChange)
 * - (close)
 * - (userAdded)
 *
 * If the output name doesn't match (e.g., component emits `closed` but template listens to `close`),
 * Angular may treat the unmatched event as a DOM event and `$event` becomes `Event`, which breaks:
 *   (visibleChange)="showAddUserModal = $event"  // TS2322 if $event inferred as Event
 *
 * This wrapper therefore exposes output `close` and forwards the underlying drawer’s `closed`.
 */
@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [AddUserDrawerComponent],
  template: `
    <app-add-user-drawer
      [visible]="visible"
      (visibleChange)="visibleChange.emit($event)"
      (closed)="close.emit()"
      (userAdded)="userAdded.emit()"
    />
  `,
})
export class AddUserModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Emits when the modal/drawer is closed (matches template binding `(close)`). */
  @Output() close = new EventEmitter<void>();

  /** Emits when a user is successfully added. */
  @Output() userAdded = new EventEmitter<void>();
}
