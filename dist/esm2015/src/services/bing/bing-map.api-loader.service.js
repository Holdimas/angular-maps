import { Injectable, Optional } from '@angular/core';
import { MapAPILoader, WindowRef, DocumentRef } from '../mapapiloader';
/**
 * Protocol enumeration
 *
 * @export
 * @enum {number}
 */
export var ScriptProtocol;
(function (ScriptProtocol) {
    ScriptProtocol[ScriptProtocol["HTTP"] = 0] = "HTTP";
    ScriptProtocol[ScriptProtocol["HTTPS"] = 1] = "HTTPS";
    ScriptProtocol[ScriptProtocol["AUTO"] = 2] = "AUTO";
})(ScriptProtocol || (ScriptProtocol = {}));
/**
 * Bing Maps V8 specific loader configuration to be used with the {@link BingMapAPILoader}
 *
 * @export
 */
export class BingMapAPILoaderConfig {
    constructor() {
        ///
        /// API key for bing maps
        ///
        this.apiKey = '';
        ///
        /// Host and Path used for the `<script>` tag.
        ///
        this.hostAndPath = 'www.bing.com/api/maps/mapcontrol';
        ///
        /// Protocol used for the `<script>` tag.
        ///
        this.protocol = ScriptProtocol.HTTPS;
        ///
        /// The branch to be used. Leave empty for production. Use experimental
        ///
        this.branch = '';
    }
}
BingMapAPILoaderConfig.decorators = [
    { type: Injectable }
];
/**
 * Default loader configuration.
 */
const DEFAULT_CONFIGURATION = new BingMapAPILoaderConfig();
/**
 * Bing Maps V8 implementation for the {@link MapAPILoader} service.
 *
 * @export
 */
export class BingMapAPILoader extends MapAPILoader {
    /**
     * Creates an instance of BingMapAPILoader.
     * @param _config  - The loader configuration.
     * @param _windowRef - An instance of {@link WindowRef}. Necessary because Bing Map V8 interacts with the window object.
     * @param _documentRef - An instance of {@link DocumentRef}.
     * Necessary because Bing Map V8 interacts with the document object.
     *
     * @memberof BingMapAPILoader
     */
    constructor(_config, _windowRef, _documentRef) {
        super();
        this._config = _config;
        this._windowRef = _windowRef;
        this._documentRef = _documentRef;
        if (this._config === null || this._config === undefined) {
            this._config = DEFAULT_CONFIGURATION;
        }
    }
    ///
    /// Property declarations.
    ///
    /**
     * Gets the loader configuration.
     *
     * @readonly
     * @memberof BingMapAPILoader
     */
    get Config() { return this._config; }
    ///
    /// Public methods and MapAPILoader implementation.
    ///
    /**
     * Loads the necessary resources for Bing Maps V8.
     *
     * @memberof BingMapAPILoader
     */
    Load() {
        if (this._scriptLoadingPromise) {
            return this._scriptLoadingPromise;
        }
        const script = this._documentRef.GetNativeDocument().createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        const callbackName = `angular2bingmaps${new Date().getMilliseconds()}`;
        script.src = this.GetScriptSrc(callbackName);
        this._scriptLoadingPromise = new Promise((resolve, reject) => {
            this._windowRef.GetNativeWindow()[callbackName] = () => {
                resolve();
            };
            script.onerror = (error) => { reject(error); };
        });
        this._documentRef.GetNativeDocument().head.appendChild(script);
        return this._scriptLoadingPromise;
    }
    ///
    /// Private methods
    ///
    /**
     * Gets the Bing Map V8 scripts url for injections into the header.
     *
     * @param callbackName - Name of the function to be called when the Bing Maps V8 scripts are loaded.
     * @returns - The url to be used to load the Bing Map scripts.
     *
     * @memberof BingMapAPILoader
     */
    GetScriptSrc(callbackName) {
        const protocolType = (this._config && this._config.protocol) || DEFAULT_CONFIGURATION.protocol;
        let protocol;
        switch (protocolType) {
            case ScriptProtocol.AUTO:
                protocol = '';
                break;
            case ScriptProtocol.HTTP:
                protocol = 'http:';
                break;
            case ScriptProtocol.HTTPS:
                protocol = 'https:';
                break;
        }
        const hostAndPath = this._config.hostAndPath || DEFAULT_CONFIGURATION.hostAndPath;
        const queryParams = {
            callback: callbackName
        };
        if (this._config.branch !== '') {
            queryParams['branch'] = this._config.branch;
        }
        const params = Object.keys(queryParams)
            .map((k, i) => {
            let param = (i === 0) ? '?' : '&';
            return param += `${k}=${queryParams[k]}`;
        })
            .join('');
        return `${protocol}//${hostAndPath}${params}`;
    }
}
BingMapAPILoader.decorators = [
    { type: Injectable }
];
BingMapAPILoader.ctorParameters = () => [
    { type: BingMapAPILoaderConfig, decorators: [{ type: Optional }] },
    { type: WindowRef },
    { type: DocumentRef }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZy1tYXAuYXBpLWxvYWRlci5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsic3JjL3NlcnZpY2VzL2JpbmcvYmluZy1tYXAuYXBpLWxvYWRlci5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3JELE9BQU8sRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRXZFOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFOLElBQVksY0FJWDtBQUpELFdBQVksY0FBYztJQUN0QixtREFBSSxDQUFBO0lBQ0oscURBQUssQ0FBQTtJQUNMLG1EQUFJLENBQUE7QUFDUixDQUFDLEVBSlcsY0FBYyxLQUFkLGNBQWMsUUFJekI7QUFFRDs7OztHQUlHO0FBRUgsTUFBTSxPQUFPLHNCQUFzQjtJQURuQztRQUdJLEdBQUc7UUFDSCx5QkFBeUI7UUFDekIsR0FBRztRQUNILFdBQU0sR0FBRyxFQUFFLENBQUM7UUFFWixHQUFHO1FBQ0gsOENBQThDO1FBQzlDLEdBQUc7UUFDSCxnQkFBVyxHQUFHLGtDQUFrQyxDQUFDO1FBRWpELEdBQUc7UUFDSCx5Q0FBeUM7UUFDekMsR0FBRztRQUNILGFBQVEsR0FBbUIsY0FBYyxDQUFDLEtBQUssQ0FBQztRQUVoRCxHQUFHO1FBQ0gsdUVBQXVFO1FBQ3ZFLEdBQUc7UUFDSCxXQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2hCLENBQUM7OztZQXRCQSxVQUFVOztBQXdCWDs7R0FFRztBQUNILE1BQU0scUJBQXFCLEdBQUcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO0FBRTNEOzs7O0dBSUc7QUFFSCxNQUFNLE9BQU8sZ0JBQWlCLFNBQVEsWUFBWTtJQW1COUM7Ozs7Ozs7O09BUUc7SUFDSCxZQUFpQyxPQUErQixFQUFVLFVBQXFCLEVBQVUsWUFBeUI7UUFDOUgsS0FBSyxF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SSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7U0FDL0M7UUFDRCxNQUFNLE1BQU0sR0FBVyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQzthQUMxQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLEVBQUU7WUFDMUIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQ2xDLE9BQU8sS0FBSyxJQUFJLEdBQUcsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzdDLENBQUMsQ0FBQzthQUNELElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNkLE9BQU8sR0FBRyxRQUFRLEtBQUssV0FBVyxHQUFHLE1BQU0sRUFBRSxDQUFDO0lBQ2xELENBQUM7OztZQTdHSixVQUFVOzs7WUE2Qm1DLHNCQUFzQix1QkFBbEQsUUFBUTtZQWxGSCxTQUFTO1lBQUUsV0FBVyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIE9wdGlvbmFsIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBNYXBBUElMb2FkZXIsIFdpbmRvd1JlZiwgRG9jdW1lbnRSZWYgfSBmcm9tICcuLi9tYXBhcGlsb2FkZXInO1xuXG4vKipcbiAqIFByb3RvY29sIGVudW1lcmF0aW9uXG4gKlxuICogQGV4cG9ydFxuICogQGVudW0ge251bWJlcn1cbiAqL1xuZXhwb3J0IGVudW0gU2NyaXB0UHJvdG9jb2wge1xuICAgIEhUVFAsXG4gICAgSFRUUFMsXG4gICAgQVVUT1xufVxuXG4vKipcbiAqIEJpbmcgTWFwcyBWOCBzcGVjaWZpYyBsb2FkZXIgY29uZmlndXJhdGlvbiB0byBiZSB1c2VkIHdpdGggdGhlIHtAbGluayBCaW5nTWFwQVBJTG9hZGVyfVxuICpcbiAqIEBleHBvcnRcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEJpbmdNYXBBUElMb2FkZXJDb25maWcgIHtcblxuICAgIC8vL1xuICAgIC8vLyBBUEkga2V5IGZvciBiaW5nIG1hcHNcbiAgICAvLy9cbiAgICBhcGlLZXkgPSAnJztcblxuICAgIC8vL1xuICAgIC8vLyBIb3N0IGFuZCBQYXRoIHVzZWQgZm9yIHRoZSBgPHNjcmlwdD5gIHRhZy5cbiAgICAvLy9cbiAgICBob3N0QW5kUGF0aCA9ICd3d3cuYmluZy5jb20vYXBpL21hcHMvbWFwY29udHJvbCc7XG5cbiAgICAvLy9cbiAgICAvLy8gUHJvdG9jb2wgdXNlZCBmb3IgdGhlIGA8c2NyaXB0PmAgdGFnLlxuICAgIC8vL1xuICAgIHByb3RvY29sOiBTY3JpcHRQcm90b2NvbCA9IFNjcmlwdFByb3RvY29sLkhUVFBTO1xuXG4gICAgLy8vXG4gICAgLy8vIFRoZSBicmFuY2ggdG8gYmUgdXNlZC4gTGVhdmUgZW1wdHkgZm9yIHByb2R1Y3Rpb24uIFVzZSBleHBlcmltZW50YWxcbiAgICAvLy9cbiAgICBicmFuY2ggPSAnJztcbn1cblxuLyoqXG4gKiBEZWZhdWx0IGxvYWRlciBjb25maWd1cmF0aW9uLlxuICovXG5jb25zdCBERUZBVUxUX0NPTkZJR1VSQVRJT04gPSBuZXcgQmluZ01hcEFQSUxvYWRlckNvbmZpZygpO1xuXG4vKipcbiAqIEJpbmcgTWFwcyBWOCBpbXBsZW1lbnRhdGlvbiBmb3IgdGhlIHtAbGluayBNYXBBUElMb2FkZXJ9IHNlcnZpY2UuXG4gKlxuICogQGV4cG9ydFxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQmluZ01hcEFQSUxvYWRlciBleHRlbmRzIE1hcEFQSUxvYWRlciB7XG5cbiAgICAvLy9cbiAgICAvLy8gRmllbGQgZGVmaW50aXRpb25zLlxuICAgIC8vL1xuICAgIHByaXZhdGUgX3NjcmlwdExvYWRpbmdQcm9taXNlOiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgLy8vXG4gICAgLy8vIFByb3BlcnR5IGRlY2xhcmF0aW9ucy5cbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGxvYWRlciBjb25maWd1cmF0aW9uLlxuICAgICAqXG4gICAgICogQHJlYWRvbmx5XG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBBUElMb2FkZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IENvbmZpZygpOiBCaW5nTWFwQVBJTG9hZGVyQ29uZmlnIHsgcmV0dXJuIHRoaXMuX2NvbmZpZzsgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBCaW5nTWFwQVBJTG9hZGVyLlxuICAgICAqIEBwYXJhbSBfY29uZmlnICAtIFRoZSBsb2FkZXIgY29uZmlndXJhdGlvbi5cbiAgICAgKiBAcGFyYW0gX3dpbmRvd1JlZiAtIEFuIGluc3RhbmNlIG9mIHtAbGluayBXaW5kb3dSZWZ9LiBOZWNlc3NhcnkgYmVjYXVzZSBCaW5nIE1hcCBWOCBpbnRlcmFjdHMgd2l0aCB0aGUgd2luZG93IG9iamVjdC5cbiAgICAgKiBAcGFyYW0gX2RvY3VtZW50UmVmIC0gQW4gaW5zdGFuY2Ugb2Yge0BsaW5rIERvY3VtZW50UmVmfS5cbiAgICAgKiBOZWNlc3NhcnkgYmVjYXVzZSBCaW5nIE1hcCBWOCBpbnRlcmFjdHMgd2l0aCB0aGUgZG9jdW1lbnQgb2JqZWN0LlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBBUElMb2FkZXJcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciggQE9wdGlvbmFsKCkgcHJpdmF0ZSBfY29uZmlnOiBCaW5nTWFwQVBJTG9hZGVyQ29uZmlnLCBwcml2YXRlIF93aW5kb3dSZWY6IFdpbmRvd1JlZiwgcHJpdmF0ZSBfZG9jdW1lbnRSZWY6IERvY3VtZW50UmVmKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGlmICh0aGlzLl9jb25maWcgPT09IG51bGwgfHwgdGhpcy5fY29uZmlnID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbmZpZyA9IERFRkFVTFRfQ09ORklHVVJBVElPTjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQdWJsaWMgbWV0aG9kcyBhbmQgTWFwQVBJTG9hZGVyIGltcGxlbWVudGF0aW9uLlxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogTG9hZHMgdGhlIG5lY2Vzc2FyeSByZXNvdXJjZXMgZm9yIEJpbmcgTWFwcyBWOC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBCaW5nTWFwQVBJTG9hZGVyXG4gICAgICovXG4gICAgcHVibGljIExvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICh0aGlzLl9zY3JpcHRMb2FkaW5nUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NjcmlwdExvYWRpbmdQcm9taXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2NyaXB0ID0gdGhpcy5fZG9jdW1lbnRSZWYuR2V0TmF0aXZlRG9jdW1lbnQoKS5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcbiAgICAgICAgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcbiAgICAgICAgc2NyaXB0LmRlZmVyID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgY2FsbGJhY2tOYW1lID0gYGFuZ3VsYXIyYmluZ21hcHMke25ldyBEYXRlKCkuZ2V0TWlsbGlzZWNvbmRzKCl9YDtcbiAgICAgICAgc2NyaXB0LnNyYyA9IHRoaXMuR2V0U2NyaXB0U3JjKGNhbGxiYWNrTmFtZSk7XG5cbiAgICAgICAgdGhpcy5fc2NyaXB0TG9hZGluZ1Byb21pc2UgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZTogRnVuY3Rpb24sIHJlamVjdDogRnVuY3Rpb24pID0+IHtcbiAgICAgICAgICAgICg8YW55PnRoaXMuX3dpbmRvd1JlZi5HZXROYXRpdmVXaW5kb3coKSlbY2FsbGJhY2tOYW1lXSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgc2NyaXB0Lm9uZXJyb3IgPSAoZXJyb3I6IEV2ZW50KSA9PiB7IHJlamVjdChlcnJvcik7IH07XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9kb2N1bWVudFJlZi5HZXROYXRpdmVEb2N1bWVudCgpLmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NjcmlwdExvYWRpbmdQcm9taXNlO1xuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQcml2YXRlIG1ldGhvZHNcbiAgICAvLy9cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIEJpbmcgTWFwIFY4IHNjcmlwdHMgdXJsIGZvciBpbmplY3Rpb25zIGludG8gdGhlIGhlYWRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjYWxsYmFja05hbWUgLSBOYW1lIG9mIHRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgQmluZyBNYXBzIFY4IHNjcmlwdHMgYXJlIGxvYWRlZC5cbiAgICAgKiBAcmV0dXJucyAtIFRoZSB1cmwgdG8gYmUgdXNlZCB0byBsb2FkIHRoZSBCaW5nIE1hcCBzY3JpcHRzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEJpbmdNYXBBUElMb2FkZXJcbiAgICAgKi9cbiAgICBwcml2YXRlIEdldFNjcmlwdFNyYyhjYWxsYmFja05hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHByb3RvY29sVHlwZTogU2NyaXB0UHJvdG9jb2wgPSAodGhpcy5fY29uZmlnICYmIHRoaXMuX2NvbmZpZy5wcm90b2NvbCkgfHwgREVGQVVMVF9DT05GSUdVUkFUSU9OLnByb3RvY29sO1xuICAgICAgICBsZXQgcHJvdG9jb2w6IHN0cmluZztcblxuICAgICAgICBzd2l0Y2ggKHByb3RvY29sVHlwZSkge1xuICAgICAgICAgICAgY2FzZSBTY3JpcHRQcm90b2NvbC5BVVRPOlxuICAgICAgICAgICAgICAgIHByb3RvY29sID0gJyc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNjcmlwdFByb3RvY29sLkhUVFA6XG4gICAgICAgICAgICAgICAgcHJvdG9jb2wgPSAnaHR0cDonO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTY3JpcHRQcm90b2NvbC5IVFRQUzpcbiAgICAgICAgICAgICAgICBwcm90b2NvbCA9ICdodHRwczonO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaG9zdEFuZFBhdGg6IHN0cmluZyA9IHRoaXMuX2NvbmZpZy5ob3N0QW5kUGF0aCB8fCBERUZBVUxUX0NPTkZJR1VSQVRJT04uaG9zdEFuZFBhdGg7XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xuICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrTmFtZVxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5fY29uZmlnLmJyYW5jaCAhPT0gJycpIHtcbiAgICAgICAgICAgIHF1ZXJ5UGFyYW1zWydicmFuY2gnXSA9IHRoaXMuX2NvbmZpZy5icmFuY2g7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFyYW1zOiBzdHJpbmcgPSBPYmplY3Qua2V5cyhxdWVyeVBhcmFtcylcbiAgICAgICAgICAgIC5tYXAoKGs6IHN0cmluZywgaTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHBhcmFtID0gKGkgPT09IDApID8gJz8nIDogJyYnO1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbSArPSBgJHtrfT0ke3F1ZXJ5UGFyYW1zW2tdfWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJycpO1xuICAgICAgICByZXR1cm4gYCR7cHJvdG9jb2x9Ly8ke2hvc3RBbmRQYXRofSR7cGFyYW1zfWA7XG4gICAgfVxufVxuIl19