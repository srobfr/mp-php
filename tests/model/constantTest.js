const _ = require("lodash");
const assert = require('assert');

const Parser = require("microparser").Parser;
const g = require(__dirname + "/../../index.js").grammar;

const parser = new Parser();

describe('constant', function () {
    const model = {
        desc: "Test",
        longDesc: "Foo\nBar",
        name: "FOO",
        value: `42`,
    };

    const text = `/**
 * Test
 *
 * Foo
 * Bar
 */
const FOO = 42;`;

    it("set", function () {
        const $constant = parser.parse(g.constant);
        $constant.setModel(model);
        assert.equal($constant.text(), text);
    });

    it("get", function () {
        const $constant = parser.parse(g.constant, text);
        assert.deepEqual($constant.getModel(), model);
    });
});
