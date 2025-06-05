const createChart = async () => {
    // Load the JSON data from an external file.
    let csvData = await d3.csv("./../data/MergedData.csv");
    const data = await d3.json("data/modifiedCountryHierarchy.json");
    // const data = await d3.json("data/modifiedCountryHierarchySmall.json");

    // Specify the chart’s dimensions.
    const width = 928;
    const height = width;
  
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
            const filteredData = csvData.filter((csvrow) => (csvrow.Country === d.data.id && csvrow.Year === '2020')); // もとに戻す。
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
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .attr("style", `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: white}; cursor: pointer;`);

        // Create a pie function
    const pie = d3.pie().value(d => d.value);

      // ノードを追加
  const node = svg.append("g")
  .selectAll("g")
  .data(root.descendants().slice(1))
  .join("g")

  // ノード（circle要素）を追加
  node.append("circle")
  .attr("fill", d => d.children ? color(d.depth) : "white")
  .attr("pointer-events", d => !d.children ? "none" : null)
  .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
  .on("mouseout", function() { d3.select(this).attr("stroke", null); })
  .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()))
  .attr("r", d =>  d.r) // ノードの半径を指定
  .attr("x", d => d.x) // ノードの半径を指定
  .attr("y",d =>  d.y); // ノードの半径を指定
  const colors = ['green', 'blue', 'grey']
  // legendを追加する。
  // カテゴリごとのデータと対応する色
  const legendData = [
    { label: "農業", colorIndex: 0 },
    { label: "生活", colorIndex: 1 },
    { label: "工業", colorIndex: 2 }
  ];

  // 凡例を表示するためのグループを作成
  const legend = svg.append("g")
    .attr("transform", "translate(" + (width /2- 100) + "," + (height /2- 100) + ")"); // 適切な座標に調整

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
    .on("mouseover", function() { d3.select(this).attr("stroke", "#000").attr("stroke-width", "3"); })
    .on("mouseout", function() { d3.select(this).attr("stroke", null); })
    .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()))
    .attr("d", d3.arc()
      .innerRadius(0)
      .outerRadius(function(){ return d3.select(this).node().parentNode.__data__.r;}))
    .append("title")  // 追加情報のためのツールチップ
    .text(d => `${d.data.label}: ${d.data.value}`);
  
    // Append the text labels.
    const label = svg.append("g")
        .style("font", "20px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => d.data.id); // もとに戻す
  
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
      node.attr("r", d => d.r * k);
    }
  
    function zoom(event, d) {
      const focus0 = focus;
  
      focus = d;
  
      const transition = svg
        .transition()
          .duration(event.altKey ? 7500 : 750)
          .tween("zoom", d => {
            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
            return t => zoomTo(i(t));
          });
  
      label
        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .transition(transition)
          .style("fill-opacity", d => d.parent === focus ? 1 : 0)
          .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
          .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
    }
};

const main = async () => {
    createChart();
};

main();