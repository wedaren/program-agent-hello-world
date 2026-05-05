#!/bin/bash
# completions/setup.sh — 安装 zsh/bash 补全（可选，持久化）
#
# 设计：只安装一次 _cli 函数到 ~/.zsh/completions/
# _cli 是动态的，每次按 tab 都会调用当前目录的 ./cli --completions
# 所以多个项目不会冲突。

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🤖⧉👤 CLI 补全安装脚本"
echo "======================"
echo ""
echo "设计说明："
echo "  _cli 函数只安装一次，但补全内容是动态的。"
echo "  每次按 tab，_cli 会调用当前目录的 ./cli --completions"
echo "  获取该项目的命令列表。多个项目不会冲突。"
echo ""

current_shell="$(basename "$SHELL")"
echo "当前 shell: $current_shell"

# zsh
if [ "$current_shell" == "zsh" ] || [ "$1" == "--zsh" ]; then
  # 优先使用 oh-my-zsh 目录
  TARGET_DIR="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/completions"
  if [ ! -d "$TARGET_DIR" ]; then
    TARGET_DIR="$HOME/.zsh/completions"
  fi
  
  mkdir -p "$TARGET_DIR"
  cp "$SCRIPT_DIR/_cli" "$TARGET_DIR/"
  
  echo "✅ zsh 补全已安装到 $TARGET_DIR/_cli"
  echo ""
  echo "请重启终端或运行：source ~/.zshrc"
  echo ""
  echo "然后试试："
  echo "   cd ~/project-a && ./cli <tab>   # 显示 project-a 的命令"
  echo "   cd ~/project-b && ./cli <tab>   # 显示 project-b 的命令"
fi

# bash
if [ "$current_shell" == "bash" ] || [ "$1" == "--bash" ]; then
  TARGET_DIR="$HOME/.bash_completion.d"
  mkdir -p "$TARGET_DIR"
  
  cat > "$TARGET_DIR/cli-completion.bash" << 'EOF'
# 动态获取当前目录 ./cli 的命令
_cli_completion() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  local cmds
  
  if [ -x ./cli ]; then
    cmds=$(./cli --completions 2>/dev/null)
  fi
  
  if [ -z "$cmds" ]; then
    cmds="status plans decisions summary browser context chrome watch help"
  fi
  
  COMPREPLY=( $(compgen -W "$cmds" -- "$cur") )
}

complete -F _cli_completion cli
complete -F _cli_completion ./cli
EOF
  
  echo "✅ bash 补全已安装到 $TARGET_DIR/cli-completion.bash"
  echo ""
  echo "请添加以下内容到 ~/.bashrc："
  echo "   source ~/.bash_completion.d/cli-completion.bash"
fi
