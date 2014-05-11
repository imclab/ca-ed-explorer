var width = 960,
    height = 800;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

queue()
  .defer(d3.json, "ca.sd.topo.json")
  .await(draw);
  
var tooltip = d3.select("body").append("div")   
  .attr("class", "tooltip")               
  .style("opacity", 0);

function draw(err, sd){
  var projection = d3.geo.albers().scale(4500).translate([width/2, height/2]).rotate([120,1.5]);

  var zoom = d3.behavior.zoom()
    .translate(projection.translate())
    .scale(projection.scale())
    .scaleExtent([height / 8, 80 * height])
    .on("zoom", function zoomed() {
      projection.translate(d3.event.translate).scale(d3.event.scale);
      redraw(d3.event.scale);
    });

  svg.call(zoom);

  var path =  d3.geo.path().projection(projection);
  var districts = topojson.feature(sd, sd.objects.districts).features;
  var districtsGroup = svg.append('g')
          .attr('class', 'districts');

  function getMinMax(features, property){
    var min = 1e15,
      max = 0;

    features.forEach(function(feature){
      var value = feature.properties[property];

      if(value < min ) min = value;
      else if(value > max) max = value;
    });

    if(~property.indexOf('_API')){
      min = 200;
      max = 1000; 
    } else {
      switch(property){
        case 'ACS_46':
        case 'NOT_HSG':
          min = 100;
          max = 0;
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

    return [min, max];
  }

  function getColorer(features, property){
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
  }

  function setProperty(property){
    console.log('Setting property to', property);

    districtsGroup.selectAll('path').remove();
    var paths = districtsGroup.selectAll('path')
        .data(districts);

    var color = getColorer(districts, property);
    paths.enter().append('path')
        .style('fill', function(d){ 
          if(!d.properties[property]) return '';
          return color(d.properties[property]);   
        })
        .on("mousemove", function(d){
          tooltip
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY -30) + "px");
        })
        .on("mouseover", function(d) {
          if(!d.properties.District) return;
          
          tooltip
            .transition()
            .duration(300)
            .style("opacity", 1)
          tooltip.text(d.properties.District + " - " + d.properties[property] + " " + property)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY -30) + "px");
        })
        .on("mouseout", function() {
          tooltip.transition().duration(300)
          .style("opacity", 0);
        });



    var colorDomainMin = color.domain()[0];
    var colorDomainMax = color.domain()[1];
    var legendSteps = 5;
    var colorStep = (colorDomainMax - colorDomainMin) / legendSteps
    var legendDomain = [];
    var legendLabels = [];
    var legendValueStart, legendValueEnd;
    for(var i = 0; i < legendSteps; i++){
      legendValueStart =  (colorDomainMin + colorStep * i)|0;
      legendValueEnd = (colorDomainMin + colorStep * (i + 1) - 1)|0;
      legendDomain.push(legendValueStart);
      legendLabels.push(legendValueStart + ' - ' + legendValueEnd);
    }

    svg.selectAll("g.legend").remove();
    var legend = svg.selectAll("g.legend")
                    .data(legendDomain)
                    .enter().append("g")
                    .attr("class", "legend");

    var ls_w = 20, 
        ls_h = 20;

    legend.append("rect")
          .attr("x", 20)
          .attr("y", function(d, i){ return height - (i*ls_h) - 2*ls_h;})
          .attr("width", ls_w)
          .attr("height", ls_h)
          .style("fill", function(d, i) { return color(d); })
          .style("opacity", 0.8);

    legend.append("text")
          .attr("x", 50)
          .attr("y", function(d, i){ return height - (i*ls_h) - ls_h - 4;})
          .text(function(d, i){ return legendLabels[i]; });

    redraw();
  }

  function redraw(){
    districtsGroup.selectAll('path').attr('d', path);
  }
  window.sp =setProperty;
  setProperty('API');
}