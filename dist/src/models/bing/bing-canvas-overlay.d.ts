import { ILatLong } from '../../interfaces/ilatlong';
import { CanvasOverlay } from '../canvas-overlay';
import { MapLabel } from '../map-label';
/**
 * Concrete implementing a canvas overlay to be placed on the map for Bing Maps.
 *
 * @export
 */
export declare class BingCanvasOverlay extends CanvasOverlay {
    private _viewChangeEvent;
    private _viewChangeEndEvent;
    private _mapResizeEvent;
    /**
     * Creates a new instance of the BingCanvasOverlay class.
     * @param drawCallback A callback function that is triggered when the canvas is ready to be
     * rendered for the current map view.
     * @memberof BingCanvasOverlay
     */
    constructor(drawCallback: (canvas: HTMLCanvasElement) => void);
    /**
     * Obtains geo coordinates for the click location
     *
     * @abstract
     * @param e - The mouse event. Expected to implement {@link Microsoft.Maps.IMouseEventArgs}.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     * @memberof BingCanvasOverlay
     */
    GetCoordinatesFromClick(e: Microsoft.Maps.IMouseEventArgs): ILatLong;
    /**
     * Gets the map associted with the label.
     *
     * @memberof BingCanvasOverlay
     * @method
     */
    GetMap(): Microsoft.Maps.Map;
    /**
     * Returns a MapLabel instance for the current platform that can be used as a tooltip.
     * This method only generates the map label. Content and placement is the responsibility
     * of the caller. Note that this method returns null until OnLoad has been called.
     *
     * @returns - The label to be used for the tooltip.
     * @memberof BingCanvasOverlay
     * @method
     */
    GetToolTipOverlay(): MapLabel;
    /**
     * CanvasOverlay loaded, attach map events for updating canvas.
     * @abstract
     * @method
     * @memberof BingCanvasOverlay
     */
    OnLoad(): void;
    /**
     * Sets the map for the label. Settings this to null remove the label from hte map.
     *
     * @param map - Map to associated with the label.
     * @memberof CanvasOverlay
     * @method
     */
    SetMap(map: Microsoft.Maps.Map): void;
    /**
     * Attaches the canvas to the map.
     * @memberof CanvasOverlay
     * @method
     */
    protected SetCanvasElement(el: HTMLCanvasElement): void;
    /**
     * Remove the map event handlers.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    protected RemoveEventHandlers(): void;
    /**
     * Updates the Canvas size based on the map size.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    protected Resize(): void;
    /**
     * Updates the Canvas.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    protected UpdateCanvas(): void;
}
/**
 * Helper function to extend the OverlayView into the CanvasOverlay
 *
 * @export
 * @method
 */
export declare function MixinCanvasOverlay(): void;
