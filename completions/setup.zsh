#!/bin/zsh
# completions/setup.zsh — 在当前 zsh shell 中启用 cli 补全（零侵入）
#
# 用法：source completions/setup.zsh
# 效果：当前 shell 会话中按 tab 可补全 ./cli 命令
# 注意：关闭终端后失效，需重新 source

SCRIPT_DIR="$(cd "$(dirname "${0:A}")" && pwd)"

# 临时将 completions 目录加入 fpath
fpath+=("$SCRIPT_DIR")

# 加载补全
autoload -Uz _cli
compdef _cli cli

# 同时支持 ./cli 路径补全
compdef "_cli" ./cli 2>/dev/null

echo "✅ zsh 补全已启用（当前 shell）"
echo "   试试：./cli <tab>"
echo ""
echo "💡 提示：关闭终端后失效，可运行以下命令永久安装："
echo "   ./setup-completions.sh"
