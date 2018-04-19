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
        else if (m = type.match(/^((.+?)\[\]|\[.*\])$/)) {
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


module.exports = {
    callIfDefined,
    extendBuildNodeFunc,
    getName,
    isToDelete,
    phpDocTypeToPhpType,
    phpTypeToPhpDocType,
};
