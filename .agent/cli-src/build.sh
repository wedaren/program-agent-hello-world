#!/bin/bash
# build.sh — 本地构建 CLI
#
# 不安装到系统，只在项目内构建。
# 构建后使用 ./hac 运行。

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🔨 Human-Agent Coexistence CLI 本地构建"
echo "=========================================="
echo ""

# 检查 bun
if ! command -v bun &> /dev/null; then
    echo "❌ 未找到 bun"
    echo "   请先安装: https://bun.sh"
    exit 1
fi

echo "✓ bun: $(bun --version)"

# 安装依赖
echo ""
echo "📦 安装依赖..."
cd "$SCRIPT_DIR"
bun install

# 构建
echo ""
echo "🔨 编译..."
bun run build

echo ""
echo "=========================================="
echo "✅ 构建完成"
echo ""
echo "运行方式（在项目根目录）:"
echo "   ./hac status       # 完整仪表板"
echo "   ./hac plans        # 计划进度"
echo "   ./hac help         # 帮助"
echo ""
echo "💡 首次运行 ./hac 会自动构建，无需手动执行本脚本"
