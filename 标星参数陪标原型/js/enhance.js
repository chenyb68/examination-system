/* 模块增强：考核方案 / 答题卡 / OCR / 成绩分析 */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function toast(msg) {
    if (window.toast) window.toast(msg);
    else alert(msg);
  }
  function rebind(id, type, handler) {
    var el = $(id);
    if (!el || !el.parentNode) return null;
    var neo = el.cloneNode(true);
    el.parentNode.replaceChild(neo, el);
    neo.addEventListener(type || "click", handler);
    return neo;
  }
  function barsHtml(items, maxVal) {
    maxVal = maxVal || Math.max.apply(null, items.map(function (x) { return x.v; })) || 1;
    return '<div class="bar-chart">' + items.map(function (it) {
      var h = Math.max(8, Math.round(it.v / maxVal * 100));
      return '<div class="bar" style="height:' + h + '%;background:' + (it.color || "#1677ff") + '"><em>' +
        (it.label != null ? it.label : it.v) + "</em><span>" + it.name + "</span></div>";
    }).join("") + "</div>";
  }
  function downloadText(filename, text) {
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  /* ========== 考核方案 ========== */
  var schemeSnapshot = "";
  var schemeSubmitted = false;
  var schemeHistoryDetail = [
    {
      ver: "V3（当前）", time: "2026-03-10", scoreType: "分数制", weight: "40%", current: true,
      detail: "形成性：平时作业15%+课堂10%+阶段测验15%；终结性：期末60%；一票否决：是；关联：网上阅卷/在线考试/登分统计。"
    },
    {
      ver: "V2", time: "2025-09-01", scoreType: "分数制", weight: "30%", current: false,
      detail: "形成性30%（作业+考勤）；终结性70%（期末）；一票否决：否。"
    },
    {
      ver: "V1", time: "2025-02-20", scoreType: "等级制", weight: "40%", current: false,
      detail: "等级制方案：形成性40%，终结性60%；无在线考试关联。"
    }
  ];

  function sumWeights(tbodyId) {
    var sum = 0;
    var tb = $(tbodyId);
    if (!tb) return 0;
    tb.querySelectorAll(".w-input").forEach(function (inp) {
      sum += Number(inp.value) || 0;
    });
    return sum;
  }

  function refreshSchemeWeights() {
    var f = sumWeights("formativeBody");
    var s = sumWeights("summativeBody");
    if ($("formativeWeightPct")) $("formativeWeightPct").textContent = String(f);
    if ($("summativeWeightPct")) $("summativeWeightPct").textContent = String(s);
    var tip = $("schemeWeightTip");
    if (tip) {
      var total = f + s;
      tip.textContent = "当前形成性 " + f + "% + 终结性 " + s + "% = " + total + "%。" +
        (total === 100 ? "权重合计正常。" : "建议调整各项目权重使合计为 100%。");
      tip.style.background = total === 100 ? "#f6ffed" : "#fffbe6";
      tip.style.borderColor = total === 100 ? "#b7eb8f" : "#ffe58f";
      tip.style.color = total === 100 ? "#389e0d" : "#876800";
    }
    var dirty = $("schemeDirtyTip");
    if (dirty) {
      var now = captureScheme();
      if (!schemeSnapshot) {
        dirty.textContent = "尚未提交过方案，保存草稿后可提交。";
      } else if (now === schemeSnapshot) {
        dirty.textContent = "方案内容较上次提交未变更，无需重复提交。";
      } else {
        dirty.textContent = "方案已修改，提交后将生成新历史版本并重新关联考核任务。";
      }
    }
  }

  function captureScheme() {
    var parts = [];
    ["formativeBody", "summativeBody"].forEach(function (id) {
      var tb = $(id);
      if (!tb) return;
      tb.querySelectorAll("tr").forEach(function (tr) {
        var inputs = tr.querySelectorAll("input, select");
        var row = [];
        inputs.forEach(function (el) { row.push(el.value); });
        parts.push(row.join("|"));
      });
    });
    return parts.join(";;");
  }

  function bindSchemeRowEvents(tb) {
    if (!tb || tb._boundScheme) return;
    tb._boundScheme = true;
    tb.addEventListener("click", function (e) {
      var btn = e.target.closest(".btn-del-scheme-row");
      if (!btn) return;
      var tr = btn.closest("tr");
      var body = tb;
      if (body.querySelectorAll("tr").length <= 1) {
        toast("至少保留一个考核项目");
        return;
      }
      tr.remove();
      refreshSchemeWeights();
      toast("已删除考核项目");
    });
    tb.addEventListener("input", function (e) {
      if (e.target.classList.contains("w-input")) refreshSchemeWeights();
    });
  }

  function addSchemeItem(kind) {
    var tb = $(kind === "formative" ? "formativeBody" : "summativeBody");
    if (!tb) return;
    var opts = kind === "formative"
      ? "<option>线上作业</option><option>线下提交</option><option>在线考试</option><option>教师评定</option>"
      : "<option>纸笔+网上阅卷</option><option>在线考试</option>";
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td><input value="新考核项目" /></td><td><select>' + opts + "</select></td>" +
      '<td><input class="w-input" type="number" value="10" /></td>' +
      '<td><input value="请填写评定标准" /></td>' +
      '<td><button class="btn-link btn-del-scheme-row" type="button">删除</button></td>';
    tb.appendChild(tr);
    refreshSchemeWeights();
    toast(kind === "formative" ? "已添加形成性项目" : "已添加终结性项目");
  }

  function detectLinkedTasks() {
    var tasks = {
      onlineMark: false,
      onlineExam: false,
      scoreStat: true
    };
    ["formativeBody", "summativeBody"].forEach(function (id) {
      var tb = $(id);
      if (!tb) return;
      tb.querySelectorAll("select").forEach(function (sel) {
        var v = sel.value || "";
        if (v.indexOf("网上阅卷") >= 0) tasks.onlineMark = true;
        if (v.indexOf("在线考试") >= 0) tasks.onlineExam = true;
      });
    });
    return tasks;
  }

  function renderLinkedTasks(active) {
    var list = $("schemeTaskList");
    if (!list) return;
    var t = detectLinkedTasks();
    function row(ok, name, desc) {
      return "<li>" + (ok && active ? "✓" : "□") + " " + name + " — " +
        (ok && active ? ("已关联（" + desc + "）") : (ok ? "可关联（提交后生效）" : "当前方案未涉及")) + "</li>";
    }
    list.innerHTML =
      row(t.onlineMark, "网上阅卷", "纸笔考试答卷网上评阅") +
      row(t.onlineExam, "在线考试", "阶段/期末在线作答") +
      row(t.scoreStat, "成绩登分与自动统计", "按权重汇总形成性/终结性");
  }

  function initScheme() {
    bindSchemeRowEvents($("formativeBody"));
    bindSchemeRowEvents($("summativeBody"));
    rebind("btnAddFormative", "click", function () { addSchemeItem("formative"); });
    rebind("btnAddSummative", "click", function () { addSchemeItem("summative"); });
    rebind("btnSaveScheme", "click", function () {
      refreshSchemeWeights();
      toast("草稿已保存（未提交，不生成新版本）");
    });
    rebind("btnSubmitScheme", "click", function () {
      refreshSchemeWeights();
      var f = sumWeights("formativeBody");
      var s = sumWeights("summativeBody");
      if (f + s !== 100) {
        toast("权重合计为 " + (f + s) + "%，请调整为 100% 后再提交");
        return;
      }
      var now = captureScheme();
      if (schemeSnapshot && now === schemeSnapshot) {
        toast("方案未变更，无需重复提交");
        renderLinkedTasks(true);
        return;
      }
      schemeSnapshot = now;
      schemeSubmitted = true;
      schemeHistoryDetail.forEach(function (h) {
        h.current = false;
        h.ver = h.ver.replace("（当前）", "");
      });
      schemeHistoryDetail.unshift({
        ver: "V" + (schemeHistoryDetail.length + 1) + "（当前）",
        time: new Date().toISOString().slice(0, 10),
        scoreType: "分数制",
        weight: f + "%",
        current: true,
        detail: "形成性" + f + "% / 终结性" + s + "%；" + ($("schemeTaskList") ? $("schemeTaskList").innerText : "")
      });
      renderLinkedTasks(true);
      refreshSchemeWeights();
      toast("方案已提交：已关联考核任务，并写入历史版本");
    });
    rebind("btnShowHistory", "click", function () {
      var body = $("historyBody");
      if (body) {
        body.innerHTML = schemeHistoryDetail.map(function (h, i) {
          return "<tr><td>" + h.ver + "</td><td>" + h.time + "</td><td>" + h.scoreType +
            "</td><td>" + h.weight + "</td><td>" +
            (h.current ? "当前" : '<button class="btn-link" data-hist-idx="' + i + '">查看</button>') +
            "</td></tr>";
        }).join("");
      }
      if ($("historyDetail")) {
        $("historyDetail").textContent = "点击「查看」浏览历史方案。方案未变更时无需重复提交。";
      }
      if (window.openModal) window.openModal("modalHistory");
    });
    var histModal = $("modalHistory");
    if (histModal && !histModal._histBound) {
      histModal._histBound = true;
      histModal.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-hist-idx]");
        if (!btn) return;
        var h = schemeHistoryDetail[Number(btn.getAttribute("data-hist-idx"))];
        if (!h) return;
        if ($("historyDetail")) {
          $("historyDetail").innerHTML =
            "<strong>" + h.ver + "</strong>（" + h.time + "）<br/>成绩类型：" + h.scoreType +
            " · 形成性权重：" + h.weight + "<br/>" + h.detail;
        }
        toast("已打开历史方案：" + h.ver);
      });
    }
    refreshSchemeWeights();
    renderLinkedTasks(false);
  }

  /* ========== 答题卡 ========== */
  var papers = [
    {
      id: "mathA",
      name: "高等数学期末A卷",
      subject: "高等数学",
      structure: "单选20 + 多选5 + 填空8 + 解答4",
      sections: [
        { title: "一、单选题（OMR）", type: "omr", count: 20, opts: "ABCD" },
        { title: "二、多选题（OMR）", type: "omr", count: 5, opts: "ABCD" },
        { title: "三、填空题（OCR）", type: "blank", count: 8 },
        { title: "四、解答题（书写区）", type: "essay", count: 4 }
      ]
    },
    {
      id: "engB",
      name: "大学英语期末B卷",
      subject: "大学英语",
      structure: "单选30 + 完形10 + 翻译5 + 作文1",
      sections: [
        { title: "一、单选题（OMR）", type: "omr", count: 30, opts: "ABCD" },
        { title: "二、完形填空（OMR）", type: "omr", count: 10, opts: "ABCD" },
        { title: "三、翻译（OCR/书写）", type: "blank", count: 5 },
        { title: "四、作文（书写区）", type: "essay", count: 1 }
      ]
    },
    {
      id: "csC",
      name: "程序设计期末卷",
      subject: "程序设计",
      structure: "单选15 + 判断10 + 填空10 + 编程3",
      sections: [
        { title: "一、单选题（OMR）", type: "omr", count: 15, opts: "ABCD" },
        { title: "二、判断题（OCR）", type: "judge", count: 10 },
        { title: "三、填空题（OCR）", type: "blank", count: 10 },
        { title: "四、编程题（书写区）", type: "essay", count: 3 }
      ]
    },
    {
      id: "phyD",
      name: "大学物理期中卷",
      subject: "大学物理",
      structure: "单选12 + 多选6 + 计算4",
      sections: [
        { title: "一、单选题（OMR）", type: "omr", count: 12, opts: "ABCD" },
        { title: "二、多选题（OMR）", type: "omr", count: 6, opts: "ABCDE" },
        { title: "三、计算题（书写区）", type: "essay", count: 4 }
      ]
    }
  ];
  var currentSheetHtml = "";
  var sheetEditing = false;

  function renderSheetPreview(paper, mode, template) {
    var orient = template === "a4v" ? "纵向" : template === "custom" ? "自定义" : "横向";
    var html = "";
    html += '<div class="qr">考试<br/>二维码</div>';
    html += '<div class="sheet-hd" id="sheetTitle" ' + (sheetEditing ? 'contenteditable="true"' : "") + ">" +
      paper.subject + " · " + paper.name + " 答题卡</div>";
    html += "<div>模板：" + orient + "　模式：" + mode + "</div>";
    html += "<div>姓名：________　学号：________　考号：________</div>";
    paper.sections.forEach(function (sec) {
      html += '<div style="clear:both;margin-top:12px;font-weight:700;">' + sec.title + "</div>";
      if (sec.type === "omr") {
        var show = Math.min(sec.count, 3);
        for (var i = 1; i <= show; i++) {
          html += '<div class="omr-row">' + i + '. <span class="omr-opts">';
          (sec.opts || "ABCD").split("").forEach(function (ch) {
            html += "<i>" + ch + "</i>";
          });
          html += "</span></div>";
        }
        if (sec.count > show) html += '<div class="omr-row">… 至第' + sec.count + "题</div>";
      } else if (sec.type === "blank" || sec.type === "judge") {
        var n = Math.min(sec.count, 4);
        for (var j = 1; j <= n; j++) {
          html += '<div class="omr-row">' + j + ". ________　　";
          if (sec.type === "judge") html += "（对/错 或 &gt; / &lt;）";
          html += "</div>";
        }
        if (sec.count > n) html += '<div class="omr-row">… 共' + sec.count + "题</div>";
      } else {
        for (var k = 1; k <= Math.min(sec.count, 2); k++) {
          html += '<div class="omr-row">' + k + ". 【书写答题区】________________</div>";
        }
      }
    });
    html += '<div class="hint" style="margin-top:10px;">扫描二维码可直接关联本场考试并上传识别数据</div>';
    currentSheetHtml = html;
    var box = $("sheetPreviewBox");
    if (box) box.innerHTML = html;
  }

  function initSheet() {
    var sel = $("sheetPaperSelect");
    if (sel) {
      sel.innerHTML = papers.map(function (p) {
        return '<option value="' + p.id + '">' + p.name + "（" + p.structure + "）</option>";
      }).join("");
      sel.addEventListener("change", function () {
        var p = papers.find(function (x) { return x.id === sel.value; });
        if ($("sheetPaperHint") && p) {
          $("sheetPaperHint").textContent = "科目：" + p.subject + " · 结构：" + p.structure;
        }
      });
      sel.dispatchEvent(new Event("change"));
    }
    rebind("btnGenSheet", "click", function () {
      var p = papers.find(function (x) { return x.id === ($("sheetPaperSelect") && $("sheetPaperSelect").value); }) || papers[0];
      var mode = ($("sheetMode") && $("sheetMode").value) || "混合模式";
      var tpl = ($("sheetTemplate") && $("sheetTemplate").value) || "a4h";
      sheetEditing = false;
      if ($("sheetEditBadge")) $("sheetEditBadge").style.display = "none";
      if ($("sheetEditActions")) $("sheetEditActions").style.display = "none";
      renderSheetPreview(p, mode, tpl);
      if ($("sheetPreviewArea")) $("sheetPreviewArea").style.display = "block";
      toast("已按「" + p.name + "」结构与预设模板生成答题卡");
    });
    rebind("btnExportSheet", "click", function () {
      if (!$("sheetPreviewArea") || $("sheetPreviewArea").style.display === "none") {
        toast("请先生成答题卡");
        return;
      }
      var title = ($("sheetTitle") && $("sheetTitle").textContent) || "答题卡";
      var text = title + "\n\n" + ($("sheetPreviewBox") ? $("sheetPreviewBox").innerText : "");
      downloadText(title.replace(/\s+/g, "_") + ".txt", text);
      toast("已导出下载：" + title + ".txt");
    });
    rebind("btnEditSheet", "click", function () {
      if (!$("sheetPreviewArea") || $("sheetPreviewArea").style.display === "none") {
        toast("请先生成答题卡");
        return;
      }
      sheetEditing = true;
      if ($("sheetEditBadge")) $("sheetEditBadge").style.display = "";
      if ($("sheetEditActions")) $("sheetEditActions").style.display = "flex";
      var title = $("sheetTitle");
      if (title) {
        title.contentEditable = "true";
        title.style.outline = "1px dashed #1677ff";
      }
      toast("已进入二次编辑：可改标题，可增加填空行");
    });
    rebind("btnSaveSheetEdit", "click", function () {
      sheetEditing = false;
      var title = $("sheetTitle");
      if (title) {
        title.contentEditable = "false";
        title.style.outline = "none";
      }
      if ($("sheetEditBadge")) $("sheetEditBadge").style.display = "none";
      if ($("sheetEditActions")) $("sheetEditActions").style.display = "none";
      if ($("sheetPreviewBox")) currentSheetHtml = $("sheetPreviewBox").innerHTML;
      toast("二次编辑已保存");
    });
    rebind("btnAddSheetBlank", "click", function () {
      var box = $("sheetPreviewBox");
      if (!box) return;
      var div = document.createElement("div");
      div.className = "omr-row";
      div.textContent = "（增补）填空：________";
      box.appendChild(div);
      toast("已增加填空行");
    });
  }

  /* ========== OCR ========== */
  var ocrExams = [
    {
      id: "e1",
      name: "高等数学期末（混合卡）",
      fields: [
        { key: "学号", answer: "2024010235", sample: "2024010235", conf: 98 },
        { key: "考号", answer: "A1035", sample: "A1035", conf: 96 },
        { key: "单词题1", answer: "limit", sample: "limit", conf: 93 },
        { key: "单词题2", answer: "integral", sample: "integrl", conf: 81 },
        { key: "判断题1", answer: "对", sample: "对", conf: 95 },
        { key: "判断题2", answer: ">", sample: ">", conf: 92 },
        { key: "判断题3", answer: "<", sample: ">", conf: 88 }
      ]
    },
    {
      id: "e2",
      name: "大学英语期末（OCR卡）",
      fields: [
        { key: "学号", answer: "2024031188", sample: "2024031188", conf: 97 },
        { key: "考号", answer: "E2201", sample: "E2201", conf: 95 },
        { key: "单词题1", answer: "environment", sample: "environment", conf: 94 },
        { key: "单词题2", answer: "challenge", sample: "challange", conf: 79 },
        { key: "判断题1", answer: "T", sample: "T", conf: 96 },
        { key: "判断题2", answer: "F", sample: "F", conf: 91 }
      ]
    },
    {
      id: "e3",
      name: "程序设计期末（判断+填空）",
      fields: [
        { key: "学号", answer: "2024020456", sample: "2024020456", conf: 99 },
        { key: "考号", answer: "C088", sample: "C088", conf: 97 },
        { key: "单词题1", answer: "pointer", sample: "pointer", conf: 92 },
        { key: "判断题1", answer: "对", sample: "对", conf: 94 },
        { key: "判断题2", answer: "<", sample: "<", conf: 90 },
        { key: "判断题3", answer: "错", sample: "对", conf: 85 }
      ]
    }
  ];

  function initOcr() {
    var sel = $("ocrExamSelect");
    if (sel) {
      sel.innerHTML = ocrExams.map(function (e) {
        return '<option value="' + e.id + '">' + e.name + "</option>";
      }).join("");
      sel.addEventListener("change", function () {
        var ex = ocrExams.find(function (x) { return x.id === sel.value; });
        if ($("ocrExamHint") && ex) {
          $("ocrExamHint").textContent = "本场识别字段：学号、考号、字母/单词题、判断题（对错/>/<）。不含涂黑选择题。";
        }
      });
      sel.dispatchEvent(new Event("change"));
    }
    rebind("btnOcrUpload", "click", function () { $("ocrFileInput") && $("ocrFileInput").click(); });
    if ($("ocrFileInput") && !$("ocrFileInput")._bound) {
      $("ocrFileInput")._bound = true;
      $("ocrFileInput").addEventListener("change", function () {
        if (this.files && this.files.length) {
          $("ocrFileTip").textContent = "已选 " + this.files.length + " 个：" + this.files[0].name;
          toast("已上传答题卡图片");
        }
      });
    }
    rebind("btnOcrStart", "click", function () {
      if (!$("ocrFileInput") || !$("ocrFileInput").files || !$("ocrFileInput").files.length) {
        toast("请先上传答题卡图片");
        return;
      }
      var ex = ocrExams.find(function (x) { return x.id === ($("ocrExamSelect") && $("ocrExamSelect").value); }) || ocrExams[0];
      var rows = [];
      var scoreable = 0;
      var correct = 0;
      ex.fields.forEach(function (f) {
        if (f.key === "学号" && $("ocrOptSid") && !$("ocrOptSid").checked) return;
        if (f.key === "考号" && $("ocrOptEid") && !$("ocrOptEid").checked) return;
        if (f.key.indexOf("单词") === 0 && $("ocrOptWord") && !$("ocrOptWord").checked) return;
        if (f.key.indexOf("判断") === 0 && $("ocrOptJudge") && !$("ocrOptJudge").checked) return;
        var auto = !($("ocrOptScore") && !$("ocrOptScore").checked);
        var hit = String(f.sample).toLowerCase() === String(f.answer).toLowerCase();
        var isId = f.key === "学号" || f.key === "考号";
        if (!isId && auto) {
          scoreable++;
          if (hit) correct++;
        }
        var scoreTxt = isId ? "—" : (!auto ? "未评分" : (hit ? '<span class="tag tag-green">得分</span>' : '<span class="tag tag-red">不得分</span>'));
        rows.push("<tr><td>" + f.key + "</td><td>" + f.sample + "</td><td>" +
          (isId ? "—" : f.answer) + "</td><td>" + f.conf + "%</td><td>" + scoreTxt + "</td></tr>");
      });
      $("ocrResultBody").innerHTML = rows.join("") || '<tr><td colspan="5">无识别字段</td></tr>';
      $("ocrScoreTip").textContent = scoreable
        ? ("自动评分：" + correct + "/" + scoreable + "（对照标准答案）· 来源：" + $("ocrFileInput").files[0].name + " · 考试：" + ex.name)
        : ("识别完成（未启用自动评分）· 考试：" + ex.name);
      toast("OCR 识别完成" + (scoreable ? "，已自动评分" : ""));
    });
  }

  /* ========== 成绩分析 ========== */
  var paperItems = [
    { name: "选择题第1题", type: "选择题", full: 2, avg: 1.84, rate: 92, kp: "极限" },
    { name: "选择题第2题", type: "选择题", full: 2, avg: 1.50, rate: 75, kp: "连续" },
    { name: "填空题第1题", type: "填空题", full: 3, avg: 2.10, rate: 70, kp: "导数" },
    { name: "填空题第2题", type: "填空题", full: 3, avg: 1.80, rate: 60, kp: "积分" },
    { name: "解答题第一大题第1小题", type: "大题", full: 6, avg: 4.20, rate: 70, kp: "微分方程" },
    { name: "解答题第一大题第2小题", type: "大题", full: 6, avg: 3.60, rate: 60, kp: "微分方程" },
    { name: "解答题第二大题第1小题", type: "大题", full: 8, avg: 5.20, rate: 65, kp: "级数" }
  ];
  var classMetrics = [
    { course: "高等数学", max: 96, min: 51, avg: 78.2, excellent: 18, pass: 93, fail: 7, variance: 86.4 },
    { course: "大学英语", max: 94, min: 58, avg: 80.1, excellent: 22, pass: 96, fail: 4, variance: 62.1 },
    { course: "程序设计", max: 100, min: 45, avg: 74.5, excellent: 15, pass: 89, fail: 11, variance: 110.2 }
  ];

  function initAnalysis() {
    // 试卷分析
    var itemBody = document.querySelector("#paperItemScoreTable tbody");
    if (itemBody) {
      itemBody.innerHTML = paperItems.map(function (it) {
        return "<tr><td>" + it.name + "</td><td>" + it.type + "</td><td>" + it.full +
          "</td><td>" + it.avg.toFixed(2) + "</td><td>" + it.rate + "%</td><td>" + it.kp + "</td></tr>";
      }).join("");
    }
    var typeMap = {};
    paperItems.forEach(function (it) {
      if (!typeMap[it.type]) typeMap[it.type] = { type: it.type, n: 0, full: 0, avg: 0 };
      typeMap[it.type].n++;
      typeMap[it.type].full += it.full;
      typeMap[it.type].avg += it.avg;
    });
    var types = Object.keys(typeMap).map(function (k) { return typeMap[k]; });
    var typeBody = document.querySelector("#paperTypeTable tbody");
    if (typeBody) {
      typeBody.innerHTML = types.map(function (t) {
        var rate = Math.round(t.avg / t.full * 100);
        return "<tr><td>" + t.type + "</td><td>" + t.n + "</td><td>" + t.full +
          "</td><td>" + t.avg.toFixed(2) + "</td><td>" + rate + "%</td></tr>";
      }).join("");
    }
    if ($("paperTypeChart")) {
      $("paperTypeChart").innerHTML = barsHtml(types.map(function (t) {
        return { name: t.type, v: Math.round(t.avg / t.full * 100), label: Math.round(t.avg / t.full * 100) + "%" };
      }), 100);
    }
    var kpMap = {};
    paperItems.forEach(function (it) {
      if (!kpMap[it.kp]) kpMap[it.kp] = { name: it.kp, items: [], sum: 0 };
      kpMap[it.kp].items.push(it.name);
      kpMap[it.kp].sum += it.rate;
    });
    var kps = Object.keys(kpMap).map(function (k) {
      var o = kpMap[k];
      return { name: o.name, items: o.items.join("、"), rate: Math.round(o.sum / o.items.length) };
    });
    var kpBody = document.querySelector("#paperKpTable tbody");
    if (kpBody) {
      kpBody.innerHTML = kps.map(function (k) {
        return "<tr><td>" + k.name + "</td><td>" + k.items + "</td><td>" + k.rate + "%</td></tr>";
      }).join("");
    }
    if ($("paperKpChart")) {
      $("paperKpChart").innerHTML = barsHtml(kps.map(function (k) {
        return { name: k.name, v: k.rate, label: k.rate + "%" };
      }), 100);
    }
    if ($("paperDistChart")) {
      $("paperDistChart").innerHTML = barsHtml([
        { name: "<60", v: 3, label: 3, color: "#ff4d4f" },
        { name: "60-69", v: 18, label: 18 },
        { name: "70-79", v: 28, label: 28 },
        { name: "80-89", v: 36, label: 36 },
        { name: "≥90", v: 20, label: 20, color: "#52c41a" }
      ], 40);
    }
    if ($("paperAbsentBox")) {
      $("paperAbsentBox").innerHTML =
        "<p>应考 <strong>108</strong> 人 · 实考 <strong>105</strong> 人 · 缺考 <strong>3</strong> 人</p>" +
        "<p>缺考率 <strong>2.8%</strong></p>" +
        '<div class="chart-box" style="margin-top:12px;">' +
        barsHtml([
          { name: "实考", v: 105, label: 105, color: "#1677ff" },
          { name: "缺考", v: 3, label: 3, color: "#ff4d4f" }
        ], 110) + "</div>" +
        "<p class='hint' style='margin-top:28px;'>缺考名单示例：2024010007、2024010033、2024010091</p>";
    }
    rebind("btnExportPaperAnalysis", "click", function () {
      var lines = ["试卷分析导出", "难度0.72 信度0.85 效度0.78 区分度0.41", "", "小题得分："];
      paperItems.forEach(function (it) {
        lines.push(it.name + " 平均" + it.avg + "/" + it.full + " 得分率" + it.rate + "% 知识点:" + it.kp);
      });
      lines.push("", "缺考：3/108（2.8%）");
      downloadText("试卷分析.txt", lines.join("\n"));
      toast("已导出试卷分析");
    });

    // 课程总体
    var grades = [
      { name: "甲", range: "90-100", n: 20, pct: 19 },
      { name: "乙", range: "80-89", n: 36, pct: 34 },
      { name: "丙", range: "70-79", n: 28, pct: 27 },
      { name: "丁", range: "60-69", n: 18, pct: 17 },
      { name: "不及格", range: "<60", n: 3, pct: 3 }
    ];
    if ($("courseGradeBody")) {
      $("courseGradeBody").innerHTML = grades.map(function (g) {
        return "<tr><td>" + g.name + "</td><td>" + g.range + "</td><td>" + g.n + "</td><td>" + g.pct + "%</td></tr>";
      }).join("");
    }
    if ($("courseGradeChart")) {
      $("courseGradeChart").innerHTML = barsHtml(grades.map(function (g) {
        return { name: g.name + "(" + g.range + ")", v: g.n, label: g.n };
      }), 40);
    }
    if ($("courseNormalChart")) {
      // 简易正态曲线采样柱
      var normal = [2, 5, 12, 22, 30, 36, 30, 22, 12, 5, 2];
      $("courseNormalChart").innerHTML = barsHtml(normal.map(function (v, i) {
        return { name: String(40 + i * 6), v: v, label: v };
      }), 40);
    }
    if ($("courseNormalTip")) {
      $("courseNormalTip").textContent = "正态性分析：均值 76.4，标准差约 9.3，曲线近似正态（略右偏）。";
    }
    if ($("courseClassBody")) {
      $("courseClassBody").innerHTML =
        "<tr><td>01班</td><td>78.2</td><td>93%</td><td>30%</td><td><span class='tag tag-green'>高于课程均值</span></td></tr>" +
        "<tr><td>02班</td><td>74.1</td><td>88%</td><td>22%</td><td><span class='tag tag-orange'>低于课程均值</span></td></tr>" +
        "<tr><td>03班</td><td>76.9</td><td>92%</td><td>28%</td><td><span class='tag tag-blue'>接近均值</span></td></tr>";
    }
    rebind("btnExportCourseAnalysis", "click", function () {
      var lines = ["课程总体成绩分析-高等数学", "最高96 最低42 平均76.4", "", "等级分布："];
      grades.forEach(function (g) { lines.push(g.name + " " + g.range + " " + g.n + "人 " + g.pct + "%"); });
      lines.push("", "正态：近似正态，均值76.4");
      downloadText("课程总体成绩分析.txt", lines.join("\n"));
      toast("已导出课程总体成绩分析");
    });

    // 班级分析
    if ($("classMetricBody")) {
      $("classMetricBody").innerHTML = classMetrics.map(function (c) {
        return "<tr><td>" + c.course + "</td><td>" + c.max + "</td><td>" + c.min + "</td><td>" + c.avg +
          "</td><td>" + c.excellent + "%</td><td>" + c.pass + "%</td><td>" + c.fail + "%</td><td>" + c.variance + "</td></tr>";
      }).join("");
    }
    if ($("classChartGrid")) {
      var dims = [
        { key: "max", title: "最高分对比" },
        { key: "min", title: "最低分对比" },
        { key: "avg", title: "平均分对比" },
        { key: "excellent", title: "优秀率对比(%)" },
        { key: "pass", title: "及格率对比(%)" },
        { key: "fail", title: "不及格率对比(%)" },
        { key: "variance", title: "方差对比" }
      ];
      $("classChartGrid").innerHTML = dims.map(function (d) {
        var items = classMetrics.map(function (c) {
          return { name: c.course.replace("大学", "").replace("程序设计", "程设").replace("高等数学", "高数"), v: c[d.key], label: c[d.key] };
        });
        return '<div class="card"><div class="card-hd">' + d.title + '</div><div class="card-bd"><div class="chart-box">' +
          barsHtml(items) + "</div></div></div>";
      }).join("");
    }
    rebind("btnExportClassAnalysis", "click", function () {
      var lines = ["班级考核数据分析-教学班01", "课程,最高分,最低分,平均分,优秀率,及格率,不及格率,方差"];
      classMetrics.forEach(function (c) {
        lines.push([c.course, c.max, c.min, c.avg, c.excellent + "%", c.pass + "%", c.fail + "%", c.variance].join(","));
      });
      downloadText("班级考核数据分析.csv", lines.join("\n"));
      toast("已导出班级考核数据分析");
    });
  }

  function boot() {
    initScheme();
    initSheet();
    initOcr();
    initAnalysis();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(boot, 0);
    });
  } else {
    setTimeout(boot, 0);
  }
})();
