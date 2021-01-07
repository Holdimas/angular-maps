import { OnInit, OnDestroy, OnChanges, SimpleChange, ViewContainerRef } from '@angular/core';
import { LayerService } from '../services/layer.service';
import { MapMarkerDirective } from './map-marker';
/**
 * MapLayerDirective creates a layer on a {@link MapComponent}.
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
 *   <x-map [Latitude]='lat' [Longitude]='lng' [Zoom]='zoom'>
 *     <x-map-layer [Visible]='visible'>
 *         <x-map-marker [Latitude]='lat' [Longitude]='lng' [Label]=''M''></x-map-marker>
 *     </x-map-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
export declare class MapLayerDirective implements OnInit, OnDestroy, OnChanges {
    protected _layerService: LayerService;
    protected _containerRef: ViewContainerRef;
    protected _visible: boolean;
    protected _addedToManager: boolean;
    protected _id: number;
    protected _markers: Array<MapMarkerDirective>;
    /**
     * Gets or sets the layer visibility.
     *
     * @memberof MapLayerDirective
     */
    get Visible(): boolean;
    set Visible(val: boolean);
    /**
     * Gets the layer id.
     *
     * @readonly
     * @memberof MapLayerDirective
     */
    get Id(): number;
    /**
     * Creates an instance of MapLayerDirective.
     * @param _layerService - Concreted implementation of a layer service for the underlying maps implementations.
     * Generally provided via injections.
     * @param _containerRef - Reference to the container hosting the map canvas. Generally provided via injection.
     *
     * @memberof MapLayerDirective
     */
    constructor(_layerService: LayerService, _containerRef: ViewContainerRef);
    /**
     * Called on Component initialization. Part of ng Component life cycle.
     *
     * @memberof MapLayerDirective
     */
    ngOnInit(): void;
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof MapLayerDirective
     */
    ngOnChanges(changes: {
        [propName: string]: SimpleChange;
    }): void;
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     *
     * @memberof MapLayerDirective
     */
    ngOnDestroy(): void;
}
