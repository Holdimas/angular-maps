import { NgModule, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import 'bingmaps';
///
/// import module models
///
import { InfoWindow } from './src/models/info-window';
import { Marker } from './src/models/marker';
import { MarkerTypeId } from './src/models/marker-type-id';
import { MapTypeId } from './src/models/map-type-id';
import { Layer } from './src/models/layer';
import { Polygon } from './src/models/polygon';
import { Polyline } from './src/models/polyline';
import { SpiderClusterMarker } from './src/models/spider-cluster-marker';
import { ClusterPlacementMode } from './src/models/cluster-placement-mode';
import { ClusterClickAction } from './src/models/cluster-click-action';
import { CanvasOverlay } from './src/models/canvas-overlay';
import { BingLayer } from './src/models/bing/bing-layer';
import { BingClusterLayer } from './src/models/bing/bing-cluster-layer';
import { BingSpiderClusterMarker } from './src/models/bing/bing-spider-cluster-marker';
import { BingInfoWindow } from './src/models/bing/bing-info-window';
import { BingMarker } from './src/models/bing/bing-marker';
import { BingPolygon } from './src/models/bing/bing-polygon';
import { BingPolyline } from './src/models/bing/bing-polyline';
import { BingMapEventsLookup } from './src/models/bing/bing-events-lookup';
import { BingCanvasOverlay } from './src/models/bing/bing-canvas-overlay';
import { GoogleInfoWindow } from './src/models/google/google-info-window';
import { GoogleMarker } from './src/models/google/google-marker';
import { GooglePolygon } from './src/models/google/google-polygon';
import { GooglePolyline } from './src/models/google/google-polyline';
import { GoogleMapEventsLookup } from './src/models/google/google-events-lookup';
import { GoogleCanvasOverlay } from './src/models/google/google-canvas-overlay';
///
/// import module components
///
import { MapComponent } from './src/components/map';
import { MapMarkerDirective } from './src/components/map-marker';
import { InfoBoxComponent } from './src/components/infobox';
import { InfoBoxActionDirective } from './src/components/infobox-action';
import { MapLayerDirective } from './src/components/map-layer';
import { ClusterLayerDirective } from './src/components/cluster-layer';
import { MapPolygonDirective } from './src/components/map-polygon';
import { MapPolylineDirective } from './src/components/map-polyline';
import { MapMarkerLayerDirective } from './src/components/map-marker-layer';
import { MapPolygonLayerDirective } from './src/components/map-polygon-layer';
import { MapPolylineLayerDirective } from './src/components/map-polyline-layer';
///
/// import module services
///
import { MapServiceFactory } from './src/services/mapservicefactory';
import { MapService } from './src/services/map.service';
import { MapAPILoader, WindowRef, DocumentRef } from './src/services/mapapiloader';
import { InfoBoxService } from './src/services/infobox.service';
import { LayerService } from './src/services/layer.service';
import { MarkerService } from './src/services/marker.service';
import { ClusterService } from './src/services/cluster.service';
import { PolygonService } from './src/services/polygon.service';
import { PolylineService } from './src/services/polyline.service';
import { BingMapServiceFactory, BingMapServiceFactoryFactory, BingMapLoaderFactory } from './src/services/bing/bing-map.service.factory';
import { BingMapService } from './src/services/bing/bing-map.service';
import { BingMapAPILoader, BingMapAPILoaderConfig } from './src/services/bing/bing-map.api-loader.service';
import { BingInfoBoxService } from './src/services/bing/bing-infobox.service';
import { BingMarkerService } from './src/services/bing/bing-marker.service';
import { BingLayerService } from './src/services/bing/bing-layer.service';
import { BingClusterService } from './src/services/bing/bing-cluster.service';
import { BingPolygonService } from './src/services/bing/bing-polygon.service';
import { BingPolylineService } from './src/services/bing/bing-polyline.service';
import { GoogleClusterService } from './src/services/google/google-cluster.service';
import { GoogleInfoBoxService } from './src/services/google/google-infobox.service';
import { GoogleLayerService } from './src/services/google/google-layer.service';
import { GoogleMapAPILoader, GoogleMapAPILoaderConfig } from './src/services/google/google-map-api-loader.service';
import { GoogleMapServiceFactory, GoogleMapServiceFactoryFactory, GoogleMapLoaderFactory } from './src/services/google/google-map.service.factory';
import { GoogleMapService } from './src/services/google/google-map.service';
import { GoogleMarkerService } from './src/services/google/google-marker.service';
import { GooglePolygonService } from './src/services/google/google-polygon.service';
import { GooglePolylineService } from './src/services/google/google-polyline.service';
///
/// export publics components, models, interfaces etc for external reuse.
///
export { MapComponent, InfoBoxComponent, MapMarkerDirective, MapPolygonDirective, MapPolylineDirective, InfoBoxActionDirective, MapMarkerLayerDirective, MapPolygonLayerDirective, MapLayerDirective, ClusterLayerDirective, MapPolylineLayerDirective, MapTypeId, Marker, MarkerTypeId, InfoWindow, Layer, ClusterPlacementMode, ClusterClickAction, SpiderClusterMarker, Polygon, Polyline, CanvasOverlay, MapService, MapServiceFactory, MarkerService, InfoBoxService, MapAPILoader, WindowRef, DocumentRef, LayerService, PolygonService, PolylineService, ClusterService };
export { BingMapServiceFactory, BingMapAPILoaderConfig, BingMapService, BingInfoBoxService, BingMarkerService, BingPolygonService, BingPolylineService, BingMapAPILoader, BingLayerService, BingClusterService, BingLayer, BingMarker, BingPolyline, BingMapEventsLookup, BingPolygon, BingInfoWindow, BingClusterLayer, BingSpiderClusterMarker, BingCanvasOverlay };
export { GoogleClusterService, GoogleInfoBoxService, GoogleLayerService, GoogleMapAPILoader, GoogleMapAPILoaderConfig, GoogleMapServiceFactory, GoogleMapService, GoogleMarkerService, GooglePolygonService, GooglePolylineService, GoogleMarker, GoogleInfoWindow, GooglePolygon, GooglePolyline, GoogleMapEventsLookup, GoogleCanvasOverlay };
///
/// define module
///
export class MapModule {
    static forRoot(mapServiceFactory, loader) {
        return {
            ngModule: MapModule,
            providers: [
                mapServiceFactory ? { provide: MapServiceFactory, useValue: mapServiceFactory } :
                    { provide: MapServiceFactory, deps: [MapAPILoader, NgZone], useFactory: BingMapServiceFactoryFactory },
                loader ? { provide: MapAPILoader, useValue: loader } : { provide: MapAPILoader, useFactory: BingMapLoaderFactory },
                DocumentRef,
                WindowRef
            ]
        };
    }
    static forRootBing() {
        return {
            ngModule: MapModule,
            providers: [
                { provide: MapServiceFactory, deps: [MapAPILoader, NgZone], useFactory: BingMapServiceFactoryFactory },
                { provide: MapAPILoader, useFactory: BingMapLoaderFactory },
                DocumentRef,
                WindowRef
            ]
        };
    }
    static forRootGoogle() {
        return {
            ngModule: MapModule,
            providers: [
                { provide: MapServiceFactory, deps: [MapAPILoader, NgZone], useFactory: GoogleMapServiceFactoryFactory },
                { provide: MapAPILoader, useFactory: GoogleMapLoaderFactory },
                DocumentRef,
                WindowRef
            ]
        };
    }
}
MapModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    MapLayerDirective,
                    MapComponent,
                    MapMarkerDirective,
                    InfoBoxComponent,
                    InfoBoxActionDirective,
                    MapPolygonDirective,
                    MapPolylineDirective,
                    ClusterLayerDirective,
                    MapMarkerLayerDirective,
                    MapPolygonLayerDirective,
                    MapPolylineLayerDirective
                ],
                imports: [CommonModule],
                exports: [
                    CommonModule,
                    MapComponent,
                    MapMarkerDirective,
                    MapPolygonDirective,
                    MapPolylineDirective,
                    InfoBoxComponent,
                    InfoBoxActionDirective,
                    MapLayerDirective,
                    ClusterLayerDirective,
                    MapMarkerLayerDirective,
                    MapPolygonLayerDirective,
                    MapPolylineLayerDirective
                ]
            },] }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUF1QixNQUFNLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDdEUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQy9DLE9BQU8sVUFBVSxDQUFDO0FBMkJsQixHQUFHO0FBQ0gsd0JBQXdCO0FBQ3hCLEdBQUc7QUFDSCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDdEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQzdDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUMzRCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckQsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQzNDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDakQsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sb0NBQW9DLENBQUM7QUFDekUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0scUNBQXFDLENBQUM7QUFDM0UsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sbUNBQW1DLENBQUM7QUFDdkUsT0FBTyxFQUFFLGFBQWEsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQzNELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUN6RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUN4RSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSw4Q0FBOEMsQ0FBQztBQUN2RixPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sb0NBQW9DLENB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WTtvQkFDWixrQkFBa0I7b0JBQ2xCLG1CQUFtQjtvQkFDbkIsb0JBQW9CO29CQUNwQixnQkFBZ0I7b0JBQ2hCLHNCQUFzQjtvQkFDdEIsaUJBQWlCO29CQUNqQixxQkFBcUI7b0JBQ3JCLHVCQUF1QjtvQkFDdkIsd0JBQXdCO29CQUN4Qix5QkFBeUI7aUJBQzVCO2FBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ01vZHVsZSwgTW9kdWxlV2l0aFByb3ZpZGVycywgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0ICdiaW5nbWFwcyc7XG5cbi8vL1xuLy8vIGltcG9ydCBtb2R1bGUgaW50ZXJmYWNlc1xuLy8vXG5pbXBvcnQgeyBJTGF0TG9uZyB9IGZyb20gJy4vc3JjL2ludGVyZmFjZXMvaWxhdGxvbmcnO1xuaW1wb3J0IHsgSUluZm9XaW5kb3dPcHRpb25zIH0gZnJvbSAnLi9zcmMvaW50ZXJmYWNlcy9paW5mby13aW5kb3ctb3B0aW9ucyc7XG5pbXBvcnQgeyBJSW5mb1dpbmRvd0FjdGlvbiB9IGZyb20gJy4vc3JjL2ludGVyZmFjZXMvaWluZm8td2luZG93LWFjdGlvbic7XG5pbXBvcnQgeyBJTWFya2VyT3B0aW9ucyB9IGZyb20gJy4vc3JjL2ludGVyZmFjZXMvaW1hcmtlci1vcHRpb25zJztcbmltcG9ydCB7IElNYXBPcHRpb25zIH0gZnJvbSAnLi9zcmMvaW50ZXJmYWNlcy9pbWFwLW9wdGlvbnMnO1xuaW1wb3J0IHsgSVNpemUgfSBmcm9tICcuL3NyYy9pbnRlcmZhY2VzL2lzaXplJztcbmltcG9ydCB7IElQb2ludCB9IGZyb20gJy4vc3JjL2ludGVyZmFjZXMvaXBvaW50JztcbmltcG9ydCB7IElCb3ggfSBmcm9tICcuL3NyYy9pbnRlcmZhY2VzL2lib3gnO1xuaW1wb3J0IHsgSU1hcmtlckV2ZW50IH0gZnJvbSAnLi9zcmMvaW50ZXJmYWNlcy9pbWFya2VyLWV2ZW50JztcbmltcG9ydCB7IElNYXJrZXJJY29uSW5mbyB9IGZyb20gJy4vc3JjL2ludGVyZmFjZXMvaW1hcmtlci1pY29uLWluZm8nO1xuaW1wb3J0IHsgSUxheWVyT3B0aW9ucyB9IGZyb20gJy4vc3JjL2ludGVyZmFjZXMvaWxheWVyLW9wdGlvbnMnO1xuaW1wb3J0IHsgSUNsdXN0ZXJPcHRpb25zIH0gZnJvbSAnLi9zcmMvaW50ZXJmYWNlcy9pY2x1c3Rlci1vcHRpb25zJztcbmltcG9ydCB7IElTcGlkZXJDbHVzdGVyT3B0aW9ucyB9IGZyb20gJy4vc3JjL2ludGVyZmFjZXMvaXNwaWRlci1jbHVzdGVyLW9wdGlvbnMnO1xuaW1wb3J0IHsgSUxpbmVPcHRpb25zIH0gZnJvbSAnLi9zcmMvaW50ZXJmYWNlcy9pbGluZS1vcHRpb25zJztcbmltcG9ydCB7IElQb2x5Z29uT3B0aW9ucyB9IGZyb20gJy4vc3JjL2ludGVyZmFjZXMvaXBvbHlnb24tb3B0aW9ucyc7XG5pbXBvcnQgeyBJUG9seWxpbmVPcHRpb25zIH0gZnJvbSAnLi9zcmMvaW50ZXJmYWNlcy9pcG9seWxpbmUtb3B0aW9ucyc7XG5pbXBvcnQgeyBJUG9seWdvbkV2ZW50IH0gZnJvbSAnLi9zcmMvaW50ZXJmYWNlcy9pcG9seWdvbi1ldmVudCc7XG5pbXBvcnQgeyBJUG9seWxpbmVFdmVudCB9IGZyb20gJy4vc3JjL2ludGVyZmFjZXMvaXBvbHlsaW5lLWV2ZW50JztcbmltcG9ydCB7IElNYXBFdmVudExvb2t1cCB9IGZyb20gJy4vc3JjL2ludGVyZmFjZXMvaW1hcC1ldmVudC1sb29rdXAnO1xuaW1wb3J0IHsgSUxhYmVsT3B0aW9ucyB9IGZyb20gJy4vc3JjL2ludGVyZmFjZXMvaWxhYmVsLW9wdGlvbnMnO1xuaW1wb3J0IHsgSUN1c3RvbU1hcFN0eWxlfSBmcm9tICcuL3NyYy9pbnRlcmZhY2VzL2ljdXN0b20tbWFwLXN0eWxlJztcblxuLy8vXG4vLy8gaW1wb3J0IG1vZHVsZSBtb2RlbHNcbi8vL1xuaW1wb3J0IHsgSW5mb1dpbmRvdyB9IGZyb20gJy4vc3JjL21vZGVscy9pbmZvLXdpbmRvdyc7XG5pbXBvcnQgeyBNYXJrZXIgfSBmcm9tICcuL3NyYy9tb2RlbHMvbWFya2VyJztcbmltcG9ydCB7IE1hcmtlclR5cGVJZCB9IGZyb20gJy4vc3JjL21vZGVscy9tYXJrZXItdHlwZS1pZCc7XG5pbXBvcnQgeyBNYXBUeXBlSWQgfSBmcm9tICcuL3NyYy9tb2RlbHMvbWFwLXR5cGUtaWQnO1xuaW1wb3J0IHsgTGF5ZXIgfSBmcm9tICcuL3NyYy9tb2RlbHMvbGF5ZXInO1xuaW1wb3J0IHsgUG9seWdvbiB9IGZyb20gJy4vc3JjL21vZGVscy9wb2x5Z29uJztcbmltcG9ydCB7IFBvbHlsaW5lIH0gZnJvbSAnLi9zcmMvbW9kZWxzL3BvbHlsaW5lJztcbmltcG9ydCB7IFNwaWRlckNsdXN0ZXJNYXJrZXIgfSBmcm9tICcuL3NyYy9tb2RlbHMvc3BpZGVyLWNsdXN0ZXItbWFya2VyJztcbmltcG9ydCB7IENsdXN0ZXJQbGFjZW1lbnRNb2RlIH0gZnJvbSAnLi9zcmMvbW9kZWxzL2NsdXN0ZXItcGxhY2VtZW50LW1vZGUnO1xuaW1wb3J0IHsgQ2x1c3RlckNsaWNrQWN0aW9uIH0gZnJvbSAnLi9zcmMvbW9kZWxzL2NsdXN0ZXItY2xpY2stYWN0aW9uJztcbmltcG9ydCB7IENhbnZhc092ZXJsYXl9IGZyb20gJy4vc3JjL21vZGVscy9jYW52YXMtb3ZlcmxheSc7XG5pbXBvcnQgeyBCaW5nTGF5ZXIgfSBmcm9tICcuL3NyYy9tb2RlbHMvYmluZy9iaW5nLWxheWVyJztcbmltcG9ydCB7IEJpbmdDbHVzdGVyTGF5ZXIgfSBmcm9tICcuL3NyYy9tb2RlbHMvYmluZy9iaW5nLWNsdXN0ZXItbGF5ZXInO1xuaW1wb3J0IHsgQmluZ1NwaWRlckNsdXN0ZXJNYXJrZXIgfSBmcm9tICcuL3NyYy9tb2RlbHMvYmluZy9iaW5nLXNwaWRlci1jbHVzdGVyLW1hcmtlcic7XG5pbXBvcnQgeyBCaW5nSW5mb1dpbmRvdyB9IGZyb20gJy4vc3JjL21vZGVscy9iaW5nL2JpbmctaW5mby13aW5kb3cnO1xuaW1wb3J0IHsgQmluZ01hcmtlciB9IGZyb20gJy4vc3JjL21vZGVscy9iaW5nL2JpbmctbWFya2VyJztcbmltcG9ydCB7IEJpbmdQb2x5Z29uIH0gZnJvbSAnLi9zcmMvbW9kZWxzL2JpbmcvYmluZy1wb2x5Z29uJztcbmltcG9ydCB7IEJpbmdQb2x5bGluZSB9IGZyb20gJy4vc3JjL21vZGVscy9iaW5nL2JpbmctcG9seWxpbmUnO1xuaW1wb3J0IHsgQmluZ01hcEV2ZW50c0xvb2t1cCB9IGZyb20gJy4vc3JjL21vZGVscy9iaW5nL2JpbmctZXZlbnRzLWxvb2t1cCc7XG5pbXBvcnQgeyBCaW5nQ2FudmFzT3ZlcmxheSB9IGZyb20gJy4vc3JjL21vZGVscy9iaW5nL2JpbmctY2FudmFzLW92ZXJsYXknO1xuaW1wb3J0IHsgR29vZ2xlSW5mb1dpbmRvdyB9IGZyb20gJy4vc3JjL21vZGVscy9nb29nbGUvZ29vZ2xlLWluZm8td2luZG93JztcbmltcG9ydCB7IEdvb2dsZU1hcmtlciB9IGZyb20gJy4vc3JjL21vZGVscy9nb29nbGUvZ29vZ2xlLW1hcmtlcic7XG5pbXBvcnQgeyBHb29nbGVQb2x5Z29uIH0gZnJvbSAnLi9zcmMvbW9kZWxzL2dvb2dsZS9nb29nbGUtcG9seWdvbic7XG5pbXBvcnQgeyBHb29nbGVQb2x5bGluZSB9IGZyb20gJy4vc3JjL21vZGVscy9nb29nbGUvZ29vZ2xlLXBvbHlsaW5lJztcbmltcG9ydCB7IEdvb2dsZU1hcEV2ZW50c0xvb2t1cCB9IGZyb20gJy4vc3JjL21vZGVscy9nb29nbGUvZ29vZ2xlLWV2ZW50cy1sb29rdXAnO1xuaW1wb3J0IHsgR29vZ2xlQ2FudmFzT3ZlcmxheSB9IGZyb20gJy4vc3JjL21vZGVscy9nb29nbGUvZ29vZ2xlLWNhbnZhcy1vdmVybGF5JztcblxuLy8vXG4vLy8gaW1wb3J0IG1vZHVsZSBjb21wb25lbnRzXG4vLy9cbmltcG9ydCB7IE1hcENvbXBvbmVudCB9IGZyb20gJy4vc3JjL2NvbXBvbmVudHMvbWFwJztcbmltcG9ydCB7IE1hcE1hcmtlckRpcmVjdGl2ZSB9IGZyb20gJy4vc3JjL2NvbXBvbmVudHMvbWFwLW1hcmtlcic7XG5pbXBvcnQgeyBJbmZvQm94Q29tcG9uZW50IH0gZnJvbSAnLi9zcmMvY29tcG9uZW50cy9pbmZvYm94JztcbmltcG9ydCB7IEluZm9Cb3hBY3Rpb25EaXJlY3RpdmUgfSBmcm9tICcuL3NyYy9jb21wb25lbnRzL2luZm9ib3gtYWN0aW9uJztcbmltcG9ydCB7IE1hcExheWVyRGlyZWN0aXZlIH0gZnJvbSAnLi9zcmMvY29tcG9uZW50cy9tYXAtbGF5ZXInO1xuaW1wb3J0IHsgQ2x1c3RlckxheWVyRGlyZWN0aXZlIH0gZnJvbSAnLi9zcmMvY29tcG9uZW50cy9jbHVzdGVyLWxheWVyJztcbmltcG9ydCB7IE1hcFBvbHlnb25EaXJlY3RpdmUgfSBmcm9tICcuL3NyYy9jb21wb25lbnRzL21hcC1wb2x5Z29uJztcbmltcG9ydCB7IE1hcFBvbHlsaW5lRGlyZWN0aXZlIH0gZnJvbSAnLi9zcmMvY29tcG9uZW50cy9tYXAtcG9seWxpbmUnO1xuaW1wb3J0IHsgTWFwTWFya2VyTGF5ZXJEaXJlY3RpdmUgfSBmcm9tICcuL3NyYy9jb21wb25lbnRzL21hcC1tYXJrZXItbGF5ZXInO1xuaW1wb3J0IHsgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlIH0gZnJvbSAnLi9zcmMvY29tcG9uZW50cy9tYXAtcG9seWdvbi1sYXllcic7XG5pbXBvcnQgeyBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlIH0gZnJvbSAnLi9zcmMvY29tcG9uZW50cy9tYXAtcG9seWxpbmUtbGF5ZXInO1xuXG4vLy9cbi8vLyBpbXBvcnQgbW9kdWxlIHNlcnZpY2VzXG4vLy9cbmltcG9ydCB7IE1hcFNlcnZpY2VGYWN0b3J5IH0gZnJvbSAnLi9zcmMvc2VydmljZXMvbWFwc2VydmljZWZhY3RvcnknO1xuaW1wb3J0IHsgTWFwU2VydmljZSB9IGZyb20gJy4vc3JjL3NlcnZpY2VzL21hcC5zZXJ2aWNlJztcbmltcG9ydCB7IE1hcEFQSUxvYWRlciwgV2luZG93UmVmLCBEb2N1bWVudFJlZiB9IGZyb20gJy4vc3JjL3NlcnZpY2VzL21hcGFwaWxvYWRlcic7XG5pbXBvcnQgeyBJbmZvQm94U2VydmljZSB9IGZyb20gJy4vc3JjL3NlcnZpY2VzL2luZm9ib3guc2VydmljZSc7XG5pbXBvcnQgeyBMYXllclNlcnZpY2UgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9sYXllci5zZXJ2aWNlJztcbmltcG9ydCB7IE1hcmtlclNlcnZpY2UgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9tYXJrZXIuc2VydmljZSc7XG5pbXBvcnQgeyBDbHVzdGVyU2VydmljZSB9IGZyb20gJy4vc3JjL3NlcnZpY2VzL2NsdXN0ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBQb2x5Z29uU2VydmljZSB9IGZyb20gJy4vc3JjL3NlcnZpY2VzL3BvbHlnb24uc2VydmljZSc7XG5pbXBvcnQgeyBQb2x5bGluZVNlcnZpY2UgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9wb2x5bGluZS5zZXJ2aWNlJztcbmltcG9ydCB7IEJpbmdNYXBTZXJ2aWNlRmFjdG9yeSxcbiAgICBCaW5nTWFwU2VydmljZUZhY3RvcnlGYWN0b3J5LCBCaW5nTWFwTG9hZGVyRmFjdG9yeSB9IGZyb20gJy4vc3JjL3NlcnZpY2VzL2JpbmcvYmluZy1tYXAuc2VydmljZS5mYWN0b3J5JztcbmltcG9ydCB7IEJpbmdNYXBTZXJ2aWNlIH0gZnJvbSAnLi9zcmMvc2VydmljZXMvYmluZy9iaW5nLW1hcC5zZXJ2aWNlJztcbmltcG9ydCB7IEJpbmdNYXBBUElMb2FkZXIsIEJpbmdNYXBBUElMb2FkZXJDb25maWcgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9iaW5nL2JpbmctbWFwLmFwaS1sb2FkZXIuc2VydmljZSc7XG5pbXBvcnQgeyBCaW5nSW5mb0JveFNlcnZpY2UgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9iaW5nL2JpbmctaW5mb2JveC5zZXJ2aWNlJztcbmltcG9ydCB7IEJpbmdNYXJrZXJTZXJ2aWNlIH0gZnJvbSAnLi9zcmMvc2VydmljZXMvYmluZy9iaW5nLW1hcmtlci5zZXJ2aWNlJztcbmltcG9ydCB7IEJpbmdMYXllclNlcnZpY2UgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9iaW5nL2JpbmctbGF5ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBCaW5nQ2x1c3RlclNlcnZpY2UgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9iaW5nL2JpbmctY2x1c3Rlci5zZXJ2aWNlJztcbmltcG9ydCB7IEJpbmdQb2x5Z29uU2VydmljZSB9IGZyb20gJy4vc3JjL3NlcnZpY2VzL2JpbmcvYmluZy1wb2x5Z29uLnNlcnZpY2UnO1xuaW1wb3J0IHsgQmluZ1BvbHlsaW5lU2VydmljZSB9IGZyb20gJy4vc3JjL3NlcnZpY2VzL2JpbmcvYmluZy1wb2x5bGluZS5zZXJ2aWNlJztcbmltcG9ydCB7IEdvb2dsZUNsdXN0ZXJTZXJ2aWNlIH0gZnJvbSAnLi9zcmMvc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1jbHVzdGVyLnNlcnZpY2UnO1xuaW1wb3J0IHsgR29vZ2xlSW5mb0JveFNlcnZpY2UgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9nb29nbGUvZ29vZ2xlLWluZm9ib3guc2VydmljZSc7XG5pbXBvcnQgeyBHb29nbGVMYXllclNlcnZpY2UgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9nb29nbGUvZ29vZ2xlLWxheWVyLnNlcnZpY2UnO1xuaW1wb3J0IHsgR29vZ2xlTWFwQVBJTG9hZGVyLCBHb29nbGVNYXBBUElMb2FkZXJDb25maWcgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9nb29nbGUvZ29vZ2xlLW1hcC1hcGktbG9hZGVyLnNlcnZpY2UnO1xuaW1wb3J0IHtcbiAgICBHb29nbGVNYXBTZXJ2aWNlRmFjdG9yeSwgR29vZ2xlTWFwU2VydmljZUZhY3RvcnlGYWN0b3J5LFxuICAgIEdvb2dsZU1hcExvYWRlckZhY3Rvcnlcbn0gZnJvbSAnLi9zcmMvc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1tYXAuc2VydmljZS5mYWN0b3J5JztcbmltcG9ydCB7IEdvb2dsZU1hcFNlcnZpY2UgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9nb29nbGUvZ29vZ2xlLW1hcC5zZXJ2aWNlJztcbmltcG9ydCB7IEdvb2dsZU1hcmtlclNlcnZpY2UgfSBmcm9tICcuL3NyYy9zZXJ2aWNlcy9nb29nbGUvZ29vZ2xlLW1hcmtlci5zZXJ2aWNlJztcbmltcG9ydCB7IEdvb2dsZVBvbHlnb25TZXJ2aWNlIH0gZnJvbSAnLi9zcmMvc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1wb2x5Z29uLnNlcnZpY2UnO1xuaW1wb3J0IHsgR29vZ2xlUG9seWxpbmVTZXJ2aWNlIH0gZnJvbSAnLi9zcmMvc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1wb2x5bGluZS5zZXJ2aWNlJztcblxuLy8vXG4vLy8gZXhwb3J0IHB1YmxpY3MgY29tcG9uZW50cywgbW9kZWxzLCBpbnRlcmZhY2VzIGV0YyBmb3IgZXh0ZXJuYWwgcmV1c2UuXG4vLy9cbmV4cG9ydCB7XG4gICAgSUxhdExvbmcsIElJbmZvV2luZG93T3B0aW9ucywgSUluZm9XaW5kb3dBY3Rpb24sIElTaXplLCBJTWFya2VyT3B0aW9ucywgSUJveCwgSU1hcE9wdGlvbnMsIElQb2ludCwgSU1hcmtlckV2ZW50LCBJUG9seWdvbkV2ZW50LFxuICAgIElQb2x5bGluZUV2ZW50LCBJTWFwRXZlbnRMb29rdXAsIElNYXJrZXJJY29uSW5mbywgSUxheWVyT3B0aW9ucywgSUNsdXN0ZXJPcHRpb25zLCBJU3BpZGVyQ2x1c3Rlck9wdGlvbnMsIElMaW5lT3B0aW9ucyxcbiAgICBJUG9seWdvbk9wdGlvbnMsIElQb2x5bGluZU9wdGlvbnMsIElMYWJlbE9wdGlvbnMsIElDdXN0b21NYXBTdHlsZSwgTWFwQ29tcG9uZW50LCBJbmZvQm94Q29tcG9uZW50LCBNYXBNYXJrZXJEaXJlY3RpdmUsIE1hcFBvbHlnb25EaXJlY3RpdmUsXG4gICAgTWFwUG9seWxpbmVEaXJlY3RpdmUsIEluZm9Cb3hBY3Rpb25EaXJlY3RpdmUsIE1hcE1hcmtlckxheWVyRGlyZWN0aXZlLCBNYXBQb2x5Z29uTGF5ZXJEaXJlY3RpdmUsIE1hcExheWVyRGlyZWN0aXZlLFxuICAgIENsdXN0ZXJMYXllckRpcmVjdGl2ZSwgTWFwUG9seWxpbmVMYXllckRpcmVjdGl2ZSwgTWFwVHlwZUlkLCBNYXJrZXIsIE1hcmtlclR5cGVJZCwgSW5mb1dpbmRvdywgTGF5ZXIsIENsdXN0ZXJQbGFjZW1lbnRNb2RlLFxuICAgIENsdXN0ZXJDbGlja0FjdGlvbiwgU3BpZGVyQ2x1c3Rlck1hcmtlciwgUG9seWdvbiwgUG9seWxpbmUsIENhbnZhc092ZXJsYXksIE1hcFNlcnZpY2UsIE1hcFNlcnZpY2VGYWN0b3J5LCBNYXJrZXJTZXJ2aWNlLFxuICAgIEluZm9Cb3hTZXJ2aWNlLCBNYXBBUElMb2FkZXIsIFdpbmRvd1JlZiwgRG9jdW1lbnRSZWYsIExheWVyU2VydmljZSwgUG9seWdvblNlcnZpY2UsIFBvbHlsaW5lU2VydmljZSwgQ2x1c3RlclNlcnZpY2Vcbn07XG5leHBvcnQge1xuICAgIEJpbmdNYXBTZXJ2aWNlRmFjdG9yeSwgQmluZ01hcEFQSUxvYWRlckNvbmZpZywgQmluZ01hcFNlcnZpY2UsIEJpbmdJbmZvQm94U2VydmljZSxcbiAgICBCaW5nTWFya2VyU2VydmljZSwgQmluZ1BvbHlnb25TZXJ2aWNlLCBCaW5nUG9seWxpbmVTZXJ2aWNlLCBCaW5nTWFwQVBJTG9hZGVyLFxuICAgIEJpbmdMYXllclNlcnZpY2UsIEJpbmdDbHVzdGVyU2VydmljZSwgQmluZ0xheWVyLCBCaW5nTWFya2VyLCBCaW5nUG9seWxpbmUsIEJpbmdNYXBFdmVudHNMb29rdXAsIEJpbmdQb2x5Z29uLFxuICAgIEJpbmdJbmZvV2luZG93LCBCaW5nQ2x1c3RlckxheWVyLCBCaW5nU3BpZGVyQ2x1c3Rlck1hcmtlciwgQmluZ0NhbnZhc092ZXJsYXlcbn07XG5leHBvcnQge1xuICAgIEdvb2dsZUNsdXN0ZXJTZXJ2aWNlLCBHb29nbGVJbmZvQm94U2VydmljZSwgR29vZ2xlTGF5ZXJTZXJ2aWNlLCBHb29nbGVNYXBBUElMb2FkZXIsIEdvb2dsZU1hcEFQSUxvYWRlckNvbmZpZyxcbiAgICBHb29nbGVNYXBTZXJ2aWNlRmFjdG9yeSwgR29vZ2xlTWFwU2VydmljZSwgR29vZ2xlTWFya2VyU2VydmljZSwgR29vZ2xlUG9seWdvblNlcnZpY2UsIEdvb2dsZVBvbHlsaW5lU2VydmljZSxcbiAgICBHb29nbGVNYXJrZXIsIEdvb2dsZUluZm9XaW5kb3csIEdvb2dsZVBvbHlnb24sIEdvb2dsZVBvbHlsaW5lLCBHb29nbGVNYXBFdmVudHNMb29rdXAsIEdvb2dsZUNhbnZhc092ZXJsYXlcbn07XG5cbi8vL1xuLy8vIGRlZmluZSBtb2R1bGVcbi8vL1xuQE5nTW9kdWxlKHtcbiAgICBkZWNsYXJhdGlvbnM6IFtcbiAgICAgICAgTWFwTGF5ZXJEaXJlY3RpdmUsXG4gICAgICAgIE1hcENvbXBvbmVudCxcbiAgICAgICAgTWFwTWFya2VyRGlyZWN0aXZlLFxuICAgICAgICBJbmZvQm94Q29tcG9uZW50LFxuICAgICAgICBJbmZvQm94QWN0aW9uRGlyZWN0aXZlLFxuICAgICAgICBNYXBQb2x5Z29uRGlyZWN0aXZlLFxuICAgICAgICBNYXBQb2x5bGluZURpcmVjdGl2ZSxcbiAgICAgICAgQ2x1c3RlckxheWVyRGlyZWN0aXZlLFxuICAgICAgICBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZSxcbiAgICAgICAgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlLFxuICAgICAgICBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlXG4gICAgXSxcbiAgICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlXSxcbiAgICBleHBvcnRzOiBbXG4gICAgICAgIENvbW1vbk1vZHVsZSxcbiAgICAgICAgTWFwQ29tcG9uZW50LFxuICAgICAgICBNYXBNYXJrZXJEaXJlY3RpdmUsXG4gICAgICAgIE1hcFBvbHlnb25EaXJlY3RpdmUsXG4gICAgICAgIE1hcFBvbHlsaW5lRGlyZWN0aXZlLFxuICAgICAgICBJbmZvQm94Q29tcG9uZW50LFxuICAgICAgICBJbmZvQm94QWN0aW9uRGlyZWN0aXZlLFxuICAgICAgICBNYXBMYXllckRpcmVjdGl2ZSxcbiAgICAgICAgQ2x1c3RlckxheWVyRGlyZWN0aXZlLFxuICAgICAgICBNYXBNYXJrZXJMYXllckRpcmVjdGl2ZSxcbiAgICAgICAgTWFwUG9seWdvbkxheWVyRGlyZWN0aXZlLFxuICAgICAgICBNYXBQb2x5bGluZUxheWVyRGlyZWN0aXZlXG4gICAgXVxufSlcbmV4cG9ydCBjbGFzcyBNYXBNb2R1bGUge1xuXG4gICAgc3RhdGljIGZvclJvb3QobWFwU2VydmljZUZhY3Rvcnk/OiBNYXBTZXJ2aWNlRmFjdG9yeSwgbG9hZGVyPzogTWFwQVBJTG9hZGVyKTogTW9kdWxlV2l0aFByb3ZpZGVyczxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5nTW9kdWxlOiBNYXBNb2R1bGUsXG4gICAgICAgICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgICAgICAgICBtYXBTZXJ2aWNlRmFjdG9yeSA/IHsgcHJvdmlkZTogTWFwU2VydmljZUZhY3RvcnksIHVzZVZhbHVlOiBtYXBTZXJ2aWNlRmFjdG9yeSB9IDpcbiAgICAgICAgICAgICAgICAgICAgeyBwcm92aWRlOiBNYXBTZXJ2aWNlRmFjdG9yeSwgZGVwczogW01hcEFQSUxvYWRlciwgTmdab25lXSwgdXNlRmFjdG9yeTogQmluZ01hcFNlcnZpY2VGYWN0b3J5RmFjdG9yeSB9LFxuICAgICAgICAgICAgICAgIGxvYWRlciA/IHsgcHJvdmlkZTogTWFwQVBJTG9hZGVyLCB1c2VWYWx1ZTogbG9hZGVyIH0gOiB7IHByb3ZpZGU6IE1hcEFQSUxvYWRlciwgdXNlRmFjdG9yeTogQmluZ01hcExvYWRlckZhY3RvcnkgfSxcbiAgICAgICAgICAgICAgICBEb2N1bWVudFJlZixcbiAgICAgICAgICAgICAgICBXaW5kb3dSZWZcbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZm9yUm9vdEJpbmcoKTogTW9kdWxlV2l0aFByb3ZpZGVyczxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5nTW9kdWxlOiBNYXBNb2R1bGUsXG4gICAgICAgICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgICAgICAgICB7IHByb3ZpZGU6IE1hcFNlcnZpY2VGYWN0b3J5LCBkZXBzOiBbTWFwQVBJTG9hZGVyLCBOZ1pvbmVdLCB1c2VGYWN0b3J5OiBCaW5nTWFwU2VydmljZUZhY3RvcnlGYWN0b3J5IH0sXG4gICAgICAgICAgICAgICAgeyBwcm92aWRlOiBNYXBBUElMb2FkZXIsIHVzZUZhY3Rvcnk6IEJpbmdNYXBMb2FkZXJGYWN0b3J5IH0sXG4gICAgICAgICAgICAgICAgRG9jdW1lbnRSZWYsXG4gICAgICAgICAgICAgICAgV2luZG93UmVmXG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgc3RhdGljIGZvclJvb3RHb29nbGUoKTogTW9kdWxlV2l0aFByb3ZpZGVyczxhbnk+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5nTW9kdWxlOiBNYXBNb2R1bGUsXG4gICAgICAgICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgICAgICAgICB7IHByb3ZpZGU6IE1hcFNlcnZpY2VGYWN0b3J5LCBkZXBzOiBbTWFwQVBJTG9hZGVyLCBOZ1pvbmVdLCB1c2VGYWN0b3J5OiBHb29nbGVNYXBTZXJ2aWNlRmFjdG9yeUZhY3RvcnkgfSxcbiAgICAgICAgICAgICAgICB7IHByb3ZpZGU6IE1hcEFQSUxvYWRlciwgdXNlRmFjdG9yeTogR29vZ2xlTWFwTG9hZGVyRmFjdG9yeSB9LFxuICAgICAgICAgICAgICAgIERvY3VtZW50UmVmLFxuICAgICAgICAgICAgICAgIFdpbmRvd1JlZlxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbn1cbiJdfQ==