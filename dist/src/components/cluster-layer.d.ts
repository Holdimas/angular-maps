import { IClusterIconInfo } from '../interfaces/icluster-icon-info';
import { OnInit, OnDestroy, OnChanges, SimpleChange, ViewContainerRef } from '@angular/core';
import { Marker } from '../models/marker';
import { ClusterPlacementMode } from '../models/cluster-placement-mode';
import { ClusterClickAction } from '../models/cluster-click-action';
import { IPoint } from '../interfaces/ipoint';
import { IMarkerIconInfo } from '../interfaces/imarker-icon-info';
import { ClusterService } from '../services/cluster.service';
import { ISpiderClusterOptions } from '../interfaces/ispider-cluster-options';
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
export declare class ClusterLayerDirective extends MapLayerDirective implements OnInit, OnDestroy, OnChanges {
    private _clusteringEnabled;
    private _clusterPlacementMode;
    private _clusterClickAction;
    private _spiderClusterOptions;
    private _zIndex;
    private _gridSize;
    private _layerOffset;
    private _iconInfo;
    private _minimumClusterSize;
    private _styles;
    private _useDynamicSizeMarker;
    private _dynamicMarkerBaseSize;
    private _dynamicMarkerRanges;
    private _zoomOnClick;
    private _iconCreationCallback;
    /**
     * Gets or sets the the Cluster Click Action {@link ClusterClickAction}.
     *
     * @memberof ClusterLayerDirective
     */
    get ClusterClickAction(): ClusterClickAction;
    set ClusterClickAction(val: ClusterClickAction);
    /**
     * Gets or sets whether the clustering layer enables clustering. When set to false, the layer
     * behaves like a generic layer. This is handy if you want to prevent clustering at certain zoom levels.
     *
     * @memberof ClusterLayerDirective
     */
    get ClusteringEnabled(): boolean;
    set ClusteringEnabled(val: boolean);
    /**
     * Gets or sets the cluster placement mode. {@link ClusterPlacementMode}
     *
     * @memberof ClusterLayerDirective
     */
    get ClusterPlacementMode(): ClusterPlacementMode;
    set ClusterPlacementMode(val: ClusterPlacementMode);
    /**
     * Gets or sets the callback invoked to create a custom cluster marker. Note that when {@link UseDynamicSizeMarkers} is enabled,
     * you cannot set a custom marker callback.
     *
     * @memberof ClusterLayerDirective
     */
    get CustomMarkerCallback(): (m: Array<Marker>, i: IMarkerIconInfo) => string;
    set CustomMarkerCallback(val: (m: Array<Marker>, i: IMarkerIconInfo) => string);
    /**
     * Gets or sets the base size of dynamic markers in pixels. The actualy size of the dynamic marker is based on this.
     * See {@link UseDynamicSizeMarkers}.
     *
     * @memberof ClusterLayerDirective
     */
    get DynamicMarkerBaseSize(): number;
    set DynamicMarkerBaseSize(val: number);
    /**
     * Gets or sets the ranges to use to calculate breakpoints and colors for dynamic markers.
     * The map contains key/value pairs, with the keys being
     * the breakpoint sizes and the values the colors to be used for the dynamic marker in that range. See {@link UseDynamicSizeMarkers}.
     *
     * @memberof ClusterLayerDirective
     */
    get DynamicMarkerRanges(): Map<number, string>;
    set DynamicMarkerRanges(val: Map<number, string>);
    /**
     * Gets or sets the grid size to be used for clustering.
     *
     * @memberof ClusterLayerDirective
     */
    get GridSize(): number;
    set GridSize(val: number);
    /**
     * Gets or sets the IconInfo to be used to create a custom cluster marker. Supports font-based, SVG, graphics and more.
     * See {@link IMarkerIconInfo}.
     *
     * @memberof ClusterLayerDirective
     */
    get IconInfo(): IMarkerIconInfo;
    set IconInfo(val: IMarkerIconInfo);
    /**
     * Gets or sets An offset applied to the positioning of the layer.
     *
     * @memberof ClusterLayerDirective
     */
    get LayerOffset(): IPoint;
    set LayerOffset(val: IPoint);
    /**
     * Gets or sets the minimum pins required to form a cluster
     *
     * @readonly
     * @memberof ClusterLayerDirective
     */
    get MinimumClusterSize(): number;
    set MinimumClusterSize(val: number);
    /**
     * Gets or sets the options for spider clustering behavior. See {@link ISpiderClusterOptions}
     *
     * @memberof ClusterLayerDirective
     */
    get SpiderClusterOptions(): ISpiderClusterOptions;
    set SpiderClusterOptions(val: ISpiderClusterOptions);
    /**
     * Gets or sets the cluster styles
     *
     * @readonly
     * @memberof ClusterLayerDirective
     */
    get Styles(): Array<IClusterIconInfo>;
    set Styles(val: Array<IClusterIconInfo>);
    /**
     * Gets or sets whether to use dynamic markers. Dynamic markers change in size and color depending on the number of
     * pins in the cluster. If set to true, this will take precendence over any custom marker creation.
     *
     * @memberof ClusterLayerDirective
     */
    get UseDynamicSizeMarkers(): boolean;
    set UseDynamicSizeMarkers(val: boolean);
    /**
     * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
     *
     * @memberof ClusterLayerDirective
     */
    get ZIndex(): number;
    set ZIndex(val: number);
    /**
     * Gets or sets whether the cluster should zoom in on click
     *
     * @readonly
     * @memberof ClusterLayerDirective
     */
    get ZoomOnClick(): boolean;
    set ZoomOnClick(val: boolean);
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
    static CreateDynamicSizeMarker(size: number, info: IMarkerIconInfo, baseMarkerSize: number, ranges: Map<number, string>): string;
    /**
     * Creates an instance of ClusterLayerDirective.
     *
     * @param _layerService - Concreted implementation of a cluster layer service for the underlying maps
     * implementations. Generally provided via injections.
     * @param _containerRef - A reference to the view container of the layer. Generally provided via injection.
     *
     * @memberof ClusterLayerDirective
     */
    constructor(_layerService: ClusterService, _containerRef: ViewContainerRef);
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     *
     * @memberof ClusterLayerDirective
     */
    ngOnChanges(changes: {
        [propName: string]: SimpleChange;
    }): void;
}
