import { EventEmitter, OnChanges, OnInit, OnDestroy, SimpleChange, AfterViewInit, NgZone } from '@angular/core';
import { MapServiceFactory } from '../services/mapservicefactory';
import { MapService } from '../services/map.service';
import { MarkerService } from '../services/marker.service';
import { InfoBoxService } from '../services/infobox.service';
import { LayerService } from '../services/layer.service';
import { PolygonService } from '../services/polygon.service';
import { PolylineService } from '../services/polyline.service';
import { ClusterService } from '../services/cluster.service';
import { ILatLong } from '../interfaces/ilatlong';
import { IBox } from '../interfaces/ibox';
import { IMapOptions } from '../interfaces/imap-options';
/**
 * Renders a map based on a given provider.
 * **Important note**: To be able see a map in the browser, you have to define a height for the CSS
 * class `map-container`.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent} from '...';
 *
 * @Component({
 *  selector: 'my-map',
 *  styles: [`
 *    .map-container { height: 300px; }
 * `],
 *  template: `
 *    <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom"></x-map>
 *  `
 * })
 * ```
 *
 * @export
 */
export declare class MapComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
    private _mapService;
    private _zone;
    private _longitude;
    private _latitude;
    private _zoom;
    private _clickTimeout;
    private _options;
    private _box;
    private _mapPromise;
    _containerClass: boolean;
    private _container;
    private _markers;
    /**
     * Get or sets the maximum and minimum bounding box for map.
     *
     * @memberof MapComponent
     */
    get Box(): IBox;
    set Box(val: IBox);
    /**
     * Gets or sets the latitude that sets the center of the map.
     *
     * @memberof MapComponent
     */
    get Latitude(): number | string;
    set Latitude(value: number | string);
    /**
     * Gets or sets the longitude that sets the center of the map.
     *
     * @memberof MapComponent
     */
    get Longitude(): number | string;
    set Longitude(value: number | string);
    /**
     * Gets or sets general map Options
     *
     * @memberof MapComponent
     */
    get Options(): IMapOptions;
    set Options(val: IMapOptions);
    /**
     * Gets or sets the zoom level of the map. The default value is `8`.
     *
     * @memberof MapComponent
     */
    get Zoom(): number | string;
    set Zoom(value: number | string);
    /**
     * This event emitter is fired when the map bounding box changes.
     *
     * @memberof MapComponent
     */
    BoundsChange: EventEmitter<IBox>;
    /**
     * This event emitter is fired when the map center changes.
     *
     * @memberof MapComponent
     */
    CenterChange: EventEmitter<ILatLong>;
    /**
     * This event emitter gets emitted when the user clicks on the map (but not when they click on a
     * marker or infoWindow).
     *
     * @memberof MapComponent
     */
    MapClick: EventEmitter<MouseEvent>;
    /**
     * This event emitter gets emitted when the user double-clicks on the map (but not when they click
     * on a marker or infoWindow).
     *
     * @memberof MapComponent
     */
    MapDblClick: EventEmitter<MouseEvent>;
    /**
     * This event emitter gets emitted when the user right-clicks on the map (but not when they click
     * on a marker or infoWindow).
     *
     * @memberof MapComponent
     */
    MapRightClick: EventEmitter<MouseEvent>;
    /**
     * This event emitter gets emitted when the user double-clicks on the map (but not when they click
     * on a marker or infoWindow).
     *
     * @memberof MapComponent
     */
    MapMouseOver: EventEmitter<MouseEvent>;
    /**
     * This event emitter gets emitted when the user double-clicks on the map (but not when they click
     * on a marker or infoWindow).
     *
     * @memberof MapComponent
     */
    MapMouseOut: EventEmitter<MouseEvent>;
    /**
     * This event emitter gets emitted when the user double-clicks on the map (but not when they click
     * on a marker or infoWindow).
     *
     * @memberof MapComponent
     */
    MapMouseMove: EventEmitter<MouseEvent>;
    /**
     * The event emitter is fired when the map service is available and the maps has been
     * Initialized (but not necessarily created). It contains a Promise that when fullfilled returns
     * the main map object of the underlying platform.
     *
     * @memberof MapComponent
     */
    MapPromise: EventEmitter<Promise<any>>;
    /**
     * This event emiiter is fired when the map zoom changes
     *
     * @memberof MapComponent
     */
    ZoomChange: EventEmitter<Number>;
    /**
     * This event emitter is fired when the map service is available and the maps has been
     * Initialized
     * @memberOf MapComponent
     */
    MapService: EventEmitter<MapService>;
    /**
     * Creates an instance of MapComponent.
     *
     * @param _mapService - Concreted implementation of a map service for the underlying maps implementations.
     *                                   Generally provided via injections.
     * @memberof MapComponent
     */
    constructor(_mapService: MapService, _zone: NgZone);
    /**
     * Called on Component initialization. Part of ng Component life cycle.
     *
     * @memberof MapComponent
     */
    ngOnInit(): void;
    ngAfterViewInit(): void;
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof MapComponent
     */
    ngOnChanges(changes: {
        [propName: string]: SimpleChange;
    }): void;
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof MapComponent
     */
    ngOnDestroy(): void;
    /**
     * Triggers a resize event on the map instance.
     *
     * @returns - A promise that gets resolved after the event was triggered.
     *
     * @memberof MapComponent
     */
    TriggerResize(): Promise<void>;
    /**
     * Converts a number-ish value to a number.
     *
     * @param value - The value to convert.
     * @param [defaultValue=null] - Default value to use if the conversion cannot be performed.
     * @returns - Converted number of the default.
     *
     * @memberof MapComponent
     */
    private ConvertToDecimal;
    /**
     * Delegate handling the map click events.
     *
     * @memberof MapComponent
     */
    private HandleMapClickEvents;
    /**
     * Delegate handling map center change events.
     *
     * @memberof MapComponent
     */
    private HandleMapBoundsChange;
    /**
     * Delegate handling map center change events.
     *
     * @memberof MapComponent
     */
    private HandleMapCenterChange;
    /**
     * Delegate handling map zoom change events.
     *
     * @memberof MapComponent
     */
    private HandleMapZoomChange;
    /**
     * Initializes the map.
     *
     * @param el - Html elements which will host the map canvas.
     *
     * @memberof MapComponent
     */
    private InitMapInstance;
    /**
     * Updates the map center based on the geo properties of the component.
     *
     * @memberof MapComponent
     */
    private UpdateCenter;
}
/**
 * Factory function to generate a cluster service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @returns - A concrete instance of a Cluster Service based on the underlying map architecture
 */
export declare function ClusterServiceFactory(f: MapServiceFactory, m: MapService): ClusterService;
/**
 * Factory function to generate a infobox service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @param m - A {@link MarkerService} instance.
 * @returns - A concrete instance of a InfoBox Service based on the underlying map architecture.
 */
export declare function InfoBoxServiceFactory(f: MapServiceFactory, m: MapService, ma: MarkerService): InfoBoxService;
/**
 * Factory function to generate a layer service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @returns - A concrete instance of a Layer Service based on the underlying map architecture.
 */
export declare function LayerServiceFactory(f: MapServiceFactory, m: MapService): LayerService;
/**
 * Factory function to generate a map service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @returns - A concrete instance of a MapService based on the underlying map architecture.
 */
export declare function MapServiceCreator(f: MapServiceFactory): MapService;
/**
 * Factory function to generate a marker service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @param l - A {@link LayerService} instance.
 * @param c - A {@link ClusterService} instance.
 * @returns - A concrete instance of a Marker Service based on the underlying map architecture.
 */
export declare function MarkerServiceFactory(f: MapServiceFactory, m: MapService, l: LayerService, c: ClusterService): MarkerService;
/**
 * Factory function to generate a polygon service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @param l - A {@link LayerService} instance.
 * @returns - A concrete instance of a Polygon Service based on the underlying map architecture.
 */
export declare function PolygonServiceFactory(f: MapServiceFactory, m: MapService, l: LayerService): PolygonService;
/**
 * Factory function to generate a polyline service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @param l - A {@link LayerService} instance.
 * @returns - A concrete instance of a Polyline Service based on the underlying map architecture.
 */
export declare function PolylineServiceFactory(f: MapServiceFactory, m: MapService, l: LayerService): PolylineService;
