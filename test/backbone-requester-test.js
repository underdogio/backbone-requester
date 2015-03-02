// Load in dependencies
var assert = require('assert');
var backboneRequester = require('../');

// Start our tests
describe('backbone-requester', function () {
  it('returns awesome', function () {
    assert.strictEqual(backboneRequester(), 'awesome');
  });
});
