import { BingConversions } from '../../services/bing/bing-conversions';
/**
 * Concrete implementation of the {@link InfoWindow} contract for the Bing Maps V8 map architecture.
 *
 * @export
 */
export class BingInfoWindow {
    /**
     * Creates an instance of BingInfoWindow.
     * @param _infoBox - A {@link Microsoft.Maps.Infobox} instance underlying the model
     * @memberof BingInfoWindow
     */
    constructor(_infoBox) {
        this._infoBox = _infoBox;
        this._isOpen = false;
    }
    /**
     * Gets whether the info box is currently open.
     *
     * @readonly
     * @memberof BingInfoWindow
     */
    get IsOpen() {
        if (this._infoBox && this._infoBox.getOptions().visible === true) {
            return true;
        }
        return false;
    }
    /**
     * Gets native primitve underlying the model.
     *
     * @memberof BingInfoWindow
     * @property
     * @readonly
     */
    get NativePrimitve() {
        return this._infoBox;
    }
    /**
     * Adds an event listener to the InfoWindow.
     *
     * @param eventType - String containing the event for which to register the listener (e.g. "click")
     * @param fn - Delegate invoked when the event occurs.
     *
     * @memberof BingInfoWindow
     * @method
     */
    AddListener(eventType, fn) {
        Microsoft.Maps.Events.addHandler(this._infoBox, eventType, (e) => {
            if (e.eventName === 'infoboxChanged') {
                if (this._infoBox.getOptions().visible === true) {
                    this._isOpen = true;
                }
                else {
                    if (this._infoBox.getOptions().visible === false && this._isOpen === true) {
                        this._isOpen = false;
                        fn(e);
                    }
                }
            }
            else {
                fn(e);
            }
        });
    }
    /**
     * Closes the info window.
     *
     * @memberof BingInfoWindow
     * @method
     */
    Close() {
        const o = {};
        o.visible = false;
        this._infoBox.setOptions(o);
    }
    /**
     * Gets the position of the info window.
     *
     * @returns - Returns the geo coordinates of the info window.
     * @memberof BingInfoWindow
     * @method
     */
    GetPosition() {
        const p = {
            latitude: this._infoBox.getLocation().latitude,
            longitude: this._infoBox.getLocation().longitude
        };
        return p;
    }
    /**
     * Opens the info window.
     *
     * @memberof BingInfoWindow
     * @method
     */
    Open() {
        const o = {};
        o.visible = true;
        this._infoBox.setOptions(o);
    }
    /**
     * Sets the info window options.
     *
     * @param options - Info window options to set. The options will be merged with any existing options.
     *
     * @memberof BingInfoWindow
     * @method
     */
    SetOptions(options) {
        const o = BingConversions.TranslateInfoBoxOptions(options);
        this._infoBox.setOptions(o);
    }
    /**
     * Sets the info window position.
     *
     * @param position - Geo coordinates to move the anchor of the info window to.
     *
     * @memberof BingInfoWindow
     * @method
     */
    SetPosition(position) {
        const l = BingConversions.TranslateLocation(position);
        this._infoBox.setLocation(l);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1pbmZvLXdpbmRvdy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9tb2RlbHMvYmluZy9iaW5nLWluZm8td2luZG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUV2RTs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLGNBQWM7SUEwQnZCOzs7O09BSUc7SUFDSCxZQUFvQixRQUFnQztRQUFoQyxhQUFRLEdBQVIsUUFBUSxDQUF3QjtRQUNoRCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztJQUN6QixDQUFDO0lBN0JEOzs7OztPQUtHO0lBQ0gsSUFBVyxNQUFNO1FBQ2IsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTtZQUFFLE9BQU8sSUFBSSxDQUFDO1NBQUU7UUFDbEYsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILElBQVcsY0FBYztRQUNyQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDekIsQ0FBQztJQVdEOzs7Ozs7OztPQVFHO0lBQ0ksV0FBVyxDQUFDLFNBQWlCLEVBQUUsRUFBWTtRQUM5QyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUM3RCxJQUFJLENBQUMsQ0FBQyxTQUFTLEtBQUssZ0JBQWdCLEVBQUU7Z0JBQ2xDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxPQUFPLEtBQUssSUFBSSxFQUFFO29CQUFFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO2lCQUFFO3FCQUNwRTtvQkFDRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsT0FBTyxLQUFLLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTt3QkFDdkUsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7d0JBQ3JCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDVDtpQkFDSjthQUNKO2lCQUNJO2dCQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNUO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxLQUFLO1FBQ1IsTUFBTSxDQUFDLEdBQW1DLEVBQUUsQ0FBQztRQUM3QyxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNsQixJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksV0FBVztRQUNkLE1BQU0sQ0FBQyxHQUFhO1lBQ2hCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVE7WUFDOUMsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsU0FBUztTQUNuRCxDQUFDO1FBQ0YsT0FBTyxDQUFDLENBQUM7SUFDYixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxJQUFJO1FBQ1AsTUFBTSxDQUFDLEdBQW1DLEVBQUUsQ0FBQztRQUM3QyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLFVBQVUsQ0FBQyxPQUEyQjtRQUN6QyxNQUFNLENBQUMsR0FBbUMsZUFBZSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNGLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksV0FBVyxDQUFDLFFBQWtCO1FBQ2pDLE1BQU0sQ0FBQyxHQUE0QixlQUFlLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0UsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakMsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSUxhdExvbmcgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lsYXRsb25nJztcbmltcG9ydCB7IElJbmZvV2luZG93T3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWluZm8td2luZG93LW9wdGlvbnMnO1xuaW1wb3J0IHsgSW5mb1dpbmRvdyB9IGZyb20gJy4uL2luZm8td2luZG93JztcbmltcG9ydCB7IEJpbmdNYXBTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYmluZy9iaW5nLW1hcC5zZXJ2aWNlJztcbmltcG9ydCB7IEJpbmdDb252ZXJzaW9ucyB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2JpbmcvYmluZy1jb252ZXJzaW9ucyc7XG5cbi8qKlxuICogQ29uY3JldGUgaW1wbGVtZW50YXRpb24gb2YgdGhlIHtAbGluayBJbmZvV2luZG93fSBjb250cmFjdCBmb3IgdGhlIEJpbmcgTWFwcyBWOCBtYXAgYXJjaGl0ZWN0dXJlLlxuICpcbiAqIEBleHBvcnRcbiAqL1xuZXhwb3J0IGNsYXNzIEJpbmdJbmZvV2luZG93IGltcGxlbWVudHMgSW5mb1dpbmRvdyB7XG5cbiAgICBwcml2YXRlIF9pc09wZW46IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHdoZXRoZXIgdGhlIGluZm8gYm94IGlzIGN1cnJlbnRseSBvcGVuLlxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIEJpbmdJbmZvV2luZG93XG4gICAgICovXG4gICAgcHVibGljIGdldCBJc09wZW4oKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh0aGlzLl9pbmZvQm94ICYmIHRoaXMuX2luZm9Cb3guZ2V0T3B0aW9ucygpLnZpc2libGUgPT09IHRydWUpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgbmF0aXZlIHByaW1pdHZlIHVuZGVybHlpbmcgdGhlIG1vZGVsLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdJbmZvV2luZG93XG4gICAgICogQHByb3BlcnR5XG4gICAgICogQHJlYWRvbmx5XG4gICAgICovXG4gICAgcHVibGljIGdldCBOYXRpdmVQcmltaXR2ZSgpOiBNaWNyb3NvZnQuTWFwcy5JbmZvYm94IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2luZm9Cb3g7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBCaW5nSW5mb1dpbmRvdy5cbiAgICAgKiBAcGFyYW0gX2luZm9Cb3ggLSBBIHtAbGluayBNaWNyb3NvZnQuTWFwcy5JbmZvYm94fSBpbnN0YW5jZSB1bmRlcmx5aW5nIHRoZSBtb2RlbFxuICAgICAqIEBtZW1iZXJvZiBCaW5nSW5mb1dpbmRvd1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2luZm9Cb3g6IE1pY3Jvc29mdC5NYXBzLkluZm9ib3gpIHtcbiAgICAgICAgdGhpcy5faXNPcGVuID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhbiBldmVudCBsaXN0ZW5lciB0byB0aGUgSW5mb1dpbmRvdy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBldmVudFR5cGUgLSBTdHJpbmcgY29udGFpbmluZyB0aGUgZXZlbnQgZm9yIHdoaWNoIHRvIHJlZ2lzdGVyIHRoZSBsaXN0ZW5lciAoZS5nLiBcImNsaWNrXCIpXG4gICAgICogQHBhcmFtIGZuIC0gRGVsZWdhdGUgaW52b2tlZCB3aGVuIHRoZSBldmVudCBvY2N1cnMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0luZm9XaW5kb3dcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIEFkZExpc3RlbmVyKGV2ZW50VHlwZTogc3RyaW5nLCBmbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgICAgICAgTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmFkZEhhbmRsZXIodGhpcy5faW5mb0JveCwgZXZlbnRUeXBlLCAoZSkgPT4ge1xuICAgICAgICAgICAgaWYgKGUuZXZlbnROYW1lID09PSAnaW5mb2JveENoYW5nZWQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2luZm9Cb3guZ2V0T3B0aW9ucygpLnZpc2libGUgPT09IHRydWUpIHsgdGhpcy5faXNPcGVuID0gdHJ1ZTsgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5faW5mb0JveC5nZXRPcHRpb25zKCkudmlzaWJsZSA9PT0gZmFsc2UgJiYgdGhpcy5faXNPcGVuID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuKGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm4oZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsb3NlcyB0aGUgaW5mbyB3aW5kb3cuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0luZm9XaW5kb3dcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIENsb3NlKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBvOiBNaWNyb3NvZnQuTWFwcy5JSW5mb2JveE9wdGlvbnMgPSB7fTtcbiAgICAgICAgby52aXNpYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2luZm9Cb3guc2V0T3B0aW9ucyhvKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBwb3NpdGlvbiBvZiB0aGUgaW5mbyB3aW5kb3cuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyAtIFJldHVybnMgdGhlIGdlbyBjb29yZGluYXRlcyBvZiB0aGUgaW5mbyB3aW5kb3cuXG4gICAgICogQG1lbWJlcm9mIEJpbmdJbmZvV2luZG93XG4gICAgICogQG1ldGhvZFxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRQb3NpdGlvbigpOiBJTGF0TG9uZyB7XG4gICAgICAgIGNvbnN0IHA6IElMYXRMb25nID0ge1xuICAgICAgICAgICAgbGF0aXR1ZGU6IHRoaXMuX2luZm9Cb3guZ2V0TG9jYXRpb24oKS5sYXRpdHVkZSxcbiAgICAgICAgICAgIGxvbmdpdHVkZTogdGhpcy5faW5mb0JveC5nZXRMb2NhdGlvbigpLmxvbmdpdHVkZVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPcGVucyB0aGUgaW5mbyB3aW5kb3cuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0luZm9XaW5kb3dcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIE9wZW4oKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG86IE1pY3Jvc29mdC5NYXBzLklJbmZvYm94T3B0aW9ucyA9IHt9O1xuICAgICAgICBvLnZpc2libGUgPSB0cnVlO1xuICAgICAgICB0aGlzLl9pbmZvQm94LnNldE9wdGlvbnMobyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgaW5mbyB3aW5kb3cgb3B0aW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gSW5mbyB3aW5kb3cgb3B0aW9ucyB0byBzZXQuIFRoZSBvcHRpb25zIHdpbGwgYmUgbWVyZ2VkIHdpdGggYW55IGV4aXN0aW5nIG9wdGlvbnMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0luZm9XaW5kb3dcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIFNldE9wdGlvbnMob3B0aW9uczogSUluZm9XaW5kb3dPcHRpb25zKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG86IE1pY3Jvc29mdC5NYXBzLklJbmZvYm94T3B0aW9ucyA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVJbmZvQm94T3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5faW5mb0JveC5zZXRPcHRpb25zKG8pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGluZm8gd2luZG93IHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHBvc2l0aW9uIC0gR2VvIGNvb3JkaW5hdGVzIHRvIG1vdmUgdGhlIGFuY2hvciBvZiB0aGUgaW5mbyB3aW5kb3cgdG8uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0luZm9XaW5kb3dcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIFNldFBvc2l0aW9uKHBvc2l0aW9uOiBJTGF0TG9uZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBsOiBNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbiA9IEJpbmdDb252ZXJzaW9ucy5UcmFuc2xhdGVMb2NhdGlvbihwb3NpdGlvbik7XG4gICAgICAgIHRoaXMuX2luZm9Cb3guc2V0TG9jYXRpb24obCk7XG4gICAgfVxufVxuIl19