'use strict';

const EJSON = require('mongodb-extended-json');
const stringify = require('./stringify');
const ms = require('ms');
const { default: ejsonParse } = require('ejson-shell-parser');
const _ = require('lodash');
const queryLanguage = require('mongodb-language-model');
const debug = require('debug')('mongodb-query-parser');
const { COLLATION_OPTIONS } = require('./constants');

const DEFAULT_FILTER = {};
const DEFAULT_SORT = null;
const DEFAULT_LIMIT = 0;
const DEFAULT_SKIP = 0;
const DEFAULT_PROJECT = null;
const DEFAULT_COLLATION = null;
const DEFAULT_MAX_TIME_MS = ms('5 seconds');
const QUERY_PROPERTIES = ['filter', 'project', 'sort', 'skip', 'limit'];

function isEmpty(input) {
  const s = _.trim(input);
  if (s === '{}') {
    return true;
  }
  return _.isEmpty(s);
}

function isNumberValid(input) {
  if (isEmpty(input)) {
    return 0;
  }
  return /^\d+$/.test(input) ? parseInt(input, 10) : false;
}

function parseProject(input) {
  return ejsonParse(input, { mode: 'loose' });
}

function parseCollation(input) {
  return ejsonParse(input, { mode: 'loose' });
}

function parseSort(input) {
  return ejsonParse(input, { mode: 'loose' });
}

function parseFilter(input) {
  return ejsonParse(input, { mode: 'loose' });
}

module.exports = function(filter, project = DEFAULT_PROJECT) {
  if (arguments.length === 1) {
    if (_.isString(filter)) {
      return parseFilter(filter);
    }
  }
  return {
    filter: parseFilter(filter),
    project: parseProject(project)
  };
};

module.exports.parseFilter = function(input) {
  if (isEmpty(input)) {
    return DEFAULT_FILTER;
  }
  return parseFilter(input);
};

module.exports.parseCollation = function(input) {
  if (isEmpty(input)) {
    return DEFAULT_COLLATION;
  }
  return parseCollation(input);
};

/**
 * Validation function for a query `filter`. Must be a valid MongoDB query
 * according to the query language.
 *
 * @param {String} input
 * @return {Boolean|Object} false if not valid, or the parsed filter.
 */
module.exports.isFilterValid = function(input) {
  if (isEmpty(input)) {
    return DEFAULT_FILTER;
  }
  try {
    const parsed = parseFilter(input);

    // is it a valid MongoDB query according to the language?
    return queryLanguage.accepts(EJSON.stringify(parsed)) ? parsed : false;
  } catch (e) {
    debug('Filter "%s" is invalid', input, e);
    return false;
  }
};

/**
 * Validation of collation object keys and values.
 *
 * @param {Object} collation
 * @return {Boolean|Object} false if not valid, otherwise the parsed project.
 */
function isCollationValid(collation) {
  let isValid = true;
  _.forIn(collation, function(value, key) {
    const itemIndex = _.findIndex(COLLATION_OPTIONS, key);
    if (itemIndex === -1) {
      debug('Collation "%s" is invalid bc of its keys', collation);
      isValid = false;
    }
    if (COLLATION_OPTIONS[itemIndex][key].includes(value) === false) {
      debug('Collation "%s" is invalid bc of its values', collation);
      isValid = false;
    }
  });
  return isValid ? collation : false;
}

/**
 * Validation function for a query `collation`.
 *
 * @param {String} input
 * @return {Boolean|Object} false if not valid, or the parsed filter.
 */
module.exports.isCollationValid = function(input) {
  if (isEmpty(input)) {
    return DEFAULT_COLLATION;
  }
  try {
    const parsed = parseCollation(input);
    return isCollationValid(parsed);
  } catch (e) {
    debug('Collation "%s" is invalid', input, e);
    return false;
  }
};

function isValueOkforProject(val) {
  return (_.isNumber(val) && (val === 0 || val === 1)) || _.isObject(val);
}

module.exports.parseProject = function(input) {
  if (isEmpty(input)) {
    return DEFAULT_PROJECT;
  }
  return parseProject(input);
};

/**
 * Validation function for a query `project`. Must only have 0 or 1 as values.
 *
 * @param {String} input
 * @return {Boolean|Object} false if not valid, otherwise the parsed project.
 */
module.exports.isProjectValid = function(input) {
  if (isEmpty(input)) {
    return DEFAULT_PROJECT;
  }

  try {
    const parsed = parseProject(input);
    if (!_.every(parsed, isValueOkforProject)) {
      debug('Project "%s" is invalid bc of its values', input);
      return false;
    }
    return parsed;
  } catch (e) {
    debug('Project "%s" is invalid', input, e);
    return false;
  }
};

function isValueOkforSort(val) {
  return _.isNumber(val) && (val === 1 || val === -1);
}

module.exports.parseSort = function(input) {
  if (isEmpty(input)) {
    return DEFAULT_SORT;
  }
  return parseSort(input);
};

/**
 * validation function for a query `sort`. Must only have -1 or 1 as values.
 *
 * @param {String} input
 * @return {Boolean|Object} false if not valid, otherwise the cleaned-up sort.
 */
module.exports.isSortValid = function(input) {
  if (isEmpty(input)) {
    return DEFAULT_SORT;
  }

  try {
    const parsed = parseSort(input);
    if (!_.every(parsed, isValueOkforSort)) {
      debug('Sort "%s" is invalid bc of its values', input);
      return false;
    }
    return parsed;
  } catch (e) {
    debug('Sort "%s" is invalid', input, e);
    return false;
  }
};

/**
 * Validation function for a query `maxTimeMS`. Must be digits only.
 *
 * @param {String} input
 * @return {Boolean|Number} false if not valid, otherwise the cleaned-up skip.
 */
module.exports.isMaxTimeMSValid = function(input) {
  if (isEmpty(input)) {
    return DEFAULT_MAX_TIME_MS;
  }
  return isNumberValid(input);
};

/**
 * Validation function for a query `skip`. Must be digits only.
 *
 * @param {String} input
 * @return {Boolean|Number} false if not valid, otherwise the cleaned-up skip.
 */
module.exports.isSkipValid = function(input) {
  if (isEmpty(input)) {
    return DEFAULT_SKIP;
  }
  return isNumberValid(input);
};

/**
 * Validation function for a query `limit`. Must be digits only.
 *
 * @param {String} input
 * @return {Boolean|Number} false if not valid, otherwise the cleaned-up limit.
 */
module.exports.isLimitValid = function(input) {
  if (isEmpty(input)) {
    return DEFAULT_LIMIT;
  }
  return isNumberValid(input);
};

module.exports.validate = function(what, input) {
  const validator = module.exports[`is${_.upperFirst(what)}Valid`];
  if (!validator) {
    debug('Do not know how to validate `%s`. Returning false.', what);
    return false;
  }
  return validator(input);
};

module.exports.toJSString = stringify.toJSString;
module.exports.stringify = stringify.stringify;

module.exports.QUERY_PROPERTIES = QUERY_PROPERTIES;
module.exports.DEFAULT_FILTER = DEFAULT_FILTER;
module.exports.DEFAULT_SORT = DEFAULT_SORT;
module.exports.DEFAULT_LIMIT = DEFAULT_LIMIT;
module.exports.DEFAULT_SKIP = DEFAULT_SKIP;
module.exports.DEFAULT_PROJECT = DEFAULT_PROJECT;
module.exports.DEFAULT_COLLATION = DEFAULT_COLLATION;
module.exports.DEFAULT_MAX_TIME_MS = DEFAULT_MAX_TIME_MS;
