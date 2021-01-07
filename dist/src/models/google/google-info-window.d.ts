import { IInfoWindowOptions } from '../../interfaces/iinfo-window-options';
import { ILatLong } from '../../interfaces/ilatlong';
import { GoogleMapService } from '../../services/google/google-map.service';
import { InfoWindow } from '../info-window';
import * as GoogleMapTypes from '../../services/google/google-map-types';
/**
 * Concrete implementation for a {@link InfoWindow}} model for Google Maps.
 *
 * @export
 */
export declare class GoogleInfoWindow implements InfoWindow {
    private _infoWindow;
    private _mapService;
    private _isOpen;
    /**
     * Gets whether the info box is currently open.
     *
     * @readonly
     * @memberof InfoWGoogleInfoWindowindow
     */
    get IsOpen(): boolean;
    /**
     * Gets the underlying native object.
     *
     * @property
     * @readonly
     */
    get NativePrimitve(): GoogleMapTypes.InfoWindow;
    /**
     * Creates an instance of GoogleInfoWindow.
     * @param _infoWindow - A {@link GoogleMapTypes.InfoWindow} instance underlying the model.
     * @param _mapService - An instance of the {@link GoogleMapService}.
     * @memberof GoogleInfoWindow
     */
    constructor(_infoWindow: GoogleMapTypes.InfoWindow, _mapService: GoogleMapService);
    /**
      * Adds an event listener to the InfoWindow.
      *
      * @param eventType - String containing the event for which to register the listener (e.g. "click")
      * @param fn - Delegate invoked when the event occurs.
      *
      * @memberof GoogleInfoWindow
      * @method
      */
    AddListener(eventType: string, fn: Function): void;
    /**
     *
     * Closes the info window.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    Close(): void;
    /**
     * Gets the position of the info window
     *
     * @returns - The geo coordinates of the info window.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    GetPosition(): ILatLong;
    /**
     * Opens the info window
     *
     * @param [anchor] - Optional Anchor.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    Open(anchor?: any): void;
    /**
     * Sets the info window options
     *
     * @param options - The options to set. This object will be merged with the existing options.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    SetOptions(options: IInfoWindowOptions): void;
    /**
     * Sets the info window position
     *
     * @param position - Geo coordinates at which to anchor the info window.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    SetPosition(position: ILatLong): void;
}
