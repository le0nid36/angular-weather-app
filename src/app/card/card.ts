import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.html',
  styleUrl: './card.scss',
  imports: [],
})
export class Card {
  @Input() city: any;
}
