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
    var defaults = JSVTS.SEG_OPTIONS();
    for (var key in options) { defaults[key] = options[key]; }
    JSVTS.Renderable.call(this, defaults);

    this.tangent = null;
    this.axis = null;
    this.radians = null;
    this.laneChangePoints = [];

    this.generateLaneChangePoints();
};
JSVTS.Segment.prototype = Object.create(JSVTS.Renderable.prototype);
JSVTS.Segment.prototype.constructor = JSVTS.Segment;

JSVTS.Segment.prototype.copy = function(segment) {
    this.id = segment.id;
    this.config.start = new THREE.Vector3().copy(segment.config.start);
    this.config.end = new THREE.Vector3().copy(segment.config.end);
    this.generateMesh();

    this.generateLaneChangePoints();
};

JSVTS.Segment.prototype.attachMovable = function (obj, location, lookAt) {
    if (obj instanceof JSVTS.Movable) {
        // set reference data
        obj.segment = this;

        // set the obj's position to passed in location
        if (obj instanceof JSVTS.Renderable) {
            obj.moveTo(location, lookAt);
        } else {
            obj.moveTo(location);
        }
    }
};

JSVTS.Segment.prototype.generateMesh = function (options) {
    this.spline = new THREE.SplineCurve3([
        options.start,
        options.end
    ]);

    var material = new THREE.LineBasicMaterial({
        color: 0xffffff,
    });

    var geometry = new THREE.Geometry();
    geometry.vertices = this.spline.getPoints(1);
    var line = new THREE.Line(geometry, material);
    this.mesh = line;

    // get the tangent to the curve
    if (!this.tangent) {
        this.tangent = this.spline.getTangent(0).normalize();
        this.axis = new THREE.Vector3();
        this.axis.crossVectors(JSVTS.Map.up, this.tangent).normalize();
        // calcluate the angle between the up vector and the tangent
        this.radians = Math.acos(JSVTS.Map.up.dot(this.tangent));
    }

    var identity = this.id;
    if (this.config.name && this.config.name !== "") {
        identity = this.config.name;
    }
    var text = new THREE.TextGeometry(identity, { size: 2, height: 0.05 });
    var tMesh = new THREE.Mesh(text, material);
    var pt = this.spline.getPoint(0.5);
    tMesh.position.set(pt.x, pt.y, pt.z);
    tMesh.lookAt(this.config.end);
    tMesh.rotateY(90*(Math.PI/180));
    tMesh.translateY(this.mesh.position.y + 5);
    this.mesh.add(tMesh);
};

JSVTS.Segment.prototype.generateLaneChangePoints = function() {
    var point = new THREE.SphereGeometry(1);
    var pointMat = new THREE.MeshBasicMaterial();
    var sphere = new THREE.Mesh(point, pointMat);
    
    // place point every [spacing] units (metres)
    var spacing = 1;
    for (var i=spacing; i<this.getLength(); i+=spacing) {
        sphere.position.set(this.config.start.x, this.config.start.y, this.config.start.z);
        sphere.lookAt(this.config.end);
        sphere.translateZ(i);
        this.laneChangePoints.push(new THREE.Vector3().copy(sphere.position));
    }
    sphere.geometry.dispose();
};

JSVTS.Segment.prototype.getLength = function () {
    return this.spline.getLength(0);
};

JSVTS.Segment.prototype.update = function (elapsedMs) {
    // do nothing
};