# -*- coding: utf-8 -*-
"""Merge colleague (wjy) modules into user prototype. Keep ★（1）考试项目 HTML intact."""
from __future__ import print_function
import io
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
MERGE = os.path.join(ROOT, "_merge_from_wjy")
INDEX = os.path.join(ROOT, "index.html")
CSS = os.path.join(ROOT, "css", "common.css")
OUT_JS = os.path.join(ROOT, "js", "wjy-modules.js")
APP_JS = os.path.join(ROOT, "js", "app.js")
WJY_ROOT = os.path.join(os.path.dirname(ROOT), "wjy-考试系统标星功能原型")


def read(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()


def write(path, text):
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def find_under(root, filename):
    for dirpath, _, files in os.walk(root):
        if filename in files:
            return os.path.join(dirpath, filename)
    return None


def main():
    sections = [
        ("scheme", "考核方案"),
        ("answerSheet", "答题卡"),
        ("ocr", "OCR"),
        ("analysis", "分析"),
        ("permission", "权限"),
        ("bankApply", "建库"),
        ("qTag", "动态标签"),
        ("paperDup", "查重"),
    ]
    parts = []
    for name, title in sections:
        html = read(os.path.join(MERGE, name + ".html")).strip()
        parts.append(
            "      <!-- ========== %s（融合自同事原型） ========== -->\n      %s\n"
            % (title, html)
        )
    modules_html = "\n".join(parts)

    index = read(INDEX)
    m = re.search(
        r"\n\s*<!-- ========== 考核方案 ========== -->[\s\S]*?(?=\n\s*<div class=\"footer-note\")",
        index,
    )
    if not m:
        # already merged once?
        m = re.search(
            r"\n\s*<!-- ========== 考核方案（融合自同事原型） ========== -->[\s\S]*?(?=\n\s*<div class=\"footer-note\")",
            index,
        )
    if not m:
        raise SystemExit("Could not find module block in index.html")
    index = index[: m.start()] + "\n\n" + modules_html + "\n" + index[m.end() :]

    modals = read(os.path.join(MERGE, "modals.html")).strip()
    # ensure each top-level modal is indented with 2 spaces
    modal_lines = []
    for line in modals.splitlines():
        if line.startswith("<div class=\"modal-mask\""):
            modal_lines.append("  " + line)
        elif line.startswith("</div>") and len(line.strip()) == 6:
            modal_lines.append("  " + line)
        else:
            modal_lines.append("    " + line if not line.startswith("  ") else line)
    modals = "\n".join(modal_lines)

    for mid in (
        "modalDupEdit",
        "modalHistory",
        "modalFixTag",
        "modalRoleEdit",
        "modalBankAdd",
        "modalDupLocate",
        "modalBankDetail",
        "modalBankFlow",
    ):
        index = re.sub(
            r"\n\s*<div class=\"modal-mask\" id=\"%s\">[\s\S]*?</div>\s*(?=\n\s*<div class=\"modal-mask\"|\n\s*<script|\n\s*<!-- 同事)"
            % mid,
            "\n",
            index,
            count=1,
        )

    if "modalRoleEdit" not in index:
        index = re.sub(
            r"(\n\s*<script src=\"js/app\.js\")",
            "\n\n  <!-- 同事模块弹窗（方案/权限/建库/查重等） -->\n"
            + modals
            + r"\n\1",
            index,
            count=1,
        )

    if 'src="js/wjy-modules.js"' not in index:
        index = index.replace(
            '<script src="js/app.js"></script>\n  <script src="js/enhance.js"></script>',
            '<script src="js/app.js"></script>\n  <script src="js/wjy-modules.js"></script>',
        )
        index = index.replace(
            '<script src="js/app.js"></script>\n  <script src="js/wjy-modules.js"></script>\n  <script src="js/enhance.js"></script>',
            '<script src="js/app.js"></script>\n  <script src="js/wjy-modules.js"></script>',
        )

    index = index.replace(
        'data-page="analysis"><span class="star">★</span>试卷成绩分析</button>',
        'data-page="analysis"><span class="star">★</span>试卷分析</button>',
    )

    write(INDEX, index)
    print("OK index.html")

    src = find_under(WJY_ROOT, "app.js")
    if not src:
        raise SystemExit("colleague app.js not found under " + WJY_ROOT)
    print("colleague app found")
    wjy = read(src)
    marker = "  window.runDupCheck = function () {"
    idx = wjy.find(marker)
    if idx < 0:
        raise SystemExit("runDupCheck marker not found")
    body = wjy[idx:].replace('  showPage("home");\n', "")

    header = """/* 同事模块脚本（考核方案/答题卡/OCR/分析/权限/建库/标签/查重）
 * 已去掉与考试项目冲突的 showPage/导航；考试项目由宿主 app.js 负责。
 */
(function () {
  \"use strict\";

  if (typeof window.openModal !== \"function\") {
    window.openModal = function (id) {
      var m = document.getElementById(id);
      if (m) m.classList.add(\"show\");
    };
  }
  if (typeof window.closeModal !== \"function\") {
    window.closeModal = function (id) {
      var m = document.getElementById(id);
      if (m) m.classList.remove(\"show\");
    };
  }
  if (typeof window.toast !== \"function\") {
    window.toast = function (msg) {
      var el = document.getElementById(\"toast\");
      if (!el) {
        el = document.createElement(\"div\");
        el.id = \"toast\";
        el.style.cssText = \"position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:4px;z-index:2000;font-size:13px;\";
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.display = \"block\";
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(function () { el.style.display = \"none\"; }, 2000);
    };
  }

"""
    if not body.rstrip().endswith("})();"):
        raise SystemExit("unexpected colleague app.js ending")
    body = body.rstrip()[:-5]
    body += """
  window.__wjyShowPageHook = function (id) {
    try {
      if (id === \"ocr\") renderOcrAnswerKey();
      if (id === \"answerSheet\") updateSheetStructHint();
      if (id === \"permission\") { renderRoles(); renderBankMembers(); }
      if (id === \"bankApply\") { renderBankApplyRecords(); renderCreatedBanks(); }
      if (id === \"qTag\") renderQTagTable();
      if (id === \"scheme\" && typeof recalcSchemeRatios === \"function\") recalcSchemeRatios();
      if (id === \"paperDup\" && typeof bindDupBankChecks === \"function\") bindDupBankChecks();
    } catch (e) { console.warn(\"wjy page hook\", e); }
  };
})();
"""
    write(OUT_JS, header + body)
    print("OK", OUT_JS)

    # CSS
    user_css = read(CSS)
    wjy_css_path = find_under(WJY_ROOT, "common.css")
    wjy_css = read(wjy_css_path) if wjy_css_path else ""
    if "融合自同事原型" not in user_css:
        add = [
            "\n\n/* ===== 融合自同事原型（课程/题卡/分析/题库） ===== */\n",
            ".dup-bank-list { display:flex; flex-direction:column; gap:8px; max-height:180px; overflow:auto; border:1px solid #e8e8e8; padding:10px; border-radius:4px; background:#fafafa; }\n",
            ".dup-bank-item { display:flex; align-items:center; gap:8px; font-size:13px; }\n",
            ".dup-bank-item input { width:auto; }\n",
            ".flex-hd { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }\n",
            ".task-link-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }\n",
            "@media (max-width:1100px){ .task-link-grid { grid-template-columns:1fr; } }\n",
            ".task-link-item { border:1px solid #e8e8e8; border-radius:6px; padding:12px; background:#fff; }\n",
            ".task-link-item.on { border-color:#91caff; background:#e6f4ff; }\n",
            ".task-link, .task-link-item.off { border-color:#e8e8e8; background:#f5f5f5; opacity:.75; }\n",
            ".task-title { font-weight:600; font-size:13px; }\n",
            ".task-desc { font-size:12px; color:#666; margin-top:4px; }\n",
            ".task-status { font-size:12px; color:#1677ff; margin-top:6px; }\n",
            ".task-link-item.off .task-status { color:#999; }\n",
            ".normal-chart-wrap { background:#fff; }\n",
            ".flow-node.done-node { border-color:#b7eb8f; background:#f6ffed; }\n",
            ".flow-node.active-node { border-color:#1677ff; background:#e6f4ff; }\n",
            ".flow-node.reject-node { border-color:#ffa39e; background:#fff1f0; }\n",
        ]
        # fix typo line
        add[9] = ".task-link-item.off { border-color:#e8e8e8; background:#f5f5f5; opacity:.75; }\n"
        write(CSS, user_css.rstrip() + "\n" + "".join(add))
        print("OK css")
    else:
        print("css already merged")

    app = read(APP_JS)
    if "__wjyShowPageHook" not in app:
        app2 = app.replace(
            '    if (id === "qTag") renderQuestions();\n'
            '    if (id === "bankApply") renderBankApplies();\n'
            '    if (id === "permission") { renderRoles(); renderBankMembers(); }\n'
            "  }",
            '    /* 课程/题库等模块由 wjy-modules.js 接管 */\n'
            '    if (typeof window.__wjyShowPageHook === "function") window.__wjyShowPageHook(id);\n'
            "  }",
        )
        if app2 == app:
            # insert before end of showPage
            app2 = app.replace(
                '    if (id === "projectCreate") renderFlowNodes();\n',
                '    if (id === "projectCreate") renderFlowNodes();\n'
                '    if (typeof window.__wjyShowPageHook === "function") window.__wjyShowPageHook(id);\n',
            )
        write(APP_JS, app2)
        print("OK app.js hook")
    else:
        print("app.js already hooked")

    # Disable enhance.js collisions by renaming if still referenced — already removed from index
    print("DONE")


if __name__ == "__main__":
    main()
