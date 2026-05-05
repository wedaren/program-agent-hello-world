#!/bin/bash
# install-mcp.sh — 将项目 MCP 配置安装到全局
#
# 用法:
#   ./install-mcp.sh              # 安装到 Claude Code 全局配置
#   ./install-mcp.sh --cursor     # 安装到 Cursor 全局配置
#   ./install-mcp.sh --check      # 检查 Chrome 是否就绪

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_CONFIG="$SCRIPT_DIR/config/mcp.json"

function check_chrome() {
  echo "🔍 检查 Chrome 远程调试..."
  if curl -s http://127.0.0.1:9222/json > /dev/null 2>&1; then
    echo "✅ Chrome 已就绪（端口 9222）"
  else
    echo "⚠️  Chrome 未启动远程调试"
    echo ""
    echo "请运行："
    echo "  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\"
    echo "    --remote-debugging-port=9222 \\"
    echo "    --user-data-dir=/tmp/chrome-dev-profile"
    echo ""
    exit 1
  fi
}

function install_claude() {
  local target="$HOME/.claude/mcp.json"
  mkdir -p "$(dirname "$target")"
  
  if [ -f "$target" ]; then
    echo "⚠️  已存在 ~/.claude/mcp.json，合并中..."
    # 简单合并：提示用户手动处理
    echo "   请将以下内容添加到 $target："
    cat "$MCP_CONFIG"
  else
    cp "$MCP_CONFIG" "$target"
    echo "✅ 已安装到 ~/.claude/mcp.json"
  fi
}

function install_cursor() {
  local target="$HOME/.cursor/mcp.json"
  mkdir -p "$(dirname "$target")"
  
  if [ -f "$target" ]; then
    echo "⚠️  已存在 ~/.cursor/mcp.json，请手动合并"
    cat "$MCP_CONFIG"
  else
    cp "$MCP_CONFIG" "$target"
    echo "✅ 已安装到 ~/.cursor/mcp.json"
  fi
}

echo "🤖⧉👤 MCP 配置安装脚本"
echo "========================"
echo ""

# 检查 Chrome
check_chrome

# 解析参数
case "${1:-}" in
  --cursor)
    install_cursor
    ;;
  --claude)
    install_claude
    ;;
  --check)
    # 只检查，不安装
    ;;
  *)
    echo "安装到 Claude Code（默认）..."
    install_claude
    echo ""
    echo "其他 Agent："
    echo "  ./install-mcp.sh --cursor    # Cursor"
    echo "  ./install-mcp.sh --check     # 只检查 Chrome"
    ;;
esac

echo ""
echo "✅ 完成！Agent 现在可以通过 MCP 控制 Chrome 了。"
