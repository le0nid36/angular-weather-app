import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-detail',
  imports: [],
  templateUrl: './card-detail.html',
  styleUrl: './card-detail.css'
})
export class CardDetail {
  @Input() cityName!: string;
}
