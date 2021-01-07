import { MapLabel } from '../map-label';
import { Extender } from '../extender';
let id = 0;
/**
 * Implements map a labled to be placed on the map.
 *
 * @export
 */
export class BingMapLabel extends MapLabel {
    /**
     * Returns the default label style for the platform
     *
     * @readonly
     * @abstract
     * @memberof BingMapLabel
     */
    get DefaultLabelStyle() {
        return {
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontColor: '#ffffff',
            strokeWeight: 2,
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
        options.strokeWeight = options.strokeWeight || 2;
        options.strokeColor = options.strokeColor || '#000000';
        super(options);
        this._options.beneathLabels = false;
    }
    ///
    /// Public methods
    ///
    /**
     * Gets the value of a setting.
     *
     * @param key - Key specifying the setting.
     * @returns - The value of the setting.
     * @memberof BingMapLabel
     * @method
     */
    Get(key) {
        return this[key];
    }
    /**
     * Gets the map associted with the label.
     *
     * @memberof BingMapLabel
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
     * @memberof BingMapLabel
     * @method
     */
    Set(key, val) {
        if (key === 'position' && !val.hasOwnProperty('altitude') && val.hasOwnProperty('latitude') && val.hasOwnProperty('longitude')) {
            val = new Microsoft.Maps.Location(val.latitude, val.longitude);
        }
        if (this.Get(key) !== val) {
            this[key] = val;
            this.Changed(key);
        }
    }
    /**
     * Sets the map for the label. Settings this to null remove the label from hte map.
     *
     * @param map - Map to associated with the label.
     * @memberof BingMapLabel
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
    /**
     * Applies settings to the object
     *
     * @param options - An object containing the settings key value pairs.
     * @memberof BingMapLabel
     * @method
     */
    SetValues(options) {
        const p = new Array();
        for (const key in options) {
            if (key !== '') {
                if (key === 'position' && !options[key].hasOwnProperty('altitude') &&
                    options[key].hasOwnProperty('latitude') && options[key].hasOwnProperty('longitude')) {
                    options[key] = new Microsoft.Maps.Location(options[key].latitude, options[key].longitude);
                }
                if (this.Get(key) !== options[key]) {
                    this[key] = options[key];
                    p.push(key);
                }
            }
        }
        if (p.length > 0) {
            this.Changed(p);
        }
    }
    ///
    /// Protected methods
    ///
    /**
     * Draws the label on the map.
     * @memberof BingMapLabel
     * @method
     * @protected
     */
    Draw() {
        const visibility = this.GetVisible();
        const m = this.GetMap();
        if (!this._canvas) {
            return;
        }
        if (!m) {
            return;
        }
        const style = this._canvas.style;
        if (visibility !== '') {
            // label is not visible, don't calculate positions etc.
            style['visibility'] = visibility;
            return;
        }
        let offset = this.Get('offset');
        const latLng = this.Get('position');
        if (!latLng) {
            return;
        }
        if (!offset) {
            offset = new Microsoft.Maps.Point(0, 0);
        }
        const pos = m.tryLocationToPixel(latLng, Microsoft.Maps.PixelReference.control);
        style['top'] = (pos.y + offset.y) + 'px';
        style['left'] = (pos.x + offset.x) + 'px';
        style['visibility'] = visibility;
    }
    /**
     * Delegate called when the label is added to the map. Generates and configures
     * the canvas.
     *
     * @memberof BingMapLabel
     * @method
     * @protected
     */
    OnAdd() {
        this._canvas = document.createElement('canvas');
        this._canvas.id = `xMapLabel${id++}`;
        const style = this._canvas.style;
        style.position = 'absolute';
        const ctx = this._canvas.getContext('2d');
        ctx.lineJoin = 'round';
        ctx.textBaseline = 'top';
        this.setHtmlElement(this._canvas);
    }
    ///
    /// Private methods
    ///
    /**
     * Delegate callled when the label is loaded
     * @memberof BingMapLabel
     * @method
     */
    OnLoad() {
        Microsoft.Maps.Events.addHandler(this.GetMap(), 'viewchange', () => {
            this.Changed('position');
        });
        this.DrawCanvas();
        this.Draw();
    }
}
/**
 * Helper function to extend the CustomOverlay into the MapLabel
 *
 * @export
 * @method
 */
export function MixinMapLabelWithOverlayView() {
    new Extender(BingMapLabel)
        .Extend(new Microsoft.Maps.CustomOverlay())
        .Map('onAdd', 'OnAdd')
        .Map('onLoad', 'OnLoad')
        .Map('onRemove', 'OnRemove');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1sYWJlbC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9tb2RlbHMvYmluZy9iaW5nLWxhYmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDeEMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUV2QyxJQUFJLEVBQUUsR0FBVyxDQUFDLENBQUM7QUFFbkI7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxZQUFhLFNBQVEsUUFBUTtJQUV0Qzs7Ozs7O09BTUc7SUFDSCxJQUFXLGlCQUFpQjtRQUN4QixPQUFPO1lBQ0gsUUFBUSxFQUFFLEVBQUU7WUFDWixVQUFVLEVBQUUsWUFBWTtZQUN4QixTQUFTLEVBQUUsU0FBUztZQUNwQixZQUFZLEVBQUUsQ0FBQztZQUNmLFdBQVcsRUFBRSxTQUFTO1NBQ3pCLENBQUM7SUFDTixDQUFDO0lBRUQsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7OztPQUdHO0lBQ0gsWUFBWSxPQUErQjtRQUN2QyxPQUFPLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO1FBQzFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUM7UUFDbkQsT0FBTyxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQztRQUNqRCxPQUFPLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLElBQUksU0FBUyxDQUFDO1FBQ3ZELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNULElBQUssQ0FBQyxRQUFRLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztJQUMvQyxDQUFDO0lBRUQsR0FBRztJQUNILGtCQUFrQjtJQUNsQixHQUFHO0lBRUg7Ozs7Ozs7T0FPRztJQUNJLEdBQUcsQ0FBQyxHQUFXO1FBQ2xCLE9BQWEsSUFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLE1BQU07UUFDVCxPQUFhLElBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBUTtRQUM1QixJQUFJLEdBQUcsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUM1SCxHQUFHLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNsRTtRQUNELElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDakIsSUFBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3JCO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLE1BQU0sQ0FBQyxHQUF1QjtRQUNqQyxNQUFNLENBQUMsR0FBdUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzVDLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRTtZQUFFLE9BQU87U0FBRTtRQUMxQixJQUFJLENBQUMsRUFBRTtZQUNILENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3pCO1FBQ0QsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFO1lBQ2IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0I7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksU0FBUyxDQUFDLE9BQStCO1FBQzVDLE1BQU0sQ0FBQyxHQUFrQixJQUFJLEtBQUssRUFBVSxDQUFDO1FBQzdDLEtBQUssTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFO1lBQ3ZCLElBQUksR0FBRyxLQUFLLEVBQUUsRUFBRTtnQkFDWixJQUFJLEdBQUcsS0FBSyxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQztvQkFDOUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxFQUFFO29CQUNyRixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDN0Y7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFDMUIsSUFBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDaEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDZjthQUNKO1NBQ0o7UUFDRCxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUFFO0lBQzFDLENBQUM7SUFFRCxHQUFHO0lBQ0gscUJBQXFCO0lBQ3JCLEdBQUc7SUFFSDs7Ozs7T0FLRztJQUNPLElBQUk7UUFDVixNQUFNLFVBQVUsR0FBVyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDN0MsTUFBTSxDQUFDLEdBQXVCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUM1QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUFFLE9BQU87U0FBRTtRQUM5QixJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQUUsT0FBTztTQUFFO1FBQ25CLE1BQU0sS0FBSyxHQUF3QixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUN0RCxJQUFJLFVBQVUsS0FBSyxFQUFFLEVBQUU7WUFDbkIsdURBQXVEO1lBQ3ZELEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxVQUFVLENBQUM7WUFDakMsT0FBTztTQUNWO1FBRUQsSUFBSSxNQUFNLEdBQXlCLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEQsTUFBTSxNQUFNLEdBQTRCLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUFFLE9BQU87U0FBRTtRQUN4QixJQUFJLENBQUMsTUFBTSxFQUFFO1lBQUUsTUFBTSxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQUU7UUFFekQsTUFBTSxHQUFHLEdBQStDLENBQUMsQ0FBQyxrQkFBa0IsQ0FDeEUsTUFBTSxFQUNOLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUN6QyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDMUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLFVBQVUsQ0FBQztJQUNyQyxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNPLEtBQUs7UUFDWCxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsWUFBWSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQ3JDLE1BQU0sS0FBSyxHQUF3QixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUN0RCxLQUFLLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztRQUU1QixNQUFNLEdBQUcsR0FBNkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEUsR0FBRyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFDdkIsR0FBRyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFFbkIsSUFBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELEdBQUc7SUFDSCxtQkFBbUI7SUFDbkIsR0FBRztJQUVIOzs7O09BSUc7SUFDSyxNQUFNO1FBQ1YsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQy9ELElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2hCLENBQUM7Q0FDSjtBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLDRCQUE0QjtJQUN4QyxJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUM7U0FDekIsTUFBTSxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztTQUMxQyxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztTQUNyQixHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQztTQUN2QixHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ2pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCaW5nTWFwU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2JpbmcvYmluZy1tYXAuc2VydmljZSc7XG5pbXBvcnQgeyBCaW5nQ29udmVyc2lvbnMgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9iaW5nL2JpbmctY29udmVyc2lvbnMnO1xuaW1wb3J0IHsgSUxhYmVsT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWxhYmVsLW9wdGlvbnMnO1xuaW1wb3J0IHsgTWFwTGFiZWwgfSBmcm9tICcuLi9tYXAtbGFiZWwnO1xuaW1wb3J0IHsgRXh0ZW5kZXIgfSBmcm9tICcuLi9leHRlbmRlcic7XG5cbmxldCBpZDogbnVtYmVyID0gMDtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIG1hcCBhIGxhYmxlZCB0byBiZSBwbGFjZWQgb24gdGhlIG1hcC5cbiAqXG4gKiBAZXhwb3J0XG4gKi9cbmV4cG9ydCBjbGFzcyBCaW5nTWFwTGFiZWwgZXh0ZW5kcyBNYXBMYWJlbCB7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBkZWZhdWx0IGxhYmVsIHN0eWxlIGZvciB0aGUgcGxhdGZvcm1cbiAgICAgKlxuICAgICAqIEByZWFkb25seVxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwTGFiZWxcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IERlZmF1bHRMYWJlbFN0eWxlKCk6IElMYWJlbE9wdGlvbnMge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZm9udFNpemU6IDEyLFxuICAgICAgICAgICAgZm9udEZhbWlseTogJ3NhbnMtc2VyaWYnLFxuICAgICAgICAgICAgZm9udENvbG9yOiAnI2ZmZmZmZicsXG4gICAgICAgICAgICBzdHJva2VXZWlnaHQ6IDIsXG4gICAgICAgICAgICBzdHJva2VDb2xvcjogJyMwMDAwMDAnXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIENvbnN0cnVjdG9yXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IE1hcExhYmVsXG4gICAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgcHJvcGVydGllcyB0byBzZXQuXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSkge1xuICAgICAgICBvcHRpb25zLmZvbnRTaXplID0gb3B0aW9ucy5mb250U2l6ZSB8fCAxMjtcbiAgICAgICAgb3B0aW9ucy5mb250Q29sb3IgPSBvcHRpb25zLmZvbnRDb2xvciB8fCAnI2ZmZmZmZic7XG4gICAgICAgIG9wdGlvbnMuc3Ryb2tlV2VpZ2h0ID0gb3B0aW9ucy5zdHJva2VXZWlnaHQgfHwgMjtcbiAgICAgICAgb3B0aW9ucy5zdHJva2VDb2xvciA9IG9wdGlvbnMuc3Ryb2tlQ29sb3IgfHwgJyMwMDAwMDAnO1xuICAgICAgICBzdXBlcihvcHRpb25zKTtcbiAgICAgICAgKDxhbnk+dGhpcykuX29wdGlvbnMuYmVuZWF0aExhYmVscyA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQdWJsaWMgbWV0aG9kc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgdmFsdWUgb2YgYSBzZXR0aW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIGtleSAtIEtleSBzcGVjaWZ5aW5nIHRoZSBzZXR0aW5nLlxuICAgICAqIEByZXR1cm5zIC0gVGhlIHZhbHVlIG9mIHRoZSBzZXR0aW5nLlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwTGFiZWxcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHVibGljIEdldChrZXk6IHN0cmluZyk6IGFueSB7XG4gICAgICAgIHJldHVybiAoPGFueT50aGlzKVtrZXldO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIG1hcCBhc3NvY2l0ZWQgd2l0aCB0aGUgbGFiZWwuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcExhYmVsXG4gICAgICogQG1ldGhvZFxuICAgICAqL1xuICAgIHB1YmxpYyBHZXRNYXAoKTogTWljcm9zb2Z0Lk1hcHMuTWFwIHtcbiAgICAgICAgcmV0dXJuICg8YW55PnRoaXMpLmdldE1hcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdmFsdWUgZm9yIGEgc2V0dGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBrZXkgLSBLZXkgc3BlY2lmeWluZyB0aGUgc2V0dGluZy5cbiAgICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIHNldC5cbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcExhYmVsXG4gICAgICogQG1ldGhvZFxuICAgICAqL1xuICAgIHB1YmxpYyBTZXQoa2V5OiBzdHJpbmcsIHZhbDogYW55KTogdm9pZCB7XG4gICAgICAgIGlmIChrZXkgPT09ICdwb3NpdGlvbicgJiYgIXZhbC5oYXNPd25Qcm9wZXJ0eSgnYWx0aXR1ZGUnKSAmJiB2YWwuaGFzT3duUHJvcGVydHkoJ2xhdGl0dWRlJykgJiYgdmFsLmhhc093blByb3BlcnR5KCdsb25naXR1ZGUnKSkge1xuICAgICAgICAgICAgdmFsID0gbmV3IE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uKHZhbC5sYXRpdHVkZSwgdmFsLmxvbmdpdHVkZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuR2V0KGtleSkgIT09IHZhbCkge1xuICAgICAgICAgICAgKDxhbnk+dGhpcylba2V5XSA9IHZhbDtcbiAgICAgICAgICAgIHRoaXMuQ2hhbmdlZChrZXkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgbWFwIGZvciB0aGUgbGFiZWwuIFNldHRpbmdzIHRoaXMgdG8gbnVsbCByZW1vdmUgdGhlIGxhYmVsIGZyb20gaHRlIG1hcC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtYXAgLSBNYXAgdG8gYXNzb2NpYXRlZCB3aXRoIHRoZSBsYWJlbC5cbiAgICAgKiBAbWVtYmVyb2YgQmluZ01hcExhYmVsXG4gICAgICogQG1ldGhvZFxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRNYXAobWFwOiBNaWNyb3NvZnQuTWFwcy5NYXApOiB2b2lkIHtcbiAgICAgICAgY29uc3QgbTogTWljcm9zb2Z0Lk1hcHMuTWFwID0gdGhpcy5HZXRNYXAoKTtcbiAgICAgICAgaWYgKG1hcCA9PT0gbSkgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKG0pIHtcbiAgICAgICAgICAgIG0ubGF5ZXJzLnJlbW92ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFwICE9IG51bGwpIHtcbiAgICAgICAgICAgIG1hcC5sYXllcnMuaW5zZXJ0KHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXBwbGllcyBzZXR0aW5ncyB0byB0aGUgb2JqZWN0XG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBzZXR0aW5ncyBrZXkgdmFsdWUgcGFpcnMuXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBMYWJlbFxuICAgICAqIEBtZXRob2RcbiAgICAgKi9cbiAgICBwdWJsaWMgU2V0VmFsdWVzKG9wdGlvbnM6IHsgW2tleTogc3RyaW5nXTogYW55IH0pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgcDogQXJyYXk8c3RyaW5nPiA9IG5ldyBBcnJheTxzdHJpbmc+KCk7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChrZXkgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3Bvc2l0aW9uJyAmJiAhb3B0aW9uc1trZXldLmhhc093blByb3BlcnR5KCdhbHRpdHVkZScpICYmXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnNba2V5XS5oYXNPd25Qcm9wZXJ0eSgnbGF0aXR1ZGUnKSAmJiBvcHRpb25zW2tleV0uaGFzT3duUHJvcGVydHkoJ2xvbmdpdHVkZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnNba2V5XSA9IG5ldyBNaWNyb3NvZnQuTWFwcy5Mb2NhdGlvbihvcHRpb25zW2tleV0ubGF0aXR1ZGUsIG9wdGlvbnNba2V5XS5sb25naXR1ZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5HZXQoa2V5KSAhPT0gb3B0aW9uc1trZXldKSB7XG4gICAgICAgICAgICAgICAgICAgICg8YW55PnRoaXMpW2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgICAgICAgICAgICAgICAgIHAucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocC5sZW5ndGggPiAwKSB7IHRoaXMuQ2hhbmdlZChwKTsgfVxuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQcm90ZWN0ZWQgbWV0aG9kc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogRHJhd3MgdGhlIGxhYmVsIG9uIHRoZSBtYXAuXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBMYWJlbFxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgcHJvdGVjdGVkIERyYXcoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHZpc2liaWxpdHk6IHN0cmluZyA9IHRoaXMuR2V0VmlzaWJsZSgpO1xuICAgICAgICBjb25zdCBtOiBNaWNyb3NvZnQuTWFwcy5NYXAgPSB0aGlzLkdldE1hcCgpO1xuICAgICAgICBpZiAoIXRoaXMuX2NhbnZhcykgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKCFtKSB7IHJldHVybjsgfVxuICAgICAgICBjb25zdCBzdHlsZTogQ1NTU3R5bGVEZWNsYXJhdGlvbiA9IHRoaXMuX2NhbnZhcy5zdHlsZTtcbiAgICAgICAgaWYgKHZpc2liaWxpdHkgIT09ICcnKSB7XG4gICAgICAgICAgICAvLyBsYWJlbCBpcyBub3QgdmlzaWJsZSwgZG9uJ3QgY2FsY3VsYXRlIHBvc2l0aW9ucyBldGMuXG4gICAgICAgICAgICBzdHlsZVsndmlzaWJpbGl0eSddID0gdmlzaWJpbGl0eTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBvZmZzZXQ6IE1pY3Jvc29mdC5NYXBzLlBvaW50ID0gdGhpcy5HZXQoJ29mZnNldCcpO1xuICAgICAgICBjb25zdCBsYXRMbmc6IE1pY3Jvc29mdC5NYXBzLkxvY2F0aW9uID0gdGhpcy5HZXQoJ3Bvc2l0aW9uJyk7XG4gICAgICAgIGlmICghbGF0TG5nKSB7IHJldHVybjsgfVxuICAgICAgICBpZiAoIW9mZnNldCkgeyBvZmZzZXQgPSBuZXcgTWljcm9zb2Z0Lk1hcHMuUG9pbnQoMCwgMCk7IH1cblxuICAgICAgICBjb25zdCBwb3M6IE1pY3Jvc29mdC5NYXBzLlBvaW50ID0gPE1pY3Jvc29mdC5NYXBzLlBvaW50Pm0udHJ5TG9jYXRpb25Ub1BpeGVsKFxuICAgICAgICAgICAgbGF0TG5nLFxuICAgICAgICAgICAgTWljcm9zb2Z0Lk1hcHMuUGl4ZWxSZWZlcmVuY2UuY29udHJvbCk7XG4gICAgICAgIHN0eWxlWyd0b3AnXSA9IChwb3MueSArIG9mZnNldC55KSArICdweCc7XG4gICAgICAgIHN0eWxlWydsZWZ0J10gPSAocG9zLnggKyBvZmZzZXQueCkgKyAncHgnO1xuICAgICAgICBzdHlsZVsndmlzaWJpbGl0eSddID0gdmlzaWJpbGl0eTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWxlZ2F0ZSBjYWxsZWQgd2hlbiB0aGUgbGFiZWwgaXMgYWRkZWQgdG8gdGhlIG1hcC4gR2VuZXJhdGVzIGFuZCBjb25maWd1cmVzXG4gICAgICogdGhlIGNhbnZhcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwTGFiZWxcbiAgICAgKiBAbWV0aG9kXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBPbkFkZCgpIHtcbiAgICAgICAgdGhpcy5fY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHRoaXMuX2NhbnZhcy5pZCA9IGB4TWFwTGFiZWwke2lkKyt9YDtcbiAgICAgICAgY29uc3Qgc3R5bGU6IENTU1N0eWxlRGVjbGFyYXRpb24gPSB0aGlzLl9jYW52YXMuc3R5bGU7XG4gICAgICAgIHN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblxuICAgICAgICBjb25zdCBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCA9IHRoaXMuX2NhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICBjdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgICBjdHgudGV4dEJhc2VsaW5lID0gJ3RvcCc7XG5cbiAgICAgICAgKDxhbnk+dGhpcykuc2V0SHRtbEVsZW1lbnQodGhpcy5fY2FudmFzKTtcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gUHJpdmF0ZSBtZXRob2RzXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBEZWxlZ2F0ZSBjYWxsbGVkIHdoZW4gdGhlIGxhYmVsIGlzIGxvYWRlZFxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwTGFiZWxcbiAgICAgKiBAbWV0aG9kXG4gICAgICovXG4gICAgcHJpdmF0ZSBPbkxvYWQoKSB7XG4gICAgICAgIE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKHRoaXMuR2V0TWFwKCksICd2aWV3Y2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5DaGFuZ2VkKCdwb3NpdGlvbicpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5EcmF3Q2FudmFzKCk7XG4gICAgICAgIHRoaXMuRHJhdygpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gZXh0ZW5kIHRoZSBDdXN0b21PdmVybGF5IGludG8gdGhlIE1hcExhYmVsXG4gKlxuICogQGV4cG9ydFxuICogQG1ldGhvZFxuICovXG5leHBvcnQgZnVuY3Rpb24gTWl4aW5NYXBMYWJlbFdpdGhPdmVybGF5VmlldygpIHtcbiAgICBuZXcgRXh0ZW5kZXIoQmluZ01hcExhYmVsKVxuICAgIC5FeHRlbmQobmV3IE1pY3Jvc29mdC5NYXBzLkN1c3RvbU92ZXJsYXkoKSlcbiAgICAuTWFwKCdvbkFkZCcsICdPbkFkZCcpXG4gICAgLk1hcCgnb25Mb2FkJywgJ09uTG9hZCcpXG4gICAgLk1hcCgnb25SZW1vdmUnLCAnT25SZW1vdmUnKTtcbn1cbiJdfQ==