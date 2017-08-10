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
    g.docSeparator = optional(g.docLineStartBlock);
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
            const newText = text.split(/\n/)
                .map((l, i) => (l.trim() === "" ? "" : (i === 0 ? "" : " ") + l))
                .join(`\n *`);
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
            if (desc === undefined) return $docLineContent.text().trim() || null;
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
            $docContentUntilNextAnnotationOrEnd.textWithoutLineStarts(" " + longDesc.trim());
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
            if (value === undefined) return $docAnnotationValue ? $docAnnotationValue.textWithoutLineStarts() : null;
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
    g.docAnnotation.default = "@todo";
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
    g.docAnnotations.buildNode = function (self) {
        self.getAnnotations = () => self.findByGrammar(g.docAnnotation);
        self.findAnnotationsByName = (name) => self.getAnnotations().filter(($docAnnotation) => $docAnnotation.name() === name);
        self.insertAnnotation = function ($docAnnotation, $previousNode) {
            // Wrap in a docAnnotationBlock
            const $docAnnotationBlock = self.parser.parse(g.docAnnotationBlock);
            $docAnnotationBlock.children[1].replaceWith($docAnnotation);
            self.insert($docAnnotationBlock, $previousNode);

            // Fix separators
            if ($docAnnotationBlock.prev && $docAnnotationBlock.prev.children[1].name() === $docAnnotation.name()) $docAnnotationBlock.children[0].text("\n *");
            else $docAnnotationBlock.children[0].text("\n *\n *");

            if ($docAnnotationBlock.next) {
                const name = $docAnnotationBlock.next.children[1].name();
                $docAnnotationBlock.next.children[0].text(name === $docAnnotation.name() ? "\n *" : "\n *\n *");
            }

            return self;
        };
        self.removeAnnotation = function ($docAnnotation) {
            const $docAnnotationBlock = $docAnnotation.parent;
            $docAnnotationBlock.remove();

            // Fix separators
            if ($docAnnotationBlock.next) {
                const name = $docAnnotationBlock.next.children[1].name();
                $docAnnotationBlock.next.children[0].text(name === ($docAnnotationBlock.prev ? $docAnnotationBlock.prev.children[1].name() : null) ? "\n *" : "\n *\n *");
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
                $docLineStartBlock.text(`\n *`);
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

        self.getAnnotations = () => self.children[3].getAnnotations();
        self.findAnnotationsByName = (name) => self.children[3].findAnnotationsByName(name);
        self.insertAnnotation = function ($docAnnotation, $previousNode) {
            const $docAnnotations = self.children[3];
            $docAnnotations.insertAnnotation($docAnnotation, $previousNode);

            if (self.children[1].children.length === 0 && self.children[2].children.length === 0) {
                // No desc or longDesc
                $docAnnotations.children[0].children[0].text("\n *");
            }

            fixFirstNonEmptyNodeSeparator($docAnnotations);
            return self;
        };
        self.removeAnnotation = function ($docAnnotation) {
            const $docAnnotations = self.children[3];
            $docAnnotations.removeAnnotation($docAnnotation);
            fixFirstNonEmptyNodeSeparator($docAnnotations);
            return self;
        };
    };

    // doc
    g.doc = or(g.docMonoline, g.docMultiline);
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

        self.indent = function (indent) {
            if (indent === undefined) return self.children[0].indent();
            self.children[0].indent(indent);
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
        self.desc = function (desc) {
            let $doc = (self.children[0] ? self.children[0].children[0] : null);
            if (desc === undefined) return $doc ? $doc.desc() : null;
            if (desc === null) {
                if ($doc) $doc.desc(desc);
            } else {
                if (!$doc) {
                    self.text(`/**\n *\n */\n`);
                    $doc = self.children[0].children[0];
                }

                $doc.desc(desc);
            }

            return self;
        };

        self.longDesc = function (longDesc) {
            let $doc = (self.children[0] ? self.children[0].children[0] : null);
            if (longDesc === undefined) return $doc ? $doc.longDesc() : null;
            if (longDesc === null) {
                if ($doc) $doc.longDesc(longDesc);
            } else {
                if (!$doc) {
                    self.text(`/**\n *\n */\n`);
                    $doc = self.children[0].children[0];
                }

                $doc.longDesc(longDesc);
            }

            return self;
        };

        self.getAnnotations = function () {
            if (!self.children[0]) return [];
            return self.children[0].children[0].getAnnotations();
        };

        self.insertAnnotation = function ($docAnnotation, $previousNode) {
            let $doc = (self.children[0] ? self.children[0].children[0] : null);
            if (!$doc) {
                self.text(`/**\n *\n */\n`);
                $doc = self.children[0].children[0];
            }
            $doc.insertAnnotation($docAnnotation, $previousNode);
            return self;
        };
    };
};
