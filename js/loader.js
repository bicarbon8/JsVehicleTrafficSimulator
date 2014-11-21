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
    "http://cdnjs.cloudflare.com/ajax/libs/three.js/r69/three.min.js",
    "js/controller.js",
	"Point.js",
    "Polygon.js",
    "Rectangle.js",
    "Triangle.js",
    "GraphMap.js",
    "Segment.js",
    "TrafficFlowControl.js",
    "StopLight.js",
    "Driver.js",
    "js/vehicle.js",
    "Plotter.js",
    "TxtToMapParser.js",
    "Line.js"
], function () {
    JSVTS.Controller.InitPageElements();
    JSVTS.Controller.InitObjects();
});