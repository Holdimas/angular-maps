import { ILabelOptions } from '../interfaces/ilabel-options';
/**
 * Abstract base implementing a label to be placed on the map.
 *
 * @export
 * @abstract
 */
export declare abstract class MapLabel {
    protected _canvas: HTMLCanvasElement;
    /**
     * Returns the default label style for the platform
     *
     * @readonly
     * @abstract
     * @memberof MapLabel
     */
    abstract get DefaultLabelStyle(): ILabelOptions;
    /**
     * Creates a new MapLabel
     * @param options Optional properties to set.
     */
    constructor(options: {
        [key: string]: any;
    });
    /**
     * Deletes the label from the map. This method does not atually delete the label itself, so
     * it can be readded to map later.
     * @memberof MapLabel
     * @method
     */
    Delete(): void;
    /**
     * Delegate called when underlying properties change.
     *
     * @param prop - The property or properties that have changed.
     * @memberof MapLabel
     * @method
     */
    Changed(prop: string | Array<string>): void;
    /**
     * Gets the value of a setting.
     *
     * @param key - Key specifying the setting.
     * @returns - The value of the setting.
     * @memberof MapLabel
     * @abstract
     * @method
     */
    abstract Get(key: string): any;
    /**
     * Gets the map associted with the label.
     *
     * @returns - A native map object for the underlying implementation. Implementing derivatives should return the
     * actual native object.
     * @memberof MapLabel
     * @method
     * @abstract
     */
    abstract GetMap(): any;
    /**
     * Set the value for a setting.
     *
     * @param key - Key specifying the setting.
     * @param val - The value to set.
     * @memberof MapLabel
     * @abstract
     * @method
     */
    abstract Set(key: string, val: any): void;
    /**
     * Sets the map for the label. Settings this to null remove the label from hte map.
     *
     * @param map - A native map object for the underlying implementation. Implementing derivatives should return the
     * actual native object.
     * @memberof MapLabel
     * @method
     */
    abstract SetMap(map: any): void;
    /**
     * Applies settings to the object
     *
     * @param options - An object containing the settings key value pairs.
     * @memberof MapLabel
     * @abstract
     * @method
     */
    abstract SetValues(options: {
        [key: string]: any;
    }): void;
    /**
     * Get the visibility of the label. Visibility depends on Zoom settings.
     * @returns - blank string if visible, 'hidden' if invisible.
     * @protected
     */
    protected GetVisible(): "" | "hidden";
    /**
     * Draws the label on the map.
     * @memberof MapLabel
     * @method
     * @protected
     */
    protected abstract Draw(): void;
    /**
     * Draws the label to the canvas 2d context.
     * @memberof MapLabel
     * @method
     * @protected
     */
    protected DrawCanvas(): void;
    /**
     * Gets the appropriate margin-left for the canvas.
     * @param textWidth  - The width of the text, in pixels.
     * @returns - The margin-left, in pixels.
     * @protected
     * @method
     * @memberof MapLabel
     */
    protected GetMarginLeft(textWidth: number): number;
    /**
     * Delegate called when the label is added to the map. Generates and configures
     * the canvas.
     *
     * @memberof MapLabel
     * @method
     * @protected
     * @abstract
     */
    protected abstract OnAdd(): void;
    /**
     * Called when the label is removed from the map.
     * @method
     * @protected
     * @memberof MapLabel
     */
    protected OnRemove(): void;
}
