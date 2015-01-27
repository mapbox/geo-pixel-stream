var test = require('tape');
var pixels = require('..');
var fixtures = require('./data');
var os = require('os');
var path = require('path');
var crypto = require('crypto');
var queue = require('queue-async');
var gdal = require('gdal');

test('copying a raster', function(assert) {
  var output = path.join(os.tmpdir(), crypto.randomBytes(8).toString('hex') + '.tif');
  var input = fixtures.dcrgb;

  var readers = pixels.createReadStreams(input);

  var q = queue(1);
  var metadata;

  readers.forEach(function(reader) {
    metadata = reader.metadata;

    q.defer(function(next) {
      // console.log(readers._src.bands.count());
      var writer = pixels.createWriteStream(output);
      reader.pipe(writer).on('close', function() {
        assert.pass('Completed copy of band ' + reader.metadata.id);
        next();
      });
    });
  });

  q.await(function(err) {
    if (err) console.log(err);
    var dst = gdal.open(output);
    assert.equal(dst.driver.description, 'GTiff', 'sets proper driver on output file');
    assert.equal(dst.rasterSize.x, metadata.width, 'sets proper width on output file');
    assert.equal(dst.rasterSize.y, metadata.height, 'sets proper height on output file');
    assert.equal(dst.bands.count(), metadata.numBands, 'sets proper numBands on output file');
    assert.deepEqual(dst.geoTransform, metadata.geotransform, 'sets proper geotransform on output file');
    assert.ok(dst.srs.isSame(metadata.srs), 'sets proper srs on output file');
    console.log(output);
    assert.end();
  });
});
