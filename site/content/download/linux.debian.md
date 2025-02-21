---
os: Linux
kind: Debian/Ubuntu LTS
weight: 50
---

**Step 1.** Import the EdgeDB packaging key:

    sudo mkdir -p /usr/local/share/keyrings && \
    sudo curl --proto '=https' --tlsv1.2 -sSf \
      -o /usr/local/share/keyrings/edgedb-keyring.gpg \
      https://packages.edgedb.com/keys/edgedb-keyring.gpg

**Step 2.** Add the EdgeDB package repository:

    echo deb [signed-by=/usr/local/share/keyrings/edgedb-keyring.gpg]\
      https://packages.edgedb.com/apt \
      $(grep "VERSION_CODENAME=" /etc/os-release | cut -d= -f2) main \
      | sudo tee /etc/apt/sources.list.d/edgedb.list

**Step 3.** Install the EdgeDB package:

    sudo apt-get update && sudo apt-get install edgedb-3

**Step 4.** Follow the [quickstart](/docs/guides/quickstart#initialize-a-project).
