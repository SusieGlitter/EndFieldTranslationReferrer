import json
import os
import glob

def apply_hotfix():
    # 路径配置
    input_dir = 'i18n'
    output_dir = 'data'
    hotfix_file = os.path.join(input_dir, 'I18nHotFix.json')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 1. 读取 Hotfix 文件
    if not os.path.exists(hotfix_file):
        print("未找到 Hotfix 文件，跳过热修复步骤。")
        return

    with open(hotfix_file, 'r', encoding='utf-8') as f:
        hotfix_data = json.load(f)

    # 2. 预处理 Hotfix 数据：按语言类型分类，方便后续快速查找
    # 结构：hotfix_map[type][id] = text
    hotfix_map = {}
    for entry in hotfix_data.values():
        if "list" in entry:
            for item in entry["list"]:
                lang_type = item["type"]
                text_id = str(item["id"])
                content = item["text"]
                
                if lang_type not in hotfix_map:
                    hotfix_map[lang_type] = {}
                hotfix_map[lang_type][text_id] = content

    # 3. 遍历所有 I18nTextTable_*.json 文件
    table_files = glob.glob(os.path.join(input_dir, 'I18nTextTable_*.json'))
    
    for file_path in table_files:
        filename = os.path.basename(file_path)
        # 获取语言类型，例如从 I18nTextTable_EN.json 中提取 EN
        lang_type = filename.replace('I18nTextTable_', '').replace('.json', '')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            table_content = json.load(f)

        # 4. 应用热修复
        if lang_type in hotfix_map:
            print(f"正在对 {lang_type} 应用热修复...")
            for text_id, new_text in hotfix_map[lang_type].items():
                # 无论原文件中是否存在该 ID，都进行覆盖/添加
                table_content[text_id] = new_text
        
        # 5. 保存到 data 文件夹
        output_path = os.path.join(output_dir, filename)
        with open(output_path, 'w', encoding='utf-8') as f:
            # ensure_ascii=False 保证非 ASCII 字符（如中文、泰语）正常保存
            json.dump(table_content, f, ensure_ascii=False, indent=2)
        print(f"已保存修复后的文件至: {output_path}")

if __name__ == "__main__":
    apply_hotfix()