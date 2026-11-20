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
        $node1 = "require('child_process')"
        $node2 = "Buffer.from("
        $rev_shell = "/dev/tcp/"
    condition:
        any of them
}
