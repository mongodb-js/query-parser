var parser = require('../');
var assert = require('assert');
var sinon = require('sinon');

const bson = require('bson');
const EJSON = require('mongodb-extended-json');
// const EJSON = require('bson').EJSON;
var debug = require('debug')('mongodb-query-parser:test');

function convert(string) {
  var res = parser.parseFilter(string);
  var ret = JSON.parse(EJSON.stringify(res, { legacy: true }));
  debug('converted', { input: string, parsed: res, encoded: ret });
  return ret;
}

describe('mongodb-query-parser', function() {
  describe('filter', function() {
    context('when no new keyword is provided', function() {
      it('returns the filter', function() {
        var res = parser.parseFilter(
          '{_id: ObjectId("58c33a794d08b991e3648fd2")}'
        );
        assert.deepEqual(res, {
          _id: new bson.ObjectId('58c33a794d08b991e3648fd2')
        });
      });
    });

    context('when a new keyword is provided', function() {
      it('returns the filter', function() {
        var res = parser.parseFilter(
          '{_id: new ObjectId("58c33a794d08b991e3648fd2")}'
        );
        assert.deepEqual(res, {
          _id: new bson.ObjectId('58c33a794d08b991e3648fd2')
        });
      });
    });

    describe('shell helpers', function() {
      it('should support Code', function() {
        assert.deepEqual(convert('Code("return true", {})'), {
          $code: 'return true',
          $scope: {}
        });
      });

      it('should support Date', function() {
        assert.deepEqual(convert('Date("2017-01-01T12:35:31.000Z")'), {
          $date: '2017-01-01T12:35:31.000Z'
        });
      });

      it('should support new Date', function() {
        assert.deepEqual(convert('new Date("2017-01-01T12:35:31.000Z")'), {
          $date: '2017-01-01T12:35:31.000Z'
        });
      });

      it('should support ISODate', function() {
        assert.deepEqual(convert('ISODate("2017-01-01T12:35:31.000Z")'), {
          $date: '2017-01-01T12:35:31.000Z'
        });
      });

      it('should support new ISODate', function() {
        assert.deepEqual(convert('new ISODate("2017-01-01T12:35:31.000Z")'), {
          $date: '2017-01-01T12:35:31.000Z'
        });
      });

      it('should support BinData', function() {
        assert.deepEqual(
          convert('new BinData(2, "OyQRAeK7QlWMr0E2xWapYg==")'),
          {
            $binary: 'OyQRAeK7QlWMr0E2xWapYg==',
            $type: '2'
          }
        );
      });

      it('should support UUID', function() {
        assert.deepEqual(
          convert('UUID("3b241101-e2bb-4255-8caf-4136c566a962")'),
          {
            $binary: 'OyQRAeK7QlWMr0E2xWapYg==',
            $type: '4'
          }
        );
      });

      it('should support functions', function() {
        assert.deepEqual(convert('{$match: () => true}'), {
          $match: '() => true'
        });

        assert.deepEqual(convert(
          `{
            $expr: {
              $function: {
                body: function(name) { return hex_md5(name) == "15b0a220baa16331e8d80e15367677ad"; },
                args: [ "$name" ],
                lang: "js"
              }
            }
          }`
        ), {
          $expr: {
            $function: {
              body: 'function(name) { return hex_md5(name) == "15b0a220baa16331e8d80e15367677ad"; }',
              args: [ '$name' ],
              lang: 'js'
            }
          }
        });

        assert.deepEqual(convert('{$match: function() { return this.x === 2; }}'), {
          $match: 'function() { return this.x === 2; }'
        });
      });

      context('for Date() and ISODate() without argument', function() {
        // mock a specific timestamp with sinon.useFakeTimers
        var now = 1533789516225;
        var nowStr = '2018-08-09T04:38:36.225Z';
        var clock;

        beforeEach(function() {
          clock = sinon.useFakeTimers(now);
        });

        afterEach(function() {
          clock.restore();
        });

        it('should support Date', function() {
          assert.deepEqual(convert('{d: Date()}'), {
            d: { $date: nowStr }
          });
        });

        it('should support new Date', function() {
          assert.deepEqual(convert('new Date()'), {
            $date: nowStr
          });
        });

        it('should support ISODate', function() {
          assert.deepEqual(convert('ISODate()'), {
            $date: nowStr
          });
        });

        it('should support new ISODate', function() {
          assert.deepEqual(convert('new ISODate()'), {
            $date: nowStr
          });
        });
      });

      it('should support Timestamp', function() {
        assert.deepEqual(convert('{t: Timestamp(0, 0)}'), {
          t: { $timestamp: {} }
        });
      });

      it('should support new Timestamp', function() {
        assert.deepEqual(convert('{t: new Timestamp(0, 0)}'), {
          t: { $timestamp: {} }
        });
      });

      it('should support inline regex', function() {
        assert.deepEqual(convert('/some.*regex+/i'), {
          $regex: 'some.*regex+',
          $options: 'i'
        });
      });

      it('should support RegExp', function() {
        assert.deepEqual(convert("RegExp('some.*regex+', 'i')"), {
          $regex: 'some.*regex+',
          $options: 'i'
        });
      });

      it('should support new RegExp', function() {
        assert.deepEqual(convert("new RegExp('some.*regex+', 'i')"), {
          $regex: 'some.*regex+',
          $options: 'i'
        });
      });

      it('should support ObjectId', function() {
        assert.deepEqual(convert('ObjectId("58c33a794d08b991e3648fd2")'), {
          $oid: '58c33a794d08b991e3648fd2'
        });
      });

      it('should support new ObjectId', function() {
        assert.deepEqual(convert('new ObjectId("58c33a794d08b991e3648fd2")'), {
          $oid: '58c33a794d08b991e3648fd2'
        });
      });

      it('should support ObjectID', function() {
        assert.deepEqual(convert('ObjectID("58c33a794d08b991e3648fd2")'), {
          $oid: '58c33a794d08b991e3648fd2'
        });
      });

      it('should support new ObjectID', function() {
        assert.deepEqual(convert('new ObjectID("58c33a794d08b991e3648fd2")'), {
          $oid: '58c33a794d08b991e3648fd2'
        });
      });

      it('should support NumberLong', function() {
        assert.deepEqual(convert('NumberLong("1234567890")'), {
          $numberLong: '1234567890'
        });
      });

      it('should support NumberLong > MAX_SAFE_INTEGER', function() {
        assert.deepEqual(convert('NumberLong("345678654321234552")'), {
          $numberLong: '345678654321234552'
        });
      });

      it('should support new NumberLong', function() {
        assert.deepEqual(convert('new NumberLong("1234567890")'), {
          $numberLong: '1234567890'
        });
      });

      it('should support NumberInt', function() {
        assert.deepEqual(convert('NumberInt("1234567890")'), 1234567890);
      });

      it('should support NumberInt with number', function() {
        assert.deepEqual(convert('NumberInt(1234567890)'), 1234567890);
      });

      it('should support NumberDecimal', function() {
        assert.deepEqual(convert('NumberDecimal("10.99")'), {
          $numberDecimal: '10.99'
        });
      });

      it('should support new NumberDecimal', function() {
        assert.deepEqual(convert('new NumberDecimal("10.99")'), {
          $numberDecimal: '10.99'
        });
      });

      it('should support MixKey', function() {
        assert.deepEqual(convert('MinKey()'), { $minKey: 1 });
      });

      it('should support MaxKey', function() {
        assert.deepEqual(convert('MaxKey()'), { $maxKey: 1 });
      });
    });
  });

  describe('isFilterValid', function() {
    context('when the string contains a NumberLong', function() {
      const query = '{value: NumberLong(1)}';
      const parsed = parser.isFilterValid(query);
      it('returns the bson long value', function() {
        assert.equal(parsed.value.toNumber(), 1);
      });
    });

    context('when turning off validation', function() {
      context('when the query is a valid object', function() {
        const query = '{value: NumberLong(1)}';
        const parsed = parser.isFilterValid(query, { validate: false });

        it('returns truthy', function() {
          assert.equal(parsed.value.toNumber(), 1);
        });
      });

      context('when the query is not a valid object', function() {
        const query = '{value: NumberLong(1)';
        const parsed = parser.isFilterValid(query, { validate: false });

        it('returns false', function() {
          assert.equal(parsed, false);
        });
      });
    });
  });

  describe('stringify', function() {
    it('should work', function() {
      var res = parser.parseFilter(
        '{_id: ObjectId("58c33a794d08b991e3648fd2")}'
      );
      var stringified = parser.stringify(res);
      assert.equal(stringified, "{_id: ObjectId('58c33a794d08b991e3648fd2')}");
    });
    it('should not added extra space when nesting', function() {
      assert.equal(
        parser.stringify({ a: { $exists: true } }),
        '{a: {$exists: true}}'
      );
    });

    context('when providing a long', function() {
      it('correctly converts to NumberLong', function() {
        var stringified = parser.stringify({ test: bson.Long.fromNumber(5) });
        assert.equal(stringified, '{test: NumberLong(5)}');
      });
    });

    context('when providing a decimal128', function() {
      it('correctly converts to NumberDecimal', function() {
        var stringified = parser.stringify({
          test: bson.Decimal128.fromString('5.5')
        });
        assert.equal(stringified, "{test: NumberDecimal('5.5')}");
      });
    });

    context('when providing a geo query', function() {
      const query = {
        coordinates: {
          $geoWithin: {
            $centerSphere: [[-79, 28], 0.04]
          }
        }
      };

      it('correctly replaces nested tabs with single spaces', function() {
        var stringified = parser.stringify(query);
        assert.equal(
          stringified,
          '{coordinates: {$geoWithin: { $centerSphere: [ [ -79, 28 ], 0.04 ]}}}'
        );
      });
    });

    context('when providing a Date', function() {
      it('correctly converts to an ISODate', function() {
        var res = parser.parseFilter(
          "{test: Date('2017-01-01T12:35:31.000Z')}"
        );
        var stringified = parser.stringify(res);
        assert.equal(
          stringified,
          "{test: ISODate('2017-01-01T12:35:31.000Z')}"
        );
      });
    });

    context('when providing an ISODate', function() {
      it('correctly converts to an ISODate', function() {
        var res = parser.parseFilter(
          "{test: ISODate('2017-01-01T12:35:31.000Z')}"
        );
        var stringified = parser.stringify(res);
        assert.equal(
          stringified,
          "{test: ISODate('2017-01-01T12:35:31.000Z')}"
        );
      });
    });
  });

  describe('project', function() {
    it('should default to null', function() {
      assert.equal(parser.parseProject(''), null);
      assert.equal(parser.parseProject('      '), null);
      assert.equal(parser.parseProject('{}'), null);
    });
    it('should parse valid project strings', function() {
      assert.deepEqual(parser.parseProject('{_id: 1}'), { _id: 1 });
      assert.deepEqual(parser.parseProject('{_id: -1}'), { _id: -1 });
      assert.deepEqual(parser.parseProject('{comments: { $slice: -1 }}'), {
        comments: { $slice: -1 }
      });
    });
    it('should detect invalid project strings', function() {
      assert.equal(parser.isProjectValid('{_id: "a"}'), false);
      assert.equal(parser.isProjectValid('{_id: "1"}'), false);
      assert.equal(parser.isProjectValid('{grabage'), false);
    });
  });

  describe('collation', function() {
    it('should default to null', function() {
      assert.equal(parser.parseCollation(''), null);
      assert.equal(parser.parseCollation('      '), null);
      assert.equal(parser.parseCollation('{}'), null);
    });
    it('should parse valid collation strings', function() {
      assert.deepEqual(parser.parseCollation('{locale: "simple"}'), {
        locale: 'simple'
      });
      assert.deepEqual(
        parser.parseCollation('{locale: "en_US", strength: 1}'),
        { locale: 'en_US', strength: 1 }
      );
    });
    it('should detect invalid project strings', function() {
      assert.equal(parser.isCollationValid('{invalid: "simple"}'), false);
      assert.equal(parser.isCollationValid('{locale: ""}'), false);
      assert.equal(parser.isCollationValid('{locale: "invalid"}'), false);
    });
  });

  describe('sort', function() {
    it('should default to null', function() {
      assert.equal(parser.parseSort(''), null);
      assert.equal(parser.parseSort('      '), null);
      assert.equal(parser.parseSort('{}'), null);
    });
    it('should work', function() {
      assert.deepEqual(parser.parseSort('{_id: 1}'), { _id: 1 });
      assert.deepEqual(parser.parseSort('{_id: -1}'), { _id: -1 });

      assert.equal(parser.isSortValid('{_id: "a"}'), false);
      assert.equal(parser.isSortValid('{_id: "1"}'), false);
      assert.equal(parser.isSortValid('{grabage'), false);
    });
  });

  describe('skip', function() {
    it('should work', function() {
      assert.equal(parser.isSkipValid('{skip: "a"}'), false);
      assert.equal(parser.isSkipValid('0'), 0);
      assert.equal(parser.isSkipValid(1), 1);
      assert.equal(parser.isSkipValid('   '), parser.DEFAULT_SKIP);
    });
  });

  describe('limit', function() {
    it('should work', function() {
      assert.equal(parser.isLimitValid('{limit: "a"}'), false);
      assert.equal(parser.isLimitValid('0'), 0);
      assert.equal(parser.isLimitValid(1), 1);
      assert.equal(parser.isLimitValid('   '), parser.DEFAULT_LIMIT);
    });
  });

  describe('maxTimeMS', function() {
    it('Validates as a number', function() {
      assert.equal(parser.isMaxTimeMSValid('{maxTimeMS: "a"}'), false);
      assert.equal(parser.isMaxTimeMSValid('0'), 0);
      assert.equal(parser.isMaxTimeMSValid(1), 1);
      assert.equal(parser.isMaxTimeMSValid('   '), parser.DEFAULT_MAX_TIME_MS);
    });
  });
});
