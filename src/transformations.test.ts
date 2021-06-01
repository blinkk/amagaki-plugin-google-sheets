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
