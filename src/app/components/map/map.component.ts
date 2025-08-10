import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  signal,
  computed,
  inject,
  effect, DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { DataService } from '../../services/data.service';
import { HexagonService } from '../../services/hexagon.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapElement', { static: true })
  private readonly mapElement!: ElementRef<HTMLElement>;

  private readonly destroyRef$ = inject(DestroyRef);
  private readonly hexagonService = inject(HexagonService);
  readonly dataService = inject(DataService);

  private map!: L.Map;
  private layerGroup!: L.LayerGroup;
  private hexagonLayers: L.Polygon[] = [];

  readonly currentZoom = signal(10);
  readonly visibleHexagons = signal(0);
  readonly currentResolution = computed(() =>
    this.hexagonService.getHexagonResolution(this.currentZoom())
  );

  ngOnInit(): void {
    this.dataService.data$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe(data => {
        if (data && this.map) {
          this.updateHexagons();
        }
      });
  }

  ngAfterViewInit(): void {
    this.initializeMap().then(() => this.loadHexagonData());
    this.setupMapEventListeners();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): Promise<void> {
    this.map = L.map(this.mapElement.nativeElement, {
      center: [50.4501, 30.5234], // Kyiv coordinates
      zoom: 10,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.layerGroup = L.layerGroup().addTo(this.map);

    this.currentZoom.set(this.map.getZoom());

    return Promise.resolve();
  }

  private setupMapEventListeners(): void {
    this.map.on('zoomend', () => {
      this.currentZoom.set(this.map.getZoom());
      this.updateHexagons();
    });

    this.map.on('moveend', () => {
      this.updateHexagons();
    });

    let moveTimeout: any;
    this.map.on('move', () => {
      if (moveTimeout) {
        clearTimeout(moveTimeout);
      }

      // Only update after user stops moving for 200ms
      moveTimeout = setTimeout(() => {
        this.updateHexagons();
      }, 200);
    });

    this.destroyRef$.onDestroy(() => {
      if (moveTimeout) {
        clearTimeout(moveTimeout);
      }
    });
  }

  private updateHexagons(): void {
    const data = this.dataService.getCurrentData();
    if (!data) return;

    const bounds = this.map.getBounds();
    const paddedBounds = bounds.pad(0.2); // Add 20% padding

    this.layerGroup.clearLayers();
    this.hexagonLayers.length = 0;

    const resolution = this.currentResolution();
    let visibleCount = 0;
    const maxHexagons = 1000;

    const processFeatures = (startIndex: number = 0) => {
      const batchSize = 50; // Process in small batches
      const endIndex = Math.min(startIndex + batchSize, data.features.length);

      for (let i = startIndex; i < endIndex && visibleCount < maxHexagons; i++) {
        const feature = data.features[i];
        const center = this.hexagonService.calculatePolygonCenter(feature);
        if (!center) continue;

        const [centerLat, centerLng] = center;

        if (paddedBounds.contains([centerLat, centerLng])) {
          const color = this.hexagonService.normalizeColor(feature.properties.COLOR_HEX);
          const hexagon = this.hexagonService.createHexagonFromCenter(
            centerLat,
            centerLng,
            color,
            feature.properties.ID,
            resolution
          );

          if (hexagon) {
            this.hexagonLayers.push(hexagon);
            this.layerGroup.addLayer(hexagon);
            visibleCount++;
          }
        }
      }

      if (endIndex < data.features.length && visibleCount < maxHexagons) {
        requestAnimationFrame(() => processFeatures(endIndex));
      } else {
        this.visibleHexagons.set(visibleCount);
      }
    };

    requestAnimationFrame(() => processFeatures());
  }

  loadHexagonData(): void {
    this.dataService.loadData()
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe({
        next: () => {
          console.log('Hexagon data loaded successfully');
        },
        error: (error) => {
          console.error('Failed to load hexagon data:', error);
        }
      });
  }
}
