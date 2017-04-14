const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    g.namespace = ["namespace", g.w, g.fqn, g.ow, g.semicolon];
    g.namespace.default = "namespace TODO;";

    g.use = [
        "use", g.w,
        g.fqn,
        optional([g.w, "as", g.w, g.ident]),
        g.ow, g.semicolon
    ];

    g.use.default = "use TODO;";

    // TODO
};
