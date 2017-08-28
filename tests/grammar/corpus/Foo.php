<?php

namespace Foo\Bar;

/**
 * Classe foo.
 *
 * Cette classe est une classe de test pour le générateur disponible dans Devtools.
 * A noter :
 *     - Test foobar plop
 *     - Pas de service ici. C'est juste une classe, de base.
 *     - La description longue peut s'étendre sur plusieurs lignes.
 *
 * @author Simon Robert <simon.r@allopneus.com>
 *
 * @deprecated Expérimental, ne pas utiliser.
 */
class Foo
{
    /**
     * Propriété $foo.
     */
    private $foo;

    /**
     * Affecte la valeur null à la propriété $foo.
     */
    public function nullifyFooProperty()
    {
        $this->foo = null;
    }
}
