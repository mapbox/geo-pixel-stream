var readable = require('./lib/readable');
var writable = require('./lib/writable');
var transform = require('./lib/transform');

module.exports = {
  createReadStreams: readable.createReadStreams,
  createWriteStream: writable.createWriteStream,
  createTransformStream: transform.createTransformStream
};
