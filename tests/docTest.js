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
        assert.equal($.text(), `Foo\n * Bar\n *\n * Plop`);
    });
});

describe('docAnnotationName', function () {
    describe('name', function () {
        it("get", function () {
            const $docAnnotationName = parser.parse(g.docAnnotationName, `@foo`);
            assert.equal($docAnnotationName.name(), "foo");
        });
        it("set", function () {
            const $docAnnotationName = parser.parse(g.docAnnotationName, `@foo`);
            $docAnnotationName.name("bar");
            assert.equal($docAnnotationName.text(), "@bar");
        });
    });
});

describe('docAnnotation', function () {
    it("pass", function () {
        parser.parse(g.docAnnotation, `@foo Test`);
        parser.parse(g.docAnnotation, `@foo(bar)`);
        parser.parse(g.docAnnotation, `@foo\n * Plop`);
        parser.parse(g.docAnnotation, `@foo Test\n * Plop`);
    });
    it("fail", function () {
        assert.throws(() => parser.parse(g.docAnnotation, ``));
        assert.throws(() => parser.parse(g.docAnnotation, `Foo`));
        assert.throws(() => parser.parse(g.docAnnotation, `@Foo\nplop`));
    });

    describe('name', function () {
        it("get", function () {
            const $annotation = parser.parse(g.docAnnotation, `@foo Test`);
            assert.equal($annotation.name(), "foo");
        });
        it("set", function () {
            const $annotation = parser.parse(g.docAnnotation, `@foo Test`);
            $annotation.name("plop");
            assert.equal($annotation.text(), `@plop Test`);
        });
    });

    describe('value', function () {
        it("get", function () {
            const $annotation = parser.parse(g.docAnnotation, `@foo Test\n      *   Bar`);
            assert.equal($annotation.value(), " Test\n  Bar");
        });
        it("set 1", function () {
            const $annotation = parser.parse(g.docAnnotation, `@foo Test`);
            $annotation.value("Foo\n  Plop");
            assert.equal($annotation.text(), `@foo Foo\n *   Plop`);
        });
        it("set 2", function () {
            const $annotation = parser.parse(g.docAnnotation, `@foo Test`);
            $annotation.value(" Foo\nPlop");
            assert.equal($annotation.text(), `@foo Foo\n * Plop`);
        });
        it("set 3", function () {
            const $annotation = parser.parse(g.docAnnotation, `@foo Test`);
            $annotation.value(null);
            assert.equal($annotation.text(), `@foo`);
        });
        it("set 4", function () {
            const $annotation = parser.parse(g.docAnnotation, `@foo`);
            $annotation.value(" Foo !");
            assert.equal($annotation.text(), `@foo Foo !`);
        });
    });
});

describe('docAnnotations', function () {
    it("pass", function () {
        parser.parse(g.docAnnotations, ``);
        parser.parse(g.docAnnotations, `@foo`);
        parser.parse(g.docAnnotations, `\n *\n * @foo Test`);
        parser.parse(g.docAnnotations, `\n *\n * @foo Test\n *\n * @plop`);
    });
    it("fail", function () {
        assert.throws(() => parser.parse(g.docAnnotations, `foo`));
    });

    describe('docAnnotation', function () {
        it("get all", function () {
            const $docAnnotations = parser.parse(g.docAnnotations, `\n *\n * @foo Test\n *\n * @plop`);
            const $docAnnotationList = $docAnnotations.getAnnotations();
            assert.equal($docAnnotationList.length, 2);
            assert.equal($docAnnotationList[0].name(), "foo");
        });
        it("find by name", function () {
            const $docAnnotations = parser.parse(g.docAnnotations, `\n *\n * @foo Test\n *\n * @plop`);
            const $docAnnotationList = $docAnnotations.findAnnotationsByName("foo");
            assert.equal($docAnnotationList.length, 1);
            assert.equal($docAnnotationList[0].name(), "foo");
        });

        it("insert at starting", function () {
            const $docAnnotations = parser.parse(g.docAnnotations, `
 * @foo Test
 *
 * @plop`);

            const $docAnnotation = parser.parse(g.docAnnotation, ` @author Foo Bar`);
            $docAnnotations.insertAnnotation($docAnnotation);
            assert.equal($docAnnotations.text(), `
 *
 * @author Foo Bar
 *
 * @foo Test
 *
 * @plop`);
        });

        it("insert at end", function () {
            const $docAnnotations = parser.parse(g.docAnnotations, `
 *
 * @foo Test
 *
 * @plop`);

            const $docAnnotation = parser.parse(g.docAnnotation, ` @var Plop $plop`);
            $docAnnotations.insertAnnotation($docAnnotation);
            assert.equal($docAnnotations.text(), `
 *
 * @foo Test
 *
 * @plop
 *
 * @var Plop $plop`);
        });
        it("insert same name", function () {
            const $docAnnotations = parser.parse(g.docAnnotations, `
 *
 * @foo Test
 *
 * @plop`);

            $docAnnotations.insertAnnotation(parser.parse(g.docAnnotation, ` @foo plop`));
            $docAnnotations.insertAnnotation(parser.parse(g.docAnnotation, ` @foo z!`));
            assert.equal($docAnnotations.text(), `
 *
 * @foo plop
 * @foo Test
 * @foo z!
 *
 * @plop`);
        });
    });
});

describe('docMonoline', function () {
    it("pass", function () {
        parser.parse(g.docMonoline, `/** Foo */`);
        parser.parse(g.docMonoline, `/** @foo */`);
        parser.parse(g.docMonoline, `/**@foo*/`);
        parser.parse(g.docMonoline, `/** @foo Bar test */`);
    });
    it("fail", function () {
        assert.throws(() => parser.parse(g.docMonoline, `/** @foo Bar test\n * Test\n */`));
    });
    describe('desc', function () {
        it("get empty", function () {
            const $docMonoline = parser.parse(g.docMonoline, `/** */`);
            assert.equal($docMonoline.desc(), null);
        });
        it("get annotation", function () {
            const $docMonoline = parser.parse(g.docMonoline, `/** @foo */`);
            assert.equal($docMonoline.desc(), null);
        });
        it("get", function () {
            const $docMonoline = parser.parse(g.docMonoline, `/** foo */`);
            assert.equal($docMonoline.desc(), "foo");
        });
        it("set", function () {
            const $docMonoline = parser.parse(g.docMonoline, `/** foo */`);
            $docMonoline.desc("bar");
            assert.equal($docMonoline.text(), `/** bar */`);
        });
        it("set on annotation", function () {
            const $docMonoline = parser.parse(g.docMonoline, `/** @foo */`);
            $docMonoline.desc("bar");
            assert.equal($docMonoline.text(), `/** bar */`);
        });
    });
    describe('annotations', function () {
        it("get all", function () {
            const $docMonoline = parser.parse(g.docMonoline, `/** */`);
            assert.equal($docMonoline.getAnnotations().length, 0);
        });
    });
});

describe('doc', function () {
    it("pass", function () {
        parser.parse(g.doc, `/** Foo */`);
        parser.parse(g.doc, `/** \n *@foo\n*/`);
        parser.parse(g.doc, `/**\n * \n*/`);
    });

    it("fail", function () {
        assert.throws(() => parser.parse(g.doc, ``));
    });

    describe('Convert to multiline', function () {
        it("empty", function () {
            const $doc = parser.parse(g.doc, `/** */`);
            $doc.convertToMultilineDoc();
            assert.equal($doc.text(), `/**
 *
 */`);
        });
        it("Desc", function () {
            const $doc = parser.parse(g.doc, `/** Foo */`);
            $doc.convertToMultilineDoc();
            assert.equal($doc.text(), `/**
 * Foo
 */`);
        });
        it("Annotation", function () {
            const $doc = parser.parse(g.doc, `/** @foo Test */`);
            $doc.convertToMultilineDoc();
            assert.equal($doc.text(), `/**
 * @foo Test
 */`);
        });
    });

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

        it("remove 2", function () {
            const $doc = parser.parse(g.doc, `/**\n * Foo\n * @test\n */`);
            $doc.desc(null);
            assert.equal($doc.text(), `/**\n * @test\n */`);
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

    describe('annotations', function () {
        it("get all", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 * @foo
 * @bar
 *
 * @plop
 */`);
            const $docAnnotations = $doc.getAnnotations();
            assert.equal($docAnnotations.length, 3);
            assert.equal($docAnnotations[0].name(), "foo");
        });
        it("find by name", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 * @foo
 * @bar
 *
 * @plop
 */`);
            const $docAnnotations = $doc.findAnnotationsByName("bar");
            assert.equal($docAnnotations.length, 1);
            assert.equal($docAnnotations[0].name(), "bar");
        });

        it("insert at starting", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 * @foo
 * @bar
 *
 * @plop
 */`);

            const $docAnnotation = parser.parse(g.docAnnotation, ` @author Foo Bar`);
            $doc.insertAnnotation($docAnnotation);
            assert.equal($doc.text(), `/**
 * Foo
 *
 * @author Foo Bar
 *
 * @foo
 * @bar
 *
 * @plop
 */`);
        });

        it("remove first", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 * @foo
 * @bar
 *
 * @plop
 */`);

            const $docAnnotation = $doc.findAnnotationsByName("foo");
            $doc.removeAnnotation($docAnnotation[0]);
            assert.equal($doc.text(), `/**
 * Foo
 *
 * @bar
 *
 * @plop
 */`);
        });
        it("remove", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 * @foo
 * @bar
 *
 * @plop
 */`);

            const $docAnnotation = $doc.findAnnotationsByName("bar");
            $doc.removeAnnotation($docAnnotation[0]);
            assert.equal($doc.text(), `/**
 * Foo
 * @foo
 *
 * @plop
 */`);
        });
        it("remove last", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 * @foo
 * @bar
 *
 * @plop Plop
 *       Test
 */`);

            const $docAnnotation = $doc.findAnnotationsByName("plop");
            $doc.removeAnnotation($docAnnotation[0]);
            assert.equal($doc.text(), `/**
 * Foo
 * @foo
 * @bar
 */`);
        });
    });
});

describe('optDoc', function () {
    describe('desc', function () {
        it("get empty", function () {
            const $optDoc = parser.parse(g.optDoc, ``);
            assert.equal($optDoc.desc(), null);
        });
        it("get", function () {
            const $optDoc = parser.parse(g.optDoc, `/**\n * Foo\n */`);
            assert.equal($optDoc.desc(), "Foo");
        });
        it("set from empty", function () {
            const $optDoc = parser.parse(g.optDoc, ``);
            $optDoc.desc("Foo");
            assert.equal($optDoc.text(), `/**\n * Foo\n */\n`);
        });
        it("set empty", function () {
            const $optDoc = parser.parse(g.optDoc, `/**\n * Foo\n */\n`);
            $optDoc.desc(null);
            assert.equal($optDoc.text(), `/**\n *\n */\n`);
        });
    });

    describe('longDesc', function () {
        it("get empty", function () {
            const $optDoc = parser.parse(g.optDoc, ``);
            assert.equal($optDoc.longDesc(), null);
        });
        it("get", function () {
            const $optDoc = parser.parse(g.optDoc, `/**\n * Foo\n * Test\n */`);
            assert.equal($optDoc.longDesc(), "Test");
        });
        it("set from empty", function () {
            const $optDoc = parser.parse(g.optDoc, ``);
            $optDoc.longDesc("Foo");
            assert.equal($optDoc.text(), `/**\n *\n * Foo\n */\n`);
        });
        it("set empty", function () {
            const $optDoc = parser.parse(g.optDoc, `/**\n * Foo\n * Bar\n */\n`);
            $optDoc.longDesc(null);
            assert.equal($optDoc.text(), `/**\n * Foo\n */\n`);
        });
    });

    describe('annotations', function () {
        it("get empty", function () {
            const $optDoc = parser.parse(g.optDoc, ``);
            assert.equal($optDoc.getAnnotations().length, 0);
        });
        it("get", function () {
            const $optDoc = parser.parse(g.optDoc, `/**\n * @test\n */`);
            assert.equal($optDoc.getAnnotations().length, 1);
        });

        it("set from empty", function () {
            const $optDoc = parser.parse(g.optDoc, ``);
            const $docAnnotation = parser.parse(g.docAnnotation, ` @author Foo Bar`);
            $optDoc.insertAnnotation($docAnnotation);
            assert.equal($optDoc.text(), `/**\n * @author Foo Bar\n */\n`);
        });
    });
});

