const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../index.js").grammar;

const parser = new Parser();

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
                    `/**\n * Foo bar\n */`,
                    `/**\n* Foo bar\n */`,
                    `/** Foo bar */`,
                    `/** @var Foo */`,
                    `/** @return Foo */`,
                    `/** @param Foo $foo */`,
                    `/** @other Foo bar test. */`,
                ],
                fail: [`/**/`, `/**\n\n*/`, `/* test */`]
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
                    it("Should parse " + require("util").inspect(code.substr(0, 30), {depth: 30}), () => {
                        const $ = parser.parse(set.grammar, code);
                        console.log($.xml());
                    });
                });

                _.each(set.fail, (code) => {
                    it("Should fail parsing " + require("util").inspect(code.substr(0, 30), {depth: 30}), () => {
                        assert.throws(() => {
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

    describe.skip('desc', function () {
        it("get empty", () => {
            const $doc = parser.parse(g.doc, `/** */`);
            assert.equal($doc.desc(), "");
        });
        it("get oneline", () => {
            const $doc = parser.parse(g.doc, `/** Foo */`);
            assert.equal($doc.desc(), "Foo");
        });
        it("get", () => {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 */`);
            assert.equal($doc.desc(), "Foo");
        });
        it("set on empty", () => {
            const $doc = parser.parse(g.doc, `/** */`);
            $doc.desc("FOO");
            assert.equal(`/**
 * FOO
 */`, $doc.text());
        });
        it("set", () => {
            const $doc = parser.parse(g.doc, `/**
 * Foo
 */`);
            $doc.desc("Bar");
            assert.equal(`/**
 * Bar
 */`, $doc.text());
        });
    });
});

describe.skip('optDoc', function () {
    describe('desc', function () {
        it("get empty", () => {
            const $optDoc = parser.parse(g.optDoc, `/**
 *
 */`);
            assert.equal($optDoc.desc(), "");
        });
        it("get existing", () => {
            const $optDoc = parser.parse(g.optDoc, `/**
 * Foo ?
 */`);
            assert.equal($optDoc.desc(), "Foo ?");
        });
        it("set on empty", () => {
            const $optDoc = parser.parse(g.optDoc, ``);
            $optDoc.desc("FOO");
            assert.equal(`/**
 * FOO
 */`, $optDoc.text());
        });
    });
});

