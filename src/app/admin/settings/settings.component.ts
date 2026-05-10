import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, SystemSettings } from '../admin.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  private adminService = inject(AdminService);

  loading = true;
  clearingCache = false;
  settings: SystemSettings | null = null;
  dbInfo: any = null;
  successMessage = '';

  ngOnInit(): void {
    this.loadSettings();
    this.loadDatabaseInfo();
  }

  loadSettings(): void {
    this.loading = true;
    this.adminService.getSettings().subscribe({
      next: (response) => {
        if (response.success) {
          this.settings = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadDatabaseInfo(): void {
    this.adminService.getDatabaseInfo().subscribe({
      next: (response) => {
        if (response.success) {
          this.dbInfo = response.data;
        }
      }
    });
  }

  toggleFeature(feature: 'roast' | 'toast', enabled: boolean): void {
    this.adminService.toggleFeature(feature, enabled).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(`${feature} feature ${enabled ? 'enabled' : 'disabled'}`);
        }
      }
    });
  }

  toggleMaintenance(enabled: boolean): void {
    this.adminService.toggleMaintenance(enabled).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
        }
      }
    });
  }

  clearCache(): void {
    if (!confirm('Clear all cached data?')) return;

    this.clearingCache = true;
    this.adminService.clearCache().subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Cache cleared successfully');
        }
        this.clearingCache = false;
      },
      error: () => {
        this.clearingCache = false;
      }
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}
