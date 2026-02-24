import { map, Observable } from 'rxjs';
import { ForecastService } from './../services/forecast.service';
import { Component, Input, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-card',
  templateUrl: './card.html',
  styleUrl: './card.scss',
  imports: [AsyncPipe, MatIconModule],
})
export class Card implements OnInit{
  @Input() city: any;
  isExpanded: boolean = false;

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  forecast$!: Observable<any>;

  constructor(private forecastService: ForecastService) {}

  ngOnInit(): void {
    this.forecast$ = this.fetchForecast(this.city.name);
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  fetchForecast(city: string) {
    return this.forecastService.getForecast(city)
    .pipe(
      map((res: any) => {
        const points = res.list.filter((_: any, i: number) => i % 8 === 0).slice(0, 5);
        return points.map((p: {dt: number, main: {temp: number}}) => ({
          date: this.weekDays[new Date(p.dt * 1000).getDay()],
          temp: p.main.temp.toFixed(0),
        }));
      })
    );
  }
}
