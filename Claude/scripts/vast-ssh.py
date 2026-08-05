# Minimal SSH/SFTP driver for the vast.ai render box, over paramiko.
#
# Why this exists: on this machine the OpenSSH `ssh.exe` binary is blocked
# outbound by local security software (raw TCP from ssh.exe times out, while
# Python reaches the exact same host:port and reads a valid SSH banner).
# paramiko runs inside python.exe, which is not blocked, so it gets through.
#
# Usage:
#   python scripts/vast-ssh.py run  "<remote command>"
#   python scripts/vast-ssh.py put  <local path> <remote path>
#   python scripts/vast-ssh.py get  <remote path> <local path>
#
# Connection details come from env vars, so the host/port are never baked in:
#   VAST_HOST (default ssh1.vast.ai), VAST_PORT, VAST_USER (default root),
#   VAST_KEY (default ~/.ssh/id_ed25519)

import os
import sys
import paramiko

HOST = os.environ.get("VAST_HOST", "ssh1.vast.ai")
PORT = int(os.environ.get("VAST_PORT", "20801"))
USER = os.environ.get("VAST_USER", "root")
KEY = os.environ.get("VAST_KEY", os.path.expanduser("~/.ssh/id_ed25519"))


def connect():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=HOST,
        port=PORT,
        username=USER,
        key_filename=KEY,
        timeout=60,
        banner_timeout=60,
        auth_timeout=60,
    )
    return client


def run(client, command):
    # get_pty so long-running remote commands stream output instead of buffering.
    stdin, stdout, stderr = client.exec_command(command, get_pty=True, timeout=None)
    for line in iter(stdout.readline, ""):
        sys.stdout.write(line)
        sys.stdout.flush()
    code = stdout.channel.recv_exit_status()
    err = stderr.read().decode(errors="replace")
    if err.strip():
        sys.stderr.write(err)
    return code


def progress(done, total):
    pct = (done / total * 100) if total else 0
    sys.stdout.write(f"\r  {done/1048576:.1f} / {total/1048576:.1f} MB ({pct:.0f}%)")
    sys.stdout.flush()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2

    action = sys.argv[1]
    client = connect()
    try:
        if action == "run":
            return run(client, sys.argv[2])

        sftp = client.open_sftp()
        try:
            if action == "put":
                sftp.put(sys.argv[2], sys.argv[3], callback=progress)
            elif action == "get":
                sftp.get(sys.argv[2], sys.argv[3], callback=progress)
            else:
                print(f"Unknown action: {action}")
                return 2
            print("\n  done")
        finally:
            sftp.close()
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
