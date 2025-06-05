import {en_jp, unit, colors} from './config.js'

// 3つの要素の円を作る関数(農業用水、工業用水、生活用水)
const createThreeCircles = (csvData, topojsonData, info) => {
    //d3.select("body").select(".ThreeCircles").remove();
    const year = info.year;
    const countryName = info.countryName; // 初期値

    // topojsonDataから適切な国の特徴を見つける
    const feature = topojsonData.features.find(f => f.properties.name === countryName);
    //console.log({'feature': feature});
    // 見つかった特徴から国名を取得
    const countryData = csvData.find(cd => cd.Country === feature.properties.name && cd.Year === year.toString());

    // 既存のSVG要素を削除
    //d3.select("body").select("svg").remove();
  
    /** width, heightを可変に変更 */
    const width = d3.select(".UpperRightWindow").node().getBoundingClientRect().width;
    const height = d3.select(".UpperRightWindow").node().getBoundingClientRect().height;
    /** svg を変更 */
    const svg = d3
        .select("body")
        .append("svg")
        .classed("ThreeCircles", true) // 新しいクラスを追加
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("height", `${height}`)
        .attr("width", `${width}`)
        .attr("style", `display: block; margin: 0 -14px; background}: white;`)
        .style("position", "absolute")
        .style("top",   d3.select(".UpperRightWindow").node().getBoundingClientRect().top + "px")
        .style("left",  d3.select(".UpperRightWindow").node().getBoundingClientRect().left + "px")

    /** ここまで画面分割のための変更 */

    // 農業用水、工業用水、生活用水のデータの配列
    const withdrawalNames = ['AgriculturalWaterWithdrawal', 'IndustrialWaterWithdrawal', 'MunicipalWaterWithdrawal'];

    const withdrawals = withdrawalNames.map(name => countryData[name]);

    // 各変数に対する最大値を計算し、それらの中の最大値を求める
    const maxWithdrawal = d3.max(withdrawalNames, name => {
        return d3.max(csvData, d => +d[name] || 0);
    });
  
    // 円の半径を計算するためのスケールを設定
    const maxRadius = height / 4; // 円の最大半径を設定
    const radiusScale = d3.scaleSqrt()
        .domain([0, maxWithdrawal])
        .range([0, maxRadius]);
  

    /***** ここから2つ目の国について表示 ******/
    const countryName1 = info.countryName1; // 2つ目の国

    // topojsonDataから適切な国の特徴を見つける
    const feature1 = topojsonData.features.find(f => f.properties.name === countryName1);
    //console.log({'feature': feature});
    // 見つかった特徴から国名を取得
    const countryData1 = csvData.find(cd => cd.Country === feature1.properties.name && cd.Year === year.toString());

    const withdrawals1 = withdrawalNames.map(name => countryData1[name]);

    /**円の大きさの比較のため、連続して2つの円の描写が必要 */
    // 描画するための関数
    svg.selectAll("circle").remove();
    //console.log({withdrawals, withdrawals1});


    function drawCircle(data, color, i, classname) {
        //console.log({i,data, classname})
        //console.log(classname + "_" + i)
        svg.selectAll(classname + "_" + i)
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", width / 2 + i * 120) // 円の中心のx座標
            .attr("cy", height / 2 + 20) // 円の中心のy座標を調整して最下点を合わせる
            .attr("r", d => d && !isNaN(d) ? radiusScale(d) : 0) // 円の半径
            .attr("fill", color)
            .attr("stroke", color)
            .attr("stroke-width", 1.5);
    }

    for(let i = 0; i < 3; i++){
        if((withdrawals[i] === "") || (parseFloat(withdrawals[i]) > parseFloat(withdrawals1[i]) )){
            // まず大きい円を描画
            drawCircle([withdrawals[i]], colors[1], i, "A");
            // 次に小さい円を描画
            drawCircle([withdrawals1[i]], colors[0], i, "B");
        }
        else{
            drawCircle([withdrawals1[i]], colors[0], i, "B");
            drawCircle([withdrawals[i]], colors[1],  i, "A");
        }
    }

    // 円の下に数値を表示
    svg.selectAll("text_value")
        .data(withdrawals1)
        .enter()
        .append("text")
        .attr("x", (d, i) => width / 2 + i * 120) // テキストのx座標
        .attr("y", height / 2 + 88) // テキストのy座標
        .text((d) => d && !isNaN(d) ? d + "[十億m\u00B3]" : "データなし") // データ名
        .attr("font-size", "15px")
        .attr("fill", colors[0]) // テキストの色
        .attr("text-anchor", "middle"); // テキストを中央揃えにする


    // 国名を表示
    svg
        .append("text")
        .attr("class", "yearLabel")
        .attr("text-anchor", "start")
        .attr("font-size", 20)
        .attr("x", 40)
        .attr("y", 150)
        .attr("color", colors[0]) 
        // .text(countryData1.Country);
        .text("比較している国");

    /***** ここまで2つ目の国について表示 ******/
  
    // 円の上にデータ名を表示
    svg.selectAll("text_name")
        .data(withdrawals)
        .enter()
        .append("text")
        .attr("x", (d, i) => width / 2 + i * 120) // テキストのx座標
        .attr("y", height / 10) // テキストのy座標
        .text((d, i) => en_jp[withdrawalNames[i]]) // データ名
        .attr("font-size", "15px")
        .attr("text-anchor", "middle"); // テキストを中央揃えにする

    // 円の上に数値を表示
    svg.selectAll("text_value")
        .data(withdrawals)
        .enter()
        .append("text")
        .attr("x", (d, i) => width / 2 + i * 120) // テキストのx座標
        .attr("y", height / 2 - 45) // テキストのy座標
        .text((d) => d && !isNaN(d) ? d + "[十億m\u00B3]" : "データなし") // データ名
        .attr("font-size", "15px")
        .attr("color", colors[1])
        .attr("text-anchor", "middle"); // テキストを中央揃えにする
  

    
    // 国名を表示
    svg
        .append("text")
        .attr("class", "yearLabel")
        .attr("text-anchor", "start")
        .attr("font-size", 20)
        .attr("x", 40)
        .attr("y", 30)
        .attr("color", colors[1]) 
        //.text(countryData.Country);
        .text("注目している国");
};

/*** 国の選択ボックスを作る関数 ***/
const selectCountryBox = (csvData, topojsonData, info) => {
    const year = info.year;
    const variable = info.variable;
    const countryName = info.countryName; // 初期値
    
        // 紐付け成功した国名のリストを作成
    let successfulCountries = topojsonData.features.filter(feature => {
        let countryName = feature.properties.name;
        return csvData.some(d => d.Country === countryName);
    }).map(feature => feature.properties.name);

    // 重複を削除
    successfulCountries = [...new Set(successfulCountries)];

    // 紐付け成功した国名のリストをアルファベット順にソート
    successfulCountries.sort((a, b) => a.localeCompare(b));

    // 国の選択ボックスを作成
    const selectCountry = document.createElement('select');
    selectCountry.className = 'createThreeCircles countryName';
    selectCountry.style = "position: absolute; margin:5px; top: 60px; z-index: 100;";
    selectCountry.style.backgroundColor = colors[3];
    selectCountry.style.color = colors[1];
    selectCountry.style.textAlign = "center";

    // 選択ボックスにオプションを追加
    successfulCountries.forEach(countryName => {
        const option = document.createElement('option');
        option.value = countryName;
        option.textContent = countryName;
        selectCountry.appendChild(option);
    });

    // 選択ボックスのイベントリスナーを設定
    selectCountry.addEventListener('change', (event) => {
        info.countryName = event.target.value;

        // 削除
        d3.select("body").select(".ThreeCircles").remove();

        // ここで countryName を使用する処理を実行
        createThreeCircles(csvData, topojsonData, info);
    });

    /** 選択BOXで見える文字を編集するコード */
    let _countryName = info.countryName; // プライベート変数に初期値を設定

    Object.defineProperty(info, 'countryName', {
        get: function() {
            return _countryName;
        },
        set: function(newValue) {
            _countryName = newValue;
            // 選択ボックスのvalueを更新
            selectCountry.value = newValue;
            // 必要に応じて他の処理をここに追加
        }
    });
    /** 選択BOXで見える文字を編集するコード 終わり*/

    // 選択ボックスをhtmlのid=ThreeCirclesの子要素として追加
    document.getElementById("ThreeCircles").appendChild(selectCountry);

    /*** 2つ目の国の選択ボックスを作る ***/
    
    // 国の選択ボックスを作成
    const selectCountry1 = document.createElement('select');
    selectCountry1.className = 'createThreeCircles';
    selectCountry1.style = "position: absolute; margin:5px; top: 180px; z-index: 100;";
    selectCountry1.style.backgroundColor = colors[3];
    selectCountry1.style.color = colors[0];
    selectCountry1.style.textAlign = "center";

    // 選択ボックスにオプションを追加
    successfulCountries.forEach(countryName => {
        const option = document.createElement('option');
        option.value = countryName;
        option.textContent = countryName;
        selectCountry1.appendChild(option);
    });
    
    // 選択ボックスの初期値を 'Japan' に設定
    selectCountry1.value = "Japan";

    // 選択ボックスのイベントリスナーを設定
    selectCountry1.addEventListener('change', (event) => {
        info.countryName1 = event.target.value;

        // 削除
        d3.select("body").select(".ThreeCircles").remove();

        // ここで countryName を使用する処理を実行
        createThreeCircles(csvData, topojsonData, info);
    });


    // 選択ボックスをhtmlのid=ThreeCirclesの子要素として追加
    document.getElementById("ThreeCircles").appendChild(selectCountry1);

    /*** 2つ目の国の選択ボックスを作る 終わり***/
};
export {createThreeCircles, selectCountryBox};

// 使用例
/*** importする ***/
// import {createThreeCircles} from './createThreeCircles.js'; 

/*** mainの中に以下を追加する。 ***/
// selectCountryBox(csvData, topojsonData, year, variable, countryName);
// createThreeCircles(csvData, topojsonData, year, variable, countryName);