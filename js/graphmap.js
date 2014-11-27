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
     * this function will return all the stoplights on this segment
     * and any subsegments recursively down to the terminating 
     * nodes
     * @return {Array} an array of Vehicle objects
     */
    self.GetStopLightsWithinDistance=function(currentLoc, segment, distance) {
        var stopLights = [];

        if (distance > 0) {
	        // get the distance from our current location to the end of the segment
	        var lineSeg = new THREE.Line3(
	        	new THREE.Vector3(currentLoc.x,currentLoc.y), 
	        	new THREE.Vector3(segment.config.end.x,segment.config.end.y)
	        );
	        
	        // if the distance is greater than the one passed in only check stopLights for this segment
	        var segLength = lineSeg.distance();
	        
            // loop through all the stopLights and add the ones within range
            var lights = segment.GetStopLights();
            for (var i in lights) {
                var light = lights[i];

                // ensure light is ahead and not behind vehicle
                if (lineSeg.containsPoint(light.Location)) {
	                var distToL = new Line(new Point(currentLoc.X,currentLoc.Y),new Point(light.Location.X,light.Location.Y)).GetLength();

	                if (distToL <= distance) {
	                    stopLights.push(light);
	                }
	            }
            }

            // move on to viewing lights in next segment if we see past the end of this segment
	        if (segLength < distance) {
	            // otherwise move to the next segment(s) reducing the distance by the amount from currentLoc
	            // to segment end
	            var nextSegments = self.GetSegmentsStartingAt(segment.config.end);
	            if (nextSegments && nextSegments.length) {
		            for (var i in nextSegments) {
		            	var lights = self.GetStopLightsWithinDistance(segment.config.end, nextSegments[i], distance-segLength);
		                for (var j in lights) {
		                	stopLights.push(lights[j]);
		                }
		            }
		        }
	        }
	    }

        return stopLights;
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
            var currentLoc = new THREE.Vector3().copy(vehicle.config.location);
            
            // get vehicles in the passed in segment first
            var vehicles = self.GetVehiclesInSegment(vehicle.segmentId);
            if (vehicles && vehicles.length > 0) {
                // get all vehicle meshes except the passed in one
                var boxes = vehicles.map(function (v) {
                    if (v.id !== vehicle.id) {
                        var box = new THREE.Box3().setFromObject(v.mesh);
                        return box;
                    }
                }).filter(function (v) {
                    return v;
                });

                // check for vehicle in front of and close to
                for (var key in boxes) {
                    var box = boxes[key];
                    // check for collision
                    if (vehicle.isCollidingWith(box)) {
                        return true;
                    } else {
                        var direction = new THREE.Vector3().copy(segment.config.end).sub(currentLoc).normalize();
                        var ray = new THREE.Ray(currentLoc, direction);
                        if (ray.isIntersectionBox(box)) {
                            var dist = new THREE.Line3(
                                new THREE.Vector3().copy(currentLoc),
                                new THREE.Vector3().copy(box.min)
                            ).distance();
                            if (dist <= distance) {
                                return true;
                            }
                        }
                    }
                }
            }
            
            // get the distance from our current location to the end of the segment
            var segLength = JSVTS.Mover.GetDistanceBetweenTwoPoints(currentLoc, segment.config.end);
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

        return false;
    };

    self.ContainsStartPoint=function(point){
        if (self.GetSegmentsStartingAt(point) > 0) {
            return true;
        }

        return false;
    };
};