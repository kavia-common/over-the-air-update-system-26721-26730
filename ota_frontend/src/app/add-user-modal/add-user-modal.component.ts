import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AddUserDrawerComponent } from '../add-user-drawer/add-user-drawer.component';

/**
 * Compatibility wrapper for legacy templates using <app-add-user-modal>.
 *
 * The repository already contains the actual implementation as a drawer:
 * - selector: <app-add-user-drawer>
 * - inputs/outputs: visible / visibleChange / closed / userAdded
 *
 * Some templates (per build error log) still reference <app-add-user-modal>
 * and bind to [visible] and (visibleChange). When Angular doesn't recognize
 * the element, (visibleChange) is treated like a DOM event and becomes type Event,
 * leading to TS2322.
 *
 * This wrapper restores:
 * - Known Angular element: app-add-user-modal
 * - Correctly typed two-way binding: visibleChange emits boolean
 * - Pass-through closed and userAdded outputs
 */
@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [AddUserDrawerComponent],
  template: `
    <app-add-user-drawer
      [visible]="visible"
      (visibleChange)="visibleChange.emit($event)"
      (closed)="closed.emit()"
      (userAdded)="userAdded.emit()"
    />
  `,
})
export class AddUserModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Emits when the modal/drawer is closed. */
  @Output() closed = new EventEmitter<void>();

  /** Emits when a user is successfully added. */
  @Output() userAdded = new EventEmitter<void>();
}
