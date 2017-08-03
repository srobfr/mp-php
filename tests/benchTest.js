const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../index.js").grammar;

const parser = new Parser();

describe('bench', function () {
    describe('indentation', function () {
        it("get oneline", function () {
            const $doc = parser.parse(g.doc, `/** */`);
            console.log($doc.xml());

            const $docIndents = $doc.findByGrammar(g.docIndent);
            assert.equal($docIndents.length, 0);
        });

        it("get empty", function () {
            const $doc = parser.parse(g.doc, `/**
 *
 */`);
            console.log($doc.xml());
            const $docIndents = $doc.findByGrammar(g.docIndent);
            assert.equal($docIndents.length, 2);
            _.each($docIndents, $docIndent => {
                assert.equal($docIndent.text(), "");
            });
        });

        it("get", function () {
            const $doc = parser.parse(g.doc, `/**
   *
   */`);
            const $docIndents = $doc.findByGrammar(g.docIndent);
            assert.equal($docIndents.length, 2);
            _.each($docIndents, $docIndent => {
                assert.equal($docIndent.text(), "  ");
            });
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
            console.log($doc.xml());
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
});

