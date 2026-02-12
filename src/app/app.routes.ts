import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'test-soap',
        loadComponent: () => import('./features/test-soap/test-soap.component').then(m => m.TestSoapComponent)
    },
    {
        path: '',
        redirectTo: 'test-soap',
        pathMatch: 'full'
    }
];
