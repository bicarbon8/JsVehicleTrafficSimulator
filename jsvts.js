var JSVTS = {
    plotter       : null,
    canvas        : null,
    map           : null,
    keepMoving    : false,
    LANE_ID_COUNT : 0,
    SEG_ID_COUNT  : 0,
    TFC_ID_COUNT  : 0,
    startTime     : 0,
    elapsed       : 0,
    realtime      : false,

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
            "ext/helvetiker_regular.typeface.js",
            /** main controllers **/
            "js/map.js",
            "js/mover.js",
            "js/plotter.js",
            "js/txtToMapParser.js",
            /** renderable objects **/
            "js/objects/segment.js",
            "js/objects/vehicle.js",
            "js/objects/trafficFlowControl.js",
            "js/objects/stopLight.js",
            "js/objects/vehicleGenerator.js",
            /** maps **/
            "examples/maps/mergeloop.js"
            // "examples/maps/intersection.js"
        ], function () {
            JSVTS.init();
        });
    },

    init: function () {
        JSVTS.initPageElements();
        JSVTS.initObjects();
    },

    reset: function () {
        JSVTS.Plotter.reset();
        JSVTS.Map.reset();
        JSVTS.init();
    },
    
    initPageElements: function () {
        var w = window,
            d = document,
            e = d.documentElement,
            b = d.querySelector('body'),
            x = w.innerWidth || e.clientWidth || b.clientWidth,
            y = w.innerHeight|| e.clientHeight|| b.clientHeight;
        JSVTS.docWidth = x; // window.innerWidth;
        JSVTS.docHeight = y; // window.innerHeight;
        w.addEventListener("keypress", JSVTS.handleKeypress, false);
    },
    
    initObjects: function () {
        JSVTS.Plotter.init(JSVTS.docWidth, JSVTS.docHeight);
        JSVTS.Plotter.render();
    },

    handleKeypress: function(ev) {
        // console.log(ev.charCode);
        switch (ev.charCode) {
            case 'x'.charCodeAt(0):
                JSVTS.reset();
                break;
            case 's'.charCodeAt(0):
                JSVTS.toggleSimulationState();
                break;
            case 'l'.charCodeAt(0):
                JSVTS.setFromJson();
                break;
            case 'r'.charCodeAt(0):
                JSVTS.toggleRealtimeState();
                break;
            default:
                // do nothing
        }
    },

    toggleSimulationState: function (){
        if(JSVTS.keepMoving){
            JSVTS.keepMoving=false;
        } else{
            JSVTS.keepMoving=true;
            JSVTS.startTime = new Date().getTime();
            JSVTS.move();
        }
    },

    toggleRealtimeState: function () {
        if (JSVTS.realtime) {
            JSVTS.realtime = false;
        } else {
            JSVTS.realtime = true;
        }
    },
    
    move: function () {
        if (JSVTS.realtime) {
            JSVTS.elapsed = new Date().getTime() - JSVTS.startTime;
            JSVTS.startTime = new Date().getTime();
        } else {
            JSVTS.elapsed = 10;
        }
        JSVTS.Mover.move(JSVTS.elapsed);
        JSVTS.Plotter.render();

        if (JSVTS.keepMoving) {
            requestAnimationFrame(JSVTS.move);
        }
    },
    
    setFromJson: function () {
        // TODO: load from .json file
        var jsonObj = JSVTS.roadway;
        JSVTS.TxtToMapParser.ParseMapJson(jsonObj.map);
        var segments = JSVTS.Map.GetSegments();
        for (var i in segments) {
            var segment = segments[i];
            JSVTS.Plotter.scene.add(segment.mesh);
            if (segment.tfc) {
                JSVTS.Plotter.scene.add(segment.tfc.mesh);
            }
        }
        JSVTS.Plotter.render();
    }
};
JSVTS.setup();