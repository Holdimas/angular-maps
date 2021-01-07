import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { InfoBoxService } from '../infobox.service';
import { MarkerService } from '../marker.service';
import { MapService } from '../map.service';
import { GoogleMapEventsLookup } from '../../models/google/google-events-lookup';
export class GoogleInfoBoxService extends InfoBoxService {
    ///
    /// Constructors
    ///
    /**
     * Creates an instance of GoogleInfoBoxService.
     * @param _mapService
     * @param _markerService
     * @param _zone
     *
     * @memberof GoogleInfoBoxService
     */
    constructor(_mapService, _markerService, _zone) {
        super();
        this._mapService = _mapService;
        this._markerService = _markerService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._boxes = new Map();
    }
    /**
     * Creates a new instance of an info window
     *
     * @param info
     *
     * @memberof GoogleInfoBoxService
     */
    AddInfoWindow(info) {
        const options = {};
        if (info.HtmlContent !== '') {
            options.htmlContent = info.HtmlContent;
        }
        else {
            options.title = info.Title;
            options.description = info.Description;
        }
        if (info.xOffset || info.yOffset) {
            if (options.pixelOffset == null) {
                options.pixelOffset = { x: 0, y: 0 };
            }
            if (info.xOffset) {
                options.pixelOffset.x = info.xOffset;
            }
            if (info.yOffset) {
                options.pixelOffset.y = info.yOffset;
            }
        }
        options.disableAutoPan = info.DisableAutoPan;
        options.visible = info.Visible;
        if (typeof info.Latitude === 'number' && typeof info.Longitude === 'number') {
            options.position = { latitude: info.Latitude, longitude: info.Longitude };
        }
        const infoWindowPromise = this._mapService.CreateInfoWindow(options);
        this._boxes.set(info, infoWindowPromise);
    }
    /**
     * Closes the info window
     *
     * @param info
     * @returns -  A promise that is resolved when the info box is closed.
     *
     * @memberof GoogleInfoBoxService
     */
    Close(info) {
        return this._boxes.get(info).then(w => {
            w.Close();
        });
    }
    /**
     * Registers an event delegate for an info window.
     *
     * @param eventName - The name of the event to register (e.g. 'click')
     * @param infoComponent - The {@link InfoBoxComponent} for which to register the event.
     * @returns - Observable emiting an instance of T each time the event occurs.
     *
     * @memberof GoogleInfoBoxService
     */
    CreateEventObservable(eventName, infoComponent) {
        const googleEventName = GoogleMapEventsLookup[eventName];
        return Observable.create((observer) => {
            this._boxes.get(infoComponent).then((b) => {
                b.AddListener(googleEventName, (e) => this._zone.run(() => observer.next(e)));
            });
        });
    }
    /**
     * Deletes the info window
     *
     * @param info
     *
     * @memberof GoogleInfoBoxService
     */
    DeleteInfoWindow(info) {
        return Promise.resolve();
    }
    /**
     * Opens the info window. Window opens on a marker, if supplied, or a specific location if given
     *
     * @param info
     * @param [loc]
     *
     * @memberof GoogleInfoBoxService
     */
    Open(info, loc) {
        if (info.CloseInfoBoxesOnOpen || info.Modal) {
            // close all open info boxes
            this._boxes.forEach((box, i) => {
                if (info.Id !== i.Id) {
                    box.then((w) => {
                        if (w.IsOpen) {
                            w.Close();
                            i.Close();
                        }
                    });
                }
            });
        }
        return this._boxes.get(info).then((w) => {
            const options = {};
            if (info.HtmlContent !== '') {
                options.htmlContent = info.HtmlContent;
            }
            else {
                options.title = info.Title;
                options.description = info.Description;
            }
            w.SetOptions(options);
            if (info.HostMarker != null) {
                return this._markerService.GetNativeMarker(info.HostMarker).then((marker) => {
                    return this._mapService.MapPromise.then((map) => w.Open(marker.NativePrimitve));
                });
            }
            return this._mapService.MapPromise.then((map) => {
                if (loc) {
                    w.SetPosition(loc);
                }
                w.Open();
            });
        });
    }
    /**
     * Sets the info window options
     *
     * @param info
     * @param options
     *
     * @memberof GoogleInfoBoxService
     */
    SetOptions(info, options) {
        return this._boxes.get(info).then((w) => {
            w.SetOptions(options);
        });
    }
    /**
     * Sets the info window position
     *
     * @param info
     * @param latlng
     *
     * @memberof GoogleInfoBoxService
     */
    SetPosition(info, latlng) {
        this._boxes.get(info).then((w) => {
            w.SetPosition(latlng);
        });
        return Promise.resolve();
    }
}
GoogleInfoBoxService.decorators = [
    { type: Injectable }
];
GoogleInfoBoxService.ctorParameters = () => [
    { type: MapService },
    { type: MarkerService },
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLWluZm9ib3guc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9zZXJ2aWNlcy9nb29nbGUvZ29vZ2xlLWluZm9ib3guc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNuRCxPQUFPLEVBQUUsVUFBVSxFQUFZLE1BQU0sTUFBTSxDQUFDO0FBSTVDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNwRCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDbEQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBSTVDLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDBDQUEwQyxDQUFDO0FBR2pGLE1BQU0sT0FBTyxvQkFBcUIsU0FBUSxjQUFjO0lBUXBELEdBQUc7SUFDSCxnQkFBZ0I7SUFDaEIsR0FBRztJQUVIOzs7Ozs7O09BT0c7SUFDSCxZQUFvQixXQUF1QixFQUMvQixjQUE2QixFQUM3QixLQUFhO1FBQ3JCLEtBQUssRUFBRSxDQUFDO1FBSFEsZ0JBQVcsR0FBWCxXQUFXLENBQVk7UUFDL0IsbUJBQWMsR0FBZCxjQUFjLENBQWU7UUFDN0IsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQXBCekIsR0FBRztRQUNILHNCQUFzQjtRQUN0QixHQUFHO1FBRUssV0FBTSxHQUErQyxJQUFJLEdBQUcsRUFBK0MsQ0FBQztJQWtCcEgsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLGFBQWEsQ0FBQyxJQUFzQjtRQUN2QyxNQUFNLE9BQU8sR0FBdUIsRUFBRSxDQUFDO1FBQ3ZDLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxFQUFFLEVBQUU7WUFDekIsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1NBQzFDO2FBQ0k7WUFDRCxPQUFP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QUMsR0FBRyxFQUFFLEVBQUU7Z0JBQzVDLElBQUksR0FBRyxFQUFFO29CQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQUU7Z0JBQ2hDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNiLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLFVBQVUsQ0FBQyxJQUFzQixFQUFFLE9BQTJCO1FBQ2pFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBbUIsRUFBRSxFQUFFO1lBQ3RELENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLFdBQVcsQ0FBQyxJQUFzQixFQUFFLE1BQWdCO1FBQ3ZELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQzdCLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM3QixDQUFDOzs7WUE1S0osVUFBVTs7O1lBTkYsVUFBVTtZQURWLGFBQWE7WUFORCxNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBPYnNlcnZlciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgSW5mb0JveENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvaW5mb2JveCc7XG5pbXBvcnQgeyBJSW5mb1dpbmRvd09wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lpbmZvLXdpbmRvdy1vcHRpb25zJztcbmltcG9ydCB7IElMYXRMb25nIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgeyBJbmZvQm94U2VydmljZSB9IGZyb20gJy4uL2luZm9ib3guc2VydmljZSc7XG5pbXBvcnQgeyBNYXJrZXJTZXJ2aWNlIH0gZnJvbSAnLi4vbWFya2VyLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWFwU2VydmljZSB9IGZyb20gJy4uL21hcC5zZXJ2aWNlJztcbmltcG9ydCB7IEluZm9XaW5kb3cgfSBmcm9tICcuLi8uLi9tb2RlbHMvaW5mby13aW5kb3cnO1xuaW1wb3J0IHsgR29vZ2xlSW5mb1dpbmRvdyB9IGZyb20gJy4uLy4uL21vZGVscy9nb29nbGUvZ29vZ2xlLWluZm8td2luZG93JztcbmltcG9ydCB7IEdvb2dsZU1hcmtlciB9IGZyb20gJy4uLy4uL21vZGVscy9nb29nbGUvZ29vZ2xlLW1hcmtlcic7XG5pbXBvcnQgeyBHb29nbGVNYXBFdmVudHNMb29rdXAgfSBmcm9tICcuLi8uLi9tb2RlbHMvZ29vZ2xlL2dvb2dsZS1ldmVudHMtbG9va3VwJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEdvb2dsZUluZm9Cb3hTZXJ2aWNlIGV4dGVuZHMgSW5mb0JveFNlcnZpY2Uge1xuXG4gICAgLy8vXG4gICAgLy8vIEZpZWxkIGRlY2xhcmF0aW9uc1xuICAgIC8vL1xuXG4gICAgcHJpdmF0ZSBfYm94ZXM6IE1hcDxJbmZvQm94Q29tcG9uZW50LCBQcm9taXNlPEluZm9XaW5kb3c+PiA9IG5ldyBNYXA8SW5mb0JveENvbXBvbmVudCwgUHJvbWlzZTxHb29nbGVJbmZvV2luZG93Pj4oKTtcblxuICAgIC8vL1xuICAgIC8vLyBDb25zdHJ1Y3RvcnNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgR29vZ2xlSW5mb0JveFNlcnZpY2UuXG4gICAgICogQHBhcmFtIF9tYXBTZXJ2aWNlXG4gICAgICogQHBhcmFtIF9tYXJrZXJTZXJ2aWNlXG4gICAgICogQHBhcmFtIF96b25lXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlSW5mb0JveFNlcnZpY2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9tYXBTZXJ2aWNlOiBNYXBTZXJ2aWNlLFxuICAgICAgICBwcml2YXRlIF9tYXJrZXJTZXJ2aWNlOiBNYXJrZXJTZXJ2aWNlLFxuICAgICAgICBwcml2YXRlIF96b25lOiBOZ1pvbmUpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIGluZm8gd2luZG93XG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5mb1xuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUluZm9Cb3hTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIEFkZEluZm9XaW5kb3coaW5mbzogSW5mb0JveENvbXBvbmVudCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvcHRpb25zOiBJSW5mb1dpbmRvd09wdGlvbnMgPSB7fTtcbiAgICAgICAgaWYgKGluZm8uSHRtbENvbnRlbnQgIT09ICcnKSB7XG4gICAgICAgICAgICBvcHRpb25zLmh0bWxDb250ZW50ID0gaW5mby5IdG1sQ29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG9wdGlvbnMudGl0bGUgPSBpbmZvLlRpdGxlO1xuICAgICAgICAgICAgb3B0aW9ucy5kZXNjcmlwdGlvbiA9IGluZm8uRGVzY3JpcHRpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluZm8ueE9mZnNldCB8fCBpbmZvLnlPZmZzZXQpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnBpeGVsT2Zmc2V0ID09IG51bGwpIHsgb3B0aW9ucy5waXhlbE9mZnNldCA9IHsgeDogMCwgeTogMCB9OyB9XG4gICAgICAgICAgICBpZiAoaW5mby54T2Zmc2V0KSB7IG9wdGlvbnMucGl4ZWxPZmZzZXQueCA9IGluZm8ueE9mZnNldDsgfVxuICAgICAgICAgICAgaWYgKGluZm8ueU9mZnNldCkgeyBvcHRpb25zLnBpeGVsT2Zmc2V0LnkgPSBpbmZvLnlPZmZzZXQ7IH1cbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zLmRpc2FibGVBdXRvUGFuID0gaW5mby5EaXNhYmxlQXV0b1BhbjtcbiAgICAgICAgb3B0aW9ucy52aXNpYmxlID0gaW5mby5WaXNpYmxlO1xuXG4gICAgICAgIGlmICh0eXBlb2YgaW5mby5MYXRpdHVkZSA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGluZm8uTG9uZ2l0dWRlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgb3B0aW9ucy5wb3NpdGlvbiA9IHsgbGF0aXR1ZGU6IGluZm8uTGF0aXR1ZGUsIGxvbmdpdHVkZTogaW5mby5Mb25naXR1ZGUgfTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbmZvV2luZG93UHJvbWlzZSA9IHRoaXMuX21hcFNlcnZpY2UuQ3JlYXRlSW5mb1dpbmRvdyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fYm94ZXMuc2V0KGluZm8sIGluZm9XaW5kb3dQcm9taXNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbG9zZXMgdGhlIGluZm8gd2luZG93XG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5mb1xuICAgICAqIEByZXR1cm5zIC0gIEEgcHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIHdoZW4gdGhlIGluZm8gYm94IGlzIGNsb3NlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVJbmZvQm94U2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBDbG9zZShpbmZvOiBJbmZvQm94Q29tcG9uZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ib3hlcy5nZXQoaW5mbykudGhlbih3ID0+IHtcbiAgICAgICAgICAgIHcuQ2xvc2UoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIGFuIGV2ZW50IGRlbGVnYXRlIGZvciBhbiBpbmZvIHdpbmRvdy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBldmVudE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVnaXN0ZXIgKGUuZy4gJ2NsaWNrJylcbiAgICAgKiBAcGFyYW0gaW5mb0NvbXBvbmVudCAtIFRoZSB7QGxpbmsgSW5mb0JveENvbXBvbmVudH0gZm9yIHdoaWNoIHRvIHJlZ2lzdGVyIHRoZSBldmVudC5cbiAgICAgKiBAcmV0dXJucyAtIE9ic2VydmFibGUgZW1pdGluZyBhbiBpbnN0YW5jZSBvZiBUIGVhY2ggdGltZSB0aGUgZXZlbnQgb2NjdXJzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUluZm9Cb3hTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZUV2ZW50T2JzZXJ2YWJsZTxUPihldmVudE5hbWU6IHN0cmluZywgaW5mb0NvbXBvbmVudDogSW5mb0JveENvbXBvbmVudCk6IE9ic2VydmFibGU8VD4ge1xuICAgICAgICBjb25zdCBnb29nbGVFdmVudE5hbWU6IHN0cmluZyA9IEdvb2dsZU1hcEV2ZW50c0xvb2t1cFtldmVudE5hbWVdO1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoKG9ic2VydmVyOiBPYnNlcnZlcjxUPikgPT4ge1xuICAgICAgICAgICAgdGhpcy5fYm94ZXMuZ2V0KGluZm9Db21wb25lbnQpLnRoZW4oKGI6IEluZm9XaW5kb3cpID0+IHtcbiAgICAgICAgICAgICAgICBiLkFkZExpc3RlbmVyKGdvb2dsZUV2ZW50TmFtZSwgKGU6IFQpID0+IHRoaXMuX3pvbmUucnVuKCgpID0+IG9ic2VydmVyLm5leHQoZSkpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVzIHRoZSBpbmZvIHdpbmRvd1xuICAgICAqXG4gICAgICogQHBhcmFtIGluZm9cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVJbmZvQm94U2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBEZWxldGVJbmZvV2luZG93KGluZm86IEluZm9Cb3hDb21wb25lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9wZW5zIHRoZSBpbmZvIHdpbmRvdy4gV2luZG93IG9wZW5zIG9uIGEgbWFya2VyLCBpZiBzdXBwbGllZCwgb3IgYSBzcGVjaWZpYyBsb2NhdGlvbiBpZiBnaXZlblxuICAgICAqXG4gICAgICogQHBhcmFtIGluZm9cbiAgICAgKiBAcGFyYW0gW2xvY11cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVJbmZvQm94U2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBPcGVuKGluZm86IEluZm9Cb3hDb21wb25lbnQsIGxvYz86IElMYXRMb25nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmIChpbmZvLkNsb3NlSW5mb0JveGVzT25PcGVuIHx8IGluZm8uTW9kYWwpIHtcbiAgICAgICAgICAgIC8vIGNsb3NlIGFsbCBvcGVuIGluZm8gYm94ZXNcbiAgICAgICAgICAgIHRoaXMuX2JveGVzLmZvckVhY2goKGJveDogUHJvbWlzZTxJbmZvV2luZG93PiwgaTogSW5mb0JveENvbXBvbmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpbmZvLklkICE9PSBpLklkKSB7XG4gICAgICAgICAgICAgICAgICAgIGJveC50aGVuKCh3KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAody5Jc09wZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3LkNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaS5DbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fYm94ZXMuZ2V0KGluZm8pLnRoZW4oKHc6IEdvb2dsZUluZm9XaW5kb3cpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnM6IElJbmZvV2luZG93T3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgaWYgKGluZm8uSHRtbENvbnRlbnQgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5odG1sQ29udGVudCA9IGluZm8uSHRtbENvbnRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRpdGxlID0gaW5mby5UaXRsZTtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmRlc2NyaXB0aW9uID0gaW5mby5EZXNjcmlwdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHcuU2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgICAgIGlmIChpbmZvLkhvc3RNYXJrZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYXJrZXJTZXJ2aWNlLkdldE5hdGl2ZU1hcmtlcihpbmZvLkhvc3RNYXJrZXIpLnRoZW4oKG1hcmtlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWFwU2VydmljZS5NYXBQcm9taXNlLnRoZW4oKG1hcCkgPT4gKDxHb29nbGVJbmZvV2luZG93PncpLk9wZW4oKDxHb29nbGVNYXJrZXI+bWFya2VyKS5OYXRpdmVQcmltaXR2ZSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21hcFNlcnZpY2UuTWFwUHJvbWlzZS50aGVuKChtYXApID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobG9jKSB7IHcuU2V0UG9zaXRpb24obG9jKTsgfVxuICAgICAgICAgICAgICAgIHcuT3BlbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGluZm8gd2luZG93IG9wdGlvbnNcbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmZvXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVJbmZvQm94U2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRPcHRpb25zKGluZm86IEluZm9Cb3hDb21wb25lbnQsIG9wdGlvbnM6IElJbmZvV2luZG93T3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm94ZXMuZ2V0KGluZm8pLnRoZW4oKHc6IEdvb2dsZUluZm9XaW5kb3cpID0+IHtcbiAgICAgICAgICAgIHcuU2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgaW5mbyB3aW5kb3cgcG9zaXRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmZvXG4gICAgICogQHBhcmFtIGxhdGxuZ1xuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUluZm9Cb3hTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIFNldFBvc2l0aW9uKGluZm86IEluZm9Cb3hDb21wb25lbnQsIGxhdGxuZzogSUxhdExvbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdGhpcy5fYm94ZXMuZ2V0KGluZm8pLnRoZW4oKHcpID0+IHtcbiAgICAgICAgICAgIHcuU2V0UG9zaXRpb24obGF0bG5nKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbn1cbiJdfQ==