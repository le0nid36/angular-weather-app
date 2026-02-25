import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IData, IForecast } from '../models/weather.models';

@Component({
  selector: 'app-card',
  templateUrl: './card.html',
  styleUrl: './card.scss',
  imports: [MatIconModule],
})
export class Card implements OnChanges {
  @Input() city!: IData;
  @Input() collapseAll!: boolean;
  @Output() toggle = new EventEmitter<string>();

  isExpanded: boolean = false;
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  @Input() forecast!: IForecast[];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['collapseAll']) {
      this.isExpanded = this.collapseAll;
    }
  }

  toggleExpand() {
    this.toggle.emit(this.city.weather.name);
  }
}
