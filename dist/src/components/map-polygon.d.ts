import { OnDestroy, OnChanges, ViewContainerRef, EventEmitter, AfterContentInit, SimpleChanges } from '@angular/core';
import { IPolygonEvent } from '../interfaces/ipolygon-event';
import { ILatLong } from '../interfaces/ilatlong';
import { PolygonService } from '../services/polygon.service';
import { InfoBoxComponent } from './infobox';
/**
 *
 * MapPolygonDirective renders a polygon inside a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapPolygonDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map,
 *  styles: [`
 *   .map-container { height: 300px; }
 * `],
 * template: `
 *   <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-polygon [Paths]="path"></x-map-polygon>
 *   </x-map>
 * `
 * })
 * ```
 *
 *
 * @export
 */
export declare class MapPolygonDirective implements OnDestroy, OnChanges, AfterContentInit {
    private _polygonService;
    private _containerRef;
    private _inCustomLayer;
    private _id;
    private _layerId;
    private _addedToService;
    private _events;
    protected _infoBox: InfoBoxComponent;
    /**
     * Gets or sets whether this Polygon handles mouse events.
     *
     * @memberof MapPolygonDirective
     */
    Clickable: boolean;
    /**
     * If set to true, the user can drag this shape over the map.
     *
     * @memberof MapPolygonDirective
     */
    Draggable: boolean;
    /**
     * If set to true, the user can edit this shape by dragging the control
     * points shown at the vertices and on each segment.
     *
     * @memberof MapPolygonDirective
     */
    Editable: boolean;
    /**
     * The fill color of the polygon.
     *
     * @memberof MapPolygonDirective
     */
    FillColor: string;
    /**
     * The fill opacity between 0.0 and 1.0
     *
     * @memberof MapPolygonDirective
     */
    FillOpacity: number;
    /**
     * When true, edges of the polygon are interpreted as geodesic and will
     * follow the curvature of the Earth. When false, edges of the polygon are
     * rendered as straight lines in screen space. Note that the shape of a
     * geodesic polygon may appear to change when dragged, as the dimensions
     * are maintained relative to the surface of the earth. Defaults to false.
     *
     * @memberof MapPolygonDirective
     */
    Geodesic: boolean;
    /**
     * Set the maximum zoom at which the polygon lable is visible. Ignored if ShowLabel is false.
     * @memberof MapPolygonDirective
     */
    LabelMaxZoom: number;
    /**
     * Set the minimum zoom at which the polygon lable is visible. Ignored if ShowLabel is false.
     * @memberof MapPolygonDirective
     */
    LabelMinZoom: number;
    /**
     * Arbitary metadata to assign to the Polygon. This is useful for events
     *
     * @memberof MapPolygonDirective
     */
    Metadata: Map<string, any>;
    /**
     * The ordered sequence of coordinates that designates a closed loop.
     * Unlike polylines, a polygon may consist of one or more paths.
     * As a result, the paths property may specify one or more arrays of
     * LatLng coordinates. Paths are closed automatically; do not repeat the
     * first vertex of the path as the last vertex. Simple polygons may be
     * defined using a single array of LatLngs. More complex polygons may
     * specify an array of arrays (for inner loops ). Any simple arrays are converted into Arrays.
     * Inserting or removing LatLngs from the Array will automatically update
     * the polygon on the map.
     *
     * @memberof MapPolygonDirective
     */
    Paths: Array<ILatLong> | Array<Array<ILatLong>>;
    /**
     * Whether to show the title as the label on the polygon.
     *
     * @memberof MapPolygonDirective
     */
    ShowLabel: boolean;
    /**
     * Whether to show the title of the polygon as the tooltip on the polygon.
     *
     * @memberof MapPolygonDirective
     */
    ShowTooltip: boolean;
    /**
     * The stroke color.
     *
     * @memberof MapPolygonDirective
     */
    StrokeColor: string;
    /**
     * The stroke opacity between 0.0 and 1.0
     *
     * @memberof MapPolygonDirective
     */
    StrokeOpacity: number;
    /**
     * The stroke width in pixels.
     *
     * @memberof MapPolygonDirective
     */
    StrokeWeight: number;
    /**
     * The title of the polygon.
     *
     * @memberof MapPolygonDirective
     */
    Title: string;
    /**
     * Whether this polygon is visible on the map. Defaults to true.
     *
     * @memberof MapPolygonDirective
     */
    Visible: boolean;
    /**
     * The zIndex compared to other polys.
     *
     * @memberof MapPolygonDirective
     */
    zIndex: number;
    /**
     * This event is fired when the DOM click event is fired on the Polygon.
     *
     * @memberof MapPolygonDirective
     */
    Click: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired when the DOM dblclick event is fired on the Polygon.
     *
     * @memberof MapPolygonDirective
     */
    DblClick: EventEmitter<IPolygonEvent>;
    /**
     * This event is repeatedly fired while the user drags the polygon.
     *
     * @memberof MapPolygonDirective
     */
    Drag: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired when the user stops dragging the polygon.
     *
     * @memberof MapPolygonDirective
     */
    DragEnd: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired when the user starts dragging the polygon.
     *
     * @memberof MapPolygonDirective
     */
    DragStart: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired when the DOM mousedown event is fired on the Polygon.
     *
     * @memberof MapPolygonDirective
     */
    MouseDown: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired when the DOM mousemove event is fired on the Polygon.
     *
     * @memberof MapPolygonDirective
     */
    MouseMove: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired on Polygon mouseout.
     *
     * @memberof MapPolygonDirective
     */
    MouseOut: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired on Polygon mouseover.
     *
     * @memberof MapPolygonDirective
     */
    MouseOver: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired whe the DOM mouseup event is fired on the Polygon
     *
     * @memberof MapPolygonDirective
     */
    MouseUp: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired when the Polygon is right-clicked on.
     *
     * @memberof MapPolygonDirective
     */
    RightClick: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired when editing has completed.
     *
     * @memberof MapPolygonDirective
     */
    PathChanged: EventEmitter<IPolygonEvent>;
    /**
     * Gets whether the polygon has been registered with the service.
     * @readonly
     * @memberof MapPolygonDirective
     */
    get AddedToService(): boolean;
    /**
     * Get the id of the polygon.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get Id(): number;
    /**
     * Gets the id of the polygon as a string.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get IdAsString(): string;
    /**
     * Gets whether the polygon is in a custom layer. See {@link MapLayer}.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get InCustomLayer(): boolean;
    /**
     * gets the id of the Layer the polygon belongs to.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get LayerId(): number;
    /**
     * Creates an instance of MapPolygonDirective.
     * @param _polygonManager
     *
     * @memberof MapPolygonDirective
     */
    constructor(_polygonService: PolygonService, _containerRef: ViewContainerRef);
    /**
     * Called after the content intialization of the directive is complete. Part of the ng Component life cycle.
     *
     * @memberof MapPolygonDirective
     */
    ngAfterContentInit(): void;
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof MapPolygonDirective
     */
    ngOnChanges(changes: SimpleChanges): any;
    /**
     * Called when the poygon is being destroyed. Part of the ng Component life cycle. Release resources.
     *
     *
     * @memberof MapPolygonDirective
     */
    ngOnDestroy(): void;
    /**
     * Wires up the event receivers.
     *
     * @memberof MapPolygonDirective
     */
    private AddEventListeners;
    /**
     * Generates IPolygon option changeset from directive settings.
     *
     * @param changes - {@link SimpleChanges} identifying the changes that occured.
     * @returns - {@link IPolygonOptions} containing the polygon options.
     *
     * @memberof MapPolygonDirective
     */
    private GeneratePolygonChangeSet;
}
