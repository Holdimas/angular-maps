import { ILatLong } from '../interfaces/ilatlong';
import { IInfoWindowOptions } from '../interfaces/iinfo-window-options';
export declare abstract class InfoWindow {
    /**
     * Gets whether the info box is currently open.
     *
     * @readonly
     * @abstract
     * @memberof InfoWindow
     */
    abstract get IsOpen(): boolean;
    /**
     * Get the underlying native primitive of the implementation.
     *
     * @readonly
     * @abstract
     * @memberof InfoWindow
     */
    abstract get NativePrimitve(): any;
    /**
     * Adds an event listener to the info window.
     *
     * @abstract
     * @param eventType - String containing the event for which to register the listener (e.g. "click")
     * @param fn - Delegate invoked when the event occurs.
     *
     * @memberof InfoWindow
     */
    abstract AddListener(eventType: string, fn: Function): void;
    /**
     * Closes the info window.
     *
     * @abstract
     *
     * @memberof InfoWindow
     */
    abstract Close(): void;
    /**
     * Gets the position of the info window.
     *
     * @abstract
     * @returns - Returns the geo coordinates of the info window.
     *
     * @memberof InfoWindow
     */
    abstract GetPosition(): ILatLong;
    /**
     * Opens the info window.
     *
     * @abstract
     *
     * @memberof InfoWindow
     */
    abstract Open(): void;
    /**
     * Sets the info window options.
     *
     * @abstract
     * @param options - Info window options to set. The options will be merged with any existing options.
     *
     * @memberof InfoWindow
     */
    abstract SetOptions(options: IInfoWindowOptions): void;
    /**
     * Sets the info window position.
     *
     * @abstract
     * @param position - Geo coordinates to move the anchor of the info window to.
     *
     * @memberof InfoWindow
     */
    abstract SetPosition(position: ILatLong): void;
}
