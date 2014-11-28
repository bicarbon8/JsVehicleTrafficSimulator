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
JSVTS.SEG_ID_COUNT = 0;
JSVTS.SEG_OPTIONS = function () {
    var self = {
        start: THREE.Vector3(-10,0,0),
        end: THREE.Vector3(10,0,0),
        isInlet: false,
        name: '',
        speedLimit: 30, // Km/h
    };
    return self;
};
JSVTS.Segment = function(options){
    var self = this;
    self.id=null;
    self.config = JSVTS.SEG_OPTIONS();
    self.LaneChangeLines=[];
    self.mesh = null;
    self.spline = null; // used for directionality
    self.tangent = null;
    self.axis = null;
    self.radians = null;
    self.tfc = null;

    self.init=function(options) {
        self.id = JSVTS.SEG_ID_COUNT++;
        for (var optionKey in options) { self.config[optionKey] = options[optionKey]; }
        self.generateMesh();

        // build the "tendrils" that allow for lane changes
        // self.GenerateLaneChangeLines();
    };
    
    self.attachVehicle=function(vehicle) {
        // set reference data
        vehicle.config.desiredVelocity = self.config.speedLimit;
        vehicle.segmentId = self.id;

        // set the vehicle's position and heading
        vehicle.updateLocation(new THREE.Vector3().copy(self.config.start));
        
        // set the quaternion
        vehicle.mesh.lookAt(self.config.end);
        // vehicle.mesh.quaternion.setFromAxisAngle(self.axis, self.radians);
    };

    self.attachTrafficFlowControl=function(tfc) {
        // set reference data
        tfc.segmentId = self.id;

        // set the vehicle's position and heading
        tfc.updateLocation(new THREE.Vector3().copy(self.config.end));
        
        // set the quaternion
        tfc.mesh.quaternion.setFromAxisAngle(self.axis, self.radians);

        self.tfc = tfc;
    };

    self.generateMesh = function () {
        self.spline = new THREE.SplineCurve3([
            self.config.start,
            self.config.end
        ]);

        var material = new THREE.LineBasicMaterial({
            color: 0xffffff,
        });

        var geometry = new THREE.Geometry();
        geometry.vertices = self.spline.getPoints(2);
        var line = new THREE.Line(geometry, material);
        self.mesh = line;

        // get the tangent to the curve
        if (!self.tangent) {
            self.tangent = self.spline.getTangent(0).normalize();
            self.axis = new THREE.Vector3();
            self.axis.crossVectors(JSVTS.Map.up, self.tangent).normalize();
            // calcluate the angle between the up vector and the tangent
            self.radians = Math.acos(JSVTS.Map.up.dot(self.tangent));
        }
    };

    self.getLength = function () {
        return self.spline.getLength(0);
    };

    self.angleFormedBy = function (segment) {
        var a = new THREE.Vector3().copy(self.config.end).sub(self.config.start).normalize();
        var b = new THREE.Vector3().copy(segment.config.end).sub(segment.config.start).normalize();
        return (Math.acos(a.dot(b))*(180/Math.PI));
    };

    self.init(options);
};