import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { MapService } from '../map.service';
import { LayerService } from '../layer.service';
/**
 * Concrete implementation of the Polygon Service abstract class for Google Maps.
 *
 * @export
 */
export class GooglePolygonService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GooglePolygonService.
     * @param _mapService - {@link MapService} instance. The concrete {@link GoogleMapService} implementation is expected.
     * @param _layerService - {@link GoogleLayerService} instance.
     * The concrete {@link GoogleLayerService} implementation is expected.
     * @param _zone - NgZone instance to support zone aware promises.
     *
     * @memberof GooglePolygonService
     */
    constructor(_mapService, _layerService, _zone) {
        this._mapService = _mapService;
        this._layerService = _layerService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._polygons = new Map();
    }
    ///
    /// Public members and MarkerService implementation
    ///
    /**
     * Adds a polygon to a map. Depending on the polygon context, the polygon will either by added to the map or a
     * correcsponding layer.
     *
     * @param polygon - The {@link MapPolygonDirective} to be added.
     *
     * @memberof GooglePolygonService
     */
    AddPolygon(polygon) {
        const o = {
            id: polygon.Id,
            clickable: polygon.Clickable,
            draggable: polygon.Draggable,
            editable: polygon.Editable,
            fillColor: polygon.FillColor,
            fillOpacity: polygon.FillOpacity,
            geodesic: polygon.Geodesic,
            labelMaxZoom: polygon.LabelMaxZoom,
            labelMinZoom: polygon.LabelMinZoom,
            paths: polygon.Paths,
            showLabel: polygon.ShowLabel,
            showTooltip: polygon.ShowTooltip,
            strokeColor: polygon.StrokeColor,
            strokeOpacity: polygon.StrokeOpacity,
            strokeWeight: polygon.StrokeWeight,
            title: polygon.Title,
            visible: polygon.Visible,
            zIndex: polygon.zIndex,
        };
        const polygonPromise = this._mapService.CreatePolygon(o);
        this._polygons.set(polygon, polygonPromise);
    }
    /**
      * Registers an event delegate for a polygon.
      *
      * @param eventName - The name of the event to register (e.g. 'click')
      * @param polygon - The {@link MapPolygonDirective} for which to register the event.
      * @returns - Observable emiting an instance of T each time the event occurs.
      *
      * @memberof GooglePolygonService
      */
    CreateEventObservable(eventName, polygon) {
        return Observable.create((observer) => {
            this._polygons.get(polygon).then((p) => {
                p.AddListener(eventName, (e) => this._zone.run(() => observer.next(e)));
            });
        });
    }
    /**
      * Deletes a polygon.
      *
      * @param polygon - {@link MapPolygonDirective} to be deleted.
      * @returns - A promise fullfilled once the polygon has been deleted.
      *
      * @memberof GooglePolygonService
      */
    DeletePolygon(polygon) {
        const m = this._polygons.get(polygon);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then((l) => {
            return this._zone.run(() => {
                l.Delete();
                this._polygons.delete(polygon);
            });
        });
    }
    /**
     * Obtains geo coordinates for the polygon on the click location
     *
     * @abstract
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     *
     * @memberof GooglePolygonService
     */
    GetCoordinatesFromClick(e) {
        return { latitude: e.latLng.lat(), longitude: e.latLng.lng() };
    }
    /**
     * Obtains the polygon model for the polygon allowing access to native implementation functionatiliy.
     *
     * @param polygon - The {@link MapPolygonDirective} for which to obtain the polygon model.
     * @returns - A promise that when fullfilled contains the {@link Polygon} implementation of the underlying platform.
     *
     * @memberof GooglePolygonService
     */
    GetNativePolygon(polygon) {
        return this._polygons.get(polygon);
    }
    /**
     * Set the polygon options.
     *
     * @param polygon - {@link MapPolygonDirective} to be updated.
     * @param options - {@link IPolygonOptions} object containing the options. Options will be merged with the
     * options already on the underlying object.
     * @returns - A promise fullfilled once the polygon options have been set.
     *
     * @memberof GooglePolygonService
     */
    SetOptions(polygon, options) {
        return this._polygons.get(polygon).then((l) => { l.SetOptions(options); });
    }
    /**
     * Updates the Polygon path
     *
     * @param polygon - {@link MapPolygonDirective} to be updated.
     * @returns - A promise fullfilled once the polygon has been updated.
     *
     * @memberof GooglePolygonService
     */
    UpdatePolygon(polygon) {
        const m = this._polygons.get(polygon);
        if (m == null || polygon.Paths == null || !Array.isArray(polygon.Paths) || polygon.Paths.length === 0) {
            return Promise.resolve();
        }
        return m.then((l) => {
            if (Array.isArray(polygon.Paths[0])) {
                l.SetPaths(polygon.Paths);
            }
            else {
                l.SetPath(polygon.Paths);
            }
        });
    }
}
GooglePolygonService.decorators = [
    { type: Injectable }
];
GooglePolygonService.ctorParameters = () => [
    { type: MapService },
    { type: LayerService },
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLXBvbHlnb24uc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9zZXJ2aWNlcy9nb29nbGUvZ29vZ2xlLXBvbHlnb24uc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNuRCxPQUFPLEVBQUUsVUFBVSxFQUFZLE1BQU0sTUFBTSxDQUFDO0FBSzVDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDaEQ7Ozs7R0FJRztBQUVILE1BQU0sT0FBTyxvQkFBb0I7SUFPN0IsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7Ozs7Ozs7O09BUUc7SUFDSCxZQUFvQixXQUF1QixFQUMvQixhQUEyQixFQUMzQixLQUFhO1FBRkwsZ0JBQVcsR0FBWCxXQUFXLENBQVk7UUFDL0Isa0JBQWEsR0FBYixhQUFhLENBQWM7UUFDM0IsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQXBCekIsR0FBRztRQUNILHNCQUFzQjtRQUN0QixHQUFHO1FBQ0ssY0FBUyxHQUErQyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztJQWtCakgsQ0FBQztJQUVELEdBQUc7SUFDSCxtREFBbUQ7SUFDbkQsR0FBRztJQUVIOzs7Ozs7O09BT0c7SUFDSSxVQUFVLENBQUMsT0FBNEI7UUFDMUMsTUFBTSxDQUFDLEdBQW9CO1lBQ3ZCLEVBQUUsRUFBRSxPQUFPLENBQUMsRUFBRTtZQUNkLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztZQUM1QixTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7WUFDNUIsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1lBQzFCLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztZQUM1QixXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVc7WUFDaEMs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T0c7SUFDSSxhQUFhLENBQUMsT0FBNEI7UUFDN0MsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ25HLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzVCO1FBQ0QsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBVSxFQUFFLEVBQUU7WUFDekIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDN0I7aUJBQ0k7Z0JBQ0QsQ0FBQyxDQUFDLE9BQU8sQ0FBa0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQzdDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDOzs7WUFsS0osVUFBVTs7O1lBUEYsVUFBVTtZQUNWLFlBQVk7WUFQQSxNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSUxhdExvbmcgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lsYXRsb25nJztcbmltcG9ydCB7IEluamVjdGFibGUsIE5nWm9uZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgT2JzZXJ2ZXIgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IElQb2x5Z29uT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaXBvbHlnb24tb3B0aW9ucyc7XG5pbXBvcnQgeyBQb2x5Z29uIH0gZnJvbSAnLi4vLi4vbW9kZWxzL3BvbHlnb24nO1xuaW1wb3J0IHsgTWFwUG9seWdvbkRpcmVjdGl2ZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvbWFwLXBvbHlnb24nO1xuaW1wb3J0IHsgUG9seWdvblNlcnZpY2UgfSBmcm9tICcuLi9wb2x5Z29uLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWFwU2VydmljZSB9IGZyb20gJy4uL21hcC5zZXJ2aWNlJztcbmltcG9ydCB7IExheWVyU2VydmljZSB9IGZyb20gJy4uL2xheWVyLnNlcnZpY2UnO1xuLyoqXG4gKiBDb25jcmV0ZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgUG9seWdvbiBTZXJ2aWNlIGFic3RyYWN0IGNsYXNzIGZvciBHb29nbGUgTWFwcy5cbiAqXG4gKiBAZXhwb3J0XG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBHb29nbGVQb2x5Z29uU2VydmljZSBpbXBsZW1lbnRzIFBvbHlnb25TZXJ2aWNlIHtcblxuICAgIC8vL1xuICAgIC8vLyBGaWVsZCBkZWNsYXJhdGlvbnNcbiAgICAvLy9cbiAgICBwcml2YXRlIF9wb2x5Z29uczogTWFwPE1hcFBvbHlnb25EaXJlY3RpdmUsIFByb21pc2U8UG9seWdvbj4+ID0gbmV3IE1hcDxNYXBQb2x5Z29uRGlyZWN0aXZlLCBQcm9taXNlPFBvbHlnb24+PigpO1xuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIEdvb2dsZVBvbHlnb25TZXJ2aWNlLlxuICAgICAqIEBwYXJhbSBfbWFwU2VydmljZSAtIHtAbGluayBNYXBTZXJ2aWNlfSBpbnN0YW5jZS4gVGhlIGNvbmNyZXRlIHtAbGluayBHb29nbGVNYXBTZXJ2aWNlfSBpbXBsZW1lbnRhdGlvbiBpcyBleHBlY3RlZC5cbiAgICAgKiBAcGFyYW0gX2xheWVyU2VydmljZSAtIHtAbGluayBHb29nbGVMYXllclNlcnZpY2V9IGluc3RhbmNlLlxuICAgICAqIFRoZSBjb25jcmV0ZSB7QGxpbmsgR29vZ2xlTGF5ZXJTZXJ2aWNlfSBpbXBsZW1lbnRhdGlvbiBpcyBleHBlY3RlZC5cbiAgICAgKiBAcGFyYW0gX3pvbmUgLSBOZ1pvbmUgaW5zdGFuY2UgdG8gc3VwcG9ydCB6b25lIGF3YXJlIHByb21pc2VzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZVBvbHlnb25TZXJ2aWNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbWFwU2VydmljZTogTWFwU2VydmljZSxcbiAgICAgICAgcHJpdmF0ZSBfbGF5ZXJTZXJ2aWNlOiBMYXllclNlcnZpY2UsXG4gICAgICAgIHByaXZhdGUgX3pvbmU6IE5nWm9uZSkge1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQdWJsaWMgbWVtYmVycyBhbmQgTWFya2VyU2VydmljZSBpbXBsZW1lbnRhdGlvblxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIHBvbHlnb24gdG8gYSBtYXAuIERlcGVuZGluZyBvbiB0aGUgcG9seWdvbiBjb250ZXh0LCB0aGUgcG9seWdvbiB3aWxsIGVpdGhlciBieSBhZGRlZCB0byB0aGUgbWFwIG9yIGFcbiAgICAgKiBjb3JyZWNzcG9uZGluZyBsYXllci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwb2x5Z29uIC0gVGhlIHtAbGluayBNYXBQb2x5Z29uRGlyZWN0aXZlfSB0byBiZSBhZGRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVQb2x5Z29uU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBBZGRQb2x5Z29uKHBvbHlnb246IE1hcFBvbHlnb25EaXJlY3RpdmUpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgbzogSVBvbHlnb25PcHRpb25zID0ge1xuICAgICAgICAgICAgaWQ6IHBvbHlnb24uSWQsXG4gICAgICAgICAgICBjbGlja2FibGU6IHBvbHlnb24uQ2xpY2thYmxlLFxuICAgICAgICAgICAgZHJhZ2dhYmxlOiBwb2x5Z29uLkRyYWdnYWJsZSxcbiAgICAgICAgICAgIGVkaXRhYmxlOiBwb2x5Z29uLkVkaXRhYmxlLFxuICAgICAgICAgICAgZmlsbENvbG9yOiBwb2x5Z29uLkZpbGxDb2xvcixcbiAgICAgICAgICAgIGZpbGxPcGFjaXR5OiBwb2x5Z29uLkZpbGxPcGFjaXR5LFxuICAgICAgICAgICAgZ2VvZGVzaWM6IHBvbHlnb24uR2VvZGVzaWMsXG4gICAgICAgICAgICBsYWJlbE1heFpvb206IHBvbHlnb24uTGFiZWxNYXhab29tLFxuICAgICAgICAgICAgbGFiZWxNaW5ab29tOiBwb2x5Z29uLkxhYmVsTWluWm9vbSxcbiAgICAgICAgICAgIHBhdGhzOiBwb2x5Z29uLlBhdGhzLFxuICAgICAgICAgICAgc2hvd0xhYmVsOiBwb2x5Z29uLlNob3dMYWJlbCxcbiAgICAgICAgICAgIHNob3dUb29sdGlwOiBwb2x5Z29uLlNob3dUb29sdGlwLFxuICAgICAgICAgICAgc3Ryb2tlQ29sb3I6IHBvbHlnb24uU3Ryb2tlQ29sb3IsXG4gICAgICAgICAgICBzdHJva2VPcGFjaXR5OiBwb2x5Z29uLlN0cm9rZU9wYWNpdHksXG4gICAgICAgICAgICBzdHJva2VXZWlnaHQ6IHBvbHlnb24uU3Ryb2tlV2VpZ2h0LFxuICAgICAgICAgICAgdGl0bGU6IHBvbHlnb24uVGl0bGUsXG4gICAgICAgICAgICB2aXNpYmxlOiBwb2x5Z29uLlZpc2libGUsXG4gICAgICAgICAgICB6SW5kZXg6IHBvbHlnb24uekluZGV4LFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBwb2x5Z29uUHJvbWlzZTogUHJvbWlzZTxQb2x5Z29uPiA9IHRoaXMuX21hcFNlcnZpY2UuQ3JlYXRlUG9seWdvbihvKTtcbiAgICAgICAgdGhpcy5fcG9seWdvbnMuc2V0KHBvbHlnb24sIHBvbHlnb25Qcm9taXNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgICogUmVnaXN0ZXJzIGFuIGV2ZW50IGRlbGVnYXRlIGZvciBhIHBvbHlnb24uXG4gICAgICAqXG4gICAgICAqIEBwYXJhbSBldmVudE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVnaXN0ZXIgKGUuZy4gJ2NsaWNrJylcbiAgICAgICogQHBhcmFtIHBvbHlnb24gLSBUaGUge0BsaW5rIE1hcFBvbHlnb25EaXJlY3RpdmV9IGZvciB3aGljaCB0byByZWdpc3RlciB0aGUgZXZlbnQuXG4gICAgICAqIEByZXR1cm5zIC0gT2JzZXJ2YWJsZSBlbWl0aW5nIGFuIGluc3RhbmNlIG9mIFQgZWFjaCB0aW1lIHRoZSBldmVudCBvY2N1cnMuXG4gICAgICAqXG4gICAgICAqIEBtZW1iZXJvZiBHb29nbGVQb2x5Z29uU2VydmljZVxuICAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlRXZlbnRPYnNlcnZhYmxlPFQ+KGV2ZW50TmFtZTogc3RyaW5nLCBwb2x5Z29uOiBNYXBQb2x5Z29uRGlyZWN0aXZlKTogT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmNyZWF0ZSgob2JzZXJ2ZXI6IE9ic2VydmVyPFQ+KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9wb2x5Z29ucy5nZXQocG9seWdvbikudGhlbigocDogUG9seWdvbikgPT4ge1xuICAgICAgICAgICAgICAgIHAuQWRkTGlzdGVuZXIoZXZlbnROYW1lLCAoZTogVCkgPT4gdGhpcy5fem9uZS5ydW4oKCkgPT4gb2JzZXJ2ZXIubmV4dChlKSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAgKiBEZWxldGVzIGEgcG9seWdvbi5cbiAgICAgICpcbiAgICAgICogQHBhcmFtIHBvbHlnb24gLSB7QGxpbmsgTWFwUG9seWdvbkRpcmVjdGl2ZX0gdG8gYmUgZGVsZXRlZC5cbiAgICAgICogQHJldHVybnMgLSBBIHByb21pc2UgZnVsbGZpbGxlZCBvbmNlIHRoZSBwb2x5Z29uIGhhcyBiZWVuIGRlbGV0ZWQuXG4gICAgICAqXG4gICAgICAqIEBtZW1iZXJvZiBHb29nbGVQb2x5Z29uU2VydmljZVxuICAgICAgKi9cbiAgICBwdWJsaWMgRGVsZXRlUG9seWdvbihwb2x5Z29uOiBNYXBQb2x5Z29uRGlyZWN0aXZlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IG0gPSB0aGlzLl9wb2x5Z29ucy5nZXQocG9seWdvbik7XG4gICAgICAgIGlmIChtID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbS50aGVuKChsOiBQb2x5Z29uKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGwuRGVsZXRlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcG9seWdvbnMuZGVsZXRlKHBvbHlnb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT2J0YWlucyBnZW8gY29vcmRpbmF0ZXMgZm9yIHRoZSBwb2x5Z29uIG9uIHRoZSBjbGljayBsb2NhdGlvblxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGUgLSBUaGUgbW91c2UgZXZlbnQuXG4gICAgICogQHJldHVybnMgLSB7QGxpbmsgSUxhdExvbmd9IGNvbnRhaW5pbmcgdGhlIGdlbyBjb29yZGluYXRlcyBvZiB0aGUgY2xpY2tlZCBtYXJrZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlUG9seWdvblNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0Q29vcmRpbmF0ZXNGcm9tQ2xpY2soZTogTW91c2VFdmVudCB8IGFueSk6IElMYXRMb25nIHtcbiAgICAgICAgcmV0dXJuIHsgbGF0aXR1ZGU6IGUubGF0TG5nLmxhdCgpLCBsb25naXR1ZGU6IGUubGF0TG5nLmxuZygpIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT2J0YWlucyB0aGUgcG9seWdvbiBtb2RlbCBmb3IgdGhlIHBvbHlnb24gYWxsb3dpbmcgYWNjZXNzIHRvIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiBmdW5jdGlvbmF0aWxpeS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwb2x5Z29uIC0gVGhlIHtAbGluayBNYXBQb2x5Z29uRGlyZWN0aXZlfSBmb3Igd2hpY2ggdG8gb2J0YWluIHRoZSBwb2x5Z29uIG1vZGVsLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiBmdWxsZmlsbGVkIGNvbnRhaW5zIHRoZSB7QGxpbmsgUG9seWdvbn0gaW1wbGVtZW50YXRpb24gb2YgdGhlIHVuZGVybHlpbmcgcGxhdGZvcm0uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlUG9seWdvblNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0TmF0aXZlUG9seWdvbihwb2x5Z29uOiBNYXBQb2x5Z29uRGlyZWN0aXZlKTogUHJvbWlzZTxQb2x5Z29uPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wb2x5Z29ucy5nZXQocG9seWdvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBwb2x5Z29uIG9wdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcG9seWdvbiAtIHtAbGluayBNYXBQb2x5Z29uRGlyZWN0aXZlfSB0byBiZSB1cGRhdGVkLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0ge0BsaW5rIElQb2x5Z29uT3B0aW9uc30gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG9wdGlvbnMuIE9wdGlvbnMgd2lsbCBiZSBtZXJnZWQgd2l0aCB0aGVcbiAgICAgKiBvcHRpb25zIGFscmVhZHkgb24gdGhlIHVuZGVybHlpbmcgb2JqZWN0LlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIGZ1bGxmaWxsZWQgb25jZSB0aGUgcG9seWdvbiBvcHRpb25zIGhhdmUgYmVlbiBzZXQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlUG9seWdvblNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0T3B0aW9ucyhwb2x5Z29uOiBNYXBQb2x5Z29uRGlyZWN0aXZlLCBvcHRpb25zOiBJUG9seWdvbk9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BvbHlnb25zLmdldChwb2x5Z29uKS50aGVuKChsOiBQb2x5Z29uKSA9PiB7IGwuU2V0T3B0aW9ucyhvcHRpb25zKTsgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgUG9seWdvbiBwYXRoXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcG9seWdvbiAtIHtAbGluayBNYXBQb2x5Z29uRGlyZWN0aXZlfSB0byBiZSB1cGRhdGVkLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIGZ1bGxmaWxsZWQgb25jZSB0aGUgcG9seWdvbiBoYXMgYmVlbiB1cGRhdGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZVBvbHlnb25TZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFVwZGF0ZVBvbHlnb24ocG9seWdvbjogTWFwUG9seWdvbkRpcmVjdGl2ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBtID0gdGhpcy5fcG9seWdvbnMuZ2V0KHBvbHlnb24pO1xuICAgICAgICBpZiAobSA9PSBudWxsIHx8IHBvbHlnb24uUGF0aHMgPT0gbnVsbCB8fCAhQXJyYXkuaXNBcnJheShwb2x5Z29uLlBhdGhzKSB8fCBwb2x5Z29uLlBhdGhzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtLnRoZW4oKGw6IFBvbHlnb24pID0+IHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBvbHlnb24uUGF0aHNbMF0pKSB7XG4gICAgICAgICAgICAgICAgbC5TZXRQYXRocyhwb2x5Z29uLlBhdGhzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGwuU2V0UGF0aCg8QXJyYXk8SUxhdExvbmc+PnBvbHlnb24uUGF0aHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbn1cbiJdfQ==