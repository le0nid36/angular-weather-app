import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class ForecastService {
    apiKey = '9aeb3af53f195212ef846c43ad2c0d6a';
    apiUrl = 'https://api.openweathermap.org/data/2.5/weather?q=';
    
    forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast?q=';

    constructor(private http: HttpClient) {}

    getWeather<T>(city: string) {
        return this.http.get<T>(`${this.apiUrl}${city}&appid=${this.apiKey}&units=metric`);
    }

    getForecast<T>(city: string) {
        return this.http.get<T>(`${this.forecastUrl}${city}&appid=${this.apiKey}&units=metric`);
    }
}