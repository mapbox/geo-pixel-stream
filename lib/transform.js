var stream = require('stream');
var util = require('util');

module.exports.createTransformStream = createTransformStream;
module.exports.PixelTransform = PixelTransform;

function createTransformStream(process, options) {
  return new PixelTransform(process, options);
}

util.inherits(PixelTransform, stream.Transform);
function PixelTransform(process, options) {
  this.process = process;

  options = options || {};
  options.objectMode = true;
  stream.Transform.call(this, options);

  var _this = this;
  this.on('pipe', function(readable) {
    _this.metadata = readable.metadata;
  });
}

PixelTransform.prototype._transform = function(data, enc, callback) {
  var _this = this;
  this.process(data.buffer, function(err, transformed) {
    if (err) return callback(err);
    _this.push(transformed);
  });
};
