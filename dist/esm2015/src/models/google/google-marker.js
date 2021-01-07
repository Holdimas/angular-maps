import { GoogleConversions } from '../../services/google/google-conversions';
/**
 * Concrete implementation of the {@link Marker} contract for the Google Maps map architecture.
 *
 * @export
 */
export class GoogleMarker {
    ///
    /// Constructors
    ///
    /**
     * Creates an instance of GoogleMarker.
     * @param _marker
     *
     * @memberof GoogleMarker
     */
    constructor(_marker) {
        this._marker = _marker;
        ///
        /// Field declarations
        ///
        this._metadata = new Map();
        this._isFirst = false;
        this._isLast = true;
    }
    ///
    /// Public properties
    ///
    /**
     * Indicates that the marker is the first marker in a set.
     *
     * @memberof Marker
     */
    get IsFirst() { return this._isFirst; }
    set IsFirst(val) { this._isFirst = val; }
    /**
     * Indicates that the marker is the last marker in the set.
     *
     * @memberof Marker
     */
    get IsLast() { return this._isLast; }
    set IsLast(val) { this._isLast = val; }
    /**
     * Gets the marker metadata.
     *
     * @readonly
     * @memberof BingMarker
     */
    get Metadata() { return this._metadata; }
    /**
     * Gets the native primitve implementing the marker, in this case {@link Microsoft.Maps.Pushpin}
     *
     * @readonly
     * @abstract
     * @memberof BingMarker
     */
    get NativePrimitve() { return this._marker; }
    /**
     * Gets the Location of the marker
     *
     * @readonly
     * @abstract
     * @memberof BingMarker
     */
    get Location() {
        const l = this._marker.getPosition();
        return {
            latitude: l.lat(),
            longitude: l.lng()
        };
    }
    ///
    /// Public methods
    ///
    /**
     * Adds an event listener to the marker.
     *
     * @param eventType - String containing the event for which to register the listener (e.g. "click")
     * @param fn - Delegate invoked when the event occurs.
     *
     * @memberof GoogleMarker
     */
    AddListener(eventType, fn) {
        this._marker.addListener(eventType, fn);
    }
    /**
     * Deletes the marker.
     *
     *
     * @memberof GoogleMarker
     */
    DeleteMarker() {
        this._marker.setMap(null);
    }
    /**
     * Gets the marker label
     *
     * @memberof GoogleMarker
     */
    GetLabel() {
        return this._marker.getLabel().text;
    }
    /**
     * Gets whether the marker is visible.
     *
     * @returns - True if the marker is visible, false otherwise.
     *
     * @memberof GoogleMarker
     */
    GetVisible() {
        return this._marker.getVisible();
    }
    /**
     * Sets the anchor for the marker. Use this to adjust the root location for the marker to accomodate various marker image sizes.
     *
     * @param anchor - Point coordinates for the marker anchor.
     *
     * @memberof GoogleMarker
     */
    SetAnchor(anchor) {
        // not implemented
        // TODO: we need to switch the model to complex icons for google to
        // support anchors, sizes and origins.
        // https://developers.google.com/maps/documentation/javascript/markers
    }
    /**
     * Sets the draggability of a marker.
     *
     * @param draggable - True to mark the marker as draggable, false otherwise.
     *
     * @memberof GoogleMarker
     */
    SetDraggable(draggable) {
        this._marker.setDraggable(draggable);
    }
    /**
     * Sets the icon for the marker.
     *
     * @param icon - String containing the icon in various forms (url, data url, etc.)
     *
     * @memberof GoogleMarker
     */
    SetIcon(icon) {
        this._marker.setIcon(icon);
    }
    /**
     * Sets the marker label.
     *
     * @param label - String containing the label to set.
     *
     * @memberof GoogleMarker
     */
    SetLabel(label) {
        this._marker.setLabel(label);
    }
    /**
     * Sets the marker position.
     *
     * @param latLng - Geo coordinates to set the marker position to.
     *
     * @memberof GoogleMarker
     */
    SetPosition(latLng) {
        const p = GoogleConversions.TranslateLocationObject(latLng);
        this._marker.setPosition(p);
    }
    /**
     * Sets the marker title.
     *
     * @param title - String containing the title to set.
     *
     * @memberof GoogleMarker
     */
    SetTitle(title) {
        this._marker.setTitle(title);
    }
    /**
     * Sets the marker options.
     *
     * @param options - {@link IMarkerOptions} object containing the marker options to set. The supplied options are
     * merged with the underlying marker options.
     *
     * @memberof GoogleMarker
     */
    SetOptions(options) {
        const o = GoogleConversions.TranslateMarkerOptions(options);
        this._marker.setOptions(o);
    }
    /**
     * Sets whether the marker is visible.
     *
     * @param visible - True to set the marker visible, false otherwise.
     *
     * @memberof GoogleMarker
     */
    SetVisible(visible) {
        this._marker.setVisible(visible);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLW1hcmtlci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9tb2RlbHMvZ29vZ2xlL2dvb2dsZS1tYXJrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFNN0U7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxZQUFZO0lBNkRyQixHQUFHO0lBQ0gsZ0JBQWdCO0lBQ2hCLEdBQUc7SUFFSDs7Ozs7T0FLRztJQUNILFlBQW9CLE9BQThCO1FBQTlCLFlBQU8sR0FBUCxPQUFPLENBQXVCO1FBckVsRCxHQUFHO1FBQ0gsc0JBQXNCO1FBQ3RCLEdBQUc7UUFDSyxjQUFTLEdBQXFCLElBQUksR0FBRyxFQUFlLENBQUM7UUFDckQsYUFBUSxHQUFHLEtBQUssQ0FBQztRQUNqQixZQUFPLEdBQUcsSUFBSSxDQUFDO0lBZ0UrQixDQUFDO0lBOUR2RCxHQUFHO0lBQ0gscUJBQXFCO0lBQ3JCLEdBQUc7SUFFSDs7OztPQUlHO0lBQ0gsSUFBVyxPQUFPLEtBQWMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUN2RCxJQUFXLE9BQU8sQ0FBQyxHQUFZLElBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRXpEOzs7O09BSUc7SUFDSCxJQUFXLE1BQU0sS0FBYyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3JELElBQVcsTUFBTSxDQUFDLEdBQVksSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFdkQ7Ozs7O09BS0c7SUFDSCxJQUFXLFFBQVEsS0FBdUIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUVsRTs7Ozs7O09BTUc7SUFDSCxJQUFXLGNBQWMsS0FBNEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUUzRTs7Ozs7O09BTUc7SUFDSCxJQUFXLFFBQVE7UUFDZixNQUFNLENBQUMsR0FBMEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUM1RCxPQUFPO1lBQ0gsUUFBUSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUU7WUFDakIsU0FBUyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUU7U0FDckIsQ0FBQztJQUNOLENBQUM7SUFjRCxHQUFHO0lBQ0gsa0JBQWtCO0lBQ2xCLEdBQUc7SUFFSDs7Ozs7OztPQU9HO0lBQ0ksV0FBVyxDQUFDLFNBQWlCLEVBQUUsRUFBWTtRQUM5QyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ksWUFBWTtRQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksUUFBUTtRQUNYLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUM7SUFDeEMsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLFVBQVU7UUFDYixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDckMsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLFNBQVMsQ0FBQyxNQUFXO1FBQ3hCLGtCQUFrQjtRQUNsQixtRUFBbUU7UUFDbkUsc0NBQXNDO1FBQ3RDLHNFQUFzRTtJQUMxRSxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksWUFBWSxDQUFDLFNBQWtCO1FBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSxPQUFPLENBQUMsSUFBWTtRQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksUUFBUSxDQUFDLEtBQWE7UUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLFdBQVcsQ0FBQyxNQUFnQjtRQUMvQixNQUFNLENBQUMsR0FBMEIsaUJBQWlCLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLFFBQVEsQ0FBQyxLQUFhO1FBQ3pCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksVUFBVSxDQUFDLE9BQXVCO1FBQ3JDLE1BQU0sQ0FBQyxHQUFpQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxRixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksVUFBVSxDQUFDLE9BQWdCO1FBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3JDLENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdvb2dsZUNvbnZlcnNpb25zIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1jb252ZXJzaW9ucyc7XG5pbXBvcnQgeyBJTWFya2VyT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaW1hcmtlci1vcHRpb25zJztcbmltcG9ydCB7IElMYXRMb25nIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgeyBNYXJrZXIgfSBmcm9tICcuLi9tYXJrZXInO1xuaW1wb3J0ICogYXMgR29vZ2xlTWFwVHlwZXMgZnJvbSAnLi4vLi4vc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1tYXAtdHlwZXMnO1xuXG4vKipcbiAqIENvbmNyZXRlIGltcGxlbWVudGF0aW9uIG9mIHRoZSB7QGxpbmsgTWFya2VyfSBjb250cmFjdCBmb3IgdGhlIEdvb2dsZSBNYXBzIG1hcCBhcmNoaXRlY3R1cmUuXG4gKlxuICogQGV4cG9ydFxuICovXG5leHBvcnQgY2xhc3MgR29vZ2xlTWFya2VyIGltcGxlbWVudHMgTWFya2VyIHtcblxuICAgIC8vL1xuICAgIC8vLyBGaWVsZCBkZWNsYXJhdGlvbnNcbiAgICAvLy9cbiAgICBwcml2YXRlIF9tZXRhZGF0YTogTWFwPHN0cmluZywgYW55PiA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XG4gICAgcHJpdmF0ZSBfaXNGaXJzdCA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2lzTGFzdCA9IHRydWU7XG5cbiAgICAvLy9cbiAgICAvLy8gUHVibGljIHByb3BlcnRpZXNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEluZGljYXRlcyB0aGF0IHRoZSBtYXJrZXIgaXMgdGhlIGZpcnN0IG1hcmtlciBpbiBhIHNldC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBNYXJrZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IElzRmlyc3QoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9pc0ZpcnN0OyB9XG4gICAgcHVibGljIHNldCBJc0ZpcnN0KHZhbDogYm9vbGVhbikgeyB0aGlzLl9pc0ZpcnN0ID0gdmFsOyB9XG5cbiAgICAvKipcbiAgICAgKiBJbmRpY2F0ZXMgdGhhdCB0aGUgbWFya2VyIGlzIHRoZSBsYXN0IG1hcmtlciBpbiB0aGUgc2V0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIE1hcmtlclxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgSXNMYXN0KCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5faXNMYXN0OyB9XG4gICAgcHVibGljIHNldCBJc0xhc3QodmFsOiBib29sZWFuKSB7IHRoaXMuX2lzTGFzdCA9IHZhbDsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbWFya2VyIG1ldGFkYXRhLlxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXJrZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IE1ldGFkYXRhKCk6IE1hcDxzdHJpbmcsIGFueT4geyByZXR1cm4gdGhpcy5fbWV0YWRhdGE7IH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIG5hdGl2ZSBwcmltaXR2ZSBpbXBsZW1lbnRpbmcgdGhlIG1hcmtlciwgaW4gdGhpcyBjYXNlIHtAbGluayBNaWNyb3NvZnQuTWFwcy5QdXNocGlufVxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQGFic3RyYWN0XG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXJrZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IE5hdGl2ZVByaW1pdHZlKCk6IEdvb2dsZU1hcFR5cGVzLk1hcmtlciB7IHJldHVybiB0aGlzLl9tYXJrZXI7IH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIExvY2F0aW9uIG9mIHRoZSBtYXJrZXJcbiAgICAgKlxuICAgICAqIEByZWFkb25seVxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFya2VyXG4gICAgICovXG4gICAgcHVibGljIGdldCBMb2NhdGlvbigpOiBJTGF0TG9uZyB7XG4gICAgICAgIGNvbnN0IGw6IEdvb2dsZU1hcFR5cGVzLkxhdExuZyA9IHRoaXMuX21hcmtlci5nZXRQb3NpdGlvbigpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbGF0aXR1ZGU6IGwubGF0KCksXG4gICAgICAgICAgICBsb25naXR1ZGU6IGwubG5nKClcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gQ29uc3RydWN0b3JzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIEdvb2dsZU1hcmtlci5cbiAgICAgKiBAcGFyYW0gX21hcmtlclxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcmtlclxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX21hcmtlcjogR29vZ2xlTWFwVHlwZXMuTWFya2VyKSB7IH1cblxuICAgIC8vL1xuICAgIC8vLyBQdWJsaWMgbWV0aG9kc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhbiBldmVudCBsaXN0ZW5lciB0byB0aGUgbWFya2VyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGV2ZW50VHlwZSAtIFN0cmluZyBjb250YWluaW5nIHRoZSBldmVudCBmb3Igd2hpY2ggdG8gcmVnaXN0ZXIgdGhlIGxpc3RlbmVyIChlLmcuIFwiY2xpY2tcIilcbiAgICAgKiBAcGFyYW0gZm4gLSBEZWxlZ2F0ZSBpbnZva2VkIHdoZW4gdGhlIGV2ZW50IG9jY3Vycy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkTGlzdGVuZXIoZXZlbnRUeXBlOiBzdHJpbmcsIGZuOiBGdW5jdGlvbik6IHZvaWQge1xuICAgICAgICB0aGlzLl9tYXJrZXIuYWRkTGlzdGVuZXIoZXZlbnRUeXBlLCBmbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVsZXRlcyB0aGUgbWFya2VyLlxuICAgICAqXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFya2VyXG4gICAgICovXG4gICAgcHVibGljIERlbGV0ZU1hcmtlcigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbWFya2VyLnNldE1hcChudWxsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBtYXJrZXIgbGFiZWxcbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0TGFiZWwoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlci5nZXRMYWJlbCgpLnRleHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB3aGV0aGVyIHRoZSBtYXJrZXIgaXMgdmlzaWJsZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIC0gVHJ1ZSBpZiB0aGUgbWFya2VyIGlzIHZpc2libGUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0VmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlci5nZXRWaXNpYmxlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgYW5jaG9yIGZvciB0aGUgbWFya2VyLiBVc2UgdGhpcyB0byBhZGp1c3QgdGhlIHJvb3QgbG9jYXRpb24gZm9yIHRoZSBtYXJrZXIgdG8gYWNjb21vZGF0ZSB2YXJpb3VzIG1hcmtlciBpbWFnZSBzaXplcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhbmNob3IgLSBQb2ludCBjb29yZGluYXRlcyBmb3IgdGhlIG1hcmtlciBhbmNob3IuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFya2VyXG4gICAgICovXG4gICAgcHVibGljIFNldEFuY2hvcihhbmNob3I6IGFueSk6IHZvaWQge1xuICAgICAgICAvLyBub3QgaW1wbGVtZW50ZWRcbiAgICAgICAgLy8gVE9ETzogd2UgbmVlZCB0byBzd2l0Y2ggdGhlIG1vZGVsIHRvIGNvbXBsZXggaWNvbnMgZm9yIGdvb2dsZSB0b1xuICAgICAgICAvLyBzdXBwb3J0IGFuY2hvcnMsIHNpemVzIGFuZCBvcmlnaW5zLlxuICAgICAgICAvLyBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9tYXBzL2RvY3VtZW50YXRpb24vamF2YXNjcmlwdC9tYXJrZXJzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgZHJhZ2dhYmlsaXR5IG9mIGEgbWFya2VyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGRyYWdnYWJsZSAtIFRydWUgdG8gbWFyayB0aGUgbWFya2VyIGFzIGRyYWdnYWJsZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcmtlclxuICAgICAqL1xuICAgIHB1YmxpYyBTZXREcmFnZ2FibGUoZHJhZ2dhYmxlOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX21hcmtlci5zZXREcmFnZ2FibGUoZHJhZ2dhYmxlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBpY29uIGZvciB0aGUgbWFya2VyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGljb24gLSBTdHJpbmcgY29udGFpbmluZyB0aGUgaWNvbiBpbiB2YXJpb3VzIGZvcm1zICh1cmwsIGRhdGEgdXJsLCBldGMuKVxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcmtlclxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRJY29uKGljb246IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLl9tYXJrZXIuc2V0SWNvbihpY29uKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBtYXJrZXIgbGFiZWwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGFiZWwgLSBTdHJpbmcgY29udGFpbmluZyB0aGUgbGFiZWwgdG8gc2V0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcmtlclxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRMYWJlbChsYWJlbDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX21hcmtlci5zZXRMYWJlbChsYWJlbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgbWFya2VyIHBvc2l0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIGxhdExuZyAtIEdlbyBjb29yZGluYXRlcyB0byBzZXQgdGhlIG1hcmtlciBwb3NpdGlvbiB0by5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0UG9zaXRpb24obGF0TG5nOiBJTGF0TG9uZyk6IHZvaWQge1xuICAgICAgICBjb25zdCBwOiBHb29nbGVNYXBUeXBlcy5MYXRMbmcgPSBHb29nbGVDb252ZXJzaW9ucy5UcmFuc2xhdGVMb2NhdGlvbk9iamVjdChsYXRMbmcpO1xuICAgICAgICB0aGlzLl9tYXJrZXIuc2V0UG9zaXRpb24ocCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgbWFya2VyIHRpdGxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRpdGxlIC0gU3RyaW5nIGNvbnRhaW5pbmcgdGhlIHRpdGxlIHRvIHNldC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0VGl0bGUodGl0bGU6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLl9tYXJrZXIuc2V0VGl0bGUodGl0bGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIG1hcmtlciBvcHRpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSB7QGxpbmsgSU1hcmtlck9wdGlvbnN9IG9iamVjdCBjb250YWluaW5nIHRoZSBtYXJrZXIgb3B0aW9ucyB0byBzZXQuIFRoZSBzdXBwbGllZCBvcHRpb25zIGFyZVxuICAgICAqIG1lcmdlZCB3aXRoIHRoZSB1bmRlcmx5aW5nIG1hcmtlciBvcHRpb25zLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcmtlclxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRPcHRpb25zKG9wdGlvbnM6IElNYXJrZXJPcHRpb25zKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG86IEdvb2dsZU1hcFR5cGVzLk1hcmtlck9wdGlvbnMgPSBHb29nbGVDb252ZXJzaW9ucy5UcmFuc2xhdGVNYXJrZXJPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9tYXJrZXIuc2V0T3B0aW9ucyhvKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHdoZXRoZXIgdGhlIG1hcmtlciBpcyB2aXNpYmxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZpc2libGUgLSBUcnVlIHRvIHNldCB0aGUgbWFya2VyIHZpc2libGUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXJrZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0VmlzaWJsZSh2aXNpYmxlOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX21hcmtlci5zZXRWaXNpYmxlKHZpc2libGUpO1xuICAgIH1cblxufVxuIl19