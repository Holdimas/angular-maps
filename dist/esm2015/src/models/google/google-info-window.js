import { GoogleConversions } from '../../services/google/google-conversions';
/**
 * Concrete implementation for a {@link InfoWindow}} model for Google Maps.
 *
 * @export
 */
export class GoogleInfoWindow {
    ///
    /// constructor
    ///
    /**
     * Creates an instance of GoogleInfoWindow.
     * @param _infoWindow - A {@link GoogleMapTypes.InfoWindow} instance underlying the model.
     * @param _mapService - An instance of the {@link GoogleMapService}.
     * @memberof GoogleInfoWindow
     */
    constructor(_infoWindow, _mapService) {
        this._infoWindow = _infoWindow;
        this._mapService = _mapService;
    }
    /**
     * Gets whether the info box is currently open.
     *
     * @readonly
     * @memberof InfoWGoogleInfoWindowindow
     */
    get IsOpen() {
        if (this._isOpen === true) {
            return true;
        }
        return false;
    }
    /**
     * Gets the underlying native object.
     *
     * @property
     * @readonly
     */
    get NativePrimitve() {
        return this._infoWindow;
    }
    ///
    /// Public methods
    ///
    /**
      * Adds an event listener to the InfoWindow.
      *
      * @param eventType - String containing the event for which to register the listener (e.g. "click")
      * @param fn - Delegate invoked when the event occurs.
      *
      * @memberof GoogleInfoWindow
      * @method
      */
    AddListener(eventType, fn) {
        this._infoWindow.addListener(eventType, (e) => {
            if (eventType === 'closeclick') {
                this._isOpen = false;
            }
            fn(e);
        });
    }
    /**
     *
     * Closes the info window.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    Close() {
        this._isOpen = false;
        this._infoWindow.close();
    }
    /**
     * Gets the position of the info window
     *
     * @returns - The geo coordinates of the info window.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    GetPosition() {
        return GoogleConversions.TranslateLatLngObject(this._infoWindow.getPosition());
    }
    /**
     * Opens the info window
     *
     * @param [anchor] - Optional Anchor.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    Open(anchor) {
        this._mapService.MapPromise.then(m => {
            this._isOpen = true;
            this._infoWindow.open(m, anchor);
        });
    }
    /**
     * Sets the info window options
     *
     * @param options - The options to set. This object will be merged with the existing options.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    SetOptions(options) {
        const o = GoogleConversions.TranslateInfoWindowOptions(options);
        this._infoWindow.setOptions(o);
    }
    /**
     * Sets the info window position
     *
     * @param position - Geo coordinates at which to anchor the info window.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    SetPosition(position) {
        const l = GoogleConversions.TranslateLocation(position);
        this._infoWindow.setPosition(l);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLWluZm8td2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL21vZGVscy9nb29nbGUvZ29vZ2xlLWluZm8td2luZG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLDBDQUEwQyxDQUFDO0FBTzdFOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sZ0JBQWdCO0lBeUJ6QixHQUFHO0lBQ0gsZUFBZTtJQUNmLEdBQUc7SUFFSDs7Ozs7T0FLRztJQUNILFlBQW9CLFdBQXNDLEVBQVUsV0FBNkI7UUFBN0UsZ0JBQVcsR0FBWCxXQUFXLENBQTJCO1FBQVUsZ0JBQVcsR0FBWCxXQUFXLENBQWtCO0lBQUksQ0FBQztJQS9CdEc7Ozs7O09BS0c7SUFDSCxJQUFXLE1BQU07UUFDYixJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssSUFBSSxFQUFFO1lBQUUsT0FBTyxJQUFJLENBQUM7U0FBRTtRQUMzQyxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxJQUFXLGNBQWM7UUFDckIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzVCLENBQUM7SUFjRCxHQUFHO0lBQ0gsa0JBQWtCO0lBQ2xCLEdBQUc7SUFFSjs7Ozs7Ozs7UUFRSTtJQUNJLFdBQVcsQ0FBQyxTQUFpQixFQUFFLEVBQVk7UUFDOUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBTSxFQUFFLEVBQUU7WUFDL0MsSUFBSSxTQUFTLEtBQUssWUFBWSxFQUFFO2dCQUFFLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2FBQUU7WUFDekQsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1YsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksS0FBSztRQUNSLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxXQUFXO1FBQ2QsT0FBTyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFDbkYsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxJQUFJLENBQUMsTUFBWTtRQUNwQixJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDakMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxVQUFVLENBQUMsT0FBMkI7UUFDekMsTUFBTSxDQUFDLEdBQXFDLGlCQUFpQixDQUFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksV0FBVyxDQUFDLFFBQWtCO1FBQ2pDLE1BQU0sQ0FBQyxHQUFpQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0RixJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQyxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJSW5mb1dpbmRvd09wdGlvbnMgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lpbmZvLXdpbmRvdy1vcHRpb25zJztcbmltcG9ydCB7IElMYXRMb25nIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgeyBHb29nbGVDb252ZXJzaW9ucyB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2dvb2dsZS9nb29nbGUtY29udmVyc2lvbnMnO1xuaW1wb3J0IHsgR29vZ2xlTWFwU2VydmljZX0gZnJvbSAnLi4vLi4vc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBJbmZvV2luZG93IH0gZnJvbSAnLi4vaW5mby13aW5kb3cnO1xuaW1wb3J0ICogYXMgR29vZ2xlTWFwVHlwZXMgZnJvbSAnLi4vLi4vc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1tYXAtdHlwZXMnO1xuXG5kZWNsYXJlIHZhciBnb29nbGU6IGFueTtcblxuLyoqXG4gKiBDb25jcmV0ZSBpbXBsZW1lbnRhdGlvbiBmb3IgYSB7QGxpbmsgSW5mb1dpbmRvd319IG1vZGVsIGZvciBHb29nbGUgTWFwcy5cbiAqXG4gKiBAZXhwb3J0XG4gKi9cbmV4cG9ydCBjbGFzcyBHb29nbGVJbmZvV2luZG93IGltcGxlbWVudHMgSW5mb1dpbmRvdyB7XG5cbiAgICBwcml2YXRlIF9pc09wZW46IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHdoZXRoZXIgdGhlIGluZm8gYm94IGlzIGN1cnJlbnRseSBvcGVuLlxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIEluZm9XR29vZ2xlSW5mb1dpbmRvd2luZG93XG4gICAgICovXG4gICAgcHVibGljIGdldCBJc09wZW4oKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh0aGlzLl9pc09wZW4gPT09IHRydWUpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIHVuZGVybHlpbmcgbmF0aXZlIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwcm9wZXJ0eVxuICAgICAqIEByZWFkb25seVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgTmF0aXZlUHJpbWl0dmUoKTogR29vZ2xlTWFwVHlwZXMuSW5mb1dpbmRvdyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pbmZvV2luZG93O1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBjb25zdHJ1Y3RvclxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBHb29nbGVJbmZvV2luZG93LlxuICAgICAqIEBwYXJhbSBfaW5mb1dpbmRvdyAtIEEge0BsaW5rIEdvb2dsZU1hcFR5cGVzLkluZm9XaW5kb3d9IGluc3RhbmNlIHVuZGVybHlpbmcgdGhlIG1vZGVsLlxuICAgICAqIEBwYXJhbSBfbWFwU2VydmljZSAtIEFuIGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgR29vZ2xlTWFwU2VydmljZX0uXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUluZm9XaW5kb3dcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9pbmZvV2luZG93OiBHb29nbGVNYXBUeXBlcy5JbmZvV2luZG93LCBwcml2YXRlIF9tYXBTZXJ2aWNlOiBHb29nbGVNYXBTZXJ2aWNlKSB7IH1cblxuICAgIC8vL1xuICAgIC8vLyBQdWJsaWMgbWV0aG9kc1xuICAgIC8vL1xuXG4gICAvKipcbiAgICAgKiBBZGRzIGFuIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBJbmZvV2luZG93LlxuICAgICAqXG4gICAgICogQHBhcmFtIGV2ZW50VHlwZSAtIFN0cmluZyBjb250YWluaW5nIHRoZSBldmVudCBmb3Igd2hpY2ggdG8gcmVnaXN0ZXIgdGhlIGxpc3RlbmVyIChlLmcuIFwiY2xpY2tcIilcbiAgICAgKiBAcGFyYW0gZm4gLSBEZWxlZ2F0ZSBpbnZva2VkIHdoZW4gdGhlIGV2ZW50IG9jY3Vycy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVJbmZvV2luZG93XG4gICAgICogQG1ldGhvZFxuICAgICAqL1xuICAgIHB1YmxpYyBBZGRMaXN0ZW5lcihldmVudFR5cGU6IHN0cmluZywgZm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2luZm9XaW5kb3cuYWRkTGlzdGVuZXIoZXZlbnRUeXBlLCAoZTogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAnY2xvc2VjbGljaycpIHsgdGhpcy5faXNPcGVuID0gZmFsc2U7IH1cbiAgICAgICAgICAgIGZuKGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIENsb3NlcyB0aGUgaW5mbyB3aW5kb3cuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlSW5mb1dpbmRvd1xuICAgICAqIEBtZXRob2RcbiAgICAgKi9cbiAgICBwdWJsaWMgQ2xvc2UoKSB7XG4gICAgICAgIHRoaXMuX2lzT3BlbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pbmZvV2luZG93LmNsb3NlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIGluZm8gd2luZG93XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyAtIFRoZSBnZW8gY29vcmRpbmF0ZXMgb2YgdGhlIGluZm8gd2luZG93LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUluZm9XaW5kb3dcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIEdldFBvc2l0aW9uKCk6IElMYXRMb25nIHtcbiAgICAgICAgcmV0dXJuIEdvb2dsZUNvbnZlcnNpb25zLlRyYW5zbGF0ZUxhdExuZ09iamVjdCh0aGlzLl9pbmZvV2luZG93LmdldFBvc2l0aW9uKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9wZW5zIHRoZSBpbmZvIHdpbmRvd1xuICAgICAqXG4gICAgICogQHBhcmFtIFthbmNob3JdIC0gT3B0aW9uYWwgQW5jaG9yLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUluZm9XaW5kb3dcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIE9wZW4oYW5jaG9yPzogYW55KSB7XG4gICAgICAgIHRoaXMuX21hcFNlcnZpY2UuTWFwUHJvbWlzZS50aGVuKG0gPT4ge1xuICAgICAgICAgICAgdGhpcy5faXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX2luZm9XaW5kb3cub3BlbihtLCBhbmNob3IpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBpbmZvIHdpbmRvdyBvcHRpb25zXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFRoZSBvcHRpb25zIHRvIHNldC4gVGhpcyBvYmplY3Qgd2lsbCBiZSBtZXJnZWQgd2l0aCB0aGUgZXhpc3Rpbmcgb3B0aW9ucy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVJbmZvV2luZG93XG4gICAgICogQG1ldGhvZFxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRPcHRpb25zKG9wdGlvbnM6IElJbmZvV2luZG93T3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBjb25zdCBvOiBHb29nbGVNYXBUeXBlcy5JbmZvV2luZG93T3B0aW9ucyA9IEdvb2dsZUNvbnZlcnNpb25zLlRyYW5zbGF0ZUluZm9XaW5kb3dPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9pbmZvV2luZG93LnNldE9wdGlvbnMobyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgaW5mbyB3aW5kb3cgcG9zaXRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwb3NpdGlvbiAtIEdlbyBjb29yZGluYXRlcyBhdCB3aGljaCB0byBhbmNob3IgdGhlIGluZm8gd2luZG93LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUluZm9XaW5kb3dcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIFNldFBvc2l0aW9uKHBvc2l0aW9uOiBJTGF0TG9uZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBsOiBHb29nbGVNYXBUeXBlcy5MYXRMbmdMaXRlcmFsID0gR29vZ2xlQ29udmVyc2lvbnMuVHJhbnNsYXRlTG9jYXRpb24ocG9zaXRpb24pO1xuICAgICAgICB0aGlzLl9pbmZvV2luZG93LnNldFBvc2l0aW9uKGwpO1xuICAgIH1cbn1cbiJdfQ==