QUnit.stop();
JSVTS.load([
    "http://cdnjs.cloudflare.com/ajax/libs/three.js/r69/three.js",
    "../js/helpers/utils.js",
    "../js/objects/movable.js",
    "../js/objects/renderable.js",
    "../js/objects/vehicle.js",
    "../js/objects/tempVehicle.js",
    "../js/objects/trafficFlowControl.js",
    "../js/objects/stopLight.js",
    "../js/objects/segment.js",
    "../js/map.js",
    // "../js/plotter.js",
    "../js/clock.js",
    "../js/txtToMapParser.js",
    "../ext/helvetiker_regular.typeface.js",
], function () {
    QUnit.start();
});