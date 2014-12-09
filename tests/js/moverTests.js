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
    ]).test("heading difference should be difference between this and next segment", function (p, assert) {
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
QUnit.cases([
        { s: [{sx:0,sy:0,sz:0,ex:500,ey:0,ez:0}, // first lane gets test vehicle
              {sx:0,sy:0,sz:6,ex:500,ey:0,ez:6}] // 2nd lane gets blocking vehicle
        },
        { s: [{sx:0,sy:0,sz:-6,ex:500,ey:0,ez:-6}, // first lane gets test vehicle
              {sx:0,sy:0,sz:0,ex:500,ey:0,ez:0}] // 2nd lane gets blocking vehicle
        },
    ]).test("should not change lanes when vehicle in lookahead distance of new lane", function (p, assert) {
        var v,
            expectedSegmentId;
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
                expectedSegmentId = segment.id;
            }
            if (i === 1) {
                v2 = new JSVTS.Vehicle();
                segment.attachVehicle(v2);
                v2.velocity = 100;
                JSVTS.Map.AddVehicle(v2);
                v2.moveBy(v2.getLookAheadDistance() - 30); // move ahead by 30 units less than the lookahead
            }
        }
        var actual = JSVTS.Mover.changeLanesIfAvailable(v, JSVTS.Map.GetSegmentById(v.segmentId));
        assert.ok(!actual);
        assert.equal(v.segmentId, expectedSegmentId);
    });
QUnit.cases([
        { s: [{sx:0,sy:0,sz:0,ex:500,ey:0,ez:0}, // first lane gets test vehicle
              {sx:0,sy:0,sz:6,ex:500,ey:0,ez:6}] // 2nd lane gets blocking vehicle
        },
        { s: [{sx:0,sy:0,sz:-6,ex:500,ey:0,ez:-6}, // first lane gets test vehicle
              {sx:0,sy:0,sz:0,ex:500,ey:0,ez:0}] // 2nd lane gets blocking vehicle
        },
    ]).test("should change lanes when vehicle beyond lookahead distance of new lane", function (p, assert) {
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
            if (i === 1) {
                v2 = new JSVTS.Vehicle();
                segment.attachVehicle(v2);
                v2.velocity = 100;
                JSVTS.Map.AddVehicle(v2);
                v2.moveBy(v2.getLookAheadDistance() + 1); // move ahead by 1 unit more than the lookahead
            }
        }
        var actual = JSVTS.Mover.changeLanesIfAvailable(v, JSVTS.Map.GetSegmentById(v.segmentId));
        assert.ok(actual);
        assert.ok(!JSVTS.Map.GetSegmentById(v.segmentId));
    });
QUnit.cases([
        { s: [{sx:0,sy:0,sz:0,ex:100,ey:0,ez:0},
              {sx:0,sy:0,sz:6,ex:50,ey:0,ez:6},
              {sx:50,sy:0,sz:6,ex:100,ey:0,ez:6}]
        },
    ]).test("should not change lanes when vehicle in lookahead distance of new lane on separate segment", function (p, assert) {
        var v,
            expectedSegmentId;
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
                expectedSegmentId = segment.id;
            }
            if (i === 2) {
                v2 = new JSVTS.Vehicle();
                segment.attachVehicle(v2);
                v2.velocity = 100;
                JSVTS.Map.AddVehicle(v2);
            }
        }
        var actual = JSVTS.Mover.changeLanesIfAvailable(v, JSVTS.Map.GetSegmentById(v.segmentId));
        assert.ok(!actual);
        assert.equal(v.segmentId, expectedSegmentId);
    });