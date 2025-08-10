import { Injectable, inject } from '@angular/core';
import * as h3 from 'h3-js';
import * as L from 'leaflet';
import { Feature, HexagonConfig } from '../models/data.model';
import { CoordinateConversionService } from './coordinate-conversation.service';

@Injectable({
  providedIn: 'root'
})
export class HexagonService {
  private readonly coordinateService = inject(CoordinateConversionService);

  private readonly defaultConfig: HexagonConfig = {
    fillOpacity: 0.6,
    strokeOpacity: 0.8,
    strokeWidth: 1
  };

  getHexagonResolution(zoom: number): number {
    if (zoom <= 6) return 3;
    if (zoom <= 8) return 4;
    if (zoom <= 10) return 5;
    if (zoom <= 12) return 6;
    if (zoom <= 14) return 7;
    if (zoom <= 16) return 8;
    return 9;
  }

  createHexagonFromCenter(
    lat: number,
    lng: number,
    color: string,
    id: number,
    resolution: number,
    config: Partial<HexagonConfig> = {}
  ): L.Polygon | null {
    try {
      const hexConfig = { ...this.defaultConfig, ...config };

      const h3Index = h3.latLngToCell(lat, lng, resolution);
      const hexBoundary = h3.cellToBoundary(h3Index);

      const leafletCoords: L.LatLngExpression[] = hexBoundary.map(coord => [coord[0], coord[1]]);

      const hexagon = L.polygon(leafletCoords, {
        fillColor: color,
        fillOpacity: hexConfig.fillOpacity,
        color: color,
        weight: hexConfig.strokeWidth,
        opacity: hexConfig.strokeOpacity
      });

      hexagon.bindPopup(this.createPopupContent(id, color, h3Index, resolution));

      return hexagon;
    } catch (error) {
      console.error('Error creating hexagon:', error);
      return null;
    }
  }

  calculatePolygonCenter(feature: Feature): [number, number] | null {
    try {
      let sumLat = 0;
      let sumLng = 0;
      let count = 0;

      for (const multiPolygon of feature.geometry.coordinates) {
        for (const polygon of multiPolygon) {
          for (const coord of polygon) {
            const [lat, lng] = this.coordinateService.convertEPSG3857ToWGS84([coord[0], coord[1]]);
            sumLat += lat;
            sumLng += lng;
            count++;
          }
        }
      }

      return count > 0 ? [sumLat / count, sumLng / count] : null;
    } catch (error) {
      console.error('Error calculating polygon center:', error);
      return null;
    }
  }

  private createPopupContent(id: number, color: string, h3Index: string, resolution: number): string {
    return `
      <div class="hexagon-popup">
        <strong>Hexagon ID:</strong> ${id}<br>
        <strong>Color:</strong> ${color}<br>
        <strong>H3 Index:</strong> ${h3Index}<br>
        <strong>Resolution:</strong> ${resolution}
      </div>
    `;
  }

  normalizeColor(color: string): string {
    return color.startsWith('#') ? color : `#${color}`;
  }
}
