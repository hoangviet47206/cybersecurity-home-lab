# Kịch bản 01: Mô phỏng và phát hiện tấn công SSH Brute-Force (Detection Engineering)

## 1. Mục tiêu

Kịch bản này mô phỏng một cuộc tấn công dò mật khẩu (SSH Brute-Force) vào máy chủ mục tiêu. Sau đó, hệ thống SIEM **Wazuh** được dùng để giám sát, phân tích các cảnh báo mặc định và thực hành **Detection Engineering** bằng cách xây dựng một luật phát hiện tùy chỉnh (Custom Detection Rule).

Mục tiêu chính:

- Nhận diện hành vi đăng nhập SSH thất bại liên tục từ cùng một địa chỉ IP.
- Thiết lập ngưỡng phát hiện: ít nhất 5 lần thất bại trong 60 giây.
- Nâng mức cảnh báo lên **Level 10** khi có dấu hiệu Brute-Force.

> **Lưu ý:** Toàn bộ thử nghiệm được thực hiện trong môi trường Lab riêng. Không dùng các kỹ thuật này lên hệ thống mà bạn không có quyền kiểm thử.

---

## 2. Môi trường Lab (Topology)

| Thành phần | Hệ thống | Địa chỉ IP / Cấu hình |
|---|---|---|
| Attacker | Kali Linux | `192.168.129.128` |
| Target | Ubuntu Target (Wazuh Agent) | `192.168.129.129` |
| SSH Service | Ubuntu Target | Port `2222` |
| SIEM | Wazuh Server | Standalone VM |

**Công cụ sử dụng:** `Hydra`, `grep`, `journalctl`, Wazuh Dashboard, Wazuh Custom Rules.

---

## 3. Cấu trúc thư mục

```text
01-ssh-bruteforce/
├── README.md
├── detection-rules/
│   └── ssh_bruteforce_rule.xml
└── screenshots/
    ├── hydra-attack-running.png
    ├── auth-log-failed.png
    ├── wazuh-alert-dashboard.png
    └── wazuh-custom-rule.png
```

File luật phát hiện hoàn chỉnh: [`detection-rules/ssh_bruteforce_rule.xml`](./detection-rules/ssh_bruteforce_rule.xml).

---

## 4. Các bước thực hiện

### Bước 1: Red Team – Thực hiện tấn công Brute-Force

Từ máy Kali Linux, tạo danh sách 50 mật khẩu giả lập để mô phỏng quá trình dò mật khẩu. Sau đó dùng `hydra` để thực hiện nhiều lần đăng nhập SSH vào Ubuntu Target qua cổng `2222`.

```bash
# Tạo danh sách 50 mật khẩu giả lập
seq 1 50 > passwords.txt

# Thực hiện tấn công SSH Brute-Force
hydra -l root -P passwords.txt ssh://192.168.129.129:2222 -t 4
```

**Kết quả:** Hydra liên tục thử đăng nhập bằng các mật khẩu trong danh sách, tạo ra nhiều sự kiện xác thực thất bại trên máy chủ mục tiêu.

![Hydra SSH Brute-Force Attack](screenshots/hydra-attack-running.png)

### Bước 2: Blue Team – Kiểm tra log hệ thống (Local)

Trên Ubuntu Target, kiểm tra file log xác thực để xác nhận hệ điều hành đã ghi nhận các lần đăng nhập SSH thất bại từ Kali Linux.

```bash
sudo grep -a "Failed password" /var/log/auth.log | tail -n 10
```

Nếu hệ thống không ghi log ra `/var/log/auth.log`, có thể đọc log qua `journalctl`:

```bash
sudo journalctl -u ssh --no-pager | grep "Failed password" | tail -n 10
```

**Kết quả:** Log hệ thống ghi nhận nhiều lần đăng nhập thất bại, kèm địa chỉ IP nguồn `192.168.129.128`. Đây là bằng chứng cho thấy hoạt động Brute-Force đã được ghi nhận ở cấp độ hệ điều hành.

![Ubuntu SSH Authentication Failed Log](screenshots/auth-log-failed.png)

### Bước 3: Detection Engineering – Phân tích cảnh báo mặc định trên Wazuh

Wazuh dùng các bộ quy tắc mặc định (Out-of-the-box Rules) để phân tích log xác thực SSH thu thập từ Ubuntu Target. Khi xuất hiện các sự kiện đăng nhập thất bại, Wazuh tự động tạo cảnh báo tương ứng.

Một số Rule liên quan trong kịch bản:

| Rule ID | Level | Mô tả |
|---|---:|---|
| `5760` | 5 | SSH authentication failed |
| `5551` | 10 | PAM: Multiple failed logins in a short period |
| `2502` | 10 | Phát hiện nhiều lần nhập sai mật khẩu |

Truy cập Wazuh Dashboard và lọc theo Agent:

```text
agent.name: ubuntu-target
```

**Kết quả:** Dashboard hiển thị các sự kiện đăng nhập thất bại cùng địa chỉ IP nguồn và mức độ cảnh báo. Qua đó có thể quan sát cách Wazuh dùng các Rule mặc định để nhận diện hành vi bất thường.

![Wazuh SSH Brute-Force Detection Dashboard](screenshots/wazuh-alert-dashboard.png)

### Bước 4: Detection Engineering – Xây dựng Custom Detection Rule

Sau khi phân tích các cảnh báo mặc định, xây dựng một luật tùy chỉnh để chủ động kiểm soát ngưỡng nhận diện hành vi SSH Brute-Force.

**Yêu cầu phát hiện:**

- Theo dõi các sự kiện đăng nhập SSH thất bại được nhận diện bởi Rule `5760`.
- Nếu xuất hiện ít nhất 5 lần trong vòng 60 giây từ cùng một địa chỉ IP nguồn, kích hoạt cảnh báo.
- Đặt mức cảnh báo là **Level 10** để đánh dấu hành vi có dấu hiệu Brute-Force.

**Vị trí cấu hình (trên Wazuh Server):**

```bash
sudo nano /var/ossec/etc/rules/local_rules.xml
```

**Mã nguồn Custom Rule:**

```xml
<group name="local,syslog,sshd,">
  <rule id="100001" level="10" frequency="5" timeframe="60">
    <if_matched_sid>5760</if_matched_sid>
    <same_source_ip />
    <description>SSH Brute-Force Attack Detected: Multiple failed SSH login attempts from the same source IP.</description>
    <mitre>
      <id>T1110.001</id>
    </mitre>
  </rule>
</group>
```

**Thông tin luật phát hiện:**

| Thuộc tính | Giá trị |
|---|---|
| Rule ID | `100001` |
| Rule Level | `10` |
| Frequency | `5` |
| Timeframe | `60` giây |
| Correlation | Cùng địa chỉ IP nguồn (`same_source_ip`) |
| MITRE ATT&CK | `T1110.001` – Password Guessing |

Sau khi bổ sung luật, kiểm tra cấu hình hợp lệ rồi khởi động lại Wazuh Manager:

```bash
# Kiểm tra cú pháp luật và cấu hình
sudo /var/ossec/bin/wazuh-analysisd -t

# Khởi động lại Wazuh Manager
sudo systemctl restart wazuh-manager
```

Chạy lại tấn công Hydra ở Bước 1. Khi hệ thống nhận đủ số sự kiện thỏa điều kiện, Custom Rule `100001` được kích hoạt và tạo cảnh báo Level 10. Có thể lọc trên Dashboard bằng:

```text
rule.id: 100001
```

**Kết quả mong đợi:** Wazuh Dashboard hiển thị cảnh báo với Rule ID `100001`, cho phép xác định hành vi SSH Brute-Force dựa trên ngưỡng do người quản trị thiết lập.

![Wazuh Custom SSH Brute-Force Detection](screenshots/wazuh-custom-rule.png)

---

## 5. Hướng phát triển tiếp theo

- **Active Response:** tự động chặn IP nguồn bằng `iptables` hoặc `UFW` khi Custom Rule phát hiện Brute-Force. Nội dung này được thực hiện ở [Kịch bản 02 – SOAR: Auto-Ban và Manual Ban qua Telegram](../02-auto-ban/README.md).
- **Incident Investigation:** phân tích mối liên hệ giữa log xác thực trên Ubuntu Target và cảnh báo trên Wazuh Dashboard để xác định nguồn tấn công, thời điểm và tần suất.
- **Threat Intelligence:** tích hợp nguồn dữ liệu Threat Intelligence để đối chiếu địa chỉ IP đáng ngờ với các mối đe dọa đã biết.
