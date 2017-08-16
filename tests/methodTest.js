const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../index.js").grammar;

const parser = new Parser();

describe('funcArgType', function () {
    describe('phpDocType', function () {
        it("get", () => {
            const $funcArgType = parser.parse(g.funcArgType, `?Foo\\Bar`);
            assert.equal($funcArgType.phpDocType(), "Foo\\Bar|null");
        });
        it("get 2", () => {
            const $funcArgType = parser.parse(g.funcArgType, `Foo\\Bar`);
            assert.equal($funcArgType.phpDocType(), "Foo\\Bar");
        });
        it("get 3", () => {
            const $funcArgType = parser.parse(g.funcArgType, `string`);
            assert.equal($funcArgType.phpDocType(), "string");
        });
        it("set", () => {
            const $funcArgType = parser.parse(g.funcArgType, `Foo`);
            $funcArgType.phpDocType("Bar");
            assert.equal($funcArgType.text(), "Bar");
        });
        it("set 2", () => {
            const $funcArgType = parser.parse(g.funcArgType, `Foo`);
            $funcArgType.phpDocType("Bar|null");
            assert.equal($funcArgType.text(), "?Bar");
        });
        it("set 3", () => {
            const $funcArgType = parser.parse(g.funcArgType, `Foo`);
            $funcArgType.phpDocType("null|Bar");
            assert.equal($funcArgType.text(), "?Bar");
        });
        it("set 4", () => {
            const $funcArgType = parser.parse(g.funcArgType, `Foo`);
            $funcArgType.phpDocType("Bar[]");
            assert.equal($funcArgType.text(), "array");
        });
        it("set 5", () => {
            const $funcArgType = parser.parse(g.funcArgType, `Foo`);
            $funcArgType.phpDocType("Bar[]|null");
            assert.equal($funcArgType.text(), "?array");
        });
    });
});

describe('funcArg', function () {
    describe('name', function () {
        it("get", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo $foo = 4`);
            assert.equal($funcArg.name(), "foo");
        });
        it("set", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo   $foo = 4`);
            $funcArg.name("bar");
            assert.equal(`Foo   $bar = 4`, $funcArg.text());
        });
    });

    describe('type', function () {
        it("get", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo $foo = 4`);
            assert.equal($funcArg.type(), "Foo");
        });
        it("get null", () => {
            const $funcArg = parser.parse(g.funcArg, `$foo = 4`);
            assert.equal($funcArg.type(), null);
        });
        it("set", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo   $foo = 4`);
            $funcArg.type("Bar");
            assert.equal(`Bar   $foo = 4`, $funcArg.text());
        });
        it("set from empty", () => {
            const $funcArg = parser.parse(g.funcArg, `$foo = 4`);
            $funcArg.type("Bar");
            assert.equal(`Bar $foo = 4`, $funcArg.text());
        });
        it("remove", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo   $foo = 4`);
            $funcArg.type(null);
            assert.equal(`$foo = 4`, $funcArg.text());
        });
    });

    describe('value', function () {
        it("get", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo $foo = 4`);
            assert.equal($funcArg.value(), "4");
        });
        it("get null", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo $foo`);
            assert.equal($funcArg.value(), null);
        });
        it("set", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo   $foo = 4`);
            $funcArg.value("BAR");
            assert.equal(`Foo   $foo = BAR`, $funcArg.text());
        });
        it("set from empty", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo $foo`);
            $funcArg.value("BAR");
            assert.equal(`Foo $foo = BAR`, $funcArg.text());
        });
        it("remove", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo   $foo = 4`);
            $funcArg.value(null);
            assert.equal(`Foo   $foo`, $funcArg.text());
        });
    });
    describe('byReference', function () {
        it("get false", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo $foo = 4`);
            assert.equal($funcArg.byReference(), false);
        });
        it("get true", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo &$foo = 4`);
            assert.equal($funcArg.byReference(), true);
        });
        it("set", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo   $foo = 4`);
            $funcArg.byReference(true);
            assert.equal(`Foo   &$foo = 4`, $funcArg.text());
        });
        it("remove", () => {
            const $funcArg = parser.parse(g.funcArg, `Foo   &$foo = 4`);
            $funcArg.byReference(false);
            assert.equal(`Foo   $foo = 4`, $funcArg.text());
        });
    });
});

describe('funcArgs', function () {
    it("get all", function () {
        const $funcArgs = parser.parse(g.funcArgs, `$foo, $bar`);
        const $argsList = $funcArgs.getArgs();
        assert.equal($argsList.length, 2);
        assert.equal($argsList[0].name(), "foo");
    });
    it("find by name", function () {
        const $funcArgs = parser.parse(g.funcArgs, `$foo, $bar`);
        const $argsList = $funcArgs.findArgByName("bar");
        assert.equal($argsList.length, 1);
        assert.equal($argsList[0].name(), "bar");
    });
    it("insert at starting", function () {
        const $funcArgs = parser.parse(g.funcArgs, `$foo,  $bar`);
        const $funcArg = parser.parse(g.funcArg, `$a`);
        $funcArgs.insertArg($funcArg);
        assert.equal($funcArgs.text(), `$a, $foo,  $bar`);
    });
    it("insert at end", function () {
        const $funcArgs = parser.parse(g.funcArgs, `$foo,  $bar`);
        const $funcArg = parser.parse(g.funcArg, `Test $test = 42`);
        $funcArgs.insertArg($funcArg);
        assert.equal($funcArgs.text(), `$foo,  $bar, Test $test = 42`);
    });
    it("insert", function () {
        const $funcArgs = parser.parse(g.funcArgs, ``);
        const $funcArg = parser.parse(g.funcArg, `Test $test = 42`);
        $funcArgs.insertArg($funcArg);
        assert.equal($funcArgs.text(), `Test $test = 42`);
    });
    it("insert after", function () {
        const $funcArgs = parser.parse(g.funcArgs, `$foo,  $bar`);
        const $funcArg = parser.parse(g.funcArg, `Test $test = 42`);
        $funcArgs.insertArg($funcArg, $funcArgs.findArgByName("foo")[0]);
        assert.equal($funcArgs.text(), `$foo, Test $test = 42,  $bar`);
    });
    it("remove one", function () {
        const $funcArgs = parser.parse(g.funcArgs, `$foo,  $bar`);
        $funcArgs.removeArg($funcArgs.findArgByName("foo")[0]);
        assert.equal($funcArgs.text(), `$bar`);
    });
    it("remove", function () {
        const $funcArgs = parser.parse(g.funcArgs, `$foo`);
        $funcArgs.removeArg($funcArgs.findArgByName("foo")[0]);
        assert.equal($funcArgs.text(), ``);
    });
});

describe('funcBody', function () {
    describe('body', function () {
        it("get", function () {
            const $funcBody = parser.parse(g.funcBody, ` {\nFoo;\n}`);
            assert.equal($funcBody.body(), `Foo;`);
        });
        it("get null", function () {
            const $funcBody = parser.parse(g.funcBody, ` ;`);
            assert.equal($funcBody.body(), null);
        });
        it("set", function () {
            const $funcBody = parser.parse(g.funcBody, ` {\nFoo;\n}`);
            $funcBody.body("$a=2;");
            assert.equal($funcBody.text(), `\n{\n    $a=2;\n}`);
        });
        it("set from empty", function () {
            const $funcBody = parser.parse(g.funcBody, `   \n;`);
            $funcBody.body("$a=2;");
            assert.equal($funcBody.text(), `\n{\n    $a=2;\n}`);
        });
        it("remove", function () {
            const $funcBody = parser.parse(g.funcBody, ` {\nFoo;\n}`);
            $funcBody.body(null);
            assert.equal($funcBody.text(), `;`);
        });
    });
});

describe('func', function () {
    describe('name', function () {
        it("get", () => {
            const $func = parser.parse(g.func, `function test();`);
            assert.equal($func.name(), "test");
        });
        it("set", () => {
            const $func = parser.parse(g.func, `function test();`);
            $func.name("bar");
            assert.equal($func.text(), `function bar();`);
        });
    });

    describe('body', function () {
        it("get", () => {
            const $func = parser.parse(g.func, `function test() { test }`);
            assert.equal($func.body(), "test");
        });
        it("set", () => {
            const $func = parser.parse(g.func, `function test();`);
            $func.body("bar();");
            assert.equal($func.text(), `function test()\n{\n    bar();\n}`);
        });
    });

    describe('funcArgs', function () {
        it("get empty", function () {
            const $func = parser.parse(g.func, `function test();`);
            assert.equal($func.getArgs().length, 0);
        });
        it("find by name", function () {
            const $func = parser.parse(g.func, `function test(Bar $bar);`);
            const $argsList = $func.findArgByName("bar");
            assert.equal($argsList.length, 1);
            assert.equal($argsList[0].name(), "bar");
        });
        it("insert at starting", function () {
            const $func = parser.parse(g.func, `function test(Bar $bar);`);
            const $funcArg = parser.parse(g.funcArg, `$a`);
            $func.insertArg($funcArg);
            assert.equal($func.text(), `function test($a, Bar $bar);`);
        });
        it("insert at end", function () {
            const $func = parser.parse(g.func, `function test($foo,  $bar);`);
            const $funcArg = parser.parse(g.funcArg, `Test $test = 42`);
            $func.insertArg($funcArg);
            assert.equal($func.text(), `function test($foo,  $bar, Test $test = 42);`);
        });
        it("insert", function () {
            const $func = parser.parse(g.func, `function test();`);
            const $funcArg = parser.parse(g.funcArg, `Test $test = 42`);
            $func.insertArg($funcArg);
            assert.equal($func.text(), `function test(Test $test = 42);`);
        });
        it("insert after", function () {
            const $func = parser.parse(g.func, `function test($foo,  $bar);`);
            const $funcArg = parser.parse(g.funcArg, `Test $test = 42`);
            $func.insertArg($funcArg, $func.findArgByName("foo")[0]);
            assert.equal($func.text(), `function test($foo, Test $test = 42,  $bar);`);
        });
        it("remove one", function () {
            const $func = parser.parse(g.func, `function test($foo,  $bar);`);
            $func.removeArg($func.findArgByName("foo")[0]);
            assert.equal($func.text(), `function test($bar);`);
        });
        it("remove", function () {
            const $func = parser.parse(g.func, `function test($foo);`);
            $func.removeArg($func.findArgByName("foo")[0]);
            assert.equal($func.text(), `function test();`);
        });
    });
});

describe('methodMarkers', function () {
    describe('visibility', function () {
        it("get", function () {
            const $methodMarkers = parser.parse(g.methodMarkers, `abstract public static `);
            assert.equal($methodMarkers.visibility(), `public`);
        });
        it("get null", function () {
            const $methodMarkers = parser.parse(g.methodMarkers, `abstract static `);
            assert.equal($methodMarkers.visibility(), null);
        });
        it("set", () => {
            const $methodMarkers = parser.parse(g.methodMarkers, `abstract public static `);
            $methodMarkers.visibility("private");
            assert.equal(`abstract private static `, $methodMarkers.text());
        });
        it("set 2", () => {
            const $methodMarkers = parser.parse(g.methodMarkers, `abstract static `);
            $methodMarkers.visibility("private");
            assert.equal(`abstract static private `, $methodMarkers.text());
        });
        it("set 3", () => {
            const $methodMarkers = parser.parse(g.methodMarkers, ``);
            $methodMarkers.visibility("private");
            assert.equal($methodMarkers.text(), `private `);
        });
    });

    describe('abstract', function () {
        it("get", function () {
            const $methodMarkers = parser.parse(g.methodMarkers, `abstract public static `);
            assert.equal($methodMarkers.abstract(), true);
        });
        it("set", function () {
            const $methodMarkers = parser.parse(g.methodMarkers, `public static `);
            $methodMarkers.abstract(true);
            assert.equal($methodMarkers.text(), `abstract public static `);
        });
    });
    describe('final', function () {
        it("get", function () {
            const $methodMarkers = parser.parse(g.methodMarkers, `final public static `);
            assert.equal($methodMarkers.final(), true);
        });
        it("set", function () {
            const $methodMarkers = parser.parse(g.methodMarkers, `public static `);
            $methodMarkers.final(true);
            assert.equal($methodMarkers.text(), `final public static `);
        });
    });
    describe('static', function () {
        it("get", function () {
            const $methodMarkers = parser.parse(g.methodMarkers, `static public final `);
            assert.equal($methodMarkers.static(), true);
        });
        it("set", function () {
            const $methodMarkers = parser.parse(g.methodMarkers, `public final `);
            $methodMarkers.static(true);
            assert.equal($methodMarkers.text(), `public final static `);
        });
    });
});

describe.skip('method', function () {
    describe('name', function () {
        it("get", () => {
            const $method = parser.parse(g.method, `public function foo();`);
            assert.equal($method.name(), "foo");
        });
        it("set", () => {
            const $method = parser.parse(g.method, `public function foo();`);
            $method.name("bar");
            assert.equal(`public function bar();`, $method.text());
        });
    });

    describe('visibility', function () {
        it("get", () => {
            const $method = parser.parse(g.method, `public function foo();`);
            assert.equal($method.visibility(), "public");
        });
        it("get null", () => {
            const $method = parser.parse(g.method, `function foo();`);
            assert.equal($method.visibility(), null);
        });
        it("set", () => {
            const $method = parser.parse(g.method, `public function foo();`);
            $method.visibility("private");
            assert.equal(`private function foo();`, $method.text());
        });
        it("set null", () => {
            const $method = parser.parse(g.method, `public function foo() {$foo = 2;}`);
            $method.visibility(null);
            assert.equal(`function foo() {$foo = 2;}`, $method.text());
        });
    });

    describe('body', function () {
        it("get null", () => {
            const $method = parser.parse(g.method, `public function foo();`);
            assert.equal($method.body(), null);
        });
        it("get", () => {
            const $method = parser.parse(g.method, `public function foo() { /* TODO */ }`);
            assert.equal($method.body(), "/* TODO */");
        });
        it("set null", () => {
            const $method = parser.parse(g.method, `public function foo() {$foo = 2;}`);
            $method.body(null);
            assert.equal(`public function foo();`, $method.text());
        });
        it("set", () => {
            const $method = parser.parse(g.method, `public function foo();`);
            $method.body("/* Test */");
            assert.equal(`public function foo()
{
    /* Test */
}`, $method.text());
        });
    });

    describe('desc', function () {
        it("get null", () => {
            const $method = parser.parse(g.method, `public function foo();`);
            assert.equal($method.desc(), null);
        });
        it("get", () => {
            const $method = parser.parse(g.method, `/** Foo */public function foo();`);
            assert.equal($method.desc(), "Foo");
        });
        it("get 2", () => {
            const $method = parser.parse(g.method, `/**
 * Foo
*/
public function foo();`);
            assert.equal($method.desc(), "Foo");
        });
        it("set null", () => {
            const $method = parser.parse(g.method, `/**
 * TODO
 */
public function foo();`);
            $method.desc(null);
            assert.equal(`public function foo();`, $method.text());
        });
        it("set", () => {
            const $method = parser.parse(g.method, `public function foo();`);
            $method.desc("TODO");
            assert.equal(`/**
 * TODO
 */
public function foo();`, $method.text());
        });
    });

    describe('type', function () {
        it("get null", () => {
            const $method = parser.parse(g.method, `public function foo();`);
            assert.equal($method.type(), null);
        });
        it("get", () => {
            const $method = parser.parse(g.method, `/**
 * @return Todo
 */
public function foo();`);
            assert.equal($method.type(), "Todo");
        });
        it("get2", () => {
            const $method = parser.parse(g.method, `/**
 * @return Todo[]
 */
public function foo();`);
            assert.equal($method.type(), "Todo[]");
        });
        it("set", () => {
            const $method = parser.parse(g.method, `public function foo();`);
            $method.type("TODO");
            assert.equal(`/**
 * @return TODO
 */
public function foo();`, $method.text());
        });
        it("set null", () => {
            const $method = parser.parse(g.method, `/**
 * @return TODO
 */
public function foo();`);
            $method.type(null);
            assert.equal(`public function foo();`, $method.text());
        });
        it("set null 2", () => {
            const $method = parser.parse(g.method, `/**
 * FooBar
 *
 * @return TODO
 */
public function foo();`);
            $method.type(null);
            assert.equal(`/**
 * FooBar
 */
public function foo();`, $method.text());
        });
    });

    // describe('Sample', function () {
    //     it("get", () => {
    //         const $method = parser.parse(g.method, `public function foo();`);
    //         assert.equal($method.body(), "TODO");
    //     });
    //     it("set", () => {
    //         const $method = parser.parse(g.method, `public function foo();`);
    //         $method.body("TODO");
    //         assert.equal(`public function foo();`, $method.text());
    //     });
    // });

});
