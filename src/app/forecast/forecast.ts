import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { concatMap, delay, finalize, forkJoin, from, map, Observable, of, toArray } from 'rxjs';
import { MatAnchor } from "@angular/material/button";
import { ForecastService } from '../services/forecast.service';
import { Card } from '../card/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-forecast',
  imports: [CommonModule, FormsModule, MatAnchor, Card, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './forecast.html',
  styleUrl: './forecast.scss'
})
export class Forecast implements OnInit {
  @Input() execStyle: 'sequential' | 'parallel' = 'sequential';
  citiesInput = '';
  featuredCities = ['New York', 'Tokyo', 'London'];

  data$: Observable<any[]> = of([]);

  constructor(private forecastService: ForecastService) {}

  ngOnInit() {
    this.loadDefaultCities();
  }

  search(): void {
    const citiesSplit = this.citiesInput.split(',');
    if(citiesSplit.length === 0 || citiesSplit[0].trim() === '') {
      this.citiesInput = '';
      return;
    }

    if (this.execStyle === 'sequential') {
      this.runSequential();
    } else {
      this.runParallel();
    }
  }

  fetchWeather(city: string) {
    return this.forecastService.getWeather(city).pipe(
      map((res: any) => ({
        name: res.name,
        temp: res.main?.temp ?? 'Error',
        description: res.weather[0].description,
        icon: res.weather[0].icon
      }))
    );
  }
  
  fetchForecast(city: string) {
    return this.forecastService.getForecast(city).pipe(
      map((res: any) => {
        const points = res.list.filter((_: any, i: number) => i % 8 === 0).slice(0, 5);
        return points.map((p: any) => ({
          date: new Date(p.dt * 1000).toLocaleDateString(),
          temp: p.main.temp
        }));
      })
    );
  }

  loadDefaultCities() {
    this.data$ = forkJoin(
      this.featuredCities.map(city =>
        forkJoin([this.fetchWeather(city), this.fetchForecast(city)]).pipe(
          map(([current, forecast]) => ({ ...current, forecast }))
        )
      )
    );
  }

  runSequential() {
    const cities = this.citiesInput.split(',').map(c => c.trim());

    this.data$ = from(cities).pipe(
      concatMap(city => this.fetchWeather(city)),
      delay(500),
      toArray()
    );
  }

  runParallel() {
    const cities = this.citiesInput.split(',').map(c => c.trim());

    const requests = cities.map(city =>
      this.fetchWeather(city).pipe(delay(500))
    );

    this.data$ = forkJoin(requests);
  }
}
