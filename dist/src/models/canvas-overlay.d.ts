import { ILatLong } from '../interfaces/ilatlong';
import { MapLabel } from './map-label';
/**
 * Abstract base implementing a canvas overlay to be placed on the map.
 *
 * @export
 * @abstract
 */
export declare abstract class CanvasOverlay {
    protected _readyResolver: (val: boolean) => void;
    protected _canvas: HTMLCanvasElement;
    protected _zoomStart: number;
    protected _centerStart: ILatLong;
    _canvasReady: Promise<boolean>;
    /**
     * Returns a promise that gets resolved when the canvas overlay is ready for interaction.
     */
    get CanvasReady(): Promise<boolean>;
    /**
    * A callback function that is triggered when the canvas is ready to be rendered for the current map view.
    */
    private _drawCallback;
    /**
     * Creates a new instance of the CanvasOverlay class.
     */
    constructor(drawCallback: (canvas: HTMLCanvasElement) => void);
    /**
     * Deletes the canvas overlay.
     */
    Delete(): void;
    /**
     * Obtains geo coordinates for the click location
     */
    abstract GetCoordinatesFromClick(e: any): ILatLong;
    /**
     * Gets the map associted with the label.
     */
    abstract GetMap(): any;
    /**
     * Returns a MapLabel instance for the current platform that can be used as a tooltip.
     * This method only generates the map label. Content and placement is the responsibility
     * of the caller.
     */
    abstract GetToolTipOverlay(): MapLabel;
    /**
     * CanvasOverlay added to map, load canvas.
     */
    OnAdd(): void;
    /**
     * CanvasOverlay loaded, attach map events for updating canvas.
     * @abstract
     * @method
     * @memberof CanvasOverlay
     */
    abstract OnLoad(): void;
    /**
     * When the CanvasLayer is removed from the map, release resources.
     * @memberof CanvasOverlay
     * @method
     */
    OnRemove(): void;
    /**
     * Redraws the canvas for the current map view.
     * @param clear - True to clear the canvas before drawing.
     * @memberof CanvasOverlay
     * @method
     */
    Redraw(clear: boolean): void;
    /**
     * Sets the map for the label. Settings this to null remove the label from hte map.
     *
     * @param map - A native map object for the underlying implementation. Implementing derivatives should return the
     * actual native object.
     * @memberof CanvasOverlay
     * @method
     */
    abstract SetMap(map: any): void;
    /**
     * Attaches the canvas to the map.
     * @memberof CanvasOverlay
     * @method
     */
    protected abstract SetCanvasElement(el: HTMLCanvasElement): void;
    /**
     * Remove the map event handlers.
     * @memberof CanvasOverlay
     * @method
     * @abstract
     * @protected
     */
    protected abstract RemoveEventHandlers(): void;
    /**
     * Updates the Canvas size based on the map size.
     * @memberof CanvasOverlay
     * @method
     * @abstract
     * @protected
     */
    protected abstract Resize(): void;
    /**
     * Updates the Canvas.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    protected abstract UpdateCanvas(): void;
    /**
     * Simple function for updating the CSS position and dimensions of the canvas.
     * @param x The horizontal offset position of the canvas.
     * @param y The vertical offset position of the canvas.
     * @param w The width of the canvas.
     * @param h The height of the canvas.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    protected UpdatePosition(x: number, y: number, w: number, h: number): void;
}
