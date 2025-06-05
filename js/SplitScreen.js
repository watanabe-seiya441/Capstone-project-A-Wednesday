/*** 別のファイルからのインポート ***/
// 世界地図のデータ上に、棒グラフを描画する関数(各国の中心から伸びる棒グラフ)
import {createBarChart} from './barchart.js';
// 世界地図の国をクリックすると、3つの要素の円を現れる関数(農業用水、工業用水、生活用水) //削除予定
// import {createcircle} from './Click_country.js';
// 1つの国について、3つの要素の円を作る関数(農業用水、工業用水、生活用水)
import {createThreeCircles, selectCountryBox} from './createThreeCircles.js'; 
window.createThreeCircles = createThreeCircles;
// データを取得する関数(topojsonデータとcsvデータを取得)
import {getData} from './getData.js';

import { getNews, createNews } from './createNews.js';

// 世界地図を描画する関数(旧createGraphs)
import {createWorldMap, Button_and_Bar} from './createWorldMap.js';

import { getDonationPositionData } from './donation.js';

//import {createCartogramWorldMap} from './createCartogramWorldMap.js';


const createContents = async(csvData, topojsonData, jsonData, info, donationPositionData, newsData) => {
    // 初期設定
    let year = info.year;
    let variable = info.variable;
    let countryName = info.countryName; // 初期値

    const svgWidth = 1200;
    const svgHeight = 700;

    // SVGを作成
    const svg = d3.select("body")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);    

    /*** この行をコメントアウトすると世界地図 */
    //window.createCartogramWorldMap(csvData, topojsonData, info, donationPositionData);

    /*** ここの4行をコメントアウトすると、カルトグラム */
    // 世界地図の描画
    createWorldMap(csvData, topojsonData, info, donationPositionData);
    // ボタンとスライダーの追加(左上、右上)
    Button_and_Bar(csvData, topojsonData, info, donationPositionData, newsData);

    // document.getElementById('toggleMap').addEventListener('click', function() {
    //     var worldMap = document.getElementById('WorldMap');
    //     var cartogramMap = document.getElementById('CartgramWorldMap');
        
    //     // 世界地図とカルトグラムの表示を切り替え
    //     if (worldMap.style.display === 'none') {
    //         worldMap.style.display = 'block';
    //         cartogramMap.style.display = 'none';
    //         // 通常の世界地図を表示する関数を呼び出す
    //         createWorldMap(csvData, topojsonData, info, donationPositionData);
    //     } else {
    //         worldMap.style.display = 'none';
    //         cartogramMap.style.display = 'block';
    //         // カルトグラムを表示する関数を呼び出す
    //         window.createCartogramWorldMap(csvData, topojsonData, info, donationPositionData);
    //     }
    // });
    // 3つの円の描画
    createThreeCircles(csvData, topojsonData, info);   

    // 国の選択ボックスの追加(右上の円)
    selectCountryBox(csvData, topojsonData, info); 

    createNews(newsData, year, countryName);

};

/**
 * main 関数
 * 読み込み時一度だけ実行される
 */
// main関数の変更
const main = async () => {
    // データの読み込み
    const { csvData, topojsonData, jsonData} = await getData();
    const donationPositionData = await getDonationPositionData();
    const newsData = await getNews();
    console.log({newsData});
    console.log({csvData});
    console.log({topojsonData});
    console.log({jsonData});
    console.log({donationPositionData});

    // 初期設定
    let year = 2020;
    let variable = 'TotalPopulation';
    let countryName = 'Afghanistan'; // 初期値

    // 変数をobjectにすることで、参照渡しになる(関数の中で書き換えられる)
    let info = {
        'year': year,
        'variable': variable, // 1変数の時
        'variable1': 'AgriculturalWaterWithdrawal', // 2変数の時
        'variable2': 'IndustrialWaterWithdrawal', // 3変数の時
        'countryName': countryName,
        'countryName1': 'Japan', // 2つ目の国
        'countryName2': '' // 3つ目の国
    }
    console.log({info});

    // グローバル変数にすることで、d3v3でも使えるようにする
    window.csvData = csvData;
    window.topojsonData = topojsonData;
    window.jsonData = jsonData;
    window.donationPositionData = donationPositionData;
    window.info = info;

    createContents(csvData, topojsonData, jsonData, info, donationPositionData, newsData);
}

main();