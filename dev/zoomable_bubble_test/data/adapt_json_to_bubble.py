import json

def replace_id(json_data):
    if isinstance(json_data, list):
        # リストの場合、再帰的に処理
        return [replace_id(item) for item in json_data]
    elif isinstance(json_data, dict):
        # 辞書の場合
        if 'data' in json_data and 'id' in json_data['data']:
            # "data"内に"id"がある場合、"id"を書き換える
            area = json_data['data']['id']
            json_data.pop('data', None) 
            json_data['id'] = area
        if 'children' in json_data:
            # "children"がある場合、再帰的に処理
            json_data['children'] = replace_id(json_data['children'])
        return json_data
    else:
        # それ以外の場合はそのまま返す
        return json_data

# JSONファイルを読み込む
with open('countryHierarchy.json', 'r') as file:
    data = json.load(file)

# "id"を一括で書き換える
modified_data = replace_id(data)

# 書き換えたデータを新しいファイルに保存
with open('modifiedCountryHierarchy.json', 'w') as file:
    json.dump(modified_data, file, indent=2)
