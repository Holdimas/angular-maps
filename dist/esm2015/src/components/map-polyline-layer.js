import { Directive, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { LayerService } from '../services/layer.service';
import { MapService } from '../services/map.service';
import { Polyline } from '../models/polyline';
/**
 * internal counter to use as ids for polylines.
 */
let layerId = 1000000;
/**
 * MapPolylineLayerDirective performantly renders a large set of polyline on a {@link MapComponent}.
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
 *      <x-map-polyline-layer [PolygonOptions]="_polyline"></x-map-polyline-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
export class MapPolylineLayerDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapPolylineLayerDirective.
     * @param _layerService - Concreate implementation of a {@link LayerService}.
     * @param _mapService - Concreate implementation of a {@link MapService}.
     * @param _zone - Concreate implementation of a {@link NgZone} service.
     * @memberof MapPolylineLayerDirective
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
        this._polylines = new Array();
        this._polylinesLast = new Array();
        /**
         * Set the maximum zoom at which the polyline labels are visible. Ignored if ShowLabel is false.
         * @memberof MapPolylineLayerDirective
         */
        this.LabelMaxZoom = Number.MAX_SAFE_INTEGER;
        /**
         * Set the minimum zoom at which the polyline labels are visible. Ignored if ShowLabel is false.
         * @memberof MapPolylineLayerDirective
         */
        this.LabelMinZoom = -1;
        /**
         * Gets or sets An offset applied to the positioning of the layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.LayerOffset = null;
        /**
         * Whether to show the polylines titles as the labels on the polylines.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.ShowLabels = false;
        /**
         * Whether to show the titles of the polylines as the tooltips on the polylines.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.ShowTooltips = true;
        /**
         * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.ZIndex = 0;
        ///
        /// Delegates
        ///
        /**
         * This event emitter gets emitted when the user clicks a polyline in the layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.PolylineClick = new EventEmitter();
        /**
         * This event is fired when the DOM dblclick event is fired on a polyline in the layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.PolylineDblClick = new EventEmitter();
        /**
         * This event is fired when the DOM mousemove event is fired on a polyline in the layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.PolylineMouseMove = new EventEmitter();
        /**
         * This event is fired on mouseout on a polyline in the layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.PolylineMouseOut = new EventEmitter();
        /**
         * This event is fired on mouseover on a polyline in a layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.PolylineMouseOver = new EventEmitter();
        this._id = layerId++;
    }
    /**
     * An array of polyline options representing the polylines in the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    get PolylineOptions() { return this._polylines; }
    set PolylineOptions(val) {
        if (this._streaming) {
            this._polylinesLast.push(...val.slice(0));
            this._polylines.push(...val);
        }
        else {
            this._polylines = val.slice(0);
        }
    }
    /**
     * Sets whether to treat changes in the PolylineOptions as streams of new markers. In this mode, changing the
     * Array supplied in PolylineOptions will be incrementally drawn on the map as opposed to replace the polylines on the map.
     *
     * @memberof MapPolylineLayerDirective
     */
    get TreatNewPolylineOptionsAsStream() { return this._streaming; }
    set TreatNewPolylineOptionsAsStream(val) { this._streaming = val; }
    ///
    /// Property declarations
    ///
    /**
     * Gets the id of the polyline layer.
     *
     * @readonly
     * @memberof MapPolylineLayerDirective
     */
    get Id() { return this._id; }
    ///
    /// Public methods
    ///
    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapPolylineLayerDirective
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
                if (this.PolylineOptions) {
                    this._zone.runOutsideAngular(() => this.UpdatePolylines());
                }
            });
            this._service = this._layerService;
        });
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof MapPolylineLayerDirective
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
     * @memberof MapPolylineLayerDirective
     */
    ngOnChanges(changes) {
        if (changes['PolylineOptions']) {
            this._zone.runOutsideAngular(() => {
                this.UpdatePolylines();
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
     * Obtains a string representation of the Layer Id.
     * @returns - string representation of the layer id.
     * @memberof MapPolylineLayerDirective
     */
    toString() { return 'MapPolylineLayer-' + this._id.toString(); }
    ///
    /// Private methods
    ///
    /**
     * Adds various event listeners for the polylines.
     *
     * @param p - the polyline for which to add the event.
     *
     * @memberof MapPolylineLayerDirective
     */
    AddEventListeners(p) {
        const handlers = [
            { name: 'click', handler: (ev) => this.PolylineClick.emit({ Polyline: p, Click: ev }) },
            { name: 'dblclick', handler: (ev) => this.PolylineDblClick.emit({ Polyline: p, Click: ev }) },
            { name: 'mousemove', handler: (ev) => this.PolylineMouseMove.emit({ Polyline: p, Click: ev }) },
            { name: 'mouseout', handler: (ev) => this.PolylineMouseOut.emit({ Polyline: p, Click: ev }) },
            { name: 'mouseover', handler: (ev) => this.PolylineMouseOver.emit({ Polyline: p, Click: ev }) }
        ];
        handlers.forEach((obj) => p.AddListener(obj.name, obj.handler));
    }
    /**
     * Draws the polyline labels. Called by the Canvas overlay.
     *
     * @param el - The canvas on which to draw the labels.
     * @memberof MapPolylineLayerDirective
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
            this._tooltipSubscriptions.push(this.PolylineMouseMove.asObservable().subscribe(e => {
                if (this._tooltipVisible) {
                    const loc = this._canvas.GetCoordinatesFromClick(e.Click);
                    this._tooltip.Set('position', loc);
                }
            }));
            this._tooltipSubscriptions.push(this.PolylineMouseOver.asObservable().subscribe(e => {
                if (e.Polyline.Title && e.Polyline.Title.length > 0) {
                    const loc = this._canvas.GetCoordinatesFromClick(e.Click);
                    this._tooltip.Set('text', e.Polyline.Title);
                    this._tooltip.Set('position', loc);
                    if (!this._tooltipVisible) {
                        this._tooltip.Set('hidden', false);
                        this._tooltipVisible = true;
                    }
                }
            }));
            this._tooltipSubscriptions.push(this.PolylineMouseOut.asObservable().subscribe(e => {
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
     * Sets or updates the polyliness based on the polyline options. This will place the polylines on the map
     * and register the associated events.
     *
     * @memberof MapPolylineLayerDirective
     * @method
     */
    UpdatePolylines() {
        if (this._layerPromise == null) {
            return;
        }
        this._layerPromise.then(l => {
            const polylines = this._streaming ? this._polylinesLast.splice(0) : this._polylines;
            if (!this._streaming) {
                this._labels.splice(0);
            }
            // generate the promise for the polylines
            const lp = this._service.CreatePolylines(l.GetOptions().id, polylines);
            // set polylines once promises are fullfilled.
            lp.then(p => {
                const y = new Array();
                p.forEach(poly => {
                    if (Array.isArray(poly)) {
                        let title = '';
                        const centroids = new Array();
                        poly.forEach(x => {
                            y.push(x);
                            this.AddEventListeners(x);
                            centroids.push(x.Centroid);
                            if (x.Title != null && x.Title.length > 0 && title.length === 0) {
                                title = x.Title;
                            }
                        });
                        this._labels.push({ loc: Polyline.GetPolylineCentroid(centroids), title: title });
                    }
                    else {
                        y.push(poly);
                        if (poly.Title != null && poly.Title.length > 0) {
                            this._labels.push({ loc: poly.Centroid, title: poly.Title });
                        }
                        this.AddEventListeners(poly);
                    }
                });
                this._streaming ? l.AddEntities(y) : l.SetEntities(y);
                if (this._canvas) {
                    this._canvas.Redraw(!this._streaming);
                }
            });
        });
    }
}
MapPolylineLayerDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-polyline-layer'
            },] }
];
MapPolylineLayerDirective.ctorParameters = () => [
    { type: LayerService },
    { type: MapService },
    { type: NgZone }
];
MapPolylineLayerDirective.propDecorators = {
    LabelMaxZoom: [{ type: Input }],
    LabelMinZoom: [{ type: Input }],
    LabelOptions: [{ type: Input }],
    LayerOffset: [{ type: Input }],
    PolylineOptions: [{ type: Input }],
    ShowLabels: [{ type: Input }],
    ShowTooltips: [{ type: Input }],
    TreatNewPolylineOptionsAsStream: [{ type: Input }],
    Visible: [{ type: Input }],
    ZIndex: [{ type: Input }],
    PolylineClick: [{ type: Output }],
    PolylineDblClick: [{ type: Output }],
    PolylineMouseMove: [{ type: Output }],
    PolylineMouseOut: [{ type: Output }],
    PolylineMouseOver: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLXBvbHlsaW5lLWxheWVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL2NvbXBvbmVudHMvbWFwLXBvbHlsaW5lLWxheWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxTQUFTLEVBQWdCLEtBQUssRUFBRSxNQUFNLEVBQ3RDLFlBQVksRUFBb0QsTUFBTSxFQUV6RSxNQUFNLGVBQWUsQ0FBQztBQVN2QixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDekQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRXJELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUk5Qzs7R0FFRztBQUNILElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUV0Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBd0JHO0FBSUgsTUFBTSxPQUFPLHlCQUF5QjtJQThKbEMsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7Ozs7OztPQU1HO0lBQ0gsWUFDWSxhQUEyQixFQUMzQixXQUF1QixFQUN2QixLQUFhO1FBRmIsa0JBQWEsR0FBYixhQUFhLENBQWM7UUFDM0IsZ0JBQVcsR0FBWCxXQUFXLENBQVk7UUFDdkIsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQW5LakIsWUFBTyxHQUEwQyxJQUFJLEtBQUssRUFBa0MsQ0FBQztRQUU3RiwwQkFBcUIsR0FBd0IsSUFBSSxLQUFLLEVBQWdCLENBQUM7UUFDdkUsb0JBQWUsR0FBWSxLQUFLLENBQUM7UUFDakMsb0JBQWUsR0FBa0I7WUFDckMsUUFBUSxFQUFFLEVBQUU7WUFDWixVQUFVLEVBQUUsWUFBWTtZQUN4QixZQUFZLEVBQUUsQ0FBQztZQUNmLFdBQVcsRUFBRSxTQUFTO1lBQ3RCLFNBQVMsRUFBRSxTQUFTO1NBQ3ZCLENBQUM7UUFDTSxlQUFVLEdBQVksS0FBSyxDQUFDO1FBQzVCLGVBQVUsR0FBNEIsSUFB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Q0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7b0JBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQUU7WUFDaEUsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7OztZQS9hSixTQUFTLFNBQUM7Z0JBQ1AsUUFBUSxFQUFFLHNCQUFzQjthQUNuQzs7O1lBdkNRLFlBQVk7WUFDWixVQUFVO1lBWmlELE1BQU07OzsyQkErRXJFLEtBQUs7MkJBTUwsS0FBSzsyQkFPTCxLQUFLOzBCQU9MLEtBQUs7OEJBT0wsS0FBSzt5QkFpQkwsS0FBSzsyQkFPTCxLQUFLOzhDQVFMLEtBQUs7c0JBU0wsS0FBSztxQkFPTCxLQUFLOzRCQVdMLE1BQU07K0JBT04sTUFBTTtnQ0FPTixNQUFNOytCQU9OLE1BQU07Z0NBT04sTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgRGlyZWN0aXZlLCBTaW1wbGVDaGFuZ2UsIElucHV0LCBPdXRwdXQsIE9uRGVzdHJveSwgT25DaGFuZ2VzLFxuICAgIEV2ZW50RW1pdHRlciwgQ29udGVudENoaWxkLCBBZnRlckNvbnRlbnRJbml0LCBWaWV3Q29udGFpbmVyUmVmLCBOZ1pvbmUsXG4gICAgU2ltcGxlQ2hhbmdlc1xufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgSVBvaW50IH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pcG9pbnQnO1xuaW1wb3J0IHsgSVNpemUgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lzaXplJztcbmltcG9ydCB7IElMYXRMb25nIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgeyBJUG9seWxpbmVFdmVudCB9IGZyb20gJy4uL2ludGVyZmFjZXMvaXBvbHlsaW5lLWV2ZW50JztcbmltcG9ydCB7IElQb2x5bGluZU9wdGlvbnMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lwb2x5bGluZS1vcHRpb25zJztcbmltcG9ydCB7IElMYXllck9wdGlvbnMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lsYXllci1vcHRpb25zJztcbmltcG9ydCB7IElMYWJlbE9wdGlvbnMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lsYWJlbC1vcHRpb25zJztcbmltcG9ydCB7IExheWVyU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL2xheWVyLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWFwU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL21hcC5zZXJ2aWNlJztcbmltcG9ydCB7IExheWVyIH0gZnJvbSAnLi4vbW9kZWxzL2xheWVyJztcbmltcG9ydCB7IFBvbHlsaW5lIH0gZnJvbSAnLi4vbW9kZWxzL3BvbHlsaW5lJztcbmltcG9ydCB7IE1hcExhYmVsIH0gZnJvbSAnLi4vbW9kZWxzL21hcC1sYWJlbCc7XG5pbXBvcnQgeyBDYW52YXNPdmVybGF5IH0gZnJvbSAnLi4vbW9kZWxzL2NhbnZhcy1vdmVybGF5JztcblxuLyoqXG4gKiBpbnRlcm5hbCBjb3VudGVyIHRvIHVzZSBhcyBpZHMgZm9yIHBvbHlsaW5lcy5cbiAqL1xubGV0IGxheWVySWQgPSAxMDAwMDAwO1xuXG4vKipcbiAqIE1hcFBvbHlsaW5lTGF5ZXJEaXJlY3RpdmUgcGVyZm9ybWFudGx5IHJlbmRlcnMgYSBsYXJnZSBzZXQgb2YgcG9seWxpbmUgb24gYSB7QGxpbmsgTWFwQ29tcG9uZW50fS5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICogaW1wb3J0IHtNYXBDb21wb25lbnR9IGZyb20gJy4uLic7XG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgc2VsZWN0b3I6ICdteS1tYXAtY21wJyxcbiAqICBzdHlsZXM6IFtgXG4gKiAgIC5tYXAtY29udGFpbmVyIHtcbiAqICAgICBoZWlnaHQ6IDMwMHB4O1xuICogICB9XG4gKiBgXSxcbiAqIHRlbXBsYXRlOiBgXG4gKiAgIDx4LW1hcCBbTGF0aXR1ZGVdPVwibGF0XCIgW0xvbmdpdHVkZV09XCJsbmdcIiBbWm9vbV09XCJ6b29tXCI+XG4gKiAgICAgIDx4LW1hcC1wb2x5bGluZS1sYXllciBbUG9seWdvbk9wdGlvbnNdPVwiX3BvbHlsaW5lXCI+PC94LW1hcC1wb2x5bGluZS1sYXllcj5cbiAqICAgPC94LW1hcD5cbiAqIGBcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAZXhwb3J0XG4gKi9cbkBEaXJlY3RpdmUoe1xuICAgIHNlbGVjdG9yOiAneC1tYXAtcG9seWxpbmUtbGF5ZXInXG59KVxuZXhwb3J0IGNsYXNzIE1hcFBvbHlsaW5lTGF5ZXJEaXJlY3RpdmUgaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uQ2hhbmdlcywgQWZ0ZXJDb250ZW50SW5pdCB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfaWQ6IG51bWJlcjtcbiAgICBwcml2YXRlIF9sYXllclByb21pc2U6IFByb21pc2U8TGF5ZXI+O1xuICAgIHByaXZhdGUgX3NlcnZpY2U6IExheWVyU2VydmljZTtcbiAgICBwcml2YXRlIF9jYW52YXM6IENhbnZhc092ZXJsYXk7XG4gICAgcHJpdmF0ZSBfbGFiZWxzOiBBcnJheTx7bG9jOiBJTGF0TG9uZywgdGl0bGU6IHN0cmluZ30+ID0gbmV3IEFycmF5PHtsb2M6IElMYXRMb25nLCB0aXRsZTogc3RyaW5nfT4oKTtcbiAgICBwcml2YXRlIF90b29sdGlwOiBNYXBMYWJlbDtcbiAgICBwcml2YXRlIF90b29sdGlwU3Vic2NyaXB0aW9uczogQXJyYXk8U3Vic2NyaXB0aW9uPiA9IG5ldyBBcnJheTxTdWJzY3JpcHRpb24+KCk7XG4gICAgcHJpdmF0ZSBfdG9vbHRpcFZpc2libGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcml2YXRlIF9kZWZhdWx0T3B0aW9uczogSUxhYmVsT3B0aW9ucyA9IHtcbiAgICAgICAgZm9udFNpemU6IDExLFxuICAgICAgICBmb250RmFtaWx5OiAnc2Fucy1zZXJpZicsXG4gICAgICAgIHN0cm9rZVdlaWdodDogMixcbiAgICAgICAgc3Ryb2tlQ29sb3I6ICcjMDAwMDAwJyxcbiAgICAgICAgZm9udENvbG9yOiAnI2ZmZmZmZidcbiAgICB9O1xuICAgIHByaXZhdGUgX3N0cmVhbWluZzogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByaXZhdGUgX3BvbHlsaW5lczogQXJyYXk8SVBvbHlsaW5lT3B0aW9ucz4gPSBuZXcgQXJyYXk8SVBvbHlsaW5lT3B0aW9ucz4oKTtcbiAgICBwcml2YXRlIF9wb2x5bGluZXNMYXN0OiBBcnJheTxJUG9seWxpbmVPcHRpb25zPiA9IG5ldyBBcnJheTxJUG9seWxpbmVPcHRpb25zPigpO1xuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBtYXhpbXVtIHpvb20gYXQgd2hpY2ggdGhlIHBvbHlsaW5lIGxhYmVscyBhcmUgdmlzaWJsZS4gSWdub3JlZCBpZiBTaG93TGFiZWwgaXMgZmFsc2UuXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgTGFiZWxNYXhab29tOiBudW1iZXIgPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUjtcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgbWluaW11bSB6b29tIGF0IHdoaWNoIHRoZSBwb2x5bGluZSBsYWJlbHMgYXJlIHZpc2libGUuIElnbm9yZWQgaWYgU2hvd0xhYmVsIGlzIGZhbHNlLlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIExhYmVsTWluWm9vbTogbnVtYmVyID0gLTE7XG5cbiAgICAvKipcbiAgICAgKiBTZXBjaWZpZXMgc3R5bGVpbmcgb3B0aW9ucyBmb3Igb24tbWFwIHBvbHlsaW5lIGxhYmVscy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIExhYmVsT3B0aW9uczogSUxhYmVsT3B0aW9ucztcblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyBBbiBvZmZzZXQgYXBwbGllZCB0byB0aGUgcG9zaXRpb25pbmcgb2YgdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgTGF5ZXJPZmZzZXQ6IElQb2ludCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBBbiBhcnJheSBvZiBwb2x5bGluZSBvcHRpb25zIHJlcHJlc2VudGluZyB0aGUgcG9seWxpbmVzIGluIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KClcbiAgICAgICAgcHVibGljIGdldCBQb2x5bGluZU9wdGlvbnMoKTogQXJyYXk8SVBvbHlsaW5lT3B0aW9ucz4geyByZXR1cm4gdGhpcy5fcG9seWxpbmVzOyB9XG4gICAgICAgIHB1YmxpYyBzZXQgUG9seWxpbmVPcHRpb25zKHZhbDogQXJyYXk8SVBvbHlsaW5lT3B0aW9ucz4pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zdHJlYW1pbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wb2x5bGluZXNMYXN0LnB1c2goLi4udmFsLnNsaWNlKDApKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wb2x5bGluZXMucHVzaCguLi52YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcG9seWxpbmVzID0gdmFsLnNsaWNlKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRvIHNob3cgdGhlIHBvbHlsaW5lcyB0aXRsZXMgYXMgdGhlIGxhYmVscyBvbiB0aGUgcG9seWxpbmVzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgU2hvd0xhYmVsczogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogV2hldGhlciB0byBzaG93IHRoZSB0aXRsZXMgb2YgdGhlIHBvbHlsaW5lcyBhcyB0aGUgdG9vbHRpcHMgb24gdGhlIHBvbHlsaW5lcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFNob3dUb29sdGlwczogYm9vbGVhbiA9IHRydWU7XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHdoZXRoZXIgdG8gdHJlYXQgY2hhbmdlcyBpbiB0aGUgUG9seWxpbmVPcHRpb25zIGFzIHN0cmVhbXMgb2YgbmV3IG1hcmtlcnMuIEluIHRoaXMgbW9kZSwgY2hhbmdpbmcgdGhlXG4gICAgICogQXJyYXkgc3VwcGxpZWQgaW4gUG9seWxpbmVPcHRpb25zIHdpbGwgYmUgaW5jcmVtZW50YWxseSBkcmF3biBvbiB0aGUgbWFwIGFzIG9wcG9zZWQgdG8gcmVwbGFjZSB0aGUgcG9seWxpbmVzIG9uIHRoZSBtYXAuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgICAgIHB1YmxpYyBnZXQgVHJlYXROZXdQb2x5bGluZU9wdGlvbnNBc1N0cmVhbSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX3N0cmVhbWluZzsgfVxuICAgICAgICBwdWJsaWMgc2V0IFRyZWF0TmV3UG9seWxpbmVPcHRpb25zQXNTdHJlYW0odmFsOiBib29sZWFuKSB7IHRoaXMuX3N0cmVhbWluZyA9IHZhbDsgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgdmlzaWJpbGl0eSBvZiB0aGUgbWFya2VyIGxheWVyXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBWaXNpYmxlOiBib29sZWFuO1xuXG4gICAgLyoqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSB6LWluZGV4IG9mIHRoZSBsYXllci4gSWYgbm90IHVzZWQsIGxheWVycyBnZXQgc3RhY2tlZCBpbiB0aGUgb3JkZXIgY3JlYXRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFpJbmRleDogbnVtYmVyID0gMDtcblxuICAgIC8vL1xuICAgIC8vLyBEZWxlZ2F0ZXNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIFRoaXMgZXZlbnQgZW1pdHRlciBnZXRzIGVtaXR0ZWQgd2hlbiB0aGUgdXNlciBjbGlja3MgYSBwb2x5bGluZSBpbiB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBPdXRwdXQoKSBwdWJsaWMgUG9seWxpbmVDbGljazogRXZlbnRFbWl0dGVyPElQb2x5bGluZUV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SVBvbHlsaW5lRXZlbnQ+KCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGV2ZW50IGlzIGZpcmVkIHdoZW4gdGhlIERPTSBkYmxjbGljayBldmVudCBpcyBmaXJlZCBvbiBhIHBvbHlsaW5lIGluIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIFBvbHlsaW5lRGJsQ2xpY2s6IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5bGluZUV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCB3aGVuIHRoZSBET00gbW91c2Vtb3ZlIGV2ZW50IGlzIGZpcmVkIG9uIGEgcG9seWxpbmUgaW4gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgUG9seWxpbmVNb3VzZU1vdmU6IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5bGluZUV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCBvbiBtb3VzZW91dCBvbiBhIHBvbHlsaW5lIGluIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIFBvbHlsaW5lTW91c2VPdXQ6IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5bGluZUV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCBvbiBtb3VzZW92ZXIgb24gYSBwb2x5bGluZSBpbiBhIGxheWVyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgUG9seWxpbmVNb3VzZU92ZXI6IEV2ZW50RW1pdHRlcjxJUG9seWxpbmVFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyPElQb2x5bGluZUV2ZW50PigpO1xuXG5cblxuICAgIC8vL1xuICAgIC8vLyBQcm9wZXJ0eSBkZWNsYXJhdGlvbnNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGlkIG9mIHRoZSBwb2x5bGluZSBsYXllci5cbiAgICAgKlxuICAgICAqIEByZWFkb25seVxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHVibGljIGdldCBJZCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5faWQ7IH1cblxuICAgIC8vL1xuICAgIC8vLyBDb25zdHJ1Y3RvclxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlLlxuICAgICAqIEBwYXJhbSBfbGF5ZXJTZXJ2aWNlIC0gQ29uY3JlYXRlIGltcGxlbWVudGF0aW9uIG9mIGEge0BsaW5rIExheWVyU2VydmljZX0uXG4gICAgICogQHBhcmFtIF9tYXBTZXJ2aWNlIC0gQ29uY3JlYXRlIGltcGxlbWVudGF0aW9uIG9mIGEge0BsaW5rIE1hcFNlcnZpY2V9LlxuICAgICAqIEBwYXJhbSBfem9uZSAtIENvbmNyZWF0ZSBpbXBsZW1lbnRhdGlvbiBvZiBhIHtAbGluayBOZ1pvbmV9IHNlcnZpY2UuXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSBfbGF5ZXJTZXJ2aWNlOiBMYXllclNlcnZpY2UsXG4gICAgICAgIHByaXZhdGUgX21hcFNlcnZpY2U6IE1hcFNlcnZpY2UsXG4gICAgICAgIHByaXZhdGUgX3pvbmU6IE5nWm9uZSkge1xuICAgICAgICB0aGlzLl9pZCA9IGxheWVySWQrKztcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHVibGljIG1ldGhvZHNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBhZnRlciBDb21wb25lbnQgY29udGVudCBpbml0aWFsaXphdGlvbi4gUGFydCBvZiBuZyBDb21wb25lbnQgbGlmZSBjeWNsZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHVibGljIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICAgICAgY29uc3QgbGF5ZXJPcHRpb25zOiBJTGF5ZXJPcHRpb25zID0ge1xuICAgICAgICAgICAgaWQ6IHRoaXMuX2lkXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmFrZUxheWVyRGlyZWN0aXZlOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgSWQgOiB0aGlzLl9pZCxcbiAgICAgICAgICAgICAgICBWaXNpYmxlOiB0aGlzLlZpc2libGUsXG4gICAgICAgICAgICAgICAgTGF5ZXJPZmZzZXQ6IHRoaXMuTGF5ZXJPZmZzZXQsXG4gICAgICAgICAgICAgICAgWkluZGV4OiB0aGlzLlpJbmRleFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX2xheWVyU2VydmljZS5BZGRMYXllcihmYWtlTGF5ZXJEaXJlY3RpdmUpO1xuICAgICAgICAgICAgdGhpcy5fbGF5ZXJQcm9taXNlID0gdGhpcy5fbGF5ZXJTZXJ2aWNlLkdldE5hdGl2ZUxheWVyKGZha2VMYXllckRpcmVjdGl2ZSk7XG5cbiAgICAgICAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGF5ZXJQcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXBTZXJ2aWNlLkNyZWF0ZUNhbnZhc092ZXJsYXkoZWwgPT4gdGhpcy5EcmF3TGFiZWxzKGVsKSlcbiAgICAgICAgICAgICAgICBdKS50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlc1swXS5TZXRWaXNpYmxlKHRoaXMuVmlzaWJsZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NhbnZhcyA9IHZhbHVlc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FudmFzLl9jYW52YXNSZWFkeS50aGVuKGIgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdG9vbHRpcCA9IHRoaXMuX2NhbnZhcy5HZXRUb29sVGlwT3ZlcmxheSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5NYW5hZ2VUb29sdGlwKHRoaXMuU2hvd1Rvb2x0aXBzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLlBvbHlsaW5lT3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB0aGlzLlVwZGF0ZVBvbHlsaW5lcygpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fc2VydmljZSA9IHRoaXMuX2xheWVyU2VydmljZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIG9uIGNvbXBvbmVudCBkZXN0cnVjdGlvbi4gRnJlZXMgdGhlIHJlc291cmNlcyB1c2VkIGJ5IHRoZSBjb21wb25lbnQuIFBhcnQgb2YgdGhlIG5nIENvbXBvbmVudCBsaWZlIGN5Y2xlLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgbmdPbkRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMuX3Rvb2x0aXBTdWJzY3JpcHRpb25zLmZvckVhY2gocyA9PiBzLnVuc3Vic2NyaWJlKCkpO1xuICAgICAgICB0aGlzLl9sYXllclByb21pc2UudGhlbihsID0+IHtcbiAgICAgICAgICAgIGwuRGVsZXRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5fY2FudmFzKSB7IHRoaXMuX2NhbnZhcy5EZWxldGUoKTsgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlYWN0cyB0byBjaGFuZ2VzIGluIGRhdGEtYm91bmQgcHJvcGVydGllcyBvZiB0aGUgY29tcG9uZW50IGFuZCBhY3R1YXRlcyBwcm9wZXJ0eSBjaGFuZ2VzIGluIHRoZSB1bmRlcmxpbmcgbGF5ZXIgbW9kZWwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhbmdlcyAtIGNvbGxlY3Rpb24gb2YgY2hhbmdlcy5cbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHB1YmxpYyBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiB7IFtrZXk6IHN0cmluZ106IFNpbXBsZUNoYW5nZSB9KSB7XG4gICAgICAgIGlmIChjaGFuZ2VzWydQb2x5bGluZU9wdGlvbnMnXSkge1xuICAgICAgICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5VcGRhdGVQb2x5bGluZXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydWaXNpYmxlJ10gJiYgIWNoYW5nZXNbJ1Zpc2libGUnXS5maXJzdENoYW5nZSkge1xuICAgICAgICAgICAgdGhpcy5fbGF5ZXJQcm9taXNlLnRoZW4obCA9PiBsLlNldFZpc2libGUodGhpcy5WaXNpYmxlKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChjaGFuZ2VzWydaSW5kZXgnXSAmJiAhY2hhbmdlc1snWkluZGV4J10uZmlyc3RDaGFuZ2UpIHx8XG4gICAgICAgICAgICAoY2hhbmdlc1snTGF5ZXJPZmZzZXQnXSAmJiAhY2hhbmdlc1snTGF5ZXJPZmZzZXQnXS5maXJzdENoYW5nZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyAobmV3IEVycm9yKCdZb3UgY2Fubm90IGNoYW5nZSBaSW5kZXggb3IgTGF5ZXJPZmZzZXQgYWZ0ZXIgdGhlIGxheWVyIGhhcyBiZWVuIGNyZWF0ZWQuJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoY2hhbmdlc1snU2hvd0xhYmVscyddICYmICFjaGFuZ2VzWydTaG93TGFiZWxzJ10uZmlyc3RDaGFuZ2UpIHx8XG4gICAgICAgICAgICAoY2hhbmdlc1snTGFiZWxNaW5ab29tJ10gJiYgIWNoYW5nZXNbJ0xhYmVsTWluWm9vbSddLmZpcnN0Q2hhbmdlKSB8fFxuICAgICAgICAgICAgKGNoYW5nZXNbJ0xhYmVsTWF4Wm9vbSddICYmICFjaGFuZ2VzWydMYWJlbE1heFpvb20nXS5maXJzdENoYW5nZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fY2FudmFzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2FudmFzLlJlZHJhdyh0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlc1snU2hvd1Rvb2x0aXBzJ10gJiYgdGhpcy5fdG9vbHRpcCkge1xuICAgICAgICAgICAgdGhpcy5NYW5hZ2VUb29sdGlwKGNoYW5nZXNbJ1Nob3dUb29sdGlwcyddLmN1cnJlbnRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPYnRhaW5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBMYXllciBJZC5cbiAgICAgKiBAcmV0dXJucyAtIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbGF5ZXIgaWQuXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuICdNYXBQb2x5bGluZUxheWVyLScgKyB0aGlzLl9pZC50b1N0cmluZygpOyB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHJpdmF0ZSBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBBZGRzIHZhcmlvdXMgZXZlbnQgbGlzdGVuZXJzIGZvciB0aGUgcG9seWxpbmVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHAgLSB0aGUgcG9seWxpbmUgZm9yIHdoaWNoIHRvIGFkZCB0aGUgZXZlbnQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHByaXZhdGUgQWRkRXZlbnRMaXN0ZW5lcnMocDogUG9seWxpbmUpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaGFuZGxlcnMgPSBbXG4gICAgICAgICAgICB7IG5hbWU6ICdjbGljaycsIGhhbmRsZXI6IChldjogTW91c2VFdmVudCkgPT4gdGhpcy5Qb2x5bGluZUNsaWNrLmVtaXQoe1BvbHlsaW5lOiBwLCBDbGljazogZXZ9KSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZGJsY2xpY2snLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuUG9seWxpbmVEYmxDbGljay5lbWl0KHtQb2x5bGluZTogcCwgQ2xpY2s6IGV2fSkgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ21vdXNlbW92ZScsIGhhbmRsZXI6IChldjogTW91c2VFdmVudCkgPT4gdGhpcy5Qb2x5bGluZU1vdXNlTW92ZS5lbWl0KHtQb2x5bGluZTogcCwgQ2xpY2s6IGV2fSkgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ21vdXNlb3V0JywgaGFuZGxlcjogKGV2OiBNb3VzZUV2ZW50KSA9PiB0aGlzLlBvbHlsaW5lTW91c2VPdXQuZW1pdCh7UG9seWxpbmU6IHAsIENsaWNrOiBldn0pIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdtb3VzZW92ZXInLCBoYW5kbGVyOiAoZXY6IE1vdXNlRXZlbnQpID0+IHRoaXMuUG9seWxpbmVNb3VzZU92ZXIuZW1pdCh7UG9seWxpbmU6IHAsIENsaWNrOiBldn0pIH1cbiAgICAgICAgXTtcbiAgICAgICAgaGFuZGxlcnMuZm9yRWFjaCgob2JqKSA9PiBwLkFkZExpc3RlbmVyKG9iai5uYW1lLCBvYmouaGFuZGxlcikpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERyYXdzIHRoZSBwb2x5bGluZSBsYWJlbHMuIENhbGxlZCBieSB0aGUgQ2FudmFzIG92ZXJsYXkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZWwgLSBUaGUgY2FudmFzIG9uIHdoaWNoIHRvIGRyYXcgdGhlIGxhYmVscy5cbiAgICAgKiBAbWVtYmVyb2YgTWFwUG9seWxpbmVMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHByaXZhdGUgRHJhd0xhYmVscyhlbDogSFRNTENhbnZhc0VsZW1lbnQpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuU2hvd0xhYmVscykge1xuICAgICAgICAgICAgdGhpcy5fbWFwU2VydmljZS5HZXRab29tKCkudGhlbih6ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5MYWJlbE1pblpvb20gPD0geiAmJiB0aGlzLkxhYmVsTWF4Wm9vbSA+PSB6KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEID0gZWwuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGFiZWxzID0gdGhpcy5fbGFiZWxzLm1hcCh4ID0+IHgudGl0bGUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXBTZXJ2aWNlLkxvY2F0aW9uc1RvUG9pbnRzKHRoaXMuX2xhYmVscy5tYXAoeCA9PiB4LmxvYykpLnRoZW4obG9jcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzaXplOiBJU2l6ZSA9IHRoaXMuX21hcFNlcnZpY2UuTWFwU2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBsb2NzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgZHJhdyB0aGUgcG9pbnQgaWYgaXQgaXMgbm90IGluIHZpZXcuIFRoaXMgZ3JlYXRseSBpbXByb3ZlcyBwZXJmb3JtYW5jZSB3aGVuIHpvb21lZCBpbi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9jc1tpXS54ID49IDAgJiYgbG9jc1tpXS55ID49IDAgJiYgbG9jc1tpXS54IDw9IHNpemUud2lkdGggJiYgbG9jc1tpXS55IDw9IHNpemUuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuRHJhd1RleHQoY3R4LCBsb2NzW2ldLCBsYWJlbHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEcmF3cyB0aGUgbGFiZWwgdGV4dCBhdCB0aGUgYXBwcm9wcmlhdGUgcGxhY2Ugb24gdGhlIGNhbnZhcy5cbiAgICAgKiBAcGFyYW0gY3R4IC0gQ2FudmFzIGRyYXdpbmcgY29udGV4dC5cbiAgICAgKiBAcGFyYW0gbG9jIC0gUGl4ZWwgbG9jYXRpb24gb24gdGhlIGNhbnZhcyB3aGVyZSB0byBjZW50ZXIgdGhlIHRleHQuXG4gICAgICogQHBhcmFtIHRleHQgLSBUZXh0IHRvIGRyYXcuXG4gICAgICovXG4gICAgcHJpdmF0ZSBEcmF3VGV4dChjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCwgbG9jOiBJUG9pbnQsIHRleHQ6IHN0cmluZykge1xuICAgICAgICBsZXQgbG86IElMYWJlbE9wdGlvbnMgPSB0aGlzLkxhYmVsT3B0aW9ucztcbiAgICAgICAgaWYgKGxvID09IG51bGwgJiYgdGhpcy5fdG9vbHRpcCkgeyBsbyA9IHRoaXMuX3Rvb2x0aXAuRGVmYXVsdExhYmVsU3R5bGU7IH1cbiAgICAgICAgaWYgKGxvID09IG51bGwpIHsgbG8gPSB0aGlzLl9kZWZhdWx0T3B0aW9uczsgfVxuXG4gICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGxvLnN0cm9rZUNvbG9yO1xuICAgICAgICBjdHguZm9udCA9IGAke2xvLmZvbnRTaXplfXB4ICR7bG8uZm9udEZhbWlseX1gO1xuICAgICAgICBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XG4gICAgICAgIGNvbnN0IHN0cm9rZVdlaWdodDogbnVtYmVyID0gbG8uc3Ryb2tlV2VpZ2h0O1xuICAgICAgICBpZiAodGV4dCAmJiBzdHJva2VXZWlnaHQgJiYgc3Ryb2tlV2VpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBzdHJva2VXZWlnaHQ7XG4gICAgICAgICAgICAgICAgY3R4LnN0cm9rZVRleHQodGV4dCwgbG9jLngsIGxvYy55KTtcbiAgICAgICAgfVxuICAgICAgICBjdHguZmlsbFN0eWxlID0gbG8uZm9udENvbG9yO1xuICAgICAgICBjdHguZmlsbFRleHQodGV4dCwgbG9jLngsIGxvYy55KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNYW5hZ2VzIHRoZSB0b29sdGlwIGFuZCB0aGUgYXR0YWNobWVudCBvZiB0aGUgYXNzb2NpYXRlZCBldmVudHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2hvdyAtIFRydWUgdG8gZW5hYmxlIHRoZSB0b29sdGlwLCBmYWxzZSB0byBkaXNhYmxlLlxuICAgICAqIEBtZW1iZXJvZiBNYXBQb2x5Z29uTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwcml2YXRlIE1hbmFnZVRvb2x0aXAoc2hvdzogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBpZiAoc2hvdyAmJiB0aGlzLl9jYW52YXMpIHtcbiAgICAgICAgICAgIC8vIGFkZCB0b29sdGlwIHN1YnNjcmlwdGlvbnNcbiAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAuU2V0KCdoaWRkZW4nLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXBWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl90b29sdGlwU3Vic2NyaXB0aW9ucy5wdXNoKHRoaXMuUG9seWxpbmVNb3VzZU1vdmUuYXNPYnNlcnZhYmxlKCkuc3Vic2NyaWJlKGUgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl90b29sdGlwVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2M6IElMYXRMb25nID0gdGhpcy5fY2FudmFzLkdldENvb3JkaW5hdGVzRnJvbUNsaWNrKGUuQ2xpY2spO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwLlNldCgncG9zaXRpb24nLCBsb2MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXBTdWJzY3JpcHRpb25zLnB1c2godGhpcy5Qb2x5bGluZU1vdXNlT3Zlci5hc09ic2VydmFibGUoKS5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGUuUG9seWxpbmUuVGl0bGUgJiYgZS5Qb2x5bGluZS5UaXRsZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvYzogSUxhdExvbmcgPSB0aGlzLl9jYW52YXMuR2V0Q29vcmRpbmF0ZXNGcm9tQ2xpY2soZS5DbGljayk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAuU2V0KCd0ZXh0JywgZS5Qb2x5bGluZS5UaXRsZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAuU2V0KCdwb3NpdGlvbicsIGxvYyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fdG9vbHRpcFZpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAuU2V0KCdoaWRkZW4nLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwVmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB0aGlzLl90b29sdGlwU3Vic2NyaXB0aW9ucy5wdXNoKHRoaXMuUG9seWxpbmVNb3VzZU91dC5hc09ic2VydmFibGUoKS5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3Rvb2x0aXBWaXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAuU2V0KCdoaWRkZW4nLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdG9vbHRpcFZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgdG9vbHRpcCBzdWJzY3JpcHRpb25zXG4gICAgICAgICAgICB0aGlzLl90b29sdGlwU3Vic2NyaXB0aW9ucy5mb3JFYWNoKHMgPT4gcy51bnN1YnNjcmliZSgpKTtcbiAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXBTdWJzY3JpcHRpb25zLnNwbGljZSgwKTtcbiAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAuU2V0KCdoaWRkZW4nLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXBWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIG9yIHVwZGF0ZXMgdGhlIHBvbHlsaW5lc3MgYmFzZWQgb24gdGhlIHBvbHlsaW5lIG9wdGlvbnMuIFRoaXMgd2lsbCBwbGFjZSB0aGUgcG9seWxpbmVzIG9uIHRoZSBtYXBcbiAgICAgKiBhbmQgcmVnaXN0ZXIgdGhlIGFzc29jaWF0ZWQgZXZlbnRzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFBvbHlsaW5lTGF5ZXJEaXJlY3RpdmVcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHJpdmF0ZSBVcGRhdGVQb2x5bGluZXMoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9sYXllclByb21pc2UgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xheWVyUHJvbWlzZS50aGVuKGwgPT4ge1xuICAgICAgICAgICAgY29uc3QgcG9seWxpbmVzOiBBcnJheTxJUG9seWxpbmVPcHRpb25zPiA9IHRoaXMuX3N0cmVhbWluZyA/IHRoaXMuX3BvbHlsaW5lc0xhc3Quc3BsaWNlKDApIDogdGhpcy5fcG9seWxpbmVzO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9zdHJlYW1pbmcpIHsgdGhpcy5fbGFiZWxzLnNwbGljZSgwKTsgfVxuXG4gICAgICAgICAgICAvLyBnZW5lcmF0ZSB0aGUgcHJvbWlzZSBmb3IgdGhlIHBvbHlsaW5lc1xuICAgICAgICAgICAgY29uc3QgbHA6IFByb21pc2U8QXJyYXk8UG9seWxpbmV8QXJyYXk8UG9seWxpbmU+Pj4gPSB0aGlzLl9zZXJ2aWNlLkNyZWF0ZVBvbHlsaW5lcyhsLkdldE9wdGlvbnMoKS5pZCwgcG9seWxpbmVzKTtcblxuICAgICAgICAgICAgLy8gc2V0IHBvbHlsaW5lcyBvbmNlIHByb21pc2VzIGFyZSBmdWxsZmlsbGVkLlxuICAgICAgICAgICAgbHAudGhlbihwID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB5OiBBcnJheTxQb2x5bGluZT4gPSBuZXcgQXJyYXk8UG9seWxpbmU+KCk7XG4gICAgICAgICAgICAgICAgcC5mb3JFYWNoKHBvbHkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwb2x5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRpdGxlOiBzdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRyb2lkczogQXJyYXk8SUxhdExvbmc+ID0gbmV3IEFycmF5PElMYXRMb25nPigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9seS5mb3JFYWNoKHggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkucHVzaCh4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkFkZEV2ZW50TGlzdGVuZXJzKHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRyb2lkcy5wdXNoKHguQ2VudHJvaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh4LlRpdGxlICE9IG51bGwgJiYgeC5UaXRsZS5sZW5ndGggPiAwICYmIHRpdGxlLmxlbmd0aCA9PT0gMCkgeyB0aXRsZSA9IHguVGl0bGU7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFiZWxzLnB1c2goe2xvYzogUG9seWxpbmUuR2V0UG9seWxpbmVDZW50cm9pZChjZW50cm9pZHMpLCB0aXRsZTogdGl0bGV9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkucHVzaChwb2x5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb2x5LlRpdGxlICE9IG51bGwgJiYgcG9seS5UaXRsZS5sZW5ndGggPiAwKSB7IHRoaXMuX2xhYmVscy5wdXNoKHtsb2M6IHBvbHkuQ2VudHJvaWQsIHRpdGxlOiBwb2x5LlRpdGxlfSk7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuQWRkRXZlbnRMaXN0ZW5lcnMocG9seSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdHJlYW1pbmcgPyBsLkFkZEVudGl0aWVzKHkpIDogbC5TZXRFbnRpdGllcyh5KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fY2FudmFzKSB7IHRoaXMuX2NhbnZhcy5SZWRyYXcoIXRoaXMuX3N0cmVhbWluZyk7IH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn1cbiJdfQ==