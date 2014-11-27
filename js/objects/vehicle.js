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
        heading: 0,
        desiredVelocity: 0,
        reactionTime: 1.5, // seconds to react
    };
    return self;
};
JSVTS.Vehicle = function(options){
    var self = this;
    self.id = null;
    self.config = JSVTS.VEH_OPTIONS();
    self.changingLanes = false;
    self.changeLaneTime = 0;
    self.segmentId = null;
    self.mesh = null;
    self.velocity = 0; // Km/h
    self.previousLocation = null;
    self.crashed = false;
    self.crashCleanupTime = null;

    self.init=function(options) {
        self.id = JSVTS.VEH_ID_COUNT++;
        for (var optionKey in options) { self.config[optionKey] = options[optionKey]; }
        self.updateLocation();
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

    self.getViewArea=function(){
        /**
         * the view area is a pie-shaped region where the point of the
         * pie starts from the centrepoint of the vehicle and the crust
         * is ahead and to the sides.  Use 3 triangle to represent this
         * where vehicles in the two side triangles must be traveling 
         * towards the vehicle to initiate slowing
         */
        var tri=null;
        if(self.Location){
            var triP0=new THREE.Vector3().copy(self.config.location),
                triP1=new THREE.Vector3().copy(triP0),
                triP2=new THREE.Vector3().copy(triP0);
            if(self.velocity>=0.44){
                // triP1.MoveBy(new Point(self.config.width+(self.Velocity),-(self.Height*2))); //-((self.Height+self.Velocity)/(self.Velocity/4))));
                triP1.applyMatrix(new THREE.Matrix4().makeTranslation(self.config.width+(self.velocity),-(self.config.height*2), 0));
                // triP2.MoveBy(new Point(self.config.width+(self.Velocity),(self.Height*2))); //((self.Height+self.Velocity)/(self.Velocity/4))));
                triP2.applyMatrix(new THREE.Matrix4().makeTranslation(self.config.width+(self.velocity),(self.config.height*2), 0));
            } else{
                // triP1.MoveBy(new Point(self.config.width,-self.Height));
                triP1.applyMatrix(new THREE.Matrix4().makeTranslation(self.config.width,-self.config.height, 0));
                // triP2.MoveBy(new Point(self.config.width,self.Height));
                triP2.applyMatrix(new THREE.Matrix4().makeTranslation(self.config.width,self.config.height, 0));
            }
            var tri=new THREE.Triangle(triP0,triP1,triP2);
            // tri.Rotate(self.config.heading, triP0);
        }
        return tri;
    };

    self.getLookAheadDistance = function(cof) {
        var FRICTION = cof || 0.5;
        var VEHICLE_LENGTH = (self.config.length/2); // start from front bumper
        var GRAVITY = 9.81;
        var METERS_PER_SEC = self.convertKilometersPerHourToMetersPerSecond(self.velocity);
        var REACTION_DISTANCE = METERS_PER_SEC*self.config.reactionTime;
        var result = REACTION_DISTANCE + VEHICLE_LENGTH + (Math.pow(METERS_PER_SEC, 2)) / (2*(FRICTION*GRAVITY));

        return result;
    };

    self.generateMesh = function() {
        if (!self.mesh) {
            // z coordinate used for vertical height
            var geometry = new THREE.BoxGeometry(self.config.width, self.config.length, self.config.height);
            var material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                wireframe: true
            });
            mesh = new THREE.Mesh(geometry, material);
            self.mesh = mesh;
        }
    };

    self.offsetBy = function(offset) {
        var pos = THREE.Vector3(
            self.config.location.x + offset.x, 
            self.config.location.y + offset.y,
            self.config.location.z + offset.z);
        self.updateLocation(pos);
    }

    self.updateLocation = function(newLocation) {
        if (newLocation) {
            self.previousLocation = self.config.location;
            self.config.location.copy(newLocation);
        }
        self.generateMesh(); // generates if doesn't already exist
        // move to self.config.location and rotate to point at heading
        // self.mesh.applyMatrix(new THREE.Matrix4().makeTranslation(self.config.location.x, self.config.location.y, self.config.location.z));
        self.mesh.position.set(self.config.location.x, self.config.location.y, self.config.location.z);

        // indicate that we've updated
        self.mesh.geometry.dynamic = true;
        self.mesh.geometry.verticesNeedUpdate = true;
        self.mesh.geometry.normalsNeedUpdate = true;
    };

    self.updateVelocity = function (elapsedMs, isStopping) {
        // speed up or slow down
        if (self.velocity<self.config.desiredVelocity && !isStopping) {
            // speed up: avg. rate of acceleration is 3.5 m/s^2
            if (self.config.desiredVelocity-self.velocity<0.1) {
                // close enough so just set to value
                self.velocity=self.config.desiredVelocity;
                self.mesh.material.color.setHex(0xffffff);
            } else {
                // accelerate
                self.accelerate(elapsedMs);
            }
        }
        if (self.velocity>self.config.desiredVelocity || isStopping) {
            // slow down: avg. rate of decceleration is 3.5 m/s^2
            if (self.velocity-self.config.desiredVelocity<0.1 && !isStopping) {
                // close enough so just set to value
                self.velocity=self.config.desiredVelocity;
                self.mesh.material.color.setHex(0xffffff);
            } else {
                // deccelerate
                self.brake(elapsedMs);
            }
        }
    };

    self.accelerate = function (elapsedMs) {
        var elapsedSeconds = elapsedMs/1000;
        self.velocity+=(3.5*elapsedSeconds);
        self.mesh.material.color.setHex(0x66ff66);
    };

    self.brake = function (elapsedMs) {
        var elapsedSeconds = elapsedMs/1000;
        self.velocity-=(20*elapsedSeconds);
        // prevent going backwards
        if (self.velocity < 0) {
            self.velocity = 0;
        }
        self.mesh.material.color.setHex(0xff0000);
    };

    self.getBoundingBox = function () {
        self.mesh.geometry.computeBoundingBox();
        return self.mesh.geometry.boundingBox;
    };

    self.isCollidingWith = function (box) {
        if (box.isIntersectionBox(new THREE.Box3().setFromObject(self.mesh))) {
            self.crashed = true;
            return true;
        }
        return false;
    }

    self.convertKilometersPerHourToMetersPerSecond = function(kilometersPerHour) {
        var result = 0;
        var SECONDS_PER_HOUR=3600;
        var METERS_PER_KILOMETER = 1000;
        result = (kilometersPerHour/(SECONDS_PER_HOUR))*METERS_PER_KILOMETER;
        return result;
    };

    // configure this object if data was passed in
    self.init(options);
}