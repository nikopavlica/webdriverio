'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = isKeyboardShown;
/**
 *
 * Check whether the soft keyboard is shown or not.
 *
 * <example>
    :isKeyboardShown.js

    it('demonstrate the isKeyboardShown command', function () {
        console.log(browser.isKeyboardShown()); // true || false
    });
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

function isKeyboardShown() {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/is_keyboard_shown',
        method: 'GET'
    });
}
module.exports = exports['default'];