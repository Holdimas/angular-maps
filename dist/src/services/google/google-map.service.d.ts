import { GoogleInfoWindow } from '../../models/google/google-info-window';
import { NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { MapService } from '../map.service';
import { MapAPILoader } from '../mapapiloader';
import { ILayerOptions } from '../../interfaces/ilayer-options';
import { IClusterOptions } from '../../interfaces/icluster-options';
import { IMapOptions } from '../../interfaces/imap-options';
import { ILatLong } from '../../interfaces/ilatlong';
import { IPoint } from '../../interfaces/ipoint';
import { ISize } from '../../interfaces/isize';
import { IMarkerOptions } from '../../interfaces/imarker-options';
import { IPolygonOptions } from '../../interfaces/ipolygon-options';
import { IPolylineOptions } from '../../interfaces/ipolyline-options';
import { IInfoWindowOptions } from '../../interfaces/iinfo-window-options';
import { Marker } from '../../models/marker';
import { Polygon } from '../../models/polygon';
import { Polyline } from '../../models/polyline';
import { CanvasOverlay } from '../../models/canvas-overlay';
import { Layer } from '../../models/layer';
import { IBox } from '../../interfaces/ibox';
import * as GoogleMapTypes from './google-map-types';
/**
 * Concrete implementation of the MapService abstract implementing a Google Maps provider
 *
 * @export
 */
export declare class GoogleMapService implements MapService {
    private _loader;
    private _zone;
    private _map;
    private _mapInstance;
    private _mapResolver;
    private _config;
    /**
     * Gets the Google Map control instance underlying the implementation
     *
     * @readonly
     * @memberof GoogleMapService
     */
    get MapInstance(): GoogleMapTypes.GoogleMap;
    /**
     * Gets a Promise for a Google Map control instance underlying the implementation. Use this instead of {@link MapInstance} if you
     * are not sure if and when the instance will be created.
     * @readonly
     * @memberof GoogleMapService
     */
    get MapPromise(): Promise<GoogleMapTypes.GoogleMap>;
    /**
     * Gets the maps physical size.
     *
     * @readonly
     * @abstract
     * @memberof BingMapService
     */
    get MapSize(): ISize;
    /**
     * Creates an instance of GoogleMapService.
     * @param _loader MapAPILoader instance implemented for Google Maps. This instance will generally be injected.
     * @param _zone NgZone object to enable zone aware promises. This will generally be injected.
     *
     * @memberof GoogleMapService
     */
    constructor(_loader: MapAPILoader, _zone: NgZone);
    /**
     * Creates a canvas overlay layer to perform custom drawing over the map with out
     * some of the overhead associated with going through the Map objects.
     * @param drawCallback A callback function that is triggered when the canvas is ready to be
     * rendered for the current map view.
     * @returns - Promise of a {@link CanvasOverlay} object.
     * @memberof GoogleMapService
     */
    CreateCanvasOverlay(drawCallback: (canvas: HTMLCanvasElement) => void): Promise<CanvasOverlay>;
    CreateClusterLayer(options: IClusterOptions): Promise<Layer>;
    /**
     * Creates an information window for a map position
     *
     * @param [options] - Infowindow options. See {@link IInfoWindowOptions}
     * @returns - Promise of a {@link InfoWindow} object, which models the underlying Microsoft.Maps.Infobox object.
     *
     * @memberof GoogleMapService
     */
    CreateInfoWindow(options?: IInfoWindowOptions): Promise<GoogleInfoWindow>;
    /**
     * Creates a map layer within the map context
     *
     * @param options - Options for the layer. See {@link ILayerOptions}
     * @returns - Promise of a {@link Layer} object, which models the underlying Microsoft.Maps.Layer object.
     *
     * @memberof GoogleMapService
     */
    CreateLayer(options: ILayerOptions): Promise<Layer>;
    /**
     * Creates a map instance
     *
     * @param el - HTML element to host the map.
     * @param mapOptions - Map options
     * @returns - Promise fullfilled once the map has been created.
     *
     * @memberof GoogleMapService
     */
    CreateMap(el: HTMLElement, mapOptions: IMapOptions): Promise<void>;
    /**
     * Creates a Google map marker within the map context
     *
     * @param [options=<IMarkerOptions>{}] - Options for the marker. See {@link IMarkerOptions}.
     * @returns - Promise of a {@link Marker} object, which models the underlying Microsoft.Maps.PushPin object.
     *
     * @memberof GoogleMapService
     */
    CreateMarker(options?: IMarkerOptions): Promise<Marker>;
    /**
     * Creates a polygon within the Google Map map context
     *
     * @abstract
     * @param options - Options for the polygon. See {@link IPolygonOptions}.
     * @returns - Promise of a {@link Polygon} object, which models the underlying native polygon.
     *
     * @memberof MapService
     */
    CreatePolygon(options: IPolygonOptions): Promise<Polygon>;
    /**
     * Creates a polyline within the Google Map map context
     *
     * @abstract
     * @param options - Options for the polyline. See {@link IPolylineOptions}.
     * @returns - Promise of a {@link Polyline} object (or an array therefore for complex paths)
     * which models the underlying native polyline.
     *
     * @memberof MapService
     */
    CreatePolyline(options: IPolylineOptions): Promise<Polyline | Array<Polyline>>;
    /**
     * Deletes a layer from the map.
     *
     * @param layer - Layer to delete. See {@link Layer}. This method expects the Google specific Layer model implementation.
     * @returns - Promise fullfilled when the layer has been removed.
     *
     * @memberof GoogleMapService
     */
    DeleteLayer(layer: Layer): Promise<void>;
    /**
     * Dispaose the map and associated resoures.
     *
     * @memberof GoogleMapService
     */
    DisposeMap(): void;
    /**
     * Gets the geo coordinates of the map center
     *
     * @returns - A promise that when fullfilled contains the goe location of the center. See {@link ILatLong}.
     *
     * @memberof GoogleMapService
     */
    GetCenter(): Promise<ILatLong>;
    /**
     * Gets the geo coordinates of the map bounding box
     *
     * @returns - A promise that when fullfilled contains the geo location of the bounding box. See {@link IBox}.
     *
     * @memberof GoogleMapService
     */
    GetBounds(): Promise<IBox>;
    /**
     * Gets the current zoom level of the map.
     *
     * @returns - A promise that when fullfilled contains the zoom level.
     *
     * @memberof GoogleMapService
     */
    GetZoom(): Promise<number>;
    /**
     * Provides a conversion of geo coordinates to pixels on the map control.
     *
     * @param loc - The geo coordinates to translate.
     * @returns - Promise of an {@link IPoint} interface representing the pixels. This promise resolves to null
     * if the goe coordinates are not in the view port.
     *
     * @memberof GoogleMapService
     */
    LocationToPoint(loc: ILatLong): Promise<IPoint>;
    /**
     * Provides a conversion of geo coordinates to pixels on the map control.
     *
     * @param loc - The geo coordinates to translate.
     * @returns - Promise of an {@link IPoint} interface array representing the pixels.
     *
     * @memberof BingMapService
     */
    LocationsToPoints(locs: Array<ILatLong>): Promise<Array<IPoint>>;
    /**
     * Centers the map on a geo location.
     *
     * @param latLng - GeoCoordinates around which to center the map. See {@link ILatLong}
     * @returns - Promise that is fullfilled when the center operations has been completed.
     *
     * @memberof GoogleMapService
     */
    SetCenter(latLng: ILatLong): Promise<void>;
    /**
     * Sets the generic map options.
     *
     * @param options - Options to set.
     *
     * @memberof GoogleMapService
     */
    SetMapOptions(options: IMapOptions): void;
    /**
     * Sets the view options of the map.
     *
     * @param options - Options to set.
     *
     * @memberof GoogleMapService
     */
    SetViewOptions(options: IMapOptions): void;
    /**
     * Sets the zoom level of the map.
     *
     * @param zoom - Zoom level to set.
     * @returns - A Promise that is fullfilled once the zoom operation is complete.
     *
     * @memberof GoogleMapService
     */
    SetZoom(zoom: number): Promise<void>;
    /**
     * Creates an event subscription
     *
     * @param eventName - The name of the event (e.g. 'click')
     * @returns - An observable of type E that fires when the event occurs.
     *
     * @memberof GoogleMapService
     */
    SubscribeToMapEvent<E>(eventName: string): Observable<E>;
    /**
     * Triggers the given event name on the map instance.
     *
     * @param eventName - Event to trigger.
     * @returns - A promise that is fullfilled once the event is triggered.
     *
     * @memberof GoogleMapService
     */
    TriggerMapEvent(eventName: string): Promise<void>;
}
