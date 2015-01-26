var stream = require('stream');
var util = require('util');

util.inherits(PixelTransform, stream.Transform);
function PixelTransform(options) {
  stream.Transform.call(this, options);

  var _this = this;
  this.on('pipe', function(readable) {
    _this.metadata = readable.metadata;
  });
}
