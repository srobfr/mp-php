const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    // docStartMarker
    g.docStartMarker = "/**";

    // docNl
    g.docNl = /^[ \t]*[\r\n]/;
    g.docNl.default = "\n";

    // docIndent
    g.docIndent = /^[ \t]*/;
    g.docIndent.default = "";

    // docLineMarker
    g.docLineMarker = /^ ?\*(?!\/)/;
    g.docLineMarker.default = " *";

    // docLineStartBlock
    g.docLineStartBlock = multiple([g.docNl, g.docIndent, g.docLineMarker]);
    g.docLineStartBlock.tag = "docLineStartBlock";

    // docSeparator
    g.docSeparator = optional(g.docLineStartBlock);
    g.docSeparator.tag = "docSeparator";

    // docLineContent
    g.docLineContent = /^(.(?!(?:\n|\r|\*\/)))*./; // Everything up to \n, \r ou "*/"

    // docEndMarker
    g.docEndMarker = /^ ?\*\//;
    g.docEndMarker.default = " */";

    // docContentUntilNextAnnotationOrEnd
    const fullLineRegex = `( *[^ @\\n].*?(?=\\*\\/|\\n|$))`;
    const emptyLine = `([ \\t]*[\\r\\n][ \\t]*\\*(?!\\/))`;
    const withPrefixRe = `${fullLineRegex}(${emptyLine}+${fullLineRegex})*`;
    const withSuffixRe = `${fullLineRegex}?(${emptyLine}+${fullLineRegex})+`;
    const re = `^(${withPrefixRe}|${withSuffixRe})`;
    g.docContentUntilNextAnnotationOrEnd = [new RegExp(re)];
    g.docContentUntilNextAnnotationOrEnd.buildNode = function (self) {
        self.textWithoutLineStarts = function (text) {
            const indent = self.getIndent();
            if (text === undefined) return self.text().replace(/\n[ \t]*\*(?!\/) ?/g, "\n");
            const newText = text.split(/\n/)
                .map((l, i) => (l.trim() === "" ? "" : (i === 0 ? "" : " ") + l))
                .join(`\n${indent} *`);
            self.text(newText);
            return self;
        };
    };

    // docEndBlock
    g.docEndBlock = [g.docSeparator, g.docNl, g.docIndent, g.docEndMarker];
    g.docEndBlock.tag = "docEndBlock";

    // docDesc
    g.docDesc = [not(/^ *@/), g.docLineContent];
    g.docDesc.buildNode = function (self) {
        self.desc = (desc) => {
            const $docLineContent = self.children[1];
            if (desc === undefined) return $docLineContent.text().trim() || null;
            $docLineContent.text(" " + desc.trim());
            return self;
        };
    };

    // docOptDescBlock
    g.docOptDescBlock = optional([g.docSeparator, g.docDesc]);
    g.docOptDescBlock.tag = "docOptDescBlock";
    g.docOptDescBlock.buildNode = function (self) {
        self.desc = (desc) => {
            let $docDescBlock = self.children[0];
            if (desc === undefined) return $docDescBlock ? $docDescBlock.findOneByGrammar(g.docDesc).desc() : null;
            if (desc === null) {
                if ($docDescBlock) self.empty();
            } else {
                if (!$docDescBlock) {
                    const indent = self.getIndent();
                    self.text(`\n${indent} * TODO`);
                    $docDescBlock = self.children[0];
                }

                $docDescBlock.findOneByGrammar(g.docDesc).desc(desc);
            }

            return self;
        };
    };

    // docLongDesc
    g.docLongDesc = [g.docContentUntilNextAnnotationOrEnd];
    g.docLongDesc.buildNode = function (self) {
        self.longDesc = (longDesc) => {
            const $docContentUntilNextAnnotationOrEnd = self.children[0];
            if (longDesc === undefined) return $docContentUntilNextAnnotationOrEnd.textWithoutLineStarts().trim();
            $docContentUntilNextAnnotationOrEnd.textWithoutLineStarts(" " + longDesc.trim());
            return self;
        };
    };

    // docOptLongDescBlock
    g.docOptLongDescBlock = optional([g.docSeparator, g.docLongDesc]);
    g.docOptLongDescBlock.tag = "docOptLongDescBlock";
    g.docOptLongDescBlock.buildNode = function (self) {
        self.longDesc = (longDesc) => {
            let $docLongDescBlock = self.children[0];
            if (longDesc === undefined) return $docLongDescBlock ? $docLongDescBlock.findOneByGrammar(g.docLongDesc).longDesc() : null;
            if (longDesc === null) {
                if ($docLongDescBlock) self.empty();
            } else {
                if (!$docLongDescBlock) {
                    const indent = self.getIndent();
                    self.text(`\n${indent} *\n${indent} * TODO`);
                    $docLongDescBlock = self.children[0];
                }

                $docLongDescBlock.findOneByGrammar(g.docLongDesc).longDesc(longDesc);
            }

            return self;
        };
    };

    // docAnnotationName
    g.docAnnotationName = ["@", g.fqn];
    g.docAnnotationName.tag = "name";
    g.docAnnotationName.buildNode = function (self) {
        self.name = function (name) {
            const $fqn = self.children[1];
            const r = $fqn.text(name);
            return (name === undefined ? r : self);
        };
    };

    // docAnnotationValue
    g.docAnnotationValue = optional(g.docContentUntilNextAnnotationOrEnd);
    g.docAnnotationValue.tag = "value";
    g.docAnnotationValue.buildNode = function (self) {
        self.value = function (value) {
            let $docAnnotationValue = self.children[0];
            if (value === undefined) return $docAnnotationValue ? $docAnnotationValue.textWithoutLineStarts().trim() : null;
            if (value === null) {
                if ($docAnnotationValue) self.empty();
            } else {
                if (!$docAnnotationValue) {
                    self.text(` TODO`);
                    $docAnnotationValue = self.children[0];
                }

                value = (value[0] === " " ? value : " " + value);
                $docAnnotationValue.textWithoutLineStarts(value);
            }

            return self;
        };
    };
    // docAnnotation
    g.docAnnotation = [/^ */, g.docAnnotationName, g.docAnnotationValue];
    g.docAnnotation.default = " @todo";
    g.docAnnotation.buildNode = function (self) {
        self.name = (name => {
            const r = self.children[1].name(name);
            return (name === undefined ? r : self);
        });

        self.value = (value => {
            const r = self.children[2].value(value);
            return (value === undefined ? r : self);
        });
    };

    // docAnnotationBlock
    g.docAnnotationBlock = [g.docSeparator, g.docAnnotation];

    // docAnnotations
    g.docAnnotations = optmul(g.docAnnotationBlock);
    g.docAnnotations.order = [($node => $node.findOneByGrammar(g.docAnnotation).text().trim())];
    g.docAnnotations.tag = "docAnnotations";
    g.docAnnotations.buildNode = function (self) {
        self.getAnnotations = () => self.findByGrammar(g.docAnnotation);
        self.findAnnotationsByName = (name) => self.getAnnotations().filter(($docAnnotation) => $docAnnotation.name() === name);
        self.insertAnnotation = function ($docAnnotation, $previousNode) {
            // Wrap in a docAnnotationBlock
            const $docAnnotationBlock = self.parser.parse(g.docAnnotationBlock);
            $docAnnotationBlock.children[1].replaceWith($docAnnotation);
            self.insert($docAnnotationBlock, $previousNode ? $previousNode.findParentByGrammar(g.docAnnotationBlock) : undefined);

            // Fix separators
            const indent = self.getIndent();
            if ($docAnnotationBlock.prev && $docAnnotationBlock.prev.children[1].name() === $docAnnotation.name()) $docAnnotationBlock.children[0].text(`\n${indent} *`);
            else $docAnnotationBlock.children[0].text(`\n${indent} *\n${indent} *`);

            if ($docAnnotationBlock.next) {
                const name = $docAnnotationBlock.next.children[1].name();
                $docAnnotationBlock.next.children[0].text(name === $docAnnotation.name() ? `\n${indent} *` : `\n${indent} *\n${indent} *`);
            }

            return self;
        };
        self.removeAnnotation = function ($docAnnotation) {
            const $docAnnotationBlock = $docAnnotation.parent;
            $docAnnotationBlock.remove();

            // Fix separators
            const indent = self.getIndent();
            if ($docAnnotationBlock.next) {
                const name = $docAnnotationBlock.next.children[1].name();
                $docAnnotationBlock.next.children[0].text(name === ($docAnnotationBlock.prev ? $docAnnotationBlock.prev.children[1].name() : null) ? `\n${indent} *` : `\n${indent} *\n${indent} *`);
            }

            return self;
        };
    };

    // docMonoline
    g.docMonoline = [
        g.docStartMarker,
        or(g.docDesc, g.docAnnotation),
        /^ */,
        g.docEndMarker
    ];
    g.docMonoline.buildNode = function (self) {
        self.desc = function (desc) {
            let $docDesc = self.children[1].children[0];
            if ($docDesc.grammar !== g.docDesc) {
                if (desc === undefined) return null;
                $docDesc = self.parser.parse(g.docDesc, "TODO");
                self.children[1].children[0] = $docDesc;
            } else if (desc === undefined) {
                return $docDesc.desc(desc);
            }

            $docDesc.desc(desc);
            self.children[2].text(" ");

            return self;
        };
        self.getAnnotations = function () {
            let $docAnnotation = self.children[1].children[0];
            if ($docAnnotation.grammar !== g.docAnnotation) return [];
            return [$docAnnotation];
        };
    };

    // docMultiline
    g.docMultiline = [
        g.docStartMarker,
        g.docOptDescBlock,
        g.docOptLongDescBlock,
        g.docAnnotations,
        g.docEndBlock
    ];
    g.docMultiline.buildNode = function (self) {
        /**
         * Fix the end block content.
         */
        function fixSeparators() {
            let prevIsEmpty = true;
            let allEmpty = true;
            const indent = self.getIndent();
            _.each(_.map([1, 2, 3], (i => self.children[i])), ($node, i) => {
                if ($node.children.length === 0) return;

                allEmpty = false;
                let sep = `\n${indent} *`;
                if (!prevIsEmpty) sep += `\n${indent} *`;
                $node.findOneByGrammar(g.docSeparator).text(sep);
                prevIsEmpty = false;
            });

            self.children[4].text(allEmpty ? `\n${indent} *\n${indent} */` : `\n${indent} */`);
        }

        self.desc = function (desc) {
            const $docOptDescBlock = self.children[1];
            if (desc === undefined) return $docOptDescBlock.desc();
            $docOptDescBlock.desc(desc);
            fixSeparators();
            return self;
        };

        self.longDesc = function (longDesc) {
            const $docOptLongDescBlock = self.children[2];
            if (longDesc === undefined) return $docOptLongDescBlock.longDesc();
            $docOptLongDescBlock.longDesc(longDesc);
            fixSeparators();
            return self;
        };

        self.getAnnotations = () => self.children[3].getAnnotations();
        self.findAnnotationsByName = (name) => self.children[3].findAnnotationsByName(name);
        self.insertAnnotation = function ($docAnnotation, $previousNode) {
            const $docAnnotations = self.children[3];
            $docAnnotations.insertAnnotation($docAnnotation, $previousNode);
            fixSeparators();
            return self;
        };
        self.removeAnnotation = function ($docAnnotation) {
            const $docAnnotations = self.children[3];
            $docAnnotations.removeAnnotation($docAnnotation);
            fixSeparators();
            return self;
        };
    };

    // doc
    g.doc = or(g.docMonoline, g.docMultiline);
    g.doc.default = `/**\n * TODO\n */`;
    g.doc.buildNode = function (self) {
        self.convertToMultilineDoc = function () {
            if (self.children[0].grammar === g.docMonoline) {
                const $docMultiline = self.parser.parse(g.docMultiline);
                const $docMonoline = self.children[0];
                $docMultiline.desc($docMonoline.desc());
                const $annotations = $docMonoline.getAnnotations();
                if ($annotations.length) {
                    const $annotation = $annotations[0];
                    $annotation.text(" " + $annotation.text().trim());
                    $docMultiline.insertAnnotation($annotation);
                }
                $docMonoline.replaceWith($docMultiline);
            }

            return self;
        };

        self.desc = function (desc) {
            if (desc === undefined) return self.children[0].desc();
            self.children[0].desc(desc);
            return self;
        };

        self.longDesc = function (longDesc) {
            if (longDesc === undefined) return self.children[0].longDesc();
            self.children[0].longDesc(longDesc);
            return self;
        };

        self.getAnnotations = () => self.children[0].getAnnotations();
        self.findAnnotationsByName = (name) => self.children[0].findAnnotationsByName(name);
        self.insertAnnotation = ($docAnnotation, $previousNode) => self.children[0].insertAnnotation($docAnnotation, $previousNode);
        self.removeAnnotation = ($docAnnotation) => self.children[0].removeAnnotation($docAnnotation);
    };

    // optDoc
    g.optDoc = optional([g.doc, g.ow]);
    g.optDoc.buildNode = function (self) {
        function removeIfEmpty() {
            let $doc = (self.children[0] ? self.children[0].children[0] : null);
            if ($doc && !$doc.text().match(/[^\/\* \t\r\n]/)) self.empty();
        }

        function createDoc() {
            const indent = self.getIndent();
            self.text(`/**\n${indent} *\n${indent} */\n${indent}`);
            return self.children[0].children[0];
        }

        self.desc = function (desc) {
            let $doc = (self.children[0] ? self.children[0].children[0] : null);
            if (desc === undefined) return $doc ? $doc.desc() : null;
            if (desc === null) {
                if ($doc) $doc.desc(desc);
                removeIfEmpty();
            } else {
                if (!$doc) $doc = createDoc();
                $doc.desc(desc);
            }

            return self;
        };

        self.longDesc = function (longDesc) {
            let $doc = (self.children[0] ? self.children[0].children[0] : null);
            if (longDesc === undefined) return $doc ? $doc.longDesc() : null;
            if (longDesc === null) {
                if ($doc) $doc.longDesc(longDesc);
                removeIfEmpty();
            } else {
                if (!$doc) $doc = createDoc();
                $doc.longDesc(longDesc);
            }

            return self;
        };

        self.getAnnotations = function () {
            if (!self.children[0]) return [];
            return self.children[0].children[0].getAnnotations();
        };

        self.findAnnotationsByName = function (name) {
            if (!self.children[0]) return [];
            return self.children[0].children[0].findAnnotationsByName(name);
        };

        self.insertAnnotation = function ($docAnnotation, $previousNode) {
            let $doc = (self.children[0] ? self.children[0].children[0] : null);
            if (!$doc) $doc = createDoc();
            $doc.insertAnnotation($docAnnotation, $previousNode);
            return self;
        };

        self.removeAnnotation = function ($docAnnotation) {
            let $doc = (self.children[0] ? self.children[0].children[0] : null);
            if ($doc) {
                $doc.removeAnnotation($docAnnotation);
                removeIfEmpty();
            }
            return self;
        };
    };
};
