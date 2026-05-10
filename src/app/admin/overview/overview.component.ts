import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminStats, Message } from '../admin.service';
import * as AOS from 'aos';


@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent implements OnInit {
  private adminService = inject(AdminService);

  loading = true;
  stats: AdminStats | null = null;
  topMessages: Message[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    // Load stats
    this.adminService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    // Load top messages
    this.adminService.getTopMessages('views', 5).subscribe({
      next: (response) => {
        if (response.success) {
          this.topMessages = response.data.messages;
          console.log('Top Messages loaded:', this.topMessages.length);
          setTimeout(() => AOS.refresh(), 200);
        }
      }
    });
  }
}
