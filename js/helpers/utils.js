var JSVTS = JSVTS || {};
JSVTS.Utils = {
	getRandomBetween: function (min, max) {
		return Math.random() * (max - min) + min;
	},

	getDistanceBetweenTwoPoints: function (p1, p2) {
        return JSVTS.Map.getDistanceBetweenTwoPoints(p1, p2);
    },

    angleFormedBy: function (line1, line2) {
        var a = new THREE.Vector3().copy(line1.end).sub(line1.start).normalize();
        var b = new THREE.Vector3().copy(line2.end).sub(line2.start).normalize();
        return (Math.acos(a.dot(b))*(180/Math.PI));
    },

    isCollidingWith: function (box1, box2) {
        if (box1.isIntersectionBox(box2)) {
            return true;
        }
        return false;
    },

    convertKmphToMps: function(kilometersPerHour) {
		var result = 0;
		var SECONDS_PER_HOUR=3600;
		var METERS_PER_KILOMETER = 1000;
		result = (kilometersPerHour/(SECONDS_PER_HOUR))*METERS_PER_KILOMETER;
		return result;
	},

	convertMpsToKmph: function(metersPerSecond) {
		var result = 0;
		var SECONDS_PER_HOUR=3600;
		var METERS_PER_KILOMETER = 1000;
		result = (metersPerSecond * SECONDS_PER_HOUR) / METERS_PER_KILOMETER;
		return result;
	},
};