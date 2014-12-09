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
	_segments: [],
	_vehicles: [],
    up: new THREE.Vector3(0, 1, 0),

    reset: function () {
        JSVTS.Map._segments = [];
        JSVTS.Map._vehicles = [];
    },

	AddSegment: function(segment) {
        JSVTS.Map._segments[segment.id] = segment;
	},

	AddVehicle: function(vehicle) {
		JSVTS.Map._vehicles[vehicle.id] = vehicle;
	},

    removeVehicle: function(v) {
        // remove v from the Simulation
        // JSVTS.Map._vehicles = JSVTS.Map._vehicles.splice(JSVTS.Map._vehicles.indexOf(v));
        delete JSVTS.Map._vehicles[v.id];
        if (JSVTS.Plotter) {
            JSVTS.Plotter.removeObject(v.mesh);
            JSVTS.Plotter.removeObject(v.idMesh);
        }
        v = null;
    },

	GetSegments: function() {
		return JSVTS.Map._segments;
	},

	GetSegmentById: function (id) {
		return JSVTS.Map.GetSegments().filter(function (el) {
			return el.id === id;
		})[0];
	},

    getSegmentsStartingAt: function (point) {
        return JSVTS.Map.GetSegments().filter(function (seg) {
            return seg.config.start.x === point.x &&
                   seg.config.start.y === point.y &&
                   seg.config.start.z === point.z;
        });
    },

    GetAvailableSegmentsContainingPoint: function(point) {
        var segments = [];
        var allSegments = JSVTS.Map.GetSegments();
        for (var i in allSegments) {
            var segment = allSegments[i];
            if (segment.config.start.x === point.x && segment.config.start.y === point.y && segment.config.start.z === point.z) {
                segments.push(segment);
            } else {
                for (var j in segment.laneChangePoints) {
                    var changePoint = segment.laneChangePoints[j];
                    if (changePoint.x === point.x && changePoint.y === point.y && changePoint.z === point.z) {
                        segments.push(segment);
                    }
                }
            }
        }
		return segments;
	},

	GetSimilarSegmentsInRoad: function(currentSegment) {
		var results = [];

		var segments = JSVTS.Map.GetSegments().filter(function (seg) {
            return (seg.config.name === currentSegment.config.name && seg.id !== currentSegment.id);
        });
		for (var i in segments) {
			var segment = segments[i];

			var line1 = new THREE.Line3(segment.config.start, segment.config.end);
            var line2 = new THREE.Line3(currentSegment.config.start, currentSegment.config.end);
			if (segment.config.name === currentSegment.config.name &&
            Math.abs(JSVTS.Mover.angleFormedBy(line1, line2)) < 5) {
                results.push(segment);
            }
		}

		return results;
	},

	GetVehicles: function() {
		return JSVTS.Map._vehicles.filter(function (v) {
            return v;
        });
	},

	GetVehiclesInSegment: function(id) {
		return JSVTS.Map.GetVehicles().filter(function (el) {
            return el.segmentId === id;
        });
	},

    getVehiclesNotInSegment: function(id) {
        return JSVTS.Map.GetVehicles().filter(function (el) {
            return el.segmentId !== id;
        });
    },

	UpdateVehicles: function(vehicles) {
		for (var i in vehicles) {
			var v = vehicles[i];
			JSVTS.Map._vehicles[v.id] = v;
		}
	},
};