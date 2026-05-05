#!/bin/bash
# setup-completions.sh — 安装 zsh/bash 补全（可选，持久化）
#
# 用法：
#   ./setup-completions.sh           # 安装到 ~/.zsh/completions/
#   ./setup-completions.sh --bash    # 安装到 ~/.bash_completion.d/
#   ./setup-completions.sh --check   # 检查当前 shell 是否支持

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🤖⧉👤 CLI 补全安装脚本"
echo "======================"
echo ""

# 检查当前 shell
current_shell="$(basename "$SHELL")"
echo "当前 shell: $current_shell"

if [ "$1" == "--check" ]; then
  echo ""
  echo "✅ 检查完成"
  echo "   zsh 用户：运行 source completions/setup.zsh（零侵入）"
  echo "   或运行 ./setup-completions.sh（持久化）"
  exit 0
fi

# zsh 安装
if [ "$current_shell" == "zsh" ] || [ "$1" == "--zsh" ]; then
  TARGET_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/completions"
  
  # 如果没有 oh-my-zsh，使用 ~/.zsh/completions
  if [ ! -d "$TARGET_DIR" ]; then
    TARGET_DIR="$HOME/.zsh/completions"
  fi
  
  mkdir -p "$TARGET_DIR"
  cp "$SCRIPT_DIR/completions/_cli" "$TARGET_DIR/"
  
  echo "✅ zsh 补全已安装到 $TARGET_DIR/_cli"
  echo ""
  echo "请重启终端或运行："
  echo "   source ~/.zshrc"
  echo ""
  echo "然后试试："
  echo "   ./cli <tab>"
  echo "   ./cli chrome <tab>"
fi

# bash 安装
if [ "$current_shell" == "bash" ] || [ "$1" == "--bash" ]; then
  TARGET_DIR="$HOME/.bash_completion.d"
  mkdir -p "$TARGET_DIR"
  
  cat > "$TARGET_DIR/cli-completion.bash" << 'EOF'
_cli_completion() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  local prev="${COMP_WORDS[COMP_CWORD-1]}"
  
  local commands="status plans decisions summary browser context chrome watch help --version"
  local chrome_commands="start stop status"
  
  if [ "$prev" == "chrome" ]; then
    COMPREPLY=( $(compgen -W "$chrome_commands" -- "$cur") )
  else
    COMPREPLY=( $(compgen -W "$commands" -- "$cur") )
  fi
}

complete -F _cli_completion cli
complete -F _cli_completion ./cli
EOF
  
  echo "✅ bash 补全已安装到 $TARGET_DIR/cli-completion.bash"
  echo ""
  echo "请添加以下内容到 ~/.bashrc（如尚未添加）："
  echo "   source ~/.bash_completion.d/cli-completion.bash"
fi
