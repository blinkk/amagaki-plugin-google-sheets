import * as transformations from './transformations';

import {Locale, LocalizableData, Pod} from '@amagaki/amagaki';

import {ExecutionContext} from 'ava';
import test from 'ava';

const valuesResponseAny = [
  ['header1', 'header2', 'header3'],
  ['foo', 'a', 'b'],
  ['bar ', 'c', 'd'],
];

const valuesResponseGrid = [
  ['', 'header2', 'header3'],
  ['foo ', 'a', 'b'],
  ['bar', 'c', 'd'],
];

const valuesResponseStrings = [
  ['key', 'type', 'en', 'de', 'ja'],
  ['title', 'string', 'Hello ', 'Hallo', 'こんにちは'],
  ['title', 'preferString', 'Preferred Hello', '', 'こんにちは'],
  ['body', 'string', '', '', ''],
  ['image', '', 'image1.jpg', 'image2.jpg', ''],
  ['url', '', 'https://example.com'],
  ['survey_key', 'explicit', 'a', 'b', ''],
];

test('toObjectRows', (t: ExecutionContext) => {
  const pod = new Pod('../example');
  t.deepEqual(transformations.toObjectRows(pod, valuesResponseAny), [
    {header1: 'foo', header2: 'a', header3: 'b'},
    {header1: 'bar', header2: 'c', header3: 'd'},
  ]);
});

test('toGrid', (t: ExecutionContext) => {
  const pod = new Pod('../example');
  t.deepEqual(transformations.toGrid(pod, valuesResponseGrid), {
    foo: {
      header2: 'a',
      header3: 'b',
    },
    bar: {
      header2: 'c',
      header3: 'd',
    },
  });
});

test('toStrings', (t: ExecutionContext) => {
  const pod = new Pod('../example');
  t.deepEqual(transformations.toStrings(pod, valuesResponseStrings), {
    keysToFields: {
      title: pod.string({
        prefer: 'Preferred Hello',
        value: 'Hello',
      }),
      image: new LocalizableData(pod, {
        default: 'image1.jpg',
        de: 'image2.jpg',
      }),
      url: new LocalizableData(pod, {default: 'https://example.com'}),
      survey_key: new LocalizableData(pod, {
        en: 'a',
        de: 'b',
      }),
    },
    keysToLocales: {
      'title:0': {
        en: 'Hello',
        de: 'Hallo',
        ja: 'こんにちは',
      },
      'title:1': {
        en: 'Preferred Hello',
        ja: 'こんにちは',
      },
      'body:2': {},
      'image:3': {},
      'url:4': {},
      'survey_key:5': {},
    },
  });
});

test('explicit data type', (t: ExecutionContext) => {
  const pod = new Pod('../example');
  const transformObject = transformations.toStrings(pod, [
    ['key', 'type', 'en', 'de', 'ja'],
    ['survey_key', 'explicit', 'a', 'b', ''],
  ]);

  const surveyLocalizableData = transformObject.keysToFields
    .survey_key as LocalizableData;
  t.assert(surveyLocalizableData.localize(new Locale(pod, 'en')), 'a');
  t.assert(surveyLocalizableData.localize(new Locale(pod, 'de')), 'b');
  t.falsy(surveyLocalizableData.localize(new Locale(pod, 'ja')));
});

test('custom cell type with strings transformation', (t: ExecutionContext) => {
  const pod = new Pod('../example');
  const transformObject = transformations.toStrings(
    pod,
    [
      ['key', 'type', 'en', 'de', 'ja'],
      ['foo', 'custom', 'a', 'b', 'c'],
    ],
    {
      custom: (data: string) => {
        return data.toUpperCase();
      },
    }
  );
  const result = transformObject.keysToFields.foo as LocalizableData;
  t.deepEqual(
    result,
    new LocalizableData(pod, {
      de: 'B',
      en: 'A',
      ja: 'C',
    })
  );
});

test('custom cell type with grid transformation', (t: ExecutionContext) => {
  const pod = new Pod('../example');
  const result = transformations.toGrid(
    pod,
    [
      ['', 'foo', 'bar', 'baz'],
      ['item1', 'foovalue', 'barvalue', 'bazvalue'],
    ],
    {
      custom: (data: string) => {
        return data.toUpperCase();
      },
    },
    {foo: 'custom'}
  );
  t.deepEqual(result, {
    item1: {
      foo: 'FOOVALUE',
      bar: 'barvalue',
      baz: 'bazvalue',
    },
  });
});

test('custom cell type with objectRows transformation', (t: ExecutionContext) => {
  const pod = new Pod('../example');
  const result = transformations.toObjectRows(
    pod,
    [
      ['header1', 'header2', 'url'],
      ['value1', 'value2', 'urlvalue'],
    ],
    {
      custom: (data: string) => {
        return data.toUpperCase();
      },
    },
    {url: 'custom'}
  );
  t.deepEqual(result, [
    {
      header1: 'value1',
      header2: 'value2',
      url: 'URLVALUE',
    },
  ]);
});
