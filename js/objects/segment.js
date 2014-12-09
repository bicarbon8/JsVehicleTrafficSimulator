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
        isMergeLane: false
    };
    return self;
};
JSVTS.Segment = function(options){
    var self = this;
    self.id=null;
    self.config = JSVTS.SEG_OPTIONS();
    self.mesh = null;
    self.spline = null; // used for directionality
    self.tangent = null;
    self.axis = null;
    self.radians = null;
    self.tfc = null;
    self.generator = null;
    self.laneChangePoints = [];

    self.init=function(options) {
        self.id = JSVTS.SEG_ID_COUNT++;
        for (var optionKey in options) { self.config[optionKey] = options[optionKey]; }
        self.generateMesh();

        self.generateLaneChangePoints();
    };

    self.copy=function(segment) {
        self.id = segment.id;
        self.config.start = new THREE.Vector3().copy(segment.config.start);
        self.config.end = new THREE.Vector3().copy(segment.config.end);
        self.generateMesh();

        self.generateLaneChangePoints();
    };
    
    self.attachVehicle=function(vehicle, atPoint) {
        if (!atPoint) {
            atPoint = self.config.start;
        }
        vehicle.config.desiredVelocity = self.config.speedLimit;
        self.attachObject(vehicle, atPoint, self.config.end);
        vehicle.segmentStart = self.config.start;
        vehicle.segmentEnd = self.config.end;
        if (self.config.isMergeLane) {
            vehicle.isChangingLanes = true;
        }
    };

    self.attachObject = function (obj, location, lookAt) {
        // set reference data
        obj.segmentId = self.id;

        // set the obj's position to passed in location
        obj.updateLocation(new THREE.Vector3().copy(location));
        
        if (obj.mesh) {
            // rotate to face segment end so movement will just be Z translation
            obj.mesh.lookAt(lookAt);
        }
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

        var identity = self.id;
        if (self.config.name && self.config.name !== "") {
            identity = self.config.name;
        }
        var text = new THREE.TextGeometry(identity, { size: 2, height: 0.05 });
        var tMesh = new THREE.Mesh(text, material);
        var pt = self.spline.getPoint(0.5);
        tMesh.position.set(pt.x, pt.y, pt.z);
        tMesh.lookAt(self.config.end);
        tMesh.rotateY(90*(Math.PI/180));
        tMesh.translateY(self.mesh.position.y + 5);
        self.mesh.add(tMesh);
    };

    self.generateLaneChangePoints = function() {
        // place point every [spacing] units (metres)
        var spacing = 1;
        for (var i=spacing; i<self.getLength(); i+=spacing) {
            var point = new THREE.SphereGeometry(1);
            var pointMat = new THREE.MeshBasicMaterial();
            var sphere = new THREE.Mesh(point, pointMat);
            sphere.position.set(self.config.start.x, self.config.start.y, self.config.start.z);
            sphere.lookAt(self.config.end);
            sphere.translateZ(i);
            self.laneChangePoints.push(sphere.position);
            sphere.geometry.dispose();
        }
    };

    self.getLength = function () {
        return self.spline.getLength(0);
    };

    self.init(options);
};