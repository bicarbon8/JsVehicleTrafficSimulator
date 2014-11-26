var VT = {
    map: null,
    primarySegment: null,
    testVehicles: [],
    setup: function () {
        QUnit.stop();
        JSVTS.load([
            "http://cdnjs.cloudflare.com/ajax/libs/three.js/r69/three.js",
            "../js/objects/vehicle.js",
            "../js/objects/segment.js",
            "../js/graphmap.js"
        ], function () {
            JSVTS.Controller = { up: new THREE.Vector3(0,1,0) };
            VT.map = new JSVTS.Map(1);
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
            var xLoc = seg1.getLength() / 2;
            var pt = seg1.spline.getPoint(0.5); // middle of segment
            veh1.updateLocation(pt);
            veh1.velocity = 100;
            VT.testVehicles.push(veh1);
            
            VT.map.AddSegment(seg1);
            VT.map.AddSegment(seg2);
            VT.map.AddVehicle(veh1);
            QUnit.start();
        });
    },
    teardown: function () {
        VT.map = null;
    }
};
QUnit.module("vehicle", {
    setup: VT.setup,
    teardown: VT.teardown
});
QUnit.test("vehicle should detect other vehicle in range ahead of itself", function (assert) {
    var veh = new JSVTS.Vehicle();
    VT.primarySegment.attachVehicle(veh);
    veh.velocity = 100;
    var xLoc = VT.testVehicles[0].config.location.x-veh.getLookAheadDistance()+veh.config.length;
    veh.updateLocation(new THREE.Vector3(xLoc, 0, 0)); // behind VT.testVehicles[0] and in range
    VT.map.AddVehicle(veh);
    assert.ok(VT.map.AreVehiclesWithinDistance(veh, VT.primarySegment, veh.getLookAheadDistance()),
        "vehicle not detected when it should have been. Front Vehicle: "+JSON.stringify(VT.testVehicles[0].config.location)+"; Back Vehicle: "+JSON.stringify(veh.config.location));
});
QUnit.test("vehicle should not detect other vehicle not in range ahead of itself", function (assert) {
    var veh = new JSVTS.Vehicle();
    VT.primarySegment.attachVehicle(veh);
    veh.velocity = 100;
    var xLoc = VT.testVehicles[0].config.location.x-veh.getLookAheadDistance()-veh.config.length;
    veh.updateLocation(new THREE.Vector3(xLoc, 0, 0)); // behind VT.testVehicles[0] and in range
    VT.map.AddVehicle(veh);
    assert.ok(!VT.map.AreVehiclesWithinDistance(veh, VT.primarySegment, veh.getLookAheadDistance()),
        "vehicle detected when it should not have been. Front Vehicle: "+JSON.stringify(VT.testVehicles[0].config.location)+"; Back Vehicle: "+JSON.stringify(veh.config.location));
});
QUnit.test("vehicle should not detect other vehicle in range behind itself", function (assert) {
    var veh = new JSVTS.Vehicle();
    VT.primarySegment.attachVehicle(veh);
    veh.velocity = 100;
    var xLoc = VT.testVehicles[0].config.location.x+veh.getLookAheadDistance()-veh.config.length;
    veh.updateLocation(new THREE.Vector3(xLoc, 0, 0)); // in front of VT.testVehicles[0] and in range, but should not match
    VT.map.AddVehicle(veh);
    assert.ok(!VT.map.AreVehiclesWithinDistance(veh, VT.primarySegment, veh.getLookAheadDistance()),
        "vehicle detected when it should not have been. Back Vehicle: "+JSON.stringify(VT.testVehicles[0].config.location)+"; Front Vehicle: "+JSON.stringify(veh.config.location));
});
QUnit.test("vehicle should not detect other vehicle not in range behind itself", function (assert) {
    var veh = new JSVTS.Vehicle();
    VT.primarySegment.attachVehicle(veh);
    veh.velocity = 100;
    var xLoc = VT.testVehicles[0].config.location.x+veh.getLookAheadDistance();
    veh.updateLocation(new THREE.Vector3(xLoc, 0, 0)); // in front of VT.testVehicles[0] and in range, but should not match
    VT.map.AddVehicle(veh);
    assert.ok(!VT.map.AreVehiclesWithinDistance(veh, VT.primarySegment, veh.getLookAheadDistance()),
        "vehicle detected when it should not have been. Back Vehicle: "+JSON.stringify(VT.testVehicles[0].config.location)+"; Front Vehicle: "+JSON.stringify(veh.config.location));
});