import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { concat, delay, forkJoin, map, mergeMap, of } from 'rxjs';
import { MatAnchor } from "@angular/material/button";

@Component({
  selector: 'app-forecast',
  imports: [CommonModule, FormsModule, MatAnchor],
  templateUrl: './forecast.html',
  styleUrl: './forecast.scss'
})
export class Forecast implements OnInit {
  @Input() execStyle: 'sequential' | 'parallel' = 'sequential';
  citiesInput = '';
  featuredCities: any[] = [];
  data: any[] = [];
  weatherNews: any[] = [];
  userCity: any = null;

  sequentialData: any[] = [];
  parallelData: any[] = [];

  apiKey = '9aeb3af53f195212ef846c43ad2c0d6a';
  apiUrl = 'https://api.openweathermap.org/data/2.5/weather?q=';
  forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast?q=';

  newsApiKey = '602eb96933f441bfbbbf905dbf29feea';
  newsApiUrl = `https://newsapi.org/v2/everything?q=weather&language=en&sortBy=publishedAt&apiKey=${this.newsApiKey}`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadFeaturedCities();
    this.loadWeatherNews();
    this.loadUserLocationWeather();
  }

  search(): void {

  }

  fetchWeather(city: string) {
    return this.http.get(`${this.apiUrl}${city}&appid=${this.apiKey}&units=metric`).pipe(
      map((res: any) => ({
        name: res.name,
        temp: res.main?.temp ?? 'Error',
        description: res.weather[0].description,
        icon: res.weather[0].icon
      }))
    );
  }
  
  fetchForecast(city: string) {
    return this.http.get(`${this.forecastUrl}${city}&appid=${this.apiKey}&units=metric`).pipe(
      map((res: any) => {
        const points = res.list.filter((_: any, i: number) => i % 8 === 0).slice(0, 5);
        return points.map((p: any) => ({
          date: new Date(p.dt * 1000).toLocaleDateString(),
          temp: p.main.temp
        }));
      })
    );
  }

  loadFeaturedCities() {
    const cities = ['New York', 'Tokyo', 'London'];
    forkJoin(
      cities.map(city =>
        forkJoin([this.fetchWeather(city), this.fetchForecast(city)]).pipe(
          map(([current, forecast]) => ({ ...current, forecast }))
        )
      )
    ).subscribe(data => {
      this.featuredCities = data;
    });
  }

  loadUserLocationWeather() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        this.http
          .get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`)
          .subscribe((res: any) => {
            this.userCity = {
              name: res.name,
              temp: res.main?.temp ?? 'Error',
              description: res.weather[0].description,
              icon: res.weather[0].icon
            };
          });
      });
    }
  }

  loadWeatherNews() {
    this.http.get<any>(this.newsApiUrl).subscribe({
      next: res => {
        this.weatherNews = res.articles.slice(0, 5).map((a: any) => ({
          title: a.title,
          url: a.url,
          image: a.urlToImage
        }));
      },
      error: err => console.error('Error fetching news:', err)
    });
  }

  runSequential() {
    this.sequentialData = [];

    const cities = this.citiesInput.split(',').map(c => c.trim());

    const requests = cities.map(city =>
      of(city).pipe(
        mergeMap(c => this.http.get(`${this.apiUrl}${c}&appid=${this.apiKey}&units=metric`)),
        map((res: any) => ({
          name: res.name,
          temp: res.main?.temp ?? 'Error',
          description: res.weather[0].description,
          icon: res.weather[0].icon
        })),
        delay(1000)
      )
    );

    concat(...requests).subscribe({
      next: result => this.sequentialData.push(result)
    });
  }

  runParallel() {
    this.parallelData = [];

    const cities = this.citiesInput.split(',').map(c => c.trim());

    const requests = cities.map(city =>
      this.fetchWeather(city).pipe(delay(1000))
    );

    forkJoin(requests).subscribe({
      next: results => (this.parallelData = results),
    });
  }
}
