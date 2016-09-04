Module.register("mmm-openhabfloorplan", {
        defaults: {
		openhab: {
			url: "http://openhab:8080", // must not have trailing slash!
			user: "",
			password: "",
		},
		floorplan: {
			image: "floorplan.png", // located in subfolder 'images'
			width: 800, // image width
			height: 333, // image height
		},
		light: {
			image: "light.png", // located in subfolder 'images'
			width: 19, // image width
			height: 19, // image height
			updateInterval: 12, // every 10 seconds, 0 to disable lights
		},
		window: {
			defaultColor: "red", // css format, i.e. color names or color codes
			updateInterval: 9, // every 10 seconds, 0 to disable windows
		},
		label: {
			defaultColor: "grey", // css format
			defaultSize: "medium", // value of font-size style, e.g. xx-small, x-small, small, medium, large, x-large, xx-large, 1.2em, 20px
			updateInterval: 30, // every 5 min, 0 to disable labels
		},
		lights: [ // list all light items to be shown (must be of openhab type Switch or Dimmer), e.g.:
			// L_Kitchen: { left: 110, top: 80 },
		],
		windows: [ // list all window / door contacts to be shown (must be of openhab type Switch or Contact), e.g.:
			// { left: 613, top: 196, width: 26, height: 35, openhabItem: "Reed_dachbodenluke" },
		],
		labels: [ // list all strings to be shown (must be of openhab type String), e.g.:
			// { left: 613, top: 215, openhabItem: "Temperatur_Dachboden" },
		],
        },

	start: function() {
		Log.info("Starting module: " + this.name);

		if (this.valuesExist(this.config.windows) || this.valuesExist(this.config.lights) || this.valuesExist(this.config.labels)) {
			this.sendSocketNotification("GET_OPENHAB_ITEMS", this.config.openhab);
		}
	},
	valuesExist: function(arr) { return arr !== 'undefined' && arr.length > 0; },

	socketNotificationReceived: function(notification, payload) {
		if (notification === "OPENHAB_ITEMS") {
			Log.info("Openhab items received: " + payload.item.length);
			for (var key in payload.item) {
				var item = payload.item[key];
				if (item.name in config.lights) {
					var visible = item.state == "ON" || (typeof item.state == "number" && Number(item.state) > 0);
					setVisible("openhab_" + item.name, visible);
				} else if (item.name in config.windows) {

				} else if (item.name in config.labels) {

				}
			}
		}
	},
	setVisible: function(id, value) {
		var element = document.getElementById(id);
		if (element != null)
			element.style.display = value ? "block" : "none";
	},

        getDom: function() {
		var floorplan = document.createElement("div");
		floorplan.style.cssText = "background-image:url(" + this.file("/images/" + this.config.floorplan.image) + ");position:absolute;"
			+ "top:-" + this.config.floorplan.height + "px;width:" + this.config.floorplan.width + "px;height:" + this.config.floorplan.height + "px;";
		this.appendWindows(floorplan);
		this.appendLights(floorplan);
		this.appendLabels(floorplan);
                return floorplan;
	},

	appendLights: function(floorplan) {
		for (var item in this.config.lights) {
			var position = this.config.lights[item];
			floorplan.appendChild(this.getLightDiv(item, position));
		}
	},
	getLightDiv: function(item, position) {
		// set style: location
		var style = "margin-left:" + position.left + "px;margin-top:" + position.top + "px;position:absolute;"
			+ "height:" + this.config.light.height + "px;width:" + this.config.light.width + "px;";

		// create div, set style and text
		var lightDiv = document.createElement("div");
		lightDiv.id = 'openhab_' + item;
		lightDiv.style.cssText = style + "display:none;"; // hide item by default
		lightDiv.innerHTML = "<img src='" + this.file("/images/" + this.config.light.image) + "' style='"
			+ "height:" + this.config.light.height + "px;width:" + this.config.light.width + "px;'/>";
		return lightDiv;
	},

	appendLabels: function(floorplan) {
		for (var key in this.config.labels) {
			var labelConfig = this.config.labels[key];
			floorplan.appendChild(this.getLabelDiv(labelConfig));
		}
	},
	getLabelDiv: function(labelConfig) {
		// default color and size, but may be overridden for each label
		var color = this.getSpecificOrDefault(labelConfig.color, this.config.label.defaultColor);
		var size  = this.getSpecificOrDefault(labelConfig.size,  this.config.label.defaultSize);

		// set style: location, color, font size
		var style = "margin-left:" + labelConfig.left + "px;margin-top:" + labelConfig.top + "px;position:absolute;";
		style += "color:" + color + ";font-size:" + size + ";";

		// create div, set style and text
		var labelDiv = document.createElement("div");
		labelDiv.id = 'openhab_' + labelConfig.openhabItem;
		labelDiv.style.cssText = style;
		labelDiv.innerHTML = "&lt;" + labelConfig.openhabItem + "&gt;";
		return labelDiv;
	},

	appendWindows: function(floorplan) {
		for (var key in this.config.windows) {
			// get config for this window, create div, and append it to the floorplan
			var windowConfig = this.config.windows[key];
			floorplan.appendChild(this.getWindowDiv(windowConfig));

			// if 'counterwindow' is set, we must append another one according to given direction
			if (windowConfig.counterwindow !== 'undefined' && windowConfig.radius !== 'undefined') {
				// modify given window config for other wing of counterwindow
				var dir = windowConfig.counterwindow;
				var radius = windowConfig.radius;
				if (dir == 'horizontal') {
					windowConfig.left += radius
					windowConfig.midPoint = this.getMirroredMidPoint(windowConfig.midPoint, true);
					floorplan.appendChild(this.getWindowDiv(windowConfig));
				} else if (dir == 'vertical') {
					windowConfig.top += radius
					windowConfig.midPoint = this.getMirroredMidPoint(windowConfig.midPoint, false);
					floorplan.appendChild(this.getWindowDiv(windowConfig));
				}
			}
		}
	},
	getMirroredMidPoint: function(midPoint, horizontal) {
		if (horizontal  && midPoint.endsWith  ("left"))   return midPoint.slice(0, midPoint.indexOf('-')) + "-right";
		if (horizontal  && midPoint.endsWith  ("right"))  return midPoint.slice(0, midPoint.indexOf('-')) + "-left";
		if (!horizontal && midPoint.startsWith("top"))    return "bottom" + midPoint.slice(midPoint.indexOf('-'));
		if (!horizontal && midPoint.startsWith("bottom")) return "top"    + midPoint.slice(midPoint.indexOf('-'));
	},
	getWindowDiv: function(windowConfig) {
		// default color, but may be overridden for each window
		var color = this.getSpecificOrDefault(windowConfig.color, this.config.window.defaultColor);

		// prepare style with location
		var style = "margin-left:" + windowConfig.left + "px;margin-top:" + windowConfig.top + "px;position:absolute;";

		// if radius is set, it's a wing with a radius
		if (typeof windowConfig.radius !== 'undefined') {
			var radius = windowConfig.radius;
			style += this.getRadiusStyle(radius, windowConfig.midPoint) + "height:" + radius + "px;width:" + radius + "px;";
		} else {
			// otherwise it's a rectengular window with width and height
			style += "height:" + windowConfig.height + "px;width:" + windowConfig.width + "px;";
		}

		// create div representing the window
		var windowDiv = document.createElement("div");
		windowDiv.id = 'openhab_' + windowConfig.openhabItem;
		windowDiv.style.cssText = "background:" + color + ";" + style; // set color, location, and type-specific style
		return windowDiv
	},
	getRadiusStyle: function(radius, midPoint) {
		// example from: http://1stwebmagazine.com/css-quarter-circle
		var radiusBounds = "0 0 " + radius + "px 0;"; // default: top-left
		if (midPoint == "top-right") {
			radiusBounds = "0 0 0 " + radius + "px;";
		} else if (midPoint == "bottom-left") {
			radiusBounds = "0 " + radius + "px 0 0;";
		} else if (midPoint == "bottom-right") {
			radiusBounds = radius + "px 0 0 0;";
		}
		return "border-radius: " + radiusBounds + " -moz-border-radius: " + radiusBounds + " -webkit-border-radius: " + radiusBounds;
	},
	getSpecificOrDefault: function(specificValue, defaultValue) {
		if (typeof specificValue !== 'undefined')
			return specificValue; // specific value is defined, so use that one!
		return defaultValue; // no specific value defined, use default value
	},
});

