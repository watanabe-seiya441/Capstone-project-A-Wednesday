import {en_jp, unit} from './config.js'

const createZoomableBubble = async (rawMergedCsvData, hierarchyJson, year, countryName) => {
    d3.select('.zoomableBubble').remove();
    // Load the JSON data from an external file.
    const csvData = rawMergedCsvData;
    const data = hierarchyJson;

    // Specify the chart’s dimensions.
    const partialWindowRect = d3.select(".ratioWindow").node().getBoundingClientRect()
    const width = partialWindowRect.width;
    const height = partialWindowRect.height;
  
    // Create the color scale.
    const color = d3.scaleLinear()
        .domain([0, 5])
        .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
        .interpolate(d3.interpolateHcl);

    // Compute the layout.
    const pack = data => d3.pack()
        .size([width, height])
        .padding(3)
      (d3.hierarchy(data)
        .each(d => {
            const filteredData = csvData.filter((csvrow) => (csvrow.Country === d.data.id && csvrow.Year === String(year))); // もとに戻す。
            if (filteredData.length > 0) {
                const firstRow = filteredData[0];
                d.data.pop = firstRow.TotalPopulation;
                d.data.agri = firstRow.AgriculturalWaterWithdrawal;
                d.data.ind = firstRow.IndustrialWaterWithdrawal;
                d.data.munic = firstRow.MunicipalWaterWithdrawal;
                d.data.total_water = firstRow.TotalWaterWithdrawal;
            } else {
                // データがない場合のデフォルト値を設定するなど
                d.data.pop = 0;
                d.data.agri = 0;
                d.data.ind = 0;
                d.data.munic = 0;
                d.data.total_water = 0;
            }
        })
        .eachAfter(d => {
            // 階層的な合計を計算
            if (d.children) {
                d.pop = d3.sum(d.children, child => child.pop);
                d.agri = d3.sum(d.children, child => child.agri);
                d.ind = d3.sum(d.children, child => child.ind);
                d.munic = d3.sum(d.children, child => child.munic);
                d.total_water = d3.sum(d.children, child => child.total_water);
            } else {
                d.pop = d.data.pop;
                d.agri = d.data.agri;
                d.ind = d.data.ind;
                d.munic = d.data.munic;
                d.total_water = d.data.total_water;
            }
            // どの要素を使うかここで設定する。
            d.value =d.total_water;
        })
        .sort((a, b) => b.value - a.value));
    const root = pack(data);
  
    const svg = d3
    .select("body")
    .append("svg")
    .classed("zoomableBubble", true)
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
    .attr("height", `${height}`)
    .attr("width", `${width}`)
    .attr("style", `display: block; cursor: pointer;`)
    .style("position", "absolute")
    .style("top",   partialWindowRect.top  + "px")
    .style("left",  partialWindowRect.left + "px")

    
  // Create a pie function
    const pie = d3.pie().value(d => d.value);

  // ノードを追加
  const node = svg.append("g")
  .selectAll("g")
  //取水量データがない国は表示しない。
  .data(root.descendants().slice(1).filter(d =>{ return  d.height > 1 || (d.total_water != 0 || d.total_water != "")}))
  .join("g")
  .style("opacity", d => {return d.parent === root ? 1 : 0;})
  .style("display", d => d.parent === root ? "inline" : "none");
  
  const focused_areas = new Set();
  node.each(function (childNode) {
    let parentNode = childNode.parent;
    if (childNode.data.id === countryName){
       while (parentNode) {
            focused_areas.add(parentNode.data.id);
            parentNode = parentNode.parent;
        }
        return false;
    }
    }
  );
  focused_areas.add(countryName);

  let isTransitioning = false; 

  // ノード（circle要素）を追加
  const circles = node.append("circle")
    .attr("fill", d => d.children ? color(d.depth) : 'rgba(0,0,0,0)')
    .attr("stroke-width", d => focused_areas.has(d.data.id)? 5 : 1 )
    .attr("stroke", d => focused_areas.has(d.data.id)? 'orange' : '#000' )
    // .attr("pointer-events", d => !d.children ? "none" : null)
    .attr("pointer-events", d => null)
    .on("mouseover", function(event, d) { 
      if (!isTransitioning) {
      d3.select(this).attr("stroke-width", d => focused_areas.has(d.data.id)? 7 : 3); 
      // ツールチップの内容を設定
      const tooltipText = `Area: ${d.data.id}<br>
          総取水量: ${d.total_water}[${unit.TotalWaterWithdrawal}]<br>
          生活用水: ${d.munic}[${unit.MunicipalWaterWithdrawal}]<br>
          産業用水: ${d.ind}[${unit.IndustrialWaterWithdrawal}]<br>
          農業用水: ${d.agri}[${unit.AgriculturalWaterWithdrawal}]`;

      // ツールチップの位置を設定
      const xPosition = event.pageX ;
      const yPosition = event.pageY;

      // ツールチップを表示するためのdivを作成
      d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("background-color", 'rgb(237, 236, 236)')
          .style("border-radius", "6px")
          .style("position", "absolute")
          .style("left", xPosition + "px")
          .style("top", yPosition + "px")
          .html(tooltipText);
      }
    })
    .on("mouseout", function(event, d) { 
      d3.select(this).attr("stroke-width", d => focused_areas.has(d.data.id)? 5 : 1); 
      // ツールチップを削除
      d3.select(".tooltip").remove();
    })
    .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()))
    .attr("r", d =>  d.r) // ノードの半径を指定
    .attr("x", d => d.x) // ノードの半径を指定
    .attr("y", d =>  d.y) // ノードの半径を指定

  const color1 = "#44bbbf";
  const color2 = "#f5712d";
  const color3 = "#e5e8ec";
  
  const colors = [color1, color2, color3];
  // legendを追加する。
  // カテゴリごとのデータと対応する色
  const legendData = [
    { label: "農業", colorIndex: 0 },
    { label: "生活", colorIndex: 1 },
    { label: "工業", colorIndex: 2 }
  ];

  // 凡例を表示するためのグループを作成
  const legend = svg.append("g")
    .attr("transform", "translate(" + (width /2- 60) + "," + (height /2- 60) + ")"); // 適切な座標に調整

  // 凡例の各要素を描画
  legend.selectAll("rect")
    .data(legendData)
    .enter().append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", d => colors[d.colorIndex]);

  // 凡例の各要素に対するテキストを描画
  legend.selectAll("text")
    .data(legendData)
    .enter().append("text")
    .attr("x", 20)
    .attr("y", (d, i) => i * 20 + 9) // テキストの位置を微調整
    .text(d => d.label)
    .attr("fill", "black"); // テキストの色を指定

  // 各ノードグループ内にアークのパスを追加
  const arcs = node.selectAll("path")
  .data(d => {
    return pie([
      { value: d.agri, label: "農業" },
      { value: d.munic, label: "生活" },
      { value: d.ind, label: "工業" }
    ]);
  })
  .join("path")
    .attr("fill", (d, i) => colors[i])  // インデックス（0, 1, 2）に基づいて色を指定
    .attr("pointer-events", d => !d.children ? "none" : null)
    .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()))
    .attr("d", d3.arc()
      .innerRadius(0)
      .outerRadius(function(){ 
         return d3.select(this).node().parentNode.__data__.r;}))

    // Append the text labels.
    const label = svg.append("g")
        .style("font", "20px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
      .selectAll("text")
       //取水量データがない国は表示しない。
      .data(root.descendants().filter(d =>{ return  d.height > 1 || d.total_water != ""}))
      .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => d.data.id);
  
    // Create the zoom behavior and zoom immediately in to the initial focus node.
    svg.on("click", (event) => zoom(event, root));
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2]);
  
    function zoomTo(v) {
      const k = width / v[2];
  
      view = v;
      label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      node.attr("r", d =>  d.r * k);
      node.selectAll("circle").attr("r", d => d.r * k);
      // アークのouterRadiusの更新
      arcs.attr("d", d3.arc()
        .innerRadius(0)
        .outerRadius(function (d) {
            return d3.select(this).node().parentNode.__data__.r * k;
        })
      );
    }
  
    function zoom(event, d) {
      const focus0 = focus;

      focus = d;
  
      const transition = svg
        .transition()
          .duration(event.altKey ? 7500 : 750)
          .tween("zoom", d => {
            isTransitioning = true; 
            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
            return t => {
              zoomTo(i(t));
              if ( t === 1 ) isTransitioning = false;
            }
          });
  
      label
        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .transition(transition)
          .style("fill-opacity", d => d.parent === focus ? 1 : 0)
          .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
          .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
        
      node
        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .transition(transition)
          .style("opacity", d => d.parent === focus ? 1 : 0)
          .on("start", function(d) { 
            if (d.parent === focus){
            this.style.display = "inline";} })
          .on("end", function(d) { 
            if (d.parent !== focus) this.style.display = "none"; });
          
    }
};

// 変数切り替えの選択ボックスと、年代変更バーを作成
const zoomableBubbleRefresher = (csvData, hierarchyJson, year, countryName) => {
  document.addEventListener("LineChartMouseMove", function(event) {
    const { year } = event.detail;
    createZoomableBubble(csvData, hierarchyJson, year, countryName);  
});
};

export { createZoomableBubble, zoomableBubbleRefresher};