import { Directive, Input, ViewContainerRef } from '@angular/core';
import { ClusterPlacementMode } from '../models/cluster-placement-mode';
import { ClusterClickAction } from '../models/cluster-click-action';
import { ClusterService } from '../services/cluster.service';
import { MapLayerDirective } from './map-layer';
/**
 *
 * Creates a cluster layer on a {@link MapComponent}.
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
 *   <x-map [Latitude]='lat' [Longitude]='lng' [Zoom]='zoom'>
 *     <x-cluster-layer [Visible]='visible'>
 *         <x-map-marker [Latitude]='lat' [Longitude]='lng' [Label]=''M''></x-map-marker>
 *     </x-cluster-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
export class ClusterLayerDirective extends MapLayerDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of ClusterLayerDirective.
     *
     * @param _layerService - Concreted implementation of a cluster layer service for the underlying maps
     * implementations. Generally provided via injections.
     * @param _containerRef - A reference to the view container of the layer. Generally provided via injection.
     *
     * @memberof ClusterLayerDirective
     */
    constructor(_layerService, _containerRef) {
        super(_layerService, _containerRef);
        ///
        /// Field declarations
        ///
        this._clusteringEnabled = true;
        this._clusterPlacementMode = ClusterPlacementMode.MeanValue;
        this._clusterClickAction = ClusterClickAction.ZoomIntoCluster;
        this._useDynamicSizeMarker = false;
        this._dynamicMarkerBaseSize = 18;
        this._dynamicMarkerRanges = new Map([
            [10, 'rgba(20, 180, 20, 0.5)'],
            [100, 'rgba(255, 210, 40, 0.5)'],
            [Number.MAX_SAFE_INTEGER, 'rgba(255, 40, 40, 0.5)']
        ]);
        this._zoomOnClick = true;
    }
    ///
    /// Property defintions
    ///
    /**
     * Gets or sets the the Cluster Click Action {@link ClusterClickAction}.
     *
     * @memberof ClusterLayerDirective
     */
    get ClusterClickAction() { return this._clusterClickAction; }
    set ClusterClickAction(val) { this._clusterClickAction = val; }
    /**
     * Gets or sets whether the clustering layer enables clustering. When set to false, the layer
     * behaves like a generic layer. This is handy if you want to prevent clustering at certain zoom levels.
     *
     * @memberof ClusterLayerDirective
     */
    get ClusteringEnabled() { return this._clusteringEnabled; }
    set ClusteringEnabled(val) { this._clusteringEnabled = val; }
    /**
     * Gets or sets the cluster placement mode. {@link ClusterPlacementMode}
     *
     * @memberof ClusterLayerDirective
     */
    get ClusterPlacementMode() { return this._clusterPlacementMode; }
    set ClusterPlacementMode(val) { this._clusterPlacementMode = val; }
    /**
     * Gets or sets the callback invoked to create a custom cluster marker. Note that when {@link UseDynamicSizeMarkers} is enabled,
     * you cannot set a custom marker callback.
     *
     * @memberof ClusterLayerDirective
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
     * Gets or sets the grid size to be used for clustering.
     *
     * @memberof ClusterLayerDirective
     */
    get GridSize() { return this._gridSize; }
    set GridSize(val) { this._gridSize = val; }
    /**
     * Gets or sets the IconInfo to be used to create a custom cluster marker. Supports font-based, SVG, graphics and more.
     * See {@link IMarkerIconInfo}.
     *
     * @memberof ClusterLayerDirective
     */
    get IconInfo() { return this._iconInfo; }
    set IconInfo(val) { this._iconInfo = val; }
    /**
     * Gets or sets An offset applied to the positioning of the layer.
     *
     * @memberof ClusterLayerDirective
     */
    get LayerOffset() { return this._layerOffset; }
    set LayerOffset(val) { this._layerOffset = val; }
    /**
     * Gets or sets the minimum pins required to form a cluster
     *
     * @readonly
     * @memberof ClusterLayerDirective
     */
    get MinimumClusterSize() { return this._minimumClusterSize; }
    set MinimumClusterSize(val) { this._minimumClusterSize = val; }
    /**
     * Gets or sets the options for spider clustering behavior. See {@link ISpiderClusterOptions}
     *
     * @memberof ClusterLayerDirective
     */
    get SpiderClusterOptions() { return this._spiderClusterOptions; }
    set SpiderClusterOptions(val) { this._spiderClusterOptions = val; }
    /**
     * Gets or sets the cluster styles
     *
     * @readonly
     * @memberof ClusterLayerDirective
     */
    get Styles() { return this._styles; }
    set Styles(val) { this._styles = val; }
    /**
     * Gets or sets whether to use dynamic markers. Dynamic markers change in size and color depending on the number of
     * pins in the cluster. If set to true, this will take precendence over any custom marker creation.
     *
     * @memberof ClusterLayerDirective
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
    /**
     * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
     *
     * @memberof ClusterLayerDirective
     */
    get ZIndex() { return this._zIndex; }
    set ZIndex(val) { this._zIndex = val; }
    /**
     * Gets or sets whether the cluster should zoom in on click
     *
     * @readonly
     * @memberof ClusterLayerDirective
     */
    get ZoomOnClick() { return this._zoomOnClick; }
    set ZoomOnClick(val) { this._zoomOnClick = val; }
    /**
     * Creates the dynamic size marker to be used for cluster markers if UseDynamicSizeMarkers is set to true.
     *
     * @param size - The number of markers in the cluster.
     * @param info  - The icon info to be used. This will be hydrated with
     * the actualy dimensions of the created markers and is used by the underlying model/services
     * to correctly offset the marker for correct positioning.
     * @param baseMarkerSize - The base size for dynmic markers.
     * @param ranges - The ranges to use to calculate breakpoints and colors for dynamic markers.
     * The map contains key/value pairs, with the keys being
     * the breakpoint sizes and the values the colors to be used for the dynamic marker in that range.
     * @returns - An string containing the SVG for the marker.
     *
     * @memberof ClusterLayerDirective
     */
    static CreateDynamicSizeMarker(size, info, baseMarkerSize, ranges) {
        const mr = baseMarkerSize;
        const outline = mr * 0.35;
        const total = size;
        const r = Math.log(total) / Math.log(10) * 5 + mr;
        const d = r * 2;
        let fillColor;
        ranges.forEach((v, k) => {
            if (total <= k && !fillColor) {
                fillColor = v;
            }
        });
        if (!fillColor) {
            fillColor = 'rgba(20, 180, 20, 0.5)';
        }
        // Create an SVG string of two circles, one on top of the other, with the specified radius and color.
        const svg = [`<svg xmlns='http://www.w3.org/2000/svg' width='${d}' height='${d}'>`,
            `<circle cx='${r}' cy='${r}' r='${r}' fill='${fillColor}'/>`,
            `<circle cx='${r}' cy='${r}' r='${r - outline}' fill='${fillColor}'/>`,
            `</svg>`];
        info.size = { width: d, height: d };
        info.markerOffsetRatio = { x: 0.5, y: 0.5 };
        info.textOffset = { x: 0, y: r - 8 };
        return svg.join('');
    }
    ///
    /// Public methods
    ///
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     *
     * @memberof ClusterLayerDirective
     */
    ngOnChanges(changes) {
        if (!this._addedToManager) {
            return;
        }
        if (changes['ClusterClickAction']) {
            throw (new Error('You cannot change the ClusterClickAction after the layer has been added to the layerservice.'));
        }
        const options = { id: this._id };
        if (changes['ClusteringEnabled']) {
            options.clusteringEnabled = this._clusteringEnabled;
        }
        if (changes['GridSize']) {
            options.gridSize = this._gridSize;
        }
        if (changes['LayerOffset']) {
            options.layerOffset = this._layerOffset;
        }
        if (changes['SpiderClusterOptions']) {
            options.spiderClusterOptions = this._spiderClusterOptions;
        }
        if (changes['ZIndex']) {
            options.zIndex = this._zIndex;
        }
        if (changes['Visible']) {
            options.visible = this._visible;
        }
        this._layerService.GetNativeLayer(this).then((l) => {
            l.SetOptions(options);
        });
    }
}
ClusterLayerDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-cluster-layer'
            },] }
];
ClusterLayerDirective.ctorParameters = () => [
    { type: ClusterService },
    { type: ViewContainerRef }
];
ClusterLayerDirective.propDecorators = {
    ClusterClickAction: [{ type: Input }],
    ClusteringEnabled: [{ type: Input }],
    ClusterPlacementMode: [{ type: Input }],
    CustomMarkerCallback: [{ type: Input }],
    DynamicMarkerBaseSize: [{ type: Input }],
    DynamicMarkerRanges: [{ type: Input }],
    GridSize: [{ type: Input }],
    IconInfo: [{ type: Input }],
    LayerOffset: [{ type: Input }],
    MinimumClusterSize: [{ type: Input }],
    SpiderClusterOptions: [{ type: Input }],
    Styles: [{ type: Input }],
    UseDynamicSizeMarkers: [{ type: Input }],
    ZIndex: [{ type: Input }],
    ZoomOnClick: [{ type: Input }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1c3Rlci1sYXllci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2NsdXN0ZXItbGF5ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFNBQVMsRUFDRyxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFHcEUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFDeEUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFJcEUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBRzdELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUVoRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBMkJHO0FBSUgsTUFBTSxPQUFPLHFCQUFzQixTQUFRLGlCQUFpQjtJQXFPeEQsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7Ozs7Ozs7O09BUUc7SUFDSCxZQUFZLGFBQTZCLEVBQUUsYUFBK0I7UUFDdEUsS0FBSyxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQztRQWpQeEMsR0FBRztRQUNILHNCQUFzQjtRQUN0QixHQUFHO1FBQ0ssdUJBQWtCLEdBQUcsSUFBSSxDQUFDO1FBQzFCLDBCQUFxQixHQUF5QixvQkFBb0IsQ0FBQyxTQUFTLENBQUM7UUFDN0Usd0JBQW1CLEdBQXVCLGtCQUFrQixDQUFDLGVBQWUsQ0FBQztRQVE3RSwwQkFBcUIsR0FBRyxLQUFLLENBQUM7UUFDOUIsMkJBQXNCLEdBQUcsRUFBRSxDQUFDO1FBQzVCLHlCQUFvQixHQUF3QixJQUFJLEdBQUcsQ0FBaUI7WUFDeEUsQ0FBQyxFQUFFLEVBQUUsd0JBQXdCLENBQUM7WUFDOUIsQ0FBQyxHQUFHLEVBQUUseUJBQXlCLENBQUM7WUFDaEMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUcsd0JBQXdCLENB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LGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFRLEVBQUUsRUFBRTtZQUN0RCxDQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQzs7O1lBdlJKLFNBQVMsU0FBQztnQkFDUCxRQUFRLEVBQUUsaUJBQWlCO2FBQzlCOzs7WUFuQ1EsY0FBYztZQVJLLGdCQUFnQjs7O2lDQThFdkMsS0FBSztnQ0FVTCxLQUFLO21DQVNMLEtBQUs7bUNBVUwsS0FBSztvQ0FrQkwsS0FBSztrQ0FXTCxLQUFLO3VCQVNMLEtBQUs7dUJBVUwsS0FBSzswQkFTTCxLQUFLO2lDQVVMLEtBQUs7bUNBU0wsS0FBSztxQkFVTCxLQUFLO29DQVVMLEtBQUs7cUJBaUJMLEtBQUs7MEJBVUwsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElDbHVzdGVySWNvbkluZm8gfSBmcm9tICcuLi9pbnRlcmZhY2VzL2ljbHVzdGVyLWljb24taW5mbyc7XG5pbXBvcnQgeyBEaXJlY3RpdmUsIEV2ZW50RW1pdHRlciwgT25Jbml0LCBPbkRlc3Ryb3ksIE9uQ2hhbmdlcywgU2ltcGxlQ2hhbmdlLFxuICAgIENvbnRlbnRDaGlsZHJlbiwgSW5wdXQsIFZpZXdDb250YWluZXJSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE1hcmtlciB9IGZyb20gJy4uL21vZGVscy9tYXJrZXInO1xuaW1wb3J0IHsgTGF5ZXIgfSBmcm9tICcuLi9tb2RlbHMvbGF5ZXInO1xuaW1wb3J0IHsgQ2x1c3RlclBsYWNlbWVudE1vZGUgfSBmcm9tICcuLi9tb2RlbHMvY2x1c3Rlci1wbGFjZW1lbnQtbW9kZSc7XG5pbXBvcnQgeyBDbHVzdGVyQ2xpY2tBY3Rpb24gfSBmcm9tICcuLi9tb2RlbHMvY2x1c3Rlci1jbGljay1hY3Rpb24nO1xuaW1wb3J0IHsgSVBvaW50IH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pcG9pbnQnO1xuaW1wb3J0IHsgSUNsdXN0ZXJPcHRpb25zIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pY2x1c3Rlci1vcHRpb25zJztcbmltcG9ydCB7IElNYXJrZXJJY29uSW5mb30gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbWFya2VyLWljb24taW5mbyc7XG5pbXBvcnQgeyBDbHVzdGVyU2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL2NsdXN0ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBJU3BpZGVyQ2x1c3Rlck9wdGlvbnMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lzcGlkZXItY2x1c3Rlci1vcHRpb25zJztcbmltcG9ydCB7IE1hcE1hcmtlckRpcmVjdGl2ZSB9IGZyb20gJy4vbWFwLW1hcmtlcic7XG5pbXBvcnQgeyBNYXBMYXllckRpcmVjdGl2ZSB9IGZyb20gJy4vbWFwLWxheWVyJztcblxuLyoqXG4gKlxuICogQ3JlYXRlcyBhIGNsdXN0ZXIgbGF5ZXIgb24gYSB7QGxpbmsgTWFwQ29tcG9uZW50fS5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICogaW1wb3J0IHtNYXBDb21wb25lbnQsIE1hcE1hcmtlckRpcmVjdGl2ZX0gZnJvbSAnLi4uJztcbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICBzZWxlY3RvcjogJ215LW1hcC1jbXAnLFxuICogIHN0eWxlczogW2BcbiAqICAgLm1hcC1jb250YWluZXIge1xuICogICAgIGhlaWdodDogMzAwcHg7XG4gKiAgIH1cbiAqIGBdLFxuICogdGVtcGxhdGU6IGBcbiAqICAgPHgtbWFwIFtMYXRpdHVkZV09J2xhdCcgW0xvbmdpdHVkZV09J2xuZycgW1pvb21dPSd6b29tJz5cbiAqICAgICA8eC1jbHVzdGVyLWxheWVyIFtWaXNpYmxlXT0ndmlzaWJsZSc+XG4gKiAgICAgICAgIDx4LW1hcC1tYXJrZXIgW0xhdGl0dWRlXT0nbGF0JyBbTG9uZ2l0dWRlXT0nbG5nJyBbTGFiZWxdPScnTScnPjwveC1tYXAtbWFya2VyPlxuICogICAgIDwveC1jbHVzdGVyLWxheWVyPlxuICogICA8L3gtbWFwPlxuICogYFxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBleHBvcnRcbiAqL1xuQERpcmVjdGl2ZSh7XG4gICAgc2VsZWN0b3I6ICd4LWNsdXN0ZXItbGF5ZXInXG59KVxuZXhwb3J0IGNsYXNzIENsdXN0ZXJMYXllckRpcmVjdGl2ZSBleHRlbmRzIE1hcExheWVyRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3ksIE9uQ2hhbmdlcyB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfY2x1c3RlcmluZ0VuYWJsZWQgPSB0cnVlO1xuICAgIHByaXZhdGUgX2NsdXN0ZXJQbGFjZW1lbnRNb2RlOiBDbHVzdGVyUGxhY2VtZW50TW9kZSA9IENsdXN0ZXJQbGFjZW1lbnRNb2RlLk1lYW5WYWx1ZTtcbiAgICBwcml2YXRlIF9jbHVzdGVyQ2xpY2tBY3Rpb246IENsdXN0ZXJDbGlja0FjdGlvbiA9IENsdXN0ZXJDbGlja0FjdGlvbi5ab29tSW50b0NsdXN0ZXI7XG4gICAgcHJpdmF0ZSBfc3BpZGVyQ2x1c3Rlck9wdGlvbnM6IElTcGlkZXJDbHVzdGVyT3B0aW9ucztcbiAgICBwcml2YXRlIF96SW5kZXg6IG51bWJlcjtcbiAgICBwcml2YXRlIF9ncmlkU2l6ZTogbnVtYmVyO1xuICAgIHByaXZhdGUgX2xheWVyT2Zmc2V0OiBJUG9pbnQ7XG4gICAgcHJpdmF0ZSBfaWNvbkluZm86IElNYXJrZXJJY29uSW5mbztcbiAgICBwcml2YXRlIF9taW5pbXVtQ2x1c3RlclNpemU6IG51bWJlcjtcbiAgICBwcml2YXRlIF9zdHlsZXM6IEFycmF5PElDbHVzdGVySWNvbkluZm8+O1xuICAgIHByaXZhdGUgX3VzZUR5bmFtaWNTaXplTWFya2VyID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfZHluYW1pY01hcmtlckJhc2VTaXplID0gMTg7XG4gICAgcHJpdmF0ZSBfZHluYW1pY01hcmtlclJhbmdlczogTWFwPG51bWJlciwgc3RyaW5nPiA9IG5ldyBNYXA8bnVtYmVyLCBzdHJpbmc+KFtcbiAgICAgICAgWzEwLCAncmdiYSgyMCwgMTgwLCAyMCwgMC41KSddLFxuICAgICAgICBbMTAwLCAncmdiYSgyNTUsIDIxMCwgNDAsIDAuNSknXSxcbiAgICAgICAgW051bWJlci5NQVhfU0FGRV9JTlRFR0VSICwgJ3JnYmEoMjU1LCA0MCwgNDAsIDAuNSknXVxuICAgIF0pO1xuICAgIHByaXZhdGUgX3pvb21PbkNsaWNrID0gdHJ1ZTtcbiAgICBwcml2YXRlIF9pY29uQ3JlYXRpb25DYWxsYmFjazogKG06IEFycmF5PE1hcmtlcj4sIGk6IElNYXJrZXJJY29uSW5mbykgPT4gc3RyaW5nO1xuXG4gICAgLy8vXG4gICAgLy8vIFByb3BlcnR5IGRlZmludGlvbnNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgdGhlIENsdXN0ZXIgQ2xpY2sgQWN0aW9uIHtAbGluayBDbHVzdGVyQ2xpY2tBY3Rpb259LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENsdXN0ZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgICAgIHB1YmxpYyBnZXQgQ2x1c3RlckNsaWNrQWN0aW9uKCk6IENsdXN0ZXJDbGlja0FjdGlvbiAgeyByZXR1cm4gdGhpcy5fY2x1c3RlckNsaWNrQWN0aW9uOyB9XG4gICAgICAgIHB1YmxpYyBzZXQgQ2x1c3RlckNsaWNrQWN0aW9uKHZhbDogQ2x1c3RlckNsaWNrQWN0aW9uKSB7IHRoaXMuX2NsdXN0ZXJDbGlja0FjdGlvbiA9IHZhbDsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgdGhlIGNsdXN0ZXJpbmcgbGF5ZXIgZW5hYmxlcyBjbHVzdGVyaW5nLiBXaGVuIHNldCB0byBmYWxzZSwgdGhlIGxheWVyXG4gICAgICogYmVoYXZlcyBsaWtlIGEgZ2VuZXJpYyBsYXllci4gVGhpcyBpcyBoYW5keSBpZiB5b3Ugd2FudCB0byBwcmV2ZW50IGNsdXN0ZXJpbmcgYXQgY2VydGFpbiB6b29tIGxldmVscy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgICAgICBwdWJsaWMgZ2V0IENsdXN0ZXJpbmdFbmFibGVkKCk6IGJvb2xlYW4gIHsgcmV0dXJuIHRoaXMuX2NsdXN0ZXJpbmdFbmFibGVkOyB9XG4gICAgICAgIHB1YmxpYyBzZXQgQ2x1c3RlcmluZ0VuYWJsZWQodmFsOiBib29sZWFuKSB7IHRoaXMuX2NsdXN0ZXJpbmdFbmFibGVkID0gdmFsOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIGNsdXN0ZXIgcGxhY2VtZW50IG1vZGUuIHtAbGluayBDbHVzdGVyUGxhY2VtZW50TW9kZX1cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgICAgICBwdWJsaWMgZ2V0IENsdXN0ZXJQbGFjZW1lbnRNb2RlKCk6IENsdXN0ZXJQbGFjZW1lbnRNb2RlICB7IHJldHVybiB0aGlzLl9jbHVzdGVyUGxhY2VtZW50TW9kZTsgfVxuICAgICAgICBwdWJsaWMgc2V0IENsdXN0ZXJQbGFjZW1lbnRNb2RlKHZhbDogQ2x1c3RlclBsYWNlbWVudE1vZGUpIHsgdGhpcy5fY2x1c3RlclBsYWNlbWVudE1vZGUgPSB2YWw7IH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgY2FsbGJhY2sgaW52b2tlZCB0byBjcmVhdGUgYSBjdXN0b20gY2x1c3RlciBtYXJrZXIuIE5vdGUgdGhhdCB3aGVuIHtAbGluayBVc2VEeW5hbWljU2l6ZU1hcmtlcnN9IGlzIGVuYWJsZWQsXG4gICAgICogeW91IGNhbm5vdCBzZXQgYSBjdXN0b20gbWFya2VyIGNhbGxiYWNrLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENsdXN0ZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgICAgIHB1YmxpYyBnZXQgQ3VzdG9tTWFya2VyQ2FsbGJhY2soKTogKG06IEFycmF5PE1hcmtlcj4sIGk6IElNYXJrZXJJY29uSW5mbykgPT4gc3RyaW5nICB7IHJldHVybiB0aGlzLl9pY29uQ3JlYXRpb25DYWxsYmFjazsgfVxuICAgICAgICBwdWJsaWMgc2V0IEN1c3RvbU1hcmtlckNhbGxiYWNrKHZhbDogKG06IEFycmF5PE1hcmtlcj4sIGk6IElNYXJrZXJJY29uSW5mbykgPT4gc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdXNlRHluYW1pY1NpemVNYXJrZXIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyhcbiAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKGBZb3UgY2Fubm90IHNldCBhIGN1c3RvbSBtYXJrZXIgY2FsbGJhY2sgd2hlbiBVc2VEeW5hbWljU2l6ZU1hcmtlcnMgaXMgc2V0IHRvIHRydWUuXG4gICAgICAgICAgICAgICAgICAgIFNldCBVc2VEeW5hbWljU2l6ZU1ha2VycyB0byBmYWxzZS5gKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9pY29uQ3JlYXRpb25DYWxsYmFjayA9IHZhbDtcbiAgICAgICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSBiYXNlIHNpemUgb2YgZHluYW1pYyBtYXJrZXJzIGluIHBpeGVscy4gVGhlIGFjdHVhbHkgc2l6ZSBvZiB0aGUgZHluYW1pYyBtYXJrZXIgaXMgYmFzZWQgb24gdGhpcy5cbiAgICAgKiBTZWUge0BsaW5rIFVzZUR5bmFtaWNTaXplTWFya2Vyc30uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ2x1c3RlckxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KClcbiAgICAgICAgcHVibGljIGdldCBEeW5hbWljTWFya2VyQmFzZVNpemUoKTogbnVtYmVyICB7IHJldHVybiB0aGlzLl9keW5hbWljTWFya2VyQmFzZVNpemU7IH1cbiAgICAgICAgcHVibGljIHNldCBEeW5hbWljTWFya2VyQmFzZVNpemUodmFsOiBudW1iZXIpIHsgdGhpcy5fZHluYW1pY01hcmtlckJhc2VTaXplID0gdmFsOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIHJhbmdlcyB0byB1c2UgdG8gY2FsY3VsYXRlIGJyZWFrcG9pbnRzIGFuZCBjb2xvcnMgZm9yIGR5bmFtaWMgbWFya2Vycy5cbiAgICAgKiBUaGUgbWFwIGNvbnRhaW5zIGtleS92YWx1ZSBwYWlycywgd2l0aCB0aGUga2V5cyBiZWluZ1xuICAgICAqIHRoZSBicmVha3BvaW50IHNpemVzIGFuZCB0aGUgdmFsdWVzIHRoZSBjb2xvcnMgdG8gYmUgdXNlZCBmb3IgdGhlIGR5bmFtaWMgbWFya2VyIGluIHRoYXQgcmFuZ2UuIFNlZSB7QGxpbmsgVXNlRHluYW1pY1NpemVNYXJrZXJzfS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgICAgICBwdWJsaWMgZ2V0IER5bmFtaWNNYXJrZXJSYW5nZXMoKTogTWFwPG51bWJlciwgc3RyaW5nPiAgeyByZXR1cm4gdGhpcy5fZHluYW1pY01hcmtlclJhbmdlczsgfVxuICAgICAgICBwdWJsaWMgc2V0IER5bmFtaWNNYXJrZXJSYW5nZXModmFsOiBNYXA8bnVtYmVyLCBzdHJpbmc+KSB7IHRoaXMuX2R5bmFtaWNNYXJrZXJSYW5nZXMgPSB2YWw7IH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgZ3JpZCBzaXplIHRvIGJlIHVzZWQgZm9yIGNsdXN0ZXJpbmcuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQ2x1c3RlckxheWVyRGlyZWN0aXZlXG4gICAgICovXG4gICAgQElucHV0KClcbiAgICAgICAgcHVibGljIGdldCBHcmlkU2l6ZSgpOiBudW1iZXIgIHsgcmV0dXJuIHRoaXMuX2dyaWRTaXplOyB9XG4gICAgICAgIHB1YmxpYyBzZXQgR3JpZFNpemUodmFsOiBudW1iZXIpIHsgdGhpcy5fZ3JpZFNpemUgPSB2YWw7IH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgSWNvbkluZm8gdG8gYmUgdXNlZCB0byBjcmVhdGUgYSBjdXN0b20gY2x1c3RlciBtYXJrZXIuIFN1cHBvcnRzIGZvbnQtYmFzZWQsIFNWRywgZ3JhcGhpY3MgYW5kIG1vcmUuXG4gICAgICogU2VlIHtAbGluayBJTWFya2VySWNvbkluZm99LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENsdXN0ZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgICAgIHB1YmxpYyBnZXQgSWNvbkluZm8oKTogSU1hcmtlckljb25JbmZvICB7IHJldHVybiB0aGlzLl9pY29uSW5mbzsgfVxuICAgICAgICBwdWJsaWMgc2V0IEljb25JbmZvKHZhbDogSU1hcmtlckljb25JbmZvKSB7IHRoaXMuX2ljb25JbmZvID0gdmFsOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgQW4gb2Zmc2V0IGFwcGxpZWQgdG8gdGhlIHBvc2l0aW9uaW5nIG9mIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgICAgICBwdWJsaWMgZ2V0IExheWVyT2Zmc2V0KCk6IElQb2ludCAgeyByZXR1cm4gdGhpcy5fbGF5ZXJPZmZzZXQ7IH1cbiAgICAgICAgcHVibGljIHNldCBMYXllck9mZnNldCh2YWw6IElQb2ludCkgeyB0aGlzLl9sYXllck9mZnNldCA9IHZhbDsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSBtaW5pbXVtIHBpbnMgcmVxdWlyZWQgdG8gZm9ybSBhIGNsdXN0ZXJcbiAgICAgKlxuICAgICAqIEByZWFkb25seVxuICAgICAqIEBtZW1iZXJvZiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgICAgICBwdWJsaWMgZ2V0IE1pbmltdW1DbHVzdGVyU2l6ZSgpOiBudW1iZXIgIHsgcmV0dXJuIHRoaXMuX21pbmltdW1DbHVzdGVyU2l6ZTsgfVxuICAgICAgICBwdWJsaWMgc2V0IE1pbmltdW1DbHVzdGVyU2l6ZSh2YWw6IG51bWJlcikgeyB0aGlzLl9taW5pbXVtQ2x1c3RlclNpemUgPSB2YWw7IH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgb3B0aW9ucyBmb3Igc3BpZGVyIGNsdXN0ZXJpbmcgYmVoYXZpb3IuIFNlZSB7QGxpbmsgSVNwaWRlckNsdXN0ZXJPcHRpb25zfVxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENsdXN0ZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgICAgIHB1YmxpYyBnZXQgU3BpZGVyQ2x1c3Rlck9wdGlvbnMoKTogSVNwaWRlckNsdXN0ZXJPcHRpb25zIHsgcmV0dXJuIHRoaXMuX3NwaWRlckNsdXN0ZXJPcHRpb25zOyB9XG4gICAgICAgIHB1YmxpYyBzZXQgU3BpZGVyQ2x1c3Rlck9wdGlvbnModmFsOiBJU3BpZGVyQ2x1c3Rlck9wdGlvbnMpIHsgdGhpcy5fc3BpZGVyQ2x1c3Rlck9wdGlvbnMgPSB2YWw7IH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgY2x1c3RlciBzdHlsZXNcbiAgICAgKlxuICAgICAqIEByZWFkb25seVxuICAgICAqIEBtZW1iZXJvZiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgICAgICBwdWJsaWMgZ2V0IFN0eWxlcygpOiBBcnJheTxJQ2x1c3Rlckljb25JbmZvPiB7IHJldHVybiB0aGlzLl9zdHlsZXM7IH1cbiAgICAgICAgcHVibGljIHNldCBTdHlsZXModmFsOiBBcnJheTxJQ2x1c3Rlckljb25JbmZvPikgeyB0aGlzLl9zdHlsZXMgPSB2YWw7IH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyB3aGV0aGVyIHRvIHVzZSBkeW5hbWljIG1hcmtlcnMuIER5bmFtaWMgbWFya2VycyBjaGFuZ2UgaW4gc2l6ZSBhbmQgY29sb3IgZGVwZW5kaW5nIG9uIHRoZSBudW1iZXIgb2ZcbiAgICAgKiBwaW5zIGluIHRoZSBjbHVzdGVyLiBJZiBzZXQgdG8gdHJ1ZSwgdGhpcyB3aWxsIHRha2UgcHJlY2VuZGVuY2Ugb3ZlciBhbnkgY3VzdG9tIG1hcmtlciBjcmVhdGlvbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgICAgICBwdWJsaWMgZ2V0IFVzZUR5bmFtaWNTaXplTWFya2VycygpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX3VzZUR5bmFtaWNTaXplTWFya2VyOyB9XG4gICAgICAgIHB1YmxpYyBzZXQgVXNlRHluYW1pY1NpemVNYXJrZXJzKHZhbDogYm9vbGVhbikge1xuICAgICAgICAgICAgdGhpcy5fdXNlRHluYW1pY1NpemVNYXJrZXIgPSB2YWw7XG4gICAgICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faWNvbkNyZWF0aW9uQ2FsbGJhY2sgPSAobTogQXJyYXk8TWFya2VyPiwgaW5mbzogSU1hcmtlckljb25JbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmUuQ3JlYXRlRHluYW1pY1NpemVNYXJrZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBtLmxlbmd0aCwgaW5mbywgdGhpcy5fZHluYW1pY01hcmtlckJhc2VTaXplLCB0aGlzLl9keW5hbWljTWFya2VyUmFuZ2VzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIHotaW5kZXggb2YgdGhlIGxheWVyLiBJZiBub3QgdXNlZCwgbGF5ZXJzIGdldCBzdGFja2VkIGluIHRoZSBvcmRlciBjcmVhdGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENsdXN0ZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgICAgIHB1YmxpYyBnZXQgWkluZGV4KCk6IG51bWJlciB7IHJldHVybiB0aGlzLl96SW5kZXg7IH1cbiAgICAgICAgcHVibGljIHNldCBaSW5kZXgodmFsOiBudW1iZXIpIHsgdGhpcy5fekluZGV4ID0gdmFsOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciB0aGUgY2x1c3RlciBzaG91bGQgem9vbSBpbiBvbiBjbGlja1xuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIENsdXN0ZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgICAgIHB1YmxpYyBnZXQgWm9vbU9uQ2xpY2soKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl96b29tT25DbGljazsgfVxuICAgICAgICBwdWJsaWMgc2V0IFpvb21PbkNsaWNrKHZhbDogYm9vbGVhbikgeyB0aGlzLl96b29tT25DbGljayA9IHZhbDsgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgZHluYW1pYyBzaXplIG1hcmtlciB0byBiZSB1c2VkIGZvciBjbHVzdGVyIG1hcmtlcnMgaWYgVXNlRHluYW1pY1NpemVNYXJrZXJzIGlzIHNldCB0byB0cnVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpemUgLSBUaGUgbnVtYmVyIG9mIG1hcmtlcnMgaW4gdGhlIGNsdXN0ZXIuXG4gICAgICogQHBhcmFtIGluZm8gIC0gVGhlIGljb24gaW5mbyB0byBiZSB1c2VkLiBUaGlzIHdpbGwgYmUgaHlkcmF0ZWQgd2l0aFxuICAgICAqIHRoZSBhY3R1YWx5IGRpbWVuc2lvbnMgb2YgdGhlIGNyZWF0ZWQgbWFya2VycyBhbmQgaXMgdXNlZCBieSB0aGUgdW5kZXJseWluZyBtb2RlbC9zZXJ2aWNlc1xuICAgICAqIHRvIGNvcnJlY3RseSBvZmZzZXQgdGhlIG1hcmtlciBmb3IgY29ycmVjdCBwb3NpdGlvbmluZy5cbiAgICAgKiBAcGFyYW0gYmFzZU1hcmtlclNpemUgLSBUaGUgYmFzZSBzaXplIGZvciBkeW5taWMgbWFya2Vycy5cbiAgICAgKiBAcGFyYW0gcmFuZ2VzIC0gVGhlIHJhbmdlcyB0byB1c2UgdG8gY2FsY3VsYXRlIGJyZWFrcG9pbnRzIGFuZCBjb2xvcnMgZm9yIGR5bmFtaWMgbWFya2Vycy5cbiAgICAgKiBUaGUgbWFwIGNvbnRhaW5zIGtleS92YWx1ZSBwYWlycywgd2l0aCB0aGUga2V5cyBiZWluZ1xuICAgICAqIHRoZSBicmVha3BvaW50IHNpemVzIGFuZCB0aGUgdmFsdWVzIHRoZSBjb2xvcnMgdG8gYmUgdXNlZCBmb3IgdGhlIGR5bmFtaWMgbWFya2VyIGluIHRoYXQgcmFuZ2UuXG4gICAgICogQHJldHVybnMgLSBBbiBzdHJpbmcgY29udGFpbmluZyB0aGUgU1ZHIGZvciB0aGUgbWFya2VyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIENsdXN0ZXJMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHB1YmxpYyBzdGF0aWMgQ3JlYXRlRHluYW1pY1NpemVNYXJrZXIoc2l6ZTogbnVtYmVyLCBpbmZvOiBJTWFya2VySWNvbkluZm8sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlTWFya2VyU2l6ZTogbnVtYmVyLCByYW5nZXM6IE1hcDxudW1iZXIsIHN0cmluZz4pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBtcjogbnVtYmVyID0gYmFzZU1hcmtlclNpemU7XG4gICAgICAgIGNvbnN0IG91dGxpbmU6IG51bWJlciA9IG1yICogMC4zNTtcbiAgICAgICAgY29uc3QgdG90YWw6IG51bWJlciA9IHNpemU7XG4gICAgICAgIGNvbnN0IHI6IG51bWJlciA9IE1hdGgubG9nKHRvdGFsKSAvIE1hdGgubG9nKDEwKSAqIDUgKyBtcjtcbiAgICAgICAgY29uc3QgZDogbnVtYmVyID0gciAqIDI7XG4gICAgICAgIGxldCBmaWxsQ29sb3I6IHN0cmluZztcbiAgICAgICAgcmFuZ2VzLmZvckVhY2goKHYsIGspID0+IHtcbiAgICAgICAgICAgIGlmICh0b3RhbCA8PSBrICYmICFmaWxsQ29sb3IpIHsgZmlsbENvbG9yID0gdjsgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFmaWxsQ29sb3IpIHsgZmlsbENvbG9yID0gJ3JnYmEoMjAsIDE4MCwgMjAsIDAuNSknOyB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIGFuIFNWRyBzdHJpbmcgb2YgdHdvIGNpcmNsZXMsIG9uZSBvbiB0b3Agb2YgdGhlIG90aGVyLCB3aXRoIHRoZSBzcGVjaWZpZWQgcmFkaXVzIGFuZCBjb2xvci5cbiAgICAgICAgY29uc3Qgc3ZnOiBBcnJheTxhbnk+ID0gW2A8c3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgd2lkdGg9JyR7ZH0nIGhlaWdodD0nJHtkfSc+YCxcbiAgICAgICAgICAgIGA8Y2lyY2xlIGN4PScke3J9JyBjeT0nJHtyfScgcj0nJHtyfScgZmlsbD0nJHtmaWxsQ29sb3J9Jy8+YCxcbiAgICAgICAgICAgIGA8Y2lyY2xlIGN4PScke3J9JyBjeT0nJHtyfScgcj0nJHtyIC0gb3V0bGluZX0nIGZpbGw9JyR7ZmlsbENvbG9yfScvPmAsXG4gICAgICAgICAgICBgPC9zdmc+YF07XG4gICAgICAgIGluZm8uc2l6ZSA9IHsgd2lkdGg6IGQsIGhlaWdodDogZCB9O1xuICAgICAgICBpbmZvLm1hcmtlck9mZnNldFJhdGlvID0geyB4OiAwLjUsIHk6IDAuNSB9O1xuICAgICAgICBpbmZvLnRleHRPZmZzZXQgPSB7IHg6IDAsIHk6IHIgLSA4IH07XG4gICAgICAgIHJldHVybiBzdmcuam9pbignJyk7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIENsdXN0ZXJMYXllckRpcmVjdGl2ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBfbGF5ZXJTZXJ2aWNlIC0gQ29uY3JldGVkIGltcGxlbWVudGF0aW9uIG9mIGEgY2x1c3RlciBsYXllciBzZXJ2aWNlIGZvciB0aGUgdW5kZXJseWluZyBtYXBzXG4gICAgICogaW1wbGVtZW50YXRpb25zLiBHZW5lcmFsbHkgcHJvdmlkZWQgdmlhIGluamVjdGlvbnMuXG4gICAgICogQHBhcmFtIF9jb250YWluZXJSZWYgLSBBIHJlZmVyZW5jZSB0byB0aGUgdmlldyBjb250YWluZXIgb2YgdGhlIGxheWVyLiBHZW5lcmFsbHkgcHJvdmlkZWQgdmlhIGluamVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihfbGF5ZXJTZXJ2aWNlOiBDbHVzdGVyU2VydmljZSwgX2NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZikge1xuICAgICAgICBzdXBlcihfbGF5ZXJTZXJ2aWNlLCBfY29udGFpbmVyUmVmKTtcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHVibGljIG1ldGhvZHNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIFJlYWN0cyB0byBjaGFuZ2VzIGluIGRhdGEtYm91bmQgcHJvcGVydGllcyBvZiB0aGUgY29tcG9uZW50IGFuZCBhY3R1YXRlcyBwcm9wZXJ0eSBjaGFuZ2VzIGluIHRoZSB1bmRlcmxpbmcgbGF5ZXIgbW9kZWwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhbmdlcyAtIGNvbGxlY3Rpb24gb2YgY2hhbmdlcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBDbHVzdGVyTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogeyBbcHJvcE5hbWU6IHN0cmluZ106IFNpbXBsZUNoYW5nZSB9KTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5fYWRkZWRUb01hbmFnZXIpIHsgcmV0dXJuOyB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydDbHVzdGVyQ2xpY2tBY3Rpb24nXSkge1xuICAgICAgICAgICAgdGhyb3cgKFxuICAgICAgICAgICAgICAgIG5ldyBFcnJvcignWW91IGNhbm5vdCBjaGFuZ2UgdGhlIENsdXN0ZXJDbGlja0FjdGlvbiBhZnRlciB0aGUgbGF5ZXIgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIGxheWVyc2VydmljZS4nKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9wdGlvbnM6IElDbHVzdGVyT3B0aW9ucyA9IHsgaWQ6IHRoaXMuX2lkIH07XG4gICAgICAgIGlmIChjaGFuZ2VzWydDbHVzdGVyaW5nRW5hYmxlZCddKSB7IG9wdGlvbnMuY2x1c3RlcmluZ0VuYWJsZWQgPSB0aGlzLl9jbHVzdGVyaW5nRW5hYmxlZDsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snR3JpZFNpemUnXSkgeyBvcHRpb25zLmdyaWRTaXplID0gdGhpcy5fZ3JpZFNpemU7IH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ0xheWVyT2Zmc2V0J10pIHsgb3B0aW9ucy5sYXllck9mZnNldCA9IHRoaXMuX2xheWVyT2Zmc2V0OyB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydTcGlkZXJDbHVzdGVyT3B0aW9ucyddKSB7IG9wdGlvbnMuc3BpZGVyQ2x1c3Rlck9wdGlvbnMgPSB0aGlzLl9zcGlkZXJDbHVzdGVyT3B0aW9uczsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snWkluZGV4J10pIHsgb3B0aW9ucy56SW5kZXggPSB0aGlzLl96SW5kZXg7IH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ1Zpc2libGUnXSkgeyBvcHRpb25zLnZpc2libGUgPSB0aGlzLl92aXNpYmxlOyB9XG5cbiAgICAgICAgdGhpcy5fbGF5ZXJTZXJ2aWNlLkdldE5hdGl2ZUxheWVyKHRoaXMpLnRoZW4oKGw6IExheWVyKSA9PiB7XG4gICAgICAgICAgICBsLlNldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxufVxuIl19