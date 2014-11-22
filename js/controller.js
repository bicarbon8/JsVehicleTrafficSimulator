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
    },
    
    InitObjects: function () {
        JSVTS.Controller.map = new GraphMap(1);
        JSVTS.Controller.plotter = new JSVTS.Plotter('viewport');
        JSVTS.Controller.render();
    },

    initListeners: function() {
        window.addEventListener("keypress", JSVTS.Controller.handleKeypress, false);
    },

    handleKeypress: function(ev) {
        // console.log(ev.charCode);
        switch (ev.charCode) {
            case 'd'.charCodeAt(0):
                JSVTS.Controller.toggleDebugInfo();
                break;
            case 's'.charCodeAt(0):
                JSVTS.Controller.ToggleSimulationState();
                break;
            case 'a'.charCodeAt(0):
                JSVTS.Controller.AddVehicles();
                break;
            default:
                // do nothing
        }
    },

    reset: function () {
        var canvas = document.querySelector('canvas');
        document.querySelector('body').removeChild(canvas);
        JSVTS.Controller.plotter = null;
        JSVTS.Controller.map = null;
    },

    render: function () {
        JSVTS.Controller.plotter.drawAll(JSVTS.Controller.map, new Date().getTime() - JSVTS.Controller.startTime);
    },

    /**
     * function will resize and position an element with an
     * ID matching the passed in elementIdStr
     * @param {String} elementIdStr the ID of the element to resize and reposition
     * @param {int} width        the integer width to make the element
     * @param {int} height       the integer height to make the element
     * @param {int} xPos         the integer location within the window to place the element's left edge
     * @param {int} yPos         the integer location within the window to place the element's top edge
     */
    SizePositionElement: function (elementIdStr,width,height,xPos,yPos) {
        var eleObj = document.querySelector('#'+elementIdStr);
        eleObj.style.width = width+"px";
        eleObj.style.height = height+"px";
        eleObj.style.position = 'absolute';
        eleObj.style.top = yPos+"px";
        eleObj.style.left = xPos+"px";
    },
    
    ToggleSimulationState: function (){
        if(JSVTS.Controller.keepMoving){
            JSVTS.Controller.keepMoving=false;
            for (var i in JSVTS.Controller.workers) {
                JSVTS.Controller.workers[i].terminate();
                delete JSVTS.Controller.workers[i];
            }
            JSVTS.Controller.workers = [];
        } else{
            JSVTS.Controller.keepMoving=true;
            JSVTS.Controller.startTime = new Date().getTime();
            JSVTS.Controller.Move();
        }
    },
    
    Move: function () {
        while (JSVTS.Controller.workers.length < JSVTS.Controller.MAX_THREADS) {
            worker = new Worker("MoverWorker.js");
            worker.onmessage = function (event) {
                var vehicle = JSON.parse(event.data);
                var v = new JSVTS.Vehicle(vehicle);
                $('#tbox_ElapsedTime').val(v.ElapsedMs);
                JSVTS.Controller.map.UpdateVehicles([v]);
                JSVTS.Controller.plotter.DrawVehicles(map.GetVehicles(), map.Scale);
                JSVTS.Controller.plotter.DrawStopLights(map, v.ElapsedMs);
                if(JSVTS.Controller.keepMoving){
                    window.setTimeout(JSVTS.Controller.Move,1);
                }
            }
            JSVTS.Controller.workers.push(worker);
        }

        var vehicles = JSVTS.Controller.map.GetVehicles();
        for (var i=0; i<vehicles.length; i) {
            var ids = [];
            for (var j=0; i<vehicles.length && j<Math.ceil(vehicles.length/JSVTS.Controller.MAX_THREADS); j++) {
                var v = vehicles[i++];
                if (v) {
                    ids.push(v.Id);
                }
            }
            if (ids.length > 0) {
                var message = JSON.stringify({
                    "vehicleIds": ids,
                    "elapsedMilliseconds": (new Date().getTime() - JSVTS.Controller.startTime),
                    "map": JSVTS.Controller.map
                });
                worker = JSVTS.Controller.workers[Math.floor(i/JSVTS.Controller.MAX_THREADS)];
                if (worker) {
                    worker.postMessage(message);
                }
            } else {
                break;
            }
        }
    },
    
    SetFromJson: function (){
        var input=document.querySelector('#tbox_Xml').value;
        var jsonObj = JSON.parse(input);
        JSVTS.Controller.map=new TxtToMapParser().ParseMapJson(jsonObj.map);
        JSVTS.Controller.plotter.DrawSegments(JSVTS.Controller.map);
        // plotter.DrawRoadPoints(map);
        JSVTS.Controller.plotter.DrawVehicles(JSVTS.Controller.map);
        JSVTS.Controller.plotter.DrawStopLights(JSVTS.Controller.map,0);
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
                if (segment.IsInlet) {
                    var vehicle=new JSVTS.Vehicle();
                    vehicle.SegmentId = segment.Id;
                    JSVTS.Controller.map.AddVehicle(vehicle);
                }
            });
        } else {
            var vehicle = new JSVTS.Vehicle();
            JSVTS.Controller.map.AddVehicle(vehicle);
        }

        JSVTS.Controller.plotter.DrawVehicles(JSVTS.Controller.map.GetVehicles(), JSVTS.Controller.map.Scale);
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