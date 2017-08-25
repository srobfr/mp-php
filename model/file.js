const _ = require("lodash");

module.exports = function (g, helpers) {
    const {
        extendBuildNodeFunc,
        callIfDefined,
        getName,
        isToDelete
    } = helpers;

    extendBuildNodeFunc(g.use, function (self) {
        self.setModel = function (model) {
            callIfDefined(model.fqn, self.fqn);
            callIfDefined(model.alias, self.alias);
        };

        self.getModel = function () {
            return {
                fqn: self.fqn(),
                alias: self.alias(),
            };
        };
    });

    extendBuildNodeFunc(g.file, function (self) {
        const classModelKeys = [
            "desc", "longDesc", "annotations",
            "abstract", "final", "kind", "name", "extends",
            "properties", "implements", "constants", "methods"
        ];

        self.setModel = function (model) {
            callIfDefined(model.namespace, self.namespace);

            if (model.uses !== undefined) {
                const $uses = self.getUses();
                model.uses.forEach(use => {
                    let $use = _.find($uses, $use => use.alias ? $use.alias() === use.alias : $use.fqn() === use.fqn);
                    if (isToDelete(use)) {
                        if ($use) self.removeUse($use);
                    } else {
                        const create = (!$use);
                        if (create) $use = self.parser.parse(g.use);
                        $use.setModel(use);
                        if (create) self.insertUse($use);
                    }
                });
            }


            const classModel = {};
            classModelKeys.forEach(key => classModel[key] = model[key]);

            if (model.traits !== undefined) classModel.uses = model.traits;

            self.class().setModel(classModel);
        };

        self.getModel = function () {

            const classModel = self.class().getModel();

            const model = {
                namespace: self.namespace(),
                uses: self.getUses().map($use => $use.getModel()),
                traits: classModel.uses,
            };

            classModelKeys.forEach(key => model[key] = classModel[key]);

            return model;
        };
    });
};
