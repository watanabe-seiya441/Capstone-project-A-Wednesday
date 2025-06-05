import os
import json
import re

def remove_unicode_sequences(directory):
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            file_path = os.path.join(directory, filename)
            with open(file_path, 'r', encoding='utf-8') as file:
                try:
                    data = json.load(file)
                    data = json.dumps(data)  # Convert JSON object to string
                    data = re.sub(r'\\u00[0-9a-fA-F]{2}', '', data)  # Remove \u00** patterns
                    data = json.loads(data)  # Convert string back to JSON object
                except json.JSONDecodeError:
                    print(f"Error decoding JSON from file {filename}")
                    continue

            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, ensure_ascii=False, indent=4)

# 使用例
remove_unicode_sequences('.')  # カレントディレクトリを指定
