const exports: {
  serializeBSON: typeof import('bson').serialize;
  deserializeBSON: typeof import('bson').deserialize;
} = {
  serializeBSON: () => {
    throw new ReferenceError("Serialization requires 'bson' to be installed");
  },

  deserializeBSON: () => {
    throw new ReferenceError("Deserialization requires 'bson' to be installed");
  },
};

// Allow bson to be installed optionally and make it work on all platforms
try {
  const bson = require('bson');
  if (bson?.serialize && bson?.deserialize) {
    exports.serializeBSON = bson.serialize;
    exports.deserializeBSON = bson.deserialize;
  }
} catch {}

export const serializeBSON: typeof import('bson').serialize = exports.serializeBSON;
export const deserializeBSON: typeof import('bson').deserialize = exports.deserializeBSON;
