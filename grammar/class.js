const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function(g) {
    g.classMarker = or(g.abstract, g.final);

    // TODO
};
