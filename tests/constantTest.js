const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../index.js").grammar;

const parser = new Parser();

describe('constant', function () {
    describe('name', function () {
        it("get", () => {
            const $const = parser.parse(g.constant, `const FOO = 2;`);
            assert.equal($const.name(), "FOO");
        });
        it("set", () => {
            const $const = parser.parse(g.constant, `const FOO = 2;`);
            $const.name("BAR");
            assert.equal(`const BAR = 2;`, $const.text());
        });
    });
    describe('value', function () {
        it("get", () => {
            const $const = parser.parse(g.constant, `const FOO = 2;`);
            assert.equal($const.value(), "2");
        });
        it("set", () => {
            const $const = parser.parse(g.constant, `const FOO = 2;`);
            $const.value("'test'");
            assert.equal(`const FOO = 'test';`, $const.text());
        });
    });
});
