const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;
const {descHelper} = require(__dirname + "/../helpers.js");

module.exports = function (g) {
    g.classUse = [
        g.optDoc,
        "use", g.w,
        g.fqn,
        optional([g.w, "as", g.w, g.ident]),
        g.ow, g.semicolon
    ];
    g.classUse.default = "use TODO;";

    g.classBodyItemsSeparator = optmul(or(g.w, g.commentLine, g.commentBlock));
    g.classBodyItemsSeparator.default = ($parent) => {
        const indent = $parent.getIndent();
        return `\n\n${indent}`;
    };
    g.classBodyItemsSeparator.decorator = function($classBodyItemsSeparator) {
        $classBodyItemsSeparator.fix = function() {
            $classBodyItemsSeparator.text(g.classBodyItemsSeparator.default($classBodyItemsSeparator.parent));
        };
    };

    g.classBodyItems = optmul(
        or(g.method, g.property, g.constant, g.classUse),
        g.classBodyItemsSeparator
    );
    g.classBodyItems.order = [
        g.classUse,
        g.constant,
        g.property,
        g.method,
        g.public, g.protected, g.private,
        ($node) => {
            const $subNode = ($node.findOne(g.variable) || $node.findOne(g.func) || $node.findOne(g.constantIdent));
            return ($subNode || $node).findOne(g.ident).text();
        }
    ];

    g.classBodyStart = optmul(or(g.w, g.commentLine, g.commentBlock));
    g.classBodyStart.default = ($parent) => `\n${$parent.getIndent()}`;
    g.classBodyEnd = optmul(or(g.w, g.commentLine, g.commentBlock));
    g.classBodyEnd.default = "\n";

    g.classBody = ["{", g.classBodyStart, g.classBodyItems, g.classBodyEnd, "}"];
    g.classBody.indent = g.INDENT;

    g.className = [g.ident];

    g.kind = or("class", "interface", "trait");

    g.classMarkers = optmul([or(g.abstract, g.final), g.w]);
    g.classMarkers.order = [g.abstract, g.final];

    g.implementsValues = multiple(g.fqn, [g.ow, ",", g.owDefaultOneSpace]);
    g.implements = [g.w, "implements", g.w, g.implementsValues];
    g.extends = [g.w, "extends", g.w, g.fqn];

    g.implementsExtends = optmul(or(g.implements, g.extends));
    g.implementsExtends.order = [g.extends, g.implements];

    g.class = [
        g.optDoc,
        g.classMarkers,
        g.kind, g.w, g.className,
        g.implementsExtends,
        g.ow, g.classBody
    ];
    g.class.default = ($parent) => {
        const indent = $parent.getIndent();
        return `/**\n${indent} * TODO\n${indent} */\n${indent}class TODO {\n${indent}\n${indent}}`;
    };
    g.class.decorator = function(node) {
        node.namespace = function (namespace) {
            const $namespaceIdent = node.findParent(g.file).findOne(g.namespace).findOne(g.fqn);
            if (namespace === undefined) return $namespaceIdent.text();
            $namespaceIdent.text(namespace);
            return node;
        };

        node.name = function (name) {
            const $className = node.findOne(g.className);
            if (name === undefined) return $className.text();
            $className.text(name);
            return node;
        };

        node.setProperty = function (data) {
            let $classBodyItems = node.findOne(g.classBodyItems);
            let $property = $classBodyItems.findOne((n) => (n.grammar === g.property && n.findOne(g.variable).findOne(g.ident).text() === data.name));

            if (data.delete) {
                if ($property) {
                    $classBodyItems.remove($property);
                }
            } else {
                if (!$property) $property = node.parser.parse(g.property).name(data.name);
                if (data.value !== undefined) {
                    const $optDefaultValue = $property.findOne(g.optDefaultValue);
                    if (data.value === null) $optDefaultValue.text("");
                    else $optDefaultValue.getOrCreateChild().findOne(g.staticExpr).text(data.value);
                }

                if (!$classBodyItems.children.length) {
                    // TODO Déplacer ça dans le bon élément
                    $classBodyItems.prev.text(`\n${$classBodyItems.getIndent()}`);
                    $classBodyItems.next.text(`\n`);
                }

                $classBodyItems.add($property);
            }

            return node;
        };

        node.getMethod = function (name) {
            return node
                .findOne(g.classBody)
                .findOne((n) => (n.grammar === g.method && n.findOne(g.func).findOne(g.ident).text() === name));
        };

        node.getProperty = function (name) {
            let $classBodyItems = node.findOne(g.classBodyItems);
            return $classBodyItems.findOne((n) => (n.grammar === g.property && n.findOne(g.variable).findOne(g.ident).text() === name));
        };

        node.desc = (desc) => descHelper(node, desc);
    };
};
