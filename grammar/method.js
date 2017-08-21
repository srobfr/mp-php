const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    g.funcArgType = [optional("?"), g.fqn];
    g.funcArgType.buildNode = function (self) {
        function phpTypeToPhpDocType(phpType) {
            const m = phpType.match(/^(\?)?(.+)$/);
            if (!m) throw new Error(`Unable to convert PHP type "${phpType} to the equivalent PHP doc type.`);
            return m[2] + (m[1] ? "|null" : "");
        }

        function phpDocTypeToPhpType(phpDocType) {
            const types = phpDocType.split("|");
            let isNullable = false;
            let isArray = false;
            let r = null;
            types.forEach(type => {
                let m;
                if (type === "null") isNullable = true;
                else if (m = type.match(/^(.+?)\[\]$/)) {
                    r = m[1];
                    isArray = true;
                } else {
                    r = type;
                }
            });

            if (isArray) r = "array";
            if (isNullable) r = "?" + r;
            return r;
        }

        self.phpDocType = function (phpDocType) {
            if (phpDocType === undefined) return phpTypeToPhpDocType(self.text());
            self.text(phpDocTypeToPhpType(phpDocType));
            return self;
        };
        self.type = function (type) {
            if (type === undefined) return self.text();
            self.text(type);
            return self;
        };
    };

    g.optFuncArgType = optional([g.funcArgType, g.w]);
    g.optFuncArgType.buildNode = function (self) {
        self.type = function (type) {
            let $funcArgType = self.children[0];
            if (type === undefined) return $funcArgType ? $funcArgType.findOneByGrammar(g.funcArgType).type() : null;
            if (type === null) {
                if ($funcArgType) self.empty();
            } else {
                if (!$funcArgType) {
                    self.text(`TODO `);
                    $funcArgType = self.children[0];
                }

                $funcArgType.findOneByGrammar(g.funcArgType).type(type);
            }

            return self;
        };
    };

    g.funcArg = [
        g.optFuncArgType,
        optional("&"),
        g.variable,
        g.optDefaultValue
    ];
    g.funcArg.buildNode = function (self) {
        self.name = function (name) {
            const $variable = self.children[2];
            if (name === undefined) return $variable.name();
            $variable.name(name);
            return self;
        };
        self.type = function (type) {
            const $optFuncArgType = self.children[0];
            if (type === undefined) return $optFuncArgType.type();
            $optFuncArgType.type(type);
            return self;
        };
        self.value = function (value) {
            const $optDefaultValue = self.children[3];
            if (value === undefined) return $optDefaultValue.value();
            $optDefaultValue.value(value);
            return self;
        };
        self.byReference = function (byReference) {
            const $byReference = self.children[1];
            if (byReference === undefined) return $byReference.children.length > 0;
            $byReference.text(byReference ? "&" : "");
            return self;
        };
    };

    g.funcArgsSeparator = [g.ow, ",", g.ow];
    g.funcArgsSeparator.default = ", ";

    g.funcArgs = optmul(g.funcArg, g.funcArgsSeparator);
    g.funcArgs.order = [
        ($node => $node.findOneByGrammar(g.defaultValue) ? 0 : 1),
        ($node => $node.text()),
    ];
    g.funcArgs.buildNode = function (self) {
        self.getArgs = () => self.findByGrammar(g.funcArg);
        self.findArgByName = (name) => self.getArgs().filter(($funcArg) => $funcArg.name() === name);
        self.insertArg = function ($funcArg, $previousNode) {
            self.insert($funcArg, $previousNode);
            return self;
        };
        self.removeArg = function ($funcArg) {
            $funcArg.removeWithSeparator();
            return self;
        };
    };

    g.funcBody = [g.ow, or(g.semicolon, g.bracesBlock)];
    g.funcBody.default = ";";
    g.funcBody.buildNode = function (self) {
        self.body = function (body) {
            const $orChild = self.children[1].children[0];
            const $bracesBlock = ($orChild.grammar === g.bracesBlock ? $orChild : null);
            if (body === undefined) return $bracesBlock ? $bracesBlock.children[1].text().trim() : null;
            if (body === null) {
                if ($bracesBlock) self.text(";");
            } else {
                const indent = self.getIndent() + g.INDENT;
                const indentedBody = body.split("\n").map(l => `${indent}${l}`).join("\n");
                self.text(`\n{\n${indentedBody}\n}`);
            }
            return self;
        };
    };

    g.funcReturnType = optional([g.ow, ":", g.ow, g.fqn]);

    g.funcName = [g.ident];

    g.func = ["function", g.w, g.funcName, g.ow, "(", g.ow, g.funcArgs, g.ow, ")", g.funcReturnType, g.funcBody];
    g.func.buildNode = function (self) {
        self.name = function (name) {
            const $funcName = self.children[2];
            const r = $funcName.text(name);
            return (name === undefined ? r : self);
        };

        self.body = function (body) {
            const $funcBody = self.children[10];
            const r = $funcBody.body(body);
            return (body === undefined ? r : self);
        };

        self.getArgs = () => self.children[6].getArgs();
        self.findArgByName = (name) => self.children[6].findArgByName(name);
        self.insertArg = ($funcArg, $previousNode) => self.children[6].insertArg($funcArg, $previousNode);
        self.removeArg = ($funcArg) => self.children[6].removeArg($funcArg);
    };

    g.methodMarkerBlock = [
        or(g.visibility, g.final, g.abstract, g.static),
        g.w
    ];
    g.methodMarkers = optmul(g.methodMarkerBlock);
    g.methodMarkers.order = [g.final, g.abstract, g.static, g.visibility];
    g.methodMarkers.buildNode = function (self) {
        self.visibility = function (visibility) {
            let $visibility = self.findOneByGrammar(g.visibility);
            if (visibility === undefined) return $visibility ? $visibility.text() : null;
            if (visibility === null) {
                if ($visibility) $visibility.parent.parent.remove();
            } else {
                if (!$visibility) {
                    const $methodMarkerBlock = self.parser.parse(g.methodMarkerBlock, `${visibility} `);
                    self.insert($methodMarkerBlock);
                } else {
                    $visibility.text(visibility);
                }
            }

            return self;
        };

        function buildMarkerHandler(marker) {
            return function (value) {
                let $marker = self.findOneByGrammar(g[marker]);
                if (value === undefined) return !!$marker;
                if (!value) {
                    if ($marker) $marker.parent.parent.remove();
                } else if (!$marker) {
                    const $methodMarkerBlock = self.parser.parse(g.methodMarkerBlock, `${marker} `);
                    self.insert($methodMarkerBlock);
                }

                return self;
            };
        }

        self.abstract = buildMarkerHandler("abstract");
        self.final = buildMarkerHandler("final");
        self.static = buildMarkerHandler("static");
    };

    g.method = [g.optDoc, g.methodMarkers, g.func];
    g.method.default = `public function todo();`;

    g.method.buildNode = function(self) {
        function proxy(methodName, target) {
            self[methodName] = function() {
                const r = target()[methodName].apply(this, arguments);
                return (arguments[0] === undefined ? r : self);
            };
        }

        proxy("desc", () => self.children[0]);
        proxy("longDesc", () => self.children[0]);

        proxy("visibility", () => self.children[1]);
        proxy("abstract", () => self.children[1]);
        proxy("static", () => self.children[1]);
        proxy("final", () => self.children[1]);

        proxy("name", () => self.children[2]);
        proxy("body", () => self.children[2]);

        proxy("getArgs", () => self.children[2]);
        proxy("findArgByName", () => self.children[2]);
        proxy("insertArg", () => self.children[2]);
        proxy("removeArg", () => self.children[2]);

        self.type = function(type) {
            const $optDoc = self.children[0];
            let $returnAnnotation = _.first($optDoc.findAnnotationsByName('return'));

            if (type === undefined) return $returnAnnotation ? $returnAnnotation.findOneByGrammar(g.docAnnotationValue).value().trim() : null;
            if (type === null) {
                if ($returnAnnotation) $optDoc.removeAnnotation($returnAnnotation);
            } else {
                if (!$returnAnnotation) {
                    $returnAnnotation = self.parser.parse(g.docAnnotation, ` @return ${type}`);
                    $optDoc.insertAnnotation($returnAnnotation);
                } else {
                    $returnAnnotation.value(type);
                }
            }

            return self;
        };
    };
};
