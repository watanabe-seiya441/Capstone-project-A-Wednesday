import {en_jp, unit} from './config.js'

/**
 * バブルチャートを描画する関数
 */
let xAxisVariable = "TotalWaterWithdrawal";
let yAxisVariable = "MunicipalWaterWithdrawal";
let circleVariable = "TotalPopulation";

// ズームの状態（d3.zoomTransformオブジェクト）を保存するグローバル変数
let currentZoomState = d3.zoomIdentity;

const createBubbleChart = (jsonData, year, countryName) => {


    // 既存のSVG要素を削除
    d3.select(".bubbleChart").remove();

    const offset = 80;
    // let year = 2000; // 初期年
    const endYear = 2020;   // 最終年
    // const color = d3.scaleOrdinal(d3.schemeCategory10);

    // SVG要素の設定
    const partialWindowRect = d3.select("#comparisonWindow").node().getBoundingClientRect();
    const width = partialWindowRect.width;
    const height =  partialWindowRect.height;
    const top_pos = partialWindowRect.top;
    const left_pos = partialWindowRect.left;

    const svg = d3.select("body").append("svg")
        .classed("bubbleChart", true)
        .attr("width", `${width}px`)
        .attr("height", `${height}px`)
        .style("position", "absolute")
        .style("top",  top_pos -20 + "px")
        .style("left", left_pos + "px");

    
    // 指定された年における欠損データのチェック
    const filteredData = jsonData.filter(d => {
        const xValue = d[xAxisVariable].find(v => v[0] === year);
        const yValue = d[yAxisVariable].find(v => v[0] === year);
        return xValue && xValue[1] != null && yValue && yValue[1] != null;
    });

    // フィルタリングされたデータの数(データが存在する国の数を表示)を保存
    let num_Data = filteredData.length;
    svg
        .append("text")
        .attr("class", "num_Data")
        .attr("text-anchor", "start")
        .attr("font-size", 10)
        .attr("x", width - 130)
        .attr("y", height - 10) 
        .text("データが存在する国:" + num_Data);

    // スケール関数のレンジの調整
    // スケールの定義（x軸とy軸の変数に基づいて）
    const xScale = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(jsonData, d => d3.max(d[xAxisVariable], d => d[1] ? +d[1] : 0))])
        .range([0, width - offset * 2]);

    const yScale = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(jsonData, d => d3.max(d[yAxisVariable], d => d[1] ? +d[1] : 0))])
        .range([height - offset * 2, 0]);

    const circleScale = d3.scaleSqrt()
        .domain([0, d3.max(jsonData, d => d3.max(d[circleVariable], d => d[1]))])
        .range([1, 50]); // 円のサイズの範囲

    // 軸の定義
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    // 軸の追加
    svg.append("g")
        .attr("class", "xAxis")
        .attr("transform", `translate(${offset}, ${height - offset})`)
        .call(xAxis)
    
    svg.append("g")
        .attr("class", "yAxis")
        .attr("transform", `translate(${offset}, ${offset})`)
        .call(yAxis)

    // d3.bisectorを使用してbisect関数を定義
    const bisect = d3.bisector(d => d[0]).left;

    // データのインターポレーション関数
    const interpolateValues = (values, year) => {
        const i = bisect(values, year, 0, values.length - 1);
        const a = values[i];
        if (i > 0) {
            const b = values[i - 1];
            const t = (year - a[0]) / (b[0] - a[0]);
            return a[1] * (1 - t) + b[1] * t;
        }
        return a[1];
    };

    // データの更新関数
    const updateData = () => {
        return filteredData.map(d => ({
            name: d.Country,
            xValue: interpolateValues(d[xAxisVariable], year),
            yValue: interpolateValues(d[yAxisVariable], year),
            circleValue: interpolateValues(d[circleVariable], year)

        }));
    };

    // バブルの描画
    let circle = svg.selectAll(".bubble")
        .data(updateData())
        .enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", d => xScale(d.xValue) + offset)
        .attr("cy", d => yScale(d.yValue) + offset)
        // .attr("r", d => circleScale(d.circleValue))
        .attr("r", 10)
        //.attr("stroke", "black")
        .attr("opacity", 0.5)
        .style("fill", "rgb(255, 255, 255)")
        // 強調表示
        .style("opacity", d => { return d.name === countryName? 1: 0.6 })
        //.style("fill", d => { return d.name === countryName? "blue": "rgb(255, 255, 255)" })
        .style("stroke", d => { return d.name === countryName? "orange": "black" })
        .style("stroke-width", d => { return d.name === countryName? 3:1})
        //.style("stroke", "blue")
        // .style("stroke-width", 2);
    // 強調表示する国のバブルを選択

    svg.selectAll(".bubble")
        //.data(updateData().filter(d => d.name === countryName))
        .filter(d => d.name === countryName)
        .raise();

    /** マウスオーバー時の処理を追加 **/
    svg.selectAll(".bubble")
        .on("mouseover", (event, d) => { // マウスが要素に乗った時の処理
            // 既存のツールチップを削除
            d3.select(".tooltip").remove();

            // ツールチップ要素を作成
            const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("background-color", 'rgb(237, 236, 236)')
                .style("border-radius", "6px")
                .style("opacity", 0)
                .style("position", "absolute"); // 追加
            
            tooltip.html(`
                ${d.name}<br>
                ${en_jp[xAxisVariable]}: ${d.xValue} (${unit[xAxisVariable]})<br>
                ${en_jp[yAxisVariable]}: ${d.yValue} (${unit[yAxisVariable]})<br>
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px")
            .style("opacity", 1);
        })
        /** マウスが要素から離れた時の処理 */
        .on("mouseout", () => {
            // ツールチップを消す
            d3.select(".tooltip").remove(); 
        });


    /*** 拡大縮小の設定 ***/
    const zoom = d3.zoom()
        .scaleExtent([1, 500])  // ズームの範囲を設定
        .on("zoom", zoomed);    // ズームイベントハンドラーを設定

    //ズーム倍率の表示 if(currentZoomState)....の前におかないとエラー
    const zoomLabel = svg
        .append("text")
        .attr("class", "zoomLabel")
        .attr("text-anchor", "end")
        .attr("font-size", 20)
        .attr("x", width - 10)
        .attr("y", 50) 
        .text("Zoom: 1.00");

    // SVG 要素にズームイベントを追加
    svg.call(zoom);
    console.log({currentZoomState})

    /** 年代変更の時のズームの維持 */
    if(currentZoomState) {
        // 保存されたズーム状態を適用
        svg.call(zoom.transform, currentZoomState);
        //zoom.transform(svg, currentZoomState);
    }

    // ズームイベントハンドラー
    function zoomed(event) {
        // ズーム倍率の表示を更新
        zoomLabel.text(`Zoom: ${event.transform.k.toFixed(2)}`);
        console.log(event.transform)

        // // 新しいスケールを取得
        const newXScale = event.transform.rescaleX(xScale).range([0, width - offset * 2]);
        const newYScale = event.transform.rescaleY(yScale).range([height - offset * 2, 0]);

        currentZoomState = event.transform; // グローバル変数を更新
        console.log(currentZoomState.k)

        // 軸を更新
        if(xAxisVariable === "GDP") {
            svg.select(".xAxis").call(d3.axisBottom(newXScale).ticks(5).tickFormat(d3.format(".2s")));
        }
        else {
            svg.select(".xAxis").call(d3.axisBottom(newXScale).ticks(5));
        }
        if(yAxisVariable === "GDP" || yAxisVariable === "GDPPerCapita" || yAxisVariable === "TotalPopulationWithoutAccessToSafeDrinkingWater") {
            svg.select(".yAxis").call(d3.axisLeft(newYScale).ticks(5).tickFormat(d3.format(".2s")));
        }
        else {
            svg.select(".yAxis").call(d3.axisLeft(newYScale).ticks(5));
        }



        // バブルの位置とサイズを更新（ズームに応じて）
        svg.selectAll(".bubble")
            .attr("cx", d => newXScale(d.xValue) + offset)// オフセットはスケール変換後に足す(offsetは固定)
            .attr("cy", d => newYScale(d.yValue) + offset)
            // .attr("r", d => circleScale(d.circleValue)); // サイズもズームに応じて変更
            .attr("r", d => 5); // サイズもズームに応じて変更
    };
    /*** 拡大縮小の設定 終わり***/

};

// 変数切り替えの選択ボックスと、年代変更バーを作成
const variable2Box = (csvData, topojsonData, year, variable, countryName, jsonData) => {
    const allKeys = Object.keys(csvData[0]);
    const variables = allKeys.filter(key => key !== "Year" && key !== "Country");

    function createSelectBox(className, defaultVariable, onSelect, left, top, rotation) {
        const selectVariable = document.createElement('select');
        selectVariable.id = 'selectVariable';
        selectVariable.style.textAlign = "center";
        selectVariable.style = `position: relative; left: ${left}px; top: ${top}px; z-index: 100; text-align: center;transform: rotate(${rotation || 0 }deg);`;
        selectVariable.className = className;
        variables.forEach((v) => {
            const option = document.createElement('option');
            option.value = v;
            option.textContent = en_jp[v]+`(${unit[v]})`;
            if (v === defaultVariable) {
                option.selected = true;
            }
            selectVariable.appendChild(option);
        });
      
        selectVariable.addEventListener('change', (event) => {
          onSelect(event.target.value);

          createBubbleChart(jsonData, year, countryName);
        });
      
        document.getElementById("comparisonWindow").appendChild(selectVariable);
    }
      
    // 初めの選択ボックス
    createSelectBox('BubbleChart', 'TotalWaterWithdrawal', (value) => {
        xAxisVariable = value;
    }, 75, 225);
    
    // 2番目の選択ボックス
    createSelectBox('BubbleChart', 'MunicipalWaterWithdrawal', (value) => {
        yAxisVariable = value;
    }, -90, 70, -90);
    
    // // 3番目の選択ボックス
    // createSelectBox('BubbleChart', 'TotalPopulation', (value) => {
    //     circleVariable = value;
    // }, 150, -50);

};

const BubbleChartRefresher = (jsonData) => {
    document.addEventListener("LineChartMouseMove", function(event) {
        const { year, country} = event.detail;
        const countryName = country;
        // 既存のSVG要素を削除
        d3.select(".bubbleChart").remove();
        console.log({countryName});

        createBubbleChart(jsonData, year, countryName);
    });
};

export { createBubbleChart, variable2Box, BubbleChartRefresher};
