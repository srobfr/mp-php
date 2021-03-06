describe('All tests', function () {
    describe('Base grammar', function () {
        require(__dirname + "/grammar/classTest.js");
        require(__dirname + "/grammar/constantTest.js");
        require(__dirname + "/grammar/docTest.js");
        require(__dirname + "/grammar/fileTest.js");
        require(__dirname + "/grammar/methodTest.js");
        require(__dirname + "/grammar/propertyTest.js");
    });

    describe('Model', function () {
        require(__dirname + "/model/constantTest.js");
        require(__dirname + "/model/propertyTest.js");
        require(__dirname + "/model/methodTest.js");
        require(__dirname + "/model/docTest.js");
        require(__dirname + "/model/classTest.js");
        require(__dirname + "/model/fileTest.js");
    });
});
