import { Directive, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { LayerService } from '../services/layer.service';
import { MapService } from '../services/map.service';
/**
 * internal counter to use as ids for polygons.
 */
let layerId = 1000000;
/**
 * MapPolygonLayerDirective performantly renders a large set of polygons on a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent} from '...';
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
 *      <x-map-polygon-layer [PolygonOptions]="_polygons"></x-map-polygon-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
export class MapPolygonLayerDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapPolygonLayerDirective.
     * @param _layerService - Concreate implementation of a {@link LayerService}.
     * @param _mapService - Concreate implementation of a {@link MapService}.
     * @param _zone - Concreate implementation of a {@link NgZone} service.
     * @memberof MapPolygonLayerDirective
     */
    constructor(_layerService, _mapService, _zone) {
        this._layerService = _layerService;
        this._mapService = _mapService;
        this._zone = _zone;
        this._labels = new Array();
        this._tooltipSubscriptions = new Array();
        this._tooltipVisible = false;
        this._defaultOptions = {
            fontSize: 11,
            fontFamily: 'sans-serif',
            strokeWeight: 2,
            strokeColor: '#000000',
            fontColor: '#ffffff'
        };
        this._streaming = false;
        this._polygons = new Array();
        this._polygonsLast = new Array();
        /**
         * Set the maximum zoom at which the polygon labels are visible. Ignored if ShowLabel is false.
         * @memberof MapPolygonLayerDirective
         */
        this.LabelMaxZoom = Number.MAX_SAFE_INTEGER;
        /**
         * Set the minimum zoom at which the polygon labels are visible. Ignored if ShowLabel is false.
         * @memberof MapPolygonLayerDirective
         */
        this.LabelMinZoom = -1;
        /**
         * Gets or sets An offset applied to the positioning of the layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.LayerOffset = null;
        /**
         * Whether to show the polygon titles as the labels on the polygons.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.ShowLabels = false;
        /**
         * Whether to show the titles of the polygosn as the tooltips on the polygons.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.ShowTooltips = true;
        /**
         * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.ZIndex = 0;
        ///
        /// Delegates
        ///
        /**
         * This event emitter gets emitted when the user clicks a polygon in the layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.PolygonClick = new EventEmitter();
        /**
         * This event is fired when the DOM dblclick event is fired on a polygon in the layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.PolygonDblClick = new EventEmitter();
        /**
         * This event is fired when the DOM mousemove event is fired on a polygon in the layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.PolygonMouseMove = new EventEmitter();
        /**
         * This event is fired on mouseout on a polygon in the layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.PolygonMouseOut = new EventEmitter();
        /**
         * This event is fired on mouseover on a polygon in a layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.PolygonMouseOver = new EventEmitter();
        this._id = layerId++;
    }
    /**
     * An array of polygon options representing the polygons in the layer.
     *
     * @memberof MapPolygonLayerDirective
     */
    get PolygonOptions() { return this._polygons; }
    set PolygonOptions(val) {
        if (this._streaming) {
            this._polygonsLast.push(...val.slice(0));
            this._polygons.push(...val);
        }
        else {
            this._polygons = val.slice(0);
        }
    }
    /**
     * Sets whether to treat changes in the PolygonOptions as streams of new markers. In this mode, changing the
     * Array supplied in PolygonOptions will be incrementally drawn on the map as opposed to replace the polygons on the map.
     *
     * @memberof MapPolygonLayerDirective
     */
    get TreatNewPolygonOptionsAsStream() { return this._streaming; }
    set TreatNewPolygonOptionsAsStream(val) { this._streaming = val; }
    ///
    /// Property declarations
    ///
    /**
     * Gets the id of the marker layer.
     *
     * @readonly
     * @memberof MapPolygonLayerDirective
     */
    get Id() { return this._id; }
    ///
    /// Public methods
    ///
    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapPolygonLayerDirective
     */
    ngAfterContentInit() {
        const layerOptions = {
            id: this._id
        };
        this._zone.runOutsideAngular(() => {
            const fakeLayerDirective = {
                Id: this._id,
                Visible: this.Visible,
                LayerOffset: this.LayerOffset,
                ZIndex: this.ZIndex
            };
            this._layerService.AddLayer(fakeLayerDirective);
            this._layerPromise = this._layerService.GetNativeLayer(fakeLayerDirective);
            Promise.all([
                this._layerPromise,
                this._mapService.CreateCanvasOverlay(el => this.DrawLabels(el))
            ]).then(values => {
                values[0].SetVisible(this.Visible);
                this._canvas = values[1];
                this._canvas._canvasReady.then(b => {
                    this._tooltip = this._canvas.GetToolTipOverlay();
                    this.ManageTooltip(this.ShowTooltips);
                });
                if (this.PolygonOptions) {
                    this._zone.runOutsideAngular(() => this.UpdatePolygons());
                }
            });
            this._service = this._layerService;
        });
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof MapPolygonLayerDirective
     */
    ngOnDestroy() {
        this._tooltipSubscriptions.forEach(s => s.unsubscribe());
        this._layerPromise.then(l => {
            l.Delete();
        });
        if (this._canvas) {
            this._canvas.Delete();
        }
    }
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     * @memberof MapPolygonLayerDirective
     */
    ngOnChanges(changes) {
        if (changes['PolygonOptions']) {
            this._zone.runOutsideAngular(() => {
                this.UpdatePolygons();
            });
        }
        if (changes['Visible'] && !changes['Visible'].firstChange) {
            this._layerPromise.then(l => l.SetVisible(this.Visible));
        }
        if ((changes['ZIndex'] && !changes['ZIndex'].firstChange) ||
            (changes['LayerOffset'] && !changes['LayerOffset'].firstChange)) {
            throw (new Error('You cannot change ZIndex or LayerOffset after the layer has been created.'));
        }
        if ((changes['ShowLabels'] && !changes['ShowLabels'].firstChange) ||
            (changes['LabelMinZoom'] && !changes['LabelMinZoom'].firstChange) ||
            (changes['LabelMaxZoom'] && !changes['LabelMaxZoom'].firstChange)) {
            if (this._canvas) {
                this._canvas.Redraw(true);
            }
        }
        if (changes['ShowTooltips'] && this._tooltip) {
            this.ManageTooltip(changes['ShowTooltips'].currentValue);
        }
    }
    /**
     * Obtains a string representation of the Marker Id.
     * @returns - string representation of the marker id.
     * @memberof MapPolygonLayerDirective
     */
    toString() { return 'MapPolygonLayer-' + this._id.toString(); }
    ///
    /// Private methods
    ///
    /**
     * Adds various event listeners for the marker.
     *
     * @param p - the polygon for which to add the event.
     *
     * @memberof MapPolygonLayerDirective
     */
    AddEventListeners(p) {
        const handlers = [
            { name: 'click', handler: (ev) => this.PolygonClick.emit({ Polygon: p, Click: ev }) },
            { name: 'dblclick', handler: (ev) => this.PolygonDblClick.emit({ Polygon: p, Click: ev }) },
            { name: 'mousemove', handler: (ev) => this.PolygonMouseMove.emit({ Polygon: p, Click: ev }) },
            { name: 'mouseout', handler: (ev) => this.PolygonMouseOut.emit({ Polygon: p, Click: ev }) },
            { name: 'mouseover', handler: (ev) => this.PolygonMouseOver.emit({ Polygon: p, Click: ev }) }
        ];
        handlers.forEach((obj) => p.AddListener(obj.name, obj.handler));
    }
    /**
     * Draws the polygon labels. Called by the Canvas overlay.
     *
     * @param el - The canvas on which to draw the labels.
     * @memberof MapPolygonLayerDirective
     */
    DrawLabels(el) {
        if (this.ShowLabels) {
            this._mapService.GetZoom().then(z => {
                if (this.LabelMinZoom <= z && this.LabelMaxZoom >= z) {
                    const ctx = el.getContext('2d');
                    const labels = this._labels.map(x => x.title);
                    this._mapService.LocationsToPoints(this._labels.map(x => x.loc)).then(locs => {
                        const size = this._mapService.MapSize;
                        for (let i = 0, len = locs.length; i < len; i++) {
                            // Don't draw the point if it is not in view. This greatly improves performance when zoomed in.
                            if (locs[i].x >= 0 && locs[i].y >= 0 && locs[i].x <= size.width && locs[i].y <= size.height) {
                                this.DrawText(ctx, locs[i], labels[i]);
                            }
                        }
                    });
                }
            });
        }
    }
    /**
     * Draws the label text at the appropriate place on the canvas.
     * @param ctx - Canvas drawing context.
     * @param loc - Pixel location on the canvas where to center the text.
     * @param text - Text to draw.
     */
    DrawText(ctx, loc, text) {
        let lo = this.LabelOptions;
        if (lo == null && this._tooltip) {
            lo = this._tooltip.DefaultLabelStyle;
        }
        if (lo == null) {
            lo = this._defaultOptions;
        }
        ctx.strokeStyle = lo.strokeColor;
        ctx.font = `${lo.fontSize}px ${lo.fontFamily}`;
        ctx.textAlign = 'center';
        const strokeWeight = lo.strokeWeight;
        if (text && strokeWeight && strokeWeight > 0) {
            ctx.lineWidth = strokeWeight;
            ctx.strokeText(text, loc.x, loc.y);
        }
        ctx.fillStyle = lo.fontColor;
        ctx.fillText(text, loc.x, loc.y);
    }
    /**
     * Manages the tooltip and the attachment of the associated events.
     *
     * @param show - True to enable the tooltip, false to disable.
     * @memberof MapPolygonLayerDirective
     */
    ManageTooltip(show) {
        if (show && this._canvas) {
            // add tooltip subscriptions
            this._tooltip.Set('hidden', true);
            this._tooltipVisible = false;
            this._tooltipSubscriptions.push(this.PolygonMouseMove.asObservable().subscribe(e => {
                if (this._tooltipVisible) {
                    const loc = this._canvas.GetCoordinatesFromClick(e.Click);
                    this._tooltip.Set('position', loc);
                }
            }));
            this._tooltipSubscriptions.push(this.PolygonMouseOver.asObservable().subscribe(e => {
                if (e.Polygon.Title && e.Polygon.Title.length > 0) {
                    const loc = this._canvas.GetCoordinatesFromClick(e.Click);
                    this._tooltip.Set('text', e.Polygon.Title);
                    this._tooltip.Set('position', loc);
                    if (!this._tooltipVisible) {
                        this._tooltip.Set('hidden', false);
                        this._tooltipVisible = true;
                    }
                }
            }));
            this._tooltipSubscriptions.push(this.PolygonMouseOut.asObservable().subscribe(e => {
                if (this._tooltipVisible) {
                    this._tooltip.Set('hidden', true);
                    this._tooltipVisible = false;
                }
            }));
        }
        else {
            // remove tooltip subscriptions
            this._tooltipSubscriptions.forEach(s => s.unsubscribe());
            this._tooltipSubscriptions.splice(0);
            this._tooltip.Set('hidden', true);
            this._tooltipVisible = false;
        }
    }
    /**
     * Sets or updates the polygons based on the polygon options. This will place the polygons on the map
     * and register the associated events.
     *
     * @memberof MapPolygonLayerDirective
     * @method
     */
    UpdatePolygons() {
        if (this._layerPromise == null) {
            return;
        }
        this._layerPromise.then(l => {
            const polygons = this._streaming ? this._polygonsLast.splice(0) : this._polygons;
            if (!this._streaming) {
                this._labels.splice(0);
            }
            // generate the promise for the markers
            const lp = this._service.CreatePolygons(l.GetOptions().id, polygons);
            // set markers once promises are fullfilled.
            lp.then(p => {
                p.forEach(poly => {
                    if (poly.Title != null && poly.Title.length > 0) {
                        this._labels.push({ loc: poly.Centroid, title: poly.Title });
                    }
                    this.AddEventListeners(poly);
                });
                this._streaming ? l.AddEntities(p) : l.SetEntities(p);
                if (this._canvas) {
                    this._canvas.Redraw(!this._streaming);
                }
            });
        });
    }
}
MapPolygonLayerDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-polygon-layer'
            },] }
];
MapPolygonLayerDirective.ctorParameters = () => [
    { type: LayerService },
    { type: MapService },
    { type: NgZone }
];
MapPolygonLayerDirective.propDecorators = {
    LabelMaxZoom: [{ type: Input }],
    LabelMinZoom: [{ type: Input }],
    LabelOptions: [{ type: Input }],
    LayerOffset: [{ type: Input }],
    PolygonOptions: [{ type: Input }],
    ShowLabels: [{ type: Input }],
    ShowTooltips: [{ type: Input }],
    TreatNewPolygonOptionsAsStream: [{ type: Input }],
    Visible: [{ type: Input }],
    ZIndex: [{ type: Input }],
    PolygonClick: [{ type: Output }],
    PolygonDblClick: [{ type: Output }],
    PolygonMouseMove: [{ type: Output }],
    PolygonMouseOut: [{ type: Output }],
    PolygonMouseOver: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLXBvbHlnb24tbGF5ZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvY29tcG9uZW50cy9tYXAtcG9seWdvbi1sYXllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0gsU0FBUyxFQUFnQixLQUFLLEVBQUUsTUFBTSxFQUN0QyxZQUFZLEVBQW9ELE1BQU0sRUFFekUsTUFBTSxlQUFlLENBQUM7QUFTdkIsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ3pELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQU1yRDs7R0FFRztBQUNILElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUV0Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBd0JHO0FBSUgsTUFBTSxPQUFPLHdCQUF3QjtJQThKakMsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7Ozs7OztPQU1HO0lBQ0gsWUFDWSxhQUEyQixFQUMzQixXQUF1QixFQUN2QixLQUFhO1FBRmIsa0JBQWEsR0FBYixhQUFhLENBQWM7UUFDM0IsZ0JBQVcsR0FBWCxXQUFXLENBQVk7UUFDdkIsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQW5LakIsWUFBTyxHQUEwQyxJQUFJLEtBQUssRUFBa0MsQ0FBQztRQUU3RiwwQkFBcUIsR0FBd0IsSUFBSSxLQUFLLEVBQWdCLENBQUM7UUFDdkUsb0JBQWUsR0FBWSxLQUFLLENBQUM7UUFDakMsb0JBQWUsR0FBa0I7WUFDckMsUUFBUSxFQUFFLEVBQUU7WUFDWixVQUFVLEVBQUUsWUFBWTtZQUN4QixZQUFZLEVBQUUsQ0FBQztZQUNmLFdBQVcsRUFBRSxTQUFTO1lBQ3RCLFNBQVMsRUFBRSxTQUFTO1NBQ3ZCLENBQUM7UUFDTSxlQUFVLEdBQVksS0FBSyxDQUFDO1FBQzVCLGNBQVMsR0FBMkIsSUFBSSxLQUFLLEVBQW1CLENBQUM7UUFDakUsa0JBQWEsR0FBMkIsSUFBSSxLQUFLLEVBQW1CLENBQUM7UUFFN0U7OztXQUdHO1FBQ2EsaUJBQVksR0FBVyxNQUFNLENBQUMsZ0JBQWdCLENBQUM7UUFFL0Q7OztXQUdHO1FBQ2EsaUJBQVksR0FBVyxDQUFDLENBQUMsQ0FBQztRQVMxQzs7OztXQUlHO1FBQ2EsZ0JBQVcsR0FBVyxJQUFJLENBQUM7UUFtQjNDOzs7O1dBSUc7UUFDYSxlQUFVLEdBQVksS0FBSyxDQUFDO1FBRTVDOzs7O1dBSUc7UUFDYSxpQkFBWSxHQUFZLElBQUksQ0FBQztRQW1CN0M7Ozs7V0FJRztRQUNhLFdBQU0sR0FBVyxDQUFDLENBQUM7UUFFbkMsR0FBRztRQUNILGFBQWE7UUFDYixHQUFHO1FBRUg7Ozs7V0FJRztRQUNjLGlCQUFZLEdBQWdDLElBQUksWUFBWSxFQUFpQixDQUFDO1FBRS9GOzs7O1dBSUc7UUFDTyxvQkFBZSxHQUFnQyxJQUFJLFlBQVksRUFBaUIsQ0FBQztRQUUzRjs7OztXQUlHO1FBQ08scUJBQWdCLEdBQWdDLElBQUksWUFBWSxFQUFpQixDQUFDO1FBRTVGOzs7O1dBSUc7UUFDTyxvQkFBZSxHQUFnQyxJQUFJLFlBQVksRUFBaUIsQ0FBQztRQUUzRjs7OztXQUlHO1FBQ08scUJBQWdCLEdBQWdDLElBQUksWUFBWSxFQUFpQixDQUFDO1FBK0J4RixJQUFJLENBQUMsR0FBRyxHQUFHLE9BQU8sRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUE1SEQ7Ozs7T0FJRztJQUNILElBQ2UsY0FBYyxLQUE2QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQzlFLElBQVcsY0FBYyxDQUFDLEdBQTJCO1FBQ2pELElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNqQixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1NBQy9CO2FBQ0k7WUFDRCxJQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDakM7SUFDTCxDQUFDO0lBZ0JMOzs7OztPQUtHO0lBQ0gsSUFDZSw4QkFBOEIsS0FBYyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ2hGLElBQVcsOEJBQThCLENBQUMsR0FBWSxJQUFJLElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQXlEdEYsR0FBRztJQUNILHlCQUF5QjtJQUN6QixHQUFHO0lBRUg7Ozs7O09BS0c7SUFDSCxJQUFXLEVBQUUsS0FBYSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBb0I1QyxHQUFHO0lBQ0gsa0JBQWtCO0lBQ2xCLEdBQUc7SUFFSDs7OztPQUlHO0lBQ0ksa0JBQWtCO1FBQ3JCLE1BQU0sWUFBWSxHQUFrQjtZQUNoQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUc7U0FDZixDQUFDO1FBQ0YsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7WUFDOUIsTUFBTSxrQkFBa0IsR0FBUTtnQkFDNUIsRUFBRSxFQUFHLElBQUksQ0FBQyxHQUFHO2dCQUNiLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztnQkFDckIsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO2dCQUM3QixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07YUFDdEIsQ0FBQztZQUNGLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRTNFLE9BQU8sQ0FBQyxHQUFHLENBQUM7Z0JBQ1IsSUFBSSxDQUFDLGFBQWE7Z0JBQ2xCLElBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ2xFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ2IsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUNqRCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDMUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO29CQUNyQixJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO2lCQUM3RDtZQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxXQUFXO1FBQ2QsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQ3pELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3hCLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUFFO0lBQ2hELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLFdBQVcsQ0FBQyxPQUF3QztRQUN2RCxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO1lBQzNCLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO2dCQUM5QixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQUM7U0FDTjtRQUNELElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsRUFBRTtZQUN2RCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDNUQ7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQztZQUNyRCxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFDakU7WUFDRSxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsMkVBQTJFLENBQUMsQ0FBQyxDQUFDO1NBQ2xHO1FBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxXQUFXLENBQUM7WUFDN0QsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsV0FBVyxDQUFDO1lBQ2pFLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUNuRTtZQUNFLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDZCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUM3QjtTQUNKO1FBQ0QsSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUMxQyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUM1RDtJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksUUFBUSxLQUFhLE9BQU8sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFOUUsR0FBRztJQUNILG1CQUFtQjtJQUNuQixHQUFHO0lBRUg7Ozs7OztPQU1HO0lBQ0ssaUJBQWlCLENBQUMsQ0FBVTtRQUNoQyxNQUFNLFFBQVEsR0FBRztZQUNiLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFDLENBQUMsRUFBRTtZQUMvRixFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBYyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBQyxDQUFDLEVBQUU7WUFDckcsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBQyxDQUFDLEVBQUU7WUFDdkcsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUMsQ0FBQyxFQUFFO1lBQ3JHLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUMsQ0FBQyxFQUFFO1NBQzFHLENBQUM7UUFDRixRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssVUFBVSxDQUFDLEVBQXFCO1FBQ3BDLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNqQixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDaEMsSUFBSSxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsRUFBRTtvQkFDbEQsTUFBTSxHQUFHLEdBQTZCLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzFELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM5QyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUN6RSxNQUFNLElBQUksR0FBVSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQzt3QkFDN0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTs0QkFDN0MsK0ZBQStGOzRCQUMvRixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0NBQ3pGLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs2QkFDMUM7eUJBQ0o7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7aUJBQ047WUFDTCxDQUFDLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssUUFBUSxDQUFDLEdBQTZCLEVBQUUsR0FBVyxFQUFFLElBQVk7UUFDckUsSUFBSSxFQUFFLEdBQWtCLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUMsSUFBSSxFQUFFLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztTQUFFO1FBQzFFLElBQUksRUFBRSxJQUFJLElBQUksRUFBRTtZQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1NBQUU7UUFFOUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDO1FBQ2pDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsUUFBUSxNQUFNLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMvQyxHQUFHLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUN6QixNQUFNLFlBQVksR0FBVyxFQUFFLENBQUMsWUFBWSxDQUFDO1FBQzdDLElBQUksSUFBSSxJQUFJLFlBQVksSUFBSSxZQUFZLEdBQUcsQ0FBQyxFQUFFO1lBQ3RDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsWUFBWSxDQUFDO1lBQzdCLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsR0FBRyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDO1FBQzdCLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNLLGFBQWEsQ0FBQyxJQUFhO1FBQy9CLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDdEIsNEJBQTRCO1lBQzVCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztZQUM3QixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQy9FLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtvQkFDdEIsTUFBTSxHQUFHLEdBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3BFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDdEM7WUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMvRSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQy9DLE1BQU0sR0FBRyxHQUFhLElBQUksQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNwRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDM0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTt3QkFDdkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUNuQyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztxQkFDL0I7aUJBQ0o7WUFDTCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDOUUsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFO29CQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ2xDLElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO2lCQUNoQztZQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDUDthQUNJO1lBQ0QsK0JBQStCO1lBQy9CLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUN6RCxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztTQUNoQztJQUNMLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSyxjQUFjO1FBQ2xCLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLEVBQUU7WUFDNUIsT0FBTztTQUNWO1FBQ0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDeEIsTUFBTSxRQUFRLEdBQTJCLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3pHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQUU7WUFFakQsdUNBQXVDO1lBQ3ZDLE1BQU0sRUFBRSxHQUE0QixJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRTlGLDRDQUE0QztZQUM1QyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNSLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ2IsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7d0JBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUM7cUJBQUU7b0JBQ2hILElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDakMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUFFO1lBQ2hFLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDOzs7WUFoYUosU0FBUyxTQUFDO2dCQUNQLFFBQVEsRUFBRSxxQkFBcUI7YUFDbEM7OztZQXZDUSxZQUFZO1lBQ1osVUFBVTtZQVppRCxNQUFNOzs7MkJBK0VyRSxLQUFLOzJCQU1MLEtBQUs7MkJBT0wsS0FBSzswQkFPTCxLQUFLOzZCQU9MLEtBQUs7eUJBaUJMLEtBQUs7MkJBT0wsS0FBSzs2Q0FRTCxLQUFLO3NCQVNMLEtBQUs7cUJBT0wsS0FBSzsyQkFXTCxNQUFNOzhCQU9OLE1BQU07K0JBT04sTUFBTTs4QkFPTixNQUFNOytCQU9OLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIERpcmVjdGl2ZSwgU2ltcGxlQ2hhbmdlLCBJbnB1dCwgT3V0cHV0LCBPbkRlc3Ryb3ksIE9uQ2hhbmdlcyxcbiAgICBFdmVudEVtaXR0ZXIsIENvbnRlbnRDaGlsZCwgQWZ0ZXJDb250ZW50SW5pdCwgVmlld0NvbnRhaW5lclJlZiwgTmdab25lLFxuICAgIFNpbXBsZUNoYW5nZXNcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IElQb2ludCB9IGZyb20gJy4uL2ludGVyZmFjZXMvaXBvaW50JztcbmltcG9ydCB7IElTaXplIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pc2l6ZSc7XG5pbXBvcnQgeyBJTGF0TG9uZyB9IGZyb20gJy4uL2ludGVyZmFjZXMvaWxhdGxvbmcnO1xuaW1wb3J0IHsgSVBvbHlnb25FdmVudCB9IGZyb20gJy4uL2ludGVyZmFjZXMvaXBvbHlnb24tZXZlbnQnO1xuaW1wb3J0IHsgSVBvbHlnb25PcHRpb25zIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pcG9seWdvbi1vcHRpb25zJztcbmltcG9ydCB7IElMYXllck9wdGlvbnMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lsYXllci1vcHRpb25zJztcbmltcG9ydCB7IElMYWJlbE9wdGlvbnMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lsYWJlbC1vcHRpb25zJztcbmltcG9ydCB7IExheWVyU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL2xheWVyLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWFwU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL21hcC5zZXJ2aWNlJztcbmltcG9ydCB7IExheWVyIH0gZnJvbSAnLi4vbW9kZWxzL2xheWVyJztcbmltcG9ydCB7IFBvbHlnb24gfSBmcm9tICcuLi9tb2RlbHMvcG9seWdvbic7XG5pbXBvcnQgeyBNYXBMYWJlbCB9IGZyb20gJy4uL21vZGVscy9tYXAtbGFiZWwnO1xuaW1wb3J0IHsgQ2FudmFzT3ZlcmxheSB9IGZyb20gJy4uL21vZGVscy9jYW52YXMtb3ZlcmxheSc7XG5cbi8qKlxuICogaW50ZXJuYWwgY291bnRlciB0byB1c2UgYXMgaWRzIGZvciBwb2x5Z29ucy5cbiAqL1xubGV0IGxheWVySWQgPSAxMDAwMDAwO1xuXG4vKipcbiAqIE1hcFBvbHlnb25MYXllckRpcmVjdGl2ZSBwZXJmb3JtYW50bHkgcmVuZGVycyBhIGxhcmdlIHNldCBvZiBwb2x5Z29ucyBvbiBhIHtAbGluayBNYXBDb21wb25lbnR9LlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQge01hcENvbXBvbmVudH0gZnJvbSAnLi4uJztcbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICBzZWxlY3RvcjogJ215LW1hcC1jbXAnLFxuICogIHN0eWxlczogW2BcbiAqICAgLm1hcC1jb250YWluZXIge1xuICogICAgIGhlaWdodDogMzAwcHg7XG4gKiAgIH1cbiAqIGBdLFxuICogdGVtcGxhdGU6IGBcbiAqICAgPHgtbWFwIFtMYXRpdHVkZV09XCJsYXRcIiBbTG9uZ2l0dWRlXT1cImxuZ1wiIFtab29tXT1cInpvb21cIj5cbiAqICAgICAgPHgtbWFwLXBvbHlnb24tbGF5ZXIgW1BvbHlnb25PcHRpb25zXT1cIl9wb2x5Z29uc1wiPjwveC1tYXAtcG9seWdvbi1sYXllcj5cbiAqICAgPC94LW1hcD5cbiAqIGBcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAZXhwb3J0XG4gKi9cbkBEaXJlY3RpdmUoe1xuICAgIHNlbGVjdG9yOiAneC1tYXAtcG9seWdvbi1sYXllcidcbn0pXG5leHBvcnQgY2xhc3MgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlIGltcGxlbWVudHMgT25EZXN0cm95LCBPbkNoYW5nZXMsIEFmdGVyQ29udGVudEluaXQge1xuXG4gICAgLy8vXG4gICAgLy8vIEZpZWxkIGRlY2xhcmF0aW9uc1xuICAgIC8vL1xuICAgIHByaXZhdGUgX2lkOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBfbGF5ZXJQcm9taXNlOiBQcm9taXNlPExheWVyPjtcbiAgICBwcml2YXRlIF9zZXJ2aWNlOiBMYXllclNlcnZpY2U7XG4gICAgcHJpdmF0ZSBfY2FudmFzOiBDYW52YXNPdmVybGF5O1xuICAgIHByaXZhdGUgX2xhYmVsczogQXJyYXk8e2xvYzogSUxhdExvbmcsIHRpdGxlOiBzdHJpbmd9PiA9IG5ldyBBcnJheTx7bG9jOiBJTGF0TG9uZywgdGl0bGU6IHN0cmluZ30+KCk7XG4gICAgcHJpdmF0ZSBfdG9vbHRpcDogTWFwTGFiZWw7XG4gICAgcHJpdmF0ZSBfdG9vbHRpcFN1YnNjcmlwdGlvbnM6IEFycmF5PFN1YnNjcmlwdGlvbj4gPSBuZXcgQXJyYXk8U3Vic2NyaXB0aW9uPigpO1xuICAgIHByaXZhdGUgX3Rvb2x0aXBWaXNpYmxlOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfZGVmYXVsdE9wdGlvbnM6IElMYWJlbE9wdGlvbnMgPSB7XG4gICAgICAgIGZvbnRTaXplOiAxMSxcbiAgICAgICAgZm9udEZhbWlseTogJ3NhbnMtc2VyaWYnLFxuICAgICAgICBzdHJva2VXZWlnaHQ6IDIsXG4gICAgICAgIHN0cm9rZUNvbG9yOiAnIzAwMDAwMCcsXG4gICAgICAgIGZvbnRDb2xvcjogJyNmZmZmZmYnXG4gICAgfTtcbiAgICBwcml2YXRlIF9zdHJlYW1pbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcml2YXRlIF9wb2x5Z29uczogQXJyYXk8SVBvbHlnb25PcHRpb25zPiA9IG5ldyBBcnJheTxJUG9seWdvbk9wdGlvbnM+KCk7XG4gICAgcHJpdmF0ZSBfcG9seWdvbnNMYXN0OiBBcnJheTxJUG9seWdvbk9wdGlvbnM+ID0gbmV3IEFycmF5PElQb2x5Z29uT3B0aW9ucz4oKTtcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgbWF4aW11bSB6b29tIGF0IHdoaWNoIHRoZSBwb2x5Z29uIGxhYmVscyBhcmUgdmlzaWJsZS4gSWdub3JlZCBpZiBTaG93TGFiZWwgaXMgZmFsc2UuXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25MYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBMYWJlbE1heFpvb206IG51bWJlciA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBtaW5pbXVtIHpvb20gYXQgd2hpY2ggdGhlIHBvbHlnb24gbGFiZWxzIGFyZSB2aXNpYmxlLiBJZ25vcmVkIGlmIFNob3dMYWJlbCBpcyBmYWxzZS5cbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIExhYmVsTWluWm9vbTogbnVtYmVyID0gLTE7XG5cbiAgICAvKipcbiAgICAgKiBTZXBjaWZpZXMgc3R5bGVpbmcgb3B0aW9ucyBmb3Igb24tbWFwIHBvbHlnb24gbGFiZWxzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25MYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBMYWJlbE9wdGlvbnM6IElMYWJlbE9wdGlvbnM7XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgQW4gb2Zmc2V0IGFwcGxpZWQgdG8gdGhlIHBvc2l0aW9uaW5nIG9mIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgTGF5ZXJPZmZzZXQ6IElQb2ludCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBBbiBhcnJheSBvZiBwb2x5Z29uIG9wdGlvbnMgcmVwcmVzZW50aW5nIHRoZSBwb2x5Z29ucyBpbiB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KClcbiAgICAgICAgcHVibGljIGdldCBQb2x5Z29uT3B0aW9ucygpOiBBcnJheTxJUG9seWdvbk9wdGlvbnM+IHsgcmV0dXJuIHRoaXMuX3BvbHlnb25zOyB9XG4gICAgICAgIHB1YmxpYyBzZXQgUG9seWdvbk9wdGlvbnModmFsOiBBcnJheTxJUG9seWdvbk9wdGlvbnM+KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc3RyZWFtaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcG9seWdvbnNMYXN0LnB1c2goLi4udmFsLnNsaWNlKDApKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wb2x5Z29ucy5wdXNoKC4uLnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wb2x5Z29ucyA9IHZhbC5zbGljZSgwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0byBzaG93IHRoZSBwb2x5Z29uIHRpdGxlcyBhcyB0aGUgbGFiZWxzIG9uIHRoZSBwb2x5Z29ucy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgU2hvd0xhYmVsczogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0byBzaG93IHRoZSB0aXRsZXMgb2YgdGhlIHBvbHlnb3NuIGFzIHRoZSB0b29sdGlwcyBvbiB0aGUgcG9seWdvbnMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFNob3dUb29sdGlwczogYm9vbGVhbiA9IHRydWU7XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHdoZXRoZXIgdG8gdHJlYXQgY2hhbmdlcyBpbiB0aGUgUG9seWdvbk9wdGlvbnMgYXMgc3RyZWFtcyBvZiBuZXcgbWFya2Vycy4gSW4gdGhpcyBtb2RlLCBjaGFuZ2luZyB0aGVcbiAgICAgKiBBcnJheSBzdXBwbGllZCBpbiBQb2x5Z29uT3B0aW9ucyB3aWxsIGJlIGluY3JlbWVudGFsbHkgZHJhd24gb24gdGhlIG1hcCBhcyBvcHBvc2VkIHRvIHJlcGxhY2UgdGhlIHBvbHlnb25zIG9uIHRoZSBtYXAuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KClcbiAgICAgICAgcHVibGljIGdldCBUcmVhdE5ld1BvbHlnb25PcHRpb25zQXNTdHJlYW0oKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9zdHJlYW1pbmc7IH1cbiAgICAgICAgcHVibGljIHNldCBUcmVhdE5ld1BvbHlnb25PcHRpb25zQXNTdHJlYW0odmFsOiBib29sZWFuKSB7IHRoaXMuX3N0cmVhbWluZyA9IHZhbDsgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgbWFya2VyIGxheWVyXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFZpc2libGU6IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIHotaW5kZXggb2YgdGhlIGxheWVyLiBJZiBub3QgdXNlZCwgbGF5ZXJzIGdldCBzdGFja2VkIGluIHRoZSBvcmRlciBjcmVhdGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25MYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBaSW5kZXg6IG51bWJlciA9IDA7XG5cbiAgICAvLy9cbiAgICAvLy8gRGVsZWdhdGVzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGV2ZW50IGVtaXR0ZXIgZ2V0cyBlbWl0dGVkIHdoZW4gdGhlIHVzZXIgY2xpY2tzIGEgcG9seWdvbiBpbiB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIHB1YmxpYyBQb2x5Z29uQ2xpY2s6IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBvbHlnb25FdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgd2hlbiB0aGUgRE9NIGRibGNsaWNrIGV2ZW50IGlzIGZpcmVkIG9uIGEgcG9seWdvbiBpbiB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIFBvbHlnb25EYmxDbGljazogRXZlbnRFbWl0dGVyPElQb2x5Z29uRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCB3aGVuIHRoZSBET00gbW91c2Vtb3ZlIGV2ZW50IGlzIGZpcmVkIG9uIGEgcG9seWdvbiBpbiB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIFBvbHlnb25Nb3VzZU1vdmU6IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBvbHlnb25FdmVudD4oKTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgaXMgZmlyZWQgb24gbW91c2VvdXQgb24gYSBwb2x5Z29uIGluIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgUG9seWdvbk1vdXNlT3V0OiBFdmVudEVtaXR0ZXI8SVBvbHlnb25FdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5Z29uRXZlbnQ+KCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGV2ZW50IGlzIGZpcmVkIG9uIG1vdXNlb3ZlciBvbiBhIHBvbHlnb24gaW4gYSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgUG9seWdvbk1vdXNlT3ZlcjogRXZlbnRFbWl0dGVyPElQb2x5Z29uRXZlbnQ+ID0gbmV3IEV2ZW50RW1pdHRlcjxJUG9seWdvbkV2ZW50PigpO1xuXG5cblxuICAgIC8vL1xuICAgIC8vLyBQcm9wZXJ0eSBkZWNsYXJhdGlvbnNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGlkIG9mIHRoZSBtYXJrZXIgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHVibGljIGdldCBJZCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5faWQ7IH1cblxuICAgIC8vL1xuICAgIC8vLyBDb25zdHJ1Y3RvclxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBNYXBQb2x5Z29uTGF5ZXJEaXJlY3RpdmUuXG4gICAgICogQHBhcmFtIF9sYXllclNlcnZpY2UgLSBDb25jcmVhdGUgaW1wbGVtZW50YXRpb24gb2YgYSB7QGxpbmsgTGF5ZXJTZXJ2aWNlfS5cbiAgICAgKiBAcGFyYW0gX21hcFNlcnZpY2UgLSBDb25jcmVhdGUgaW1wbGVtZW50YXRpb24gb2YgYSB7QGxpbmsgTWFwU2VydmljZX0uXG4gICAgICogQHBhcmFtIF96b25lIC0gQ29uY3JlYXRlIGltcGxlbWVudGF0aW9uIG9mIGEge0BsaW5rIE5nWm9uZX0gc2VydmljZS5cbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgX2xheWVyU2VydmljZTogTGF5ZXJTZXJ2aWNlLFxuICAgICAgICBwcml2YXRlIF9tYXBTZXJ2aWNlOiBNYXBTZXJ2aWNlLFxuICAgICAgICBwcml2YXRlIF96b25lOiBOZ1pvbmUpIHtcbiAgICAgICAgdGhpcy5faWQgPSBsYXllcklkKys7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgYWZ0ZXIgQ29tcG9uZW50IGNvbnRlbnQgaW5pdGlhbGl6YXRpb24uIFBhcnQgb2YgbmcgQ29tcG9uZW50IGxpZmUgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHVibGljIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICAgICAgY29uc3QgbGF5ZXJPcHRpb25zOiBJTGF5ZXJPcHRpb25zID0ge1xuICAgICAgICAgICAgaWQ6IHRoaXMuX2lkXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmFrZUxheWVyRGlyZWN0aXZlOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgSWQgOiB0aGlzLl9pZCxcbiAgICAgICAgICAgICAgICBWaXNpYmxlOiB0aGlzLlZpc2libGUsXG4gICAgICAgICAgICAgICAgTGF5ZXJPZmZzZXQ6IHRoaXMuTGF5ZXJPZmZzZXQsXG4gICAgICAgICAgICAgICAgWkluZGV4OiB0aGlzLlpJbmRleFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX2xheWVyU2VydmljZS5BZGRMYXllcihmYWtlTGF5ZXJEaXJlY3RpdmUpO1xuICAgICAgICAgICAgdGhpcy5fbGF5ZXJQcm9taXNlID0gdGhpcy5fbGF5ZXJTZXJ2aWNlLkdldE5hdGl2ZUxheWVyKGZha2VMYXllckRpcmVjdGl2ZSk7XG5cbiAgICAgICAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYXllclByb21pc2UsXG4gICAgICAgICAgICAgICAgdGhpcy5fbWFwU2VydmljZS5DcmVhdGVDYW52YXNPdmVybGF5KGVsID0+IHRoaXMuRHJhd0xhYmVscyhlbCkpXG4gICAgICAgICAgICBdKS50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWVzWzBdLlNldFZpc2libGUodGhpcy5WaXNpYmxlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYW52YXMgPSB2YWx1ZXNbMV07XG4gICAgICAgICAgICAgICAgdGhpcy5fY2FudmFzLl9jYW52YXNSZWFkeS50aGVuKGIgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwID0gdGhpcy5fY2FudmFzLkdldFRvb2xUaXBPdmVybGF5KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuTWFuYWdlVG9vbHRpcCh0aGlzLlNob3dUb29sdGlwcyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuUG9seWdvbk9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB0aGlzLlVwZGF0ZVBvbHlnb25zKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fc2VydmljZSA9IHRoaXMuX2xheWVyU2VydmljZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIG9uIGNvbXBvbmVudCBkZXN0cnVjdGlvbi4gRnJlZXMgdGhlIHJlc291cmNlcyB1c2VkIGJ5IHRoZSBjb21wb25lbnQuIFBhcnQgb2YgdGhlIG5nIENvbXBvbmVudCBsaWZlIGN5Y2xlLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25MYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHB1YmxpYyBuZ09uRGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5fdG9vbHRpcFN1YnNjcmlwdGlvbnMuZm9yRWFjaChzID0+IHMudW5zdWJzY3JpYmUoKSk7XG4gICAgICAgIHRoaXMuX2xheWVyUHJvbWlzZS50aGVuKGwgPT4ge1xuICAgICAgICAgICAgbC5EZWxldGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLl9jYW52YXMpIHsgdGhpcy5fY2FudmFzLkRlbGV0ZSgpOyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVhY3RzIHRvIGNoYW5nZXMgaW4gZGF0YS1ib3VuZCBwcm9wZXJ0aWVzIG9mIHRoZSBjb21wb25lbnQgYW5kIGFjdHVhdGVzIHByb3BlcnR5IGNoYW5nZXMgaW4gdGhlIHVuZGVybGluZyBsYXllciBtb2RlbC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGFuZ2VzIC0gY29sbGVjdGlvbiBvZiBjaGFuZ2VzLlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogeyBba2V5OiBzdHJpbmddOiBTaW1wbGVDaGFuZ2UgfSkge1xuICAgICAgICBpZiAoY2hhbmdlc1snUG9seWdvbk9wdGlvbnMnXSkge1xuICAgICAgICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5VcGRhdGVQb2x5Z29ucygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ1Zpc2libGUnXSAmJiAhY2hhbmdlc1snVmlzaWJsZSddLmZpcnN0Q2hhbmdlKSB7XG4gICAgICAgICAgICB0aGlzLl9sYXllclByb21pc2UudGhlbihsID0+IGwuU2V0VmlzaWJsZSh0aGlzLlZpc2libGUpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGNoYW5nZXNbJ1pJbmRleCddICYmICFjaGFuZ2VzWydaSW5kZXgnXS5maXJzdENoYW5nZSkgfHxcbiAgICAgICAgICAgIChjaGFuZ2VzWydMYXllck9mZnNldCddICYmICFjaGFuZ2VzWydMYXllck9mZnNldCddLmZpcnN0Q2hhbmdlKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IChuZXcgRXJyb3IoJ1lvdSBjYW5ub3QgY2hhbmdlIFpJbmRleCBvciBMYXllck9mZnNldCBhZnRlciB0aGUgbGF5ZXIgaGFzIGJlZW4gY3JlYXRlZC4nKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChjaGFuZ2VzWydTaG93TGFiZWxzJ10gJiYgIWNoYW5nZXNbJ1Nob3dMYWJlbHMnXS5maXJzdENoYW5nZSkgfHxcbiAgICAgICAgICAgIChjaGFuZ2VzWydMYWJlbE1pblpvb20nXSAmJiAhY2hhbmdlc1snTGFiZWxNaW5ab29tJ10uZmlyc3RDaGFuZ2UpIHx8XG4gICAgICAgICAgICAoY2hhbmdlc1snTGFiZWxNYXhab29tJ10gJiYgIWNoYW5nZXNbJ0xhYmVsTWF4Wm9vbSddLmZpcnN0Q2hhbmdlKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jYW52YXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYW52YXMuUmVkcmF3KHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydTaG93VG9vbHRpcHMnXSAmJiB0aGlzLl90b29sdGlwKSB7XG4gICAgICAgICAgICB0aGlzLk1hbmFnZVRvb2x0aXAoY2hhbmdlc1snU2hvd1Rvb2x0aXBzJ10uY3VycmVudFZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9idGFpbnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIE1hcmtlciBJZC5cbiAgICAgKiBAcmV0dXJucyAtIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWFya2VyIGlkLlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuICdNYXBQb2x5Z29uTGF5ZXItJyArIHRoaXMuX2lkLnRvU3RyaW5nKCk7IH1cblxuICAgIC8vL1xuICAgIC8vLyBQcml2YXRlIG1ldGhvZHNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEFkZHMgdmFyaW91cyBldmVudCBsaXN0ZW5lcnMgZm9yIHRoZSBtYXJrZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcCAtIHRoZSBwb2x5Z29uIGZvciB3aGljaCB0byBhZGQgdGhlIGV2ZW50LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25MYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHByaXZhdGUgQWRkRXZlbnRMaXN0ZW5lcnMocDogUG9seWdvbik6IHZvaWQge1xuICAgICAgICBjb25zdCBoYW5kbGVycyA9IFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2NsaWNrJywgaGFuZGxlcjogKGV2OiBNb3VzZUV2ZW50KSA9PiB0aGlzLlBvbHlnb25DbGljay5lbWl0KHtQb2x5Z29uOiBwLCBDbGljazogZXZ9KSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZGJsY2xpY2snLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuUG9seWdvbkRibENsaWNrLmVtaXQoe1BvbHlnb246IHAsIENsaWNrOiBldn0pIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdtb3VzZW1vdmUnLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuUG9seWdvbk1vdXNlTW92ZS5lbWl0KHtQb2x5Z29uOiBwLCBDbGljazogZXZ9KSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnbW91c2VvdXQnLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuUG9seWdvbk1vdXNlT3V0LmVtaXQoe1BvbHlnb246IHAsIENsaWNrOiBldn0pIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdtb3VzZW92ZXInLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuUG9seWdvbk1vdXNlT3Zlci5lbWl0KHtQb2x5Z29uOiBwLCBDbGljazogZXZ9KSB9XG4gICAgICAgIF07XG4gICAgICAgIGhhbmRsZXJzLmZvckVhY2goKG9iaikgPT4gcC5BZGRMaXN0ZW5lcihvYmoubmFtZSwgb2JqLmhhbmRsZXIpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEcmF3cyB0aGUgcG9seWdvbiBsYWJlbHMuIENhbGxlZCBieSB0aGUgQ2FudmFzIG92ZXJsYXkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZWwgLSBUaGUgY2FudmFzIG9uIHdoaWNoIHRvIGRyYXcgdGhlIGxhYmVscy5cbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHJpdmF0ZSBEcmF3TGFiZWxzKGVsOiBIVE1MQ2FudmFzRWxlbWVudCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5TaG93TGFiZWxzKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXBTZXJ2aWNlLkdldFpvb20oKS50aGVuKHogPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLkxhYmVsTWluWm9vbSA8PSB6ICYmIHRoaXMuTGFiZWxNYXhab29tID49IHopIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgPSBlbC5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYWJlbHMgPSB0aGlzLl9sYWJlbHMubWFwKHggPT4geC50aXRsZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21hcFNlcnZpY2UuTG9jYXRpb25zVG9Qb2ludHModGhpcy5fbGFiZWxzLm1hcCh4ID0+IHgubG9jKSkudGhlbihsb2NzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNpemU6IElTaXplID0gdGhpcy5fbWFwU2VydmljZS5NYXBTaXplO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGxvY3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBkcmF3IHRoZSBwb2ludCBpZiBpdCBpcyBub3QgaW4gdmlldy4gVGhpcyBncmVhdGx5IGltcHJvdmVzIHBlcmZvcm1hbmNlIHdoZW4gem9vbWVkIGluLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2NzW2ldLnggPj0gMCAmJiBsb2NzW2ldLnkgPj0gMCAmJiBsb2NzW2ldLnggPD0gc2l6ZS53aWR0aCAmJiBsb2NzW2ldLnkgPD0gc2l6ZS5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5EcmF3VGV4dChjdHgsIGxvY3NbaV0sIGxhYmVsc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERyYXdzIHRoZSBsYWJlbCB0ZXh0IGF0IHRoZSBhcHByb3ByaWF0ZSBwbGFjZSBvbiB0aGUgY2FudmFzLlxuICAgICAqIEBwYXJhbSBjdHggLSBDYW52YXMgZHJhd2luZyBjb250ZXh0LlxuICAgICAqIEBwYXJhbSBsb2MgLSBQaXhlbCBsb2NhdGlvbiBvbiB0aGUgY2FudmFzIHdoZXJlIHRvIGNlbnRlciB0aGUgdGV4dC5cbiAgICAgKiBAcGFyYW0gdGV4dCAtIFRleHQgdG8gZHJhdy5cbiAgICAgKi9cbiAgICBwcml2YXRlIERyYXdUZXh0KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJELCBsb2M6IElQb2ludCwgdGV4dDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBsbzogSUxhYmVsT3B0aW9ucyA9IHRoaXMuTGFiZWxPcHRpb25zO1xuICAgICAgICBpZiAobG8gPT0gbnVsbCAmJiB0aGlzLl90b29sdGlwKSB7IGxvID0gdGhpcy5fdG9vbHRpcC5EZWZhdWx0TGFiZWxTdHlsZTsgfVxuICAgICAgICBpZiAobG8gPT0gbnVsbCkgeyBsbyA9IHRoaXMuX2RlZmF1bHRPcHRpb25zOyB9XG5cbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gbG8uc3Ryb2tlQ29sb3I7XG4gICAgICAgIGN0eC5mb250ID0gYCR7bG8uZm9udFNpemV9cHggJHtsby5mb250RmFtaWx5fWA7XG4gICAgICAgIGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgICAgICAgY29uc3Qgc3Ryb2tlV2VpZ2h0OiBudW1iZXIgPSBsby5zdHJva2VXZWlnaHQ7XG4gICAgICAgIGlmICh0ZXh0ICYmIHN0cm9rZVdlaWdodCAmJiBzdHJva2VXZWlnaHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHN0cm9rZVdlaWdodDtcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlVGV4dCh0ZXh0LCBsb2MueCwgbG9jLnkpO1xuICAgICAgICB9XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBsby5mb250Q29sb3I7XG4gICAgICAgIGN0eC5maWxsVGV4dCh0ZXh0LCBsb2MueCwgbG9jLnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hbmFnZXMgdGhlIHRvb2x0aXAgYW5kIHRoZSBhdHRhY2htZW50IG9mIHRoZSBhc3NvY2lhdGVkIGV2ZW50cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaG93IC0gVHJ1ZSB0byBlbmFibGUgdGhlIHRvb2x0aXAsIGZhbHNlIHRvIGRpc2FibGUuXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlnb25MYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHByaXZhdGUgTWFuYWdlVG9vbHRpcChzaG93OiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIGlmIChzaG93ICYmIHRoaXMuX2NhbnZhcykge1xuICAgICAgICAgICAgLy8gYWRkIHRvb2x0aXAgc3Vic2NyaXB0aW9uc1xuICAgICAgICAgICAgdGhpcy5fdG9vbHRpcC5TZXQoJ2hpZGRlbicsIHRydWUpO1xuICAgICAgICAgICAgdGhpcy5fdG9vbHRpcFZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXBTdWJzY3JpcHRpb25zLnB1c2godGhpcy5Qb2x5Z29uTW91c2VNb3ZlLmFzT2JzZXJ2YWJsZSgpLnN1YnNjcmliZShlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdG9vbHRpcFZpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9jOiBJTGF0TG9uZyA9IHRoaXMuX2NhbnZhcy5HZXRDb29yZGluYXRlc0Zyb21DbGljayhlLkNsaWNrKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdG9vbHRpcC5TZXQoJ3Bvc2l0aW9uJywgbG9jKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB0aGlzLl90b29sdGlwU3Vic2NyaXB0aW9ucy5wdXNoKHRoaXMuUG9seWdvbk1vdXNlT3Zlci5hc09ic2VydmFibGUoKS5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGUuUG9seWdvbi5UaXRsZSAmJiBlLlBvbHlnb24uVGl0bGUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2M6IElMYXRMb25nID0gdGhpcy5fY2FudmFzLkdldENvb3JkaW5hdGVzRnJvbUNsaWNrKGUuQ2xpY2spO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwLlNldCgndGV4dCcsIGUuUG9seWdvbi5UaXRsZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAuU2V0KCdwb3NpdGlvbicsIGxvYyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fdG9vbHRpcFZpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAuU2V0KCdoaWRkZW4nLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwVmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB0aGlzLl90b29sdGlwU3Vic2NyaXB0aW9ucy5wdXNoKHRoaXMuUG9seWdvbk1vdXNlT3V0LmFzT2JzZXJ2YWJsZSgpLnN1YnNjcmliZShlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdG9vbHRpcFZpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdG9vbHRpcC5TZXQoJ2hpZGRlbicsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0b29sdGlwIHN1YnNjcmlwdGlvbnNcbiAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXBTdWJzY3JpcHRpb25zLmZvckVhY2gocyA9PiBzLnVuc3Vic2NyaWJlKCkpO1xuICAgICAgICAgICAgdGhpcy5fdG9vbHRpcFN1YnNjcmlwdGlvbnMuc3BsaWNlKDApO1xuICAgICAgICAgICAgdGhpcy5fdG9vbHRpcC5TZXQoJ2hpZGRlbicsIHRydWUpO1xuICAgICAgICAgICAgdGhpcy5fdG9vbHRpcFZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgb3IgdXBkYXRlcyB0aGUgcG9seWdvbnMgYmFzZWQgb24gdGhlIHBvbHlnb24gb3B0aW9ucy4gVGhpcyB3aWxsIHBsYWNlIHRoZSBwb2x5Z29ucyBvbiB0aGUgbWFwXG4gICAgICogYW5kIHJlZ2lzdGVyIHRoZSBhc3NvY2lhdGVkIGV2ZW50cy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uTGF5ZXJEaXJlY3RpdmVcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHJpdmF0ZSBVcGRhdGVQb2x5Z29ucygpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuX2xheWVyUHJvbWlzZSA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbGF5ZXJQcm9taXNlLnRoZW4obCA9PiB7XG4gICAgICAgICAgICBjb25zdCBwb2x5Z29uczogQXJyYXk8SVBvbHlnb25PcHRpb25zPiA9IHRoaXMuX3N0cmVhbWluZyA/IHRoaXMuX3BvbHlnb25zTGFzdC5zcGxpY2UoMCkgOiB0aGlzLl9wb2x5Z29ucztcbiAgICAgICAgICAgIGlmICghdGhpcy5fc3RyZWFtaW5nKSB7IHRoaXMuX2xhYmVscy5zcGxpY2UoMCk7IH1cblxuICAgICAgICAgICAgLy8gZ2VuZXJhdGUgdGhlIHByb21pc2UgZm9yIHRoZSBtYXJrZXJzXG4gICAgICAgICAgICBjb25zdCBscDogUHJvbWlzZTxBcnJheTxQb2x5Z29uPj4gPSB0aGlzLl9zZXJ2aWNlLkNyZWF0ZVBvbHlnb25zKGwuR2V0T3B0aW9ucygpLmlkLCBwb2x5Z29ucyk7XG5cbiAgICAgICAgICAgIC8vIHNldCBtYXJrZXJzIG9uY2UgcHJvbWlzZXMgYXJlIGZ1bGxmaWxsZWQuXG4gICAgICAgICAgICBscC50aGVuKHAgPT4ge1xuICAgICAgICAgICAgICAgIHAuZm9yRWFjaChwb2x5ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvbHkuVGl0bGUgIT0gbnVsbCAmJiBwb2x5LlRpdGxlLmxlbmd0aCA+IDApIHsgdGhpcy5fbGFiZWxzLnB1c2goe2xvYzogcG9seS5DZW50cm9pZCwgdGl0bGU6IHBvbHkuVGl0bGV9KTsgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLkFkZEV2ZW50TGlzdGVuZXJzKHBvbHkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0cmVhbWluZyA/IGwuQWRkRW50aXRpZXMocCkgOiBsLlNldEVudGl0aWVzKHApO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jYW52YXMpIHsgdGhpcy5fY2FudmFzLlJlZHJhdyghdGhpcy5fc3RyZWFtaW5nKTsgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxufVxuIl19