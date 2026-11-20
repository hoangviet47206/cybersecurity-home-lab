#!/bin/bash
# Đọc dữ liệu JSON do Wazuh truyền vào
read INPUT_JSON

# Dùng jq trích xuất đường dẫn file vừa được tạo/sửa đổi
FILENAME=$(echo $INPUT_JSON | jq -r .parameters.alert.syscheck.path)

YARA_PATH="/usr/bin/yara"
RULES_PATH="/var/ossec/etc/rules/yara/webshell_detection.yar"

# Quét file bằng YARA
if [ -f "$FILENAME" ]; then
    YARA_RESULT=$($YARA_PATH $RULES_PATH "$FILENAME")
    if [ -n "$YARA_RESULT" ]; then
        # Phát hiện mã độc! Ghi log ra file để Wazuh Manager đọc được
        echo "wazuh-yara: Malware detected! Rule: $YARA_RESULT - File: $FILENAME" >> /var/ossec/logs/active-responses.log
    fi
fi
