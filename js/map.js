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
var JSVTS = JSVTS || {};
JSVTS.Map = {
	_movables: [],
    up: new THREE.Vector3(0, 1, 0),

    reset: function () {
        JSVTS.Map._movables = [];
    },

    addMovable: function(movable) {
        if (movable instanceof JSVTS.Movable) {
            JSVTS.Map._movables[movable.id] = movable;
            if (JSVTS.Plotter) {
                JSVTS.Plotter.addRenderable(movable);
            }
        }
    },

    removeMovable: function(movable) {
        if (movable instanceof JSVTS.Movable) {
            // remove movable from the Simulation
            delete JSVTS.Map._movables[movable.id];
            if (JSVTS.Plotter) {
                JSVTS.Plotter.removeRenderable(movable);
            }
            movable = null;
        }
    },

    getMovables: function () {
        return JSVTS.Map._movables.filter(function (m) {
            return m;
        });
    },

    getMovableById: function (id) {
        return JSVTS.Map._movables[id];
    },

    getMovableByType: function (type) {
        return JSVTS.Map._movables.filter(function(m) {
            return m instanceof type;
        });
    },

    updateMovables: function(movables) {
        for (var i in movables) {
            var m = movables[i];
            JSVTS.Map._movables[m.id] = m;
        }
    },

	getSegments: function() {
		return JSVTS.Map.getMovableByType(JSVTS.Segment);
	},

	getSegmentsStartingAt: function (point) {
        return JSVTS.Map.getSegments().filter(function (seg) {
            return seg.config.start.x === point.x &&
                   seg.config.start.y === point.y &&
                   seg.config.start.z === point.z;
        });
    },

    getAvailableSegmentsContainingPoint: function(point) {
        var segments = [];
        var allSegments = JSVTS.Map.getSegments();
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

	getSimilarSegmentsInRoad: function(currentSegment) {
		var results = [];

		var segments = JSVTS.Map.getSegments().filter(function (seg) {
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

    getTypesInSegment: function(segmentId, type) {
        return JSVTS.Map._movables.filter(function(m) {
            return m.segment && m.segment.id === segmentId && m instanceof type;
        });
    },

    getTypesNotInSegment: function(segmentId, type) {
        return JSVTS.Map._movables.filter(function(m) {
            return m.segment && m.segment.id !== segmentId && m instanceof type;
        });
    },

	getVehicles: function() {
        return JSVTS.Map.getMovableByType(JSVTS.Vehicle);
    },

	getVehiclesInSegment: function(id) {
		return JSVTS.Map.getTypesInSegment(id, JSVTS.Vehicle);
	},

    getVehiclesNotInSegment: function(id) {
        return JSVTS.Map.getTypesNotInSegment(id, JSVTS.Vehicle);
    },

    getVehiclesInRangeOf: function (origin, distance) {
        return JSVTS.Map.getVehicles().filter(function (el) {
            return JSVTS.Utils.getDistanceBetweenTwoPoints(origin, el.config.location) <= distance;
        });
    },

    getTfcsInSegment: function(id) {
        return JSVTS.Map.getTypesInSegment(id, JSVTS.TrafficFlowControl);
    },

	/**
     * this function will determine if we need to stop for any TFC
     * on the current segment
     * @return true if tfc's are within distance and require stop
     */
    areTfcsWithinDistance: function(vehicle, distance) {
        if ((distance > 0) && (vehicle && vehicle.segment)) {
            var tfcs = JSVTS.Map.getTfcsInSegment(vehicle.segment.id);
            for (var i in tfcs) {
                var tfc = tfcs[i];
                var distToTfc = JSVTS.Utils.getDistanceBetweenTwoPoints(vehicle.config.location, tfc.config.location);

                if (distToTfc < distance) {
                    if (tfc.shouldStop(vehicle)) {
                        // don't stop if touching tfc
                        return { stop: true, type: "tfc", segmentId: tfc.segment.id, id: tfc.id };
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
        if ((distance > 0) && (vehicle && vehicle.segment)) {
            var dist = distance;
            // lookahead within current segment distance
            var distToSegEnd = JSVTS.Utils.getDistanceBetweenTwoPoints(vehicle.config.location, vehicle.segment.config.end);
            if (distance > distToSegEnd) {
                dist = distToSegEnd;
            }
            var vehicles = JSVTS.Map.getVehiclesInRangeOf(vehicle.config.location, dist).filter(function (v) {
                // return all vehicles which aren't this vehicle
                return (v.id !== vehicle.id);
            });

            if (vehicles && vehicles.length > 0) {
                var found = null;
                for (var key in vehicles) {
                    var v = vehicles[key];
                    if (vehicle.hasInView(v.config.location)) {
                        // check if v is in current segment
                        if (v.segment && v.segment.id === vehicle.segment.id) {
                            found = v.id;
                            break;
                        } else {
                            // check heading of both vehicles' segments and if intersecting then return true
                            var r = new THREE.Ray(vehicle.config.location.clone(), vehicle.segment.config.end.clone().sub(vehicle.config.location).normalize());
                            var distToIntersect = r.distanceSqToSegment(v.config.location.clone(), v.segment.config.end.clone());
                            if (distToIntersect === 0) {
                                // intersection found
                                found = v.id;
                                break;
                            } else if (Number.isNaN(distToIntersect)) {
                                // parallel lines so check for overlaps
                                var distToPoint = r.distanceToPoint(v.config.location);
                                if (distToPoint === 0) {
                                    // intersection found
                                    found = v.id;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (found) {
                    return { stop: true, type: "vehicle", id: found };
                }
            }
        }

        return false;
    },
};