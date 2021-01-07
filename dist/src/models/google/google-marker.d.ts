import { IMarkerOptions } from '../../interfaces/imarker-options';
import { ILatLong } from '../../interfaces/ilatlong';
import { Marker } from '../marker';
import * as GoogleMapTypes from '../../services/google/google-map-types';
/**
 * Concrete implementation of the {@link Marker} contract for the Google Maps map architecture.
 *
 * @export
 */
export declare class GoogleMarker implements Marker {
    private _marker;
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
     * @abstract
     * @memberof BingMarker
     */
    get NativePrimitve(): GoogleMapTypes.Marker;
    /**
     * Gets the Location of the marker
     *
     * @readonly
     * @abstract
     * @memberof BingMarker
     */
    get Location(): ILatLong;
    /**
     * Creates an instance of GoogleMarker.
     * @param _marker
     *
     * @memberof GoogleMarker
     */
    constructor(_marker: GoogleMapTypes.Marker);
    /**
     * Adds an event listener to the marker.
     *
     * @param eventType - String containing the event for which to register the listener (e.g. "click")
     * @param fn - Delegate invoked when the event occurs.
     *
     * @memberof GoogleMarker
     */
    AddListener(eventType: string, fn: Function): void;
    /**
     * Deletes the marker.
     *
     *
     * @memberof GoogleMarker
     */
    DeleteMarker(): void;
    /**
     * Gets the marker label
     *
     * @memberof GoogleMarker
     */
    GetLabel(): string;
    /**
     * Gets whether the marker is visible.
     *
     * @returns - True if the marker is visible, false otherwise.
     *
     * @memberof GoogleMarker
     */
    GetVisible(): boolean;
    /**
     * Sets the anchor for the marker. Use this to adjust the root location for the marker to accomodate various marker image sizes.
     *
     * @param anchor - Point coordinates for the marker anchor.
     *
     * @memberof GoogleMarker
     */
    SetAnchor(anchor: any): void;
    /**
     * Sets the draggability of a marker.
     *
     * @param draggable - True to mark the marker as draggable, false otherwise.
     *
     * @memberof GoogleMarker
     */
    SetDraggable(draggable: boolean): void;
    /**
     * Sets the icon for the marker.
     *
     * @param icon - String containing the icon in various forms (url, data url, etc.)
     *
     * @memberof GoogleMarker
     */
    SetIcon(icon: string): void;
    /**
     * Sets the marker label.
     *
     * @param label - String containing the label to set.
     *
     * @memberof GoogleMarker
     */
    SetLabel(label: string): void;
    /**
     * Sets the marker position.
     *
     * @param latLng - Geo coordinates to set the marker position to.
     *
     * @memberof GoogleMarker
     */
    SetPosition(latLng: ILatLong): void;
    /**
     * Sets the marker title.
     *
     * @param title - String containing the title to set.
     *
     * @memberof GoogleMarker
     */
    SetTitle(title: string): void;
    /**
     * Sets the marker options.
     *
     * @param options - {@link IMarkerOptions} object containing the marker options to set. The supplied options are
     * merged with the underlying marker options.
     *
     * @memberof GoogleMarker
     */
    SetOptions(options: IMarkerOptions): void;
    /**
     * Sets whether the marker is visible.
     *
     * @param visible - True to set the marker visible, false otherwise.
     *
     * @memberof GoogleMarker
     */
    SetVisible(visible: boolean): void;
}
