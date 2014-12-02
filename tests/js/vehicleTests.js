var VT = {
    primarySegment: null,
    testVehicles: [],
    setup: function () {
        QUnit.stop();
        JSVTS.load([
            "http://cdnjs.cloudflare.com/ajax/libs/three.js/r69/three.js",
            "../js/objects/vehicle.js",
            "../js/objects/segment.js",
            "../js/mover.js",
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
            VT.primarySegment = seg1;
            var seg2 = new JSVTS.Segment({
                start: new THREE.Vector3(0,0,5),
                end: new THREE.Vector3(1000,0,5),
                isInlet: false,
                speedLimit: 100,
                name: "Road 2"
            });
            var veh1 = new JSVTS.Vehicle();
            seg1.attachVehicle(veh1);
            var pt = seg1.spline.getPoint(0.5); // middle of segment
            veh1.updateLocation(pt);
            veh1.velocity = 100;
            VT.testVehicles.push(veh1);
            
            JSVTS.Map.AddSegment(seg1);
            JSVTS.Map.AddSegment(seg2);
            JSVTS.Map.AddVehicle(veh1);
            QUnit.start();
        });
    },
    teardown: function () {
        JSVTS.Map.reset();
    }
};
QUnit.module("vehicle", {
    setup: VT.setup,
    teardown: VT.teardown
});
QUnit.cases([
        { velocity: 100 },
        { velocity: 0 },
        { velocity: 9 },
        { velocity: 35 }
    ]).test("vehicle should detect other vehicle in range ahead of itself", function (params, assert) {
        var veh = new JSVTS.Vehicle();
        VT.primarySegment.attachVehicle(veh);
        veh.velocity = params.velocity;
        var xLoc = VT.testVehicles[0].config.location.x-veh.getLookAheadDistance()+veh.config.length;
        veh.updateLocation(new THREE.Vector3(xLoc, 0, 0)); // behind VT.testVehicles[0] and in range
        JSVTS.Map.AddVehicle(veh);
        assert.ok(JSVTS.Mover.AreVehiclesWithinDistance(veh, VT.primarySegment, veh.getLookAheadDistance()),
            "vehicle not detected when it should have been. Front Vehicle: "+JSON.stringify(VT.testVehicles[0].config.location)+"; Back Vehicle: "+JSON.stringify(veh.config.location));
    });
QUnit.cases([
        { velocity: 100 },
        { velocity: 0 },
        { velocity: 9 },
        { velocity: 35 }
    ]).test("vehicle should not detect other vehicle not in range ahead of itself", function (params, assert) {
        var veh = new JSVTS.Vehicle();
        VT.primarySegment.attachVehicle(veh);
        veh.velocity = params.velocity;
        var xLoc = VT.testVehicles[0].config.location.x-veh.getLookAheadDistance()-veh.config.length;
        veh.updateLocation(new THREE.Vector3(xLoc, 0, 0)); // behind VT.testVehicles[0] and in range
        JSVTS.Map.AddVehicle(veh);
        assert.ok(!JSVTS.Mover.AreVehiclesWithinDistance(veh, VT.primarySegment, veh.getLookAheadDistance()),
            "vehicle detected when it should not have been. Front Vehicle: "+JSON.stringify(VT.testVehicles[0].config.location)+"; Back Vehicle: "+JSON.stringify(veh.config.location));
    });
QUnit.cases([
        { velocity: 100 },
        { velocity: 9 },
        { velocity: 35 }
    ]).test("vehicle should not detect other vehicle in range behind itself", function (params, assert) {
        var veh = new JSVTS.Vehicle();
        VT.primarySegment.attachVehicle(veh);
        veh.velocity = params.velocity;
        var xLoc = VT.testVehicles[0].config.location.x+veh.getLookAheadDistance()-(veh.config.length/2);
        veh.updateLocation(new THREE.Vector3(xLoc, 0, 0)); // in front of VT.testVehicles[0] and in range, but should not match
        JSVTS.Map.AddVehicle(veh);
        assert.ok(!JSVTS.Mover.AreVehiclesWithinDistance(veh, VT.primarySegment, veh.getLookAheadDistance()),
            "vehicle detected when it should not have been. Back Vehicle: "+JSON.stringify(VT.testVehicles[0].config.location)+"; Front Vehicle: "+JSON.stringify(veh.config.location));
    });
QUnit.cases([
        { velocity: 100 },
        { velocity: 0 },
        { velocity: 9 },
        { velocity: 35 }
    ]).test("vehicle should not detect other vehicle not in range behind itself", function (params, assert) {
        var veh = new JSVTS.Vehicle();
        VT.primarySegment.attachVehicle(veh);
        veh.velocity = params.velocity;
        var xLoc = VT.testVehicles[0].config.location.x+veh.getLookAheadDistance()+(veh.config.length/2)+0.1;
        veh.updateLocation(new THREE.Vector3(xLoc, 0, 0)); // in front of VT.testVehicles[0] and in range, but should not match
        JSVTS.Map.AddVehicle(veh);
        assert.ok(!JSVTS.Mover.AreVehiclesWithinDistance(veh, VT.primarySegment, veh.getLookAheadDistance()),
            "vehicle detected when it should not have been. Back Vehicle: "+JSON.stringify(VT.testVehicles[0].config.location)+"; Front Vehicle: "+JSON.stringify(veh.config.location));
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
        veh1.updateLocation(pt);
        veh1.velocity = 100;
        var veh2 = new JSVTS.Vehicle();
        seg1.attachVehicle(veh2);
        var pt = seg1.spline.getPoint(0.5); // middle of segment
        veh2.updateLocation(pt);
        veh2.velocity = 100;

        JSVTS.Map.AddSegment(seg1);
        JSVTS.Map.AddSegment(seg2);
        JSVTS.Map.AddVehicle(veh1);
        JSVTS.Map.AddVehicle(veh2);

        var distance = veh2.getLookAheadDistance();
        var actual = JSVTS.Mover.shouldStop(veh2, seg1);
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
        veh1.updateLocation(pt);
        veh1.velocity = 100;
        var veh2 = new JSVTS.Vehicle();
        seg1.attachVehicle(veh2);
        var pt = seg1.spline.getPoint(0.5); // middle of segment
        veh2.updateLocation(pt);
        veh2.velocity = 100;

        JSVTS.Map.AddSegment(seg1);
        JSVTS.Map.AddSegment(seg2);
        JSVTS.Map.AddVehicle(veh1);
        JSVTS.Map.AddVehicle(veh2);

        var distance = veh2.getLookAheadDistance();
        var actual = JSVTS.Mover.shouldStop(veh2, seg1);
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
        veh1.updateLocation(pt);
        veh1.velocity = p.v;
        var veh2 = new JSVTS.Vehicle();
        seg1.attachVehicle(veh2);
        var pt = seg1.spline.getPoint(0.25); // 1st quarter of segment
        veh1.updateLocation(pt);
        veh2.velocity = p.v;

        JSVTS.Map.AddSegment(seg1);
        JSVTS.Map.AddVehicle(veh1);
        JSVTS.Map.AddVehicle(veh2);

        var distance = veh2.getLookAheadDistance();
        var actual = JSVTS.Mover.shouldStop(veh2, seg1);
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
        veh1.updateLocation(pt);
        veh1.velocity = p.v;
        var veh2 = new JSVTS.Vehicle();
        seg1.attachVehicle(veh2);
        var pt = seg1.spline.getPoint(0.75); // 3rd quarter of segment
        veh1.updateLocation(pt);
        veh2.velocity = p.v;

        JSVTS.Map.AddSegment(seg1);
        JSVTS.Map.AddVehicle(veh1);
        JSVTS.Map.AddVehicle(veh2);

        var distance = veh2.getLookAheadDistance();
        var actual = JSVTS.Mover.shouldStop(veh2, seg1);
        assert.ok(actual,
            "vehicle not detected when it should have been. Back Vehicle: "+JSON.stringify(veh1.config.location)+"; Front Vehicle: "+JSON.stringify(veh2.config.location)+"; In Range Distance: "+distance);
        assert.equal(actual.type, "vehicle");
    });