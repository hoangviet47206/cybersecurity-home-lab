# Kịch bản 03: Phát hiện Mã độc (Webshell), Phân tích C2 và Cô lập Mạng Đa Lớp

## 1. Mục tiêu

Kịch bản này mô phỏng quy trình phát hiện và ứng phó sự cố (Incident Response) ở cả lớp điểm cuối (Endpoint) và lớp mạng (Network), chuyển từ các cuộc tấn công dò mật khẩu cơ bản sang rà quét mã độc và truy vết kênh điều khiển (Command & Control – C2) chuyên sâu.

| Giai đoạn | Cơ chế | Mục tiêu chính |
|---|---|---|
| **Giai đoạn 1: Chuẩn bị** | Vulnerable Web App (`employee-management`) + Wazuh FIM | Tạo bề mặt tấn công thực tế và giám sát toàn vẹn thư mục `uploads` theo thời gian thực |
| **Giai đoạn 2: Phát hiện** | Wazuh Active Response + YARA + Custom Decoder/Rule | Quét chữ ký mã độc ngay khi tệp mới xuất hiện và sinh cảnh báo Level 12 (`MITRE T1505.003`) |
| **Giai đoạn 3: Điều tra mạng** | `tcpdump` & Wireshark | Bắt gói tin phân tích lưu lượng Outbound, xác định IOC lớp mạng (IP/Port C2) và nội dung truyền tải |
| **Giai đoạn 4: Ứng phó & Vá lỗi** | `iptables` + Quarantine + `chmod` | Cô lập mạng hai chiều, cách ly tệp mã độc phục vụ điều tra và thu hồi quyền thư mục lỏng lẻo |

---

## 2. Kiến trúc và môi trường Lab

<p align="center">
  <img src="diagrams/architecture_03.svg" width="100%" alt="Sơ đồ kiến trúc phát hiện Webshell và C2">
</p>

### 2.1. Các thành phần

| Thành phần | Vai trò | Địa chỉ / Cấu hình |
|---|---|---|
| Kali Linux | Máy mô phỏng tấn công tải lên Webshell và đóng vai trò máy chủ C2 | `192.168.129.128`, Listener port `4444` |
| Ubuntu Target | Máy chủ chạy ứng dụng web `employee-management` (Node.js) và Wazuh Agent | `192.168.129.129` (`ens34`), Web port `8000` |
| Wazuh Manager | Thu thập log FIM/YARA, giải mã và kích hoạt Custom Rule `100005` | `192.168.129.131` |
| YARA | Công cụ quét chữ ký mã độc trên tệp tin tải lên | `/usr/bin/yara` |
| `tcpdump` & Wireshark | Ghi lại và phân tích lưu lượng mạng (Network Forensics) | Card mạng `ens34`, xuất file `.pcap` |
| `iptables` | Tường lửa thực thi cô lập hai chiều (INPUT/OUTPUT) trên Ubuntu Target | Firewall của Ubuntu |

### 2.2. Luồng xử lý phát hiện và ứng phó

1. Tệp tin nghi vấn (Webshell) được tạo hoặc tải lên thư mục `public/uploads` trên Ubuntu Target.
2. Wazuh FIM giám sát thời gian thực phát hiện tệp mới và kích hoạt Rule mặc định `554` (`File added to the system`).
3. Wazuh Active Response tự động gọi script `yara_scanner.sh` trên Ubuntu Agent.
4. YARA quét nội dung tệp dựa trên bộ luật `webshell_detection.yar`. Nếu khớp chữ ký mã độc, script ghi kết quả vào `/var/ossec/logs/active-responses.log`.
5. Wazuh Agent đẩy dòng log mới về Wazuh Manager.
6. Wazuh Manager giải mã bằng Custom Decoder `custom-yara-webshell`, khớp Custom Rule `100005` (Level 12, MITRE `T1505.003`) và hiển thị cảnh báo lên Dashboard.
7. Analyst sử dụng `tcpdump` và Wireshark giám sát card mạng `ens34`, bắt giữ luồng kết nối Outbound tới máy chủ C2 (`192.168.129.128:4444`) và bóc tách dữ liệu qua **Follow TCP Stream**.
8. Analyst thực thi cô lập mạng hai chiều bằng `iptables`, di chuyển tệp độc hại vào thư mục cách ly `/var/quarantine` và siết chặt lại quyền thư mục `public/uploads`.

---

## 3. Cấu trúc thư mục

```text
03-webshell-c2-hunting/
│
├── README.md
│
├── diagrams/
│   └── architecture_03.svg
│
└── screenshots/
    ├── 01_ubuntu_yara_webshell_trigger.png
    ├── 01_yara_webshell_rule100005_overview.png
    ├── 02_yara_webshell_T1505_003_details.png
    ├── 03_ubuntu_tcpdump_c2_capture.png
    ├── 04_wireshark_c2_tcp_stream.png
    └── 05_ubuntu_containment_eradication.png
```

---

## 4. Giai đoạn 1 – Chuẩn bị môi trường và thiết lập FIM

### Bước 1: Khởi chạy ứng dụng mục tiêu (Vulnerable Web App)

Trên máy Ubuntu Target, khởi chạy ứng dụng quản lý nhân sự Node.js:

```bash
cd ~/cybersecurity-home-lab/targets/employee-management
node app.js
```

**Kết quả mong đợi:** Ứng dụng lắng nghe thành công tại `http://localhost:8000`.

### Bước 2: Tạo thư mục Upload

Tạo thư mục lưu trữ tệp tải lên và cấp quyền ghi để mô phỏng lỗ hổng cấu hình (Security Misconfiguration):

```bash
mkdir -p public/uploads
chmod 777 public/uploads
```

### Bước 3: Cấu hình Wazuh FIM theo thời gian thực

Mở file `/var/ossec/etc/ossec.conf` trên Ubuntu Target và bổ sung thư mục `uploads` vào khối `<syscheck>`:

```xml
<directories realtime="yes" check_all="yes">/home/nguyenhoangviet/cybersecurity-home-lab/targets/employee-management/public/uploads</directories>
```

Lưu bản sao cấu hình để phục vụ quản lý và đối chiếu:

```bash
mkdir -p ~/cybersecurity-home-lab/configs/wazuh
sudo cp /var/ossec/etc/ossec.conf ~/cybersecurity-home-lab/configs/wazuh/ossec.conf
sudo chown $USER:$USER ~/cybersecurity-home-lab/configs/wazuh/ossec.conf
```

---

## 5. Giai đoạn 2 – Tích hợp YARA và xây dựng luật phát hiện

### Bước 1: Cài đặt YARA và JQ trên Ubuntu Target

```bash
sudo apt update
sudo apt install yara jq -y
```

### Bước 2: Viết YARA Rule phát hiện Webshell

Tạo tệp `/var/ossec/etc/rules/yara/webshell_detection.yar` để nhận diện các hàm thực thi lệnh nguy hiểm thường gặp trong Webshell PHP và Node.js:

```yara
rule Webshell_Detection {
    meta:
        description = "Phát hiện dấu hiệu Webshell (PHP/Node.js) qua các hàm rủi ro cao"
        author = "SOC Analyst"
        severity = "High"
    strings:
        $php1 = "eval("
        $php2 = "base64_decode("
        $php3 = "shell_exec("
        $php4 = "system("
        $node1 = "child_process.exec("
        $node2 = "Buffer.from("
    condition:
        any of them
}
```

### Bước 3: Xây dựng Active Response Script (`yara_scanner.sh`)

Tạo script tại `/var/ossec/active-response/bin/yara_scanner.sh` và cấp quyền thực thi (`chmod +x`). Script nhận đường dẫn tệp từ cảnh báo FIM, chạy YARA quét và ghi kết quả vào `active-responses.log`:

```bash
#!/bin/bash
read INPUT_JSON
FILENAME=$(echo $INPUT_JSON | jq -r .parameters.alert.syscheck.path)
YARA_PATH="/usr/bin/yara"
RULES_PATH="/var/ossec/etc/rules/yara/webshell_detection.yar"

if [ -f "$FILENAME" ]; then
    YARA_RESULT=$($YARA_PATH $RULES_PATH "$FILENAME")
    if [ -n "$YARA_RESULT" ]; then
        echo "wazuh-yara: Malware detected! Rule: $YARA_RESULT - File: $FILENAME" >> /var/ossec/logs/active-responses.log
    fi
fi
```

### Bước 4: Cấu hình Custom Decoder và Custom Rule trên Wazuh Manager

Tạo Custom Decoder trong `/var/ossec/etc/decoders/local_decoder.xml`:

```xml
<decoder name="custom-yara-webshell">
  <prematch>wazuh-yara:</prematch>
</decoder>
```

Tạo Custom Rule `100005` trong `/var/ossec/etc/rules/local_rules.xml`:

```xml
<group name="local,syslog,yara,">
  <rule id="100005" level="12">
    <decoded_as>custom-yara-webshell</decoded_as>
    <match>Malware detected</match>
    <description>YARA: Phat hien tep tin Webshell tai len ung dung Employee Management.</description>
    <mitre>
      <id>T1505.003</id>
    </mitre>
  </rule>
</group>
```

Chuẩn hóa quyền sở hữu tệp và khởi động lại Wazuh Manager:

```bash
sudo chown wazuh:wazuh /var/ossec/etc/decoders/local_decoder.xml /var/ossec/etc/rules/local_rules.xml
sudo chmod 660 /var/ossec/etc/decoders/local_decoder.xml /var/ossec/etc/rules/local_rules.xml
sudo systemctl restart wazuh-manager
```

---

## 6. Kiểm thử và xác minh luồng phát hiện Endpoint

### Bước 1: Tạo tệp mã độc giả lập và kiểm tra log cục bộ trên Ubuntu Target

Mô phỏng hành vi đưa tệp Webshell vào thư mục `public/uploads`, sau đó kiểm tra log quét YARA:

```bash
cp ~/cybersecurity-home-lab/targets/employee-management/public/uploads/image_upload.js \
   ~/cybersecurity-home-lab/targets/employee-management/public/uploads/victory_webshell.js

sudo grep "victory_webshell.js" /var/ossec/logs/active-responses.log
```

**Kết quả mong đợi:** Log ghi nhận dòng `wazuh-yara: Malware detected! Rule: Webshell_Detection ... victory_webshell.js`.

![Kích hoạt tạo mã độc và YARA quét trúng trên Ubuntu Target](screenshots/01_ubuntu_yara_webshell_trigger.png)

### Bước 2: Xác minh cảnh báo trên Wazuh Dashboard

Truy cập **Threat Hunting → Events** trên Wazuh Dashboard và lọc theo `rule.id: 100005`.

**Kết quả mong đợi:** Hệ thống hiển thị cảnh báo mức độ nghiêm trọng cao (Level 12) từ Agent `ubuntu-target`.

![Tổng quan cảnh báo Rule 100005 trên Wazuh Dashboard](screenshots/01_yara_webshell_rule100005_overview.png)

Mở chi tiết sự kiện (Document Details) để đối chiếu các trường kỹ thuật quan trọng: `decoder.name` (`custom-yara-webshell`), `full_log` (đường dẫn tệp độc hại) và ánh xạ `rule.mitre.id` (`T1505.003` – Web Shell).

![Chi tiết cảnh báo YARA và ánh xạ MITRE ATT&CK T1505.003](screenshots/02_yara_webshell_T1505_003_details.png)

---

## 7. Giai đoạn 3 – Giám sát mạng và phân tích lưu lượng C2

Sau khi lớp Endpoint (FIM + YARA) phát cảnh báo mã độc, Analyst tiến hành giám sát lưu lượng mạng đi ra từ máy chủ Ubuntu Target để xác minh xem máy chủ có đang duy trì kênh liên lạc bất thường tới máy chủ C2 hay không.

### Bước 1: Ghi nhận gói tin bằng `tcpdump`

Kiểm tra giao diện mạng đang mang địa chỉ IP `192.168.129.129` (`ens34`), sau đó sử dụng `tcpdump` để bắt trọn vẹn payload các gói tin liên quan đến cổng ứng dụng web (`8000`) và địa chỉ máy nghi vấn (`192.168.129.128`):

```bash
ip -br a
sudo tcpdump -i ens34 -s 0 "(port 8000 or host 192.168.129.128)" -w ~/c2_traffic.pcap
```

| Tham số | Ý nghĩa |
|---|---|
| `-i ens34` | Chỉ định card mạng nội bộ đang kết nối trong mạng Lab |
| `-s 0` | Bắt trọn vẹn kích thước gói tin (`snapshot length`), tránh cắt mất payload |
| `"(port 8000 or host 192.168.129.128)"` | Bộ lọc BPF chỉ ghi lại lưu lượng liên quan đến ứng dụng web và máy chủ C2 |
| `-w ~/c2_traffic.pcap` | Xuất toàn bộ dữ liệu gói tin thô ra file `.pcap` để phân tích trên Wireshark |

Sau khi ghi nhận được lưu lượng bất thường (19 gói tin), nhấn `Ctrl + C` để dừng `tcpdump` và mở file kết quả bằng Wireshark:

```bash
wireshark ~/c2_traffic.pcap &
```

![Ghi nhận lưu lượng mạng C2 bằng tcpdump trên Ubuntu Target](screenshots/03_ubuntu_tcpdump_c2_capture.png)

### Bước 2: Phân tích gói tin và tái tạo phiên giao tiếp trên Wireshark

Trên giao diện Wireshark, lọc theo luồng TCP (`tcp.stream eq 0`) và chọn **Follow → TCP Stream** để kiểm tra toàn bộ nội dung trao đổi:

- **Thiết lập kết nối (3-Way Handshake):** Gói tin số `13`, `14`, `15` ghi nhận máy nạn nhân `192.168.129.129` (port nguồn `48602`) chủ động khởi tạo kết nối TCP (`[SYN]`) đi ra ngoài tới máy chủ C2 `192.168.129.128` tại cổng `4444`.
- **Truyền tải dữ liệu (Payload):** Gói tin số `18` (`[PSH, ACK]`, độ dài 14 bytes) cho thấy dữ liệu dạng văn bản rõ (`whoami_output`) được đẩy trực tiếp từ máy Ubuntu sang máy Kali qua kênh kết nối này.

![Phân tích luồng TCP Stream C2 trên Wireshark](screenshots/04_wireshark_c2_tcp_stream.png)

**Nhận xét:** Kết quả phân tích PCAP cung cấp đầy đủ chỉ số xâm nhập lớp mạng (**Network IOC**), xác định chính xác máy chủ C2 là `192.168.129.128` qua cổng TCP `4444`, làm cơ sở để chuyển sang bước cô lập mạng đa lớp.

---

## 8. Giai đoạn 4 – Cô lập mạng đa lớp, Cách ly mã độc và Vá cấu hình

Sau khi tổng hợp đủ bằng chứng từ cả lớp Điểm cuối (tệp `victory_webshell.js`) và lớp Mạng (IP C2 `192.168.129.128`), Analyst thực hiện ứng phó theo trình tự chuẩn **Containment → Eradication → Hardening** trên **Ubuntu Target**.

### Bước 1: Cô lập mạng hai chiều bằng `iptables` (Network Containment)

Chặn toàn bộ lưu lượng chiều vào (`INPUT`) lẫn chiều ra (`OUTPUT`) đối với IP máy chủ C2 nhằm cắt đứt hoàn toàn kênh điều khiển và ngăn chặn rò rỉ dữ liệu (Exfiltration):

```bash
sudo iptables -I INPUT 1 -s 192.168.129.128 -j DROP
sudo iptables -I OUTPUT 1 -d 192.168.129.128 -j DROP
```

Kiểm tra lại bảng luật để xác nhận hai luật `DROP` đã được chèn ở vị trí ưu tiên số `1`:

```bash
sudo iptables -L INPUT -n --line-numbers
sudo iptables -L OUTPUT -n --line-numbers
```

### Bước 2: Cách ly tệp mã độc (Endpoint Eradication)

Chuyển tệp Webshell ra khỏi thư mục ứng dụng vào khu vực cách ly (`/var/quarantine`) và tước toàn bộ quyền đọc/ghi/thực thi (`000`) để vô hiệu hóa mã độc nhưng vẫn bảo toàn bằng chứng điều tra (Forensics):

```bash
sudo mkdir -p /var/quarantine
sudo mv ~/cybersecurity-home-lab/targets/employee-management/public/uploads/victory_webshell.js /var/quarantine/
sudo chmod 000 /var/quarantine/victory_webshell.js
sudo ls -la /var/quarantine/
```

### Bước 3: Vá lỗ hổng cấu hình thư mục (Hardening)

Thu hồi quyền `777` đã cấp ở Giai đoạn 1 và thiết lập lại quyền truy cập an toàn (`755`) cho thư mục `public/uploads`:

```bash
chmod 755 ~/cybersecurity-home-lab/targets/employee-management/public/uploads
ls -ld ~/cybersecurity-home-lab/targets/employee-management/public/uploads
```

![Kết quả cô lập mạng bằng iptables, cách ly tệp Webshell và vá quyền thư mục](screenshots/05_ubuntu_containment_eradication.png)

**Nhận xét:** Kết nối hai chiều tới máy chủ C2 đã bị chặn đứng tại tầng tường lửa; tệp Webshell đã bị vô hiệu hóa hoàn toàn (`----------`) trong thư mục cách ly; quyền thư mục `public/uploads` đã trở về trạng thái chuẩn (`drwxr-xr-x`).

---

## 9. Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân có thể | Hướng khắc phục |
|---|---|---|
| `wazuh-logtest` báo lỗi `ERROR: (2106)` | Thiếu khối `<ruleset>` trong `/var/ossec/etc/ossec.conf` hoặc sai quyền sở hữu file local | Bổ sung `<ruleset>` với `<decoder_dir>etc/decoders</decoder_dir>`, `<rule_dir>etc/rules</rule_dir>` và chạy `chown wazuh:wazuh` cho `local_decoder.xml`, `local_rules.xml` |
| YARA ghi log nhưng Wazuh không nổ Rule `100005` | Log trong `active-responses.log` không khớp decoder mặc định `active-response` | Tạo Custom Decoder `custom-yara-webshell` với `<prematch>wazuh-yara:</prematch>` và cập nhật `<decoded_as>` trong Rule `100005` |
| `tcpdump` không bắt được gói tin nào | Chọn nhầm card mạng (ví dụ `ens33` thay vì `ens34`) hoặc sai bộ lọc BPF | Chạy `ip -br a` để xác định đúng giao diện mạng mang IP của mạng Lab (`192.168.129.129`) |
| `iptables` chặn chiều vào nhưng C2 vẫn truyền dữ liệu ra được | Chỉ cấu hình chuỗi `INPUT` mà bỏ sót chuỗi `OUTPUT` | Bổ sung đồng thời luật `DROP` cho cả `INPUT` (`-s <C2_IP>`) và `OUTPUT` (`-d <C2_IP>`) |

---

## 10. Hướng phát triển

- **Tự động hóa SOAR:** Kết nối Rule `100005` (Level 12) vào workflow n8n/Shuffle (tương tự Kịch bản 02) để gửi cảnh báo kèm mã Hash tệp về Telegram và cho phép Analyst bấm nút cách ly tự động.
- **Tích hợp Suricata NIDS:** Triển khai Suricata trên Ubuntu Target và đẩy log `/var/log/suricata/eve.json` về Wazuh để phát hiện kết nối C2 tự động theo thời gian thực ngay trên Dashboard.
- **Threat Intelligence Enrichment:** Tích hợp API VirusTotal để tự động tra cứu mã băm SHA-256 của tệp nghi vấn và địa chỉ IP C2.
- **Kiểm soát ứng dụng (Application Hardening):** Bổ sung cơ chế kiểm tra định dạng tệp (MIME type, extension whitelist) và đổi tên tệp ngẫu nhiên ngay trong mã nguồn Node.js của `employee-management`.

---

## 11. Kết luận

Kịch bản 03 đã hoàn thiện chuỗi phòng thủ đa lớp (Defense in Depth) từ điểm cuối đến mạng:

- **Lớp Điểm cuối:** Kết hợp Wazuh FIM và YARA Active Response giúp phát hiện tức thời tệp Webshell ngay khi vừa được tải lên, ánh xạ trực tiếp sang khung MITRE ATT&CK (`T1505.003`).
- **Lớp Mạng:** Sử dụng `tcpdump` và Wireshark để truy vết lưu lượng Outbound, bóc tách rõ IP/Port C2 và dữ liệu truyền tải qua TCP Stream.
- **Ứng phó sự cố:** Thực thi đầy đủ quy trình cô lập mạng hai chiều (`iptables`), cách ly bảo toàn bằng chứng (`/var/quarantine`) và vá lỗ hổng cấu hình thư mục (`chmod 755`).