function descHelper(g, $node, desc) {
    const $optDoc = $node.findOne(g.optDoc);
    if (desc === undefined) return ($optDoc.children.length > 0 ? $optDoc.findOne(g.docDesc).text() : null);
    if (desc === null) $optDoc.text("");
    else $optDoc.getOrCreateChild().findOne(g.doc).desc(g.desc);
    return $node;
}

module.exports = {descHelper};
