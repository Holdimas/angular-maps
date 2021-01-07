import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MapService } from '../map.service';
import { LayerService } from '../layer.service';
/**
 * Concrete implementation of the Polyline Service abstract class for Bing Maps V8.
 *
 * @export
 */
export class BingPolylineService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingPolylineService.
     * @param _mapService - {@link MapService} instance. The concrete {@link BingMapService} implementation is expected.
     * @param _layerService - {@link LayerService} instance.
     * The concrete {@link BingLayerService} implementation is expected.
     * @param _zone - NgZone instance to support zone aware promises.
     *
     * @memberof BingPolylineService
     */
    constructor(_mapService, _layerService, _zone) {
        this._mapService = _mapService;
        this._layerService = _layerService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._polylines = new Map();
    }
    ///
    /// Public members and MarkerService implementation
    ///
    /**
     * Adds a polyline to a map. Depending on the polyline context, the polyline will either by added to the map or a
     * corresponding layer.
     *
     * @param polyline - The {@link MapPolylineDirective} to be added.
     *
     * @memberof BingPolylineService
     */
    AddPolyline(polyline) {
        const o = {
            id: polyline.Id,
            clickable: polyline.Clickable,
            draggable: polyline.Draggable,
            editable: polyline.Editable,
            geodesic: polyline.Geodesic,
            path: polyline.Path,
            showTooltip: polyline.ShowTooltip,
            strokeColor: polyline.StrokeColor,
            strokeOpacity: polyline.StrokeOpacity,
            strokeWeight: polyline.StrokeWeight,
            title: polyline.Title,
            visible: polyline.Visible,
            zIndex: polyline.zIndex,
        };
        let polylinePromise;
        if (polyline.InCustomLayer) {
            polylinePromise = this._layerService.CreatePolyline(polyline.LayerId, o);
        }
        else {
            polylinePromise = this._mapService.CreatePolyline(o);
        }
        this._polylines.set(polyline, polylinePromise);
    }
    /**
      * Registers an event delegate for a line.
      *
      * @param eventName - The name of the event to register (e.g. 'click')
      * @param polyline - The {@link MapPolylineDirective} for which to register the event.
      * @returns - Observable emiting an instance of T each time the event occurs.
      *
      * @memberof BingPolylineService
      */
    CreateEventObservable(eventName, polyline) {
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
            this._polylines.get(polyline).then(p => {
                const x = Array.isArray(p) ? p : [p];
                x.forEach(line => line.AddListener(eventName, (e) => this._zone.run(() => observer.next(e))));
            });
        });
    }
    /**
      * Deletes a polyline.
      *
      * @param polyline - {@link MapPolylineDirective} to be deleted.
      * @returns - A promise fullfilled once the polyline has been deleted.
      *
      * @memberof BingPolylineService
      */
    DeletePolyline(polyline) {
        const m = this._polylines.get(polyline);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then((l) => {
            return this._zone.run(() => {
                const x = Array.isArray(l) ? l : [l];
                x.forEach(line => line.Delete());
                this._polylines.delete(polyline);
            });
        });
    }
    /**
     * Obtains geo coordinates for the marker on the click location
     *
     * @abstract
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     *
     * @memberof BingPolylineService
     */
    GetCoordinatesFromClick(e) {
        if (!e) {
            return null;
        }
        if (!e.location) {
            return null;
        }
        return { latitude: e.location.latitude, longitude: e.location.longitude };
    }
    /**
     * Obtains the marker model for the marker allowing access to native implementation functionatiliy.
     *
     * @param polyline - The {@link MapPolylineDirective} for which to obtain the polyline model.
     * @returns - A promise that when fullfilled contains the {@link Polyline}
     * implementation of the underlying platform. For complex paths, returns an array of polylines.
     *
     * @memberof BingPolylineService
     */
    GetNativePolyline(polyline) {
        return this._polylines.get(polyline);
    }
    /**
     * Set the polyline options.
     *
     * @param polyline - {@link MapPolylineDirective} to be updated.
     * @param options - {@link IPolylineOptions} object containing the options. Options will be merged with the
     * options already on the underlying object.
     * @returns - A promise fullfilled once the polyline options have been set.
     *
     * @memberof BingPolylineService
     */
    SetOptions(polyline, options) {
        return this._polylines.get(polyline).then(l => {
            const x = Array.isArray(l) ? l : [l];
            x.forEach(line => line.SetOptions(options));
        });
    }
    /**
     * Updates the Polyline path
     *
     * @param polyline - {@link MapPolylineDirective} to be updated.
     * @returns - A promise fullfilled once the polyline has been updated.
     *
     * @memberof BingPolylineService
     */
    UpdatePolyline(polyline) {
        const m = this._polylines.get(polyline);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then(l => this._zone.run(() => {
            const x = Array.isArray(l) ? l : [l];
            const p = polyline.Path.length > 0 && Array.isArray(polyline.Path[0]) ? polyline.Path :
                [polyline.Path];
            x.forEach((line, index) => {
                if (p.length > index) {
                    line.SetPath(p[index]);
                }
            });
            if (Array.isArray(l) && l.length > p.length) {
                l.splice(p.length - 1).forEach(line => line.Delete());
            }
        }));
    }
}
BingPolylineService.decorators = [
    { type: Injectable }
];
BingPolylineService.ctorParameters = () => [
    { type: MapService },
    { type: LayerService },
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1wb2x5bGluZS5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL3NlcnZpY2VzL2JpbmcvYmluZy1wb2x5bGluZS5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ25ELE9BQU8sRUFBRSxVQUFVLEVBQVksT0FBTyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBTXJELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFFaEQ7Ozs7R0FJRztBQUVILE1BQU0sT0FBTyxtQkFBbUI7SUFRNUIsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7Ozs7Ozs7O09BUUc7SUFDSCxZQUFvQixXQUF1QixFQUMvQixhQUEyQixFQUMzQixLQUFhO1FBRkwsZ0JBQVcsR0FBWCxXQUFXLENBQVk7UUFDL0Isa0JBQWEsR0FBYixhQUFhLENBQWM7UUFDM0IsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQXJCekIsR0FBRztRQUNILHNCQUFzQjtRQUN0QixHQUFHO1FBQ0ssZUFBVSxHQUNsQixJQUFJLEdBQUcsRUFBMkQsQ0FBQztJQWtCbkUsQ0FBQztJQUVELEdBQUc7SUFDSCxtREFBbUQ7SUFDbkQsR0FBRztJQUVIOzs7Ozs7O09BT0c7SUFDSSxXQUFXLENBQUMsUUFBOEI7UUFDN0MsTUFBTSxDQUFDLEdBQXFCO1lBQ3hCLEVBQUUsRUFBRSxRQUFRLENBQUMsRUFBRTtZQUNmLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUztZQUM3QixTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVM7WUFDN0IsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRO1lBQzNCLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUTtZQUMzQixJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7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c0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgSVBvbHlsaW5lT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaXBvbHlsaW5lLW9wdGlvbnMnO1xuaW1wb3J0IHsgSUxhdExvbmcgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lsYXRsb25nJztcbmltcG9ydCB7IFBvbHlsaW5lIH0gZnJvbSAnLi4vLi4vbW9kZWxzL3BvbHlsaW5lJztcbmltcG9ydCB7IE1hcFBvbHlsaW5lRGlyZWN0aXZlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9tYXAtcG9seWxpbmUnO1xuaW1wb3J0IHsgUG9seWxpbmVTZXJ2aWNlIH0gZnJvbSAnLi4vcG9seWxpbmUuc2VydmljZSc7XG5pbXBvcnQgeyBNYXBTZXJ2aWNlIH0gZnJvbSAnLi4vbWFwLnNlcnZpY2UnO1xuaW1wb3J0IHsgTGF5ZXJTZXJ2aWNlIH0gZnJvbSAnLi4vbGF5ZXIuc2VydmljZSc7XG5cbi8qKlxuICogQ29uY3JldGUgaW1wbGVtZW50YXRpb24gb2YgdGhlIFBvbHlsaW5lIFNlcnZpY2UgYWJzdHJhY3QgY2xhc3MgZm9yIEJpbmcgTWFwcyBWOC5cbiAqXG4gKiBAZXhwb3J0XG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBCaW5nUG9seWxpbmVTZXJ2aWNlIGltcGxlbWVudHMgUG9seWxpbmVTZXJ2aWNlIHtcblxuICAgIC8vL1xuICAgIC8vLyBGaWVsZCBkZWNsYXJhdGlvbnNcbiAgICAvLy9cbiAgICBwcml2YXRlIF9wb2x5bGluZXM6IE1hcDxNYXBQb2x5bGluZURpcmVjdGl2ZSwgUHJvbWlzZTxQb2x5bGluZXxBcnJheTxQb2x5bGluZT4+PiA9XG4gICAgbmV3IE1hcDxNYXBQb2x5bGluZURpcmVjdGl2ZSwgUHJvbWlzZTxQb2x5bGluZXxBcnJheTxQb2x5bGluZT4+PigpO1xuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIEJpbmdQb2x5bGluZVNlcnZpY2UuXG4gICAgICogQHBhcmFtIF9tYXBTZXJ2aWNlIC0ge0BsaW5rIE1hcFNlcnZpY2V9IGluc3RhbmNlLiBUaGUgY29uY3JldGUge0BsaW5rIEJpbmdNYXBTZXJ2aWNlfSBpbXBsZW1lbnRhdGlvbiBpcyBleHBlY3RlZC5cbiAgICAgKiBAcGFyYW0gX2xheWVyU2VydmljZSAtIHtAbGluayBMYXllclNlcnZpY2V9IGluc3RhbmNlLlxuICAgICAqIFRoZSBjb25jcmV0ZSB7QGxpbmsgQmluZ0xheWVyU2VydmljZX0gaW1wbGVtZW50YXRpb24gaXMgZXhwZWN0ZWQuXG4gICAgICogQHBhcmFtIF96b25lIC0gTmdab25lIGluc3RhbmNlIHRvIHN1cHBvcnQgem9uZSBhd2FyZSBwcm9taXNlcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWxpbmVTZXJ2aWNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbWFwU2VydmljZTogTWFwU2VydmljZSxcbiAgICAgICAgcHJpdmF0ZSBfbGF5ZXJTZXJ2aWNlOiBMYXllclNlcnZpY2UsXG4gICAgICAgIHByaXZhdGUgX3pvbmU6IE5nWm9uZSkge1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQdWJsaWMgbWVtYmVycyBhbmQgTWFya2VyU2VydmljZSBpbXBsZW1lbnRhdGlvblxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIHBvbHlsaW5lIHRvIGEgbWFwLiBEZXBlbmRpbmcgb24gdGhlIHBvbHlsaW5lIGNvbnRleHQsIHRoZSBwb2x5bGluZSB3aWxsIGVpdGhlciBieSBhZGRlZCB0byB0aGUgbWFwIG9yIGFcbiAgICAgKiBjb3JyZXNwb25kaW5nIGxheWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHBvbHlsaW5lIC0gVGhlIHtAbGluayBNYXBQb2x5bGluZURpcmVjdGl2ZX0gdG8gYmUgYWRkZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ1BvbHlsaW5lU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBBZGRQb2x5bGluZShwb2x5bGluZTogTWFwUG9seWxpbmVEaXJlY3RpdmUpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgbzogSVBvbHlsaW5lT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGlkOiBwb2x5bGluZS5JZCxcbiAgICAgICAgICAgIGNsaWNrYWJsZTogcG9seWxpbmUuQ2xpY2thYmxlLFxuICAgICAgICAgICAgZHJhZ2dhYmxlOiBwb2x5bGluZS5EcmFnZ2FibGUsXG4gICAgICAgICAgICBlZGl0YWJsZTogcG9seWxpbmUuRWRpdGFibGUsXG4gICAgICAgICAgICBnZW9kZXNpYzogcG9seWxpbmUuR2VvZGVzaWMsXG4gICAgICAgICAgICBwYXRoOiBwb2x5bGluZS5QYXRoLFxuICAgICAgICAgICAgc2hvd1Rvb2x0aXA6IHBvbHlsaW5lLlNob3dUb29sdGlwLFxuICAgICAgICAgICAgc3Ryb2tlQ29sb3I6IHBvbHlsaW5lLlN0cm9rZUNvbG9yLFxuICAgICAgICAgICAgc3Ryb2tlT3BhY2l0eTogcG9seWxpbmUuU3Ryb2tlT3BhY2l0eSxcbiAgICAgICAgICAgIHN0cm9rZVdlaWdodDogcG9seWxpbmUuU3Ryb2tlV2VpZ2h0LFxuICAgICAgICAgICAgdGl0bGU6IHBvbHlsaW5lLlRpdGxlLFxuICAgICAgICAgICAgdmlzaWJsZTogcG9seWxpbmUuVmlzaWJsZSxcbiAgICAgICAgICAgIHpJbmRleDogcG9seWxpbmUuekluZGV4LFxuICAgICAgICB9O1xuICAgICAgICBsZXQgcG9seWxpbmVQcm9taXNlOiBQcm9taXNlPFBvbHlsaW5lfEFycmF5PFBvbHlsaW5lPj47XG4gICAgICAgIGlmIChwb2x5bGluZS5JbkN1c3RvbUxheWVyKSB7XG4gICAgICAgICAgICBwb2x5bGluZVByb21pc2UgPSB0aGlzLl9sYXllclNlcnZpY2UuQ3JlYXRlUG9seWxpbmUocG9seWxpbmUuTGF5ZXJJZCwgbyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwb2x5bGluZVByb21pc2UgPSB0aGlzLl9tYXBTZXJ2aWNlLkNyZWF0ZVBvbHlsaW5lKG8pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BvbHlsaW5lcy5zZXQocG9seWxpbmUsIHBvbHlsaW5lUHJvbWlzZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICAqIFJlZ2lzdGVycyBhbiBldmVudCBkZWxlZ2F0ZSBmb3IgYSBsaW5lLlxuICAgICAgKlxuICAgICAgKiBAcGFyYW0gZXZlbnROYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlZ2lzdGVyIChlLmcuICdjbGljaycpXG4gICAgICAqIEBwYXJhbSBwb2x5bGluZSAtIFRoZSB7QGxpbmsgTWFwUG9seWxpbmVEaXJlY3RpdmV9IGZvciB3aGljaCB0byByZWdpc3RlciB0aGUgZXZlbnQuXG4gICAgICAqIEByZXR1cm5zIC0gT2JzZXJ2YWJsZSBlbWl0aW5nIGFuIGluc3RhbmNlIG9mIFQgZWFjaCB0aW1lIHRoZSBldmVudCBvY2N1cnMuXG4gICAgICAqXG4gICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWxpbmVTZXJ2aWNlXG4gICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVFdmVudE9ic2VydmFibGU8VD4oZXZlbnROYW1lOiBzdHJpbmcsIHBvbHlsaW5lOiBNYXBQb2x5bGluZURpcmVjdGl2ZSk6IE9ic2VydmFibGU8VD4ge1xuICAgICAgICBjb25zdCBiOiBTdWJqZWN0PFQ+ID0gbmV3IFN1YmplY3Q8VD4oKTtcbiAgICAgICAgaWYgKGV2ZW50TmFtZSA9PT0gJ21vdXNlbW92ZScpIHtcbiAgICAgICAgICAgIHJldHVybiBiLmFzT2JzZXJ2YWJsZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudE5hbWUgPT09ICdyaWdodGNsaWNrJykge1xuICAgICAgICAgICAgcmV0dXJuIGIuYXNPYnNlcnZhYmxlKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8vXG4gICAgICAgIC8vLyBtb3VzZW1vdmUgYW5kIHJpZ2h0Y2xpY2sgYXJlIG5vdCBzdXBwb3J0ZWQgYnkgYmluZyBwb2x5Z29ucy5cbiAgICAgICAgLy8vXG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmNyZWF0ZSgob2JzZXJ2ZXI6IE9ic2VydmVyPFQ+KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9wb2x5bGluZXMuZ2V0KHBvbHlsaW5lKS50aGVuKHAgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHg6IEFycmF5PFBvbHlsaW5lPiA9IEFycmF5LmlzQXJyYXkocCkgPyBwIDogW3BdO1xuICAgICAgICAgICAgICAgIHguZm9yRWFjaChsaW5lID0+IGxpbmUuQWRkTGlzdGVuZXIoZXZlbnROYW1lLCAoZTogVCkgPT4gdGhpcy5fem9uZS5ydW4oKCkgPT4gb2JzZXJ2ZXIubmV4dChlKSkpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgICogRGVsZXRlcyBhIHBvbHlsaW5lLlxuICAgICAgKlxuICAgICAgKiBAcGFyYW0gcG9seWxpbmUgLSB7QGxpbmsgTWFwUG9seWxpbmVEaXJlY3RpdmV9IHRvIGJlIGRlbGV0ZWQuXG4gICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIGZ1bGxmaWxsZWQgb25jZSB0aGUgcG9seWxpbmUgaGFzIGJlZW4gZGVsZXRlZC5cbiAgICAgICpcbiAgICAgICogQG1lbWJlcm9mIEJpbmdQb2x5bGluZVNlcnZpY2VcbiAgICAgICovXG4gICAgcHVibGljIERlbGV0ZVBvbHlsaW5lKHBvbHlsaW5lOiBNYXBQb2x5bGluZURpcmVjdGl2ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBtID0gdGhpcy5fcG9seWxpbmVzLmdldChwb2x5bGluZSk7XG4gICAgICAgIGlmIChtID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbS50aGVuKChsOiBQb2x5bGluZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB4OiBBcnJheTxQb2x5bGluZT4gPSBBcnJheS5pc0FycmF5KGwpID8gbCA6IFtsXTtcbiAgICAgICAgICAgICAgICB4LmZvckVhY2gobGluZSA9PiAgbGluZS5EZWxldGUoKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcG9seWxpbmVzLmRlbGV0ZShwb2x5bGluZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPYnRhaW5zIGdlbyBjb29yZGluYXRlcyBmb3IgdGhlIG1hcmtlciBvbiB0aGUgY2xpY2sgbG9jYXRpb25cbiAgICAgKlxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBwYXJhbSBlIC0gVGhlIG1vdXNlIGV2ZW50LlxuICAgICAqIEByZXR1cm5zIC0ge0BsaW5rIElMYXRMb25nfSBjb250YWluaW5nIHRoZSBnZW8gY29vcmRpbmF0ZXMgb2YgdGhlIGNsaWNrZWQgbWFya2VyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdQb2x5bGluZVNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0Q29vcmRpbmF0ZXNGcm9tQ2xpY2soZTogTWljcm9zb2Z0Lk1hcHMuSU1vdXNlRXZlbnRBcmdzKTogSUxhdExvbmcge1xuICAgICAgICBpZiAoIWUpIHsgcmV0dXJuIG51bGw7IH1cbiAgICAgICAgaWYgKCFlLmxvY2F0aW9uKSB7IHJldHVybiBudWxsOyB9XG4gICAgICAgIHJldHVybiB7IGxhdGl0dWRlOiBlLmxvY2F0aW9uLmxhdGl0dWRlLCBsb25naXR1ZGU6IGUubG9jYXRpb24ubG9uZ2l0dWRlIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT2J0YWlucyB0aGUgbWFya2VyIG1vZGVsIGZvciB0aGUgbWFya2VyIGFsbG93aW5nIGFjY2VzcyB0byBuYXRpdmUgaW1wbGVtZW50YXRpb24gZnVuY3Rpb25hdGlsaXkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcG9seWxpbmUgLSBUaGUge0BsaW5rIE1hcFBvbHlsaW5lRGlyZWN0aXZlfSBmb3Igd2hpY2ggdG8gb2J0YWluIHRoZSBwb2x5bGluZSBtb2RlbC5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IHdoZW4gZnVsbGZpbGxlZCBjb250YWlucyB0aGUge0BsaW5rIFBvbHlsaW5lfVxuICAgICAqIGltcGxlbWVudGF0aW9uIG9mIHRoZSB1bmRlcmx5aW5nIHBsYXRmb3JtLiBGb3IgY29tcGxleCBwYXRocywgcmV0dXJucyBhbiBhcnJheSBvZiBwb2x5bGluZXMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ1BvbHlsaW5lU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBHZXROYXRpdmVQb2x5bGluZShwb2x5bGluZTogTWFwUG9seWxpbmVEaXJlY3RpdmUpOiBQcm9taXNlPFBvbHlsaW5lfEFycmF5PFBvbHlsaW5lPj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fcG9seWxpbmVzLmdldChwb2x5bGluZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBwb2x5bGluZSBvcHRpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIHBvbHlsaW5lIC0ge0BsaW5rIE1hcFBvbHlsaW5lRGlyZWN0aXZlfSB0byBiZSB1cGRhdGVkLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0ge0BsaW5rIElQb2x5bGluZU9wdGlvbnN9IG9iamVjdCBjb250YWluaW5nIHRoZSBvcHRpb25zLiBPcHRpb25zIHdpbGwgYmUgbWVyZ2VkIHdpdGggdGhlXG4gICAgICogb3B0aW9ucyBhbHJlYWR5IG9uIHRoZSB1bmRlcmx5aW5nIG9iamVjdC5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSBmdWxsZmlsbGVkIG9uY2UgdGhlIHBvbHlsaW5lIG9wdGlvbnMgaGF2ZSBiZWVuIHNldC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWxpbmVTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFNldE9wdGlvbnMocG9seWxpbmU6IE1hcFBvbHlsaW5lRGlyZWN0aXZlLCBvcHRpb25zOiBJUG9seWxpbmVPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wb2x5bGluZXMuZ2V0KHBvbHlsaW5lKS50aGVuKGwgPT4ge1xuICAgICAgICAgICAgY29uc3QgeDogQXJyYXk8UG9seWxpbmU+ID0gQXJyYXkuaXNBcnJheShsKSA/IGwgOiBbbF07XG4gICAgICAgICAgICB4LmZvckVhY2gobGluZSA9PiBsaW5lLlNldE9wdGlvbnMob3B0aW9ucykpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBQb2x5bGluZSBwYXRoXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcG9seWxpbmUgLSB7QGxpbmsgTWFwUG9seWxpbmVEaXJlY3RpdmV9IHRvIGJlIHVwZGF0ZWQuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgZnVsbGZpbGxlZCBvbmNlIHRoZSBwb2x5bGluZSBoYXMgYmVlbiB1cGRhdGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdQb2x5bGluZVNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgVXBkYXRlUG9seWxpbmUocG9seWxpbmU6IE1hcFBvbHlsaW5lRGlyZWN0aXZlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IG0gPSB0aGlzLl9wb2x5bGluZXMuZ2V0KHBvbHlsaW5lKTtcbiAgICAgICAgaWYgKG0gPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtLnRoZW4obCA9PiB0aGlzLl96b25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB4OiBBcnJheTxQb2x5bGluZT4gPSBBcnJheS5pc0FycmF5KGwpID8gbCA6IFtsXTtcbiAgICAgICAgICAgIGNvbnN0IHA6IEFycmF5PEFycmF5PElMYXRMb25nPj4gPVxuICAgICAgICAgICAgICAgIHBvbHlsaW5lLlBhdGgubGVuZ3RoID4gMCAmJiBBcnJheS5pc0FycmF5KHBvbHlsaW5lLlBhdGhbMF0pID8gPEFycmF5PEFycmF5PElMYXRMb25nPj4+cG9seWxpbmUuUGF0aCA6XG4gICAgICAgICAgICAgICAgPEFycmF5PEFycmF5PElMYXRMb25nPj4+W3BvbHlsaW5lLlBhdGhdO1xuICAgICAgICAgICAgIHguZm9yRWFjaCgobGluZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgaWYgKHAubGVuZ3RoID4gaW5kZXgpIHsgbGluZS5TZXRQYXRoKHBbaW5kZXhdKTsgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShsKSAmJiBsLmxlbmd0aCA+IHAubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgbC5zcGxpY2UocC5sZW5ndGggLSAxKS5mb3JFYWNoKGxpbmUgPT4gbGluZS5EZWxldGUoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG59XG4iXX0=