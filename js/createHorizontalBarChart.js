const createHorizontalBarChart = (csvData, year, variable) => {
    // 指定された年のデータを抽出
    let dataForYear = csvData.filter(d => d.Year === year.toString());
    // console.log({dataForYear});

    
    // 変数が'TotalOfAIM'の場合、AIMを作成したい
    // AIM: Agricultural, Industrial, Municipalの頭文字
    // 合計値の計算（欠損値を0として扱う） 農業、工業、生活用水の合計
    const AIM = dataForYear.map(d => ({
        Country: d.Country,
        AgriculturalWaterWithdrawal: +d['AgriculturalWaterWithdrawal'] || 0,
        IndustrialWaterWithdrawal: +d['IndustrialWaterWithdrawal'] || 0,
        MunicipalWaterWithdrawal: +d['MunicipalWaterWithdrawal'] || 0,
        TotalOfAIM: (+d['AgriculturalWaterWithdrawal'] || 0) + (+d['IndustrialWaterWithdrawal'] || 0) + (+d['MunicipalWaterWithdrawal'] || 0)
    }));
    //console.log({dataForYear});
    //console.log({totalData});
    //console.log({AIM});

    // 変数が'TotalOfAIM'の場合、AIMを使う
    if (variable === 'TotalOfAIM') {
        // 農業、工業、生活用水の合計
        dataForYear = AIM;
    }

    const sortedData = dataForYear
        .map(d => ({ country: d.Country, value: +d[variable],
        AgriculturalWaterWithdrawal: +d['AgriculturalWaterWithdrawal'] || 0,
        IndustrialWaterWithdrawal: +d['IndustrialWaterWithdrawal'] || 0,
        MunicipalWaterWithdrawal: +d['MunicipalWaterWithdrawal'] || 0}))
        .sort((a, b) => d3.descending(a.value, b.value));

    // console.log({sortedData});

    // SVGのサイズとマージンを設定
    const margin = { top: 30, right: 0, bottom: 10, left: 150};
    const barHeight = 25;
    // const width = 800;
    const comparisonWindowRect = d3.select(".comparisonWindow").node().getBoundingClientRect();
    const width = comparisonWindowRect.width;
    const height = Math.ceil(sortedData.length * barHeight) + margin.top + margin.bottom;
    const top_pos = comparisonWindowRect.top;
    const left_pos = comparisonWindowRect.left;

    // スケールを設定
    const x = d3.scaleLinear()
        .domain([0, d3.max(sortedData, d => d.value)])
        .range([margin.left, width - margin.right]);
    
    const y = d3.scaleBand()
        .domain(sortedData.map(d => d.country))
        .rangeRound([margin.top, height - margin.bottom])
        .padding(0.1);

    // SVGコンテナを作成
    // d3.select("body").select("svg").remove(); // 既存のSVGを削除



    const svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("position", "absolute")
        .style("top",  top_pos + "px")
        .style("left", left_pos + "px");
    
    // X軸とグリッド線を追加
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${margin.top})`)
        .call(d3.axisTop(x)
            .tickSizeInner(-height + margin.top + margin.bottom) // グリッド線の長さ
            .tickSizeOuter(0))
        .call(g => g.selectAll(".tick line") // グリッド線のスタイルを設定
            .attr("stroke-opacity", 0.2) // 透明度の設定
            .attr("stroke-dasharray", "2,2")); // 破線のスタイル


    // Y軸を追加
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSizeOuter(0));
    
    if (variable === 'TotalOfAIM') {
        // 棒グラフのバーを描画（一部抜粋）
        svg.selectAll("g.bar")
            .data(sortedData)
            //.data(dataForYear)
            .enter()
            .append("g")
            .attr("class", "bar")
            .attr("transform", d => `translate(0,${y(d.country)})`)
            .selectAll("rect")
            .data(d => [
                {type: 'Agricultural', value: d.AgriculturalWaterWithdrawal},
                {type: 'Industrial', value: d.IndustrialWaterWithdrawal},
                {type: 'Municipal', value: d.MunicipalWaterWithdrawal}
            ])
            .enter()
            .append("rect")
            //.data(sortedData)
            //.attr("x", x(0))
            .attr("x", (d, i, nodes) => {
                // 前のバーの終了位置を計算
                let previousWidth = 0;
                for (let j = 0; j < i; j++) {
                    previousWidth += x(nodes[j].__data__.value) - x(0);
                }
                return previousWidth + x(0);
            })
            .attr("width", d => x(d.value) - x(0))
            .attr("y", (d, i) => y.bandwidth() / 3) // 位置を調整
            .attr("height", y.bandwidth()) // 高さを調整
            .attr("fill", d => {
                //console.log({value: d.value});
                // console.log({d});
                if (d.type === 'Agricultural') return 'lightgreen';
                if (d.type === 'Industrial') return 'grey';
                if (d.type === 'Municipal') return 'lightblue';
            });
    } else {

    // 棒グラフのバーを描画
    svg.append("g")
        .attr("fill", "steelblue")
      .selectAll("rect")
      .data(sortedData)
      .join("rect")
        .attr("x", x(0))
        .attr("y", d => y(d.country))
        .attr("width", d => x(d.value) - x(0))
        .attr("height", y.bandwidth());
    }

    // バーにラベルを追加
    svg.append("g")
        .attr("fill", "white")
        .attr("text-anchor", "end")
      .selectAll("text")
      .data(sortedData)
      .join("text")
        .attr("x", d => x(d.value))
        .attr("y", d => y(d.country) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("dx", -4)
        //.text(d => d.value);

    

    // 年度を表示
    svg
        .append("text")
        .attr("class", "yearLabel")
        .attr("text-anchor", "end")
        .attr("font-size", 50)
        .attr("x", width)
        .attr("y", 85) 
        .text(year);

    // 項目を表示
    const variableLabel = svg
        .append("text")
        .attr("class", "createWorldMap")
        .attr("text-anchor", "start")
        .attr("font-size", 25)
        .attr("x", 180)
        .attr("y", 85) 
        .text(variable);
    if(variable === 'TotalOfAIM') {
    // 色の意味を表示
        const colorMean = svg.append("text")
            .attr("class", "colorMean")
            .attr("text-anchor", "start") // "end"から"start"に変更
            .attr("font-size", 20)
            .attr("x", width - 300) // X位置を調整
            .attr("y", 240)
            .attr("fill", "black");

        // colorMean.append("tspan")
        //     .attr("x", width - 300) // X位置を設定
        //     .attr("dy", "1em") // 最初の行のY位置を設定
        //     .text("Red: Agricultural Withdrawal");

        // colorMean.append("tspan")
        //     .attr("x", width - 300) // X位置を設定
        //     .attr("dy", "1.5em") // 次の行のY位置を設定（現在位置から1.5em下に移動）
        //     .text("Blue: Industrial Withdrawal");

        // colorMean.append("tspan")
        //     .attr("x", width - 300) // X位置を設定
        //     .attr("dy", "1.5em") // 次の行のY位置を設定（現在位置から1.5em下に移動）
        //     .text("Orange: Municipal Withdrawal");

            
    }
};



// 変数切り替えの選択ボックスと、年代変更バーを作成
const variableBox_and_yearBar = (csvData, topojsonData, year, variable, countryName) => {
    
    // 変数の選択ボックスを作成(SVGの範囲外, 後に修正)
    const selectVariable = document.createElement('select');
    selectVariable.id = 'selectVariable';
    selectVariable.style = "position: absolute; left: 150px; top: 100px;";
    selectVariable.style.textAlign = "center"; // テキストを中央揃えにする
    selectVariable.className = 'HorizontalBarChart';

    // 選択Boxにvariablesの項目を追加
    // variablesの項目はcsvData の最初のオブジェクトからキーを取得し、Year と Country を除外したもの
    const allKeys = Object.keys(csvData[0]);
    const variables = allKeys.filter(key => key !== "Year" && key !== "Country");
    variables.push('TotalOfAIM');
    variables.forEach((v) => {
        let option = document.createElement('option');
        option.value = v;
        option.textContent = v;
        selectVariable.appendChild(option);
    });
    // console.log('選択ボックスの中身: ', selectVariable);

    // 選択ボックスのイベントリスナーを設定(選択ボックスを選択した時の動作)
    selectVariable.addEventListener('change', (event) => {
        variable = event.target.value;
        console.log('選択された変数: ', variable);

        // 水平棒グラフを作成
        createHorizontalBarChart(csvData, year, variable);
    });

    // 選択ボックスをドキュメントに追加
    document.body.appendChild(selectVariable);


    const width = 800;

    // 年度選択のスライダーを作成(SVGの範囲外, 後に修正)
    const sliderContainer = d3.select("body").append("div")
        .attr("id", "slider-container")
        .attr("class", "HorizontalBarChart")
        .style("width", width + "px")
        .style("display", "flex")
        .style("position", "absolute") // 常に固定
        .style("left", "670px")
        .style("top", "160px"); 

    sliderContainer.append("input")
        .attr("type", "range")
        .attr("min", 1965)
        .attr("max", 2020)
        .attr("value", year)
        .on("input", function() {
            year = this.value;
            //console.log('variableの中身: ', variable);
            createHorizontalBarChart(csvData, year, variable);
        });
};

export {createHorizontalBarChart, variableBox_and_yearBar};