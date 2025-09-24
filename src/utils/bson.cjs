module.exports = {
  serializeBSON: function () {
    throw new ReferenceError("Serialization requires 'bson' to be installed");
  },

  deserializeBSON: function () {
    throw new ReferenceError("Deserialization requires 'bson' to be installed");
  },
};

// Allow bson to be installed optionally and make it work on all platforms
try {
  const bson = require('bson');
  if (bson?.serialize && bson?.deserialize) {
    module.exports.serializeBSON = bson.serialize;
    module.exports.deserializeBSON = bson.deserialize;
  }
} catch {}
