import { CanvasOverlay } from '../canvas-overlay';
import { GoogleMapLabel } from './google-label';
import { Extender } from '../extender';
/**
 * Concrete implementing a canvas overlay to be placed on the map for Google Maps.
 *
 * @export
 */
export class GoogleCanvasOverlay extends CanvasOverlay {
    /**
     * Creates a new instance of the GoogleCanvasOverlay class.
     * @param drawCallback A callback function that is triggered when the canvas is ready to be
     * rendered for the current map view.
     * @memberof GoogleCanvasOverlay
     */
    constructor(drawCallback) {
        super(drawCallback);
    }
    ///
    /// Public methods
    ///
    /**
     * Obtains geo coordinates for the click location
     *
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     * @memberof GoogleCanvasOverlay
     */
    GetCoordinatesFromClick(e) {
        if (!e) {
            return null;
        }
        if (!e.latLng) {
            return null;
        }
        if (!e.latLng.lat || !e.latLng.lng) {
            return null;
        }
        return { latitude: e.latLng.lat(), longitude: e.latLng.lng() };
    }
    /**
     * Gets the map associted with the label.
     *
     * @memberof GoogleCanvasOverlay
     * @method
     */
    GetMap() {
        return this.getMap();
    }
    /**
     * Returns a MapLabel instance for the current platform that can be used as a tooltip.
     * This method only generates the map label. Content and placement is the responsibility
     * of the caller.
     *
     * @returns - The label to be used for the tooltip.
     * @memberof GoogleCanvasOverlay
     * @method
     */
    GetToolTipOverlay() {
        const o = {
            align: 'left',
            offset: new google.maps.Point(0, 25),
            backgroundColor: 'bisque',
            hidden: true,
            fontSize: 12,
            fontColor: '#000000',
            strokeWeight: 0
        };
        o.zIndex = 100000;
        const label = new GoogleMapLabel(o);
        label.SetMap(this.GetMap());
        return label;
    }
    /**
     * Called when the custom overlay is added to the map. Triggers Onload....
     * @memberof GoogleCanvasOverlay
     */
    OnAdd() {
        super.OnAdd();
        this.OnLoad();
        this._canvas.style.zIndex = '100';
        // move the canvas above primitives such as polygons.
        // set the overlay to ready state
        this._readyResolver(true);
    }
    /**
     * Called whenever the canvas needs to be redrawn. This method does not do the actual
     * update, it simply scales the canvas. The actual redraw happens once the map is idle.
     * @memberof GoogleCanvasOverly
     * @method
     */
    OnDraw() {
        const isStreetView = false;
        const map = this.GetMap();
        if (isStreetView) {
            // Don't show the canvas if the map is in Streetside mode.
            this._canvas.style.display = 'none';
        }
        else {
            // Re-drawing the canvas as it moves would be too slow. Instead, scale and translate canvas element.
            // Upon idle or drag end, we can then redraw the canvas....
            const zoomCurrent = map.getZoom();
            const centerCurrent = map.getCenter();
            // Calculate map scale based on zoom level difference.
            const scale = Math.pow(2, zoomCurrent - this._zoomStart);
            // Calculate the scaled dimensions of the canvas.
            const el = map.getDiv();
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const newWidth = w * scale;
            const newHeight = h * scale;
            // Calculate offset of canvas based on zoom and center offsets.
            const projection = this.getProjection();
            const cc = projection.fromLatLngToDivPixel(centerCurrent);
            // Update the canvas CSS position and dimensions.
            this.UpdatePosition(cc.x - newWidth / 2, cc.y - newHeight / 2, newWidth, newHeight);
        }
    }
    /**
     * CanvasOverlay loaded, attach map events for updating canvas.
     * @method
     * @memberof GoogleCanvasOverlay
     */
    OnLoad() {
        const isStreetView = false;
        const map = this.getMap();
        // Get the current map view information.
        this._zoomStart = map.getZoom();
        const c = map.getCenter();
        this._centerStart = {
            latitude: c.lat(),
            longitude: c.lng()
        };
        // When the map stops moving, render new data on the canvas.
        this._viewChangeEndEvent = google.maps.event.addListener(map, 'idle', (e) => {
            this.UpdateCanvas();
        });
        // Update the position of the overlay when the map is resized.
        this._mapResizeEvent = google.maps.event.addListener(map, 'resize', (e) => {
            this.UpdateCanvas();
        });
    }
    /**
     * Associates the cnavas overlay with a map.
     * @method
     * @memberof GoogleCanvasOverlay
     */
    SetMap(map) {
        this.setMap(map);
    }
    ///
    /// Protected methods
    ///
    /**
     * Attaches the canvas to the map.
     * @memberof CanvasOverlay
     * @method
     */
    SetCanvasElement(el) {
        const panes = this.getPanes();
        if (panes) {
            if (el != null) {
                panes.overlayLayer.appendChild(el);
                // 4: floatPane (infowindow)
                // 3: overlayMouseTarget (mouse events)
                // 2: markerLayer (marker images)
                // 1: overlayLayer (polygons, polylines, ground overlays, tile layer overlays)
                // 0: mapPane (lowest pane above the map tiles)
            }
            else {
                panes.overlayLayer.removeChild(this._canvas);
            }
        }
    }
    /**
     * Remove the map event handlers.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    RemoveEventHandlers() {
        // Remove all event handlers from the map.
        if (this._viewChangeEndEvent) {
            google.maps.event.removeListener(this._viewChangeEndEvent);
        }
        if (this._mapResizeEvent) {
            google.maps.event.removeListener(this._mapResizeEvent);
        }
    }
    /**
     * Updates the Canvas size based on the map size.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    Resize() {
        const map = this.getMap();
        // Clear canvas by updating dimensions. This also ensures canvas stays the same size as the map.
        const el = map.getDiv();
        this._canvas.width = el.offsetWidth;
        this._canvas.height = el.offsetHeight;
    }
    /**
     * Updates the Canvas.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    UpdateCanvas() {
        const map = this.getMap();
        // Only render the canvas if it isn't in streetside mode.
        if (true) {
            this._canvas.style.display = '';
            // Reset CSS position and dimensions of canvas.
            const el = map.getDiv();
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const centerPoint = this.getProjection().fromLatLngToDivPixel(map.getCenter());
            this.UpdatePosition((centerPoint.x - w / 2), (centerPoint.y - h / 2), w, h);
            // Redraw the canvas.
            this.Redraw(true);
            // Get the current map view information.
            this._zoomStart = map.getZoom();
            const c = map.getCenter();
            this._centerStart = {
                latitude: c.lat(),
                longitude: c.lng()
            };
        }
    }
}
/**
 * Helper function to extend the OverlayView into the CanvasOverlay
 *
 * @export
 * @method
 */
export function MixinCanvasOverlay() {
    new Extender(GoogleCanvasOverlay)
        .Extend(new google.maps.OverlayView)
        .Map('onAdd', 'OnAdd')
        .Map('draw', 'OnDraw')
        .Map('onRemove', 'OnRemove');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLWNhbnZhcy1vdmVybGF5LmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL21vZGVscy9nb29nbGUvZ29vZ2xlLWNhbnZhcy1vdmVybGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUVsRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFFaEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUd2Qzs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLG1CQUFvQixTQUFRLGFBQWE7SUFRbEQ7Ozs7O09BS0c7SUFDSCxZQUFZLFlBQWlEO1FBQ3pELEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsR0FBRztJQUNILGtCQUFrQjtJQUNsQixHQUFHO0lBRUg7Ozs7OztPQU1HO0lBQ0ksdUJBQXVCLENBQUMsQ0FBNEI7UUFDdkQsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUFFLE9BQU8sSUFBSSxDQUFDO1NBQUU7UUFDeEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUU7WUFBRSxPQUFPLElBQUksQ0FBQztTQUFFO1FBQy9CLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFO1lBQUUsT0FBTyxJQUFJLENBQUM7U0FBRTtRQUNwRCxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztJQUNuRSxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxNQUFNO1FBQ1QsT0FBYSxJQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0ksaUJB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QUMsY0FBYyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFNUUscUJBQXFCO1lBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFbEIsd0NBQXdDO1lBQ3hDLElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxHQUEwQixHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDakQsSUFBSSxDQUFDLFlBQVksR0FBRztnQkFDaEIsUUFBUSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2pCLFNBQVMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFO2FBQ3JCLENBQUM7U0FDTDtJQUNMLENBQUM7Q0FDSjtBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQjtJQUU5QixJQUFJLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQztTQUM1QixNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztTQUNuQyxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztTQUNyQixHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQztTQUNyQixHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJTGF0TG9uZyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWxhdGxvbmcnO1xuaW1wb3J0IHsgR29vZ2xlQ29udmVyc2lvbnMgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9nb29nbGUvZ29vZ2xlLWNvbnZlcnNpb25zJztcbmltcG9ydCB7IENhbnZhc092ZXJsYXkgfSBmcm9tICcuLi9jYW52YXMtb3ZlcmxheSc7XG5pbXBvcnQgeyBNYXBMYWJlbCB9IGZyb20gJy4uL21hcC1sYWJlbCc7XG5pbXBvcnQgeyBHb29nbGVNYXBMYWJlbCB9IGZyb20gJy4vZ29vZ2xlLWxhYmVsJztcbmltcG9ydCAqIGFzIEdvb2dsZU1hcFR5cGVzIGZyb20gJy4uLy4uL3NlcnZpY2VzL2dvb2dsZS9nb29nbGUtbWFwLXR5cGVzJztcbmltcG9ydCB7IEV4dGVuZGVyIH0gZnJvbSAnLi4vZXh0ZW5kZXInO1xuZGVjbGFyZSB2YXIgZ29vZ2xlOiBhbnk7XG5cbi8qKlxuICogQ29uY3JldGUgaW1wbGVtZW50aW5nIGEgY2FudmFzIG92ZXJsYXkgdG8gYmUgcGxhY2VkIG9uIHRoZSBtYXAgZm9yIEdvb2dsZSBNYXBzLlxuICpcbiAqIEBleHBvcnRcbiAqL1xuZXhwb3J0IGNsYXNzIEdvb2dsZUNhbnZhc092ZXJsYXkgZXh0ZW5kcyBDYW52YXNPdmVybGF5IHtcblxuICAgIC8vL1xuICAgIC8vLyBmaWVsZCBkZWNsYXJhdGlvbnNcbiAgICAvLy9cbiAgICBwcml2YXRlIF92aWV3Q2hhbmdlRW5kRXZlbnQ6IEdvb2dsZU1hcFR5cGVzLk1hcHNFdmVudExpc3RlbmVyO1xuICAgIHByaXZhdGUgX21hcFJlc2l6ZUV2ZW50OiBHb29nbGVNYXBUeXBlcy5NYXBzRXZlbnRMaXN0ZW5lcjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIEdvb2dsZUNhbnZhc092ZXJsYXkgY2xhc3MuXG4gICAgICogQHBhcmFtIGRyYXdDYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgdHJpZ2dlcmVkIHdoZW4gdGhlIGNhbnZhcyBpcyByZWFkeSB0byBiZVxuICAgICAqIHJlbmRlcmVkIGZvciB0aGUgY3VycmVudCBtYXAgdmlldy5cbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ2FudmFzT3ZlcmxheVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGRyYXdDYWxsYmFjazogKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpID0+IHZvaWQpIHtcbiAgICAgICAgc3VwZXIoZHJhd0NhbGxiYWNrKTtcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHVibGljIG1ldGhvZHNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIE9idGFpbnMgZ2VvIGNvb3JkaW5hdGVzIGZvciB0aGUgY2xpY2sgbG9jYXRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlIC0gVGhlIG1vdXNlIGV2ZW50LlxuICAgICAqIEByZXR1cm5zIC0ge0BsaW5rIElMYXRMb25nfSBjb250YWluaW5nIHRoZSBnZW8gY29vcmRpbmF0ZXMgb2YgdGhlIGNsaWNrZWQgbWFya2VyLlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDYW52YXNPdmVybGF5XG4gICAgICovXG4gICAgcHVibGljIEdldENvb3JkaW5hdGVzRnJvbUNsaWNrKGU6IEdvb2dsZU1hcFR5cGVzLk1vdXNlRXZlbnQpOiBJTGF0TG9uZyB7XG4gICAgICAgIGlmICghZSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgICBpZiAoIWUubGF0TG5nKSB7IHJldHVybiBudWxsOyB9XG4gICAgICAgIGlmICghZS5sYXRMbmcubGF0IHx8ICFlLmxhdExuZy5sbmcpIHsgcmV0dXJuIG51bGw7IH1cbiAgICAgICAgcmV0dXJuIHsgbGF0aXR1ZGU6IGUubGF0TG5nLmxhdCgpLCBsb25naXR1ZGU6IGUubGF0TG5nLmxuZygpIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbWFwIGFzc29jaXRlZCB3aXRoIHRoZSBsYWJlbC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDYW52YXNPdmVybGF5XG4gICAgICogQG1ldGhvZFxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRNYXAoKTogR29vZ2xlTWFwVHlwZXMuR29vZ2xlTWFwIHtcbiAgICAgICAgcmV0dXJuICg8YW55PnRoaXMpLmdldE1hcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBNYXBMYWJlbCBpbnN0YW5jZSBmb3IgdGhlIGN1cnJlbnQgcGxhdGZvcm0gdGhhdCBjYW4gYmUgdXNlZCBhcyBhIHRvb2x0aXAuXG4gICAgICogVGhpcyBtZXRob2Qgb25seSBnZW5lcmF0ZXMgdGhlIG1hcCBsYWJlbC4gQ29udGVudCBhbmQgcGxhY2VtZW50IGlzIHRoZSByZXNwb25zaWJpbGl0eVxuICAgICAqIG9mIHRoZSBjYWxsZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyAtIFRoZSBsYWJlbCB0byBiZSB1c2VkIGZvciB0aGUgdG9vbHRpcC5cbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ2FudmFzT3ZlcmxheVxuICAgICAqIEBtZXRob2RcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0VG9vbFRpcE92ZXJsYXkoKTogTWFwTGFiZWwge1xuICAgICAgICBjb25zdCBvOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge1xuICAgICAgICAgICAgYWxpZ246ICdsZWZ0JyxcbiAgICAgICAgICAgIG9mZnNldDogbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsIDI1KSxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ2Jpc3F1ZScsXG4gICAgICAgICAgICBoaWRkZW46IHRydWUsXG4gICAgICAgICAgICBmb250U2l6ZTogMTIsXG4gICAgICAgICAgICBmb250Q29sb3I6ICcjMDAwMDAwJyxcbiAgICAgICAgICAgIHN0cm9rZVdlaWdodDogMFxuICAgICAgICB9O1xuICAgICAgICBvLnpJbmRleCA9IDEwMDAwMDtcbiAgICAgICAgY29uc3QgbGFiZWw6IE1hcExhYmVsID0gbmV3IEdvb2dsZU1hcExhYmVsKG8pO1xuICAgICAgICBsYWJlbC5TZXRNYXAodGhpcy5HZXRNYXAoKSk7XG4gICAgICAgIHJldHVybiBsYWJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgY3VzdG9tIG92ZXJsYXkgaXMgYWRkZWQgdG8gdGhlIG1hcC4gVHJpZ2dlcnMgT25sb2FkLi4uLlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVDYW52YXNPdmVybGF5XG4gICAgICovXG4gICAgcHVibGljIE9uQWRkKCk6IHZvaWQge1xuICAgICAgICBzdXBlci5PbkFkZCgpO1xuICAgICAgICB0aGlzLk9uTG9hZCgpO1xuICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGUuekluZGV4ID0gJzEwMCc7XG4gICAgICAgICAgICAvLyBtb3ZlIHRoZSBjYW52YXMgYWJvdmUgcHJpbWl0aXZlcyBzdWNoIGFzIHBvbHlnb25zLlxuXG4gICAgICAgIC8vIHNldCB0aGUgb3ZlcmxheSB0byByZWFkeSBzdGF0ZVxuICAgICAgICB0aGlzLl9yZWFkeVJlc29sdmVyKHRydWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuZXZlciB0aGUgY2FudmFzIG5lZWRzIHRvIGJlIHJlZHJhd24uIFRoaXMgbWV0aG9kIGRvZXMgbm90IGRvIHRoZSBhY3R1YWxcbiAgICAgKiB1cGRhdGUsIGl0IHNpbXBseSBzY2FsZXMgdGhlIGNhbnZhcy4gVGhlIGFjdHVhbCByZWRyYXcgaGFwcGVucyBvbmNlIHRoZSBtYXAgaXMgaWRsZS5cbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ2FudmFzT3Zlcmx5XG4gICAgICogQG1ldGhvZFxuICAgICAqL1xuICAgIHB1YmxpYyBPbkRyYXcoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGlzU3RyZWV0VmlldzogYm9vbGVhbiA9IGZhbHNlO1xuICAgICAgICBjb25zdCBtYXA6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCA9IHRoaXMuR2V0TWFwKCk7XG5cbiAgICAgICAgaWYgKGlzU3RyZWV0Vmlldykge1xuICAgICAgICAgICAgLy8gRG9uJ3Qgc2hvdyB0aGUgY2FudmFzIGlmIHRoZSBtYXAgaXMgaW4gU3RyZWV0c2lkZSBtb2RlLlxuICAgICAgICAgICAgdGhpcy5fY2FudmFzLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBSZS1kcmF3aW5nIHRoZSBjYW52YXMgYXMgaXQgbW92ZXMgd291bGQgYmUgdG9vIHNsb3cuIEluc3RlYWQsIHNjYWxlIGFuZCB0cmFuc2xhdGUgY2FudmFzIGVsZW1lbnQuXG4gICAgICAgICAgICAvLyBVcG9uIGlkbGUgb3IgZHJhZyBlbmQsIHdlIGNhbiB0aGVuIHJlZHJhdyB0aGUgY2FudmFzLi4uLlxuICAgICAgICAgICAgY29uc3Qgem9vbUN1cnJlbnQ6IG51bWJlciA9IG1hcC5nZXRab29tKCk7XG4gICAgICAgICAgICBjb25zdCBjZW50ZXJDdXJyZW50OiBHb29nbGVNYXBUeXBlcy5MYXRMbmcgPSBtYXAuZ2V0Q2VudGVyKCk7XG5cbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBtYXAgc2NhbGUgYmFzZWQgb24gem9vbSBsZXZlbCBkaWZmZXJlbmNlLlxuICAgICAgICAgICAgY29uc3Qgc2NhbGU6IG51bWJlciA9IE1hdGgucG93KDIsIHpvb21DdXJyZW50IC0gdGhpcy5fem9vbVN0YXJ0KTtcblxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBzY2FsZWQgZGltZW5zaW9ucyBvZiB0aGUgY2FudmFzLlxuICAgICAgICAgICAgY29uc3QgZWw6IEhUTUxEaXZFbGVtZW50ID0gbWFwLmdldERpdigpO1xuICAgICAgICAgICAgY29uc3QgdzogbnVtYmVyID0gZWwub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICBjb25zdCBoOiBudW1iZXIgPSBlbC5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBuZXdXaWR0aDogbnVtYmVyID0gdyAqIHNjYWxlO1xuICAgICAgICAgICAgY29uc3QgbmV3SGVpZ2h0OiBudW1iZXIgPSBoICogc2NhbGU7XG5cbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBvZmZzZXQgb2YgY2FudmFzIGJhc2VkIG9uIHpvb20gYW5kIGNlbnRlciBvZmZzZXRzLlxuICAgICAgICAgICAgY29uc3QgcHJvamVjdGlvbiA9ICg8YW55PnRoaXMpLmdldFByb2plY3Rpb24oKTtcbiAgICAgICAgICAgIGNvbnN0IGNjID0gcHJvamVjdGlvbi5mcm9tTGF0TG5nVG9EaXZQaXhlbChjZW50ZXJDdXJyZW50KTtcblxuICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBjYW52YXMgQ1NTIHBvc2l0aW9uIGFuZCBkaW1lbnNpb25zLlxuICAgICAgICAgICAgdGhpcy5VcGRhdGVQb3NpdGlvbihjYy54IC0gbmV3V2lkdGggLyAyLCBjYy55IC0gbmV3SGVpZ2h0IC8gMiwgbmV3V2lkdGgsIG5ld0hlaWdodCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYW52YXNPdmVybGF5IGxvYWRlZCwgYXR0YWNoIG1hcCBldmVudHMgZm9yIHVwZGF0aW5nIGNhbnZhcy5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZUNhbnZhc092ZXJsYXlcbiAgICAgKi9cbiAgICBwdWJsaWMgT25Mb2FkKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBpc1N0cmVldFZpZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgICAgY29uc3QgbWFwOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXAgPSAoPGFueT50aGlzKS5nZXRNYXAoKTtcblxuICAgICAgICAvLyBHZXQgdGhlIGN1cnJlbnQgbWFwIHZpZXcgaW5mb3JtYXRpb24uXG4gICAgICAgIHRoaXMuX3pvb21TdGFydCA9IG1hcC5nZXRab29tKCk7XG4gICAgICAgIGNvbnN0IGM6IEdvb2dsZU1hcFR5cGVzLkxhdExuZyA9IG1hcC5nZXRDZW50ZXIoKTtcbiAgICAgICAgdGhpcy5fY2VudGVyU3RhcnQgPSB7XG4gICAgICAgICAgICBsYXRpdHVkZTogYy5sYXQoKSxcbiAgICAgICAgICAgIGxvbmdpdHVkZTogYy5sbmcoKVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFdoZW4gdGhlIG1hcCBzdG9wcyBtb3ZpbmcsIHJlbmRlciBuZXcgZGF0YSBvbiB0aGUgY2FudmFzLlxuICAgICAgICB0aGlzLl92aWV3Q2hhbmdlRW5kRXZlbnQgPSBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXAsICdpZGxlJywgKGU6IGFueSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5VcGRhdGVDYW52YXMoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgb3ZlcmxheSB3aGVuIHRoZSBtYXAgaXMgcmVzaXplZC5cbiAgICAgICAgdGhpcy5fbWFwUmVzaXplRXZlbnQgPSBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXAsICdyZXNpemUnLCAoZTogYW55KSA9PiB7XG4gICAgICAgICAgICB0aGlzLlVwZGF0ZUNhbnZhcygpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBc3NvY2lhdGVzIHRoZSBjbmF2YXMgb3ZlcmxheSB3aXRoIGEgbWFwLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlQ2FudmFzT3ZlcmxheVxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRNYXAobWFwOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXApOiB2b2lkIHtcbiAgICAgICAgKDxhbnk+dGhpcykuc2V0TWFwKG1hcCk7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFByb3RlY3RlZCBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2hlcyB0aGUgY2FudmFzIHRvIHRoZSBtYXAuXG4gICAgICogQG1lbWJlcm9mIENhbnZhc092ZXJsYXlcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHJvdGVjdGVkIFNldENhbnZhc0VsZW1lbnQoZWw6IEhUTUxDYW52YXNFbGVtZW50KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHBhbmVzID0gKDxhbnk+dGhpcykuZ2V0UGFuZXMoKTtcbiAgICAgICAgaWYgKHBhbmVzKSB7XG4gICAgICAgICAgICBpZiAoZWwgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHBhbmVzLm92ZXJsYXlMYXllci5hcHBlbmRDaGlsZChlbCk7XG4gICAgICAgICAgICAgICAgLy8gNDogZmxvYXRQYW5lIChpbmZvd2luZG93KVxuICAgICAgICAgICAgICAgIC8vIDM6IG92ZXJsYXlNb3VzZVRhcmdldCAobW91c2UgZXZlbnRzKVxuICAgICAgICAgICAgICAgIC8vIDI6IG1hcmtlckxheWVyIChtYXJrZXIgaW1hZ2VzKVxuICAgICAgICAgICAgICAgIC8vIDE6IG92ZXJsYXlMYXllciAocG9seWdvbnMsIHBvbHlsaW5lcywgZ3JvdW5kIG92ZXJsYXlzLCB0aWxlIGxheWVyIG92ZXJsYXlzKVxuICAgICAgICAgICAgICAgIC8vIDA6IG1hcFBhbmUgKGxvd2VzdCBwYW5lIGFib3ZlIHRoZSBtYXAgdGlsZXMpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYW5lcy5vdmVybGF5TGF5ZXIucmVtb3ZlQ2hpbGQodGhpcy5fY2FudmFzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSB0aGUgbWFwIGV2ZW50IGhhbmRsZXJzLlxuICAgICAqIEBtZW1iZXJvZiBDYW52YXNPdmVybGF5XG4gICAgICogQG1ldGhvZFxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgUmVtb3ZlRXZlbnRIYW5kbGVycygpOiB2b2lkIHtcbiAgICAgICAgLy8gUmVtb3ZlIGFsbCBldmVudCBoYW5kbGVycyBmcm9tIHRoZSBtYXAuXG4gICAgICAgIGlmICh0aGlzLl92aWV3Q2hhbmdlRW5kRXZlbnQpIHsgZ29vZ2xlLm1hcHMuZXZlbnQucmVtb3ZlTGlzdGVuZXIodGhpcy5fdmlld0NoYW5nZUVuZEV2ZW50KTsgfVxuICAgICAgICBpZiAodGhpcy5fbWFwUmVzaXplRXZlbnQpIHsgZ29vZ2xlLm1hcHMuZXZlbnQucmVtb3ZlTGlzdGVuZXIodGhpcy5fbWFwUmVzaXplRXZlbnQpOyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgQ2FudmFzIHNpemUgYmFzZWQgb24gdGhlIG1hcCBzaXplLlxuICAgICAqIEBtZW1iZXJvZiBDYW52YXNPdmVybGF5XG4gICAgICogQG1ldGhvZFxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgUmVzaXplKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBtYXA6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCA9ICg8YW55PnRoaXMpLmdldE1hcCgpO1xuXG4gICAgICAgIC8vIENsZWFyIGNhbnZhcyBieSB1cGRhdGluZyBkaW1lbnNpb25zLiBUaGlzIGFsc28gZW5zdXJlcyBjYW52YXMgc3RheXMgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgbWFwLlxuICAgICAgICBjb25zdCBlbDogSFRNTERpdkVsZW1lbnQgPSBtYXAuZ2V0RGl2KCk7XG4gICAgICAgIHRoaXMuX2NhbnZhcy53aWR0aCA9IGVsLm9mZnNldFdpZHRoO1xuICAgICAgICB0aGlzLl9jYW52YXMuaGVpZ2h0ID0gZWwub2Zmc2V0SGVpZ2h0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIENhbnZhcy5cbiAgICAgKiBAbWVtYmVyb2YgQ2FudmFzT3ZlcmxheVxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgcHJvdGVjdGVkIFVwZGF0ZUNhbnZhcygpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgbWFwOiBHb29nbGVNYXBUeXBlcy5Hb29nbGVNYXAgPSAoPGFueT50aGlzKS5nZXRNYXAoKTtcblxuICAgICAgICAvLyBPbmx5IHJlbmRlciB0aGUgY2FudmFzIGlmIGl0IGlzbid0IGluIHN0cmVldHNpZGUgbW9kZS5cbiAgICAgICAgaWYgKHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS5kaXNwbGF5ID0gJyc7XG5cbiAgICAgICAgICAgIC8vIFJlc2V0IENTUyBwb3NpdGlvbiBhbmQgZGltZW5zaW9ucyBvZiBjYW52YXMuXG4gICAgICAgICAgICBjb25zdCBlbDogSFRNTERpdkVsZW1lbnQgPSBtYXAuZ2V0RGl2KCk7XG4gICAgICAgICAgICBjb25zdCB3OiBudW1iZXIgPSBlbC5vZmZzZXRXaWR0aDtcbiAgICAgICAgICAgIGNvbnN0IGg6IG51bWJlciA9IGVsLm9mZnNldEhlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IGNlbnRlclBvaW50ID0gKDxhbnk+dGhpcykuZ2V0UHJvamVjdGlvbigpLmZyb21MYXRMbmdUb0RpdlBpeGVsKG1hcC5nZXRDZW50ZXIoKSk7XG4gICAgICAgICAgICB0aGlzLlVwZGF0ZVBvc2l0aW9uKChjZW50ZXJQb2ludC54IC0gdyAvIDIpLCAoY2VudGVyUG9pbnQueSAtIGggLyAyKSwgdywgaCk7XG5cbiAgICAgICAgICAgIC8vIFJlZHJhdyB0aGUgY2FudmFzLlxuICAgICAgICAgICAgdGhpcy5SZWRyYXcodHJ1ZSk7XG5cbiAgICAgICAgICAgIC8vIEdldCB0aGUgY3VycmVudCBtYXAgdmlldyBpbmZvcm1hdGlvbi5cbiAgICAgICAgICAgIHRoaXMuX3pvb21TdGFydCA9IG1hcC5nZXRab29tKCk7XG4gICAgICAgICAgICBjb25zdCBjOiBHb29nbGVNYXBUeXBlcy5MYXRMbmcgPSBtYXAuZ2V0Q2VudGVyKCk7XG4gICAgICAgICAgICB0aGlzLl9jZW50ZXJTdGFydCA9IHtcbiAgICAgICAgICAgICAgICBsYXRpdHVkZTogYy5sYXQoKSxcbiAgICAgICAgICAgICAgICBsb25naXR1ZGU6IGMubG5nKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGV4dGVuZCB0aGUgT3ZlcmxheVZpZXcgaW50byB0aGUgQ2FudmFzT3ZlcmxheVxuICpcbiAqIEBleHBvcnRcbiAqIEBtZXRob2RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIE1peGluQ2FudmFzT3ZlcmxheSgpIHtcblxuICAgIG5ldyBFeHRlbmRlcihHb29nbGVDYW52YXNPdmVybGF5KVxuICAgICAgICAuRXh0ZW5kKG5ldyBnb29nbGUubWFwcy5PdmVybGF5VmlldylcbiAgICAgICAgLk1hcCgnb25BZGQnLCAnT25BZGQnKVxuICAgICAgICAuTWFwKCdkcmF3JywgJ09uRHJhdycpXG4gICAgICAgIC5NYXAoJ29uUmVtb3ZlJywgJ09uUmVtb3ZlJyk7XG59XG4iXX0=