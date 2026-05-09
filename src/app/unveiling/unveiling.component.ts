import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { animate, style, transition, trigger, state } from '@angular/animations';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, type Vibe } from '../message.service';

@Component({
  selector: 'app-unveiling',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unveiling.component.html',
  styleUrl: './unveiling.component.css',
  animations: [
    trigger('fadeAway', [
      transition(':leave', [
        animate(
          '220ms ease-in',
          style({ opacity: 0, transform: 'translateY(10px)' }),
        ),
      ]),
    ]),
    trigger('riseIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(18px)' }),
        animate(
          '380ms 80ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
    trigger('bounce', [
      state('idle', style({ transform: 'scale(1)' })),
      state('active', style({ transform: 'scale(1.1)' })),
      transition('idle <=> active', animate('200ms ease-in-out')),
    ]),
  ],
})
export class UnveilingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  private readonly previewContent = {
    vibe: 'Toast' as Vibe,
    title: 'A little proof of concept.',
    body: 'This preview mode shows the unveiling layout without needing the backend. Once the API is ready, the same page will load real generated messages from the share link.',
  };

  protected loading = true;
  protected revealOpen = false;
  protected errorMessage = '';
  protected vibe: Vibe = 'Toast';
  protected title = '';
  protected body = '';
  protected stats: { views: number; shares: number } | null = null;
  protected copyStatus: 'idle' | 'copied' = 'idle';
  protected showConfetti = false;
  protected selectedReaction: string | null = null;
  protected reactions = ['😂', '🔥', '💀', '😭', '👏', '❤️'];

  ngOnInit(): void {
    const shareId = this.route.snapshot.paramMap.get('id');

    if (shareId === 'preview') {
      this.loading = false;
      this.vibe = this.previewContent.vibe;
      this.title = this.previewContent.title;
      this.body = this.previewContent.body;
      return;
    }

    if (!shareId) {
      this.loading = false;
      this.errorMessage = 'Missing share id.';
      return;
    }

    this.messageService.getMessage(shareId).subscribe({
      next: (response) => {
        this.loading = false;

        if (!response.success) {
          this.errorMessage = 'The message could not be loaded.';
          return;
        }

        this.vibe = response.data.vibe;
        this.title = response.data.content.title;
        this.body = response.data.content.body;
        this.stats = response.data.stats || null;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.errorMessage = this.extractErrorMessage(error);
      },
    });
  }

  reveal(): void {
    this.revealOpen = true;
    this.triggerConfetti();
  }
  
  triggerConfetti(): void {
    this.showConfetti = true;
    setTimeout(() => {
      this.showConfetti = false;
    }, 3000);
  }
  
  reactWithEmoji(emoji: string): void {
    this.selectedReaction = emoji;
    // Here you could send the reaction to backend
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.copyStatus = 'copied';
      setTimeout(() => {
        this.copyStatus = 'idle';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
  
  shareToWhatsApp(): void {
    const text = encodeURIComponent(`Check out this ${this.vibe.toLowerCase()}! 🎉`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  }
  
  shareToTwitter(): void {
    const text = encodeURIComponent(`Just received an epic ${this.vibe.toLowerCase()}! 🔥`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }
  
  shareToInstagram(): void {
    // Instagram doesn't have a direct share URL, so copy link and show message
    this.copyLink();
    alert('Link copied! Open Instagram and paste it in your story or post 📸');
  }
  
  shareToSnapchat(): void {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.snapchat.com/scan?attachmentUrl=${url}`, '_blank');
  }
  
  navigateToCreate(): void {
    this.router.navigate(['/create']);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return (
        error.error?.message ?? error.message ?? 'Unable to load this message.'
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unable to load this message.';
  }
}
