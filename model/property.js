module.exports = function (g, helpers) {
    const {
        extendBuildNodeFunc,
        callIfDefined
    } = helpers;

    extendBuildNodeFunc(g.property, function (self) {
        self.setModel = function (model) {
            callIfDefined(model.desc, self.desc);
            callIfDefined(model.longDesc, self.longDesc);
            callIfDefined(model.name, self.name);
            callIfDefined(model.value, self.value);
            callIfDefined(model.visibility, self.visibility);
            callIfDefined(model.abstract, self.abstract);
            callIfDefined(model.static, self.static);
        };

        self.getModel = function () {
            return {
                desc: self.desc(),
                longDesc: self.longDesc(),
                name: self.name(),
                value: self.value(),
                visibility: self.visibility(),
                abstract: self.abstract(),
                static: self.static(),
            };
        };
    });
};
