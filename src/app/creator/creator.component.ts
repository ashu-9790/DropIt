import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService, type Language, type Vibe } from '../message.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './creator.component.html',
  styleUrl: './creator.component.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.22, 1, 0.36, 1)', 
          style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class CreatorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  private readonly previewSharePath = '/view/preview';

  readonly languages: Language[] = ['English', 'Hindi', 'Marathi'];

  protected selectedVibe: Vibe | null = null;
  protected formVisible = false;
  protected generating = false;
  protected copyStatus: 'idle' | 'copied' | 'error' = 'idle';
  protected sharePath = '';
  protected shareUrl = '';
  protected errorMessage = '';
  
  // New preview/edit features
  protected showPreview = false;
  protected previewTitle = '';
  protected previewBody = '';
  protected isEditing = false;
  protected generatedShareId = '';
  protected showSocialShare = false;

  readonly form = this.fb.nonNullable.group({
    creatorName: ['', [Validators.required, Validators.maxLength(80)]],
    recipientName: ['', [Validators.required, Validators.maxLength(80)]],
    quirks: ['', [Validators.required, Validators.maxLength(500)]],
    language: this.fb.nonNullable.control<Language>(
      'English',
      Validators.required,
    ),
  });
  
  readonly editForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    body: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  beginDraft(vibe: Vibe): void {
    this.selectedVibe = vibe;
    this.formVisible = true;
    this.generating = false;
    this.errorMessage = '';
    this.copyStatus = 'idle';
    this.sharePath = '';
    this.shareUrl = '';
    this.showPreview = false;
    this.showSocialShare = false;
    this.form.reset({
      creatorName: '',
      recipientName: '',
      quirks: '',
      language: 'English',
    });
  }

  resetDraft(): void {
    this.selectedVibe = null;
    this.formVisible = false;
    this.generating = false;
    this.errorMessage = '';
    this.copyStatus = 'idle';
    this.sharePath = '';
    this.shareUrl = '';
    this.showPreview = false;
    this.showSocialShare = false;
    this.form.reset({
      creatorName: '',
      recipientName: '',
      quirks: '',
      language: 'English',
    });
  }

  submit(): void {
    if (!this.selectedVibe || this.form.invalid || this.generating) {
      this.form.markAllAsTouched();
      return;
    }

    this.generating = true;
    this.errorMessage = '';
    this.copyStatus = 'idle';

    const payload = {
      creator_name: this.form.controls.creatorName.value.trim(),
      recipient_name: this.form.controls.recipientName.value.trim(),
      quirks: this.form.controls.quirks.value.trim(),
      vibe: this.selectedVibe,
      language: this.form.controls.language.value,
    };

    this.messageService.generateMessage(payload).subscribe({
      next: (response) => {
        console.log('Generate response:', response);
        this.generating = false;

        if (!response.success || !response.share_id) {
          console.log('No success or share_id, using preview link');
          this.usePreviewShareLink();
          return;
        }

        // Store share ID and fetch the message to get content
        this.generatedShareId = response.share_id;
        console.log('Fetching message for share_id:', response.share_id);
        
        // Fetch the message content
        this.messageService.getMessage(response.share_id).subscribe({
          next: (msgResponse) => {
            console.log('Message response:', msgResponse);
            if (msgResponse.success && msgResponse.data.content) {
              this.previewTitle = msgResponse.data.content.title;
              this.previewBody = msgResponse.data.content.body;
              this.editForm.patchValue({
                title: this.previewTitle,
                body: this.previewBody,
              });
              console.log('Setting showPreview = true');
              this.showPreview = true;
              this.formVisible = false;
            } else {
              console.log('Message response not valid, using preview link');
              this.usePreviewShareLink();
            }
          },
          error: (err) => {
            console.error('Error fetching message:', err);
            this.usePreviewShareLink();
          }
        });
      },
      error: (error: unknown) => {
        console.error('Generate error:', error);
        this.generating = false;
        this.errorMessage = `${this.extractErrorMessage(error)} Showing a preview link for now.`;
        this.usePreviewShareLink();
      },
    });
  }
  
  enableEdit(): void {
    this.isEditing = true;
  }
  
  cancelEdit(): void {
    this.isEditing = false;
    this.editForm.patchValue({
      title: this.previewTitle,
      body: this.previewBody,
    });
  }
  
  saveEdit(): void {
    if (this.editForm.invalid) return;
    
    this.previewTitle = this.editForm.controls.title.value.trim();
    this.previewBody = this.editForm.controls.body.value.trim();
    this.isEditing = false;
  }
  
  approveAndShare(): void {
    this.sharePath = `/view/${this.generatedShareId}`;
    this.shareUrl = `${window.location.origin}${this.sharePath}`;
    this.showPreview = false;
    this.showSocialShare = true;
  }
  
  regenerate(): void {
    this.showPreview = false;
    this.formVisible = true;
  }

  async copyLink(): Promise<void> {
    if (!this.shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.shareUrl);
      this.copyStatus = 'copied';
      setTimeout(() => {
        this.copyStatus = 'idle';
      }, 2000);
    } catch {
      this.copyStatus = 'error';
    }
  }
  
  shareToWhatsApp(): void {
    const text = encodeURIComponent(`Check out this ${this.selectedVibe?.toLowerCase()} I made for you! 🎉`);
    const url = encodeURIComponent(this.shareUrl);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  }
  
  shareToTwitter(): void {
    const text = encodeURIComponent(`I just created an epic ${this.selectedVibe?.toLowerCase()}! 🔥`);
    const url = encodeURIComponent(this.shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }
  
  shareToFacebook(): void {
    const url = encodeURIComponent(this.shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }
  
  shareToLinkedIn(): void {
    const url = encodeURIComponent(this.shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return (
        error.error?.message ??
        error.message ??
        'Unable to generate the message.'
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unable to generate the message.';
  }

  private usePreviewShareLink(): void {
    this.sharePath = this.previewSharePath;
    this.shareUrl = `${window.location.origin}${this.sharePath}`;
    this.formVisible = false;
  }
}
