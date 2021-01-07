import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { MapAPILoader } from '../mapapiloader';
import { BingConversions } from './bing-conversions';
import { Marker } from '../../models/marker';
import { BingMarker } from '../../models/bing/bing-marker';
import { BingLayer } from '../../models/bing/bing-layer';
import { BingClusterLayer } from '../../models/bing/bing-cluster-layer';
import { BingInfoWindow } from '../../models/bing/bing-info-window';
import { BingPolygon } from '../../models/bing/bing-polygon';
import { BingPolyline } from '../../models/bing/bing-polyline';
import { MixinMapLabelWithOverlayView } from '../../models/bing/bing-label';
import { MixinCanvasOverlay } from '../../models/bing/bing-canvas-overlay';
import { BingCanvasOverlay } from '../../models/bing/bing-canvas-overlay';
import { BingMapEventsLookup } from '../../models/bing/bing-events-lookup';
/**
 * Concrete implementation of the MapService abstract implementing a Bin Map V8 provider
 *
 * @export
 */
export class BingMapService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingMapService.
     * @param _loader MapAPILoader instance implemented for Bing Maps. This instance will generally be injected.
     * @param _zone NgZone object to enable zone aware promises. This will generally be injected.
     *
     * @memberof BingMapService
     */
    constructor(_loader, _zone) {
        this._loader = _loader;
        this._zone = _zone;
        this._modules = new Map();
        this._map = new Promise((resolve) => { this._mapResolver = resolve; });
        this._config = this._loader.Config;
    }
    ///
    /// Property Definitions
    ///
    /**
     * Gets an array of loaded Bong modules.
     *
     * @readonly
     * @memberof BingMapService
     */
    get LoadedModules() { return this._modules; }
    /**
     * Gets the Bing Map control instance underlying the implementation
     *
     * @readonly
     * @memberof BingMapService
     */
    get MapInstance() { return this._mapInstance; }
    /**
     * Gets a Promise for a Bing Map control instance underlying the implementation. Use this instead of {@link MapInstance} if you
     * are not sure if and when the instance will be created.
     * @readonly
     * @memberof BingMapService
     */
    get MapPromise() { return this._map; }
    /**
     * Gets the maps physical size.
     *
     * @readonly
     * @abstract
     * @memberof BingMapService
     */
    get MapSize() {
        if (this.MapInstance) {
            const s = { width: this.MapInstance.getWidth(), height: this.MapInstance.getHeight() };
            return s;
        }
        return null;
    }
    ///
    /// Public methods and MapService interface implementation
    ///
    /**
     * Creates a canvas overlay layer to perform custom drawing over the map with out
     * some of the overhead associated with going through the Map objects.
     * @param drawCallback A callback function that is triggered when the canvas is ready to be
     * rendered for the current map view.
     * @returns - Promise of a {@link CanvasOverlay} object.
     * @memberof BingMapService
     */
    CreateCanvasOverlay(drawCallback) {
        return this._map.then((map) => {
            const overlay = new BingCanvasOverlay(drawCallback);
            map.layers.insert(overlay);
            return overlay;
        });
    }
    /**
     * Creates a Bing map cluster layer within the map context
     *
     * @param options - Options for the layer. See {@link IClusterOptions}.
     * @returns - Promise of a {@link Layer} object, which models the underlying Microsoft.Maps.ClusterLayer object.
     *
     * @memberof BingMapService
     */
    CreateClusterLayer(options) {
        return this._map.then((map) => {
            const p = new Promise(resolve => {
                this.LoadModule('Microsoft.Maps.Clustering', () => {
                    const o = BingConversions.TranslateClusterOptions(options);
                    const layer = new Microsoft.Maps.ClusterLayer(new Array(), o);
                    let bl;
                    map.layers.insert(layer);
                    bl = new BingClusterLayer(layer, this);
                    bl.SetOptions(options);
                    resolve(bl);
                });
            });
            return p;
        });
    }
    /**
     * Creates an information window for a map position
     *
     * @param [options] - Infowindow options. See {@link IInfoWindowOptions}
     * @returns - Promise of a {@link InfoWindow} object, which models the underlying Microsoft.Maps.Infobox object.
     *
     * @memberof BingMapService
     */
    CreateInfoWindow(options) {
        return this._map.then((map) => {
            let loc;
            if (options.position == null) {
                loc = map.getCenter();
            }
            else {
                loc = new Microsoft.Maps.Location(options.position.latitude, options.position.longitude);
            }
            const infoBox = new Microsoft.Maps.Infobox(loc, BingConversions.TranslateInfoBoxOptions(options));
            infoBox.setMap(map);
            return new BingInfoWindow(infoBox);
        });
    }
    /**
     * Creates a map layer within the map context
     *
     * @param options - Options for the layer. See {@link ILayerOptions}
     * @returns - Promise of a {@link Layer} object, which models the underlying Microsoft.Maps.Layer object.
     *
     * @memberof BingMapService
     */
    CreateLayer(options) {
        return this._map.then((map) => {
            const layer = new Microsoft.Maps.Layer(options.id.toString());
            map.layers.insert(layer);
            return new BingLayer(layer, this);
        });
    }
    /**
     * Creates a map instance
     *
     * @param el - HTML element to host the map.
     * @param mapOptions - Map options
     * @returns - Promise fullfilled once the map has been created.
     *
     * @memberof BingMapService
     */
    CreateMap(el, mapOptions) {
        return this._loader.Load().then(() => {
            // apply mixins
            MixinMapLabelWithOverlayView();
            MixinCanvasOverlay();
            // map startup...
            if (this._mapInstance != null) {
                this.DisposeMap();
            }
            const o = BingConversions.TranslateLoadOptions(mapOptions);
            if (!o.credentials) {
                o.credentials = this._config.apiKey;
            }
            const map = new Microsoft.Maps.Map(el, o);
            this._mapInstance = map;
            this._mapResolver(map);
        });
    }
    /**
     * Creates a Bing map marker within the map context
     *
     * @param [options=<IMarkerOptions>{}] - Options for the marker. See {@link IMarkerOptions}.
     * @returns - Promise of a {@link Marker} object, which models the underlying Microsoft.Maps.PushPin object.
     *
     * @memberof BingMapService
     */
    CreateMarker(options = {}) {
        const payload = (icon, map) => {
            const loc = BingConversions.TranslateLocation(options.position);
            const o = BingConversions.TranslateMarkerOptions(options);
            if (icon && icon !== '') {
                o.icon = icon;
            }
            const pushpin = new Microsoft.Maps.Pushpin(loc, o);
            const marker = new BingMarker(pushpin, map, null);
            if (options.metadata) {
                options.metadata.forEach((v, k) => marker.Metadata.set(k, v));
            }
            map.entities.push(pushpin);
            return marker;
        };
        return this._map.then((map) => {
            if (options.iconInfo && options.iconInfo.markerType) {
                const s = Marker.CreateMarker(options.iconInfo);
                if (typeof (s) === 'string') {
                    return (payload(s, map));
                }
                else {
                    return s.then(x => {
                        return (payload(x.icon, map));
                    });
                }
            }
            else {
                return (payload(null, map));
            }
        });
    }
    /**
     * Creates a polygon within the Bing Maps V8 map context
     *
     * @abstract
     * @param options - Options for the polygon. See {@link IPolygonOptions}.
     * @returns - Promise of a {@link Polygon} object, which models the underlying native polygon.
     *
     * @memberof MapService
     */
    CreatePolygon(options) {
        return this._map.then((map) => {
            const locs = BingConversions.TranslatePaths(options.paths);
            const o = BingConversions.TranslatePolygonOptions(options);
            const poly = new Microsoft.Maps.Polygon(locs, o);
            map.entities.push(poly);
            const p = new BingPolygon(poly, this, null);
            if (options.metadata) {
                options.metadata.forEach((v, k) => p.Metadata.set(k, v));
            }
            if (options.title && options.title !== '') {
                p.Title = options.title;
            }
            if (options.showLabel != null) {
                p.ShowLabel = options.showLabel;
            }
            if (options.showTooltip != null) {
                p.ShowTooltip = options.showTooltip;
            }
            if (options.labelMaxZoom != null) {
                p.LabelMaxZoom = options.labelMaxZoom;
            }
            if (options.labelMinZoom != null) {
                p.LabelMinZoom = options.labelMinZoom;
            }
            if (options.editable) {
                p.SetEditable(options.editable);
            }
            return p;
        });
    }
    /**
     * Creates a polyline within the Bing Maps V8 map context
     *
     * @abstract
     * @param options - Options for the polyline. See {@link IPolylineOptions}.
     * @returns - Promise of a {@link Polyline} object (or an array thereof for complex paths),
     * which models the underlying native polygon.
     *
     * @memberof MapService
     */
    CreatePolyline(options) {
        let polyline;
        return this._map.then((map) => {
            const o = BingConversions.TranslatePolylineOptions(options);
            const locs = BingConversions.TranslatePaths(options.path);
            if (options.path && options.path.length > 0 && !Array.isArray(options.path[0])) {
                polyline = new Microsoft.Maps.Polyline(locs[0], o);
                map.entities.push(polyline);
                const pl = new BingPolyline(polyline, map, null);
                if (options.metadata) {
                    options.metadata.forEach((v, k) => pl.Metadata.set(k, v));
                }
                if (options.title && options.title !== '') {
                    pl.Title = options.title;
                }
                if (options.showTooltip != null) {
                    pl.ShowTooltip = options.showTooltip;
                }
                return pl;
            }
            else {
                const lines = new Array();
                locs.forEach(p => {
                    polyline = new Microsoft.Maps.Polyline(p, o);
                    map.entities.push(polyline);
                    const pl = new BingPolyline(polyline, map, null);
                    if (options.metadata) {
                        options.metadata.forEach((v, k) => pl.Metadata.set(k, v));
                    }
                    if (options.title && options.title !== '') {
                        pl.Title = options.title;
                    }
                    if (options.showTooltip != null) {
                        pl.ShowTooltip = options.showTooltip;
                    }
                    lines.push(pl);
                });
                return lines;
            }
        });
    }
    /**
     * Deletes a layer from the map.
     *
     * @param layer - Layer to delete. See {@link Layer}. This method expects the Bing specific Layer model implementation.
     * @returns - Promise fullfilled when the layer has been removed.
     *
     * @memberof BingMapService
     */
    DeleteLayer(layer) {
        return this._map.then((map) => {
            map.layers.remove(layer.NativePrimitve);
        });
    }
    /**
     * Dispaose the map and associated resoures.
     *
     * @memberof BingMapService
     */
    DisposeMap() {
        if (this._map == null && this._mapInstance == null) {
            return;
        }
        if (this._mapInstance != null) {
            this._mapInstance.dispose();
            this._mapInstance = null;
            this._map = new Promise((resolve) => { this._mapResolver = resolve; });
        }
    }
    /**
     * Gets the geo coordinates of the map center
     *
     * @returns - A promise that when fullfilled contains the goe location of the center. See {@link ILatLong}.
     *
     * @memberof BingMapService
     */
    GetCenter() {
        return this._map.then((map) => {
            const center = map.getCenter();
            return {
                latitude: center.latitude,
                longitude: center.longitude
            };
        });
    }
    /**
     * Gets the geo coordinates of the map bounding box
     *
     * @returns - A promise that when fullfilled contains the goe location of the bounding box. See {@link IBox}.
     *
     * @memberof BingMapService
     */
    GetBounds() {
        return this._map.then((map) => {
            const box = map.getBounds();
            return {
                maxLatitude: box.getNorth(),
                maxLongitude: box.crossesInternationalDateLine() ? box.getWest() : box.getEast(),
                minLatitude: box.getSouth(),
                minLongitude: box.crossesInternationalDateLine() ? box.getEast() : box.getWest(),
                center: { latitude: box.center.latitude, longitude: box.center.longitude },
                padding: 0
            };
        });
    }
    /**
     * Gets a shared or private instance of the map drawing tools.
     *
     * @param [useSharedInstance=true] - Set to false to create a private instance.
     * @returns - Promise that when resolved containst an instance of the drawing tools.
     * @memberof BingMapService
     */
    GetDrawingTools(useSharedInstance = true) {
        return new Promise((resolve, reject) => {
            this.LoadModuleInstance('Microsoft.Maps.DrawingTools', useSharedInstance).then((o) => {
                resolve(o);
            });
        });
    }
    /**
     * Gets the current zoom level of the map.
     *
     * @returns - A promise that when fullfilled contains the zoom level.
     *
     * @memberof BingMapService
     */
    GetZoom() {
        return this._map.then((map) => map.getZoom());
    }
    /**
     * Loads a module into the Map.
     *
     * @param moduleName - The module to load.
     * @param callback - Callback to call once loading is complete.
     * @method
     * @memberof BingMapService
     */
    LoadModule(moduleName, callback) {
        if (this._modules.has(moduleName)) {
            callback();
        }
        else {
            Microsoft.Maps.loadModule(moduleName, () => {
                this._modules.set(moduleName, null);
                callback();
            });
        }
    }
    /**
     * Loads a module into the Map and delivers and instance of the module payload.
     *
     * @param moduleName - The module to load.
     * @param useSharedInstance- Use a shared instance if true, create a new instance if false.
     * @method
     * @memberof BingMapService
     */
    LoadModuleInstance(moduleName, useSharedInstance = true) {
        const s = moduleName.substr(moduleName.lastIndexOf('.') + 1);
        if (this._modules.has(moduleName)) {
            let o = null;
            if (!useSharedInstance) {
                o = new Microsoft.Maps[s](this._mapInstance);
            }
            else if (this._modules.get(moduleName) != null) {
                o = this._modules.get(moduleName);
            }
            else {
                o = new Microsoft.Maps[s](this._mapInstance);
                this._modules.set(moduleName, o);
            }
            return Promise.resolve(o);
        }
        else {
            return new Promise((resolve, reject) => {
                try {
                    Microsoft.Maps.loadModule(moduleName, () => {
                        const o = new Microsoft.Maps[s](this._mapInstance);
                        if (useSharedInstance) {
                            this._modules.set(moduleName, o);
                        }
                        else {
                            this._modules.set(moduleName, null);
                        }
                        resolve(o);
                    });
                }
                catch (e) {
                    reject('Could not load module or create instance.');
                }
            });
        }
    }
    /**
     * Provides a conversion of geo coordinates to pixels on the map control.
     *
     * @param loc - The geo coordinates to translate.
     * @returns - Promise of an {@link IPoint} interface representing the pixels. This promise resolves to null
     * if the goe coordinates are not in the view port.
     *
     * @memberof BingMapService
     */
    LocationToPoint(loc) {
        return this._map.then((m) => {
            const l = BingConversions.TranslateLocation(loc);
            const p = m.tryLocationToPixel(l, Microsoft.Maps.PixelReference.control);
            if (p != null) {
                return { x: p.x, y: p.y };
            }
            return null;
        });
    }
    /**
     * Provides a conversion of geo coordinates to pixels on the map control.
     *
     * @param loc - The geo coordinates to translate.
     * @returns - Promise of an {@link IPoint} interface array representing the pixels.
     *
     * @memberof BingMapService
     */
    LocationsToPoints(locs) {
        return this._map.then((m) => {
            const l = locs.map(loc => BingConversions.TranslateLocation(loc));
            const p = m.tryLocationToPixel(l, Microsoft.Maps.PixelReference.control);
            return p ? p : new Array();
        });
    }
    /**
     * Centers the map on a geo location.
     *
     * @param latLng - GeoCoordinates around which to center the map. See {@link ILatLong}
     * @returns - Promise that is fullfilled when the center operations has been completed.
     *
     * @memberof BingMapService
     */
    SetCenter(latLng) {
        return this._map.then((map) => map.setView({
            center: BingConversions.TranslateLocation(latLng)
        }));
    }
    /**
     * Sets the generic map options.
     *
     * @param options - Options to set.
     *
     * @memberof BingMapService
     */
    SetMapOptions(options) {
        this._map.then((m) => {
            const o = BingConversions.TranslateOptions(options);
            m.setOptions(o);
        });
    }
    /**
     * Sets the view options of the map.
     *
     * @param options - Options to set.
     *
     * @memberof BingMapService
     */
    SetViewOptions(options) {
        this._map.then((m) => {
            const o = BingConversions.TranslateViewOptions(options);
            m.setView(o);
        });
    }
    /**
     * Sets the zoom level of the map.
     *
     * @param zoom - Zoom level to set.
     * @returns - A Promise that is fullfilled once the zoom operation is complete.
     *
     * @memberof BingMapService
     */
    SetZoom(zoom) {
        return this._map.then((map) => map.setView({
            zoom: zoom
        }));
    }
    /**
     * Creates an event subscription
     *
     * @param eventName - The name of the event (e.g. 'click')
     * @returns - An observable of tpye E that fires when the event occurs.
     *
     * @memberof BingMapService
     */
    SubscribeToMapEvent(eventName) {
        const eventNameTranslated = BingMapEventsLookup[eventName];
        return Observable.create((observer) => {
            this._map.then((m) => {
                Microsoft.Maps.Events.addHandler(m, eventNameTranslated, (e) => {
                    this._zone.run(() => observer.next(e));
                });
            });
        });
    }
    /**
     * Triggers the given event name on the map instance.
     *
     * @param eventName - Event to trigger.
     * @returns - A promise that is fullfilled once the event is triggered.
     *
     * @memberof BingMapService
     */
    TriggerMapEvent(eventName) {
        return this._map.then((m) => Microsoft.Maps.Events.invoke(m, eventName, null));
    }
}
BingMapService.decorators = [
    { type: Injectable }
];
BingMapService.ctorParameters = () => [
    { type: MapAPILoader },
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1tYXAuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9zZXJ2aWNlcy9iaW5nL2JpbmctbWFwLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDbkQsT0FBTyxFQUFZLFVBQVUsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUc1QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFL0MsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3JELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUs3QyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFFM0QsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ3pELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBQ3hFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUNwRSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDN0QsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlDQUFpQyxDQUFDO0FBQy9ELE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQzVFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHVDQUF1QyxDQUFDO0FBQzNFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHVDQUF1QyxDQUFDO0FBZTFFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBRTNFOzs7O0dBSUc7QUFFSCxNQUFNLE9BQU8sY0FBYztJQXNEdkIsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7Ozs7OztPQU1HO0lBQ0gsWUFBb0IsT0FBcUIsRUFB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QixFQUFFLEVBQUU7WUFDL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFxQixFQUFFLEVBQUU7Z0JBQ3JDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFNLEVBQUUsRUFBRTtvQkFDaEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLGVBQWUsQ0FBQyxTQUFpQjtRQUNwQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ25GLENBQUM7OztZQXhqQkosVUFBVTs7O1lBdkNGLFlBQVk7WUFKQSxNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZlciwgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQgeyBNYXBTZXJ2aWNlIH0gZnJvbSAnLi4vbWFwLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWFwQVBJTG9hZGVyIH0gZnJvbSAnLi4vbWFwYXBpbG9hZGVyJztcbmltcG9ydCB7IEJpbmdNYXBBUElMb2FkZXIsIEJpbmdNYXBBUElMb2FkZXJDb25maWcgfSBmcm9tICcuL2JpbmctbWFwLmFwaS1sb2FkZXIuc2VydmljZSc7XG5pbXBvcnQgeyBCaW5nQ29udmVyc2lvbnMgfSBmcm9tICcuL2JpbmctY29udmVyc2lvbnMnO1xuaW1wb3J0IHsgTWFya2VyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcmtlcic7XG5pbXBvcnQgeyBQb2x5Z29uIH0gZnJvbSAnLi4vLi4vbW9kZWxzL3BvbHlnb24nO1xuaW1wb3J0IHsgUG9seWxpbmUgfSBmcm9tICcuLi8uLi9tb2RlbHMvcG9seWxpbmUnO1xuaW1wb3J0IHsgTWFya2VyVHlwZUlkIH0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcmtlci10eXBlLWlkJztcbmltcG9ydCB7IEluZm9XaW5kb3cgfSBmcm9tICcuLi8uLi9tb2RlbHMvaW5mby13aW5kb3cnO1xuaW1wb3J0IHsgQmluZ01hcmtlciB9IGZyb20gJy4uLy4uL21vZGVscy9iaW5nL2JpbmctbWFya2VyJztcbmltcG9ydCB7IExheWVyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2xheWVyJztcbmltcG9ydCB7IEJpbmdMYXllciB9IGZyb20gJy4uLy4uL21vZGVscy9iaW5nL2JpbmctbGF5ZXInO1xuaW1wb3J0IHsgQmluZ0NsdXN0ZXJMYXllciB9IGZyb20gJy4uLy4uL21vZGVscy9iaW5nL2JpbmctY2x1c3Rlci1sYXllcic7XG5pbXBvcnQgeyBCaW5nSW5mb1dpbmRvdyB9IGZyb20gJy4uLy4uL21vZGVscy9iaW5nL2JpbmctaW5mby13aW5kb3cnO1xuaW1wb3J0IHsgQmluZ1BvbHlnb24gfSBmcm9tICcuLi8uLi9tb2RlbHMvYmluZy9iaW5nLXBvbHlnb24nO1xuaW1wb3J0IHsgQmluZ1BvbHlsaW5lIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2JpbmcvYmluZy1wb2x5bGluZSc7XG5pbXBvcnQgeyBNaXhpbk1hcExhYmVsV2l0aE92ZXJsYXlWaWV3IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2JpbmcvYmluZy1sYWJlbCc7XG5pbXBvcnQgeyBNaXhpbkNhbnZhc092ZXJsYXkgfSBmcm9tICcuLi8uLi9tb2RlbHMvYmluZy9iaW5nLWNhbnZhcy1vdmVybGF5JztcbmltcG9ydCB7IEJpbmdDYW52YXNPdmVybGF5IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2JpbmcvYmluZy1jYW52YXMtb3ZlcmxheSc7XG5pbXBvcnQgeyBDYW52YXNPdmVybGF5IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2NhbnZhcy1vdmVybGF5JztcbmltcG9ydCB7IElMYXllck9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lsYXllci1vcHRpb25zJztcbmltcG9ydCB7IElDbHVzdGVyT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWNsdXN0ZXItb3B0aW9ucyc7XG5pbXBvcnQgeyBJTWFwT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaW1hcC1vcHRpb25zJztcbmltcG9ydCB7IElMYXRMb25nIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgeyBJUG9pbnQgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lwb2ludCc7XG5pbXBvcnQgeyBJU2l6ZSB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaXNpemUnO1xuaW1wb3J0IHsgSU1hcmtlck9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2ltYXJrZXItb3B0aW9ucyc7XG5pbXBvcnQgeyBJTWFya2VySWNvbkluZm8gfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2ltYXJrZXItaWNvbi1pbmZvJztcbmltcG9ydCB7IElJbmZvV2luZG93T3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWluZm8td2luZG93LW9wdGlvbnMnO1xuaW1wb3J0IHsgSVBvbHlnb25PcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pcG9seWdvbi1vcHRpb25zJztcbmltcG9ydCB7IElQb2x5bGluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lwb2x5bGluZS1vcHRpb25zJztcbmltcG9ydCB7IElCb3ggfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lib3gnO1xuXG5pbXBvcnQgeyBCaW5nTWFwRXZlbnRzTG9va3VwIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2JpbmcvYmluZy1ldmVudHMtbG9va3VwJztcblxuLyoqXG4gKiBDb25jcmV0ZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgTWFwU2VydmljZSBhYnN0cmFjdCBpbXBsZW1lbnRpbmcgYSBCaW4gTWFwIFY4IHByb3ZpZGVyXG4gKlxuICogQGV4cG9ydFxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQmluZ01hcFNlcnZpY2UgaW1wbGVtZW50cyBNYXBTZXJ2aWNlIHtcbiAgICAvLy9cbiAgICAvLy8gRmllbGQgRGVjbGFyYXRpb25zXG4gICAgLy8vXG5cbiAgICBwcml2YXRlIF9tYXA6IFByb21pc2U8TWljcm9zb2Z0Lk1hcHMuTWFwPjtcbiAgICBwcml2YXRlIF9tYXBJbnN0YW5jZTogTWljcm9zb2Z0Lk1hcHMuTWFwO1xuICAgIHByaXZhdGUgX21hcFJlc29sdmVyOiAodmFsdWU/OiBNaWNyb3NvZnQuTWFwcy5NYXApID0+IHZvaWQ7XG4gICAgcHJpdmF0ZSBfY29uZmlnOiBCaW5nTWFwQVBJTG9hZGVyQ29uZmlnO1xuICAgIHByaXZhdGUgX21vZHVsZXM6IE1hcDxzdHJpbmcsIE9iamVjdD4gPSBuZXcgTWFwPHN0cmluZywgT2JqZWN0PigpO1xuXG4gICAgLy8vXG4gICAgLy8vIFByb3BlcnR5IERlZmluaXRpb25zXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIGFuIGFycmF5IG9mIGxvYWRlZCBCb25nIG1vZHVsZXMuXG4gICAgICpcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IExvYWRlZE1vZHVsZXMoKTogTWFwPHN0cmluZywgT2JqZWN0PiB7IHJldHVybiB0aGlzLl9tb2R1bGVzOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBCaW5nIE1hcCBjb250cm9sIGluc3RhbmNlIHVuZGVybHlpbmcgdGhlIGltcGxlbWVudGF0aW9uXG4gICAgICpcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IE1hcEluc3RhbmNlKCk6IE1pY3Jvc29mdC5NYXBzLk1hcCB7IHJldHVybiB0aGlzLl9tYXBJbnN0YW5jZTsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyBhIFByb21pc2UgZm9yIGEgQmluZyBNYXAgY29udHJvbCBpbnN0YW5jZSB1bmRlcmx5aW5nIHRoZSBpbXBsZW1lbnRhdGlvbi4gVXNlIHRoaXMgaW5zdGVhZCBvZiB7QGxpbmsgTWFwSW5zdGFuY2V9IGlmIHlvdVxuICAgICAqIGFyZSBub3Qgc3VyZSBpZiBhbmQgd2hlbiB0aGUgaW5zdGFuY2Ugd2lsbCBiZSBjcmVhdGVkLlxuICAgICAqIEByZWFkb25seVxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgTWFwUHJvbWlzZSgpOiBQcm9taXNlPE1pY3Jvc29mdC5NYXBzLk1hcD4geyByZXR1cm4gdGhpcy5fbWFwOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBtYXBzIHBoeXNpY2FsIHNpemUuXG4gICAgICpcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IE1hcFNpemUoKTogSVNpemUge1xuICAgICAgICBpZiAodGhpcy5NYXBJbnN0YW5jZSkge1xuICAgICAgICAgICAgY29uc3QgczogSVNpemUgPSB7IHdpZHRoOiB0aGlzLk1hcEluc3RhbmNlLmdldFdpZHRoKCksIGhlaWdodDogdGhpcy5NYXBJbnN0YW5jZS5nZXRIZWlnaHQoKSB9O1xuICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIEJpbmdNYXBTZXJ2aWNlLlxuICAgICAqIEBwYXJhbSBfbG9hZGVyIE1hcEFQSUxvYWRlciBpbnN0YW5jZSBpbXBsZW1lbnRlZCBmb3IgQmluZyBNYXBzLiBUaGlzIGluc3RhbmNlIHdpbGwgZ2VuZXJhbGx5IGJlIGluamVjdGVkLlxuICAgICAqIEBwYXJhbSBfem9uZSBOZ1pvbmUgb2JqZWN0IHRvIGVuYWJsZSB6b25lIGF3YXJlIHByb21pc2VzLiBUaGlzIHdpbGwgZ2VuZXJhbGx5IGJlIGluamVjdGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbG9hZGVyOiBNYXBBUElMb2FkZXIsIHByaXZhdGUgX3pvbmU6IE5nWm9uZSkge1xuICAgICAgICB0aGlzLl9tYXAgPSBuZXcgUHJvbWlzZTxNaWNyb3NvZnQuTWFwcy5NYXA+KChyZXNvbHZlOiAoKSA9PiB2b2lkKSA9PiB7IHRoaXMuX21hcFJlc29sdmVyID0gcmVzb2x2ZTsgfSk7XG4gICAgICAgIHRoaXMuX2NvbmZpZyA9ICg8QmluZ01hcEFQSUxvYWRlcj50aGlzLl9sb2FkZXIpLkNvbmZpZztcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHVibGljIG1ldGhvZHMgYW5kIE1hcFNlcnZpY2UgaW50ZXJmYWNlIGltcGxlbWVudGF0aW9uXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgY2FudmFzIG92ZXJsYXkgbGF5ZXIgdG8gcGVyZm9ybSBjdXN0b20gZHJhd2luZyBvdmVyIHRoZSBtYXAgd2l0aCBvdXRcbiAgICAgKiBzb21lIG9mIHRoZSBvdmVyaGVhZCBhc3NvY2lhdGVkIHdpdGggZ29pbmcgdGhyb3VnaCB0aGUgTWFwIG9iamVjdHMuXG4gICAgICogQHBhcmFtIGRyYXdDYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgdHJpZ2dlcmVkIHdoZW4gdGhlIGNhbnZhcyBpcyByZWFkeSB0byBiZVxuICAgICAqIHJlbmRlcmVkIGZvciB0aGUgY3VycmVudCBtYXAgdmlldy5cbiAgICAgKiBAcmV0dXJucyAtIFByb21pc2Ugb2YgYSB7QGxpbmsgQ2FudmFzT3ZlcmxheX0gb2JqZWN0LlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVDYW52YXNPdmVybGF5KGRyYXdDYWxsYmFjazogKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpID0+IHZvaWQpOiBQcm9taXNlPENhbnZhc092ZXJsYXk+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtYXA6IE1pY3Jvc29mdC5NYXBzLk1hcCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3ZlcmxheTogQmluZ0NhbnZhc092ZXJsYXkgPSBuZXcgQmluZ0NhbnZhc092ZXJsYXkoZHJhd0NhbGxiYWNrKTtcbiAgICAgICAgICAgIG1hcC5sYXllcnMuaW5zZXJ0KG92ZXJsYXkpO1xuICAgICAgICAgICAgcmV0dXJuIG92ZXJsYXk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBCaW5nIG1hcCBjbHVzdGVyIGxheWVyIHdpdGhpbiB0aGUgbWFwIGNvbnRleHRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9ucyBmb3IgdGhlIGxheWVyLiBTZWUge0BsaW5rIElDbHVzdGVyT3B0aW9uc30uXG4gICAgICogQHJldHVybnMgLSBQcm9taXNlIG9mIGEge0BsaW5rIExheWVyfSBvYmplY3QsIHdoaWNoIG1vZGVscyB0aGUgdW5kZXJseWluZyBNaWNyb3NvZnQuTWFwcy5DbHVzdGVyTGF5ZXIgb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZUNsdXN0ZXJMYXllcihvcHRpb25zOiBJQ2x1c3Rlck9wdGlvbnMpOiBQcm9taXNlPExheWVyPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAudGhlbigobWFwOiBNaWNyb3NvZnQuTWFwcy5NYXApID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHA6IFByb21pc2U8TGF5ZXI+ID0gbmV3IFByb21pc2U8TGF5ZXI+KHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuTG9hZE1vZHVsZSgnTWljcm9zb2Z0Lk1hcHMuQ2x1c3RlcmluZycsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbzogTWljcm9zb2Z0Lk1hcHMuSUNsdXN0ZXJMYXllck9wdGlvbnMgPSBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlQ2x1c3Rlck9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxheWVyOiBNaWNyb3NvZnQuTWFwcy5DbHVzdGVyTGF5ZXIgPSBuZXcgTWljcm9zb2Z0Lk1hcHMuQ2x1c3RlckxheWVyKG5ldyBBcnJheTxNaWNyb3NvZnQuTWFwcy5QdXNocGluPigpLCBvKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJsOiBCaW5nQ2x1c3RlckxheWVyO1xuICAgICAgICAgICAgICAgICAgICBtYXAubGF5ZXJzLmluc2VydChsYXllcik7XG4gICAgICAgICAgICAgICAgICAgIGJsID0gbmV3IEJpbmdDbHVzdGVyTGF5ZXIobGF5ZXIsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICBibC5TZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGJsKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5mb3JtYXRpb24gd2luZG93IGZvciBhIG1hcCBwb3NpdGlvblxuICAgICAqXG4gICAgICogQHBhcmFtIFtvcHRpb25zXSAtIEluZm93aW5kb3cgb3B0aW9ucy4gU2VlIHtAbGluayBJSW5mb1dpbmRvd09wdGlvbnN9XG4gICAgICogQHJldHVybnMgLSBQcm9taXNlIG9mIGEge0BsaW5rIEluZm9XaW5kb3d9IG9iamVjdCwgd2hpY2ggbW9kZWxzIHRoZSB1bmRlcmx5aW5nIE1pY3Jvc29mdC5NYXBzLkluZm9ib3ggb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZUluZm9XaW5kb3cob3B0aW9ucz86IElJbmZvV2luZG93T3B0aW9ucyk6IFByb21pc2U8SW5mb1dpbmRvdz4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLnRoZW4oKG1hcDogTWljcm9zb2Z0Lk1hcHMuTWFwKSA9PiB7XG4gICAgICAgICAgICBsZXQgbG9jOiBNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbjtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnBvc2l0aW9uID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBsb2MgPSBtYXAuZ2V0Q2VudGVyKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvYyA9IG5ldyBNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbihvcHRpb25zLnBvc2l0aW9uLmxhdGl0dWRlLCBvcHRpb25zLnBvc2l0aW9uLmxvbmdpdHVkZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBpbmZvQm94OiBNaWNyb3NvZnQuTWFwcy5JbmZvYm94ID0gbmV3IE1pY3Jvc29mdC5NYXBzLkluZm9ib3gobG9jLCBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlSW5mb0JveE9wdGlvbnMob3B0aW9ucykpO1xuICAgICAgICAgICAgaW5mb0JveC5zZXRNYXAobWFwKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQmluZ0luZm9XaW5kb3coaW5mb0JveCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBtYXAgbGF5ZXIgd2l0aGluIHRoZSBtYXAgY29udGV4dFxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBPcHRpb25zIGZvciB0aGUgbGF5ZXIuIFNlZSB7QGxpbmsgSUxheWVyT3B0aW9uc31cbiAgICAgKiBAcmV0dXJucyAtIFByb21pc2Ugb2YgYSB7QGxpbmsgTGF5ZXJ9IG9iamVjdCwgd2hpY2ggbW9kZWxzIHRoZSB1bmRlcmx5aW5nIE1pY3Jvc29mdC5NYXBzLkxheWVyIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVMYXllcihvcHRpb25zOiBJTGF5ZXJPcHRpb25zKTogUHJvbWlzZTxMYXllcj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLnRoZW4oKG1hcDogTWljcm9zb2Z0Lk1hcHMuTWFwKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsYXllcjogTWljcm9zb2Z0Lk1hcHMuTGF5ZXIgPSBuZXcgTWljcm9zb2Z0Lk1hcHMuTGF5ZXIob3B0aW9ucy5pZC50b1N0cmluZygpKTtcbiAgICAgICAgICAgIG1hcC5sYXllcnMuaW5zZXJ0KGxheWVyKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQmluZ0xheWVyKGxheWVyLCB0aGlzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG1hcCBpbnN0YW5jZVxuICAgICAqXG4gICAgICogQHBhcmFtIGVsIC0gSFRNTCBlbGVtZW50IHRvIGhvc3QgdGhlIG1hcC5cbiAgICAgKiBAcGFyYW0gbWFwT3B0aW9ucyAtIE1hcCBvcHRpb25zXG4gICAgICogQHJldHVybnMgLSBQcm9taXNlIGZ1bGxmaWxsZWQgb25jZSB0aGUgbWFwIGhhcyBiZWVuIGNyZWF0ZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlTWFwKGVsOiBIVE1MRWxlbWVudCwgbWFwT3B0aW9uczogSU1hcE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRlci5Mb2FkKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBhcHBseSBtaXhpbnNcbiAgICAgICAgICAgIE1peGluTWFwTGFiZWxXaXRoT3ZlcmxheVZpZXcoKTtcbiAgICAgICAgICAgIE1peGluQ2FudmFzT3ZlcmxheSgpO1xuXG4gICAgICAgICAgICAvLyBtYXAgc3RhcnR1cC4uLlxuICAgICAgICAgICAgaWYgKHRoaXMuX21hcEluc3RhbmNlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLkRpc3Bvc2VNYXAoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG86IE1pY3Jvc29mdC5NYXBzLklNYXBMb2FkT3B0aW9ucyA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVMb2FkT3B0aW9ucyhtYXBPcHRpb25zKTtcbiAgICAgICAgICAgIGlmICghby5jcmVkZW50aWFscykge1xuICAgICAgICAgICAgICAgIG8uY3JlZGVudGlhbHMgPSB0aGlzLl9jb25maWcuYXBpS2V5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbWFwID0gbmV3IE1pY3Jvc29mdC5NYXBzLk1hcChlbCwgbyk7XG4gICAgICAgICAgICB0aGlzLl9tYXBJbnN0YW5jZSA9IG1hcDtcbiAgICAgICAgICAgIHRoaXMuX21hcFJlc29sdmVyKG1hcCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBCaW5nIG1hcCBtYXJrZXIgd2l0aGluIHRoZSBtYXAgY29udGV4dFxuICAgICAqXG4gICAgICogQHBhcmFtIFtvcHRpb25zPTxJTWFya2VyT3B0aW9ucz57fV0gLSBPcHRpb25zIGZvciB0aGUgbWFya2VyLiBTZWUge0BsaW5rIElNYXJrZXJPcHRpb25zfS5cbiAgICAgKiBAcmV0dXJucyAtIFByb21pc2Ugb2YgYSB7QGxpbmsgTWFya2VyfSBvYmplY3QsIHdoaWNoIG1vZGVscyB0aGUgdW5kZXJseWluZyBNaWNyb3NvZnQuTWFwcy5QdXNoUGluIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVNYXJrZXIob3B0aW9uczogSU1hcmtlck9wdGlvbnMgPSA8SU1hcmtlck9wdGlvbnM+e30pOiBQcm9taXNlPE1hcmtlcj4ge1xuICAgICAgICBjb25zdCBwYXlsb2FkID0gKGljb246IHN0cmluZywgbWFwOiBNaWNyb3NvZnQuTWFwcy5NYXApOiBCaW5nTWFya2VyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvYzogTWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24gPSBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlTG9jYXRpb24ob3B0aW9ucy5wb3NpdGlvbik7XG4gICAgICAgICAgICBjb25zdCBvOiBNaWNyb3NvZnQuTWFwcy5JUHVzaHBpbk9wdGlvbnMgPSBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlTWFya2VyT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgICAgIGlmIChpY29uICYmIGljb24gIT09ICcnKSB7IG8uaWNvbiA9IGljb247IH1cbiAgICAgICAgICAgIGNvbnN0IHB1c2hwaW46IE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4gPSBuZXcgTWljcm9zb2Z0Lk1hcHMuUHVzaHBpbihsb2MsIG8pO1xuICAgICAgICAgICAgY29uc3QgbWFya2VyOiBCaW5nTWFya2VyID0gbmV3IEJpbmdNYXJrZXIocHVzaHBpbiwgbWFwLCBudWxsKTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLm1ldGFkYXRhKSB7IG9wdGlvbnMubWV0YWRhdGEuZm9yRWFjaCgodiwgaykgPT4gbWFya2VyLk1ldGFkYXRhLnNldChrLCB2KSk7IH1cbiAgICAgICAgICAgIG1hcC5lbnRpdGllcy5wdXNoKHB1c2hwaW4pO1xuICAgICAgICAgICAgcmV0dXJuIG1hcmtlcjtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtYXA6IE1pY3Jvc29mdC5NYXBzLk1hcCkgPT4ge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaWNvbkluZm8gJiYgb3B0aW9ucy5pY29uSW5mby5tYXJrZXJUeXBlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcyA9IE1hcmtlci5DcmVhdGVNYXJrZXIob3B0aW9ucy5pY29uSW5mbyk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAocykgPT09ICdzdHJpbmcnKSB7IHJldHVybiAocGF5bG9hZChzLCBtYXApKTsgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcy50aGVuKHggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChwYXlsb2FkKHguaWNvbiwgbWFwKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAocGF5bG9hZChudWxsLCBtYXApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHBvbHlnb24gd2l0aGluIHRoZSBCaW5nIE1hcHMgVjggbWFwIGNvbnRleHRcbiAgICAgKlxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9ucyBmb3IgdGhlIHBvbHlnb24uIFNlZSB7QGxpbmsgSVBvbHlnb25PcHRpb25zfS5cbiAgICAgKiBAcmV0dXJucyAtIFByb21pc2Ugb2YgYSB7QGxpbmsgUG9seWdvbn0gb2JqZWN0LCB3aGljaCBtb2RlbHMgdGhlIHVuZGVybHlpbmcgbmF0aXZlIHBvbHlnb24uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVQb2x5Z29uKG9wdGlvbnM6IElQb2x5Z29uT3B0aW9ucyk6IFByb21pc2U8UG9seWdvbj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLnRoZW4oKG1hcDogTWljcm9zb2Z0Lk1hcHMuTWFwKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsb2NzOiBBcnJheTxBcnJheTxNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbj4+ID0gQmluZ0NvbnZlcnNpb25zLlRyYW5zbGF0ZVBhdGhzKG9wdGlvbnMucGF0aHMpO1xuICAgICAgICAgICAgY29uc3QgbzogTWljcm9zb2Z0Lk1hcHMuSVBvbHlnb25PcHRpb25zID0gQmluZ0NvbnZlcnNpb25zLlRyYW5zbGF0ZVBvbHlnb25PcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICAgICAgY29uc3QgcG9seTogTWljcm9zb2Z0Lk1hcHMuUG9seWdvbiA9IG5ldyBNaWNyb3NvZnQuTWFwcy5Qb2x5Z29uKGxvY3MsIG8pO1xuICAgICAgICAgICAgbWFwLmVudGl0aWVzLnB1c2gocG9seSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHAgPSBuZXcgQmluZ1BvbHlnb24ocG9seSwgdGhpcywgbnVsbCk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5tZXRhZGF0YSkgeyBvcHRpb25zLm1ldGFkYXRhLmZvckVhY2goKHYsIGspID0+IHAuTWV0YWRhdGEuc2V0KGssIHYpKTsgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMudGl0bGUgJiYgb3B0aW9ucy50aXRsZSAhPT0gJycpIHsgcC5UaXRsZSA9IG9wdGlvbnMudGl0bGU7IH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNob3dMYWJlbCAhPSBudWxsKSB7IHAuU2hvd0xhYmVsID0gb3B0aW9ucy5zaG93TGFiZWw7IH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNob3dUb29sdGlwICE9IG51bGwpIHsgcC5TaG93VG9vbHRpcCA9IG9wdGlvbnMuc2hvd1Rvb2x0aXA7IH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxhYmVsTWF4Wm9vbSAhPSBudWxsKSB7IHAuTGFiZWxNYXhab29tID0gb3B0aW9ucy5sYWJlbE1heFpvb207IH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxhYmVsTWluWm9vbSAhPSBudWxsKSB7IHAuTGFiZWxNaW5ab29tID0gb3B0aW9ucy5sYWJlbE1pblpvb207IH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmVkaXRhYmxlKSB7IHAuU2V0RWRpdGFibGUob3B0aW9ucy5lZGl0YWJsZSk7IH1cbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgcG9seWxpbmUgd2l0aGluIHRoZSBCaW5nIE1hcHMgVjggbWFwIGNvbnRleHRcbiAgICAgKlxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9ucyBmb3IgdGhlIHBvbHlsaW5lLiBTZWUge0BsaW5rIElQb2x5bGluZU9wdGlvbnN9LlxuICAgICAqIEByZXR1cm5zIC0gUHJvbWlzZSBvZiBhIHtAbGluayBQb2x5bGluZX0gb2JqZWN0IChvciBhbiBhcnJheSB0aGVyZW9mIGZvciBjb21wbGV4IHBhdGhzKSxcbiAgICAgKiB3aGljaCBtb2RlbHMgdGhlIHVuZGVybHlpbmcgbmF0aXZlIHBvbHlnb24uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVQb2x5bGluZShvcHRpb25zOiBJUG9seWxpbmVPcHRpb25zKTogUHJvbWlzZTxQb2x5bGluZSB8IEFycmF5PFBvbHlsaW5lPj4ge1xuICAgICAgICBsZXQgcG9seWxpbmU6IE1pY3Jvc29mdC5NYXBzLlBvbHlsaW5lO1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLnRoZW4oKG1hcDogTWljcm9zb2Z0Lk1hcHMuTWFwKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvOiBNaWNyb3NvZnQuTWFwcy5JUG9seWxpbmVPcHRpb25zID0gQmluZ0NvbnZlcnNpb25zLlRyYW5zbGF0ZVBvbHlsaW5lT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGxvY3M6IEFycmF5PEFycmF5PE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uPj4gPSBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlUGF0aHMob3B0aW9ucy5wYXRoKTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnBhdGggJiYgb3B0aW9ucy5wYXRoLmxlbmd0aCA+IDAgJiYgIUFycmF5LmlzQXJyYXkob3B0aW9ucy5wYXRoWzBdKSkge1xuICAgICAgICAgICAgICAgIHBvbHlsaW5lID0gbmV3IE1pY3Jvc29mdC5NYXBzLlBvbHlsaW5lKGxvY3NbMF0sIG8pO1xuICAgICAgICAgICAgICAgIG1hcC5lbnRpdGllcy5wdXNoKHBvbHlsaW5lKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBsID0gbmV3IEJpbmdQb2x5bGluZShwb2x5bGluZSwgbWFwLCBudWxsKTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5tZXRhZGF0YSkgeyBvcHRpb25zLm1ldGFkYXRhLmZvckVhY2goKHYsIGspID0+IHBsLk1ldGFkYXRhLnNldChrLCB2KSk7IH1cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy50aXRsZSAmJiBvcHRpb25zLnRpdGxlICE9PSAnJykgeyBwbC5UaXRsZSA9IG9wdGlvbnMudGl0bGU7IH1cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zaG93VG9vbHRpcCAhPSBudWxsKSB7IHBsLlNob3dUb29sdGlwID0gb3B0aW9ucy5zaG93VG9vbHRpcDsgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVzOiBBcnJheTxQb2x5bGluZT4gPSBuZXcgQXJyYXk8UG9seWxpbmU+KCk7XG4gICAgICAgICAgICAgICAgbG9jcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwb2x5bGluZSA9IG5ldyBNaWNyb3NvZnQuTWFwcy5Qb2x5bGluZShwLCBvKTtcbiAgICAgICAgICAgICAgICAgICAgbWFwLmVudGl0aWVzLnB1c2gocG9seWxpbmUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsID0gbmV3IEJpbmdQb2x5bGluZShwb2x5bGluZSwgbWFwLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubWV0YWRhdGEpIHsgb3B0aW9ucy5tZXRhZGF0YS5mb3JFYWNoKCh2LCBrKSA9PiBwbC5NZXRhZGF0YS5zZXQoaywgdikpOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnRpdGxlICYmIG9wdGlvbnMudGl0bGUgIT09ICcnKSB7IHBsLlRpdGxlID0gb3B0aW9ucy50aXRsZTsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zaG93VG9vbHRpcCAhPSBudWxsKSB7IHBsLlNob3dUb29sdGlwID0gb3B0aW9ucy5zaG93VG9vbHRpcDsgfVxuICAgICAgICAgICAgICAgICAgICBsaW5lcy5wdXNoKHBsKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGluZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZXMgYSBsYXllciBmcm9tIHRoZSBtYXAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBMYXllciB0byBkZWxldGUuIFNlZSB7QGxpbmsgTGF5ZXJ9LiBUaGlzIG1ldGhvZCBleHBlY3RzIHRoZSBCaW5nIHNwZWNpZmljIExheWVyIG1vZGVsIGltcGxlbWVudGF0aW9uLlxuICAgICAqIEByZXR1cm5zIC0gUHJvbWlzZSBmdWxsZmlsbGVkIHdoZW4gdGhlIGxheWVyIGhhcyBiZWVuIHJlbW92ZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgRGVsZXRlTGF5ZXIobGF5ZXI6IExheWVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAudGhlbigobWFwOiBNaWNyb3NvZnQuTWFwcy5NYXApID0+IHtcbiAgICAgICAgICAgIG1hcC5sYXllcnMucmVtb3ZlKGxheWVyLk5hdGl2ZVByaW1pdHZlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGlzcGFvc2UgdGhlIG1hcCBhbmQgYXNzb2NpYXRlZCByZXNvdXJlcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBEaXNwb3NlTWFwKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fbWFwID09IG51bGwgJiYgdGhpcy5fbWFwSW5zdGFuY2UgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9tYXBJbnN0YW5jZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXBJbnN0YW5jZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICB0aGlzLl9tYXBJbnN0YW5jZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9tYXAgPSBuZXcgUHJvbWlzZTxNaWNyb3NvZnQuTWFwcy5NYXA+KChyZXNvbHZlOiAoKSA9PiB2b2lkKSA9PiB7IHRoaXMuX21hcFJlc29sdmVyID0gcmVzb2x2ZTsgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBnZW8gY29vcmRpbmF0ZXMgb2YgdGhlIG1hcCBjZW50ZXJcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiBmdWxsZmlsbGVkIGNvbnRhaW5zIHRoZSBnb2UgbG9jYXRpb24gb2YgdGhlIGNlbnRlci4gU2VlIHtAbGluayBJTGF0TG9uZ30uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0Q2VudGVyKCk6IFByb21pc2U8SUxhdExvbmc+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtYXA6IE1pY3Jvc29mdC5NYXBzLk1hcCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2VudGVyID0gbWFwLmdldENlbnRlcigpO1xuICAgICAgICAgICAgcmV0dXJuIDxJTGF0TG9uZz57XG4gICAgICAgICAgICAgICAgbGF0aXR1ZGU6IGNlbnRlci5sYXRpdHVkZSxcbiAgICAgICAgICAgICAgICBsb25naXR1ZGU6IGNlbnRlci5sb25naXR1ZGVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGdlbyBjb29yZGluYXRlcyBvZiB0aGUgbWFwIGJvdW5kaW5nIGJveFxuICAgICAqXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGdvZSBsb2NhdGlvbiBvZiB0aGUgYm91bmRpbmcgYm94LiBTZWUge0BsaW5rIElCb3h9LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIEdldEJvdW5kcygpOiBQcm9taXNlPElCb3g+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtYXA6IE1pY3Jvc29mdC5NYXBzLk1hcCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYm94ID0gbWFwLmdldEJvdW5kcygpO1xuICAgICAgICAgICAgcmV0dXJuIDxJQm94PntcbiAgICAgICAgICAgICAgICBtYXhMYXRpdHVkZTogYm94LmdldE5vcnRoKCksXG4gICAgICAgICAgICAgICAgbWF4TG9uZ2l0dWRlOiBib3guY3Jvc3Nlc0ludGVybmF0aW9uYWxEYXRlTGluZSgpID8gYm94LmdldFdlc3QoKSA6IGJveC5nZXRFYXN0KCksXG4gICAgICAgICAgICAgICAgbWluTGF0aXR1ZGU6IGJveC5nZXRTb3V0aCgpLFxuICAgICAgICAgICAgICAgIG1pbkxvbmdpdHVkZTogYm94LmNyb3NzZXNJbnRlcm5hdGlvbmFsRGF0ZUxpbmUoKSA/IGJveC5nZXRFYXN0KCkgOiBib3guZ2V0V2VzdCgpLFxuICAgICAgICAgICAgICAgIGNlbnRlcjogeyBsYXRpdHVkZTogYm94LmNlbnRlci5sYXRpdHVkZSwgbG9uZ2l0dWRlOiBib3guY2VudGVyLmxvbmdpdHVkZSB9LFxuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgYSBzaGFyZWQgb3IgcHJpdmF0ZSBpbnN0YW5jZSBvZiB0aGUgbWFwIGRyYXdpbmcgdG9vbHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gW3VzZVNoYXJlZEluc3RhbmNlPXRydWVdIC0gU2V0IHRvIGZhbHNlIHRvIGNyZWF0ZSBhIHByaXZhdGUgaW5zdGFuY2UuXG4gICAgICogQHJldHVybnMgLSBQcm9taXNlIHRoYXQgd2hlbiByZXNvbHZlZCBjb250YWluc3QgYW4gaW5zdGFuY2Ugb2YgdGhlIGRyYXdpbmcgdG9vbHMuXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIEdldERyYXdpbmdUb29scyAodXNlU2hhcmVkSW5zdGFuY2U6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTxNaWNyb3NvZnQuTWFwcy5EcmF3aW5nVG9vbHM+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPE1pY3Jvc29mdC5NYXBzLkRyYXdpbmdUb29scz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5Mb2FkTW9kdWxlSW5zdGFuY2UoJ01pY3Jvc29mdC5NYXBzLkRyYXdpbmdUb29scycsIHVzZVNoYXJlZEluc3RhbmNlKS50aGVuKChvOiBNaWNyb3NvZnQuTWFwcy5EcmF3aW5nVG9vbHMpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKG8pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGN1cnJlbnQgem9vbSBsZXZlbCBvZiB0aGUgbWFwLlxuICAgICAqXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIHpvb20gbGV2ZWwuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0Wm9vbSgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLnRoZW4oKG1hcDogTWljcm9zb2Z0Lk1hcHMuTWFwKSA9PiBtYXAuZ2V0Wm9vbSgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkcyBhIG1vZHVsZSBpbnRvIHRoZSBNYXAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbW9kdWxlTmFtZSAtIFRoZSBtb2R1bGUgdG8gbG9hZC5cbiAgICAgKiBAcGFyYW0gY2FsbGJhY2sgLSBDYWxsYmFjayB0byBjYWxsIG9uY2UgbG9hZGluZyBpcyBjb21wbGV0ZS5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIExvYWRNb2R1bGUobW9kdWxlTmFtZTogc3RyaW5nLCBjYWxsYmFjazogKCkgPT4gdm9pZCkge1xuICAgICAgICBpZiAodGhpcy5fbW9kdWxlcy5oYXMobW9kdWxlTmFtZSkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBNaWNyb3NvZnQuTWFwcy5sb2FkTW9kdWxlKG1vZHVsZU5hbWUsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb2R1bGVzLnNldChtb2R1bGVOYW1lLCBudWxsKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkcyBhIG1vZHVsZSBpbnRvIHRoZSBNYXAgYW5kIGRlbGl2ZXJzIGFuZCBpbnN0YW5jZSBvZiB0aGUgbW9kdWxlIHBheWxvYWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbW9kdWxlTmFtZSAtIFRoZSBtb2R1bGUgdG8gbG9hZC5cbiAgICAgKiBAcGFyYW0gdXNlU2hhcmVkSW5zdGFuY2UtIFVzZSBhIHNoYXJlZCBpbnN0YW5jZSBpZiB0cnVlLCBjcmVhdGUgYSBuZXcgaW5zdGFuY2UgaWYgZmFsc2UuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBMb2FkTW9kdWxlSW5zdGFuY2UobW9kdWxlTmFtZTogc3RyaW5nLCB1c2VTaGFyZWRJbnN0YW5jZTogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPE9iamVjdD4ge1xuICAgICAgICBjb25zdCBzOiBzdHJpbmcgPSBtb2R1bGVOYW1lLnN1YnN0cihtb2R1bGVOYW1lLmxhc3RJbmRleE9mKCcuJykgKyAxKTtcbiAgICAgICAgaWYgKHRoaXMuX21vZHVsZXMuaGFzKG1vZHVsZU5hbWUpKSB7XG4gICAgICAgICAgICBsZXQgbzogYW55ID0gbnVsbDtcbiAgICAgICAgICAgIGlmICghdXNlU2hhcmVkSW5zdGFuY2UpICB7XG4gICAgICAgICAgICAgICAgbyA9IG5ldyAoPGFueT5NaWNyb3NvZnQuTWFwcylbc10odGhpcy5fbWFwSW5zdGFuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5fbW9kdWxlcy5nZXQobW9kdWxlTmFtZSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG8gPSB0aGlzLl9tb2R1bGVzLmdldChtb2R1bGVOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG8gPSBuZXcgKDxhbnk+TWljcm9zb2Z0Lk1hcHMpW3NdKHRoaXMuX21hcEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb2R1bGVzLnNldChtb2R1bGVOYW1lLCBvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8T2JqZWN0PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBNaWNyb3NvZnQuTWFwcy5sb2FkTW9kdWxlKG1vZHVsZU5hbWUsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbyA9IG5ldyAoPGFueT5NaWNyb3NvZnQuTWFwcylbc10odGhpcy5fbWFwSW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlU2hhcmVkSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21vZHVsZXMuc2V0KG1vZHVsZU5hbWUsIG8pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW9kdWxlcy5zZXQobW9kdWxlTmFtZSwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShvKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCgnQ291bGQgbm90IGxvYWQgbW9kdWxlIG9yIGNyZWF0ZSBpbnN0YW5jZS4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIGEgY29udmVyc2lvbiBvZiBnZW8gY29vcmRpbmF0ZXMgdG8gcGl4ZWxzIG9uIHRoZSBtYXAgY29udHJvbC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsb2MgLSBUaGUgZ2VvIGNvb3JkaW5hdGVzIHRvIHRyYW5zbGF0ZS5cbiAgICAgKiBAcmV0dXJucyAtIFByb21pc2Ugb2YgYW4ge0BsaW5rIElQb2ludH0gaW50ZXJmYWNlIHJlcHJlc2VudGluZyB0aGUgcGl4ZWxzLiBUaGlzIHByb21pc2UgcmVzb2x2ZXMgdG8gbnVsbFxuICAgICAqIGlmIHRoZSBnb2UgY29vcmRpbmF0ZXMgYXJlIG5vdCBpbiB0aGUgdmlldyBwb3J0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIExvY2F0aW9uVG9Qb2ludChsb2M6IElMYXRMb25nKTogUHJvbWlzZTxJUG9pbnQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtOiBNaWNyb3NvZnQuTWFwcy5NYXApID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGw6IE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uID0gQmluZ0NvbnZlcnNpb25zLlRyYW5zbGF0ZUxvY2F0aW9uKGxvYyk7XG4gICAgICAgICAgICBjb25zdCBwOiBNaWNyb3NvZnQuTWFwcy5Qb2ludCA9IDxNaWNyb3NvZnQuTWFwcy5Qb2ludD5tLnRyeUxvY2F0aW9uVG9QaXhlbChsLCBNaWNyb3NvZnQuTWFwcy5QaXhlbFJlZmVyZW5jZS5jb250cm9sKTtcbiAgICAgICAgICAgIGlmIChwICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyB4OiBwLngsIHk6IHAueSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIGEgY29udmVyc2lvbiBvZiBnZW8gY29vcmRpbmF0ZXMgdG8gcGl4ZWxzIG9uIHRoZSBtYXAgY29udHJvbC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsb2MgLSBUaGUgZ2VvIGNvb3JkaW5hdGVzIHRvIHRyYW5zbGF0ZS5cbiAgICAgKiBAcmV0dXJucyAtIFByb21pc2Ugb2YgYW4ge0BsaW5rIElQb2ludH0gaW50ZXJmYWNlIGFycmF5IHJlcHJlc2VudGluZyB0aGUgcGl4ZWxzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIExvY2F0aW9uc1RvUG9pbnRzKGxvY3M6IEFycmF5PElMYXRMb25nPik6IFByb21pc2U8QXJyYXk8SVBvaW50Pj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLnRoZW4oKG06IE1pY3Jvc29mdC5NYXBzLk1hcCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbCA9IGxvY3MubWFwKGxvYyA9PiBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlTG9jYXRpb24obG9jKSk7XG4gICAgICAgICAgICBjb25zdCBwOiBBcnJheTxNaWNyb3NvZnQuTWFwcy5Qb2ludD4gPSA8QXJyYXk8TWljcm9zb2Z0Lk1hcHMuUG9pbnQ+Pm0udHJ5TG9jYXRpb25Ub1BpeGVsKGwsXG4gICAgICAgICAgICAgICAgTWljcm9zb2Z0Lk1hcHMuUGl4ZWxSZWZlcmVuY2UuY29udHJvbCk7XG4gICAgICAgICAgICByZXR1cm4gcCA/IHAgOiBuZXcgQXJyYXk8SVBvaW50PigpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDZW50ZXJzIHRoZSBtYXAgb24gYSBnZW8gbG9jYXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF0TG5nIC0gR2VvQ29vcmRpbmF0ZXMgYXJvdW5kIHdoaWNoIHRvIGNlbnRlciB0aGUgbWFwLiBTZWUge0BsaW5rIElMYXRMb25nfVxuICAgICAqIEByZXR1cm5zIC0gUHJvbWlzZSB0aGF0IGlzIGZ1bGxmaWxsZWQgd2hlbiB0aGUgY2VudGVyIG9wZXJhdGlvbnMgaGFzIGJlZW4gY29tcGxldGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFNldENlbnRlcihsYXRMbmc6IElMYXRMb25nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAudGhlbigobWFwOiBNaWNyb3NvZnQuTWFwcy5NYXApID0+IG1hcC5zZXRWaWV3KHtcbiAgICAgICAgICAgIGNlbnRlcjogQmluZ0NvbnZlcnNpb25zLlRyYW5zbGF0ZUxvY2F0aW9uKGxhdExuZylcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGdlbmVyaWMgbWFwIG9wdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbnMgdG8gc2V0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFNldE1hcE9wdGlvbnMob3B0aW9uczogSU1hcE9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fbWFwLnRoZW4oKG06IE1pY3Jvc29mdC5NYXBzLk1hcCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbzogTWljcm9zb2Z0Lk1hcHMuSU1hcE9wdGlvbnMgPSBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgICAgIG0uc2V0T3B0aW9ucyhvKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgdmlldyBvcHRpb25zIG9mIHRoZSBtYXAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbnMgdG8gc2V0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFNldFZpZXdPcHRpb25zKG9wdGlvbnM6IElNYXBPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX21hcC50aGVuKChtOiBNaWNyb3NvZnQuTWFwcy5NYXApID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG86IE1pY3Jvc29mdC5NYXBzLklWaWV3T3B0aW9ucyA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVWaWV3T3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgICAgIG0uc2V0VmlldyhvKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgem9vbSBsZXZlbCBvZiB0aGUgbWFwLlxuICAgICAqXG4gICAgICogQHBhcmFtIHpvb20gLSBab29tIGxldmVsIHRvIHNldC5cbiAgICAgKiBAcmV0dXJucyAtIEEgUHJvbWlzZSB0aGF0IGlzIGZ1bGxmaWxsZWQgb25jZSB0aGUgem9vbSBvcGVyYXRpb24gaXMgY29tcGxldGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0Wm9vbSh6b29tOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtYXA6IE1pY3Jvc29mdC5NYXBzLk1hcCkgPT4gbWFwLnNldFZpZXcoe1xuICAgICAgICAgICAgem9vbTogem9vbVxuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBldmVudCBzdWJzY3JpcHRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSBldmVudE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgKGUuZy4gJ2NsaWNrJylcbiAgICAgKiBAcmV0dXJucyAtIEFuIG9ic2VydmFibGUgb2YgdHB5ZSBFIHRoYXQgZmlyZXMgd2hlbiB0aGUgZXZlbnQgb2NjdXJzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFN1YnNjcmliZVRvTWFwRXZlbnQ8RT4oZXZlbnROYW1lOiBzdHJpbmcpOiBPYnNlcnZhYmxlPEU+IHtcbiAgICAgICAgY29uc3QgZXZlbnROYW1lVHJhbnNsYXRlZCA9IEJpbmdNYXBFdmVudHNMb29rdXBbZXZlbnROYW1lXTtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuY3JlYXRlKChvYnNlcnZlcjogT2JzZXJ2ZXI8RT4pID0+IHtcbiAgICAgICAgICAgIHRoaXMuX21hcC50aGVuKChtOiBNaWNyb3NvZnQuTWFwcy5NYXApID0+IHtcbiAgICAgICAgICAgICAgICBNaWNyb3NvZnQuTWFwcy5FdmVudHMuYWRkSGFuZGxlcihtLCBldmVudE5hbWVUcmFuc2xhdGVkLCAoZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3pvbmUucnVuKCgpID0+IG9ic2VydmVyLm5leHQoZSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRyaWdnZXJzIHRoZSBnaXZlbiBldmVudCBuYW1lIG9uIHRoZSBtYXAgaW5zdGFuY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXZlbnROYW1lIC0gRXZlbnQgdG8gdHJpZ2dlci5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IGlzIGZ1bGxmaWxsZWQgb25jZSB0aGUgZXZlbnQgaXMgdHJpZ2dlcmVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFRyaWdnZXJNYXBFdmVudChldmVudE5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLnRoZW4oKG0pID0+IE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5pbnZva2UobSwgZXZlbnROYW1lLCBudWxsKSk7XG4gICAgfVxuXG59XG4iXX0=