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
JSVTS.Plotter = function (){
    var self = this;
    self.LaneThickness = 2;
    self.RoadColor = "#808080";
    self.renderer = null;
    self.scene = null;
    self.camera = null;
    self.controls = null;
    self.stats = null;

    self.init = function() {
        var width = JSVTS.Controller.docWidth;
        var height = JSVTS.Controller.docHeight;
        self.renderer = new THREE.WebGLRenderer();
        var VIEW_ANGLE = 45,
            ASPECT = width / height,
            NEAR = 0.1,
            FAR = 10000;
        self.camera = new THREE.PerspectiveCamera(
            VIEW_ANGLE,
            ASPECT,
            NEAR,
            FAR); 
        self.scene = new THREE.Scene();
        self.scene.add(self.camera);
        self.camera.position.z = 500;
        self.camera.position.x = 500;
        self.camera.lookAt(self.scene.position);
        self.controls = new THREE.OrbitControls(self.camera);
        self.controls.damping = 0.2;
        self.controls.addEventListener('change', function () { self.renderer.render(self.scene, self.camera); });
        self.renderer.setSize(width, height);
        var pointLight = new THREE.PointLight(0xFFFFFF);
        pointLight.position.x = 10;
        pointLight.position.y = 50;
        pointLight.position.z = 130;
        self.scene.add(pointLight);
        document.querySelector('body').appendChild(self.renderer.domElement);
        self.stats = new Stats();
        self.stats.domElement.style.position = 'absolute';
        self.stats.domElement.style.top = '0px';
        document.querySelector('body').appendChild(self.stats.domElement);
        self.renderer.render(self.scene, self.camera);
    };

    self.render = function() {
        self.renderer.render(self.scene, self.camera);
        self.stats.update();
    };

    self.Clear=function(elementId){
        // canvas.removeLayerGroup(elementId);
        // canvas.drawLayers();
    };

    self.init();
}