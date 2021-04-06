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
/**
 * base class for any objects that can be moved
 */
JSVTS.Renderable = function (options) {
    JSVTS.Movable.call(this, options);

    this.mesh = null;
    this.material = null;
    this.texture = null;
    
    this.generateMesh(options);
};
JSVTS.Renderable.prototype = Object.create(JSVTS.Movable.prototype);
JSVTS.Renderable.prototype.constructor = JSVTS.Renderable;

JSVTS.Renderable.prototype.updated = function () {
    // indicate that we've updated
    // this.mesh.geometry.dynamic = true;
    // this.mesh.geometry.verticesNeedUpdate = true;
    // this.mesh.geometry.normalsNeedUpdate = true;
    this.mesh.updateMatrix();
};

/**
 * abstract base method that must be implemented
 * in the subclass
 */
JSVTS.Renderable.prototype.generateMesh = function (options) {
    throw "abstract method cannot be called directly";
};

JSVTS.Renderable.prototype.moveTo = function (location, lookAt) {
    JSVTS.Movable.prototype.moveTo.call(this, location);
    if (location) {
        this.mesh.position.set(location.x, location.y, location.z);
    }
    if (lookAt) {
        this.mesh.lookAt(lookAt);
    }
    this.updated();
};

JSVTS.Renderable.prototype.moveBy = function (distance) {
    if (distance > 0) {
        // move to this.config.location and rotate to point at heading
        this.mesh.translateZ(distance);
        this.moveTo(this.mesh.position);
    }
};

JSVTS.Renderable.prototype.dispose = function () {
    if (this.mesh && this.mesh.geometry) { this.mesh.geometry.dispose(); }
    if (this.material) { this.material.dispose(); }
    if (this.texture) { this.texture.dispose(); }
};