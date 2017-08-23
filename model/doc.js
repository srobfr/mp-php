const _ = require("lodash");

module.exports = function (g, helpers) {
    const {
        extendBuildNodeFunc,
        callIfDefined,
        getName,
        isToDelete
    } = helpers;

    extendBuildNodeFunc(g.docAnnotation, function (self) {
        self.setModel = function (model) {
            callIfDefined(model.name, self.name);
            callIfDefined(model.value, self.value);
        };

        self.getModel = function () {
            return {
                name: self.name(),
                value: self.value(),
            };
        };
    });

    extendBuildNodeFunc(g.doc, function (self) {
        self.setModel = function (model) {
            callIfDefined(model.desc, self.desc);
            callIfDefined(model.longDesc, self.longDesc);

            if(model.annotations !== undefined) {
                const $annotations = self.getAnnotations();
                model.annotations.forEach(annotation => {
                    let $docAnnotation = _.find($annotations, $annotation => $annotation.name() === getName(annotation));
                    if (isToDelete(annotation)) {
                        if ($docAnnotation) self.removeAnnotation($docAnnotation);
                    } else {
                        const create = (!$docAnnotation);
                        if (create) $docAnnotation = self.parser.parse(g.docAnnotation);
                        $docAnnotation.setModel(annotation);
                        if (create) self.insertAnnotation($docAnnotation);
                    }
                });
            }

        };

        self.getModel = function () {
            return {
                desc: self.desc(),
                longDesc: self.longDesc(),
                annotations: self.getAnnotations().map($docAnnotation => $docAnnotation.getModel())
            };
        };
    });
};
