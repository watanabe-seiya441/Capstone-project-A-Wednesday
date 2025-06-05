import json
import time
import sys
from selenium import webdriver
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, ElementNotInteractableException, TimeoutException

# WebDriverのインスタンスを作成
driver = webdriver.Chrome()  # Chromeを使用している場合

# コマンドライン引数からアルファベットを取得
ALPHABET = sys.argv[1] if len(sys.argv) > 1 else 'a'

# 既存のデータを読み込む
FILE_PATH = f'article_data_{ALPHABET}.json'

def scraiping(country, year, data, flag):
    if_success = False
    try:
        with open(FILE_PATH, 'r') as file:
            data = json.load(file)
    except FileNotFoundError:
        data = []
    # URLを開く
    country = country.replace(' ', '%20')
    driver.get(f'https://www.pressreader.com/search?query=water%20crisis%20%22{country}%22&languages=en&categories=1124&in=ALL&date=Range&start={year}-01-01&stop={year}-12-31&hideSimilar=0&type=2&state=2')
    print(f"Page opened for {country} {year}")
    # 検索結果が表示されるまで待機 
    try:
        WebDriverWait(driver, 360).until(
            EC.any_of(
            EC.presence_of_element_located((By.CSS_SELECTOR, '#scroller > section > article:nth-child(2) > header > hgroup > h1')),
            EC.text_to_be_present_in_element((By.CSS_SELECTOR, 'body'), '何も見つかりませんでした'))
        )
    except TimeoutException:
        pass
    if '何も見つかりませんでした' in driver.page_source:
        print("Not Found")
        return
    print("Page opened")
    success_count = 0  # 成功した記事の数を追跡
    failure_sequence = 0  # 連続した失敗回数を追跡
    n = 1

    while n < 10:
        retry_count = 0
        while retry_count < 1:
            try:
                title_selector = f'#scroller > section > article:nth-child({n}) > header > hgroup > h1'
                body_selector = f'#scroller > section > article:nth-child({n}) > div > div > p'
                date_selector = f'#scroller > section > article:nth-child({n}) > header > ul > li.art-date > a > time'

                title_element = driver.find_element(By.CSS_SELECTOR, title_selector)
                body_element = driver.find_element(By.CSS_SELECTOR, body_selector)
                date_element = driver.find_element(By.CSS_SELECTOR, date_selector)

                if title_element:
                    if title_element.text:
                        article_data = {
                            'title': title_element.text,
                            'body': body_element.text if body_element else '',
                            'date': date_element.get_attribute('datetime') if date_element else '',
                            'country': country,
                        }
                        data.append(article_data)
                        with open(FILE_PATH, 'w') as file:
                            json.dump(data, file, indent=4)
                        print(f"Article{n} data added.")
                        if_success = True
                        success_count += 1
                        failure_sequence = 0  # 連続失敗カウントをリセット
                    else:
                        print(f"Article{n} title not found.")
                        failure_sequence += 1  
                    break
            except NoSuchElementException:
                retry_count += 1
                failure_sequence += 1  
                
            if success_count >= 7 or failure_sequence >= 4:
                if success_count >= 7:
                    print(f"Success count reached. {success_count}")
                    return if_success
            
                print(f"Article{n} not found. Retrying...{retry_count}")
                time.sleep(20)  # ロードを待つ
        n += 1
    return if_success
        
def scraping_country(country):
    failed = 0
    wait_flag = False
    for year in range(2001, 2022):
        if (country == "Argentina" and year < 2019):
            continue
        if failed >= 3:
            wait_flag = True
        success = False
        data = []
        try:
            success = scraiping(country, year, data, wait_flag)
        except Exception as e:
            print(f"エラーが発生しました: {str(e)}")
            failed += 1
            continue
        if success:
            failed = 0
            wait_flag = False
        else:    
            failed += 1
        print(f"Finished {country} {year}")
    print(f"Finished {country}")
    
    
import pandas as pd

# CSVファイルのパス（ここに実際のファイルパスを指定してください）
file_path = '../data/MergedData.csv'

# CSVファイルを読み込む
data = pd.read_csv(file_path)

# Country列からユニークな値を取得
unique_countries = data['Country'].unique()

skip_country = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Armenia", "Argentina", "Australia"]
for country in unique_countries:
    # if country in skip_country:
    #     print(f"skip {country}")
    if (country[0].lower() != 'c') or country in set(['Cambodia', 'Canada']):
        continue
    try:
        scraping_country(country)
    except:
        print(f"Failed {country}")
        continue
    print(f"Finished {country}")

# ブラウザを閉じる
driver.quit()
