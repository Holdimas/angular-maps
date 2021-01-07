import { NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { IPoint } from '../../interfaces/ipoint';
import { ILatLong } from '../../interfaces/ilatlong';
import { Marker } from '../../models/marker';
import { MapMarkerDirective } from '../../components/map-marker';
import { MarkerService } from '../marker.service';
import { MapService } from '../map.service';
import { LayerService } from '../layer.service';
import { ClusterService } from '../cluster.service';
/**
 * Concrete implementation of the MarkerService abstract class for Google.
 *
 * @export
 */
export declare class GoogleMarkerService implements MarkerService {
    private _mapService;
    private _layerService;
    private _clusterService;
    private _zone;
    private _markers;
    /**
     * Creates an instance of GoogleMarkerService.
     * @param _mapService - {@link MapService} instance.
     * The concrete {@link GoogleMapService} implementation is expected.
     * @param _layerService - {@link LayerService} instance.
     * The concrete {@link GoogleLayerService} implementation is expected.
     * @param _clusterService - {@link ClusterService} instance.
     * The concrete {@link GoogleClusterService} implementation is expected.
     * @param _zone - NgZone instance to support zone aware promises.
     *
     * @memberof GoogleMarkerService
     */
    constructor(_mapService: MapService, _layerService: LayerService, _clusterService: ClusterService, _zone: NgZone);
    /**
     * Adds a marker. Depending on the marker context, the marker will either by added to the map or a correcsponding layer.
     *
     * @param marker - The {@link MapMarkerDirective} to be added.
     * @memberof GoogleMarkerService
     */
    AddMarker(marker: MapMarkerDirective): void;
    /**
     * Registers an event delegate for a marker.
     *
     * @param eventName - The name of the event to register (e.g. 'click')
     * @param marker - The {@link MapMarkerDirective} for which to register the event.
     * @returns - Observable emiting an instance of T each time the event occurs.
     * @memberof GoogleMarkerService
     */
    CreateEventObservable<T>(eventName: string, marker: MapMarkerDirective): Observable<T>;
    /**
     * Deletes a marker.
     *
     * @param marker - {@link MapMarkerDirective} to be deleted.
     * @returns - A promise fullfilled once the marker has been deleted.
     * @memberof GoogleMarkerService
     */
    DeleteMarker(marker: MapMarkerDirective): Promise<void>;
    /**
     * Obtains geo coordinates for the marker on the click location
     *
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     * @memberof GoogleMarkerService
     */
    GetCoordinatesFromClick(e: MouseEvent | any): ILatLong;
    /**
     * Obtains the marker model for the marker allowing access to native implementation functionatiliy.
     *
     * @param marker - The {@link MapMarkerDirective} for which to obtain the marker model.
     * @returns - A promise that when fullfilled contains the {@link Marker} implementation of the underlying platform.
     * @memberof GoogleMarkerService
     */
    GetNativeMarker(marker: MapMarkerDirective): Promise<Marker>;
    /**
     * Obtains the marker pixel location for the marker on the click location
     *
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the pixels of the marker on the map canvas.
     * @memberof GoogleMarkerService
     */
    GetPixelsFromClick(e: MouseEvent | any): IPoint;
    /**
     * Converts a geo location to a pixel location relative to the map canvas.
     *
     * @param target - Either a {@link MapMarkerDirective}
     * or a {@link ILatLong} for the basis of translation.
     * @returns - A promise that when fullfilled contains a {@link IPoint}
     * with the pixel coordinates of the MapMarker or ILatLong relative to the map canvas.
     * @memberof GoogleMarkerService
     */
    LocationToPoint(target: MapMarkerDirective | ILatLong): Promise<IPoint>;
    /**
     * Updates the anchor position for the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the anchor.
     * Anchor information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the anchor position has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateAnchor(marker: MapMarkerDirective): Promise<void>;
    /**
     * Updates whether the marker is draggable.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate dragability.
     * Dragability information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the marker has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateDraggable(marker: MapMarkerDirective): Promise<void>;
    /**
     * Updates the Icon on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the icon. Icon information is present
     * in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the icon information has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateIcon(marker: MapMarkerDirective): Promise<void>;
    /**
     * Updates the label on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the label.
     * Label information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the label has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateLabel(marker: MapMarkerDirective): Promise<void>;
    /**
     * Updates the geo coordinates for the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the coordinates.
     * Coordinate information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the position has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateMarkerPosition(marker: MapMarkerDirective): Promise<void>;
    /**
     * Updates the title on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the title.
     * Title information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the title has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateTitle(marker: MapMarkerDirective): Promise<void>;
    /**
     * Updates the visibility on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the title.
     * Title information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the title has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateVisible(marker: MapMarkerDirective): Promise<void>;
}
