import { Injectable } from '@angular/core';
import proj4 from 'proj4';

@Injectable({
  providedIn: 'root'
})
export class CoordinateConversionService {
  constructor() {
    this.initProjections();
  }

  private initProjections(): void {
    proj4.defs('EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs');
    proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
  }

  convertEPSG3857ToWGS84(coords: [number, number]): [number, number] {
    const converted = proj4('EPSG:3857', 'EPSG:4326', coords);
    return [converted[1], converted[0]];
  }
}
