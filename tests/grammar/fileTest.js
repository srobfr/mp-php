const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../../index.js").grammar;

const parser = new Parser();

describe('use', function () {
    describe('fqn', function () {
        it("get", function () {
            const $use = parser.parse(g.use, `use Test;`);
            assert.equal($use.fqn(), "Test");
        });
        it("set", function () {
            const $use = parser.parse(g.use, `use Test;`);
            $use.fqn("Foo");
            assert.equal($use.text(), `use Foo;`);
        });
    });
    describe('alias', function () {
        it("get", function () {
            const $use = parser.parse(g.use, `use Test as Plop;`);
            assert.equal($use.alias(), "Plop");
        });
        it("get null", function () {
            const $use = parser.parse(g.use, `use Test;`);
            assert.equal($use.alias(), null);
        });
        it("set from empty", function () {
            const $use = parser.parse(g.use, `use Test;`);
            $use.alias("Foo");
            assert.equal($use.text(), `use Test as Foo;`);
        });
        it("set", function () {
            const $use = parser.parse(g.use, `use Test as Plop;`);
            $use.alias("Foo");
            assert.equal($use.text(), `use Test as Foo;`);
        });
        it("remove", function () {
            const $use = parser.parse(g.use, `use Test as Plop;`);
            $use.alias(null);
            assert.equal($use.text(), `use Test;`);
        });
    });
});

describe('file', function () {
    it("pass", function () {
        parser.parse(g.file, `<?php `);
        parser.parse(g.file, `<?php /** Test */ ?>`);
        parser.parse(g.file, `<?php use Test; ?>`);
        parser.parse(g.file, `<?php class Test {}`);
        const $f = parser.parse(g.file, `<?php /** Test */ require __DIR__."/Foo.php"; /** Test */ class Test {}`);
        console.log($f.xml());
    });
    it("fail", function () {
        assert.throws(() => parser.parse(g.file, ``));
    });

    describe('namespace', function () {
        it("get empty", function () {
            const $file = parser.parse(g.file, `<?php`);
            assert.equal($file.namespace(), null);
        });
        it("get", function () {
            const $file = parser.parse(g.file, `<?php namespace Foo;`);
            assert.equal($file.namespace(), "Foo");
        });
        it("set", function () {
            const $file = parser.parse(g.file, `<?php`);
            $file.namespace("Foo");
            assert.equal($file.text(), `<?php\n\nnamespace Foo;\n`);
        });
        it("remove", function () {
            const $file = parser.parse(g.file, `<?php namespace Test;`);
            $file.namespace(null);
            assert.equal($file.text(), `<?php\n`);
        });
    });

    describe('use', function () {
        it("get all", function () {
            const $file = parser.parse(g.file, `<?php use Foo; use Bar as Plop;`);
            const $uses = $file.getUses();
            assert.equal($uses.length, 2);
            assert.equal($uses[0].fqn(), "Foo");
            assert.equal($uses[1].alias(), "Plop");
        });

        it("insert from empty", () => {
            const $file = parser.parse(g.file, `<?php`);
            const $use = parser.parse(g.use, `use Test;`);
            $file.insertUse($use);
            assert.equal($file.text(), `<?php\n\nuse Test;\n`);
            const $use2 = parser.parse(g.use, `use Plop;`);
            $file.insertUse($use2);
            assert.equal($file.text(), `<?php\n\nuse Plop;\nuse Test;\n`);
            const $use3 = parser.parse(g.use, `use Zzz;`);
            $file.insertUse($use3);
            assert.equal($file.text(), `<?php\n\nuse Plop;\nuse Test;\nuse Zzz;\n`);
        });

        it("remove first", () => {
            const $file = parser.parse(g.file, `<?php use Test; use Plop;`);
            const $use = $file.getUses()[0];
            $file.removeUse($use);
            assert.equal($file.text(), `<?php\n\nuse Plop;`);
        });

        it("remove last", () => {
            const $file = parser.parse(g.file, `<?php use Test; use Plop;`);
            const $use = $file.getUses()[1];
            $file.removeUse($use);
            assert.equal($file.text(), `<?php use Test;\n`);
        });

        it("remove all", () => {
            const $file = parser.parse(g.file, `<?php use Test;`);
            const $use = $file.getUses()[0];
            $file.removeUse($use);
            assert.equal($file.text(), `<?php\n`);
        });
    });

    describe('class', function () {
        it("get null", function () {
            const $file = parser.parse(g.file, `<?php`);
            const $class = $file.class();
            assert.equal($class, null);
        });
        it("get", function () {
            const $file = parser.parse(g.file, `<?php namespace Foo; /** Plop */interface Foo{}`);
            const $class = $file.class();
            assert.equal($class.kind(), "interface");
        });
        it("set", function () {
            const $file = parser.parse(g.file, `<?php namespace Foo;`);
            const $class = parser.parse(g.class, `/** Foo */class Test { use Test; use Plop; }`);
            $file.class($class);
            assert.equal($file.text(), `<?php namespace Foo;\n\n/** Foo */class Test { use Test; use Plop; }\n`);
            assert.equal($file.class().desc(), `Foo`);
        });
        it("remove", function () {
            const $file = parser.parse(g.file, `<?php namespace Foo; class Test { use Test; use Plop; }`);
            $file.class(null);
            assert.equal($file.text(), `<?php namespace Foo; `);
        });
    });
});

