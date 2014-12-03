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
                    "x":200,
                    "y":0,
                    "z":25
                },
                "end":{
                    "x":200,
                    "y":0,
                    "z":200
                },
                "speedlimit":25,
                "roadname":"Road 1 Southbound",
                "tfc":{
                    "type":"stoplight",
                    "changeseconds":60,
                    "startstate":0
                },
                "generator": {
                    "delay":5
                },
                "isinlet":true,
                "ismergelane":false
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
                    "z":206
                },
                "speedlimit":25,
                "roadname":"Road 1 Southbound",
                "isinlet":false,
                "ismergelane":false
            },
            {
                "start":{
                    "x":200,
                    "y":0,
                    "z":206
                },
                "end":{
                    "x":200,
                    "y":0,
                    "z":300
                },
                "speedlimit":25,
                "roadname":"Road 1 Southbound",
                "isinlet":false,
                "ismergelane":false
            },
            {
                "start":{
                    "x":206,
                    "y":0,
                    "z":300
                },
                "end":{
                    "x":206,
                    "y":0,
                    "z":206
                },
                "speedlimit":25,
                "roadname":"Road 1 Northbound",
                "tfc":{
                    "type":"stoplight",
                    "changeseconds":60,
                    "startstate":0
                },
                "generator": {
                    "delay":5
                },
                "isinlet":true,
                "ismergelane":false
            },
            {
                "start":{
                    "x":206,
                    "y":0,
                    "z":206
                },
                "end":{
                    "x":206,
                    "y":0,
                    "z":200
                },
                "speedlimit":25,
                "roadname":"Road 1 Northbound",
                "isinlet":false,
                "ismergelane":false
            },
            {
                "start":{
                    "x":206,
                    "y":0,
                    "z":200
                },
                "end":{
                    "x":206,
                    "y":0,
                    "z":25
                },
                "speedlimit":25,
                "roadname":"Road 1 Northbound",
                "isinlet":false,
                "ismergelane":false
            },
            {
                "start":{
                    "x":25,
                    "y":0,
                    "z":206
                },
                "end":{
                    "x":200,
                    "y":0,
                    "z":206
                },
                "speedlimit":35,
                "roadname":"Road 2 Eastbound",
                "tfc":{
                    "type":"stoplight",
                    "changeseconds":60,
                    "startstate":2
                },
                "generator": {
                    "delay":5
                },
                "isinlet":true,
                "ismergelane":false
            },
            {
                "start":{
                    "x":200,
                    "y":0,
                    "z":206
                },
                "end":{
                    "x":206,
                    "y":0,
                    "z":206
                },
                "speedlimit":35,
                "roadname":"Road 2 Eastbound",
                "isinlet":false,
                "ismergelane":false
            },
            {
                "start":{
                    "x":206,
                    "y":0,
                    "z":206
                },
                "end":{
                    "x":300,
                    "y":0,
                    "z":206
                },
                "speedlimit":35,
                "roadname":"Road 2 Eastbound",
                "isinlet":false,
                "ismergelane":false
            },
            {
                "start":{
                    "x":300,
                    "y":0,
                    "z":200
                },
                "end":{
                    "x":206,
                    "y":0,
                    "z":200
                },
                "speedlimit":35,
                "roadname":"Road 2 Westbound",
                "tfc":{
                    "type":"stoplight",
                    "changeseconds":60,
                    "startstate":2
                },
                "generator": {
                    "delay":5
                },
                "isinlet":true,
                "ismergelane":false
            },
            {
                "start":{
                    "x":206,
                    "y":0,
                    "z":200
                },
                "end":{
                    "x":200,
                    "y":0,
                    "z":200
                },
                "speedlimit":35,
                "roadname":"Road 2 Westbound",
                "isinlet":false,
                "ismergelane":false
            },
            {
                "start":{
                    "x":200,
                    "y":0,
                    "z":200
                },
                "end":{
                    "x":25,
                    "y":0,
                    "z":200
                },
                "speedlimit":35,
                "roadname":"Road 2 Westbound",
                "isinlet":false,
                "ismergelane":false
            }
        ]
    }
}