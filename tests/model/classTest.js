const _ = require("lodash");
const assert = require('assert');

const Parser = require("microparser").Parser;
const g = require(__dirname + "/../../index.js").grammar;

const parser = new Parser();

describe('class', function () {
    const model = {
        name: "Test",
        desc: "Test",
        annotations: [
            {name: "author", value: "Simon Robert <srob@srob.fr>"},
        ],
        longDesc: "Foo\nBar",
        implements: [
            {name: "Bar"},
            {name: "Foo"},
            {name: "Plop"}
        ],
        extends: "AbstractTest",
        final: true,
        abstract: true,
        kind: "class",
        uses: [
            {fqn: "Foo\\Bar"},
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
                abstract: false,
                static: true,
                final: true,
                type: null,
                body: `// TODO`,
                args: [
                    {name: "foo", byReference: false, type: "Foo", value: null},
                    {name: "bar", byReference: true, type: null, value: "42"}
                ],
            },
        ],
    };

    const text = `/**
 * Test
 *
 * Foo
 * Bar
 *
 * @author Simon Robert <srob@srob.fr>
 */
final abstract class Test extends AbstractTest implements Bar, Foo, Plop
{
    use Foo\\Bar;

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
    final static protected function foo(Foo $foo, &$bar = 42)
    {
        // TODO
    }
}`;

    it("set", function () {
        const $class = parser.parse(g.class);
        $class.setModel(model);
        assert.equal($class.text(), text);
    });

    it("get", function () {
        const $class = parser.parse(g.class, text);
        assert.deepEqual($class.getModel(), model);
    });
});
