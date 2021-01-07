import { MapAPILoader, WindowRef, DocumentRef } from '../mapapiloader';
/**
 * Protocol enumeration
 *
 * @export
 * @enum {number}
 */
export declare enum ScriptProtocol {
    HTTP = 0,
    HTTPS = 1,
    AUTO = 2
}
/**
 * Bing Maps V8 specific loader configuration to be used with the {@link BingMapAPILoader}
 *
 * @export
 */
export declare class BingMapAPILoaderConfig {
    apiKey: string;
    hostAndPath: string;
    protocol: ScriptProtocol;
    branch: string;
}
/**
 * Bing Maps V8 implementation for the {@link MapAPILoader} service.
 *
 * @export
 */
export declare class BingMapAPILoader extends MapAPILoader {
    private _config;
    private _windowRef;
    private _documentRef;
    private _scriptLoadingPromise;
    /**
     * Gets the loader configuration.
     *
     * @readonly
     * @memberof BingMapAPILoader
     */
    get Config(): BingMapAPILoaderConfig;
    /**
     * Creates an instance of BingMapAPILoader.
     * @param _config  - The loader configuration.
     * @param _windowRef - An instance of {@link WindowRef}. Necessary because Bing Map V8 interacts with the window object.
     * @param _documentRef - An instance of {@link DocumentRef}.
     * Necessary because Bing Map V8 interacts with the document object.
     *
     * @memberof BingMapAPILoader
     */
    constructor(_config: BingMapAPILoaderConfig, _windowRef: WindowRef, _documentRef: DocumentRef);
    /**
     * Loads the necessary resources for Bing Maps V8.
     *
     * @memberof BingMapAPILoader
     */
    Load(): Promise<void>;
    /**
     * Gets the Bing Map V8 scripts url for injections into the header.
     *
     * @param callbackName - Name of the function to be called when the Bing Maps V8 scripts are loaded.
     * @returns - The url to be used to load the Bing Map scripts.
     *
     * @memberof BingMapAPILoader
     */
    private GetScriptSrc;
}
