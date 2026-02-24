import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./forecast/forecast').then(m => m.Forecast)
    },
    {
        path: 'card/:name',
        loadComponent: () => import('./card-detail/card-detail').then(m => m.CardDetail)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
