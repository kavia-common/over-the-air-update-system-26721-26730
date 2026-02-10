import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddUserModalComponent } from '../../../add-user-modal/add-user-modal.component';

/**
 * UserComponent
 *
 * Minimal Users page that demonstrates usage of the legacy selector <app-add-user-modal>.
 * This component explicitly imports AddUserModalComponent (standalone) so Angular recognizes:
 * - <app-add-user-modal>
 * - [visible] input
 * - (visibleChange) output (boolean)
 * - (closed) and (userAdded) outputs
 */
@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, AddUserModalComponent],
  templateUrl: './user.component.html',
})
export class UserComponent {
  /** Controls visibility for the Add User modal/drawer. */
  showAddUserModal = false;

  // PUBLIC_INTERFACE
  openAddUserModal(): void {
    /** Opens the Add User modal/drawer. */
    this.showAddUserModal = true;
  }

  // PUBLIC_INTERFACE
  onAddUserModalClose(): void {
    /** Handles modal close event. */
    this.showAddUserModal = false;
  }

  // PUBLIC_INTERFACE
  onUserAdded(): void {
    /** Handles user added event. In a real app, refresh user list here. */
    this.showAddUserModal = false;
  }
}
