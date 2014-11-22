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
JSVTS.VEH_OPTIONS = {
    name: '',
    width: 2,
    length: 4,
    height: 2,
    x: 0,
    y: 0,
    z: 0,
    heading: 0
};
JSVTS.Vehicle = function(options){
    this.id = null;
    this.config = JSVTS.VEH_OPTIONS;
    this.bounds = null;
    this.DesiredVelocity = 0;
    this.changingLanes = false;
    this.changeLaneTime = 0;
    this.SegmentId = undefined;
    this.mesh = undefined;
    this.view = undefined;

    this.init=function(options) {
        this.Id = JSVTS.VEH_ID_COUNT++;
        for (var optionKey in this.config) { this.config[optionKey] = options[optionKey]; }
        this.generateMesh();
    };

    this.copyFrom = function (vehicle) {
        if (vehicle) {
            this.Initialize(vehicle.config);
            this.Id=vehicle.Id;
            this.DesiredVelocity=vehicle.DesiredVelocity;
            this.SegmentId=vehicle.SegmentId;
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
            var triP0=this.getBoundingBox().GetCenterPoint();
            var triP1=new Point(triP0.X,triP0.Y);
            if(this.Velocity>=0.44){
                triP1.MoveBy(new Point(this.Width+(this.Velocity),-(this.Height*2))); //-((this.Height+this.Velocity)/(this.Velocity/4))));
            } else{
                triP1.MoveBy(new Point(this.Width,-this.Height));
            }
            var triP2=new Point(triP0.X,triP0.Y);
            if(this.Velocity>=0.44){
                triP2.MoveBy(new Point(this.Width+(this.Velocity),(this.Height*2))); //((this.Height+this.Velocity)/(this.Velocity/4))));
            } else{
                triP2.MoveBy(new Point(this.Width,this.Height));
            }
            var tri=new Triangle(triP0,triP1,triP2);
            tri.Rotate(this.Heading,triP0);
        }
        return tri;
    };

    this.getLookAheadDistance=function() {
        if(this.velocity>=4.4704){
            // distance is one car length per 16.1 kilometers per hour
            return (this.config.width*(this.Velocity/16.1)+(this.Width/2));
        } else{
            // or slightly more than half a car length if going really slow
            return this.Width+(this.Width/2);
        }
    };

    this.generateMesh = function() {
        // z coordinate used for vertical height
        geometry = new THREE.BoxGeometry(this.config.width, this.config.length, this.config.height);
        material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true
        });

        mesh = new THREE.Mesh(geometry, material);
        this.mesh = mesh;
        // this.mesh = new THREE.Box3(
        //     THREE.Vector3(this.config.width/-2,this.config.height/-2,-0.5), 
        //     THREE.Vector3(this.config.width/2,this.config.height/2,0.5));
        this.mesh.translateOnAxis(new THREE.Vector3(this.config.x, this.config.y, this.config.z), 10);
        // this.mesh.rotateOnAxis(new THREE.Vector3(this.config.x, this.config.y, this.config.z), this.config.heading);
        JSVTS.Controller.plotter.scene.add(this.mesh);
    };

    function generateView() {

    }

    // configure this object if data was passed in
    this.init(options);
}