// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');

// https://github.com/jashkenas/backbone/blob/1.1.2/backbone.js#L1592-L1595
// Throw an error when a URL is needed, and none is supplied.
var urlError = function () {
  throw new Error('A "url" property or function must be specified');
};

// Define our constructor
function BackboneRequester(request) {
  // Verify we received our parameters and save them for later
  assert(request, '`BackboneRequester` requires `request` as a parameter. Please provide it.');
  this.request = request;
}
BackboneRequester.prototype = {
  attach: function (Backbone) {
    // Override Backbone's sync with our sync
    Backbone.sync = this.getSync(Backbone);
    return Backbone;
  },
  getSync: function (Backbone) {
    // Create a custom sync method
    // https://github.com/jashkenas/backbone/blob/1.1.2/backbone.js#L57-L66
    // https://github.com/jashkenas/backbone/blob/1.1.2/backbone.js#L1114-L1210
    var that = this;
    function sync(method, model, options) {
      // Determine HTTP verb for our action
      var type = that.methodMap[method];

      // Default options, unless specified.
      _.defaults(options || (options = {}), {
        emulateHTTP: Backbone.emulateHTTP,
        emulateJSON: Backbone.emulateJSON
      });

      // Default JSON-request options.
      var params = {type: type, dataType: 'json', headers: {Accept: 'application/json'}};

      // Ensure that we have a URL.
      if (!options.url) {
        params.url = _.result(model, 'url') || urlError();
      }

      // Ensure that we have the appropriate request data.
      if ((options.data === null || options.data === undefined) &&
          model && (method === 'create' || method === 'update' || method === 'patch')) {
        params.headers['Content-Type'] = 'application/json';
        params.data = JSON.stringify(options.attrs || model.toJSON(options));
      }

      // For older servers, emulate JSON by encoding the request into an HTML-form.
      if (options.emulateJSON) {
        params.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        params.bodyType = 'form';
        params.data = params.data ? {model: params.data} : {};
      }

      // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
      // And an `X-HTTP-Method-Override` header.
      if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
        params.type = 'POST';
        if (options.emulateJSON) {
          params.data._method = type;
        }
        params.headers['X-HTTP-Method-Override'] = type;
      }

      // Don't process data on a non-GET request.
      if (params.type !== 'GET' && !options.emulateJSON) {
        params.processData = false;
      }

      // Allow user to override our options
      var paramsHeaders = _.extend(params.headers, options.headers);
      _.extend(params, options);
      params.headers = paramsHeaders;

      // Map parameters to request parameters
      var reqParams = {
        url: params.url,
        method: params.type,
        headers: params.headers
      };

      if (params.data !== undefined) {
        if (params.bodyType === 'form') {
          reqParams.form = params.data;
        } else {
          reqParams.body = params.data;
        }
      }

      // Make the request
      var req = that.request(reqParams, function handleResponse (err, res, _body) {
        // If there was a http based error (e.g. `ECONNREFUSED`), callback with it
        if (err) {
          return params.error(err);
        }

        // If the response is non-empty, gracefully parse our JSON
        var body;
        if (params.dataType === 'json') {
          if (_body) {
            try {
              body = JSON.parse(_body);
            } catch (err) {
              err.body = _body;
              return params.error(err);
            }
          }
        } else {
          return params.error(new Error('Unsupported `dataType` "' + params.dataType + '". ' +
            'Currently `backbone-requester` only support "json". ' +
            'Please see https://github.com/underdogio/backbone-requester/issues/3 for more information.'));
        }

        // Otherwise, call our success handler
        return params.success(body);
      });

      // Publish our request object
      model.trigger('request', model, req, options);
      return req;
    }

    // Return our sync method
    return sync;
  },
  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  methodMap: {
    create: 'POST',
    update: 'PUT',
    patch:  'PATCH',
    'delete': 'DELETE',
    read:   'GET'
  }
};

// Export our function
module.exports = BackboneRequester;
