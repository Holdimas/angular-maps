import { MapLabel } from '../map-label';
import { Extender } from '../extender';
/**
 * Implements map a labled to be placed on the map.
 *
 * @export
 */
export class GoogleMapLabel extends MapLabel {
    /**
     * Returns the default label style for the platform
     *
     * @readonly
     * @abstract
     * @memberof GoogleMapLabel
     */
    get DefaultLabelStyle() {
        return {
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontColor: '#ffffff',
            strokeWeight: 3,
            strokeColor: '#000000'
        };
    }
    ///
    /// Constructor
    ///
    /**
     * Creates a new MapLabel
     * @param options Optional properties to set.
     */
    constructor(options) {
        options.fontSize = options.fontSize || 12;
        options.fontColor = options.fontColor || '#ffffff';
        options.strokeWeight = options.strokeWeight || 3;
        options.strokeColor = options.strokeColor || '#000000';
        super(options);
    }
    ///
    /// Public methods
    ///
    /**
     * Gets the value of a setting.
     *
     * @param key - Key specifying the setting.
     * @returns - The value of the setting.
     * @memberof MapLabel
     * @method
     */
    Get(key) {
        return this.get(key);
    }
    /**
     * Gets the map associted with the label.
     *
     * @memberof GoogleMapLabel
     * @method
     */
    GetMap() {
        return this.getMap();
    }
    /**
     * Set the value for a setting.
     *
     * @param key - Key specifying the setting.
     * @param val - The value to set.
     * @memberof MapLabel
     * @method
     */
    Set(key, val) {
        if (key === 'position' && val.hasOwnProperty('latitude') && val.hasOwnProperty('longitude')) {
            val = new google.maps.LatLng(val.latitude, val.longitude);
        }
        if (this.Get(key) !== val) {
            this.set(key, val);
        }
    }
    /**
     * Sets the map for the label. Settings this to null remove the label from hte map.
     *
     * @param map - Map to associated with the label.
     * @memberof GoogleMapLabel
     * @method
     */
    SetMap(map) {
        this.setMap(map);
    }
    /**
     * Applies settings to the object
     *
     * @param options - An object containing the settings key value pairs.
     * @memberof MapLabel
     * @method
     */
    SetValues(options) {
        for (const key in options) {
            if (key !== '') {
                if (key === 'position' && options[key].hasOwnProperty('latitude') && options[key].hasOwnProperty('longitude')) {
                    options[key] = new google.maps.LatLng(options[key].latitude, options[key].longitude);
                }
                if (this.Get(key) === options[key]) {
                    delete options[key];
                }
            }
        }
        this.setValues(options);
    }
    ///
    /// Protected methods
    ///
    /**
     * Draws the label on the map.
     * @memberof GoogleMapLabel
     * @method
     * @protected
     */
    Draw() {
        const projection = this.getProjection();
        const visibility = this.GetVisible();
        if (!projection) {
            // The map projection is not ready yet so do nothing
            return;
        }
        if (!this._canvas) {
            // onAdd has not been called yet.
            return;
        }
        const style = this._canvas.style;
        if (visibility !== '') {
            // label is not visible, don't calculate positions etc.
            style['visibility'] = visibility;
            return;
        }
        let offset = this.Get('offset');
        let latLng = this.Get('position');
        if (!latLng) {
            return;
        }
        if (!(latLng instanceof google.maps.LatLng)) {
            latLng = new google.maps.LatLng(latLng.lat, latLng.lng);
        }
        if (!offset) {
            offset = new google.maps.Point(0, 0);
        }
        const pos = projection.fromLatLngToDivPixel(latLng);
        style['top'] = (pos.y + offset.y) + 'px';
        style['left'] = (pos.x + offset.x) + 'px';
        style['visibility'] = visibility;
    }
    /**
     * Delegate called when the label is added to the map. Generates and configures
     * the canvas.
     *
     * @memberof GoogleMapLabel
     * @method
     * @protected
     */
    OnAdd() {
        this._canvas = document.createElement('canvas');
        const style = this._canvas.style;
        style.position = 'absolute';
        const ctx = this._canvas.getContext('2d');
        ctx.lineJoin = 'round';
        ctx.textBaseline = 'top';
        this.DrawCanvas();
        const panes = this.getPanes();
        if (panes) {
            panes.overlayLayer.appendChild(this._canvas);
            // 4: floatPane (infowindow)
            // 3: overlayMouseTarget (mouse events)
            // 2: markerLayer (marker images)
            // 1: overlayLayer (polygons, polylines, ground overlays, tile layer overlays)
            // 0: mapPane (lowest pane above the map tiles)
        }
    }
}
/**
 * Helper function to extend the OverlayView into the MapLabel
 *
 * @export
 * @method
 */
export function MixinMapLabelWithOverlayView() {
    new Extender(GoogleMapLabel)
        .Extend(new google.maps.OverlayView)
        .Map('changed', 'Changed')
        .Map('onAdd', 'OnAdd')
        .Map('draw', 'Draw')
        .Map('onRemove', 'OnRemove');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLWxhYmVsLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL21vZGVscy9nb29nbGUvZ29vZ2xlLWxhYmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFeEMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUt2Qzs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLGNBQWUsU0FBUSxRQUFRO0lBRXhDOzs7Ozs7T0FNRztJQUNILElBQVcsaUJBQWlCO1FBQ3hCLE9BQU87WUFDSCxRQUFRLEVBQUUsRUFBRTtZQUNaLFVBQVUsRUFBRSxZQUFZO1lBQ3hCLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLFlBQVksRUFBRSxDQUFDO1lBQ2YsV0FBVyxFQUFFLFNBQVM7U0FDekIsQ0FBQztJQUNOLENBQUM7SUFFRCxHQUFHO0lBQ0gsZUFBZTtJQUNmLEdBQUc7SUFFSDs7O09BR0c7SUFDSCxZQUFZLE9BQStCO1FBQ3ZDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7UUFDMUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQztRQUNuRCxPQUFPLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLElBQUksQ0FBQyxDQUFDO1FBQ2pELE9BQU8sQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsSUFBSSxTQUFTLENBQUM7UUFDdkQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCxHQUFHO0lBQ0gsa0JBQWtCO0lBQ2xCLEdBQUc7SUFFSDs7Ozs7OztPQU9HO0lBQ0ksR0FBRyxDQUFDLEdBQVc7UUFDbEIsT0FBYSxJQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLE1BQU07UUFD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QUFpQztZQUNqQyw4RUFBOEU7WUFDOUUsK0NBQStDO1NBQ3REO0lBQ0wsQ0FBQztDQUNKO0FBRUQ7Ozs7O0dBS0c7QUFHSCxNQUFNLFVBQVUsNEJBQTRCO0lBRXhDLElBQUksUUFBUSxDQUFDLGNBQWMsQ0FBQztTQUN2QixNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztTQUNuQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQztTQUN6QixHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztTQUNyQixHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztTQUNuQixHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBHb29nbGVNYXBUeXBlcyBmcm9tICcuLi8uLi9zZXJ2aWNlcy9nb29nbGUvZ29vZ2xlLW1hcC10eXBlcyc7XG5pbXBvcnQgeyBNYXBMYWJlbCB9IGZyb20gJy4uL21hcC1sYWJlbCc7XG5pbXBvcnQgeyBJTGFiZWxPcHRpb25zIH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcy9pbGFiZWwtb3B0aW9ucyc7XG5pbXBvcnQgeyBFeHRlbmRlciB9IGZyb20gJy4uL2V4dGVuZGVyJztcblxuXG5kZWNsYXJlIHZhciBnb29nbGU6IGFueTtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIG1hcCBhIGxhYmxlZCB0byBiZSBwbGFjZWQgb24gdGhlIG1hcC5cbiAqXG4gKiBAZXhwb3J0XG4gKi9cbmV4cG9ydCBjbGFzcyBHb29nbGVNYXBMYWJlbCBleHRlbmRzIE1hcExhYmVsIHtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGRlZmF1bHQgbGFiZWwgc3R5bGUgZm9yIHRoZSBwbGF0Zm9ybVxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQGFic3RyYWN0XG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcExhYmVsXG4gICAgICovXG4gICAgcHVibGljIGdldCBEZWZhdWx0TGFiZWxTdHlsZSgpOiBJTGFiZWxPcHRpb25zIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZvbnRTaXplOiAxMixcbiAgICAgICAgICAgIGZvbnRGYW1pbHk6ICdzYW5zLXNlcmlmJyxcbiAgICAgICAgICAgIGZvbnRDb2xvcjogJyNmZmZmZmYnLFxuICAgICAgICAgICAgc3Ryb2tlV2VpZ2h0OiAzLFxuICAgICAgICAgICAgc3Ryb2tlQ29sb3I6ICcjMDAwMDAwJ1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBDb25zdHJ1Y3RvclxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBNYXBMYWJlbFxuICAgICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbmFsIHByb3BlcnRpZXMgdG8gc2V0LlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IHsgW2tleTogc3RyaW5nXTogYW55IH0pIHtcbiAgICAgICAgb3B0aW9ucy5mb250U2l6ZSA9IG9wdGlvbnMuZm9udFNpemUgfHwgMTI7XG4gICAgICAgIG9wdGlvbnMuZm9udENvbG9yID0gb3B0aW9ucy5mb250Q29sb3IgfHwgJyNmZmZmZmYnO1xuICAgICAgICBvcHRpb25zLnN0cm9rZVdlaWdodCA9IG9wdGlvbnMuc3Ryb2tlV2VpZ2h0IHx8IDM7XG4gICAgICAgIG9wdGlvbnMuc3Ryb2tlQ29sb3IgPSBvcHRpb25zLnN0cm9rZUNvbG9yIHx8ICcjMDAwMDAwJztcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIHNldHRpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ga2V5IC0gS2V5IHNwZWNpZnlpbmcgdGhlIHNldHRpbmcuXG4gICAgICogQHJldHVybnMgLSBUaGUgdmFsdWUgb2YgdGhlIHNldHRpbmcuXG4gICAgICogQG1lbWJlcm9mIE1hcExhYmVsXG4gICAgICogQG1ldGhvZFxuICAgICAqL1xuICAgIHB1YmxpYyBHZXQoa2V5OiBzdHJpbmcpOiBhbnkge1xuICAgICAgICByZXR1cm4gKDxhbnk+dGhpcykuZ2V0KGtleSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbWFwIGFzc29jaXRlZCB3aXRoIHRoZSBsYWJlbC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXBMYWJlbFxuICAgICAqIEBtZXRob2RcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0TWFwKCk6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCB7XG4gICAgICAgIHJldHVybiAoPGFueT50aGlzKS5nZXRNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHZhbHVlIGZvciBhIHNldHRpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ga2V5IC0gS2V5IHNwZWNpZnlpbmcgdGhlIHNldHRpbmcuXG4gICAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXQuXG4gICAgICogQG1lbWJlcm9mIE1hcExhYmVsXG4gICAgICogQG1ldGhvZFxuICAgICAqL1xuICAgIHB1YmxpYyBTZXQoa2V5OiBzdHJpbmcsIHZhbDogYW55KTogdm9pZCB7XG4gICAgICAgIGlmIChrZXkgPT09ICdwb3NpdGlvbicgJiYgdmFsLmhhc093blByb3BlcnR5KCdsYXRpdHVkZScpICYmIHZhbC5oYXNPd25Qcm9wZXJ0eSgnbG9uZ2l0dWRlJykpIHtcbiAgICAgICAgICAgIHZhbCA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcodmFsLmxhdGl0dWRlLCB2YWwubG9uZ2l0dWRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5HZXQoa2V5KSAhPT0gdmFsKSB7XG4gICAgICAgICAgICAoPGFueT50aGlzKS5zZXQoa2V5LCB2YWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgbWFwIGZvciB0aGUgbGFiZWwuIFNldHRpbmdzIHRoaXMgdG8gbnVsbCByZW1vdmUgdGhlIGxhYmVsIGZyb20gaHRlIG1hcC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtYXAgLSBNYXAgdG8gYXNzb2NpYXRlZCB3aXRoIHRoZSBsYWJlbC5cbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwTGFiZWxcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIFNldE1hcChtYXA6IEdvb2dsZU1hcFR5cGVzLkdvb2dsZU1hcCk6IHZvaWQge1xuICAgICAgICAoPGFueT50aGlzKS5zZXRNYXAobWFwKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcHBsaWVzIHNldHRpbmdzIHRvIHRoZSBvYmplY3RcbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHNldHRpbmdzIGtleSB2YWx1ZSBwYWlycy5cbiAgICAgKiBAbWVtYmVyb2YgTWFwTGFiZWxcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIFNldFZhbHVlcyhvcHRpb25zOiB7IFtrZXk6IHN0cmluZ106IGFueSB9KTogdm9pZCB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChrZXkgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3Bvc2l0aW9uJyAmJiAgb3B0aW9uc1trZXldLmhhc093blByb3BlcnR5KCdsYXRpdHVkZScpICYmICBvcHRpb25zW2tleV0uaGFzT3duUHJvcGVydHkoJ2xvbmdpdHVkZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnNba2V5XSA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoIG9wdGlvbnNba2V5XS5sYXRpdHVkZSwgIG9wdGlvbnNba2V5XS5sb25naXR1ZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5HZXQoa2V5KSA9PT0gb3B0aW9uc1trZXldKSB7IGRlbGV0ZSBvcHRpb25zW2tleV07IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAoPGFueT50aGlzKS5zZXRWYWx1ZXMob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFByb3RlY3RlZCBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBEcmF3cyB0aGUgbGFiZWwgb24gdGhlIG1hcC5cbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwTGFiZWxcbiAgICAgKiBAbWV0aG9kXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBEcmF3KCk6IHZvaWQge1xuICAgICAgICBjb25zdCBwcm9qZWN0aW9uID0gKDxhbnk+dGhpcykuZ2V0UHJvamVjdGlvbigpO1xuICAgICAgICBjb25zdCB2aXNpYmlsaXR5OiBzdHJpbmcgPSB0aGlzLkdldFZpc2libGUoKTtcbiAgICAgICAgaWYgKCFwcm9qZWN0aW9uKSB7XG4gICAgICAgICAgICAvLyBUaGUgbWFwIHByb2plY3Rpb24gaXMgbm90IHJlYWR5IHlldCBzbyBkbyBub3RoaW5nXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9jYW52YXMpIHtcbiAgICAgICAgICAgIC8vIG9uQWRkIGhhcyBub3QgYmVlbiBjYWxsZWQgeWV0LlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0eWxlOiBDU1NTdHlsZURlY2xhcmF0aW9uID0gdGhpcy5fY2FudmFzLnN0eWxlO1xuICAgICAgICBpZiAodmlzaWJpbGl0eSAhPT0gJycpIHtcbiAgICAgICAgICAgIC8vIGxhYmVsIGlzIG5vdCB2aXNpYmxlLCBkb24ndCBjYWxjdWxhdGUgcG9zaXRpb25zIGV0Yy5cbiAgICAgICAgICAgIHN0eWxlWyd2aXNpYmlsaXR5J10gPSB2aXNpYmlsaXR5O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG9mZnNldDogR29vZ2xlTWFwVHlwZXMuUG9pbnQgPSB0aGlzLkdldCgnb2Zmc2V0Jyk7XG4gICAgICAgIGxldCBsYXRMbmc6IEdvb2dsZU1hcFR5cGVzLkxhdExuZ3xHb29nbGVNYXBUeXBlcy5MYXRMbmdMaXRlcmFsID0gdGhpcy5HZXQoJ3Bvc2l0aW9uJyk7XG4gICAgICAgIGlmICghbGF0TG5nKSB7IHJldHVybjsgfVxuICAgICAgICBpZiAoIShsYXRMbmcgaW5zdGFuY2VvZiBnb29nbGUubWFwcy5MYXRMbmcpKSB7IGxhdExuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcobGF0TG5nLmxhdCwgbGF0TG5nLmxuZyk7IH1cbiAgICAgICAgaWYgKCFvZmZzZXQpIHsgb2Zmc2V0ID0gbmV3IGdvb2dsZS5tYXBzLlBvaW50KDAsIDApOyB9XG5cbiAgICAgICAgY29uc3QgcG9zID0gcHJvamVjdGlvbi5mcm9tTGF0TG5nVG9EaXZQaXhlbChsYXRMbmcpO1xuICAgICAgICBzdHlsZVsndG9wJ10gPSAocG9zLnkgKyBvZmZzZXQueSkgKyAncHgnO1xuICAgICAgICBzdHlsZVsnbGVmdCddID0gKHBvcy54ICsgb2Zmc2V0LngpICsgJ3B4JztcbiAgICAgICAgc3R5bGVbJ3Zpc2liaWxpdHknXSA9IHZpc2liaWxpdHk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVsZWdhdGUgY2FsbGVkIHdoZW4gdGhlIGxhYmVsIGlzIGFkZGVkIHRvIHRoZSBtYXAuIEdlbmVyYXRlcyBhbmQgY29uZmlndXJlc1xuICAgICAqIHRoZSBjYW52YXMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwTGFiZWxcbiAgICAgKiBAbWV0aG9kXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBPbkFkZCgpIHtcbiAgICAgICAgdGhpcy5fY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlOiBDU1NTdHlsZURlY2xhcmF0aW9uID0gdGhpcy5fY2FudmFzLnN0eWxlO1xuICAgICAgICBzdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG5cbiAgICAgICAgY29uc3QgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgPSB0aGlzLl9jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICAgICAgY3R4LnRleHRCYXNlbGluZSA9ICd0b3AnO1xuXG4gICAgICAgIHRoaXMuRHJhd0NhbnZhcygpO1xuICAgICAgICBjb25zdCBwYW5lcyA9ICg8YW55PnRoaXMpLmdldFBhbmVzKCk7XG4gICAgICAgIGlmIChwYW5lcykge1xuICAgICAgICAgICAgcGFuZXMub3ZlcmxheUxheWVyLmFwcGVuZENoaWxkKHRoaXMuX2NhbnZhcyk7XG4gICAgICAgICAgICAgICAgLy8gNDogZmxvYXRQYW5lIChpbmZvd2luZG93KVxuICAgICAgICAgICAgICAgIC8vIDM6IG92ZXJsYXlNb3VzZVRhcmdldCAobW91c2UgZXZlbnRzKVxuICAgICAgICAgICAgICAgIC8vIDI6IG1hcmtlckxheWVyIChtYXJrZXIgaW1hZ2VzKVxuICAgICAgICAgICAgICAgIC8vIDE6IG92ZXJsYXlMYXllciAocG9seWdvbnMsIHBvbHlsaW5lcywgZ3JvdW5kIG92ZXJsYXlzLCB0aWxlIGxheWVyIG92ZXJsYXlzKVxuICAgICAgICAgICAgICAgIC8vIDA6IG1hcFBhbmUgKGxvd2VzdCBwYW5lIGFib3ZlIHRoZSBtYXAgdGlsZXMpXG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGV4dGVuZCB0aGUgT3ZlcmxheVZpZXcgaW50byB0aGUgTWFwTGFiZWxcbiAqXG4gKiBAZXhwb3J0XG4gKiBAbWV0aG9kXG4gKi9cblxuXG5leHBvcnQgZnVuY3Rpb24gTWl4aW5NYXBMYWJlbFdpdGhPdmVybGF5VmlldygpIHtcblxuICAgIG5ldyBFeHRlbmRlcihHb29nbGVNYXBMYWJlbClcbiAgICAgICAgLkV4dGVuZChuZXcgZ29vZ2xlLm1hcHMuT3ZlcmxheVZpZXcpXG4gICAgICAgIC5NYXAoJ2NoYW5nZWQnLCAnQ2hhbmdlZCcpXG4gICAgICAgIC5NYXAoJ29uQWRkJywgJ09uQWRkJylcbiAgICAgICAgLk1hcCgnZHJhdycsICdEcmF3JylcbiAgICAgICAgLk1hcCgnb25SZW1vdmUnLCAnT25SZW1vdmUnKTtcbn1cbiJdfQ==