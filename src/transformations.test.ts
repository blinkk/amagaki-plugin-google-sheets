import * as transformations from './transformations';

import {ExecutionContext} from 'ava';
import {Pod} from '@amagaki/amagaki';
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
  ['body', 'string', '', ''],
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
    keysToStrings: {
      title: 'Hello',
      body: '',
      url: 'https://example.com',
    },
    keysToLocales: {
      title: {
        en: 'Hello',
        de: 'Hallo',
      },
      body: {
        en: '',
        de: '',
      },
      url: {},
    },
  });
});
