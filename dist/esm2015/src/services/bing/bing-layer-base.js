import { Marker } from '../../models/marker';
import { BingMarker } from '../../models/bing/bing-marker';
import { BingConversions } from './bing-conversions';
/**
 * This abstract partially implements the contract for the {@link LayerService}
 * and {@link ClusterService} for the Bing Maps V8 archtiecture. It serves
 * as the base class for basic layer ({@link BingLayerService}) and cluster layer ({@link BingClusterLayer}).
 *
 * @export
 * @abstract
 */
export class BingLayerBase {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingLayerBase.
     * @param _mapService - Concrete {@link MapService} implementation for Bing Maps V8. An instance of {@link BingMapService}.
     *
     * @memberof BingLayerBase
     */
    constructor(_mapService, _zone) {
        this._mapService = _mapService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._layers = new Map();
    }
    /**
     * Creates a marker in the layer.
     *
     * @param layer - The Id of the layer in which to create the marker.
     * @param options - {@link IMarkerOptions} object containing the marker properties.
     * @returns - A promise that when fullfilled contains the {@link Marker} model for the created marker.
     *
     * @memberof BingLayerBase
     */
    CreateMarker(layer, options) {
        const payload = (icon, l) => {
            const loc = BingConversions.TranslateLocation(options.position);
            const o = BingConversions.TranslateMarkerOptions(options);
            if (icon && icon !== '') {
                o.icon = icon;
            }
            const pushpin = new Microsoft.Maps.Pushpin(loc, o);
            const marker = new BingMarker(pushpin, null, l.NativePrimitve);
            marker.IsFirst = options.isFirst;
            marker.IsLast = options.isLast;
            if (options.metadata) {
                options.metadata.forEach((v, k) => marker.Metadata.set(k, v));
            }
            l.AddEntity(marker);
            return marker;
        };
        const p = this.GetLayerById(layer);
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            if (options.iconInfo && options.iconInfo.markerType) {
                const s = Marker.CreateMarker(options.iconInfo);
                if (typeof (s) === 'string') {
                    return (payload(s, l));
                }
                else {
                    return s.then(x => {
                        return (payload(x.icon, l));
                    });
                }
            }
            else {
                return (payload(null, l));
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
     * @memberof BingLayerBase
     */
    CreateMarkers(options, markerIcon) {
        const payload = (icon, op) => {
            const markers = op.map(mo => {
                let s;
                const o = BingConversions.TranslateMarkerOptions(mo);
                if (icon && icon !== '') {
                    s = icon;
                }
                else if (o.icon) {
                    s = o.icon;
                }
                if (o.icon) {
                    delete o.icon;
                }
                const loc = BingConversions.TranslateLocation(mo.position);
                const pushpin = new Microsoft.Maps.Pushpin(loc, o);
                const img = Marker.GetImageForMarker(s);
                if (img != null) {
                    pushpin.image = img;
                }
                const marker = new BingMarker(pushpin, null, null);
                marker.IsFirst = mo.isFirst;
                marker.IsLast = mo.isLast;
                if (mo.metadata) {
                    mo.metadata.forEach((v, k) => marker.Metadata.set(k, v));
                }
                return marker;
            });
            return markers;
        };
        const p = new Promise((resolve, reject) => {
            if (markerIcon && markerIcon.markerType) {
                const s = Marker.CreateMarker(markerIcon);
                if (typeof (s) === 'string') {
                    resolve(payload(s, options));
                }
                else {
                    return s.then(x => {
                        resolve(payload(x.icon, options));
                    });
                }
            }
            else {
                resolve(payload(null, options));
            }
        });
        return p;
    }
    /**
     * Deletes the layer
     *
     * @param layer - MapLayerDirective component object for which to retrieve the layer.
     * @returns - A promise that is fullfilled when the layer has been removed.
     *
     * @memberof BingLayerBase
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
     * @param layer - MapLayerDirective component object or Layer Id for which to retrieve the layer model.
     * @returns - A promise that when resolved contains the Layer model.
     *
     * @memberof BingLayerBase
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
     * @memberof BingLayerBase
     */
    GetLayerById(id) {
        let p;
        this._layers.forEach((l, k) => { if (k === id) {
            p = l;
        } });
        return p;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1sYXllci1iYXNlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL3NlcnZpY2VzL2JpbmcvYmluZy1sYXllci1iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUM3QyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFPM0QsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBRXJEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLE9BQWdCLGFBQWE7SUFRL0IsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7Ozs7O09BS0c7SUFDSCxZQUFzQixXQUF1QixFQUFZLEtBQWE7UUFBaEQsZ0JBQVcsR0FBWCxXQUFXLENBQVk7UUFBWSxVQUFLLEdBQUwsS0FBSyxDQUFRO1FBaEJ0RSxHQUFHO1FBQ0gsc0JBQXNCO1FBQ3RCLEdBQUc7UUFFTyxZQUFPLEdBQWdDLElBQUksR0FBRyxFQUEwQixDQUFDO0lBWVQsQ0FBQztJQWtCM0U7Ozs7Ozs7O09BUUc7SUFDSSxZQUFZLENBQUMsS0FBYSxFQUFFLE9BQXVCO1FBQ3RELE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBWSxFQUFFLENBQVEsRUFBYyxFQUFFO1lBQ25ELE1BQU0sR0FBRyxHQUE0QixlQUFlLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sQ0FBQyxHQUFtQyxlQUFlLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDMUYsSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRTtnQkFBRSxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzthQUFFO1lBQzNDLE1BQU0sT0FBTyxHQUEyQixJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FB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QUFDLEVBQVU7UUFDN0IsSUFBSSxDQUFpQixDQUFDO1FBQ3RCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBaUIsRUFBRSxDQUFTLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7U0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLE9BQU8sQ0FBQyxDQUFDO0lBQ2IsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBJTWFya2VyT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaW1hcmtlci1vcHRpb25zJztcbmltcG9ydCB7IElNYXJrZXJJY29uSW5mbyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaW1hcmtlci1pY29uLWluZm8nO1xuaW1wb3J0IHsgTWFya2VyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcmtlcic7XG5pbXBvcnQgeyBCaW5nTWFya2VyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2JpbmcvYmluZy1tYXJrZXInO1xuaW1wb3J0IHsgTGF5ZXIgfSBmcm9tICcuLi8uLi9tb2RlbHMvbGF5ZXInO1xuaW1wb3J0IHsgTWFya2VyVHlwZUlkIH0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcmtlci10eXBlLWlkJztcbmltcG9ydCB7IE1hcFNlcnZpY2UgfSBmcm9tICcuLi9tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBNYXBMYXllckRpcmVjdGl2ZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvbWFwLWxheWVyJztcbmltcG9ydCB7IExheWVyU2VydmljZSB9IGZyb20gJy4uL2xheWVyLnNlcnZpY2UnO1xuaW1wb3J0IHsgQmluZ01hcFNlcnZpY2UgfSBmcm9tICcuL2JpbmctbWFwLnNlcnZpY2UnO1xuaW1wb3J0IHsgQmluZ0NvbnZlcnNpb25zIH0gZnJvbSAnLi9iaW5nLWNvbnZlcnNpb25zJztcblxuLyoqXG4gKiBUaGlzIGFic3RyYWN0IHBhcnRpYWxseSBpbXBsZW1lbnRzIHRoZSBjb250cmFjdCBmb3IgdGhlIHtAbGluayBMYXllclNlcnZpY2V9XG4gKiBhbmQge0BsaW5rIENsdXN0ZXJTZXJ2aWNlfSBmb3IgdGhlIEJpbmcgTWFwcyBWOCBhcmNodGllY3R1cmUuIEl0IHNlcnZlc1xuICogYXMgdGhlIGJhc2UgY2xhc3MgZm9yIGJhc2ljIGxheWVyICh7QGxpbmsgQmluZ0xheWVyU2VydmljZX0pIGFuZCBjbHVzdGVyIGxheWVyICh7QGxpbmsgQmluZ0NsdXN0ZXJMYXllcn0pLlxuICpcbiAqIEBleHBvcnRcbiAqIEBhYnN0cmFjdFxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmluZ0xheWVyQmFzZSB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG5cbiAgICBwcm90ZWN0ZWQgX2xheWVyczogTWFwPG51bWJlciwgUHJvbWlzZTxMYXllcj4+ID0gbmV3IE1hcDxudW1iZXIsIFByb21pc2U8TGF5ZXI+PigpO1xuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIEJpbmdMYXllckJhc2UuXG4gICAgICogQHBhcmFtIF9tYXBTZXJ2aWNlIC0gQ29uY3JldGUge0BsaW5rIE1hcFNlcnZpY2V9IGltcGxlbWVudGF0aW9uIGZvciBCaW5nIE1hcHMgVjguIEFuIGluc3RhbmNlIG9mIHtAbGluayBCaW5nTWFwU2VydmljZX0uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0xheWVyQmFzZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfbWFwU2VydmljZTogTWFwU2VydmljZSwgcHJvdGVjdGVkIF96b25lOiBOZ1pvbmUpIHsgfVxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGF5ZXIgdG8gdGhlIG1hcC5cbiAgICAgKlxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBwYXJhbSBsYXllciAtIE1hcExheWVyRGlyZWN0aXZlIGNvbXBvbmVudCBvYmplY3QuXG4gICAgICogR2VuZXJhbGx5LCBNYXBMYXllckRpcmVjdGl2ZSB3aWxsIGJlIGluamVjdGVkIHdpdGggYW4gaW5zdGFuY2Ugb2YgdGhlXG4gICAgICogTGF5ZXJTZXJ2aWNlIGFuZCB0aGVuIHNlbGYgcmVnaXN0ZXIgb24gaW5pdGlhbGl6YXRpb24uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0xheWVyQmFzZVxuICAgICAqL1xuICAgIHB1YmxpYyBhYnN0cmFjdCBBZGRMYXllcihsYXllcjogTWFwTGF5ZXJEaXJlY3RpdmUpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG1hcmtlciBpbiB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBUaGUgSWQgb2YgdGhlIGxheWVyIGluIHdoaWNoIHRvIGNyZWF0ZSB0aGUgbWFya2VyLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0ge0BsaW5rIElNYXJrZXJPcHRpb25zfSBvYmplY3QgY29udGFpbmluZyB0aGUgbWFya2VyIHByb3BlcnRpZXMuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIHtAbGluayBNYXJrZXJ9IG1vZGVsIGZvciB0aGUgY3JlYXRlZCBtYXJrZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0xheWVyQmFzZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVNYXJrZXIobGF5ZXI6IG51bWJlciwgb3B0aW9uczogSU1hcmtlck9wdGlvbnMpOiBQcm9taXNlPE1hcmtlcj4ge1xuICAgICAgICBjb25zdCBwYXlsb2FkID0gKGljb246IHN0cmluZywgbDogTGF5ZXIpOiBCaW5nTWFya2VyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxvYzogTWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24gPSBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlTG9jYXRpb24ob3B0aW9ucy5wb3NpdGlvbik7XG4gICAgICAgICAgICBjb25zdCBvOiBNaWNyb3NvZnQuTWFwcy5JUHVzaHBpbk9wdGlvbnMgPSBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlTWFya2VyT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgICAgIGlmIChpY29uICYmIGljb24gIT09ICcnKSB7IG8uaWNvbiA9IGljb247IH1cbiAgICAgICAgICAgIGNvbnN0IHB1c2hwaW46IE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4gPSBuZXcgTWljcm9zb2Z0Lk1hcHMuUHVzaHBpbihsb2MsIG8pO1xuICAgICAgICAgICAgY29uc3QgbWFya2VyOiBCaW5nTWFya2VyID0gbmV3IEJpbmdNYXJrZXIocHVzaHBpbiwgbnVsbCwgbC5OYXRpdmVQcmltaXR2ZSk7XG4gICAgICAgICAgICBtYXJrZXIuSXNGaXJzdCA9IG9wdGlvbnMuaXNGaXJzdDtcbiAgICAgICAgICAgIG1hcmtlci5Jc0xhc3QgPSBvcHRpb25zLmlzTGFzdDtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLm1ldGFkYXRhKSB7IG9wdGlvbnMubWV0YWRhdGEuZm9yRWFjaCgodiwgaykgPT4gbWFya2VyLk1ldGFkYXRhLnNldChrLCB2KSk7IH1cbiAgICAgICAgICAgIGwuQWRkRW50aXR5KG1hcmtlcik7XG4gICAgICAgICAgICByZXR1cm4gbWFya2VyO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBwOiBQcm9taXNlPExheWVyPiA9IHRoaXMuR2V0TGF5ZXJCeUlkKGxheWVyKTtcbiAgICAgICAgaWYgKHAgPT0gbnVsbCkgeyB0aHJvdyAobmV3IEVycm9yKGBMYXllciB3aXRoIGlkICR7bGF5ZXJ9IG5vdCBmb3VuZCBpbiBMYXllciBNYXBgKSk7IH1cbiAgICAgICAgcmV0dXJuIHAudGhlbigobDogTGF5ZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmljb25JbmZvICYmIG9wdGlvbnMuaWNvbkluZm8ubWFya2VyVHlwZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBNYXJrZXIuQ3JlYXRlTWFya2VyKG9wdGlvbnMuaWNvbkluZm8pO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YocykgPT09ICdzdHJpbmcnKSB7IHJldHVybihwYXlsb2FkKHMsIGwpKTsgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcy50aGVuKHggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuKHBheWxvYWQoeC5pY29uLCBsKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAocGF5bG9hZChudWxsLCBsKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdW5ib3VuZCBtYXJrZXJzLiBVc2UgdGhpcyBtZXRob2QgdG8gY3JlYXRlIGFycmF5cyBvZiBtYXJrZXJzIHRvIGJlIHVzZWQgaW4gYnVsa1xuICAgICAqIG9wZXJhdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIE1hcmtlciBvcHRpb25zIGRlZmluaW5nIHRoZSBtYXJrZXJzLlxuICAgICAqIEBwYXJhbSBtYXJrZXJJY29uIC0gT3B0aW9uYWwgaW5mb3JtYXRpb24gdG8gZ2VuZXJhdGUgY3VzdG9tIG1hcmtlcnMuIFRoaXMgd2lsbCBiZSBhcHBsaWVkIHRvIGFsbCBtYXJrZXJzLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiBmdWxsZmlsbGVkIGNvbnRhaW5zIHRoZSBhbiBhcnJheXMgb2YgdGhlIE1hcmtlciBtb2RlbHMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0xheWVyQmFzZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVNYXJrZXJzKG9wdGlvbnM6IEFycmF5PElNYXJrZXJPcHRpb25zPiwgbWFya2VySWNvbj86IElNYXJrZXJJY29uSW5mbyk6IFByb21pc2U8QXJyYXk8TWFya2VyPj4ge1xuICAgICAgICBjb25zdCBwYXlsb2FkID0gKGljb246IHN0cmluZywgb3A6IEFycmF5PElNYXJrZXJPcHRpb25zPik6IEFycmF5PEJpbmdNYXJrZXI+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hcmtlcnM6IEFycmF5PEJpbmdNYXJrZXI+ID0gb3AubWFwKG1vID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgczogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGNvbnN0IG86IE1pY3Jvc29mdC5NYXBzLklQdXNocGluT3B0aW9ucyA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVNYXJrZXJPcHRpb25zKG1vKTtcbiAgICAgICAgICAgICAgICBpZiAoaWNvbiAmJiBpY29uICE9PSAnJyApIHsgcyA9IGljb247IH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChvLmljb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcyA9IG8uaWNvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG8uaWNvbikgeyBkZWxldGUgby5pY29uOyB9XG4gICAgICAgICAgICAgICAgY29uc3QgbG9jOiBNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbiA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVMb2NhdGlvbihtby5wb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgY29uc3QgcHVzaHBpbjogTWljcm9zb2Z0Lk1hcHMuUHVzaHBpbiA9IG5ldyBNaWNyb3NvZnQuTWFwcy5QdXNocGluKGxvYywgbyk7XG4gICAgICAgICAgICAgICAgY29uc3QgaW1nID0gTWFya2VyLkdldEltYWdlRm9yTWFya2VyKHMpO1xuICAgICAgICAgICAgICAgIGlmIChpbWcgIT0gbnVsbCkgeyAoPGFueT5wdXNocGluKS5pbWFnZSA9IGltZzsgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgbWFya2VyOiBCaW5nTWFya2VyID0gbmV3IEJpbmdNYXJrZXIocHVzaHBpbiwgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgbWFya2VyLklzRmlyc3QgPSBtby5pc0ZpcnN0O1xuICAgICAgICAgICAgICAgIG1hcmtlci5Jc0xhc3QgPSBtby5pc0xhc3Q7XG4gICAgICAgICAgICAgICAgaWYgKG1vLm1ldGFkYXRhKSB7IG1vLm1ldGFkYXRhLmZvckVhY2goKHYsIGspID0+IG1hcmtlci5NZXRhZGF0YS5zZXQoaywgdikpOyB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcmtlcjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG1hcmtlcnM7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHA6IFByb21pc2U8QXJyYXk8TWFya2VyPj4gPSBuZXcgUHJvbWlzZTxBcnJheTxNYXJrZXI+PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpZiAobWFya2VySWNvbiAmJiBtYXJrZXJJY29uLm1hcmtlclR5cGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gTWFya2VyLkNyZWF0ZU1hcmtlcihtYXJrZXJJY29uKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mKHMpID09PSAnc3RyaW5nJykgeyByZXNvbHZlKHBheWxvYWQocywgb3B0aW9ucykpOyB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzLnRoZW4oeCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHBheWxvYWQoeC5pY29uLCBvcHRpb25zKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUocGF5bG9hZChudWxsLCBvcHRpb25zKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVzIHRoZSBsYXllclxuICAgICAqXG4gICAgICogQHBhcmFtIGxheWVyIC0gTWFwTGF5ZXJEaXJlY3RpdmUgY29tcG9uZW50IG9iamVjdCBmb3Igd2hpY2ggdG8gcmV0cmlldmUgdGhlIGxheWVyLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgaXMgZnVsbGZpbGxlZCB3aGVuIHRoZSBsYXllciBoYXMgYmVlbiByZW1vdmVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdMYXllckJhc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgRGVsZXRlTGF5ZXIobGF5ZXI6IE1hcExheWVyRGlyZWN0aXZlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGwgPSB0aGlzLl9sYXllcnMuZ2V0KGxheWVyLklkKTtcbiAgICAgICAgaWYgKGwgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsLnRoZW4oKGwxOiBMYXllcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBsMS5EZWxldGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYXllcnMuZGVsZXRlKGxheWVyLklkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBMYXllciBtb2RlbCByZXByZXNlbnRlZCBieSB0aGlzIGxheWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGxheWVyIC0gTWFwTGF5ZXJEaXJlY3RpdmUgY29tcG9uZW50IG9iamVjdCBvciBMYXllciBJZCBmb3Igd2hpY2ggdG8gcmV0cmlldmUgdGhlIGxheWVyIG1vZGVsLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiByZXNvbHZlZCBjb250YWlucyB0aGUgTGF5ZXIgbW9kZWwuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0xheWVyQmFzZVxuICAgICAqL1xuICAgIHB1YmxpYyBHZXROYXRpdmVMYXllcihsYXllcjogTWFwTGF5ZXJEaXJlY3RpdmV8bnVtYmVyKTogUHJvbWlzZTxMYXllcj4ge1xuICAgICAgICBsZXQgcDogUHJvbWlzZTxMYXllcj4gPSBudWxsO1xuICAgICAgICBpZiAodHlwZW9mKGxheWVyKSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHAgPSB0aGlzLl9sYXllcnMuZ2V0KGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHAgPSB0aGlzLl9sYXllcnMuZ2V0KCg8TWFwTGF5ZXJEaXJlY3RpdmU+bGF5ZXIpLklkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHJvdGVjdGVkIG1ldGhvZHNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGxheWVyIGJhc2VkIG9uIGl0cyBpZC5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKiBAcGFyYW0gaWQgLSBMYXllciBJZC5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IHdoZW4gZnVsbGZpbGxlZCBjb250YWlucyB0aGUge0BsaW5rIExheWVyfSBtb2RlbCBmb3IgdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdMYXllckJhc2VcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgR2V0TGF5ZXJCeUlkKGlkOiBudW1iZXIpOiBQcm9taXNlPExheWVyPiB7XG4gICAgICAgIGxldCBwOiBQcm9taXNlPExheWVyPjtcbiAgICAgICAgdGhpcy5fbGF5ZXJzLmZvckVhY2goKGw6IFByb21pc2U8TGF5ZXI+LCBrOiBudW1iZXIpID0+IHsgaWYgKGsgPT09IGlkKSB7IHAgPSBsOyB9IH0pO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG5cbn1cbiJdfQ==