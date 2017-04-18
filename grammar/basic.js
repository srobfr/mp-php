const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    g.w = /^[ \t\r\n]+/;
    g.ow = optional(g.w);

    g.commentLine = /^\/\/.*?(?:\n|\r|\r\n)/;
    g.commentBlock = /^\/\*(?!\*)[^]*?\*\//;
    g.wOrComments = multiple(or(g.w, g.commentLine, g.commentBlock));
    g.owOrComments = optional(g.wOrComments);

    g.wDefaultOneSpace = [g.w];
    g.wDefaultOneSpace.default = " ";

    g.owDefaultOneSpace = [g.ow];
    g.owDefaultOneSpace.default = " ";

    g.owOrCommentsDefaultOneSpace = [g.owOrComments];
    g.owOrCommentsDefaultOneSpace.default = " ";

    g.owDefaultNextLine = [g.ow];
    g.owDefaultNextLine.default = ($parent) => `\n${$parent.getIndent()}`;

    g.eof = /^$/;
    g.phpBlockStart = "<?php";
    g.phpBlockEnd = [g.ow, or("?>", g.eof)];
    g.phpBlockEnd.default = "\n";
    g.semicolon = /^;+/;
    g.quotedString = /^'(\\'|[^']+)*'/;
    g.doubleQuotedString = /^"(\\"|[^"]+)*"/;
    g.string = or(g.quotedString, g.doubleQuotedString);
    g.numeric = /^(-?)(\d*\.\d+|\d+[eE]\d+|0x[\da-f]+|\d+)/i;
    g.ident = /^[a-z_][\w_]*/i;

    g.optFirstBackslash = optional("\\");

    // Fully Qualified Name
    g.fqn = [g.optFirstBackslash, multiple(g.ident, "\\")];

    g.keywords = or("null", "true", "false", /^[A-Z_]+/);

    // Parentheses block
    g.parBlock = [];
    g.parBlock.push("(", optmul(or(g.parBlock, /^[^()]+/)), ")");

    // Brackets block
    g.bracketsBlock = [];
    g.bracketsBlock.push("[", optmul(or(g.bracketsBlock, /^[^\[\]]+/)), "]");

    // Braces block
    g.bracesBlock = [];
    g.bracesBlock.push("{", optmul(or(g.bracesBlock, /^[^\{\}]+/)), "}");

    // PHP Variable
    g.variable = ["$", g.ident];

    g.staticArray = or(
        ["array", g.ow, g.parBlock],
        g.bracketsBlock
    );
    g.constRef = [g.fqn, "::", g.ident];
    g.staticExpr = or(g.string, g.numeric, g.keywords, g.staticArray, g.constRef);

    g.defaultValue = [g.ow, "=", g.ow, g.staticExpr];
    g.defaultValue.default = ` = null`;
    g.optDefaultValue = optional(g.defaultValue);

    g.private = "private";
    g.protected = "protected";
    g.public = "public";

    g.visibility = or(g.private, g.protected, g.public);

    g.abstract = "abstract";
    g.static = "static";
    g.final = "final";

    g.use = [
        "use", g.w,
        g.fqn,
        optional([g.w, "as", g.w, g.ident]),
        g.ow, g.semicolon
    ];
    g.use.default = "use TODO;";
};
