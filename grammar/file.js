const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    g.namespace = ["namespace", g.w, g.fqn, g.ow, g.semicolon];
    g.namespace.default = "namespace TODO;";
    g.namespace.tag = "namespace";

    g.require = [/^(?:require|include)(?:_once)?/, g.ow, (/^[^;]+/), g.semicolon];

    g.useAliasBlock = [g.w, "as", g.w, g.ident];
    g.use = [
        g.optDoc,
        "use", g.w,
        g.fqn,
        optional(g.useAliasBlock),
        g.ow, g.semicolon
    ];
    g.use.default = "use TODO;";
    g.use.buildNode = function (self) {
        self.fqn = function (fqn) {
            const $fqn = self.children[3];
            const r = $fqn.text(fqn);
            return (fqn === undefined ? r : self);
        };
        self.alias = function (alias) {
            let $optAliasBlock = self.children[4];
            let $aliasBlock = $optAliasBlock.children[0];
            if (alias === undefined) return $aliasBlock ? $aliasBlock.findOneByGrammar(g.ident).text() : null;
            if (alias === null) {
                $optAliasBlock.empty();
            } else {
                if ($optAliasBlock.children.length === 0) {
                    $optAliasBlock.text(` as ${alias}`);
                } else {
                    $aliasBlock.findOneByGrammar(g.ident).text(alias);
                }
            }

            return self;
        };
    };

    g.fileItemsSeparator = [g.wOrComments];
    g.fileItemsSeparator.default = `\n\n`;

    g.fileDoc = [g.doc];

    g.fileItem = or(
        g.require,
        g.namespace,
        g.use,
        g.class,
        g.fileDoc
    );

    g.fileItem.default = "namespace Todo;";

    g.fileItems = optmul(
        g.fileItem,
        g.fileItemsSeparator
    );
    g.fileItems.order = [
        g.fileDoc,
        g.namespace,
        g.use,
        g.require,
        g.class,
        ($node) => $node.text()
    ];
    g.fileItems.buildNode = function (self) {
        function insertItem($item, $previousNode) {
            const $classBodyItem = self.parser.parse(g.classBodyItem);
            $classBodyItem.children[0].replaceWith($item);
            self.insert($classBodyItem, $previousNode);

            // Fix separators
            if ($classBodyItem.prev && $classBodyItem.prev.prev.grammar === $classBodyItem.grammar) {
                $classBodyItem.prev.text(`\n`);
            }
            if ($classBodyItem.next && $classBodyItem.next.next.grammar === $classBodyItem.grammar) {
                $classBodyItem.next.text(`\n`);
            }

            return self;
        }

        function removeItem($item) {
            $item.parent.removeWithSeparator();
            return self;
        }

        self.namespace = function (namespace) {
            let $namespace = self.findOneByGrammar(g.namespace);
            if (namespace === undefined) return $namespace ? $namespace.findOneByGrammar(g.fqn).text() : null;
            if (namespace === null) {
                if ($namespace) $namespace.parent.removeWithSeparator();
            } else {
                if (!$namespace) {
                    const $namespaceItem = self.parser.parse(g.fileItem, g.namespace.default);
                    $namespace = $namespaceItem.children[0];
                    self.insert($namespaceItem);
                }

                $namespace.findOneByGrammar(g.fqn).text(namespace);
            }

            return self;
        };

        self.getUses = () => self.findByGrammar(g.use);
        self.class = function ($class) {
            const $existingClass = self.findOneByGrammar(g.class);
            if ($class === undefined) return $existingClass;
            if ($class === null) {
                if ($existingClass) $existingClass.removeWithSeparator();
            } else {
                insertItem($class);
            }

            return self;
        };

        self.insertUse = insertItem;
        self.removeUse = removeItem;
    };

    g.fileEnd = [g.ow, optional(["?>", g.ow])];
    g.fileEnd.default = "\n";

    g.file = [
        g.phpBlockStart, g.ow,
        g.fileItems, g.ow,
        g.fileEnd,
    ];
    g.file.default = `<?php\n\nclass TODO\n{\n\n}\n`;
    g.file.buildNode = function (self) {
        function proxyWithStartEndFix(methodName, target) {
            self[methodName] = function () {
                const $fileItems = self.children[2];
                const $firstItem = _.first($fileItems.children);
                const $lastItem = _.last($fileItems.children);
                const r = target()[methodName].apply(this, arguments);
                if (arguments[0] === undefined) return r;

                if ($fileItems.children.length) {
                    if ($firstItem !== _.first($fileItems.children)) $fileItems.prev.text(`\n\n`);
                } else {
                    $fileItems.prev.text(``);
                }

                if ($lastItem !== _.last($fileItems.children)) $fileItems.next.text(`\n`);
                return self;
            };
        }

        function proxyGet(methodName, target) {
            self[methodName] = function () {
                return target()[methodName].apply(this, arguments);
            };
        }

        proxyWithStartEndFix("namespace", () => self.children[2]);
        proxyGet("getUses", () => self.children[2]);
        proxyWithStartEndFix("insertUse", () => self.children[2]);
        proxyWithStartEndFix("removeUse", () => self.children[2]);

        proxyWithStartEndFix("class", () => self.children[2]);
    };
};
