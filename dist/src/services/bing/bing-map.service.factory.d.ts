import { NgZone } from '@angular/core';
import { MapServiceFactory } from '../mapservicefactory';
import { MapService } from '../map.service';
import { MapAPILoader } from '../mapapiloader';
import { MarkerService } from '../marker.service';
import { InfoBoxService } from '../infobox.service';
import { LayerService } from '../layer.service';
import { ClusterService } from '../cluster.service';
import { PolygonService } from '../polygon.service';
import { PolylineService } from '../polyline.service';
import { BingMapService } from './bing-map.service';
import { BingLayerService } from './bing-layer.service';
import { BingClusterService } from './bing-cluster.service';
/**
 * Implements a factory to create thre necessary Bing Maps V8 specific service instances.
 *
 * @export
 */
export declare class BingMapServiceFactory implements MapServiceFactory {
    private _loader;
    private _zone;
    /**
     * Creates an instance of BingMapServiceFactory.
     * @param _loader - {@link MapAPILoader} implementation for the Bing Map V8 provider.
     * @param _zone - NgZone object to implement zone aware promises.
     *
     * @memberof BingMapServiceFactory
     */
    constructor(_loader: MapAPILoader, _zone: NgZone);
    /**
     * Creates the map service for the Bing Maps V8 implementation.
     *
     * @returns - {@link MapService}. A concreted instance of the {@link BingMapService}.
     *
     * @memberof BingMapServiceFactory
     */
    Create(): MapService;
    /**
     * Creates the cluster service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link BingMapService}.
     * @returns - {@link ClusterService}. A concreted instance of the {@link BingClusterService}.
     *
     * @memberof BingMapServiceFactory
     */
    CreateClusterService(_mapService: BingMapService): ClusterService;
    /**
     * Creates thh info box service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link BingMapService}.
     * @returns - {@link InfoBoxService}. A concreted instance of the {@link BingInfoBoxService}.
     *
     * @memberof BingMapServiceFactory
     */
    CreateInfoBoxService(_mapService: BingMapService): InfoBoxService;
    /**
     * Creates the layer service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link BingMapService}.
     * @returns - {@link LayerService}. A concreted instance of the {@link BingLayerService}.
     *
     * @memberof BingMapServiceFactory
     */
    CreateLayerService(_mapService: BingMapService): LayerService;
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
    CreateMarkerService(_mapService: BingMapService, _layerService: BingLayerService, _clusterService: BingClusterService): MarkerService;
    /**
     * Creates the polygon service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService} implementation for thh underlying map archticture.
     * @param layers - {@link LayerService} implementation for the underlying map architecture.
     * @returns - {@link PolygonService} implementation for the underlying map architecture.
     *
     * @memberof MapServiceFactory
     */
    CreatePolygonService(map: MapService, layers: LayerService): PolygonService;
    /**
     * Creates the polyline service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService} implementation for thh underlying map archticture.
     * @param layers - {@link LayerService} implementation for the underlying map architecture.
     * @returns - {@link PolylineService} implementation for the underlying map architecture.
     *
     * @memberof MapServiceFactory
     */
    CreatePolylineService(map: MapService, layers: LayerService): PolylineService;
}
/**
 * Creates a new instance of a plaform specific MapServiceFactory.
 *
 * @export
 * @param apiLoader - An {@link MapAPILoader} instance. This is expected to the a {@link BingMapAPILoader}.
 * @param zone - An NgZone instance to provide zone aware promises.
 *
 * @returns -  A {@link MapServiceFactory} instance.
 */
export declare function BingMapServiceFactoryFactory(apiLoader: MapAPILoader, zone: NgZone): MapServiceFactory;
/**
 * Creates a new instance of a plaform specific MapLoaderFactory.
 *
 * @export
 * @returns - A {@link MapAPILoader} instance.
 */
export declare function BingMapLoaderFactory(): MapAPILoader;
