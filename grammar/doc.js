const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function (g) {
    g.docStart = ["/**", /^[ \t]*/];
    g.docStart.default = "/**";

    g.mulDocNL = /^((?: *(?:\n|\r|\r\n)+)[ \t]*\*(?!\/) ?)+/;
    g.mulDocNL.default = ($node) => `\n${$node.getIndent()} * `;

    g.docEnd = /^(?:\n|\r|\r\n)?[ \t]*\*\//;
    g.docEnd.default = ($node) => `\n${$node.getIndent()} */`;

    // Annotations
    g.docAnnotationIdent = ["@", g.fqn];

    g.docLine = /^(.(?!(?:\n|\r|\*\/)))*./; // Everything up to \n, \r ou "*/"
    g.notAnnotationDocLine = [not(g.docAnnotationIdent), g.docLine];

    g.docAnnotationValue = optmul(g.notAnnotationDocLine, g.mulDocNL);
    g.docAnnotation = [g.docAnnotationIdent, g.docAnnotationValue];

    // Description (first line)
    g.docDesc = optional(g.notAnnotationDocLine);
    g.docDesc.default = "TODO";

    // Long description (2nd to n-th line)
    g.docLongDesc = optmul(g.notAnnotationDocLine, g.mulDocNL);
    g.docLongDesc.default = "";

    // Full doc
    g.optMulDocNL1 = optional(g.mulDocNL);
    g.optMulDocNL1.default = "\n * ";
    g.optMulDocNL1.decorator = function ($optMulDocNL1) {
        $optMulDocNL1.fix = function() {
            $optMulDocNL1.text($optMulDocNL1.next.text() === "" ? "" : "\n * ");
        };
    };

    g.optMulDocNL2 = optional(g.mulDocNL);
    g.optMulDocNL2.default = "";
    g.optMulDocNL2.decorator = function ($optMulDocNL2) {
        $optMulDocNL2.fix = function() {
            if ($optMulDocNL2.prev.text() === "" || $optMulDocNL2.next.text() === "") $optMulDocNL2.text("");
            else $optMulDocNL2.text("\n *\n * ");
        };
    };

    g.optMulDocNL3 = optional(g.mulDocNL);
    g.optMulDocNL3.default = "";

    g.docAnnotationsSeparator = [g.mulDocNL];
    g.docAnnotationsSeparator.decorator = function($annotationsSeparator) {
        $annotationsSeparator.fix = function() {
            let prevAnnotationIdent = $annotationsSeparator.prev.findOne(g.docAnnotationIdent).text();
            let nextAnnotationIdent = $annotationsSeparator.next.findOne(g.docAnnotationIdent).text();
            if (prevAnnotationIdent.match(/^@[a-z]+$/) || nextAnnotationIdent.match(/^@[a-z]+$/)) {
                let indent = $annotationsSeparator.getIndent();
                let text = `\n${indent} * `;
                if (prevAnnotationIdent !== nextAnnotationIdent) text = `\n${indent} *${text}`;
                $annotationsSeparator.text(text);
            }
        };
    };

    g.docAnnotations = optmul(g.docAnnotation, g.docAnnotationsSeparator);
    g.docAnnotations.order = [
        ($node) => $node.findOne(g.docAnnotationIdent).text(),
        ($node) => {
            if ($node.findOne(g.docAnnotationIdent).text() !== "@param") return 0;
            return 0; // TODO Corriger l'ordre d'insertion des @param en fonction de l'ordre des arguments de la méthode
        }
    ];

    g.doc = [
        g.docStart, g.optMulDocNL1,
        g.docDesc, g.optMulDocNL2,
        g.docLongDesc, g.optMulDocNL2,
        g.docAnnotations, g.optMulDocNL3,
        g.docEnd
    ];
    g.doc.default = ($node) => {
        const indent = $node.getIndent();
        return `/**\n${indent} * TODO\n${indent} */`
    };
    g.doc.decorator = function ($doc) {
        $doc.desc = (desc) => {
            const $docDesc = $doc.findOne(g.docDesc);
            if (desc === undefined) return $docDesc.text();

            $docDesc.text(desc || "");
            $doc.fix();
        };
        $doc.longDesc = (longDesc) => {
            const $docLongDesc = $doc.findOne(g.docLongDesc);
            if (longDesc === undefined) return $docLongDesc.text();

            const indent = $doc.getIndent();

            if (longDesc === null) $docLongDesc.text("");
            else $docLongDesc.text(longDesc.replace(/\n/g, `\n${indent} * `).replace(/ +(\n|$)/g, "\n").trim());
            $doc.fix();
        };
        $doc.fix = function() {
            const indent = $doc.getIndent();
            const hasDesc = ($doc.findOne(g.docDesc).text().trim() !== "");
            const hasLongDesc = ($doc.findOne(g.docLongDesc).text().trim() !== "");

            const $docAnnotations = $doc.findOne(g.docAnnotations);
            const hasAnnotations = ($docAnnotations.text().trim() !== "");

            if (!hasDesc && !hasLongDesc && !hasAnnotations) $doc.text(`/**\n${indent} *\n${indent} */`);
            else {
                $doc.children[0].text("/**");
                $doc.children[1].text(`\n${indent} * `);
                $doc.children[3].text(hasLongDesc ? `\n${indent} *\n${indent} * ` : "");
                $doc.children[5].text((hasDesc || hasLongDesc) && hasAnnotations ? `\n${indent} *\n${indent} * ` : "");
                $doc.children[7].text("");
                $doc.children[8].text(`\n${indent} */`);

                _.each($docAnnotations.find(g.docAnnotationsSeparator), $docAnnotationsSeparator => $docAnnotationsSeparator.fix());
            }
        };
        $doc.removeAnnotation = function($annotation) {
            const $docAnnotations = $doc.findOne(g.docAnnotations);
            $docAnnotations.remove($annotation);
            $doc.fix();
        };
        $doc.removeParamAnnotation = function(name) {
            const $docAnnotations = $doc.findOne(g.docAnnotations);
            const $annotation = $docAnnotations.findOne(($node) => {
                if ($node.grammar !== g.docAnnotation || $node.findOne(g.docAnnotationIdent).text() !== "@param") return false;
                if ($node.findOne(g.docAnnotationValue).text().match(new RegExp("\\$" + name + "($|[^\w])"))) return true;
            });
            if ($annotation) $docAnnotations.remove($annotation);
            $doc.fix();
        };
    };

    g.optDoc = optional([g.doc, g.owDefaultNextLine]);
};
