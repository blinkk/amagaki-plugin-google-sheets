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
  ['key', 'type', 'en', 'de'],
  ['title', 'string', 'Hello', 'Hallo'],
  ['title', 'preferString', 'Preferred Hello', ''],
  ['body', 'string', '', ''],
  ['image', '', 'image1.jpg', 'image2.jpg'],
  ['url', '', 'https://example.com'],
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
      }),
      url: new LocalizableData(pod, {default: 'https://example.com'}),
    },
    keysToLocales: {
      'title:0': {
        en: 'Hello',
        de: 'Hallo',
      },
      'title:1': {
        en: 'Preferred Hello',
        de: '',
      },
      'body:2': {
        en: '',
        de: '',
      },
      'image:3': {},
      'url:4': {},
    },
  });
});
