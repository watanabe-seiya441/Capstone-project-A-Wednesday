from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
# Seleniumドライバーを起動
driver = webdriver.Chrome()  # または適切なブラウザドライバーを使用
driver.set_window_size(4000, 1500) 

# 最初のページを開く
url = "https://www.globalgiving.org/search/?size=1200&nextPage=3&sortField=total_raised_usd&loadAllResults=true"
driver.get(url)


# スクロールするJavaScriptを定義
scroll_script = """
var loadMoreButton = document.querySelector('.js-loadMore');

if (loadMoreButton) {
    var siblingElement = loadMoreButton.previousElementSibling;  // 親要素を取得
    siblingElement.scrollIntoView();
}
"""
count = 0
# すべてのデータを取得
while True:
    try:
        if count == 5:
            break
        print(count)
        count += 1
        driver.execute_script(scroll_script)
        # ページをスクロール    
        load_more_button = WebDriverWait(driver, 10000).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'js-loadMore'))
        )
        load_more_button.click()
    except Exception as e:
        print(e)
        break

time.sleep(3)
# ページ全体のHTMLを取得
# page_source = driver.page_source
page_source = driver.execute_script("return document.documentElement.outerHTML")


# ここでBeautiful Soupなどを使用してデータを抽出または処理します
with open("output3.html", "w") as f:
    f.write(page_source)
# ブラウザを閉じる
driver.quit()
