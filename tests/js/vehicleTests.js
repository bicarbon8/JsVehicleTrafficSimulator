// QUnit.config.testTimeout = 1000;
var VT = {
    segments: [],
    vehicles: [],
    setup: function () {
        QUnit.stop();
        JSVTS.load([
            "http://cdnjs.cloudflare.com/ajax/libs/three.js/r69/three.js",
            "../js/helpers/utils.js",
            "../js/objects/movable.js",
            "../js/objects/renderable.js",
            "../js/objects/vehicle.js",
            "../js/objects/trafficFlowControl.js",
            "../js/objects/stopLight.js",
            "../js/objects/segment.js",
            "../js/map.js",
            "../ext/helvetiker_regular.typeface.js"
        ], function () {
            var seg1 = new JSVTS.Segment({
                start: new THREE.Vector3(0,0,0),
                end: new THREE.Vector3(1000,0,0),
                isInlet: true,
                speedLimit: 100,
                name: "Road 1"
            });
            var seg2 = new JSVTS.Segment({
                start: new THREE.Vector3(0,0,3),
                end: new THREE.Vector3(1000,0,3),
                isInlet: false,
                speedLimit: 100,
                name: "Road 2"
            });
            VT.segments.push(seg1);
            VT.segments.push(seg2);
            var veh1 = new JSVTS.Vehicle();
            VT.segments[0].attachVehicle(veh1);
            var pt = VT.segments[0].spline.getPoint(0.5); // middle of segment
            veh1.moveTo(pt);
            veh1.velocity = 100;
            VT.vehicles.push(veh1);
            
            for (var i in VT.segments) {
                JSVTS.Map.AddSegment(VT.segments[i]);
            }
            for (var i in VT.vehicles) {
                JSVTS.Map.AddVehicle(VT.vehicles[i]);
            }
            
            QUnit.start();
        });
    },
    teardown: function () {
        JSVTS.Map.reset();
        VT.segments = [];
        VT.vehicles = [];
    }
};
QUnit.module("vehicle", {
    setup: VT.setup,
    teardown: VT.teardown
});
QUnit.test("is an instance of Renderable", function (assert) {
    var v = new JSVTS.Vehicle();
    assert.ok(v instanceof JSVTS.Vehicle);
    assert.ok(v instanceof JSVTS.Renderable);
    assert.ok(v instanceof JSVTS.Movable);
});
QUnit.cases([
    { velocity: 100 },
    { velocity: 0 },
    { velocity: 9 },
    { velocity: 35 }
]).test("vehicle should detect other vehicle in range ahead of itself", function (params, assert) {
    var veh = new JSVTS.Vehicle();
    VT.segments[0].attachVehicle(veh);
    veh.velocity = params.velocity;
    var distance = veh.getLookAheadDistance();
    var xLoc = VT.vehicles[0].config.location.x - distance + 1;
    veh.moveTo(new THREE.Vector3(xLoc, 0, 0)); // behind VT.vehicles[0] and in range
    JSVTS.Map.AddVehicle(veh);
    assert.ok(JSVTS.Map.areVehiclesWithinDistance(veh, distance),
        "vehicle not detected when it should have been. Front Vehicle: "+JSON.stringify(VT.vehicles[0].config.location)+"; Back Vehicle: "+JSON.stringify(veh.config.location)+"; In Range Distance: "+distance);
});
QUnit.cases([
    { velocity: 100 },
    { velocity: 0 },
    { velocity: 9 },
    { velocity: 35 }
]).test("vehicle should not detect other vehicle not in range ahead of itself", function (params, assert) {
    var veh = new JSVTS.Vehicle();
    VT.segments[0].attachVehicle(veh);
    veh.velocity = params.velocity;
    var xLoc = VT.vehicles[0].config.location.x-veh.getLookAheadDistance()-veh.config.length;
    veh.moveTo(new THREE.Vector3(xLoc, 0, 0)); // behind VT.vehicles[0] and in range
    JSVTS.Map.AddVehicle(veh);
    assert.ok(!JSVTS.Map.areVehiclesWithinDistance(veh, veh.getLookAheadDistance()),
        "vehicle detected when it should not have been. Front Vehicle: "+JSON.stringify(VT.vehicles[0].config.location)+"; Back Vehicle: "+JSON.stringify(veh.config.location));
});
QUnit.cases([
    { velocity: 100 },
    { velocity: 0 },
    { velocity: 9 },
    { velocity: 35 }
]).test("vehicle should not detect other vehicles in range on next lane over", function (params, assert) {
    VT.vehicles[0].velocity = params.velocity;
    var distance = VT.vehicles[0].getLookAheadDistance();
    var segLength = VT.segments[1].getLength();
    var divisions = 100;
    for (var i=0; i < divisions; i++) {
        var veh = new JSVTS.Vehicle();
        VT.segments[1].attachVehicle(veh);
        veh.moveBy((segLength / divisions) * i);
        JSVTS.Map.AddVehicle(veh);
    }
    
    var actual = JSVTS.Map.areVehiclesWithinDistance(VT.vehicles[0], distance);
    var found = { config: { location: "none" } };
    if (actual) {
        found = JSVTS.Map.getVehicleById(actual.id);
    }
    var expected = false;
    assert.equal(actual, expected,
        "vehicle detected when it should not have been. Front Vehicle: "+JSON.stringify(VT.vehicles[0].config.location)+"; Detected Vehicle: "+JSON.stringify(found.config.location)+"; In Range Distance: "+distance);
});
QUnit.cases([
    { velocity: 100 },
    { velocity: 9 },
    { velocity: 35 }
]).test("vehicle should not detect other vehicle in range behind itself", function (params, assert) {
    var veh = new JSVTS.Vehicle();
    VT.segments[0].attachVehicle(veh);
    veh.velocity = params.velocity;
    var xLoc = VT.vehicles[0].config.location.x+veh.getLookAheadDistance()-(veh.config.length/2);
    veh.moveTo(new THREE.Vector3(xLoc, 0, 0)); // in front of VT.vehicles[0] and in range, but should not match
    JSVTS.Map.AddVehicle(veh);
    assert.ok(!JSVTS.Map.areVehiclesWithinDistance(veh, veh.getLookAheadDistance()),
        "vehicle detected when it should not have been. Back Vehicle: "+JSON.stringify(VT.vehicles[0].config.location)+"; Front Vehicle: "+JSON.stringify(veh.config.location));
});
QUnit.cases([
    { velocity: 100 },
    { velocity: 0 },
    { velocity: 9 },
    { velocity: 35 }
]).test("vehicle should not detect other vehicle not in range behind itself", function (params, assert) {
    var veh = new JSVTS.Vehicle();
    VT.segments[0].attachVehicle(veh);
    veh.velocity = params.velocity;
    var xLoc = VT.vehicles[0].config.location.x+veh.getLookAheadDistance()+(veh.config.length/2)+0.1;
    veh.moveTo(new THREE.Vector3(xLoc, 0, 0)); // in front of VT.vehicles[0] and in range, but should not match
    JSVTS.Map.AddVehicle(veh);
    assert.ok(!JSVTS.Map.areVehiclesWithinDistance(veh, veh.getLookAheadDistance()),
        "vehicle detected when it should not have been. Back Vehicle: "+JSON.stringify(VT.vehicles[0].config.location)+"; Front Vehicle: "+JSON.stringify(veh.config.location));
});
QUnit.test("vehicle should detect other vehicle in range ahead of itself on different segment, same heading", function (assert) {
    VT.teardown();
    var seg1 = new JSVTS.Segment({
        start: new THREE.Vector3(0,0,0),
        end: new THREE.Vector3(75,0,0),
        isInlet: true,
        speedLimit: 100,
        name: "Road 1"
    });
    var seg2 = new JSVTS.Segment({
        start: new THREE.Vector3(75,0,0),
        end: new THREE.Vector3(150,0,0),
        isInlet: true,
        speedLimit: 100,
        name: "Road 1"
    });
    var veh1 = new JSVTS.Vehicle();
    seg2.attachVehicle(veh1);
    var pt = seg2.spline.getPoint(0.5); // middle of segment
    veh1.moveTo(pt);
    veh1.velocity = 100;
    var veh2 = new JSVTS.Vehicle();
    seg1.attachVehicle(veh2);
    pt = seg1.spline.getPoint(0.5); // middle of segment
    veh2.moveTo(pt);
    veh2.velocity = 100;

    JSVTS.Map.AddSegment(seg1);
    JSVTS.Map.AddSegment(seg2);
    JSVTS.Map.AddVehicle(veh1);
    JSVTS.Map.AddVehicle(veh2);

    var distance = veh2.getLookAheadDistance();
    var actual = veh2.shouldStop(seg1);
    assert.ok(actual,
        "vehicle not detected when it should have been. Front Vehicle: "+JSON.stringify(veh1.config.location)+"; Back Vehicle: "+JSON.stringify(veh2.config.location)+"; In Range Distance: "+distance);
    assert.equal(actual.type, "vehicle");
});
QUnit.test("vehicle should detect other vehicle in range ahead of itself on different segment, different heading", function (assert) {
    VT.teardown();
    var seg1 = new JSVTS.Segment({
        start: new THREE.Vector3(0,0,0),
        end: new THREE.Vector3(25,0,0),
        isInlet: true,
        speedLimit: 100,
        name: "Road 1"
    });
    var seg2 = new JSVTS.Segment({
        start: new THREE.Vector3(25,0,0),
        end: new THREE.Vector3(50,0,2),
        isInlet: true,
        speedLimit: 100,
        name: "Road 1"
    });
    var veh1 = new JSVTS.Vehicle();
    seg2.attachVehicle(veh1);
    var pt = seg2.spline.getPoint(0.5); // middle of segment
    veh1.moveTo(pt);
    veh1.velocity = 100;
    var veh2 = new JSVTS.Vehicle();
    seg1.attachVehicle(veh2);
    pt = seg1.spline.getPoint(0.5); // middle of segment
    veh2.moveTo(pt);
    veh2.velocity = 100;

    JSVTS.Map.AddSegment(seg1);
    JSVTS.Map.AddSegment(seg2);
    JSVTS.Map.AddVehicle(veh1);
    JSVTS.Map.AddVehicle(veh2);

    var distance = veh2.getLookAheadDistance();
    var actual = veh2.shouldStop(seg1);
    assert.ok(actual,
        "vehicle not detected when it should have been. Front Vehicle: "+JSON.stringify(veh1.config.location)+"; Back Vehicle: "+JSON.stringify(veh2.config.location)+"; In Range Distance: "+distance);
    assert.equal(actual.type, "vehicle");
});
QUnit.cases([
    { sx: 0, sy: 0, sz: 0, ex: 75, ey: 0, ez: 75, v: 100 },
    { sx: 100, sy: 0, sz: 75, ex: 25, ey: 0, ez: 105, v: 100 }
]).test("vehicle should detect other vehicle in range ahead of itself on segment with angled heading", function (p, assert) {
    VT.teardown();
    var seg1 = new JSVTS.Segment({
        start: new THREE.Vector3(p.sx,p.sy,p.sz),
        end: new THREE.Vector3(p.ex,p.ey,p.ez),
        isInlet: true,
        speedLimit: p.v,
        name: "Road 1"
    });
    var veh1 = new JSVTS.Vehicle();
    seg1.attachVehicle(veh1);
    var pt = seg1.spline.getPoint(0.5); // middle of segment
    veh1.moveTo(pt);
    veh1.velocity = p.v;
    var veh2 = new JSVTS.Vehicle();
    seg1.attachVehicle(veh2);
    pt = seg1.spline.getPoint(0.25); // 1st quarter of segment
    veh1.moveTo(pt);
    veh2.velocity = p.v;

    JSVTS.Map.AddSegment(seg1);
    JSVTS.Map.AddVehicle(veh1);
    JSVTS.Map.AddVehicle(veh2);

    var distance = veh2.getLookAheadDistance();
    var actual = veh2.shouldStop(seg1);
    assert.ok(actual,
        "vehicle not detected when it should have been. Front Vehicle: "+JSON.stringify(veh1.config.location)+"; Back Vehicle: "+JSON.stringify(veh2.config.location)+"; In Range Distance: "+distance);
    assert.equal(actual.type, "vehicle");
}); 
QUnit.cases([
    { sx: 0, sy: 0, sz: 0, ex: 75, ey: 0, ez: 75, v: 100 },
    { sx: 100, sy: 0, sz: 75, ex: 25, ey: 0, ez: 105, v: 100 }
]).test("vehicle should not detect other vehicle in range behind itself on segment with angled heading", function (p, assert) {
    VT.teardown();
    var seg1 = new JSVTS.Segment({
        start: new THREE.Vector3(p.sx,p.sy,p.sz),
        end: new THREE.Vector3(p.ex,p.ey,p.ez),
        isInlet: true,
        speedLimit: p.v,
        name: "Road 1"
    });
    var veh1 = new JSVTS.Vehicle();
    seg1.attachVehicle(veh1);
    var pt = seg1.spline.getPoint(0.5); // middle of segment
    veh1.moveTo(pt);
    veh1.velocity = p.v;
    var veh2 = new JSVTS.Vehicle();
    seg1.attachVehicle(veh2);
    pt = seg1.spline.getPoint(0.75); // 3rd quarter of segment
    veh1.moveTo(pt);
    veh2.velocity = p.v;

    JSVTS.Map.AddSegment(seg1);
    JSVTS.Map.AddVehicle(veh1);
    JSVTS.Map.AddVehicle(veh2);

    var distance = veh2.getLookAheadDistance();
    var actual = veh2.shouldStop(seg1);
    assert.ok(actual,
        "vehicle not detected when it should have been. Back Vehicle: "+JSON.stringify(veh1.config.location)+"; Front Vehicle: "+JSON.stringify(veh2.config.location)+"; In Range Distance: "+distance);
    assert.equal(actual.type, "vehicle");
});
QUnit.cases([
    { v: 0 },
    { v: 0.00001 },
    { v: 10 },
    { v: 100 }
]).test("vehicle should correctly calculate lookahead distance based on velocity", function (p, assert) {
    var v = new JSVTS.Vehicle();
    v.velocity = p.v;

    var distance = v.getLookAheadDistance();
    assert.ok(distance >= v.config.length * 2);
    var mps = JSVTS.Utils.convertKmphToMps(v.velocity);
    var distanceToStop = (-(Math.pow(mps, 2)) / (2 * -(v.config.deceleration))) / 2;
    assert.ok(distance >= distanceToStop);
});
QUnit.test("vehicle should not receive negative velocity when decelerate is called", function (assert) {
    var v = new JSVTS.Vehicle();
    v.velocity = JSVTS.Utils.convertMpsToKmph(v.config.deceleration - 1);

    v.brake(1000);
    assert.ok(v.velocity >= 0, "expected velocity greater than or equal to 0, but was: " + v.velocity);
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
    var actual = v.shouldSlowForCorner(v.getLookAheadDistance());
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
    var actual = v.shouldSlowForCorner(v.getLookAheadDistance());
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
            v2.moveBy(v2.getLookAheadDistance()); // move ahead by 30 units less than the lookahead
        }
    }
    var actual = v.shouldSlowForCorner(v.getLookAheadDistance());
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
    var v, v2;
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
            v2.moveBy(v2.getLookAheadDistance() * 2 + 1); // move ahead by 1 unit more than the lookahead
        }
    }
    var actual = v.changeLanesIfAvailable(JSVTS.Map.GetSegmentById(v.segmentId));
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
    var actual = v.changeLanesIfAvailable(JSVTS.Map.GetSegmentById(v.segmentId));
    assert.ok(!actual);
    assert.equal(v.segmentId, expectedSegmentId);
});
QUnit.test("should not accelerate when object in lookahead distance", function (assert) {
    var v = new JSVTS.Vehicle();
    var tfc = new JSVTS.StopLight({ startState: JSVTS.StopLightState.RED });
    var endX = 100;
    var s = new JSVTS.Segment({ start: new THREE.Vector3(0,0,0), end: new THREE.Vector3(endX,0,0) });
    s.attachVehicle(v);
    s.setTfc(tfc);
    JSVTS.Map.AddSegment(s);
    JSVTS.Map.AddVehicle(v);
    // move vehicle to within lookahead distance of TFC for stopped velocity
    var lookahead = v.getLookAheadDistance();
    v.moveBy((endX + 1) - lookahead);
    for (var i=0; i<100; i++) {
        assert.equal(v.velocity, 0, "expected velocity to remain at 0, but was: " + v.velocity +
            " for vehicle with lookahead of: " + lookahead + " at: " + JSON.stringify(v.config.location) + " and tfc at: " + JSON.stringify(tfc.config.location));
        v.update(10);
    }
});