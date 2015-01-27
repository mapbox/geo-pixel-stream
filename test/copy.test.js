var test = require('tape'),
    pixels = require('..'),
    fixtures = require('./data'),
    os = require('os'),
    path = require('path'),
    crypto = require('crypto'),
    queue = require('queue-async'),
    gdal = require('gdal'),
    mapnik = require('mapnik'),
    fs = require('fs');

test('copying a raster', function(assert) {
  var output = path.join(os.tmpdir(), crypto.randomBytes(8).toString('hex') + '.tif'),
      input = fixtures.dcrgb,
      readers = pixels.createReadStreams(input),
      metadata = readers[0].metadata,
      writers = pixels.createWriteStreams(output, readers[0].metadata),
      q = queue(1);

  readers.forEach(function(reader, i) {
    q.defer(function(next) {
      reader.pipe(writers[i]).on('finish', function() {
        assert.pass('Completed copy of band ' + reader.metadata.id);
        next();
      });
    });
  });

  q.await(function(err) {
    if (err) console.log(err);
    var dst = gdal.open(output);

    // Check metadata on created file
    assert.equal(dst.driver.description, 'GTiff', 'sets proper driver on output file');
    assert.equal(dst.rasterSize.x, metadata.width, 'sets proper width on output file');
    assert.equal(dst.rasterSize.y, metadata.height, 'sets proper height on output file');
    assert.equal(dst.bands.count(), metadata.numBands, 'sets proper numBands on output file');
    assert.deepEqual(dst.geoTransform, metadata.geotransform, 'sets proper geotransform on output file');
    assert.ok(dst.srs.isSame(metadata.srs), 'sets proper srs on output file');

    // Image comparison
    var original = new mapnik.Image.fromBytesSync(fs.readFileSync(input)),
        duplicate = new mapnik.Image.fromBytesSync(fs.readFileSync(output)),
        pxDiff = original.compare(duplicate);

    assert.equal(pxDiff, 0, 'pixels were duplicated identically');

    assert.end();
  });
});
