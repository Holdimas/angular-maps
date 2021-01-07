import { SimpleChange, OnDestroy, OnChanges, EventEmitter, AfterContentInit, NgZone } from '@angular/core';
import { IPoint } from '../interfaces/ipoint';
import { IPolygonEvent } from '../interfaces/ipolygon-event';
import { IPolygonOptions } from '../interfaces/ipolygon-options';
import { ILabelOptions } from '../interfaces/ilabel-options';
import { LayerService } from '../services/layer.service';
import { MapService } from '../services/map.service';
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
export declare class MapPolygonLayerDirective implements OnDestroy, OnChanges, AfterContentInit {
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
    private _polygons;
    private _polygonsLast;
    /**
     * Set the maximum zoom at which the polygon labels are visible. Ignored if ShowLabel is false.
     * @memberof MapPolygonLayerDirective
     */
    LabelMaxZoom: number;
    /**
     * Set the minimum zoom at which the polygon labels are visible. Ignored if ShowLabel is false.
     * @memberof MapPolygonLayerDirective
     */
    LabelMinZoom: number;
    /**
     * Sepcifies styleing options for on-map polygon labels.
     *
     * @memberof MapPolygonLayerDirective
     */
    LabelOptions: ILabelOptions;
    /**
     * Gets or sets An offset applied to the positioning of the layer.
     *
     * @memberof MapPolygonLayerDirective
     */
    LayerOffset: IPoint;
    /**
     * An array of polygon options representing the polygons in the layer.
     *
     * @memberof MapPolygonLayerDirective
     */
    get PolygonOptions(): Array<IPolygonOptions>;
    set PolygonOptions(val: Array<IPolygonOptions>);
    /**
     * Whether to show the polygon titles as the labels on the polygons.
     *
     * @memberof MapPolygonLayerDirective
     */
    ShowLabels: boolean;
    /**
     * Whether to show the titles of the polygosn as the tooltips on the polygons.
     *
     * @memberof MapPolygonLayerDirective
     */
    ShowTooltips: boolean;
    /**
     * Sets whether to treat changes in the PolygonOptions as streams of new markers. In this mode, changing the
     * Array supplied in PolygonOptions will be incrementally drawn on the map as opposed to replace the polygons on the map.
     *
     * @memberof MapPolygonLayerDirective
     */
    get TreatNewPolygonOptionsAsStream(): boolean;
    set TreatNewPolygonOptionsAsStream(val: boolean);
    /**
     * Sets the visibility of the marker layer
     *
     * @memberof MapPolygonLayerDirective
     */
    Visible: boolean;
    /**
     * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
     *
     * @memberof MapPolygonLayerDirective
     */
    ZIndex: number;
    /**
     * This event emitter gets emitted when the user clicks a polygon in the layer.
     *
     * @memberof MapPolygonLayerDirective
     */
    PolygonClick: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired when the DOM dblclick event is fired on a polygon in the layer.
     *
     * @memberof MapPolygonLayerDirective
     */
    PolygonDblClick: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired when the DOM mousemove event is fired on a polygon in the layer.
     *
     * @memberof MapPolygonLayerDirective
     */
    PolygonMouseMove: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired on mouseout on a polygon in the layer.
     *
     * @memberof MapPolygonLayerDirective
     */
    PolygonMouseOut: EventEmitter<IPolygonEvent>;
    /**
     * This event is fired on mouseover on a polygon in a layer.
     *
     * @memberof MapPolygonLayerDirective
     */
    PolygonMouseOver: EventEmitter<IPolygonEvent>;
    /**
     * Gets the id of the marker layer.
     *
     * @readonly
     * @memberof MapPolygonLayerDirective
     */
    get Id(): number;
    /**
     * Creates an instance of MapPolygonLayerDirective.
     * @param _layerService - Concreate implementation of a {@link LayerService}.
     * @param _mapService - Concreate implementation of a {@link MapService}.
     * @param _zone - Concreate implementation of a {@link NgZone} service.
     * @memberof MapPolygonLayerDirective
     */
    constructor(_layerService: LayerService, _mapService: MapService, _zone: NgZone);
    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapPolygonLayerDirective
     */
    ngAfterContentInit(): void;
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof MapPolygonLayerDirective
     */
    ngOnDestroy(): void;
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     * @memberof MapPolygonLayerDirective
     */
    ngOnChanges(changes: {
        [key: string]: SimpleChange;
    }): void;
    /**
     * Obtains a string representation of the Marker Id.
     * @returns - string representation of the marker id.
     * @memberof MapPolygonLayerDirective
     */
    toString(): string;
    /**
     * Adds various event listeners for the marker.
     *
     * @param p - the polygon for which to add the event.
     *
     * @memberof MapPolygonLayerDirective
     */
    private AddEventListeners;
    /**
     * Draws the polygon labels. Called by the Canvas overlay.
     *
     * @param el - The canvas on which to draw the labels.
     * @memberof MapPolygonLayerDirective
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
     * Sets or updates the polygons based on the polygon options. This will place the polygons on the map
     * and register the associated events.
     *
     * @memberof MapPolygonLayerDirective
     * @method
     */
    private UpdatePolygons;
}
