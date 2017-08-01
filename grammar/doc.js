const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    g.docStartMarker = /^\/\*\* */;
    g.docStartMarker.default = "/**";

    g.docNl = /^[\r\n]/;
    g.docNl.default = "\n";

    g.docIndent = /^[ \t]*(?= ?\*)/;
    g.docIndent.default = "";

    g.docLineMarker = /^ ?\*(?!\/)/;
    g.docLineMarker.default = " *";

    g.docLineStartBlock = [g.docNl, g.docIndent, g.docLineMarker];

    g.docLineContent = /^(.(?!(?:\n|\r|\*\/)))*./; // Everything up to \n, \r ou "*/"
    g.docEndMarker = /^ ?\*\//;
    g.docEndMarker.default = " */";

    g.phpDocType = [g.fqn, optional("[]")];
    g.phpDocType.tag = "type";

    g.phpDocVariable = [g.variable];
    g.phpDocVariable.tag = "variable";

    g.phpDocAnnotationName = [g.fqn];
    g.phpDocAnnotationName.tag = "name";
    g.phpDocAnnotationIdent = ["@", g.phpDocAnnotationName];

    g.phpDocVarAnnotation = ["@var", /^ +/, g.phpDocType];
    g.phpDocReturnAnnotation = ["@return", /^ +/, g.phpDocType];
    g.phpDocParamAnnotation = ["@param", /^ +/, g.phpDocType, /^ +/, g.phpDocVariable];

    g.docContentUntilNextAnnotationOrEnd = optmul([
        not(or(g.docEndMarker, /^ *@/)),
        or(g.docLineStartBlock, g.docLineContent)
    ]);
    g.docContentUntilNextAnnotationOrEnd.buildNode = function (self) {
        self.textWithoutLineStarts = function (text) {
            if (text === undefined) return self.text().replace(/\n[ \t]*\*(?!\/) ?/g, "\n");

            const newText = text.split(/\n/).map(l => {
                const lTrim = l.replace(/[ \t]+$/, "");
                return (lTrim === "" ? "" : " " + lTrim);
            }).join(`\n *`);

            self.text(newText);
            return self;
        };
    };

    g.phpDocOtherAnnotationValue = [g.docContentUntilNextAnnotationOrEnd];
    g.phpDocOtherAnnotationValue.tag = "value";

    g.phpDocOtherAnnotation = [
        g.phpDocAnnotationIdent,
        g.phpDocOtherAnnotationValue
    ];
    g.phpDocOtherAnnotation.tag = "phpDocOtherAnnotation";

    g.phpDocAnnotation = or(
        g.phpDocVarAnnotation,
        g.phpDocReturnAnnotation,
        g.phpDocParamAnnotation,
        g.phpDocOtherAnnotation
    );

    g.docAnnotationContainer = [/^ */, g.phpDocAnnotation];
    g.docAnnotationContainer.tag = "annotation";
    g.docAnnotationContainer.buildNode = function (self) {
        self.name = (name) => {
            const $name = self.children[1].findOneByGrammar(g.phpDocAnnotationName);
            const r = $name.text(name);
            return (name === undefined ? r : self);
        };
        self.type = (type) => {
            const $type = self.children[1].findOneByGrammar(g.phpDocType);
            const r = $type.text(type);
            return (type === undefined ? r : self);
        };
        self.variable = (variable) => {
            const $variableIdent = self.children[1].findOneByGrammar(g.phpDocVariable).children[0].children[1];
            const r = $variableIdent.text(variable);
            return (variable === undefined ? r : self);
        };
        self.value = (value) => {
            const $value = self.children[1].findOneByTag("value");
            if (value === undefined) return $value.text().trim();
            $value.text(" " + value.trim());
            return self;
        };
    };


    g.docDesc = optional(g.docLineContent);
    g.docDesc.tag = "desc";

    g.docLongDesc = [not(/^ *@/), g.docContentUntilNextAnnotationOrEnd];
    g.docLongDesc.tag = "longDesc";

    g.oneLineDoc = [
        g.docStartMarker,
        or(g.docAnnotationContainer, g.docDesc),
        g.docEndMarker,
    ];
    g.oneLineDoc.tag = "oneLineDoc";

    g.multiLineDoc = [
        g.docStartMarker,
        multiple(g.docLineStartBlock), g.docDesc,
        optional([g.docLineStartBlock, g.docLongDesc]),
        optmul([g.docLineStartBlock, g.docAnnotationContainer]),
        g.docNl, g.docIndent, g.docEndMarker,
    ];
    g.multiLineDoc.tag = "multiLineDoc";

    g.doc = or(g.oneLineDoc, g.multiLineDoc);
    g.doc.buildNode = function (self) {
        self.convertToMultiline = function () {
            if (self.children[0].grammar === g.multiLineDoc) return self;

            const $oneLineDoc = self.children[0];
            const $multiLineDoc = self.parser.parse(g.multiLineDoc);
            const $oldContent = $oneLineDoc.children[1].children[0];
            $oldContent.text(" " + $oldContent.text().trim());
            if ($oldContent.grammar === g.docDesc) $multiLineDoc.children[2].replaceWith($oldContent);
            else $multiLineDoc.children[4].text(`\n *${$oldContent.text()}`);

            self.children[0] = $multiLineDoc;
            return self;
        };

        self.desc = (desc) => {
            if (desc === undefined) return self.findOneByGrammar(g.docDesc).text().trim();
            self.convertToMultiline();
            self.findOneByGrammar(g.docDesc).text(" " + desc + (self.children[0].grammar === g.oneLineDoc ? " " : ""));
            return self;
        };

        self.longDesc = (longDesc) => {
            let $docLongDesc = self.findOneByGrammar(g.docLongDesc);
            if (longDesc === undefined) return $docLongDesc ? $docLongDesc.children[1].textWithoutLineStarts().trim() : null;
            self.convertToMultiline();

            const $optLongDescContainer = self.children[0].children[3];
            if (longDesc === null) {
                // Remove
                if ($docLongDesc) $optLongDescContainer.empty();
            } else {
                if (!$docLongDesc) {
                    $optLongDescContainer.text("\n *\n *\n *TODO");
                    $docLongDesc = $optLongDescContainer.children[0].children[1];
                }

                $docLongDesc.children[1].textWithoutLineStarts("\n" + longDesc);
            }

            return self;
        };
    };

    g.optDoc = optional([g.doc, g.ow]);
    g.optDoc.buildNode = function (self) {
        self.desc = (desc) => {
            let $doc = self.children.length === 0 ? null : self.children[0].children[0];
            if (desc === undefined) return $doc ? $doc.desc() : null;
            if (desc === null) {
                // Remove
                if ($doc) $doc.desc(desc);
            } else {
                if (!$doc) {
                    // Create
                    self.text(`/**
 * ${desc}
 */
`);
                } else {
                    // Update
                    $doc.desc(desc);
                }
            }

            return self;
        };

        self.longDesc = (longDesc) => {
            let $doc = self.children.length === 0 ? null : self.children[0].children[0];
            if (longDesc === undefined) return $doc ? $doc.longDesc() : null;
            if (longDesc === null) {
                // Remove
                if ($doc) $doc.longDesc(longDesc);
            } else {
                if (!$doc) {
                    // Create
                    self.text(`/**
 * TODO
 *
 * ${longDesc}
 */
`);
                } else {
                    // Update
                    $doc.longDesc(longDesc);
                }
            }

            return self;
        };
    };
};
