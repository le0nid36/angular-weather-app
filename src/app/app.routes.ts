import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./forecast/forecast').then(m => m.Forecast)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
