const _ = require("lodash");
const levenshtein = require("fast-levenshtein");
const {
    callIfDefined,
    extendBuildNodeFunc,
    getName,
    isToDelete,
    phpDocTypeToPhpType,
    phpTypeToPhpDocType,
} = require(__dirname + "/../helpers.js");

module.exports = function (g) {
    extendBuildNodeFunc(g.funcArg, function (self) {
        self.setModel = function (model) {
            callIfDefined(model.name, self.name);
            callIfDefined(model.byReference, self.byReference);
            callIfDefined(model.value, self.value);
            callIfDefined(model.type, self.type);
        };

        self.getModel = function () {
            return {
                name: self.name(),
                byReference: self.byReference(),
                value: self.value(),
                type: self.type(),
            };
        };
    });

    extendBuildNodeFunc(g.method, function (self) {
        self.setModel = function (model) {
            callIfDefined(model.desc, self.desc);
            callIfDefined(model.longDesc, self.longDesc);
            callIfDefined(model.name, self.name);
            callIfDefined(model.visibility, self.visibility);
            callIfDefined(model.abstract, self.abstract);
            callIfDefined(model.static, self.static);
            callIfDefined(model.final, self.final);
            callIfDefined(model.body, self.body);
            callIfDefined(model.type, self.type); // PHP7

            if (self.abstract()) self.body(null);
            else if (self.body() === null) self.body(`// TODO`);

            if (model.type !== undefined) {
                if (model.type && !isToDelete(model.type)) {
                    model.annotations = model.annotations || [];
                    model.annotations.push({name: "return", value: ` ${model.type}`});
                } else {
                    self.findAnnotationsByName("return").forEach($annotation => self.removeAnnotation($annotation));
                }
            }

            if (model.args !== undefined) {
                model.args.forEach(arg => {
                    const argName = getName(arg);
                    let $arg = self.findArgByName(argName);
                    const $paramAnnotations = self.findAnnotationsByName("param");
                    const $annotation = _.find($paramAnnotations, ($annotation => $annotation.value().match(new RegExp(`\\$${argName}(?![\w_])`))));

                    if ($annotation) self.removeAnnotation($annotation);

                    if (isToDelete(arg)) {
                        if ($arg) self.removeArg($arg);
                    } else {
                        const create = (!$arg);
                        if (create) $arg = self.parser.parse(g.funcArg);
                        $arg.setModel(arg);
                        const $prevNode = (arg.after ? self.findArgByName(arg.after) : undefined);
                        if (create) self.insertArg($arg, $prevNode);

                        // Add the @param annotation
                        const annotParts = ['$' + argName];
                        if (arg.type) annotParts.unshift(arg.type);
                        if (arg.desc) annotParts.push(arg.desc);

                        const prevArgName = $arg.prev ? $arg.prev.prev.name() : null;
                        const $prevArgAnnotation = prevArgName ? _.find($paramAnnotations, ($annotation => $annotation.value().match(new RegExp(`\\$${prevArgName}(?![\w_])`)))) : null;
                        const $annotation = self.parser.parse(g.docAnnotation, ' @param ' + annotParts.join(" "));
                        self.insertAnnotation($annotation, $prevArgAnnotation);
                    }
                });
            }

            if (model.annotations !== undefined) {
                const $annotations = self.getAnnotations();
                model.annotations.forEach(annotation => {
                    const $filteredAnnotations = _.filter($annotations, ($annotation => $annotation.name() === getName(annotation)));
                    // Guess the best annotation in the list, using Levenshtein distance.
                    let $annotation = null;
                    let lowestDist = null;
                    _.each($filteredAnnotations, ($node => {
                        const dist = levenshtein.get(annotation.value || '', $node.value() || '');
                        if (lowestDist !== null && dist >= lowestDist) return;
                        lowestDist = dist;
                        $annotation = $node;
                    }));

                    if (isToDelete(annotation)) {
                        if ($annotation) self.removeAnnotation($annotation);
                    } else {
                        const create = (!$annotation);
                        if (create) {
                            $annotation = self.parser.parse(g.docAnnotation);
                            $annotation.name(annotation.name);
                            self.insertAnnotation($annotation);
                        }

                        $annotation.setModel(annotation);
                    }
                });
            }
        };

        self.getModel = function () {
            return {
                desc: self.desc(),
                longDesc: self.longDesc(),
                annotations: self.getAnnotations().map($docAnnotation => $docAnnotation.getModel()),
                name: self.name(),
                type: self.type(),
                visibility: self.visibility(),
                abstract: self.abstract(),
                static: self.static(),
                final: self.final(),
                body: self.body(),
                args: self.getArgs().map($arg => $arg.getModel())
            };
        };
    });
};
