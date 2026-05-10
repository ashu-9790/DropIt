import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminService } from './admin.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const adminService = inject(AdminService);
  const router = inject(Router);

  // Check if token exists
  const token = localStorage.getItem('admin_token');
  
  if (!token) {
    router.navigate(['/admin-dropitt/login']);
    return false;
  }

  // Verify token with backend
  return adminService.verifyToken().pipe(
    map(response => {
      if (response.success) {
        return true;
      } else {
        router.navigate(['/admin-dropitt/login']);
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/admin-dropitt/login']);
      return of(false);
    })
  );
};
