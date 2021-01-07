import { NgZone } from '@angular/core';
import { IMarkerOptions } from '../../interfaces/imarker-options';
import { IMarkerIconInfo } from '../../interfaces/imarker-icon-info';
import { Marker } from '../../models/marker';
import { Layer } from '../../models/layer';
import { MapService } from '../map.service';
import { MapLayerDirective } from '../../components/map-layer';
/**
 * This abstract partially implements the contract for the {@link LayerService}
 * and {@link ClusterService} for the Bing Maps V8 archtiecture. It serves
 * as the base class for basic layer ({@link BingLayerService}) and cluster layer ({@link BingClusterLayer}).
 *
 * @export
 * @abstract
 */
export declare abstract class BingLayerBase {
    protected _mapService: MapService;
    protected _zone: NgZone;
    protected _layers: Map<number, Promise<Layer>>;
    /**
     * Creates an instance of BingLayerBase.
     * @param _mapService - Concrete {@link MapService} implementation for Bing Maps V8. An instance of {@link BingMapService}.
     *
     * @memberof BingLayerBase
     */
    constructor(_mapService: MapService, _zone: NgZone);
    /**
     * Adds a layer to the map.
     *
     * @abstract
     * @param layer - MapLayerDirective component object.
     * Generally, MapLayerDirective will be injected with an instance of the
     * LayerService and then self register on initialization.
     *
     * @memberof BingLayerBase
     */
    abstract AddLayer(layer: MapLayerDirective): void;
    /**
     * Creates a marker in the layer.
     *
     * @param layer - The Id of the layer in which to create the marker.
     * @param options - {@link IMarkerOptions} object containing the marker properties.
     * @returns - A promise that when fullfilled contains the {@link Marker} model for the created marker.
     *
     * @memberof BingLayerBase
     */
    CreateMarker(layer: number, options: IMarkerOptions): Promise<Marker>;
    /**
     * Creates an array of unbound markers. Use this method to create arrays of markers to be used in bulk
     * operations.
     *
     * @param options - Marker options defining the markers.
     * @param markerIcon - Optional information to generate custom markers. This will be applied to all markers.
     * @returns - A promise that when fullfilled contains the an arrays of the Marker models.
     *
     * @memberof BingLayerBase
     */
    CreateMarkers(options: Array<IMarkerOptions>, markerIcon?: IMarkerIconInfo): Promise<Array<Marker>>;
    /**
     * Deletes the layer
     *
     * @param layer - MapLayerDirective component object for which to retrieve the layer.
     * @returns - A promise that is fullfilled when the layer has been removed.
     *
     * @memberof BingLayerBase
     */
    DeleteLayer(layer: MapLayerDirective): Promise<void>;
    /**
     * Returns the Layer model represented by this layer.
     *
     * @param layer - MapLayerDirective component object or Layer Id for which to retrieve the layer model.
     * @returns - A promise that when resolved contains the Layer model.
     *
     * @memberof BingLayerBase
     */
    GetNativeLayer(layer: MapLayerDirective | number): Promise<Layer>;
    /**
     * Gets the layer based on its id.
     *
     * @protected
     * @param id - Layer Id.
     * @returns - A promise that when fullfilled contains the {@link Layer} model for the layer.
     *
     * @memberof BingLayerBase
     */
    protected GetLayerById(id: number): Promise<Layer>;
}
