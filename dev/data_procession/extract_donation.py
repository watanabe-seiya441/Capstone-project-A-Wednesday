from bs4 import BeautifulSoup
import pdb

# HTMLファイルの読み込み
with open('../raw_data/GlobalGiving.html', 'r', encoding='utf-8') as file:
    html_content = file.read()

# BeautifulSoupを使用してHTMLを解析
soup = BeautifulSoup(html_content, 'html.parser')

# 特定の要素（例: リンク）を抽出

# 特定の要素を抽出
target_element = soup.find_all('div', class_='grid-12 box_topMargin2Half box_md_horizontalPadded1 box_lg_horizontalPadded0 flex_growChildren')

with open('../data/donation_list.csv', 'w') as f:
    f.write(','.join(['country','title', 'detail', 'project_link']))
    f.write('\n')

count = 0
# リンクのテキストとhref属性を表示
for i, target in enumerate(target_element):
    action_type = target.find( class_ = "text_allCaps text_fontSizeSmaller col_ggSecondary1LightText layout_centerVertical").find_all('a')[0].text
    if action_type == 'Clean Water':
        country = target.find( class_ = "text_allCaps text_fontSizeSmaller col_ggSecondary1LightText layout_centerVertical").find_all("a")[1].text
        detail = target.find( class_ ="grid-12 col_ggSecondary1Text box_verticalMargin2").text.strip()
        title = target.find('h4').text.strip()
        project_link = target.find('h4').find('a')['href']
        print(count, country, title)
        with open('../data/donation_list.csv', 'a') as f:
            f.write(','.join([country, f'"{title}"', f'"{detail}"', project_link]))
            f.write('\n')
        count += 1
