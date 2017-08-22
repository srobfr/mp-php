module.exports = function (g, helpers) {
    const {
        extendBuildNodeFunc,
        callIfDefined
    } = helpers;

    extendBuildNodeFunc(g.constant, function (self) {
        self.setModel = function (model) {
            callIfDefined(model.desc, self.desc);
            callIfDefined(model.longDesc, self.longDesc);
            callIfDefined(model.name, self.name);
            callIfDefined(model.value, self.value);
        };

        self.getModel = function () {
            return {
                desc: self.desc(),
                longDesc: self.longDesc(),
                name: self.name(),
                value: self.value()
            };
        };
    });
};
