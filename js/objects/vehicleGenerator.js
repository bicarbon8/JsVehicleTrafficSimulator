var JSVTS = JSVTS || {};
JSVTS.VG_OPTIONS = function () {
    var self = {
        delay: 5
    };
    return self;
};
JSVTS.VehicleGenerator = function (options) {
    var defaults = JSVTS.VG_OPTIONS();
    for (var key in options) { defaults[key] = options[key]; }
    JSVTS.Movable.call(this, defaults);

    this.nextVehicle = null;
    this.elapsedMs = 0;
};
JSVTS.VehicleGenerator.prototype = Object.create(JSVTS.Movable.prototype);
JSVTS.VehicleGenerator.prototype.constructor = JSVTS.VehicleGenerator;

JSVTS.VehicleGenerator.prototype.update = function (elapsedMs) {
    for (var i = 0; i < elapsedMs; i++) {
        this.elapsedMs++;
        if (this.elapsedMs >= this.config.delay) {
            this.generate();
        }
    }
};

JSVTS.VehicleGenerator.prototype.generate = function () {
    if (!this.nextVehicle) {
        this.nextVehicle = this.prepareNewVehicle();
    }
    
    if (this.canGenerate(this.nextVehicle)) {
        JSVTS.Map.addMovable(this.nextVehicle);
        this.elapsedMs = 0;
        this.nextVehicle = null;
    }
};

JSVTS.VehicleGenerator.prototype.canGenerate = function (newVehicle) {
    var vehicles = JSVTS.Map.getTypesInRangeOf(JSVTS.Vehicle, newVehicle.config.location, newVehicle.config.length * 3);
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
    var segment = this.segment;
    segment.attachMovable(v, segment.config.start, segment.config.end);
    return v;
};