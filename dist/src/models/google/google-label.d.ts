import * as GoogleMapTypes from '../../services/google/google-map-types';
import { MapLabel } from '../map-label';
import { ILabelOptions } from '../../interfaces/ilabel-options';
/**
 * Implements map a labled to be placed on the map.
 *
 * @export
 */
export declare class GoogleMapLabel extends MapLabel {
    /**
     * Returns the default label style for the platform
     *
     * @readonly
     * @abstract
     * @memberof GoogleMapLabel
     */
    get DefaultLabelStyle(): ILabelOptions;
    /**
     * Creates a new MapLabel
     * @param options Optional properties to set.
     */
    constructor(options: {
        [key: string]: any;
    });
    /**
     * Gets the value of a setting.
     *
     * @param key - Key specifying the setting.
     * @returns - The value of the setting.
     * @memberof MapLabel
     * @method
     */
    Get(key: string): any;
    /**
     * Gets the map associted with the label.
     *
     * @memberof GoogleMapLabel
     * @method
     */
    GetMap(): GoogleMapTypes.GoogleMap;
    /**
     * Set the value for a setting.
     *
     * @param key - Key specifying the setting.
     * @param val - The value to set.
     * @memberof MapLabel
     * @method
     */
    Set(key: string, val: any): void;
    /**
     * Sets the map for the label. Settings this to null remove the label from hte map.
     *
     * @param map - Map to associated with the label.
     * @memberof GoogleMapLabel
     * @method
     */
    SetMap(map: GoogleMapTypes.GoogleMap): void;
    /**
     * Applies settings to the object
     *
     * @param options - An object containing the settings key value pairs.
     * @memberof MapLabel
     * @method
     */
    SetValues(options: {
        [key: string]: any;
    }): void;
    /**
     * Draws the label on the map.
     * @memberof GoogleMapLabel
     * @method
     * @protected
     */
    protected Draw(): void;
    /**
     * Delegate called when the label is added to the map. Generates and configures
     * the canvas.
     *
     * @memberof GoogleMapLabel
     * @method
     * @protected
     */
    protected OnAdd(): void;
}
/**
 * Helper function to extend the OverlayView into the MapLabel
 *
 * @export
 * @method
 */
export declare function MixinMapLabelWithOverlayView(): void;
