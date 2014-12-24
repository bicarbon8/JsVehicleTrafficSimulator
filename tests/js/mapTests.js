var MT = {
    setup: function () {
        JSVTS.Plotter.initScene();
    },
    teardown: function () {
        JSVTS.Map.reset();
    }
};
QUnit.module("map", {
    setup: MT.setup,
    teardown: MT.teardown
});
QUnit.test("can add a movable to the map", function (assert) {
    var v = new JSVTS.Vehicle();
    assert.equal(JSVTS.Map.getMovables().length, 0);
    JSVTS.Map.addMovable(v);
    assert.equal(JSVTS.Map.getMovables().length, 1);
    assert.deepEqual(JSVTS.Map.getMovables()[0], v);
});
QUnit.test("can remove a movable from the map", function (assert) {
    var v = new JSVTS.Vehicle();
    JSVTS.Map.addMovable(v);
    assert.equal(JSVTS.Map.getMovables().length, 1);
    JSVTS.Map.removeMovable(v);
    assert.equal(JSVTS.Map.getMovables().length, 0);
});