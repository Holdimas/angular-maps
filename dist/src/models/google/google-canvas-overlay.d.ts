import { ILatLong } from '../../interfaces/ilatlong';
import { CanvasOverlay } from '../canvas-overlay';
import { MapLabel } from '../map-label';
import * as GoogleMapTypes from '../../services/google/google-map-types';
/**
 * Concrete implementing a canvas overlay to be placed on the map for Google Maps.
 *
 * @export
 */
export declare class GoogleCanvasOverlay extends CanvasOverlay {
    private _viewChangeEndEvent;
    private _mapResizeEvent;
    /**
     * Creates a new instance of the GoogleCanvasOverlay class.
     * @param drawCallback A callback function that is triggered when the canvas is ready to be
     * rendered for the current map view.
     * @memberof GoogleCanvasOverlay
     */
    constructor(drawCallback: (canvas: HTMLCanvasElement) => void);
    /**
     * Obtains geo coordinates for the click location
     *
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     * @memberof GoogleCanvasOverlay
     */
    GetCoordinatesFromClick(e: GoogleMapTypes.MouseEvent): ILatLong;
    /**
     * Gets the map associted with the label.
     *
     * @memberof GoogleCanvasOverlay
     * @method
     */
    GetMap(): GoogleMapTypes.GoogleMap;
    /**
     * Returns a MapLabel instance for the current platform that can be used as a tooltip.
     * This method only generates the map label. Content and placement is the responsibility
     * of the caller.
     *
     * @returns - The label to be used for the tooltip.
     * @memberof GoogleCanvasOverlay
     * @method
     */
    GetToolTipOverlay(): MapLabel;
    /**
     * Called when the custom overlay is added to the map. Triggers Onload....
     * @memberof GoogleCanvasOverlay
     */
    OnAdd(): void;
    /**
     * Called whenever the canvas needs to be redrawn. This method does not do the actual
     * update, it simply scales the canvas. The actual redraw happens once the map is idle.
     * @memberof GoogleCanvasOverly
     * @method
     */
    OnDraw(): void;
    /**
     * CanvasOverlay loaded, attach map events for updating canvas.
     * @method
     * @memberof GoogleCanvasOverlay
     */
    OnLoad(): void;
    /**
     * Associates the cnavas overlay with a map.
     * @method
     * @memberof GoogleCanvasOverlay
     */
    SetMap(map: GoogleMapTypes.GoogleMap): void;
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
