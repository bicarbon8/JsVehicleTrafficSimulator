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

    init: function () {
        JSVTS.Controller.reset();
        JSVTS.Controller.InitPage();
        JSVTS.Controller.InitObjects();
    },
    
    InitPage: function () {
        var w = window,
            d = document,
            e = d.documentElement,
            b = d.querySelector('body'),
            x = w.innerWidth || e.clientWidth || b.clientWidth,
            y = w.innerHeight|| e.clientHeight|| b.clientHeight;
        JSVTS.Controller.docWidth = x; // window.innerWidth;
        JSVTS.Controller.docHeight = y; // window.innerHeight;
        w.addEventListener("keypress", JSVTS.Controller.handleKeypress, false);
    },
    
    InitObjects: function () {
        JSVTS.Plotter.init(JSVTS.Controller.docWidth, JSVTS.Controller.docHeight);
        JSVTS.Plotter.render();
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
        JSVTS.Plotter.reset();
        JSVTS.Map.reset();
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
        JSVTS.Mover.move(25);
        JSVTS.Plotter.render();

        if (JSVTS.Controller.keepMoving) {
            requestAnimationFrame(JSVTS.Controller.Move);
        }
    },
    
    SetFromJson: function () {
        var jsonObj = jsonMap;
        JSVTS.TxtToMapParser.ParseMapJson(jsonObj.map);
        var segments = JSVTS.Map.GetSegments();
        for (var i in segments) {
            var segment = segments[i];
            JSVTS.Plotter.scene.add(segment.mesh);
            if (segment.tfc) {
                JSVTS.Plotter.scene.add(segment.tfc.mesh);
            }
        }
        JSVTS.Plotter.render();
    },
    
    GetAsJson: function () {
        var mapJsonStr = JSVTS.TxtToMapParser.GetMapJson(JSVTS.Map);
        alert(mapJsonStr);
    },

    AddVehicles: function (){
        var segments = JSVTS.Map.GetSegments();
        if (segments && segments.length > 0) {
            segments.forEach(function (segment) {
                if (segment.config.isInlet) {
                    var vehicle=new JSVTS.Vehicle();
                    segment.attachVehicle(vehicle);
                    JSVTS.Map.AddVehicle(vehicle);
                    JSVTS.Plotter.addObject(vehicle.mesh);
                }
            });
        } else {
            var vehicle = new JSVTS.Vehicle();
            JSVTS.Map.AddVehicle(vehicle);
            JSVTS.Plotter.addObject(vehicle.mesh);
        }

        JSVTS.Plotter.render();
    },
};