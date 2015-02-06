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
var JSVTS = {
    ID_COUNT: 0,
    CRASH_CLEANUP_MAX_DELAY: 300000, // 5 min
    CRASH_CLEANUP_MIN_DELAY: 60000, // 1 min
    startTime: 0,
    elapsed: 0,
    realtime: false,
    keepMoving: false,
    totalElapsedTime: 0,
    roadways: [],
    defaultRoadway: 0,
    timeStep: 10, // lower values are more accurate, but slower

	init: function () {
        JSVTS.initPageElements();
        JSVTS.initObjects();
        JSVTS.onLoadComplete();
    },

    reset: function () {
        JSVTS.Plotter.reset();
        JSVTS.Map.reset();
        JSVTS.totalElapsedTime = 0;
        JSVTS.init();
    },

    resize: function () {
        var dims = JSVTS.getWidthHeight();
        JSVTS.Plotter.resize(dims.width, dims.height);
    },

    initPageElements: function () {
        var dims = JSVTS.getWidthHeight();
        JSVTS.docWidth = dims.width; // window.innerWidth;
        JSVTS.docHeight = dims.height; // window.innerHeight;
    },

    initObjects: function () {
        JSVTS.Plotter.init(JSVTS.docWidth, JSVTS.docHeight);
        JSVTS.Plotter.render();
        JSVTS.loadRoadway(JSVTS.defaultRoadway);
    },

    getWidthHeight: function () {
        var w = window,
            d = document,
            e = d.documentElement,
            b = d.querySelector('body'),
            x = w.innerWidth || e.clientWidth || b.clientWidth,
            y = w.innerHeight|| e.clientHeight|| b.clientHeight;
        return { width: x, height: y };
    },

    toggleAnimationState: function () {
        if (JSVTS.keepMoving) {
            JSVTS.stop();
        } else {
            JSVTS.start();
        }
    },

    start: function () {
        JSVTS.keepMoving = true;
        JSVTS.move();
    },

    stop: function () {
        JSVTS.keepMoving = false;
    },

    move: function () {
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
    },

    loadRoadway: function (index) {
        var jsonObj = JSVTS.roadways[index];
        JSVTS.TxtToMapParser.parseMapJson(jsonObj.map);
        JSVTS.Plotter.render();
    },

    onLoadComplete: function () {
        // hook for indicating project is loaded and displaying
    },
};
