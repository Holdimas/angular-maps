import { NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { InfoBoxComponent } from '../../components/infobox';
import { IInfoWindowOptions } from '../../interfaces/iinfo-window-options';
import { ILatLong } from '../../interfaces/ilatlong';
import { InfoBoxService } from '../infobox.service';
import { MarkerService } from '../marker.service';
import { MapService } from '../map.service';
export declare class GoogleInfoBoxService extends InfoBoxService {
    private _mapService;
    private _markerService;
    private _zone;
    private _boxes;
    /**
     * Creates an instance of GoogleInfoBoxService.
     * @param _mapService
     * @param _markerService
     * @param _zone
     *
     * @memberof GoogleInfoBoxService
     */
    constructor(_mapService: MapService, _markerService: MarkerService, _zone: NgZone);
    /**
     * Creates a new instance of an info window
     *
     * @param info
     *
     * @memberof GoogleInfoBoxService
     */
    AddInfoWindow(info: InfoBoxComponent): void;
    /**
     * Closes the info window
     *
     * @param info
     * @returns -  A promise that is resolved when the info box is closed.
     *
     * @memberof GoogleInfoBoxService
     */
    Close(info: InfoBoxComponent): Promise<void>;
    /**
     * Registers an event delegate for an info window.
     *
     * @param eventName - The name of the event to register (e.g. 'click')
     * @param infoComponent - The {@link InfoBoxComponent} for which to register the event.
     * @returns - Observable emiting an instance of T each time the event occurs.
     *
     * @memberof GoogleInfoBoxService
     */
    CreateEventObservable<T>(eventName: string, infoComponent: InfoBoxComponent): Observable<T>;
    /**
     * Deletes the info window
     *
     * @param info
     *
     * @memberof GoogleInfoBoxService
     */
    DeleteInfoWindow(info: InfoBoxComponent): Promise<void>;
    /**
     * Opens the info window. Window opens on a marker, if supplied, or a specific location if given
     *
     * @param info
     * @param [loc]
     *
     * @memberof GoogleInfoBoxService
     */
    Open(info: InfoBoxComponent, loc?: ILatLong): Promise<void>;
    /**
     * Sets the info window options
     *
     * @param info
     * @param options
     *
     * @memberof GoogleInfoBoxService
     */
    SetOptions(info: InfoBoxComponent, options: IInfoWindowOptions): Promise<void>;
    /**
     * Sets the info window position
     *
     * @param info
     * @param latlng
     *
     * @memberof GoogleInfoBoxService
     */
    SetPosition(info: InfoBoxComponent, latlng: ILatLong): Promise<void>;
}
