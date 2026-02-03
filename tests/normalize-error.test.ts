import assert from 'assert';
import { normalizeError } from '../src/index';

function run() {
  {
    const error = new Error('boom');
    const result = normalizeError(error);
    assert.equal(result.message, 'boom');
    assert.equal(result.name, 'Error');
    assert.ok(result.stack && result.stack.includes('Error: boom'));
  }

  {
    const result = normalizeError('fail' as any);
    assert.equal(result.message, 'fail');
    assert.equal(result.name, 'Error');
  }
}

run();
