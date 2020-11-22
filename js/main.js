// set the dimensions and margins of the graph
var svg, x, y, focus, focusText, total, rect, mouseG, tooltip, tooltiptext, circles, x, y, radius;
var margin = {top: 50, right: 25, bottom: 30, left: 60},
    width = (window.innerWidth) - margin.left - margin.right,
    height = (window.innerHeight*.95) - margin.top - margin.bottom;
var translate = "translate(" + margin.left + "," + margin.top+")";



svg = d3.select("#bubble")
  .append("svg")
    .attr("width", (width*.7) + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

var chartBackground = svg.append("rect")
  .attr("class", "chartBackground")
  .attr("width", (width*.7))
  .attr("height", height);

var map, mapHeight, mapWidth, albers,path;

mapHeight = $('.chartBackground').height()/2.25
mapWidth = $('#timeSeries').width()

map = d3.select("#locatorMap")
  .append("svg")
  .attr("class","map")
  .attr("width",mapWidth)
  .attr("height", mapHeight)

albers = d3.geoAlbersUsa()
.scale(mapWidth*1.2)
.translate([mapWidth/2,mapHeight/2])


path = d3.geoPath()
    .projection(albers);

var promises = [];
promises.push(d3.csv("data/MSA_Pop_Income_Housing2.csv"));
promises.push(d3.csv("data/msa_coordinates.csv"));
promises.push(d3.json("data/states-10m.json"));
Promise.all(promises).then(callback);

function callback(data){
  msa = data[0]
  msa_coords = data[1]
  states = data[2]

  var usa = topojson.feature(states, states.objects.states);

 map.append("path")
        .datum(usa)
        .attr("class", "states")
        .attr("d", path)
        .attr("stroke", "#FFFFFF")
        .attr("stroke-width", "0.15px")
        .attr("fill","#767676")


  var year2010 = msa.filter(d => d.YEAR === "2010")

  var years = ["2010","2011","2012","2013","2014","2015","2016","2017","2018","2019"]

  var popMax = []
  var incMax = []
  var hMax = []
  var name = []

 for (var m in msa){
    popMax.push(Number(msa[m].Population))
    incMax.push(Number(msa[m].Income))
    hMax.push(Number(msa[m].Home_Value))
    name.push(msa[m].NAME)
  }
  name = [...new Set(name)]

  var dropdownList =[]

  for(var n in name){
    dropdownList.push({"id":Number(n),"Name":name[n]})
  }

  var max = d3.max(popMax);
  var home_max = d3.max(hMax);
  var income_max = d3.max(incMax);

  x = d3.scaleLinear()
  .domain([20000,140000])
  .range([0,width*.7])

  svg.append("g")
    .attr("transform","translate(0,"+height+")")
    .call(d3.axisBottom(x).tickFormat(d3.format("$,")).ticks(10))

  svg.append("text")
    .attr("text-anchor","middle")
    .attr("x",(width*.7) - ((width*.7))+200)
    .attr("y",height-5)
    .text("Median Household Income")

  y = d3.scaleLinear()
    .domain([1200000,0])
    .range([0,height])

  svg.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format("$,")).ticks(10))

  svg.append("text")
    .attr("text-anchor","end")
    .attr("transform", "rotate(-90)")
    .attr("x",(width)-(width)-(width/5))
    .attr("y",20)
    .text("Median House Value")

  svg.append("text")
    .attr("text-anchor","middle")
    .attr("class","bubbleChartTitle")
    .attr("x",(width*.7) - ((width*.7)/2))
    .attr("y",25)
    .attr("font-size","1.35em")
    .text("Correlation between Median Household Income and Median Home Value")

  svg.append("text")
    .attr("class","bubbleChartYear")
    .attr("x",(width*.7)-150)
    .attr("y",(height-15))
    .attr("font-size","4em")
    .text("2010")
  
  radius = d3.scaleSqrt()
    .domain([1, max])
    .range([1, 35]);

  var informData = d3.selectAll(".map")
      .append("rect")
      .attr("class","inform")
      .attr('width', "95%")
      .attr('height', "95%")
      .style('opacity',0.75)
      .style('fill','White')
      .attr('transform','translate(10,10)')
      .raise()

  var text = d3.selectAll(".map")
      .append("text")
      .attr("class","informText")
      .attr('transform','translate('+mapWidth/2+','+mapHeight/2.25+')')
      .text("Hover over a MSA")
      .attr("text-anchor","middle")
      .raise()

  var text2 = d3.selectAll(".map")
  .append("text")
  .attr("class","informText")
  .attr('transform','translate('+mapWidth/2+','+mapHeight/1.95+')')
  .text("on the bubble plot")
  .attr("text-anchor","middle")
  .raise()

  var text3 = d3.selectAll(".map")
  .append("text")
  .attr("class","informText")
  .attr('transform','translate('+mapWidth/2+','+mapHeight/1.7+')')
  .text("to see where it is located ")
  .attr("text-anchor","middle")
  .raise()

  var text3 = d3.selectAll(".map")
  .append("text")
  .attr("class","informText")
  .attr('transform','translate('+mapWidth/2+','+mapHeight/1.5+')')
  .text("in the U.S.")
  .attr("text-anchor","middle")
  .raise()

  circles = svg.append("g")
    .selectAll("dot")
    .data(year2010)
    .enter()
    .append("circle")
      .attr("class", function(d){
        return "CBSAA" +d.CBSAA; })
      .sort(function(a, b){
        return b.Population - a.Population
        })
      .on("mouseover", function(d){
        highlight(d,d.Population,d.Income,d.Home_Value,msa_coords);})
      .on("mouseout", function(d){
          dehighlight(d)
      })
      .on("mousemove", moveLabel)
      .attr("fill","orange")
      .style("fill-opacity", 1)
      .style("stroke","black")
      .attr("stroke","black")
      .style("stroke-width",0.75)
      .attr("cx",function(d){
        return x(d.Income)
      })
      .attr("cy",function(d){
        return y(d.Home_Value)
      })
      .attr("r",function(d){
        return radius(d.Population)
      })

  svg.selectAll('circle')
  .append("desc")
  .text('{"fill": "orange","stroke-width": "0.75"}');

  var index = 0
  $('.step').click(function(){
    if ($(this).attr('id') == 'backward'){
      index++;
      index = index > 9 ? 0 : index;
    } else if ($(this).attr('id') == 'forward'){
      index--;
      index = index < 0 ? 9 : index;
    }
      updateBubbles(years[index],msa)
    });

  $('#citySearch').select2({
    placeholder: 'Use this Dropdown to Search for an MSA....',
    allowClear: true,
    data: name,
  })
  var selected_msa;
  $('#citySearch').on('select2:select', function (e) {
      selected_msa = e.params.data.id;
      highlightSelectedBubble(selected_msa, msa_coords)
  });
  $('#clear').on("click",function(e){
    $("#citySearch").select2('val', 'All')
    $('#citySearch').select2({
      allowClear: true,
      placeholder: 'Use this Dropdown to Search for an MSA....',
      data: name,
    })
    $('#citySearch').on('select2:select', function (e) {
        selected_msa = e.params.data.id;
        highlightSelectedBubble(selected_msa, msa_coords)
    });
    unhighlightBubble(selected_msa, msa_coords)
  })
  createLegend()
}
function highlight(props, population,income, housing,msa_xy){

  d3.selectAll(".inform").remove()
  d3.selectAll(".informText").remove()

  map.selectAll('.map')
  .data(msa_xy.filter(d => d.CBSAA === props.CBSAA))
  .enter()
  .append("circle")
    .attr("class", function(d){
      return "map" +d.CBSAA; })
    .attr("fill","orange")
    .style("fill-opacity", 1)
    .style("stroke","black")
    .attr("stroke","black")
    .style("stroke-width",0.75)
    .attr("cx",function(d){
      return albers([d.X,d.Y])[0]
    })
    .attr("cy",function(d){
      return albers([d.X,d.Y])[1]
    })
    .attr("r","5")

  var selected = d3.selectAll("." + "CBSAA"+props.CBSAA )
      .style("fill", "grey")
      .style("stroke-width", 2);
  setLabel(props, population, income, housing)
  
};
function dehighlight(props, msa_xy){
  var selected = d3.selectAll("." + "CBSAA"+props.CBSAA)
      .style("fill", function(){
          return getStyle(this, "fill") 
      })
      .style("stroke-width", function(){
          return getStyle(this, "stroke-width")
      });
  var mapSelect = d3.selectAll(".map"+props.CBSAA).remove()
  function getStyle(element, styleName){
      var styleText = d3.select(element)
          .select("desc")
          .text();

      var styleObject = JSON.parse(styleText);

      return styleObject[styleName];
  };

  d3.select(".infolabel") 
      .remove();
};
function setLabel(props, population, income, housing){

  var labelAttributes

  var metroArea = "<h1>"+props.NAME+
  "</h1><br> <b>Population:</b> "+d3.format(",")(population)
  +"<br> <b>Median Household Income:</b> "+ d3.format("$,")(income)
  +"<br> <b>Median Home Value:</b>"+d3.format("$,")(housing)

  labelAttributes = metroArea

  var infolabel = d3.select("#bubble")
      .append("div")
      .attr("class", "infolabel")
      .attr("id", "CBSAA"+props.CBSAA + "_label") 
      .html(labelAttributes); 
};
function moveLabel(){
 
  var labelWidth = d3.select(".infolabel")
      .node()
      .getBoundingClientRect()
      .width;

  var x1 = d3.event.clientX + 10, 
      y1 = d3.event.clientY - 1,
      x2 = d3.event.clientX - labelWidth - 10,
      y2 = d3.event.clientY + 15;

  var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 

  var y = d3.event.clientY < window.innerHeight - 225 ? y2 : y1; 

  d3.select(".infolabel") 
      .style("left", x + "px")
      .style("top", y + "px");
};
function updateBubbles(year, msa){

  circles
  .data(msa.filter(d => d.YEAR === year),d => d.NAME)
  .sort((a,b)=> b.Population - a.Population)
  .transition()
  .duration(1000)
  .attr("cx",function(d){
    return x(d.Income)
  })
  .attr("cy",function(d){
    return y(d.Home_Value)
  })
  .attr("r",function(d){
    return radius(d.Population)
  })
    
  var chartTitle = d3.select(".bubbleChartYear").text(year)

  d3.select("#selectedYear")
  .text("Current Year: "+year)
}
function highlightSelectedBubble(chosen_msa, msa_xy){

  var selected_msa
  for(var m in msa_xy){
    if(chosen_msa == msa_xy[m].NAME){
      selected_msa = msa_xy[m]
    }
  }
  $('[class*="selected"]').remove()

  map.selectAll('circle')
  .data(msa_xy.filter(d => d.CBSAA === selected_msa.CBSAA))
  .enter()
  .append("circle")
    .attr("class", function(d){
      return "selected" +d.CBSAA; })
    .style("fill","#800080")
    .style("fill-opacity", 1)
    .style("stroke","black")
    .style("stroke","black")
    .style("stroke-width",0.75)
    .attr("cx",function(d){
      return albers([d.X,d.Y])[0]
    })
    .attr("cy",function(d){
      return albers([d.X,d.Y])[1]
    })
    .attr("r","5")

  circles
  .style("opacity",function(d){
    if(d.NAME == selected_msa.NAME){
    return 1
  }
  if(d.NAME != selected_msa.NAME){
    return 0.2
  }
  })
  .style("fill",function(d){
    if(d.CBSAA == selected_msa.CBSAA){
      return "#800080"
    }
    if(d.CBSAA != selected_msa.CBSAA){
      return "Orange"
    }
  })
  svg.selectAll('desc')
    .text(function(d){
      if(d.CBSAA == selected_msa.CBSAA){
        return '{"fill": "#800080","stroke-width": "0.75"}'
      }
      if(d.CBSAA != selected_msa.CBSAA){
        return '{"fill": "orange","stroke-width": "0.75"}'
      }
      
    });
}
function unhighlightBubble(chosen_msa, msa_xy){
  var selected_msa
  for(var m in msa_xy){
    if(chosen_msa == msa_xy[m].NAME){
      selected_msa = msa_xy[m]
    }
  }
  circles
  .style("opacity",1)
  .style("fill",function(d){
    if(d.CBSAA == selected_msa.CBSAA){
      return "Orange"
    }
    if(d.CBSAA != selected_msa.CBSAA){
      return "Orange"
    }
  })

  svg.selectAll('desc')
    .text('{"fill": "Orange","stroke-width": "0.75"}');

  d3.selectAll(".selected" + selected_msa.CBSAA).remove()
}
function createLegend(){
  var LegendValues = [500000,2500000,10000000]

  var LegendRange = radius.range()[1]

  var lWidth = $("#timeSeries").width();

  var legend =  d3.select("#legend")
      .style("width", lWidth)
      .style("height", LegendRange)


  var lHeight = $("#legend").height();
  

  var circlesLegend = legend.append("svg")
      .attr("class","propLegend")
      .attr("height","50%")
      .attr("width","100%")


  var propCircles = circlesLegend.selectAll(".legendCircles")
      .data(LegendValues)
      .enter()
      .append("circle")
      .attr("cx",lWidth/2)
      .attr("cy", function(d){
          return LegendRange - radius(d) + 80
      })
      .attr("r", function(d){
          return radius(d)
      })
      .attr("fill","none")
      .attr("stroke","black")
      .attr("stroke-width","0.75")
  
  var lines = circlesLegend.selectAll(".propLines")
      .data(LegendValues)
      .enter()
      .append("line")
      .attr("x1", lWidth/2)
      .attr("x2", lWidth/2 +50)
      .attr("y1", function(d){ 
          return LegendRange - (radius(d)*2)+80})
      .attr("y2", function(d){ 
          return LegendRange - (radius(d)*2)+80})
      .attr("stroke","black")
      .attr("stroke-width","0.75")
  
  var legendLabels = circlesLegend.selectAll(".legendLabels")
      .data(LegendValues)
      .enter()
      .append("text")
      .attr("class", "legendShadow")
      .text(function(d){
          return d3.format(",")(d)})
      .attr("x", function(d){
          return lWidth/2 + 50})
      .attr("y",function(d){
        if(d==500000){
          return LegendRange-(radius(d)*2-(85))
        }
        else{
          return LegendRange-(radius(d)*2-(80))
        }
      })
      .attr('alignment-baseline', 'middle')
  
  var h = lHeight + 100
  
  var legendTitle = legend.selectAll('.propLegend')
      .append("text")
      .attr("class", "legendTitle")
      .attr("x",(lWidth/2)-75)
      .attr("y", function(){ 
          return LegendRange - (radius(1000000)*2)+30})
      .text("Approximate Population");
}

