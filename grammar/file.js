const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    g.namespace = ["namespace", g.w, g.fqn, g.ow, g.semicolon];
    g.namespace.default = "namespace TODO;";

    g.require = [/^(?:require|include)(?:_once)?/, g.ow, (/^[^;]+/), g.semicolon];

    g.fileDoc = optional([g.doc, g.w]);

    g.fileItemsSeparator = [g.wOrComments];
    g.fileItemsSeparator.decorator = function (node) {
        node.fix = function () {
            node.text(node.prev.children[0].grammar === node.next.children[0].grammar
                ? "\n"
                : "\n\n"
            );
        };
    };

    g.use = [
        "use", g.w,
        g.fqn,
        optional([g.w, "as", g.w, g.ident]),
        g.ow, g.semicolon
    ];
    g.use.default = "use TODO;";

    g.file = [
        g.phpBlockStart, g.owDefaultNextLine,
        g.fileDoc,
        optional([multiple(or(
            g.require,
            g.namespace,
            g.use
        ), g.fileItemsSeparator), g.ow]),
        g.class, g.ow,
        g.phpBlockEnd,
        optional([g.ow, g.eof])
    ];
    g.file.decorator = function ($node) {
        $node.getClass = () => $node.findOne(g.class);
    };
    g.file.default = `<?php

namespace TODO;

/**
 * TODO
 */
class TODO
{

}
`;
};
