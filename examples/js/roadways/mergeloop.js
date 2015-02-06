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
JSVTS.roadways = JSVTS.roadways || [];
JSVTS.roadways.push({
    "map":{
        "segments":[
            { /** inner-bottom **/
                "start":{
                    "x":33, // x axis is left/right
                    "y":0, // y axis is vertically up/down
                    "z":97 // z axis is horizontally up/down
                },
                "end":{
                    "x":177, // 194
                    "y":0,
                    "z":97
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":177,
                    "y":0,
                    "z":97
                },
                "end":{
                    "x":197,
                    "y":0,
                    "z":77
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /** inner-right **/
                "start":{
                    "x":197,
                    "y":0,
                    "z":77 // 94
                },
                "end":{
                    "x":197,
                    "y":0,
                    "z":23 // 6
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":197,
                    "y":0,
                    "z":23
                },
                "end":{
                    "x":177,
                    "y":0,
                    "z":3
                },
                "speedlimit":45,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /** inner-top **/
                "start":{
                    "x":177, // 194
                    "y":0,
                    "z":3
                },
                "end":{
                    "x":33, // 16
                    "y":0,
                    "z":3
                },
                "speedlimit":20,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":33,
                    "y":0,
                    "z":3
                },
                "end":{
                    "x":13,
                    "y":0,
                    "z":23
                },
                "speedlimit":45,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /** inner-left **/
                "start":{
                    "x":13,
                    "y":0,
                    "z":23 // 6
                },
                "end":{
                    "x":13,
                    "y":0,
                    "z":77 // 94
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            {
                "start":{
                    "x":13,
                    "y":0,
                    "z":77
                },
                "end":{
                    "x":33,
                    "y":0,
                    "z":97
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /** outer-bottom 01 **/
                "start":{
                    "x":30, // 10,
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
            { /** outer-bottom 02 **/
                "start":{
                    "x":106,
                    "y":0,
                    "z":100
                },
                "end":{
                    "x":180, // 200,
                    "y":0,
                    "z":100
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /** outer-bottom-right corner **/
                "start":{
                    "x":180,
                    "y":0,
                    "z":100
                },
                "end":{
                    "x":200,
                    "y":0,
                    "z":80
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /** outer-right **/
                "start":{
                    "x":200,
                    "y":0,
                    "z":80 // 100
                },
                "end":{
                    "x":200,
                    "y":0,
                    "z":20 // 0
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /* outer-top-right corner */
                "start":{
                    "x":200,
                    "y":0,
                    "z":20 // 0
                },
                "end":{
                    "x":180,
                    "y":0,
                    "z":0
                },
                "speedlimit":45,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /** outer-top 01 **/
                "start":{
                    "x":180, // 200,
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
            { /** outer-top 02 **/
                "start":{
                    "x":100,
                    "y":0,
                    "z":0
                },
                "end":{
                    "x":30, // 10,
                    "y":0,
                    "z":0
                },
                "speedlimit":20,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /** outer-top-left corner **/
                "start":{
                    "x":30,
                    "y":0,
                    "z":0
                },
                "end":{
                    "x":10,
                    "y":0,
                    "z":20
                },
                "speedlimit":45,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /** outer-left **/
                "start":{
                    "x":10,
                    "y":0,
                    "z":20, // 0
                },
                "end":{
                    "x":10,
                    "y":0,
                    "z":80 // 100
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /** exit lane **/
                "start":{
                    "x":10,
                    "y":0,
                    "z":20
                },
                "end":{
                    "x":-20,
                    "y":-10,
                    "z":100
                },
                "speedlimit":60,
                "roadname":"Exit Lane",
                "isinlet":false,
                "ismergelane": false
            },
            { /** outer-bottom-left corner **/
                "start":{
                    "x":10,
                    "y":0,
                    "z":80
                },
                "end":{
                    "x":30,
                    "y":0,
                    "z":100
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":false,
                "ismergelane": false
            },
            { /* begin bottom-most on ramp */
                "start":{
                    "x":20,
                    "y":-10,
                    "z":120
                },
                "end":{
                    "x":50,
                    "y":-10,
                    "z":110
                },
                "speedlimit":35,
                "roadname":"On Ramp 1",
                "tfc": {
                    "type":"stoplight",
                    "greenduration":1,
                    "redduration":5,
                    "yellowduration":0,
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
                    "z":110
                },
                "end":{
                    "x":75,
                    "y":-5,
                    "z":104
                },
                "speedlimit":35,
                "roadname":"Jason Ave. N.",
                "isinlet":true,
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
                "isinlet":true,
                "ismergelane": true
            },
            {
                "start":{
                    "x":20,
                    "y":-10,
                    "z":124
                },
                "end":{
                    "x":50,
                    "y":-10,
                    "z":113
                },
                "speedlimit":35,
                "roadname":"On Ramp 2",
                "tfc": {
                    "type":"stoplight",
                    "greenduration":1,
                    "redduration":5,
                    "yellowduration":0,
                    "startstate":2
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
                    "z":113
                },
                "end":{
                    "x":75,
                    "y":-5,
                    "z":107
                },
                "speedlimit":35,
                "roadname":"Jason Ave. N.",
                "isinlet":true,
                "ismergelane": true
            },
            {
                "start":{
                    "x":75,
                    "y":-5,
                    "z":107
                },
                "end":{
                    "x":106,
                    "y":0,
                    "z":100
                },
                "speedlimit":60,
                "roadname":"Jason Ave. N.",
                "isinlet":true,
                "ismergelane": true
            },/* end bottom-most on ramp */
            { /* begin top-most on ramp */
                "start":{
                    "x":190,
                    "y":-10,
                    "z":-20
                },
                "end":{
                    "x":150,
                    "y":-10,
                    "z":-10
                },
                "speedlimit":35,
                "roadname":"On Ramp 0",
                "tfc": {
                    "type":"stoplight",
                    "greenduration":1,
                    "redduration":5,
                    "yellowduration":0,
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
                    "z":-10
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
        ]
    }
});