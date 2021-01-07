import { BingConversions } from '../../services/bing/bing-conversions';
import { CanvasOverlay } from '../canvas-overlay';
import { BingMapLabel } from './bing-label';
import { Extender } from '../extender';
/**
 * Concrete implementing a canvas overlay to be placed on the map for Bing Maps.
 *
 * @export
 */
export class BingCanvasOverlay extends CanvasOverlay {
    /**
     * Creates a new instance of the BingCanvasOverlay class.
     * @param drawCallback A callback function that is triggered when the canvas is ready to be
     * rendered for the current map view.
     * @memberof BingCanvasOverlay
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
     * @abstract
     * @param e - The mouse event. Expected to implement {@link Microsoft.Maps.IMouseEventArgs}.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     * @memberof BingCanvasOverlay
     */
    GetCoordinatesFromClick(e) {
        return { latitude: e.location.latitude, longitude: e.location.longitude };
    }
    /**
     * Gets the map associted with the label.
     *
     * @memberof BingCanvasOverlay
     * @method
     */
    GetMap() {
        return this.getMap();
    }
    /**
     * Returns a MapLabel instance for the current platform that can be used as a tooltip.
     * This method only generates the map label. Content and placement is the responsibility
     * of the caller. Note that this method returns null until OnLoad has been called.
     *
     * @returns - The label to be used for the tooltip.
     * @memberof BingCanvasOverlay
     * @method
     */
    GetToolTipOverlay() {
        const o = {
            align: 'left',
            offset: new Microsoft.Maps.Point(0, 25),
            backgroundColor: 'bisque',
            hidden: true,
            fontSize: 12,
            fontColor: '#000000',
            strokeWeight: 0
        };
        const label = new BingMapLabel(o);
        label.SetMap(this.GetMap());
        return label;
    }
    /**
     * CanvasOverlay loaded, attach map events for updating canvas.
     * @abstract
     * @method
     * @memberof BingCanvasOverlay
     */
    OnLoad() {
        const map = this.getMap();
        // Get the current map view information.
        this._zoomStart = map.getZoom();
        this._centerStart = map.getCenter();
        // Redraw the canvas.
        this.Redraw(true);
        // When the map moves, move the canvas accordingly.
        this._viewChangeEvent = Microsoft.Maps.Events.addHandler(map, 'viewchange', (e) => {
            if (map.getMapTypeId() === Microsoft.Maps.MapTypeId.streetside) {
                // Don't show the canvas if the map is in Streetside mode.
                this._canvas.style.display = 'none';
            }
            else {
                // Re-drawing the canvas as it moves would be too slow. Instead, scale and translate canvas element.
                const zoomCurrent = map.getZoom();
                const centerCurrent = map.getCenter();
                // Calculate map scale based on zoom level difference.
                const scale = Math.pow(2, zoomCurrent - this._zoomStart);
                // Calculate the scaled dimensions of the canvas.
                const newWidth = map.getWidth() * scale;
                const newHeight = map.getHeight() * scale;
                // Calculate offset of canvas based on zoom and center offsets.
                const pixelPoints = map.tryLocationToPixel([
                    BingConversions.TranslateLocation(this._centerStart),
                    centerCurrent
                ], Microsoft.Maps.PixelReference.control);
                const centerOffsetX = pixelPoints[1].x - pixelPoints[0].x;
                const centerOffsetY = pixelPoints[1].y - pixelPoints[0].y;
                const x = (-(newWidth - map.getWidth()) / 2) - centerOffsetX;
                const y = (-(newHeight - map.getHeight()) / 2) - centerOffsetY;
                // Update the canvas CSS position and dimensions.
                this.UpdatePosition(x, y, newWidth, newHeight);
            }
        });
        // When the map stops moving, render new data on the canvas.
        this._viewChangeEndEvent = Microsoft.Maps.Events.addHandler(map, 'viewchangeend', (e) => {
            this.UpdateCanvas();
        });
        // Update the position of the overlay when the map is resized.
        this._mapResizeEvent = Microsoft.Maps.Events.addHandler(map, 'mapresize', (e) => {
            this.UpdateCanvas();
        });
        // set the overlay to ready state
        this._readyResolver(true);
    }
    /**
     * Sets the map for the label. Settings this to null remove the label from hte map.
     *
     * @param map - Map to associated with the label.
     * @memberof CanvasOverlay
     * @method
     */
    SetMap(map) {
        const m = this.GetMap();
        if (map === m) {
            return;
        }
        if (m) {
            m.layers.remove(this);
        }
        if (map != null) {
            map.layers.insert(this);
        }
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
        this.setHtmlElement(el);
    }
    /**
     * Remove the map event handlers.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    RemoveEventHandlers() {
        // Remove all event handlers from the map.
        Microsoft.Maps.Events.removeHandler(this._viewChangeEvent);
        Microsoft.Maps.Events.removeHandler(this._viewChangeEndEvent);
        Microsoft.Maps.Events.removeHandler(this._mapResizeEvent);
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
        this._canvas.width = map.getWidth();
        this._canvas.height = map.getHeight();
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
        if (map.getMapTypeId() !== Microsoft.Maps.MapTypeId.streetside) {
            this._canvas.style.display = '';
            // Reset CSS position and dimensions of canvas.
            this.UpdatePosition(0, 0, map.getWidth(), map.getHeight());
            // Redraw the canvas.
            this.Redraw(true);
            // Get the current map view information.
            this._zoomStart = map.getZoom();
            this._centerStart = map.getCenter();
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
    new Extender(BingCanvasOverlay)
        .Extend(new Microsoft.Maps.CustomOverlay())
        .Map('onAdd', 'OnAdd')
        .Map('onLoad', 'OnLoad')
        .Map('onRemove', 'OnRemove');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1jYW52YXMtb3ZlcmxheS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9tb2RlbHMvYmluZy9iaW5nLWNhbnZhcy1vdmVybGF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUN2RSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFbEQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUM1QyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBRXZDOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8saUJBQWtCLFNBQVEsYUFBYTtJQVVoRDs7Ozs7T0FLRztJQUNILFlBQVksWUFBaUQ7UUFDekQsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRCxHQUFHO0lBQ0gsa0JBQWtCO0lBQ2xCLEdBQUc7SUFFSDs7Ozs7OztPQU9HO0lBQ0ksdUJBQXVCLENBQUMsQ0FBaUM7UUFDNUQsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUM5RSxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSSxNQUFNO1FBQ1QsT0FBYSxJQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0ksaUJBQWlCO1FBQ3BCLE1BQU0sQ0FBQyxHQUEyQjtZQUM5QixLQUFLLEVBQUUsTUFBTTtZQUNiLE1BQU0sRUFBRSxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdkMsZUFBZSxFQUFFLFFBQVE7WUFDekIsTUFBTSxFQUFFLElBQUk7WUFDWixRQUFRLEVBQUUsRUFBRTtZQUNaLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLFlBQVksRUFBRSxDQUFDO1NBQ2xCLENBQUM7UUFDRixNQUFNLEtBQUssR0FBYSxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLE1BQU07UUFDVCxNQUFNLEdBQUcsR0FBNkIsSUFBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRXJELHdDQUF3QztRQUN4QyxJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsWUFBWSxHQUFhLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUU5QyxxQkFBcUI7UUFDckIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVsQixtREFBbUQ7UUFDbkQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDOUUsSUFBSSxHQUFHLENBQUMsWUFBWSxFQUFFLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFO2dCQUM1RCwwREFBMEQ7Z0JBQzFELElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7YUFDdkM7aUJBQ0k7Z0JBQ0Qsb0dBQW9HO2dCQUNwRyxNQUFNLFdBQVcsR0FBVyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzFDLE1BQU0sYUFBYSxHQUE0QixHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBRS9ELHNEQUFzRDtnQkFDdEQsTUFBTSxLQUFLLEdBQVcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFFakUsaURBQWlEO2dCQUNqRCxNQUFNLFFBQVEsR0FBVyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDO2dCQUNoRCxNQUFNLFNBQVMsR0FBVyxHQUFHLENBQUMsU0FBUyxFQUFFLEdBQUcsS0FBSyxDQUFDO2dCQUVsRCwrREFBK0Q7Z0JBQy9ELE1BQU0sV0FBVyxHQUE2RCxHQUFHLENBQUMsa0JBQWtCLENBQUM7b0JBQzdGLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO29CQUNwRCxhQUFhO2lCQUNoQixFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLGFBQWEsR0FBVyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xFLE1BQU0sYUFBYSxHQUFXLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEUsTUFBTSxDQUFDLEdBQVcsQ0FBQyxDQUFDLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQztnQkFDckUsTUFBTSxDQUFDLEdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQztnQkFFdkUsaURBQWlEO2dCQUNqRCxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2FBQ2xEO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCw0REFBNEQ7UUFDNUQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDcEYsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO1FBRUgsOERBQThEO1FBQzlELElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUM1RSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDeEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxpQ0FBaUM7UUFDakMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksTUFBTSxDQUFDLEdBQXVCO1FBQ2pDLE1BQU0sQ0FBQyxHQUF1QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDNUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFO1lBQUUsT0FBTztTQUFFO1FBQzFCLElBQUksQ0FBQyxFQUFFO1lBQ0gsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDekI7UUFDRCxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUU7WUFDYixHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQjtJQUNMLENBQUM7SUFFRCxHQUFHO0lBQ0gscUJBQXFCO0lBQ3JCLEdBQUc7SUFFSDs7OztPQUlHO0lBQ08sZ0JBQWdCLENBQUMsRUFBcUI7UUFDdEMsSUFBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDTyxtQkFBbUI7UUFDekIsMENBQTBDO1FBQzFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUMzRCxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDOUQsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDTyxNQUFNO1FBQ1osTUFBTSxHQUFHLEdBQTZCLElBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUVyRCxnR0FBZ0c7UUFDaEcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUMxQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDTyxZQUFZO1FBQ2xCLE1BQU0sR0FBRyxHQUE2QixJQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFckQseURBQXlEO1FBQ3pELElBQUksR0FBRyxDQUFDLFlBQVksRUFBRSxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRTtZQUM1RCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBRWhDLCtDQUErQztZQUMvQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBRTNELHFCQUFxQjtZQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRWxCLHdDQUF3QztZQUN4QyxJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUMsWUFBWSxHQUFhLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUNqRDtJQUNMLENBQUM7Q0FDSjtBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQjtJQUU5QixJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztTQUM5QixNQUFNLENBQUMsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1NBQzFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO1NBQ3JCLEdBQUcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO1NBQ3ZCLEdBQUcsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDakMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElMYXRMb25nIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgeyBCaW5nQ29udmVyc2lvbnMgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9iaW5nL2JpbmctY29udmVyc2lvbnMnO1xuaW1wb3J0IHsgQ2FudmFzT3ZlcmxheSB9IGZyb20gJy4uL2NhbnZhcy1vdmVybGF5JztcbmltcG9ydCB7IE1hcExhYmVsIH0gZnJvbSAnLi4vbWFwLWxhYmVsJztcbmltcG9ydCB7IEJpbmdNYXBMYWJlbCB9IGZyb20gJy4vYmluZy1sYWJlbCc7XG5pbXBvcnQgeyBFeHRlbmRlciB9IGZyb20gJy4uL2V4dGVuZGVyJztcblxuLyoqXG4gKiBDb25jcmV0ZSBpbXBsZW1lbnRpbmcgYSBjYW52YXMgb3ZlcmxheSB0byBiZSBwbGFjZWQgb24gdGhlIG1hcCBmb3IgQmluZyBNYXBzLlxuICpcbiAqIEBleHBvcnRcbiAqL1xuZXhwb3J0IGNsYXNzIEJpbmdDYW52YXNPdmVybGF5IGV4dGVuZHMgQ2FudmFzT3ZlcmxheSB7XG5cbiAgICAvLy9cbiAgICAvLy8gZmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfdmlld0NoYW5nZUV2ZW50OiBNaWNyb3NvZnQuTWFwcy5JSGFuZGxlcklkO1xuICAgIHByaXZhdGUgX3ZpZXdDaGFuZ2VFbmRFdmVudDogTWljcm9zb2Z0Lk1hcHMuSUhhbmRsZXJJZDtcbiAgICBwcml2YXRlIF9tYXBSZXNpemVFdmVudDogTWljcm9zb2Z0Lk1hcHMuSUhhbmRsZXJJZDtcblxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgQmluZ0NhbnZhc092ZXJsYXkgY2xhc3MuXG4gICAgICogQHBhcmFtIGRyYXdDYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgaXMgdHJpZ2dlcmVkIHdoZW4gdGhlIGNhbnZhcyBpcyByZWFkeSB0byBiZVxuICAgICAqIHJlbmRlcmVkIGZvciB0aGUgY3VycmVudCBtYXAgdmlldy5cbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NhbnZhc092ZXJsYXlcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihkcmF3Q2FsbGJhY2s6IChjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KSA9PiB2b2lkKSB7XG4gICAgICAgIHN1cGVyKGRyYXdDYWxsYmFjayk7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBPYnRhaW5zIGdlbyBjb29yZGluYXRlcyBmb3IgdGhlIGNsaWNrIGxvY2F0aW9uXG4gICAgICpcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAcGFyYW0gZSAtIFRoZSBtb3VzZSBldmVudC4gRXhwZWN0ZWQgdG8gaW1wbGVtZW50IHtAbGluayBNaWNyb3NvZnQuTWFwcy5JTW91c2VFdmVudEFyZ3N9LlxuICAgICAqIEByZXR1cm5zIC0ge0BsaW5rIElMYXRMb25nfSBjb250YWluaW5nIHRoZSBnZW8gY29vcmRpbmF0ZXMgb2YgdGhlIGNsaWNrZWQgbWFya2VyLlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2FudmFzT3ZlcmxheVxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRDb29yZGluYXRlc0Zyb21DbGljayhlOiBNaWNyb3NvZnQuTWFwcy5JTW91c2VFdmVudEFyZ3MpOiBJTGF0TG9uZyB7XG4gICAgICAgIHJldHVybiB7IGxhdGl0dWRlOiBlLmxvY2F0aW9uLmxhdGl0dWRlLCBsb25naXR1ZGU6IGUubG9jYXRpb24ubG9uZ2l0dWRlIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbWFwIGFzc29jaXRlZCB3aXRoIHRoZSBsYWJlbC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2FudmFzT3ZlcmxheVxuICAgICAqIEBtZXRob2RcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0TWFwKCk6IE1pY3Jvc29mdC5NYXBzLk1hcCB7XG4gICAgICAgIHJldHVybiAoPGFueT50aGlzKS5nZXRNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgTWFwTGFiZWwgaW5zdGFuY2UgZm9yIHRoZSBjdXJyZW50IHBsYXRmb3JtIHRoYXQgY2FuIGJlIHVzZWQgYXMgYSB0b29sdGlwLlxuICAgICAqIFRoaXMgbWV0aG9kIG9ubHkgZ2VuZXJhdGVzIHRoZSBtYXAgbGFiZWwuIENvbnRlbnQgYW5kIHBsYWNlbWVudCBpcyB0aGUgcmVzcG9uc2liaWxpdHlcbiAgICAgKiBvZiB0aGUgY2FsbGVyLiBOb3RlIHRoYXQgdGhpcyBtZXRob2QgcmV0dXJucyBudWxsIHVudGlsIE9uTG9hZCBoYXMgYmVlbiBjYWxsZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyAtIFRoZSBsYWJlbCB0byBiZSB1c2VkIGZvciB0aGUgdG9vbHRpcC5cbiAgICAgKiBAbWVtYmVyb2YgQmluZ0NhbnZhc092ZXJsYXlcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIEdldFRvb2xUaXBPdmVybGF5KCk6IE1hcExhYmVsIHtcbiAgICAgICAgY29uc3QgbzogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHtcbiAgICAgICAgICAgIGFsaWduOiAnbGVmdCcsXG4gICAgICAgICAgICBvZmZzZXQ6IG5ldyBNaWNyb3NvZnQuTWFwcy5Qb2ludCgwLCAyNSksXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdiaXNxdWUnLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgZm9udFNpemU6IDEyLFxuICAgICAgICAgICAgZm9udENvbG9yOiAnIzAwMDAwMCcsXG4gICAgICAgICAgICBzdHJva2VXZWlnaHQ6IDBcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgbGFiZWw6IE1hcExhYmVsID0gbmV3IEJpbmdNYXBMYWJlbChvKTtcbiAgICAgICAgbGFiZWwuU2V0TWFwKHRoaXMuR2V0TWFwKCkpO1xuICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FudmFzT3ZlcmxheSBsb2FkZWQsIGF0dGFjaCBtYXAgZXZlbnRzIGZvciB1cGRhdGluZyBjYW52YXMuXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBCaW5nQ2FudmFzT3ZlcmxheVxuICAgICAqL1xuICAgIHB1YmxpYyBPbkxvYWQoKSB7XG4gICAgICAgIGNvbnN0IG1hcDogTWljcm9zb2Z0Lk1hcHMuTWFwID0gKDxhbnk+dGhpcykuZ2V0TWFwKCk7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBjdXJyZW50IG1hcCB2aWV3IGluZm9ybWF0aW9uLlxuICAgICAgICB0aGlzLl96b29tU3RhcnQgPSBtYXAuZ2V0Wm9vbSgpO1xuICAgICAgICB0aGlzLl9jZW50ZXJTdGFydCA9IDxJTGF0TG9uZz5tYXAuZ2V0Q2VudGVyKCk7XG5cbiAgICAgICAgLy8gUmVkcmF3IHRoZSBjYW52YXMuXG4gICAgICAgIHRoaXMuUmVkcmF3KHRydWUpO1xuXG4gICAgICAgIC8vIFdoZW4gdGhlIG1hcCBtb3ZlcywgbW92ZSB0aGUgY2FudmFzIGFjY29yZGluZ2x5LlxuICAgICAgICB0aGlzLl92aWV3Q2hhbmdlRXZlbnQgPSBNaWNyb3NvZnQuTWFwcy5FdmVudHMuYWRkSGFuZGxlcihtYXAsICd2aWV3Y2hhbmdlJywgKGUpID0+IHtcbiAgICAgICAgICAgIGlmIChtYXAuZ2V0TWFwVHlwZUlkKCkgPT09IE1pY3Jvc29mdC5NYXBzLk1hcFR5cGVJZC5zdHJlZXRzaWRlKSB7XG4gICAgICAgICAgICAgICAgLy8gRG9uJ3Qgc2hvdyB0aGUgY2FudmFzIGlmIHRoZSBtYXAgaXMgaW4gU3RyZWV0c2lkZSBtb2RlLlxuICAgICAgICAgICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gUmUtZHJhd2luZyB0aGUgY2FudmFzIGFzIGl0IG1vdmVzIHdvdWxkIGJlIHRvbyBzbG93LiBJbnN0ZWFkLCBzY2FsZSBhbmQgdHJhbnNsYXRlIGNhbnZhcyBlbGVtZW50LlxuICAgICAgICAgICAgICAgIGNvbnN0IHpvb21DdXJyZW50OiBudW1iZXIgPSBtYXAuZ2V0Wm9vbSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRlckN1cnJlbnQ6IE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uID0gbWFwLmdldENlbnRlcigpO1xuXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIG1hcCBzY2FsZSBiYXNlZCBvbiB6b29tIGxldmVsIGRpZmZlcmVuY2UuXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbGU6IG51bWJlciA9IE1hdGgucG93KDIsIHpvb21DdXJyZW50IC0gdGhpcy5fem9vbVN0YXJ0KTtcblxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgc2NhbGVkIGRpbWVuc2lvbnMgb2YgdGhlIGNhbnZhcy5cbiAgICAgICAgICAgICAgICBjb25zdCBuZXdXaWR0aDogbnVtYmVyID0gbWFwLmdldFdpZHRoKCkgKiBzY2FsZTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdIZWlnaHQ6IG51bWJlciA9IG1hcC5nZXRIZWlnaHQoKSAqIHNjYWxlO1xuXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIG9mZnNldCBvZiBjYW52YXMgYmFzZWQgb24gem9vbSBhbmQgY2VudGVyIG9mZnNldHMuXG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxQb2ludHM6IEFycmF5PE1pY3Jvc29mdC5NYXBzLlBvaW50PiA9IDxBcnJheTxNaWNyb3NvZnQuTWFwcy5Qb2ludD4+bWFwLnRyeUxvY2F0aW9uVG9QaXhlbChbXG4gICAgICAgICAgICAgICAgICAgICAgICBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlTG9jYXRpb24odGhpcy5fY2VudGVyU3RhcnQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyQ3VycmVudFxuICAgICAgICAgICAgICAgICAgICBdLCBNaWNyb3NvZnQuTWFwcy5QaXhlbFJlZmVyZW5jZS5jb250cm9sKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjZW50ZXJPZmZzZXRYOiBudW1iZXIgPSBwaXhlbFBvaW50c1sxXS54IC0gcGl4ZWxQb2ludHNbMF0ueDtcbiAgICAgICAgICAgICAgICBjb25zdCBjZW50ZXJPZmZzZXRZOiBudW1iZXIgPSBwaXhlbFBvaW50c1sxXS55IC0gcGl4ZWxQb2ludHNbMF0ueTtcbiAgICAgICAgICAgICAgICBjb25zdCB4OiBudW1iZXIgPSAoLShuZXdXaWR0aCAtIG1hcC5nZXRXaWR0aCgpKSAvIDIpIC0gY2VudGVyT2Zmc2V0WDtcbiAgICAgICAgICAgICAgICBjb25zdCB5OiBudW1iZXIgPSAoLShuZXdIZWlnaHQgLSBtYXAuZ2V0SGVpZ2h0KCkpIC8gMikgLSBjZW50ZXJPZmZzZXRZO1xuXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBjYW52YXMgQ1NTIHBvc2l0aW9uIGFuZCBkaW1lbnNpb25zLlxuICAgICAgICAgICAgICAgIHRoaXMuVXBkYXRlUG9zaXRpb24oeCwgeSwgbmV3V2lkdGgsIG5ld0hlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFdoZW4gdGhlIG1hcCBzdG9wcyBtb3ZpbmcsIHJlbmRlciBuZXcgZGF0YSBvbiB0aGUgY2FudmFzLlxuICAgICAgICB0aGlzLl92aWV3Q2hhbmdlRW5kRXZlbnQgPSBNaWNyb3NvZnQuTWFwcy5FdmVudHMuYWRkSGFuZGxlcihtYXAsICd2aWV3Y2hhbmdlZW5kJywgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlQ2FudmFzKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgcG9zaXRpb24gb2YgdGhlIG92ZXJsYXkgd2hlbiB0aGUgbWFwIGlzIHJlc2l6ZWQuXG4gICAgICAgIHRoaXMuX21hcFJlc2l6ZUV2ZW50ID0gTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmFkZEhhbmRsZXIobWFwLCAnbWFwcmVzaXplJywgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlQ2FudmFzKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHNldCB0aGUgb3ZlcmxheSB0byByZWFkeSBzdGF0ZVxuICAgICAgICB0aGlzLl9yZWFkeVJlc29sdmVyKHRydWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIG1hcCBmb3IgdGhlIGxhYmVsLiBTZXR0aW5ncyB0aGlzIHRvIG51bGwgcmVtb3ZlIHRoZSBsYWJlbCBmcm9tIGh0ZSBtYXAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWFwIC0gTWFwIHRvIGFzc29jaWF0ZWQgd2l0aCB0aGUgbGFiZWwuXG4gICAgICogQG1lbWJlcm9mIENhbnZhc092ZXJsYXlcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIFNldE1hcChtYXA6IE1pY3Jvc29mdC5NYXBzLk1hcCk6IHZvaWQge1xuICAgICAgICBjb25zdCBtOiBNaWNyb3NvZnQuTWFwcy5NYXAgPSB0aGlzLkdldE1hcCgpO1xuICAgICAgICBpZiAobWFwID09PSBtKSB7IHJldHVybjsgfVxuICAgICAgICBpZiAobSkge1xuICAgICAgICAgICAgbS5sYXllcnMucmVtb3ZlKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXAgIT0gbnVsbCkge1xuICAgICAgICAgICAgbWFwLmxheWVycy5pbnNlcnQodGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHJvdGVjdGVkIG1ldGhvZHNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEF0dGFjaGVzIHRoZSBjYW52YXMgdG8gdGhlIG1hcC5cbiAgICAgKiBAbWVtYmVyb2YgQ2FudmFzT3ZlcmxheVxuICAgICAqIEBtZXRob2RcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgU2V0Q2FudmFzRWxlbWVudChlbDogSFRNTENhbnZhc0VsZW1lbnQpOiB2b2lkIHtcbiAgICAgICAgKDxhbnk+dGhpcykuc2V0SHRtbEVsZW1lbnQoZWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSB0aGUgbWFwIGV2ZW50IGhhbmRsZXJzLlxuICAgICAqIEBtZW1iZXJvZiBDYW52YXNPdmVybGF5XG4gICAgICogQG1ldGhvZFxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgUmVtb3ZlRXZlbnRIYW5kbGVycygpOiB2b2lkIHtcbiAgICAgICAgLy8gUmVtb3ZlIGFsbCBldmVudCBoYW5kbGVycyBmcm9tIHRoZSBtYXAuXG4gICAgICAgIE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5yZW1vdmVIYW5kbGVyKHRoaXMuX3ZpZXdDaGFuZ2VFdmVudCk7XG4gICAgICAgIE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5yZW1vdmVIYW5kbGVyKHRoaXMuX3ZpZXdDaGFuZ2VFbmRFdmVudCk7XG4gICAgICAgIE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5yZW1vdmVIYW5kbGVyKHRoaXMuX21hcFJlc2l6ZUV2ZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBDYW52YXMgc2l6ZSBiYXNlZCBvbiB0aGUgbWFwIHNpemUuXG4gICAgICogQG1lbWJlcm9mIENhbnZhc092ZXJsYXlcbiAgICAgKiBAbWV0aG9kXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBSZXNpemUoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG1hcDogTWljcm9zb2Z0Lk1hcHMuTWFwID0gKDxhbnk+dGhpcykuZ2V0TWFwKCk7XG5cbiAgICAgICAgLy8gQ2xlYXIgY2FudmFzIGJ5IHVwZGF0aW5nIGRpbWVuc2lvbnMuIFRoaXMgYWxzbyBlbnN1cmVzIGNhbnZhcyBzdGF5cyB0aGUgc2FtZSBzaXplIGFzIHRoZSBtYXAuXG4gICAgICAgIHRoaXMuX2NhbnZhcy53aWR0aCA9IG1hcC5nZXRXaWR0aCgpO1xuICAgICAgICB0aGlzLl9jYW52YXMuaGVpZ2h0ID0gbWFwLmdldEhlaWdodCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIENhbnZhcy5cbiAgICAgKiBAbWVtYmVyb2YgQ2FudmFzT3ZlcmxheVxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgcHJvdGVjdGVkIFVwZGF0ZUNhbnZhcygpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgbWFwOiBNaWNyb3NvZnQuTWFwcy5NYXAgPSAoPGFueT50aGlzKS5nZXRNYXAoKTtcblxuICAgICAgICAvLyBPbmx5IHJlbmRlciB0aGUgY2FudmFzIGlmIGl0IGlzbid0IGluIHN0cmVldHNpZGUgbW9kZS5cbiAgICAgICAgaWYgKG1hcC5nZXRNYXBUeXBlSWQoKSAhPT0gTWljcm9zb2Z0Lk1hcHMuTWFwVHlwZUlkLnN0cmVldHNpZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS5kaXNwbGF5ID0gJyc7XG5cbiAgICAgICAgICAgIC8vIFJlc2V0IENTUyBwb3NpdGlvbiBhbmQgZGltZW5zaW9ucyBvZiBjYW52YXMuXG4gICAgICAgICAgICB0aGlzLlVwZGF0ZVBvc2l0aW9uKDAsIDAsIG1hcC5nZXRXaWR0aCgpLCBtYXAuZ2V0SGVpZ2h0KCkpO1xuXG4gICAgICAgICAgICAvLyBSZWRyYXcgdGhlIGNhbnZhcy5cbiAgICAgICAgICAgIHRoaXMuUmVkcmF3KHRydWUpO1xuXG4gICAgICAgICAgICAvLyBHZXQgdGhlIGN1cnJlbnQgbWFwIHZpZXcgaW5mb3JtYXRpb24uXG4gICAgICAgICAgICB0aGlzLl96b29tU3RhcnQgPSBtYXAuZ2V0Wm9vbSgpO1xuICAgICAgICAgICAgdGhpcy5fY2VudGVyU3RhcnQgPSA8SUxhdExvbmc+bWFwLmdldENlbnRlcigpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBleHRlbmQgdGhlIE92ZXJsYXlWaWV3IGludG8gdGhlIENhbnZhc092ZXJsYXlcbiAqXG4gKiBAZXhwb3J0XG4gKiBAbWV0aG9kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBNaXhpbkNhbnZhc092ZXJsYXkoKSB7XG5cbiAgICBuZXcgRXh0ZW5kZXIoQmluZ0NhbnZhc092ZXJsYXkpXG4gICAgLkV4dGVuZChuZXcgTWljcm9zb2Z0Lk1hcHMuQ3VzdG9tT3ZlcmxheSgpKVxuICAgIC5NYXAoJ29uQWRkJywgJ09uQWRkJylcbiAgICAuTWFwKCdvbkxvYWQnLCAnT25Mb2FkJylcbiAgICAuTWFwKCdvblJlbW92ZScsICdPblJlbW92ZScpO1xufVxuIl19