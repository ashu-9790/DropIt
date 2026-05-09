import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilsService } from './utils.service';

@Component({
  selector: 'app-social-share',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex gap-3 flex-wrap">
      <button
        *ngIf="showWebShare"
        (click)="shareViaWeb()"
        class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        [attr.aria-label]="'Share ' + vibe"
      >
        <span>📤</span>
        <span>Share</span>
      </button>

      <a
        *ngIf="showTwitter"
        [href]="twitterUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition"
        aria-label="Share on Twitter"
      >
        <span>𝕏</span>
        <span>Tweet</span>
      </a>

      <a
        *ngIf="showFacebook"
        [href]="facebookUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        aria-label="Share on Facebook"
      >
        <span>f</span>
        <span>Share</span>
      </a>

      <a
        *ngIf="showLinkedIn"
        [href]="linkedinUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
        aria-label="Share on LinkedIn"
      >
        <span>in</span>
        <span>Share</span>
      </a>

      <a
        *ngIf="showWhatsApp"
        [href]="whatsappUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        aria-label="Share on WhatsApp"
      >
        <span>💬</span>
        <span>WhatsApp</span>
      </a>

      <button
        (click)="copyLink()"
        class="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        [attr.aria-label]="'Copy link'"
      >
        <span>🔗</span>
        <span>{{ copyStatus === 'copied' ? 'Copied!' : 'Copy Link' }}</span>
      </button>
    </div>
  `,
})
export class SocialShareComponent {
  @Input() shareUrl: string = '';
  @Input() title: string = 'Check this out!';
  @Input() vibe: 'Roast' | 'Toast' = 'Roast';
  @Input() recipient: string = '';

  @Input() showWebShare = true;
  @Input() showTwitter = true;
  @Input() showFacebook = true;
  @Input() showLinkedIn = true;
  @Input() showWhatsApp = true;

  copyStatus: 'idle' | 'copied' = 'idle';

  private readonly utils = inject(UtilsService);

  get twitterUrl(): string {
    const text = this.utils.generateShareText(this.vibe, this.recipient);
    return this.utils.generateSocialShareUrls(this.shareUrl, this.title, text).twitter;
  }

  get facebookUrl(): string {
    return this.utils.generateSocialShareUrls(this.shareUrl, this.title, '').facebook;
  }

  get linkedinUrl(): string {
    return this.utils.generateSocialShareUrls(this.shareUrl, this.title, '').linkedin;
  }

  get whatsappUrl(): string {
    const text = this.utils.generateShareText(this.vibe, this.recipient);
    return this.utils.generateSocialShareUrls(this.shareUrl, this.title, text).whatsapp;
  }

  async shareViaWeb(): Promise<void> {
    const shared = await this.utils.shareViaWebShare({
      title: this.title,
      text: this.utils.generateShareText(this.vibe, this.recipient),
      url: this.shareUrl,
    });

    if (shared) {
      // Track share
      console.log('Shared via Web Share API');
    }
  }

  async copyLink(): Promise<void> {
    const copied = await this.utils.copyToClipboard(this.shareUrl);
    if (copied) {
      this.copyStatus = 'copied';
      setTimeout(() => {
        this.copyStatus = 'idle';
      }, 2000);
    }
  }
}
