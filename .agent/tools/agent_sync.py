#!/usr/bin/env python3
"""
Agent → 人类 同步脚本

将 .agent/ 中的详细数据提炼并同步到 .human/ 中的产物。
人类通过 human/view.py 查看，不直接阅读产物文件。

用法:
    python scripts/agent_sync.py              # 全量同步
    python scripts/agent_sync.py --summary    # 仅同步概览
    python scripts/agent_sync.py --dashboard  # 仅刷新仪表板
    python scripts/agent_sync.py --data       # 仅生成 data.json

设计原则:
    - 产物放在 .human/（隐藏目录），人类不直接看
    - human/view.py 读取 .human/data.json 渲染终端界面
    - 单向同步：.agent/ → .human/
    - 信息衰减：保留精华，丢弃细节
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ─────────────────────────── 配置 ───────────────────────────

# 计算项目根目录（从 .agent/tools/ 向上两级到项目根）
PROJECT_ROOT = Path(__file__).parent.parent.parent
AGENT_DIR = PROJECT_ROOT / ".agent"
HUMAN_GEN_DIR = PROJECT_ROOT / ".human"

# ─────────────────────────── 工具函数 ───────────────────────────


def now() -> str:
    """返回当前 ISO 格式时间字符串。"""
    return datetime.now(timezone.utc).astimezone().isoformat()


def read_json(path: Path) -> dict[str, Any]:
    """读取 JSON 文件。"""
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def write_file(path: Path, content: str) -> None:
    """写入文本文件。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  ✓ {path.relative_to(PROJECT_ROOT)}")


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    """解析 Markdown 文件的 Frontmatter。"""
    pattern = r"^---\s*\n(.*?)\n---\s*\n(.*)$"
    match = re.match(pattern, text, re.DOTALL)
    if not match:
        return {}, text
    
    meta: dict[str, Any] = {}
    for line in match.group(1).split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            key, val = line.split(":", 1)
            val = val.strip().strip('"').strip("'")
            # 尝试解析列表
            if val.startswith("[") and val.endswith("]"):
                val = [v.strip().strip('"').strip("'") for v in val[1:-1].split(",")]
            meta[key.strip()] = val
    return meta, match.group(2)


def parse_plan_file(path: Path) -> dict[str, Any]:
    """解析计划文件，提取关键信息。"""
    text = path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    
    # 匹配多种任务标记格式: - [x], ### [x], 🔩 [x] 等
    total = len(re.findall(r"[\-\#\*]?\s*🔩?\s*\[[ xX]\]", body))
    done = len(re.findall(r"[\-\#\*]?\s*🔩?\s*\[[xX]\]", body))
    progress = round(done / total * 100) if total > 0 else 0
    
    return {
        "id": meta.get("id", path.stem),
        "title": meta.get("title", path.stem),
        "status": meta.get("status", "unknown"),
        "priority": meta.get("priority", "medium"),
        "progress": progress,
        "total_screws": total,
        "done_screws": done,
        "tags": meta.get("tags", []) if isinstance(meta.get("tags"), list) else [],
        "created_at": meta.get("created_at", ""),
        "started_at": meta.get("started_at", ""),
    }


def list_plans(status_dir: str) -> list[dict[str, Any]]:
    """列出指定状态目录下的所有计划。"""
    plans_dir = AGENT_DIR / "plans" / status_dir
    if not plans_dir.exists():
        return []
    
    plans = []
    for path in sorted(plans_dir.glob("*.md")):
        if path.name == "index.md":
            continue
        try:
            plans.append(parse_plan_file(path))
        except Exception as e:
            print(f"  ⚠ 解析计划失败 {path}: {e}")
    return plans


def list_decisions(limit: int = 5) -> list[dict[str, Any]]:
    """列出最近的决策日志。"""
    decisions_dir = AGENT_DIR / "memory" / "decisions"
    if not decisions_dir.exists():
        return []
    
    decisions = []
    for path in sorted(decisions_dir.glob("*.md"), reverse=True):
        text = path.read_text(encoding="utf-8")
        title_match = re.search(r"# 决策[：:](.+)", text)
        date_match = re.search(r"\*\*日期\*\*[：:]\s*(\d{4}-\d{2}-\d{2})", text)
        topic_match = re.search(r"\*\*主题\*\*[：:]\s*(.+)", text)
        
        decisions.append({
            "file": path.name,
            "title": (title_match.group(1).strip() if title_match else path.stem),
            "date": (date_match.group(1) if date_match else ""),
            "topic": (topic_match.group(1).strip() if topic_match else ""),
        })
        if len(decisions) >= limit:
            break
    return decisions


# ─────────────────────────── 同步任务 ───────────────────────────


def sync_project_summary(context: dict[str, Any]) -> None:
    """同步项目概要到 .human/overview/project-summary.md。"""
    summary = context.get("summary", "暂无项目摘要")
    key_facts = context.get("key_facts", [])
    open_actions = context.get("open_actions", [])
    metrics = context.get("metrics", {})
    
    key_facts_md = "\n".join(f"- {fact}" for fact in key_facts[:5])
    actions_md = "\n".join(f"- {action}" for action in open_actions[:8])
    
    content = f"""# 项目概要

<!-- AGENT_SYNCED: {now()[:10]} -->

## 一句话

{summary}

## 当前状态

| 指标 | 数值 |
|------|------|
| 活跃计划 | {metrics.get('active_plans', 0)} 个 |
| 待办事项 | {len(open_actions)} 项 |
| 已完成决策 | {metrics.get('total_decisions', 0)} 个 |
| 系统健康 | ✅ 正常 |

## 关键事实

{key_facts_md}

## 待办事项

{actions_md}

---

*最后同步：{now()[:10]} | 同步者：Agent*
"""
    write_file(HUMAN_GEN_DIR / "overview" / "project-summary.md", content)


def sync_current_plans() -> None:
    """同步当前计划到 .human/overview/current-plans.md。"""
    active = list_plans("active")
    pending = list_plans("pending")
    completed = list_plans("completed")
    
    def render_plan(plan: dict[str, Any]) -> str:
        bar_len = 20
        filled = round(plan["progress"] / 100 * bar_len)
        bar = "█" * filled + "░" * (bar_len - filled)
        status_emoji = {"active": "🟢", "pending": "⏸️", "completed": "✅", "blocked": "🔴"}.get(plan["status"], "⚪")
        return f"""### {status_emoji} {plan['id']}: {plan['title']}

| 属性 | 内容 |
|------|------|
| **状态** | {plan['status']} |
| **优先级** | {plan['priority']} |
| **进度** | {bar} {plan['progress']}% ({plan['done_screws']}/{plan['total_screws']} 螺丝) |
| **标签** | {', '.join(plan['tags']) or '无'} |
"""
    
    active_md = "\n\n".join(render_plan(p) for p in active) if active else "暂无活跃计划。"
    pending_md = "\n\n".join(render_plan(p) for p in pending) if pending else "暂无等待中的计划。"
    completed_md = "\n\n".join(render_plan(p) for p in completed[:3]) if completed else "暂无已完成的计划。"
    
    content = f"""# 当前活跃计划

<!-- AGENT_SYNCED: {now()[:10]} -->

## 活跃中 🟢

{active_md}

---

## 等待中 ⏸️

{pending_md}

---

## 最近完成 ✅

{completed_md}

---

## 计划统计

| 状态 | 数量 |
|------|------|
| 🟢 活跃 | {len(active)} |
| ⏸️ 等待 | {len(pending)} |
| ✅ 完成 | {len(completed)} |
| 📊 总计 | {len(active) + len(pending) + len(completed)} |

---

*最后同步：{now()[:10]} | 同步者：Agent*
"""
    write_file(HUMAN_GEN_DIR / "overview" / "current-plans.md", content)


def sync_decisions_summary() -> None:
    """同步决策摘要到 .human/overview/decisions-summary.md。"""
    decisions = list_decisions(limit=5)
    
    if not decisions:
        decisions_md = "暂无决策记录。"
    else:
        items = []
        for i, d in enumerate(decisions, 1):
            items.append(f"""### #{i} — {d['title']}

- **日期**: {d['date'] or '未知'}
- **主题**: {d['topic'] or d['title']}
""")
        decisions_md = "\n---\n\n".join(items)
    
    content = f"""# 近期决策摘要

<!-- AGENT_SYNCED: {now()[:10]} -->

## 最近 {len(decisions)} 个决策

{decisions_md}

---

## 查看完整决策

如需查看完整决策记录，询问 Agent 或查看 `.agent/memory/decisions/`。

---

*最后同步：{now()[:10]} | 同步者：Agent*
"""
    write_file(HUMAN_GEN_DIR / "overview" / "decisions-summary.md", content)


def sync_dashboard(context: dict[str, Any]) -> None:
    """刷新 HTML 仪表板产物。"""
    active = list_plans("active")
    pending = list_plans("pending")
    completed = list_plans("completed")
    decisions = list_decisions(limit=10)
    
    dashboard_data = {
        "lastSync": now(),
        "projectSummary": context.get("summary", ""),
        "metrics": {
            "activePlans": len(active),
            "pendingPlans": len(pending),
            "completedPlans": len(completed),
            "totalDecisions": context.get("metrics", {}).get("total_decisions", 0),
            "openActions": len(context.get("open_actions", [])),
        },
        "activePlans": active,
        "recentDecisions": decisions,
        "systemHealth": "normal",
    }
    
    dashboard_path = HUMAN_GEN_DIR / "dashboard.html"
    template_path = PROJECT_ROOT / ".agent" / "templates" / "dashboard.html"
    
    # 优先使用模板，否则尝试更新现有文件
    if template_path.exists():
        html = template_path.read_text(encoding="utf-8")
    elif dashboard_path.exists():
        html = dashboard_path.read_text(encoding="utf-8")
    else:
        print(f"  ⚠ 仪表板模板不存在，跳过 HTML 更新")
        return
    
    data_script = f"""<script id="agent-data" type="application/json">
{json.dumps(dashboard_data, indent=2, ensure_ascii=False)}
</script>"""
    
    if '<script id="agent-data"' in html:
        html = re.sub(
            r'<script id="agent-data" type="application/json">.*?</script>',
            data_script,
            html,
            flags=re.DOTALL
        )
    else:
        html = html.replace("</head>", f"{data_script}\n</head>")
    
    write_file(dashboard_path, html)


def sync_data_json(context: dict[str, Any]) -> None:
    """生成供 view.py 读取的 data.json。"""
    active = list_plans("active")
    pending = list_plans("pending")
    completed = list_plans("completed")
    decisions = list_decisions(limit=10)
    
    data = {
        "lastSync": now(),
        "projectSummary": context.get("summary", ""),
        "metrics": {
            "activePlans": len(active),
            "pendingPlans": len(pending),
            "completedPlans": len(completed),
            "totalDecisions": context.get("metrics", {}).get("total_decisions", 0),
            "openActions": len(context.get("open_actions", [])),
        },
        "activePlans": active,
        "recentDecisions": decisions,
        "systemHealth": "normal",
    }
    
    write_file(HUMAN_GEN_DIR / "data.json", json.dumps(data, indent=2, ensure_ascii=False))


# ─────────────────────────── 主函数 ───────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(description="Agent → 人类 同步脚本")
    parser.add_argument("--summary", action="store_true", help="仅同步概览 Markdown")
    parser.add_argument("--dashboard", action="store_true", help="仅刷新 HTML 仪表板")
    parser.add_argument("--data", action="store_true", help="仅生成 data.json")
    parser.add_argument("--dry-run", action="store_true", help="试运行，不写入文件")
    args = parser.parse_args()
    
    print("=" * 50)
    print("Agent → 人类 同步开始")
    print("=" * 50)
    
    context = read_json(AGENT_DIR / "memory" / "project-context.json")
    
    do_all = not (args.summary or args.dashboard or args.data)
    
    if args.summary or do_all:
        print("\n📄 同步概览 Markdown...")
        sync_project_summary(context)
        sync_current_plans()
        sync_decisions_summary()
    
    if args.data or do_all:
        print("\n📦 生成 data.json...")
        sync_data_json(context)
    
    if args.dashboard or do_all:
        print("\n📊 刷新 HTML 仪表板...")
        sync_dashboard(context)
    
    # 更新上下文中的同步时间
    if not args.dry_run:
        context.setdefault("metrics", {})
        context["metrics"]["last_sync"] = now()
        context["last_updated"] = now()
        context["updated_by"] = "agent_sync"
        
        sync_file = AGENT_DIR / "memory" / "project-context.json"
        sync_file.write_text(
            json.dumps(context, indent=2, ensure_ascii=False),
            encoding="utf-8"
        )
        print(f"  ✓ 更新同步时间戳")
    
    print("\n" + "=" * 50)
    print("同步完成 ✅")
    print("=" * 50)
    print("\n人类可以通过以下命令查看结果：")
    print("  ./cli status")


if __name__ == "__main__":
    main()
