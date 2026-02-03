import { Component} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Forecast } from "./forecast/forecast";


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, Forecast],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent {
  execStyle: 'sequential' | 'parallel' = 'sequential';

  toggleExecStyle() {
    this.execStyle = this.execStyle === 'sequential' ? 'parallel' : 'sequential';
  }
}
