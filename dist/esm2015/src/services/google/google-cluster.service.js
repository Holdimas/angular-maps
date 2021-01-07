import { Injectable, NgZone } from '@angular/core';
import { Marker } from '../../models/marker';
import { MarkerTypeId } from '../../models/marker-type-id';
import { ClusterClickAction } from '../../models/cluster-click-action';
import { MapService } from '../map.service';
import { GoogleLayerBase } from './google-layer-base';
export class GoogleClusterService extends GoogleLayerBase {
    ///
    /// Constructors
    ///
    /**
     * Creates an instance of GoogleClusterService.
     * @param _mapService
     * @param _zone
     * @memberof GoogleClusterService
     */
    constructor(_mapService, _zone) {
        super(_mapService, _zone);
        ///
        /// Field declarations
        ///
        this._layers = new Map();
        this._layerStyles = new Map();
    }
    ///
    /// Static methods
    ///
    /**
     * Creates the cluster icon from the styles
     *
     * @param styles
     * @returns - Promise that when resolved contains an Array of IClusterIconInfo objects
     * containing the hydrated cluster icons.
     * @memberof GoogleClusterService
     */
    static CreateClusterIcons(styles) {
        const i = new Promise((resolve, reject) => {
            const pa = new Array();
            styles.forEach((style, index) => {
                if (style.iconInfo) {
                    const s = Marker.CreateMarker(style.iconInfo);
                    if (typeof (s) === 'string') {
                        style.url = s;
                        if (style.width == null) {
                            style.width = style.iconInfo.size.width;
                            style.height = style.iconInfo.size.height;
                        }
                        if (style.iconInfo.markerOffsetRatio && style.iconInfo.size && style.anchor == null) {
                            const o = style.iconInfo;
                            style.anchor = [
                                o.size.width * o.markerOffsetRatio.x,
                                o.size.height * o.markerOffsetRatio.y
                            ];
                        }
                        delete style.iconInfo;
                    }
                    else {
                        s.then(x => {
                            style.url = x.icon;
                            if (style.width == null) {
                                style.width = x.iconInfo.size.width;
                                style.height = x.iconInfo.size.height;
                            }
                            if (x.iconInfo.markerOffsetRatio && x.iconInfo.size && style.anchor == null) {
                                const o = x.iconInfo;
                                style.anchor = [
                                    o.size.width * o.markerOffsetRatio.x,
                                    o.size.height * o.markerOffsetRatio.y
                                ];
                            }
                            delete style.iconInfo;
                        });
                        pa.push(s);
                    }
                }
            });
            if (pa.length === 0) {
                resolve(styles);
            }
            else {
                Promise.all(pa).then(() => {
                    resolve(styles);
                });
            }
        });
        return i;
    }
    /**
     * Adds the cluster layer to the map
     *
     * @param layer
     * @memberof GoogleClusterService
     */
    AddLayer(layer) {
        const options = {
            id: layer.Id,
            visible: layer.Visible,
            clusteringEnabled: layer.ClusteringEnabled,
            zoomOnClick: layer.ClusterClickAction === ClusterClickAction.ZoomIntoCluster
        };
        if (layer.GridSize) {
            options.gridSize = layer.GridSize;
        }
        if (layer.MinimumClusterSize) {
            options.minimumClusterSize = layer.MinimumClusterSize;
        }
        if (layer.Styles) {
            options.styles = layer.Styles;
        }
        if (layer.UseDynamicSizeMarkers) {
            options.styles = null;
            // do not to attempt to setup styles here as the dynamic call back will generate them.
        }
        else {
            options.styles = [{
                    height: 30,
                    width: 35,
                    textColor: 'white',
                    textSize: 11,
                    backgroundPosition: 'center',
                    iconInfo: {
                        markerType: MarkerTypeId.FontMarker,
                        fontName: 'FontAwesome',
                        fontSize: 30,
                        color: 'green',
                        text: '\uF111'
                    }
                }];
        }
        const dynamicClusterCallback = (markers, numStyles, clusterer) => {
            // dynamically ensure that the necessary style for this cluster icon exists and
            // the clusterer is already hooked up to the styles array via pointer, so we only
            // need to update the style. Since the clusterer re-renders a cluster icon is the
            // the marker count changes, we will only need to retain the current icon as opposed
            // to all cluster icon.
            const styles = this._layerStyles.get(layer.Id);
            const iconInfo = {
                markerType: MarkerTypeId.None
            };
            const icon = layer.CustomMarkerCallback(markers, iconInfo);
            styles[0] = {
                url: `\"data:image/svg+xml;utf8,${icon}\"`,
                height: iconInfo.size.height,
                width: iconInfo.size.width,
                textColor: 'white',
                textSize: 11,
                backgroundPosition: 'center',
            };
            return {
                text: markers.length.toString(),
                index: 1
            };
        };
        const resetStyles = (clusterer) => {
            if (this._layerStyles.has(layer.Id)) {
                this._layerStyles.get(layer.Id).splice(0);
            }
            else {
                const styles = new Array();
                styles.push({});
                this._layerStyles.set(layer.Id, styles);
                clusterer.setStyles(styles);
                // this is important for dynamic styles as the pointer to this array gets passed
                // around key objects in the clusterer. Therefore, it must be initialized here in order for
                // updates to the styles to be visible.
                // also, we need to add at least one style to prevent the default styles from being picked up.
            }
        };
        const layerPromise = this._mapService.CreateClusterLayer(options);
        this._layers.set(layer.Id, layerPromise);
        layerPromise.then(l => {
            const clusterer = l.NativePrimitve;
            if (options.styles) {
                const s = GoogleClusterService.CreateClusterIcons(options.styles);
                s.then(x => {
                    clusterer.setStyles(x);
                });
            }
            else {
                resetStyles(clusterer);
                this._mapService.MapPromise.then((m) => {
                    m.addListener('zoom_changed', () => {
                        resetStyles(clusterer);
                    });
                });
                clusterer.setCalculator((m, n) => {
                    return dynamicClusterCallback(m, n, clusterer);
                });
            }
        });
    }
    /**
     * Create a marker in the cluster
     *
     * @param layer
     * @param options
     * @memberof GoogleClusterService
     */
    CreateMarker(layer, options) {
        const p = this.GetLayerById(layer);
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            return this._mapService.CreateMarker(options)
                .then((marker) => {
                marker.IsFirst = options.isFirst;
                marker.IsLast = options.isLast;
                l.AddEntity(marker);
                return marker;
            });
        });
    }
    /**
     * Starts the clustering
     *
     * @param layer
     * @memberof GoogleClusterService
     */
    StartClustering(layer) {
        return Promise.resolve();
    }
    /**
     * Stops the clustering
     *
     * @param layer
     * @memberof GoogleClusterService
     */
    StopClustering(layer) {
        return Promise.resolve();
    }
    /**
     * Adds a polygon to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygon.
     * @returns - A promise that when fullfilled contains the an instance of the Polygon model.
     *
     * @memberof GoogleClusterService
     */
    CreatePolygon(layer, options) {
        throw (new Error('Polygons are not supported in clustering layers. You can only use markers.'));
    }
    /**
     * Creates an array of unbound polygons. Use this method to create arrays of polygons to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygons.
     * @returns - A promise that when fullfilled contains the an arrays of the Polygon models.
     *
     * @memberof GoogleClusterService
     */
    CreatePolygons(layer, options) {
        throw (new Error('Polygons are not supported in clustering layers. You can only use markers.'));
    }
    /**
     * Adds a polyline to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the line.
     * @param options - Polyline options defining the line.
     * @returns - A promise that when fullfilled contains the an instance of the Polyline (or an
     * array of polygons for complex paths) model.
     *
     * @memberof GoogleClusterService
     */
    CreatePolyline(layer, options) {
        throw (new Error('Polylines are not supported in clustering layers. You can only use markers.'));
    }
    /**
     * Creates an array of unbound polylines. Use this method to create arrays of polylines to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polylines.
     * @param options - Polyline options defining the polylines.
     * @returns - A promise that when fullfilled contains the an arrays of the Polyline models.
     *
     * @memberof GoogleClusterService
     */
    CreatePolylines(layer, options) {
        throw (new Error('Polylines are not supported in clustering layers. You can only use markers.'));
    }
}
GoogleClusterService.decorators = [
    { type: Injectable }
];
GoogleClusterService.ctorParameters = () => [
    { type: MapService },
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLWNsdXN0ZXIuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9zZXJ2aWNlcy9nb29nbGUvZ29vZ2xlLWNsdXN0ZXIuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUVuRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFFN0MsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQzNELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLG1DQUFtQyxDQUFDO0FBR3ZFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1QyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFRdEQsTUFBTSxPQUFPLG9CQUFxQixTQUFRLGVBQWU7SUF1RXJELEdBQUc7SUFDSCxnQkFBZ0I7SUFDaEIsR0FBRztJQUVIOzs7OztPQUtHO0lBQ0gsWUFBWSxXQUF1QixFQUFFLEtBQWE7UUFDOUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQWhGOUIsR0FBRztRQUNILHNCQUFzQjtRQUN0QixHQUFHO1FBQ08sWUFBTyxHQUFnQyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztRQUN6RSxpQkFBWSxHQUFvRCxJQUFJLEdBQUcsRUFBOEMsQ0FBQztJQTZFaEksQ0FBQztJQTNFRCxHQUFHO0lBQ0gsa0JBQWtCO0lBQ2xCLEdBQUc7SUFFSDs7Ozs7OztPQU9HO0lBQ0ksTUFBTSxDQUFDLGtCQUFrQixDQUFDLE1BQStCO1FBQzVELE1BQU0sQ0FBQyxHQUFxQyxJQUFJLE9BQU8sQ0FBMEIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDakcsTUFBTSxFQUFFLEdBQUcsSUFBSSxLQUFLLEVBQXNELENBQUM7WUFDM0UsTUFBTSxDQUFD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cEcsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNJLGNBQWMsQ0FBQyxLQUFhLEVBQUUsT0FBK0I7UUFDaEUsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLDRFQUE0RSxDQUFDLENBQUMsQ0FBQztJQUNwRyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNJLGNBQWMsQ0FBQyxLQUFhLEVBQUUsT0FBeUI7UUFDMUQsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLDZFQUE2RSxDQUFDLENBQUMsQ0FBQztJQUNyRyxDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0ksZUFBZSxDQUFDLEtBQWEsRUFBRSxPQUFnQztRQUNsRSxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsNkVBQTZFLENBQUMsQ0FBQyxDQUFDO0lBQ3JHLENBQUM7OztZQTFSSixVQUFVOzs7WUFSRixVQUFVO1lBUkUsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbIu+7v2ltcG9ydCB7IElDbHVzdGVySWNvbkluZm8gfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2ljbHVzdGVyLWljb24taW5mbyc7XG5pbXBvcnQgeyBJTWFya2VySWNvbkluZm8gfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2ltYXJrZXItaWNvbi1pbmZvJztcbmltcG9ydCB7IE1hcmtlclNlcnZpY2UgfSBmcm9tICcuLi9tYXJrZXIuc2VydmljZSc7XG5pbXBvcnQgeyBJQ2x1c3Rlck9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2ljbHVzdGVyLW9wdGlvbnMnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBJTWFya2VyT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaW1hcmtlci1vcHRpb25zJztcbmltcG9ydCB7IE1hcmtlciB9IGZyb20gJy4uLy4uL21vZGVscy9tYXJrZXInO1xuaW1wb3J0IHsgTGF5ZXIgfSBmcm9tICcuLi8uLi9tb2RlbHMvbGF5ZXInO1xuaW1wb3J0IHsgTWFya2VyVHlwZUlkIH0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcmtlci10eXBlLWlkJztcbmltcG9ydCB7IENsdXN0ZXJDbGlja0FjdGlvbiB9IGZyb20gJy4uLy4uL21vZGVscy9jbHVzdGVyLWNsaWNrLWFjdGlvbic7XG5pbXBvcnQgeyBDbHVzdGVyTGF5ZXJEaXJlY3RpdmUgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL2NsdXN0ZXItbGF5ZXInO1xuaW1wb3J0IHsgQ2x1c3RlclNlcnZpY2UgfSBmcm9tICcuLi9jbHVzdGVyLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWFwU2VydmljZSB9IGZyb20gJy4uL21hcC5zZXJ2aWNlJztcbmltcG9ydCB7IEdvb2dsZUxheWVyQmFzZSB9IGZyb20gJy4vZ29vZ2xlLWxheWVyLWJhc2UnO1xuaW1wb3J0IHsgSVBvbHlnb25PcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pcG9seWdvbi1vcHRpb25zJztcbmltcG9ydCB7IElQb2x5bGluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lwb2x5bGluZS1vcHRpb25zJztcbmltcG9ydCB7IFBvbHlnb24gfSBmcm9tICcuLi8uLi9tb2RlbHMvcG9seWdvbic7XG5pbXBvcnQgeyBQb2x5bGluZSB9IGZyb20gJy4uLy4uL21vZGVscy9wb2x5bGluZSc7XG5pbXBvcnQgKiBhcyBHb29nbGVNYXBUeXBlcyBmcm9tICcuL2dvb2dsZS1tYXAtdHlwZXMnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgR29vZ2xlQ2x1c3RlclNlcnZpY2UgZXh0ZW5kcyBHb29nbGVMYXllckJhc2UgaW1wbGVtZW50cyBDbHVzdGVyU2VydmljZSB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJvdGVjdGVkIF9sYXllcnM6IE1hcDxudW1iZXIsIFByb21pc2U8TGF5ZXI+PiA9IG5ldyBNYXA8bnVtYmVyLCBQcm9taXNlPExheWVyPj4oKTtcbiAgICBwcm90ZWN0ZWQgX2xheWVyU3R5bGVzOiBNYXA8bnVtYmVyLCBBcnJheTxHb29nbGVNYXBUeXBlcy5DbHVzdGVyU3R5bGU+PiA9IG5ldyBNYXA8bnVtYmVyLCBBcnJheTxHb29nbGVNYXBUeXBlcy5DbHVzdGVyU3R5bGU+PigpO1xuXG4gICAgLy8vXG4gICAgLy8vIFN0YXRpYyBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoZSBjbHVzdGVyIGljb24gZnJvbSB0aGUgc3R5bGVzXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3R5bGVzXG4gICAgICogQHJldHVybnMgLSBQcm9taXNlIHRoYXQgd2hlbiByZXNvbHZlZCBjb250YWlucyBhbiBBcnJheSBvZiBJQ2x1c3Rlckljb25JbmZvIG9iamVjdHNcbiAgICAgKiBjb250YWluaW5nIHRoZSBoeWRyYXRlZCBjbHVzdGVyIGljb25zLlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDbHVzdGVyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgQ3JlYXRlQ2x1c3Rlckljb25zKHN0eWxlczogQXJyYXk8SUNsdXN0ZXJJY29uSW5mbz4pOiBQcm9taXNlPEFycmF5PElDbHVzdGVySWNvbkluZm8+PiB7XG4gICAgICAgIGNvbnN0IGk6IFByb21pc2U8QXJyYXk8SUNsdXN0ZXJJY29uSW5mbz4+ID0gbmV3IFByb21pc2U8QXJyYXk8SUNsdXN0ZXJJY29uSW5mbz4+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhID0gbmV3IEFycmF5PFByb21pc2U8e2ljb246IHN0cmluZywgaWNvbkluZm86IElNYXJrZXJJY29uSW5mb30+PigpO1xuICAgICAgICAgICAgc3R5bGVzLmZvckVhY2goKHN0eWxlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5pY29uSW5mbykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzOiBzdHJpbmd8UHJvbWlzZTx7aWNvbjogc3RyaW5nLCBpY29uSW5mbzogSU1hcmtlckljb25JbmZvfT4gPSBNYXJrZXIuQ3JlYXRlTWFya2VyKHN0eWxlLmljb25JbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZihzKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLnVybCA9IHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3R5bGUud2lkdGggPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLndpZHRoID0gc3R5bGUuaWNvbkluZm8uc2l6ZS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS5oZWlnaHQgPSBzdHlsZS5pY29uSW5mby5zaXplLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZS5pY29uSW5mby5tYXJrZXJPZmZzZXRSYXRpbyAmJiBzdHlsZS5pY29uSW5mby5zaXplICYmIHN0eWxlLmFuY2hvciA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbzogSU1hcmtlckljb25JbmZvID0gc3R5bGUuaWNvbkluZm87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGUuYW5jaG9yID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLnNpemUud2lkdGggKiBvLm1hcmtlck9mZnNldFJhdGlvLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8uc2l6ZS5oZWlnaHQgKiBvLm1hcmtlck9mZnNldFJhdGlvLnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHN0eWxlLmljb25JbmZvO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcy50aGVuKHggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLnVybCA9IHguaWNvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3R5bGUud2lkdGggPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS53aWR0aCA9IHguaWNvbkluZm8uc2l6ZS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGUuaGVpZ2h0ID0geC5pY29uSW5mby5zaXplLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHguaWNvbkluZm8ubWFya2VyT2Zmc2V0UmF0aW8gJiYgeC5pY29uSW5mby5zaXplICYmIHN0eWxlLmFuY2hvciA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG86IElNYXJrZXJJY29uSW5mbyA9IHguaWNvbkluZm87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLmFuY2hvciA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8uc2l6ZS53aWR0aCAqIG8ubWFya2VyT2Zmc2V0UmF0aW8ueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG8uc2l6ZS5oZWlnaHQgKiBvLm1hcmtlck9mZnNldFJhdGlvLnlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHN0eWxlLmljb25JbmZvO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYS5wdXNoKHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAocGEubGVuZ3RoID09PSAwKSB7IHJlc29sdmUoc3R5bGVzKTsgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwocGEpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHN0eWxlcyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaTtcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gQ29uc3RydWN0b3JzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIEdvb2dsZUNsdXN0ZXJTZXJ2aWNlLlxuICAgICAqIEBwYXJhbSBfbWFwU2VydmljZVxuICAgICAqIEBwYXJhbSBfem9uZVxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDbHVzdGVyU2VydmljZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKF9tYXBTZXJ2aWNlOiBNYXBTZXJ2aWNlLCBfem9uZTogTmdab25lKSB7XG4gICAgICAgIHN1cGVyKF9tYXBTZXJ2aWNlLCBfem9uZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyB0aGUgY2x1c3RlciBsYXllciB0byB0aGUgbWFwXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF5ZXJcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ2x1c3RlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkTGF5ZXIobGF5ZXI6IENsdXN0ZXJMYXllckRpcmVjdGl2ZSk6IHZvaWQge1xuICAgICAgICBjb25zdCBvcHRpb25zOiBJQ2x1c3Rlck9wdGlvbnMgPSB7XG4gICAgICAgICAgICBpZDogbGF5ZXIuSWQsXG4gICAgICAgICAgICB2aXNpYmxlOiBsYXllci5WaXNpYmxlLFxuICAgICAgICAgICAgY2x1c3RlcmluZ0VuYWJsZWQ6IGxheWVyLkNsdXN0ZXJpbmdFbmFibGVkLFxuICAgICAgICAgICAgem9vbU9uQ2xpY2s6IGxheWVyLkNsdXN0ZXJDbGlja0FjdGlvbiA9PT0gQ2x1c3RlckNsaWNrQWN0aW9uLlpvb21JbnRvQ2x1c3RlclxuICAgICAgICB9O1xuICAgICAgICBpZiAobGF5ZXIuR3JpZFNpemUpIHsgb3B0aW9ucy5ncmlkU2l6ZSA9IGxheWVyLkdyaWRTaXplOyB9XG4gICAgICAgIGlmIChsYXllci5NaW5pbXVtQ2x1c3RlclNpemUpIHsgb3B0aW9ucy5taW5pbXVtQ2x1c3RlclNpemUgPSBsYXllci5NaW5pbXVtQ2x1c3RlclNpemU7IH1cbiAgICAgICAgaWYgKGxheWVyLlN0eWxlcykgeyBvcHRpb25zLnN0eWxlcyA9IGxheWVyLlN0eWxlczsgfVxuICAgICAgICBpZiAobGF5ZXIuVXNlRHluYW1pY1NpemVNYXJrZXJzKSB7XG4gICAgICAgICAgICBvcHRpb25zLnN0eWxlcyA9IG51bGw7XG4gICAgICAgICAgICAvLyBkbyBub3QgdG8gYXR0ZW1wdCB0byBzZXR1cCBzdHlsZXMgaGVyZSBhcyB0aGUgZHluYW1pYyBjYWxsIGJhY2sgd2lsbCBnZW5lcmF0ZSB0aGVtLlxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb3B0aW9ucy5zdHlsZXMgPSBbe1xuICAgICAgICAgICAgICAgIGhlaWdodDogMzAsXG4gICAgICAgICAgICAgICAgd2lkdGg6IDM1LFxuICAgICAgICAgICAgICAgIHRleHRDb2xvcjogJ3doaXRlJyxcbiAgICAgICAgICAgICAgICB0ZXh0U2l6ZTogMTEsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZFBvc2l0aW9uOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICBpY29uSW5mbzoge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXJUeXBlOiBNYXJrZXJUeXBlSWQuRm9udE1hcmtlcixcbiAgICAgICAgICAgICAgICAgICAgZm9udE5hbWU6ICdGb250QXdlc29tZScsXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAzMCxcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICdncmVlbicsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdcXHVGMTExJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1dO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGR5bmFtaWNDbHVzdGVyQ2FsbGJhY2sgPSAobWFya2VyczogQXJyYXk8R29vZ2xlTWFwVHlwZXMuTWFya2VyPiwgbnVtU3R5bGVzOiBudW1iZXIsXG4gICAgICAgICAgICBjbHVzdGVyZXI6IEdvb2dsZU1hcFR5cGVzLk1hcmtlckNsdXN0ZXJlcikgPT4ge1xuICAgICAgICAgICAgLy8gZHluYW1pY2FsbHkgZW5zdXJlIHRoYXQgdGhlIG5lY2Vzc2FyeSBzdHlsZSBmb3IgdGhpcyBjbHVzdGVyIGljb24gZXhpc3RzIGFuZFxuICAgICAgICAgICAgLy8gdGhlIGNsdXN0ZXJlciBpcyBhbHJlYWR5IGhvb2tlZCB1cCB0byB0aGUgc3R5bGVzIGFycmF5IHZpYSBwb2ludGVyLCBzbyB3ZSBvbmx5XG4gICAgICAgICAgICAvLyBuZWVkIHRvIHVwZGF0ZSB0aGUgc3R5bGUuIFNpbmNlIHRoZSBjbHVzdGVyZXIgcmUtcmVuZGVycyBhIGNsdXN0ZXIgaWNvbiBpcyB0aGVcbiAgICAgICAgICAgIC8vIHRoZSBtYXJrZXIgY291bnQgY2hhbmdlcywgd2Ugd2lsbCBvbmx5IG5lZWQgdG8gcmV0YWluIHRoZSBjdXJyZW50IGljb24gYXMgb3Bwb3NlZFxuICAgICAgICAgICAgLy8gdG8gYWxsIGNsdXN0ZXIgaWNvbi5cbiAgICAgICAgICAgIGNvbnN0IHN0eWxlczogQXJyYXk8R29vZ2xlTWFwVHlwZXMuQ2x1c3RlclN0eWxlPiA9IHRoaXMuX2xheWVyU3R5bGVzLmdldChsYXllci5JZCk7XG4gICAgICAgICAgICBjb25zdCBpY29uSW5mbzogSU1hcmtlckljb25JbmZvID0ge1xuICAgICAgICAgICAgICAgIG1hcmtlclR5cGU6IE1hcmtlclR5cGVJZC5Ob25lXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgaWNvbjogc3RyaW5nID0gbGF5ZXIuQ3VzdG9tTWFya2VyQ2FsbGJhY2soPGFueT5tYXJrZXJzLCBpY29uSW5mbyk7XG4gICAgICAgICAgICBzdHlsZXNbMF0gPSB7XG4gICAgICAgICAgICAgICAgdXJsOiBgXFxcImRhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LCR7aWNvbn1cXFwiYCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGljb25JbmZvLnNpemUuaGVpZ2h0LFxuICAgICAgICAgICAgICAgIHdpZHRoOiBpY29uSW5mby5zaXplLndpZHRoLFxuICAgICAgICAgICAgICAgIHRleHRDb2xvcjogJ3doaXRlJyxcbiAgICAgICAgICAgICAgICB0ZXh0U2l6ZTogMTEsXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZFBvc2l0aW9uOiAnY2VudGVyJyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRleHQ6IG1hcmtlcnMubGVuZ3RoLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgaW5kZXg6IDFcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlc2V0U3R5bGVzID0gKGNsdXN0ZXJlcjogR29vZ2xlTWFwVHlwZXMuTWFya2VyQ2x1c3RlcmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbGF5ZXJTdHlsZXMuaGFzKGxheWVyLklkKSkgeyB0aGlzLl9sYXllclN0eWxlcy5nZXQobGF5ZXIuSWQpLnNwbGljZSgwKTsgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3R5bGVzOiBBcnJheTxHb29nbGVNYXBUeXBlcy5DbHVzdGVyU3R5bGU+ID0gbmV3IEFycmF5PEdvb2dsZU1hcFR5cGVzLkNsdXN0ZXJTdHlsZT4oKTtcbiAgICAgICAgICAgICAgICBzdHlsZXMucHVzaCh7fSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGF5ZXJTdHlsZXMuc2V0KGxheWVyLklkLCBzdHlsZXMpO1xuICAgICAgICAgICAgICAgIGNsdXN0ZXJlci5zZXRTdHlsZXMoc3R5bGVzKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBpbXBvcnRhbnQgZm9yIGR5bmFtaWMgc3R5bGVzIGFzIHRoZSBwb2ludGVyIHRvIHRoaXMgYXJyYXkgZ2V0cyBwYXNzZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gYXJvdW5kIGtleSBvYmplY3RzIGluIHRoZSBjbHVzdGVyZXIuIFRoZXJlZm9yZSwgaXQgbXVzdCBiZSBpbml0aWFsaXplZCBoZXJlIGluIG9yZGVyIGZvclxuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGVzIHRvIHRoZSBzdHlsZXMgdG8gYmUgdmlzaWJsZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gYWxzbywgd2UgbmVlZCB0byBhZGQgYXQgbGVhc3Qgb25lIHN0eWxlIHRvIHByZXZlbnQgdGhlIGRlZmF1bHQgc3R5bGVzIGZyb20gYmVpbmcgcGlja2VkIHVwLlxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGxheWVyUHJvbWlzZSA9IHRoaXMuX21hcFNlcnZpY2UuQ3JlYXRlQ2x1c3RlckxheWVyKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9sYXllcnMuc2V0KGxheWVyLklkLCBsYXllclByb21pc2UpO1xuICAgICAgICBsYXllclByb21pc2UudGhlbihsID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNsdXN0ZXJlcjogR29vZ2xlTWFwVHlwZXMuTWFya2VyQ2x1c3RlcmVyID0gPEdvb2dsZU1hcFR5cGVzLk1hcmtlckNsdXN0ZXJlcj5sLk5hdGl2ZVByaW1pdHZlO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3R5bGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcyAgPSBHb29nbGVDbHVzdGVyU2VydmljZS5DcmVhdGVDbHVzdGVySWNvbnMob3B0aW9ucy5zdHlsZXMpO1xuICAgICAgICAgICAgICAgIHMudGhlbih4ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY2x1c3RlcmVyLnNldFN0eWxlcyg8QXJyYXk8R29vZ2xlTWFwVHlwZXMuQ2x1c3RlclN0eWxlPj54KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc2V0U3R5bGVzKGNsdXN0ZXJlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFwU2VydmljZS5NYXBQcm9taXNlLnRoZW4oKG06IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBtLmFkZExpc3RlbmVyKCd6b29tX2NoYW5nZWQnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNldFN0eWxlcyhjbHVzdGVyZXIpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjbHVzdGVyZXIuc2V0Q2FsY3VsYXRvcigobSwgbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZHluYW1pY0NsdXN0ZXJDYWxsYmFjayhtLCBuLCBjbHVzdGVyZXIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBtYXJrZXIgaW4gdGhlIGNsdXN0ZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSBsYXllclxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUNsdXN0ZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZU1hcmtlcihsYXllcjogbnVtYmVyLCBvcHRpb25zOiBJTWFya2VyT3B0aW9ucyk6IFByb21pc2U8TWFya2VyPiB7XG4gICAgICAgIGNvbnN0IHA6IFByb21pc2U8TGF5ZXI+ID0gdGhpcy5HZXRMYXllckJ5SWQobGF5ZXIpO1xuICAgICAgICBpZiAocCA9PSBudWxsKSB7IHRocm93IChuZXcgRXJyb3IoYExheWVyIHdpdGggaWQgJHtsYXllcn0gbm90IGZvdW5kIGluIExheWVyIE1hcGApKTsgfVxuXG4gICAgICAgIHJldHVybiBwLnRoZW4oKGw6IExheWVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbWFwU2VydmljZS5DcmVhdGVNYXJrZXIob3B0aW9ucylcbiAgICAgICAgICAgICAgICAudGhlbigobWFya2VyOiBNYXJrZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyLklzRmlyc3QgPSBvcHRpb25zLmlzRmlyc3Q7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlci5Jc0xhc3QgPSBvcHRpb25zLmlzTGFzdDtcbiAgICAgICAgICAgICAgICAgICAgbC5BZGRFbnRpdHkobWFya2VyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hcmtlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnRzIHRoZSBjbHVzdGVyaW5nXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF5ZXJcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ2x1c3RlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgU3RhcnRDbHVzdGVyaW5nKGxheWVyOiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3BzIHRoZSBjbHVzdGVyaW5nXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF5ZXJcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ2x1c3RlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgU3RvcENsdXN0ZXJpbmcobGF5ZXI6IENsdXN0ZXJMYXllckRpcmVjdGl2ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIHBvbHlnb24gdG8gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGxheWVyIC0gVGhlIGlkIG9mIHRoZSBsYXllciB0byB3aGljaCB0byBhZGQgdGhlIHBvbHlnb24uXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBQb2x5Z29uIG9wdGlvbnMgZGVmaW5pbmcgdGhlIHBvbHlnb24uXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGFuIGluc3RhbmNlIG9mIHRoZSBQb2x5Z29uIG1vZGVsLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUNsdXN0ZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZVBvbHlnb24obGF5ZXI6IG51bWJlciwgb3B0aW9uczogSVBvbHlnb25PcHRpb25zKTogUHJvbWlzZTxQb2x5Z29uPiB7XG4gICAgICAgIHRocm93IChuZXcgRXJyb3IoJ1BvbHlnb25zIGFyZSBub3Qgc3VwcG9ydGVkIGluIGNsdXN0ZXJpbmcgbGF5ZXJzLiBZb3UgY2FuIG9ubHkgdXNlIG1hcmtlcnMuJykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdW5ib3VuZCBwb2x5Z29ucy4gVXNlIHRoaXMgbWV0aG9kIHRvIGNyZWF0ZSBhcnJheXMgb2YgcG9seWdvbnMgdG8gYmUgdXNlZCBpbiBidWxrXG4gICAgICogb3BlcmF0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsYXllciAtIFRoZSBpZCBvZiB0aGUgbGF5ZXIgdG8gd2hpY2ggdG8gYWRkIHRoZSBwb2x5Z29uLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gUG9seWdvbiBvcHRpb25zIGRlZmluaW5nIHRoZSBwb2x5Z29ucy5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IHdoZW4gZnVsbGZpbGxlZCBjb250YWlucyB0aGUgYW4gYXJyYXlzIG9mIHRoZSBQb2x5Z29uIG1vZGVscy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDbHVzdGVyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVQb2x5Z29ucyhsYXllcjogbnVtYmVyLCBvcHRpb25zOiBBcnJheTxJUG9seWdvbk9wdGlvbnM+KTogUHJvbWlzZTxBcnJheTxQb2x5Z29uPj4ge1xuICAgICAgICB0aHJvdyAobmV3IEVycm9yKCdQb2x5Z29ucyBhcmUgbm90IHN1cHBvcnRlZCBpbiBjbHVzdGVyaW5nIGxheWVycy4gWW91IGNhbiBvbmx5IHVzZSBtYXJrZXJzLicpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgcG9seWxpbmUgdG8gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGxheWVyIC0gVGhlIGlkIG9mIHRoZSBsYXllciB0byB3aGljaCB0byBhZGQgdGhlIGxpbmUuXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBQb2x5bGluZSBvcHRpb25zIGRlZmluaW5nIHRoZSBsaW5lLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiBmdWxsZmlsbGVkIGNvbnRhaW5zIHRoZSBhbiBpbnN0YW5jZSBvZiB0aGUgUG9seWxpbmUgKG9yIGFuXG4gICAgICogYXJyYXkgb2YgcG9seWdvbnMgZm9yIGNvbXBsZXggcGF0aHMpIG1vZGVsLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUNsdXN0ZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZVBvbHlsaW5lKGxheWVyOiBudW1iZXIsIG9wdGlvbnM6IElQb2x5bGluZU9wdGlvbnMpOiBQcm9taXNlPFBvbHlsaW5lfEFycmF5PFBvbHlsaW5lPj4ge1xuICAgICAgICB0aHJvdyAobmV3IEVycm9yKCdQb2x5bGluZXMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gY2x1c3RlcmluZyBsYXllcnMuIFlvdSBjYW4gb25seSB1c2UgbWFya2Vycy4nKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBvZiB1bmJvdW5kIHBvbHlsaW5lcy4gVXNlIHRoaXMgbWV0aG9kIHRvIGNyZWF0ZSBhcnJheXMgb2YgcG9seWxpbmVzIHRvIGJlIHVzZWQgaW4gYnVsa1xuICAgICAqIG9wZXJhdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBUaGUgaWQgb2YgdGhlIGxheWVyIHRvIHdoaWNoIHRvIGFkZCB0aGUgcG9seWxpbmVzLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gUG9seWxpbmUgb3B0aW9ucyBkZWZpbmluZyB0aGUgcG9seWxpbmVzLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiBmdWxsZmlsbGVkIGNvbnRhaW5zIHRoZSBhbiBhcnJheXMgb2YgdGhlIFBvbHlsaW5lIG1vZGVscy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDbHVzdGVyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVQb2x5bGluZXMobGF5ZXI6IG51bWJlciwgb3B0aW9uczogQXJyYXk8SVBvbHlsaW5lT3B0aW9ucz4pOiBQcm9taXNlPEFycmF5PFBvbHlsaW5lfEFycmF5PFBvbHlsaW5lPj4+IHtcbiAgICAgICAgdGhyb3cgKG5ldyBFcnJvcignUG9seWxpbmVzIGFyZSBub3Qgc3VwcG9ydGVkIGluIGNsdXN0ZXJpbmcgbGF5ZXJzLiBZb3UgY2FuIG9ubHkgdXNlIG1hcmtlcnMuJykpO1xuICAgIH1cbn1cbiJdfQ==