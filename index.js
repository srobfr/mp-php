const helpers = require(__dirname + "/helpers.js");

const g = {};

g.INDENT = "    ";

// Base grammar
require(__dirname + "/grammar/basic.js")(g);
require(__dirname + "/grammar/doc.js")(g);
require(__dirname + "/grammar/constant.js")(g);
require(__dirname + "/grammar/method.js")(g);
require(__dirname + "/grammar/property.js")(g);
require(__dirname + "/grammar/class.js")(g);
require(__dirname + "/grammar/file.js")(g);

// Model
require(__dirname + "/model/constant.js")(g, helpers);
require(__dirname + "/model/property.js")(g, helpers);
require(__dirname + "/model/method.js")(g, helpers);

const Parser = require("microparser").Parser;
const parser = new Parser();

module.exports = {
    grammar: g,
    parser: parser
};
