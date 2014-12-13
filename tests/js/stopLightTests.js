var SL = {
    setup: function () {
        QUnit.stop();
        JSVTS.load([
            "http://cdnjs.cloudflare.com/ajax/libs/three.js/r69/three.js",
            "../js/helpers/utils.js",
            "../js/map.js",
            "../js/objects/movable.js",
            "../js/objects/renderable.js",
            "../js/objects/trafficFlowControl.js",
            "../js/objects/stopLight.js"
        ], function () {
            QUnit.start();
        });
    },
    teardown: function () {
        
    }
};
QUnit.module("stoplight", {
    setup: SL.setup,
    teardown: SL.teardown
});
QUnit.test("is an instance of TrafficFlowControl", function (assert) {
    var sl = new JSVTS.StopLight();
    assert.ok(sl instanceof JSVTS.StopLight);
    assert.ok(sl instanceof JSVTS.TrafficFlowControl);
    assert.ok(sl instanceof JSVTS.Renderable);
    assert.ok(sl instanceof JSVTS.Movable);
});
QUnit
.cases([
    { changeSeconds: 10, yellowDuration: 4, startState: 0 }, // GREEN
    { changeSeconds: 50, yellowDuration: 50, startState: 1 }, // YELLOW
    { changeSeconds: 1, yellowDuration: 4, startState: 2 }, // RED
])
.test("changes state when expected", function (p, assert) {
    var sl = new JSVTS.StopLight({ changeSeconds: p.changeSeconds, yellowDuration: p.yellowDuration, startState: p.startState });
    for (var i = 0; i < p.changeSeconds - 1; i++) {
        sl.update(1000);
        assert.strictEqual(sl.currentState, p.startState);
    }
    sl.update(999);
    assert.strictEqual(sl.currentState, p.startState);
    sl.update(1);
    assert.notStrictEqual(sl.currentState, p.startState);
});