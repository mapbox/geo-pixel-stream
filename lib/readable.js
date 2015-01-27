var stream = require('stream');
var util = require('util');
var gdal = require('gdal');

module.exports.createReadStreams = createReadStreams;
module.exports.PixelReader = PixelReader;

function createReadStreams(filepath, options) {
  var src = gdal.open(filepath);
  var streams = [];

  src.bands.forEach(function(band) {
    var metadata = {
      driver: src.driver.description,
      width: src.rasterSize.x,
      height: src.rasterSize.y,
      numBands: src.bands.count(),
      srs: src.srs.clone(),
      geotransform: src.geoTransform,
      id: band.id,
      type: band.dataType,
      blockSize: band.blockSize
    };

    streams.push(new PixelReader(band, metadata, options));
  });

  streams._src = src;
  return streams;
}

util.inherits(PixelReader, stream.Readable);
function PixelReader(gdalBand, metadata, options) {
  this._band = gdalBand;

  this.metadata = {
    driver: metadata.driver,
    width: metadata.width,
    height: metadata.height,
    numBands: metadata.numBands,
    srs: metadata.srs,
    geotransform: metadata.geotransform,
    id: metadata.id,
    type: metadata.type,
    blockSize: metadata.blockSize
  };

  var offset = { x: -1, y: 0 };
  var max = {
    x: Math.ceil(gdalBand.size.x / gdalBand.blockSize.x) - 1,
    y: Math.ceil(gdalBand.size.y / gdalBand.blockSize.y) - 1
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
