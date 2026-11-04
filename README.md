\# Cybersecurity Home Lab — Integrated Web Security Assessment, Network IDS \& SIEM Monitoring



Dự án \*\*Cybersecurity Home Lab\*\* xây dựng một môi trường thực hành An toàn thông tin khép kín từ kiểm thử xâm nhập (Red Team), giám sát phát hiện xâm nhập mạng và máy trạm (Blue Team - Suricata IDS/IPS \& Wazuh SIEM), đến rà soát mã nguồn và khắc phục lỗ hổng (Security Engineering).



\---



\## 1. Kiến trúc tổng thể \& Luồng hoạt động



```text

\[ Kali Linux (Attacker) ]

&#x20;  │  Reconnaissance · OWASP Testing · Network Scanning

&#x20;  ▼

\[ Mạng Lab nội bộ: 192.168.129.0/24 ] ──► \[ Wireshark (Packet Capture) ]

&#x20;  │

&#x20;  ├──► \[ Suricata IDS/IPS ] (Network Intrusion Detection \& EVE JSON Logs)

&#x20;  │

&#x20;  ▼

\[ Ubuntu Target: 192.168.129.129 ]

&#x20;  ├── Target Web App: Employee Management (Node.js / Express / EJS - Port 8000)

&#x20;  ├── Cloud DB Connection: Aiven MySQL (classicmodels - SSL/TLS)

&#x20;  ├── Host Firewall \& Services: UFW, OpenSSH, System/Auth Logs

&#x20;  └── Wazuh Agent (Log Forwarding, FIM, Vulnerability Inventory)

&#x20;         │

&#x20;         ▼

\[ Wazuh Server / SIEM: 192.168.129.131 ]

&#x20;  └── Log Analysis · Custom Rules · Alerting · MITRE ATT\&CK Mapping

