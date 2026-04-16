#!/bin/bash

# 🔄 Coolify Upstream Sync Script
# ตามกฎเหล็กใน PORTAL_MASTER_PLAN.md

echo "🛰️ Starting Sync with Upstream Coolify..."

# 1. เช็คว่ามี remote upstream หรือยัง
if ! git remote | grep -q 'upstream'; then
    echo "➕ Adding upstream remote..."
    git remote add upstream https://github.com/coollabsio/coolify.git
fi

# 2. อัปเดตกิ่งหลัก
echo "📥 Fetching latest from upstream..."
git fetch upstream

echo "🔄 Updating local main branch..."
git checkout main
git pull upstream main

# 3. รวมเข้ากับกิ่งทำงาน (เปลี่ยนชื่อกิ่งตามความต้องการ)
WORKING_BRANCH="feature/shared-hosting"
echo "🔀 Merging main into $WORKING_BRANCH..."
git checkout $WORKING_BRANCH
git merge main -m "docs: sync with upstream coolify"

echo "✅ Sync Completed! Your customizations are now integrated with latest upstream code."
echo "🚀 Suggestion: Run './scripts/deploy-local.sh' to rebuild the image."
