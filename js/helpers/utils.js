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
var JSVTS = JSVTS || {};
JSVTS.Utils = {
	getRandomBetween: function (min, max) {
		return Math.random() * (max - min) + min;
	},

	getDistanceBetweenTwoPoints: function (p1, p2) {
        return new THREE.Line3(new THREE.Vector3().copy(p1), new THREE.Vector3().copy(p2)).distance();
    },

    angleFormedBy: function (line1, line2) {
        var a = new THREE.Vector3().copy(line1.end).sub(line1.start).normalize();
        var b = new THREE.Vector3().copy(line2.end).sub(line2.start).normalize();
        return (Math.acos(a.dot(b))*(180/Math.PI));
    },

    isCollidingWith: function (box1, box2) {
        if (box1.isIntersectionBox(box2)) {
            return true;
        }
        return false;
    },

    convertKmphToMps: function(kilometersPerHour) {
		var result = 0;
		var SECONDS_PER_HOUR=3600;
		var METERS_PER_KILOMETER = 1000;
		result = (kilometersPerHour/(SECONDS_PER_HOUR))*METERS_PER_KILOMETER;
		return result;
	},

	convertMpsToKmph: function(metersPerSecond) {
		var result = 0;
		var SECONDS_PER_HOUR=3600;
		var METERS_PER_KILOMETER = 1000;
		result = (metersPerSecond * SECONDS_PER_HOUR) / METERS_PER_KILOMETER;
		return result;
	},
};