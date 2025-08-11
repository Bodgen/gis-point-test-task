import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './components/map/map.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MapComponent],
  providers: [HttpClient],
  templateUrl: './app.component.html' ,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {}
