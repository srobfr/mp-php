const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;
const {descHelper, longDescHelper} = require(__dirname + "/../helpers.js");

module.exports = function(g) {
    g.propertyMarker = or(g.visibility, g.abstract, g.static);

    g.propertyMarkers = optmul([g.propertyMarker, g.wDefaultOneSpace]);
    g.propertyMarkers.order = [g.abstract, g.static, g.visibility];

    g.property = [g.optDoc, g.propertyMarkers, g.variable, g.optDefaultValue, g.ow, g.semicolon];
    g.property.default = ($parent) => {
        const indent = g.INDENT;
        return `/**\n${indent} * TODO\n${indent} */\n${indent}private $todo;`;
    };
    g.property.decorator = function ($node) {
        $node.value = function (value) {
            const $optDefaultValue = $node.findOne(g.optDefaultValue);
            if (value === undefined) return ($optDefaultValue.children.length > 0 ? $optDefaultValue.findOne(g.staticExpr).text() : null);
            if (value === null) $optDefaultValue.text("");
            else $optDefaultValue.getOrCreateChild().findOne(g.staticExpr).text(value);
            return $node;
        };

        $node.name = function (name) {
            const $ident = $node.findOne(g.variable).findOne(g.ident);
            if (name === undefined) return $ident.text();
            $ident.text(name);
            return $node;
        };

        $node.visibility = function (visibility) {
            const $visibility = $node.findOne(g.visibility);
            if (visibility === undefined) return $visibility.text();
            $visibility.text(visibility);
            return $node;
        };

        $node.type = function (type) {
            const $optDoc = $node.findOne(g.optDoc);
            const $doc = $optDoc.getOrCreateChild().findOne(g.doc);
            const $docAnnotations = $doc.findOne(g.docAnnotations);
            const $varAnnotation = $docAnnotations.findOne($node => $node.grammar === g.docAnnotation && $node.findOne(g.docAnnotationIdent).text() === "@var");
            if ($varAnnotation) $doc.removeAnnotation($varAnnotation);
            $docAnnotations.add(`@var ${type}`);
            $doc.fix();
        };

        $node.desc = (desc) => descHelper(g, $node, desc);
        $node.longDesc = (longDesc) => longDescHelper(g, $node, longDesc);
    };

    // TODO
};
