const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;
const {descHelper, longDescHelper} = require(__dirname + "/../helpers.js");

module.exports = function (g) {
    g.classUseAliasBlock = optional([g.w, "as", g.w, g.ident]);
    g.classUse = [
        g.optDoc,
        "use", g.w,
        g.fqn,
        g.classUseAliasBlock,
        g.ow, g.semicolon
    ];
    g.classUse.default = "use TODO;";
    g.classUse.buildNode = function (self) {
        self.fqn = function(fqn) {
            const $fqn = self.children[3];
            const r = $fqn.text(fqn);
            return (fqn === undefined ? r : self);
        };
        self.alias = function(alias) {
            let $optAliasBlock = self.children[4];
            if (alias === undefined) return $optAliasBlock ? $optAliasBlock.findOneByGrammar(g.ident).text() : null;
            if (alias === null) {
                $optAliasBlock.empty();
            } else {
                if ($optAliasBlock.children.length === 0) {
                    $optAliasBlock.text(` as ${alias}`);
                } else {
                    $optAliasBlock.findOneByGrammar(g.ident).text(alias);
                }
            }

            return self;
        };
    };

    g.classBodyItemsSeparator = [g.wOrComments];
    g.classBodyItemsSeparator.default = `\n\n${g.IDENT}`;

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
        ($node => $node.text())
    ];
    g.classBodyItems.buildNode = function (self) {
        self.getUses = () => self.findByGrammar(g.classUse);
    };

    g.classBodyStart = [g.owOrComments];
    g.classBodyStart.default = `\n\n${g.IDENT}`;
    g.classBodyEnd = [g.owOrComments];
    g.classBodyEnd.default = "\n";

    g.classBody = ["{", g.classBodyStart, g.classBodyItems, g.classBodyEnd, "}"];
    g.classBody.indent = g.INDENT;

    g.className = [g.ident];
    g.className.buildNode = function (self) {
        self.name = function (name) {
            const r = self.text(name);
            return (name === undefined ? r : self);
        };
    };

    g.kind = or("class", "interface", "trait");
    g.kind.buildNode = function (self) {
        self.kind = function (name) {
            const r = self.text(name);
            return (name === undefined ? r : self);
        };
    };

    g.classMarkerBlock = [
        or(g.abstract, g.final),
        g.w
    ];
    g.classMarkers = optmul(g.classMarkerBlock);
    g.classMarkers.buildNode = function (self) {
        function buildMarkerHandler(marker) {
            return function (value) {
                let $marker = self.findOneByGrammar(g[marker]);
                if (value === undefined) return !!$marker;
                if (!value) {
                    if ($marker) $marker.parent.parent.remove();
                } else if (!$marker) {
                    const $classMarkerBlock = self.parser.parse(g.classMarkerBlock, `${marker} `);
                    self.insert($classMarkerBlock);
                }

                return self;
            };
        }

        self.abstract = buildMarkerHandler("abstract");
        self.final = buildMarkerHandler("final");
    };

    g.implementsValuesSeparator = [g.ow, ",", g.ow];
    g.implementsValuesSeparator.default = ", ";

    g.implementsValue = [g.fqn];
    g.implementsValue.tag = "implementsValue";
    g.implementsValue.buildNode = function (self) {
        self.name = self.text;
    };

    g.implementsValues = multiple(g.implementsValue, g.implementsValuesSeparator);
    g.implementsValues.order = [
        ($node => $node.text())
    ];
    g.implementsValues.buildNode = function (self) {
        self.getImplementsValues = () => self.findDirectByGrammar(g.implementsValue);
        self.findOneImplementsValueByName = (name => _.find(self.getImplementsValues(), ($node => $node.name() === name)));
        self.removeImplementsValue = ($implementsValue => $implementsValue.removeWithSeparator());
    };

    g.implements = [g.w, "implements", g.w, g.implementsValues];
    g.extends = [g.w, "extends", g.w, g.fqn];

    g.implementsExtendsBlock = or(g.implements, g.extends);
    g.implementsExtends = optmul(g.implementsExtendsBlock);
    g.implementsExtends.order = [g.extends, g.implements];
    g.implementsExtends.buildNode = function (self) {
        self.extends = function (_extends) {
            let $extends = self.findOneByGrammar(g.extends);
            if (_extends === undefined) return $extends ? $extends.children[3].text() : null;
            if (_extends === null) {
                if ($extends) $extends.removeWithSeparator();
            } else {
                if (!$extends) {
                    const $implementsExtendsBlock = self.parser.parse(g.implementsExtendsBlock, ` extends ${_extends}`);
                    self.insert($implementsExtendsBlock);
                } else {
                    $extends.children[3].text(_extends);
                }
            }

            return self;
        };

        self.getImplementsValues = function () {
            const $implementsValues = self.findOneByGrammar(g.implementsValues);
            return $implementsValues ? $implementsValues.getImplementsValues() : [];
        };

        self.findOneImplementsValueByName = function (name) {
            const $implementsValues = self.findOneByGrammar(g.implementsValues);
            return $implementsValues ? $implementsValues.findOneImplementsValueByName(name) : null;
        };

        self.insertImplementsValue = function ($implementsValue) {
            const $implementsValues = self.findOneByGrammar(g.implementsValues);
            if (!$implementsValues) {
                const $implementsExtendsBlock = self.parser.parse(g.implementsExtendsBlock, ` implements TODO`);
                $implementsExtendsBlock.findOneByGrammar(g.implementsValue).replaceWith($implementsValue);
                self.insert($implementsExtendsBlock);
            } else if (!self.findOneImplementsValueByName($implementsValue.name())) {
                $implementsValues.insert($implementsValue);
            }

            return self;
        };

        self.removeImplementsValue = function ($implementsValue) {
            const $implementsValues = self.findOneByGrammar(g.implementsValues);
            if ($implementsValues) {
                $implementsValues.removeImplementsValue($implementsValue);
                if ($implementsValues.children.length === 0) self.findOneByGrammar(g.implements).parent.removeWithSeparator();
            }
            return self;
        };
    };

    g.class = [
        g.optDoc,
        g.classMarkers,
        g.kind, g.w, g.className,
        g.implementsExtends,
        g.ow, g.classBody
    ];
    g.class.default = `class TODO\n{\n}`;
    g.class.buildNode = function (self) {
        function proxy(methodName, target) {
            self[methodName] = function () {
                const r = target()[methodName].apply(this, arguments);
                return (arguments[0] === undefined ? r : self);
            };
        }

        function proxyGet(methodName, target) {
            self[methodName] = function () {
                return target()[methodName].apply(this, arguments);
            };
        }

        function proxySet(methodName, target) {
            self[methodName] = function () {
                target()[methodName].apply(this, arguments);
                return self;
            };
        }

        proxy("abstract", () => self.children[1]);
        proxy("final", () => self.children[1]);
        proxy("kind", () => self.children[2]);
        proxy("name", () => self.children[4]);
        proxy("extends", () => self.children[5]);

        proxyGet("getImplementsValues", () => self.children[5]);
        proxyGet("findOneImplementsValueByName", () => self.children[5]);
        proxySet("insertImplementsValue", () => self.children[5]);
        proxySet("removeImplementsValue", () => self.children[5]);

        proxyGet("getUses", () => self.children[7].children[2]);
    };

};
