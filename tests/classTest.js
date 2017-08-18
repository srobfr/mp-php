const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../index.js").grammar;

const parser = new Parser();

describe('class', function () {
    it("pass", function() {
        parser.parse(g.class, `class Test {}`);
    });
    it("fail", function () {
        assert.throws(() => parser.parse(g.class, `class Test {};`));
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
            const $class = parser.parse(g.class, `class Test { use Foo as Bar; use Plop; }`);
            const $uses = $class.getUses();
            assert.equal($uses.length, 2);
            assert.equal($uses[0].fqn(), "Foo");
            assert.equal($uses[0].alias(), "Bar");
        });
    });
});
