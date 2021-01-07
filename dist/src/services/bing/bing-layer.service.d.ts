import { NgZone } from '@angular/core';
import { IPolygonOptions } from '../../interfaces/ipolygon-options';
import { IPolylineOptions } from '../../interfaces/ipolyline-options';
import { Polygon } from '../../models/polygon';
import { Polyline } from '../../models/polyline';
import { MapService } from '../map.service';
import { MapLayerDirective } from '../../components/map-layer';
import { LayerService } from '../layer.service';
import { BingLayerBase } from './bing-layer-base';
/**
 * Implements the {@link LayerService} contract for a  Bing Maps V8 specific implementation.
 *
 * @export
 */
export declare class BingLayerService extends BingLayerBase implements LayerService {
    /**
     * Creates an instance of BingLayerService.
     * @param _mapService - Instance of the Bing Maps Service. Will generally be injected.
     * @param _zone - NgZone instance to provide zone aware promises.
     *
     * @memberof BingLayerService
     */
    constructor(_mapService: MapService, _zone: NgZone);
    /**
     * Adds a layer to the map.
     *
     * @abstract
     * @param layer - MapLayerDirective component object.
     * Generally, MapLayerDirective will be injected with an instance of the
     * LayerService and then self register on initialization.
     *
     * @memberof BingLayerService
     */
    AddLayer(layer: MapLayerDirective): void;
    /**
     * Adds a polygon to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygon.
     * @returns - A promise that when fullfilled contains the an instance of the Polygon model.
     *
     * @memberof BingLayerService
     */
    CreatePolygon(layer: number, options: IPolygonOptions): Promise<Polygon>;
    /**
     * Creates an array of unbound polygons. Use this method to create arrays of polygons to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygons.
     * @returns - A promise that when fullfilled contains the an arrays of the Polygon models.
     *
     * @memberof BingLayerService
     */
    CreatePolygons(layer: number, options: Array<IPolygonOptions>): Promise<Array<Polygon>>;
    /**
     * Adds a polyline to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the line.
     * @param options - Polyline options defining the line.
     * @returns - A promise that when fullfilled contains the an instance of the Polyline (or an array
     * of polygons for complex paths) model.
     *
     * @memberof BingLayerService
     */
    CreatePolyline(layer: number, options: IPolylineOptions): Promise<Polyline | Array<Polyline>>;
    /**
     * Creates an array of unbound polylines. Use this method to create arrays of polylines to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polylines.
     * @param options - Polyline options defining the polylines.
     * @returns - A promise that when fullfilled contains the an arrays of the Polyline models.
     *
     * @memberof BingLayerService
     */
    CreatePolylines(layer: number, options: Array<IPolylineOptions>): Promise<Array<Polyline | Array<Polyline>>>;
}
