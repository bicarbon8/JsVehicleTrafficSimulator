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
		return JSVTS.Map._segments[id];
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
            if (segment.config.start.x === point.x && segment.config.start.y === point.y && segment.config.start.z === point.z ||
                segment.config.end.x === point.x && segment.config.end.y === point.y && segment.config.end.z === point.z) {
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
            Math.abs(JSVTS.Utils.angleFormedBy(line1, line2)) < 5) {
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

    getVehicleById: function(id) {
        return JSVTS.Map._vehicles[id];
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

    getVehiclesInRangeOf: function (origin, distance) {
        return JSVTS.Map.GetVehicles().filter(function (el) {
            return JSVTS.Utils.getDistanceBetweenTwoPoints(origin, el.config.location) <= distance;
        });
    },

	UpdateVehicles: function(vehicles) {
		for (var i in vehicles) {
			var v = vehicles[i];
			JSVTS.Map._vehicles[v.id] = v;
		}
	},

    /**
     * this function will determine if we need to stop for any TFC
     * on the current segment
     * @return true if tfc's are within distance and require stop
     */
    areTfcsWithinDistance: function(vehicle, segment, distance) {
        if ((distance > 0) && (vehicle && vehicle.segmentId !== null) && (segment)) {
            if (segment.tfc) {
                var tfc = segment.tfc;
                var distToTfc = JSVTS.Utils.getDistanceBetweenTwoPoints(vehicle.config.location, tfc.config.location);

                if (distToTfc < distance) {
                    if (tfc.shouldStop(vehicle)) {
                        // don't stop if touching tfc
                        return { stop: true, type: "tfc", segmentId: segment.id, id: tfc.id };
                    }
                }
            }
        }

        return false;
    },

    /**
     * this function will return true if any vehicles on this segment
     * and any subsegments recursively down to the terminating 
     * nodes are within the passed in distance to the passed in
     * currentLoc
     * @return {object} obj.stop = true if at least one vehicle found within range
     * otherwise false is returned instead of an object
     */
    areVehiclesWithinDistance: function(vehicle, distance, skipCollisionCheck) {
        if ((distance > 0) && (vehicle && vehicle.segmentId !== null)) {
            var dist = distance;
            // lookahead within current segment distance
            var distToSegEnd = JSVTS.Utils.getDistanceBetweenTwoPoints(vehicle.config.location, vehicle.segmentEnd);
            if (distance > distToSegEnd) {
                dist = distToSegEnd;
            }
            var vehicles = JSVTS.Map.getVehiclesInRangeOf(vehicle.config.location, dist).filter(function (v) {
                // return all vehicles which aren't this vehicle
                return (v.id !== vehicle.id);
            });

            if (vehicles && vehicles.length > 0) {
                var headingLine = new THREE.Line3(vehicle.config.location, vehicle.segmentEnd);
                var maxAngle = 1;
                var decay = 1.0;
                if (vehicle.isChangingLanes) {
                    maxAngle = 90;
                    // decay = 0.5;
                }
                var closestVeh = JSVTS.Map.getClosestObjectWithinDistanceAndView(headingLine, vehicles, dist, maxAngle, decay);

                if (closestVeh) {
                    if (!skipCollisionCheck) {
                        // perform collision check
                        var box1 = new THREE.Box3().setFromObject(vehicle.mesh);
                        var box2 = new THREE.Box3().setFromObject(closestVeh.mesh);
                        if (JSVTS.Utils.isCollidingWith(box1, box2)) {
                            vehicle.crashed = true;
                            closestVeh.crashed = true;
                        }
                    }
                    return { stop: true, type: "vehicle", id: closestVeh.id };
                }
            }
        }

        return false;
    },

    /**
     * return the closest object within a maximum distance that falls within the 
     * specified viewing angle
     * 
     * @param headingLine {THREE.Line3} - the line against which to measure the angle
     * @param objects {Array of JSVTS.objects} - an array of JSVTS.Vehicle or 
     *                                           JSVTS.TrafficFlowControl objects
     * @param distance {number} - the maximum distance to look within
     * @param maxAngle {number} - the maximum positive and negative degree offset
     *                            from current headingLine heading to check within
     * @param decay {number} - percentage to shorten distance when at maxAngle
     *                         Ex: distance=100, maxAngle=90, decay=0.50
     *                             at 90 degrees the distance will be 50
     */
    getClosestObjectWithinDistanceAndView: function (headingLine, objects, distance, maxAngle, decay) {
        var closest = { obj: null, dist: 0 };
        if ((distance > 0) && (headingLine) && (objects && objects.length > 0)) {
            if (!maxAngle) { maxAngle = 90; }
            if (!decay) { decay = 1.0; } // 100% of length decay when at maxAngle 
            for (var i in objects) {
                var obj = objects[i];
                // create segment to obj
                var segToObj = new THREE.Line3(headingLine.start, obj.config.location);

                // create segment to current segment end
                var segToEnd = headingLine;

                // get angle formed by both lines
                var angleToObj = Math.abs(JSVTS.Utils.angleFormedBy(segToObj, segToEnd));

                if (angleToObj <= maxAngle) {
                    var distanceToObj = JSVTS.Utils.getDistanceBetweenTwoPoints(headingLine.start, obj.config.location);
                    // compare distance and angle
                    var dist = distance;
                    dist = distance - (distance * ((angleToObj / maxAngle) * decay));
                    if (dist < 0) { dist = 0; }
                    if (distanceToObj <= dist) {
                        if (closest.obj === null || closest.dist > distanceToObj) {
                            closest.obj = obj;
                            closest.dist = distanceToObj;
                        }
                    }
                }
            }
        }

        return closest.obj;
    },
};