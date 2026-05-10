import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Message } from '../admin.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css'
})
export class MessagesComponent implements OnInit {
  private adminService = inject(AdminService);

  loading = true;
  messages: Message[] = [];
  selectedMessages: string[] = [];
  
  currentPage = 1;
  totalPages = 1;
  limit = 50;

  filters = {
    vibe: '',
    language: ''
  };

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.loading = true;
    const filterObj = {
      ...(this.filters.vibe && { vibe: this.filters.vibe }),
      ...(this.filters.language && { language: this.filters.language })
    };

    this.adminService.getMessages(this.currentPage, this.limit, filterObj).subscribe({
      next: (response) => {
        if (response.success) {
          this.messages = response.data.messages;
          this.totalPages = response.data.totalPages;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadMessages();
  }

  clearFilters(): void {
    this.filters = { vibe: '', language: '' };
    this.applyFilters();
  }

  isSelected(shareId: string): boolean {
    return this.selectedMessages.includes(shareId);
  }

  toggleSelect(shareId: string): void {
    const index = this.selectedMessages.indexOf(shareId);
    if (index > -1) {
      this.selectedMessages.splice(index, 1);
    } else {
      this.selectedMessages.push(shareId);
    }
  }

  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.selectedMessages = this.messages.map(m => m.shareId);
    } else {
      this.selectedMessages = [];
    }
  }

  deleteMessage(shareId: string): void {
    if (!confirm('Are you sure you want to delete this message?')) return;

    this.adminService.deleteMessage(shareId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadMessages();
        }
      }
    });
  }

  bulkDelete(): void {
    if (!confirm(`Delete ${this.selectedMessages.length} messages?`)) return;

    this.adminService.bulkDeleteMessages(this.selectedMessages).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedMessages = [];
          this.loadMessages();
        }
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMessages();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadMessages();
    }
  }
}
