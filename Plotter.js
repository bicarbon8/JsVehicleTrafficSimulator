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
function Plotter(canvas){
    this.LaneThickness=2;
    this.RoadColor="#808080";
    this.canvas=canvas;

    this.drawAll=function(map,elapsedMilliseconds) {
        this.DrawSegments(map);
        this.DrawVehicles(map.GetVehicles(), map.Scale);
        this.DrawStopLights(map,elapsedMilliseconds);
    }
    
    this.DrawVehicles=function(vehicles, scale){
        // clear all vehicles
        this.Clear('vehicle');
        this.Clear('view');

        // for each vehicle in the map
        for(var i=0;i<vehicles.length;i++){
            var vehicle=vehicles[i];
            var color="#ff0000"; // red
            if(vehicle.Velocity>=1 && vehicle.Velocity<=10){
                color="#ff9900"; // orange
            } else{
                if(vehicle.Velocity>10 && vehicle.Velocity<=30){
                    color="#ffff00"; // yellow
                } else{
                    if(vehicle.Velocity>30 && vehicle.Velocity<=60){
                        color="#33cc00"; // green
                    } else{
                        if(vehicle.Velocity>60){
                            color="#33cccc";
                        }
                    }
                }
            }
            
            // draw the vehicle on the canvas
            // this.DrawShape('view',vehicle.GetViewArea(),"#ffff00",null,null,true,map.Scale);
            var v = new Vehicle(vehicle);
            this.DrawShape('vehicle',v.GetBoundingBox(),color,"#000000",1,true,scale);
        }
    }

    this.DrawStopLights=function(map,elapsedMilliseconds){
        var segments = map.GetSegments();

        // clear all stopLight elements and redraw
        this.Clear("stoplights");

        for(var i=0;i<segments.length;i++){
            var segment = segments[i];
            for (var j=0; j<segment._stopLights.length; j++) {
                var sl = segment._stopLights[j];
                var color="#33cc00"; // Green
                if(sl.GetState(elapsedMilliseconds/1000)==new StopLightState().Red){
                    color="#ff0000"; // Red
                } else{
                    if(sl.GetState(elapsedMilliseconds/1000)==new StopLightState().Yellow){
                        color="#ffff00"; // Yellow
                    }
                }
                
                this.DrawPoint("stoplights",sl.Location,2,color,null,1,map.Scale);
            }
        }
    }

    this.DrawSegments=function(map){
        var segments = map.GetSegments();
        // clear the existing road
        this.Clear("roads");
        
        for(var i=0;i<segments.length;i++){
            var lane={"Points":new Array()};
            var segment=segments[i];
            lane.Points.push(segment.Start);
            lane.Points.push(segment.End);
            this.DrawShape("roads",lane,null,
                this.RoadColor,this.LaneThickness*map.Scale,false,map.Scale);
            // this.DrawLaneChangeLines(segments[i],map);
        }
    }
    this.DrawLaneChangeLines=function(segment,map) {
        for(var i=0;i<segment.LaneChangeLines.length;i++){
            var lane={"Points":new Array()};
            var line=segment.LaneChangeLines[i];
            lane.Points.push(line.Start);
            lane.Points.push(line.End);
            this.DrawShape("roads",lane,null,
                "#ff6666",1*map.Scale,false,map.Scale);
        }
    }

    this.DrawPoint=function(elementId,center,radius,fillColor,edgeColor,edgeThickness,scale){
        if(center!=undefined && center!=null){
            var drawEdge=false;
            var drawFill=false;
            var shapeScale=1;
            if(fillColor!=undefined && fillColor!=null){
                drawFill=true;
            }
            if(edgeColor!=undefined && edgeColor!=null){
                drawEdge=true;
            } else{
                edgeColor="#000000";
            }
            if(edgeThickness!=undefined && edgeThickness!=null){
                drawEdge=true;
            } else{
                edgeThickness=1;
            }
            if(scale!=undefined && scale!=null){
                shapeScale=scale;
            }
            options = {
                "layer": true,
                "group": elementId,
                "x": center.X*scale,
                "y": center.Y*scale,
                "radius": radius*scale
            }
            if(drawFill){
                options["fillStyle"]=fillColor;
            }
            if(drawEdge){
                options["strokeStyle"]=edgeColor;
                options["strokeWidth"]=edgeThickness;
            }
            this.canvas.drawArc(options);
        }
    }

    this.DrawShape=function(elementId,shape,fillColor,edgeColor,edgeThickness,close,scale){
        if(shape && shape.Points){
            var drawEdge=false;
            var drawFill=false;
            var shapeScale=1;
            if(fillColor){
                drawFill=true;
            }
            if(edgeColor){
                drawEdge=true;
            } else{
                edgeColor="#000000";
            }
            if(edgeThickness){
                drawEdge=true;
            } else{
                edgeThickness=1;
            }
            if(scale){
                shapeScale=scale;
            }
            
            // ensure we have more than just a line
            if(shape.Points.length>1) {
                // define the lines
                // var lineStr = "M "+shape.Points[0].X*shapeScale+" "+shape.Points[0].Y*shapeScale;
                // for(var i=1;i<shape.Points.length;i++){
                //     lineStr += "L "+shape.Points[i].X*shapeScale+" "+shape.Points[i].Y*shapeScale;
                // }
                var options = {
                    "layer": true,
                    "group": elementId
                };
                for (var i=0; i<shape.Points.length; i++) {
                    options['x'+(i+1)] = shape.Points[i].X*scale;
                    options['y'+(i+1)] = shape.Points[i].Y*scale;
                }
                
                if(close){
                    options["closed"] = true;
                }

                if(drawFill){
                    options["fillStyle"]=fillColor;
                }
                if(drawEdge){
                    options["strokeStyle"]=edgeColor;
                    options["strokeWidth"]=edgeThickness;
                }

                this.canvas.drawLine(options);
            }
        }
    }

    this.Clear=function(elementId){
        canvas.removeLayerGroup(elementId);
        canvas.drawLayers();
    }
}