import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { MapService } from '../../services/map.service';
import { BingMapEventsLookup } from '../../models/bing/bing-events-lookup';
/**
 * Concrete implementation of the {@link InfoBoxService} contract for the Bing Maps V8 architecture.
 *
 * @export
 */
export class BingInfoBoxService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingInfoBoxService.
     * @param _mapService - Concrete {@link MapService} implementation for Bing Maps V8. An instance of {@link BingMapService}.
     * @param _zone - An instance of NgZone to provide zone aware promises.
     *
     * @memberof BingInfoBoxService
     */
    constructor(_mapService, _zone) {
        this._mapService = _mapService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._boxes = new Map();
    }
    /**
     * Adds an info window to the map or layer.
     *
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     *
     * @memberof BingInfoBoxService
     */
    AddInfoWindow(info) {
        const options = {};
        if (typeof info.Latitude === 'number' && typeof info.Longitude === 'number') {
            options.position = {
                latitude: info.Latitude,
                longitude: info.Longitude
            };
        }
        if (typeof info.InfoWindowActions !== 'undefined' && info.InfoWindowActions.length > 0) {
            options.actions = [];
            info.InfoWindowActions.forEach((action) => {
                options.actions.push({
                    label: action.Label,
                    eventHandler: () => { action.ActionClicked.emit(null); }
                });
            });
        }
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
        options.visible = info.Visible;
        const infoPromise = this._mapService.CreateInfoWindow(options);
        this._boxes.set(info, infoPromise);
    }
    /**
     * Closes an InfoBoxComponent that is open.
     *
     * @abstract
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     * @returns - A promise that is fullfilled when the infobox has been closed.
     *
     * @memberof InfoBoxService
     */
    Close(info) {
        return this._boxes.get(info).then((w) => w.Close());
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
        const eventNameTranslated = BingMapEventsLookup[eventName];
        return Observable.create((observer) => {
            this._boxes.get(infoComponent).then((b) => {
                b.AddListener(eventNameTranslated, (e) => this._zone.run(() => observer.next(e)));
            });
        });
    }
    /**
     * Deletes an infobox.
     *
     * @abstract
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     * @returns - A promise that is fullfilled when the infobox has been deleted.
     *
     * @memberof InfoBoxService
     */
    DeleteInfoWindow(info) {
        const w = this._boxes.get(info);
        if (w == null) {
            return Promise.resolve();
        }
        return w.then((i) => {
            return this._zone.run(() => {
                i.Close();
                this._boxes.delete(info);
            });
        });
    }
    /**
     * Opens an infobox that is closed.
     *
     * @abstract
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     * @returns - A promise that is fullfilled when the infobox has been opened.
     *
     * @memberof InfoBoxService
     */
    Open(info, loc) {
        if (info.CloseInfoBoxesOnOpen || info.Modal) {
            // close all open info boxes.
            this._boxes.forEach((v, i) => {
                if (info.Id !== i.Id) {
                    v.then(w => {
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
            if (info.Latitude && info.Longitude) {
                w.SetPosition({ latitude: info.Latitude, longitude: info.Longitude });
            }
            else if (loc) {
                ///
                /// this situation is specifically used for cluster layers that use spidering.
                ///
                w.SetPosition(loc);
            }
            else if (info.HostMarker) {
                w.SetPosition({ latitude: info.HostMarker.Latitude, longitude: info.HostMarker.Longitude });
            }
            w.Open();
        });
    }
    /**
     * Sets the infobox options.
     *
     * @abstract
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     * @param options - {@link IInfoWindowOptions} object containing the options to set. Options provided are
     * merged with the existing options of the underlying infobox.
     * @returns - A promise that is fullfilled when the infobox options have been updated.
     *
     * @memberof InfoBoxService
     */
    SetOptions(info, options) {
        return this._boxes.get(info).then((i) => i.SetOptions(options));
    }
    /**
     * Set the position of the infobox based on the properties set on the InfoBox component.
     *
     * @abstract
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     * @returns - A promise that is fullfilled when the infobox position has been updated.
     *
     * @memberof InfoBoxService
     */
    SetPosition(info) {
        return this._boxes.get(info).then((i) => i.SetPosition({
            latitude: info.Latitude,
            longitude: info.Longitude
        }));
    }
}
BingInfoBoxService.decorators = [
    { type: Injectable }
];
BingInfoBoxService.ctorParameters = () => [
    { type: MapService },
    { type: NgZone }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1pbmZvYm94LnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvc2VydmljZXMvYmluZy9iaW5nLWluZm9ib3guc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNuRCxPQUFPLEVBQUUsVUFBVSxFQUFZLE1BQU0sTUFBTSxDQUFDO0FBTTVDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUl4RCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUUzRTs7OztHQUlHO0FBRUgsTUFBTSxPQUFPLGtCQUFrQjtJQU0zQixHQUFHO0lBQ0gsZUFBZTtJQUNmLEdBQUc7SUFFSDs7Ozs7O09BTUc7SUFDSCxZQUFvQixXQUF1QixFQUFVLEtBQWE7UUFBOUMsZ0JBQVcsR0FBWCxXQUFXLENBQVk7UUFBVSxVQUFLLEdBQUwsS0FBSyxDQUFRO1FBaEJsRSxHQUFHO1FBQ0gsc0JBQXNCO1FBQ3RCLEdBQUc7UUFDSyxXQUFNLEdBQStDLElBQUksR0FBRyxFQUF5QyxDQUFDO0lBYXhDLENBQUM7SUFFdkU7Ozs7OztPQU1HO0lBQ0ksYUFBYSxDQUFDLElBQXNCO1FBQ3ZDLE1BQU0sT0FBTyxHQUF1QixFQUFFLENBQUM7UUFDdkMsSUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLEVBQUU7WUFDekUsT0FBTyxDQUFDLFFBQVEsR0FBRztnQkFDZixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7Z0JBQ3ZCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUzthQUM1QixDQUFDO1NBQ0w7UUFDRCxJQUFJLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixLQUFLLFdBQVcsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxH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RyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztZQUMvRCxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1NBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ1IsQ0FBQzs7O1lBbE1KLFVBQVU7OztZQVhGLFVBQVU7WUFQRSxNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBPYnNlcnZlciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgSW5mb1dpbmRvdyB9IGZyb20gJy4uLy4uL21vZGVscy9pbmZvLXdpbmRvdyc7XG5pbXBvcnQgeyBJSW5mb1dpbmRvd09wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lpbmZvLXdpbmRvdy1vcHRpb25zJztcbmltcG9ydCB7IElMYXRMb25nIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgeyBJbmZvQm94QWN0aW9uRGlyZWN0aXZlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9pbmZvYm94LWFjdGlvbic7XG5pbXBvcnQgeyBJbmZvQm94U2VydmljZSB9IGZyb20gJy4uL2luZm9ib3guc2VydmljZSc7XG5pbXBvcnQgeyBNYXBTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvbWFwLnNlcnZpY2UnO1xuaW1wb3J0IHsgSW5mb0JveENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvaW5mb2JveCc7XG5pbXBvcnQgeyBCaW5nTWFwU2VydmljZSB9IGZyb20gJy4vYmluZy1tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBCaW5nSW5mb1dpbmRvdyB9IGZyb20gJy4uLy4uL21vZGVscy9iaW5nL2JpbmctaW5mby13aW5kb3cnO1xuaW1wb3J0IHsgQmluZ01hcEV2ZW50c0xvb2t1cCB9IGZyb20gJy4uLy4uL21vZGVscy9iaW5nL2JpbmctZXZlbnRzLWxvb2t1cCc7XG5cbi8qKlxuICogQ29uY3JldGUgaW1wbGVtZW50YXRpb24gb2YgdGhlIHtAbGluayBJbmZvQm94U2VydmljZX0gY29udHJhY3QgZm9yIHRoZSBCaW5nIE1hcHMgVjggYXJjaGl0ZWN0dXJlLlxuICpcbiAqIEBleHBvcnRcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEJpbmdJbmZvQm94U2VydmljZSBpbXBsZW1lbnRzIEluZm9Cb3hTZXJ2aWNlIHtcbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfYm94ZXM6IE1hcDxJbmZvQm94Q29tcG9uZW50LCBQcm9taXNlPEluZm9XaW5kb3c+PiA9IG5ldyBNYXA8SW5mb0JveENvbXBvbmVudCwgUHJvbWlzZTxJbmZvV2luZG93Pj4oKTtcblxuICAgIC8vL1xuICAgIC8vLyBDb25zdHJ1Y3RvclxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBCaW5nSW5mb0JveFNlcnZpY2UuXG4gICAgICogQHBhcmFtIF9tYXBTZXJ2aWNlIC0gQ29uY3JldGUge0BsaW5rIE1hcFNlcnZpY2V9IGltcGxlbWVudGF0aW9uIGZvciBCaW5nIE1hcHMgVjguIEFuIGluc3RhbmNlIG9mIHtAbGluayBCaW5nTWFwU2VydmljZX0uXG4gICAgICogQHBhcmFtIF96b25lIC0gQW4gaW5zdGFuY2Ugb2YgTmdab25lIHRvIHByb3ZpZGUgem9uZSBhd2FyZSBwcm9taXNlcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nSW5mb0JveFNlcnZpY2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9tYXBTZXJ2aWNlOiBNYXBTZXJ2aWNlLCBwcml2YXRlIF96b25lOiBOZ1pvbmUpIHsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhbiBpbmZvIHdpbmRvdyB0byB0aGUgbWFwIG9yIGxheWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGluZm8gLSB7QGxpbmsgSW5mb0JveENvbXBvbmVudH0gY29tcG9uZW50IG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGluZm9ib3guXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0luZm9Cb3hTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIEFkZEluZm9XaW5kb3coaW5mbzogSW5mb0JveENvbXBvbmVudCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvcHRpb25zOiBJSW5mb1dpbmRvd09wdGlvbnMgPSB7fTtcbiAgICAgICAgaWYgKHR5cGVvZiBpbmZvLkxhdGl0dWRlID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgaW5mby5Mb25naXR1ZGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBvcHRpb25zLnBvc2l0aW9uID0ge1xuICAgICAgICAgICAgICAgIGxhdGl0dWRlOiBpbmZvLkxhdGl0dWRlLFxuICAgICAgICAgICAgICAgIGxvbmdpdHVkZTogaW5mby5Mb25naXR1ZGVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBpbmZvLkluZm9XaW5kb3dBY3Rpb25zICE9PSAndW5kZWZpbmVkJyAmJiBpbmZvLkluZm9XaW5kb3dBY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG9wdGlvbnMuYWN0aW9ucyA9IFtdO1xuICAgICAgICAgICAgaW5mby5JbmZvV2luZG93QWN0aW9ucy5mb3JFYWNoKChhY3Rpb246IEluZm9Cb3hBY3Rpb25EaXJlY3RpdmUpID0+IHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmFjdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBhY3Rpb24uTGFiZWwsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50SGFuZGxlcjogKCkgPT4geyBhY3Rpb24uQWN0aW9uQ2xpY2tlZC5lbWl0KG51bGwpOyB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby5IdG1sQ29udGVudCAhPT0gJycpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuaHRtbENvbnRlbnQgPSBpbmZvLkh0bWxDb250ZW50O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgb3B0aW9ucy50aXRsZSA9IGluZm8uVGl0bGU7XG4gICAgICAgICAgICBvcHRpb25zLmRlc2NyaXB0aW9uID0gaW5mby5EZXNjcmlwdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5mby54T2Zmc2V0IHx8IGluZm8ueU9mZnNldCkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGl4ZWxPZmZzZXQgPT0gbnVsbCkgeyBvcHRpb25zLnBpeGVsT2Zmc2V0ID0geyB4OiAwLCB5OiAwIH07IH1cbiAgICAgICAgICAgIGlmIChpbmZvLnhPZmZzZXQpIHsgb3B0aW9ucy5waXhlbE9mZnNldC54ID0gaW5mby54T2Zmc2V0OyB9XG4gICAgICAgICAgICBpZiAoaW5mby55T2Zmc2V0KSB7IG9wdGlvbnMucGl4ZWxPZmZzZXQueSA9IGluZm8ueU9mZnNldDsgfVxuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucy52aXNpYmxlID0gaW5mby5WaXNpYmxlO1xuICAgICAgICBjb25zdCBpbmZvUHJvbWlzZSA9IHRoaXMuX21hcFNlcnZpY2UuQ3JlYXRlSW5mb1dpbmRvdyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fYm94ZXMuc2V0KGluZm8sIGluZm9Qcm9taXNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbG9zZXMgYW4gSW5mb0JveENvbXBvbmVudCB0aGF0IGlzIG9wZW4uXG4gICAgICpcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAcGFyYW0gaW5mbyAtIHtAbGluayBJbmZvQm94Q29tcG9uZW50fSBjb21wb25lbnQgb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgaW5mb2JveC5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IGlzIGZ1bGxmaWxsZWQgd2hlbiB0aGUgaW5mb2JveCBoYXMgYmVlbiBjbG9zZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveFNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgQ2xvc2UoaW5mbzogSW5mb0JveENvbXBvbmVudCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm94ZXMuZ2V0KGluZm8pLnRoZW4oKHcpID0+IHcuQ2xvc2UoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIGFuIGV2ZW50IGRlbGVnYXRlIGZvciBhbiBpbmZvIHdpbmRvdy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBldmVudE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVnaXN0ZXIgKGUuZy4gJ2NsaWNrJylcbiAgICAgKiBAcGFyYW0gaW5mb0NvbXBvbmVudCAtIFRoZSB7QGxpbmsgSW5mb0JveENvbXBvbmVudH0gZm9yIHdoaWNoIHRvIHJlZ2lzdGVyIHRoZSBldmVudC5cbiAgICAgKiBAcmV0dXJucyAtIE9ic2VydmFibGUgZW1pdGluZyBhbiBpbnN0YW5jZSBvZiBUIGVhY2ggdGltZSB0aGUgZXZlbnQgb2NjdXJzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUluZm9Cb3hTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIENyZWF0ZUV2ZW50T2JzZXJ2YWJsZTxUPihldmVudE5hbWU6IHN0cmluZywgaW5mb0NvbXBvbmVudDogSW5mb0JveENvbXBvbmVudCk6IE9ic2VydmFibGU8VD4ge1xuICAgICAgICBjb25zdCBldmVudE5hbWVUcmFuc2xhdGVkID0gQmluZ01hcEV2ZW50c0xvb2t1cFtldmVudE5hbWVdO1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5jcmVhdGUoKG9ic2VydmVyOiBPYnNlcnZlcjxUPikgPT4ge1xuICAgICAgICAgICAgdGhpcy5fYm94ZXMuZ2V0KGluZm9Db21wb25lbnQpLnRoZW4oKGI6IEluZm9XaW5kb3cpID0+IHtcbiAgICAgICAgICAgICAgICBiLkFkZExpc3RlbmVyKGV2ZW50TmFtZVRyYW5zbGF0ZWQsIChlOiBUKSA9PiB0aGlzLl96b25lLnJ1bigoKSA9PiBvYnNlcnZlci5uZXh0KGUpKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVsZXRlcyBhbiBpbmZvYm94LlxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGluZm8gLSB7QGxpbmsgSW5mb0JveENvbXBvbmVudH0gY29tcG9uZW50IG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGluZm9ib3guXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCBpcyBmdWxsZmlsbGVkIHdoZW4gdGhlIGluZm9ib3ggaGFzIGJlZW4gZGVsZXRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBJbmZvQm94U2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBEZWxldGVJbmZvV2luZG93KGluZm86IEluZm9Cb3hDb21wb25lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgdyA9IHRoaXMuX2JveGVzLmdldChpbmZvKTtcbiAgICAgICAgaWYgKHcgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB3LnRoZW4oKGk6IEluZm9XaW5kb3cpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl96b25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICAgICAgaS5DbG9zZSgpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2JveGVzLmRlbGV0ZShpbmZvKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPcGVucyBhbiBpbmZvYm94IHRoYXQgaXMgY2xvc2VkLlxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGluZm8gLSB7QGxpbmsgSW5mb0JveENvbXBvbmVudH0gY29tcG9uZW50IG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGluZm9ib3guXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCBpcyBmdWxsZmlsbGVkIHdoZW4gdGhlIGluZm9ib3ggaGFzIGJlZW4gb3BlbmVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEluZm9Cb3hTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIE9wZW4oaW5mbzogSW5mb0JveENvbXBvbmVudCwgbG9jPzogSUxhdExvbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKGluZm8uQ2xvc2VJbmZvQm94ZXNPbk9wZW4gfHwgaW5mby5Nb2RhbCkge1xuICAgICAgICAgICAgLy8gY2xvc2UgYWxsIG9wZW4gaW5mbyBib3hlcy5cbiAgICAgICAgICAgIHRoaXMuX2JveGVzLmZvckVhY2goKHY6IFByb21pc2U8SW5mb1dpbmRvdz4sIGk6IEluZm9Cb3hDb21wb25lbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaW5mby5JZCAhPT0gaS5JZCkge1xuICAgICAgICAgICAgICAgICAgICB2LnRoZW4odyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAody5Jc09wZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3LkNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaS5DbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fYm94ZXMuZ2V0KGluZm8pLnRoZW4oKHcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnM6IElJbmZvV2luZG93T3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgaWYgKGluZm8uSHRtbENvbnRlbnQgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5odG1sQ29udGVudCA9IGluZm8uSHRtbENvbnRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLnRpdGxlID0gaW5mby5UaXRsZTtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmRlc2NyaXB0aW9uID0gaW5mby5EZXNjcmlwdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHcuU2V0T3B0aW9ucyhvcHRpb25zKTtcblxuICAgICAgICAgICAgaWYgKGluZm8uTGF0aXR1ZGUgJiYgaW5mby5Mb25naXR1ZGUpIHtcbiAgICAgICAgICAgICAgICB3LlNldFBvc2l0aW9uKHsgbGF0aXR1ZGU6IGluZm8uTGF0aXR1ZGUsIGxvbmdpdHVkZTogaW5mby5Mb25naXR1ZGUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChsb2MpIHtcbiAgICAgICAgICAgICAgICAvLy9cbiAgICAgICAgICAgICAgICAvLy8gdGhpcyBzaXR1YXRpb24gaXMgc3BlY2lmaWNhbGx5IHVzZWQgZm9yIGNsdXN0ZXIgbGF5ZXJzIHRoYXQgdXNlIHNwaWRlcmluZy5cbiAgICAgICAgICAgICAgICAvLy9cbiAgICAgICAgICAgICAgICB3LlNldFBvc2l0aW9uKGxvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpbmZvLkhvc3RNYXJrZXIpIHtcbiAgICAgICAgICAgICAgICB3LlNldFBvc2l0aW9uKHsgbGF0aXR1ZGU6IGluZm8uSG9zdE1hcmtlci5MYXRpdHVkZSwgbG9uZ2l0dWRlOiBpbmZvLkhvc3RNYXJrZXIuTG9uZ2l0dWRlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdy5PcGVuKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGluZm9ib3ggb3B0aW9ucy5cbiAgICAgKlxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBwYXJhbSBpbmZvIC0ge0BsaW5rIEluZm9Cb3hDb21wb25lbnR9IGNvbXBvbmVudCBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBpbmZvYm94LlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0ge0BsaW5rIElJbmZvV2luZG93T3B0aW9uc30gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG9wdGlvbnMgdG8gc2V0LiBPcHRpb25zIHByb3ZpZGVkIGFyZVxuICAgICAqIG1lcmdlZCB3aXRoIHRoZSBleGlzdGluZyBvcHRpb25zIG9mIHRoZSB1bmRlcmx5aW5nIGluZm9ib3guXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCBpcyBmdWxsZmlsbGVkIHdoZW4gdGhlIGluZm9ib3ggb3B0aW9ucyBoYXZlIGJlZW4gdXBkYXRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBJbmZvQm94U2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRPcHRpb25zKGluZm86IEluZm9Cb3hDb21wb25lbnQsIG9wdGlvbnM6IElJbmZvV2luZG93T3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm94ZXMuZ2V0KGluZm8pLnRoZW4oKGk6IEluZm9XaW5kb3cpID0+IGkuU2V0T3B0aW9ucyhvcHRpb25zKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgaW5mb2JveCBiYXNlZCBvbiB0aGUgcHJvcGVydGllcyBzZXQgb24gdGhlIEluZm9Cb3ggY29tcG9uZW50LlxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGluZm8gLSB7QGxpbmsgSW5mb0JveENvbXBvbmVudH0gY29tcG9uZW50IG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGluZm9ib3guXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCBpcyBmdWxsZmlsbGVkIHdoZW4gdGhlIGluZm9ib3ggcG9zaXRpb24gaGFzIGJlZW4gdXBkYXRlZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBJbmZvQm94U2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRQb3NpdGlvbihpbmZvOiBJbmZvQm94Q29tcG9uZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ib3hlcy5nZXQoaW5mbykudGhlbigoaTogSW5mb1dpbmRvdykgPT4gaS5TZXRQb3NpdGlvbih7XG4gICAgICAgICAgICBsYXRpdHVkZTogaW5mby5MYXRpdHVkZSxcbiAgICAgICAgICAgIGxvbmdpdHVkZTogaW5mby5Mb25naXR1ZGVcbiAgICAgICAgfSkpO1xuICAgIH1cblxufVxuIl19