import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeError } from '../src/index';

test('normalizeError returns message and stack for Error', () => {
  const error = new Error('boom');
  const result = normalizeError(error);
  assert.equal(result.message, 'boom');
  assert.equal(result.name, 'Error');
  assert.ok(result.stack?.includes('Error: boom'));
});

test('normalizeError converts non-Error values', () => {
  const result = normalizeError('fail' as any);
  assert.equal(result.message, 'fail');
  assert.equal(result.name, 'Error');
});
