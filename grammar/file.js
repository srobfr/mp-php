const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    g.namespace = ["namespace", g.w, g.fqn, g.ow, g.semicolon];
    g.namespace.default = "namespace TODO;";

    g.require = [/^(?:require|include)(?:_once)?/, g.ow, (/^[^;]+/), g.semicolon];

    g.fileDoc = optional([g.doc, g.w]);

    g.fileItemsSeparator = [g.wOrComments];
    g.fileItemsSeparator.default = "\n";
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

    g.fileItems = optmul(or(
        g.require,
        g.namespace,
        g.use
    ), g.fileItemsSeparator);
    g.fileItems.order = [g.namespace, g.use, g.require, ($node) => $node.text()];

    g.file = [
        g.phpBlockStart, g.owDefaultNextLine,
        g.fileDoc,
        g.fileItems, g.ow,
        g.class, g.ow,
        g.phpBlockEnd,
        optional([g.ow, g.eof])
    ];
    g.file.decorator = function ($node) {
        $node.getClass = () => $node.findOne(g.class);
        $node.namespace = (namespace) => {
            const $namespaceIdent = $node.findOne(g.namespace).findOne(g.fqn);
            if (namespace === undefined) return $namespaceIdent.text();
            $namespaceIdent.text(namespace);
            return $node;
        };
        $node.getUse = (alias) => $node.findOne(g.fileItems).findOne(($node) => {
            if ($node.grammar !== g.use) return false;
            return _.last($node.find(g.ident)).text() === alias;
        });
        $node.setUse = (use) => {
            if (_.isString(use)) use = {name: use};
            const className = use.name.match(/[a-z_]+$/i)[0];
            let alias = use.alias || className;
            const $use = $node.getUse(alias);

            if (use.delete) {
                if ($use) $use.findParent(g.fileItems).remove($use);
            } else {
                if ($use) return;
                const aliasStr = (alias === className ? "" : ` as ${alias}`);
                $node.findOne(g.fileItems).add(`use ${use.name.replace(/^\\+/, "")}${aliasStr};`);
            }
        };

        $node.set = function (data) {
            if (data.namespace !== undefined) $node.namespace(data.namespace);
            if (data.use !== undefined) {
                _.each(data.use, use => $node.setUse(use));
            }

            const $class = $node.getClass();
            $class.set(data);
        };
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
