const _ = require("lodash");
const assert = require('assert');
const Parser = require("microparser").Parser;
const g = require(__dirname + "/../index.js").grammar;

const parser = new Parser();

const namesByGrammar = new Map();
_.each(g, (v, k) => {
    namesByGrammar.set(v, k);
});

describe('Grammar', function () {
    describe('dataset', function () {
        const dataset = [
            {
                grammar: g.fqn,
                success: ["foo", "Foo", "Foo\\Bar\\Plop", "\\Foo\\Bar"],
                fail: ["", "4Foo"]
            },
            {
                grammar: g.docAnnotationIdent,
                success: ["@var", "@Foo"],
                fail: ["", "@3plop", "@"]
            },
            {
                grammar: g.docDesc,
                success: ["Foo Bar", ""],
                fail: ["Foo bar\nPlop", "Foo bar \n * Plop", "@annotation Foo plop"]
            },
            {
                grammar: g.docLongDesc,
                success: ["Foo Bar", "", "Foo bar \n * Plop"],
                fail: ["Foo bar\nPlop", "@annotation Foo plop", "Test\n * @foo"]
            },
            {
                grammar: g.docAnnotation,
                success: ["@foo", "@var plop", `@Foo(plop=2)`, `@foo bar \n * plop\n * test`],
                fail: ["Foo bar\nPlop", `@foo bar \n * plop\n test`]
            },
            {
                grammar: g.doc,
                success: [
                    `/** @var Foo */`,
                    `/**
 * Test
 */`,
                    `/**
         * Test
                    *
         * @Foo
     * @Bar
         */`,
                ],
                fail: [`/**/`, `/**\n\n*/`, `/* test */`]
            },
            {
                grammar: g.constant,
                success: [
                    `const FOO = 42;`,
                    `const FOO = FALSE;`,
                    `const FOO = false;`,
                    `const FOO = Test::PLOP;`,
                    `/** Test */const FOO = 42;`,
                    `/** Test */
                     const FOO = 42;`,
                    `/** 
                      * Foo bar
                      *
                      * @var integer
                      */
                     const FOO = 42;`,
                    `const FOO=MEH;`,
                ],
                fail: [`const FOO;`]
            },
            {
                grammar: g.property,
                success: [
                    `$foo;`,
                    `private $foo;`,
                    `public $foo = 4;`,
                    `$foo=MEH;`,
                    `/** Test */public $foo = 4;`,
                ],
                fail: [`$foo`]
            },
            {
                grammar: g.method,
                success: [
                    `function foo();`,
                    `/** @test */function foo();`,
                    `function foo($a);`,
                    `public abstract function foo($a);`,
                    `/** @test */static final protected abstract function foo($a) {\n}`,
                    `function foo($a=1);`,
                    `function foo(Foo $a);`,
                    `function foo(Foo &$a);`,
                    `function foo(Foo $a = 3, $b);`,
                    `function foo(){}`,
                    `function foo ($test) {
                    // Test
                    $a = 1; /* TODO */
                    /** Foo */
}`,
                ],
                fail: [`function foo {}`, `function foo($a $b, $c);`]
            },
            {
                grammar: g.namespace,
                success: [
                    `namespace foo;`,
                    `namespace Foo\\Bar;`,
                ],
                fail: [`namespace foo`, `namespace;`]
            },
            {
                grammar: g.use,
                success: [`use foo;`, `use Foo\\Bar;`, `use Foo\\Bar as Foo;`],
                fail: [`use foo`, `use foo as 42;`]
            },
            {
                grammar: g.class,
                success: [
                    `class Foo {}`,
                    `/** Test */class Foo {}`,
                    `/** Test */abstract final class Foo {}`,
                    `interface Foo {}`,
                    `interface Foo extends Foo\\Bar {}`,
                    `class Foo implements Foo\\Bar, 
                    Test extends Meh 
{}`,
                    `class Foo {
    const FOO=3;
    use My\\Trait;

    /* Comment block */
    // Commentaire
    /** PhpDoc */
    private $foo;    
    /** test */
    public function setFoo($foo) {
        $this->foo = $foo;
    }
}`,
                ],
                fail: [
                    `/* Foo */class Foo;`,
                    `private class Foo {}`,
                    `class Foo\\Bar {}`,
                ]
            },
            {
                grammar: g.file,
                success: [
                    `<?php class Foo {}`,
                    `<?php /** Test */class Foo {} ?>`,
                    `<?php
namespace Foo\\Bar;

use Test\Foo as Plop;

/**
 * Foo Bar.
 */
class Foo {
    const FOO=3;
    use My\\Trait;

    /* Comment block */
    // Commentaire
    /** PhpDoc */
    private $foo;    
    /** test */
    public function setFoo($foo) {
        $this->foo = $foo;
    }
}
`,
                ],
                fail: [
                    ``,
                    `<?php foo();`,
                    `<?php`,
                ]
            },
        ];

        _.each(dataset, (set) => {
            const grammarName = namesByGrammar.get(set.grammar);
            if (!grammarName) console.log(require("util").inspect(set.success[0], {
                colors: true,
                hidden: true,
                depth: 30
            })); // TODO Dev
            describe(grammarName, function () {
                _.each(set.success, (code) => {
                    it("Should parse " + require("util").inspect(code.substr(0, 30), {depth: 30}), () => {
                        parser.parse(set.grammar, code);
                    });
                });

                _.each(set.fail, (code) => {
                    it("Should fail parsing " + require("util").inspect(code.substr(0, 30), {depth: 30}), () => {
                        assert.throws(() => {
                                parser.parse(set.grammar, code);
                            },
                            (e) => {
                                console.log(e.message + "\n\n");
                                return true;
                            });
                    });
                });
            });
        });
    });
});
