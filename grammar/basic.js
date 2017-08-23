const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    g.w = /^[ \t\r\n]+/;
    g.ow = optional(g.w);

    g.commentLine = /^\/\/.*?(?:\n|\r|\r\n)/;
    g.commentBlock = /^\/\*(?!\*)[^]*?\*\//;
    g.wOrComments = multiple(or(g.w, g.commentLine, g.commentBlock));
    g.owOrComments = optional(g.wOrComments);

    g.eof = /^$/;
    g.phpBlockStart = "<?php";
    g.semicolon = /^;+/;
    g.quotedString = /^'(\\'|[^']+)*'/;
    g.doubleQuotedString = /^"(\\"|[^"]+)*"/;
    g.string = or(g.quotedString, g.doubleQuotedString);
    g.numeric = /^(-?)(\d*\.\d+|\d+[eE]\d+|0x[\da-f]+|\d+)/i;
    g.ident = /^[a-z_][\w_]*/i;

    g.optFirstBackslash = optional("\\");

    // Fully Qualified Name
    g.fqn = [g.optFirstBackslash, multiple(g.ident, "\\")];
    g.fqn.default = "Todo";

    g.keywords = or("null", "true", "false");

    // Parentheses block
    g.parBlock = [];
    g.parBlock.push("(", optmul(or(g.parBlock, /^[^()]+/)), ")");

    // Brackets block
    g.bracketsBlock = [];
    g.bracketsBlock.push("[", optmul(or(g.bracketsBlock, /^[^\[\]]+/)), "]");

    // Braces block
    g.bracesBlock = [];
    g.bracesBlock.push("{", optmul(or(g.bracesBlock, /^[^\{\}]+/)), "}");
    g.bracesBlock.indent = g.INDENT;

    // PHP Variable
    g.variable = ["$", g.ident];
    g.variable.buildNode = function (self) {
        self.name = function (name) {
            if (name === undefined) return self.children[1].text();
            self.children[1].text(name);
            return self;
        };
    };

    g.staticArray = or(
        ["array", g.ow, g.parBlock],
        g.bracketsBlock
    );
    g.classConstRef = [g.fqn, "::", g.ident];
    g.constRef = /^[A-Z_]+/;
    g.staticExpr = or(g.string, g.numeric, g.keywords, g.constRef, g.staticArray, g.classConstRef);

    g.defaultValue = [g.ow, "=", g.ow, g.staticExpr];
    g.defaultValue.default = ` = null`;

    g.optDefaultValue = optional(g.defaultValue);
    g.optDefaultValue.buildNode = function (self) {
        self.value = function(value) {
            let $defaultValue = self.children[0];
            if (value === undefined) return $defaultValue ? $defaultValue.children[3].text() : null;
            if (value === null) {
                if ($defaultValue) self.empty();
            } else {
                if (!$defaultValue) {
                    self.text(g.defaultValue.default);
                    $defaultValue = self.children[0];
                }

                $defaultValue.children[3].text(value)
            }

            return self;
        };
    };

    g.private = "private";
    g.protected = "protected";
    g.public = "public";

    g.visibility = or(g.private, g.protected, g.public);

    g.abstract = "abstract";
    g.static = "static";
    g.final = "final";
};
