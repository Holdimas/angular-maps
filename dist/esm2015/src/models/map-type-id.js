export var MapTypeId;
(function (MapTypeId) {
    /** The aerial map type which uses top-down satellite & airplane imagery. */
    MapTypeId[MapTypeId["aerial"] = 0] = "aerial";
    /** A darker version of the road maps. */
    MapTypeId[MapTypeId["canvasDark"] = 1] = "canvasDark";
    /** A lighter version of the road maps which also has some of the details such as hill shading disabled. */
    MapTypeId[MapTypeId["canvasLight"] = 2] = "canvasLight";
    /** A grayscale version of the road maps. */
    MapTypeId[MapTypeId["grayscale"] = 3] = "grayscale";
    /** The aerial map type including lables */
    MapTypeId[MapTypeId["hybrid"] = 4] = "hybrid";
    /** Displays a blank canvas that uses the mercator map project. It basically removed the base maps layer. */
    MapTypeId[MapTypeId["mercator"] = 5] = "mercator";
    /** Ordnance survey map type (en-gb only). */
    MapTypeId[MapTypeId["ordnanceSurvey"] = 6] = "ordnanceSurvey";
    /** Road map type. */
    MapTypeId[MapTypeId["road"] = 7] = "road";
    /** Provides streetside panoramas from the street level. */
    MapTypeId[MapTypeId["streetside"] = 8] = "streetside";
})(MapTypeId || (MapTypeId = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLXR5cGUtaWQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvbW9kZWxzL21hcC10eXBlLWlkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBTixJQUFZLFNBNkJYO0FBN0JELFdBQVksU0FBUztJQUVqQiw0RUFBNEU7SUFDNUUsNkNBQU0sQ0FBQTtJQUVOLHlDQUF5QztJQUN6QyxxREFBVSxDQUFBO0lBRVYsMkdBQTJHO0lBQzNHLHVEQUFXLENBQUE7SUFFWCw0Q0FBNEM7SUFDNUMsbURBQVMsQ0FBQTtJQUVULDJDQUEyQztJQUMzQyw2Q0FBTSxDQUFBO0lBRU4sNEdBQTRHO0lBQzVHLGlEQUFRLENBQUE7SUFFUiw2Q0FBNkM7SUFDN0MsNkRBQWMsQ0FBQTtJQUVkLHFCQUFxQjtJQUNyQix5Q0FBSSxDQUFBO0lBRUosMkRBQTJEO0lBQzNELHFEQUFVLENBQUE7QUFFZCxDQUFDLEVBN0JXLFNBQVMsS0FBVCxTQUFTLFFBNkJwQiIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIE1hcFR5cGVJZCB7XG5cbiAgICAvKiogVGhlIGFlcmlhbCBtYXAgdHlwZSB3aGljaCB1c2VzIHRvcC1kb3duIHNhdGVsbGl0ZSAmIGFpcnBsYW5lIGltYWdlcnkuICovXG4gICAgYWVyaWFsLFxuXG4gICAgLyoqIEEgZGFya2VyIHZlcnNpb24gb2YgdGhlIHJvYWQgbWFwcy4gKi9cbiAgICBjYW52YXNEYXJrLFxuXG4gICAgLyoqIEEgbGlnaHRlciB2ZXJzaW9uIG9mIHRoZSByb2FkIG1hcHMgd2hpY2ggYWxzbyBoYXMgc29tZSBvZiB0aGUgZGV0YWlscyBzdWNoIGFzIGhpbGwgc2hhZGluZyBkaXNhYmxlZC4gKi9cbiAgICBjYW52YXNMaWdodCxcblxuICAgIC8qKiBBIGdyYXlzY2FsZSB2ZXJzaW9uIG9mIHRoZSByb2FkIG1hcHMuICovXG4gICAgZ3JheXNjYWxlLFxuXG4gICAgLyoqIFRoZSBhZXJpYWwgbWFwIHR5cGUgaW5jbHVkaW5nIGxhYmxlcyAqL1xuICAgIGh5YnJpZCxcblxuICAgIC8qKiBEaXNwbGF5cyBhIGJsYW5rIGNhbnZhcyB0aGF0IHVzZXMgdGhlIG1lcmNhdG9yIG1hcCBwcm9qZWN0LiBJdCBiYXNpY2FsbHkgcmVtb3ZlZCB0aGUgYmFzZSBtYXBzIGxheWVyLiAqL1xuICAgIG1lcmNhdG9yLFxuXG4gICAgLyoqIE9yZG5hbmNlIHN1cnZleSBtYXAgdHlwZSAoZW4tZ2Igb25seSkuICovXG4gICAgb3JkbmFuY2VTdXJ2ZXksXG5cbiAgICAvKiogUm9hZCBtYXAgdHlwZS4gKi9cbiAgICByb2FkLFxuXG4gICAgLyoqIFByb3ZpZGVzIHN0cmVldHNpZGUgcGFub3JhbWFzIGZyb20gdGhlIHN0cmVldCBsZXZlbC4gKi9cbiAgICBzdHJlZXRzaWRlXG5cbn1cbiJdfQ==