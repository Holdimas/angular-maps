import { Directive, ContentChildren, Input, ViewContainerRef } from '@angular/core';
import { LayerService } from '../services/layer.service';
import { MapMarkerDirective } from './map-marker';
/**
 * internal counter to use as ids for multiple layers.
 */
let layerId = 0;
/**
 * MapLayerDirective creates a layer on a {@link MapComponent}.
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
 *     <x-map-layer [Visible]='visible'>
 *         <x-map-marker [Latitude]='lat' [Longitude]='lng' [Label]=''M''></x-map-marker>
 *     </x-map-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
export class MapLayerDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapLayerDirective.
     * @param _layerService - Concreted implementation of a layer service for the underlying maps implementations.
     * Generally provided via injections.
     * @param _containerRef - Reference to the container hosting the map canvas. Generally provided via injection.
     *
     * @memberof MapLayerDirective
     */
    constructor(_layerService, _containerRef) {
        this._layerService = _layerService;
        this._containerRef = _containerRef;
        ///
        /// Field declarations
        ///
        this._visible = true;
        this._addedToManager = false;
        this._id = layerId++;
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets or sets the layer visibility.
     *
     * @memberof MapLayerDirective
     */
    get Visible() { return this._visible; }
    set Visible(val) { this._visible = val; }
    /**
     * Gets the layer id.
     *
     * @readonly
     * @memberof MapLayerDirective
     */
    get Id() { return this._id; }
    ///
    /// Public methods
    ///
    /**
     * Called on Component initialization. Part of ng Component life cycle.
     *
     * @memberof MapLayerDirective
     */
    ngOnInit() {
        this._containerRef.element.nativeElement.attributes['layerId'] = this._id.toString();
        this._layerService.AddLayer(this);
        this._addedToManager = true;
    }
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof MapLayerDirective
     */
    ngOnChanges(changes) {
        if (!this._addedToManager) {
            return;
        }
        if (changes['Visible']) {
            this._layerService.GetNativeLayer(this).then(l => {
                l.SetVisible(!l.GetVisible());
            });
        }
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     *
     * @memberof MapLayerDirective
     */
    ngOnDestroy() {
        this._layerService.DeleteLayer(this);
    }
}
MapLayerDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-layer'
            },] }
];
MapLayerDirective.ctorParameters = () => [
    { type: LayerService },
    { type: ViewContainerRef }
];
MapLayerDirective.propDecorators = {
    _markers: [{ type: ContentChildren, args: [MapMarkerDirective,] }],
    Visible: [{ type: Input }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLWxheWVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL2NvbXBvbmVudHMvbWFwLWxheWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQ2QsZUFBZSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNwRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDekQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sY0FBYyxDQUFDO0FBRWxEOztHQUVHO0FBQ0gsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO0FBRWhCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTBCRztBQUlILE1BQU0sT0FBTyxpQkFBaUI7SUFnQzFCLEdBQUc7SUFDSCxlQUFlO0lBQ2YsR0FBRztJQUVIOzs7Ozs7O09BT0c7SUFDSCxZQUFzQixhQUEyQixFQUFZLGFBQStCO1FBQXRFLGtCQUFhLEdBQWIsYUFBYSxDQUFjO1FBQVksa0JBQWEsR0FBYixhQUFhLENBQWtCO1FBMUM1RixHQUFHO1FBQ0gsc0JBQXNCO1FBQ3RCLEdBQUc7UUFDTyxhQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLG9CQUFlLEdBQUcsS0FBSyxDQUFDO1FBdUM5QixJQUFJLENBQUMsR0FBRyxHQUFHLE9BQU8sRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFuQ0QsR0FBRztJQUNILHlCQUF5QjtJQUN6QixHQUFHO0lBRUg7Ozs7T0FJRztJQUNILElBQ2UsT0FBTyxLQUFjLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDdkQsSUFBVyxPQUFPLENBQUMsR0FBWSxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUU3RDs7Ozs7T0FLRztJQUNILElBQVcsRUFBRSxLQUFhLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFrQjVDLEdBQUc7SUFDSCxrQkFBa0I7SUFDbEIsR0FBRztJQUVIOzs7O09BSUc7SUFDSSxRQUFRO1FBQ1gsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3JGLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSxXQUFXLENBQUMsT0FBNkM7UUFDNUQsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7WUFBRSxPQUFPO1NBQUU7UUFDdEMsSUFBSSxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDcEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUM3QyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDbEMsQ0FBQyxDQUFDLENBQUM7U0FDTjtJQUNMLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLFdBQVc7UUFDZCxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QyxDQUFDOzs7WUExRkosU0FBUyxTQUFDO2dCQUNQLFFBQVEsRUFBRSxhQUFhO2FBQzFCOzs7WUFyQ1EsWUFBWTtZQURPLGdCQUFnQjs7O3VCQWdEdkMsZUFBZSxTQUFDLGtCQUFrQjtzQkFXbEMsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpcmVjdGl2ZSwgRXZlbnRFbWl0dGVyLCBPbkluaXQsIE9uRGVzdHJveSwgT25DaGFuZ2VzLCBBZnRlckNvbnRlbnRJbml0LCBTaW1wbGVDaGFuZ2UsXG4gICAgQ29udGVudENoaWxkcmVuLCBJbnB1dCwgVmlld0NvbnRhaW5lclJlZiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTGF5ZXJTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvbGF5ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBNYXBNYXJrZXJEaXJlY3RpdmUgfSBmcm9tICcuL21hcC1tYXJrZXInO1xuXG4vKipcbiAqIGludGVybmFsIGNvdW50ZXIgdG8gdXNlIGFzIGlkcyBmb3IgbXVsdGlwbGUgbGF5ZXJzLlxuICovXG5sZXQgbGF5ZXJJZCA9IDA7XG5cbi8qKlxuICogTWFwTGF5ZXJEaXJlY3RpdmUgY3JlYXRlcyBhIGxheWVyIG9uIGEge0BsaW5rIE1hcENvbXBvbmVudH0uXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7Q29tcG9uZW50fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqIGltcG9ydCB7TWFwQ29tcG9uZW50LCBNYXBNYXJrZXJEaXJlY3RpdmV9IGZyb20gJy4uLic7XG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgc2VsZWN0b3I6ICdteS1tYXAtY21wJyxcbiAqICBzdHlsZXM6IFtgXG4gKiAgIC5tYXAtY29udGFpbmVyIHtcbiAqICAgICBoZWlnaHQ6IDMwMHB4O1xuICogICB9XG4gKiBgXSxcbiAqIHRlbXBsYXRlOiBgXG4gKiAgIDx4LW1hcCBbTGF0aXR1ZGVdPSdsYXQnIFtMb25naXR1ZGVdPSdsbmcnIFtab29tXT0nem9vbSc+XG4gKiAgICAgPHgtbWFwLWxheWVyIFtWaXNpYmxlXT0ndmlzaWJsZSc+XG4gKiAgICAgICAgIDx4LW1hcC1tYXJrZXIgW0xhdGl0dWRlXT0nbGF0JyBbTG9uZ2l0dWRlXT0nbG5nJyBbTGFiZWxdPScnTScnPjwveC1tYXAtbWFya2VyPlxuICogICAgIDwveC1tYXAtbGF5ZXI+XG4gKiAgIDwveC1tYXA+XG4gKiBgXG4gKiB9KVxuICogYGBgXG4gKlxuICogQGV4cG9ydFxuICovXG5ARGlyZWN0aXZlKHtcbiAgICBzZWxlY3RvcjogJ3gtbWFwLWxheWVyJ1xufSlcbmV4cG9ydCBjbGFzcyBNYXBMYXllckRpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCwgT25EZXN0cm95LCBPbkNoYW5nZXMge1xuXG4gICAgLy8vXG4gICAgLy8vIEZpZWxkIGRlY2xhcmF0aW9uc1xuICAgIC8vL1xuICAgIHByb3RlY3RlZCBfdmlzaWJsZSA9IHRydWU7XG4gICAgcHJvdGVjdGVkIF9hZGRlZFRvTWFuYWdlciA9IGZhbHNlO1xuICAgIHByb3RlY3RlZCBfaWQ6IG51bWJlcjtcblxuICAgIEBDb250ZW50Q2hpbGRyZW4oTWFwTWFya2VyRGlyZWN0aXZlKSBwcm90ZWN0ZWQgX21hcmtlcnM6IEFycmF5PE1hcE1hcmtlckRpcmVjdGl2ZT47XG5cbiAgICAvLy9cbiAgICAvLy8gUHJvcGVydHkgZGVjbGFyYXRpb25zXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIGxheWVyIHZpc2liaWxpdHkuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBASW5wdXQoKVxuICAgICAgICBwdWJsaWMgZ2V0IFZpc2libGUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl92aXNpYmxlOyB9XG4gICAgICAgIHB1YmxpYyBzZXQgVmlzaWJsZSh2YWw6IGJvb2xlYW4pIHsgdGhpcy5fdmlzaWJsZSA9IHZhbDsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbGF5ZXIgaWQuXG4gICAgICpcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAbWVtYmVyb2YgTWFwTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IElkKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9pZDsgfVxuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIE1hcExheWVyRGlyZWN0aXZlLlxuICAgICAqIEBwYXJhbSBfbGF5ZXJTZXJ2aWNlIC0gQ29uY3JldGVkIGltcGxlbWVudGF0aW9uIG9mIGEgbGF5ZXIgc2VydmljZSBmb3IgdGhlIHVuZGVybHlpbmcgbWFwcyBpbXBsZW1lbnRhdGlvbnMuXG4gICAgICogR2VuZXJhbGx5IHByb3ZpZGVkIHZpYSBpbmplY3Rpb25zLlxuICAgICAqIEBwYXJhbSBfY29udGFpbmVyUmVmIC0gUmVmZXJlbmNlIHRvIHRoZSBjb250YWluZXIgaG9zdGluZyB0aGUgbWFwIGNhbnZhcy4gR2VuZXJhbGx5IHByb3ZpZGVkIHZpYSBpbmplY3Rpb24uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX2xheWVyU2VydmljZTogTGF5ZXJTZXJ2aWNlLCBwcm90ZWN0ZWQgX2NvbnRhaW5lclJlZjogVmlld0NvbnRhaW5lclJlZikge1xuICAgICAgICB0aGlzLl9pZCA9IGxheWVySWQrKztcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHVibGljIG1ldGhvZHNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBvbiBDb21wb25lbnQgaW5pdGlhbGl6YXRpb24uIFBhcnQgb2YgbmcgQ29tcG9uZW50IGxpZmUgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lclJlZi5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQuYXR0cmlidXRlc1snbGF5ZXJJZCddID0gdGhpcy5faWQudG9TdHJpbmcoKTtcbiAgICAgICAgdGhpcy5fbGF5ZXJTZXJ2aWNlLkFkZExheWVyKHRoaXMpO1xuICAgICAgICB0aGlzLl9hZGRlZFRvTWFuYWdlciA9IHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gY2hhbmdlcyB0byB0aGUgZGF0YWJvdWQgcHJvcGVydGllcyBvY2N1ci4gUGFydCBvZiB0aGUgbmcgQ29tcG9uZW50IGxpZmUgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhbmdlcyAtIENoYW5nZXMgdGhhdCBoYXZlIG9jY3VyZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwTGF5ZXJEaXJlY3RpdmVcbiAgICAgKi9cbiAgICBwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogeyBbcHJvcE5hbWU6IHN0cmluZ106IFNpbXBsZUNoYW5nZSB9KTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5fYWRkZWRUb01hbmFnZXIpIHsgcmV0dXJuOyB9XG4gICAgICAgIGlmIChjaGFuZ2VzWydWaXNpYmxlJ10pIHtcbiAgICAgICAgICAgIHRoaXMuX2xheWVyU2VydmljZS5HZXROYXRpdmVMYXllcih0aGlzKS50aGVuKGwgPT4ge1xuICAgICAgICAgICAgICAgIGwuU2V0VmlzaWJsZSghbC5HZXRWaXNpYmxlKCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgb24gY29tcG9uZW50IGRlc3RydWN0aW9uLiBGcmVlcyB0aGUgcmVzb3VyY2VzIHVzZWQgYnkgdGhlIGNvbXBvbmVudC4gUGFydCBvZiB0aGUgbmcgQ29tcG9uZW50IGxpZmUgY3ljbGUuXG4gICAgICpcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBMYXllckRpcmVjdGl2ZVxuICAgICAqL1xuICAgIHB1YmxpYyBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbGF5ZXJTZXJ2aWNlLkRlbGV0ZUxheWVyKHRoaXMpO1xuICAgIH1cbn1cbiJdfQ==