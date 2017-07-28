const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    g.docStartMarker = "/**";

    g.docNl = /^[\r\n]/;

    g.docIndent = /^[ \t]*(?= ?\*)/;
    g.docIndent.default = "";

    g.docLineMarker = /^ ?\*(?!\/)/;

    g.docLineContent = /^(.(?!(?:\n|\r|\*\/)))*./; // Everything up to \n, \r ou "*/"
    g.docContentUntilNextAnnotationOrEnd = optmul([
        not([
            optional([g.docNl, g.docIndent]),
            or(g.docEndMarker, [g.docLineMarker, g.docAnnotationContainer])
        ]),

    ]);

    g.docEndMarker = /^ ?\*\//;

    g.phpDocType = [g.fqn];
    g.phpDocType.tag = "type";

    g.phpDocVariable = [g.variable];
    g.phpDocVariable.tag = "variable";

    g.phpDocAnnotationName = [g.fqn];
    g.phpDocAnnotationName.tag = "name";
    g.phpDocAnnotationIdent = ["@", g.phpDocAnnotationName];

    g.phpDocVarAnnotation = ["@var", /^ +/, g.phpDocType];
    g.phpDocReturnAnnotation = ["@return", /^ +/, g.phpDocType];
    g.phpDocParamAnnotation = ["@param", /^ +/, g.phpDocType, /^ +/, g.phpDocVariable];

    g.phpDocOtherAnnotationValue = [g.docLineContent];
    g.phpDocOtherAnnotationValue.tag = "value";

    g.phpDocOtherAnnotation = [
        g.phpDocAnnotationIdent,
        // TODO jusqu'à la prochaine annotation ou la balise de fin.
    ];
    g.phpDocOtherAnnotation.tag = "phpDocOtherAnnotation";

    g.phpDocAnnotation = or(
        g.phpDocVarAnnotation,
        g.phpDocReturnAnnotation,
        g.phpDocParamAnnotation,
        g.phpDocOtherAnnotation
    );
    g.phpDocAnnotation.tag = "annotation";

    g.docAnnotationContainer = [/^ */, g.phpDocAnnotation];

    g.docDesc = [g.docLineContent];
    g.docDesc.tag = "desc";

    g.oneLineDoc = [
        g.docStartMarker,
        or(g.docAnnotationContainer, g.docDesc),
        g.docEndMarker,
    ];
    g.oneLineDoc.tag = "oneLineDoc";

    g.multiLineDoc = [
        g.docStartMarker,
        g.docNl, g.docIndent, g.docLineMarker, g.docDesc,
        g.docNl, g.docIndent, g.docEndMarker,
    ];
    g.multiLineDoc.tag = "multiLineDoc";

    g.doc = or(g.oneLineDoc, g.multiLineDoc);
};
