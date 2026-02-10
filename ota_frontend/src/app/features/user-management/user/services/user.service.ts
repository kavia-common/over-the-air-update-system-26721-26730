import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { User, UsersResponse, GetUsersParams } from '../../user-management/user/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = '/api/v1/users';
  private apiService = inject(ApiService);

  getUsers(params: GetUsersParams): Observable<UsersResponse> {
    // Headers will be added by the shell's auth interceptor

    // Build query parameters
    let httpParams = new HttpParams().set('status', params.status);

    if (params.email) {
      httpParams = httpParams.set('email', params.email);
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.sortDir) {
      httpParams = httpParams.set('sortDir', params.sortDir);
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.offset !== undefined) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }

    return this.apiService.get<UsersResponse>(this.apiUrl, {
      params: httpParams,
    });
  }

  deleteUser(userId: string): Observable<void> {
    return this.apiService.delete<void>(`${this.apiUrl}/${userId}`);
  }

  getUserById(userId: string): Observable<User> {
    return this.apiService.get<User>(`${this.apiUrl}/${userId}`);
  }

  createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roles: string[];
    natcos: string;
    status: string;
  }): Observable<User> {
    return this.apiService.post<User>(this.apiUrl, userData);
  }

  // PUBLIC_INTERFACE
  updateUser(
    userId: string,
    userData: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      roles: string[];
      natcos: string;
      status: string;
    }>,
  ): Observable<User> {
    /**
     * Updates an existing user.
     *
     * Intended for the "Edit User" drawer/session: submit edited fields to the backend.
     * Uses PATCH to support partial updates (e.g., password omitted unless changed).
     *
     * @param userId - The ID of the user to update.
     * @param userData - Partial user fields to update.
     * @returns Observable<User> - The updated user returned by the API.
     */
    return this.apiService.patch<User>(`${this.apiUrl}/${userId}`, userData);
  }
}
