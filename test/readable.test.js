var test = require('tape');
var path = require('path');
var gdal = require('gdal');
var stream = require('stream');
var fixtures = require('./data');
var readable = require('../lib/readable');
var _ = require('underscore');

test('PixelReader: constructor', function(assert) {
  var src = gdal.open(fixtures.dcrgb);
  var band = src.bands.get(1);

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

  var reader = new readable.PixelReader(band, metadata);

  assert.deepEqual(reader.metadata, metadata, 'sets metadata');
  assert.ok(reader instanceof stream.Readable, 'is a readable stream');
  assert.ok(reader._readableState.objectMode, 'is in object mode');
  assert.deepEqual(reader._next(), { x: 0, y: 0 }, 'starts reading first block');
  assert.end();
});

test('PixelReader: reads', function(assert) {
  var src = gdal.open(fixtures.dcrgb);
  var band = src.bands.get(1);

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

  var reader = new readable.PixelReader(band, metadata);

  var yBlocks = [];

  reader.on('data', function(data) {
    if (data.offset.x !== 0) assert.fail('fixture has one x block');
    if (!(data.buffer instanceof Uint8Array)) assert.fail('buffer is properly typed');
    yBlocks.push(data.offset.y);
  }).on('end', function() {
    var expected = _.range(1913).reduce(function(sum, y) {
      sum += y;
      return sum;
    }, 0);
    var found = yBlocks.reduce(function(sum, y) {
      sum += y;
      return sum;
    }, 0);
    assert.equal(yBlocks.length, 1913, 'fixture has 1913 y blocks');
    assert.equal(found, expected, 'sent all y blocks');
    assert.end();
  });
});

test('PixelReader: can read alpha channel', function(assert) {
  var src = gdal.open(fixtures.dcrgb);
  var band = src.bands.get(4);

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

  var reader = new readable.PixelReader(band, metadata);

  var yBlocks = [];

  reader.on('data', function(data) {
    if (data.offset.x !== 0) assert.fail('fixture has one x block');
    if (!(data.buffer instanceof Uint8Array)) assert.fail('buffer is properly typed');
    yBlocks.push(data.offset.y);
  }).on('end', function() {
    var expected = _.range(1913).reduce(function(sum, y) {
      sum += y;
      return sum;
    }, 0);
    var found = yBlocks.reduce(function(sum, y) {
      sum += y;
      return sum;
    }, 0);
    assert.equal(yBlocks.length, 1913, 'fixture has 1913 y blocks');
    assert.equal(found, expected, 'sent all y blocks');
    assert.end();
  });
});

test('createReadStreams', function(assert) {
  var streams = readable.createReadStreams(fixtures.dcrgb);
  assert.equal(streams.length, 4, 'rgba fixture');
  streams.forEach(function(reader) {
    assert.equal(reader.metadata.driver, 'GTiff', 'correct driver');
    assert.equal(reader.metadata.width, 1541, 'correct width');
    assert.equal(reader.metadata.height, 1913, 'correct height');
    assert.equal(reader.metadata.numBands, 4, 'correct number of bands');
    assert.equal(reader.metadata.type, 'Byte', 'correct data type');
    assert.deepEqual(
      reader.metadata.geotransform,
      [ 326356, 4.00129785853342, 0, 4318980, 0, -4.0015682174594875 ],
      'correct geotransform'
    );
    assert.deepEqual(reader.metadata.blockSize, {
      x: 1541, y: 1
    }, 'correct block size');
  });
  assert.end();
});
