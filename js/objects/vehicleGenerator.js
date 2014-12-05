var JSVTS = JSVTS || {};
JSVTS.VG_OPTIONS = function () {
    var self = {
        delay: 5
    };
    return self;
};
JSVTS.VehicleGenerator = function (options) {
    var self = this;
    self.config = JSVTS.VG_OPTIONS();
    self.segmentId = null;
    self.generating = false;
    self.nextVehicle = null;
    self.position = null;

    self.init = function (options) {
        for (var property in options) { self.config[property] = options[property]; }
    };

    self.updateLocation = function(newLocation) {
        if (newLocation) {
            self.config.location = new THREE.Vector3().copy(newLocation);
        }
    };

    self.update = function (totalElapsedMs) {
        if (!self.generating && (Math.floor(totalElapsedMs / 1000) % self.config.delay) === 0) {
            self.generating = true;
            self.generate();
        }
    };

    self.generate = function () {
        if (!self.nextVehicle) {
            self.nextVehicle = new JSVTS.Vehicle({
                generateId: false,
                length: 5
            });
            var segment = JSVTS.Map.GetSegmentById(self.segmentId);
            segment.attachVehicle(self.nextVehicle);
        }
        
        var vehicles = JSVTS.Map.GetVehicles();
        var canGenerate = true;
        for (var i in vehicles) {
            var v = vehicles[i];
            var box1 = new THREE.Box3().setFromObject(v.mesh);
            var box2 = new THREE.Box3().setFromObject(self.nextVehicle.mesh);
            if (JSVTS.Mover.isCollidingWith(box1, box2)) {
                canGenerate = false;
                break;
            }
        }

        if (canGenerate) {
            var segment = JSVTS.Map.GetSegmentById(self.segmentId);
            segment.attachVehicle(self.nextVehicle);
            var newV = new JSVTS.Vehicle({
                acceleration: self.getRandomBetween(2.5, 4.5),
                deceleration: self.getRandomBetween(3.8, 5),
                reactionTime: self.getRandomBetween(2.5, 3.5),
                changeLaneDelay: Math.floor(self.getRandomBetween(5, 15)),
                length: self.getRandomBetween(3, 5)
            });
            segment.attachVehicle(newV);
            JSVTS.Map.AddVehicle(newV);
            JSVTS.Plotter.addObject(newV.mesh);
            JSVTS.Plotter.addObject(newV.idMesh);
            self.generating = false;
        } else {
            setTimeout(self.generate, 1000);
        }
    };

    self.getRandomBetween = function (min, max) {
        return Math.random() * (max - min) + min;
    };

    self.init(options);
};