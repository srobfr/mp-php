const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../index.js").grammar;

const parser = new Parser();

describe('file', function () {
    it("pass", function() {
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

});
