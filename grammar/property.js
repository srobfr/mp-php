const _ = require("lodash");
const {multiple, not, optional, optmul, or} = require("microparser").grammarHelpers;

module.exports = function(g) {
    g.propertyMarkerBlock = [
        or(g.visibility, g.abstract, g.static),
        g.w
    ];
    g.propertyMarkers = optmul(g.propertyMarkerBlock);
    g.propertyMarkers.order = [g.abstract, g.static, g.visibility];
    g.propertyMarkers.buildNode = function (self) {
        self.visibility = function (visibility) {
            let $visibility = self.findOneByGrammar(g.visibility);
            if (visibility === undefined) return $visibility ? $visibility.text() : null;
            if (visibility === null) {
                if ($visibility) $visibility.parent.parent.remove();
            } else {
                if (!$visibility) {
                    const $propertyMarkerBlock = self.parser.parse(g.propertyMarkerBlock, `${visibility} `);
                    self.insert($propertyMarkerBlock);
                } else {
                    $visibility.text(visibility);
                }
            }

            return self;
        };

        function buildMarkerHandler(marker) {
            return function (value) {
                let $marker = self.findOneByGrammar(g[marker]);
                if (value === undefined) return !!$marker;
                if (!value) {
                    if ($marker) $marker.parent.parent.remove();
                } else if (!$marker) {
                    const $propertyMarkerBlock = self.parser.parse(g.propertyMarkerBlock, `${marker} `);
                    self.insert($propertyMarkerBlock);
                }

                return self;
            };
        }

        self.abstract = buildMarkerHandler("abstract");
        self.static = buildMarkerHandler("static");
    };

    g.property = [g.optDoc, g.propertyMarkers, g.variable, g.optDefaultValue, g.ow, g.semicolon];
    g.property.default = "$todo;";
    g.property.buildNode = function(self) {
        function proxy(methodName, target) {
            self[methodName] = function() {
                const r = target()[methodName].apply(this, arguments);
                return (arguments[0] === undefined ? r : self);
            };
        }

        function proxyGet(methodName, target) {
            self[methodName] = function () {
                return target()[methodName].apply(this, arguments);
            };
        }

        function proxySet(methodName, target) {
            self[methodName] = function () {
                target()[methodName].apply(this, arguments);
                return self;
            };
        }

        proxy("desc", () => self.children[0]);
        proxy("longDesc", () => self.children[0]);
        proxyGet("getAnnotations", () => self.children[0]);
        proxyGet("findAnnotationByName", () => self.children[0]);
        proxySet("insertAnnotation", () => self.children[0]);
        proxySet("removeAnnotation", () => self.children[0]);

        proxy("visibility", () => self.children[1]);
        proxy("abstract", () => self.children[1]);
        proxy("static", () => self.children[1]);

        proxy("name", () => self.children[2]);
        proxy("value", () => self.children[3]);
    };
};
