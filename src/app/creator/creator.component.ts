import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { MessageService, type Language, type Vibe } from '../message.service';
import { FeedbackService, type Feedback } from '../services/feedback.service';


@Component({
  selector: 'app-creator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './creator.component.html',
  styleUrl: './creator.component.css'
})
export class CreatorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  private readonly previewSharePath = '/view/preview';

  readonly languages: Language[] = ['English', 'Hindi', 'Marathi', 'Hinglish'];

  protected selectedVibe: Vibe | null = null;
  protected formVisible = false;
  protected generating = false;
  protected copyStatus: 'idle' | 'copied' | 'error' = 'idle';
  protected sharePath = '';
  protected shareUrl = '';
  protected errorMessage = '';
  
  // Preview features
  protected showPreview = false;
  protected previewTitle = '';
  protected previewBody = '';
  protected generatedShareId = '';
  protected showSocialShare = false;
  
  // Maintenance flags
  protected roastEnabled = true;
  protected toastEnabled = true;

  // Feedback State
  protected recentFeedbacks: Feedback[] = [];
  protected feedbackVisible = false;
  protected feedbackSubmitting = false;
  protected feedbackError = '';
  protected feedbackSuccess = false;

  // Custom Dropdown State
  protected isLanguageMenuOpen = false;

  // Feedback Carousel State
  @ViewChild('feedbackGrid') feedbackGrid!: ElementRef<HTMLDivElement>;
  protected currentFeedbackIndex = 0;
  protected showScrollTop = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollTop = window.pageYOffset > 400;
  }

  onFeedbackScroll(event: Event) {
    const element = event.target as HTMLDivElement;
    const scrollLeft = element.scrollLeft;
    const width = element.offsetWidth;
    this.currentFeedbackIndex = Math.round(scrollLeft / width);
  }

  scrollFeedback(direction: 'left' | 'right') {
    if (!this.feedbackGrid) return;
    const element = this.feedbackGrid.nativeElement;
    const scrollAmount = element.offsetWidth * 0.8;
    element.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleLanguageMenu(): void {
    if (this.generating) return;
    this.isLanguageMenuOpen = !this.isLanguageMenuOpen;
  }

  selectLanguage(lang: Language): void {
    this.form.patchValue({ language: lang });
    this.isLanguageMenuOpen = false;
  }

  get quirksPlaceholder(): string {
    if (this.selectedVibe === 'Toast') {
      return "What makes them awesome? Mention their achievements, why you're proud of them, or a sweet memory. The more heart you put in, the better the AI gets!";
    }
    return "Their habits, inside jokes, secret chaos, or soft spots. The more 'tea' you spill, the better the AI gets!";
  }

  readonly form = this.fb.nonNullable.group({
    creatorName: ['', [Validators.required, Validators.maxLength(80)]],
    recipientName: ['', [Validators.required, Validators.maxLength(80)]],
    quirks: ['', [Validators.required, Validators.maxLength(500)]],
    language: this.fb.nonNullable.control<Language>(
      'English',
      Validators.required,
    ),
  });

  readonly feedbackForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.required, Validators.maxLength(500)]]
  });

  ngOnInit() {
    this.titleService.setTitle('DropIt - Create a Personalized Roast or Toast');
    this.metaService.updateTag({ 
      name: 'description', 
      content: 'Use our AI to craft the perfect roast or toast for your friends in English, Hindi, Marathi, or Hinglish. Spread vibes and spark reactions!' 
    });
    this.checkFeatureStatus();
    this.loadRecentFeedback();
  }

  loadRecentFeedback() {
    this.feedbackService.getRecentFeedback(5).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.recentFeedbacks = response.data;
        }
      },
      error: () => {
        // Silent fail for feedback loading
      }
    });
  }

  checkFeatureStatus() {
    this.messageService.getSystemStatus().subscribe({
      next: (status) => {
        this.roastEnabled = status.features.roastEnabled;
        this.toastEnabled = status.features.toastEnabled;
      },
      error: () => {
        // Fallback to enabled
      }
    });
  }

  beginDraft(vibe: Vibe): void {
    if (vibe === 'Roast' && !this.roastEnabled) return;
    if (vibe === 'Toast' && !this.toastEnabled) return;
    
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

  shareToTelegram(): void {
    const text = encodeURIComponent(`Check out this ${this.selectedVibe?.toLowerCase()} I made for you! 🎉`);
    const url = encodeURIComponent(this.shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  }

  shareToInstagram(): void {
    if (navigator.share) {
      navigator.share({
        title: 'DropIt',
        text: `Check out this ${this.selectedVibe?.toLowerCase()} I made for you! 🎉`,
        url: this.shareUrl
      }).catch(console.error);
    } else {
      this.copyLink();
      alert('Link copied! Open Instagram to paste and share in your story or messages. 📸');
    }
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

  // Feedback Methods
  openFeedbackModal() {
    this.feedbackVisible = true;
    this.feedbackSuccess = false;
    this.feedbackError = '';
    this.feedbackForm.reset({
      name: '',
      rating: 5,
      comment: ''
    });
  }

  closeFeedbackModal() {
    this.feedbackVisible = false;
  }

  submitFeedback() {
    if (this.feedbackForm.invalid || this.feedbackSubmitting) {
      this.feedbackForm.markAllAsTouched();
      return;
    }

    this.feedbackSubmitting = true;
    this.feedbackError = '';

    const payload = this.feedbackForm.getRawValue();

    this.feedbackService.submitFeedback(payload).subscribe({
      next: (response) => {
        this.feedbackSubmitting = false;
        if (response.success) {
          this.feedbackSuccess = true;
          this.loadRecentFeedback();
          setTimeout(() => this.closeFeedbackModal(), 2000);
        } else {
          this.feedbackError = response.error || 'Failed to submit feedback';
        }
      },
      error: (err) => {
        this.feedbackSubmitting = false;
        this.feedbackError = err.message || 'An error occurred';
      }
    });
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars;
  }
}
