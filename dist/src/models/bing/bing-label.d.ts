import { ILabelOptions } from '../../interfaces/ilabel-options';
import { MapLabel } from '../map-label';
/**
 * Implements map a labled to be placed on the map.
 *
 * @export
 */
export declare class BingMapLabel extends MapLabel {
    /**
     * Returns the default label style for the platform
     *
     * @readonly
     * @abstract
     * @memberof BingMapLabel
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
     * @memberof BingMapLabel
     * @method
     */
    Get(key: string): any;
    /**
     * Gets the map associted with the label.
     *
     * @memberof BingMapLabel
     * @method
     */
    GetMap(): Microsoft.Maps.Map;
    /**
     * Set the value for a setting.
     *
     * @param key - Key specifying the setting.
     * @param val - The value to set.
     * @memberof BingMapLabel
     * @method
     */
    Set(key: string, val: any): void;
    /**
     * Sets the map for the label. Settings this to null remove the label from hte map.
     *
     * @param map - Map to associated with the label.
     * @memberof BingMapLabel
     * @method
     */
    SetMap(map: Microsoft.Maps.Map): void;
    /**
     * Applies settings to the object
     *
     * @param options - An object containing the settings key value pairs.
     * @memberof BingMapLabel
     * @method
     */
    SetValues(options: {
        [key: string]: any;
    }): void;
    /**
     * Draws the label on the map.
     * @memberof BingMapLabel
     * @method
     * @protected
     */
    protected Draw(): void;
    /**
     * Delegate called when the label is added to the map. Generates and configures
     * the canvas.
     *
     * @memberof BingMapLabel
     * @method
     * @protected
     */
    protected OnAdd(): void;
    /**
     * Delegate callled when the label is loaded
     * @memberof BingMapLabel
     * @method
     */
    private OnLoad;
}
/**
 * Helper function to extend the CustomOverlay into the MapLabel
 *
 * @export
 * @method
 */
export declare function MixinMapLabelWithOverlayView(): void;
