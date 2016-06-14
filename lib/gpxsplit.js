(function () {

    var chalk = require('chalk');
    var prettyJSON = require('prettyjson');
    var filepath = require('filepath');
    var Q = require('q');
    var XML = require('pixl-xml');

    function GpxSplit(options) {

        this.options = options;

        this.options.decimals = Math.min(Math.max(this.options.decimals, 3), 7);

        if (!this.options.split) {
            this.options.split = 500;
        }

        if (!this.options.postfix) {
            this.options.postfix = '-split';
        }

        if (!this.options.waypoints) {
            this.options.waypoints = 5;
        }

        if (!this.options.decimals) {
            this.options.decimals = 6;
        }

        if (this.options.noSplit) {
            this.options.split = 0;
        }

        if (this.options.noWaypoints) {
            this.options.waypoints = 0;
        }

        if ((this.options.output === false) || (this.options.output === 0)) {

            var path = filepath.create(this.options.fileToProcess);
            var base = path.basename(path.extname());

            if (base.endsWith(this.options.postfix)) {
                this.options.backup = true;
                this.options.output = this.options.fileToProcess;
            } else {
                this.options.output = filepath.create(path.dir(), base + this.options.postfix + path.extname());
            }
        }

    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.normaliseCoordinate = function (coord) {
        return this.cutDecimalZeros(parseFloat(coord).toFixed(this.options.decimals));
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.normaliseElevation = function (coord) {
        return this.cutDecimalZeros(parseFloat(coord).toFixed(3));
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.cutDecimalZeros = function (coord) {
        var normSplit = coord.split('.');
        var decimals = normSplit[1];
        while (decimals.substr(decimals.length - 1) === '0') {
            decimals = decimals.substr(0, decimals.length - 1);
        }
        if (decimals.length === 0) {
            decimals = '0';
        }
        return normSplit[0] + '.' + decimals;
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.dump = function () {
        console.log(prettyJSON.render(this.gpx));
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.process = function () {

        this.resetBounds();

        if (this.gpx.trk) {
            var tracks = [];
            if (this.gpx.trk.length) {
                for (var i = 0; i < this.gpx.trk.length; i++) {
                    tracks = tracks.concat(this.processTrack(this.gpx.trk[i]));
                }
            } else {
                tracks = tracks.concat(this.processTrack(this.gpx.trk));
            }

            this.gpx.trk = tracks;
        }

        this.finaliseBounds();

        for (var i = 0; i < this.gpx.trk.length; i++) {
            this.gpx.trk[i] = this.normaliseTrack(this.gpx.trk[i]);
        }

        this.gpx.$creator = "GPX Split v" + this.options.version;
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.normaliseTrack = function (track) {
        if (track.trkseg.trkpt) {
            for (var i = 0; i < track.trkseg.trkpt.length; i++) {
                track.trkseg.trkpt[i].$lat = this.normaliseCoordinate(track.trkseg.trkpt[i].$lat);
                track.trkseg.trkpt[i].$lon = this.normaliseCoordinate(track.trkseg.trkpt[i].$lon);
                if (track.trkseg.trkpt[i].ele) {
                    track.trkseg.trkpt[i].ele = this.normaliseElevation(track.trkseg.trkpt[i].ele);
                }
            }
        }
        return track;
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.processTrack = function (track) {

        if ((this.options.waypoints) && (this.options.waypoints > 0)) {
            if (track.trkseg.trkpt) {
                this.generateWaypoints(track.trkseg.trkpt);
            }
        }

        if (track.trkseg.trkpt) {
            for (var i = 0; i < track.trkseg.trkpt.length; i++) {
                this.updateBounds(track.trkseg.trkpt[i].$lat, track.trkseg.trkpt[i].$lon);
            }
        }

        if ((this.options.split) && (this.options.split > 0)) {
            if (track.trkseg.trkpt) {
                if (track.trkseg.trkpt.length > this.options.split) {
                    return this.splitTrack(track);
                }
            }
        }

        // default fallback
        return [track];
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.splitTrack = function (track) {
        var tracks = [];
        var segments = [];

        var copyNo = 0;

        for (var i = 0; i < track.trkseg.trkpt.length; i++) {
            if ((i > 0) && ((i % this.options.split) == 0)) {
                if (segments.length > 1) {
                    tracks.push(this.makeTrackCopy(track, segments, ++copyNo));
                }
                segments = [segments[segments.length - 1]];
            }
            segments.push(track.trkseg.trkpt[i]);
        }

        if (segments.length > 1) {
            tracks.push(this.makeTrackCopy(track, segments, ++copyNo));
        }

        return tracks;
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.makeTrackCopy = function (track, segments, no) {
        var trackCopy = JSON.parse(JSON.stringify(track));
        trackCopy.trkseg.trkpt = segments;
        if (trackCopy.name) {
            if (!this.options.noNameFix) {
                trackCopy.name = this.shortenName(track.name, no + "");
            }
        }

        if (!trackCopy.extensions) {
            trackCopy.extensions = {};
        }

        if (!trackCopy.extensions.label) {
            trackCopy.extensions.label = [];
        }

        trackCopy.extensions.label.push({"$xmlns": "http://www.topografix.com/GPX/gpx_overlay/0/3", "label_text": track.name + " " + no})

        if (!trackCopy.extensions["gpxx:TrackExtension"]) {
            trackCopy.extensions["gpxx:TrackExtension"] = [];
        }

        var color = (no % 2 === 1) ? "Red" : "Blue";

        trackCopy.extensions["gpxx:TrackExtension"].push({
            "$xmlns:gpxx": "http://www.garmin.com/xmlschemas/GpxExtensions/v3",
            "gpxx:DisplayColor": color
        });

        return trackCopy;
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.capitalize = function (s) {
        return s && s[0].toUpperCase() + s.slice(1);
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.shortenName = function (base, no) {
        var full = base + " " + no;
        if (full.length <= 13) {
            return full;
        } else if (full.length === 14) {
            return base + no;
        } else {
            var baseSum = "";
            var tab = base.replace(/\s\s+/g, ' ').split(" ");
            for (var i = 0; i < tab.length; i++) {
                baseSum += this.capitalize(tab[i]);
            }
            return baseSum.substr(0, 13 - no.length) + no;
        }
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.resetBounds = function () {
        if (!this.gpx.metadata) {
            this.gpx.metadata = {};
        }

        this.gpx.metadata.bounds = {
            "$minlat": 90.0,
            "$minlon": 180.0,
            "$maxlat": -90.0,
            "$maxlon": -180
        };
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.updateBounds = function (lat, lon) {
        lat = parseFloat(lat);
        lon = parseFloat(lon);

        if (lat <= this.gpx.metadata.bounds.$minlat) {
            this.gpx.metadata.bounds.$minlat = lat;
        }
        if (lat >= this.gpx.metadata.bounds.$maxlat) {
            this.gpx.metadata.bounds.$maxlat = lat;
        }
        if (lon <= this.gpx.metadata.bounds.$minlon) {
            this.gpx.metadata.bounds.$minlon = lon;
        }
        if (lon >= this.gpx.metadata.bounds.$maxlon) {
            this.gpx.metadata.bounds.$maxlon = lon;
        }
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.finaliseBounds = function () {
        this.gpx.metadata.bounds.$minlat = this.normaliseCoordinate(this.gpx.metadata.bounds.$minlat);
        this.gpx.metadata.bounds.$maxlat = this.normaliseCoordinate(this.gpx.metadata.bounds.$maxlat);
        this.gpx.metadata.bounds.$minlon = this.normaliseCoordinate(this.gpx.metadata.bounds.$minlon);
        this.gpx.metadata.bounds.$maxlon = this.normaliseCoordinate(this.gpx.metadata.bounds.$maxlon);
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.generateWaypoints = function (trackPoints) {
        var LatLon = require('geodesy').LatLonEllipsoidal;
        var kmSum = 0;
        var dist = 0;
        var treshold = this.options.waypoints * 1000;
        var last = trackPoints[0];
        for (var i = 1; i < trackPoints.length; i++) {
            var p1 = new LatLon(last.$lat, last.$lon);
            var p2 = new LatLon(trackPoints[i].$lat, trackPoints[i].$lon);
            var d = p1.distanceTo(p2);
            kmSum += d;
            if (kmSum >= treshold) {
                kmSum -= treshold;
                dist += treshold;
                this.addWaypoint(trackPoints[i], dist);
            }
            last = trackPoints[i];
        }
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.addWaypoint = function (point, distanceM) {

        var symbol = Math.floor(distanceM / 1000) + " Km";
        var waypoint = {
            "$lat": this.normaliseCoordinate(point.$lat),
            "$lon": this.normaliseCoordinate(point.$lon),
            "name": symbol,
            "cmt": symbol,
            "desc": symbol,
            "sym": "Bell",
            "extensions": {"label": {"$xmlns": "http://www.topografix.com/GPX/gpx_overlay/0/3", "label_text": symbol}}
        };


        if (!this.gpx.wpt) {
            this.gpx.wpt = [];
        }

        this.gpx.wpt.push(waypoint);
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.splitAttributes = function (obj) {
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (property == '_Attribs') {
                    for (var attrprop in obj._Attribs) {
                        if (obj._Attribs.hasOwnProperty(attrprop)) {
                            obj["$" + attrprop] = obj._Attribs[attrprop];
                        }
                    }
                    delete(obj[property]);
                } else if (typeof obj[property] == "object") {
                    this.splitAttributes(obj[property]);
                }
            }
        }
        return obj;
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.joinAttributes = function (obj) {
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (property.startsWith('$')) {
                    if (!obj._Attribs) {
                        obj._Attribs = {};
                    }
                    obj._Attribs[property.substring(1)] = obj[property];
                    delete(obj[property]);
                } else if (typeof obj[property] == "object") {
                    this.joinAttributes(obj[property]);
                }
            }
        }
        return obj;
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.read = function () {
        var self = this;
        var d = Q.defer();
        var source = filepath.create(this.options.fileToProcess);
        source
                .read()
                .then(function (xmlString) {
                    this.gpx = XML.parse(xmlString, {preserveAttributes: true});
                    this.gpx = this.splitAttributes(this.gpx);
                }.bind(self))
                .then(d.resolve)
                .catch(d.reject)

        return d.promise;
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.save = function () {

        if (this.options.backup) {
            filepath.create(this.options.fileToProcess).copy(this.options.fileToProcess + ".bak", {sync: true});
            console.log(chalk.green("Created backup: ") + chalk.white(this.options.fileToProcess + ".bak"));
        }

        this.saveToXML();
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.saveToXML = function () {
        var syncPath = filepath.create(this.options.output);
        syncPath.write(this.gpxToXML(), {sync: true});
        console.log(chalk.green("Output to: ") + chalk.white(this.options.output));
    }

    //--------------------------------------------------------------------------

    GpxSplit.prototype.gpxToXML = function () {
        this.gpx = this.joinAttributes(this.gpx);
        return XML.stringify(this.gpx, 'gpx');
    }

    //--------------------------------------------------------------------------

    if (typeof module != 'undefined' && module.exports) {
        module.exports = GpxSplit;
    }

}());