import { IMapOptions } from '../../interfaces/imap-options';
import { IBox } from '../../interfaces/ibox';
import { ILatLong } from '../../interfaces/ilatlong';
import { IMarkerOptions } from '../../interfaces/imarker-options';
import { IClusterOptions } from '../../interfaces/icluster-options';
import { IInfoWindowOptions } from '../../interfaces/iinfo-window-options';
import { IInfoWindowAction } from '../../interfaces/iinfo-window-action';
import { IPolygonOptions } from '../../interfaces/ipolygon-options';
import { IPolylineOptions } from '../../interfaces/ipolyline-options';
import { IPoint } from '../../interfaces/ipoint';
/**
 * This class contains helperfunctions to map various interfaces used to represent options and structures into the
 * corresponding Bing Maps V8 specific implementations.
 *
 * @export
 */
export declare class BingConversions {
    /**
     * Map option attributes that are supported for conversion to Bing Map properties
     *
     * @memberof BingConversions
     */
    private static _mapOptionsAttributes;
    /**
     * View option attributes that are supported for conversion to Bing Map properties
     *
     * @memberof BingConversions
     */
    private static _viewOptionsAttributes;
    /**
     * InfoWindow option attributes that are supported for conversion to Bing Map properties
     *
     * @memberof BingConversions
     */
    private static _infoWindowOptionsAttributes;
    /**
     * Marker option attributes that are supported for conversion to Bing Map properties
     *
     * @memberof BingConversions
     */
    private static _markerOptionsAttributes;
    /**
     * Polygon option attributes that are supported for conversion to Bing Map Polygon properties
     *
     * @memberof BingConversions
     */
    private static _polygonOptionsAttributes;
    /**
     * Polyline option attributes that are supported for conversion to Bing Map Polyline properties
     *
     * @memberof BingConversions
     */
    private static _polylineOptionsAttributes;
    /**
     * Cluster option attributes that are supported for conversion to Bing Map properties
     *
     * @memberof BingConversions
     */
    private static _clusterOptionsAttributes;
    /**
     * Maps an IInfoWindowAction to a Microsoft.Maps.IInfoboxActions
     *
     * @param action - Object to be mapped.
     * @returns - Navtive mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateAction(action: IInfoWindowAction): Microsoft.Maps.IInfoboxActions;
    /**
     * Maps an Array of IInfoWindowAction to an Array of Microsoft.Maps.IInfoboxActions
     *
     * @param actions - Array of objects to be mapped.
     * @returns - Array of mapped objects.
     *
     * @memberof BingConversions
     */
    static TranslateActions(actions: Array<IInfoWindowAction>): Array<Microsoft.Maps.IInfoboxActions>;
    /**
     * Maps an IBox object to a Microsoft.Maps.LocationRect object.
     *
     * @param box - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateBounds(box: IBox): Microsoft.Maps.LocationRect;
    /**
     * Maps an IClusterOptions object to a Microsoft.Maps.IClusterLayerOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateClusterOptions(options: IClusterOptions): Microsoft.Maps.IClusterLayerOptions;
    /**
     * Maps an IInfoWindowOptions object to a Microsoft.Maps.IInfoboxOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateInfoBoxOptions(options: IInfoWindowOptions): Microsoft.Maps.IInfoboxOptions;
    /**
     * Maps an IMapOptions object to a Microsoft.Maps.IMapLoadOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateLoadOptions(options: IMapOptions): Microsoft.Maps.IMapLoadOptions;
    /**
     * Maps an ILatLong object to a Microsoft.Maps.Location object.
     *
     * @param latlong - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateLocation(latlong: ILatLong): Microsoft.Maps.Location;
    /**
     * Maps an IMarkerOptions object to a Microsoft.Maps.IPushpinOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - The mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateMarkerOptions(options: IMarkerOptions): Microsoft.Maps.IPushpinOptions;
    /**
     * Maps an IMapOptions object to a Microsoft.Maps.IMapOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateOptions(options: IMapOptions): Microsoft.Maps.IMapOptions;
    /**
     * Translates an array of locations or an array or arrays of location to and array of arrays of Bing Map Locations
     *
     * @param paths - ILatLong based locations to convert.
     * @returns - converted locations.
     *
     * @memberof BingConversions
     */
    static TranslatePaths(paths: Array<ILatLong> | Array<Array<ILatLong>>): Array<Array<Microsoft.Maps.Location>>;
    /**
     *  Maps an IPoint object to a Microsoft.Maps.Point object.
     *
     * @param point - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslatePoint(point: IPoint): Microsoft.Maps.Point;
    /**
     *  Maps an IPolygonOptions object to a Microsoft.Maps.IPolygonOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslatePolygonOptions(options: IPolygonOptions): Microsoft.Maps.IPolygonOptions;
    /**
     *  Maps an IPolylineOptions object to a Microsoft.Maps.IPolylineOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslatePolylineOptions(options: IPolylineOptions): Microsoft.Maps.IPolylineOptions;
    /**
     * Maps an IMapOptions object to a Microsoft.Maps.IViewOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateViewOptions(options: IMapOptions): Microsoft.Maps.IViewOptions;
}
