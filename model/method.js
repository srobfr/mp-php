const _ = require("lodash");

module.exports = function (g, helpers) {
    const {
        extendBuildNodeFunc,
        callIfDefined,
        getName,
        isToDelete
    } = helpers;

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

            if(model.args !== undefined) {
                const $args = self.getArgs();
                model.args.forEach(arg => {
                    let $arg = _.find($args, $arg => $arg.name() === getName(arg));
                    if (isToDelete(arg)) {
                        if ($arg) self.removeArg($arg);
                    } else {
                        const create = (!$arg);
                        if (create) $arg = self.parser.parse(g.funcArg);
                        $arg.setModel(arg);
                        if (create) self.insertArg($arg);
                    }
                });
            }

            if(model.annotations !== undefined) {
                const $annotations = self.getAnnotations();
                model.annotations.forEach(annotation => {
                    let $annotation = _.find($annotations, $annotation => $annotation.name() === getName(annotation));
                    if (isToDelete(annotation)) {
                        if ($annotation) self.removeAnnotation($annotation);
                    } else {
                        const create = (!$annotation);
                        if (create) $annotation = self.parser.parse(g.docAnnotation);
                        $annotation.setModel(annotation);
                        if (create) self.insertAnnotation($annotation);
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
