var fs = require('fs'),
    test = require('tape'),
    path = require('path'),
    gdal = require('gdal'),
    stream = require('stream'),
    fixtures = require('./data'),
    writable = require('../lib/writable'),
    readable = require('../lib/readable'),
    os = require('os'),
    crypto = require('crypto');

function tmpfile() {
  return path.join(os.tmpdir(), crypto.randomBytes(8).toString('hex') + '.tif');
}

test('PixelWriter: constructor', function(assert) {
  var tmp = tmpfile(),
      dst = gdal.open(tmp, 'w', 'GTiff', 1541, 1913, 4, 'Byte');

  dst.srs = gdal.SpatialReference.fromEPSG(26918);
  dst.geoTransform = [326356, 4.00129785853342, 0, 4318980, 0, -4.0015682174594875];

  var writer = new writable.PixelWriter(dst, 1);

  assert.ok(writer instanceof stream.Writable, 'returns a writable stream');
  assert.ok(fs.existsSync(tmp), 'creates a file');
  assert.ok(writer instanceof stream.Writable, 'returns a writable stream');
  assert.equal(writer.metadata.driver, 'GTiff', 'expected gdal driver');
  assert.equal(writer.metadata.width, 1541, 'expected width');
  assert.equal(writer.metadata.height, 1913, 'expected height');
  assert.equal(writer.metadata.numBands, 4, 'expected number of bands');
  assert.ok(writer.metadata.srs.isSame(gdal.SpatialReference.fromEPSG(26918)), 'expected srs');
  assert.deepEqual(
    writer.metadata.geotransform,
    [326356, 4.00129785853342, 0, 4318980, 0, -4.0015682174594875],
    'expected geotransform'
  );
  assert.equal(writer.metadata.id, 1, 'expected band id');
  assert.equal(writer.metadata.type, 'Byte', 'expected data type');
  assert.deepEqual(writer.metadata.blockSize, {
    x: 1541,
    y: 1
  }, 'expected block size');
  assert.end();
});

test('PixelWriter: writes', function(assert) {
  var tmp = tmpfile(),
      readers = readable.createReadStreams(fixtures.dcrgb),
      dst = gdal.open(tmp, 'w', 'GTiff', 1541, 1913, 4, 'Byte');

  dst.srs = gdal.SpatialReference.fromEPSG(26918);
  dst.geoTransform = [326356, 4.00129785853342, 0, 4318980, 0, -4.0015682174594875];

  var writer = new writable.PixelWriter(dst, 1);
  writer.on('error', function(err) {
    assert.ifError(err, 'should not error');
  });
  writer.on('finish', function() {
    fs.stat(tmp, function(err, stats) {
      assert.ifError(err, 'should not error');
      assert.ok(stats.size > 0, 'wrote some data');
      assert.end();
    });
  });

  readers[0].once('readable', function() {
    var data = readers[0].read();
    writer.write(data);
    writer.end();
  });
});

test('createWriteStreams', function(assert) {
  var tmp = tmpfile(),
      metadata = {
        driver: 'GTiff',
        width: 1541,
        height: 1913,
        numBands: 4,
        type: 'Byte',
        geotransform: [326356, 4.00129785853342, 0, 4318980, 0, -4.0015682174594875],
        srs: gdal.SpatialReference.fromEPSG(26918)
      };

  var writers = writable.createWriteStreams(tmp, metadata);
  assert.equal(writers.length, 4, 'streams for each band');
  writers.forEach(function(writer) {
    assert.ok(writer instanceof stream.Writable, 'is a writable stream');
    assert.equal(writer.metadata.driver, metadata.driver, 'correct driver');
    assert.equal(writer.metadata.width, metadata.width, 'correct width');
    assert.equal(writer.metadata.height, metadata.height, 'correct height');
    assert.equal(writer.metadata.numBands, metadata.numBands, 'correct number of bands');
    assert.equal(writer.metadata.type, metadata.type, 'correct data type');
    assert.ok(writer.metadata.srs.isSame(gdal.SpatialReference.fromEPSG(26918)), 'expected srs');
    assert.deepEqual(
      writer.metadata.geotransform,
      metadata.geotransform,
      'correct geotransform'
    );
    assert.deepEqual(writer.metadata.blockSize, {
      x: 1541, y: 1
    }, 'correct block size');
  });

  assert.end();
});
