import { ILatLong } from '../interfaces/ilatlong';
import { IMarkerOptions } from '../interfaces/imarker-options';
import { IMarkerIconInfo } from '../interfaces/imarker-icon-info';
import { IPoint } from '../interfaces/ipoint';
/**
 * This class defines the contract for a marker.
 *
 * @export
 * @abstract
 */
export declare abstract class Marker {
    /**
     * Caches concrete img elements for marker icons to accelerate patining.
     *
     * @memberof Marker
     */
    private static ImageElementCache;
    /**
     * Used to cache generated markers for performance and reusability.
     *
     * @memberof Marker
     */
    private static MarkerCache;
    /**
     * Creates a marker based on the marker info. In turn calls a number of internal members to
     * create the actual marker.
     *
     * @param iconInfo - icon information. Depending on the marker type, various properties
     * need to be present. For performance, it is recommended to use an id for markers that are common to facilitate
     * reuse.
     * @param callback - a callback that is invoked on markers that require asyncronous
     * processing during creation. For markers that do not require async processing, this parameter is ignored.
     * @returns - a string or a promise for a string containing
     * a data url with the marker image.
     * @memberof Marker
     */
    static CreateMarker(iconInfo: IMarkerIconInfo): string | Promise<{
        icon: string;
        iconInfo: IMarkerIconInfo;
    }>;
    /**
     * Obtains a shared img element for a marker icon to prevent unecessary creation of
     * DOM items. This has sped up large scale makers on Bing Maps by about 70%
     * @param icon - The icon string (url, data url, svg) for which to obtain the image.
     * @returns - The obtained image element.
     * @memberof Marker
     */
    static GetImageForMarker(icon: string): HTMLImageElement;
    /**
     * Creates a canvased based marker using the point collection contained in the iconInfo parameter.
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @returns - String with the data url for the marker image.
     *
     * @memberof Marker
     */
    protected static CreateCanvasMarker(iconInfo: IMarkerIconInfo): string;
    /**
     * Creates a circle marker image using information contained in the iconInfo parameter.
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @returns - String with the data url for the marker image.
     *
     * @memberof Marker
     */
    protected static CreateDynamicCircleMarker(iconInfo: IMarkerIconInfo): string;
    /**
     * Creates a font based marker image (such as Font-Awesome), by using information supplied in the parameters (such as Font-Awesome).
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @returns - String with the data url for the marker image.
     *
     * @memberof Marker
     */
    protected static CreateFontBasedMarker(iconInfo: IMarkerIconInfo): string;
    /**
     * Creates an image marker by applying a roation to a supplied image.
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @returns - a string or a promise for a string containing
     * a data url with the marker image. In case of a cached image, the image will be returned, otherwise the promise.
     *
     * @memberof Marker
     */
    protected static CreateRotatedImageMarker(iconInfo: IMarkerIconInfo): string | Promise<{
        icon: string;
        iconInfo: IMarkerIconInfo;
    }>;
    /**
     * Creates a rounded image marker by applying a circle mask to a supplied image.
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @param iconInfo - Callback invoked once marker generation is complete. The callback
     * parameters are the data uri and the IMarkerIconInfo.
     * @returns - a string or a promise for a string containing
     * a data url with the marker image. In case of a cached image, the image will be returned, otherwise the promise.
     *
     * @memberof Marker
     */
    protected static CreateRoundedImageMarker(iconInfo: IMarkerIconInfo): string | Promise<{
        icon: string;
        iconInfo: IMarkerIconInfo;
    }>;
    /**
     * Creates a scaled image marker by scaling a supplied image by a factor using a canvas.
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @param iconInfo - Callback invoked once marker generation is complete. The callback
     * parameters are the data uri and the IMarkerIconInfo.
     * @returns - a string or a promise for a string containing
     * a data url with the marker image. In case of a cached image, the image will be returned, otherwise the promise.
     *
     * @memberof Marker
     */
    protected static CreateScaledImageMarker(iconInfo: IMarkerIconInfo): string | Promise<{
        icon: string;
        iconInfo: IMarkerIconInfo;
    }>;
    /**
     * Indicates that the marker is the first marker in a set.
     *
     * @abstract
     * @memberof Marker
     */
    abstract get IsFirst(): boolean;
    abstract set IsFirst(val: boolean);
    /**
     * Indicates that the marker is the last marker in the set.
     *
     * @abstract
     * @memberof Marker
     */
    abstract get IsLast(): boolean;
    abstract set IsLast(val: boolean);
    /**
     * Gets the Location of the marker
     *
     * @readonly
     * @abstract
     * @memberof Marker
     */
    abstract get Location(): ILatLong;
    /**
     * Gets the marker metadata.
     *
     * @readonly
     * @abstract
     * @memberof Marker
     */
    abstract get Metadata(): Map<string, any>;
    /**
     * Gets the native primitve implementing the marker (e.g. Microsoft.Maps.Pushpin)
     *
     * @readonly
     * @abstract
     * @memberof Marker
     */
    abstract get NativePrimitve(): any;
    /**
     * Adds an event listener to the marker.
     *
     * @abstract
     * @param eventType - String containing the event for which to register the listener (e.g. "click")
     * @param fn - Delegate invoked when the event occurs.
     *
     * @memberof Marker
     */
    abstract AddListener(eventType: string, fn: Function): void;
    /**
     * Deletes the marker.
     *
     * @abstract
     *
     * @memberof Marker
     */
    abstract DeleteMarker(): void;
    /**
     * Gets the marker label
     *
     * @abstract
     *
     * @memberof Marker
     */
    abstract GetLabel(): string;
    /**
     * Gets the marker visibility
     *
     * @abstract
     *
     * @memberof Marker
     */
    abstract GetVisible(): boolean;
    /**
     * Sets the anchor for the marker. Use this to adjust the root location for the marker to accomodate various marker image sizes.
     *
     * @abstract
     * @param anchor - Point coordinates for the marker anchor.
     *
     * @memberof Marker
     */
    abstract SetAnchor(anchor: IPoint): void;
    /**
     * Sets the draggability of a marker.
     *
     * @abstract
     * @param draggable - True to mark the marker as draggable, false otherwise.
     *
     * @memberof Marker
     */
    abstract SetDraggable(draggable: boolean): void;
    /**
     * Sets the icon for the marker.
     *
     * @abstract
     * @param icon - String containing the icon in various forms (url, data url, etc.)
     *
     * @memberof Marker
     */
    abstract SetIcon(icon: string): void;
    /**
     * Sets the marker label.
     *
     * @abstract
     * @param label - String containing the label to set.
     *
     * @memberof Marker
     */
    abstract SetLabel(label: string): void;
    /**
     * Sets the marker position.
     *
     * @abstract
     * @param latLng - Geo coordinates to set the marker position to.
     *
     * @memberof Marker
     */
    abstract SetPosition(latLng: ILatLong): void;
    /**
     * Sets the marker title.
     *
     * @abstract
     * @param title - String containing the title to set.
     *
     * @memberof Marker
     */
    abstract SetTitle(title: string): void;
    /**
     * Sets the marker options.
     *
     * @abstract
     * @param options - {@link IMarkerOptions} object containing the marker options to set. The supplied options are
     * merged with the underlying marker options.
     * @memberof Marker
     */
    abstract SetOptions(options: IMarkerOptions): void;
    /**
     * Sets the visiblilty of the marker.
     *
     * @abstract
     * @param visible - Boolean which determines if the marker is visible or not.
     *
     * @memberof Marker
     */
    abstract SetVisible(visible: boolean): void;
}
