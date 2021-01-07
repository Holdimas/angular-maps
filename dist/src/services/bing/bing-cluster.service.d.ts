import { NgZone } from '@angular/core';
import { IPolygonOptions } from '../../interfaces/ipolygon-options';
import { IPolylineOptions } from '../../interfaces/ipolyline-options';
import { Polygon } from '../../models/polygon';
import { Polyline } from '../../models/polyline';
import { MapService } from '../map.service';
import { ClusterLayerDirective } from '../../components/cluster-layer';
import { ClusterService } from '../cluster.service';
import { BingLayerBase } from './bing-layer-base';
/**
 * Implements the {@link ClusterService} contract for a  Bing Maps V8 specific implementation.
 *
 * @export
 */
export declare class BingClusterService extends BingLayerBase implements ClusterService {
    /**
     * Creates an instance of BingClusterService.
     * @param _mapService - Concrete {@link MapService} implementation for Bing Maps V8. An instance of {@link BingMapService}.
     * @param _zone - NgZone instance to provide zone aware promises.
     *
     * @memberof BingClusterService
     */
    constructor(_mapService: MapService, _zone: NgZone);
    /**
     * Adds a layer to the map.
     *
     * @abstract
     * @param layer - ClusterLayerDirective component object.
     * Generally, MapLayer will be injected with an instance of the
     * LayerService and then self register on initialization.
     *
     * @memberof BingClusterService
     */
    AddLayer(layer: ClusterLayerDirective): void;
    /**
     * Adds a polygon to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygon.
     * @returns - A promise that when fullfilled contains the an instance of the Polygon model.
     *
     * @memberof BingClusterService
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
     * @memberof BingClusterService
     */
    CreatePolygons(layer: number, options: Array<IPolygonOptions>): Promise<Array<Polygon>>;
    /**
     * Adds a polyline to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the line.
     * @param options - Polyline options defining the line.
     * @returns - A promise that when fullfilled contains the an instance of the Polyline (or an array
     * of polygons for complex paths) model.
     *
     * @memberof BingClusterService
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
     * @memberof BingClusterService
     */
    CreatePolylines(layer: number, options: Array<IPolylineOptions>): Promise<Array<Polyline | Array<Polyline>>>;
    /**
     * Start to actually cluster the entities in a cluster layer. This method should be called after the initial set of entities
     * have been added to the cluster. This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @param layer - ClusterLayerDirective component object for which to retrieve the layer.
     *
     * @memberof BingClusterService
     */
    StartClustering(layer: ClusterLayerDirective): Promise<void>;
    /**
     * Stop to actually cluster the entities in a cluster layer.
     * This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @param layer - ClusterLayerDirective component object for which to retrieve the layer.
     *
     * @memberof BingClusterService
     */
    StopClustering(layer: ClusterLayerDirective): Promise<void>;
    /**
     * Creates the default cluster pushpin as a callback from BingMaps when clustering occurs. The {@link ClusterLayerDirective} model
     * can provide an IconInfo property that would govern the apparenace of the pin. This method will assign the same pin to all
     * clusters in the layer.
     *
     * @param cluster - The cluster for which to create the pushpin.
     * @param layer - The {@link ClusterLayerDirective} component representing the layer.
     *
     * @memberof BingClusterService
     */
    private CreateClusterPushPin;
    /**
     * Provides a hook for consumers to provide a custom function to create cluster bins for a cluster. This is particuarily useful
     * in situation where the pin should differ to represent information about the pins in the cluster.
     *
     * @param cluster - The cluster for which to create the pushpin.
     * @param layer - The {@link ClusterLayerDirective} component
     * representing the layer. Set the {@link ClusterLayerDirective.CustomMarkerCallback}
     * property to define the callback generating the pin.
     *
     * @memberof BingClusterService
     */
    private CreateCustomClusterPushPin;
    /**
     * Zooms into the cluster on click so that the members of the cluster comfortable fit into the zommed area.
     *
     * @param e - Mouse Event.
     *
     * @memberof BingClusterService
     */
    private ZoomIntoCluster;
}
