import { Injectable, NgZone } from '@angular/core';
import { Marker } from '../../models/marker';
import { MarkerTypeId } from '../../models/marker-type-id';
import { ClusterClickAction } from '../../models/cluster-click-action';
import { MapService } from '../map.service';
import { BingLayerBase } from './bing-layer-base';
/**
 * Implements the {@link ClusterService} contract for a  Bing Maps V8 specific implementation.
 *
 * @export
 */
export class BingClusterService extends BingLayerBase {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingClusterService.
     * @param _mapService - Concrete {@link MapService} implementation for Bing Maps V8. An instance of {@link BingMapService}.
     * @param _zone - NgZone instance to provide zone aware promises.
     *
     * @memberof BingClusterService
     */
    constructor(_mapService, _zone) {
        super(_mapService, _zone);
    }
    ///
    /// Public methods
    ///
    /**
     * Adds a layer to the map.
     *
     * @abstract
     * @param layer - ClusterLayerDirective component object.
     * Generally, MapLayer will be injected with an instance of the
     * LayerService and then self register on initialization.
     *
     * @memberof BingClusterService
     */
    AddLayer(layer) {
        const options = {
            id: layer.Id,
            visible: layer.Visible,
            clusteringEnabled: layer.ClusteringEnabled,
            placementMode: layer.ClusterPlacementMode
        };
        if (layer.GridSize) {
            options.gridSize = layer.GridSize;
        }
        if (layer.LayerOffset) {
            options.layerOffset = layer.LayerOffset;
        }
        if (layer.ZIndex) {
            options.zIndex = layer.ZIndex;
        }
        if (layer.IconInfo) {
            options.clusteredPinCallback = (pin) => { this.CreateClusterPushPin(pin, layer); };
        }
        if (layer.CustomMarkerCallback) {
            options.clusteredPinCallback = (pin) => { this.CreateCustomClusterPushPin(pin, layer); };
        }
        if (layer.SpiderClusterOptions) {
            options.spiderClusterOptions = layer.SpiderClusterOptions;
        }
        const layerPromise = this._mapService.CreateClusterLayer(options);
        this._mapService.MapPromise.then(m => {
            Microsoft.Maps.Events.addHandler(m, 'viewchangeend', (e) => {
                if (layer.ClusteringEnabled && m.getZoom() === 19) {
                    layerPromise.then((l) => {
                        l.SetOptions({ id: layer.Id, clusteringEnabled: false });
                    });
                }
                if (layer.ClusteringEnabled && m.getZoom() < 19) {
                    layerPromise.then((l) => {
                        if (!l.GetOptions().clusteringEnabled) {
                            l.SetOptions({ id: layer.Id, clusteringEnabled: true });
                        }
                    });
                }
            });
        });
        this._layers.set(layer.Id, layerPromise);
    }
    /**
     * Adds a polygon to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygon.
     * @returns - A promise that when fullfilled contains the an instance of the Polygon model.
     *
     * @memberof BingClusterService
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
     * @memberof BingClusterService
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
     * @returns - A promise that when fullfilled contains the an instance of the Polyline (or an array
     * of polygons for complex paths) model.
     *
     * @memberof BingClusterService
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
     * @memberof BingClusterService
     */
    CreatePolylines(layer, options) {
        throw (new Error('Polylines are not supported in clustering layers. You can only use markers.'));
    }
    /**
     * Start to actually cluster the entities in a cluster layer. This method should be called after the initial set of entities
     * have been added to the cluster. This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @param layer - ClusterLayerDirective component object for which to retrieve the layer.
     *
     * @memberof BingClusterService
     */
    StartClustering(layer) {
        const l = this._layers.get(layer.Id);
        if (l == null) {
            return Promise.resolve();
        }
        return l.then((l1) => {
            return this._zone.run(() => {
                l1.StartClustering();
            });
        });
    }
    /**
     * Stop to actually cluster the entities in a cluster layer.
     * This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @param layer - ClusterLayerDirective component object for which to retrieve the layer.
     *
     * @memberof BingClusterService
     */
    StopClustering(layer) {
        const l = this._layers.get(layer.Id);
        if (l == null) {
            return Promise.resolve();
        }
        return l.then((l1) => {
            return this._zone.run(() => {
                l1.StopClustering();
            });
        });
    }
    ///
    /// Private methods
    ///
    /**
     * Creates the default cluster pushpin as a callback from BingMaps when clustering occurs. The {@link ClusterLayerDirective} model
     * can provide an IconInfo property that would govern the apparenace of the pin. This method will assign the same pin to all
     * clusters in the layer.
     *
     * @param cluster - The cluster for which to create the pushpin.
     * @param layer - The {@link ClusterLayerDirective} component representing the layer.
     *
     * @memberof BingClusterService
     */
    CreateClusterPushPin(cluster, layer) {
        this._layers.get(layer.Id).then((l) => {
            if (layer.IconInfo) {
                const o = {};
                const payload = (ico, info) => {
                    o.icon = ico;
                    o.anchor = new Microsoft.Maps.Point((info.size && info.markerOffsetRatio) ? (info.size.width * info.markerOffsetRatio.x) : 0, (info.size && info.markerOffsetRatio) ? (info.size.height * info.markerOffsetRatio.y) : 0);
                    cluster.setOptions(o);
                };
                const icon = Marker.CreateMarker(layer.IconInfo);
                if (typeof (icon) === 'string') {
                    payload(icon, layer.IconInfo);
                }
                else {
                    icon.then(x => {
                        payload(x.icon, x.iconInfo);
                    });
                }
            }
            if (layer.ClusterClickAction === ClusterClickAction.ZoomIntoCluster) {
                Microsoft.Maps.Events.addHandler(cluster, 'click', (e) => this.ZoomIntoCluster(e));
            }
            if (layer.ClusterClickAction === ClusterClickAction.Spider) {
                Microsoft.Maps.Events.addHandler(cluster, 'dblclick', (e) => this.ZoomIntoCluster(e));
                l.InitializeSpiderClusterSupport();
            }
        });
    }
    /**
     * Provides a hook for consumers to provide a custom function to create cluster bins for a cluster. This is particuarily useful
     * in situation where the pin should differ to represent information about the pins in the cluster.
     *
     * @param cluster - The cluster for which to create the pushpin.
     * @param layer - The {@link ClusterLayerDirective} component
     * representing the layer. Set the {@link ClusterLayerDirective.CustomMarkerCallback}
     * property to define the callback generating the pin.
     *
     * @memberof BingClusterService
     */
    CreateCustomClusterPushPin(cluster, layer) {
        this._layers.get(layer.Id).then((l) => {
            // assemble markers for callback
            const m = new Array();
            cluster.containedPushpins.forEach(p => {
                const marker = l.GetMarkerFromBingMarker(p);
                if (marker) {
                    m.push(marker);
                }
            });
            const iconInfo = { markerType: MarkerTypeId.None };
            const o = {};
            o.icon = layer.CustomMarkerCallback(m, iconInfo);
            if (o.icon !== '') {
                o.anchor = new Microsoft.Maps.Point((iconInfo.size && iconInfo.markerOffsetRatio) ? (iconInfo.size.width * iconInfo.markerOffsetRatio.x) : 0, (iconInfo.size && iconInfo.markerOffsetRatio) ? (iconInfo.size.height * iconInfo.markerOffsetRatio.y) : 0);
                if (iconInfo.textOffset) {
                    o.textOffset = new Microsoft.Maps.Point(iconInfo.textOffset.x, iconInfo.textOffset.y);
                }
                cluster.setOptions(o);
            }
            if (layer.ClusterClickAction === ClusterClickAction.ZoomIntoCluster) {
                Microsoft.Maps.Events.addHandler(cluster, 'click', (e) => this.ZoomIntoCluster(e));
            }
            if (layer.ClusterClickAction === ClusterClickAction.Spider) {
                Microsoft.Maps.Events.addHandler(cluster, 'dblclick', (e) => this.ZoomIntoCluster(e));
                l.InitializeSpiderClusterSupport();
            }
        });
    }
    /**
     * Zooms into the cluster on click so that the members of the cluster comfortable fit into the zommed area.
     *
     * @param e - Mouse Event.
     *
     * @memberof BingClusterService
     */
    ZoomIntoCluster(e) {
        const pin = e.target;
        if (pin && pin.containedPushpins) {
            let bounds;
            const locs = new Array();
            pin.containedPushpins.forEach(p => locs.push(p.getLocation()));
            bounds = Microsoft.Maps.LocationRect.fromLocations(locs);
            // Zoom into the bounding box of the cluster.
            // Add a padding to compensate for the pixel area of the pushpins.
            this._mapService.MapPromise.then((m) => {
                m.setView({ bounds: bounds, padding: 75 });
            });
        }
    }
}
BingClusterService.decorators = [
    { type: Injectable }
];
BingClusterService.ctorParameters = () => [
    { type: MapService },
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1jbHVzdGVyLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvc2VydmljZXMvYmluZy9iaW5nLWNsdXN0ZXIuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQU1uRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFNN0MsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQzNELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLG1DQUFtQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUc1QyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFJbEQ7Ozs7R0FJRztBQUVILE1BQU0sT0FBTyxrQkFBbUIsU0FBUSxhQUFhO0lBRWpELEdBQUc7SUFDSCxlQUFlO0lBQ2YsR0FBRztJQUVIOzs7Ozs7T0FNRztJQUNILFlBQVksV0FBdUIsRUFBRSxLQUFhO1FBQzlDLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVELEdBQUc7SUFDSCxrQkFBa0I7SUFDbEIsR0FBRztJQUVIOzs7Ozs7Ozs7T0FTRztJQUNJLFFBQVEsQ0FBQyxLQUE0QjtRQUN4QyxNQUFNLE9BQU8sR0FBb0I7WUFDN0IsRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQ1osT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1lBQ3RCLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxpQkFBaUI7WUFDMUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxvQkFBb0I7U0FDNUMsQ0FBQztRQUNGLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRTtZQUFFLE9BQU8sQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztTQUFFO1FB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LEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLENBQUMsQ0FBQyxDQUFDO1NBQ047SUFDTCxDQUFDOzs7WUF0UkosVUFBVTs7O1lBWkYsVUFBVTtZQWRFLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBOZ1pvbmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IElNYXJrZXJPcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbWFya2VyLW9wdGlvbnMnO1xuaW1wb3J0IHsgSVBvbHlnb25PcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pcG9seWdvbi1vcHRpb25zJztcbmltcG9ydCB7IElQb2x5bGluZU9wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lwb2x5bGluZS1vcHRpb25zJztcbmltcG9ydCB7IElDbHVzdGVyT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWNsdXN0ZXItb3B0aW9ucyc7XG5pbXBvcnQgeyBJTWFya2VySWNvbkluZm8gfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2ltYXJrZXItaWNvbi1pbmZvJztcbmltcG9ydCB7IE1hcmtlciB9IGZyb20gJy4uLy4uL21vZGVscy9tYXJrZXInO1xuaW1wb3J0IHsgUG9seWdvbiB9IGZyb20gJy4uLy4uL21vZGVscy9wb2x5Z29uJztcbmltcG9ydCB7IFBvbHlsaW5lIH0gZnJvbSAnLi4vLi4vbW9kZWxzL3BvbHlsaW5lJztcbmltcG9ydCB7IEJpbmdNYXJrZXIgfSBmcm9tICcuLi8uLi9tb2RlbHMvYmluZy9iaW5nLW1hcmtlcic7XG5pbXBvcnQgeyBCaW5nQ2x1c3RlckxheWVyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2JpbmcvYmluZy1jbHVzdGVyLWxheWVyJztcbmltcG9ydCB7IExheWVyIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2xheWVyJztcbmltcG9ydCB7IE1hcmtlclR5cGVJZCB9IGZyb20gJy4uLy4uL21vZGVscy9tYXJrZXItdHlwZS1pZCc7XG5pbXBvcnQgeyBDbHVzdGVyQ2xpY2tBY3Rpb24gfSBmcm9tICcuLi8uLi9tb2RlbHMvY2x1c3Rlci1jbGljay1hY3Rpb24nO1xuaW1wb3J0IHsgTWFwU2VydmljZSB9IGZyb20gJy4uL21hcC5zZXJ2aWNlJztcbmltcG9ydCB7IENsdXN0ZXJMYXllckRpcmVjdGl2ZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvY2x1c3Rlci1sYXllcic7XG5pbXBvcnQgeyBDbHVzdGVyU2VydmljZSB9IGZyb20gJy4uL2NsdXN0ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBCaW5nTGF5ZXJCYXNlIH0gZnJvbSAnLi9iaW5nLWxheWVyLWJhc2UnO1xuaW1wb3J0IHsgQmluZ01hcFNlcnZpY2UgfSBmcm9tICcuL2JpbmctbWFwLnNlcnZpY2UnO1xuaW1wb3J0IHsgQmluZ0NvbnZlcnNpb25zIH0gZnJvbSAnLi9iaW5nLWNvbnZlcnNpb25zJztcblxuLyoqXG4gKiBJbXBsZW1lbnRzIHRoZSB7QGxpbmsgQ2x1c3RlclNlcnZpY2V9IGNvbnRyYWN0IGZvciBhICBCaW5nIE1hcHMgVjggc3BlY2lmaWMgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQGV4cG9ydFxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQmluZ0NsdXN0ZXJTZXJ2aWNlIGV4dGVuZHMgQmluZ0xheWVyQmFzZSBpbXBsZW1lbnRzIENsdXN0ZXJTZXJ2aWNlIHtcblxuICAgIC8vL1xuICAgIC8vLyBDb25zdHJ1Y3RvclxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBCaW5nQ2x1c3RlclNlcnZpY2UuXG4gICAgICogQHBhcmFtIF9tYXBTZXJ2aWNlIC0gQ29uY3JldGUge0BsaW5rIE1hcFNlcnZpY2V9IGltcGxlbWVudGF0aW9uIGZvciBCaW5nIE1hcHMgVjguIEFuIGluc3RhbmNlIG9mIHtAbGluayBCaW5nTWFwU2VydmljZX0uXG4gICAgICogQHBhcmFtIF96b25lIC0gTmdab25lIGluc3RhbmNlIHRvIHByb3ZpZGUgem9uZSBhd2FyZSBwcm9taXNlcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlclNlcnZpY2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihfbWFwU2VydmljZTogTWFwU2VydmljZSwgX3pvbmU6IE5nWm9uZSkge1xuICAgICAgICBzdXBlcihfbWFwU2VydmljZSwgX3pvbmUpO1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQdWJsaWMgbWV0aG9kc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxheWVyIHRvIHRoZSBtYXAuXG4gICAgICpcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBDbHVzdGVyTGF5ZXJEaXJlY3RpdmUgY29tcG9uZW50IG9iamVjdC5cbiAgICAgKiBHZW5lcmFsbHksIE1hcExheWVyIHdpbGwgYmUgaW5qZWN0ZWQgd2l0aCBhbiBpbnN0YW5jZSBvZiB0aGVcbiAgICAgKiBMYXllclNlcnZpY2UgYW5kIHRoZW4gc2VsZiByZWdpc3RlciBvbiBpbml0aWFsaXphdGlvbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkTGF5ZXIobGF5ZXI6IENsdXN0ZXJMYXllckRpcmVjdGl2ZSk6IHZvaWQge1xuICAgICAgICBjb25zdCBvcHRpb25zOiBJQ2x1c3Rlck9wdGlvbnMgPSB7XG4gICAgICAgICAgICBpZDogbGF5ZXIuSWQsXG4gICAgICAgICAgICB2aXNpYmxlOiBsYXllci5WaXNpYmxlLFxuICAgICAgICAgICAgY2x1c3RlcmluZ0VuYWJsZWQ6IGxheWVyLkNsdXN0ZXJpbmdFbmFibGVkLFxuICAgICAgICAgICAgcGxhY2VtZW50TW9kZTogbGF5ZXIuQ2x1c3RlclBsYWNlbWVudE1vZGVcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGxheWVyLkdyaWRTaXplKSB7IG9wdGlvbnMuZ3JpZFNpemUgPSBsYXllci5HcmlkU2l6ZTsgfVxuICAgICAgICBpZiAobGF5ZXIuTGF5ZXJPZmZzZXQpIHsgb3B0aW9ucy5sYXllck9mZnNldCA9IGxheWVyLkxheWVyT2Zmc2V0OyB9XG4gICAgICAgIGlmIChsYXllci5aSW5kZXgpIHsgb3B0aW9ucy56SW5kZXggPSBsYXllci5aSW5kZXg7IH1cbiAgICAgICAgaWYgKGxheWVyLkljb25JbmZvKSB7XG4gICAgICAgICAgICBvcHRpb25zLmNsdXN0ZXJlZFBpbkNhbGxiYWNrID0gKHBpbjogTWljcm9zb2Z0Lk1hcHMuQ2x1c3RlclB1c2hwaW4pID0+IHsgdGhpcy5DcmVhdGVDbHVzdGVyUHVzaFBpbihwaW4sIGxheWVyKTsgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGF5ZXIuQ3VzdG9tTWFya2VyQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIG9wdGlvbnMuY2x1c3RlcmVkUGluQ2FsbGJhY2sgPSAocGluOiBNaWNyb3NvZnQuTWFwcy5DbHVzdGVyUHVzaHBpbikgPT4geyB0aGlzLkNyZWF0ZUN1c3RvbUNsdXN0ZXJQdXNoUGluKHBpbiwgbGF5ZXIpOyB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXllci5TcGlkZXJDbHVzdGVyT3B0aW9ucykgeyBvcHRpb25zLnNwaWRlckNsdXN0ZXJPcHRpb25zID0gbGF5ZXIuU3BpZGVyQ2x1c3Rlck9wdGlvbnM7IH1cblxuICAgICAgICBjb25zdCBsYXllclByb21pc2U6IFByb21pc2U8TGF5ZXI+ID0gdGhpcy5fbWFwU2VydmljZS5DcmVhdGVDbHVzdGVyTGF5ZXIob3B0aW9ucyk7XG4gICAgICAgICg8QmluZ01hcFNlcnZpY2U+dGhpcy5fbWFwU2VydmljZSkuTWFwUHJvbWlzZS50aGVuKG0gPT4ge1xuICAgICAgICAgICAgTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmFkZEhhbmRsZXIobSwgJ3ZpZXdjaGFuZ2VlbmQnLCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChsYXllci5DbHVzdGVyaW5nRW5hYmxlZCAmJiBtLmdldFpvb20oKSA9PT0gMTkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXJQcm9taXNlLnRoZW4oKGw6IEJpbmdDbHVzdGVyTGF5ZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGwuU2V0T3B0aW9ucyh7IGlkOiBsYXllci5JZCwgY2x1c3RlcmluZ0VuYWJsZWQ6IGZhbHNlIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxheWVyLkNsdXN0ZXJpbmdFbmFibGVkICYmIG0uZ2V0Wm9vbSgpIDwgMTkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXJQcm9taXNlLnRoZW4oKGw6IEJpbmdDbHVzdGVyTGF5ZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbC5HZXRPcHRpb25zKCkuY2x1c3RlcmluZ0VuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsLlNldE9wdGlvbnMoeyBpZDogbGF5ZXIuSWQsIGNsdXN0ZXJpbmdFbmFibGVkOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2xheWVycy5zZXQobGF5ZXIuSWQsIGxheWVyUHJvbWlzZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIHBvbHlnb24gdG8gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGxheWVyIC0gVGhlIGlkIG9mIHRoZSBsYXllciB0byB3aGljaCB0byBhZGQgdGhlIHBvbHlnb24uXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBQb2x5Z29uIG9wdGlvbnMgZGVmaW5pbmcgdGhlIHBvbHlnb24uXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGFuIGluc3RhbmNlIG9mIHRoZSBQb2x5Z29uIG1vZGVsLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDbHVzdGVyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVQb2x5Z29uKGxheWVyOiBudW1iZXIsIG9wdGlvbnM6IElQb2x5Z29uT3B0aW9ucyk6IFByb21pc2U8UG9seWdvbj4ge1xuICAgICAgICB0aHJvdyAobmV3IEVycm9yKCdQb2x5Z29ucyBhcmUgbm90IHN1cHBvcnRlZCBpbiBjbHVzdGVyaW5nIGxheWVycy4gWW91IGNhbiBvbmx5IHVzZSBtYXJrZXJzLicpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IG9mIHVuYm91bmQgcG9seWdvbnMuIFVzZSB0aGlzIG1ldGhvZCB0byBjcmVhdGUgYXJyYXlzIG9mIHBvbHlnb25zIHRvIGJlIHVzZWQgaW4gYnVsa1xuICAgICAqIG9wZXJhdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBUaGUgaWQgb2YgdGhlIGxheWVyIHRvIHdoaWNoIHRvIGFkZCB0aGUgcG9seWdvbi5cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFBvbHlnb24gb3B0aW9ucyBkZWZpbmluZyB0aGUgcG9seWdvbnMuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGFuIGFycmF5cyBvZiB0aGUgUG9seWdvbiBtb2RlbHMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZVBvbHlnb25zKGxheWVyOiBudW1iZXIsIG9wdGlvbnM6IEFycmF5PElQb2x5Z29uT3B0aW9ucz4pOiBQcm9taXNlPEFycmF5PFBvbHlnb24+PiB7XG4gICAgICAgIHRocm93IChuZXcgRXJyb3IoJ1BvbHlnb25zIGFyZSBub3Qgc3VwcG9ydGVkIGluIGNsdXN0ZXJpbmcgbGF5ZXJzLiBZb3UgY2FuIG9ubHkgdXNlIG1hcmtlcnMuJykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBwb2x5bGluZSB0byB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBUaGUgaWQgb2YgdGhlIGxheWVyIHRvIHdoaWNoIHRvIGFkZCB0aGUgbGluZS5cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFBvbHlsaW5lIG9wdGlvbnMgZGVmaW5pbmcgdGhlIGxpbmUuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGFuIGluc3RhbmNlIG9mIHRoZSBQb2x5bGluZSAob3IgYW4gYXJyYXlcbiAgICAgKiBvZiBwb2x5Z29ucyBmb3IgY29tcGxleCBwYXRocykgbW9kZWwuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZVBvbHlsaW5lKGxheWVyOiBudW1iZXIsIG9wdGlvbnM6IElQb2x5bGluZU9wdGlvbnMpOiBQcm9taXNlPFBvbHlsaW5lfEFycmF5PFBvbHlsaW5lPj4ge1xuICAgICAgICB0aHJvdyAobmV3IEVycm9yKCdQb2x5bGluZXMgYXJlIG5vdCBzdXBwb3J0ZWQgaW4gY2x1c3RlcmluZyBsYXllcnMuIFlvdSBjYW4gb25seSB1c2UgbWFya2Vycy4nKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBvZiB1bmJvdW5kIHBvbHlsaW5lcy4gVXNlIHRoaXMgbWV0aG9kIHRvIGNyZWF0ZSBhcnJheXMgb2YgcG9seWxpbmVzIHRvIGJlIHVzZWQgaW4gYnVsa1xuICAgICAqIG9wZXJhdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBUaGUgaWQgb2YgdGhlIGxheWVyIHRvIHdoaWNoIHRvIGFkZCB0aGUgcG9seWxpbmVzLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gUG9seWxpbmUgb3B0aW9ucyBkZWZpbmluZyB0aGUgcG9seWxpbmVzLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiBmdWxsZmlsbGVkIGNvbnRhaW5zIHRoZSBhbiBhcnJheXMgb2YgdGhlIFBvbHlsaW5lIG1vZGVscy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlUG9seWxpbmVzKGxheWVyOiBudW1iZXIsIG9wdGlvbnM6IEFycmF5PElQb2x5bGluZU9wdGlvbnM+KTogUHJvbWlzZTxBcnJheTxQb2x5bGluZXxBcnJheTxQb2x5bGluZT4+PiB7XG4gICAgICAgIHRocm93IChuZXcgRXJyb3IoJ1BvbHlsaW5lcyBhcmUgbm90IHN1cHBvcnRlZCBpbiBjbHVzdGVyaW5nIGxheWVycy4gWW91IGNhbiBvbmx5IHVzZSBtYXJrZXJzLicpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdGFydCB0byBhY3R1YWxseSBjbHVzdGVyIHRoZSBlbnRpdGllcyBpbiBhIGNsdXN0ZXIgbGF5ZXIuIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIGluaXRpYWwgc2V0IG9mIGVudGl0aWVzXG4gICAgICogaGF2ZSBiZWVuIGFkZGVkIHRvIHRoZSBjbHVzdGVyLiBUaGlzIG1ldGhvZCBpcyB1c2VkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIGFzIGFkZGluZyBhbiBlbnRpdGl5IHdpbGwgcmVjYWxjdWxhdGUgYWxsIGNsdXN0ZXJzLlxuICAgICAqIEFzIHN1Y2gsIFN0b3BDbHVzdGVyaW5nIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIGFkZGluZyBtYW55IGVudGl0aWVzIGFuZCBTdGFydENsdXN0ZXJpbmcgc2hvdWxkIGJlIGNhbGxlZCBvbmNlIGFkZGluZyBpc1xuICAgICAqIGNvbXBsZXRlIHRvIHJlY2FsY3VsYXRlIHRoZSBjbHVzdGVycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsYXllciAtIENsdXN0ZXJMYXllckRpcmVjdGl2ZSBjb21wb25lbnQgb2JqZWN0IGZvciB3aGljaCB0byByZXRyaWV2ZSB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFN0YXJ0Q2x1c3RlcmluZyhsYXllcjogQ2x1c3RlckxheWVyRGlyZWN0aXZlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGwgPSB0aGlzLl9sYXllcnMuZ2V0KGxheWVyLklkKTtcbiAgICAgICAgaWYgKGwgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsLnRoZW4oKGwxOiBCaW5nQ2x1c3RlckxheWVyKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGwxLlN0YXJ0Q2x1c3RlcmluZygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3AgdG8gYWN0dWFsbHkgY2x1c3RlciB0aGUgZW50aXRpZXMgaW4gYSBjbHVzdGVyIGxheWVyLlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgYXMgYWRkaW5nIGFuIGVudGl0aXkgd2lsbCByZWNhbGN1bGF0ZSBhbGwgY2x1c3RlcnMuXG4gICAgICogQXMgc3VjaCwgU3RvcENsdXN0ZXJpbmcgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYWRkaW5nIG1hbnkgZW50aXRpZXMgYW5kIFN0YXJ0Q2x1c3RlcmluZyBzaG91bGQgYmUgY2FsbGVkIG9uY2UgYWRkaW5nIGlzXG4gICAgICogY29tcGxldGUgdG8gcmVjYWxjdWxhdGUgdGhlIGNsdXN0ZXJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGxheWVyIC0gQ2x1c3RlckxheWVyRGlyZWN0aXZlIGNvbXBvbmVudCBvYmplY3QgZm9yIHdoaWNoIHRvIHJldHJpZXZlIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgU3RvcENsdXN0ZXJpbmcobGF5ZXI6IENsdXN0ZXJMYXllckRpcmVjdGl2ZSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBsID0gdGhpcy5fbGF5ZXJzLmdldChsYXllci5JZCk7XG4gICAgICAgIGlmIChsID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbC50aGVuKChsMTogQmluZ0NsdXN0ZXJMYXllcikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBsMS5TdG9wQ2x1c3RlcmluZygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQcml2YXRlIG1ldGhvZHNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhlIGRlZmF1bHQgY2x1c3RlciBwdXNocGluIGFzIGEgY2FsbGJhY2sgZnJvbSBCaW5nTWFwcyB3aGVuIGNsdXN0ZXJpbmcgb2NjdXJzLiBUaGUge0BsaW5rIENsdXN0ZXJMYXllckRpcmVjdGl2ZX0gbW9kZWxcbiAgICAgKiBjYW4gcHJvdmlkZSBhbiBJY29uSW5mbyBwcm9wZXJ0eSB0aGF0IHdvdWxkIGdvdmVybiB0aGUgYXBwYXJlbmFjZSBvZiB0aGUgcGluLiBUaGlzIG1ldGhvZCB3aWxsIGFzc2lnbiB0aGUgc2FtZSBwaW4gdG8gYWxsXG4gICAgICogY2x1c3RlcnMgaW4gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNsdXN0ZXIgLSBUaGUgY2x1c3RlciBmb3Igd2hpY2ggdG8gY3JlYXRlIHRoZSBwdXNocGluLlxuICAgICAqIEBwYXJhbSBsYXllciAtIFRoZSB7QGxpbmsgQ2x1c3RlckxheWVyRGlyZWN0aXZlfSBjb21wb25lbnQgcmVwcmVzZW50aW5nIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwcml2YXRlIENyZWF0ZUNsdXN0ZXJQdXNoUGluKGNsdXN0ZXI6IE1pY3Jvc29mdC5NYXBzLkNsdXN0ZXJQdXNocGluLCBsYXllcjogQ2x1c3RlckxheWVyRGlyZWN0aXZlKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2xheWVycy5nZXQobGF5ZXIuSWQpLnRoZW4oKGw6IEJpbmdDbHVzdGVyTGF5ZXIpID0+IHtcbiAgICAgICAgICAgIGlmIChsYXllci5JY29uSW5mbykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG86IE1pY3Jvc29mdC5NYXBzLklQdXNocGluT3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHBheWxvYWQ6IChpY286IHN0cmluZywgaW5mbzogSU1hcmtlckljb25JbmZvKSA9PiB2b2lkID0gKGljbywgaW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgby5pY29uID0gaWNvO1xuICAgICAgICAgICAgICAgICAgICAgICAgby5hbmNob3IgPSBuZXcgTWljcm9zb2Z0Lk1hcHMuUG9pbnQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGluZm8uc2l6ZSAmJiBpbmZvLm1hcmtlck9mZnNldFJhdGlvKSA/IChpbmZvLnNpemUud2lkdGggKiBpbmZvLm1hcmtlck9mZnNldFJhdGlvLngpIDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5mby5zaXplICYmIGluZm8ubWFya2VyT2Zmc2V0UmF0aW8pID8gKGluZm8uc2l6ZS5oZWlnaHQgKiBpbmZvLm1hcmtlck9mZnNldFJhdGlvLnkpIDogMFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsdXN0ZXIuc2V0T3B0aW9ucyhvKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGljb246IHN0cmluZ3xQcm9taXNlPHtpY29uOiBzdHJpbmcsIGljb25JbmZvOiBJTWFya2VySWNvbkluZm99PiA9IE1hcmtlci5DcmVhdGVNYXJrZXIobGF5ZXIuSWNvbkluZm8pO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YoaWNvbikgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBheWxvYWQoaWNvbiwgbGF5ZXIuSWNvbkluZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWNvbi50aGVuKHggPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZCh4Lmljb24sIHguaWNvbkluZm8pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobGF5ZXIuQ2x1c3RlckNsaWNrQWN0aW9uID09PSBDbHVzdGVyQ2xpY2tBY3Rpb24uWm9vbUludG9DbHVzdGVyKSB7XG4gICAgICAgICAgICAgICAgTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmFkZEhhbmRsZXIoY2x1c3RlciwgJ2NsaWNrJywgKGU6IE1pY3Jvc29mdC5NYXBzLklNb3VzZUV2ZW50QXJncykgPT4gdGhpcy5ab29tSW50b0NsdXN0ZXIoZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxheWVyLkNsdXN0ZXJDbGlja0FjdGlvbiA9PT0gQ2x1c3RlckNsaWNrQWN0aW9uLlNwaWRlcikge1xuICAgICAgICAgICAgICAgIE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKGNsdXN0ZXIsICdkYmxjbGljaycsIChlOiBNaWNyb3NvZnQuTWFwcy5JTW91c2VFdmVudEFyZ3MpID0+IHRoaXMuWm9vbUludG9DbHVzdGVyKGUpKTtcbiAgICAgICAgICAgICAgICBsLkluaXRpYWxpemVTcGlkZXJDbHVzdGVyU3VwcG9ydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyBhIGhvb2sgZm9yIGNvbnN1bWVycyB0byBwcm92aWRlIGEgY3VzdG9tIGZ1bmN0aW9uIHRvIGNyZWF0ZSBjbHVzdGVyIGJpbnMgZm9yIGEgY2x1c3Rlci4gVGhpcyBpcyBwYXJ0aWN1YXJpbHkgdXNlZnVsXG4gICAgICogaW4gc2l0dWF0aW9uIHdoZXJlIHRoZSBwaW4gc2hvdWxkIGRpZmZlciB0byByZXByZXNlbnQgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHBpbnMgaW4gdGhlIGNsdXN0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2x1c3RlciAtIFRoZSBjbHVzdGVyIGZvciB3aGljaCB0byBjcmVhdGUgdGhlIHB1c2hwaW4uXG4gICAgICogQHBhcmFtIGxheWVyIC0gVGhlIHtAbGluayBDbHVzdGVyTGF5ZXJEaXJlY3RpdmV9IGNvbXBvbmVudFxuICAgICAqIHJlcHJlc2VudGluZyB0aGUgbGF5ZXIuIFNldCB0aGUge0BsaW5rIENsdXN0ZXJMYXllckRpcmVjdGl2ZS5DdXN0b21NYXJrZXJDYWxsYmFja31cbiAgICAgKiBwcm9wZXJ0eSB0byBkZWZpbmUgdGhlIGNhbGxiYWNrIGdlbmVyYXRpbmcgdGhlIHBpbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlclNlcnZpY2VcbiAgICAgKi9cbiAgICBwcml2YXRlIENyZWF0ZUN1c3RvbUNsdXN0ZXJQdXNoUGluKGNsdXN0ZXI6IE1pY3Jvc29mdC5NYXBzLkNsdXN0ZXJQdXNocGluLCBsYXllcjogQ2x1c3RlckxheWVyRGlyZWN0aXZlKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2xheWVycy5nZXQobGF5ZXIuSWQpLnRoZW4oKGw6IEJpbmdDbHVzdGVyTGF5ZXIpID0+IHtcbiAgICAgICAgICAgIC8vIGFzc2VtYmxlIG1hcmtlcnMgZm9yIGNhbGxiYWNrXG4gICAgICAgICAgICBjb25zdCBtOiBBcnJheTxNYXJrZXI+ID0gbmV3IEFycmF5PE1hcmtlcj4oKTtcbiAgICAgICAgICAgIGNsdXN0ZXIuY29udGFpbmVkUHVzaHBpbnMuZm9yRWFjaChwID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXJrZXI6IE1hcmtlciA9IGwuR2V0TWFya2VyRnJvbUJpbmdNYXJrZXIocCk7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlcikgeyBtLnB1c2gobWFya2VyKTsgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBpY29uSW5mbzogSU1hcmtlckljb25JbmZvID0geyBtYXJrZXJUeXBlOiBNYXJrZXJUeXBlSWQuTm9uZSB9O1xuICAgICAgICAgICAgY29uc3QgbzogTWljcm9zb2Z0Lk1hcHMuSVB1c2hwaW5PcHRpb25zID0ge307XG4gICAgICAgICAgICBvLmljb24gPSBsYXllci5DdXN0b21NYXJrZXJDYWxsYmFjayhtLCBpY29uSW5mbyk7XG4gICAgICAgICAgICBpZiAoby5pY29uICE9PSAnJykge1xuICAgICAgICAgICAgICAgIG8uYW5jaG9yID0gbmV3IE1pY3Jvc29mdC5NYXBzLlBvaW50KFxuICAgICAgICAgICAgICAgICAgICAoaWNvbkluZm8uc2l6ZSAmJiBpY29uSW5mby5tYXJrZXJPZmZzZXRSYXRpbykgPyAoaWNvbkluZm8uc2l6ZS53aWR0aCAqIGljb25JbmZvLm1hcmtlck9mZnNldFJhdGlvLngpIDogMCxcbiAgICAgICAgICAgICAgICAgICAgKGljb25JbmZvLnNpemUgJiYgaWNvbkluZm8ubWFya2VyT2Zmc2V0UmF0aW8pID8gKGljb25JbmZvLnNpemUuaGVpZ2h0ICogaWNvbkluZm8ubWFya2VyT2Zmc2V0UmF0aW8ueSkgOiAwXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAoaWNvbkluZm8udGV4dE9mZnNldCkgeyBvLnRleHRPZmZzZXQgPSBuZXcgTWljcm9zb2Z0Lk1hcHMuUG9pbnQoaWNvbkluZm8udGV4dE9mZnNldC54LCBpY29uSW5mby50ZXh0T2Zmc2V0LnkpOyB9XG4gICAgICAgICAgICAgICAgY2x1c3Rlci5zZXRPcHRpb25zKG8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxheWVyLkNsdXN0ZXJDbGlja0FjdGlvbiA9PT0gQ2x1c3RlckNsaWNrQWN0aW9uLlpvb21JbnRvQ2x1c3Rlcikge1xuICAgICAgICAgICAgICAgIE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKGNsdXN0ZXIsICdjbGljaycsIChlOiBNaWNyb3NvZnQuTWFwcy5JTW91c2VFdmVudEFyZ3MpID0+IHRoaXMuWm9vbUludG9DbHVzdGVyKGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChsYXllci5DbHVzdGVyQ2xpY2tBY3Rpb24gPT09IENsdXN0ZXJDbGlja0FjdGlvbi5TcGlkZXIpIHtcbiAgICAgICAgICAgICAgICBNaWNyb3NvZnQuTWFwcy5FdmVudHMuYWRkSGFuZGxlcihjbHVzdGVyLCAnZGJsY2xpY2snLCAoZTogTWljcm9zb2Z0Lk1hcHMuSU1vdXNlRXZlbnRBcmdzKSA9PiB0aGlzLlpvb21JbnRvQ2x1c3RlcihlKSk7XG4gICAgICAgICAgICAgICAgbC5Jbml0aWFsaXplU3BpZGVyQ2x1c3RlclN1cHBvcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogWm9vbXMgaW50byB0aGUgY2x1c3RlciBvbiBjbGljayBzbyB0aGF0IHRoZSBtZW1iZXJzIG9mIHRoZSBjbHVzdGVyIGNvbWZvcnRhYmxlIGZpdCBpbnRvIHRoZSB6b21tZWQgYXJlYS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlIC0gTW91c2UgRXZlbnQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHJpdmF0ZSBab29tSW50b0NsdXN0ZXIoZTogTWljcm9zb2Z0Lk1hcHMuSU1vdXNlRXZlbnRBcmdzKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHBpbjogTWljcm9zb2Z0Lk1hcHMuQ2x1c3RlclB1c2hwaW4gPSA8TWljcm9zb2Z0Lk1hcHMuQ2x1c3RlclB1c2hwaW4+ZS50YXJnZXQ7XG4gICAgICAgIGlmIChwaW4gJiYgcGluLmNvbnRhaW5lZFB1c2hwaW5zKSB7XG4gICAgICAgICAgICBsZXQgYm91bmRzOiBNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvblJlY3Q7XG4gICAgICAgICAgICBjb25zdCBsb2NzOiBBcnJheTxNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbj4gPSBuZXcgQXJyYXk8TWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24+KCk7XG4gICAgICAgICAgICBwaW4uY29udGFpbmVkUHVzaHBpbnMuZm9yRWFjaChwID0+IGxvY3MucHVzaChwLmdldExvY2F0aW9uKCkpKTtcbiAgICAgICAgICAgIGJvdW5kcyA9IE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uUmVjdC5mcm9tTG9jYXRpb25zKGxvY3MpO1xuXG4gICAgICAgICAgICAvLyBab29tIGludG8gdGhlIGJvdW5kaW5nIGJveCBvZiB0aGUgY2x1c3Rlci5cbiAgICAgICAgICAgIC8vIEFkZCBhIHBhZGRpbmcgdG8gY29tcGVuc2F0ZSBmb3IgdGhlIHBpeGVsIGFyZWEgb2YgdGhlIHB1c2hwaW5zLlxuICAgICAgICAgICAgKDxCaW5nTWFwU2VydmljZT50aGlzLl9tYXBTZXJ2aWNlKS5NYXBQcm9taXNlLnRoZW4oKG06IE1pY3Jvc29mdC5NYXBzLk1hcCkgPT4ge1xuICAgICAgICAgICAgICAgIG0uc2V0Vmlldyh7IGJvdW5kczogYm91bmRzLCBwYWRkaW5nOiA3NSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG59XG4iXX0=