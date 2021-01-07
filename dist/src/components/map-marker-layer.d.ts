import { SimpleChange, OnDestroy, OnChanges, EventEmitter, AfterContentInit, NgZone } from '@angular/core';
import { IPoint } from '../interfaces/ipoint';
import { ILatLong } from '../interfaces/ilatlong';
import { IMarkerEvent } from '../interfaces/imarker-event';
import { IMarkerOptions } from '../interfaces/imarker-options';
import { IMarkerIconInfo } from '../interfaces/imarker-icon-info';
import { IClusterIconInfo } from '../interfaces/icluster-icon-info';
import { MarkerService } from '../services/marker.service';
import { LayerService } from '../services/layer.service';
import { ClusterService } from '../services/cluster.service';
import { MapService } from '../services/map.service';
import { Marker } from '../models/marker';
import { ClusterClickAction } from '../models/cluster-click-action';
import { ClusterPlacementMode } from '../models/cluster-placement-mode';
/**
 * MapMarkerLayerDirective performantly renders a large set of map marker inside a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapMarkerDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *   .map-container {
 *     height: 300px;
 *   }
 * `],
 * template: `
 *   <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-marker-layer [MarkerOptions]="_markers"></x-map-marker-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
export declare class MapMarkerLayerDirective implements OnDestroy, OnChanges, AfterContentInit {
    private _markerService;
    private _layerService;
    private _clusterService;
    private _mapService;
    private _zone;
    private _id;
    private _layerPromise;
    private _service;
    private _styles;
    private _useDynamicSizeMarker;
    private _dynamicMarkerBaseSize;
    private _dynamicMarkerRanges;
    private _iconCreationCallback;
    private _streaming;
    private _markers;
    private _markersLast;
    /**
     * Gets or sets the the Cluster Click Action {@link ClusterClickAction}.
     *
     * @memberof MapMarkerLayerDirective
     */
    ClusterClickAction: ClusterClickAction;
    /**
     * Gets or sets the IconInfo to be used to create a custom cluster marker. Supports font-based, SVG, graphics and more.
     * See {@link IMarkerIconInfo}.
     *
     * @memberof MapMarkerLayerDirective
     */
    ClusterIconInfo: IMarkerIconInfo;
    /**
     * Gets or sets the cluster placement mode. {@link ClusterPlacementMode}
     *
     * @memberof MapMarkerLayerDirective
     */
    ClusterPlacementMode: ClusterPlacementMode;
    /**
     * Gets or sets the callback invoked to create a custom cluster marker. Note that when {@link UseDynamicSizeMarkers} is enabled,
     * you cannot set a custom marker callback.
     *
     * @memberof MapMarkerLayerDirective
     */
    get CustomMarkerCallback(): (m: Array<Marker>, i: IMarkerIconInfo) => string;
    set CustomMarkerCallback(val: (m: Array<Marker>, i: IMarkerIconInfo) => string);
    /**
     * Gets or sets the base size of dynamic markers in pixels. The actualy size of the dynamic marker is based on this.
     * See {@link UseDynamicSizeMarkers}.
     *
     * @memberof ClusterLayerDirective
     */
    get DynamicMarkerBaseSize(): number;
    set DynamicMarkerBaseSize(val: number);
    /**
     * Gets or sets the ranges to use to calculate breakpoints and colors for dynamic markers.
     * The map contains key/value pairs, with the keys being
     * the breakpoint sizes and the values the colors to be used for the dynamic marker in that range. See {@link UseDynamicSizeMarkers}.
     *
     * @memberof ClusterLayerDirective
     */
    get DynamicMarkerRanges(): Map<number, string>;
    set DynamicMarkerRanges(val: Map<number, string>);
    /**
     * Determines whether the layer clusters. This property can only be set on creation of the layer.
     *
     * @memberof MapMarkerLayerDirective
     */
    EnableClustering: boolean;
    /**
     * Gets or sets the grid size to be used for clustering.
     *
     * @memberof MapMarkerLayerDirective
     */
    GridSize: number;
    /**
     * Gets or sets the IconInfo to be used to create a custom marker images. Supports font-based, SVG, graphics and more.
     * See {@link IMarkerIconInfo}.
     *
     * @memberof MapMarkerLayerDirective
     */
    IconInfo: IMarkerIconInfo;
    /**
     * Gets or sets An offset applied to the positioning of the layer.
     *
     * @memberof MapMarkerLayerDirective
     */
    LayerOffset: IPoint;
    /**
     *  IMarkerOptions array holding the marker info.
     *
     * @memberof MapMarkerLayerDirective
     */
    get MarkerOptions(): Array<IMarkerOptions>;
    set MarkerOptions(val: Array<IMarkerOptions>);
    /**
     * Gets or sets the cluster styles
     *
     * @memberof MapMarkerLayerDirective
     */
    get Styles(): Array<IClusterIconInfo>;
    set Styles(val: Array<IClusterIconInfo>);
    /**
     * Sets whether to treat changes in the MarkerOptions as streams of new markers. In thsi mode, changing the
     * Array supplied in MarkerOptions will be incrementally drawn on the map as opposed to replace the markers on the map.
     *
     * @memberof MapMarkerLayerDirective
     */
    get TreatNewMarkerOptionsAsStream(): boolean;
    set TreatNewMarkerOptionsAsStream(val: boolean);
    /**
     * Gets or sets whether to use dynamic markers. Dynamic markers change in size and color depending on the number of
     * pins in the cluster. If set to true, this will take precendence over any custom marker creation.
     *
     * @memberof MapMarkerLayerDirective
     */
    get UseDynamicSizeMarkers(): boolean;
    set UseDynamicSizeMarkers(val: boolean);
    /**
     * Sets the visibility of the marker layer
     *
     * @memberof MapMarkerLayerDirective
     */
    Visible: boolean;
    /**
     * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
     *
     * @memberof MapMarkerLayerDirective
     */
    ZIndex: number;
    /**
     * Gets or sets whether the cluster should zoom in on click
     *
     * @readonly
     * @memberof MapMarkerLayerDirective
     */
    ZoomOnClick: boolean;
    /**
     * This event emitter gets emitted when the dynamic icon for a marker is being created.
     *
     * @memberof MapMarkerLayerDirective
     */
    DynamicMarkerCreated: EventEmitter<IMarkerIconInfo>;
    /**
     * This event emitter gets emitted when the user clicks a marker in the layer.
     *
     * @memberof MapMarkerLayerDirective
     */
    MarkerClick: EventEmitter<IMarkerEvent>;
    /**
     * This event is fired when the user stops dragging a marker.
     *
     * @memberof MapMarkerLayerDirective
     */
    DragEnd: EventEmitter<IMarkerEvent>;
    /**
     * Gets the id of the marker layer.
     *
     * @readonly
     * @memberof MapMarkerLayerDirective
     */
    get Id(): number;
    /**
     * Creates an instance of MapMarkerLayerDirective.
     * @param _markerService - Concreate implementation of a {@link MarkerService}.
     * @param _layerService - Concreate implementation of a {@link LayerService}.
     * @param _clusterService - Concreate implementation of a {@link ClusterService}.
     * @param _mapService - Concreate implementation of a {@link MapService}.
     * @param _zone - Concreate implementation of a {@link NgZone} service.
     *
     * @memberof MapMarkerLayerDirective
     */
    constructor(_markerService: MarkerService, _layerService: LayerService, _clusterService: ClusterService, _mapService: MapService, _zone: NgZone);
    /**
     * Translates a geo location to a pixel location relative to the map viewport.
     *
     * @param [loc] - {@link ILatLong} containing the geo coordinates.
     * @returns - A promise that when fullfilled contains an {@link IPoint} representing the pixel coordinates.
     *
     * @memberof MapMarkerLayerDirective
     */
    LocationToPixel(loc: ILatLong): Promise<IPoint>;
    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapMarkerLayerDirective
     */
    ngAfterContentInit(): void;
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     *
     * @memberof MapMarkerLayerDirective
     */
    ngOnDestroy(): void;
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     *
     * @memberof MapMarkerLayerDirective
     */
    ngOnChanges(changes: {
        [key: string]: SimpleChange;
    }): void;
    /**
     * Obtains a string representation of the Marker Id.
     * @returns - string representation of the marker id.
     * @memberof MapMarkerLayerDirective
     */
    toString(): string;
    /**
     * Adds various event listeners for the marker.
     *
     * @param m - the marker for which to add the event.
     *
     * @memberof MapMarkerLayerDirective
     */
    private AddEventListeners;
    /**
     * Sets or updates the markers based on the marker options. This will place the markers on the map
     * and register the associated events.
     *
     * @memberof MapMarkerLayerDirective
     * @method
     */
    private UpdateMarkers;
}
