import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin, of, concat } from 'rxjs';
import { delay as rxDelay, mergeMap, map } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'Weather API: Sequential vs Parallel';

  citiesInput = '';
  featuredCities: any[] = [];
  userCity: any = null;   // 👈 local weather

  sequentialData: any[] = [];
  parallelData: any[] = [];
  sequentialTime: number | null = null;
  parallelTime: number | null = null;

  weatherNews: any[] = [];

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

  ngAfterViewInit() {
    // re-render charts after DOM exists
    setTimeout(() => this.renderCharts(), 1000);
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
      this.renderCharts();
    });
  }

  chartsRendered = false;

  ngAfterViewChecked() {
    if (this.featuredCities.length && !this.chartsRendered) {
      this.renderCharts();
      this.chartsRendered = true;
    }
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

  renderCharts() {
    this.featuredCities.forEach((city, index) => {
      const ctx = document.getElementById(`chart-${index}`) as HTMLCanvasElement;
      if (!ctx) return;

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: city.forecast.map((f: any) => f.date),
          datasets: [{
            data: city.forecast.map((f: any) => f.temp),
            borderColor: '#ffdd57',
            backgroundColor: 'rgba(255, 221, 87, 0.3)',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#ffdd57'
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#fff' } },
            y: { ticks: { color: '#fff' } }
          }
        }
      });
    });
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
    this.sequentialTime = null;

    const cities = this.citiesInput.split(',').map(c => c.trim());
    const start = performance.now();

    const requests = cities.map(city =>
      of(city).pipe(
        mergeMap(c => this.http.get(`${this.apiUrl}${c}&appid=${this.apiKey}&units=metric`)),
        map((res: any) => ({
          name: res.name,
          temp: res.main?.temp ?? 'Error',
          description: res.weather[0].description,
          icon: res.weather[0].icon
        })),
        rxDelay(1000)
      )
    );

    concat(...requests).subscribe({
      next: result => this.sequentialData.push(result),
      complete: () => {
        const end = performance.now();
        this.sequentialTime = Math.round(end - start);
      }
    });
  }

  runParallel() {
    this.parallelData = [];
    this.parallelTime = null;

    const cities = this.citiesInput.split(',').map(c => c.trim());
    const start = performance.now();

    const requests = cities.map(city =>
      this.fetchWeather(city).pipe(rxDelay(1000))
    );

    forkJoin(requests).subscribe({
      next: results => (this.parallelData = results),
      complete: () => {
        const end = performance.now();
        this.parallelTime = Math.round(end - start);
      }
    });
  }
}
