import { MapPolygonDirective } from '../components/map-polygon';
import { Polygon } from '../models/polygon';
import { ILatLong } from './ilatlong';
export interface IPolygonEvent {
    Polygon: MapPolygonDirective | Polygon;
    Click: MouseEvent;
    OriginalPath?: Array<Array<ILatLong>>;
    NewPath?: Array<Array<ILatLong>>;
}
