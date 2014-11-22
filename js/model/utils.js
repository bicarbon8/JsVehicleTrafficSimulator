var Utils = {
	SCALE_FLOOR: 0,
	SCALE_CEIL: 1,
	SCALE_REAL: 2,
	Scaler: function(percentage, scaleType) {
		this.percentage = percentage;
		this.scaleType = scaleType;
		this.scale = function (number, scaleType) {
			var t = this.scaleType;
			if (scaleType) { t = scaleType; }
			var res = number*percentage;
			switch(t) {
				case Utils.SCALE_FLOOR:
					return Math.floor(res);
				case Utils.SCALE_CEIL:
					return Math.ceil(res);
				default:
					return res;
			}
		}
	}
}