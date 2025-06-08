# 世界各国の水使用量の可視化(Capstone-project-A-Wednesday)
## members
- 03220431 Shiho Sugiyama @ss-cosmos-hue 
- 03230447 Yuhi Hasegawa @ut-y-h
- 03230460 Seiya Watanabe @watanabe-seiya441

## デモ
demo_final.mp4

## 使い方
- index.htmlを開くとメイン画面が開きます。  
    - 世界地図の左下の項目ボックスで、地図に表示したい情報を選択することができます。 
    - 世界地図上のハートボタンをクリックすると、その国の水環境向上に向けた基金の情報が出てきます。
    - 右上には2つの国の農業用水、工業用水、生活用水の量が示されています。注目する国は世界地図をクリックするか、選択ボックスから選ぶかで選択できます。比較する国は、選択ボックスから選ぶことで選択できます。***注目している国の詳細を見る***ボタンをクリックすることで、詳細ページに遷移します。
    
    - 右下には年に対応したニュースが表示されます。
- 詳細ページ
    - 時系列データにカーソルを乗せると、年代が変更されます。クリックすることで年代が固定され、もう1度クリックすると、再び年代が変更されるようになります。


#### 資料についての注釈
下記の資料は AQUASTAT より引用している。  
AgriculturalWaterWithdrawal.csv  
IndustrialWaterWithdrawal.csv  
TotalWaterWithdrawal.csv  
TotalWaterWithdrawalPerCapita.csv  

E: 公表値またはAQUASTATの推定値から、合計または同定（収量）として算出された推定値。  
I：推計値（繰越、垂直推計、線形補間）*。  
X：外部値（FAOSTATまたは他の国際機関から報告されたもの）**。  
記号なし：公式の値、データは国内の一つのソースから来ています（FAOの水と農業に関するアンケート、レポート、出版物、公式ウェブサイトなど）。  

下記の資料は https://www.globalgiving.org/ より取得している。
donation_list.csv

下記の資料は国連からの取得である。
WUP2018-F13-Capital_Cities.csv

"Suggested citation: United Nations, Department of Economic and Social Affairs, Population Division (2018). World Urbanization Prospects: The 2018 Revision, Online Edition."



