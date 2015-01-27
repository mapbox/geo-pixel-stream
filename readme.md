# pixel-stream

[![Build Status](https://travis-ci.org/mapbox/pixel-stream.svg?branch=master)](https://travis-ci.org/mapbox/pixel-stream)

[wip] Node.js streams for reading/writing/transforming pixels using node-gdal

## PixelReader streams

Create a streams that reads pixels from each band of a source image:

```js
var pixels = require('pixel-stream');
var dcrgb = 'node_modules/mapnik-test-data/data/geotiff/DC_rgb.tif';

// Create an array of streams from the input image
var readers = pixels.createReadStreams(dcrgb);
```

If an image has 4 bands (e.g. RGBA), then the `streams` array will contain four stream objects. Each stream contains metadata about the original datasource and the band represented:

```js
console.log(readers[0].metadata);
// {
//   driver: 'GTiff',
//   width: 1541,
//   height: 1913,
//   numBands: 4,
//   srs: gdal.SpatialReference.fromEPSG(26918),
//   geotransform: [ 326356, 4.00129785853342, 0, 4318980, 0, -4.0015682174594875 ],
//   id: 1,
//   type: 'Byte',
//   blockSize: {
//     x: 1541,
//     y: 1
//   }
// }
```

Each PixelReader is a [Node.js readable stream](http://nodejs.org/api/stream.html#stream_class_stream_readable). The stream's `data` event will emit objects indicating the offset (in terms of blocks, not pixels), and a TypedArray of pixel data.

```js
readers[0].once('data', function(data) {
  console.log(data);
  // {
  //   offset: { x: 0, y: 0 },
  //   buffer: [ Uint8TypedArray ]
  // }
});
```

[Inheriting from the stream api](http://nodejs.org/api/stream.html#stream_readable_pipe_destination_options), PixelReaders can send data to writable streams via `pipe`:

```js
var writable = new stream.Writable();
readers[1].pipe(writable);
```

## PixelWriter streams

Create a stream that writes pixels to a specific band of a destination image:

```js
var outputFile = '~/just-red.tif';
var outputMetadata = {
  driver: 'GTiff',
  width: 1541,
  height: 1913,
  numBands: 1,
  srs: gdal.SpatialReference.fromEPSG(26918),
  geotransform: [ 326356, 4.00129785853342, 0, 4318980, 0, -4.0015682174594875 ],
  id: 1,
  type: 'Byte',
  blockSize: { x: 1541, y: 1 }
};

var writer = pixels.createWriteStream(outputFile, outputMetadata);
```

If you plan to `pipe` pixels from a PixelReader, you do not need to specify metadata. It will be provided by the input PixelReader if not specified.

The PixelWriter will emit a `close` event when all pixels have been flushed to the file and it has been closed.

```js
var dcrgb = 'node_modules/mapnik-test-data/data/geotiff/DC_rgb.tif';
var readers = pixels.createReadStreams(dcrgb);
var writer = pixels.createWriteStream(outputFile);

readers[0].pipe(writer).on('close', function() {
  console.log('All done!');
});
```

## PixelTransform streams

Create a stream that takes input pixels, performs some sort of manipulation of them, and outputs the adjusted pixels. You create a function that will receive a TypedArray of pixels, performs some adjustment, and provides the adjusted pixels to the provided `callback` function:

```js
function processPixels(buffer, callback) {
  var result = buffer.map(function(pixel) {
    return pixel + 10;
  });
  callback(null, result);
}

var transform = pixels.createTransformStream(processPixels);
```

If processing encounters an error, send the error as the first argument to the provided `callback` function.

You can use a transform stream to make adjustments to pixel values before writing them to a destination file:

```js
var dcrgb = 'node_modules/mapnik-test-data/data/geotiff/DC_rgb.tif';
var readers = pixels.createReadStreams(dcrgb);
var writer = pixels.createWriteStream(outputFile);
var transform = pixels.createTransformStream(processPixels);

readers[0].pipe(transform).pipe(writer).on('close', function() {
  console.log('All done!');
});
```
