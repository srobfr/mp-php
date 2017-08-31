const _ = require("lodash");

module.exports = function (g, helpers) {
    const {
        extendBuildNodeFunc,
        callIfDefined,
        getName,
        isToDelete
    } = helpers;

    extendBuildNodeFunc(g.property, function (self) {
        self.setModel = function (model) {
            callIfDefined(model.desc, self.desc);
            callIfDefined(model.longDesc, self.longDesc);
            callIfDefined(model.name, self.name);
            callIfDefined(model.value, self.value);

            if (model.visibility === undefined && !self.visibility()) model.visibility = "private";
            callIfDefined(model.visibility, self.visibility);
            callIfDefined(model.abstract, self.abstract);
            callIfDefined(model.static, self.static);

            if(model.type !== undefined) {
                model.annotations = model.annotations || [];
                model.annotations.push({name: "var", value: ` ${model.type}`});
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
                value: self.value(),
                visibility: self.visibility(),
                abstract: self.abstract(),
                static: self.static(),
            };
        };
    });
};
