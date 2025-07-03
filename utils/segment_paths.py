import os

segment_ids = [
    "7047153", "1761462", "3907879", "641218", "802344",
    "2965631", "5782274", "4928093", "13202808", "4916176"
]

segment_svg_paths = {}

for seg_id in segment_ids:
    file_path = os.path.join("paths", f"{seg_id}.txt")  # 讀取 paths/7047153.txt
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            svg_path_data = f.read().strip()
            # 移除所有換行符號（包括 \n 和 \r）
            svg_path_data = svg_path_data.replace('\n', '').replace('\r', '')   
            segment_svg_paths[seg_id] = svg_path_data
    except FileNotFoundError:
        print(f"Warning: SVG path file not found for segment {seg_id}")
        segment_svg_paths[seg_id] = '<path class="fill" d=""></path>'  # 空路徑或預設

# segment_svg_paths 現在就是從對應 id.txt 檔讀取的內容
