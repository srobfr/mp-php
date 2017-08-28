const _ = require("lodash");
const assert = require('assert');

const Parser = require("microparser").Parser;
const g = require(__dirname + "/../../index.js").grammar;

const parser = new Parser();

describe('property', function () {
    const model = {
        desc: "Test",
        longDesc: "Foo\nBar",
        annotations: [],
        name: "foo",
        value: "'fooBar'",
        visibility: "protected",
        abstract: true,
        static: true,
    };

    const text = `/**
 * Test
 *
 * Foo
 * Bar
 */
abstract static protected $foo = 'fooBar';`;

    it("set", function () {
        const $property = parser.parse(g.property);
        $property.setModel(model);
        assert.equal($property.text(), text);
    });

    it("get", function () {
        const $property = parser.parse(g.property, text);
        assert.deepEqual($property.getModel(), model);
    });

});
