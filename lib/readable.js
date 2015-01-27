var stream = require('stream');
var util = require('util');
var gdal = require('gdal');

module.exports.createReadStreams = createReadStreams;
module.exports.PixelReader = PixelReader;

function createReadStreams(filepath, options) {
  var src = gdal.open(filepath);
  var streams = [];

  src.bands.forEach(function(band) {
    var gdalSrc = gdal.open(filepath);
    streams.push(new PixelReader(gdalSrc, band.id, options));
  });

  return streams;
}

util.inherits(PixelReader, stream.Readable);
function PixelReader(gdalSrc, bandId, options) {
  this._band = gdalSrc.bands.get(bandId);
  this._src = gdalSrc;

  this.metadata = {
    driver: gdalSrc.driver.description,
    width: gdalSrc.rasterSize.x,
    height: gdalSrc.rasterSize.y,
    numBands: gdalSrc.bands.count(),
    srs: gdalSrc.srs.clone(),
    geotransform: gdalSrc.geoTransform,
    id: this._band.id,
    type: this._band.dataType,
    blockSize: this._band.blockSize
  };

  var offset = { x: -1, y: 0 };
  var max = {
    x: Math.ceil(this._band.size.x / this._band.blockSize.x) - 1,
    y: Math.ceil(this._band.size.y / this._band.blockSize.y) - 1
  };

  this._next = function() {
    if (offset.x < max.x) offset.x++;
    else {
      offset.x = 0;
      offset.y++;
    }

    if (offset.y > max.y) return null;
    return { x: offset.x, y: offset.y };
  };

  options = options || {};
  options.objectMode = true;
  stream.Readable.call(this, options);
}

PixelReader.prototype._read = function(size) {
  var offset = this._next();
  if (!offset) return this.push(null);

  var data = this._band.pixels.readBlock(offset.x, offset.y);
  setImmediate(this.push.bind(this), {
    offset: offset,
    buffer: data
  });
};
