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
module("Triangle Tests");
test("MoveTo Test", function() {
	var p1 = new Point(0,0,0);
	var p2 = new Point(1,1,0);
	var p3 = new Point(2,0,0);
	var tri = new Triangle(p1,p2,p3);

	var endLoc = new Point(1,1,0);
	tri.MoveTo(endLoc);
	deepEqual(tri.Location,endLoc,"Ensure moved location is correct.");
});
test("MoveTo Smaller Positive Test", function() {
	var p1 = new Point(0,0,0);
	var p2 = new Point(1,1,0);
	var p3 = new Point(2,0,0);
	var tri = new Triangle(p1,p2,p3);

	var endLoc = new Point(0,0,0);
	tri.MoveTo(endLoc);
	deepEqual(tri.Location,endLoc,"Ensure moved location is correct.");
});
test("MoveTo Negative Test", function() {
	var p1 = new Point(0,0,0);
	var p2 = new Point(1,1,0);
	var p3 = new Point(2,0,0);
	var tri = new Triangle(p1,p2,p3);

	var endLoc = new Point(-4,-4,0);
	tri.MoveTo(endLoc);
	deepEqual(tri.Location,endLoc,"Ensure moved location is correct.");
});