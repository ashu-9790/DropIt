import { Routes } from '@angular/router';
import { CreatorComponent } from './creator/creator.component';
import { UnveilingComponent } from './unveiling/unveiling.component';
import { TermsComponent } from './legal/terms/terms.component';
import { PrivacyComponent } from './legal/privacy/privacy.component';
import { NotFoundComponent } from './not-found/not-found.component';

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
    path: '**',
    component: NotFoundComponent,
  },
];
