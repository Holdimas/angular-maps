import { ILatLong } from '../interfaces/ilatlong';
import { IPolylineOptions } from '../interfaces/ipolyline-options';
/**
 * Abstract class defining the contract for a polyline in the architecture specific implementation.
 *
 * @export
 * @abstract
 */
export declare abstract class Polyline {
    protected _centroid: ILatLong;
    protected _center: ILatLong;
    /**
     * Gets the polyline's center.
     * @readonly
     * @memberof Polyline
     */
    get Center(): ILatLong;
    /**
     * Gets the polyline's centroid.
     * @readonly
     * @memberof Polyline
     */
    get Centroid(): ILatLong;
    /**
     * Gets the native primitve implementing the polyline.
     *
     * @readonly
     * @memberof Polyline
     */
    abstract get NativePrimitve(): any;
    /**
     * Gets the polyline metadata.
     *
     * @readonly
     * @abstract
     * @memberof Polylin
     */
    abstract get Metadata(): Map<string, any>;
    /**
     * Gets or sets whether to show the tooltip
     *
     * @abstract
     * @memberof Polyline
     * @property
     */
    abstract get ShowTooltip(): boolean;
    abstract set ShowTooltip(val: boolean);
    /**
     * Gets or sets the title off the polyline
     *
     * @abstract
     * @memberof Polyline
     * @property
     */
    abstract get Title(): string;
    abstract set Title(val: string);
    /**
     * Get the centroid of the polyline based on the a path.
     *
     * @param path - the path for which to generate the centroid
     * @returns - The centroid coordinates of the polyline.
     * @memberof Polyline
     * @method
     */
    static GetPolylineCentroid(path: Array<ILatLong>): ILatLong;
    /**
     * Adds a delegate for an event.
     *
     * @abstract
     * @param eventType - String containing the event name.
     * @param fn - Delegate function to execute when the event occurs.
     *
     * @memberof Polyline
     */
    abstract AddListener(eventType: string, fn: Function): void;
    /**
     * Deleted the polyline.
     *
     * @abstract
     *
     * @memberof Polyline
     */
    abstract Delete(): void;
    /**
     * Gets whether the polyline is draggable.
     *
     * @abstract
     * @returns - True if the polyline is dragable, false otherwise.
     *
     * @memberof Polyline
     */
    abstract GetDraggable(): boolean;
    /**
     * Gets whether the polyline path can be edited.
     *
     * @abstract
     * @returns - True if the path can be edited, false otherwise.
     *
     * @memberof Polyline
     */
    abstract GetEditable(): boolean;
    /**
     * Gets the polyline path.
     *
     * @abstract
     * @returns - Array of ILatLong objects describing the polyline path.
     *
     * @memberof Polyline
     */
    abstract GetPath(): Array<ILatLong>;
    /**
     * Gets whether the polyline is visible.
     *
     * @abstract
     * @returns - True if the polyline is visible, false otherwise.
     *
     * @memberof Polyline
     */
    abstract GetVisible(): boolean;
    /**
     * Sets whether the polyline is dragable.
     *
     * @abstract
     * @param draggable - True to make the polyline dragable, false otherwise.
     *
     * @memberof Polyline
     */
    abstract SetDraggable(draggable: boolean): void;
    /**
     * Sets wether the polyline path is editable.
     *
     * @abstract
     * @param editable - True to make polyline path editable, false otherwise.
     *
     * @memberof Polyline
     */
    abstract SetEditable(editable: boolean): void;
    /**
     * Sets the polyline options
     *
     * @abstract
     * @param options - {@link ILatLong} object containing the options. The options are merged with hte ones
     * already on the underlying model.
     *
     * @memberof Polyline
     */
    abstract SetOptions(options: IPolylineOptions): void;
    /**
     * Sets the polyline path.
     *
     * @abstract
     * @param path - An Array of {@link ILatLong} (or array of arrays) describing the polylines path.
     *
     * @memberof Polyline
     */
    abstract SetPath(path: Array<ILatLong> | Array<ILatLong>): void;
    /**
     * Sets whether the polyline is visible.
     *
     * @abstract
     * @param visible - True to set the polyline visible, false otherwise.
     *
     * @memberof Polyline
     */
    abstract SetVisible(visible: boolean): void;
    /**
     * Gets the center of the polyline' bounding box.
     *
     * @returns - {@link ILatLong} object containing the center of the bounding box.
     * @memberof Polyline
     * @method
     * @protected
     */
    protected GetBoundingCenter(): ILatLong;
    /**
     * Get the centroid of the polyline based on the polyline path.
     *
     * @returns - The centroid coordinates of the polyline.
     * @memberof Polyline
     * @method
     * @protected
     */
    protected GetPolylineCentroid(): ILatLong;
}
