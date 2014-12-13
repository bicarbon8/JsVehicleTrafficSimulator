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
JSVTS.Plotter = {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    stats: null,
    light: null,
    width: 0,
    height: 0,

    init: function (width, height) {
        JSVTS.Plotter.width = width;
        JSVTS.Plotter.height = height;
        
        JSVTS.Plotter.initRenderer(width, height);
        JSVTS.Plotter.initCamera(width, height);
        JSVTS.Plotter.initControls();
        JSVTS.Plotter.initLight();
        JSVTS.Plotter.initStats();
        JSVTS.Plotter.initScene([
            JSVTS.Plotter.camera,
            JSVTS.Plotter.light
        ]);
        
        JSVTS.Plotter.initDom([
            JSVTS.Plotter.renderer.domElement,
            JSVTS.Plotter.stats.domElement
        ]);
        JSVTS.Plotter.render();
    },

    initRenderer: function (width, height) {
        JSVTS.Plotter.renderer = new THREE.WebGLRenderer();
        JSVTS.Plotter.renderer.setSize(width, height);
    },

    initLight: function () {
        var pointLight = new THREE.PointLight(0xFFFFFF);
            pointLight.position.x = 10;
            pointLight.position.y = 50;
            pointLight.position.z = 130;
        JSVTS.Plotter.light = pointLight;
    },

    initCamera: function (width, height) {
        var VIEW_ANGLE = 45,
            ASPECT = width / height,
            NEAR = 0.1,
            FAR = 10000;
        JSVTS.Plotter.camera = new THREE.PerspectiveCamera(
            VIEW_ANGLE,
            ASPECT,
            NEAR,
            FAR);
        JSVTS.Plotter.camera.position.z = 228;
        JSVTS.Plotter.camera.position.y = 250;
        JSVTS.Plotter.camera.position.x = 115;
        JSVTS.Plotter.camera.lookAt(new THREE.Vector3(75, 0, 115)); 
    },

    initStats: function () {
        JSVTS.Plotter.stats = new Stats();
        JSVTS.Plotter.stats.domElement.style.position = 'absolute';
        JSVTS.Plotter.stats.domElement.style.top = '0px';
    },

    initControls: function () {
        JSVTS.Plotter.controls = new THREE.OrbitControls(JSVTS.Plotter.camera);
        JSVTS.Plotter.controls.damping = 0.2;
        JSVTS.Plotter.controls.addEventListener('change', function () { JSVTS.Plotter.render(); });
    },

    initScene: function (sceneObjects) {
        JSVTS.Plotter.scene = new THREE.Scene();
        JSVTS.Plotter.scene.add(new THREE.AxisHelper(10000));

        for (var i in sceneObjects) {
            var obj = sceneObjects[i];
            JSVTS.Plotter.scene.add(obj);
        }
    },

    initDom: function (domObjects) {
        for (var i in domObjects) {
            var obj = domObjects[i];
            document.querySelector('body').appendChild(obj);
        }
    },

    render: function() {
        JSVTS.Plotter.renderer.render(JSVTS.Plotter.scene, JSVTS.Plotter.camera);
        JSVTS.Plotter.stats.update();
    },

    reset: function(elementId){
        if (JSVTS.Plotter.renderer) {
            document.querySelector('body').removeChild(JSVTS.Plotter.renderer.domElement);
        }
        if (JSVTS.Plotter.stats) {
            document.querySelector('body').removeChild(JSVTS.Plotter.stats.domElement);
        }
        
        JSVTS.Plotter.renderer = null;
        JSVTS.Plotter.scene = null;
        JSVTS.Plotter.camera = null;
        JSVTS.Plotter.controls = null;
        JSVTS.Plotter.stats = null;

        JSVTS.Plotter.init(JSVTS.Plotter.width, JSVTS.Plotter.height);
    },

    addObject: function(objectMesh) {
        JSVTS.Plotter.scene.add(objectMesh);
    },

    removeObject: function(objectMesh) {
        JSVTS.Plotter.scene.remove(objectMesh);
    }
}