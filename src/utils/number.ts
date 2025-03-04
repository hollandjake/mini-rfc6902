export function getInt32LE(source: Uint8Array, offset: number): number {
  return source[offset] | (source[offset + 1] << 8) | (source[offset + 2] << 16) | (source[offset + 3] << 24);
}
