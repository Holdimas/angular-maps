import { Injectable } from '@angular/core';
/**
 * Abstract class to to define the layer service contract. Must be realized by implementing provider.
 *
 * @export
 * @abstract
 */
export class LayerService {
}
LayerService.decorators = [
    { type: Injectable }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5ZXIuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInNyYy9zZXJ2aWNlcy9sYXllci5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQVUsTUFBTSxlQUFlLENBQUM7QUFXbkQ7Ozs7O0dBS0c7QUFFSCxNQUFNLE9BQWdCLFlBQVk7OztZQURqQyxVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBJTWFya2VyT3B0aW9ucyB9IGZyb20gJy4uL2ludGVyZmFjZXMvaW1hcmtlci1vcHRpb25zJztcbmltcG9ydCB7IElQb2x5Z29uT3B0aW9ucyB9IGZyb20gJy4uL2ludGVyZmFjZXMvaXBvbHlnb24tb3B0aW9ucyc7XG5pbXBvcnQgeyBJUG9seWxpbmVPcHRpb25zIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pcG9seWxpbmUtb3B0aW9ucyc7XG5pbXBvcnQgeyBJTWFya2VySWNvbkluZm8gfSBmcm9tICcuLi9pbnRlcmZhY2VzL2ltYXJrZXItaWNvbi1pbmZvJztcbmltcG9ydCB7IE1hcmtlciB9IGZyb20gJy4uL21vZGVscy9tYXJrZXInO1xuaW1wb3J0IHsgUG9seWdvbiB9IGZyb20gJy4uL21vZGVscy9wb2x5Z29uJztcbmltcG9ydCB7IFBvbHlsaW5lIH0gZnJvbSAnLi4vbW9kZWxzL3BvbHlsaW5lJztcbmltcG9ydCB7IExheWVyIH0gZnJvbSAnLi4vbW9kZWxzL2xheWVyJztcbmltcG9ydCB7IE1hcExheWVyRGlyZWN0aXZlIH0gZnJvbSAnLi4vY29tcG9uZW50cy9tYXAtbGF5ZXInO1xuXG4vKipcbiAqIEFic3RyYWN0IGNsYXNzIHRvIHRvIGRlZmluZSB0aGUgbGF5ZXIgc2VydmljZSBjb250cmFjdC4gTXVzdCBiZSByZWFsaXplZCBieSBpbXBsZW1lbnRpbmcgcHJvdmlkZXIuXG4gKlxuICogQGV4cG9ydFxuICogQGFic3RyYWN0XG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBMYXllclNlcnZpY2Uge1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxheWVyIHRvIHRoZSBtYXAuXG4gICAgICpcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBNYXBMYXllckRpcmVjdGl2ZSBjb21wb25lbnQgb2JqZWN0LlxuICAgICAqIEdlbmVyYWxseSwgTWFwTGF5ZXJEaXJlY3RpdmUgd2lsbCBiZSBpbmplY3RlZCB3aXRoIGFuIGluc3RhbmNlIG9mIHRoZVxuICAgICAqIExheWVyU2VydmljZSBhbmQgdGhlbiBzZWxmIHJlZ2lzdGVyIG9uIGluaXRpYWxpemF0aW9uLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIExheWVyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBhYnN0cmFjdCBBZGRMYXllcihsYXllcjogTWFwTGF5ZXJEaXJlY3RpdmUpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIG1hcmtlciB0byB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBUaGUgaWQgb2YgdGhlIGxheWVyIHRvIHdoaWNoIHRvIGFkZCB0aGUgbWFya2VyLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gTWFya2VyIG9wdGlvbnMgZGVmaW5pbmcgdGhlIG1hcmtlci5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IHdoZW4gZnVsbGZpbGxlZCBjb250YWlucyB0aGUgYW4gaW5zdGFuY2Ugb2YgdGhlIE1hcmtlciBtb2RlbC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBMYXllclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgYWJzdHJhY3QgQ3JlYXRlTWFya2VyKGxheWVyOiBudW1iZXIsIG9wdGlvbnM6IElNYXJrZXJPcHRpb25zKTogUHJvbWlzZTxNYXJrZXI+O1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhcnJheSBvZiB1bmJvdW5kIG1hcmtlcnMuIFVzZSB0aGlzIG1ldGhvZCB0byBjcmVhdGUgYXJyYXlzIG9mIG1hcmtlcnMgdG8gYmUgdXNlZCBpbiBidWxrXG4gICAgICogb3BlcmF0aW9ucy5cbiAgICAgKlxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gTWFya2VyIG9wdGlvbnMgZGVmaW5pbmcgdGhlIG1hcmtlcnMuXG4gICAgICogQHBhcmFtIG1hcmtlckljb24gLSBPcHRpb25hbCBpbmZvcm1hdGlvbiB0byBnZW5lcmF0ZSBjdXN0b20gbWFya2Vycy4gVGhpcyB3aWxsIGJlIGFwcGxpZWQgdG8gYWxsIG1hcmtlcnMuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGFuIGFycmF5cyBvZiB0aGUgTWFya2VyIG1vZGVscy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJvZiBMYXllclNlcnZpY2VcbiAgICAgKi9cbiAgICBwdWJsaWMgYWJzdHJhY3QgQ3JlYXRlTWFya2VycyhvcHRpb25zOiBBcnJheTxJTWFya2VyT3B0aW9ucz4sIG1hcmtlckljb24/OiBJTWFya2VySWNvbkluZm8pOiBQcm9taXNlPEFycmF5PE1hcmtlcj4+O1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIHBvbHlnb24gdG8gdGhlIGxheWVyLlxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGxheWVyIC0gVGhlIGlkIG9mIHRoZSBsYXllciB0byB3aGljaCB0byBhZGQgdGhlIGxpbmUuXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBQb2x5Z29uIG9wdGlvbnMgZGVmaW5pbmcgdGhlIGxpbmUuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGFuIGluc3RhbmNlIG9mIHRoZSBQb2x5Z29uIG1vZGVsLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIExheWVyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBhYnN0cmFjdCBDcmVhdGVQb2x5Z29uKGxheWVyOiBudW1iZXIsIG9wdGlvbnM6IElQb2x5Z29uT3B0aW9ucyk6IFByb21pc2U8UG9seWdvbj47XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGFycmF5IG9mIHVuYm91bmQgcG9seWdvbnMuIFVzZSB0aGlzIG1ldGhvZCB0byBjcmVhdGUgYXJyYXlzIG9mIHBvbHlnb25zIHRvIGJlIHVzZWQgaW4gYnVsa1xuICAgICAqIG9wZXJhdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBUaGUgaWQgb2YgdGhlIGxheWVyIHRvIHdoaWNoIHRvIGFkZCB0aGUgcG9seWdvbi5cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFBvbHlnb24gb3B0aW9ucyBkZWZpbmluZyB0aGUgcG9seWdvbnMuXG4gICAgICogQHJldHVybnMgLSBBIHByb21pc2UgdGhhdCB3aGVuIGZ1bGxmaWxsZWQgY29udGFpbnMgdGhlIGFuIGFycmF5cyBvZiB0aGUgUG9seWdvbiBtb2RlbHMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTGF5ZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIGFic3RyYWN0IENyZWF0ZVBvbHlnb25zKGxheWVyOiBudW1iZXIsIG9wdGlvbnM6IEFycmF5PElQb2x5Z29uT3B0aW9ucz4pOiBQcm9taXNlPEFycmF5PFBvbHlnb24+PjtcblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBwb2x5bGluZSB0byB0aGUgbGF5ZXIuXG4gICAgICpcbiAgICAgKiBAYWJzdHJhY3RcbiAgICAgKiBAcGFyYW0gbGF5ZXIgLSBUaGUgaWQgb2YgdGhlIGxheWVyIHRvIHdoaWNoIHRvIGFkZCB0aGUgbGluZS5cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFBvbHlsaW5lIG9wdGlvbnMgZGVmaW5pbmcgdGhlIG1hcmtlci5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IHdoZW4gZnVsbGZpbGxlZCBjb250YWlucyB0aGUgYW4gaW5zdGFuY2Ugb2YgdGhlIFBvbHlsaW5lIChvciBhblxuICAgICAqIGFycmF5IG9mIHBvbHlsaW5lcyBmb3IgY29tcGxleCBwYXRocykgbW9kZWwuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTGF5ZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIGFic3RyYWN0IENyZWF0ZVBvbHlsaW5lKGxheWVyOiBudW1iZXIsIG9wdGlvbnM6IElQb2x5Z29uT3B0aW9ucyk6IFByb21pc2U8UG9seWxpbmV8QXJyYXk8UG9seWxpbmU+PjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdW5ib3VuZCBwb2x5bGluZXMuIFVzZSB0aGlzIG1ldGhvZCB0byBjcmVhdGUgYXJyYXlzIG9mIHBvbHlsaW5lcyB0byBiZSB1c2VkIGluIGJ1bGtcbiAgICAgKiBvcGVyYXRpb25zLlxuICAgICAqXG4gICAgICogQHBhcmFtIGxheWVyIC0gVGhlIGlkIG9mIHRoZSBsYXllciB0byB3aGljaCB0byBhZGQgdGhlIHBvbHlsaW5lcy5cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFBvbHlsaW5lIG9wdGlvbnMgZGVmaW5pbmcgdGhlIHBvbHlsaW5lcy5cbiAgICAgKiBAcmV0dXJucyAtIEEgcHJvbWlzZSB0aGF0IHdoZW4gZnVsbGZpbGxlZCBjb250YWlucyB0aGUgYW4gYXJyYXlzIG9mIHRoZSBQb2x5bGluZSBtb2RlbHMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTGF5ZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIGFic3RyYWN0IENyZWF0ZVBvbHlsaW5lcyhsYXllcjogbnVtYmVyLCBvcHRpb25zOiBBcnJheTxJUG9seWxpbmVPcHRpb25zPik6IFByb21pc2U8QXJyYXk8UG9seWxpbmV8QXJyYXk8UG9seWxpbmU+Pj47XG5cbiAgICAvKipcbiAgICAgKiBEZWxldGVzIHRoZSBsYXllclxuICAgICAqXG4gICAgICogQGFic3RyYWN0XG4gICAgICogQHBhcmFtIGxheWVyIC0gTWFwTGF5ZXJEaXJlY3RpdmUgY29tcG9uZW50IG9iamVjdCBmb3Igd2hpY2ggdG8gcmV0cmlldmUgdGhlIGxheWVyLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgaXMgZnVsbGZpbGxlZCB3aGVuIHRoZSBsYXllciBoYXMgYmVlbiByZW1vdmVkLlxuICAgICAqXG4gICAgICogQG1lbWJlcm9mIExheWVyU2VydmljZVxuICAgICAqL1xuICAgIHB1YmxpYyBhYnN0cmFjdCBEZWxldGVMYXllcihsYXllcjogTWFwTGF5ZXJEaXJlY3RpdmUpOiBQcm9taXNlPHZvaWQ+O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgTGF5ZXIgbW9kZWwgcmVwcmVzZW50ZWQgYnkgdGhpcyBsYXllci5cbiAgICAgKlxuICAgICAqIEBhYnN0cmFjdFxuICAgICAqIEBwYXJhbSBsYXllciAtIE1hcExheWVyRGlyZWN0aXZlIGNvbXBvbmVudCBvYmplY3Qgb3IgTWFwTGF5ZXJJZCBmb3Igd2hpY2ggdG8gcmV0cmlldmUgdGhlIGxheWVyIG1vZGVsLlxuICAgICAqIEByZXR1cm5zIC0gQSBwcm9taXNlIHRoYXQgd2hlbiByZXNvbHZlZCBjb250YWlucyB0aGUgTGF5ZXIgbW9kZWwuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgTGF5ZXJTZXJ2aWNlXG4gICAgICovXG4gICAgcHVibGljIGFic3RyYWN0IEdldE5hdGl2ZUxheWVyKGxheWVyOiBNYXBMYXllckRpcmVjdGl2ZXxudW1iZXIpOiBQcm9taXNlPExheWVyPjtcbn1cbiJdfQ==