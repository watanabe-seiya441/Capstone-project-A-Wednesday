// hide the form if the browser doesn't do SVG,
// (then just let everything else fail)

const createCartogramWorldMap = (csvData, topojsonData, info, donationPositionData) =>{
// const createCartogramWorldMap = () =>{
      // Define the colors with colorbrewer
    d3.select("#CartogramWorldMap").html("");
    //d3.select("mapFeatures").remove();
    //d3.select("#map-container svg").remove();
  

    
  var colors = colorbrewer.RdYlBu[3].reverse().map(function (rgb) {
    return d3v3.hsl(rgb);
  });
  
  // Set the (initial) width and height of the map
  const width = 600;
  const height = 700;
  
  // Define the elements needed for map creation
  var body = d3v3.select("body");
  var stat = d3v3.select("#status");
  // var body = d3v3.select("#CartogramWorldMap");
  // var stat = d3v3.select("#CartogramWorldMap");
  var map = d3v3
      .select("#CartogramWorldMap") 
      .append("svg")
      //.select("#map")
      //.classed("CartogramWorldMap", true) // 新しいクラスを追加
      // .attr("preserveAspectRatio", "xMidYMid")
      .attr("viewBox", "0 0 " + width + " " + height);
  var layer = map.append("g").attr("id", "layer");
  var mapFeatures = layer.append("g").attr("id", "mapFeatures").selectAll("path");
  var tooltip = d3
      //.select("#map-container")
      .select("#CartogramWorldMap") 
      .append("div")
      .attr("class", "ttip hidden");
  
  var zoom = d3v3.behavior.zoom().scaleExtent([1, 10]).on("zoom", doZoom);
  map.call(zoom);
  

  var proj = d3v3.geo.equirectangular();
  
  // Prepare the cartogram
  var topology,
    geometries,
    dataById = {},
    carto = d3v3
      .cartogram()
      .projection(proj)
      .properties(function (d) {
        return dataById[d.properties.name] || { value: 1 };
      });
  
  // Define the fields of the data
  var fields = [
    // {name: "(no scale)", id: "none"},
    {name: "Total Population", id: "pop_total", key: "TotalPopulation" },
    {name: "Agricultural Water Withdrawal", id: "agri_water", key: "AgriculturalWaterWithdrawal"},
    {name: "Industrial Water Withdrawal", id: "ind_water", key: "IndustrialWaterWithdrawal"},
    {name:"Municipal Water Withdrawal", id: "mun_water", key: "MunicipalWaterWithdrawal"},
    {name:"Total Water Withdrawal", id: "total_water", key: "TotalWaterWithdrawal"},
    {name: "GDP", id: "gdp", key: "GDP"},
  ];
  
  var years = [];
  for (var year = 1965; year <= 2020; year++) {
      years.push(year);
  }
  var fieldsById = d3v3.nest().key(function(d) { return d.id; }).entries(fields);
  var field = fields[0];
  field = fields.find(f => f.key === info.variable)
  //var year = years[0];
  //console.log({year})
  var year = info.year;
  //console.log({year})
  
  // currentKey の初期値を設定
  var currentKey = field.key; // この行を追加

  var csv_data;
  // Add a listener to the change of the URL hash
  window.onhashchange = function () {
    parseHash();
  };
  //console.log({year})
  
  // Read the geometry data
  d3v3.json("../data/countries_110m.topojson", function (topo) {
    topology = topo;
    console.log({topology})
  
    // The mapped unit for cantons: Cantons
    geometries = topology.objects.countries.geometries;

    // Read the data for the cartogram
    d3v3.csv("../data/MergedData.csv", function (data) {
      csv_data = data;

      // 年と変数に基づいてデータをフィルタリング
      var filteredData = data.filter(function(d) {
        return d.Year === info.year && d.Variable === info.variable;
      });

      //console.log({csv_data});

      // Prepare a function to easily access the data by its ID
      // "ID" for cantons: KTNR
      dataById = d3v3
        .nest()
        .key(function (d) {
          return d.Country;
        }) // 国の名前またはIDに変更
        .rollup(function (d) {
          return d[0];
        })
        //.map(data);
        .map(filteredData);

      // Initialize the map
      init();

      console.log("after init: " + year)
  
      update();
      // console.log({year})
    });
  });
  
  function init() {
    // Create the cartogram features (without any scaling)
    geometries = geometries.filter(function (d) {
      return d.id !== '260' && d.id !== '010';
    });
    var features = carto.features(topology, geometries);
    // var features = carto.features(topojsonData, topojsonData.features.geometry);
    var path = d3v3.geo.path().projection(proj);
  
    // Determine extent of the topology
    var b = topology.bbox;
    t = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    s = 0.95 / Math.max((b[2] - b[0]) / width, (b[3] - b[1]) / height);
  
    // Scale it to fit nicely
    s = s * 55;
    proj
      .scale(s)
      .center(t)
      .translate([width / 2, height / 2])
      .rotate([-10, 0]);
  
    // Put the features on the map
    mapFeatures = mapFeatures
      .data(features)
      .enter()
      .append("path")
      .attr("class", "mapFeature")
      .attr("id", function (d) {
        return getName(d);
      })
      .attr("fill", "#fafafa")
      .attr("d", path);
  
    // Show tooltips when hovering over the features
    // Use "mousemove" instead of "mouseover" to update the tooltip
    // position when moving the cursor inside the feature.
    mapFeatures.on("mousemove", showTooltip)
      .on("mouseout", hideTooltip);
  
    // Parse the URL hash to see if the map was loaded with a cartogram
    parseHash();
  }
  
  /** 年代変更などのアップデート */
  function update() {
    
    /** ここで右上画面に情報を渡す */
    info.year = year;
    d3.select("body").select(".ThreeCircles").remove();
    window.createThreeCircles(window.csvData, window.topojsonData, info);
    //console.log({info})
    /** ここまで右上の画面に関すること */

    /*** 年度などの表示のためのsvgを作成 */

    d3.select("body").select(".CartogramWorldMap_text").remove();

    const svg = d3
        .select("body")
        .append("svg")
        .classed("CartogramWorldMap_text", true) // 新しいクラスを追加
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("height", `${height}`)
        .attr("width", `${width}`)
        .attr("fill", "#44bbbf")
        .attr("style", `display: block; padding: 10 10px; background: white};`)
        .style("position", "absolute")
        .style("top",   d3.select(".UpperLeftWindow").node().getBoundingClientRect().top + "px")
        .style("left",  d3.select(".UpperLeftWindow").node().getBoundingClientRect().left + "px");
    const yearLabel = svg
        .append("text")
        .attr("class", "year")
        .attr("text-anchor", "end")
        .attr("font-size", 50)
        .attr("x", width - 10)
        .attr("y", height - 50) 
        .text(year);
    //console.log({year})
    /*** 年度などの表示のためのsvgを作成 終わり */

    var filteredData = csv_data.filter(function(d) {
        return +d.Year === info.year;
      });
      // Update dataById with the filtered data
    dataById = d3v3
    .nest()
    .key(function (d) {
        return d.Country;
    }) // 国の名前またはIDに変更
    .rollup(function (d) {
        return d[0];
    })
    .map(filteredData);
  
    if (!field || !field.key) {
      console.error("Field is undefined or does not have a key property");
      return; // fieldが未定義かkeyプロパティがない場合はここで処理を終了
    }
  
    // Keep track of the time it takes to calculate the cartogram
    var start = Date.now();
  
  
    // Prepare the values and determine minimum and maximum values
    var value = function (d) {
        return getValue(d);
      },
      values = mapFeatures
        .data()
        .map(value)
        .filter(function (n) {
          return !isNaN(n);
        })
        .sort(d3v3.ascending),
      lo = values[0],
      hi = values[values.length - 1];
  
    // Determine the colors within the range
    var color = d3v3.scale
      .linear()
      .range(colors)
      .domain(lo < 0 ? [lo, 0, hi] : [lo, d3v3.mean(values), hi]);
     
    var minPop = d3v3.min(csv_data, function(d) { return +d.TotalPopulation; });
    var maxPop = d3v3.max(csv_data, function(d) { return +d.TotalPopulation; });
    // console.log({minPop})
    // console.log({maxPop})

    // Normalize the scale to positive numbers
    var scale = d3v3.scale.linear()
    .domain([minPop, maxPop]) // データの範囲
    .range([1, 1000]); // 地図上での表示範囲（適宜調整）
  
    // Tell the cartogram to use the scaled values
    carto.value(function (d) {
      return scale(value(d));
    });
  
    // Generate the new features and add them to the map
    var cartoFeatures = carto(topology, geometries).features;
    mapFeatures.data(cartoFeatures);
    
    // 地図の特徴を更新
    // var features = carto.features(topology, geometries);
    // mapFeatures = mapFeatures.data(features);
  
    // Scale the cartogram with a transition
    mapFeatures
      .transition()
      .duration(750)
      .ease("linear")
      .attr("fill", function (d) {
        return color(value(d));
      })
      .attr("d", carto.path);
  
    // Show the calculation statistics and hide the update indicator
    var delta = (Date.now() - start) / 1000;
    stat.text(["calculated in", delta.toFixed(1), "seconds"].join(" "));
    hideUpdateIndicator();
  }
  
  /**
   * Use a deferred function to update the cartogram. This allows to set a
   * timeout limit.
   */
  var deferredUpdate = (function () {
    var timeout;
    return function () {
      var args = arguments;
      clearTimeout(timeout);
      stat.text("calculating...");
      return (timeout = setTimeout(function () {
        update.apply(null, arguments);
      }, 10));
    };
  })();
  
  /**
   * Parse the URL hash location to determine whether to show features
   * scaled or not.
   */
  function parseHash() {
    // Extract the field and year from the URL hash
    var parts = location.hash.substring(1).split("/"),
      desiredFieldId = parts[0],
      desiredYear = +parts[1];
  
    // Make sure field and year are valid, else use the defaults
    field = fieldsById[desiredFieldId] || field; // ここを修正
    // console.log({field})
    //field = info.variable;
    //year = years.indexOf(desiredYear) > -1 ? desiredYear : year; 


  
    deferredUpdate();
  }
  
  /**
   * Show a tooltip with details of a feature, e.g. when hovering over a
   * feature on the map.
   *
   * @param {Feature} d - The feature
   * @param {Number} i - The ID of the feature
   */
  function showTooltip(d, i) {
    // Get the current mouse position (as integer)
    var mouse = d3v3.mouse(map.node()).map(function (d) {
      return parseInt(d);
    });
  
    var currentWidth = $("#map").width();
    var currentHeight = $("#map").height();
    var mouseL = (mouse[0] * currentWidth) / width;
    var mouseT = (mouse[1] * currentHeight) / height;
    var left = Math.min(currentWidth - 12 * getName(d).length, mouseL + 20);
    var top = Math.min(currentHeight - 40, mouseT + 20);
  
    tooltip
      .classed("hidden", false)
      .attr("style", "left:" + left + "px;top:" + top + "px")
      .html(
        [
          "<strong>",
          getName(d),
          "</strong><br/>",
          "Population: ",
          formatNumber(getValue(d)),
        ].join("")
      );
  }
  

  function hideTooltip() {
    tooltip.classed("hidden", true);
  }
  

  function doZoom() {
    // Zoom and keep the stroke width proportional
    mapFeatures
      .attr(
        "transform",
        "translate(" + d3v3.event.translate + ")scale(" + d3v3.event.scale + ")"
      )
      .style("stroke-width", 0.5 / d3v3.event.scale + "px");
  
    // Hide the tooltip after zooming
    hideTooltip();
  }
  
  function showUpdateIndicator() {
    body.classed("updating", true);
  }
  

  function hideUpdateIndicator() {
    body.classed("updating", false);
  }
  
  function getValue(f) {
      var value = f.properties[currentKey];
      return (value !== undefined && value !== '' && !isNaN(value)) ? +value : 1;
  }
  
  function getName(f) {
    return f.properties && f.properties.name ? f.properties.name : "";
  }
  
  function formatNumber(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  }
};

// グローバル関数にしてsplitScreen.jsでも使えるようにする
window.createCartogramWorldMap = createCartogramWorldMap;
  