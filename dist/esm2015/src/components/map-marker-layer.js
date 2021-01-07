import { Directive, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { MarkerService } from '../services/marker.service';
import { LayerService } from '../services/layer.service';
import { ClusterService } from '../services/cluster.service';
import { MapService } from '../services/map.service';
import { ClusterClickAction } from '../models/cluster-click-action';
import { ClusterPlacementMode } from '../models/cluster-placement-mode';
import { ClusterLayerDirective } from './cluster-layer';
/**
 * internal counter to use as ids for marker.
 */
let layerId = 1000000;
/**
 * MapMarkerLayerDirective performantly renders a large set of map marker inside a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapMarkerDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *   .map-container {
 *     height: 300px;
 *   }
 * `],
 * template: `
 *   <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-marker-layer [MarkerOptions]="_markers"></x-map-marker-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
export class MapMarkerLayerDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapMarkerLayerDirective.
     * @param _markerService - Concreate implementation of a {@link MarkerService}.
     * @param _layerService - Concreate implementation of a {@link LayerService}.
     * @param _clusterService - Concreate implementation of a {@link ClusterService}.
     * @param _mapService - Concreate implementation of a {@link MapService}.
     * @param _zone - Concreate implementation of a {@link NgZone} service.
     *
     * @memberof MapMarkerLayerDirective
     */
    constructor(_markerService, _layerService, _clusterService, _mapService, _zone) {
        this._markerService = _markerService;
        this._layerService = _layerService;
        this._clusterService = _clusterService;
        this._mapService = _mapService;
        this._zone = _zone;
        this._useDynamicSizeMarker = false;
        this._dynamicMarkerBaseSize = 18;
        this._dynamicMarkerRanges = new Map([
            [10, 'rgba(20, 180, 20, 0.5)'],
            [100, 'rgba(255, 210, 40, 0.5)'],
            [Number.MAX_SAFE_INTEGER, 'rgba(255, 40, 40, 0.5)']
        ]);
        this._streaming = false;
        this._markers = new Array();
        this._markersLast = new Array();
        /**
         * Gets or sets the the Cluster Click Action {@link ClusterClickAction}.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.ClusterClickAction = ClusterClickAction.ZoomIntoCluster;
        /**
         * Gets or sets the cluster placement mode. {@link ClusterPlacementMode}
         *
         * @memberof MapMarkerLayerDirective
         */
        this.ClusterPlacementMode = ClusterPlacementMode.MeanValue;
        /**
         * Determines whether the layer clusters. This property can only be set on creation of the layer.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.EnableClustering = false;
        /**
         * Gets or sets the grid size to be used for clustering.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.GridSize = 150;
        /**
         * Gets or sets An offset applied to the positioning of the layer.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.LayerOffset = null;
        /**
         * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.ZIndex = 0;
        /**
         * Gets or sets whether the cluster should zoom in on click
         *
         * @readonly
         * @memberof MapMarkerLayerDirective
         */
        this.ZoomOnClick = true;
        ///
        /// Delegates
        ///
        /**
         * This event emitter gets emitted when the dynamic icon for a marker is being created.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.DynamicMarkerCreated = new EventEmitter();
        /**
         * This event emitter gets emitted when the user clicks a marker in the layer.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.MarkerClick = new EventEmitter();
        /**
         * This event is fired when the user stops dragging a marker.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.DragEnd = new EventEmitter();
        this._id = layerId++;
    }
    /**
     * Gets or sets the callback invoked to create a custom cluster marker. Note that when {@link UseDynamicSizeMarkers} is enabled,
     * you cannot set a custom marker callback.
     *
     * @memberof MapMarkerLayerDirective
     */
    get CustomMarkerCallback() { return this._iconCreationCallback; }
    set CustomMarkerCallback(val) {
        if (this._useDynamicSizeMarker) {
            throw (new Error(`You cannot set a custom marker callback when UseDynamicSizeMarkers is set to true.
                    Set UseDynamicSizeMakers to false.`));
        }
        this._iconCreationCallback = val;
    }
    /**
     * Gets or sets the base size of dynamic markers in pixels. The actualy size of the dynamic marker is based on this.
     * See {@link UseDynamicSizeMarkers}.
     *
     * @memberof ClusterLayerDirective
     */
    get DynamicMarkerBaseSize() { return this._dynamicMarkerBaseSize; }
    set DynamicMarkerBaseSize(val) { this._dynamicMarkerBaseSize = val; }
    /**
     * Gets or sets the ranges to use to calculate breakpoints and colors for dynamic markers.
     * The map contains key/value pairs, with the keys being
     * the breakpoint sizes and the values the colors to be used for the dynamic marker in that range. See {@link UseDynamicSizeMarkers}.
     *
     * @memberof ClusterLayerDirective
     */
    get DynamicMarkerRanges() { return this._dynamicMarkerRanges; }
    set DynamicMarkerRanges(val) { this._dynamicMarkerRanges = val; }
    /**
     *  IMarkerOptions array holding the marker info.
     *
     * @memberof MapMarkerLayerDirective
     */
    get MarkerOptions() { return this._markers; }
    set MarkerOptions(val) {
        if (this._streaming) {
            this._markersLast.push(...val.slice(0));
            this._markers.push(...val);
        }
        else {
            this._markers = val.slice(0);
        }
    }
    /**
     * Gets or sets the cluster styles
     *
     * @memberof MapMarkerLayerDirective
     */
    get Styles() { return this._styles; }
    set Styles(val) { this._styles = val; }
    /**
     * Sets whether to treat changes in the MarkerOptions as streams of new markers. In thsi mode, changing the
     * Array supplied in MarkerOptions will be incrementally drawn on the map as opposed to replace the markers on the map.
     *
     * @memberof MapMarkerLayerDirective
     */
    get TreatNewMarkerOptionsAsStream() { return this._streaming; }
    set TreatNewMarkerOptionsAsStream(val) { this._streaming = val; }
    /**
     * Gets or sets whether to use dynamic markers. Dynamic markers change in size and color depending on the number of
     * pins in the cluster. If set to true, this will take precendence over any custom marker creation.
     *
     * @memberof MapMarkerLayerDirective
     */
    get UseDynamicSizeMarkers() { return this._useDynamicSizeMarker; }
    set UseDynamicSizeMarkers(val) {
        this._useDynamicSizeMarker = val;
        if (val) {
            this._iconCreationCallback = (m, info) => {
                return ClusterLayerDirective.CreateDynamicSizeMarker(m.length, info, this._dynamicMarkerBaseSize, this._dynamicMarkerRanges);
            };
        }
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets the id of the marker layer.
     *
     * @readonly
     * @memberof MapMarkerLayerDirective
     */
    get Id() { return this._id; }
    ///
    /// Public methods
    ///
    /**
     * Translates a geo location to a pixel location relative to the map viewport.
     *
     * @param [loc] - {@link ILatLong} containing the geo coordinates.
     * @returns - A promise that when fullfilled contains an {@link IPoint} representing the pixel coordinates.
     *
     * @memberof MapMarkerLayerDirective
     */
    LocationToPixel(loc) {
        return this._markerService.LocationToPoint(loc);
    }
    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapMarkerLayerDirective
     */
    ngAfterContentInit() {
        const layerOptions = {
            id: this._id
        };
        this._zone.runOutsideAngular(() => {
            const fakeLayerDirective = {
                Id: this._id,
                Visible: this.Visible
            };
            if (!this.EnableClustering) {
                this._layerService.AddLayer(fakeLayerDirective);
                this._layerPromise = this._layerService.GetNativeLayer(fakeLayerDirective);
                this._service = this._layerService;
            }
            else {
                fakeLayerDirective.LayerOffset = this.LayerOffset;
                fakeLayerDirective.ZIndex = this.ZIndex;
                fakeLayerDirective.ClusteringEnabled = this.EnableClustering;
                fakeLayerDirective.ClusterPlacementMode = this.ClusterPlacementMode;
                fakeLayerDirective.GridSize = this.GridSize;
                fakeLayerDirective.ClusterClickAction = this.ClusterClickAction;
                fakeLayerDirective.IconInfo = this.ClusterIconInfo;
                fakeLayerDirective.CustomMarkerCallback = this.CustomMarkerCallback;
                fakeLayerDirective.UseDynamicSizeMarkers = this.UseDynamicSizeMarkers;
                this._clusterService.AddLayer(fakeLayerDirective);
                this._layerPromise = this._clusterService.GetNativeLayer(fakeLayerDirective);
                this._service = this._clusterService;
            }
            this._layerPromise.then(l => {
                l.SetVisible(this.Visible);
                if (this.MarkerOptions) {
                    this._zone.runOutsideAngular(() => this.UpdateMarkers());
                }
            });
        });
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     *
     * @memberof MapMarkerLayerDirective
     */
    ngOnDestroy() {
        this._layerPromise.then(l => {
            l.Delete();
        });
    }
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     *
     * @memberof MapMarkerLayerDirective
     */
    ngOnChanges(changes) {
        let shouldSetOptions = false;
        const o = {
            id: this._id
        };
        if (changes['MarkerOptions']) {
            this._zone.runOutsideAngular(() => {
                this.UpdateMarkers();
            });
        }
        if (changes['Visible'] && !changes['Visible'].firstChange) {
            this._zone.runOutsideAngular(() => {
                this._layerPromise.then(l => l.SetVisible(this.Visible));
            });
        }
        if (changes['EnableClustering'] && !changes['EnableClustering'].firstChange) {
            if ('StopClustering' in this._service) {
                o.clusteringEnabled = this.EnableClustering;
                shouldSetOptions = true;
            }
            else {
                throw (new Error('You cannot change EnableClustering after the layer has been created.'));
            }
        }
        if (changes['ClusterPlacementMode'] && !changes['ClusterPlacementMode'].firstChange && 'StopClustering' in this._service) {
            o.placementMode = this.ClusterPlacementMode;
            shouldSetOptions = true;
        }
        if (changes['GridSize'] && !changes['GridSize'].firstChange && 'StopClustering' in this._service) {
            o.gridSize = this.GridSize;
            shouldSetOptions = true;
        }
        if (changes['ClusterClickAction'] && !changes['ClusterClickAction'].firstChange && 'StopClustering' in this._service) {
            o.zoomOnClick = this.ClusterClickAction === ClusterClickAction.ZoomIntoCluster;
            shouldSetOptions = true;
        }
        if ((changes['ZIndex'] && !changes['ZIndex'].firstChange) ||
            (changes['LayerOffset'] && !changes['LayerOffset'].firstChange) ||
            (changes['IconInfo'] && !changes['IconInfo'].firstChange)) {
            throw (new Error('You cannot change ZIndex or LayerOffset after the layer has been created.'));
        }
        if (shouldSetOptions) {
            this._zone.runOutsideAngular(() => {
                const fakeLayerDirective = { Id: this._id };
                this._layerPromise.then(l => l.SetOptions(o));
            });
        }
    }
    /**
     * Obtains a string representation of the Marker Id.
     * @returns - string representation of the marker id.
     * @memberof MapMarkerLayerDirective
     */
    toString() { return 'MapMarkerLayer-' + this._id.toString(); }
    ///
    /// Private methods
    ///
    /**
     * Adds various event listeners for the marker.
     *
     * @param m - the marker for which to add the event.
     *
     * @memberof MapMarkerLayerDirective
     */
    AddEventListeners(m) {
        m.AddListener('click', (e) => this.MarkerClick.emit({
            Marker: m,
            Click: e,
            Location: this._markerService.GetCoordinatesFromClick(e),
            Pixels: this._markerService.GetPixelsFromClick(e)
        }));
        m.AddListener('dragend', (e) => this.DragEnd.emit({
            Marker: m,
            Click: e,
            Location: this._markerService.GetCoordinatesFromClick(e),
            Pixels: this._markerService.GetPixelsFromClick(e)
        }));
    }
    /**
     * Sets or updates the markers based on the marker options. This will place the markers on the map
     * and register the associated events.
     *
     * @memberof MapMarkerLayerDirective
     * @method
     */
    UpdateMarkers() {
        if (this._layerPromise == null) {
            return;
        }
        this._layerPromise.then(l => {
            const markers = this._streaming ? this._markersLast.splice(0) : this._markers;
            // generate the promise for the markers
            const mp = this._service.CreateMarkers(markers, this.IconInfo);
            // set markers once promises are fullfilled.
            mp.then(m => {
                m.forEach(marker => {
                    this.AddEventListeners(marker);
                });
                this._streaming ? l.AddEntities(m) : l.SetEntities(m);
            });
        });
    }
}
MapMarkerLayerDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-marker-layer'
            },] }
];
MapMarkerLayerDirective.ctorParameters = () => [
    { type: MarkerService },
    { type: LayerService },
    { type: ClusterService },
    { type: MapService },
    { type: NgZone }
];
MapMarkerLayerDirective.propDecorators = {
    ClusterClickAction: [{ type: Input }],
    ClusterIconInfo: [{ type: Input }],
    ClusterPlacementMode: [{ type: Input }],
    CustomMarkerCallback: [{ type: Input }],
    DynamicMarkerBaseSize: [{ type: Input }],
    DynamicMarkerRanges: [{ type: Input }],
    EnableClustering: [{ type: Input }],
    GridSize: [{ type: Input }],
    IconInfo: [{ type: Input }],
    LayerOffset: [{ type: Input }],
    MarkerOptions: [{ type: Input }],
    Styles: [{ type: Input }],
    TreatNewMarkerOptionsAsStream: [{ type: Input }],
    UseDynamicSizeMarkers: [{ type: Input }],
    Visible: [{ type: Input }],
    ZIndex: [{ type: Input }],
    ZoomOnClick: [{ type: Input }],
    DynamicMarkerCreated: [{ type: Output }],
    MarkerClick: [{ type: Output }],
    DragEnd: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLW1hcmtlci1sYXllci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL21hcC1tYXJrZXItbGF5ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNILFNBQVMsRUFBZ0IsS0FBSyxFQUFFLE1BQU0sRUFDdEMsWUFBWSxFQUFvRCxNQUFNLEVBQ3pFLE1BQU0sZUFBZSxDQUFDO0FBU3ZCLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUMzRCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDekQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQzdELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUdyRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUNwRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUN4RSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUV4RDs7R0FFRztBQUNILElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUV0Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBd0JHO0FBSUgsTUFBTSxPQUFPLHVCQUF1QjtJQW1PaEMsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7Ozs7Ozs7OztPQVNHO0lBQ0gsWUFDWSxjQUE2QixFQUM3QixhQUEyQixFQUMzQixlQUErQixFQUMvQixXQUF1QixFQUN2QixLQUFhO1FBSmIsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFDN0Isa0JBQWEsR0FBYixhQUFhLENBQWM7UUFDM0Isb0JBQWUsR0FBZixlQUFlLENBQWdCO1FBQy9CLGdCQUFXLEdBQVgsV0FBVyxDQUFZO1FBQ3ZCLFVBQUssR0FBTCxLQUFLLENBQVE7UUE3T2pCLDBCQUFxQixHQUFHLEtBQUssQ0FBQztRQUM5QiwyQkFBc0IsR0FBRyxFQUFFLENBQUM7UUFDNUIseUJBQW9CLEdBQXdCLElBQUksR0FBRyxDQUFpQjtZQUN4RSxDQUFDLEVBQUUsRUFBRSx3QkFBd0IsQ0FBQztZQUM5QixDQUFDLEdBQUcsRUFBRSx5QkFBeUIsQ0FBQztZQUNoQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRyx3QkFBd0IsQ0FBQztTQUN2RCxDQUFDLENBQUM7UUFFSyxlQUFVLEdBQVksS0FBSyxDQUFDO1FBQzVCLGFBQVEsR0FBMEIsSUFBSSxLQUFLLEVBQWtCLENBQUM7UUFDOUQsaUJBQVksR0FBMEIsSUFBSSxLQUFLLEVBQWtCLENBQUM7UUFHMUU7Ozs7V0FJRztRQUNhLHVCQUFrQixHQUF3QixrQkFBa0IsQ0FBQyxlQUFlLENBQUM7UUFVN0Y7Ozs7V0FJRztRQUNjLHlCQUFvQixHQUF5QixvQkFBb0IsQ0FBQyxTQUFTLENBQUM7UUF5QzdGOzs7O1dBSUc7UUFDYSxxQkFBZ0IsR0FBWSxLQUFLLENBQUM7UUFFbEQ7Ozs7V0FJRztRQUNhLGFBQVEsR0FBVyxHQUFHLENBQUM7UUFVdkM7Ozs7V0FJRztRQUNhLGdCQUFXLEdBQVcsSUFBSSxDQUFDO1FBK0QzQzs7OztXQUlHO1FBQ2EsV0FBTSxHQUFXLENBQUMsQ0FBQztRQUVuQzs7Ozs7V0FLRztRQUNhLGdCQUFXLEdBQVksSUFBSSxDQUFDO1FBRzVDLEdBQUc7UUFDSCxhQUFhO1FBQ2IsR0FBRztRQUVIOzs7O1dBSUc7UUFDYyx5QkFBb0IsR0FBa0MsSUFBSSxZQUFZLEVBQW1CLENBQUM7UUFFM0c7Ozs7V0FJRztRQUNjLGdCQUFXLEdBQStCLElBQUksWUFBWSxFQUFnQixDQUFDO1FBRTVGOzs7O1dBSUc7UUFDYyxZQUFPLEdBQStCLElBQUksWUFBWSxFQUFnQixDQUFDO1FBbUNwRixJQUFJLENBQUMsR0FBRyxHQUFHLE9BQU8sRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUE1TUQ7Ozs7O09BS0c7SUFDSCxJQUNlLG9CQUFvQixLQUF3RCxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7SUFDM0gsSUFBVyxvQkFBb0IsQ0FBQyxHQUFxRDtRQUNqRixJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtZQUM1QixNQUFLLENBQ0QsSUFBSSxLQUFLLENBQUM7dURBQ3lCLENBQUMsQ0FDdkMsQ0FBQztTQUNMO1FBQ0QsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEdBQUcsQ0FBQztJQUNyQyxDQUFDO0lBRUw7Ozs7O09BS0c7SUFDSCxJQUNlLHFCQUFxQixLQUFjLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztJQUNuRixJQUFXLHFCQUFxQixDQUFDLEdBQVcsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUV4Rjs7Ozs7O09BTUc7SUFDSCxJQUNlLG1CQUFtQixLQUEyQixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDNUYsSUFBVyxtQkFBbUIsQ0FBQyxHQUF3QixJQUFJLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBK0JqRzs7OztPQUlHO0lBQ0gsSUFDZSxhQUFhLEtBQTRCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDM0UsSUFBVyxhQUFhLENBQUMsR0FBMEI7UUFDL0MsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7U0FDOUI7YUFDSTtZQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNoQztJQUNMLENBQUM7SUFFTDs7OztPQUlHO0lBQ0gsSUFDZSxNQUFNLEtBQThCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDckUsSUFBVyxNQUFNLENBQUMsR0FBNEIsSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFM0U7Ozs7O09BS0c7SUFDSCxJQUNlLDZCQUE2QixLQUFjLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDL0UsSUFBVyw2QkFBNkIsQ0FBQyxHQUFZLElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRXJGOzs7OztPQUtHO0lBQ0gsSUFDZSxxQkFBcUIsS0FBYyxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7SUFDbEYsSUFBVyxxQkFBcUIsQ0FBQyxHQUFZO1FBQ3pDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxHQUFHLENBQUM7UUFDakMsSUFBSSxHQUFHLEVBQUU7WUFDTCxJQUFJLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxDQUFnQixFQUFFLElBQXFCLEVBQUUsRUFBRTtnQkFDckUsT0FBTyxxQkFBcUIsQ0FBQyx1QkFBdUIsQ0FDaEQsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2hGLENBQUMsQ0FBQztTQUNMO0lBQ0wsQ0FBQztJQW1ETCxHQUFHO0lBQ0gseUJBQXlCO0lBQ3pCLEdBQUc7SUFFSDs7Ozs7T0FLRztJQUNILElBQVcsRUFBRSxLQUFhLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUF5QjVDLEdBQUc7SUFDSCxrQkFBa0I7SUFDbEIsR0FBRztJQUVIOzs7Ozs7O09BT0c7SUFDSSxlQUFlLENBQUMsR0FBYTtRQUNoQyxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksa0JBQWtCO1FBQ3JCLE1BQU0sWUFBWSxHQUFrQjtZQUNoQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUc7U0FDZixDQUFDO1FBQ0YsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7WUFDOUIsTUFBTSxrQkFBa0IsR0FBUTtnQkFDNUIsRUFBRSxFQUFHLElBQUksQ0FBQyxHQUFHO2dCQUNiLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTzthQUN4QixDQUFDO1lBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUMzRSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7YUFDdEM7aUJBQ0k7Z0JBQ0Qsa0JBQWtCLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7Z0JBQ2xELGtCQUFrQixDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUN4QyxrQkFBa0IsQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7Z0JBQzdELGtCQUFrQixDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztnQkFDcEUsa0JBQWtCLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQzVDLGtCQUFrQixDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztnQkFDaEUsa0JBQWtCLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7Z0JBQ25ELGtCQUFrQixDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztnQkFDcEUsa0JBQWtCLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDO2dCQUN0RSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQzdFLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQzthQUN4QztZQUNELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN4QixDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO29CQUNwQixJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO2lCQUM1RDtZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxXQUFXO1FBQ2QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDeEIsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksV0FBVyxDQUFDLE9BQXdDO1FBQ3ZELElBQUksZ0JBQWdCLEdBQVksS0FBSyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxHQUFvQjtZQUN2QixFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUc7U0FDZixDQUFDO1FBQ0YsSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQzlCLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN6QixDQUFDLENBQUMsQ0FBQztTQUNOO1FBQ0QsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxFQUFFO1lBQ3ZELElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO2dCQUM5QixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDN0QsQ0FBQyxDQUFDLENBQUM7U0FDTjtRQUNELElBQUksT0FBTyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxXQUFXLEVBQUU7WUFDekUsSUFBSSxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNuQyxDQUFDLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO2dCQUM1QyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7YUFDM0I7aUJBQ0k7Z0JBQ0QsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLHNFQUFzRSxDQUFDLENBQUMsQ0FBQzthQUM3RjtTQUNKO1FBQ0QsSUFBSSxPQUFPLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLFdBQVcsSUFBSSxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ3RILENBQUMsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO1lBQzVDLGdCQUFnQixHQUFHLElBQUksQ0FBQztTQUMzQjtRQUNELElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFdBQVcsSUFBSSxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQzlGLENBQUMsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUMzQixnQkFBZ0IsR0FBRyxJQUFJLENBQUM7U0FDM0I7UUFDRCxJQUFJLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsV0FBVyxJQUFJLGdCQUFnQixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDbEgsQ0FBQyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsa0JBQWtCLEtBQUssa0JBQWtCLENBQUMsZUFBZSxDQUFDO1lBQy9FLGdCQUFnQixHQUFHLElBQUksQ0FBQztTQUMzQjtRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxDQUFDO1lBQ3JELENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFdBQVcsQ0FBQztZQUMvRCxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFDM0Q7WUFDRSxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsMkVBQTJFLENBQUMsQ0FBQyxDQUFDO1NBQ2xHO1FBRUQsSUFBSSxnQkFBZ0IsRUFBRTtZQUNsQixJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtnQkFDOUIsTUFBTSxrQkFBa0IsR0FBUSxFQUFDLEVBQUUsRUFBRyxJQUFJLENBQUMsR0FBRyxFQUFDLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xELENBQUMsQ0FBQyxDQUFDO1NBQ047SUFDTCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLFFBQVEsS0FBYSxPQUFPLGlCQUFpQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRTdFLEdBQUc7SUFDSCxtQkFBbUI7SUFDbkIsR0FBRztJQUVIOzs7Ozs7T0FNRztJQUNLLGlCQUFpQixDQUFDLENBQVM7UUFDL0IsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO1lBQ3hELE1BQU0sRUFBRSxDQUFDO1lBQ1QsS0FBSyxFQUFFLENBQUM7WUFDUixRQUFRLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7WUFDeEQsTUFBTSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1NBQ3BELENBQUMsQ0FBQyxDQUFDO1FBQ1IsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ3RELE1BQU0sRUFBRSxDQUFDO1lBQ1QsS0FBSyxFQUFFLENBQUM7WUFDUixRQUFRLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7WUFDeEQsTUFBTSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1NBQ3BELENBQUMsQ0FBQyxDQUFDO0lBQ1osQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNLLGFBQWE7UUFDakIsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksRUFBRTtZQUFFLE9BQU87U0FBRTtRQUMzQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUN4QixNQUFNLE9BQU8sR0FBMEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFFckcsdUNBQXVDO1lBQ3ZDLE1BQU0sRUFBRSxHQUEyQixJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXZGLDRDQUE0QztZQUM1QyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNSLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ2QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNwQyxDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFELENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDOzs7WUFyYkosU0FBUyxTQUFDO2dCQUNQLFFBQVEsRUFBRSxvQkFBb0I7YUFDakM7OztZQTFDUSxhQUFhO1lBQ2IsWUFBWTtZQUNaLGNBQWM7WUFDZCxVQUFVO1lBYmlELE1BQU07OztpQ0FnRnJFLEtBQUs7OEJBUUwsS0FBSzttQ0FPTCxLQUFLO21DQVFMLEtBQUs7b0NBa0JMLEtBQUs7a0NBV0wsS0FBSzsrQkFTTCxLQUFLO3VCQU9MLEtBQUs7dUJBUUwsS0FBSzswQkFPTCxLQUFLOzRCQU9MLEtBQUs7cUJBaUJMLEtBQUs7NENBVUwsS0FBSztvQ0FVTCxLQUFLO3NCQWlCTCxLQUFLO3FCQU9MLEtBQUs7MEJBUUwsS0FBSzttQ0FZTCxNQUFNOzBCQU9OLE1BQU07c0JBT04sTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgRGlyZWN0aXZlLCBTaW1wbGVDaGFuZ2UsIElucHV0LCBPdXRwdXQsIE9uRGVzdHJveSwgT25DaGFuZ2VzLFxuICAgIEV2ZW50RW1pdHRlciwgQ29udGVudENoaWxkLCBBZnRlckNvbnRlbnRJbml0LCBWaWV3Q29udGFpbmVyUmVmLCBOZ1pvbmVcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBJUG9pbnQgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lwb2ludCc7XG5pbXBvcnQgeyBJTGF0TG9uZyB9IGZyb20gJy4uL2ludGVyZmFjZXMvaWxhdGxvbmcnO1xuaW1wb3J0IHsgSU1hcmtlckV2ZW50IH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbWFya2VyLWV2ZW50JztcbmltcG9ydCB7IElNYXJrZXJPcHRpb25zIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbWFya2VyLW9wdGlvbnMnO1xuaW1wb3J0IHsgSUxheWVyT3B0aW9ucyB9IGZyb20gJy4uL2ludGVyZmFjZXMvaWxheWVyLW9wdGlvbnMnO1xuaW1wb3J0IHsgSU1hcmtlckljb25JbmZvIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbWFya2VyLWljb24taW5mbyc7XG5pbXBvcnQgeyBJQ2x1c3Rlckljb25JbmZvIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pY2x1c3Rlci1pY29uLWluZm8nO1xuaW1wb3J0IHsgSUNsdXN0ZXJPcHRpb25zIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pY2x1c3Rlci1vcHRpb25zJztcbmltcG9ydCB7IE1hcmtlclNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9tYXJrZXIuc2VydmljZSc7XG5pbXBvcnQgeyBMYXllclNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9sYXllci5zZXJ2aWNlJztcbmltcG9ydCB7IENsdXN0ZXJTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvY2x1c3Rlci5zZXJ2aWNlJztcbmltcG9ydCB7IE1hcFNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBMYXllciB9IGZyb20gJy4uL21vZGVscy9sYXllcic7XG5pbXBvcnQgeyBNYXJrZXIgfSBmcm9tICcuLi9tb2RlbHMvbWFya2VyJztcbmltcG9ydCB7IENsdXN0ZXJDbGlja0FjdGlvbiB9IGZyb20gJy4uL21vZGVscy9jbHVzdGVyLWNsaWNrLWFjdGlvbic7XG5pbXBvcnQgeyBDbHVzdGVyUGxhY2VtZW50TW9kZSB9IGZyb20gJy4uL21vZGVscy9jbHVzdGVyLXBsYWNlbWVudC1tb2RlJztcbmltcG9ydCB7IENsdXN0ZXJMYXllckRpcmVjdGl2ZSB9IGZyb20gJy4vY2x1c3Rlci1sYXllcic7XG5cbi8qKlxuICogaW50ZXJuYWwgY291bnRlciB0byB1c2UgYXMgaWRzIGZvciBtYXJrZXIuXG4gKi9cbmxldCBsYXllcklkID0gMTAwMDAwMDtcblxuLyoqXG4gKiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZSBwZXJmb3JtYW50bHkgcmVuZGVycyBhIGxhcmdlIHNldCBvZiBtYXAgbWFya2VyIGluc2lkZSBhIHtAbGluayBNYXBDb21wb25lbnR9LlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQge01hcENvbXBvbmVudCwgTWFwTWFya2VyRGlyZWN0aXZlfSBmcm9tICcuLi4nO1xuICpcbiAqIEBDb21wb25lbnQoe1xuICogIHNlbGVjdG9yOiAnbXktbWFwLWNtcCcsXG4gKiAgc3R5bGVzOiBbYFxuICogICAubWFwLWNvbnRhaW5lciB7XG4gKiAgICAgaGVpZ2h0OiAzMDBweDtcbiAqICAgfVxuICogYF0sXG4gKiB0ZW1wbGF0ZTogYFxuICogICA8eC1tYXAgW0xhdGl0dWRlXT1cImxhdFwiIFtMb25naXR1ZGVdPVwibG5nXCIgW1pvb21dPVwiem9vbVwiPlxuICogICAgICA8eC1tYXAtbWFya2VyLWxheWVyIFtNYXJrZXJPcHRpb25zXT1cIl9tYXJrZXJzXCI+PC94LW1hcC1tYXJrZXItbGF5ZXI+XG4gKiAgIDwveC1tYXA+XG4gKiBgXG4gKiB9KVxuICogYGBgXG4gKlxuICogQGV4cG9ydFxuICovXG5ARGlyZWN0aXZlKHtcbiAgICBzZWxlY3RvcjogJ3gtbWFwLW1hcmtlci1sYXllcidcbn0pXG5leHBvcnQgY2xhc3MgTWFwTWFya2VyTGF5ZXJEaXJlY3RpdmUgaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uQ2hhbmdlcywgQWZ0ZXJDb250ZW50SW5pdCB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfaWQ6IG51bWJlcjtcbiAgICBwcml2YXRlIF9sYXllclByb21pc2U6IFByb21pc2U8TGF5ZXI+O1xuICAgIHByaXZhdGUgX3NlcnZpY2U6IExheWVyU2VydmljZTtcbiAgICBwcml2YXRlIF9zdHlsZXM6IEFycmF5PElDbHVzdGVySWNvbkluZm8+O1xuICAgIHByaXZhdGUgX3VzZUR5bmFtaWNTaXplTWFya2VyID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfZHluYW1pY01hcmtlckJhc2VTaXplID0gMTg7XG4gICAgcHJpdmF0ZSBfZHluYW1pY01hcmtlclJhbmdlczogTWFwPG51bWJlciwgc3RyaW5nPiA9IG5ldyBNYXA8bnVtYmVyLCBzdHJpbmc+KFtcbiAgICAgICAgWzEwLCAncmdiYSgyMCwgMTgwLCAyMCwgMC41KSddLFxuICAgICAgICBbMTAwLCAncmdiYSgyNTUsIDIxMCwgNDAsIDAuNSknXSxcbiAgICAgICAgW051bWJlci5NQVhfU0FGRV9JTlRFR0VSICwgJ3JnYmEoMjU1LCA0MCwgNDAsIDAuNSknXVxuICAgIF0pO1xuICAgIHByaXZhdGUgX2ljb25DcmVhdGlvbkNhbGxiYWNrOiAobTogQXJyYXk8TWFya2VyPiwgaTogSU1hcmtlckljb25JbmZvKSA9PiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfc3RyZWFtaW5nOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfbWFya2VyczogQXJyYXk8SU1hcmtlck9wdGlvbnM+ID0gbmV3IEFycmF5PElNYXJrZXJPcHRpb25zPigpO1xuICAgIHByaXZhdGUgX21hcmtlcnNMYXN0OiBBcnJheTxJTWFya2VyT3B0aW9ucz4gPSBuZXcgQXJyYXk8SU1hcmtlck9wdGlvbnM+KCk7XG5cblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgdGhlIENsdXN0ZXIgQ2xpY2sgQWN0aW9uIHtAbGluayBDbHVzdGVyQ2xpY2tBY3Rpb259LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcE1hcmtlckxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIENsdXN0ZXJDbGlja0FjdGlvbjogQ2x1c3RlckNsaWNrQWN0aW9uID0gIENsdXN0ZXJDbGlja0FjdGlvbi5ab29tSW50b0NsdXN0ZXI7XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIEljb25JbmZvIHRvIGJlIHVzZWQgdG8gY3JlYXRlIGEgY3VzdG9tIGNsdXN0ZXIgbWFya2VyLiBTdXBwb3J0cyBmb250LWJhc2VkLCBTVkcsIGdyYXBoaWNzIGFuZCBtb3JlLlxuICAgICAqIFNlZSB7QGxpbmsgSU1hcmtlckljb25JbmZvfS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBDbHVzdGVySWNvbkluZm86IElNYXJrZXJJY29uSW5mbztcblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgY2x1c3RlciBwbGFjZW1lbnQgbW9kZS4ge0BsaW5rIENsdXN0ZXJQbGFjZW1lbnRNb2RlfVxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcE1hcmtlckxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgIHB1YmxpYyBDbHVzdGVyUGxhY2VtZW50TW9kZTogQ2x1c3RlclBsYWNlbWVudE1vZGUgPSBDbHVzdGVyUGxhY2VtZW50TW9kZS5NZWFuVmFsdWU7XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIGNhbGxiYWNrIGludm9rZWQgdG8gY3JlYXRlIGEgY3VzdG9tIGNsdXN0ZXIgbWFya2VyLiBOb3RlIHRoYXQgd2hlbiB7QGxpbmsgVXNlRHluYW1pY1NpemVNYXJrZXJzfSBpcyBlbmFibGVkLFxuICAgICAqIHlvdSBjYW5ub3Qgc2V0IGEgY3VzdG9tIG1hcmtlciBjYWxsYmFjay5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgICAgIHB1YmxpYyBnZXQgQ3VzdG9tTWFya2VyQ2FsbGJhY2soKTogKG06IEFycmF5PE1hcmtlcj4sIGk6IElNYXJrZXJJY29uSW5mbykgPT4gc3RyaW5nICB7IHJldHVybiB0aGlzLl9pY29uQ3JlYXRpb25DYWxsYmFjazsgfVxuICAgICAgICBwdWJsaWMgc2V0IEN1c3RvbU1hcmtlckNhbGxiYWNrKHZhbDogKG06IEFycmF5PE1hcmtlcj4sIGk6IElNYXJrZXJJY29uSW5mbykgPT4gc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdXNlRHluYW1pY1NpemVNYXJrZXIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyhcbiAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKGBZb3UgY2Fubm90IHNldCBhIGN1c3RvbSBtYXJrZXIgY2FsbGJhY2sgd2hlbiBVc2VEeW5hbWljU2l6ZU1hcmtlcnMgaXMgc2V0IHRvIHRydWUuXG4gICAgICAgICAgICAgICAgICAgIFNldCBVc2VEeW5hbWljU2l6ZU1ha2VycyB0byBmYWxzZS5gKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9pY29uQ3JlYXRpb25DYWxsYmFjayA9IHZhbDtcbiAgICAgICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSBiYXNlIHNpemUgb2YgZHluYW1pYyBtYXJrZXJzIGluIHBpeGVscy4gVGhlIGFjdHVhbHkgc2l6ZSBvZiB0aGUgZHluYW1pYyBtYXJrZXIgaXMgYmFzZWQgb24gdGhpcy5cbiAgICAgKiBTZWUge0BsaW5rIFVzZUR5bmFtaWNTaXplTWFya2Vyc30uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ2x1c3RlckxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KClcbiAgICAgICAgcHVibGljIGdldCBEeW5hbWljTWFya2VyQmFzZVNpemUoKTogbnVtYmVyICB7IHJldHVybiB0aGlzLl9keW5hbWljTWFya2VyQmFzZVNpemU7IH1cbiAgICAgICAgcHVibGljIHNldCBEeW5hbWljTWFya2VyQmFzZVNpemUodmFsOiBudW1iZXIpIHsgdGhpcy5fZHluYW1pY01hcmtlckJhc2VTaXplID0gdmFsOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIHJhbmdlcyB0byB1c2UgdG8gY2FsY3VsYXRlIGJyZWFrcG9pbnRzIGFuZCBjb2xvcnMgZm9yIGR5bmFtaWMgbWFya2Vycy5cbiAgICAgKiBUaGUgbWFwIGNvbnRhaW5zIGtleS92YWx1ZSBwYWlycywgd2l0aCB0aGUga2V5cyBiZWluZ1xuICAgICAqIHRoZSBicmVha3BvaW50IHNpemVzIGFuZCB0aGUgdmFsdWVzIHRoZSBjb2xvcnMgdG8gYmUgdXNlZCBmb3IgdGhlIGR5bmFtaWMgbWFya2VyIGluIHRoYXQgcmFuZ2UuIFNlZSB7QGxpbmsgVXNlRHluYW1pY1NpemVNYXJrZXJzfS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgICAgICBwdWJsaWMgZ2V0IER5bmFtaWNNYXJrZXJSYW5nZXMoKTogTWFwPG51bWJlciwgc3RyaW5nPiAgeyByZXR1cm4gdGhpcy5fZHluYW1pY01hcmtlclJhbmdlczsgfVxuICAgICAgICBwdWJsaWMgc2V0IER5bmFtaWNNYXJrZXJSYW5nZXModmFsOiBNYXA8bnVtYmVyLCBzdHJpbmc+KSB7IHRoaXMuX2R5bmFtaWNNYXJrZXJSYW5nZXMgPSB2YWw7IH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgd2hldGhlciB0aGUgbGF5ZXIgY2x1c3RlcnMuIFRoaXMgcHJvcGVydHkgY2FuIG9ubHkgYmUgc2V0IG9uIGNyZWF0aW9uIG9mIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBFbmFibGVDbHVzdGVyaW5nOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIGdyaWQgc2l6ZSB0byBiZSB1c2VkIGZvciBjbHVzdGVyaW5nLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcE1hcmtlckxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIEdyaWRTaXplOiBudW1iZXIgPSAxNTA7XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIEljb25JbmZvIHRvIGJlIHVzZWQgdG8gY3JlYXRlIGEgY3VzdG9tIG1hcmtlciBpbWFnZXMuIFN1cHBvcnRzIGZvbnQtYmFzZWQsIFNWRywgZ3JhcGhpY3MgYW5kIG1vcmUuXG4gICAgICogU2VlIHtAbGluayBJTWFya2VySWNvbkluZm99LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcE1hcmtlckxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIEljb25JbmZvOiBJTWFya2VySWNvbkluZm87XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgQW4gb2Zmc2V0IGFwcGxpZWQgdG8gdGhlIHBvc2l0aW9uaW5nIG9mIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBMYXllck9mZnNldDogSVBvaW50ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqICBJTWFya2VyT3B0aW9ucyBhcnJheSBob2xkaW5nIHRoZSBtYXJrZXIgaW5mby5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgICAgIHB1YmxpYyBnZXQgTWFya2VyT3B0aW9ucygpOiBBcnJheTxJTWFya2VyT3B0aW9ucz4geyByZXR1cm4gdGhpcy5fbWFya2VyczsgfVxuICAgICAgICBwdWJsaWMgc2V0IE1hcmtlck9wdGlvbnModmFsOiBBcnJheTxJTWFya2VyT3B0aW9ucz4pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zdHJlYW1pbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXJrZXJzTGFzdC5wdXNoKC4uLnZhbC5zbGljZSgwKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFya2Vycy5wdXNoKC4uLnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXJrZXJzID0gdmFsLnNsaWNlKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIGNsdXN0ZXIgc3R5bGVzXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTWFya2VyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgICAgICBwdWJsaWMgZ2V0IFN0eWxlcygpOiBBcnJheTxJQ2x1c3Rlckljb25JbmZvPiB7IHJldHVybiB0aGlzLl9zdHlsZXM7IH1cbiAgICAgICAgcHVibGljIHNldCBTdHlsZXModmFsOiBBcnJheTxJQ2x1c3Rlckljb25JbmZvPikgeyB0aGlzLl9zdHlsZXMgPSB2YWw7IH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgd2hldGhlciB0byB0cmVhdCBjaGFuZ2VzIGluIHRoZSBNYXJrZXJPcHRpb25zIGFzIHN0cmVhbXMgb2YgbmV3IG1hcmtlcnMuIEluIHRoc2kgbW9kZSwgY2hhbmdpbmcgdGhlXG4gICAgICogQXJyYXkgc3VwcGxpZWQgaW4gTWFya2VyT3B0aW9ucyB3aWxsIGJlIGluY3JlbWVudGFsbHkgZHJhd24gb24gdGhlIG1hcCBhcyBvcHBvc2VkIHRvIHJlcGxhY2UgdGhlIG1hcmtlcnMgb24gdGhlIG1hcC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgICAgIHB1YmxpYyBnZXQgVHJlYXROZXdNYXJrZXJPcHRpb25zQXNTdHJlYW0oKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9zdHJlYW1pbmc7IH1cbiAgICAgICAgcHVibGljIHNldCBUcmVhdE5ld01hcmtlck9wdGlvbnNBc1N0cmVhbSh2YWw6IGJvb2xlYW4pIHsgdGhpcy5fc3RyZWFtaW5nID0gdmFsOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciB0byB1c2UgZHluYW1pYyBtYXJrZXJzLiBEeW5hbWljIG1hcmtlcnMgY2hhbmdlIGluIHNpemUgYW5kIGNvbG9yIGRlcGVuZGluZyBvbiB0aGUgbnVtYmVyIG9mXG4gICAgICogcGlucyBpbiB0aGUgY2x1c3Rlci4gSWYgc2V0IHRvIHRydWUsIHRoaXMgd2lsbCB0YWtlIHByZWNlbmRlbmNlIG92ZXIgYW55IGN1c3RvbSBtYXJrZXIgY3JlYXRpb24uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTWFya2VyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgICAgICBwdWJsaWMgZ2V0IFVzZUR5bmFtaWNTaXplTWFya2VycygpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX3VzZUR5bmFtaWNTaXplTWFya2VyOyB9XG4gICAgICAgIHB1YmxpYyBzZXQgVXNlRHluYW1pY1NpemVNYXJrZXJzKHZhbDogYm9vbGVhbikge1xuICAgICAgICAgICAgdGhpcy5fdXNlRHluYW1pY1NpemVNYXJrZXIgPSB2YWw7XG4gICAgICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faWNvbkNyZWF0aW9uQ2FsbGJhY2sgPSAobTogQXJyYXk8TWFya2VyPiwgaW5mbzogSU1hcmtlckljb25JbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmUuQ3JlYXRlRHluYW1pY1NpemVNYXJrZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBtLmxlbmd0aCwgaW5mbywgdGhpcy5fZHluYW1pY01hcmtlckJhc2VTaXplLCB0aGlzLl9keW5hbWljTWFya2VyUmFuZ2VzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBtYXJrZXIgbGF5ZXJcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBWaXNpYmxlOiBib29sZWFuO1xuXG4gICAgLyoqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSB6LWluZGV4IG9mIHRoZSBsYXllci4gSWYgbm90IHVzZWQsIGxheWVycyBnZXQgc3RhY2tlZCBpbiB0aGUgb3JkZXIgY3JlYXRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBaSW5kZXg6IG51bWJlciA9IDA7XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciB0aGUgY2x1c3RlciBzaG91bGQgem9vbSBpbiBvbiBjbGlja1xuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIE1hcE1hcmtlckxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFpvb21PbkNsaWNrOiBib29sZWFuID0gdHJ1ZTtcblxuXG4gICAgLy8vXG4gICAgLy8vIERlbGVnYXRlc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBlbWl0dGVyIGdldHMgZW1pdHRlZCB3aGVuIHRoZSBkeW5hbWljIGljb24gZm9yIGEgbWFya2VyIGlzIGJlaW5nIGNyZWF0ZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTWFya2VyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgcHVibGljIER5bmFtaWNNYXJrZXJDcmVhdGVkOiBFdmVudEVtaXR0ZXI8SU1hcmtlckljb25JbmZvPiA9IG5ldyBFdmVudEVtaXR0ZXI8SU1hcmtlckljb25JbmZvPigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBlbWl0dGVyIGdldHMgZW1pdHRlZCB3aGVuIHRoZSB1c2VyIGNsaWNrcyBhIG1hcmtlciBpbiB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTWFya2VyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgcHVibGljIE1hcmtlckNsaWNrOiBFdmVudEVtaXR0ZXI8SU1hcmtlckV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SU1hcmtlckV2ZW50PigpO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBldmVudCBpcyBmaXJlZCB3aGVuIHRoZSB1c2VyIHN0b3BzIGRyYWdnaW5nIGEgbWFya2VyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcE1hcmtlckxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQE91dHB1dCgpIHB1YmxpYyBEcmFnRW5kOiBFdmVudEVtaXR0ZXI8SU1hcmtlckV2ZW50PiA9IG5ldyBFdmVudEVtaXR0ZXI8SU1hcmtlckV2ZW50PigpO1xuXG5cbiAgICAvLy9cbiAgICAvLy8gUHJvcGVydHkgZGVjbGFyYXRpb25zXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBpZCBvZiB0aGUgbWFya2VyIGxheWVyLlxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIE1hcE1hcmtlckxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgcHVibGljIGdldCBJZCgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5faWQ7IH1cblxuICAgIC8vL1xuICAgIC8vLyBDb25zdHJ1Y3RvclxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZS5cbiAgICAgKiBAcGFyYW0gX21hcmtlclNlcnZpY2UgLSBDb25jcmVhdGUgaW1wbGVtZW50YXRpb24gb2YgYSB7QGxpbmsgTWFya2VyU2VydmljZX0uXG4gICAgICogQHBhcmFtIF9sYXllclNlcnZpY2UgLSBDb25jcmVhdGUgaW1wbGVtZW50YXRpb24gb2YgYSB7QGxpbmsgTGF5ZXJTZXJ2aWNlfS5cbiAgICAgKiBAcGFyYW0gX2NsdXN0ZXJTZXJ2aWNlIC0gQ29uY3JlYXRlIGltcGxlbWVudGF0aW9uIG9mIGEge0BsaW5rIENsdXN0ZXJTZXJ2aWNlfS5cbiAgICAgKiBAcGFyYW0gX21hcFNlcnZpY2UgLSBDb25jcmVhdGUgaW1wbGVtZW50YXRpb24gb2YgYSB7QGxpbmsgTWFwU2VydmljZX0uXG4gICAgICogQHBhcmFtIF96b25lIC0gQ29uY3JlYXRlIGltcGxlbWVudGF0aW9uIG9mIGEge0BsaW5rIE5nWm9uZX0gc2VydmljZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIF9tYXJrZXJTZXJ2aWNlOiBNYXJrZXJTZXJ2aWNlLFxuICAgICAgICBwcml2YXRlIF9sYXllclNlcnZpY2U6IExheWVyU2VydmljZSxcbiAgICAgICAgcHJpdmF0ZSBfY2x1c3RlclNlcnZpY2U6IENsdXN0ZXJTZXJ2aWNlLFxuICAgICAgICBwcml2YXRlIF9tYXBTZXJ2aWNlOiBNYXBTZXJ2aWNlLFxuICAgICAgICBwcml2YXRlIF96b25lOiBOZ1pvbmUpIHtcbiAgICAgICAgdGhpcy5faWQgPSBsYXllcklkKys7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBUcmFuc2xhdGVzIGEgZ2VvIGxvY2F0aW9uIHRvIGEgcGl4ZWwgbG9jYXRpb24gcmVsYXRpdmUgdG8gdGhlIG1hcCB2aWV3cG9ydC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBbbG9jXSAtIHtAbGluayBJTGF0TG9uZ30gY29udGFpbmluZyB0aGUgZ2VvIGNvb3JkaW5hdGVzLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiBmdWxsZmlsbGVkIGNvbnRhaW5zIGFuIHtAbGluayBJUG9pbnR9IHJlcHJlc2VudGluZyB0aGUgcGl4ZWwgY29vcmRpbmF0ZXMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTWFya2VyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgTG9jYXRpb25Ub1BpeGVsKGxvYzogSUxhdExvbmcpOiBQcm9taXNlPElQb2ludD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fbWFya2VyU2VydmljZS5Mb2NhdGlvblRvUG9pbnQobG9jKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgYWZ0ZXIgQ29tcG9uZW50IGNvbnRlbnQgaW5pdGlhbGl6YXRpb24uIFBhcnQgb2YgbmcgQ29tcG9uZW50IGxpZmUgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTWFya2VyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgICAgICBjb25zdCBsYXllck9wdGlvbnM6IElMYXllck9wdGlvbnMgPSB7XG4gICAgICAgICAgICBpZDogdGhpcy5faWRcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmYWtlTGF5ZXJEaXJlY3RpdmU6IGFueSA9IHtcbiAgICAgICAgICAgICAgICBJZCA6IHRoaXMuX2lkLFxuICAgICAgICAgICAgICAgIFZpc2libGU6IHRoaXMuVmlzaWJsZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICghdGhpcy5FbmFibGVDbHVzdGVyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGF5ZXJTZXJ2aWNlLkFkZExheWVyKGZha2VMYXllckRpcmVjdGl2ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGF5ZXJQcm9taXNlID0gdGhpcy5fbGF5ZXJTZXJ2aWNlLkdldE5hdGl2ZUxheWVyKGZha2VMYXllckRpcmVjdGl2ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VydmljZSA9IHRoaXMuX2xheWVyU2VydmljZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZha2VMYXllckRpcmVjdGl2ZS5MYXllck9mZnNldCA9IHRoaXMuTGF5ZXJPZmZzZXQ7XG4gICAgICAgICAgICAgICAgZmFrZUxheWVyRGlyZWN0aXZlLlpJbmRleCA9IHRoaXMuWkluZGV4O1xuICAgICAgICAgICAgICAgIGZha2VMYXllckRpcmVjdGl2ZS5DbHVzdGVyaW5nRW5hYmxlZCA9IHRoaXMuRW5hYmxlQ2x1c3RlcmluZztcbiAgICAgICAgICAgICAgICBmYWtlTGF5ZXJEaXJlY3RpdmUuQ2x1c3RlclBsYWNlbWVudE1vZGUgPSB0aGlzLkNsdXN0ZXJQbGFjZW1lbnRNb2RlO1xuICAgICAgICAgICAgICAgIGZha2VMYXllckRpcmVjdGl2ZS5HcmlkU2l6ZSA9IHRoaXMuR3JpZFNpemU7XG4gICAgICAgICAgICAgICAgZmFrZUxheWVyRGlyZWN0aXZlLkNsdXN0ZXJDbGlja0FjdGlvbiA9IHRoaXMuQ2x1c3RlckNsaWNrQWN0aW9uO1xuICAgICAgICAgICAgICAgIGZha2VMYXllckRpcmVjdGl2ZS5JY29uSW5mbyA9IHRoaXMuQ2x1c3Rlckljb25JbmZvO1xuICAgICAgICAgICAgICAgIGZha2VMYXllckRpcmVjdGl2ZS5DdXN0b21NYXJrZXJDYWxsYmFjayA9IHRoaXMuQ3VzdG9tTWFya2VyQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgZmFrZUxheWVyRGlyZWN0aXZlLlVzZUR5bmFtaWNTaXplTWFya2VycyA9IHRoaXMuVXNlRHluYW1pY1NpemVNYXJrZXJzO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NsdXN0ZXJTZXJ2aWNlLkFkZExheWVyKGZha2VMYXllckRpcmVjdGl2ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGF5ZXJQcm9taXNlID0gdGhpcy5fY2x1c3RlclNlcnZpY2UuR2V0TmF0aXZlTGF5ZXIoZmFrZUxheWVyRGlyZWN0aXZlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXJ2aWNlID0gdGhpcy5fY2x1c3RlclNlcnZpY2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9sYXllclByb21pc2UudGhlbihsID0+IHtcbiAgICAgICAgICAgICAgICBsLlNldFZpc2libGUodGhpcy5WaXNpYmxlKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5NYXJrZXJPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdGhpcy5VcGRhdGVNYXJrZXJzKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgb24gY29tcG9uZW50IGRlc3RydWN0aW9uLiBGcmVlcyB0aGUgcmVzb3VyY2VzIHVzZWQgYnkgdGhlIGNvbXBvbmVudC4gUGFydCBvZiB0aGUgbmcgQ29tcG9uZW50IGxpZmUgY3ljbGUuXG4gICAgICpcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHB1YmxpYyBuZ09uRGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5fbGF5ZXJQcm9taXNlLnRoZW4obCA9PiB7XG4gICAgICAgICAgICBsLkRlbGV0ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWFjdHMgdG8gY2hhbmdlcyBpbiBkYXRhLWJvdW5kIHByb3BlcnRpZXMgb2YgdGhlIGNvbXBvbmVudCBhbmQgYWN0dWF0ZXMgcHJvcGVydHkgY2hhbmdlcyBpbiB0aGUgdW5kZXJsaW5nIGxheWVyIG1vZGVsLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYW5nZXMgLSBjb2xsZWN0aW9uIG9mIGNoYW5nZXMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTWFya2VyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogeyBba2V5OiBzdHJpbmddOiBTaW1wbGVDaGFuZ2UgfSkge1xuICAgICAgICBsZXQgc2hvdWxkU2V0T3B0aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICAgICAgICBjb25zdCBvOiBJQ2x1c3Rlck9wdGlvbnMgPSB7XG4gICAgICAgICAgICBpZDogdGhpcy5faWRcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGNoYW5nZXNbJ01hcmtlck9wdGlvbnMnXSkge1xuICAgICAgICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5VcGRhdGVNYXJrZXJzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlc1snVmlzaWJsZSddICYmICFjaGFuZ2VzWydWaXNpYmxlJ10uZmlyc3RDaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xheWVyUHJvbWlzZS50aGVuKGwgPT4gbC5TZXRWaXNpYmxlKHRoaXMuVmlzaWJsZSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ0VuYWJsZUNsdXN0ZXJpbmcnXSAmJiAhY2hhbmdlc1snRW5hYmxlQ2x1c3RlcmluZyddLmZpcnN0Q2hhbmdlKSB7XG4gICAgICAgICAgICBpZiAoJ1N0b3BDbHVzdGVyaW5nJyBpbiB0aGlzLl9zZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgby5jbHVzdGVyaW5nRW5hYmxlZCA9IHRoaXMuRW5hYmxlQ2x1c3RlcmluZztcbiAgICAgICAgICAgICAgICBzaG91bGRTZXRPcHRpb25zID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IChuZXcgRXJyb3IoJ1lvdSBjYW5ub3QgY2hhbmdlIEVuYWJsZUNsdXN0ZXJpbmcgYWZ0ZXIgdGhlIGxheWVyIGhhcyBiZWVuIGNyZWF0ZWQuJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydDbHVzdGVyUGxhY2VtZW50TW9kZSddICYmICFjaGFuZ2VzWydDbHVzdGVyUGxhY2VtZW50TW9kZSddLmZpcnN0Q2hhbmdlICYmICdTdG9wQ2x1c3RlcmluZycgaW4gdGhpcy5fc2VydmljZSkge1xuICAgICAgICAgICAgby5wbGFjZW1lbnRNb2RlID0gdGhpcy5DbHVzdGVyUGxhY2VtZW50TW9kZTtcbiAgICAgICAgICAgIHNob3VsZFNldE9wdGlvbnMgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydHcmlkU2l6ZSddICYmICFjaGFuZ2VzWydHcmlkU2l6ZSddLmZpcnN0Q2hhbmdlICYmICdTdG9wQ2x1c3RlcmluZycgaW4gdGhpcy5fc2VydmljZSkge1xuICAgICAgICAgICAgby5ncmlkU2l6ZSA9IHRoaXMuR3JpZFNpemU7XG4gICAgICAgICAgICBzaG91bGRTZXRPcHRpb25zID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlc1snQ2x1c3RlckNsaWNrQWN0aW9uJ10gJiYgIWNoYW5nZXNbJ0NsdXN0ZXJDbGlja0FjdGlvbiddLmZpcnN0Q2hhbmdlICYmICdTdG9wQ2x1c3RlcmluZycgaW4gdGhpcy5fc2VydmljZSkge1xuICAgICAgICAgICAgby56b29tT25DbGljayA9IHRoaXMuQ2x1c3RlckNsaWNrQWN0aW9uID09PSBDbHVzdGVyQ2xpY2tBY3Rpb24uWm9vbUludG9DbHVzdGVyO1xuICAgICAgICAgICAgc2hvdWxkU2V0T3B0aW9ucyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChjaGFuZ2VzWydaSW5kZXgnXSAmJiAhY2hhbmdlc1snWkluZGV4J10uZmlyc3RDaGFuZ2UpIHx8XG4gICAgICAgICAgICAoY2hhbmdlc1snTGF5ZXJPZmZzZXQnXSAmJiAhY2hhbmdlc1snTGF5ZXJPZmZzZXQnXS5maXJzdENoYW5nZSkgfHxcbiAgICAgICAgICAgIChjaGFuZ2VzWydJY29uSW5mbyddICYmICFjaGFuZ2VzWydJY29uSW5mbyddLmZpcnN0Q2hhbmdlKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHRocm93IChuZXcgRXJyb3IoJ1lvdSBjYW5ub3QgY2hhbmdlIFpJbmRleCBvciBMYXllck9mZnNldCBhZnRlciB0aGUgbGF5ZXIgaGFzIGJlZW4gY3JlYXRlZC4nKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2hvdWxkU2V0T3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFrZUxheWVyRGlyZWN0aXZlOiBhbnkgPSB7SWQgOiB0aGlzLl9pZH07XG4gICAgICAgICAgICAgICAgdGhpcy5fbGF5ZXJQcm9taXNlLnRoZW4obCA9PiBsLlNldE9wdGlvbnMobykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPYnRhaW5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBNYXJrZXIgSWQuXG4gICAgICogQHJldHVybnMgLSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hcmtlciBpZC5cbiAgICAgKiBAbWVtYmVyb2YgTWFwTWFya2VyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgdG9TdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuICdNYXBNYXJrZXJMYXllci0nICsgdGhpcy5faWQudG9TdHJpbmcoKTsgfVxuXG4gICAgLy8vXG4gICAgLy8vIFByaXZhdGUgbWV0aG9kc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQWRkcyB2YXJpb3VzIGV2ZW50IGxpc3RlbmVycyBmb3IgdGhlIG1hcmtlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtIC0gdGhlIG1hcmtlciBmb3Igd2hpY2ggdG8gYWRkIHRoZSBldmVudC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHByaXZhdGUgQWRkRXZlbnRMaXN0ZW5lcnMobTogTWFya2VyKTogdm9pZCB7XG4gICAgICAgIG0uQWRkTGlzdGVuZXIoJ2NsaWNrJywgKGU6IE1vdXNlRXZlbnQpID0+IHRoaXMuTWFya2VyQ2xpY2suZW1pdCh7XG4gICAgICAgICAgICAgICAgTWFya2VyOiBtLFxuICAgICAgICAgICAgICAgIENsaWNrOiBlLFxuICAgICAgICAgICAgICAgIExvY2F0aW9uOiB0aGlzLl9tYXJrZXJTZXJ2aWNlLkdldENvb3JkaW5hdGVzRnJvbUNsaWNrKGUpLFxuICAgICAgICAgICAgICAgIFBpeGVsczogdGhpcy5fbWFya2VyU2VydmljZS5HZXRQaXhlbHNGcm9tQ2xpY2soZSlcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgbS5BZGRMaXN0ZW5lcignZHJhZ2VuZCcsIChlOiBNb3VzZUV2ZW50KSA9PiB0aGlzLkRyYWdFbmQuZW1pdCh7XG4gICAgICAgICAgICAgICAgTWFya2VyOiBtLFxuICAgICAgICAgICAgICAgIENsaWNrOiBlLFxuICAgICAgICAgICAgICAgIExvY2F0aW9uOiB0aGlzLl9tYXJrZXJTZXJ2aWNlLkdldENvb3JkaW5hdGVzRnJvbUNsaWNrKGUpLFxuICAgICAgICAgICAgICAgIFBpeGVsczogdGhpcy5fbWFya2VyU2VydmljZS5HZXRQaXhlbHNGcm9tQ2xpY2soZSlcbiAgICAgICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIG9yIHVwZGF0ZXMgdGhlIG1hcmtlcnMgYmFzZWQgb24gdGhlIG1hcmtlciBvcHRpb25zLiBUaGlzIHdpbGwgcGxhY2UgdGhlIG1hcmtlcnMgb24gdGhlIG1hcFxuICAgICAqIGFuZCByZWdpc3RlciB0aGUgYXNzb2NpYXRlZCBldmVudHMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTWFya2VyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHJpdmF0ZSBVcGRhdGVNYXJrZXJzKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fbGF5ZXJQcm9taXNlID09IG51bGwpIHsgcmV0dXJuOyB9XG4gICAgICAgIHRoaXMuX2xheWVyUHJvbWlzZS50aGVuKGwgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWFya2VyczogQXJyYXk8SU1hcmtlck9wdGlvbnM+ID0gdGhpcy5fc3RyZWFtaW5nID8gdGhpcy5fbWFya2Vyc0xhc3Quc3BsaWNlKDApIDogdGhpcy5fbWFya2VycztcblxuICAgICAgICAgICAgLy8gZ2VuZXJhdGUgdGhlIHByb21pc2UgZm9yIHRoZSBtYXJrZXJzXG4gICAgICAgICAgICBjb25zdCBtcDogUHJvbWlzZTxBcnJheTxNYXJrZXI+PiA9IHRoaXMuX3NlcnZpY2UuQ3JlYXRlTWFya2VycyhtYXJrZXJzLCB0aGlzLkljb25JbmZvKTtcblxuICAgICAgICAgICAgLy8gc2V0IG1hcmtlcnMgb25jZSBwcm9taXNlcyBhcmUgZnVsbGZpbGxlZC5cbiAgICAgICAgICAgIG1wLnRoZW4obSA9PiB7XG4gICAgICAgICAgICAgICAgbS5mb3JFYWNoKG1hcmtlciA9PiB7XG4gICAgICAgICAgICAgICAgICAgICB0aGlzLkFkZEV2ZW50TGlzdGVuZXJzKG1hcmtlcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RyZWFtaW5nID8gbC5BZGRFbnRpdGllcyhtKSA6IGwuU2V0RW50aXRpZXMobSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG4iXX0=