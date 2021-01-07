import { Injectable, EventEmitter, Directive, Input, Output, Component, ViewEncapsulation, ViewChild, ContentChildren, ViewContainerRef, ContentChild, ChangeDetectionStrategy, NgZone, HostBinding, Optional, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import 'bingmaps';
import { eachSeries, nextTick } from 'async';
import { timer, Observable, Subject } from 'rxjs';

class InfoWindow {
}

var MarkerTypeId;
(function (MarkerTypeId) {
    MarkerTypeId[MarkerTypeId["None"] = 0] = "None";
    MarkerTypeId[MarkerTypeId["FontMarker"] = 1] = "FontMarker";
    MarkerTypeId[MarkerTypeId["CanvasMarker"] = 2] = "CanvasMarker";
    MarkerTypeId[MarkerTypeId["DynamicCircleMarker"] = 3] = "DynamicCircleMarker";
    MarkerTypeId[MarkerTypeId["RotatedImageMarker"] = 4] = "RotatedImageMarker";
    MarkerTypeId[MarkerTypeId["RoundedImageMarker"] = 5] = "RoundedImageMarker";
    MarkerTypeId[MarkerTypeId["ScaledImageMarker"] = 6] = "ScaledImageMarker";
    MarkerTypeId[MarkerTypeId["Custom"] = 7] = "Custom";
})(MarkerTypeId || (MarkerTypeId = {}));

/**
 * This class defines the contract for a marker.
 *
 * @export
 * @abstract
 */
class Marker {
    /**
     * Creates a marker based on the marker info. In turn calls a number of internal members to
     * create the actual marker.
     *
     * @param iconInfo - icon information. Depending on the marker type, various properties
     * need to be present. For performance, it is recommended to use an id for markers that are common to facilitate
     * reuse.
     * @param callback - a callback that is invoked on markers that require asyncronous
     * processing during creation. For markers that do not require async processing, this parameter is ignored.
     * @returns - a string or a promise for a string containing
     * a data url with the marker image.
     * @memberof Marker
     */
    static CreateMarker(iconInfo) {
        switch (iconInfo.markerType) {
            case MarkerTypeId.CanvasMarker: return Marker.CreateCanvasMarker(iconInfo);
            case MarkerTypeId.DynamicCircleMarker: return Marker.CreateDynamicCircleMarker(iconInfo);
            case MarkerTypeId.FontMarker: return Marker.CreateFontBasedMarker(iconInfo);
            case MarkerTypeId.RotatedImageMarker: return Marker.CreateRotatedImageMarker(iconInfo);
            case MarkerTypeId.RoundedImageMarker: return Marker.CreateRoundedImageMarker(iconInfo);
            case MarkerTypeId.ScaledImageMarker: return Marker.CreateScaledImageMarker(iconInfo);
            case MarkerTypeId.Custom: throw Error('Custom Marker Creators are not currently supported.');
        }
        throw Error('Unsupported marker type: ' + iconInfo.markerType);
    }
    /**
     * Obtains a shared img element for a marker icon to prevent unecessary creation of
     * DOM items. This has sped up large scale makers on Bing Maps by about 70%
     * @param icon - The icon string (url, data url, svg) for which to obtain the image.
     * @returns - The obtained image element.
     * @memberof Marker
     */
    static GetImageForMarker(icon) {
        if (icon == null || icon === '') {
            return null;
        }
        let img = null;
        img = Marker.ImageElementCache.get(icon);
        if (img != null) {
            return img;
        }
        if (typeof (document) !== 'undefined' && document != null) {
            img = document.createElement('img');
            img.src = icon;
            Marker.ImageElementCache.set(icon, img);
        }
        return img;
    }
    /**
     * Creates a canvased based marker using the point collection contained in the iconInfo parameter.
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @returns - String with the data url for the marker image.
     *
     * @memberof Marker
     */
    static CreateCanvasMarker(iconInfo) {
        if (document == null) {
            throw Error('Document context (window.document) is required for canvas markers.');
        }
        if (iconInfo == null || iconInfo.size == null || iconInfo.points == null) {
            throw Error('IMarkerIconInfo.size, and IMarkerIConInfo.points are required for canvas markers.');
        }
        if (iconInfo.id != null && Marker.MarkerCache.has(iconInfo.id)) {
            const mi = Marker.MarkerCache.get(iconInfo.id);
            iconInfo.size = mi.markerSize;
            return mi.markerIconString;
        }
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        c.width = iconInfo.size.width;
        c.height = iconInfo.size.height;
        if (iconInfo.rotation) {
            // Offset the canvas such that we will rotate around the center of our arrow
            ctx.translate(c.width * 0.5, c.height * 0.5);
            // Rotate the canvas by the desired heading
            ctx.rotate(iconInfo.rotation * Math.PI / 180);
            // Return the canvas offset back to it's original position
            ctx.translate(-c.width * 0.5, -c.height * 0.5);
        }
        ctx.fillStyle = iconInfo.color || 'red';
        // Draw a path in the shape of an arrow.
        ctx.beginPath();
        if (iconInfo.drawingOffset) {
            ctx.moveTo(iconInfo.drawingOffset.x, iconInfo.drawingOffset.y);
        }
        iconInfo.points.forEach((p) => { ctx.lineTo(p.x, p.y); });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        const s = c.toDataURL();
        if (iconInfo.id != null) {
            Marker.MarkerCache.set(iconInfo.id, { markerIconString: s, markerSize: iconInfo.size });
        }
        return s;
    }
    /**
     * Creates a circle marker image using information contained in the iconInfo parameter.
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @returns - String with the data url for the marker image.
     *
     * @memberof Marker
     */
    static CreateDynamicCircleMarker(iconInfo) {
        if (document == null) {
            throw Error('Document context (window.document) is required for dynamic circle markers.');
        }
        if (iconInfo == null || iconInfo.size == null) {
            throw Error('IMarkerIconInfo.size is required for dynamic circle markers.');
        }
        if (iconInfo.id != null && Marker.MarkerCache.has(iconInfo.id)) {
            const mi = Marker.MarkerCache.get(iconInfo.id);
            iconInfo.size = mi.markerSize;
            return mi.markerIconString;
        }
        const strokeWidth = iconInfo.strokeWidth || 0;
        // Create an SVG string of a circle with the specified radius and color.
        const svg = [
            '<svg xmlns="http://www.w3.org/2000/svg" width="',
            iconInfo.size.width.toString(),
            '" height="',
            iconInfo.size.width.toString(),
            '"><circle cx="',
            (iconInfo.size.width / 2).toString(),
            '" cy="',
            (iconInfo.size.width / 2).toString(),
            '" r="',
            ((iconInfo.size.width / 2) - strokeWidth).toString(),
            '" stroke="',
            iconInfo.color || 'red',
            '" stroke-width="',
            strokeWidth.toString(),
            '" fill="',
            iconInfo.color || 'red',
            '"/></svg>'
        ];
        const s = svg.join('');
        if (iconInfo.id != null) {
            Marker.MarkerCache.set(iconInfo.id, { markerIconString: s, markerSize: iconInfo.size });
        }
        return s;
    }
    /**
     * Creates a font based marker image (such as Font-Awesome), by using information supplied in the parameters (such as Font-Awesome).
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @returns - String with the data url for the marker image.
     *
     * @memberof Marker
     */
    static CreateFontBasedMarker(iconInfo) {
        if (document == null) {
            throw Error('Document context (window.document) is required for font based markers');
        }
        if (iconInfo == null || iconInfo.fontName == null || iconInfo.fontSize == null) {
            throw Error('IMarkerIconInfo.fontName, IMarkerIconInfo.fontSize and IMarkerIConInfo.text are required for font based markers.');
        }
        if (iconInfo.id != null && Marker.MarkerCache.has(iconInfo.id)) {
            const mi = Marker.MarkerCache.get(iconInfo.id);
            iconInfo.size = mi.markerSize;
            return mi.markerIconString;
        }
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        const font = iconInfo.fontSize + 'px ' + iconInfo.fontName;
        ctx.font = font;
        // Resize canvas based on sie of text.
        const size = ctx.measureText(iconInfo.text);
        c.width = size.width;
        c.height = iconInfo.fontSize;
        if (iconInfo.rotation) {
            // Offset the canvas such that we will rotate around the center of our arrow
            ctx.translate(c.width * 0.5, c.height * 0.5);
            // Rotate the canvas by the desired heading
            ctx.rotate(iconInfo.rotation * Math.PI / 180);
            // Return the canvas offset back to it's original position
            ctx.translate(-c.width * 0.5, -c.height * 0.5);
        }
        // Reset font as it will be cleared by the resize.
        ctx.font = font;
        ctx.textBaseline = 'top';
        ctx.fillStyle = iconInfo.color || 'red';
        ctx.fillText(iconInfo.text, 0, 0);
        iconInfo.size = { width: c.width, height: c.height };
        const s = c.toDataURL();
        if (iconInfo.id != null) {
            Marker.MarkerCache.set(iconInfo.id, { markerIconString: s, markerSize: iconInfo.size });
        }
        return s;
    }
    /**
     * Creates an image marker by applying a roation to a supplied image.
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @returns - a string or a promise for a string containing
     * a data url with the marker image. In case of a cached image, the image will be returned, otherwise the promise.
     *
     * @memberof Marker
     */
    static CreateRotatedImageMarker(iconInfo) {
        if (document == null) {
            throw Error('Document context (window.document) is required for rotated image markers');
        }
        if (iconInfo == null || iconInfo.rotation == null || iconInfo.url == null) {
            throw Error('IMarkerIconInfo.rotation, IMarkerIconInfo.url are required for rotated image markers.');
        }
        if (iconInfo.id != null && Marker.MarkerCache.has(iconInfo.id)) {
            const mi = Marker.MarkerCache.get(iconInfo.id);
            iconInfo.size = mi.markerSize;
            return mi.markerIconString;
        }
        const image = new Image();
        const promise = new Promise((resolve, reject) => {
            // Allow cross domain image editting.
            image.crossOrigin = 'anonymous';
            image.src = iconInfo.url;
            if (iconInfo.size) {
                image.width = iconInfo.size.width;
                image.height = iconInfo.size.height;
            }
            image.onload = function () {
                const c = document.createElement('canvas');
                const ctx = c.getContext('2d');
                const rads = iconInfo.rotation * Math.PI / 180;
                // Calculate rotated image size.
                c.width = Math.ceil(Math.abs(image.width * Math.cos(rads)) + Math.abs(image.height * Math.sin(rads)));
                c.height = Math.ceil(Math.abs(image.width * Math.sin(rads)) + Math.abs(image.height * Math.cos(rads)));
                // Move to the center of the canvas.
                ctx.translate(c.width / 2, c.height / 2);
                // Rotate the canvas to the specified angle in degrees.
                ctx.rotate(rads);
                // Draw the image, since the context is rotated, the image will be rotated also.
                ctx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
                iconInfo.size = { width: c.width, height: c.height };
                const s = c.toDataURL();
                if (iconInfo.id != null) {
                    Marker.MarkerCache.set(iconInfo.id, { markerIconString: s, markerSize: iconInfo.size });
                }
                resolve({ icon: s, iconInfo: iconInfo });
            };
        });
        return promise;
    }
    /**
     * Creates a rounded image marker by applying a circle mask to a supplied image.
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @param iconInfo - Callback invoked once marker generation is complete. The callback
     * parameters are the data uri and the IMarkerIconInfo.
     * @returns - a string or a promise for a string containing
     * a data url with the marker image. In case of a cached image, the image will be returned, otherwise the promise.
     *
     * @memberof Marker
     */
    static CreateRoundedImageMarker(iconInfo) {
        if (document == null) {
            throw Error('Document context (window.document) is required for rounded image markers');
        }
        if (iconInfo == null || iconInfo.size == null || iconInfo.url == null) {
            throw Error('IMarkerIconInfo.size, IMarkerIconInfo.url are required for rounded image markers.');
        }
        if (iconInfo.id != null && Marker.MarkerCache.has(iconInfo.id)) {
            const mi = Marker.MarkerCache.get(iconInfo.id);
            iconInfo.size = mi.markerSize;
            return mi.markerIconString;
        }
        const promise = new Promise((resolve, reject) => {
            const radius = iconInfo.size.width / 2;
            const image = new Image();
            const offset = iconInfo.drawingOffset || { x: 0, y: 0 };
            // Allow cross domain image editting.
            image.crossOrigin = 'anonymous';
            image.src = iconInfo.url;
            image.onload = function () {
                const c = document.createElement('canvas');
                const ctx = c.getContext('2d');
                c.width = iconInfo.size.width;
                c.height = iconInfo.size.width;
                // Draw a circle which can be used to clip the image, then draw the image.
                ctx.beginPath();
                ctx.arc(radius, radius, radius, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.clip();
                ctx.drawImage(image, offset.x, offset.y, iconInfo.size.width, iconInfo.size.width);
                iconInfo.size = { width: c.width, height: c.height };
                const s = c.toDataURL();
                if (iconInfo.id != null) {
                    Marker.MarkerCache.set(iconInfo.id, { markerIconString: s, markerSize: iconInfo.size });
                }
                resolve({ icon: s, iconInfo: iconInfo });
            };
        });
        return promise;
    }
    /**
     * Creates a scaled image marker by scaling a supplied image by a factor using a canvas.
     *
     * @protected
     * @param iconInfo - {@link IMarkerIconInfo} containing the information necessary to create the icon.
     * @param iconInfo - Callback invoked once marker generation is complete. The callback
     * parameters are the data uri and the IMarkerIconInfo.
     * @returns - a string or a promise for a string containing
     * a data url with the marker image. In case of a cached image, the image will be returned, otherwise the promise.
     *
     * @memberof Marker
     */
    static CreateScaledImageMarker(iconInfo) {
        if (document == null) {
            throw Error('Document context (window.document) is required for scaled image markers');
        }
        if (iconInfo == null || iconInfo.scale == null || iconInfo.url == null) {
            throw Error('IMarkerIconInfo.scale, IMarkerIconInfo.url are required for scaled image markers.');
        }
        if (iconInfo.id != null && Marker.MarkerCache.has(iconInfo.id)) {
            const mi = Marker.MarkerCache.get(iconInfo.id);
            iconInfo.size = mi.markerSize;
            return mi.markerIconString;
        }
        const promise = new Promise((resolve, reject) => {
            const image = new Image();
            // Allow cross domain image editting.
            image.crossOrigin = 'anonymous';
            image.src = iconInfo.url;
            image.onload = function () {
                const c = document.createElement('canvas');
                const ctx = c.getContext('2d');
                c.width = image.width * iconInfo.scale;
                c.height = image.height * iconInfo.scale;
                // Draw a circle which can be used to clip the image, then draw the image.
                ctx.drawImage(image, 0, 0, c.width, c.height);
                iconInfo.size = { width: c.width, height: c.height };
                const s = c.toDataURL();
                if (iconInfo.id != null) {
                    Marker.MarkerCache.set(iconInfo.id, { markerIconString: s, markerSize: iconInfo.size });
                }
                resolve({ icon: s, iconInfo: iconInfo });
            };
        });
        return promise;
    }
}
///
/// Field definitions
///
/**
 * Caches concrete img elements for marker icons to accelerate patining.
 *
 * @memberof Marker
 */
Marker.ImageElementCache = new Map();
/**
 * Used to cache generated markers for performance and reusability.
 *
 * @memberof Marker
 */
Marker.MarkerCache = new Map();

var MapTypeId;
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

/**
 * Defines the contract for a map layer implementation. Deriving providers should implements this abstract
 * to provide concrete layer functionality for the map.
 *
 * @export
 * @abstract
 */
class Layer {
}

/**
 * Abstract class defining the contract for a polygon in the architecture specific implementation.
 *
 * @export
 * @abstract
 */
class Polygon {
    ///
    /// Property definitions
    ///
    /**
     * Gets the polygon's center.
     * @readonly
     * @memberof Polygon
     */
    get Center() {
        if (this._center == null) {
            this._center = this.GetBoundingCenter();
        }
        return this._center;
    }
    /**
     * Gets the polygon's centroid.
     * @readonly
     * @memberof Polygon
     */
    get Centroid() {
        if (this._centroid == null) {
            this._centroid = this.GetPolygonCentroid();
        }
        return this._centroid;
    }
    ///
    /// Protected methods
    ///
    /**
     * Gets the center of the polygons' bounding box.
     *
     * @returns - ILatLong object containing the center of the bounding box.
     * @memberof Polygon
     * @method
     * @protected
     */
    GetBoundingCenter() {
        let c = { latitude: 0, longitude: 0 };
        let x1 = 90, x2 = -90, y1 = 180, y2 = -180;
        const path = this.GetPaths();
        if (path) {
            path.forEach(inner => inner.forEach(p => {
                if (p.latitude < x1) {
                    x1 = p.latitude;
                }
                if (p.latitude > x2) {
                    x2 = p.latitude;
                }
                if (p.longitude < y1) {
                    y1 = p.longitude;
                }
                if (p.longitude > y2) {
                    y2 = p.longitude;
                }
            }));
            c.latitude = x1 + (x2 - x1) / 2;
            c.longitude = y1 + (y2 - y1) / 2;
        }
        else {
            c = null;
        }
        return c;
    }
    /**
     * Get the centroid of the polygon based on the polygon path.
     *
     * @returns - The centroid coordinates of the polygon.
     * @memberof Polygon
     * @method
     * @protected
     */
    GetPolygonCentroid() {
        let c = { latitude: 0, longitude: 0 };
        const path = this.GetPaths();
        const off = path[0][0];
        if (off != null) {
            let twicearea = 0;
            let x = 0;
            let y = 0;
            let p1, p2;
            let f;
            for (let k = 0; k < path.length; k++) {
                for (let i = 0, j = path[k].length - 1; i < path[k].length; j = i++) {
                    p1 = path[k][i];
                    p2 = path[k][j];
                    f = (p1.latitude - off.latitude) * (p2.longitude - off.longitude) -
                        (p2.latitude - off.latitude) * (p1.longitude - off.longitude);
                    twicearea += f;
                    x += (p1.latitude + p2.latitude - 2 * off.latitude) * f;
                    y += (p1.longitude + p2.longitude - 2 * off.longitude) * f;
                }
            }
            if (twicearea !== 0) {
                f = twicearea * 3;
                c.latitude = x / f + off.latitude;
                c.longitude = y / f + off.longitude;
            }
            else {
                c.latitude = off.latitude;
                c.longitude = off.longitude;
            }
        }
        else {
            c = null;
        }
        return c;
    }
}

/**
 * Abstract class defining the contract for a polyline in the architecture specific implementation.
 *
 * @export
 * @abstract
 */
class Polyline {
    ///
    /// Property definitions
    ///
    /**
     * Gets the polyline's center.
     * @readonly
     * @memberof Polyline
     */
    get Center() {
        if (this._center == null) {
            this._center = this.GetBoundingCenter();
        }
        return this._center;
    }
    /**
     * Gets the polyline's centroid.
     * @readonly
     * @memberof Polyline
     */
    get Centroid() {
        if (this._centroid == null) {
            this._centroid = this.GetPolylineCentroid();
        }
        return this._centroid;
    }
    ///
    /// Public methods
    ///
    /**
     * Get the centroid of the polyline based on the a path.
     *
     * @param path - the path for which to generate the centroid
     * @returns - The centroid coordinates of the polyline.
     * @memberof Polyline
     * @method
     */
    static GetPolylineCentroid(path) {
        let c = { latitude: 0, longitude: 0 };
        const off = path[0];
        if (off != null) {
            let twicearea = 0;
            let x = 0;
            let y = 0;
            let p1, p2;
            let f;
            for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
                p1 = path[i];
                p2 = path[j];
                f = (p1.latitude - off.latitude) * (p2.longitude - off.longitude) -
                    (p2.latitude - off.latitude) * (p1.longitude - off.longitude);
                twicearea += f;
                x += (p1.latitude + p2.latitude - 2 * off.latitude) * f;
                y += (p1.longitude + p2.longitude - 2 * off.longitude) * f;
            }
            if (twicearea !== 0) {
                f = twicearea * 3;
                c.latitude = x / f + off.latitude;
                c.longitude = y / f + off.longitude;
            }
            else {
                c.latitude = off.latitude;
                c.longitude = off.longitude;
            }
        }
        else {
            c = null;
        }
        return c;
    }
    ///
    /// Protected methods
    ///
    /**
     * Gets the center of the polyline' bounding box.
     *
     * @returns - {@link ILatLong} object containing the center of the bounding box.
     * @memberof Polyline
     * @method
     * @protected
     */
    GetBoundingCenter() {
        let c = { latitude: 0, longitude: 0 };
        let x1 = 90, x2 = -90, y1 = 180, y2 = -180;
        const path = this.GetPath();
        if (path) {
            path.forEach(p => {
                if (p.latitude < x1) {
                    x1 = p.latitude;
                }
                if (p.latitude > x2) {
                    x2 = p.latitude;
                }
                if (p.longitude < y1) {
                    y1 = p.longitude;
                }
                if (p.longitude > y2) {
                    y2 = p.longitude;
                }
            });
            c.latitude = x1 + (x2 - x1) / 2;
            c.longitude = y1 + (y2 - y1) / 2;
        }
        else {
            c = null;
        }
        return c;
    }
    /**
     * Get the centroid of the polyline based on the polyline path.
     *
     * @returns - The centroid coordinates of the polyline.
     * @memberof Polyline
     * @method
     * @protected
     */
    GetPolylineCentroid() {
        const path = this.GetPath();
        const c = Polyline.GetPolylineCentroid(path);
        return c;
    }
}

class SpiderClusterMarker extends Marker {
}

var ClusterPlacementMode;
(function (ClusterPlacementMode) {
    ClusterPlacementMode[ClusterPlacementMode["None"] = 0] = "None";
    ClusterPlacementMode[ClusterPlacementMode["MeanValue"] = 1] = "MeanValue";
    ClusterPlacementMode[ClusterPlacementMode["FirstPin"] = 2] = "FirstPin";
})(ClusterPlacementMode || (ClusterPlacementMode = {}));

var ClusterClickAction;
(function (ClusterClickAction) {
    ClusterClickAction[ClusterClickAction["None"] = 0] = "None";
    ClusterClickAction[ClusterClickAction["ZoomIntoCluster"] = 1] = "ZoomIntoCluster";
    ClusterClickAction[ClusterClickAction["Spider"] = 2] = "Spider";
})(ClusterClickAction || (ClusterClickAction = {}));

let id = 0;
/**
 * Abstract base implementing a canvas overlay to be placed on the map.
 *
 * @export
 * @abstract
 */
class CanvasOverlay {
    /**
     * Creates a new instance of the CanvasOverlay class.
     */
    constructor(drawCallback) {
        this._canvasReady = new Promise((resolve, reject) => { this._readyResolver = resolve; });
        this._drawCallback = drawCallback;
        id++;
    }
    /**
     * Returns a promise that gets resolved when the canvas overlay is ready for interaction.
     */
    get CanvasReady() { return this._canvasReady; }
    ///
    /// Public methods
    ///
    /**
     * Deletes the canvas overlay.
     */
    Delete() {
        this.SetMap(null);
    }
    /**
     * CanvasOverlay added to map, load canvas.
     */
    OnAdd() {
        this._canvas = document.createElement('canvas');
        this._canvas.style.position = 'absolute';
        this._canvas.style.left = '0px';
        this._canvas.style.top = '0px';
        this._canvas.id = `xMapOverlay${id}`;
        // Add the canvas to the overlay.
        this.SetCanvasElement(this._canvas);
    }
    /**
     * When the CanvasLayer is removed from the map, release resources.
     * @memberof CanvasOverlay
     * @method
     */
    OnRemove() {
        this.SetCanvasElement(null);
        this.RemoveEventHandlers();
        this._canvas = null;
    }
    /**
     * Redraws the canvas for the current map view.
     * @param clear - True to clear the canvas before drawing.
     * @memberof CanvasOverlay
     * @method
     */
    Redraw(clear) {
        if (this._canvas == null) {
            return;
        }
        // Clear canvas by updating dimensions. This also ensures canvas stays the same size as the map.
        if (clear) {
            this.Resize();
        }
        // Call the drawing callback function if specified.
        if (this._drawCallback) {
            this._drawCallback(this._canvas);
        }
    }
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
    UpdatePosition(x, y, w, h) {
        // Update CSS position.
        this._canvas.style.left = x + 'px';
        this._canvas.style.top = y + 'px';
        // Update CSS dimensions.
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
    }
}

/**
 * Concrete implementation of a map layer for the Bing Map Provider.
 *
 * @export
 */
class BingLayer {
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

/**
 * This class contains helperfunctions to map various interfaces used to represent options and structures into the
 * corresponding Bing Maps V8 specific implementations.
 *
 * @export
 */
class BingConversions {
    ///
    /// Public methods
    ///
    /**
     * Maps an IInfoWindowAction to a Microsoft.Maps.IInfoboxActions
     *
     * @param action - Object to be mapped.
     * @returns - Navtive mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateAction(action) {
        const a = {
            eventHandler: action.eventHandler,
            label: action.label
        };
        return a;
    }
    /**
     * Maps an Array of IInfoWindowAction to an Array of Microsoft.Maps.IInfoboxActions
     *
     * @param actions - Array of objects to be mapped.
     * @returns - Array of mapped objects.
     *
     * @memberof BingConversions
     */
    static TranslateActions(actions) {
        const a = new Array();
        actions.forEach(x => a.push(BingConversions.TranslateAction(x)));
        return a;
    }
    /**
     * Maps an IBox object to a Microsoft.Maps.LocationRect object.
     *
     * @param box - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateBounds(box) {
        const r = Microsoft.Maps.LocationRect.fromEdges(box.maxLatitude, box.minLongitude, box.minLatitude, box.maxLongitude);
        return r;
    }
    /**
     * Maps an IClusterOptions object to a Microsoft.Maps.IClusterLayerOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateClusterOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => BingConversions._clusterOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'layerOffset') {
                o.layerOffset = BingConversions.TranslatePoint(options.layerOffset);
            }
            if (k === 'placementMode') {
                if (options.placementMode === ClusterPlacementMode.FirstPin) {
                    o.placementMode = Microsoft.Maps.ClusterPlacementType.FirstLocation;
                }
                else {
                    o.placementMode = Microsoft.Maps.ClusterPlacementType.MeanAverage;
                }
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an IInfoWindowOptions object to a Microsoft.Maps.IInfoboxOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateInfoBoxOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => BingConversions._infoWindowOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'pixelOffset') {
                o.offset = BingConversions.TranslatePoint(options.pixelOffset);
            }
            else if (k === 'position') {
                o.location = BingConversions.TranslateLocation(options.position);
            }
            else if (k === 'actions') {
                o.actions = BingConversions.TranslateActions(options.actions);
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an IMapOptions object to a Microsoft.Maps.IMapLoadOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateLoadOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => {
            return BingConversions._mapOptionsAttributes.indexOf(k) !== -1 || BingConversions._viewOptionsAttributes.indexOf(k) !== -1;
        })
            .forEach((k) => {
            if (k === 'center') {
                o.center = BingConversions.TranslateLocation(options.center);
            }
            else if (k === 'mapTypeId') {
                if (options.mapTypeId === MapTypeId.hybrid) {
                    o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                    o.labelOverlay = Microsoft.Maps.LabelOverlay.visible;
                }
                else if (options.mapTypeId === MapTypeId.aerial) {
                    o.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                    o.labelOverlay = Microsoft.Maps.LabelOverlay.hidden;
                }
                else {
                    o.mapTypeId = Microsoft.Maps.MapTypeId[MapTypeId[options.mapTypeId]];
                }
            }
            else if (k === 'bounds') {
                o.bounds = BingConversions.TranslateBounds(options.bounds);
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an ILatLong object to a Microsoft.Maps.Location object.
     *
     * @param latlong - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateLocation(latlong) {
        const l = new Microsoft.Maps.Location(latlong.latitude, latlong.longitude);
        return l;
    }
    /**
     * Maps an IMarkerOptions object to a Microsoft.Maps.IPushpinOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - The mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateMarkerOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => BingConversions._markerOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'anchor') {
                o.anchor = BingConversions.TranslatePoint(options.anchor);
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an IMapOptions object to a Microsoft.Maps.IMapOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => BingConversions._mapOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'center') {
                o.center = BingConversions.TranslateLocation(options.center);
            }
            else if (k === 'mapTypeId') {
                o.mapTypeId = Microsoft.Maps.MapTypeId[MapTypeId[options.mapTypeId]];
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Translates an array of locations or an array or arrays of location to and array of arrays of Bing Map Locations
     *
     * @param paths - ILatLong based locations to convert.
     * @returns - converted locations.
     *
     * @memberof BingConversions
     */
    static TranslatePaths(paths) {
        const p = new Array();
        if (paths == null || !Array.isArray(paths) || paths.length === 0) {
            p.push(new Array());
        }
        else if (Array.isArray(paths[0])) {
            // parameter is an array or arrays
            // us for loop for performance
            const p1 = paths;
            for (let i = 0; i < p1.length; i++) {
                const _p = new Array();
                for (let j = 0; j < p1[i].length; j++) {
                    _p.push(new Microsoft.Maps.Location(p1[i][j].latitude, p1[i][j].longitude));
                }
                p.push(_p);
            }
        }
        else {
            // parameter is a simple array....
            const y = new Array();
            const p1 = paths;
            for (let i = 0; i < p1.length; i++) {
                y.push(new Microsoft.Maps.Location(p1[i].latitude, p1[i].longitude));
            }
            p.push(y);
        }
        return p;
    }
    /**
     *  Maps an IPoint object to a Microsoft.Maps.Point object.
     *
     * @param point - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslatePoint(point) {
        const p = new Microsoft.Maps.Point(point.x, point.y);
        return p;
    }
    /**
     *  Maps an IPolygonOptions object to a Microsoft.Maps.IPolygonOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslatePolygonOptions(options) {
        const o = {};
        const f = (s, a) => {
            const m = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(s);
            if (m && m.length > 3) {
                a = a > 1 ? (a / 100) : a;
                return 'rgba(' + [m[1], m[2], m[3], a].join(',') + ')';
            }
            else if (s[0] === '#') {
                const x = a > 1 ? a : Math.floor(a * 255);
                const z = s.substr(1);
                const r = parseInt(z.substr(0, 2), 16);
                const g = parseInt(z.substr(2, 2), 16);
                const b = parseInt(z.substr(4, 2), 16);
                return 'rgba(' + [r, g, b, a].join(',') + ')';
            }
            else {
                return s;
            }
        };
        Object.keys(options)
            .filter(k => BingConversions._polygonOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'strokeWeight') {
                o.strokeThickness = options.strokeWeight;
            }
            else if (k === 'strokeColor') {
                if (options.strokeOpacity) {
                    o.strokeColor = f(options.strokeColor, options.strokeOpacity);
                }
                else {
                    o.strokeColor = options.strokeColor;
                }
            }
            else if (k === 'strokeOpacity') { }
            else if (k === 'fillColor') {
                if (options.fillOpacity) {
                    o.fillColor = f(options.fillColor, options.fillOpacity);
                }
                else {
                    o.fillColor = options.fillColor;
                }
            }
            else if (k === 'fillOpacity') { }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     *  Maps an IPolylineOptions object to a Microsoft.Maps.IPolylineOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslatePolylineOptions(options) {
        const o = {};
        const f = (s, a) => {
            const m = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(s);
            if (m && m.length > 3) {
                a = a > 1 ? (a / 100) : a;
                return 'rgba(' + [m[1], m[2], m[3], a].join(',') + ')';
            }
            else if (s[0] === '#') {
                const x = a > 1 ? a : Math.floor(a * 255);
                const z = s.substr(1);
                const r = parseInt(z.substr(0, 2), 16);
                const g = parseInt(z.substr(2, 2), 16);
                const b = parseInt(z.substr(4, 2), 16);
                return 'rgba(' + [r, g, b, a].join(',') + ')';
            }
            else {
                return s;
            }
        };
        Object.keys(options)
            .filter(k => BingConversions._polylineOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'strokeWeight') {
                o.strokeThickness = options.strokeWeight;
            }
            else if (k === 'strokeColor') {
                if (options.strokeOpacity) {
                    o.strokeColor = f(options.strokeColor, options.strokeOpacity);
                }
                else {
                    o.strokeColor = options.strokeColor;
                }
            }
            else if (k === 'strokeOpacity') {
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an IMapOptions object to a Microsoft.Maps.IViewOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof BingConversions
     */
    static TranslateViewOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => BingConversions._viewOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'center') {
                o.center = BingConversions.TranslateLocation(options.center);
            }
            else if (k === 'bounds') {
                o.bounds = BingConversions.TranslateBounds(options.bounds);
            }
            else if (k === 'centerOffset') {
                o.centerOffset = BingConversions.TranslatePoint(options.centerOffset);
            }
            else if (k === 'mapTypeId') {
                o.mapTypeId = Microsoft.Maps.MapTypeId[MapTypeId[options.mapTypeId]];
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
}
///
/// Field declarations
///
/**
 * Map option attributes that are supported for conversion to Bing Map properties
 *
 * @memberof BingConversions
 */
BingConversions._mapOptionsAttributes = [
    'backgroundColor',
    'credentials',
    'customizeOverlays',
    'customMapStyle',
    'disableBirdseye',
    'disableKeyboardInput',
    'disableMouseInput',
    'disablePanning',
    'disableTouchInput',
    'disableUserInput',
    'disableZooming',
    'disableStreetside',
    'enableClickableLogo',
    'enableSearchLogo',
    'fixedMapPosition',
    'height',
    'inertiaIntensity',
    'navigationBarMode',
    'showBreadcrumb',
    'showCopyright',
    'showDashboard',
    'showMapTypeSelector',
    'showScalebar',
    'theme',
    'tileBuffer',
    'useInertia',
    'width',
    'center',
    'zoom',
    'mapTypeId',
    'liteMode'
];
/**
 * View option attributes that are supported for conversion to Bing Map properties
 *
 * @memberof BingConversions
 */
BingConversions._viewOptionsAttributes = [
    'animate',
    'bounds',
    'center',
    'centerOffset',
    'heading',
    'labelOverlay',
    'mapTypeId',
    'padding',
    'zoom'
];
/**
 * InfoWindow option attributes that are supported for conversion to Bing Map properties
 *
 * @memberof BingConversions
 */
BingConversions._infoWindowOptionsAttributes = [
    'actions',
    'description',
    'htmlContent',
    'id',
    'position',
    'pixelOffset',
    'showCloseButton',
    'showPointer',
    'pushpin',
    'title',
    'titleClickHandler',
    'typeName',
    'visible',
    'width',
    'height'
];
/**
 * Marker option attributes that are supported for conversion to Bing Map properties
 *
 * @memberof BingConversions
 */
BingConversions._markerOptionsAttributes = [
    'anchor',
    'draggable',
    'height',
    'htmlContent',
    'icon',
    'infobox',
    'state',
    'title',
    'textOffset',
    'typeName',
    'visible',
    'width',
    'zIndex'
];
/**
 * Polygon option attributes that are supported for conversion to Bing Map Polygon properties
 *
 * @memberof BingConversions
 */
BingConversions._polygonOptionsAttributes = [
    'cursor',
    'fillColor',
    'fillOpacity',
    'strokeColor',
    'strokeOpacity',
    'strokeWeight',
    'visible'
];
/**
 * Polyline option attributes that are supported for conversion to Bing Map Polyline properties
 *
 * @memberof BingConversions
 */
BingConversions._polylineOptionsAttributes = [
    'cursor',
    'strokeColor',
    'strokeOpacity',
    'strokeWeight',
    'visible'
];
/**
 * Cluster option attributes that are supported for conversion to Bing Map properties
 *
 * @memberof BingConversions
 */
BingConversions._clusterOptionsAttributes = [
    'callback',
    'clusteredPinCallback',
    'clusteringEnabled',
    'gridSize',
    'layerOffset',
    'placementMode',
    'visible',
    'zIndex'
];

/**
 * Concrete implementation of the {@link Marker} contract for the Bing Maps V8 map architecture.
 *
 * @export
 */
class BingMarker {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingMarker.
     * @param _pushpin - The {@link Microsoft.Maps.Pushpin} underlying the model.
     * @param _map - The context map.
     * @param _layer - The context layer.
     *
     * @memberof BingMarker
     */
    constructor(_pushpin, _map, _layer) {
        this._pushpin = _pushpin;
        this._map = _map;
        this._layer = _layer;
        ///
        /// Field definitions
        ///
        this._metadata = new Map();
        this._isFirst = false;
        this._isLast = true;
    }
    ///
    /// Property definitions
    ///
    /**
     * Indicates that the marker is the first marker in a set.
     *
     * @memberof Marker
     */
    get IsFirst() { return this._isFirst; }
    set IsFirst(val) { this._isFirst = val; }
    /**
     * Indicates that the marker is the last marker in the set.
     *
     * @memberof Marker
     */
    get IsLast() { return this._isLast; }
    set IsLast(val) { this._isLast = val; }
    /**
     * Gets the Location of the marker
     *
     * @readonly
     * @memberof BingMarker
     */
    get Location() {
        const l = this._pushpin.getLocation();
        return {
            latitude: l.latitude,
            longitude: l.longitude
        };
    }
    /**
     * Gets the marker metadata.
     *
     * @readonly
     * @memberof BingMarker
     */
    get Metadata() { return this._metadata; }
    /**
     * Gets the native primitve implementing the marker, in this case {@link Microsoft.Maps.Pushpin}
     *
     * @readonly
     * @memberof BingMarker
     */
    get NativePrimitve() { return this._pushpin; }
    ///
    /// Public methods
    ///
    /**
     * Adds an event listener to the marker.
     *
     * @abstract
     * @param eventType - String containing the event for which to register the listener (e.g. "click")
     * @param fn - Delegate invoked when the event occurs.
     *
     * @memberof BingMarker
     */
    AddListener(eventType, fn) {
        Microsoft.Maps.Events.addHandler(this._pushpin, eventType, (e) => {
            fn(e);
        });
    }
    /**
     * Deletes the marker.
     *
     * @abstract
     *
     * @memberof BingMarker
     */
    DeleteMarker() {
        if (!this._map && !this._layer) {
            return;
        }
        if (this._layer) {
            this._layer.remove(this.NativePrimitve);
        }
        else {
            this._map.entities.remove(this.NativePrimitve);
        }
    }
    /**
     * Gets the marker label
     *
     * @abstract
     *
     * @memberof BingMarker
     */
    GetLabel() {
        return this._pushpin.getText();
    }
    /**
     * Gets whether the marker is visible.
     *
     * @returns - True if the marker is visible, false otherwise.
     *
     * @memberof BingMarker
     */
    GetVisible() {
        return this._pushpin.getVisible();
    }
    /**
     * Sets the anchor for the marker. Use this to adjust the root location for the marker to accomodate various marker image sizes.
     *
     * @abstract
     * @param anchor - Point coordinates for the marker anchor.
     *
     * @memberof BingMarker
     */
    SetAnchor(anchor) {
        const o = {};
        o.anchor = new Microsoft.Maps.Point(anchor.x, anchor.y);
        this._pushpin.setOptions(o);
    }
    /**
     * Sets the draggability of a marker.
     *
     * @abstract
     * @param draggable - True to mark the marker as draggable, false otherwise.
     *
     * @memberof BingMarker
     */
    SetDraggable(draggable) {
        const o = {};
        o.draggable = draggable;
        this._pushpin.setOptions(o);
    }
    /**
     * Sets the icon for the marker.
     *
     * @abstract
     * @param icon - String containing the icon in various forms (url, data url, etc.)
     *
     * @memberof BingMarker
     */
    SetIcon(icon) {
        const o = {};
        o.icon = icon;
        this._pushpin.setOptions(o);
    }
    /**
     * Sets the marker label.
     *
     * @abstract
     * @param label - String containing the label to set.
     *
     * @memberof BingMarker
     */
    SetLabel(label) {
        const o = {};
        o.text = label;
        this._pushpin.setOptions(o);
    }
    /**
     * Sets the marker position.
     *
     * @abstract
     * @param latLng - Geo coordinates to set the marker position to.
     *
     * @memberof BingMarker
     */
    SetPosition(latLng) {
        const p = BingConversions.TranslateLocation(latLng);
        this._pushpin.setLocation(p);
    }
    /**
     * Sets the marker title.
     *
     * @abstract
     * @param title - String containing the title to set.
     *
     * @memberof BingMarker
     */
    SetTitle(title) {
        const o = {};
        o.title = title;
        this._pushpin.setOptions(o);
    }
    /**
     * Sets the marker options.
     *
     * @abstract
     * @param options - {@link IMarkerOptions} object containing the marker options to set. The supplied options are
     * merged with the underlying marker options.
     * @memberof Marker
     */
    SetOptions(options) {
        const o = BingConversions.TranslateMarkerOptions(options);
        this._pushpin.setOptions(o);
    }
    /**
     * Sets whether the marker is visible.
     *
     * @param visible - True to set the marker visible, false otherwise.
     *
     * @memberof Marker
     */
    SetVisible(visible) {
        const o = {};
        o.visible = visible;
        this._pushpin.setOptions(o);
    }
}

class BingSpiderClusterMarker extends BingMarker {
}

/**
 * Concrete implementation of a clustering layer for the Bing Map Provider.
 *
 * @export
 */
class BingClusterLayer {
    ///
    /// Constructor
    ///
    /**
     * Creates a new instance of the BingClusterLayer class.
     *
     * @param _layer Microsoft.Maps.ClusterLayer. Native Bing Cluster Layer supporting the cluster layer.
     * @param _maps MapService. MapService implementation to leverage for the layer.
     *
     * @memberof BingClusterLayer
     */
    constructor(_layer, _maps) {
        this._layer = _layer;
        this._maps = _maps;
        ///
        /// Field declarations
        ///
        this._isClustering = true;
        this._markers = new Array();
        this._markerLookup = new Map();
        this._pendingMarkers = new Array();
        this._spiderMarkers = new Array();
        this._spiderMarkerLookup = new Map();
        this._useSpiderCluster = false;
        this._mapclicks = 0;
        this._events = new Array();
        this._currentZoom = 0;
        this._spiderOptions = {
            circleSpiralSwitchover: 9,
            collapseClusterOnMapChange: false,
            collapseClusterOnNthClick: 1,
            invokeClickOnHover: true,
            minCircleLength: 60,
            minSpiralAngleSeperation: 25,
            spiralDistanceFactor: 5,
            stickStyle: {
                strokeColor: 'black',
                strokeThickness: 2
            },
            stickHoverStyle: { strokeColor: 'red' },
            markerSelected: null,
            markerUnSelected: null
        };
        this._currentCluster = null;
    }
    ///
    /// Property definitions
    ///
    /**
     * Get the native primitive underneath the abstraction layer.
     *
     * @returns Microsoft.Maps.ClusterLayer.
     *
     * @memberof BingClusterLayer
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
     * @memberof BingClusterLayer
     */
    AddListener(eventType, fn) {
        Microsoft.Maps.Events.addHandler(this._layer, eventType, (e) => {
            fn(e);
        });
    }
    /**
     * Adds an entity to the layer. Use this method with caution as it will
     * trigger a recaluation of the clusters (and associated markers if approprite) for
     * each invocation. If you use this method to add many markers to the cluster, use
     *
     * @param entity Marker. Entity to add to the layer.
     *
     * @memberof BingClusterLayer
     */
    AddEntity(entity) {
        let isMarker = entity instanceof Marker;
        isMarker = entity instanceof BingMarker || isMarker;
        if (isMarker) {
            if (entity.IsFirst) {
                this.StopClustering();
            }
        }
        if (entity.NativePrimitve && entity.Location) {
            if (this._isClustering) {
                const p = this._layer.getPushpins();
                p.push(entity.NativePrimitve);
                this._layer.setPushpins(p);
                this._markers.push(entity);
            }
            else {
                this._pendingMarkers.push(entity);
            }
            this._markerLookup.set(entity.NativePrimitve, entity);
        }
        if (isMarker) {
            if (entity.IsLast) {
                this.StartClustering();
            }
        }
    }
    /**
     * Adds a number of markers to the layer.
     *
     * @param entities Array<Marker>. Entities to add to the layer.
     *
     * @memberof BingClusterLayer
     */
    AddEntities(entities) {
        if (entities != null && Array.isArray(entities) && entities.length !== 0) {
            const e = entities.map(p => {
                this._markerLookup.set(p.NativePrimitve, p);
                return p.NativePrimitve;
            });
            if (this._isClustering) {
                const p = this._layer.getPushpins();
                p.push(...e);
                this._layer.setPushpins(p);
                this._markers.push(...entities);
            }
            else {
                this._pendingMarkers.push(...entities);
            }
        }
    }
    /**
     * Initializes spider behavior for the clusering layer (when a cluster maker is clicked, it explodes into a spider of the
     * individual underlying pins.
     *
     * @param options ISpiderClusterOptions. Optional. Options governing the behavior of the spider.
     *
     * @memberof BingClusterLayer
     */
    InitializeSpiderClusterSupport(options) {
        if (this._useSpiderCluster) {
            return;
        }
        const m = this._maps.MapInstance;
        this._useSpiderCluster = true;
        this._spiderLayer = new Microsoft.Maps.Layer();
        this._currentZoom = m.getZoom();
        this.SetSpiderOptions(options);
        m.layers.insert(this._spiderLayer);
        ///
        /// Add spider related events....
        ///
        this._events.push(Microsoft.Maps.Events.addHandler(m, 'click', e => this.OnMapClick(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(m, 'viewchangestart', e => this.OnMapViewChangeStart(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(m, 'viewchangeend', e => this.OnMapViewChangeEnd(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(this._layer, 'click', e => this.OnLayerClick(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(this._spiderLayer, 'click', e => this.OnLayerClick(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(this._spiderLayer, 'mouseover', e => this.OnSpiderMouseOver(e)));
        this._events.push(Microsoft.Maps.Events.addHandler(this._spiderLayer, 'mouseout', e => this.OnSpiderMouseOut(e)));
    }
    /**
     * Deletes the clustering layer.
     *
     * @memberof BingClusterLayer
     */
    Delete() {
        if (this._useSpiderCluster) {
            this._spiderLayer.clear();
            this._maps.MapPromise.then(m => {
                m.layers.remove(this._spiderLayer);
                this._spiderLayer = null;
            });
            this._events.forEach(e => Microsoft.Maps.Events.removeHandler(e));
            this._events.splice(0);
            this._useSpiderCluster = false;
        }
        this._markers.splice(0);
        this._spiderMarkers.splice(0);
        this._pendingMarkers.splice(0);
        this._markerLookup.clear();
        this._maps.DeleteLayer(this);
    }
    /**
     * Returns the abstract marker used to wrap the Bing Pushpin.
     *
     * @returns Marker. The abstract marker object representing the pushpin.
     *
     * @memberof BingClusterLayer
     */
    GetMarkerFromBingMarker(pin) {
        const m = this._markerLookup.get(pin);
        return m;
    }
    /**
     * Returns the options governing the behavior of the layer.
     *
     * @returns IClusterOptions. The layer options.
     *
     * @memberof BingClusterLayer
     */
    GetOptions() {
        const o = this._layer.getOptions();
        const options = {
            id: 0,
            gridSize: o.gridSize,
            layerOffset: o.layerOffset,
            clusteringEnabled: o.clusteringEnabled,
            callback: o.callback,
            clusteredPinCallback: o.clusteredPinCallback,
            visible: o.visible,
            zIndex: o.zIndex
        };
        return options;
    }
    /**
     * Returns the visibility state of the layer.
     *
     * @returns Boolean. True is the layer is visible, false otherwise.
     *
     * @memberof BingClusterLayer
     */
    GetVisible() {
        return this._layer.getOptions().visible;
    }
    /**
     * Returns the abstract marker used to wrap the Bing Pushpin.
     *
     * @returns - The abstract marker object representing the pushpin.
     *
     * @memberof BingClusterLayer
     */
    GetSpiderMarkerFromBingMarker(pin) {
        const m = this._spiderMarkerLookup.get(pin);
        return m;
    }
    /**
     * Removes an entity from the cluster layer.
     *
     * @param entity Marker - Entity to be removed from the layer.
     *
     * @memberof BingClusterLayer
     */
    RemoveEntity(entity) {
        if (entity.NativePrimitve && entity.Location) {
            const j = this._markers.indexOf(entity);
            const k = this._pendingMarkers.indexOf(entity);
            if (j > -1) {
                this._markers.splice(j, 1);
            }
            if (k > -1) {
                this._pendingMarkers.splice(k, 1);
            }
            if (this._isClustering) {
                const p = this._layer.getPushpins();
                const i = p.indexOf(entity.NativePrimitve);
                if (i > -1) {
                    p.splice(i, 1);
                    this._layer.setPushpins(p);
                }
            }
            this._markerLookup.delete(entity.NativePrimitve);
        }
    }
    /**
     * Sets the entities for the cluster layer.
     *
     * @param entities Array<Marker> containing
     * the entities to add to the cluster. This replaces any existing entities.
     *
     * @memberof BingClusterLayer
     */
    SetEntities(entities) {
        const p = new Array();
        this._markers.splice(0);
        this._markerLookup.clear();
        entities.forEach((e) => {
            if (e.NativePrimitve && e.Location) {
                this._markers.push(e);
                this._markerLookup.set(e.NativePrimitve, e);
                p.push(e.NativePrimitve);
            }
        });
        this._layer.setPushpins(p);
    }
    /**
     * Sets the options for the cluster layer.
     *
     * @param options IClusterOptions containing the options enumeration controlling the layer behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof BingClusterLayer
     */
    SetOptions(options) {
        const o = BingConversions.TranslateClusterOptions(options);
        this._layer.setOptions(o);
        if (options.spiderClusterOptions) {
            this.SetSpiderOptions(options.spiderClusterOptions);
        }
    }
    /**
     * Toggles the cluster layer visibility.
     *
     * @param visible Boolean true to make the layer visible, false to hide the layer.
     *
     * @memberof BingClusterLayer
     */
    SetVisible(visible) {
        const o = this._layer.getOptions();
        o.visible = visible;
        this._layer.setOptions(o);
    }
    /**
     * Start to actually cluster the entities in a cluster layer. This method should be called after the initial set of entities
     * have been added to the cluster. This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @memberof BingClusterLayer
     */
    StartClustering() {
        if (this._isClustering) {
            return;
        }
        const p = new Array();
        this._markers.forEach(e => {
            if (e.NativePrimitve && e.Location) {
                p.push(e.NativePrimitve);
            }
        });
        this._pendingMarkers.forEach(e => {
            if (e.NativePrimitve && e.Location) {
                p.push(e.NativePrimitve);
            }
        });
        this._layer.setPushpins(p);
        this._markers = this._markers.concat(this._pendingMarkers.splice(0));
        this._isClustering = true;
    }
    /**
     * Stop to actually cluster the entities in a cluster layer.
     * This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @memberof BingClusterLayer
     */
    StopClustering() {
        if (!this._isClustering) {
            return;
        }
        this._isClustering = false;
    }
    ///
    /// Private methods
    ///
    /**
     * Creates a copy of a pushpins basic options.
     *
     * @param pin Pushpin to copy options from.
     * @returns - A copy of a pushpins basic options.
     *
     * @memberof BingClusterLayer
     */
    GetBasicPushpinOptions(pin) {
        return {
            anchor: pin.getAnchor(),
            color: pin.getColor(),
            cursor: pin.getCursor(),
            icon: pin.getIcon(),
            roundClickableArea: pin.getRoundClickableArea(),
            subTitle: pin.getSubTitle(),
            text: pin.getText(),
            textOffset: pin.getTextOffset(),
            title: pin.getTitle()
        };
    }
    /**
     * Hides the spider cluster and resotres the original pin.
     *
     * @memberof BingClusterLayer
     */
    HideSpiderCluster() {
        this._mapclicks = 0;
        if (this._currentCluster) {
            this._spiderLayer.clear();
            this._spiderMarkers.splice(0);
            this._spiderMarkerLookup.clear();
            this._currentCluster = null;
            this._mapclicks = -1;
            if (this._spiderOptions.markerUnSelected) {
                this._spiderOptions.markerUnSelected();
            }
        }
    }
    /**
     * Click event handler for when a shape in the cluster layer is clicked.
     *
     * @param e The mouse event argurment from the click event.
     *
     * @memberof BingClusterLayer
     */
    OnLayerClick(e) {
        if (e.primitive instanceof Microsoft.Maps.ClusterPushpin) {
            const cp = e.primitive;
            const showNewCluster = cp !== this._currentCluster;
            this.HideSpiderCluster();
            if (showNewCluster) {
                this.ShowSpiderCluster(e.primitive);
            }
        }
        else {
            const pin = e.primitive;
            if (pin.metadata && pin.metadata.isClusterMarker) {
                const m = this.GetSpiderMarkerFromBingMarker(pin);
                const p = m.ParentMarker;
                const ppin = p.NativePrimitve;
                if (this._spiderOptions.markerSelected) {
                    this._spiderOptions.markerSelected(p, new BingMarker(this._currentCluster, null, null));
                }
                if (Microsoft.Maps.Events.hasHandler(ppin, 'click')) {
                    Microsoft.Maps.Events.invoke(ppin, 'click', e);
                }
                this._mapclicks = 0;
            }
            else {
                if (this._spiderOptions.markerSelected) {
                    this._spiderOptions.markerSelected(this.GetMarkerFromBingMarker(pin), null);
                }
                if (Microsoft.Maps.Events.hasHandler(pin, 'click')) {
                    Microsoft.Maps.Events.invoke(pin, 'click', e);
                }
            }
        }
    }
    /**
     * Delegate handling the click event on the map (outside a spider cluster). Depending on the
     * spider options, closes the cluster or increments the click counter.
     *
     * @param e - Mouse event
     *
     * @memberof BingClusterLayer
     */
    OnMapClick(e) {
        if (this._mapclicks === -1) {
            return;
        }
        else if (++this._mapclicks >= this._spiderOptions.collapseClusterOnNthClick) {
            this.HideSpiderCluster();
        }
        else {
            // do nothing as this._mapclicks has already been incremented above
        }
    }
    /**
     * Delegate handling the map view changed end event. Hides the spider cluster if the zoom level has changed.
     *
     * @param e - Mouse event.
     *
     * @memberof BingClusterLayer
     */
    OnMapViewChangeEnd(e) {
        const z = e.target.getZoom();
        const hasZoomChanged = (z !== this._currentZoom);
        this._currentZoom = z;
        if (hasZoomChanged) {
            this.HideSpiderCluster();
        }
    }
    /**
     * Delegate handling the map view change start event. Depending on the spider options, hides the
     * the exploded spider or does nothing.
     *
     * @param e - Mouse event.
     *
     * @memberof BingClusterLayer
     */
    OnMapViewChangeStart(e) {
        if (this._spiderOptions.collapseClusterOnMapChange) {
            this.HideSpiderCluster();
        }
    }
    /**
     * Delegate invoked on mouse out on an exploded spider marker. Resets the hover style on the stick.
     *
     * @param e - Mouse event.
     */
    OnSpiderMouseOut(e) {
        const pin = e.primitive;
        if (pin instanceof Microsoft.Maps.Pushpin && pin.metadata && pin.metadata.isClusterMarker) {
            const m = this.GetSpiderMarkerFromBingMarker(pin);
            m.Stick.setOptions(this._spiderOptions.stickStyle);
        }
    }
    /**
     * Invoked on mouse over on an exploded spider marker. Sets the hover style on the stick. Also invokes the click event
     * on the underlying original marker dependent on the spider options.
     *
     * @param e - Mouse event.
     */
    OnSpiderMouseOver(e) {
        const pin = e.primitive;
        if (pin instanceof Microsoft.Maps.Pushpin && pin.metadata && pin.metadata.isClusterMarker) {
            const m = this.GetSpiderMarkerFromBingMarker(pin);
            m.Stick.setOptions(this._spiderOptions.stickHoverStyle);
            if (this._spiderOptions.invokeClickOnHover) {
                const p = m.ParentMarker;
                const ppin = p.NativePrimitve;
                if (Microsoft.Maps.Events.hasHandler(ppin, 'click')) {
                    Microsoft.Maps.Events.invoke(ppin, 'click', e);
                }
            }
        }
    }
    /**
     * Sets the options for spider behavior.
     *
     * @param options ISpiderClusterOptions containing the options enumeration controlling the spider cluster behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof BingClusterLayer
     */
    SetSpiderOptions(options) {
        if (options) {
            if (typeof options.circleSpiralSwitchover === 'number') {
                this._spiderOptions.circleSpiralSwitchover = options.circleSpiralSwitchover;
            }
            if (typeof options.collapseClusterOnMapChange === 'boolean') {
                this._spiderOptions.collapseClusterOnMapChange = options.collapseClusterOnMapChange;
            }
            if (typeof options.collapseClusterOnNthClick === 'number') {
                this._spiderOptions.collapseClusterOnNthClick = options.collapseClusterOnNthClick;
            }
            if (typeof options.invokeClickOnHover === 'boolean') {
                this._spiderOptions.invokeClickOnHover = options.invokeClickOnHover;
            }
            if (typeof options.minSpiralAngleSeperation === 'number') {
                this._spiderOptions.minSpiralAngleSeperation = options.minSpiralAngleSeperation;
            }
            if (typeof options.spiralDistanceFactor === 'number') {
                this._spiderOptions.spiralDistanceFactor = options.spiralDistanceFactor;
            }
            if (typeof options.minCircleLength === 'number') {
                this._spiderOptions.minCircleLength = options.minCircleLength;
            }
            if (options.stickHoverStyle) {
                this._spiderOptions.stickHoverStyle = options.stickHoverStyle;
            }
            if (options.stickStyle) {
                this._spiderOptions.stickStyle = options.stickStyle;
            }
            if (options.markerSelected) {
                this._spiderOptions.markerSelected = options.markerSelected;
            }
            if (options.markerUnSelected) {
                this._spiderOptions.markerUnSelected = options.markerUnSelected;
            }
            if (typeof options.visible === 'boolean') {
                this._spiderOptions.visible = options.visible;
            }
            this.SetOptions(options);
        }
    }
    /**
     * Expands a cluster into it's open spider layout.
     *
     * @param cluster The cluster to show in it's open spider layout..
     *
     * @memberof BingClusterLayer
     */
    ShowSpiderCluster(cluster) {
        this.HideSpiderCluster();
        this._currentCluster = cluster;
        if (cluster && cluster.containedPushpins) {
            // Create spider data.
            const m = this._maps.MapInstance;
            const pins = cluster.containedPushpins;
            const center = cluster.getLocation();
            const centerPoint = m.tryLocationToPixel(center, Microsoft.Maps.PixelReference.control);
            let stick;
            let angle = 0;
            const makeSpiral = pins.length > this._spiderOptions.circleSpiralSwitchover;
            let legPixelLength;
            let stepAngle;
            let stepLength;
            if (makeSpiral) {
                legPixelLength = this._spiderOptions.minCircleLength / Math.PI;
                stepLength = 2 * Math.PI * this._spiderOptions.spiralDistanceFactor;
            }
            else {
                stepAngle = 2 * Math.PI / pins.length;
                legPixelLength = (this._spiderOptions.spiralDistanceFactor / stepAngle / Math.PI / 2) * pins.length;
                if (legPixelLength < this._spiderOptions.minCircleLength) {
                    legPixelLength = this._spiderOptions.minCircleLength;
                }
            }
            for (let i = 0, len = pins.length; i < len; i++) {
                // Calculate spider pin location.
                if (!makeSpiral) {
                    angle = stepAngle * i;
                }
                else {
                    angle += this._spiderOptions.minSpiralAngleSeperation / legPixelLength + i * 0.0005;
                    legPixelLength += stepLength / angle;
                }
                const point = new Microsoft.Maps.Point(centerPoint.x + legPixelLength * Math.cos(angle), centerPoint.y + legPixelLength * Math.sin(angle));
                const loc = m.tryPixelToLocation(point, Microsoft.Maps.PixelReference.control);
                // Create stick to pin.
                stick = new Microsoft.Maps.Polyline([center, loc], this._spiderOptions.stickStyle);
                this._spiderLayer.add(stick);
                // Create pin in spiral that contains same metadata as parent pin.
                const pin = new Microsoft.Maps.Pushpin(loc);
                pin.metadata = pins[i].metadata || {};
                pin.metadata.isClusterMarker = true;
                pin.setOptions(this.GetBasicPushpinOptions(pins[i]));
                this._spiderLayer.add(pin);
                const spiderMarker = new BingSpiderClusterMarker(pin, null, this._spiderLayer);
                spiderMarker.Stick = stick;
                spiderMarker.ParentMarker = this.GetMarkerFromBingMarker(pins[i]);
                this._spiderMarkers.push(spiderMarker);
                this._spiderMarkerLookup.set(pin, spiderMarker);
            }
            this._mapclicks = 0;
        }
    }
}

/**
 * Concrete implementation of the {@link InfoWindow} contract for the Bing Maps V8 map architecture.
 *
 * @export
 */
class BingInfoWindow {
    /**
     * Creates an instance of BingInfoWindow.
     * @param _infoBox - A {@link Microsoft.Maps.Infobox} instance underlying the model
     * @memberof BingInfoWindow
     */
    constructor(_infoBox) {
        this._infoBox = _infoBox;
        this._isOpen = false;
    }
    /**
     * Gets whether the info box is currently open.
     *
     * @readonly
     * @memberof BingInfoWindow
     */
    get IsOpen() {
        if (this._infoBox && this._infoBox.getOptions().visible === true) {
            return true;
        }
        return false;
    }
    /**
     * Gets native primitve underlying the model.
     *
     * @memberof BingInfoWindow
     * @property
     * @readonly
     */
    get NativePrimitve() {
        return this._infoBox;
    }
    /**
     * Adds an event listener to the InfoWindow.
     *
     * @param eventType - String containing the event for which to register the listener (e.g. "click")
     * @param fn - Delegate invoked when the event occurs.
     *
     * @memberof BingInfoWindow
     * @method
     */
    AddListener(eventType, fn) {
        Microsoft.Maps.Events.addHandler(this._infoBox, eventType, (e) => {
            if (e.eventName === 'infoboxChanged') {
                if (this._infoBox.getOptions().visible === true) {
                    this._isOpen = true;
                }
                else {
                    if (this._infoBox.getOptions().visible === false && this._isOpen === true) {
                        this._isOpen = false;
                        fn(e);
                    }
                }
            }
            else {
                fn(e);
            }
        });
    }
    /**
     * Closes the info window.
     *
     * @memberof BingInfoWindow
     * @method
     */
    Close() {
        const o = {};
        o.visible = false;
        this._infoBox.setOptions(o);
    }
    /**
     * Gets the position of the info window.
     *
     * @returns - Returns the geo coordinates of the info window.
     * @memberof BingInfoWindow
     * @method
     */
    GetPosition() {
        const p = {
            latitude: this._infoBox.getLocation().latitude,
            longitude: this._infoBox.getLocation().longitude
        };
        return p;
    }
    /**
     * Opens the info window.
     *
     * @memberof BingInfoWindow
     * @method
     */
    Open() {
        const o = {};
        o.visible = true;
        this._infoBox.setOptions(o);
    }
    /**
     * Sets the info window options.
     *
     * @param options - Info window options to set. The options will be merged with any existing options.
     *
     * @memberof BingInfoWindow
     * @method
     */
    SetOptions(options) {
        const o = BingConversions.TranslateInfoBoxOptions(options);
        this._infoBox.setOptions(o);
    }
    /**
     * Sets the info window position.
     *
     * @param position - Geo coordinates to move the anchor of the info window to.
     *
     * @memberof BingInfoWindow
     * @method
     */
    SetPosition(position) {
        const l = BingConversions.TranslateLocation(position);
        this._infoBox.setLocation(l);
    }
}

/**
 * Abstract base implementing a label to be placed on the map.
 *
 * @export
 * @abstract
 */
class MapLabel {
    ///
    /// Constructor
    ///
    /**
     * Creates a new MapLabel
     * @param options Optional properties to set.
     */
    constructor(options) {
        this.Set('fontFamily', 'sans-serif');
        this.Set('fontSize', 12);
        this.Set('fontColor', '#ffffff');
        this.Set('strokeWeight', 4);
        this.Set('strokeColor', '#000000');
        this.Set('align', 'center');
        this.SetValues(options);
    }
    ///
    /// Public methods
    ///
    /**
     * Deletes the label from the map. This method does not atually delete the label itself, so
     * it can be readded to map later.
     * @memberof MapLabel
     * @method
     */
    Delete() {
        this.SetMap(null);
    }
    /**
     * Delegate called when underlying properties change.
     *
     * @param prop - The property or properties that have changed.
     * @memberof MapLabel
     * @method
     */
    Changed(prop) {
        let shouldRunDrawCanvas = false;
        let shouldRunDraw = false;
        if (!Array.isArray(prop)) {
            prop = [prop];
        }
        prop.forEach(p => {
            switch (p) {
                case 'fontFamily':
                case 'fontSize':
                case 'fontColor':
                case 'strokeWeight':
                case 'strokeColor':
                case 'align':
                case 'text':
                    shouldRunDrawCanvas = true;
                    break;
                case 'maxZoom':
                case 'minZoom':
                case 'offset':
                case 'hidden':
                case 'position':
                    shouldRunDraw = true;
                    break;
            }
        });
        if (shouldRunDrawCanvas) {
            this.DrawCanvas();
        }
        if (shouldRunDraw) {
            this.Draw();
        }
    }
    ///
    /// Protected methods
    ///
    /**
     * Get the visibility of the label. Visibility depends on Zoom settings.
     * @returns - blank string if visible, 'hidden' if invisible.
     * @protected
     */
    GetVisible() {
        const minZoom = this.Get('minZoom');
        const maxZoom = this.Get('maxZoom');
        const hidden = this.Get('hidden');
        if (hidden) {
            return 'hidden';
        }
        if (minZoom === undefined && maxZoom === undefined) {
            return '';
        }
        if (!this.GetMap()) {
            return '';
        }
        const mapZoom = this.GetMap().getZoom();
        if (mapZoom < minZoom || mapZoom > maxZoom) {
            return 'hidden';
        }
        return '';
    }
    /**
     * Draws the label to the canvas 2d context.
     * @memberof MapLabel
     * @method
     * @protected
     */
    DrawCanvas() {
        if (!this._canvas) {
            return;
        }
        const style = this._canvas.style;
        style.zIndex = this.Get('zIndex');
        const ctx = this._canvas.getContext('2d');
        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        ctx.strokeStyle = this.Get('strokeColor');
        ctx.font = this.Get('fontSize') + 'px ' + this.Get('fontFamily');
        const backgroundColor = this.Get('backgroundColor');
        const strokeWeight = Number(this.Get('strokeWeight'));
        const text = this.Get('text');
        const textMeasure = ctx.measureText(text);
        const textWidth = textMeasure.width;
        if (text && strokeWeight && strokeWeight > 0) {
            ctx.lineWidth = strokeWeight;
            ctx.strokeText(text, 4, 4);
        }
        if (backgroundColor && backgroundColor !== '') {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, textWidth + 8, (parseInt(ctx.font, 10) * 2) - 2);
        }
        ctx.fillStyle = this.Get('fontColor');
        ctx.fillText(text, 4, 4);
        style.marginLeft = this.GetMarginLeft(textWidth) + 'px';
        style.marginTop = '-0.4em';
        style.pointerEvents = 'none';
        // Bring actual text top in line with desired latitude.
        // Cheaper than calculating height of text.
    }
    /**
     * Gets the appropriate margin-left for the canvas.
     * @param textWidth  - The width of the text, in pixels.
     * @returns - The margin-left, in pixels.
     * @protected
     * @method
     * @memberof MapLabel
     */
    GetMarginLeft(textWidth) {
        switch (this.Get('align')) {
            case 'left': return 0;
            case 'right': return -textWidth;
        }
        return textWidth / -2;
    }
    /**
     * Called when the label is removed from the map.
     * @method
     * @protected
     * @memberof MapLabel
     */
    OnRemove() {
        if (this._canvas && this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
    }
}

class Extender {
    constructor(obj) {
        this._obj = obj;
        this._proto = obj.prototype;
    }
    Extend(newObj) {
        this.Set('prototype', newObj, this._obj);
        for (const y in this._proto) {
            if (this._proto[y] != null) {
                this.Set(y, (this._proto)[y], this._obj.prototype[y]);
            }
        }
        return this;
    }
    Set(property, newObj, obj) {
        if (typeof newObj === 'undefined') {
            return this;
        }
        if (typeof obj === 'undefined') {
            obj = this._proto;
        }
        Object.defineProperty(obj, property, newObj);
    }
    Map(property, newProperty) {
        this.Set(property, this._proto[newProperty], this._obj.prototype);
        return this;
    }
}

let id$1 = 0;
/**
 * Implements map a labled to be placed on the map.
 *
 * @export
 */
class BingMapLabel extends MapLabel {
    /**
     * Returns the default label style for the platform
     *
     * @readonly
     * @abstract
     * @memberof BingMapLabel
     */
    get DefaultLabelStyle() {
        return {
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontColor: '#ffffff',
            strokeWeight: 2,
            strokeColor: '#000000'
        };
    }
    ///
    /// Constructor
    ///
    /**
     * Creates a new MapLabel
     * @param options Optional properties to set.
     */
    constructor(options) {
        options.fontSize = options.fontSize || 12;
        options.fontColor = options.fontColor || '#ffffff';
        options.strokeWeight = options.strokeWeight || 2;
        options.strokeColor = options.strokeColor || '#000000';
        super(options);
        this._options.beneathLabels = false;
    }
    ///
    /// Public methods
    ///
    /**
     * Gets the value of a setting.
     *
     * @param key - Key specifying the setting.
     * @returns - The value of the setting.
     * @memberof BingMapLabel
     * @method
     */
    Get(key) {
        return this[key];
    }
    /**
     * Gets the map associted with the label.
     *
     * @memberof BingMapLabel
     * @method
     */
    GetMap() {
        return this.getMap();
    }
    /**
     * Set the value for a setting.
     *
     * @param key - Key specifying the setting.
     * @param val - The value to set.
     * @memberof BingMapLabel
     * @method
     */
    Set(key, val) {
        if (key === 'position' && !val.hasOwnProperty('altitude') && val.hasOwnProperty('latitude') && val.hasOwnProperty('longitude')) {
            val = new Microsoft.Maps.Location(val.latitude, val.longitude);
        }
        if (this.Get(key) !== val) {
            this[key] = val;
            this.Changed(key);
        }
    }
    /**
     * Sets the map for the label. Settings this to null remove the label from hte map.
     *
     * @param map - Map to associated with the label.
     * @memberof BingMapLabel
     * @method
     */
    SetMap(map) {
        const m = this.GetMap();
        if (map === m) {
            return;
        }
        if (m) {
            m.layers.remove(this);
        }
        if (map != null) {
            map.layers.insert(this);
        }
    }
    /**
     * Applies settings to the object
     *
     * @param options - An object containing the settings key value pairs.
     * @memberof BingMapLabel
     * @method
     */
    SetValues(options) {
        const p = new Array();
        for (const key in options) {
            if (key !== '') {
                if (key === 'position' && !options[key].hasOwnProperty('altitude') &&
                    options[key].hasOwnProperty('latitude') && options[key].hasOwnProperty('longitude')) {
                    options[key] = new Microsoft.Maps.Location(options[key].latitude, options[key].longitude);
                }
                if (this.Get(key) !== options[key]) {
                    this[key] = options[key];
                    p.push(key);
                }
            }
        }
        if (p.length > 0) {
            this.Changed(p);
        }
    }
    ///
    /// Protected methods
    ///
    /**
     * Draws the label on the map.
     * @memberof BingMapLabel
     * @method
     * @protected
     */
    Draw() {
        const visibility = this.GetVisible();
        const m = this.GetMap();
        if (!this._canvas) {
            return;
        }
        if (!m) {
            return;
        }
        const style = this._canvas.style;
        if (visibility !== '') {
            // label is not visible, don't calculate positions etc.
            style['visibility'] = visibility;
            return;
        }
        let offset = this.Get('offset');
        const latLng = this.Get('position');
        if (!latLng) {
            return;
        }
        if (!offset) {
            offset = new Microsoft.Maps.Point(0, 0);
        }
        const pos = m.tryLocationToPixel(latLng, Microsoft.Maps.PixelReference.control);
        style['top'] = (pos.y + offset.y) + 'px';
        style['left'] = (pos.x + offset.x) + 'px';
        style['visibility'] = visibility;
    }
    /**
     * Delegate called when the label is added to the map. Generates and configures
     * the canvas.
     *
     * @memberof BingMapLabel
     * @method
     * @protected
     */
    OnAdd() {
        this._canvas = document.createElement('canvas');
        this._canvas.id = `xMapLabel${id$1++}`;
        const style = this._canvas.style;
        style.position = 'absolute';
        const ctx = this._canvas.getContext('2d');
        ctx.lineJoin = 'round';
        ctx.textBaseline = 'top';
        this.setHtmlElement(this._canvas);
    }
    ///
    /// Private methods
    ///
    /**
     * Delegate callled when the label is loaded
     * @memberof BingMapLabel
     * @method
     */
    OnLoad() {
        Microsoft.Maps.Events.addHandler(this.GetMap(), 'viewchange', () => {
            this.Changed('position');
        });
        this.DrawCanvas();
        this.Draw();
    }
}
/**
 * Helper function to extend the CustomOverlay into the MapLabel
 *
 * @export
 * @method
 */
function MixinMapLabelWithOverlayView() {
    new Extender(BingMapLabel)
        .Extend(new Microsoft.Maps.CustomOverlay())
        .Map('onAdd', 'OnAdd')
        .Map('onLoad', 'OnLoad')
        .Map('onRemove', 'OnRemove');
}

/**
 * Concrete implementation for a polygon model for Bing Maps V8.
 *
 * @export
 */
class BingPolygon extends Polygon {
    ///
    /// constructor
    ///
    /**
     * Creates an instance of BingPolygon.
     * @param _polygon - The {@link Microsoft.Maps.Polygon} underlying the model.
     * @param _mapService Instance of the Map Service.
     * @param _layer - The context layer.
     * @memberof BingPolygon
     */
    constructor(_polygon, _mapService, _layer) {
        super();
        this._polygon = _polygon;
        this._mapService = _mapService;
        this._layer = _layer;
        ///
        /// Field declarations
        ///
        this._map = null;
        this._isEditable = false;
        this._title = '';
        this._maxZoom = -1;
        this._minZoom = -1;
        this._showLabel = false;
        this._showTooltip = false;
        this._label = null;
        this._tooltip = null;
        this._hasToolTipReceiver = false;
        this._tooltipVisible = false;
        this._metadata = new Map();
        this._map = this._mapService.MapInstance;
        this._originalPath = this.GetPaths();
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets or sets the maximum zoom at which the label is displayed. Ignored or ShowLabel is false.
     *
     * @memberof GooglePolygon
     * @property
     */
    get LabelMaxZoom() { return this._maxZoom; }
    set LabelMaxZoom(val) {
        this._maxZoom = val;
        this.ManageLabel();
    }
    /**
     * Gets or sets the minimum zoom at which the label is displayed. Ignored or ShowLabel is false.
     *
     * @memberof GooglePolygon
     * @property
     */
    get LabelMinZoom() { return this._minZoom; }
    set LabelMinZoom(val) {
        this._minZoom = val;
        this.ManageLabel();
    }
    /**
     * Gets the polygon metadata.
     *
     * @readonly
     * @memberof BingPolygon
     */
    get Metadata() { return this._metadata; }
    /**
     * Gets the native primitve implementing the polygon, in this case {@link Microsoft.Maps.Polygon}
     *
     * @readonly
     * @memberof BingPolygon
     */
    get NativePrimitve() { return this._polygon; }
    /**
     * Gets or sets whether to show the label
     *
     * @abstract
     * @memberof BingPolygon
     * @property
     */
    get ShowLabel() { return this._showLabel; }
    set ShowLabel(val) {
        this._showLabel = val;
        this.ManageLabel();
    }
    /**
     * Gets or sets whether to show the tooltip
     *
     * @abstract
     * @memberof BingPolygon
     * @property
     */
    get ShowTooltip() { return this._showTooltip; }
    set ShowTooltip(val) {
        this._showTooltip = val;
        this.ManageTooltip();
    }
    /**
     * Gets or sets the title off the polygon
     *
     * @abstract
     * @memberof BingPolygon
     * @property
     */
    get Title() { return this._title; }
    set Title(val) {
        this._title = val;
        this.ManageLabel();
        this.ManageTooltip();
    }
    /**
     * Adds a delegate for an event.
     *
     * @param eventType - String containing the event name.
     * @param fn - Delegate function to execute when the event occurs.

     * @memberof BingPolygon
     */
    AddListener(eventType, fn) {
        const supportedEvents = ['click', 'dblclick', 'drag', 'dragend', 'dragstart', 'mousedown', 'mouseout', 'mouseover', 'mouseup'];
        if (supportedEvents.indexOf(eventType) !== -1) {
            Microsoft.Maps.Events.addHandler(this._polygon, eventType, (e) => {
                fn(e);
            });
        }
        if (eventType === 'mousemove') {
            let handlerId;
            Microsoft.Maps.Events.addHandler(this._polygon, 'mouseover', e => {
                handlerId = Microsoft.Maps.Events.addHandler(this._map, 'mousemove', m => fn(m));
            });
            Microsoft.Maps.Events.addHandler(this._polygon, 'mouseout', e => {
                if (handlerId) {
                    Microsoft.Maps.Events.removeHandler(handlerId);
                }
            });
        }
        if (eventType === 'pathchanged') {
            this._editingCompleteEmitter = fn;
        }
    }
    /**
     * Deleted the polygon.
     *
     * @memberof BingPolygon
     */
    Delete() {
        if (this._layer) {
            this._layer.remove(this.NativePrimitve);
        }
        else {
            this._map.entities.remove(this.NativePrimitve);
        }
        if (this._label) {
            this._label.Delete();
        }
        if (this._tooltip) {
            this._tooltip.Delete();
        }
    }
    /**
     * Gets whether the polygon is draggable.
     *
     * @returns - True if the polygon is dragable, false otherwise.
     *
     * @memberof BingPolygon
     */
    GetDraggable() {
        ///
        /// Bing polygons are not draggable by default.
        /// See https://social.msdn.microsoft.com/Forums/en-US/
        ///     7aaae748-4d5f-4be5-a7bb-90498e08b41c/how-can-i-make-polygonpolyline-draggable-in-bing-maps-8?
        ///     forum=bingmaps
        /// for a possible approach to be implemented in the model.
        ///
        return false;
    }
    /**
     * Gets whether the polygon path can be edited.
     *
     * @returns - True if the path can be edited, false otherwise.
     *
     * @memberof BingPolygon
     */
    GetEditable() {
        return this._isEditable;
    }
    /**
     * Gets the polygon path.
     *
     * @returns - Array of {@link ILatLong} objects describing the polygon path.
     *
     * @memberof BingPolygon
     */
    GetPath() {
        const p = this._polygon.getLocations();
        const path = new Array();
        p.forEach(l => path.push({ latitude: l.latitude, longitude: l.longitude }));
        return path;
    }
    /**
     * Gets the polygon paths.
     *
     * @returns - Array of Array of {@link ILatLong} objects describing multiple polygon paths.
     *
     * @memberof BingPolygon
     */
    GetPaths() {
        const p = this._polygon.getRings();
        const paths = new Array();
        p.forEach(x => {
            const path = new Array();
            x.forEach(y => path.push({ latitude: y.latitude, longitude: y.longitude }));
            paths.push(path);
        });
        return paths;
    }
    /**
     * Gets whether the polygon is visible.
     *
     * @returns - True if the polygon is visible, false otherwise.
     *
     * @memberof BingPolygon
     */
    GetVisible() {
        return this._polygon.getVisible();
    }
    /**
     * Sets whether the polygon is dragable.
     *
     * @param draggable - True to make the polygon dragable, false otherwise.
     *
     * @memberof BingPolygon
     */
    SetDraggable(draggable) {
        ///
        /// Bing polygons are not draggable by default.
        /// See https://social.msdn.microsoft.com/Forums/en-US/
        ///     7aaae748-4d5f-4be5-a7bb-90498e08b41c/how-can-i-make-polygonpolyline-draggable-in-bing-maps-8
        //      ?forum=bingmaps
        /// for a possible approach to be implemented in the model.
        ///
        throw (new Error('The bing maps implementation currently does not support draggable polygons.'));
    }
    /**
     * Sets wether the polygon path is editable.
     *
     * @param editable - True to make polygon path editable, false otherwise.
     *
     * @memberof BingPolygon
     */
    SetEditable(editable) {
        const isChanged = this._isEditable !== editable;
        this._isEditable = editable;
        if (!isChanged) {
            return;
        }
        if (this._isEditable) {
            this._originalPath = this.GetPaths();
            this._mapService.GetDrawingTools().then(t => {
                t.edit(this._polygon);
            });
        }
        else {
            this._mapService.GetDrawingTools().then(t => {
                t.finish((editedPolygon) => {
                    if (editedPolygon !== this._polygon || !this._editingCompleteEmitter) {
                        return;
                    }
                    const newPath = this.GetPaths();
                    const originalPath = this._originalPath;
                    this.SetPaths(newPath);
                    // this is necessary for the new path to persist it appears.
                    this._editingCompleteEmitter({
                        Click: null,
                        Polygon: this,
                        OriginalPath: originalPath,
                        NewPath: newPath
                    });
                });
            });
        }
    }
    /**
     * Sets the polygon options
     *
     * @param options - {@link ILatLong} object containing the options. The options are merged with hte ones
     * already on the underlying model.
     *
     * @memberof Polygon
     */
    SetOptions(options) {
        const o = BingConversions.TranslatePolygonOptions(options);
        this._polygon.setOptions(o);
        if (options.visible != null && this._showLabel && this._label) {
            this._label.Set('hidden', !options.visible);
        }
        if (typeof options.editable !== 'undefined') {
            this.SetEditable(options.editable);
        }
    }
    /**
     * Sets the polygon path.
     *
     * @param path - An Array of {@link ILatLong} (or array of arrays) describing the polygons path.
     *
     * @memberof BingPolygon
     */
    SetPath(path) {
        const p = new Array();
        path.forEach(x => p.push(new Microsoft.Maps.Location(x.latitude, x.longitude)));
        this._originalPath = [path];
        this._polygon.setLocations(p);
        if (this._label) {
            this._centroid = null;
            this.ManageLabel();
        }
    }
    /**
     * Set the polygon path or paths.
     *
     * @param paths
     * An Array of {@link ILatLong} (or array of arrays) describing the polygons path(s).
     *
     * @memberof BingPolygon
     */
    SetPaths(paths) {
        if (paths == null) {
            return;
        }
        if (!Array.isArray(paths)) {
            return;
        }
        if (paths.length === 0) {
            this._polygon.setRings(new Array());
            if (this._label) {
                this._label.Delete();
                this._label = null;
            }
            return;
        }
        if (Array.isArray(paths[0])) {
            // parameter is an array or arrays
            const p = new Array();
            paths.forEach(path => {
                const _p = new Array();
                path.forEach(x => _p.push(new Microsoft.Maps.Location(x.latitude, x.longitude)));
                p.push(_p);
            });
            this._originalPath = paths;
            this._polygon.setRings(p);
            if (this._label) {
                this._centroid = null;
                this.ManageLabel();
            }
        }
        else {
            // parameter is a simple array....
            this.SetPath(paths);
        }
    }
    /**
     * Sets whether the polygon is visible.
     *
     * @param visible - True to set the polygon visible, false otherwise.
     *
     * @memberof BingPolygon
     */
    SetVisible(visible) {
        this._polygon.setOptions({ visible: visible });
        if (this._showLabel && this._label) {
            this._label.Set('hidden', !visible);
        }
    }
    ///
    /// Private methods
    ///
    /**
     * Configures the label for the polygon
     * @memberof Polygon
     */
    ManageLabel() {
        if (this.GetPath == null || this.GetPath().length === 0) {
            return;
        }
        if (this._showLabel && this._title != null && this._title !== '') {
            const o = {
                text: this._title,
                position: BingConversions.TranslateLocation(this.Centroid)
            };
            if (o.position == null) {
                return;
            }
            if (this._minZoom !== -1) {
                o.minZoom = this._minZoom;
            }
            if (this._maxZoom !== -1) {
                o.maxZoom = this._maxZoom;
            }
            if (this._label == null) {
                this._label = new BingMapLabel(o);
                this._label.SetMap(this._map);
            }
            else {
                this._label.SetValues(o);
            }
            this._label.Set('hidden', !this.GetVisible());
        }
        else {
            if (this._label) {
                this._label.SetMap(null);
                this._label = null;
            }
        }
    }
    /**
     * Configures the tooltip for the polygon
     * @memberof Polygon
     */
    ManageTooltip() {
        if (this._showTooltip && this._title != null && this._title !== '') {
            const o = {
                text: this._title,
                align: 'left',
                offset: new Microsoft.Maps.Point(0, 25),
                backgroundColor: 'bisque',
                hidden: true,
                fontSize: 12,
                fontColor: '#000000',
                strokeWeight: 0
            };
            if (this._tooltip == null) {
                this._tooltip = new BingMapLabel(o);
                this._tooltip.SetMap(this._map);
            }
            else {
                this._tooltip.SetValues(o);
            }
            if (!this._hasToolTipReceiver) {
                this._mouseOverListener = Microsoft.Maps.Events.addHandler(this._polygon, 'mouseover', (e) => {
                    this._tooltip.Set('position', e.location);
                    if (!this._tooltipVisible) {
                        this._tooltip.Set('hidden', false);
                        this._tooltipVisible = true;
                    }
                    this._mouseMoveListener = Microsoft.Maps.Events.addHandler(this._map, 'mousemove', (m) => {
                        if (this._tooltipVisible && m.location && m.primitive === this._polygon) {
                            this._tooltip.Set('position', m.location);
                        }
                    });
                });
                this._mouseOutListener = Microsoft.Maps.Events.addHandler(this._polygon, 'mouseout', (e) => {
                    if (this._tooltipVisible) {
                        this._tooltip.Set('hidden', true);
                        this._tooltipVisible = false;
                    }
                    if (this._mouseMoveListener) {
                        Microsoft.Maps.Events.removeHandler(this._mouseMoveListener);
                    }
                });
                this._hasToolTipReceiver = true;
            }
        }
        if ((!this._showTooltip || this._title === '' || this._title == null)) {
            if (this._hasToolTipReceiver) {
                if (this._mouseOutListener) {
                    Microsoft.Maps.Events.removeHandler(this._mouseOutListener);
                }
                if (this._mouseOverListener) {
                    Microsoft.Maps.Events.removeHandler(this._mouseOverListener);
                }
                if (this._mouseMoveListener) {
                    Microsoft.Maps.Events.removeHandler(this._mouseMoveListener);
                }
                this._hasToolTipReceiver = false;
            }
            if (this._tooltip) {
                this._tooltip.SetMap(null);
                this._tooltip = null;
            }
        }
    }
}

/**
 * Concrete implementation for a polyline model for Bing Maps V8.
 *
 * @export
 */
class BingPolyline extends Polyline {
    ///
    /// constructor
    ///
    /**
     * Creates an instance of BingPolygon.
     * @param _polyline - The {@link Microsoft.Maps.Polyline} underlying the model.
     * @param _map - The context map.
     * @param _layer - The context layer.
     * @memberof BingPolyline
     */
    constructor(_polyline, _map, _layer) {
        super();
        this._polyline = _polyline;
        this._map = _map;
        this._layer = _layer;
        ///
        /// Field declarations
        ///
        this._isEditable = true;
        ///
        /// Property declarations
        ///
        this._title = '';
        this._showTooltip = false;
        this._tooltip = null;
        this._hasToolTipReceiver = false;
        this._tooltipVisible = false;
        this._metadata = new Map();
    }
    /**
     * Gets the polyline metadata.
     *
     * @readonly
     * @memberof BingPolyline
     */
    get Metadata() { return this._metadata; }
    /**
     * Gets the Navitve Polyline underlying the model
     *
     * @readonly
     * @memberof BingPolyline
     */
    get NativePrimitve() { return this._polyline; }
    /**
     * Gets or sets whether to show the tooltip
     *
     * @abstract
     * @memberof BingPolyline
     * @property
     */
    get ShowTooltip() { return this._showTooltip; }
    set ShowTooltip(val) {
        this._showTooltip = val;
        this.ManageTooltip();
    }
    /**
     * Gets or sets the title off the polyline
     *
     * @abstract
     * @memberof BingPolyline
     * @property
     */
    get Title() { return this._title; }
    set Title(val) {
        this._title = val;
        this.ManageTooltip();
    }
    /**
     * Adds a delegate for an event.
     *
     * @param eventType - String containing the event name.
     * @param fn - Delegate function to execute when the event occurs.
     * @memberof BingPolyline
     */
    AddListener(eventType, fn) {
        const supportedEvents = ['click', 'dblclick', 'drag', 'dragend', 'dragstart', 'mousedown', 'mouseout', 'mouseover', 'mouseup'];
        if (supportedEvents.indexOf(eventType) !== -1) {
            Microsoft.Maps.Events.addHandler(this._polyline, eventType, (e) => {
                fn(e);
            });
        }
        if (eventType === 'mousemove') {
            let handlerId;
            Microsoft.Maps.Events.addHandler(this._polyline, 'mouseover', e => {
                handlerId = Microsoft.Maps.Events.addHandler(this._map, 'mousemove', m => fn(m));
            });
            Microsoft.Maps.Events.addHandler(this._polyline, 'mouseout', e => {
                if (handlerId) {
                    Microsoft.Maps.Events.removeHandler(handlerId);
                }
            });
        }
    }
    /**
     * Deleted the polyline.
     *
     * @memberof BingPolyline
     */
    Delete() {
        if (this._layer) {
            this._layer.remove(this.NativePrimitve);
        }
        else {
            this._map.entities.remove(this.NativePrimitve);
        }
        if (this._tooltip) {
            this._tooltip.Delete();
        }
    }
    /**
     * Gets whether the polyline is draggable.
     *
     * @returns - True if the polyline is dragable, false otherwise.
     *
     * @memberof BingPolyline
     */
    GetDraggable() {
        ///
        /// Bing polygons are not draggable by default.
        /// See https://social.msdn.microsoft.com/Forums/en-US/
        ///     7aaae748-4d5f-4be5-a7bb-90498e08b41c/how-can-i-make-polygonpolyline-draggable-in-bing-maps-8
        ///     ?forum=bingmaps
        /// for a possible approach to be implemented in the model.
        ///
        return false;
    }
    /**
     * Gets whether the polyline path can be edited.
     *
     * @returns - True if the path can be edited, false otherwise.
     *
     * @memberof BingPolyline
     */
    GetEditable() {
        return this._isEditable;
    }
    /**
     * Gets the polyline path.
     *
     * @returns - Array of {@link ILatLong} objects describing the polyline path.
     *
     * @memberof BingPolyline
     */
    GetPath() {
        const p = this._polyline.getLocations();
        const path = new Array();
        p.forEach(l => path.push({ latitude: l.latitude, longitude: l.longitude }));
        return path;
    }
    /**
     * Gets whether the polyline is visible.
     *
     * @returns - True if the polyline is visible, false otherwise.
     *
     * @memberof BingPolyline
     */
    GetVisible() {
        return this._polyline.getVisible();
    }
    /**
     * Sets whether the polyline is dragable.
     *
     * @param draggable - True to make the polyline dragable, false otherwise.
     *
     * @memberof BingPolyline
     */
    SetDraggable(draggable) {
        ///
        /// Bing polygons are not draggable by default.
        /// See https://social.msdn.microsoft.com/Forums/en-US/
        ///     7aaae748-4d5f-4be5-a7bb-90498e08b41c/how-can-i-make-polygonpolyline-draggable-in-bing-maps-8
        ///     ?forum=bingmaps
        /// for a possible approach to be implemented in the model.
        ///
        throw (new Error('The bing maps implementation currently does not support draggable polylines.'));
    }
    /**
     * Sets wether the polyline path is editable.
     *
     * @param editable - True to make polyline path editable, false otherwise.
     *
     * @memberof BingPolyline
     */
    SetEditable(editable) {
        this._isEditable = editable;
    }
    /**
     * Sets the polyline options
     *
     * @param options - {@link ILatLong} object containing the options. The options are merged with hte ones
     * already on the underlying model.
     *
     * @memberof BingPolyline
     */
    SetOptions(options) {
        const o = BingConversions.TranslatePolylineOptions(options);
        this._polyline.setOptions(o);
        if (options.path) {
            this.SetPath(options.path);
        }
    }
    /**
     * Sets the polyline path.
     *
     * @param path - An Array of {@link ILatLong} (or array of arrays) describing the polylines path.
     *
     * @memberof BingPolyline
     */
    SetPath(path) {
        const p = new Array();
        path.forEach(x => p.push(new Microsoft.Maps.Location(x.latitude, x.longitude)));
        this._polyline.setLocations(p);
    }
    /**
     * Sets whether the polyline is visible.
     *
     * @param visible - True to set the polyline visible, false otherwise.
     *
     * @memberof BingPolyline
     */
    SetVisible(visible) {
        this._polyline.setOptions({ visible: visible });
    }
    ///
    /// Private methods
    ///
    /**
     * Configures the tooltip for the polygon
     * @memberof Polygon
     */
    ManageTooltip() {
        if (this._showTooltip && this._title != null && this._title !== '') {
            const o = {
                text: this._title,
                align: 'left',
                offset: new Microsoft.Maps.Point(0, 25),
                backgroundColor: 'bisque',
                hidden: true,
                fontSize: 12,
                fontColor: '#000000',
                strokeWeight: 0
            };
            if (this._tooltip == null) {
                this._tooltip = new BingMapLabel(o);
                this._tooltip.SetMap(this._map);
            }
            else {
                this._tooltip.SetValues(o);
            }
            if (!this._hasToolTipReceiver) {
                this._mouseOverListener = Microsoft.Maps.Events.addHandler(this._polyline, 'mouseover', (e) => {
                    this._tooltip.Set('position', e.location);
                    if (!this._tooltipVisible) {
                        this._tooltip.Set('hidden', false);
                        this._tooltipVisible = true;
                    }
                });
                this._mouseMoveListener = Microsoft.Maps.Events.addHandler(this._map, 'mousemove', (e) => {
                    if (this._tooltipVisible && e.location && e.primitive === this._polyline) {
                        this._tooltip.Set('position', e.location);
                    }
                });
                this._mouseOutListener = Microsoft.Maps.Events.addHandler(this._polyline, 'mouseout', (e) => {
                    if (this._tooltipVisible) {
                        this._tooltip.Set('hidden', true);
                        this._tooltipVisible = false;
                    }
                });
                this._hasToolTipReceiver = true;
            }
        }
        if ((!this._showTooltip || this._title === '' || this._title == null)) {
            if (this._hasToolTipReceiver) {
                if (this._mouseOutListener) {
                    Microsoft.Maps.Events.removeHandler(this._mouseOutListener);
                }
                if (this._mouseOverListener) {
                    Microsoft.Maps.Events.removeHandler(this._mouseOverListener);
                }
                if (this._mouseMoveListener) {
                    Microsoft.Maps.Events.removeHandler(this._mouseMoveListener);
                }
                this._hasToolTipReceiver = false;
            }
            if (this._tooltip) {
                this._tooltip.SetMap(null);
                this._tooltip = null;
            }
        }
    }
}

/**
 * This contstant translates the abstract map events into their corresponding bing map
 * equivalents.
 */
const BingMapEventsLookup = {
    click: 'click',
    dblclick: 'dblclick',
    rightclick: 'rightclick',
    resize: 'resize',
    boundschanged: 'viewchangeend',
    centerchanged: 'viewchangeend',
    zoomchanged: 'viewchangeend',
    mouseover: 'mouseover',
    mouseout: 'mouseout',
    mousemove: 'mousemove',
    infowindowclose: 'infoboxChanged'
};

/**
 * Concrete implementing a canvas overlay to be placed on the map for Bing Maps.
 *
 * @export
 */
class BingCanvasOverlay extends CanvasOverlay {
    /**
     * Creates a new instance of the BingCanvasOverlay class.
     * @param drawCallback A callback function that is triggered when the canvas is ready to be
     * rendered for the current map view.
     * @memberof BingCanvasOverlay
     */
    constructor(drawCallback) {
        super(drawCallback);
    }
    ///
    /// Public methods
    ///
    /**
     * Obtains geo coordinates for the click location
     *
     * @abstract
     * @param e - The mouse event. Expected to implement {@link Microsoft.Maps.IMouseEventArgs}.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     * @memberof BingCanvasOverlay
     */
    GetCoordinatesFromClick(e) {
        return { latitude: e.location.latitude, longitude: e.location.longitude };
    }
    /**
     * Gets the map associted with the label.
     *
     * @memberof BingCanvasOverlay
     * @method
     */
    GetMap() {
        return this.getMap();
    }
    /**
     * Returns a MapLabel instance for the current platform that can be used as a tooltip.
     * This method only generates the map label. Content and placement is the responsibility
     * of the caller. Note that this method returns null until OnLoad has been called.
     *
     * @returns - The label to be used for the tooltip.
     * @memberof BingCanvasOverlay
     * @method
     */
    GetToolTipOverlay() {
        const o = {
            align: 'left',
            offset: new Microsoft.Maps.Point(0, 25),
            backgroundColor: 'bisque',
            hidden: true,
            fontSize: 12,
            fontColor: '#000000',
            strokeWeight: 0
        };
        const label = new BingMapLabel(o);
        label.SetMap(this.GetMap());
        return label;
    }
    /**
     * CanvasOverlay loaded, attach map events for updating canvas.
     * @abstract
     * @method
     * @memberof BingCanvasOverlay
     */
    OnLoad() {
        const map = this.getMap();
        // Get the current map view information.
        this._zoomStart = map.getZoom();
        this._centerStart = map.getCenter();
        // Redraw the canvas.
        this.Redraw(true);
        // When the map moves, move the canvas accordingly.
        this._viewChangeEvent = Microsoft.Maps.Events.addHandler(map, 'viewchange', (e) => {
            if (map.getMapTypeId() === Microsoft.Maps.MapTypeId.streetside) {
                // Don't show the canvas if the map is in Streetside mode.
                this._canvas.style.display = 'none';
            }
            else {
                // Re-drawing the canvas as it moves would be too slow. Instead, scale and translate canvas element.
                const zoomCurrent = map.getZoom();
                const centerCurrent = map.getCenter();
                // Calculate map scale based on zoom level difference.
                const scale = Math.pow(2, zoomCurrent - this._zoomStart);
                // Calculate the scaled dimensions of the canvas.
                const newWidth = map.getWidth() * scale;
                const newHeight = map.getHeight() * scale;
                // Calculate offset of canvas based on zoom and center offsets.
                const pixelPoints = map.tryLocationToPixel([
                    BingConversions.TranslateLocation(this._centerStart),
                    centerCurrent
                ], Microsoft.Maps.PixelReference.control);
                const centerOffsetX = pixelPoints[1].x - pixelPoints[0].x;
                const centerOffsetY = pixelPoints[1].y - pixelPoints[0].y;
                const x = (-(newWidth - map.getWidth()) / 2) - centerOffsetX;
                const y = (-(newHeight - map.getHeight()) / 2) - centerOffsetY;
                // Update the canvas CSS position and dimensions.
                this.UpdatePosition(x, y, newWidth, newHeight);
            }
        });
        // When the map stops moving, render new data on the canvas.
        this._viewChangeEndEvent = Microsoft.Maps.Events.addHandler(map, 'viewchangeend', (e) => {
            this.UpdateCanvas();
        });
        // Update the position of the overlay when the map is resized.
        this._mapResizeEvent = Microsoft.Maps.Events.addHandler(map, 'mapresize', (e) => {
            this.UpdateCanvas();
        });
        // set the overlay to ready state
        this._readyResolver(true);
    }
    /**
     * Sets the map for the label. Settings this to null remove the label from hte map.
     *
     * @param map - Map to associated with the label.
     * @memberof CanvasOverlay
     * @method
     */
    SetMap(map) {
        const m = this.GetMap();
        if (map === m) {
            return;
        }
        if (m) {
            m.layers.remove(this);
        }
        if (map != null) {
            map.layers.insert(this);
        }
    }
    ///
    /// Protected methods
    ///
    /**
     * Attaches the canvas to the map.
     * @memberof CanvasOverlay
     * @method
     */
    SetCanvasElement(el) {
        this.setHtmlElement(el);
    }
    /**
     * Remove the map event handlers.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    RemoveEventHandlers() {
        // Remove all event handlers from the map.
        Microsoft.Maps.Events.removeHandler(this._viewChangeEvent);
        Microsoft.Maps.Events.removeHandler(this._viewChangeEndEvent);
        Microsoft.Maps.Events.removeHandler(this._mapResizeEvent);
    }
    /**
     * Updates the Canvas size based on the map size.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    Resize() {
        const map = this.getMap();
        // Clear canvas by updating dimensions. This also ensures canvas stays the same size as the map.
        this._canvas.width = map.getWidth();
        this._canvas.height = map.getHeight();
    }
    /**
     * Updates the Canvas.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    UpdateCanvas() {
        const map = this.getMap();
        // Only render the canvas if it isn't in streetside mode.
        if (map.getMapTypeId() !== Microsoft.Maps.MapTypeId.streetside) {
            this._canvas.style.display = '';
            // Reset CSS position and dimensions of canvas.
            this.UpdatePosition(0, 0, map.getWidth(), map.getHeight());
            // Redraw the canvas.
            this.Redraw(true);
            // Get the current map view information.
            this._zoomStart = map.getZoom();
            this._centerStart = map.getCenter();
        }
    }
}
/**
 * Helper function to extend the OverlayView into the CanvasOverlay
 *
 * @export
 * @method
 */
function MixinCanvasOverlay() {
    new Extender(BingCanvasOverlay)
        .Extend(new Microsoft.Maps.CustomOverlay())
        .Map('onAdd', 'OnAdd')
        .Map('onLoad', 'OnLoad')
        .Map('onRemove', 'OnRemove');
}

let google$1;
/**
 * Identifiers used to specify the placement of controls on the map. Controls are
 * positioned relative to other controls in the same layout position. Controls that
 * are added first are positioned closer to the edge of the map.
 */
var ControlPosition;
(function (ControlPosition) {
    ControlPosition[ControlPosition["BOTTOM_CENTER"] = 0] = "BOTTOM_CENTER";
    ControlPosition[ControlPosition["BOTTOM_LEFT"] = 1] = "BOTTOM_LEFT";
    ControlPosition[ControlPosition["BOTTOM_RIGHT"] = 2] = "BOTTOM_RIGHT";
    ControlPosition[ControlPosition["LEFT_BOTTOM"] = 3] = "LEFT_BOTTOM";
    ControlPosition[ControlPosition["LEFT_CENTER"] = 4] = "LEFT_CENTER";
    ControlPosition[ControlPosition["LEFT_TOP"] = 5] = "LEFT_TOP";
    ControlPosition[ControlPosition["RIGHT_BOTTOM"] = 6] = "RIGHT_BOTTOM";
    ControlPosition[ControlPosition["RIGHT_CENTER"] = 7] = "RIGHT_CENTER";
    ControlPosition[ControlPosition["RIGHT_TOP"] = 8] = "RIGHT_TOP";
    ControlPosition[ControlPosition["TOP_CENTER"] = 9] = "TOP_CENTER";
    ControlPosition[ControlPosition["TOP_LEFT"] = 10] = "TOP_LEFT";
    ControlPosition[ControlPosition["TOP_RIGHT"] = 11] = "TOP_RIGHT";
})(ControlPosition || (ControlPosition = {}));
var MapTypeId$1;
(function (MapTypeId) {
    /** This map type displays a transparent layer of major streets on satellite images. */
    MapTypeId[MapTypeId["hybrid"] = 0] = "hybrid";
    /** This map type displays a normal street map. */
    MapTypeId[MapTypeId["roadmap"] = 1] = "roadmap";
    /** This map type displays satellite images. */
    MapTypeId[MapTypeId["satellite"] = 2] = "satellite";
    /** This map type displays maps with physical features such as terrain and vegetation. */
    MapTypeId[MapTypeId["terrain"] = 3] = "terrain";
})(MapTypeId$1 || (MapTypeId$1 = {}));
var MapTypeControlStyle;
(function (MapTypeControlStyle) {
    MapTypeControlStyle[MapTypeControlStyle["DEFAULT"] = 0] = "DEFAULT";
    MapTypeControlStyle[MapTypeControlStyle["DROPDOWN_MENU"] = 1] = "DROPDOWN_MENU";
    MapTypeControlStyle[MapTypeControlStyle["HORIZONTAL_BAR"] = 2] = "HORIZONTAL_BAR";
})(MapTypeControlStyle || (MapTypeControlStyle = {}));
var ScaleControlStyle;
(function (ScaleControlStyle) {
    ScaleControlStyle[ScaleControlStyle["DEFAULT"] = 0] = "DEFAULT";
})(ScaleControlStyle || (ScaleControlStyle = {}));
var ZoomControlStyle;
(function (ZoomControlStyle) {
    ZoomControlStyle[ZoomControlStyle["DEFAULT"] = 0] = "DEFAULT";
    ZoomControlStyle[ZoomControlStyle["LARGE"] = 1] = "LARGE";
    ZoomControlStyle[ZoomControlStyle["SMALL"] = 2] = "SMALL";
})(ZoomControlStyle || (ZoomControlStyle = {}));

/**
 * This class contains helperfunctions to map various interfaces used to represent options and structures into the
 * corresponding Google Maps specific implementations.
 *
 * @export
 */
class GoogleConversions {
    /**
     * Maps an IBox object to a GoogleMapTypes.LatLngBoundsLiteral object.
     *
     * @param bounds - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateBounds(bounds) {
        const b = {
            east: bounds.maxLongitude,
            north: bounds.maxLatitude,
            south: bounds.minLatitude,
            west: bounds.minLongitude,
        };
        return b;
    }
    /**
     * Maps an IInfoWindowOptions object to a GoogleMapTypes.InfoWindowOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateInfoWindowOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => GoogleConversions._infoWindowOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'htmlContent') {
                o.content = options[k];
            }
            else {
                o[k] = options[k];
            }
        });
        if (o.content == null || o.content === '') {
            if (options.title !== '' && options.description !== '') {
                o.content = `${options.title}: ${options.description}`;
            }
            else if (options.description !== '') {
                o.content = options.description;
            }
            else {
                o.content = options.title;
            }
        }
        return o;
    }
    /**
     * Maps an ILatLong object to a GoogleMapTypes.LatLngLiteral object.
     *
     * @param latlong - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLocation(latlong) {
        const l = { lat: latlong.latitude, lng: latlong.longitude };
        return l;
    }
    /**
     * Maps an GoogleMapTypes.LatLngLiteral object to a ILatLong object.
     *
     * @param latlng - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLatLng(latlng) {
        const l = { latitude: latlng.lat, longitude: latlng.lng };
        return l;
    }
    /**
     * Maps an ILatLong object to a GoogleMapTypes.LatLng object.
     *
     * @param latlong - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLocationObject(latlong) {
        const l = new google.maps.LatLng(latlong.latitude, latlong.longitude);
        return l;
    }
    /**
     * Maps an GoogleMapTypes.LatLng object to a ILatLong object.
     *
     * @param latlng - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLatLngObject(latlng) {
        const l = { latitude: latlng.lat(), longitude: latlng.lng() };
        return l;
    }
    /**
     * Maps an ILatLong array to a array of GoogleMapTypes.LatLng object.
     *
     * @param latlongArray - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateLocationObjectArray(latlongArray) {
        // use for loop for performance in case we deal with large numbers of points and paths...
        const p = new Array();
        for (let i = 0; i < latlongArray.length; i++) {
            p.push(GoogleConversions.TranslateLocationObject(latlongArray[i]));
        }
        return p;
    }
    /**
     * Maps a MapTypeId object to a Google maptype string.
     *
     * @param mapTypeId - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateMapTypeId(mapTypeId) {
        switch (mapTypeId) {
            case MapTypeId.road: return MapTypeId$1[MapTypeId$1.roadmap];
            case MapTypeId.grayscale: return MapTypeId$1[MapTypeId$1.terrain];
            case MapTypeId.hybrid: return MapTypeId$1[MapTypeId$1.hybrid];
            case MapTypeId.ordnanceSurvey: return MapTypeId$1[MapTypeId$1.terrain];
            default: return MapTypeId$1[MapTypeId$1.satellite];
        }
    }
    /**
     * Maps an IMarkerOptions object to a GoogleMapTypes.MarkerOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Promise that when resolved contains the mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateMarkerOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => GoogleConversions._markerOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'position') {
                const latlng = GoogleConversions.TranslateLocationObject(options[k]);
                o.position = latlng;
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Maps an IMapOptions object to a GoogleMapTypes.MapOptions object.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslateOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => GoogleConversions._mapOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'center') {
                o.center = GoogleConversions.TranslateLocation(options.center);
            }
            else if (k === 'mapTypeId') {
                o.mapTypeId = GoogleConversions.TranslateMapTypeId(options.mapTypeId);
            }
            else if (k === 'disableZooming') {
                o.gestureHandling = 'none';
                o.zoomControl = false;
            }
            else if (k === 'showMapTypeSelector') {
                o.mapTypeControl = false;
            }
            else if (k === 'customMapStyleGoogle') {
                o.styles = options.customMapStyleGoogle;
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     * Translates an array of locations or an array or arrays of location to and array of arrays of Bing Map Locations
     *
     * @param paths - ILatLong based locations to convert.
     * @returns - converted locations.
     *
     * @memberof GoogleConversions
     */
    static TranslatePaths(paths) {
        const p = new Array();
        if (paths == null || !Array.isArray(paths) || paths.length === 0) {
            p.push(new Array());
        }
        else if (Array.isArray(paths[0])) {
            // parameter is an array or arrays
            // use for loop for performance in case we deal with large numbers of points and paths...
            const p1 = paths;
            for (let i = 0; i < p1.length; i++) {
                p.push(GoogleConversions.TranslateLocationObjectArray(p1[i]));
            }
        }
        else {
            // parameter is a simple array....
            p.push(GoogleConversions.TranslateLocationObjectArray(paths));
        }
        return p;
    }
    /**
     *  Maps an IPolygonOptions object to a GoogleMapTypes.PolygonOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslatePolygonOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => GoogleConversions._polygonOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            if (k === 'paths') {
                if (!Array.isArray(options.paths)) {
                    return;
                }
                if (options.paths.length === 0) {
                    o.paths = new Array();
                }
                else if (Array.isArray(options.paths[0])) {
                    o.paths = new Array();
                    // use for loop for performance in case we deal with large numbers of points and paths..
                    const p1 = options.paths;
                    for (let i = 0; i < p1.length; i++) {
                        o.paths[i] = new Array();
                        for (let j = 0; j < p1[i].length; j++) {
                            o.paths[i][j] = { lat: p1[i][j].latitude, lng: p1[i][j].longitude };
                        }
                    }
                }
                else {
                    o.paths = new Array();
                    // use for loop for performance in case we deal with large numbers of points and paths..
                    const p1 = options.paths;
                    for (let i = 0; i < p1.length; i++) {
                        o.paths[i] = { lat: p1[i].latitude, lng: p1[i].longitude };
                    }
                }
            }
            else {
                o[k] = options[k];
            }
        });
        return o;
    }
    /**
     *  Maps an IPolylineOptions object to a GoogleMapTypes.PolylineOptions.
     *
     * @param options - Object to be mapped.
     * @returns - Mapped object.
     *
     * @memberof GoogleConversions
     */
    static TranslatePolylineOptions(options) {
        const o = {};
        Object.keys(options)
            .filter(k => GoogleConversions._polylineOptionsAttributes.indexOf(k) !== -1)
            .forEach((k) => {
            o[k] = options[k];
        });
        return o;
    }
}
///
/// Field declarations
///
/**
 * Map option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._mapOptionsAttributes = [
    'backgroundColor',
    'center',
    'clickableIcons',
    'customMapStyleGoogle',
    'disableDefaultUI',
    'disableDoubleClickZoom',
    'draggable',
    'draggableCursor',
    'draggingCursor',
    'disableZooming',
    'fullscreenControl',
    'fullscreenControlOptions',
    'gestureHandling',
    'heading',
    'keyboardShortcuts',
    'mapTypeControl',
    'mapTypeControlOptions',
    'mapTypeId',
    'maxZoom',
    'minZoom',
    'noClear',
    'panControl',
    'panControlOptions',
    'rotateControl',
    'rotateControlOptions',
    'scaleControl',
    'scaleControlOptions',
    'scrollwheel',
    'showMapTypeSelector',
    'streetView',
    'streetViewControl',
    'streetViewControlOptions',
    'styles',
    'tilt',
    'zoom',
    'zoomControl',
    'zoomControlOptions'
];
/**
 * InfoWindow option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._infoWindowOptionsAttributes = [
    'actions',
    'description',
    'htmlContent',
    'id',
    'position',
    'pixelOffset',
    'showCloseButton',
    'showPointer',
    'pushpin',
    'title',
    'titleClickHandler',
    'typeName',
    'visible',
    'width',
    'height'
];
/**
 * Marker option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._markerOptionsAttributes = [
    'anchor',
    'position',
    'title',
    'text',
    'label',
    'draggable',
    'icon',
    'width',
    'height',
    'iconInfo',
    'metadata',
    'visible'
];
/**
 * Cluster option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._clusterOptionsAttributes = [
    'callback',
    'clusteredPinCallback',
    'clusteringEnabled',
    'gridSize',
    'layerOffset',
    'placementMode',
    'visible',
    'zIndex'
];
/**
 * Polygon option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._polygonOptionsAttributes = [
    'clickable',
    'draggable',
    'editable',
    'fillColor',
    'fillOpacity',
    'geodesic',
    'paths',
    'strokeColor',
    'strokeOpacity',
    'strokeWeight',
    'visible',
    'zIndex'
];
/**
 * Polyline option attributes that are supported for conversion to Google Map properties
 *
 * @memberof GoogleConversions
 */
GoogleConversions._polylineOptionsAttributes = [
    'clickable',
    'draggable',
    'editable',
    'geodesic',
    'strokeColor',
    'strokeOpacity',
    'strokeWeight',
    'visible',
    'zIndex'
];

/**
 * Concrete implementation for a {@link InfoWindow}} model for Google Maps.
 *
 * @export
 */
class GoogleInfoWindow {
    ///
    /// constructor
    ///
    /**
     * Creates an instance of GoogleInfoWindow.
     * @param _infoWindow - A {@link GoogleMapTypes.InfoWindow} instance underlying the model.
     * @param _mapService - An instance of the {@link GoogleMapService}.
     * @memberof GoogleInfoWindow
     */
    constructor(_infoWindow, _mapService) {
        this._infoWindow = _infoWindow;
        this._mapService = _mapService;
    }
    /**
     * Gets whether the info box is currently open.
     *
     * @readonly
     * @memberof InfoWGoogleInfoWindowindow
     */
    get IsOpen() {
        if (this._isOpen === true) {
            return true;
        }
        return false;
    }
    /**
     * Gets the underlying native object.
     *
     * @property
     * @readonly
     */
    get NativePrimitve() {
        return this._infoWindow;
    }
    ///
    /// Public methods
    ///
    /**
      * Adds an event listener to the InfoWindow.
      *
      * @param eventType - String containing the event for which to register the listener (e.g. "click")
      * @param fn - Delegate invoked when the event occurs.
      *
      * @memberof GoogleInfoWindow
      * @method
      */
    AddListener(eventType, fn) {
        this._infoWindow.addListener(eventType, (e) => {
            if (eventType === 'closeclick') {
                this._isOpen = false;
            }
            fn(e);
        });
    }
    /**
     *
     * Closes the info window.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    Close() {
        this._isOpen = false;
        this._infoWindow.close();
    }
    /**
     * Gets the position of the info window
     *
     * @returns - The geo coordinates of the info window.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    GetPosition() {
        return GoogleConversions.TranslateLatLngObject(this._infoWindow.getPosition());
    }
    /**
     * Opens the info window
     *
     * @param [anchor] - Optional Anchor.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    Open(anchor) {
        this._mapService.MapPromise.then(m => {
            this._isOpen = true;
            this._infoWindow.open(m, anchor);
        });
    }
    /**
     * Sets the info window options
     *
     * @param options - The options to set. This object will be merged with the existing options.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    SetOptions(options) {
        const o = GoogleConversions.TranslateInfoWindowOptions(options);
        this._infoWindow.setOptions(o);
    }
    /**
     * Sets the info window position
     *
     * @param position - Geo coordinates at which to anchor the info window.
     *
     * @memberof GoogleInfoWindow
     * @method
     */
    SetPosition(position) {
        const l = GoogleConversions.TranslateLocation(position);
        this._infoWindow.setPosition(l);
    }
}

/**
 * Concrete implementation of the {@link Marker} contract for the Google Maps map architecture.
 *
 * @export
 */
class GoogleMarker {
    ///
    /// Constructors
    ///
    /**
     * Creates an instance of GoogleMarker.
     * @param _marker
     *
     * @memberof GoogleMarker
     */
    constructor(_marker) {
        this._marker = _marker;
        ///
        /// Field declarations
        ///
        this._metadata = new Map();
        this._isFirst = false;
        this._isLast = true;
    }
    ///
    /// Public properties
    ///
    /**
     * Indicates that the marker is the first marker in a set.
     *
     * @memberof Marker
     */
    get IsFirst() { return this._isFirst; }
    set IsFirst(val) { this._isFirst = val; }
    /**
     * Indicates that the marker is the last marker in the set.
     *
     * @memberof Marker
     */
    get IsLast() { return this._isLast; }
    set IsLast(val) { this._isLast = val; }
    /**
     * Gets the marker metadata.
     *
     * @readonly
     * @memberof BingMarker
     */
    get Metadata() { return this._metadata; }
    /**
     * Gets the native primitve implementing the marker, in this case {@link Microsoft.Maps.Pushpin}
     *
     * @readonly
     * @abstract
     * @memberof BingMarker
     */
    get NativePrimitve() { return this._marker; }
    /**
     * Gets the Location of the marker
     *
     * @readonly
     * @abstract
     * @memberof BingMarker
     */
    get Location() {
        const l = this._marker.getPosition();
        return {
            latitude: l.lat(),
            longitude: l.lng()
        };
    }
    ///
    /// Public methods
    ///
    /**
     * Adds an event listener to the marker.
     *
     * @param eventType - String containing the event for which to register the listener (e.g. "click")
     * @param fn - Delegate invoked when the event occurs.
     *
     * @memberof GoogleMarker
     */
    AddListener(eventType, fn) {
        this._marker.addListener(eventType, fn);
    }
    /**
     * Deletes the marker.
     *
     *
     * @memberof GoogleMarker
     */
    DeleteMarker() {
        this._marker.setMap(null);
    }
    /**
     * Gets the marker label
     *
     * @memberof GoogleMarker
     */
    GetLabel() {
        return this._marker.getLabel().text;
    }
    /**
     * Gets whether the marker is visible.
     *
     * @returns - True if the marker is visible, false otherwise.
     *
     * @memberof GoogleMarker
     */
    GetVisible() {
        return this._marker.getVisible();
    }
    /**
     * Sets the anchor for the marker. Use this to adjust the root location for the marker to accomodate various marker image sizes.
     *
     * @param anchor - Point coordinates for the marker anchor.
     *
     * @memberof GoogleMarker
     */
    SetAnchor(anchor) {
        // not implemented
        // TODO: we need to switch the model to complex icons for google to
        // support anchors, sizes and origins.
        // https://developers.google.com/maps/documentation/javascript/markers
    }
    /**
     * Sets the draggability of a marker.
     *
     * @param draggable - True to mark the marker as draggable, false otherwise.
     *
     * @memberof GoogleMarker
     */
    SetDraggable(draggable) {
        this._marker.setDraggable(draggable);
    }
    /**
     * Sets the icon for the marker.
     *
     * @param icon - String containing the icon in various forms (url, data url, etc.)
     *
     * @memberof GoogleMarker
     */
    SetIcon(icon) {
        this._marker.setIcon(icon);
    }
    /**
     * Sets the marker label.
     *
     * @param label - String containing the label to set.
     *
     * @memberof GoogleMarker
     */
    SetLabel(label) {
        this._marker.setLabel(label);
    }
    /**
     * Sets the marker position.
     *
     * @param latLng - Geo coordinates to set the marker position to.
     *
     * @memberof GoogleMarker
     */
    SetPosition(latLng) {
        const p = GoogleConversions.TranslateLocationObject(latLng);
        this._marker.setPosition(p);
    }
    /**
     * Sets the marker title.
     *
     * @param title - String containing the title to set.
     *
     * @memberof GoogleMarker
     */
    SetTitle(title) {
        this._marker.setTitle(title);
    }
    /**
     * Sets the marker options.
     *
     * @param options - {@link IMarkerOptions} object containing the marker options to set. The supplied options are
     * merged with the underlying marker options.
     *
     * @memberof GoogleMarker
     */
    SetOptions(options) {
        const o = GoogleConversions.TranslateMarkerOptions(options);
        this._marker.setOptions(o);
    }
    /**
     * Sets whether the marker is visible.
     *
     * @param visible - True to set the marker visible, false otherwise.
     *
     * @memberof GoogleMarker
     */
    SetVisible(visible) {
        this._marker.setVisible(visible);
    }
}

/**
 * Implements map a labled to be placed on the map.
 *
 * @export
 */
class GoogleMapLabel extends MapLabel {
    /**
     * Returns the default label style for the platform
     *
     * @readonly
     * @abstract
     * @memberof GoogleMapLabel
     */
    get DefaultLabelStyle() {
        return {
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontColor: '#ffffff',
            strokeWeight: 3,
            strokeColor: '#000000'
        };
    }
    ///
    /// Constructor
    ///
    /**
     * Creates a new MapLabel
     * @param options Optional properties to set.
     */
    constructor(options) {
        options.fontSize = options.fontSize || 12;
        options.fontColor = options.fontColor || '#ffffff';
        options.strokeWeight = options.strokeWeight || 3;
        options.strokeColor = options.strokeColor || '#000000';
        super(options);
    }
    ///
    /// Public methods
    ///
    /**
     * Gets the value of a setting.
     *
     * @param key - Key specifying the setting.
     * @returns - The value of the setting.
     * @memberof MapLabel
     * @method
     */
    Get(key) {
        return this.get(key);
    }
    /**
     * Gets the map associted with the label.
     *
     * @memberof GoogleMapLabel
     * @method
     */
    GetMap() {
        return this.getMap();
    }
    /**
     * Set the value for a setting.
     *
     * @param key - Key specifying the setting.
     * @param val - The value to set.
     * @memberof MapLabel
     * @method
     */
    Set(key, val) {
        if (key === 'position' && val.hasOwnProperty('latitude') && val.hasOwnProperty('longitude')) {
            val = new google.maps.LatLng(val.latitude, val.longitude);
        }
        if (this.Get(key) !== val) {
            this.set(key, val);
        }
    }
    /**
     * Sets the map for the label. Settings this to null remove the label from hte map.
     *
     * @param map - Map to associated with the label.
     * @memberof GoogleMapLabel
     * @method
     */
    SetMap(map) {
        this.setMap(map);
    }
    /**
     * Applies settings to the object
     *
     * @param options - An object containing the settings key value pairs.
     * @memberof MapLabel
     * @method
     */
    SetValues(options) {
        for (const key in options) {
            if (key !== '') {
                if (key === 'position' && options[key].hasOwnProperty('latitude') && options[key].hasOwnProperty('longitude')) {
                    options[key] = new google.maps.LatLng(options[key].latitude, options[key].longitude);
                }
                if (this.Get(key) === options[key]) {
                    delete options[key];
                }
            }
        }
        this.setValues(options);
    }
    ///
    /// Protected methods
    ///
    /**
     * Draws the label on the map.
     * @memberof GoogleMapLabel
     * @method
     * @protected
     */
    Draw() {
        const projection = this.getProjection();
        const visibility = this.GetVisible();
        if (!projection) {
            // The map projection is not ready yet so do nothing
            return;
        }
        if (!this._canvas) {
            // onAdd has not been called yet.
            return;
        }
        const style = this._canvas.style;
        if (visibility !== '') {
            // label is not visible, don't calculate positions etc.
            style['visibility'] = visibility;
            return;
        }
        let offset = this.Get('offset');
        let latLng = this.Get('position');
        if (!latLng) {
            return;
        }
        if (!(latLng instanceof google.maps.LatLng)) {
            latLng = new google.maps.LatLng(latLng.lat, latLng.lng);
        }
        if (!offset) {
            offset = new google.maps.Point(0, 0);
        }
        const pos = projection.fromLatLngToDivPixel(latLng);
        style['top'] = (pos.y + offset.y) + 'px';
        style['left'] = (pos.x + offset.x) + 'px';
        style['visibility'] = visibility;
    }
    /**
     * Delegate called when the label is added to the map. Generates and configures
     * the canvas.
     *
     * @memberof GoogleMapLabel
     * @method
     * @protected
     */
    OnAdd() {
        this._canvas = document.createElement('canvas');
        const style = this._canvas.style;
        style.position = 'absolute';
        const ctx = this._canvas.getContext('2d');
        ctx.lineJoin = 'round';
        ctx.textBaseline = 'top';
        this.DrawCanvas();
        const panes = this.getPanes();
        if (panes) {
            panes.overlayLayer.appendChild(this._canvas);
            // 4: floatPane (infowindow)
            // 3: overlayMouseTarget (mouse events)
            // 2: markerLayer (marker images)
            // 1: overlayLayer (polygons, polylines, ground overlays, tile layer overlays)
            // 0: mapPane (lowest pane above the map tiles)
        }
    }
}
/**
 * Helper function to extend the OverlayView into the MapLabel
 *
 * @export
 * @method
 */
function MixinMapLabelWithOverlayView$1() {
    new Extender(GoogleMapLabel)
        .Extend(new google.maps.OverlayView)
        .Map('changed', 'Changed')
        .Map('onAdd', 'OnAdd')
        .Map('draw', 'Draw')
        .Map('onRemove', 'OnRemove');
}

/**
 * Concrete implementation for a polygon model for Google Maps.
 *
 * @export
 */
class GooglePolygon extends Polygon {
    ///
    /// constructor
    ///
    /**
     * Creates an instance of GooglePolygon.
     * @param _polygon - The {@link GoogleMapTypes.Polygon} underlying the model.
     *
     * @memberof GooglePolygon
     */
    constructor(_polygon) {
        super();
        this._polygon = _polygon;
        this._title = '';
        this._showLabel = false;
        this._showTooltip = false;
        this._maxZoom = -1;
        this._minZoom = -1;
        this._label = null;
        this._tooltip = null;
        this._tooltipVisible = false;
        this._hasToolTipReceiver = false;
        this._mouseOverListener = null;
        this._mouseOutListener = null;
        this._mouseMoveListener = null;
        this._metadata = new Map();
        this._editingCompleteEmitter = null;
        this._originalPath = this.GetPaths();
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets or sets the maximum zoom at which the label is displayed. Ignored or ShowLabel is false.
     *
     * @memberof GooglePolygon
     * @property
     */
    get LabelMaxZoom() { return this._maxZoom; }
    set LabelMaxZoom(val) {
        this._maxZoom = val;
        this.ManageLabel();
    }
    /**
     * Gets or sets the minimum zoom at which the label is displayed. Ignored or ShowLabel is false.
     *
     * @memberof GooglePolygon
     * @property
     */
    get LabelMinZoom() { return this._minZoom; }
    set LabelMinZoom(val) {
        this._minZoom = val;
        this.ManageLabel();
    }
    /**
     * Gets the polygon metadata.
     *
     * @readonly
     * @memberof GoolePolygon
     */
    get Metadata() { return this._metadata; }
    /**
     * Gets the native primitve implementing the polygon, in this case {@link GoogleMapTypes.Polygon}
     *
     * @readonly
     * @memberof GooglePolygon
     */
    get NativePrimitve() { return this._polygon; }
    /**
     * Gets or sets whether to show the label
     *
     * @abstract
     * @memberof GooglePolygon
     * @property
     */
    get ShowLabel() { return this._showLabel; }
    set ShowLabel(val) {
        this._showLabel = val;
        this.ManageLabel();
    }
    /**
     * Gets or sets whether to show the tooltip
     *
     * @abstract
     * @memberof GooglePolygon
     * @property
     */
    get ShowTooltip() { return this._showTooltip; }
    set ShowTooltip(val) {
        this._showTooltip = val;
        this.ManageTooltip();
    }
    /**
     * Gets or sets the title off the polygon
     *
     * @abstract
     * @memberof GooglePolygon
     * @property
     */
    get Title() { return this._title; }
    set Title(val) {
        this._title = val;
        this.ManageLabel();
        this.ManageTooltip();
    }
    /**
     * Adds a delegate for an event.
     *
     * @param eventType - String containing the event name.
     * @param fn - Delegate function to execute when the event occurs.

     * @memberof GooglePolygon
     */
    AddListener(eventType, fn) {
        const supportedEvents = [
            'click',
            'dblclick',
            'drag', 'dragend',
            'dragstart',
            'mousedown',
            'mousemove',
            'mouseout',
            'mouseover',
            'mouseup',
            'rightclick'
        ];
        if (supportedEvents.indexOf(eventType) !== -1) {
            this._polygon.addListener(eventType, fn);
        }
        if (eventType === 'pathchanged') {
            this._editingCompleteEmitter = fn;
        }
    }
    /**
     * Deleted the polygon.
     *
     * @memberof GooglePolygon
     */
    Delete() {
        this._polygon.setMap(null);
        if (this._label) {
            this._label.Delete();
        }
        if (this._tooltip) {
            this._tooltip.Delete();
        }
    }
    /**
     * Gets whether the polygon is draggable.
     *
     * @returns - True if the polygon is dragable, false otherwise.
     *
     * @memberof GooglePolygon
     */
    GetDraggable() {
        return this._polygon.getDraggable();
    }
    /**
     * Gets whether the polygon path can be edited.
     *
     * @returns - True if the path can be edited, false otherwise.
     *
     * @memberof GooglePolygon
     */
    GetEditable() {
        return this._polygon.getEditable();
    }
    /**
     * Gets the polygon path.
     *
     * @returns - Array of {@link ILatLong} objects describing the polygon path.
     *
     * @memberof GooglePolygon
     */
    GetPath() {
        const p = this._polygon.getPath();
        const path = new Array();
        p.forEach(x => path.push({ latitude: x.lat(), longitude: x.lng() }));
        return path;
    }
    /**
     * Gets the polygon paths.
     *
     * @returns - Array of Array of {@link ILatLong} objects describing multiple polygon paths.
     *
     * @memberof GooglePolygon
     */
    GetPaths() {
        const p = this._polygon.getPaths();
        const paths = new Array();
        p.forEach(x => {
            const path = new Array();
            x.forEach(y => path.push({ latitude: y.lat(), longitude: y.lng() }));
            paths.push(path);
        });
        return paths;
    }
    /**
     * Gets whether the polygon is visible.
     *
     * @returns - True if the polygon is visible, false otherwise.
     *
     * @memberof GooglePolygon
     */
    GetVisible() {
        return this._polygon.getVisible();
    }
    /**
     * Sets whether the polygon is dragable.
     *
     * @param draggable - True to make the polygon dragable, false otherwise.
     *
     * @memberof GooglePolygon
     */
    SetDraggable(draggable) {
        this._polygon.setDraggable(draggable);
    }
    /**
     * Sets wether the polygon path is editable.
     *
     * @param editable - True to make polygon path editable, false otherwise.
     *
     * @memberof GooglePolygon
     */
    SetEditable(editable) {
        const previous = this._polygon.getEditable();
        this._polygon.setEditable(editable);
        if (previous && !editable && this._editingCompleteEmitter) {
            this._editingCompleteEmitter({
                Click: null,
                Polygon: this,
                OriginalPath: this._originalPath,
                NewPath: this.GetPaths()
            });
            this._originalPath = this.GetPaths();
        }
    }
    /**
     * Sets the polygon options
     *
     * @param options - {@link ILatLong} object containing the options. The options are merged with hte ones
     * already on the underlying model.
     *
     * @memberof GooglePolygon
     */
    SetOptions(options) {
        const o = GoogleConversions.TranslatePolygonOptions(options);
        if (typeof o.editable !== 'undefined') {
            this.SetEditable(o.editable);
            delete o.editable;
        }
        this._polygon.setOptions(o);
        if (options.visible != null && this._showLabel && this._label) {
            this._label.Set('hidden', !options.visible);
        }
    }
    /**
     * Sets the polygon path.
     *
     * @param path - An Array of {@link ILatLong} (or array of arrays) describing the polygons path.
     *
     * @memberof GooglePolygon
     */
    SetPath(path) {
        const p = new Array();
        path.forEach(x => p.push(new google.maps.LatLng(x.latitude, x.longitude)));
        this._polygon.setPath(p);
        this._originalPath = [path];
        if (this._label) {
            this._centroid = null;
            this.ManageLabel();
        }
    }
    /**
     * Set the polygon path or paths.
     *
     * @param paths An Array of {@link ILatLong}
     * (or array of arrays) describing the polygons path(s).
     *
     * @memberof GooglePolygon
     */
    SetPaths(paths) {
        if (paths == null) {
            return;
        }
        if (!Array.isArray(paths)) {
            return;
        }
        if (paths.length === 0) {
            this._polygon.setPaths(new Array());
            if (this._label) {
                this._label.Delete();
                this._label = null;
            }
            return;
        }
        if (Array.isArray(paths[0])) {
            // parameter is an array or arrays
            const p = new Array();
            paths.forEach(path => {
                const _p = new Array();
                path.forEach(x => _p.push(new google.maps.LatLng(x.latitude, x.longitude)));
                p.push(_p);
            });
            this._polygon.setPaths(p);
            this._originalPath = paths;
            if (this._label) {
                this._centroid = null;
                this.ManageLabel();
            }
        }
        else {
            // parameter is a simple array....
            this.SetPath(paths);
        }
    }
    /**
     * Sets whether the polygon is visible.
     *
     * @param visible - True to set the polygon visible, false otherwise.
     *
     * @memberof GooglePolygon
     */
    SetVisible(visible) {
        this._polygon.setVisible(visible);
        if (this._showLabel && this._label) {
            this._label.Set('hidden', !visible);
        }
    }
    ///
    /// Private methods
    ///
    /**
     * Configures the label for the polygon
     * @memberof GooglePolygon
     */
    ManageLabel() {
        if (this.GetPath == null || this.GetPath().length === 0) {
            return;
        }
        if (this._showLabel && this._title != null && this._title !== '') {
            const o = {
                text: this._title,
                position: GoogleConversions.TranslateLocationObject(this.Centroid)
            };
            if (o.position == null) {
                return;
            }
            if (this._minZoom !== -1) {
                o.minZoom = this._minZoom;
            }
            if (this._maxZoom !== -1) {
                o.maxZoom = this._maxZoom;
            }
            if (this._label == null) {
                o.map = this.NativePrimitve.getMap();
                o.zIndex = this.NativePrimitve.zIndex ? this.NativePrimitve.zIndex + 1 : 100;
                this._label = new GoogleMapLabel(o);
            }
            else {
                this._label.SetValues(o);
            }
            this._label.Set('hidden', !this.GetVisible());
        }
        else {
            if (this._label) {
                this._label.SetMap(null);
                this._label = null;
            }
        }
    }
    /**
     * Configures the tooltip for the polygon
     * @memberof GooglePolygon
     */
    ManageTooltip() {
        if (this._showTooltip && this._title != null && this._title !== '') {
            const o = {
                text: this._title,
                align: 'left',
                offset: new google.maps.Point(0, 25),
                backgroundColor: 'bisque',
                hidden: true,
                fontSize: 12,
                fontColor: '#000000',
                strokeWeight: 0
            };
            if (this._tooltip == null) {
                o.map = this.NativePrimitve.getMap();
                o.zIndex = 100000;
                this._tooltip = new GoogleMapLabel(o);
            }
            else {
                this._tooltip.SetValues(o);
            }
            if (!this._hasToolTipReceiver) {
                this._mouseOverListener = this.NativePrimitve.addListener('mouseover', (e) => {
                    this._tooltip.Set('position', e.latLng);
                    if (!this._tooltipVisible) {
                        this._tooltip.Set('hidden', false);
                        this._tooltipVisible = true;
                    }
                });
                this._mouseMoveListener = this.NativePrimitve.addListener('mousemove', (e) => {
                    if (this._tooltipVisible) {
                        this._tooltip.Set('position', e.latLng);
                    }
                });
                this._mouseOutListener = this.NativePrimitve.addListener('mouseout', (e) => {
                    if (this._tooltipVisible) {
                        this._tooltip.Set('hidden', true);
                        this._tooltipVisible = false;
                    }
                });
                this._hasToolTipReceiver = true;
            }
        }
        if ((!this._showTooltip || this._title === '' || this._title == null)) {
            if (this._hasToolTipReceiver) {
                if (this._mouseOutListener) {
                    google.maps.event.removeListener(this._mouseOutListener);
                }
                if (this._mouseOverListener) {
                    google.maps.event.removeListener(this._mouseOverListener);
                }
                if (this._mouseMoveListener) {
                    google.maps.event.removeListener(this._mouseMoveListener);
                }
                this._hasToolTipReceiver = false;
            }
            if (this._tooltip) {
                this._tooltip.SetMap(null);
                this._tooltip = null;
            }
        }
    }
}

/**
 * Concrete implementation for a polyline model for Google Maps.
 *
 * @export
 */
class GooglePolyline extends Polyline {
    ///
    /// constructor
    ///
    /**
    * Creates an instance of GooglePolygon.
    * @param _polyline - The {@link GoogleMApTypes.Polyline} underlying the model.
    *
    * @memberof GooglePolyline
    */
    constructor(_polyline) {
        super();
        this._polyline = _polyline;
        ///
        /// Field declarations
        ///
        this._title = '';
        this._showTooltip = false;
        this._tooltip = null;
        this._tooltipVisible = false;
        this._hasToolTipReceiver = false;
        this._mouseOverListener = null;
        this._mouseOutListener = null;
        this._mouseMoveListener = null;
        this._metadata = new Map();
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets the polyline metadata.
     *
     * @readonly
     * @memberof GooglePolyline
     */
    get Metadata() { return this._metadata; }
    /**
     * Gets the native primitve implementing the marker, in this case {@link GoogleMApTypes.Polyline}
     *
     * @readonly
     * @memberof GooglePolygon
     */
    get NativePrimitve() { return this._polyline; }
    /**
     * Gets or sets whether to show the tooltip
     *
     * @abstract
     * @memberof GooglePolygon
     * @property
     */
    get ShowTooltip() { return this._showTooltip; }
    set ShowTooltip(val) {
        this._showTooltip = val;
        this.ManageTooltip();
    }
    /**
     * Gets or sets the title off the polygon
     *
     * @abstract
     * @memberof GooglePolygon
     * @property
     */
    get Title() { return this._title; }
    set Title(val) {
        this._title = val;
        this.ManageTooltip();
    }
    /**
     * Adds a delegate for an event.
     *
     * @param eventType - String containing the event name.
     * @param fn - Delegate function to execute when the event occurs.
     * @memberof Polyline
     */
    AddListener(eventType, fn) {
        const supportedEvents = [
            'click',
            'dblclick',
            'drag', 'dragend',
            'dragstart',
            'mousedown',
            'mousemove',
            'mouseout',
            'mouseover',
            'mouseup',
            'rightclick'
        ];
        if (supportedEvents.indexOf(eventType) !== -1) {
            this._polyline.addListener(eventType, fn);
        }
    }
    /**
     * Deleted the polyline.
     *
     *
     * @memberof Polyline
     */
    Delete() {
        this._polyline.setMap(null);
        if (this._tooltip) {
            this._tooltip.Delete();
        }
    }
    /**
     * Gets whether the polyline is draggable.
     *
     * @returns - True if the polyline is dragable, false otherwise.
     *
     * @memberof Polyline
     */
    GetDraggable() {
        return this._polyline.getDraggable();
    }
    /**
     * Gets whether the polyline path can be edited.
     *
     * @returns - True if the path can be edited, false otherwise.
     *
     * @memberof Polyline
     */
    GetEditable() {
        return this._polyline.getEditable();
    }
    /**
     * Gets the polyline path.
     *
     * @returns - Array of {@link ILatLong} objects describing the polyline path.
     *
     * @memberof Polyline
     */
    GetPath() {
        const p = this._polyline.getPath();
        const path = new Array();
        p.forEach(x => path.push({ latitude: x.lat(), longitude: x.lng() }));
        return path;
    }
    /**
     * Gets whether the polyline is visible.
     *
     * @returns - True if the polyline is visible, false otherwise.
     *
     * @memberof Polyline
     */
    GetVisible() {
        return this._polyline.getVisible();
    }
    /**
     * Sets whether the polyline is dragable.
     *
     * @param draggable - True to make the polyline dragable, false otherwise.
     *
     * @memberof Polyline
     */
    SetDraggable(draggable) {
        this._polyline.setDraggable(draggable);
    }
    /**
     * Sets wether the polyline path is editable.
     *
     * @param editable - True to make polyline path editable, false otherwise.
     *
     * @memberof Polyline
     */
    SetEditable(editable) {
        this._polyline.setEditable(editable);
    }
    /**
     * Sets the polyline options
     *
     * @param options - {@link ILatLong} object containing the options. The options are merged with hte ones
     * already on the underlying model.
     *
     * @memberof Polyline
     */
    SetOptions(options) {
        const o = GoogleConversions.TranslatePolylineOptions(options);
        this._polyline.setOptions(o);
        if (options.path) {
            this.SetPath(options.path);
        }
    }
    /**
     * Sets the polyline path.
     *
     * @param path - An Array of {@link ILatLong} (or array of arrays) describing the polylines path.
     *
     * @memberof Polyline
     */
    SetPath(path) {
        const p = new Array();
        path.forEach(x => p.push(new google.maps.LatLng(x.latitude, x.longitude)));
        this._polyline.setPath(p);
    }
    /**
     * Sets whether the polyline is visible.
     *
     * @param visible - True to set the polyline visible, false otherwise.
     *
     * @memberof Polyline
     */
    SetVisible(visible) {
        this._polyline.setVisible(visible);
    }
    ///
    /// Private methods
    ///
    /**
     * Configures the tooltip for the polyline
     * @memberof GooglePolyline
     */
    ManageTooltip() {
        if (this._showTooltip && this._title != null && this._title !== '') {
            const o = {
                text: this._title,
                align: 'left',
                offset: new google.maps.Point(0, 25),
                backgroundColor: 'bisque',
                hidden: true,
                fontSize: 12,
                fontColor: '#000000',
                strokeWeight: 0
            };
            if (this._tooltip == null) {
                o.map = this.NativePrimitve.getMap();
                o.zIndex = 100000;
                this._tooltip = new GoogleMapLabel(o);
            }
            else {
                this._tooltip.SetValues(o);
            }
            if (!this._hasToolTipReceiver) {
                this._mouseOverListener = this.NativePrimitve.addListener('mouseover', (e) => {
                    this._tooltip.Set('position', e.latLng);
                    if (!this._tooltipVisible) {
                        this._tooltip.Set('hidden', false);
                        this._tooltipVisible = true;
                    }
                });
                this._mouseMoveListener = this.NativePrimitve.addListener('mousemove', (e) => {
                    if (this._tooltipVisible) {
                        this._tooltip.Set('position', e.latLng);
                    }
                });
                this._mouseOutListener = this.NativePrimitve.addListener('mouseout', (e) => {
                    if (this._tooltipVisible) {
                        this._tooltip.Set('hidden', true);
                        this._tooltipVisible = false;
                    }
                });
                this._hasToolTipReceiver = true;
            }
        }
        if ((!this._showTooltip || this._title === '' || this._title == null)) {
            if (this._hasToolTipReceiver) {
                if (this._mouseOutListener) {
                    google.maps.event.removeListener(this._mouseOutListener);
                }
                if (this._mouseOverListener) {
                    google.maps.event.removeListener(this._mouseOverListener);
                }
                if (this._mouseMoveListener) {
                    google.maps.event.removeListener(this._mouseMoveListener);
                }
                this._hasToolTipReceiver = false;
            }
            if (this._tooltip) {
                this._tooltip.SetMap(null);
                this._tooltip = null;
            }
        }
    }
}

/**
 * This contstant translates the abstract map events into their corresponding google map
 * equivalents.
 */
const GoogleMapEventsLookup = {
    click: 'click',
    dblclick: 'dblclick',
    rightclick: 'rightclick',
    resize: 'resize',
    boundschanged: 'bounds_changed',
    centerchanged: 'center_changed',
    zoomchanged: 'zoom_changed',
    mouseover: 'mouseover',
    mouseout: 'mouseout',
    mousemove: 'mousemove',
    infowindowclose: 'closeclick'
};

/**
 * Concrete implementing a canvas overlay to be placed on the map for Google Maps.
 *
 * @export
 */
class GoogleCanvasOverlay extends CanvasOverlay {
    /**
     * Creates a new instance of the GoogleCanvasOverlay class.
     * @param drawCallback A callback function that is triggered when the canvas is ready to be
     * rendered for the current map view.
     * @memberof GoogleCanvasOverlay
     */
    constructor(drawCallback) {
        super(drawCallback);
    }
    ///
    /// Public methods
    ///
    /**
     * Obtains geo coordinates for the click location
     *
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     * @memberof GoogleCanvasOverlay
     */
    GetCoordinatesFromClick(e) {
        if (!e) {
            return null;
        }
        if (!e.latLng) {
            return null;
        }
        if (!e.latLng.lat || !e.latLng.lng) {
            return null;
        }
        return { latitude: e.latLng.lat(), longitude: e.latLng.lng() };
    }
    /**
     * Gets the map associted with the label.
     *
     * @memberof GoogleCanvasOverlay
     * @method
     */
    GetMap() {
        return this.getMap();
    }
    /**
     * Returns a MapLabel instance for the current platform that can be used as a tooltip.
     * This method only generates the map label. Content and placement is the responsibility
     * of the caller.
     *
     * @returns - The label to be used for the tooltip.
     * @memberof GoogleCanvasOverlay
     * @method
     */
    GetToolTipOverlay() {
        const o = {
            align: 'left',
            offset: new google.maps.Point(0, 25),
            backgroundColor: 'bisque',
            hidden: true,
            fontSize: 12,
            fontColor: '#000000',
            strokeWeight: 0
        };
        o.zIndex = 100000;
        const label = new GoogleMapLabel(o);
        label.SetMap(this.GetMap());
        return label;
    }
    /**
     * Called when the custom overlay is added to the map. Triggers Onload....
     * @memberof GoogleCanvasOverlay
     */
    OnAdd() {
        super.OnAdd();
        this.OnLoad();
        this._canvas.style.zIndex = '100';
        // move the canvas above primitives such as polygons.
        // set the overlay to ready state
        this._readyResolver(true);
    }
    /**
     * Called whenever the canvas needs to be redrawn. This method does not do the actual
     * update, it simply scales the canvas. The actual redraw happens once the map is idle.
     * @memberof GoogleCanvasOverly
     * @method
     */
    OnDraw() {
        const isStreetView = false;
        const map = this.GetMap();
        if (isStreetView) {
            // Don't show the canvas if the map is in Streetside mode.
            this._canvas.style.display = 'none';
        }
        else {
            // Re-drawing the canvas as it moves would be too slow. Instead, scale and translate canvas element.
            // Upon idle or drag end, we can then redraw the canvas....
            const zoomCurrent = map.getZoom();
            const centerCurrent = map.getCenter();
            // Calculate map scale based on zoom level difference.
            const scale = Math.pow(2, zoomCurrent - this._zoomStart);
            // Calculate the scaled dimensions of the canvas.
            const el = map.getDiv();
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const newWidth = w * scale;
            const newHeight = h * scale;
            // Calculate offset of canvas based on zoom and center offsets.
            const projection = this.getProjection();
            const cc = projection.fromLatLngToDivPixel(centerCurrent);
            // Update the canvas CSS position and dimensions.
            this.UpdatePosition(cc.x - newWidth / 2, cc.y - newHeight / 2, newWidth, newHeight);
        }
    }
    /**
     * CanvasOverlay loaded, attach map events for updating canvas.
     * @method
     * @memberof GoogleCanvasOverlay
     */
    OnLoad() {
        const isStreetView = false;
        const map = this.getMap();
        // Get the current map view information.
        this._zoomStart = map.getZoom();
        const c = map.getCenter();
        this._centerStart = {
            latitude: c.lat(),
            longitude: c.lng()
        };
        // When the map stops moving, render new data on the canvas.
        this._viewChangeEndEvent = google.maps.event.addListener(map, 'idle', (e) => {
            this.UpdateCanvas();
        });
        // Update the position of the overlay when the map is resized.
        this._mapResizeEvent = google.maps.event.addListener(map, 'resize', (e) => {
            this.UpdateCanvas();
        });
    }
    /**
     * Associates the cnavas overlay with a map.
     * @method
     * @memberof GoogleCanvasOverlay
     */
    SetMap(map) {
        this.setMap(map);
    }
    ///
    /// Protected methods
    ///
    /**
     * Attaches the canvas to the map.
     * @memberof CanvasOverlay
     * @method
     */
    SetCanvasElement(el) {
        const panes = this.getPanes();
        if (panes) {
            if (el != null) {
                panes.overlayLayer.appendChild(el);
                // 4: floatPane (infowindow)
                // 3: overlayMouseTarget (mouse events)
                // 2: markerLayer (marker images)
                // 1: overlayLayer (polygons, polylines, ground overlays, tile layer overlays)
                // 0: mapPane (lowest pane above the map tiles)
            }
            else {
                panes.overlayLayer.removeChild(this._canvas);
            }
        }
    }
    /**
     * Remove the map event handlers.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    RemoveEventHandlers() {
        // Remove all event handlers from the map.
        if (this._viewChangeEndEvent) {
            google.maps.event.removeListener(this._viewChangeEndEvent);
        }
        if (this._mapResizeEvent) {
            google.maps.event.removeListener(this._mapResizeEvent);
        }
    }
    /**
     * Updates the Canvas size based on the map size.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    Resize() {
        const map = this.getMap();
        // Clear canvas by updating dimensions. This also ensures canvas stays the same size as the map.
        const el = map.getDiv();
        this._canvas.width = el.offsetWidth;
        this._canvas.height = el.offsetHeight;
    }
    /**
     * Updates the Canvas.
     * @memberof CanvasOverlay
     * @method
     * @protected
     */
    UpdateCanvas() {
        const map = this.getMap();
        // Only render the canvas if it isn't in streetside mode.
        if (true) {
            this._canvas.style.display = '';
            // Reset CSS position and dimensions of canvas.
            const el = map.getDiv();
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const centerPoint = this.getProjection().fromLatLngToDivPixel(map.getCenter());
            this.UpdatePosition((centerPoint.x - w / 2), (centerPoint.y - h / 2), w, h);
            // Redraw the canvas.
            this.Redraw(true);
            // Get the current map view information.
            this._zoomStart = map.getZoom();
            const c = map.getCenter();
            this._centerStart = {
                latitude: c.lat(),
                longitude: c.lng()
            };
        }
    }
}
/**
 * Helper function to extend the OverlayView into the CanvasOverlay
 *
 * @export
 * @method
 */
function MixinCanvasOverlay$1() {
    new Extender(GoogleCanvasOverlay)
        .Extend(new google.maps.OverlayView)
        .Map('onAdd', 'OnAdd')
        .Map('draw', 'OnDraw')
        .Map('onRemove', 'OnRemove');
}

/**
 * Implements a factory to create all the implementation specifc services for a map implementation
 *
 * @export
 * @abstract
 */
class MapServiceFactory {
}
MapServiceFactory.decorators = [
    { type: Injectable }
];

/**
 * Abstract class to implement map api. A concrete implementation should be created for each
 * Map provider supported (e.g. Bing, Goolge, ESRI)
 *
 * @export
 * @abstract
 */
class MapService {
    ///
    /// Public methods and MapService interface implementation
    ///
    /**
     * Gets a random geo locations filling the bounding box.
     *
     * @param count - number of locations to return
     * @param bounds  - bounding box.
     * @returns - Array of geo locations.
     * @memberof MapService
     */
    static GetRandonLocations(count, bounds) {
        const a = [];
        const _getRandomLocation = (b) => {
            const lat = Math.random() * (b.maxLatitude - b.minLatitude) + b.minLatitude;
            let lng = 0;
            if (crossesDateLine) {
                lng = Math.random() * (b.minLongitude + 360 - b.maxLongitude) + b.maxLongitude;
                if (lng > 180) {
                    lng = lng - 360;
                }
            }
            else {
                lng = Math.random() * (b.maxLongitude - b.minLongitude) + b.minLongitude;
            }
            const p = { latitude: lat, longitude: lng };
            return p;
        };
        let crossesDateLine = false;
        if (bounds == null) {
            bounds = {
                maxLatitude: 360,
                minLatitude: 0,
                maxLongitude: 170,
                minLongitude: 0
            };
        }
        if (bounds.center.longitude < bounds.minLongitude || bounds.center.longitude > bounds.maxLongitude) {
            crossesDateLine = true;
        }
        if (!count || count <= 0) {
            return [_getRandomLocation(bounds)];
        }
        for (let r = 0; r < count; r++) {
            a.push(_getRandomLocation(bounds));
        }
        return a;
    }
}
MapService.decorators = [
    { type: Injectable }
];

/**
 * The abstract class represents the contract defintions for a marker service to be implemented by an acutaly underlying
 * map architecture.
 *
 * @export
 * @abstract
 */
class MarkerService {
}
MarkerService.decorators = [
    { type: Injectable }
];

/**
 * This class defines the contract for an InfoBoxService. Each Map Architecture provider is expected the furnish a concrete implementation.
 *
 * @export
 * @abstract
 */
class InfoBoxService {
}
InfoBoxService.decorators = [
    { type: Injectable }
];

/**
 * Abstract class to to define the layer service contract. Must be realized by implementing provider.
 *
 * @export
 * @abstract
 */
class LayerService {
}
LayerService.decorators = [
    { type: Injectable }
];

/**
 * The abstract class represents the contract defintions for a polygon service to be implemented by an acutaly underlying
 * map architecture.
 *
 * @export
 * @abstract
 */
class PolygonService {
}
PolygonService.decorators = [
    { type: Injectable }
];

/**
 * The abstract class represents the contract defintions for a polyline service to be implemented by an acutaly underlying
 * map architecture.
 *
 * @export
 * @abstract
 */
class PolylineService {
}
PolylineService.decorators = [
    { type: Injectable }
];

/**
 * Abstract class to to define teh cluster layer service contract. Must be realized by implementing provider.
 *
 * @export
 * @abstract
 */
class ClusterService extends LayerService {
}
ClusterService.decorators = [
    { type: Injectable }
];

/**
 * InfoBoxAction renders an action in an info window {@link InfoBox}
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapMarkerDirective, InfoBoxComponent, InfoBoxActionDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *    .map-container { height: 300px; }
 *  `],
 *  template: `
 *    <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-marker [Latitude]="lat" [Longitude]="lng" [Label]="'M'">
 *        <x-info-box>
 *          <x-info-box-action [Label]="actionlabel" (ActionClicked)="actionClicked(this)"></x-info-box-action>
 *        </x-info-box>
 *      </x-map-marker>
 *    </x-map>
 *  `
 * })
 * ```
 *
 * @export
 */
class InfoBoxActionDirective {
    constructor() {
        /**
         * Emits an event when the action has been clicked
         *
         * @memberof InfoBoxActionDirective
         */
        this.ActionClicked = new EventEmitter();
    }
}
InfoBoxActionDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-info-box-action'
            },] }
];
InfoBoxActionDirective.propDecorators = {
    Label: [{ type: Input }],
    ActionClicked: [{ type: Output }]
};

/**
 * internal counter to use as ids for multiple infoboxes.
 */
let infoBoxId = 0;
/**
 * InfoBox renders a info window inside a {@link MapMarkerDirective} or standalone.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapMarkerDirective, InfoBoxComponent, InfoBoxActionDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *    .map-container { height: 300px; }
 * `],
 *  template: `
 *    <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-marker [Latitude]="lat" [Longitude]="lng" [Label]="'M'">
 *        <x-info-box [DisableAutoPan]="true">
 *          Hi, this is the content of the <strong>info window</strong>
 *         </x-info-box>
 *       </x-map-marker>
 *     </x-map>
 *  `
 * })
 * ```
 *
 * @export
 */
class InfoBoxComponent {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of InfoBoxComponent.
     * @param _infoBoxService - Concrete {@link InfoBoxService} implementation for underlying Map architecture.
     *
     * @memberof InfoBoxComponent
     */
    constructor(_infoBoxService) {
        this._infoBoxService = _infoBoxService;
        ///
        /// Field declarations
        ///
        this._infoBoxAddedToManager = false;
        this._id = (infoBoxId++).toString();
        /**
         * Determine whether only one infobox can be open at a time. Note that ANY info box settings.
         *
         * @memberof InfoBoxComponent
         */
        this.Modal = true;
        /**
         * Determines visibility of infobox
         *
         * @memberof InfoBoxComponent
         */
        this.Visible = false;
        /**
         * Determines if other info boxes should be closed before opening this one
         *
         * @memberof InfoBoxComponent
         */
        this.CloseInfoBoxesOnOpen = true;
        ///
        /// Delegate defintions
        ///
        /**
         * Emits an event when the info window is closed.
         *
         * @memberof InfoBoxComponent
         */
        this.InfoBoxClose = new EventEmitter();
    }
    ///
    /// Property declarations.
    ///
    /**
     * Gets the HTML content of the info box.
     *
     * @readonly
     * @memberof InfoBoxComponent
     */
    get HtmlContent() {
        if (this._content.nativeElement && this._content.nativeElement.innerText && this._content.nativeElement.innerText.trim() !== '') {
            return this._content.nativeElement.outerHTML;
        }
        return '';
    }
    /**
     * Gets the Id of the info box as a string.
     *
     * @readonly
     * @memberof InfoBoxComponent
     */
    get Id() { return this._id; }
    ///
    /// Public methods
    ///
    /**
     * Closes the Infobox.
     *
     * @memberof InfoBoxComponent
     */
    Close() {
        return this._infoBoxService.Close(this).then(() => {
            this.InfoBoxClose.emit(this._id);
        });
    }
    /**
     * Called on after component view as been initialized. Part of the ng Component life cycle.
     *
     * @memberof Map
     */
    ngAfterViewInit() {
        this._infoBoxService.AddInfoWindow(this);
        this._infoBoxAddedToManager = true;
        this.HandleEvents();
    }
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof Map
     */
    ngOnChanges(changes) {
        if (!this._infoBoxAddedToManager) {
            return;
        }
        if ((changes['latitude'] || changes['longitude']) && typeof this.Latitude === 'number' &&
            typeof this.Longitude === 'number') {
            this._infoBoxService.SetPosition(this, {
                latitude: changes['latitude'].currentValue,
                longitude: changes['longitude'].currentValue
            });
        }
        this.SetInfoWindowOptions(changes);
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof Map
     */
    ngOnDestroy() { this._infoBoxService.DeleteInfoWindow(this); }
    /**
     * Opens a closed info window.
     *
     * @param [loc]  - {@link ILatLong } representing position on which to open the window.
     * @returns - Promise that is fullfilled when the infobox has been opened.
     *
     * @memberof InfoBoxComponent
     */
    Open(loc) {
        return this._infoBoxService.Open(this, loc);
    }
    /**
     * Returns a string representation of the info box.
     *
     * @returns - string representation of the info box.
     *
     * @memberof InfoBoxComponent
     */
    ToString() { return 'InfoBoxComponent-' + this._id; }
    ///
    /// Private methods
    ///
    /**
     * Delegate handling the map click events.
     *
     * @memberof MapComponent
     */
    HandleEvents() {
        this._infoBoxService.CreateEventObservable('infowindowclose', this).subscribe(e => {
            this.InfoBoxClose.emit(this._id);
        });
    }
    /**
     * Sets the info window options
     *
     * @param changes
     *
     * @memberof InfoBoxComponent
     */
    SetInfoWindowOptions(changes) {
        const options = {};
        if (changes['title']) {
            options.title = this.Title;
        }
        if (changes['description']) {
            options.description = this.Description;
        }
        if (changes['disableAutoPan']) {
            options.disableAutoPan = this.DisableAutoPan;
        }
        if (changes['visible']) {
            options.visible = this.Visible;
        }
        if (changes['xOffset'] || changes['yOffset']) {
            if (options.pixelOffset == null) {
                options.pixelOffset = { x: 0, y: 0 };
            }
            options.pixelOffset.x = this.xOffset;
            options.pixelOffset.y = this.yOffset;
        }
        this._infoBoxService.SetOptions(this, options);
    }
}
InfoBoxComponent.decorators = [
    { type: Component, args: [{
                selector: 'x-info-box',
                template: `
        <div #infoBoxContent class='info-box-content'>
            <ng-content></ng-content>
        </div>`,
                encapsulation: ViewEncapsulation.None,
                styles: [`
        x-map .MicrosoftMap .Infobox .infobox-title { padding: 10px 10px 5px 10px }
        x-map .MicrosoftMap .Infobox .infobox-info { padding: 3px 10px 10px 10px }
        x-map .MicrosoftMap .Infobox .infobox-actions { height: auto }
    `]
            },] }
];
InfoBoxComponent.ctorParameters = () => [
    { type: InfoBoxService }
];
InfoBoxComponent.propDecorators = {
    _content: [{ type: ViewChild, args: ['infoBoxContent',] }],
    InfoWindowActions: [{ type: ContentChildren, args: [InfoBoxActionDirective,] }],
    Latitude: [{ type: Input }],
    Longitude: [{ type: Input }],
    Title: [{ type: Input }],
    Description: [{ type: Input }],
    DisableAutoPan: [{ type: Input }],
    MaxWidth: [{ type: Input }],
    Modal: [{ type: Input }],
    HostMarker: [{ type: Input }],
    Visible: [{ type: Input }],
    xOffset: [{ type: Input }],
    yOffset: [{ type: Input }],
    CloseInfoBoxesOnOpen: [{ type: Input }],
    InfoBoxClose: [{ type: Output }]
};

/**
 * internal counter to use as ids for marker.
 */
let markerId = 0;
/**
 * MapMarkerDirective renders a map marker inside a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapMarkerDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *   .map-container {
 *     height: 300px;
 *   }
 * `],
 * template: `
 *   <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-marker [Latitude]="lat" [Longitude]="lng" [Label]="'M'"></x-map-marker>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
class MapMarkerDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapMarkerDirective.
     * @param _markerService - Concreate implementation of a {@link MarkerService}.
     * @param _containerRef - View container hosting the marker.
     * Used to determine parent layer through markup.
     *
     * @memberof MapMarkerDirective
     */
    constructor(_markerService, _containerRef) {
        this._markerService = _markerService;
        this._containerRef = _containerRef;
        ///
        /// Field declarations
        ///
        this._clickTimeout = null;
        this._events = [];
        this._inClusterLayer = false;
        this._inCustomLayer = false;
        this._markerAddedToManger = false;
        /**
         * This event is fired when the DOM dblclick event is fired on the marker.
         *
         * @memberof MapMarkerDirective
         */
        this.DblClick = new EventEmitter();
        /**
         * This event is repeatedly fired while the user drags the marker.
         *
         * @memberof MapMarkerDirective
         */
        this.Drag = new EventEmitter();
        /**
         * This event is fired when the user stops dragging the marker.
         *
         * @memberof MapMarkerDirective
         */
        this.DragEnd = new EventEmitter();
        /**
         * If true, the marker can be dragged. Default value is false.
         *
         * @memberof MapMarkerDirective
         */
        this.Draggable = false;
        /**
         * This event is fired when the user starts dragging the marker.
         *
         * @memberof MapMarkerDirective
         */
        this.DragStart = new EventEmitter();
        /**
         * This event emitter gets emitted when a marker icon is being created.
         *
         * @memberof MapMarkerDirective
         */
        this.DynamicMarkerCreated = new EventEmitter();
        /**
         * True to indiciate whether this is the first marker in a set.
         * Use this for bulk operations (particularily clustering) to ensure performance.
         *
         * @memberof MapMarkerDirective
         */
        this.IsFirstInSet = false;
        /**
         * True to indiciate whether this is the last marker in a set.
         * Use this for bulk operations (particularily clustering) to ensure performance.
         *
         * @memberof MapMarkerDirective
         */
        this.IsLastInSet = true;
        /**
         * This event emitter gets emitted when the user clicks on the marker.
         *
         * @memberof MapMarkerDirective
         */
        this.MarkerClick = new EventEmitter();
        /**
         * Arbitary metadata to assign to the Marker. This is useful for events
         *
         * @memberof MapMarkerDirective
         */
        this.Metadata = new Map();
        /**
         * This event is fired when the DOM mousedown event is fired on the marker.
         *
         * @memberof MapMarkerDirective
         */
        this.MouseDown = new EventEmitter();
        /**
         * This event is fired when the DOM mousemove event is fired on the marker.
         *
         * @memberof MapMarkerDirective
         */
        this.MouseMove = new EventEmitter();
        /**
         * This event is fired on marker mouseout.
         *
         * @memberof MapMarkerDirective
         */
        this.MouseOut = new EventEmitter();
        /**
         * This event is fired on marker mouseover.
         *
         * @memberof MapMarkerDirective
         */
        this.MouseOver = new EventEmitter();
        /**
         * This event is fired whe the DOM mouseup event is fired on the marker
         *
         * @memberof MapMarkerDirective
         */
        this.MouseUp = new EventEmitter();
        /**
         * This even is fired when the marker is right-clicked on.
         *
         * @memberof MapMarkerDirective
         */
        this.RightClick = new EventEmitter();
        this._id = (markerId++).toString();
    }
    ///
    /// Delegates
    ///
    ///
    /// Property declarations
    ///
    /**
     * Getswhether the marker has already been added to the marker service and is ready for use.
     *
     * @readonly
     * @memberof MapMarkerDirective
     */
    get AddedToManager() { return this._markerAddedToManger; }
    /**
     * Gets the id of the marker as a string.
     *
     * @readonly
     * @memberof MapMarkerDirective
     */
    get Id() { return this._id; }
    /**
     * Gets whether the marker is in a cluster layer. See {@link ClusterLayer}.
     *
     * @readonly
     * @memberof MapMarkerDirective
     */
    get InClusterLayer() { return this._inClusterLayer; }
    /**
     * Gets whether the marker is in a custom layer. See {@link MapLayer}.
     *
     * @readonly
     * @memberof MapMarkerDirective
     */
    get InCustomLayer() { return this._inCustomLayer; }
    /**
     * gets the id of the Layer the marker belongs to.
     *
     * @readonly
     * @memberof MapMarkerDirective
     */
    get LayerId() { return this._layerId; }
    ///
    /// Public methods
    ///
    /**
     * Translates a marker geo location to a pixel location relative to the map viewport.
     *
     * @param [loc] - {@link ILatLong} containing the geo coordinates. If null, the marker's coordinates are used.
     * @returns - A promise that when fullfilled contains an {@link IPoint} representing the pixel coordinates.
     *
     * @memberof MapMarkerDirective
     */
    LocationToPixel(loc) {
        return this._markerService.LocationToPoint(loc ? loc : this);
    }
    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapMarkerDirective
     */
    ngAfterContentInit() {
        if (this._infoBox != null) {
            this._infoBox.HostMarker = this;
        }
        if (this._containerRef.element.nativeElement.parentElement) {
            const parentName = this._containerRef.element.nativeElement.parentElement.tagName;
            if (parentName.toLowerCase() === 'x-cluster-layer') {
                this._inClusterLayer = true;
            }
            else if (parentName.toLowerCase() === 'x-map-layer') {
                this._inCustomLayer = true;
            }
            this._layerId = Number(this._containerRef.element.nativeElement.parentElement.attributes['layerId']);
        }
        if (!this._markerAddedToManger) {
            this._markerService.AddMarker(this);
            this._markerAddedToManger = true;
            this.AddEventListeners();
        }
    }
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     *
     * @memberof MapMarkerDirective
     */
    ngOnChanges(changes) {
        if (typeof this.Latitude !== 'number' || typeof this.Longitude !== 'number') {
            return;
        }
        if (!this._markerAddedToManger) {
            return;
        }
        if (changes['Latitude'] || changes['Longitude']) {
            this._markerService.UpdateMarkerPosition(this);
        }
        if (changes['Title']) {
            this._markerService.UpdateTitle(this);
        }
        if (changes['Label']) {
            this._markerService.UpdateLabel(this);
        }
        if (changes['Draggable']) {
            this._markerService.UpdateDraggable(this);
        }
        if (changes['IconUrl'] || changes['IconInfo']) {
            this._markerService.UpdateIcon(this);
        }
        if (changes['Anchor']) {
            this._markerService.UpdateAnchor(this);
        }
        if (changes['Visible']) {
            this._markerService.UpdateVisible(this);
        }
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     *
     * @memberof MapMarkerDirective
     */
    ngOnDestroy() {
        this._markerService.DeleteMarker(this);
        this._events.forEach((s) => s.unsubscribe());
    }
    /**
     * Obtains a string representation of the Marker Id.
     * @returns - string representation of the marker id.
     * @memberof MapMarkerDirective
     */
    toString() { return 'MapMarker-' + this._id.toString(); }
    ///
    /// Private methods
    ///
    /**
     * Adds various event listeners for the marker.
     *
     * @memberof MapMarkerDirective
     */
    AddEventListeners() {
        const _getEventArg = e => {
            return {
                Marker: this,
                Click: e,
                Location: this._markerService.GetCoordinatesFromClick(e),
                Pixels: this._markerService.GetPixelsFromClick(e)
            };
        };
        this._events.push(this._markerService.CreateEventObservable('click', this).subscribe((e) => {
            ///
            /// this is necessary since map will treat a doubleclick first as two clicks...'
            ///
            this._clickTimeout = timer(300).subscribe(n => {
                if (this._infoBox != null) {
                    this._infoBox.Open(this._markerService.GetCoordinatesFromClick(e));
                }
                this.MarkerClick.emit(_getEventArg(e));
            });
        }));
        this._events.push(this._markerService.CreateEventObservable('dblclick', this).subscribe((e) => {
            if (this._clickTimeout) {
                this._clickTimeout.unsubscribe();
                this._clickTimeout = null;
            }
            this.DblClick.emit(_getEventArg(e));
        }));
        const handlers = [
            { name: 'drag', handler: (ev) => this.Drag.emit(_getEventArg(ev)) },
            { name: 'dragend', handler: (ev) => this.DragEnd.emit(_getEventArg(ev)) },
            { name: 'dragstart', handler: (ev) => this.DragStart.emit(_getEventArg(ev)) },
            { name: 'mousedown', handler: (ev) => this.MouseDown.emit(_getEventArg(ev)) },
            { name: 'mousemove', handler: (ev) => this.MouseMove.emit(_getEventArg(ev)) },
            { name: 'mouseout', handler: (ev) => this.MouseOut.emit(_getEventArg(ev)) },
            { name: 'mouseover', handler: (ev) => this.MouseOver.emit(_getEventArg(ev)) },
            { name: 'mouseup', handler: (ev) => this.MouseUp.emit(_getEventArg(ev)) },
            { name: 'rightclick', handler: (ev) => this.RightClick.emit(_getEventArg(ev)) },
        ];
        handlers.forEach((obj) => {
            const os = this._markerService.CreateEventObservable(obj.name, this).subscribe(obj.handler);
            this._events.push(os);
        });
    }
}
MapMarkerDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-marker'
            },] }
];
MapMarkerDirective.ctorParameters = () => [
    { type: MarkerService },
    { type: ViewContainerRef }
];
MapMarkerDirective.propDecorators = {
    _infoBox: [{ type: ContentChild, args: [InfoBoxComponent,] }],
    Anchor: [{ type: Input }],
    DblClick: [{ type: Output }],
    Drag: [{ type: Output }],
    DragEnd: [{ type: Output }],
    Draggable: [{ type: Input }],
    DragStart: [{ type: Output }],
    DynamicMarkerCreated: [{ type: Output }],
    Height: [{ type: Input }],
    IconInfo: [{ type: Input }],
    IconUrl: [{ type: Input }],
    IsFirstInSet: [{ type: Input }],
    IsLastInSet: [{ type: Input }],
    Label: [{ type: Input }],
    Latitude: [{ type: Input }],
    Longitude: [{ type: Input }],
    MarkerClick: [{ type: Output }],
    Metadata: [{ type: Input }],
    MouseDown: [{ type: Output }],
    MouseMove: [{ type: Output }],
    MouseOut: [{ type: Output }],
    MouseOver: [{ type: Output }],
    MouseUp: [{ type: Output }],
    RightClick: [{ type: Output }],
    Title: [{ type: Input }],
    Visible: [{ type: Input }],
    Width: [{ type: Input }]
};

/**
 * Renders a map based on a given provider.
 * **Important note**: To be able see a map in the browser, you have to define a height for the CSS
 * class `map-container`.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent} from '...';
 *
 * @Component({
 *  selector: 'my-map',
 *  styles: [`
 *    .map-container { height: 300px; }
 * `],
 *  template: `
 *    <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom"></x-map>
 *  `
 * })
 * ```
 *
 * @export
 */
class MapComponent {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapComponent.
     *
     * @param _mapService - Concreted implementation of a map service for the underlying maps implementations.
     *                                   Generally provided via injections.
     * @memberof MapComponent
     */
    constructor(_mapService, _zone) {
        this._mapService = _mapService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._longitude = 0;
        this._latitude = 0;
        this._zoom = 0;
        this._options = {};
        this._box = null;
        this._containerClass = true;
        /**
         * This event emitter is fired when the map bounding box changes.
         *
         * @memberof MapComponent
         */
        this.BoundsChange = new EventEmitter();
        /**
         * This event emitter is fired when the map center changes.
         *
         * @memberof MapComponent
         */
        this.CenterChange = new EventEmitter();
        /**
         * This event emitter gets emitted when the user clicks on the map (but not when they click on a
         * marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapClick = new EventEmitter();
        /**
         * This event emitter gets emitted when the user double-clicks on the map (but not when they click
         * on a marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapDblClick = new EventEmitter();
        /**
         * This event emitter gets emitted when the user right-clicks on the map (but not when they click
         * on a marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapRightClick = new EventEmitter();
        /**
         * This event emitter gets emitted when the user double-clicks on the map (but not when they click
         * on a marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapMouseOver = new EventEmitter();
        /**
         * This event emitter gets emitted when the user double-clicks on the map (but not when they click
         * on a marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapMouseOut = new EventEmitter();
        /**
         * This event emitter gets emitted when the user double-clicks on the map (but not when they click
         * on a marker or infoWindow).
         *
         * @memberof MapComponent
         */
        this.MapMouseMove = new EventEmitter();
        /**
         * The event emitter is fired when the map service is available and the maps has been
         * Initialized (but not necessarily created). It contains a Promise that when fullfilled returns
         * the main map object of the underlying platform.
         *
         * @memberof MapComponent
         */
        this.MapPromise = new EventEmitter();
        /**
         * This event emiiter is fired when the map zoom changes
         *
         * @memberof MapComponent
         */
        this.ZoomChange = new EventEmitter();
        /**
         * This event emitter is fired when the map service is available and the maps has been
         * Initialized
         * @memberOf MapComponent
         */
        this.MapService = new EventEmitter();
    }
    ///
    /// Property declarations
    ///
    /**
     * Get or sets the maximum and minimum bounding box for map.
     *
     * @memberof MapComponent
     */
    get Box() { return this._box; }
    set Box(val) { this._box = val; }
    /**
     * Gets or sets the latitude that sets the center of the map.
     *
     * @memberof MapComponent
     */
    get Latitude() { return this._longitude; }
    set Latitude(value) {
        this._latitude = this.ConvertToDecimal(value);
        this.UpdateCenter();
    }
    /**
     * Gets or sets the longitude that sets the center of the map.
     *
     * @memberof MapComponent
     */
    get Longitude() { return this._longitude; }
    set Longitude(value) {
        this._longitude = this.ConvertToDecimal(value);
        this.UpdateCenter();
    }
    /**
     * Gets or sets general map Options
     *
     * @memberof MapComponent
     */
    get Options() { return this._options; }
    set Options(val) { this._options = val; }
    /**
     * Gets or sets the zoom level of the map. The default value is `8`.
     *
     * @memberof MapComponent
     */
    get Zoom() { return this._zoom; }
    set Zoom(value) {
        this._zoom = this.ConvertToDecimal(value, 8);
        if (typeof this._zoom === 'number') {
            this._mapService.SetZoom(this._zoom);
        }
    }
    ///
    /// Public methods
    ///
    /**
     * Called on Component initialization. Part of ng Component life cycle.
     *
     * @memberof MapComponent
     */
    ngOnInit() {
        this.MapPromise.emit(this._mapService.MapPromise);
        this.MapService.emit(this._mapService);
    }
    ngAfterViewInit() {
        this.InitMapInstance(this._container.nativeElement);
    }
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof MapComponent
     */
    ngOnChanges(changes) {
        if (this._mapPromise) {
            if (changes['Box']) {
                if (this._box != null) {
                    this._mapService.SetViewOptions({
                        bounds: this._box
                    });
                }
            }
            if (changes['Options']) {
                this._mapService.SetMapOptions(this._options);
            }
        }
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof MapComponent
     */
    ngOnDestroy() {
        this._mapService.DisposeMap();
    }
    /**
     * Triggers a resize event on the map instance.
     *
     * @returns - A promise that gets resolved after the event was triggered.
     *
     * @memberof MapComponent
     */
    TriggerResize() {
        // Note: When we would trigger the resize event and show the map in the same turn (which is a
        // common case for triggering a resize event), then the resize event would not
        // work (to show the map), so we trigger the event in a timeout.
        return new Promise((resolve) => {
            setTimeout(() => { return this._mapService.TriggerMapEvent('resize').then(() => resolve()); });
        });
    }
    ///
    /// Private methods.
    ///
    /**
     * Converts a number-ish value to a number.
     *
     * @param value - The value to convert.
     * @param [defaultValue=null] - Default value to use if the conversion cannot be performed.
     * @returns - Converted number of the default.
     *
     * @memberof MapComponent
     */
    ConvertToDecimal(value, defaultValue = null) {
        if (typeof value === 'string') {
            return parseFloat(value);
        }
        else if (typeof value === 'number') {
            return value;
        }
        return defaultValue;
    }
    /**
     * Delegate handling the map click events.
     *
     * @memberof MapComponent
     */
    HandleMapClickEvents() {
        this._mapService.SubscribeToMapEvent('click').subscribe(e => {
            //
            // this is necessary since bing will treat a doubleclick first as two clicks...'
            ///
            this._clickTimeout = setTimeout(() => {
                this.MapClick.emit(e);
            }, 300);
        });
        this._mapService.SubscribeToMapEvent('dblclick').subscribe(e => {
            if (this._clickTimeout) {
                clearTimeout(this._clickTimeout);
            }
            this.MapDblClick.emit(e);
        });
        this._mapService.SubscribeToMapEvent('rightclick').subscribe(e => {
            this.MapRightClick.emit(e);
        });
        this._mapService.SubscribeToMapEvent('mouseover').subscribe(e => {
            this.MapMouseOver.emit(e);
        });
        this._mapService.SubscribeToMapEvent('mouseout').subscribe(e => {
            this.MapMouseOut.emit(e);
        });
        this._mapService.SubscribeToMapEvent('mousemove').subscribe(e => {
            this.MapMouseMove.emit(e);
        });
    }
    /**
     * Delegate handling map center change events.
     *
     * @memberof MapComponent
     */
    HandleMapBoundsChange() {
        this._mapService.SubscribeToMapEvent('boundschanged').subscribe(() => {
            this._mapService.GetBounds().then((bounds) => {
                this.BoundsChange.emit(bounds);
            });
        });
    }
    /**
     * Delegate handling map center change events.
     *
     * @memberof MapComponent
     */
    HandleMapCenterChange() {
        this._mapService.SubscribeToMapEvent('centerchanged').subscribe(() => {
            this._mapService.GetCenter().then((center) => {
                if (this._latitude !== center.latitude || this._longitude !== center.longitude) {
                    this._latitude = center.latitude;
                    this._longitude = center.longitude;
                    this.CenterChange.emit({ latitude: this._latitude, longitude: this._longitude });
                }
            });
        });
    }
    /**
     * Delegate handling map zoom change events.
     *
     * @memberof MapComponent
     */
    HandleMapZoomChange() {
        this._mapService.SubscribeToMapEvent('zoomchanged').subscribe(() => {
            this._mapService.GetZoom().then((z) => {
                if (this._zoom !== z) {
                    this._zoom = z;
                    this.ZoomChange.emit(z);
                }
            });
        });
    }
    /**
     * Initializes the map.
     *
     * @param el - Html elements which will host the map canvas.
     *
     * @memberof MapComponent
     */
    InitMapInstance(el) {
        this._zone.runOutsideAngular(() => {
            if (this._options.center == null) {
                this._options.center = { latitude: this._latitude, longitude: this._longitude };
            }
            if (this._options.zoom == null) {
                this._options.zoom = this._zoom;
            }
            if (this._options.mapTypeId == null) {
                this._options.mapTypeId = MapTypeId.hybrid;
            }
            if (this._box != null) {
                this._options.bounds = this._box;
            }
            this._mapPromise = this._mapService.CreateMap(el, this._options);
            this.HandleMapCenterChange();
            this.HandleMapBoundsChange();
            this.HandleMapZoomChange();
            this.HandleMapClickEvents();
        });
    }
    /**
     * Updates the map center based on the geo properties of the component.
     *
     * @memberof MapComponent
     */
    UpdateCenter() {
        if (typeof this._latitude !== 'number' || typeof this._longitude !== 'number') {
            return;
        }
        this._mapService.SetCenter({
            latitude: this._latitude,
            longitude: this._longitude,
        });
    }
}
MapComponent.decorators = [
    { type: Component, args: [{
                selector: 'x-map',
                providers: [
                    { provide: MapService, deps: [MapServiceFactory], useFactory: MapServiceCreator },
                    { provide: MarkerService, deps: [MapServiceFactory, MapService, LayerService, ClusterService], useFactory: MarkerServiceFactory },
                    {
                        provide: InfoBoxService, deps: [MapServiceFactory, MapService,
                            MarkerService], useFactory: InfoBoxServiceFactory
                    },
                    { provide: LayerService, deps: [MapServiceFactory, MapService], useFactory: LayerServiceFactory },
                    { provide: ClusterService, deps: [MapServiceFactory, MapService], useFactory: ClusterServiceFactory },
                    { provide: PolygonService, deps: [MapServiceFactory, MapService, LayerService], useFactory: PolygonServiceFactory },
                    { provide: PolylineService, deps: [MapServiceFactory, MapService, LayerService], useFactory: PolylineServiceFactory }
                ],
                template: `
        <div #container class='map-container-inner'></div>
        <div class='map-content'>
            <ng-content></ng-content>
        </div>
    `,
                encapsulation: ViewEncapsulation.None,
                changeDetection: ChangeDetectionStrategy.OnPush,
                styles: [`
        .map-container-inner { width: inherit; height: inherit; }
        .map-container-inner div { background-repeat: no-repeat; }
        .map-content { display:none; }
    `]
            },] }
];
MapComponent.ctorParameters = () => [
    { type: MapService },
    { type: NgZone }
];
MapComponent.propDecorators = {
    _containerClass: [{ type: HostBinding, args: ['class.map-container',] }],
    _container: [{ type: ViewChild, args: ['container',] }],
    _markers: [{ type: ContentChildren, args: [MapMarkerDirective,] }],
    Box: [{ type: Input }],
    Latitude: [{ type: Input }],
    Longitude: [{ type: Input }],
    Options: [{ type: Input }],
    Zoom: [{ type: Input }],
    BoundsChange: [{ type: Output }],
    CenterChange: [{ type: Output }],
    MapClick: [{ type: Output }],
    MapDblClick: [{ type: Output }],
    MapRightClick: [{ type: Output }],
    MapMouseOver: [{ type: Output }],
    MapMouseOut: [{ type: Output }],
    MapMouseMove: [{ type: Output }],
    MapPromise: [{ type: Output }],
    ZoomChange: [{ type: Output }],
    MapService: [{ type: Output }]
};
/**
 * Factory function to generate a cluster service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @returns - A concrete instance of a Cluster Service based on the underlying map architecture
 */
function ClusterServiceFactory(f, m) { return f.CreateClusterService(m); }
/**
 * Factory function to generate a infobox service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @param m - A {@link MarkerService} instance.
 * @returns - A concrete instance of a InfoBox Service based on the underlying map architecture.
 */
function InfoBoxServiceFactory(f, m, ma) { return f.CreateInfoBoxService(m, ma); }
/**
 * Factory function to generate a layer service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @returns - A concrete instance of a Layer Service based on the underlying map architecture.
 */
function LayerServiceFactory(f, m) { return f.CreateLayerService(m); }
/**
 * Factory function to generate a map service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @returns - A concrete instance of a MapService based on the underlying map architecture.
 */
function MapServiceCreator(f) { return f.Create(); }
/**
 * Factory function to generate a marker service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @param l - A {@link LayerService} instance.
 * @param c - A {@link ClusterService} instance.
 * @returns - A concrete instance of a Marker Service based on the underlying map architecture.
 */
function MarkerServiceFactory(f, m, l, c) {
    return f.CreateMarkerService(m, l, c);
}
/**
 * Factory function to generate a polygon service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @param l - A {@link LayerService} instance.
 * @returns - A concrete instance of a Polygon Service based on the underlying map architecture.
 */
function PolygonServiceFactory(f, m, l) {
    return f.CreatePolygonService(m, l);
}
/**
 * Factory function to generate a polyline service instance. This is necessary because of constraints with AOT that do no allow
 * us to use lamda functions inline.
 *
 * @export
 * @param f - The {@link MapServiceFactory} implementation.
 * @param m - A {@link MapService} instance.
 * @param l - A {@link LayerService} instance.
 * @returns - A concrete instance of a Polyline Service based on the underlying map architecture.
 */
function PolylineServiceFactory(f, m, l) {
    return f.CreatePolylineService(m, l);
}

/**
 * internal counter to use as ids for multiple layers.
 */
let layerId = 0;
/**
 * MapLayerDirective creates a layer on a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapMarkerDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *   .map-container {
 *     height: 300px;
 *   }
 * `],
 * template: `
 *   <x-map [Latitude]='lat' [Longitude]='lng' [Zoom]='zoom'>
 *     <x-map-layer [Visible]='visible'>
 *         <x-map-marker [Latitude]='lat' [Longitude]='lng' [Label]=''M''></x-map-marker>
 *     </x-map-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
class MapLayerDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapLayerDirective.
     * @param _layerService - Concreted implementation of a layer service for the underlying maps implementations.
     * Generally provided via injections.
     * @param _containerRef - Reference to the container hosting the map canvas. Generally provided via injection.
     *
     * @memberof MapLayerDirective
     */
    constructor(_layerService, _containerRef) {
        this._layerService = _layerService;
        this._containerRef = _containerRef;
        ///
        /// Field declarations
        ///
        this._visible = true;
        this._addedToManager = false;
        this._id = layerId++;
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets or sets the layer visibility.
     *
     * @memberof MapLayerDirective
     */
    get Visible() { return this._visible; }
    set Visible(val) { this._visible = val; }
    /**
     * Gets the layer id.
     *
     * @readonly
     * @memberof MapLayerDirective
     */
    get Id() { return this._id; }
    ///
    /// Public methods
    ///
    /**
     * Called on Component initialization. Part of ng Component life cycle.
     *
     * @memberof MapLayerDirective
     */
    ngOnInit() {
        this._containerRef.element.nativeElement.attributes['layerId'] = this._id.toString();
        this._layerService.AddLayer(this);
        this._addedToManager = true;
    }
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof MapLayerDirective
     */
    ngOnChanges(changes) {
        if (!this._addedToManager) {
            return;
        }
        if (changes['Visible']) {
            this._layerService.GetNativeLayer(this).then(l => {
                l.SetVisible(!l.GetVisible());
            });
        }
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     *
     * @memberof MapLayerDirective
     */
    ngOnDestroy() {
        this._layerService.DeleteLayer(this);
    }
}
MapLayerDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-layer'
            },] }
];
MapLayerDirective.ctorParameters = () => [
    { type: LayerService },
    { type: ViewContainerRef }
];
MapLayerDirective.propDecorators = {
    _markers: [{ type: ContentChildren, args: [MapMarkerDirective,] }],
    Visible: [{ type: Input }]
};

/**
 *
 * Creates a cluster layer on a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapMarkerDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *   .map-container {
 *     height: 300px;
 *   }
 * `],
 * template: `
 *   <x-map [Latitude]='lat' [Longitude]='lng' [Zoom]='zoom'>
 *     <x-cluster-layer [Visible]='visible'>
 *         <x-map-marker [Latitude]='lat' [Longitude]='lng' [Label]=''M''></x-map-marker>
 *     </x-cluster-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
class ClusterLayerDirective extends MapLayerDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of ClusterLayerDirective.
     *
     * @param _layerService - Concreted implementation of a cluster layer service for the underlying maps
     * implementations. Generally provided via injections.
     * @param _containerRef - A reference to the view container of the layer. Generally provided via injection.
     *
     * @memberof ClusterLayerDirective
     */
    constructor(_layerService, _containerRef) {
        super(_layerService, _containerRef);
        ///
        /// Field declarations
        ///
        this._clusteringEnabled = true;
        this._clusterPlacementMode = ClusterPlacementMode.MeanValue;
        this._clusterClickAction = ClusterClickAction.ZoomIntoCluster;
        this._useDynamicSizeMarker = false;
        this._dynamicMarkerBaseSize = 18;
        this._dynamicMarkerRanges = new Map([
            [10, 'rgba(20, 180, 20, 0.5)'],
            [100, 'rgba(255, 210, 40, 0.5)'],
            [Number.MAX_SAFE_INTEGER, 'rgba(255, 40, 40, 0.5)']
        ]);
        this._zoomOnClick = true;
    }
    ///
    /// Property defintions
    ///
    /**
     * Gets or sets the the Cluster Click Action {@link ClusterClickAction}.
     *
     * @memberof ClusterLayerDirective
     */
    get ClusterClickAction() { return this._clusterClickAction; }
    set ClusterClickAction(val) { this._clusterClickAction = val; }
    /**
     * Gets or sets whether the clustering layer enables clustering. When set to false, the layer
     * behaves like a generic layer. This is handy if you want to prevent clustering at certain zoom levels.
     *
     * @memberof ClusterLayerDirective
     */
    get ClusteringEnabled() { return this._clusteringEnabled; }
    set ClusteringEnabled(val) { this._clusteringEnabled = val; }
    /**
     * Gets or sets the cluster placement mode. {@link ClusterPlacementMode}
     *
     * @memberof ClusterLayerDirective
     */
    get ClusterPlacementMode() { return this._clusterPlacementMode; }
    set ClusterPlacementMode(val) { this._clusterPlacementMode = val; }
    /**
     * Gets or sets the callback invoked to create a custom cluster marker. Note that when {@link UseDynamicSizeMarkers} is enabled,
     * you cannot set a custom marker callback.
     *
     * @memberof ClusterLayerDirective
     */
    get CustomMarkerCallback() { return this._iconCreationCallback; }
    set CustomMarkerCallback(val) {
        if (this._useDynamicSizeMarker) {
            throw (new Error(`You cannot set a custom marker callback when UseDynamicSizeMarkers is set to true.
                    Set UseDynamicSizeMakers to false.`));
        }
        this._iconCreationCallback = val;
    }
    /**
     * Gets or sets the base size of dynamic markers in pixels. The actualy size of the dynamic marker is based on this.
     * See {@link UseDynamicSizeMarkers}.
     *
     * @memberof ClusterLayerDirective
     */
    get DynamicMarkerBaseSize() { return this._dynamicMarkerBaseSize; }
    set DynamicMarkerBaseSize(val) { this._dynamicMarkerBaseSize = val; }
    /**
     * Gets or sets the ranges to use to calculate breakpoints and colors for dynamic markers.
     * The map contains key/value pairs, with the keys being
     * the breakpoint sizes and the values the colors to be used for the dynamic marker in that range. See {@link UseDynamicSizeMarkers}.
     *
     * @memberof ClusterLayerDirective
     */
    get DynamicMarkerRanges() { return this._dynamicMarkerRanges; }
    set DynamicMarkerRanges(val) { this._dynamicMarkerRanges = val; }
    /**
     * Gets or sets the grid size to be used for clustering.
     *
     * @memberof ClusterLayerDirective
     */
    get GridSize() { return this._gridSize; }
    set GridSize(val) { this._gridSize = val; }
    /**
     * Gets or sets the IconInfo to be used to create a custom cluster marker. Supports font-based, SVG, graphics and more.
     * See {@link IMarkerIconInfo}.
     *
     * @memberof ClusterLayerDirective
     */
    get IconInfo() { return this._iconInfo; }
    set IconInfo(val) { this._iconInfo = val; }
    /**
     * Gets or sets An offset applied to the positioning of the layer.
     *
     * @memberof ClusterLayerDirective
     */
    get LayerOffset() { return this._layerOffset; }
    set LayerOffset(val) { this._layerOffset = val; }
    /**
     * Gets or sets the minimum pins required to form a cluster
     *
     * @readonly
     * @memberof ClusterLayerDirective
     */
    get MinimumClusterSize() { return this._minimumClusterSize; }
    set MinimumClusterSize(val) { this._minimumClusterSize = val; }
    /**
     * Gets or sets the options for spider clustering behavior. See {@link ISpiderClusterOptions}
     *
     * @memberof ClusterLayerDirective
     */
    get SpiderClusterOptions() { return this._spiderClusterOptions; }
    set SpiderClusterOptions(val) { this._spiderClusterOptions = val; }
    /**
     * Gets or sets the cluster styles
     *
     * @readonly
     * @memberof ClusterLayerDirective
     */
    get Styles() { return this._styles; }
    set Styles(val) { this._styles = val; }
    /**
     * Gets or sets whether to use dynamic markers. Dynamic markers change in size and color depending on the number of
     * pins in the cluster. If set to true, this will take precendence over any custom marker creation.
     *
     * @memberof ClusterLayerDirective
     */
    get UseDynamicSizeMarkers() { return this._useDynamicSizeMarker; }
    set UseDynamicSizeMarkers(val) {
        this._useDynamicSizeMarker = val;
        if (val) {
            this._iconCreationCallback = (m, info) => {
                return ClusterLayerDirective.CreateDynamicSizeMarker(m.length, info, this._dynamicMarkerBaseSize, this._dynamicMarkerRanges);
            };
        }
    }
    /**
     * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
     *
     * @memberof ClusterLayerDirective
     */
    get ZIndex() { return this._zIndex; }
    set ZIndex(val) { this._zIndex = val; }
    /**
     * Gets or sets whether the cluster should zoom in on click
     *
     * @readonly
     * @memberof ClusterLayerDirective
     */
    get ZoomOnClick() { return this._zoomOnClick; }
    set ZoomOnClick(val) { this._zoomOnClick = val; }
    /**
     * Creates the dynamic size marker to be used for cluster markers if UseDynamicSizeMarkers is set to true.
     *
     * @param size - The number of markers in the cluster.
     * @param info  - The icon info to be used. This will be hydrated with
     * the actualy dimensions of the created markers and is used by the underlying model/services
     * to correctly offset the marker for correct positioning.
     * @param baseMarkerSize - The base size for dynmic markers.
     * @param ranges - The ranges to use to calculate breakpoints and colors for dynamic markers.
     * The map contains key/value pairs, with the keys being
     * the breakpoint sizes and the values the colors to be used for the dynamic marker in that range.
     * @returns - An string containing the SVG for the marker.
     *
     * @memberof ClusterLayerDirective
     */
    static CreateDynamicSizeMarker(size, info, baseMarkerSize, ranges) {
        const mr = baseMarkerSize;
        const outline = mr * 0.35;
        const total = size;
        const r = Math.log(total) / Math.log(10) * 5 + mr;
        const d = r * 2;
        let fillColor;
        ranges.forEach((v, k) => {
            if (total <= k && !fillColor) {
                fillColor = v;
            }
        });
        if (!fillColor) {
            fillColor = 'rgba(20, 180, 20, 0.5)';
        }
        // Create an SVG string of two circles, one on top of the other, with the specified radius and color.
        const svg = [`<svg xmlns='http://www.w3.org/2000/svg' width='${d}' height='${d}'>`,
            `<circle cx='${r}' cy='${r}' r='${r}' fill='${fillColor}'/>`,
            `<circle cx='${r}' cy='${r}' r='${r - outline}' fill='${fillColor}'/>`,
            `</svg>`];
        info.size = { width: d, height: d };
        info.markerOffsetRatio = { x: 0.5, y: 0.5 };
        info.textOffset = { x: 0, y: r - 8 };
        return svg.join('');
    }
    ///
    /// Public methods
    ///
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     *
     * @memberof ClusterLayerDirective
     */
    ngOnChanges(changes) {
        if (!this._addedToManager) {
            return;
        }
        if (changes['ClusterClickAction']) {
            throw (new Error('You cannot change the ClusterClickAction after the layer has been added to the layerservice.'));
        }
        const options = { id: this._id };
        if (changes['ClusteringEnabled']) {
            options.clusteringEnabled = this._clusteringEnabled;
        }
        if (changes['GridSize']) {
            options.gridSize = this._gridSize;
        }
        if (changes['LayerOffset']) {
            options.layerOffset = this._layerOffset;
        }
        if (changes['SpiderClusterOptions']) {
            options.spiderClusterOptions = this._spiderClusterOptions;
        }
        if (changes['ZIndex']) {
            options.zIndex = this._zIndex;
        }
        if (changes['Visible']) {
            options.visible = this._visible;
        }
        this._layerService.GetNativeLayer(this).then((l) => {
            l.SetOptions(options);
        });
    }
}
ClusterLayerDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-cluster-layer'
            },] }
];
ClusterLayerDirective.ctorParameters = () => [
    { type: ClusterService },
    { type: ViewContainerRef }
];
ClusterLayerDirective.propDecorators = {
    ClusterClickAction: [{ type: Input }],
    ClusteringEnabled: [{ type: Input }],
    ClusterPlacementMode: [{ type: Input }],
    CustomMarkerCallback: [{ type: Input }],
    DynamicMarkerBaseSize: [{ type: Input }],
    DynamicMarkerRanges: [{ type: Input }],
    GridSize: [{ type: Input }],
    IconInfo: [{ type: Input }],
    LayerOffset: [{ type: Input }],
    MinimumClusterSize: [{ type: Input }],
    SpiderClusterOptions: [{ type: Input }],
    Styles: [{ type: Input }],
    UseDynamicSizeMarkers: [{ type: Input }],
    ZIndex: [{ type: Input }],
    ZoomOnClick: [{ type: Input }]
};

let polygonId = 0;
/**
 *
 * MapPolygonDirective renders a polygon inside a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapPolygonDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map,
 *  styles: [`
 *   .map-container { height: 300px; }
 * `],
 * template: `
 *   <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-polygon [Paths]="path"></x-map-polygon>
 *   </x-map>
 * `
 * })
 * ```
 *
 *
 * @export
 */
class MapPolygonDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapPolygonDirective.
     * @param _polygonManager
     *
     * @memberof MapPolygonDirective
     */
    constructor(_polygonService, _containerRef) {
        this._polygonService = _polygonService;
        this._containerRef = _containerRef;
        ///
        /// Field declarations
        ///
        this._inCustomLayer = false;
        this._addedToService = false;
        this._events = [];
        /**
         * Gets or sets whether this Polygon handles mouse events.
         *
         * @memberof MapPolygonDirective
         */
        this.Clickable = true;
        /**
         * If set to true, the user can drag this shape over the map.
         *
         * @memberof MapPolygonDirective
         */
        this.Draggable = false;
        /**
         * If set to true, the user can edit this shape by dragging the control
         * points shown at the vertices and on each segment.
         *
         * @memberof MapPolygonDirective
         */
        this.Editable = false;
        /**
         * When true, edges of the polygon are interpreted as geodesic and will
         * follow the curvature of the Earth. When false, edges of the polygon are
         * rendered as straight lines in screen space. Note that the shape of a
         * geodesic polygon may appear to change when dragged, as the dimensions
         * are maintained relative to the surface of the earth. Defaults to false.
         *
         * @memberof MapPolygonDirective
         */
        this.Geodesic = false;
        /**
         * Arbitary metadata to assign to the Polygon. This is useful for events
         *
         * @memberof MapPolygonDirective
         */
        this.Metadata = new Map();
        /**
         * The ordered sequence of coordinates that designates a closed loop.
         * Unlike polylines, a polygon may consist of one or more paths.
         * As a result, the paths property may specify one or more arrays of
         * LatLng coordinates. Paths are closed automatically; do not repeat the
         * first vertex of the path as the last vertex. Simple polygons may be
         * defined using a single array of LatLngs. More complex polygons may
         * specify an array of arrays (for inner loops ). Any simple arrays are converted into Arrays.
         * Inserting or removing LatLngs from the Array will automatically update
         * the polygon on the map.
         *
         * @memberof MapPolygonDirective
         */
        this.Paths = [];
        /**
         * Whether to show the title of the polygon as the tooltip on the polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.ShowTooltip = true;
        ///
        /// Delegate definitions
        ///
        /**
         * This event is fired when the DOM click event is fired on the Polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.Click = new EventEmitter();
        /**
         * This event is fired when the DOM dblclick event is fired on the Polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.DblClick = new EventEmitter();
        /**
         * This event is repeatedly fired while the user drags the polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.Drag = new EventEmitter();
        /**
         * This event is fired when the user stops dragging the polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.DragEnd = new EventEmitter();
        /**
         * This event is fired when the user starts dragging the polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.DragStart = new EventEmitter();
        /**
         * This event is fired when the DOM mousedown event is fired on the Polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.MouseDown = new EventEmitter();
        /**
         * This event is fired when the DOM mousemove event is fired on the Polygon.
         *
         * @memberof MapPolygonDirective
         */
        this.MouseMove = new EventEmitter();
        /**
         * This event is fired on Polygon mouseout.
         *
         * @memberof MapPolygonDirective
         */
        this.MouseOut = new EventEmitter();
        /**
         * This event is fired on Polygon mouseover.
         *
         * @memberof MapPolygonDirective
         */
        this.MouseOver = new EventEmitter();
        /**
         * This event is fired whe the DOM mouseup event is fired on the Polygon
         *
         * @memberof MapPolygonDirective
         */
        this.MouseUp = new EventEmitter();
        /**
         * This event is fired when the Polygon is right-clicked on.
         *
         * @memberof MapPolygonDirective
         */
        this.RightClick = new EventEmitter();
        /**
         * This event is fired when editing has completed.
         *
         * @memberof MapPolygonDirective
         */
        this.PathChanged = new EventEmitter();
        this._id = polygonId++;
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets whether the polygon has been registered with the service.
     * @readonly
     * @memberof MapPolygonDirective
     */
    get AddedToService() { return this._addedToService; }
    /**
     * Get the id of the polygon.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get Id() { return this._id; }
    /**
     * Gets the id of the polygon as a string.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get IdAsString() { return this._id.toString(); }
    /**
     * Gets whether the polygon is in a custom layer. See {@link MapLayer}.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get InCustomLayer() { return this._inCustomLayer; }
    /**
     * gets the id of the Layer the polygon belongs to.
     *
     * @readonly
     * @memberof MapPolygonDirective
     */
    get LayerId() { return this._layerId; }
    ///
    /// Public methods
    ///
    /**
     * Called after the content intialization of the directive is complete. Part of the ng Component life cycle.
     *
     * @memberof MapPolygonDirective
     */
    ngAfterContentInit() {
        if (this._containerRef.element.nativeElement.parentElement) {
            const parentName = this._containerRef.element.nativeElement.parentElement.tagName;
            if (parentName.toLowerCase() === 'x-map-layer') {
                this._inCustomLayer = true;
                this._layerId = Number(this._containerRef.element.nativeElement.parentElement.attributes['layerId']);
            }
        }
        if (!this._addedToService) {
            this._polygonService.AddPolygon(this);
            this._addedToService = true;
            this.AddEventListeners();
        }
        return;
    }
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof MapPolygonDirective
     */
    ngOnChanges(changes) {
        if (!this._addedToService) {
            return;
        }
        const o = this.GeneratePolygonChangeSet(changes);
        if (o != null) {
            this._polygonService.SetOptions(this, o);
        }
        if (changes['Paths'] && !changes['Paths'].isFirstChange()) {
            this._polygonService.UpdatePolygon(this);
        }
    }
    /**
     * Called when the poygon is being destroyed. Part of the ng Component life cycle. Release resources.
     *
     *
     * @memberof MapPolygonDirective
     */
    ngOnDestroy() {
        this._polygonService.DeletePolygon(this);
        this._events.forEach((s) => s.unsubscribe());
        ///
        /// remove event subscriptions
        ///
    }
    ///
    /// Private methods
    ///
    /**
     * Wires up the event receivers.
     *
     * @memberof MapPolygonDirective
     */
    AddEventListeners() {
        const _getEventArg = e => {
            return {
                Polygon: this,
                Click: e
            };
        };
        this._events.push(this._polygonService.CreateEventObservable('click', this).subscribe((ev) => {
            const t = this;
            if (this._infoBox != null) {
                this._infoBox.Open(this._polygonService.GetCoordinatesFromClick(ev));
            }
            this.Click.emit(_getEventArg(ev));
        }));
        const handlers = [
            { name: 'dblclick', handler: (ev) => this.DblClick.emit(_getEventArg(ev)) },
            { name: 'drag', handler: (ev) => this.Drag.emit(_getEventArg(ev)) },
            { name: 'dragend', handler: (ev) => this.DragEnd.emit(_getEventArg(ev)) },
            { name: 'dragstart', handler: (ev) => this.DragStart.emit(_getEventArg(ev)) },
            { name: 'mousedown', handler: (ev) => this.MouseDown.emit(_getEventArg(ev)) },
            { name: 'mousemove', handler: (ev) => this.MouseMove.emit(_getEventArg(ev)) },
            { name: 'mouseout', handler: (ev) => this.MouseOut.emit(_getEventArg(ev)) },
            { name: 'mouseover', handler: (ev) => this.MouseOver.emit(_getEventArg(ev)) },
            { name: 'mouseup', handler: (ev) => this.MouseUp.emit(_getEventArg(ev)) },
            { name: 'rightclick', handler: (ev) => this.RightClick.emit(_getEventArg(ev)) },
            { name: 'pathchanged', handler: (ev) => this.PathChanged.emit(ev) }
        ];
        handlers.forEach((obj) => {
            const os = this._polygonService.CreateEventObservable(obj.name, this).subscribe(obj.handler);
            this._events.push(os);
        });
    }
    /**
     * Generates IPolygon option changeset from directive settings.
     *
     * @param changes - {@link SimpleChanges} identifying the changes that occured.
     * @returns - {@link IPolygonOptions} containing the polygon options.
     *
     * @memberof MapPolygonDirective
     */
    GeneratePolygonChangeSet(changes) {
        const options = { id: this._id };
        let hasOptions = false;
        if (changes['Clickable']) {
            options.clickable = this.Clickable;
            hasOptions = true;
        }
        if (changes['Draggable']) {
            options.draggable = this.Draggable;
            hasOptions = true;
        }
        if (changes['Editable']) {
            options.editable = this.Editable;
            hasOptions = true;
        }
        if (changes['FillColor'] || changes['FillOpacity']) {
            options.fillColor = this.FillColor;
            options.fillOpacity = this.FillOpacity;
            hasOptions = true;
        }
        if (changes['Geodesic']) {
            options.geodesic = this.Geodesic;
            hasOptions = true;
        }
        if (changes['LabelMaxZoom']) {
            options.labelMaxZoom = this.LabelMaxZoom;
            hasOptions = true;
        }
        if (changes['LabelMinZoom']) {
            options.labelMinZoom = this.LabelMinZoom;
            hasOptions = true;
        }
        if (changes['ShowTooltip']) {
            options.showTooltip = this.ShowTooltip;
            hasOptions = true;
        }
        if (changes['ShowLabel']) {
            options.showLabel = this.ShowLabel;
            hasOptions = true;
        }
        if (changes['StrokeColor'] || changes['StrokeOpacity']) {
            options.strokeColor = this.StrokeColor;
            options.strokeOpacity = this.StrokeOpacity;
            hasOptions = true;
        }
        if (changes['StrokeWeight']) {
            options.strokeWeight = this.StrokeWeight;
            hasOptions = true;
        }
        if (changes['Title']) {
            options.title = this.Title;
            hasOptions = true;
        }
        if (changes['Visible']) {
            options.visible = this.Visible;
            hasOptions = true;
        }
        if (changes['zIndex']) {
            options.zIndex = this.zIndex;
            hasOptions = true;
        }
        return hasOptions ? options : null;
    }
}
MapPolygonDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-polygon'
            },] }
];
MapPolygonDirective.ctorParameters = () => [
    { type: PolygonService },
    { type: ViewContainerRef }
];
MapPolygonDirective.propDecorators = {
    _infoBox: [{ type: ContentChild, args: [InfoBoxComponent,] }],
    Clickable: [{ type: Input }],
    Draggable: [{ type: Input }],
    Editable: [{ type: Input }],
    FillColor: [{ type: Input }],
    FillOpacity: [{ type: Input }],
    Geodesic: [{ type: Input }],
    LabelMaxZoom: [{ type: Input }],
    LabelMinZoom: [{ type: Input }],
    Metadata: [{ type: Input }],
    Paths: [{ type: Input }],
    ShowLabel: [{ type: Input }],
    ShowTooltip: [{ type: Input }],
    StrokeColor: [{ type: Input }],
    StrokeOpacity: [{ type: Input }],
    StrokeWeight: [{ type: Input }],
    Title: [{ type: Input }],
    Visible: [{ type: Input }],
    zIndex: [{ type: Input }],
    Click: [{ type: Output }],
    DblClick: [{ type: Output }],
    Drag: [{ type: Output }],
    DragEnd: [{ type: Output }],
    DragStart: [{ type: Output }],
    MouseDown: [{ type: Output }],
    MouseMove: [{ type: Output }],
    MouseOut: [{ type: Output }],
    MouseOver: [{ type: Output }],
    MouseUp: [{ type: Output }],
    RightClick: [{ type: Output }],
    PathChanged: [{ type: Output }]
};

let polylineId = 0;
/**
 *
 * MapPolylineDirective renders a polyline inside a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapPolylineDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map,
 *  styles: [`
 *   .map-container { height: 300px; }
 * `],
 * template: `
 *   <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-polyline [Paths]="path"></x-map-polyline>
 *   </x-map>
 * `
 * })
 * ```
 *
 *
 * @export
 */
class MapPolylineDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapPolylineDirective.
     * @param _polylineManager
     *
     * @memberof MapPolylineDirective
     */
    constructor(_polylineService, _containerRef) {
        this._polylineService = _polylineService;
        this._containerRef = _containerRef;
        ///
        /// Field declarations
        ///
        this._inCustomLayer = false;
        this._addedToService = false;
        this._events = [];
        /**
         * Gets or sets whether this Polyline handles mouse events.
         *
         * @memberof MapPolylineDirective
         */
        this.Clickable = true;
        /**
         * If set to true, the user can drag this shape over the map.
         *
         * @memberof MapPolylineDirective
         */
        this.Draggable = false;
        /**
         * If set to true, the user can edit this shape by dragging the control
         * points shown at the vertices and on each segment.
         *
         * @memberof MapPolylineDirective
         */
        this.Editable = false;
        /**
         * When true, edges of the polyline are interpreted as geodesic and will
         * follow the curvature of the Earth. When false, edges of the polyline are
         * rendered as straight lines in screen space. Note that the shape of a
         * geodesic polyline may appear to change when dragged, as the dimensions
         * are maintained relative to the surface of the earth. Defaults to false.
         *
         * @memberof MapPolylineDirective
         */
        this.Geodesic = false;
        /**
         * Arbitary metadata to assign to the Polyline. This is useful for events
         *
         * @memberof MapPolylineDirective
         */
        this.Metadata = new Map();
        /**
         * The ordered sequence of coordinates that designates a polyline.
         * Simple polylines may be defined using a single array of LatLngs. More
         * complex polylines may specify an array of arrays.
         *
         * @memberof MapPolylineDirective
         */
        this.Path = [];
        /**
         * Whether to show the title of the polyline as the tooltip on the polygon.
         *
         * @memberof MapPolylineDirective
         */
        this.ShowTooltip = true;
        ///
        /// Delegate definitions
        ///
        /**
         * This event is fired when the DOM click event is fired on the Polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.Click = new EventEmitter();
        /**
         * This event is fired when the DOM dblclick event is fired on the Polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.DblClick = new EventEmitter();
        /**
         * This event is repeatedly fired while the user drags the polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.Drag = new EventEmitter();
        /**
         * This event is fired when the user stops dragging the polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.DragEnd = new EventEmitter();
        /**
         * This event is fired when the user starts dragging the polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.DragStart = new EventEmitter();
        /**
         * This event is fired when the DOM mousedown event is fired on the Polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.MouseDown = new EventEmitter();
        /**
         * This event is fired when the DOM mousemove event is fired on the Polyline.
         *
         * @memberof MapPolylineDirective
         */
        this.MouseMove = new EventEmitter();
        /**
         * This event is fired on Polyline mouseout.
         *
         * @memberof MapPolylineDirective
         */
        this.MouseOut = new EventEmitter();
        /**
         * This event is fired on Polyline mouseover.
         *
         * @memberof MapPolylineDirective
         */
        this.MouseOver = new EventEmitter();
        /**
         * This event is fired whe the DOM mouseup event is fired on the Polyline
         *
         * @memberof MapPolylineDirective
         */
        this.MouseUp = new EventEmitter();
        /**
         * This even is fired when the Polyline is right-clicked on.
         *
         * @memberof MapPolylineDirective
         */
        this.RightClick = new EventEmitter();
        this._id = polylineId++;
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets whether the polyline has been registered with the service.
     * @readonly
     * @memberof MapPolylineDirective
     */
    get AddedToService() { return this._addedToService; }
    /**
     * Get the id of the polyline.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get Id() { return this._id; }
    /**
     * Gets the id of the polyline as a string.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get IdAsString() { return this._id.toString(); }
    /**
     * Gets whether the polyline is in a custom layer. See {@link MapLayer}.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get InCustomLayer() { return this._inCustomLayer; }
    /**
     * gets the id of the Layer the polyline belongs to.
     *
     * @readonly
     * @memberof MapPolylineDirective
     */
    get LayerId() { return this._layerId; }
    ///
    /// Public methods
    ///
    /**
     * Called after the content intialization of the directive is complete. Part of the ng Component life cycle.
     *
     * @memberof MapPolylineDirective
     */
    ngAfterContentInit() {
        if (this._containerRef.element.nativeElement.parentElement) {
            const parentName = this._containerRef.element.nativeElement.parentElement.tagName;
            if (parentName.toLowerCase() === 'x-map-layer') {
                this._inCustomLayer = true;
                this._layerId = Number(this._containerRef.element.nativeElement.parentElement.attributes['layerId']);
            }
        }
        if (!this._addedToService) {
            this._polylineService.AddPolyline(this);
            this._addedToService = true;
            this.AddEventListeners();
        }
        return;
    }
    /**
     * Called when changes to the databoud properties occur. Part of the ng Component life cycle.
     *
     * @param changes - Changes that have occured.
     *
     * @memberof MapPolylineDirective
     */
    ngOnChanges(changes) {
        if (!this._addedToService) {
            return;
        }
        const o = this.GeneratePolylineChangeSet(changes);
        if (o != null) {
            this._polylineService.SetOptions(this, o);
        }
        if (changes['Path'] && !changes['Path'].isFirstChange()) {
            this._polylineService.UpdatePolyline(this);
        }
    }
    /**
     * Called when the polyline is being destroyed. Part of the ng Component life cycle. Release resources.
     *
     *
     * @memberof MapPolylineDirective
     */
    ngOnDestroy() {
        this._polylineService.DeletePolyline(this);
        this._events.forEach((s) => s.unsubscribe());
        ///
        /// remove event subscriptions
        ///
    }
    ///
    /// Private methods
    ///
    /**
     * Wires up the event receivers.
     *
     * @memberof MapPolylineDirective
     */
    AddEventListeners() {
        const _getEventArg = e => {
            return {
                Polyline: this,
                Click: e
            };
        };
        this._polylineService.CreateEventObservable('click', this).subscribe((ev) => {
            if (this._infoBox != null) {
                this._infoBox.Open(this._polylineService.GetCoordinatesFromClick(ev));
            }
            this.Click.emit(_getEventArg(ev));
        });
        const handlers = [
            { name: 'dblclick', handler: (ev) => this.DblClick.emit(_getEventArg(ev)) },
            { name: 'drag', handler: (ev) => this.Drag.emit(_getEventArg(ev)) },
            { name: 'dragend', handler: (ev) => this.DragEnd.emit(_getEventArg(ev)) },
            { name: 'dragstart', handler: (ev) => this.DragStart.emit(_getEventArg(ev)) },
            { name: 'mousedown', handler: (ev) => this.MouseDown.emit(_getEventArg(ev)) },
            { name: 'mousemove', handler: (ev) => this.MouseMove.emit(_getEventArg(ev)) },
            { name: 'mouseout', handler: (ev) => this.MouseOut.emit(_getEventArg(ev)) },
            { name: 'mouseover', handler: (ev) => this.MouseOver.emit(_getEventArg(ev)) },
            { name: 'mouseup', handler: (ev) => this.MouseUp.emit(_getEventArg(ev)) },
            { name: 'rightclick', handler: (ev) => this.RightClick.emit(_getEventArg(ev)) },
        ];
        handlers.forEach((obj) => {
            const os = this._polylineService.CreateEventObservable(obj.name, this).subscribe(obj.handler);
            this._events.push(os);
        });
    }
    /**
     * Generates IPolyline option changeset from directive settings.
     *
     * @param changes - {@link SimpleChanges} identifying the changes that occured.
     * @returns - {@link IPolylineOptions} containing the polyline options.
     *
     * @memberof MapPolylineDirective
     */
    GeneratePolylineChangeSet(changes) {
        const options = { id: this._id };
        let hasOptions = false;
        if (changes['Clickable']) {
            options.clickable = this.Clickable;
            hasOptions = true;
        }
        if (changes['Draggable']) {
            options.draggable = this.Draggable;
            hasOptions = true;
        }
        if (changes['Editable']) {
            options.editable = this.Editable;
            hasOptions = true;
        }
        if (changes['Geodesic']) {
            options.geodesic = this.Geodesic;
            hasOptions = true;
        }
        if (changes['ShowTooltip']) {
            options.showTooltip = this.ShowTooltip;
            hasOptions = true;
        }
        if (changes['StrokeColor']) {
            options.strokeColor = this.StrokeColor;
            hasOptions = true;
        }
        if (changes['StrokeOpacity']) {
            options.strokeOpacity = this.StrokeOpacity;
            hasOptions = true;
        }
        if (changes['StrokeWeight']) {
            options.strokeWeight = this.StrokeWeight;
            hasOptions = true;
        }
        if (changes['Title']) {
            options.title = this.Title;
            hasOptions = true;
        }
        if (changes['Visible']) {
            options.visible = this.Visible;
            hasOptions = true;
        }
        if (changes['zIndex']) {
            options.zIndex = this.zIndex;
            hasOptions = true;
        }
        return hasOptions ? options : null;
    }
}
MapPolylineDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-polyline'
            },] }
];
MapPolylineDirective.ctorParameters = () => [
    { type: PolylineService },
    { type: ViewContainerRef }
];
MapPolylineDirective.propDecorators = {
    _infoBox: [{ type: ContentChild, args: [InfoBoxComponent,] }],
    Clickable: [{ type: Input }],
    Draggable: [{ type: Input }],
    Editable: [{ type: Input }],
    Geodesic: [{ type: Input }],
    Metadata: [{ type: Input }],
    Path: [{ type: Input }],
    ShowTooltip: [{ type: Input }],
    StrokeColor: [{ type: Input }],
    StrokeOpacity: [{ type: Input }],
    StrokeWeight: [{ type: Input }],
    Title: [{ type: Input }],
    Visible: [{ type: Input }],
    zIndex: [{ type: Input }],
    Click: [{ type: Output }],
    DblClick: [{ type: Output }],
    Drag: [{ type: Output }],
    DragEnd: [{ type: Output }],
    DragStart: [{ type: Output }],
    MouseDown: [{ type: Output }],
    MouseMove: [{ type: Output }],
    MouseOut: [{ type: Output }],
    MouseOver: [{ type: Output }],
    MouseUp: [{ type: Output }],
    RightClick: [{ type: Output }]
};

/**
 * internal counter to use as ids for marker.
 */
let layerId$1 = 1000000;
/**
 * MapMarkerLayerDirective performantly renders a large set of map marker inside a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapMarkerDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *   .map-container {
 *     height: 300px;
 *   }
 * `],
 * template: `
 *   <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-marker-layer [MarkerOptions]="_markers"></x-map-marker-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
class MapMarkerLayerDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapMarkerLayerDirective.
     * @param _markerService - Concreate implementation of a {@link MarkerService}.
     * @param _layerService - Concreate implementation of a {@link LayerService}.
     * @param _clusterService - Concreate implementation of a {@link ClusterService}.
     * @param _mapService - Concreate implementation of a {@link MapService}.
     * @param _zone - Concreate implementation of a {@link NgZone} service.
     *
     * @memberof MapMarkerLayerDirective
     */
    constructor(_markerService, _layerService, _clusterService, _mapService, _zone) {
        this._markerService = _markerService;
        this._layerService = _layerService;
        this._clusterService = _clusterService;
        this._mapService = _mapService;
        this._zone = _zone;
        this._useDynamicSizeMarker = false;
        this._dynamicMarkerBaseSize = 18;
        this._dynamicMarkerRanges = new Map([
            [10, 'rgba(20, 180, 20, 0.5)'],
            [100, 'rgba(255, 210, 40, 0.5)'],
            [Number.MAX_SAFE_INTEGER, 'rgba(255, 40, 40, 0.5)']
        ]);
        this._streaming = false;
        this._markers = new Array();
        this._markersLast = new Array();
        /**
         * Gets or sets the the Cluster Click Action {@link ClusterClickAction}.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.ClusterClickAction = ClusterClickAction.ZoomIntoCluster;
        /**
         * Gets or sets the cluster placement mode. {@link ClusterPlacementMode}
         *
         * @memberof MapMarkerLayerDirective
         */
        this.ClusterPlacementMode = ClusterPlacementMode.MeanValue;
        /**
         * Determines whether the layer clusters. This property can only be set on creation of the layer.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.EnableClustering = false;
        /**
         * Gets or sets the grid size to be used for clustering.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.GridSize = 150;
        /**
         * Gets or sets An offset applied to the positioning of the layer.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.LayerOffset = null;
        /**
         * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.ZIndex = 0;
        /**
         * Gets or sets whether the cluster should zoom in on click
         *
         * @readonly
         * @memberof MapMarkerLayerDirective
         */
        this.ZoomOnClick = true;
        ///
        /// Delegates
        ///
        /**
         * This event emitter gets emitted when the dynamic icon for a marker is being created.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.DynamicMarkerCreated = new EventEmitter();
        /**
         * This event emitter gets emitted when the user clicks a marker in the layer.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.MarkerClick = new EventEmitter();
        /**
         * This event is fired when the user stops dragging a marker.
         *
         * @memberof MapMarkerLayerDirective
         */
        this.DragEnd = new EventEmitter();
        this._id = layerId$1++;
    }
    /**
     * Gets or sets the callback invoked to create a custom cluster marker. Note that when {@link UseDynamicSizeMarkers} is enabled,
     * you cannot set a custom marker callback.
     *
     * @memberof MapMarkerLayerDirective
     */
    get CustomMarkerCallback() { return this._iconCreationCallback; }
    set CustomMarkerCallback(val) {
        if (this._useDynamicSizeMarker) {
            throw (new Error(`You cannot set a custom marker callback when UseDynamicSizeMarkers is set to true.
                    Set UseDynamicSizeMakers to false.`));
        }
        this._iconCreationCallback = val;
    }
    /**
     * Gets or sets the base size of dynamic markers in pixels. The actualy size of the dynamic marker is based on this.
     * See {@link UseDynamicSizeMarkers}.
     *
     * @memberof ClusterLayerDirective
     */
    get DynamicMarkerBaseSize() { return this._dynamicMarkerBaseSize; }
    set DynamicMarkerBaseSize(val) { this._dynamicMarkerBaseSize = val; }
    /**
     * Gets or sets the ranges to use to calculate breakpoints and colors for dynamic markers.
     * The map contains key/value pairs, with the keys being
     * the breakpoint sizes and the values the colors to be used for the dynamic marker in that range. See {@link UseDynamicSizeMarkers}.
     *
     * @memberof ClusterLayerDirective
     */
    get DynamicMarkerRanges() { return this._dynamicMarkerRanges; }
    set DynamicMarkerRanges(val) { this._dynamicMarkerRanges = val; }
    /**
     *  IMarkerOptions array holding the marker info.
     *
     * @memberof MapMarkerLayerDirective
     */
    get MarkerOptions() { return this._markers; }
    set MarkerOptions(val) {
        if (this._streaming) {
            this._markersLast.push(...val.slice(0));
            this._markers.push(...val);
        }
        else {
            this._markers = val.slice(0);
        }
    }
    /**
     * Gets or sets the cluster styles
     *
     * @memberof MapMarkerLayerDirective
     */
    get Styles() { return this._styles; }
    set Styles(val) { this._styles = val; }
    /**
     * Sets whether to treat changes in the MarkerOptions as streams of new markers. In thsi mode, changing the
     * Array supplied in MarkerOptions will be incrementally drawn on the map as opposed to replace the markers on the map.
     *
     * @memberof MapMarkerLayerDirective
     */
    get TreatNewMarkerOptionsAsStream() { return this._streaming; }
    set TreatNewMarkerOptionsAsStream(val) { this._streaming = val; }
    /**
     * Gets or sets whether to use dynamic markers. Dynamic markers change in size and color depending on the number of
     * pins in the cluster. If set to true, this will take precendence over any custom marker creation.
     *
     * @memberof MapMarkerLayerDirective
     */
    get UseDynamicSizeMarkers() { return this._useDynamicSizeMarker; }
    set UseDynamicSizeMarkers(val) {
        this._useDynamicSizeMarker = val;
        if (val) {
            this._iconCreationCallback = (m, info) => {
                return ClusterLayerDirective.CreateDynamicSizeMarker(m.length, info, this._dynamicMarkerBaseSize, this._dynamicMarkerRanges);
            };
        }
    }
    ///
    /// Property declarations
    ///
    /**
     * Gets the id of the marker layer.
     *
     * @readonly
     * @memberof MapMarkerLayerDirective
     */
    get Id() { return this._id; }
    ///
    /// Public methods
    ///
    /**
     * Translates a geo location to a pixel location relative to the map viewport.
     *
     * @param [loc] - {@link ILatLong} containing the geo coordinates.
     * @returns - A promise that when fullfilled contains an {@link IPoint} representing the pixel coordinates.
     *
     * @memberof MapMarkerLayerDirective
     */
    LocationToPixel(loc) {
        return this._markerService.LocationToPoint(loc);
    }
    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapMarkerLayerDirective
     */
    ngAfterContentInit() {
        const layerOptions = {
            id: this._id
        };
        this._zone.runOutsideAngular(() => {
            const fakeLayerDirective = {
                Id: this._id,
                Visible: this.Visible
            };
            if (!this.EnableClustering) {
                this._layerService.AddLayer(fakeLayerDirective);
                this._layerPromise = this._layerService.GetNativeLayer(fakeLayerDirective);
                this._service = this._layerService;
            }
            else {
                fakeLayerDirective.LayerOffset = this.LayerOffset;
                fakeLayerDirective.ZIndex = this.ZIndex;
                fakeLayerDirective.ClusteringEnabled = this.EnableClustering;
                fakeLayerDirective.ClusterPlacementMode = this.ClusterPlacementMode;
                fakeLayerDirective.GridSize = this.GridSize;
                fakeLayerDirective.ClusterClickAction = this.ClusterClickAction;
                fakeLayerDirective.IconInfo = this.ClusterIconInfo;
                fakeLayerDirective.CustomMarkerCallback = this.CustomMarkerCallback;
                fakeLayerDirective.UseDynamicSizeMarkers = this.UseDynamicSizeMarkers;
                this._clusterService.AddLayer(fakeLayerDirective);
                this._layerPromise = this._clusterService.GetNativeLayer(fakeLayerDirective);
                this._service = this._clusterService;
            }
            this._layerPromise.then(l => {
                l.SetVisible(this.Visible);
                if (this.MarkerOptions) {
                    this._zone.runOutsideAngular(() => this.UpdateMarkers());
                }
            });
        });
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     *
     * @memberof MapMarkerLayerDirective
     */
    ngOnDestroy() {
        this._layerPromise.then(l => {
            l.Delete();
        });
    }
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     *
     * @memberof MapMarkerLayerDirective
     */
    ngOnChanges(changes) {
        let shouldSetOptions = false;
        const o = {
            id: this._id
        };
        if (changes['MarkerOptions']) {
            this._zone.runOutsideAngular(() => {
                this.UpdateMarkers();
            });
        }
        if (changes['Visible'] && !changes['Visible'].firstChange) {
            this._zone.runOutsideAngular(() => {
                this._layerPromise.then(l => l.SetVisible(this.Visible));
            });
        }
        if (changes['EnableClustering'] && !changes['EnableClustering'].firstChange) {
            if ('StopClustering' in this._service) {
                o.clusteringEnabled = this.EnableClustering;
                shouldSetOptions = true;
            }
            else {
                throw (new Error('You cannot change EnableClustering after the layer has been created.'));
            }
        }
        if (changes['ClusterPlacementMode'] && !changes['ClusterPlacementMode'].firstChange && 'StopClustering' in this._service) {
            o.placementMode = this.ClusterPlacementMode;
            shouldSetOptions = true;
        }
        if (changes['GridSize'] && !changes['GridSize'].firstChange && 'StopClustering' in this._service) {
            o.gridSize = this.GridSize;
            shouldSetOptions = true;
        }
        if (changes['ClusterClickAction'] && !changes['ClusterClickAction'].firstChange && 'StopClustering' in this._service) {
            o.zoomOnClick = this.ClusterClickAction === ClusterClickAction.ZoomIntoCluster;
            shouldSetOptions = true;
        }
        if ((changes['ZIndex'] && !changes['ZIndex'].firstChange) ||
            (changes['LayerOffset'] && !changes['LayerOffset'].firstChange) ||
            (changes['IconInfo'] && !changes['IconInfo'].firstChange)) {
            throw (new Error('You cannot change ZIndex or LayerOffset after the layer has been created.'));
        }
        if (shouldSetOptions) {
            this._zone.runOutsideAngular(() => {
                const fakeLayerDirective = { Id: this._id };
                this._layerPromise.then(l => l.SetOptions(o));
            });
        }
    }
    /**
     * Obtains a string representation of the Marker Id.
     * @returns - string representation of the marker id.
     * @memberof MapMarkerLayerDirective
     */
    toString() { return 'MapMarkerLayer-' + this._id.toString(); }
    ///
    /// Private methods
    ///
    /**
     * Adds various event listeners for the marker.
     *
     * @param m - the marker for which to add the event.
     *
     * @memberof MapMarkerLayerDirective
     */
    AddEventListeners(m) {
        m.AddListener('click', (e) => this.MarkerClick.emit({
            Marker: m,
            Click: e,
            Location: this._markerService.GetCoordinatesFromClick(e),
            Pixels: this._markerService.GetPixelsFromClick(e)
        }));
        m.AddListener('dragend', (e) => this.DragEnd.emit({
            Marker: m,
            Click: e,
            Location: this._markerService.GetCoordinatesFromClick(e),
            Pixels: this._markerService.GetPixelsFromClick(e)
        }));
    }
    /**
     * Sets or updates the markers based on the marker options. This will place the markers on the map
     * and register the associated events.
     *
     * @memberof MapMarkerLayerDirective
     * @method
     */
    UpdateMarkers() {
        if (this._layerPromise == null) {
            return;
        }
        this._layerPromise.then(l => {
            const markers = this._streaming ? this._markersLast.splice(0) : this._markers;
            // generate the promise for the markers
            const mp = this._service.CreateMarkers(markers, this.IconInfo);
            // set markers once promises are fullfilled.
            mp.then(m => {
                m.forEach(marker => {
                    this.AddEventListeners(marker);
                });
                this._streaming ? l.AddEntities(m) : l.SetEntities(m);
            });
        });
    }
}
MapMarkerLayerDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-marker-layer'
            },] }
];
MapMarkerLayerDirective.ctorParameters = () => [
    { type: MarkerService },
    { type: LayerService },
    { type: ClusterService },
    { type: MapService },
    { type: NgZone }
];
MapMarkerLayerDirective.propDecorators = {
    ClusterClickAction: [{ type: Input }],
    ClusterIconInfo: [{ type: Input }],
    ClusterPlacementMode: [{ type: Input }],
    CustomMarkerCallback: [{ type: Input }],
    DynamicMarkerBaseSize: [{ type: Input }],
    DynamicMarkerRanges: [{ type: Input }],
    EnableClustering: [{ type: Input }],
    GridSize: [{ type: Input }],
    IconInfo: [{ type: Input }],
    LayerOffset: [{ type: Input }],
    MarkerOptions: [{ type: Input }],
    Styles: [{ type: Input }],
    TreatNewMarkerOptionsAsStream: [{ type: Input }],
    UseDynamicSizeMarkers: [{ type: Input }],
    Visible: [{ type: Input }],
    ZIndex: [{ type: Input }],
    ZoomOnClick: [{ type: Input }],
    DynamicMarkerCreated: [{ type: Output }],
    MarkerClick: [{ type: Output }],
    DragEnd: [{ type: Output }]
};

/**
 * internal counter to use as ids for polygons.
 */
let layerId$2 = 1000000;
/**
 * MapPolygonLayerDirective performantly renders a large set of polygons on a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *   .map-container {
 *     height: 300px;
 *   }
 * `],
 * template: `
 *   <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-polygon-layer [PolygonOptions]="_polygons"></x-map-polygon-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
class MapPolygonLayerDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapPolygonLayerDirective.
     * @param _layerService - Concreate implementation of a {@link LayerService}.
     * @param _mapService - Concreate implementation of a {@link MapService}.
     * @param _zone - Concreate implementation of a {@link NgZone} service.
     * @memberof MapPolygonLayerDirective
     */
    constructor(_layerService, _mapService, _zone) {
        this._layerService = _layerService;
        this._mapService = _mapService;
        this._zone = _zone;
        this._labels = new Array();
        this._tooltipSubscriptions = new Array();
        this._tooltipVisible = false;
        this._defaultOptions = {
            fontSize: 11,
            fontFamily: 'sans-serif',
            strokeWeight: 2,
            strokeColor: '#000000',
            fontColor: '#ffffff'
        };
        this._streaming = false;
        this._polygons = new Array();
        this._polygonsLast = new Array();
        /**
         * Set the maximum zoom at which the polygon labels are visible. Ignored if ShowLabel is false.
         * @memberof MapPolygonLayerDirective
         */
        this.LabelMaxZoom = Number.MAX_SAFE_INTEGER;
        /**
         * Set the minimum zoom at which the polygon labels are visible. Ignored if ShowLabel is false.
         * @memberof MapPolygonLayerDirective
         */
        this.LabelMinZoom = -1;
        /**
         * Gets or sets An offset applied to the positioning of the layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.LayerOffset = null;
        /**
         * Whether to show the polygon titles as the labels on the polygons.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.ShowLabels = false;
        /**
         * Whether to show the titles of the polygosn as the tooltips on the polygons.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.ShowTooltips = true;
        /**
         * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.ZIndex = 0;
        ///
        /// Delegates
        ///
        /**
         * This event emitter gets emitted when the user clicks a polygon in the layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.PolygonClick = new EventEmitter();
        /**
         * This event is fired when the DOM dblclick event is fired on a polygon in the layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.PolygonDblClick = new EventEmitter();
        /**
         * This event is fired when the DOM mousemove event is fired on a polygon in the layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.PolygonMouseMove = new EventEmitter();
        /**
         * This event is fired on mouseout on a polygon in the layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.PolygonMouseOut = new EventEmitter();
        /**
         * This event is fired on mouseover on a polygon in a layer.
         *
         * @memberof MapPolygonLayerDirective
         */
        this.PolygonMouseOver = new EventEmitter();
        this._id = layerId$2++;
    }
    /**
     * An array of polygon options representing the polygons in the layer.
     *
     * @memberof MapPolygonLayerDirective
     */
    get PolygonOptions() { return this._polygons; }
    set PolygonOptions(val) {
        if (this._streaming) {
            this._polygonsLast.push(...val.slice(0));
            this._polygons.push(...val);
        }
        else {
            this._polygons = val.slice(0);
        }
    }
    /**
     * Sets whether to treat changes in the PolygonOptions as streams of new markers. In this mode, changing the
     * Array supplied in PolygonOptions will be incrementally drawn on the map as opposed to replace the polygons on the map.
     *
     * @memberof MapPolygonLayerDirective
     */
    get TreatNewPolygonOptionsAsStream() { return this._streaming; }
    set TreatNewPolygonOptionsAsStream(val) { this._streaming = val; }
    ///
    /// Property declarations
    ///
    /**
     * Gets the id of the marker layer.
     *
     * @readonly
     * @memberof MapPolygonLayerDirective
     */
    get Id() { return this._id; }
    ///
    /// Public methods
    ///
    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapPolygonLayerDirective
     */
    ngAfterContentInit() {
        const layerOptions = {
            id: this._id
        };
        this._zone.runOutsideAngular(() => {
            const fakeLayerDirective = {
                Id: this._id,
                Visible: this.Visible,
                LayerOffset: this.LayerOffset,
                ZIndex: this.ZIndex
            };
            this._layerService.AddLayer(fakeLayerDirective);
            this._layerPromise = this._layerService.GetNativeLayer(fakeLayerDirective);
            Promise.all([
                this._layerPromise,
                this._mapService.CreateCanvasOverlay(el => this.DrawLabels(el))
            ]).then(values => {
                values[0].SetVisible(this.Visible);
                this._canvas = values[1];
                this._canvas._canvasReady.then(b => {
                    this._tooltip = this._canvas.GetToolTipOverlay();
                    this.ManageTooltip(this.ShowTooltips);
                });
                if (this.PolygonOptions) {
                    this._zone.runOutsideAngular(() => this.UpdatePolygons());
                }
            });
            this._service = this._layerService;
        });
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof MapPolygonLayerDirective
     */
    ngOnDestroy() {
        this._tooltipSubscriptions.forEach(s => s.unsubscribe());
        this._layerPromise.then(l => {
            l.Delete();
        });
        if (this._canvas) {
            this._canvas.Delete();
        }
    }
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     * @memberof MapPolygonLayerDirective
     */
    ngOnChanges(changes) {
        if (changes['PolygonOptions']) {
            this._zone.runOutsideAngular(() => {
                this.UpdatePolygons();
            });
        }
        if (changes['Visible'] && !changes['Visible'].firstChange) {
            this._layerPromise.then(l => l.SetVisible(this.Visible));
        }
        if ((changes['ZIndex'] && !changes['ZIndex'].firstChange) ||
            (changes['LayerOffset'] && !changes['LayerOffset'].firstChange)) {
            throw (new Error('You cannot change ZIndex or LayerOffset after the layer has been created.'));
        }
        if ((changes['ShowLabels'] && !changes['ShowLabels'].firstChange) ||
            (changes['LabelMinZoom'] && !changes['LabelMinZoom'].firstChange) ||
            (changes['LabelMaxZoom'] && !changes['LabelMaxZoom'].firstChange)) {
            if (this._canvas) {
                this._canvas.Redraw(true);
            }
        }
        if (changes['ShowTooltips'] && this._tooltip) {
            this.ManageTooltip(changes['ShowTooltips'].currentValue);
        }
    }
    /**
     * Obtains a string representation of the Marker Id.
     * @returns - string representation of the marker id.
     * @memberof MapPolygonLayerDirective
     */
    toString() { return 'MapPolygonLayer-' + this._id.toString(); }
    ///
    /// Private methods
    ///
    /**
     * Adds various event listeners for the marker.
     *
     * @param p - the polygon for which to add the event.
     *
     * @memberof MapPolygonLayerDirective
     */
    AddEventListeners(p) {
        const handlers = [
            { name: 'click', handler: (ev) => this.PolygonClick.emit({ Polygon: p, Click: ev }) },
            { name: 'dblclick', handler: (ev) => this.PolygonDblClick.emit({ Polygon: p, Click: ev }) },
            { name: 'mousemove', handler: (ev) => this.PolygonMouseMove.emit({ Polygon: p, Click: ev }) },
            { name: 'mouseout', handler: (ev) => this.PolygonMouseOut.emit({ Polygon: p, Click: ev }) },
            { name: 'mouseover', handler: (ev) => this.PolygonMouseOver.emit({ Polygon: p, Click: ev }) }
        ];
        handlers.forEach((obj) => p.AddListener(obj.name, obj.handler));
    }
    /**
     * Draws the polygon labels. Called by the Canvas overlay.
     *
     * @param el - The canvas on which to draw the labels.
     * @memberof MapPolygonLayerDirective
     */
    DrawLabels(el) {
        if (this.ShowLabels) {
            this._mapService.GetZoom().then(z => {
                if (this.LabelMinZoom <= z && this.LabelMaxZoom >= z) {
                    const ctx = el.getContext('2d');
                    const labels = this._labels.map(x => x.title);
                    this._mapService.LocationsToPoints(this._labels.map(x => x.loc)).then(locs => {
                        const size = this._mapService.MapSize;
                        for (let i = 0, len = locs.length; i < len; i++) {
                            // Don't draw the point if it is not in view. This greatly improves performance when zoomed in.
                            if (locs[i].x >= 0 && locs[i].y >= 0 && locs[i].x <= size.width && locs[i].y <= size.height) {
                                this.DrawText(ctx, locs[i], labels[i]);
                            }
                        }
                    });
                }
            });
        }
    }
    /**
     * Draws the label text at the appropriate place on the canvas.
     * @param ctx - Canvas drawing context.
     * @param loc - Pixel location on the canvas where to center the text.
     * @param text - Text to draw.
     */
    DrawText(ctx, loc, text) {
        let lo = this.LabelOptions;
        if (lo == null && this._tooltip) {
            lo = this._tooltip.DefaultLabelStyle;
        }
        if (lo == null) {
            lo = this._defaultOptions;
        }
        ctx.strokeStyle = lo.strokeColor;
        ctx.font = `${lo.fontSize}px ${lo.fontFamily}`;
        ctx.textAlign = 'center';
        const strokeWeight = lo.strokeWeight;
        if (text && strokeWeight && strokeWeight > 0) {
            ctx.lineWidth = strokeWeight;
            ctx.strokeText(text, loc.x, loc.y);
        }
        ctx.fillStyle = lo.fontColor;
        ctx.fillText(text, loc.x, loc.y);
    }
    /**
     * Manages the tooltip and the attachment of the associated events.
     *
     * @param show - True to enable the tooltip, false to disable.
     * @memberof MapPolygonLayerDirective
     */
    ManageTooltip(show) {
        if (show && this._canvas) {
            // add tooltip subscriptions
            this._tooltip.Set('hidden', true);
            this._tooltipVisible = false;
            this._tooltipSubscriptions.push(this.PolygonMouseMove.asObservable().subscribe(e => {
                if (this._tooltipVisible) {
                    const loc = this._canvas.GetCoordinatesFromClick(e.Click);
                    this._tooltip.Set('position', loc);
                }
            }));
            this._tooltipSubscriptions.push(this.PolygonMouseOver.asObservable().subscribe(e => {
                if (e.Polygon.Title && e.Polygon.Title.length > 0) {
                    const loc = this._canvas.GetCoordinatesFromClick(e.Click);
                    this._tooltip.Set('text', e.Polygon.Title);
                    this._tooltip.Set('position', loc);
                    if (!this._tooltipVisible) {
                        this._tooltip.Set('hidden', false);
                        this._tooltipVisible = true;
                    }
                }
            }));
            this._tooltipSubscriptions.push(this.PolygonMouseOut.asObservable().subscribe(e => {
                if (this._tooltipVisible) {
                    this._tooltip.Set('hidden', true);
                    this._tooltipVisible = false;
                }
            }));
        }
        else {
            // remove tooltip subscriptions
            this._tooltipSubscriptions.forEach(s => s.unsubscribe());
            this._tooltipSubscriptions.splice(0);
            this._tooltip.Set('hidden', true);
            this._tooltipVisible = false;
        }
    }
    /**
     * Sets or updates the polygons based on the polygon options. This will place the polygons on the map
     * and register the associated events.
     *
     * @memberof MapPolygonLayerDirective
     * @method
     */
    UpdatePolygons() {
        if (this._layerPromise == null) {
            return;
        }
        this._layerPromise.then(l => {
            const polygons = this._streaming ? this._polygonsLast.splice(0) : this._polygons;
            if (!this._streaming) {
                this._labels.splice(0);
            }
            // generate the promise for the markers
            const lp = this._service.CreatePolygons(l.GetOptions().id, polygons);
            // set markers once promises are fullfilled.
            lp.then(p => {
                p.forEach(poly => {
                    if (poly.Title != null && poly.Title.length > 0) {
                        this._labels.push({ loc: poly.Centroid, title: poly.Title });
                    }
                    this.AddEventListeners(poly);
                });
                this._streaming ? l.AddEntities(p) : l.SetEntities(p);
                if (this._canvas) {
                    this._canvas.Redraw(!this._streaming);
                }
            });
        });
    }
}
MapPolygonLayerDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-polygon-layer'
            },] }
];
MapPolygonLayerDirective.ctorParameters = () => [
    { type: LayerService },
    { type: MapService },
    { type: NgZone }
];
MapPolygonLayerDirective.propDecorators = {
    LabelMaxZoom: [{ type: Input }],
    LabelMinZoom: [{ type: Input }],
    LabelOptions: [{ type: Input }],
    LayerOffset: [{ type: Input }],
    PolygonOptions: [{ type: Input }],
    ShowLabels: [{ type: Input }],
    ShowTooltips: [{ type: Input }],
    TreatNewPolygonOptionsAsStream: [{ type: Input }],
    Visible: [{ type: Input }],
    ZIndex: [{ type: Input }],
    PolygonClick: [{ type: Output }],
    PolygonDblClick: [{ type: Output }],
    PolygonMouseMove: [{ type: Output }],
    PolygonMouseOut: [{ type: Output }],
    PolygonMouseOver: [{ type: Output }]
};

/**
 * internal counter to use as ids for polylines.
 */
let layerId$3 = 1000000;
/**
 * MapPolylineLayerDirective performantly renders a large set of polyline on a {@link MapComponent}.
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *   .map-container {
 *     height: 300px;
 *   }
 * `],
 * template: `
 *   <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-polyline-layer [PolygonOptions]="_polyline"></x-map-polyline-layer>
 *   </x-map>
 * `
 * })
 * ```
 *
 * @export
 */
class MapPolylineLayerDirective {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of MapPolylineLayerDirective.
     * @param _layerService - Concreate implementation of a {@link LayerService}.
     * @param _mapService - Concreate implementation of a {@link MapService}.
     * @param _zone - Concreate implementation of a {@link NgZone} service.
     * @memberof MapPolylineLayerDirective
     */
    constructor(_layerService, _mapService, _zone) {
        this._layerService = _layerService;
        this._mapService = _mapService;
        this._zone = _zone;
        this._labels = new Array();
        this._tooltipSubscriptions = new Array();
        this._tooltipVisible = false;
        this._defaultOptions = {
            fontSize: 11,
            fontFamily: 'sans-serif',
            strokeWeight: 2,
            strokeColor: '#000000',
            fontColor: '#ffffff'
        };
        this._streaming = false;
        this._polylines = new Array();
        this._polylinesLast = new Array();
        /**
         * Set the maximum zoom at which the polyline labels are visible. Ignored if ShowLabel is false.
         * @memberof MapPolylineLayerDirective
         */
        this.LabelMaxZoom = Number.MAX_SAFE_INTEGER;
        /**
         * Set the minimum zoom at which the polyline labels are visible. Ignored if ShowLabel is false.
         * @memberof MapPolylineLayerDirective
         */
        this.LabelMinZoom = -1;
        /**
         * Gets or sets An offset applied to the positioning of the layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.LayerOffset = null;
        /**
         * Whether to show the polylines titles as the labels on the polylines.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.ShowLabels = false;
        /**
         * Whether to show the titles of the polylines as the tooltips on the polylines.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.ShowTooltips = true;
        /**
         * Gets or sets the z-index of the layer. If not used, layers get stacked in the order created.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.ZIndex = 0;
        ///
        /// Delegates
        ///
        /**
         * This event emitter gets emitted when the user clicks a polyline in the layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.PolylineClick = new EventEmitter();
        /**
         * This event is fired when the DOM dblclick event is fired on a polyline in the layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.PolylineDblClick = new EventEmitter();
        /**
         * This event is fired when the DOM mousemove event is fired on a polyline in the layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.PolylineMouseMove = new EventEmitter();
        /**
         * This event is fired on mouseout on a polyline in the layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.PolylineMouseOut = new EventEmitter();
        /**
         * This event is fired on mouseover on a polyline in a layer.
         *
         * @memberof MapPolylineLayerDirective
         */
        this.PolylineMouseOver = new EventEmitter();
        this._id = layerId$3++;
    }
    /**
     * An array of polyline options representing the polylines in the layer.
     *
     * @memberof MapPolylineLayerDirective
     */
    get PolylineOptions() { return this._polylines; }
    set PolylineOptions(val) {
        if (this._streaming) {
            this._polylinesLast.push(...val.slice(0));
            this._polylines.push(...val);
        }
        else {
            this._polylines = val.slice(0);
        }
    }
    /**
     * Sets whether to treat changes in the PolylineOptions as streams of new markers. In this mode, changing the
     * Array supplied in PolylineOptions will be incrementally drawn on the map as opposed to replace the polylines on the map.
     *
     * @memberof MapPolylineLayerDirective
     */
    get TreatNewPolylineOptionsAsStream() { return this._streaming; }
    set TreatNewPolylineOptionsAsStream(val) { this._streaming = val; }
    ///
    /// Property declarations
    ///
    /**
     * Gets the id of the polyline layer.
     *
     * @readonly
     * @memberof MapPolylineLayerDirective
     */
    get Id() { return this._id; }
    ///
    /// Public methods
    ///
    /**
     * Called after Component content initialization. Part of ng Component life cycle.
     *
     * @memberof MapPolylineLayerDirective
     */
    ngAfterContentInit() {
        const layerOptions = {
            id: this._id
        };
        this._zone.runOutsideAngular(() => {
            const fakeLayerDirective = {
                Id: this._id,
                Visible: this.Visible,
                LayerOffset: this.LayerOffset,
                ZIndex: this.ZIndex
            };
            this._layerService.AddLayer(fakeLayerDirective);
            this._layerPromise = this._layerService.GetNativeLayer(fakeLayerDirective);
            Promise.all([
                this._layerPromise,
                this._mapService.CreateCanvasOverlay(el => this.DrawLabels(el))
            ]).then(values => {
                values[0].SetVisible(this.Visible);
                this._canvas = values[1];
                this._canvas._canvasReady.then(b => {
                    this._tooltip = this._canvas.GetToolTipOverlay();
                    this.ManageTooltip(this.ShowTooltips);
                });
                if (this.PolylineOptions) {
                    this._zone.runOutsideAngular(() => this.UpdatePolylines());
                }
            });
            this._service = this._layerService;
        });
    }
    /**
     * Called on component destruction. Frees the resources used by the component. Part of the ng Component life cycle.
     *
     * @memberof MapPolylineLayerDirective
     */
    ngOnDestroy() {
        this._tooltipSubscriptions.forEach(s => s.unsubscribe());
        this._layerPromise.then(l => {
            l.Delete();
        });
        if (this._canvas) {
            this._canvas.Delete();
        }
    }
    /**
     * Reacts to changes in data-bound properties of the component and actuates property changes in the underling layer model.
     *
     * @param changes - collection of changes.
     * @memberof MapPolylineLayerDirective
     */
    ngOnChanges(changes) {
        if (changes['PolylineOptions']) {
            this._zone.runOutsideAngular(() => {
                this.UpdatePolylines();
            });
        }
        if (changes['Visible'] && !changes['Visible'].firstChange) {
            this._layerPromise.then(l => l.SetVisible(this.Visible));
        }
        if ((changes['ZIndex'] && !changes['ZIndex'].firstChange) ||
            (changes['LayerOffset'] && !changes['LayerOffset'].firstChange)) {
            throw (new Error('You cannot change ZIndex or LayerOffset after the layer has been created.'));
        }
        if ((changes['ShowLabels'] && !changes['ShowLabels'].firstChange) ||
            (changes['LabelMinZoom'] && !changes['LabelMinZoom'].firstChange) ||
            (changes['LabelMaxZoom'] && !changes['LabelMaxZoom'].firstChange)) {
            if (this._canvas) {
                this._canvas.Redraw(true);
            }
        }
        if (changes['ShowTooltips'] && this._tooltip) {
            this.ManageTooltip(changes['ShowTooltips'].currentValue);
        }
    }
    /**
     * Obtains a string representation of the Layer Id.
     * @returns - string representation of the layer id.
     * @memberof MapPolylineLayerDirective
     */
    toString() { return 'MapPolylineLayer-' + this._id.toString(); }
    ///
    /// Private methods
    ///
    /**
     * Adds various event listeners for the polylines.
     *
     * @param p - the polyline for which to add the event.
     *
     * @memberof MapPolylineLayerDirective
     */
    AddEventListeners(p) {
        const handlers = [
            { name: 'click', handler: (ev) => this.PolylineClick.emit({ Polyline: p, Click: ev }) },
            { name: 'dblclick', handler: (ev) => this.PolylineDblClick.emit({ Polyline: p, Click: ev }) },
            { name: 'mousemove', handler: (ev) => this.PolylineMouseMove.emit({ Polyline: p, Click: ev }) },
            { name: 'mouseout', handler: (ev) => this.PolylineMouseOut.emit({ Polyline: p, Click: ev }) },
            { name: 'mouseover', handler: (ev) => this.PolylineMouseOver.emit({ Polyline: p, Click: ev }) }
        ];
        handlers.forEach((obj) => p.AddListener(obj.name, obj.handler));
    }
    /**
     * Draws the polyline labels. Called by the Canvas overlay.
     *
     * @param el - The canvas on which to draw the labels.
     * @memberof MapPolylineLayerDirective
     */
    DrawLabels(el) {
        if (this.ShowLabels) {
            this._mapService.GetZoom().then(z => {
                if (this.LabelMinZoom <= z && this.LabelMaxZoom >= z) {
                    const ctx = el.getContext('2d');
                    const labels = this._labels.map(x => x.title);
                    this._mapService.LocationsToPoints(this._labels.map(x => x.loc)).then(locs => {
                        const size = this._mapService.MapSize;
                        for (let i = 0, len = locs.length; i < len; i++) {
                            // Don't draw the point if it is not in view. This greatly improves performance when zoomed in.
                            if (locs[i].x >= 0 && locs[i].y >= 0 && locs[i].x <= size.width && locs[i].y <= size.height) {
                                this.DrawText(ctx, locs[i], labels[i]);
                            }
                        }
                    });
                }
            });
        }
    }
    /**
     * Draws the label text at the appropriate place on the canvas.
     * @param ctx - Canvas drawing context.
     * @param loc - Pixel location on the canvas where to center the text.
     * @param text - Text to draw.
     */
    DrawText(ctx, loc, text) {
        let lo = this.LabelOptions;
        if (lo == null && this._tooltip) {
            lo = this._tooltip.DefaultLabelStyle;
        }
        if (lo == null) {
            lo = this._defaultOptions;
        }
        ctx.strokeStyle = lo.strokeColor;
        ctx.font = `${lo.fontSize}px ${lo.fontFamily}`;
        ctx.textAlign = 'center';
        const strokeWeight = lo.strokeWeight;
        if (text && strokeWeight && strokeWeight > 0) {
            ctx.lineWidth = strokeWeight;
            ctx.strokeText(text, loc.x, loc.y);
        }
        ctx.fillStyle = lo.fontColor;
        ctx.fillText(text, loc.x, loc.y);
    }
    /**
     * Manages the tooltip and the attachment of the associated events.
     *
     * @param show - True to enable the tooltip, false to disable.
     * @memberof MapPolygonLayerDirective
     */
    ManageTooltip(show) {
        if (show && this._canvas) {
            // add tooltip subscriptions
            this._tooltip.Set('hidden', true);
            this._tooltipVisible = false;
            this._tooltipSubscriptions.push(this.PolylineMouseMove.asObservable().subscribe(e => {
                if (this._tooltipVisible) {
                    const loc = this._canvas.GetCoordinatesFromClick(e.Click);
                    this._tooltip.Set('position', loc);
                }
            }));
            this._tooltipSubscriptions.push(this.PolylineMouseOver.asObservable().subscribe(e => {
                if (e.Polyline.Title && e.Polyline.Title.length > 0) {
                    const loc = this._canvas.GetCoordinatesFromClick(e.Click);
                    this._tooltip.Set('text', e.Polyline.Title);
                    this._tooltip.Set('position', loc);
                    if (!this._tooltipVisible) {
                        this._tooltip.Set('hidden', false);
                        this._tooltipVisible = true;
                    }
                }
            }));
            this._tooltipSubscriptions.push(this.PolylineMouseOut.asObservable().subscribe(e => {
                if (this._tooltipVisible) {
                    this._tooltip.Set('hidden', true);
                    this._tooltipVisible = false;
                }
            }));
        }
        else {
            // remove tooltip subscriptions
            this._tooltipSubscriptions.forEach(s => s.unsubscribe());
            this._tooltipSubscriptions.splice(0);
            this._tooltip.Set('hidden', true);
            this._tooltipVisible = false;
        }
    }
    /**
     * Sets or updates the polyliness based on the polyline options. This will place the polylines on the map
     * and register the associated events.
     *
     * @memberof MapPolylineLayerDirective
     * @method
     */
    UpdatePolylines() {
        if (this._layerPromise == null) {
            return;
        }
        this._layerPromise.then(l => {
            const polylines = this._streaming ? this._polylinesLast.splice(0) : this._polylines;
            if (!this._streaming) {
                this._labels.splice(0);
            }
            // generate the promise for the polylines
            const lp = this._service.CreatePolylines(l.GetOptions().id, polylines);
            // set polylines once promises are fullfilled.
            lp.then(p => {
                const y = new Array();
                p.forEach(poly => {
                    if (Array.isArray(poly)) {
                        let title = '';
                        const centroids = new Array();
                        poly.forEach(x => {
                            y.push(x);
                            this.AddEventListeners(x);
                            centroids.push(x.Centroid);
                            if (x.Title != null && x.Title.length > 0 && title.length === 0) {
                                title = x.Title;
                            }
                        });
                        this._labels.push({ loc: Polyline.GetPolylineCentroid(centroids), title: title });
                    }
                    else {
                        y.push(poly);
                        if (poly.Title != null && poly.Title.length > 0) {
                            this._labels.push({ loc: poly.Centroid, title: poly.Title });
                        }
                        this.AddEventListeners(poly);
                    }
                });
                this._streaming ? l.AddEntities(y) : l.SetEntities(y);
                if (this._canvas) {
                    this._canvas.Redraw(!this._streaming);
                }
            });
        });
    }
}
MapPolylineLayerDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-map-polyline-layer'
            },] }
];
MapPolylineLayerDirective.ctorParameters = () => [
    { type: LayerService },
    { type: MapService },
    { type: NgZone }
];
MapPolylineLayerDirective.propDecorators = {
    LabelMaxZoom: [{ type: Input }],
    LabelMinZoom: [{ type: Input }],
    LabelOptions: [{ type: Input }],
    LayerOffset: [{ type: Input }],
    PolylineOptions: [{ type: Input }],
    ShowLabels: [{ type: Input }],
    ShowTooltips: [{ type: Input }],
    TreatNewPolylineOptionsAsStream: [{ type: Input }],
    Visible: [{ type: Input }],
    ZIndex: [{ type: Input }],
    PolylineClick: [{ type: Output }],
    PolylineDblClick: [{ type: Output }],
    PolylineMouseMove: [{ type: Output }],
    PolylineMouseOut: [{ type: Output }],
    PolylineMouseOver: [{ type: Output }]
};

/**
 * Abstract implementation. USed for defintion only and as a base to implement your
 * own provider.
 *
 * @export
 * @abstract
 */
class MapAPILoader {
}
MapAPILoader.decorators = [
    { type: Injectable }
];
/**
 * Document Reference service to assist with abstracting the availability of document. Needed for AOT and
 * Server Side rendering
 *
 * @export
 */
class DocumentRef {
    /**
     * Gets whether a document implementation is available. Generally will be true in the browser and false otherwise, unless there
     * there is a browser-less implementation in the current non-browser environment.
     *
     * @readonly
     * @memberof DocumentRef
     */
    get IsAvailable() {
        return !(typeof (document) === 'undefined');
    }
    /**
     * Returns the document object of the current environment.
     *
     * @returns - The document object.
     *
     * @memberof DocumentRef
     */
    GetNativeDocument() {
        if (typeof (document) === 'undefined') {
            return null;
        }
        return document;
    }
}
DocumentRef.decorators = [
    { type: Injectable }
];
/**
 * Window Reference service to assist with abstracting the availability of window. Needed for AOT and
 * Server Side rendering
 *
 * @export
 */
class WindowRef {
    /**
     * Gets whether a window implementation is available. Generally will be true in the browser and false otherwise, unless there
     * there is a browser-less implementation in the current non-browser environment.
     *
     * @readonly
     * @memberof WindowRef
     */
    get IsAvailable() {
        return !(typeof (window) === 'undefined');
    }
    /**
     * Returns the window object of the current environment.
     *
     * @returns - The window object.
     *
     * @memberof WindowRef
     */
    GetNativeWindow() {
        if (typeof (window) === 'undefined') {
            return null;
        }
        return window;
    }
}
WindowRef.decorators = [
    { type: Injectable }
];

/**
 * Protocol enumeration
 *
 * @export
 * @enum {number}
 */
var ScriptProtocol;
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
class BingMapAPILoaderConfig {
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
class BingMapAPILoader extends MapAPILoader {
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

/**
 * Concrete implementation of the {@link InfoBoxService} contract for the Bing Maps V8 architecture.
 *
 * @export
 */
class BingInfoBoxService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingInfoBoxService.
     * @param _mapService - Concrete {@link MapService} implementation for Bing Maps V8. An instance of {@link BingMapService}.
     * @param _zone - An instance of NgZone to provide zone aware promises.
     *
     * @memberof BingInfoBoxService
     */
    constructor(_mapService, _zone) {
        this._mapService = _mapService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._boxes = new Map();
    }
    /**
     * Adds an info window to the map or layer.
     *
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     *
     * @memberof BingInfoBoxService
     */
    AddInfoWindow(info) {
        const options = {};
        if (typeof info.Latitude === 'number' && typeof info.Longitude === 'number') {
            options.position = {
                latitude: info.Latitude,
                longitude: info.Longitude
            };
        }
        if (typeof info.InfoWindowActions !== 'undefined' && info.InfoWindowActions.length > 0) {
            options.actions = [];
            info.InfoWindowActions.forEach((action) => {
                options.actions.push({
                    label: action.Label,
                    eventHandler: () => { action.ActionClicked.emit(null); }
                });
            });
        }
        if (info.HtmlContent !== '') {
            options.htmlContent = info.HtmlContent;
        }
        else {
            options.title = info.Title;
            options.description = info.Description;
        }
        if (info.xOffset || info.yOffset) {
            if (options.pixelOffset == null) {
                options.pixelOffset = { x: 0, y: 0 };
            }
            if (info.xOffset) {
                options.pixelOffset.x = info.xOffset;
            }
            if (info.yOffset) {
                options.pixelOffset.y = info.yOffset;
            }
        }
        options.visible = info.Visible;
        const infoPromise = this._mapService.CreateInfoWindow(options);
        this._boxes.set(info, infoPromise);
    }
    /**
     * Closes an InfoBoxComponent that is open.
     *
     * @abstract
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     * @returns - A promise that is fullfilled when the infobox has been closed.
     *
     * @memberof InfoBoxService
     */
    Close(info) {
        return this._boxes.get(info).then((w) => w.Close());
    }
    /**
     * Registers an event delegate for an info window.
     *
     * @param eventName - The name of the event to register (e.g. 'click')
     * @param infoComponent - The {@link InfoBoxComponent} for which to register the event.
     * @returns - Observable emiting an instance of T each time the event occurs.
     *
     * @memberof GoogleInfoBoxService
     */
    CreateEventObservable(eventName, infoComponent) {
        const eventNameTranslated = BingMapEventsLookup[eventName];
        return Observable.create((observer) => {
            this._boxes.get(infoComponent).then((b) => {
                b.AddListener(eventNameTranslated, (e) => this._zone.run(() => observer.next(e)));
            });
        });
    }
    /**
     * Deletes an infobox.
     *
     * @abstract
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     * @returns - A promise that is fullfilled when the infobox has been deleted.
     *
     * @memberof InfoBoxService
     */
    DeleteInfoWindow(info) {
        const w = this._boxes.get(info);
        if (w == null) {
            return Promise.resolve();
        }
        return w.then((i) => {
            return this._zone.run(() => {
                i.Close();
                this._boxes.delete(info);
            });
        });
    }
    /**
     * Opens an infobox that is closed.
     *
     * @abstract
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     * @returns - A promise that is fullfilled when the infobox has been opened.
     *
     * @memberof InfoBoxService
     */
    Open(info, loc) {
        if (info.CloseInfoBoxesOnOpen || info.Modal) {
            // close all open info boxes.
            this._boxes.forEach((v, i) => {
                if (info.Id !== i.Id) {
                    v.then(w => {
                        if (w.IsOpen) {
                            w.Close();
                            i.Close();
                        }
                    });
                }
            });
        }
        return this._boxes.get(info).then((w) => {
            const options = {};
            if (info.HtmlContent !== '') {
                options.htmlContent = info.HtmlContent;
            }
            else {
                options.title = info.Title;
                options.description = info.Description;
            }
            w.SetOptions(options);
            if (info.Latitude && info.Longitude) {
                w.SetPosition({ latitude: info.Latitude, longitude: info.Longitude });
            }
            else if (loc) {
                ///
                /// this situation is specifically used for cluster layers that use spidering.
                ///
                w.SetPosition(loc);
            }
            else if (info.HostMarker) {
                w.SetPosition({ latitude: info.HostMarker.Latitude, longitude: info.HostMarker.Longitude });
            }
            w.Open();
        });
    }
    /**
     * Sets the infobox options.
     *
     * @abstract
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     * @param options - {@link IInfoWindowOptions} object containing the options to set. Options provided are
     * merged with the existing options of the underlying infobox.
     * @returns - A promise that is fullfilled when the infobox options have been updated.
     *
     * @memberof InfoBoxService
     */
    SetOptions(info, options) {
        return this._boxes.get(info).then((i) => i.SetOptions(options));
    }
    /**
     * Set the position of the infobox based on the properties set on the InfoBox component.
     *
     * @abstract
     * @param info - {@link InfoBoxComponent} component object representing the infobox.
     * @returns - A promise that is fullfilled when the infobox position has been updated.
     *
     * @memberof InfoBoxService
     */
    SetPosition(info) {
        return this._boxes.get(info).then((i) => i.SetPosition({
            latitude: info.Latitude,
            longitude: info.Longitude
        }));
    }
}
BingInfoBoxService.decorators = [
    { type: Injectable }
];
BingInfoBoxService.ctorParameters = () => [
    { type: MapService },
    { type: NgZone }
];

/**
 * Concrete implementation of the MarkerService abstract class for Bing Maps V8.
 *
 * @export
 */
class BingMarkerService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingMarkerService.
     * @param _mapService - {@link MapService} instance. The concrete {@link BingMapService} implementation is expected.
     * @param _layerService - {@link LayerService} instance.
     * The concrete {@link BingLayerService} implementation is expected.
     * @param _clusterService - {@link ClusterService} instance.
     * The concrete {@link BingClusterService} implementation is expected.
     * @param _zone - NgZone instance to support zone aware promises.
     *
     * @memberof BingMarkerService
     */
    constructor(_mapService, _layerService, _clusterService, _zone) {
        this._mapService = _mapService;
        this._layerService = _layerService;
        this._clusterService = _clusterService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._markers = new Map();
    }
    ///
    /// Public members and MarkerService implementation
    ///
    /**
     * Adds a marker. Depending on the marker context, the marker will either by added to the map or a correcsponding layer.
     *
     * @param marker - The {@link MapMarkerDirective} to be added.
     *
     * @memberof BingMarkerService
     */
    AddMarker(marker) {
        const o = {
            position: { latitude: marker.Latitude, longitude: marker.Longitude },
            title: marker.Title,
            label: marker.Label,
            draggable: marker.Draggable,
            icon: marker.IconUrl,
            iconInfo: marker.IconInfo,
            isFirst: marker.IsFirstInSet,
            isLast: marker.IsLastInSet
        };
        if (marker.Width) {
            o.width = marker.Width;
        }
        if (marker.Height) {
            o.height = marker.Height;
        }
        if (marker.Anchor) {
            o.anchor = marker.Anchor;
        }
        if (marker.Metadata) {
            o.metadata = marker.Metadata;
        }
        // create marker via promise.
        let markerPromise = null;
        if (marker.InClusterLayer) {
            markerPromise = this._clusterService.CreateMarker(marker.LayerId, o);
        }
        else if (marker.InCustomLayer) {
            markerPromise = this._layerService.CreateMarker(marker.LayerId, o);
        }
        else {
            markerPromise = this._mapService.CreateMarker(o);
        }
        this._markers.set(marker, markerPromise);
        if (marker.IconInfo) {
            markerPromise.then((m) => {
                // update iconInfo to provide hook to do post icon creation activities and
                // also re-anchor the marker
                marker.DynamicMarkerCreated.emit(o.iconInfo);
                const p = {
                    x: (o.iconInfo.size && o.iconInfo.markerOffsetRatio) ? (o.iconInfo.size.width * o.iconInfo.markerOffsetRatio.x) : 0,
                    y: (o.iconInfo.size && o.iconInfo.markerOffsetRatio) ? (o.iconInfo.size.height * o.iconInfo.markerOffsetRatio.y) : 0,
                };
                m.SetAnchor(p);
            });
        }
    }
    /**
     * Registers an event delegate for a marker.
     *
     * @param eventName - The name of the event to register (e.g. 'click')
     * @param marker - The {@link MapMarker} for which to register the event.
     * @returns - Observable emiting an instance of T each time the event occurs.
     *
     * @memberof BingMarkerService
     */
    CreateEventObservable(eventName, marker) {
        const b = new Subject();
        if (eventName === 'mousemove') {
            return b.asObservable();
        }
        if (eventName === 'rightclick') {
            return b.asObservable();
        }
        ///
        /// mousemove and rightclick are not supported by bing polygons.
        ///
        return Observable.create((observer) => {
            this._markers.get(marker).then((m) => {
                m.AddListener(eventName, (e) => this._zone.run(() => observer.next(e)));
            });
        });
    }
    /**
     * Deletes a marker.
     *
     * @param marker - {@link MapMarker} to be deleted.
     * @returns - A promise fullfilled once the marker has been deleted.
     *
     * @memberof BingMarkerService
     */
    DeleteMarker(marker) {
        const m = this._markers.get(marker);
        let p = Promise.resolve();
        if (m != null) {
            p = m.then((ma) => {
                if (marker.InClusterLayer) {
                    this._clusterService.GetNativeLayer(marker.LayerId).then(l => { l.RemoveEntity(ma); });
                }
                if (marker.InCustomLayer) {
                    this._layerService.GetNativeLayer(marker.LayerId).then(l => { l.RemoveEntity(ma); });
                }
                return this._zone.run(() => {
                    ma.DeleteMarker();
                    this._markers.delete(marker);
                });
            });
        }
        return p;
    }
    /**
     * Obtains geo coordinates for the marker on the click location
     *
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     *
     * @memberof BingMarkerService
     */
    GetCoordinatesFromClick(e) {
        if (!e) {
            return null;
        }
        if (!e.primitive) {
            return null;
        }
        if (!(e.primitive instanceof Microsoft.Maps.Pushpin)) {
            return null;
        }
        const p = e.primitive;
        const loc = p.getLocation();
        return { latitude: loc.latitude, longitude: loc.longitude };
    }
    /**
     * Obtains the marker model for the marker allowing access to native implementation functionatiliy.
     *
     * @param marker - The {@link MapMarker} for which to obtain the marker model.
     * @returns - A promise that when fullfilled contains the {@link Marker} implementation of the underlying platform.
     *
     * @memberof BingMarkerService
     */
    GetNativeMarker(marker) {
        return this._markers.get(marker);
    }
    /**
     * Obtains the marker pixel location for the marker on the click location
     *
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the pixels of the marker on the map canvas.
     *
     * @memberof BingMarkerService
     */
    GetPixelsFromClick(e) {
        const loc = this.GetCoordinatesFromClick(e);
        if (loc == null) {
            return null;
        }
        const l = BingConversions.TranslateLocation(loc);
        const p = this._mapService.MapInstance.tryLocationToPixel(l, Microsoft.Maps.PixelReference.control);
        if (p == null) {
            return null;
        }
        return { x: p.x, y: p.y };
    }
    /**
     * Converts a geo location to a pixel location relative to the map canvas.
     *
     * @param target - Either a {@link MapMarker} or a {@link ILatLong} for the basis of translation.
     * @returns - A promise that when fullfilled contains a {@link IPoint}
     * with the pixel coordinates of the MapMarker or ILatLong relative to the map canvas.
     *
     * @memberof BingMarkerService
     */
    LocationToPoint(target) {
        if (target == null) {
            return Promise.resolve(null);
        }
        if (target instanceof MapMarkerDirective) {
            return this._markers.get(target).then((m) => {
                const l = m.Location;
                const p = this._mapService.LocationToPoint(l);
                return p;
            });
        }
        return this._mapService.LocationToPoint(target);
    }
    /**
     * Updates the anchor position for the marker.
     *
     * @param - The {@link MapMarker} object for which to upate the anchor.
     * Anchor information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the anchor position has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateAnchor(marker) {
        return this._markers.get(marker).then((m) => {
            m.SetAnchor(marker.Anchor);
        });
    }
    /**
     * Updates whether the marker is draggable.
     *
     * @param - The {@link MapMarker} object for which to upate dragability.
     * Dragability information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the marker has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateDraggable(marker) {
        return this._markers.get(marker).then((m) => m.SetDraggable(marker.Draggable));
    }
    /**
     * Updates the Icon on the marker.
     *
     * @param - The {@link MapMarker} object for which to upate the icon.
     * Icon information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the icon information has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateIcon(marker) {
        const payload = (m, icon, iconInfo) => {
            if (icon && icon !== '') {
                m.SetIcon(icon);
                marker.DynamicMarkerCreated.emit(iconInfo);
            }
        };
        return this._markers.get(marker).then((m) => {
            if (marker.IconInfo) {
                const s = Marker.CreateMarker(marker.IconInfo);
                if (typeof (s) === 'string') {
                    return (payload(m, s, marker.IconInfo));
                }
                else {
                    return s.then(x => {
                        return (payload(m, x.icon, x.iconInfo));
                    });
                }
            }
            else {
                return (m.SetIcon(marker.IconUrl));
            }
        });
    }
    /**
     * Updates the label on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the label.
     * Label information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the label has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateLabel(marker) {
        return this._markers.get(marker).then((m) => { m.SetLabel(marker.Label); });
    }
    /**
     * Updates the geo coordinates for the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the coordinates.
     * Coordinate information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the position has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateMarkerPosition(marker) {
        return this._markers.get(marker).then((m) => m.SetPosition({
            latitude: marker.Latitude,
            longitude: marker.Longitude
        }));
    }
    /**
     * Updates the title on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the title.
     * Title information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the title has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateTitle(marker) {
        return this._markers.get(marker).then((m) => m.SetTitle(marker.Title));
    }
    /**
     * Updates the visibility on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the visiblity.
     * Visibility information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the visibility has been updated.
     *
     * @memberof BingMarkerService
     */
    UpdateVisible(marker) {
        return this._markers.get(marker).then((m) => m.SetVisible(marker.Visible));
    }
}
BingMarkerService.decorators = [
    { type: Injectable }
];
BingMarkerService.ctorParameters = () => [
    { type: MapService },
    { type: LayerService },
    { type: ClusterService },
    { type: NgZone }
];

/**
 * Concrete implementation of the MapService abstract implementing a Bin Map V8 provider
 *
 * @export
 */
class BingMapService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingMapService.
     * @param _loader MapAPILoader instance implemented for Bing Maps. This instance will generally be injected.
     * @param _zone NgZone object to enable zone aware promises. This will generally be injected.
     *
     * @memberof BingMapService
     */
    constructor(_loader, _zone) {
        this._loader = _loader;
        this._zone = _zone;
        this._modules = new Map();
        this._map = new Promise((resolve) => { this._mapResolver = resolve; });
        this._config = this._loader.Config;
    }
    ///
    /// Property Definitions
    ///
    /**
     * Gets an array of loaded Bong modules.
     *
     * @readonly
     * @memberof BingMapService
     */
    get LoadedModules() { return this._modules; }
    /**
     * Gets the Bing Map control instance underlying the implementation
     *
     * @readonly
     * @memberof BingMapService
     */
    get MapInstance() { return this._mapInstance; }
    /**
     * Gets a Promise for a Bing Map control instance underlying the implementation. Use this instead of {@link MapInstance} if you
     * are not sure if and when the instance will be created.
     * @readonly
     * @memberof BingMapService
     */
    get MapPromise() { return this._map; }
    /**
     * Gets the maps physical size.
     *
     * @readonly
     * @abstract
     * @memberof BingMapService
     */
    get MapSize() {
        if (this.MapInstance) {
            const s = { width: this.MapInstance.getWidth(), height: this.MapInstance.getHeight() };
            return s;
        }
        return null;
    }
    ///
    /// Public methods and MapService interface implementation
    ///
    /**
     * Creates a canvas overlay layer to perform custom drawing over the map with out
     * some of the overhead associated with going through the Map objects.
     * @param drawCallback A callback function that is triggered when the canvas is ready to be
     * rendered for the current map view.
     * @returns - Promise of a {@link CanvasOverlay} object.
     * @memberof BingMapService
     */
    CreateCanvasOverlay(drawCallback) {
        return this._map.then((map) => {
            const overlay = new BingCanvasOverlay(drawCallback);
            map.layers.insert(overlay);
            return overlay;
        });
    }
    /**
     * Creates a Bing map cluster layer within the map context
     *
     * @param options - Options for the layer. See {@link IClusterOptions}.
     * @returns - Promise of a {@link Layer} object, which models the underlying Microsoft.Maps.ClusterLayer object.
     *
     * @memberof BingMapService
     */
    CreateClusterLayer(options) {
        return this._map.then((map) => {
            const p = new Promise(resolve => {
                this.LoadModule('Microsoft.Maps.Clustering', () => {
                    const o = BingConversions.TranslateClusterOptions(options);
                    const layer = new Microsoft.Maps.ClusterLayer(new Array(), o);
                    let bl;
                    map.layers.insert(layer);
                    bl = new BingClusterLayer(layer, this);
                    bl.SetOptions(options);
                    resolve(bl);
                });
            });
            return p;
        });
    }
    /**
     * Creates an information window for a map position
     *
     * @param [options] - Infowindow options. See {@link IInfoWindowOptions}
     * @returns - Promise of a {@link InfoWindow} object, which models the underlying Microsoft.Maps.Infobox object.
     *
     * @memberof BingMapService
     */
    CreateInfoWindow(options) {
        return this._map.then((map) => {
            let loc;
            if (options.position == null) {
                loc = map.getCenter();
            }
            else {
                loc = new Microsoft.Maps.Location(options.position.latitude, options.position.longitude);
            }
            const infoBox = new Microsoft.Maps.Infobox(loc, BingConversions.TranslateInfoBoxOptions(options));
            infoBox.setMap(map);
            return new BingInfoWindow(infoBox);
        });
    }
    /**
     * Creates a map layer within the map context
     *
     * @param options - Options for the layer. See {@link ILayerOptions}
     * @returns - Promise of a {@link Layer} object, which models the underlying Microsoft.Maps.Layer object.
     *
     * @memberof BingMapService
     */
    CreateLayer(options) {
        return this._map.then((map) => {
            const layer = new Microsoft.Maps.Layer(options.id.toString());
            map.layers.insert(layer);
            return new BingLayer(layer, this);
        });
    }
    /**
     * Creates a map instance
     *
     * @param el - HTML element to host the map.
     * @param mapOptions - Map options
     * @returns - Promise fullfilled once the map has been created.
     *
     * @memberof BingMapService
     */
    CreateMap(el, mapOptions) {
        return this._loader.Load().then(() => {
            // apply mixins
            MixinMapLabelWithOverlayView();
            MixinCanvasOverlay();
            // map startup...
            if (this._mapInstance != null) {
                this.DisposeMap();
            }
            const o = BingConversions.TranslateLoadOptions(mapOptions);
            if (!o.credentials) {
                o.credentials = this._config.apiKey;
            }
            const map = new Microsoft.Maps.Map(el, o);
            this._mapInstance = map;
            this._mapResolver(map);
        });
    }
    /**
     * Creates a Bing map marker within the map context
     *
     * @param [options=<IMarkerOptions>{}] - Options for the marker. See {@link IMarkerOptions}.
     * @returns - Promise of a {@link Marker} object, which models the underlying Microsoft.Maps.PushPin object.
     *
     * @memberof BingMapService
     */
    CreateMarker(options = {}) {
        const payload = (icon, map) => {
            const loc = BingConversions.TranslateLocation(options.position);
            const o = BingConversions.TranslateMarkerOptions(options);
            if (icon && icon !== '') {
                o.icon = icon;
            }
            const pushpin = new Microsoft.Maps.Pushpin(loc, o);
            const marker = new BingMarker(pushpin, map, null);
            if (options.metadata) {
                options.metadata.forEach((v, k) => marker.Metadata.set(k, v));
            }
            map.entities.push(pushpin);
            return marker;
        };
        return this._map.then((map) => {
            if (options.iconInfo && options.iconInfo.markerType) {
                const s = Marker.CreateMarker(options.iconInfo);
                if (typeof (s) === 'string') {
                    return (payload(s, map));
                }
                else {
                    return s.then(x => {
                        return (payload(x.icon, map));
                    });
                }
            }
            else {
                return (payload(null, map));
            }
        });
    }
    /**
     * Creates a polygon within the Bing Maps V8 map context
     *
     * @abstract
     * @param options - Options for the polygon. See {@link IPolygonOptions}.
     * @returns - Promise of a {@link Polygon} object, which models the underlying native polygon.
     *
     * @memberof MapService
     */
    CreatePolygon(options) {
        return this._map.then((map) => {
            const locs = BingConversions.TranslatePaths(options.paths);
            const o = BingConversions.TranslatePolygonOptions(options);
            const poly = new Microsoft.Maps.Polygon(locs, o);
            map.entities.push(poly);
            const p = new BingPolygon(poly, this, null);
            if (options.metadata) {
                options.metadata.forEach((v, k) => p.Metadata.set(k, v));
            }
            if (options.title && options.title !== '') {
                p.Title = options.title;
            }
            if (options.showLabel != null) {
                p.ShowLabel = options.showLabel;
            }
            if (options.showTooltip != null) {
                p.ShowTooltip = options.showTooltip;
            }
            if (options.labelMaxZoom != null) {
                p.LabelMaxZoom = options.labelMaxZoom;
            }
            if (options.labelMinZoom != null) {
                p.LabelMinZoom = options.labelMinZoom;
            }
            if (options.editable) {
                p.SetEditable(options.editable);
            }
            return p;
        });
    }
    /**
     * Creates a polyline within the Bing Maps V8 map context
     *
     * @abstract
     * @param options - Options for the polyline. See {@link IPolylineOptions}.
     * @returns - Promise of a {@link Polyline} object (or an array thereof for complex paths),
     * which models the underlying native polygon.
     *
     * @memberof MapService
     */
    CreatePolyline(options) {
        let polyline;
        return this._map.then((map) => {
            const o = BingConversions.TranslatePolylineOptions(options);
            const locs = BingConversions.TranslatePaths(options.path);
            if (options.path && options.path.length > 0 && !Array.isArray(options.path[0])) {
                polyline = new Microsoft.Maps.Polyline(locs[0], o);
                map.entities.push(polyline);
                const pl = new BingPolyline(polyline, map, null);
                if (options.metadata) {
                    options.metadata.forEach((v, k) => pl.Metadata.set(k, v));
                }
                if (options.title && options.title !== '') {
                    pl.Title = options.title;
                }
                if (options.showTooltip != null) {
                    pl.ShowTooltip = options.showTooltip;
                }
                return pl;
            }
            else {
                const lines = new Array();
                locs.forEach(p => {
                    polyline = new Microsoft.Maps.Polyline(p, o);
                    map.entities.push(polyline);
                    const pl = new BingPolyline(polyline, map, null);
                    if (options.metadata) {
                        options.metadata.forEach((v, k) => pl.Metadata.set(k, v));
                    }
                    if (options.title && options.title !== '') {
                        pl.Title = options.title;
                    }
                    if (options.showTooltip != null) {
                        pl.ShowTooltip = options.showTooltip;
                    }
                    lines.push(pl);
                });
                return lines;
            }
        });
    }
    /**
     * Deletes a layer from the map.
     *
     * @param layer - Layer to delete. See {@link Layer}. This method expects the Bing specific Layer model implementation.
     * @returns - Promise fullfilled when the layer has been removed.
     *
     * @memberof BingMapService
     */
    DeleteLayer(layer) {
        return this._map.then((map) => {
            map.layers.remove(layer.NativePrimitve);
        });
    }
    /**
     * Dispaose the map and associated resoures.
     *
     * @memberof BingMapService
     */
    DisposeMap() {
        if (this._map == null && this._mapInstance == null) {
            return;
        }
        if (this._mapInstance != null) {
            this._mapInstance.dispose();
            this._mapInstance = null;
            this._map = new Promise((resolve) => { this._mapResolver = resolve; });
        }
    }
    /**
     * Gets the geo coordinates of the map center
     *
     * @returns - A promise that when fullfilled contains the goe location of the center. See {@link ILatLong}.
     *
     * @memberof BingMapService
     */
    GetCenter() {
        return this._map.then((map) => {
            const center = map.getCenter();
            return {
                latitude: center.latitude,
                longitude: center.longitude
            };
        });
    }
    /**
     * Gets the geo coordinates of the map bounding box
     *
     * @returns - A promise that when fullfilled contains the goe location of the bounding box. See {@link IBox}.
     *
     * @memberof BingMapService
     */
    GetBounds() {
        return this._map.then((map) => {
            const box = map.getBounds();
            return {
                maxLatitude: box.getNorth(),
                maxLongitude: box.crossesInternationalDateLine() ? box.getWest() : box.getEast(),
                minLatitude: box.getSouth(),
                minLongitude: box.crossesInternationalDateLine() ? box.getEast() : box.getWest(),
                center: { latitude: box.center.latitude, longitude: box.center.longitude },
                padding: 0
            };
        });
    }
    /**
     * Gets a shared or private instance of the map drawing tools.
     *
     * @param [useSharedInstance=true] - Set to false to create a private instance.
     * @returns - Promise that when resolved containst an instance of the drawing tools.
     * @memberof BingMapService
     */
    GetDrawingTools(useSharedInstance = true) {
        return new Promise((resolve, reject) => {
            this.LoadModuleInstance('Microsoft.Maps.DrawingTools', useSharedInstance).then((o) => {
                resolve(o);
            });
        });
    }
    /**
     * Gets the current zoom level of the map.
     *
     * @returns - A promise that when fullfilled contains the zoom level.
     *
     * @memberof BingMapService
     */
    GetZoom() {
        return this._map.then((map) => map.getZoom());
    }
    /**
     * Loads a module into the Map.
     *
     * @param moduleName - The module to load.
     * @param callback - Callback to call once loading is complete.
     * @method
     * @memberof BingMapService
     */
    LoadModule(moduleName, callback) {
        if (this._modules.has(moduleName)) {
            callback();
        }
        else {
            Microsoft.Maps.loadModule(moduleName, () => {
                this._modules.set(moduleName, null);
                callback();
            });
        }
    }
    /**
     * Loads a module into the Map and delivers and instance of the module payload.
     *
     * @param moduleName - The module to load.
     * @param useSharedInstance- Use a shared instance if true, create a new instance if false.
     * @method
     * @memberof BingMapService
     */
    LoadModuleInstance(moduleName, useSharedInstance = true) {
        const s = moduleName.substr(moduleName.lastIndexOf('.') + 1);
        if (this._modules.has(moduleName)) {
            let o = null;
            if (!useSharedInstance) {
                o = new Microsoft.Maps[s](this._mapInstance);
            }
            else if (this._modules.get(moduleName) != null) {
                o = this._modules.get(moduleName);
            }
            else {
                o = new Microsoft.Maps[s](this._mapInstance);
                this._modules.set(moduleName, o);
            }
            return Promise.resolve(o);
        }
        else {
            return new Promise((resolve, reject) => {
                try {
                    Microsoft.Maps.loadModule(moduleName, () => {
                        const o = new Microsoft.Maps[s](this._mapInstance);
                        if (useSharedInstance) {
                            this._modules.set(moduleName, o);
                        }
                        else {
                            this._modules.set(moduleName, null);
                        }
                        resolve(o);
                    });
                }
                catch (e) {
                    reject('Could not load module or create instance.');
                }
            });
        }
    }
    /**
     * Provides a conversion of geo coordinates to pixels on the map control.
     *
     * @param loc - The geo coordinates to translate.
     * @returns - Promise of an {@link IPoint} interface representing the pixels. This promise resolves to null
     * if the goe coordinates are not in the view port.
     *
     * @memberof BingMapService
     */
    LocationToPoint(loc) {
        return this._map.then((m) => {
            const l = BingConversions.TranslateLocation(loc);
            const p = m.tryLocationToPixel(l, Microsoft.Maps.PixelReference.control);
            if (p != null) {
                return { x: p.x, y: p.y };
            }
            return null;
        });
    }
    /**
     * Provides a conversion of geo coordinates to pixels on the map control.
     *
     * @param loc - The geo coordinates to translate.
     * @returns - Promise of an {@link IPoint} interface array representing the pixels.
     *
     * @memberof BingMapService
     */
    LocationsToPoints(locs) {
        return this._map.then((m) => {
            const l = locs.map(loc => BingConversions.TranslateLocation(loc));
            const p = m.tryLocationToPixel(l, Microsoft.Maps.PixelReference.control);
            return p ? p : new Array();
        });
    }
    /**
     * Centers the map on a geo location.
     *
     * @param latLng - GeoCoordinates around which to center the map. See {@link ILatLong}
     * @returns - Promise that is fullfilled when the center operations has been completed.
     *
     * @memberof BingMapService
     */
    SetCenter(latLng) {
        return this._map.then((map) => map.setView({
            center: BingConversions.TranslateLocation(latLng)
        }));
    }
    /**
     * Sets the generic map options.
     *
     * @param options - Options to set.
     *
     * @memberof BingMapService
     */
    SetMapOptions(options) {
        this._map.then((m) => {
            const o = BingConversions.TranslateOptions(options);
            m.setOptions(o);
        });
    }
    /**
     * Sets the view options of the map.
     *
     * @param options - Options to set.
     *
     * @memberof BingMapService
     */
    SetViewOptions(options) {
        this._map.then((m) => {
            const o = BingConversions.TranslateViewOptions(options);
            m.setView(o);
        });
    }
    /**
     * Sets the zoom level of the map.
     *
     * @param zoom - Zoom level to set.
     * @returns - A Promise that is fullfilled once the zoom operation is complete.
     *
     * @memberof BingMapService
     */
    SetZoom(zoom) {
        return this._map.then((map) => map.setView({
            zoom: zoom
        }));
    }
    /**
     * Creates an event subscription
     *
     * @param eventName - The name of the event (e.g. 'click')
     * @returns - An observable of tpye E that fires when the event occurs.
     *
     * @memberof BingMapService
     */
    SubscribeToMapEvent(eventName) {
        const eventNameTranslated = BingMapEventsLookup[eventName];
        return Observable.create((observer) => {
            this._map.then((m) => {
                Microsoft.Maps.Events.addHandler(m, eventNameTranslated, (e) => {
                    this._zone.run(() => observer.next(e));
                });
            });
        });
    }
    /**
     * Triggers the given event name on the map instance.
     *
     * @param eventName - Event to trigger.
     * @returns - A promise that is fullfilled once the event is triggered.
     *
     * @memberof BingMapService
     */
    TriggerMapEvent(eventName) {
        return this._map.then((m) => Microsoft.Maps.Events.invoke(m, eventName, null));
    }
}
BingMapService.decorators = [
    { type: Injectable }
];
BingMapService.ctorParameters = () => [
    { type: MapAPILoader },
    { type: NgZone }
];

/**
 * This abstract partially implements the contract for the {@link LayerService}
 * and {@link ClusterService} for the Bing Maps V8 archtiecture. It serves
 * as the base class for basic layer ({@link BingLayerService}) and cluster layer ({@link BingClusterLayer}).
 *
 * @export
 * @abstract
 */
class BingLayerBase {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingLayerBase.
     * @param _mapService - Concrete {@link MapService} implementation for Bing Maps V8. An instance of {@link BingMapService}.
     *
     * @memberof BingLayerBase
     */
    constructor(_mapService, _zone) {
        this._mapService = _mapService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._layers = new Map();
    }
    /**
     * Creates a marker in the layer.
     *
     * @param layer - The Id of the layer in which to create the marker.
     * @param options - {@link IMarkerOptions} object containing the marker properties.
     * @returns - A promise that when fullfilled contains the {@link Marker} model for the created marker.
     *
     * @memberof BingLayerBase
     */
    CreateMarker(layer, options) {
        const payload = (icon, l) => {
            const loc = BingConversions.TranslateLocation(options.position);
            const o = BingConversions.TranslateMarkerOptions(options);
            if (icon && icon !== '') {
                o.icon = icon;
            }
            const pushpin = new Microsoft.Maps.Pushpin(loc, o);
            const marker = new BingMarker(pushpin, null, l.NativePrimitve);
            marker.IsFirst = options.isFirst;
            marker.IsLast = options.isLast;
            if (options.metadata) {
                options.metadata.forEach((v, k) => marker.Metadata.set(k, v));
            }
            l.AddEntity(marker);
            return marker;
        };
        const p = this.GetLayerById(layer);
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            if (options.iconInfo && options.iconInfo.markerType) {
                const s = Marker.CreateMarker(options.iconInfo);
                if (typeof (s) === 'string') {
                    return (payload(s, l));
                }
                else {
                    return s.then(x => {
                        return (payload(x.icon, l));
                    });
                }
            }
            else {
                return (payload(null, l));
            }
        });
    }
    /**
     * Creates an array of unbound markers. Use this method to create arrays of markers to be used in bulk
     * operations.
     *
     * @param options - Marker options defining the markers.
     * @param markerIcon - Optional information to generate custom markers. This will be applied to all markers.
     * @returns - A promise that when fullfilled contains the an arrays of the Marker models.
     *
     * @memberof BingLayerBase
     */
    CreateMarkers(options, markerIcon) {
        const payload = (icon, op) => {
            const markers = op.map(mo => {
                let s;
                const o = BingConversions.TranslateMarkerOptions(mo);
                if (icon && icon !== '') {
                    s = icon;
                }
                else if (o.icon) {
                    s = o.icon;
                }
                if (o.icon) {
                    delete o.icon;
                }
                const loc = BingConversions.TranslateLocation(mo.position);
                const pushpin = new Microsoft.Maps.Pushpin(loc, o);
                const img = Marker.GetImageForMarker(s);
                if (img != null) {
                    pushpin.image = img;
                }
                const marker = new BingMarker(pushpin, null, null);
                marker.IsFirst = mo.isFirst;
                marker.IsLast = mo.isLast;
                if (mo.metadata) {
                    mo.metadata.forEach((v, k) => marker.Metadata.set(k, v));
                }
                return marker;
            });
            return markers;
        };
        const p = new Promise((resolve, reject) => {
            if (markerIcon && markerIcon.markerType) {
                const s = Marker.CreateMarker(markerIcon);
                if (typeof (s) === 'string') {
                    resolve(payload(s, options));
                }
                else {
                    return s.then(x => {
                        resolve(payload(x.icon, options));
                    });
                }
            }
            else {
                resolve(payload(null, options));
            }
        });
        return p;
    }
    /**
     * Deletes the layer
     *
     * @param layer - MapLayerDirective component object for which to retrieve the layer.
     * @returns - A promise that is fullfilled when the layer has been removed.
     *
     * @memberof BingLayerBase
     */
    DeleteLayer(layer) {
        const l = this._layers.get(layer.Id);
        if (l == null) {
            return Promise.resolve();
        }
        return l.then((l1) => {
            return this._zone.run(() => {
                l1.Delete();
                this._layers.delete(layer.Id);
            });
        });
    }
    /**
     * Returns the Layer model represented by this layer.
     *
     * @param layer - MapLayerDirective component object or Layer Id for which to retrieve the layer model.
     * @returns - A promise that when resolved contains the Layer model.
     *
     * @memberof BingLayerBase
     */
    GetNativeLayer(layer) {
        let p = null;
        if (typeof (layer) === 'number') {
            p = this._layers.get(layer);
        }
        else {
            p = this._layers.get(layer.Id);
        }
        return p;
    }
    ///
    /// Protected methods
    ///
    /**
     * Gets the layer based on its id.
     *
     * @protected
     * @param id - Layer Id.
     * @returns - A promise that when fullfilled contains the {@link Layer} model for the layer.
     *
     * @memberof BingLayerBase
     */
    GetLayerById(id) {
        let p;
        this._layers.forEach((l, k) => { if (k === id) {
            p = l;
        } });
        return p;
    }
}

/**
 * Implements the {@link LayerService} contract for a  Bing Maps V8 specific implementation.
 *
 * @export
 */
class BingLayerService extends BingLayerBase {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingLayerService.
     * @param _mapService - Instance of the Bing Maps Service. Will generally be injected.
     * @param _zone - NgZone instance to provide zone aware promises.
     *
     * @memberof BingLayerService
     */
    constructor(_mapService, _zone) {
        super(_mapService, _zone);
    }
    /**
     * Adds a layer to the map.
     *
     * @abstract
     * @param layer - MapLayerDirective component object.
     * Generally, MapLayerDirective will be injected with an instance of the
     * LayerService and then self register on initialization.
     *
     * @memberof BingLayerService
     */
    AddLayer(layer) {
        const layerPromise = this._mapService.CreateLayer({ id: layer.Id });
        this._layers.set(layer.Id, layerPromise);
        layerPromise.then(l => l.SetVisible(layer.Visible));
    }
    /**
     * Adds a polygon to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygon.
     * @returns - A promise that when fullfilled contains the an instance of the Polygon model.
     *
     * @memberof BingLayerService
     */
    CreatePolygon(layer, options) {
        const p = this.GetLayerById(layer);
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            const locs = BingConversions.TranslatePaths(options.paths);
            const o = BingConversions.TranslatePolygonOptions(options);
            const poly = new Microsoft.Maps.Polygon(locs, o);
            const polygon = new BingPolygon(poly, this._mapService, l.NativePrimitve);
            if (options.metadata) {
                options.metadata.forEach((v, k) => polygon.Metadata.set(k, v));
            }
            if (options.title && options.title !== '') {
                polygon.Title = options.title;
            }
            if (options.showLabel != null) {
                polygon.ShowLabel = options.showLabel;
            }
            if (options.showTooltip != null) {
                polygon.ShowTooltip = options.showTooltip;
            }
            if (options.labelMaxZoom != null) {
                polygon.LabelMaxZoom = options.labelMaxZoom;
            }
            if (options.labelMinZoom != null) {
                polygon.LabelMinZoom = options.labelMinZoom;
            }
            l.AddEntity(polygon);
            return polygon;
        });
    }
    /**
     * Creates an array of unbound polygons. Use this method to create arrays of polygons to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygons.
     * @returns - A promise that when fullfilled contains the an arrays of the Polygon models.
     *
     * @memberof BingLayerService
     */
    CreatePolygons(layer, options) {
        const p = this.GetLayerById(layer);
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            const polygons = new Promise((resolve, reject) => {
                const polys = options.map(o => {
                    const locs = BingConversions.TranslatePaths(o.paths);
                    const op = BingConversions.TranslatePolygonOptions(o);
                    const poly = new Microsoft.Maps.Polygon(locs, op);
                    const polygon = new BingPolygon(poly, this._mapService, l.NativePrimitve);
                    if (o.title && o.title !== '') {
                        polygon.Title = o.title;
                    }
                    if (o.metadata) {
                        o.metadata.forEach((v, k) => polygon.Metadata.set(k, v));
                    }
                    return polygon;
                });
                resolve(polys);
            });
            return polygons;
        });
    }
    /**
     * Adds a polyline to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the line.
     * @param options - Polyline options defining the line.
     * @returns - A promise that when fullfilled contains the an instance of the Polyline (or an array
     * of polygons for complex paths) model.
     *
     * @memberof BingLayerService
     */
    CreatePolyline(layer, options) {
        const p = this.GetLayerById(layer);
        let polyline;
        let line;
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            const locs = BingConversions.TranslatePaths(options.path);
            const o = BingConversions.TranslatePolylineOptions(options);
            if (options.path && options.path.length > 0 && !Array.isArray(options.path[0])) {
                polyline = new Microsoft.Maps.Polyline(locs[0], o);
                line = new BingPolyline(polyline, this._mapService.MapInstance, l.NativePrimitve);
                l.AddEntity(line);
                if (options.metadata) {
                    options.metadata.forEach((v, k) => line.Metadata.set(k, v));
                }
                if (options.title && options.title !== '') {
                    line.Title = options.title;
                }
                if (options.showTooltip != null) {
                    line.ShowTooltip = options.showTooltip;
                }
                return line;
            }
            else {
                const lines = new Array();
                locs.forEach(x => {
                    polyline = new Microsoft.Maps.Polyline(x, o);
                    line = new BingPolyline(polyline, this._mapService.MapInstance, l.NativePrimitve);
                    l.AddEntity(line);
                    if (options.metadata) {
                        options.metadata.forEach((v, k) => line.Metadata.set(k, v));
                    }
                    if (options.title && options.title !== '') {
                        line.Title = options.title;
                    }
                    if (options.showTooltip != null) {
                        line.ShowTooltip = options.showTooltip;
                    }
                    lines.push(line);
                });
                return lines;
            }
        });
    }
    /**
     * Creates an array of unbound polylines. Use this method to create arrays of polylines to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polylines.
     * @param options - Polyline options defining the polylines.
     * @returns - A promise that when fullfilled contains the an arrays of the Polyline models.
     *
     * @memberof BingLayerService
     */
    CreatePolylines(layer, options) {
        const p = this.GetLayerById(layer);
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            const polylines = new Promise((resolve, reject) => {
                const polys = options.map(o => {
                    const locs = BingConversions.TranslatePaths(o.path);
                    const op = BingConversions.TranslatePolylineOptions(o);
                    if (locs && locs.length > 0 && !Array.isArray(locs[0])) {
                        const poly = new Microsoft.Maps.Polyline(locs[0], op);
                        const polyline = new BingPolyline(poly, this._mapService.MapInstance, l.NativePrimitve);
                        if (o.title && o.title !== '') {
                            polyline.Title = o.title;
                        }
                        if (o.metadata) {
                            o.metadata.forEach((v, k) => polyline.Metadata.set(k, v));
                        }
                        return polyline;
                    }
                    else {
                        const lines = new Array();
                        locs.forEach(x => {
                            const poly = new Microsoft.Maps.Polyline(x, op);
                            const polyline = new BingPolyline(poly, this._mapService.MapInstance, l.NativePrimitve);
                            if (o.metadata) {
                                o.metadata.forEach((v, k) => polyline.Metadata.set(k, v));
                            }
                            if (o.title && o.title !== '') {
                                polyline.Title = o.title;
                            }
                            lines.push(polyline);
                        });
                        return lines;
                    }
                });
                resolve(polys);
            });
            return polylines;
        });
    }
}
BingLayerService.decorators = [
    { type: Injectable }
];
BingLayerService.ctorParameters = () => [
    { type: MapService },
    { type: NgZone }
];

/**
 * Implements the {@link ClusterService} contract for a  Bing Maps V8 specific implementation.
 *
 * @export
 */
class BingClusterService extends BingLayerBase {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingClusterService.
     * @param _mapService - Concrete {@link MapService} implementation for Bing Maps V8. An instance of {@link BingMapService}.
     * @param _zone - NgZone instance to provide zone aware promises.
     *
     * @memberof BingClusterService
     */
    constructor(_mapService, _zone) {
        super(_mapService, _zone);
    }
    ///
    /// Public methods
    ///
    /**
     * Adds a layer to the map.
     *
     * @abstract
     * @param layer - ClusterLayerDirective component object.
     * Generally, MapLayer will be injected with an instance of the
     * LayerService and then self register on initialization.
     *
     * @memberof BingClusterService
     */
    AddLayer(layer) {
        const options = {
            id: layer.Id,
            visible: layer.Visible,
            clusteringEnabled: layer.ClusteringEnabled,
            placementMode: layer.ClusterPlacementMode
        };
        if (layer.GridSize) {
            options.gridSize = layer.GridSize;
        }
        if (layer.LayerOffset) {
            options.layerOffset = layer.LayerOffset;
        }
        if (layer.ZIndex) {
            options.zIndex = layer.ZIndex;
        }
        if (layer.IconInfo) {
            options.clusteredPinCallback = (pin) => { this.CreateClusterPushPin(pin, layer); };
        }
        if (layer.CustomMarkerCallback) {
            options.clusteredPinCallback = (pin) => { this.CreateCustomClusterPushPin(pin, layer); };
        }
        if (layer.SpiderClusterOptions) {
            options.spiderClusterOptions = layer.SpiderClusterOptions;
        }
        const layerPromise = this._mapService.CreateClusterLayer(options);
        this._mapService.MapPromise.then(m => {
            Microsoft.Maps.Events.addHandler(m, 'viewchangeend', (e) => {
                if (layer.ClusteringEnabled && m.getZoom() === 19) {
                    layerPromise.then((l) => {
                        l.SetOptions({ id: layer.Id, clusteringEnabled: false });
                    });
                }
                if (layer.ClusteringEnabled && m.getZoom() < 19) {
                    layerPromise.then((l) => {
                        if (!l.GetOptions().clusteringEnabled) {
                            l.SetOptions({ id: layer.Id, clusteringEnabled: true });
                        }
                    });
                }
            });
        });
        this._layers.set(layer.Id, layerPromise);
    }
    /**
     * Adds a polygon to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygon.
     * @returns - A promise that when fullfilled contains the an instance of the Polygon model.
     *
     * @memberof BingClusterService
     */
    CreatePolygon(layer, options) {
        throw (new Error('Polygons are not supported in clustering layers. You can only use markers.'));
    }
    /**
     * Creates an array of unbound polygons. Use this method to create arrays of polygons to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygons.
     * @returns - A promise that when fullfilled contains the an arrays of the Polygon models.
     *
     * @memberof BingClusterService
     */
    CreatePolygons(layer, options) {
        throw (new Error('Polygons are not supported in clustering layers. You can only use markers.'));
    }
    /**
     * Adds a polyline to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the line.
     * @param options - Polyline options defining the line.
     * @returns - A promise that when fullfilled contains the an instance of the Polyline (or an array
     * of polygons for complex paths) model.
     *
     * @memberof BingClusterService
     */
    CreatePolyline(layer, options) {
        throw (new Error('Polylines are not supported in clustering layers. You can only use markers.'));
    }
    /**
     * Creates an array of unbound polylines. Use this method to create arrays of polylines to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polylines.
     * @param options - Polyline options defining the polylines.
     * @returns - A promise that when fullfilled contains the an arrays of the Polyline models.
     *
     * @memberof BingClusterService
     */
    CreatePolylines(layer, options) {
        throw (new Error('Polylines are not supported in clustering layers. You can only use markers.'));
    }
    /**
     * Start to actually cluster the entities in a cluster layer. This method should be called after the initial set of entities
     * have been added to the cluster. This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @param layer - ClusterLayerDirective component object for which to retrieve the layer.
     *
     * @memberof BingClusterService
     */
    StartClustering(layer) {
        const l = this._layers.get(layer.Id);
        if (l == null) {
            return Promise.resolve();
        }
        return l.then((l1) => {
            return this._zone.run(() => {
                l1.StartClustering();
            });
        });
    }
    /**
     * Stop to actually cluster the entities in a cluster layer.
     * This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @param layer - ClusterLayerDirective component object for which to retrieve the layer.
     *
     * @memberof BingClusterService
     */
    StopClustering(layer) {
        const l = this._layers.get(layer.Id);
        if (l == null) {
            return Promise.resolve();
        }
        return l.then((l1) => {
            return this._zone.run(() => {
                l1.StopClustering();
            });
        });
    }
    ///
    /// Private methods
    ///
    /**
     * Creates the default cluster pushpin as a callback from BingMaps when clustering occurs. The {@link ClusterLayerDirective} model
     * can provide an IconInfo property that would govern the apparenace of the pin. This method will assign the same pin to all
     * clusters in the layer.
     *
     * @param cluster - The cluster for which to create the pushpin.
     * @param layer - The {@link ClusterLayerDirective} component representing the layer.
     *
     * @memberof BingClusterService
     */
    CreateClusterPushPin(cluster, layer) {
        this._layers.get(layer.Id).then((l) => {
            if (layer.IconInfo) {
                const o = {};
                const payload = (ico, info) => {
                    o.icon = ico;
                    o.anchor = new Microsoft.Maps.Point((info.size && info.markerOffsetRatio) ? (info.size.width * info.markerOffsetRatio.x) : 0, (info.size && info.markerOffsetRatio) ? (info.size.height * info.markerOffsetRatio.y) : 0);
                    cluster.setOptions(o);
                };
                const icon = Marker.CreateMarker(layer.IconInfo);
                if (typeof (icon) === 'string') {
                    payload(icon, layer.IconInfo);
                }
                else {
                    icon.then(x => {
                        payload(x.icon, x.iconInfo);
                    });
                }
            }
            if (layer.ClusterClickAction === ClusterClickAction.ZoomIntoCluster) {
                Microsoft.Maps.Events.addHandler(cluster, 'click', (e) => this.ZoomIntoCluster(e));
            }
            if (layer.ClusterClickAction === ClusterClickAction.Spider) {
                Microsoft.Maps.Events.addHandler(cluster, 'dblclick', (e) => this.ZoomIntoCluster(e));
                l.InitializeSpiderClusterSupport();
            }
        });
    }
    /**
     * Provides a hook for consumers to provide a custom function to create cluster bins for a cluster. This is particuarily useful
     * in situation where the pin should differ to represent information about the pins in the cluster.
     *
     * @param cluster - The cluster for which to create the pushpin.
     * @param layer - The {@link ClusterLayerDirective} component
     * representing the layer. Set the {@link ClusterLayerDirective.CustomMarkerCallback}
     * property to define the callback generating the pin.
     *
     * @memberof BingClusterService
     */
    CreateCustomClusterPushPin(cluster, layer) {
        this._layers.get(layer.Id).then((l) => {
            // assemble markers for callback
            const m = new Array();
            cluster.containedPushpins.forEach(p => {
                const marker = l.GetMarkerFromBingMarker(p);
                if (marker) {
                    m.push(marker);
                }
            });
            const iconInfo = { markerType: MarkerTypeId.None };
            const o = {};
            o.icon = layer.CustomMarkerCallback(m, iconInfo);
            if (o.icon !== '') {
                o.anchor = new Microsoft.Maps.Point((iconInfo.size && iconInfo.markerOffsetRatio) ? (iconInfo.size.width * iconInfo.markerOffsetRatio.x) : 0, (iconInfo.size && iconInfo.markerOffsetRatio) ? (iconInfo.size.height * iconInfo.markerOffsetRatio.y) : 0);
                if (iconInfo.textOffset) {
                    o.textOffset = new Microsoft.Maps.Point(iconInfo.textOffset.x, iconInfo.textOffset.y);
                }
                cluster.setOptions(o);
            }
            if (layer.ClusterClickAction === ClusterClickAction.ZoomIntoCluster) {
                Microsoft.Maps.Events.addHandler(cluster, 'click', (e) => this.ZoomIntoCluster(e));
            }
            if (layer.ClusterClickAction === ClusterClickAction.Spider) {
                Microsoft.Maps.Events.addHandler(cluster, 'dblclick', (e) => this.ZoomIntoCluster(e));
                l.InitializeSpiderClusterSupport();
            }
        });
    }
    /**
     * Zooms into the cluster on click so that the members of the cluster comfortable fit into the zommed area.
     *
     * @param e - Mouse Event.
     *
     * @memberof BingClusterService
     */
    ZoomIntoCluster(e) {
        const pin = e.target;
        if (pin && pin.containedPushpins) {
            let bounds;
            const locs = new Array();
            pin.containedPushpins.forEach(p => locs.push(p.getLocation()));
            bounds = Microsoft.Maps.LocationRect.fromLocations(locs);
            // Zoom into the bounding box of the cluster.
            // Add a padding to compensate for the pixel area of the pushpins.
            this._mapService.MapPromise.then((m) => {
                m.setView({ bounds: bounds, padding: 75 });
            });
        }
    }
}
BingClusterService.decorators = [
    { type: Injectable }
];
BingClusterService.ctorParameters = () => [
    { type: MapService },
    { type: NgZone }
];

/**
 * Concrete implementation of the Polygon Service abstract class for Bing Maps V8.
 *
 * @export
 */
class BingPolygonService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingPolygonService.
     * @param _mapService - {@link MapService} instance. The concrete {@link BingMapService} implementation is expected.
     * @param _layerService - {@link BingLayerService} instance.
     * The concrete {@link BingLayerService} implementation is expected.
     * @param _zone - NgZone instance to support zone aware promises.
     *
     * @memberof BingPolygonService
     */
    constructor(_mapService, _layerService, _zone) {
        this._mapService = _mapService;
        this._layerService = _layerService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._polygons = new Map();
    }
    /**
     * Adds a polygon to a map. Depending on the polygon context, the polygon will either by added to the map or a
     * correcsponding layer.
     *
     * @param polygon - The {@link MapPolygonDirective} to be added.
     *
     * @memberof BingPolygonService
     */
    AddPolygon(polygon) {
        const o = {
            id: polygon.Id,
            clickable: polygon.Clickable,
            draggable: polygon.Draggable,
            editable: polygon.Editable,
            fillColor: polygon.FillColor,
            fillOpacity: polygon.FillOpacity,
            geodesic: polygon.Geodesic,
            labelMaxZoom: polygon.LabelMaxZoom,
            labelMinZoom: polygon.LabelMinZoom,
            paths: polygon.Paths,
            showLabel: polygon.ShowLabel,
            showTooltip: polygon.ShowTooltip,
            strokeColor: polygon.StrokeColor,
            strokeOpacity: polygon.StrokeOpacity,
            strokeWeight: polygon.StrokeWeight,
            title: polygon.Title,
            visible: polygon.Visible,
            zIndex: polygon.zIndex,
        };
        let polygonPromise;
        if (polygon.InCustomLayer) {
            polygonPromise = this._layerService.CreatePolygon(polygon.LayerId, o);
        }
        else {
            polygonPromise = this._mapService.CreatePolygon(o);
        }
        this._polygons.set(polygon, polygonPromise);
    }
    /**
      * Registers an event delegate for a polygon.
      *
      * @param eventName - The name of the event to register (e.g. 'click')
      * @param polygon - The {@link MapPolygonDirective} for which to register the event.
      * @returns - Observable emiting an instance of T each time the event occurs.
      *
      * @memberof BingPolygonService
      */
    CreateEventObservable(eventName, polygon) {
        const b = new Subject();
        if (eventName === 'mousemove') {
            return b.asObservable();
        }
        if (eventName === 'rightclick') {
            return b.asObservable();
        }
        ///
        /// mousemove and rightclick are not supported by bing polygons.
        ///
        return Observable.create((observer) => {
            this._polygons.get(polygon).then((p) => {
                p.AddListener(eventName, (e) => this._zone.run(() => observer.next(e)));
            });
        });
    }
    /**
      * Deletes a polygon.
      *
      * @param polygon - {@link MapPolygonDirective} to be deleted.
      * @returns - A promise fullfilled once the polygon has been deleted.
      *
      * @memberof BingPolygonService
      */
    DeletePolygon(polygon) {
        const m = this._polygons.get(polygon);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then((l) => {
            return this._zone.run(() => {
                l.Delete();
                this._polygons.delete(polygon);
            });
        });
    }
    /**
     * Obtains geo coordinates for the polygon on the click location
     *
     * @abstract
     * @param e - The mouse event. Expected to implement {@link Microsoft.Maps.IMouseEventArgs}.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     *
     * @memberof BingPolygonService
     */
    GetCoordinatesFromClick(e) {
        const x = e;
        return { latitude: x.location.latitude, longitude: x.location.longitude };
    }
    /**
     * Obtains the polygon model for the polygon allowing access to native implementation functionatiliy.
     *
     * @param polygon - The {@link MapPolygonDirective} for which to obtain the polygon model.
     * @returns - A promise that when fullfilled contains the {@link Polygon} implementation of the underlying platform.
     *
     * @memberof BingPolygonService
     */
    GetNativePolygon(polygon) {
        return this._polygons.get(polygon);
    }
    /**
     * Set the polygon options.
     *
     * @param polygon - {@link MapPolygonDirective} to be updated.
     * @param options - {@link IPolygonOptions} object containing the options. Options will be merged with the
     * options already on the underlying object.
     * @returns - A promise fullfilled once the polygon options have been set.
     *
     * @memberof BingPolygonService
     */
    SetOptions(polygon, options) {
        return this._polygons.get(polygon).then((l) => { l.SetOptions(options); });
    }
    /**
     * Updates the Polygon path
     *
     * @param polygon - {@link MapPolygonDirective} to be updated.
     * @returns - A promise fullfilled once the polygon has been updated.
     *
     * @memberof BingPolygonService
     */
    UpdatePolygon(polygon) {
        const m = this._polygons.get(polygon);
        if (m == null || polygon.Paths == null || !Array.isArray(polygon.Paths) || polygon.Paths.length === 0) {
            return Promise.resolve();
        }
        return m.then((l) => {
            if (Array.isArray(polygon.Paths[0])) {
                l.SetPaths(polygon.Paths);
            }
            else {
                l.SetPath(polygon.Paths);
            }
        });
    }
}
BingPolygonService.decorators = [
    { type: Injectable }
];
BingPolygonService.ctorParameters = () => [
    { type: MapService },
    { type: LayerService },
    { type: NgZone }
];

/**
 * Concrete implementation of the Polyline Service abstract class for Bing Maps V8.
 *
 * @export
 */
class BingPolylineService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingPolylineService.
     * @param _mapService - {@link MapService} instance. The concrete {@link BingMapService} implementation is expected.
     * @param _layerService - {@link LayerService} instance.
     * The concrete {@link BingLayerService} implementation is expected.
     * @param _zone - NgZone instance to support zone aware promises.
     *
     * @memberof BingPolylineService
     */
    constructor(_mapService, _layerService, _zone) {
        this._mapService = _mapService;
        this._layerService = _layerService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._polylines = new Map();
    }
    ///
    /// Public members and MarkerService implementation
    ///
    /**
     * Adds a polyline to a map. Depending on the polyline context, the polyline will either by added to the map or a
     * corresponding layer.
     *
     * @param polyline - The {@link MapPolylineDirective} to be added.
     *
     * @memberof BingPolylineService
     */
    AddPolyline(polyline) {
        const o = {
            id: polyline.Id,
            clickable: polyline.Clickable,
            draggable: polyline.Draggable,
            editable: polyline.Editable,
            geodesic: polyline.Geodesic,
            path: polyline.Path,
            showTooltip: polyline.ShowTooltip,
            strokeColor: polyline.StrokeColor,
            strokeOpacity: polyline.StrokeOpacity,
            strokeWeight: polyline.StrokeWeight,
            title: polyline.Title,
            visible: polyline.Visible,
            zIndex: polyline.zIndex,
        };
        let polylinePromise;
        if (polyline.InCustomLayer) {
            polylinePromise = this._layerService.CreatePolyline(polyline.LayerId, o);
        }
        else {
            polylinePromise = this._mapService.CreatePolyline(o);
        }
        this._polylines.set(polyline, polylinePromise);
    }
    /**
      * Registers an event delegate for a line.
      *
      * @param eventName - The name of the event to register (e.g. 'click')
      * @param polyline - The {@link MapPolylineDirective} for which to register the event.
      * @returns - Observable emiting an instance of T each time the event occurs.
      *
      * @memberof BingPolylineService
      */
    CreateEventObservable(eventName, polyline) {
        const b = new Subject();
        if (eventName === 'mousemove') {
            return b.asObservable();
        }
        if (eventName === 'rightclick') {
            return b.asObservable();
        }
        ///
        /// mousemove and rightclick are not supported by bing polygons.
        ///
        return Observable.create((observer) => {
            this._polylines.get(polyline).then(p => {
                const x = Array.isArray(p) ? p : [p];
                x.forEach(line => line.AddListener(eventName, (e) => this._zone.run(() => observer.next(e))));
            });
        });
    }
    /**
      * Deletes a polyline.
      *
      * @param polyline - {@link MapPolylineDirective} to be deleted.
      * @returns - A promise fullfilled once the polyline has been deleted.
      *
      * @memberof BingPolylineService
      */
    DeletePolyline(polyline) {
        const m = this._polylines.get(polyline);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then((l) => {
            return this._zone.run(() => {
                const x = Array.isArray(l) ? l : [l];
                x.forEach(line => line.Delete());
                this._polylines.delete(polyline);
            });
        });
    }
    /**
     * Obtains geo coordinates for the marker on the click location
     *
     * @abstract
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     *
     * @memberof BingPolylineService
     */
    GetCoordinatesFromClick(e) {
        if (!e) {
            return null;
        }
        if (!e.location) {
            return null;
        }
        return { latitude: e.location.latitude, longitude: e.location.longitude };
    }
    /**
     * Obtains the marker model for the marker allowing access to native implementation functionatiliy.
     *
     * @param polyline - The {@link MapPolylineDirective} for which to obtain the polyline model.
     * @returns - A promise that when fullfilled contains the {@link Polyline}
     * implementation of the underlying platform. For complex paths, returns an array of polylines.
     *
     * @memberof BingPolylineService
     */
    GetNativePolyline(polyline) {
        return this._polylines.get(polyline);
    }
    /**
     * Set the polyline options.
     *
     * @param polyline - {@link MapPolylineDirective} to be updated.
     * @param options - {@link IPolylineOptions} object containing the options. Options will be merged with the
     * options already on the underlying object.
     * @returns - A promise fullfilled once the polyline options have been set.
     *
     * @memberof BingPolylineService
     */
    SetOptions(polyline, options) {
        return this._polylines.get(polyline).then(l => {
            const x = Array.isArray(l) ? l : [l];
            x.forEach(line => line.SetOptions(options));
        });
    }
    /**
     * Updates the Polyline path
     *
     * @param polyline - {@link MapPolylineDirective} to be updated.
     * @returns - A promise fullfilled once the polyline has been updated.
     *
     * @memberof BingPolylineService
     */
    UpdatePolyline(polyline) {
        const m = this._polylines.get(polyline);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then(l => this._zone.run(() => {
            const x = Array.isArray(l) ? l : [l];
            const p = polyline.Path.length > 0 && Array.isArray(polyline.Path[0]) ? polyline.Path :
                [polyline.Path];
            x.forEach((line, index) => {
                if (p.length > index) {
                    line.SetPath(p[index]);
                }
            });
            if (Array.isArray(l) && l.length > p.length) {
                l.splice(p.length - 1).forEach(line => line.Delete());
            }
        }));
    }
}
BingPolylineService.decorators = [
    { type: Injectable }
];
BingPolylineService.ctorParameters = () => [
    { type: MapService },
    { type: LayerService },
    { type: NgZone }
];

/**
 * Implements a factory to create thre necessary Bing Maps V8 specific service instances.
 *
 * @export
 */
class BingMapServiceFactory {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of BingMapServiceFactory.
     * @param _loader - {@link MapAPILoader} implementation for the Bing Map V8 provider.
     * @param _zone - NgZone object to implement zone aware promises.
     *
     * @memberof BingMapServiceFactory
     */
    constructor(_loader, _zone) {
        this._loader = _loader;
        this._zone = _zone;
    }
    ///
    /// Public methods and MapServiceFactory implementation.
    ///
    /**
     * Creates the map service for the Bing Maps V8 implementation.
     *
     * @returns - {@link MapService}. A concreted instance of the {@link BingMapService}.
     *
     * @memberof BingMapServiceFactory
     */
    Create() {
        return new BingMapService(this._loader, this._zone);
    }
    /**
     * Creates the cluster service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link BingMapService}.
     * @returns - {@link ClusterService}. A concreted instance of the {@link BingClusterService}.
     *
     * @memberof BingMapServiceFactory
     */
    CreateClusterService(_mapService) {
        return new BingClusterService(_mapService, this._zone);
    }
    /**
     * Creates thh info box service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link BingMapService}.
     * @returns - {@link InfoBoxService}. A concreted instance of the {@link BingInfoBoxService}.
     *
     * @memberof BingMapServiceFactory
     */
    CreateInfoBoxService(_mapService) {
        return new BingInfoBoxService(_mapService, this._zone);
    }
    /**
     * Creates the layer service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link BingMapService}.
     * @returns - {@link LayerService}. A concreted instance of the {@link BingLayerService}.
     *
     * @memberof BingMapServiceFactory
     */
    CreateLayerService(_mapService) {
        return new BingLayerService(_mapService, this._zone);
    }
    /**
     * Creates the marker service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link BingMapService}.
     * @param layers - {@link LayerService}. A concreted instance of the {@link BingLayerService}.
     * @param clusters  - {@link ClusterService}. A concreted instance of the {@link BingClusterService}.
     * @returns - {@link MarkerService}. A concreted instance of the {@link BingMarkerService}.
     *
     * @memberof BingMapServiceFactory
     */
    CreateMarkerService(_mapService, _layerService, _clusterService) {
        return new BingMarkerService(_mapService, _layerService, _clusterService, this._zone);
    }
    /**
     * Creates the polygon service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService} implementation for thh underlying map archticture.
     * @param layers - {@link LayerService} implementation for the underlying map architecture.
     * @returns - {@link PolygonService} implementation for the underlying map architecture.
     *
     * @memberof MapServiceFactory
     */
    CreatePolygonService(map, layers) {
        return new BingPolygonService(map, layers, this._zone);
    }
    /**
     * Creates the polyline service for the Bing Maps V8 implementation.
     *
     * @param map - {@link MapService} implementation for thh underlying map archticture.
     * @param layers - {@link LayerService} implementation for the underlying map architecture.
     * @returns - {@link PolylineService} implementation for the underlying map architecture.
     *
     * @memberof MapServiceFactory
     */
    CreatePolylineService(map, layers) {
        return new BingPolylineService(map, layers, this._zone);
    }
}
BingMapServiceFactory.decorators = [
    { type: Injectable }
];
BingMapServiceFactory.ctorParameters = () => [
    { type: MapAPILoader },
    { type: NgZone }
];
/**
 * Creates a new instance of a plaform specific MapServiceFactory.
 *
 * @export
 * @param apiLoader - An {@link MapAPILoader} instance. This is expected to the a {@link BingMapAPILoader}.
 * @param zone - An NgZone instance to provide zone aware promises.
 *
 * @returns -  A {@link MapServiceFactory} instance.
 */
function BingMapServiceFactoryFactory(apiLoader, zone) {
    return new BingMapServiceFactory(apiLoader, zone);
}
/**
 * Creates a new instance of a plaform specific MapLoaderFactory.
 *
 * @export
 * @returns - A {@link MapAPILoader} instance.
 */
function BingMapLoaderFactory() {
    return new BingMapAPILoader(new BingMapAPILoaderConfig(), new WindowRef(), new DocumentRef());
}

/**
 * This abstract partially implements the contract for the {@link LayerService}
 * and {@link ClusterService} for the Google Maps archtiecture. It serves
 * as the base class for basic layer ({@link GoogleLayerService}) and cluster layer ({@link GoogleClusterLayer}).
 *
 * @export
 * @abstract
 */
class GoogleLayerBase {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GoogleLayerBase.
     * @param _mapService - Concrete {@link MapService} implementation for Google Maps.
     * An instance of {@link GoogleMapService}.
     * @param _zone - NgZone instance to provide zone aware promises.
     *
     * @memberof GoogleLayerBase
     */
    constructor(_mapService, _zone) {
        this._mapService = _mapService;
        this._zone = _zone;
    }
    /**
     * Deletes the layer
     *
     * @param layer - MapLayerDirective component object for which to retrieve the layer.
     * @returns - A promise that is fullfilled when the layer has been removed.
     *
     * @memberof GoogleLayerBase
     */
    DeleteLayer(layer) {
        const l = this._layers.get(layer.Id);
        if (l == null) {
            return Promise.resolve();
        }
        return l.then((l1) => {
            return this._zone.run(() => {
                l1.Delete();
                this._layers.delete(layer.Id);
            });
        });
    }
    /**
     * Returns the Layer model represented by this layer.
     *
     * @param layer - MapLayerDirective component object or layer id for which to retrieve the layer model.
     * @returns - A promise that when resolved contains the Layer model.
     *
     * @memberof GoogleLayerBase
     */
    GetNativeLayer(layer) {
        let p = null;
        if (typeof (layer) === 'number') {
            p = this._layers.get(layer);
        }
        else {
            p = this._layers.get(layer.Id);
        }
        return p;
    }
    /**
     * Creates a marker in the layer.
     *
     * @param layer - The Id of the layer in which to create the marker.
     * @param options - {@link IMarkerOptions} object containing the marker properties.
     * @returns - A promise that when fullfilled contains the {@link Marker} model for the created marker.
     *
     * @memberof GoogleLayerBase
     */
    CreateMarker(layer, options) {
        const mp = this._mapService.MapPromise;
        const lp = this._layers.get(layer);
        return Promise.all([mp, lp]).then(([map, l]) => {
            const payload = (x) => {
                const marker = new google.maps.Marker(x);
                if (options.metadata) {
                    options.metadata.forEach((val, key) => marker.Metadata.set(key, val));
                }
                marker.setMap(map);
                const m = new GoogleMarker(marker);
                m.IsFirst = options.isFirst;
                m.IsLast = options.isLast;
                if (options.metadata) {
                    options.metadata.forEach((val, key) => m.Metadata.set(key, val));
                }
                l.AddEntity(m);
                return m;
            };
            const o = GoogleConversions.TranslateMarkerOptions(options);
            if (options.iconInfo && options.iconInfo.markerType) {
                const s = Marker.CreateMarker(options.iconInfo);
                if (typeof (s) === 'string') {
                    o.icon = s;
                    return payload(o);
                }
                else {
                    return s.then(x => {
                        o.icon = x.icon;
                        return payload(o);
                    });
                }
            }
            else {
                return payload(o);
            }
        });
    }
    /**
     * Creates an array of unbound markers. Use this method to create arrays of markers to be used in bulk
     * operations.
     *
     * @param options - Marker options defining the markers.
     * @param markerIcon - Optional information to generate custom markers. This will be applied to all markers.
     * @returns - A promise that when fullfilled contains the an arrays of the Marker models.
     *
     * @memberof GoogleLayerBase
     */
    CreateMarkers(options, markerIcon) {
        const payload = (icon) => {
            const markers = options.map(mo => {
                const o = GoogleConversions.TranslateMarkerOptions(mo);
                if (icon && icon !== '') {
                    o.icon = icon;
                }
                const pushpin = new google.maps.Marker(o);
                const marker = new GoogleMarker(pushpin);
                marker.IsFirst = mo.isFirst;
                marker.IsLast = mo.isLast;
                if (mo.metadata) {
                    mo.metadata.forEach((val, key) => marker.Metadata.set(key, val));
                }
                return marker;
            });
            return markers;
        };
        const p = new Promise((resolve, reject) => {
            if (markerIcon && markerIcon.markerType) {
                const s = Marker.CreateMarker(markerIcon);
                if (typeof (s) === 'string') {
                    resolve(payload(s));
                }
                else {
                    return s.then(x => {
                        resolve(payload(x.icon));
                    });
                }
            }
            else {
                resolve(payload(null));
            }
        });
        return p;
    }
    ///
    /// Protected methods
    ///
    /**
     * Gets the layer based on its id.
     *
     * @protected
     * @param id - Layer Id.
     * @returns - A promise that when fullfilled contains the {@link Layer} model for the layer.
     *
     * @memberof GoogleLayerBase
     */
    GetLayerById(id) {
        let p;
        this._layers.forEach((l, k) => { if (k === id) {
            p = l;
        } });
        return p;
    }
}

class GoogleClusterService extends GoogleLayerBase {
    ///
    /// Constructors
    ///
    /**
     * Creates an instance of GoogleClusterService.
     * @param _mapService
     * @param _zone
     * @memberof GoogleClusterService
     */
    constructor(_mapService, _zone) {
        super(_mapService, _zone);
        ///
        /// Field declarations
        ///
        this._layers = new Map();
        this._layerStyles = new Map();
    }
    ///
    /// Static methods
    ///
    /**
     * Creates the cluster icon from the styles
     *
     * @param styles
     * @returns - Promise that when resolved contains an Array of IClusterIconInfo objects
     * containing the hydrated cluster icons.
     * @memberof GoogleClusterService
     */
    static CreateClusterIcons(styles) {
        const i = new Promise((resolve, reject) => {
            const pa = new Array();
            styles.forEach((style, index) => {
                if (style.iconInfo) {
                    const s = Marker.CreateMarker(style.iconInfo);
                    if (typeof (s) === 'string') {
                        style.url = s;
                        if (style.width == null) {
                            style.width = style.iconInfo.size.width;
                            style.height = style.iconInfo.size.height;
                        }
                        if (style.iconInfo.markerOffsetRatio && style.iconInfo.size && style.anchor == null) {
                            const o = style.iconInfo;
                            style.anchor = [
                                o.size.width * o.markerOffsetRatio.x,
                                o.size.height * o.markerOffsetRatio.y
                            ];
                        }
                        delete style.iconInfo;
                    }
                    else {
                        s.then(x => {
                            style.url = x.icon;
                            if (style.width == null) {
                                style.width = x.iconInfo.size.width;
                                style.height = x.iconInfo.size.height;
                            }
                            if (x.iconInfo.markerOffsetRatio && x.iconInfo.size && style.anchor == null) {
                                const o = x.iconInfo;
                                style.anchor = [
                                    o.size.width * o.markerOffsetRatio.x,
                                    o.size.height * o.markerOffsetRatio.y
                                ];
                            }
                            delete style.iconInfo;
                        });
                        pa.push(s);
                    }
                }
            });
            if (pa.length === 0) {
                resolve(styles);
            }
            else {
                Promise.all(pa).then(() => {
                    resolve(styles);
                });
            }
        });
        return i;
    }
    /**
     * Adds the cluster layer to the map
     *
     * @param layer
     * @memberof GoogleClusterService
     */
    AddLayer(layer) {
        const options = {
            id: layer.Id,
            visible: layer.Visible,
            clusteringEnabled: layer.ClusteringEnabled,
            zoomOnClick: layer.ClusterClickAction === ClusterClickAction.ZoomIntoCluster
        };
        if (layer.GridSize) {
            options.gridSize = layer.GridSize;
        }
        if (layer.MinimumClusterSize) {
            options.minimumClusterSize = layer.MinimumClusterSize;
        }
        if (layer.Styles) {
            options.styles = layer.Styles;
        }
        if (layer.UseDynamicSizeMarkers) {
            options.styles = null;
            // do not to attempt to setup styles here as the dynamic call back will generate them.
        }
        else {
            options.styles = [{
                    height: 30,
                    width: 35,
                    textColor: 'white',
                    textSize: 11,
                    backgroundPosition: 'center',
                    iconInfo: {
                        markerType: MarkerTypeId.FontMarker,
                        fontName: 'FontAwesome',
                        fontSize: 30,
                        color: 'green',
                        text: '\uF111'
                    }
                }];
        }
        const dynamicClusterCallback = (markers, numStyles, clusterer) => {
            // dynamically ensure that the necessary style for this cluster icon exists and
            // the clusterer is already hooked up to the styles array via pointer, so we only
            // need to update the style. Since the clusterer re-renders a cluster icon is the
            // the marker count changes, we will only need to retain the current icon as opposed
            // to all cluster icon.
            const styles = this._layerStyles.get(layer.Id);
            const iconInfo = {
                markerType: MarkerTypeId.None
            };
            const icon = layer.CustomMarkerCallback(markers, iconInfo);
            styles[0] = {
                url: `\"data:image/svg+xml;utf8,${icon}\"`,
                height: iconInfo.size.height,
                width: iconInfo.size.width,
                textColor: 'white',
                textSize: 11,
                backgroundPosition: 'center',
            };
            return {
                text: markers.length.toString(),
                index: 1
            };
        };
        const resetStyles = (clusterer) => {
            if (this._layerStyles.has(layer.Id)) {
                this._layerStyles.get(layer.Id).splice(0);
            }
            else {
                const styles = new Array();
                styles.push({});
                this._layerStyles.set(layer.Id, styles);
                clusterer.setStyles(styles);
                // this is important for dynamic styles as the pointer to this array gets passed
                // around key objects in the clusterer. Therefore, it must be initialized here in order for
                // updates to the styles to be visible.
                // also, we need to add at least one style to prevent the default styles from being picked up.
            }
        };
        const layerPromise = this._mapService.CreateClusterLayer(options);
        this._layers.set(layer.Id, layerPromise);
        layerPromise.then(l => {
            const clusterer = l.NativePrimitve;
            if (options.styles) {
                const s = GoogleClusterService.CreateClusterIcons(options.styles);
                s.then(x => {
                    clusterer.setStyles(x);
                });
            }
            else {
                resetStyles(clusterer);
                this._mapService.MapPromise.then((m) => {
                    m.addListener('zoom_changed', () => {
                        resetStyles(clusterer);
                    });
                });
                clusterer.setCalculator((m, n) => {
                    return dynamicClusterCallback(m, n, clusterer);
                });
            }
        });
    }
    /**
     * Create a marker in the cluster
     *
     * @param layer
     * @param options
     * @memberof GoogleClusterService
     */
    CreateMarker(layer, options) {
        const p = this.GetLayerById(layer);
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            return this._mapService.CreateMarker(options)
                .then((marker) => {
                marker.IsFirst = options.isFirst;
                marker.IsLast = options.isLast;
                l.AddEntity(marker);
                return marker;
            });
        });
    }
    /**
     * Starts the clustering
     *
     * @param layer
     * @memberof GoogleClusterService
     */
    StartClustering(layer) {
        return Promise.resolve();
    }
    /**
     * Stops the clustering
     *
     * @param layer
     * @memberof GoogleClusterService
     */
    StopClustering(layer) {
        return Promise.resolve();
    }
    /**
     * Adds a polygon to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygon.
     * @returns - A promise that when fullfilled contains the an instance of the Polygon model.
     *
     * @memberof GoogleClusterService
     */
    CreatePolygon(layer, options) {
        throw (new Error('Polygons are not supported in clustering layers. You can only use markers.'));
    }
    /**
     * Creates an array of unbound polygons. Use this method to create arrays of polygons to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygons.
     * @returns - A promise that when fullfilled contains the an arrays of the Polygon models.
     *
     * @memberof GoogleClusterService
     */
    CreatePolygons(layer, options) {
        throw (new Error('Polygons are not supported in clustering layers. You can only use markers.'));
    }
    /**
     * Adds a polyline to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the line.
     * @param options - Polyline options defining the line.
     * @returns - A promise that when fullfilled contains the an instance of the Polyline (or an
     * array of polygons for complex paths) model.
     *
     * @memberof GoogleClusterService
     */
    CreatePolyline(layer, options) {
        throw (new Error('Polylines are not supported in clustering layers. You can only use markers.'));
    }
    /**
     * Creates an array of unbound polylines. Use this method to create arrays of polylines to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polylines.
     * @param options - Polyline options defining the polylines.
     * @returns - A promise that when fullfilled contains the an arrays of the Polyline models.
     *
     * @memberof GoogleClusterService
     */
    CreatePolylines(layer, options) {
        throw (new Error('Polylines are not supported in clustering layers. You can only use markers.'));
    }
}
GoogleClusterService.decorators = [
    { type: Injectable }
];
GoogleClusterService.ctorParameters = () => [
    { type: MapService },
    { type: NgZone }
];

class GoogleInfoBoxService extends InfoBoxService {
    ///
    /// Constructors
    ///
    /**
     * Creates an instance of GoogleInfoBoxService.
     * @param _mapService
     * @param _markerService
     * @param _zone
     *
     * @memberof GoogleInfoBoxService
     */
    constructor(_mapService, _markerService, _zone) {
        super();
        this._mapService = _mapService;
        this._markerService = _markerService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._boxes = new Map();
    }
    /**
     * Creates a new instance of an info window
     *
     * @param info
     *
     * @memberof GoogleInfoBoxService
     */
    AddInfoWindow(info) {
        const options = {};
        if (info.HtmlContent !== '') {
            options.htmlContent = info.HtmlContent;
        }
        else {
            options.title = info.Title;
            options.description = info.Description;
        }
        if (info.xOffset || info.yOffset) {
            if (options.pixelOffset == null) {
                options.pixelOffset = { x: 0, y: 0 };
            }
            if (info.xOffset) {
                options.pixelOffset.x = info.xOffset;
            }
            if (info.yOffset) {
                options.pixelOffset.y = info.yOffset;
            }
        }
        options.disableAutoPan = info.DisableAutoPan;
        options.visible = info.Visible;
        if (typeof info.Latitude === 'number' && typeof info.Longitude === 'number') {
            options.position = { latitude: info.Latitude, longitude: info.Longitude };
        }
        const infoWindowPromise = this._mapService.CreateInfoWindow(options);
        this._boxes.set(info, infoWindowPromise);
    }
    /**
     * Closes the info window
     *
     * @param info
     * @returns -  A promise that is resolved when the info box is closed.
     *
     * @memberof GoogleInfoBoxService
     */
    Close(info) {
        return this._boxes.get(info).then(w => {
            w.Close();
        });
    }
    /**
     * Registers an event delegate for an info window.
     *
     * @param eventName - The name of the event to register (e.g. 'click')
     * @param infoComponent - The {@link InfoBoxComponent} for which to register the event.
     * @returns - Observable emiting an instance of T each time the event occurs.
     *
     * @memberof GoogleInfoBoxService
     */
    CreateEventObservable(eventName, infoComponent) {
        const googleEventName = GoogleMapEventsLookup[eventName];
        return Observable.create((observer) => {
            this._boxes.get(infoComponent).then((b) => {
                b.AddListener(googleEventName, (e) => this._zone.run(() => observer.next(e)));
            });
        });
    }
    /**
     * Deletes the info window
     *
     * @param info
     *
     * @memberof GoogleInfoBoxService
     */
    DeleteInfoWindow(info) {
        return Promise.resolve();
    }
    /**
     * Opens the info window. Window opens on a marker, if supplied, or a specific location if given
     *
     * @param info
     * @param [loc]
     *
     * @memberof GoogleInfoBoxService
     */
    Open(info, loc) {
        if (info.CloseInfoBoxesOnOpen || info.Modal) {
            // close all open info boxes
            this._boxes.forEach((box, i) => {
                if (info.Id !== i.Id) {
                    box.then((w) => {
                        if (w.IsOpen) {
                            w.Close();
                            i.Close();
                        }
                    });
                }
            });
        }
        return this._boxes.get(info).then((w) => {
            const options = {};
            if (info.HtmlContent !== '') {
                options.htmlContent = info.HtmlContent;
            }
            else {
                options.title = info.Title;
                options.description = info.Description;
            }
            w.SetOptions(options);
            if (info.HostMarker != null) {
                return this._markerService.GetNativeMarker(info.HostMarker).then((marker) => {
                    return this._mapService.MapPromise.then((map) => w.Open(marker.NativePrimitve));
                });
            }
            return this._mapService.MapPromise.then((map) => {
                if (loc) {
                    w.SetPosition(loc);
                }
                w.Open();
            });
        });
    }
    /**
     * Sets the info window options
     *
     * @param info
     * @param options
     *
     * @memberof GoogleInfoBoxService
     */
    SetOptions(info, options) {
        return this._boxes.get(info).then((w) => {
            w.SetOptions(options);
        });
    }
    /**
     * Sets the info window position
     *
     * @param info
     * @param latlng
     *
     * @memberof GoogleInfoBoxService
     */
    SetPosition(info, latlng) {
        this._boxes.get(info).then((w) => {
            w.SetPosition(latlng);
        });
        return Promise.resolve();
    }
}
GoogleInfoBoxService.decorators = [
    { type: Injectable }
];
GoogleInfoBoxService.ctorParameters = () => [
    { type: MapService },
    { type: MarkerService },
    { type: NgZone }
];

/**
 * Concrete implementation of a layer for the Google Map Provider.
 *
 * @export
 */
class GoogleLayer {
    ///
    /// Constructor
    ///
    /**
     * Creates a new instance of the GoogleMarkerClusterer class.
     *
     * @param _layer GoogleMapTypes.MarkerClusterer. Native Google Maps Marker Clusterer supporting the cluster layer.
     * @param _maps MapService. MapService implementation to leverage for the layer.
     *
     * @memberof GoogleLayer
     */
    constructor(_layer, _maps, _id) {
        this._layer = _layer;
        this._maps = _maps;
        this._id = _id;
        ///
        /// Field declarations
        ///
        this._entities = new Array();
        this._visible = true;
    }
    ///
    /// Property definitions
    ///
    /**
     * Get the native primitive underneath the abstraction layer. Google does not have the concept of a custom layer,
     * so we are returning the Map as the native object because it hosts all the markers.
     *
     * @returns GoogleMapTypes.GoogleMap.
     *
     * @memberof GoogleLayer
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
     * @memberof GoogleLayer
     */
    AddListener(eventType, fn) {
        throw (new Error('Events are not supported on Google Layers. You can still add events to individual markers.'));
    }
    /**
     * Adds an entity to the layer. Use this method with caution as it will
     * trigger a recaluation of the clusters (and associated markers if approprite) for
     * each invocation. If you use this method to add many markers to the cluster, use
     *
     * @param entity Marker|InfoWindow|Polygon|Polyline. Entity to add to the layer.
     *
     * @memberof GoogleLAyer
     */
    AddEntity(entity) {
        if (entity.NativePrimitve) {
            this._entities.push(entity);
            entity.NativePrimitve.setVisible(this._visible);
            entity.NativePrimitve.setMap(this.NativePrimitve);
        }
    }
    /**
     * Adds a number of entities to the layer. Entities in this context should be model abstractions of concered map functionality (such
     * as marker, infowindow, polyline, polygon, etc..)
     *
     * @param entities Array<Marker|InfoWindow|Polygon|Polyline>. Entities to add to the layer.
     *
     * @memberof GoogleLAyer
     */
    AddEntities(entities) {
        if (entities != null && Array.isArray(entities) && entities.length !== 0) {
            this._entities.push(...entities);
            eachSeries([...entities], (e, next) => {
                e.NativePrimitve.setVisible(this._visible);
                e.NativePrimitve.setMap(this.NativePrimitve);
                nextTick(() => next());
            });
        }
    }
    /**
     * Deletes the layer anbd the markers in it.
     *
     * @memberof GoogleLayer
     */
    Delete() {
        eachSeries(this._entities.splice(0), (e, next) => {
            e.NativePrimitve.setMap(null);
            nextTick(() => next());
        });
    }
    /**
     * Returns the options governing the behavior of the layer.
     *
     * @returns ILayerOptions. The layer options.
     *
     * @memberof GoogleLayer
     */
    GetOptions() {
        const options = {
            id: this._id
        };
        return options;
    }
    /**
     * Returns the visibility state of the layer.
     *
     * @returns Boolean. True is the layer is visible, false otherwise.
     *
     * @memberof GoogleLayer
     */
    GetVisible() {
        return this._visible;
    }
    /**
     * Removes an entity from the layer.
     *
     * @param entity Marker|InfoWindow|Polygon|Polyline Entity to be removed from the layer.
     *
     * @memberof GoogleLayer
     */
    RemoveEntity(entity) {
        if (entity.NativePrimitve) {
            const j = this._entities.indexOf(entity);
            if (j > -1) {
                this._entities.splice(j, 1);
            }
            entity.NativePrimitve.setMap(null);
        }
    }
    /**
     * Sets the entities for the cluster layer.
     *
     * @param entities Array<Marker>|Array<InfoWindow>|Array<Polygon>|Array<Polyline> containing
     * the entities to add to the cluster. This replaces any existing entities.
     *
     * @memberof GoogleLayer
     */
    SetEntities(entities) {
        this.Delete();
        this.AddEntities(entities);
    }
    /**
     * Sets the options for the cluster layer.
     *
     * @param options ILayerOptions containing the options enumeration controlling the layer behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof GoogleLayer
     */
    SetOptions(options) {
        this._id = options.id;
    }
    /**
     * Toggles the cluster layer visibility.
     *
     * @param visible Boolean true to make the layer visible, false to hide the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    SetVisible(visible) {
        eachSeries([...this._entities], (e, next) => {
            e.NativePrimitve.setVisible(visible);
            nextTick(() => next());
        });
        this._visible = visible;
    }
}

/**
 * Implements the {@link LayerService} contract for a Google Maps specific implementation.
 *
 * @export
 */
class GoogleLayerService extends GoogleLayerBase {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GoogleLayerService.
     * @param _mapService - Instance of the Google Maps Service. Will generally be injected.
     * @param _zone - NgZone instance to provide zone aware promises.
     *
     * @memberof GoogleLayerService
     */
    constructor(_mapService, _zone) {
        super(_mapService, _zone);
        ///
        /// Field Declarations.
        ///
        this._layers = new Map();
    }
    /**
     * Adds a layer to the map.
     *
     * @abstract
     * @param layer - MapLayerDirective component object.
     * Generally, MapLayerDirective will be injected with an instance of the
     * LayerService and then self register on initialization.
     *
     * @memberof GoogleLayerService
     */
    AddLayer(layer) {
        const p = new Promise((resolve, reject) => {
            this._mapService.MapPromise.then(m => {
                const l = new GoogleLayer(m, this._mapService, layer.Id);
                l.SetVisible(layer.Visible);
                resolve(l);
            });
        });
        this._layers.set(layer.Id, p);
    }
    /**
     * Adds a polygon to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygon.
     * @returns - A promise that when fullfilled contains the an instance of the Polygon model.
     *
     * @memberof GoogleLayerService
     */
    CreatePolygon(layer, options) {
        const p = this._mapService.CreatePolygon(options);
        const l = this._layers.get(layer);
        Promise.all([p, l]).then(x => x[1].AddEntity(x[0]));
        return p;
    }
    /**
     * Creates an array of unbound polygons. Use this method to create arrays of polygons to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polygon.
     * @param options - Polygon options defining the polygons.
     * @returns - A promise that when fullfilled contains the an arrays of the Polygon models.
     *
     * @memberof GoogleLayerService
     */
    CreatePolygons(layer, options) {
        //
        // Note: we attempted using data.Polygons in an attempt to improve performance, but either data.Polygon
        // or data.MultiPolygon actually operate significantly slower than generating the polygons this way.
        // the slowness in google as opposed to bing probably comes from the point reduction algorithm uses.
        // Signigicant performance improvements might be possible in google when using a pixel based reduction algorithm
        // prior to setting the polygon path. This will lower to processing overhead of the google algorithm (with is Douglas-Peucker
        // and rather compute intensive)
        //
        const p = this.GetLayerById(layer);
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            const polygons = new Promise((resolve, reject) => {
                const polys = options.map(o => {
                    const op = GoogleConversions.TranslatePolygonOptions(o);
                    const poly = new google.maps.Polygon(op);
                    const polygon = new GooglePolygon(poly);
                    if (o.title && o.title !== '') {
                        polygon.Title = o.title;
                    }
                    if (o.metadata) {
                        o.metadata.forEach((val, key) => polygon.Metadata.set(key, val));
                    }
                    return polygon;
                });
                resolve(polys);
            });
            return polygons;
        });
    }
    /**
     * Adds a polyline to the layer.
     *
     * @abstract
     * @param layer - The id of the layer to which to add the polyline.
     * @param options - Polyline options defining the polyline.
     * @returns - A promise that when fullfilled contains the an instance of the Polyline (or an array
     * of polygons for complex paths) model.
     *
     * @memberof GoogleLayerService
     */
    CreatePolyline(layer, options) {
        const p = this._mapService.CreatePolyline(options);
        const l = this._layers.get(layer);
        Promise.all([p, l]).then(x => {
            const p1 = Array.isArray(x[0]) ? x[0] : [x[0]];
            for (const p2 of p1) {
                x[1].AddEntity(p2);
            }
        });
        return p;
    }
    /**
     * Creates an array of unbound polylines. Use this method to create arrays of polylines to be used in bulk
     * operations.
     *
     * @param layer - The id of the layer to which to add the polylines.
     * @param options - Polyline options defining the polylines.
     * @returns - A promise that when fullfilled contains the an arrays of the Polyline models.
     *
     * @memberof GoogleLayerService
     */
    CreatePolylines(layer, options) {
        const p = this.GetLayerById(layer);
        if (p == null) {
            throw (new Error(`Layer with id ${layer} not found in Layer Map`));
        }
        return p.then((l) => {
            const polylines = new Promise((resolve, reject) => {
                const polys = options.map(o => {
                    const op = GoogleConversions.TranslatePolylineOptions(o);
                    if (o.path && o.path.length > 0 && !Array.isArray(o.path[0])) {
                        op.path = GoogleConversions.TranslatePaths(o.path)[0];
                        const poly = new google.maps.Polyline(op);
                        const polyline = new GooglePolyline(poly);
                        if (o.title && o.title !== '') {
                            polyline.Title = o.title;
                        }
                        if (o.metadata) {
                            o.metadata.forEach((v, k) => polyline.Metadata.set(k, v));
                        }
                        return polyline;
                    }
                    else {
                        const paths = GoogleConversions.TranslatePaths(o.path);
                        const lines = new Array();
                        paths.forEach(x => {
                            op.path = x;
                            const poly = new google.maps.Polyline(op);
                            const polyline = new GooglePolyline(poly);
                            if (o.metadata) {
                                o.metadata.forEach((v, k) => polyline.Metadata.set(k, v));
                            }
                            if (o.title && o.title !== '') {
                                polyline.Title = o.title;
                            }
                            lines.push(polyline);
                        });
                        return lines;
                    }
                });
                resolve(polys);
            });
            return polylines;
        });
    }
}
GoogleLayerService.decorators = [
    { type: Injectable }
];
GoogleLayerService.ctorParameters = () => [
    { type: MapService },
    { type: NgZone }
];

/**
 * Protocol enumeration
 *
 * @export
 * @enum {number}
 */
var ScriptProtocol$1;
(function (ScriptProtocol) {
    ScriptProtocol[ScriptProtocol["HTTP"] = 0] = "HTTP";
    ScriptProtocol[ScriptProtocol["HTTPS"] = 1] = "HTTPS";
    ScriptProtocol[ScriptProtocol["AUTO"] = 2] = "AUTO";
})(ScriptProtocol$1 || (ScriptProtocol$1 = {}));
/**
 * Bing Maps V8 specific loader configuration to be used with the {@link GoogleMapAPILoader}
 *
 * @export
 */
class GoogleMapAPILoaderConfig {
}
GoogleMapAPILoaderConfig.decorators = [
    { type: Injectable }
];
/**
 * Default loader configuration.
 */
const DEFAULT_CONFIGURATION$1 = new GoogleMapAPILoaderConfig();
/**
 * Bing Maps V8 implementation for the {@link MapAPILoader} service.
 *
 * @export
 */
class GoogleMapAPILoader extends MapAPILoader {
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
            this._config = DEFAULT_CONFIGURATION$1;
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
        const protocolType = ((this._config && this._config.protocol) || ScriptProtocol$1.HTTPS);
        let protocol;
        switch (protocolType) {
            case ScriptProtocol$1.AUTO:
                protocol = '';
                break;
            case ScriptProtocol$1.HTTP:
                protocol = 'http:';
                break;
            case ScriptProtocol$1.HTTPS:
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

/**
 * Concrete implementation of the MarkerService abstract class for Google.
 *
 * @export
 */
class GoogleMarkerService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GoogleMarkerService.
     * @param _mapService - {@link MapService} instance.
     * The concrete {@link GoogleMapService} implementation is expected.
     * @param _layerService - {@link LayerService} instance.
     * The concrete {@link GoogleLayerService} implementation is expected.
     * @param _clusterService - {@link ClusterService} instance.
     * The concrete {@link GoogleClusterService} implementation is expected.
     * @param _zone - NgZone instance to support zone aware promises.
     *
     * @memberof GoogleMarkerService
     */
    constructor(_mapService, _layerService, _clusterService, _zone) {
        this._mapService = _mapService;
        this._layerService = _layerService;
        this._clusterService = _clusterService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._markers = new Map();
    }
    /**
     * Adds a marker. Depending on the marker context, the marker will either by added to the map or a correcsponding layer.
     *
     * @param marker - The {@link MapMarkerDirective} to be added.
     * @memberof GoogleMarkerService
     */
    AddMarker(marker) {
        const o = {
            anchor: marker.Anchor,
            position: { latitude: marker.Latitude, longitude: marker.Longitude },
            title: marker.Title,
            label: marker.Label,
            draggable: marker.Draggable,
            icon: marker.IconUrl,
            iconInfo: marker.IconInfo,
            width: marker.Width,
            height: marker.Height,
            isFirst: marker.IsFirstInSet,
            isLast: marker.IsLastInSet
        };
        // create marker via promise.
        let markerPromise = null;
        if (marker.InClusterLayer) {
            markerPromise = this._clusterService.CreateMarker(marker.LayerId, o);
        }
        else if (marker.InCustomLayer) {
            markerPromise = this._layerService.CreateMarker(marker.LayerId, o);
        }
        else {
            markerPromise = this._mapService.CreateMarker(o);
        }
        this._markers.set(marker, markerPromise);
        if (marker.IconInfo) {
            markerPromise.then((m) => {
                // update iconInfo to provide hook to do post icon creation activities and
                // also re-anchor the marker
                marker.DynamicMarkerCreated.emit(o.iconInfo);
                const p = {
                    x: (o.iconInfo.size && o.iconInfo.markerOffsetRatio) ? (o.iconInfo.size.width * o.iconInfo.markerOffsetRatio.x) : 0,
                    y: (o.iconInfo.size && o.iconInfo.markerOffsetRatio) ? (o.iconInfo.size.height * o.iconInfo.markerOffsetRatio.y) : 0,
                };
                m.SetAnchor(p);
            });
        }
    }
    /**
     * Registers an event delegate for a marker.
     *
     * @param eventName - The name of the event to register (e.g. 'click')
     * @param marker - The {@link MapMarkerDirective} for which to register the event.
     * @returns - Observable emiting an instance of T each time the event occurs.
     * @memberof GoogleMarkerService
     */
    CreateEventObservable(eventName, marker) {
        return Observable.create((observer) => {
            this._markers.get(marker).then((m) => {
                m.AddListener(eventName, (e) => this._zone.run(() => observer.next(e)));
            });
        });
    }
    /**
     * Deletes a marker.
     *
     * @param marker - {@link MapMarkerDirective} to be deleted.
     * @returns - A promise fullfilled once the marker has been deleted.
     * @memberof GoogleMarkerService
     */
    DeleteMarker(marker) {
        const m = this._markers.get(marker);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then((ma) => {
            if (marker.InClusterLayer) {
                this._clusterService.GetNativeLayer(marker.LayerId).then(l => { l.RemoveEntity(ma); });
            }
            if (marker.InCustomLayer) {
                this._layerService.GetNativeLayer(marker.LayerId).then(l => { l.RemoveEntity(ma); });
            }
            return this._zone.run(() => {
                ma.DeleteMarker();
                this._markers.delete(marker);
            });
        });
    }
    /**
     * Obtains geo coordinates for the marker on the click location
     *
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     * @memberof GoogleMarkerService
     */
    GetCoordinatesFromClick(e) {
        if (!e) {
            return null;
        }
        if (!e.latLng) {
            return null;
        }
        if (!e.latLng.lat || !e.latLng.lng) {
            return null;
        }
        return { latitude: e.latLng.lat(), longitude: e.latLng.lng() };
    }
    /**
     * Obtains the marker model for the marker allowing access to native implementation functionatiliy.
     *
     * @param marker - The {@link MapMarkerDirective} for which to obtain the marker model.
     * @returns - A promise that when fullfilled contains the {@link Marker} implementation of the underlying platform.
     * @memberof GoogleMarkerService
     */
    GetNativeMarker(marker) {
        return this._markers.get(marker);
    }
    /**
     * Obtains the marker pixel location for the marker on the click location
     *
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the pixels of the marker on the map canvas.
     * @memberof GoogleMarkerService
     */
    GetPixelsFromClick(e) {
        if (!e || !e.latLng || !e.latLng.lat || !e.latLng.lng) {
            return null;
        }
        if (this._mapService.MapInstance == null) {
            return null;
        }
        let crossesDateLine = false;
        const m = this._mapService.MapInstance;
        const p = m.getProjection();
        const s = Math.pow(2, m.getZoom());
        const b = m.getBounds();
        if (b.getCenter().lng() < b.getSouthWest().lng() ||
            b.getCenter().lng() > b.getNorthEast().lng()) {
            crossesDateLine = true;
        }
        const offsetY = p.fromLatLngToPoint(b.getNorthEast()).y;
        const offsetX = p.fromLatLngToPoint(b.getSouthWest()).x;
        const point = p.fromLatLngToPoint(e.latLng);
        return {
            x: Math.floor((point.x - offsetX + ((crossesDateLine && point.x < offsetX) ? 256 : 0)) * s),
            y: Math.floor((point.y - offsetY) * s)
        };
    }
    /**
     * Converts a geo location to a pixel location relative to the map canvas.
     *
     * @param target - Either a {@link MapMarkerDirective}
     * or a {@link ILatLong} for the basis of translation.
     * @returns - A promise that when fullfilled contains a {@link IPoint}
     * with the pixel coordinates of the MapMarker or ILatLong relative to the map canvas.
     * @memberof GoogleMarkerService
     */
    LocationToPoint(target) {
        if (target == null) {
            return Promise.resolve(null);
        }
        if (target instanceof MapMarkerDirective) {
            return this._markers.get(target).then((m) => {
                const l = m.Location;
                const p = this._mapService.LocationToPoint(l);
                return p;
            });
        }
        return this._mapService.LocationToPoint(target);
    }
    /**
     * Updates the anchor position for the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the anchor.
     * Anchor information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the anchor position has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateAnchor(marker) {
        return this._markers.get(marker).then((m) => {
            m.SetAnchor(marker.Anchor);
        });
    }
    /**
     * Updates whether the marker is draggable.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate dragability.
     * Dragability information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the marker has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateDraggable(marker) {
        return this._markers.get(marker).then((m) => m.SetDraggable(marker.Draggable));
    }
    /**
     * Updates the Icon on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the icon. Icon information is present
     * in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the icon information has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateIcon(marker) {
        return this._markers.get(marker).then((m) => {
            if (marker.IconInfo) {
                const x = {
                    position: { latitude: marker.Latitude, longitude: marker.Longitude },
                    iconInfo: marker.IconInfo
                };
                const o = GoogleConversions.TranslateMarkerOptions(x);
                m.SetIcon(o.icon);
                marker.DynamicMarkerCreated.emit(x.iconInfo);
            }
            else {
                m.SetIcon(marker.IconUrl);
            }
        });
    }
    /**
     * Updates the label on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the label.
     * Label information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the label has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateLabel(marker) {
        return this._markers.get(marker).then((m) => { m.SetLabel(marker.Label); });
    }
    /**
     * Updates the geo coordinates for the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the coordinates.
     * Coordinate information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the position has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateMarkerPosition(marker) {
        return this._markers.get(marker).then((m) => m.SetPosition({
            latitude: marker.Latitude,
            longitude: marker.Longitude
        }));
    }
    /**
     * Updates the title on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the title.
     * Title information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the title has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateTitle(marker) {
        return this._markers.get(marker).then((m) => m.SetTitle(marker.Title));
    }
    /**
     * Updates the visibility on the marker.
     *
     * @param - The {@link MapMarkerDirective} object for which to upate the title.
     * Title information is present in the underlying {@link Marker} model object.
     * @returns - A promise that is fullfilled when the title has been updated.
     * @memberof GoogleMarkerService
     */
    UpdateVisible(marker) {
        return this._markers.get(marker).then((m) => m.SetVisible(marker.Visible));
    }
}
GoogleMarkerService.decorators = [
    { type: Injectable }
];
GoogleMarkerService.ctorParameters = () => [
    { type: MapService },
    { type: LayerService },
    { type: ClusterService },
    { type: NgZone }
];

/**
 * Concrete implementation of a clustering layer for the Google Map Provider.
 *
 * @export
 */
class GoogleMarkerClusterer {
    ///
    /// Constructor
    ///
    /**
     * Creates a new instance of the GoogleMarkerClusterer class.
     *
     * @param _layer GoogleMapTypes.MarkerClusterer. Native Google Maps Marker Clusterer supporting the cluster layer.
     * @param _maps MapService. MapService implementation to leverage for the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    constructor(_layer) {
        this._layer = _layer;
        ///
        /// Field declarations
        ///
        this._isClustering = true;
        this._markerLookup = new Map();
        this._markers = new Array();
        this._pendingMarkers = new Array();
        this._mapclicks = 0;
        this._currentZoom = 0;
        this._visible = true;
    }
    ///
    /// Property definitions
    ///
    /**
     * Get the native primitive underneath the abstraction layer.
     *
     * @returns GoogleMapTypes.MarkerClusterer.
     *
     * @memberof GoogleMarkerClusterer
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
     * @memberof GoogleMarkerClusterer
     */
    AddListener(eventType, fn) {
        throw (new Error('Events are not supported on Google Cluster Layers. You can still add events to individual markers.'));
    }
    /**
     * Adds an entity to the layer. Use this method with caution as it will
     * trigger a recaluation of the clusters (and associated markers if approprite) for
     * each invocation. If you use this method to add many markers to the cluster, use
     *
     * @param entity Marker. Entity to add to the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    AddEntity(entity) {
        let isMarker = entity instanceof Marker;
        isMarker = entity instanceof GoogleMarker || isMarker;
        if (isMarker) {
            entity.NativePrimitve.setMap(null);
            // remove the marker from the map as the clusterer will control marker visibility.
            if (entity.IsFirst) {
                this.StopClustering();
            }
        }
        if (entity.NativePrimitve && entity.Location) {
            if (this._isClustering && this._visible) {
                this._layer.addMarker(entity.NativePrimitve);
                this._markers.push(entity);
            }
            else {
                this._pendingMarkers.push(entity);
            }
            this._markerLookup.set(entity.NativePrimitve, entity);
        }
        if (isMarker) {
            if (entity.IsLast) {
                this.StartClustering();
            }
        }
    }
    /**
     * Adds a number of markers to the layer.
     *
     * @param entities Array<Marker>. Entities to add to the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    AddEntities(entities) {
        if (entities != null && Array.isArray(entities) && entities.length !== 0) {
            const e = entities.map(p => {
                this._markerLookup.set(p.NativePrimitve, p);
                p.NativePrimitve.setMap(null);
                // remove the marker from the map as the clusterer will control marker visibility.
                return p.NativePrimitve;
            });
            if (this._isClustering && this._visible) {
                this._layer.addMarkers(e);
                this._markers.push(...entities);
            }
            else {
                // if layer is not visible, always add to pendingMarkers. Setting the layer to visible later
                // will render the markers appropriately
                this._pendingMarkers.push(...entities);
            }
        }
    }
    /**
     * Deletes the clustering layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    Delete() {
        this._layer.getMarkers().forEach(m => {
            m.setMap(null);
            // remove the marker from the map as the clusterer will control marker visibility.
        });
        this._layer.clearMarkers();
        this._markers.splice(0);
        this._pendingMarkers.splice(0);
    }
    /**
     * Returns the abstract marker used to wrap the Google Marker.
     *
     * @returns Marker. The abstract marker object representing the pushpin.
     *
     * @memberof GoogleMarkerClusterer
     */
    GetMarkerFromGoogleMarker(pin) {
        const m = this._markerLookup.get(pin);
        return m;
    }
    /**
     * Returns the options governing the behavior of the layer.
     *
     * @returns IClusterOptions. The layer options.
     *
     * @memberof GoogleMarkerClusterer
     */
    GetOptions() {
        const options = {
            id: 0,
            gridSize: this._layer.getGridSize(),
            clusteringEnabled: this._layer.getGridSize() === 0,
            maxZoom: this._layer.getMaxZoom(),
            minimumClusterSize: this._layer.getMinClusterSize(),
            placementMode: this._layer.isAverageCenter() ? ClusterPlacementMode.MeanValue : ClusterPlacementMode.FirstPin,
            visible: this._visible,
            zoomOnClick: this._layer.isZoomOnClick(),
            styles: this._layer.getStyles()
        };
        return options;
    }
    /**
     * Returns the visibility state of the layer.
     *
     * @returns Boolean. True is the layer is visible, false otherwise.
     *
     * @memberof GoogleMarkerClusterer
     */
    GetVisible() {
        return this._visible;
    }
    /**
     * Removes an entity from the cluster layer.
     *
     * @param entity Marker Entity to be removed from the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    RemoveEntity(entity) {
        if (entity.NativePrimitve && entity.Location) {
            const j = this._markers.indexOf(entity);
            const k = this._pendingMarkers.indexOf(entity);
            if (j > -1) {
                this._markers.splice(j, 1);
            }
            if (k > -1) {
                this._pendingMarkers.splice(k, 1);
            }
            if (this._isClustering) {
                this._layer.removeMarker(entity.NativePrimitve);
            }
            this._markerLookup.delete(entity.NativePrimitve);
        }
    }
    /**
     * Sets the entities for the cluster layer.
     *
     * @param entities Array<Marker> containing
     * the entities to add to the cluster. This replaces any existing entities.
     *
     * @memberof GoogleMarkerClusterer
     */
    SetEntities(entities) {
        this._layer.getMarkers().forEach(m => {
            m.setMap(null);
        });
        this._layer.clearMarkers();
        this._markers.splice(0);
        this._pendingMarkers.splice(0);
        this._markerLookup.clear();
        const p = new Array();
        entities.forEach((e) => {
            if (e.NativePrimitve && e.Location) {
                e.NativePrimitve.setMap(null);
                this._markerLookup.set(e.NativePrimitve, e);
                if (this._visible) {
                    this._markers.push(e);
                    p.push(e.NativePrimitve);
                }
                else {
                    this._pendingMarkers.push(e);
                }
            }
        });
        this._layer.addMarkers(p);
    }
    /**
     * Sets the options for the cluster layer.
     *
     * @param options IClusterOptions containing the options enumeration controlling the layer behavior. The supplied options
     * are merged with the default/existing options.
     *
     * @memberof GoogleMarkerClusterer
     */
    SetOptions(options) {
        if (options.placementMode != null) {
            throw (new Error('GoogleMarkerClusterer: PlacementMode option cannot be set after initial creation.'));
        }
        if (options.zoomOnClick != null) {
            throw (new Error('GoogleMarkerClusterer: ZoomOnClick option cannot be set after initial creation.'));
        }
        if (options.callback != null) { }
        if (options.clusteringEnabled != null) {
            this._layer.setMinClusterSize(options.clusteringEnabled ? 1 : 10000000);
            this._layer.resetViewport();
            this._layer.redraw();
        }
        if (options.gridSize != null && (options.clusteringEnabled == null || options.clusteringEnabled)) {
            this._layer.setGridSize(options.gridSize);
            this._layer.resetViewport();
            this._layer.redraw();
        }
        if (options.maxZoom != null) {
            this._layer.setMaxZoom(options.maxZoom);
        }
        if (options.minimumClusterSize != null) {
            this._layer.setMinClusterSize(options.minimumClusterSize);
        }
        if (options.styles != null) {
            this._layer.setStyles(options.styles);
        }
        if (options.visible != null) {
            this.SetVisible(options.visible);
        }
    }
    /**
     * Toggles the cluster layer visibility.
     *
     * @param visible Boolean true to make the layer visible, false to hide the layer.
     *
     * @memberof GoogleMarkerClusterer
     */
    SetVisible(visible) {
        const map = visible ? this._layer.getMap() : null;
        if (!visible) {
            this._layer.resetViewport(true);
        }
        else {
            const p = new Array();
            if (this._pendingMarkers.length > 0) {
                this._pendingMarkers.forEach(e => {
                    if (e.NativePrimitve && e.Location) {
                        p.push(e.NativePrimitve);
                    }
                });
                this._layer.addMarkers(p);
                this._markers = this._markers.concat(this._pendingMarkers.splice(0));
            }
            else {
                this._layer.redraw();
            }
        }
        this._visible = visible;
    }
    /**
     * Start to actually cluster the entities in a cluster layer. This method should be called after the initial set of entities
     * have been added to the cluster. This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @memberof GoogleMarkerClusterer
     */
    StartClustering() {
        if (this._isClustering) {
            return;
        }
        if (this._visible) {
            const p = new Array();
            this._markers.forEach(e => {
                if (e.NativePrimitve && e.Location) {
                    p.push(e.NativePrimitve);
                }
            });
            this._pendingMarkers.forEach(e => {
                if (e.NativePrimitve && e.Location) {
                    p.push(e.NativePrimitve);
                }
            });
            this._layer.addMarkers(p);
            this._markers = this._markers.concat(this._pendingMarkers.splice(0));
        }
        if (!this._visible) {
            // only add the markers if the layer is visible. Otherwise, keep them pending. They would be added once the
            // layer is set to visible.
            timer(0).subscribe(() => {
                this._layer.resetViewport(true);
            });
        }
        this._isClustering = true;
    }
    /**
     * Stop to actually cluster the entities in a cluster layer.
     * This method is used for performance reasons as adding an entitiy will recalculate all clusters.
     * As such, StopClustering should be called before adding many entities and StartClustering should be called once adding is
     * complete to recalculate the clusters.
     *
     * @returns
     *
     * @memberof GoogleMarkerClusterer
     */
    StopClustering() {
        if (!this._isClustering) {
            return;
        }
        this._isClustering = false;
    }
}

/**
 * Concrete implementation of the MapService abstract implementing a Google Maps provider
 *
 * @export
 */
class GoogleMapService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GoogleMapService.
     * @param _loader MapAPILoader instance implemented for Google Maps. This instance will generally be injected.
     * @param _zone NgZone object to enable zone aware promises. This will generally be injected.
     *
     * @memberof GoogleMapService
     */
    constructor(_loader, _zone) {
        this._loader = _loader;
        this._zone = _zone;
        this._map = new Promise((resolve) => { this._mapResolver = resolve; });
        this._config = this._loader.Config;
    }
    ///
    /// Property Definitions
    ///
    /**
     * Gets the Google Map control instance underlying the implementation
     *
     * @readonly
     * @memberof GoogleMapService
     */
    get MapInstance() { return this._mapInstance; }
    /**
     * Gets a Promise for a Google Map control instance underlying the implementation. Use this instead of {@link MapInstance} if you
     * are not sure if and when the instance will be created.
     * @readonly
     * @memberof GoogleMapService
     */
    get MapPromise() { return this._map; }
    /**
     * Gets the maps physical size.
     *
     * @readonly
     * @abstract
     * @memberof BingMapService
     */
    get MapSize() {
        if (this.MapInstance) {
            const el = this.MapInstance.getDiv();
            const s = { width: el.offsetWidth, height: el.offsetHeight };
            return s;
        }
        return null;
    }
    ///
    /// Public methods and MapService interface implementation
    ///
    /**
     * Creates a canvas overlay layer to perform custom drawing over the map with out
     * some of the overhead associated with going through the Map objects.
     * @param drawCallback A callback function that is triggered when the canvas is ready to be
     * rendered for the current map view.
     * @returns - Promise of a {@link CanvasOverlay} object.
     * @memberof GoogleMapService
     */
    CreateCanvasOverlay(drawCallback) {
        return this._map.then((map) => {
            const overlay = new GoogleCanvasOverlay(drawCallback);
            overlay.SetMap(map);
            return overlay;
        });
    }
    /*
     * Creates a Google map cluster layer within the map context
     *
     * @param options - Options for the layer. See {@link IClusterOptions}.
     * @returns - Promise of a {@link Layer} object, which models the underlying Microsoft.Maps.ClusterLayer object.
     *
     * @memberof GoogleMapService
     */
    CreateClusterLayer(options) {
        return this._map.then((map) => {
            let updateOptions = false;
            const markerClusterer = new MarkerClusterer(map, [], options);
            const clusterLayer = new GoogleMarkerClusterer(markerClusterer);
            const o = {
                id: options.id
            };
            if (!options.visible) {
                o.visible = false;
                updateOptions = true;
            }
            if (!options.clusteringEnabled) {
                o.clusteringEnabled = false;
                updateOptions = true;
            }
            if (updateOptions) {
                clusterLayer.SetOptions(o);
            }
            return clusterLayer;
        });
    }
    /**
     * Creates an information window for a map position
     *
     * @param [options] - Infowindow options. See {@link IInfoWindowOptions}
     * @returns - Promise of a {@link InfoWindow} object, which models the underlying Microsoft.Maps.Infobox object.
     *
     * @memberof GoogleMapService
     */
    CreateInfoWindow(options) {
        return this._map.then((map) => {
            const o = GoogleConversions.TranslateInfoWindowOptions(options);
            const infoWindow = new google.maps.InfoWindow(o);
            return new GoogleInfoWindow(infoWindow, this);
        });
    }
    /**
     * Creates a map layer within the map context
     *
     * @param options - Options for the layer. See {@link ILayerOptions}
     * @returns - Promise of a {@link Layer} object, which models the underlying Microsoft.Maps.Layer object.
     *
     * @memberof GoogleMapService
     */
    CreateLayer(options) {
        return this._map.then((map) => {
            return new GoogleLayer(map, this, options.id);
        });
    }
    /**
     * Creates a map instance
     *
     * @param el - HTML element to host the map.
     * @param mapOptions - Map options
     * @returns - Promise fullfilled once the map has been created.
     *
     * @memberof GoogleMapService
     */
    CreateMap(el, mapOptions) {
        return this._loader.Load().then(() => {
            // apply mixins
            MixinMapLabelWithOverlayView$1();
            MixinCanvasOverlay$1();
            // execute map startup
            if (!mapOptions.mapTypeId == null) {
                mapOptions.mapTypeId = MapTypeId.hybrid;
            }
            if (this._mapInstance != null) {
                this.DisposeMap();
            }
            const o = GoogleConversions.TranslateOptions(mapOptions);
            const map = new google.maps.Map(el, o);
            if (mapOptions.bounds) {
                map.fitBounds(GoogleConversions.TranslateBounds(mapOptions.bounds));
            }
            this._mapInstance = map;
            this._mapResolver(map);
            return;
        });
    }
    /**
     * Creates a Google map marker within the map context
     *
     * @param [options=<IMarkerOptions>{}] - Options for the marker. See {@link IMarkerOptions}.
     * @returns - Promise of a {@link Marker} object, which models the underlying Microsoft.Maps.PushPin object.
     *
     * @memberof GoogleMapService
     */
    CreateMarker(options = {}) {
        const payload = (x, map) => {
            const marker = new google.maps.Marker(x);
            const m = new GoogleMarker(marker);
            m.IsFirst = options.isFirst;
            m.IsLast = options.isLast;
            if (options.metadata) {
                options.metadata.forEach((val, key) => m.Metadata.set(key, val));
            }
            marker.setMap(map);
            return m;
        };
        return this._map.then((map) => {
            const o = GoogleConversions.TranslateMarkerOptions(options);
            if (options.iconInfo && options.iconInfo.markerType) {
                const s = Marker.CreateMarker(options.iconInfo);
                if (typeof (s) === 'string') {
                    o.icon = s;
                    return payload(o, map);
                }
                else {
                    return s.then(x => {
                        o.icon = x.icon;
                        return payload(o, map);
                    });
                }
            }
            else {
                return payload(o, map);
            }
        });
    }
    /**
     * Creates a polygon within the Google Map map context
     *
     * @abstract
     * @param options - Options for the polygon. See {@link IPolygonOptions}.
     * @returns - Promise of a {@link Polygon} object, which models the underlying native polygon.
     *
     * @memberof MapService
     */
    CreatePolygon(options) {
        return this._map.then((map) => {
            const o = GoogleConversions.TranslatePolygonOptions(options);
            const polygon = new google.maps.Polygon(o);
            polygon.setMap(map);
            const p = new GooglePolygon(polygon);
            if (options.metadata) {
                options.metadata.forEach((val, key) => p.Metadata.set(key, val));
            }
            if (options.title && options.title !== '') {
                p.Title = options.title;
            }
            if (options.showLabel != null) {
                p.ShowLabel = options.showLabel;
            }
            if (options.showTooltip != null) {
                p.ShowTooltip = options.showTooltip;
            }
            if (options.labelMaxZoom != null) {
                p.LabelMaxZoom = options.labelMaxZoom;
            }
            if (options.labelMinZoom != null) {
                p.LabelMinZoom = options.labelMinZoom;
            }
            return p;
        });
    }
    /**
     * Creates a polyline within the Google Map map context
     *
     * @abstract
     * @param options - Options for the polyline. See {@link IPolylineOptions}.
     * @returns - Promise of a {@link Polyline} object (or an array therefore for complex paths)
     * which models the underlying native polyline.
     *
     * @memberof MapService
     */
    CreatePolyline(options) {
        let polyline;
        return this._map.then((map) => {
            const o = GoogleConversions.TranslatePolylineOptions(options);
            if (options.path && options.path.length > 0 && !Array.isArray(options.path[0])) {
                o.path = GoogleConversions.TranslatePaths(options.path)[0];
                polyline = new google.maps.Polyline(o);
                polyline.setMap(map);
                const pl = new GooglePolyline(polyline);
                if (options.metadata) {
                    options.metadata.forEach((val, key) => pl.Metadata.set(key, val));
                }
                if (options.title && options.title !== '') {
                    pl.Title = options.title;
                }
                if (options.showTooltip != null) {
                    pl.ShowTooltip = options.showTooltip;
                }
                return pl;
            }
            else {
                const paths = GoogleConversions.TranslatePaths(options.path);
                const lines = new Array();
                paths.forEach(p => {
                    o.path = p;
                    polyline = new google.maps.Polyline(o);
                    polyline.setMap(map);
                    const pl = new GooglePolyline(polyline);
                    if (options.metadata) {
                        options.metadata.forEach((val, key) => pl.Metadata.set(key, val));
                    }
                    if (options.title && options.title !== '') {
                        pl.Title = options.title;
                    }
                    if (options.showTooltip != null) {
                        pl.ShowTooltip = options.showTooltip;
                    }
                    lines.push(pl);
                });
                return lines;
            }
        });
    }
    /**
     * Deletes a layer from the map.
     *
     * @param layer - Layer to delete. See {@link Layer}. This method expects the Google specific Layer model implementation.
     * @returns - Promise fullfilled when the layer has been removed.
     *
     * @memberof GoogleMapService
     */
    DeleteLayer(layer) {
        // return resolved promise as there is no conept of a custom layer in Google.
        return Promise.resolve();
    }
    /**
     * Dispaose the map and associated resoures.
     *
     * @memberof GoogleMapService
     */
    DisposeMap() {
        if (this._map == null && this._mapInstance == null) {
            return;
        }
        if (this._mapInstance != null) {
            this._mapInstance = null;
            this._map = new Promise((resolve) => { this._mapResolver = resolve; });
        }
    }
    /**
     * Gets the geo coordinates of the map center
     *
     * @returns - A promise that when fullfilled contains the goe location of the center. See {@link ILatLong}.
     *
     * @memberof GoogleMapService
     */
    GetCenter() {
        return this._map.then((map) => {
            const center = map.getCenter();
            return {
                latitude: center.lat(),
                longitude: center.lng()
            };
        });
    }
    /**
     * Gets the geo coordinates of the map bounding box
     *
     * @returns - A promise that when fullfilled contains the geo location of the bounding box. See {@link IBox}.
     *
     * @memberof GoogleMapService
     */
    GetBounds() {
        return this._map.then((map) => {
            const box = map.getBounds();
            return {
                maxLatitude: box.getNorthEast().lat(),
                maxLongitude: Math.max(box.getNorthEast().lng(), box.getSouthWest().lng()),
                minLatitude: box.getSouthWest().lat(),
                minLongitude: Math.min(box.getNorthEast().lng(), box.getSouthWest().lng()),
                center: { latitude: box.getCenter().lat(), longitude: box.getCenter().lng() },
                padding: 0
            };
        });
    }
    /**
     * Gets the current zoom level of the map.
     *
     * @returns - A promise that when fullfilled contains the zoom level.
     *
     * @memberof GoogleMapService
     */
    GetZoom() {
        return this._map.then((map) => map.getZoom());
    }
    /**
     * Provides a conversion of geo coordinates to pixels on the map control.
     *
     * @param loc - The geo coordinates to translate.
     * @returns - Promise of an {@link IPoint} interface representing the pixels. This promise resolves to null
     * if the goe coordinates are not in the view port.
     *
     * @memberof GoogleMapService
     */
    LocationToPoint(loc) {
        return this._map.then((m) => {
            let crossesDateLine = false;
            const l = GoogleConversions.TranslateLocationObject(loc);
            const p = m.getProjection();
            const s = Math.pow(2, m.getZoom());
            const b = m.getBounds();
            if (b.getCenter().lng() < b.getSouthWest().lng() ||
                b.getCenter().lng() > b.getNorthEast().lng()) {
                crossesDateLine = true;
            }
            const offsetY = p.fromLatLngToPoint(b.getNorthEast()).y;
            const offsetX = p.fromLatLngToPoint(b.getSouthWest()).x;
            const point = p.fromLatLngToPoint(l);
            return {
                x: Math.floor((point.x - offsetX + ((crossesDateLine && point.x < offsetX) ? 256 : 0)) * s),
                y: Math.floor((point.y - offsetY) * s)
            };
        });
    }
    /**
     * Provides a conversion of geo coordinates to pixels on the map control.
     *
     * @param loc - The geo coordinates to translate.
     * @returns - Promise of an {@link IPoint} interface array representing the pixels.
     *
     * @memberof BingMapService
     */
    LocationsToPoints(locs) {
        return this._map.then((m) => {
            let crossesDateLine = false;
            const p = m.getProjection();
            const s = Math.pow(2, m.getZoom());
            const b = m.getBounds();
            if (b.getCenter().lng() < b.getSouthWest().lng() ||
                b.getCenter().lng() > b.getNorthEast().lng()) {
                crossesDateLine = true;
            }
            const offsetX = p.fromLatLngToPoint(b.getSouthWest()).x;
            const offsetY = p.fromLatLngToPoint(b.getNorthEast()).y;
            const l = locs.map(ll => {
                const l1 = GoogleConversions.TranslateLocationObject(ll);
                const point = p.fromLatLngToPoint(l1);
                return {
                    x: Math.floor((point.x - offsetX + ((crossesDateLine && point.x < offsetX) ? 256 : 0)) * s),
                    y: Math.floor((point.y - offsetY) * s)
                };
            });
            return l;
        });
    }
    /**
     * Centers the map on a geo location.
     *
     * @param latLng - GeoCoordinates around which to center the map. See {@link ILatLong}
     * @returns - Promise that is fullfilled when the center operations has been completed.
     *
     * @memberof GoogleMapService
     */
    SetCenter(latLng) {
        return this._map.then((map) => {
            const center = GoogleConversions.TranslateLocationObject(latLng);
            map.setCenter(center);
        });
    }
    /**
     * Sets the generic map options.
     *
     * @param options - Options to set.
     *
     * @memberof GoogleMapService
     */
    SetMapOptions(options) {
        this._map.then((m) => {
            const o = GoogleConversions.TranslateOptions(options);
            m.setOptions(o);
        });
    }
    /**
     * Sets the view options of the map.
     *
     * @param options - Options to set.
     *
     * @memberof GoogleMapService
     */
    SetViewOptions(options) {
        this._map.then((m) => {
            if (options.bounds) {
                m.fitBounds(GoogleConversions.TranslateBounds(options.bounds));
            }
            const o = GoogleConversions.TranslateOptions(options);
            m.setOptions(o);
        });
    }
    /**
     * Sets the zoom level of the map.
     *
     * @param zoom - Zoom level to set.
     * @returns - A Promise that is fullfilled once the zoom operation is complete.
     *
     * @memberof GoogleMapService
     */
    SetZoom(zoom) {
        return this._map.then((map) => map.setZoom(zoom));
    }
    /**
     * Creates an event subscription
     *
     * @param eventName - The name of the event (e.g. 'click')
     * @returns - An observable of type E that fires when the event occurs.
     *
     * @memberof GoogleMapService
     */
    SubscribeToMapEvent(eventName) {
        const googleEventName = GoogleMapEventsLookup[eventName];
        return Observable.create((observer) => {
            this._map.then((m) => {
                m.addListener(googleEventName, (e) => {
                    this._zone.run(() => observer.next(e));
                });
            });
        });
    }
    /**
     * Triggers the given event name on the map instance.
     *
     * @param eventName - Event to trigger.
     * @returns - A promise that is fullfilled once the event is triggered.
     *
     * @memberof GoogleMapService
     */
    TriggerMapEvent(eventName) {
        return this._map.then((m) => google.maps.event.trigger(m, eventName, null));
    }
}
GoogleMapService.decorators = [
    { type: Injectable }
];
GoogleMapService.ctorParameters = () => [
    { type: MapAPILoader },
    { type: NgZone }
];

/**
 * Concrete implementation of the Polygon Service abstract class for Google Maps.
 *
 * @export
 */
class GooglePolygonService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GooglePolygonService.
     * @param _mapService - {@link MapService} instance. The concrete {@link GoogleMapService} implementation is expected.
     * @param _layerService - {@link GoogleLayerService} instance.
     * The concrete {@link GoogleLayerService} implementation is expected.
     * @param _zone - NgZone instance to support zone aware promises.
     *
     * @memberof GooglePolygonService
     */
    constructor(_mapService, _layerService, _zone) {
        this._mapService = _mapService;
        this._layerService = _layerService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._polygons = new Map();
    }
    ///
    /// Public members and MarkerService implementation
    ///
    /**
     * Adds a polygon to a map. Depending on the polygon context, the polygon will either by added to the map or a
     * correcsponding layer.
     *
     * @param polygon - The {@link MapPolygonDirective} to be added.
     *
     * @memberof GooglePolygonService
     */
    AddPolygon(polygon) {
        const o = {
            id: polygon.Id,
            clickable: polygon.Clickable,
            draggable: polygon.Draggable,
            editable: polygon.Editable,
            fillColor: polygon.FillColor,
            fillOpacity: polygon.FillOpacity,
            geodesic: polygon.Geodesic,
            labelMaxZoom: polygon.LabelMaxZoom,
            labelMinZoom: polygon.LabelMinZoom,
            paths: polygon.Paths,
            showLabel: polygon.ShowLabel,
            showTooltip: polygon.ShowTooltip,
            strokeColor: polygon.StrokeColor,
            strokeOpacity: polygon.StrokeOpacity,
            strokeWeight: polygon.StrokeWeight,
            title: polygon.Title,
            visible: polygon.Visible,
            zIndex: polygon.zIndex,
        };
        const polygonPromise = this._mapService.CreatePolygon(o);
        this._polygons.set(polygon, polygonPromise);
    }
    /**
      * Registers an event delegate for a polygon.
      *
      * @param eventName - The name of the event to register (e.g. 'click')
      * @param polygon - The {@link MapPolygonDirective} for which to register the event.
      * @returns - Observable emiting an instance of T each time the event occurs.
      *
      * @memberof GooglePolygonService
      */
    CreateEventObservable(eventName, polygon) {
        return Observable.create((observer) => {
            this._polygons.get(polygon).then((p) => {
                p.AddListener(eventName, (e) => this._zone.run(() => observer.next(e)));
            });
        });
    }
    /**
      * Deletes a polygon.
      *
      * @param polygon - {@link MapPolygonDirective} to be deleted.
      * @returns - A promise fullfilled once the polygon has been deleted.
      *
      * @memberof GooglePolygonService
      */
    DeletePolygon(polygon) {
        const m = this._polygons.get(polygon);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then((l) => {
            return this._zone.run(() => {
                l.Delete();
                this._polygons.delete(polygon);
            });
        });
    }
    /**
     * Obtains geo coordinates for the polygon on the click location
     *
     * @abstract
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked marker.
     *
     * @memberof GooglePolygonService
     */
    GetCoordinatesFromClick(e) {
        return { latitude: e.latLng.lat(), longitude: e.latLng.lng() };
    }
    /**
     * Obtains the polygon model for the polygon allowing access to native implementation functionatiliy.
     *
     * @param polygon - The {@link MapPolygonDirective} for which to obtain the polygon model.
     * @returns - A promise that when fullfilled contains the {@link Polygon} implementation of the underlying platform.
     *
     * @memberof GooglePolygonService
     */
    GetNativePolygon(polygon) {
        return this._polygons.get(polygon);
    }
    /**
     * Set the polygon options.
     *
     * @param polygon - {@link MapPolygonDirective} to be updated.
     * @param options - {@link IPolygonOptions} object containing the options. Options will be merged with the
     * options already on the underlying object.
     * @returns - A promise fullfilled once the polygon options have been set.
     *
     * @memberof GooglePolygonService
     */
    SetOptions(polygon, options) {
        return this._polygons.get(polygon).then((l) => { l.SetOptions(options); });
    }
    /**
     * Updates the Polygon path
     *
     * @param polygon - {@link MapPolygonDirective} to be updated.
     * @returns - A promise fullfilled once the polygon has been updated.
     *
     * @memberof GooglePolygonService
     */
    UpdatePolygon(polygon) {
        const m = this._polygons.get(polygon);
        if (m == null || polygon.Paths == null || !Array.isArray(polygon.Paths) || polygon.Paths.length === 0) {
            return Promise.resolve();
        }
        return m.then((l) => {
            if (Array.isArray(polygon.Paths[0])) {
                l.SetPaths(polygon.Paths);
            }
            else {
                l.SetPath(polygon.Paths);
            }
        });
    }
}
GooglePolygonService.decorators = [
    { type: Injectable }
];
GooglePolygonService.ctorParameters = () => [
    { type: MapService },
    { type: LayerService },
    { type: NgZone }
];

/**
 * Concrete implementation of the Polyline Service abstract class for Google Maps.
 *
 * @export
 */
class GooglePolylineService {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GooglePolylineService.
     * @param _mapService - {@link MapService} instance. The concrete {@link GoogleMapService} implementation is expected.
     * @param _layerService - {@link LayerService} instance.
     * The concrete {@link GoogleLayerService} implementation is expected.
     * @param _zone - NgZone instance to support zone aware promises.
     *
     * @memberof GooglePolylineService
     */
    constructor(_mapService, _layerService, _zone) {
        this._mapService = _mapService;
        this._layerService = _layerService;
        this._zone = _zone;
        ///
        /// Field declarations
        ///
        this._polylines = new Map();
    }
    ///
    /// Public members and MarkerService implementation
    ///
    /**
     * Adds a polyline to a map. Depending on the polyline context, the polyline will either by added to the map or a
     * correcsponding layer.
     *
     * @param polyline - The {@link MapPolylineDirective} to be added.
     *
     * @memberof GooglePolylineService
     */
    AddPolyline(polyline) {
        const o = {
            id: polyline.Id,
            clickable: polyline.Clickable,
            draggable: polyline.Draggable,
            editable: polyline.Editable,
            geodesic: polyline.Geodesic,
            path: polyline.Path,
            showTooltip: polyline.ShowTooltip,
            strokeColor: polyline.StrokeColor,
            strokeOpacity: polyline.StrokeOpacity,
            strokeWeight: polyline.StrokeWeight,
            title: polyline.Title,
            visible: polyline.Visible,
            zIndex: polyline.zIndex,
        };
        const polylinePromise = this._mapService.CreatePolyline(o);
        this._polylines.set(polyline, polylinePromise);
    }
    /**
      * Registers an event delegate for a line.
      *
      * @param eventName - The name of the event to register (e.g. 'click')
      * @param polyline - The {@link MapPolylineDirective} for which to register the event.
      * @returns - Observable emiting an instance of T each time the event occurs.
      *
      * @memberof GooglePolylineService
      */
    CreateEventObservable(eventName, polyline) {
        return Observable.create((observer) => {
            this._polylines.get(polyline).then(p => {
                const x = Array.isArray(p) ? p : [p];
                x.forEach(line => line.AddListener(eventName, (e) => this._zone.run(() => observer.next(e))));
            });
        });
    }
    /**
      * Deletes a polyline.
      *
      * @param polyline - {@link MapPolylineDirective} to be deleted.
      * @returns - A promise fullfilled once the polyline has been deleted.
      *
      * @memberof GooglePolylineService
      */
    DeletePolyline(polyline) {
        const m = this._polylines.get(polyline);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then(l => {
            return this._zone.run(() => {
                const x = Array.isArray(l) ? l : [l];
                x.forEach(line => line.Delete());
                this._polylines.delete(polyline);
            });
        });
    }
    /**
     * Obtains geo coordinates for the line on the click location
     *
     * @abstract
     * @param e - The mouse event.
     * @returns - {@link ILatLong} containing the geo coordinates of the clicked line.
     *
     * @memberof GooglePolylineService
     */
    GetCoordinatesFromClick(e) {
        if (!e) {
            return null;
        }
        if (!e.latLng) {
            return null;
        }
        if (!e.latLng.lat || !e.latLng.lng) {
            return null;
        }
        return { latitude: e.latLng.lat(), longitude: e.latLng.lng() };
    }
    /**
     * Obtains the polyline model for the line allowing access to native implementation functionatiliy.
     *
     * @param polyline - The {@link MapPolylineDirective} for which to obtain the polyline model.
     * @returns - A promise that when fullfilled contains the {@link Polyline}
     * implementation of the underlying platform. For complex paths, returns an array of polylines.
     *
     * @memberof GooglePolylineService
     */
    GetNativePolyline(polyline) {
        return this._polylines.get(polyline);
    }
    /**
     * Set the polyline options.
     *
     * @param polyline - {@link MapPolylineDirective} to be updated.
     * @param options - {@link IPolylineOptions} object containing the options. Options will be merged with the
     * options already on the underlying object.
     * @returns - A promise fullfilled once the polyline options have been set.
     *
     * @memberof GooglePolylineService
     */
    SetOptions(polyline, options) {
        return this._polylines.get(polyline).then(l => {
            const x = Array.isArray(l) ? l : [l];
            x.forEach(line => line.SetOptions(options));
        });
    }
    /**
     * Updates the Polyline path
     *
     * @param polyline - {@link MapPolylineDirective} to be updated.
     * @returns - A promise fullfilled once the polyline has been updated.
     *
     * @memberof GooglePolylineService
     */
    UpdatePolyline(polyline) {
        const m = this._polylines.get(polyline);
        if (m == null) {
            return Promise.resolve();
        }
        return m.then(l => this._zone.run(() => {
            const x = Array.isArray(l) ? l : [l];
            const p = polyline.Path.length > 0 && Array.isArray(polyline.Path[0]) ? polyline.Path :
                [polyline.Path];
            x.forEach((line, index) => {
                if (p.length > index) {
                    line.SetPath(p[index]);
                }
            });
            if (Array.isArray(l) && l.length > p.length) {
                l.splice(p.length - 1).forEach(line => line.Delete());
            }
        }));
    }
}
GooglePolylineService.decorators = [
    { type: Injectable }
];
GooglePolylineService.ctorParameters = () => [
    { type: MapService },
    { type: LayerService },
    { type: NgZone }
];

/**
 * Implements a factory to create three necessary Google Maps specific service instances.
 *
 * @export
 */
class GoogleMapServiceFactory {
    ///
    /// Constructor
    ///
    /**
     * Creates an instance of GoogleMapServiceFactory.
     * @param _loader - {@link MapAPILoader} implementation for the Google Map provider.
     * @param _zone - NgZone object to implement zone aware promises.
     *
     * @memberof GoogleMapServiceFactory
     */
    constructor(_loader, _zone) {
        this._loader = _loader;
        this._zone = _zone;
        this._map =
            new Promise((resolve) => { this._mapResolver = resolve; });
    }
    ///
    /// Public methods and MapServiceFactory implementation.
    ///
    /**
     * Creates the map service for the Google Maps implementation.
     *
     * @returns - {@link MapService}. A concreted instance of the {@link GoogleMapService}.
     *
     * @memberof GoogleMapServiceFactory
     */
    Create() {
        return new GoogleMapService(this._loader, this._zone);
    }
    /**
     * Creates the cluster service for the Google Maps implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link GoogleMapService}.
     * @returns - {@link ClusterService}. A concreted instance of the {@link GoogleClusterService}.
     *
     * @memberof GoogleMapServiceFactory
     */
    CreateClusterService(_mapService) {
        return new GoogleClusterService(_mapService, this._zone);
    }
    /**
     * Creates thh info box service for the Google Maps implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link GoogleMapService}.
     * @param map - {@link MarkerService}. A concreted instance of the {@link GoogleMarkerService}.
     * @returns - {@link InfoBoxService}. A concreted instance of the {@link GoogleInfoBoxService}.
     *
     * @memberof GoogleMapServiceFactory
     */
    CreateInfoBoxService(_mapService, _markerService) {
        return new GoogleInfoBoxService(_mapService, _markerService, this._zone);
    }
    /**
     * Creates the layer service for the Google Maps implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link GoogleMapService}.
     * @returns - {@link LayerService}. A concreted instance of the {@link GoogleLayerService}.
     *
     * @memberof GoogleMapServiceFactory
     */
    CreateLayerService(_mapService) {
        return new GoogleLayerService(_mapService, this._zone);
    }
    /**
     * Creates the marker service for the Google Maps implementation.
     *
     * @param map - {@link MapService}. A concreted instance of the {@link GoogleMapService}.
     * @param layers - {@link LayerService}. A concreted instance of the {@link GoogleLayerService}.
     * @param clusters  - {@link ClusterService}. A concreted instance of the {@link GoogleClusterService}.
     * @returns - {@link MarkerService}. A concreted instance of the {@link GoogleMarkerService}.
     *
     * @memberof GoogleMapServiceFactory
     */
    CreateMarkerService(_mapService, _layerService, _clusterService) {
        return new GoogleMarkerService(_mapService, _layerService, _clusterService, this._zone);
    }
    /**
     * Creates the polygon service for the Google Maps implementation.
     *
     * @param map - {@link MapService} implementation for thh underlying map archticture.
     * @param layers - {@link LayerService} implementation for the underlying map architecture.
     * @returns - {@link PolygonService} implementation for the underlying map architecture.
     *
     * @memberof MapServiceFactory
     */
    CreatePolygonService(map, layers) {
        return new GooglePolygonService(map, layers, this._zone);
    }
    /**
     * Creates the polyline service for the Google Maps implementation.
     *
     * @param map - {@link MapService} implementation for thh underlying map archticture.
     * @param layers - {@link LayerService} implementation for the underlying map architecture.
     * @returns - {@link PolylineService} implementation for the underlying map architecture.
     *
     * @memberof MapServiceFactory
     */
    CreatePolylineService(map, layers) {
        return new GooglePolylineService(map, layers, this._zone);
    }
}
GoogleMapServiceFactory.decorators = [
    { type: Injectable }
];
GoogleMapServiceFactory.ctorParameters = () => [
    { type: MapAPILoader },
    { type: NgZone }
];
/**
 *  Creates a new instance of a plaform specific MapServiceFactory.
 *
 * @param apiLoader - An {@link MapAPILoader} instance. This is expected to the a {@link GoogleMapAPILoader}.
 * @param zone - An NgZone instance to provide zone aware promises.
 *
 * @returns - A {@link MapServiceFactory} instance.
 */
function GoogleMapServiceFactoryFactory(apiLoader, zone) {
    return new GoogleMapServiceFactory(apiLoader, zone);
}
/**
 * Creates a new instance of a plaform specific MapLoaderFactory.
 *
 * @export
 * @returns - A {@link MapAPILoader} instance.
 */
function GoogleMapLoaderFactory() {
    return new GoogleMapAPILoader(new GoogleMapAPILoaderConfig(), new WindowRef(), new DocumentRef());
}

///
/// define module
///
class MapModule {
    static forRoot(mapServiceFactory, loader) {
        return {
            ngModule: MapModule,
            providers: [
                mapServiceFactory ? { provide: MapServiceFactory, useValue: mapServiceFactory } :
                    { provide: MapServiceFactory, deps: [MapAPILoader, NgZone], useFactory: BingMapServiceFactoryFactory },
                loader ? { provide: MapAPILoader, useValue: loader } : { provide: MapAPILoader, useFactory: BingMapLoaderFactory },
                DocumentRef,
                WindowRef
            ]
        };
    }
    static forRootBing() {
        return {
            ngModule: MapModule,
            providers: [
                { provide: MapServiceFactory, deps: [MapAPILoader, NgZone], useFactory: BingMapServiceFactoryFactory },
                { provide: MapAPILoader, useFactory: BingMapLoaderFactory },
                DocumentRef,
                WindowRef
            ]
        };
    }
    static forRootGoogle() {
        return {
            ngModule: MapModule,
            providers: [
                { provide: MapServiceFactory, deps: [MapAPILoader, NgZone], useFactory: GoogleMapServiceFactoryFactory },
                { provide: MapAPILoader, useFactory: GoogleMapLoaderFactory },
                DocumentRef,
                WindowRef
            ]
        };
    }
}
MapModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    MapLayerDirective,
                    MapComponent,
                    MapMarkerDirective,
                    InfoBoxComponent,
                    InfoBoxActionDirective,
                    MapPolygonDirective,
                    MapPolylineDirective,
                    ClusterLayerDirective,
                    MapMarkerLayerDirective,
                    MapPolygonLayerDirective,
                    MapPolylineLayerDirective
                ],
                imports: [CommonModule],
                exports: [
                    CommonModule,
                    MapComponent,
                    MapMarkerDirective,
                    MapPolygonDirective,
                    MapPolylineDirective,
                    InfoBoxComponent,
                    InfoBoxActionDirective,
                    MapLayerDirective,
                    ClusterLayerDirective,
                    MapMarkerLayerDirective,
                    MapPolygonLayerDirective,
                    MapPolylineLayerDirective
                ]
            },] }
];

/**
 * Generated bundle index. Do not edit.
 */

export { BingCanvasOverlay, BingClusterLayer, BingClusterService, BingInfoBoxService, BingInfoWindow, BingLayer, BingLayerService, BingMapAPILoader, BingMapAPILoaderConfig, BingMapEventsLookup, BingMapService, BingMapServiceFactory, BingMarker, BingMarkerService, BingPolygon, BingPolygonService, BingPolyline, BingPolylineService, BingSpiderClusterMarker, CanvasOverlay, ClusterClickAction, ClusterLayerDirective, ClusterPlacementMode, ClusterService, DocumentRef, GoogleCanvasOverlay, GoogleClusterService, GoogleInfoBoxService, GoogleInfoWindow, GoogleLayerService, GoogleMapAPILoader, GoogleMapAPILoaderConfig, GoogleMapEventsLookup, GoogleMapService, GoogleMapServiceFactory, GoogleMarker, GoogleMarkerService, GooglePolygon, GooglePolygonService, GooglePolyline, GooglePolylineService, InfoBoxActionDirective, InfoBoxComponent, InfoBoxService, InfoWindow, Layer, LayerService, MapAPILoader, MapComponent, MapLayerDirective, MapMarkerDirective, MapMarkerLayerDirective, MapModule, MapPolygonDirective, MapPolygonLayerDirective, MapPolylineDirective, MapPolylineLayerDirective, MapService, MapServiceFactory, MapTypeId, Marker, MarkerService, MarkerTypeId, Polygon, PolygonService, Polyline, PolylineService, SpiderClusterMarker, WindowRef, ClusterServiceFactory as ɵa, InfoBoxServiceFactory as ɵb, LayerServiceFactory as ɵc, MapServiceCreator as ɵd, MarkerServiceFactory as ɵe, PolygonServiceFactory as ɵf, PolylineServiceFactory as ɵg, BingMapServiceFactoryFactory as ɵh, BingMapLoaderFactory as ɵi, GoogleMapServiceFactoryFactory as ɵj, GoogleMapLoaderFactory as ɵk, BingLayerBase as ɵl, GoogleLayerBase as ɵm };
//# sourceMappingURL=angular-maps-v9.js.map
