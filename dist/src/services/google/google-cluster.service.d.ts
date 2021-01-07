import { IClusterIconInfo } from '../../interfaces/icluster-icon-info';
import { NgZone } from '@angular/core';
import { IMarkerOptions } from '../../interfaces/imarker-options';
import { Marker } from '../../models/marker';
import { Layer } from '../../models/layer';
import { ClusterLayerDirective } from '../../components/cluster-layer';
import { ClusterService } from '../cluster.service';
import { MapService } from '../map.service';
import { GoogleLayerBase } from './google-layer-base';
import { IPolygonOptions } from '../../interfaces/ipolygon-options';
import { IPolylineOptions } from '../../interfaces/ipolyline-options';
import { Polygon } from '../../models/polygon';
import { Polyline } from '../../models/polyline';
import * as GoogleMapTypes from './google-map-types';
export declare class GoogleClusterService extends GoogleLayerBase implements ClusterService {
    protected _layers: Map<number, Promise<Layer>>;
    protected _layerStyles: Map<number, Array<GoogleMapTypes.ClusterStyle>>;
    /**
     * Creates the cluster icon from the styles
     *
     * @param styles
     * @returns - Promise that when resolved contains an Array of IClusterIconInfo objects
     * containing the hydrated cluster icons.
     * @memberof GoogleClusterService
     */
    static CreateClusterIcons(styles: Array<IClusterIconInfo>): Promise<Array<IClusterIconInfo>>;
    /**
     * Creates an instance of GoogleClusterService.
     * @param _mapService
     * @param _zone
     * @memberof GoogleClusterService
     */
    constructor(_mapService: MapService, _zone: NgZone);
    /**
     * Adds the cluster layer to the map
     *
     * @param layer
     * @memberof GoogleClusterService
     */
    AddLayer(layer: ClusterLayerDirective): void;
    /**
     * Create a marker in the cluster
     *
     * @param layer
     * @param options
     * @memberof GoogleClusterService
     */
    CreateMarker(layer: number, options: IMarkerOptions): Promise<Marker>;
    /**
     * Starts the clustering
     *
     * @param layer
     * @memberof GoogleClusterService
     */
    StartClustering(layer: ClusterLayerDirective): Promise<void>;
    /**
     * Stops the clustering
     *
     * @param layer
     * @memberof GoogleClusterService
     */
    StopClustering(layer: ClusterLayerDirective): Promise<void>;
    /**
     * Adds a polygon to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygon.
     * @returns - A promise that when fullfilled contains the an instance of the Polygon model.
     *
     * @memberof GoogleClusterService
     */
    CreatePolygon(layer: number, options: IPolygonOptions): Promise<Polygon>;
    /**
     * Creates an array of unbound polygons. Use this method to create arrays of polygons to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygons.
     * @returns - A promise that when fullfilled contains the an arrays of the Polygon models.
     *
     * @memberof GoogleClusterService
     */
    CreatePolygons(layer: number, options: Array<IPolygonOptions>): Promise<Array<Polygon>>;
    /**
     * Adds a polyline to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the line.
     * @param options - Polyline options defining the line.
     * @returns - A promise that when fullfilled contains the an instance of the Polyline (or an
     * array of polygons for complex paths) model.
     *
     * @memberof GoogleClusterService
     */
    CreatePolyline(layer: number, options: IPolylineOptions): Promise<Polyline | Array<Polyline>>;
    /**
     * Creates an array of unbound polylines. Use this method to create arrays of polylines to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polylines.
     * @param options - Polyline options defining the polylines.
     * @returns - A promise that when fullfilled contains the an arrays of the Polyline models.
     *
     * @memberof GoogleClusterService
     */
    CreatePolylines(layer: number, options: Array<IPolylineOptions>): Promise<Array<Polyline | Array<Polyline>>>;
}
