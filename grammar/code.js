const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {

    const staticExpr = or(
        g.string,
        g.numeric,
        g.keywords,
        g.constRef,
        g.classConstRef
    );

    const expr = or(staticExpr);

    const arraySeparator = [g.ow, ',', g.ow];
    const array = ['[', optmul(expr, arraySeparator), ']'];
    expr.value.push(array);

    g.codeTestBed = [
        'µ',
        array,
        'µ',
    ];

};
