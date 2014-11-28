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
/**
 * This "Class" is used to represent a graph of interconnecting
 * nodes with directional edges of specific lengths between them.
 * The edges will be used as lanes with those having the same 
 * heading and within a specific threshold of eachother being part
 * of the same lane group which allows vehicles to move from lane
 * to lane
 */
"strict mode"
var JSVTS = JSVTS || {};
JSVTS.Map = {
	_segments: {}, // use as a HashMap<JSVTS.Segment.start,Array<JSVTS.Segment>>
	_vehicles: {}, // use as a HashMap<JSVTS.Vehicle.id,JSVTS.Vehicle>
    up: new THREE.Vector3(0, 1, 0),

    reset: function () {
        JSVTS.Map._segments = {};
        JSVTS.Map._vehicles = {};
    },

	AddSegment: function(segment) {
        var key = JSON.stringify(segment.config.start);
		if (!JSVTS.Map._segments[key]) {
			JSVTS.Map._segments[key] = [];
		}
		JSVTS.Map._segments[key].push(segment);
	},

	AddVehicle: function(vehicle) {
		if (vehicle.SegmentId) {
			vehicle = JSVTS.Map.GetSegmentById(vehicle.SegmentId).AttachVehicle(vehicle);
		}
		JSVTS.Map._vehicles[vehicle.id] = vehicle;
	},

    removeVehicle: function(v) {
        // remove v from the Simulation
        JSVTS.Map._vehicles = JSVTS.Map._vehicles.splice(JSVTS.Map._vehicles.indexOf(v));
        if (JSVTS.Controller && JSVTS.Controller.plotter) {
            JSVTS.Controller.plotter.removeObject(v.mesh);
        }
        v = null;
    },

	GetSegments: function() {
		var segments = [];
		for (var key in JSVTS.Map._segments) {
			var segs = JSVTS.Map._segments[key];

            segs.forEach(function (seg) {
                segments.push(seg);
            });
		}

		return segments;
	},

	GetSegmentById: function (id) {
		return JSVTS.Map.GetSegments().filter(function (el) {
			return el.id === id;
		})[0];
	},

	GetSegmentsStartingAt: function(point) {
		return JSVTS.Map._segments[JSON.stringify(point)] || [];
	},

	GetSimilarSegmentsInRoad: function(currentSegment) {
		var results = [];
		var searchRadius = 20; // pixels / meters to search for matches

		var segments = GetSegments();
		for (var i=0; i<segments.length; i++) {
			var segment = segments[i];
			if (segment.id !== currentSegment.id) {
				// ensure segment is within specified radius
				var inRange = false;
				var currLines = currentSegment.LaneChangeLines;
				for (var j=0; j<currLines.length; j++) {
					if (currLines[j].IntersectsLine(segment)) {
						inRange = true;
					}
				}

				if (inRange) {
					results.push(segment);
				}
			}
		}

		return results;
	},

	GetVehicles: function() {
		var vehicles = [];

		for (var i in JSVTS.Map._vehicles) {
			var vehicle = JSVTS.Map._vehicles[i];
			vehicles.push(vehicle);
		}

		return vehicles;
	},

	GetVehiclesInSegment: function(id) {
		return JSVTS.Map.GetVehicles().filter(function (el) {
            return el.segmentId === id;
        });
	},

	UpdateVehicles: function(vehicles) {
		for (var i in vehicles) {
			var v = vehicles[i];
			JSVTS.Map._vehicles[v.id] = v;
		}
	},

    ContainsStartPoint: function(point){
        if (JSVTS.Map.GetSegmentsStartingAt(point) > 0) {
            return true;
        }

        return false;
    },
};