import { IInfoWindowOptions } from '../../interfaces/iinfo-window-options';
import { IBox } from '../../interfaces/ibox';
import { IMapOptions } from '../../interfaces/imap-options';
import { IMarkerOptions } from '../../interfaces/imarker-options';
import { IPolygonOptions } from '../../interfaces/ipolygon-options';
import { IPolylineOptions } from '../../interfaces/ipolyline-options';
import { ILatLong } from '../../interfaces/ilatlong';
import * as GoogleMapTypes from './google-map-types';
import { MapTypeId } from '../../models/map-type-id';
/**
 * This class contains helperfunctions to map various interfaces used to represent options and structures into the
 * corresponding Google Maps specific implementations.
 *
 * @export
 */
export declare class GoogleConversions {
    /**
     * Map option attributes that are supported for conversion to Google Map properties
     *
     * @memberof GoogleConversions
     */
    private static _mapOptionsAttributes;
    /**
     * InfoWindow option attributes that are supported for conversion to Google Map properties
     *
     * @memberof GoogleConversions
     */
    private static _infoWindowOptionsAttributes;
    /**
     * Marker option attributes that are supported for conversion to Google Map properties
     *
     * @memberof GoogleConversions
     */
    private static _markerOptionsAttributes;
    /**
     * Cluster option attributes that are supported for conversion to Google Map properties
     *
     * @memberof GoogleConversions
     */
    private static _clusterOptionsAttributes;
    /**
     * Polygon option attributes that are supported for conversion to Google Map properties
     *
     * @memberof GoogleConversions
     */
    private static _polygonOptionsAttributes;
    /**
     * Polyline option attributes that are supported for conversion to Google Map properties
     *
     * @memberof GoogleConversions
     */
    private static _polylineOptionsAttributes;
    /**
     * Maps an IBox object to a GoogleMapTypes.LatLngBoundsLiteral object.
     *
     * @param bounds - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateBounds(bounds: IBox): GoogleMapTypes.LatLngBoundsLiteral;
    /**
     * Maps an IInfoWindowOptions object to a GoogleMapTypes.InfoWindowOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateInfoWindowOptions(options: IInfoWindowOptions): GoogleMapTypes.InfoWindowOptions;
    /**
     * Maps an ILatLong object to a GoogleMapTypes.LatLngLiteral object.
     *
     * @param latlong - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLocation(latlong: ILatLong): GoogleMapTypes.LatLngLiteral;
    /**
     * Maps an GoogleMapTypes.LatLngLiteral object to a ILatLong object.
     *
     * @param latlng - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLatLng(latlng: GoogleMapTypes.LatLngLiteral): ILatLong;
    /**
     * Maps an ILatLong object to a GoogleMapTypes.LatLng object.
     *
     * @param latlong - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLocationObject(latlong: ILatLong): GoogleMapTypes.LatLng;
    /**
     * Maps an GoogleMapTypes.LatLng object to a ILatLong object.
     *
     * @param latlng - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLatLngObject(latlng: GoogleMapTypes.LatLng): ILatLong;
    /**
     * Maps an ILatLong array to a array of GoogleMapTypes.LatLng object.
     *
     * @param latlongArray - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLocationObjectArray(latlongArray: Array<ILatLong>): Array<GoogleMapTypes.LatLng>;
    /**
     * Maps a MapTypeId object to a Google maptype string.
     *
     * @param mapTypeId - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateMapTypeId(mapTypeId: MapTypeId): string;
    /**
     * Maps an IMarkerOptions object to a GoogleMapTypes.MarkerOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Promise that when resolved contains the mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateMarkerOptions(options: IMarkerOptions): GoogleMapTypes.MarkerOptions;
    /**
     * Maps an IMapOptions object to a GoogleMapTypes.MapOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateOptions(options: IMapOptions): GoogleMapTypes.MapOptions;
    /**
     * Translates an array of locations or an array or arrays of location to and array of arrays of Bing Map Locations
     *
     * @param paths - ILatLong based locations to convert.
     * @returns - converted locations.
     *
     * @memberof GoogleConversions
     */
    static TranslatePaths(paths: Array<ILatLong> | Array<Array<ILatLong>>): Array<Array<GoogleMapTypes.LatLng>>;
    /**
     *  Maps an IPolygonOptions object to a GoogleMapTypes.PolygonOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslatePolygonOptions(options: IPolygonOptions): GoogleMapTypes.PolygonOptions;
    /**
     *  Maps an IPolylineOptions object to a GoogleMapTypes.PolylineOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslatePolylineOptions(options: IPolylineOptions): GoogleMapTypes.PolylineOptions;
}
