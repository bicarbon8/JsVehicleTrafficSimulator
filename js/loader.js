var JSVTS = JSVTS || {};
JSVTS.Loader = {	
	injectJs: function (script, callback) {
		var s = document.createElement('script');
		s.setAttribute('type', 'text/javascript');
		document.head.appendChild(s);
        if (callback) { s.onload = function () { callback(); }; }
        s.setAttribute('src', script);
	},
	load: function (scriptArray, callback) {
		if (scriptArray && scriptArray.length > 0) {
			var script = scriptArray.shift();
			JSVTS.Loader.injectJs(script, function () { JSVTS.Loader.load(scriptArray, callback); });
		} else if (callback) {
            callback();
        }
	}
};

JSVTS.Loader.load([
    /** external libs **/
    "ext/threejs-69.min.js",
    "ext/OrbitControls.js",
    "js/controller.js",
    "js/graphmap.js",
    "js/objects/segment.js",
    "TrafficFlowControl.js",
    "StopLight.js",
    "Driver.js",
    "js/objects/vehicle.js",
    "js/plotter.js",
    "TxtToMapParser.js",
    "Line.js",
    "examples/maps/jsonMap.js"
], function () {
    JSVTS.Controller.init();
});