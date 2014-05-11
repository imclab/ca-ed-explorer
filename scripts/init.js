var	d3 = require('../bower_components/d3/d3'),
	queue = require('../bower_components/queue-async/queue'),
	pcChart = require('./parallelCoordinateChart');

queue()
	.defer(d3.json, "data/ca.sd.topo.json")
	.await(function(err, sd){
		pcChart(sd);
	});