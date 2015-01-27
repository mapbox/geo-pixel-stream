# pixel-stream

[wip] Node.js streams for reading/writing/transforming pixels using node-gdal

## Usage

```js
var pixels = require('pixel-stream');


// Copy a band from one tiff to another
var streams = pixels.createReadStreams('/path/to/input.tif');
var firstband = pixels.createWriteStream('/path/to/output.tif');

streams[0].pipe(firstband);

// close event indicates that data is finished being written and the destination
// file descriptor was closed. Don't try and write two bands to the same file at
// the same time
firstband.on('close', next);

function next() {
  // Transform pixels on the way over
  var transform = pixels.createTransformStream(function(data, callback) {
    callback(null, data.map(function(pixel) {
      return pixel + 1;
    }));
  });

  var secondband = pixels.createWriteStream('/path/to/output.tif');
  streams[1].pipe(transform).pipe(secondband);
}
```
