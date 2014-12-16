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
JSVTS.Clock = function (options) {
    this.domElement = null;
    this.startTime = new Date().getTime();

    this.init(options);
};

JSVTS.Clock.prototype.init = function (options) {
    this.domElement = document.createElement('div');
    this.domElement.id = 'jsvtsClock';
    this.domElement.style.cssText = "padding: 0px 0px 3px 3px; text-align: left; background-color: rgb(0, 0, 34);";
    var simulationTimeDiv = document.createElement('div');
    simulationTimeDiv.id = 'jsvtsClockSimulation';
    simulationTimeDiv.style.cssText = "color: rgb(0, 255, 255); font-family: Helvetica, Arial, sans-serif; font-size: 9px; font-weight: bold; line-height: 15px;";
    this.domElement.appendChild(simulationTimeDiv);
    var realTimeDiv = document.createElement('div');
    realTimeDiv.id = 'jsvtsClockReal';
    realTimeDiv.style.cssText = "color: rgb(0, 255, 255); font-family: Helvetica, Arial, sans-serif; font-size: 9px; font-weight: bold; line-height: 15px;";
    this.domElement.appendChild(realTimeDiv);
};

JSVTS.Clock.prototype.update = function () {
    this.domElement.querySelector('#jsvtsClockSimulation').innerHTML = this.convertMsToHumanReadable(JSVTS.totalElapsedTime);
    this.domElement.querySelector('#jsvtsClockReal').innerHTML = this.convertMsToHumanReadable(new Date().getTime() - this.startTime);
};

JSVTS.Clock.prototype.convertMsToHumanReadable = function (elapsedMs) {
    var x = elapsedMs / 1000;
    var seconds = parseFloat(Math.round((x % 60) * 100) / 100).toFixed(2);
    x /= 60;
    var minutes = Math.floor(x % 60);
    x /= 60;
    var hours = Math.floor(x % 24);

    var elapsedReadable = hours + ":" + minutes + ":" + seconds;

    return elapsedReadable;
};