import { SimpleChange, OnDestroy, OnChanges, EventEmitter, AfterContentInit, NgZone } from '@angular/core';
import { IPoint } from '../interfaces/ipoint';
import { IPolylineEvent } from '../interfaces/ipolyline-event';
import { IPolylineOptions } from '../interfaces/ipolyline-options';
import { ILabelOptions } from '../interfaces/ilabel-options';
import { LayerService } from '../services/layer.service';
import { MapService } from '../services/map.service';
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
export declare class MapPolylineLayerDirective implements OnDestroy, OnChanges, AfterContentInit {
    private _layerService;
    private _mapService;
    private _zone;
    private _id;
    private _layerPromise;
    private _service;
    private _canvas;
    private _labels;
    private _tooltip;
    private _tooltipSubscriptions;
    private _tooltipVisible;
    private _defaultOptions;
    private _streaming;
    private _polylines;
    private _polylinesLast;
    /**
     * Set the maximum zoom at which the polyline labels are visible. Ignored if ShowLabel is false.
     * @memberof MapPolylineLayerDirective
     */
    LabelMaxZoom: number;
    /**
     * Set the minimum zoom at which the polyline labels are visible. Ignored if ShowLabel is false.
     * @memberof MapPolylineLayerDirective
     */
    LabelMinZoom: number;
    /**
     * Sepcifies styleing options for on-map polyline labels.
     *
     * @memberof MapPolylineLayerDirective
     */
    LabelOptions: ILabelOptions;
    /**
     * Gets or sets An offset applied to the positioning of the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    LayerOffset: IPoint;
    /**
     * An array of polyline options representing the polylines in the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    get PolylineOptions(): Array<IPolylineOptions>;
    set PolylineOptions(val: Array<IPolylineOptions>);
    /**
     * Whether to show the polylines titles as the labels on the polylines.
     *
     * @memberof MapPolylineLayerDirective
     */
    ShowLabels: boolean;
    /**
     * Whether to show the titles of the polylines as the tooltips on the polylines.
     *
     * @memberof MapPolylineLayerDirective
     */
    ShowTooltips: boolean;
    /**
     * Sets whether to treat changes in the PolylineOptions as streams of new markers. In this mode, changing the
     * Array supplied in PolylineOptions will be incrementally drawn on the map as opposed to replace the polylines on the map.
     *
     * @memberof MapPolylineLayerDirective
     */
    get TreatNewPolylineOptionsAsStream(): boolean;
    set TreatNewPolylineOptionsAsStream(val: boolean);
    /**
     * Sets the visibility of the marker layer
     *
     * @memberof MapPolylineLayerDirective
     */
    Visible: boolean;
    /**
     * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
     *
     * @memberof MapPolylineLayerDirective
     */
    ZIndex: number;
    /**
     * This event emitter gets emitted when the user clicks a polyline in the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    PolylineClick: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired when the DOM dblclick event is fired on a polyline in the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    PolylineDblClick: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired when the DOM mousemove event is fired on a polyline in the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    PolylineMouseMove: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired on mouseout on a polyline in the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    PolylineMouseOut: EventEmitter<IPolylineEvent>;
    /**
     * This event is fired on mouseover on a polyline in a layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    PolylineMouseOver: EventEmitter<IPolylineEvent>;
    /**
     * Gets the id of the polyline layer.
     *
     * @readonly
     * @memberof MapPolylineLayerDirective
     */
    get Id(): number;
    /**
     * Creates an instance of MapPolylineLayerDirective.
     * @param _layerService - Concreate implementation of a {@link LayerService}.
     * @param _mapService - Concreate implementation of a {@link MapService}.
     * @param _zone - Concreate implementation of a {@link NgZone} service.
     * @memberof MapPolylineLayerDirective
     */
    constructor(_layerService: LayerService, _mapService: MapService, _zone: NgZone);
    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapPolylineLayerDirective
     */
    ngAfterContentInit(): void;
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof MapPolylineLayerDirective
     */
    ngOnDestroy(): void;
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     * @memberof MapPolylineLayerDirective
     */
    ngOnChanges(changes: {
        [key: string]: SimpleChange;
    }): void;
    /**
     * Obtains a string representation of the Layer Id.
     * @returns - string representation of the layer id.
     * @memberof MapPolylineLayerDirective
     */
    toString(): string;
    /**
     * Adds various event listeners for the polylines.
     *
     * @param p - the polyline for which to add the event.
     *
     * @memberof MapPolylineLayerDirective
     */
    private AddEventListeners;
    /**
     * Draws the polyline labels. Called by the Canvas overlay.
     *
     * @param el - The canvas on which to draw the labels.
     * @memberof MapPolylineLayerDirective
     */
    private DrawLabels;
    /**
     * Draws the label text at the appropriate place on the canvas.
     * @param ctx - Canvas drawing context.
     * @param loc - Pixel location on the canvas where to center the text.
     * @param text - Text to draw.
     */
    private DrawText;
    /**
     * Manages the tooltip and the attachment of the associated events.
     *
     * @param show - True to enable the tooltip, false to disable.
     * @memberof MapPolygonLayerDirective
     */
    private ManageTooltip;
    /**
     * Sets or updates the polyliness based on the polyline options. This will place the polylines on the map
     * and register the associated events.
     *
     * @memberof MapPolylineLayerDirective
     * @method
     */
    private UpdatePolylines;
}
