import { ILatLong } from '../../interfaces/ilatlong';
import { IInfoWindowOptions } from '../../interfaces/iinfo-window-options';
import { InfoWindow } from '../info-window';
/**
 * Concrete implementation of the {@link InfoWindow} contract for the Bing Maps V8 map architecture.
 *
 * @export
 */
export declare class BingInfoWindow implements InfoWindow {
    private _infoBox;
    private _isOpen;
    /**
     * Gets whether the info box is currently open.
     *
     * @readonly
     * @memberof BingInfoWindow
     */
    get IsOpen(): boolean;
    /**
     * Gets native primitve underlying the model.
     *
     * @memberof BingInfoWindow
     * @property
     * @readonly
     */
    get NativePrimitve(): Microsoft.Maps.Infobox;
    /**
     * Creates an instance of BingInfoWindow.
     * @param _infoBox - A {@link Microsoft.Maps.Infobox} instance underlying the model
     * @memberof BingInfoWindow
     */
    constructor(_infoBox: Microsoft.Maps.Infobox);
    /**
     * Adds an event listener to the InfoWindow.
     *
     * @param eventType - String containing the event for which to register the listener (e.g. "click")
     * @param fn - Delegate invoked when the event occurs.
     *
     * @memberof BingInfoWindow
     * @method
     */
    AddListener(eventType: string, fn: Function): void;
    /**
     * Closes the info window.
     *
     * @memberof BingInfoWindow
     * @method
     */
    Close(): void;
    /**
     * Gets the position of the info window.
     *
     * @returns - Returns the geo coordinates of the info window.
     * @memberof BingInfoWindow
     * @method
     */
    GetPosition(): ILatLong;
    /**
     * Opens the info window.
     *
     * @memberof BingInfoWindow
     * @method
     */
    Open(): void;
    /**
     * Sets the info window options.
     *
     * @param options - Info window options to set. The options will be merged with any existing options.
     *
     * @memberof BingInfoWindow
     * @method
     */
    SetOptions(options: IInfoWindowOptions): void;
    /**
     * Sets the info window position.
     *
     * @param position - Geo coordinates to move the anchor of the info window to.
     *
     * @memberof BingInfoWindow
     * @method
     */
    SetPosition(position: ILatLong): void;
}
