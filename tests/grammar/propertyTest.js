const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../../index.js").grammar;

const parser = new Parser();

describe('property', function () {
    it("pass", function() {
        parser.parse(g.property, `$foo;`);
        parser.parse(g.property, `/**
            * Foo
            */
            public static $foo;`);
    });
    it("fail", function () {
        assert.throws(() => parser.parse(g.property, ``));
        assert.throws(() => parser.parse(g.property, `$foo`));
    });

    describe('name', function () {
        it("get", function () {
            const $property = parser.parse(g.property, `public $foo;`);
            assert.equal($property.name(), `foo`);
        });
        it("set", function () {
            const $property = parser.parse(g.property, `public $foo;`);
            $property.name("bar");
            assert.equal($property.text(), `public $bar;`);
        });
    });

    describe('value', function () {
        it("get", function () {
            const $property = parser.parse(g.property, `public $foo = 42;`);
            assert.equal($property.value(), `42`);
        });
        it("get null", function () {
            const $property = parser.parse(g.property, `public $foo;`);
            assert.equal($property.value(), null);
        });
        it("set from empty", function () {
            const $property = parser.parse(g.property, `public $foo;`);
            $property.value(`'plop'`);
            assert.equal($property.text(), `public $foo = 'plop';`);
        });
        it("set", function () {
            const $property = parser.parse(g.property, `public $foo = 42;`);
            $property.value(`'plop'`);
            assert.equal($property.text(), `public $foo = 'plop';`);
        });
        it("remove", function () {
            const $property = parser.parse(g.property, `public $foo = 42;`);
            $property.value(null);
            assert.equal($property.text(), `public $foo;`);
        });
    });

    describe('visibility', function () {
        it("get", () => {
            const $property = parser.parse(g.property, `public $foo = 42;`);
            assert.equal($property.visibility(), "public");
        });
        it("get null", () => {
            const $property = parser.parse(g.property, `$foo = 42;`);
            assert.equal($property.visibility(), null);
        });
        it("set from null", () => {
            const $property = parser.parse(g.property, `$foo = 42;`);
            $property.visibility("private");
            assert.equal(`private $foo = 42;`, $property.text());
        });
        it("set", () => {
            const $property = parser.parse(g.property, `public $foo = 42;`);
            $property.visibility("private");
            assert.equal(`private $foo = 42;`, $property.text());
        });
        it("remove", () => {
            const $property = parser.parse(g.property, `public $foo = 42;`);
            $property.visibility(null);
            assert.equal($property.text(), `$foo = 42;`);
        });
    });

    describe('abstract', function () {
        it("get true", () => {
            const $property = parser.parse(g.property, `abstract public $foo = 42;`);
            assert.equal($property.abstract(), true);
        });
        it("get false", () => {
            const $property = parser.parse(g.property, `public $foo = 42;`);
            assert.equal($property.abstract(), false);
        });
        it("set", () => {
            const $property = parser.parse(g.property, `public $foo = 42;`);
            $property.abstract(true);
            assert.equal($property.text(), `abstract public $foo = 42;`);
        });
        it("set null", () => {
            const $property = parser.parse(g.property, `public abstract $foo = 42;`);
            $property.abstract(false);
            assert.equal($property.text(), `public $foo = 42;`);
        });
    });

    describe('static', function () {
        it("get true", () => {
            const $property = parser.parse(g.property, `static public $foo = 42;`);
            assert.equal($property.static(), true);
        });
        it("get false", () => {
            const $property = parser.parse(g.property, `public $foo = 42;`);
            assert.equal($property.static(), false);
        });
        it("set", () => {
            const $property = parser.parse(g.property, `public $foo = 42;`);
            $property.static(true);
            assert.equal($property.text(), `static public $foo = 42;`);
        });
        it("set null", () => {
            const $property = parser.parse(g.property, `public static $foo = 42;`);
            $property.static(false);
            assert.equal($property.text(), `public $foo = 42;`);
        });
    });

    describe('desc', function () {
        it("get", () => {
            const $property = parser.parse(g.property, `/** Test */
            static public $foo = 42;`);
            assert.equal($property.desc(), "Test");
        });
        it("set", () => {
            const $property = parser.parse(g.property, `public $foo = 42;`);
            $property.desc("Test");
            assert.equal($property.text(), `/**
 * Test
 */
public $foo = 42;`);
        });
    });
});
