// deno-lint-ignore-file no-explicit-any no-unused-vars require-await ban-unused-ignore
import 'https://gist.githubusercontent.com/qwtel/b14f0f81e3a96189f7771f83ee113f64/raw/TestRequest.ts'
import {
  assert,
  assertExists,
  assertEquals,
  assertStrictEquals,
  assertStringIncludes,
  assertThrows,
  assertRejects,
  assertArrayIncludes,
} from 'https://deno.land/std@0.133.0/testing/asserts.ts'
const { test } = Deno;

import { StorageArea } from '../index.ts';

test('exists', () => {
  assertExists(StorageArea)
})
