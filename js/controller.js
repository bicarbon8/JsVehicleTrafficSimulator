var JSVTS = JSVTS || {};
JSVTS.Controller = {
	plotter       : null,
    canvas        : null,
    map           : null,
    keepMoving    : false,
    LANE_ID_COUNT : 0,
    SEG_ID_COUNT  : 0,
    TFC_ID_COUNT  : 0,
    startTime     : 0,
    workers       : [],
    MAX_THREADS   : 1,
    up            : null,

    init: function () {
        JSVTS.Controller.InitPageElements();
        JSVTS.Controller.InitObjects();
    },
    
    InitPageElements: function () {
        var w = window,
            d = document,
            e = d.documentElement,
            b = d.querySelector('body'),
            x = w.innerWidth || e.clientWidth || b.clientWidth,
            y = w.innerHeight|| e.clientHeight|| b.clientHeight;
        JSVTS.Controller.docWidth = x; // window.innerWidth;
        JSVTS.Controller.docHeight = y; // window.innerHeight;
        // JSVTS.Controller.SizePositionElement('div_Controls',JSVTS.Controller.docWidth-20,200,0,JSVTS.Controller.docHeight-200);
        w.addEventListener("keypress", JSVTS.Controller.handleKeypress, false);
    },
    
    InitObjects: function () {
        JSVTS.Controller.up = new THREE.Vector3(0, 1, 0);
        JSVTS.Controller.map = new JSVTS.Map();
        JSVTS.Controller.plotter = new JSVTS.Plotter('viewport');
        JSVTS.Controller.render();
    },

    handleKeypress: function(ev) {
        // console.log(ev.charCode);
        switch (ev.charCode) {
            case 'x'.charCodeAt(0):
                JSVTS.Controller.reset();
                break;
            case 's'.charCodeAt(0):
                JSVTS.Controller.ToggleSimulationState();
                break;
            case 'a'.charCodeAt(0):
                JSVTS.Controller.AddVehicles();
                break;
            case 'l'.charCodeAt(0):
                JSVTS.Controller.SetFromJson();
                break;
            default:
                // do nothing
        }
    },

    reset: function () {
        var canvas = document.querySelector('canvas');
        if (canvas) {
            document.querySelector('body').removeChild(canvas);
        }
        JSVTS.Controller.plotter = null;
        JSVTS.Controller.map = null;
        JSVTS.Controller.init();
    },

    render: function () {
        JSVTS.Controller.plotter.render();
    },
    
    ToggleSimulationState: function (){
        if(JSVTS.Controller.keepMoving){
            JSVTS.Controller.keepMoving=false;
        } else{
            JSVTS.Controller.keepMoving=true;
            JSVTS.Controller.Move();
        }
    },
    
    Move: function () {
        JSVTS.Mover.move(250, JSVTS.Controller.map);
        JSVTS.Controller.render();

        if (JSVTS.Controller.keepMoving) {
            requestAnimationFrame(JSVTS.Controller.Move);
        }
    },
    
    SetFromJson: function (){
        // var input=document.querySelector('#tbox_Xml').value;
        // var jsonObj = JSON.parse(input);
        var jsonObj = jsonMap;
        JSVTS.Controller.map=new TxtToMapParser().ParseMapJson(jsonObj.map);
        for (var key in JSVTS.Controller.map._segments) {
            var ss = JSVTS.Controller.map._segments[key];
            for (var i in ss) {
                var segment = ss[i];
                JSVTS.Controller.plotter.scene.add(segment.mesh);
            }
        }
        JSVTS.Controller.plotter.render();
    },
    
    GetAsJson: function (){
        var output=$('#tbox_Xml');
        var mapJsonStr=new TxtToMapParser().GetMapJson(JSVTS.Controller.map);
        output.val(mapJsonStr);
    },
    
    AddSegment: function (){
        var foundRoad=false;
        for(var i=0;i<map.Roads.length;i++){
            var segmentStartValues=$('#tbox_SegmentStart').val().split(",");
            var segmentEndValues=$('#tbox_SegmentEnd').val().split(",");
            var segmentSpeedLimit=parseFloat($('#tbox_RoadSpeed').val());

            var segment = new Segment(new Point(
                parseFloat(segmentStartValues[0]),parseFloat(segmentStartValues[1])),
                new Point(parseFloat(segmentEndValues[0]),parseFloat(segmentEndValues[1])));
            segment.SpeedLimit = segmentSpeedLimit;

            // add to Lane
            map.AddSegment(segment);
        }
        JSVTS.Controller.plotter.DrawRoads(map);
    },
    
    AddStopLight: function (){
        var foundRoad=false;
        var foundLane=false;
        for(var i=0;i<map.Roads.length;i++){
            var roadName=document.getElementById("tbox_RoadName").value;
            if(roadName==map.Roads[i].Name){
                var foundLane=false;
                for(var j=0;j<map.Roads[i].Lanes.length;j++){
                    var laneName=document.getElementById("tbox_LaneName").value;
                    if(laneName==map.Roads[i].Lanes[j].Name){
                        var stopLightLocation=document.getElementById("tbox_StopLightLocation").value.split(",");
                        var stopLightDuration=document.getElementById("tbox_StopLightDuration").value;
                        var stopLightState=document.getElementById("opt_StopLightState").value;
                        var state=null;
                        switch(stopLightState){
                            case "Green":
                                state=new StopLightState().Green;
                                break;
                            case "Yellow":
                                state=new StopLightState().Yellow;
                                break;
                            case "Red":
                                state=new StopLightState().Red;
                                break;
                        }
                        var stopLight=new StopLight(parseFloat(stopLightDuration),state);
                        stopLight.Location=new Point(parseFloat(stopLightLocation[0]),
                            parseFloat(stopLightLocation[1]));
                        map.Roads[i].Lanes[j].AddStopLight(stopLight);
                        foundLane=true;
                        foundRoad=true;
                    }
                }
            }
        }
        if(!foundRoad || !foundLane){
            AddLane();
            AddStopLight();
        }
        JSVTS.Controller.plotter.DrawVehicles(map);
        JSVTS.Controller.plotter.DrawStopLights(map,new Date().getTime() - startTime);
    },
    
    UpdateMapScale: function (offset){
        var scalarInput = $('#tbox_MapScale');
        var scaleOffset = 0;
        if (offset) {
            scaleOffset = offset;
        }
        var scale = parseFloat(scalarInput.val()) || 0;
        scale += scaleOffset;
        if (scale <= 0) { scale = 1; }
        scalarInput.val(scale);
        if(map){
            JSVTS.Controller.map.Scale=scale;
            JSVTS.Controller.plotter.drawAll(map,map.TotalElapsedTime);
        }
    },

    UpdateThreads: function () {
        var threads = parseInt($('#tbox_Threads').val());
        if (isNaN(threads) === false) {
            JSVTS.Controller.MAX_THREADS = threads;
            JSVTS.Controller.ToggleSimulationState(); // kills all threads
            JSVTS.Controller.ToggleSimulationState(); // restarts with new thread allocation
        }
    },
    
    AddVehicles: function (){
        var segments = JSVTS.Controller.map.GetSegments();
        if (segments && segments.length > 0) {
            segments.forEach(function (segment) {
                if (segment.config.isInlet) {
                    var vehicle=new JSVTS.Vehicle();
                    segment.attachVehicle(vehicle);
                    JSVTS.Controller.map.AddVehicle(vehicle);
                    JSVTS.Controller.plotter.scene.add(vehicle.mesh);
                }
            });
        } else {
            var vehicle = new JSVTS.Vehicle();
            JSVTS.Controller.map.AddVehicle(vehicle);
            JSVTS.Controller.plotter.scene.add(vehicle.mesh);
        }

        JSVTS.Controller.plotter.render();
    },
    
    SetPoint: function (){
        var xPos=0;
        var yPos=0;
        xPos = event.clientX;
        yPos = event.clientY;
        if(map!=null){
            var s = Math.round(xPos/map.Scale) + ',' + Math.round(yPos/map.Scale);
        } else{
            var s = Math.round(xPos) + ',' + Math.round(yPos);
        }
        if(CaptureStart){
            document.getElementById("tbox_SegmentStart").value=s;
        } else if(CaptureEnd){
            document.getElementById("tbox_SegmentEnd").value=s;
        } else if(CaptureLight){
            document.getElementById("tbox_StopLightLocation").value=s;
        }                
    }
}