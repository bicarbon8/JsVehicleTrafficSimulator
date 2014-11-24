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
        desiredVelocity: 0
    };
    return self;
};
JSVTS.Vehicle = function(options){
    this.id = null;
    this.config = JSVTS.VEH_OPTIONS();
    this.changingLanes = false;
    this.changeLaneTime = 0;
    this.segmentId = undefined;
    this.mesh = undefined;
    this.view = undefined;
    this.velocity = 0; // Km/h

    this.init=function(options) {
        this.id = JSVTS.VEH_ID_COUNT++;
        for (var optionKey in options) { this.config[optionKey] = options[optionKey]; }
        this.generateMesh();
    };

    this.copyFrom = function (vehicle) {
        if (vehicle) {
            this.Initialize(vehicle.config);
            this.id=vehicle.id;
            this.desiredVelocity=vehicle.desiredVelocity;
            this.segmentId=vehicle.segmentId;
            this.ElapsedMs=vehicle.ElapsedMs;
            this.mesh=vehicle.mesh;
        }
    };

    this.intersectsPoint=function(point){
        var intersects=false;
        var rect=this.GetBoundingBox();
        if(rect.ContainsPoint(point)){
            intersects=true;
        }
        return intersects;
    };

    this.getViewArea=function(){
        /**
         * the view area is a pie-shaped region where the point of the
         * pie starts from the centrepoint of the vehicle and the crust
         * is ahead and to the sides.  Use 3 triangle to represent this
         * where vehicles in the two side triangles must be traveling 
         * towards the vehicle to initiate slowing
         */
        var tri=null;
        if(this.Location){
            var triP0=new THREE.Vector3().copy(this.config.location),
                triP1=new THREE.Vector3().copy(triP0),
                triP2=new THREE.Vector3().copy(triP0);
            if(this.velocity>=0.44){
                // triP1.MoveBy(new Point(this.config.width+(this.Velocity),-(this.Height*2))); //-((this.Height+this.Velocity)/(this.Velocity/4))));
                triP1.applyMatrix(new THREE.Matrix4().makeTranslation(this.config.width+(this.velocity),-(this.config.height*2), 0));
                // triP2.MoveBy(new Point(this.config.width+(this.Velocity),(this.Height*2))); //((this.Height+this.Velocity)/(this.Velocity/4))));
                triP2.applyMatrix(new THREE.Matrix4().makeTranslation(this.config.width+(this.velocity),(this.config.height*2), 0));
            } else{
                // triP1.MoveBy(new Point(this.config.width,-this.Height));
                triP1.applyMatrix(new THREE.Matrix4().makeTranslation(this.config.width,-this.config.height, 0));
                // triP2.MoveBy(new Point(this.config.width,this.Height));
                triP2.applyMatrix(new THREE.Matrix4().makeTranslation(this.config.width,this.config.height, 0));
            }
            var tri=new THREE.Triangle(triP0,triP1,triP2);
            // tri.Rotate(this.config.heading, triP0);
        }
        return tri;
    };

    this.getLookAheadDistance=function() {
        if(this.velocity>=4.4704){
            // distance is one car length per 16.1 kilometers per hour
            return (this.config.width*(this.velocity/16.1)+(this.config.width/2));
        } else{
            // or slightly more than half a car length if going really slow
            return this.config.width+(this.config.width/2);
        }
    };

    this.generateMesh = function() {
        // z coordinate used for vertical height
        geometry = new THREE.BoxGeometry(this.config.length, this.config.width, this.config.height);
        material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true
        });

        mesh = new THREE.Mesh(geometry, material);
        this.mesh = mesh;

        // move to this.config.location and rotate to point at heading
        this.mesh.applyMatrix(new THREE.Matrix4().makeTranslation(this.config.location.x, this.config.location.y, this.config.location.z));
        this.mesh.rotateOnAxis(new THREE.Vector3(0,1,0).normalize(), this.config.heading); // y-axis rotation

        // indicate that we've updated
        this.mesh.geometry.dynamic = true;
        this.mesh.geometry.verticesNeedUpdate = true;
        this.mesh.geometry.normalsNeedUpdate = true;
    };

    function generateView() {

    }

    // configure this object if data was passed in
    this.init(options);
}