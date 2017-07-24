const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;
const {descHelper} = require(__dirname + "/../helpers.js");

module.exports = function (g) {
    g.funcArgType = [optional("?"), g.fqn];
    g.funcArg = [
        optional([g.funcArgType, g.w]),
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

    g.funcName = [g.ident];

    g.func = ["function", g.w, g.funcName, g.ow, "(", g.ow, g.funcArgs, g.ow, ")", g.funcReturnType, g.funcBody];
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
                const $annotation = $docAnnotations.findOne(($node) => ($node.grammar === g.docAnnotation && $node.findOne(g.docAnnotationIdent).text() === "@return"));
                if (!$annotation) return null;
                return $annotation.findOne(g.docAnnotationValue).text().trim() || null;
            }

            if (type === null) {
                if (!$doc) return null;
                const $docAnnotations = $doc.findOne(g.docAnnotations);
                const $annotation = $docAnnotations.findOne(($node) => ($node.grammar === g.docAnnotation && $node.findOne(g.docAnnotationIdent).text() === "@return"));
                if (!$annotation) return null;
                $doc.removeAnnotation($annotation);
                return $node;
            }

            $doc = $doc || $optDoc.getOrCreateChild().findOne(g.doc);
            const $docAnnotations = $doc.findOne(g.docAnnotations);
            const $annotation = $docAnnotations.findOne(($node) => ($node.grammar === g.docAnnotation && $node.findOne(g.docAnnotationIdent).text() === "@return"));
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

        $node.set = function(data) {
            if (data.desc !== undefined) $node.desc(data.desc);
            if (data.type !== undefined) $node.type(data.type);
            if (data.args !== undefined) _.each(data.args, arg => $node.setArg(arg));
            if (data.body !== undefined) $node.body(data.body);

            // $node.fixMethodParamsAnnotation();
            $node.findOne(g.doc).fix();
        };
    };
};
