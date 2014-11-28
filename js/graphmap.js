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
JSVTS.Map = function(scale) {
	var self = this;
	self.Scale=scale || 1;
	self._segments = {}; // use as a HashMap<Point,Array<Segment>>
	self._vehicles = {}; // use as a HashMap<Id,Vehicle>

	self.AddSegment=function(segment) {
        var key = JSON.stringify(segment.config.start);
		if (!self._segments[key]) {
			self._segments[key] = [];
		}
		self._segments[key].push(segment);
	}

	self.AddVehicle=function(vehicle) {
		if (vehicle.SegmentId) {
			vehicle = self.GetSegmentById(vehicle.SegmentId).AttachVehicle(vehicle);
		}
		self._vehicles[vehicle.id] = vehicle;
	}

	self.GetSegments=function() {
		var segments = [];
		for (var key in self._segments) {
			var segs = self._segments[key];

            segs.forEach(function (seg) {
                segments.push(seg);
            });
		}

		return segments;
	};

	self.GetSegmentById=function (id) {
		return self.GetSegments().filter(function (el) {
			return el.id === id;
		})[0];
	};

	self.GetSegmentsStartingAt=function(point) {
		return self._segments[JSON.stringify(point)] || [];
	};

	self.GetSimilarSegmentsInRoad=function(currentSegment) {
		var results = [];
		var searchRadius = 20; // pixels / meters to search for matches

		var segments = self.GetSegments();
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
	};

	self.GetVehicles=function() {
		var vehicles = [];

		for (var i in self._vehicles) {
			var vehicle = self._vehicles[i];
			vehicles.push(vehicle);
		}

		return vehicles;
	};

	self.GetVehiclesInSegment=function(id) {
		return self.GetVehicles().filter(function (el) {
            return el.segmentId === id;
        });
	};

	self.UpdateVehicles=function(vehicles) {
		for (var i in vehicles) {
			var v = vehicles[i];
			self._vehicles[v.id] = v;
		}
	};

    /**
     * @param decay {number} - percentage to shorten distance when at maxAngle
     *                         Ex: distance=100, maxAngle=90, decay=0.50
     *                             at 90 degrees the distance will be 50
     */
    self.getClosestObjectWithinDistanceAndView = function (baseline, objects, distance, maxAngle, decay) {
        var closest = { obj: null, dist: 0 };
        if ((distance > 0) && (baseline) && (objects && objects.length > 0)) {
            if (!maxAngle) { maxAngle = 90; }
            if (!decay) { decay = 1.0; } // 100% of length when at maxAngle 
            for (var i in objects) {
                var obj = objects[i];
                // create segment to obj
                var segToTfc = new THREE.Line3(baseline.start, obj.config.location);

                // create segment to current segment end
                var segToEnd = baseline;

                // get angle formed by both lines
                var angleToObj = self.angleFormedBy(segToTfc, segToEnd);

                if (angleToObj >= -maxAngle && angleToObj <= maxAngle) {
                    var distanceToObj = JSVTS.Mover.GetDistanceBetweenTwoPoints(baseline.start, obj.config.location);
                    // compare distance and angle
                    var dist = distance;
                    dist = distance - (distance*((angleToObj/maxAngle)*decay))
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
    };

	/**
     * this function will return all the stoplights on this segment
     * and any subsegments recursively down to the terminating 
     * nodes
     * @return true if tfc's are within distance
     */
    self.AreTfcsWithinDistance = function(vehicle, segment, distance) {
        if ((distance > 0) && (vehicle && vehicle.segmentId !== null) && (segment)) {
            var baseline = new THREE.Line3(vehicle.config.location, segment.config.end);
            if (segment.tfc) {
                var closestTfc = self.getClosestObjectWithinDistanceAndView(baseline, [segment.tfc], distance);

                if (closestTfc) {
                    // if TFC is RED or YELLOW
                    if (closestTfc.shouldStop(vehicle)) {
                        // don't stop if touching tfc
                        if (!vehicle.isCollidingWith(new THREE.Box3().setFromObject(closestTfc.mesh))) {
                            return true;
                        }
                    }
                } else {
                    // get the distance from our current location to the end of the segment
                    var segLength = JSVTS.Mover.GetDistanceBetweenTwoPoints(baseline.start, segment.config.end);
                    // if the distance is greater than the remaining segment length
                    // move on to viewing vehicles in next segment
                    if (segLength < distance) {
                        var tmpVehicle = new JSVTS.Vehicle().copyFrom(vehicle);
                        tmpVehicle.config.location = segment.config.end;
                        var nextSegments = self.GetSegmentsStartingAt(segment.config.end); // get segments starting from this one's end
                        if (nextSegments && nextSegments.length > 0) {
                            for (var i in nextSegments) {
                                nextSegments[i].attachVehicle(tmpVehicle);
                                return self.AreTfcsWithinDistance(tmpVehicle, nextSegments[i], (distance-segLength));
                            }
                        }
                    }
                }
            }
        }

        return false;
    };

    /**
     * this function will return true if any vehicles on this segment
     * and any subsegments recursively down to the terminating 
     * nodes are within the passed in distance to the passed in
     * currentLoc
     * @return {boolean} true if at least one vehicle found within range
     * otherwise false
     */
    self.AreVehiclesWithinDistance = function(vehicle, segment, distance) {
        if ((distance > 0) && (vehicle && vehicle.segmentId !== null) && (segment)) {
            var baseline = new THREE.Line3(vehicle.config.location, segment.config.end);
            var vehicles = self.GetVehicles().filter(function (v) {
                return v.id !== vehicle.id;
            });
            var closestVeh = self.getClosestObjectWithinDistanceAndView(baseline, vehicles, distance);
            
            if (closestVeh) {
                // perform collision check
                if (vehicle.isCollidingWith(new THREE.Box3().setFromObject(closestVeh.mesh))) {
                    vehicle.crashed = true;
                }
                return true;
            } else {
                // get the distance from our current location to the end of the segment
                var segLength = JSVTS.Mover.GetDistanceBetweenTwoPoints(baseline.start, segment.config.end);
                // if the distance is greater than the remaining segment length
                // move on to viewing vehicles in next segment
                if (segLength < distance) {
                    var tmpVehicle = new JSVTS.Vehicle().copyFrom(vehicle);
                    tmpVehicle.config.location = segment.config.end;
                    var nextSegments = self.GetSegmentsStartingAt(segment.config.end); // get segments starting from this one's end
                    if (nextSegments && nextSegments.length > 0) {
                        for (var i in nextSegments) {
                            nextSegments[i].attachVehicle(tmpVehicle);
                            return self.AreVehiclesWithinDistance(tmpVehicle, nextSegments[i], (distance-segLength));
                        }
                    }
                }
            }
        }

        return false;
    };

    self.angleFormedBy = function (line1, line2) {
        var a = new THREE.Vector3().copy(line1.end).sub(line1.start).normalize();
        var b = new THREE.Vector3().copy(line2.end).sub(line2.start).normalize();
        return (Math.acos(a.dot(b))*(180/Math.PI));
    };

    self.ContainsStartPoint=function(point){
        if (self.GetSegmentsStartingAt(point) > 0) {
            return true;
        }

        return false;
    };
};