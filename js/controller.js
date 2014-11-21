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
        JSVTS.Controller.docWidth = window.innerWidth;
        JSVTS.Controller.docHeight = window.innerHeight;
        JSVTS.Controller.SizePositionElement('div_Controls',JSVTS.Controller.docWidth,200,0,Math.round(JSVTS.Controller.docHeight-200));
    },
    
    InitObjects: function () {
        JSVTS.Controller.map = new GraphMap(1);
        JSVTS.Controller.plotter = new JSVTS.Plotter('viewport');
        JSVTS.Controller.map.AddVehicle(new JSVTS.Vehicle());
        JSVTS.Controller.render();
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
        var eleObj = $('#'+elementIdStr);
        eleObj.width(width);
        eleObj.height(height);
        eleObj.css({
            "position":"absolute",
            "top":yPos+"px",
            "left":xPos+"px"
        });
    },
    
    ToggleSimulationState: function (){
        var button=document.getElementById("btn_SimStart");
        
        if(keepMoving){
            keepMoving=false;
            button.value="Start Simulation";
            for (var i in workers) {
                workers[i].terminate();
                delete workers[i];
            }
            workers = [];
        } else{
            keepMoving=true;
            button.value="Pause Simulation";
            startTime = new Date().getTime();
            Move();
        }
    },
    
    Move: function () {
        while (JSVTS.Controller.workers.length < MAX_THREADS) {
            worker = new Worker("MoverWorker.js");
            worker.onmessage = function (event) {
                var vehicle = JSON.parse(event.data);
                var v = new Vehicle(vehicle);
                $('#tbox_ElapsedTime').val(v.ElapsedMs);
                map.UpdateVehicles([v]);
                plotter.DrawVehicles(map.GetVehicles(), map.Scale);
                plotter.DrawStopLights(map, v.ElapsedMs);
                if(keepMoving){
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
                    "elapsedMilliseconds": (new Date().getTime() - startTime),
                    "map": map
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
        segments.forEach(function (segment) {
            if (segment.IsInlet) {
                var vehicle=new Vehicle();
                vehicle.Width=5;
                vehicle.Height=3;
                vehicle.SegmentId = segment.Id;
                JSVTS.Controller.map.AddVehicle(vehicle);
            }
        });

        JSVTS.Controller.plotter.DrawVehicles(map.GetVehicles(), map.Scale);
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