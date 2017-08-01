const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../index.js").grammar;

const parser = new Parser();

describe('optDoc', function () {
    describe('desc', function () {
        it("get empty", function () {
            const $optDoc = parser.parse(g.optDoc, `/**
 *
 */
 `);
            assert.equal($optDoc.desc(), "");
        });
        it("get existing", function () {
            const $optDoc = parser.parse(g.optDoc, `/**
 * Foo ?
 */
 `);
            assert.equal($optDoc.desc(), "Foo ?");
        });
        it("set on empty", function () {
            const $optDoc = parser.parse(g.optDoc, ``);
            $optDoc.desc("FOO");
            assert.equal(`/**
 * FOO
 */
`, $optDoc.text());
        });
        it("set", function () {
            const $optDoc = parser.parse(g.optDoc, `/** Foo Bar */`);
            $optDoc.desc("FOO");
            assert.equal(`/**
 * FOO
 */`, $optDoc.text());
        });
    });
    describe('longDesc', function () {
        it("get empty", function () {
            const $optDoc = parser.parse(g.optDoc, `/**
 *
 */
 `);
            assert.equal($optDoc.longDesc(), null);
        });
        it("get existing", function () {
            const $optDoc = parser.parse(g.optDoc, `/**
 * Foo ?
 * Plop
 */
 `);
            assert.equal($optDoc.longDesc(), "Plop");
        });
        it("set on empty", function () {
            const $optDoc = parser.parse(g.optDoc, ``);
            $optDoc.longDesc("FOO");
            assert.equal(`/**
 * TODO
 *
 * FOO
 */
`, $optDoc.text());
        });
        it("set", function () {
            const $optDoc = parser.parse(g.optDoc, `/** Foo Bar */`);
            $optDoc.longDesc("FOO");
            assert.equal(`/**
 * Foo Bar
 *
 * FOO
 */`, $optDoc.text());
        });
    });

    describe('annotations', function () {
        // TODO
    });
});

describe('doc', function () {
    describe('grammar', function () {
        const namesByGrammar = new Map();
        _.each(g, (v, k) => {
            namesByGrammar.set(v, k);
        });

        const dataset = [
            {
                grammar: g.doc,
                success: [
                    `/** */`,
                    `/**\n *\n */`,
                    `/**\n * Foo bar\n */`,
                    `/**\n* Foo bar\n */`,
                    `/** Foo bar */`,
                    `/** @var Foo */`,
                    `/** @return Foo */`,
                    `/** @param Foo $foo */`,
                    `/** @other Foo bar test. */`,
                    `/**
         * Test
         * @return test
         */`,
                    `/**  
                      * Test with trailing spaces  
                      */`,
                    `/**
         * Test
         * @other Foo
         * bar test.
         */`,
                    `/**
                      * Test
                      *
                      * Long description,
                      * on multiple lines.
                      *
                      * @return test
                      * @param $plop
                      *
                      * @param $test
                      */`,

                    `/** @var string */`,
                ],
                fail: [`/**/`, `/**\n\n*/`, `/* test */`]
            },
            {
                grammar: g.docDesc,
                success: ["Foo"],
                fail: ["Foo\nBar", "Foo\n * Bar"]
            },
            {
                grammar: g.docLongDesc,
                success: ["Foo", "Foo\n * Bar"],
                fail: ["Foo\nBar"]
            },
            {
                grammar: g.phpDocVarAnnotation,
                success: [
                    "@var string",
                    "@var array",
                    "@var Foo[]",
                ],
                fail: ["Foo\nBar"]
            },
        ];

        _.each(dataset, (set) => {
            const grammarName = namesByGrammar.get(set.grammar);
            if (!grammarName) console.log(require("util").inspect(set.success[0], {
                colors: true,
                hidden: true,
                depth: 30
            }));
            describe(grammarName, function () {
                _.each(set.success, (code) => {
                    it("Should parse " + require("util").inspect(code.substr(0, 30), {depth: 30}), function () {
                        const $ = parser.parse(set.grammar, code);
                        console.log($.xml());
                    });
                });

                _.each(set.fail, (code) => {
                    it("Should fail parsing " + require("util").inspect(code.substr(0, 30), {depth: 30}), function () {
                        assert.throws(function () {
                                const $ = parser.parse(set.grammar, code);
                                console.log($.xml());
                            },
                            (e) => {
                                console.log(e.message + "\n\n");
                                return true;
                            });
                    });
                });
            });
        });
    });

    describe('desc', function () {
        it("get empty", function () {
            const $doc = parser.parse(g.doc, `/** */`);
            assert.equal($doc.desc(), "");
        });
        it("get oneline", function () {
            const $doc = parser.parse(g.doc, `/** Foo */`);
            assert.equal($doc.desc(), "Foo");
        });
        it("get", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 */`);
            assert.equal($doc.desc(), "Foo");
        });
        it("set on empty", function () {
            const $doc = parser.parse(g.doc, `/** */`);
            $doc.desc("FOO");
            assert.equal($doc.text(), `/**
 * FOO
 */`);
        });
        it("set", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 */`);
            $doc.desc("Bar");
            assert.equal(`/**
 * Bar
 */`, $doc.text());
        });
    });

    describe('longDesc', function () {
        it("get empty", function () {
            const $doc = parser.parse(g.doc, `/** */`);
            assert.equal($doc.longDesc(), null);
        });
        it("get oneline", function () {
            const $doc = parser.parse(g.doc, `/** Foo */`);
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
 * Bar
 * Plop
 * Test
 */`);
        });
        it("get multiline Wrong Indent", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 * Bar
 *Plop
 *   Test
 */`);
            assert.equal($doc.longDesc(), "Bar\nPlop\n  Test");
        });
        it("set on empty", function () {
            const $doc = parser.parse(g.doc, `/** Foo */`);
            $doc.longDesc("FOO");
            assert.equal($doc.text(), `/**
 * Foo
 *
 * FOO
 */`);
        });
        it("set", function () {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 * PLOP
 */`);
            $doc.longDesc("Bar");
            assert.equal($doc.text(), `/**
 * Foo
 *
 * Bar
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
 *
 * Bar
 *
 * Test
 *     Foo
 */`);
        });
    });

    describe('annotations', function () {
        // TODO
    });
});

describe('annotation', function () {
    describe('name', function () {
        it("get", function () {
            const $annotation = parser.parse(g.docAnnotationContainer, `@foo Plop`);
            assert.equal($annotation.name(), "foo");
        });

        it("set", function () {
            const $annotation = parser.parse(g.docAnnotationContainer, `@foo Plop`);
            $annotation.name("bar");
            assert.equal($annotation.text(), `@bar Plop`);
        });
    });

    describe('type', function () {
        it("get", function () {
            const $annotation = parser.parse(g.docAnnotationContainer, `@var Test`);
            assert.equal($annotation.type(), "Test");
        });

        it("set", function () {
            const $annotation = parser.parse(g.docAnnotationContainer, `@var Test`);
            $annotation.type("Foo[]");
            assert.equal($annotation.text(), `@var Foo[]`);
        });
    });

    describe('variable', function () {
        it("get", function () {
            const $annotation = parser.parse(g.docAnnotationContainer, `@param Test $foo`);
            assert.equal($annotation.variable(), "foo");
        });

        it("set", function () {
            const $annotation = parser.parse(g.docAnnotationContainer, `@param Test $foo`);
            $annotation.variable("bar");
            assert.equal($annotation.text(), `@param Test $bar`);
        });
    });

    describe('value', function () {
        it("get", function () {
            const $annotation = parser.parse(g.docAnnotationContainer, `@author Simon Robert <srob@srob.fr>`);
            assert.equal($annotation.value(), "Simon Robert <srob@srob.fr>");
        });

        it("set", function () {
            const $annotation = parser.parse(g.docAnnotationContainer, `@author Foo`);
            $annotation.value("Simon Robert <srob@srob.fr>");
            assert.equal($annotation.text(), `@author Simon Robert <srob@srob.fr>`);
        });
    });
});

