const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;
const {descHelper} = require(__dirname + "/../helpers.js");

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
                const indentedBody = body.split("\n").map(l => `${g.INDENT}${l}`).join("\n");
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
    g.method.default = ($parent) => {
        const indent = g.INDENT;
        return `/**\n${indent} * TODO\n${indent} */\n${indent}public function todo()\n${indent}{\n${indent}${indent}// TODO\n${indent}}`;
    };
    g.method.decorator = function ($node) {
        $node.visibility = (visibility => {
            const $visibility = $node.findOne(g.visibility);
            if (visibility === null) {
                $visibility.parent.parent.parent.remove($visibility.parent.parent);
                return $node;
            }
            return $visibility ? $visibility.text(visibility) : null;
        });
        $node.body = (body => $node.findOne(g.funcBody).body(body));
        $node.name = (name => $node.findOne(g.func).name(name));
        $node.desc = (desc) => descHelper(g, $node, desc);
        $node.type = function (type) {
            const $optDoc = $node.findOne(g.optDoc);
            let $doc = $optDoc.findOne(g.doc);

            if (type === undefined) {

                if (!$doc) return null;
                const $docAnnotations = $doc.findOne(g.docAnnotations);
                const $annotation = $docAnnotations.findOne(($node) => ($node.grammar === g.docAnnotationContainer && $node.findOne(g.docAnnotationIdent).text() === "@return"));
                if (!$annotation) return null;
                return $annotation.findOne(g.docAnnotationValue).text().trim() || null;
            }

            if (type === null) {
                if (!$doc) return null;
                const $docAnnotations = $doc.findOne(g.docAnnotations);
                const $annotation = $docAnnotations.findOne(($node) => ($node.grammar === g.docAnnotationContainer && $node.findOne(g.docAnnotationIdent).text() === "@return"));
                if (!$annotation) return null;
                $doc.removeAnnotation($annotation);
                return $node;
            }

            $doc = $doc || $optDoc.getOrCreateChild().findOne(g.doc);
            const $docAnnotations = $doc.findOne(g.docAnnotations);
            const $annotation = $docAnnotations.findOne(($node) => ($node.grammar === g.docAnnotationContainer && $node.findOne(g.docAnnotationIdent).text() === "@return"));
            if ($annotation) $doc.removeAnnotation($annotation);
            $docAnnotations.add("@return " + type);
        };
        $node.setArg = function (arg) {
            let $funcArgs = $node.findOne(g.funcArgs);
            let $arg = $funcArgs.findOne(($node) => {
                return $node.grammar === g.funcArg && $node.findOne(g.variable).findOne(g.ident).text() === arg.name;
            });

            if (!$arg) $arg = $funcArgs.add(`${arg.type} $${arg.name}`);

            const $doc = $node.findOne(g.doc);
            const $docAnnotations = $doc.findOne(g.docAnnotations);
            $doc.removeParamAnnotation(arg.name);
            $docAnnotations.add(`@param ${arg.type} $${arg.name} ${arg.desc}`);
            $node.fixMethodParamsAnnotation();
        };

        function phpTypeToPhpDocType(type) {
            let r = type;
            let m;
            if (_.isString(type) && (m = type.match(/^\?(.+)$/))) r = `${m[1]}|null`;
            return r;
        }

        $node.fixMethodParamsAnnotation = function () {
            const $method = $node;
            const $doc = $method.findOne(g.optDoc).getOrCreateChild().findOne(g.doc);
            if (!$doc.desc() || $doc.desc().trim() === "TODO") {
                const methodName = $method.name();
                if (methodName === "__construct") $doc.desc(`Constructor.`);
                else $doc.desc(`The ${methodName} method.`);
            }

            const $docAnnotations = $doc.findOne(g.docAnnotations);

            // Annotations @param
            // Recensement des @param existantes
            const paramsAnnotationByArgName = {};
            _.each(
                $docAnnotations.find(($node) => $node.grammar === g.docAnnotationIdent && $node.text() === "@param"),
                $docAnnotationIdent => {
                    const $docAnnotation = $docAnnotationIdent.parent;
                    let value = $docAnnotation.findOne(g.docAnnotationValue).text();

                    let m = value.match(/^ *([a-z_\\\[\]\|<>]+)? *(\$[a-z_][\w_]*) *([^]*)/i);
                    if (!m) return;
                    paramsAnnotationByArgName[m[2]] = {
                        name: m[2],
                        type: m[1],
                        desc: m[3],
                    };

                    $docAnnotations.remove($docAnnotation);
                }
            );

            // Recensement des arguments de la méthode
            const argsOrder = [];
            _.each($method.find(g.funcArg), $funcArg => {
                const argName = $funcArg.findOne(g.variable).text();
                if (!paramsAnnotationByArgName[argName]) {
                    // Il manque un @param
                    let argType = null;
                    if (argName.match(/Id$/)) argType = "int";
                    paramsAnnotationByArgName[argName] = {
                        name: argName,
                        type: argType,
                        desc: "",
                        $funcArg: $funcArg
                    };
                } else {
                    paramsAnnotationByArgName[argName].$funcArg = $funcArg;
                }

                const arg = paramsAnnotationByArgName[argName];
                const $funcArgType = arg.$funcArg.findOne(g.funcArgType);
                if (!arg.type && $funcArgType) arg.type = phpTypeToPhpDocType($funcArgType.text());
                argsOrder.push(arg);
            });

            const grid = [];
            _.each(argsOrder, (param) => {
                if (!param.$funcArg) return;
                const type = param.type || (argv.todo ? "TODO" : "");
                grid.push(["@param", type, param.name, param.desc]);
            });

            const maxLengths = [];
            _.each(grid, (arg) => {
                _.each(arg, (cell, i) => {
                    maxLengths[i] = Math.max(maxLengths[i] || 0, (cell || []).length);
                });
            });

            let $nextNode = undefined;
            _.eachRight(grid, (arg) => {
                const annotationCode = _.map(arg, (cell, i) => {
                    if (i === arg.length - 1) return cell;
                    return _.padEnd(cell, maxLengths[i], " ") + (maxLengths[i] > 0 ? " " : "");
                }).join("");
                $nextNode = $docAnnotations.add(annotationCode, $nextNode);
            });
        };

        $node.set = function (data) {
            if (data.desc !== undefined) $node.desc(data.desc);
            if (data.type !== undefined) $node.type(data.type);
            if (data.args !== undefined) _.each(data.args, arg => $node.setArg(arg));
            if (data.body !== undefined) $node.body(data.body);

            // $node.fixMethodParamsAnnotation();
            $node.findOne(g.doc).fix();
        };
    };
};
