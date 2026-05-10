import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../admin.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.22, 1, 0.36, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);

  loading = false;
  errorMessage = '';

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    console.log('Attempting login...', email); // Debug log

    this.adminService.login(email!, password!).subscribe({
      next: (response) => {
        console.log('Login response:', response); // Debug log
        if (response.success) {
          console.log('Login successful, navigating...'); // Debug log
          this.router.navigate(['/admin-dropitt/overview']);
        } else {
          this.errorMessage = response.error || 'Login failed';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Login error:', error); // Debug log
        this.errorMessage = error.error?.error || 'Invalid credentials';
        this.loading = false;
      }
    });
  }
}
