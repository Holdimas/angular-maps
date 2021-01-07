import { GoogleConversions } from '../../services/google/google-conversions';
import { GoogleMapLabel } from './google-label';
import { Polyline } from '../polyline';
/**
 * Concrete implementation for a polyline model for Google Maps.
 *
 * @export
 */
export class GooglePolyline extends Polyline {
    ///
    /// constructor
    ///
    /**
    * Creates an instance of GooglePolygon.
    * @param _polyline - The {@link GoogleMApTypes.Polyline} underlying the model.
    *
    * @memberof GooglePolyline
    */
    constructor(_polyline) {
        super();
        this._polyline = _polyline;
        ///
        /// Field declarations
        ///
        this._title = '';
        this._showTooltip = false;
        this._tooltip = null;
        this._tooltipVisible = false;
        this._hasToolTipReceiver = false;
        this._mouseOverListener = null;
        this._mouseOutListener = null;
        this._mouseMoveListener = null;
        this._metadata = new Map();
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets the polyline metadata.
     *
     * @readonly
     * @memberof GooglePolyline
     */
    get Metadata() { return this._metadata; }
    /**
     * Gets the native primitve implementing the marker, in this case {@link GoogleMApTypes.Polyline}
     *
     * @readonly
     * @memberof GooglePolygon
     */
    get NativePrimitve() { return this._polyline; }
    /**
     * Gets or sets whether to show the tooltip
     *
     * @abstract
     * @memberof GooglePolygon
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
     * @memberof GooglePolygon
     * @property
     */
    get Title() { return this._title; }
    set Title(val) {
        this._title = val;
        this.ManageTooltip();
    }
    /**
     * Adds a delegate for an event.
     *
     * @param eventType - String containing the event name.
     * @param fn - Delegate function to execute when the event occurs.
     * @memberof Polyline
     */
    AddListener(eventType, fn) {
        const supportedEvents = [
            'click',
            'dblclick',
            'drag', 'dragend',
            'dragstart',
            'mousedown',
            'mousemove',
            'mouseout',
            'mouseover',
            'mouseup',
            'rightclick'
        ];
        if (supportedEvents.indexOf(eventType) !== -1) {
            this._polyline.addListener(eventType, fn);
        }
    }
    /**
     * Deleted the polyline.
     *
     *
     * @memberof Polyline
     */
    Delete() {
        this._polyline.setMap(null);
        if (this._tooltip) {
            this._tooltip.Delete();
        }
    }
    /**
     * Gets whether the polyline is draggable.
     *
     * @returns - True if the polyline is dragable, false otherwise.
     *
     * @memberof Polyline
     */
    GetDraggable() {
        return this._polyline.getDraggable();
    }
    /**
     * Gets whether the polyline path can be edited.
     *
     * @returns - True if the path can be edited, false otherwise.
     *
     * @memberof Polyline
     */
    GetEditable() {
        return this._polyline.getEditable();
    }
    /**
     * Gets the polyline path.
     *
     * @returns - Array of {@link ILatLong} objects describing the polyline path.
     *
     * @memberof Polyline
     */
    GetPath() {
        const p = this._polyline.getPath();
        const path = new Array();
        p.forEach(x => path.push({ latitude: x.lat(), longitude: x.lng() }));
        return path;
    }
    /**
     * Gets whether the polyline is visible.
     *
     * @returns - True if the polyline is visible, false otherwise.
     *
     * @memberof Polyline
     */
    GetVisible() {
        return this._polyline.getVisible();
    }
    /**
     * Sets whether the polyline is dragable.
     *
     * @param draggable - True to make the polyline dragable, false otherwise.
     *
     * @memberof Polyline
     */
    SetDraggable(draggable) {
        this._polyline.setDraggable(draggable);
    }
    /**
     * Sets wether the polyline path is editable.
     *
     * @param editable - True to make polyline path editable, false otherwise.
     *
     * @memberof Polyline
     */
    SetEditable(editable) {
        this._polyline.setEditable(editable);
    }
    /**
     * Sets the polyline options
     *
     * @param options - {@link ILatLong} object containing the options. The options are merged with hte ones
     * already on the underlying model.
     *
     * @memberof Polyline
     */
    SetOptions(options) {
        const o = GoogleConversions.TranslatePolylineOptions(options);
        this._polyline.setOptions(o);
        if (options.path) {
            this.SetPath(options.path);
        }
    }
    /**
     * Sets the polyline path.
     *
     * @param path - An Array of {@link ILatLong} (or array of arrays) describing the polylines path.
     *
     * @memberof Polyline
     */
    SetPath(path) {
        const p = new Array();
        path.forEach(x => p.push(new google.maps.LatLng(x.latitude, x.longitude)));
        this._polyline.setPath(p);
    }
    /**
     * Sets whether the polyline is visible.
     *
     * @param visible - True to set the polyline visible, false otherwise.
     *
     * @memberof Polyline
     */
    SetVisible(visible) {
        this._polyline.setVisible(visible);
    }
    ///
    /// Private methods
    ///
    /**
     * Configures the tooltip for the polyline
     * @memberof GooglePolyline
     */
    ManageTooltip() {
        if (this._showTooltip && this._title != null && this._title !== '') {
            const o = {
                text: this._title,
                align: 'left',
                offset: new google.maps.Point(0, 25),
                backgroundColor: 'bisque',
                hidden: true,
                fontSize: 12,
                fontColor: '#000000',
                strokeWeight: 0
            };
            if (this._tooltip == null) {
                o.map = this.NativePrimitve.getMap();
                o.zIndex = 100000;
                this._tooltip = new GoogleMapLabel(o);
            }
            else {
                this._tooltip.SetValues(o);
            }
            if (!this._hasToolTipReceiver) {
                this._mouseOverListener = this.NativePrimitve.addListener('mouseover', (e) => {
                    this._tooltip.Set('position', e.latLng);
                    if (!this._tooltipVisible) {
                        this._tooltip.Set('hidden', false);
                        this._tooltipVisible = true;
                    }
                });
                this._mouseMoveListener = this.NativePrimitve.addListener('mousemove', (e) => {
                    if (this._tooltipVisible) {
                        this._tooltip.Set('position', e.latLng);
                    }
                });
                this._mouseOutListener = this.NativePrimitve.addListener('mouseout', (e) => {
                    if (this._tooltipVisible) {
                        this._tooltip.Set('hidden', true);
                        this._tooltipVisible = false;
                    }
                });
                this._hasToolTipReceiver = true;
            }
        }
        if ((!this._showTooltip || this._title === '' || this._title == null)) {
            if (this._hasToolTipReceiver) {
                if (this._mouseOutListener) {
                    google.maps.event.removeListener(this._mouseOutListener);
                }
                if (this._mouseOverListener) {
                    google.maps.event.removeListener(this._mouseOverListener);
                }
                if (this._mouseMoveListener) {
                    google.maps.event.removeListener(this._mouseMoveListener);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLXBvbHlsaW5lLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL21vZGVscy9nb29nbGUvZ29vZ2xlLXBvbHlsaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLDBDQUEwQyxDQUFDO0FBRTdFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUNoRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBSXZDOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sY0FBZSxTQUFRLFFBQVE7SUE2RHhDLEdBQUc7SUFDSCxlQUFlO0lBQ2YsR0FBRztJQUVGOzs7OztNQUtFO0lBQ0gsWUFBb0IsU0FBa0M7UUFDbEQsS0FBSyxFQUFFLENBQUM7UUFEUSxjQUFTLEdBQVQsU0FBUyxDQUF5QjtRQXJFdEQsR0FBRztRQUNILHNCQUFzQjtRQUN0QixHQUFHO1FBQ0ssV0FBTSxHQUFXLEVBQUUsQ0FBQztRQUNwQixpQkFBWSxHQUFZLEtBQUssQ0FBQztRQUM5QixhQUFRLEdBQW1CLElBQUksQ0FBQztRQUNoQyxvQkFBZSxHQUFZLEtBQUssQ0FBQztRQUNqQyx3QkFBbUIsR0FBWSxLQUFLLENBQUM7UUFDckMsdUJBQWtCLEdBQXFDLElBQUksQ0FBQztRQUM1RCxzQkFBaUIsR0FBcUMsSUFBSSxDQUFDO1FBQzNELHVCQUFrQixHQUFxQyxJQUFJLENBQUM7UUFDNUQsY0FBUyxHQUFxQixJQUFJLEdBQUcsRUFBZSxDQUFDO0lBNEQ3RCxDQUFDO0lBMURELEdBQUc7SUFDSCx5QkFBeUI7SUFDekIsR0FBRztJQUVIOzs7OztPQUtHO0lBQ0gsSUFBVyxRQUFRLEtBQXVCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFFbEU7Ozs7O09BS0c7SUFDSCxJQUFXLGNBQWMsS0FBOEIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJ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Li4vaW50ZXJmYWNlcy9pbGF0bG9uZyc7XG5pbXBvcnQgeyBJUG9seWxpbmVPcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pcG9seWxpbmUtb3B0aW9ucyc7XG5pbXBvcnQgeyBHb29nbGVDb252ZXJzaW9ucyB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2dvb2dsZS9nb29nbGUtY29udmVyc2lvbnMnO1xuaW1wb3J0ICogYXMgR29vZ2xlTWFwVHlwZXMgZnJvbSAnLi4vLi4vc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1tYXAtdHlwZXMnO1xuaW1wb3J0IHsgR29vZ2xlTWFwTGFiZWwgfSBmcm9tICcuL2dvb2dsZS1sYWJlbCc7XG5pbXBvcnQgeyBQb2x5bGluZSB9IGZyb20gJy4uL3BvbHlsaW5lJztcblxuZGVjbGFyZSB2YXIgZ29vZ2xlOiBhbnk7XG5cbi8qKlxuICogQ29uY3JldGUgaW1wbGVtZW50YXRpb24gZm9yIGEgcG9seWxpbmUgbW9kZWwgZm9yIEdvb2dsZSBNYXBzLlxuICpcbiAqIEBleHBvcnRcbiAqL1xuZXhwb3J0IGNsYXNzIEdvb2dsZVBvbHlsaW5lIGV4dGVuZHMgUG9seWxpbmUgaW1wbGVtZW50cyBQb2x5bGluZSB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVjbGFyYXRpb25zXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfdGl0bGU6IHN0cmluZyA9ICcnO1xuICAgIHByaXZhdGUgX3Nob3dUb29sdGlwOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfdG9vbHRpcDogR29vZ2xlTWFwTGFiZWwgPSBudWxsO1xuICAgIHByaXZhdGUgX3Rvb2x0aXBWaXNpYmxlOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfaGFzVG9vbFRpcFJlY2VpdmVyOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfbW91c2VPdmVyTGlzdGVuZXI6IEdvb2dsZU1hcFR5cGVzLk1hcHNFdmVudExpc3RlbmVyID0gbnVsbDtcbiAgICBwcml2YXRlIF9tb3VzZU91dExpc3RlbmVyOiBHb29nbGVNYXBUeXBlcy5NYXBzRXZlbnRMaXN0ZW5lciA9IG51bGw7XG4gICAgcHJpdmF0ZSBfbW91c2VNb3ZlTGlzdGVuZXI6IEdvb2dsZU1hcFR5cGVzLk1hcHNFdmVudExpc3RlbmVyID0gbnVsbDtcbiAgICBwcml2YXRlIF9tZXRhZGF0YTogTWFwPHN0cmluZywgYW55PiA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XG5cbiAgICAvLy9cbiAgICAvLy8gUHJvcGVydHkgZGVjbGFyYXRpb25zXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBwb2x5bGluZSBtZXRhZGF0YS5cbiAgICAgKlxuICAgICAqIEByZWFkb25seVxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVQb2x5bGluZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgTWV0YWRhdGEoKTogTWFwPHN0cmluZywgYW55PiB7IHJldHVybiB0aGlzLl9tZXRhZGF0YTsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbmF0aXZlIHByaW1pdHZlIGltcGxlbWVudGluZyB0aGUgbWFya2VyLCBpbiB0aGlzIGNhc2Uge0BsaW5rIEdvb2dsZU1BcFR5cGVzLlBvbHlsaW5lfVxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIEdvb2dsZVBvbHlnb25cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IE5hdGl2ZVByaW1pdHZlKCk6IEdvb2dsZU1hcFR5cGVzLlBvbHlsaW5lIHsgcmV0dXJuIHRoaXMuX3BvbHlsaW5lOyB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciB0byBzaG93IHRoZSB0b29sdGlwXG4gICAgICpcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlUG9seWdvblxuICAgICAqIEBwcm9wZXJ0eVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgU2hvd1Rvb2x0aXAoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9zaG93VG9vbHRpcDsgfVxuICAgIHB1YmxpYyBzZXQgU2hvd1Rvb2x0aXAodmFsOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuX3Nob3dUb29sdGlwID0gdmFsO1xuICAgICAgICB0aGlzLk1hbmFnZVRvb2x0aXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIG9yIHNldHMgdGhlIHRpdGxlIG9mZiB0aGUgcG9seWdvblxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQG1lbWJlcm9mIEdvb2dsZVBvbHlnb25cbiAgICAgKiBAcHJvcGVydHlcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IFRpdGxlKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLl90aXRsZTsgfVxuICAgIHB1YmxpYyBzZXQgVGl0bGUodmFsOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fdGl0bGUgPSB2YWw7XG4gICAgICAgIHRoaXMuTWFuYWdlVG9vbHRpcCgpO1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBjb25zdHJ1Y3RvclxuICAgIC8vL1xuXG4gICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgR29vZ2xlUG9seWdvbi5cbiAgICAgKiBAcGFyYW0gX3BvbHlsaW5lIC0gVGhlIHtAbGluayBHb29nbGVNQXBUeXBlcy5Qb2x5bGluZX0gdW5kZXJseWluZyB0aGUgbW9kZWwuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlUG9seWxpbmVcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9wb2x5bGluZTogR29vZ2xlTWFwVHlwZXMuUG9seWxpbmUpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgZGVsZWdhdGUgZm9yIGFuIGV2ZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGV2ZW50VHlwZSAtIFN0cmluZyBjb250YWluaW5nIHRoZSBldmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSBmbiAtIERlbGVnYXRlIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgZXZlbnQgb2NjdXJzLlxuICAgICAqIEBtZW1iZXJvZiBQb2x5bGluZVxuICAgICAqL1xuICAgIHB1YmxpYyBBZGRMaXN0ZW5lcihldmVudFR5cGU6IHN0cmluZywgZm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHN1cHBvcnRlZEV2ZW50cyA9IFtcbiAgICAgICAgICAgICdjbGljaycsXG4gICAgICAgICAgICAnZGJsY2xpY2snLFxuICAgICAgICAgICAgJ2RyYWcnLCAnZHJhZ2VuZCcsXG4gICAgICAgICAgICAnZHJhZ3N0YXJ0JyxcbiAgICAgICAgICAgICdtb3VzZWRvd24nLFxuICAgICAgICAgICAgJ21vdXNlbW92ZScsXG4gICAgICAgICAgICAnbW91c2VvdXQnLFxuICAgICAgICAgICAgJ21vdXNlb3ZlcicsXG4gICAgICAgICAgICAnbW91c2V1cCcsXG4gICAgICAgICAgICAncmlnaHRjbGljaydcbiAgICAgICAgXTtcbiAgICAgICAgaWYgKHN1cHBvcnRlZEV2ZW50cy5pbmRleE9mKGV2ZW50VHlwZSkgIT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLl9wb2x5bGluZS5hZGRMaXN0ZW5lcihldmVudFR5cGUsIGZuKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZWQgdGhlIHBvbHlsaW5lLlxuICAgICAqXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgUG9seWxpbmVcbiAgICAgKi9cbiAgICBwdWJsaWMgRGVsZXRlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLl9wb2x5bGluZS5zZXRNYXAobnVsbCk7XG4gICAgICAgIGlmICh0aGlzLl90b29sdGlwKSB7IHRoaXMuX3Rvb2x0aXAuRGVsZXRlKCk7IH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHdoZXRoZXIgdGhlIHBvbHlsaW5lIGlzIGRyYWdnYWJsZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIC0gVHJ1ZSBpZiB0aGUgcG9seWxpbmUgaXMgZHJhZ2FibGUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBQb2x5bGluZVxuICAgICAqL1xuICAgIHB1YmxpYyBHZXREcmFnZ2FibGUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wb2x5bGluZS5nZXREcmFnZ2FibGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHdoZXRoZXIgdGhlIHBvbHlsaW5lIHBhdGggY2FuIGJlIGVkaXRlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIC0gVHJ1ZSBpZiB0aGUgcGF0aCBjYW4gYmUgZWRpdGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgUG9seWxpbmVcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0RWRpdGFibGUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wb2x5bGluZS5nZXRFZGl0YWJsZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIHBvbHlsaW5lIHBhdGguXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyAtIEFycmF5IG9mIHtAbGluayBJTGF0TG9uZ30gb2JqZWN0cyBkZXNjcmliaW5nIHRoZSBwb2x5bGluZSBwYXRoLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIFBvbHlsaW5lXG4gICAgICovXG4gICAgcHVibGljIEdldFBhdGgoKTogQXJyYXk8SUxhdExvbmc+IHtcbiAgICAgICAgY29uc3QgcDogQXJyYXk8R29vZ2xlTWFwVHlwZXMuTGF0TG5nPiA9IHRoaXMuX3BvbHlsaW5lLmdldFBhdGgoKTtcbiAgICAgICAgY29uc3QgcGF0aDogQXJyYXk8SUxhdExvbmc+ID0gbmV3IEFycmF5PElMYXRMb25nPigpO1xuICAgICAgICBwLmZvckVhY2goeCA9PiBwYXRoLnB1c2goeyBsYXRpdHVkZTogeC5sYXQoKSwgbG9uZ2l0dWRlOiB4LmxuZygpIH0pKTtcbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB3aGV0aGVyIHRoZSBwb2x5bGluZSBpcyB2aXNpYmxlLlxuICAgICAqXG4gICAgICogQHJldHVybnMgLSBUcnVlIGlmIHRoZSBwb2x5bGluZSBpcyB2aXNpYmxlLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgUG9seWxpbmVcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0VmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BvbHlsaW5lLmdldFZpc2libGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHdoZXRoZXIgdGhlIHBvbHlsaW5lIGlzIGRyYWdhYmxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGRyYWdnYWJsZSAtIFRydWUgdG8gbWFrZSB0aGUgcG9seWxpbmUgZHJhZ2FibGUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBQb2x5bGluZVxuICAgICAqL1xuICAgIHB1YmxpYyBTZXREcmFnZ2FibGUoZHJhZ2dhYmxlOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3BvbHlsaW5lLnNldERyYWdnYWJsZShkcmFnZ2FibGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgd2V0aGVyIHRoZSBwb2x5bGluZSBwYXRoIGlzIGVkaXRhYmxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVkaXRhYmxlIC0gVHJ1ZSB0byBtYWtlIHBvbHlsaW5lIHBhdGggZWRpdGFibGUsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBQb2x5bGluZVxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRFZGl0YWJsZShlZGl0YWJsZTogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICB0aGlzLl9wb2x5bGluZS5zZXRFZGl0YWJsZShlZGl0YWJsZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgcG9seWxpbmUgb3B0aW9uc1xuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSB7QGxpbmsgSUxhdExvbmd9IG9iamVjdCBjb250YWluaW5nIHRoZSBvcHRpb25zLiBUaGUgb3B0aW9ucyBhcmUgbWVyZ2VkIHdpdGggaHRlIG9uZXNcbiAgICAgKiBhbHJlYWR5IG9uIHRoZSB1bmRlcmx5aW5nIG1vZGVsLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIFBvbHlsaW5lXG4gICAgICovXG4gICAgcHVibGljIFNldE9wdGlvbnMob3B0aW9uczogSVBvbHlsaW5lT3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBjb25zdCBvOiBHb29nbGVNYXBUeXBlcy5Qb2x5bGluZU9wdGlvbnMgPSBHb29nbGVDb252ZXJzaW9ucy5UcmFuc2xhdGVQb2x5bGluZU9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX3BvbHlsaW5lLnNldE9wdGlvbnMobyk7XG4gICAgICAgIGlmIChvcHRpb25zLnBhdGgpIHtcbiAgICAgICAgICAgIHRoaXMuU2V0UGF0aCg8QXJyYXk8SUxhdExvbmc+Pm9wdGlvbnMucGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBwb2x5bGluZSBwYXRoLlxuICAgICAqXG4gICAgICogQHBhcmFtIHBhdGggLSBBbiBBcnJheSBvZiB7QGxpbmsgSUxhdExvbmd9IChvciBhcnJheSBvZiBhcnJheXMpIGRlc2NyaWJpbmcgdGhlIHBvbHlsaW5lcyBwYXRoLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIFBvbHlsaW5lXG4gICAgICovXG4gICAgcHVibGljIFNldFBhdGgocGF0aDogQXJyYXk8SUxhdExvbmc+KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHA6IEFycmF5PEdvb2dsZU1hcFR5cGVzLkxhdExuZz4gPSBuZXcgQXJyYXk8R29vZ2xlTWFwVHlwZXMuTGF0TG5nPigpO1xuICAgICAgICBwYXRoLmZvckVhY2goeCA9PiBwLnB1c2gobmV3IGdvb2dsZS5tYXBzLkxhdExuZyh4LmxhdGl0dWRlLCB4LmxvbmdpdHVkZSkpKTtcbiAgICAgICAgdGhpcy5fcG9seWxpbmUuc2V0UGF0aChwKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHdoZXRoZXIgdGhlIHBvbHlsaW5lIGlzIHZpc2libGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdmlzaWJsZSAtIFRydWUgdG8gc2V0IHRoZSBwb2x5bGluZSB2aXNpYmxlLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgUG9seWxpbmVcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0VmlzaWJsZSh2aXNpYmxlOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX3BvbHlsaW5lLnNldFZpc2libGUodmlzaWJsZSk7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFByaXZhdGUgbWV0aG9kc1xuICAgIC8vL1xuICAgIC8qKlxuICAgICAqIENvbmZpZ3VyZXMgdGhlIHRvb2x0aXAgZm9yIHRoZSBwb2x5bGluZVxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVQb2x5bGluZVxuICAgICAqL1xuICAgIHByaXZhdGUgTWFuYWdlVG9vbHRpcCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuX3Nob3dUb29sdGlwICYmIHRoaXMuX3RpdGxlICE9IG51bGwgJiYgdGhpcy5fdGl0bGUgIT09ICcnKSB7XG4gICAgICAgICAgICBjb25zdCBvOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge1xuICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMuX3RpdGxlLFxuICAgICAgICAgICAgICAgIGFsaWduOiAnbGVmdCcsXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoMCwgMjUpLFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ2Jpc3F1ZScsXG4gICAgICAgICAgICAgICAgaGlkZGVuOiB0cnVlLFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAxMixcbiAgICAgICAgICAgICAgICBmb250Q29sb3I6ICcjMDAwMDAwJyxcbiAgICAgICAgICAgICAgICBzdHJva2VXZWlnaHQ6IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAodGhpcy5fdG9vbHRpcCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgby5tYXAgPSB0aGlzLk5hdGl2ZVByaW1pdHZlLmdldE1hcCgpO1xuICAgICAgICAgICAgICAgIG8uekluZGV4ID0gMTAwMDAwO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAgPSBuZXcgR29vZ2xlTWFwTGFiZWwobyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwLlNldFZhbHVlcyhvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5faGFzVG9vbFRpcFJlY2VpdmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbW91c2VPdmVyTGlzdGVuZXIgPSB0aGlzLk5hdGl2ZVByaW1pdHZlLmFkZExpc3RlbmVyKCdtb3VzZW92ZXInLCAoZTogR29vZ2xlTWFwVHlwZXMuTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwLlNldCgncG9zaXRpb24nLCBlLmxhdExuZyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5fdG9vbHRpcFZpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAuU2V0KCdoaWRkZW4nLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl90b29sdGlwVmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3VzZU1vdmVMaXN0ZW5lciA9IHRoaXMuTmF0aXZlUHJpbWl0dmUuYWRkTGlzdGVuZXIoJ21vdXNlbW92ZScsIChlOiBHb29nbGVNYXBUeXBlcy5Nb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl90b29sdGlwVmlzaWJsZSkgeyB0aGlzLl90b29sdGlwLlNldCgncG9zaXRpb24nLCBlLmxhdExuZyk7IH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3VzZU91dExpc3RlbmVyID0gdGhpcy5OYXRpdmVQcmltaXR2ZS5hZGRMaXN0ZW5lcignbW91c2VvdXQnLCAoZTogR29vZ2xlTWFwVHlwZXMuTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fdG9vbHRpcFZpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXAuU2V0KCdoaWRkZW4nLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3Rvb2x0aXBWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYXNUb29sVGlwUmVjZWl2ZXIgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICgoIXRoaXMuX3Nob3dUb29sdGlwIHx8IHRoaXMuX3RpdGxlID09PSAnJyB8fCB0aGlzLl90aXRsZSA9PSBudWxsKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2hhc1Rvb2xUaXBSZWNlaXZlcikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9tb3VzZU91dExpc3RlbmVyKSB7IGdvb2dsZS5tYXBzLmV2ZW50LnJlbW92ZUxpc3RlbmVyKHRoaXMuX21vdXNlT3V0TGlzdGVuZXIpOyB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX21vdXNlT3Zlckxpc3RlbmVyKSB7IGdvb2dsZS5tYXBzLmV2ZW50LnJlbW92ZUxpc3RlbmVyKHRoaXMuX21vdXNlT3Zlckxpc3RlbmVyKTsgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9tb3VzZU1vdmVMaXN0ZW5lcikgeyBnb29nbGUubWFwcy5ldmVudC5yZW1vdmVMaXN0ZW5lcih0aGlzLl9tb3VzZU1vdmVMaXN0ZW5lcik7IH1cbiAgICAgICAgICAgICAgICB0aGlzLl9oYXNUb29sVGlwUmVjZWl2ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl90b29sdGlwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdG9vbHRpcC5TZXRNYXAobnVsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdG9vbHRpcCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn1cbiJdfQ==