import { NgZone } from '@angular/core';
import { IMarkerOptions } from '../../interfaces/imarker-options';
import { IMarkerIconInfo } from '../../interfaces/imarker-icon-info';
import { Marker } from '../../models/marker';
import { Layer } from '../../models/layer';
import { MapService } from '../map.service';
import { MapLayerDirective } from '../../components/map-layer';
/**
 * This abstract partially implements the contract for the {@link LayerService}
 * and {@link ClusterService} for the Google Maps archtiecture. It serves
 * as the base class for basic layer ({@link GoogleLayerService}) and cluster layer ({@link GoogleClusterLayer}).
 *
 * @export
 * @abstract
 */
export declare abstract class GoogleLayerBase {
    protected _mapService: MapService;
    protected _zone: NgZone;
    protected abstract _layers: Map<number, Promise<Layer>>;
    /**
     * Creates an instance of GoogleLayerBase.
     * @param _mapService - Concrete {@link MapService} implementation for Google Maps.
     * An instance of {@link GoogleMapService}.
     * @param _zone - NgZone instance to provide zone aware promises.
     *
     * @memberof GoogleLayerBase
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
     * @memberof GoogleLayerBase
     */
    abstract AddLayer(layer: MapLayerDirective): void;
    /**
     * Deletes the layer
     *
     * @param layer - MapLayerDirective component object for which to retrieve the layer.
     * @returns - A promise that is fullfilled when the layer has been removed.
     *
     * @memberof GoogleLayerBase
     */
    DeleteLayer(layer: MapLayerDirective): Promise<void>;
    /**
     * Returns the Layer model represented by this layer.
     *
     * @param layer - MapLayerDirective component object or layer id for which to retrieve the layer model.
     * @returns - A promise that when resolved contains the Layer model.
     *
     * @memberof GoogleLayerBase
     */
    GetNativeLayer(layer: MapLayerDirective | number): Promise<Layer>;
    /**
     * Creates a marker in the layer.
     *
     * @param layer - The Id of the layer in which to create the marker.
     * @param options - {@link IMarkerOptions} object containing the marker properties.
     * @returns - A promise that when fullfilled contains the {@link Marker} model for the created marker.
     *
     * @memberof GoogleLayerBase
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
     * @memberof GoogleLayerBase
     */
    CreateMarkers(options: Array<IMarkerOptions>, markerIcon?: IMarkerIconInfo): Promise<Array<Marker>>;
    /**
     * Gets the layer based on its id.
     *
     * @protected
     * @param id - Layer Id.
     * @returns - A promise that when fullfilled contains the {@link Layer} model for the layer.
     *
     * @memberof GoogleLayerBase
     */
    protected GetLayerById(id: number): Promise<Layer>;
}
