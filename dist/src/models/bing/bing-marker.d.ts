import { ILatLong } from '../../interfaces/ilatlong';
import { IPoint } from '../../interfaces/ipoint';
import { IMarkerOptions } from '../../interfaces/imarker-options';
import { Marker } from '../marker';
/**
 * Concrete implementation of the {@link Marker} contract for the Bing Maps V8 map architecture.
 *
 * @export
 */
export declare class BingMarker implements Marker {
    private _pushpin;
    protected _map: Microsoft.Maps.Map;
    protected _layer: Microsoft.Maps.Layer;
    private _metadata;
    private _isFirst;
    private _isLast;
    /**
     * Indicates that the marker is the first marker in a set.
     *
     * @memberof Marker
     */
    get IsFirst(): boolean;
    set IsFirst(val: boolean);
    /**
     * Indicates that the marker is the last marker in the set.
     *
     * @memberof Marker
     */
    get IsLast(): boolean;
    set IsLast(val: boolean);
    /**
     * Gets the Location of the marker
     *
     * @readonly
     * @memberof BingMarker
     */
    get Location(): ILatLong;
    /**
     * Gets the marker metadata.
     *
     * @readonly
     * @memberof BingMarker
     */
    get Metadata(): Map<string, any>;
    /**
     * Gets the native primitve implementing the marker, in this case {@link Microsoft.Maps.Pushpin}
     *
     * @readonly
     * @memberof BingMarker
     */
    get NativePrimitve(): any;
    /**
     * Creates an instance of BingMarker.
     * @param _pushpin - The {@link Microsoft.Maps.Pushpin} underlying the model.
     * @param _map - The context map.
     * @param _layer - The context layer.
     *
     * @memberof BingMarker
     */
    constructor(_pushpin: Microsoft.Maps.Pushpin, _map: Microsoft.Maps.Map, _layer: Microsoft.Maps.Layer);
    /**
     * Adds an event listener to the marker.
     *
     * @abstract
     * @param eventType - String containing the event for which to register the listener (e.g. "click")
     * @param fn - Delegate invoked when the event occurs.
     *
     * @memberof BingMarker
     */
    AddListener(eventType: string, fn: Function): void;
    /**
     * Deletes the marker.
     *
     * @abstract
     *
     * @memberof BingMarker
     */
    DeleteMarker(): void;
    /**
     * Gets the marker label
     *
     * @abstract
     *
     * @memberof BingMarker
     */
    GetLabel(): string;
    /**
     * Gets whether the marker is visible.
     *
     * @returns - True if the marker is visible, false otherwise.
     *
     * @memberof BingMarker
     */
    GetVisible(): boolean;
    /**
     * Sets the anchor for the marker. Use this to adjust the root location for the marker to accomodate various marker image sizes.
     *
     * @abstract
     * @param anchor - Point coordinates for the marker anchor.
     *
     * @memberof BingMarker
     */
    SetAnchor(anchor: IPoint): void;
    /**
     * Sets the draggability of a marker.
     *
     * @abstract
     * @param draggable - True to mark the marker as draggable, false otherwise.
     *
     * @memberof BingMarker
     */
    SetDraggable(draggable: boolean): void;
    /**
     * Sets the icon for the marker.
     *
     * @abstract
     * @param icon - String containing the icon in various forms (url, data url, etc.)
     *
     * @memberof BingMarker
     */
    SetIcon(icon: string): void;
    /**
     * Sets the marker label.
     *
     * @abstract
     * @param label - String containing the label to set.
     *
     * @memberof BingMarker
     */
    SetLabel(label: string): void;
    /**
     * Sets the marker position.
     *
     * @abstract
     * @param latLng - Geo coordinates to set the marker position to.
     *
     * @memberof BingMarker
     */
    SetPosition(latLng: ILatLong): void;
    /**
     * Sets the marker title.
     *
     * @abstract
     * @param title - String containing the title to set.
     *
     * @memberof BingMarker
     */
    SetTitle(title: string): void;
    /**
     * Sets the marker options.
     *
     * @abstract
     * @param options - {@link IMarkerOptions} object containing the marker options to set. The supplied options are
     * merged with the underlying marker options.
     * @memberof Marker
     */
    SetOptions(options: IMarkerOptions): void;
    /**
     * Sets whether the marker is visible.
     *
     * @param visible - True to set the marker visible, false otherwise.
     *
     * @memberof Marker
     */
    SetVisible(visible: boolean): void;
}
