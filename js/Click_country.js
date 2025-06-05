// 世界地図上の国をクリックしたときに呼び出される関数
const onCountryClick = (countryData, year) => {
  const width = 800;
  const height = 600;
  // 地図を消去
  d3.select("body").select("svg").remove();
  console.log({countryData});

  // 新しいSVG要素を追加
  const svg = d3.select("body")
                .append("svg")
                .attr("width", width)
                .attr("height", height);

  // 農業用水、工業用水、生活用水のデータの配列
  const withdrawalNames = ['AgriculturalWaterWithdrawal', 'IndustrialWaterWithdrawal', 'MunicipalWaterWithdrawal'];
  const withdrawals = withdrawalNames.map(name => countryData[name]);
  console.log({withdrawals});

  // 円の半径を計算するためのスケールを設定
  const maxRadius = height / 10; // 円の最大半径を設定
  const radiusScale = d3.scaleSqrt()
    .domain([0, d3.max(withdrawals)])
    .range([0, maxRadius]);
  
    
  // 円を描画
  svg.selectAll("circle")
    .data(withdrawals)
    .enter()
    .append("circle")
    .attr("cx", (d, i) => width / 2 + i * 200 - 150) // 円の中心のx座標
    .attr("cy", d => height / 2) // 円の中心のy座標を調整して最下点を合わせる
    .attr("r", d => radiusScale(d)) // 円の半径
    .attr("fill", "none") // 塗りつぶしはなし
    .attr("stroke", "black") // 線の色を黒に設定
    .attr("stroke-width", 1.5);

  // 円の下にデータ名を表示
  svg.selectAll("text_name")
    .data(withdrawals)
    .enter()
    .append("text")
    .attr("x", (d, i) => width / 2 + i * 200 - 150) // テキストのx座標
    .attr("y", height / 2) // テキストのy座標
    .text((d, i) => withdrawalNames[i]) // データ名
    .attr("font-size", "15px")
    .attr("text-anchor", "middle"); // テキストを中央揃えにする

  // 円の下に数値を表示
  svg
    .selectAll("text_value")
    .data(withdrawals)
    .enter()
    .append("text")
    .attr("x", (d, i) => width / 2 + i * 200 - 150) // テキストのx座標
    .attr("y", height / 2 + 20) // テキストのy座標
    .text((d, i) => d) // 数値
    .attr("font-size", "15px")
    .attr("text-anchor", "middle"); // テキストを中央揃えにする
  
  // 国名を表示
  svg
    .append("text")
    .attr("class", "nameLabel")
    .attr("text-anchor", "start")
    .attr("font-size", 50)
    .attr("x", 20)
    .attr("y", height - 50) 
    .text(countryData.Country);

    // 年度を表示
    svg
    .append("text")
    .attr("class", "yearLabel")
    .attr("text-anchor", "end")
    .attr("font-size", 50)
    .attr("x", width)
    .attr("y", height - 50) 
    .text(year);
};

// 既存の国のpath要素にクリックイベントを追加
const createcircle = (event, topojsonData, csvData, year, variable, countryName) => {

  // topojsonDataから適切な国の特徴を見つける
  const feature = topojsonData.features.find(f => f.properties.name === countryName);
  console.log({'feature': feature});
  // 見つかった特徴から国名を取得
  const countryData = csvData.find(cd => cd.Country === feature.properties.name && cd.Year === year.toString());

  console.log({'Country': countryData.Country});
  if (countryData) {
    onCountryClick(countryData, year);
  }
}

export {createcircle};


// 使用例
/*** importする ***/
// import {createcircle} from './Click_country.js';

/*** createGraphsの中に以下を追加する。 ***/
// svg.data(topojsonData.features)
//         .selectAll("path")
//         .on("click", (event, d) => {
//             // 'd' は topojsonData.features の特定の要素です
//             let countryName = d.properties.name; 
//             // データがCSVデータに存在するかをチェック
//             const countryDataExists = csvData.some(data => data.Country === countryName);

//             // データが存在する場合のみ処理を実行
//             if (countryDataExists) {
//                 console.log("クリックされた国: " + countryName);
//                 createcircle(event, topojsonData, csvData, year, variable, countryName);
//             } else {
//                 // データが存在しない場合、何もしない
//                 console.log("データが存在しない国: " + countryName);
//             }
//         });