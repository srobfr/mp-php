const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;
const {descHelper} = require(__dirname + "/../helpers.js");

module.exports = function (g) {
    g.funcArg = [
        optional([g.fqn, g.w]),
        optional("&"),
        g.variable, optional(g.defaultValue)
    ];

    g.funcArgs = optmul(g.funcArg, [g.owOrComments, ",", g.owOrCommentsDefaultOneSpace]);
    g.funcArgs.order = [
        ($node) => $node.findOne(g.defaultValue) ? 0 : 1,
        ($node) => $node.text(),
    ];

    g._owDefaultNextLine = [g.ow];
    g._owDefaultNextLine.default = ($parent) => `\n${$parent.getIndent()}`;

    g.funcBody = [
        g.ow,
        or(g.semicolon, g.bracesBlock)
    ];
    g.funcBody.indent = g.INDENT;
    g.funcBody.default = ($parent) => {
        const indent = $parent.getIndent();
        return `\n${indent}{\n${indent}${g.funcBody.indent}// TODO\n${indent}}`;
    };
    g.funcBody.decorator = function ($funcBody) {
        $funcBody.body = function (body) {
            if (body === undefined) {
                if ($funcBody.children[1].text() === ";") return null;
                return $funcBody.text()
                    .replace(/^[\s\n\r\t]*\{[\s\n\r\t]*([^]*?)[\s\n\r\t]*\}$/, '$1')
                    .split(`\n${$funcBody.getIndent()}`).join("\n");
            }

            if (body === null) {
                $funcBody.text(";");
            } else {
                const parentIndent = ($funcBody.parent ? $funcBody.parent.getIndent() : "");
                const bodyIndent = $funcBody.getIndent();
                const indentedBody = _.map(body.split("\n"), (line) => (line.trim() === "" ? "" : bodyIndent + line)).join("\n");
                $funcBody.text(`\n${parentIndent}{\n${indentedBody}\n${parentIndent}}`);
            }

            return $funcBody;
        };
    };

    g.funcReturnType = optional([g.ow, ":", g.ow, g.fqn]);

    g.func = ["function", g.w, g.ident, g.ow, "(", g.ow, g.funcArgs, g.ow, ")", g.funcReturnType, g.funcBody];
    g.func.decorator = function ($func) {
        $func.name = function (name) {
            if (name === undefined) return $func.children[2].text();
            $func.children[2].text(name);
            return $func;
        };
    };

    g.methodMarkers = optmul([
        or(g.visibility, g.final, g.abstract, g.static),
        g.wDefaultOneSpace
    ]);
    g.methodMarkers.order = [g.final, g.abstract, g.static, g.visibility];

    g.method = [g.optDoc, g.methodMarkers, g.func];
    g.method.default = ($parent) => {
        const indent = $parent.getIndent();
        return `${indent}/**\n${indent} * TODO\n${indent} */\n${indent}public function todo()\n${indent}{\n${g.funcBody.indent}// TODO\n${indent}}`;
    };
    g.method.decorator = function ($node) {
        $node.body = (body => $node.findOne(g.funcBody).body(body));
        $node.name = (name => $node.findOne(g.func).name(name));
        $node.desc = (desc) => descHelper($node, desc);
    };
};
