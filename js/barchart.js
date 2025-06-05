// createGraph()の中に以下のコードを追加することで、棒グラフを追加できる。

const createBarChart = (svg, topojsonData, data, variable, path, year) => {
    // 棒グラフの最大の高さを設定します。
    const barMaxHeight = 100;

    // 棒グラフのスケールを定義します。
    const barScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d[variable])])
        .range([0, barMaxHeight]);
    // 世界地図を描画するコードの後に、棒グラフのコードを追加します。
    svg.selectAll('.bar')
        .data(topojsonData.features)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('transform', d => {
            const dataValue = d.properties[variable][year];
            //console.log(`Data value for ${d.properties.name} in ${year}:`, dataValue);
          
            // 空の文字列または不正なデータの場合は0を使用する
            const numericDataValue = dataValue && !isNaN(dataValue) ? parseFloat(dataValue) : 0;
            const barHeight = barScale(numericDataValue);
            //console.log(`Bar height for ${d.properties.name}:`, barHeight);
          
            const centroid = path.centroid(d);
            //console.log(`Centroid for ${d.properties.name}:`, centroid);
          
            // バリデーションを追加して NaN の場合はデフォルト値を使う
            const safeCentroidY = !isNaN(centroid[1]) ? centroid[1] : 0;
            const safeBarHeight = !isNaN(barHeight) ? barHeight : 0;
          
            return `translate(${centroid[0]}, ${safeCentroidY - safeBarHeight})`;
        })  
        .attr('width', 10) // バーの幅を設定します。
        .attr('height', d => {
            const dataValue = d.properties[variable][year];
            const numericDataValue = dataValue && !isNaN(dataValue) ? parseFloat(dataValue) : 0;
            return barScale(numericDataValue);
        })
        .attr('fill', 'blue')
        .attr('opacity', 0.8)
        .attr('stroke', 'black') // バーの枠線を追加する場合
        .attr('stroke-width', 0.5);
}

export {createBarChart};

// 使用例
/*** importする ***/
// import createBarChart from './barchart.js';

/*** createGraphsの中に以下を追加する。 ***/
// createBarChart(svg, topojsonData, filteredData, variable, path, year)をcreateGraphsの中に追加する。