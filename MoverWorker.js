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
importScripts(
    "ext/threejs-69.min.js",
	"js/objects/vehicle.js",
	"js/objects/segment.js",
	"js/graphmap.js",
    "js/mover.js"
);
onmessage = function(event) {
	var data = JSON.parse(event.data);
	var map = new JSVTS.Map(data.map.Scale);
	for (var i in data.map._segments) {
		var segArray = data.map._segments[i];
		segArray.forEach(function (segment) {
			var newSeg = new Segment(segment.config.start, segment.config.end);
			newSeg.id = segment.id;
			newSeg.config.speedLimit = segment.config.speedLimit;
			map.AddSegment(newSeg);
		});
	}
    for (var j in data.map._vehicles) {
		var v = data.map._vehicles[j];
		var newVeh = new Vehicle().copyFrom(v);
		map._vehicles[newVeh.id] = newVeh;
	}
    elapsed = data.elapsed;
	JSVTS.Mover.Move(elapsed, map, data.vehicleIds);
};