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
JSVTS.roadway = {
    "map":{
        "segments":[
            {
                "start":{
                    "x":16, // x axis is left/right
                    "y":0, // y axis is vertically up/down
                    "z":94 // z axis is horizontally up/down
                },
                "end":{
                    "x":194,
                    "y":0,
                    "z":94
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":194,
                    "y":0,
                    "z":94
                },
                "end":{
                    "x":194,
                    "y":0,
                    "z":6
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":194,
                    "y":0,
                    "z":6
                },
                "end":{
                    "x":16,
                    "y":0,
                    "z":6
                },
                "speedlimit":20,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":16,
                    "y":0,
                    "z":6
                },
                "end":{
                    "x":16,
                    "y":0,
                    "z":94
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":10,
                    "y":0,
                    "z":100
                },
                "end":{
                    "x":106,
                    "y":0,
                    "z":100
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":106,
                    "y":0,
                    "z":100
                },
                "end":{
                    "x":200,
                    "y":0,
                    "z":100
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":200,
                    "y":0,
                    "z":100
                },
                "end":{
                    "x":200,
                    "y":0,
                    "z":0
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /* begin top-most on ramp */
                "start":{
                    "x":200,
                    "y":-10,
                    "z":-6
                },
                "end":{
                    "x":150,
                    "y":-10,
                    "z":-6
                },
                "speedlimit":35,
                "roadname":"On Ramp",
                "tfc": {
                    "type":"stoplight",
                    "changeseconds":2,
                    "startstate":2
                },
                "generator": {
                    "delay":5
                },
                "isinlet":true,
                "ismergelane": false
            },
            {
                "start":{
                    "x":150,
                    "y":-10,
                    "z":-6
                },
                "end":{
                    "x":130,
                    "y":-5,
                    "z":-4
                },
                "speedlimit":35,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": true
            },
            {
                "start":{
                    "x":130,
                    "y":-5,
                    "z":-4
                },
                "end":{
                    "x":100,
                    "y":0,
                    "z":0
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": true
            }, /* end top-most on ramp */
            { /* start top-most lane */
                "start":{
                    "x":200,
                    "y":0,
                    "z":0
                },
                "end":{
                    "x":100,
                    "y":0,
                    "z":0
                },
                "speedlimit":20,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":100,
                    "y":0,
                    "z":0
                },
                "end":{
                    "x":10,
                    "y":0,
                    "z":0
                },
                "speedlimit":20,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            }, /* end top-most lane */
            {
                "start":{
                    "x":10,
                    "y":0,
                    "z":0
                },
                "end":{
                    "x":10,
                    "y":0,
                    "z":100
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":10,
                    "y":0,
                    "z":0
                },
                "end":{
                    "x":0,
                    "y":-10,
                    "z":100
                },
                "speedlimit":60,
                "roadname":"Exit Lane",
                "isinlet":false,
                "ismergelane": false
            },
            { /* begin bottom-most on ramp */
                "start":{
                    "x":10,
                    "y":-10,
                    "z":106
                },
                "end":{
                    "x":50,
                    "y":-10,
                    "z":106
                },
                "speedlimit":35,
                "roadname":"On Ramp",
                "tfc": {
                    "type":"stoplight",
                    "changeseconds":2,
                    "startstate":0
                },
                "generator": {
                    "delay":10
                },
                "isinlet":true,
                "ismergelane": false
            },
            {
                "start":{
                    "x":50,
                    "y":-10,
                    "z":106
                },
                "end":{
                    "x":75,
                    "y":-5,
                    "z":104
                },
                "speedlimit":35,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": true
            },
            {
                "start":{
                    "x":75,
                    "y":-5,
                    "z":104
                },
                "end":{
                    "x":106,
                    "y":0,
                    "z":100
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": true
            }, /* end bottom-most on ramp */
        ]
    }
}