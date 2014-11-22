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
JSVTS.SEG_OPTIONS = {
    start: THREE.Vector3(-10,0,0),
    end: THREE.Vector3(10,0,0),
    isInlet: false,
    name: '',
    speedLimit: 30, // Km/h
};
JSVTS.Segment = function(options){
    this.Id=null;
    this.config = JSVTS.SEG_OPTIONS;
    this.LaneChangeLines=[];

    this.Initialize=function(options) {
        this.Id = JSVTS.SEG_ID_COUNT++;
        for (var optionKey in this.config) { 
            this.config[optionKey] = options[optionKey];
        }
        this.generateMesh();

        // build the "tendrils" that allow for lane changes
        // this.GenerateLaneChangeLines();
    }
    
    this.AttachVehicle=function(vehicle) {
        // set the vehicle's heading
        vehicle.Heading = this.GetHeading();
        vehicle.DesiredVelocity = this.SpeedLimit;
        vehicle.Location = this.Start;
        vehicle.SegmentId = this.Id;

        return vehicle;
    }

    this.GetHeading=function(){
        var heading=0;
        if(this.Start!=null && this.End!=null){
            var y=(this.End.Y-this.Start.Y);
            var x=(this.End.X-this.Start.X);
            var radians=Math.atan2(y,x);
            heading=(radians*(180/Math.PI));
        }
        
        return heading;
    }

    this.GetStopLights=function() {
        return this._stopLights;
    }

    this.AddStoplight=function(stoplight) {
        this._stopLights.push(stoplight);
    }

    this.GenerateLaneChangeLines=function() {
        var distance = 5; // separate lines by this much distance of segment
        var length = this.GetLength();
        var heading = this.Heading();
        var alternator = -1;

        for (var i=0; i<length; i+=distance) {
            var x1=Math.cos(heading*(Math.PI/180))*i;
            var y1=Math.sin(heading*(Math.PI/180))*i;
            var x2=Math.cos(heading*(Math.PI/180))*(i+(distance*2));
            var y2=Math.sin(heading*(Math.PI/180))*(i+(distance*2));
            var p1 = new Point(this.Start.X,this.Start.Y);
            p1.MoveBy(new Point(x1,y1));
            var p2 = new Point(this.Start.X,this.Start.Y);
            p2.MoveBy(new Point(x2,y2));
            
            var line = new Line(p1, p2);
            // rotate to 90 and -90 alternating each step
            line.Rotate((90*alternator), p1);
            alternator*=-1; // reverse polarity

            this.LaneChangeLines.push(line);
        }
    };

    this.generateMesh = function () {
        var material = new THREE.LineBasicMaterial({
            color: 0x0000ff,
            wireframe: true
        });

        var geometry = new THREE.Geometry();
        geometry.vertices.push(
            this.config.start,
            this.config.end
        );

        var line = new THREE.Line( geometry, material );
        this.mesh = line;
        JSVTS.Controller.plotter.scene.add(this.mesh);
    }

    this.Initialize(options);
}