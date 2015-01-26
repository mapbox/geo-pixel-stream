var readable = require('./lib/readable');
var writable = require('./lib/writable');

module.exports = {
  createReadStreams: readable.createReadStreams,
  createWriteStream: writable.createWriteStream
};
