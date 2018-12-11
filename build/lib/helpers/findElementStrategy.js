'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _ErrorHandler = require('../utils/ErrorHandler');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_SELECTOR = 'css selector';
var DIRECT_SELECTOR_REGEXP = /^(id|css selector|xpath|link text|partial link text|name|tag name|class name|-android uiautomator|-ios uiautomation|-ios predicate string|-ios class chain|accessibility id):(.+)/;

var findStrategy = function findStrategy() {
    var value = arguments.length <= 0 ? undefined : arguments[0];
    var relative = arguments.length > 1 ? arguments.length <= 1 ? undefined : arguments[1] : false;
    var xpathPrefix = relative ? './/' : '//';

    /**
     * set default selector
     */
    var using = DEFAULT_SELECTOR;

    if (typeof value !== 'string') {
        throw new _ErrorHandler.ProtocolError('selector needs to be typeof `string`');
    }

    if (arguments.length === 3) {
        return {
            using: arguments.length <= 0 ? undefined : arguments[0],
            value: arguments.length <= 1 ? undefined : arguments[1]
        };
    }

    /**
     * check if user has specified locator strategy directly
     */
    var match = value.match(DIRECT_SELECTOR_REGEXP);
    if (match) {
        return {
            using: match[1],
            value: match[2]
        };
    }

    // check value type
    // use id strategy if value starts with # and doesnt contain any other CSS selector-relevant character
    // regex to match ids from http://stackoverflow.com/questions/18938390/regex-to-match-ids-in-a-css-file
    if (value.search(/^#-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/) > -1) {
        using = 'id';
        value = value.slice(1);

        // use xPath strategy if value starts with //
    } else if (value.indexOf('/') === 0 || value.indexOf('(') === 0 || value.indexOf('../') === 0 || value.indexOf('./') === 0 || value.indexOf('*/') === 0) {
        using = 'xpath';

        // use link text strategy if value startes with =
    } else if (value.indexOf('=') === 0) {
        using = 'link text';
        value = value.slice(1);

        // use partial link text strategy if value startes with *=
    } else if (value.indexOf('*=') === 0) {
        using = 'partial link text';
        value = value.slice(2);

        // recursive element search using the UiAutomator library (Android only)
    } else if (value.indexOf('android=') === 0) {
        using = '-android uiautomator';
        value = value.slice(8);

        // recursive element search using the UIAutomation or XCUITest library (iOS-only)
    } else if (value.indexOf('ios=') === 0) {
        value = value.slice(4);

        if (value.indexOf('predicate=') === 0) {
            // Using 'ios=predicate=' (iOS 10+ only)
            using = '-ios predicate string';
            value = value.slice(10);
        } else if (value.indexOf('chain=') === 0) {
            // Using 'ios=chain=' (iOS 10+ only)
            using = '-ios class chain';
            value = value.slice(6);
        } else {
            // Legacy iOS (<= 9.3) UIAutomation library
            using = '-ios uiautomation';
        }

        // recursive element search using accessibility id
    } else if (value.indexOf('~') === 0) {
        using = 'accessibility id';
        value = value.slice(1);

        // class name mobile selector
        // for iOS = UIA...
        // for Android = android.widget
    } else if (value.slice(0, 3) === 'UIA' || value.slice(0, 15) === 'XCUIElementType' || value.slice(0, 14).toLowerCase() === 'android.widget') {
        using = 'class name';

        // use tag name strategy if value contains a tag
        // e.g. "<div>" or "<div />"
    } else if (value.search(/<[a-zA-Z-]+( \/)*>/g) >= 0) {
        using = 'tag name';
        value = value.replace(/<|>|\/|\s/g, '');

        // use name strategy if value queries elements with name attributes
        // e.g. "[name='myName']" or '[name="myName"]'
    } else if (value.search(/^\[name=("|')([a-zA-z0-9\-_. ]+)("|')]$/) >= 0) {
        using = 'name';
        value = value.match(/^\[name=("|')([a-zA-z0-9\-_. ]+)("|')]$/)[2];

        // allow to move up to the parent or select current element
    } else if (value === '..' || value === '.') {
        using = 'xpath';

        // any element with given class, id, or attribute and content
        // e.g. h1.header=Welcome or [data-name=table-row]=Item or #content*=Intro
    } else {
        var _match = value.match(new RegExp([
        // HTML tag
        /^([a-z0-9]*)/,
        // optional . or # + class or id
        /(?:(\.|#)(-?[_a-zA-Z]+[_a-zA-Z0-9-]*))?/,
        // optional [attribute-name="attribute-value"]
        /(?:\[(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)(?:=(?:"|')([a-zA-z0-9\-_. ]+)(?:"|'))?\])?/,
        // *=query or =query
        /(\*)?=(.+)$/].map(function (rx) {
            return rx.source;
        }).join('')));

        if (_match) {
            var PREFIX_NAME = { '.': 'class', '#': 'id' };
            var conditions = [];

            var _match$slice = _match.slice(1),
                _match$slice2 = (0, _slicedToArray3.default)(_match$slice, 7),
                tag = _match$slice2[0],
                prefix = _match$slice2[1],
                name = _match$slice2[2],
                attrName = _match$slice2[3],
                attrValue = _match$slice2[4],
                partial = _match$slice2[5],
                query = _match$slice2[6];

            if (prefix) {
                conditions.push(`contains(@${PREFIX_NAME[prefix]}, "${name}")`);
            }
            if (attrName) {
                conditions.push(attrValue ? `contains(@${attrName}, "${attrValue}")` : `@${attrName}`);
            }
            if (partial) {
                conditions.push(`contains(., "${query}")`);
            } else {
                conditions.push(`normalize-space() = "${query}"`);
            }

            using = 'xpath';
            value = `${xpathPrefix}${tag || '*'}[${conditions.join(' and ')}]`;
        }
    }

    return {
        using: using,
        value: value
    };
};

exports.default = findStrategy;
module.exports = exports['default'];