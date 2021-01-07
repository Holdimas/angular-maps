import { MapPolylineDirective } from '../components/map-polyline';
import { Polyline } from '../models/polyline';
export interface IPolylineEvent {
    Polyline: MapPolylineDirective | Polyline;
    Click: MouseEvent;
}
