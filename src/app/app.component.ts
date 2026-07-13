import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { MessageService, type SystemStatus } from './message.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import * as AOS from 'aos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private router = inject(Router);
  private messageService = inject(MessageService);
  isAdminRoute = false;
  maintenanceMode = false;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAdminRoute = event.url.includes('admin');
      setTimeout(() => AOS.refresh(), 100);
    });
  }

  ngOnInit() {
    AOS.init({
      duration: 600,
      once: true,
      offset: 50
    });

    this.checkStatus();
  }

  checkStatus() {
    // Only check status on non-admin routes to avoid locking out the admin
    if (!this.isAdminRoute) {
      this.messageService.getSystemStatus().subscribe({
        next: (status) => {
          this.maintenanceMode = status.features.maintenanceMode;
        },
        error: () => {
          // If status check fails, we assume site is up but could also fail safe
        }
      });
    }
  }
}
