const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../../index.js").grammar;

const parser = new Parser();

describe('constant', function () {
    describe('name', function () {
        it("get", () => {
            const $constant = parser.parse(g.constant, `const FOO = 2;`);
            assert.equal($constant.name(), "FOO");
        });
        it("set", () => {
            const $constant = parser.parse(g.constant, `const FOO = 2;`);
            $constant.name("BAR");
            assert.equal(`const BAR = 2;`, $constant.text());
        });
    });
    describe('value', function () {
        it("get", () => {
            const $constant = parser.parse(g.constant, `const FOO = 2;`);
            assert.equal($constant.value(), "2");
        });
        it("set", () => {
            const $constant = parser.parse(g.constant, `const FOO = 2;`);
            $constant.value("'test'");
            assert.equal(`const FOO = 'test';`, $constant.text());
        });
    });
    describe('desc', function () {
        it("get", () => {
            const $constant = parser.parse(g.constant, `const FOO = 2;`);
            assert.equal($constant.desc(), null);
        });
        it("set", () => {
            const $constant = parser.parse(g.constant, `const FOO = 2;`);
            $constant.desc("Foo bar.");
            assert.equal(`/**
 * Foo bar.
 */
const FOO = 2;`, $constant.text());
        });
    });
});
