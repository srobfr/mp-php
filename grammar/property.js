const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function(g) {
    g.propertyMarker = or(g.visibility, g.abstract, g.static);

    g.propertyMarkers = optmul([g.propertyMarker, g.wDefaultOneSpace]);
    g.propertyMarkers.order = [g.abstract, g.static, g.visibility];

    // TODO
};
