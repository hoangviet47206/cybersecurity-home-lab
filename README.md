# Cybersecurity Home Lab – SIEM, NIDS, Detection Engineering & SOAR

Dự án xây dựng môi trường phòng lab an ninh mạng thực chiến theo mô hình **Blue Team / SOC**, mô phỏng trọn vẹn vòng đời giám sát và ứng phó sự cố: từ thu thập log điểm cuối, phát hiện xâm nhập mạng (**Suricata NIDS**), xây dựng luật phát hiện (**Detection Engineering**), tự động hóa phản ứng (**SOAR**), rà quét mã độc (**YARA**), điều tra gói tin mạng (**Network Forensics**) đến cô lập đa lớp và vá lỗi mã nguồn (**Remediation**).

> **Lưu ý:** Toàn bộ kịch bản tấn công và kiểm thử trong kho lưu trữ này chỉ được thực hiện trong mạng Lab cô lập phục vụ mục đích học tập, nghiên cứu và nâng cao năng lực phòng thủ.

---

## 1. Kiến trúc tổng thể Lab

<p align="center">
  <img src="docs/architecture/lab-architecture.svg" width="100%" alt="Sơ đồ kiến trúc tổng thể Cybersecurity Home Lab">
</p>

### Thành phần hạ tầng

| Thành phần | Hệ điều hành / Nền tảng | Địa chỉ IP / Cổng | Vai trò chính |
|---|---|---|---|
| **Attacker / C2** | Kali Linux | `192.168.129.128` (`:4444`) | Mô phỏng tấn công SSH Brute-Force (`Hydra`), tải lên Webshell, khai thác SQL Injection (`curl`) và đóng vai trò máy chủ C2 |
| **Target Endpoint** | Ubuntu Server | `192.168.129.129` (`ens34`) | Chạy SSH (`:2222`), ứng dụng web Node.js (`:8000`), MySQL nội bộ, Suricata NIDS, Wazuh Agent, YARA, `tcpdump` và `iptables` |
| **SIEM Manager** | Wazuh Manager | `192.168.129.131` (`:1514`, `:55000`) | Thu thập và tương quan log đa nguồn (Endpoint, Suricata `eve.json`, App `app.json`), Custom Rules, Active Response & API |
| **SOAR Stack** | n8n + ngrok + Telegram Bot | n8n `:5678` + HTTPS Tunnel | Điều phối cảnh báo thời gian thực và thực thi chặn thủ công (Human-in-the-loop) |

---

## 2. Các kịch bản thực chiến đã hoàn thành

| Kịch bản | Trọng tâm kỹ thuật | Custom Rule & MITRE ATT&CK | Tài liệu chi tiết |
|---|---|---|---|
| **01. SSH Brute-Force Detection** | Thu thập `/var/log/auth.log`, phân tích luật mặc định (`5760`) và thiết kế Custom Rule theo tần suất | `Rule 100001` (Level 10) • `T1110.001` | [Xem Kịch bản 01](scenarios/01-ssh-bruteforce/README.md) |
| **02. SOAR: Auto-Ban & Manual Ban** | Tích hợp Wazuh Active Response (`firewall-drop`), n8n, ngrok, Telegram Bot và Wazuh API | `Rule 100001` (Level 10) • Auto & Manual Ban | [Xem Kịch bản 02](scenarios/02-auto-ban/README.md) |
| **03. Webshell & C2 Hunting** | Wazuh FIM + YARA quét mã độc trên Node.js app, bắt gói tin C2 bằng `tcpdump`/Wireshark và cô lập `iptables` | `Rule 100005` (Level 12) • `T1505.003` | [Xem Kịch bản 03](scenarios/03-webshell-c2-hunting/README.md) |
| **04. SQLi & Suricata NIDS Detection** | Khai thác SQLi trên `/lab/search`, bắt chữ ký bằng Suricata NIDS (`SID 9000001–9000002`), đối chiếu Application Log (`app.json`), phân tích Wireshark và vá lỗi Parameterized Query (`?`) | `Rules 100020–100023` (Level 8–12) • `T1190` | [Xem Kịch bản 04](scenarios/04-sqli-suricata-detection/README.md) |

---

## 3. Tài liệu & Hiện vật kỹ thuật (Docs, Artifacts & Evidence)

Toàn bộ tài liệu dự án, luật phát hiện, kịch bản tự động hóa, cấu hình sao lưu và bằng chứng điều tra được phân bổ theo đúng chuẩn quy trình lưu trữ chứng cứ (**Chain of Custody**):

| Danh mục | Tệp tin | Mô tả |
|---|---|---|
| **Tài liệu dự án (Docs)** | [`Document_VI.pdf`](docs/Document_VI.pdf) • [`Document_EL.pdf`](docs/Document_EL.pdf) | Tài liệu tổng quan và thuyết minh chi tiết dự án (bản Tiếng Việt & Tiếng Anh) |
| **Báo cáo dự án** | [`baseline-report.pdf`](reports/final-report/baseline-report.pdf) • [`baseline-progress-report.docx`](reports/technical-report/baseline-progress-report.docx) | Báo cáo tổng kết và tiến độ kỹ thuật của hệ thống Lab |
| **Wazuh Custom Rules** | [`ssh_bruteforce_rule.xml`](scenarios/01-ssh-bruteforce/detection-rules/ssh_bruteforce_rule.xml) | Custom Rule `100001` phát hiện SSH Brute-Force ($\ge 5$ lần lỗi / 60s) |
| **Wazuh Custom Rules** | [`webshell_detection.xml`](detection-rules/wazuh/webshell_detection.xml) | Custom Decoder `custom-yara-webshell` & Rule `100005` (Level 12) |
| **YARA Rules** | [`webshell_detection.yar`](detection-rules/yara/webshell_detection.yar) | Bộ chữ ký nhận diện hàm thực thi lệnh nguy hiểm trong Webshell PHP/Node.js |
| **Active Response Script** | [`yara_scanner.sh`](scripts/wazuh/yara_scanner.sh) | Script tích hợp Wazuh FIM tự động gọi YARA quét tệp mới tải lên |
| **Cấu hình Agent** | [`ossec.conf`](configs/wazuh/ossec.conf) | Bản sao cấu hình Wazuh Agent trên Ubuntu Target (FIM & thu thập log JSON) |
| **Bằng chứng mạng (PCAP)** | [`c2_traffic.pcap`](evidence/07-integrated-scenarios/c2_traffic.pcap) | Gói tin bắt giữ luồng kết nối Outbound và TCP Stream tới máy chủ C2 |
| **Bằng chứng mã độc (Hash)** | [`malware_hash.txt`](evidence/07-integrated-scenarios/malware_hash.txt) | Báo cáo mã băm MD5 và SHA-256 của tệp Webshell đã cách ly |
| **Ứng dụng mục tiêu** | [`employee-management`](targets/employee-management/Readme.md) | Ứng dụng web Node.js/Express dùng làm máy chủ nạn nhân thực tế |

---

## 4. Cấu trúc kho lưu trữ

```text
cybersecurity-home-lab/
├── configs/                # Sao lưu cấu hình hệ thống (Wazuh Agent ossec.conf...)
├── detection-rules/        # Bộ luật phát hiện tập trung (Wazuh XML, YARA, Suricata)
├── docs/                   # Tài liệu dự án (Document_VI.pdf, Document_EL.pdf) & sơ đồ kiến trúc
├── evidence/               # Lưu trữ chứng cứ điều tra (PCAP, Hash...)
├── reports/                # Báo cáo kỹ thuật và báo cáo tổng kết (PDF/DOCX)
├── scenarios/              # 04 kịch bản phòng thủ & ứng phó sự cố tích hợp hoàn chỉnh
├── scripts/                # Các script tự động hóa và Active Response (yara_scanner.sh)
└── targets/                # Mã nguồn ứng dụng mục tiêu (employee-management)
```

---

## 5. Công nghệ & Kỹ năng áp dụng

- **SIEM & Log Correlation:** Wazuh Manager, Wazuh Agent, File Integrity Monitoring (FIM), Custom Decoders & Rules, đối chiếu log đa nguồn (NIDS + Application JSON Log), MITRE ATT&CK Mapping.
- **NIDS & AppSec Remediation:** Suricata NIDS (Custom Rules, `eve.json`), phân biệt tấn công thử (*Attempted*) vs khai thác thành công (*Successful*), vá lỗ hổng SQL Injection bằng Parameterized Query (`?`).
- **Malware & Network Forensics:** YARA Rule Authoring, `tcpdump`, Wireshark (Packet Filtering, Follow TCP/HTTP Stream), trích xuất IOC (Hash, IP/Port C2, HTTP Payload).
- **SOAR & Incident Response:** Wazuh Active Response (`firewall-drop`), n8n Workflows, Telegram Bot, Wazuh REST API, `iptables` Containment, Quarantine & Linux Hardening.

---

## 6. Lộ trình mở rộng

- **Tự động hóa phản ứng (SOAR) cho Kịch bản 03 & 04:** Nối cảnh báo YARA (`Rule 100005`) và SQLi (`Rule 100022`) vào workflow n8n để gửi thông báo tức thời kèm nút cô lập nhanh qua Telegram.
- **Mở rộng bộ luật Suricata NIDS:** Bổ sung chữ ký phát hiện cho các kỹ thuật tấn công ứng dụng web khác (XSS, LFI, Command Injection) và lưu lượng C2 tại `detection-rules/suricata/`.
- **Tích hợp Threat Intelligence:** Kết nối VirusTotal / AbuseIPDB API vào luồng xử lý cảnh báo để tự động làm giàu ngữ cảnh IOC (IP, File Hash).