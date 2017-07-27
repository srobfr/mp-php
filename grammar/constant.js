const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;
const {descHelper} = require(__dirname + "/../helpers.js");

module.exports = function (g) {
    g.constantIdent = [g.ident];
    g.constant = [g.optDoc, "const", g.w, g.constantIdent, g.defaultValue, g.ow, g.semicolon];
    g.constant.default = "const TODO = null;";
    g.constant.buildNode = function (self) {
        self.name = (name) => {
            const $constantIdent = self.children[3];
            const r = $constantIdent.text(name);
            return (name === undefined ? r : self);
        };
        self.value = (value) => {
            const $staticExpr = self.children[4].findOneByGrammar(g.staticExpr);
            const r = $staticExpr.text(value);
            return (value === undefined ? r : self);
        };
    };
};
