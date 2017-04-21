var stream = require('stream'),
    util = require('util'),
    assert = require('assert'),
    gdal = require('gdal');

module.exports.createWriteStreams = createWriteStreams;
module.exports.PixelWriter = PixelWriter;

function createWriteStreams(filepath, metadata, options) {
  var streams = [],
      dst = gdal.open(
      filepath,
      'w',
      metadata.driver,
      metadata.width,
      metadata.height,
      metadata.numBands,
      metadata.type
    );
  dst.srs = metadata.srs;
  dst.geoTransform = metadata.geotransform;

  dst.bands.forEach(function(band) {
    streams.push(new PixelWriter(dst, band.id, options));
  });

  return streams;
}

util.inherits(PixelWriter, stream.Writable);
function PixelWriter(gdalDst, bandId, options) {
  options = options || {};
  options.objectMode = true;
  options.highWaterMark = 100; // don't buffer too many blocks in memory

  this._band = gdalDst.bands.get(bandId);
  this._dst = gdalDst;

  this.metadata = {
    driver: gdalDst.driver.description,
    width: gdalDst.rasterSize.x,
    height: gdalDst.rasterSize.y,
    numBands: gdalDst.bands.count(),
    srs: gdalDst.srs.clone(),
    geotransform: gdalDst.geoTransform,
    id: this._band.id,
    type: this._band.dataType,
    blockSize: this._band.blockSize
  };

  stream.Writable.call(this, options);

  var _this = this;

  this.on('pipe', function(readable) {
    try {
      assert.equal(_this.metadata.width, readable.metadata.width);
      assert.equal(_this.metadata.height, readable.metadata.height);
    }
    catch (err) {
      _this.emit('error', new Error('Image dimensions do not match'));
    }
  });
}

PixelWriter.prototype.set = function(what, value) {
  this._band[what] = value;
  return this;
};

PixelWriter.prototype._write = function(data, enc, callback) {
  var height = data.blockSize.y,
      width = data.blockSize.x,
      offset = {
        x: data.offset.x * data.blockSize.x,
        y: data.offset.y * data.blockSize.y
      };

  try {
    this._band.pixels.write(offset.x, offset.y, width, height, data.buffer);
    this._dst.flush();
  }
  catch (err) {
    return callback(err);
  }

  setImmediate(callback);
};
