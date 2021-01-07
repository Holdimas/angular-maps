import { ILatLong } from '../interfaces/ilatlong';
import { IPolygonOptions } from '../interfaces/ipolygon-options';
/**
 * Abstract class defining the contract for a polygon in the architecture specific implementation.
 *
 * @export
 * @abstract
 */
export declare abstract class Polygon {
    protected _centroid: ILatLong;
    protected _center: ILatLong;
    /**
     * Gets the polygon's center.
     * @readonly
     * @memberof Polygon
     */
    get Center(): ILatLong;
    /**
     * Gets the polygon's centroid.
     * @readonly
     * @memberof Polygon
     */
    get Centroid(): ILatLong;
    /**
     * Gets or sets the maximum zoom at which the label is displayed. Ignored or ShowLabel is false.
     *
     * @abstract
     * @memberof Polygon
     * @property
     */
    abstract get LabelMaxZoom(): number;
    abstract set LabelMaxZoom(val: number);
    /**
     * Gets or sets the minimum zoom at which the label is displayed. Ignored or ShowLabel is false.
     *
     * @abstract
     * @memberof Polygon
     * @property
     */
    abstract get LabelMinZoom(): number;
    abstract set LabelMinZoom(val: number);
    /**
     * Gets the polygon metadata.
     *
     * @readonly
     * @abstract
     * @memberof Polygon
     */
    abstract get Metadata(): Map<string, any>;
    /**
     * Gets the native primitve implementing the polygon.
     *
     * @readonly
     * @memberof Polygon
     */
    abstract get NativePrimitve(): any;
    /**
     * Gets or sets whether to show the label
     *
     * @abstract
     * @memberof Polygon
     * @property
     */
    abstract get ShowLabel(): boolean;
    abstract set ShowLabel(val: boolean);
    /**
     * Gets or sets whether to show the tooltip
     *
     * @abstract
     * @memberof Polygon
     * @property
     */
    abstract get ShowTooltip(): boolean;
    abstract set ShowTooltip(val: boolean);
    /**
     * Gets or sets the title off the polygon
     *
     * @abstract
     * @memberof Polygon
     * @property
     */
    abstract get Title(): string;
    abstract set Title(val: string);
    /**
     * Adds a delegate for an event.
     *
     * @abstract
     * @param eventType - String containing the event name.
     * @param fn - Delegate function to execute when the event occurs.
     * @memberof Polygon
     */
    abstract AddListener(eventType: string, fn: Function): void;
    /**
     * Deleted the polygon.
     *
     * @abstract
     *
     * @memberof Polygon
     */
    abstract Delete(): void;
    /**
     * Gets whether the polygon is draggable.
     *
     * @abstract
     * @returns - True if the polygon is dragable, false otherwise.
     *
     * @memberof Polygon
     */
    abstract GetDraggable(): boolean;
    /**
     * Gets whether the polygon path can be edited.
     *
     * @abstract
     * @returns - True if the path can be edited, false otherwise.
     *
     * @memberof Polygon
     */
    abstract GetEditable(): boolean;
    /**
     * Gets the polygon path.
     *
     * @abstract
     * @returns - Array of ILatLong objects describing the polygon path.
     *
     * @memberof Polygon
     */
    abstract GetPath(): Array<ILatLong>;
    /**
     * Gets the polygon paths.
     *
     * @abstract
     * @returns - Array of Array of ILatLong objects describing multiple polygon paths.
     *
     * @memberof Polygon
     */
    abstract GetPaths(): Array<Array<ILatLong>>;
    /**
     * Gets whether the polygon is visible.
     *
     * @abstract
     * @returns - True if the polygon is visible, false otherwise.
     *
     * @memberof Polygon
     */
    abstract GetVisible(): boolean;
    /**
     * Sets whether the polygon is dragable.
     *
     * @abstract
     * @param draggable - True to make the polygon dragable, false otherwise.
     *
     * @memberof Polygon
     */
    abstract SetDraggable(draggable: boolean): void;
    /**
     * Sets wether the polygon path is editable.
     *
     * @abstract
     * @param editable - True to make polygon path editable, false otherwise.
     *
     * @memberof Polygon
     */
    abstract SetEditable(editable: boolean): void;
    /**
     * Sets the polygon options
     *
     * @abstract
     * @param options - {@link ILatLong} object containing the options. The options are merged with hte ones
     * already on the underlying model.
     *
     * @memberof Polygon
     */
    abstract SetOptions(options: IPolygonOptions): void;
    /**
     * Sets the polygon path.
     *
     * @abstract
     * @param path - An Array of {@link ILatLong} (or array of arrays) describing the polygons path.
     *
     * @memberof Polygon
     */
    abstract SetPath(path: Array<ILatLong> | Array<ILatLong>): void;
    /**
     * Set the polygon path or paths.
     *
     * @abstract
     * @param paths An Array of {@link ILatLong}
     * (or array of arrays) describing the polygons path(s).
     *
     * @memberof Polygon
     */
    abstract SetPaths(paths: Array<Array<ILatLong>> | Array<ILatLong>): void;
    /**
     * Sets whether the polygon is visible.
     *
     * @abstract
     * @param visible - True to set the polygon visible, false otherwise.
     *
     * @memberof Polygon
     */
    abstract SetVisible(visible: boolean): void;
    /**
     * Gets the center of the polygons' bounding box.
     *
     * @returns - ILatLong object containing the center of the bounding box.
     * @memberof Polygon
     * @method
     * @protected
     */
    protected GetBoundingCenter(): ILatLong;
    /**
     * Get the centroid of the polygon based on the polygon path.
     *
     * @returns - The centroid coordinates of the polygon.
     * @memberof Polygon
     * @method
     * @protected
     */
    protected GetPolygonCentroid(): ILatLong;
}
