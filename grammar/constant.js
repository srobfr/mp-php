const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;
const {descHelper} = require(__dirname + "/../helpers.js");

module.exports = function (g) {
    g.constantIdent = [g.ident];
    g.constant = [g.optDoc, "const", g.w, g.constantIdent, g.defaultValue, g.ow, g.semicolon];
    g.constant.default = ($parent) => {
        const indent = $parent.getIndent();
        `/**\n${indent} * TODO\n${indent} */\n${indent}const TODO = 'TODO';`
    };
    g.constant.decorator = function ($constant) {
        $constant.desc = (desc) => descHelper(g, $constant, desc);
    };
};
