# Magic Mirror Module: mmm-openhabfloorplan
This [MagicMirror2](https://github.com/MichMich/MagicMirror) module allows you to show a floorplan of your house / apartment with the current state of lights, window contacts, and labels provided by a running [openhab](http://www.openhab.org/) server (only version 1.x tested so far). Unlike most other modules, the data can be pushed from the openhab server via the [http binding](https://github.com/openhab/openhab/wiki/Http-Binding) to the magic mirror, so state changes are immediately shown.

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

## Using the module

First of all, you should create an image showing your individual floorplan.
You can use `mmm-openhabfloorplan/images/floorplan-default.png` as template and use an image editor like [paint.net](http://www.getpaint.net/index.html) to change it as you like. Save it as `mmm-openhabfloorplan/images/floorplan.png`.

Now add the module to the modules array in the `config/config.js` file.
Yes, the configuration looks complicated, but there is quite a lot that can be configured.
The in-line comments should explain everything you need to know, so copy this sample configuration and adjust it to your individual openhab server, openhab items, and your floorplan.
````javascript
modules: [
	{
		module: 'mmm-openhabfloorplan',
		position: 'bottom_left', // this can be any of the regions
		config: {
			TODO
		}
	},
]
````

## Configuring Openhab

All openhab items that are configured in your module may also push their state changes directly to this magic mirror module via the [http binding](https://github.com/openhab/openhab/wiki/Http-Binding). The examples below should be self-explanatory:

````
Switch Light_Kitchen TODO...
Switch Reed_Kitchen TODO...
String Temperature_Kitchen TODO...
````
