import {en_jp, unit} from './config.js'

let yAxisVariable1 = 'TotalWaterWithdrawal';
let yAxisVariable2 = 'MunicipalWaterWithdrawal';
let year = 2020;
const color1 = "#f5712d";
const color2 = "#44bbbf";
const color3 = "#797272";

const createLineChart = (csvData, countryName) => {
    // 既存のSVG要素を削除
    d3.select(".lineChart").remove();

    // d3.select(".tooltip").remove();
    
    const countryData = csvData.filter(cd => cd.Country === countryName);

    // SVG要素の設定
    const countryWindowRect = d3.select(".countryWindow").node().getBoundingClientRect();
    const width = countryWindowRect.width;
    const height =  countryWindowRect.height;
    const top_pos = countryWindowRect.top;
    const left_pos = countryWindowRect.left;

    const offset = 100;
    const height_offset = 50;
    const svg = d3
        .select("body")
        .append("svg")
        .classed("lineChart", true)
        .attr("width", width)
        .attr("height", height)
        .style("position", "absolute")
        .style("top",  top_pos + "px")
        .style("left", left_pos + "px");

    // スケールの設定
    const xScale = d3.scaleLinear()
        .domain(d3.extent(countryData, d => Math.max(0,+d.Year)))
        .range([0, width - offset * 2]);
    const yScale1 = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(countryData, d => +d[yAxisVariable1])])
        .range([height - height_offset * 2, 0]);
    const yScale2 = d3.scaleLinear()
        .domain([0, 1.2 * d3.max(countryData, d => +d[yAxisVariable2])])
        .range([height - height_offset * 2, 0]);
    

    // 縦線を描画するための要素を追加
    const verticalLine = svg.append("line")
        .attr("class", "hover-line")
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", color3)  // 線の色を指定
        .attr("stroke-width", 2)
        .style("display", "none");  // 最初は非表示
    
    // 線が固定されているかどうかを追跡するフラグ
    let isLineFixed = false;

    // クリックイベントハンドラを追加して線を固定/解除する
    svg.on("click", function(event) {
        if (!isLineFixed) {
            // 現在の位置で線を固定
            isLineFixed = true;
        } else {
            // 線を動くようにして、再度追従させる
            isLineFixed = false;
        }
    });

    // // ツールチップ要素の作成
    // const tooltip = d3.select("body").append("div")
    //     .attr("class", "tooltip")
    //     .style("position", "absolute")
    //     .style("visibility", "hidden")
    //     .style("background", "white")
    //     .style("border", "solid 1px black")
    //     .style("padding", "5px");
            

    // SVG上でマウスが移動したときのイベントハンドラを設定
    svg.on("mousemove", function(event) {
        if (!isLineFixed) {
            // マウスの位置に対応する年を取得
            const mouseX = d3.pointer(event)[0] - offset;
            const mouseY = d3.pointer(event)[1] - height_offset;
            // マウスの位置がSVGの範囲に含まれているか確認
            const isMouseInsideSVG = mouseX >= 0 && mouseX <= width - 2*offset && mouseY >= 0 && mouseY <= height -2*height_offset;
            if (isMouseInsideSVG){
                const hoveredYear = xScale.invert(mouseX);

                // 縦線を移動
                verticalLine.attr("x1", mouseX + offset)
                    .attr("x2", mouseX + offset)
                    .style("display", "block");
                
                const roundedYear = Math.round(hoveredYear);
                if (roundedYear != year){
                    year = roundedYear;

                    // // ツールチップの表示
                    // const dataForYear = countryData.find(d => +d.Year === year);
                    // if (dataForYear) {
                    //     // ツールチップの内容を更新
                    //     tooltip.html(`${en_jp[yAxisVariable1]}: ${dataForYear[yAxisVariable1]}<br>${en_jp[yAxisVariable2]}: ${dataForYear[yAxisVariable2]}`)
                    //         .style("visibility", "visible")
                    //         //.style("top", (event.pageY - 10) + "px")
                    //         .style("top", "10px")
                    //         .style("left", (event.pageX ) + "px");
                    // }

                    // カスタムイベントを発行
                    const mouseMoveEvent = new CustomEvent("LineChartMouseMove", { detail: { year: roundedYear, country: countryName } });
                    document.dispatchEvent(mouseMoveEvent);
                    d3.select(".year").text(year);
                }
            }
        }
        
    });
    
    // 軸の描画
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(5);
    const yAxis1 = d3.axisLeft(yScale1);
    const yAxis2 = d3.axisRight(yScale2);

    if(yAxisVariable1 === "GDP") {
        yAxis1.tickFormat(d3.format(".2s"));
    }
    if(yAxisVariable2 === "GDP") {
        yAxis2.tickFormat(d3.format(".2s"));
    }

    svg.append("g")
        .attr("transform", `translate(${offset}, ${height - height_offset})`)
        .call(xAxis);
    svg.append("g")
        .attr("transform", `translate(${offset}, ${height_offset})`)
        .call(yAxis1)
        .attr("fill", color1)

    svg.append("g")
        .attr("transform", `translate(${width - offset}, ${height_offset})`)
        .call(yAxis2)
        .attr("fill", color2)


    // 線の生成器
    const line = d3.line()
        .x(d => xScale(+d.Year) + offset)
        .defined(d => d[yAxisVariable1] != "")  // yAxisVariable1の欠損データを無視
        .y(d => yScale1(+d[yAxisVariable1]) + height_offset);
    // 線の描画
    svg.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", color1)
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // 第二の線の生成器と描画
    const line2 = d3.line()
        .x(d => xScale(+d.Year) + offset)
        .defined(d => d[yAxisVariable2] != "")  // yAxisVariable1の欠損データを無視
        .y(d => yScale2(+d[yAxisVariable2]) + height_offset);
    svg.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", color2) // 第二の線に別の色を使用
        .attr("stroke-width", 1.5)
        .attr("d", line2);

};


// 変数切り替えの選択ボックスと、年代変更バーを作成
const variableBox = (csvData, countryName) => {

    const allKeys = Object.keys(csvData[0]);
    const variables = allKeys.filter(key => key !== "Year" && key !== "Country");

    function createSelectBox(className, defaultVariable, onSelect, left, top, color) {
        const selectVariable = document.createElement('select');
        selectVariable.id = 'selectVariable';
        selectVariable.style.textAlign = "center";
        selectVariable.style = `position: relative; left: ${left}px; top: ${top}px; z-index: 100; text-align: center;transform: rotate(-90deg);color: ${color};`;
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
          createLineChart(csvData, countryName);
        });
      
        document.getElementsByClassName("countryWindow")[0].appendChild(selectVariable);
    }
      
    // 初めの選択ボックス
    createSelectBox('LineChart', 'TotalWaterWithdrawal', (value) => {
        yAxisVariable1 = value;
    }, -80, 80, color1);
    
    // 2番目の選択ボックス
    createSelectBox('LineChart', 'MunicipalWaterWithdrawal', (value) => {
        yAxisVariable2 = value;
    },320, 55, color2);
};

export {createLineChart, variableBox};