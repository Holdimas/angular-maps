import { ILatLong } from '../../interfaces/ilatlong';
import { IPolylineOptions } from '../../interfaces/ipolyline-options';
import { Polyline } from '../polyline';
/**
 * Concrete implementation for a polyline model for Bing Maps V8.
 *
 * @export
 */
export declare class BingPolyline extends Polyline implements Polyline {
    private _polyline;
    protected _map: Microsoft.Maps.Map;
    protected _layer: Microsoft.Maps.Layer;
    private _isEditable;
    private _title;
    private _showTooltip;
    private _tooltip;
    private _hasToolTipReceiver;
    private _tooltipVisible;
    private _mouseOverListener;
    private _mouseMoveListener;
    private _mouseOutListener;
    private _metadata;
    /**
     * Gets the polyline metadata.
     *
     * @readonly
     * @memberof BingPolyline
     */
    get Metadata(): Map<string, any>;
    /**
     * Gets the Navitve Polyline underlying the model
     *
     * @readonly
     * @memberof BingPolyline
     */
    get NativePrimitve(): Microsoft.Maps.Polyline;
    /**
     * Gets or sets whether to show the tooltip
     *
     * @abstract
     * @memberof BingPolyline
     * @property
     */
    get ShowTooltip(): boolean;
    set ShowTooltip(val: boolean);
    /**
     * Gets or sets the title off the polyline
     *
     * @abstract
     * @memberof BingPolyline
     * @property
     */
    get Title(): string;
    set Title(val: string);
    /**
     * Creates an instance of BingPolygon.
     * @param _polyline - The {@link Microsoft.Maps.Polyline} underlying the model.
     * @param _map - The context map.
     * @param _layer - The context layer.
     * @memberof BingPolyline
     */
    constructor(_polyline: Microsoft.Maps.Polyline, _map: Microsoft.Maps.Map, _layer: Microsoft.Maps.Layer);
    /**
     * Adds a delegate for an event.
     *
     * @param eventType - String containing the event name.
     * @param fn - Delegate function to execute when the event occurs.
     * @memberof BingPolyline
     */
    AddListener(eventType: string, fn: Function): void;
    /**
     * Deleted the polyline.
     *
     * @memberof BingPolyline
     */
    Delete(): void;
    /**
     * Gets whether the polyline is draggable.
     *
     * @returns - True if the polyline is dragable, false otherwise.
     *
     * @memberof BingPolyline
     */
    GetDraggable(): boolean;
    /**
     * Gets whether the polyline path can be edited.
     *
     * @returns - True if the path can be edited, false otherwise.
     *
     * @memberof BingPolyline
     */
    GetEditable(): boolean;
    /**
     * Gets the polyline path.
     *
     * @returns - Array of {@link ILatLong} objects describing the polyline path.
     *
     * @memberof BingPolyline
     */
    GetPath(): Array<ILatLong>;
    /**
     * Gets whether the polyline is visible.
     *
     * @returns - True if the polyline is visible, false otherwise.
     *
     * @memberof BingPolyline
     */
    GetVisible(): boolean;
    /**
     * Sets whether the polyline is dragable.
     *
     * @param draggable - True to make the polyline dragable, false otherwise.
     *
     * @memberof BingPolyline
     */
    SetDraggable(draggable: boolean): void;
    /**
     * Sets wether the polyline path is editable.
     *
     * @param editable - True to make polyline path editable, false otherwise.
     *
     * @memberof BingPolyline
     */
    SetEditable(editable: boolean): void;
    /**
     * Sets the polyline options
     *
     * @param options - {@link ILatLong} object containing the options. The options are merged with hte ones
     * already on the underlying model.
     *
     * @memberof BingPolyline
     */
    SetOptions(options: IPolylineOptions): void;
    /**
     * Sets the polyline path.
     *
     * @param path - An Array of {@link ILatLong} (or array of arrays) describing the polylines path.
     *
     * @memberof BingPolyline
     */
    SetPath(path: Array<ILatLong>): void;
    /**
     * Sets whether the polyline is visible.
     *
     * @param visible - True to set the polyline visible, false otherwise.
     *
     * @memberof BingPolyline
     */
    SetVisible(visible: boolean): void;
    /**
     * Configures the tooltip for the polygon
     * @memberof Polygon
     */
    private ManageTooltip;
}
