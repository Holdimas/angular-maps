import { AfterViewInit, EventEmitter, OnChanges, OnDestroy, QueryList, SimpleChange } from '@angular/core';
import { ILatLong } from '../interfaces/ilatlong';
import { InfoBoxService } from '../services/infobox.service';
import { MapMarkerDirective } from './map-marker';
import { InfoBoxActionDirective } from './infobox-action';
/**
 * InfoBox renders a info window inside a {@link MapMarkerDirective} or standalone.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapMarkerDirective, InfoBoxComponent, InfoBoxActionDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *    .map-container { height: 300px; }
 * `],
 *  template: `
 *    <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-marker [Latitude]="lat" [Longitude]="lng" [Label]="'M'">
 *        <x-info-box [DisableAutoPan]="true">
 *          Hi, this is the content of the <strong>info window</strong>
 *         </x-info-box>
 *       </x-map-marker>
 *     </x-map>
 *  `
 * })
 * ```
 *
 * @export
 */
export declare class InfoBoxComponent implements OnDestroy, OnChanges, AfterViewInit {
    private _infoBoxService;
    private _infoBoxAddedToManager;
    private _id;
    /**
     * HTML conent of the infobox
     *
     * @memberof InfoBoxComponent
     */
    private _content;
    /**
     * Zero or more actions to show on the info window
     *
     * @memberof InfoBoxComponent
     */
    InfoWindowActions: QueryList<InfoBoxActionDirective>;
    /**
     * The latitude position of the info window (only usefull if you use it ouside of a {@link MapMarker}).
     *
     * @memberof InfoBoxComponent
     */
    Latitude: number;
    /**
     * The longitude position of the info window (only usefull if you use it ouside of a {@link MapMarker}).
     *
     * @memberof InfoBoxComponent
     */
    Longitude: number;
    /**
     * The title to display in the info window
     *
     * @memberof InfoBoxComponent
     */
    Title: string;
    /**
     * The description to display in the info window.
     *
     * @memberof InfoBoxComponent
     */
    Description: string;
    /**
     * Disable auto-pan on open. By default, the info window will pan the map so that it is fully
     * visible when it opens.
     *
     * @memberof InfoBoxComponent
     */
    DisableAutoPan: boolean;
    /**
     *  Maximum width of the infowindow, regardless of content's width. This value is only considered
     *  if it is set before a call to open. To change the maximum width when changing content, call
     *  close, update maxWidth, and then open.
     *
     * @memberof InfoBoxComponent
     */
    MaxWidth: number;
    /**
     * Determine whether only one infobox can be open at a time. Note that ANY info box settings.
     *
     * @memberof InfoBoxComponent
     */
    Modal: boolean;
    /**
     * Holds the marker that is the host of the info window (if available)
     *
     * @memberof InfoBoxComponent
     */
    HostMarker: MapMarkerDirective;
    /**
     * Determines visibility of infobox
     *
     * @memberof InfoBoxComponent
     */
    Visible: boolean;
    /**
     * Horizontal offset of the infobox from the host marker lat/long or the sepecified coordinates.
     *
     * @memberof InfoBoxComponent
     */
    xOffset: number;
    /**
     * Vertical offset for the infobox from the host marker lat/long or the specified coordinates.
     *
     * @memberof InfoBoxComponent
     */
    yOffset: number;
    /**
     * Determines if other info boxes should be closed before opening this one
     *
     * @memberof InfoBoxComponent
     */
    CloseInfoBoxesOnOpen: boolean;
    /**
     * Emits an event when the info window is closed.
     *
     * @memberof InfoBoxComponent
     */
    InfoBoxClose: EventEmitter<string>;
    /**
     * Gets the HTML content of the info box.
     *
     * @readonly
     * @memberof InfoBoxComponent
     */
    get HtmlContent(): string;
    /**
     * Gets the Id of the info box as a string.
     *
     * @readonly
     * @memberof InfoBoxComponent
     */
    get Id(): string;
    /**
     * Creates an instance of InfoBoxComponent.
     * @param _infoBoxService - Concrete {@link InfoBoxService} implementation for underlying Map architecture.
     *
     * @memberof InfoBoxComponent
     */
    constructor(_infoBoxService: InfoBoxService);
    /**
     * Closes the Infobox.
     *
     * @memberof InfoBoxComponent
     */
    Close(): Promise<void>;
    /**
     * Called on after component view as been initialized. Part of the ng Component life cycle.
     *
     * @memberof Map
     */
    ngAfterViewInit(): void;
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof Map
     */
    ngOnChanges(changes: {
        [key: string]: SimpleChange;
    }): void;
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof Map
     */
    ngOnDestroy(): void;
    /**
     * Opens a closed info window.
     *
     * @param [loc]  - {@link ILatLong } representing position on which to open the window.
     * @returns - Promise that is fullfilled when the infobox has been opened.
     *
     * @memberof InfoBoxComponent
     */
    Open(loc?: ILatLong): Promise<void>;
    /**
     * Returns a string representation of the info box.
     *
     * @returns - string representation of the info box.
     *
     * @memberof InfoBoxComponent
     */
    ToString(): string;
    /**
     * Delegate handling the map click events.
     *
     * @memberof MapComponent
     */
    private HandleEvents;
    /**
     * Sets the info window options
     *
     * @param changes
     *
     * @memberof InfoBoxComponent
     */
    private SetInfoWindowOptions;
}
