var d3 = require('../bower_components/d3/d3'),
  parallelCoordinateInterpolator = require('./parallelCoordinateInterpolator'),
  topojson = require('../bower_components/topojson/topojson'),
  colorGenerator = require('./colorGenerator');

module.exports = function(data){
  var m = [30, 10, 10, 10],
      w = 1560 - m[1] - m[3],
      h = 500 - m[0] - m[2];

  var x = d3.scale.ordinal().rangePoints([0, w], 1),
      y = {},
      dragging = {};

  var line = d3.svg.line().interpolate(parallelCoordinateInterpolator),
      axis = d3.svg.axis().orient("left"),
      background,
      foreground;

  var svg = d3.select("body").append("svg")
      .attr("width", w + m[1] + m[3])
      .attr("height", h + m[0] + m[2])
    .append("g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

  var properties;

  function draw(sd){
    var districts = topojson.feature(sd, sd.objects.districts).features;
    var s= 10;
    var propertyKeys = Object.keys(districts[0].properties);
    // get properties and ensure they all have values
    properties = districts.slice(0).filter(function(d){
      return d.properties.API;
    }).map(function(d){
      var props = d.properties;

      var data = {
        API: props.API,
        AS_API: props.AS_API,
        FI_API: props.FI_API,
        MR_API: props.MR_API,
        WH_API: props.WH_API,
        HI_API: props.HI_API,
        AI_API: props.AI_API,
        AA_API: props.AA_API,
        EL_API: props.EL_API,
        SD_API: props.SD_API,
        DI_API: props.DI_API,
        PCT_WH: props.PCT_WH,
        PCT_HI: props.PCT_HI,
        PCT_AS: props.PCT_AS,
        PCT_AA: props.PCT_AA,
        PCT_AI: props.PCT_AI,
        PCT_MR: props.PCT_MR,
        PCT_FI: props.PCT_FI,
        PCT_PI: props.PCT_PI,
        PI_API: props.PI_API,
        HSG: props.HSG,
        SOME_COL: props.SOME_COL,
        COL_GRAD: props.COL_GRAD,
        GRAD_SCH: props.GRAD_SCH,
        ACS_46: props.ACS_46,
        ENROLL: props.ENROLL,
      };
    
      propertyKeys.forEach(function(key){
        if(!(key in data)) return; 
        var value = data[key];
        if(value === undefined || isNaN(value)){
          data[key] = undefined;
          if(s-- > 0) console.log(props);
        }
      });

      return data;
    });

    var property = 'API';
    
    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(properties[0]).filter(function(d) {
      var domain;

      if(~d.indexOf('API')){
        domain = [200, 1000];
      } else if(~d.indexOf('PCT') || ~d.indexOf('GRAD_SCH')) {
        domain = [0, 100];
      } else {
        domain = d3.extent(properties, function(p) { return +p[d]; });
      }

      return (y[d] = d3.scale.linear()
          .range([h, 0]))
          .domain(domain);
    }));


    // Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
      .selectAll("path")
        .data(properties)
      .enter().append("path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("g")
        .attr("class", "foreground")
      .selectAll("path")
        .data(properties)
      .enter().append("path")
        .attr("d", path);

    property;
    function setProperty(p){
      console.log('Set property', p);
      property = p;
      
      if(!p) return foreground.style('stroke', '');

      var color = colorGenerator(districts, p);
      foreground.style('stroke', function(d){ 
          if(!d[p]) return 'gray';
          return color(d[p]);   
        });
    }

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
      .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        .on('click', function(d){
          if (d3.event.defaultPrevented) return; // click suppressed
          svg.selectAll('.dimension.selected').attr('class', 'dimension');
          if(property === d) return setProperty('');
          d3.select(this).attr('class', 'dimension selected');
          setProperty(d);
        })
        .call(d3.behavior.drag()
          .on("dragstart", function(d) {
            dragging[d] = this.__origin__ = x(d);
            background.attr("visibility", "hidden");
          })
          .on("drag", function(d) {
            dragging[d] = Math.min(w, Math.max(0, this.__origin__ += d3.event.dx));
            foreground.attr("d", path);
            dimensions.sort(function(a, b) { return position(a) - position(b); });
            x.domain(dimensions);
            g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
          })
          .on("dragend", function(d) {
            delete this.__origin__;
            delete dragging[d];
            d3.select(this).attr("transform", "translate(" + x(d) + ")");
            foreground.attr("d", path);
            background.attr("d", path)
                .attr("visibility", null);
          }));

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
      .append("text")
        .attr("text-anchor", "middle")
        .attr("y", -9)
        .text(String);

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) { 
          d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush)); 
        })
      .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);
  }

  function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
  }

  // Returns the path for a given data point.
  function path(d) {
    return line(dimensions.map(function(p) { 
      if(~p.indexOf('API') && d[p] < 200){
        // if an api has a value under 200, mark it as invalid data
        // by setting index 1 to undefined
        return [position(p)];
      }
      return [position(p), y[p](d[p])]; 
    }));
  }

  // When brushing, don’t trigger axis dragging.
  function brushstart() {
    d3.event.sourceEvent.stopPropagation();
  }

  function getActive(){
    var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
        extents = actives.map(function(p) { return y[p].brush.extent(); });
    
    var p = properties.filter(function(d){
      return actives.every(function(p, i) {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      });
    });
  }

  // Handles a brush event, toggling the display of foreground lines.
  function brush() {
    var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
        extents = actives.map(function(p) { return y[p].brush.extent(); });
    
    console.log(getActive());
    foreground.style("display", function(d) {
      return actives.every(function(p, i) {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      }) ? null : "none";
    });
  }

  draw(data);
}