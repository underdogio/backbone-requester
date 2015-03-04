// Load in depdendencies
var assert = require('assert');
var FixedServer = require('fixed-server');
var nineTrack = require('nine-track');

// Define our FakeReqres server
var fakeReqres = new FixedServer({port: 9001});
var reqresNineTrack = nineTrack({
  url: 'http://reqr.es',
  fixtureDir: __dirname + '/../test-files/reqres-nine-track/'
});

// Add a method to test headers
fakeReqres.addFixture('GET 200 /api/users/:id#headers', {
  method: 'get',
  route: '/api/users/:id',
  response: function (req, res) {
    res.send(req.headers);
  }
});

// Add a method to proxy anything
fakeReqres.addFixture('ALL * *', {
  method: 'all',
  route: '*',
  response: reqresNineTrack
});

// Add custom methods to start/stop `nine-track` series
// DEV: We keep key and fixtures together to prevent fragmentations. This should be all or nothing for a test case.
fakeReqres.runSeries = function (key, fixtures) {
  assert(key, '`fakeReqres.runSeries` requires `key` to run. Please provide it');
  assert(fixtures, '`fakeReqres.runSeries` requires `fixtures` to run. Please provide it');
  before(function startSeries () {
    reqresNineTrack.startSeries(key);
  });
  after(function stopSeries () {
    reqresNineTrack.stopSeries();
  });
  fakeReqres.run(fixtures);
};

// Expose our fake server
module.exports = fakeReqres;
