import { Component, EventEmitter, ViewChild, ContentChildren, Input, Output, HostBinding, ViewEncapsulation, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { MapServiceFactory } from '../services/mapservicefactory';
import { MapService } from '../services/map.service';
import { MarkerService } from '../services/marker.service';
import { InfoBoxService } from '../services/infobox.service';
import { LayerService } from '../services/layer.service';
import { PolygonService } from '../services/polygon.service';
import { PolylineService } from '../services/polyline.service';
import { ClusterService } from '../services/cluster.service';
import { MapTypeId } from '../models/map-type-id';
import { MapMarkerDirective } from './map-marker';
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
export class MapComponent {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapComponent.
     *
     * @param _mapService - Concreted implementation of a map service for the underlying maps implementations.
     *                                   Generally provided via injections.
     * @memberof MapComponent
     */
    constructor(_mapService, _zone) {
        this._mapService = _mapService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._longitude = 0;
        this._latitude = 0;
        this._zoom = 0;
        this._options = {};
        this._box = null;
        this._containerClass = true;
        /**
         * This event emitter is fired when the map bounding box changes.
         *
         * @memberof MapComponent
         */
        this.BoundsChange = new EventEmitter();
        /**
         * This event emitter is fired when the map center changes.
         *
         * @memberof MapComponent
         */
        this.CenterChange = new EventEmitter();
        /**
         * This event emitter gets emitted when the user clicks on the map (but not when they click on a
         * marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapClick = new EventEmitter();
        /**
         * This event emitter gets emitted when the user double-clicks on the map (but not when they click
         * on a marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapDblClick = new EventEmitter();
        /**
         * This event emitter gets emitted when the user right-clicks on the map (but not when they click
         * on a marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapRightClick = new EventEmitter();
        /**
         * This event emitter gets emitted when the user double-clicks on the map (but not when they click
         * on a marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapMouseOver = new EventEmitter();
        /**
         * This event emitter gets emitted when the user double-clicks on the map (but not when they click
         * on a marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapMouseOut = new EventEmitter();
        /**
         * This event emitter gets emitted when the user double-clicks on the map (but not when they click
         * on a marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapMouseMove = new EventEmitter();
        /**
         * The event emitter is fired when the map service is available and the maps has been
         * Initialized (but not necessarily created). It contains a Promise that when fullfilled returns
         * the main map object of the underlying platform.
         *
         * @memberof MapComponent
         */
        this.MapPromise = new EventEmitter();
        /**
         * This event emiiter is fired when the map zoom changes
         *
         * @memberof MapComponent
         */
        this.ZoomChange = new EventEmitter();
        /**
         * This event emitter is fired when the map service is available and the maps has been
         * Initialized
         * @memberOf MapComponent
         */
        this.MapService = new EventEmitter();
    }
    ///
    /// Property declarations
    ///
    /**
     * Get or sets the maximum and minimum bounding box for map.
     *
     * @memberof MapComponent
     */
    get Box() { return this._box; }
    set Box(val) { this._box = val; }
    /**
     * Gets or sets the latitude that sets the center of the map.
     *
     * @memberof MapComponent
     */
    get Latitude() { return this._longitude; }
    set Latitude(value) {
        this._latitude = this.ConvertToDecimal(value);
        this.UpdateCenter();
    }
    /**
     * Gets or sets the longitude that sets the center of the map.
     *
     * @memberof MapComponent
     */
    get Longitude() { return this._longitude; }
    set Longitude(value) {
        this._longitude = this.ConvertToDecimal(value);
        this.UpdateCenter();
    }
    /**
     * Gets or sets general map Options
     *
     * @memberof MapComponent
     */
    get Options() { return this._options; }
    set Options(val) { this._options = val; }
    /**
     * Gets or sets the zoom level of the map. The default value is `8`.
     *
     * @memberof MapComponent
     */
    get Zoom() { return this._zoom; }
    set Zoom(value) {
        this._zoom = this.ConvertToDecimal(value, 8);
        if (typeof this._zoom === 'number') {
            this._mapService.SetZoom(this._zoom);
        }
    }
    ///
    /// Public methods
    ///
    /**
     * Called on Component initialization. Part of ng Component life cycle.
     *
     * @memberof MapComponent
     */
    ngOnInit() {
        this.MapPromise.emit(this._mapService.MapPromise);
        this.MapService.emit(this._mapService);
    }
    ngAfterViewInit() {
        this.InitMapInstance(this._container.nativeElement);
    }
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof MapComponent
     */
    ngOnChanges(changes) {
        if (this._mapPromise) {
            if (changes['Box']) {
                if (this._box != null) {
                    this._mapService.SetViewOptions({
                        bounds: this._box
                    });
                }
            }
            if (changes['Options']) {
                this._mapService.SetMapOptions(this._options);
            }
        }
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof MapComponent
     */
    ngOnDestroy() {
        this._mapService.DisposeMap();
    }
    /**
     * Triggers a resize event on the map instance.
     *
     * @returns - A promise that gets resolved after the event was triggered.
     *
     * @memberof MapComponent
     */
    TriggerResize() {
        // Note: When we would trigger the resize event and show the map in the same turn (which is a
        // common case for triggering a resize event), then the resize event would not
        // work (to show the map), so we trigger the event in a timeout.
        return new Promise((resolve) => {
            setTimeout(() => { return this._mapService.TriggerMapEvent('resize').then(() => resolve()); });
        });
    }
    ///
    /// Private methods.
    ///
    /**
     * Converts a number-ish value to a number.
     *
     * @param value - The value to convert.
     * @param [defaultValue=null] - Default value to use if the conversion cannot be performed.
     * @returns - Converted number of the default.
     *
     * @memberof MapComponent
     */
    ConvertToDecimal(value, defaultValue = null) {
        if (typeof value === 'string') {
            return parseFloat(value);
        }
        else if (typeof value === 'number') {
            return value;
        }
        return defaultValue;
    }
    /**
     * Delegate handling the map click events.
     *
     * @memberof MapComponent
     */
    HandleMapClickEvents() {
        this._mapService.SubscribeToMapEvent('click').subscribe(e => {
            //
            // this is necessary since bing will treat a doubleclick first as two clicks...'
            ///
            this._clickTimeout = setTimeout(() => {
                this.MapClick.emit(e);
            }, 300);
        });
        this._mapService.SubscribeToMapEvent('dblclick').subscribe(e => {
            if (this._clickTimeout) {
                clearTimeout(this._clickTimeout);
            }
            this.MapDblClick.emit(e);
        });
        this._mapService.SubscribeToMapEvent('rightclick').subscribe(e => {
            this.MapRightClick.emit(e);
        });
        this._mapService.SubscribeToMapEvent('mouseover').subscribe(e => {
            this.MapMouseOver.emit(e);
        });
        this._mapService.SubscribeToMapEvent('mouseout').subscribe(e => {
            this.MapMouseOut.emit(e);
        });
        this._mapService.SubscribeToMapEvent('mousemove').subscribe(e => {
            this.MapMouseMove.emit(e);
        });
    }
    /**
     * Delegate handling map center change events.
     *
     * @memberof MapComponent
     */
    HandleMapBoundsChange() {
        this._mapService.SubscribeToMapEvent('boundschanged').subscribe(() => {
            this._mapService.GetBounds().then((bounds) => {
                this.BoundsChange.emit(bounds);
            });
        });
    }
    /**
     * Delegate handling map center change events.
     *
     * @memberof MapComponent
     */
    HandleMapCenterChange() {
        this._mapService.SubscribeToMapEvent('centerchanged').subscribe(() => {
            this._mapService.GetCenter().then((center) => {
                if (this._latitude !== center.latitude || this._longitude !== center.longitude) {
                    this._latitude = center.latitude;
                    this._longitude = center.longitude;
                    this.CenterChange.emit({ latitude: this._latitude, longitude: this._longitude });
                }
            });
        });
    }
    /**
     * Delegate handling map zoom change events.
     *
     * @memberof MapComponent
     */
    HandleMapZoomChange() {
        this._mapService.SubscribeToMapEvent('zoomchanged').subscribe(() => {
            this._mapService.GetZoom().then((z) => {
                if (this._zoom !== z) {
                    this._zoom = z;
                    this.ZoomChange.emit(z);
                }
            });
        });
    }
    /**
     * Initializes the map.
     *
     * @param el - Html elements which will host the map canvas.
     *
     * @memberof MapComponent
     */
    InitMapInstance(el) {
        this._zone.runOutsideAngular(() => {
            if (this._options.center == null) {
                this._options.center = { latitude: this._latitude, longitude: this._longitude };
            }
            if (this._options.zoom == null) {
                this._options.zoom = this._zoom;
            }
            if (this._options.mapTypeId == null) {
                this._options.mapTypeId = MapTypeId.hybrid;
            }
            if (this._box != null) {
                this._options.bounds = this._box;
            }
            this._mapPromise = this._mapService.CreateMap(el, this._options);
            this.HandleMapCenterChange();
            this.HandleMapBoundsChange();
            this.HandleMapZoomChange();
            this.HandleMapClickEvents();
        });
    }
    /**
     * Updates the map center based on the geo properties of the component.
     *
     * @memberof MapComponent
     */
    UpdateCenter() {
        if (typeof this._latitude !== 'number' || typeof this._longitude !== 'number') {
            return;
        }
        this._mapService.SetCenter({
            latitude: this._latitude,
            longitude: this._longitude,
        });
    }
}
MapComponent.decorators = [
    { type: Component, args: [{
                selector: 'x-map',
                providers: [
                    { provide: MapService, deps: [MapServiceFactory], useFactory: MapServiceCreator },
                    { provide: MarkerService, deps: [MapServiceFactory, MapService, LayerService, ClusterService], useFactory: MarkerServiceFactory },
                    {
                        provide: InfoBoxService, deps: [MapServiceFactory, MapService,
                            MarkerService], useFactory: InfoBoxServiceFactory
                    },
                    { provide: LayerService, deps: [MapServiceFactory, MapService], useFactory: LayerServiceFactory },
                    { provide: ClusterService, deps: [MapServiceFactory, MapService], useFactory: ClusterServiceFactory },
                    { provide: PolygonService, deps: [MapServiceFactory, MapService, LayerService], useFactory: PolygonServiceFactory },
                    { provide: PolylineService, deps: [MapServiceFactory, MapService, LayerService], useFactory: PolylineServiceFactory }
                ],
                template: `
        <div #container class='map-container-inner'></div>
        <div class='map-content'>
            <ng-content></ng-content>
        </div>
    `,
                encapsulation: ViewEncapsulation.None,
                changeDetection: ChangeDetectionStrategy.OnPush,
                styles: [`
        .map-container-inner { width: inherit; height: inherit; }
        .map-container-inner div { background-repeat: no-repeat; }
        .map-content { display:none; }
    `]
            },] }
];
MapComponent.ctorParameters = () => [
    { type: MapService },
    { type: NgZone }
];
MapComponent.propDecorators = {
    _containerClass: [{ type: HostBinding, args: ['class.map-container',] }],
    _container: [{ type: ViewChild, args: ['container',] }],
    _markers: [{ type: ContentChildren, args: [MapMarkerDirective,] }],
    Box: [{ type: Input }],
    Latitude: [{ type: Input }],
    Longitude: [{ type: Input }],
    Options: [{ type: Input }],
    Zoom: [{ type: Input }],
    BoundsChange: [{ type: Output }],
    CenterChange: [{ type: Output }],
    MapClick: [{ type: Output }],
    MapDblClick: [{ type: Output }],
    MapRightClick: [{ type: Output }],
    MapMouseOver: [{ type: Output }],
    MapMouseOut: [{ type: Output }],
    MapMouseMove: [{ type: Output }],
    MapPromise: [{ type: Output }],
    ZoomChange: [{ type: Output }],
    MapService: [{ type: Output }]
};
/**
 * Factory function to generate a cluster service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @returns - A concrete instance of a Cluster Service based on the underlying map architecture
 */
export function ClusterServiceFactory(f, m) { return f.CreateClusterService(m); }
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
export function InfoBoxServiceFactory(f, m, ma) { return f.CreateInfoBoxService(m, ma); }
/**
 * Factory function to generate a layer service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @returns - A concrete instance of a Layer Service based on the underlying map architecture.
 */
export function LayerServiceFactory(f, m) { return f.CreateLayerService(m); }
/**
 * Factory function to generate a map service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @returns - A concrete instance of a MapService based on the underlying map architecture.
 */
export function MapServiceCreator(f) { return f.Create(); }
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
export function MarkerServiceFactory(f, m, l, c) {
    return f.CreateMarkerService(m, l, c);
}
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
export function PolygonServiceFactory(f, m, l) {
    return f.CreatePolygonService(m, l);
}
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
export function PolylineServiceFactory(f, m, l) {
    return f.CreatePolylineService(m, l);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL2NvbXBvbmVudHMvbWFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxTQUFTLEVBQ1QsWUFBWSxFQUtaLFNBQVMsRUFFVCxlQUFlLEVBQ2YsS0FBSyxFQUNMLE1BQU0sRUFFTixXQUFXLEVBQ1gsaUJBQWlCLEVBQ2pCLHVCQUF1QixFQUN2QixNQUFNLEVBQ1QsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFDbEUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ3JELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUMzRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDN0QsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ3pELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUM3RCxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDL0QsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBSTdELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUNsRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFbEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQkc7QUE2QkgsTUFBTSxPQUFPLFlBQVk7SUE2S3JCLEdBQUc7SUFDSCxlQUFlO0lBQ2YsR0FBRztJQUVIOzs7Ozs7T0FNRztJQUNILFlBQW9CLFdBQXVCLEVBQVUsS0FBYTtRQUE5QyxnQkFBVyxHQUFYLFdBQVcsQ0FBWTtRQUFVLFVBQUssR0FBTCxLQUFLLENBQVE7UUF0TGxFLEdBQUc7UUFDSCxzQkFBc0I7UUFDdEIsR0FBRztRQUNLLGVB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RSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxDQUFvQixFQUFFLENBQWEsRUFBRSxDQUFlO0lBQ3RGLE9BQU8sQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUFDLENBQW9CLEVBQUUsQ0FBYSxFQUFFLENBQWU7SUFDdkYsT0FBTyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIENvbXBvbmVudCxcbiAgICBFdmVudEVtaXR0ZXIsXG4gICAgT25DaGFuZ2VzLFxuICAgIE9uSW5pdCxcbiAgICBPbkRlc3Ryb3ksXG4gICAgU2ltcGxlQ2hhbmdlLFxuICAgIFZpZXdDaGlsZCxcbiAgICBBZnRlclZpZXdJbml0LFxuICAgIENvbnRlbnRDaGlsZHJlbixcbiAgICBJbnB1dCxcbiAgICBPdXRwdXQsXG4gICAgRWxlbWVudFJlZixcbiAgICBIb3N0QmluZGluZyxcbiAgICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgICBOZ1pvbmVcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBNYXBTZXJ2aWNlRmFjdG9yeSB9IGZyb20gJy4uL3NlcnZpY2VzL21hcHNlcnZpY2VmYWN0b3J5JztcbmltcG9ydCB7IE1hcFNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBNYXJrZXJTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvbWFya2VyLnNlcnZpY2UnO1xuaW1wb3J0IHsgSW5mb0JveFNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9pbmZvYm94LnNlcnZpY2UnO1xuaW1wb3J0IHsgTGF5ZXJTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvbGF5ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBQb2x5Z29uU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL3BvbHlnb24uc2VydmljZSc7XG5pbXBvcnQgeyBQb2x5bGluZVNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9wb2x5bGluZS5zZXJ2aWNlJztcbmltcG9ydCB7IENsdXN0ZXJTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvY2x1c3Rlci5zZXJ2aWNlJztcbmltcG9ydCB7IElMYXRMb25nIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgeyBJQm94IH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pYm94JztcbmltcG9ydCB7IElNYXBPcHRpb25zIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbWFwLW9wdGlvbnMnO1xuaW1wb3J0IHsgTWFwVHlwZUlkIH0gZnJvbSAnLi4vbW9kZWxzL21hcC10eXBlLWlkJztcbmltcG9ydCB7IE1hcE1hcmtlckRpcmVjdGl2ZSB9IGZyb20gJy4vbWFwLW1hcmtlcic7XG5cbi8qKlxuICogUmVuZGVycyBhIG1hcCBiYXNlZCBvbiBhIGdpdmVuIHByb3ZpZGVyLlxuICogKipJbXBvcnRhbnQgbm90ZSoqOiBUbyBiZSBhYmxlIHNlZSBhIG1hcCBpbiB0aGUgYnJvd3NlciwgeW91IGhhdmUgdG8gZGVmaW5lIGEgaGVpZ2h0IGZvciB0aGUgQ1NTXG4gKiBjbGFzcyBgbWFwLWNvbnRhaW5lcmAuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7Q29tcG9uZW50fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqIGltcG9ydCB7TWFwQ29tcG9uZW50fSBmcm9tICcuLi4nO1xuICpcbiAqIEBDb21wb25lbnQoe1xuICogIHNlbGVjdG9yOiAnbXktbWFwJyxcbiAqICBzdHlsZXM6IFtgXG4gKiAgICAubWFwLWNvbnRhaW5lciB7IGhlaWdodDogMzAwcHg7IH1cbiAqIGBdLFxuICogIHRlbXBsYXRlOiBgXG4gKiAgICA8eC1tYXAgW0xhdGl0dWRlXT1cImxhdFwiIFtMb25naXR1ZGVdPVwibG5nXCIgW1pvb21dPVwiem9vbVwiPjwveC1tYXA+XG4gKiAgYFxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBleHBvcnRcbiAqL1xuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICd4LW1hcCcsXG4gICAgcHJvdmlkZXJzOiBbXG4gICAgICAgIHsgcHJvdmlkZTogTWFwU2VydmljZSwgZGVwczogW01hcFNlcnZpY2VGYWN0b3J5XSwgdXNlRmFjdG9yeTogTWFwU2VydmljZUNyZWF0b3IgfSxcbiAgICAgICAgeyBwcm92aWRlOiBNYXJrZXJTZXJ2aWNlLCBkZXBzOiBbTWFwU2VydmljZUZhY3RvcnksIE1hcFNlcnZpY2UsIExheWVyU2VydmljZSwgQ2x1c3RlclNlcnZpY2VdLCB1c2VGYWN0b3J5OiBNYXJrZXJTZXJ2aWNlRmFjdG9yeSB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBwcm92aWRlOiBJbmZvQm94U2VydmljZSwgZGVwczogW01hcFNlcnZpY2VGYWN0b3J5LCBNYXBTZXJ2aWNlLFxuICAgICAgICAgICAgICAgIE1hcmtlclNlcnZpY2VdLCB1c2VGYWN0b3J5OiBJbmZvQm94U2VydmljZUZhY3RvcnlcbiAgICAgICAgfSxcbiAgICAgICAgeyBwcm92aWRlOiBMYXllclNlcnZpY2UsIGRlcHM6IFtNYXBTZXJ2aWNlRmFjdG9yeSwgTWFwU2VydmljZV0sIHVzZUZhY3Rvcnk6IExheWVyU2VydmljZUZhY3RvcnkgfSxcbiAgICAgICAgeyBwcm92aWRlOiBDbHVzdGVyU2VydmljZSwgZGVwczogW01hcFNlcnZpY2VGYWN0b3J5LCBNYXBTZXJ2aWNlXSwgdXNlRmFjdG9yeTogQ2x1c3RlclNlcnZpY2VGYWN0b3J5IH0sXG4gICAgICAgIHsgcHJvdmlkZTogUG9seWdvblNlcnZpY2UsIGRlcHM6IFtNYXBTZXJ2aWNlRmFjdG9yeSwgTWFwU2VydmljZSwgTGF5ZXJTZXJ2aWNlXSwgdXNlRmFjdG9yeTogUG9seWdvblNlcnZpY2VGYWN0b3J5IH0sXG4gICAgICAgIHsgcHJvdmlkZTogUG9seWxpbmVTZXJ2aWNlLCBkZXBzOiBbTWFwU2VydmljZUZhY3RvcnksIE1hcFNlcnZpY2UsIExheWVyU2VydmljZV0sIHVzZUZhY3Rvcnk6IFBvbHlsaW5lU2VydmljZUZhY3RvcnkgfVxuICAgIF0sXG4gICAgdGVtcGxhdGU6IGBcbiAgICAgICAgPGRpdiAjY29udGFpbmVyIGNsYXNzPSdtYXAtY29udGFpbmVyLWlubmVyJz48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz0nbWFwLWNvbnRlbnQnPlxuICAgICAgICAgICAgPG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PlxuICAgICAgICA8L2Rpdj5cbiAgICBgLFxuICAgIHN0eWxlczogW2BcbiAgICAgICAgLm1hcC1jb250YWluZXItaW5uZXIgeyB3aWR0aDogaW5oZXJpdDsgaGVpZ2h0OiBpbmhlcml0OyB9XG4gICAgICAgIC5tYXAtY29udGFpbmVyLWlubmVyIGRpdiB7IGJhY2tncm91bmQtcmVwZWF0OiBuby1yZXBlYXQ7IH1cbiAgICAgICAgLm1hcC1jb250ZW50IHsgZGlzcGxheTpub25lOyB9XG4gICAgYF0sXG4gICAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBNYXBDb21wb25lbnQgaW1wbGVtZW50cyBPbkNoYW5nZXMsIE9uSW5pdCwgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcblxuICAgIC8vL1xuICAgIC8vLyBGaWVsZCBkZWNsYXJhdGlvbnNcbiAgICAvLy9cbiAgICBwcml2YXRlIF9sb25naXR1ZGUgPSAwO1xuICAgIHByaXZhdGUgX2xhdGl0dWRlID0gMDtcbiAgICBwcml2YXRlIF96b29tID0gMDtcbiAgICBwcml2YXRlIF9jbGlja1RpbWVvdXQ6IG51bWJlciB8IE5vZGVKUy5UaW1lcjtcbiAgICBwcml2YXRlIF9vcHRpb25zOiBJTWFwT3B0aW9ucyA9IHt9O1xuICAgIHByaXZhdGUgX2JveDogSUJveCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfbWFwUHJvbWlzZTogUHJvbWlzZTx2b2lkPjtcbiAgICBASG9zdEJpbmRpbmcoJ2NsYXNzLm1hcC1jb250YWluZXInKSBwdWJsaWMgX2NvbnRhaW5lckNsYXNzOiBib29sZWFuID0gdHJ1ZTtcbiAgICBAVmlld0NoaWxkKCdjb250YWluZXInKSBwcml2YXRlIF9jb250YWluZXI6IEVsZW1lbnRSZWY7XG4gICAgQENvbnRlbnRDaGlsZHJlbihNYXBNYXJrZXJEaXJlY3RpdmUpIHByaXZhdGUgX21hcmtlcnM6IEFycmF5PE1hcE1hcmtlckRpcmVjdGl2ZT47XG5cbiAgICAvLy9cbiAgICAvLy8gUHJvcGVydHkgZGVjbGFyYXRpb25zXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBHZXQgb3Igc2V0cyB0aGUgbWF4aW11bSBhbmQgbWluaW11bSBib3VuZGluZyBib3ggZm9yIG1hcC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBDb21wb25lbnRcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgIHB1YmxpYyBnZXQgQm94KCk6IElCb3ggeyByZXR1cm4gdGhpcy5fYm94OyB9XG4gICAgcHVibGljIHNldCBCb3godmFsOiBJQm94KSB7IHRoaXMuX2JveCA9IHZhbDsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSBsYXRpdHVkZSB0aGF0IHNldHMgdGhlIGNlbnRlciBvZiB0aGUgbWFwLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcENvbXBvbmVudFxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBMYXRpdHVkZSgpOiBudW1iZXIgfCBzdHJpbmcgeyByZXR1cm4gdGhpcy5fbG9uZ2l0dWRlOyB9XG4gICAgcHVibGljIHNldCBMYXRpdHVkZSh2YWx1ZTogbnVtYmVyIHwgc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX2xhdGl0dWRlID0gdGhpcy5Db252ZXJ0VG9EZWNpbWFsKHZhbHVlKTtcbiAgICAgICAgdGhpcy5VcGRhdGVDZW50ZXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIGxvbmdpdHVkZSB0aGF0IHNldHMgdGhlIGNlbnRlciBvZiB0aGUgbWFwLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcENvbXBvbmVudFxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBMb25naXR1ZGUoKTogbnVtYmVyIHwgc3RyaW5nIHsgcmV0dXJuIHRoaXMuX2xvbmdpdHVkZTsgfVxuICAgIHB1YmxpYyBzZXQgTG9uZ2l0dWRlKHZhbHVlOiBudW1iZXIgfCBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fbG9uZ2l0dWRlID0gdGhpcy5Db252ZXJ0VG9EZWNpbWFsKHZhbHVlKTtcbiAgICAgICAgdGhpcy5VcGRhdGVDZW50ZXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgZ2VuZXJhbCBtYXAgT3B0aW9uc1xuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcENvbXBvbmVudFxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBPcHRpb25zKCk6IElNYXBPcHRpb25zIHsgcmV0dXJuIHRoaXMuX29wdGlvbnM7IH1cbiAgICBwdWJsaWMgc2V0IE9wdGlvbnModmFsOiBJTWFwT3B0aW9ucykgeyB0aGlzLl9vcHRpb25zID0gdmFsOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIHpvb20gbGV2ZWwgb2YgdGhlIG1hcC4gVGhlIGRlZmF1bHQgdmFsdWUgaXMgYDhgLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcENvbXBvbmVudFxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgcHVibGljIGdldCBab29tKCk6IG51bWJlciB8IHN0cmluZyB7IHJldHVybiB0aGlzLl96b29tOyB9XG4gICAgcHVibGljIHNldCBab29tKHZhbHVlOiBudW1iZXIgfCBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fem9vbSA9IHRoaXMuQ29udmVydFRvRGVjaW1hbCh2YWx1ZSwgOCk7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fem9vbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHRoaXMuX21hcFNlcnZpY2UuU2V0Wm9vbSh0aGlzLl96b29tKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgZW1pdHRlciBpcyBmaXJlZCB3aGVuIHRoZSBtYXAgYm91bmRpbmcgYm94IGNoYW5nZXMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwQ29tcG9uZW50XG4gICAgICovXG4gICAgQE91dHB1dCgpXG4gICAgQm91bmRzQ2hhbmdlOiBFdmVudEVtaXR0ZXI8SUJveD4gPSBuZXcgRXZlbnRFbWl0dGVyPElCb3g+KCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGV2ZW50IGVtaXR0ZXIgaXMgZmlyZWQgd2hlbiB0aGUgbWFwIGNlbnRlciBjaGFuZ2VzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcENvbXBvbmVudFxuICAgICAqL1xuICAgIEBPdXRwdXQoKVxuICAgIENlbnRlckNoYW5nZTogRXZlbnRFbWl0dGVyPElMYXRMb25nPiA9IG5ldyBFdmVudEVtaXR0ZXI8SUxhdExvbmc+KCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGV2ZW50IGVtaXR0ZXIgZ2V0cyBlbWl0dGVkIHdoZW4gdGhlIHVzZXIgY2xpY2tzIG9uIHRoZSBtYXAgKGJ1dCBub3Qgd2hlbiB0aGV5IGNsaWNrIG9uIGFcbiAgICAgKiBtYXJrZXIgb3IgaW5mb1dpbmRvdykuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwQ29tcG9uZW50XG4gICAgICovXG4gICAgQE91dHB1dCgpXG4gICAgTWFwQ2xpY2s6IEV2ZW50RW1pdHRlcjxNb3VzZUV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8TW91c2VFdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgZW1pdHRlciBnZXRzIGVtaXR0ZWQgd2hlbiB0aGUgdXNlciBkb3VibGUtY2xpY2tzIG9uIHRoZSBtYXAgKGJ1dCBub3Qgd2hlbiB0aGV5IGNsaWNrXG4gICAgICogb24gYSBtYXJrZXIgb3IgaW5mb1dpbmRvdykuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwQ29tcG9uZW50XG4gICAgICovXG4gICAgQE91dHB1dCgpXG4gICAgTWFwRGJsQ2xpY2s6IEV2ZW50RW1pdHRlcjxNb3VzZUV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8TW91c2VFdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgZW1pdHRlciBnZXRzIGVtaXR0ZWQgd2hlbiB0aGUgdXNlciByaWdodC1jbGlja3Mgb24gdGhlIG1hcCAoYnV0IG5vdCB3aGVuIHRoZXkgY2xpY2tcbiAgICAgKiBvbiBhIG1hcmtlciBvciBpbmZvV2luZG93KS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBDb21wb25lbnRcbiAgICAgKi9cbiAgICBAT3V0cHV0KClcbiAgICBNYXBSaWdodENsaWNrOiBFdmVudEVtaXR0ZXI8TW91c2VFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPE1vdXNlRXZlbnQ+KCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGV2ZW50IGVtaXR0ZXIgZ2V0cyBlbWl0dGVkIHdoZW4gdGhlIHVzZXIgZG91YmxlLWNsaWNrcyBvbiB0aGUgbWFwIChidXQgbm90IHdoZW4gdGhleSBjbGlja1xuICAgICAqIG9uIGEgbWFya2VyIG9yIGluZm9XaW5kb3cpLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcENvbXBvbmVudFxuICAgICAqL1xuICAgIEBPdXRwdXQoKVxuICAgIE1hcE1vdXNlT3ZlcjogRXZlbnRFbWl0dGVyPE1vdXNlRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxNb3VzZUV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBlbWl0dGVyIGdldHMgZW1pdHRlZCB3aGVuIHRoZSB1c2VyIGRvdWJsZS1jbGlja3Mgb24gdGhlIG1hcCAoYnV0IG5vdCB3aGVuIHRoZXkgY2xpY2tcbiAgICAgKiBvbiBhIG1hcmtlciBvciBpbmZvV2luZG93KS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBDb21wb25lbnRcbiAgICAgKi9cbiAgICBAT3V0cHV0KClcbiAgICBNYXBNb3VzZU91dDogRXZlbnRFbWl0dGVyPE1vdXNlRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxNb3VzZUV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBlbWl0dGVyIGdldHMgZW1pdHRlZCB3aGVuIHRoZSB1c2VyIGRvdWJsZS1jbGlja3Mgb24gdGhlIG1hcCAoYnV0IG5vdCB3aGVuIHRoZXkgY2xpY2tcbiAgICAgKiBvbiBhIG1hcmtlciBvciBpbmZvV2luZG93KS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBDb21wb25lbnRcbiAgICAgKi9cbiAgICBAT3V0cHV0KClcbiAgICBNYXBNb3VzZU1vdmU6IEV2ZW50RW1pdHRlcjxNb3VzZUV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8TW91c2VFdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBldmVudCBlbWl0dGVyIGlzIGZpcmVkIHdoZW4gdGhlIG1hcCBzZXJ2aWNlIGlzIGF2YWlsYWJsZSBhbmQgdGhlIG1hcHMgaGFzIGJlZW5cbiAgICAgKiBJbml0aWFsaXplZCAoYnV0IG5vdCBuZWNlc3NhcmlseSBjcmVhdGVkKS4gSXQgY29udGFpbnMgYSBQcm9taXNlIHRoYXQgd2hlbiBmdWxsZmlsbGVkIHJldHVybnNcbiAgICAgKiB0aGUgbWFpbiBtYXAgb2JqZWN0IG9mIHRoZSB1bmRlcmx5aW5nIHBsYXRmb3JtLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcENvbXBvbmVudFxuICAgICAqL1xuICAgIEBPdXRwdXQoKVxuICAgIE1hcFByb21pc2U6IEV2ZW50RW1pdHRlcjxQcm9taXNlPGFueT4+ID0gbmV3IEV2ZW50RW1pdHRlcjxQcm9taXNlPGFueT4+KCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGV2ZW50IGVtaWl0ZXIgaXMgZmlyZWQgd2hlbiB0aGUgbWFwIHpvb20gY2hhbmdlc1xuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcENvbXBvbmVudFxuICAgICAqL1xuICAgIEBPdXRwdXQoKVxuICAgIFpvb21DaGFuZ2U6IEV2ZW50RW1pdHRlcjxOdW1iZXI+ID0gbmV3IEV2ZW50RW1pdHRlcjxOdW1iZXI+KCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGV2ZW50IGVtaXR0ZXIgaXMgZmlyZWQgd2hlbiB0aGUgbWFwIHNlcnZpY2UgaXMgYXZhaWxhYmxlIGFuZCB0aGUgbWFwcyBoYXMgYmVlblxuICAgICAqIEluaXRpYWxpemVkXG4gICAgICogQG1lbWJlck9mIE1hcENvbXBvbmVudFxuICAgICAqL1xuICAgIEBPdXRwdXQoKVxuICAgIE1hcFNlcnZpY2U6IEV2ZW50RW1pdHRlcjxNYXBTZXJ2aWNlPiA9IG5ldyBFdmVudEVtaXR0ZXI8TWFwU2VydmljZT4oKTtcblxuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIE1hcENvbXBvbmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfbWFwU2VydmljZSAtIENvbmNyZXRlZCBpbXBsZW1lbnRhdGlvbiBvZiBhIG1hcCBzZXJ2aWNlIGZvciB0aGUgdW5kZXJseWluZyBtYXBzIGltcGxlbWVudGF0aW9ucy5cbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgR2VuZXJhbGx5IHByb3ZpZGVkIHZpYSBpbmplY3Rpb25zLlxuICAgICAqIEBtZW1iZXJvZiBNYXBDb21wb25lbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9tYXBTZXJ2aWNlOiBNYXBTZXJ2aWNlLCBwcml2YXRlIF96b25lOiBOZ1pvbmUpIHsgfVxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgb24gQ29tcG9uZW50IGluaXRpYWxpemF0aW9uLiBQYXJ0IG9mIG5nIENvbXBvbmVudCBsaWZlIGN5Y2xlLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcENvbXBvbmVudFxuICAgICAqL1xuICAgIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5NYXBQcm9taXNlLmVtaXQodGhpcy5fbWFwU2VydmljZS5NYXBQcm9taXNlKTtcbiAgICAgICAgdGhpcy5NYXBTZXJ2aWNlLmVtaXQodGhpcy5fbWFwU2VydmljZSk7XG4gICAgfVxuICAgIFxuICAgIHB1YmxpYyBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgICAgIHRoaXMuSW5pdE1hcEluc3RhbmNlKHRoaXMuX2NvbnRhaW5lci5uYXRpdmVFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiBjaGFuZ2VzIHRvIHRoZSBkYXRhYm91ZCBwcm9wZXJ0aWVzIG9jY3VyLiBQYXJ0IG9mIHRoZSBuZyBDb21wb25lbnQgbGlmZSBjeWNsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGFuZ2VzIC0gQ2hhbmdlcyB0aGF0IGhhdmUgb2NjdXJlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBDb21wb25lbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogeyBbcHJvcE5hbWU6IHN0cmluZ106IFNpbXBsZUNoYW5nZSB9KTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9tYXBQcm9taXNlKSB7XG4gICAgICAgICAgICBpZiAoY2hhbmdlc1snQm94J10pIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYm94ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFwU2VydmljZS5TZXRWaWV3T3B0aW9ucyg8SU1hcE9wdGlvbnM+e1xuICAgICAgICAgICAgICAgICAgICAgICAgYm91bmRzOiB0aGlzLl9ib3hcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNoYW5nZXNbJ09wdGlvbnMnXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX21hcFNlcnZpY2UuU2V0TWFwT3B0aW9ucyh0aGlzLl9vcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBvbiBjb21wb25lbnQgZGVzdHJ1Y3Rpb24uIEZyZWVzIHRoZSByZXNvdXJjZXMgdXNlZCBieSB0aGUgY29tcG9uZW50LiBQYXJ0IG9mIHRoZSBuZyBDb21wb25lbnQgbGlmZSBjeWNsZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBDb21wb25lbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX21hcFNlcnZpY2UuRGlzcG9zZU1hcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXJzIGEgcmVzaXplIGV2ZW50IG9uIHRoZSBtYXAgaW5zdGFuY2UuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IGdldHMgcmVzb2x2ZWQgYWZ0ZXIgdGhlIGV2ZW50IHdhcyB0cmlnZ2VyZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwQ29tcG9uZW50XG4gICAgICovXG4gICAgcHVibGljIFRyaWdnZXJSZXNpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIC8vIE5vdGU6IFdoZW4gd2Ugd291bGQgdHJpZ2dlciB0aGUgcmVzaXplIGV2ZW50IGFuZCBzaG93IHRoZSBtYXAgaW4gdGhlIHNhbWUgdHVybiAod2hpY2ggaXMgYVxuICAgICAgICAvLyBjb21tb24gY2FzZSBmb3IgdHJpZ2dlcmluZyBhIHJlc2l6ZSBldmVudCksIHRoZW4gdGhlIHJlc2l6ZSBldmVudCB3b3VsZCBub3RcbiAgICAgICAgLy8gd29yayAodG8gc2hvdyB0aGUgbWFwKSwgc28gd2UgdHJpZ2dlciB0aGUgZXZlbnQgaW4gYSB0aW1lb3V0LlxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoXG4gICAgICAgICAgICAgICAgKCkgPT4geyByZXR1cm4gdGhpcy5fbWFwU2VydmljZS5UcmlnZ2VyTWFwRXZlbnQoJ3Jlc2l6ZScpLnRoZW4oKCkgPT4gcmVzb2x2ZSgpKTsgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQcml2YXRlIG1ldGhvZHMuXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBhIG51bWJlci1pc2ggdmFsdWUgdG8gYSBudW1iZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgdmFsdWUgdG8gY29udmVydC5cbiAgICAgKiBAcGFyYW0gW2RlZmF1bHRWYWx1ZT1udWxsXSAtIERlZmF1bHQgdmFsdWUgdG8gdXNlIGlmIHRoZSBjb252ZXJzaW9uIGNhbm5vdCBiZSBwZXJmb3JtZWQuXG4gICAgICogQHJldHVybnMgLSBDb252ZXJ0ZWQgbnVtYmVyIG9mIHRoZSBkZWZhdWx0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcENvbXBvbmVudFxuICAgICAqL1xuICAgIHByaXZhdGUgQ29udmVydFRvRGVjaW1hbCh2YWx1ZTogc3RyaW5nIHwgbnVtYmVyLCBkZWZhdWx0VmFsdWU6IG51bWJlciA9IG51bGwpOiBudW1iZXIge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJldHVybiA8bnVtYmVyPnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVsZWdhdGUgaGFuZGxpbmcgdGhlIG1hcCBjbGljayBldmVudHMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwQ29tcG9uZW50XG4gICAgICovXG4gICAgcHJpdmF0ZSBIYW5kbGVNYXBDbGlja0V2ZW50cygpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbWFwU2VydmljZS5TdWJzY3JpYmVUb01hcEV2ZW50PGFueT4oJ2NsaWNrJykuc3Vic2NyaWJlKGUgPT4ge1xuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIHRoaXMgaXMgbmVjZXNzYXJ5IHNpbmNlIGJpbmcgd2lsbCB0cmVhdCBhIGRvdWJsZWNsaWNrIGZpcnN0IGFzIHR3byBjbGlja3MuLi4nXG4gICAgICAgICAgICAvLy9cbiAgICAgICAgICAgIHRoaXMuX2NsaWNrVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuTWFwQ2xpY2suZW1pdCg8TW91c2VFdmVudD5lKTtcbiAgICAgICAgICAgIH0sIDMwMCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9tYXBTZXJ2aWNlLlN1YnNjcmliZVRvTWFwRXZlbnQ8YW55PignZGJsY2xpY2snKS5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fY2xpY2tUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KDxOb2RlSlMuVGltZXI+dGhpcy5fY2xpY2tUaW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuTWFwRGJsQ2xpY2suZW1pdCg8TW91c2VFdmVudD5lKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX21hcFNlcnZpY2UuU3Vic2NyaWJlVG9NYXBFdmVudDxhbnk+KCdyaWdodGNsaWNrJykuc3Vic2NyaWJlKGUgPT4ge1xuICAgICAgICAgICAgdGhpcy5NYXBSaWdodENsaWNrLmVtaXQoPE1vdXNlRXZlbnQ+ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9tYXBTZXJ2aWNlLlN1YnNjcmliZVRvTWFwRXZlbnQ8YW55PignbW91c2VvdmVyJykuc3Vic2NyaWJlKGUgPT4ge1xuICAgICAgICAgICAgdGhpcy5NYXBNb3VzZU92ZXIuZW1pdCg8TW91c2VFdmVudD5lKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX21hcFNlcnZpY2UuU3Vic2NyaWJlVG9NYXBFdmVudDxhbnk+KCdtb3VzZW91dCcpLnN1YnNjcmliZShlID0+IHtcbiAgICAgICAgICAgIHRoaXMuTWFwTW91c2VPdXQuZW1pdCg8TW91c2VFdmVudD5lKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX21hcFNlcnZpY2UuU3Vic2NyaWJlVG9NYXBFdmVudDxhbnk+KCdtb3VzZW1vdmUnKS5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICAgICAgICB0aGlzLk1hcE1vdXNlTW92ZS5lbWl0KDxNb3VzZUV2ZW50PmUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWxlZ2F0ZSBoYW5kbGluZyBtYXAgY2VudGVyIGNoYW5nZSBldmVudHMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwQ29tcG9uZW50XG4gICAgICovXG4gICAgcHJpdmF0ZSBIYW5kbGVNYXBCb3VuZHNDaGFuZ2UoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX21hcFNlcnZpY2UuU3Vic2NyaWJlVG9NYXBFdmVudDx2b2lkPignYm91bmRzY2hhbmdlZCcpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9tYXBTZXJ2aWNlLkdldEJvdW5kcygpLnRoZW4oKGJvdW5kczogSUJveCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuQm91bmRzQ2hhbmdlLmVtaXQoYm91bmRzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWxlZ2F0ZSBoYW5kbGluZyBtYXAgY2VudGVyIGNoYW5nZSBldmVudHMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwQ29tcG9uZW50XG4gICAgICovXG4gICAgcHJpdmF0ZSBIYW5kbGVNYXBDZW50ZXJDaGFuZ2UoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX21hcFNlcnZpY2UuU3Vic2NyaWJlVG9NYXBFdmVudDx2b2lkPignY2VudGVyY2hhbmdlZCcpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9tYXBTZXJ2aWNlLkdldENlbnRlcigpLnRoZW4oKGNlbnRlcjogSUxhdExvbmcpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGF0aXR1ZGUgIT09IGNlbnRlci5sYXRpdHVkZSB8fCB0aGlzLl9sb25naXR1ZGUgIT09IGNlbnRlci5sb25naXR1ZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGF0aXR1ZGUgPSBjZW50ZXIubGF0aXR1ZGU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xvbmdpdHVkZSA9IGNlbnRlci5sb25naXR1ZGU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuQ2VudGVyQ2hhbmdlLmVtaXQoPElMYXRMb25nPnsgbGF0aXR1ZGU6IHRoaXMuX2xhdGl0dWRlLCBsb25naXR1ZGU6IHRoaXMuX2xvbmdpdHVkZSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVsZWdhdGUgaGFuZGxpbmcgbWFwIHpvb20gY2hhbmdlIGV2ZW50cy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBDb21wb25lbnRcbiAgICAgKi9cbiAgICBwcml2YXRlIEhhbmRsZU1hcFpvb21DaGFuZ2UoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX21hcFNlcnZpY2UuU3Vic2NyaWJlVG9NYXBFdmVudDx2b2lkPignem9vbWNoYW5nZWQnKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fbWFwU2VydmljZS5HZXRab29tKCkudGhlbigoejogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3pvb20gIT09IHopIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fem9vbSA9IHo7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuWm9vbUNoYW5nZS5lbWl0KHopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgbWFwLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsIC0gSHRtbCBlbGVtZW50cyB3aGljaCB3aWxsIGhvc3QgdGhlIG1hcCBjYW52YXMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwQ29tcG9uZW50XG4gICAgICovXG4gICAgcHJpdmF0ZSBJbml0TWFwSW5zdGFuY2UoZWw6IEhUTUxFbGVtZW50KSB7XG4gICAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMuY2VudGVyID09IG51bGwpIHsgdGhpcy5fb3B0aW9ucy5jZW50ZXIgPSB7IGxhdGl0dWRlOiB0aGlzLl9sYXRpdHVkZSwgbG9uZ2l0dWRlOiB0aGlzLl9sb25naXR1ZGUgfTsgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMuem9vbSA9PSBudWxsKSB7IHRoaXMuX29wdGlvbnMuem9vbSA9IHRoaXMuX3pvb207IH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9vcHRpb25zLm1hcFR5cGVJZCA9PSBudWxsKSB7IHRoaXMuX29wdGlvbnMubWFwVHlwZUlkID0gTWFwVHlwZUlkLmh5YnJpZDsgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX2JveCAhPSBudWxsKSB7IHRoaXMuX29wdGlvbnMuYm91bmRzID0gdGhpcy5fYm94OyB9XG4gICAgICAgICAgICB0aGlzLl9tYXBQcm9taXNlID0gdGhpcy5fbWFwU2VydmljZS5DcmVhdGVNYXAoZWwsIHRoaXMuX29wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5IYW5kbGVNYXBDZW50ZXJDaGFuZ2UoKTtcbiAgICAgICAgICAgIHRoaXMuSGFuZGxlTWFwQm91bmRzQ2hhbmdlKCk7XG4gICAgICAgICAgICB0aGlzLkhhbmRsZU1hcFpvb21DaGFuZ2UoKTtcbiAgICAgICAgICAgIHRoaXMuSGFuZGxlTWFwQ2xpY2tFdmVudHMoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgbWFwIGNlbnRlciBiYXNlZCBvbiB0aGUgZ2VvIHByb3BlcnRpZXMgb2YgdGhlIGNvbXBvbmVudC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBDb21wb25lbnRcbiAgICAgKi9cbiAgICBwcml2YXRlIFVwZGF0ZUNlbnRlcigpOiB2b2lkIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLl9sYXRpdHVkZSAhPT0gJ251bWJlcicgfHwgdHlwZW9mIHRoaXMuX2xvbmdpdHVkZSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tYXBTZXJ2aWNlLlNldENlbnRlcih7XG4gICAgICAgICAgICBsYXRpdHVkZTogdGhpcy5fbGF0aXR1ZGUsXG4gICAgICAgICAgICBsb25naXR1ZGU6IHRoaXMuX2xvbmdpdHVkZSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4vKipcbiAqIEZhY3RvcnkgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgYSBjbHVzdGVyIHNlcnZpY2UgaW5zdGFuY2UuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugb2YgY29uc3RyYWludHMgd2l0aCBBT1QgdGhhdCBkbyBubyBhbGxvd1xuICogdXMgdG8gdXNlIGxhbWRhIGZ1bmN0aW9ucyBpbmxpbmUuXG4gKlxuICogQGV4cG9ydFxuICogQHBhcmFtIGYgLSBUaGUge0BsaW5rIE1hcFNlcnZpY2VGYWN0b3J5fSBpbXBsZW1lbnRhdGlvbi5cbiAqIEBwYXJhbSBtIC0gQSB7QGxpbmsgTWFwU2VydmljZX0gaW5zdGFuY2UuXG4gKiBAcmV0dXJucyAtIEEgY29uY3JldGUgaW5zdGFuY2Ugb2YgYSBDbHVzdGVyIFNlcnZpY2UgYmFzZWQgb24gdGhlIHVuZGVybHlpbmcgbWFwIGFyY2hpdGVjdHVyZVxuICovXG5leHBvcnQgZnVuY3Rpb24gQ2x1c3RlclNlcnZpY2VGYWN0b3J5KGY6IE1hcFNlcnZpY2VGYWN0b3J5LCBtOiBNYXBTZXJ2aWNlKTogQ2x1c3RlclNlcnZpY2UgeyByZXR1cm4gZi5DcmVhdGVDbHVzdGVyU2VydmljZShtKTsgfVxuXG4vKipcbiAqIEZhY3RvcnkgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgYSBpbmZvYm94IHNlcnZpY2UgaW5zdGFuY2UuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugb2YgY29uc3RyYWludHMgd2l0aCBBT1QgdGhhdCBkbyBubyBhbGxvd1xuICogdXMgdG8gdXNlIGxhbWRhIGZ1bmN0aW9ucyBpbmxpbmUuXG4gKlxuICogQGV4cG9ydFxuICogQHBhcmFtIGYgLSBUaGUge0BsaW5rIE1hcFNlcnZpY2VGYWN0b3J5fSBpbXBsZW1lbnRhdGlvbi5cbiAqIEBwYXJhbSBtIC0gQSB7QGxpbmsgTWFwU2VydmljZX0gaW5zdGFuY2UuXG4gKiBAcGFyYW0gbSAtIEEge0BsaW5rIE1hcmtlclNlcnZpY2V9IGluc3RhbmNlLlxuICogQHJldHVybnMgLSBBIGNvbmNyZXRlIGluc3RhbmNlIG9mIGEgSW5mb0JveCBTZXJ2aWNlIGJhc2VkIG9uIHRoZSB1bmRlcmx5aW5nIG1hcCBhcmNoaXRlY3R1cmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBJbmZvQm94U2VydmljZUZhY3RvcnkoZjogTWFwU2VydmljZUZhY3RvcnksIG06IE1hcFNlcnZpY2UsXG4gICAgbWE6IE1hcmtlclNlcnZpY2UpOiBJbmZvQm94U2VydmljZSB7IHJldHVybiBmLkNyZWF0ZUluZm9Cb3hTZXJ2aWNlKG0sIG1hKTsgfVxuXG4vKipcbiAqIEZhY3RvcnkgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgYSBsYXllciBzZXJ2aWNlIGluc3RhbmNlLiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIG9mIGNvbnN0cmFpbnRzIHdpdGggQU9UIHRoYXQgZG8gbm8gYWxsb3dcbiAqIHVzIHRvIHVzZSBsYW1kYSBmdW5jdGlvbnMgaW5saW5lLlxuICpcbiAqIEBleHBvcnRcbiAqIEBwYXJhbSBmIC0gVGhlIHtAbGluayBNYXBTZXJ2aWNlRmFjdG9yeX0gaW1wbGVtZW50YXRpb24uXG4gKiBAcGFyYW0gbSAtIEEge0BsaW5rIE1hcFNlcnZpY2V9IGluc3RhbmNlLlxuICogQHJldHVybnMgLSBBIGNvbmNyZXRlIGluc3RhbmNlIG9mIGEgTGF5ZXIgU2VydmljZSBiYXNlZCBvbiB0aGUgdW5kZXJseWluZyBtYXAgYXJjaGl0ZWN0dXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gTGF5ZXJTZXJ2aWNlRmFjdG9yeShmOiBNYXBTZXJ2aWNlRmFjdG9yeSwgbTogTWFwU2VydmljZSk6IExheWVyU2VydmljZSB7IHJldHVybiBmLkNyZWF0ZUxheWVyU2VydmljZShtKTsgfVxuXG4vKipcbiAqIEZhY3RvcnkgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgYSBtYXAgc2VydmljZSBpbnN0YW5jZS4gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBvZiBjb25zdHJhaW50cyB3aXRoIEFPVCB0aGF0IGRvIG5vIGFsbG93XG4gKiB1cyB0byB1c2UgbGFtZGEgZnVuY3Rpb25zIGlubGluZS5cbiAqXG4gKiBAZXhwb3J0XG4gKiBAcGFyYW0gZiAtIFRoZSB7QGxpbmsgTWFwU2VydmljZUZhY3Rvcnl9IGltcGxlbWVudGF0aW9uLlxuICogQHJldHVybnMgLSBBIGNvbmNyZXRlIGluc3RhbmNlIG9mIGEgTWFwU2VydmljZSBiYXNlZCBvbiB0aGUgdW5kZXJseWluZyBtYXAgYXJjaGl0ZWN0dXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gTWFwU2VydmljZUNyZWF0b3IoZjogTWFwU2VydmljZUZhY3RvcnkpOiBNYXBTZXJ2aWNlIHsgcmV0dXJuIGYuQ3JlYXRlKCk7IH1cblxuLyoqXG4gKiBGYWN0b3J5IGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGEgbWFya2VyIHNlcnZpY2UgaW5zdGFuY2UuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugb2YgY29uc3RyYWludHMgd2l0aCBBT1QgdGhhdCBkbyBubyBhbGxvd1xuICogdXMgdG8gdXNlIGxhbWRhIGZ1bmN0aW9ucyBpbmxpbmUuXG4gKlxuICogQGV4cG9ydFxuICogQHBhcmFtIGYgLSBUaGUge0BsaW5rIE1hcFNlcnZpY2VGYWN0b3J5fSBpbXBsZW1lbnRhdGlvbi5cbiAqIEBwYXJhbSBtIC0gQSB7QGxpbmsgTWFwU2VydmljZX0gaW5zdGFuY2UuXG4gKiBAcGFyYW0gbCAtIEEge0BsaW5rIExheWVyU2VydmljZX0gaW5zdGFuY2UuXG4gKiBAcGFyYW0gYyAtIEEge0BsaW5rIENsdXN0ZXJTZXJ2aWNlfSBpbnN0YW5jZS5cbiAqIEByZXR1cm5zIC0gQSBjb25jcmV0ZSBpbnN0YW5jZSBvZiBhIE1hcmtlciBTZXJ2aWNlIGJhc2VkIG9uIHRoZSB1bmRlcmx5aW5nIG1hcCBhcmNoaXRlY3R1cmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBNYXJrZXJTZXJ2aWNlRmFjdG9yeShmOiBNYXBTZXJ2aWNlRmFjdG9yeSwgbTogTWFwU2VydmljZSwgbDogTGF5ZXJTZXJ2aWNlLCBjOiBDbHVzdGVyU2VydmljZSk6IE1hcmtlclNlcnZpY2Uge1xuICAgIHJldHVybiBmLkNyZWF0ZU1hcmtlclNlcnZpY2UobSwgbCwgYyk7XG59XG5cbi8qKlxuICogRmFjdG9yeSBmdW5jdGlvbiB0byBnZW5lcmF0ZSBhIHBvbHlnb24gc2VydmljZSBpbnN0YW5jZS4gVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBvZiBjb25zdHJhaW50cyB3aXRoIEFPVCB0aGF0IGRvIG5vIGFsbG93XG4gKiB1cyB0byB1c2UgbGFtZGEgZnVuY3Rpb25zIGlubGluZS5cbiAqXG4gKiBAZXhwb3J0XG4gKiBAcGFyYW0gZiAtIFRoZSB7QGxpbmsgTWFwU2VydmljZUZhY3Rvcnl9IGltcGxlbWVudGF0aW9uLlxuICogQHBhcmFtIG0gLSBBIHtAbGluayBNYXBTZXJ2aWNlfSBpbnN0YW5jZS5cbiAqIEBwYXJhbSBsIC0gQSB7QGxpbmsgTGF5ZXJTZXJ2aWNlfSBpbnN0YW5jZS5cbiAqIEByZXR1cm5zIC0gQSBjb25jcmV0ZSBpbnN0YW5jZSBvZiBhIFBvbHlnb24gU2VydmljZSBiYXNlZCBvbiB0aGUgdW5kZXJseWluZyBtYXAgYXJjaGl0ZWN0dXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gUG9seWdvblNlcnZpY2VGYWN0b3J5KGY6IE1hcFNlcnZpY2VGYWN0b3J5LCBtOiBNYXBTZXJ2aWNlLCBsOiBMYXllclNlcnZpY2UpOiBQb2x5Z29uU2VydmljZSB7XG4gICAgcmV0dXJuIGYuQ3JlYXRlUG9seWdvblNlcnZpY2UobSwgbCk7XG59XG5cbi8qKlxuICogRmFjdG9yeSBmdW5jdGlvbiB0byBnZW5lcmF0ZSBhIHBvbHlsaW5lIHNlcnZpY2UgaW5zdGFuY2UuIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugb2YgY29uc3RyYWludHMgd2l0aCBBT1QgdGhhdCBkbyBubyBhbGxvd1xuICogdXMgdG8gdXNlIGxhbWRhIGZ1bmN0aW9ucyBpbmxpbmUuXG4gKlxuICogQGV4cG9ydFxuICogQHBhcmFtIGYgLSBUaGUge0BsaW5rIE1hcFNlcnZpY2VGYWN0b3J5fSBpbXBsZW1lbnRhdGlvbi5cbiAqIEBwYXJhbSBtIC0gQSB7QGxpbmsgTWFwU2VydmljZX0gaW5zdGFuY2UuXG4gKiBAcGFyYW0gbCAtIEEge0BsaW5rIExheWVyU2VydmljZX0gaW5zdGFuY2UuXG4gKiBAcmV0dXJucyAtIEEgY29uY3JldGUgaW5zdGFuY2Ugb2YgYSBQb2x5bGluZSBTZXJ2aWNlIGJhc2VkIG9uIHRoZSB1bmRlcmx5aW5nIG1hcCBhcmNoaXRlY3R1cmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBQb2x5bGluZVNlcnZpY2VGYWN0b3J5KGY6IE1hcFNlcnZpY2VGYWN0b3J5LCBtOiBNYXBTZXJ2aWNlLCBsOiBMYXllclNlcnZpY2UpOiBQb2x5bGluZVNlcnZpY2Uge1xuICAgIHJldHVybiBmLkNyZWF0ZVBvbHlsaW5lU2VydmljZShtLCBsKTtcbn1cbiJdfQ==