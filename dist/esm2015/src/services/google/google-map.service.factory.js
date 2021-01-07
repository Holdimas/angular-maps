import { Injectable, NgZone } from '@angular/core';
import { MapAPILoader, WindowRef, DocumentRef } from '../mapapiloader';
import { GoogleMapAPILoader, GoogleMapAPILoaderConfig } from './google-map-api-loader.service';
import { GoogleInfoBoxService } from './google-infobox.service';
import { GoogleMarkerService } from './google-marker.service';
import { GoogleMapService } from './google-map.service';
import { GoogleLayerService } from './google-layer.service';
import { GoogleClusterService } from './google-cluster.service';
import { GooglePolygonService } from './google-polygon.service';
import { GooglePolylineService } from './google-polyline.service';
/**
 * Implements a factory to create three necessary Google Maps specific service instances.
 *
 * @export
 */
export class GoogleMapServiceFactory {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GoogleMapServiceFactory.
     * @param _loader - {@link MapAPILoader} implementation for the Google Map provider.
     * @param _zone - NgZone object to implement zone aware promises.
     *
     * @memberof GoogleMapServiceFactory
     */
    constructor(_loader, _zone) {
        this._loader = _loader;
        this._zone = _zone;
        this._map =
            new Promise((resolve) => { this._mapResolver = resolve; });
    }
    ///
    /// Public methods and MapServiceFactory implementation.
    ///
    /**
     * Creates the map service for the Google Maps implementation.
     *
     * @returns - {@link MapService}. A concreted instance of the {@link GoogleMapService}.
     *
     * @memberof GoogleMapServiceFactory
     */
    Create() {
        return new GoogleMapService(this._loader, this._zone);
    }
    /**
     * Creates the cluster service for the Google Maps implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link GoogleMapService}.
     * @returns - {@link ClusterService}. A concreted instance of the {@link GoogleClusterService}.
     *
     * @memberof GoogleMapServiceFactory
     */
    CreateClusterService(_mapService) {
        return new GoogleClusterService(_mapService, this._zone);
    }
    /**
     * Creates thh info box service for the Google Maps implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link GoogleMapService}.
     * @param map - {@link MarkerService}. A concreted instance of the {@link GoogleMarkerService}.
     * @returns - {@link InfoBoxService}. A concreted instance of the {@link GoogleInfoBoxService}.
     *
     * @memberof GoogleMapServiceFactory
     */
    CreateInfoBoxService(_mapService, _markerService) {
        return new GoogleInfoBoxService(_mapService, _markerService, this._zone);
    }
    /**
     * Creates the layer service for the Google Maps implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link GoogleMapService}.
     * @returns - {@link LayerService}. A concreted instance of the {@link GoogleLayerService}.
     *
     * @memberof GoogleMapServiceFactory
     */
    CreateLayerService(_mapService) {
        return new GoogleLayerService(_mapService, this._zone);
    }
    /**
     * Creates the marker service for the Google Maps implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link GoogleMapService}.
     * @param layers - {@link LayerService}. A concreted instance of the {@link GoogleLayerService}.
     * @param clusters  - {@link ClusterService}. A concreted instance of the {@link GoogleClusterService}.
     * @returns - {@link MarkerService}. A concreted instance of the {@link GoogleMarkerService}.
     *
     * @memberof GoogleMapServiceFactory
     */
    CreateMarkerService(_mapService, _layerService, _clusterService) {
        return new GoogleMarkerService(_mapService, _layerService, _clusterService, this._zone);
    }
    /**
     * Creates the polygon service for the Google Maps implementation.
     *
     * @param map - {@link MapService} implementation for thh underlying map archticture.
     * @param layers - {@link LayerService} implementation for the underlying map architecture.
     * @returns - {@link PolygonService} implementation for the underlying map architecture.
     *
     * @memberof MapServiceFactory
     */
    CreatePolygonService(map, layers) {
        return new GooglePolygonService(map, layers, this._zone);
    }
    /**
     * Creates the polyline service for the Google Maps implementation.
     *
     * @param map - {@link MapService} implementation for thh underlying map archticture.
     * @param layers - {@link LayerService} implementation for the underlying map architecture.
     * @returns - {@link PolylineService} implementation for the underlying map architecture.
     *
     * @memberof MapServiceFactory
     */
    CreatePolylineService(map, layers) {
        return new GooglePolylineService(map, layers, this._zone);
    }
}
GoogleMapServiceFactory.decorators = [
    { type: Injectable }
];
GoogleMapServiceFactory.ctorParameters = () => [
    { type: MapAPILoader },
    { type: NgZone }
];
/**
 *  Creates a new instance of a plaform specific MapServiceFactory.
 *
 * @param apiLoader - An {@link MapAPILoader} instance. This is expected to the a {@link GoogleMapAPILoader}.
 * @param zone - An NgZone instance to provide zone aware promises.
 *
 * @returns - A {@link MapServiceFactory} instance.
 */
export function GoogleMapServiceFactoryFactory(apiLoader, zone) {
    return new GoogleMapServiceFactory(apiLoader, zone);
}
/**
 * Creates a new instance of a plaform specific MapLoaderFactory.
 *
 * @export
 * @returns - A {@link MapAPILoader} instance.
 */
export function GoogleMapLoaderFactory() {
    return new GoogleMapAPILoader(new GoogleMapAPILoaderConfig(), new WindowRef(), new DocumentRef());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLW1hcC5zZXJ2aWNlLmZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1tYXAuc2VydmljZS5mYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBR25ELE9BQU8sRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBVXZFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSx3QkFBd0IsRUFBRSxNQUFNLGlDQUFpQyxDQUFDO0FBQy9GLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQ2hFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQzlELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ3hELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQzVELE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQ2hFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQ2hFLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRWxFOzs7O0dBSUc7QUFFSCxNQUFNLE9BQU8sdUJBQXVCO0lBSWhDLEdBQUc7SUFDSCxlQUFlO0lBQ2YsR0FBRztJQUVIOzs7Ozs7T0FNRztJQUNILFlBQW9CLE9BQXFCLEVBQVUsS0FBYTtRQUE1QyxZQUFPLEdBQVAsT0FBTyxDQUFjO1FBQVUsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUM1RCxJQUFJLENBQUMsSUFBSTtZQUNMLElBQUksT0FBTyxDQUEyQixDQUFDLE9BQW1CLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekcsQ0FBQztJQUVELEdBQUc7SUFDSCx3REFBd0Q7SUFDeEQsR0FBRztJQUVIOzs7Ozs7T0FNRztJQUNJLE1BQU07UUFDVCxPQUFPLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxvQkFBb0IsQ0FBQyxXQUF1QjtRQUMvQyxPQUFPLElBQUksb0JBQW9CLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSSxvQkFBb0IsQ0FBQyxXQUF1QixFQUFFLGNBQTZCO1FBQzlFLE9BQU8sSUFBSSxvQkFBb0IsQ0FBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLGtCQUFrQixDQUFDLFdBQXVCO1FBQzdDLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSSxtQkFBbUIsQ0FBQyxXQUF1QixFQUFFLGFBQWlDLEVBQUUsZUFBcUM7UUFDeEgsT0FBTyxJQUFJLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxhQUFhLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1RixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSSxvQkFBb0IsQ0FBQyxHQUFlLEVBQUUsTUFBb0I7UUFDN0QsT0FBTyxJQUFJLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNJLHFCQUFxQixDQUFDLEdBQWUsRUFBRSxNQUFvQjtRQUM5RCxPQUFPLElBQUkscUJBQXFCLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUQsQ0FBQzs7O1lBL0dKLFVBQVU7OztZQXhCRixZQUFZO1lBSEEsTUFBTTs7QUE4STNCOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsOEJBQThCLENBQUMsU0FBdUIsRUFBRSxJQUFZO0lBQ2hGLE9BQU8sSUFBSSx1QkFBdUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQjtJQUNsQyxPQUFPLElBQUksa0JBQWtCLENBQUMsSUFBSSx3QkFBd0IsRUFBRSxFQUFFLElBQUksU0FBUyxFQUFFLEVBQUUsSUFBSSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQ3RHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBOZ1pvbmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE1hcFNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi4vbWFwc2VydmljZWZhY3RvcnknO1xuaW1wb3J0IHsgTWFwU2VydmljZSB9IGZyb20gJy4uL21hcC5zZXJ2aWNlJztcbmltcG9ydCB7IE1hcEFQSUxvYWRlciwgV2luZG93UmVmLCBEb2N1bWVudFJlZiB9IGZyb20gJy4uL21hcGFwaWxvYWRlcic7XG5pbXBvcnQgeyBNYXJrZXJTZXJ2aWNlIH0gZnJvbSAnLi4vbWFya2VyLnNlcnZpY2UnO1xuaW1wb3J0IHsgSW5mb0JveFNlcnZpY2UgfSBmcm9tICcuLi9pbmZvYm94LnNlcnZpY2UnO1xuaW1wb3J0IHsgTGF5ZXJTZXJ2aWNlIH0gZnJvbSAnLi4vbGF5ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBDbHVzdGVyU2VydmljZSB9IGZyb20gJy4uL2NsdXN0ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBQb2x5Z29uU2VydmljZSB9IGZyb20gJy4uL3BvbHlnb24uc2VydmljZSc7XG5pbXBvcnQgeyBQb2x5bGluZVNlcnZpY2UgfSBmcm9tICcuLi9wb2x5bGluZS5zZXJ2aWNlJztcblxuaW1wb3J0ICogYXMgR29vZ2xlTWFwVHlwZXMgZnJvbSAnLi9nb29nbGUtbWFwLXR5cGVzJztcblxuaW1wb3J0IHsgR29vZ2xlTWFwQVBJTG9hZGVyLCBHb29nbGVNYXBBUElMb2FkZXJDb25maWcgfSBmcm9tICcuL2dvb2dsZS1tYXAtYXBpLWxvYWRlci5zZXJ2aWNlJztcbmltcG9ydCB7IEdvb2dsZUluZm9Cb3hTZXJ2aWNlIH0gZnJvbSAnLi9nb29nbGUtaW5mb2JveC5zZXJ2aWNlJztcbmltcG9ydCB7IEdvb2dsZU1hcmtlclNlcnZpY2UgfSBmcm9tICcuL2dvb2dsZS1tYXJrZXIuc2VydmljZSc7XG5pbXBvcnQgeyBHb29nbGVNYXBTZXJ2aWNlIH0gZnJvbSAnLi9nb29nbGUtbWFwLnNlcnZpY2UnO1xuaW1wb3J0IHsgR29vZ2xlTGF5ZXJTZXJ2aWNlIH0gZnJvbSAnLi9nb29nbGUtbGF5ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBHb29nbGVDbHVzdGVyU2VydmljZSB9IGZyb20gJy4vZ29vZ2xlLWNsdXN0ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBHb29nbGVQb2x5Z29uU2VydmljZSB9IGZyb20gJy4vZ29vZ2xlLXBvbHlnb24uc2VydmljZSc7XG5pbXBvcnQgeyBHb29nbGVQb2x5bGluZVNlcnZpY2UgfSBmcm9tICcuL2dvb2dsZS1wb2x5bGluZS5zZXJ2aWNlJztcblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgZmFjdG9yeSB0byBjcmVhdGUgdGhyZWUgbmVjZXNzYXJ5IEdvb2dsZSBNYXBzIHNwZWNpZmljIHNlcnZpY2UgaW5zdGFuY2VzLlxuICpcbiAqIEBleHBvcnRcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEdvb2dsZU1hcFNlcnZpY2VGYWN0b3J5IGltcGxlbWVudHMgTWFwU2VydmljZUZhY3Rvcnkge1xuICAgIHByaXZhdGUgX21hcDogUHJvbWlzZTxHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXA+O1xuICAgIHByaXZhdGUgX21hcFJlc29sdmVyOiAodmFsdWU/OiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXApID0+IHZvaWQ7XG5cbiAgICAvLy9cbiAgICAvLy8gQ29uc3RydWN0b3JcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgR29vZ2xlTWFwU2VydmljZUZhY3RvcnkuXG4gICAgICogQHBhcmFtIF9sb2FkZXIgLSB7QGxpbmsgTWFwQVBJTG9hZGVyfSBpbXBsZW1lbnRhdGlvbiBmb3IgdGhlIEdvb2dsZSBNYXAgcHJvdmlkZXIuXG4gICAgICogQHBhcmFtIF96b25lIC0gTmdab25lIG9iamVjdCB0byBpbXBsZW1lbnQgem9uZSBhd2FyZSBwcm9taXNlcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXBTZXJ2aWNlRmFjdG9yeVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2xvYWRlcjogTWFwQVBJTG9hZGVyLCBwcml2YXRlIF96b25lOiBOZ1pvbmUpIHtcbiAgICAgICAgdGhpcy5fbWFwID1cbiAgICAgICAgICAgIG5ldyBQcm9taXNlPEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcD4oKHJlc29sdmU6ICgpID0+IHZvaWQpID0+IHsgdGhpcy5fbWFwUmVzb2x2ZXIgPSByZXNvbHZlOyB9KTtcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHVibGljIG1ldGhvZHMgYW5kIE1hcFNlcnZpY2VGYWN0b3J5IGltcGxlbWVudGF0aW9uLlxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgbWFwIHNlcnZpY2UgZm9yIHRoZSBHb29nbGUgTWFwcyBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIC0ge0BsaW5rIE1hcFNlcnZpY2V9LiBBIGNvbmNyZXRlZCBpbnN0YW5jZSBvZiB0aGUge0BsaW5rIEdvb2dsZU1hcFNlcnZpY2V9LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcFNlcnZpY2VGYWN0b3J5XG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZSgpOiBNYXBTZXJ2aWNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBHb29nbGVNYXBTZXJ2aWNlKHRoaXMuX2xvYWRlciwgdGhpcy5fem9uZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgY2x1c3RlciBzZXJ2aWNlIGZvciB0aGUgR29vZ2xlIE1hcHMgaW1wbGVtZW50YXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWFwIC0ge0BsaW5rIE1hcFNlcnZpY2V9LiBBIGNvbmNyZXRlZCBpbnN0YW5jZSBvZiB0aGUge0BsaW5rIEdvb2dsZU1hcFNlcnZpY2V9LlxuICAgICAqIEByZXR1cm5zIC0ge0BsaW5rIENsdXN0ZXJTZXJ2aWNlfS4gQSBjb25jcmV0ZWQgaW5zdGFuY2Ugb2YgdGhlIHtAbGluayBHb29nbGVDbHVzdGVyU2VydmljZX0uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwU2VydmljZUZhY3RvcnlcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlQ2x1c3RlclNlcnZpY2UoX21hcFNlcnZpY2U6IE1hcFNlcnZpY2UpOiBDbHVzdGVyU2VydmljZSB7XG4gICAgICAgIHJldHVybiBuZXcgR29vZ2xlQ2x1c3RlclNlcnZpY2UoX21hcFNlcnZpY2UsIHRoaXMuX3pvbmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhoIGluZm8gYm94IHNlcnZpY2UgZm9yIHRoZSBHb29nbGUgTWFwcyBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtYXAgLSB7QGxpbmsgTWFwU2VydmljZX0uIEEgY29uY3JldGVkIGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgR29vZ2xlTWFwU2VydmljZX0uXG4gICAgICogQHBhcmFtIG1hcCAtIHtAbGluayBNYXJrZXJTZXJ2aWNlfS4gQSBjb25jcmV0ZWQgaW5zdGFuY2Ugb2YgdGhlIHtAbGluayBHb29nbGVNYXJrZXJTZXJ2aWNlfS5cbiAgICAgKiBAcmV0dXJucyAtIHtAbGluayBJbmZvQm94U2VydmljZX0uIEEgY29uY3JldGVkIGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgR29vZ2xlSW5mb0JveFNlcnZpY2V9LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcFNlcnZpY2VGYWN0b3J5XG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZUluZm9Cb3hTZXJ2aWNlKF9tYXBTZXJ2aWNlOiBNYXBTZXJ2aWNlLCBfbWFya2VyU2VydmljZTogTWFya2VyU2VydmljZSkge1xuICAgICAgICByZXR1cm4gbmV3IEdvb2dsZUluZm9Cb3hTZXJ2aWNlKF9tYXBTZXJ2aWNlLCBfbWFya2VyU2VydmljZSwgdGhpcy5fem9uZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgbGF5ZXIgc2VydmljZSBmb3IgdGhlIEdvb2dsZSBNYXBzIGltcGxlbWVudGF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1hcCAtIHtAbGluayBNYXBTZXJ2aWNlfS4gQSBjb25jcmV0ZWQgaW5zdGFuY2Ugb2YgdGhlIHtAbGluayBHb29nbGVNYXBTZXJ2aWNlfS5cbiAgICAgKiBAcmV0dXJucyAtIHtAbGluayBMYXllclNlcnZpY2V9LiBBIGNvbmNyZXRlZCBpbnN0YW5jZSBvZiB0aGUge0BsaW5rIEdvb2dsZUxheWVyU2VydmljZX0uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwU2VydmljZUZhY3RvcnlcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlTGF5ZXJTZXJ2aWNlKF9tYXBTZXJ2aWNlOiBNYXBTZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiBuZXcgR29vZ2xlTGF5ZXJTZXJ2aWNlKF9tYXBTZXJ2aWNlLCB0aGlzLl96b25lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoZSBtYXJrZXIgc2VydmljZSBmb3IgdGhlIEdvb2dsZSBNYXBzIGltcGxlbWVudGF0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1hcCAtIHtAbGluayBNYXBTZXJ2aWNlfS4gQSBjb25jcmV0ZWQgaW5zdGFuY2Ugb2YgdGhlIHtAbGluayBHb29nbGVNYXBTZXJ2aWNlfS5cbiAgICAgKiBAcGFyYW0gbGF5ZXJzIC0ge0BsaW5rIExheWVyU2VydmljZX0uIEEgY29uY3JldGVkIGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgR29vZ2xlTGF5ZXJTZXJ2aWNlfS5cbiAgICAgKiBAcGFyYW0gY2x1c3RlcnMgIC0ge0BsaW5rIENsdXN0ZXJTZXJ2aWNlfS4gQSBjb25jcmV0ZWQgaW5zdGFuY2Ugb2YgdGhlIHtAbGluayBHb29nbGVDbHVzdGVyU2VydmljZX0uXG4gICAgICogQHJldHVybnMgLSB7QGxpbmsgTWFya2VyU2VydmljZX0uIEEgY29uY3JldGVkIGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgR29vZ2xlTWFya2VyU2VydmljZX0uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwU2VydmljZUZhY3RvcnlcbiAgICAgKi9cbiAgICBwdWJsaWMgQ3JlYXRlTWFya2VyU2VydmljZShfbWFwU2VydmljZTogTWFwU2VydmljZSwgX2xheWVyU2VydmljZTogR29vZ2xlTGF5ZXJTZXJ2aWNlLCBfY2x1c3RlclNlcnZpY2U6IEdvb2dsZUNsdXN0ZXJTZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiBuZXcgR29vZ2xlTWFya2VyU2VydmljZShfbWFwU2VydmljZSwgX2xheWVyU2VydmljZSwgX2NsdXN0ZXJTZXJ2aWNlLCB0aGlzLl96b25lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoZSBwb2x5Z29uIHNlcnZpY2UgZm9yIHRoZSBHb29nbGUgTWFwcyBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtYXAgLSB7QGxpbmsgTWFwU2VydmljZX0gaW1wbGVtZW50YXRpb24gZm9yIHRoaCB1bmRlcmx5aW5nIG1hcCBhcmNodGljdHVyZS5cbiAgICAgKiBAcGFyYW0gbGF5ZXJzIC0ge0BsaW5rIExheWVyU2VydmljZX0gaW1wbGVtZW50YXRpb24gZm9yIHRoZSB1bmRlcmx5aW5nIG1hcCBhcmNoaXRlY3R1cmUuXG4gICAgICogQHJldHVybnMgLSB7QGxpbmsgUG9seWdvblNlcnZpY2V9IGltcGxlbWVudGF0aW9uIGZvciB0aGUgdW5kZXJseWluZyBtYXAgYXJjaGl0ZWN0dXJlLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFNlcnZpY2VGYWN0b3J5XG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZVBvbHlnb25TZXJ2aWNlKG1hcDogTWFwU2VydmljZSwgbGF5ZXJzOiBMYXllclNlcnZpY2UpOiBQb2x5Z29uU2VydmljZSB7XG4gICAgICAgIHJldHVybiBuZXcgR29vZ2xlUG9seWdvblNlcnZpY2UobWFwLCBsYXllcnMsIHRoaXMuX3pvbmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhlIHBvbHlsaW5lIHNlcnZpY2UgZm9yIHRoZSBHb29nbGUgTWFwcyBpbXBsZW1lbnRhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtYXAgLSB7QGxpbmsgTWFwU2VydmljZX0gaW1wbGVtZW50YXRpb24gZm9yIHRoaCB1bmRlcmx5aW5nIG1hcCBhcmNodGljdHVyZS5cbiAgICAgKiBAcGFyYW0gbGF5ZXJzIC0ge0BsaW5rIExheWVyU2VydmljZX0gaW1wbGVtZW50YXRpb24gZm9yIHRoZSB1bmRlcmx5aW5nIG1hcCBhcmNoaXRlY3R1cmUuXG4gICAgICogQHJldHVybnMgLSB7QGxpbmsgUG9seWxpbmVTZXJ2aWNlfSBpbXBsZW1lbnRhdGlvbiBmb3IgdGhlIHVuZGVybHlpbmcgbWFwIGFyY2hpdGVjdHVyZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBTZXJ2aWNlRmFjdG9yeVxuICAgICAqL1xuICAgIHB1YmxpYyBDcmVhdGVQb2x5bGluZVNlcnZpY2UobWFwOiBNYXBTZXJ2aWNlLCBsYXllcnM6IExheWVyU2VydmljZSk6IFBvbHlsaW5lU2VydmljZSB7XG4gICAgICAgIHJldHVybiBuZXcgR29vZ2xlUG9seWxpbmVTZXJ2aWNlKG1hcCwgbGF5ZXJzLCB0aGlzLl96b25lKTtcbiAgICB9XG5cbn1cblxuLyoqXG4gKiAgQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIHBsYWZvcm0gc3BlY2lmaWMgTWFwU2VydmljZUZhY3RvcnkuXG4gKlxuICogQHBhcmFtIGFwaUxvYWRlciAtIEFuIHtAbGluayBNYXBBUElMb2FkZXJ9IGluc3RhbmNlLiBUaGlzIGlzIGV4cGVjdGVkIHRvIHRoZSBhIHtAbGluayBHb29nbGVNYXBBUElMb2FkZXJ9LlxuICogQHBhcmFtIHpvbmUgLSBBbiBOZ1pvbmUgaW5zdGFuY2UgdG8gcHJvdmlkZSB6b25lIGF3YXJlIHByb21pc2VzLlxuICpcbiAqIEByZXR1cm5zIC0gQSB7QGxpbmsgTWFwU2VydmljZUZhY3Rvcnl9IGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gR29vZ2xlTWFwU2VydmljZUZhY3RvcnlGYWN0b3J5KGFwaUxvYWRlcjogTWFwQVBJTG9hZGVyLCB6b25lOiBOZ1pvbmUpOiBNYXBTZXJ2aWNlRmFjdG9yeSB7XG4gICAgcmV0dXJuIG5ldyBHb29nbGVNYXBTZXJ2aWNlRmFjdG9yeShhcGlMb2FkZXIsIHpvbmUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBwbGFmb3JtIHNwZWNpZmljIE1hcExvYWRlckZhY3RvcnkuXG4gKlxuICogQGV4cG9ydFxuICogQHJldHVybnMgLSBBIHtAbGluayBNYXBBUElMb2FkZXJ9IGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gR29vZ2xlTWFwTG9hZGVyRmFjdG9yeSgpOiBNYXBBUElMb2FkZXIge1xuICAgIHJldHVybiBuZXcgR29vZ2xlTWFwQVBJTG9hZGVyKG5ldyBHb29nbGVNYXBBUElMb2FkZXJDb25maWcoKSwgbmV3IFdpbmRvd1JlZigpLCBuZXcgRG9jdW1lbnRSZWYoKSk7XG59XG4iXX0=