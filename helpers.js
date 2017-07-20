function descHelper(g, $node, desc) {
    const $optDoc = $node.findOne(g.optDoc);
    if (desc === undefined) return ($optDoc.children.length > 0 ? $optDoc.findOne(g.docDesc).text() : null);
    if (desc === null) $optDoc.text("");
    else $optDoc.getOrCreateChild().findOne(g.doc).desc(desc);
    return $node;
}

function longDescHelper(g, $node, longDesc) {
    const $optDoc = $node.findOne(g.optDoc);
    if (longDesc === undefined) return ($optDoc.children.length > 0 ? $optDoc.findOne(g.docLongDesc).text() : null);

    if (longDesc === null) {
        if ($optDoc.children.length > 0) $optDoc.findOne(g.doc).longDesc(longDesc);
    } else {
        $optDoc.getOrCreateChild().findOne(g.doc).longDesc(longDesc);
    }
    return $node;
}

module.exports = {descHelper, longDescHelper};
