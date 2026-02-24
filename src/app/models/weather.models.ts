export interface Weather {
    name: string;
    main?: {
        temp: number;
    };
    weather: {
        description: string;
        icon: string;
    }[];

}