import { Component, ContentChildren, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { InfoBoxService } from '../services/infobox.service';
import { InfoBoxActionDirective } from './infobox-action';
/**
 * internal counter to use as ids for multiple infoboxes.
 */
let infoBoxId = 0;
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
export class InfoBoxComponent {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of InfoBoxComponent.
     * @param _infoBoxService - Concrete {@link InfoBoxService} implementation for underlying Map architecture.
     *
     * @memberof InfoBoxComponent
     */
    constructor(_infoBoxService) {
        this._infoBoxService = _infoBoxService;
        ///
        /// Field declarations
        ///
        this._infoBoxAddedToManager = false;
        this._id = (infoBoxId++).toString();
        /**
         * Determine whether only one infobox can be open at a time. Note that ANY info box settings.
         *
         * @memberof InfoBoxComponent
         */
        this.Modal = true;
        /**
         * Determines visibility of infobox
         *
         * @memberof InfoBoxComponent
         */
        this.Visible = false;
        /**
         * Determines if other info boxes should be closed before opening this one
         *
         * @memberof InfoBoxComponent
         */
        this.CloseInfoBoxesOnOpen = true;
        ///
        /// Delegate defintions
        ///
        /**
         * Emits an event when the info window is closed.
         *
         * @memberof InfoBoxComponent
         */
        this.InfoBoxClose = new EventEmitter();
    }
    ///
    /// Property declarations.
    ///
    /**
     * Gets the HTML content of the info box.
     *
     * @readonly
     * @memberof InfoBoxComponent
     */
    get HtmlContent() {
        if (this._content.nativeElement && this._content.nativeElement.innerText && this._content.nativeElement.innerText.trim() !== '') {
            return this._content.nativeElement.outerHTML;
        }
        return '';
    }
    /**
     * Gets the Id of the info box as a string.
     *
     * @readonly
     * @memberof InfoBoxComponent
     */
    get Id() { return this._id; }
    ///
    /// Public methods
    ///
    /**
     * Closes the Infobox.
     *
     * @memberof InfoBoxComponent
     */
    Close() {
        return this._infoBoxService.Close(this).then(() => {
            this.InfoBoxClose.emit(this._id);
        });
    }
    /**
     * Called on after component view as been initialized. Part of the ng Component life cycle.
     *
     * @memberof Map
     */
    ngAfterViewInit() {
        this._infoBoxService.AddInfoWindow(this);
        this._infoBoxAddedToManager = true;
        this.HandleEvents();
    }
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof Map
     */
    ngOnChanges(changes) {
        if (!this._infoBoxAddedToManager) {
            return;
        }
        if ((changes['latitude'] || changes['longitude']) && typeof this.Latitude === 'number' &&
            typeof this.Longitude === 'number') {
            this._infoBoxService.SetPosition(this, {
                latitude: changes['latitude'].currentValue,
                longitude: changes['longitude'].currentValue
            });
        }
        this.SetInfoWindowOptions(changes);
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof Map
     */
    ngOnDestroy() { this._infoBoxService.DeleteInfoWindow(this); }
    /**
     * Opens a closed info window.
     *
     * @param [loc]  - {@link ILatLong } representing position on which to open the window.
     * @returns - Promise that is fullfilled when the infobox has been opened.
     *
     * @memberof InfoBoxComponent
     */
    Open(loc) {
        return this._infoBoxService.Open(this, loc);
    }
    /**
     * Returns a string representation of the info box.
     *
     * @returns - string representation of the info box.
     *
     * @memberof InfoBoxComponent
     */
    ToString() { return 'InfoBoxComponent-' + this._id; }
    ///
    /// Private methods
    ///
    /**
     * Delegate handling the map click events.
     *
     * @memberof MapComponent
     */
    HandleEvents() {
        this._infoBoxService.CreateEventObservable('infowindowclose', this).subscribe(e => {
            this.InfoBoxClose.emit(this._id);
        });
    }
    /**
     * Sets the info window options
     *
     * @param changes
     *
     * @memberof InfoBoxComponent
     */
    SetInfoWindowOptions(changes) {
        const options = {};
        if (changes['title']) {
            options.title = this.Title;
        }
        if (changes['description']) {
            options.description = this.Description;
        }
        if (changes['disableAutoPan']) {
            options.disableAutoPan = this.DisableAutoPan;
        }
        if (changes['visible']) {
            options.visible = this.Visible;
        }
        if (changes['xOffset'] || changes['yOffset']) {
            if (options.pixelOffset == null) {
                options.pixelOffset = { x: 0, y: 0 };
            }
            options.pixelOffset.x = this.xOffset;
            options.pixelOffset.y = this.yOffset;
        }
        this._infoBoxService.SetOptions(this, options);
    }
}
InfoBoxComponent.decorators = [
    { type: Component, args: [{
                selector: 'x-info-box',
                template: `
        <div #infoBoxContent class='info-box-content'>
            <ng-content></ng-content>
        </div>`,
                encapsulation: ViewEncapsulation.None,
                styles: [`
        x-map .MicrosoftMap .Infobox .infobox-title { padding: 10px 10px 5px 10px }
        x-map .MicrosoftMap .Infobox .infobox-info { padding: 3px 10px 10px 10px }
        x-map .MicrosoftMap .Infobox .infobox-actions { height: auto }
    `]
            },] }
];
InfoBoxComponent.ctorParameters = () => [
    { type: InfoBoxService }
];
InfoBoxComponent.propDecorators = {
    _content: [{ type: ViewChild, args: ['infoBoxContent',] }],
    InfoWindowActions: [{ type: ContentChildren, args: [InfoBoxActionDirective,] }],
    Latitude: [{ type: Input }],
    Longitude: [{ type: Input }],
    Title: [{ type: Input }],
    Description: [{ type: Input }],
    DisableAutoPan: [{ type: Input }],
    MaxWidth: [{ type: Input }],
    Modal: [{ type: Input }],
    HostMarker: [{ type: Input }],
    Visible: [{ type: Input }],
    xOffset: [{ type: Input }],
    yOffset: [{ type: Input }],
    CloseInfoBoxesOnOpen: [{ type: Input }],
    InfoBoxClose: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mb2JveC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9jb21wb25lbnRzL2luZm9ib3gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVILFNBQVMsRUFDVCxlQUFlLEVBRWYsWUFBWSxFQUNaLEtBQUssRUFHTCxNQUFNLEVBR04sU0FBUyxFQUNULGlCQUFpQixFQUNwQixNQUFNLGVBQWUsQ0FBQztBQUd2QixPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFFN0QsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFFMUQ7O0dBRUc7QUFDSCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFFbEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBMEJHO0FBY0gsTUFBTSxPQUFPLGdCQUFnQjtJQWtKekIsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7Ozs7O09BS0c7SUFDSCxZQUFvQixlQUErQjtRQUEvQixvQkFBZSxHQUFmLGVBQWUsQ0FBZ0I7UUExSm5ELEdBQUc7UUFDSCxzQkFBc0I7UUFDdEIsR0FBRztRQUNLLDJCQUFzQixHQUFHLEtBQUssQ0FBQztRQUMvQixRQUFHLEdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBOEQvQzs7OztXQUlHO1FBQ2EsVUFBSyxHQUFHLElBQUksQ0FBQztRQVM3Qjs7OztXQUlHO1FBQ2EsWUFBTyxHQUFHLEtBQUssQ0FBQztRQWdCaEM7Ozs7V0FJRztRQUNhLHlCQUFvQixHQUFHLElBQUksQ0FBQztRQUU1QyxHQUFHO1FBQ0gsdUJBQXVCO1FBQ3ZCLEdBQUc7UUFFSDs7OztXQUlHO1FBQ2MsaUJBQVksR0FBeUIsSUFBSSxZQUFZLEVBQVUsQ0FBQztJQXFDMUIsQ0FBQztJQW5DeEQsR0FBRztJQUNILDBCQUEwQjtJQUMxQixHQUFHO0lBRUg7Ozs7O09BS0c7SUFDSCxJQUFXLFdBQVc7UUFDbEIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUM3SCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQztTQUNoRDtRQUNELE9BQU8sRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsSUFBVyxFQUFFLEtBQWEsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQWM1QyxHQUFHO0lBQ0gsa0JBQWtCO0lBQ2xCLEdBQUc7SUFFSDs7OztPQUlHO0lBQ0ksS0FBSztRQUNSLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUM5QyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLGVBQWU7UUFDbEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQztRQUNuQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLFdBQVcsQ0FBQyxPQUF3QztRQUN2RCxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFO1lBQUUsT0FBTztTQUFFO1FBQzdDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsUUFBUSxLQUFLLFFBQVE7WUFDbEYsT0FBTyxJQUFJLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRTtZQUNwQyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUU7Z0JBQ25DLFFBQVEsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsWUFBWTtnQkFDMUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxZQUFZO2FBQy9DLENBQUMsQ0FBQztTQUNOO1FBQ0QsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksV0FBVyxLQUFLLElBQUksQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXJFOzs7Ozs7O09BT0c7SUFDSSxJQUFJLENBQUMsR0FBYztRQUN0QixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksUUFBUSxLQUFhLE9BQU8sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFcEUsR0FBRztJQUNILG1CQUFtQjtJQUNuQixHQUFHO0lBRUg7Ozs7T0FJRztJQUNLLFlBQVk7UUFDaEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDOUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNLLG9CQUFvQixDQUFDLE9BQXdDO1FBQ2pFLE1BQU0sT0FBTyxHQUF1QixFQUFFLENBQUM7UUFDdkMsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7U0FBRTtRQUNyRCxJQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUFFLE9BQU8sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztTQUFFO1FBQ3ZFLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7U0FBRTtRQUNoRixJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUFFLE9BQU8sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUFFO1FBQzNELElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUMxQyxJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksSUFBSSxFQUFFO2dCQUFFLE9BQU8sQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQzthQUFFO1lBQzFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDckMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUN4QztRQUNELElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNuRCxDQUFDOzs7WUF0UkosU0FBUyxTQUFDO2dCQUNQLFFBQVEsRUFBRSxZQUFZO2dCQUN0QixRQUFRLEVBQUU7OztlQUdDO2dCQU1YLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO3lCQUw1Qjs7OztLQUlSO2FBRUo7OztZQWhEUSxjQUFjOzs7dUJBOERsQixTQUFTLFNBQUMsZ0JBQWdCO2dDQU8xQixlQUFlLFNBQUMsc0JBQXNCO3VCQVF0QyxLQUFLO3dCQU9MLEtBQUs7b0JBT0wsS0FBSzswQkFPTCxLQUFLOzZCQVFMLEtBQUs7dUJBU0wsS0FBSztvQkFPTCxLQUFLO3lCQU9MLEtBQUs7c0JBT0wsS0FBSztzQkFPTCxLQUFLO3NCQU9MLEtBQUs7bUNBT0wsS0FBSzsyQkFXTCxNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBBZnRlclZpZXdJbml0LFxuICAgIENvbXBvbmVudCxcbiAgICBDb250ZW50Q2hpbGRyZW4sXG4gICAgRWxlbWVudFJlZixcbiAgICBFdmVudEVtaXR0ZXIsXG4gICAgSW5wdXQsXG4gICAgT25DaGFuZ2VzLFxuICAgIE9uRGVzdHJveSxcbiAgICBPdXRwdXQsXG4gICAgUXVlcnlMaXN0LFxuICAgIFNpbXBsZUNoYW5nZSxcbiAgICBWaWV3Q2hpbGQsXG4gICAgVmlld0VuY2Fwc3VsYXRpb25cbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBJSW5mb1dpbmRvd09wdGlvbnMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL2lpbmZvLXdpbmRvdy1vcHRpb25zJztcbmltcG9ydCB7IElMYXRMb25nIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgeyBJbmZvQm94U2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL2luZm9ib3guc2VydmljZSc7XG5pbXBvcnQgeyBNYXBNYXJrZXJEaXJlY3RpdmUgfSBmcm9tICcuL21hcC1tYXJrZXInO1xuaW1wb3J0IHsgSW5mb0JveEFjdGlvbkRpcmVjdGl2ZSB9IGZyb20gJy4vaW5mb2JveC1hY3Rpb24nO1xuXG4vKipcbiAqIGludGVybmFsIGNvdW50ZXIgdG8gdXNlIGFzIGlkcyBmb3IgbXVsdGlwbGUgaW5mb2JveGVzLlxuICovXG5sZXQgaW5mb0JveElkID0gMDtcblxuLyoqXG4gKiBJbmZvQm94IHJlbmRlcnMgYSBpbmZvIHdpbmRvdyBpbnNpZGUgYSB7QGxpbmsgTWFwTWFya2VyRGlyZWN0aXZlfSBvciBzdGFuZGFsb25lLlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQge01hcENvbXBvbmVudCwgTWFwTWFya2VyRGlyZWN0aXZlLCBJbmZvQm94Q29tcG9uZW50LCBJbmZvQm94QWN0aW9uRGlyZWN0aXZlfSBmcm9tICcuLi4nO1xuICpcbiAqIEBDb21wb25lbnQoe1xuICogIHNlbGVjdG9yOiAnbXktbWFwLWNtcCcsXG4gKiAgc3R5bGVzOiBbYFxuICogICAgLm1hcC1jb250YWluZXIgeyBoZWlnaHQ6IDMwMHB4OyB9XG4gKiBgXSxcbiAqICB0ZW1wbGF0ZTogYFxuICogICAgPHgtbWFwIFtMYXRpdHVkZV09XCJsYXRcIiBbTG9uZ2l0dWRlXT1cImxuZ1wiIFtab29tXT1cInpvb21cIj5cbiAqICAgICAgPHgtbWFwLW1hcmtlciBbTGF0aXR1ZGVdPVwibGF0XCIgW0xvbmdpdHVkZV09XCJsbmdcIiBbTGFiZWxdPVwiJ00nXCI+XG4gKiAgICAgICAgPHgtaW5mby1ib3ggW0Rpc2FibGVBdXRvUGFuXT1cInRydWVcIj5cbiAqICAgICAgICAgIEhpLCB0aGlzIGlzIHRoZSBjb250ZW50IG9mIHRoZSA8c3Ryb25nPmluZm8gd2luZG93PC9zdHJvbmc+XG4gKiAgICAgICAgIDwveC1pbmZvLWJveD5cbiAqICAgICAgIDwveC1tYXAtbWFya2VyPlxuICogICAgIDwveC1tYXA+XG4gKiAgYFxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBleHBvcnRcbiAqL1xuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICd4LWluZm8tYm94JyxcbiAgICB0ZW1wbGF0ZTogYFxuICAgICAgICA8ZGl2ICNpbmZvQm94Q29udGVudCBjbGFzcz0naW5mby1ib3gtY29udGVudCc+XG4gICAgICAgICAgICA8bmctY29udGVudD48L25nLWNvbnRlbnQ+XG4gICAgICAgIDwvZGl2PmAsXG4gICAgc3R5bGVzOiBbYFxuICAgICAgICB4LW1hcCAuTWljcm9zb2Z0TWFwIC5JbmZvYm94IC5pbmZvYm94LXRpdGxlIHsgcGFkZGluZzogMTBweCAxMHB4IDVweCAxMHB4IH1cbiAgICAgICAgeC1tYXAgLk1pY3Jvc29mdE1hcCAuSW5mb2JveCAuaW5mb2JveC1pbmZvIHsgcGFkZGluZzogM3B4IDEwcHggMTBweCAxMHB4IH1cbiAgICAgICAgeC1tYXAgLk1pY3Jvc29mdE1hcCAuSW5mb2JveCAuaW5mb2JveC1hY3Rpb25zIHsgaGVpZ2h0OiBhdXRvIH1cbiAgICBgXSxcbiAgICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lXG59KVxuZXhwb3J0IGNsYXNzIEluZm9Cb3hDb21wb25lbnQgaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uQ2hhbmdlcywgQWZ0ZXJWaWV3SW5pdCB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfaW5mb0JveEFkZGVkVG9NYW5hZ2VyID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfaWQ6IHN0cmluZyA9IChpbmZvQm94SWQrKykudG9TdHJpbmcoKTtcblxuICAgIC8qKlxuICAgICAqIEhUTUwgY29uZW50IG9mIHRoZSBpbmZvYm94XG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveENvbXBvbmVudFxuICAgICAqL1xuICAgIEBWaWV3Q2hpbGQoJ2luZm9Cb3hDb250ZW50JykgcHJpdmF0ZSBfY29udGVudDogRWxlbWVudFJlZjtcblxuICAgIC8qKlxuICAgICAqIFplcm8gb3IgbW9yZSBhY3Rpb25zIHRvIHNob3cgb24gdGhlIGluZm8gd2luZG93XG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveENvbXBvbmVudFxuICAgICAqL1xuICAgIEBDb250ZW50Q2hpbGRyZW4oSW5mb0JveEFjdGlvbkRpcmVjdGl2ZSkgcHVibGljIEluZm9XaW5kb3dBY3Rpb25zOiBRdWVyeUxpc3Q8SW5mb0JveEFjdGlvbkRpcmVjdGl2ZT47XG5cblxuICAgIC8qKlxuICAgICAqIFRoZSBsYXRpdHVkZSBwb3NpdGlvbiBvZiB0aGUgaW5mbyB3aW5kb3cgKG9ubHkgdXNlZnVsbCBpZiB5b3UgdXNlIGl0IG91c2lkZSBvZiBhIHtAbGluayBNYXBNYXJrZXJ9KS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBJbmZvQm94Q29tcG9uZW50XG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIExhdGl0dWRlOiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbG9uZ2l0dWRlIHBvc2l0aW9uIG9mIHRoZSBpbmZvIHdpbmRvdyAob25seSB1c2VmdWxsIGlmIHlvdSB1c2UgaXQgb3VzaWRlIG9mIGEge0BsaW5rIE1hcE1hcmtlcn0pLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEluZm9Cb3hDb21wb25lbnRcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgTG9uZ2l0dWRlOiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdGl0bGUgdG8gZGlzcGxheSBpbiB0aGUgaW5mbyB3aW5kb3dcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBJbmZvQm94Q29tcG9uZW50XG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIFRpdGxlOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGVzY3JpcHRpb24gdG8gZGlzcGxheSBpbiB0aGUgaW5mbyB3aW5kb3cuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveENvbXBvbmVudFxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBEZXNjcmlwdGlvbjogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogRGlzYWJsZSBhdXRvLXBhbiBvbiBvcGVuLiBCeSBkZWZhdWx0LCB0aGUgaW5mbyB3aW5kb3cgd2lsbCBwYW4gdGhlIG1hcCBzbyB0aGF0IGl0IGlzIGZ1bGx5XG4gICAgICogdmlzaWJsZSB3aGVuIGl0IG9wZW5zLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEluZm9Cb3hDb21wb25lbnRcbiAgICAgKi9cbiAgICBASW5wdXQoKSBwdWJsaWMgRGlzYWJsZUF1dG9QYW46IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiAgTWF4aW11bSB3aWR0aCBvZiB0aGUgaW5mb3dpbmRvdywgcmVnYXJkbGVzcyBvZiBjb250ZW50J3Mgd2lkdGguIFRoaXMgdmFsdWUgaXMgb25seSBjb25zaWRlcmVkXG4gICAgICogIGlmIGl0IGlzIHNldCBiZWZvcmUgYSBjYWxsIHRvIG9wZW4uIFRvIGNoYW5nZSB0aGUgbWF4aW11bSB3aWR0aCB3aGVuIGNoYW5naW5nIGNvbnRlbnQsIGNhbGxcbiAgICAgKiAgY2xvc2UsIHVwZGF0ZSBtYXhXaWR0aCwgYW5kIHRoZW4gb3Blbi5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBJbmZvQm94Q29tcG9uZW50XG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIE1heFdpZHRoOiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciBvbmx5IG9uZSBpbmZvYm94IGNhbiBiZSBvcGVuIGF0IGEgdGltZS4gTm90ZSB0aGF0IEFOWSBpbmZvIGJveCBzZXR0aW5ncy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBJbmZvQm94Q29tcG9uZW50XG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIE1vZGFsID0gdHJ1ZTtcblxuICAgIC8qKlxuICAgICAqIEhvbGRzIHRoZSBtYXJrZXIgdGhhdCBpcyB0aGUgaG9zdCBvZiB0aGUgaW5mbyB3aW5kb3cgKGlmIGF2YWlsYWJsZSlcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBJbmZvQm94Q29tcG9uZW50XG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIEhvc3RNYXJrZXI6IE1hcE1hcmtlckRpcmVjdGl2ZTtcblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgdmlzaWJpbGl0eSBvZiBpbmZvYm94XG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveENvbXBvbmVudFxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBWaXNpYmxlID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBIb3Jpem9udGFsIG9mZnNldCBvZiB0aGUgaW5mb2JveCBmcm9tIHRoZSBob3N0IG1hcmtlciBsYXQvbG9uZyBvciB0aGUgc2VwZWNpZmllZCBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBJbmZvQm94Q29tcG9uZW50XG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIHhPZmZzZXQ6IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIFZlcnRpY2FsIG9mZnNldCBmb3IgdGhlIGluZm9ib3ggZnJvbSB0aGUgaG9zdCBtYXJrZXIgbGF0L2xvbmcgb3IgdGhlIHNwZWNpZmllZCBjb29yZGluYXRlcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBJbmZvQm94Q29tcG9uZW50XG4gICAgICovXG4gICAgQElucHV0KCkgcHVibGljIHlPZmZzZXQ6IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgb3RoZXIgaW5mbyBib3hlcyBzaG91bGQgYmUgY2xvc2VkIGJlZm9yZSBvcGVuaW5nIHRoaXMgb25lXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveENvbXBvbmVudFxuICAgICAqL1xuICAgIEBJbnB1dCgpIHB1YmxpYyBDbG9zZUluZm9Cb3hlc09uT3BlbiA9IHRydWU7XG5cbiAgICAvLy9cbiAgICAvLy8gRGVsZWdhdGUgZGVmaW50aW9uc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogRW1pdHMgYW4gZXZlbnQgd2hlbiB0aGUgaW5mbyB3aW5kb3cgaXMgY2xvc2VkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEluZm9Cb3hDb21wb25lbnRcbiAgICAgKi9cbiAgICBAT3V0cHV0KCkgcHVibGljIEluZm9Cb3hDbG9zZTogRXZlbnRFbWl0dGVyPHN0cmluZz4gPSBuZXcgRXZlbnRFbWl0dGVyPHN0cmluZz4oKTtcblxuICAgIC8vL1xuICAgIC8vLyBQcm9wZXJ0eSBkZWNsYXJhdGlvbnMuXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBIVE1MIGNvbnRlbnQgb2YgdGhlIGluZm8gYm94LlxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIEluZm9Cb3hDb21wb25lbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IEh0bWxDb250ZW50KCk6IHN0cmluZyB7XG4gICAgICAgIGlmICh0aGlzLl9jb250ZW50Lm5hdGl2ZUVsZW1lbnQgJiYgdGhpcy5fY29udGVudC5uYXRpdmVFbGVtZW50LmlubmVyVGV4dCAmJiB0aGlzLl9jb250ZW50Lm5hdGl2ZUVsZW1lbnQuaW5uZXJUZXh0LnRyaW0oKSAhPT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250ZW50Lm5hdGl2ZUVsZW1lbnQub3V0ZXJIVE1MO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBJZCBvZiB0aGUgaW5mbyBib3ggYXMgYSBzdHJpbmcuXG4gICAgICpcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveENvbXBvbmVudFxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgSWQoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuX2lkOyB9XG5cbiAgICAvLy9cbiAgICAvLy8gQ29uc3RydWN0b3JcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgSW5mb0JveENvbXBvbmVudC5cbiAgICAgKiBAcGFyYW0gX2luZm9Cb3hTZXJ2aWNlIC0gQ29uY3JldGUge0BsaW5rIEluZm9Cb3hTZXJ2aWNlfSBpbXBsZW1lbnRhdGlvbiBmb3IgdW5kZXJseWluZyBNYXAgYXJjaGl0ZWN0dXJlLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEluZm9Cb3hDb21wb25lbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9pbmZvQm94U2VydmljZTogSW5mb0JveFNlcnZpY2UpIHsgfVxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDbG9zZXMgdGhlIEluZm9ib3guXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveENvbXBvbmVudFxuICAgICAqL1xuICAgIHB1YmxpYyBDbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luZm9Cb3hTZXJ2aWNlLkNsb3NlKHRoaXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5JbmZvQm94Q2xvc2UuZW1pdCh0aGlzLl9pZCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBvbiBhZnRlciBjb21wb25lbnQgdmlldyBhcyBiZWVuIGluaXRpYWxpemVkLiBQYXJ0IG9mIHRoZSBuZyBDb21wb25lbnQgbGlmZSBjeWNsZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBcbiAgICAgKi9cbiAgICBwdWJsaWMgbmdBZnRlclZpZXdJbml0KCkge1xuICAgICAgICB0aGlzLl9pbmZvQm94U2VydmljZS5BZGRJbmZvV2luZG93KHRoaXMpO1xuICAgICAgICB0aGlzLl9pbmZvQm94QWRkZWRUb01hbmFnZXIgPSB0cnVlO1xuICAgICAgICB0aGlzLkhhbmRsZUV2ZW50cygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIGNoYW5nZXMgdG8gdGhlIGRhdGFib3VkIHByb3BlcnRpZXMgb2NjdXIuIFBhcnQgb2YgdGhlIG5nIENvbXBvbmVudCBsaWZlIGN5Y2xlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYW5nZXMgLSBDaGFuZ2VzIHRoYXQgaGF2ZSBvY2N1cmVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcFxuICAgICAqL1xuICAgIHB1YmxpYyBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiB7IFtrZXk6IHN0cmluZ106IFNpbXBsZUNoYW5nZSB9KSB7XG4gICAgICAgIGlmICghdGhpcy5faW5mb0JveEFkZGVkVG9NYW5hZ2VyKSB7IHJldHVybjsgfVxuICAgICAgICBpZiAoKGNoYW5nZXNbJ2xhdGl0dWRlJ10gfHwgY2hhbmdlc1snbG9uZ2l0dWRlJ10pICYmIHR5cGVvZiB0aGlzLkxhdGl0dWRlID09PSAnbnVtYmVyJyAmJlxuICAgICAgICAgICAgdHlwZW9mIHRoaXMuTG9uZ2l0dWRlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgdGhpcy5faW5mb0JveFNlcnZpY2UuU2V0UG9zaXRpb24odGhpcywge1xuICAgICAgICAgICAgICAgIGxhdGl0dWRlOiBjaGFuZ2VzWydsYXRpdHVkZSddLmN1cnJlbnRWYWx1ZSxcbiAgICAgICAgICAgICAgICBsb25naXR1ZGU6IGNoYW5nZXNbJ2xvbmdpdHVkZSddLmN1cnJlbnRWYWx1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5TZXRJbmZvV2luZG93T3B0aW9ucyhjaGFuZ2VzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgb24gY29tcG9uZW50IGRlc3RydWN0aW9uLiBGcmVlcyB0aGUgcmVzb3VyY2VzIHVzZWQgYnkgdGhlIGNvbXBvbmVudC4gUGFydCBvZiB0aGUgbmcgQ29tcG9uZW50IGxpZmUgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTWFwXG4gICAgICovXG4gICAgcHVibGljIG5nT25EZXN0cm95KCkgeyB0aGlzLl9pbmZvQm94U2VydmljZS5EZWxldGVJbmZvV2luZG93KHRoaXMpOyB9XG5cbiAgICAvKipcbiAgICAgKiBPcGVucyBhIGNsb3NlZCBpbmZvIHdpbmRvdy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBbbG9jXSAgLSB7QGxpbmsgSUxhdExvbmcgfSByZXByZXNlbnRpbmcgcG9zaXRpb24gb24gd2hpY2ggdG8gb3BlbiB0aGUgd2luZG93LlxuICAgICAqIEByZXR1cm5zIC0gUHJvbWlzZSB0aGF0IGlzIGZ1bGxmaWxsZWQgd2hlbiB0aGUgaW5mb2JveCBoYXMgYmVlbiBvcGVuZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveENvbXBvbmVudFxuICAgICAqL1xuICAgIHB1YmxpYyBPcGVuKGxvYz86IElMYXRMb25nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pbmZvQm94U2VydmljZS5PcGVuKHRoaXMsIGxvYyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgaW5mbyBib3guXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyAtIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgaW5mbyBib3guXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveENvbXBvbmVudFxuICAgICAqL1xuICAgIHB1YmxpYyBUb1N0cmluZygpOiBzdHJpbmcgeyByZXR1cm4gJ0luZm9Cb3hDb21wb25lbnQtJyArIHRoaXMuX2lkOyB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHJpdmF0ZSBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBEZWxlZ2F0ZSBoYW5kbGluZyB0aGUgbWFwIGNsaWNrIGV2ZW50cy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXBDb21wb25lbnRcbiAgICAgKi9cbiAgICBwcml2YXRlIEhhbmRsZUV2ZW50cygpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5faW5mb0JveFNlcnZpY2UuQ3JlYXRlRXZlbnRPYnNlcnZhYmxlKCdpbmZvd2luZG93Y2xvc2UnLCB0aGlzKS5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICAgICAgICB0aGlzLkluZm9Cb3hDbG9zZS5lbWl0KHRoaXMuX2lkKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgaW5mbyB3aW5kb3cgb3B0aW9uc1xuICAgICAqXG4gICAgICogQHBhcmFtIGNoYW5nZXNcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBJbmZvQm94Q29tcG9uZW50XG4gICAgICovXG4gICAgcHJpdmF0ZSBTZXRJbmZvV2luZG93T3B0aW9ucyhjaGFuZ2VzOiB7IFtrZXk6IHN0cmluZ106IFNpbXBsZUNoYW5nZSB9KSB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnM6IElJbmZvV2luZG93T3B0aW9ucyA9IHt9O1xuICAgICAgICBpZiAoY2hhbmdlc1sndGl0bGUnXSkgeyBvcHRpb25zLnRpdGxlID0gdGhpcy5UaXRsZTsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snZGVzY3JpcHRpb24nXSkgeyBvcHRpb25zLmRlc2NyaXB0aW9uID0gdGhpcy5EZXNjcmlwdGlvbjsgfVxuICAgICAgICBpZiAoY2hhbmdlc1snZGlzYWJsZUF1dG9QYW4nXSkgeyBvcHRpb25zLmRpc2FibGVBdXRvUGFuID0gdGhpcy5EaXNhYmxlQXV0b1BhbjsgfVxuICAgICAgICBpZiAoY2hhbmdlc1sndmlzaWJsZSddKSB7IG9wdGlvbnMudmlzaWJsZSA9IHRoaXMuVmlzaWJsZTsgfVxuICAgICAgICBpZiAoY2hhbmdlc1sneE9mZnNldCddIHx8IGNoYW5nZXNbJ3lPZmZzZXQnXSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGl4ZWxPZmZzZXQgPT0gbnVsbCkgeyBvcHRpb25zLnBpeGVsT2Zmc2V0ID0geyB4OiAwLCB5OiAwIH07IH1cbiAgICAgICAgICAgIG9wdGlvbnMucGl4ZWxPZmZzZXQueCA9IHRoaXMueE9mZnNldDtcbiAgICAgICAgICAgIG9wdGlvbnMucGl4ZWxPZmZzZXQueSA9IHRoaXMueU9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbmZvQm94U2VydmljZS5TZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgIH1cbn1cbiJdfQ==