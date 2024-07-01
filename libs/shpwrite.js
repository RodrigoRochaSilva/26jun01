(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.shpwrite = f()}})(function(){var define,module,exports;return function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r}()({1:[function(require,module,exports){
var dbf = require('dbf');
var zip = require('jszip')();
var prj = require('./prj');

function writePoint(coordinates, properties) {
  return {
    type: 'Feature',
    properties: properties,
    geometry: {
      type: 'Point',
      coordinates: coordinates
    }
  };
}

function writeLineString(coordinates, properties) {
  return {
    type: 'Feature',
    properties: properties,
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    }
  };
}

function writePolygon(coordinates, properties) {
  return {
    type: 'Feature',
    properties: properties,
    geometry: {
      type: 'Polygon',
      coordinates: coordinates
    }
  };
}

function geojsonToFeatureCollection(geojson) {
  if (geojson.type === 'FeatureCollection') {
    return geojson;
  } else {
    return {
      type: 'FeatureCollection',
      features: [geojson]
    };
  }
}

function geojsonToShapefile(geojson, options) {
  options = options || {};

  var fc = geojsonToFeatureCollection(geojson),
      properties = [],
      shapes = [];

  fc.features.forEach(function(feature) {
    properties.push(feature.properties);
    shapes.push(feature.geometry);
  });

  return {
    type: 'shapefile',
    fileName: options.fileName || 'shapefile',
    geometries: shapes,
    properties: properties
  };
}

function writeShapefile(geojson, options) {
  var shapefile = geojsonToShapefile(geojson, options);

  var shpBuffer = new ArrayBuffer(100),
      shpDataView = new DataView(shpBuffer),
      shpBytes = new Uint8Array(shpBuffer);

  var writeGeometry = function(type, geometries, properties) {
    if (type === 'Point') {
      geometries.forEach(function(geometry, i) {
        zip.file('shapefile.shp', writePoint(geometry.coordinates, properties[i]), { binary: true });
      });
    } else if (type === 'LineString') {
      geometries.forEach(function(geometry, i) {
        zip.file('shapefile.shp', writeLineString(geometry.coordinates, properties[i]), { binary: true });
      });
    } else if (type === 'Polygon') {
      geometries.forEach(function(geometry, i) {
        zip.file('shapefile.shp', writePolygon(geometry.coordinates, properties[i]), { binary: true });
      });
    }
  };

  writeGeometry(shapefile.geometries[0].type, shapefile.geometries, shapefile.properties);

  var dbfBuffer = dbf.structure([
    { name: 'ID', type: 'C', size: 10 }
  ]);

  zip.file('shapefile.dbf', new Uint8Array(dbfBuffer), { binary: true });
  zip.file('shapefile.prj', prj);
  return zip.generateAsync({ type: 'blob' });
}

module.exports = writeShapefile;

},{"./prj":2,"dbf":3,"jszip":4}],2:[function(require,module,exports){
module.exports = [
  'GEOGCS["WGS 84",',
  '  DATUM["WGS_1984",',
  '    SPHEROID["WGS 84",6378137,298.257223563,',
  '      AUTHORITY["EPSG","7030"]],',
  '    AUTHORITY["EPSG","6326"]],',
  '  PRIMEM["Greenwich",0,',
  '    AUTHORITY["EPSG","8901"]],',
  '  UNIT["degree",0.01745329251994328,',
  '    AUTHORITY["EPSG","9122"]],',
  '  AUTHORITY["EPSG","4326"]]'
].join('\n');

},{}],3:[function(require,module,exports){
module.exports = function structure(fields) {
  var rows = [], i, buffer;

  buffer = new ArrayBuffer(32 + 32 * fields.length + 1);
  rows.push(buffer);

  for (i = 0; i < fields.length; i++) {
    rows.push(dbfField(fields[i]));
  }

  rows.push(0x0D);
  return new Uint8Array(rows.flat());
};

function dbfField(field) {
  var buffer = new ArrayBuffer(32),
      view = new DataView(buffer);

  var name = field.name,
      type = field.type,
      size = field.size;

  for (var i = 0; i < name.length; i++) {
    view.setUint8(i, name.charCodeAt(i));
  }

  view.setUint8(11, type.charCodeAt(0));
  view.setUint8(16, size);
  return new Uint8Array(buffer);
}

},{}],4:[function(require,module,exports){
module.exports = require("jszip");

},{"jszip":5}],5:[function(require,module,exports){
// JSZip implementation
},{}]},{},[1])(1)
});
