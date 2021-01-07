import { Injectable, NgZone } from '@angular/core';
import { MapAPILoader, WindowRef, DocumentRef } from '../mapapiloader';
import { BingMapAPILoader, BingMapAPILoaderConfig } from './bing-map.api-loader.service';
import { BingInfoBoxService } from './bing-infobox.service';
import { BingMarkerService } from './bing-marker.service';
import { BingMapService } from './bing-map.service';
import { BingLayerService } from './bing-layer.service';
import { BingClusterService } from './bing-cluster.service';
import { BingPolygonService } from './bing-polygon.service';
import { BingPolylineService } from './bing-polyline.service';
/**
 * Implements a factory to create thre necessary Bing Maps V8 specific service instances.
 *
 * @export
 */
export class BingMapServiceFactory {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingMapServiceFactory.
     * @param _loader - {@link MapAPILoader} implementation for the Bing Map V8 provider.
     * @param _zone - NgZone object to implement zone aware promises.
     *
     * @memberof BingMapServiceFactory
     */
    constructor(_loader, _zone) {
        this._loader = _loader;
        this._zone = _zone;
    }
    ///
    /// Public methods and MapServiceFactory implementation.
    ///
    /**
     * Creates the map service for the Bing Maps V8 implementation.
     *
     * @returns - {@link MapService}. A concreted instance of the {@link BingMapService}.
     *
     * @memberof BingMapServiceFactory
     */
    Create() {
        return new BingMapService(this._loader, this._zone);
    }
    /**
     * Creates the cluster service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link BingMapService}.
     * @returns - {@link ClusterService}. A concreted instance of the {@link BingClusterService}.
     *
     * @memberof BingMapServiceFactory
     */
    CreateClusterService(_mapService) {
        return new BingClusterService(_mapService, this._zone);
    }
    /**
     * Creates thh info box service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link BingMapService}.
     * @returns - {@link InfoBoxService}. A concreted instance of the {@link BingInfoBoxService}.
     *
     * @memberof BingMapServiceFactory
     */
    CreateInfoBoxService(_mapService) {
        return new BingInfoBoxService(_mapService, this._zone);
    }
    /**
     * Creates the layer service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link BingMapService}.
     * @returns - {@link LayerService}. A concreted instance of the {@link BingLayerService}.
     *
     * @memberof BingMapServiceFactory
     */
    CreateLayerService(_mapService) {
        return new BingLayerService(_mapService, this._zone);
    }
    /**
     * Creates the marker service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link BingMapService}.
     * @param layers - {@link LayerService}. A concreted instance of the {@link BingLayerService}.
     * @param clusters  - {@link ClusterService}. A concreted instance of the {@link BingClusterService}.
     * @returns - {@link MarkerService}. A concreted instance of the {@link BingMarkerService}.
     *
     * @memberof BingMapServiceFactory
     */
    CreateMarkerService(_mapService, _layerService, _clusterService) {
        return new BingMarkerService(_mapService, _layerService, _clusterService, this._zone);
    }
    /**
     * Creates the polygon service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService} implementation for thh underlying map archticture.
     * @param layers - {@link LayerService} implementation for the underlying map architecture.
     * @returns - {@link PolygonService} implementation for the underlying map architecture.
     *
     * @memberof MapServiceFactory
     */
    CreatePolygonService(map, layers) {
        return new BingPolygonService(map, layers, this._zone);
    }
    /**
     * Creates the polyline service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService} implementation for thh underlying map archticture.
     * @param layers - {@link LayerService} implementation for the underlying map architecture.
     * @returns - {@link PolylineService} implementation for the underlying map architecture.
     *
     * @memberof MapServiceFactory
     */
    CreatePolylineService(map, layers) {
        return new BingPolylineService(map, layers, this._zone);
    }
}
BingMapServiceFactory.decorators = [
    { type: Injectable }
];
BingMapServiceFactory.ctorParameters = () => [
    { type: MapAPILoader },
    { type: NgZone }
];
/**
 * Creates a new instance of a plaform specific MapServiceFactory.
 *
 * @export
 * @param apiLoader - An {@link MapAPILoader} instance. This is expected to the a {@link BingMapAPILoader}.
 * @param zone - An NgZone instance to provide zone aware promises.
 *
 * @returns -  A {@link MapServiceFactory} instance.
 */
export function BingMapServiceFactoryFactory(apiLoader, zone) {
    return new BingMapServiceFactory(apiLoader, zone);
}
/**
 * Creates a new instance of a plaform specific MapLoaderFactory.
 *
 * @export
 * @returns - A {@link MapAPILoader} instance.
 */
export function BingMapLoaderFactory() {
    return new BingMapAPILoader(new BingMapAPILoaderConfig(), new WindowRef(), new DocumentRef());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1tYXAuc2VydmljZS5mYWN0b3J5LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL3NlcnZpY2VzL2JpbmcvYmluZy1tYXAuc2VydmljZS5mYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBR25ELE9BQU8sRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBT3ZFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxzQkFBc0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3pGLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQzVELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBQzFELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNwRCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUN4RCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUM1RCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUM1RCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUU5RDs7OztHQUlHO0FBRUgsTUFBTSxPQUFPLHFCQUFxQjtJQUU5QixHQUFHO0lBQ0gsZUFBZTtJQUNmLEdBQUc7SUFFSDs7Ozs7O09BTUc7SUFDSCxZQUFvQixPQUFxQixFQUFVLEtBQWE7UUFBNUMsWUFBTyxHQUFQLE9BQU8sQ0FBYztRQUFVLFVBQUssR0FBTCxLQUFLLENBQVE7SUFBSSxDQUFDO0lBRXJFLEdBQUc7SUFDSCx3REFBd0Q7SUFDeEQsR0FBRztJQUVIOzs7Ozs7T0FNRztJQUNJLE1BQU07UUFDVCxPQUFPLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksb0JBQW9CLENBQUMsV0FBMkI7UUFDbkQsT0FBTyxJQUFJLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxvQkFBb0IsQ0FBQyxXQUEyQjtRQUNuRCxPQUFPLElBQUksa0JBQWtCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLGtCQUFrQixDQUFDLFdBQTJCO1FBQ2pELE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSSxtQkFBbUIsQ0FBQyxXQUEyQixFQUNsRCxhQUErQixFQUFFLGVBQW1DO1FBQ3BFLE9BQU8sSUFBSSxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsYUFBYSxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUYsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0ksb0JBQW9CLENBQUMsR0FBZSxFQUFFLE1BQW9CO1FBQzdELE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSSxxQkFBcUIsQ0FBQyxHQUFlLEVBQUUsTUFBb0I7UUFDOUQsT0FBTyxJQUFJLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzVELENBQUM7OztZQTFHSixVQUFVOzs7WUFyQkYsWUFBWTtZQUhBLE1BQU07O0FBc0kzQjs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSw0QkFBNEIsQ0FBQyxTQUF1QixFQUFFLElBQVk7SUFDOUUsT0FBTyxJQUFJLHFCQUFxQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2hDLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLHNCQUFzQixFQUFFLEVBQUUsSUFBSSxTQUFTLEVBQUUsRUFBRSxJQUFJLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDbEcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIE5nWm9uZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTWFwU2VydmljZUZhY3RvcnkgfSBmcm9tICcuLi9tYXBzZXJ2aWNlZmFjdG9yeSc7XG5pbXBvcnQgeyBNYXBTZXJ2aWNlIH0gZnJvbSAnLi4vbWFwLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWFwQVBJTG9hZGVyLCBXaW5kb3dSZWYsIERvY3VtZW50UmVmIH0gZnJvbSAnLi4vbWFwYXBpbG9hZGVyJztcbmltcG9ydCB7IE1hcmtlclNlcnZpY2UgfSBmcm9tICcuLi9tYXJrZXIuc2VydmljZSc7XG5pbXBvcnQgeyBJbmZvQm94U2VydmljZSB9IGZyb20gJy4uL2luZm9ib3guc2VydmljZSc7XG5pbXBvcnQgeyBMYXllclNlcnZpY2UgfSBmcm9tICcuLi9sYXllci5zZXJ2aWNlJztcbmltcG9ydCB7IENsdXN0ZXJTZXJ2aWNlIH0gZnJvbSAnLi4vY2x1c3Rlci5zZXJ2aWNlJztcbmltcG9ydCB7IFBvbHlnb25TZXJ2aWNlIH0gZnJvbSAnLi4vcG9seWdvbi5zZXJ2aWNlJztcbmltcG9ydCB7IFBvbHlsaW5lU2VydmljZSB9IGZyb20gJy4uL3BvbHlsaW5lLnNlcnZpY2UnO1xuaW1wb3J0IHsgQmluZ01hcEFQSUxvYWRlciwgQmluZ01hcEFQSUxvYWRlckNvbmZpZyB9IGZyb20gJy4vYmluZy1tYXAuYXBpLWxvYWRlci5zZXJ2aWNlJztcbmltcG9ydCB7IEJpbmdJbmZvQm94U2VydmljZSB9IGZyb20gJy4vYmluZy1pbmZvYm94LnNlcnZpY2UnO1xuaW1wb3J0IHsgQmluZ01hcmtlclNlcnZpY2UgfSBmcm9tICcuL2JpbmctbWFya2VyLnNlcnZpY2UnO1xuaW1wb3J0IHsgQmluZ01hcFNlcnZpY2UgfSBmcm9tICcuL2JpbmctbWFwLnNlcnZpY2UnO1xuaW1wb3J0IHsgQmluZ0xheWVyU2VydmljZSB9IGZyb20gJy4vYmluZy1sYXllci5zZXJ2aWNlJztcbmltcG9ydCB7IEJpbmdDbHVzdGVyU2VydmljZSB9IGZyb20gJy4vYmluZy1jbHVzdGVyLnNlcnZpY2UnO1xuaW1wb3J0IHsgQmluZ1BvbHlnb25TZXJ2aWNlIH0gZnJvbSAnLi9iaW5nLXBvbHlnb24uc2VydmljZSc7XG5pbXBvcnQgeyBCaW5nUG9seWxpbmVTZXJ2aWNlIH0gZnJvbSAnLi9iaW5nLXBvbHlsaW5lLnNlcnZpY2UnO1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBmYWN0b3J5IHRvIGNyZWF0ZSB0aHJlIG5lY2Vzc2FyeSBCaW5nIE1hcHMgVjggc3BlY2lmaWMgc2VydmljZSBpbnN0YW5jZXMuXG4gKlxuICogQGV4cG9ydFxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQmluZ01hcFNlcnZpY2VGYWN0b3J5IGltcGxlbWVudHMgTWFwU2VydmljZUZhY3Rvcnkge1xuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIEJpbmdNYXBTZXJ2aWNlRmFjdG9yeS5cbiAgICAgKiBAcGFyYW0gX2xvYWRlciAtIHtAbGluayBNYXBBUElMb2FkZXJ9IGltcGxlbWVudGF0aW9uIGZvciB0aGUgQmluZyBNYXAgVjggcHJvdmlkZXIuXG4gICAgICogQHBhcmFtIF96b25lIC0gTmdab25lIG9iamVjdCB0byBpbXBsZW1lbnQgem9uZSBhd2FyZSBwcm9taXNlcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwU2VydmljZUZhY3RvcnlcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9sb2FkZXI6IE1hcEFQSUxvYWRlciwgcHJpdmF0ZSBfem9uZTogTmdab25lKSB7IH1cblxuICAgIC8vL1xuICAgIC8vLyBQdWJsaWMgbWV0aG9kcyBhbmQgTWFwU2VydmljZUZhY3RvcnkgaW1wbGVtZW50YXRpb24uXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoZSBtYXAgc2VydmljZSBmb3IgdGhlIEJpbmcgTWFwcyBWOCBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIC0ge0BsaW5rIE1hcFNlcnZpY2V9LiBBIGNvbmNyZXRlZCBpbnN0YW5jZSBvZiB0aGUge0BsaW5rIEJpbmdNYXBTZXJ2aWNlfS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwU2VydmljZUZhY3RvcnlcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlKCk6IE1hcFNlcnZpY2Uge1xuICAgICAgICByZXR1cm4gbmV3IEJpbmdNYXBTZXJ2aWNlKHRoaXMuX2xvYWRlciwgdGhpcy5fem9uZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgY2x1c3RlciBzZXJ2aWNlIGZvciB0aGUgQmluZyBNYXBzIFY4IGltcGxlbWVudGF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1hcCAtIHtAbGluayBNYXBTZXJ2aWNlfS4gQSBjb25jcmV0ZWQgaW5zdGFuY2Ugb2YgdGhlIHtAbGluayBCaW5nTWFwU2VydmljZX0uXG4gICAgICogQHJldHVybnMgLSB7QGxpbmsgQ2x1c3RlclNlcnZpY2V9LiBBIGNvbmNyZXRlZCBpbnN0YW5jZSBvZiB0aGUge0BsaW5rIEJpbmdDbHVzdGVyU2VydmljZX0uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcFNlcnZpY2VGYWN0b3J5XG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZUNsdXN0ZXJTZXJ2aWNlKF9tYXBTZXJ2aWNlOiBCaW5nTWFwU2VydmljZSk6IENsdXN0ZXJTZXJ2aWNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBCaW5nQ2x1c3RlclNlcnZpY2UoX21hcFNlcnZpY2UsIHRoaXMuX3pvbmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhoIGluZm8gYm94IHNlcnZpY2UgZm9yIHRoZSBCaW5nIE1hcHMgVjggaW1wbGVtZW50YXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWFwIC0ge0BsaW5rIE1hcFNlcnZpY2V9LiBBIGNvbmNyZXRlZCBpbnN0YW5jZSBvZiB0aGUge0BsaW5rIEJpbmdNYXBTZXJ2aWNlfS5cbiAgICAgKiBAcmV0dXJucyAtIHtAbGluayBJbmZvQm94U2VydmljZX0uIEEgY29uY3JldGVkIGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgQmluZ0luZm9Cb3hTZXJ2aWNlfS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwU2VydmljZUZhY3RvcnlcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlSW5mb0JveFNlcnZpY2UoX21hcFNlcnZpY2U6IEJpbmdNYXBTZXJ2aWNlKTogSW5mb0JveFNlcnZpY2Uge1xuICAgICAgICByZXR1cm4gbmV3IEJpbmdJbmZvQm94U2VydmljZShfbWFwU2VydmljZSwgdGhpcy5fem9uZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgbGF5ZXIgc2VydmljZSBmb3IgdGhlIEJpbmcgTWFwcyBWOCBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtYXAgLSB7QGxpbmsgTWFwU2VydmljZX0uIEEgY29uY3JldGVkIGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgQmluZ01hcFNlcnZpY2V9LlxuICAgICAqIEByZXR1cm5zIC0ge0BsaW5rIExheWVyU2VydmljZX0uIEEgY29uY3JldGVkIGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgQmluZ0xheWVyU2VydmljZX0uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcFNlcnZpY2VGYWN0b3J5XG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZUxheWVyU2VydmljZShfbWFwU2VydmljZTogQmluZ01hcFNlcnZpY2UpOiBMYXllclNlcnZpY2Uge1xuICAgICAgICByZXR1cm4gbmV3IEJpbmdMYXllclNlcnZpY2UoX21hcFNlcnZpY2UsIHRoaXMuX3pvbmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhlIG1hcmtlciBzZXJ2aWNlIGZvciB0aGUgQmluZyBNYXBzIFY4IGltcGxlbWVudGF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1hcCAtIHtAbGluayBNYXBTZXJ2aWNlfS4gQSBjb25jcmV0ZWQgaW5zdGFuY2Ugb2YgdGhlIHtAbGluayBCaW5nTWFwU2VydmljZX0uXG4gICAgICogQHBhcmFtIGxheWVycyAtIHtAbGluayBMYXllclNlcnZpY2V9LiBBIGNvbmNyZXRlZCBpbnN0YW5jZSBvZiB0aGUge0BsaW5rIEJpbmdMYXllclNlcnZpY2V9LlxuICAgICAqIEBwYXJhbSBjbHVzdGVycyAgLSB7QGxpbmsgQ2x1c3RlclNlcnZpY2V9LiBBIGNvbmNyZXRlZCBpbnN0YW5jZSBvZiB0aGUge0BsaW5rIEJpbmdDbHVzdGVyU2VydmljZX0uXG4gICAgICogQHJldHVybnMgLSB7QGxpbmsgTWFya2VyU2VydmljZX0uIEEgY29uY3JldGVkIGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgQmluZ01hcmtlclNlcnZpY2V9LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBTZXJ2aWNlRmFjdG9yeVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVNYXJrZXJTZXJ2aWNlKF9tYXBTZXJ2aWNlOiBCaW5nTWFwU2VydmljZSxcbiAgICAgICAgX2xheWVyU2VydmljZTogQmluZ0xheWVyU2VydmljZSwgX2NsdXN0ZXJTZXJ2aWNlOiBCaW5nQ2x1c3RlclNlcnZpY2UpOiBNYXJrZXJTZXJ2aWNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBCaW5nTWFya2VyU2VydmljZShfbWFwU2VydmljZSwgX2xheWVyU2VydmljZSwgX2NsdXN0ZXJTZXJ2aWNlLCB0aGlzLl96b25lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoZSBwb2x5Z29uIHNlcnZpY2UgZm9yIHRoZSBCaW5nIE1hcHMgVjggaW1wbGVtZW50YXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWFwIC0ge0BsaW5rIE1hcFNlcnZpY2V9IGltcGxlbWVudGF0aW9uIGZvciB0aGggdW5kZXJseWluZyBtYXAgYXJjaHRpY3R1cmUuXG4gICAgICogQHBhcmFtIGxheWVycyAtIHtAbGluayBMYXllclNlcnZpY2V9IGltcGxlbWVudGF0aW9uIGZvciB0aGUgdW5kZXJseWluZyBtYXAgYXJjaGl0ZWN0dXJlLlxuICAgICAqIEByZXR1cm5zIC0ge0BsaW5rIFBvbHlnb25TZXJ2aWNlfSBpbXBsZW1lbnRhdGlvbiBmb3IgdGhlIHVuZGVybHlpbmcgbWFwIGFyY2hpdGVjdHVyZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBTZXJ2aWNlRmFjdG9yeVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVQb2x5Z29uU2VydmljZShtYXA6IE1hcFNlcnZpY2UsIGxheWVyczogTGF5ZXJTZXJ2aWNlKTogUG9seWdvblNlcnZpY2Uge1xuICAgICAgICByZXR1cm4gbmV3IEJpbmdQb2x5Z29uU2VydmljZShtYXAsIGxheWVycywgdGhpcy5fem9uZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgcG9seWxpbmUgc2VydmljZSBmb3IgdGhlIEJpbmcgTWFwcyBWOCBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtYXAgLSB7QGxpbmsgTWFwU2VydmljZX0gaW1wbGVtZW50YXRpb24gZm9yIHRoaCB1bmRlcmx5aW5nIG1hcCBhcmNodGljdHVyZS5cbiAgICAgKiBAcGFyYW0gbGF5ZXJzIC0ge0BsaW5rIExheWVyU2VydmljZX0gaW1wbGVtZW50YXRpb24gZm9yIHRoZSB1bmRlcmx5aW5nIG1hcCBhcmNoaXRlY3R1cmUuXG4gICAgICogQHJldHVybnMgLSB7QGxpbmsgUG9seWxpbmVTZXJ2aWNlfSBpbXBsZW1lbnRhdGlvbiBmb3IgdGhlIHVuZGVybHlpbmcgbWFwIGFyY2hpdGVjdHVyZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBTZXJ2aWNlRmFjdG9yeVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVQb2x5bGluZVNlcnZpY2UobWFwOiBNYXBTZXJ2aWNlLCBsYXllcnM6IExheWVyU2VydmljZSk6IFBvbHlsaW5lU2VydmljZSB7XG4gICAgICAgIHJldHVybiBuZXcgQmluZ1BvbHlsaW5lU2VydmljZShtYXAsIGxheWVycywgdGhpcy5fem9uZSk7XG4gICAgfVxuXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIHBsYWZvcm0gc3BlY2lmaWMgTWFwU2VydmljZUZhY3RvcnkuXG4gKlxuICogQGV4cG9ydFxuICogQHBhcmFtIGFwaUxvYWRlciAtIEFuIHtAbGluayBNYXBBUElMb2FkZXJ9IGluc3RhbmNlLiBUaGlzIGlzIGV4cGVjdGVkIHRvIHRoZSBhIHtAbGluayBCaW5nTWFwQVBJTG9hZGVyfS5cbiAqIEBwYXJhbSB6b25lIC0gQW4gTmdab25lIGluc3RhbmNlIHRvIHByb3ZpZGUgem9uZSBhd2FyZSBwcm9taXNlcy5cbiAqXG4gKiBAcmV0dXJucyAtICBBIHtAbGluayBNYXBTZXJ2aWNlRmFjdG9yeX0gaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBCaW5nTWFwU2VydmljZUZhY3RvcnlGYWN0b3J5KGFwaUxvYWRlcjogTWFwQVBJTG9hZGVyLCB6b25lOiBOZ1pvbmUpOiBNYXBTZXJ2aWNlRmFjdG9yeSB7XG4gICAgcmV0dXJuIG5ldyBCaW5nTWFwU2VydmljZUZhY3RvcnkoYXBpTG9hZGVyLCB6b25lKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgcGxhZm9ybSBzcGVjaWZpYyBNYXBMb2FkZXJGYWN0b3J5LlxuICpcbiAqIEBleHBvcnRcbiAqIEByZXR1cm5zIC0gQSB7QGxpbmsgTWFwQVBJTG9hZGVyfSBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEJpbmdNYXBMb2FkZXJGYWN0b3J5KCk6IE1hcEFQSUxvYWRlciB7XG4gICAgcmV0dXJuIG5ldyBCaW5nTWFwQVBJTG9hZGVyKG5ldyBCaW5nTWFwQVBJTG9hZGVyQ29uZmlnKCksIG5ldyBXaW5kb3dSZWYoKSwgbmV3IERvY3VtZW50UmVmKCkpO1xufVxuIl19