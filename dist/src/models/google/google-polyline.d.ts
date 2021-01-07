import { ILatLong } from '../../interfaces/ilatlong';
import { IPolylineOptions } from '../../interfaces/ipolyline-options';
import * as GoogleMapTypes from '../../services/google/google-map-types';
import { Polyline } from '../polyline';
/**
 * Concrete implementation for a polyline model for Google Maps.
 *
 * @export
 */
export declare class GooglePolyline extends Polyline implements Polyline {
    private _polyline;
    private _title;
    private _showTooltip;
    private _tooltip;
    private _tooltipVisible;
    private _hasToolTipReceiver;
    private _mouseOverListener;
    private _mouseOutListener;
    private _mouseMoveListener;
    private _metadata;
    /**
     * Gets the polyline metadata.
     *
     * @readonly
     * @memberof GooglePolyline
     */
    get Metadata(): Map<string, any>;
    /**
     * Gets the native primitve implementing the marker, in this case {@link GoogleMApTypes.Polyline}
     *
     * @readonly
     * @memberof GooglePolygon
     */
    get NativePrimitve(): GoogleMapTypes.Polyline;
    /**
     * Gets or sets whether to show the tooltip
     *
     * @abstract
     * @memberof GooglePolygon
     * @property
     */
    get ShowTooltip(): boolean;
    set ShowTooltip(val: boolean);
    /**
     * Gets or sets the title off the polygon
     *
     * @abstract
     * @memberof GooglePolygon
     * @property
     */
    get Title(): string;
    set Title(val: string);
    /**
    * Creates an instance of GooglePolygon.
    * @param _polyline - The {@link GoogleMApTypes.Polyline} underlying the model.
    *
    * @memberof GooglePolyline
    */
    constructor(_polyline: GoogleMapTypes.Polyline);
    /**
     * Adds a delegate for an event.
     *
     * @param eventType - String containing the event name.
     * @param fn - Delegate function to execute when the event occurs.
     * @memberof Polyline
     */
    AddListener(eventType: string, fn: Function): void;
    /**
     * Deleted the polyline.
     *
     *
     * @memberof Polyline
     */
    Delete(): void;
    /**
     * Gets whether the polyline is draggable.
     *
     * @returns - True if the polyline is dragable, false otherwise.
     *
     * @memberof Polyline
     */
    GetDraggable(): boolean;
    /**
     * Gets whether the polyline path can be edited.
     *
     * @returns - True if the path can be edited, false otherwise.
     *
     * @memberof Polyline
     */
    GetEditable(): boolean;
    /**
     * Gets the polyline path.
     *
     * @returns - Array of {@link ILatLong} objects describing the polyline path.
     *
     * @memberof Polyline
     */
    GetPath(): Array<ILatLong>;
    /**
     * Gets whether the polyline is visible.
     *
     * @returns - True if the polyline is visible, false otherwise.
     *
     * @memberof Polyline
     */
    GetVisible(): boolean;
    /**
     * Sets whether the polyline is dragable.
     *
     * @param draggable - True to make the polyline dragable, false otherwise.
     *
     * @memberof Polyline
     */
    SetDraggable(draggable: boolean): void;
    /**
     * Sets wether the polyline path is editable.
     *
     * @param editable - True to make polyline path editable, false otherwise.
     *
     * @memberof Polyline
     */
    SetEditable(editable: boolean): void;
    /**
     * Sets the polyline options
     *
     * @param options - {@link ILatLong} object containing the options. The options are merged with hte ones
     * already on the underlying model.
     *
     * @memberof Polyline
     */
    SetOptions(options: IPolylineOptions): void;
    /**
     * Sets the polyline path.
     *
     * @param path - An Array of {@link ILatLong} (or array of arrays) describing the polylines path.
     *
     * @memberof Polyline
     */
    SetPath(path: Array<ILatLong>): void;
    /**
     * Sets whether the polyline is visible.
     *
     * @param visible - True to set the polyline visible, false otherwise.
     *
     * @memberof Polyline
     */
    SetVisible(visible: boolean): void;
    /**
     * Configures the tooltip for the polyline
     * @memberof GooglePolyline
     */
    private ManageTooltip;
}
