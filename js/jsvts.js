/**********************************************************************
 * This javascript is part of a Vehicle Traffic Simulator written 
 * entirely in Javascript, HTML and CSS.  The application allows for 
 * the creation of roadways upon which vehicles will travel and
 * attempt to avoid collisions with other vehicles while obeying the
 * rules of the road including traffic lights and speed limits
 * 
 * @Created: 04/09/2013
 * @Author: Jason Holt Smith (bicarbon8@gmail.com)
 * @Version: 0.2.0
 * Copyright (c) 2013 Jason Holt Smith. JsVehicleTrafficSimulator is 
 * distributed under the terms of the GNU General Public License.
 * 
 * This file is part of JsVehicleTrafficSimulator.
 * 
 * JsVehicleTrafficSimulator is free software: you can redistribute it 
 * and/or modify it under the terms of the GNU General Public License 
 * as published by the Free Software Foundation, either version 3 of 
 * the License, or (at your option) any later version.
 * 
 * JsVehicleTrafficSimulator is distributed in the hope that it will 
 * be useful, but WITHOUT ANY WARRANTY; without even the implied 
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
 * See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with JsVehicleTrafficSimulator.  If not, see 
 * <http://www.gnu.org/licenses/>.
 **********************************************************************/
"strict mode";
var JSVTS = JSVTS || {};

JSVTS.ID_COUNT = 0;
JSVTS.CRASH_CLEANUP_MAX_DELAY = 300000; // 5 min
JSVTS.CRASH_CLEANUP_MIN_DELAY = 60000; // 1 min
JSVTS.startTime = 0;
JSVTS.elapsed = 0;
JSVTS.realtime = false;
JSVTS.keepMoving = false;
JSVTS.totalElapsedTime = 0;
JSVTS.roadways = [];
JSVTS.defaultRoadway = 0;
JSVTS.timeStep = 10; // lower values are more accurate, but slower

JSVTS.injectJs = function (script, callback) {
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
};

JSVTS.load = function (scriptArray, callback) {
    if (scriptArray && scriptArray.length > 0) {
		var script = scriptArray.shift();
		JSVTS.injectJs(script, function () { JSVTS.load(scriptArray, callback); });
	} else if (callback) {
        callback();
    }
};

JSVTS.setup = function () {
    JSVTS.init();
};

JSVTS.init = function () {
    JSVTS.initPageElements();
    JSVTS.initObjects();
};

JSVTS.reset = function () {
    JSVTS.Plotter.reset();
    JSVTS.Map.reset();
    JSVTS.totalElapsedTime = 0;
    JSVTS.init();
};

JSVTS.resize = function () {
    var dims = JSVTS.getWidthHeight();
    JSVTS.Plotter.resize(dims.width, dims.height);
};

JSVTS.initPageElements = function () {
    var dims = JSVTS.getWidthHeight();
    JSVTS.docWidth = dims.width; // window.innerWidth;
    JSVTS.docHeight = dims.height; // window.innerHeight;
};

JSVTS.initObjects = function () {
    JSVTS.Plotter.init(JSVTS.docWidth, JSVTS.docHeight);
    JSVTS.Plotter.render();
    JSVTS.loadRoadway(JSVTS.defaultRoadway);
};

JSVTS.getWidthHeight = function () {
    var w = window,
        d = document,
        e = d.documentElement,
        b = d.querySelector('body'),
        x = w.innerWidth || e.clientWidth || b.clientWidth,
        y = w.innerHeight|| e.clientHeight|| b.clientHeight;
    return { width: x, height: y };
};

JSVTS.toggleAnimationState = function () {
    if (JSVTS.keepMoving) {
        JSVTS.keepMoving = false;
    } else {
        JSVTS.keepMoving = true;
        JSVTS.move();
    }
};

JSVTS.move = function () {
    JSVTS.elapsed = JSVTS.timeStep;
    
    // update segments
    JSVTS.Map.getMovables().forEach(function (mov) {
        mov.update(JSVTS.elapsed);
    });
        
    JSVTS.Plotter.render();
    JSVTS.totalElapsedTime += JSVTS.elapsed;

    if (JSVTS.keepMoving) {
        requestAnimationFrame(JSVTS.move);
    }
};

JSVTS.loadRoadway = function (index) {
    var jsonObj = JSVTS.roadways[index];
    JSVTS.TxtToMapParser.parseMapJson(jsonObj.map);
    JSVTS.Plotter.render();
};