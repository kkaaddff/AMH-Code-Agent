#!/bin/bash

# 脚本功能：将日志文件按行拆分，根据内容类型分离REQUEST和RESPONSE，并统一输出格式化后的json
# 使用方法：./split_log.sh <log_file_path>

# 检查是否提供了文件路径参数
if [ $# -ne 1 ]; then
    echo "使用方法: $0 <log_file_path>"
    echo "示例: $0 /path/to/model-gateway-sync-2025-10-31.log"
    exit 1
fi

LOG_FILE="$1"

# 检查文件是否存在
if [ ! -f "$LOG_FILE" ]; then
    echo "错误: 文件 '$LOG_FILE' 不存在"
    exit 1
fi

# 检查文件是否可读
if [ ! -r "$LOG_FILE" ]; then
    echo "错误: 文件 '$LOG_FILE' 不可读"
    exit 1
fi

# 获取日志文件的目录路径
LOG_DIR="$(dirname "$LOG_FILE")"

# 在日志文件同级目录下创建输出目录
OUTPUT_DIR="$LOG_DIR/split_output"
mkdir -p "$OUTPUT_DIR"

# 初始化计数器
line_count=0
input_count=0
output_count=0
ignored_count=0

echo "开始处理文件: $LOG_FILE"
echo "输出目录: $OUTPUT_DIR"
echo "================================"

# 检查 jq 是否安装
if ! command -v jq >/dev/null 2>&1; then
    echo "错误: 需要安装jq以格式化JSON。请先运行: sudo apt-get install jq  或  brew install jq"
    exit 1
fi

# 逐行读取文件
while IFS= read -r line; do
    line_count=$((line_count + 1))

    # 检查是否为空行
    if [ -z "$line" ]; then
        echo "警告: 第 $line_count 行为空，跳过"
        ignored_count=$((ignored_count + 1))
        continue
    fi

    # 检查是否包含REQUEST类型
    if [[ "$line" == *"\"type\":\"REQUEST\""* ]]; then
        # REQUEST行 - 写入input文件 (格式化json)
        input_count=$((input_count + 1))
        input_file="$OUTPUT_DIR/${input_count}_input.json"
        echo "$line" | jq . > "$input_file" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "REQUEST 第 $line_count -> $input_file (已格式化)"
        else
            echo "$line" > "$input_file"
            echo "REQUEST 第 $line_count -> $input_file (格式化失败，已原样输出)"
        fi
    # 检查是否包含RESPONSE类型
    elif [[ "$line" == *"\"type\":\"RESPONSE\""* ]]; then
        # RESPONSE行 - 写入output文件 (格式化json)
        output_count=$((output_count + 1))
        output_file="$OUTPUT_DIR/${output_count}_output.json"
        echo "$line" | jq . > "$output_file" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "RESPONSE 第 $line_count -> $output_file (已格式化)"
        else
            echo "$line" > "$output_file"
            echo "RESPONSE 第 $line_count -> $output_file (格式化失败，已原样输出)"
        fi
    else
        # 其他行 - 忽略
        echo "忽略 第 $line_count (非REQUEST/RESPONSE)"
        ignored_count=$((ignored_count + 1))
    fi
done < "$LOG_FILE"

echo "================================"
echo "处理完成!"
echo "总行数: $line_count"
echo "Input文件数量 (REQUEST): $input_count"
echo "Output文件数量 (RESPONSE): $output_count"
echo "忽略行数: $ignored_count"
echo "文件保存在: $OUTPUT_DIR/"
echo "================================"

# 显示生成的文件列表
echo "生成的文件列表:"
if [ "$(ls -A "$OUTPUT_DIR/" 2>/dev/null)" ]; then
    ls -la "$OUTPUT_DIR/"
else
    echo "无生成文件"
fi