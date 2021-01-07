import { ILayerOptions } from '../../interfaces/ilayer-options';
import { MapService } from '../../services/map.service';
import { Layer } from '../layer';
import { Marker } from '../marker';
import { InfoWindow } from '../info-window';
import { Polygon } from '../polygon';
import { Polyline } from '../polyline';
import * as GoogleMapTypes from '../../services/google/google-map-types';
/**
 * Concrete implementation of a layer for the Google Map Provider.
 *
 * @export
 */
export declare class GoogleLayer implements Layer {
    private _layer;
    private _maps;
    private _id;
    private _entities;
    private _visible;
    /**
     * Get the native primitive underneath the abstraction layer. Google does not have the concept of a custom layer,
     * so we are returning the Map as the native object because it hosts all the markers.
     *
     * @returns GoogleMapTypes.GoogleMap.
     *
     * @memberof GoogleLayer
     */
    get NativePrimitve(): GoogleMapTypes.GoogleMap;
    /**
     * Creates a new instance of the GoogleMarkerClusterer class.
     *
     * @param _layer GoogleMapTypes.MarkerClusterer. Native Google Maps Marker Clusterer supporting the cluster layer.
     * @param _maps MapService. MapService implementation to leverage for the layer.
     *
     * @memberof GoogleLayer
     */
    constructor(_layer: GoogleMapTypes.GoogleMap, _maps: MapService, _id: number);
    /**
     * Adds an event listener for the layer.
     *
     * @param eventType string. Type of event to add (click, mouseover, etc). You can use any event that the underlying native
     * layer supports.
     * @param fn function. Handler to call when the event occurs.
     *
     * @memberof GoogleLayer
     */
    AddListener(eventType: string, fn: Function): void;
    /**
     * Adds an entity to the layer. Use this method with caution as it will
     * trigger a recaluation of the clusters (and associated markers if approprite) for
     * each invocation. If you use this method to add many markers to the cluster, use
     *
     * @param entity Marker|InfoWindow|Polygon|Polyline. Entity to add to the layer.
     *
     * @memberof GoogleLAyer
     */
    AddEntity(entity: Marker | InfoWindow | Polygon | Polyline): void;
    /**
     * Adds a number of entities to the layer. Entities in this context should be model abstractions of concered map functionality (such
     * as marker, infowindow, polyline, polygon, etc..)
     *
     * @param entities Array<Marker|InfoWindow|Polygon|Polyline>. Entities to add to the layer.
     *
     * @memberof GoogleLAyer
     */
    AddEntities(entities: Array<Marker | InfoWindow | Polygon | Polyline>): void;
    /**
     * Deletes the layer anbd the markers in it.
     *
     * @memberof GoogleLayer
     */
    Delete(): void;
    /**
     * Returns the options governing the behavior of the layer.
     *
     * @returns ILayerOptions. The layer options.
     *
     * @memberof GoogleLayer
     */
    GetOptions(): ILayerOptions;
    /**
     * Returns the visibility state of the layer.
     *
     * @returns Boolean. True is the layer is visible, false otherwise.
     *
     * @memberof GoogleLayer
     */
    GetVisible(): boolean;
    /**
     * Removes an entity from the layer.
     *
     * @param entity Marker|InfoWindow|Polygon|Polyline Entity to be removed from the layer.
     *
     * @memberof GoogleLayer
     */
    RemoveEntity(entity: Marker | InfoWindow | Polygon | Polyline): void;
    /**
     * Sets the entities for the cluster layer.
     *
     * @param entities Array<Marker>|Array<InfoWindow>|Array<Polygon>|Array<Polyline> containing
     * the entities to add to the cluster. This replaces any existing entities.
     *
     * @memberof GoogleLayer
     */
    SetEntities(entities: Array<Marker> | Array<InfoWindow> | Array<Polygon> | Array<Polyline>): void;
    /**
     * Sets the options for the cluster layer.
     *
     * @param options ILayerOptions containing the options enumeration controlling the layer behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof GoogleLayer
     */
    SetOptions(options: ILayerOptions): void;
    /**
     * Toggles the cluster layer visibility.
     *
     * @param visible Boolean true to make the layer visible, false to hide the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    SetVisible(visible: boolean): void;
}
