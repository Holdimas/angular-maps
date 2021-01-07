import { SimpleChange, OnDestroy, OnChanges, EventEmitter, AfterContentInit, ViewContainerRef } from '@angular/core';
import { IPoint } from '../interfaces/ipoint';
import { ILatLong } from '../interfaces/ilatlong';
import { IMarkerEvent } from '../interfaces/imarker-event';
import { IMarkerIconInfo } from '../interfaces/imarker-icon-info';
import { MarkerService } from '../services/marker.service';
import { InfoBoxComponent } from './infobox';
/**
 * MapMarkerDirective renders a map marker inside a {@link MapComponent}.
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
 *      <x-map-marker [Latitude]="lat" [Longitude]="lng" [Label]="'M'"></x-map-marker>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
export declare class MapMarkerDirective implements OnDestroy, OnChanges, AfterContentInit {
    private _markerService;
    private _containerRef;
    private _clickTimeout;
    private _events;
    private _id;
    private _inClusterLayer;
    private _inCustomLayer;
    /**
     * Any InfoBox that is a direct children of the marker
     *
     * @protected
     * @memberof MapMarkerDirective
     */
    protected _infoBox: InfoBoxComponent;
    private _layerId;
    private _markerAddedToManger;
    /**
     *  Icon anchor relative to marker root
     *
     * @memberof MapMarkerDirective
     */
    Anchor: IPoint;
    /**
     * This event is fired when the DOM dblclick event is fired on the marker.
     *
     * @memberof MapMarkerDirective
     */
    DblClick: EventEmitter<IMarkerEvent>;
    /**
     * This event is repeatedly fired while the user drags the marker.
     *
     * @memberof MapMarkerDirective
     */
    Drag: EventEmitter<IMarkerEvent>;
    /**
     * This event is fired when the user stops dragging the marker.
     *
     * @memberof MapMarkerDirective
     */
    DragEnd: EventEmitter<IMarkerEvent>;
    /**
     * If true, the marker can be dragged. Default value is false.
     *
     * @memberof MapMarkerDirective
     */
    Draggable: boolean;
    /**
     * This event is fired when the user starts dragging the marker.
     *
     * @memberof MapMarkerDirective
     */
    DragStart: EventEmitter<IMarkerEvent>;
    /**
     * This event emitter gets emitted when a marker icon is being created.
     *
     * @memberof MapMarkerDirective
     */
    DynamicMarkerCreated: EventEmitter<IMarkerIconInfo>;
    /**
     * Icon height
     *
     * @memberof MapMarkerDirective
     */
    Height: number;
    /**
     * Information for dynamic, custom created icons.
     *
     * @memberof MapMarkerDirective
     */
    IconInfo: IMarkerIconInfo;
    /**
     * Icon (the URL of the image) for the foreground.
     *
     * @memberof MapMarkerDirective
     */
    IconUrl: string;
    /**
     * True to indiciate whether this is the first marker in a set.
     * Use this for bulk operations (particularily clustering) to ensure performance.
     *
     * @memberof MapMarkerDirective
     */
    IsFirstInSet: boolean;
    /**
     * True to indiciate whether this is the last marker in a set.
     * Use this for bulk operations (particularily clustering) to ensure performance.
     *
     * @memberof MapMarkerDirective
     */
    IsLastInSet: boolean;
    /**
     * The label (a single uppercase character) for the marker.
     *
     * @memberof MapMarkerDirective
     */
    Label: string;
    /**
     * The latitude position of the marker.
     *
     * @memberof MapMarkerDirective
     */
    Latitude: number;
    /**
     * The longitude position of the marker.
     *
     * @memberof MapMarkerDirective
     */
    Longitude: number;
    /**
     * This event emitter gets emitted when the user clicks on the marker.
     *
     * @memberof MapMarkerDirective
     */
    MarkerClick: EventEmitter<IMarkerEvent>;
    /**
     * Arbitary metadata to assign to the Marker. This is useful for events
     *
     * @memberof MapMarkerDirective
     */
    Metadata: Map<string, any>;
    /**
     * This event is fired when the DOM mousedown event is fired on the marker.
     *
     * @memberof MapMarkerDirective
     */
    MouseDown: EventEmitter<IMarkerEvent>;
    /**
     * This event is fired when the DOM mousemove event is fired on the marker.
     *
     * @memberof MapMarkerDirective
     */
    MouseMove: EventEmitter<IMarkerEvent>;
    /**
     * This event is fired on marker mouseout.
     *
     * @memberof MapMarkerDirective
     */
    MouseOut: EventEmitter<IMarkerEvent>;
    /**
     * This event is fired on marker mouseover.
     *
     * @memberof MapMarkerDirective
     */
    MouseOver: EventEmitter<IMarkerEvent>;
    /**
     * This event is fired whe the DOM mouseup event is fired on the marker
     *
     * @memberof MapMarkerDirective
     */
    MouseUp: EventEmitter<IMarkerEvent>;
    /**
     * This even is fired when the marker is right-clicked on.
     *
     * @memberof MapMarkerDirective
     */
    RightClick: EventEmitter<IMarkerEvent>;
    /**
     *  The title of the marker.
     *
     * @memberof MapMarkerDirective
     */
    Title: string;
    /**
     * Sets the visibility of the marker
     *
     * @memberof MapMarkerDirective
     */
    Visible: boolean;
    /**
     * Icon Width
     *
     * @memberof MapMarkerDirective
     */
    Width: number;
    /**
     * Getswhether the marker has already been added to the marker service and is ready for use.
     *
     * @readonly
     * @memberof MapMarkerDirective
     */
    get AddedToManager(): boolean;
    /**
     * Gets the id of the marker as a string.
     *
     * @readonly
     * @memberof MapMarkerDirective
     */
    get Id(): string;
    /**
     * Gets whether the marker is in a cluster layer. See {@link ClusterLayer}.
     *
     * @readonly
     * @memberof MapMarkerDirective
     */
    get InClusterLayer(): boolean;
    /**
     * Gets whether the marker is in a custom layer. See {@link MapLayer}.
     *
     * @readonly
     * @memberof MapMarkerDirective
     */
    get InCustomLayer(): boolean;
    /**
     * gets the id of the Layer the marker belongs to.
     *
     * @readonly
     * @memberof MapMarkerDirective
     */
    get LayerId(): number;
    /**
     * Creates an instance of MapMarkerDirective.
     * @param _markerService - Concreate implementation of a {@link MarkerService}.
     * @param _containerRef - View container hosting the marker.
     * Used to determine parent layer through markup.
     *
     * @memberof MapMarkerDirective
     */
    constructor(_markerService: MarkerService, _containerRef: ViewContainerRef);
    /**
     * Translates a marker geo location to a pixel location relative to the map viewport.
     *
     * @param [loc] - {@link ILatLong} containing the geo coordinates. If null, the marker's coordinates are used.
     * @returns - A promise that when fullfilled contains an {@link IPoint} representing the pixel coordinates.
     *
     * @memberof MapMarkerDirective
     */
    LocationToPixel(loc?: ILatLong): Promise<IPoint>;
    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapMarkerDirective
     */
    ngAfterContentInit(): void;
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     *
     * @memberof MapMarkerDirective
     */
    ngOnChanges(changes: {
        [key: string]: SimpleChange;
    }): void;
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     *
     * @memberof MapMarkerDirective
     */
    ngOnDestroy(): void;
    /**
     * Obtains a string representation of the Marker Id.
     * @returns - string representation of the marker id.
     * @memberof MapMarkerDirective
     */
    toString(): string;
    /**
     * Adds various event listeners for the marker.
     *
     * @memberof MapMarkerDirective
     */
    private AddEventListeners;
}
