const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;
const {descHelper, longDescHelper} = require(__dirname + "/../helpers.js");

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
    g.classBodyItemsSeparator.decorator = function ($classBodyItemsSeparator) {
        $classBodyItemsSeparator.fix = function () {
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
    g.classBody.decorator = function ($node) {
        $node.fix = function () {
            const emptyBody = $node.findOne(g.classBodyItems).text().trim() === "";
            $node.findOne(g.classBodyStart).text(emptyBody ? "\n" : `\n${g.INDENT}`);
            $node.findOne(g.classBodyEnd).text("\n");
        };
    };

    g.className = [g.ident];

    g.kind = or("class", "interface", "trait");

    g.classMarkers = optmul([or(g.abstract, g.final), g.w]);
    g.classMarkers.order = [g.abstract, g.final];

    g.implementsValues = multiple(g.fqn, [g.ow, ",", g.owDefaultOneSpace]);
    g.implementsValues.order = [
        ($node => $node.text())
    ];

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
    g.class.decorator = function ($node) {
        $node.name = function (name) {
            const $className = $node.findOne(g.className);
            if (name === undefined) return $className.text();
            $className.text(name);
            return $node;
        };

        $node.getProperty = function (name) {
            let $classBodyItems = $node.findOne(g.classBodyItems);
            return $classBodyItems.findOne((n) => (n.grammar === g.property && n.findOne(g.variable).findOne(g.ident).text() === name));
        };

        $node.setProperty = function (data) {
            let $classBodyItems = $node.findOne(g.classBodyItems);
            let $property = $classBodyItems.findOne((n) => (n.grammar === g.property && n.findOne(g.variable).findOne(g.ident).text() === data.name));

            if (data.delete) {
                if ($property) {
                    $classBodyItems.remove($property);
                    $classBodyItems.parent.fix();
                }
            } else {
                if (!$property) {
                    $property = $node.parser.parse(g.property).name(data.name);
                    if (data.visibility !== undefined) $property.visibility(data.visibility);
                    $classBodyItems.add($property);
                    $classBodyItems.parent.fix();
                }

                if (data.value !== undefined) {
                    const $optDefaultValue = $property.findOne(g.optDefaultValue);
                    if (data.value === null) $optDefaultValue.text("");
                    else $optDefaultValue.getOrCreateChild().findOne(g.staticExpr).text(data.value);
                }

                if (data.desc !== undefined) $property.desc(data.desc);
                if (data.longDesc !== undefined) $property.longDesc(data.longDesc);
                if (data.type !== undefined) $property.type(data.type);
            }

            return $node;
        };

        $node.getMethod = function (name) {
            return $node
                .findOne(g.classBody)
                .findOne((n) => (n.grammar === g.method && n.findOne(g.func).findOne(g.ident).text() === name));
        };

        $node.setMethod = function (data) {
            let $classBodyItems = $node.findOne(g.classBodyItems);
            let $method = $classBodyItems.findOne((n) => (n.grammar === g.method && n.findOne(g.funcName).text() === data.name));

            if (data.delete) {
                if ($method) {
                    $classBodyItems.remove($method);
                    $classBodyItems.parent.fix();
                }
            } else {
                if (!$method) {
                    $method = $node.parser.parse(g.method).name(data.name);
                    if (data.visibility !== undefined) $method.visibility(data.visibility);
                    $classBodyItems.add($method);
                    $classBodyItems.parent.fix();
                }

                $method.set(data);
            }

            return $method;
        };

        $node.extends = function (_extends) {
            const $implementsExtends = $node.findOne(g.implementsExtends);
            let $extends = $implementsExtends.findOne(g.extends);
            if (_extends === undefined) return $extends ? $extends.findOne(g.fqn).text() : null;

            if (!_extends) {
                if ($extends) $implementsExtends.remove($extends);
            } else {
                if (!$extends) $extends = $implementsExtends.add(` extends ${_extends}`);
                else $extends.findOne(g.fqn).text(_extends);
            }
            return $extends;
        };

        $node.implements = function (_implements) {
            _implements = _.map(_implements, impl => _.isString(impl) ? {name: impl} : impl);

            const $implementsExtends = $node.findOne(g.implementsExtends);
            let $implements = $implementsExtends.findOne(g.implements);
            if (_implements === undefined) {
                if (!$implements) return [];
                return _.map($implements.find(g.fqn), $fqn => $fqn.text());
            }

            if (_implements.length === 0) return;
            if (_implements === null) {
                if ($implements) $implementsExtends.remove($implements);
            } else {
                if (!$implements) $implements = $implementsExtends.add(` implements ${_implements[0].name}`);

                const $implementsValues = $implements.findOne(g.implementsValues);
                _.each(_implements, _implementsVal => {
                    const $fqn = $implementsValues.findOne($node => {
                        return $node.grammar === g.fqn && $node.text() === _implementsVal.name;
                    });

                    if (_implementsVal.delete === true) {
                        if ($fqn) $implementsValues.remove($fqn);
                    } else {
                        if (!$fqn) $implementsValues.add(_implementsVal.name);
                    }
                });
            }
            return $implements;
        };

        $node.desc = (desc) => descHelper(g, $node, desc);
        $node.longDesc = (longDesc) => longDescHelper(g, $node, longDesc);

        $node.set = function (data) {
            if (data.name !== undefined) $node.name(data.name);
            if (data.desc !== undefined) $node.desc(data.desc);
            if (data.longDesc !== undefined) $node.longDesc(data.longDesc);
            if (data.implements !== undefined) $node.implements(data.implements);
            if (data.extends !== undefined) $node.extends(data.extends);
            if (data.properties !== undefined) _.each(data.properties, property => $node.setProperty(property));
            if (data.methods !== undefined) _.each(data.methods, method => $node.setMethod(method));
        };
    };
};
