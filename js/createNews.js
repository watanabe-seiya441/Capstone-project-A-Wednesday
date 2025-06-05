const formatDate = (date)=>{
    // 年、月、日の部分に分割
    const year = date.slice(0, 4);
    const month = date.slice(4, 6);
    const day = date.slice(6, 8);

    // ハイフンで結合
    const formattedString = `${year}-${month}-${day}`;

    return formattedString;
}

const getNews = async () => {
    const newsArray = [];
    // 小文字アルファベットの範囲を反復処理
    for (let i = 97; i <= 122; i++) {
        // iをASCIIコードと見なして文字に変換
        const alphabet = String.fromCharCode(i);
        const filename = `./newsData/article_data_${alphabet}.json`;
        try{
            const newsDataWithAlphabet = await d3.json(filename);

            newsArray.push(...newsDataWithAlphabet);
        } catch (error){
            console.log(`no such file : ${filename}`);
        }
    }
    const newsData1 = await d3.json("./newsData/article_data.json");
    newsArray.push(...newsData1);

    const newsData = newsArray.filter((news, index, self) =>
        index === self.findIndex((t) => (
            t.date === news.date && t.country === news.country
        ))
    );
    
    newsData.forEach((d)=>{
        d.year = Number(d.date.substring(0,4));
        d.country = decodeURIComponent(d.country);
        d.date = formatDate(d.date);
        
    });

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

    // CSVデータの国名をTopoJSONの国名に合わせる
    newsData.forEach(row => {
        for (const [topoName, csvName] of Object.entries(countryNameMappings)) {
            if (row.country === csvName) {
                row.country = topoName;
                break; // 適切なマッピングが見つかったらループを抜ける
            }
        }
    });
    return newsData;
}

const createNews = (newsData, year, country, mode) => {
    const yearModified = Math.max(year, 2002);
    let news;
    if(mode === 'country'){
        news = newsData.filter((d)=>d.country === country);
        //その国のデータをその年に近い順にとってくる。
        news.sort((a,b)=> Math.abs(yearModified-a.year) - Math.abs(yearModified - b.year))
    }else{
        // その年のデータをランダムにとってくる。
        news = newsData.filter((d)=>d.year === yearModified).sort(() => Math.random() - 0.5).slice(0,20);
    }
    

    d3.select("#NewsContent").selectAll("li").remove();
    if (news.length === 0) {
        d3.select("#NewsContent").append("li").text(`No news available about ${country}`);
        return;
    }

    // d3.jsを使ってli要素を追加
    const newsList = d3.select("#NewsContent")
    .selectAll("li")
    .data(news)
    .enter()
    .append("li");

    // li要素内にdivを追加
    const newsDiv = newsList.append("div")
    .style("display", "flex") // divにflexスタイルを適用
    .style("justify-content", "space-between"); // 子要素を可能な限り離れて配置

    // div内にh3要素を追加
    newsDiv.append("h3")
    .text(d => d.title);

    // 新たにdiv要素を追加して、その中に日付と国名を表示するspan要素を追加
    const infoDiv = newsDiv.append("div")
    .style("align-items", "flex-start");

    infoDiv.append("div")
    .attr("class", "date")
    .text(d => d.date);

    infoDiv.append("div")
    .attr("class", "countryName")
    .text(d => d.country);

    // li要素内にp要素を追加
    newsList.append("p")
    .text(d => d.body);

};

const NewsRefresher = (newsData) => {
    document.addEventListener("LineChartMouseMove", function(event) {
        const { year, country } = event.detail;

        createNews(newsData, year, country, 'country');
    });
};

export {getNews, createNews, NewsRefresher};