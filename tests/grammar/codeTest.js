const _ = require("lodash");
const assert = require('assert');
const {grammar: g, parser: parser} = require(__dirname + "/../../index.js");

// describe('funcCall', function () {
//     it("parse", () => {
//         const $ = parser.parse(g.funcCall, `test( @foo(   12), 3)`);
//         console.log(require("util").inspect($.xml(), {colors: true, hidden: true, depth: 30})); // TODO
//     });
// });

describe('todo', function () {
    it("parse", () => {
        const $ = parser.parse(g.codeTestBed, `µ[\\Class::CONST, 2 ,"foo", [2]2µ`);
        console.log(require("util").inspect($.xml(), {colors: true, hidden: true, depth: 30})); // TODO
    });
});
