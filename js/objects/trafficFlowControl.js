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
JSVTS.TFC_ID_COUNT = 0;
JSVTS.TFC_OPTIONS = function () {
    var self = {
        location: new THREE.Vector3()
    };
    return self;
};
// abstract base class
JSVTS.TrafficFlowControl = function (options) {
    var self = this;
    self.id = null;
    self.config = JSVTS.TFC_OPTIONS();
    self.segmentId = null;
    self.mesh = null;

    self.init = function (options) {
        self.id = JSVTS.TFC_ID_COUNT++;
        for (var optionKey in options) { self.config[optionKey] = options[optionKey]; }
    };

    self.update = function (elapsedMs) {
        // abstract base method
        throw "update method cannot be called on abstract base class.";
    };

    self.updateLocation = function(newLocation) {
        if (newLocation) {
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

    self.init(options);
};