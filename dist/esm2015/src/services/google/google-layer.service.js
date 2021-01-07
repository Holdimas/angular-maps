import { Injectable, NgZone } from '@angular/core';
import { GoogleLayer } from '../../models/google/google-layer';
import { GooglePolygon } from '../../models/google/google-polygon';
import { GooglePolyline } from '../../models/google/google-polyline';
import { GoogleLayerBase } from './google-layer-base';
import { MapService } from '../map.service';
import { GoogleConversions } from './google-conversions';
/**
 * Implements the {@link LayerService} contract for a Google Maps specific implementation.
 *
 * @export
 */
export class GoogleLayerService extends GoogleLayerBase {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GoogleLayerService.
     * @param _mapService - Instance of the Google Maps Service. Will generally be injected.
     * @param _zone - NgZone instance to provide zone aware promises.
     *
     * @memberof GoogleLayerService
     */
    constructor(_mapService, _zone) {
        super(_mapService, _zone);
        ///
        /// Field Declarations.
        ///
        this._layers = new Map();
    }
    /**
     * Adds a layer to the map.
     *
     * @abstract
     * @param layer - MapLayerDirective component object.
     * Generally, MapLayerDirective will be injected with an instance of the
     * LayerService and then self register on initialization.
     *
     * @memberof GoogleLayerService
     */
    AddLayer(layer) {
        const p = new Promise((resolve, reject) => {
            this._mapService.MapPromise.then(m => {
                const l = new GoogleLayer(m, this._mapService, layer.Id);
                l.SetVisible(layer.Visible);
                resolve(l);
            });
        });
        this._layers.set(layer.Id, p);
    }
    /**
     * Adds a polygon to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygon.
     * @returns - A promise that when fullfilled contains the an instance of the Polygon model.
     *
     * @memberof GoogleLayerService
     */
    CreatePolygon(layer, options) {
        const p = this._mapService.CreatePolygon(options);
        const l = this._layers.get(layer);
        Promise.all([p, l]).then(x => x[1].AddEntity(x[0]));
        return p;
    }
    /**
     * Creates an array of unbound polygons. Use this method to create arrays of polygons to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygons.
     * @returns - A promise that when fullfilled contains the an arrays of the Polygon models.
     *
     * @memberof GoogleLayerService
     */
    CreatePolygons(layer, options) {
        //
        // Note: we attempted using data.Polygons in an attempt to improve performance, but either data.Polygon
        // or data.MultiPolygon actually operate significantly slower than generating the polygons this way.
        // the slowness in google as opposed to bing probably comes from the point reduction algorithm uses.
        // Signigicant performance improvements might be possible in google when using a pixel based reduction algorithm
        // prior to setting the polygon path. This will lower to processing overhead of the google algorithm (with is Douglas-Peucker
        // and rather compute intensive)
        //
        const p = this.GetLayerById(layer);
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            const polygons = new Promise((resolve, reject) => {
                const polys = options.map(o => {
                    const op = GoogleConversions.TranslatePolygonOptions(o);
                    const poly = new google.maps.Polygon(op);
                    const polygon = new GooglePolygon(poly);
                    if (o.title && o.title !== '') {
                        polygon.Title = o.title;
                    }
                    if (o.metadata) {
                        o.metadata.forEach((val, key) => polygon.Metadata.set(key, val));
                    }
                    return polygon;
                });
                resolve(polys);
            });
            return polygons;
        });
    }
    /**
     * Adds a polyline to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polyline.
     * @param options - Polyline options defining the polyline.
     * @returns - A promise that when fullfilled contains the an instance of the Polyline (or an array
     * of polygons for complex paths) model.
     *
     * @memberof GoogleLayerService
     */
    CreatePolyline(layer, options) {
        const p = this._mapService.CreatePolyline(options);
        const l = this._layers.get(layer);
        Promise.all([p, l]).then(x => {
            const p1 = Array.isArray(x[0]) ? x[0] : [x[0]];
            for (const p2 of p1) {
                x[1].AddEntity(p2);
            }
        });
        return p;
    }
    /**
     * Creates an array of unbound polylines. Use this method to create arrays of polylines to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polylines.
     * @param options - Polyline options defining the polylines.
     * @returns - A promise that when fullfilled contains the an arrays of the Polyline models.
     *
     * @memberof GoogleLayerService
     */
    CreatePolylines(layer, options) {
        const p = this.GetLayerById(layer);
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            const polylines = new Promise((resolve, reject) => {
                const polys = options.map(o => {
                    const op = GoogleConversions.TranslatePolylineOptions(o);
                    if (o.path && o.path.length > 0 && !Array.isArray(o.path[0])) {
                        op.path = GoogleConversions.TranslatePaths(o.path)[0];
                        const poly = new google.maps.Polyline(op);
                        const polyline = new GooglePolyline(poly);
                        if (o.title && o.title !== '') {
                            polyline.Title = o.title;
                        }
                        if (o.metadata) {
                            o.metadata.forEach((v, k) => polyline.Metadata.set(k, v));
                        }
                        return polyline;
                    }
                    else {
                        const paths = GoogleConversions.TranslatePaths(o.path);
                        const lines = new Array();
                        paths.forEach(x => {
                            op.path = x;
                            const poly = new google.maps.Polyline(op);
                            const polyline = new GooglePolyline(poly);
                            if (o.metadata) {
                                o.metadata.forEach((v, k) => polyline.Metadata.set(k, v));
                            }
                            if (o.title && o.title !== '') {
                                polyline.Title = o.title;
                            }
                            lines.push(polyline);
                        });
                        return lines;
                    }
                });
                resolve(polys);
            });
            return polylines;
        });
    }
}
GoogleLayerService.decorators = [
    { type: Injectable }
];
GoogleLayerService.ctorParameters = () => [
    { type: MapService },
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLWxheWVyLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1sYXllci5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBUW5ELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUMvRCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sb0NBQW9DLENBQUM7QUFDbkUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBR3JFLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFLekQ7Ozs7R0FJRztBQUVILE1BQU0sT0FBTyxrQkFBbUIsU0FBUSxlQUFlO0lBT25ELEdBQUc7SUFDSCxlQUFlO0lBQ2YsR0FBRztJQUVIOzs7Ozs7T0FNRztJQUNILFlBQVksV0FBdUIsRUFBRSxLQUFhO1FBQzlDLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFqQjlCLEdBQUc7UUFDSCx1QkFBdUI7UUFDdkIsR0FBRztRQUNPLFlBQU8sR0FBZ0MsSUFBSSxHQUFHLEVBQTBCLENBQUM7SUFlbkYsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNJLFFBQVEsQ0FBQyxLQUF3QjtRQUNwQyxNQUFNLENBQUMsR0FBbUIsSUFBSSxPQUFPLENBQVEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDN0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNqQyxNQUFNLENBQUMsR0FBZ0IsSUFBSSxXQUFX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LEdBQUcsQ0FBQyxDQUFDOzRCQUNaLE1BQU0sSUFBSSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7NEJBQzFDLE1BQU0sUUFBUSxHQUFtQixJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDMUQsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFO2dDQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7NkJBQUU7NEJBQzlFLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUUsRUFBRTtnQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7NkJBQUU7NEJBQzNELEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQ3pCLENBQUMsQ0FBQyxDQUFDO3dCQUNILE9BQU8sS0FBSyxDQUFDO3FCQUNoQjtnQkFDTCxDQUFDLENBQUMsQ0FBQztnQkFDSCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkIsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLFNBQVMsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7OztZQWxLSixVQUFVOzs7WUFYRixVQUFVO1lBZEUsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIE5nWm9uZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgSU1hcmtlck9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2ltYXJrZXItb3B0aW9ucyc7XG5pbXBvcnQgeyBJUG9seWdvbk9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lwb2x5Z29uLW9wdGlvbnMnO1xuaW1wb3J0IHsgSVBvbHlsaW5lT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaXBvbHlsaW5lLW9wdGlvbnMnO1xuaW1wb3J0IHsgTWFya2VyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcmtlcic7XG5pbXBvcnQgeyBQb2x5Z29uIH0gZnJvbSAnLi4vLi4vbW9kZWxzL3BvbHlnb24nO1xuaW1wb3J0IHsgUG9seWxpbmUgfSBmcm9tICcuLi8uLi9tb2RlbHMvcG9seWxpbmUnO1xuaW1wb3J0IHsgTGF5ZXIgfSBmcm9tICcuLi8uLi9tb2RlbHMvbGF5ZXInO1xuaW1wb3J0IHsgR29vZ2xlTGF5ZXIgfSBmcm9tICcuLi8uLi9tb2RlbHMvZ29vZ2xlL2dvb2dsZS1sYXllcic7XG5pbXBvcnQgeyBHb29nbGVQb2x5Z29uIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2dvb2dsZS9nb29nbGUtcG9seWdvbic7XG5pbXBvcnQgeyBHb29nbGVQb2x5bGluZSB9IGZyb20gJy4uLy4uL21vZGVscy9nb29nbGUvZ29vZ2xlLXBvbHlsaW5lJztcbmltcG9ydCB7IE1hcExheWVyRGlyZWN0aXZlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9tYXAtbGF5ZXInO1xuaW1wb3J0IHsgTGF5ZXJTZXJ2aWNlIH0gZnJvbSAnLi4vbGF5ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBHb29nbGVMYXllckJhc2UgfSBmcm9tICcuL2dvb2dsZS1sYXllci1iYXNlJztcbmltcG9ydCB7IE1hcFNlcnZpY2UgfSBmcm9tICcuLi9tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBHb29nbGVDb252ZXJzaW9ucyB9IGZyb20gJy4vZ29vZ2xlLWNvbnZlcnNpb25zJztcbmltcG9ydCAqIGFzIEdvb2dsZU1hcFR5cGVzIGZyb20gJy4vZ29vZ2xlLW1hcC10eXBlcyc7XG5cbmRlY2xhcmUgdmFyIGdvb2dsZTogYW55O1xuXG4vKipcbiAqIEltcGxlbWVudHMgdGhlIHtAbGluayBMYXllclNlcnZpY2V9IGNvbnRyYWN0IGZvciBhIEdvb2dsZSBNYXBzIHNwZWNpZmljIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIEBleHBvcnRcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEdvb2dsZUxheWVyU2VydmljZSBleHRlbmRzIEdvb2dsZUxheWVyQmFzZSBpbXBsZW1lbnRzIExheWVyU2VydmljZSAge1xuXG4gICAgLy8vXG4gICAgLy8vIEZpZWxkIERlY2xhcmF0aW9ucy5cbiAgICAvLy9cbiAgICBwcm90ZWN0ZWQgX2xheWVyczogTWFwPG51bWJlciwgUHJvbWlzZTxMYXllcj4+ID0gbmV3IE1hcDxudW1iZXIsIFByb21pc2U8TGF5ZXI+PigpO1xuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIEdvb2dsZUxheWVyU2VydmljZS5cbiAgICAgKiBAcGFyYW0gX21hcFNlcnZpY2UgLSBJbnN0YW5jZSBvZiB0aGUgR29vZ2xlIE1hcHMgU2VydmljZS4gV2lsbCBnZW5lcmFsbHkgYmUgaW5qZWN0ZWQuXG4gICAgICogQHBhcmFtIF96b25lIC0gTmdab25lIGluc3RhbmNlIHRvIHByb3ZpZGUgem9uZSBhd2FyZSBwcm9taXNlcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVMYXllclNlcnZpY2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihfbWFwU2VydmljZTogTWFwU2VydmljZSwgX3pvbmU6IE5nWm9uZSkge1xuICAgICAgICBzdXBlcihfbWFwU2VydmljZSwgX3pvbmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsYXllciB0byB0aGUgbWFwLlxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGxheWVyIC0gTWFwTGF5ZXJEaXJlY3RpdmUgY29tcG9uZW50IG9iamVjdC5cbiAgICAgKiBHZW5lcmFsbHksIE1hcExheWVyRGlyZWN0aXZlIHdpbGwgYmUgaW5qZWN0ZWQgd2l0aCBhbiBpbnN0YW5jZSBvZiB0aGVcbiAgICAgKiBMYXllclNlcnZpY2UgYW5kIHRoZW4gc2VsZiByZWdpc3RlciBvbiBpbml0aWFsaXphdGlvbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVMYXllclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkTGF5ZXIobGF5ZXI6IE1hcExheWVyRGlyZWN0aXZlKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHA6IFByb21pc2U8TGF5ZXI+ID0gbmV3IFByb21pc2U8TGF5ZXI+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX21hcFNlcnZpY2UuTWFwUHJvbWlzZS50aGVuKG0gPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGw6IEdvb2dsZUxheWVyID0gbmV3IEdvb2dsZUxheWVyKG0sIHRoaXMuX21hcFNlcnZpY2UsIGxheWVyLklkKTtcbiAgICAgICAgICAgICAgICBsLlNldFZpc2libGUobGF5ZXIuVmlzaWJsZSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fbGF5ZXJzLnNldChsYXllci5JZCwgcCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIHBvbHlnb24gdG8gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGxheWVyIC0gVGhlIGlkIG9mIHRoZSBsYXllciB0byB3aGljaCB0byBhZGQgdGhlIHBvbHlnb24uXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBQb2x5Z29uIG9wdGlvbnMgZGVmaW5pbmcgdGhlIHBvbHlnb24uXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGFuIGluc3RhbmNlIG9mIHRoZSBQb2x5Z29uIG1vZGVsLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUxheWVyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVQb2x5Z29uKGxheWVyOiBudW1iZXIsIG9wdGlvbnM6IElQb2x5Z29uT3B0aW9ucyk6IFByb21pc2U8UG9seWdvbj4ge1xuICAgICAgICBjb25zdCBwOiBQcm9taXNlPFBvbHlnb24+ID0gdGhpcy5fbWFwU2VydmljZS5DcmVhdGVQb2x5Z29uKG9wdGlvbnMpO1xuICAgICAgICBjb25zdCBsOiBQcm9taXNlPExheWVyPiA9IHRoaXMuX2xheWVycy5nZXQobGF5ZXIpO1xuICAgICAgICBQcm9taXNlLmFsbChbcCwgbF0pLnRoZW4oeCA9PiB4WzFdLkFkZEVudGl0eSh4WzBdKSk7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdW5ib3VuZCBwb2x5Z29ucy4gVXNlIHRoaXMgbWV0aG9kIHRvIGNyZWF0ZSBhcnJheXMgb2YgcG9seWdvbnMgdG8gYmUgdXNlZCBpbiBidWxrXG4gICAgICogb3BlcmF0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsYXllciAtIFRoZSBpZCBvZiB0aGUgbGF5ZXIgdG8gd2hpY2ggdG8gYWRkIHRoZSBwb2x5Z29uLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gUG9seWdvbiBvcHRpb25zIGRlZmluaW5nIHRoZSBwb2x5Z29ucy5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IHdoZW4gZnVsbGZpbGxlZCBjb250YWlucyB0aGUgYW4gYXJyYXlzIG9mIHRoZSBQb2x5Z29uIG1vZGVscy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVMYXllclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlUG9seWdvbnMobGF5ZXI6IG51bWJlciwgb3B0aW9uczogQXJyYXk8SVBvbHlnb25PcHRpb25zPik6IFByb21pc2U8QXJyYXk8UG9seWdvbj4+IHtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gTm90ZTogd2UgYXR0ZW1wdGVkIHVzaW5nIGRhdGEuUG9seWdvbnMgaW4gYW4gYXR0ZW1wdCB0byBpbXByb3ZlIHBlcmZvcm1hbmNlLCBidXQgZWl0aGVyIGRhdGEuUG9seWdvblxuICAgICAgICAvLyBvciBkYXRhLk11bHRpUG9seWdvbiBhY3R1YWxseSBvcGVyYXRlIHNpZ25pZmljYW50bHkgc2xvd2VyIHRoYW4gZ2VuZXJhdGluZyB0aGUgcG9seWdvbnMgdGhpcyB3YXkuXG4gICAgICAgIC8vIHRoZSBzbG93bmVzcyBpbiBnb29nbGUgYXMgb3Bwb3NlZCB0byBiaW5nIHByb2JhYmx5IGNvbWVzIGZyb20gdGhlIHBvaW50IHJlZHVjdGlvbiBhbGdvcml0aG0gdXNlcy5cbiAgICAgICAgLy8gU2lnbmlnaWNhbnQgcGVyZm9ybWFuY2UgaW1wcm92ZW1lbnRzIG1pZ2h0IGJlIHBvc3NpYmxlIGluIGdvb2dsZSB3aGVuIHVzaW5nIGEgcGl4ZWwgYmFzZWQgcmVkdWN0aW9uIGFsZ29yaXRobVxuICAgICAgICAvLyBwcmlvciB0byBzZXR0aW5nIHRoZSBwb2x5Z29uIHBhdGguIFRoaXMgd2lsbCBsb3dlciB0byBwcm9jZXNzaW5nIG92ZXJoZWFkIG9mIHRoZSBnb29nbGUgYWxnb3JpdGhtICh3aXRoIGlzIERvdWdsYXMtUGV1Y2tlclxuICAgICAgICAvLyBhbmQgcmF0aGVyIGNvbXB1dGUgaW50ZW5zaXZlKVxuICAgICAgICAvL1xuICAgICAgICBjb25zdCBwOiBQcm9taXNlPExheWVyPiA9IHRoaXMuR2V0TGF5ZXJCeUlkKGxheWVyKTtcbiAgICAgICAgaWYgKHAgPT0gbnVsbCkgeyB0aHJvdyAobmV3IEVycm9yKGBMYXllciB3aXRoIGlkICR7bGF5ZXJ9IG5vdCBmb3VuZCBpbiBMYXllciBNYXBgKSk7IH1cbiAgICAgICAgcmV0dXJuIHAudGhlbigobDogTGF5ZXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBvbHlnb25zOiBQcm9taXNlPEFycmF5PFBvbHlnb24+PiA9IG5ldyBQcm9taXNlPEFycmF5PFBvbHlnb24+PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9seXM6IEFycmF5PEdvb2dsZVBvbHlnb24+ID0gb3B0aW9ucy5tYXAobyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9wOiBHb29nbGVNYXBUeXBlcy5Qb2x5Z29uT3B0aW9ucyA9IEdvb2dsZUNvbnZlcnNpb25zLlRyYW5zbGF0ZVBvbHlnb25PcHRpb25zKG8pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb2x5OiBHb29nbGVNYXBUeXBlcy5Qb2x5Z29uID0gbmV3IGdvb2dsZS5tYXBzLlBvbHlnb24ob3ApO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb2x5Z29uOiBHb29nbGVQb2x5Z29uID0gbmV3IEdvb2dsZVBvbHlnb24ocG9seSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvLnRpdGxlICYmIG8udGl0bGUgIT09ICcnKSB7IHBvbHlnb24uVGl0bGUgPSBvLnRpdGxlOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvLm1ldGFkYXRhKSB7IG8ubWV0YWRhdGEuZm9yRWFjaCgodmFsOiBhbnksIGtleTogc3RyaW5nKSA9PiBwb2x5Z29uLk1ldGFkYXRhLnNldChrZXksIHZhbCkpOyB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwb2x5Z29uO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlc29sdmUocG9seXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcG9seWdvbnM7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBwb2x5bGluZSB0byB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBUaGUgaWQgb2YgdGhlIGxheWVyIHRvIHdoaWNoIHRvIGFkZCB0aGUgcG9seWxpbmUuXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBQb2x5bGluZSBvcHRpb25zIGRlZmluaW5nIHRoZSBwb2x5bGluZS5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IHdoZW4gZnVsbGZpbGxlZCBjb250YWlucyB0aGUgYW4gaW5zdGFuY2Ugb2YgdGhlIFBvbHlsaW5lIChvciBhbiBhcnJheVxuICAgICAqIG9mIHBvbHlnb25zIGZvciBjb21wbGV4IHBhdGhzKSBtb2RlbC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVMYXllclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlUG9seWxpbmUobGF5ZXI6IG51bWJlciwgb3B0aW9uczogSVBvbHlsaW5lT3B0aW9ucyk6IFByb21pc2U8UG9seWxpbmV8QXJyYXk8UG9seWxpbmU+PiB7XG4gICAgICAgIGNvbnN0IHA6IFByb21pc2U8UG9seWxpbmV8QXJyYXk8UG9seWxpbmU+PiA9IHRoaXMuX21hcFNlcnZpY2UuQ3JlYXRlUG9seWxpbmUob3B0aW9ucyk7XG4gICAgICAgIGNvbnN0IGw6IFByb21pc2U8TGF5ZXI+ID0gdGhpcy5fbGF5ZXJzLmdldChsYXllcik7XG4gICAgICAgIFByb21pc2UuYWxsKFtwLCBsXSkudGhlbih4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHAxOiBBcnJheTxQb2x5bGluZT4gPSAgQXJyYXkuaXNBcnJheSh4WzBdKSA/IDxBcnJheTxQb2x5bGluZT4+eFswXSA6IFs8UG9seWxpbmU+eFswXV07XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHAyIG9mIHAxKSB7eFsxXS5BZGRFbnRpdHkocDIpOyB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IG9mIHVuYm91bmQgcG9seWxpbmVzLiBVc2UgdGhpcyBtZXRob2QgdG8gY3JlYXRlIGFycmF5cyBvZiBwb2x5bGluZXMgdG8gYmUgdXNlZCBpbiBidWxrXG4gICAgICogb3BlcmF0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsYXllciAtIFRoZSBpZCBvZiB0aGUgbGF5ZXIgdG8gd2hpY2ggdG8gYWRkIHRoZSBwb2x5bGluZXMuXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBQb2x5bGluZSBvcHRpb25zIGRlZmluaW5nIHRoZSBwb2x5bGluZXMuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGFuIGFycmF5cyBvZiB0aGUgUG9seWxpbmUgbW9kZWxzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUxheWVyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVQb2x5bGluZXMobGF5ZXI6IG51bWJlciwgb3B0aW9uczogQXJyYXk8SVBvbHlsaW5lT3B0aW9ucz4pOiBQcm9taXNlPEFycmF5PFBvbHlsaW5lfEFycmF5PFBvbHlsaW5lPj4+IHtcbiAgICAgICAgY29uc3QgcDogUHJvbWlzZTxMYXllcj4gPSB0aGlzLkdldExheWVyQnlJZChsYXllcik7XG4gICAgICAgIGlmIChwID09IG51bGwpIHsgdGhyb3cgKG5ldyBFcnJvcihgTGF5ZXIgd2l0aCBpZCAke2xheWVyfSBub3QgZm91bmQgaW4gTGF5ZXIgTWFwYCkpOyB9XG4gICAgICAgIHJldHVybiBwLnRoZW4oKGw6IExheWVyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwb2x5bGluZXM6IFByb21pc2U8QXJyYXk8UG9seWxpbmV8QXJyYXk8UG9seWxpbmU+Pj4gPSBuZXcgUHJvbWlzZTxBcnJheTxQb2x5bGluZXxBcnJheTxQb2x5bGluZT4+PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9seXM6IEFycmF5PFBvbHlsaW5lfEFycmF5PFBvbHlsaW5lPj4gPSBvcHRpb25zLm1hcChvID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3A6IEdvb2dsZU1hcFR5cGVzLlBvbHlsaW5lT3B0aW9ucyA9IEdvb2dsZUNvbnZlcnNpb25zLlRyYW5zbGF0ZVBvbHlsaW5lT3B0aW9ucyhvKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG8ucGF0aCAmJiBvLnBhdGgubGVuZ3RoID4gMCAmJiAhQXJyYXkuaXNBcnJheShvLnBhdGhbMF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcC5wYXRoID0gR29vZ2xlQ29udmVyc2lvbnMuVHJhbnNsYXRlUGF0aHMoby5wYXRoKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvbHk6IEdvb2dsZU1hcFR5cGVzLlBvbHlsaW5lID0gbmV3IGdvb2dsZS5tYXBzLlBvbHlsaW5lKG9wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvbHlsaW5lOiBHb29nbGVQb2x5bGluZSA9IG5ldyBHb29nbGVQb2x5bGluZShwb2x5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLnRpdGxlICYmIG8udGl0bGUgIT09ICcnKSB7IHBvbHlsaW5lLlRpdGxlID0gby50aXRsZTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8ubWV0YWRhdGEpIHsgby5tZXRhZGF0YS5mb3JFYWNoKCh2LCBrKSA9PiBwb2x5bGluZS5NZXRhZGF0YS5zZXQoaywgdikpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcG9seWxpbmU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoczogQXJyYXk8QXJyYXk8R29vZ2xlTWFwVHlwZXMuTGF0TG5nPj4gPSBHb29nbGVDb252ZXJzaW9ucy5UcmFuc2xhdGVQYXRocyhvLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGluZXM6IEFycmF5PFBvbHlsaW5lPiA9IG5ldyBBcnJheTxQb2x5bGluZT4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGhzLmZvckVhY2goeCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3AucGF0aCA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcG9seSA9IG5ldyBnb29nbGUubWFwcy5Qb2x5bGluZShvcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcG9seWxpbmU6IEdvb2dsZVBvbHlsaW5lID0gbmV3IEdvb2dsZVBvbHlsaW5lKHBvbHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLm1ldGFkYXRhKSB7IG8ubWV0YWRhdGEuZm9yRWFjaCgodiwgaykgPT4gcG9seWxpbmUuTWV0YWRhdGEuc2V0KGssIHYpKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvLnRpdGxlICYmIG8udGl0bGUgIT09ICcnKSB7cG9seWxpbmUuVGl0bGUgPSBvLnRpdGxlOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZXMucHVzaChwb2x5bGluZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBsaW5lcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlc29sdmUocG9seXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcG9seWxpbmVzO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn1cbiJdfQ==