import { BingConversions } from '../../services/bing/bing-conversions';
import { Marker } from '../marker';
import { BingSpiderClusterMarker } from './bing-spider-cluster-marker';
import { BingMarker } from './bing-marker';
/**
 * Concrete implementation of a clustering layer for the Bing Map Provider.
 *
 * @export
 */
export class BingClusterLayer {
    ///
    /// Constructor
    ///
    /**
     * Creates a new instance of the BingClusterLayer class.
     *
     * @param _layer Microsoft.Maps.ClusterLayer. Native Bing Cluster Layer supporting the cluster layer.
     * @param _maps MapService. MapService implementation to leverage for the layer.
     *
     * @memberof BingClusterLayer
     */
    constructor(_layer, _maps) {
        this._layer = _layer;
        this._maps = _maps;
        ///
        /// Field declarations
        ///
        this._isClustering = true;
        this._markers = new Array();
        this._markerLookup = new Map();
        this._pendingMarkers = new Array();
        this._spiderMarkers = new Array();
        this._spiderMarkerLookup = new Map();
        this._useSpiderCluster = false;
        this._mapclicks = 0;
        this._events = new Array();
        this._currentZoom = 0;
        this._spiderOptions = {
            circleSpiralSwitchover: 9,
            collapseClusterOnMapChange: false,
            collapseClusterOnNthClick: 1,
            invokeClickOnHover: true,
            minCircleLength: 60,
            minSpiralAngleSeperation: 25,
            spiralDistanceFactor: 5,
            stickStyle: {
                strokeColor: 'black',
                strokeThickness: 2
            },
            stickHoverStyle: { strokeColor: 'red' },
            markerSelected: null,
            markerUnSelected: null
        };
        this._currentCluster = null;
    }
    ///
    /// Property definitions
    ///
    /**
     * Get the native primitive underneath the abstraction layer.
     *
     * @returns Microsoft.Maps.ClusterLayer.
     *
     * @memberof BingClusterLayer
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
     * @memberof BingClusterLayer
     */
    AddListener(eventType, fn) {
        Microsoft.Maps.Events.addHandler(this._layer, eventType, (e) => {
            fn(e);
        });
    }
    /**
     * Adds an entity to the layer. Use this method with caution as it will
     * trigger a recaluation of the clusters (and associated markers if approprite) for
     * each invocation. If you use this method to add many markers to the cluster, use
     *
     * @param entity Marker. Entity to add to the layer.
     *
     * @memberof BingClusterLayer
     */
    AddEntity(entity) {
        let isMarker = entity instanceof Marker;
        isMarker = entity instanceof BingMarker || isMarker;
        if (isMarker) {
            if (entity.IsFirst) {
                this.StopClustering();
            }
        }
        if (entity.NativePrimitve && entity.Location) {
            if (this._isClustering) {
                const p = this._layer.getPushpins();
                p.push(entity.NativePrimitve);
                this._layer.setPushpins(p);
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
     * @memberof BingClusterLayer
     */
    AddEntities(entities) {
        if (entities != null && Array.isArray(entities) && entities.length !== 0) {
            const e = entities.map(p => {
                this._markerLookup.set(p.NativePrimitve, p);
                return p.NativePrimitve;
            });
            if (this._isClustering) {
                const p = this._layer.getPushpins();
                p.push(...e);
                this._layer.setPushpins(p);
                this._markers.push(...entities);
            }
            else {
                this._pendingMarkers.push(...entities);
            }
        }
    }
    /**
     * Initializes spider behavior for the clusering layer (when a cluster maker is clicked, it explodes into a spider of the
     * individual underlying pins.
     *
     * @param options ISpiderClusterOptions. Optional. Options governing the behavior of the spider.
     *
     * @memberof BingClusterLayer
     */
    InitializeSpiderClusterSupport(options) {
        if (this._useSpiderCluster) {
            return;
        }
        const m = this._maps.MapInstance;
        this._useSpiderCluster = true;
        this._spiderLayer = new Microsoft.Maps.Layer();
        this._currentZoom = m.getZoom();
        this.SetSpiderOptions(options);
        m.layers.insert(this._spiderLayer);
        ///
        /// Add spider related events....
        ///
        this._events.push(Microsoft.Maps.Events.addHandler(m, 'click', e => this.OnMapClick(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(m, 'viewchangestart', e => this.OnMapViewChangeStart(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(m, 'viewchangeend', e => this.OnMapViewChangeEnd(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(this._layer, 'click', e => this.OnLayerClick(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(this._spiderLayer, 'click', e => this.OnLayerClick(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(this._spiderLayer, 'mouseover', e => this.OnSpiderMouseOver(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(this._spiderLayer, 'mouseout', e => this.OnSpiderMouseOut(e)));
    }
    /**
     * Deletes the clustering layer.
     *
     * @memberof BingClusterLayer
     */
    Delete() {
        if (this._useSpiderCluster) {
            this._spiderLayer.clear();
            this._maps.MapPromise.then(m => {
                m.layers.remove(this._spiderLayer);
                this._spiderLayer = null;
            });
            this._events.forEach(e => Microsoft.Maps.Events.removeHandler(e));
            this._events.splice(0);
            this._useSpiderCluster = false;
        }
        this._markers.splice(0);
        this._spiderMarkers.splice(0);
        this._pendingMarkers.splice(0);
        this._markerLookup.clear();
        this._maps.DeleteLayer(this);
    }
    /**
     * Returns the abstract marker used to wrap the Bing Pushpin.
     *
     * @returns Marker. The abstract marker object representing the pushpin.
     *
     * @memberof BingClusterLayer
     */
    GetMarkerFromBingMarker(pin) {
        const m = this._markerLookup.get(pin);
        return m;
    }
    /**
     * Returns the options governing the behavior of the layer.
     *
     * @returns IClusterOptions. The layer options.
     *
     * @memberof BingClusterLayer
     */
    GetOptions() {
        const o = this._layer.getOptions();
        const options = {
            id: 0,
            gridSize: o.gridSize,
            layerOffset: o.layerOffset,
            clusteringEnabled: o.clusteringEnabled,
            callback: o.callback,
            clusteredPinCallback: o.clusteredPinCallback,
            visible: o.visible,
            zIndex: o.zIndex
        };
        return options;
    }
    /**
     * Returns the visibility state of the layer.
     *
     * @returns Boolean. True is the layer is visible, false otherwise.
     *
     * @memberof BingClusterLayer
     */
    GetVisible() {
        return this._layer.getOptions().visible;
    }
    /**
     * Returns the abstract marker used to wrap the Bing Pushpin.
     *
     * @returns - The abstract marker object representing the pushpin.
     *
     * @memberof BingClusterLayer
     */
    GetSpiderMarkerFromBingMarker(pin) {
        const m = this._spiderMarkerLookup.get(pin);
        return m;
    }
    /**
     * Removes an entity from the cluster layer.
     *
     * @param entity Marker - Entity to be removed from the layer.
     *
     * @memberof BingClusterLayer
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
                const p = this._layer.getPushpins();
                const i = p.indexOf(entity.NativePrimitve);
                if (i > -1) {
                    p.splice(i, 1);
                    this._layer.setPushpins(p);
                }
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
     * @memberof BingClusterLayer
     */
    SetEntities(entities) {
        const p = new Array();
        this._markers.splice(0);
        this._markerLookup.clear();
        entities.forEach((e) => {
            if (e.NativePrimitve && e.Location) {
                this._markers.push(e);
                this._markerLookup.set(e.NativePrimitve, e);
                p.push(e.NativePrimitve);
            }
        });
        this._layer.setPushpins(p);
    }
    /**
     * Sets the options for the cluster layer.
     *
     * @param options IClusterOptions containing the options enumeration controlling the layer behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof BingClusterLayer
     */
    SetOptions(options) {
        const o = BingConversions.TranslateClusterOptions(options);
        this._layer.setOptions(o);
        if (options.spiderClusterOptions) {
            this.SetSpiderOptions(options.spiderClusterOptions);
        }
    }
    /**
     * Toggles the cluster layer visibility.
     *
     * @param visible Boolean true to make the layer visible, false to hide the layer.
     *
     * @memberof BingClusterLayer
     */
    SetVisible(visible) {
        const o = this._layer.getOptions();
        o.visible = visible;
        this._layer.setOptions(o);
    }
    /**
     * Start to actually cluster the entities in a cluster layer. This method should be called after the initial set of entities
     * have been added to the cluster. This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @memberof BingClusterLayer
     */
    StartClustering() {
        if (this._isClustering) {
            return;
        }
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
        this._layer.setPushpins(p);
        this._markers = this._markers.concat(this._pendingMarkers.splice(0));
        this._isClustering = true;
    }
    /**
     * Stop to actually cluster the entities in a cluster layer.
     * This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @memberof BingClusterLayer
     */
    StopClustering() {
        if (!this._isClustering) {
            return;
        }
        this._isClustering = false;
    }
    ///
    /// Private methods
    ///
    /**
     * Creates a copy of a pushpins basic options.
     *
     * @param pin Pushpin to copy options from.
     * @returns - A copy of a pushpins basic options.
     *
     * @memberof BingClusterLayer
     */
    GetBasicPushpinOptions(pin) {
        return {
            anchor: pin.getAnchor(),
            color: pin.getColor(),
            cursor: pin.getCursor(),
            icon: pin.getIcon(),
            roundClickableArea: pin.getRoundClickableArea(),
            subTitle: pin.getSubTitle(),
            text: pin.getText(),
            textOffset: pin.getTextOffset(),
            title: pin.getTitle()
        };
    }
    /**
     * Hides the spider cluster and resotres the original pin.
     *
     * @memberof BingClusterLayer
     */
    HideSpiderCluster() {
        this._mapclicks = 0;
        if (this._currentCluster) {
            this._spiderLayer.clear();
            this._spiderMarkers.splice(0);
            this._spiderMarkerLookup.clear();
            this._currentCluster = null;
            this._mapclicks = -1;
            if (this._spiderOptions.markerUnSelected) {
                this._spiderOptions.markerUnSelected();
            }
        }
    }
    /**
     * Click event handler for when a shape in the cluster layer is clicked.
     *
     * @param e The mouse event argurment from the click event.
     *
     * @memberof BingClusterLayer
     */
    OnLayerClick(e) {
        if (e.primitive instanceof Microsoft.Maps.ClusterPushpin) {
            const cp = e.primitive;
            const showNewCluster = cp !== this._currentCluster;
            this.HideSpiderCluster();
            if (showNewCluster) {
                this.ShowSpiderCluster(e.primitive);
            }
        }
        else {
            const pin = e.primitive;
            if (pin.metadata && pin.metadata.isClusterMarker) {
                const m = this.GetSpiderMarkerFromBingMarker(pin);
                const p = m.ParentMarker;
                const ppin = p.NativePrimitve;
                if (this._spiderOptions.markerSelected) {
                    this._spiderOptions.markerSelected(p, new BingMarker(this._currentCluster, null, null));
                }
                if (Microsoft.Maps.Events.hasHandler(ppin, 'click')) {
                    Microsoft.Maps.Events.invoke(ppin, 'click', e);
                }
                this._mapclicks = 0;
            }
            else {
                if (this._spiderOptions.markerSelected) {
                    this._spiderOptions.markerSelected(this.GetMarkerFromBingMarker(pin), null);
                }
                if (Microsoft.Maps.Events.hasHandler(pin, 'click')) {
                    Microsoft.Maps.Events.invoke(pin, 'click', e);
                }
            }
        }
    }
    /**
     * Delegate handling the click event on the map (outside a spider cluster). Depending on the
     * spider options, closes the cluster or increments the click counter.
     *
     * @param e - Mouse event
     *
     * @memberof BingClusterLayer
     */
    OnMapClick(e) {
        if (this._mapclicks === -1) {
            return;
        }
        else if (++this._mapclicks >= this._spiderOptions.collapseClusterOnNthClick) {
            this.HideSpiderCluster();
        }
        else {
            // do nothing as this._mapclicks has already been incremented above
        }
    }
    /**
     * Delegate handling the map view changed end event. Hides the spider cluster if the zoom level has changed.
     *
     * @param e - Mouse event.
     *
     * @memberof BingClusterLayer
     */
    OnMapViewChangeEnd(e) {
        const z = e.target.getZoom();
        const hasZoomChanged = (z !== this._currentZoom);
        this._currentZoom = z;
        if (hasZoomChanged) {
            this.HideSpiderCluster();
        }
    }
    /**
     * Delegate handling the map view change start event. Depending on the spider options, hides the
     * the exploded spider or does nothing.
     *
     * @param e - Mouse event.
     *
     * @memberof BingClusterLayer
     */
    OnMapViewChangeStart(e) {
        if (this._spiderOptions.collapseClusterOnMapChange) {
            this.HideSpiderCluster();
        }
    }
    /**
     * Delegate invoked on mouse out on an exploded spider marker. Resets the hover style on the stick.
     *
     * @param e - Mouse event.
     */
    OnSpiderMouseOut(e) {
        const pin = e.primitive;
        if (pin instanceof Microsoft.Maps.Pushpin && pin.metadata && pin.metadata.isClusterMarker) {
            const m = this.GetSpiderMarkerFromBingMarker(pin);
            m.Stick.setOptions(this._spiderOptions.stickStyle);
        }
    }
    /**
     * Invoked on mouse over on an exploded spider marker. Sets the hover style on the stick. Also invokes the click event
     * on the underlying original marker dependent on the spider options.
     *
     * @param e - Mouse event.
     */
    OnSpiderMouseOver(e) {
        const pin = e.primitive;
        if (pin instanceof Microsoft.Maps.Pushpin && pin.metadata && pin.metadata.isClusterMarker) {
            const m = this.GetSpiderMarkerFromBingMarker(pin);
            m.Stick.setOptions(this._spiderOptions.stickHoverStyle);
            if (this._spiderOptions.invokeClickOnHover) {
                const p = m.ParentMarker;
                const ppin = p.NativePrimitve;
                if (Microsoft.Maps.Events.hasHandler(ppin, 'click')) {
                    Microsoft.Maps.Events.invoke(ppin, 'click', e);
                }
            }
        }
    }
    /**
     * Sets the options for spider behavior.
     *
     * @param options ISpiderClusterOptions containing the options enumeration controlling the spider cluster behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof BingClusterLayer
     */
    SetSpiderOptions(options) {
        if (options) {
            if (typeof options.circleSpiralSwitchover === 'number') {
                this._spiderOptions.circleSpiralSwitchover = options.circleSpiralSwitchover;
            }
            if (typeof options.collapseClusterOnMapChange === 'boolean') {
                this._spiderOptions.collapseClusterOnMapChange = options.collapseClusterOnMapChange;
            }
            if (typeof options.collapseClusterOnNthClick === 'number') {
                this._spiderOptions.collapseClusterOnNthClick = options.collapseClusterOnNthClick;
            }
            if (typeof options.invokeClickOnHover === 'boolean') {
                this._spiderOptions.invokeClickOnHover = options.invokeClickOnHover;
            }
            if (typeof options.minSpiralAngleSeperation === 'number') {
                this._spiderOptions.minSpiralAngleSeperation = options.minSpiralAngleSeperation;
            }
            if (typeof options.spiralDistanceFactor === 'number') {
                this._spiderOptions.spiralDistanceFactor = options.spiralDistanceFactor;
            }
            if (typeof options.minCircleLength === 'number') {
                this._spiderOptions.minCircleLength = options.minCircleLength;
            }
            if (options.stickHoverStyle) {
                this._spiderOptions.stickHoverStyle = options.stickHoverStyle;
            }
            if (options.stickStyle) {
                this._spiderOptions.stickStyle = options.stickStyle;
            }
            if (options.markerSelected) {
                this._spiderOptions.markerSelected = options.markerSelected;
            }
            if (options.markerUnSelected) {
                this._spiderOptions.markerUnSelected = options.markerUnSelected;
            }
            if (typeof options.visible === 'boolean') {
                this._spiderOptions.visible = options.visible;
            }
            this.SetOptions(options);
        }
    }
    /**
     * Expands a cluster into it's open spider layout.
     *
     * @param cluster The cluster to show in it's open spider layout..
     *
     * @memberof BingClusterLayer
     */
    ShowSpiderCluster(cluster) {
        this.HideSpiderCluster();
        this._currentCluster = cluster;
        if (cluster && cluster.containedPushpins) {
            // Create spider data.
            const m = this._maps.MapInstance;
            const pins = cluster.containedPushpins;
            const center = cluster.getLocation();
            const centerPoint = m.tryLocationToPixel(center, Microsoft.Maps.PixelReference.control);
            let stick;
            let angle = 0;
            const makeSpiral = pins.length > this._spiderOptions.circleSpiralSwitchover;
            let legPixelLength;
            let stepAngle;
            let stepLength;
            if (makeSpiral) {
                legPixelLength = this._spiderOptions.minCircleLength / Math.PI;
                stepLength = 2 * Math.PI * this._spiderOptions.spiralDistanceFactor;
            }
            else {
                stepAngle = 2 * Math.PI / pins.length;
                legPixelLength = (this._spiderOptions.spiralDistanceFactor / stepAngle / Math.PI / 2) * pins.length;
                if (legPixelLength < this._spiderOptions.minCircleLength) {
                    legPixelLength = this._spiderOptions.minCircleLength;
                }
            }
            for (let i = 0, len = pins.length; i < len; i++) {
                // Calculate spider pin location.
                if (!makeSpiral) {
                    angle = stepAngle * i;
                }
                else {
                    angle += this._spiderOptions.minSpiralAngleSeperation / legPixelLength + i * 0.0005;
                    legPixelLength += stepLength / angle;
                }
                const point = new Microsoft.Maps.Point(centerPoint.x + legPixelLength * Math.cos(angle), centerPoint.y + legPixelLength * Math.sin(angle));
                const loc = m.tryPixelToLocation(point, Microsoft.Maps.PixelReference.control);
                // Create stick to pin.
                stick = new Microsoft.Maps.Polyline([center, loc], this._spiderOptions.stickStyle);
                this._spiderLayer.add(stick);
                // Create pin in spiral that contains same metadata as parent pin.
                const pin = new Microsoft.Maps.Pushpin(loc);
                pin.metadata = pins[i].metadata || {};
                pin.metadata.isClusterMarker = true;
                pin.setOptions(this.GetBasicPushpinOptions(pins[i]));
                this._spiderLayer.add(pin);
                const spiderMarker = new BingSpiderClusterMarker(pin, null, this._spiderLayer);
                spiderMarker.Stick = stick;
                spiderMarker.ParentMarker = this.GetMarkerFromBingMarker(pins[i]);
                this._spiderMarkers.push(spiderMarker);
                this._spiderMarkerLookup.set(pin, spiderMarker);
            }
            this._mapclicks = 0;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1jbHVzdGVyLWxheWVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL21vZGVscy9iaW5nL2JpbmctY2x1c3Rlci1sYXllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFJdkUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUVuQyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUN2RSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTNDOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sZ0JBQWdCO0lBa0R6QixHQUFHO0lBQ0gsZUFBZTtJQUNmLEdBQUc7SUFFSDs7Ozs7OztPQU9HO0lBQ0gsWUFBb0IsTUFBbUMsRUFBVSxLQUFpQjtRQUE5RCxXQUFNLEdBQU4sTUFBTSxDQUE2QjtRQUFVLFVBQUssR0FBTCxLQUFLLENBQVk7UUE1RGxGLEdBQUc7UUFDSCxzQkFBc0I7UUFDdEIsR0FBRztRQUNLLGtCQUFhLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLGFBQVEsR0FBa0IsSUFBSSxLQUFLLEVBQVUsQ0FBQztRQUM5QyxrQkFBYSxHQUF3QyxJQUFJLEdBQUcsRUFBa0MsQ0FBQztRQUMvRixvQkFBZSxHQUFrQixJQUFJLEtBQUssRUFBVSxDQUFDO1FBQ3JELG1CQUFjLEdBQW1DLElBQUksS0FBSyxFQUEyQixDQUFDO1FBQ3RGLHdCQUFtQixHQUNWLElBQUksR0FBRyxFQUFtRCxDQUFDO1FBQ3BFLHNCQUFpQixHQUFHLEtBQUssQ0FBQztRQUMxQixlQUFVLEdBQUcsQ0FBQyxDQUFDO1FBRWYsWUFBTyxHQUFxQyxJQUFJLEtBQUssRUFBNkIsQ0FBQztRQUNuRixpQkFBWSxHQUFHLENBQUMsQ0FBQztRQUNqQixtQkFBYyxHQUEwQjtZQUM1QyxzQkFBc0IsRUFBRSxDQUFDO1lBQ3pCLDBCQUEwQixF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QUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQzthQUVuRDtZQUNELElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1NBQ3ZCO0lBQ0wsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSUNsdXN0ZXJPcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pY2x1c3Rlci1vcHRpb25zJztcbmltcG9ydCB7IElTcGlkZXJDbHVzdGVyT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaXNwaWRlci1jbHVzdGVyLW9wdGlvbnMnO1xuaW1wb3J0IHsgQmluZ0NvbnZlcnNpb25zIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYmluZy9iaW5nLWNvbnZlcnNpb25zJztcbmltcG9ydCB7IEJpbmdNYXBTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYmluZy9iaW5nLW1hcC5zZXJ2aWNlJztcbmltcG9ydCB7IE1hcFNlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBMYXllciB9IGZyb20gJy4uL2xheWVyJztcbmltcG9ydCB7IE1hcmtlciB9IGZyb20gJy4uL21hcmtlcic7XG5pbXBvcnQgeyBJbmZvV2luZG93IH0gZnJvbSAnLi4vaW5mby13aW5kb3cnO1xuaW1wb3J0IHsgQmluZ1NwaWRlckNsdXN0ZXJNYXJrZXIgfSBmcm9tICcuL2Jpbmctc3BpZGVyLWNsdXN0ZXItbWFya2VyJztcbmltcG9ydCB7IEJpbmdNYXJrZXIgfSBmcm9tICcuL2JpbmctbWFya2VyJztcblxuLyoqXG4gKiBDb25jcmV0ZSBpbXBsZW1lbnRhdGlvbiBvZiBhIGNsdXN0ZXJpbmcgbGF5ZXIgZm9yIHRoZSBCaW5nIE1hcCBQcm92aWRlci5cbiAqXG4gKiBAZXhwb3J0XG4gKi9cbmV4cG9ydCBjbGFzcyBCaW5nQ2x1c3RlckxheWVyIGltcGxlbWVudHMgTGF5ZXIge1xuXG4gICAgLy8vXG4gICAgLy8vIEZpZWxkIGRlY2xhcmF0aW9uc1xuICAgIC8vL1xuICAgIHByaXZhdGUgX2lzQ2x1c3RlcmluZyA9IHRydWU7XG4gICAgcHJpdmF0ZSBfbWFya2VyczogQXJyYXk8TWFya2VyPiA9IG5ldyBBcnJheTxNYXJrZXI+KCk7XG4gICAgcHJpdmF0ZSBfbWFya2VyTG9va3VwOiBNYXA8TWljcm9zb2Z0Lk1hcHMuUHVzaHBpbiwgTWFya2VyPiA9IG5ldyBNYXA8TWljcm9zb2Z0Lk1hcHMuUHVzaHBpbiwgTWFya2VyPigpO1xuICAgIHByaXZhdGUgX3BlbmRpbmdNYXJrZXJzOiBBcnJheTxNYXJrZXI+ID0gbmV3IEFycmF5PE1hcmtlcj4oKTtcbiAgICBwcml2YXRlIF9zcGlkZXJNYXJrZXJzOiBBcnJheTxCaW5nU3BpZGVyQ2x1c3Rlck1hcmtlcj4gPSBuZXcgQXJyYXk8QmluZ1NwaWRlckNsdXN0ZXJNYXJrZXI+KCk7XG4gICAgcHJpdmF0ZSBfc3BpZGVyTWFya2VyTG9va3VwOiBNYXA8TWljcm9zb2Z0Lk1hcHMuUHVzaHBpbiwgQmluZ1NwaWRlckNsdXN0ZXJNYXJrZXI+ID1cbiAgICAgICAgICAgICAgICAgICAgIG5ldyBNYXA8TWljcm9zb2Z0Lk1hcHMuUHVzaHBpbiwgQmluZ1NwaWRlckNsdXN0ZXJNYXJrZXI+KCk7XG4gICAgcHJpdmF0ZSBfdXNlU3BpZGVyQ2x1c3RlciA9IGZhbHNlO1xuICAgIHByaXZhdGUgX21hcGNsaWNrcyA9IDA7XG4gICAgcHJpdmF0ZSBfc3BpZGVyTGF5ZXI6IE1pY3Jvc29mdC5NYXBzLkxheWVyO1xuICAgIHByaXZhdGUgX2V2ZW50czogQXJyYXk8TWljcm9zb2Z0Lk1hcHMuSUhhbmRsZXJJZD4gPSBuZXcgQXJyYXk8TWljcm9zb2Z0Lk1hcHMuSUhhbmRsZXJJZD4oKTtcbiAgICBwcml2YXRlIF9jdXJyZW50Wm9vbSA9IDA7XG4gICAgcHJpdmF0ZSBfc3BpZGVyT3B0aW9uczogSVNwaWRlckNsdXN0ZXJPcHRpb25zID0ge1xuICAgICAgICBjaXJjbGVTcGlyYWxTd2l0Y2hvdmVyOiA5LFxuICAgICAgICBjb2xsYXBzZUNsdXN0ZXJPbk1hcENoYW5nZTogZmFsc2UsXG4gICAgICAgIGNvbGxhcHNlQ2x1c3Rlck9uTnRoQ2xpY2s6IDEsXG4gICAgICAgIGludm9rZUNsaWNrT25Ib3ZlcjogdHJ1ZSxcbiAgICAgICAgbWluQ2lyY2xlTGVuZ3RoOiA2MCxcbiAgICAgICAgbWluU3BpcmFsQW5nbGVTZXBlcmF0aW9uOiAyNSxcbiAgICAgICAgc3BpcmFsRGlzdGFuY2VGYWN0b3I6IDUsXG4gICAgICAgIHN0aWNrU3R5bGU6IHtcbiAgICAgICAgICAgIHN0cm9rZUNvbG9yOiAnYmxhY2snLFxuICAgICAgICAgICAgc3Ryb2tlVGhpY2tuZXNzOiAyXG4gICAgICAgIH0sXG4gICAgICAgIHN0aWNrSG92ZXJTdHlsZTogeyBzdHJva2VDb2xvcjogJ3JlZCcgfSxcbiAgICAgICAgbWFya2VyU2VsZWN0ZWQ6IG51bGwsXG4gICAgICAgIG1hcmtlclVuU2VsZWN0ZWQ6IG51bGxcbiAgICB9O1xuICAgIHByaXZhdGUgX2N1cnJlbnRDbHVzdGVyOiBNaWNyb3NvZnQuTWFwcy5DbHVzdGVyUHVzaHBpbiA9IG51bGw7XG5cbiAgICAvLy9cbiAgICAvLy8gUHJvcGVydHkgZGVmaW5pdGlvbnNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbmF0aXZlIHByaW1pdGl2ZSB1bmRlcm5lYXRoIHRoZSBhYnN0cmFjdGlvbiBsYXllci5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIE1pY3Jvc29mdC5NYXBzLkNsdXN0ZXJMYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlckxheWVyXG4gICAgICovXG4gICAgcHVibGljIGdldCBOYXRpdmVQcmltaXR2ZSgpOiBhbnkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbGF5ZXI7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBCaW5nQ2x1c3RlckxheWVyIGNsYXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIF9sYXllciBNaWNyb3NvZnQuTWFwcy5DbHVzdGVyTGF5ZXIuIE5hdGl2ZSBCaW5nIENsdXN0ZXIgTGF5ZXIgc3VwcG9ydGluZyB0aGUgY2x1c3RlciBsYXllci5cbiAgICAgKiBAcGFyYW0gX21hcHMgTWFwU2VydmljZS4gTWFwU2VydmljZSBpbXBsZW1lbnRhdGlvbiB0byBsZXZlcmFnZSBmb3IgdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDbHVzdGVyTGF5ZXJcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9sYXllcjogTWljcm9zb2Z0Lk1hcHMuQ2x1c3RlckxheWVyLCBwcml2YXRlIF9tYXBzOiBNYXBTZXJ2aWNlKSB7IH1cblxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzLCBMYXllciBpbnRlcmZhY2UgaW1wbGVtZW50YXRpb25cbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgZm9yIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBldmVudFR5cGUgc3RyaW5nLiBUeXBlIG9mIGV2ZW50IHRvIGFkZCAoY2xpY2ssIG1vdXNlb3ZlciwgZXRjKS4gWW91IGNhbiB1c2UgYW55IGV2ZW50IHRoYXQgdGhlIHVuZGVybHlpbmcgbmF0aXZlXG4gICAgICogbGF5ZXIgc3VwcG9ydHMuXG4gICAgICogQHBhcmFtIGZuIGZ1bmN0aW9uLiBIYW5kbGVyIHRvIGNhbGwgd2hlbiB0aGUgZXZlbnQgb2NjdXJzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDbHVzdGVyTGF5ZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkTGlzdGVuZXIoZXZlbnRUeXBlOiBzdHJpbmcsIGZuOiBGdW5jdGlvbik6IHZvaWQge1xuICAgICAgICBNaWNyb3NvZnQuTWFwcy5FdmVudHMuYWRkSGFuZGxlcih0aGlzLl9sYXllciwgZXZlbnRUeXBlLCAoZSkgPT4ge1xuICAgICAgICAgICAgZm4oZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYW4gZW50aXR5IHRvIHRoZSBsYXllci4gVXNlIHRoaXMgbWV0aG9kIHdpdGggY2F1dGlvbiBhcyBpdCB3aWxsXG4gICAgICogdHJpZ2dlciBhIHJlY2FsdWF0aW9uIG9mIHRoZSBjbHVzdGVycyAoYW5kIGFzc29jaWF0ZWQgbWFya2VycyBpZiBhcHByb3ByaXRlKSBmb3JcbiAgICAgKiBlYWNoIGludm9jYXRpb24uIElmIHlvdSB1c2UgdGhpcyBtZXRob2QgdG8gYWRkIG1hbnkgbWFya2VycyB0byB0aGUgY2x1c3RlciwgdXNlXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZW50aXR5IE1hcmtlci4gRW50aXR5IHRvIGFkZCB0byB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJMYXllclxuICAgICAqL1xuICAgIHB1YmxpYyBBZGRFbnRpdHkoZW50aXR5OiBNYXJrZXIpOiB2b2lkIHtcbiAgICAgICAgbGV0IGlzTWFya2VyOiBib29sZWFuID0gZW50aXR5IGluc3RhbmNlb2YgTWFya2VyO1xuICAgICAgICBpc01hcmtlciA9IGVudGl0eSBpbnN0YW5jZW9mIEJpbmdNYXJrZXIgfHwgaXNNYXJrZXI7XG4gICAgICAgIGlmIChpc01hcmtlcikge1xuICAgICAgICAgICAgaWYgKGVudGl0eS5Jc0ZpcnN0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5TdG9wQ2x1c3RlcmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChlbnRpdHkuTmF0aXZlUHJpbWl0dmUgJiYgZW50aXR5LkxvY2F0aW9uKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNDbHVzdGVyaW5nKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcDogQXJyYXk8TWljcm9zb2Z0Lk1hcHMuUHVzaHBpbj4gPSB0aGlzLl9sYXllci5nZXRQdXNocGlucygpO1xuICAgICAgICAgICAgICAgIHAucHVzaChlbnRpdHkuTmF0aXZlUHJpbWl0dmUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2xheWVyLnNldFB1c2hwaW5zKHApO1xuICAgICAgICAgICAgICAgIHRoaXMuX21hcmtlcnMucHVzaChlbnRpdHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ01hcmtlcnMucHVzaChlbnRpdHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fbWFya2VyTG9va3VwLnNldChlbnRpdHkuTmF0aXZlUHJpbWl0dmUsIGVudGl0eSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzTWFya2VyKSB7XG4gICAgICAgICAgICBpZiAoZW50aXR5LklzTGFzdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuU3RhcnRDbHVzdGVyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbnVtYmVyIG9mIG1hcmtlcnMgdG8gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVudGl0aWVzIEFycmF5PE1hcmtlcj4uIEVudGl0aWVzIHRvIGFkZCB0byB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJMYXllclxuICAgICAqL1xuICAgIHB1YmxpYyBBZGRFbnRpdGllcyhlbnRpdGllczogQXJyYXk8TWFya2VyPik6IHZvaWQge1xuICAgICAgICBpZiAoZW50aXRpZXMgIT0gbnVsbCAmJiBBcnJheS5pc0FycmF5KGVudGl0aWVzKSAmJiBlbnRpdGllcy5sZW5ndGggIT09IDAgKSB7XG4gICAgICAgICAgICBjb25zdCBlOiBBcnJheTxNaWNyb3NvZnQuTWFwcy5QdXNocGluPiA9IGVudGl0aWVzLm1hcChwID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXJrZXJMb29rdXAuc2V0KHAuTmF0aXZlUHJpbWl0dmUsIHApO1xuICAgICAgICAgICAgICAgIHJldHVybiBwLk5hdGl2ZVByaW1pdHZlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAodGhpcy5faXNDbHVzdGVyaW5nKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcDogQXJyYXk8TWljcm9zb2Z0Lk1hcHMuUHVzaHBpbj4gPSB0aGlzLl9sYXllci5nZXRQdXNocGlucygpO1xuICAgICAgICAgICAgICAgIHAucHVzaCguLi5lKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYXllci5zZXRQdXNocGlucyhwKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXJrZXJzLnB1c2goLi4uZW50aXRpZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ01hcmtlcnMucHVzaCguLi5lbnRpdGllcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyBzcGlkZXIgYmVoYXZpb3IgZm9yIHRoZSBjbHVzZXJpbmcgbGF5ZXIgKHdoZW4gYSBjbHVzdGVyIG1ha2VyIGlzIGNsaWNrZWQsIGl0IGV4cGxvZGVzIGludG8gYSBzcGlkZXIgb2YgdGhlXG4gICAgICogaW5kaXZpZHVhbCB1bmRlcmx5aW5nIHBpbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBJU3BpZGVyQ2x1c3Rlck9wdGlvbnMuIE9wdGlvbmFsLiBPcHRpb25zIGdvdmVybmluZyB0aGUgYmVoYXZpb3Igb2YgdGhlIHNwaWRlci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlckxheWVyXG4gICAgICovXG4gICAgcHVibGljIEluaXRpYWxpemVTcGlkZXJDbHVzdGVyU3VwcG9ydChvcHRpb25zPzogSVNwaWRlckNsdXN0ZXJPcHRpb25zKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl91c2VTcGlkZXJDbHVzdGVyKSB7IHJldHVybjsgfVxuICAgICAgICBjb25zdCBtOiBNaWNyb3NvZnQuTWFwcy5NYXAgPSAoPEJpbmdNYXBTZXJ2aWNlPnRoaXMuX21hcHMpLk1hcEluc3RhbmNlO1xuICAgICAgICB0aGlzLl91c2VTcGlkZXJDbHVzdGVyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fc3BpZGVyTGF5ZXIgPSBuZXcgTWljcm9zb2Z0Lk1hcHMuTGF5ZXIoKTtcbiAgICAgICAgdGhpcy5fY3VycmVudFpvb20gPSBtLmdldFpvb20oKTtcbiAgICAgICAgdGhpcy5TZXRTcGlkZXJPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICBtLmxheWVycy5pbnNlcnQodGhpcy5fc3BpZGVyTGF5ZXIpO1xuXG4gICAgICAgIC8vL1xuICAgICAgICAvLy8gQWRkIHNwaWRlciByZWxhdGVkIGV2ZW50cy4uLi5cbiAgICAgICAgLy8vXG4gICAgICAgIHRoaXMuX2V2ZW50cy5wdXNoKE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKG0sICdjbGljaycsIGUgPT4gdGhpcy5Pbk1hcENsaWNrKGUpKSk7XG4gICAgICAgIHRoaXMuX2V2ZW50cy5wdXNoKE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKG0sICd2aWV3Y2hhbmdlc3RhcnQnLCBlID0+IHRoaXMuT25NYXBWaWV3Q2hhbmdlU3RhcnQoZSkpKTtcbiAgICAgICAgdGhpcy5fZXZlbnRzLnB1c2goTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmFkZEhhbmRsZXIobSwgJ3ZpZXdjaGFuZ2VlbmQnLCBlID0+IHRoaXMuT25NYXBWaWV3Q2hhbmdlRW5kKGUpKSk7XG4gICAgICAgIHRoaXMuX2V2ZW50cy5wdXNoKE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKHRoaXMuX2xheWVyLCAnY2xpY2snLCBlID0+IHRoaXMuT25MYXllckNsaWNrKGUpKSk7XG4gICAgICAgIHRoaXMuX2V2ZW50cy5wdXNoKE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKHRoaXMuX3NwaWRlckxheWVyLCAnY2xpY2snLCBlID0+IHRoaXMuT25MYXllckNsaWNrKGUpKSk7XG4gICAgICAgIHRoaXMuX2V2ZW50cy5wdXNoKE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKHRoaXMuX3NwaWRlckxheWVyLCAnbW91c2VvdmVyJywgZSA9PiB0aGlzLk9uU3BpZGVyTW91c2VPdmVyKGUpKSk7XG4gICAgICAgIHRoaXMuX2V2ZW50cy5wdXNoKE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKHRoaXMuX3NwaWRlckxheWVyLCAnbW91c2VvdXQnLCBlID0+IHRoaXMuT25TcGlkZXJNb3VzZU91dChlKSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZXMgdGhlIGNsdXN0ZXJpbmcgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJMYXllclxuICAgICAqL1xuICAgIHB1YmxpYyBEZWxldGUoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl91c2VTcGlkZXJDbHVzdGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9zcGlkZXJMYXllci5jbGVhcigpO1xuICAgICAgICAgICAgKDxCaW5nTWFwU2VydmljZT50aGlzLl9tYXBzKS5NYXBQcm9taXNlLnRoZW4obSA9PiB7XG4gICAgICAgICAgICAgICAgbS5sYXllcnMucmVtb3ZlKHRoaXMuX3NwaWRlckxheWVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zcGlkZXJMYXllciA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5mb3JFYWNoKGUgPT4gTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLnJlbW92ZUhhbmRsZXIoZSkpO1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzLnNwbGljZSgwKTtcbiAgICAgICAgICAgIHRoaXMuX3VzZVNwaWRlckNsdXN0ZXIgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tYXJrZXJzLnNwbGljZSgwKTtcbiAgICAgICAgdGhpcy5fc3BpZGVyTWFya2Vycy5zcGxpY2UoMCk7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdNYXJrZXJzLnNwbGljZSgwKTtcbiAgICAgICAgdGhpcy5fbWFya2VyTG9va3VwLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX21hcHMuRGVsZXRlTGF5ZXIodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgYWJzdHJhY3QgbWFya2VyIHVzZWQgdG8gd3JhcCB0aGUgQmluZyBQdXNocGluLlxuICAgICAqXG4gICAgICogQHJldHVybnMgTWFya2VyLiBUaGUgYWJzdHJhY3QgbWFya2VyIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIHB1c2hwaW4uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJMYXllclxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRNYXJrZXJGcm9tQmluZ01hcmtlcihwaW46IE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4pOiBNYXJrZXIge1xuICAgICAgICBjb25zdCBtOiBNYXJrZXIgPSB0aGlzLl9tYXJrZXJMb29rdXAuZ2V0KHBpbik7XG4gICAgICAgIHJldHVybiBtO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG9wdGlvbnMgZ292ZXJuaW5nIHRoZSBiZWhhdmlvciBvZiB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBJQ2x1c3Rlck9wdGlvbnMuIFRoZSBsYXllciBvcHRpb25zLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDbHVzdGVyTGF5ZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0T3B0aW9ucygpOiBJQ2x1c3Rlck9wdGlvbnMge1xuICAgICAgICBjb25zdCBvOiBNaWNyb3NvZnQuTWFwcy5JQ2x1c3RlckxheWVyT3B0aW9ucyA9IHRoaXMuX2xheWVyLmdldE9wdGlvbnMoKTtcbiAgICAgICAgY29uc3Qgb3B0aW9uczogSUNsdXN0ZXJPcHRpb25zID0ge1xuICAgICAgICAgICAgaWQ6IDAsXG4gICAgICAgICAgICBncmlkU2l6ZTogby5ncmlkU2l6ZSxcbiAgICAgICAgICAgIGxheWVyT2Zmc2V0OiBvLmxheWVyT2Zmc2V0LFxuICAgICAgICAgICAgY2x1c3RlcmluZ0VuYWJsZWQ6IG8uY2x1c3RlcmluZ0VuYWJsZWQsXG4gICAgICAgICAgICBjYWxsYmFjazogby5jYWxsYmFjayxcbiAgICAgICAgICAgIGNsdXN0ZXJlZFBpbkNhbGxiYWNrOiBvLmNsdXN0ZXJlZFBpbkNhbGxiYWNrLFxuICAgICAgICAgICAgdmlzaWJsZTogby52aXNpYmxlLFxuICAgICAgICAgICAgekluZGV4OiBvLnpJbmRleFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB2aXNpYmlsaXR5IHN0YXRlIG9mIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIEJvb2xlYW4uIFRydWUgaXMgdGhlIGxheWVyIGlzIHZpc2libGUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlckxheWVyXG4gICAgICovXG4gICAgcHVibGljIEdldFZpc2libGUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sYXllci5nZXRPcHRpb25zKCkudmlzaWJsZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBhYnN0cmFjdCBtYXJrZXIgdXNlZCB0byB3cmFwIHRoZSBCaW5nIFB1c2hwaW4uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyAtIFRoZSBhYnN0cmFjdCBtYXJrZXIgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgcHVzaHBpbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlckxheWVyXG4gICAgICovXG4gICAgcHVibGljIEdldFNwaWRlck1hcmtlckZyb21CaW5nTWFya2VyKHBpbjogTWljcm9zb2Z0Lk1hcHMuUHVzaHBpbik6IEJpbmdTcGlkZXJDbHVzdGVyTWFya2VyIHtcbiAgICAgICAgY29uc3QgbTogQmluZ1NwaWRlckNsdXN0ZXJNYXJrZXIgPSB0aGlzLl9zcGlkZXJNYXJrZXJMb29rdXAuZ2V0KHBpbik7XG4gICAgICAgIHJldHVybiBtO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYW4gZW50aXR5IGZyb20gdGhlIGNsdXN0ZXIgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZW50aXR5IE1hcmtlciAtIEVudGl0eSB0byBiZSByZW1vdmVkIGZyb20gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDbHVzdGVyTGF5ZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgUmVtb3ZlRW50aXR5KGVudGl0eTogTWFya2VyKTogdm9pZCB7XG4gICAgICAgIGlmIChlbnRpdHkuTmF0aXZlUHJpbWl0dmUgJiYgZW50aXR5LkxvY2F0aW9uKSB7XG4gICAgICAgICAgICBjb25zdCBqOiBudW1iZXIgPSB0aGlzLl9tYXJrZXJzLmluZGV4T2YoZW50aXR5KTtcbiAgICAgICAgICAgIGNvbnN0IGs6IG51bWJlciA9IHRoaXMuX3BlbmRpbmdNYXJrZXJzLmluZGV4T2YoZW50aXR5KTtcbiAgICAgICAgICAgIGlmIChqID4gLTEpIHsgdGhpcy5fbWFya2Vycy5zcGxpY2UoaiwgMSk7IH1cbiAgICAgICAgICAgIGlmIChrID4gLTEpIHsgdGhpcy5fcGVuZGluZ01hcmtlcnMuc3BsaWNlKGssIDEpOyB9XG4gICAgICAgICAgICBpZiAodGhpcy5faXNDbHVzdGVyaW5nKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcDogQXJyYXk8TWljcm9zb2Z0Lk1hcHMuUHVzaHBpbj4gPSB0aGlzLl9sYXllci5nZXRQdXNocGlucygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGk6IG51bWJlciA9IHAuaW5kZXhPZihlbnRpdHkuTmF0aXZlUHJpbWl0dmUpO1xuICAgICAgICAgICAgICAgIGlmIChpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xheWVyLnNldFB1c2hwaW5zKHApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX21hcmtlckxvb2t1cC5kZWxldGUoZW50aXR5Lk5hdGl2ZVByaW1pdHZlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGVudGl0aWVzIGZvciB0aGUgY2x1c3RlciBsYXllci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbnRpdGllcyBBcnJheTxNYXJrZXI+IGNvbnRhaW5pbmdcbiAgICAgKiB0aGUgZW50aXRpZXMgdG8gYWRkIHRvIHRoZSBjbHVzdGVyLiBUaGlzIHJlcGxhY2VzIGFueSBleGlzdGluZyBlbnRpdGllcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlckxheWVyXG4gICAgICovXG4gICAgcHVibGljIFNldEVudGl0aWVzKGVudGl0aWVzOiBBcnJheTxNYXJrZXI+KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHA6IEFycmF5PE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4+ID0gbmV3IEFycmF5PE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4+KCk7XG4gICAgICAgIHRoaXMuX21hcmtlcnMuc3BsaWNlKDApO1xuICAgICAgICB0aGlzLl9tYXJrZXJMb29rdXAuY2xlYXIoKTtcbiAgICAgICAgZW50aXRpZXMuZm9yRWFjaCgoZTogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoZS5OYXRpdmVQcmltaXR2ZSAmJiBlLkxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFya2Vycy5wdXNoKGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX21hcmtlckxvb2t1cC5zZXQoZS5OYXRpdmVQcmltaXR2ZSwgZSk7XG4gICAgICAgICAgICAgICAgcC5wdXNoKDxNaWNyb3NvZnQuTWFwcy5QdXNocGluPmUuTmF0aXZlUHJpbWl0dmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fbGF5ZXIuc2V0UHVzaHBpbnMocCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgb3B0aW9ucyBmb3IgdGhlIGNsdXN0ZXIgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBJQ2x1c3Rlck9wdGlvbnMgY29udGFpbmluZyB0aGUgb3B0aW9ucyBlbnVtZXJhdGlvbiBjb250cm9sbGluZyB0aGUgbGF5ZXIgYmVoYXZpb3IuIFRoZSBzdXBwbGllZCBvcHRpb25zXG4gICAgICogYXJlIG1lcmdlZCB3aXRoIHRoZSBkZWZhdWx0L2V4aXN0aW5nIG9wdGlvbnMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJMYXllclxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRPcHRpb25zKG9wdGlvbnM6IElDbHVzdGVyT3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBjb25zdCBvOiBNaWNyb3NvZnQuTWFwcy5JQ2x1c3RlckxheWVyT3B0aW9ucyA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVDbHVzdGVyT3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fbGF5ZXIuc2V0T3B0aW9ucyhvKTtcbiAgICAgICAgaWYgKG9wdGlvbnMuc3BpZGVyQ2x1c3Rlck9wdGlvbnMpIHsgdGhpcy5TZXRTcGlkZXJPcHRpb25zKG9wdGlvbnMuc3BpZGVyQ2x1c3Rlck9wdGlvbnMpOyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlcyB0aGUgY2x1c3RlciBsYXllciB2aXNpYmlsaXR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHZpc2libGUgQm9vbGVhbiB0cnVlIHRvIG1ha2UgdGhlIGxheWVyIHZpc2libGUsIGZhbHNlIHRvIGhpZGUgdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDbHVzdGVyTGF5ZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0VmlzaWJsZSh2aXNpYmxlOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG86IE1pY3Jvc29mdC5NYXBzLklDbHVzdGVyTGF5ZXJPcHRpb25zID0gdGhpcy5fbGF5ZXIuZ2V0T3B0aW9ucygpO1xuICAgICAgICBvLnZpc2libGUgPSB2aXNpYmxlO1xuICAgICAgICB0aGlzLl9sYXllci5zZXRPcHRpb25zKG8pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IHRvIGFjdHVhbGx5IGNsdXN0ZXIgdGhlIGVudGl0aWVzIGluIGEgY2x1c3RlciBsYXllci4gVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCBhZnRlciB0aGUgaW5pdGlhbCBzZXQgb2YgZW50aXRpZXNcbiAgICAgKiBoYXZlIGJlZW4gYWRkZWQgdG8gdGhlIGNsdXN0ZXIuIFRoaXMgbWV0aG9kIGlzIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgYXMgYWRkaW5nIGFuIGVudGl0aXkgd2lsbCByZWNhbGN1bGF0ZSBhbGwgY2x1c3RlcnMuXG4gICAgICogQXMgc3VjaCwgU3RvcENsdXN0ZXJpbmcgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYWRkaW5nIG1hbnkgZW50aXRpZXMgYW5kIFN0YXJ0Q2x1c3RlcmluZyBzaG91bGQgYmUgY2FsbGVkIG9uY2UgYWRkaW5nIGlzXG4gICAgICogY29tcGxldGUgdG8gcmVjYWxjdWxhdGUgdGhlIGNsdXN0ZXJzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDbHVzdGVyTGF5ZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgU3RhcnRDbHVzdGVyaW5nKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5faXNDbHVzdGVyaW5nKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGNvbnN0IHA6IEFycmF5PE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4+ID0gbmV3IEFycmF5PE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4+KCk7XG4gICAgICAgIHRoaXMuX21hcmtlcnMuZm9yRWFjaChlID0+IHtcbiAgICAgICAgICAgIGlmIChlLk5hdGl2ZVByaW1pdHZlICYmIGUuTG9jYXRpb24pIHtcbiAgICAgICAgICAgICAgICBwLnB1c2goPE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4+ZS5OYXRpdmVQcmltaXR2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9wZW5kaW5nTWFya2Vycy5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgICAgaWYgKGUuTmF0aXZlUHJpbWl0dmUgJiYgZS5Mb2NhdGlvbikge1xuICAgICAgICAgICAgICAgIHAucHVzaCg8TWljcm9zb2Z0Lk1hcHMuUHVzaHBpbj5lLk5hdGl2ZVByaW1pdHZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2xheWVyLnNldFB1c2hwaW5zKHApO1xuICAgICAgICB0aGlzLl9tYXJrZXJzID0gdGhpcy5fbWFya2Vycy5jb25jYXQodGhpcy5fcGVuZGluZ01hcmtlcnMuc3BsaWNlKDApKTtcbiAgICAgICAgdGhpcy5faXNDbHVzdGVyaW5nID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdG9wIHRvIGFjdHVhbGx5IGNsdXN0ZXIgdGhlIGVudGl0aWVzIGluIGEgY2x1c3RlciBsYXllci5cbiAgICAgKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIGFzIGFkZGluZyBhbiBlbnRpdGl5IHdpbGwgcmVjYWxjdWxhdGUgYWxsIGNsdXN0ZXJzLlxuICAgICAqIEFzIHN1Y2gsIFN0b3BDbHVzdGVyaW5nIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIGFkZGluZyBtYW55IGVudGl0aWVzIGFuZCBTdGFydENsdXN0ZXJpbmcgc2hvdWxkIGJlIGNhbGxlZCBvbmNlIGFkZGluZyBpc1xuICAgICAqIGNvbXBsZXRlIHRvIHJlY2FsY3VsYXRlIHRoZSBjbHVzdGVycy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlckxheWVyXG4gICAgICovXG4gICAgcHVibGljIFN0b3BDbHVzdGVyaW5nKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzQ2x1c3RlcmluZykgeyByZXR1cm47IH1cbiAgICAgICAgdGhpcy5faXNDbHVzdGVyaW5nID0gZmFsc2U7XG4gICAgfVxuXG5cbiAgICAvLy9cbiAgICAvLy8gUHJpdmF0ZSBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgY29weSBvZiBhIHB1c2hwaW5zIGJhc2ljIG9wdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGluIFB1c2hwaW4gdG8gY29weSBvcHRpb25zIGZyb20uXG4gICAgICogQHJldHVybnMgLSBBIGNvcHkgb2YgYSBwdXNocGlucyBiYXNpYyBvcHRpb25zLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDbHVzdGVyTGF5ZXJcbiAgICAgKi9cbiAgICBwcml2YXRlIEdldEJhc2ljUHVzaHBpbk9wdGlvbnMocGluOiBNaWNyb3NvZnQuTWFwcy5QdXNocGluKTogTWljcm9zb2Z0Lk1hcHMuSVB1c2hwaW5PcHRpb25zIHtcbiAgICAgICAgcmV0dXJuIDxNaWNyb3NvZnQuTWFwcy5JUHVzaHBpbk9wdGlvbnM+e1xuICAgICAgICAgICAgYW5jaG9yOiBwaW4uZ2V0QW5jaG9yKCksXG4gICAgICAgICAgICBjb2xvcjogcGluLmdldENvbG9yKCksXG4gICAgICAgICAgICBjdXJzb3I6IHBpbi5nZXRDdXJzb3IoKSxcbiAgICAgICAgICAgIGljb246IHBpbi5nZXRJY29uKCksXG4gICAgICAgICAgICByb3VuZENsaWNrYWJsZUFyZWE6IHBpbi5nZXRSb3VuZENsaWNrYWJsZUFyZWEoKSxcbiAgICAgICAgICAgIHN1YlRpdGxlOiBwaW4uZ2V0U3ViVGl0bGUoKSxcbiAgICAgICAgICAgIHRleHQ6IHBpbi5nZXRUZXh0KCksXG4gICAgICAgICAgICB0ZXh0T2Zmc2V0OiBwaW4uZ2V0VGV4dE9mZnNldCgpLFxuICAgICAgICAgICAgdGl0bGU6IHBpbi5nZXRUaXRsZSgpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGlkZXMgdGhlIHNwaWRlciBjbHVzdGVyIGFuZCByZXNvdHJlcyB0aGUgb3JpZ2luYWwgcGluLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDbHVzdGVyTGF5ZXJcbiAgICAgKi9cbiAgICBwcml2YXRlIEhpZGVTcGlkZXJDbHVzdGVyKCk6IHZvaWQge1xuICAgICAgICB0aGlzLl9tYXBjbGlja3MgPSAwO1xuICAgICAgICBpZiAodGhpcy5fY3VycmVudENsdXN0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3NwaWRlckxheWVyLmNsZWFyKCk7XG4gICAgICAgICAgICB0aGlzLl9zcGlkZXJNYXJrZXJzLnNwbGljZSgwKTtcbiAgICAgICAgICAgIHRoaXMuX3NwaWRlck1hcmtlckxvb2t1cC5jbGVhcigpO1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudENsdXN0ZXIgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fbWFwY2xpY2tzID0gLTE7XG4gICAgICAgICAgICBpZiAodGhpcy5fc3BpZGVyT3B0aW9ucy5tYXJrZXJVblNlbGVjdGVkKSB7IHRoaXMuX3NwaWRlck9wdGlvbnMubWFya2VyVW5TZWxlY3RlZCgpOyB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGljayBldmVudCBoYW5kbGVyIGZvciB3aGVuIGEgc2hhcGUgaW4gdGhlIGNsdXN0ZXIgbGF5ZXIgaXMgY2xpY2tlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlIFRoZSBtb3VzZSBldmVudCBhcmd1cm1lbnQgZnJvbSB0aGUgY2xpY2sgZXZlbnQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJMYXllclxuICAgICAqL1xuICAgIHByaXZhdGUgT25MYXllckNsaWNrKGU6IE1pY3Jvc29mdC5NYXBzLklNb3VzZUV2ZW50QXJncyk6IHZvaWQge1xuICAgICAgICBpZiAoZS5wcmltaXRpdmUgaW5zdGFuY2VvZiBNaWNyb3NvZnQuTWFwcy5DbHVzdGVyUHVzaHBpbikge1xuICAgICAgICAgICAgY29uc3QgY3A6IE1pY3Jvc29mdC5NYXBzLkNsdXN0ZXJQdXNocGluID0gPE1pY3Jvc29mdC5NYXBzLkNsdXN0ZXJQdXNocGluPmUucHJpbWl0aXZlO1xuICAgICAgICAgICAgY29uc3Qgc2hvd05ld0NsdXN0ZXI6IGJvb2xlYW4gPSBjcCAhPT0gdGhpcy5fY3VycmVudENsdXN0ZXI7XG4gICAgICAgICAgICB0aGlzLkhpZGVTcGlkZXJDbHVzdGVyKCk7XG4gICAgICAgICAgICBpZiAoc2hvd05ld0NsdXN0ZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLlNob3dTcGlkZXJDbHVzdGVyKDxNaWNyb3NvZnQuTWFwcy5DbHVzdGVyUHVzaHBpbj5lLnByaW1pdGl2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBwaW46IE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4gPSA8TWljcm9zb2Z0Lk1hcHMuUHVzaHBpbj5lLnByaW1pdGl2ZTtcbiAgICAgICAgICAgIGlmIChwaW4ubWV0YWRhdGEgJiYgcGluLm1ldGFkYXRhLmlzQ2x1c3Rlck1hcmtlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG06IEJpbmdTcGlkZXJDbHVzdGVyTWFya2VyID0gdGhpcy5HZXRTcGlkZXJNYXJrZXJGcm9tQmluZ01hcmtlcihwaW4pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHA6IEJpbmdNYXJrZXIgPSBtLlBhcmVudE1hcmtlcjtcbiAgICAgICAgICAgICAgICBjb25zdCBwcGluOiBNaWNyb3NvZnQuTWFwcy5QdXNocGluID0gcC5OYXRpdmVQcmltaXR2ZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3BpZGVyT3B0aW9ucy5tYXJrZXJTZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zcGlkZXJPcHRpb25zLm1hcmtlclNlbGVjdGVkKHAsIG5ldyBCaW5nTWFya2VyKHRoaXMuX2N1cnJlbnRDbHVzdGVyLCBudWxsLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChNaWNyb3NvZnQuTWFwcy5FdmVudHMuaGFzSGFuZGxlcihwcGluLCAnY2xpY2snKSkgeyBNaWNyb3NvZnQuTWFwcy5FdmVudHMuaW52b2tlKHBwaW4sICdjbGljaycsIGUpOyB9XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFwY2xpY2tzID0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NwaWRlck9wdGlvbnMubWFya2VyU2VsZWN0ZWQpIHsgdGhpcy5fc3BpZGVyT3B0aW9ucy5tYXJrZXJTZWxlY3RlZCh0aGlzLkdldE1hcmtlckZyb21CaW5nTWFya2VyKHBpbiksIG51bGwpOyB9XG4gICAgICAgICAgICAgICAgaWYgKE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5oYXNIYW5kbGVyKHBpbiwgJ2NsaWNrJykpIHsgTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmludm9rZShwaW4sICdjbGljaycsIGUpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWxlZ2F0ZSBoYW5kbGluZyB0aGUgY2xpY2sgZXZlbnQgb24gdGhlIG1hcCAob3V0c2lkZSBhIHNwaWRlciBjbHVzdGVyKS4gRGVwZW5kaW5nIG9uIHRoZVxuICAgICAqIHNwaWRlciBvcHRpb25zLCBjbG9zZXMgdGhlIGNsdXN0ZXIgb3IgaW5jcmVtZW50cyB0aGUgY2xpY2sgY291bnRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlIC0gTW91c2UgZXZlbnRcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlckxheWVyXG4gICAgICovXG4gICAgcHJpdmF0ZSBPbk1hcENsaWNrKGU6IE1pY3Jvc29mdC5NYXBzLklNb3VzZUV2ZW50QXJncyB8IE1pY3Jvc29mdC5NYXBzLklNYXBUeXBlQ2hhbmdlRXZlbnRBcmdzKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLl9tYXBjbGlja3MgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSBpZiAoKyt0aGlzLl9tYXBjbGlja3MgPj0gdGhpcy5fc3BpZGVyT3B0aW9ucy5jb2xsYXBzZUNsdXN0ZXJPbk50aENsaWNrKSB7XG4gICAgICAgICAgICB0aGlzLkhpZGVTcGlkZXJDbHVzdGVyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nIGFzIHRoaXMuX21hcGNsaWNrcyBoYXMgYWxyZWFkeSBiZWVuIGluY3JlbWVudGVkIGFib3ZlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWxlZ2F0ZSBoYW5kbGluZyB0aGUgbWFwIHZpZXcgY2hhbmdlZCBlbmQgZXZlbnQuIEhpZGVzIHRoZSBzcGlkZXIgY2x1c3RlciBpZiB0aGUgem9vbSBsZXZlbCBoYXMgY2hhbmdlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlIC0gTW91c2UgZXZlbnQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJMYXllclxuICAgICAqL1xuICAgIHByaXZhdGUgT25NYXBWaWV3Q2hhbmdlRW5kKGU6IE1pY3Jvc29mdC5NYXBzLklNb3VzZUV2ZW50QXJncyB8IE1pY3Jvc29mdC5NYXBzLklNYXBUeXBlQ2hhbmdlRXZlbnRBcmdzKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHo6IG51bWJlciA9ICg8TWljcm9zb2Z0Lk1hcHMuTWFwPmUudGFyZ2V0KS5nZXRab29tKCk7XG4gICAgICAgIGNvbnN0IGhhc1pvb21DaGFuZ2VkOiBib29sZWFuID0gKHogIT09IHRoaXMuX2N1cnJlbnRab29tKTtcbiAgICAgICAgdGhpcy5fY3VycmVudFpvb20gPSB6O1xuICAgICAgICBpZiAoaGFzWm9vbUNoYW5nZWQpIHtcbiAgICAgICAgICAgIHRoaXMuSGlkZVNwaWRlckNsdXN0ZXIoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlbGVnYXRlIGhhbmRsaW5nIHRoZSBtYXAgdmlldyBjaGFuZ2Ugc3RhcnQgZXZlbnQuIERlcGVuZGluZyBvbiB0aGUgc3BpZGVyIG9wdGlvbnMsIGhpZGVzIHRoZVxuICAgICAqIHRoZSBleHBsb2RlZCBzcGlkZXIgb3IgZG9lcyBub3RoaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIGUgLSBNb3VzZSBldmVudC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2x1c3RlckxheWVyXG4gICAgICovXG4gICAgcHJpdmF0ZSBPbk1hcFZpZXdDaGFuZ2VTdGFydChlOiBNaWNyb3NvZnQuTWFwcy5JTW91c2VFdmVudEFyZ3MgfCBNaWNyb3NvZnQuTWFwcy5JTWFwVHlwZUNoYW5nZUV2ZW50QXJncyk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fc3BpZGVyT3B0aW9ucy5jb2xsYXBzZUNsdXN0ZXJPbk1hcENoYW5nZSkge1xuICAgICAgICAgICAgdGhpcy5IaWRlU3BpZGVyQ2x1c3RlcigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVsZWdhdGUgaW52b2tlZCBvbiBtb3VzZSBvdXQgb24gYW4gZXhwbG9kZWQgc3BpZGVyIG1hcmtlci4gUmVzZXRzIHRoZSBob3ZlciBzdHlsZSBvbiB0aGUgc3RpY2suXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZSAtIE1vdXNlIGV2ZW50LlxuICAgICAqL1xuICAgIHByaXZhdGUgT25TcGlkZXJNb3VzZU91dChlOiBNaWNyb3NvZnQuTWFwcy5JTW91c2VFdmVudEFyZ3MpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgcGluOiBNaWNyb3NvZnQuTWFwcy5QdXNocGluID0gPE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4+ZS5wcmltaXRpdmU7XG4gICAgICAgIGlmIChwaW4gaW5zdGFuY2VvZiBNaWNyb3NvZnQuTWFwcy5QdXNocGluICYmIHBpbi5tZXRhZGF0YSAmJiBwaW4ubWV0YWRhdGEuaXNDbHVzdGVyTWFya2VyKSB7XG4gICAgICAgICAgICBjb25zdCBtOiBCaW5nU3BpZGVyQ2x1c3Rlck1hcmtlciA9IHRoaXMuR2V0U3BpZGVyTWFya2VyRnJvbUJpbmdNYXJrZXIocGluKTtcbiAgICAgICAgICAgIG0uU3RpY2suc2V0T3B0aW9ucyh0aGlzLl9zcGlkZXJPcHRpb25zLnN0aWNrU3R5bGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCBvbiBtb3VzZSBvdmVyIG9uIGFuIGV4cGxvZGVkIHNwaWRlciBtYXJrZXIuIFNldHMgdGhlIGhvdmVyIHN0eWxlIG9uIHRoZSBzdGljay4gQWxzbyBpbnZva2VzIHRoZSBjbGljayBldmVudFxuICAgICAqIG9uIHRoZSB1bmRlcmx5aW5nIG9yaWdpbmFsIG1hcmtlciBkZXBlbmRlbnQgb24gdGhlIHNwaWRlciBvcHRpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIGUgLSBNb3VzZSBldmVudC5cbiAgICAgKi9cbiAgICBwcml2YXRlIE9uU3BpZGVyTW91c2VPdmVyKGU6IE1pY3Jvc29mdC5NYXBzLklNb3VzZUV2ZW50QXJncyk6IHZvaWQge1xuICAgICAgICBjb25zdCBwaW46IE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4gPSA8TWljcm9zb2Z0Lk1hcHMuUHVzaHBpbj5lLnByaW1pdGl2ZTtcbiAgICAgICAgaWYgKHBpbiBpbnN0YW5jZW9mIE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4gJiYgcGluLm1ldGFkYXRhICYmIHBpbi5tZXRhZGF0YS5pc0NsdXN0ZXJNYXJrZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG06IEJpbmdTcGlkZXJDbHVzdGVyTWFya2VyID0gdGhpcy5HZXRTcGlkZXJNYXJrZXJGcm9tQmluZ01hcmtlcihwaW4pO1xuICAgICAgICAgICAgbS5TdGljay5zZXRPcHRpb25zKHRoaXMuX3NwaWRlck9wdGlvbnMuc3RpY2tIb3ZlclN0eWxlKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zcGlkZXJPcHRpb25zLmludm9rZUNsaWNrT25Ib3Zlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHA6IEJpbmdNYXJrZXIgPSBtLlBhcmVudE1hcmtlcjtcbiAgICAgICAgICAgICAgICBjb25zdCBwcGluOiBNaWNyb3NvZnQuTWFwcy5QdXNocGluID0gcC5OYXRpdmVQcmltaXR2ZTtcbiAgICAgICAgICAgICAgICBpZiAoTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmhhc0hhbmRsZXIocHBpbiwgJ2NsaWNrJykpIHsgTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmludm9rZShwcGluLCAnY2xpY2snLCBlKTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgb3B0aW9ucyBmb3Igc3BpZGVyIGJlaGF2aW9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgSVNwaWRlckNsdXN0ZXJPcHRpb25zIGNvbnRhaW5pbmcgdGhlIG9wdGlvbnMgZW51bWVyYXRpb24gY29udHJvbGxpbmcgdGhlIHNwaWRlciBjbHVzdGVyIGJlaGF2aW9yLiBUaGUgc3VwcGxpZWQgb3B0aW9uc1xuICAgICAqIGFyZSBtZXJnZWQgd2l0aCB0aGUgZGVmYXVsdC9leGlzdGluZyBvcHRpb25zLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdDbHVzdGVyTGF5ZXJcbiAgICAgKi9cbiAgICBwcml2YXRlIFNldFNwaWRlck9wdGlvbnMob3B0aW9uczogSVNwaWRlckNsdXN0ZXJPcHRpb25zKTogdm9pZCB7XG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY2lyY2xlU3BpcmFsU3dpdGNob3ZlciA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zcGlkZXJPcHRpb25zLmNpcmNsZVNwaXJhbFN3aXRjaG92ZXIgPSBvcHRpb25zLmNpcmNsZVNwaXJhbFN3aXRjaG92ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY29sbGFwc2VDbHVzdGVyT25NYXBDaGFuZ2UgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NwaWRlck9wdGlvbnMuY29sbGFwc2VDbHVzdGVyT25NYXBDaGFuZ2UgPSBvcHRpb25zLmNvbGxhcHNlQ2x1c3Rlck9uTWFwQ2hhbmdlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmNvbGxhcHNlQ2x1c3Rlck9uTnRoQ2xpY2sgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3BpZGVyT3B0aW9ucy5jb2xsYXBzZUNsdXN0ZXJPbk50aENsaWNrID0gb3B0aW9ucy5jb2xsYXBzZUNsdXN0ZXJPbk50aENsaWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmludm9rZUNsaWNrT25Ib3ZlciA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3BpZGVyT3B0aW9ucy5pbnZva2VDbGlja09uSG92ZXIgPSBvcHRpb25zLmludm9rZUNsaWNrT25Ib3ZlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5taW5TcGlyYWxBbmdsZVNlcGVyYXRpb24gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3BpZGVyT3B0aW9ucy5taW5TcGlyYWxBbmdsZVNlcGVyYXRpb24gPSBvcHRpb25zLm1pblNwaXJhbEFuZ2xlU2VwZXJhdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zcGlyYWxEaXN0YW5jZUZhY3RvciA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zcGlkZXJPcHRpb25zLnNwaXJhbERpc3RhbmNlRmFjdG9yID0gb3B0aW9ucy5zcGlyYWxEaXN0YW5jZUZhY3RvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5taW5DaXJjbGVMZW5ndGggPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3BpZGVyT3B0aW9ucy5taW5DaXJjbGVMZW5ndGggPSBvcHRpb25zLm1pbkNpcmNsZUxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN0aWNrSG92ZXJTdHlsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NwaWRlck9wdGlvbnMuc3RpY2tIb3ZlclN0eWxlID0gb3B0aW9ucy5zdGlja0hvdmVyU3R5bGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zdGlja1N0eWxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3BpZGVyT3B0aW9ucy5zdGlja1N0eWxlID0gb3B0aW9ucy5zdGlja1N0eWxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMubWFya2VyU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zcGlkZXJPcHRpb25zLm1hcmtlclNlbGVjdGVkID0gb3B0aW9ucy5tYXJrZXJTZWxlY3RlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLm1hcmtlclVuU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zcGlkZXJPcHRpb25zLm1hcmtlclVuU2VsZWN0ZWQgPSBvcHRpb25zLm1hcmtlclVuU2VsZWN0ZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudmlzaWJsZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3BpZGVyT3B0aW9ucy52aXNpYmxlID0gb3B0aW9ucy52aXNpYmxlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5TZXRPcHRpb25zKDxJQ2x1c3Rlck9wdGlvbnM+b3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFeHBhbmRzIGEgY2x1c3RlciBpbnRvIGl0J3Mgb3BlbiBzcGlkZXIgbGF5b3V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNsdXN0ZXIgVGhlIGNsdXN0ZXIgdG8gc2hvdyBpbiBpdCdzIG9wZW4gc3BpZGVyIGxheW91dC4uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NsdXN0ZXJMYXllclxuICAgICAqL1xuICAgIHByaXZhdGUgU2hvd1NwaWRlckNsdXN0ZXIoY2x1c3RlcjogTWljcm9zb2Z0Lk1hcHMuQ2x1c3RlclB1c2hwaW4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5IaWRlU3BpZGVyQ2x1c3RlcigpO1xuICAgICAgICB0aGlzLl9jdXJyZW50Q2x1c3RlciA9IGNsdXN0ZXI7XG5cbiAgICAgICAgaWYgKGNsdXN0ZXIgJiYgY2x1c3Rlci5jb250YWluZWRQdXNocGlucykge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIHNwaWRlciBkYXRhLlxuICAgICAgICAgICAgY29uc3QgbTogTWljcm9zb2Z0Lk1hcHMuTWFwID0gKDxCaW5nTWFwU2VydmljZT50aGlzLl9tYXBzKS5NYXBJbnN0YW5jZTtcbiAgICAgICAgICAgIGNvbnN0IHBpbnM6IEFycmF5PE1pY3Jvc29mdC5NYXBzLlB1c2hwaW4+ID0gY2x1c3Rlci5jb250YWluZWRQdXNocGlucztcbiAgICAgICAgICAgIGNvbnN0IGNlbnRlcjogTWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24gPSBjbHVzdGVyLmdldExvY2F0aW9uKCk7XG4gICAgICAgICAgICBjb25zdCBjZW50ZXJQb2ludDogTWljcm9zb2Z0Lk1hcHMuUG9pbnQgPVxuICAgICAgICAgICAgICAgIDxNaWNyb3NvZnQuTWFwcy5Qb2ludD5tLnRyeUxvY2F0aW9uVG9QaXhlbChjZW50ZXIsIE1pY3Jvc29mdC5NYXBzLlBpeGVsUmVmZXJlbmNlLmNvbnRyb2wpO1xuICAgICAgICAgICAgbGV0IHN0aWNrOiBNaWNyb3NvZnQuTWFwcy5Qb2x5bGluZTtcbiAgICAgICAgICAgIGxldCBhbmdsZSA9IDA7XG4gICAgICAgICAgICBjb25zdCBtYWtlU3BpcmFsOiBib29sZWFuID0gcGlucy5sZW5ndGggPiB0aGlzLl9zcGlkZXJPcHRpb25zLmNpcmNsZVNwaXJhbFN3aXRjaG92ZXI7XG4gICAgICAgICAgICBsZXQgbGVnUGl4ZWxMZW5ndGg6IG51bWJlcjtcbiAgICAgICAgICAgIGxldCBzdGVwQW5nbGU6IG51bWJlcjtcbiAgICAgICAgICAgIGxldCBzdGVwTGVuZ3RoOiBudW1iZXI7XG5cbiAgICAgICAgICAgIGlmIChtYWtlU3BpcmFsKSB7XG4gICAgICAgICAgICAgICAgbGVnUGl4ZWxMZW5ndGggPSB0aGlzLl9zcGlkZXJPcHRpb25zLm1pbkNpcmNsZUxlbmd0aCAvIE1hdGguUEk7XG4gICAgICAgICAgICAgICAgc3RlcExlbmd0aCA9IDIgKiBNYXRoLlBJICogdGhpcy5fc3BpZGVyT3B0aW9ucy5zcGlyYWxEaXN0YW5jZUZhY3RvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0ZXBBbmdsZSA9IDIgKiBNYXRoLlBJIC8gcGlucy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgbGVnUGl4ZWxMZW5ndGggPSAodGhpcy5fc3BpZGVyT3B0aW9ucy5zcGlyYWxEaXN0YW5jZUZhY3RvciAvIHN0ZXBBbmdsZSAvIE1hdGguUEkgLyAyKSAqIHBpbnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGlmIChsZWdQaXhlbExlbmd0aCA8IHRoaXMuX3NwaWRlck9wdGlvbnMubWluQ2lyY2xlTGVuZ3RoKSB7IGxlZ1BpeGVsTGVuZ3RoID0gdGhpcy5fc3BpZGVyT3B0aW9ucy5taW5DaXJjbGVMZW5ndGg7IH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHBpbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgc3BpZGVyIHBpbiBsb2NhdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoIW1ha2VTcGlyYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgYW5nbGUgPSBzdGVwQW5nbGUgKiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYW5nbGUgKz0gdGhpcy5fc3BpZGVyT3B0aW9ucy5taW5TcGlyYWxBbmdsZVNlcGVyYXRpb24gLyBsZWdQaXhlbExlbmd0aCArIGkgKiAwLjAwMDU7XG4gICAgICAgICAgICAgICAgICAgIGxlZ1BpeGVsTGVuZ3RoICs9IHN0ZXBMZW5ndGggLyBhbmdsZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcG9pbnQ6IE1pY3Jvc29mdC5NYXBzLlBvaW50ID1cbiAgICAgICAgICAgICAgICAgICAgbmV3IE1pY3Jvc29mdC5NYXBzLlBvaW50KGNlbnRlclBvaW50LnggKyBsZWdQaXhlbExlbmd0aCAqIE1hdGguY29zKGFuZ2xlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRlclBvaW50LnkgKyBsZWdQaXhlbExlbmd0aCAqIE1hdGguc2luKGFuZ2xlKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbG9jOiBNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgIDxNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbj5tLnRyeVBpeGVsVG9Mb2NhdGlvbihwb2ludCwgTWljcm9zb2Z0Lk1hcHMuUGl4ZWxSZWZlcmVuY2UuY29udHJvbCk7XG5cbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgc3RpY2sgdG8gcGluLlxuICAgICAgICAgICAgICAgIHN0aWNrID0gbmV3IE1pY3Jvc29mdC5NYXBzLlBvbHlsaW5lKFtjZW50ZXIsIGxvY10sIHRoaXMuX3NwaWRlck9wdGlvbnMuc3RpY2tTdHlsZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3BpZGVyTGF5ZXIuYWRkKHN0aWNrKTtcblxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBwaW4gaW4gc3BpcmFsIHRoYXQgY29udGFpbnMgc2FtZSBtZXRhZGF0YSBhcyBwYXJlbnQgcGluLlxuICAgICAgICAgICAgICAgIGNvbnN0IHBpbjogTWljcm9zb2Z0Lk1hcHMuUHVzaHBpbiA9IG5ldyBNaWNyb3NvZnQuTWFwcy5QdXNocGluKGxvYyk7XG4gICAgICAgICAgICAgICAgcGluLm1ldGFkYXRhID0gcGluc1tpXS5tZXRhZGF0YSB8fCB7fTtcbiAgICAgICAgICAgICAgICBwaW4ubWV0YWRhdGEuaXNDbHVzdGVyTWFya2VyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwaW4uc2V0T3B0aW9ucyh0aGlzLkdldEJhc2ljUHVzaHBpbk9wdGlvbnMocGluc1tpXSkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NwaWRlckxheWVyLmFkZChwaW4pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BpZGVyTWFya2VyOiBCaW5nU3BpZGVyQ2x1c3Rlck1hcmtlciA9IG5ldyBCaW5nU3BpZGVyQ2x1c3Rlck1hcmtlcihwaW4sIG51bGwsIHRoaXMuX3NwaWRlckxheWVyKTtcbiAgICAgICAgICAgICAgICBzcGlkZXJNYXJrZXIuU3RpY2sgPSBzdGljaztcbiAgICAgICAgICAgICAgICBzcGlkZXJNYXJrZXIuUGFyZW50TWFya2VyID0gPEJpbmdNYXJrZXI+dGhpcy5HZXRNYXJrZXJGcm9tQmluZ01hcmtlcihwaW5zW2ldKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zcGlkZXJNYXJrZXJzLnB1c2goc3BpZGVyTWFya2VyKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zcGlkZXJNYXJrZXJMb29rdXAuc2V0KHBpbiwgc3BpZGVyTWFya2VyKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fbWFwY2xpY2tzID0gMDtcbiAgICAgICAgfVxuICAgIH1cblxufVxuIl19