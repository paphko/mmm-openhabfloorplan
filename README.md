# Magic Mirror Module: mmm-openhabfloorplan
This [MagicMirror2](https://github.com/MichMich/MagicMirror) module allows you to show a floorplan of your house / apartment with the current state of lights, window contacts, and labels provided by a running [openhab](http://www.openhab.org/) server (only version 1.x tested so far).
Unlike most other modules, the data can be pushed from the openhab server via http requests to the magic mirror, so state changes are immediately shown.

Example is shown in the pictures of this [blog post](https://paphko.blogspot.de/2016/01/magic-mirror-openhab.html).

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/paphko/mmm-openhabfloorplan.git
````

## Preparing the Floorplan

First of all, you should create an image showing your individual floorplan.
You can use `mmm-openhabfloorplan/images/floorplan-default.png` as template (shown [here](images/README.md)) and use an image editor like [paint.net](http://www.getpaint.net/index.html) to change it as you like.
Save it as `mmm-openhabfloorplan/images/floorplan.png` (leave `floorplan-default.png` untouched).

## Configuring the Module

Now add the module to the modules array in the `config/config.js` file.
Yes, the configuration looks complicated, but there is quite a lot that can be configured.
The in-line comments should explain everything you need to know, so copy this sample configuration and adjust it to your individual openhab server, openhab items, and your floorplan.
When you are done adding all items and positioning them as you like, change `draft` to false.
````javascript
modules: [
	{
		module: 'mmm-openhabfloorplan',
		position: 'bottom_left', // this can be any of the regions
		config: {
			updateInterval: 60 * 60 * 1000, // refreshing all windows / lights / labels once per hour; 0 to disable periodic update
			draft: true, // if true, all lights, windows, and label names are shown; if false, get states from openhab
			openhab: {
				url: "http://openhab:8080", // must not have a trailing slash!
				// user: "", // only if you have authentication enabled
				// password: "", // only if you have authentication enabled
			},
			floorplan: {
				image: "floorplan-default.png", // image in subfolder 'images'; change to floorplan.png to avoid git repository changes
				width: 400, // this must be the width of the image above
				height: 333, // this must be the height of the image above
			},
			// light: { // this part shows default settings for lights; may optionally be overwritten
			//	image: "light.png", // located in subfolder 'images'
			//	width: 19, // image width
			//	height: 19, // image height
			// },
			// window: { // this part shows default settings for windows; may optionally be overwritten
			//	defaultColor: "red", // css format, i.e. color names or color codes
			// },
			// label: { // this part shows default settings for labels; may optionally be overwritten
			//	defaultColor: "grey", // css format
			//	defaultSize: "medium", // value of font-size style, e.g. xx-small, small, medium, large, x-large, 1.2em, 20px
			// },
			lights: { // list all light items to be shown (must be of openhab type Switch or Dimmer)
				// format: "openhab item (name is case-sensitive!): { left, top }"
				L_Living:      { left: 80,  top: 110 },
				L_Sleeping:    { left: 80,  top: 240 },
				L_Garden:      { left: 310, top: 5 },
				L_Terrace:     { left: 70,  top: 5 },
				L_Front_Door:  { left: 238, top: 310 },
				L_Front_left:  { left: 40,  top: 310 },
				L_Front_right: { left: 340, top: 310 },
				L_Kitchen:     { left: 280, top: 110 },
				L_Entry:       { left: 210, top: 220 },
			},
			windows: { // list all window / door contacts to be shown (must be of openhab type Switch or Contact)
				// openhab item: left, top, radius (draws quadrant), midPoint, and optionally counterwindow and color
				Reed_Door:           { left: 232, top: 289, radius: 32, midPoint: "bottom-right", color: "orange" },
				Reed_Entry:          { left: 188, top: 298, radius: 23, midPoint: "bottom-left" },
				Reed_Living:         { left: 12,  top: 106, radius: 29, midPoint: "top-left", counterwindow: "vertical" },
				Reed_Dining_right:   { left: 170, top: 12,  radius: 29, midPoint: "top-left", counterwindow: "horizontal" },
				Reed_Dining_left:    { left: 141, top: 12,  radius: 29, midPoint: "top-left" },
				Reed_Kitchen:        { left: 283, top: 44,  radius: 30, midPoint: "top-right", color: "orange" },
				Reed_Utility:        { left: 359, top: 180, radius: 29, midPoint: "bottom-right" },
				Reed_Sleeping_right: { left: 12,  top: 231, radius: 30, midPoint: "top-left" },
				// openhab item: left, top, width, height (draws rectangle), and optionally color
				Reed_Sleeping_left:  { left: 90,  top: 301, width: 37, height: 20 },
				Reed_Bath:           { left: 275, top: 301, width: 37, height: 20 },
			},
			labels: { // list all strings to be shown (may probably be any openhab type, resonable for String and Number)
				// openhab item: left, top, and optionally color, font size, prefix, postfix, and number of decimals for floating numbers
				Temperature_Entry:          { left: 162, top: 280 },
				Temperature_Living:         { left: 22,  top: 72,  decimals: 1 },
				Temperature_Dining_right:   { left: 200, top: 25,  color: "white", size: "x-small" },
				Temperature_Dining_left:    { left: 135, top: 25,  color: "white", size: "x-small" },
				Temperature_Utility:        { left: 345, top: 220, color: "green", decimals: 2 },
				Temperature_Sleeping_right: { left: 22,  top: 242, prefix: "outside: ", postfix: "°C" },
				Temperature_Sleeping_left:  { left: 58,  top: 280, prefix: "inside: ", postfix: "°C" },
				Temperature_Bath:           { left: 277, top: 280, postfix: "°C", decimals: 1 },
			}
		}
	},
]
````

## Configuring Openhab

If you simply want to pull states with the update interval as configured above, you don't need to do any changes to your openhab configuration.
But it is really impressive if state changes are immediately (with less than 1sec delay in my case) shown on the mirror!

The easiest and least invasive way of configuring openhab to push state changes to the magic mirror server, is via a dedicated rules-file, e.g. `mirror.rules`:

````
// define your magic mirror URL here; make sure that there is no trailing slash
var String mirrorUrl = "http://mirror:8080/openhab"

// whenever one of your items of interest changes, send a GET request to the magic mirror server
rule "L_Living to mirror"          when Item L_Living         changed then sendHttpGetRequest(mirrorUrl + "?item=L_Living&state="          + L_Living.state)          end
rule "Reed_Door to mirror"         when Item Reed_Door        changed then sendHttpGetRequest(mirrorUrl + "?item=Reed_Door&state="         + Reed_Door.state)         end
rule "Temperature_Entry to mirror" when Item Temerature_Entry changed then sendHttpGetRequest(mirrorUrl + "?item=Temperature_Entry&state=" + Temperature_Entry.state) end
// etc. this is always the same pattern, independent of the item type
````
