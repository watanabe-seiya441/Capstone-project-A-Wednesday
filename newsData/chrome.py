import pytest
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException

import time

class Auto():
  def setup_method(self):
    options = Options()
    # options.add_argument('--headless')
    # options.add_argument("user-data-dir=/Users/yuhi/Library/Application Support/Google/Chrome/")
    # options.add_argument('--profile-directory=Profile 1')
    self.driver = webdriver.Chrome(options=options)
    self.vars = {}
  
  def teardown_method(self):
    self.driver.quit()
  
  def wait_for_window(self, timeout = 2):
    time.sleep(round(timeout / 1000))
    wh_now = self.driver.window_handles
    wh_then = self.vars["window_handles"]
    if len(wh_now) > len(wh_then):
      return set(wh_now).difference(set(wh_then)).pop()
  
  def open_page(self):
    self.driver.get("https://www.pressreader.com/ja/catalog")
    self.driver.set_window_size(1381, 810)
    WebDriverWait(self.driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, '.pri-search')))
    WebDriverWait(self.driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'h1.title')))

  def initial_search(self, country):
    wait = WebDriverWait(self.driver, 10)
    retries = 5
    for i in range(retries):
        try:
            element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".pri-search"))) 
            WebDriverWait(self.driver, 10).until(EC.visibility_of(element))
            print("検索ボタンが見つかりました")
            element.click() #検索ボタンをクリック
            break
        except StaleElementReferenceException:
            if i < retries - 1: # i is zero indexed
                continue
            else:
                raise
    
    element = self.driver.find_element(By.CSS_SELECTOR, ".pri-search")
    actions = ActionChains(self.driver) 
    actions.move_to_element(element).perform() #検索ボタンをホバー
    
    element = self.driver.find_element(By.CSS_SELECTOR, "body")
    actions = ActionChains(self.driver)
    actions.move_to_element(element).perform()

    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".flic"))).click()

    wait.until(EC.presence_of_element_located((By.ID, "searchQuery")))
    wait.until(EC.element_to_be_clickable((By.ID, "searchQuery"))).click()
    wait.until(EC.element_to_be_clickable((By.ID, "searchQuery"))).send_keys(f"water {country}")
    print("検索ボックスに入力")
    
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".flist:nth-child(4) .flic--fit"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "li:nth-child(64) .flic"))).click()
    print("言語設定")
    wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "戻る"))).click()
    
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".flist:nth-child(6) .flic--fit"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".pop-switch > button:nth-child(2) > span"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "li:nth-child(9) .flic--fit"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".indeterminate .flic-value > .flic-in"))).click()
    print("「ニュース」に指定")
    # wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "#dialog-1700620371116 .toolbar-button"))).click()
    # wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".toolbar-button.toolbar-button-back"))).click()

    # wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".toolbar-button.toolbar-button-back"))).click()
    # wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "div.toolbar-left > a.toolbar-button-back"))).click()
    # wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[data-bind='click: back']"))).click()
    button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[data-bind='click: back']")))
    self.driver.execute_script("arguments[0].click();", button)
    print("戻るボタン成功")
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".flist:nth-child(10) .flic--fit"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "li:nth-child(6) > .fli .title"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".l-fi-xs:nth-child(1) .meta"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".datepickerMonth span"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".datepickerMonth span"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".datepickerGoPrev span"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".datepickerGoPrev span"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "tr:nth-child(2) > td:nth-child(4) span"))).click()
    wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Jan"))).click()
    wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "1"))).click()
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".toolbar-button-back"))).click()
    print("日付指定")
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".b-action > span > span"))).click()

  def search_article(self, country):
    self.driver.find_element(By.CSS_SELECTOR, ".pop-list:nth-child(6) li:nth-child(2) em").click()
    self.driver.find_element(By.ID, "searchQuery").click()
    self.driver.find_element(By.ID, "searchQuery").send_keys(f"water {country}")
    self.driver.find_element(By.CSS_SELECTOR, ".b-action > span > span").click()

auto = Auto()
auto.setup_method()

try:
    auto.open_page()
    print("opened page")
    auto.initial_search("united states")
    time.sleep(1000)
finally:
    auto.teardown_method()
