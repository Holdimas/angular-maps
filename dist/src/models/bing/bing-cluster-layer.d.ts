import { IClusterOptions } from '../../interfaces/icluster-options';
import { ISpiderClusterOptions } from '../../interfaces/ispider-cluster-options';
import { MapService } from '../../services/map.service';
import { Layer } from '../layer';
import { Marker } from '../marker';
import { BingSpiderClusterMarker } from './bing-spider-cluster-marker';
/**
 * Concrete implementation of a clustering layer for the Bing Map Provider.
 *
 * @export
 */
export declare class BingClusterLayer implements Layer {
    private _layer;
    private _maps;
    private _isClustering;
    private _markers;
    private _markerLookup;
    private _pendingMarkers;
    private _spiderMarkers;
    private _spiderMarkerLookup;
    private _useSpiderCluster;
    private _mapclicks;
    private _spiderLayer;
    private _events;
    private _currentZoom;
    private _spiderOptions;
    private _currentCluster;
    /**
     * Get the native primitive underneath the abstraction layer.
     *
     * @returns Microsoft.Maps.ClusterLayer.
     *
     * @memberof BingClusterLayer
     */
    get NativePrimitve(): any;
    /**
     * Creates a new instance of the BingClusterLayer class.
     *
     * @param _layer Microsoft.Maps.ClusterLayer. Native Bing Cluster Layer supporting the cluster layer.
     * @param _maps MapService. MapService implementation to leverage for the layer.
     *
     * @memberof BingClusterLayer
     */
    constructor(_layer: Microsoft.Maps.ClusterLayer, _maps: MapService);
    /**
     * Adds an event listener for the layer.
     *
     * @param eventType string. Type of event to add (click, mouseover, etc). You can use any event that the underlying native
     * layer supports.
     * @param fn function. Handler to call when the event occurs.
     *
     * @memberof BingClusterLayer
     */
    AddListener(eventType: string, fn: Function): void;
    /**
     * Adds an entity to the layer. Use this method with caution as it will
     * trigger a recaluation of the clusters (and associated markers if approprite) for
     * each invocation. If you use this method to add many markers to the cluster, use
     *
     * @param entity Marker. Entity to add to the layer.
     *
     * @memberof BingClusterLayer
     */
    AddEntity(entity: Marker): void;
    /**
     * Adds a number of markers to the layer.
     *
     * @param entities Array<Marker>. Entities to add to the layer.
     *
     * @memberof BingClusterLayer
     */
    AddEntities(entities: Array<Marker>): void;
    /**
     * Initializes spider behavior for the clusering layer (when a cluster maker is clicked, it explodes into a spider of the
     * individual underlying pins.
     *
     * @param options ISpiderClusterOptions. Optional. Options governing the behavior of the spider.
     *
     * @memberof BingClusterLayer
     */
    InitializeSpiderClusterSupport(options?: ISpiderClusterOptions): void;
    /**
     * Deletes the clustering layer.
     *
     * @memberof BingClusterLayer
     */
    Delete(): void;
    /**
     * Returns the abstract marker used to wrap the Bing Pushpin.
     *
     * @returns Marker. The abstract marker object representing the pushpin.
     *
     * @memberof BingClusterLayer
     */
    GetMarkerFromBingMarker(pin: Microsoft.Maps.Pushpin): Marker;
    /**
     * Returns the options governing the behavior of the layer.
     *
     * @returns IClusterOptions. The layer options.
     *
     * @memberof BingClusterLayer
     */
    GetOptions(): IClusterOptions;
    /**
     * Returns the visibility state of the layer.
     *
     * @returns Boolean. True is the layer is visible, false otherwise.
     *
     * @memberof BingClusterLayer
     */
    GetVisible(): boolean;
    /**
     * Returns the abstract marker used to wrap the Bing Pushpin.
     *
     * @returns - The abstract marker object representing the pushpin.
     *
     * @memberof BingClusterLayer
     */
    GetSpiderMarkerFromBingMarker(pin: Microsoft.Maps.Pushpin): BingSpiderClusterMarker;
    /**
     * Removes an entity from the cluster layer.
     *
     * @param entity Marker - Entity to be removed from the layer.
     *
     * @memberof BingClusterLayer
     */
    RemoveEntity(entity: Marker): void;
    /**
     * Sets the entities for the cluster layer.
     *
     * @param entities Array<Marker> containing
     * the entities to add to the cluster. This replaces any existing entities.
     *
     * @memberof BingClusterLayer
     */
    SetEntities(entities: Array<Marker>): void;
    /**
     * Sets the options for the cluster layer.
     *
     * @param options IClusterOptions containing the options enumeration controlling the layer behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof BingClusterLayer
     */
    SetOptions(options: IClusterOptions): void;
    /**
     * Toggles the cluster layer visibility.
     *
     * @param visible Boolean true to make the layer visible, false to hide the layer.
     *
     * @memberof BingClusterLayer
     */
    SetVisible(visible: boolean): void;
    /**
     * Start to actually cluster the entities in a cluster layer. This method should be called after the initial set of entities
     * have been added to the cluster. This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @memberof BingClusterLayer
     */
    StartClustering(): void;
    /**
     * Stop to actually cluster the entities in a cluster layer.
     * This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @memberof BingClusterLayer
     */
    StopClustering(): void;
    /**
     * Creates a copy of a pushpins basic options.
     *
     * @param pin Pushpin to copy options from.
     * @returns - A copy of a pushpins basic options.
     *
     * @memberof BingClusterLayer
     */
    private GetBasicPushpinOptions;
    /**
     * Hides the spider cluster and resotres the original pin.
     *
     * @memberof BingClusterLayer
     */
    private HideSpiderCluster;
    /**
     * Click event handler for when a shape in the cluster layer is clicked.
     *
     * @param e The mouse event argurment from the click event.
     *
     * @memberof BingClusterLayer
     */
    private OnLayerClick;
    /**
     * Delegate handling the click event on the map (outside a spider cluster). Depending on the
     * spider options, closes the cluster or increments the click counter.
     *
     * @param e - Mouse event
     *
     * @memberof BingClusterLayer
     */
    private OnMapClick;
    /**
     * Delegate handling the map view changed end event. Hides the spider cluster if the zoom level has changed.
     *
     * @param e - Mouse event.
     *
     * @memberof BingClusterLayer
     */
    private OnMapViewChangeEnd;
    /**
     * Delegate handling the map view change start event. Depending on the spider options, hides the
     * the exploded spider or does nothing.
     *
     * @param e - Mouse event.
     *
     * @memberof BingClusterLayer
     */
    private OnMapViewChangeStart;
    /**
     * Delegate invoked on mouse out on an exploded spider marker. Resets the hover style on the stick.
     *
     * @param e - Mouse event.
     */
    private OnSpiderMouseOut;
    /**
     * Invoked on mouse over on an exploded spider marker. Sets the hover style on the stick. Also invokes the click event
     * on the underlying original marker dependent on the spider options.
     *
     * @param e - Mouse event.
     */
    private OnSpiderMouseOver;
    /**
     * Sets the options for spider behavior.
     *
     * @param options ISpiderClusterOptions containing the options enumeration controlling the spider cluster behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof BingClusterLayer
     */
    private SetSpiderOptions;
    /**
     * Expands a cluster into it's open spider layout.
     *
     * @param cluster The cluster to show in it's open spider layout..
     *
     * @memberof BingClusterLayer
     */
    private ShowSpiderCluster;
}
