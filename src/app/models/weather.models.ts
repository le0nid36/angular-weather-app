export interface IWeather {
    name: string;
    temp: string;
    description: string;
    icon: string;
}

export interface IForecast {
    weekDay: string;
    weekDayTempLow: string;
    weekDayTempHigh: string;
}

export interface IData {
    weather: IWeather;
    forecast: IForecast[] | null;
}