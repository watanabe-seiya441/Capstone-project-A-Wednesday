/*** 別のファイルからのインポート ***/
// データを取得する関数(topojsonデータとcsvデータを取得)
import {getData} from './getData.js';

import { createZoomableBubble, zoomableBubbleRefresher } from './createZoomableBubble.js';
import { createLineChart, variableBox} from './createLineChart.js'
import { createBubbleChart, variable2Box, BubbleChartRefresher} from './createBubbleChart.js'

import {getNews, createNews, NewsRefresher} from './createNews.js'

/**
 * main 関数
 * 読み込み時一度だけ実行される
 */
const main = async () => {
    // data を読み込む
    const { csvData, topojsonData, jsonData, rawMergedCsvData, hierarchyJson} = await getData();
    const newsData = await getNews();
    const variable = 'TotalOfAIM';

    const urlParams = new URLSearchParams(window.location.search);
    const countryName = urlParams.get('country');
    const year = parseInt(urlParams.get('year'));

    createNews(newsData,year, countryName,'country');
    NewsRefresher(newsData);

    createZoomableBubble(csvData, hierarchyJson, year, countryName);
    zoomableBubbleRefresher(csvData, hierarchyJson, year, countryName);

    variableBox(csvData, countryName);
    createLineChart(csvData, countryName);
    variable2Box(csvData, topojsonData, year, variable, countryName, jsonData); //項目選択の選択ボックスと年代変更バーを作成
    createBubbleChart(jsonData, year, countryName); 
    BubbleChartRefresher(jsonData);
};

main();