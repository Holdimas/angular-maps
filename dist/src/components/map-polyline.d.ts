import { OnDestroy, OnChanges, ViewContainerRef, EventEmitter, AfterContentInit, SimpleChanges } from '@angular/core';
import { ILatLong } from '../interfaces/ilatlong';
import { PolylineService } from '../services/polyline.service';
import { IPolylineEvent } from '../interfaces/ipolyline-event';
import { InfoBoxComponent } from './infobox';
/**
 *
 * MapPolylineDirective renders a polyline inside a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapPolylineDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map,
 *  styles: [`
 *   .map-container { height: 300px; }
 * `],
 * template: `
 *   <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-polyline [Paths]="path"></x-map-polyline>
 *   </x-map>
 * `
 * })
 * ```
 *
 *
 * @export
 */
export declare class MapPolylineDirective implements OnDestroy, OnChanges, AfterContentInit {
    private _polylineService;
    private _containerRef;
    private _inCustomLayer;
    private _id;
    private _layerId;
    private _addedToService;
    private _events;
    protected _infoBox: InfoBoxComponent;
    /**
     * Gets or sets whether this Polyline handles mouse events.
     *
     * @memberof MapPolylineDirective
     */
    Clickable: boolean;
    /**
     * If set to true, the user can drag this shape over the map.
     *
     * @memberof MapPolylineDirective
     */
    Draggable: boolean;
    /**
     * If set to true, the user can edit this shape by dragging the control
     * points shown at the vertices and on each segment.
     *
     * @memberof MapPolylineDirective
     */
    Editable: boolean;
    /**
     * When true, edges of the polyline are interpreted as geodesic and will
     * follow the curvature of the Earth. When false, edges of the polyline are
     * rendered as straight lines in screen space. Note that the shape of a
     * geodesic polyline may appear to change when dragged, as the dimensions
     * are maintained relative to the surface of the earth. Defaults to false.
     *
     * @memberof MapPolylineDirective
     */
    Geodesic: boolean;
    /**
     * Arbitary metadata to assign to the Polyline. This is useful for events
     *
     * @memberof MapPolylineDirective
     */
    Metadata: Map<string, any>;
    /**
     * The ordered sequence of coordinates that designates a polyline.
     * Simple polylines may be defined using a single array of LatLngs. More
     * complex polylines may specify an array of arrays.
     *
     * @memberof MapPolylineDirective
     */
    Path: Array<ILatLong> | Array<Array<ILatLong>>;
    /**
     * Whether to show the title of the polyline as the tooltip on the polygon.
     *
     * @memberof MapPolylineDirective
     */
    ShowTooltip: boolean;
    /**
     * The stroke color.
     *
     * @memberof MapPolylineDirective
     */
    StrokeColor: string;
    /**
     * The stroke opacity between 0.0 and 1.0
     *
     * @memberof MapPolylineDirective
     */
    StrokeOpacity: number;
    /**
     * The stroke width in pixels.
     *
     * @memberof MapPolylineDirective
     */
    StrokeWeight: number;
    /**
     * The title of the polygon.
     *
     * @memberof MapPolylineDirective
     */
    Title: string;
    /**
     * Whether this polyline is visible on the map. Defaults to true.
     *
     * @memberof MapPolylineDirective
     */
    Visible: boolean;
    /**
     * The zIndex compared to other polys.
     *
     * @memberof MapPolylineDirective
     */
    zIndex: number;
    /**
     * This event is fired when the DOM click event is fired on the Polyline.
     *
     * @memberof MapPolylineDirective
     */
    Click: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired when the DOM dblclick event is fired on the Polyline.
     *
     * @memberof MapPolylineDirective
     */
    DblClick: EventEmitter<IPolylineEvent>;
    /**
     * This event is repeatedly fired while the user drags the polyline.
     *
     * @memberof MapPolylineDirective
     */
    Drag: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired when the user stops dragging the polyline.
     *
     * @memberof MapPolylineDirective
     */
    DragEnd: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired when the user starts dragging the polyline.
     *
     * @memberof MapPolylineDirective
     */
    DragStart: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired when the DOM mousedown event is fired on the Polyline.
     *
     * @memberof MapPolylineDirective
     */
    MouseDown: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired when the DOM mousemove event is fired on the Polyline.
     *
     * @memberof MapPolylineDirective
     */
    MouseMove: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired on Polyline mouseout.
     *
     * @memberof MapPolylineDirective
     */
    MouseOut: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired on Polyline mouseover.
     *
     * @memberof MapPolylineDirective
     */
    MouseOver: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired whe the DOM mouseup event is fired on the Polyline
     *
     * @memberof MapPolylineDirective
     */
    MouseUp: EventEmitter<IPolylineEvent>;
    /**
     * This even is fired when the Polyline is right-clicked on.
     *
     * @memberof MapPolylineDirective
     */
    RightClick: EventEmitter<IPolylineEvent>;
    /**
     * Gets whether the polyline has been registered with the service.
     * @readonly
     * @memberof MapPolylineDirective
     */
    get AddedToService(): boolean;
    /**
     * Get the id of the polyline.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get Id(): number;
    /**
     * Gets the id of the polyline as a string.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get IdAsString(): string;
    /**
     * Gets whether the polyline is in a custom layer. See {@link MapLayer}.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get InCustomLayer(): boolean;
    /**
     * gets the id of the Layer the polyline belongs to.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get LayerId(): number;
    /**
     * Creates an instance of MapPolylineDirective.
     * @param _polylineManager
     *
     * @memberof MapPolylineDirective
     */
    constructor(_polylineService: PolylineService, _containerRef: ViewContainerRef);
    /**
     * Called after the content intialization of the directive is complete. Part of the ng Component life cycle.
     *
     * @memberof MapPolylineDirective
     */
    ngAfterContentInit(): void;
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof MapPolylineDirective
     */
    ngOnChanges(changes: SimpleChanges): any;
    /**
     * Called when the polyline is being destroyed. Part of the ng Component life cycle. Release resources.
     *
     *
     * @memberof MapPolylineDirective
     */
    ngOnDestroy(): void;
    /**
     * Wires up the event receivers.
     *
     * @memberof MapPolylineDirective
     */
    private AddEventListeners;
    /**
     * Generates IPolyline option changeset from directive settings.
     *
     * @param changes - {@link SimpleChanges} identifying the changes that occured.
     * @returns - {@link IPolylineOptions} containing the polyline options.
     *
     * @memberof MapPolylineDirective
     */
    private GeneratePolylineChangeSet;
}
