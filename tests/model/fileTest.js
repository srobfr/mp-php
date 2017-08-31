const _ = require("lodash");
const assert = require('assert');

const Parser = require("microparser").Parser;
const g = require(__dirname + "/../../index.js").grammar;

const parser = new Parser();

describe('file', function () {
    const model = {
        namespace: "Foo\\Plop",
        name: "Test",
        desc: "Test",
        longDesc: "Foo\nBar",
        annotations: [
            {name: "foo", value: null},
        ],
        implements: [
            {name: "Bar"},
            {name: "Foo"},
            {name: "Plop"}
        ],
        extends: "AbstractTest",
        final: true,
        abstract: true,
        kind: "interface",
        uses: [
            {fqn: "Foo\\Bar", alias: "Plop"},
        ],
        traits: [
            {fqn: "MyTrait"},
        ],
        constants: [
            {name: "FOO", value: "42", desc: "Foo constant.", longDesc: null},
        ],
        properties: [
            {name: "bar", value: "42", desc: "$bar property.", annotations: [], visibility: "private", abstract: false, longDesc: null, static: false},
        ],
        methods: [
            {
                desc: "Test",
                longDesc: "Foo",
                annotations: [
                    {name: "param", value: "Foo $foo"},
                    {name: "param", value: "$bar"},
                ],
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
            },
        ],
    };

    const text = `<?php

namespace Foo\\Plop;

use Foo\\Bar as Plop;

/**
 * Test
 *
 * Foo
 * Bar
 *
 * @foo
 */
final abstract interface Test extends AbstractTest implements Bar, Foo, Plop
{
    use MyTrait;

    /**
     * Foo constant.
     */
    const FOO = 42;

    /**
     * $bar property.
     */
    private $bar = 42;

    /**
     * Test
     *
     * Foo
     *
     * @param Foo $foo
     * @param $bar
     */
    final abstract static protected function foo(Foo $foo, &$bar = 42);
}
`;

    it("set", function () {
        const $file = parser.parse(g.file);
        $file.setModel(model);
        assert.equal($file.text(), text);
    });

    it("get", function () {
        const $file = parser.parse(g.file, text);
        assert.deepEqual($file.getModel(), model);
    });
});
