var JSVTS = JSVTS || {};
JSVTS = {	
	injectJs: function (script, callback) {
		var s = document.createElement('script');
		s.setAttribute('type', 'text/javascript');
        var exists = document.querySelector('script[src="'+script+'"]');
        if (!exists) {
            document.head.appendChild(s);
            if (callback) { s.onload = function () { callback(); }; }
            s.setAttribute('src', script);
        } else {
            callback();
        }
	},
	load: function (scriptArray, callback) {
		if (scriptArray && scriptArray.length > 0) {
			var script = scriptArray.shift();
			JSVTS.injectJs(script, function () { JSVTS.load(scriptArray, callback); });
		} else if (callback) {
            callback();
        }
	},
    setup: function () {
        JSVTS.load([
            /** external libs **/
            "ext/threejs-69.min.js",
            "ext/OrbitControls.js",
            "ext/stats.min.js",
            /** main controllers **/
            "js/controller.js",
            "js/graphmap.js",
            "js/mover.js",
            "js/objects/segment.js",
            "js/objects/vehicle.js",
            "js/objects/trafficFlowControl.js",
            "js/objects/stopLight.js",
            "js/plotter.js",
            "TxtToMapParser.js",
            // "examples/maps/sample.js"
            "examples/maps/jsonMap.js"
        ], function () {
            JSVTS.Controller.init();
        });
    }
};