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
- run the following command from the project root: ```grunt```
- a ```dist```directory will be generated containing the following:
  - jsvts.min.js ```a minified version of the framework that does not contain dependencies```
  - jsvts-deps.min.js ```a minified version of the framework containing external dependencies```
  - js.map files for both of the above

# EXTERNAL DEPENDENCIES
- [three.js](http://github.com/mrdoob/three.js/) ```included```
- [three.js OrbitControls](http://threejs.org/examples/js/controls/OrbitControls.js) ```included```
- [Helvetiker Typeface](http://typeface.neocracy.org/) ```included```

# BUILD DEPENDENCIES
- [QUnit](http://qunitjs.com/) ```included```
- [QUnitParameterized](https://github.com/AStepaniuk/qunit-parameterize) ```included```
- [GruntJs](http://gruntjs.com/)
- [NodeJs](http://nodejs.org/) ```v0.10```
- [PhantomJs](http://phantomjs.org/)
