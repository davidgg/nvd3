nv.models.funnelChart = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    textOffset = 5,
    width = null,
    height = null,
    getX = function(d) {
      return d.x
    },
    getY = function(d) {
      return d.y
    },
    getDescription = function(d) {
      return d.description
    },
    id = Math.floor(Math.random() * 10000),
    color = nv.utils.defaultColor(),
    valueFormat = d3.format(',.2f'),
    labelFormat = d3.format('%'),
    showLabels = true,
    noData = "No Data Available.",
    dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout');

  function calculateTrapPoints(availableWidth, availableHeight, data) {
    var trap = [];
    var slope = 2 * availableHeight / (availableWidth - 1 / 3 * availableWidth);
    var totalArea = (availableWidth + 1 / 3 * availableWidth) * availableHeight / 2;
    var totalData = 0;
    for (var i = 0; i < data.length; i++) {
      totalData += data[i].y;
    }
    var dataChart = data;

    var baseY = margin.top;
    var startBaseX = margin.left;
    var endBaseX = availableWidth + startBaseX;

    for (i = 0; i < dataChart.length; i++) {
      var nextArea = dataChart[i].y * totalArea / totalData;
      var prevBaseLength = endBaseX - startBaseX;
      var nextBaseLength = Math.sqrt((slope * prevBaseLength * prevBaseLength - 4 * nextArea) / slope);

      var newEndBaseX = endBaseX - (prevBaseLength - nextBaseLength) / 2;
      var newStartBaseX = (prevBaseLength - nextBaseLength) / 2 + startBaseX;
      var newBaseY = slope * (prevBaseLength - nextBaseLength) / 2 + baseY;

      trap.push({
        "up_left": [startBaseX, baseY].join(","),
        "up_right": [endBaseX, baseY].join(","),
        "down_left": [newStartBaseX, newBaseY].join(","),
        "down_right": [newEndBaseX, newBaseY].join(","),
        "data": dataChart[i],
        "mid_height": (baseY + newBaseY) / 2 + textOffset,
        "mid_width": (newStartBaseX + newEndBaseX) / 2
      });

      baseY = newBaseY;
      startBaseX = newStartBaseX;
      endBaseX = newEndBaseX;
    }

    return trap;
  }


  //============================================================
  // Chart function
  //-----------------------------------------------------------

  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this);

      var availableWidth = (width || parseInt(container.style('width')) || 960) - (margin.left + margin.right);
      var availableHeight = (height || parseInt(container.style('height')) || 400) - (margin.top + margin.bottom);

      chart.update = function() {
        container.transition().call(chart);
      };

      //------------------------------------------------------------
      // Display noData message if there's nothing to show.

      if (!data) {
        var noDataText = container.selectAll('.nv-noData').data([noData]);

        noDataText.enter().append('text')
          .attr('class', 'nvd3 nv-noData')
          .attr('dy', '-.7em')
          .style('text-anchor', 'middle');

        noDataText
          .attr('x', margin.left + availableWidth / 2)
          .attr('y', margin.top + availableHeight / 2)
          .text(function(d) {
            return d
          });

        return chart;
      } else {
        container.selectAll('.nv-noData').remove();
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart
      container.selectAll('.nvd3.nv-wrap.nv-funnel').remove();
      var wrap = container.selectAll('.nv-wrap.nv-funnel').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-funnel nv-chart-' + id);
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g');

      // var groupTrapez = gEnter.append('g').attr('class', 'nv-funnel');
      // var groupLabels = gEnter.append('g').attr('class', 'nv-funnelLabels');

      var trapezoids = calculateTrapPoints(availableWidth, availableHeight, data);

      for (var i = 0; i < trapezoids.length; i++) {
        var groupTrapez = gEnter.append('g').attr('class', 'nv-trapez');

        var drawTrap = trapezoids[i];

        groupTrapez
          .on('mouseover', function(d, i) {
            d3.select(this).classed('hover', true);
          })
          .on('mouseout', function(d, i) {
            d3.select(this).classed('hover', false);
          });

				groupTrapez
          .append('polygon')
          .style('fill', function(d, i) {
            return color(d, i)
          })
          .style('stroke', '#fff')
          .attr("points", [drawTrap.up_left, drawTrap.up_right, drawTrap.down_right, drawTrap.down_left].join(" "));

        groupTrapez.append('text')
          .attr('text-anchor', 'middle')
          .attr('class', 'nv-legend-text')
          .attr('y', drawTrap.mid_height)
          .attr('x', drawTrap.mid_width)
          .text(drawTrap.data.x + " - " + drawTrap.data.y);
      }
    });

    return chart;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.options = nv.utils.optionsFunc.bind(chart);

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
    margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.values = function(_) {
    nv.log("funnel.values() is no longer supported.");
    return chart;
  };

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = _;
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = d3.functor(_);
    return chart;
  };

  chart.description = function(_) {
    if (!arguments.length) return getDescription;
    getDescription = _;
    return chart;
  };

  chart.showLabels = function(_) {
    if (!arguments.length) return showLabels;
    showLabels = _;
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  chart.valueFormat = function(_) {
    if (!arguments.length) return valueFormat;
    valueFormat = _;
    return chart;
  };

  chart.labelFormat = function(_) {
    if (!arguments.length) return labelFormat;
    labelFormat = _;
    return chart;
  };

  //============================================================

  return chart;
}
