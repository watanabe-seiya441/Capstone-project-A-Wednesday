/**
 * data を読み込む関数
 */
const getData = async () => {
    // 寄付可能なプロジェクトのデータを読み込む。
    let donation_data = await d3.csv("./data/donation_list.csv");

    console.log(donation_data);
    // 国の首都の位置のデータを読み込む。
    let capital_location_data = await d3.csv("./data/WUP2018-F13-Capital_Cities.csv");

    // 世界地図のデータを読み込む
    const worldJson = await d3.json("./data/countries_110m.topojson");
    const topojsonData = topojson.feature(worldJson, worldJson.objects.countries);

    // 南極周辺のデータを消去する。
    topojsonData.features = topojsonData.features.filter(feature => (feature.id !== '260' && feature.id !== '010'));

    // プロジェクトとその国の首都の位置を紐付ける。
    const donation_position = [];
    donation_data.forEach(d => {
        const capital_city = capital_location_data.filter((cl) => cl.Country === d.country)
        const lat = capital_city.map((cl) => +(cl.Latitude));
        const long = capital_city.map((cl) => +(cl.Longitude));
        donation_position.push(
            {title: d.title, detail: d.detail, url: d.project_link, country: d.country, latitude: lat, longitude: long}
        );
    });

    return { donation_position, topojsonData };
};

const getDonationPositionData = async () => {
    // 寄付可能なプロジェクトのデータを読み込む。
    let donation_data = await d3.csv("./data/donation_list.csv");

    // 国の首都の位置のデータを読み込む。
    let capital_location_data = await d3.csv("./data/WUP2018-F13-Capital_Cities.csv");

    // プロジェクトとその国の首都の位置を紐付ける。
    const donation_position = [];
    donation_data.forEach(d => {
        const capital_city = capital_location_data.filter((cl) => cl.Country === d.country)
        const lat = capital_city.map((cl) => +(cl.Latitude));
        const long = capital_city.map((cl) => +(cl.Longitude));

        donation_position.push(
            {title: d.title, detail: d.detail, url: d.project_link, country: d.country, latitude: lat[0], longitude: long[0]}
        );
    });
    return donation_position;
}

/**
 * グラフを描画する関数
 */
const createGraphs = (data, topojsonData) => {
    // 既存のSVG要素を削除
    d3.select("body").select("svg").remove();

    const width = 800;
    const height = 800;

    const svg = d3
        .select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    // 世界地図を描画
    const projection = d3
        .geoConicEqualArea()
        .translate([width / 2, height / 2])
        .scale(150);

    const path = d3.geoPath().projection(projection);

    svg.selectAll("path")
        .data(topojsonData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", `rgb(255, 255, 255)`)
        .attr("stroke", "#333333")
        .attr("stroke-width", 1);

    const circle = svg.selectAll("circle").data(data).enter().append("circle");

    circle
        .attr("cx", (d) => {
            return (projection([d.longitude, d.latitude])[0]);})
        .attr("cy", (d) => projection([d.longitude, d.latitude])[1])
        .attr("r", 2)
        .attr("fill", "red")
        .style("display", "none")
        .style("cursor", "pointer");
    
    circle
        .on("click",(event, d) => {
                // イベントの座標を取得
            const [x, y] = d3.pointer(event);

                // 吹き出し型のtooltip を表示
        const tooltip = svg.append("g")
        .attr("class", "tooltip")
        .attr("transform", `translate(${x },${y })`) // 位置調整
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "10px")
        .style("padding", "5px");
    
        tooltip.append("rect")
            .attr("width", 350)
            .attr("height", 200)
            .attr("fill", "white")
            .attr("stroke", "black");

        tooltip.append("text")
            .attr("x", 10)
            .attr("y", 20)
            .style("font-weight", "bold") // 太字
            .style("text-align", "center") // 中央寄せ
            .text(`${d.title}`);

        tooltip.append("text")
            .attr("x", 10)
            .attr("y", 40)
            .text(`${d.url}`)
            .style("fill", "blue")
            .style("text-decoration", "underline")
            .on("click", () => window.open(d.url, "_blank"));

        const detailText = tooltip.append("text");
          
        // Detailテキストを複数行に分割して表示
        const lines = wordwrap(d.detail, 30); // 30文字で改行
        lines.forEach((line, index) => {
        detailText.append("tspan")
            .attr("x", 10)
            .attr("y", 80 + index * 20) // 行ごとに20pxずつ下にずらす
            .text(line);
        });
          
        // 改行関数
        function wordwrap(str, width) {
            let lines = [];
            while (str.length > width) {
                let line = str.substring(0, width);
                lines.push(line);
                str = str.substring(width);
            }
            lines.push(str);
            return lines;
        }})
    
    // zoomの設定
    // ズームの設定
    const zoom = d3.zoom()
    .scaleExtent([1, 8]) // 最小・最大のズーム倍率
    .on("zoom", zoomed);
    
    // SVG要素にズームを適用
    svg.call(zoom);
    // ズーム時の処理
    function zoomed(event) {
    // 現在のズームの状態を取得
    const transform = event.transform;
    
    // 地図のズームとパン
    svg.selectAll("path")
        .attr("transform", transform);
    
    // // ドットのズームとパン
      // 特定の倍率以上のときのみドットのズームとパン
    if (transform.k > 4) { // 2倍以上の場合、適当な値を設定
        svg.selectAll("circle")
        .attr("transform", transform);
        svg.selectAll("circle").style("display", "block");
    } else {
        svg.selectAll("circle").style("display", "none");
    }
}

};

/**
 * main 関数
 * 読み込み時一度だけ実行される
 */
const main = async () => {
    // data を読み込む
    const { donation_position, topojsonData } = await getData();
    // グラフを描画する
    createGraphs(donation_position, topojsonData);
};

// main();

export {getDonationPositionData}
