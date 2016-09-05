Module.register("mmm-openhabfloorplan", {
        defaults: {
		/* with the openhab http binding, all changes can directly be pushed to the mirror. */
		/* please see documentation of this module how this works. */
		updateInterval: 60 * 60 * 1000, // refreshing all windows / lights / labels once per hour; 0 to disable periodic update
		showAll: false, // if true, all lights and windows are shown; if false, they are only shown if openhab item is available
		openhab: {
			url: "http://openhab:8080", // must not have trailing slash!
			user: "",
			password: "",
		},
		floorplan: {
			/* store your image as 'floorplan.png' to avoid git repository changes. */
			image: "floorplan-default.png", // located in subfolder 'images'
			width: 800, // image width
			height: 333, // image height
		},
		light: {
			image: "light.png", // located in subfolder 'images'
			width: 19, // image width
			height: 19, // image height
		},
		window: {
			defaultColor: "red", // css format, i.e. color names or color codes
		},
		label: {
			defaultColor: "grey", // css format
			defaultSize: "medium", // value of font-size style, e.g. xx-small, x-small, small, medium, large, x-large, xx-large, 1.2em, 20px
		},
		lights: {
			/* list all light items to be shown (must be of openhab type Switch or Dimmer), examples below. */
			// Light_Kitchen: { left: 110, top: 80 }, // name must match openhab item name (case sensitive!)
		},
		windows: {
			/* list all window / door contacts to be shown (must be of openhab type Switch or Contact), examples below. */
			/* name must match openhab item name (case sensitive!) */
			/* Supported formats are rectangles, single wings, and wings with counterwindow. */
			// Reed_Front_Door: { left: 213, top: 196, width: 26, height: 35 }, // rectengular drawing
			// Reed_Back_Door: { left: 113, top: 196, width: 26, height: 35, color: "orange", }, // color may optionally be overwritten
			// Reed_Kitchen_Window: { left: 100, top: 100, radius: 30, midPoint: "top-left" }, // wing with specified radius and mid-point location
			// Reed_Livingroom_Window: { left: 50, top: 50, radius: 25, midPoint: "top-left", counterwindow: "horizontal" }, // wing with counterwindow
		},
		labels: {
			/* list all strings to be shown (must be of openhab type String), examples below. */
			// Temperature_Kitchen: { left: 613, top: 215 }, // label with default color and size
			// Temperature_Livingroom: { left: 613, top: 215, color: "white", size: "x-small" }, // small and white label
		},
        },

	start: function() {
		Log.info("Starting module: " + this.name);

		// request item states if at least one item has been configured
		if (this.valuesExist(this.config.windows) || this.valuesExist(this.config.lights) || this.valuesExist(this.config.labels)) {
			Log.info("Requesting initial item states...");
			this.sendSocketNotification("GET_OPENHAB_ITEMS", this.config.openhab); // request initial item states

			// schedule periodic refresh if configured
			if (!isNaN(this.config.updateInterval) && this.config.updateInterval > 0) {
	        	        var self = this;
                		setInterval(function() {
					this.sendSocketNotification("GET_OPENHAB_ITEMS", this.config.openhab);
		                }, this.config.updateInterval);
			}
		} else {
			Log.info("No items configured.");
		}
	},
	valuesExist: function(obj) { return obj !== 'undefined' && Object.keys(obj).length > 0; },

	socketNotificationReceived: function(notification, payload) {
		if (notification == "OPENHAB_ITEMS") {
			Log.info("Openhab items received: " + payload.item.length);
			for (var key in payload.item) {
				var item = payload.item[key];
				if (item.name in this.config.lights) {
					var visible = item.state == "ON" || (!isNaN(parseInt(item.state)) && parseInt(item.state) > 0);
					this.setVisible("openhab_" + item.name, visible);
				} else if (item.name in this.config.windows) {
					var visible = item.state == "OFF" || item.state == "OPEN";
					this.setVisible("openhab_" + item.name, visible);
					if (this.config.windows[item.name].counterwindow !== 'undefined' && this.config.windows[item.name].radius !== 'undefined') {
						this.setVisible("openhab_" + item.name + "_counterwindow", visible);
					}
				} else if (item.name in this.config.labels) {
					var element = document.getElementById("openhab_" + item.name);
					if (element != null) {
						element.innerHTML = item.state;
					}
				}
			}
		}
	},
	setVisible: function(id, value) {
		var element = document.getElementById(id);
		if (element != null) {
			element.style.display = value ? "block" : "none";
		}
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
		if (!this.config.showAll)
			style += "display:none;"; // hide by default, do not hide if all items should be shown

		// create div, set style and text
		var lightDiv = document.createElement("div");
		lightDiv.id = 'openhab_' + item;
		lightDiv.style.cssText = style;
		lightDiv.innerHTML = "<img src='" + this.file("/images/" + this.config.light.image) + "' style='"
			+ "height:" + this.config.light.height + "px;width:" + this.config.light.width + "px;'/>";
		return lightDiv;
	},

	appendLabels: function(floorplan) {
		for (var item in this.config.labels) {
			var labelConfig = this.config.labels[item];
			floorplan.appendChild(this.getLabelDiv(item, labelConfig));
		}
	},
	getLabelDiv: function(item, labelConfig) {
		// default color and size, but may be overridden for each label
		var color = this.getSpecificOrDefault(labelConfig.color, this.config.label.defaultColor);
		var size  = this.getSpecificOrDefault(labelConfig.size,  this.config.label.defaultSize);

		// set style: location, color, font size
		var style = "margin-left:" + labelConfig.left + "px;margin-top:" + labelConfig.top + "px;position:absolute;";
		style += "color:" + color + ";font-size:" + size + ";";

		// create div, set style and text
		var labelDiv = document.createElement("div");
		labelDiv.id = 'openhab_' + item;
		labelDiv.style.cssText = style;
		labelDiv.innerHTML = "&lt;" + item + "&gt;";
		return labelDiv;
	},

	appendWindows: function(floorplan) {
		for (var item in this.config.windows) {
			// get config for this window, create div, and append it to the floorplan
			var windowConfig = this.config.windows[item];
			floorplan.appendChild(this.getWindowDiv(item, windowConfig));

			// if 'counterwindow' is set, we must append another one according to given direction
			if (windowConfig.counterwindow !== 'undefined' && windowConfig.radius !== 'undefined') {
				// clone given window config for other wing of counterwindow: http://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
				var counterwindowConfig = JSON.parse(JSON.stringify(windowConfig));
				if (windowConfig.counterwindow == 'horizontal') {
					counterwindowConfig.left += windowConfig.radius
					counterwindowConfig.midPoint = this.getMirroredMidPoint(windowConfig.midPoint, true);
					floorplan.appendChild(this.getWindowDiv(item + "_counterwindow", counterwindowConfig));
				} else if (windowConfig.counterwindow == 'vertical') {
					counterwindowConfig.top += windowConfig.radius
					counterwindowConfig.midPoint = this.getMirroredMidPoint(windowConfig.midPoint, false);
					floorplan.appendChild(this.getWindowDiv(item + "_counterwindow", counterwindowConfig));
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
	getWindowDiv: function(item, windowConfig) {
		// default color, but may be overridden for each window
		var color = this.getSpecificOrDefault(windowConfig.color, this.config.window.defaultColor);

		// prepare style with location and hide it!
		var style = "margin-left:" + windowConfig.left + "px;margin-top:" + windowConfig.top + "px;position:absolute;";
		if (!this.config.showAll)
			style += "display:none;"; // hide by default, do not hide if all items should be shown

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
		windowDiv.id = 'openhab_' + item;
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

