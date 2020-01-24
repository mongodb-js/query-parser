# mongodb-query-parser [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Safe parsing and validation for MongoDB queries (filters), projections, and more.

## Example

Turn some JS code as a string into a real JS object safely and with no bson type loss:

```javascript
require('mongodb-query-parser')('{_id: ObjectId("58c33a794d08b991e3648fd2")}');
// >>> {_id: ObjectId('58c33a794d08b991e3648fd2'x)}
```

### Usage with codemirror

```javascript
var parser = require('mongodb-query-parser');
var query = '{_id: ObjectId("58c33a794d08b991e3648fd2")}';
// What is this highlighting/language mode for this string?
parser.detect(query);
// >>> `javascript`

var queryAsJSON = '{"_id":{"$oid":"58c33a794d08b991e3648fd2"}}';
// What is this highlighting/language mode for this string?
parser.detect(queryAsJSON);
// >>> `json`

// Turn it into a JS string that looks pretty in codemirror:
parser.toJavascriptString(parse(query));
// >>> '{_id:ObjectId(\'58c33a794d08b991e3648fd2\')}'
```

### Extended JSON Support

```javascript
var parser = require('mongodb-query-parser');
var EJSON = require('mongodb-extended-json');
var queryAsAnObjectWithTypes = parser.parseFilter(query);

// Use extended json to prove types are intact
EJSON.stringify(queryAsAnObjectWithTypes);
// >>> '{"_id":{"$oid":"58c33a794d08b991e3648fd2"}}'

var queryAsJSON = '{"_id":{"$oid":"58c33a794d08b991e3648fd2"}}';
parser.detect(queryAsJSON);
// >>> `json`
```

## Migrations

We aim to not have any API breaking changes in this library as we consider it stable, but breakages may occur whenever we upgrade a core dependency or perform a major refactor.

We have a [migration guide](MIGRATION.md) which covers what to look out for between releases.

## Related

- [`mongodb-language-model`](https://github.com/mongodb-js/mongodb-language-model) Work with rich AST's of MongoDB queries
- [`mongodb-stage-validator`](https://github.com/mongodb-js/stage-validator) Parse and validate MongoDB Aggregation Pipeline stages.
- [`@mongodb-js/compass-query-bar`](https://github.com/mongodb-js/compass-query-bar) Compass UI Plugin that uses `mongodb-query-parser` for validation.

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/query-parser.svg
[travis_url]: https://travis-ci.org/mongodb-js/query-parser
[npm_img]: https://img.shields.io/npm/v/mongodb-query-parser.svg
[npm_url]: https://npmjs.org/package/mongodb-query-parser
