import { BingConversions } from '../../services/bing/bing-conversions';
import { Polygon } from '../polygon';
import { BingMapLabel } from './bing-label';
/**
 * Concrete implementation for a polygon model for Bing Maps V8.
 *
 * @export
 */
export class BingPolygon extends Polygon {
    ///
    /// constructor
    ///
    /**
     * Creates an instance of BingPolygon.
     * @param _polygon - The {@link Microsoft.Maps.Polygon} underlying the model.
     * @param _mapService Instance of the Map Service.
     * @param _layer - The context layer.
     * @memberof BingPolygon
     */
    constructor(_polygon, _mapService, _layer) {
        super();
        this._polygon = _polygon;
        this._mapService = _mapService;
        this._layer = _layer;
        ///
        /// Field declarations
        ///
        this._map = null;
        this._isEditable = false;
        this._title = '';
        this._maxZoom = -1;
        this._minZoom = -1;
        this._showLabel = false;
        this._showTooltip = false;
        this._label = null;
        this._tooltip = null;
        this._hasToolTipReceiver = false;
        this._tooltipVisible = false;
        this._metadata = new Map();
        this._map = this._mapService.MapInstance;
        this._originalPath = this.GetPaths();
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets or sets the maximum zoom at which the label is displayed. Ignored or ShowLabel is false.
     *
     * @memberof GooglePolygon
     * @property
     */
    get LabelMaxZoom() { return this._maxZoom; }
    set LabelMaxZoom(val) {
        this._maxZoom = val;
        this.ManageLabel();
    }
    /**
     * Gets or sets the minimum zoom at which the label is displayed. Ignored or ShowLabel is false.
     *
     * @memberof GooglePolygon
     * @property
     */
    get LabelMinZoom() { return this._minZoom; }
    set LabelMinZoom(val) {
        this._minZoom = val;
        this.ManageLabel();
    }
    /**
     * Gets the polygon metadata.
     *
     * @readonly
     * @memberof BingPolygon
     */
    get Metadata() { return this._metadata; }
    /**
     * Gets the native primitve implementing the polygon, in this case {@link Microsoft.Maps.Polygon}
     *
     * @readonly
     * @memberof BingPolygon
     */
    get NativePrimitve() { return this._polygon; }
    /**
     * Gets or sets whether to show the label
     *
     * @abstract
     * @memberof BingPolygon
     * @property
     */
    get ShowLabel() { return this._showLabel; }
    set ShowLabel(val) {
        this._showLabel = val;
        this.ManageLabel();
    }
    /**
     * Gets or sets whether to show the tooltip
     *
     * @abstract
     * @memberof BingPolygon
     * @property
     */
    get ShowTooltip() { return this._showTooltip; }
    set ShowTooltip(val) {
        this._showTooltip = val;
        this.ManageTooltip();
    }
    /**
     * Gets or sets the title off the polygon
     *
     * @abstract
     * @memberof BingPolygon
     * @property
     */
    get Title() { return this._title; }
    set Title(val) {
        this._title = val;
        this.ManageLabel();
        this.ManageTooltip();
    }
    /**
     * Adds a delegate for an event.
     *
     * @param eventType - String containing the event name.
     * @param fn - Delegate function to execute when the event occurs.

     * @memberof BingPolygon
     */
    AddListener(eventType, fn) {
        const supportedEvents = ['click', 'dblclick', 'drag', 'dragend', 'dragstart', 'mousedown', 'mouseout', 'mouseover', 'mouseup'];
        if (supportedEvents.indexOf(eventType) !== -1) {
            Microsoft.Maps.Events.addHandler(this._polygon, eventType, (e) => {
                fn(e);
            });
        }
        if (eventType === 'mousemove') {
            let handlerId;
            Microsoft.Maps.Events.addHandler(this._polygon, 'mouseover', e => {
                handlerId = Microsoft.Maps.Events.addHandler(this._map, 'mousemove', m => fn(m));
            });
            Microsoft.Maps.Events.addHandler(this._polygon, 'mouseout', e => {
                if (handlerId) {
                    Microsoft.Maps.Events.removeHandler(handlerId);
                }
            });
        }
        if (eventType === 'pathchanged') {
            this._editingCompleteEmitter = fn;
        }
    }
    /**
     * Deleted the polygon.
     *
     * @memberof BingPolygon
     */
    Delete() {
        if (this._layer) {
            this._layer.remove(this.NativePrimitve);
        }
        else {
            this._map.entities.remove(this.NativePrimitve);
        }
        if (this._label) {
            this._label.Delete();
        }
        if (this._tooltip) {
            this._tooltip.Delete();
        }
    }
    /**
     * Gets whether the polygon is draggable.
     *
     * @returns - True if the polygon is dragable, false otherwise.
     *
     * @memberof BingPolygon
     */
    GetDraggable() {
        ///
        /// Bing polygons are not draggable by default.
        /// See https://social.msdn.microsoft.com/Forums/en-US/
        ///     7aaae748-4d5f-4be5-a7bb-90498e08b41c/how-can-i-make-polygonpolyline-draggable-in-bing-maps-8?
        ///     forum=bingmaps
        /// for a possible approach to be implemented in the model.
        ///
        return false;
    }
    /**
     * Gets whether the polygon path can be edited.
     *
     * @returns - True if the path can be edited, false otherwise.
     *
     * @memberof BingPolygon
     */
    GetEditable() {
        return this._isEditable;
    }
    /**
     * Gets the polygon path.
     *
     * @returns - Array of {@link ILatLong} objects describing the polygon path.
     *
     * @memberof BingPolygon
     */
    GetPath() {
        const p = this._polygon.getLocations();
        const path = new Array();
        p.forEach(l => path.push({ latitude: l.latitude, longitude: l.longitude }));
        return path;
    }
    /**
     * Gets the polygon paths.
     *
     * @returns - Array of Array of {@link ILatLong} objects describing multiple polygon paths.
     *
     * @memberof BingPolygon
     */
    GetPaths() {
        const p = this._polygon.getRings();
        const paths = new Array();
        p.forEach(x => {
            const path = new Array();
            x.forEach(y => path.push({ latitude: y.latitude, longitude: y.longitude }));
            paths.push(path);
        });
        return paths;
    }
    /**
     * Gets whether the polygon is visible.
     *
     * @returns - True if the polygon is visible, false otherwise.
     *
     * @memberof BingPolygon
     */
    GetVisible() {
        return this._polygon.getVisible();
    }
    /**
     * Sets whether the polygon is dragable.
     *
     * @param draggable - True to make the polygon dragable, false otherwise.
     *
     * @memberof BingPolygon
     */
    SetDraggable(draggable) {
        ///
        /// Bing polygons are not draggable by default.
        /// See https://social.msdn.microsoft.com/Forums/en-US/
        ///     7aaae748-4d5f-4be5-a7bb-90498e08b41c/how-can-i-make-polygonpolyline-draggable-in-bing-maps-8
        //      ?forum=bingmaps
        /// for a possible approach to be implemented in the model.
        ///
        throw (new Error('The bing maps implementation currently does not support draggable polygons.'));
    }
    /**
     * Sets wether the polygon path is editable.
     *
     * @param editable - True to make polygon path editable, false otherwise.
     *
     * @memberof BingPolygon
     */
    SetEditable(editable) {
        const isChanged = this._isEditable !== editable;
        this._isEditable = editable;
        if (!isChanged) {
            return;
        }
        if (this._isEditable) {
            this._originalPath = this.GetPaths();
            this._mapService.GetDrawingTools().then(t => {
                t.edit(this._polygon);
            });
        }
        else {
            this._mapService.GetDrawingTools().then(t => {
                t.finish((editedPolygon) => {
                    if (editedPolygon !== this._polygon || !this._editingCompleteEmitter) {
                        return;
                    }
                    const newPath = this.GetPaths();
                    const originalPath = this._originalPath;
                    this.SetPaths(newPath);
                    // this is necessary for the new path to persist it appears.
                    this._editingCompleteEmitter({
                        Click: null,
                        Polygon: this,
                        OriginalPath: originalPath,
                        NewPath: newPath
                    });
                });
            });
        }
    }
    /**
     * Sets the polygon options
     *
     * @param options - {@link ILatLong} object containing the options. The options are merged with hte ones
     * already on the underlying model.
     *
     * @memberof Polygon
     */
    SetOptions(options) {
        const o = BingConversions.TranslatePolygonOptions(options);
        this._polygon.setOptions(o);
        if (options.visible != null && this._showLabel && this._label) {
            this._label.Set('hidden', !options.visible);
        }
        if (typeof options.editable !== 'undefined') {
            this.SetEditable(options.editable);
        }
    }
    /**
     * Sets the polygon path.
     *
     * @param path - An Array of {@link ILatLong} (or array of arrays) describing the polygons path.
     *
     * @memberof BingPolygon
     */
    SetPath(path) {
        const p = new Array();
        path.forEach(x => p.push(new Microsoft.Maps.Location(x.latitude, x.longitude)));
        this._originalPath = [path];
        this._polygon.setLocations(p);
        if (this._label) {
            this._centroid = null;
            this.ManageLabel();
        }
    }
    /**
     * Set the polygon path or paths.
     *
     * @param paths
     * An Array of {@link ILatLong} (or array of arrays) describing the polygons path(s).
     *
     * @memberof BingPolygon
     */
    SetPaths(paths) {
        if (paths == null) {
            return;
        }
        if (!Array.isArray(paths)) {
            return;
        }
        if (paths.length === 0) {
            this._polygon.setRings(new Array());
            if (this._label) {
                this._label.Delete();
                this._label = null;
            }
            return;
        }
        if (Array.isArray(paths[0])) {
            // parameter is an array or arrays
            const p = new Array();
            paths.forEach(path => {
                const _p = new Array();
                path.forEach(x => _p.push(new Microsoft.Maps.Location(x.latitude, x.longitude)));
                p.push(_p);
            });
            this._originalPath = paths;
            this._polygon.setRings(p);
            if (this._label) {
                this._centroid = null;
                this.ManageLabel();
            }
        }
        else {
            // parameter is a simple array....
            this.SetPath(paths);
        }
    }
    /**
     * Sets whether the polygon is visible.
     *
     * @param visible - True to set the polygon visible, false otherwise.
     *
     * @memberof BingPolygon
     */
    SetVisible(visible) {
        this._polygon.setOptions({ visible: visible });
        if (this._showLabel && this._label) {
            this._label.Set('hidden', !visible);
        }
    }
    ///
    /// Private methods
    ///
    /**
     * Configures the label for the polygon
     * @memberof Polygon
     */
    ManageLabel() {
        if (this.GetPath == null || this.GetPath().length === 0) {
            return;
        }
        if (this._showLabel && this._title != null && this._title !== '') {
            const o = {
                text: this._title,
                position: BingConversions.TranslateLocation(this.Centroid)
            };
            if (o.position == null) {
                return;
            }
            if (this._minZoom !== -1) {
                o.minZoom = this._minZoom;
            }
            if (this._maxZoom !== -1) {
                o.maxZoom = this._maxZoom;
            }
            if (this._label == null) {
                this._label = new BingMapLabel(o);
                this._label.SetMap(this._map);
            }
            else {
                this._label.SetValues(o);
            }
            this._label.Set('hidden', !this.GetVisible());
        }
        else {
            if (this._label) {
                this._label.SetMap(null);
                this._label = null;
            }
        }
    }
    /**
     * Configures the tooltip for the polygon
     * @memberof Polygon
     */
    ManageTooltip() {
        if (this._showTooltip && this._title != null && this._title !== '') {
            const o = {
                text: this._title,
                align: 'left',
                offset: new Microsoft.Maps.Point(0, 25),
                backgroundColor: 'bisque',
                hidden: true,
                fontSize: 12,
                fontColor: '#000000',
                strokeWeight: 0
            };
            if (this._tooltip == null) {
                this._tooltip = new BingMapLabel(o);
                this._tooltip.SetMap(this._map);
            }
            else {
                this._tooltip.SetValues(o);
            }
            if (!this._hasToolTipReceiver) {
                this._mouseOverListener = Microsoft.Maps.Events.addHandler(this._polygon, 'mouseover', (e) => {
                    this._tooltip.Set('position', e.location);
                    if (!this._tooltipVisible) {
                        this._tooltip.Set('hidden', false);
                        this._tooltipVisible = true;
                    }
                    this._mouseMoveListener = Microsoft.Maps.Events.addHandler(this._map, 'mousemove', (m) => {
                        if (this._tooltipVisible && m.location && m.primitive === this._polygon) {
                            this._tooltip.Set('position', m.location);
                        }
                    });
                });
                this._mouseOutListener = Microsoft.Maps.Events.addHandler(this._polygon, 'mouseout', (e) => {
                    if (this._tooltipVisible) {
                        this._tooltip.Set('hidden', true);
                        this._tooltipVisible = false;
                    }
                    if (this._mouseMoveListener) {
                        Microsoft.Maps.Events.removeHandler(this._mouseMoveListener);
                    }
                });
                this._hasToolTipReceiver = true;
            }
        }
        if ((!this._showTooltip || this._title === '' || this._title == null)) {
            if (this._hasToolTipReceiver) {
                if (this._mouseOutListener) {
                    Microsoft.Maps.Events.removeHandler(this._mouseOutListener);
                }
                if (this._mouseOverListener) {
                    Microsoft.Maps.Events.removeHandler(this._mouseOverListener);
                }
                if (this._mouseMoveListener) {
                    Microsoft.Maps.Events.removeHandler(this._mouseMoveListener);
                }
                this._hasToolTipReceiver = false;
            }
            if (this._tooltip) {
                this._tooltip.SetMap(null);
                this._tooltip = null;
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1wb2x5Z29uLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL21vZGVscy9iaW5nL2JpbmctcG9seWdvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFFdkUsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFlBQVksQ0FBQztBQUNyQyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBRTVDOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sV0FBWSxTQUFRLE9BQU87SUEyR3BDLEdBQUc7SUFDSCxlQUFlO0lBQ2YsR0FBRztJQUVIOzs7Ozs7T0FNRztJQUNILFlBQ1ksUUFBZ0MsRUFDOUIsV0FBMkIsRUFDM0IsTUFBNEI7UUFFdEMsS0FBSyxFQUFFLENBQUM7UUFKQSxhQUFRLEdBQVIsUUFBUSxDQUF3QjtRQUM5QixnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7UUFDM0IsV0FBTSxHQUFOLE1BQU0sQ0FBc0I7UUF2SDFDLEdBQUc7UUFDSCxzQkFBc0I7UUFDdEIsR0FBRztRQUNLLFNBQUksR0FBdUIsSUFBSSxDQUFDO1FBQ2hDLGdCQUFXLEdBQVksS0FBSyxDQUFDO1FBQzdCLFdBQU0sR0FBVyxFQUFFLENBQUM7UUFDcEIsYUFBUSxHQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLGFBQVEsR0FBVyxDQUFDLENBQUMsQ0FBQztRQUN0QixlQUFVLEdBQVksS0FBSyxDQUFDO1FBQzVCLGlCQUFZLEdBQVksS0FBSyxDQUFDO1FBQzlCLFdBQU0sR0FBaUIsSUFBSSxDQUFDO1FBQzVCLGFBQVEsR0FBaUIsSUFBSSxDQUFDO1FBQzlCLHdCQUFtQixHQUFZLEtBQUssQ0FBQztRQUNyQyxvQkFBZSxHQUFZLEtBQUssQ0FBQztRQUlqQyxjQUFTLEdBQXFCLElBQUksR0FBRyxFQUFlLENBQUM7UUF5R3pELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFdB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RTtnQkFDNUYsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7b0JBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2lCQUFFO2dCQUM5RixJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtvQkFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7aUJBQUU7Z0JBQzlGLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxLQUFLLENBQUM7YUFDcEM7WUFDRCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO2FBQ3hCO1NBQ0o7SUFDTCxDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJTGF0TG9uZyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWxhdGxvbmcnO1xuaW1wb3J0IHsgSVBvbHlnb25PcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pcG9seWdvbi1vcHRpb25zJztcbmltcG9ydCB7IElQb2x5Z29uRXZlbnQgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzL2lwb2x5Z29uLWV2ZW50JztcbmltcG9ydCB7IEJpbmdDb252ZXJzaW9ucyB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2JpbmcvYmluZy1jb252ZXJzaW9ucyc7XG5pbXBvcnQgeyBCaW5nTWFwU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2JpbmcvYmluZy1tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBQb2x5Z29uIH0gZnJvbSAnLi4vcG9seWdvbic7XG5pbXBvcnQgeyBCaW5nTWFwTGFiZWwgfSBmcm9tICcuL2JpbmctbGFiZWwnO1xuXG4vKipcbiAqIENvbmNyZXRlIGltcGxlbWVudGF0aW9uIGZvciBhIHBvbHlnb24gbW9kZWwgZm9yIEJpbmcgTWFwcyBWOC5cbiAqXG4gKiBAZXhwb3J0XG4gKi9cbmV4cG9ydCBjbGFzcyBCaW5nUG9seWdvbiBleHRlbmRzIFBvbHlnb24gaW1wbGVtZW50cyBQb2x5Z29uIHtcblxuICAgIC8vL1xuICAgIC8vLyBGaWVsZCBkZWNsYXJhdGlvbnNcbiAgICAvLy9cbiAgICBwcml2YXRlIF9tYXA6IE1pY3Jvc29mdC5NYXBzLk1hcCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfaXNFZGl0YWJsZTogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByaXZhdGUgX3RpdGxlOiBzdHJpbmcgPSAnJztcbiAgICBwcml2YXRlIF9tYXhab29tOiBudW1iZXIgPSAtMTtcbiAgICBwcml2YXRlIF9taW5ab29tOiBudW1iZXIgPSAtMTtcbiAgICBwcml2YXRlIF9zaG93TGFiZWw6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcml2YXRlIF9zaG93VG9vbHRpcDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2xhYmVsOiBCaW5nTWFwTGFiZWwgPSBudWxsO1xuICAgIHByaXZhdGUgX3Rvb2x0aXA6IEJpbmdNYXBMYWJlbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBfaGFzVG9vbFRpcFJlY2VpdmVyOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfdG9vbHRpcFZpc2libGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcml2YXRlIF9tb3VzZU92ZXJMaXN0ZW5lcjogTWljcm9zb2Z0Lk1hcHMuSUhhbmRsZXJJZDtcbiAgICBwcml2YXRlIF9tb3VzZU1vdmVMaXN0ZW5lcjogTWljcm9zb2Z0Lk1hcHMuSUhhbmRsZXJJZDtcbiAgICBwcml2YXRlIF9tb3VzZU91dExpc3RlbmVyOiBNaWNyb3NvZnQuTWFwcy5JSGFuZGxlcklkO1xuICAgIHByaXZhdGUgX21ldGFkYXRhOiBNYXA8c3RyaW5nLCBhbnk+ID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcbiAgICBwcml2YXRlIF9vcmlnaW5hbFBhdGg6IEFycmF5PEFycmF5PElMYXRMb25nPj47XG4gICAgcHJpdmF0ZSBfZWRpdGluZ0NvbXBsZXRlRW1pdHRlcjogKGV2ZW50OiBJUG9seWdvbkV2ZW50KSA9PiB2b2lkO1xuXG4gICAgLy8vXG4gICAgLy8vIFByb3BlcnR5IGRlY2xhcmF0aW9uc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogR2V0cyBvciBzZXRzIHRoZSBtYXhpbXVtIHpvb20gYXQgd2hpY2ggdGhlIGxhYmVsIGlzIGRpc3BsYXllZC4gSWdub3JlZCBvciBTaG93TGFiZWwgaXMgZmFsc2UuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlUG9seWdvblxuICAgICAqIEBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgTGFiZWxNYXhab29tKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9tYXhab29tOyB9XG4gICAgcHVibGljIHNldCBMYWJlbE1heFpvb20odmFsOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fbWF4Wm9vbSA9IHZhbDtcbiAgICAgICAgdGhpcy5NYW5hZ2VMYWJlbCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyB0aGUgbWluaW11bSB6b29tIGF0IHdoaWNoIHRoZSBsYWJlbCBpcyBkaXNwbGF5ZWQuIElnbm9yZWQgb3IgU2hvd0xhYmVsIGlzIGZhbHNlLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZVBvbHlnb25cbiAgICAgKiBAcHJvcGVydHlcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IExhYmVsTWluWm9vbSgpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fbWluWm9vbTsgfVxuICAgIHB1YmxpYyBzZXQgTGFiZWxNaW5ab29tKHZhbDogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX21pblpvb20gPSB2YWw7XG4gICAgICAgIHRoaXMuTWFuYWdlTGFiZWwoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBwb2x5Z29uIG1ldGFkYXRhLlxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIEJpbmdQb2x5Z29uXG4gICAgICovXG4gICAgcHVibGljIGdldCBNZXRhZGF0YSgpOiBNYXA8c3RyaW5nLCBhbnk+IHsgcmV0dXJuIHRoaXMuX21ldGFkYXRhOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBuYXRpdmUgcHJpbWl0dmUgaW1wbGVtZW50aW5nIHRoZSBwb2x5Z29uLCBpbiB0aGlzIGNhc2Uge0BsaW5rIE1pY3Jvc29mdC5NYXBzLlBvbHlnb259XG4gICAgICpcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAbWVtYmVyb2YgQmluZ1BvbHlnb25cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IE5hdGl2ZVByaW1pdHZlKCk6IE1pY3Jvc29mdC5NYXBzLlBvbHlnb24geyByZXR1cm4gdGhpcy5fcG9seWdvbjsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgdG8gc2hvdyB0aGUgbGFiZWxcbiAgICAgKlxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWdvblxuICAgICAqIEBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgU2hvd0xhYmVsKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fc2hvd0xhYmVsOyB9XG4gICAgcHVibGljIHNldCBTaG93TGFiZWwodmFsOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuX3Nob3dMYWJlbCA9IHZhbDtcbiAgICAgICAgdGhpcy5NYW5hZ2VMYWJlbCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgb3Igc2V0cyB3aGV0aGVyIHRvIHNob3cgdGhlIHRvb2x0aXBcbiAgICAgKlxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWdvblxuICAgICAqIEBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgU2hvd1Rvb2x0aXAoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9zaG93VG9vbHRpcDsgfVxuICAgIHB1YmxpYyBzZXQgU2hvd1Rvb2x0aXAodmFsOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuX3Nob3dUb29sdGlwID0gdmFsO1xuICAgICAgICB0aGlzLk1hbmFnZVRvb2x0aXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIHRpdGxlIG9mZiB0aGUgcG9seWdvblxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQG1lbWJlcm9mIEJpbmdQb2x5Z29uXG4gICAgICogQHByb3BlcnR5XG4gICAgICovXG4gICAgcHVibGljIGdldCBUaXRsZSgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5fdGl0bGU7IH1cbiAgICBwdWJsaWMgc2V0IFRpdGxlKHZhbDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX3RpdGxlID0gdmFsO1xuICAgICAgICB0aGlzLk1hbmFnZUxhYmVsKCk7XG4gICAgICAgIHRoaXMuTWFuYWdlVG9vbHRpcCgpO1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBjb25zdHJ1Y3RvclxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBCaW5nUG9seWdvbi5cbiAgICAgKiBAcGFyYW0gX3BvbHlnb24gLSBUaGUge0BsaW5rIE1pY3Jvc29mdC5NYXBzLlBvbHlnb259IHVuZGVybHlpbmcgdGhlIG1vZGVsLlxuICAgICAqIEBwYXJhbSBfbWFwU2VydmljZSBJbnN0YW5jZSBvZiB0aGUgTWFwIFNlcnZpY2UuXG4gICAgICogQHBhcmFtIF9sYXllciAtIFRoZSBjb250ZXh0IGxheWVyLlxuICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWdvblxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIF9wb2x5Z29uOiBNaWNyb3NvZnQuTWFwcy5Qb2x5Z29uLFxuICAgICAgICBwcm90ZWN0ZWQgX21hcFNlcnZpY2U6IEJpbmdNYXBTZXJ2aWNlLFxuICAgICAgICBwcm90ZWN0ZWQgX2xheWVyOiBNaWNyb3NvZnQuTWFwcy5MYXllcixcbiAgICApIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fbWFwID0gdGhpcy5fbWFwU2VydmljZS5NYXBJbnN0YW5jZTtcbiAgICAgICAgdGhpcy5fb3JpZ2luYWxQYXRoID0gdGhpcy5HZXRQYXRocygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBkZWxlZ2F0ZSBmb3IgYW4gZXZlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXZlbnRUeXBlIC0gU3RyaW5nIGNvbnRhaW5pbmcgdGhlIGV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIGZuIC0gRGVsZWdhdGUgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHRoZSBldmVudCBvY2N1cnMuXG5cbiAgICAgKiBAbWVtYmVyb2YgQmluZ1BvbHlnb25cbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkTGlzdGVuZXIoZXZlbnRUeXBlOiBzdHJpbmcsIGZuOiBGdW5jdGlvbik6IHZvaWQge1xuICAgICAgICBjb25zdCBzdXBwb3J0ZWRFdmVudHMgPSBbJ2NsaWNrJywgJ2RibGNsaWNrJywgJ2RyYWcnLCAnZHJhZ2VuZCcsICdkcmFnc3RhcnQnLCAnbW91c2Vkb3duJywgJ21vdXNlb3V0JywgJ21vdXNlb3ZlcicsICdtb3VzZXVwJ107XG4gICAgICAgIGlmIChzdXBwb3J0ZWRFdmVudHMuaW5kZXhPZihldmVudFR5cGUpICE9PSAtMSkge1xuICAgICAgICAgICAgTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmFkZEhhbmRsZXIodGhpcy5fcG9seWdvbiwgZXZlbnRUeXBlLCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGZuKGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gJ21vdXNlbW92ZScpIHtcbiAgICAgICAgICAgIGxldCBoYW5kbGVySWQ6IE1pY3Jvc29mdC5NYXBzLklIYW5kbGVySWQ7XG4gICAgICAgICAgICBNaWNyb3NvZnQuTWFwcy5FdmVudHMuYWRkSGFuZGxlcih0aGlzLl9wb2x5Z29uLCAnbW91c2VvdmVyJywgZSA9PiB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcklkID0gTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmFkZEhhbmRsZXIodGhpcy5fbWFwLCAnbW91c2Vtb3ZlJywgbSA9PiBmbihtKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKHRoaXMuX3BvbHlnb24sICdtb3VzZW91dCcsIGUgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChoYW5kbGVySWQpIHsgTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLnJlbW92ZUhhbmRsZXIoaGFuZGxlcklkKTsgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gaWYgKGV2ZW50VHlwZSA9PT0gJ3BhdGhjaGFuZ2VkJykge1xuICAgICAgICAgICAgdGhpcy5fZWRpdGluZ0NvbXBsZXRlRW1pdHRlciA9IDwoZXZlbnQ6IElQb2x5Z29uRXZlbnQpID0+IHZvaWQ+Zm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVkIHRoZSBwb2x5Z29uLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdQb2x5Z29uXG4gICAgICovXG4gICAgcHVibGljIERlbGV0ZSgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuX2xheWVyKSB7IHRoaXMuX2xheWVyLnJlbW92ZSh0aGlzLk5hdGl2ZVByaW1pdHZlKTsgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX21hcC5lbnRpdGllcy5yZW1vdmUodGhpcy5OYXRpdmVQcmltaXR2ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2xhYmVsKSB7IHRoaXMuX2xhYmVsLkRlbGV0ZSgpOyB9XG4gICAgICAgIGlmICh0aGlzLl90b29sdGlwKSB7IHRoaXMuX3Rvb2x0aXAuRGVsZXRlKCk7IH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHdoZXRoZXIgdGhlIHBvbHlnb24gaXMgZHJhZ2dhYmxlLlxuICAgICAqXG4gICAgICogQHJldHVybnMgLSBUcnVlIGlmIHRoZSBwb2x5Z29uIGlzIGRyYWdhYmxlLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ1BvbHlnb25cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0RHJhZ2dhYmxlKCk6IGJvb2xlYW4ge1xuICAgICAgICAvLy9cbiAgICAgICAgLy8vIEJpbmcgcG9seWdvbnMgYXJlIG5vdCBkcmFnZ2FibGUgYnkgZGVmYXVsdC5cbiAgICAgICAgLy8vIFNlZSBodHRwczovL3NvY2lhbC5tc2RuLm1pY3Jvc29mdC5jb20vRm9ydW1zL2VuLVVTL1xuICAgICAgICAvLy8gICAgIDdhYWFlNzQ4LTRkNWYtNGJlNS1hN2JiLTkwNDk4ZTA4YjQxYy9ob3ctY2FuLWktbWFrZS1wb2x5Z29ucG9seWxpbmUtZHJhZ2dhYmxlLWluLWJpbmctbWFwcy04P1xuICAgICAgICAvLy8gICAgIGZvcnVtPWJpbmdtYXBzXG4gICAgICAgIC8vLyBmb3IgYSBwb3NzaWJsZSBhcHByb2FjaCB0byBiZSBpbXBsZW1lbnRlZCBpbiB0aGUgbW9kZWwuXG4gICAgICAgIC8vL1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB3aGV0aGVyIHRoZSBwb2x5Z29uIHBhdGggY2FuIGJlIGVkaXRlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIC0gVHJ1ZSBpZiB0aGUgcGF0aCBjYW4gYmUgZWRpdGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ1BvbHlnb25cbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0RWRpdGFibGUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0VkaXRhYmxlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIHBvbHlnb24gcGF0aC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIC0gQXJyYXkgb2Yge0BsaW5rIElMYXRMb25nfSBvYmplY3RzIGRlc2NyaWJpbmcgdGhlIHBvbHlnb24gcGF0aC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWdvblxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRQYXRoKCk6IEFycmF5PElMYXRMb25nPiB7XG4gICAgICAgIGNvbnN0IHA6IEFycmF5PE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uPiA9IHRoaXMuX3BvbHlnb24uZ2V0TG9jYXRpb25zKCk7XG4gICAgICAgIGNvbnN0IHBhdGg6IEFycmF5PElMYXRMb25nPiA9IG5ldyBBcnJheTxJTGF0TG9uZz4oKTtcbiAgICAgICAgcC5mb3JFYWNoKGwgPT4gcGF0aC5wdXNoKHsgbGF0aXR1ZGU6IGwubGF0aXR1ZGUsIGxvbmdpdHVkZTogbC5sb25naXR1ZGUgfSkpO1xuICAgICAgICByZXR1cm4gcGF0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBwb2x5Z29uIHBhdGhzLlxuICAgICAqXG4gICAgICogQHJldHVybnMgLSBBcnJheSBvZiBBcnJheSBvZiB7QGxpbmsgSUxhdExvbmd9IG9iamVjdHMgZGVzY3JpYmluZyBtdWx0aXBsZSBwb2x5Z29uIHBhdGhzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdQb2x5Z29uXG4gICAgICovXG4gICAgcHVibGljIEdldFBhdGhzKCk6IEFycmF5PEFycmF5PElMYXRMb25nPj4ge1xuICAgICAgICBjb25zdCBwOiBBcnJheTxBcnJheTxNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbj4+ID0gdGhpcy5fcG9seWdvbi5nZXRSaW5ncygpO1xuICAgICAgICBjb25zdCBwYXRoczogQXJyYXk8QXJyYXk8SUxhdExvbmc+PiA9IG5ldyBBcnJheTxBcnJheTxJTGF0TG9uZz4+KCk7XG4gICAgICAgIHAuZm9yRWFjaCh4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGg6IEFycmF5PElMYXRMb25nPiA9IG5ldyBBcnJheTxJTGF0TG9uZz4oKTtcbiAgICAgICAgICAgIHguZm9yRWFjaCh5ID0+IHBhdGgucHVzaCh7IGxhdGl0dWRlOiB5LmxhdGl0dWRlLCBsb25naXR1ZGU6IHkubG9uZ2l0dWRlIH0pKTtcbiAgICAgICAgICAgIHBhdGhzLnB1c2gocGF0aCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcGF0aHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB3aGV0aGVyIHRoZSBwb2x5Z29uIGlzIHZpc2libGUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyAtIFRydWUgaWYgdGhlIHBvbHlnb24gaXMgdmlzaWJsZSwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdQb2x5Z29uXG4gICAgICovXG4gICAgcHVibGljIEdldFZpc2libGUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wb2x5Z29uLmdldFZpc2libGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHdoZXRoZXIgdGhlIHBvbHlnb24gaXMgZHJhZ2FibGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZHJhZ2dhYmxlIC0gVHJ1ZSB0byBtYWtlIHRoZSBwb2x5Z29uIGRyYWdhYmxlLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ1BvbHlnb25cbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0RHJhZ2dhYmxlKGRyYWdnYWJsZTogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICAvLy9cbiAgICAgICAgLy8vIEJpbmcgcG9seWdvbnMgYXJlIG5vdCBkcmFnZ2FibGUgYnkgZGVmYXVsdC5cbiAgICAgICAgLy8vIFNlZSBodHRwczovL3NvY2lhbC5tc2RuLm1pY3Jvc29mdC5jb20vRm9ydW1zL2VuLVVTL1xuICAgICAgICAvLy8gICAgIDdhYWFlNzQ4LTRkNWYtNGJlNS1hN2JiLTkwNDk4ZTA4YjQxYy9ob3ctY2FuLWktbWFrZS1wb2x5Z29ucG9seWxpbmUtZHJhZ2dhYmxlLWluLWJpbmctbWFwcy04XG4gICAgICAgIC8vICAgICAgP2ZvcnVtPWJpbmdtYXBzXG4gICAgICAgIC8vLyBmb3IgYSBwb3NzaWJsZSBhcHByb2FjaCB0byBiZSBpbXBsZW1lbnRlZCBpbiB0aGUgbW9kZWwuXG4gICAgICAgIC8vL1xuICAgICAgICB0aHJvdyAobmV3IEVycm9yKCdUaGUgYmluZyBtYXBzIGltcGxlbWVudGF0aW9uIGN1cnJlbnRseSBkb2VzIG5vdCBzdXBwb3J0IGRyYWdnYWJsZSBwb2x5Z29ucy4nKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB3ZXRoZXIgdGhlIHBvbHlnb24gcGF0aCBpcyBlZGl0YWJsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlZGl0YWJsZSAtIFRydWUgdG8gbWFrZSBwb2x5Z29uIHBhdGggZWRpdGFibGUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWdvblxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRFZGl0YWJsZShlZGl0YWJsZTogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBjb25zdCBpc0NoYW5nZWQgPSB0aGlzLl9pc0VkaXRhYmxlICE9PSBlZGl0YWJsZTtcbiAgICAgICAgdGhpcy5faXNFZGl0YWJsZSA9IGVkaXRhYmxlO1xuICAgICAgICBpZiAoIWlzQ2hhbmdlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2lzRWRpdGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuX29yaWdpbmFsUGF0aCA9IHRoaXMuR2V0UGF0aHMoKTtcbiAgICAgICAgICAgIHRoaXMuX21hcFNlcnZpY2UuR2V0RHJhd2luZ1Rvb2xzKCkudGhlbih0ID0+IHtcbiAgICAgICAgICAgICAgICB0LmVkaXQodGhpcy5fcG9seWdvbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX21hcFNlcnZpY2UuR2V0RHJhd2luZ1Rvb2xzKCkudGhlbih0ID0+IHtcbiAgICAgICAgICAgICAgICB0LmZpbmlzaCgoZWRpdGVkUG9seWdvbjogTWljcm9zb2Z0Lk1hcHMuUG9seWdvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWRpdGVkUG9seWdvbiAhPT0gdGhpcy5fcG9seWdvbiB8fCAhdGhpcy5fZWRpdGluZ0NvbXBsZXRlRW1pdHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1BhdGg6IEFycmF5PEFycmF5PElMYXRMb25nPj4gPSB0aGlzLkdldFBhdGhzKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsUGF0aDogQXJyYXk8QXJyYXk8SUxhdExvbmc+PiA9IHRoaXMuX29yaWdpbmFsUGF0aDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5TZXRQYXRocyhuZXdQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMgbmVjZXNzYXJ5IGZvciB0aGUgbmV3IHBhdGggdG8gcGVyc2lzdCBpdCBhcHBlYXJzLlxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lZGl0aW5nQ29tcGxldGVFbWl0dGVyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENsaWNrOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgUG9seWdvbjogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIE9yaWdpbmFsUGF0aDogb3JpZ2luYWxQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgTmV3UGF0aDogbmV3UGF0aFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgcG9seWdvbiBvcHRpb25zXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIHtAbGluayBJTGF0TG9uZ30gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG9wdGlvbnMuIFRoZSBvcHRpb25zIGFyZSBtZXJnZWQgd2l0aCBodGUgb25lc1xuICAgICAqIGFscmVhZHkgb24gdGhlIHVuZGVybHlpbmcgbW9kZWwuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgUG9seWdvblxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRPcHRpb25zKG9wdGlvbnM6IElQb2x5Z29uT3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBjb25zdCBvOiBNaWNyb3NvZnQuTWFwcy5JUG9seWdvbk9wdGlvbnMgPSBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlUG9seWdvbk9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3BvbHlnb24uc2V0T3B0aW9ucyhvKTtcbiAgICAgICAgaWYgKG9wdGlvbnMudmlzaWJsZSAhPSBudWxsICYmIHRoaXMuX3Nob3dMYWJlbCAmJiB0aGlzLl9sYWJlbCkgeyB0aGlzLl9sYWJlbC5TZXQoJ2hpZGRlbicsICFvcHRpb25zLnZpc2libGUpOyB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmVkaXRhYmxlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5TZXRFZGl0YWJsZShvcHRpb25zLmVkaXRhYmxlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIHBvbHlnb24gcGF0aC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYXRoIC0gQW4gQXJyYXkgb2Yge0BsaW5rIElMYXRMb25nfSAob3IgYXJyYXkgb2YgYXJyYXlzKSBkZXNjcmliaW5nIHRoZSBwb2x5Z29ucyBwYXRoLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdQb2x5Z29uXG4gICAgICovXG4gICAgcHVibGljIFNldFBhdGgocGF0aDogQXJyYXk8SUxhdExvbmc+KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHA6IEFycmF5PE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uPiA9IG5ldyBBcnJheTxNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbj4oKTtcbiAgICAgICAgcGF0aC5mb3JFYWNoKHggPT4gcC5wdXNoKG5ldyBNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbih4LmxhdGl0dWRlLCB4LmxvbmdpdHVkZSkpKTtcbiAgICAgICAgdGhpcy5fb3JpZ2luYWxQYXRoID0gW3BhdGhdO1xuICAgICAgICB0aGlzLl9wb2x5Z29uLnNldExvY2F0aW9ucyhwKTtcbiAgICAgICAgaWYgKHRoaXMuX2xhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLl9jZW50cm9pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLk1hbmFnZUxhYmVsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHBvbHlnb24gcGF0aCBvciBwYXRocy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYXRoc1xuICAgICAqIEFuIEFycmF5IG9mIHtAbGluayBJTGF0TG9uZ30gKG9yIGFycmF5IG9mIGFycmF5cykgZGVzY3JpYmluZyB0aGUgcG9seWdvbnMgcGF0aChzKS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWdvblxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRQYXRocyhwYXRoczogQXJyYXk8QXJyYXk8SUxhdExvbmc+PiB8IEFycmF5PElMYXRMb25nPik6IHZvaWQge1xuICAgICAgICBpZiAocGF0aHMgPT0gbnVsbCkgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHBhdGhzKSkgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKHBhdGhzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5fcG9seWdvbi5zZXRSaW5ncyhuZXcgQXJyYXk8TWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24+KCkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2xhYmVsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGFiZWwuRGVsZXRlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGFiZWwgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhdGhzWzBdKSkge1xuICAgICAgICAgICAgLy8gcGFyYW1ldGVyIGlzIGFuIGFycmF5IG9yIGFycmF5c1xuICAgICAgICAgICAgY29uc3QgcDogQXJyYXk8QXJyYXk8TWljcm9zb2Z0Lk1hcHMuTG9jYXRpb24+PiA9IG5ldyBBcnJheTxBcnJheTxNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbj4+KCk7XG4gICAgICAgICAgICAoPEFycmF5PEFycmF5PElMYXRMb25nPj4+cGF0aHMpLmZvckVhY2gocGF0aCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgX3A6IEFycmF5PE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uPiA9IG5ldyBBcnJheTxNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbj4oKTtcbiAgICAgICAgICAgICAgICBwYXRoLmZvckVhY2goeCA9PiBfcC5wdXNoKG5ldyBNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbih4LmxhdGl0dWRlLCB4LmxvbmdpdHVkZSkpKTtcbiAgICAgICAgICAgICAgICBwLnB1c2goX3ApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9vcmlnaW5hbFBhdGggPSA8QXJyYXk8QXJyYXk8SUxhdExvbmc+Pj5wYXRocztcbiAgICAgICAgICAgIHRoaXMuX3BvbHlnb24uc2V0UmluZ3MocCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fbGFiZWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jZW50cm9pZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5NYW5hZ2VMYWJlbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gcGFyYW1ldGVyIGlzIGEgc2ltcGxlIGFycmF5Li4uLlxuICAgICAgICAgICAgdGhpcy5TZXRQYXRoKDxBcnJheTxJTGF0TG9uZz4+cGF0aHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB3aGV0aGVyIHRoZSBwb2x5Z29uIGlzIHZpc2libGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdmlzaWJsZSAtIFRydWUgdG8gc2V0IHRoZSBwb2x5Z29uIHZpc2libGUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nUG9seWdvblxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRWaXNpYmxlKHZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fcG9seWdvbi5zZXRPcHRpb25zKDxNaWNyb3NvZnQuTWFwcy5JUG9seWdvbk9wdGlvbnM+eyB2aXNpYmxlOiB2aXNpYmxlIH0pO1xuICAgICAgICBpZiAodGhpcy5fc2hvd0xhYmVsICYmIHRoaXMuX2xhYmVsKSB7IHRoaXMuX2xhYmVsLlNldCgnaGlkZGVuJywgIXZpc2libGUpOyB9XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFByaXZhdGUgbWV0aG9kc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ29uZmlndXJlcyB0aGUgbGFiZWwgZm9yIHRoZSBwb2x5Z29uXG4gICAgICogQG1lbWJlcm9mIFBvbHlnb25cbiAgICAgKi9cbiAgICBwcml2YXRlIE1hbmFnZUxhYmVsKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5HZXRQYXRoID09IG51bGwgfHwgdGhpcy5HZXRQYXRoKCkubGVuZ3RoID09PSAwKSB7IHJldHVybjsgfVxuICAgICAgICBpZiAodGhpcy5fc2hvd0xhYmVsICYmIHRoaXMuX3RpdGxlICE9IG51bGwgJiYgdGhpcy5fdGl0bGUgIT09ICcnKSB7XG4gICAgICAgICAgICBjb25zdCBvOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge1xuICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMuX3RpdGxlLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBCaW5nQ29udmVyc2lvbnMuVHJhbnNsYXRlTG9jYXRpb24odGhpcy5DZW50cm9pZClcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoby5wb3NpdGlvbiA9PSBudWxsKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX21pblpvb20gIT09IC0xKSB7IG8ubWluWm9vbSA9IHRoaXMuX21pblpvb207IH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9tYXhab29tICE9PSAtMSkgeyBvLm1heFpvb20gPSB0aGlzLl9tYXhab29tOyB9XG4gICAgICAgICAgICBpZiAodGhpcy5fbGFiZWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xhYmVsID0gbmV3IEJpbmdNYXBMYWJlbChvKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYWJlbC5TZXRNYXAodGhpcy5fbWFwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xhYmVsLlNldFZhbHVlcyhvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2xhYmVsLlNldCgnaGlkZGVuJywgIXRoaXMuR2V0VmlzaWJsZSgpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9sYWJlbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xhYmVsLlNldE1hcChudWxsKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYWJlbCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb25maWd1cmVzIHRoZSB0b29sdGlwIGZvciB0aGUgcG9seWdvblxuICAgICAqIEBtZW1iZXJvZiBQb2x5Z29uXG4gICAgICovXG4gICAgcHJpdmF0ZSBNYW5hZ2VUb29sdGlwKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5fc2hvd1Rvb2x0aXAgJiYgdGhpcy5fdGl0bGUgIT0gbnVsbCAmJiB0aGlzLl90aXRsZSAhPT0gJycpIHtcbiAgICAgICAgICAgIGNvbnN0IG86IHsgW2tleTogc3RyaW5nXTogYW55IH0gPSB7XG4gICAgICAgICAgICAgICAgdGV4dDogdGhpcy5fdGl0bGUsXG4gICAgICAgICAgICAgICAgYWxpZ246ICdsZWZ0JyxcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IG5ldyBNaWNyb3NvZnQuTWFwcy5Qb2ludCgwLCAyNSksXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnYmlzcXVlJyxcbiAgICAgICAgICAgICAgICBoaWRkZW46IHRydWUsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6IDEyLFxuICAgICAgICAgICAgICAgIGZvbnRDb2xvcjogJyMwMDAwMDAnLFxuICAgICAgICAgICAgICAgIHN0cm9rZVdlaWdodDogMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh0aGlzLl90b29sdGlwID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwID0gbmV3IEJpbmdNYXBMYWJlbChvKTtcbiAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwLlNldE1hcCh0aGlzLl9tYXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdG9vbHRpcC5TZXRWYWx1ZXMobyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2hhc1Rvb2xUaXBSZWNlaXZlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuX21vdXNlT3Zlckxpc3RlbmVyID0gTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmFkZEhhbmRsZXIoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BvbHlnb24sICdtb3VzZW92ZXInLCAoZTogTWljcm9zb2Z0Lk1hcHMuSU1vdXNlRXZlbnRBcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwLlNldCgncG9zaXRpb24nLCBlLmxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fdG9vbHRpcFZpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwLlNldCgnaGlkZGVuJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXBWaXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdXNlTW92ZUxpc3RlbmVyID0gTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLmFkZEhhbmRsZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbWFwLCAnbW91c2Vtb3ZlJywgKG06IE1pY3Jvc29mdC5NYXBzLklNb3VzZUV2ZW50QXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fdG9vbHRpcFZpc2libGUgJiYgbS5sb2NhdGlvbiAmJiBtLnByaW1pdGl2ZSA9PT0gdGhpcy5fcG9seWdvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdG9vbHRpcC5TZXQoJ3Bvc2l0aW9uJywgbS5sb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbW91c2VPdXRMaXN0ZW5lciA9IE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wb2x5Z29uLCAnbW91c2VvdXQnLCAoZTogTWljcm9zb2Z0Lk1hcHMuSU1vdXNlRXZlbnRBcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fdG9vbHRpcFZpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwLlNldCgnaGlkZGVuJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdG9vbHRpcFZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9tb3VzZU1vdmVMaXN0ZW5lcikgeyBNaWNyb3NvZnQuTWFwcy5FdmVudHMucmVtb3ZlSGFuZGxlcih0aGlzLl9tb3VzZU1vdmVMaXN0ZW5lcik7IH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5faGFzVG9vbFRpcFJlY2VpdmVyID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoKCF0aGlzLl9zaG93VG9vbHRpcCB8fCB0aGlzLl90aXRsZSA9PT0gJycgfHwgdGhpcy5fdGl0bGUgPT0gbnVsbCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9oYXNUb29sVGlwUmVjZWl2ZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbW91c2VPdXRMaXN0ZW5lcikgeyBNaWNyb3NvZnQuTWFwcy5FdmVudHMucmVtb3ZlSGFuZGxlcih0aGlzLl9tb3VzZU91dExpc3RlbmVyKTsgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9tb3VzZU92ZXJMaXN0ZW5lcikgeyBNaWNyb3NvZnQuTWFwcy5FdmVudHMucmVtb3ZlSGFuZGxlcih0aGlzLl9tb3VzZU92ZXJMaXN0ZW5lcik7IH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbW91c2VNb3ZlTGlzdGVuZXIpIHsgTWljcm9zb2Z0Lk1hcHMuRXZlbnRzLnJlbW92ZUhhbmRsZXIodGhpcy5fbW91c2VNb3ZlTGlzdGVuZXIpOyB9XG4gICAgICAgICAgICAgICAgdGhpcy5faGFzVG9vbFRpcFJlY2VpdmVyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fdG9vbHRpcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAuU2V0TWFwKG51bGwpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59XG4iXX0=