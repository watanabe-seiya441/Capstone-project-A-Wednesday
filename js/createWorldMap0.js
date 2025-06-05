/*** 別のファイルからのインポート ***/
import {createNews} from './createNews.js';

import {createThreeCircles} from './createThreeCircles.js';

import {en_jp, unit} from './config.js'

/**
 * グラフを描画する関数
 */
const createWorldMap = (csvData, topojsonData, info, donationPositionData, newsData) => {
    const year = info.year;
    const variable = info.variable;

    /** width, heightを可変にする */
    const width = d3.select(".UpperLeftWindow").node().getBoundingClientRect().width;
    const height = d3.select(".UpperLeftWindow").node().getBoundingClientRect().height;
    /** svgを作成 */
    const svg = d3
        .select("body")
        .append("svg")
        .classed("WorldMap", true) // 新しいクラスを追加
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("height", `${height}`)
        .attr("width", `${width}`)
        .attr("fill", "#44bbbf")
        .attr("style", `display: block; padding: 10 10px; background: white};`)
        .style("position", "absolute")
        .style("top",   d3.select(".UpperLeftWindow").node().getBoundingClientRect().top + "px")
        .style("left",  d3.select(".UpperLeftWindow").node().getBoundingClientRect().left + "px");

    /** ここまで画面分割のための変更 */

    // 選択された年のデータをフィルタリング(dataはcsvデータ)
    const filteredData = csvData.filter(d => d.Year === year.toString());   

    // const domain = [d3.min(filteredData, d => +d[variable]), d3.max(filteredData, d => +d[variable])]; // 年ごとの最大最小を取得
    const domain = [d3.min(csvData, d => +d[variable]), d3.max(csvData, d => +d[variable])]; // 全ての年代の中での最大最小を取得

    const color = d3.scaleLinear().domain(domain).range([255, 0]);

    function color_given_range(value, range_start, range_end){
        return Math.floor(d3.scaleLinear().domain(domain).range([range_start, range_end])(value));
    } 

    // 世界地図を描画
    const projection = d3
        .geoConicEqualArea()
        .translate([width / 2.5, height / 2])
        .scale(120);

    const path = d3.geoPath().projection(projection);

    svg.selectAll("path")
        .data(topojsonData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("cursor", "pointer")
        .attr("fill", (d) => {

            const value = d.properties[variable][year];
            // console.log({value});
            if (value) { // 値が存在する場合
                //const colorValue = Math.floor(color(value[year]));
                const numericValue = parseFloat(value.replace(/,/g, '')); // カンマがあれば取り除く
                // const colorValue = Math.floor(color(numericValue));
                // return `rgb(255, ${colorValue}, ${colorValue})`;
                return `rgb(${color_given_range(numericValue,255, 96)},${color_given_range(numericValue,255, 209)},${color_given_range(numericValue,255, 245)})`
                
            } else { // データが欠損している場合
                return "rgb(150, 150, 150)"; // 灰色で表示
            }
        })
        .attr("stroke", "#333333")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d) => { 
            const tooltip = svg.append("text")
                .attr("class", "tooltip")
                .attr("x", 10)
                .attr("y", 20)
                .attr("fill", "black")

            tooltip.append("tspan")
                .attr("x", 10)
                .attr("dy", "0")
                .text(`${d.properties.name}`);

            tooltip.append("tspan")
                .attr("x", 10)
                .attr("dy", "20")
                .text(() => {
                    if (d.properties[variable][year]) { // 値が存在する場合
                        return `${en_jp[variable]}: ${d.properties[variable][year]} (${unit[variable]})`;
                    } else { // データが欠損している場合
                        return `${en_jp[variable]}:  データなし` // 灰色で表示
                    }
                });
        })
        .on("mouseout", () => {
            d3.selectAll(".tooltip").remove();
        });
    
    let selectedCountry = null; // 現在選択されている国を追跡するための変数
     
    // 国をクリックしたときの処理
    svg.data(topojsonData.features)
        .selectAll("path")
        .on("click", (event, d) => {
            // 'd' は topojsonData.features の特定の要素です
            let countryName = d.properties.name; 
            // データがCSVデータに存在するかをチェック
            const countryDataExists = csvData.some(data => data.Country === countryName);

            // データが存在する場合のみ処理を実行
            if (countryDataExists) {
                console.log("クリックされた国: " + countryName);
                info.countryName = countryName;

                // 同じ国が再度クリックされた場合は強調表示を解除
                if (selectedCountry === countryName) {
                    d3.selectAll("path")
                        .style("stroke", "#333333")
                        .style("stroke-width", 0.5);
                    selectedCountry = null; // 選択されている国をリセット
                } 
                else { // 新しい国が選択された場合は、以前に選択された国の強調表示をリセット
                    d3.selectAll("path")
                        .style("stroke", "#333333")
                        .style("stroke-width", 0.5);

                    // 新しい国を強調表示
                    d3.select(event.currentTarget)
                        .style("stroke", "blue")
                        .style("stroke-width", 2);

                    selectedCountry = countryName; // 選択されている国を更新
                }

                // 削除
                d3.select("body").select(".ThreeCircles").remove();
                createThreeCircles(csvData, topojsonData, info);
            } else {
                // データが存在しない場合、何もしない
                console.log("データが存在しない国: " + countryName);
            }
        });

    // 寄付プロジェクトのデータをプロットする。
    const image = svg.selectAll("image").data(donationPositionData).enter().append("image");

    const icon_width = 10;
    const icon_height = 10;

    image
        .attr("x", (d) => {
            return projection([d.longitude, d.latitude])[0] - icon_width/2.0;
        })
        .attr("y", (d) => projection([d.longitude, d.latitude])[1] - icon_height/2.0)
        .attr("width", icon_width)
        .attr("height", icon_height)
        .attr("xlink:href", "./resources/donation2.svg")
        .attr("fill", "#f8bbd0")
        .style("display", "none")
        .style("cursor", "pointer");
    
    image
        .on("click",(event, d) => {
                // イベントの座標を取得
            const [x, y] = d3.pointer(event);

            // 吹き出し型のtooltip を表示
            const tooltip = svg.append("g")
            .attr("class", "tooltip")
            // .attr("transform", `translate(${x},${y})`) // 位置調整

            // foreignObject要素を追加
            const foreignObject = tooltip.append("foreignObject")
                .attr("width", 400) // HTMLコンテンツの幅
                .attr("height", 600); // HTMLコンテンツの高さ

            // HTMLコンテンツを追加
            foreignObject.html(`
            <div class="container">
                <h3>${d.title}</h3>
                <span class="close"></span>

                <div class="slider-container">
                    <div class="slider-turn">
                        <p>
                        ${d.detail}
                        </p>
                    </div>
                </div>
                <div class="bottom">
                    <button class="btn">もっと見る</button>
                </div> 
            </div>
            `);
            const btn = d3.select(".btn");

            // ボタンがクリックされたときの処理を定義する
            btn.on("click", function() {
                window.open(d.url, "_blank");
            });

            // 閉じるボタンがクリックされたときの処理を書く。
            const closeBtn = d3.select(".close");

            // .close要素がクリックされたときの処理を定義する
            closeBtn.on("click", function() {
            tooltip.remove();
            });
        })

    // zoom 設定
    // ズームの設定
    const zoom = d3.zoom()
        .scaleExtent([1, 6]) // 最小・最大のズーム倍率
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
        if (transform.k > 2) { // 2倍以上の場合、適当な値を設定
            svg.selectAll("image")
            .attr("transform", transform);
            svg.selectAll("image").style("display", "block");

        } else {
            svg.selectAll("image").style("display", "none");

        }

        // ズーム倍率の表示を更新
        zoomLabel.text(`Zoom: ${transform.k.toFixed(2)}`);
    };

    //ズーム倍率の表示
    const zoomLabel = svg
        .append("text")
        .attr("class", "zoomLabel")
        .attr("text-anchor", "end")
        .attr("font-size", 20)
        .attr("x", width - 10)
        .attr("y", 50) 
        .text("Zoom: 1.00");

    // 年度を表示
    const yearLabel = svg
        .append("text")
        .attr("class", "year")
        .attr("text-anchor", "end")
        .attr("font-size", 50)
        .attr("x", width - 10)
        .attr("y", height - 50) 
        .text(year);

    //createBarChart(svg, topojsonData, csvData, variable, path, year);
};

const Button_and_Bar = (csvData ,topojsonData, info, donationPositionData, newsData) => {
    const year = info.year;


    // 変数選択ボタン
    const variables = ['TotalPopulation', 'AgriculturalWaterWithdrawal', 'IndustrialWaterWithdrawal', 'MunicipalWaterWithdrawal', 'TotalWaterWithdrawal', 'TotalWaterWithdrawalPerCapita', 'TotalPopulationWithoutAccessToSafeDrinkingWater'];

    // 変数の選択ボックスを作成(SVGの範囲外, 後に修正)
    const selectVariable = document.createElement('select');
    selectVariable.className = 'WorldMap_Box';
    selectVariable.style = "position: absolute; margin:5px; bottom: 0px; z-index: 100;";
    selectVariable.style.width = "200px;"; // 幅を設定
    selectVariable.style.textAlign = "center";
    selectVariable.style.backgroundColor = "#44bbbf";



    // 選択ボックスにオプションを追加
    variables.forEach(v => {
        const option = document.createElement('option');
        option.value = v;
        option.textContent = en_jp[v];
        selectVariable.appendChild(option);
    });

    // 選択ボックスのイベントリスナーを設定
    selectVariable.addEventListener('change', (event) => {
        info.variable = event.target.value;

        // 削除
        d3.select("body").select(".WorldMap").remove();

        // createWorldMap(csvData, topojsonData, info, donationPositionData);
        createCartogramWorldMap(csvData, topojsonData, info, donationPositionData);
    });

    // 選択ボックスをドキュメントに追加
    // document.body.appendChild(selectVariable);
    document.getElementById("WorldMap").appendChild(selectVariable);

    // スライダーコンテナの作成
    const sliderContainer = document.createElement("div");
    sliderContainer.id = "sliderContainer";
    sliderContainer.style = "width: 100%;"; // コンテナのスタイル設定

    // スライダーの作成
    const slider = document.createElement("input");
    slider.setAttribute("type", "range");
    slider.setAttribute("min", "1965");
    slider.setAttribute("max", "2020");
    slider.style.width = "20%"; // スライダーの長さをコンテナに合わせる
    slider.style.height = "10px"; // スライダーの太さを変更
    slider.style.zIndex = "100";
    slider.style.position = "absolute"; // 常に固定
    slider.style.left = "480px";
    slider.style.bottom = "0px"; // ページの最下部から
    slider.value = year;

    // スライダーのイベントリスナーを設定
    slider.oninput = function() {
        info.year = this.value;
        
        d3.select("body").select(".WorldMap").remove(); // 削除
        
        // createWorldMap(csvData, topojsonData, info, donationPositionData);
        createCartogramWorldMap(csvData, topojsonData, info, donationPositionData);

        d3.select("body").select(".ThreeCircles").remove();
        createThreeCircles(csvData, topojsonData, info);
        createNews(newsData, Number(info.year), info.countryName);
    };

    // スライダーをコンテナに追加
    sliderContainer.appendChild(slider);

    // スライダーコンテナをドキュメントに追加
    document.getElementById("WorldMap").appendChild(sliderContainer);

} 


// 使用例
/*** importする ***/
// import {Button_and_Bar} from './Botton_and_Bar.js';

/*** mainの中に以下を追加する。 ***/
// Button_and_Bar(data ,topojsonData, year, variable, createGraphs)

export {createWorldMap, Button_and_Bar};