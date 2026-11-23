# Kịch bản 02: SOAR – Auto-Ban và Manual Ban qua Telegram

## 1. Mục tiêu

Mở rộng [Kịch bản 01](../01-ssh-bruteforce/README.md): khi Rule `100001` nổ, triển khai hai mô hình phản ứng:

| Hướng | Cơ chế | Người quyết định |
|---|---|---|
| **A. Auto-Ban** | Wazuh Active Response gọi `firewall-drop` | Hệ thống |
| **B. Manual Ban** | Wazuh → n8n → Telegram, Analyst nhấn **Ban** → n8n gọi Wazuh API | Analyst |

> Khi kiểm thử Hướng B, cần tắt `<active-response>` tự động của Rule `100001` để IP không bị chặn trước khi Analyst thao tác.

## 2. Kiến trúc Lab

<p align="center">
  <img src="diagrams/architecture.svg" width="100%" alt="Sơ đồ kiến trúc SOAR Lab">
</p>

| Thành phần | Vai trò |
|---|---|
| Kali Linux (`192.168.129.128`) | Máy tấn công |
| Ubuntu Target (`192.168.129.129`) | SSH `2222`, Wazuh Agent, `iptables` |
| Wazuh Manager | Rule `100001`, Active Response, API `55000` |
| n8n + ngrok | Điều phối workflow, HTTPS callback cho Telegram |
| Telegram Bot | Gửi cảnh báo Level 10, nhận nút **Ban** |

**Luồng A:** Brute-Force → Rule `100001` → `firewall-drop` → `iptables DROP`.
**Luồng B:** Rule `100001` → `Wazuh_SOC.json` gửi Telegram kèm nút Ban → Analyst nhấn → `Tele_to_Wazuh.json` gọi Wazuh API kích hoạt `firewall-drop` → phản hồi về Telegram.

Workflow đã export: [`Wazuh_SOC.json`](./Wazuh_SOC.json), [`Tele_to_Wazuh.json`](./Tele_to_Wazuh.json).

## 3. Kết quả chính

**Hướng A – Auto-Ban:** Hydra bị treo, Telegram nhận cảnh báo, `iptables` có luật DROP cho `192.168.129.128`.

![Hydra bị treo](screenshots/1_Kali_Hydra_Bi_Treo.png)

![iptables DROP](screenshots/4_Ubuntu_Iptables_Drop_IP.png)

**Hướng B – Manual Ban:** Telegram nhận thông báo kèm nút Ban; sau khi Analyst xác nhận, n8n chèn luật DROP trên Agent.

![Thông báo tấn công](screenshots/Thong_Bao_Tan_Cong.png)

![Ban thủ công](screenshots/Ban_Thu_Cong.png)

## 4. So sánh

| Tiêu chí | Auto-Ban | Manual Ban |
|---|---|---|
| Tốc độ | Tức thời | Phụ thuộc Analyst |
| Rủi ro False Positive | Cao hơn | Thấp hơn |
| Phù hợp | Sự kiện rõ ràng, tin cậy cao | Sự kiện cần đánh giá ngữ cảnh |

## 5. Kết luận & Hướng phát triển

Hoàn thiện hai cơ chế phản ứng (tự động và bán tự động). Hướng phát triển: Whitelist IP, nút Unban, phân quyền theo Telegram User ID, làm giàu IP bằng Threat Intelligence, lưu Audit Log.

> Chi tiết cấu hình Active Response, Integration, Credentials n8n: xem document dự án.
