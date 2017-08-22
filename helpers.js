const _ = require("lodash");

function extendBuildNodeFunc(grammar, func) {
    const previousBuildNodeFunc = grammar.buildNode;
    grammar.buildNode = function(self) {
        previousBuildNodeFunc(self);
        func(self);
    };
}

function callIfDefined(value, func) {
    if (value !== undefined) func(value);
}

function getName(model) {
    if (_.isString(model)) return model;
    return model.name;
}

function isToDelete(model) {
    return !!(model.delete);
}

module.exports = {
    extendBuildNodeFunc,
    callIfDefined,
    getName,
    isToDelete
};
