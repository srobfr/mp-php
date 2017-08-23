const _ = require("lodash");
const assert = require('assert');

const Parser = require("microparser").Parser;
const g = require(__dirname + "/../../index.js").grammar;

const parser = new Parser();

describe('doc', function () {
    const model = {
        desc: "Test",
        longDesc: "Foo\nBar",
        annotations: [
            {name: "foo", value: null},
            {name: "var", value: `string[]`}
        ],
    };

    const text = `/**
 * Test
 *
 * Foo
 * Bar
 *
 * @foo
 *
 * @var string[]
 */`;

    it("set", function () {
        const $doc = parser.parse(g.doc);
        $doc.setModel(model);
        assert.equal($doc.text(), text);
    });

    it("get", function () {
        const $doc = parser.parse(g.doc, text);
        assert.deepEqual($doc.getModel(), model);
    });
});
