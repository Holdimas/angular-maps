import { Directive, Input, Output, ViewContainerRef, EventEmitter, ContentChild } from '@angular/core';
import { PolylineService } from '../services/polyline.service';
import { InfoBoxComponent } from './infobox';
let polylineId = 0;
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
export class MapPolylineDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapPolylineDirective.
     * @param _polylineManager
     *
     * @memberof MapPolylineDirective
     */
    constructor(_polylineService, _containerRef) {
        this._polylineService = _polylineService;
        this._containerRef = _containerRef;
        ///
        /// Field declarations
        ///
        this._inCustomLayer = false;
        this._addedToService = false;
        this._events = [];
        /**
         * Gets or sets whether this Polyline handles mouse events.
         *
         * @memberof MapPolylineDirective
         */
        this.Clickable = true;
        /**
         * If set to true, the user can drag this shape over the map.
         *
         * @memberof MapPolylineDirective
         */
        this.Draggable = false;
        /**
         * If set to true, the user can edit this shape by dragging the control
         * points shown at the vertices and on each segment.
         *
         * @memberof MapPolylineDirective
         */
        this.Editable = false;
        /**
         * When true, edges of the polyline are interpreted as geodesic and will
         * follow the curvature of the Earth. When false, edges of the polyline are
         * rendered as straight lines in screen space. Note that the shape of a
         * geodesic polyline may appear to change when dragged, as the dimensions
         * are maintained relative to the surface of the earth. Defaults to false.
         *
         * @memberof MapPolylineDirective
         */
        this.Geodesic = false;
        /**
         * Arbitary metadata to assign to the Polyline. This is useful for events
         *
         * @memberof MapPolylineDirective
         */
        this.Metadata = new Map();
        /**
         * The ordered sequence of coordinates that designates a polyline.
         * Simple polylines may be defined using a single array of LatLngs. More
         * complex polylines may specify an array of arrays.
         *
         * @memberof MapPolylineDirective
         */
        this.Path = [];
        /**
         * Whether to show the title of the polyline as the tooltip on the polygon.
         *
         * @memberof MapPolylineDirective
         */
        this.ShowTooltip = true;
        ///
        /// Delegate definitions
        ///
        /**
         * This event is fired when the DOM click event is fired on the Polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.Click = new EventEmitter();
        /**
         * This event is fired when the DOM dblclick event is fired on the Polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.DblClick = new EventEmitter();
        /**
         * This event is repeatedly fired while the user drags the polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.Drag = new EventEmitter();
        /**
         * This event is fired when the user stops dragging the polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.DragEnd = new EventEmitter();
        /**
         * This event is fired when the user starts dragging the polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.DragStart = new EventEmitter();
        /**
         * This event is fired when the DOM mousedown event is fired on the Polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.MouseDown = new EventEmitter();
        /**
         * This event is fired when the DOM mousemove event is fired on the Polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.MouseMove = new EventEmitter();
        /**
         * This event is fired on Polyline mouseout.
         *
         * @memberof MapPolylineDirective
         */
        this.MouseOut = new EventEmitter();
        /**
         * This event is fired on Polyline mouseover.
         *
         * @memberof MapPolylineDirective
         */
        this.MouseOver = new EventEmitter();
        /**
         * This event is fired whe the DOM mouseup event is fired on the Polyline
         *
         * @memberof MapPolylineDirective
         */
        this.MouseUp = new EventEmitter();
        /**
         * This even is fired when the Polyline is right-clicked on.
         *
         * @memberof MapPolylineDirective
         */
        this.RightClick = new EventEmitter();
        this._id = polylineId++;
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets whether the polyline has been registered with the service.
     * @readonly
     * @memberof MapPolylineDirective
     */
    get AddedToService() { return this._addedToService; }
    /**
     * Get the id of the polyline.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get Id() { return this._id; }
    /**
     * Gets the id of the polyline as a string.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get IdAsString() { return this._id.toString(); }
    /**
     * Gets whether the polyline is in a custom layer. See {@link MapLayer}.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get InCustomLayer() { return this._inCustomLayer; }
    /**
     * gets the id of the Layer the polyline belongs to.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get LayerId() { return this._layerId; }
    ///
    /// Public methods
    ///
    /**
     * Called after the content intialization of the directive is complete. Part of the ng Component life cycle.
     *
     * @memberof MapPolylineDirective
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
            this._polylineService.AddPolyline(this);
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
     * @memberof MapPolylineDirective
     */
    ngOnChanges(changes) {
        if (!this._addedToService) {
            return;
        }
        const o = this.GeneratePolylineChangeSet(changes);
        if (o != null) {
            this._polylineService.SetOptions(this, o);
        }
        if (changes['Path'] && !changes['Path'].isFirstChange()) {
            this._polylineService.UpdatePolyline(this);
        }
    }
    /**
     * Called when the polyline is being destroyed. Part of the ng Component life cycle. Release resources.
     *
     *
     * @memberof MapPolylineDirective
     */
    ngOnDestroy() {
        this._polylineService.DeletePolyline(this);
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
     * @memberof MapPolylineDirective
     */
    AddEventListeners() {
        const _getEventArg = e => {
            return {
                Polyline: this,
                Click: e
            };
        };
        this._polylineService.CreateEventObservable('click', this).subscribe((ev) => {
            if (this._infoBox != null) {
                this._infoBox.Open(this._polylineService.GetCoordinatesFromClick(ev));
            }
            this.Click.emit(_getEventArg(ev));
        });
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
        ];
        handlers.forEach((obj) => {
            const os = this._polylineService.CreateEventObservable(obj.name, this).subscribe(obj.handler);
            this._events.push(os);
        });
    }
    /**
     * Generates IPolyline option changeset from directive settings.
     *
     * @param changes - {@link SimpleChanges} identifying the changes that occured.
     * @returns - {@link IPolylineOptions} containing the polyline options.
     *
     * @memberof MapPolylineDirective
     */
    GeneratePolylineChangeSet(changes) {
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
        if (changes['Geodesic']) {
            options.geodesic = this.Geodesic;
            hasOptions = true;
        }
        if (changes['ShowTooltip']) {
            options.showTooltip = this.ShowTooltip;
            hasOptions = true;
        }
        if (changes['StrokeColor']) {
            options.strokeColor = this.StrokeColor;
            hasOptions = true;
        }
        if (changes['StrokeOpacity']) {
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
MapPolylineDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-polyline'
            },] }
];
MapPolylineDirective.ctorParameters = () => [
    { type: PolylineService },
    { type: ViewContainerRef }
];
MapPolylineDirective.propDecorators = {
    _infoBox: [{ type: ContentChild, args: [InfoBoxComponent,] }],
    Clickable: [{ type: Input }],
    Draggable: [{ type: Input }],
    Editable: [{ type: Input }],
    Geodesic: [{ type: Input }],
    Metadata: [{ type: Input }],
    Path: [{ type: Input }],
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
    RightClick: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLXBvbHlsaW5lLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL2NvbXBvbmVudHMvbWFwLXBvbHlsaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBd0IsZ0JBQWdCLEVBQ2hFLFlBQVksRUFBRSxZQUFZLEVBQzdCLE1BQU0sZUFBZSxDQUFDO0FBS3ZCLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUUvRCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFFN0MsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBRW5COzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F3Qkc7QUFJSCxNQUFNLE9BQU8sb0JBQW9CO0lBK083QixHQUFHO0lBQ0gsZUFBZTtJQUNmLEdBQUc7SUFFSDs7Ozs7T0FLRztJQUNILFlBQW9CLGdCQUFpQyxFQUFVLGFBQStCO1FBQTFFLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBaUI7UUFBVSxrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7UUF2UDlGLEdBQUc7UUFDSCxzQkFBc0I7UUFDdEIsR0FBRztRQUNLLG1CQUFjLEdBQUcsS0FBSyxDQUFDO1FBR3ZCLG9CQUFlLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLFlBQU8sR0FBbUIsRUFBRSxDQUFDO1FBUXJDOzs7O1dBSUc7UUFDYSxjQUFTLEdBQUcsSUFBSSxDQUFDO1FBRWpDOzs7O1dBSUc7UUFDYSxjQUFTLEdBQUcsS0FBSyxDQUFDO1FBRWxDOzs7OztXQUtHO1FBQ2EsYUFBUSxHQUFHLEtBQUssQ0FBQztRQUVqQzs7Ozs7Ozs7V0FRRztRQUNhLGFBQVEsR0FBRyxLQUFLLENBQUM7UUFFakM7Ozs7V0FJRztRQUNhLGFBQVEsR0FBcUIsSUFBSSxHQUFHLEVBQWUsQ0FBQztRQUVwRTs7Ozs7O1dBTUc7UUFDYSxTQUFJLEdBQTZDLEVBQUUsQ0FBQztR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QUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNLFFBQVEsR0FBRztZQUNiLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ3ZGLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQy9FLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ3JGLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ3pGLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ3pGLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ3pGLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ3ZGLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ3pGLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ3JGLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO1NBQzlGLENBQUM7UUFDRixRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDckIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5RixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFHRDs7Ozs7OztPQU9HO0lBQ0sseUJBQXlCLENBQUMsT0FBc0I7UUFDcEQsTUFBTSxPQUFPLEdBQXFCLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNuRCxJQUFJLFVBQVUsR0FBWSxLQUFLLENBQUM7UUFDaEMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDcEYsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDcEYsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDakYsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDakYsSUFBSSxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDMUYsSUFBSSxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDMUYsSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDaEcsSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDN0YsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDeEUsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDOUUsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQUU7UUFDM0UsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3ZDLENBQUM7OztZQTFYSixTQUFTLFNBQUM7Z0JBQ1AsUUFBUSxFQUFFLGdCQUFnQjthQUM3Qjs7O1lBakNRLGVBQWU7WUFQNEIsZ0JBQWdCOzs7dUJBdUQvRCxZQUFZLFNBQUMsZ0JBQWdCO3dCQVE3QixLQUFLO3dCQU9MLEtBQUs7dUJBUUwsS0FBSzt1QkFXTCxLQUFLO3VCQU9MLEtBQUs7bUJBU0wsS0FBSzswQkFPTCxLQUFLOzBCQU9MLEtBQUs7NEJBT0wsS0FBSzsyQkFPTCxLQUFLO29CQU9MLEtBQUs7c0JBT0wsS0FBSztxQkFPTCxLQUFLO29CQVdMLE1BQU07dUJBT04sTUFBTTttQkFPTixNQUFNO3NCQU9OLE1BQU07d0JBT04sTUFBTTt3QkFPTixNQUFNO3dCQU9OLE1BQU07dUJBT04sTUFBTTt3QkFPTixNQUFNO3NCQU9OLE1BQU07eUJBT04sTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgRGlyZWN0aXZlLCBJbnB1dCwgT3V0cHV0LCBPbkRlc3Ryb3ksIE9uQ2hhbmdlcywgVmlld0NvbnRhaW5lclJlZixcbiAgICBFdmVudEVtaXR0ZXIsIENvbnRlbnRDaGlsZCwgQWZ0ZXJDb250ZW50SW5pdCwgU2ltcGxlQ2hhbmdlc1xufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgSVBvaW50IH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pcG9pbnQnO1xuaW1wb3J0IHsgSUxhdExvbmcgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lsYXRsb25nJztcbmltcG9ydCB7IElQb2x5bGluZU9wdGlvbnMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lwb2x5bGluZS1vcHRpb25zJztcbmltcG9ydCB7IFBvbHlsaW5lU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL3BvbHlsaW5lLnNlcnZpY2UnO1xuaW1wb3J0IHsgSVBvbHlsaW5lRXZlbnQgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lwb2x5bGluZS1ldmVudCc7XG5pbXBvcnQgeyBJbmZvQm94Q29tcG9uZW50IH0gZnJvbSAnLi9pbmZvYm94JztcblxubGV0IHBvbHlsaW5lSWQgPSAwO1xuXG4vKipcbiAqXG4gKiBNYXBQb2x5bGluZURpcmVjdGl2ZSByZW5kZXJzIGEgcG9seWxpbmUgaW5zaWRlIGEge0BsaW5rIE1hcENvbXBvbmVudH0uXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7Q29tcG9uZW50fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqIGltcG9ydCB7TWFwQ29tcG9uZW50LCBNYXBQb2x5bGluZURpcmVjdGl2ZX0gZnJvbSAnLi4uJztcbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICBzZWxlY3RvcjogJ215LW1hcCxcbiAqICBzdHlsZXM6IFtgXG4gKiAgIC5tYXAtY29udGFpbmVyIHsgaGVpZ2h0OiAzMDBweDsgfVxuICogYF0sXG4gKiB0ZW1wbGF0ZTogYFxuICogICA8eC1tYXAgW0xhdGl0dWRlXT1cImxhdFwiIFtMb25naXR1ZGVdPVwibG5nXCIgW1pvb21dPVwiem9vbVwiPlxuICogICAgICA8eC1tYXAtcG9seWxpbmUgW1BhdGhzXT1cInBhdGhcIj48L3gtbWFwLXBvbHlsaW5lPlxuICogICA8L3gtbWFwPlxuICogYFxuICogfSlcbiAqIGBgYFxuICpcbiAqXG4gKiBAZXhwb3J0XG4gKi9cbkBEaXJlY3RpdmUoe1xuICAgIHNlbGVjdG9yOiAneC1tYXAtcG9seWxpbmUnXG59KVxuZXhwb3J0IGNsYXNzIE1hcFBvbHlsaW5lRGlyZWN0aXZlIGltcGxlbWVudHMgT25EZXN0cm95LCBPbkNoYW5nZXMsIEFmdGVyQ29udGVudEluaXQge1xuXG4gICAgLy8vXG4gICAgLy8vIEZpZWxkIGRlY2xhcmF0aW9uc1xuICAgIC8vL1xuICAgIHByaXZhdGUgX2luQ3VzdG9tTGF5ZXIgPSBmYWxzZTtcbiAgICBwcml2YXRlIF9pZDogbnVtYmVyO1xuICAgIHByaXZhdGUgX2xheWVySWQ6IG51bWJlcjtcbiAgICBwcml2YXRlIF9hZGRlZFRvU2VydmljZSA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2V2ZW50czogU3Vic2NyaXB0aW9uW10gPSBbXTtcblxuICAgIC8vL1xuICAgIC8vLyBBbnkgSW5mb0JveCB0aGF0IGlzIGEgZGlyZWN0IGNoaWxkcmVuIG9mIHRoZSBwb2x5bGluZVxuICAgIC8vL1xuICAgIEBDb250ZW50Q2hpbGQoSW5mb0JveENvbXBvbmVudCkgcHJvdGVjdGVkIF9pbmZvQm94OiBJbmZvQm94Q29tcG9uZW50O1xuXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciB0aGlzIFBvbHlsaW5lIGhhbmRsZXMgbW91c2UgZXZlbnRzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIENsaWNrYWJsZSA9IHRydWU7XG5cbiAgICAvKipcbiAgICAgKiBJZiBzZXQgdG8gdHJ1ZSwgdGhlIHVzZXIgY2FuIGRyYWcgdGhpcyBzaGFwZSBvdmVyIHRoZSBtYXAuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgRHJhZ2dhYmxlID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBJZiBzZXQgdG8gdHJ1ZSwgdGhlIHVzZXIgY2FuIGVkaXQgdGhpcyBzaGFwZSBieSBkcmFnZ2luZyB0aGUgY29udHJvbFxuICAgICAqIHBvaW50cyBzaG93biBhdCB0aGUgdmVydGljZXMgYW5kIG9uIGVhY2ggc2VnbWVudC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZURpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBFZGl0YWJsZSA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogV2hlbiB0cnVlLCBlZGdlcyBvZiB0aGUgcG9seWxpbmUgYXJlIGludGVycHJldGVkIGFzIGdlb2Rlc2ljIGFuZCB3aWxsXG4gICAgICogZm9sbG93IHRoZSBjdXJ2YXR1cmUgb2YgdGhlIEVhcnRoLiBXaGVuIGZhbHNlLCBlZGdlcyBvZiB0aGUgcG9seWxpbmUgYXJlXG4gICAgICogcmVuZGVyZWQgYXMgc3RyYWlnaHQgbGluZXMgaW4gc2NyZWVuIHNwYWNlLiBOb3RlIHRoYXQgdGhlIHNoYXBlIG9mIGFcbiAgICAgKiBnZW9kZXNpYyBwb2x5bGluZSBtYXkgYXBwZWFyIHRvIGNoYW5nZSB3aGVuIGRyYWdnZWQsIGFzIHRoZSBkaW1lbnNpb25zXG4gICAgICogYXJlIG1haW50YWluZWQgcmVsYXRpdmUgdG8gdGhlIHN1cmZhY2Ugb2YgdGhlIGVhcnRoLiBEZWZhdWx0cyB0byBmYWxzZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZURpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBHZW9kZXNpYyA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogQXJiaXRhcnkgbWV0YWRhdGEgdG8gYXNzaWduIHRvIHRoZSBQb2x5bGluZS4gVGhpcyBpcyB1c2VmdWwgZm9yIGV2ZW50c1xuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIE1ldGFkYXRhOiBNYXA8c3RyaW5nLCBhbnk+ID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBvcmRlcmVkIHNlcXVlbmNlIG9mIGNvb3JkaW5hdGVzIHRoYXQgZGVzaWduYXRlcyBhIHBvbHlsaW5lLlxuICAgICAqIFNpbXBsZSBwb2x5bGluZXMgbWF5IGJlIGRlZmluZWQgdXNpbmcgYSBzaW5nbGUgYXJyYXkgb2YgTGF0TG5ncy4gTW9yZVxuICAgICAqIGNvbXBsZXggcG9seWxpbmVzIG1heSBzcGVjaWZ5IGFuIGFycmF5IG9mIGFycmF5cy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZURpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBQYXRoOiBBcnJheTxJTGF0TG9uZz4gfCBBcnJheTxBcnJheTxJTGF0TG9uZz4+ID0gW107XG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRvIHNob3cgdGhlIHRpdGxlIG9mIHRoZSBwb2x5bGluZSBhcyB0aGUgdG9vbHRpcCBvbiB0aGUgcG9seWdvbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZURpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBTaG93VG9vbHRpcDogYm9vbGVhbiA9IHRydWU7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc3Ryb2tlIGNvbG9yLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFN0cm9rZUNvbG9yOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgc3Ryb2tlIG9wYWNpdHkgYmV0d2VlbiAwLjAgYW5kIDEuMFxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFN0cm9rZU9wYWNpdHk6IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIFRoZSBzdHJva2Ugd2lkdGggaW4gcGl4ZWxzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFN0cm9rZVdlaWdodDogbnVtYmVyO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHRpdGxlIG9mIHRoZSBwb2x5Z29uLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFRpdGxlOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoaXMgcG9seWxpbmUgaXMgdmlzaWJsZSBvbiB0aGUgbWFwLiBEZWZhdWx0cyB0byB0cnVlLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFZpc2libGU6IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBUaGUgekluZGV4IGNvbXBhcmVkIHRvIG90aGVyIHBvbHlzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIHpJbmRleDogbnVtYmVyO1xuXG4gICAgLy8vXG4gICAgLy8vIERlbGVnYXRlIGRlZmluaXRpb25zXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGV2ZW50IGlzIGZpcmVkIHdoZW4gdGhlIERPTSBjbGljayBldmVudCBpcyBmaXJlZCBvbiB0aGUgUG9seWxpbmUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgQ2xpY2s6IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5bGluZUV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCB3aGVuIHRoZSBET00gZGJsY2xpY2sgZXZlbnQgaXMgZmlyZWQgb24gdGhlIFBvbHlsaW5lLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIERibENsaWNrOiBFdmVudEVtaXR0ZXI8SVBvbHlsaW5lRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgcmVwZWF0ZWRseSBmaXJlZCB3aGlsZSB0aGUgdXNlciBkcmFncyB0aGUgcG9seWxpbmUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgRHJhZzogRXZlbnRFbWl0dGVyPElQb2x5bGluZUV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBvbHlsaW5lRXZlbnQ+KCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGV2ZW50IGlzIGZpcmVkIHdoZW4gdGhlIHVzZXIgc3RvcHMgZHJhZ2dpbmcgdGhlIHBvbHlsaW5lLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIERyYWdFbmQ6IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5bGluZUV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCB3aGVuIHRoZSB1c2VyIHN0YXJ0cyBkcmFnZ2luZyB0aGUgcG9seWxpbmUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgRHJhZ1N0YXJ0OiBFdmVudEVtaXR0ZXI8SVBvbHlsaW5lRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgd2hlbiB0aGUgRE9NIG1vdXNlZG93biBldmVudCBpcyBmaXJlZCBvbiB0aGUgUG9seWxpbmUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgTW91c2VEb3duOiBFdmVudEVtaXR0ZXI8SVBvbHlsaW5lRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgd2hlbiB0aGUgRE9NIG1vdXNlbW92ZSBldmVudCBpcyBmaXJlZCBvbiB0aGUgUG9seWxpbmUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgTW91c2VNb3ZlOiBFdmVudEVtaXR0ZXI8SVBvbHlsaW5lRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgb24gUG9seWxpbmUgbW91c2VvdXQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgTW91c2VPdXQ6IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5bGluZUV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCBvbiBQb2x5bGluZSBtb3VzZW92ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgTW91c2VPdmVyOiBFdmVudEVtaXR0ZXI8SVBvbHlsaW5lRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgd2hlIHRoZSBET00gbW91c2V1cCBldmVudCBpcyBmaXJlZCBvbiB0aGUgUG9seWxpbmVcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZURpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBPdXRwdXQoKSBNb3VzZVVwOiBFdmVudEVtaXR0ZXI8SVBvbHlsaW5lRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbiBpcyBmaXJlZCB3aGVuIHRoZSBQb2x5bGluZSBpcyByaWdodC1jbGlja2VkIG9uLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIFJpZ2h0Q2xpY2s6IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5bGluZUV2ZW50PigpO1xuXG4gICAgLy8vXG4gICAgLy8vIFByb3BlcnR5IGRlY2xhcmF0aW9uc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogR2V0cyB3aGV0aGVyIHRoZSBwb2x5bGluZSBoYXMgYmVlbiByZWdpc3RlcmVkIHdpdGggdGhlIHNlcnZpY2UuXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHVibGljIGdldCBBZGRlZFRvU2VydmljZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2FkZGVkVG9TZXJ2aWNlOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGlkIG9mIHRoZSBwb2x5bGluZS5cbiAgICAgKlxuICAgICAqIEByZWFkb25seVxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZURpcmVjdGl2ZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgSWQoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX2lkOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBpZCBvZiB0aGUgcG9seWxpbmUgYXMgYSBzdHJpbmcuXG4gICAgICpcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IElkQXNTdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuX2lkLnRvU3RyaW5nKCk7IH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgd2hldGhlciB0aGUgcG9seWxpbmUgaXMgaW4gYSBjdXN0b20gbGF5ZXIuIFNlZSB7QGxpbmsgTWFwTGF5ZXJ9LlxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHVibGljIGdldCBJbkN1c3RvbUxheWVyKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5faW5DdXN0b21MYXllcjsgfVxuXG4gICAgLyoqXG4gICAgICogZ2V0cyB0aGUgaWQgb2YgdGhlIExheWVyIHRoZSBwb2x5bGluZSBiZWxvbmdzIHRvLlxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHVibGljIGdldCBMYXllcklkKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9sYXllcklkOyB9XG5cbiAgICAvLy9cbiAgICAvLy8gQ29uc3RydWN0b3JcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgTWFwUG9seWxpbmVEaXJlY3RpdmUuXG4gICAgICogQHBhcmFtIF9wb2x5bGluZU1hbmFnZXJcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZURpcmVjdGl2ZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX3BvbHlsaW5lU2VydmljZTogUG9seWxpbmVTZXJ2aWNlLCBwcml2YXRlIF9jb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWYpIHtcbiAgICAgICAgdGhpcy5faWQgPSBwb2x5bGluZUlkKys7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgYWZ0ZXIgdGhlIGNvbnRlbnQgaW50aWFsaXphdGlvbiBvZiB0aGUgZGlyZWN0aXZlIGlzIGNvbXBsZXRlLiBQYXJ0IG9mIHRoZSBuZyBDb21wb25lbnQgbGlmZSBjeWNsZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZURpcmVjdGl2ZVxuICAgICAqL1xuICAgIG5nQWZ0ZXJDb250ZW50SW5pdCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuX2NvbnRhaW5lclJlZi5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgY29uc3QgcGFyZW50TmFtZTogc3RyaW5nID0gdGhpcy5fY29udGFpbmVyUmVmLmVsZW1lbnQubmF0aXZlRWxlbWVudC5wYXJlbnRFbGVtZW50LnRhZ05hbWU7XG4gICAgICAgICAgICBpZiAocGFyZW50TmFtZS50b0xvd2VyQ2FzZSgpID09PSAneC1tYXAtbGF5ZXInKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faW5DdXN0b21MYXllciA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGF5ZXJJZCA9IE51bWJlcih0aGlzLl9jb250YWluZXJSZWYuZWxlbWVudC5uYXRpdmVFbGVtZW50LnBhcmVudEVsZW1lbnQuYXR0cmlidXRlc1snbGF5ZXJJZCddKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuX2FkZGVkVG9TZXJ2aWNlKSB7XG4gICAgICAgICAgICB0aGlzLl9wb2x5bGluZVNlcnZpY2UuQWRkUG9seWxpbmUodGhpcyk7XG4gICAgICAgICAgICB0aGlzLl9hZGRlZFRvU2VydmljZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLkFkZEV2ZW50TGlzdGVuZXJzKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIGNoYW5nZXMgdG8gdGhlIGRhdGFib3VkIHByb3BlcnRpZXMgb2NjdXIuIFBhcnQgb2YgdGhlIG5nIENvbXBvbmVudCBsaWZlIGN5Y2xlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYW5nZXMgLSBDaGFuZ2VzIHRoYXQgaGF2ZSBvY2N1cmVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IGFueSB7XG4gICAgICAgIGlmICghdGhpcy5fYWRkZWRUb1NlcnZpY2UpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgY29uc3QgbzogSVBvbHlsaW5lT3B0aW9ucyA9IHRoaXMuR2VuZXJhdGVQb2x5bGluZUNoYW5nZVNldChjaGFuZ2VzKTtcbiAgICAgICAgaWYgKG8gIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fcG9seWxpbmVTZXJ2aWNlLlNldE9wdGlvbnModGhpcywgbyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ1BhdGgnXSAmJiAhY2hhbmdlc1snUGF0aCddLmlzRmlyc3RDaGFuZ2UoKSkge1xuICAgICAgICAgICAgdGhpcy5fcG9seWxpbmVTZXJ2aWNlLlVwZGF0ZVBvbHlsaW5lKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIHBvbHlsaW5lIGlzIGJlaW5nIGRlc3Ryb3llZC4gUGFydCBvZiB0aGUgbmcgQ29tcG9uZW50IGxpZmUgY3ljbGUuIFJlbGVhc2UgcmVzb3VyY2VzLlxuICAgICAqXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBuZ09uRGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5fcG9seWxpbmVTZXJ2aWNlLkRlbGV0ZVBvbHlsaW5lKHRoaXMpO1xuICAgICAgICB0aGlzLl9ldmVudHMuZm9yRWFjaCgocykgPT4gcy51bnN1YnNjcmliZSgpKTtcbiAgICAgICAgICAgIC8vL1xuICAgICAgICAgICAgLy8vIHJlbW92ZSBldmVudCBzdWJzY3JpcHRpb25zXG4gICAgICAgICAgICAvLy9cbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHJpdmF0ZSBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBXaXJlcyB1cCB0aGUgZXZlbnQgcmVjZWl2ZXJzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHJpdmF0ZSBBZGRFdmVudExpc3RlbmVycygpIHtcbiAgICAgICAgY29uc3QgX2dldEV2ZW50QXJnOiAoZTogTW91c2VFdmVudCkgPT4gSVBvbHlsaW5lRXZlbnQgPSBlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgUG9seWxpbmU6IHRoaXMsXG4gICAgICAgICAgICAgICAgQ2xpY2s6IGVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX3BvbHlsaW5lU2VydmljZS5DcmVhdGVFdmVudE9ic2VydmFibGUoJ2NsaWNrJywgdGhpcykuc3Vic2NyaWJlKChldjogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2luZm9Cb3ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2luZm9Cb3guT3Blbih0aGlzLl9wb2x5bGluZVNlcnZpY2UuR2V0Q29vcmRpbmF0ZXNGcm9tQ2xpY2soZXYpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuQ2xpY2suZW1pdChfZ2V0RXZlbnRBcmcoZXYpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJzID0gW1xuICAgICAgICAgICAgeyBuYW1lOiAnZGJsY2xpY2snLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuRGJsQ2xpY2suZW1pdChfZ2V0RXZlbnRBcmcoZXYpKSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZHJhZycsIGhhbmRsZXI6IChldjogTW91c2VFdmVudCkgPT4gdGhpcy5EcmFnLmVtaXQoX2dldEV2ZW50QXJnKGV2KSkgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2RyYWdlbmQnLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuRHJhZ0VuZC5lbWl0KF9nZXRFdmVudEFyZyhldikpIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdkcmFnc3RhcnQnLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuRHJhZ1N0YXJ0LmVtaXQoX2dldEV2ZW50QXJnKGV2KSkgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ21vdXNlZG93bicsIGhhbmRsZXI6IChldjogTW91c2VFdmVudCkgPT4gdGhpcy5Nb3VzZURvd24uZW1pdChfZ2V0RXZlbnRBcmcoZXYpKSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnbW91c2Vtb3ZlJywgaGFuZGxlcjogKGV2OiBNb3VzZUV2ZW50KSA9PiB0aGlzLk1vdXNlTW92ZS5lbWl0KF9nZXRFdmVudEFyZyhldikpIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdtb3VzZW91dCcsIGhhbmRsZXI6IChldjogTW91c2VFdmVudCkgPT4gdGhpcy5Nb3VzZU91dC5lbWl0KF9nZXRFdmVudEFyZyhldikpIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdtb3VzZW92ZXInLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuTW91c2VPdmVyLmVtaXQoX2dldEV2ZW50QXJnKGV2KSkgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ21vdXNldXAnLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuTW91c2VVcC5lbWl0KF9nZXRFdmVudEFyZyhldikpIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdyaWdodGNsaWNrJywgaGFuZGxlcjogKGV2OiBNb3VzZUV2ZW50KSA9PiB0aGlzLlJpZ2h0Q2xpY2suZW1pdChfZ2V0RXZlbnRBcmcoZXYpKSB9LFxuICAgICAgICBdO1xuICAgICAgICBoYW5kbGVycy5mb3JFYWNoKChvYmopID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9zID0gdGhpcy5fcG9seWxpbmVTZXJ2aWNlLkNyZWF0ZUV2ZW50T2JzZXJ2YWJsZShvYmoubmFtZSwgdGhpcykuc3Vic2NyaWJlKG9iai5oYW5kbGVyKTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5wdXNoKG9zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgSVBvbHlsaW5lIG9wdGlvbiBjaGFuZ2VzZXQgZnJvbSBkaXJlY3RpdmUgc2V0dGluZ3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhbmdlcyAtIHtAbGluayBTaW1wbGVDaGFuZ2VzfSBpZGVudGlmeWluZyB0aGUgY2hhbmdlcyB0aGF0IG9jY3VyZWQuXG4gICAgICogQHJldHVybnMgLSB7QGxpbmsgSVBvbHlsaW5lT3B0aW9uc30gY29udGFpbmluZyB0aGUgcG9seWxpbmUgb3B0aW9ucy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZURpcmVjdGl2ZVxuICAgICAqL1xuICAgIHByaXZhdGUgR2VuZXJhdGVQb2x5bGluZUNoYW5nZVNldChjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogSVBvbHlsaW5lT3B0aW9ucyB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnM6IElQb2x5bGluZU9wdGlvbnMgPSB7IGlkOiB0aGlzLl9pZCB9O1xuICAgICAgICBsZXQgaGFzT3B0aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICAgICAgICBpZiAoY2hhbmdlc1snQ2xpY2thYmxlJ10pIHsgb3B0aW9ucy5jbGlja2FibGUgPSB0aGlzLkNsaWNrYWJsZTsgaGFzT3B0aW9ucyA9IHRydWU7IH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ0RyYWdnYWJsZSddKSB7IG9wdGlvbnMuZHJhZ2dhYmxlID0gdGhpcy5EcmFnZ2FibGU7IGhhc09wdGlvbnMgPSB0cnVlOyB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydFZGl0YWJsZSddKSB7IG9wdGlvbnMuZWRpdGFibGUgPSB0aGlzLkVkaXRhYmxlOyBoYXNPcHRpb25zID0gdHJ1ZTsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snR2VvZGVzaWMnXSkgeyBvcHRpb25zLmdlb2Rlc2ljID0gdGhpcy5HZW9kZXNpYzsgaGFzT3B0aW9ucyA9IHRydWU7IH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ1Nob3dUb29sdGlwJ10pIHsgb3B0aW9ucy5zaG93VG9vbHRpcCA9IHRoaXMuU2hvd1Rvb2x0aXA7IGhhc09wdGlvbnMgPSB0cnVlOyB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydTdHJva2VDb2xvciddKSB7IG9wdGlvbnMuc3Ryb2tlQ29sb3IgPSB0aGlzLlN0cm9rZUNvbG9yOyBoYXNPcHRpb25zID0gdHJ1ZTsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snU3Ryb2tlT3BhY2l0eSddKSB7IG9wdGlvbnMuc3Ryb2tlT3BhY2l0eSA9IHRoaXMuU3Ryb2tlT3BhY2l0eTsgaGFzT3B0aW9ucyA9IHRydWU7IH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ1N0cm9rZVdlaWdodCddKSB7IG9wdGlvbnMuc3Ryb2tlV2VpZ2h0ID0gdGhpcy5TdHJva2VXZWlnaHQ7IGhhc09wdGlvbnMgPSB0cnVlOyB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydUaXRsZSddKSB7IG9wdGlvbnMudGl0bGUgPSB0aGlzLlRpdGxlOyBoYXNPcHRpb25zID0gdHJ1ZTsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snVmlzaWJsZSddKSB7IG9wdGlvbnMudmlzaWJsZSA9IHRoaXMuVmlzaWJsZTsgaGFzT3B0aW9ucyA9IHRydWU7IH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ3pJbmRleCddKSB7IG9wdGlvbnMuekluZGV4ID0gdGhpcy56SW5kZXg7IGhhc09wdGlvbnMgPSB0cnVlOyB9XG4gICAgICAgIHJldHVybiBoYXNPcHRpb25zID8gb3B0aW9ucyA6IG51bGw7XG4gICAgfVxuXG59XG4iXX0=