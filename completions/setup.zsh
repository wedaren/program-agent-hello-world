#!/bin/zsh
# completions/setup.zsh — 在当前 zsh shell 中启用 cli 补全
#
# 用法：source completions/setup.zsh
# 
# 设计：只注册 _cli 函数一次。_cli 会动态检测当前目录的 ./cli 获取命令。
# 多个项目不会冲突，因为 _cli 每次按 tab 都会重新调用 ./cli --completions。

SCRIPT_DIR="$(cd "$(dirname "${0:A}")" && pwd)"

# 将 completions 目录加入 fpath（如果尚未加入）
if [[ "${fpath[(i)$SCRIPT_DIR]}" -gt ${#fpath} ]]; then
  fpath+=("$SCRIPT_DIR")
fi

# 加载并注册补全
autoload -Uz _cli
compdef _cli cli 2>/dev/null
compdef _cli ./cli 2>/dev/null

echo "✅ zsh 补全已启用（当前 shell）"
echo "   试试：./cli <tab>"
echo ""
echo "💡 多个项目不会冲突："
echo "   _cli 每次按 tab 都会调用当前目录的 ./cli --completions"
echo "   不同项目返回各自的命令列表"
echo ""
echo "持久安装（可选）："
echo "   ./setup-completions.sh"
