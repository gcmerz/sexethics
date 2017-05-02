queue()
    .defer(d3.json, "/sexethics/projects")
    .defer(d3.json, "static/geojson/us-states.json")
    .await(makeGraphs);
function makeGraphs(error, projectsJson, statesJson) {
	
	// normalization constant for sexual assault data
	var normalization = 10000; 

	// projectsJson data
	var sexethicsProjects = projectsJson;

	//Create a Crossfilter instance
	var ndx = crossfilter(sexethicsProjects);

	// function for finding the total assault instances
	function findTotalAssault(d) {
		var total = Number(d['FORCIB13']) + 
				Number(d['RAPE14']) + 
				Number(d['NONFOR13']) + 
				Number(d['FONDL14']) + 
				Number(d['STATR14']) + 
				Number(d['RAPE15']) + 
				Number(d['FONDL15']) + 
				Number(d['STATR15']);
		return total;
	}; 

	// function for finding the average assault instances 
	function findAvgAssault(d) {
		var totalAssault = findTotalAssault(d); 
		return totalAssault / Number(d['Total']); 
	}; 

	//Define Dimensions
	var numWomen = ndx.dimension(function(d) {return d['women_total']; });
	var numMen = ndx.dimension(function(d) {return d['men_total']; });
	var numTotal = ndx.dimension(function(d) {return d['Total']; });
	var stateDim = ndx.dimension(function(d) {return d['State']; });

	// var dateDim = ndx.dimension(function(d) { return d["date_posted"]; });
	// var resourceTypeDim = ndx.dimension(function(d) { return d["resource_type"]; });
	// var povertyLevelDim = ndx.dimension(function(d) { return d["poverty_level"]; });
	// var stateDim = ndx.dimension(function(d) { return d["school_state"]; });
	// var totalDonationsDim  = ndx.dimension(function(d) { return d["total_donations"]; });


	// Calculate metrics
	// var numProjectsByDate = dateDim.group(); 
	// var numProjectsByResourceType = resourceTypeDim.group();
	// var numProjectsByPovertyLevel = povertyLevelDim.group();

	var avgSAByState = stateDim.group().reduce(reduceAdd, reduceRemove, reduceInitial);

	function reduceAdd(p, v) {
	  p.count += findTotalAssault(v);
	  p.total += Number(v['Total']);
	  return p;
	};

	function reduceRemove(p, v) {
	  p.count -= findTotalAssault(v);
	  p.total -= Number(v['Total']);
	  return p;
	};

	function reduceInitial() {
	  return {count: 0, total: 0};
	};

	function maxMean(d) {
		return d.count / d.total; 
	};

	var all = ndx.groupAll();
	// var totalSA = ndx.groupAll().reduceSum(function(d) {
	// 	return d['FORCIB13'] + d['NONFOR13'] + d['RAPE14'] + d['FONDL14'] + d['STATR14'] + d['RAPE15'] + d['FONDL15'] + d['STATR15'];
	// });
	var by_max = avgSAByState.order(maxMean).top(1)[0].value

	var max_state = (by_max.count / by_max.total) * normalization;

	//Define values (to be used in charts)
	// var minDate = dateDim.bottom(1)[0]["date_posted"];
	// var maxDate = dateDim.top(1)[0]["date_posted"];

    //Charts
	// var timeChart = dc.barChart("#time-chart");
	// var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
	// var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
	var usChart = dc.geoChoroplethChart("#us-chart");
	// var numberProjectsND = dc.numberDisplay("#number-projects-nd");
	// var totalDonationsND = dc.numberDisplay("#total-donations-nd");

	// numberProjectsND
	// 	.formatNumber(d3.format("d"))
	// 	.valueAccessor(function(d){return d; })
	// 	.group(all);

	// totalDonationsND
	// 	.formatNumber(d3.format("d"))
	// 	.valueAccessor(function(d){return d; })
	// 	.group(totalDonations)
	// 	.formatNumber(d3.format(".3s"));

	// timeChart
	// 	.width(600)
	// 	.height(160)
	// 	.margins({top: 10, right: 50, bottom: 30, left: 50})
	// 	.dimension(dateDim)
	// 	.group(numProjectsByDate)
	// 	.transitionDuration(500)
	// 	.x(d3.time.scale().domain([minDate, maxDate]))
	// 	.elasticY(true)
	// 	.xAxisLabel("Year")
	// 	.yAxis().ticks(4);

	// resourceTypeChart
 //        .width(300)
 //        .height(250)
 //        .dimension(resourceTypeDim)
 //        .group(numProjectsByResourceType)
 //        .xAxis().ticks(4);

	// povertyLevelChart
	// 	.width(300)
	// 	.height(250)
 //        .dimension(povertyLevelDim)
 //        .group(numProjectsByPovertyLevel)
 //        .xAxis().ticks(4);


	usChart.width(1000)
		.height(330)
		.dimension(stateDim)
		.group(avgSAByState)
		.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
		.colorDomain([0, max_state])
		.colorAccessor(function(d, i){
			return (d['count'] / d['total']) * normalization;
		})
		.overlayGeoJson(statesJson["features"], "state", function (d) {
			return d.properties.name;
		})
		.projection(d3.geo.albersUsa()
    				.scale(600)
    				.translate([340, 150]))
		.title(function (p) {
			return "State: " + p["key"]
					+ "\n"
					+ "Total Sexual Assaults: " + p['value'].count	
					+ "\n"
					+ "Total Number of Students: " + p['value'].total
					+ "\n"
					+ "Mean Sexual Assaults / " 
					+ normalization + " Students: " 
					+ Number(p['value'].count / p['value'].total * normalization).toFixed(1)
		})
    dc.renderAll();

};