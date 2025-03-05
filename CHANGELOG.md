# Changelog

## [0.6.0](https://github.com/hollandjake/mini-rfc6902/compare/v0.5.0...v0.6.0) (2025-03-05)


### Features

* improve binary format compression ([68019f8](https://github.com/hollandjake/mini-rfc6902/commit/68019f8e4a3407f46010e6188026a68656455fcc))


### Bug Fixes

* performance optimizations ([2528ee1](https://github.com/hollandjake/mini-rfc6902/commit/2528ee190a4f74a504376d91437981600fd656cd))

## [0.5.0](https://github.com/hollandjake/mini-rfc6902/compare/v0.4.1...v0.5.0) (2025-03-03)


### Features

* add support for binary format ([#16](https://github.com/hollandjake/mini-rfc6902/issues/16)) ([45f526f](https://github.com/hollandjake/mini-rfc6902/commit/45f526f6e16427451b1461e25a2f4a065c962a6c))

## [0.4.1](https://github.com/hollandjake/mini-rfc6902/compare/v0.4.0...v0.4.1) (2025-03-03)


### Bug Fixes

* diff now respects custom equality methods ([a65fe63](https://github.com/hollandjake/mini-rfc6902/commit/a65fe6391a257104080665c3a1f2579bf5a4e69c))
* update typings ([ef3c8a6](https://github.com/hollandjake/mini-rfc6902/commit/ef3c8a64327263b36c74340a42790effd1c55fc0))

## [0.4.0](https://github.com/hollandjake/mini-rfc6902/compare/v0.3.0...v0.4.0) (2025-02-28)


### Features

* diff can now be transformed ([cab1954](https://github.com/hollandjake/mini-rfc6902/commit/cab19541d793512c7288493b53365bfb0ee1474d))


### Bug Fixes

* fixed diffFunction implementation ([35311cd](https://github.com/hollandjake/mini-rfc6902/commit/35311cd759ab5abf5a1d9e02f0d614e4c48dd3a6))

## [0.3.0](https://github.com/hollandjake/mini-rfc6902/compare/v0.2.3...v0.3.0) (2025-02-28)


### Features

* change pointers toJSON as a string ([5d62978](https://github.com/hollandjake/mini-rfc6902/commit/5d62978e5a3c53fe7d8746d4e39316bc1e56982a))
* fix typings and browser support ([e675607](https://github.com/hollandjake/mini-rfc6902/commit/e675607c6aad5b5f0aa97f34ba5b88c8c72b7cf4))
* remove support for cloning errors ([4184339](https://github.com/hollandjake/mini-rfc6902/commit/4184339170ccf52c401fdcec11fc5137b76155fa))


### Bug Fixes

* bump node version to 11 ([a538426](https://github.com/hollandjake/mini-rfc6902/commit/a53842675cd20990520e8ac2cc9cb6d820648563))
* remove leafToken from pointer ([6338436](https://github.com/hollandjake/mini-rfc6902/commit/633843633148fb8cdf53af297c76fd2243fe0e41))

## [0.2.3](https://github.com/hollandjake/mini-rfc6902/compare/v0.2.2...v0.2.3) (2024-11-30)


### Bug Fixes

* rollback fix for build ([a01e03b](https://github.com/hollandjake/mini-rfc6902/commit/a01e03bb7f196b68e9e597427ee25c25a6dc27d1))

## [0.2.2](https://github.com/hollandjake/mini-rfc6902/compare/v0.2.1...v0.2.2) (2024-11-30)


### Bug Fixes

* fix linting issues ([5e9d4a0](https://github.com/hollandjake/mini-rfc6902/commit/5e9d4a0f19ee8b0846cd25de70b8dc97998f9adc))

## [0.2.1](https://github.com/hollandjake/mini-rfc6902/compare/v0.2.0...v0.2.1) (2024-11-30)


### Bug Fixes

* array diff when inserting multiple values now works as expected ([8f6dee7](https://github.com/hollandjake/mini-rfc6902/commit/8f6dee70d334fa3356f427cc17e8bd049dfa04ca))
* fix map insertion and deletion ([4e79a17](https://github.com/hollandjake/mini-rfc6902/commit/4e79a17fac5b3c22c6ecc46b20acfdfa3ff02816))
* missing clone support for DataView ([08f7e91](https://github.com/hollandjake/mini-rfc6902/commit/08f7e91e8d8c93f347dc80e442b6758bdec3fdbd))
* **type:** apply can have a null patch ([f2054bc](https://github.com/hollandjake/mini-rfc6902/commit/f2054bce13ff6719c1a174a22e151de7b3c7b696))

## [0.2.0](https://github.com/hollandjake/mini-rfc6902/compare/v0.1.2...v0.2.0) (2024-09-09)


### Features

* change BSONification to string rather than Uint8Array ([0b741fb](https://github.com/hollandjake/mini-rfc6902/commit/0b741fb03cc7359f4190d0b1fe9987d129b4cbcc))

## [0.1.2](https://github.com/hollandjake/mini-rfc6902/compare/v0.1.1...v0.1.2) (2024-09-08)


### Bug Fixes

* fix return type of create ([4e12948](https://github.com/hollandjake/mini-rfc6902/commit/4e12948686fb5eb672c0174aef09069f5e5059ed))

## [0.1.1](https://github.com/hollandjake/mini-rfc6902/compare/v0.1.0...v0.1.1) (2024-09-08)


### Bug Fixes

* clone not replicating objects with non-serializable fields correctly ([a1bd83d](https://github.com/hollandjake/mini-rfc6902/commit/a1bd83d34587b0c8edd1667134f0954bfc146b59))

## 0.1.0 (2024-09-08)


### Features

* Initial release ([823e6f5](https://github.com/hollandjake/mini-rfc6902/commit/823e6f5a391f279fc2fceb689816ff694deae51e))
