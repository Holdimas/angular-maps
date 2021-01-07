import { Directive, Input, Output, ViewContainerRef, EventEmitter, ContentChild } from '@angular/core';
import { PolygonService } from '../services/polygon.service';
import { InfoBoxComponent } from './infobox';
let polygonId = 0;
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
export class MapPolygonDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapPolygonDirective.
     * @param _polygonManager
     *
     * @memberof MapPolygonDirective
     */
    constructor(_polygonService, _containerRef) {
        this._polygonService = _polygonService;
        this._containerRef = _containerRef;
        ///
        /// Field declarations
        ///
        this._inCustomLayer = false;
        this._addedToService = false;
        this._events = [];
        /**
         * Gets or sets whether this Polygon handles mouse events.
         *
         * @memberof MapPolygonDirective
         */
        this.Clickable = true;
        /**
         * If set to true, the user can drag this shape over the map.
         *
         * @memberof MapPolygonDirective
         */
        this.Draggable = false;
        /**
         * If set to true, the user can edit this shape by dragging the control
         * points shown at the vertices and on each segment.
         *
         * @memberof MapPolygonDirective
         */
        this.Editable = false;
        /**
         * When true, edges of the polygon are interpreted as geodesic and will
         * follow the curvature of the Earth. When false, edges of the polygon are
         * rendered as straight lines in screen space. Note that the shape of a
         * geodesic polygon may appear to change when dragged, as the dimensions
         * are maintained relative to the surface of the earth. Defaults to false.
         *
         * @memberof MapPolygonDirective
         */
        this.Geodesic = false;
        /**
         * Arbitary metadata to assign to the Polygon. This is useful for events
         *
         * @memberof MapPolygonDirective
         */
        this.Metadata = new Map();
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
        this.Paths = [];
        /**
         * Whether to show the title of the polygon as the tooltip on the polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.ShowTooltip = true;
        ///
        /// Delegate definitions
        ///
        /**
         * This event is fired when the DOM click event is fired on the Polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.Click = new EventEmitter();
        /**
         * This event is fired when the DOM dblclick event is fired on the Polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.DblClick = new EventEmitter();
        /**
         * This event is repeatedly fired while the user drags the polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.Drag = new EventEmitter();
        /**
         * This event is fired when the user stops dragging the polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.DragEnd = new EventEmitter();
        /**
         * This event is fired when the user starts dragging the polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.DragStart = new EventEmitter();
        /**
         * This event is fired when the DOM mousedown event is fired on the Polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.MouseDown = new EventEmitter();
        /**
         * This event is fired when the DOM mousemove event is fired on the Polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.MouseMove = new EventEmitter();
        /**
         * This event is fired on Polygon mouseout.
         *
         * @memberof MapPolygonDirective
         */
        this.MouseOut = new EventEmitter();
        /**
         * This event is fired on Polygon mouseover.
         *
         * @memberof MapPolygonDirective
         */
        this.MouseOver = new EventEmitter();
        /**
         * This event is fired whe the DOM mouseup event is fired on the Polygon
         *
         * @memberof MapPolygonDirective
         */
        this.MouseUp = new EventEmitter();
        /**
         * This event is fired when the Polygon is right-clicked on.
         *
         * @memberof MapPolygonDirective
         */
        this.RightClick = new EventEmitter();
        /**
         * This event is fired when editing has completed.
         *
         * @memberof MapPolygonDirective
         */
        this.PathChanged = new EventEmitter();
        this._id = polygonId++;
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets whether the polygon has been registered with the service.
     * @readonly
     * @memberof MapPolygonDirective
     */
    get AddedToService() { return this._addedToService; }
    /**
     * Get the id of the polygon.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get Id() { return this._id; }
    /**
     * Gets the id of the polygon as a string.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get IdAsString() { return this._id.toString(); }
    /**
     * Gets whether the polygon is in a custom layer. See {@link MapLayer}.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get InCustomLayer() { return this._inCustomLayer; }
    /**
     * gets the id of the Layer the polygon belongs to.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get LayerId() { return this._layerId; }
    ///
    /// Public methods
    ///
    /**
     * Called after the content intialization of the directive is complete. Part of the ng Component life cycle.
     *
     * @memberof MapPolygonDirective
     */
    ngAfterContentInit() {
        if (this._containerRef.element.nativeElement.parentElement) {
            const parentName = this._containerRef.element.nativeElement.parentElement.tagName;
            if (parentName.toLowerCase() === 'x-map-layer') {
                this._inCustomLayer = true;
                this._layerId = Number(this._containerRef.element.nativeElement.parentElement.attributes['layerId']);
            }
        }
        if (!this._addedToService) {
            this._polygonService.AddPolygon(this);
            this._addedToService = true;
            this.AddEventListeners();
        }
        return;
    }
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof MapPolygonDirective
     */
    ngOnChanges(changes) {
        if (!this._addedToService) {
            return;
        }
        const o = this.GeneratePolygonChangeSet(changes);
        if (o != null) {
            this._polygonService.SetOptions(this, o);
        }
        if (changes['Paths'] && !changes['Paths'].isFirstChange()) {
            this._polygonService.UpdatePolygon(this);
        }
    }
    /**
     * Called when the poygon is being destroyed. Part of the ng Component life cycle. Release resources.
     *
     *
     * @memberof MapPolygonDirective
     */
    ngOnDestroy() {
        this._polygonService.DeletePolygon(this);
        this._events.forEach((s) => s.unsubscribe());
        ///
        /// remove event subscriptions
        ///
    }
    ///
    /// Private methods
    ///
    /**
     * Wires up the event receivers.
     *
     * @memberof MapPolygonDirective
     */
    AddEventListeners() {
        const _getEventArg = e => {
            return {
                Polygon: this,
                Click: e
            };
        };
        this._events.push(this._polygonService.CreateEventObservable('click', this).subscribe((ev) => {
            const t = this;
            if (this._infoBox != null) {
                this._infoBox.Open(this._polygonService.GetCoordinatesFromClick(ev));
            }
            this.Click.emit(_getEventArg(ev));
        }));
        const handlers = [
            { name: 'dblclick', handler: (ev) => this.DblClick.emit(_getEventArg(ev)) },
            { name: 'drag', handler: (ev) => this.Drag.emit(_getEventArg(ev)) },
            { name: 'dragend', handler: (ev) => this.DragEnd.emit(_getEventArg(ev)) },
            { name: 'dragstart', handler: (ev) => this.DragStart.emit(_getEventArg(ev)) },
            { name: 'mousedown', handler: (ev) => this.MouseDown.emit(_getEventArg(ev)) },
            { name: 'mousemove', handler: (ev) => this.MouseMove.emit(_getEventArg(ev)) },
            { name: 'mouseout', handler: (ev) => this.MouseOut.emit(_getEventArg(ev)) },
            { name: 'mouseover', handler: (ev) => this.MouseOver.emit(_getEventArg(ev)) },
            { name: 'mouseup', handler: (ev) => this.MouseUp.emit(_getEventArg(ev)) },
            { name: 'rightclick', handler: (ev) => this.RightClick.emit(_getEventArg(ev)) },
            { name: 'pathchanged', handler: (ev) => this.PathChanged.emit(ev) }
        ];
        handlers.forEach((obj) => {
            const os = this._polygonService.CreateEventObservable(obj.name, this).subscribe(obj.handler);
            this._events.push(os);
        });
    }
    /**
     * Generates IPolygon option changeset from directive settings.
     *
     * @param changes - {@link SimpleChanges} identifying the changes that occured.
     * @returns - {@link IPolygonOptions} containing the polygon options.
     *
     * @memberof MapPolygonDirective
     */
    GeneratePolygonChangeSet(changes) {
        const options = { id: this._id };
        let hasOptions = false;
        if (changes['Clickable']) {
            options.clickable = this.Clickable;
            hasOptions = true;
        }
        if (changes['Draggable']) {
            options.draggable = this.Draggable;
            hasOptions = true;
        }
        if (changes['Editable']) {
            options.editable = this.Editable;
            hasOptions = true;
        }
        if (changes['FillColor'] || changes['FillOpacity']) {
            options.fillColor = this.FillColor;
            options.fillOpacity = this.FillOpacity;
            hasOptions = true;
        }
        if (changes['Geodesic']) {
            options.geodesic = this.Geodesic;
            hasOptions = true;
        }
        if (changes['LabelMaxZoom']) {
            options.labelMaxZoom = this.LabelMaxZoom;
            hasOptions = true;
        }
        if (changes['LabelMinZoom']) {
            options.labelMinZoom = this.LabelMinZoom;
            hasOptions = true;
        }
        if (changes['ShowTooltip']) {
            options.showTooltip = this.ShowTooltip;
            hasOptions = true;
        }
        if (changes['ShowLabel']) {
            options.showLabel = this.ShowLabel;
            hasOptions = true;
        }
        if (changes['StrokeColor'] || changes['StrokeOpacity']) {
            options.strokeColor = this.StrokeColor;
            options.strokeOpacity = this.StrokeOpacity;
            hasOptions = true;
        }
        if (changes['StrokeWeight']) {
            options.strokeWeight = this.StrokeWeight;
            hasOptions = true;
        }
        if (changes['Title']) {
            options.title = this.Title;
            hasOptions = true;
        }
        if (changes['Visible']) {
            options.visible = this.Visible;
            hasOptions = true;
        }
        if (changes['zIndex']) {
            options.zIndex = this.zIndex;
            hasOptions = true;
        }
        return hasOptions ? options : null;
    }
}
MapPolygonDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-polygon'
            },] }
];
MapPolygonDirective.ctorParameters = () => [
    { type: PolygonService },
    { type: ViewContainerRef }
];
MapPolygonDirective.propDecorators = {
    _infoBox: [{ type: ContentChild, args: [InfoBoxComponent,] }],
    Clickable: [{ type: Input }],
    Draggable: [{ type: Input }],
    Editable: [{ type: Input }],
    FillColor: [{ type: Input }],
    FillOpacity: [{ type: Input }],
    Geodesic: [{ type: Input }],
    LabelMaxZoom: [{ type: Input }],
    LabelMinZoom: [{ type: Input }],
    Metadata: [{ type: Input }],
    Paths: [{ type: Input }],
    ShowLabel: [{ type: Input }],
    ShowTooltip: [{ type: Input }],
    StrokeColor: [{ type: Input }],
    StrokeOpacity: [{ type: Input }],
    StrokeWeight: [{ type: Input }],
    Title: [{ type: Input }],
    Visible: [{ type: Input }],
    zIndex: [{ type: Input }],
    Click: [{ type: Output }],
    DblClick: [{ type: Output }],
    Drag: [{ type: Output }],
    DragEnd: [{ type: Output }],
    DragStart: [{ type: Output }],
    MouseDown: [{ type: Output }],
    MouseMove: [{ type: Output }],
    MouseOut: [{ type: Output }],
    MouseOver: [{ type: Output }],
    MouseUp: [{ type: Output }],
    RightClick: [{ type: Output }],
    PathChanged: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLXBvbHlnb24uanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvY29tcG9uZW50cy9tYXAtcG9seWdvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0gsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQXdCLGdCQUFnQixFQUNoRSxZQUFZLEVBQUUsWUFBWSxFQUM3QixNQUFNLGVBQWUsQ0FBQztBQU12QixPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDN0QsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sV0FBVyxDQUFDO0FBRTdDLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztBQUVsQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBd0JHO0FBSUgsTUFBTSxPQUFPLG1CQUFtQjtJQThSNUIsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7Ozs7O09BS0c7SUFDSCxZQUFvQixlQUErQixFQUFVLGFBQStCO1FBQXhFLG9CQUFlLEdBQWYsZUFBZSxDQUFnQjtRQUFVLGtCQUFhLEdBQWIsYUFBYSxDQUFrQjtRQXRTNUYsR0FBRztRQUNILHNCQUFzQjtRQUN0QixHQUFHO1FBQ0ssbUJBQWMsR0FBRyxLQUFLLENBQUM7UUFHdkIsb0JBQWUsR0FBRyxLQUFLLENBQUM7UUFDeEIsWUFBTyxHQUFtQixFQUFFLENBQUM7UUFRckM7Ozs7V0FJRztRQUNhLGNBQVMsR0FBRyxJQUFJLENBQUM7UUFFakM7Ozs7V0FJRztRQUNhLGNBQVMsR0FBRyxLQUFLLENBQUM7UUFFbEM7Ozs7O1dBS0c7UUFDYSxhQUFRLEdBQUcsS0FBSyxDQUFDO1FBZ0JqQzs7Ozs7Ozs7V0FRRztRQUNhLGFBQVEsR0FBRyxLQUFLLENBQUM7UUFjakM7Ozs7V0FJRztRQUNhLGFBQVEsR0FBcUIsSUFBSSxHQUFHLEVBQWUsQ0FBQztRQUVwRTs7Ozs7Ozs7Ozs7O1dBWUc7UUFDYSxVQUFLLEdBQTZDLEVBQUUsQ0FBQztR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dkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ3hFO1lBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNKLE1BQU0sUUFBUSxHQUFHO1lBQ2IsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDdkYsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDL0UsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDckYsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDekYsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDekYsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDekYsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDdkYsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDekYsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDckYsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDM0YsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWlCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1NBQ3JGLENBQUM7UUFDRixRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDckIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENB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LENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDM0UsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3ZDLENBQUM7OztZQXJiSixTQUFTLFNBQUM7Z0JBQ1AsUUFBUSxFQUFFLGVBQWU7YUFDNUI7OztZQWhDUSxjQUFjO1lBUjZCLGdCQUFnQjs7O3VCQXVEL0QsWUFBWSxTQUFDLGdCQUFnQjt3QkFRN0IsS0FBSzt3QkFPTCxLQUFLO3VCQVFMLEtBQUs7d0JBT0wsS0FBSzswQkFPTCxLQUFLO3VCQVdMLEtBQUs7MkJBTUwsS0FBSzsyQkFNTCxLQUFLO3VCQU9MLEtBQUs7b0JBZUwsS0FBSzt3QkFPTCxLQUFLOzBCQU9MLEtBQUs7MEJBT0wsS0FBSzs0QkFPTCxLQUFLOzJCQU9MLEtBQUs7b0JBT0wsS0FBSztzQkFPTCxLQUFLO3FCQU9MLEtBQUs7b0JBV0wsTUFBTTt1QkFPTixNQUFNO21CQU9OLE1BQU07c0JBT04sTUFBTTt3QkFPTixNQUFNO3dCQU9OLE1BQU07d0JBT04sTUFBTTt1QkFPTixNQUFNO3dCQU9OLE1BQU07c0JBT04sTUFBTTt5QkFRTixNQUFNOzBCQU9OLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIERpcmVjdGl2ZSwgSW5wdXQsIE91dHB1dCwgT25EZXN0cm95LCBPbkNoYW5nZXMsIFZpZXdDb250YWluZXJSZWYsXG4gICAgRXZlbnRFbWl0dGVyLCBDb250ZW50Q2hpbGQsIEFmdGVyQ29udGVudEluaXQsIFNpbXBsZUNoYW5nZXNcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IElQb2x5Z29uT3B0aW9ucyB9IGZyb20gJy4uL2ludGVyZmFjZXMvaXBvbHlnb24tb3B0aW9ucyc7XG5pbXBvcnQgeyBJUG9pbnQgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lwb2ludCc7XG5pbXBvcnQgeyBJUG9seWdvbkV2ZW50IH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pcG9seWdvbi1ldmVudCc7XG5pbXBvcnQgeyBJTGF0TG9uZyB9IGZyb20gJy4uL2ludGVyZmFjZXMvaWxhdGxvbmcnO1xuaW1wb3J0IHsgUG9seWdvblNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9wb2x5Z29uLnNlcnZpY2UnO1xuaW1wb3J0IHsgSW5mb0JveENvbXBvbmVudCB9IGZyb20gJy4vaW5mb2JveCc7XG5cbmxldCBwb2x5Z29uSWQgPSAwO1xuXG4vKipcbiAqXG4gKiBNYXBQb2x5Z29uRGlyZWN0aXZlIHJlbmRlcnMgYSBwb2x5Z29uIGluc2lkZSBhIHtAbGluayBNYXBDb21wb25lbnR9LlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQge01hcENvbXBvbmVudCwgTWFwUG9seWdvbkRpcmVjdGl2ZX0gZnJvbSAnLi4uJztcbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICBzZWxlY3RvcjogJ215LW1hcCxcbiAqICBzdHlsZXM6IFtgXG4gKiAgIC5tYXAtY29udGFpbmVyIHsgaGVpZ2h0OiAzMDBweDsgfVxuICogYF0sXG4gKiB0ZW1wbGF0ZTogYFxuICogICA8eC1tYXAgW0xhdGl0dWRlXT1cImxhdFwiIFtMb25naXR1ZGVdPVwibG5nXCIgW1pvb21dPVwiem9vbVwiPlxuICogICAgICA8eC1tYXAtcG9seWdvbiBbUGF0aHNdPVwicGF0aFwiPjwveC1tYXAtcG9seWdvbj5cbiAqICAgPC94LW1hcD5cbiAqIGBcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKlxuICogQGV4cG9ydFxuICovXG5ARGlyZWN0aXZlKHtcbiAgICBzZWxlY3RvcjogJ3gtbWFwLXBvbHlnb24nXG59KVxuZXhwb3J0IGNsYXNzIE1hcFBvbHlnb25EaXJlY3RpdmUgaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uQ2hhbmdlcywgQWZ0ZXJDb250ZW50SW5pdCB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfaW5DdXN0b21MYXllciA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2lkOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBfbGF5ZXJJZDogbnVtYmVyO1xuICAgIHByaXZhdGUgX2FkZGVkVG9TZXJ2aWNlID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfZXZlbnRzOiBTdWJzY3JpcHRpb25bXSA9IFtdO1xuXG4gICAgLy8vXG4gICAgLy8vIEFueSBJbmZvQm94IHRoYXQgaXMgYSBkaXJlY3QgY2hpbGRyZW4gb2YgdGhlIHBvbHlnb25cbiAgICAvLy9cbiAgICBAQ29udGVudENoaWxkKEluZm9Cb3hDb21wb25lbnQpIHByb3RlY3RlZCBfaW5mb0JveDogSW5mb0JveENvbXBvbmVudDtcblxuXG4gICAgLyoqXG4gICAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgdGhpcyBQb2x5Z29uIGhhbmRsZXMgbW91c2UgZXZlbnRzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgQ2xpY2thYmxlID0gdHJ1ZTtcblxuICAgIC8qKlxuICAgICAqIElmIHNldCB0byB0cnVlLCB0aGUgdXNlciBjYW4gZHJhZyB0aGlzIHNoYXBlIG92ZXIgdGhlIG1hcC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIERyYWdnYWJsZSA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogSWYgc2V0IHRvIHRydWUsIHRoZSB1c2VyIGNhbiBlZGl0IHRoaXMgc2hhcGUgYnkgZHJhZ2dpbmcgdGhlIGNvbnRyb2xcbiAgICAgKiBwb2ludHMgc2hvd24gYXQgdGhlIHZlcnRpY2VzIGFuZCBvbiBlYWNoIHNlZ21lbnQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBFZGl0YWJsZSA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGZpbGwgY29sb3Igb2YgdGhlIHBvbHlnb24uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBGaWxsQ29sb3I6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBmaWxsIG9wYWNpdHkgYmV0d2VlbiAwLjAgYW5kIDEuMFxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgRmlsbE9wYWNpdHk6IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIFdoZW4gdHJ1ZSwgZWRnZXMgb2YgdGhlIHBvbHlnb24gYXJlIGludGVycHJldGVkIGFzIGdlb2Rlc2ljIGFuZCB3aWxsXG4gICAgICogZm9sbG93IHRoZSBjdXJ2YXR1cmUgb2YgdGhlIEVhcnRoLiBXaGVuIGZhbHNlLCBlZGdlcyBvZiB0aGUgcG9seWdvbiBhcmVcbiAgICAgKiByZW5kZXJlZCBhcyBzdHJhaWdodCBsaW5lcyBpbiBzY3JlZW4gc3BhY2UuIE5vdGUgdGhhdCB0aGUgc2hhcGUgb2YgYVxuICAgICAqIGdlb2Rlc2ljIHBvbHlnb24gbWF5IGFwcGVhciB0byBjaGFuZ2Ugd2hlbiBkcmFnZ2VkLCBhcyB0aGUgZGltZW5zaW9uc1xuICAgICAqIGFyZSBtYWludGFpbmVkIHJlbGF0aXZlIHRvIHRoZSBzdXJmYWNlIG9mIHRoZSBlYXJ0aC4gRGVmYXVsdHMgdG8gZmFsc2UuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBHZW9kZXNpYyA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBtYXhpbXVtIHpvb20gYXQgd2hpY2ggdGhlIHBvbHlnb24gbGFibGUgaXMgdmlzaWJsZS4gSWdub3JlZCBpZiBTaG93TGFiZWwgaXMgZmFsc2UuXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgTGFiZWxNYXhab29tOiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIG1pbmltdW0gem9vbSBhdCB3aGljaCB0aGUgcG9seWdvbiBsYWJsZSBpcyB2aXNpYmxlLiBJZ25vcmVkIGlmIFNob3dMYWJlbCBpcyBmYWxzZS5cbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBMYWJlbE1pblpvb206IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIEFyYml0YXJ5IG1ldGFkYXRhIHRvIGFzc2lnbiB0byB0aGUgUG9seWdvbi4gVGhpcyBpcyB1c2VmdWwgZm9yIGV2ZW50c1xuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgTWV0YWRhdGE6IE1hcDxzdHJpbmcsIGFueT4gPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG9yZGVyZWQgc2VxdWVuY2Ugb2YgY29vcmRpbmF0ZXMgdGhhdCBkZXNpZ25hdGVzIGEgY2xvc2VkIGxvb3AuXG4gICAgICogVW5saWtlIHBvbHlsaW5lcywgYSBwb2x5Z29uIG1heSBjb25zaXN0IG9mIG9uZSBvciBtb3JlIHBhdGhzLlxuICAgICAqIEFzIGEgcmVzdWx0LCB0aGUgcGF0aHMgcHJvcGVydHkgbWF5IHNwZWNpZnkgb25lIG9yIG1vcmUgYXJyYXlzIG9mXG4gICAgICogTGF0TG5nIGNvb3JkaW5hdGVzLiBQYXRocyBhcmUgY2xvc2VkIGF1dG9tYXRpY2FsbHk7IGRvIG5vdCByZXBlYXQgdGhlXG4gICAgICogZmlyc3QgdmVydGV4IG9mIHRoZSBwYXRoIGFzIHRoZSBsYXN0IHZlcnRleC4gU2ltcGxlIHBvbHlnb25zIG1heSBiZVxuICAgICAqIGRlZmluZWQgdXNpbmcgYSBzaW5nbGUgYXJyYXkgb2YgTGF0TG5ncy4gTW9yZSBjb21wbGV4IHBvbHlnb25zIG1heVxuICAgICAqIHNwZWNpZnkgYW4gYXJyYXkgb2YgYXJyYXlzIChmb3IgaW5uZXIgbG9vcHMgKS4gQW55IHNpbXBsZSBhcnJheXMgYXJlIGNvbnZlcnRlZCBpbnRvIEFycmF5cy5cbiAgICAgKiBJbnNlcnRpbmcgb3IgcmVtb3ZpbmcgTGF0TG5ncyBmcm9tIHRoZSBBcnJheSB3aWxsIGF1dG9tYXRpY2FsbHkgdXBkYXRlXG4gICAgICogdGhlIHBvbHlnb24gb24gdGhlIG1hcC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFBhdGhzOiBBcnJheTxJTGF0TG9uZz4gfCBBcnJheTxBcnJheTxJTGF0TG9uZz4+ID0gW107XG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRvIHNob3cgdGhlIHRpdGxlIGFzIHRoZSBsYWJlbCBvbiB0aGUgcG9seWdvbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFNob3dMYWJlbDogYm9vbGVhbjtcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdG8gc2hvdyB0aGUgdGl0bGUgb2YgdGhlIHBvbHlnb24gYXMgdGhlIHRvb2x0aXAgb24gdGhlIHBvbHlnb24uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBTaG93VG9vbHRpcDogYm9vbGVhbiA9IHRydWU7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc3Ryb2tlIGNvbG9yLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgU3Ryb2tlQ29sb3I6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBzdHJva2Ugb3BhY2l0eSBiZXR3ZWVuIDAuMCBhbmQgMS4wXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBTdHJva2VPcGFjaXR5OiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc3Ryb2tlIHdpZHRoIGluIHBpeGVscy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFN0cm9rZVdlaWdodDogbnVtYmVyO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHRpdGxlIG9mIHRoZSBwb2x5Z29uLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgVGl0bGU6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhpcyBwb2x5Z29uIGlzIHZpc2libGUgb24gdGhlIG1hcC4gRGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFZpc2libGU6IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBUaGUgekluZGV4IGNvbXBhcmVkIHRvIG90aGVyIHBvbHlzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgekluZGV4OiBudW1iZXI7XG5cbiAgICAvLy9cbiAgICAvLy8gRGVsZWdhdGUgZGVmaW5pdGlvbnNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgd2hlbiB0aGUgRE9NIGNsaWNrIGV2ZW50IGlzIGZpcmVkIG9uIHRoZSBQb2x5Z29uLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgQ2xpY2s6IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBvbHlnb25FdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgd2hlbiB0aGUgRE9NIGRibGNsaWNrIGV2ZW50IGlzIGZpcmVkIG9uIHRoZSBQb2x5Z29uLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgRGJsQ2xpY2s6IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBvbHlnb25FdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgcmVwZWF0ZWRseSBmaXJlZCB3aGlsZSB0aGUgdXNlciBkcmFncyB0aGUgcG9seWdvbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIERyYWc6IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBvbHlnb25FdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgd2hlbiB0aGUgdXNlciBzdG9wcyBkcmFnZ2luZyB0aGUgcG9seWdvbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIERyYWdFbmQ6IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBvbHlnb25FdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgd2hlbiB0aGUgdXNlciBzdGFydHMgZHJhZ2dpbmcgdGhlIHBvbHlnb24uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBPdXRwdXQoKSBEcmFnU3RhcnQ6IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBvbHlnb25FdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgd2hlbiB0aGUgRE9NIG1vdXNlZG93biBldmVudCBpcyBmaXJlZCBvbiB0aGUgUG9seWdvbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIE1vdXNlRG93bjogRXZlbnRFbWl0dGVyPElQb2x5Z29uRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCB3aGVuIHRoZSBET00gbW91c2Vtb3ZlIGV2ZW50IGlzIGZpcmVkIG9uIHRoZSBQb2x5Z29uLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgTW91c2VNb3ZlOiBFdmVudEVtaXR0ZXI8SVBvbHlnb25FdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5Z29uRXZlbnQ+KCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGV2ZW50IGlzIGZpcmVkIG9uIFBvbHlnb24gbW91c2VvdXQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBPdXRwdXQoKSBNb3VzZU91dDogRXZlbnRFbWl0dGVyPElQb2x5Z29uRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCBvbiBQb2x5Z29uIG1vdXNlb3Zlci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIE1vdXNlT3ZlcjogRXZlbnRFbWl0dGVyPElQb2x5Z29uRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCB3aGUgdGhlIERPTSBtb3VzZXVwIGV2ZW50IGlzIGZpcmVkIG9uIHRoZSBQb2x5Z29uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBPdXRwdXQoKSBNb3VzZVVwOiBFdmVudEVtaXR0ZXI8SVBvbHlnb25FdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5Z29uRXZlbnQ+KCk7XG5cblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgd2hlbiB0aGUgUG9seWdvbiBpcyByaWdodC1jbGlja2VkIG9uLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgUmlnaHRDbGljazogRXZlbnRFbWl0dGVyPElQb2x5Z29uRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCB3aGVuIGVkaXRpbmcgaGFzIGNvbXBsZXRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIFBhdGhDaGFuZ2VkOiBFdmVudEVtaXR0ZXI8SVBvbHlnb25FdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5Z29uRXZlbnQ+KCk7XG5cbiAgICAvLy9cbiAgICAvLy8gUHJvcGVydHkgZGVjbGFyYXRpb25zXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHdoZXRoZXIgdGhlIHBvbHlnb24gaGFzIGJlZW4gcmVnaXN0ZXJlZCB3aXRoIHRoZSBzZXJ2aWNlLlxuICAgICAqIEByZWFkb25seVxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHVibGljIGdldCBBZGRlZFRvU2VydmljZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2FkZGVkVG9TZXJ2aWNlOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGlkIG9mIHRoZSBwb2x5Z29uLlxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IElkKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9pZDsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgaWQgb2YgdGhlIHBvbHlnb24gYXMgYSBzdHJpbmcuXG4gICAgICpcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgSWRBc1N0cmluZygpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5faWQudG9TdHJpbmcoKTsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB3aGV0aGVyIHRoZSBwb2x5Z29uIGlzIGluIGEgY3VzdG9tIGxheWVyLiBTZWUge0BsaW5rIE1hcExheWVyfS5cbiAgICAgKlxuICAgICAqIEByZWFkb25seVxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHVibGljIGdldCBJbkN1c3RvbUxheWVyKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5faW5DdXN0b21MYXllcjsgfVxuXG4gICAgLyoqXG4gICAgICogZ2V0cyB0aGUgaWQgb2YgdGhlIExheWVyIHRoZSBwb2x5Z29uIGJlbG9uZ3MgdG8uXG4gICAgICpcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgTGF5ZXJJZCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fbGF5ZXJJZDsgfVxuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIE1hcFBvbHlnb25EaXJlY3RpdmUuXG4gICAgICogQHBhcmFtIF9wb2x5Z29uTWFuYWdlclxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9wb2x5Z29uU2VydmljZTogUG9seWdvblNlcnZpY2UsIHByaXZhdGUgX2NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZikge1xuICAgICAgICB0aGlzLl9pZCA9IHBvbHlnb25JZCsrO1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQdWJsaWMgbWV0aG9kc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGFmdGVyIHRoZSBjb250ZW50IGludGlhbGl6YXRpb24gb2YgdGhlIGRpcmVjdGl2ZSBpcyBjb21wbGV0ZS4gUGFydCBvZiB0aGUgbmcgQ29tcG9uZW50IGxpZmUgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIG5nQWZ0ZXJDb250ZW50SW5pdCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuX2NvbnRhaW5lclJlZi5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50TmFtZTogc3RyaW5nID0gdGhpcy5fY29udGFpbmVyUmVmLmVsZW1lbnQubmF0aXZlRWxlbWVudC5wYXJlbnRFbGVtZW50LnRhZ05hbWU7XG4gICAgICAgICAgICBpZiAocGFyZW50TmFtZS50b0xvd2VyQ2FzZSgpID09PSAneC1tYXAtbGF5ZXInKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW5DdXN0b21MYXllciA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGF5ZXJJZCA9IE51bWJlcih0aGlzLl9jb250YWluZXJSZWYuZWxlbWVudC5uYXRpdmVFbGVtZW50LnBhcmVudEVsZW1lbnQuYXR0cmlidXRlc1snbGF5ZXJJZCddKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2FkZGVkVG9TZXJ2aWNlKSB7XG4gICAgICAgICAgICB0aGlzLl9wb2x5Z29uU2VydmljZS5BZGRQb2x5Z29uKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5fYWRkZWRUb1NlcnZpY2UgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5BZGRFdmVudExpc3RlbmVycygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiBjaGFuZ2VzIHRvIHRoZSBkYXRhYm91ZCBwcm9wZXJ0aWVzIG9jY3VyLiBQYXJ0IG9mIHRoZSBuZyBDb21wb25lbnQgbGlmZSBjeWNsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGFuZ2VzIC0gQ2hhbmdlcyB0aGF0IGhhdmUgb2NjdXJlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IGFueSB7XG4gICAgICAgIGlmICghdGhpcy5fYWRkZWRUb1NlcnZpY2UpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgY29uc3QgbzogSVBvbHlnb25PcHRpb25zID0gdGhpcy5HZW5lcmF0ZVBvbHlnb25DaGFuZ2VTZXQoY2hhbmdlcyk7XG4gICAgICAgIGlmIChvICE9IG51bGwpIHsgdGhpcy5fcG9seWdvblNlcnZpY2UuU2V0T3B0aW9ucyh0aGlzLCBvKTsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snUGF0aHMnXSAmJiAhY2hhbmdlc1snUGF0aHMnXS5pc0ZpcnN0Q2hhbmdlKCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3BvbHlnb25TZXJ2aWNlLlVwZGF0ZVBvbHlnb24odGhpcyk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBwb3lnb24gaXMgYmVpbmcgZGVzdHJveWVkLiBQYXJ0IG9mIHRoZSBuZyBDb21wb25lbnQgbGlmZSBjeWNsZS4gUmVsZWFzZSByZXNvdXJjZXMuXG4gICAgICpcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uRGlyZWN0aXZlXG4gICAgICovXG4gICAgbmdPbkRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMuX3BvbHlnb25TZXJ2aWNlLkRlbGV0ZVBvbHlnb24odGhpcyk7XG4gICAgICAgIHRoaXMuX2V2ZW50cy5mb3JFYWNoKChzKSA9PiBzLnVuc3Vic2NyaWJlKCkpO1xuICAgICAgICAvLy9cbiAgICAgICAgLy8vIHJlbW92ZSBldmVudCBzdWJzY3JpcHRpb25zXG4gICAgICAgIC8vL1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQcml2YXRlIG1ldGhvZHNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIFdpcmVzIHVwIHRoZSBldmVudCByZWNlaXZlcnMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHByaXZhdGUgQWRkRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgICAgIGNvbnN0IF9nZXRFdmVudEFyZzogKGU6IE1vdXNlRXZlbnQpID0+IElQb2x5Z29uRXZlbnQgPSBlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgUG9seWdvbjogdGhpcyxcbiAgICAgICAgICAgICAgICBDbGljazogZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fZXZlbnRzLnB1c2godGhpcy5fcG9seWdvblNlcnZpY2UuQ3JlYXRlRXZlbnRPYnNlcnZhYmxlKCdjbGljaycsIHRoaXMpLnN1YnNjcmliZSgoZXY6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHQ6IE1hcFBvbHlnb25EaXJlY3RpdmUgPSB0aGlzO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2luZm9Cb3ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2luZm9Cb3guT3Blbih0aGlzLl9wb2x5Z29uU2VydmljZS5HZXRDb29yZGluYXRlc0Zyb21DbGljayhldikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5DbGljay5lbWl0KF9nZXRFdmVudEFyZyhldikpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJzID0gW1xuICAgICAgICAgICAgeyBuYW1lOiAnZGJsY2xpY2snLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuRGJsQ2xpY2suZW1pdChfZ2V0RXZlbnRBcmcoZXYpKSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZHJhZycsIGhhbmRsZXI6IChldjogTW91c2VFdmVudCkgPT4gdGhpcy5EcmFnLmVtaXQoX2dldEV2ZW50QXJnKGV2KSkgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2RyYWdlbmQnLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuRHJhZ0VuZC5lbWl0KF9nZXRFdmVudEFyZyhldikpIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdkcmFnc3RhcnQnLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuRHJhZ1N0YXJ0LmVtaXQoX2dldEV2ZW50QXJnKGV2KSkgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ21vdXNlZG93bicsIGhhbmRsZXI6IChldjogTW91c2VFdmVudCkgPT4gdGhpcy5Nb3VzZURvd24uZW1pdChfZ2V0RXZlbnRBcmcoZXYpKSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnbW91c2Vtb3ZlJywgaGFuZGxlcjogKGV2OiBNb3VzZUV2ZW50KSA9PiB0aGlzLk1vdXNlTW92ZS5lbWl0KF9nZXRFdmVudEFyZyhldikpIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdtb3VzZW91dCcsIGhhbmRsZXI6IChldjogTW91c2VFdmVudCkgPT4gdGhpcy5Nb3VzZU91dC5lbWl0KF9nZXRFdmVudEFyZyhldikpIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdtb3VzZW92ZXInLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuTW91c2VPdmVyLmVtaXQoX2dldEV2ZW50QXJnKGV2KSkgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ21vdXNldXAnLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuTW91c2VVcC5lbWl0KF9nZXRFdmVudEFyZyhldikpIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdyaWdodGNsaWNrJywgaGFuZGxlcjogKGV2OiBNb3VzZUV2ZW50KSA9PiB0aGlzLlJpZ2h0Q2xpY2suZW1pdChfZ2V0RXZlbnRBcmcoZXYpKSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAncGF0aGNoYW5nZWQnLCBoYW5kbGVyOiAoZXY6IElQb2x5Z29uRXZlbnQpID0+IHRoaXMuUGF0aENoYW5nZWQuZW1pdChldikgfVxuICAgICAgICBdO1xuICAgICAgICBoYW5kbGVycy5mb3JFYWNoKChvYmopID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9zID0gdGhpcy5fcG9seWdvblNlcnZpY2UuQ3JlYXRlRXZlbnRPYnNlcnZhYmxlKG9iai5uYW1lLCB0aGlzKS5zdWJzY3JpYmUob2JqLmhhbmRsZXIpO1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzLnB1c2gob3MpO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBJUG9seWdvbiBvcHRpb24gY2hhbmdlc2V0IGZyb20gZGlyZWN0aXZlIHNldHRpbmdzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYW5nZXMgLSB7QGxpbmsgU2ltcGxlQ2hhbmdlc30gaWRlbnRpZnlpbmcgdGhlIGNoYW5nZXMgdGhhdCBvY2N1cmVkLlxuICAgICAqIEByZXR1cm5zIC0ge0BsaW5rIElQb2x5Z29uT3B0aW9uc30gY29udGFpbmluZyB0aGUgcG9seWdvbiBvcHRpb25zLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25EaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwcml2YXRlIEdlbmVyYXRlUG9seWdvbkNoYW5nZVNldChjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogSVBvbHlnb25PcHRpb25zIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uczogSVBvbHlnb25PcHRpb25zID0geyBpZDogdGhpcy5faWQgfTtcbiAgICAgICAgbGV0IGhhc09wdGlvbnM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgICAgaWYgKGNoYW5nZXNbJ0NsaWNrYWJsZSddKSB7IG9wdGlvbnMuY2xpY2thYmxlID0gdGhpcy5DbGlja2FibGU7IGhhc09wdGlvbnMgPSB0cnVlOyB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydEcmFnZ2FibGUnXSkgeyBvcHRpb25zLmRyYWdnYWJsZSA9IHRoaXMuRHJhZ2dhYmxlOyBoYXNPcHRpb25zID0gdHJ1ZTsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snRWRpdGFibGUnXSkgeyBvcHRpb25zLmVkaXRhYmxlID0gdGhpcy5FZGl0YWJsZTsgaGFzT3B0aW9ucyA9IHRydWU7IH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ0ZpbGxDb2xvciddIHx8IGNoYW5nZXNbJ0ZpbGxPcGFjaXR5J10pIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZmlsbENvbG9yID0gdGhpcy5GaWxsQ29sb3I7XG4gICAgICAgICAgICBvcHRpb25zLmZpbGxPcGFjaXR5ID0gdGhpcy5GaWxsT3BhY2l0eTtcbiAgICAgICAgICAgIGhhc09wdGlvbnMgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydHZW9kZXNpYyddKSB7IG9wdGlvbnMuZ2VvZGVzaWMgPSB0aGlzLkdlb2Rlc2ljOyBoYXNPcHRpb25zID0gdHJ1ZTsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snTGFiZWxNYXhab29tJ10pIHsgb3B0aW9ucy5sYWJlbE1heFpvb20gPSB0aGlzLkxhYmVsTWF4Wm9vbTsgaGFzT3B0aW9ucyA9IHRydWU7IH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ0xhYmVsTWluWm9vbSddKSB7IG9wdGlvbnMubGFiZWxNaW5ab29tID0gdGhpcy5MYWJlbE1pblpvb207IGhhc09wdGlvbnMgPSB0cnVlOyB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydTaG93VG9vbHRpcCddKSB7IG9wdGlvbnMuc2hvd1Rvb2x0aXAgPSB0aGlzLlNob3dUb29sdGlwOyBoYXNPcHRpb25zID0gdHJ1ZTsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snU2hvd0xhYmVsJ10pIHsgb3B0aW9ucy5zaG93TGFiZWwgPSB0aGlzLlNob3dMYWJlbDsgaGFzT3B0aW9ucyA9IHRydWU7IH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ1N0cm9rZUNvbG9yJ10gfHwgY2hhbmdlc1snU3Ryb2tlT3BhY2l0eSddKSB7XG4gICAgICAgICAgICBvcHRpb25zLnN0cm9rZUNvbG9yID0gdGhpcy5TdHJva2VDb2xvcjtcbiAgICAgICAgICAgIG9wdGlvbnMuc3Ryb2tlT3BhY2l0eSA9IHRoaXMuU3Ryb2tlT3BhY2l0eTtcbiAgICAgICAgICAgIGhhc09wdGlvbnMgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydTdHJva2VXZWlnaHQnXSkgeyBvcHRpb25zLnN0cm9rZVdlaWdodCA9IHRoaXMuU3Ryb2tlV2VpZ2h0OyBoYXNPcHRpb25zID0gdHJ1ZTsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snVGl0bGUnXSkgeyBvcHRpb25zLnRpdGxlID0gdGhpcy5UaXRsZTsgaGFzT3B0aW9ucyA9IHRydWU7IH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ1Zpc2libGUnXSkgeyBvcHRpb25zLnZpc2libGUgPSB0aGlzLlZpc2libGU7IGhhc09wdGlvbnMgPSB0cnVlOyB9XG4gICAgICAgIGlmIChjaGFuZ2VzWyd6SW5kZXgnXSkgeyBvcHRpb25zLnpJbmRleCA9IHRoaXMuekluZGV4OyBoYXNPcHRpb25zID0gdHJ1ZTsgfVxuICAgICAgICByZXR1cm4gaGFzT3B0aW9ucyA/IG9wdGlvbnMgOiBudWxsO1xuICAgIH1cblxufVxuIl19