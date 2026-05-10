import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);

  adminEmail = 'ap548024@gmail.com';
  isMobileMenuOpen = false;

  constructor() {
    this.router.events.subscribe(() => {
      this.isMobileMenuOpen = false;
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  ngOnInit(): void {
    // Verify token on load
    this.adminService.verifyToken().subscribe({
      next: (response) => {
        if (response.success && response.admin) {
          this.adminEmail = response.admin.email;
        }
      },
      error: () => {
        this.router.navigate(['/admin-dropitt/login']);
      }
    });
  }

  logout(): void {
    this.adminService.logout();
    this.router.navigate(['/admin-dropitt/login']);
  }
}
