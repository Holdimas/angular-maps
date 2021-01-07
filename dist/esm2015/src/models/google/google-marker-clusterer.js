import { GoogleMarker } from './google-marker';
import { Marker } from '../marker';
import { ClusterPlacementMode } from '../cluster-placement-mode';
import { timer } from 'rxjs';
/**
 * Concrete implementation of a clustering layer for the Google Map Provider.
 *
 * @export
 */
export class GoogleMarkerClusterer {
    ///
    /// Constructor
    ///
    /**
     * Creates a new instance of the GoogleMarkerClusterer class.
     *
     * @param _layer GoogleMapTypes.MarkerClusterer. Native Google Maps Marker Clusterer supporting the cluster layer.
     * @param _maps MapService. MapService implementation to leverage for the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    constructor(_layer) {
        this._layer = _layer;
        ///
        /// Field declarations
        ///
        this._isClustering = true;
        this._markerLookup = new Map();
        this._markers = new Array();
        this._pendingMarkers = new Array();
        this._mapclicks = 0;
        this._currentZoom = 0;
        this._visible = true;
    }
    ///
    /// Property definitions
    ///
    /**
     * Get the native primitive underneath the abstraction layer.
     *
     * @returns GoogleMapTypes.MarkerClusterer.
     *
     * @memberof GoogleMarkerClusterer
     */
    get NativePrimitve() {
        return this._layer;
    }
    ///
    /// Public methods, Layer interface implementation
    ///
    /**
     * Adds an event listener for the layer.
     *
     * @param eventType string. Type of event to add (click, mouseover, etc). You can use any event that the underlying native
     * layer supports.
     * @param fn function. Handler to call when the event occurs.
     *
     * @memberof GoogleMarkerClusterer
     */
    AddListener(eventType, fn) {
        throw (new Error('Events are not supported on Google Cluster Layers. You can still add events to individual markers.'));
    }
    /**
     * Adds an entity to the layer. Use this method with caution as it will
     * trigger a recaluation of the clusters (and associated markers if approprite) for
     * each invocation. If you use this method to add many markers to the cluster, use
     *
     * @param entity Marker. Entity to add to the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    AddEntity(entity) {
        let isMarker = entity instanceof Marker;
        isMarker = entity instanceof GoogleMarker || isMarker;
        if (isMarker) {
            entity.NativePrimitve.setMap(null);
            // remove the marker from the map as the clusterer will control marker visibility.
            if (entity.IsFirst) {
                this.StopClustering();
            }
        }
        if (entity.NativePrimitve && entity.Location) {
            if (this._isClustering && this._visible) {
                this._layer.addMarker(entity.NativePrimitve);
                this._markers.push(entity);
            }
            else {
                this._pendingMarkers.push(entity);
            }
            this._markerLookup.set(entity.NativePrimitve, entity);
        }
        if (isMarker) {
            if (entity.IsLast) {
                this.StartClustering();
            }
        }
    }
    /**
     * Adds a number of markers to the layer.
     *
     * @param entities Array<Marker>. Entities to add to the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    AddEntities(entities) {
        if (entities != null && Array.isArray(entities) && entities.length !== 0) {
            const e = entities.map(p => {
                this._markerLookup.set(p.NativePrimitve, p);
                p.NativePrimitve.setMap(null);
                // remove the marker from the map as the clusterer will control marker visibility.
                return p.NativePrimitve;
            });
            if (this._isClustering && this._visible) {
                this._layer.addMarkers(e);
                this._markers.push(...entities);
            }
            else {
                // if layer is not visible, always add to pendingMarkers. Setting the layer to visible later
                // will render the markers appropriately
                this._pendingMarkers.push(...entities);
            }
        }
    }
    /**
     * Deletes the clustering layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    Delete() {
        this._layer.getMarkers().forEach(m => {
            m.setMap(null);
            // remove the marker from the map as the clusterer will control marker visibility.
        });
        this._layer.clearMarkers();
        this._markers.splice(0);
        this._pendingMarkers.splice(0);
    }
    /**
     * Returns the abstract marker used to wrap the Google Marker.
     *
     * @returns Marker. The abstract marker object representing the pushpin.
     *
     * @memberof GoogleMarkerClusterer
     */
    GetMarkerFromGoogleMarker(pin) {
        const m = this._markerLookup.get(pin);
        return m;
    }
    /**
     * Returns the options governing the behavior of the layer.
     *
     * @returns IClusterOptions. The layer options.
     *
     * @memberof GoogleMarkerClusterer
     */
    GetOptions() {
        const options = {
            id: 0,
            gridSize: this._layer.getGridSize(),
            clusteringEnabled: this._layer.getGridSize() === 0,
            maxZoom: this._layer.getMaxZoom(),
            minimumClusterSize: this._layer.getMinClusterSize(),
            placementMode: this._layer.isAverageCenter() ? ClusterPlacementMode.MeanValue : ClusterPlacementMode.FirstPin,
            visible: this._visible,
            zoomOnClick: this._layer.isZoomOnClick(),
            styles: this._layer.getStyles()
        };
        return options;
    }
    /**
     * Returns the visibility state of the layer.
     *
     * @returns Boolean. True is the layer is visible, false otherwise.
     *
     * @memberof GoogleMarkerClusterer
     */
    GetVisible() {
        return this._visible;
    }
    /**
     * Removes an entity from the cluster layer.
     *
     * @param entity Marker Entity to be removed from the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    RemoveEntity(entity) {
        if (entity.NativePrimitve && entity.Location) {
            const j = this._markers.indexOf(entity);
            const k = this._pendingMarkers.indexOf(entity);
            if (j > -1) {
                this._markers.splice(j, 1);
            }
            if (k > -1) {
                this._pendingMarkers.splice(k, 1);
            }
            if (this._isClustering) {
                this._layer.removeMarker(entity.NativePrimitve);
            }
            this._markerLookup.delete(entity.NativePrimitve);
        }
    }
    /**
     * Sets the entities for the cluster layer.
     *
     * @param entities Array<Marker> containing
     * the entities to add to the cluster. This replaces any existing entities.
     *
     * @memberof GoogleMarkerClusterer
     */
    SetEntities(entities) {
        this._layer.getMarkers().forEach(m => {
            m.setMap(null);
        });
        this._layer.clearMarkers();
        this._markers.splice(0);
        this._pendingMarkers.splice(0);
        this._markerLookup.clear();
        const p = new Array();
        entities.forEach((e) => {
            if (e.NativePrimitve && e.Location) {
                e.NativePrimitve.setMap(null);
                this._markerLookup.set(e.NativePrimitve, e);
                if (this._visible) {
                    this._markers.push(e);
                    p.push(e.NativePrimitve);
                }
                else {
                    this._pendingMarkers.push(e);
                }
            }
        });
        this._layer.addMarkers(p);
    }
    /**
     * Sets the options for the cluster layer.
     *
     * @param options IClusterOptions containing the options enumeration controlling the layer behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof GoogleMarkerClusterer
     */
    SetOptions(options) {
        if (options.placementMode != null) {
            throw (new Error('GoogleMarkerClusterer: PlacementMode option cannot be set after initial creation.'));
        }
        if (options.zoomOnClick != null) {
            throw (new Error('GoogleMarkerClusterer: ZoomOnClick option cannot be set after initial creation.'));
        }
        if (options.callback != null) { }
        if (options.clusteringEnabled != null) {
            this._layer.setMinClusterSize(options.clusteringEnabled ? 1 : 10000000);
            this._layer.resetViewport();
            this._layer.redraw();
        }
        if (options.gridSize != null && (options.clusteringEnabled == null || options.clusteringEnabled)) {
            this._layer.setGridSize(options.gridSize);
            this._layer.resetViewport();
            this._layer.redraw();
        }
        if (options.maxZoom != null) {
            this._layer.setMaxZoom(options.maxZoom);
        }
        if (options.minimumClusterSize != null) {
            this._layer.setMinClusterSize(options.minimumClusterSize);
        }
        if (options.styles != null) {
            this._layer.setStyles(options.styles);
        }
        if (options.visible != null) {
            this.SetVisible(options.visible);
        }
    }
    /**
     * Toggles the cluster layer visibility.
     *
     * @param visible Boolean true to make the layer visible, false to hide the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    SetVisible(visible) {
        const map = visible ? this._layer.getMap() : null;
        if (!visible) {
            this._layer.resetViewport(true);
        }
        else {
            const p = new Array();
            if (this._pendingMarkers.length > 0) {
                this._pendingMarkers.forEach(e => {
                    if (e.NativePrimitve && e.Location) {
                        p.push(e.NativePrimitve);
                    }
                });
                this._layer.addMarkers(p);
                this._markers = this._markers.concat(this._pendingMarkers.splice(0));
            }
            else {
                this._layer.redraw();
            }
        }
        this._visible = visible;
    }
    /**
     * Start to actually cluster the entities in a cluster layer. This method should be called after the initial set of entities
     * have been added to the cluster. This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @memberof GoogleMarkerClusterer
     */
    StartClustering() {
        if (this._isClustering) {
            return;
        }
        if (this._visible) {
            const p = new Array();
            this._markers.forEach(e => {
                if (e.NativePrimitve && e.Location) {
                    p.push(e.NativePrimitve);
                }
            });
            this._pendingMarkers.forEach(e => {
                if (e.NativePrimitve && e.Location) {
                    p.push(e.NativePrimitve);
                }
            });
            this._layer.addMarkers(p);
            this._markers = this._markers.concat(this._pendingMarkers.splice(0));
        }
        if (!this._visible) {
            // only add the markers if the layer is visible. Otherwise, keep them pending. They would be added once the
            // layer is set to visible.
            timer(0).subscribe(() => {
                this._layer.resetViewport(true);
            });
        }
        this._isClustering = true;
    }
    /**
     * Stop to actually cluster the entities in a cluster layer.
     * This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @returns
     *
     * @memberof GoogleMarkerClusterer
     */
    StopClustering() {
        if (!this._isClustering) {
            return;
        }
        this._isClustering = false;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLW1hcmtlci1jbHVzdGVyZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvbW9kZWxzL2dvb2dsZS9nb29nbGUtbWFya2VyLWNsdXN0ZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFJL0MsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUVuQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUVqRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBRTdCOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8scUJBQXFCO0lBNEI5QixHQUFHO0lBQ0gsZUFBZTtJQUNmLEdBQUc7SUFFSDs7Ozs7OztPQU9HO0lBQ0gsWUFBb0IsTUFBc0M7UUFBdEMsV0FBTSxHQUFOLE1BQU0sQ0FBZ0M7UUF0QzFELEdBQUc7UUFDSCxzQkFBc0I7UUFDdEIsR0FBRztRQUNLLGtCQUFhLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLGtCQUFhLEdBQXVDLElBQUksR0FBRyxFQUFpQyxDQUFDO1FBQzdGLGFBQVEsR0FBa0IsSUFBSSxLQUFLLEVBQVUsQ0FBQztRQUM5QyxvQkFBZSxHQUFrQixJQUFJLEtBQUssRUFBVSxDQUFDO1FBQ3JELGVBQVUsR0FBVyxDQUFDLENBQUM7UUFDdkIsaUJBQVksR0FBVyxDQUFDLENBQUM7UUFDekIsYUFBUSxHQUFZLElBQUksQ0FBQztJQTZCNkIsQ0FBQztJQTNCL0QsR0FBRztJQUNILHdCQUF3QjtJQUN4QixHQUFHO0lBRUg7Ozs7OztPQU1HO0lBQ0gsSUFBVyxjQUFjO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBaUJELEdBQUc7SUFDSCxrREFBa0Q7SUFDbEQsR0FBRztJQUVIOzs7Ozs7OztPQVFHO0lBQ0ksV0FBVyxDQUFDLFNBQWlCLEVBQUUs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O1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDN0IsSUFBSSxDQUFDLENBQUMsY0FBYyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUU7b0JBQ2hDLENBQUMsQ0FBQyxJQUFJLENBQXdCLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztpQkFDbkQ7WUFDTCxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN4RTtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2hCLDJHQUEyRztZQUMzRywyQkFBMkI7WUFDM0IsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDO1NBQ047UUFDRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztJQUM5QixDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0ksY0FBYztRQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUFFLE9BQU87U0FBRTtRQUNwQyxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztJQUMvQixDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBHb29nbGVNYXJrZXIgfSBmcm9tICcuL2dvb2dsZS1tYXJrZXInO1xuaW1wb3J0IHsgSUNsdXN0ZXJPcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pY2x1c3Rlci1vcHRpb25zJztcbmltcG9ydCB7IE1hcFNlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBMYXllciB9IGZyb20gJy4uL2xheWVyJztcbmltcG9ydCB7IE1hcmtlciB9IGZyb20gJy4uL21hcmtlcic7XG5pbXBvcnQgeyBJbmZvV2luZG93IH0gZnJvbSAnLi4vaW5mby13aW5kb3cnO1xuaW1wb3J0IHsgQ2x1c3RlclBsYWNlbWVudE1vZGUgfSBmcm9tICcuLi9jbHVzdGVyLXBsYWNlbWVudC1tb2RlJztcbmltcG9ydCAqIGFzIEdvb2dsZU1hcFR5cGVzIGZyb20gJy4uLy4uL3NlcnZpY2VzL2dvb2dsZS9nb29nbGUtbWFwLXR5cGVzJztcbmltcG9ydCB7IHRpbWVyIH0gZnJvbSAncnhqcyc7XG5cbi8qKlxuICogQ29uY3JldGUgaW1wbGVtZW50YXRpb24gb2YgYSBjbHVzdGVyaW5nIGxheWVyIGZvciB0aGUgR29vZ2xlIE1hcCBQcm92aWRlci5cbiAqXG4gKiBAZXhwb3J0XG4gKi9cbmV4cG9ydCBjbGFzcyBHb29nbGVNYXJrZXJDbHVzdGVyZXIgaW1wbGVtZW50cyBMYXllciB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfaXNDbHVzdGVyaW5nID0gdHJ1ZTtcbiAgICBwcml2YXRlIF9tYXJrZXJMb29rdXA6IE1hcDxHb29nbGVNYXBUeXBlcy5NYXJrZXIsIE1hcmtlcj4gPSBuZXcgTWFwPEdvb2dsZU1hcFR5cGVzLk1hcmtlciwgTWFya2VyPigpO1xuICAgIHByaXZhdGUgX21hcmtlcnM6IEFycmF5PE1hcmtlcj4gPSBuZXcgQXJyYXk8TWFya2VyPigpO1xuICAgIHByaXZhdGUgX3BlbmRpbmdNYXJrZXJzOiBBcnJheTxNYXJrZXI+ID0gbmV3IEFycmF5PE1hcmtlcj4oKTtcbiAgICBwcml2YXRlIF9tYXBjbGlja3M6IG51bWJlciA9IDA7XG4gICAgcHJpdmF0ZSBfY3VycmVudFpvb206IG51bWJlciA9IDA7XG4gICAgcHJpdmF0ZSBfdmlzaWJsZTogYm9vbGVhbiA9IHRydWU7XG5cbiAgICAvLy9cbiAgICAvLy8gUHJvcGVydHkgZGVmaW5pdGlvbnNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbmF0aXZlIHByaW1pdGl2ZSB1bmRlcm5lYXRoIHRoZSBhYnN0cmFjdGlvbiBsYXllci5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIEdvb2dsZU1hcFR5cGVzLk1hcmtlckNsdXN0ZXJlci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJDbHVzdGVyZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IE5hdGl2ZVByaW1pdHZlKCk6IEdvb2dsZU1hcFR5cGVzLk1hcmtlckNsdXN0ZXJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sYXllcjtcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gQ29uc3RydWN0b3JcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIEdvb2dsZU1hcmtlckNsdXN0ZXJlciBjbGFzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfbGF5ZXIgR29vZ2xlTWFwVHlwZXMuTWFya2VyQ2x1c3RlcmVyLiBOYXRpdmUgR29vZ2xlIE1hcHMgTWFya2VyIENsdXN0ZXJlciBzdXBwb3J0aW5nIHRoZSBjbHVzdGVyIGxheWVyLlxuICAgICAqIEBwYXJhbSBfbWFwcyBNYXBTZXJ2aWNlLiBNYXBTZXJ2aWNlIGltcGxlbWVudGF0aW9uIHRvIGxldmVyYWdlIGZvciB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFya2VyQ2x1c3RlcmVyXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbGF5ZXI6IEdvb2dsZU1hcFR5cGVzLk1hcmtlckNsdXN0ZXJlcikgeyB9XG5cblxuICAgIC8vL1xuICAgIC8vLyBQdWJsaWMgbWV0aG9kcywgTGF5ZXIgaW50ZXJmYWNlIGltcGxlbWVudGF0aW9uXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGFuIGV2ZW50IGxpc3RlbmVyIGZvciB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXZlbnRUeXBlIHN0cmluZy4gVHlwZSBvZiBldmVudCB0byBhZGQgKGNsaWNrLCBtb3VzZW92ZXIsIGV0YykuIFlvdSBjYW4gdXNlIGFueSBldmVudCB0aGF0IHRoZSB1bmRlcmx5aW5nIG5hdGl2ZVxuICAgICAqIGxheWVyIHN1cHBvcnRzLlxuICAgICAqIEBwYXJhbSBmbiBmdW5jdGlvbi4gSGFuZGxlciB0byBjYWxsIHdoZW4gdGhlIGV2ZW50IG9jY3Vycy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJDbHVzdGVyZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkTGlzdGVuZXIoZXZlbnRUeXBlOiBzdHJpbmcsIGZuOiBGdW5jdGlvbik6IHZvaWQge1xuICAgICAgICB0aHJvdyAobmV3IEVycm9yKCdFdmVudHMgYXJlIG5vdCBzdXBwb3J0ZWQgb24gR29vZ2xlIENsdXN0ZXIgTGF5ZXJzLiBZb3UgY2FuIHN0aWxsIGFkZCBldmVudHMgdG8gaW5kaXZpZHVhbCBtYXJrZXJzLicpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGFuIGVudGl0eSB0byB0aGUgbGF5ZXIuIFVzZSB0aGlzIG1ldGhvZCB3aXRoIGNhdXRpb24gYXMgaXQgd2lsbFxuICAgICAqIHRyaWdnZXIgYSByZWNhbHVhdGlvbiBvZiB0aGUgY2x1c3RlcnMgKGFuZCBhc3NvY2lhdGVkIG1hcmtlcnMgaWYgYXBwcm9wcml0ZSkgZm9yXG4gICAgICogZWFjaCBpbnZvY2F0aW9uLiBJZiB5b3UgdXNlIHRoaXMgbWV0aG9kIHRvIGFkZCBtYW55IG1hcmtlcnMgdG8gdGhlIGNsdXN0ZXIsIHVzZVxuICAgICAqXG4gICAgICogQHBhcmFtIGVudGl0eSBNYXJrZXIuIEVudGl0eSB0byBhZGQgdG8gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcmtlckNsdXN0ZXJlclxuICAgICAqL1xuICAgIHB1YmxpYyBBZGRFbnRpdHkoZW50aXR5OiBNYXJrZXIpOiB2b2lkIHtcbiAgICAgICAgbGV0IGlzTWFya2VyOiBib29sZWFuID0gZW50aXR5IGluc3RhbmNlb2YgTWFya2VyO1xuICAgICAgICBpc01hcmtlciA9IGVudGl0eSBpbnN0YW5jZW9mIEdvb2dsZU1hcmtlciB8fCBpc01hcmtlcjtcbiAgICAgICAgaWYgKGlzTWFya2VyKSB7XG4gICAgICAgICAgICBlbnRpdHkuTmF0aXZlUHJpbWl0dmUuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgbWFya2VyIGZyb20gdGhlIG1hcCBhcyB0aGUgY2x1c3RlcmVyIHdpbGwgY29udHJvbCBtYXJrZXIgdmlzaWJpbGl0eS5cbiAgICAgICAgICAgIGlmIChlbnRpdHkuSXNGaXJzdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuU3RvcENsdXN0ZXJpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZW50aXR5Lk5hdGl2ZVByaW1pdHZlICYmIGVudGl0eS5Mb2NhdGlvbikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2lzQ2x1c3RlcmluZyAmJiB0aGlzLl92aXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGF5ZXIuYWRkTWFya2VyKGVudGl0eS5OYXRpdmVQcmltaXR2ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFya2Vycy5wdXNoKGVudGl0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wZW5kaW5nTWFya2Vycy5wdXNoKGVudGl0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9tYXJrZXJMb29rdXAuc2V0KGVudGl0eS5OYXRpdmVQcmltaXR2ZSwgZW50aXR5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNNYXJrZXIpIHtcbiAgICAgICAgICAgIGlmIChlbnRpdHkuSXNMYXN0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5TdGFydENsdXN0ZXJpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBudW1iZXIgb2YgbWFya2VycyB0byB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZW50aXRpZXMgQXJyYXk8TWFya2VyPi4gRW50aXRpZXMgdG8gYWRkIHRvIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJDbHVzdGVyZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkRW50aXRpZXMoZW50aXRpZXM6IEFycmF5PE1hcmtlcj4pOiB2b2lkIHtcbiAgICAgICAgaWYgKGVudGl0aWVzICE9IG51bGwgJiYgQXJyYXkuaXNBcnJheShlbnRpdGllcykgJiYgZW50aXRpZXMubGVuZ3RoICE9PSAwICkge1xuICAgICAgICAgICAgY29uc3QgZTogQXJyYXk8R29vZ2xlTWFwVHlwZXMuTWFya2VyPiA9IGVudGl0aWVzLm1hcChwID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXJrZXJMb29rdXAuc2V0KHAuTmF0aXZlUHJpbWl0dmUsIHApO1xuICAgICAgICAgICAgICAgIHAuTmF0aXZlUHJpbWl0dmUuc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIG1hcmtlciBmcm9tIHRoZSBtYXAgYXMgdGhlIGNsdXN0ZXJlciB3aWxsIGNvbnRyb2wgbWFya2VyIHZpc2liaWxpdHkuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHAuTmF0aXZlUHJpbWl0dmU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0NsdXN0ZXJpbmcgJiYgdGhpcy5fdmlzaWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xheWVyLmFkZE1hcmtlcnMoZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFya2Vycy5wdXNoKC4uLmVudGl0aWVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGlmIGxheWVyIGlzIG5vdCB2aXNpYmxlLCBhbHdheXMgYWRkIHRvIHBlbmRpbmdNYXJrZXJzLiBTZXR0aW5nIHRoZSBsYXllciB0byB2aXNpYmxlIGxhdGVyXG4gICAgICAgICAgICAgICAgLy8gd2lsbCByZW5kZXIgdGhlIG1hcmtlcnMgYXBwcm9wcmlhdGVseVxuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdNYXJrZXJzLnB1c2goLi4uZW50aXRpZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVsZXRlcyB0aGUgY2x1c3RlcmluZyBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJDbHVzdGVyZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgRGVsZXRlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLl9sYXllci5nZXRNYXJrZXJzKCkuZm9yRWFjaChtID0+IHtcbiAgICAgICAgICAgIG0uc2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgbWFya2VyIGZyb20gdGhlIG1hcCBhcyB0aGUgY2x1c3RlcmVyIHdpbGwgY29udHJvbCBtYXJrZXIgdmlzaWJpbGl0eS5cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2xheWVyLmNsZWFyTWFya2VycygpO1xuICAgICAgICB0aGlzLl9tYXJrZXJzLnNwbGljZSgwKTtcbiAgICAgICAgdGhpcy5fcGVuZGluZ01hcmtlcnMuc3BsaWNlKDApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGFic3RyYWN0IG1hcmtlciB1c2VkIHRvIHdyYXAgdGhlIEdvb2dsZSBNYXJrZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBNYXJrZXIuIFRoZSBhYnN0cmFjdCBtYXJrZXIgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgcHVzaHBpbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJDbHVzdGVyZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0TWFya2VyRnJvbUdvb2dsZU1hcmtlcihwaW46IEdvb2dsZU1hcFR5cGVzLk1hcmtlcik6IE1hcmtlciB7XG4gICAgICAgIGNvbnN0IG06IE1hcmtlciA9IHRoaXMuX21hcmtlckxvb2t1cC5nZXQocGluKTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgb3B0aW9ucyBnb3Zlcm5pbmcgdGhlIGJlaGF2aW9yIG9mIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIElDbHVzdGVyT3B0aW9ucy4gVGhlIGxheWVyIG9wdGlvbnMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFya2VyQ2x1c3RlcmVyXG4gICAgICovXG4gICAgcHVibGljIEdldE9wdGlvbnMoKTogSUNsdXN0ZXJPcHRpb25zIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uczogSUNsdXN0ZXJPcHRpb25zID0ge1xuICAgICAgICAgICAgaWQ6IDAsXG4gICAgICAgICAgICBncmlkU2l6ZTogdGhpcy5fbGF5ZXIuZ2V0R3JpZFNpemUoKSxcbiAgICAgICAgICAgIGNsdXN0ZXJpbmdFbmFibGVkOiB0aGlzLl9sYXllci5nZXRHcmlkU2l6ZSgpID09PSAwLFxuICAgICAgICAgICAgbWF4Wm9vbTogdGhpcy5fbGF5ZXIuZ2V0TWF4Wm9vbSgpLFxuICAgICAgICAgICAgbWluaW11bUNsdXN0ZXJTaXplOiB0aGlzLl9sYXllci5nZXRNaW5DbHVzdGVyU2l6ZSgpLFxuICAgICAgICAgICAgcGxhY2VtZW50TW9kZTogdGhpcy5fbGF5ZXIuaXNBdmVyYWdlQ2VudGVyKCkgPyBDbHVzdGVyUGxhY2VtZW50TW9kZS5NZWFuVmFsdWUgOiBDbHVzdGVyUGxhY2VtZW50TW9kZS5GaXJzdFBpbixcbiAgICAgICAgICAgIHZpc2libGU6IHRoaXMuX3Zpc2libGUsXG4gICAgICAgICAgICB6b29tT25DbGljazogdGhpcy5fbGF5ZXIuaXNab29tT25DbGljaygpLFxuICAgICAgICAgICAgc3R5bGVzOiB0aGlzLl9sYXllci5nZXRTdHlsZXMoKVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB2aXNpYmlsaXR5IHN0YXRlIG9mIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIEJvb2xlYW4uIFRydWUgaXMgdGhlIGxheWVyIGlzIHZpc2libGUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJDbHVzdGVyZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0VmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Zpc2libGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbiBlbnRpdHkgZnJvbSB0aGUgY2x1c3RlciBsYXllci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbnRpdHkgTWFya2VyIEVudGl0eSB0byBiZSByZW1vdmVkIGZyb20gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcmtlckNsdXN0ZXJlclxuICAgICAqL1xuICAgIHB1YmxpYyBSZW1vdmVFbnRpdHkoZW50aXR5OiBNYXJrZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKGVudGl0eS5OYXRpdmVQcmltaXR2ZSAmJiBlbnRpdHkuTG9jYXRpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IGo6IG51bWJlciA9IHRoaXMuX21hcmtlcnMuaW5kZXhPZihlbnRpdHkpO1xuICAgICAgICAgICAgY29uc3QgazogbnVtYmVyID0gdGhpcy5fcGVuZGluZ01hcmtlcnMuaW5kZXhPZihlbnRpdHkpO1xuICAgICAgICAgICAgaWYgKGogPiAtMSkgeyB0aGlzLl9tYXJrZXJzLnNwbGljZShqLCAxKTsgfVxuICAgICAgICAgICAgaWYgKGsgPiAtMSkgeyB0aGlzLl9wZW5kaW5nTWFya2Vycy5zcGxpY2UoaywgMSk7IH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9pc0NsdXN0ZXJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYXllci5yZW1vdmVNYXJrZXIoZW50aXR5Lk5hdGl2ZVByaW1pdHZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX21hcmtlckxvb2t1cC5kZWxldGUoZW50aXR5Lk5hdGl2ZVByaW1pdHZlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGVudGl0aWVzIGZvciB0aGUgY2x1c3RlciBsYXllci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbnRpdGllcyBBcnJheTxNYXJrZXI+IGNvbnRhaW5pbmdcbiAgICAgKiB0aGUgZW50aXRpZXMgdG8gYWRkIHRvIHRoZSBjbHVzdGVyLiBUaGlzIHJlcGxhY2VzIGFueSBleGlzdGluZyBlbnRpdGllcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJDbHVzdGVyZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0RW50aXRpZXMoZW50aXRpZXM6IEFycmF5PE1hcmtlcj4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbGF5ZXIuZ2V0TWFya2VycygpLmZvckVhY2gobSA9PiB7XG4gICAgICAgICAgICBtLnNldE1hcChudWxsKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2xheWVyLmNsZWFyTWFya2VycygpO1xuICAgICAgICB0aGlzLl9tYXJrZXJzLnNwbGljZSgwKTtcbiAgICAgICAgdGhpcy5fcGVuZGluZ01hcmtlcnMuc3BsaWNlKDApO1xuICAgICAgICB0aGlzLl9tYXJrZXJMb29rdXAuY2xlYXIoKTtcblxuICAgICAgICBjb25zdCBwOiBBcnJheTxHb29nbGVNYXBUeXBlcy5NYXJrZXI+ID0gbmV3IEFycmF5PEdvb2dsZU1hcFR5cGVzLk1hcmtlcj4oKTtcbiAgICAgICAgZW50aXRpZXMuZm9yRWFjaCgoZTogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoZS5OYXRpdmVQcmltaXR2ZSAmJiBlLkxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgZS5OYXRpdmVQcmltaXR2ZS5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFya2VyTG9va3VwLnNldChlLk5hdGl2ZVByaW1pdHZlLCBlKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXJrZXJzLnB1c2goZSk7XG4gICAgICAgICAgICAgICAgICAgIHAucHVzaChlLk5hdGl2ZVByaW1pdHZlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdNYXJrZXJzLnB1c2goZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fbGF5ZXIuYWRkTWFya2VycyhwKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBvcHRpb25zIGZvciB0aGUgY2x1c3RlciBsYXllci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIElDbHVzdGVyT3B0aW9ucyBjb250YWluaW5nIHRoZSBvcHRpb25zIGVudW1lcmF0aW9uIGNvbnRyb2xsaW5nIHRoZSBsYXllciBiZWhhdmlvci4gVGhlIHN1cHBsaWVkIG9wdGlvbnNcbiAgICAgKiBhcmUgbWVyZ2VkIHdpdGggdGhlIGRlZmF1bHQvZXhpc3Rpbmcgb3B0aW9ucy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJDbHVzdGVyZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0T3B0aW9ucyhvcHRpb25zOiBJQ2x1c3Rlck9wdGlvbnMpOiB2b2lkIHtcbiAgICAgICAgaWYgKG9wdGlvbnMucGxhY2VtZW50TW9kZSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyhuZXcgRXJyb3IoJ0dvb2dsZU1hcmtlckNsdXN0ZXJlcjogUGxhY2VtZW50TW9kZSBvcHRpb24gY2Fubm90IGJlIHNldCBhZnRlciBpbml0aWFsIGNyZWF0aW9uLicpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy56b29tT25DbGljayAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyhuZXcgRXJyb3IoJ0dvb2dsZU1hcmtlckNsdXN0ZXJlcjogWm9vbU9uQ2xpY2sgb3B0aW9uIGNhbm5vdCBiZSBzZXQgYWZ0ZXIgaW5pdGlhbCBjcmVhdGlvbi4nKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuY2FsbGJhY2sgIT0gbnVsbCkge31cbiAgICAgICAgaWYgKG9wdGlvbnMuY2x1c3RlcmluZ0VuYWJsZWQgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fbGF5ZXIuc2V0TWluQ2x1c3RlclNpemUob3B0aW9ucy5jbHVzdGVyaW5nRW5hYmxlZCA/IDEgOiAxMDAwMDAwMCk7XG4gICAgICAgICAgICB0aGlzLl9sYXllci5yZXNldFZpZXdwb3J0KCk7XG4gICAgICAgICAgICB0aGlzLl9sYXllci5yZWRyYXcoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5ncmlkU2l6ZSAhPSBudWxsICYmIChvcHRpb25zLmNsdXN0ZXJpbmdFbmFibGVkID09IG51bGwgfHwgb3B0aW9ucy5jbHVzdGVyaW5nRW5hYmxlZCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2xheWVyLnNldEdyaWRTaXplKG9wdGlvbnMuZ3JpZFNpemUpO1xuICAgICAgICAgICAgdGhpcy5fbGF5ZXIucmVzZXRWaWV3cG9ydCgpO1xuICAgICAgICAgICAgdGhpcy5fbGF5ZXIucmVkcmF3KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMubWF4Wm9vbSAhPSBudWxsKSB7IHRoaXMuX2xheWVyLnNldE1heFpvb20ob3B0aW9ucy5tYXhab29tKTsgfVxuICAgICAgICBpZiAob3B0aW9ucy5taW5pbXVtQ2x1c3RlclNpemUgIT0gbnVsbCkgeyB0aGlzLl9sYXllci5zZXRNaW5DbHVzdGVyU2l6ZShvcHRpb25zLm1pbmltdW1DbHVzdGVyU2l6ZSk7IH1cbiAgICAgICAgaWYgKG9wdGlvbnMuc3R5bGVzICE9IG51bGwpIHsgdGhpcy5fbGF5ZXIuc2V0U3R5bGVzKG9wdGlvbnMuc3R5bGVzKTsgfVxuICAgICAgICBpZiAob3B0aW9ucy52aXNpYmxlICE9IG51bGwpIHsgdGhpcy5TZXRWaXNpYmxlKG9wdGlvbnMudmlzaWJsZSk7IH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGVzIHRoZSBjbHVzdGVyIGxheWVyIHZpc2liaWxpdHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdmlzaWJsZSBCb29sZWFuIHRydWUgdG8gbWFrZSB0aGUgbGF5ZXIgdmlzaWJsZSwgZmFsc2UgdG8gaGlkZSB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFya2VyQ2x1c3RlcmVyXG4gICAgICovXG4gICAgcHVibGljIFNldFZpc2libGUodmlzaWJsZTogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBjb25zdCBtYXA6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCA9IHZpc2libGUgPyB0aGlzLl9sYXllci5nZXRNYXAoKSA6IG51bGw7XG4gICAgICAgIGlmICghdmlzaWJsZSkge1xuICAgICAgICAgICAgdGhpcy5fbGF5ZXIucmVzZXRWaWV3cG9ydCh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHA6IEFycmF5PEdvb2dsZU1hcFR5cGVzLk1hcmtlcj4gPSBuZXcgQXJyYXk8R29vZ2xlTWFwVHlwZXMuTWFya2VyPigpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3BlbmRpbmdNYXJrZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wZW5kaW5nTWFya2Vycy5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5OYXRpdmVQcmltaXR2ZSAmJiBlLkxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwLnB1c2goPEdvb2dsZU1hcFR5cGVzLk1hcmtlcj5lLk5hdGl2ZVByaW1pdHZlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xheWVyLmFkZE1hcmtlcnMocCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFya2VycyA9IHRoaXMuX21hcmtlcnMuY29uY2F0KHRoaXMuX3BlbmRpbmdNYXJrZXJzLnNwbGljZSgwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYXllci5yZWRyYXcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl92aXNpYmxlID0gdmlzaWJsZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdGFydCB0byBhY3R1YWxseSBjbHVzdGVyIHRoZSBlbnRpdGllcyBpbiBhIGNsdXN0ZXIgbGF5ZXIuIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIGluaXRpYWwgc2V0IG9mIGVudGl0aWVzXG4gICAgICogaGF2ZSBiZWVuIGFkZGVkIHRvIHRoZSBjbHVzdGVyLiBUaGlzIG1ldGhvZCBpcyB1c2VkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIGFzIGFkZGluZyBhbiBlbnRpdGl5IHdpbGwgcmVjYWxjdWxhdGUgYWxsIGNsdXN0ZXJzLlxuICAgICAqIEFzIHN1Y2gsIFN0b3BDbHVzdGVyaW5nIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIGFkZGluZyBtYW55IGVudGl0aWVzIGFuZCBTdGFydENsdXN0ZXJpbmcgc2hvdWxkIGJlIGNhbGxlZCBvbmNlIGFkZGluZyBpc1xuICAgICAqIGNvbXBsZXRlIHRvIHJlY2FsY3VsYXRlIHRoZSBjbHVzdGVycy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJDbHVzdGVyZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgU3RhcnRDbHVzdGVyaW5nKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5faXNDbHVzdGVyaW5nKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGlmICh0aGlzLl92aXNpYmxlKSB7XG4gICAgICAgICAgICBjb25zdCBwOiBBcnJheTxHb29nbGVNYXBUeXBlcy5NYXJrZXI+ID0gbmV3IEFycmF5PEdvb2dsZU1hcFR5cGVzLk1hcmtlcj4oKTtcbiAgICAgICAgICAgIHRoaXMuX21hcmtlcnMuZm9yRWFjaChlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZS5OYXRpdmVQcmltaXR2ZSAmJiBlLkxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHAucHVzaCg8R29vZ2xlTWFwVHlwZXMuTWFya2VyPmUuTmF0aXZlUHJpbWl0dmUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ01hcmtlcnMuZm9yRWFjaChlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZS5OYXRpdmVQcmltaXR2ZSAmJiBlLkxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHAucHVzaCg8R29vZ2xlTWFwVHlwZXMuTWFya2VyPmUuTmF0aXZlUHJpbWl0dmUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fbGF5ZXIuYWRkTWFya2VycyhwKTtcbiAgICAgICAgICAgIHRoaXMuX21hcmtlcnMgPSB0aGlzLl9tYXJrZXJzLmNvbmNhdCh0aGlzLl9wZW5kaW5nTWFya2Vycy5zcGxpY2UoMCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl92aXNpYmxlKSB7XG4gICAgICAgICAgICAvLyBvbmx5IGFkZCB0aGUgbWFya2VycyBpZiB0aGUgbGF5ZXIgaXMgdmlzaWJsZS4gT3RoZXJ3aXNlLCBrZWVwIHRoZW0gcGVuZGluZy4gVGhleSB3b3VsZCBiZSBhZGRlZCBvbmNlIHRoZVxuICAgICAgICAgICAgLy8gbGF5ZXIgaXMgc2V0IHRvIHZpc2libGUuXG4gICAgICAgICAgICB0aW1lcigwKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xheWVyLnJlc2V0Vmlld3BvcnQodHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pc0NsdXN0ZXJpbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3AgdG8gYWN0dWFsbHkgY2x1c3RlciB0aGUgZW50aXRpZXMgaW4gYSBjbHVzdGVyIGxheWVyLlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgYXMgYWRkaW5nIGFuIGVudGl0aXkgd2lsbCByZWNhbGN1bGF0ZSBhbGwgY2x1c3RlcnMuXG4gICAgICogQXMgc3VjaCwgU3RvcENsdXN0ZXJpbmcgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYWRkaW5nIG1hbnkgZW50aXRpZXMgYW5kIFN0YXJ0Q2x1c3RlcmluZyBzaG91bGQgYmUgY2FsbGVkIG9uY2UgYWRkaW5nIGlzXG4gICAgICogY29tcGxldGUgdG8gcmVjYWxjdWxhdGUgdGhlIGNsdXN0ZXJzLlxuICAgICAqXG4gICAgICogQHJldHVybnNcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJDbHVzdGVyZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgU3RvcENsdXN0ZXJpbmcoKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNDbHVzdGVyaW5nKSB7IHJldHVybjsgfVxuICAgICAgICB0aGlzLl9pc0NsdXN0ZXJpbmcgPSBmYWxzZTtcbiAgICB9XG59XG4iXX0=