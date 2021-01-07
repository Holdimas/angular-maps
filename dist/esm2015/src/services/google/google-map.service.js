import { GoogleMarkerClusterer } from '../../models/google/google-marker-clusterer';
import { GoogleInfoWindow } from '../../models/google/google-info-window';
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { MapAPILoader } from '../mapapiloader';
import { MapTypeId } from '../../models/map-type-id';
import { Marker } from '../../models/marker';
import { MixinMapLabelWithOverlayView } from '../../models/google/google-label';
import { MixinCanvasOverlay } from '../../models/google/google-canvas-overlay';
import { GoogleCanvasOverlay } from '../../models/google/google-canvas-overlay';
import { GooglePolygon } from '../../models/google/google-polygon';
import { GooglePolyline } from '../../models/google/google-polyline';
import { GoogleConversions } from './google-conversions';
import { GoogleMarker } from '../../models/google/google-marker';
import { GoogleLayer } from '../../models/google/google-layer';
import { GoogleMapEventsLookup } from '../../models/google/google-events-lookup';
/**
 * Concrete implementation of the MapService abstract implementing a Google Maps provider
 *
 * @export
 */
export class GoogleMapService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GoogleMapService.
     * @param _loader MapAPILoader instance implemented for Google Maps. This instance will generally be injected.
     * @param _zone NgZone object to enable zone aware promises. This will generally be injected.
     *
     * @memberof GoogleMapService
     */
    constructor(_loader, _zone) {
        this._loader = _loader;
        this._zone = _zone;
        this._map = new Promise((resolve) => { this._mapResolver = resolve; });
        this._config = this._loader.Config;
    }
    ///
    /// Property Definitions
    ///
    /**
     * Gets the Google Map control instance underlying the implementation
     *
     * @readonly
     * @memberof GoogleMapService
     */
    get MapInstance() { return this._mapInstance; }
    /**
     * Gets a Promise for a Google Map control instance underlying the implementation. Use this instead of {@link MapInstance} if you
     * are not sure if and when the instance will be created.
     * @readonly
     * @memberof GoogleMapService
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
            const el = this.MapInstance.getDiv();
            const s = { width: el.offsetWidth, height: el.offsetHeight };
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
     * @memberof GoogleMapService
     */
    CreateCanvasOverlay(drawCallback) {
        return this._map.then((map) => {
            const overlay = new GoogleCanvasOverlay(drawCallback);
            overlay.SetMap(map);
            return overlay;
        });
    }
    /*
     * Creates a Google map cluster layer within the map context
     *
     * @param options - Options for the layer. See {@link IClusterOptions}.
     * @returns - Promise of a {@link Layer} object, which models the underlying Microsoft.Maps.ClusterLayer object.
     *
     * @memberof GoogleMapService
     */
    CreateClusterLayer(options) {
        return this._map.then((map) => {
            let updateOptions = false;
            const markerClusterer = new MarkerClusterer(map, [], options);
            const clusterLayer = new GoogleMarkerClusterer(markerClusterer);
            const o = {
                id: options.id
            };
            if (!options.visible) {
                o.visible = false;
                updateOptions = true;
            }
            if (!options.clusteringEnabled) {
                o.clusteringEnabled = false;
                updateOptions = true;
            }
            if (updateOptions) {
                clusterLayer.SetOptions(o);
            }
            return clusterLayer;
        });
    }
    /**
     * Creates an information window for a map position
     *
     * @param [options] - Infowindow options. See {@link IInfoWindowOptions}
     * @returns - Promise of a {@link InfoWindow} object, which models the underlying Microsoft.Maps.Infobox object.
     *
     * @memberof GoogleMapService
     */
    CreateInfoWindow(options) {
        return this._map.then((map) => {
            const o = GoogleConversions.TranslateInfoWindowOptions(options);
            const infoWindow = new google.maps.InfoWindow(o);
            return new GoogleInfoWindow(infoWindow, this);
        });
    }
    /**
     * Creates a map layer within the map context
     *
     * @param options - Options for the layer. See {@link ILayerOptions}
     * @returns - Promise of a {@link Layer} object, which models the underlying Microsoft.Maps.Layer object.
     *
     * @memberof GoogleMapService
     */
    CreateLayer(options) {
        return this._map.then((map) => {
            return new GoogleLayer(map, this, options.id);
        });
    }
    /**
     * Creates a map instance
     *
     * @param el - HTML element to host the map.
     * @param mapOptions - Map options
     * @returns - Promise fullfilled once the map has been created.
     *
     * @memberof GoogleMapService
     */
    CreateMap(el, mapOptions) {
        return this._loader.Load().then(() => {
            // apply mixins
            MixinMapLabelWithOverlayView();
            MixinCanvasOverlay();
            // execute map startup
            if (!mapOptions.mapTypeId == null) {
                mapOptions.mapTypeId = MapTypeId.hybrid;
            }
            if (this._mapInstance != null) {
                this.DisposeMap();
            }
            const o = GoogleConversions.TranslateOptions(mapOptions);
            const map = new google.maps.Map(el, o);
            if (mapOptions.bounds) {
                map.fitBounds(GoogleConversions.TranslateBounds(mapOptions.bounds));
            }
            this._mapInstance = map;
            this._mapResolver(map);
            return;
        });
    }
    /**
     * Creates a Google map marker within the map context
     *
     * @param [options=<IMarkerOptions>{}] - Options for the marker. See {@link IMarkerOptions}.
     * @returns - Promise of a {@link Marker} object, which models the underlying Microsoft.Maps.PushPin object.
     *
     * @memberof GoogleMapService
     */
    CreateMarker(options = {}) {
        const payload = (x, map) => {
            const marker = new google.maps.Marker(x);
            const m = new GoogleMarker(marker);
            m.IsFirst = options.isFirst;
            m.IsLast = options.isLast;
            if (options.metadata) {
                options.metadata.forEach((val, key) => m.Metadata.set(key, val));
            }
            marker.setMap(map);
            return m;
        };
        return this._map.then((map) => {
            const o = GoogleConversions.TranslateMarkerOptions(options);
            if (options.iconInfo && options.iconInfo.markerType) {
                const s = Marker.CreateMarker(options.iconInfo);
                if (typeof (s) === 'string') {
                    o.icon = s;
                    return payload(o, map);
                }
                else {
                    return s.then(x => {
                        o.icon = x.icon;
                        return payload(o, map);
                    });
                }
            }
            else {
                return payload(o, map);
            }
        });
    }
    /**
     * Creates a polygon within the Google Map map context
     *
     * @abstract
     * @param options - Options for the polygon. See {@link IPolygonOptions}.
     * @returns - Promise of a {@link Polygon} object, which models the underlying native polygon.
     *
     * @memberof MapService
     */
    CreatePolygon(options) {
        return this._map.then((map) => {
            const o = GoogleConversions.TranslatePolygonOptions(options);
            const polygon = new google.maps.Polygon(o);
            polygon.setMap(map);
            const p = new GooglePolygon(polygon);
            if (options.metadata) {
                options.metadata.forEach((val, key) => p.Metadata.set(key, val));
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
            return p;
        });
    }
    /**
     * Creates a polyline within the Google Map map context
     *
     * @abstract
     * @param options - Options for the polyline. See {@link IPolylineOptions}.
     * @returns - Promise of a {@link Polyline} object (or an array therefore for complex paths)
     * which models the underlying native polyline.
     *
     * @memberof MapService
     */
    CreatePolyline(options) {
        let polyline;
        return this._map.then((map) => {
            const o = GoogleConversions.TranslatePolylineOptions(options);
            if (options.path && options.path.length > 0 && !Array.isArray(options.path[0])) {
                o.path = GoogleConversions.TranslatePaths(options.path)[0];
                polyline = new google.maps.Polyline(o);
                polyline.setMap(map);
                const pl = new GooglePolyline(polyline);
                if (options.metadata) {
                    options.metadata.forEach((val, key) => pl.Metadata.set(key, val));
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
                const paths = GoogleConversions.TranslatePaths(options.path);
                const lines = new Array();
                paths.forEach(p => {
                    o.path = p;
                    polyline = new google.maps.Polyline(o);
                    polyline.setMap(map);
                    const pl = new GooglePolyline(polyline);
                    if (options.metadata) {
                        options.metadata.forEach((val, key) => pl.Metadata.set(key, val));
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
     * @param layer - Layer to delete. See {@link Layer}. This method expects the Google specific Layer model implementation.
     * @returns - Promise fullfilled when the layer has been removed.
     *
     * @memberof GoogleMapService
     */
    DeleteLayer(layer) {
        // return resolved promise as there is no conept of a custom layer in Google.
        return Promise.resolve();
    }
    /**
     * Dispaose the map and associated resoures.
     *
     * @memberof GoogleMapService
     */
    DisposeMap() {
        if (this._map == null && this._mapInstance == null) {
            return;
        }
        if (this._mapInstance != null) {
            this._mapInstance = null;
            this._map = new Promise((resolve) => { this._mapResolver = resolve; });
        }
    }
    /**
     * Gets the geo coordinates of the map center
     *
     * @returns - A promise that when fullfilled contains the goe location of the center. See {@link ILatLong}.
     *
     * @memberof GoogleMapService
     */
    GetCenter() {
        return this._map.then((map) => {
            const center = map.getCenter();
            return {
                latitude: center.lat(),
                longitude: center.lng()
            };
        });
    }
    /**
     * Gets the geo coordinates of the map bounding box
     *
     * @returns - A promise that when fullfilled contains the geo location of the bounding box. See {@link IBox}.
     *
     * @memberof GoogleMapService
     */
    GetBounds() {
        return this._map.then((map) => {
            const box = map.getBounds();
            return {
                maxLatitude: box.getNorthEast().lat(),
                maxLongitude: Math.max(box.getNorthEast().lng(), box.getSouthWest().lng()),
                minLatitude: box.getSouthWest().lat(),
                minLongitude: Math.min(box.getNorthEast().lng(), box.getSouthWest().lng()),
                center: { latitude: box.getCenter().lat(), longitude: box.getCenter().lng() },
                padding: 0
            };
        });
    }
    /**
     * Gets the current zoom level of the map.
     *
     * @returns - A promise that when fullfilled contains the zoom level.
     *
     * @memberof GoogleMapService
     */
    GetZoom() {
        return this._map.then((map) => map.getZoom());
    }
    /**
     * Provides a conversion of geo coordinates to pixels on the map control.
     *
     * @param loc - The geo coordinates to translate.
     * @returns - Promise of an {@link IPoint} interface representing the pixels. This promise resolves to null
     * if the goe coordinates are not in the view port.
     *
     * @memberof GoogleMapService
     */
    LocationToPoint(loc) {
        return this._map.then((m) => {
            let crossesDateLine = false;
            const l = GoogleConversions.TranslateLocationObject(loc);
            const p = m.getProjection();
            const s = Math.pow(2, m.getZoom());
            const b = m.getBounds();
            if (b.getCenter().lng() < b.getSouthWest().lng() ||
                b.getCenter().lng() > b.getNorthEast().lng()) {
                crossesDateLine = true;
            }
            const offsetY = p.fromLatLngToPoint(b.getNorthEast()).y;
            const offsetX = p.fromLatLngToPoint(b.getSouthWest()).x;
            const point = p.fromLatLngToPoint(l);
            return {
                x: Math.floor((point.x - offsetX + ((crossesDateLine && point.x < offsetX) ? 256 : 0)) * s),
                y: Math.floor((point.y - offsetY) * s)
            };
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
            let crossesDateLine = false;
            const p = m.getProjection();
            const s = Math.pow(2, m.getZoom());
            const b = m.getBounds();
            if (b.getCenter().lng() < b.getSouthWest().lng() ||
                b.getCenter().lng() > b.getNorthEast().lng()) {
                crossesDateLine = true;
            }
            const offsetX = p.fromLatLngToPoint(b.getSouthWest()).x;
            const offsetY = p.fromLatLngToPoint(b.getNorthEast()).y;
            const l = locs.map(ll => {
                const l1 = GoogleConversions.TranslateLocationObject(ll);
                const point = p.fromLatLngToPoint(l1);
                return {
                    x: Math.floor((point.x - offsetX + ((crossesDateLine && point.x < offsetX) ? 256 : 0)) * s),
                    y: Math.floor((point.y - offsetY) * s)
                };
            });
            return l;
        });
    }
    /**
     * Centers the map on a geo location.
     *
     * @param latLng - GeoCoordinates around which to center the map. See {@link ILatLong}
     * @returns - Promise that is fullfilled when the center operations has been completed.
     *
     * @memberof GoogleMapService
     */
    SetCenter(latLng) {
        return this._map.then((map) => {
            const center = GoogleConversions.TranslateLocationObject(latLng);
            map.setCenter(center);
        });
    }
    /**
     * Sets the generic map options.
     *
     * @param options - Options to set.
     *
     * @memberof GoogleMapService
     */
    SetMapOptions(options) {
        this._map.then((m) => {
            const o = GoogleConversions.TranslateOptions(options);
            m.setOptions(o);
        });
    }
    /**
     * Sets the view options of the map.
     *
     * @param options - Options to set.
     *
     * @memberof GoogleMapService
     */
    SetViewOptions(options) {
        this._map.then((m) => {
            if (options.bounds) {
                m.fitBounds(GoogleConversions.TranslateBounds(options.bounds));
            }
            const o = GoogleConversions.TranslateOptions(options);
            m.setOptions(o);
        });
    }
    /**
     * Sets the zoom level of the map.
     *
     * @param zoom - Zoom level to set.
     * @returns - A Promise that is fullfilled once the zoom operation is complete.
     *
     * @memberof GoogleMapService
     */
    SetZoom(zoom) {
        return this._map.then((map) => map.setZoom(zoom));
    }
    /**
     * Creates an event subscription
     *
     * @param eventName - The name of the event (e.g. 'click')
     * @returns - An observable of type E that fires when the event occurs.
     *
     * @memberof GoogleMapService
     */
    SubscribeToMapEvent(eventName) {
        const googleEventName = GoogleMapEventsLookup[eventName];
        return Observable.create((observer) => {
            this._map.then((m) => {
                m.addListener(googleEventName, (e) => {
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
     * @memberof GoogleMapService
     */
    TriggerMapEvent(eventName) {
        return this._map.then((m) => google.maps.event.trigger(m, eventName, null));
    }
}
GoogleMapService.decorators = [
    { type: Injectable }
];
GoogleMapService.ctorParameters = () => [
    { type: MapAPILoader },
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLW1hcC5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL3NlcnZpY2VzL2dvb2dsZS9nb29nbGUtbWFwLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDcEYsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sd0NBQXdDLENBQUM7QUFDMUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDbkQsT0FBTyxFQUFFLFVBQVUsRUFBWSxNQUFNLE1BQU0sQ0FBQztBQUU1QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFjL0MsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQ3JELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUc3QyxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUNoRixPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUMvRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUloRixPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sb0NBQW9DLENBQUM7QUFDbkUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBQ3JFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ3pELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFFL0QsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFNakY7Ozs7R0FJRztBQUVILE1BQU0sT0FBTyxnQkFBZ0I7SUFnRHpCLEdBQUc7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R0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksbUJBQW1CLENBQUksU0FBaUI7UUFDM0MsTUFBTSxlQUFlLEdBQVcscUJBQXFCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDakUsT0FBTyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBcUIsRUFBRSxFQUFFO1lBQy9DLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBMkIsRUFBRSxFQUFFO2dCQUMzQyxDQUFDLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQU0sRUFBRSxFQUFFO29CQUN0QyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksZUFBZSxDQUFDLFNBQWlCO1FBQ3BDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDaEYsQ0FBQzs7O1lBL2ZKLFVBQVU7OztZQXpDRixZQUFZO1lBSEEsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdvb2dsZU1hcmtlckNsdXN0ZXJlciB9IGZyb20gJy4uLy4uL21vZGVscy9nb29nbGUvZ29vZ2xlLW1hcmtlci1jbHVzdGVyZXInO1xuaW1wb3J0IHsgR29vZ2xlSW5mb1dpbmRvdyB9IGZyb20gJy4uLy4uL21vZGVscy9nb29nbGUvZ29vZ2xlLWluZm8td2luZG93JztcbmltcG9ydCB7IEluamVjdGFibGUsIE5nWm9uZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgT2JzZXJ2ZXIgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IE1hcFNlcnZpY2UgfSBmcm9tICcuLi9tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBNYXBBUElMb2FkZXIgfSBmcm9tICcuLi9tYXBhcGlsb2FkZXInO1xuaW1wb3J0IHsgR29vZ2xlTWFwQVBJTG9hZGVyLCBHb29nbGVNYXBBUElMb2FkZXJDb25maWcgfSBmcm9tICcuL2dvb2dsZS1tYXAtYXBpLWxvYWRlci5zZXJ2aWNlJztcbmltcG9ydCB7IEdvb2dsZUNsdXN0ZXJTZXJ2aWNlIH0gZnJvbSAnLi9nb29nbGUtY2x1c3Rlci5zZXJ2aWNlJztcbmltcG9ydCB7IElMYXllck9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lsYXllci1vcHRpb25zJztcbmltcG9ydCB7IElDbHVzdGVyT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWNsdXN0ZXItb3B0aW9ucyc7XG5pbXBvcnQgeyBJTWFwT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaW1hcC1vcHRpb25zJztcbmltcG9ydCB7IElMYXRMb25nIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgeyBJUG9pbnQgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lwb2ludCc7XG5pbXBvcnQgeyBJU2l6ZSB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaXNpemUnO1xuaW1wb3J0IHsgSU1hcmtlck9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2ltYXJrZXItb3B0aW9ucyc7XG5pbXBvcnQgeyBJTWFya2VySWNvbkluZm8gfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2ltYXJrZXItaWNvbi1pbmZvJztcbmltcG9ydCB7IElQb2x5Z29uT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaXBvbHlnb24tb3B0aW9ucyc7XG5pbXBvcnQgeyBJUG9seWxpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pcG9seWxpbmUtb3B0aW9ucyc7XG5pbXBvcnQgeyBJSW5mb1dpbmRvd09wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lpbmZvLXdpbmRvdy1vcHRpb25zJztcbmltcG9ydCB7IE1hcFR5cGVJZCB9IGZyb20gJy4uLy4uL21vZGVscy9tYXAtdHlwZS1pZCc7XG5pbXBvcnQgeyBNYXJrZXIgfSBmcm9tICcuLi8uLi9tb2RlbHMvbWFya2VyJztcbmltcG9ydCB7IFBvbHlnb24gfSBmcm9tICcuLi8uLi9tb2RlbHMvcG9seWdvbic7XG5pbXBvcnQgeyBQb2x5bGluZSB9IGZyb20gJy4uLy4uL21vZGVscy9wb2x5bGluZSc7XG5pbXBvcnQgeyBNaXhpbk1hcExhYmVsV2l0aE92ZXJsYXlWaWV3IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2dvb2dsZS9nb29nbGUtbGFiZWwnO1xuaW1wb3J0IHsgTWl4aW5DYW52YXNPdmVybGF5IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2dvb2dsZS9nb29nbGUtY2FudmFzLW92ZXJsYXknO1xuaW1wb3J0IHsgR29vZ2xlQ2FudmFzT3ZlcmxheSB9IGZyb20gJy4uLy4uL21vZGVscy9nb29nbGUvZ29vZ2xlLWNhbnZhcy1vdmVybGF5JztcbmltcG9ydCB7IENhbnZhc092ZXJsYXkgfSBmcm9tICcuLi8uLi9tb2RlbHMvY2FudmFzLW92ZXJsYXknO1xuaW1wb3J0IHsgTGF5ZXIgfSBmcm9tICcuLi8uLi9tb2RlbHMvbGF5ZXInO1xuaW1wb3J0IHsgSW5mb1dpbmRvdyB9IGZyb20gJy4uLy4uL21vZGVscy9pbmZvLXdpbmRvdyc7XG5pbXBvcnQgeyBHb29nbGVQb2x5Z29uIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2dvb2dsZS9nb29nbGUtcG9seWdvbic7XG5pbXBvcnQgeyBHb29nbGVQb2x5bGluZSB9IGZyb20gJy4uLy4uL21vZGVscy9nb29nbGUvZ29vZ2xlLXBvbHlsaW5lJztcbmltcG9ydCB7IEdvb2dsZUNvbnZlcnNpb25zIH0gZnJvbSAnLi9nb29nbGUtY29udmVyc2lvbnMnO1xuaW1wb3J0IHsgR29vZ2xlTWFya2VyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2dvb2dsZS9nb29nbGUtbWFya2VyJztcbmltcG9ydCB7IEdvb2dsZUxheWVyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2dvb2dsZS9nb29nbGUtbGF5ZXInO1xuaW1wb3J0IHsgSUJveCB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWJveCc7XG5pbXBvcnQgeyBHb29nbGVNYXBFdmVudHNMb29rdXAgfSBmcm9tICcuLi8uLi9tb2RlbHMvZ29vZ2xlL2dvb2dsZS1ldmVudHMtbG9va3VwJztcbmltcG9ydCAqIGFzIEdvb2dsZU1hcFR5cGVzIGZyb20gJy4vZ29vZ2xlLW1hcC10eXBlcyc7XG5cbmRlY2xhcmUgY29uc3QgZ29vZ2xlOiBhbnk7XG5kZWNsYXJlIGNvbnN0IE1hcmtlckNsdXN0ZXJlcjogYW55O1xuXG4vKipcbiAqIENvbmNyZXRlIGltcGxlbWVudGF0aW9uIG9mIHRoZSBNYXBTZXJ2aWNlIGFic3RyYWN0IGltcGxlbWVudGluZyBhIEdvb2dsZSBNYXBzIHByb3ZpZGVyXG4gKlxuICogQGV4cG9ydFxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgR29vZ2xlTWFwU2VydmljZSBpbXBsZW1lbnRzIE1hcFNlcnZpY2Uge1xuXG4gICAgLy8vXG4gICAgLy8vIEZpZWxkIERlY2xhcmF0aW9uc1xuICAgIC8vL1xuXG4gICAgcHJpdmF0ZSBfbWFwOiBQcm9taXNlPEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcD47XG4gICAgcHJpdmF0ZSBfbWFwSW5zdGFuY2U6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcDtcbiAgICBwcml2YXRlIF9tYXBSZXNvbHZlcjogKHZhbHVlPzogR29vZ2xlTWFwVHlwZXMuR29vZ2xlTWFwKSA9PiB2b2lkO1xuICAgIHByaXZhdGUgX2NvbmZpZzogR29vZ2xlTWFwQVBJTG9hZGVyQ29uZmlnO1xuXG4gICAgLy8vXG4gICAgLy8vIFByb3BlcnR5IERlZmluaXRpb25zXG4gICAgLy8vXG5cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIEdvb2dsZSBNYXAgY29udHJvbCBpbnN0YW5jZSB1bmRlcmx5aW5nIHRoZSBpbXBsZW1lbnRhdGlvblxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IE1hcEluc3RhbmNlKCk6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCB7IHJldHVybiB0aGlzLl9tYXBJbnN0YW5jZTsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyBhIFByb21pc2UgZm9yIGEgR29vZ2xlIE1hcCBjb250cm9sIGluc3RhbmNlIHVuZGVybHlpbmcgdGhlIGltcGxlbWVudGF0aW9uLiBVc2UgdGhpcyBpbnN0ZWFkIG9mIHtAbGluayBNYXBJbnN0YW5jZX0gaWYgeW91XG4gICAgICogYXJlIG5vdCBzdXJlIGlmIGFuZCB3aGVuIHRoZSBpbnN0YW5jZSB3aWxsIGJlIGNyZWF0ZWQuXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IE1hcFByb21pc2UoKTogUHJvbWlzZTxHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXA+IHsgcmV0dXJuIHRoaXMuX21hcDsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbWFwcyBwaHlzaWNhbCBzaXplLlxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQGFic3RyYWN0XG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIGdldCBNYXBTaXplKCk6IElTaXplIHtcbiAgICAgICAgaWYgKHRoaXMuTWFwSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsOiBIVE1MRGl2RWxlbWVudCA9IHRoaXMuTWFwSW5zdGFuY2UuZ2V0RGl2KCk7XG4gICAgICAgICAgICBjb25zdCBzOiBJU2l6ZSA9IHsgd2lkdGg6IGVsLm9mZnNldFdpZHRoLCBoZWlnaHQ6IGVsLm9mZnNldEhlaWdodCB9O1xuICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIEdvb2dsZU1hcFNlcnZpY2UuXG4gICAgICogQHBhcmFtIF9sb2FkZXIgTWFwQVBJTG9hZGVyIGluc3RhbmNlIGltcGxlbWVudGVkIGZvciBHb29nbGUgTWFwcy4gVGhpcyBpbnN0YW5jZSB3aWxsIGdlbmVyYWxseSBiZSBpbmplY3RlZC5cbiAgICAgKiBAcGFyYW0gX3pvbmUgTmdab25lIG9iamVjdCB0byBlbmFibGUgem9uZSBhd2FyZSBwcm9taXNlcy4gVGhpcyB3aWxsIGdlbmVyYWxseSBiZSBpbmplY3RlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbG9hZGVyOiBNYXBBUElMb2FkZXIsIHByaXZhdGUgX3pvbmU6IE5nWm9uZSkge1xuICAgICAgICB0aGlzLl9tYXAgPSBuZXcgUHJvbWlzZTxHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXA+KFxuICAgICAgICAgICAgKHJlc29sdmU6IChtYXA6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCkgPT4gdm9pZCkgPT4geyB0aGlzLl9tYXBSZXNvbHZlciA9IHJlc29sdmU7IH1cbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5fY29uZmlnID0gKDxHb29nbGVNYXBBUElMb2FkZXI+dGhpcy5fbG9hZGVyKS5Db25maWc7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzIGFuZCBNYXBTZXJ2aWNlIGludGVyZmFjZSBpbXBsZW1lbnRhdGlvblxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGNhbnZhcyBvdmVybGF5IGxheWVyIHRvIHBlcmZvcm0gY3VzdG9tIGRyYXdpbmcgb3ZlciB0aGUgbWFwIHdpdGggb3V0XG4gICAgICogc29tZSBvZiB0aGUgb3ZlcmhlYWQgYXNzb2NpYXRlZCB3aXRoIGdvaW5nIHRocm91Z2ggdGhlIE1hcCBvYmplY3RzLlxuICAgICAqIEBwYXJhbSBkcmF3Q2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIHRyaWdnZXJlZCB3aGVuIHRoZSBjYW52YXMgaXMgcmVhZHkgdG8gYmVcbiAgICAgKiByZW5kZXJlZCBmb3IgdGhlIGN1cnJlbnQgbWFwIHZpZXcuXG4gICAgICogQHJldHVybnMgLSBQcm9taXNlIG9mIGEge0BsaW5rIENhbnZhc092ZXJsYXl9IG9iamVjdC5cbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVDYW52YXNPdmVybGF5KGRyYXdDYWxsYmFjazogKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpID0+IHZvaWQpOiBQcm9taXNlPENhbnZhc092ZXJsYXk+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtYXA6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3ZlcmxheTogR29vZ2xlQ2FudmFzT3ZlcmxheSA9IG5ldyBHb29nbGVDYW52YXNPdmVybGF5KGRyYXdDYWxsYmFjayk7XG4gICAgICAgICAgICBvdmVybGF5LlNldE1hcChtYXApO1xuICAgICAgICAgICAgcmV0dXJuIG92ZXJsYXk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qXG4gICAgICogQ3JlYXRlcyBhIEdvb2dsZSBtYXAgY2x1c3RlciBsYXllciB3aXRoaW4gdGhlIG1hcCBjb250ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbnMgZm9yIHRoZSBsYXllci4gU2VlIHtAbGluayBJQ2x1c3Rlck9wdGlvbnN9LlxuICAgICAqIEByZXR1cm5zIC0gUHJvbWlzZSBvZiBhIHtAbGluayBMYXllcn0gb2JqZWN0LCB3aGljaCBtb2RlbHMgdGhlIHVuZGVybHlpbmcgTWljcm9zb2Z0Lk1hcHMuQ2x1c3RlckxheWVyIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZUNsdXN0ZXJMYXllcihvcHRpb25zOiBJQ2x1c3Rlck9wdGlvbnMpOiBQcm9taXNlPExheWVyPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAudGhlbigobWFwOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXApID0+IHtcbiAgICAgICAgICAgIGxldCB1cGRhdGVPcHRpb25zOiBib29sZWFuID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBtYXJrZXJDbHVzdGVyZXI6IEdvb2dsZU1hcFR5cGVzLk1hcmtlckNsdXN0ZXJlciA9IG5ldyBNYXJrZXJDbHVzdGVyZXIobWFwLCBbXSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBjbHVzdGVyTGF5ZXIgPSBuZXcgR29vZ2xlTWFya2VyQ2x1c3RlcmVyKG1hcmtlckNsdXN0ZXJlcik7XG4gICAgICAgICAgICBjb25zdCBvOiBJQ2x1c3Rlck9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgaWQ6IG9wdGlvbnMuaWRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMudmlzaWJsZSkge1xuICAgICAgICAgICAgICAgIG8udmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHVwZGF0ZU9wdGlvbnMgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLmNsdXN0ZXJpbmdFbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgby5jbHVzdGVyaW5nRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHVwZGF0ZU9wdGlvbnMgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVwZGF0ZU9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBjbHVzdGVyTGF5ZXIuU2V0T3B0aW9ucyhvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjbHVzdGVyTGF5ZXI7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5mb3JtYXRpb24gd2luZG93IGZvciBhIG1hcCBwb3NpdGlvblxuICAgICAqXG4gICAgICogQHBhcmFtIFtvcHRpb25zXSAtIEluZm93aW5kb3cgb3B0aW9ucy4gU2VlIHtAbGluayBJSW5mb1dpbmRvd09wdGlvbnN9XG4gICAgICogQHJldHVybnMgLSBQcm9taXNlIG9mIGEge0BsaW5rIEluZm9XaW5kb3d9IG9iamVjdCwgd2hpY2ggbW9kZWxzIHRoZSB1bmRlcmx5aW5nIE1pY3Jvc29mdC5NYXBzLkluZm9ib3ggb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlSW5mb1dpbmRvdyhvcHRpb25zPzogSUluZm9XaW5kb3dPcHRpb25zKTogUHJvbWlzZTxHb29nbGVJbmZvV2luZG93PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAudGhlbigobWFwOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXApID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG86IEdvb2dsZU1hcFR5cGVzLkluZm9XaW5kb3dPcHRpb25zID0gR29vZ2xlQ29udmVyc2lvbnMuVHJhbnNsYXRlSW5mb1dpbmRvd09wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBpbmZvV2luZG93OiBHb29nbGVNYXBUeXBlcy5JbmZvV2luZG93ID0gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3cobyk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEdvb2dsZUluZm9XaW5kb3coaW5mb1dpbmRvdywgdGhpcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBtYXAgbGF5ZXIgd2l0aGluIHRoZSBtYXAgY29udGV4dFxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBPcHRpb25zIGZvciB0aGUgbGF5ZXIuIFNlZSB7QGxpbmsgSUxheWVyT3B0aW9uc31cbiAgICAgKiBAcmV0dXJucyAtIFByb21pc2Ugb2YgYSB7QGxpbmsgTGF5ZXJ9IG9iamVjdCwgd2hpY2ggbW9kZWxzIHRoZSB1bmRlcmx5aW5nIE1pY3Jvc29mdC5NYXBzLkxheWVyIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZUxheWVyKG9wdGlvbnM6IElMYXllck9wdGlvbnMpOiBQcm9taXNlPExheWVyPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAudGhlbigobWFwOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXApID0+IHtcbiAgICAgICAgICAgICByZXR1cm4gbmV3IEdvb2dsZUxheWVyKG1hcCwgdGhpcywgb3B0aW9ucy5pZCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBtYXAgaW5zdGFuY2VcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbCAtIEhUTUwgZWxlbWVudCB0byBob3N0IHRoZSBtYXAuXG4gICAgICogQHBhcmFtIG1hcE9wdGlvbnMgLSBNYXAgb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIC0gUHJvbWlzZSBmdWxsZmlsbGVkIG9uY2UgdGhlIG1hcCBoYXMgYmVlbiBjcmVhdGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlTWFwKGVsOiBIVE1MRWxlbWVudCwgbWFwT3B0aW9uczogSU1hcE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRlci5Mb2FkKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAvLyBhcHBseSBtaXhpbnNcbiAgICAgICAgICAgIE1peGluTWFwTGFiZWxXaXRoT3ZlcmxheVZpZXcoKTtcbiAgICAgICAgICAgIE1peGluQ2FudmFzT3ZlcmxheSgpO1xuXG4gICAgICAgICAgICAvLyBleGVjdXRlIG1hcCBzdGFydHVwXG4gICAgICAgICAgICBpZiAoIW1hcE9wdGlvbnMubWFwVHlwZUlkID09IG51bGwpIHsgbWFwT3B0aW9ucy5tYXBUeXBlSWQgPSBNYXBUeXBlSWQuaHlicmlkOyB9XG4gICAgICAgICAgICBpZiAodGhpcy5fbWFwSW5zdGFuY2UgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuRGlzcG9zZU1hcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbzogR29vZ2xlTWFwVHlwZXMuTWFwT3B0aW9ucyA9IEdvb2dsZUNvbnZlcnNpb25zLlRyYW5zbGF0ZU9wdGlvbnMobWFwT3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBtYXA6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZWwsIG8pO1xuICAgICAgICAgICAgaWYgKG1hcE9wdGlvbnMuYm91bmRzKSB7XG4gICAgICAgICAgICAgICAgbWFwLmZpdEJvdW5kcyhHb29nbGVDb252ZXJzaW9ucy5UcmFuc2xhdGVCb3VuZHMobWFwT3B0aW9ucy5ib3VuZHMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX21hcEluc3RhbmNlID0gbWFwO1xuICAgICAgICAgICAgdGhpcy5fbWFwUmVzb2x2ZXIobWFwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIEdvb2dsZSBtYXAgbWFya2VyIHdpdGhpbiB0aGUgbWFwIGNvbnRleHRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBbb3B0aW9ucz08SU1hcmtlck9wdGlvbnM+e31dIC0gT3B0aW9ucyBmb3IgdGhlIG1hcmtlci4gU2VlIHtAbGluayBJTWFya2VyT3B0aW9uc30uXG4gICAgICogQHJldHVybnMgLSBQcm9taXNlIG9mIGEge0BsaW5rIE1hcmtlcn0gb2JqZWN0LCB3aGljaCBtb2RlbHMgdGhlIHVuZGVybHlpbmcgTWljcm9zb2Z0Lk1hcHMuUHVzaFBpbiBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVNYXJrZXIob3B0aW9uczogSU1hcmtlck9wdGlvbnMgPSA8SU1hcmtlck9wdGlvbnM+e30pOiBQcm9taXNlPE1hcmtlcj4ge1xuICAgICAgICBjb25zdCBwYXlsb2FkID0gKHg6IEdvb2dsZU1hcFR5cGVzLk1hcmtlck9wdGlvbnMsIG1hcDogR29vZ2xlTWFwVHlwZXMuR29vZ2xlTWFwKTogR29vZ2xlTWFya2VyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoeCk7XG4gICAgICAgICAgICBjb25zdCBtID0gbmV3IEdvb2dsZU1hcmtlcihtYXJrZXIpO1xuICAgICAgICAgICAgbS5Jc0ZpcnN0ID0gb3B0aW9ucy5pc0ZpcnN0O1xuICAgICAgICAgICAgbS5Jc0xhc3QgPSBvcHRpb25zLmlzTGFzdDtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLm1ldGFkYXRhKSB7IG9wdGlvbnMubWV0YWRhdGEuZm9yRWFjaCgodmFsOiBhbnksIGtleTogc3RyaW5nKSA9PiBtLk1ldGFkYXRhLnNldChrZXksIHZhbCkpOyB9XG4gICAgICAgICAgICBtYXJrZXIuc2V0TWFwKG1hcCk7XG4gICAgICAgICAgICByZXR1cm4gbTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtYXA6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbzogR29vZ2xlTWFwVHlwZXMuTWFya2VyT3B0aW9ucyA9IEdvb2dsZUNvbnZlcnNpb25zLlRyYW5zbGF0ZU1hcmtlck9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5pY29uSW5mbyAmJiBvcHRpb25zLmljb25JbmZvLm1hcmtlclR5cGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gTWFya2VyLkNyZWF0ZU1hcmtlcihvcHRpb25zLmljb25JbmZvKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mKHMpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBvLmljb24gPSBzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF5bG9hZChvLCBtYXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHMudGhlbih4ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8uaWNvbiA9IHguaWNvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXlsb2FkKG8sIG1hcCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXlsb2FkKG8sIG1hcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBwb2x5Z29uIHdpdGhpbiB0aGUgR29vZ2xlIE1hcCBtYXAgY29udGV4dFxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBPcHRpb25zIGZvciB0aGUgcG9seWdvbi4gU2VlIHtAbGluayBJUG9seWdvbk9wdGlvbnN9LlxuICAgICAqIEByZXR1cm5zIC0gUHJvbWlzZSBvZiBhIHtAbGluayBQb2x5Z29ufSBvYmplY3QsIHdoaWNoIG1vZGVscyB0aGUgdW5kZXJseWluZyBuYXRpdmUgcG9seWdvbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZVBvbHlnb24ob3B0aW9uczogSVBvbHlnb25PcHRpb25zKTogUHJvbWlzZTxQb2x5Z29uPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAudGhlbigobWFwOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXApID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG86IEdvb2dsZU1hcFR5cGVzLlBvbHlnb25PcHRpb25zID0gR29vZ2xlQ29udmVyc2lvbnMuVHJhbnNsYXRlUG9seWdvbk9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgICAgICBjb25zdCBwb2x5Z29uOiBHb29nbGVNYXBUeXBlcy5Qb2x5Z29uID0gbmV3IGdvb2dsZS5tYXBzLlBvbHlnb24obyk7XG4gICAgICAgICAgICBwb2x5Z29uLnNldE1hcChtYXApO1xuXG4gICAgICAgICAgICBjb25zdCBwOiBHb29nbGVQb2x5Z29uID0gbmV3IEdvb2dsZVBvbHlnb24ocG9seWdvbik7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5tZXRhZGF0YSkgeyBvcHRpb25zLm1ldGFkYXRhLmZvckVhY2goKHZhbDogYW55LCBrZXk6IHN0cmluZykgPT4gcC5NZXRhZGF0YS5zZXQoa2V5LCB2YWwpKTsgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMudGl0bGUgJiYgb3B0aW9ucy50aXRsZSAhPT0gJycpIHsgcC5UaXRsZSA9IG9wdGlvbnMudGl0bGU7IH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNob3dMYWJlbCAhPSBudWxsKSB7IHAuU2hvd0xhYmVsID0gb3B0aW9ucy5zaG93TGFiZWw7IH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnNob3dUb29sdGlwICE9IG51bGwpIHsgcC5TaG93VG9vbHRpcCA9IG9wdGlvbnMuc2hvd1Rvb2x0aXA7IH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxhYmVsTWF4Wm9vbSAhPSBudWxsKSB7IHAuTGFiZWxNYXhab29tID0gb3B0aW9ucy5sYWJlbE1heFpvb207IH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxhYmVsTWluWm9vbSAhPSBudWxsKSB7IHAuTGFiZWxNaW5ab29tID0gb3B0aW9ucy5sYWJlbE1pblpvb207IH1cbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgcG9seWxpbmUgd2l0aGluIHRoZSBHb29nbGUgTWFwIG1hcCBjb250ZXh0XG4gICAgICpcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIE9wdGlvbnMgZm9yIHRoZSBwb2x5bGluZS4gU2VlIHtAbGluayBJUG9seWxpbmVPcHRpb25zfS5cbiAgICAgKiBAcmV0dXJucyAtIFByb21pc2Ugb2YgYSB7QGxpbmsgUG9seWxpbmV9IG9iamVjdCAob3IgYW4gYXJyYXkgdGhlcmVmb3JlIGZvciBjb21wbGV4IHBhdGhzKVxuICAgICAqIHdoaWNoIG1vZGVscyB0aGUgdW5kZXJseWluZyBuYXRpdmUgcG9seWxpbmUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVQb2x5bGluZShvcHRpb25zOiBJUG9seWxpbmVPcHRpb25zKTogUHJvbWlzZTxQb2x5bGluZXxBcnJheTxQb2x5bGluZT4+IHtcbiAgICAgICAgbGV0IHBvbHlsaW5lOiBHb29nbGVNYXBUeXBlcy5Qb2x5bGluZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtYXA6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbzogR29vZ2xlTWFwVHlwZXMuUG9seWxpbmVPcHRpb25zID0gR29vZ2xlQ29udmVyc2lvbnMuVHJhbnNsYXRlUG9seWxpbmVPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGF0aCAmJiBvcHRpb25zLnBhdGgubGVuZ3RoID4gMCAmJiAhQXJyYXkuaXNBcnJheShvcHRpb25zLnBhdGhbMF0pKSB7XG4gICAgICAgICAgICAgICAgby5wYXRoID0gR29vZ2xlQ29udmVyc2lvbnMuVHJhbnNsYXRlUGF0aHMob3B0aW9ucy5wYXRoKVswXTtcbiAgICAgICAgICAgICAgICBwb2x5bGluZSA9IG5ldyBnb29nbGUubWFwcy5Qb2x5bGluZShvKTtcbiAgICAgICAgICAgICAgICBwb2x5bGluZS5zZXRNYXAobWFwKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBsID0gbmV3IEdvb2dsZVBvbHlsaW5lKHBvbHlsaW5lKTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5tZXRhZGF0YSkgeyBvcHRpb25zLm1ldGFkYXRhLmZvckVhY2goKHZhbDogYW55LCBrZXk6IHN0cmluZykgPT4gcGwuTWV0YWRhdGEuc2V0KGtleSwgdmFsKSk7IH1cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy50aXRsZSAmJiBvcHRpb25zLnRpdGxlICE9PSAnJykgeyBwbC5UaXRsZSA9IG9wdGlvbnMudGl0bGU7IH1cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zaG93VG9vbHRpcCAhPSBudWxsKSB7IHBsLlNob3dUb29sdGlwID0gb3B0aW9ucy5zaG93VG9vbHRpcDsgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGhzOiBBcnJheTxBcnJheTxHb29nbGVNYXBUeXBlcy5MYXRMbmc+PiA9IEdvb2dsZUNvbnZlcnNpb25zLlRyYW5zbGF0ZVBhdGhzKG9wdGlvbnMucGF0aCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXM6IEFycmF5PFBvbHlsaW5lPiA9IG5ldyBBcnJheTxQb2x5bGluZT4oKTtcbiAgICAgICAgICAgICAgICBwYXRocy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICAgICAgICAgICAgICBvLnBhdGggPSBwO1xuICAgICAgICAgICAgICAgICAgICBwb2x5bGluZSA9IG5ldyBnb29nbGUubWFwcy5Qb2x5bGluZShvKTtcbiAgICAgICAgICAgICAgICAgICAgcG9seWxpbmUuc2V0TWFwKG1hcCk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGwgPSBuZXcgR29vZ2xlUG9seWxpbmUocG9seWxpbmUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5tZXRhZGF0YSkgeyBvcHRpb25zLm1ldGFkYXRhLmZvckVhY2goKHZhbDogYW55LCBrZXk6IHN0cmluZykgPT4gcGwuTWV0YWRhdGEuc2V0KGtleSwgdmFsKSk7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMudGl0bGUgJiYgb3B0aW9ucy50aXRsZSAhPT0gJycpIHsgcGwuVGl0bGUgPSBvcHRpb25zLnRpdGxlOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnNob3dUb29sdGlwICE9IG51bGwpIHsgcGwuU2hvd1Rvb2x0aXAgPSBvcHRpb25zLnNob3dUb29sdGlwOyB9XG4gICAgICAgICAgICAgICAgICAgIGxpbmVzLnB1c2gocGwpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBsaW5lcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVsZXRlcyBhIGxheWVyIGZyb20gdGhlIG1hcC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsYXllciAtIExheWVyIHRvIGRlbGV0ZS4gU2VlIHtAbGluayBMYXllcn0uIFRoaXMgbWV0aG9kIGV4cGVjdHMgdGhlIEdvb2dsZSBzcGVjaWZpYyBMYXllciBtb2RlbCBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKiBAcmV0dXJucyAtIFByb21pc2UgZnVsbGZpbGxlZCB3aGVuIHRoZSBsYXllciBoYXMgYmVlbiByZW1vdmVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgRGVsZXRlTGF5ZXIobGF5ZXI6IExheWVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIC8vIHJldHVybiByZXNvbHZlZCBwcm9taXNlIGFzIHRoZXJlIGlzIG5vIGNvbmVwdCBvZiBhIGN1c3RvbSBsYXllciBpbiBHb29nbGUuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwYW9zZSB0aGUgbWFwIGFuZCBhc3NvY2lhdGVkIHJlc291cmVzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgRGlzcG9zZU1hcCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuX21hcCA9PSBudWxsICYmIHRoaXMuX21hcEluc3RhbmNlID09IG51bGwpIHsgcmV0dXJuOyB9XG4gICAgICAgIGlmICh0aGlzLl9tYXBJbnN0YW5jZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXBJbnN0YW5jZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9tYXAgPSBuZXcgUHJvbWlzZTxHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXA+KChyZXNvbHZlOiAoKSA9PiB2b2lkKSA9PiB7IHRoaXMuX21hcFJlc29sdmVyID0gcmVzb2x2ZTsgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBnZW8gY29vcmRpbmF0ZXMgb2YgdGhlIG1hcCBjZW50ZXJcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiBmdWxsZmlsbGVkIGNvbnRhaW5zIHRoZSBnb2UgbG9jYXRpb24gb2YgdGhlIGNlbnRlci4gU2VlIHtAbGluayBJTGF0TG9uZ30uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRDZW50ZXIoKTogUHJvbWlzZTxJTGF0TG9uZz4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLnRoZW4oKG1hcDogR29vZ2xlTWFwVHlwZXMuR29vZ2xlTWFwKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZW50ZXI6IEdvb2dsZU1hcFR5cGVzLkxhdExuZyA9IG1hcC5nZXRDZW50ZXIoKTtcbiAgICAgICAgICAgIHJldHVybiA8SUxhdExvbmc+e1xuICAgICAgICAgICAgICAgIGxhdGl0dWRlOiBjZW50ZXIubGF0KCksXG4gICAgICAgICAgICAgICAgbG9uZ2l0dWRlOiBjZW50ZXIubG5nKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGdlbyBjb29yZGluYXRlcyBvZiB0aGUgbWFwIGJvdW5kaW5nIGJveFxuICAgICAqXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGdlbyBsb2NhdGlvbiBvZiB0aGUgYm91bmRpbmcgYm94LiBTZWUge0BsaW5rIElCb3h9LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0Qm91bmRzKCk6IFByb21pc2U8SUJveD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLnRoZW4oKG1hcDogR29vZ2xlTWFwVHlwZXMuR29vZ2xlTWFwKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBib3ggPSBtYXAuZ2V0Qm91bmRzKCk7XG4gICAgICAgICAgICByZXR1cm4gPElCb3g+e1xuICAgICAgICAgICAgICAgIG1heExhdGl0dWRlOiBib3guZ2V0Tm9ydGhFYXN0KCkubGF0KCksXG4gICAgICAgICAgICAgICAgbWF4TG9uZ2l0dWRlOiBNYXRoLm1heChib3guZ2V0Tm9ydGhFYXN0KCkubG5nKCksIGJveC5nZXRTb3V0aFdlc3QoKS5sbmcoKSksXG4gICAgICAgICAgICAgICAgbWluTGF0aXR1ZGU6IGJveC5nZXRTb3V0aFdlc3QoKS5sYXQoKSxcbiAgICAgICAgICAgICAgICBtaW5Mb25naXR1ZGU6IE1hdGgubWluKGJveC5nZXROb3J0aEVhc3QoKS5sbmcoKSwgYm94LmdldFNvdXRoV2VzdCgpLmxuZygpKSxcbiAgICAgICAgICAgICAgICBjZW50ZXI6IHsgbGF0aXR1ZGU6IGJveC5nZXRDZW50ZXIoKS5sYXQoKSwgbG9uZ2l0dWRlOiBib3guZ2V0Q2VudGVyKCkubG5nKCkgfSxcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAwXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBjdXJyZW50IHpvb20gbGV2ZWwgb2YgdGhlIG1hcC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiBmdWxsZmlsbGVkIGNvbnRhaW5zIHRoZSB6b29tIGxldmVsLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0Wm9vbSgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFwLnRoZW4oKG1hcDogR29vZ2xlTWFwVHlwZXMuR29vZ2xlTWFwKSA9PiBtYXAuZ2V0Wm9vbSgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyBhIGNvbnZlcnNpb24gb2YgZ2VvIGNvb3JkaW5hdGVzIHRvIHBpeGVscyBvbiB0aGUgbWFwIGNvbnRyb2wuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbG9jIC0gVGhlIGdlbyBjb29yZGluYXRlcyB0byB0cmFuc2xhdGUuXG4gICAgICogQHJldHVybnMgLSBQcm9taXNlIG9mIGFuIHtAbGluayBJUG9pbnR9IGludGVyZmFjZSByZXByZXNlbnRpbmcgdGhlIHBpeGVscy4gVGhpcyBwcm9taXNlIHJlc29sdmVzIHRvIG51bGxcbiAgICAgKiBpZiB0aGUgZ29lIGNvb3JkaW5hdGVzIGFyZSBub3QgaW4gdGhlIHZpZXcgcG9ydC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIExvY2F0aW9uVG9Qb2ludChsb2M6IElMYXRMb25nKTogUHJvbWlzZTxJUG9pbnQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXApID0+IHtcbiAgICAgICAgICAgIGxldCBjcm9zc2VzRGF0ZUxpbmU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGw6IEdvb2dsZU1hcFR5cGVzLkxhdExuZyA9IEdvb2dsZUNvbnZlcnNpb25zLlRyYW5zbGF0ZUxvY2F0aW9uT2JqZWN0KGxvYyk7XG4gICAgICAgICAgICBjb25zdCBwID0gbS5nZXRQcm9qZWN0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBzOiBudW1iZXIgPSBNYXRoLnBvdygyLCBtLmdldFpvb20oKSk7XG4gICAgICAgICAgICBjb25zdCBiOiBHb29nbGVNYXBUeXBlcy5MYXRMbmdCb3VuZHMgPSBtLmdldEJvdW5kcygpO1xuICAgICAgICAgICAgaWYgKGIuZ2V0Q2VudGVyKCkubG5nKCkgPCBiLmdldFNvdXRoV2VzdCgpLmxuZygpICB8fFxuICAgICAgICAgICAgICAgIGIuZ2V0Q2VudGVyKCkubG5nKCkgPiBiLmdldE5vcnRoRWFzdCgpLmxuZygpKSB7IGNyb3NzZXNEYXRlTGluZSA9IHRydWU7IH1cblxuXG4gICAgICAgICAgICBjb25zdCBvZmZzZXRZOiBudW1iZXIgPSBwLmZyb21MYXRMbmdUb1BvaW50KGIuZ2V0Tm9ydGhFYXN0KCkpLnk7XG4gICAgICAgICAgICBjb25zdCBvZmZzZXRYOiBudW1iZXIgPSBwLmZyb21MYXRMbmdUb1BvaW50KGIuZ2V0U291dGhXZXN0KCkpLng7XG4gICAgICAgICAgICBjb25zdCBwb2ludDogR29vZ2xlTWFwVHlwZXMuUG9pbnQgPSBwLmZyb21MYXRMbmdUb1BvaW50KGwpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiBNYXRoLmZsb29yKChwb2ludC54IC0gb2Zmc2V0WCArICgoY3Jvc3Nlc0RhdGVMaW5lICYmIHBvaW50LnggPCBvZmZzZXRYKSA/IDI1NiA6IDApKSAqIHMpLFxuICAgICAgICAgICAgICAgIHk6IE1hdGguZmxvb3IoKHBvaW50LnkgLSBvZmZzZXRZKSAqIHMpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyBhIGNvbnZlcnNpb24gb2YgZ2VvIGNvb3JkaW5hdGVzIHRvIHBpeGVscyBvbiB0aGUgbWFwIGNvbnRyb2wuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbG9jIC0gVGhlIGdlbyBjb29yZGluYXRlcyB0byB0cmFuc2xhdGUuXG4gICAgICogQHJldHVybnMgLSBQcm9taXNlIG9mIGFuIHtAbGluayBJUG9pbnR9IGludGVyZmFjZSBhcnJheSByZXByZXNlbnRpbmcgdGhlIHBpeGVscy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBMb2NhdGlvbnNUb1BvaW50cyhsb2NzOiBBcnJheTxJTGF0TG9uZz4pOiBQcm9taXNlPEFycmF5PElQb2ludD4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXApID0+IHtcbiAgICAgICAgICAgIGxldCBjcm9zc2VzRGF0ZUxpbmU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBtLmdldFByb2plY3Rpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IHM6IG51bWJlciA9IE1hdGgucG93KDIsIG0uZ2V0Wm9vbSgpKTtcbiAgICAgICAgICAgIGNvbnN0IGI6IEdvb2dsZU1hcFR5cGVzLkxhdExuZ0JvdW5kcyA9IG0uZ2V0Qm91bmRzKCk7XG4gICAgICAgICAgICBpZiAoYi5nZXRDZW50ZXIoKS5sbmcoKSA8IGIuZ2V0U291dGhXZXN0KCkubG5nKCkgIHx8XG4gICAgICAgICAgICAgICAgYi5nZXRDZW50ZXIoKS5sbmcoKSA+IGIuZ2V0Tm9ydGhFYXN0KCkubG5nKCkpIHsgY3Jvc3Nlc0RhdGVMaW5lID0gdHJ1ZTsgfVxuXG4gICAgICAgICAgICBjb25zdCBvZmZzZXRYOiBudW1iZXIgPSBwLmZyb21MYXRMbmdUb1BvaW50KGIuZ2V0U291dGhXZXN0KCkpLng7XG4gICAgICAgICAgICBjb25zdCBvZmZzZXRZOiBudW1iZXIgPSBwLmZyb21MYXRMbmdUb1BvaW50KGIuZ2V0Tm9ydGhFYXN0KCkpLnk7XG4gICAgICAgICAgICBjb25zdCBsID0gbG9jcy5tYXAobGwgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGwxOiBHb29nbGVNYXBUeXBlcy5MYXRMbmcgPSBHb29nbGVDb252ZXJzaW9ucy5UcmFuc2xhdGVMb2NhdGlvbk9iamVjdChsbCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9pbnQ6IEdvb2dsZU1hcFR5cGVzLlBvaW50ID0gcC5mcm9tTGF0TG5nVG9Qb2ludChsMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgeDogTWF0aC5mbG9vcigocG9pbnQueCAtIG9mZnNldFggKyAoKGNyb3NzZXNEYXRlTGluZSAmJiBwb2ludC54IDwgb2Zmc2V0WCkgPyAyNTYgOiAwKSkgKiBzKSxcbiAgICAgICAgICAgICAgICAgICAgeTogTWF0aC5mbG9vcigocG9pbnQueSAtIG9mZnNldFkpICogcylcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2VudGVycyB0aGUgbWFwIG9uIGEgZ2VvIGxvY2F0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIGxhdExuZyAtIEdlb0Nvb3JkaW5hdGVzIGFyb3VuZCB3aGljaCB0byBjZW50ZXIgdGhlIG1hcC4gU2VlIHtAbGluayBJTGF0TG9uZ31cbiAgICAgKiBAcmV0dXJucyAtIFByb21pc2UgdGhhdCBpcyBmdWxsZmlsbGVkIHdoZW4gdGhlIGNlbnRlciBvcGVyYXRpb25zIGhhcyBiZWVuIGNvbXBsZXRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFNldENlbnRlcihsYXRMbmc6IElMYXRMb25nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAudGhlbigobWFwOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXApID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNlbnRlcjogR29vZ2xlTWFwVHlwZXMuTGF0TG5nID0gR29vZ2xlQ29udmVyc2lvbnMuVHJhbnNsYXRlTG9jYXRpb25PYmplY3QobGF0TG5nKTtcbiAgICAgICAgICAgIG1hcC5zZXRDZW50ZXIoY2VudGVyKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgZ2VuZXJpYyBtYXAgb3B0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9ucyB0byBzZXQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRNYXBPcHRpb25zKG9wdGlvbnM6IElNYXBPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX21hcC50aGVuKChtOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXApID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG86IEdvb2dsZU1hcFR5cGVzLk1hcE9wdGlvbnMgPSBHb29nbGVDb252ZXJzaW9ucy5UcmFuc2xhdGVPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICAgICAgbS5zZXRPcHRpb25zKG8pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSB2aWV3IG9wdGlvbnMgb2YgdGhlIG1hcC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9ucyB0byBzZXQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRWaWV3T3B0aW9ucyhvcHRpb25zOiBJTWFwT3B0aW9ucykge1xuICAgICAgICB0aGlzLl9tYXAudGhlbigobTogR29vZ2xlTWFwVHlwZXMuR29vZ2xlTWFwKSA9PiB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5ib3VuZHMpIHtcbiAgICAgICAgICAgICAgICBtLmZpdEJvdW5kcyhHb29nbGVDb252ZXJzaW9ucy5UcmFuc2xhdGVCb3VuZHMob3B0aW9ucy5ib3VuZHMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG86IEdvb2dsZU1hcFR5cGVzLk1hcE9wdGlvbnMgPSBHb29nbGVDb252ZXJzaW9ucy5UcmFuc2xhdGVPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICAgICAgbS5zZXRPcHRpb25zKG8pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSB6b29tIGxldmVsIG9mIHRoZSBtYXAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gem9vbSAtIFpvb20gbGV2ZWwgdG8gc2V0LlxuICAgICAqIEByZXR1cm5zIC0gQSBQcm9taXNlIHRoYXQgaXMgZnVsbGZpbGxlZCBvbmNlIHRoZSB6b29tIG9wZXJhdGlvbiBpcyBjb21wbGV0ZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXBTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFNldFpvb20oem9vbTogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAudGhlbigobWFwOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXApID0+IG1hcC5zZXRab29tKHpvb20pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGV2ZW50IHN1YnNjcmlwdGlvblxuICAgICAqXG4gICAgICogQHBhcmFtIGV2ZW50TmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudCAoZS5nLiAnY2xpY2snKVxuICAgICAqIEByZXR1cm5zIC0gQW4gb2JzZXJ2YWJsZSBvZiB0eXBlIEUgdGhhdCBmaXJlcyB3aGVuIHRoZSBldmVudCBvY2N1cnMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBTdWJzY3JpYmVUb01hcEV2ZW50PEU+KGV2ZW50TmFtZTogc3RyaW5nKTogT2JzZXJ2YWJsZTxFPiB7XG4gICAgICAgIGNvbnN0IGdvb2dsZUV2ZW50TmFtZTogc3RyaW5nID0gR29vZ2xlTWFwRXZlbnRzTG9va3VwW2V2ZW50TmFtZV07XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmNyZWF0ZSgob2JzZXJ2ZXI6IE9ic2VydmVyPEU+KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9tYXAudGhlbigobTogR29vZ2xlTWFwVHlwZXMuR29vZ2xlTWFwKSA9PiB7XG4gICAgICAgICAgICAgICAgbS5hZGRMaXN0ZW5lcihnb29nbGVFdmVudE5hbWUsIChlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fem9uZS5ydW4oKCkgPT4gb2JzZXJ2ZXIubmV4dChlKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVHJpZ2dlcnMgdGhlIGdpdmVuIGV2ZW50IG5hbWUgb24gdGhlIG1hcCBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBldmVudE5hbWUgLSBFdmVudCB0byB0cmlnZ2VyLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgaXMgZnVsbGZpbGxlZCBvbmNlIHRoZSBldmVudCBpcyB0cmlnZ2VyZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBUcmlnZ2VyTWFwRXZlbnQoZXZlbnROYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC50aGVuKChtKSA9PiBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyKG0sIGV2ZW50TmFtZSwgbnVsbCkpO1xuICAgIH1cblxufVxuIl19