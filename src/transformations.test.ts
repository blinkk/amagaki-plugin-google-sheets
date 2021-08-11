import * as transformations from './transformations';

import {LocalizableData, Pod} from '@amagaki/amagaki';

import {ExecutionContext} from 'ava';
import test from 'ava';

const valuesResponseAny = [
  ['header1', 'header2', 'header3'],
  ['foo', 'a', 'b'],
  ['bar', 'c', 'd'],
];

const valuesResponseGrid = [
  ['', 'header2', 'header3'],
  ['foo', 'a', 'b'],
  ['bar', 'c', 'd'],
];

const valuesResponseStrings = [
  ['key', 'type', 'en', 'de', 'ja'],
  ['title', 'string', 'Hello', 'Hallo', 'こんにちは'],
  ['title', 'preferString', 'Preferred Hello', '', 'こんにちは'],
  ['body', 'string', '', '', ''],
  ['image', '', 'image1.jpg', 'image2.jpg', 'image3.jpg'],
  ['url', '', 'https://example.com'],
  ['survey_key', 'explicit', 'a', 'b', ''],
];

test('Test toObjectRows', async (t: ExecutionContext) => {
  const pod = new Pod('../example');
  t.deepEqual(transformations.toObjectRows(pod, valuesResponseAny), [
    {header1: 'foo', header2: 'a', header3: 'b'},
    {header1: 'bar', header2: 'c', header3: 'd'},
  ]);
});

test('Test toGrid', async (t: ExecutionContext) => {
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

test('Test toStrings', async (t: ExecutionContext) => {
  const pod = new Pod('../example');
  t.deepEqual(transformations.toStrings(pod, valuesResponseStrings), {
    keysToFields: {
      title: pod.string({
        prefer: 'Preferred Hello',
        value: 'Hello',
      }),
      body: pod.string({value: ''}),
      image: new LocalizableData(pod, {
        default: 'image1.jpg',
        de: 'image2.jpg',
        ja: 'image3.jpg',
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
        de: '',
        ja: 'こんにちは',
      },
      'body:2': {
        en: '',
        de: '',
        ja: '',
      },
      'image:3': {},
      'url:4': {},
      'survey_key:5': {},
    },
  });
});
