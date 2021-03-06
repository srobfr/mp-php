const _ = require("lodash");

module.exports = function (g, helpers) {
    const {
        extendBuildNodeFunc,
        callIfDefined,
        getName,
        isToDelete
    } = helpers;

    extendBuildNodeFunc(g.implementsValue, function (self) {
        self.setModel = function (model) {
            callIfDefined(getName(model), self.name);
        };

        self.getModel = function () {
            return {
                name: self.name(),
            };
        };
    });

    extendBuildNodeFunc(g.classUse, function (self) {
        self.setModel = function (model) {
            callIfDefined(model.fqn, self.fqn);
        };

        self.getModel = function () {
            return {
                fqn: self.fqn(),
            };
        };
    });

    extendBuildNodeFunc(g.class, function (self) {
        self.setModel = function (model) {
            callIfDefined(model.desc, self.desc);
            callIfDefined(model.longDesc, self.longDesc);

            if (model.annotations !== undefined) {
                const $annotations = self.getAnnotations();
                model.annotations.forEach(annotation => {
                    let $annotation = _.find($annotations, $annotation => $annotation.name() === getName(annotation));
                    if (isToDelete(annotation)) {
                        if ($annotation) self.removeAnnotation($annotation);
                    } else {
                        const create = (!$annotation);
                        if (create) $annotation = self.parser.parse(g.docAnnotation);
                        $annotation.setModel(annotation);
                        if (create) self.insertAnnotation($annotation);
                    }
                });
            }

            callIfDefined(model.final, self.final);

            callIfDefined(model.kind, self.kind);
            callIfDefined(model.name, self.name);
            callIfDefined(model.extends, self.extends);

            if (model.properties !== undefined) {
                const $properties = self.getProperties();
                model.properties.forEach(property => {
                    const propertyName = getName(property);
                    const isInterface = (self.kind() === "interface");

                    if (!isInterface) {
                        let $property = _.find($properties, $property => $property.name() === propertyName);
                        if (!$property && property.was) $property = _.find($properties, $property => $property.name() === property.was);

                        if (isToDelete(property)) {
                            if ($property) self.removeProperty($property);
                        } else {
                            const create = (!$property);
                            if (create) {
                                $property = self.parser.parse(g.property);
                                $property.parent = self.findOneByGrammar(g.classBodyItems);
                            }
                            $property.setModel(property);
                            if (create) self.insertProperty($property);
                        }
                    }

                    if (property.getter) {
                        model.methods = model.methods || [];
                        const prefix = (property.type||'').match(/^bool(ean)?$/) ? 'is' : 'get';
                        model.methods.push({
                            name: prefix + _.upperFirst(propertyName),
                            desc: `Returns the \$${propertyName} property value.`,
                            body: `return \$this->${propertyName};`,
                            type: property.type
                        });
                    }

                    if (property.setter) {
                        model.methods = model.methods || [];
                        model.methods.push({
                            name: `set${_.upperFirst(propertyName)}`,
                            desc: `Affects the \$${propertyName} property value.`,
                            args: [property],
                            type: self.name(),
                            body: `\$this->${propertyName} = \$${propertyName};\n\nreturn \$this;`,
                        });
                    }

                    if (property.construct) {
                        model.methods = model.methods || [];
                        let construct = _.find(model.methods, (m => m.name === "__construct"));
                        if (!construct) {
                            construct = {
                                name: "__construct",
                            };
                            model.methods.push(construct);
                        }

                        construct.args = construct.args || [];
                        construct.args.push(property);

                        const $construct = self.findOneMethodByName("__construct");
                        let constructBody = construct.body || ($construct ? $construct.body() : "");
                        if (!constructBody.match(new RegExp(`\\$this->${propertyName} *= *`))) {
                            constructBody = `${constructBody}\n\$this->${propertyName} = \$${propertyName};`.trim();
                            construct.body = constructBody;
                        }
                        if (!$construct) construct.desc = "Constructor.";
                    }
                });
            }

            if (model.implements !== undefined) {
                const $implementsValues = self.getImplementsValues();
                model.implements.forEach(implement => {
                    let $implementsValue = _.find($implementsValues, $implementsValue => $implementsValue.name() === getName(implement));
                    if (isToDelete(implement)) {
                        if ($implementsValue) self.removeImplementsValue($implementsValue);
                    } else {
                        const create = (!$implementsValue);
                        if (create) $implementsValue = self.parser.parse(g.implementsValue);
                        $implementsValue.setModel(implement);
                        if (create) self.insertImplementsValue($implementsValue);
                    }
                });
            }

            if (model.uses !== undefined) {
                const $classUses = self.getUses();
                model.uses.forEach(use => {
                    let $classUse = _.find($classUses, $classUse => $classUse.fqn() === use.fqn);
                    if (isToDelete(use)) {
                        if ($classUse) self.removeUse($classUse);
                    } else {
                        const create = (!$classUse);
                        if (create) $classUse = self.parser.parse(g.classUse);
                        $classUse.parent = self.findOneByGrammar(g.classBodyItems);
                        $classUse.setModel(use);
                        if (create) self.insertUse($classUse);
                    }
                });
            }

            if (model.constants !== undefined) {
                const $constants = self.getConstants();
                model.constants.forEach(constant => {
                    let $constant = _.find($constants, $constant => $constant.name() === getName(constant));
                    if (isToDelete(constant)) {
                        if ($constant) self.removeConstant($constant);
                    } else {
                        const create = (!$constant);
                        if (create) $constant = self.parser.parse(g.constant);
                        $constant.parent = self.findOneByGrammar(g.classBodyItems);
                        $constant.setModel(constant);
                        if (create) self.insertConstant($constant);
                    }
                });
            }

            if (model.methods !== undefined) {
                const isInterface = (self.kind() === "interface");
                model.methods.forEach(method => {
                    if (method.abstract) model.abstract = true;

                    let $method = self.findOneMethodByName(getName(method));
                    if (!$method && method.was) $method = self.findOneMethodByName(method.was);

                    if (isToDelete(method)) {
                        if ($method) self.removeMethod($method);
                    } else {
                        const create = (!$method);
                        if (create) $method = self.parser.parse(g.method);
                        $method.parent = self.findOneByGrammar(g.classBodyItems);
                        $method.setModel(method);
                        if (isInterface) $method.body(null);
                        if (create) self.insertMethod($method);
                    }
                });
            }

            callIfDefined(model.abstract, self.abstract);
        };

        self.getModel = function () {
            return {
                desc: self.desc(),
                longDesc: self.longDesc(),
                annotations: self.getAnnotations().map($docAnnotation => $docAnnotation.getModel()),
                abstract: self.abstract(),
                final: self.final(),
                kind: self.kind(),
                name: self.name(),
                extends: self.extends(),
                properties: self.getProperties().map($property => $property.getModel()),
                implements: self.getImplementsValues().map($implementsValue => $implementsValue.getModel()),
                uses: self.getUses().map($classUse => $classUse.getModel()),
                constants: self.getConstants().map($constant => $constant.getModel()),
                methods: self.getMethods().map($method => $method.getModel()),
            };
        };
    });
};
