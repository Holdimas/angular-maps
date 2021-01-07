import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MapMarkerDirective } from '../../components/map-marker';
import { MapService } from '../../services/map.service';
import { LayerService } from '../../services/layer.service';
import { ClusterService } from '../../services/cluster.service';
import { Marker } from '../../models/marker';
import { BingConversions } from './bing-conversions';
/**
 * Concrete implementation of the MarkerService abstract class for Bing Maps V8.
 *
 * @export
 */
export class BingMarkerService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingMarkerService.
     * @param _mapService - {@link MapService} instance. The concrete {@link BingMapService} implementation is expected.
     * @param _layerService - {@link LayerService} instance.
     * The concrete {@link BingLayerService} implementation is expected.
     * @param _clusterService - {@link ClusterService} instance.
     * The concrete {@link BingClusterService} implementation is expected.
     * @param _zone - NgZone instance to support zone aware promises.
     *
     * @memberof BingMarkerService
     */
    constructor(_mapService, _layerService, _clusterService, _zone) {
        this._mapService = _mapService;
        this._layerService = _layerService;
        this._clusterService = _clusterService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._markers = new Map();
    }
    ///
    /// Public members and MarkerService implementation
    ///
    /**
     * Adds a marker. Depending on the marker context, the marker will either by added to the map or a correcsponding layer.
     *
     * @param marker - The {@link MapMarkerDirective} to be added.
     *
     * @memberof BingMarkerService
     */
    AddMarker(marker) {
        const o = {
            position: { latitude: marker.Latitude, longitude: marker.Longitude },
            title: marker.Title,
            label: marker.Label,
            draggable: marker.Draggable,
            icon: marker.IconUrl,
            iconInfo: marker.IconInfo,
            isFirst: marker.IsFirstInSet,
            isLast: marker.IsLastInSet
        };
        if (marker.Width) {
            o.width = marker.Width;
        }
        if (marker.Height) {
            o.height = marker.Height;
        }
        if (marker.Anchor) {
            o.anchor = marker.Anchor;
        }
        if (marker.Metadata) {
            o.metadata = marker.Metadata;
        }
        // create marker via promise.
        let markerPromise = null;
        if (marker.InClusterLayer) {
            markerPromise = this._clusterService.CreateMarker(marker.LayerId, o);
        }
        else if (marker.InCustomLayer) {
            markerPromise = this._layerService.CreateMarker(marker.LayerId, o);
        }
        else {
            markerPromise = this._mapService.CreateMarker(o);
        }
        this._markers.set(marker, markerPromise);
        if (marker.IconInfo) {
            markerPromise.then((m) => {
                // update iconInfo to provide hook to do post icon creation activities and
                // also re-anchor the marker
                marker.DynamicMarkerCreated.emit(o.iconInfo);
                const p = {
                    x: (o.iconInfo.size && o.iconInfo.markerOffsetRatio) ? (o.iconInfo.size.width * o.iconInfo.markerOffsetRatio.x) : 0,
                    y: (o.iconInfo.size && o.iconInfo.markerOffsetRatio) ? (o.iconInfo.size.height * o.iconInfo.markerOffsetRatio.y) : 0,
                };
                m.SetAnchor(p);
            });
        }
    }
    /**
     * Registers an event delegate for a marker.
     *
     * @param eventName - The name of the event to register (e.g. 'click')
     * @param marker - The {@link MapMarker} for which to register the event.
     * @returns - Observable emiting an instance of T each time the event occurs.
     *
     * @memberof BingMarkerService
     */
    CreateEventObservable(eventName, marker) {
        const b = new Subject();
        if (eventName === 'mousemove') {
            return b.asObservable();
        }
        if (eventName === 'rightclick') {
            return b.asObservable();
        }
        ///
        /// mousemove and rightclick are not supported by bing polygons.
        ///
        return Observable.create((observer) => {
            this._markers.get(marker).then((m) => {
                m.AddListener(eventName, (e) => this._zone.run(() => observer.next(e)));
            });
        });
    }
    /**
     * Deletes a marker.
     *
     * @param marker - {@link MapMarker} to be deleted.
     * @returns - A promise fullfilled once the marker has been deleted.
     *
     * @memberof BingMarkerService
     */
    DeleteMarker(marker) {
        const m = this._markers.get(marker);
        let p = Promise.resolve();
        if (m != null) {
            p = m.then((ma) => {
                if (marker.InClusterLayer) {
                    this._clusterService.GetNativeLayer(marker.LayerId).then(l => { l.RemoveEntity(ma); });
                }
                if (marker.InCustomLayer) {
                    this._layerService.GetNativeLayer(marker.LayerId).then(l => { l.RemoveEntity(ma); });
                }
                return this._zone.run(() => {
                    ma.DeleteMarker();
                    this._markers.delete(marker);
                });
            });
        }
        return p;
    }
    /**
     * Obtains geo coordinates for the marker on the click location
     *
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     *
     * @memberof BingMarkerService
     */
    GetCoordinatesFromClick(e) {
        if (!e) {
            return null;
        }
        if (!e.primitive) {
            return null;
        }
        if (!(e.primitive instanceof Microsoft.Maps.Pushpin)) {
            return null;
        }
        const p = e.primitive;
        const loc = p.getLocation();
        return { latitude: loc.latitude, longitude: loc.longitude };
    }
    /**
     * Obtains the marker model for the marker allowing access to native implementation functionatiliy.
     *
     * @param marker - The {@link MapMarker} for which to obtain the marker model.
     * @returns - A promise that when fullfilled contains the {@link Marker} implementation of the underlying platform.
     *
     * @memberof BingMarkerService
     */
    GetNativeMarker(marker) {
        return this._markers.get(marker);
    }
    /**
     * Obtains the marker pixel location for the marker on the click location
     *
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the pixels of the marker on the map canvas.
     *
     * @memberof BingMarkerService
     */
    GetPixelsFromClick(e) {
        const loc = this.GetCoordinatesFromClick(e);
        if (loc == null) {
            return null;
        }
        const l = BingConversions.TranslateLocation(loc);
        const p = this._mapService.MapInstance.tryLocationToPixel(l, Microsoft.Maps.PixelReference.control);
        if (p == null) {
            return null;
        }
        return { x: p.x, y: p.y };
    }
    /**
     * Converts a geo location to a pixel location relative to the map canvas.
     *
     * @param target - Either a {@link MapMarker} or a {@link ILatLong} for the basis of translation.
     * @returns - A promise that when fullfilled contains a {@link IPoint}
     * with the pixel coordinates of the MapMarker or ILatLong relative to the map canvas.
     *
     * @memberof BingMarkerService
     */
    LocationToPoint(target) {
        if (target == null) {
            return Promise.resolve(null);
        }
        if (target instanceof MapMarkerDirective) {
            return this._markers.get(target).then((m) => {
                const l = m.Location;
                const p = this._mapService.LocationToPoint(l);
                return p;
            });
        }
        return this._mapService.LocationToPoint(target);
    }
    /**
     * Updates the anchor position for the marker.
     *
     * @param - The {@link MapMarker} object for which to upate the anchor.
     * Anchor information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the anchor position has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateAnchor(marker) {
        return this._markers.get(marker).then((m) => {
            m.SetAnchor(marker.Anchor);
        });
    }
    /**
     * Updates whether the marker is draggable.
     *
     * @param - The {@link MapMarker} object for which to upate dragability.
     * Dragability information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the marker has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateDraggable(marker) {
        return this._markers.get(marker).then((m) => m.SetDraggable(marker.Draggable));
    }
    /**
     * Updates the Icon on the marker.
     *
     * @param - The {@link MapMarker} object for which to upate the icon.
     * Icon information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the icon information has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateIcon(marker) {
        const payload = (m, icon, iconInfo) => {
            if (icon && icon !== '') {
                m.SetIcon(icon);
                marker.DynamicMarkerCreated.emit(iconInfo);
            }
        };
        return this._markers.get(marker).then((m) => {
            if (marker.IconInfo) {
                const s = Marker.CreateMarker(marker.IconInfo);
                if (typeof (s) === 'string') {
                    return (payload(m, s, marker.IconInfo));
                }
                else {
                    return s.then(x => {
                        return (payload(m, x.icon, x.iconInfo));
                    });
                }
            }
            else {
                return (m.SetIcon(marker.IconUrl));
            }
        });
    }
    /**
     * Updates the label on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the label.
     * Label information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the label has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateLabel(marker) {
        return this._markers.get(marker).then((m) => { m.SetLabel(marker.Label); });
    }
    /**
     * Updates the geo coordinates for the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the coordinates.
     * Coordinate information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the position has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateMarkerPosition(marker) {
        return this._markers.get(marker).then((m) => m.SetPosition({
            latitude: marker.Latitude,
            longitude: marker.Longitude
        }));
    }
    /**
     * Updates the title on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the title.
     * Title information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the title has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateTitle(marker) {
        return this._markers.get(marker).then((m) => m.SetTitle(marker.Title));
    }
    /**
     * Updates the visibility on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the visiblity.
     * Visibility information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the visibility has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateVisible(marker) {
        return this._markers.get(marker).then((m) => m.SetVisible(marker.Visible));
    }
}
BingMarkerService.decorators = [
    { type: Injectable }
];
BingMarkerService.ctorParameters = () => [
    { type: MapService },
    { type: LayerService },
    { type: ClusterService },
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1tYXJrZXIuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9zZXJ2aWNlcy9iaW5nL2JpbmctbWFya2VyLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDbkQsT0FBTyxFQUFFLFVBQVUsRUFBWSxPQUFPLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFLckQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFFakUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3hELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUM1RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDaEUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBRTdDLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRDs7OztHQUlHO0FBRUgsTUFBTSxPQUFPLGlCQUFpQjtJQU8xQixHQUFHO0lBQ0gsZUFBZTtJQUNmLEdBQUc7SUFFSDs7Ozs7Ozs7OztPQVVHO0lBQ0gsWUFBb0IsV0FBdUIsRUFDdkIsYUFBMkIsRUFDM0IsZUFBK0IsRUFDL0IsS0FBYTtRQUhiLGdCQUFXLEdBQVgsV0FBVyxDQUFZO1FBQ3ZCLGtCQUFhLEdBQWIsYUFBYSxDQUFjO1FBQzNCLG9CQUFlLEdBQWYsZUFBZSxDQUFnQjtRQUMvQixVQUFLLEdBQUwsS0FBSyxDQUFRO1FBdkJqQyxHQUFHO1FBQ0gsc0JBQXNCO1FBQ3RCLEdBQUc7UUFDSyxhQUFRLEdBQTZDLElBQUksR0FBRyxFQUF1QyxDQUFDO0lBcUI1RyxDQUFDO0lBRUQsR0FBRztJQUNILG1EQUFtRDtJQUNuRCxHQUFHO0lBRUg7Ozs7OztPQU1HO0lBQ0ksU0FBUyxDQUFDLE1B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QUFTLEVBQUUsTUFBTSxDQUFDLFNBQVM7U0FDOUIsQ0FBQyxDQUFDLENBQUM7SUFDWixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSSxXQUFXLENBQUMsTUFBMEI7UUFDekMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDbkYsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0ksYUFBYSxDQUFDLE1BQTBCO1FBQzNDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7OztZQTdVSixVQUFVOzs7WUFaRixVQUFVO1lBQ1YsWUFBWTtZQUNaLGNBQWM7WUFWRixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgSUxhdExvbmcgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lsYXRsb25nJztcbmltcG9ydCB7IElNYXJrZXJPcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbWFya2VyLW9wdGlvbnMnO1xuaW1wb3J0IHsgSU1hcmtlckljb25JbmZvIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbWFya2VyLWljb24taW5mbyc7XG5pbXBvcnQgeyBJUG9pbnQgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lwb2ludCc7XG5pbXBvcnQgeyBNYXBNYXJrZXJEaXJlY3RpdmUgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL21hcC1tYXJrZXInO1xuaW1wb3J0IHsgTWFya2VyU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL21hcmtlci5zZXJ2aWNlJztcbmltcG9ydCB7IE1hcFNlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBMYXllclNlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9sYXllci5zZXJ2aWNlJztcbmltcG9ydCB7IENsdXN0ZXJTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvY2x1c3Rlci5zZXJ2aWNlJztcbmltcG9ydCB7IE1hcmtlciB9IGZyb20gJy4uLy4uL21vZGVscy9tYXJrZXInO1xuaW1wb3J0IHsgQmluZ01hcFNlcnZpY2UgfSBmcm9tICcuL2JpbmctbWFwLnNlcnZpY2UnO1xuaW1wb3J0IHsgQmluZ0NvbnZlcnNpb25zIH0gZnJvbSAnLi9iaW5nLWNvbnZlcnNpb25zJztcblxuLyoqXG4gKiBDb25jcmV0ZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgTWFya2VyU2VydmljZSBhYnN0cmFjdCBjbGFzcyBmb3IgQmluZyBNYXBzIFY4LlxuICpcbiAqIEBleHBvcnRcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEJpbmdNYXJrZXJTZXJ2aWNlIGltcGxlbWVudHMgTWFya2VyU2VydmljZSB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfbWFya2VyczogTWFwPE1hcE1hcmtlckRpcmVjdGl2ZSwgUHJvbWlzZTxNYXJrZXI+PiA9IG5ldyBNYXA8TWFwTWFya2VyRGlyZWN0aXZlLCBQcm9taXNlPE1hcmtlcj4+KCk7XG5cbiAgICAvLy9cbiAgICAvLy8gQ29uc3RydWN0b3JcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgQmluZ01hcmtlclNlcnZpY2UuXG4gICAgICogQHBhcmFtIF9tYXBTZXJ2aWNlIC0ge0BsaW5rIE1hcFNlcnZpY2V9IGluc3RhbmNlLiBUaGUgY29uY3JldGUge0BsaW5rIEJpbmdNYXBTZXJ2aWNlfSBpbXBsZW1lbnRhdGlvbiBpcyBleHBlY3RlZC5cbiAgICAgKiBAcGFyYW0gX2xheWVyU2VydmljZSAtIHtAbGluayBMYXllclNlcnZpY2V9IGluc3RhbmNlLlxuICAgICAqIFRoZSBjb25jcmV0ZSB7QGxpbmsgQmluZ0xheWVyU2VydmljZX0gaW1wbGVtZW50YXRpb24gaXMgZXhwZWN0ZWQuXG4gICAgICogQHBhcmFtIF9jbHVzdGVyU2VydmljZSAtIHtAbGluayBDbHVzdGVyU2VydmljZX0gaW5zdGFuY2UuXG4gICAgICogVGhlIGNvbmNyZXRlIHtAbGluayBCaW5nQ2x1c3RlclNlcnZpY2V9IGltcGxlbWVudGF0aW9uIGlzIGV4cGVjdGVkLlxuICAgICAqIEBwYXJhbSBfem9uZSAtIE5nWm9uZSBpbnN0YW5jZSB0byBzdXBwb3J0IHpvbmUgYXdhcmUgcHJvbWlzZXMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcmtlclNlcnZpY2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9tYXBTZXJ2aWNlOiBNYXBTZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX2xheWVyU2VydmljZTogTGF5ZXJTZXJ2aWNlLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgX2NsdXN0ZXJTZXJ2aWNlOiBDbHVzdGVyU2VydmljZSxcbiAgICAgICAgICAgICAgICBwcml2YXRlIF96b25lOiBOZ1pvbmUpIHtcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHVibGljIG1lbWJlcnMgYW5kIE1hcmtlclNlcnZpY2UgaW1wbGVtZW50YXRpb25cbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBtYXJrZXIuIERlcGVuZGluZyBvbiB0aGUgbWFya2VyIGNvbnRleHQsIHRoZSBtYXJrZXIgd2lsbCBlaXRoZXIgYnkgYWRkZWQgdG8gdGhlIG1hcCBvciBhIGNvcnJlY3Nwb25kaW5nIGxheWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1hcmtlciAtIFRoZSB7QGxpbmsgTWFwTWFya2VyRGlyZWN0aXZlfSB0byBiZSBhZGRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFya2VyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBBZGRNYXJrZXIobWFya2VyOiBNYXBNYXJrZXJEaXJlY3RpdmUpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgbzogSU1hcmtlck9wdGlvbnMgPSB7XG4gICAgICAgICAgICBwb3NpdGlvbjogeyBsYXRpdHVkZTogbWFya2VyLkxhdGl0dWRlLCBsb25naXR1ZGU6IG1hcmtlci5Mb25naXR1ZGUgfSxcbiAgICAgICAgICAgIHRpdGxlOiBtYXJrZXIuVGl0bGUsXG4gICAgICAgICAgICBsYWJlbDogbWFya2VyLkxhYmVsLFxuICAgICAgICAgICAgZHJhZ2dhYmxlOiBtYXJrZXIuRHJhZ2dhYmxlLFxuICAgICAgICAgICAgaWNvbjogbWFya2VyLkljb25VcmwsXG4gICAgICAgICAgICBpY29uSW5mbzogbWFya2VyLkljb25JbmZvLFxuICAgICAgICAgICAgaXNGaXJzdDogbWFya2VyLklzRmlyc3RJblNldCxcbiAgICAgICAgICAgIGlzTGFzdDogbWFya2VyLklzTGFzdEluU2V0XG4gICAgICAgIH07XG4gICAgICAgIGlmIChtYXJrZXIuV2lkdGgpIHsgby53aWR0aCA9IG1hcmtlci5XaWR0aDsgfVxuICAgICAgICBpZiAobWFya2VyLkhlaWdodCkgeyBvLmhlaWdodCA9IG1hcmtlci5IZWlnaHQ7IH1cbiAgICAgICAgaWYgKG1hcmtlci5BbmNob3IpIHsgby5hbmNob3IgPSBtYXJrZXIuQW5jaG9yOyB9XG4gICAgICAgIGlmIChtYXJrZXIuTWV0YWRhdGEpIHsgby5tZXRhZGF0YSA9IG1hcmtlci5NZXRhZGF0YTsgfVxuXG4gICAgICAgIC8vIGNyZWF0ZSBtYXJrZXIgdmlhIHByb21pc2UuXG4gICAgICAgIGxldCBtYXJrZXJQcm9taXNlOiBQcm9taXNlPE1hcmtlcj4gPSBudWxsO1xuICAgICAgICBpZiAobWFya2VyLkluQ2x1c3RlckxheWVyKSB7XG4gICAgICAgICAgICBtYXJrZXJQcm9taXNlID0gdGhpcy5fY2x1c3RlclNlcnZpY2UuQ3JlYXRlTWFya2VyKG1hcmtlci5MYXllcklkLCBvKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChtYXJrZXIuSW5DdXN0b21MYXllcikge1xuICAgICAgICAgICAgbWFya2VyUHJvbWlzZSA9IHRoaXMuX2xheWVyU2VydmljZS5DcmVhdGVNYXJrZXIobWFya2VyLkxheWVySWQsIG8pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbWFya2VyUHJvbWlzZSA9IHRoaXMuX21hcFNlcnZpY2UuQ3JlYXRlTWFya2VyKG8pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fbWFya2Vycy5zZXQobWFya2VyLCBtYXJrZXJQcm9taXNlKTtcbiAgICAgICAgaWYgKG1hcmtlci5JY29uSW5mbykge1xuICAgICAgICAgICAgbWFya2VyUHJvbWlzZS50aGVuKChtOiBNYXJrZXIpID0+IHtcbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgaWNvbkluZm8gdG8gcHJvdmlkZSBob29rIHRvIGRvIHBvc3QgaWNvbiBjcmVhdGlvbiBhY3Rpdml0aWVzIGFuZFxuICAgICAgICAgICAgICAgIC8vIGFsc28gcmUtYW5jaG9yIHRoZSBtYXJrZXJcbiAgICAgICAgICAgICAgICBtYXJrZXIuRHluYW1pY01hcmtlckNyZWF0ZWQuZW1pdChvLmljb25JbmZvKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwOiBJUG9pbnQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHg6IChvLmljb25JbmZvLnNpemUgJiYgby5pY29uSW5mby5tYXJrZXJPZmZzZXRSYXRpbykgPyAoby5pY29uSW5mby5zaXplLndpZHRoICogby5pY29uSW5mby5tYXJrZXJPZmZzZXRSYXRpby54KSA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IChvLmljb25JbmZvLnNpemUgJiYgby5pY29uSW5mby5tYXJrZXJPZmZzZXRSYXRpbykgPyAoby5pY29uSW5mby5zaXplLmhlaWdodCAqIG8uaWNvbkluZm8ubWFya2VyT2Zmc2V0UmF0aW8ueSkgOiAwLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgbS5TZXRBbmNob3IocCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBhbiBldmVudCBkZWxlZ2F0ZSBmb3IgYSBtYXJrZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXZlbnROYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlZ2lzdGVyIChlLmcuICdjbGljaycpXG4gICAgICogQHBhcmFtIG1hcmtlciAtIFRoZSB7QGxpbmsgTWFwTWFya2VyfSBmb3Igd2hpY2ggdG8gcmVnaXN0ZXIgdGhlIGV2ZW50LlxuICAgICAqIEByZXR1cm5zIC0gT2JzZXJ2YWJsZSBlbWl0aW5nIGFuIGluc3RhbmNlIG9mIFQgZWFjaCB0aW1lIHRoZSBldmVudCBvY2N1cnMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcmtlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlRXZlbnRPYnNlcnZhYmxlPFQ+KGV2ZW50TmFtZTogc3RyaW5nLCBtYXJrZXI6IE1hcE1hcmtlckRpcmVjdGl2ZSk6IE9ic2VydmFibGU8VD4ge1xuICAgICAgICBjb25zdCBiOiBTdWJqZWN0PFQ+ID0gbmV3IFN1YmplY3Q8VD4oKTtcbiAgICAgICAgaWYgKGV2ZW50TmFtZSA9PT0gJ21vdXNlbW92ZScpIHtcbiAgICAgICAgICAgIHJldHVybiBiLmFzT2JzZXJ2YWJsZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudE5hbWUgPT09ICdyaWdodGNsaWNrJykge1xuICAgICAgICAgICAgcmV0dXJuIGIuYXNPYnNlcnZhYmxlKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8vXG4gICAgICAgIC8vLyBtb3VzZW1vdmUgYW5kIHJpZ2h0Y2xpY2sgYXJlIG5vdCBzdXBwb3J0ZWQgYnkgYmluZyBwb2x5Z29ucy5cbiAgICAgICAgLy8vXG5cblxuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoKG9ic2VydmVyOiBPYnNlcnZlcjxUPikgPT4ge1xuICAgICAgICAgICAgdGhpcy5fbWFya2Vycy5nZXQobWFya2VyKS50aGVuKChtOiBNYXJrZXIpID0+IHtcbiAgICAgICAgICAgICAgICBtLkFkZExpc3RlbmVyKGV2ZW50TmFtZSwgKGU6IFQpID0+IHRoaXMuX3pvbmUucnVuKCgpID0+XG4gICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLm5leHQoZSkpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVzIGEgbWFya2VyLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1hcmtlciAtIHtAbGluayBNYXBNYXJrZXJ9IHRvIGJlIGRlbGV0ZWQuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgZnVsbGZpbGxlZCBvbmNlIHRoZSBtYXJrZXIgaGFzIGJlZW4gZGVsZXRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFya2VyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBEZWxldGVNYXJrZXIobWFya2VyOiBNYXBNYXJrZXJEaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgbSA9IHRoaXMuX21hcmtlcnMuZ2V0KG1hcmtlcik7XG4gICAgICAgIGxldCBwOiBQcm9taXNlPHZvaWQ+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIGlmIChtICE9IG51bGwpIHtcbiAgICAgICAgICAgIHAgPSBtLnRoZW4oKG1hOiBNYXJrZXIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VyLkluQ2x1c3RlckxheWVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NsdXN0ZXJTZXJ2aWNlLkdldE5hdGl2ZUxheWVyKG1hcmtlci5MYXllcklkKS50aGVuKGwgPT4geyBsLlJlbW92ZUVudGl0eShtYSk7IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobWFya2VyLkluQ3VzdG9tTGF5ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGF5ZXJTZXJ2aWNlLkdldE5hdGl2ZUxheWVyKG1hcmtlci5MYXllcklkKS50aGVuKGwgPT4geyBsLlJlbW92ZUVudGl0eShtYSk7IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBtYS5EZWxldGVNYXJrZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFya2Vycy5kZWxldGUobWFya2VyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9idGFpbnMgZ2VvIGNvb3JkaW5hdGVzIGZvciB0aGUgbWFya2VyIG9uIHRoZSBjbGljayBsb2NhdGlvblxuICAgICAqXG4gICAgICogQHBhcmFtIGUgLSBUaGUgbW91c2UgZXZlbnQuXG4gICAgICogQHJldHVybnMgLSB7QGxpbmsgSUxhdExvbmd9IGNvbnRhaW5pbmcgdGhlIGdlbyBjb29yZGluYXRlcyBvZiB0aGUgY2xpY2tlZCBtYXJrZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcmtlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0Q29vcmRpbmF0ZXNGcm9tQ2xpY2soZTogTW91c2VFdmVudCB8IGFueSk6IElMYXRMb25nIHtcbiAgICAgICAgaWYgKCFlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWUucHJpbWl0aXZlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIShlLnByaW1pdGl2ZSBpbnN0YW5jZW9mIE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4pKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwOiBNaWNyb3NvZnQuTWFwcy5QdXNocGluID0gZS5wcmltaXRpdmU7XG4gICAgICAgIGNvbnN0IGxvYzogTWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24gPSBwLmdldExvY2F0aW9uKCk7XG4gICAgICAgIHJldHVybiB7IGxhdGl0dWRlOiBsb2MubGF0aXR1ZGUsIGxvbmdpdHVkZTogbG9jLmxvbmdpdHVkZSB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9idGFpbnMgdGhlIG1hcmtlciBtb2RlbCBmb3IgdGhlIG1hcmtlciBhbGxvd2luZyBhY2Nlc3MgdG8gbmF0aXZlIGltcGxlbWVudGF0aW9uIGZ1bmN0aW9uYXRpbGl5LlxuICAgICAqXG4gICAgICogQHBhcmFtIG1hcmtlciAtIFRoZSB7QGxpbmsgTWFwTWFya2VyfSBmb3Igd2hpY2ggdG8gb2J0YWluIHRoZSBtYXJrZXIgbW9kZWwuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIHtAbGluayBNYXJrZXJ9IGltcGxlbWVudGF0aW9uIG9mIHRoZSB1bmRlcmx5aW5nIHBsYXRmb3JtLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXJrZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIEdldE5hdGl2ZU1hcmtlcihtYXJrZXI6IE1hcE1hcmtlckRpcmVjdGl2ZSk6IFByb21pc2U8TWFya2VyPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXJrZXJzLmdldChtYXJrZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9idGFpbnMgdGhlIG1hcmtlciBwaXhlbCBsb2NhdGlvbiBmb3IgdGhlIG1hcmtlciBvbiB0aGUgY2xpY2sgbG9jYXRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlIC0gVGhlIG1vdXNlIGV2ZW50LlxuICAgICAqIEByZXR1cm5zIC0ge0BsaW5rIElMYXRMb25nfSBjb250YWluaW5nIHRoZSBwaXhlbHMgb2YgdGhlIG1hcmtlciBvbiB0aGUgbWFwIGNhbnZhcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFya2VyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRQaXhlbHNGcm9tQ2xpY2soZTogTW91c2VFdmVudCB8IGFueSk6IElQb2ludCB7XG4gICAgICAgIGNvbnN0IGxvYzogSUxhdExvbmcgPSB0aGlzLkdldENvb3JkaW5hdGVzRnJvbUNsaWNrKGUpO1xuICAgICAgICBpZiAobG9jID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGw6IE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uID0gQmluZ0NvbnZlcnNpb25zLlRyYW5zbGF0ZUxvY2F0aW9uKGxvYyk7XG4gICAgICAgIGNvbnN0IHA6IE1pY3Jvc29mdC5NYXBzLlBvaW50ID0gPE1pY3Jvc29mdC5NYXBzLlBvaW50Pig8QmluZ01hcFNlcnZpY2U+XG4gICAgICAgICAgICB0aGlzLl9tYXBTZXJ2aWNlKS5NYXBJbnN0YW5jZS50cnlMb2NhdGlvblRvUGl4ZWwobCwgTWljcm9zb2Z0Lk1hcHMuUGl4ZWxSZWZlcmVuY2UuY29udHJvbCk7XG4gICAgICAgIGlmIChwID09IG51bGwpIHsgcmV0dXJuIG51bGw7IH1cbiAgICAgICAgcmV0dXJuIHsgeDogcC54LCB5OiBwLnkgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBhIGdlbyBsb2NhdGlvbiB0byBhIHBpeGVsIGxvY2F0aW9uIHJlbGF0aXZlIHRvIHRoZSBtYXAgY2FudmFzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRhcmdldCAtIEVpdGhlciBhIHtAbGluayBNYXBNYXJrZXJ9IG9yIGEge0BsaW5rIElMYXRMb25nfSBmb3IgdGhlIGJhc2lzIG9mIHRyYW5zbGF0aW9uLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiBmdWxsZmlsbGVkIGNvbnRhaW5zIGEge0BsaW5rIElQb2ludH1cbiAgICAgKiB3aXRoIHRoZSBwaXhlbCBjb29yZGluYXRlcyBvZiB0aGUgTWFwTWFya2VyIG9yIElMYXRMb25nIHJlbGF0aXZlIHRvIHRoZSBtYXAgY2FudmFzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXJrZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIExvY2F0aW9uVG9Qb2ludCh0YXJnZXQ6IE1hcE1hcmtlckRpcmVjdGl2ZSB8IElMYXRMb25nKTogUHJvbWlzZTxJUG9pbnQ+IHtcbiAgICAgICAgaWYgKHRhcmdldCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBNYXBNYXJrZXJEaXJlY3RpdmUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYXJrZXJzLmdldCh0YXJnZXQpLnRoZW4oKG06IE1hcmtlcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGw6IElMYXRMb25nID0gbS5Mb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBjb25zdCBwOiBQcm9taXNlPElQb2ludD4gPSB0aGlzLl9tYXBTZXJ2aWNlLkxvY2F0aW9uVG9Qb2ludChsKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXBTZXJ2aWNlLkxvY2F0aW9uVG9Qb2ludCh0YXJnZXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGFuY2hvciBwb3NpdGlvbiBmb3IgdGhlIG1hcmtlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSAtIFRoZSB7QGxpbmsgTWFwTWFya2VyfSBvYmplY3QgZm9yIHdoaWNoIHRvIHVwYXRlIHRoZSBhbmNob3IuXG4gICAgICogQW5jaG9yIGluZm9ybWF0aW9uIGlzIHByZXNlbnQgaW4gdGhlIHVuZGVybHlpbmcge0BsaW5rIE1hcmtlcn0gbW9kZWwgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgaXMgZnVsbGZpbGxlZCB3aGVuIHRoZSBhbmNob3IgcG9zaXRpb24gaGFzIGJlZW4gdXBkYXRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFya2VyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBVcGRhdGVBbmNob3IobWFya2VyOiBNYXBNYXJrZXJEaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlcnMuZ2V0KG1hcmtlcikudGhlbigobTogTWFya2VyKSA9PiB7XG4gICAgICAgICAgICBtLlNldEFuY2hvcihtYXJrZXIuQW5jaG9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB3aGV0aGVyIHRoZSBtYXJrZXIgaXMgZHJhZ2dhYmxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIC0gVGhlIHtAbGluayBNYXBNYXJrZXJ9IG9iamVjdCBmb3Igd2hpY2ggdG8gdXBhdGUgZHJhZ2FiaWxpdHkuXG4gICAgICogRHJhZ2FiaWxpdHkgaW5mb3JtYXRpb24gaXMgcHJlc2VudCBpbiB0aGUgdW5kZXJseWluZyB7QGxpbmsgTWFya2VyfSBtb2RlbCBvYmplY3QuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCBpcyBmdWxsZmlsbGVkIHdoZW4gdGhlIG1hcmtlciBoYXMgYmVlbiB1cGRhdGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXJrZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFVwZGF0ZURyYWdnYWJsZShtYXJrZXI6IE1hcE1hcmtlckRpcmVjdGl2ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2Vycy5nZXQobWFya2VyKS50aGVuKChtOiBNYXJrZXIpID0+IG0uU2V0RHJhZ2dhYmxlKG1hcmtlci5EcmFnZ2FibGUpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBJY29uIG9uIHRoZSBtYXJrZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gLSBUaGUge0BsaW5rIE1hcE1hcmtlcn0gb2JqZWN0IGZvciB3aGljaCB0byB1cGF0ZSB0aGUgaWNvbi5cbiAgICAgKiBJY29uIGluZm9ybWF0aW9uIGlzIHByZXNlbnQgaW4gdGhlIHVuZGVybHlpbmcge0BsaW5rIE1hcmtlcn0gbW9kZWwgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgaXMgZnVsbGZpbGxlZCB3aGVuIHRoZSBpY29uIGluZm9ybWF0aW9uIGhhcyBiZWVuIHVwZGF0ZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcmtlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgVXBkYXRlSWNvbihtYXJrZXI6IE1hcE1hcmtlckRpcmVjdGl2ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBwYXlsb2FkID0gKG06IE1hcmtlciwgaWNvbjogc3RyaW5nLCBpY29uSW5mbzogSU1hcmtlckljb25JbmZvKSA9PiB7XG4gICAgICAgICAgICBpZiAoaWNvbiAmJiBpY29uICE9PSAnJykge1xuICAgICAgICAgICAgICAgIG0uU2V0SWNvbihpY29uKTtcbiAgICAgICAgICAgICAgICBtYXJrZXIuRHluYW1pY01hcmtlckNyZWF0ZWQuZW1pdChpY29uSW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXJrZXJzLmdldChtYXJrZXIpLnRoZW4oKG06IE1hcmtlcikgPT4ge1xuICAgICAgICAgICAgaWYgKG1hcmtlci5JY29uSW5mbykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBNYXJrZXIuQ3JlYXRlTWFya2VyKG1hcmtlci5JY29uSW5mbyk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZihzKSA9PT0gJ3N0cmluZycpIHsgcmV0dXJuKHBheWxvYWQobSwgcywgbWFya2VyLkljb25JbmZvKSk7IH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHMudGhlbih4ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybihwYXlsb2FkKG0sIHguaWNvbiwgeC5pY29uSW5mbykpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4obS5TZXRJY29uKG1hcmtlci5JY29uVXJsKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGxhYmVsIG9uIHRoZSBtYXJrZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gLSBUaGUge0BsaW5rIE1hcE1hcmtlckRpcmVjdGl2ZX0gb2JqZWN0IGZvciB3aGljaCB0byB1cGF0ZSB0aGUgbGFiZWwuXG4gICAgICogTGFiZWwgaW5mb3JtYXRpb24gaXMgcHJlc2VudCBpbiB0aGUgdW5kZXJseWluZyB7QGxpbmsgTWFya2VyfSBtb2RlbCBvYmplY3QuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCBpcyBmdWxsZmlsbGVkIHdoZW4gdGhlIGxhYmVsIGhhcyBiZWVuIHVwZGF0ZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcmtlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgVXBkYXRlTGFiZWwobWFya2VyOiBNYXBNYXJrZXJEaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlcnMuZ2V0KG1hcmtlcikudGhlbigobTogTWFya2VyKSA9PiB7IG0uU2V0TGFiZWwobWFya2VyLkxhYmVsKTsgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgZ2VvIGNvb3JkaW5hdGVzIGZvciB0aGUgbWFya2VyLlxuICAgICAqXG4gICAgICogQHBhcmFtIC0gVGhlIHtAbGluayBNYXBNYXJrZXJEaXJlY3RpdmV9IG9iamVjdCBmb3Igd2hpY2ggdG8gdXBhdGUgdGhlIGNvb3JkaW5hdGVzLlxuICAgICAqIENvb3JkaW5hdGUgaW5mb3JtYXRpb24gaXMgcHJlc2VudCBpbiB0aGUgdW5kZXJseWluZyB7QGxpbmsgTWFya2VyfSBtb2RlbCBvYmplY3QuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCBpcyBmdWxsZmlsbGVkIHdoZW4gdGhlIHBvc2l0aW9uIGhhcyBiZWVuIHVwZGF0ZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcmtlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgVXBkYXRlTWFya2VyUG9zaXRpb24obWFya2VyOiBNYXBNYXJrZXJEaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlcnMuZ2V0KG1hcmtlcikudGhlbihcbiAgICAgICAgICAgIChtOiBNYXJrZXIpID0+IG0uU2V0UG9zaXRpb24oe1xuICAgICAgICAgICAgICAgIGxhdGl0dWRlOiBtYXJrZXIuTGF0aXR1ZGUsXG4gICAgICAgICAgICAgICAgbG9uZ2l0dWRlOiBtYXJrZXIuTG9uZ2l0dWRlXG4gICAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgdGl0bGUgb24gdGhlIG1hcmtlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSAtIFRoZSB7QGxpbmsgTWFwTWFya2VyRGlyZWN0aXZlfSBvYmplY3QgZm9yIHdoaWNoIHRvIHVwYXRlIHRoZSB0aXRsZS5cbiAgICAgKiBUaXRsZSBpbmZvcm1hdGlvbiBpcyBwcmVzZW50IGluIHRoZSB1bmRlcmx5aW5nIHtAbGluayBNYXJrZXJ9IG1vZGVsIG9iamVjdC5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IGlzIGZ1bGxmaWxsZWQgd2hlbiB0aGUgdGl0bGUgaGFzIGJlZW4gdXBkYXRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFya2VyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBVcGRhdGVUaXRsZShtYXJrZXI6IE1hcE1hcmtlckRpcmVjdGl2ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2Vycy5nZXQobWFya2VyKS50aGVuKChtOiBNYXJrZXIpID0+IG0uU2V0VGl0bGUobWFya2VyLlRpdGxlKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgdmlzaWJpbGl0eSBvbiB0aGUgbWFya2VyLlxuICAgICAqXG4gICAgICogQHBhcmFtIC0gVGhlIHtAbGluayBNYXBNYXJrZXJEaXJlY3RpdmV9IG9iamVjdCBmb3Igd2hpY2ggdG8gdXBhdGUgdGhlIHZpc2libGl0eS5cbiAgICAgKiBWaXNpYmlsaXR5IGluZm9ybWF0aW9uIGlzIHByZXNlbnQgaW4gdGhlIHVuZGVybHlpbmcge0BsaW5rIE1hcmtlcn0gbW9kZWwgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgaXMgZnVsbGZpbGxlZCB3aGVuIHRoZSB2aXNpYmlsaXR5IGhhcyBiZWVuIHVwZGF0ZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcmtlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgVXBkYXRlVmlzaWJsZShtYXJrZXI6IE1hcE1hcmtlckRpcmVjdGl2ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2Vycy5nZXQobWFya2VyKS50aGVuKChtOiBNYXJrZXIpID0+IG0uU2V0VmlzaWJsZShtYXJrZXIuVmlzaWJsZSkpO1xuICAgIH1cbn1cbiJdfQ==