var d3 = require('../bower_components/d3/d3'),
  colorbrewer = require('./colorbrewer');

module.exports = function colorGenerator(features, property){
  var range = colorbrewer.RdYlGn[10].slice(0);
  var min = 1e15, max = 0;

  features.forEach(function(feature){
    var value = feature.properties[property];

    if(value < min ) min = value;
    else if(value > max) max = value;
  });

  if(~property.indexOf('API')){
    min = 200;
    max = 1000; 
  } else {
    switch(property){
      case 'ACS_46':
      case 'NOT_HSG':
        range = range.reverse();
        min = 0;
        max = 100;
        break;
      case 'HSG':
      case 'SOME_COL':
      case 'COL_GRAD':
      case 'GRAD_SCH':
        min = 0;
        max = 100;
        break;

    }
  }

  return d3.scale.quantile()
    .range(range)
    .domain([min, max]);
};