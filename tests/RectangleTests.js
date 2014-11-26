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
module("Rectangle Tests");
test("MoveTo Test", function() {
	var startLoc = new Point(2,2,0);
	var rect = new Rectangle(4,4,startLoc);
	deepEqual(rect.Location,startLoc,"Ensure starting location is where expected.");

	var endLoc = new Point(4,4,0);
	rect.MoveTo(endLoc);
	deepEqual(rect.Location,endLoc,"Ensure end location is where expected.");
	equal(rect.Points[0].X,2,"Ensure First point.X moved to expected location.");
	equal(rect.Points[0].Y,6,"Ensure First point.Y moved to expected location.");
	// TODO: check for Z coordinate handling
});
test("MoveTo Smaller Positive Test", function() {
	var startLoc = new Point(2,2,0);
	var rect = new Rectangle(4,4,startLoc);
	deepEqual(rect.Location,startLoc,"Ensure starting location is where expected.");

	var endLoc = new Point(1,1,0);
	rect.MoveTo(endLoc);
	deepEqual(rect.Location,endLoc,"Ensure end location is where expected.");
	equal(rect.Points[0].X,-1,"Ensure First point.X moved to expected location.");
	equal(rect.Points[0].Y,3,"Ensure First point.Y moved to expected location.");
	// TODO: check for Z coordinate handling
});
test("MoveTo Negative Test", function() {
	var startLoc = new Point(2,2,0);
	var rect = new Rectangle(4,4,startLoc);
	deepEqual(rect.Location,startLoc,"Ensure starting location is where expected.");

	var endLoc = new Point(-4,-4,0);
	rect.MoveTo(endLoc);
	deepEqual(rect.Location,endLoc,"Ensure end location is where expected.");
	equal(rect.Points[0].X,-6,"Ensure First point.X moved to expected location.");
	equal(rect.Points[0].Y,-2,"Ensure First point.Y moved to expected location.");
	// TODO: check for Z coordinate handling
});
test("GetCenterPoint Test", function() {
	var rect = new Rectangle(4,4,new Point(0,0,0));
	deepEqual(rect.GetCenterPoint(),new Point(0,0,0),"Ensure center point is where specified.");
});