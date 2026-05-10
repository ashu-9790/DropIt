import { Routes } from '@angular/router';
import { CreatorComponent } from './creator/creator.component';
import { UnveilingComponent } from './unveiling/unveiling.component';
import { TermsComponent } from './legal/terms/terms.component';
import { PrivacyComponent } from './legal/privacy/privacy.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { LoginComponent } from './admin/login/login.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { OverviewComponent } from './admin/overview/overview.component';
import { MessagesComponent } from './admin/messages/messages.component';
import { SettingsComponent } from './admin/settings/settings.component';
import { authGuard } from './admin/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'create',
  },
  {
    path: 'create',
    component: CreatorComponent,
  },
  {
    path: 'view/:id',
    component: UnveilingComponent,
  },
  {
    path: 'terms',
    component: TermsComponent,
  },
  {
    path: 'privacy',
    component: PrivacyComponent,
  },
  {
    path: 'admin-dropitt/login',
    component: LoginComponent,
  },
  {
    path: 'admin-dropitt',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        component: OverviewComponent,
      },
      {
        path: 'messages',
        component: MessagesComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
    ]
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
