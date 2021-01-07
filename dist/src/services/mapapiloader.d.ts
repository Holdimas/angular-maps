/**
 * Abstract implementation. USed for defintion only and as a base to implement your
 * own provider.
 *
 * @export
 * @abstract
 */
export declare abstract class MapAPILoader {
    /**
     * Loads the necessary resources for a given map architecture.
     *
     * @abstract
     * @returns - Promise fullfilled when the resources have been loaded.
     *
     * @memberof MapAPILoader
     */
    abstract Load(): Promise<void>;
}
/**
 * Document Reference service to assist with abstracting the availability of document. Needed for AOT and
 * Server Side rendering
 *
 * @export
 */
export declare class DocumentRef {
    /**
     * Gets whether a document implementation is available. Generally will be true in the browser and false otherwise, unless there
     * there is a browser-less implementation in the current non-browser environment.
     *
     * @readonly
     * @memberof DocumentRef
     */
    get IsAvailable(): boolean;
    /**
     * Returns the document object of the current environment.
     *
     * @returns - The document object.
     *
     * @memberof DocumentRef
     */
    GetNativeDocument(): any;
}
/**
 * Window Reference service to assist with abstracting the availability of window. Needed for AOT and
 * Server Side rendering
 *
 * @export
 */
export declare class WindowRef {
    /**
     * Gets whether a window implementation is available. Generally will be true in the browser and false otherwise, unless there
     * there is a browser-less implementation in the current non-browser environment.
     *
     * @readonly
     * @memberof WindowRef
     */
    get IsAvailable(): boolean;
    /**
     * Returns the window object of the current environment.
     *
     * @returns - The window object.
     *
     * @memberof WindowRef
     */
    GetNativeWindow(): any;
}
