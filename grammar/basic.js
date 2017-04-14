const {or} = require("microparser").grammarHelpers;

module.exports = function(g) {
    g.w = /^[ \t\r\n]+/;
    g.commentLine = /^\/\/.*?(?:\n|\r|\r\n)/;
    g.eof = /^$/;
    g.phpBlockStart = "<?php";
    g.semicolon = /^;+/;
    g.quotedString = /^'(\\'|[^']+)*'/;
    g.doubleQuotedString = /^"(\\"|[^"]+)*"/;
    g.string = or(g.quotedString, g.doubleQuotedString);
    g.numeric = /^(-?)(\d*\.\d+|\d+[eE]\d+|0x[\da-f]+|\d+)/i;
    g.ident = /^[a-z_][\w_]*/i;
};
