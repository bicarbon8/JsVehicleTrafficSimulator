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
module("Line Tests");
test("Horizontal Length Test", function() {
	var startLoc = new Point(0,2,0);
	var endLoc = new Point(3,2,0);
	var line = new Line(startLoc,endLoc);

	equal(line.GetLength(),3,"Expected a length of 3");
});

test("Horizontal Length Test From Right to Left", function() {
	var startLoc = new Point(3,2,0);
	var endLoc = new Point(0,2,0);
	var line = new Line(startLoc,endLoc);

	equal(line.GetLength(),3,"Expected a length of 3");
});

test("Horizontal Length Test Crossing Zero", function() {
	var startLoc = new Point(-2,2,0);
	var endLoc = new Point(3,2,0);
	var line = new Line(startLoc,endLoc);

	equal(line.GetLength(),5,"Expected a length of 5");
});

test("Vertical Length Test", function() {
	var startLoc = new Point(0,1,0);
	var endLoc = new Point(0,5,0);
	var line = new Line(startLoc,endLoc);

	equal(line.GetLength(),4,"Expected a length of 4");
});

test("Diagonal Length Test", function() {
	var startLoc = new Point(0,3,0);
	var endLoc = new Point(4,0,0);
	var line = new Line(startLoc,endLoc);

	equal(line.GetLength(),5,"Expected a length of 5");
});

test("Diagonal Length Test From Right to Left", function() {
	var startLoc = new Point(4,3,0);
	var endLoc = new Point(0,0,0);
	var line = new Line(startLoc,endLoc);

	equal(line.GetLength(),5,"Expected a length of 5");
});

test("Intersection Horizontal and Vertical", function() {
	var horizLine = new Line(new Point(0,5),new Point(10,5));
	var vertLine = new Line(new Point(5,0),new Point(5,10));

	ok(horizLine.IntersectsLine(vertLine),"Expected lines to intersect.");
});

test("No Intersection Horizontal and Vertical", function() {
	var horizLine = new Line(new Point(0,4),new Point(10,4));
	var vertLine = new Line(new Point(5,5),new Point(5,10));

	equal(horizLine.IntersectsLine(vertLine), false,"Expected lines to not intersect.");
});

test("No Intersection Diagonal", function() {
	var diagonal1 = new Line(new Point(1,1),new Point(3,3));
	var diagonal2 = new Line(new Point(2,1),new Point(5,3));

	equal(diagonal1.IntersectsLine(diagonal2), false,"Expected lines to not intersect.");
});

test("Horizontal Line Containing Point", function () {
	var horizLine = new Line(new Point(0,5),new Point(10,5));

	ok(horizLine.ContainsPoint(new Point(5,5)),"Expected Point to be on Line Segment.");
});

test("Horizontal Line Containing Point at End", function () {
	var horizLine = new Line(new Point(0,5),new Point(10,5));

	ok(horizLine.ContainsPoint(new Point(10,5)),"Expected Point to be on Line Segment.");
});

test("Horizontal Line NOT Containing Point Above it", function () {
	var horizLine = new Line(new Point(0,5),new Point(10,5));

	equal(horizLine.ContainsPoint(new Point(5,6)),false,"Expected Point to not be on Line Segment.");
});

test("Horizontal Line NOT Containing Point In Front of it", function () {
	var horizLine = new Line(new Point(0,5),new Point(10,5));

	equal(horizLine.ContainsPoint(new Point(-1,5)),false,"Expected Point to not be on Line Segment.");
});

test("Horizontal Line NOT Containing Point After it", function () {
	var horizLine = new Line(new Point(0,5),new Point(10,5));

	equal(horizLine.ContainsPoint(new Point(11,5)),false,"Expected Point to not be on Line Segment.");
});