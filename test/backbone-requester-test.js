// Load in dependencies
var _ = require('underscore');
var Backbone = require('backbone');
var expect = require('chai').expect;
var request = require('request');
var BackboneRequester = require('../');
var FakeReqres = require('./utils/fake-reqres');

// Bind `backbone-requester` to Backbone
var requester = new BackboneRequester(request);
requester.attach(Backbone);

// Define test utilities
var testUtils = {
  request: function (fn) {
    before(function requestFn (done) {
      // Save our erorr/data and callback
      var that = this;
      return fn.call(this, {
        error: function handleError (model, err, options) {
          that.model = model;
          that.err = err;
          that.options = options;
          done();
        },
        success: function handleSuccess (model, response, options) {
          that.err = null;
          that.model = model;
          that.response = response;
          that.options = options;
          done();
        }
      });
    });
    after(function cleanup () {
      delete this.err;
      delete this.model;
    });
  }
};

// Define a model to make requests for
// http://reqr.es/
var UserModel = Backbone.Model.extend({
  urlRoot: 'http://localhost:9001/api/users',
  parse: function (body) {
    // DEV: We have `data` for create but no wrapper for update
    if (body.data) {
      return body.data;
    } else {
      return body;
    }
  }
});
var UserCollection = Backbone.Collection.extend({
  url: 'http://localhost:9001/api/users',
  model: UserModel,
  parse: function (body) {
    return body.data;
  }
});

// Start our tests
describe('A Backbone model using `backbone-requester`', function () {
  describe('retrieving an item', function () {
    FakeReqres.run(['ALL * *']);
    testUtils.request(function getItem (requestOptions) {
      this.user = new UserModel({id: 2});
      this.user.fetch(requestOptions);
    });
    after(function cleanup () {
      delete this.user;
    });

    it('pulls down the information', function () {
      // Documentation says `{data: {id: 2, first_name: 'lucille', last_name: 'bluth', avatar: 's3...'}}`
      expect(this.err).to.equal(null);
      expect(this.user.attributes).to.have.property('first_name', 'lucille');
    });
  });

  describe('creating an item', function () {
    FakeReqres.runSeries('create', ['ALL * *']);
    testUtils.request(function getItem (requestOptions) {
      this.user = new UserModel({name: 'Bark Ruffalo'});
      this.user.save(null, _.defaults({
        wait: true
      }, requestOptions));
    });
    after(function cleanup () {
      delete this.user;
    });

    it('creates the item', function () {
      expect(this.err).to.equal(null);
      expect(this.user.attributes).have.property('id');
      expect(this.user.attributes).have.property('name', 'Bark Ruffalo');
    });
  });

  describe('updating an item', function () {
    FakeReqres.runSeries('retrieve-update', ['ALL * *']);
    testUtils.request(function getItem (requestOptions) {
      this.user = new UserModel({id: 2});
      this.user.fetch(requestOptions);
    });
    testUtils.request(function updateItem (requestOptions) {
      this.user.save({
        first_name: 'Bark'
      }, _.defaults({
        wait: true
      }, requestOptions));
    });
    after(function cleanup () {
      delete this.user;
    });

    it('updates the item', function () {
      expect(this.err).to.equal(null);
      expect(this.user.attributes).have.property('first_name', 'Bark');
      expect(this.user.attributes).have.property('updatedAt');
    });
  });
});

describe('A Backbone collection using `backbone-requester`', function () {
  FakeReqres.runSeries('collection-retrieve-delete', ['ALL * *']);
  describe('retrieiving a set of items', function () {
    testUtils.request(function getCollection (requestOptions) {
      this.users = new UserCollection();
      this.users.fetch(requestOptions);
    });
    after(function cleanup () {
      delete this.users;
    });

    it('pulls down the items', function () {
      expect(this.err).to.equal(null);
      expect(this.users).to.have.length(3);
      // [{id, first_name, last_name, avatar}, * 3]
      expect(this.users.get(/* id */ 1).attributes).to.have.property('first_name', 'george');
    });

    describe('destroying an item', function () {
      testUtils.request(function getItem (requestOptions) {
        this.user = this.users.get(1);
        this.user.destroy(_.defaults({
          wait: true
        }, requestOptions));
      });
      after(function cleanup () {
        delete this.user;
      });

      it('deletes the item', function () {
        // Assert we removed it from the collection meaning sucess
        expect(this.err).to.equal(null);
        expect(this.users).to.have.length(2);
        expect(this.users.get(1)).to.equal(undefined);
      });
    });
  });
});

describe('A Backbone model retrieving from a downed server', function () {
  testUtils.request(function getItem (requestOptions) {
    this.user = new UserModel({id: 2});
    this.user.fetch(requestOptions);
  });
  after(function cleanup () {
    delete this.user;
  });

  it('receives an error', function () {
    expect(this.err).to.not.equal(null);
    expect(this.err).to.have.property('code', 'ECONNREFUSED');
  });
});
