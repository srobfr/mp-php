const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../../index.js").grammar;

const parser = new Parser();

describe('class', function () {
    it("pass", function () {
        parser.parse(g.class, `class Test {}`);
    });
    it("fail", function () {
        assert.throws(() => parser.parse(g.class, `class Test {};`));
    });

    describe('desc', function () {
        it("get", function () {
            const $class = parser.parse(g.class, `/** Foo */class Test {}`);
            assert.equal($class.desc(), `Foo`);
        });
        it("set", function () {
            const $class = parser.parse(g.class, `class Test {}`);
            $class.desc("Foo");
            assert.equal($class.text(), `/**\n * Foo\n */\nclass Test {}`);
        });
    });

    describe('annotations', function () {
        it("get", () => {
            const $class = parser.parse(g.class, `/**
             * @foo bar
             */
            class Foo {}`);
            const $annotations = $class.getAnnotations();
            assert.equal($annotations.length, 1);
            assert.equal($annotations[0].name(), "foo");
        });
        it("insert", () => {
            const $class = parser.parse(g.class, `class Foo {}`);
            const $annotation = $class.parser.parse(g.docAnnotation, ` @foo bar`);
            $class.insertAnnotation($annotation);
            assert.equal(`/**
 * @foo bar
 */
class Foo {}`, $class.text());
        });
    });

    describe('name', function () {
        it("get", function () {
            const $class = parser.parse(g.class, `class Test {}`);
            assert.equal($class.name(), `Test`);
        });
        it("set", function () {
            const $class = parser.parse(g.class, `class Test {}`);
            $class.name("Foo");
            assert.equal($class.text(), `class Foo {}`);
        });
    });

    describe('abstract', function () {
        it("get true", () => {
            const $class = parser.parse(g.class, `abstract class Test {}`);
            assert.equal($class.abstract(), true);
        });
        it("get false", () => {
            const $class = parser.parse(g.class, `class Test {}`);
            assert.equal($class.abstract(), false);
        });
        it("set", () => {
            const $class = parser.parse(g.class, `class Test {}`);
            $class.abstract(true);
            assert.equal($class.text(), `abstract class Test {}`);
        });
        it("set null", () => {
            const $class = parser.parse(g.class, `abstract class Test {}`);
            $class.abstract(false);
            assert.equal(`class Test {}`, $class.text());
        });
    });

    describe('final', function () {
        it("get true", () => {
            const $class = parser.parse(g.class, `final class Test {}`);
            assert.equal($class.final(), true);
        });
        it("get false", () => {
            const $class = parser.parse(g.class, `class Test {}`);
            assert.equal($class.final(), false);
        });
        it("set", () => {
            const $class = parser.parse(g.class, `class Test {}`);
            $class.final(true);
            assert.equal($class.text(), `final class Test {}`);
        });
        it("set null", () => {
            const $class = parser.parse(g.class, `final class Test {}`);
            $class.final(false);
            assert.equal(`class Test {}`, $class.text());
        });
    });

    describe('kind', function () {
        it("get", () => {
            const $class = parser.parse(g.class, `class Test {}`);
            assert.equal($class.kind(), "class");
        });
        it("set", () => {
            const $class = parser.parse(g.class, `class Test {}`);
            $class.kind("interface");
            assert.equal($class.text(), `interface Test {}`);
        });
    });

    describe('extends', function () {
        it("get", () => {
            const $class = parser.parse(g.class, `class Test extends Foo {}`);
            assert.equal($class.extends(), "Foo");
        });
        it("get null", () => {
            const $class = parser.parse(g.class, `class Test {}`);
            assert.equal($class.extends(), null);
        });
        it("set from empty", () => {
            const $class = parser.parse(g.class, `class Test {}`);
            $class.extends("Bar");
            assert.equal($class.text(), `class Test extends Bar {}`);
        });
        it("set", () => {
            const $class = parser.parse(g.class, `class Test extends Foo {}`);
            $class.extends("Bar");
            assert.equal($class.text(), `class Test extends Bar {}`);
        });
        it("remove", () => {
            const $class = parser.parse(g.class, `class Test extends Foo {}`);
            $class.extends(null);
            assert.equal($class.text(), `class Test {}`);
        });
    });

    describe('implements', function () {
        it("get all", () => {
            const $class = parser.parse(g.class, `class Test implements Foo, Bar {}`);
            const $implementsValues = $class.getImplementsValues();
            assert.equal($implementsValues.length, 2);
            assert.equal($implementsValues[0].name(), "Foo");
        });
        it("find by name", () => {
            const $class = parser.parse(g.class, `class Test implements Foo, Bar {}`);
            const $implementsValue = $class.findOneImplementsValueByName("Bar");
            assert($implementsValue);
            assert.equal($implementsValue.name(), "Bar");
        });
        it("insert from empty", () => {
            const $class = parser.parse(g.class, `class Test {}`);
            const $implementsValue = parser.parse(g.implementsValue, `Foo`);
            $class.insertImplementsValue($implementsValue);
            assert.equal($class.text(), `class Test implements Foo {}`);
        });
        it("insert", () => {
            const $class = parser.parse(g.class, `class Test implements Foo {}`);
            const $implementsValue = parser.parse(g.implementsValue, `Bar`);
            $class.insertImplementsValue($implementsValue);
            assert.equal($class.text(), `class Test implements Bar, Foo {}`);
        });
        it("remove", () => {
            const $class = parser.parse(g.class, `class Test implements Bar, Foo {}`);
            $class.removeImplementsValue($class.getImplementsValues()[0]);
            assert.equal($class.text(), `class Test implements Foo {}`);
        });
        it("remove last", () => {
            const $class = parser.parse(g.class, `class Test implements Foo {}`);
            $class.removeImplementsValue($class.getImplementsValues()[0]);
            assert.equal($class.text(), `class Test {}`);
        });
    });

    describe('use', function () {
        it("get all", () => {
            const $class = parser.parse(g.class, `class Test { use Foo; use Plop; }`);
            const $uses = $class.getUses();
            assert.equal($uses.length, 2);
            assert.equal($uses[0].fqn(), "Foo");
        });

        it("insert from empty", () => {
            const $class = parser.parse(g.class, `class Test {}`);
            const $use = parser.parse(g.classUse, `use Test;`);
            $class.insertUse($use);
            assert.equal($class.text(), `class Test {\n    use Test;\n}`);
        });

        it("insert", () => {
            const $class = parser.parse(g.class, `class Test {use Test;}`);
            const $use = parser.parse(g.classUse, `use Plop;`);
            $class.insertUse($use);
            assert.equal($class.text(), `class Test {\n    use Plop;\n\n    use Test;}`);
        });

        it("remove first", () => {
            const $class = parser.parse(g.class, `class Test { use Test; use Plop; }`);
            const $use = $class.getUses()[0];
            $class.removeUse($use);
            assert.equal($class.text(), `class Test {\n    use Plop; }`);
        });
        it("remove last", () => {
            const $class = parser.parse(g.class, `class Test { use Test; use Plop; }`);
            const $use = $class.getUses()[1];
            $class.removeUse($use);
            assert.equal($class.text(), `class Test { use Test;\n}`);
        });
        it("remove all", () => {
            const $class = parser.parse(g.class, `class Test { use Test; }`);
            const $use = $class.getUses()[0];
            $class.removeUse($use);
            assert.equal($class.text(), `class Test {\n\n}`);
        });
    });

    describe('constants', function () {
        it("get all", () => {
            const $class = parser.parse(g.class, `class Test { use Test; const FOO = 4; }`);
            const $constants = $class.getConstants();
            assert.equal($constants.length, 1);
            assert.equal($constants[0].name(), "FOO");
            assert.equal($constants[0].value(), "4");
        });
    });

    describe('properties', function () {
        it("get all", () => {
            const $class = parser.parse(g.class, `class Test { use Test; $foo; }`);
            const $properties = $class.getProperties();
            assert.equal($properties.length, 1);
            assert.equal($properties[0].name(), "foo");
        });
    });

    describe('methods', function () {
        it("get all", () => {
            const $class = parser.parse(g.class, `class Test { use Test; public function foo(); }`);
            const $methods = $class.getMethods();
            assert.equal($methods.length, 1);
            assert.equal($methods[0].name(), "foo");
        });
        it("find by name", () => {
            const $class = parser.parse(g.class, `class Test { use Test; public function foo(); public function bar(); }`);
            const $method = $class.findOneMethodByName("bar");
            assert.equal($method.name(), "bar");
        });
    });
});
