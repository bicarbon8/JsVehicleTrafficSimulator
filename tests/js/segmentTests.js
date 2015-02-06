var ST = {
    spacing: 1,
    testVehicles: [],
    setup: function () {

    },
    teardown: function () {

    }
};
QUnit.module("segment", {
    setup: ST.setup,
    teardown: ST.teardown
});
var cases = [
    { sx: 0, sy: 0, sz: 0, ex: 5, ey: 0, ez: 0, expected: 4 },
    { sx: 0, sy: 0, sz: 0, ex: 10, ey: 0, ez: 0, expected: 9 },
    { sx: 0, sy: 0, sz: 0, ex: 100, ey: 0, ez: 0, expected: 99 },
    { sx: 0, sy: 0, sz: 0, ex: 11, ey: 0, ez: 0, expected: 10 },
    { sx: 0, sy: 0, sz: 0, ex: 20, ey: 0, ez: 0, expected: 19 },
    { sx: 0, sy: 0, sz: 0, ex: 21, ey: 0, ez: 0, expected: 20 },
];
/*jshint loopfunc:true*/
for (var i=0; i<cases.length; i++) {
    (function (p) {
        QUnit.test("segment should generate change lane points every 10 units: " + JSON.stringify(p), function (assert) {
            var segment = new JSVTS.Segment({ start: new THREE.Vector3(p.sx, p.sy, p.sz), end: new THREE.Vector3(p.ex, p.ey, p.ez) });
            assert.ok(segment.laneChangePoints.length === p.expected, "expected: "+p.expected+", but was: "+segment.laneChangePoints.length);
        });
    })(cases[i]);
}
QUnit.test("change lane points should follow the segment in x direction", function (assert) {
    var segment = new JSVTS.Segment({ start: new THREE.Vector3(), end: new THREE.Vector3(100, 0, 0) });
    for (var i=0; i<segment.laneChangePoints.length; i++){
        assert.ok(segment.laneChangePoints[i].x === (i*ST.spacing)+ST.spacing, "expected point.x at: "+((i*ST.spacing)+ST.spacing)+", but was: "+segment.laneChangePoints[i].x);
        assert.ok(segment.laneChangePoints[i].y === 0, "expected point.y at: "+0+", but was: "+segment.laneChangePoints[i].y);
        assert.ok(Math.abs(segment.laneChangePoints[i].z) < 0.01, "expected point.z close to: "+0+", but was: "+segment.laneChangePoints[i].z);
    }
});
QUnit.test("change lane points should follow the segment in z direction", function (assert) {
    var segment = new JSVTS.Segment({ start: new THREE.Vector3(), end: new THREE.Vector3(0, 0, 100) });
    for (var i=0; i<segment.laneChangePoints.length; i++){
        assert.ok(segment.laneChangePoints[i].z === (i*ST.spacing)+ST.spacing, "expected point.z at: "+((i*ST.spacing)+ST.spacing)+", but was: "+segment.laneChangePoints[i].z);
        assert.ok(segment.laneChangePoints[i].y === 0, "expected point.y at: "+0+", but was: "+segment.laneChangePoints[i].y);
        assert.ok(Math.abs(segment.laneChangePoints[i].x) < 0.01, "expected point.x close to: "+0+", but was: "+segment.laneChangePoints[i].x);
    }
});
QUnit.test("change lane points should follow the segment in y direction", function (assert) {
    var segment = new JSVTS.Segment({ start: new THREE.Vector3(), end: new THREE.Vector3(0, 100, 0) });
    for (var i=0; i<segment.laneChangePoints.length; i++){
        assert.ok(segment.laneChangePoints[i].y === (i*ST.spacing)+ST.spacing, "expected point.y at: "+((i*ST.spacing)+ST.spacing)+", but was: "+segment.laneChangePoints[i].y);
        assert.ok(Math.abs(segment.laneChangePoints[i].x) < 0.01, "expected point.x close to: "+0+", but was: "+segment.laneChangePoints[i].x);
        assert.ok(Math.abs(segment.laneChangePoints[i].z) < 0.01, "expected point.z close to: "+0+", but was: "+segment.laneChangePoints[i].z);
    }
});
