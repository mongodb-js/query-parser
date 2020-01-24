Migration Guide
===============

MongoDB Query Parser will attempt to minimise API changes between major versions. However, as part of our process to constantly improve security and keep packages up to date, backwards breaking changes can and will occur.

This is a guide to help you make the switch when this happens.


Table Of Contents
-----------------

- [Migrating from 1.0 to 2.0](#migrating-from-10-to-20)

Migrating from 1.0 to 2.0
-------------------------

This major version includes two big changes:
- [Updating the version of BSON from v1 to v4](#JS-BSON-breaking-changes)
- [Changing what types of MQL expressions are allowed in the query parser](#restricting-MQL-expressions)

### JS-BSON Breaking Changes

Please refer to [the list of BSON changes](https://github.com/mongodb/js-bson/blob/master/HISTORY.md), as well as the [upgrade documentation for v4](https://github.com/mongodb/js-bson/blob/master/docs/upgrade-to-v4.md) for more information, but breaking changes that have occurred as part of this upgrade are:

- **`ObjectId`** will now throw TypeErrors instead of silently erroring with invalid input
- **`Symbol`** has now been renamed to **`BSONSymbol`** as it was conflicting with the ES6 **`Symbol`** type
- BSON-JS now relies on Node.js v6 or above, and uses ES2015 features in non-transpiled code
- All BSON types are now ES6 Classes
- Long is now backed by `Long.js`

### Restricting MQL expressions

MongoDB Query Parser was making use of [`safer-eval`](https://www.npmjs.com/package/safer-eval) to parse difficult queries, which has been removed as this dependency is insecure.

We've replaced this dependency with [`ejson-shell-parser`](https://github.com/mongodb-js/ejson-shell-parser), which instead walks the AST of the query, and only attempts to evaluate the query if it considered safe and well-formed.

Because of this change, some queries that would validate are no longer valid.

Expressions that will now **fail** include:
- Function declarations (both `function` and lambdas)
- Ternary syntax (`y > 5 ? 'yes' : 'no'`)
- Comma syntax (`const a = 5, 3`)
- Variable assignment (`{ a: (c = 5, c)}`)

As a result, queries like this will no longer be accepted as valid input:
```javascript
{
  ternary: true ? 2 : 3,
  commaOperator: ("doesn't work", "as users expect"),
  functionDeclaration: (function(d) { return d.setMonth(0) })(new Date()),
  variableAssignment: (d = new Date(), d.setDate(1), d),
}
```

However, we now officially support these use-cases:
- Simple expressions (`+`, `-`, `/`, `!` etc)
- Method from Math (excluding `random`)
- Methods on Date (including `.now()`)
- Comments (both `//` and `/* */`)

This means you can build an MQL expression like so:
```javascript
{
  // Calculates the day for the current year (Jan 1 = 1, Feb 1 = 32)
  dayOfYear: Math.round((new Date().setHours(23) - new Date(new Date().getFullYear(), 0, 1, 0, 0, 0))/1000/60/60/24),
  now: Date.now(),
  symbol: BSONSymbol('Example Symbol')
}
```

As part of this change, error messages that are produced will be slightly different. While it'll still throw a `SyntaxError`, we now return the coordinates of the incorrect token, instead of just what token was incorrect.

```javascript
eval('({a: )') // SyntaxError: Unexpected token ')'
parseProject('({a: )') // SyntaxError: Unexpected token (1:5)
```
