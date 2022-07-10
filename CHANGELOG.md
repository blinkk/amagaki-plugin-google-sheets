# Changelog

### [3.1.4](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v3.1.3...v3.1.4) (2022-07-10)


### Bug Fixes

* move deps to devDependencies ([6f85587](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/6f85587ac30c680379136d1b68b00f5e2419deff))

### [3.1.3](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v3.1.2...v3.1.3) (2022-07-10)


### Bug Fixes

* use peerDepdencies for amagaki dependency to fix instanceOf issue ([66f79c1](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/66f79c136fdc9f0d6196b00a460720ca120c00ab))

### [3.1.2](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v3.1.1...v3.1.2) (2022-01-24)


### Bug Fixes

* serializing custom cell types ([d44a82a](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/d44a82ad85cb917ed95ba207a672cc7f4f397ea7))

### [3.1.1](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v3.1.0...v3.1.1) (2021-12-30)


### Bug Fixes

* avoid importing empty strings ([2c3f48c](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/2c3f48c428f829c1f2efd6a926bd2c1c59c7038a))

## [3.1.0](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v3.0.1...v3.1.0) (2021-12-30)


### Features

* trim whitespace when importing strings ([2691948](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/26919485417ddf72984bba57b2e41b660c077493))

### [3.0.1](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v3.0.0...v3.0.1) (2021-11-16)


### Features

* support custom cell types ([#16](https://www.github.com/blinkk/amagaki-plugin-google-sheets/issues/16)) ([2fa7caf](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/2fa7caf872d36bc4250e86f583c748d832b01922))


### Miscellaneous Chores

* release 3.0.1 ([9306dd2](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/9306dd29f2f1a197934aedf19678a7454600810a))

## [3.0.0](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v2.1.0...v3.0.0) (2021-08-24)


### ⚠ BREAKING CHANGES

* make usage consistent

### Code Refactoring

* make usage consistent ([4d02742](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/4d02742fd146889f50c2aa47dc5d321cb169bdb5))

## [2.1.0](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v2.0.0...v2.1.0) (2021-08-11)


### Features

* add support for "explicit" data type ([e2255f7](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/e2255f7294cbcfcbba78654c5cd9dfb15ac290b3))

## [2.0.0](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v1.2.0...v2.0.0) (2021-06-24)


### ⚠ BREAKING CHANGES

* serialize to pod.string and IfLocale types (#8)

### Features

* serialize to pod.string and IfLocale types ([#8](https://www.github.com/blinkk/amagaki-plugin-google-sheets/issues/8)) ([a1e880a](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/a1e880a45b3c49ef719e9c2ea23ec93842760963))

## [1.2.0](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v1.1.0...v1.2.0) (2021-06-22)


### Features

* skip columns unlikely to be locales ([1307e6f](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/1307e6f373c6ed4dde41579625bac7f7bc03a5f7))

## [1.1.0](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v1.0.3...v1.1.0) (2021-06-09)


### Features

* add empty strings to yaml when cells are empty ([4197a47](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/4197a47be80e30c3541b3cb567c9057ec707d4c0))

### [1.0.3](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v1.0.2...v1.0.3) (2021-06-08)


### Bug Fixes

* clean up transformed filenames ([8982edf](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/8982edff8581b1d2ffa500ee3384d857e8034bdb))

### [1.0.2](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v1.0.1...v1.0.2) (2021-06-01)


### Bug Fixes

* fix package import path ([ee68ccd](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/ee68ccd250a4a092cc55b47401e99f2e2c5dccb5))

### [1.0.1](https://www.github.com/blinkk/amagaki-plugin-google-sheets/compare/v1.0.0...v1.0.1) (2021-06-01)


### Bug Fixes

* fix interim solution with string serialization ([ec883f5](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/ec883f5290d2c18e98d7667cc899e83050195f01))

## 1.0.0 (2021-05-27)


### Bug Fixes

* fix packaging, tsc cleanup, locale saving ([f846471](https://www.github.com/blinkk/amagaki-plugin-google-sheets/commit/f846471bb87f8133faa625043a09b53c4a881ca3))
