import { Marker } from '../../models/marker';
import { GoogleConversions } from './google-conversions';
import { GoogleMarker } from '../../models/google/google-marker';
/**
 * This abstract partially implements the contract for the {@link LayerService}
 * and {@link ClusterService} for the Google Maps archtiecture. It serves
 * as the base class for basic layer ({@link GoogleLayerService}) and cluster layer ({@link GoogleClusterLayer}).
 *
 * @export
 * @abstract
 */
export class GoogleLayerBase {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GoogleLayerBase.
     * @param _mapService - Concrete {@link MapService} implementation for Google Maps.
     * An instance of {@link GoogleMapService}.
     * @param _zone - NgZone instance to provide zone aware promises.
     *
     * @memberof GoogleLayerBase
     */
    constructor(_mapService, _zone) {
        this._mapService = _mapService;
        this._zone = _zone;
    }
    /**
     * Deletes the layer
     *
     * @param layer - MapLayerDirective component object for which to retrieve the layer.
     * @returns - A promise that is fullfilled when the layer has been removed.
     *
     * @memberof GoogleLayerBase
     */
    DeleteLayer(layer) {
        const l = this._layers.get(layer.Id);
        if (l == null) {
            return Promise.resolve();
        }
        return l.then((l1) => {
            return this._zone.run(() => {
                l1.Delete();
                this._layers.delete(layer.Id);
            });
        });
    }
    /**
     * Returns the Layer model represented by this layer.
     *
     * @param layer - MapLayerDirective component object or layer id for which to retrieve the layer model.
     * @returns - A promise that when resolved contains the Layer model.
     *
     * @memberof GoogleLayerBase
     */
    GetNativeLayer(layer) {
        let p = null;
        if (typeof (layer) === 'number') {
            p = this._layers.get(layer);
        }
        else {
            p = this._layers.get(layer.Id);
        }
        return p;
    }
    /**
     * Creates a marker in the layer.
     *
     * @param layer - The Id of the layer in which to create the marker.
     * @param options - {@link IMarkerOptions} object containing the marker properties.
     * @returns - A promise that when fullfilled contains the {@link Marker} model for the created marker.
     *
     * @memberof GoogleLayerBase
     */
    CreateMarker(layer, options) {
        const mp = this._mapService.MapPromise;
        const lp = this._layers.get(layer);
        return Promise.all([mp, lp]).then(([map, l]) => {
            const payload = (x) => {
                const marker = new google.maps.Marker(x);
                if (options.metadata) {
                    options.metadata.forEach((val, key) => marker.Metadata.set(key, val));
                }
                marker.setMap(map);
                const m = new GoogleMarker(marker);
                m.IsFirst = options.isFirst;
                m.IsLast = options.isLast;
                if (options.metadata) {
                    options.metadata.forEach((val, key) => m.Metadata.set(key, val));
                }
                l.AddEntity(m);
                return m;
            };
            const o = GoogleConversions.TranslateMarkerOptions(options);
            if (options.iconInfo && options.iconInfo.markerType) {
                const s = Marker.CreateMarker(options.iconInfo);
                if (typeof (s) === 'string') {
                    o.icon = s;
                    return payload(o);
                }
                else {
                    return s.then(x => {
                        o.icon = x.icon;
                        return payload(o);
                    });
                }
            }
            else {
                return payload(o);
            }
        });
    }
    /**
     * Creates an array of unbound markers. Use this method to create arrays of markers to be used in bulk
     * operations.
     *
     * @param options - Marker options defining the markers.
     * @param markerIcon - Optional information to generate custom markers. This will be applied to all markers.
     * @returns - A promise that when fullfilled contains the an arrays of the Marker models.
     *
     * @memberof GoogleLayerBase
     */
    CreateMarkers(options, markerIcon) {
        const payload = (icon) => {
            const markers = options.map(mo => {
                const o = GoogleConversions.TranslateMarkerOptions(mo);
                if (icon && icon !== '') {
                    o.icon = icon;
                }
                const pushpin = new google.maps.Marker(o);
                const marker = new GoogleMarker(pushpin);
                marker.IsFirst = mo.isFirst;
                marker.IsLast = mo.isLast;
                if (mo.metadata) {
                    mo.metadata.forEach((val, key) => marker.Metadata.set(key, val));
                }
                return marker;
            });
            return markers;
        };
        const p = new Promise((resolve, reject) => {
            if (markerIcon && markerIcon.markerType) {
                const s = Marker.CreateMarker(markerIcon);
                if (typeof (s) === 'string') {
                    resolve(payload(s));
                }
                else {
                    return s.then(x => {
                        resolve(payload(x.icon));
                    });
                }
            }
            else {
                resolve(payload(null));
            }
        });
        return p;
    }
    ///
    /// Protected methods
    ///
    /**
     * Gets the layer based on its id.
     *
     * @protected
     * @param id - Layer Id.
     * @returns - A promise that when fullfilled contains the {@link Layer} model for the layer.
     *
     * @memberof GoogleLayerBase
     */
    GetLayerById(id) {
        let p;
        this._layers.forEach((l, k) => { if (k === id) {
            p = l;
        } });
        return p;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLWxheWVyLWJhc2UuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1sYXllci1iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQU83QyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUN6RCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sbUNBQW1DLENBQUM7QUFLakU7Ozs7Ozs7R0FPRztBQUNILE1BQU0sT0FBZ0IsZUFBZTtJQU9qQyxHQUFHO0lBQ0gsZUFBZTtJQUNmLEdBQUc7SUFFSDs7Ozs7OztPQU9HO0lBQ0gsWUFBc0IsV0FBdUIsRUFBWSxLQUFhO1FBQWhELGdCQUFXLEdBQVgsV0FBVyxDQUFZO1FBQVksVUFBSyxHQUFMLEtBQUssQ0FBUTtJQUFJLENBQUM7SUFrQjNFOzs7Ozs7O09BT0c7SUFDSSxXQUFXLENBQUMsS0FBd0I7UUFDdkMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRTtZQUNYLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzVCO1FBQ0QsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBUyxFQUFFLEVBQUU7WUFDeEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3ZCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEMsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ks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LEVBQUU7Z0JBQ3JDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzFDLElBQUksT0FBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRTtvQkFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQUU7cUJBQy9DO29CQUNELE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFDZCxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUM3QixDQUFDLENBQUMsQ0FBQztpQkFDTjthQUNKO2lCQUNJO2dCQUNELE9BQU8sQ0FBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUMzQjtRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLENBQUM7SUFDYixDQUFDO0lBRUQsR0FBRztJQUNILHFCQUFxQjtJQUNyQixHQUFHO0lBRUg7Ozs7Ozs7O09BUUc7SUFDTyxZQUFZLENBQUMsRUFBVTtRQUM3QixJQUFJLENBQWlCLENBQUM7UUFDdEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFpQixFQUFFLENBQVMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckYsT0FBTyxDQUFDLENBQUM7SUFDYixDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBOZ1pvbmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IElNYXJrZXJPcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbWFya2VyLW9wdGlvbnMnO1xuaW1wb3J0IHsgSU1hcmtlckljb25JbmZvIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbWFya2VyLWljb24taW5mbyc7XG5pbXBvcnQgeyBNYXJrZXIgfSBmcm9tICcuLi8uLi9tb2RlbHMvbWFya2VyJztcbmltcG9ydCB7IExheWVyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2xheWVyJztcbmltcG9ydCB7IE1hcmtlclR5cGVJZCB9IGZyb20gJy4uLy4uL21vZGVscy9tYXJrZXItdHlwZS1pZCc7XG5pbXBvcnQgeyBNYXBTZXJ2aWNlIH0gZnJvbSAnLi4vbWFwLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWFwTGF5ZXJEaXJlY3RpdmUgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL21hcC1sYXllcic7XG5pbXBvcnQgeyBMYXllclNlcnZpY2UgfSBmcm9tICcuLi9sYXllci5zZXJ2aWNlJztcbmltcG9ydCB7IEdvb2dsZU1hcFNlcnZpY2UgfSBmcm9tICcuL2dvb2dsZS1tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBHb29nbGVDb252ZXJzaW9ucyB9IGZyb20gJy4vZ29vZ2xlLWNvbnZlcnNpb25zJztcbmltcG9ydCB7IEdvb2dsZU1hcmtlciB9IGZyb20gJy4uLy4uL21vZGVscy9nb29nbGUvZ29vZ2xlLW1hcmtlcic7XG5pbXBvcnQgKiBhcyBHb29nbGVNYXBUeXBlcyBmcm9tICcuL2dvb2dsZS1tYXAtdHlwZXMnO1xuXG5kZWNsYXJlIHZhciBnb29nbGU6IGFueTtcblxuLyoqXG4gKiBUaGlzIGFic3RyYWN0IHBhcnRpYWxseSBpbXBsZW1lbnRzIHRoZSBjb250cmFjdCBmb3IgdGhlIHtAbGluayBMYXllclNlcnZpY2V9XG4gKiBhbmQge0BsaW5rIENsdXN0ZXJTZXJ2aWNlfSBmb3IgdGhlIEdvb2dsZSBNYXBzIGFyY2h0aWVjdHVyZS4gSXQgc2VydmVzXG4gKiBhcyB0aGUgYmFzZSBjbGFzcyBmb3IgYmFzaWMgbGF5ZXIgKHtAbGluayBHb29nbGVMYXllclNlcnZpY2V9KSBhbmQgY2x1c3RlciBsYXllciAoe0BsaW5rIEdvb2dsZUNsdXN0ZXJMYXllcn0pLlxuICpcbiAqIEBleHBvcnRcbiAqIEBhYnN0cmFjdFxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgR29vZ2xlTGF5ZXJCYXNlIHtcblxuICAgIC8vL1xuICAgIC8vLyBGaWVsZCBkZWNsYXJhdGlvbnNcbiAgICAvLy9cbiAgICBwcm90ZWN0ZWQgYWJzdHJhY3QgX2xheWVyczogTWFwPG51bWJlciwgUHJvbWlzZTxMYXllcj4+O1xuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIEdvb2dsZUxheWVyQmFzZS5cbiAgICAgKiBAcGFyYW0gX21hcFNlcnZpY2UgLSBDb25jcmV0ZSB7QGxpbmsgTWFwU2VydmljZX0gaW1wbGVtZW50YXRpb24gZm9yIEdvb2dsZSBNYXBzLlxuICAgICAqIEFuIGluc3RhbmNlIG9mIHtAbGluayBHb29nbGVNYXBTZXJ2aWNlfS5cbiAgICAgKiBAcGFyYW0gX3pvbmUgLSBOZ1pvbmUgaW5zdGFuY2UgdG8gcHJvdmlkZSB6b25lIGF3YXJlIHByb21pc2VzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUxheWVyQmFzZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfbWFwU2VydmljZTogTWFwU2VydmljZSwgcHJvdGVjdGVkIF96b25lOiBOZ1pvbmUpIHsgfVxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGF5ZXIgdG8gdGhlIG1hcC5cbiAgICAgKlxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBwYXJhbSBsYXllciAtIE1hcExheWVyRGlyZWN0aXZlIGNvbXBvbmVudCBvYmplY3QuXG4gICAgICogR2VuZXJhbGx5LCBNYXBMYXllckRpcmVjdGl2ZSB3aWxsIGJlIGluamVjdGVkIHdpdGggYW4gaW5zdGFuY2Ugb2YgdGhlXG4gICAgICogTGF5ZXJTZXJ2aWNlIGFuZCB0aGVuIHNlbGYgcmVnaXN0ZXIgb24gaW5pdGlhbGl6YXRpb24uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTGF5ZXJCYXNlXG4gICAgICovXG4gICAgcHVibGljIGFic3RyYWN0IEFkZExheWVyKGxheWVyOiBNYXBMYXllckRpcmVjdGl2ZSk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVzIHRoZSBsYXllclxuICAgICAqXG4gICAgICogQHBhcmFtIGxheWVyIC0gTWFwTGF5ZXJEaXJlY3RpdmUgY29tcG9uZW50IG9iamVjdCBmb3Igd2hpY2ggdG8gcmV0cmlldmUgdGhlIGxheWVyLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgaXMgZnVsbGZpbGxlZCB3aGVuIHRoZSBsYXllciBoYXMgYmVlbiByZW1vdmVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUxheWVyQmFzZVxuICAgICAqL1xuICAgIHB1YmxpYyBEZWxldGVMYXllcihsYXllcjogTWFwTGF5ZXJEaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgbCA9IHRoaXMuX2xheWVycy5nZXQobGF5ZXIuSWQpO1xuICAgICAgICBpZiAobCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGwudGhlbigobDE6IExheWVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGwxLkRlbGV0ZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xheWVycy5kZWxldGUobGF5ZXIuSWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIExheWVyIG1vZGVsIHJlcHJlc2VudGVkIGJ5IHRoaXMgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBNYXBMYXllckRpcmVjdGl2ZSBjb21wb25lbnQgb2JqZWN0IG9yIGxheWVyIGlkIGZvciB3aGljaCB0byByZXRyaWV2ZSB0aGUgbGF5ZXIgbW9kZWwuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIHJlc29sdmVkIGNvbnRhaW5zIHRoZSBMYXllciBtb2RlbC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVMYXllckJhc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0TmF0aXZlTGF5ZXIobGF5ZXI6IE1hcExheWVyRGlyZWN0aXZlfG51bWJlcik6IFByb21pc2U8TGF5ZXI+IHtcbiAgICAgICAgbGV0IHA6IFByb21pc2U8TGF5ZXI+ID0gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZihsYXllcikgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBwID0gdGhpcy5fbGF5ZXJzLmdldChsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwID0gdGhpcy5fbGF5ZXJzLmdldCgoPE1hcExheWVyRGlyZWN0aXZlPmxheWVyKS5JZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG1hcmtlciBpbiB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBUaGUgSWQgb2YgdGhlIGxheWVyIGluIHdoaWNoIHRvIGNyZWF0ZSB0aGUgbWFya2VyLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0ge0BsaW5rIElNYXJrZXJPcHRpb25zfSBvYmplY3QgY29udGFpbmluZyB0aGUgbWFya2VyIHByb3BlcnRpZXMuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIHtAbGluayBNYXJrZXJ9IG1vZGVsIGZvciB0aGUgY3JlYXRlZCBtYXJrZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTGF5ZXJCYXNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZU1hcmtlcihsYXllcjogbnVtYmVyLCBvcHRpb25zOiBJTWFya2VyT3B0aW9ucyk6IFByb21pc2U8TWFya2VyPiB7XG4gICAgICAgIGNvbnN0IG1wOiBQcm9taXNlPEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcD4gPSB0aGlzLl9tYXBTZXJ2aWNlLk1hcFByb21pc2U7XG4gICAgICAgIGNvbnN0IGxwOiBQcm9taXNlPExheWVyPiA9IHRoaXMuX2xheWVycy5nZXQobGF5ZXIpO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbbXAsIGxwXSkudGhlbigoW21hcCwgbF0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSAoeDogR29vZ2xlTWFwVHlwZXMuTWFya2VyT3B0aW9ucyk6IEdvb2dsZU1hcmtlciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih4KTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5tZXRhZGF0YSkgeyBvcHRpb25zLm1ldGFkYXRhLmZvckVhY2goKHZhbDogYW55LCBrZXk6IHN0cmluZykgPT4gbWFya2VyLk1ldGFkYXRhLnNldChrZXksIHZhbCkpOyB9XG4gICAgICAgICAgICAgICAgbWFya2VyLnNldE1hcChtYXApO1xuICAgICAgICAgICAgICAgIGNvbnN0IG0gPSBuZXcgR29vZ2xlTWFya2VyKG1hcmtlcik7XG4gICAgICAgICAgICAgICAgbS5Jc0ZpcnN0ID0gb3B0aW9ucy5pc0ZpcnN0O1xuICAgICAgICAgICAgICAgIG0uSXNMYXN0ID0gb3B0aW9ucy5pc0xhc3Q7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubWV0YWRhdGEpIHsgb3B0aW9ucy5tZXRhZGF0YS5mb3JFYWNoKCh2YWw6IGFueSwga2V5OiBzdHJpbmcpID0+IG0uTWV0YWRhdGEuc2V0KGtleSwgdmFsKSk7IH1cbiAgICAgICAgICAgICAgICBsLkFkZEVudGl0eShtKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCBvOiBHb29nbGVNYXBUeXBlcy5NYXJrZXJPcHRpb25zID0gR29vZ2xlQ29udmVyc2lvbnMuVHJhbnNsYXRlTWFya2VyT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmljb25JbmZvICYmIG9wdGlvbnMuaWNvbkluZm8ubWFya2VyVHlwZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBNYXJrZXIuQ3JlYXRlTWFya2VyKG9wdGlvbnMuaWNvbkluZm8pO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YocykgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIG8uaWNvbiA9IHM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXlsb2FkKG8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHMudGhlbih4ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG8uaWNvbiA9IHguaWNvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXlsb2FkKG8pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF5bG9hZChvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBvZiB1bmJvdW5kIG1hcmtlcnMuIFVzZSB0aGlzIG1ldGhvZCB0byBjcmVhdGUgYXJyYXlzIG9mIG1hcmtlcnMgdG8gYmUgdXNlZCBpbiBidWxrXG4gICAgICogb3BlcmF0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gTWFya2VyIG9wdGlvbnMgZGVmaW5pbmcgdGhlIG1hcmtlcnMuXG4gICAgICogQHBhcmFtIG1hcmtlckljb24gLSBPcHRpb25hbCBpbmZvcm1hdGlvbiB0byBnZW5lcmF0ZSBjdXN0b20gbWFya2Vycy4gVGhpcyB3aWxsIGJlIGFwcGxpZWQgdG8gYWxsIG1hcmtlcnMuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGFuIGFycmF5cyBvZiB0aGUgTWFya2VyIG1vZGVscy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVMYXllckJhc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlTWFya2VycyhvcHRpb25zOiBBcnJheTxJTWFya2VyT3B0aW9ucz4sIG1hcmtlckljb24/OiBJTWFya2VySWNvbkluZm8pOiBQcm9taXNlPEFycmF5PE1hcmtlcj4+IHtcbiAgICAgICAgY29uc3QgcGF5bG9hZCA9IChpY29uOiBzdHJpbmcpOiBBcnJheTxHb29nbGVNYXJrZXI+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hcmtlcnM6IEFycmF5PEdvb2dsZU1hcmtlcj4gPSBvcHRpb25zLm1hcChtbyA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbzogR29vZ2xlTWFwVHlwZXMuTWFya2VyT3B0aW9ucyA9IEdvb2dsZUNvbnZlcnNpb25zLlRyYW5zbGF0ZU1hcmtlck9wdGlvbnMobW8pO1xuICAgICAgICAgICAgICAgIGlmIChpY29uICYmIGljb24gIT09ICcnKSB7IG8uaWNvbiA9IGljb247IH1cbiAgICAgICAgICAgICAgICBjb25zdCBwdXNocGluID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcihvKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXJrZXI6IEdvb2dsZU1hcmtlciA9IG5ldyBHb29nbGVNYXJrZXIocHVzaHBpbik7XG4gICAgICAgICAgICAgICAgbWFya2VyLklzRmlyc3QgPSBtby5pc0ZpcnN0O1xuICAgICAgICAgICAgICAgIG1hcmtlci5Jc0xhc3QgPSBtby5pc0xhc3Q7XG4gICAgICAgICAgICAgICAgaWYgKG1vLm1ldGFkYXRhKSB7IG1vLm1ldGFkYXRhLmZvckVhY2goKHZhbDogYW55LCBrZXk6IHN0cmluZykgPT4gbWFya2VyLk1ldGFkYXRhLnNldChrZXksIHZhbCkpOyB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcmtlcjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG1hcmtlcnM7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHA6IFByb21pc2U8QXJyYXk8TWFya2VyPj4gPSBuZXcgUHJvbWlzZTxBcnJheTxNYXJrZXI+PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpZiAobWFya2VySWNvbiAmJiBtYXJrZXJJY29uLm1hcmtlclR5cGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gTWFya2VyLkNyZWF0ZU1hcmtlcihtYXJrZXJJY29uKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mKHMpID09PSAnc3RyaW5nJykgeyByZXNvbHZlKHBheWxvYWQocykpOyB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzLnRoZW4oeCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHBheWxvYWQoeC5pY29uKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUgKHBheWxvYWQobnVsbCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFByb3RlY3RlZCBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBsYXllciBiYXNlZCBvbiBpdHMgaWQuXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICogQHBhcmFtIGlkIC0gTGF5ZXIgSWQuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIHtAbGluayBMYXllcn0gbW9kZWwgZm9yIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVMYXllckJhc2VcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgR2V0TGF5ZXJCeUlkKGlkOiBudW1iZXIpOiBQcm9taXNlPExheWVyPiB7XG4gICAgICAgIGxldCBwOiBQcm9taXNlPExheWVyPjtcbiAgICAgICAgdGhpcy5fbGF5ZXJzLmZvckVhY2goKGw6IFByb21pc2U8TGF5ZXI+LCBrOiBudW1iZXIpID0+IHsgaWYgKGsgPT09IGlkKSB7IHAgPSBsOyB9IH0pO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG5cbn1cbiJdfQ==