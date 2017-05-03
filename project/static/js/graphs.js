queue()
    .defer(d3.json, "/rhallcrime/projects")
    .defer(d3.json, "static/geojson/us-states.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, statesJson) {
	
	// normalization constant for sexual assault data
	var normalization = 10000; 

	// projectsJson data
	var sexethicsProjects = projectsJson;

	//Create a Crossfilter instance
	var ndx = crossfilter(sexethicsProjects);

	//Define Dimensions
	var stateDim = ndx.dimension(function(d) {return d['STATE']; });
	var typeDim = ndx.dimension(function(d) {return d['TYPE']}); 
	var yearDim = ndx.dimension(function(d) {return d['YEAR']}); 

	// functions for reducing title ix incidences by state 
	function add(a, b) {
    	return a + b;
	}

	function reduceAdd() {
	  return function(p,v) {
	  	// lol this is literally so ugly
	  	if (p.schools.indexOf(v.INST) >= 0) { 
	  		return p; 
	  	}
	  	else {
	  		p.schools.push(v.INST);
	  		p.sums.push(Number(v.TITLEIX)); 
	  		p.total = p.sums.reduce(add, 0);
	  		return p;
	  	}
	  };
	};

	function reduceRemove() {
	  return function(p,v) {
	  	if (p.schools.indexOf(v.INST) >= 0) {
	  		idx = p.schools.indexOf(v.INST);
	  		p.schools.splice(idx, 1); 
	  		p.sums.splice(idx, 1); 
	  		p.total = p.sums.reduce(add, 0); 
	  		return p; 
	  	}
	  	else {
	  		return p
	  	}
	  };
	};

	function reduceInit() {
	  return {schools: [], sums: [], total: 0};
	};

	// ordering title ix by year and finding the max value
	var totalTitleIXByState = stateDim.group().reduce(reduceAdd(), reduceRemove(), reduceInit);
	var tixMax = totalTitleIXByState.order(function(d){return d.total;}).top(1)[0].value;

	var numAssaultsByYear = yearDim.group().reduceSum(function(d){return d['NUMBER']}); 
	var numAssaultsByType = typeDim.group().reduceSum(function(d){return d['NUMBER']});

	//Define values (to be used in charts)
	var minYear = yearDim.bottom(1)[0]["YEAR"];
	var maxYear = yearDim.top(1)[0]["YEAR"];

    //Charts
	var timeChart = dc.barChart("#time-chart");
	var assaultTypeChart = dc.rowChart("#assault-type-row-chart");
	var usChart = dc.geoChoroplethChart("#us-chart");

	timeChart
		.width(600)
		.height(160)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(yearDim)
		.group(numAssaultsByYear)
		.transitionDuration(500)
		.x(d3.scale.linear().domain([minYear, maxYear]))
		.elasticY(true)
		.xAxisLabel("Year")
		.yAxis().ticks(8);

	assaultTypeChart
        .width(300)
        .height(250)
        .dimension(typeDim)
        .group(numAssaultsByType)
        .elasticX(true)
        .xAxis().ticks(4);

	usChart.width(1000)
		.height(330)
		.dimension(stateDim)
		.group(totalTitleIXByState)
		.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
		.colorDomain([0, tixMax])
		.overlayGeoJson(statesJson["features"], "state", function (d) {
			return d.properties.name;
		})
		.colorAccessor(function(d, i){
			return d.total;
		})
		.projection(d3.geo.albersUsa()
    				.scale(600)
    				.translate([340, 150]))
		.title(function (p) {
			return "State: " + p.key
					+ "\n"
					+ "Total Title IX Investitaions: " + p.value.total; 
		});


    dc.renderAll();


};