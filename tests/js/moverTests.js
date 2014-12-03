var MT = {
    setup: function () {
        QUnit.stop();
        JSVTS.load([
            "http://cdnjs.cloudflare.com/ajax/libs/three.js/r69/three.js",
            "../js/objects/segment.js",
            "../js/objects/vehicle.js",
            "../js/map.js",
            "../js/mover.js",
            "../ext/helvetiker_regular.typeface.js"
        ], function () {
            QUnit.start();
        });
    },
    teardown: function () {
        JSVTS.Map.reset();
    }
};
QUnit.module("mover", {
    setup: MT.setup,
    teardown: MT.teardown
});
QUnit.cases([
        { s: [{sx:0,sy:0,sz:0,ex:10,ey:0,ez:0},{sx:10,sy:0,sz:0,ex:20,ey:0,ez:10},{sx:20,sy:0,sz:10,ex:20,ey:0,ez:30}], expected:45 },
        { s: [{sx:0,sy:0,sz:0,ex:10,ey:0,ez:0},{sx:10,sy:0,sz:0,ex:20,ey:0,ez:10},{sx:20,sy:0,sz:10,ex:30,ey:0,ez:10}], expected:45 },
        { s: [{sx:0,sy:0,sz:0,ex:5,ey:0,ez:0},{sx:5,sy:0,sz:0,ex:10,ey:0,ez:5},{sx:10,sy:0,sz:5,ex:5,ey:0,ez:10},{sx:5,sy:0,sz:10,ex:0,ey:0,ez:10}], expected:45 },
        { s: [{sx:0,sy:0,sz:0,ex:5,ey:0,ez:0},{sx:5,sy:0,sz:0,ex:10,ey:0,ez:5},{sx:10,sy:0,sz:5,ex:15,ey:0,ez:0},{sx:15,sy:0,sz:0,ex:20,ey:0,ez:0}], expected:45 },
    ]).test("heading difference should be the maximum of segments in range", function (p, assert) {
        var v;
        for (var i=0; i<p.s.length; i++) {
            var segPoints = p.s[i];
            var segment = new JSVTS.Segment({
                start: new THREE.Vector3(segPoints.sx, segPoints.sy, segPoints.sz),
                end: new THREE.Vector3(segPoints.ex, segPoints.ey, segPoints.ez),
                speedLimit: 100
            });
            JSVTS.Map.AddSegment(segment);
            if (i === 0) {
                v = new JSVTS.Vehicle();
                segment.attachVehicle(v);
                v.velocity = 100;
                JSVTS.Map.AddVehicle(v);
            }
        }
        var actual = JSVTS.Mover.shouldSlowForCorner(v, v.getLookAheadDistance());
        assert.ok(actual);
        assert.equal(actual.type, "cornering");
        assert.equal(Math.floor(actual.heading), p.expected);
    });
QUnit.cases([
        { s: [{sx:0,sy:0,sz:0,ex:100,ey:0,ez:0},{sx:100,sy:0,sz:0,ex:200,ey:0,ez:10},{sx:200,sy:0,sz:10,ex:200,ey:0,ez:30}] },
    ]).test("heading difference should be 0 when segments not in range", function (p, assert) {
        var v;
        for (var i=0; i<p.s.length; i++) {
            var segPoints = p.s[i];
            var segment = new JSVTS.Segment({
                start: new THREE.Vector3(segPoints.sx, segPoints.sy, segPoints.sz),
                end: new THREE.Vector3(segPoints.ex, segPoints.ey, segPoints.ez),
                speedLimit: 100
            });
            JSVTS.Map.AddSegment(segment);
            if (i === 0) {
                v = new JSVTS.Vehicle();
                segment.attachVehicle(v);
                v.velocity = 100;
                JSVTS.Map.AddVehicle(v);
            }
        }
        var actual = JSVTS.Mover.shouldSlowForCorner(v, v.getLookAheadDistance());
        assert.ok(!actual);
    });