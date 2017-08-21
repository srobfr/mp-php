const g = {};

g.INDENT = "    ";

require(__dirname + "/grammar/basic.js")(g);
require(__dirname + "/grammar/doc.js")(g);
require(__dirname + "/grammar/constant.js")(g);
require(__dirname + "/grammar/method.js")(g);
require(__dirname + "/grammar/property.js")(g);
require(__dirname + "/grammar/class.js")(g);
require(__dirname + "/grammar/file.js")(g);

module.exports = {
    // Grammar & basic pseudo-DOM manipulation features
    grammar: g,
};
