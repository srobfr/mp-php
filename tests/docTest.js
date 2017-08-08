const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../index.js").grammar;

const parser = new Parser();

describe('docIndent', function () {
    it("pass", function () {
        parser.parse(g.docIndent, `    `);
        parser.parse(g.docIndent, ``);
    });
    it("fail", function () {
        assert.throws(() => parser.parse(g.docIndent, `*`));
    });
});

describe('docLineContent', function () {
    it("pass", function () {
        parser.parse(g.docLineContent, `Foo bar plop`);
    });
    it("fail", function () {
        assert.throws(() => parser.parse(g.docLineContent, ``));
        assert.throws(() => parser.parse(g.docLineContent, `Foo\nBar`));
        assert.throws(() => parser.parse(g.docLineContent, `Foo\n * Bar`));
    });
});

describe('docContentUntilNextAnnotationOrEnd', function () {
    it("pass", function () {
        parser.parse(g.docContentUntilNextAnnotationOrEnd, `Foo bar plop`);
        parser.parse(g.docContentUntilNextAnnotationOrEnd, `Foo bar plop\n * Test\n*Hop`);
    });
    it("fail", function () {
        assert.throws(() => parser.parse(g.docContentUntilNextAnnotationOrEnd, ``));
        assert.throws(() => parser.parse(g.docContentUntilNextAnnotationOrEnd, `Foo\nBar`));
        assert.throws(() => parser.parse(g.docContentUntilNextAnnotationOrEnd, `Foo\n * @Bar`));
    });
    it("get textWithoutLineStarts", function () {
        const $ = parser.parse(g.docContentUntilNextAnnotationOrEnd, `TODO\n* test\n*\n * plop`);
        assert.equal($.textWithoutLineStarts(), `TODO\ntest\n\nplop`);
    });
    it("set textWithoutLineStarts", function () {
        const $ = parser.parse(g.docContentUntilNextAnnotationOrEnd, `TODO`);
        $.textWithoutLineStarts("Foo\nBar\n\nPlop");
        assert.equal($.text(), ` Foo\n * Bar\n *\n * Plop`);
    });
});

describe('doc', function () {
    describe('indent', function () {
        it("get empty", function () {
            const $doc = parser.parse(g.doc, `/**
 *
 */`);
            assert.equal($doc.indent(), "");
        });

        it("get", function () {
            const $doc = parser.parse(g.doc, `/**
   *
   */`);
            assert.equal($doc.indent(), "  ");
        });

        it("set", function () {
            const $doc = parser.parse(g.doc, `/**
   *
   */`);
            $doc.indent("    ");
            assert.equal($doc.text(), `/**
     *
     */`);
        });
    });

    describe('desc', function () {
        it("get empty", function () {
            const $doc = parser.parse(g.doc, `/**
 *
 */`);
            assert.equal($doc.desc(), null);
        });

        it("get", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 */`);
            assert.equal($doc.desc(), "Foo");
        });

        it("set from empty", function () {
            const $doc = parser.parse(g.doc, `/**
 *
 */`);
            $doc.desc("Foo");
            assert.equal($doc.text(), `/**
 * Foo
 */`);
        });

        it("set", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 */`);
            $doc.desc("Bar");
            assert.equal($doc.text(), `/**
 * Bar
 */`);
        });

        it("remove from empty", function () {
            const $doc = parser.parse(g.doc, `/**
 *
 */`);
            $doc.desc(null);
            assert.equal($doc.text(), `/**
 *
 */`);
        });

        it("remove", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 */`);
            $doc.desc(null);
            assert.equal($doc.text(), `/**
 *
 */`);
        });
    });

    describe('longDesc', function () {
        it("get empty", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 */`);
            assert.equal($doc.longDesc(), null);
        });
        it("get", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 * Bar
 */`);
            assert.equal($doc.longDesc(), "Bar");
        });
        it("get multiline", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 *
 * Bar
 * Plop
 *
 * Test
 */`);
            assert.equal($doc.longDesc(), "Bar\nPlop\n\nTest");
        });
        it("set from empty", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 */`);
            $doc.longDesc("Test");
            assert.equal($doc.text(), `/**
 * Foo
 *
 * Test
 */`);
        });
        it("set", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 *
 * Bar
 */`);
            $doc.longDesc("Test");
            assert.equal($doc.text(), `/**
 * Foo
 *
 * Test
 */`);
        });
        it("set multiline", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 * PLOP
 */`);
            $doc.longDesc("Bar\n\nTest\n    Foo");
            assert.equal($doc.text(), `/**
 * Foo
 * Bar
 *
 * Test
 *     Foo
 */`);
        });
        it("remove", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 * Bar
 */`);
            $doc.longDesc(null);
            assert.equal($doc.text(), `/**
 * Foo
 */`);
        });
    });
});

