const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    g.docStartMarker = "/**";

    g.docNl = /^[ \t]*[\r\n]/;
    g.docNl.default = "\n";

    g.docIndent = or(/^[ \t]*(?= \*)/, /^[ \t]*/);
    g.docIndent.default = "";

    g.docLineMarker = /^ ?\*(?!\/)/;
    g.docLineMarker.default = " *";

    g.docLineStartBlock = multiple([g.docNl, g.docIndent, g.docLineMarker]);
    g.docLineStartBlock.tag = "docLineStartBlock";

    g.docLineContent = /^(.(?!(?:\n|\r|\*\/)))*./; // Everything up to \n, \r ou "*/"

    g.docEndMarker = /^ ?\*\//;
    g.docEndMarker.default = " */";

    g.docEndBlock = [optmul(g.docLineStartBlock), g.docNl, g.docIndent, g.docEndMarker];
    g.docEndBlock.tag = "docEndBlock";

    g.docDesc = [not(/^ *@/), g.docLineContent];
    g.docDesc.tag = "docDesc";
    g.docDesc.buildNode = function(self) {
        self.desc = (desc) => {
            const $docLineContent = self.children[1];
            if (desc === undefined) return $docLineContent.text().trim();
            $docLineContent.text(" " + desc.trim());
            return self;
        };
    };

    g.docDescBlock = [g.docLineStartBlock, g.docDesc];
    g.docDescBlock.tag = "docDescBlock";
    g.docDescBlock.default = "\n * TODO";

    g.docOptDescBlock = optional(g.docDescBlock);
    g.docOptDescBlock.buildNode = function(self) {
        self.desc = function(desc) {
            let $docDescBlock = self.children[0];
            if (desc === undefined) return $docDescBlock ? $docDescBlock.findOneByGrammar(g.docDesc).desc() : null;
            if (desc === null) {
                if ($docDescBlock) {
                    self.empty();

                }
            } else {
                if (!$docDescBlock) {
                    self.text(self.grammar.value.default);
                    // TODO Corriger le début de ligne du bloc suivant.
                    $docDescBlock = self.children[0];
                }

                $docDescBlock.findOneByGrammar(g.docDesc).desc(desc);
            }

            return self;
        };
    };

    g.docOneLineDoc = [
        g.docStartMarker,
        /^[ \t]*/, // TODO
        g.docEndMarker
    ];

    g.docMultilineDoc = [
        g.docStartMarker,
        g.docOptDescBlock,
        g.docEndBlock
    ];
    g.docMultilineDoc.buildNode = function(self) {
        self.desc = (desc => {
            const r = self.children[1].desc(desc);
            return (desc === undefined ? r : self);
        });
    };

    g.doc = or(g.docOneLineDoc, g.docMultilineDoc);
    g.doc.buildNode = function(self) {
        self.desc = (desc => {
            const r = self.children[0].desc(desc);
            return (desc === undefined ? r : self);
        });
    };
};
