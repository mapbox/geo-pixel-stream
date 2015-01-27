var stream = require('stream');
var util = require('util');
var gdal = require('gdal');

module.exports.createWriteStream = createWriteStream;
module.exports.PixelWriter = PixelWriter;

function createWriteStream(filepath, metadata, options) {
  return new PixelWriter(filepath, metadata, options);
}

util.inherits(PixelWriter, stream.Writable);
function PixelWriter(filepath, metadata, options) {
  this._filepath = filepath;

  options = options || {};
  options.objectMode = true;
  options.highWaterMark = 2; // don't read too many blocks at once
  stream.Writable.call(this, options);

  var _this = this;

  if (metadata) {
    this._open(metadata);
  } else {
    this.on('pipe', function(readable) {
      _this._open(readable.metadata);
    });
  }

  this.on('finish', function() {
    _this._close();
    _this.emit('close');
  });
}

PixelWriter.prototype._open = function(metadata) {
  this._dst = gdal.open(
    this._filepath,
    'w',
    metadata.driver,
    metadata.width,
    metadata.height,
    metadata.numBands,
    metadata.type
  );

  this._dst.srs = metadata.srs;
  this._dst.geoTransform = metadata.geotransform;
  this._bandId = metadata.id;
};

PixelWriter.prototype._close = function() {
  if (this._dst) this._dst.close();
};

PixelWriter.prototype._write = function(data, enc, callback) {
  if (!this._dst) {
    return setImmediate(this._write.bind(this), data, enc, callback);
  }

  try {
    var band = this._dst.bands.get(this._bandId);
    band.pixels.writeBlock(data.offset.x, data.offset.y, data.buffer);
    this._dst.flush();
  }
  catch(err) {
    return callback(err);
  }

  setImmediate(callback);
};
