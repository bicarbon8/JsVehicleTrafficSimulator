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
JSVTS.VEH_ID_COUNT = 0;
JSVTS.VEH_OPTIONS = function () {
    var self = {
        name: '',
        width: 2,
        length: 4,
        height: 2,
        location: new THREE.Vector3(0,0,0),
        desiredVelocity: 0,
        reactionTime: 2.5, // seconds to react
        generateId: true,
        acceleration: 3.5, // meters per second
        deceleration: 7, // meters per second
        changeLaneDelay: 5 // don't change lanes for 5 seconds after a change
    };
    return self;
};
JSVTS.Vehicle = function(options){
    var self = this;
    self.id = null;
    self.config = JSVTS.VEH_OPTIONS();
    self.isChangingLanes = false;
    self.changeLaneTime = null;
    self.segmentId = null;
    self.segmentStart = null;
    self.segmentEnd = null;
    self.mesh = null;
    self.velocity = 0; // Km/h
    self.previousLocation = null;
    self.crashed = false;
    self.crashCleanupTime = null;
    self.idMesh = null;

    self.init=function(options) {
        for (var optionKey in options) { self.config[optionKey] = options[optionKey]; }
        if (self.config.generateId) {
            self.id = JSVTS.VEH_ID_COUNT++;
        }
        self.updateLocation(self.config.location);
    };

    self.copyFrom = function (vehicle) {
        if (vehicle) {
            self.init(vehicle.config);
            for (var property in vehicle) {
                if (typeof vehicle[property] !== "function" && typeof vehicle[property] !== "object") {
                    self[property] = vehicle[property];
                }
            }
            return self;
        }
    };

    self.getLookAheadDistance = function(cof) {
        var VEHICLE_LENGTH = self.config.length; // start from 3/2 car length ahead
        var METERS_PER_SEC = self.convertKmphToMps(self.velocity);
        var REACTION_DISTANCE = METERS_PER_SEC * self.config.reactionTime;
        var result = REACTION_DISTANCE + (VEHICLE_LENGTH * 2) + (self.velocity / 2); 

        return result;
    };

    self.generateMesh = function() {
        if (!self.mesh) {
            // z coordinate used for vertical height
            var geometry = new THREE.BoxGeometry(self.config.width, self.config.height, self.config.length);
            var material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                wireframe: true
            });
            var mesh = new THREE.Mesh(geometry, material);
            self.mesh = mesh;

            // TODO: add debug switch
            var text = new THREE.TextGeometry(self.id, { size: 2, height: 0.05 });
            var tMesh = new THREE.Mesh(text, material);
            tMesh.translateY(self.config.height + 5);
            self.idMesh = tMesh;
        }
    };

    self.updateLocation = function (newPosition) {
        if (newPosition) {
            self.generateMesh(); // generates if doesn't already exist
            // move to self.config.location and rotate to point at heading
            self.config.location = newPosition;
            self.mesh.position.set(self.config.location.x, self.config.location.y, self.config.location.z);
            self.idMesh.position.set(self.config.location.x, self.config.location.y + 5, self.config.location.z);

            self.updated();
        }
    };

    self.moveBy = function (distance) {
        if (distance) {
            self.generateMesh(); // generates if doesn't already exist
            // move to self.config.location and rotate to point at heading
            self.mesh.translateZ(distance);
            self.idMesh.position.set(self.mesh.position.x, self.mesh.position.y + 5, self.mesh.position.z);
            self.config.location = self.mesh.position;

            self.updated();
        }
    };

    self.updated = function () {
        // indicate that we've updated
        self.mesh.geometry.dynamic = true;
        self.mesh.geometry.verticesNeedUpdate = true;
        self.mesh.geometry.normalsNeedUpdate = true;

        if (JSVTS.Plotter && JSVTS.Plotter.camera) {
            self.idMesh.lookAt(JSVTS.Plotter.camera.position);
        }
        self.idMesh.geometry.dynamic = true;
        self.idMesh.geometry.verticesNeedUpdate = true;
        self.idMesh.geometry.normalsNeedUpdate = true;
    };

    self.updateVelocity = function (elapsedMs, isStopping) {
        // speed up or slow down
        if (self.velocity < self.config.desiredVelocity && !isStopping) {
            // speed up: avg. rate of acceleration is 3.5 m/s^2
            self.accelerate(elapsedMs);
        }
        if (self.velocity > self.config.desiredVelocity || isStopping) {
            // slow down: avg. rate of deceleration is 3.5 m/s^2
            self.brake(elapsedMs);
        }
    };

    self.accelerate = function (elapsedMs) {
        var elapsedSeconds = elapsedMs/1000;
        self.velocity += (self.convertMpsToKmph(self.config.acceleration * elapsedSeconds));
        self.mesh.material.color.setHex(0x66ff66);
    };

    self.brake = function (elapsedMs) {
        var elapsedSeconds = elapsedMs/1000;
        self.velocity -= (self.convertMpsToKmph(self.config.deceleration * elapsedSeconds));
        // prevent going backwards
        if (self.velocity < 0.1) {
            self.velocity = 0;
        }
        self.mesh.material.color.setHex(0xff0000);
    };

    self.getBoundingBox = function () {
        self.mesh.geometry.computeBoundingBox();
        return self.mesh.geometry.boundingBox;
    };

    self.convertKmphToMps = function(kilometersPerHour) {
        var result = 0;
        var SECONDS_PER_HOUR=3600;
        var METERS_PER_KILOMETER = 1000;
        result = (kilometersPerHour/(SECONDS_PER_HOUR))*METERS_PER_KILOMETER;
        return result;
    };

    self.convertMpsToKmph = function(metersPerSecond) {
        var result = 0;
        var SECONDS_PER_HOUR=3600;
        var METERS_PER_KILOMETER = 1000;
        result = (metersPerSecond * SECONDS_PER_HOUR) / METERS_PER_KILOMETER;
        return result;
    };

    // configure this object if data was passed in
    self.init(options);
}