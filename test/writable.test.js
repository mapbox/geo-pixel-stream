var fs = require('fs');
var test = require('tape');
var path = require('path');
var gdal = require('gdal');
var stream = require('stream');
var fixtures = require('./data');
var writable = require('../lib/writable');
var readable = require('../lib/readable');
var os = require('os');
var crypto = require('crypto');

function tmpfile() {
  return path.join(os.tmpdir(), crypto.randomBytes(8).toString('hex') + '.tif');
}

test('PixelWriter: constructor', function(assert) {
  var tmp = tmpfile();
  var writer = new writable.PixelWriter(tmp);
  assert.ok(writer instanceof stream.Writable, 'returns a writable stream');
  assert.equal(writer.listeners('pipe').length, 1, 'listens to pipe event when metadata is not specified');
  assert.notOk(fs.existsSync(tmp), 'does not create a file');

  var readers = new readable.createReadStreams(fixtures.dcrgb);
  var readBandOne = readers[0];
  var metadata = readBandOne.metadata;

  readBandOne.pipe(writer);
  assert.ok(fs.existsSync(tmp), 'creates a file on pipe');
  writer.on('close', function() {
    assert.pass('writes finished and datasource was closed');
    assert.end();
  });

  tmp = tmpfile();
  writer = new writable.PixelWriter(tmp, metadata);
  assert.ok(writer instanceof stream.Writable, 'returns a writable stream');
  assert.equal(writer.listeners('pipe').length, 0, 'does not listen to pipe event when metadata is specified');
  assert.ok(fs.existsSync(tmp), 'does create a file');

  writer._close();

  var dst = gdal.open(tmp);
  assert.equal(dst.driver.description, 'GTiff', 'sets proper driver on output file');
  assert.equal(dst.rasterSize.x, metadata.width, 'sets proper width on output file');
  assert.equal(dst.rasterSize.y, metadata.height, 'sets proper height on output file');
  assert.equal(dst.bands.count(), metadata.numBands, 'sets proper numBands on output file');
  assert.deepEqual(dst.geoTransform, metadata.geotransform, 'sets proper geotransform on output file');
  assert.ok(dst.srs.isSame(metadata.srs), 'sets proper srs on output file');
});

test('createWriteStream', function(assert) {
  var writer = writable.createWriteStream(tmpfile());
  assert.ok(writer instanceof stream.Writable, 'creates a writable stream');
  assert.end();
});
