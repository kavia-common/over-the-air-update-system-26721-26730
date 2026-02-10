import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AddUserModalComponent } from '../../../add-user-modal/add-user-modal.component';
import { EditUserModalComponent } from './edit-user-modal/edit-user-modal.component';
import { EditableUser } from './edit-user-drawer/edit-user-drawer.component';

/* PrimeNG */
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

/**
 * UserComponent
 *
 * Uses the user-provided TS as the authoritative baseline and integrates the
 * standalone <app-add-user-modal> wrapper with correct imports and bindings.
 *
 * NOTE:
 * This repo currently provides the Add User UI via:
 * - src/app/add-user-modal/add-user-modal.component.ts (wrapper)
 * which internally renders:
 * - src/app/add-user-drawer/add-user-drawer.component.ts (implementation)
 *
 * The more advanced services/models referenced in the original app (UserService,
 * User model, translate, enums) are not present in this template repo, so this
 * component focuses on the modal integration and keeps the demo page functional.
 */
@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    CardModule,
    ButtonModule,
    InputTextModule,
    PaginatorModule,
    TagModule,
    HttpClientModule,
    ToastModule,

    AddUserModalComponent,
    EditUserModalComponent,
  ],
  providers: [MessageService],
  templateUrl: './user.component.html',
})
export class UserComponent implements OnInit, OnDestroy {
  searchQuery = '';
  private searchSubject = new Subject<string>();

  /**
   * Demo user list placeholder.
   * In the original app this comes from UserService + User model.
   */
  users: Array<{ id: string; email: string; firstName?: string; lastName?: string; status?: string }> =
    [];

  // Pagination (kept from authoritative TS)
  first = 0;
  rows = 5;
  totalRecords = 0;

  // Add user modal
  showAddUserModal = false;

  // Edit user modal
  showEditUserModal = false;
  selectedUserForEdit: EditableUser | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    // Setup debounced search (kept from authoritative TS)
    this.searchSubject
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only emit if value actually changed
      )
      .subscribe(() => {
        this.first = 0; // Reset to first page when searching
        this.loadUsers();
      });

    // Listen to tenant change events from shell app (kept from authoritative TS).
    // Guarded for SSR/prerender where `window` does not exist.
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.addEventListener('tenantChange', this.handleTenantChange);
    }

    this.loadUsers();
  }

  ngOnDestroy() {
    this.searchSubject.complete();

    // Guarded for SSR/prerender where `window` does not exist.
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.removeEventListener('tenantChange', this.handleTenantChange);
    }
  }

  private handleTenantChange = (event: globalThis.Event) => {
    const customEvent = event as globalThis.CustomEvent;
    if (customEvent.detail?.tenantId) {
      // Reset pagination and reload users when tenant changes
      this.first = 0;
      this.loadUsers();
    }
  };

  /**
   * Demo loader (since the full backend/service layer isn’t included in this repo).
   * Keeps the same method name/signature from the authoritative TS.
   */
  loadUsers() {
    const all = [
      { id: '1', email: 'root@example.com', firstName: 'Root', lastName: 'User', status: 'active' },
      { id: '2', email: 'jane.doe@example.com', firstName: 'Jane', lastName: 'Doe', status: 'active' },
      { id: '3', email: 'john.smith@example.com', firstName: 'John', lastName: 'Smith', status: 'inactive' },
    ];

    const q = (this.searchQuery || '').trim().toLowerCase();
    const filtered = q ? all.filter((u) => u.email.toLowerCase().includes(q)) : all;

    this.totalRecords = filtered.length;
    this.users = filtered.slice(this.first, this.first + this.rows);

    // Trigger change detection after data is loaded (kept from authoritative TS behavior)
    this.cdr.detectChanges();
  }

  // PUBLIC_INTERFACE
  onPageChange(event: any) {
    /** PrimeNG paginator event handler. */
    this.first = event.first;
    this.rows = event.rows;
    this.loadUsers();
  }

  // PUBLIC_INTERFACE
  onSearch() {
    /** Trigger search through the subject for debouncing. */
    this.searchSubject.next(this.searchQuery);
  }

  // PUBLIC_INTERFACE
  addNewUser() {
    /** Opens the Add User modal/drawer. */
    this.showAddUserModal = true;
  }

  // PUBLIC_INTERFACE
  onAddUserModalClose() {
    /** Handles modal close event. */
    this.showAddUserModal = false;
  }

  // PUBLIC_INTERFACE
  onUserAdded() {
    /** Handles user added event; refresh list. */
    this.showAddUserModal = false;
    this.messageService.add({
      severity: 'success',
      summary: 'User added',
      life: 2500,
    });
    this.loadUsers();
  }

  // PUBLIC_INTERFACE
  editUser(user: EditableUser) {
    /** Opens the Edit User drawer with the selected user pre-filled. */
    this.selectedUserForEdit = user;
    this.showEditUserModal = true;
  }

  // PUBLIC_INTERFACE
  onEditUserModalClose() {
    /** Handles Edit drawer close event. */
    this.showEditUserModal = false;
  }

  // PUBLIC_INTERFACE
  onUserUpdated() {
    /** Handles user updated event; refresh list. */
    this.showEditUserModal = false;
    this.messageService.add({
      severity: 'success',
      summary: 'User updated',
      life: 2500,
    });
    this.loadUsers();
  }

  // PUBLIC_INTERFACE
  isLoggedInOrRootUser(user: { id: string }): boolean {
    /**
     * Copied from the authoritative TS.
     * Used to disable actions for the currently logged-in user or root user.
     */
    const userStr =
      globalThis.localStorage?.getItem('user') ||
      globalThis.sessionStorage?.getItem('user');

    if (!userStr) {
      return false;
    }

    try {
      const loggedInUser = JSON.parse(userStr);
      const loggedInUserId = loggedInUser?.id;

      return user.id === loggedInUserId || user.id === '1';
    } catch (error) {
      globalThis.console.error('Error parsing user data:', error);
      return false;
    }
  }
}
