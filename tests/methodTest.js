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
            assert.equal($funcArgType.text(), "Bar");
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
