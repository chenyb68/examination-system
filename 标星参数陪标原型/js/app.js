(function () {
  "use strict";

  /* ========== 工具 ========== */
  function $(id) { return document.getElementById(id); }
  function today() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }
  function statusTag(status) {
    var map = {
      "草稿": "tag-gray",
      "待发放": "tag-purple",
      "处理中": "tag-blue",
      "待审核": "tag-orange",
      "已完成": "tag-green",
      "已归档": "tag-green",
      "已驳回": "tag-red",
      "待处理": "tag-orange",
      "已通过": "tag-green",
      "审批中": "tag-orange",
      "进行中": "tag-blue"
    };
    return '<span class="tag ' + (map[status] || "tag-gray") + '">' + status + "</span>";
  }

  window.toast = function (msg) {
    var el = $("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.style.cssText =
        "position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:4px;z-index:2000;font-size:13px;max-width:80%;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(function () { el.style.display = "none"; }, 2000);
  };

  window.openModal = function (id) {
    var m = $(id);
    if (m) m.classList.add("show");
  };
  window.closeModal = function (id) {
    var m = $(id);
    if (m) m.classList.remove("show");
  };

  /* ========== 数据 ========== */
  var projectTypes = [
    { name: "命题方案", desc: "线上化命题与存档" },
    { name: "考试分析", desc: "考试分析线上处理" },
    { name: "考核方案", desc: "课程考核方案填报" },
    { name: "材料归档", desc: "考核材料电子归档" }
  ];

  var projects = [
    { id: "KP2026001", name: "2026春·高等数学期末命题", type: "命题方案", audit: true, issue: "手动发放", issued: true, auditPassed: false, status: "处理中", creator: "张管理", updated: "2026-03-12", desc: "用于高等数学期末命题方案线上填报、审核与存档。", handlers: ["赵老师 · 高等数学01班", "钱老师 · 高等数学02班"] },
    { id: "KP2026002", name: "大学英语形成性考核方案", type: "考核方案", audit: true, issue: "自动·开课即发布", issued: true, auditPassed: false, status: "待审核", creator: "李管理", updated: "2026-03-10", desc: "形成性考核方案填报。", handlers: [] },
    { id: "KP2026003", name: "程序设计课程考试分析", type: "考试分析", audit: false, issue: "未发放", issued: false, auditPassed: false, status: "待发放", creator: "王管理", updated: "2026-03-08", desc: "考试分析线上处理（示例：未开启审批）。", handlers: [] },
    { id: "KP2026004", name: "大学物理实验考核方案", type: "考核方案", audit: true, issue: "未发放", issued: false, auditPassed: false, status: "待发放", creator: "赵管理", updated: "2026-03-09", desc: "示例待发放项目，便于多选批量发放演示。", handlers: [] },
    { id: "KP2025099", name: "2025秋·线性代数期末归档包", type: "材料归档", audit: true, issue: "—", issued: true, auditPassed: true, status: "已归档", creator: "张管理", updated: "2025-12-20", desc: "归档材料包。", handlers: [] }
  ];

  var todos = [
    { id: "t1", kind: "process", task: "填报命题方案", projectId: "KP2026001", project: "2026春·高等数学期末命题", handler: "赵老师 · 高等数学01班", issueDate: "2026-03-12", due: "2026-03-25", status: "已完成", goto: "projectCreate" },
    { id: "t1b", kind: "process", task: "填报命题方案", projectId: "KP2026001", project: "2026春·高等数学期末命题", handler: "钱老师 · 高等数学02班", issueDate: "2026-03-12", due: "2026-03-25", status: "待处理", goto: "projectCreate" },
    { id: "t2", kind: "process", task: "填报考核方案", projectId: "KP2026002", project: "大学英语形成性考核方案", handler: "周老师 · 大学英语", issueDate: "2026-03-10", due: "2026-03-20", status: "已完成", goto: "scheme" },
    { id: "t3", kind: "audit", task: "审核考核方案", projectId: "KP2026002", project: "大学英语形成性考核方案", handler: "审核人", issueDate: "2026-03-13", due: "2026-03-18", status: "待审核", goto: "projectAudit", auditId: "a2" }
  ];

  var audits = [
    { id: "a2", projectId: "KP2026002", project: "大学英语形成性考核方案", submitter: "周老师", node: "学院教务审核", rule: "任意一人通过即流转", done: 0, total: 3 }
  ];

  var archivePackages = [
    {
      projectId: "KP2025099",
      name: "2025秋·线性代数期末归档包",
      course: "线性代数",
      term: "2025秋",
      files: [
        { name: "线性代数考核方案_终版.pdf", type: "考核方案", term: "2025秋", date: "2025-12-18" },
        { name: "线性代数期末A卷.docx", type: "试卷", term: "2025秋", date: "2025-12-18" },
        { name: "线性代数期末B卷.docx", type: "试卷", term: "2025秋", date: "2025-12-18" },
        { name: "线性代数答卷扫描包.zip", type: "答卷", term: "2025秋", date: "2025-12-19" },
        { name: "线性代数成绩单.xlsx", type: "成绩单", term: "2025秋", date: "2025-12-20" },
        { name: "线性代数考试总结.docx", type: "总结材料", term: "2025秋", date: "2025-12-20" }
      ]
    },
    {
      projectId: "KP2025088",
      name: "2025秋·高等数学期末归档包",
      course: "高等数学",
      term: "2025秋",
      files: [
        { name: "高等数学考核方案_终版.pdf", type: "考核方案", term: "2025秋", date: "2025-12-18" },
        { name: "高等数学期末A卷.docx", type: "试卷", term: "2025秋", date: "2025-12-18" },
        { name: "高等数学答卷扫描包", type: "答卷", term: "2025秋", date: "2025-12-19" },
        { name: "高等数学成绩单.xlsx", type: "成绩单", term: "2025秋", date: "2025-12-20" },
        { name: "高等数学考试总结.docx", type: "总结材料", term: "2025秋", date: "2025-12-20" }
      ]
    },
    {
      projectId: "KP2025077",
      name: "2025秋·大学英语归档包",
      course: "大学英语",
      term: "2025秋",
      files: [
        { name: "大学英语考核方案.pdf", type: "考核方案", term: "2025秋", date: "2025-12-15" },
        { name: "大学英语期末试卷.docx", type: "试卷", term: "2025秋", date: "2025-12-16" },
        { name: "大学英语成绩单.xlsx", type: "成绩单", term: "2025秋", date: "2025-12-17" }
      ]
    }
  ];

  var flowNodes = [
    { id: "n1", title: "课程负责人", approver: "赵老师", sign: "需要", multi: "", count: 1 },
    { id: "n2", title: "教研室主任", approver: "同级多人", sign: "需要", multi: "需全员通过才流转", count: 2 },
    { id: "n3", title: "学院教务", approver: "教务办", sign: "可选", multi: "", count: 1 }
  ];

  var currentArchiveProjectId = "KP2025099";
  var currentAuditFocusId = "";
  var currentIssueProjectId = "KP2026003";
  var selectedIssueProjectIds = ["KP2026003"];
  var currentSuperviseProjectId = "";
  var nextTodoNo = 10;
  var nextAuditNo = 3;
  var nextFlowNo = 4;

  var questions = [
    { id: "Q10021", stem: "求极限 lim…", status: "在用", times: 12, rate: "88%", diff: "易", actual: "偏易 (0.88)", actualClass: "tag-blue", kp: "极限" },
    { id: "Q10088", stem: "讨论级数敛散性…", status: "在用", times: 7, rate: "41%", diff: "中", actual: "偏难 (0.41)", actualClass: "tag-red", kp: "级数" },
    { id: "Q10102", stem: "证明中值定理应用…", status: "闲置", times: 0, rate: "—", diff: "难", actual: "暂无数据", actualClass: "tag-gray", kp: "中值定理" },
    { id: "Q10055", stem: "计算二重积分…", status: "本学期已用", times: 3, rate: "63%", diff: "中", actual: "接近标定 (0.63)", actualClass: "tag-gold", kp: "积分" }
  ];

  var bankApplies = [
    { id: "BK2026008", course: "高等数学", kind: "课程题库", qty: 800, status: "已通过", result: "已按参数自动建库" },
    { id: "BK2026009", course: "公共基础综合库", kind: "综合题库", qty: 2000, status: "审批中", result: "—" }
  ];

  var roles = [
    { name: "系统管理员", desc: "全系统配置与运维", count: 2 },
    { name: "部门管理员", desc: "本学院考试项目与督导", count: 6 },
    { name: "课程管理员", desc: "课程考核方案与题库管理", count: 28 }
  ];

  var bankMembers = [
    { name: "赵老师", role: "题库管理员", access: true },
    { name: "钱老师", role: "成员", access: true },
    { name: "外来教师甲", role: "非成员", access: false }
  ];

  var schemeHistory = [
    { ver: "V3（当前）", time: "2026-03-10", scoreType: "分数制", weight: "40%", current: true },
    { ver: "V2", time: "2025-09-01", scoreType: "分数制", weight: "30%", current: false },
    { ver: "V1", time: "2025-02-20", scoreType: "等级制", weight: "40%", current: false }
  ];

  var nextProjNo = 5;
  var nextBankNo = 10;

  /* ========== 路由 ========== */
  var titleMap = {
    home: "功能总览（标星参数对照）",
    projectList: "考试项目列表 ★（1）",
    projectCreate: "考核项目创建 ★",
    projectIssue: "考核项目发放 ★",
    projectAudit: "考核项目审核 ★",
    projectSupervise: "考核项目进度督导 ★",
    projectArchive: "考核项目材料归档 ★",
    scheme: "考核方案管理 ★②",
    answerSheet: "自动生成答题卡 ★②",
    ocr: "OCR手写体识别 ★",
    analysis: "试卷 / 成绩分析 ★",
    permission: "权限控制 ★（4）",
    bankApply: "建库申请 ★（8）",
    qTag: "试题动态标签管理 ★",
    paperDup: "试卷查重 ★（10）"
  };

  function showPage(id) {
    document.querySelectorAll(".page").forEach(function (p) {
      p.classList.toggle("active", p.id === "page-" + id);
    });
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.classList.toggle("active", n.getAttribute("data-page") === id);
    });
    var t = $("pageTitle");
    if (t) t.textContent = titleMap[id] || id;
    if (id === "projectList") renderProjects();
    if (id === "projectIssue") { renderPendingIssueList(); syncIssuePanel(); renderTodos(); }
    if (id === "projectAudit") renderAudits();
    if (id === "projectArchive") renderArchives();
    if (id === "projectSupervise") renderSupervise();
    if (id === "projectCreate") renderFlowNodes();
    /* 课程/题库等模块由 wjy-modules.js 接管 */
    if (typeof window.__wjyShowPageHook === "function") window.__wjyShowPageHook(id);
  }

  function isTodoDone(t) {
    return !t || t.status === "已完成";
  }

  /** 项目下未完成的处理人/待办（已完成不可催办） */
  function getUrgeableTodos(projectId) {
    return todos.filter(function (t) {
      return t.projectId === projectId && !isTodoDone(t);
    });
  }

  function urgeProjectHandlers(projectId, silent) {
    var p = findProject(projectId);
    if (!p) return { ok: false, count: 0 };
    var open = getUrgeableTodos(projectId);
    if (!open.length) {
      if (!silent) toast("「" + p.name + "」没有未完成人员，已完成的老师不可催办");
      return { ok: false, count: 0 };
    }
    var names = open.map(function (t) {
      return (t.handler || "处理人") + (t.task ? "（" + t.task + "）" : "");
    });
    if (!silent) {
      toast("已催办未完成人员 " + open.length + " 人：" + names.join("、"));
    }
    return { ok: true, count: open.length, names: names };
  }

  function urgeOneHandler(todoId) {
    var t = todos.find(function (x) { return x.id === todoId; });
    if (!t) {
      toast("未找到对应待办");
      return false;
    }
    if (isTodoDone(t)) {
      toast((t.handler || "该老师") + "已完成，不可再催办");
      return false;
    }
    toast("已催办：" + (t.handler || "处理人") + " · " + t.task + "（" + (t.project || "") + "）");
    return true;
  }

  function renderSuperviseDetail(projectId) {
    currentSuperviseProjectId = projectId || "";
    var p = findProject(projectId);
    var tip = $("superviseDetailTip");
    var body = $("superviseDetailBody");
    if (!body) return;
    if (!p) {
      if (tip) {
        tip.style.display = "block";
        tip.textContent = "未找到项目";
      }
      body.innerHTML = '<tr><td colspan="6" class="hint">无数据</td></tr>';
      return;
    }
    if (tip) {
      tip.style.display = "block";
      tip.textContent = "项目：" + p.name + "（" + p.id + "）· 状态 " + p.status +
        " · 仅未完成人员可催办，已完成显示为不可催办";
    }

    var list = todos.filter(function (t) { return t.projectId === projectId; });
    // 若有发放对象但尚无待办记录，按 handlers 补一行展示
    if (!list.length && p.handlers && p.handlers.length) {
      list = p.handlers.map(function (h, i) {
        return {
          id: "_h" + i,
          handler: h,
          task: "待发放后生成",
          status: "未开始",
          issueDate: "—",
          kind: "process",
          _virtual: true
        };
      });
    }
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="6" class="hint">暂无处理人待办记录</td></tr>';
      return;
    }

    body.innerHTML = list.map(function (t) {
      var done = isTodoDone(t) || (!!t._virtual && p.status === "已完成");
      var overdue = !done && !t._virtual && t.kind !== "audit";
      var ops;
      if (done) {
        ops = '<span class="hint">已完成，不可催办</span>';
      } else if (t._virtual) {
        ops = '<span class="hint">尚未生成待办</span>';
      } else {
        ops = '<button class="btn-link" type="button" data-sup-detail-urge="' + t.id + '">催办</button>';
      }
      return (
        "<tr><td>" + (t.handler || "—") + "</td><td>" + (t.task || "—") +
        "</td><td>" + statusTag(t.status) +
        "</td><td>" + (t.issueDate || "—") +
        "</td><td>" + (done ? "否" : (overdue ? '<span class="tag tag-red">是</span>' : "否")) +
        '</td><td class="ops">' + ops + "</td></tr>"
      );
    }).join("");
  }

  function renderSupervise() {
    var body = $("superviseBody");
    if (!body) return;
    var active = projects.filter(function (p) {
      return p.status === "处理中" || p.status === "待审核" || p.status === "待发放";
    });
    var doneCnt = projects.filter(function (p) {
      return p.status === "已完成" || p.status === "已归档";
    }).length;
    var openTodoCnt = todos.filter(function (t) { return !isTodoDone(t); }).length;
    var rate = projects.length ? Math.round(doneCnt / projects.length * 100) : 0;
    if ($("supStatDoing")) $("supStatDoing").textContent = String(active.length);
    if ($("supStatRate")) $("supStatRate").textContent = rate + "%";
    if ($("supStatOverdue")) $("supStatOverdue").textContent = String(openTodoCnt);

    var rows = projects.filter(function (p) { return p.status !== "已归档" && p.status !== "草稿"; });
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="6" class="hint">暂无需要督导的项目</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (p) {
      var openList = getUrgeableTodos(p.id);
      var open = openList.length;
      var pct = p.status === "已完成" ? 100 : p.status === "待审核" ? 75 : p.status === "处理中" ? 40 : p.issued ? 20 : 0;
      var cls = pct >= 80 ? "ok" : pct >= 40 ? "warn" : "danger";
      return (
        "<tr><td>" + p.name + "<div class='hint'>" + p.id + "</div></td>" +
        "<td>" + statusTag(p.status) + "</td><td>" + open + "</td><td>" +
        (p.issued ? "已发放" : "未发放") + "</td>" +
        '<td><div class="progress ' + cls + '" style="width:120px"><i style="width:' + pct + '%"></i></div></td>' +
        '<td class="ops">' +
        (open
          ? '<button class="btn-link" data-sup-act="urge" data-id="' + p.id + '">催办</button>'
          : '<span class="hint" title="已完成人员不可催办">无需催办</span> ') +
        '<button class="btn-link" data-sup-act="detail" data-id="' + p.id + '">详情</button>' +
        "</td></tr>"
      );
    }).join("");
  }

  /** 关闭审批时清理审核残留 */
  function clearAuditArtifacts(projectId) {
    todos = todos.filter(function (t) {
      return !(t.projectId === projectId && t.kind === "audit");
    });
    audits = audits.filter(function (a) { return a.projectId !== projectId; });
  }

  /** 处理完成且无需审批：直接生效 */
  function markProjectCompleted(p, quiet) {
    if (!p) return;
    p.auditPassed = true;
    p.status = "已完成";
    p.updated = today();
    clearAuditArtifacts(p.id);
    if (!quiet) toast("项目未开启审批，已直接生效（已完成）");
  }

  /** 按待办/审批配置回写项目状态 */
  function refreshProjectStatus(projectId) {
    var p = findProject(projectId);
    if (!p) return;
    if (p.status === "已归档") return;
    if (p.status === "已驳回" && !p.issued) return;

    var openProcess = todos.filter(function (t) {
      return t.projectId === projectId && t.kind !== "audit" && t.status !== "已完成";
    });
    var finishedProcess = todos.some(function (t) {
      return t.projectId === projectId && t.kind !== "audit" && t.status === "已完成";
    });

    if (!p.issued) {
      if (p.status !== "草稿" && p.status !== "已驳回") p.status = "待发放";
      p.updated = today();
      return;
    }
    if (openProcess.length) {
      p.status = "处理中";
      if (p.audit) p.auditPassed = false;
      p.updated = today();
      return;
    }
    // 手动发放：处理待办被删且未完成过 → 撤销发放（不再自动重建待办）
    if (!finishedProcess && !p.auditPassed && !p.autoIssued) {
      p.issued = false;
      p.issue = "未发放";
      p.status = "待发放";
      p.updated = today();
      return;
    }
    // 未开启审批：处理完成或自动发放后直接完成
    if (!p.audit) {
      markProjectCompleted(p, true);
      return;
    }
    // 开启审批：未通过前进入待审核
    if (!p.auditPassed) {
      ensureAuditForProject(projectId, true);
      p.status = "待审核";
      p.updated = today();
      return;
    }
    p.status = "已完成";
    p.updated = today();
  }

  function syncAuditConfigUI() {
    var on = $("enableAudit") ? $("enableAudit").checked : true;
    if ($("auditConfig")) $("auditConfig").style.display = on ? "block" : "none";
    if ($("auditOffTip")) $("auditOffTip").style.display = on ? "none" : "block";
    if ($("auditHint")) {
      $("auditHint").textContent = on
        ? "开启后：处理完成进入「待审核」，须在审核页通过/驳回后才能变为已完成。"
        : "已关闭审批：处理完成或自动发放生效后直接「已完成」，不生成审核待办。";
    }
  }

  function canIssueProject(p) {
    if (!p) return { ok: false, reason: "请先从「项目列表」选择要发放的项目" };
    if (p.status === "已归档") return { ok: false, reason: "已归档项目不可发放" };
    if (p.status === "已完成") return { ok: false, reason: "已完成项目不可再次发放" };
    if (p.issued) return { ok: false, reason: "该项目已发放，不可重复发放" };
    if (p.status === "处理中" || p.status === "待审核") {
      return { ok: false, reason: "项目当前为「" + p.status + "」，不可重复发放" };
    }
    return { ok: true, reason: "" };
  }

  function getSelectedHandlers() {
    return Array.prototype.slice.call(document.querySelectorAll(".issue-handler-cb:checked"))
      .map(function (cb) { return cb.value; });
  }

  function syncHandlerSelectTip() {
    var tip = $("handlerSelectTip");
    if (!tip) return;
    var n = getSelectedHandlers().length;
    tip.textContent = n
      ? ("已选 " + n + " 位老师；确认后将对每个勾选项目 × 每位老师各生成一条待办")
      : "尚未勾选处理老师（手动发放时至少选一位）";
  }

  function pruneIssueSelection() {
    selectedIssueProjectIds = selectedIssueProjectIds.filter(function (id) {
      var p = findProject(id);
      if (!p) return false;
      return p.status === "待发放" || p.status === "已驳回" || p.status === "草稿" ||
        (!p.issued && p.status !== "已归档" && p.status !== "已完成");
    });
    currentIssueProjectId = selectedIssueProjectIds[0] || "";
    if ($("currentIssueProjectId")) $("currentIssueProjectId").value = currentIssueProjectId;
  }

  function getSelectedIssueProjects() {
    pruneIssueSelection();
    return selectedIssueProjectIds.map(findProject).filter(Boolean);
  }

  function isIssueSelected(pid) {
    return selectedIssueProjectIds.indexOf(pid) >= 0;
  }

  function setIssueSelection(ids, silent) {
    selectedIssueProjectIds = (ids || []).slice();
    pruneIssueSelection();
    syncIssuePanel();
    renderPendingIssueList();
    if (!silent) {
      var n = selectedIssueProjectIds.length;
      toast(n ? ("已选中 " + n + " 个待发放项目") : "已清空项目选择");
    }
  }

  function toggleIssueProject(pid, checked) {
    if (!pid) return;
    var idx = selectedIssueProjectIds.indexOf(pid);
    if (checked && idx < 0) selectedIssueProjectIds.push(pid);
    if (!checked && idx >= 0) selectedIssueProjectIds.splice(idx, 1);
    currentIssueProjectId = selectedIssueProjectIds[0] || "";
    if ($("currentIssueProjectId")) $("currentIssueProjectId").value = currentIssueProjectId;
    syncIssuePanel();
    renderPendingIssueList();
  }

  /** 从项目列表点「发放」：加入多选并聚焦 */
  function selectIssueProject(pid, silent) {
    if (!pid) {
      setIssueSelection([], silent);
      return;
    }
    if (!isIssueSelected(pid)) selectedIssueProjectIds.push(pid);
    currentIssueProjectId = pid;
    if ($("currentIssueProjectId")) $("currentIssueProjectId").value = pid;
    syncIssuePanel();
    renderPendingIssueList();
    if (!silent) {
      var p = findProject(pid);
      if (p) toast("已加入发放选择：" + p.name + "（当前共 " + selectedIssueProjectIds.length + " 个）");
    }
  }

  function renderSelectedIssueChips() {
    var box = $("selectedIssueChips");
    if (!box) return;
    var list = getSelectedIssueProjects();
    if (!list.length) {
      box.innerHTML = '<span class="hint">尚未勾选，请在上方列表勾选一个或多个项目</span>';
      return;
    }
    box.innerHTML = list.map(function (p) {
      return (
        '<span class="chip">' + p.name +
        ' <span class="hint">(' + p.id + ')</span>' +
        ' <button type="button" data-chip-remove="' + p.id + '" title="移除">×</button></span>'
      );
    }).join("");
  }

  /** 与项目列表联动：展示需要发放的项目（支持多选） */
  function renderPendingIssueList() {
    var body = $("pendingIssueBody");
    if (!body) return;
    pruneIssueSelection();
    var pending = projects.filter(function (p) {
      return p.status === "待发放" || p.status === "已驳回" || p.status === "草稿" ||
        (!p.issued && p.status !== "已归档" && p.status !== "已完成");
    });
    var tip = $("pendingIssueTip");
    if (tip) {
      tip.textContent = "共 " + pending.length + " 个待发放/可重发项目；已勾选 " +
        selectedIssueProjectIds.length + " 个。勾选后可批量确认发放。";
    }
    if (!pending.length) {
      body.innerHTML = '<tr><td colspan="9" class="hint">暂无待发放项目。请先在「项目列表」创建并保存为待发放。</td></tr>';
      if ($("pendingCheckAll")) $("pendingCheckAll").checked = false;
      renderSelectedIssueChips();
      return;
    }
    var allSelected = pending.every(function (p) { return isIssueSelected(p.id); });
    if ($("pendingCheckAll")) $("pendingCheckAll").checked = allSelected && pending.length > 0;
    body.innerHTML = pending.map(function (p) {
      var selected = isIssueSelected(p.id);
      return (
        '<tr class="' + (selected ? "row-selected" : "") + '" data-pending-id="' + p.id + '" style="cursor:pointer;">' +
        '<td><input type="checkbox" class="pending-issue-cb" data-id="' + p.id + '"' +
        (selected ? " checked" : "") + ' /></td>' +
        "<td>" + p.id + "</td><td>" + p.name + "</td><td>" + p.type + "</td>" +
        "<td>" + (p.audit ? '<span class="tag tag-green">开启</span>' : '<span class="tag tag-gray">关闭</span>') + "</td>" +
        "<td>" + statusTag(p.status) + "</td><td>" + (p.creator || "—") + "</td><td>" + (p.updated || "—") + "</td>" +
        '<td class="ops"><button class="btn-link" type="button" data-pending-act="toggle" data-id="' + p.id + '">' +
        (selected ? "取消勾选" : "勾选") + "</button>" +
        '<button class="btn-link" type="button" data-pending-act="viewList" data-id="' + p.id + '">在列表中查看</button></td></tr>'
      );
    }).join("");
    renderSelectedIssueChips();
  }

  function syncIssuePanel() {
    pruneIssueSelection();
    var list = getSelectedIssueProjects();
    var id = selectedIssueProjectIds[0] || "";
    currentIssueProjectId = id;
    if ($("currentIssueProjectId")) $("currentIssueProjectId").value = id || "";
    if ($("issueCardTitle")) {
      $("issueCardTitle").textContent = list.length
        ? ("发放设置 · 已选 " + list.length + " 个项目（可多选批量发放）")
        : "发放设置 · 请从上方勾选项目（可多选）";
    }
    renderSelectedIssueChips();
    syncHandlerSelectTip();
    var tip = $("issueStatusTip");
    var btn = $("btnConfirmIssue");
    if (!tip || !btn) return;
    tip.style.display = "block";
    if (!list.length) {
      tip.style.background = "#fff1f0";
      tip.style.borderColor = "#ffa39e";
      tip.style.color = "#cf1322";
      tip.textContent = "尚未勾选项目。请在上方「待发放项目」中勾选一个或多个。";
      btn.disabled = true;
      btn.textContent = "确认发放";
      return;
    }
    var okList = list.filter(function (p) { return canIssueProject(p).ok; });
    var badList = list.filter(function (p) { return !canIssueProject(p).ok; });
    if (!okList.length) {
      tip.style.background = "#fffbe6";
      tip.style.borderColor = "#ffe58f";
      tip.style.color = "#876800";
      tip.textContent = "已选 " + list.length + " 个项目均不可发放：" +
        badList.map(function (p) { return p.id + "（" + canIssueProject(p).reason + "）"; }).join("；");
      btn.disabled = true;
      btn.textContent = "不可发放";
      return;
    }
    tip.style.background = "#f6ffed";
    tip.style.borderColor = "#b7eb8f";
    tip.style.color = "#389e0d";
    tip.textContent = "将对 " + okList.length + " 个可发放项目批量执行" +
      (badList.length ? "（另有 " + badList.length + " 个将跳过）" : "") +
      "。手动发放：勾选多位处理老师；自动发放：按条件分别生效。";
    btn.disabled = false;
    btn.textContent = okList.length > 1 ? ("确认发放（" + okList.length + " 个）") : "确认发放";
  }

  /** 对单个项目执行发放（供批量调用） */
  function issueOneProject(p, isAuto, modeTxt, condText, handlers, note) {
    var check = canIssueProject(p);
    if (!check.ok) return { ok: false, reason: check.reason };
    var hasOpen = todos.some(function (t) {
      return t.projectId === p.id && t.kind !== "audit" && t.status !== "已完成";
    });
    if (hasOpen) return { ok: false, reason: "已有未完成处理待办" };

    p.issued = true;
    p.auditPassed = false;
    p.autoIssued = !!isAuto;
    p.issue = modeTxt;
    p.handlers = isAuto ? [] : handlers.slice();
    p.updated = today();

    if (isAuto) {
      todos = todos.filter(function (t) {
        return !(t.projectId === p.id && t.kind !== "audit");
      });
      if (p.audit) {
        p.status = "待审核";
        ensureAuditForProject(p.id, true);
      } else {
        markProjectCompleted(p, true);
      }
    } else {
      p.status = "处理中";
      var gotoPage = p.type === "考核方案" ? "scheme" : "projectCreate";
      handlers.slice().reverse().forEach(function (h) {
        todos.unshift({
          id: "t" + nextTodoNo++,
          kind: "process",
          task: "填报/处理" + p.type,
          projectId: p.id,
          project: p.name,
          handler: h,
          note: note,
          issueDate: today(),
          due: today(),
          status: "待处理",
          goto: gotoPage
        });
      });
    }
    return { ok: true };
  }

  /* ========== 项目列表 ========== */
  function renderProjects() {
    var kw = ($("projSearch") && $("projSearch").value || "").trim();
    var st = $("projFilterStatus") ? $("projFilterStatus").value : "";
    var tp = $("projFilterType") ? $("projFilterType").value : "";
    var list = projects.filter(function (p) {
      if (kw && p.name.indexOf(kw) < 0 && p.id.indexOf(kw) < 0) return false;
      if (st && p.status !== st) return false;
      if (tp && p.type !== tp) return false;
      return true;
    });
    var tip = $("projFilterTip");
    if (tip) tip.textContent = "共 " + list.length + " / " + projects.length + " 条";
    // 发放页待发放清单与项目列表同步
    if ($("pendingIssueBody")) renderPendingIssueList();
    var body = $("projectListBody");
    if (!body) return;
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="9" class="hint">无匹配项目，请调整筛选条件</td></tr>';
      return;
    }
    body.innerHTML = list.map(function (p) {
      var ops = [];
      if (p.status === "已归档") {
        ops.push('<button class="btn-link" data-act="viewArchive" data-id="' + p.id + '">查看归档</button>');
        ops.push('<button class="btn-link" data-act="unarchive" data-id="' + p.id + '">撤销归档</button>');
        ops.push('<button class="btn-link" data-act="view" data-id="' + p.id + '">查询</button>');
      } else if (p.status === "已完成") {
        ops.push('<button class="btn-link" data-act="archive" data-id="' + p.id + '">归档</button>');
        ops.push('<button class="btn-link" data-act="view" data-id="' + p.id + '">查询</button>');
        ops.push('<button class="btn-link" data-act="del" data-id="' + p.id + '">删除</button>');
      } else {
        if (p.status === "草稿" || p.status === "待发放" || p.status === "已驳回") {
          ops.push('<button class="btn-link" data-act="edit" data-id="' + p.id + '">编辑</button>');
        }
        if (!p.issued && p.status !== "已归档") {
          ops.push('<button class="btn-link" data-act="gotoIssue" data-id="' + p.id + '">发放</button>');
        } else {
          ops.push('<button class="btn-link" data-act="gotoIssue" data-id="' + p.id + '">查看发放</button>');
        }
        if (p.audit && (p.status === "待审核" || p.status === "处理中")) {
          ops.push('<button class="btn-link" data-act="gotoAudit" data-id="' + p.id + '">审核</button>');
        }
        if (p.status === "处理中") {
          ops.push('<button class="btn-link" data-act="edit" data-id="' + p.id + '">查看</button>');
        }
        ops.push('<button class="btn-link" data-act="del" data-id="' + p.id + '">删除</button>');
      }
      return (
        "<tr>" +
        "<td>" + p.id + "</td>" +
        "<td>" + p.name + "</td>" +
        "<td>" + p.type + "</td>" +
        "<td>" + (p.audit
          ? '<span class="tag tag-green">开启审批</span>'
          : '<span class="tag tag-gray">无需审批</span>') + "</td>" +
        "<td>" + (p.issue || "未发放") + "</td>" +
        "<td>" + statusTag(p.status) + "</td>" +
        "<td>" + p.creator + "</td>" +
        "<td>" + p.updated + "</td>" +
        '<td class="ops">' + ops.join("") + "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function findProject(id) {
    for (var i = 0; i < projects.length; i++) if (projects[i].id === id) return projects[i];
    return null;
  }

  function fillTypeSelect(selected) {
    var sel = $("projType");
    if (!sel) return;
    sel.innerHTML = projectTypes.map(function (t) {
      return '<option value="' + t.name + '"' + (t.name === selected ? " selected" : "") + ">" + t.name + "</option>";
    }).join("");
  }

  function syncTypeFilterOptions() {
    var sel = $("projFilterType");
    if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = '<option value="">全部类型</option>' + projectTypes.map(function (t) {
      return '<option value="' + t.name + '">' + t.name + "</option>";
    }).join("");
    sel.value = cur;
  }

  function loadProjectToForm(p) {
    $("editingProjectId").value = p ? p.id : "";
    $("projName").value = p ? p.name : "";
    $("projDesc").value = p ? p.desc || "" : "";
    fillTypeSelect(p ? p.type : (projectTypes[0] && projectTypes[0].name));
    if ($("enableAudit")) {
      $("enableAudit").checked = p ? !!p.audit : true;
      $("enableAudit").disabled = !!(p && p.issued && (p.status === "待审核" || p.status === "已完成" || p.status === "已归档"));
    }
    syncAuditConfigUI();
    setCreateStep(p ? 2 : 1);
  }

  function setCreateStep(n) {
    document.querySelectorAll("#createSteps .step").forEach(function (s) {
      var sn = Number(s.getAttribute("data-step"));
      s.classList.remove("active", "done");
      if (sn < n) s.classList.add("done");
      if (sn === n) s.classList.add("active");
    });
  }

  function saveProject(asDraft, goIssue) {
    var name = ($("projName").value || "").trim();
    var type = $("projType").value;
    var desc = $("projDesc").value || "";
    if (!name) { toast("请填写项目名称"); setCreateStep(1); return false; }
    if (!type) { toast("请选择项目类型"); return false; }
    var id = $("editingProjectId").value;
    var auditOn = $("enableAudit") ? !!$("enableAudit").checked : true;
    if (id) {
      var p = findProject(id);
      if (p) {
        if (p.issued && asDraft) {
          toast("项目已发放，不能再存为草稿");
          return false;
        }
        // 已进入待审/完成/归档后不允许再改审批开关
        if (p.issued && (p.status === "待审核" || p.status === "已完成" || p.status === "已归档")) {
          auditOn = !!p.audit;
          if ($("enableAudit")) $("enableAudit").checked = auditOn;
        }
        var auditChanged = !!p.audit !== !!auditOn;
        p.name = name; p.type = type; p.desc = desc;
        p.audit = auditOn; p.updated = today();
        if (!p.issued) {
          p.status = asDraft ? "草稿" : "待发放";
          p.issue = "未发放";
          p.auditPassed = false;
        } else if (auditChanged) {
          if (!auditOn) {
            // 处理中途关闭审批：若处理已结束则直接完成
            clearAuditArtifacts(p.id);
            refreshProjectStatus(p.id);
          } else {
            p.auditPassed = false;
            refreshProjectStatus(p.id);
          }
        } else {
          refreshProjectStatus(p.id);
        }
      }
      toast(
        (asDraft ? "已存为草稿" : "项目已保存") +
        "（审批：" + (auditOn ? "开启" : "关闭") + "），列表已更新"
      );
    } else {
      var newId = "KP2026" + String(1000 + nextProjNo).slice(1);
      nextProjNo++;
      projects.unshift({
        id: newId, name: name, type: type, audit: auditOn,
        issue: "未发放", issued: false, auditPassed: false,
        status: asDraft ? "草稿" : "待发放",
        creator: "系统管理员",
        updated: today(), desc: desc, handlers: []
      });
      $("editingProjectId").value = newId;
      toast(
        (asDraft ? "草稿已创建" : "新项目已保存（待发放）") +
        "（审批：" + (auditOn ? "开启" : "关闭") + "）"
      );
    }
    setCreateStep(4);
    renderProjects();
    if (goIssue) {
      selectIssueProject($("editingProjectId").value, true);
      showPage("projectIssue");
    } else {
      // 保存后回到项目总列表
      showPage("projectList");
    }
    return true;
  }

  /* ========== 项目类型管理 ========== */
  function renderTypes() {
    var body = $("typeListBody");
    if (!body) return;
    body.innerHTML = projectTypes.map(function (t, i) {
      return (
        "<tr><td>" + t.name + "</td><td>" + t.desc + "</td><td>" +
        '<button class="btn-link" data-type-act="edit" data-idx="' + i + '">编辑</button> ' +
        '<button class="btn-link" data-type-act="del" data-idx="' + i + '">删除</button></td></tr>'
      );
    }).join("");
  }

  function resetTypeEdit() {
    $("typeEditIndex").value = "-1";
    $("typeNameInput").value = "";
    $("typeDescInput").value = "";
    $("btnAddType").style.display = "";
    $("typeEditBox").style.display = "none";
  }

  function showTypeEdit(idx) {
    $("typeEditBox").style.display = "block";
    $("btnAddType").style.display = "none";
    if (idx >= 0) {
      $("typeEditIndex").value = String(idx);
      $("typeNameInput").value = projectTypes[idx].name;
      $("typeDescInput").value = projectTypes[idx].desc;
    } else {
      $("typeEditIndex").value = "-1";
      $("typeNameInput").value = "";
      $("typeDescInput").value = "";
      $("typeNameInput").focus();
    }
  }

  /* ========== 组件 / 表格行 ========== */
  function bindFilePickers(root) {
    (root || document).querySelectorAll(".comp-box[data-comp='file']").forEach(function (box) {
      var btn = box.querySelector(".btn-pick-file");
      var input = box.querySelector(".file-input");
      var tip = box.querySelector(".file-name");
      if (!btn || !input || btn._bound) return;
      btn._bound = true;
      btn.addEventListener("click", function () { input.click(); });
      input.addEventListener("change", function () {
        if (input.files && input.files.length) {
          var names = Array.prototype.map.call(input.files, function (f) { return f.name; }).join("、");
          tip.textContent = "已选择：" + names;
          toast("已选择文件：" + names);
        }
      });
    });
  }

  function addComponent(type) {
    var list = $("componentList");
    if (!list) return;
    var html = "";
    if (type === "text") {
      html = '<div class="comp-box" data-comp="text"><div class="comp-title">文本说明 <button class="btn-link btn-sm btn-del-comp" type="button">删除</button></div><textarea placeholder="请输入说明文字"></textarea></div>';
    } else if (type === "file") {
      html = '<div class="comp-box" data-comp="file"><div class="comp-title">上传附件 <button class="btn-link btn-sm btn-del-comp" type="button">删除</button></div><input type="file" class="file-input" style="display:none" multiple /><button class="btn btn-pick-file" type="button">选择文件</button> <span class="hint file-name">未选择文件</span></div>';
    } else if (type === "paper") {
      html = '<div class="comp-box" data-comp="paper"><div class="comp-title">关联试卷 <button class="btn-link btn-sm btn-del-comp" type="button">删除</button></div><select><option>高等数学A卷（卷库）</option><option>高等数学B卷（卷库）</option><option>大学英语期末卷</option></select></div>';
    } else if (type === "analysis") {
      html = '<div class="comp-box" data-comp="analysis"><div class="comp-title">关联分析 <button class="btn-link btn-sm btn-del-comp" type="button">删除</button></div><select><option>上学期期末试卷分析报告</option><option>形成性考核分析</option></select></div>';
    } else if (type === "table") {
      html = '<div class="comp-box" data-comp="table"><div class="comp-title">表格（题型分值表） <button class="btn-link btn-sm btn-del-comp" type="button">删除</button></div><div class="table-wrap"><table class="data"><thead><tr><th>题型</th><th>题量</th><th>分值</th><th></th></tr></thead><tbody><tr><td><input value="新题型" /></td><td><input type="number" value="5" /></td><td><input type="number" value="10" /></td><td><button class="btn-link btn-del-row" type="button">删</button></td></tr></tbody></table></div><button class="btn btn-sm btn-add-score-row" type="button" style="margin-top:8px">+ 增行</button></div>';
    }
    list.insertAdjacentHTML("beforeend", html);
    bindFilePickers(list);
    toast("已添加组件");
    setCreateStep(2);
  }

  function addScoreRow(tbody) {
    if (!tbody) return;
    var tr = document.createElement("tr");
    tr.innerHTML = '<td><input value="新题型" /></td><td><input type="number" value="5" /></td><td><input type="number" value="10" /></td><td><button class="btn-link btn-del-row" type="button">删</button></td>';
    tbody.appendChild(tr);
    toast("已新增一行");
  }

  function addSchemeRow(tbody, kind) {
    if (!tbody) return;
    var opts = kind === "formative"
      ? '<option>线上作业</option><option>线下提交</option><option>在线考试</option><option>教师评定</option>'
      : '<option>纸笔+网上阅卷</option><option>在线考试</option>';
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td><input value="新考核项目" /></td><td><select>' + opts + "</select></td>" +
      '<td><input type="number" value="10" /></td><td><input value="请填写评定标准" /></td>' +
      '<td><button class="btn-link btn-del-row" type="button">删</button></td>';
    tbody.appendChild(tr);
    toast("已添加考核项目");
  }

  /* ========== 待办 / 审核 / 归档 / 审批流 ========== */
  function renderTodos() {
    var body = $("todoListBody");
    if (!body) return;
    var filter = $("todoHandlerFilter") ? $("todoHandlerFilter").value : "";
    var list = todos.filter(function (t) {
      if (t.status === "已完成") return false;
      if (!filter) return true;
      if (filter === "__audit__") return t.kind === "audit" || t.goto === "projectAudit";
      return t.handler === filter;
    });
    var tip = $("todoFilterTip");
    if (tip) {
      if (!filter) tip.textContent = "管理员视角：显示全部未完成待办（含各处理老师与审核）。";
      else if (filter === "__audit__") tip.textContent = "审核人视角：仅显示审核类待办。";
      else tip.textContent = "处理人视角：「" + filter + "」名下的待办（与上方发放对象联动生成）。";
    }
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="7" class="hint">' +
        (filter ? "当前身份下暂无待办，可切换「当前身份」或先手动发放并勾选处理老师" : "暂无待办任务") +
        "</td></tr>";
      return;
    }
    body.innerHTML = list.map(function (t) {
      var isAudit = t.kind === "audit" || t.goto === "projectAudit";
      var ops = isAudit
        ? '<button class="btn-link" data-todo-act="handle" data-todo-id="' + t.id + '">去审核</button>' +
          '<button class="btn-link" data-todo-act="del" data-todo-id="' + t.id + '">删除</button>'
        : '<button class="btn-link" data-todo-act="handle" data-todo-id="' + t.id + '">处理</button>' +
          '<button class="btn-link" data-todo-act="done" data-todo-id="' + t.id + '">完成</button>' +
          '<button class="btn-link" data-todo-act="del" data-todo-id="' + t.id + '">删除</button>';
      return (
        "<tr><td>" + t.task +
        (isAudit ? " <span class='tag tag-orange'>须审核页处理</span>" : "") +
        "</td><td>" + (t.handler || "—") +
        "</td><td>" + t.project +
        "<div class='hint'>" + (t.projectId || "") + "</div></td><td>" + t.issueDate +
        "</td><td>" + t.due + "</td><td>" + statusTag(t.status) +
        '</td><td class="ops">' + ops + "</td></tr>"
      );
    }).join("");
  }

  function ensureAuditForProject(projectId, quiet) {
    var p = findProject(projectId);
    if (!p) return null;
    if (!p.audit) {
      markProjectCompleted(p, quiet);
      return null;
    }
    var exist = audits.find(function (a) { return a.projectId === projectId; });
    if (exist) {
      p.status = "待审核";
      p.updated = today();
      return exist;
    }
    var a = {
      id: "a" + nextAuditNo++,
      projectId: p.id,
      project: p.name,
      submitter: p.creator || "提交人",
      node: "一级审核",
      rule: "任意一人通过即流转",
      done: 0,
      total: 1
    };
    audits.unshift(a);
    var hasTodo = todos.some(function (t) {
      return t.projectId === projectId && t.kind === "audit" && t.status !== "已完成";
    });
    if (!hasTodo) {
      todos.unshift({
        id: "t" + nextTodoNo++,
        kind: "audit",
        task: "审核" + p.type,
        projectId: p.id,
        project: p.name,
        handler: "审核人",
        issueDate: today(),
        due: today(),
        status: "待审核",
        goto: "projectAudit",
        auditId: a.id
      });
    }
    p.status = "待审核";
    p.updated = today();
    if (!quiet) toast("已进入待审核");
    return a;
  }

  /** 处理类待办完成后：开启审批→待审核；关闭审批→已完成 */
  function completeProcessTodo(t) {
    if (!t || t.kind === "audit") return false;
    if (t.status === "已完成") return false;
    if (t._busy) return false;
    t._busy = true;

    var p = findProject(t.projectId);
    if (!p) { t._busy = false; return false; }

    if (p.status === "待审核" || p.status === "已完成" || p.status === "已归档") {
      t._busy = false;
      if (p.status === "待审核") {
        toast("处理阶段已结束，请到「考核项目审核」完成审批");
      } else {
        toast("项目已是「" + p.status + "」，无需再处理");
      }
      return false;
    }

    t.status = "已完成";
    var stillOpen = todos.some(function (x) {
      return x.projectId === t.projectId && x.id !== t.id && x.kind !== "audit" && x.status !== "已完成";
    });
    if (stillOpen) {
      p.status = "处理中";
      p.updated = today();
      t._busy = false;
      toast("仍有未完成的处理待办，请继续处理");
      return true;
    }
    if (p.audit) {
      ensureAuditForProject(p.id, true);
      t._busy = false;
      toast("处理已完成，已进入待审核（须在审核页通过/驳回）");
    } else {
      markProjectCompleted(p, true);
      t._busy = false;
      toast("处理已完成。本项目未开启审批，已直接生效（已完成）");
    }
    return true;
  }

  function archiveProject(projectId) {
    var p = findProject(projectId);
    if (!p) return;
    if (p.status !== "已完成") {
      toast("仅「已完成」项目可归档");
      return;
    }
    p.status = "已归档";
    p.updated = today();
    if (!findPack(p.id)) {
      archivePackages.unshift({
        projectId: p.id,
        name: p.name,
        course: p.type,
        term: "本学期",
        files: [
          { name: p.name + "_方案.pdf", type: "考核方案", term: "本学期", date: today() },
          { name: p.name + "_试卷.docx", type: "试卷", term: "本学期", date: today() },
          { name: p.name + "_成绩单.xlsx", type: "成绩单", term: "本学期", date: today() }
        ]
      });
    }
    currentArchiveProjectId = p.id;
    // 清理残留待办
    todos = todos.filter(function (t) { return t.projectId !== p.id; });
    audits = audits.filter(function (a) { return a.projectId !== p.id; });
    renderProjects();
    renderTodos();
    renderAudits();
    renderArchives();
    toast("项目已归档，可在材料归档中查看；支持「撤销归档」");
    showPage("projectArchive");
  }

  function unarchiveProject(projectId) {
    var p = findProject(projectId);
    if (!p) {
      toast("未找到对应项目，无法撤销归档");
      return;
    }
    if (p.status !== "已归档") {
      toast("当前不是已归档状态，无需撤销");
      return;
    }
    p.status = "已完成";
    p.auditPassed = true;
    p.issued = true;
    p.updated = today();
    // 撤销后归档包不再出现在归档界面
    archivePackages = archivePackages.filter(function (pack) {
      return pack.projectId !== projectId;
    });
    if (currentArchiveProjectId === projectId) {
      currentArchiveProjectId = archivePackages[0] ? archivePackages[0].projectId : "";
    }
    renderProjects();
    renderArchives();
    renderSupervise();
    toast("已撤销归档：项目→已完成，归档包已从归档界面移除");
  }

  function renderAudits() {
    var tip = $("auditFocusTip");
    if (tip) {
      if (currentAuditFocusId) {
        var fp = findProject(currentAuditFocusId);
        tip.style.display = "block";
        if (fp && !fp.audit) {
          tip.textContent = currentAuditFocusId + " 未开启审批，不会进入待审列表。";
        } else {
          tip.textContent = "当前从项目列表带入：" + currentAuditFocusId +
            (fp ? (" · " + fp.name) : "") + "（已高亮，置顶显示）";
        }
      } else {
        tip.style.display = "none";
      }
    }
    var body = $("auditListBody");
    if (!body) return;
    // 过滤掉已关闭审批的项目残留
    audits = audits.filter(function (a) {
      var ap = findProject(a.projectId);
      return ap && ap.audit;
    });
    if (!audits.length) {
      body.innerHTML = '<tr><td colspan="6" class="hint">暂无待审项目（仅开启审批且处理完成的项目会出现在此）。</td></tr>';
      return;
    }
    // 焦点项置顶
    var list = audits.slice();
    if (currentAuditFocusId) {
      list.sort(function (a, b) {
        if (a.projectId === currentAuditFocusId) return -1;
        if (b.projectId === currentAuditFocusId) return 1;
        return 0;
      });
    }
    body.innerHTML = list.map(function (a) {
      var hl = a.projectId === currentAuditFocusId ? ' class="row-hl"' : "";
      return (
        "<tr" + hl + "><td>" + a.project + "<div class='hint'>" + a.projectId + "</div></td><td>" + a.submitter +
        "</td><td>" + a.node + "</td><td>" + a.rule + "</td><td>" + a.done + "/" + a.total +
        '</td><td><button class="btn btn-sm btn-primary" data-audit-id="' + a.id + '">审核</button></td></tr>'
      );
    }).join("");
  }

  function findPack(projectId) {
    for (var i = 0; i < archivePackages.length; i++) {
      if (archivePackages[i].projectId === projectId) return archivePackages[i];
    }
    return null;
  }

  function renderArchivePacks() {
    var box = $("archivePackList");
    if (!box) return;
    // 仅展示「已归档」项目对应的包
    var visible = archivePackages.filter(function (pack) {
      var p = findProject(pack.projectId);
      return p && p.status === "已归档";
    });
    if (!visible.length) {
      box.innerHTML = '<div class="hint">暂无已归档的归档包</div>';
      currentArchiveProjectId = "";
      return;
    }
    if (!visible.some(function (pack) { return pack.projectId === currentArchiveProjectId; })) {
      currentArchiveProjectId = visible[0].projectId;
    }
    box.innerHTML = visible.map(function (pack) {
      var active = pack.projectId === currentArchiveProjectId ? " active" : "";
      return (
        '<div class="pack-card' + active + '" data-pack-id="' + pack.projectId + '">' +
        '<div class="pack-title">' + pack.name + "</div>" +
        '<div class="pack-meta">编号 ' + pack.projectId + " · " + pack.course + " · " + pack.term +
        " · 含 " + pack.files.length + " 个文件</div></div>"
      );
    }).join("");
  }

  function renderArchives() {
    renderArchivePacks();
    var pack = findPack(currentArchiveProjectId) || archivePackages[0];
    if (pack) currentArchiveProjectId = pack.projectId;
    if ($("archiveFileTitle")) {
      $("archiveFileTitle").textContent = pack
        ? ("包内文件 · " + pack.name)
        : "包内文件";
    }
    var type = $("archType") ? $("archType").value : "";
    var kw = ($("archSearch") && $("archSearch").value || "").trim();
    var files = pack ? pack.files.slice() : [];
    files = files.filter(function (a) {
      if (type && a.type !== type) return false;
      if (kw && a.name.indexOf(kw) < 0) return false;
      return true;
    });
    if ($("archTip")) {
      $("archTip").textContent = pack
        ? ("当前包 " + files.length + " / " + pack.files.length + " 个文件")
        : "请选择归档包";
    }
    var body = $("archiveBody");
    if (!body) return;
    if (!pack) {
      body.innerHTML = '<tr><td colspan="5" class="hint">请先在左侧选择归档包</td></tr>';
      return;
    }
    if (!files.length) {
      body.innerHTML = '<tr><td colspan="5" class="hint">该归档包暂无匹配文件</td></tr>';
      return;
    }
    body.innerHTML = files.map(function (a) {
      return "<tr><td>" + a.name + "</td><td>" + a.type + "</td><td>" + a.term +
        "</td><td>" + a.date +
        '</td><td><button class="btn-link" data-dl="' + a.name + '">下载</button></td></tr>';
    }).join("");
  }

  function renderFlowNodes() {
    var box = $("flowNodes");
    if (!box) return;
    if (!flowNodes.length) {
      box.innerHTML = '<span class="hint">暂无审批节点，请点击下方「新增节点」</span>';
      return;
    }
    var html = "";
    flowNodes.forEach(function (n, i) {
      if (i > 0) html += '<span class="flow-arrow">→</span>';
      var multiTxt = n.multi
        ? ("同级多人：" + n.count + "人 / " + n.multi)
        : ("审批人：" + n.approver);
      html +=
        '<div class="flow-node" data-node-id="' + n.id + '">' +
        "<strong>节点" + (i + 1) + " · " + n.title + "</strong>" +
        multiTxt + "<br/>签名：" + n.sign +
        '<div class="node-ops">' +
        '<button class="btn btn-sm" type="button" data-flow-act="edit" data-node-id="' + n.id + '">编辑</button>' +
        '<button class="btn btn-sm btn-danger" type="button" data-flow-act="del" data-node-id="' + n.id + '">删除</button>' +
        "</div></div>";
    });
    box.innerHTML = html;
  }

  function openFlowEdit(node) {
    $("flowEditId").value = node ? node.id : "";
    $("flowEditTitle").value = node ? node.title : "";
    $("flowEditApprover").value = node ? node.approver : "";
    $("flowEditSign").value = node ? node.sign : "需要";
    $("flowEditMulti").value = node ? (node.multi || "") : "";
    $("flowEditCount").value = node ? node.count : 2;
    $("flowMultiCountWrap").style.display = $("flowEditMulti").value ? "block" : "none";
    openModal("modalFlowNode");
  }

  function deleteTodoById(todoId, silent) {
    var t = todos.find(function (x) { return x.id === todoId; });
    if (!t) return;
    var pid = t.projectId;
    var kind = t.kind;
    todos = todos.filter(function (x) { return x.id !== todoId; });
    var syncMsg = ["待办列表"];
    if (kind === "audit" || t.goto === "projectAudit") {
      var before = audits.length;
      audits = audits.filter(function (a) {
        if (t.auditId && a.id === t.auditId) return false;
        if (a.projectId === pid) return false;
        return true;
      });
      if (audits.length < before) syncMsg.push("待审列表");
      // 审核待办删除后仍须审核：重建待审（不重建已删的同一条 id）
      var pAud = findProject(pid);
      if (pAud && pAud.issued && !pAud.auditPassed) {
        ensureAuditForProject(pid, true);
        syncMsg.push("待审已重建");
      }
    } else if (pid) {
      // 处理待办删除：不自动重建；状态按规则回写（可能撤销发放）
      refreshProjectStatus(pid);
      syncMsg.push("项目状态");
    }
    if (!silent) {
      renderTodos();
      renderAudits();
      renderProjects();
      syncIssuePanel();
      toast("待办已删除，已同步：" + syncMsg.join("、"));
    }
  }

  function renderQuestions() {
    var st = $("qTagStatus") ? $("qTagStatus").value : "";
    var kw = ($("qTagSearch") && $("qTagSearch").value || "").trim();
    var list = questions.filter(function (q) {
      if (st && q.status !== st) return false;
      if (kw && q.stem.indexOf(kw) < 0 && q.id.indexOf(kw) < 0) return false;
      return true;
    });
    if ($("qTagTip")) $("qTagTip").textContent = list.length + " 题";
    var body = $("qTagBody");
    if (!body) return;
    body.innerHTML = list.map(function (q) {
      var stClass = q.status === "在用" ? "tag-green" : q.status === "闲置" ? "tag-gray" : "tag-orange";
      return (
        "<tr><td>" + q.id + "</td><td>" + q.stem + "</td><td><span class='tag " + stClass + "'>" + q.status +
        "</span></td><td>" + q.times + "</td><td>" + q.rate + "</td><td>" + q.diff +
        "</td><td><span class='tag " + q.actualClass + "'>" + q.actual +
        "</span></td><td><button class='btn-link' data-fix-id='" + q.id + "'>修正属性</button></td></tr>"
      );
    }).join("") || '<tr><td colspan="8" class="hint">无匹配试题</td></tr>';
  }

  function renderBankApplies() {
    var body = $("bankApplyBody");
    if (!body) return;
    body.innerHTML = bankApplies.map(function (b) {
      return "<tr><td>" + b.id + "</td><td>" + b.course + "</td><td>" + b.kind +
        "</td><td>" + b.qty + "</td><td>" + statusTag(b.status) + "</td><td>" + b.result + "</td></tr>";
    }).join("");
  }

  function renderRoles() {
    var body = $("roleBody");
    if (!body) return;
    body.innerHTML = roles.map(function (r, i) {
      return "<tr><td>" + r.name + "</td><td>" + r.desc + "</td><td>" + r.count +
        '</td><td><button class="btn-link" data-role-cfg="' + i + '">配置</button></td></tr>';
    }).join("");
  }

  function renderBankMembers() {
    var body = $("bankMemberBody");
    if (!body) return;
    body.innerHTML = bankMembers.map(function (m, i) {
      var act = m.access
        ? '<button class="btn-link" data-member-act="remove" data-idx="' + i + '">移除</button>'
        : '<button class="btn-link" data-member-act="add" data-idx="' + i + '">添加为成员</button>';
      return "<tr><td>" + m.name + "</td><td>" + m.role + "</td><td>" +
        (m.access ? '<span class="tag tag-green">允许</span>' : '<span class="tag tag-red">无权访问</span>') +
        "</td><td>" + act + "</td></tr>";
    }).join("");
  }

  function renderHistory() {
    var body = $("historyBody");
    if (!body) return;
    body.innerHTML = schemeHistory.map(function (h) {
      return "<tr><td>" + h.ver + "</td><td>" + h.time + "</td><td>" + h.scoreType +
        "</td><td>" + h.weight + "</td><td>" +
        (h.current ? "当前" : '<button class="btn-link" data-hist-view="1">查看</button>') +
        "</td></tr>";
    }).join("");
  }

  /* ========== 事件绑定 ========== */
  function bindEvents() {
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showPage(btn.getAttribute("data-page"));
      });
    });

    document.querySelectorAll("[data-goto]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        showPage(el.getAttribute("data-goto"));
      });
    });

    document.querySelectorAll(".tabs").forEach(function (tabs) {
      tabs.querySelectorAll(".tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
          var target = tab.getAttribute("data-tab");
          tabs.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
          tab.classList.add("active");
          var parent = tabs.parentElement;
          parent.querySelectorAll(":scope > .tab-pane").forEach(function (pane) {
            pane.classList.toggle("active", pane.id === target);
          });
        });
      });
    });

    // 项目筛选
    ["projSearch", "projFilterStatus", "projFilterType"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener(el.tagName === "INPUT" ? "input" : "change", renderProjects);
    });
    if ($("btnResetProjFilter")) {
      $("btnResetProjFilter").addEventListener("click", function () {
        $("projSearch").value = "";
        $("projFilterStatus").value = "";
        $("projFilterType").value = "";
        renderProjects();
        toast("筛选已重置");
      });
    }
    if ($("btnNewProject")) {
      $("btnNewProject").addEventListener("click", function () {
        loadProjectToForm(null);
        showPage("projectCreate");
        toast("请填写新项目信息后保存");
      });
    }

    // 列表操作委托
    if ($("projectListBody")) {
      $("projectListBody").addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        var act = btn.getAttribute("data-act");
        var id = btn.getAttribute("data-id");
        if (act === "edit") {
          loadProjectToForm(findProject(id));
          showPage("projectCreate");
          toast("已载入项目：" + id);
        } else if (act === "del") {
          if (!confirm("确认删除项目 " + id + " ？")) return;
          var delP = findProject(id);
          projects = projects.filter(function (p) { return p.id !== id; });
          todos = todos.filter(function (t) { return t.projectId !== id; });
          audits = audits.filter(function (a) { return a.projectId !== id; });
          renderProjects();
          renderTodos();
          renderAudits();
          toast("已删除 " + id + (delP ? "，并同步待办/待审" : ""));
        } else if (act === "viewArchive") {
          currentArchiveProjectId = id;
          // 若无对应包，用项目名建一个空包提示
          if (!findPack(id)) {
            var ap0 = findProject(id);
            archivePackages.unshift({
              projectId: id,
              name: ap0 ? ap0.name : id,
              course: "未指定",
              term: "—",
              files: []
            });
          }
          showPage("projectArchive");
          toast("已打开归档包：" + id);
        } else if (act === "unarchive") {
          unarchiveProject(id);
        } else if (act === "gotoAudit") {
          var ap = findProject(id);
          if (!ap) return;
          if (!ap.audit) {
            toast("该项目未开启审批，无需审核（处理完成后直接已完成）");
            return;
          }
          if (ap.status === "处理中") {
            toast("请先在「任务待办」中点「完成」结束处理，系统会自动进入待审核");
            selectIssueProject(id, true);
            showPage("projectIssue");
            return;
          }
          if (ap.status === "待发放" || ap.status === "草稿" || ap.status === "已驳回") {
            toast("请先发放项目并完成处理后再审核");
            return;
          }
          if (ap.status === "已完成" || ap.status === "已归档") {
            toast("项目已是「" + ap.status + "」，无需再审");
            return;
          }
          currentAuditFocusId = id;
          ensureAuditForProject(id, true);
          showPage("projectAudit");
          toast("已定位待审项目：" + id);
        } else if (act === "gotoIssue") {
          selectIssueProject(id, true);
          showPage("projectIssue");
        } else if (act === "archive") {
          archiveProject(id);
        } else if (act === "goto") {
          var page = btn.getAttribute("data-page");
          if (id && page === "projectIssue") {
            selectIssueProject(id, true);
          }
          showPage(page);
        } else if (act === "view") {
          var vp = findProject(id);
          toast("查询成功：" + id + (vp ? " · 状态 " + vp.status : ""));
        }
      });
    }

    // 创建页
    if ($("btnManageTypes")) {
      $("btnManageTypes").addEventListener("click", function () {
        resetTypeEdit();
        renderTypes();
        openModal("modalType");
      });
    }
    if ($("btnAddType")) {
      $("btnAddType").addEventListener("click", function () { showTypeEdit(-1); });
    }
    if ($("btnCancelTypeEdit")) {
      $("btnCancelTypeEdit").addEventListener("click", resetTypeEdit);
    }
    if ($("btnSaveType")) {
      $("btnSaveType").addEventListener("click", function () {
        var name = ($("typeNameInput").value || "").trim();
        var desc = ($("typeDescInput").value || "").trim() || "自定义类型";
        if (!name) { toast("请填写类型名称"); return; }
        var idx = Number($("typeEditIndex").value);
        if (idx >= 0) {
          var old = projectTypes[idx].name;
          projectTypes[idx] = { name: name, desc: desc };
          projects.forEach(function (p) { if (p.type === old) p.type = name; });
          toast("类型已更新");
        } else {
          if (projectTypes.some(function (t) { return t.name === name; })) {
            toast("类型名称已存在"); return;
          }
          projectTypes.push({ name: name, desc: desc });
          toast("已新增类型：" + name);
        }
        fillTypeSelect(name);
        syncTypeFilterOptions();
        renderTypes();
        resetTypeEdit();
      });
    }
    if ($("typeListBody")) {
      $("typeListBody").addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        var act = btn.getAttribute("data-type-act");
        var idx = Number(btn.getAttribute("data-idx"));
        if (act === "edit") showTypeEdit(idx);
        if (act === "del") {
          if (projectTypes.length <= 1) { toast("至少保留一种类型"); return; }
          var name = projectTypes[idx].name;
          if (!confirm("删除类型「" + name + "」？")) return;
          projectTypes.splice(idx, 1);
          fillTypeSelect();
          syncTypeFilterOptions();
          renderTypes();
          toast("已删除类型");
        }
      });
    }

    if ($("btnAddComponent")) {
      $("btnAddComponent").addEventListener("click", function () { openModal("modalAddComp"); });
    }
    if ($("btnConfirmAddComp")) {
      $("btnConfirmAddComp").addEventListener("click", function () {
        var r = document.querySelector('input[name="compType"]:checked');
        addComponent(r ? r.value : "text");
        closeModal("modalAddComp");
      });
    }
    if ($("btnAddScoreRow")) {
      $("btnAddScoreRow").addEventListener("click", function () { addScoreRow($("scoreTableBody")); });
    }

    // 组件删除 / 增行 / 选文件（委托）
    if ($("componentList")) {
      $("componentList").addEventListener("click", function (e) {
        if (e.target.classList.contains("btn-del-comp")) {
          var box = e.target.closest(".comp-box");
          if (box) { box.remove(); toast("组件已删除"); }
        }
        if (e.target.classList.contains("btn-del-row")) {
          var tr = e.target.closest("tr");
          if (tr) { tr.remove(); toast("已删除行"); }
        }
        if (e.target.classList.contains("btn-add-score-row")) {
          var tb = e.target.closest(".comp-box").querySelector("tbody");
          addScoreRow(tb);
        }
      });
    }

    if ($("enableAudit")) {
      syncAuditConfigUI();
      $("enableAudit").addEventListener("change", function () {
        syncAuditConfigUI();
        toast(this.checked ? "已开启审批：处理完成后需审核" : "已关闭审批：处理完成后直接生效");
      });
    }
    if ($("btnAddFlowNode")) {
      $("btnAddFlowNode").addEventListener("click", function () {
        openFlowEdit(null);
        setCreateStep(3);
      });
    }
    if ($("flowEditMulti")) {
      $("flowEditMulti").addEventListener("change", function () {
        $("flowMultiCountWrap").style.display = this.value ? "block" : "none";
      });
    }
    if ($("btnSaveFlowNode")) {
      $("btnSaveFlowNode").addEventListener("click", function () {
        var title = ($("flowEditTitle").value || "").trim();
        var approver = ($("flowEditApprover").value || "").trim() || "待指定";
        if (!title) { toast("请填写节点名称"); return; }
        var id = $("flowEditId").value;
        var data = {
          id: id || ("n" + nextFlowNo++),
          title: title,
          approver: approver,
          sign: $("flowEditSign").value,
          multi: $("flowEditMulti").value,
          count: Number($("flowEditCount").value) || 2
        };
        if (id) {
          var idx = -1;
          for (var fi = 0; fi < flowNodes.length; fi++) {
            if (flowNodes[fi].id === id) { idx = fi; break; }
          }
          if (idx >= 0) flowNodes[idx] = data;
          toast("节点已更新");
        } else {
          flowNodes.push(data);
          toast("已新增审批节点");
        }
        closeModal("modalFlowNode");
        renderFlowNodes();
        setCreateStep(3);
      });
    }
    if ($("flowNodes")) {
      $("flowNodes").addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-flow-act]");
        if (!btn) return;
        var nid = btn.getAttribute("data-node-id");
        var act = btn.getAttribute("data-flow-act");
        if (act === "edit") {
          var node = flowNodes.find(function (n) { return n.id === nid; });
          if (node) openFlowEdit(node);
        } else if (act === "del") {
          if (flowNodes.length <= 1) { toast("至少保留一个审批节点"); return; }
          if (!confirm("确认删除该审批节点？")) return;
          flowNodes = flowNodes.filter(function (n) { return n.id !== nid; });
          renderFlowNodes();
          toast("节点已删除");
        }
      });
    }
    if ($("btnSaveDraft")) $("btnSaveDraft").addEventListener("click", function () { saveProject(true, false); });
    if ($("btnSaveProject")) $("btnSaveProject").addEventListener("click", function () { saveProject(false, false); });
    if ($("btnSaveAndIssue")) $("btnSaveAndIssue").addEventListener("click", function () { saveProject(false, true); });

    // 发放
    function syncIssueMode() {
      var checked = document.querySelector('input[name="issueMode"]:checked');
      var mode = checked ? checked.value : "manual";
      if ($("autoIssueCfg")) $("autoIssueCfg").style.display = mode === "auto" ? "block" : "none";
      if ($("manualIssueCfg")) $("manualIssueCfg").style.display = mode === "manual" ? "block" : "none";
    }
    document.querySelectorAll('input[name="issueMode"]').forEach(function (r) {
      r.addEventListener("change", syncIssueMode);
    });
    syncIssueMode();

    if ($("btnConfirmIssue")) {
      $("btnConfirmIssue").addEventListener("click", function () {
        var list = getSelectedIssueProjects().filter(function (p) {
          return canIssueProject(p).ok;
        });
        if (!list.length) {
          toast("请先勾选可发放的项目");
          syncIssuePanel();
          return;
        }

        var mode = document.querySelector('input[name="issueMode"]:checked');
        var isAuto = mode && mode.value === "auto";
        var modeTxt = isAuto ? "自动发放" : "手动发放";
        var condText = "";
        if (isAuto) {
          var cond = $("autoIssueCond") || document.querySelector("#autoIssueCfg select");
          condText = cond ? cond.value : "条件触发";
          modeTxt = "自动·" + condText;
        }

        var handlers = getSelectedHandlers();
        if (!isAuto && !handlers.length) {
          toast("请至少勾选一位处理老师（发放对象支持多选）");
          return;
        }

        var note = ($("issueNote") && $("issueNote").value) || "";
        var okCount = 0;
        var failMsgs = [];
        list.forEach(function (p) {
          var r = issueOneProject(p, isAuto, modeTxt, condText, handlers, note);
          if (r.ok) okCount++;
          else failMsgs.push(p.id + "：" + r.reason);
        });

        selectedIssueProjectIds = selectedIssueProjectIds.filter(function (id) {
          var p = findProject(id);
          return p && canIssueProject(p).ok;
        });
        // 已发放成功的会从待发放列表消失，清理选择
        pruneIssueSelection();

        if (!isAuto && handlers[0] && $("todoHandlerFilter")) {
          $("todoHandlerFilter").value = handlers[0];
        }

        renderPendingIssueList();
        syncIssuePanel();
        renderTodos();
        renderProjects();
        renderAudits();

        if (isAuto) {
          toast(
            "已自动发放 " + okCount + " 个项目（条件：" + condText + "）" +
            (failMsgs.length ? "；跳过 " + failMsgs.length + " 个" : "")
          );
        } else {
          toast(
            "已手动发放 " + okCount + " 个项目 × " + handlers.length + " 位老师" +
            (failMsgs.length ? "；跳过 " + failMsgs.length + " 个" : "") +
            "。可切换「当前身份」查看待办。"
          );
        }
      });
    }
    if ($("pendingIssueBody")) {
      $("pendingIssueBody").addEventListener("click", function (e) {
        if (e.target.classList.contains("pending-issue-cb")) {
          e.stopPropagation();
          toggleIssueProject(e.target.getAttribute("data-id"), e.target.checked);
          return;
        }
        var btn = e.target.closest("button[data-pending-act]");
        var tr = e.target.closest("tr[data-pending-id]");
        if (btn) {
          var act = btn.getAttribute("data-pending-act");
          var id = btn.getAttribute("data-id");
          if (act === "toggle") {
            toggleIssueProject(id, !isIssueSelected(id));
          } else if (act === "viewList") {
            if ($("projSearch")) $("projSearch").value = id;
            showPage("projectList");
            toast("已在项目列表定位：" + id);
          }
          return;
        }
        if (tr) {
          var pid = tr.getAttribute("data-pending-id");
          toggleIssueProject(pid, !isIssueSelected(pid));
        }
      });
    }
    if ($("pendingCheckAll")) {
      $("pendingCheckAll").addEventListener("change", function () {
        var pending = projects.filter(function (p) {
          return p.status === "待发放" || p.status === "已驳回" || p.status === "草稿" ||
            (!p.issued && p.status !== "已归档" && p.status !== "已完成");
        });
        setIssueSelection(this.checked ? pending.map(function (p) { return p.id; }) : [], false);
      });
    }
    if ($("btnPendingSelectAll")) {
      $("btnPendingSelectAll").addEventListener("click", function () {
        var pending = projects.filter(function (p) {
          return p.status === "待发放" || p.status === "已驳回" || p.status === "草稿" ||
            (!p.issued && p.status !== "已归档" && p.status !== "已完成");
        });
        setIssueSelection(pending.map(function (p) { return p.id; }), false);
      });
    }
    if ($("btnPendingClear")) {
      $("btnPendingClear").addEventListener("click", function () {
        setIssueSelection([], false);
      });
    }
    if ($("selectedIssueChips")) {
      $("selectedIssueChips").addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-chip-remove]");
        if (!btn) return;
        toggleIssueProject(btn.getAttribute("data-chip-remove"), false);
      });
    }
    if ($("btnHandlerSelectAll")) {
      $("btnHandlerSelectAll").addEventListener("click", function () {
        document.querySelectorAll(".issue-handler-cb").forEach(function (cb) { cb.checked = true; });
        syncHandlerSelectTip();
        toast("已全选处理老师");
      });
    }
    if ($("btnHandlerClear")) {
      $("btnHandlerClear").addEventListener("click", function () {
        document.querySelectorAll(".issue-handler-cb").forEach(function (cb) { cb.checked = false; });
        syncHandlerSelectTip();
        toast("已清空处理老师选择");
      });
    }
    document.querySelectorAll(".issue-handler-cb").forEach(function (cb) {
      cb.addEventListener("change", syncHandlerSelectTip);
    });
    if ($("btnGotoProjectListFromIssue")) {
      $("btnGotoProjectListFromIssue").addEventListener("click", function () {
        showPage("projectList");
      });
    }
    if ($("todoHandlerFilter")) {
      $("todoHandlerFilter").addEventListener("change", renderTodos);
    }
    if ($("todoListBody")) {
      $("todoListBody").addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-todo-act]");
        if (!btn) return;
        var tid = btn.getAttribute("data-todo-id");
        var act = btn.getAttribute("data-todo-act");
        var t = todos.find(function (x) { return x.id === tid; });
        if (!t) return;
        if (act === "handle") {
          if (t.kind === "audit" || t.goto === "projectAudit") {
            var hp = findProject(t.projectId);
            if (hp && !hp.audit) {
              toast("该项目未开启审批，已移除无效审核待办");
              deleteTodoById(t.id, true);
              renderTodos();
              renderProjects();
              return;
            }
            currentAuditFocusId = t.projectId;
            ensureAuditForProject(t.projectId, true);
            showPage("projectAudit");
            toast("请在待审列表中点击「审核」进行通过/驳回");
            return;
          }
          if (t.status === "待处理") t.status = "处理中";
          if (t.goto === "projectCreate" && t.projectId) {
            loadProjectToForm(findProject(t.projectId));
          }
          if (t.goto === "scheme") showPage("scheme");
          else showPage(t.goto || "projectCreate");
          renderTodos();
          renderProjects();
          toast("进入处理：" + t.task);
        } else if (act === "done") {
          // 审核待办禁止用「完成」跳过审批
          if (t.kind === "audit" || t.goto === "projectAudit") {
            toast("审核类待办不能点完成。请点「去审核」，在审核页通过或驳回");
            return;
          }
          if (t.status === "已完成") {
            toast("该待办已完成，请勿重复点击");
            return;
          }
          var ok = completeProcessTodo(t);
          if (ok) refreshProjectStatus(t.projectId);
          renderTodos();
          renderAudits();
          renderProjects();
          syncIssuePanel();
        } else if (act === "del") {
          if (t.kind === "audit") {
            if (!confirm("删除审核待办后系统仍会保持「待审核」并重建待审，确认删除？")) return;
          } else if (!confirm("确认删除待办「" + t.task + "」？将同步更新项目状态。")) {
            return;
          }
          deleteTodoById(tid, false);
          syncIssuePanel();
        }
      });
    }

    // 审核
    if ($("auditListBody")) {
      $("auditListBody").addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-audit-id]");
        if (!btn) return;
        var id = btn.getAttribute("data-audit-id");
        var a = audits.find(function (x) { return x.id === id; });
        if (!a) return;
        $("auditCurrentId").value = id;
        $("auditOpinion").value = "";
        $("auditModalInfo").textContent =
          "项目：" + a.project + " · 当前节点：" + a.node + "（" + a.rule + "）· 已审 " + a.done + "/" + a.total;
        openModal("modalAudit");
      });
    }
    if ($("btnAuditPass")) {
      $("btnAuditPass").addEventListener("click", function () {
        var id = $("auditCurrentId").value;
        var a = audits.find(function (x) { return x.id === id; });
        if (!a) return;
        if (!$("auditSign").checked) { toast("请勾选电子签名确认"); return; }
        a.done += 1;
        if (a.done >= a.total || a.rule.indexOf("任意一人") >= 0) {
          audits = audits.filter(function (x) { return x.id !== id; });
          todos = todos.filter(function (t) {
            return !(t.auditId === id || (t.projectId === a.projectId && t.kind === "audit"));
          });
          var p = findProject(a.projectId);
          if (p) {
            p.auditPassed = true;
            p.status = "已完成";
            p.updated = today();
          }
          toast("审核通过。项目状态→已完成（可在列表中归档）");
        } else {
          toast("审核通过，等待同级其他人（" + a.done + "/" + a.total + "）");
        }
        closeModal("modalAudit");
        renderAudits();
        renderTodos();
        renderProjects();
        syncIssuePanel();
      });
    }
    if ($("btnAuditReject")) {
      $("btnAuditReject").addEventListener("click", function () {
        var id = $("auditCurrentId").value;
        var a = audits.find(function (x) { return x.id === id; });
        if (a) {
          audits = audits.filter(function (x) { return x.id !== id; });
          todos = todos.filter(function (t) {
            return !(t.auditId === id || (t.projectId === a.projectId && t.kind === "audit"));
          });
          // 驳回后清理未完成处理待办，回到可重新发放
          todos = todos.filter(function (t) {
            return !(t.projectId === a.projectId && t.status !== "已完成");
          });
          var p = findProject(a.projectId);
          if (p) {
            p.status = "已驳回";
            p.issued = false;
            p.auditPassed = false;
            p.issue = "未发放";
            p.updated = today();
          }
        }
        closeModal("modalAudit");
        renderAudits();
        renderTodos();
        renderProjects();
        syncIssuePanel();
        toast("已驳回" + ($("auditOpinion").value ? "：" + $("auditOpinion").value : "") + "。状态→已驳回，可修改后重新发放");
      });
    }

    // 督导
    if ($("superviseBody")) {
      $("superviseBody").addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-sup-act]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var act = btn.getAttribute("data-sup-act");
        var p = findProject(id);
        if (!p) return;
        if (act === "urge") {
          urgeProjectHandlers(id, false);
        } else if (act === "detail") {
          renderSuperviseDetail(id);
          openModal("modalSupervise");
        }
      });
    }
    if ($("btnUrgeAll")) {
      $("btnUrgeAll").addEventListener("click", function () {
        var open = todos.filter(function (t) { return !isTodoDone(t); });
        if (!open.length) {
          toast("当前没有未完成待办，已完成的老师不可催办");
          return;
        }
        var byHandler = {};
        open.forEach(function (t) {
          var key = t.handler || "处理人";
          byHandler[key] = (byHandler[key] || 0) + 1;
        });
        var detail = Object.keys(byHandler).map(function (k) {
          return k + "×" + byHandler[k];
        }).join("、");
        toast("已向 " + open.length + " 条未完成待办催办（" + detail + "），已完成人员已自动跳过");
      });
    }
    if ($("superviseDetailBody")) {
      $("superviseDetailBody").addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-sup-detail-urge]");
        if (!btn) return;
        var tid = btn.getAttribute("data-sup-detail-urge");
        urgeOneHandler(tid);
        // 完成后刷新详情（状态未变仍会提示不可催办）
        if (currentSuperviseProjectId) renderSuperviseDetail(currentSuperviseProjectId);
      });
    }

    // 归档
    ["archType", "archSearch"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener(el.tagName === "INPUT" ? "input" : "change", renderArchives);
    });
    if ($("archivePackList")) {
      $("archivePackList").addEventListener("click", function (e) {
        var card = e.target.closest(".pack-card");
        if (!card) return;
        currentArchiveProjectId = card.getAttribute("data-pack-id");
        renderArchives();
        toast("已切换归档包：" + currentArchiveProjectId);
      });
    }
    if ($("btnClearPackFocus")) {
      $("btnClearPackFocus").addEventListener("click", function () {
        currentArchiveProjectId = archivePackages[0] ? archivePackages[0].projectId : "";
        if ($("archType")) $("archType").value = "";
        if ($("archSearch")) $("archSearch").value = "";
        renderArchives();
        toast("已显示全部归档包，当前选中第一个");
      });
    }
    if ($("btnArchExport")) {
      $("btnArchExport").addEventListener("click", function () {
        var pack = findPack(currentArchiveProjectId);
        if (!pack) { toast("请先选择归档包"); return; }
        toast("已导出「" + pack.name + "」ZIP（含 " + pack.files.length + " 个文件）");
      });
    }
    if ($("btnUnarchive")) {
      $("btnUnarchive").addEventListener("click", function () {
        var pack = findPack(currentArchiveProjectId);
        if (!pack) { toast("请先选择归档包"); return; }
        var p = findProject(pack.projectId);
        if (!p) {
          toast("该归档包无对应项目记录，无法撤销");
          return;
        }
        if (p.status !== "已归档") {
          toast("对应项目当前状态为「" + p.status + "」，不是已归档");
          return;
        }
        if (!confirm("确认撤销归档「" + pack.name + "」？项目将回到「已完成」。")) return;
        unarchiveProject(pack.projectId);
      });
    }
    if ($("archiveBody")) {
      $("archiveBody").addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-dl]");
        if (btn) toast("开始下载：" + btn.getAttribute("data-dl"));
      });
    }

    // 方案
    document.body.addEventListener("click", function (e) {
      if (e.target.classList.contains("btn-del-row")) {
        var tr = e.target.closest("tr");
        var tb = tr && tr.parentNode;
        // 题型分值表由 componentList 委托处理，避免重复
        if (tr && tb && (tb.id === "formativeBody" || tb.id === "summativeBody")) {
          tr.remove();
          toast("已删除行");
        }
      }
    });
    // 课程/题卡/分析/题库/查重等模块交互已移交 wjy-modules.js（同事原型），此处不再绑定以免覆盖。

    // 点击遮罩关闭
    document.querySelectorAll(".modal-mask").forEach(function (mask) {
      mask.addEventListener("click", function (e) {
        if (e.target === mask) mask.classList.remove("show");
      });
    });
  }

  /* ========== 初始化 ========== */
  function init() {
    fillTypeSelect("命题方案");
    syncTypeFilterOptions();
    bindFilePickers();
    bindEvents();
    renderFlowNodes();
    // 校准演示数据状态
    projects.forEach(function (p) { refreshProjectStatus(p.id); });
    renderProjects();
    renderTodos();
    renderAudits();
    renderArchives();
    syncIssuePanel();
    resetTypeEdit();
    // 方案提交后同步考试项目待办（对接同事模块 submitScheme）
    if (typeof window.submitScheme === "function" && !window.submitScheme.__bridged) {
      var _submitScheme = window.submitScheme;
      window.submitScheme = function () {
        var ret = _submitScheme.apply(this, arguments);
        var schemeTodos = todos.filter(function (t) {
          return t.goto === "scheme" && t.status !== "已完成";
        });
        schemeTodos.forEach(function (t) { completeProcessTodo(t); });
        renderTodos();
        renderProjects();
        renderAudits();
        return ret;
      };
      window.submitScheme.__bridged = true;
    }
    showPage("home");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
