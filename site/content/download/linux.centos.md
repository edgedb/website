---
os: Linux
kind: CentOS/RHEL
version: "7/8/9"
weight: 0
---

**Step 1.** Add the EdgeDB package repository:

    sudo curl --proto '=https' --tlsv1.2 -sSfL \
      https://packages.edgedb.com/rpm/edgedb-rhel.repo \
      > /etc/yum.repos.d/edgedb.repo

**Step 2.** Install the EdgeDB package:

    sudo yum install edgedb-3

**Step 3.** Follow the [quickstart](/docs/guides/quickstart#initialize-a-project).
