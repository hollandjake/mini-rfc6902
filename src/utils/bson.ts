// Allow bson to be installed optionally and make it work on all platforms
const { serialize, deserialize } = require('bson');

export const serializeBSON: typeof serialize = function () {
  if (!serialize) throw new ReferenceError("Serialization requires 'bson' to be installed");
  // eslint-disable-next-line prefer-rest-params
  return serialize(...arguments);
};
export const deserializeBSON: typeof deserialize = function () {
  if (!deserialize) throw new ReferenceError("Deserialization requires 'bson' to be installed");
  // eslint-disable-next-line prefer-rest-params
  return deserialize(...arguments);
};
