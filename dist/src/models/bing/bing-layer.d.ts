import { ILayerOptions } from '../../interfaces/ilayer-options';
import { Layer } from '../layer';
import { Marker } from '../marker';
import { Polygon } from '../polygon';
import { Polyline } from '../polyline';
import { InfoWindow } from '../info-window';
import { MapService } from '../../services/map.service';
/**
 * Concrete implementation of a map layer for the Bing Map Provider.
 *
 * @export
 */
export declare class BingLayer implements Layer {
    private _layer;
    private _maps;
    private _pendingEntities;
    /**
     * Get the native primitive underneath the abstraction layer.
     *
     * @returns Microsoft.Maps.Layer.
     *
     * @memberof BingLayer
     */
    get NativePrimitve(): any;
    /**
     * Creates a new instance of the BingClusterLayer class.
     *
     * @param _layer Microsoft.Maps.ClusterLayer. Native Bing Cluster Layer supporting the cluster layer.
     * @param _maps MapService. MapService implementation to leverage for the layer.
     *
     * @memberof BingLayer
     */
    constructor(_layer: Microsoft.Maps.Layer, _maps: MapService);
    /**
     * Adds an event listener for the layer.
     *
     * @param eventType string. Type of event to add (click, mouseover, etc). You can use any event that the underlying native
     * layer supports.
     * @param fn function. Handler to call when the event occurs.
     *
     * @memberof BingLayer
     */
    AddListener(eventType: string, fn: Function): void;
    /**
     * Adds an entity to the layer.
     *
     * @param entity Marker|InfoWindow|Polygon|Polyline. Entity to add to the layer.
     *
     * @memberof BingLayer
     */
    AddEntity(entity: Marker | InfoWindow | Polygon | Polyline): void;
    /**
     * Adds a number of entities to the layer. Entities in this context should be model abstractions of concered map functionality (such
     * as marker, infowindow, polyline, polygon, etc..)
     *
     * @param entities Array<Marker|InfoWindow|Polygon|Polyline>. Entities to add to the layer.
     *
     * @memberof BingLayer
     */
    AddEntities(entities: Array<Marker | InfoWindow | Polygon | Polyline>): void;
    /**
     * Deletes the layer.
     *
     * @memberof BingLayer
     */
    Delete(): void;
    /**
     * Returns the options governing the behavior of the layer.
     *
     * @returns IClusterOptions. The layer options.
     *
     * @memberof BingLayer
     */
    GetOptions(): ILayerOptions;
    /**
     * Returns the visibility state of the layer.
     *
     * @returns Boolean. True is the layer is visible, false otherwise.
     *
     * @memberof BingLayer
     */
    GetVisible(): boolean;
    /**
     * Removes an entity from the cluster layer.
     *
     * @param entity Marker|InfoWindow|Polygon|Polyline to be removed from the layer.
     *
     * @memberof BingLayer
     */
    RemoveEntity(entity: Marker | InfoWindow | Polygon | Polyline): void;
    /**
     * Sets the entities for the cluster layer.
     *
     * @param entities Array<Marker>|Array<InfoWindow>|Array<Polygon>|Array<Polyline> containing the entities to add to the cluster.
     * This replaces any existing entities.
     *
     * @memberof BingLayer
     */
    SetEntities(entities: Array<Marker> | Array<InfoWindow> | Array<Polygon> | Array<Polyline>): void;
    /**
     * Sets the options for the cluster layer.
     *
     * @param options IClusterOptions containing the options enumeration controlling the layer behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof BingLayer
     */
    SetOptions(options: ILayerOptions): void;
    /**
     * Toggles the cluster layer visibility.
     *
     * @param visible Boolean true to make the layer visible, false to hide the layer.
     *
     * @memberof BingLayer
     */
    SetVisible(visible: boolean): void;
}
