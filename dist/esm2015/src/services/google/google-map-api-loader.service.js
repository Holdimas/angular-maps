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
 * Bing Maps V8 specific loader configuration to be used with the {@link GoogleMapAPILoader}
 *
 * @export
 */
export class GoogleMapAPILoaderConfig {
}
GoogleMapAPILoaderConfig.decorators = [
    { type: Injectable }
];
/**
 * Default loader configuration.
 */
const DEFAULT_CONFIGURATION = new GoogleMapAPILoaderConfig();
/**
 * Bing Maps V8 implementation for the {@link MapAPILoader} service.
 *
 * @export
 */
export class GoogleMapAPILoader extends MapAPILoader {
    /**
     * Creates an instance of GoogleMapAPILoader.
     * @param _config - The loader configuration.
     * @param _windowRef - An instance of {@link WindowRef}. Necessary because Bing Map V8 interacts with the window object.
     * @param _documentRef - An instance of {@link DocumentRef}.
     *                                     Necessary because Bing Map V8 interacts with the document object.
     * @memberof GoogleMapAPILoader
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
     * @memberof GoogleMapAPILoader
     */
    get Config() { return this._config; }
    ///
    /// Public methods and MapAPILoader implementation.
    ///
    /**
     * Loads the necessary resources for Bing Maps V8.
     *
     * @memberof GoogleMapAPILoader
     */
    Load() {
        if (this._scriptLoadingPromise) {
            return this._scriptLoadingPromise;
        }
        const script = this._documentRef.GetNativeDocument().createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        const callbackName = `Create`;
        script.src = this.GetMapsScriptSrc(callbackName);
        this._scriptLoadingPromise = new Promise((resolve, reject) => {
            this._windowRef.GetNativeWindow()[callbackName] = () => {
                if (this._config.enableClustering) {
                    // if clustering is enabled then delay the loading until after the cluster library is loaded
                    const clusterScript = this._documentRef.GetNativeDocument().createElement('script');
                    clusterScript.type = 'text/javascript';
                    clusterScript.src = this.GetClusterScriptSrc();
                    clusterScript.onload = clusterScript.onreadystatechange = () => {
                        resolve();
                    };
                    this._documentRef.GetNativeDocument().head.appendChild(clusterScript);
                }
                else {
                    resolve();
                }
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
     * Gets the Google Maps scripts url for injections into the header.
     *
     * @param callbackName - Name of the function to be called when the Google Maps scripts are loaded.
     * @returns - The url to be used to load the Google Map scripts.
     *
     * @memberof GoogleMapAPILoader
     */
    GetMapsScriptSrc(callbackName) {
        const hostAndPath = this._config.hostAndPath || 'maps.googleapis.com/maps/api/js';
        const queryParams = {
            v: this._config.apiVersion,
            callback: callbackName,
            key: this._config.apiKey,
            client: this._config.clientId,
            channel: this._config.channel,
            libraries: this._config.libraries,
            region: this._config.region,
            language: this._config.language
        };
        return this.GetScriptSrc(hostAndPath, queryParams);
    }
    /**
     * Gets the Google Maps Cluster library url for injections into the header.
     *
     * @returns - The url to be used to load the Google Map Cluster library.
     *
     * @memberof GoogleMapAPILoader
     */
    GetClusterScriptSrc() {
        const hostAndPath = this._config.clusterHostAndPath ||
            'developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js';
        return this.GetScriptSrc(hostAndPath, {});
    }
    /**
     * Gets a scripts url for injections into the header.
     *
     * @param hostAndPath - Host and path name of the script to load.
     * @param queryParams - Url query parameters.
     * @returns - The url with correct protocol, path, and query parameters.
     *
     * @memberof GoogleMapAPILoader
     */
    GetScriptSrc(hostAndPath, queryParams) {
        const protocolType = ((this._config && this._config.protocol) || ScriptProtocol.HTTPS);
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
        const params = Object.keys(queryParams)
            .filter((k) => queryParams[k] != null)
            .filter((k) => {
            // remove empty arrays
            return !Array.isArray(queryParams[k]) ||
                (Array.isArray(queryParams[k]) && queryParams[k].length > 0);
        })
            .map((k) => {
            // join arrays as comma seperated strings
            const i = queryParams[k];
            if (Array.isArray(i)) {
                return { key: k, value: i.join(',') };
            }
            return { key: k, value: queryParams[k] };
        })
            .map((entry) => { return `${entry.key}=${entry.value}`; })
            .join('&');
        return `${protocol}//${hostAndPath}?${params}`;
    }
}
GoogleMapAPILoader.decorators = [
    { type: Injectable }
];
GoogleMapAPILoader.ctorParameters = () => [
    { type: GoogleMapAPILoaderConfig, decorators: [{ type: Optional }] },
    { type: WindowRef },
    { type: DocumentRef }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlLW1hcC1hcGktbG9hZGVyLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvc2VydmljZXMvZ29vZ2xlL2dvb2dsZS1tYXAtYXBpLWxvYWRlci5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3JELE9BQU8sRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRXZFOzs7OztHQUtHO0FBQ0gsTUFBTSxDQUFOLElBQVksY0FJWDtBQUpELFdBQVksY0FBYztJQUN0QixtREFBSSxDQUFBO0lBQ0oscURBQUssQ0FBQTtJQUNMLG1EQUFJLENBQUE7QUFDUixDQUFDLEVBSlcsY0FBYyxLQUFkLGNBQWMsUUFJekI7QUFFRDs7OztHQUlHO0FBRUgsTUFBTSxPQUFPLHdCQUF3Qjs7O1lBRHBDLFVBQVU7O0FBd0VYOztHQUVHO0FBQ0gsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLHdCQUF3QixFQUFFLENBQUM7QUFFN0Q7Ozs7R0FJRztBQUVILE1BQU0sT0FBTyxrQkFBbUIsU0FBUSxZQUFZO0lBbUJoRDs7Ozs7OztPQU9HO0lBQ0gsWUFBaUMsT0FBaUMsRUFBVSxVQUFxQixFQUFVLFlBQXlCO1FBQ2hJLEtBQUssRUFBRSxDQUFDO1FBRHFCLFlBQU8sR0FBUCxPQUFPLENBQTBCO1FBQVUsZUFBVSxHQUFWLFVBQVUsQ0FBVztRQUFVLGlCQUFZLEdBQVosWUFBWSxDQUFhO1FBRWhJLElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxTQUFTLEVBQUU7WUFDckQsSUFBSSxDQUFDLE9BQU8sR0FBRyxxQkFBcUIsQ0FBQztTQUN4QztJQUNMLENBQUM7SUF6QkQsR0FBRztJQUNILDBCQUEwQjtJQUMxQixHQUFHO0lBRUg7Ozs7O09BS0c7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QUFDLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNyRSxDQUFDLENBQUM7YUFDRCxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsRUFBRTtZQUNmLHlDQUF5QztZQUN6QyxNQUFNLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2FBQ3pDO1lBQ0QsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzdDLENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQyxDQUFDLEtBQXFDLEVBQUUsRUFBRSxHQUFHLE9BQU8sR0FBRyxLQUFLLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN6RixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsT0FBTyxHQUFHLFFBQVEsS0FBSyxXQUFXLElBQUksTUFBTSxFQUFFLENBQUM7SUFDbkQsQ0FBQzs7O1lBbktKLFVBQVU7OztZQTRCbUMsd0JBQXdCLHVCQUFwRCxRQUFRO1lBaklILFNBQVM7WUFBRSxXQUFXIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgT3B0aW9uYWwgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE1hcEFQSUxvYWRlciwgV2luZG93UmVmLCBEb2N1bWVudFJlZiB9IGZyb20gJy4uL21hcGFwaWxvYWRlcic7XG5cbi8qKlxuICogUHJvdG9jb2wgZW51bWVyYXRpb25cbiAqXG4gKiBAZXhwb3J0XG4gKiBAZW51bSB7bnVtYmVyfVxuICovXG5leHBvcnQgZW51bSBTY3JpcHRQcm90b2NvbCB7XG4gICAgSFRUUCxcbiAgICBIVFRQUyxcbiAgICBBVVRPXG59XG5cbi8qKlxuICogQmluZyBNYXBzIFY4IHNwZWNpZmljIGxvYWRlciBjb25maWd1cmF0aW9uIHRvIGJlIHVzZWQgd2l0aCB0aGUge0BsaW5rIEdvb2dsZU1hcEFQSUxvYWRlcn1cbiAqXG4gKiBAZXhwb3J0XG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBHb29nbGVNYXBBUElMb2FkZXJDb25maWcge1xuICAgIC8qKlxuICAgICAgICogVGhlIEdvb2dsZSBNYXBzIEFQSSBLZXkgKHNlZTpcbiAgICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL21hcHMvZG9jdW1lbnRhdGlvbi9qYXZhc2NyaXB0L2dldC1hcGkta2V5KVxuICAgICAgICovXG4gICAgYXBpS2V5Pzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIEdvb2dsZSBNYXBzIGNsaWVudCBJRCAoZm9yIHByZW1pdW0gcGxhbnMpLlxuICAgICAqIFdoZW4geW91IGhhdmUgYSBHb29nbGUgTWFwcyBBUElzIFByZW1pdW0gUGxhbiBsaWNlbnNlLCB5b3UgbXVzdCBhdXRoZW50aWNhdGVcbiAgICAgKiB5b3VyIGFwcGxpY2F0aW9uIHdpdGggZWl0aGVyIGFuIEFQSSBrZXkgb3IgYSBjbGllbnQgSUQuXG4gICAgICogVGhlIEdvb2dsZSBNYXBzIEFQSSB3aWxsIGZhaWwgdG8gbG9hZCBpZiBib3RoIGEgY2xpZW50IElEIGFuZCBhbiBBUEkga2V5IGFyZSBpbmNsdWRlZC5cbiAgICAgKi9cbiAgICBjbGllbnRJZD86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBHb29nbGUgTWFwcyBjaGFubmVsIG5hbWUgKGZvciBwcmVtaXVtIHBsYW5zKS5cbiAgICAgKiBBIGNoYW5uZWwgcGFyYW1ldGVyIGlzIGFuIG9wdGlvbmFsIHBhcmFtZXRlciB0aGF0IGFsbG93cyB5b3UgdG8gdHJhY2sgdXNhZ2UgdW5kZXIgeW91ciBjbGllbnRcbiAgICAgKiBJRCBieSBhc3NpZ25pbmcgYSBkaXN0aW5jdCBjaGFubmVsIHRvIGVhY2ggb2YgeW91ciBhcHBsaWNhdGlvbnMuXG4gICAgICovXG4gICAgY2hhbm5lbD86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIEdvb2dsZSBNYXBzIEFQSSB2ZXJzaW9uLlxuICAgICAqL1xuICAgIGFwaVZlcnNpb24/OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBIb3N0IGFuZCBQYXRoIHVzZWQgZm9yIHRoZSBgPHNjcmlwdD5gIHRhZy5cbiAgICAgKi9cbiAgICBob3N0QW5kUGF0aD86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFByb3RvY29sIHVzZWQgZm9yIHRoZSBgPHNjcmlwdD5gIHRhZy5cbiAgICAgKi9cbiAgICBwcm90b2NvbD86IFNjcmlwdFByb3RvY29sO1xuXG4gICAgLyoqXG4gICAgICogRGVmaW5lcyB3aGljaCBHb29nbGUgTWFwcyBsaWJyYXJpZXMgc2hvdWxkIGdldCBsb2FkZWQuXG4gICAgICovXG4gICAgbGlicmFyaWVzPzogc3RyaW5nW107XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGVmYXVsdCBiaWFzIGZvciB0aGUgbWFwIGJlaGF2aW9yIGlzIFVTLlxuICAgICAqIElmIHlvdSB3aXNoIHRvIGFsdGVyIHlvdXIgYXBwbGljYXRpb24gdG8gc2VydmUgZGlmZmVyZW50IG1hcCB0aWxlcyBvciBiaWFzIHRoZVxuICAgICAqIGFwcGxpY2F0aW9uLCB5b3UgY2FuIG92ZXJ3cml0ZSB0aGUgZGVmYXVsdCBiZWhhdmlvciAoVVMpIGJ5IGRlZmluaW5nIGEgYHJlZ2lvbmAuXG4gICAgICogU2VlIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL21hcHMvZG9jdW1lbnRhdGlvbi9qYXZhc2NyaXB0L2Jhc2ljcyNSZWdpb25cbiAgICAgKi9cbiAgICByZWdpb24/OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgR29vZ2xlIE1hcHMgQVBJIHVzZXMgdGhlIGJyb3dzZXIncyBwcmVmZXJyZWQgbGFuZ3VhZ2Ugd2hlbiBkaXNwbGF5aW5nXG4gICAgICogdGV4dHVhbCBpbmZvcm1hdGlvbi4gSWYgeW91IHdpc2ggdG8gb3ZlcndyaXRlIHRoaXMgYmVoYXZpb3IgYW5kIGZvcmNlIHRoZSBBUElcbiAgICAgKiB0byB1c2UgYSBnaXZlbiBsYW5ndWFnZSwgeW91IGNhbiB1c2UgdGhpcyBzZXR0aW5nLlxuICAgICAqIFNlZSBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9tYXBzL2RvY3VtZW50YXRpb24vamF2YXNjcmlwdC9iYXNpY3MjTGFuZ3VhZ2VcbiAgICAgKi9cbiAgICBsYW5ndWFnZT86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBHb29nbGUgTWFwcyBBUEkgcmVxdWlyZXMgYSBzZXBhcmF0ZSBsaWJyYXJ5IGZvciBjbHVzdGVyaW5nLiBTZXQgdGhlIHByb3BlcnR5XG4gICAgICogdG8gdHJ1ZSBpbiBvcmRlciB0byBsb2FkIHRoaXMgbGlicmFyeS5cbiAgICAgKiBTZWUgaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vbWFwcy9kb2N1bWVudGF0aW9uL2phdmFzY3JpcHQvbWFya2VyLWNsdXN0ZXJpbmdcbiAgICAgKi9cbiAgICBlbmFibGVDbHVzdGVyaW5nPzogYm9vbGVhbjtcblxuICAgIC8qKlxuICAgICAqIEhvc3QgYW5kIFBhdGggdXNlZCBmb3IgdGhlIGNsdXN0ZXIgbGlicmFyeSBgPHNjcmlwdD5gIHRhZy5cbiAgICAgKi9cbiAgICBjbHVzdGVySG9zdEFuZFBhdGg/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogRGVmYXVsdCBsb2FkZXIgY29uZmlndXJhdGlvbi5cbiAqL1xuY29uc3QgREVGQVVMVF9DT05GSUdVUkFUSU9OID0gbmV3IEdvb2dsZU1hcEFQSUxvYWRlckNvbmZpZygpO1xuXG4vKipcbiAqIEJpbmcgTWFwcyBWOCBpbXBsZW1lbnRhdGlvbiBmb3IgdGhlIHtAbGluayBNYXBBUElMb2FkZXJ9IHNlcnZpY2UuXG4gKlxuICogQGV4cG9ydFxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgR29vZ2xlTWFwQVBJTG9hZGVyIGV4dGVuZHMgTWFwQVBJTG9hZGVyIHtcblxuICAgIC8vL1xuICAgIC8vLyBGaWVsZCBkZWZpbnRpdGlvbnMuXG4gICAgLy8vXG4gICAgcHJpdmF0ZSBfc2NyaXB0TG9hZGluZ1Byb21pc2U6IFByb21pc2U8dm9pZD47XG5cbiAgICAvLy9cbiAgICAvLy8gUHJvcGVydHkgZGVjbGFyYXRpb25zLlxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgbG9hZGVyIGNvbmZpZ3VyYXRpb24uXG4gICAgICpcbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwQVBJTG9hZGVyXG4gICAgICovXG4gICAgcHVibGljIGdldCBDb25maWcoKTogR29vZ2xlTWFwQVBJTG9hZGVyQ29uZmlnIHsgcmV0dXJuIHRoaXMuX2NvbmZpZzsgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBHb29nbGVNYXBBUElMb2FkZXIuXG4gICAgICogQHBhcmFtIF9jb25maWcgLSBUaGUgbG9hZGVyIGNvbmZpZ3VyYXRpb24uXG4gICAgICogQHBhcmFtIF93aW5kb3dSZWYgLSBBbiBpbnN0YW5jZSBvZiB7QGxpbmsgV2luZG93UmVmfS4gTmVjZXNzYXJ5IGJlY2F1c2UgQmluZyBNYXAgVjggaW50ZXJhY3RzIHdpdGggdGhlIHdpbmRvdyBvYmplY3QuXG4gICAgICogQHBhcmFtIF9kb2N1bWVudFJlZiAtIEFuIGluc3RhbmNlIG9mIHtAbGluayBEb2N1bWVudFJlZn0uXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTmVjZXNzYXJ5IGJlY2F1c2UgQmluZyBNYXAgVjggaW50ZXJhY3RzIHdpdGggdGhlIGRvY3VtZW50IG9iamVjdC5cbiAgICAgKiBAbWVtYmVyb2YgR29vZ2xlTWFwQVBJTG9hZGVyXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoIEBPcHRpb25hbCgpIHByaXZhdGUgX2NvbmZpZzogR29vZ2xlTWFwQVBJTG9hZGVyQ29uZmlnLCBwcml2YXRlIF93aW5kb3dSZWY6IFdpbmRvd1JlZiwgcHJpdmF0ZSBfZG9jdW1lbnRSZWY6IERvY3VtZW50UmVmKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGlmICh0aGlzLl9jb25maWcgPT09IG51bGwgfHwgdGhpcy5fY29uZmlnID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbmZpZyA9IERFRkFVTFRfQ09ORklHVVJBVElPTjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vL1xuICAgIC8vLyBQdWJsaWMgbWV0aG9kcyBhbmQgTWFwQVBJTG9hZGVyIGltcGxlbWVudGF0aW9uLlxuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogTG9hZHMgdGhlIG5lY2Vzc2FyeSByZXNvdXJjZXMgZm9yIEJpbmcgTWFwcyBWOC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXBBUElMb2FkZXJcbiAgICAgKi9cbiAgICBwdWJsaWMgTG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuX3NjcmlwdExvYWRpbmdQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc2NyaXB0TG9hZGluZ1Byb21pc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzY3JpcHQgPSB0aGlzLl9kb2N1bWVudFJlZi5HZXROYXRpdmVEb2N1bWVudCgpLmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICAgICAgICBzY3JpcHQuYXN5bmMgPSB0cnVlO1xuICAgICAgICBzY3JpcHQuZGVmZXIgPSB0cnVlO1xuICAgICAgICBjb25zdCBjYWxsYmFja05hbWUgPSBgQ3JlYXRlYDtcbiAgICAgICAgc2NyaXB0LnNyYyA9IHRoaXMuR2V0TWFwc1NjcmlwdFNyYyhjYWxsYmFja05hbWUpO1xuXG4gICAgICAgIHRoaXMuX3NjcmlwdExvYWRpbmdQcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmU6IEZ1bmN0aW9uLCByZWplY3Q6IEZ1bmN0aW9uKSA9PiB7XG4gICAgICAgICAgICAoPGFueT50aGlzLl93aW5kb3dSZWYuR2V0TmF0aXZlV2luZG93KCkpW2NhbGxiYWNrTmFtZV0gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2NvbmZpZy5lbmFibGVDbHVzdGVyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGNsdXN0ZXJpbmcgaXMgZW5hYmxlZCB0aGVuIGRlbGF5IHRoZSBsb2FkaW5nIHVudGlsIGFmdGVyIHRoZSBjbHVzdGVyIGxpYnJhcnkgaXMgbG9hZGVkXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNsdXN0ZXJTY3JpcHQgPSB0aGlzLl9kb2N1bWVudFJlZi5HZXROYXRpdmVEb2N1bWVudCgpLmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICAgICAgICAgICAgICBjbHVzdGVyU2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcbiAgICAgICAgICAgICAgICAgICAgY2x1c3RlclNjcmlwdC5zcmMgPSB0aGlzLkdldENsdXN0ZXJTY3JpcHRTcmMoKTtcbiAgICAgICAgICAgICAgICAgICAgY2x1c3RlclNjcmlwdC5vbmxvYWQgPSBjbHVzdGVyU2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRSZWYuR2V0TmF0aXZlRG9jdW1lbnQoKS5oZWFkLmFwcGVuZENoaWxkKGNsdXN0ZXJTY3JpcHQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgc2NyaXB0Lm9uZXJyb3IgPSAoZXJyb3I6IEV2ZW50KSA9PiB7IHJlamVjdChlcnJvcik7IH07XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9kb2N1bWVudFJlZi5HZXROYXRpdmVEb2N1bWVudCgpLmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fc2NyaXB0TG9hZGluZ1Byb21pc2U7XG4gICAgfVxuXG4gICAgLy8vXG4gICAgLy8vIFByaXZhdGUgbWV0aG9kc1xuICAgIC8vL1xuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgR29vZ2xlIE1hcHMgc2NyaXB0cyB1cmwgZm9yIGluamVjdGlvbnMgaW50byB0aGUgaGVhZGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNhbGxiYWNrTmFtZSAtIE5hbWUgb2YgdGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBHb29nbGUgTWFwcyBzY3JpcHRzIGFyZSBsb2FkZWQuXG4gICAgICogQHJldHVybnMgLSBUaGUgdXJsIHRvIGJlIHVzZWQgdG8gbG9hZCB0aGUgR29vZ2xlIE1hcCBzY3JpcHRzLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIEdvb2dsZU1hcEFQSUxvYWRlclxuICAgICAqL1xuICAgIHByaXZhdGUgR2V0TWFwc1NjcmlwdFNyYyhjYWxsYmFja05hbWU6IHN0cmluZykge1xuICAgICAgICBjb25zdCBob3N0QW5kUGF0aDogc3RyaW5nID0gdGhpcy5fY29uZmlnLmhvc3RBbmRQYXRoIHx8ICdtYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzJztcbiAgICAgICAgY29uc3QgcXVlcnlQYXJhbXM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIHwgQXJyYXk8c3RyaW5nPiB9ID0ge1xuICAgICAgICAgICAgdjogdGhpcy5fY29uZmlnLmFwaVZlcnNpb24sXG4gICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2tOYW1lLFxuICAgICAgICAgICAga2V5OiB0aGlzLl9jb25maWcuYXBpS2V5LFxuICAgICAgICAgICAgY2xpZW50OiB0aGlzLl9jb25maWcuY2xpZW50SWQsXG4gICAgICAgICAgICBjaGFubmVsOiB0aGlzLl9jb25maWcuY2hhbm5lbCxcbiAgICAgICAgICAgIGxpYnJhcmllczogdGhpcy5fY29uZmlnLmxpYnJhcmllcyxcbiAgICAgICAgICAgIHJlZ2lvbjogdGhpcy5fY29uZmlnLnJlZ2lvbixcbiAgICAgICAgICAgIGxhbmd1YWdlOiB0aGlzLl9jb25maWcubGFuZ3VhZ2VcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRoaXMuR2V0U2NyaXB0U3JjKGhvc3RBbmRQYXRoLCBxdWVyeVBhcmFtcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgR29vZ2xlIE1hcHMgQ2x1c3RlciBsaWJyYXJ5IHVybCBmb3IgaW5qZWN0aW9ucyBpbnRvIHRoZSBoZWFkZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyAtIFRoZSB1cmwgdG8gYmUgdXNlZCB0byBsb2FkIHRoZSBHb29nbGUgTWFwIENsdXN0ZXIgbGlicmFyeS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXBBUElMb2FkZXJcbiAgICAgKi9cbiAgICBwcml2YXRlIEdldENsdXN0ZXJTY3JpcHRTcmMoKSB7XG4gICAgICAgIGNvbnN0IGhvc3RBbmRQYXRoOiBzdHJpbmcgPSB0aGlzLl9jb25maWcuY2x1c3Rlckhvc3RBbmRQYXRoIHx8XG4gICAgICAgICAgICAnZGV2ZWxvcGVycy5nb29nbGUuY29tL21hcHMvZG9jdW1lbnRhdGlvbi9qYXZhc2NyaXB0L2V4YW1wbGVzL21hcmtlcmNsdXN0ZXJlci9tYXJrZXJjbHVzdGVyZXIuanMnO1xuICAgICAgICByZXR1cm4gdGhpcy5HZXRTY3JpcHRTcmMoaG9zdEFuZFBhdGgsIHt9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIGEgc2NyaXB0cyB1cmwgZm9yIGluamVjdGlvbnMgaW50byB0aGUgaGVhZGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGhvc3RBbmRQYXRoIC0gSG9zdCBhbmQgcGF0aCBuYW1lIG9mIHRoZSBzY3JpcHQgdG8gbG9hZC5cbiAgICAgKiBAcGFyYW0gcXVlcnlQYXJhbXMgLSBVcmwgcXVlcnkgcGFyYW1ldGVycy5cbiAgICAgKiBAcmV0dXJucyAtIFRoZSB1cmwgd2l0aCBjb3JyZWN0IHByb3RvY29sLCBwYXRoLCBhbmQgcXVlcnkgcGFyYW1ldGVycy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBHb29nbGVNYXBBUElMb2FkZXJcbiAgICAgKi9cbiAgICBwcml2YXRlIEdldFNjcmlwdFNyYyhob3N0QW5kUGF0aDogc3RyaW5nLCBxdWVyeVBhcmFtczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBBcnJheTxzdHJpbmc+IH0pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBwcm90b2NvbFR5cGU6IFNjcmlwdFByb3RvY29sID1cbiAgICAgICAgICAgIDxTY3JpcHRQcm90b2NvbD4oKHRoaXMuX2NvbmZpZyAmJiB0aGlzLl9jb25maWcucHJvdG9jb2wpIHx8IFNjcmlwdFByb3RvY29sLkhUVFBTKTtcbiAgICAgICAgbGV0IHByb3RvY29sOiBzdHJpbmc7XG5cbiAgICAgICAgc3dpdGNoIChwcm90b2NvbFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgU2NyaXB0UHJvdG9jb2wuQVVUTzpcbiAgICAgICAgICAgICAgICBwcm90b2NvbCA9ICcnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTY3JpcHRQcm90b2NvbC5IVFRQOlxuICAgICAgICAgICAgICAgIHByb3RvY29sID0gJ2h0dHA6JztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgU2NyaXB0UHJvdG9jb2wuSFRUUFM6XG4gICAgICAgICAgICAgICAgcHJvdG9jb2wgPSAnaHR0cHM6JztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmFtczogc3RyaW5nID1cbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHF1ZXJ5UGFyYW1zKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoKGs6IHN0cmluZykgPT4gcXVlcnlQYXJhbXNba10gIT0gbnVsbClcbiAgICAgICAgICAgICAgICAuZmlsdGVyKChrOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIGVtcHR5IGFycmF5c1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIUFycmF5LmlzQXJyYXkocXVlcnlQYXJhbXNba10pIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoQXJyYXkuaXNBcnJheShxdWVyeVBhcmFtc1trXSkgJiYgcXVlcnlQYXJhbXNba10ubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAubWFwKChrOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gam9pbiBhcnJheXMgYXMgY29tbWEgc2VwZXJhdGVkIHN0cmluZ3NcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaSA9IHF1ZXJ5UGFyYW1zW2tdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsga2V5OiBrLCB2YWx1ZTogaS5qb2luKCcsJykgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBrZXk6IGssIHZhbHVlOiBxdWVyeVBhcmFtc1trXSB9O1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLm1hcCgoZW50cnk6IHsga2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfSkgPT4geyByZXR1cm4gYCR7ZW50cnkua2V5fT0ke2VudHJ5LnZhbHVlfWA7IH0pXG4gICAgICAgICAgICAgICAgLmpvaW4oJyYnKTtcbiAgICAgICAgcmV0dXJuIGAke3Byb3RvY29sfS8vJHtob3N0QW5kUGF0aH0/JHtwYXJhbXN9YDtcbiAgICB9XG59XG4iXX0=