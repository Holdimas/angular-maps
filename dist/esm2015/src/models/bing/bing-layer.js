import { eachSeries, nextTick } from 'async';
/**
 * Concrete implementation of a map layer for the Bing Map Provider.
 *
 * @export
 */
export class BingLayer {
    ///
    /// Constructor
    ///
    /**
     * Creates a new instance of the BingClusterLayer class.
     *
     * @param _layer Microsoft.Maps.ClusterLayer. Native Bing Cluster Layer supporting the cluster layer.
     * @param _maps MapService. MapService implementation to leverage for the layer.
     *
     * @memberof BingLayer
     */
    constructor(_layer, _maps) {
        this._layer = _layer;
        this._maps = _maps;
        this._pendingEntities = new Array();
    }
    ///
    /// Property definitions
    ///
    /**
     * Get the native primitive underneath the abstraction layer.
     *
     * @returns Microsoft.Maps.Layer.
     *
     * @memberof BingLayer
     */
    get NativePrimitve() {
        return this._layer;
    }
    ///
    /// Public methods, Layer interface implementation
    ///
    /**
     * Adds an event listener for the layer.
     *
     * @param eventType string. Type of event to add (click, mouseover, etc). You can use any event that the underlying native
     * layer supports.
     * @param fn function. Handler to call when the event occurs.
     *
     * @memberof BingLayer
     */
    AddListener(eventType, fn) {
        Microsoft.Maps.Events.addHandler(this._layer, eventType, (e) => {
            fn(e);
        });
    }
    /**
     * Adds an entity to the layer.
     *
     * @param entity Marker|InfoWindow|Polygon|Polyline. Entity to add to the layer.
     *
     * @memberof BingLayer
     */
    AddEntity(entity) {
        if (entity && entity.NativePrimitve) {
            if (this.GetVisible()) {
                this._layer.add(entity.NativePrimitve);
            }
            else {
                this._pendingEntities.push(entity);
            }
        }
    }
    /**
     * Adds a number of entities to the layer. Entities in this context should be model abstractions of concered map functionality (such
     * as marker, infowindow, polyline, polygon, etc..)
     *
     * @param entities Array<Marker|InfoWindow|Polygon|Polyline>. Entities to add to the layer.
     *
     * @memberof BingLayer
     */
    AddEntities(entities) {
        //
        // use eachSeries as opposed to _layer.add([]) to provide a non-blocking experience for larger data sets.
        //
        if (entities != null && Array.isArray(entities) && entities.length !== 0) {
            eachSeries([...entities], (e, next) => {
                if (this.GetVisible()) {
                    this._layer.add(e.NativePrimitve);
                }
                else {
                    this._pendingEntities.push(e);
                }
                nextTick(() => next());
            });
        }
    }
    /**
     * Deletes the layer.
     *
     * @memberof BingLayer
     */
    Delete() {
        this._maps.DeleteLayer(this);
    }
    /**
     * Returns the options governing the behavior of the layer.
     *
     * @returns IClusterOptions. The layer options.
     *
     * @memberof BingLayer
     */
    GetOptions() {
        const o = {
            id: Number(this._layer.getId())
        };
        return o;
    }
    /**
     * Returns the visibility state of the layer.
     *
     * @returns Boolean. True is the layer is visible, false otherwise.
     *
     * @memberof BingLayer
     */
    GetVisible() {
        return this._layer.getVisible();
    }
    /**
     * Removes an entity from the cluster layer.
     *
     * @param entity Marker|InfoWindow|Polygon|Polyline to be removed from the layer.
     *
     * @memberof BingLayer
     */
    RemoveEntity(entity) {
        if (entity.NativePrimitve) {
            this._layer.remove(entity.NativePrimitve);
        }
    }
    /**
     * Sets the entities for the cluster layer.
     *
     * @param entities Array<Marker>|Array<InfoWindow>|Array<Polygon>|Array<Polyline> containing the entities to add to the cluster.
     * This replaces any existing entities.
     *
     * @memberof BingLayer
     */
    SetEntities(entities) {
        //
        // we are using removal and add as opposed to set as for large number of objects it yields a non-blocking, smoother performance...
        //
        this._layer.setPrimitives([]);
        this.AddEntities(entities);
    }
    /**
     * Sets the options for the cluster layer.
     *
     * @param options IClusterOptions containing the options enumeration controlling the layer behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof BingLayer
     */
    SetOptions(options) {
        this._layer.metadata.id = options.id.toString();
    }
    /**
     * Toggles the cluster layer visibility.
     *
     * @param visible Boolean true to make the layer visible, false to hide the layer.
     *
     * @memberof BingLayer
     */
    SetVisible(visible) {
        this._layer.setVisible(visible);
        if (visible && this._pendingEntities.length > 0) {
            this.AddEntities(this._pendingEntities.splice(0));
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1sYXllci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9tb2RlbHMvYmluZy9iaW5nLWxheWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBVTdDOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sU0FBUztJQW1CbEIsR0FBRztJQUNILGVBQWU7SUFDZixHQUFHO0lBRUg7Ozs7Ozs7T0FPRztJQUNILFlBQW9CLE1BQTRCLEVBQVUsS0FBaUI7UUFBdkQsV0FBTSxHQUFOLE1BQU0sQ0FBc0I7UUFBVSxVQUFLLEdBQUwsS0FBSyxDQUFZO1FBN0JuRSxxQkFBZ0IsR0FBOEMsSUFBSSxLQUFLLEVBQXNDLENBQUM7SUE2QnZDLENBQUM7SUEzQmhGLEdBQUc7SUFDSCx3QkFBd0I7SUFDeEIsR0FBRztJQUVIOzs7Ozs7T0FNRztJQUNILElBQVcsY0FBYztRQUNyQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDdkIsQ0FBQztJQWlCRCxHQUFHO0lBQ0gsa0RBQWtEO0lBQ2xELEdBQUc7SUFFSDs7Ozs7Ozs7T0FRRztJQUNJLFdBQVcsQ0FBQyxTQUFpQixFQUFFLEVBQVk7UUFDOUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDM0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1YsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksU0FBUyxDQUFDLE1BQTBDO1FBQ3ZELElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxjQUFjLEVBQUU7WUFDakMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUU7Z0JBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUMxQztpQkFDSTtnQkFDRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3RDO1NBQ0o7SUFDTCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLFdBQVcsQ0FBQyxRQUFtRDtRQUNsRSxFQUFFO1FBQ0YseUdBQXlHO1FBQ3pHLEVBQUU7UUFDRixJQUFJLFFBQVEsSUFBSSxJQUFJLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRztZQUN2RSxVQUFVLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFO2dCQUNsQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRTtvQkFDbkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2lCQUNyQztxQkFDSTtvQkFDRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNqQztnQkFDRCxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMzQixDQUFDLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxNQUFNO1FBQ1QsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLFVBQVU7UUFDYixNQUFNLENBQUMsR0FBa0I7WUFDckIsRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ2xDLENBQUM7UUFDRixPQUFPLENBQUMsQ0FBQztJQUNiLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSxVQUFVO1FBQ2IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSxZQUFZLENBQUMsTUFBMEM7UUFDMUQsSUFBSSxNQUFNLENBQUMsY0FBYyxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUM3QztJQUNMLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksV0FBVyxDQUFDLFFBQXdFO1FBQ3ZGLEVBQUU7UUFDRixrSUFBa0k7UUFDbEksRUFBRTtRQUNGLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlCLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFL0IsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxVQUFVLENBQUMsT0FBc0I7UUFDcEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDcEQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNJLFVBQVUsQ0FBQyxPQUFnQjtRQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxJQUFJLE9BQU8sSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUM3QyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNyRDtJQUNMLENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGVhY2hTZXJpZXMsIG5leHRUaWNrIH0gZnJvbSAnYXN5bmMnO1xuaW1wb3J0IHsgSUxheWVyT3B0aW9ucyB9IGZyb20gJy4uLy4uL2ludGVyZmFjZXMvaWxheWVyLW9wdGlvbnMnO1xuaW1wb3J0IHsgTGF5ZXIgfSBmcm9tICcuLi9sYXllcic7XG5pbXBvcnQgeyBNYXJrZXIgfSBmcm9tICcuLi9tYXJrZXInO1xuaW1wb3J0IHsgUG9seWdvbiB9IGZyb20gJy4uL3BvbHlnb24nO1xuaW1wb3J0IHsgUG9seWxpbmUgfSBmcm9tICcuLi9wb2x5bGluZSc7XG5pbXBvcnQgeyBJbmZvV2luZG93IH0gZnJvbSAnLi4vaW5mby13aW5kb3cnO1xuaW1wb3J0IHsgQmluZ01hcFNlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9iaW5nL2JpbmctbWFwLnNlcnZpY2UnO1xuaW1wb3J0IHsgTWFwU2VydmljZX0gZnJvbSAnLi4vLi4vc2VydmljZXMvbWFwLnNlcnZpY2UnO1xuXG4vKipcbiAqIENvbmNyZXRlIGltcGxlbWVudGF0aW9uIG9mIGEgbWFwIGxheWVyIGZvciB0aGUgQmluZyBNYXAgUHJvdmlkZXIuXG4gKlxuICogQGV4cG9ydFxuICovXG5leHBvcnQgY2xhc3MgQmluZ0xheWVyIGltcGxlbWVudHMgTGF5ZXIge1xuXG4gICAgcHJpdmF0ZSBfcGVuZGluZ0VudGl0aWVzOiBBcnJheTxNYXJrZXJ8SW5mb1dpbmRvd3xQb2x5Z29ufFBvbHlsaW5lPiA9IG5ldyBBcnJheTxNYXJrZXJ8SW5mb1dpbmRvd3xQb2x5Z29ufFBvbHlsaW5lPigpO1xuXG4gICAgLy8vXG4gICAgLy8vIFByb3BlcnR5IGRlZmluaXRpb25zXG4gICAgLy8vXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIG5hdGl2ZSBwcmltaXRpdmUgdW5kZXJuZWF0aCB0aGUgYWJzdHJhY3Rpb24gbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBNaWNyb3NvZnQuTWFwcy5MYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTGF5ZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IE5hdGl2ZVByaW1pdHZlKCk6IGFueSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sYXllcjtcbiAgICB9XG5cbiAgICAvLy9cbiAgICAvLy8gQ29uc3RydWN0b3JcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIEJpbmdDbHVzdGVyTGF5ZXIgY2xhc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gX2xheWVyIE1pY3Jvc29mdC5NYXBzLkNsdXN0ZXJMYXllci4gTmF0aXZlIEJpbmcgQ2x1c3RlciBMYXllciBzdXBwb3J0aW5nIHRoZSBjbHVzdGVyIGxheWVyLlxuICAgICAqIEBwYXJhbSBfbWFwcyBNYXBTZXJ2aWNlLiBNYXBTZXJ2aWNlIGltcGxlbWVudGF0aW9uIHRvIGxldmVyYWdlIGZvciB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0xheWVyXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbGF5ZXI6IE1pY3Jvc29mdC5NYXBzLkxheWVyLCBwcml2YXRlIF9tYXBzOiBNYXBTZXJ2aWNlKSB7IH1cblxuXG4gICAgLy8vXG4gICAgLy8vIFB1YmxpYyBtZXRob2RzLCBMYXllciBpbnRlcmZhY2UgaW1wbGVtZW50YXRpb25cbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgZm9yIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBldmVudFR5cGUgc3RyaW5nLiBUeXBlIG9mIGV2ZW50IHRvIGFkZCAoY2xpY2ssIG1vdXNlb3ZlciwgZXRjKS4gWW91IGNhbiB1c2UgYW55IGV2ZW50IHRoYXQgdGhlIHVuZGVybHlpbmcgbmF0aXZlXG4gICAgICogbGF5ZXIgc3VwcG9ydHMuXG4gICAgICogQHBhcmFtIGZuIGZ1bmN0aW9uLiBIYW5kbGVyIHRvIGNhbGwgd2hlbiB0aGUgZXZlbnQgb2NjdXJzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdMYXllclxuICAgICAqL1xuICAgIHB1YmxpYyBBZGRMaXN0ZW5lcihldmVudFR5cGU6IHN0cmluZywgZm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgICAgIE1pY3Jvc29mdC5NYXBzLkV2ZW50cy5hZGRIYW5kbGVyKHRoaXMuX2xheWVyLCBldmVudFR5cGUsIChlKSA9PiB7XG4gICAgICAgICAgICBmbihlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhbiBlbnRpdHkgdG8gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVudGl0eSBNYXJrZXJ8SW5mb1dpbmRvd3xQb2x5Z29ufFBvbHlsaW5lLiBFbnRpdHkgdG8gYWRkIHRvIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTGF5ZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgQWRkRW50aXR5KGVudGl0eTogTWFya2VyfEluZm9XaW5kb3d8UG9seWdvbnxQb2x5bGluZSk6IHZvaWQge1xuICAgICAgICBpZiAoZW50aXR5ICYmIGVudGl0eS5OYXRpdmVQcmltaXR2ZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuR2V0VmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGF5ZXIuYWRkKGVudGl0eS5OYXRpdmVQcmltaXR2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wZW5kaW5nRW50aXRpZXMucHVzaChlbnRpdHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIG51bWJlciBvZiBlbnRpdGllcyB0byB0aGUgbGF5ZXIuIEVudGl0aWVzIGluIHRoaXMgY29udGV4dCBzaG91bGQgYmUgbW9kZWwgYWJzdHJhY3Rpb25zIG9mIGNvbmNlcmVkIG1hcCBmdW5jdGlvbmFsaXR5IChzdWNoXG4gICAgICogYXMgbWFya2VyLCBpbmZvd2luZG93LCBwb2x5bGluZSwgcG9seWdvbiwgZXRjLi4pXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZW50aXRpZXMgQXJyYXk8TWFya2VyfEluZm9XaW5kb3d8UG9seWdvbnxQb2x5bGluZT4uIEVudGl0aWVzIHRvIGFkZCB0byB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0xheWVyXG4gICAgICovXG4gICAgcHVibGljIEFkZEVudGl0aWVzKGVudGl0aWVzOiBBcnJheTxNYXJrZXJ8SW5mb1dpbmRvd3xQb2x5Z29ufFBvbHlsaW5lPik6IHZvaWQge1xuICAgICAgICAvL1xuICAgICAgICAvLyB1c2UgZWFjaFNlcmllcyBhcyBvcHBvc2VkIHRvIF9sYXllci5hZGQoW10pIHRvIHByb3ZpZGUgYSBub24tYmxvY2tpbmcgZXhwZXJpZW5jZSBmb3IgbGFyZ2VyIGRhdGEgc2V0cy5cbiAgICAgICAgLy9cbiAgICAgICAgaWYgKGVudGl0aWVzICE9IG51bGwgJiYgQXJyYXkuaXNBcnJheShlbnRpdGllcykgJiYgZW50aXRpZXMubGVuZ3RoICE9PSAwICkge1xuICAgICAgICAgICAgZWFjaFNlcmllcyhbLi4uZW50aXRpZXNdLCAoZSwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLkdldFZpc2libGUoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXllci5hZGQoZS5OYXRpdmVQcmltaXR2ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wZW5kaW5nRW50aXRpZXMucHVzaChlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV4dFRpY2soKCkgPT4gbmV4dCgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVsZXRlcyB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0xheWVyXG4gICAgICovXG4gICAgcHVibGljIERlbGV0ZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbWFwcy5EZWxldGVMYXllcih0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBvcHRpb25zIGdvdmVybmluZyB0aGUgYmVoYXZpb3Igb2YgdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQHJldHVybnMgSUNsdXN0ZXJPcHRpb25zLiBUaGUgbGF5ZXIgb3B0aW9ucy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTGF5ZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgR2V0T3B0aW9ucygpOiBJTGF5ZXJPcHRpb25zIHtcbiAgICAgICAgY29uc3QgbzogSUxheWVyT3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGlkOiBOdW1iZXIodGhpcy5fbGF5ZXIuZ2V0SWQoKSlcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIG87XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdmlzaWJpbGl0eSBzdGF0ZSBvZiB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBCb29sZWFuLiBUcnVlIGlzIHRoZSBsYXllciBpcyB2aXNpYmxlLCBmYWxzZSBvdGhlcndpc2UuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0xheWVyXG4gICAgICovXG4gICAgcHVibGljIEdldFZpc2libGUoKTogYm9vbGVhbiAge1xuICAgICAgICByZXR1cm4gdGhpcy5fbGF5ZXIuZ2V0VmlzaWJsZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYW4gZW50aXR5IGZyb20gdGhlIGNsdXN0ZXIgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZW50aXR5IE1hcmtlcnxJbmZvV2luZG93fFBvbHlnb258UG9seWxpbmUgdG8gYmUgcmVtb3ZlZCBmcm9tIHRoZSBsYXllci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTGF5ZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgUmVtb3ZlRW50aXR5KGVudGl0eTogTWFya2VyfEluZm9XaW5kb3d8UG9seWdvbnxQb2x5bGluZSk6IHZvaWQge1xuICAgICAgICBpZiAoZW50aXR5Lk5hdGl2ZVByaW1pdHZlKSB7XG4gICAgICAgICAgICB0aGlzLl9sYXllci5yZW1vdmUoZW50aXR5Lk5hdGl2ZVByaW1pdHZlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGVudGl0aWVzIGZvciB0aGUgY2x1c3RlciBsYXllci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbnRpdGllcyBBcnJheTxNYXJrZXI+fEFycmF5PEluZm9XaW5kb3c+fEFycmF5PFBvbHlnb24+fEFycmF5PFBvbHlsaW5lPiBjb250YWluaW5nIHRoZSBlbnRpdGllcyB0byBhZGQgdG8gdGhlIGNsdXN0ZXIuXG4gICAgICogVGhpcyByZXBsYWNlcyBhbnkgZXhpc3RpbmcgZW50aXRpZXMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgQmluZ0xheWVyXG4gICAgICovXG4gICAgcHVibGljIFNldEVudGl0aWVzKGVudGl0aWVzOiBBcnJheTxNYXJrZXI+fEFycmF5PEluZm9XaW5kb3c+fEFycmF5PFBvbHlnb24+fEFycmF5PFBvbHlsaW5lPik6IHZvaWQge1xuICAgICAgICAvL1xuICAgICAgICAvLyB3ZSBhcmUgdXNpbmcgcmVtb3ZhbCBhbmQgYWRkIGFzIG9wcG9zZWQgdG8gc2V0IGFzIGZvciBsYXJnZSBudW1iZXIgb2Ygb2JqZWN0cyBpdCB5aWVsZHMgYSBub24tYmxvY2tpbmcsIHNtb290aGVyIHBlcmZvcm1hbmNlLi4uXG4gICAgICAgIC8vXG4gICAgICAgIHRoaXMuX2xheWVyLnNldFByaW1pdGl2ZXMoW10pO1xuICAgICAgICB0aGlzLkFkZEVudGl0aWVzKGVudGl0aWVzKTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIG9wdGlvbnMgZm9yIHRoZSBjbHVzdGVyIGxheWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgSUNsdXN0ZXJPcHRpb25zIGNvbnRhaW5pbmcgdGhlIG9wdGlvbnMgZW51bWVyYXRpb24gY29udHJvbGxpbmcgdGhlIGxheWVyIGJlaGF2aW9yLiBUaGUgc3VwcGxpZWQgb3B0aW9uc1xuICAgICAqIGFyZSBtZXJnZWQgd2l0aCB0aGUgZGVmYXVsdC9leGlzdGluZyBvcHRpb25zLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdMYXllclxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRPcHRpb25zKG9wdGlvbnM6IElMYXllck9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fbGF5ZXIubWV0YWRhdGEuaWQgPSBvcHRpb25zLmlkLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlcyB0aGUgY2x1c3RlciBsYXllciB2aXNpYmlsaXR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHZpc2libGUgQm9vbGVhbiB0cnVlIHRvIG1ha2UgdGhlIGxheWVyIHZpc2libGUsIGZhbHNlIHRvIGhpZGUgdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdMYXllclxuICAgICAqL1xuICAgIHB1YmxpYyBTZXRWaXNpYmxlKHZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fbGF5ZXIuc2V0VmlzaWJsZSh2aXNpYmxlKTtcbiAgICAgICAgaWYgKHZpc2libGUgJiYgdGhpcy5fcGVuZGluZ0VudGl0aWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuQWRkRW50aXRpZXModGhpcy5fcGVuZGluZ0VudGl0aWVzLnNwbGljZSgwKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cbiJdfQ==