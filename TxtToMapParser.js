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
function TxtToMapParser(){
    this.ParseMapJson=function(jsonObj) {
        var map;

        if (jsonObj) {
            var scale = jsonObj.scale;
            map = new JSVTS.Map(scale);
            segments = this.ParseSegmentsJson(jsonObj.segments);
            for (var i=0; i<segments.length; i++) {
                map.AddSegment(segments[i]);
            }
        }

        return map;
    }

    this.ParseSegmentsJson=function(jsonObj) {
        var segments = [];
        for (var i=0; i<jsonObj.length; i++) {
            var seg = jsonObj[i];
            var start = new THREE.Vector3(seg.start.x,seg.start.y,seg.start.z);
            var end = new THREE.Vector3(seg.end.x,seg.end.y,seg.end.z);
            var segment = new JSVTS.Segment({
                "start": start,
                "end": end,
                "speedLimit": jsonObj[i].speedlimit,
                "name": jsonObj[i].roadname,
                "isInlet": jsonObj[i].isinlet
            });
            segments.push(segment);
        }

        return segments;
    }

    this.ParseStopLightsJson=function(jsonObj) {
        var stoplights = [];
        if (jsonObj && jsonObj.length) {
            for (var i=0; i<jsonObj.length; i++) {
                var changeSeconds = jsonObj[i].changeseconds;
                var startState = jsonObj[i].startstate;
                var loc = new THREE.Vector3(jsonObj[i].location.x,jsonObj[i].location.y,0);
                var sl = new StopLight(changeSeconds, startState);
                sl.Location = loc;

                stoplights.push(sl);
            }
        }

        return stoplights;
    }

    this.ParseVehiclesJson=function(jsonObj) {
        // TODO: implement
        return [];
    }
}