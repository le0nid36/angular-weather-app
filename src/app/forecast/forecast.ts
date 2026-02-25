import { IData, IForecast, IWeather } from './../models/weather.models';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { concatMap, forkJoin, from, map, Observable, of, tap, toArray } from 'rxjs';
import { MatAnchor } from "@angular/material/button";
import { ForecastService } from '../services/forecast.service';
import { Card } from '../card/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-forecast',
  imports: [CommonModule, FormsModule, MatAnchor, Card, MatIconModule, MatProgressSpinnerModule, MatIconModule, MatTooltipModule],
  templateUrl: './forecast.html',
  styleUrl: './forecast.scss'
})
export class Forecast implements OnInit {
  featuredCities = 'New York, Tokyo, London';
  execStyle: 'sequential' | 'parallel' = 'sequential';
  execStyles = ['Sequential', 'Parallel'];
  areAllCollapsed: boolean = false;
  expandedSet = new Set<string>();
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  data$: Observable<IData[]> = of([]);

  constructor(private forecastService: ForecastService) {}

  ngOnInit(): void {
    this.search();
  }

  toggleExecStyle(execStyle: string) {
    if (this.execStyle === execStyle) {
      return;
    }

    this.execStyle = this.execStyle === 'sequential' ? 'parallel' : 'sequential';
    this.search();
  }

  collapse() {
    this.areAllCollapsed = !this.areAllCollapsed;

    if (this.execStyle === 'sequential') {
      this.runSequential(this.areAllCollapsed);
    } else {
      this.runParallel(this.areAllCollapsed);
    }
  }

  onToggle(city: string) {
    if(this.expandedSet.has(city)) {
      this.expandedSet.delete(city);
      return;
    }

    this.expandedSet.add(city);
    
    if (this.execStyle === 'sequential') {
      this.runSequential(this.areAllCollapsed);
    } else {
      this.runParallel(this.areAllCollapsed);
    }
  }

  search(): void {
    const regex = RegExp(`^([a-zA-Z\u0080-\u024F]+(?:. |-| |'))*[a-zA-Z\u0080-\u024F]*$`);
    if (!regex.test(this.featuredCities)) {
        return;
    };

    if (this.execStyle === 'sequential') {
      this.runSequential(this.areAllCollapsed);
    } else {
      this.runParallel(this.areAllCollapsed);
    }
  }

  fetchWeather(city: string): Observable<IWeather> {
    return this.forecastService.getWeather<IWeather>(city).pipe(
      map((res: any) => ({
        name: res.name,
        temp: res.main?.temp.toFixed(0).replace('-0', '0'),
        description: res.weather[0].description,
        icon: res.weather[0].icon
      }))
    );
  }

  fetchForecast(city: string): Observable<IForecast[]> {
    return this.forecastService.getForecast<IForecast[]>(city)
    .pipe(
      map((res: any) => {
        const points = res.list.filter((_: any, i: number) => i % 8 === 0).slice(0, 5);
        return points.map((p: {dt: number, main: {temp_max: number, temp_min: number}}) => ({
          weekDay: this.weekDays[new Date(p.dt * 1000).getDay()],
          weekDayTempHigh: p.main.temp_max.toFixed(0).replace('-0', '0'),
          weekDayTempLow: p.main.temp_min.toFixed(0).replace('-0', '0'),
        }));
      })
    );
  }

  runSequential(fetchAdditionalInfo: boolean) {
    const cities = this.featuredCities.split(',').map(c => c.trim());

    this.data$ = from(cities).pipe(
      concatMap(city => 
        forkJoin({
          weather: this.fetchWeather(city),
          forecast: fetchAdditionalInfo ? this.fetchForecast(city) : of(null)
        })
      ),
      tap(data => console.log('data', data)),
      toArray()
    );
  }

  runParallel(fetchAdditionalInfo: boolean) {
    const cities = this.featuredCities.split(',').map(c => c.trim());

    this.data$ = forkJoin(cities.map(city =>
      forkJoin({
        weather: this.fetchWeather(city),
        forecast: fetchAdditionalInfo ? this.fetchForecast(city) : of(null)
      })
    ));
  }
}
