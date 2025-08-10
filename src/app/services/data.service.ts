import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import type { GeoJSONData } from '../models/data.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly http = inject(HttpClient);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly dataLoaded = signal(false);

  private readonly dataSubject = new BehaviorSubject<GeoJSONData | null>(null);
  readonly data$ = this.dataSubject.asObservable();


  loadData(): Observable<GeoJSONData> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<GeoJSONData>('assets/data.json').pipe(
      catchError(() => {
        console.warn('Could not load data.json, using sample data');
        return of();
      }),
      tap(data => {
        this.dataSubject.next(data);
        this.dataLoaded.set(true);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to load data');
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  getCurrentData(): GeoJSONData | null {
    return this.dataSubject.value;
  }
}
