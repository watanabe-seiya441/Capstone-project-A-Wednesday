/*** 別のファイルからのインポート ***/
// 世界地図のデータ上に、棒グラフを描画する関数(各国の中心から伸びる棒グラフ)
import {createBarChart} from './barchart.js';
// 世界地図の国をクリックすると、3つの要素の円を現れる関数(農業用水、工業用水、生活用水) //削除予定
// import {createcircle} from './Click_country.js';
// 1つの国について、3つの要素の円を作る関数(農業用水、工業用水、生活用水)
import {createThreeCircles, selectCountryBox} from './createThreeCircles.js'; 
// データを取得する関数(topojsonデータとcsvデータを取得)
import {getData} from './getData.js';

// 世界地図を描画する関数(旧createGraphs)
import {createWorldMap, Button_and_Bar} from './createWorldMap.js';

// 水平棒グラフを作る関数
import {createHorizontalBarChart, variableBox_and_yearBar} from './createHorizontalBarChart.js';

// バブルチャートを作る関数
import {createBubbleChart, variable2Box} from './createBubbleChart.js';

// 折れ線グラフを作る関数
import {createLineChart, variableBox_and_CountryBox} from './createLineChart.js';

// モード変更(世界地図、3つの要素の円、水平棒グラフなどの切り替え)
const switchMode = (mode, csvData, jsonData, topojsonData, year, variable, countryName) => {
    switch(mode){
        // グラフを描画する
        case 'map': {
            Button_and_Bar(csvData ,topojsonData, year, variable, createWorldMap);
            createWorldMap(csvData, topojsonData, year, variable);
            break;
        }
        // 3つの要素の円を描画する
        case 'circle': {
            selectCountryBox(csvData, topojsonData, year, variable, countryName); //国の選択ボックスを作成
            createThreeCircles(csvData, topojsonData, year, variable, countryName); 
            break;
        }
        // 水平棒グラフを作成 
        case 'HorizontalBarChart': {

            variableBox_and_yearBar(csvData, topojsonData, year, variable, countryName); //項目選択の選択ボックスと年代変更バーを作成
            createHorizontalBarChart(csvData, year, variable); // 水平棒グラフを作成  
            break;
        }

        // バブルチャートを作成 
        case 'BubbleChart': {
            variable2Box(csvData, topojsonData, year, variable, countryName, jsonData); //項目選択の選択ボックスと年代変更バーを作成
            createBubbleChart(jsonData, year); // 水平棒グラフを作成  
            break;
        }

        // バブルチャートを作成 
        case 'LineChart': {
            variableBox_and_CountryBox(csvData, countryName); //項目選択の選択ボックスと年代変更バーを作成
            createLineChart(csvData, countryName); // 折れ線グラフを作成  
            break;
        }
    }
}

/**
 * モード切り替えの選択ボックスを作成
 * (モード追加時はswitchModeとmodeBoxをいじるだけでOK)
 * 選択Boxの追加、特定のクラスを持つ全ての要素を削除、
 * switchModeでのcase先を増やせば良い
 */
const ModeBox = (mode, csvData, jsonData, topojsonData, year, variable, countryName) => {
    // モードの選択ボックスを作成(SVGの範囲外, 後に修正)
    const selectMode = document.createElement('select');
    selectMode.id = 'selectMode';
    selectMode.style = "position: absolute; right: 50px; top: 100px;";

    // 選択ボックスに世界地図を描画するを描画するオプションを追加
    let option = document.createElement('option');
    option.value = 'map';
    option.textContent = 'map';
    selectMode.appendChild(option);

    // 選択ボックスに3つの要素の円を描画するオプションを追加
    option = document.createElement('option');
    option.value = 'circle';
    option.textContent = 'circle';
    selectMode.appendChild(option);

    // 選択ボックスに水平棒グラフを作成するオプションを追加
    option = document.createElement('option');
    option.value = 'HorizontalBarChart';
    option.textContent = 'HorizontalBarChart';
    selectMode.appendChild(option);

    // 選択ボックスにバブルチャートを作成するオプションを追加
    option = document.createElement('option');
    option.value = 'BubbleChart';
    option.textContent = 'BubbleChart';
    selectMode.appendChild(option);

    // 選択ボックスに折れ線グラフを作成するオプションを追加
    option = document.createElement('option');
    option.value = 'LineChart';
    option.textContent = 'LineChart';
    selectMode.appendChild(option);

    // 選択ボックスのイベントリスナーを設定
    selectMode.addEventListener('change', (event) => {
        mode = event.target.value;
        console.log('選択されたモード: ', mode);

        // 特定のクラスを持つ全ての要素を削除
        document.querySelectorAll('.world-map').forEach(element => {
            element.remove();
        });
        document.querySelectorAll('.createThreeCircles').forEach(element => {
            element.remove();
        });
        document.querySelectorAll('.HorizontalBarChart').forEach(element => {
            element.remove();
        });
        document.querySelectorAll('.BubbleChart').forEach(element => {
            element.remove();
        });
        document.querySelectorAll('.LineChart').forEach(element => {
            element.remove();
        });

        // モード変更(世界地図、3つの要素の円、水平棒グラフなどの切り替え)
        switchMode(mode, csvData, jsonData, topojsonData, year, variable, countryName);
    });

    // 選択ボックスをドキュメントに追加
    document.body.appendChild(selectMode);
}

/**
 * main 関数
 * 読み込み時一度だけ実行される
 */
const main = async () => {
    // data を読み込む
    const { csvData, topojsonData, jsonData} = await getData();
    console.log({csvData}); // データの中身を確認
    console.log({topojsonData}); // データの中身を確認
    console.log({jsonData}); // データの中身を確認

    // 初期設定
    let year = 1965;
    let variable = 'TotalPopulation';
    let countryName = 'Afghanistan'; // 初期値

    let mode = 'map'; // map or circle or HorizontalBarChart 'BubbleChart'
    //とりあえず画面切り替えを変数で決める。

    // モード変更の選択ボックスを作成
    ModeBox(mode, csvData, jsonData, topojsonData, year, variable, countryName); 

    // モード変更(世界地図、3つの要素の円、水平棒グラフなどの切り替え)
    switchMode(mode, csvData, jsonData, topojsonData, year, variable, countryName);
};

main();