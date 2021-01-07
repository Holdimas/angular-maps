import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MapService } from '../map.service';
import { LayerService } from '../layer.service';
/**
 * Concrete implementation of the Polygon Service abstract class for Bing Maps V8.
 *
 * @export
 */
export class BingPolygonService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingPolygonService.
     * @param _mapService - {@link MapService} instance. The concrete {@link BingMapService} implementation is expected.
     * @param _layerService - {@link BingLayerService} instance.
     * The concrete {@link BingLayerService} implementation is expected.
     * @param _zone - NgZone instance to support zone aware promises.
     *
     * @memberof BingPolygonService
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
    /**
     * Adds a polygon to a map. Depending on the polygon context, the polygon will either by added to the map or a
     * correcsponding layer.
     *
     * @param polygon - The {@link MapPolygonDirective} to be added.
     *
     * @memberof BingPolygonService
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
        let polygonPromise;
        if (polygon.InCustomLayer) {
            polygonPromise = this._layerService.CreatePolygon(polygon.LayerId, o);
        }
        else {
            polygonPromise = this._mapService.CreatePolygon(o);
        }
        this._polygons.set(polygon, polygonPromise);
    }
    /**
      * Registers an event delegate for a polygon.
      *
      * @param eventName - The name of the event to register (e.g. 'click')
      * @param polygon - The {@link MapPolygonDirective} for which to register the event.
      * @returns - Observable emiting an instance of T each time the event occurs.
      *
      * @memberof BingPolygonService
      */
    CreateEventObservable(eventName, polygon) {
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
      * @memberof BingPolygonService
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
     * @param e - The mouse event. Expected to implement {@link Microsoft.Maps.IMouseEventArgs}.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     *
     * @memberof BingPolygonService
     */
    GetCoordinatesFromClick(e) {
        const x = e;
        return { latitude: x.location.latitude, longitude: x.location.longitude };
    }
    /**
     * Obtains the polygon model for the polygon allowing access to native implementation functionatiliy.
     *
     * @param polygon - The {@link MapPolygonDirective} for which to obtain the polygon model.
     * @returns - A promise that when fullfilled contains the {@link Polygon} implementation of the underlying platform.
     *
     * @memberof BingPolygonService
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
     * @memberof BingPolygonService
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
     * @memberof BingPolygonService
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
BingPolygonService.decorators = [
    { type: Injectable }
];
BingPolygonService.ctorParameters = () => [
    { type: MapService },
    { type: LayerService },
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1wb2x5Z29uLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvc2VydmljZXMvYmluZy9iaW5nLXBvbHlnb24uc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNuRCxPQUFPLEVBQUUsVUFBVSxFQUFZLE9BQU8sRUFBRSxNQUFNLE1BQU0sQ0FBQztBQU1yRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRWhEOzs7O0dBSUc7QUFFSCxNQUFNLE9BQU8sa0JBQWtCO0lBTzNCLEdBQUc7SUFDSCxlQUFlO0lBQ2YsR0FBRztJQUVIOzs7Ozs7OztPQVFHO0lBQ0gsWUFBb0IsV0FBdUIsRUFDL0IsYUFBMkIsRUFDM0IsS0FBYTtRQUZMLGdCQUFXLEdBQVgsV0FBVyxDQUFZO1FBQy9CLGtCQUFhLEdBQWIsYUFBYSxDQUFjO1FBQzNCLFVBQUssR0FBTCxLQUFLLENBQVE7UUFwQnpCLEdBQUc7UUFDSCxzQkFBc0I7UUFDdEIsR0FBRztRQUNLLGNBQVMsR0FBK0MsSUFBSSxHQUFHLEVBQXlDLENBQUM7SUFrQmpILENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksVUFBVSxDQUFDLE9BQTRCO1FBQzFDLE1BQU0sQ0FBQyxHQUFvQjtZQUN2QixFQUFFLEVBQUUsT0FBTyxDQUFDLEVBQUU7WUFDZCxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7WUFDNUIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTO1lBQzVCLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtZQUMxQixTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7WUFDNUIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO1lBQ2hDLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtZQUMx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SUFDUCxDQUFDOzs7WUFoTEosVUFBVTs7O1lBUkYsVUFBVTtZQUNWLFlBQVk7WUFSQSxNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgSUxhdExvbmcgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lsYXRsb25nJztcbmltcG9ydCB7IElQb2x5Z29uT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaXBvbHlnb24tb3B0aW9ucyc7XG5pbXBvcnQgeyBQb2x5Z29uIH0gZnJvbSAnLi4vLi4vbW9kZWxzL3BvbHlnb24nO1xuaW1wb3J0IHsgTWFwUG9seWdvbkRpcmVjdGl2ZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvbWFwLXBvbHlnb24nO1xuaW1wb3J0IHsgUG9seWdvblNlcnZpY2UgfSBmcm9tICcuLi9wb2x5Z29uLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWFwU2VydmljZSB9IGZyb20gJy4uL21hcC5zZXJ2aWNlJztcbmltcG9ydCB7IExheWVyU2VydmljZSB9IGZyb20gJy4uL2xheWVyLnNlcnZpY2UnO1xuXG4vKipcbiAqIENvbmNyZXRlIGltcGxlbWVudGF0aW9uIG9mIHRoZSBQb2x5Z29uIFNlcnZpY2UgYWJzdHJhY3QgY2xhc3MgZm9yIEJpbmcgTWFwcyBWOC5cbiAqXG4gKiBAZXhwb3J0XG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBCaW5nUG9seWdvblNlcnZpY2UgaW1wbGVtZW50cyBQb2x5Z29uU2VydmljZSB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfcG9seWdvbnM6IE1hcDxNYXBQb2x5Z29uRGlyZWN0aXZlLCBQcm9taXNlPFBvbHlnb24+PiA9IG5ldyBNYXA8TWFwUG9seWdvbkRpcmVjdGl2ZSwgUHJvbWlzZTxQb2x5Z29uPj4oKTtcblxuICAgIC8vL1xuICAgIC8vLyBDb25zdHJ1Y3RvclxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBCaW5nUG9seWdvblNlcnZpY2UuXG4gICAgICogQHBhcmFtIF9tYXBTZXJ2aWNlIC0ge0BsaW5rIE1hcFNlcnZpY2V9IGluc3RhbmNlLiBUaGUgY29uY3JldGUge0BsaW5rIEJpbmdNYXBTZXJ2aWNlfSBpbXBsZW1lbnRhdGlvbiBpcyBleHBlY3RlZC5cbiAgICAgKiBAcGFyYW0gX2xheWVyU2VydmljZSAtIHtAbGluayBCaW5nTGF5ZXJTZXJ2aWNlfSBpbnN0YW5jZS5cbiAgICAgKiBUaGUgY29uY3JldGUge0BsaW5rIEJpbmdMYXllclNlcnZpY2V9IGltcGxlbWVudGF0aW9uIGlzIGV4cGVjdGVkLlxuICAgICAqIEBwYXJhbSBfem9uZSAtIE5nWm9uZSBpbnN0YW5jZSB0byBzdXBwb3J0IHpvbmUgYXdhcmUgcHJvbWlzZXMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ1BvbHlnb25TZXJ2aWNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbWFwU2VydmljZTogTWFwU2VydmljZSxcbiAgICAgICAgcHJpdmF0ZSBfbGF5ZXJTZXJ2aWNlOiBMYXllclNlcnZpY2UsXG4gICAgICAgIHByaXZhdGUgX3pvbmU6IE5nWm9uZSkge1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBwb2x5Z29uIHRvIGEgbWFwLiBEZXBlbmRpbmcgb24gdGhlIHBvbHlnb24gY29udGV4dCwgdGhlIHBvbHlnb24gd2lsbCBlaXRoZXIgYnkgYWRkZWQgdG8gdGhlIG1hcCBvciBhXG4gICAgICogY29ycmVjc3BvbmRpbmcgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcG9seWdvbiAtIFRoZSB7QGxpbmsgTWFwUG9seWdvbkRpcmVjdGl2ZX0gdG8gYmUgYWRkZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ1BvbHlnb25TZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIEFkZFBvbHlnb24ocG9seWdvbjogTWFwUG9seWdvbkRpcmVjdGl2ZSk6IHZvaWQge1xuICAgICAgICBjb25zdCBvOiBJUG9seWdvbk9wdGlvbnMgPSB7XG4gICAgICAgICAgICBpZDogcG9seWdvbi5JZCxcbiAgICAgICAgICAgIGNsaWNrYWJsZTogcG9seWdvbi5DbGlja2FibGUsXG4gICAgICAgICAgICBkcmFnZ2FibGU6IHBvbHlnb24uRHJhZ2dhYmxlLFxuICAgICAgICAgICAgZWRpdGFibGU6IHBvbHlnb24uRWRpdGFibGUsXG4gICAgICAgICAgICBmaWxsQ29sb3I6IHBvbHlnb24uRmlsbENvbG9yLFxuICAgICAgICAgICAgZmlsbE9wYWNpdHk6IHBvbHlnb24uRmlsbE9wYWNpdHksXG4gICAgICAgICAgICBnZW9kZXNpYzogcG9seWdvbi5HZW9kZXNpYyxcbiAgICAgICAgICAgIGxhYmVsTWF4Wm9vbTogcG9seWdvbi5MYWJlbE1heFpvb20sXG4gICAgICAgICAgICBsYWJlbE1pblpvb206IHBvbHlnb24uTGFiZWxNaW5ab29tLFxuICAgICAgICAgICAgcGF0aHM6IHBvbHlnb24uUGF0aHMsXG4gICAgICAgICAgICBzaG93TGFiZWw6IHBvbHlnb24uU2hvd0xhYmVsLFxuICAgICAgICAgICAgc2hvd1Rvb2x0aXA6IHBvbHlnb24uU2hvd1Rvb2x0aXAsXG4gICAgICAgICAgICBzdHJva2VDb2xvcjogcG9seWdvbi5TdHJva2VDb2xvcixcbiAgICAgICAgICAgIHN0cm9rZU9wYWNpdHk6IHBvbHlnb24uU3Ryb2tlT3BhY2l0eSxcbiAgICAgICAgICAgIHN0cm9rZVdlaWdodDogcG9seWdvbi5TdHJva2VXZWlnaHQsXG4gICAgICAgICAgICB0aXRsZTogcG9seWdvbi5UaXRsZSxcbiAgICAgICAgICAgIHZpc2libGU6IHBvbHlnb24uVmlzaWJsZSxcbiAgICAgICAgICAgIHpJbmRleDogcG9seWdvbi56SW5kZXgsXG4gICAgICAgIH07XG4gICAgICAgIGxldCBwb2x5Z29uUHJvbWlzZTogUHJvbWlzZTxQb2x5Z29uPjtcbiAgICAgICAgaWYgKHBvbHlnb24uSW5DdXN0b21MYXllcikge1xuICAgICAgICAgICAgcG9seWdvblByb21pc2UgPSB0aGlzLl9sYXllclNlcnZpY2UuQ3JlYXRlUG9seWdvbihwb2x5Z29uLkxheWVySWQsIG8pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcG9seWdvblByb21pc2UgPSB0aGlzLl9tYXBTZXJ2aWNlLkNyZWF0ZVBvbHlnb24obyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcG9seWdvbnMuc2V0KHBvbHlnb24sIHBvbHlnb25Qcm9taXNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgICogUmVnaXN0ZXJzIGFuIGV2ZW50IGRlbGVnYXRlIGZvciBhIHBvbHlnb24uXG4gICAgICAqXG4gICAgICAqIEBwYXJhbSBldmVudE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVnaXN0ZXIgKGUuZy4gJ2NsaWNrJylcbiAgICAgICogQHBhcmFtIHBvbHlnb24gLSBUaGUge0BsaW5rIE1hcFBvbHlnb25EaXJlY3RpdmV9IGZvciB3aGljaCB0byByZWdpc3RlciB0aGUgZXZlbnQuXG4gICAgICAqIEByZXR1cm5zIC0gT2JzZXJ2YWJsZSBlbWl0aW5nIGFuIGluc3RhbmNlIG9mIFQgZWFjaCB0aW1lIHRoZSBldmVudCBvY2N1cnMuXG4gICAgICAqXG4gICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWdvblNlcnZpY2VcbiAgICAgICovXG4gICAgcHVibGljIENyZWF0ZUV2ZW50T2JzZXJ2YWJsZTxUPihldmVudE5hbWU6IHN0cmluZywgcG9seWdvbjogTWFwUG9seWdvbkRpcmVjdGl2ZSk6IE9ic2VydmFibGU8VD4ge1xuICAgICAgICBjb25zdCBiOiBTdWJqZWN0PFQ+ID0gbmV3IFN1YmplY3Q8VD4oKTtcbiAgICAgICAgaWYgKGV2ZW50TmFtZSA9PT0gJ21vdXNlbW92ZScpIHtcbiAgICAgICAgICAgIHJldHVybiBiLmFzT2JzZXJ2YWJsZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudE5hbWUgPT09ICdyaWdodGNsaWNrJykge1xuICAgICAgICAgICAgcmV0dXJuIGIuYXNPYnNlcnZhYmxlKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8vXG4gICAgICAgIC8vLyBtb3VzZW1vdmUgYW5kIHJpZ2h0Y2xpY2sgYXJlIG5vdCBzdXBwb3J0ZWQgYnkgYmluZyBwb2x5Z29ucy5cbiAgICAgICAgLy8vXG5cbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuY3JlYXRlKChvYnNlcnZlcjogT2JzZXJ2ZXI8VD4pID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3BvbHlnb25zLmdldChwb2x5Z29uKS50aGVuKChwOiBQb2x5Z29uKSA9PiB7XG4gICAgICAgICAgICAgICAgcC5BZGRMaXN0ZW5lcihldmVudE5hbWUsIChlOiBUKSA9PiB0aGlzLl96b25lLnJ1bigoKSA9PiBvYnNlcnZlci5uZXh0KGUpKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICAqIERlbGV0ZXMgYSBwb2x5Z29uLlxuICAgICAgKlxuICAgICAgKiBAcGFyYW0gcG9seWdvbiAtIHtAbGluayBNYXBQb2x5Z29uRGlyZWN0aXZlfSB0byBiZSBkZWxldGVkLlxuICAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSBmdWxsZmlsbGVkIG9uY2UgdGhlIHBvbHlnb24gaGFzIGJlZW4gZGVsZXRlZC5cbiAgICAgICpcbiAgICAgICogQG1lbWJlcm9mIEJpbmdQb2x5Z29uU2VydmljZVxuICAgICAgKi9cbiAgICBwdWJsaWMgRGVsZXRlUG9seWdvbihwb2x5Z29uOiBNYXBQb2x5Z29uRGlyZWN0aXZlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IG0gPSB0aGlzLl9wb2x5Z29ucy5nZXQocG9seWdvbik7XG4gICAgICAgIGlmIChtID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbS50aGVuKChsOiBQb2x5Z29uKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGwuRGVsZXRlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcG9seWdvbnMuZGVsZXRlKHBvbHlnb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT2J0YWlucyBnZW8gY29vcmRpbmF0ZXMgZm9yIHRoZSBwb2x5Z29uIG9uIHRoZSBjbGljayBsb2NhdGlvblxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGUgLSBUaGUgbW91c2UgZXZlbnQuIEV4cGVjdGVkIHRvIGltcGxlbWVudCB7QGxpbmsgTWljcm9zb2Z0Lk1hcHMuSU1vdXNlRXZlbnRBcmdzfS5cbiAgICAgKiBAcmV0dXJucyAtIHtAbGluayBJTGF0TG9uZ30gY29udGFpbmluZyB0aGUgZ2VvIGNvb3JkaW5hdGVzIG9mIHRoZSBjbGlja2VkIG1hcmtlci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWdvblNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0Q29vcmRpbmF0ZXNGcm9tQ2xpY2soZTogTW91c2VFdmVudCB8IGFueSk6IElMYXRMb25nIHtcbiAgICAgICAgY29uc3QgeDogTWljcm9zb2Z0Lk1hcHMuSU1vdXNlRXZlbnRBcmdzID0gPE1pY3Jvc29mdC5NYXBzLklNb3VzZUV2ZW50QXJncz5lO1xuICAgICAgICByZXR1cm4geyBsYXRpdHVkZTogeC5sb2NhdGlvbi5sYXRpdHVkZSwgbG9uZ2l0dWRlOiB4LmxvY2F0aW9uLmxvbmdpdHVkZSB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9idGFpbnMgdGhlIHBvbHlnb24gbW9kZWwgZm9yIHRoZSBwb2x5Z29uIGFsbG93aW5nIGFjY2VzcyB0byBuYXRpdmUgaW1wbGVtZW50YXRpb24gZnVuY3Rpb25hdGlsaXkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcG9seWdvbiAtIFRoZSB7QGxpbmsgTWFwUG9seWdvbkRpcmVjdGl2ZX0gZm9yIHdoaWNoIHRvIG9idGFpbiB0aGUgcG9seWdvbiBtb2RlbC5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IHdoZW4gZnVsbGZpbGxlZCBjb250YWlucyB0aGUge0BsaW5rIFBvbHlnb259IGltcGxlbWVudGF0aW9uIG9mIHRoZSB1bmRlcmx5aW5nIHBsYXRmb3JtLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdQb2x5Z29uU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBHZXROYXRpdmVQb2x5Z29uKHBvbHlnb246IE1hcFBvbHlnb25EaXJlY3RpdmUpOiBQcm9taXNlPFBvbHlnb24+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BvbHlnb25zLmdldChwb2x5Z29uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHBvbHlnb24gb3B0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwb2x5Z29uIC0ge0BsaW5rIE1hcFBvbHlnb25EaXJlY3RpdmV9IHRvIGJlIHVwZGF0ZWQuXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSB7QGxpbmsgSVBvbHlnb25PcHRpb25zfSBvYmplY3QgY29udGFpbmluZyB0aGUgb3B0aW9ucy4gT3B0aW9ucyB3aWxsIGJlIG1lcmdlZCB3aXRoIHRoZVxuICAgICAqIG9wdGlvbnMgYWxyZWFkeSBvbiB0aGUgdW5kZXJseWluZyBvYmplY3QuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgZnVsbGZpbGxlZCBvbmNlIHRoZSBwb2x5Z29uIG9wdGlvbnMgaGF2ZSBiZWVuIHNldC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWdvblNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0T3B0aW9ucyhwb2x5Z29uOiBNYXBQb2x5Z29uRGlyZWN0aXZlLCBvcHRpb25zOiBJUG9seWdvbk9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BvbHlnb25zLmdldChwb2x5Z29uKS50aGVuKChsOiBQb2x5Z29uKSA9PiB7IGwuU2V0T3B0aW9ucyhvcHRpb25zKTsgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgUG9seWdvbiBwYXRoXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcG9seWdvbiAtIHtAbGluayBNYXBQb2x5Z29uRGlyZWN0aXZlfSB0byBiZSB1cGRhdGVkLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIGZ1bGxmaWxsZWQgb25jZSB0aGUgcG9seWdvbiBoYXMgYmVlbiB1cGRhdGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdQb2x5Z29uU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBVcGRhdGVQb2x5Z29uKHBvbHlnb246IE1hcFBvbHlnb25EaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgbSA9IHRoaXMuX3BvbHlnb25zLmdldChwb2x5Z29uKTtcbiAgICAgICAgaWYgKG0gPT0gbnVsbCB8fCBwb2x5Z29uLlBhdGhzID09IG51bGwgfHwgIUFycmF5LmlzQXJyYXkocG9seWdvbi5QYXRocykgfHwgcG9seWdvbi5QYXRocy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbS50aGVuKChsOiBQb2x5Z29uKSA9PiAge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocG9seWdvbi5QYXRoc1swXSkpIHtcbiAgICAgICAgICAgICAgICBsLlNldFBhdGhzKHBvbHlnb24uUGF0aHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbC5TZXRQYXRoKDxBcnJheTxJTGF0TG9uZz4+cG9seWdvbi5QYXRocyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxufVxuIl19