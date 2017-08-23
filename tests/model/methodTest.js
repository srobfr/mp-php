const _ = require("lodash");
const assert = require('assert');

const Parser = require("microparser").Parser;
const g = require(__dirname + "/../../index.js").grammar;

const parser = new Parser();

describe('method', function () {
    const model = {
        desc: "Test",
        longDesc: "Foo",
        name: "foo",
        visibility: "protected",
        abstract: true,
        static: true,
        final: true,
        body: `// TODO`,
        args: [
            {name: "foo", byReference: false, type: "Foo", value: null},
            {name: "bar", byReference: true, type: null, value: "42"}
        ],
    };

    const text = `/**
 * Test
 *
 * Foo
 */
final abstract static protected function foo(Foo $foo, &$bar = 42)
{
    // TODO
}`;

    it("set", function () {
        const $method = parser.parse(g.method);
        $method.setModel(model);
        assert.equal($method.text(), text);
    });

    it("get", function () {
        const $method = parser.parse(g.method, text);
        assert.deepEqual($method.getModel(), model);
    });
});
