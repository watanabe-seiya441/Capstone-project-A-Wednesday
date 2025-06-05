// hide the form if the browser doesn't do SVG,
// (then just let everything else fail)
if (!document.createElementNS) {
    document.getElementsByTagName("form")[0].style.display = "none";
  }
  
  // Define the colors with colorbrewer
  var colors = colorbrewer.RdYlBu[3].reverse().map(function (rgb) {
    return d3.hsl(rgb);
  });
  
  // Set the (initial) width and height of the map
  var width = 960,
    height = 600;
  
  // Define the elements needed for map creation
  var body = d3.select("body"),
    stat = d3.select("#status"),
    map = d3
      .select("#map")
      .attr("preserveAspectRatio", "xMidYMid")
      .attr("viewBox", "0 0 " + width + " " + height),
    layer = map.append("g").attr("id", "layer"),
    mapFeatures = layer.append("g").attr("id", "mapFeatures").selectAll("path"),
    tooltip = d3
      .select("#map-container")
      .append("div")
      .attr("class", "ttip hidden");
  
  var zoom = d3.behavior.zoom().scaleExtent([1, 10]).on("zoom", doZoom);
  map.call(zoom);
  

  var proj = d3.geo.equirectangular();
  
  // Prepare the cartogram
  var topology,
    geometries,
    dataById = {},
    carto = d3
      .cartogram()
      .projection(proj)
      .properties(function (d) {
        return dataById[d.properties.name] || { value: 1 };
      });
  
  // Define the fields of the data
  var fields = [
    // {name: "(no scale)", id: "none"},
    { name: "Total Population", id: "pop_total", key: "TotalPopulation" },
    {name: "Agricultural Water Withdrawal", id: "agri_water", key: "AgriculturalWaterWithdrawal"},
    {name: "Industrial Water Withdrawal", id: "ind_water", key: "IndustrialWaterWithdrawal"},
    {name:"Municipal Water Withdrawal", id: "mun_water", key: "MunicipalWaterWithdrawal"},
    {name:"Total Water Withdrawal", id: "total_water", key: "TotalWaterWithdrawal"},
    {name: "GDP", id: "gdp", key: "GDP"},
  ];
  
  var years = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    fieldsById = d3.nest().key(function(d) { return d.id; }).entries(fields),
    field = fields[0],
    year = years[0];
  
  // currentKey の初期値を設定
  var currentKey = field.key; // この行を追加
  
  // Define the dropdown to select a field to scale by.
  var fieldSelect = d3.select("#field").on("change", function (e) {
    // On change, update the URL hash
    field = fields[this.selectedIndex];
    // location.hash = "#" + [field.id, year].join("/");
    parseHash(); 
  });
  // Populate its options with the fields available
  fieldSelect
    .selectAll("option")
    .data(fields)
    .enter()
    .append("option")
    .attr("value", function (d) {
      return d.id;
    })
    .text(function (d) {
      return d.name;
    });
  
  // Define the dropdown to select a year.
  var yearSelect = d3.select("#year");
  
  // D3's "change" event is somehow not triggered when selecting the
  // dropdown value programmatically. Use jQuery's change event instead.
  $("#year").on("change", function (e) {
    // On change, update the URL hash
    year = years[this.selectedIndex];
    location.hash = "#" + [field.id, year].join("/");
  });
  
  // Populate its options with the years available
  yearSelect
    .selectAll("option")
    .data(years)
    .enter()
    .append("option")
    .attr("value", function (y) {
      return y;
    })
    .text(function (y) {
      return y;
    });
  
  
  // Define some variables needed for the play functionality
  var isPlaying, outerIsPlaying, innerIsPlaying;
  
  // Define what happens when the play buttons are clicked
  var playButton = $("#play");
  var stopButton = $("#stop");
  playButton.on("click", function () {
    stop_play();
    playButton.prop("disabled", true);
    stopButton.prop("disabled", false);
    isPlaying = true;
    play_inner();
  });
  stopButton.on("click", function () {
    playButton.prop("disabled", false);
    stopButton.prop("disabled", true);
    stop_play();
  });
  
  function stop_play() {
    isPlaying = false;
    clearTimeout(innerIsPlaying);
    clearTimeout(outerIsPlaying);
  }
  
  function play_inner() {
    $("#year>option").each(function (i) {
      var el = $(this);
      innerIsPlaying = setTimeout(function () {
        if (isPlaying) {
          // Trigger a change event
          el.prop("selected", true).change();
        }
      }, i * 2000);
    });
    outerIsPlaying = setTimeout(function () {
      play_inner();
    }, years.length * 2000);
  }
  var csv_data;
  // Add a listener to the change of the URL hash
  window.onhashchange = function () {
    parseHash();
  };
  
  // Read the geometry data
  d3.json("../data/countries_110m.topojson", function (topo) {
    topology = topo;
  
    // The mapped unit for cantons: Cantons
    geometries = topology.objects.countries.geometries;
  
    // Read the data for the cartogram
    d3.csv("../data/MergedData.csv", function (data) {
      csv_data = data;
      // Prepare a function to easily access the data by its ID
      // "ID" for cantons: KTNR
      dataById = d3
        .nest()
        .key(function (d) {
          return d.Country;
        }) // 国の名前またはIDに変更
        .rollup(function (d) {
          return d[0];
        })
        .map(data);
  
      // Initialize the map
      init();
  
      update();
    });
  });
  
  function init() {
    // Create the cartogram features (without any scaling)
    geometries = geometries.filter(function (d) {
      return d.id !== '260' && d.id !== '010';
    });
    var features = carto.features(topology, geometries),
      path = d3.geo.path().projection(proj);
  
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
    mapFeatures.on("mousemove", showTooltip).on("mouseout", hideTooltip);
  
    // Parse the URL hash to see if the map was loaded with a cartogram
    parseHash();
  }
  
  /**
   * Reset the cartogram and show the features without scaling.
   */
  function reset() {
    // Reset the calculation statistics text
    stat.text("");
  
    // Create the cartogram features (without any scaling)
    var cartoFeatures = carto.features(topology, geometries),
      path = d3.geo.path().projection(proj);
  
    // Redraw the features with a transition
    mapFeatures
      .data(cartoFeatures)
      .transition()
      .duration(750)
      .ease("linear")
      .attr("fill", "#ddd")
      .attr("d", path);
  }
  
  function update() {
    var filteredData = csv_data.filter(function(d) {
        return +d.Year === year;
      });
      // Update dataById with the filtered data
    dataById = d3
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
        .sort(d3.ascending),
      lo = values[0],
      hi = values[values.length - 1];
  
    // Determine the colors within the range
    var color = d3.scale
      .linear()
      .range(colors)
      .domain(lo < 0 ? [lo, 0, hi] : [lo, d3.mean(values), hi]);
     
      var minPop = d3.min(csv_data, function(d) { return +d.TotalPopulation; });
      var maxPop = d3.max(csv_data, function(d) { return +d.TotalPopulation; });
    // Normalize the scale to positive numbers
    var scale = d3.scale.linear()
    .domain([minPop, maxPop]) // データの範囲
    .range([1, 1000]); // 地図上での表示範囲（適宜調整）
  
    // Tell the cartogram to use the scaled values
    carto.value(function (d) {
      return scale(value(d));
    });
  
    // Generate the new features and add them to the map
    var cartoFeatures = carto(topology, geometries).features;
    mapFeatures.data(cartoFeatures);
  
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
    year = years.indexOf(desiredYear) > -1 ? desiredYear : year; 

    // Mark the field as selected in the dropdown
    fieldSelect.property("selectedIndex", fields.indexOf(field));
  
    if (field.id === "none") {
      // If no scale is used, disable the year dropdown and the play
      // button
      yearSelect.attr("disabled", "disabled");
      playButton.prop("disabled", true);
      reset();
    } else {
      if (!isPlaying) {
        playButton.prop("disabled", false);
      }
      // If year is selected, mark it as selected in the dropdown
      if (field.years) {
        if (field.years.indexOf(year) === -1) {
          year = field.years[0];
        }
        yearSelect.selectAll("option").attr("disabled", function (y) {
          return field.years.indexOf(y) === -1 ? "disabled" : null;
        });
      } else {
        yearSelect.selectAll("option").attr("disabled", null);
      }
  
      yearSelect
        .property("selectedIndex", years.indexOf(year))
        .attr("disabled", null);
  
      deferredUpdate();
      location.replace("#" + [field.id, year].join("/"));
    }
    // deferredUpdate();
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
    var mouse = d3.mouse(map.node()).map(function (d) {
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
        "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"
      )
      .style("stroke-width", 0.5 / d3.event.scale + "px");
  
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
  