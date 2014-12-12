var JSVTS = JSVTS || {};
JSVTS.VG_OPTIONS = function () {
    var self = {
        delay: 5
    };
    return self;
};
JSVTS.VehicleGenerator = function (options) {
    JSVTS.Movable.call(this, options);
};
JSVTS.VehicleGenerator.prototype = Object.create(JSVTS.Movable);
JSVTS.VehicleGenerator.prototype.constructor = JSVTS.VehicleGenerator;

JSVTS.VehicleGenerator.prototype.segmentId = null;
JSVTS.VehicleGenerator.prototype.generating = false;
JSVTS.VehicleGenerator.prototype.nextVehicle = null;
JSVTS.VehicleGenerator.prototype.position = null;
JSVTS.VehicleGenerator.prototype.elapsedMs = 0;

JSVTS.VehicleGenerator.prototype.init = function (options) {
    JSVTS.Movable.prototype.init.call(this, options);
    var defaults = JSVTS.VG_OPTIONS();
    for (var property in defaults) { this.config[property] = defaults[property]; }
    for (var property in options) { this.config[property] = options[property]; }
};

JSVTS.VehicleGenerator.prototype.update = function (elapsedMs) {
    for (var i = 0; i < elapsedMs; i++) {
        this.elapsedMs++;
        if (this.elapsedMs === this.config.delay) {
            this.elapsedMs = 0;
            this.generate();
        }
    }
};

JSVTS.VehicleGenerator.prototype.generate = function (newVehicle) {
    var newV = newVehicle;
    if (!newV) {
        newV = this.prepareNewVehicle();
    }
    
    if (this.canGenerate(newV)) {
        JSVTS.Map.AddVehicle(newV);
        JSVTS.Plotter.addObject(newV.mesh);
    } else {
        setTimeout(function (self) { self.generate(newV); }, 500, this);
    }
};

JSVTS.VehicleGenerator.prototype.canGenerate = function (newVehicle) {
    var vehicles = JSVTS.Map.getVehiclesInRangeOf(newVehicle.config.location, newVehicle.config.length * 3);
    for (var i in vehicles) {
        var v = vehicles[i];
        var box1 = new THREE.Box3().setFromObject(v.mesh);
        var box2 = new THREE.Box3().setFromObject(newVehicle.mesh);
        if (JSVTS.Utils.isCollidingWith(box1, box2)) {
            return false;
        }
    }

    return true;
};

JSVTS.VehicleGenerator.prototype.prepareNewVehicle = function () {
    var v = new JSVTS.Vehicle({
        acceleration: JSVTS.Utils.getRandomBetween(2.5, 4.5),
        deceleration: JSVTS.Utils.getRandomBetween(3.8, 5),
        reactionTime: JSVTS.Utils.getRandomBetween(2.5, 3.5),
        changeLaneDelay: Math.floor(JSVTS.Utils.getRandomBetween(5, 15)),
        length: JSVTS.Utils.getRandomBetween(3, 5)
    });
    var segment = JSVTS.Map.GetSegmentById(this.segmentId);
    segment.attachVehicle(v);
    return v;
};