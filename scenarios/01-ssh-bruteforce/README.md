
# Kịch bản 02: Phản ứng sự cố tự động (SOAR) – Tự động chặn & Chặn thủ công qua Telegram

## 🎯 1. Mục tiêu

Kịch bản này là bước phát triển tiếp theo của [Kịch bản 01](../01-ssh-bruteforce/README.md). Sau khi Wazuh phát hiện hành vi SSH Brute-Force bằng Custom Rule `100001` (Level 10), hệ thống sẽ **phản ứng lại cuộc tấn công (Incident Response)** theo hai hướng:

| Hướng | Cơ chế | Ai quyết định chặn? | Thời gian phản ứng |
|---|---|---|---|
| **A. Tự động chặn (Auto-Ban)** | Wazuh **Active Response** gọi `firewall-drop` (iptables) trực tiếp trên Agent | Hệ thống tự quyết định | Gần như tức thì |
| **B. Chặn thủ công (Manual Ban)** | Wazuh → **n8n** → **Telegram** gửi cảnh báo kèm nút bấm → Analyst nhấn **Ban** → n8n gọi **Wazuh API** → Active Response | Người phân tích (Human-in-the-loop) | Phụ thuộc Analyst |

> **Vì sao cần cả hai?** Auto-Ban nhanh nhưng có nguy cơ chặn nhầm (False Positive), ví dụ chặn IP của chính quản trị viên. Manual Ban cho phép con người xác minh trước khi hành động. Trong thực tế, SOC thường kết hợp: tự động với các luật có độ tin cậy cao, thủ công với các trường hợp cần xác minh.

## 🏗️ 2. Kiến trúc & Môi trường Lab

```text
                         ┌──────────────────────────────────────────────┐
                         │              Wazuh Server                   │
Kali (Attacker)          │  Rule 100001 (Level 10)                      │
192.168.129.128          │      │                                       │
      │ Hydra            │      ├──► [Hướng A] Active Response ─────────┼──┐
      ▼                  │      │                                       │  │ firewall-drop
Ubuntu Target ──log──►   │      └──► [Hướng B] Integration (Webhook)    │  │ (iptables DROP)
192.168.129.129          └───────────────────┬──────────────────────────┘  │
      ▲                                      ▼                             │
      │                              n8n (Wazuh_SOC.json)                  │
      │                                      │                             │
      │                                      ▼                             │
      │                          Telegram Bot: cảnh báo + nút [Ban]       │
      │                                      │ Analyst nhấn nút            │
      │                                      ▼                             │
      │                    ngrok ──► n8n (Tele_to_Wazuh.json)              │
      │                                      │ Wazuh API: PUT /active-response
      └──────────────────────────────────────┴─────────────────────────────┘
```

| Thành phần | Hệ thống | Địa chỉ IP / Cấu hình |
|---|---|---|
| Attacker | Kali Linux | `192.168.129.128` |
| Target (Wazuh Agent) | Ubuntu Target | `192.168.129.129` – SSH port `2222` |
| SIEM | Wazuh Server | Standalone VM (Manager + API `55000`) |
| SOAR / Automation | n8n | Port `5678` |
| Public Tunnel | ngrok | Expose n8n ra Internet để Telegram gọi Webhook |
| Kênh thông báo | Telegram Bot | Gửi cảnh báo và nhận lệnh từ nút bấm |

**Công cụ sử dụng:** `Hydra`, `iptables`, Wazuh Active Response, Wazuh API, `n8n`, `ngrok`, Telegram Bot API.

## 📁 3. Cấu trúc thư mục

```text
02-auto-ban/
├── README.md
├── Wazuh_SOC.json
├── Tele_to_Wazuh.json
└── screenshots/
    ├── 1_Kali_Hydra_Bi_Treo.png
    ├── 2_Telegram_CanhBao_Level10.png
    ├── 3_Ubuntu_Log_ThucThi_ActiveResponse.png
    ├── 4_Ubuntu_Iptables_Drop_IP.png
    ├── Ban_Thu_Cong.png
    ├── tele_to_wazuh.png
    ├── Thong_Bao_Tan_Cong.png
    └── wazuh_soc.png
```

Import hai file `.json` vào n8n qua **Workflows → Import from File**.

## 🧰 4. Chuẩn bị chung

### 4.1. Điều kiện cần

- Đã hoàn thành Kịch bản 01: Custom Rule `100001` hoạt động (Level 10).
- Ubuntu Target đã cài Wazuh Agent và kết nối về Manager.
- Đã tạo Telegram Bot qua `@BotFather` (lấy `BOT_TOKEN`) và lấy `CHAT_ID` (qua `@userinfobot` hoặc API `getUpdates`).

### 4.2. Kiểm tra Active Response khả dụng trên Agent

Wazuh có sẵn script `firewall-drop` trong `/var/ossec/active-response/bin/`:

```bash
# Trên Ubuntu Target
ls -l /var/ossec/active-response/bin/ | grep firewall-drop
```

---

# 🅰️ HƯỚNG A – TỰ ĐỘNG CHẶN (AUTO-BAN)

## 🛠️ 5. Các bước thực hiện

### Bước 1: Cấu hình Active Response trên Wazuh Manager

Mở file cấu hình:

```bash
sudo nano /var/ossec/etc/ossec.conf
```

Thêm khối sau vào trong thẻ `<ossec_config>`:

```xml
<!-- Command firewall-drop (thường đã có sẵn mặc định) -->
<command>
  <name>firewall-drop</name>
  <executable>firewall-drop</executable>
  <timeout_allowed>yes</timeout_allowed>
</command>

<!-- Tự động chặn IP khi Rule 100001 được kích hoạt -->
<active-response>
  <command>firewall-drop</command>
  <location>local</location>
  <rules_id>100001</rules_id>
  <timeout>600</timeout>
</active-response>
```

| Thuộc tính | Ý nghĩa |
|---|---|
| `command` | Dùng script `firewall-drop` (thêm rule `DROP` vào iptables) |
| `location` | `local` – thực thi trên chính Agent phát sinh cảnh báo (Ubuntu Target) |
| `rules_id` | Kích hoạt khi Rule `100001` xuất hiện |
| `timeout` | Tự động gỡ chặn sau `600` giây (10 phút) |

Khởi động lại Manager:

```bash
sudo systemctl restart wazuh-manager
```

### Bước 2: Red Team – Tấn công Brute-Force

Từ Kali Linux:

```bash
seq 1 50 > passwords.txt
hydra -l root -P passwords.txt ssh://192.168.129.129:2222 -t 4
```

**Kết quả:** Sau khi Rule `100001` kích hoạt, IP của Kali bị chặn nên Hydra không thể tiếp tục kết nối.

![Kali Hydra bị treo](screenshots/1_Kali_Hydra_Bi_Treo.png)

### Bước 3: Blue Team – Kiểm tra cảnh báo trên Telegram

Cảnh báo Level 10 được gửi về Telegram qua workflow n8n.

![Telegram cảnh báo Level 10](screenshots/2_Telegram_CanhBao_Level10.png)

### Bước 4: Xác minh Active Response đã thực thi

Trên Ubuntu Target, kiểm tra log thực thi Active Response:

```bash
sudo tail -n 20 /var/ossec/logs/active-responses.log
```

**Kết quả:** Log ghi nhận script `firewall-drop` được gọi với IP nguồn `192.168.129.128`.

![Log thực thi Active Response](screenshots/3_Ubuntu_Log_ThucThi_ActiveResponse.png)

### Bước 5: Xác minh IP đã bị chặn bằng iptables

```bash
sudo iptables -L INPUT -n --line-numbers
```

**Kết quả:** Xuất hiện rule `DROP` cho địa chỉ `192.168.129.128`.

![iptables DROP IP tấn công](screenshots/4_Ubuntu_Iptables_Drop_IP.png)

Sau `600` giây, Wazuh tự động gỡ rule này. Có thể gỡ thủ công khi cần:

```bash
sudo iptables -D INPUT -s 192.168.129.128 -j DROP
```

---

# 🅱️ HƯỚNG B – CHẶN THỦ CÔNG QUA TELEGRAM (MANUAL BAN / HUMAN-IN-THE-LOOP)

Ở hướng này **không bật** khối `<active-response>` cho Rule `100001` (hoặc tạm comment lại để quan sát rõ luồng thủ công). Thay vào đó, Analyst nhận cảnh báo trên Telegram và quyết định bấm nút **Ban**.

## 🔄 6. Luồng hoạt động

1. Wazuh phát hiện Brute-Force (Rule `100001`, Level 10) → gửi alert JSON đến **Webhook của n8n**.
2. Workflow **`Wazuh_SOC.json`** xử lý alert, trích xuất `srcip`, `agent`, `rule`... và gửi tin nhắn lên Telegram kèm **nút Ban**.
3. Analyst nhấn nút **Ban** → Telegram gửi callback đến Webhook n8n (thông qua **ngrok**).
4. Workflow **`Tele_to_Wazuh.json`** nhận callback, xác thực với **Wazuh API**, rồi gọi `PUT /active-response` để chặn IP.
5. Active Response thực thi `firewall-drop` trên Agent → n8n phản hồi lại Telegram "Đã chặn".

## 🛠️ 7. Các bước thực hiện

### Bước 1: Cài đặt n8n (Docker)

```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

Truy cập `http://localhost:5678` để tạo tài khoản quản trị.

### Bước 2: Mở tunnel bằng ngrok

Telegram chỉ gửi callback đến địa chỉ **HTTPS công khai**, nên cần ngrok để public n8n đang chạy nội bộ.

```bash
# Chỉ cần làm 1 lần: gắn authtoken lấy từ dashboard.ngrok.com
ngrok config add-authtoken <NGROK_AUTHTOKEN>

# Mở tunnel tới n8n
ngrok http 5678
```

Ngrok trả về URL dạng `https://xxxx-xx-xx.ngrok-free.app`. Chạy lại n8n với biến `WEBHOOK_URL` trỏ tới URL này:

```bash
docker rm -f n8n

docker run -d --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e WEBHOOK_URL=https://xxxx-xx-xx.ngrok-free.app/ \
  n8nio/n8n
```

> ⚠️ Với gói ngrok miễn phí, URL **thay đổi mỗi lần khởi động lại**. Khi đổi URL, cần cập nhật `WEBHOOK_URL`, khởi động lại n8n và **Deactivate → Activate** lại workflow để n8n đăng ký lại webhook với Telegram.

Kiểm tra Telegram đã nhận Webhook đúng chưa:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

### Bước 3: Import Workflow vào n8n

1. Vào **Workflows → Import from File** và nhập lần lượt `Wazuh_SOC.json`, `Tele_to_Wazuh.json`.
2. Tạo **Credentials** cho Telegram (nhập `BOT_TOKEN`) và gán vào các node Telegram.
3. Cập nhật `CHAT_ID`, địa chỉ Wazuh API (`https://<WAZUH_IP>:55000`) và tài khoản API trong các node HTTP Request.
4. Bật **Active** cho cả hai workflow.

| Workflow | Chức năng |
|---|---|
| `Wazuh_SOC.json` | Nhận alert từ Wazuh → định dạng → gửi Telegram kèm nút **Ban** |
| `Tele_to_Wazuh.json` | Nhận callback từ nút bấm → đăng nhập Wazuh API → gọi Active Response |

![Workflow Wazuh đến Telegram](screenshots/wazuh_soc.png)

![Workflow Telegram đến Wazuh](screenshots/tele_to_wazuh.png)

### Bước 4: Cấu hình Wazuh gửi cảnh báo về n8n

Trên Wazuh Manager, thêm khối `<integration>` vào `/var/ossec/etc/ossec.conf`:

```xml
<integration>
  <name>shuffle</name>
  <hook_url>https://xxxx-xx-xx.ngrok-free.app/webhook/wazuh-alert</hook_url>
  <level>10</level>
  <alert_format>json</alert_format>
</integration>
```

> Lưu ý: `hook_url` phải khớp với đường dẫn Webhook trong node **Webhook** của `Wazuh_SOC.json`. Nếu Wazuh và n8n cùng mạng LAN, có thể dùng IP nội bộ (`http://<N8N_IP>:5678/webhook/...`) thay cho ngrok.

Khởi động lại Manager:

```bash
sudo systemctl restart wazuh-manager
```

### Bước 5: Tạo user Wazuh API cho n8n (khuyến nghị)

Nên tạo user riêng thay vì dùng tài khoản `wazuh-wui`/`admin`. Kiểm tra API hoạt động:

```bash
# Lấy JWT token
curl -k -u <API_USER>:<API_PASSWORD> -X POST \
  "https://<WAZUH_IP>:55000/security/user/authenticate?raw=true"
```

Lệnh gọi Active Response mà n8n thực hiện tương đương:

```bash
curl -k -X PUT "https://<WAZUH_IP>:55000/active-response?agents_list=<AGENT_ID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "firewall-drop",
    "arguments": ["-"],
    "alert": {
      "data": {
        "srcip": "192.168.129.128"
      }
    }
  }'
```

### Bước 6: Red Team – Tấn công và nhận cảnh báo

Từ Kali Linux:

```bash
hydra -l root -P passwords.txt ssh://192.168.129.129:2222 -t 4
```

Telegram nhận được tin nhắn cảnh báo kèm nút **Ban**:

![Thông báo tấn công trên Telegram](screenshots/Thong_Bao_Tan_Cong.png)

### Bước 7: Blue Team – Nhấn nút Ban

Analyst kiểm tra thông tin (IP nguồn, Agent, Rule, thời điểm) và nhấn **Ban**. n8n gọi Wazuh API, Active Response thực thi và Telegram phản hồi kết quả.

![Chặn thủ công qua Telegram](screenshots/Ban_Thu_Cong.png)

### Bước 8: Xác minh

```bash
# Trên Ubuntu Target
sudo tail -n 20 /var/ossec/logs/active-responses.log
sudo iptables -L INPUT -n --line-numbers
```

**Kết quả:** IP `192.168.129.128` xuất hiện với hành động `DROP`, tương tự Hướng A.

---

## ⚖️ 8. So sánh hai hướng

| Tiêu chí | A. Auto-Ban | B. Manual Ban (Telegram) |
|---|---|---|
| Tốc độ | Tức thì | Phụ thuộc người trực |
| Nguy cơ chặn nhầm | Cao hơn | Thấp (có bước xác minh) |
| Độ phức tạp triển khai | Thấp (chỉ cấu hình Wazuh) | Cao hơn (n8n, ngrok, Telegram, Wazuh API) |
| Phù hợp với | Luật độ tin cậy cao, tấn công rõ ràng | Cảnh báo cần điều tra, IP nội bộ/đối tác |
| Khả năng mở rộng | Hạn chế | Dễ thêm bước làm giàu dữ liệu (Threat Intel, whitelist) |

## 🧯 9. Xử lý sự cố thường gặp (Troubleshooting)

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Không nhận cảnh báo Telegram | Sai `hook_url` hoặc workflow chưa Active | Kiểm tra `/var/ossec/logs/integrations.log`, bật Active workflow |
| Nhấn nút Ban không có phản hồi | URL ngrok đã đổi, Webhook Telegram lỗi | Chạy `getWebhookInfo`, cập nhật `WEBHOOK_URL`, Deactivate/Activate lại workflow |
| Wazuh API trả `401` | Token hết hạn (mặc định 900 giây) | Đảm bảo workflow lấy token mới ở mỗi lần chạy |
| Không có rule iptables | Agent chưa nhận lệnh / sai Agent ID | Xem `active-responses.log` và `ossec.log` trên Agent |
| Tự chặn nhầm IP quản trị | Không có whitelist | Dùng `<white_list>` trong `ossec.conf` (xem Next Steps) |

## 🚀 10. Hướng phát triển tiếp theo (Next Steps)

- **Whitelist IP tin cậy:** Khai báo `<white_list>` trong `ossec.conf` để không bao giờ chặn IP của quản trị viên.
- **Nút Unban:** Bổ sung nút **Unban** trên Telegram để gỡ chặn nhanh khi xử lý nhầm.
- **Threat Intelligence:** Tích hợp AbuseIPDB/VirusTotal trong n8n để làm giàu dữ liệu IP trước khi hiển thị cho Analyst.
- **Phân quyền:** Chỉ cho phép `CHAT_ID`/User ID được ủy quyền bấm nút Ban.
- **Ticketing:** Tự động tạo ticket (TheHive, Jira) cho mỗi sự cố đã xử lý.
- **Triển khai ổn định:** Thay ngrok bằng tên miền cố định (Cloudflare Tunnel) để không phải cập nhật URL.
