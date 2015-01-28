var path = require('path');
var testData = path.join(
  path.dirname(require.resolve('mapnik-test-data')),
  'data'
);

module.exports = {
  dcrgb: path.join(testData, 'geotiff', 'DC_rgb.tif'),
  grayscale: path.join(testData, 'geotiff', 'sample.tif'),
  vrt: path.join(testData, 'vrt', 'sample.vrt'),
  tiled: path.join(__dirname, 'fixtures', 'ndvi_256x256_rgba8_tiled.merc.tif')
};
