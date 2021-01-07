import * as GoogleMapTypes from './google-map-types';
import { MapTypeId } from '../../models/map-type-id';
/**
 * This class contains helperfunctions to map various interfaces used to represent options and structures into the
 * corresponding Google Maps specific implementations.
 *
 * @export
 */
export class GoogleConversions {
    /**
     * Maps an IBox object to a GoogleMapTypes.LatLngBoundsLiteral object.
     *
     * @param bounds - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateBounds(bounds) {
        const b = {
            east: bounds.maxLongitude,
            north: bounds.maxLatitude,
            south: bounds.minLatitude,
            west: bounds.minLongitude,
        };
        return b;
    }
    /**
     * Maps an IInfoWindowOptions object to a GoogleMapTypes.InfoWindowOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateInfoWindowOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => GoogleConversions._infoWindowOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'htmlContent') {
                o.content = options[k];
            }
            else {
                o[k] = options[k];
            }
        });
        if (o.content == null || o.content === '') {
            if (options.title !== '' && options.description !== '') {
                o.content = `${options.title}: ${options.description}`;
            }
            else if (options.description !== '') {
                o.content = options.description;
            }
            else {
                o.content = options.title;
            }
        }
        return o;
    }
    /**
     * Maps an ILatLong object to a GoogleMapTypes.LatLngLiteral object.
     *
     * @param latlong - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLocation(latlong) {
        const l = { lat: latlong.latitude, lng: latlong.longitude };
        return l;
    }
    /**
     * Maps an GoogleMapTypes.LatLngLiteral object to a ILatLong object.
     *
     * @param latlng - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLatLng(latlng) {
        const l = { latitude: latlng.lat, longitude: latlng.lng };
        return l;
    }
    /**
     * Maps an ILatLong object to a GoogleMapTypes.LatLng object.
     *
     * @param latlong - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLocationObject(latlong) {
        const l = new google.maps.LatLng(latlong.latitude, latlong.longitude);
        return l;
    }
    /**
     * Maps an GoogleMapTypes.LatLng object to a ILatLong object.
     *
     * @param latlng - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLatLngObject(latlng) {
        const l = { latitude: latlng.lat(), longitude: latlng.lng() };
        return l;
    }
    /**
     * Maps an ILatLong array to a array of GoogleMapTypes.LatLng object.
     *
     * @param latlongArray - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLocationObjectArray(latlongArray) {
        // use for loop for performance in case we deal with large numbers of points and paths...
        const p = new Array();
        for (let i = 0; i < latlongArray.length; i++) {
            p.push(GoogleConversions.TranslateLocationObject(latlongArray[i]));
        }
        return p;
    }
    /**
     * Maps a MapTypeId object to a Google maptype string.
     *
     * @param mapTypeId - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateMapTypeId(mapTypeId) {
        switch (mapTypeId) {
            case MapTypeId.road: return GoogleMapTypes.MapTypeId[GoogleMapTypes.MapTypeId.roadmap];
            case MapTypeId.grayscale: return GoogleMapTypes.MapTypeId[GoogleMapTypes.MapTypeId.terrain];
            case MapTypeId.hybrid: return GoogleMapTypes.MapTypeId[GoogleMapTypes.MapTypeId.hybrid];
            case MapTypeId.ordnanceSurvey: return GoogleMapTypes.MapTypeId[GoogleMapTypes.MapTypeId.terrain];
            default: return GoogleMapTypes.MapTypeId[GoogleMapTypes.MapTypeId.satellite];
        }
    }
    /**
     * Maps an IMarkerOptions object to a GoogleMapTypes.MarkerOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Promise that when resolved contains the mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateMarkerOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => GoogleConversions._markerOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'position') {
                const latlng = GoogleConversions.TranslateLocationObject(options[k]);
                o.position = latlng;
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an IMapOptions object to a GoogleMapTypes.MapOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => GoogleConversions._mapOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'center') {
                o.center = GoogleConversions.TranslateLocation(options.center);
            }
            else if (k === 'mapTypeId') {
                o.mapTypeId = GoogleConversions.TranslateMapTypeId(options.mapTypeId);
            }
            else if (k === 'disableZooming') {
                o.gestureHandling = 'none';
                o.zoomControl = false;
            }
            else if (k === 'showMapTypeSelector') {
                o.mapTypeControl = false;
            }
            else if (k === 'customMapStyleGoogle') {
                o.styles = options.customMapStyleGoogle;
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Translates an array of locations or an array or arrays of location to and array of arrays of Bing Map Locations
     *
     * @param paths - ILatLong based locations to convert.
     * @returns - converted locations.
     *
     * @memberof GoogleConversions
     */
    static TranslatePaths(paths) {
        const p = new Array();
        if (paths == null || !Array.isArray(paths) || paths.length === 0) {
            p.push(new Array());
        }
        else if (Array.isArray(paths[0])) {
            // parameter is an array or arrays
            // use for loop for performance in case we deal with large numbers of points and paths...
            const p1 = paths;
            for (let i = 0; i < p1.length; i++) {
                p.push(GoogleConversions.TranslateLocationObjectArray(p1[i]));
            }
        }
        else {
            // parameter is a simple array....
            p.push(GoogleConversions.TranslateLocationObjectArray(paths));
        }
        return p;
    }
    /**
     *  Maps an IPolygonOptions object to a GoogleMapTypes.PolygonOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslatePolygonOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => GoogleConversions._polygonOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'paths') {
                if (!Array.isArray(options.paths)) {
                    return;
                }
                if (options.paths.length === 0) {
                    o.paths = new Array();
                }
                else if (Array.isArray(options.paths[0])) {
                    o.paths = new Array();
                    // use for loop for performance in case we deal with large numbers of points and paths..
                    const p1 = options.paths;
                    for (let i = 0; i < p1.length; i++) {
                        o.paths[i] = new Array();
                        for (let j = 0; j < p1[i].length; j++) {
                            o.paths[i][j] = { lat: p1[i][j].latitude, lng: p1[i][j].longitude };
                        }
                    }
                }
                else {
                    o.paths = new Array();
                    // use for loop for performance in case we deal with large numbers of points and paths..
                    const p1 = options.paths;
                    for (let i = 0; i < p1.length; i++) {
                        o.paths[i] = { lat: p1[i].latitude, lng: p1[i].longitude };
                    }
                }
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     *  Maps an IPolylineOptions object to a GoogleMapTypes.PolylineOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslatePolylineOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => GoogleConversions._polylineOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            o[k] = options[k];
        });
        return o;
    }
}
///
/// Field declarations
///
/**
 * Map option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._mapOptionsAttributes = [
    'backgroundColor',
    'center',
    'clickableIcons',
    'customMapStyleGoogle',
    'disableDefaultUI',
    'disableDoubleClickZoom',
    'draggable',
    'draggableCursor',
    'draggingCursor',
    'disableZooming',
    'fullscreenControl',
    'fullscreenControlOptions',
    'gestureHandling',
    'heading',
    'keyboardShortcuts',
    'mapTypeControl',
    'mapTypeControlOptions',
    'mapTypeId',
    'maxZoom',
    'minZoom',
    'noClear',
    'panControl',
    'panControlOptions',
    'rotateControl',
    'rotateControlOptions',
    'scaleControl',
    'scaleControlOptions',
    'scrollwheel',
    'showMapTypeSelector',
    'streetView',
    'streetViewControl',
    'streetViewControlOptions',
    'styles',
    'tilt',
    'zoom',
    'zoomControl',
    'zoomControlOptions'
];
/**
 * InfoWindow option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._infoWindowOptionsAttributes = [
    'actions',
    'description',
    'htmlContent',
    'id',
    'position',
    'pixelOffset',
    'showCloseButton',
    'showPointer',
    'pushpin',
    'title',
    'titleClickHandler',
    'typeName',
    'visible',
    'width',
    'height'
];
/**
 * Marker option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._markerOptionsAttributes = [
    'anchor',
    'position',
    'title',
    'text',
    'label',
    'draggable',
    'icon',
    'width',
    'height',
    'iconInfo',
    'metadata',
    'visible'
];
/**
 * Cluster option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._clusterOptionsAttributes = [
    'callback',
    'clusteredPinCallback',
    'clusteringEnabled',
    'gridSize',
    'layerOffset',
    'placementMode',
    'visible',
    'zIndex'
];
/**
 * Polygon option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._polygonOptionsAttributes = [
    'clickable',
    'draggable',
    'editable',
    'fillColor',
    'fillOpacity',
    'geodesic',
    'paths',
    'strokeColor',
    'strokeOpacity',
    'strokeWeight',
    'visible',
    'zIndex'
];
/**
 * Polyline option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._polylineOptionsAttributes = [
    'clickable',
    'draggable',
    'editable',
    'geodesic',
    'strokeColor',
    'strokeOpacity',
    'strokeWeight',
    'visible',
    'zIndex'
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLWNvbnZlcnNpb25zLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL3NlcnZpY2VzL2dvb2dsZS9nb29nbGUtY29udmVyc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBT0EsT0FBTyxLQUFLLGNBQWMsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFLckQ7Ozs7O0dBS0c7QUFDSCxNQUFNLE9BQU8saUJBQWlCO0lBbUoxQjs7Ozs7OztPQU9HO0lBQ0ksTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFZO1FBQ3RDLE1BQU0sQ0FBQyxHQUF1QztZQUMxQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFlBQVk7WUFDekIsS0FBSyxFQUFFLE1BQU0sQ0FBQyxXQUFXO1lBQ3pCLEtBQUssRUFBRSxNQUFNLENBQUMsV0FBVztZQUN6QixJQUFJLEVBQUUsTUFBTSxDQUFDLFlBQVk7U0FDNUIsQ0FBQztRQUNGLE9BQU8sQ0FBQyxDQUFDO0lBQ2IsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxNQUFNLENBQUMsMEJBQTBCLENBQUMsT0FBMkI7UUFDaEUsTUFBTSxDQUFDLEdBQTJDLEVBQUUsQ0FBQztRQUNyRCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQzthQUNmLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDLDRCQUE0QixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUM3RSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUNYLElBQUksQ0FBQyxLQUFLLGFBQWEsRUFBRTtnQkFDckIsQ0FBQyxDQUFDLE9BQU8sR0FBUyxPQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDakM7aUJBQU07Z0JBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFTLE9BQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQzth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VTtJQUNWLGFBQWE7SUFDYixlQUFlO0lBQ2YsY0FBYztJQUNkLFNBQVM7SUFDVCxRQUFRO0NBQ1gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElJbmZvV2luZG93T3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWluZm8td2luZG93LW9wdGlvbnMnO1xuaW1wb3J0IHsgSUJveCB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWJveCc7XG5pbXBvcnQgeyBJTWFwT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaW1hcC1vcHRpb25zJztcbmltcG9ydCB7IElNYXJrZXJPcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbWFya2VyLW9wdGlvbnMnO1xuaW1wb3J0IHsgSVBvbHlnb25PcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pcG9seWdvbi1vcHRpb25zJztcbmltcG9ydCB7IElQb2x5bGluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lwb2x5bGluZS1vcHRpb25zJztcbmltcG9ydCB7IElMYXRMb25nIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgKiBhcyBHb29nbGVNYXBUeXBlcyBmcm9tICcuL2dvb2dsZS1tYXAtdHlwZXMnO1xuaW1wb3J0IHsgTWFwVHlwZUlkIH0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcC10eXBlLWlkJztcblxuZGVjbGFyZSB2YXIgZ29vZ2xlOiBhbnk7XG5cblxuLyoqXG4gKiBUaGlzIGNsYXNzIGNvbnRhaW5zIGhlbHBlcmZ1bmN0aW9ucyB0byBtYXAgdmFyaW91cyBpbnRlcmZhY2VzIHVzZWQgdG8gcmVwcmVzZW50IG9wdGlvbnMgYW5kIHN0cnVjdHVyZXMgaW50byB0aGVcbiAqIGNvcnJlc3BvbmRpbmcgR29vZ2xlIE1hcHMgc3BlY2lmaWMgaW1wbGVtZW50YXRpb25zLlxuICpcbiAqIEBleHBvcnRcbiAqL1xuZXhwb3J0IGNsYXNzIEdvb2dsZUNvbnZlcnNpb25zIHtcblxuICAgIC8vL1xuICAgIC8vLyBGaWVsZCBkZWNsYXJhdGlvbnNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIE1hcCBvcHRpb24gYXR0cmlidXRlcyB0aGF0IGFyZSBzdXBwb3J0ZWQgZm9yIGNvbnZlcnNpb24gdG8gR29vZ2xlIE1hcCBwcm9wZXJ0aWVzXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ29udmVyc2lvbnNcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBfbWFwT3B0aW9uc0F0dHJpYnV0ZXM6IHN0cmluZ1tdID0gW1xuICAgICAgICAnYmFja2dyb3VuZENvbG9yJyxcbiAgICAgICAgJ2NlbnRlcicsXG4gICAgICAgICdjbGlja2FibGVJY29ucycsXG4gICAgICAgICdjdXN0b21NYXBTdHlsZUdvb2dsZScsXG4gICAgICAgICdkaXNhYmxlRGVmYXVsdFVJJyxcbiAgICAgICAgJ2Rpc2FibGVEb3VibGVDbGlja1pvb20nLFxuICAgICAgICAnZHJhZ2dhYmxlJyxcbiAgICAgICAgJ2RyYWdnYWJsZUN1cnNvcicsXG4gICAgICAgICdkcmFnZ2luZ0N1cnNvcicsXG4gICAgICAgICdkaXNhYmxlWm9vbWluZycsXG4gICAgICAgICdmdWxsc2NyZWVuQ29udHJvbCcsXG4gICAgICAgICdmdWxsc2NyZWVuQ29udHJvbE9wdGlvbnMnLFxuICAgICAgICAnZ2VzdHVyZUhhbmRsaW5nJyxcbiAgICAgICAgJ2hlYWRpbmcnLFxuICAgICAgICAna2V5Ym9hcmRTaG9ydGN1dHMnLFxuICAgICAgICAnbWFwVHlwZUNvbnRyb2wnLFxuICAgICAgICAnbWFwVHlwZUNvbnRyb2xPcHRpb25zJyxcbiAgICAgICAgJ21hcFR5cGVJZCcsXG4gICAgICAgICdtYXhab29tJyxcbiAgICAgICAgJ21pblpvb20nLFxuICAgICAgICAnbm9DbGVhcicsXG4gICAgICAgICdwYW5Db250cm9sJyxcbiAgICAgICAgJ3BhbkNvbnRyb2xPcHRpb25zJyxcbiAgICAgICAgJ3JvdGF0ZUNvbnRyb2wnLFxuICAgICAgICAncm90YXRlQ29udHJvbE9wdGlvbnMnLFxuICAgICAgICAnc2NhbGVDb250cm9sJyxcbiAgICAgICAgJ3NjYWxlQ29udHJvbE9wdGlvbnMnLFxuICAgICAgICAnc2Nyb2xsd2hlZWwnLFxuICAgICAgICAnc2hvd01hcFR5cGVTZWxlY3RvcicsXG4gICAgICAgICdzdHJlZXRWaWV3JyxcbiAgICAgICAgJ3N0cmVldFZpZXdDb250cm9sJyxcbiAgICAgICAgJ3N0cmVldFZpZXdDb250cm9sT3B0aW9ucycsXG4gICAgICAgICdzdHlsZXMnLFxuICAgICAgICAndGlsdCcsXG4gICAgICAgICd6b29tJyxcbiAgICAgICAgJ3pvb21Db250cm9sJyxcbiAgICAgICAgJ3pvb21Db250cm9sT3B0aW9ucydcbiAgICBdO1xuXG4gICAgLyoqXG4gICAgICogSW5mb1dpbmRvdyBvcHRpb24gYXR0cmlidXRlcyB0aGF0IGFyZSBzdXBwb3J0ZWQgZm9yIGNvbnZlcnNpb24gdG8gR29vZ2xlIE1hcCBwcm9wZXJ0aWVzXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ29udmVyc2lvbnNcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBfaW5mb1dpbmRvd09wdGlvbnNBdHRyaWJ1dGVzOiBzdHJpbmdbXSA9IFtcbiAgICAgICAgJ2FjdGlvbnMnLFxuICAgICAgICAnZGVzY3JpcHRpb24nLFxuICAgICAgICAnaHRtbENvbnRlbnQnLFxuICAgICAgICAnaWQnLFxuICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAncGl4ZWxPZmZzZXQnLFxuICAgICAgICAnc2hvd0Nsb3NlQnV0dG9uJyxcbiAgICAgICAgJ3Nob3dQb2ludGVyJyxcbiAgICAgICAgJ3B1c2hwaW4nLFxuICAgICAgICAndGl0bGUnLFxuICAgICAgICAndGl0bGVDbGlja0hhbmRsZXInLFxuICAgICAgICAndHlwZU5hbWUnLFxuICAgICAgICAndmlzaWJsZScsXG4gICAgICAgICd3aWR0aCcsXG4gICAgICAgICdoZWlnaHQnXG4gICAgXTtcblxuICAgIC8qKlxuICAgICAqIE1hcmtlciBvcHRpb24gYXR0cmlidXRlcyB0aGF0IGFyZSBzdXBwb3J0ZWQgZm9yIGNvbnZlcnNpb24gdG8gR29vZ2xlIE1hcCBwcm9wZXJ0aWVzXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ29udmVyc2lvbnNcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBfbWFya2VyT3B0aW9uc0F0dHJpYnV0ZXM6IHN0cmluZ1tdID0gW1xuICAgICAgICAnYW5jaG9yJyxcbiAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgJ3RpdGxlJyxcbiAgICAgICAgJ3RleHQnLFxuICAgICAgICAnbGFiZWwnLFxuICAgICAgICAnZHJhZ2dhYmxlJyxcbiAgICAgICAgJ2ljb24nLFxuICAgICAgICAnd2lkdGgnLFxuICAgICAgICAnaGVpZ2h0JyxcbiAgICAgICAgJ2ljb25JbmZvJyxcbiAgICAgICAgJ21ldGFkYXRhJyxcbiAgICAgICAgJ3Zpc2libGUnXG4gICAgXTtcblxuICAgIC8qKlxuICAgICAqIENsdXN0ZXIgb3B0aW9uIGF0dHJpYnV0ZXMgdGhhdCBhcmUgc3VwcG9ydGVkIGZvciBjb252ZXJzaW9uIHRvIEdvb2dsZSBNYXAgcHJvcGVydGllc1xuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUNvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2NsdXN0ZXJPcHRpb25zQXR0cmlidXRlczogc3RyaW5nW10gPSBbXG4gICAgICAgICdjYWxsYmFjaycsXG4gICAgICAgICdjbHVzdGVyZWRQaW5DYWxsYmFjaycsXG4gICAgICAgICdjbHVzdGVyaW5nRW5hYmxlZCcsXG4gICAgICAgICdncmlkU2l6ZScsXG4gICAgICAgICdsYXllck9mZnNldCcsXG4gICAgICAgICdwbGFjZW1lbnRNb2RlJyxcbiAgICAgICAgJ3Zpc2libGUnLFxuICAgICAgICAnekluZGV4J1xuICAgIF07XG5cbiAgICAvKipcbiAgICAgKiBQb2x5Z29uIG9wdGlvbiBhdHRyaWJ1dGVzIHRoYXQgYXJlIHN1cHBvcnRlZCBmb3IgY29udmVyc2lvbiB0byBHb29nbGUgTWFwIHByb3BlcnRpZXNcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIF9wb2x5Z29uT3B0aW9uc0F0dHJpYnV0ZXM6IHN0cmluZ1tdID0gW1xuICAgICAgICAnY2xpY2thYmxlJyxcbiAgICAgICAgJ2RyYWdnYWJsZScsXG4gICAgICAgICdlZGl0YWJsZScsXG4gICAgICAgICdmaWxsQ29sb3InLFxuICAgICAgICAnZmlsbE9wYWNpdHknLFxuICAgICAgICAnZ2VvZGVzaWMnLFxuICAgICAgICAncGF0aHMnLFxuICAgICAgICAnc3Ryb2tlQ29sb3InLFxuICAgICAgICAnc3Ryb2tlT3BhY2l0eScsXG4gICAgICAgICdzdHJva2VXZWlnaHQnLFxuICAgICAgICAndmlzaWJsZScsXG4gICAgICAgICd6SW5kZXgnXG4gICAgXTtcblxuICAgIC8qKlxuICAgICAqIFBvbHlsaW5lIG9wdGlvbiBhdHRyaWJ1dGVzIHRoYXQgYXJlIHN1cHBvcnRlZCBmb3IgY29udmVyc2lvbiB0byBHb29nbGUgTWFwIHByb3BlcnRpZXNcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIF9wb2x5bGluZU9wdGlvbnNBdHRyaWJ1dGVzOiBzdHJpbmdbXSA9IFtcbiAgICAgICAgJ2NsaWNrYWJsZScsXG4gICAgICAgICdkcmFnZ2FibGUnLFxuICAgICAgICAnZWRpdGFibGUnLFxuICAgICAgICAnZ2VvZGVzaWMnLFxuICAgICAgICAnc3Ryb2tlQ29sb3InLFxuICAgICAgICAnc3Ryb2tlT3BhY2l0eScsXG4gICAgICAgICdzdHJva2VXZWlnaHQnLFxuICAgICAgICAndmlzaWJsZScsXG4gICAgICAgICd6SW5kZXgnXG4gICAgXTtcblxuICAgIC8qKlxuICAgICAqIE1hcHMgYW4gSUJveCBvYmplY3QgdG8gYSBHb29nbGVNYXBUeXBlcy5MYXRMbmdCb3VuZHNMaXRlcmFsIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBib3VuZHMgLSBPYmplY3QgdG8gYmUgbWFwcGVkLlxuICAgICAqIEByZXR1cm5zIC0gTWFwcGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgVHJhbnNsYXRlQm91bmRzKGJvdW5kczogSUJveCk6IEdvb2dsZU1hcFR5cGVzLkxhdExuZ0JvdW5kc0xpdGVyYWwge1xuICAgICAgICBjb25zdCBiOiBHb29nbGVNYXBUeXBlcy5MYXRMbmdCb3VuZHNMaXRlcmFsID0ge1xuICAgICAgICAgICAgZWFzdDogYm91bmRzLm1heExvbmdpdHVkZSxcbiAgICAgICAgICAgIG5vcnRoOiBib3VuZHMubWF4TGF0aXR1ZGUsXG4gICAgICAgICAgICBzb3V0aDogYm91bmRzLm1pbkxhdGl0dWRlLFxuICAgICAgICAgICAgd2VzdDogYm91bmRzLm1pbkxvbmdpdHVkZSxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWFwcyBhbiBJSW5mb1dpbmRvd09wdGlvbnMgb2JqZWN0IHRvIGEgR29vZ2xlTWFwVHlwZXMuSW5mb1dpbmRvd09wdGlvbnMgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBPYmplY3QgdG8gYmUgbWFwcGVkLlxuICAgICAqIEByZXR1cm5zIC0gTWFwcGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgVHJhbnNsYXRlSW5mb1dpbmRvd09wdGlvbnMob3B0aW9uczogSUluZm9XaW5kb3dPcHRpb25zKTogR29vZ2xlTWFwVHlwZXMuSW5mb1dpbmRvd09wdGlvbnMge1xuICAgICAgICBjb25zdCBvOiBHb29nbGVNYXBUeXBlcy5JbmZvV2luZG93T3B0aW9ucyB8IGFueSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgICAgICAgLmZpbHRlcihrID0+IEdvb2dsZUNvbnZlcnNpb25zLl9pbmZvV2luZG93T3B0aW9uc0F0dHJpYnV0ZXMuaW5kZXhPZihrKSAhPT0gLTEpXG4gICAgICAgICAgICAuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChrID09PSAnaHRtbENvbnRlbnQnKSB7XG4gICAgICAgICAgICAgICAgICAgIG8uY29udGVudCA9ICg8YW55Pm9wdGlvbnMpW2tdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9ba10gPSAoPGFueT5vcHRpb25zKVtrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgaWYgKG8uY29udGVudCA9PSBudWxsIHx8IG8uY29udGVudCA9PT0gJycpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnRpdGxlICE9PSAnJyAmJiBvcHRpb25zLmRlc2NyaXB0aW9uICE9PSAnJykge1xuICAgICAgICAgICAgICAgIG8uY29udGVudCA9IGAke29wdGlvbnMudGl0bGV9OiAke29wdGlvbnMuZGVzY3JpcHRpb259YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG9wdGlvbnMuZGVzY3JpcHRpb24gIT09ICcnKSB7IG8uY29udGVudCA9IG9wdGlvbnMuZGVzY3JpcHRpb247IH1cbiAgICAgICAgICAgIGVsc2UgeyBvLmNvbnRlbnQgPSBvcHRpb25zLnRpdGxlOyB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG87XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWFwcyBhbiBJTGF0TG9uZyBvYmplY3QgdG8gYSBHb29nbGVNYXBUeXBlcy5MYXRMbmdMaXRlcmFsIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsYXRsb25nIC0gT2JqZWN0IHRvIGJlIG1hcHBlZC5cbiAgICAgKiBAcmV0dXJucyAtIE1hcHBlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ29udmVyc2lvbnNcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIFRyYW5zbGF0ZUxvY2F0aW9uKGxhdGxvbmc6IElMYXRMb25nKTogR29vZ2xlTWFwVHlwZXMuTGF0TG5nTGl0ZXJhbCB7XG4gICAgICAgIGNvbnN0IGw6IEdvb2dsZU1hcFR5cGVzLkxhdExuZ0xpdGVyYWwgPSB7IGxhdDogbGF0bG9uZy5sYXRpdHVkZSwgbG5nOiBsYXRsb25nLmxvbmdpdHVkZSB9O1xuICAgICAgICByZXR1cm4gbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNYXBzIGFuIEdvb2dsZU1hcFR5cGVzLkxhdExuZ0xpdGVyYWwgb2JqZWN0IHRvIGEgSUxhdExvbmcgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGxhdGxuZyAtIE9iamVjdCB0byBiZSBtYXBwZWQuXG4gICAgICogQHJldHVybnMgLSBNYXBwZWQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUNvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBUcmFuc2xhdGVMYXRMbmcobGF0bG5nOiBHb29nbGVNYXBUeXBlcy5MYXRMbmdMaXRlcmFsKTogSUxhdExvbmcge1xuICAgICAgICBjb25zdCBsOiBJTGF0TG9uZyA9IHsgbGF0aXR1ZGU6IGxhdGxuZy5sYXQsIGxvbmdpdHVkZTogbGF0bG5nLmxuZyB9O1xuICAgICAgICByZXR1cm4gbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNYXBzIGFuIElMYXRMb25nIG9iamVjdCB0byBhIEdvb2dsZU1hcFR5cGVzLkxhdExuZyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF0bG9uZyAtIE9iamVjdCB0byBiZSBtYXBwZWQuXG4gICAgICogQHJldHVybnMgLSBNYXBwZWQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUNvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBUcmFuc2xhdGVMb2NhdGlvbk9iamVjdChsYXRsb25nOiBJTGF0TG9uZyk6IEdvb2dsZU1hcFR5cGVzLkxhdExuZyB7XG4gICAgICAgIGNvbnN0IGw6IEdvb2dsZU1hcFR5cGVzLkxhdExuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcobGF0bG9uZy5sYXRpdHVkZSwgbGF0bG9uZy5sb25naXR1ZGUpO1xuICAgICAgICByZXR1cm4gbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNYXBzIGFuIEdvb2dsZU1hcFR5cGVzLkxhdExuZyBvYmplY3QgdG8gYSBJTGF0TG9uZyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF0bG5nIC0gT2JqZWN0IHRvIGJlIG1hcHBlZC5cbiAgICAgKiBAcmV0dXJucyAtIE1hcHBlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ29udmVyc2lvbnNcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIFRyYW5zbGF0ZUxhdExuZ09iamVjdChsYXRsbmc6IEdvb2dsZU1hcFR5cGVzLkxhdExuZyk6IElMYXRMb25nIHtcbiAgICAgICAgY29uc3QgbDogSUxhdExvbmcgPSB7IGxhdGl0dWRlOiBsYXRsbmcubGF0KCksIGxvbmdpdHVkZTogbGF0bG5nLmxuZygpIH07XG4gICAgICAgIHJldHVybiBsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hcHMgYW4gSUxhdExvbmcgYXJyYXkgdG8gYSBhcnJheSBvZiBHb29nbGVNYXBUeXBlcy5MYXRMbmcgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGxhdGxvbmdBcnJheSAtIE9iamVjdCB0byBiZSBtYXBwZWQuXG4gICAgICogQHJldHVybnMgLSBNYXBwZWQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUNvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBUcmFuc2xhdGVMb2NhdGlvbk9iamVjdEFycmF5KGxhdGxvbmdBcnJheTogQXJyYXk8SUxhdExvbmc+KTogQXJyYXk8R29vZ2xlTWFwVHlwZXMuTGF0TG5nPiB7XG4gICAgICAgIC8vIHVzZSBmb3IgbG9vcCBmb3IgcGVyZm9ybWFuY2UgaW4gY2FzZSB3ZSBkZWFsIHdpdGggbGFyZ2UgbnVtYmVycyBvZiBwb2ludHMgYW5kIHBhdGhzLi4uXG4gICAgICAgIGNvbnN0IHA6IEFycmF5PEdvb2dsZU1hcFR5cGVzLkxhdExuZz4gPSBuZXcgQXJyYXk8R29vZ2xlTWFwVHlwZXMuTGF0TG5nPigpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxhdGxvbmdBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcC5wdXNoKEdvb2dsZUNvbnZlcnNpb25zLlRyYW5zbGF0ZUxvY2F0aW9uT2JqZWN0KGxhdGxvbmdBcnJheVtpXSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hcHMgYSBNYXBUeXBlSWQgb2JqZWN0IHRvIGEgR29vZ2xlIG1hcHR5cGUgc3RyaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1hcFR5cGVJZCAtIE9iamVjdCB0byBiZSBtYXBwZWQuXG4gICAgICogQHJldHVybnMgLSBNYXBwZWQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUNvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBUcmFuc2xhdGVNYXBUeXBlSWQobWFwVHlwZUlkOiBNYXBUeXBlSWQpOiBzdHJpbmcge1xuICAgICAgICBzd2l0Y2ggKG1hcFR5cGVJZCkge1xuICAgICAgICAgICAgY2FzZSBNYXBUeXBlSWQucm9hZDogcmV0dXJuIEdvb2dsZU1hcFR5cGVzLk1hcFR5cGVJZFtHb29nbGVNYXBUeXBlcy5NYXBUeXBlSWQucm9hZG1hcF07XG4gICAgICAgICAgICBjYXNlIE1hcFR5cGVJZC5ncmF5c2NhbGU6IHJldHVybiBHb29nbGVNYXBUeXBlcy5NYXBUeXBlSWRbR29vZ2xlTWFwVHlwZXMuTWFwVHlwZUlkLnRlcnJhaW5dO1xuICAgICAgICAgICAgY2FzZSBNYXBUeXBlSWQuaHlicmlkOiByZXR1cm4gR29vZ2xlTWFwVHlwZXMuTWFwVHlwZUlkW0dvb2dsZU1hcFR5cGVzLk1hcFR5cGVJZC5oeWJyaWRdO1xuICAgICAgICAgICAgY2FzZSBNYXBUeXBlSWQub3JkbmFuY2VTdXJ2ZXk6IHJldHVybiBHb29nbGVNYXBUeXBlcy5NYXBUeXBlSWRbR29vZ2xlTWFwVHlwZXMuTWFwVHlwZUlkLnRlcnJhaW5dO1xuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIEdvb2dsZU1hcFR5cGVzLk1hcFR5cGVJZFtHb29nbGVNYXBUeXBlcy5NYXBUeXBlSWQuc2F0ZWxsaXRlXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hcHMgYW4gSU1hcmtlck9wdGlvbnMgb2JqZWN0IHRvIGEgR29vZ2xlTWFwVHlwZXMuTWFya2VyT3B0aW9ucyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9iamVjdCB0byBiZSBtYXBwZWQuXG4gICAgICogQHJldHVybnMgLSBQcm9taXNlIHRoYXQgd2hlbiByZXNvbHZlZCBjb250YWlucyB0aGUgbWFwcGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgVHJhbnNsYXRlTWFya2VyT3B0aW9ucyhvcHRpb25zOiBJTWFya2VyT3B0aW9ucyk6IEdvb2dsZU1hcFR5cGVzLk1hcmtlck9wdGlvbnMge1xuICAgICAgICBjb25zdCBvOiBHb29nbGVNYXBUeXBlcy5NYXJrZXJPcHRpb25zIHwgYW55ID0ge307XG4gICAgICAgIE9iamVjdC5rZXlzKG9wdGlvbnMpXG4gICAgICAgICAgICAuZmlsdGVyKGsgPT4gR29vZ2xlQ29udmVyc2lvbnMuX21hcmtlck9wdGlvbnNBdHRyaWJ1dGVzLmluZGV4T2YoaykgIT09IC0xKVxuICAgICAgICAgICAgLmZvckVhY2goKGspID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoayA9PT0gJ3Bvc2l0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXRsbmcgPSBHb29nbGVDb252ZXJzaW9ucy5UcmFuc2xhdGVMb2NhdGlvbk9iamVjdChvcHRpb25zW2tdKTtcbiAgICAgICAgICAgICAgICAgICAgby5wb3NpdGlvbiA9IGxhdGxuZztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9ba10gPSAoPGFueT5vcHRpb25zKVtrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG87XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWFwcyBhbiBJTWFwT3B0aW9ucyBvYmplY3QgdG8gYSBHb29nbGVNYXBUeXBlcy5NYXBPcHRpb25zIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gT2JqZWN0IHRvIGJlIG1hcHBlZC5cbiAgICAgKiBAcmV0dXJucyAtIE1hcHBlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ29udmVyc2lvbnNcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIFRyYW5zbGF0ZU9wdGlvbnMob3B0aW9uczogSU1hcE9wdGlvbnMpOiBHb29nbGVNYXBUeXBlcy5NYXBPcHRpb25zIHtcbiAgICAgICAgY29uc3QgbzogR29vZ2xlTWFwVHlwZXMuTWFwT3B0aW9ucyA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgICAgICAgLmZpbHRlcihrID0+IEdvb2dsZUNvbnZlcnNpb25zLl9tYXBPcHRpb25zQXR0cmlidXRlcy5pbmRleE9mKGspICE9PSAtMSlcbiAgICAgICAgICAgIC5mb3JFYWNoKChrKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGsgPT09ICdjZW50ZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIG8uY2VudGVyID0gR29vZ2xlQ29udmVyc2lvbnMuVHJhbnNsYXRlTG9jYXRpb24ob3B0aW9ucy5jZW50ZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrID09PSAnbWFwVHlwZUlkJykge1xuICAgICAgICAgICAgICAgICAgICBvLm1hcFR5cGVJZCA9IEdvb2dsZUNvbnZlcnNpb25zLlRyYW5zbGF0ZU1hcFR5cGVJZChvcHRpb25zLm1hcFR5cGVJZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGsgPT09ICdkaXNhYmxlWm9vbWluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgby5nZXN0dXJlSGFuZGxpbmcgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIG8uem9vbUNvbnRyb2wgPSAgZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGsgPT09ICdzaG93TWFwVHlwZVNlbGVjdG9yJykge1xuICAgICAgICAgICAgICAgICAgICBvLm1hcFR5cGVDb250cm9sID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGsgPT09ICdjdXN0b21NYXBTdHlsZUdvb2dsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgby5zdHlsZXMgPSA8R29vZ2xlTWFwVHlwZXMuTWFwVHlwZVN0eWxlW10+PGFueT4gb3B0aW9ucy5jdXN0b21NYXBTdHlsZUdvb2dsZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgKDxhbnk+bylba10gPSAoPGFueT5vcHRpb25zKVtrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG87XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJhbnNsYXRlcyBhbiBhcnJheSBvZiBsb2NhdGlvbnMgb3IgYW4gYXJyYXkgb3IgYXJyYXlzIG9mIGxvY2F0aW9uIHRvIGFuZCBhcnJheSBvZiBhcnJheXMgb2YgQmluZyBNYXAgTG9jYXRpb25zXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGF0aHMgLSBJTGF0TG9uZyBiYXNlZCBsb2NhdGlvbnMgdG8gY29udmVydC5cbiAgICAgKiBAcmV0dXJucyAtIGNvbnZlcnRlZCBsb2NhdGlvbnMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ29udmVyc2lvbnNcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIFRyYW5zbGF0ZVBhdGhzKHBhdGhzOiBBcnJheTxJTGF0TG9uZz4gfCBBcnJheTxBcnJheTxJTGF0TG9uZz4+KTogQXJyYXk8QXJyYXk8R29vZ2xlTWFwVHlwZXMuTGF0TG5nPj4ge1xuICAgICAgICBjb25zdCBwOiBBcnJheTxBcnJheTxHb29nbGVNYXBUeXBlcy5MYXRMbmc+PiA9IG5ldyBBcnJheTxBcnJheTxHb29nbGVNYXBUeXBlcy5MYXRMbmc+PigpO1xuICAgICAgICBpZiAocGF0aHMgPT0gbnVsbCB8fCAhQXJyYXkuaXNBcnJheShwYXRocykgfHwgcGF0aHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBwLnB1c2gobmV3IEFycmF5PEdvb2dsZU1hcFR5cGVzLkxhdExuZz4oKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShwYXRoc1swXSkpIHtcbiAgICAgICAgICAgIC8vIHBhcmFtZXRlciBpcyBhbiBhcnJheSBvciBhcnJheXNcbiAgICAgICAgICAgIC8vIHVzZSBmb3IgbG9vcCBmb3IgcGVyZm9ybWFuY2UgaW4gY2FzZSB3ZSBkZWFsIHdpdGggbGFyZ2UgbnVtYmVycyBvZiBwb2ludHMgYW5kIHBhdGhzLi4uXG4gICAgICAgICAgICBjb25zdCBwMSA9IDxBcnJheTxBcnJheTxJTGF0TG9uZz4+PnBhdGhzO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwMS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHAucHVzaChHb29nbGVDb252ZXJzaW9ucy5UcmFuc2xhdGVMb2NhdGlvbk9iamVjdEFycmF5KHAxW2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBwYXJhbWV0ZXIgaXMgYSBzaW1wbGUgYXJyYXkuLi4uXG4gICAgICAgICAgICBwLnB1c2goR29vZ2xlQ29udmVyc2lvbnMuVHJhbnNsYXRlTG9jYXRpb25PYmplY3RBcnJheSg8QXJyYXk8SUxhdExvbmc+PnBhdGhzKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogIE1hcHMgYW4gSVBvbHlnb25PcHRpb25zIG9iamVjdCB0byBhIEdvb2dsZU1hcFR5cGVzLlBvbHlnb25PcHRpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBPYmplY3QgdG8gYmUgbWFwcGVkLlxuICAgICAqIEByZXR1cm5zIC0gTWFwcGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgVHJhbnNsYXRlUG9seWdvbk9wdGlvbnMob3B0aW9uczogSVBvbHlnb25PcHRpb25zKTogR29vZ2xlTWFwVHlwZXMuUG9seWdvbk9wdGlvbnMge1xuICAgICAgICBjb25zdCBvOiBHb29nbGVNYXBUeXBlcy5Qb2x5Z29uT3B0aW9ucyB8IGFueSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgICAgICAgLmZpbHRlcihrID0+IEdvb2dsZUNvbnZlcnNpb25zLl9wb2x5Z29uT3B0aW9uc0F0dHJpYnV0ZXMuaW5kZXhPZihrKSAhPT0gLTEpXG4gICAgICAgICAgICAuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChrID09PSAncGF0aHMnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShvcHRpb25zLnBhdGhzKSkgeyByZXR1cm47IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucGF0aHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLnBhdGhzID0gbmV3IEFycmF5PEdvb2dsZU1hcFR5cGVzLkxhdExuZz4oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMucGF0aHNbMF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLnBhdGhzID0gbmV3IEFycmF5PEFycmF5PEdvb2dsZU1hcFR5cGVzLkxhdExuZ0xpdGVyYWw+PigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXNlIGZvciBsb29wIGZvciBwZXJmb3JtYW5jZSBpbiBjYXNlIHdlIGRlYWwgd2l0aCBsYXJnZSBudW1iZXJzIG9mIHBvaW50cyBhbmQgcGF0aHMuLlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcDEgPSA8QXJyYXk8QXJyYXk8SUxhdExvbmc+Pj5vcHRpb25zLnBhdGhzO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwMS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8ucGF0aHNbaV0gPSBuZXcgQXJyYXk8R29vZ2xlTWFwVHlwZXMuTGF0TG5nTGl0ZXJhbD4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHAxW2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8ucGF0aHNbaV1bal0gPSB7bGF0OiBwMVtpXVtqXS5sYXRpdHVkZSwgbG5nOiBwMVtpXVtqXS5sb25naXR1ZGV9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8ucGF0aHMgPSBuZXcgQXJyYXk8R29vZ2xlTWFwVHlwZXMuTGF0TG5nTGl0ZXJhbD4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVzZSBmb3IgbG9vcCBmb3IgcGVyZm9ybWFuY2UgaW4gY2FzZSB3ZSBkZWFsIHdpdGggbGFyZ2UgbnVtYmVycyBvZiBwb2ludHMgYW5kIHBhdGhzLi5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAxID0gPEFycmF5PElMYXRMb25nPj5vcHRpb25zLnBhdGhzO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwMS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8ucGF0aHNbaV0gPSB7bGF0OiBwMVtpXS5sYXRpdHVkZSwgbG5nOiBwMVtpXS5sb25naXR1ZGV9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvW2tdID0gKDxhbnk+b3B0aW9ucylba107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqICBNYXBzIGFuIElQb2x5bGluZU9wdGlvbnMgb2JqZWN0IHRvIGEgR29vZ2xlTWFwVHlwZXMuUG9seWxpbmVPcHRpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBPYmplY3QgdG8gYmUgbWFwcGVkLlxuICAgICAqIEByZXR1cm5zIC0gTWFwcGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgVHJhbnNsYXRlUG9seWxpbmVPcHRpb25zKG9wdGlvbnM6IElQb2x5bGluZU9wdGlvbnMpOiBHb29nbGVNYXBUeXBlcy5Qb2x5bGluZU9wdGlvbnMge1xuICAgICAgICBjb25zdCBvOiBHb29nbGVNYXBUeXBlcy5Qb2x5bGluZU9wdGlvbnMgfCBhbnkgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXMob3B0aW9ucylcbiAgICAgICAgICAgIC5maWx0ZXIoayA9PiBHb29nbGVDb252ZXJzaW9ucy5fcG9seWxpbmVPcHRpb25zQXR0cmlidXRlcy5pbmRleE9mKGspICE9PSAtMSlcbiAgICAgICAgICAgIC5mb3JFYWNoKChrKSA9PiB7XG4gICAgICAgICAgICAgICAgb1trXSA9ICg8YW55Pm9wdGlvbnMpW2tdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvO1xuICAgIH1cbn1cbiJdfQ==