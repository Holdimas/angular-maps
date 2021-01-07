import { MapTypeId } from '../../models/map-type-id';
import { ClusterPlacementMode } from '../../models/cluster-placement-mode';
/**
 * This class contains helperfunctions to map various interfaces used to represent options and structures into the
 * corresponding Bing Maps V8 specific implementations.
 *
 * @export
 */
export class BingConversions {
    ///
    /// Public methods
    ///
    /**
     * Maps an IInfoWindowAction to a Microsoft.Maps.IInfoboxActions
     *
     * @param action - Object to be mapped.
     * @returns - Navtive mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateAction(action) {
        const a = {
            eventHandler: action.eventHandler,
            label: action.label
        };
        return a;
    }
    /**
     * Maps an Array of IInfoWindowAction to an Array of Microsoft.Maps.IInfoboxActions
     *
     * @param actions - Array of objects to be mapped.
     * @returns - Array of mapped objects.
     *
     * @memberof BingConversions
     */
    static TranslateActions(actions) {
        const a = new Array();
        actions.forEach(x => a.push(BingConversions.TranslateAction(x)));
        return a;
    }
    /**
     * Maps an IBox object to a Microsoft.Maps.LocationRect object.
     *
     * @param box - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateBounds(box) {
        const r = Microsoft.Maps.LocationRect.fromEdges(box.maxLatitude, box.minLongitude, box.minLatitude, box.maxLongitude);
        return r;
    }
    /**
     * Maps an IClusterOptions object to a Microsoft.Maps.IClusterLayerOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateClusterOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => BingConversions._clusterOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'layerOffset') {
                o.layerOffset = BingConversions.TranslatePoint(options.layerOffset);
            }
            if (k === 'placementMode') {
                if (options.placementMode === ClusterPlacementMode.FirstPin) {
                    o.placementMode = Microsoft.Maps.ClusterPlacementType.FirstLocation;
                }
                else {
                    o.placementMode = Microsoft.Maps.ClusterPlacementType.MeanAverage;
                }
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an IInfoWindowOptions object to a Microsoft.Maps.IInfoboxOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateInfoBoxOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => BingConversions._infoWindowOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'pixelOffset') {
                o.offset = BingConversions.TranslatePoint(options.pixelOffset);
            }
            else if (k === 'position') {
                o.location = BingConversions.TranslateLocation(options.position);
            }
            else if (k === 'actions') {
                o.actions = BingConversions.TranslateActions(options.actions);
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an IMapOptions object to a Microsoft.Maps.IMapLoadOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateLoadOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => {
            return BingConversions._mapOptionsAttributes.indexOf(k) !== -1 || BingConversions._viewOptionsAttributes.indexOf(k) !== -1;
        })
            .forEach((k) => {
            if (k === 'center') {
                o.center = BingConversions.TranslateLocation(options.center);
            }
            else if (k === 'mapTypeId') {
                if (options.mapTypeId === MapTypeId.hybrid) {
                    o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                    o.labelOverlay = Microsoft.Maps.LabelOverlay.visible;
                }
                else if (options.mapTypeId === MapTypeId.aerial) {
                    o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                    o.labelOverlay = Microsoft.Maps.LabelOverlay.hidden;
                }
                else {
                    o.mapTypeId = Microsoft.Maps.MapTypeId[MapTypeId[options.mapTypeId]];
                }
            }
            else if (k === 'bounds') {
                o.bounds = BingConversions.TranslateBounds(options.bounds);
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an ILatLong object to a Microsoft.Maps.Location object.
     *
     * @param latlong - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateLocation(latlong) {
        const l = new Microsoft.Maps.Location(latlong.latitude, latlong.longitude);
        return l;
    }
    /**
     * Maps an IMarkerOptions object to a Microsoft.Maps.IPushpinOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - The mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateMarkerOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => BingConversions._markerOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'anchor') {
                o.anchor = BingConversions.TranslatePoint(options.anchor);
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an IMapOptions object to a Microsoft.Maps.IMapOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => BingConversions._mapOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'center') {
                o.center = BingConversions.TranslateLocation(options.center);
            }
            else if (k === 'mapTypeId') {
                o.mapTypeId = Microsoft.Maps.MapTypeId[MapTypeId[options.mapTypeId]];
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
     * @memberof BingConversions
     */
    static TranslatePaths(paths) {
        const p = new Array();
        if (paths == null || !Array.isArray(paths) || paths.length === 0) {
            p.push(new Array());
        }
        else if (Array.isArray(paths[0])) {
            // parameter is an array or arrays
            // us for loop for performance
            const p1 = paths;
            for (let i = 0; i < p1.length; i++) {
                const _p = new Array();
                for (let j = 0; j < p1[i].length; j++) {
                    _p.push(new Microsoft.Maps.Location(p1[i][j].latitude, p1[i][j].longitude));
                }
                p.push(_p);
            }
        }
        else {
            // parameter is a simple array....
            const y = new Array();
            const p1 = paths;
            for (let i = 0; i < p1.length; i++) {
                y.push(new Microsoft.Maps.Location(p1[i].latitude, p1[i].longitude));
            }
            p.push(y);
        }
        return p;
    }
    /**
     *  Maps an IPoint object to a Microsoft.Maps.Point object.
     *
     * @param point - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslatePoint(point) {
        const p = new Microsoft.Maps.Point(point.x, point.y);
        return p;
    }
    /**
     *  Maps an IPolygonOptions object to a Microsoft.Maps.IPolygonOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslatePolygonOptions(options) {
        const o = {};
        const f = (s, a) => {
            const m = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(s);
            if (m && m.length > 3) {
                a = a > 1 ? (a / 100) : a;
                return 'rgba(' + [m[1], m[2], m[3], a].join(',') + ')';
            }
            else if (s[0] === '#') {
                const x = a > 1 ? a : Math.floor(a * 255);
                const z = s.substr(1);
                const r = parseInt(z.substr(0, 2), 16);
                const g = parseInt(z.substr(2, 2), 16);
                const b = parseInt(z.substr(4, 2), 16);
                return 'rgba(' + [r, g, b, a].join(',') + ')';
            }
            else {
                return s;
            }
        };
        Object.keys(options)
            .filter(k => BingConversions._polygonOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'strokeWeight') {
                o.strokeThickness = options.strokeWeight;
            }
            else if (k === 'strokeColor') {
                if (options.strokeOpacity) {
                    o.strokeColor = f(options.strokeColor, options.strokeOpacity);
                }
                else {
                    o.strokeColor = options.strokeColor;
                }
            }
            else if (k === 'strokeOpacity') { }
            else if (k === 'fillColor') {
                if (options.fillOpacity) {
                    o.fillColor = f(options.fillColor, options.fillOpacity);
                }
                else {
                    o.fillColor = options.fillColor;
                }
            }
            else if (k === 'fillOpacity') { }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     *  Maps an IPolylineOptions object to a Microsoft.Maps.IPolylineOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslatePolylineOptions(options) {
        const o = {};
        const f = (s, a) => {
            const m = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(s);
            if (m && m.length > 3) {
                a = a > 1 ? (a / 100) : a;
                return 'rgba(' + [m[1], m[2], m[3], a].join(',') + ')';
            }
            else if (s[0] === '#') {
                const x = a > 1 ? a : Math.floor(a * 255);
                const z = s.substr(1);
                const r = parseInt(z.substr(0, 2), 16);
                const g = parseInt(z.substr(2, 2), 16);
                const b = parseInt(z.substr(4, 2), 16);
                return 'rgba(' + [r, g, b, a].join(',') + ')';
            }
            else {
                return s;
            }
        };
        Object.keys(options)
            .filter(k => BingConversions._polylineOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'strokeWeight') {
                o.strokeThickness = options.strokeWeight;
            }
            else if (k === 'strokeColor') {
                if (options.strokeOpacity) {
                    o.strokeColor = f(options.strokeColor, options.strokeOpacity);
                }
                else {
                    o.strokeColor = options.strokeColor;
                }
            }
            else if (k === 'strokeOpacity') {
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an IMapOptions object to a Microsoft.Maps.IViewOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateViewOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => BingConversions._viewOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'center') {
                o.center = BingConversions.TranslateLocation(options.center);
            }
            else if (k === 'bounds') {
                o.bounds = BingConversions.TranslateBounds(options.bounds);
            }
            else if (k === 'centerOffset') {
                o.centerOffset = BingConversions.TranslatePoint(options.centerOffset);
            }
            else if (k === 'mapTypeId') {
                o.mapTypeId = Microsoft.Maps.MapTypeId[MapTypeId[options.mapTypeId]];
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
}
///
/// Field declarations
///
/**
 * Map option attributes that are supported for conversion to Bing Map properties
 *
 * @memberof BingConversions
 */
BingConversions._mapOptionsAttributes = [
    'backgroundColor',
    'credentials',
    'customizeOverlays',
    'customMapStyle',
    'disableBirdseye',
    'disableKeyboardInput',
    'disableMouseInput',
    'disablePanning',
    'disableTouchInput',
    'disableUserInput',
    'disableZooming',
    'disableStreetside',
    'enableClickableLogo',
    'enableSearchLogo',
    'fixedMapPosition',
    'height',
    'inertiaIntensity',
    'navigationBarMode',
    'showBreadcrumb',
    'showCopyright',
    'showDashboard',
    'showMapTypeSelector',
    'showScalebar',
    'theme',
    'tileBuffer',
    'useInertia',
    'width',
    'center',
    'zoom',
    'mapTypeId',
    'liteMode'
];
/**
 * View option attributes that are supported for conversion to Bing Map properties
 *
 * @memberof BingConversions
 */
BingConversions._viewOptionsAttributes = [
    'animate',
    'bounds',
    'center',
    'centerOffset',
    'heading',
    'labelOverlay',
    'mapTypeId',
    'padding',
    'zoom'
];
/**
 * InfoWindow option attributes that are supported for conversion to Bing Map properties
 *
 * @memberof BingConversions
 */
BingConversions._infoWindowOptionsAttributes = [
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
 * Marker option attributes that are supported for conversion to Bing Map properties
 *
 * @memberof BingConversions
 */
BingConversions._markerOptionsAttributes = [
    'anchor',
    'draggable',
    'height',
    'htmlContent',
    'icon',
    'infobox',
    'state',
    'title',
    'textOffset',
    'typeName',
    'visible',
    'width',
    'zIndex'
];
/**
 * Polygon option attributes that are supported for conversion to Bing Map Polygon properties
 *
 * @memberof BingConversions
 */
BingConversions._polygonOptionsAttributes = [
    'cursor',
    'fillColor',
    'fillOpacity',
    'strokeColor',
    'strokeOpacity',
    'strokeWeight',
    'visible'
];
/**
 * Polyline option attributes that are supported for conversion to Bing Map Polyline properties
 *
 * @memberof BingConversions
 */
BingConversions._polylineOptionsAttributes = [
    'cursor',
    'strokeColor',
    'strokeOpacity',
    'strokeWeight',
    'visible'
];
/**
 * Cluster option attributes that are supported for conversion to Bing Map properties
 *
 * @memberof BingConversions
 */
BingConversions._clusterOptionsAttributes = [
    'callback',
    'clusteredPinCallback',
    'clusteringEnabled',
    'gridSize',
    'layerOffset',
    'placementMode',
    'visible',
    'zIndex'
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1jb252ZXJzaW9ucy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9zZXJ2aWNlcy9iaW5nL2JpbmctY29udmVyc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBV0EsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBRXJELE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBRzNFOzs7OztHQUtHO0FBQ0gsTUFBTSxPQUFPLGVBQWU7SUFzSnhCLEdBQUc7SUFDSCxrQkFBa0I7SUFDbEIsR0FBRztJQUVIOzs7Ozs7O09BT0c7SUFDSSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQXlCO1FBQ25ELE1BQU0sQ0FBQyxHQUFtQztZQUN0QyxZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVk7WUFDakMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO1NBQ3RCLENBQUM7UUFDRixPQUFPLENBQUMsQ0FBQztJQUNiLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQWlDO1FBQzVELE1BQU0sQ0FBQyxHQUEwQyxJQUFJLEtBQUssRUFBa0MsQ0FBQztRQUM3RixPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRSxPQUFPLENBQUMsQ0FBQztJQUNiLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksTUFBTSxDQUFDLGVBQWUsQ0FBQyxHQUFTO1FBQ25DLE1BQU0sQ0FBQyxHQUNILFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDaEgs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O0lBQ1QsT0FBTztJQUNQLE9BQU87SUFDUCxZQUFZO0lBQ1osVUFBVTtJQUNWLFNBQVM7SUFDVCxPQUFPO0lBQ1AsUUFBUTtDQUNYLENBQUM7QUFFRjs7OztHQUlHO0FBQ1kseUNBQXlCLEdBQWE7SUFDakQsUUFBUTtJQUNSLFdBQVc7SUFDWCxhQUFhO0lBQ2IsYUFBYTtJQUNiLGVBQWU7SUFDZixjQUFjO0lBQ2QsU0FBUztDQUNaLENBQUM7QUFFRjs7OztHQUlHO0FBQ1ksMENBQTBCLEdBQWE7SUFDbEQsUUFBUTtJQUNSLGFBQWE7SUFDYixlQUFlO0lBQ2YsY0FBYztJQUNkLFNBQVM7Q0FDWixDQUFDO0FBRUY7Ozs7R0FJRztBQUNZLHlDQUF5QixHQUFhO0lBQ2pELFVBQVU7SUFDVixzQkFBc0I7SUFDdEIsbUJBQW1CO0lBQ25CLFVBQVU7SUFDVixhQUFhO0lBQ2IsZUFBZTtJQUNmLFNBQVM7SUFDVCxRQUFRO0NBQ1gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElNYXBPcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbWFwLW9wdGlvbnMnO1xuaW1wb3J0IHsgSUJveCB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWJveCc7XG5pbXBvcnQgeyBJTGF0TG9uZyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWxhdGxvbmcnO1xuaW1wb3J0IHsgSU1hcmtlck9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2ltYXJrZXItb3B0aW9ucyc7XG5pbXBvcnQgeyBJTWFya2VySWNvbkluZm8gfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2ltYXJrZXItaWNvbi1pbmZvJztcbmltcG9ydCB7IElDbHVzdGVyT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWNsdXN0ZXItb3B0aW9ucyc7XG5pbXBvcnQgeyBJSW5mb1dpbmRvd09wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lpbmZvLXdpbmRvdy1vcHRpb25zJztcbmltcG9ydCB7IElJbmZvV2luZG93QWN0aW9uIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9paW5mby13aW5kb3ctYWN0aW9uJztcbmltcG9ydCB7IElQb2x5Z29uT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaXBvbHlnb24tb3B0aW9ucyc7XG5pbXBvcnQgeyBJUG9seWxpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pcG9seWxpbmUtb3B0aW9ucyc7XG5pbXBvcnQgeyBJUG9pbnQgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lwb2ludCc7XG5pbXBvcnQgeyBNYXBUeXBlSWQgfSBmcm9tICcuLi8uLi9tb2RlbHMvbWFwLXR5cGUtaWQnO1xuaW1wb3J0IHsgTWFya2VyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcmtlcic7XG5pbXBvcnQgeyBDbHVzdGVyUGxhY2VtZW50TW9kZSB9IGZyb20gJy4uLy4uL21vZGVscy9jbHVzdGVyLXBsYWNlbWVudC1tb2RlJztcbmltcG9ydCB7IEJpbmdNYXBTZXJ2aWNlIH0gZnJvbSAnLi9iaW5nLW1hcC5zZXJ2aWNlJztcblxuLyoqXG4gKiBUaGlzIGNsYXNzIGNvbnRhaW5zIGhlbHBlcmZ1bmN0aW9ucyB0byBtYXAgdmFyaW91cyBpbnRlcmZhY2VzIHVzZWQgdG8gcmVwcmVzZW50IG9wdGlvbnMgYW5kIHN0cnVjdHVyZXMgaW50byB0aGVcbiAqIGNvcnJlc3BvbmRpbmcgQmluZyBNYXBzIFY4IHNwZWNpZmljIGltcGxlbWVudGF0aW9ucy5cbiAqXG4gKiBAZXhwb3J0XG4gKi9cbmV4cG9ydCBjbGFzcyBCaW5nQ29udmVyc2lvbnMge1xuXG4gICAgLy8vXG4gICAgLy8vIEZpZWxkIGRlY2xhcmF0aW9uc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogTWFwIG9wdGlvbiBhdHRyaWJ1dGVzIHRoYXQgYXJlIHN1cHBvcnRlZCBmb3IgY29udmVyc2lvbiB0byBCaW5nIE1hcCBwcm9wZXJ0aWVzXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgX21hcE9wdGlvbnNBdHRyaWJ1dGVzOiBzdHJpbmdbXSA9IFtcbiAgICAgICAgJ2JhY2tncm91bmRDb2xvcicsXG4gICAgICAgICdjcmVkZW50aWFscycsXG4gICAgICAgICdjdXN0b21pemVPdmVybGF5cycsXG4gICAgICAgICdjdXN0b21NYXBTdHlsZScsXG4gICAgICAgICdkaXNhYmxlQmlyZHNleWUnLFxuICAgICAgICAnZGlzYWJsZUtleWJvYXJkSW5wdXQnLFxuICAgICAgICAnZGlzYWJsZU1vdXNlSW5wdXQnLFxuICAgICAgICAnZGlzYWJsZVBhbm5pbmcnLFxuICAgICAgICAnZGlzYWJsZVRvdWNoSW5wdXQnLFxuICAgICAgICAnZGlzYWJsZVVzZXJJbnB1dCcsXG4gICAgICAgICdkaXNhYmxlWm9vbWluZycsXG4gICAgICAgICdkaXNhYmxlU3RyZWV0c2lkZScsXG4gICAgICAgICdlbmFibGVDbGlja2FibGVMb2dvJyxcbiAgICAgICAgJ2VuYWJsZVNlYXJjaExvZ28nLFxuICAgICAgICAnZml4ZWRNYXBQb3NpdGlvbicsXG4gICAgICAgICdoZWlnaHQnLFxuICAgICAgICAnaW5lcnRpYUludGVuc2l0eScsXG4gICAgICAgICduYXZpZ2F0aW9uQmFyTW9kZScsXG4gICAgICAgICdzaG93QnJlYWRjcnVtYicsXG4gICAgICAgICdzaG93Q29weXJpZ2h0JyxcbiAgICAgICAgJ3Nob3dEYXNoYm9hcmQnLFxuICAgICAgICAnc2hvd01hcFR5cGVTZWxlY3RvcicsXG4gICAgICAgICdzaG93U2NhbGViYXInLFxuICAgICAgICAndGhlbWUnLFxuICAgICAgICAndGlsZUJ1ZmZlcicsXG4gICAgICAgICd1c2VJbmVydGlhJyxcbiAgICAgICAgJ3dpZHRoJyxcbiAgICAgICAgJ2NlbnRlcicsXG4gICAgICAgICd6b29tJyxcbiAgICAgICAgJ21hcFR5cGVJZCcsXG4gICAgICAgICdsaXRlTW9kZSdcbiAgICBdO1xuXG4gICAgLyoqXG4gICAgICogVmlldyBvcHRpb24gYXR0cmlidXRlcyB0aGF0IGFyZSBzdXBwb3J0ZWQgZm9yIGNvbnZlcnNpb24gdG8gQmluZyBNYXAgcHJvcGVydGllc1xuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIF92aWV3T3B0aW9uc0F0dHJpYnV0ZXM6IHN0cmluZ1tdID0gW1xuICAgICAgICAnYW5pbWF0ZScsXG4gICAgICAgICdib3VuZHMnLFxuICAgICAgICAnY2VudGVyJyxcbiAgICAgICAgJ2NlbnRlck9mZnNldCcsXG4gICAgICAgICdoZWFkaW5nJyxcbiAgICAgICAgJ2xhYmVsT3ZlcmxheScsXG4gICAgICAgICdtYXBUeXBlSWQnLFxuICAgICAgICAncGFkZGluZycsXG4gICAgICAgICd6b29tJ1xuICAgIF07XG5cbiAgICAvKipcbiAgICAgKiBJbmZvV2luZG93IG9wdGlvbiBhdHRyaWJ1dGVzIHRoYXQgYXJlIHN1cHBvcnRlZCBmb3IgY29udmVyc2lvbiB0byBCaW5nIE1hcCBwcm9wZXJ0aWVzXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2luZm9XaW5kb3dPcHRpb25zQXR0cmlidXRlczogc3RyaW5nW10gPSBbXG4gICAgICAgICdhY3Rpb25zJyxcbiAgICAgICAgJ2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgJ2h0bWxDb250ZW50JyxcbiAgICAgICAgJ2lkJyxcbiAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgJ3BpeGVsT2Zmc2V0JyxcbiAgICAgICAgJ3Nob3dDbG9zZUJ1dHRvbicsXG4gICAgICAgICdzaG93UG9pbnRlcicsXG4gICAgICAgICdwdXNocGluJyxcbiAgICAgICAgJ3RpdGxlJyxcbiAgICAgICAgJ3RpdGxlQ2xpY2tIYW5kbGVyJyxcbiAgICAgICAgJ3R5cGVOYW1lJyxcbiAgICAgICAgJ3Zpc2libGUnLFxuICAgICAgICAnd2lkdGgnLFxuICAgICAgICAnaGVpZ2h0J1xuICAgIF07XG5cbiAgICAvKipcbiAgICAgKiBNYXJrZXIgb3B0aW9uIGF0dHJpYnV0ZXMgdGhhdCBhcmUgc3VwcG9ydGVkIGZvciBjb252ZXJzaW9uIHRvIEJpbmcgTWFwIHByb3BlcnRpZXNcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ29udmVyc2lvbnNcbiAgICAgKi9cbiAgICBwcml2YXRlIHN0YXRpYyBfbWFya2VyT3B0aW9uc0F0dHJpYnV0ZXM6IHN0cmluZ1tdID0gW1xuICAgICAgICAnYW5jaG9yJyxcbiAgICAgICAgJ2RyYWdnYWJsZScsXG4gICAgICAgICdoZWlnaHQnLFxuICAgICAgICAnaHRtbENvbnRlbnQnLFxuICAgICAgICAnaWNvbicsXG4gICAgICAgICdpbmZvYm94JyxcbiAgICAgICAgJ3N0YXRlJyxcbiAgICAgICAgJ3RpdGxlJyxcbiAgICAgICAgJ3RleHRPZmZzZXQnLFxuICAgICAgICAndHlwZU5hbWUnLFxuICAgICAgICAndmlzaWJsZScsXG4gICAgICAgICd3aWR0aCcsXG4gICAgICAgICd6SW5kZXgnXG4gICAgXTtcblxuICAgIC8qKlxuICAgICAqIFBvbHlnb24gb3B0aW9uIGF0dHJpYnV0ZXMgdGhhdCBhcmUgc3VwcG9ydGVkIGZvciBjb252ZXJzaW9uIHRvIEJpbmcgTWFwIFBvbHlnb24gcHJvcGVydGllc1xuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIF9wb2x5Z29uT3B0aW9uc0F0dHJpYnV0ZXM6IHN0cmluZ1tdID0gW1xuICAgICAgICAnY3Vyc29yJyxcbiAgICAgICAgJ2ZpbGxDb2xvcicsXG4gICAgICAgICdmaWxsT3BhY2l0eScsXG4gICAgICAgICdzdHJva2VDb2xvcicsXG4gICAgICAgICdzdHJva2VPcGFjaXR5JyxcbiAgICAgICAgJ3N0cm9rZVdlaWdodCcsXG4gICAgICAgICd2aXNpYmxlJ1xuICAgIF07XG5cbiAgICAvKipcbiAgICAgKiBQb2x5bGluZSBvcHRpb24gYXR0cmlidXRlcyB0aGF0IGFyZSBzdXBwb3J0ZWQgZm9yIGNvbnZlcnNpb24gdG8gQmluZyBNYXAgUG9seWxpbmUgcHJvcGVydGllc1xuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHByaXZhdGUgc3RhdGljIF9wb2x5bGluZU9wdGlvbnNBdHRyaWJ1dGVzOiBzdHJpbmdbXSA9IFtcbiAgICAgICAgJ2N1cnNvcicsXG4gICAgICAgICdzdHJva2VDb2xvcicsXG4gICAgICAgICdzdHJva2VPcGFjaXR5JyxcbiAgICAgICAgJ3N0cm9rZVdlaWdodCcsXG4gICAgICAgICd2aXNpYmxlJ1xuICAgIF07XG5cbiAgICAvKipcbiAgICAgKiBDbHVzdGVyIG9wdGlvbiBhdHRyaWJ1dGVzIHRoYXQgYXJlIHN1cHBvcnRlZCBmb3IgY29udmVyc2lvbiB0byBCaW5nIE1hcCBwcm9wZXJ0aWVzXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHJpdmF0ZSBzdGF0aWMgX2NsdXN0ZXJPcHRpb25zQXR0cmlidXRlczogc3RyaW5nW10gPSBbXG4gICAgICAgICdjYWxsYmFjaycsXG4gICAgICAgICdjbHVzdGVyZWRQaW5DYWxsYmFjaycsXG4gICAgICAgICdjbHVzdGVyaW5nRW5hYmxlZCcsXG4gICAgICAgICdncmlkU2l6ZScsXG4gICAgICAgICdsYXllck9mZnNldCcsXG4gICAgICAgICdwbGFjZW1lbnRNb2RlJyxcbiAgICAgICAgJ3Zpc2libGUnLFxuICAgICAgICAnekluZGV4J1xuICAgIF07XG5cbiAgICAvLy9cbiAgICAvLy8gUHVibGljIG1ldGhvZHNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIE1hcHMgYW4gSUluZm9XaW5kb3dBY3Rpb24gdG8gYSBNaWNyb3NvZnQuTWFwcy5JSW5mb2JveEFjdGlvbnNcbiAgICAgKlxuICAgICAqIEBwYXJhbSBhY3Rpb24gLSBPYmplY3QgdG8gYmUgbWFwcGVkLlxuICAgICAqIEByZXR1cm5zIC0gTmF2dGl2ZSBtYXBwZWQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgVHJhbnNsYXRlQWN0aW9uKGFjdGlvbjogSUluZm9XaW5kb3dBY3Rpb24pOiBNaWNyb3NvZnQuTWFwcy5JSW5mb2JveEFjdGlvbnMge1xuICAgICAgICBjb25zdCBhOiBNaWNyb3NvZnQuTWFwcy5JSW5mb2JveEFjdGlvbnMgPSB7XG4gICAgICAgICAgICBldmVudEhhbmRsZXI6IGFjdGlvbi5ldmVudEhhbmRsZXIsXG4gICAgICAgICAgICBsYWJlbDogYWN0aW9uLmxhYmVsXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hcHMgYW4gQXJyYXkgb2YgSUluZm9XaW5kb3dBY3Rpb24gdG8gYW4gQXJyYXkgb2YgTWljcm9zb2Z0Lk1hcHMuSUluZm9ib3hBY3Rpb25zXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWN0aW9ucyAtIEFycmF5IG9mIG9iamVjdHMgdG8gYmUgbWFwcGVkLlxuICAgICAqIEByZXR1cm5zIC0gQXJyYXkgb2YgbWFwcGVkIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBUcmFuc2xhdGVBY3Rpb25zKGFjdGlvbnM6IEFycmF5PElJbmZvV2luZG93QWN0aW9uPik6IEFycmF5PE1pY3Jvc29mdC5NYXBzLklJbmZvYm94QWN0aW9ucz4ge1xuICAgICAgICBjb25zdCBhOiBBcnJheTxNaWNyb3NvZnQuTWFwcy5JSW5mb2JveEFjdGlvbnM+ID0gbmV3IEFycmF5PE1pY3Jvc29mdC5NYXBzLklJbmZvYm94QWN0aW9ucz4oKTtcbiAgICAgICAgYWN0aW9ucy5mb3JFYWNoKHggPT4gYS5wdXNoKEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVBY3Rpb24oeCkpKTtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWFwcyBhbiBJQm94IG9iamVjdCB0byBhIE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uUmVjdCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYm94IC0gT2JqZWN0IHRvIGJlIG1hcHBlZC5cbiAgICAgKiBAcmV0dXJucyAtIE1hcHBlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBUcmFuc2xhdGVCb3VuZHMoYm94OiBJQm94KTogTWljcm9zb2Z0Lk1hcHMuTG9jYXRpb25SZWN0IHtcbiAgICAgICAgY29uc3QgcjogTWljcm9zb2Z0Lk1hcHMuTG9jYXRpb25SZWN0ID1cbiAgICAgICAgICAgIE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uUmVjdC5mcm9tRWRnZXMoYm94Lm1heExhdGl0dWRlLCBib3gubWluTG9uZ2l0dWRlLCBib3gubWluTGF0aXR1ZGUsIGJveC5tYXhMb25naXR1ZGUpO1xuICAgICAgICByZXR1cm4gcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNYXBzIGFuIElDbHVzdGVyT3B0aW9ucyBvYmplY3QgdG8gYSBNaWNyb3NvZnQuTWFwcy5JQ2x1c3RlckxheWVyT3B0aW9ucyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9iamVjdCB0byBiZSBtYXBwZWQuXG4gICAgICogQHJldHVybnMgLSBNYXBwZWQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgVHJhbnNsYXRlQ2x1c3Rlck9wdGlvbnMob3B0aW9uczogSUNsdXN0ZXJPcHRpb25zKTogTWljcm9zb2Z0Lk1hcHMuSUNsdXN0ZXJMYXllck9wdGlvbnMge1xuICAgICAgICBjb25zdCBvOiBNaWNyb3NvZnQuTWFwcy5JQ2x1c3RlckxheWVyT3B0aW9ucyB8IGFueSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgICAgICAgLmZpbHRlcihrID0+IEJpbmdDb252ZXJzaW9ucy5fY2x1c3Rlck9wdGlvbnNBdHRyaWJ1dGVzLmluZGV4T2YoaykgIT09IC0xKVxuICAgICAgICAgICAgLmZvckVhY2goKGspID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoayA9PT0gJ2xheWVyT2Zmc2V0Jykge1xuICAgICAgICAgICAgICAgICAgICBvLmxheWVyT2Zmc2V0ID0gQmluZ0NvbnZlcnNpb25zLlRyYW5zbGF0ZVBvaW50KG9wdGlvbnMubGF5ZXJPZmZzZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoayA9PT0gJ3BsYWNlbWVudE1vZGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnBsYWNlbWVudE1vZGUgPT09IENsdXN0ZXJQbGFjZW1lbnRNb2RlLkZpcnN0UGluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLnBsYWNlbWVudE1vZGUgPSBNaWNyb3NvZnQuTWFwcy5DbHVzdGVyUGxhY2VtZW50VHlwZS5GaXJzdExvY2F0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgby5wbGFjZW1lbnRNb2RlID0gTWljcm9zb2Z0Lk1hcHMuQ2x1c3RlclBsYWNlbWVudFR5cGUuTWVhbkF2ZXJhZ2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9ba10gPSAoPGFueT5vcHRpb25zKVtrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG87XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWFwcyBhbiBJSW5mb1dpbmRvd09wdGlvbnMgb2JqZWN0IHRvIGEgTWljcm9zb2Z0Lk1hcHMuSUluZm9ib3hPcHRpb25zIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gT2JqZWN0IHRvIGJlIG1hcHBlZC5cbiAgICAgKiBAcmV0dXJucyAtIE1hcHBlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBUcmFuc2xhdGVJbmZvQm94T3B0aW9ucyhvcHRpb25zOiBJSW5mb1dpbmRvd09wdGlvbnMpOiBNaWNyb3NvZnQuTWFwcy5JSW5mb2JveE9wdGlvbnMge1xuICAgICAgICBjb25zdCBvOiBNaWNyb3NvZnQuTWFwcy5JSW5mb2JveE9wdGlvbnMgfCBhbnkgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXMob3B0aW9ucylcbiAgICAgICAgICAgIC5maWx0ZXIoayA9PiBCaW5nQ29udmVyc2lvbnMuX2luZm9XaW5kb3dPcHRpb25zQXR0cmlidXRlcy5pbmRleE9mKGspICE9PSAtMSlcbiAgICAgICAgICAgIC5mb3JFYWNoKChrKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGsgPT09ICdwaXhlbE9mZnNldCcpIHtcbiAgICAgICAgICAgICAgICAgICAgby5vZmZzZXQgPSBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlUG9pbnQob3B0aW9ucy5waXhlbE9mZnNldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGsgPT09ICdwb3NpdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgby5sb2NhdGlvbiA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVMb2NhdGlvbihvcHRpb25zLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoayA9PT0gJ2FjdGlvbnMnKSB7XG4gICAgICAgICAgICAgICAgICAgIG8uYWN0aW9ucyA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVBY3Rpb25zKG9wdGlvbnMuYWN0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvW2tdID0gKDxhbnk+b3B0aW9ucylba107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hcHMgYW4gSU1hcE9wdGlvbnMgb2JqZWN0IHRvIGEgTWljcm9zb2Z0Lk1hcHMuSU1hcExvYWRPcHRpb25zIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gT2JqZWN0IHRvIGJlIG1hcHBlZC5cbiAgICAgKiBAcmV0dXJucyAtIE1hcHBlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBUcmFuc2xhdGVMb2FkT3B0aW9ucyhvcHRpb25zOiBJTWFwT3B0aW9ucyk6IE1pY3Jvc29mdC5NYXBzLklNYXBMb2FkT3B0aW9ucyB7XG4gICAgICAgIGNvbnN0IG86IE1pY3Jvc29mdC5NYXBzLklNYXBMb2FkT3B0aW9ucyB8IGFueSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgICAgICAgLmZpbHRlcihrID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQmluZ0NvbnZlcnNpb25zLl9tYXBPcHRpb25zQXR0cmlidXRlcy5pbmRleE9mKGspICE9PSAtMSB8fCBCaW5nQ29udmVyc2lvbnMuX3ZpZXdPcHRpb25zQXR0cmlidXRlcy5pbmRleE9mKGspICE9PSAtMTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChrID09PSAnY2VudGVyJykge1xuICAgICAgICAgICAgICAgICAgICBvLmNlbnRlciA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVMb2NhdGlvbihvcHRpb25zLmNlbnRlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGsgPT09ICdtYXBUeXBlSWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm1hcFR5cGVJZCA9PT0gTWFwVHlwZUlkLmh5YnJpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgby5tYXBUeXBlSWQgPSBNaWNyb3NvZnQuTWFwcy5NYXBUeXBlSWQuYWVyaWFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgby5sYWJlbE92ZXJsYXkgPSBNaWNyb3NvZnQuTWFwcy5MYWJlbE92ZXJsYXkudmlzaWJsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChvcHRpb25zLm1hcFR5cGVJZCA9PT0gTWFwVHlwZUlkLmFlcmlhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgby5tYXBUeXBlSWQgPSBNaWNyb3NvZnQuTWFwcy5NYXBUeXBlSWQuYWVyaWFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgby5sYWJlbE92ZXJsYXkgPSBNaWNyb3NvZnQuTWFwcy5MYWJlbE92ZXJsYXkuaGlkZGVuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgby5tYXBUeXBlSWQgPSBNaWNyb3NvZnQuTWFwcy5NYXBUeXBlSWRbKDxhbnk+TWFwVHlwZUlkKVtvcHRpb25zLm1hcFR5cGVJZF1dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGsgPT09ICdib3VuZHMnKSB7XG4gICAgICAgICAgICAgICAgICAgIG8uYm91bmRzID0gQmluZ0NvbnZlcnNpb25zLlRyYW5zbGF0ZUJvdW5kcyhvcHRpb25zLmJvdW5kcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvW2tdID0gKDxhbnk+b3B0aW9ucylba107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hcHMgYW4gSUxhdExvbmcgb2JqZWN0IHRvIGEgTWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24gb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGxhdGxvbmcgLSBPYmplY3QgdG8gYmUgbWFwcGVkLlxuICAgICAqIEByZXR1cm5zIC0gTWFwcGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ29udmVyc2lvbnNcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIFRyYW5zbGF0ZUxvY2F0aW9uKGxhdGxvbmc6IElMYXRMb25nKTogTWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24ge1xuICAgICAgICBjb25zdCBsOiBNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbiA9IG5ldyBNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbihsYXRsb25nLmxhdGl0dWRlLCBsYXRsb25nLmxvbmdpdHVkZSk7XG4gICAgICAgIHJldHVybiBsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hcHMgYW4gSU1hcmtlck9wdGlvbnMgb2JqZWN0IHRvIGEgTWljcm9zb2Z0Lk1hcHMuSVB1c2hwaW5PcHRpb25zIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gT2JqZWN0IHRvIGJlIG1hcHBlZC5cbiAgICAgKiBAcmV0dXJucyAtIFRoZSBtYXBwZWQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgVHJhbnNsYXRlTWFya2VyT3B0aW9ucyhvcHRpb25zOiBJTWFya2VyT3B0aW9ucyk6IE1pY3Jvc29mdC5NYXBzLklQdXNocGluT3B0aW9ucyB7XG4gICAgICAgIGNvbnN0IG86IE1pY3Jvc29mdC5NYXBzLklQdXNocGluT3B0aW9ucyA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgICAgICAgLmZpbHRlcihrID0+IEJpbmdDb252ZXJzaW9ucy5fbWFya2VyT3B0aW9uc0F0dHJpYnV0ZXMuaW5kZXhPZihrKSAhPT0gLTEpXG4gICAgICAgICAgICAuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChrID09PSAnYW5jaG9yJykge1xuICAgICAgICAgICAgICAgICAgICBvLmFuY2hvciA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVQb2ludChvcHRpb25zLmFuY2hvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAoPGFueT5vKVtrXSA9ICg8YW55Pm9wdGlvbnMpW2tdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNYXBzIGFuIElNYXBPcHRpb25zIG9iamVjdCB0byBhIE1pY3Jvc29mdC5NYXBzLklNYXBPcHRpb25zIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gT2JqZWN0IHRvIGJlIG1hcHBlZC5cbiAgICAgKiBAcmV0dXJucyAtIE1hcHBlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBUcmFuc2xhdGVPcHRpb25zKG9wdGlvbnM6IElNYXBPcHRpb25zKTogTWljcm9zb2Z0Lk1hcHMuSU1hcE9wdGlvbnMge1xuICAgICAgICBjb25zdCBvOiBNaWNyb3NvZnQuTWFwcy5JTWFwT3B0aW9ucyB8IGFueSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgICAgICAgLmZpbHRlcihrID0+IEJpbmdDb252ZXJzaW9ucy5fbWFwT3B0aW9uc0F0dHJpYnV0ZXMuaW5kZXhPZihrKSAhPT0gLTEpXG4gICAgICAgICAgICAuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChrID09PSAnY2VudGVyJykge1xuICAgICAgICAgICAgICAgICAgICBvLmNlbnRlciA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVMb2NhdGlvbihvcHRpb25zLmNlbnRlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGsgPT09ICdtYXBUeXBlSWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIG8ubWFwVHlwZUlkID0gTWljcm9zb2Z0Lk1hcHMuTWFwVHlwZUlkWyg8YW55Pk1hcFR5cGVJZClbb3B0aW9ucy5tYXBUeXBlSWRdXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG9ba10gPSAoPGFueT5vcHRpb25zKVtrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG87XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJhbnNsYXRlcyBhbiBhcnJheSBvZiBsb2NhdGlvbnMgb3IgYW4gYXJyYXkgb3IgYXJyYXlzIG9mIGxvY2F0aW9uIHRvIGFuZCBhcnJheSBvZiBhcnJheXMgb2YgQmluZyBNYXAgTG9jYXRpb25zXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGF0aHMgLSBJTGF0TG9uZyBiYXNlZCBsb2NhdGlvbnMgdG8gY29udmVydC5cbiAgICAgKiBAcmV0dXJucyAtIGNvbnZlcnRlZCBsb2NhdGlvbnMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBUcmFuc2xhdGVQYXRocyhwYXRoczogQXJyYXk8SUxhdExvbmc+IHwgQXJyYXk8QXJyYXk8SUxhdExvbmc+Pik6IEFycmF5PEFycmF5PE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uPj4ge1xuICAgICAgICBjb25zdCBwOiBBcnJheTxBcnJheTxNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbj4+ID0gbmV3IEFycmF5PEFycmF5PE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uPj4oKTtcbiAgICAgICAgaWYgKHBhdGhzID09IG51bGwgfHwgIUFycmF5LmlzQXJyYXkocGF0aHMpIHx8IHBhdGhzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcC5wdXNoKG5ldyBBcnJheTxNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbj4oKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShwYXRoc1swXSkpIHtcbiAgICAgICAgICAgIC8vIHBhcmFtZXRlciBpcyBhbiBhcnJheSBvciBhcnJheXNcbiAgICAgICAgICAgIC8vIHVzIGZvciBsb29wIGZvciBwZXJmb3JtYW5jZVxuICAgICAgICAgICAgY29uc3QgcDEgPSA8QXJyYXk8QXJyYXk8SUxhdExvbmc+Pj5wYXRocztcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcDEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBfcDogQXJyYXk8TWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24+ID0gbmV3IEFycmF5PE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uPigpO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcDFbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgX3AucHVzaChuZXcgTWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24ocDFbaV1bal0ubGF0aXR1ZGUsIHAxW2ldW2pdLmxvbmdpdHVkZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwLnB1c2goX3ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gcGFyYW1ldGVyIGlzIGEgc2ltcGxlIGFycmF5Li4uLlxuICAgICAgICAgICAgY29uc3QgeTogQXJyYXk8TWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24+ID0gbmV3IEFycmF5PE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uPigpO1xuICAgICAgICAgICAgY29uc3QgcDEgPSA8QXJyYXk8SUxhdExvbmc+PnBhdGhzO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwMS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHkucHVzaChuZXcgTWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24ocDFbaV0ubGF0aXR1ZGUsIHAxW2ldLmxvbmdpdHVkZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcC5wdXNoKHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqICBNYXBzIGFuIElQb2ludCBvYmplY3QgdG8gYSBNaWNyb3NvZnQuTWFwcy5Qb2ludCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcG9pbnQgLSBPYmplY3QgdG8gYmUgbWFwcGVkLlxuICAgICAqIEByZXR1cm5zIC0gTWFwcGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ29udmVyc2lvbnNcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIFRyYW5zbGF0ZVBvaW50KHBvaW50OiBJUG9pbnQpOiBNaWNyb3NvZnQuTWFwcy5Qb2ludCB7XG4gICAgICAgIGNvbnN0IHA6IE1pY3Jvc29mdC5NYXBzLlBvaW50ID0gbmV3IE1pY3Jvc29mdC5NYXBzLlBvaW50KHBvaW50LngsIHBvaW50LnkpO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiAgTWFwcyBhbiBJUG9seWdvbk9wdGlvbnMgb2JqZWN0IHRvIGEgTWljcm9zb2Z0Lk1hcHMuSVBvbHlnb25PcHRpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBPYmplY3QgdG8gYmUgbWFwcGVkLlxuICAgICAqIEByZXR1cm5zIC0gTWFwcGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ29udmVyc2lvbnNcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIFRyYW5zbGF0ZVBvbHlnb25PcHRpb25zKG9wdGlvbnM6IElQb2x5Z29uT3B0aW9ucyk6IE1pY3Jvc29mdC5NYXBzLklQb2x5Z29uT3B0aW9ucyB7XG4gICAgICAgIGNvbnN0IG86IE1pY3Jvc29mdC5NYXBzLklQb2x5Z29uT3B0aW9ucyA9IHt9O1xuICAgICAgICBjb25zdCBmOiAoczogc3RyaW5nLCBhOiBudW1iZXIpID0+IHN0cmluZyA9IChzLCBhKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtID0gL3JnYmE/XFwoKFxcZCspXFxzKixcXHMqKFxcZCspXFxzKixcXHMqKFxcZCspXFxzKigsXFxzKlxcZCtbXFwuXFxkK10qKSpcXCkvZy5leGVjKHMpO1xuICAgICAgICAgICAgaWYgKG0gJiYgbS5sZW5ndGggPiAzKSB7XG4gICAgICAgICAgICAgICAgYSA9IGEgPiAxID8gKGEgLyAxMDApIDogYTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3JnYmEoJyArIFttWzFdLCBtWzJdLCBtWzNdLCBhXS5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzWzBdID09PSAnIycpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB4OiBudW1iZXIgPSBhID4gMSA/IGEgOiBNYXRoLmZsb29yKGEgKiAyNTUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHo6IHN0cmluZyA9IHMuc3Vic3RyKDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHI6IG51bWJlciA9IHBhcnNlSW50KHouc3Vic3RyKDAsIDIpLCAxNik7XG4gICAgICAgICAgICAgICAgY29uc3QgZzogbnVtYmVyID0gcGFyc2VJbnQoei5zdWJzdHIoMiwgMiksIDE2KTtcbiAgICAgICAgICAgICAgICBjb25zdCBiOiBudW1iZXIgPSBwYXJzZUludCh6LnN1YnN0cig0LCAyKSwgMTYpO1xuICAgICAgICAgICAgICAgIHJldHVybiAncmdiYSgnICsgW3IgLCBnLCBiLCBhXS5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgICAgICAgLmZpbHRlcihrID0+IEJpbmdDb252ZXJzaW9ucy5fcG9seWdvbk9wdGlvbnNBdHRyaWJ1dGVzLmluZGV4T2YoaykgIT09IC0xKVxuICAgICAgICAgICAgLmZvckVhY2goKGspID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoayA9PT0gJ3N0cm9rZVdlaWdodCcpIHtcbiAgICAgICAgICAgICAgICAgICAgby5zdHJva2VUaGlja25lc3MgPSBvcHRpb25zLnN0cm9rZVdlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoayA9PT0gJ3N0cm9rZUNvbG9yJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zdHJva2VPcGFjaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLnN0cm9rZUNvbG9yID0gZihvcHRpb25zLnN0cm9rZUNvbG9yLCBvcHRpb25zLnN0cm9rZU9wYWNpdHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgby5zdHJva2VDb2xvciA9IG9wdGlvbnMuc3Ryb2tlQ29sb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoayA9PT0gJ3N0cm9rZU9wYWNpdHknKSB7fVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGsgPT09ICdmaWxsQ29sb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmZpbGxPcGFjaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLmZpbGxDb2xvciA9IGYob3B0aW9ucy5maWxsQ29sb3IsIG9wdGlvbnMuZmlsbE9wYWNpdHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgby5maWxsQ29sb3IgPSBvcHRpb25zLmZpbGxDb2xvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrID09PSAnZmlsbE9wYWNpdHknKSB7fVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAoPGFueT5vKVtrXSA9ICg8YW55Pm9wdGlvbnMpW2tdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiAgTWFwcyBhbiBJUG9seWxpbmVPcHRpb25zIG9iamVjdCB0byBhIE1pY3Jvc29mdC5NYXBzLklQb2x5bGluZU9wdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9iamVjdCB0byBiZSBtYXBwZWQuXG4gICAgICogQHJldHVybnMgLSBNYXBwZWQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDb252ZXJzaW9uc1xuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgVHJhbnNsYXRlUG9seWxpbmVPcHRpb25zKG9wdGlvbnM6IElQb2x5bGluZU9wdGlvbnMpOiBNaWNyb3NvZnQuTWFwcy5JUG9seWxpbmVPcHRpb25zIHtcbiAgICAgICAgY29uc3QgbzogTWljcm9zb2Z0Lk1hcHMuSVBvbHlsaW5lT3B0aW9ucyB8IGFueSA9IHt9O1xuICAgICAgICBjb25zdCBmOiAoczogc3RyaW5nLCBhOiBudW1iZXIpID0+IHN0cmluZyA9IChzLCBhKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtID0gL3JnYmE/XFwoKFxcZCspXFxzKixcXHMqKFxcZCspXFxzKixcXHMqKFxcZCspXFxzKigsXFxzKlxcZCtbXFwuXFxkK10qKSpcXCkvZy5leGVjKHMpO1xuICAgICAgICAgICAgaWYgKG0gJiYgbS5sZW5ndGggPiAzKSB7XG4gICAgICAgICAgICAgICAgYSA9IGEgPiAxID8gKGEgLyAxMDApIDogYTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3JnYmEoJyArIFttWzFdLCBtWzJdLCBtWzNdLCBhXS5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzWzBdID09PSAnIycpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB4OiBudW1iZXIgPSBhID4gMSA/IGEgOiBNYXRoLmZsb29yKGEgKiAyNTUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHo6IHN0cmluZyA9IHMuc3Vic3RyKDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHI6IG51bWJlciA9IHBhcnNlSW50KHouc3Vic3RyKDAsIDIpLCAxNik7XG4gICAgICAgICAgICAgICAgY29uc3QgZzogbnVtYmVyID0gcGFyc2VJbnQoei5zdWJzdHIoMiwgMiksIDE2KTtcbiAgICAgICAgICAgICAgICBjb25zdCBiOiBudW1iZXIgPSBwYXJzZUludCh6LnN1YnN0cig0LCAyKSwgMTYpO1xuICAgICAgICAgICAgICAgIHJldHVybiAncmdiYSgnICsgW3IgLCBnLCBiLCBhXS5qb2luKCcsJykgKyAnKSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgT2JqZWN0LmtleXMob3B0aW9ucylcbiAgICAgICAgICAgIC5maWx0ZXIoayA9PiBCaW5nQ29udmVyc2lvbnMuX3BvbHlsaW5lT3B0aW9uc0F0dHJpYnV0ZXMuaW5kZXhPZihrKSAhPT0gLTEpXG4gICAgICAgICAgICAuZm9yRWFjaCgoaykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChrID09PSAnc3Ryb2tlV2VpZ2h0Jykge1xuICAgICAgICAgICAgICAgICAgICBvLnN0cm9rZVRoaWNrbmVzcyA9IG9wdGlvbnMuc3Ryb2tlV2VpZ2h0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ3N0cm9rZUNvbG9yJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zdHJva2VPcGFjaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvLnN0cm9rZUNvbG9yID0gZihvcHRpb25zLnN0cm9rZUNvbG9yLCBvcHRpb25zLnN0cm9rZU9wYWNpdHkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgby5zdHJva2VDb2xvciA9IG9wdGlvbnMuc3Ryb2tlQ29sb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoayA9PT0gJ3N0cm9rZU9wYWNpdHknKSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvW2tdID0gKDxhbnk+b3B0aW9ucylba107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hcHMgYW4gSU1hcE9wdGlvbnMgb2JqZWN0IHRvIGEgTWljcm9zb2Z0Lk1hcHMuSVZpZXdPcHRpb25zIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gT2JqZWN0IHRvIGJlIG1hcHBlZC5cbiAgICAgKiBAcmV0dXJucyAtIE1hcHBlZCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NvbnZlcnNpb25zXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBUcmFuc2xhdGVWaWV3T3B0aW9ucyhvcHRpb25zOiBJTWFwT3B0aW9ucyk6IE1pY3Jvc29mdC5NYXBzLklWaWV3T3B0aW9ucyB7XG4gICAgICAgIGNvbnN0IG86IE1pY3Jvc29mdC5NYXBzLklWaWV3T3B0aW9ucyB8IGFueSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyhvcHRpb25zKVxuICAgICAgICAgICAgLmZpbHRlcihrID0+IEJpbmdDb252ZXJzaW9ucy5fdmlld09wdGlvbnNBdHRyaWJ1dGVzLmluZGV4T2YoaykgIT09IC0xKVxuICAgICAgICAgICAgLmZvckVhY2goKGspID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoayA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgby5jZW50ZXIgPSBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlTG9jYXRpb24ob3B0aW9ucy5jZW50ZXIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoayA9PT0gJ2JvdW5kcycpIHtcbiAgICAgICAgICAgICAgICAgICAgby5ib3VuZHMgPSBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlQm91bmRzKG9wdGlvbnMuYm91bmRzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGsgPT09ICdjZW50ZXJPZmZzZXQnKSB7XG4gICAgICAgICAgICAgICAgICAgIG8uY2VudGVyT2Zmc2V0ID0gQmluZ0NvbnZlcnNpb25zLlRyYW5zbGF0ZVBvaW50KG9wdGlvbnMuY2VudGVyT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGsgPT09ICdtYXBUeXBlSWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIG8ubWFwVHlwZUlkID0gTWljcm9zb2Z0Lk1hcHMuTWFwVHlwZUlkWyg8YW55Pk1hcFR5cGVJZClbb3B0aW9ucy5tYXBUeXBlSWRdXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvW2tdID0gKDxhbnk+b3B0aW9ucylba107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvO1xuICAgIH1cblxufVxuIl19