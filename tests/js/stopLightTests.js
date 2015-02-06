var SL = {
    setup: function () {

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
var cases = [
    { changeSeconds: 10, yellowDuration: 4, startState: 0 }, // GREEN
    { changeSeconds: 50, yellowDuration: 50, startState: 1 }, // YELLOW
    { changeSeconds: 1, yellowDuration: 4, startState: 2 }, // RED
];
/*jshint loopfunc:true */
for (var i=0; i<cases.length; i++) {
    (function (p) {
        QUnit.test("changes state when expected: " + JSON.stringify(p), function (assert) {
            var sl = new JSVTS.StopLight({ greenDuration: p.changeSeconds, yellowDuration: p.yellowDuration, redDuration: p.changeSeconds, startState: p.startState });
            for (var i = 0; i < p.changeSeconds - 1; i++) {
                sl.update(1000);
                assert.strictEqual(sl.currentState, p.startState);
            }
            sl.update(999);
            assert.strictEqual(sl.currentState, p.startState);
            sl.update(1);
            assert.notStrictEqual(sl.currentState, p.startState);
        });
    })(cases[i]);
}
