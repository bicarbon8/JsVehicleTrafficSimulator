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
var jsonMap = {
    "map":{
        "scale":1,
        "segments":[
            {
                "start":{
                    "x":16, // x axis is left/right
                    "y":0, // y axis is vertically up/down
                    "z":194 // z axis is horizontally up/down
                },
                "end":{
                    "x":194,
                    "y":0,
                    "z":194
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            },
            {
                "start":{
                    "x":194,
                    "y":0,
                    "z":194
                },
                "end":{
                    "x":194,
                    "y":0,
                    "z":106
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            },
            {
                "start":{
                    "x":194,
                    "y":0,
                    "z":106
                },
                "end":{
                    "x":16,
                    "y":0,
                    "z":106
                },
                "speedlimit":20,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            },
            {
                "start":{
                    "x":16,
                    "y":0,
                    "z":106
                },
                "end":{
                    "x":16,
                    "y":0,
                    "z":194
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            },
            {
                "start":{
                    "x":10,
                    "y":0,
                    "z":200
                },
                "end":{
                    "x":106,
                    "y":0,
                    "z":200
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            },
            {
                "start":{
                    "x":106,
                    "y":0,
                    "z":200
                },
                "end":{
                    "x":200,
                    "y":0,
                    "z":200
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            },
            {
                "start":{
                    "x":200,
                    "y":0,
                    "z":200
                },
                "end":{
                    "x":200,
                    "y":0,
                    "z":100
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            },
            {
                "start":{
                    "x":200,
                    "y":0,
                    "z":100
                },
                "end":{
                    "x":10,
                    "y":0,
                    "z":100
                },
                "speedlimit":20,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            },
            {
                "start":{
                    "x":10,
                    "y":0,
                    "z":100
                },
                "end":{
                    "x":10,
                    "y":0,
                    "z":200
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            },
            {
                "start":{
                    "x":10,
                    "y":0,
                    "z":200
                },
                "end":{
                    "x":10,
                    "y":0,
                    "z":206
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            },
            {
                "start":{
                    "x":10,
                    "y":0,
                    "z":206
                },
                "end":{
                    "x":50,
                    "y":0,
                    "z":206
                },
                "speedlimit":35,
                "roadname":"On Ramp",
                "stoplight": {
                    "location":{
                        "x":50,
                        "y":0,
                        "z":206
                    },
                    "changeseconds":5,
                    "startstate":0
                },
                "isinlet":true
            },
            {
                "start":{
                    "x":50,
                    "y":0,
                    "z":206
                },
                "end":{
                    "x":100,
                    "y":0,
                    "z":206
                },
                "speedlimit":35,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            },
            {
                "start":{
                    "x":100,
                    "y":0,
                    "z":206
                },
                "end":{
                    "x":106,
                    "y":0,
                    "z":200
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false
            }
        ]
    }
}