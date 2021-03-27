JsVehicleTrafficSimulator ![build status](https://travis-ci.org/bicarbon8/JsVehicleTrafficSimulator.svg)
=========================

a vehicle roadway traffic simulator written in javascript, html and css.  rendering is done via the HTML5 canvas.

# RUNNING:

1. open the index.html file in your browser
2. use your left mouse button to rotate the map, right button to drag the map and scroll wheel to zoom

# DEMO
[index.html](http://rawgit.com/bicarbon8/JsVehicleTrafficSimulator/master/examples/index.html)

# BUILDING
- checkout the project
- run the following command from the project root: ```npm install```
- run the following command from the project root: ```grunt```
- a ```dist```directory will be generated containing the following:
  - jsvts.min.js ```a minified version of the framework that does not contain dependencies```
  - jsvts.min.js.map

# EXTERNAL DEPENDENCIES
- [three.js](http://github.com/mrdoob/three.js/)
- [three.js OrbitControls](http://threejs.org/examples/js/controls/OrbitControls.js)
- [Helvetiker Typeface](http://typeface.neocracy.org/)
