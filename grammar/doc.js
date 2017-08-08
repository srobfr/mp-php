const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    // docStartMarker
    g.docStartMarker = "/**";

    // docNl
    g.docNl = /^[ \t]*[\r\n]/;
    g.docNl.default = "\n";

    // docIndent
    g.docIndent = or(/^[ \t]*(?= \*)/, /^[ \t]*/);
    g.docIndent.default = "";

    // docLineMarker
    g.docLineMarker = /^ ?\*(?!\/)/;
    g.docLineMarker.default = " *";

    // docLineStartBlock
    g.docLineStartBlock = multiple([g.docNl, g.docIndent, g.docLineMarker]);
    g.docLineStartBlock.tag = "docLineStartBlock";

    // docSeparator
    g.docSeparator = optional([g.docLineStartBlock]);
    g.docSeparator.tag = "docSeparator";

    // docLineContent
    g.docLineContent = /^(.(?!(?:\n|\r|\*\/)))*./; // Everything up to \n, \r ou "*/"

    // docEndMarker
    g.docEndMarker = /^ ?\*\//;
    g.docEndMarker.default = " */";

    // docContentUntilNextAnnotationOrEnd
    g.docContentUntilNextAnnotationOrEnd = multiple([
        optmul(g.docLineStartBlock),
        not(or(g.docEndMarker, /^ *@/)),
        g.docLineContent,
    ]);
    g.docContentUntilNextAnnotationOrEnd.buildNode = function (self) {
        self.textWithoutLineStarts = function (text) {
            if (text === undefined) return self.text().replace(/\n[ \t]*\*(?!\/) ?/g, "\n");
            const newText = text.split(/\n/).map(l => (l.trim() === "" ? "" : " " + l)).join(`\n *`);
            self.text(newText);
            return self;
        };
    };

    // docEndBlock
    g.docEndBlock = [optional(g.docLineStartBlock), g.docNl, g.docIndent, g.docEndMarker];
    g.docEndBlock.tag = "docEndBlock";

    // docDesc
    g.docDesc = [not(/^ *@/), g.docLineContent];
    g.docDesc.tag = "docDesc";
    g.docDesc.buildNode = function (self) {
        self.desc = (desc) => {
            const $docLineContent = self.children[1];
            if (desc === undefined) return $docLineContent.text().trim();
            $docLineContent.text(" " + desc.trim());
            return self;
        };
    };

    // docOptDescBlock
    g.docOptDescBlock = optional([g.docSeparator, g.docDesc]);
    g.docOptDescBlock.buildNode = function (self) {
        self.desc = (desc) => {
            let $docDescBlock = self.children[0];
            if (desc === undefined) return $docDescBlock ? $docDescBlock.findOneByGrammar(g.docDesc).desc() : null;
            if (desc === null) {
                if ($docDescBlock) self.empty();
            } else {
                if (!$docDescBlock) {
                    self.text(`\n * TODO`);
                    $docDescBlock = self.children[0];
                }

                $docDescBlock.findOneByGrammar(g.docDesc).desc(desc);
            }

            return self;
        };
    };

    // docLongDesc
    g.docLongDesc = [not(/^ *@/), g.docContentUntilNextAnnotationOrEnd];
    g.docLongDesc.tag = "docLongDesc";
    g.docLongDesc.buildNode = function (self) {
        self.longDesc = (longDesc) => {
            const $docContentUntilNextAnnotationOrEnd = self.children[1];
            if (longDesc === undefined) return $docContentUntilNextAnnotationOrEnd.textWithoutLineStarts().trim();
            $docContentUntilNextAnnotationOrEnd.textWithoutLineStarts(longDesc);
            return self;
        };
    };

    // docOptLongDescBlock
    g.docOptLongDescBlock = optional([g.docSeparator, g.docLongDesc]);
    g.docOptLongDescBlock.buildNode = function (self) {
        self.longDesc = (longDesc) => {
            let $docLongDescBlock = self.children[0];
            if (longDesc === undefined) return $docLongDescBlock ? $docLongDescBlock.findOneByGrammar(g.docLongDesc).longDesc() : null;
            if (longDesc === null) {
                if ($docLongDescBlock) self.empty();
            } else {
                if (!$docLongDescBlock) {
                    self.text(`\n *\n * TODO`);
                    $docLongDescBlock = self.children[0];
                }

                $docLongDescBlock.findOneByGrammar(g.docLongDesc).longDesc(longDesc);
            }

            return self;
        };
    };

    // doc
    g.doc = [
        g.docStartMarker,
        g.docOptDescBlock,
        g.docOptLongDescBlock,
        g.docEndBlock
    ];
    g.doc.buildNode = function (self) {
        /**
         * Find the next non-empty node, and fix its separator block
         * @param $node
         */
        function fixFirstNonEmptyNodeSeparator($node) {
            const isRemoving = ($node.children.length === 0);
            let $next = $node.next;
            while ($next.children.length === 0) $next = $next.next;
            if ($next.grammar === g.docEndBlock) {
                if (isRemoving && $node.grammar === g.docOptDescBlock) $next.text(`\n *\n */`); // We are removing the first block.
                else $next.text(`\n */`);
            } else {
                const $docLineStartBlock = $next.findOneByGrammar(g.docLineStartBlock);
                if (isRemoving) $docLineStartBlock.empty();
                else $docLineStartBlock.text(`\n *`);
            }
        }

        self.desc = function (desc) {
            const $docOptDescBlock = self.children[1];
            if (desc === undefined) return $docOptDescBlock.desc();
            $docOptDescBlock.desc(desc);
            fixFirstNonEmptyNodeSeparator($docOptDescBlock);
            return self;
        };
        
        self.longDesc = function (longDesc) {
            const $docOptLongDescBlock = self.children[2];
            if (longDesc === undefined) return $docOptLongDescBlock.longDesc();
            $docOptLongDescBlock.longDesc(longDesc);
            fixFirstNonEmptyNodeSeparator($docOptLongDescBlock);
            return self;
        };

        self.indent = function (indent) {
            if (indent === undefined) {
                const $firstIndent = self.findOneByGrammar(g.docIndent);
                return $firstIndent ? $firstIndent.text() : null;
            }
            _.each(self.findByGrammar(g.docIndent), ($docIndent => $docIndent.text(indent)));
            return self;
        };
    };
};
