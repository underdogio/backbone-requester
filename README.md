# backbone-requester [![Build status](https://travis-ci.org/underdogio/backbone-requester.png?branch=master)](https://travis-ci.org/underdogio/backbone-requester)

Make server-based requests in [Backbone][] via [request][]

This is based off of [backbone-request][] but forked due to [lack of support for updates][update-issue].

[Backbone]: http://backbonejs.org/
[request]: https://github.com/request/request
[backbone-request]: https://github.com/Marak/node-backbone-request
[update-issue]: https://github.com/Marak/node-backbone-request/issues/4

## Getting Started
Install the module with: `npm install backbone-requester`

```js
// Load in our dependencies
var Backbone = require('Backbone');
var BackboneRequester = require('backbone-requester');
var request = require('request');

// Initialize and bind `BackboneRequester` to `Backbone`
var requester = new BackboneRequester(request);
requester.attach(Backbone);

// Create a new model and save it via `request`
var person = new Backbone.Model({name: 'Bark Ruffalo'});
person.save({
  error: function (model, err, options) {
    // Handle error from request (e.g. `ECONNREFUSED`)
  },
  success: function (model, response, options) {
    // Handle response data from request
  }
});
// For error-first callback handling, this can be combined with `backbone-callbacks`
```

## Documentation
`backbone-requester` exposes `BackboneRequester` via its `module.exports`.

### `new BackboneRequester(request)`
Constructor for a new `backbone-requester` instance

- request `Function` - Request library (or drop-in replacement) to use for making requests

### `backboneRequester.attach(Backbone)`
Bind `backboneRequester` instance to `Backbone` library. This will override `Backbone.sync` and replace it with our custom one.

- Backbone `Object` - Backbone library to bind to

**Returns:**

- Backbone `Object` - Mutated `Backbone` library with new `.sync`

### `backboneRequester.getSync(Backbone)`
Generates custom `Backbone.sync` method but returns instead of attaching.

- Backbone `Object` - Backbone library to grab configuration from

**Returns:**

- sync `Function` - Generated custom `Backbone.sync` to bind as you see fit

**Example:** Bind only to `Backbone.Model`

```js
// Load in our dependencies
var Backbone = require('Backbone');
var BackboneRequester = require('backbone-requester');
var request = require('request');

// Initialize  `BackboneRequester`
var requester = new BackboneRequester(request);

// Create a new model and save it via `request`
Backbone.Model.prototype.sync = requester.getSync();
```

### Replacement `Backbone.sync`
Once bound via `.attach`, the new `Backbone.sync` will use the passed in `request` library to make all requests. We try to be consistent with Backbone's API but have some one-off differences due to using `request`.

- We return a `request` object over jQuery deferred
    - This means `.success`/`.error` methods will not be accessible after the `.save`/`.fetch` request
- We don't support all jQuery options (e.g. `beforeSend`)
- `error` can receive `node` errors like `ECONNREFUSED`
    - We do not raise any errors based off of status code
        - If you would like that behavior, please comment on https://github.com/underdogio/backbone-requester/issues/2
- We don't support non-JSON `dataType's`
    - If you would like that behavior, please comment on https://github.com/underdogio/backbone-requester/issues/3

Everything else remains the same:

- We accept `url`, `method`, `headers`, and `data` as valid input as documented with jQuery
- `emulateHTTP` and `emulateJSON` are supported
- `error` function signature is same `(model, err, options)`
    - model `Object` - Current model being interacted with
    - err `Error` - Error from request
    - options `Object` - Options initially passed into
- `success` function signature is same `(model, response, options)`
    - model `Object` - Current model being interacted with
    - response `Object` - Response data from request
    - options `Object` - Options initially passed into

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint via `npm run lint` and test via `npm test`.

## License
Copyright (c) 2015 Underdog.io

Licensed under the MIT license.
