/**
 * data を読み込む関数
 */
const getData = async () => {
    // 人口データを読み込む
    let csvData = await d3.csv("./data/MergedData.csv");
    csvData = csvData.filter(d => parseInt(d.Year) >= 1995);

    // 世界地図のデータを読み込む
    const worldJson = await d3.json("./data/countries_110m.topojson");
    const topojsonData = topojson.feature(worldJson, worldJson.objects.countries);

    // zoomable bubble用に、MergedData.csvと、国や地域の階層構造を設定する。
    const rawMergedCsvData = await d3.csv("./data/MergedData.csv");
    const hierarchyJson = await d3.json("./data/modifiedCountryHierarchy.json");

    // マッピングテーブル //左がtopojsonの国名、右がcsvの国名 
    // gpt産で関係ない国も混じってしまっている。
    const countryNameMappings = {
        'Tanzania': 'United Republic of Tanzania',
        'W. Sahara': 'Western Sahara',
        'Dem. Rep. Congo': 'Democratic Republic of the Congo',
        'Dominican Rep.': 'Dominican Republic',
        'Russia': 'Russian Federation',
        'Falkland Is.': 'Falkland Islands (Malvinas)',
        'Fr. S. Antarctic Lands': 'French Southern and Antarctic Lands',
        'Bolivia': 'Bolivia (Plurinational State of)',
        'Venezuela': 'Venezuela (Bolivarian Republic of)',
        'Central African Rep.': 'Central African Republic',
        'Eq. Guinea': 'Equatorial Guinea',
        'eSwatini': 'Eswatini',
        'Laos': "Lao People's Democratic Republic",
        'Vietnam': 'Viet Nam',
        'North Korea': "Democratic People's Republic of Korea",
        'South Korea': 'Republic of Korea',
        'Iran': 'Iran (Islamic Republic of)',
        'Syria': 'Syrian Arab Republic',
        'Moldova': 'Republic of Moldova',
        'Turkey': 'Türkiye',
        'Netherlands': 'Netherlands (Kingdom of the)',
        'New Caledonia': 'New Caledonia',
        'Solomon Is.': 'Solomon Islands',
        'Taiwan': 'Taiwan (Province of China)',
        'United Kingdom': 'United Kingdom of Great Britain and Northern Ireland',
        'Brunei': 'Brunei Darussalam',
        'Antarctica': 'Antarctica',
        'N. Cyprus': 'Northern Cyprus',
        'Somaliland': 'Somaliland region',
        'Bosnia and Herz.': 'Bosnia and Herzegovina',
        'Macedonia': 'North Macedonia',
        'Kosovo': 'Republic of Kosovo',
        'S. Sudan': 'South Sudan'
    };

    d3.hierarchy(hierarchyJson).each((d)=>{
        for(const [topoName, csvName] of Object.entries(countryNameMappings)) {
            if (d.data.id === csvName) {
                d.data.id = topoName;
                break; // 適切なマッピングが見つかったらループを抜ける
            }}
    ;});
    console.log({hierarchyJson});

    // CSVデータの国名をTopoJSONの国名に合わせる
    csvData.forEach(row => {
        for (const [topoName, csvName] of Object.entries(countryNameMappings)) {
            if (row.Country === csvName) {
                row.Country = topoName;
                break; // 適切なマッピングが見つかったらループを抜ける
            }
        }
    });

    // csvData 配列を更新する関数
    // 小数点以下3桁に丸める
    function truncateToTwoDecimalPlaces(value) {
        if (!value) return "";
    
        // 数値を100倍してから整数に変換し、再び100で割る
        return (Math.floor(parseFloat(value) * 1000) / 1000).toString();
    }
    /*** 1人当たりの情報を追加 ***/
    function updateCsvDataForPerCapita(csvData) {
        const multiplier = 10 ** 6;  // 10^6 の乗算係数
    
        csvData.forEach(item => {
            // 'MunicipalWaterWithdrawalPerCapita' の計算と追加
            // m^3 /人 
            if (item.MunicipalWaterWithdrawal !== "" && item.TotalPopulation !== "") {
                let perCapitaValue = (parseFloat(item.MunicipalWaterWithdrawal) / parseFloat(item.TotalPopulation * 10**3) * multiplier).toString();
                item.MunicipalWaterWithdrawalPerCapita = truncateToTwoDecimalPlaces(perCapitaValue);
            } else {
                item.MunicipalWaterWithdrawalPerCapita = "";
            }

            // if (item.MunicipalWaterWithdrawal !== "" && item.TotalPopulation !== "") {
            //     let perCapitaValue = (parseFloat(item.MunicipalWaterWithdrawal) / parseFloat(item.TotalPopulation * 10**3) * multiplier).toString();
            //     item.MunicipalWaterWithdrawalPerCapita = truncateToTwoDecimalPlaces(perCapitaValue);
            // }
            
            // 同様の処理を他の項目にも適用
            // 'AgriculturalWaterWithdrawalPerCapita'
            if (item.AgriculturalWaterWithdrawal !== "" && item.TotalPopulation !== "") {
                let perCapitaValue = (parseFloat(item.AgriculturalWaterWithdrawal) / parseFloat(item.TotalPopulation * 10**3) * multiplier).toString();
                item.AgriculturalWaterWithdrawalPerCapita = truncateToTwoDecimalPlaces(perCapitaValue);
            } else {
                item.AgriculturalWaterWithdrawalPerCapita = "";
            }
    
            // 'IndustrialWaterWithdrawalPerCapita'
            if (item.IndustrialWaterWithdrawal !== "" && item.TotalPopulation !== "") {
                let perCapitaValue = (parseFloat(item.IndustrialWaterWithdrawal) / parseFloat(item.TotalPopulation * 10**3) * multiplier).toString();
                item.IndustrialWaterWithdrawalPerCapita = truncateToTwoDecimalPlaces(perCapitaValue);
            } else {
                item.IndustrialWaterWithdrawalPerCapita = "";
            }
    
            // 'TotalWaterWithdrawalPerCapita'
            if (item.TotalWaterWithdrawal !== "" && item.TotalPopulation !== "") {
                let perCapitaValue = (parseFloat(item.TotalWaterWithdrawal) / parseFloat(item.TotalPopulation * 10**3) * multiplier).toString();
                item.TotalWaterWithdrawalPerCapita = truncateToTwoDecimalPlaces(perCapitaValue);
            } else {
                item.TotalWaterWithdrawalPerCapita = "";
            }
            
            // 'GDPPerCapita' 整数にする
            if (item.GDP !== "" && item.TotalPopulation !== "") {
                let tmp = (parseFloat(item.GDP) / parseFloat(item.TotalPopulation * 10**3)).toString();
                item.GDPPerCapita = (Math.floor(tmp)).toString()
            } else {
                item.GDPPerCapita = "";
            }

            // GDPを整数にする
            if (item.GDP !== "")  {
                let tmp = (parseFloat(item.GDP) / multiplier).toString();
                item.GDP = (Math.floor(tmp)).toString()
            } else {
                item.GDP = "";
            }

            // 人口を10^6人単位にする
            if (item.TotalPopulation !== "")  {
                let tmp = (parseFloat(item.TotalPopulation) / 10**3).toString();
                item.TotalPopulation = (Math.floor(parseFloat(tmp) * 100) / 100).toString();
            } else {
                item.TotalPopulation = "";
            }

            // 安全な水人口を10^6人単位にする
            if (item.TotalPopulationWithoutAccessToSafeDrinkingWater !== "")  {
                let tmp = (parseFloat(item.TotalPopulationWithoutAccessToSafeDrinkingWater) / 10**3).toString();
                item.TotalPopulationWithoutAccessToSafeDrinkingWater = (Math.floor(parseFloat(tmp) * 100) / 100).toString();
            } else {
                item.TotalPopulationWithoutAccessToSafeDrinkingWater = "";
            }
        });
    
        return csvData;
    }
    
    // csvData 配列を更新する
    csvData = updateCsvDataForPerCapita(csvData);
    /*** 1人当たりの情報を追加 終わり***/


    // CSVデータから得られる全てのカラム（key）のリストを作成します。
    const csvColumns = csvData.length > 0 ? Object.keys(csvData[0]) : [];
    //console.log({ csvColumns });
    // CSVデータとTopoJSONデータの紐付け
    
    // 南極周辺のデータを消去する。
    topojsonData.features = topojsonData.features.filter(feature => (feature.id !== '260' && feature.id !== '010'));
    topojsonData.features.forEach(feature => {
        let countryName = feature.properties.name;

        // 各featureのpropertiesにcsvのkeyを全て追加し、空文字列で初期化します。
        csvColumns.forEach(key => {
            feature.properties[key] = feature.properties[key] || {};
            for (let year = 1964; year <= 2020; year++) {
                feature.properties[key][year] = "";
            }
        });

        // 国名に基づいてCSVデータをフィルタリング
        const countryData = csvData.filter(d => d.Country === countryName);
        if (countryData.length === 0) {
            // 紐付けが失敗した場合の警告
            // console.warn(`紐付け失敗: TopoJSONの国名「${countryName}」に一致するCSVデータが存在しません。`);
        }

        // フィルタリングしたデータでプロパティを拡張
        countryData.forEach(cd => {
            Object.keys(cd).forEach(key => {
                // CSVのカラム名に基づいて、TopoJSONのプロパティに年度ごとのデータを上書き
                feature.properties[key][cd.Year] = cd[key];
            });
        });
    });

    /*** csvDataからjsonDataを作成 ***/
    // CSVデータを読み込んだ配列
    // 国ごとにデータをグループ化
    const groupedData = csvData.reduce((acc, row) => {
        // 国名がキーとなるオブジェクトを初期化
        if (!acc[row.Country]) {
            acc[row.Country] = {};
        }
    
        // YearとCountry以外の各項目に対して処理
        Object.keys(row).forEach(key => {
            if (key !== "Year" && key !== "Country") {
                // 配列を初期化
                if (!acc[row.Country][key]) {
                    acc[row.Country][key] = [];
                }
                // 各年のデータを追加（数値に変換、存在しない場合はnull）
                acc[row.Country][key].push([+row.Year, row[key] ? parseFloat(row[key]) : null]);
            }
        });
    
        return acc;
    }, {});
    
    // グループ化されたデータを所望のJSON形式に変換
    const jsonData = Object.keys(groupedData).map(country => ({
        Country: country,
        ...groupedData[country]
    }));
    

    // console.log({jsonData});


    return { csvData, topojsonData, jsonData, rawMergedCsvData, hierarchyJson};
};

export { getData };