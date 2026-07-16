/* 同事模块脚本（考核方案/答题卡/OCR/分析/权限/建库/标签/查重）
 * 已去掉与考试项目冲突的 showPage/导航；考试项目由宿主 app.js 负责。
 */
(function () {
  "use strict";

  if (typeof window.openModal !== "function") {
    window.openModal = function (id) {
      var m = document.getElementById(id);
      if (m) m.classList.add("show");
    };
  }
  if (typeof window.closeModal !== "function") {
    window.closeModal = function (id) {
      var m = document.getElementById(id);
      if (m) m.classList.remove("show");
    };
  }
  if (typeof window.toast !== "function") {
    window.toast = function (msg) {
      var el = document.getElementById("toast");
      if (!el) {
        el = document.createElement("div");
        el.id = "toast";
        el.style.cssText = "position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:4px;z-index:2000;font-size:13px;";
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.display = "block";
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(function () { el.style.display = "none"; }, 2000);
    };
  }

  window.runDupCheck = function () {
    runDupCheckInternal();
  };

  /* 试卷查重：多选对比卷 + 一键定位重复题 */
  var DUP_POOL = [
    {
      id: "d1",
      bankId: "bank-2025a",
      bankName: "高等数学期末A卷（2025秋）",
      curNo: "第3题",
      curType: "单选 · 极限计算",
      curStem: "求极限 lim(x→0) (sin x)/x 的值。",
      srcNo: "第5题",
      srcStem: "求极限 lim(x→0) (sin x)/x 。",
      sim: 100
    },
    {
      id: "d2",
      bankId: "bank-2025b",
      bankName: "高等数学期末B卷（2025秋）",
      curNo: "第8题",
      curType: "填空 · 导数定义",
      curStem: "设 f(x)=x²，按定义求 f'(1)=______。",
      srcNo: "第2题",
      srcStem: "用定义求 f(x)=x² 在 x=1 处的导数。",
      sim: 92
    },
    {
      id: "d3",
      bankId: "bank-2025s",
      bankName: "高等数学期末A卷（2025春）",
      curNo: "第15题",
      curType: "解答 · 积分应用",
      curStem: "求曲线 y=x² 与直线 y=1 所围图形绕 x 轴旋转所得旋转体体积。",
      srcNo: "第14题",
      srcStem: "求 y=x² 与 y=1 所围区域绕 x 轴旋转的体积。",
      sim: 85
    },
    {
      id: "d4",
      bankId: "bank-2024a",
      bankName: "高等数学期末A卷（2024秋）",
      curNo: "第6题",
      curType: "单选 · 连续函数",
      curStem: "若 f(x) 在 [a,b] 连续，则下列结论正确的是。",
      srcNo: "第4题",
      srcStem: "函数 f(x) 在闭区间 [a,b] 上连续，则必有……",
      sim: 88
    },
    {
      id: "d5",
      bankId: "bank-mid",
      bankName: "高等数学期中卷（2025秋）",
      curNo: "第11题",
      curType: "填空 · 微分中值",
      curStem: "拉格朗日中值定理的条件与结论是______。",
      srcNo: "第9题",
      srcStem: "简述拉格朗日中值定理。",
      sim: 80
    }
  ];

  var dupLastResults = [];
  var dupLocateIndex = 0;

  function getSelectedDupBanks() {
    return Array.prototype.filter.call(
      document.querySelectorAll("#dupBankList input[type=checkbox]:checked"),
      function () { return true; }
    ).map(function (cb) {
      return { id: cb.value, name: cb.getAttribute("data-name") || cb.value };
    });
  }

  function updateDupSelectedHint() {
    var hint = document.getElementById("dupSelectedHint");
    var n = getSelectedDupBanks().length;
    if (hint) hint.textContent = "已选 " + n + " 份";
  }

  window.dupSelectAll = function (on) {
    document.querySelectorAll("#dupBankList input[type=checkbox]").forEach(function (cb) {
      cb.checked = !!on;
    });
    updateDupSelectedHint();
  };

  function bindDupBankChecks() {
    document.querySelectorAll("#dupBankList input[type=checkbox]").forEach(function (cb) {
      cb.addEventListener("change", updateDupSelectedHint);
    });
    updateDupSelectedHint();
  }

  function runDupCheckInternal() {
    var selected = getSelectedDupBanks();
    if (!selected.length) {
      toast("请至少勾选一份对比卷库试卷");
      return;
    }
    var ids = {};
    selected.forEach(function (s) { ids[s.id] = true; });
    dupLastResults = DUP_POOL.filter(function (d) { return ids[d.bankId]; });

    var box = document.getElementById("dupResult");
    var body = document.getElementById("dupResultBody");
    var rateTag = document.getElementById("dupRateTag");
    var compareHint = document.getElementById("dupCompareHint");
    if (!box || !body) return;

    // 示意：选得越多，检出重复可能越多，比例略升
    var rate = (12 + dupLastResults.length * 2.2).toFixed(1);
    if (rateTag) rateTag.textContent = rate + "%";
    if (compareHint) {
      compareHint.textContent = "· 对比 " + selected.length + " 份卷 · 检出重复题 " + dupLastResults.length + " 处";
    }

    if (!dupLastResults.length) {
      body.innerHTML = "<tr><td colspan='5' style='text-align:center;color:#999;'>所选对比卷中未检出重复题</td></tr>";
    } else {
      body.innerHTML = dupLastResults.map(function (d, idx) {
        return "<tr id='dup-row-" + d.id + "'>" +
          "<td>" + d.curNo + " " + d.curType + "</td>" +
          "<td>" + escapeAttr(d.bankName) + "</td>" +
          "<td>" + d.srcNo + "</td>" +
          "<td>" + d.sim + "%</td>" +
          "<td class='ops'>" +
          "<button type='button' class='btn-link' onclick=\"locateDupQuestion(" + idx + ")\">定位查看</button>" +
          "<button type='button' class='btn-link' onclick=\"editDupQuestion(" + idx + ")\">编辑重复题</button>" +
          "</td></tr>";
      }).join("");
    }

    box.style.display = "block";
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    toast("查重完成：对比 " + selected.length + " 份卷，重复比例 " + rate + "%，检出 " + dupLastResults.length + " 处");
  }

  function showDupLocateModal(index) {
    if (!dupLastResults.length) {
      toast("暂无重复题可定位");
      return;
    }
    if (index < 0) index = 0;
    if (index >= dupLastResults.length) index = dupLastResults.length - 1;
    dupLocateIndex = index;
    var d = dupLastResults[index];
    var title = document.getElementById("dupLocateTitle");
    var nav = document.getElementById("dupLocateNav");
    var compare = document.getElementById("dupLocateCompare");
    var actions = document.getElementById("dupLocateActions");
    var prev = document.getElementById("dupLocatePrev");
    var next = document.getElementById("dupLocateNext");

    if (title) title.textContent = "定位重复题 · " + d.curNo + "（" + (index + 1) + "/" + dupLastResults.length + "）";
    if (nav) {
      nav.textContent = "已一键定位到当前卷第 " + d.curNo.replace("第", "").replace("题", "") +
        " 题，与「" + d.bankName + "」" + d.srcNo + " 相似度 " + d.sim + "%";
    }
    if (compare) {
      compare.innerHTML =
        "<div class='dup-compare-box hit'><div class='lab'>当前试卷 · " + d.curNo + " · " + d.curType + "</div>" +
        "<div class='stem'>" + escapeAttr(d.curStem) + "</div>" +
        "<div class='hint'>已在结果列表中高亮对应行</div></div>" +
        "<div class='dup-compare-box'><div class='lab'>来源卷 · " + escapeAttr(d.bankName) + " · " + d.srcNo + "</div>" +
        "<div class='stem'>" + escapeAttr(d.srcStem) + "</div>" +
        "<div class='hint'>相似度 " + d.sim + "%</div></div>";
    }
    if (actions) {
      actions.innerHTML =
        "<button type='button' class='btn btn-primary' onclick=\"editDupQuestion(" + index + ")\">编辑当前重复题</button>" +
        "<button type='button' class='btn' onclick=\"jumpDupResultRow('" + d.id + "')\">回到结果列表定位行</button>";
    }
    if (prev) prev.disabled = index <= 0;
    if (next) next.disabled = index >= dupLastResults.length - 1;

    // 高亮结果行
    document.querySelectorAll("#dupResultBody tr").forEach(function (tr) {
      tr.classList.remove("dup-highlight-row");
    });
    var row = document.getElementById("dup-row-" + d.id);
    if (row) row.classList.add("dup-highlight-row");

    openModal("modalDupLocate");
  }

  window.locateDupQuestion = function (index) {
    showDupLocateModal(index);
  };

  window.locateAllDupQuestions = function () {
    if (!dupLastResults.length) {
      toast("请先完成查重且存在重复题");
      return;
    }
    showDupLocateModal(0);
    toast("已进入重复题定位，可用上一题/下一题逐条查看（共 " + dupLastResults.length + " 处）");
  };

  window.dupLocateStep = function (delta) {
    showDupLocateModal(dupLocateIndex + delta);
  };

  window.jumpDupResultRow = function (id) {
    closeModal("modalDupLocate");
    var row = document.getElementById("dup-row-" + id);
    if (row) {
      row.classList.add("dup-highlight-row");
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    toast("已定位到结果列表中的重复题行");
  };

  window.editDupQuestion = function (index) {
    var d = dupLastResults[index];
    if (!d) return;
    closeModal("modalDupLocate");
    dupEditIndex = index;

    var title = document.getElementById("dupEditTitle");
    var hint = document.getElementById("dupEditHint");
    var no = document.getElementById("dupEditNo");
    var type = document.getElementById("dupEditType");
    var stem = document.getElementById("dupEditStem");
    var src = document.getElementById("dupEditSrc");
    var oldSim = document.getElementById("dupEditOldSim");
    var newSim = document.getElementById("dupEditNewSim");

    if (title) title.textContent = "编辑重复题 · " + d.curNo;
    if (hint) {
      hint.textContent = "正在编辑当前卷第「" + d.curNo + "」。保存后将同步到查重结果，并按修改内容重新估算与「" +
        d.bankName + " · " + d.srcNo + "」的相似度。";
    }
    if (no) no.value = d.curNo;
    if (type) type.value = d.curType;
    if (stem) stem.value = d.curStem;
    if (src) src.value = "【" + d.bankName + " · " + d.srcNo + "】\n" + d.srcStem;
    if (oldSim) oldSim.textContent = d.sim + "%";
    if (newSim) newSim.textContent = d.sim + "%（未修改）";

    if (stem) {
      stem.oninput = function () {
        var est = estimateDupSim(stem.value, d.srcStem);
        if (newSim) newSim.textContent = est + "%";
      };
    }

    openModal("modalDupEdit");
  };

  var dupEditIndex = -1;

  function estimateDupSim(a, b) {
    a = (a || "").replace(/\s+/g, "");
    b = (b || "").replace(/\s+/g, "");
    if (!a || !b) return 0;
    // 简易重合度：公共字符占比（演示用）
    var map = {};
    for (var i = 0; i < b.length; i++) map[b.charAt(i)] = (map[b.charAt(i)] || 0) + 1;
    var hit = 0;
    for (var j = 0; j < a.length; j++) {
      var ch = a.charAt(j);
      if (map[ch] > 0) {
        hit++;
        map[ch]--;
      }
    }
    var ratio = (2 * hit) / (a.length + b.length);
    return Math.max(5, Math.min(100, Math.round(ratio * 100)));
  }

  window.saveDupQuestionEdit = function () {
    if (dupEditIndex < 0 || !dupLastResults[dupEditIndex]) {
      toast("无可保存的编辑项");
      return;
    }
    var d = dupLastResults[dupEditIndex];
    var typeEl = document.getElementById("dupEditType");
    var stemEl = document.getElementById("dupEditStem");
    var newType = typeEl ? typeEl.value.trim() : d.curType;
    var newStem = stemEl ? stemEl.value.trim() : d.curStem;
    if (!newStem) {
      toast("题干不能为空");
      return;
    }

    var oldSim = d.sim;
    var newSim = estimateDupSim(newStem, d.srcStem);

    // 写回结果列表与数据池
    d.curType = newType || d.curType;
    d.curStem = newStem;
    d.sim = newSim;
    for (var i = 0; i < DUP_POOL.length; i++) {
      if (DUP_POOL[i].id === d.id) {
        DUP_POOL[i].curType = d.curType;
        DUP_POOL[i].curStem = d.curStem;
        DUP_POOL[i].sim = d.sim;
        break;
      }
    }

    closeModal("modalDupEdit");
    refreshDupResultTable();
    toast("已保存「" + d.curNo + "」修改：相似度 " + oldSim + "% → " + newSim + "%");
  };

  function refreshDupResultTable() {
    var body = document.getElementById("dupResultBody");
    var rateTag = document.getElementById("dupRateTag");
    var compareHint = document.getElementById("dupCompareHint");
    if (!body) return;

    if (!dupLastResults.length) {
      body.innerHTML = "<tr><td colspan='5' style='text-align:center;color:#999;'>所选对比卷中未检出重复题</td></tr>";
      return;
    }

    // 按最新相似度重算示意总比例
    var avg = 0;
    dupLastResults.forEach(function (x) { avg += x.sim; });
    avg = (avg / dupLastResults.length * 0.22).toFixed(1);
    if (rateTag) rateTag.textContent = avg + "%";
    if (compareHint) {
      compareHint.textContent = "· 检出重复题 " + dupLastResults.length + " 处（已含编辑后相似度）";
    }

    body.innerHTML = dupLastResults.map(function (d, idx) {
      return "<tr id='dup-row-" + d.id + "'>" +
        "<td>" + d.curNo + " " + escapeAttr(d.curType) + "</td>" +
        "<td>" + escapeAttr(d.bankName) + "</td>" +
        "<td>" + d.srcNo + "</td>" +
        "<td>" + d.sim + "%</td>" +
        "<td class='ops'>" +
        "<button type='button' class='btn-link' onclick=\"locateDupQuestion(" + idx + ")\">定位查看</button>" +
        "<button type='button' class='btn-link' onclick=\"editDupQuestion(" + idx + ")\">编辑重复题</button>" +
        "</td></tr>";
    }).join("");
  }

  /* ========== 1. 考核方案 ========== */
  var schemeBaseline = null;
  var schemeDirty = false;
  var FORM_OPTS_F = ["线上作业", "线下提交", "教师评定", "考勤+互动", "在线考试", "纸笔考试"];
  var FORM_OPTS_S = ["纸笔+网上阅卷", "在线考试", "纸笔考试", "课程设计答辩", "综合考查"];

  var schemeTasks = {
    f: [
      { name: "平时作业", form: "线上作业", weight: 15, std: "按时完成且正确率≥60%" },
      { name: "课堂表现", form: "教师评定", weight: 10, std: "考勤+发言综合评分" },
      { name: "阶段测验", form: "在线考试", weight: 15, std: "百分制折算" }
    ],
    s: [
      { name: "期末考试", form: "纸笔+网上阅卷", weight: 60, std: "闭卷，百分制" }
    ]
  };

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value : "";
  }

  function snapshotScheme() {
    return JSON.stringify({
      course: val("schemeCourse"),
      credit: val("schemeCredit"),
      scoreType: val("schemeScoreType"),
      scoreDetail: collectScoreDetail(),
      veto: val("schemeVeto"),
      tasks: schemeTasks
    });
  }

  function collectScoreDetail() {
    var type = val("schemeScoreType");
    if (type === "score-100" || type === "score-150") {
      return {
        passLine: val("scorePassLine"),
        excellentLine: val("scoreExcellentLine")
      };
    }
    if (type === "grade-abcd") {
      return {
        a: val("gradeA"),
        b: val("gradeB"),
        c: val("gradeC"),
        d: val("gradeD")
      };
    }
    if (type === "grade-jia") {
      return {
        jia: val("gradeJia"),
        yi: val("gradeYi"),
        bing: val("gradeBing"),
        ding: val("gradeDing")
      };
    }
    return {};
  }

  var SCORE_TYPE_LABELS = {
    "score-100": "分数制 · 满分 100",
    "score-150": "分数制 · 满分 150",
    "grade-abcd": "等级制 · A / B / C / D",
    "grade-jia": "等级制 · 甲 / 乙 / 丙 / 丁"
  };

  function renderSchemeScoreDetail() {
    var type = val("schemeScoreType") || "score-100";
    var title = document.getElementById("schemeScoreDetailTitle");
    var body = document.getElementById("schemeScoreDetailBody");
    if (!body) return;
    if (title) title.textContent = "成绩类型细则 · " + (SCORE_TYPE_LABELS[type] || type);

    if (type === "score-100") {
      body.innerHTML =
        "<div class='form-row'>" +
        "<div class='form-item'><label>满分</label><input value='100' readonly /></div>" +
        "<div class='form-item'><label>及格线</label><input id='scorePassLine' type='number' value='60' /></div>" +
        "<div class='form-item'><label>优秀线</label><input id='scoreExcellentLine' type='number' value='90' /></div>" +
        "</div>" +
        "<div class='hint'>总评按形成性/终结性权重折算为 0–100 分后登分统计。</div>";
    } else if (type === "score-150") {
      body.innerHTML =
        "<div class='form-row'>" +
        "<div class='form-item'><label>满分</label><input value='150' readonly /></div>" +
        "<div class='form-item'><label>及格线</label><input id='scorePassLine' type='number' value='90' /></div>" +
        "<div class='form-item'><label>优秀线</label><input id='scoreExcellentLine' type='number' value='135' /></div>" +
        "</div>" +
        "<div class='hint'>适用于部分课程满分 150 分制；权重汇总后按 150 分制登分。</div>";
    } else if (type === "grade-abcd") {
      body.innerHTML =
        "<div class='table-wrap'><table class='data'>" +
        "<thead><tr><th>等级</th><th>对应分数区间（百分制对照）</th><th>说明</th></tr></thead><tbody>" +
        "<tr><td>A</td><td><input id='gradeA' value='90 – 100' /></td><td>优秀</td></tr>" +
        "<tr><td>B</td><td><input id='gradeB' value='80 – 89' /></td><td>良好</td></tr>" +
        "<tr><td>C</td><td><input id='gradeC' value='70 – 79' /></td><td>中等</td></tr>" +
        "<tr><td>D</td><td><input id='gradeD' value='60 – 69' /></td><td>及格；&lt;60 为不及格</td></tr>" +
        "</tbody></table></div>" +
        "<div class='hint' style='margin-top:8px'>先按权重汇总百分制成绩，再映射为 A/B/C/D 等级。</div>";
    } else if (type === "grade-jia") {
      body.innerHTML =
        "<div class='table-wrap'><table class='data'>" +
        "<thead><tr><th>等级</th><th>对应分数区间（百分制对照）</th><th>说明</th></tr></thead><tbody>" +
        "<tr><td>甲</td><td><input id='gradeJia' value='90 – 100' /></td><td>优秀</td></tr>" +
        "<tr><td>乙</td><td><input id='gradeYi' value='80 – 89' /></td><td>良好</td></tr>" +
        "<tr><td>丙</td><td><input id='gradeBing' value='70 – 79' /></td><td>中等</td></tr>" +
        "<tr><td>丁</td><td><input id='gradeDing' value='60 – 69' /></td><td>及格；&lt;60 为不及格</td></tr>" +
        "</tbody></table></div>" +
        "<div class='hint' style='margin-top:8px'>先按权重汇总百分制成绩，再映射为 甲/乙/丙/丁 等级。</div>";
    }

    body.querySelectorAll("input, select").forEach(function (el) {
      el.addEventListener("input", markSchemeChanged);
      el.addEventListener("change", markSchemeChanged);
    });
  }

  function applyScoreDetailValues(detail) {
    if (!detail) return;
    Object.keys(detail).forEach(function (k) {
      var map = {
        passLine: "scorePassLine",
        excellentLine: "scoreExcellentLine",
        a: "gradeA", b: "gradeB", c: "gradeC", d: "gradeD",
        jia: "gradeJia", yi: "gradeYi", bing: "gradeBing", ding: "gradeDing"
      };
      var id = map[k];
      if (id && document.getElementById(id)) document.getElementById(id).value = detail[k];
    });
  }

  function sumWeights(list) {
    return list.reduce(function (s, t) {
      var w = Number(t.weight);
      return s + (isNaN(w) || w < 0 ? 0 : w);
    }, 0);
  }

  function fmtPct(n) {
    var x = Math.round(n * 10) / 10;
    return (Number.isInteger(x) ? String(x) : x.toFixed(1)) + "%";
  }

  function getSchemeRatioState() {
    var fRaw = sumWeights(schemeTasks.f);
    var sRaw = sumWeights(schemeTasks.s);
    var total = fRaw + sRaw;
    var fRatio = total > 0 ? (fRaw / total) * 100 : 0;
    var sRatio = total > 0 ? (sRaw / total) * 100 : 0;
    // 修正浮点：保证归一化后合计为 100
    if (total > 0) {
      sRatio = Math.round((100 - fRatio) * 10) / 10;
      fRatio = Math.round(fRatio * 10) / 10;
      if (Math.abs(fRatio + sRatio - 100) > 0.05) {
        sRatio = Math.round((100 - fRatio) * 10) / 10;
      }
    }
    return { fRaw: fRaw, sRaw: sRaw, total: total, fRatio: fRatio, sRatio: sRatio };
  }

  function itemNormPct(weight, total) {
    if (total <= 0) return 0;
    return Math.round((Number(weight) || 0) / total * 1000) / 10;
  }

  function recalcSchemeRatios() {
    var st = getSchemeRatioState();
    var f = st.fRatio;
    var s = st.sRatio;
    var total = st.total;

    setText("formativeRatioNum", fmtPct(f));
    setText("summativeRatioNum", fmtPct(s));
    setText("formativeRatioTitle", "（智能占比 " + fmtPct(f) + "）");
    setText("summativeRatioTitle", "（智能占比 " + fmtPct(s) + "）");

    var tip = document.getElementById("schemeWeightTip");
    var rawHint = document.getElementById("schemeRawWeightHint");
    if (rawHint) {
      rawHint.textContent = "原始权重合计 " + (Math.round(total * 10) / 10) +
        "（形成性 " + (Math.round(st.fRaw * 10) / 10) + " + 终结性 " + (Math.round(st.sRaw * 10) / 10) + "）";
    }

    if (tip) {
      if (total <= 0) {
        tip.style.background = "#fff1f0";
        tip.style.borderColor = "#ffa39e";
        tip.style.color = "#cf1322";
        tip.innerHTML = "当前任务权重均为 0，无法计算占比。请为形成性/终结性任务填写权重大于 0 的相对值。";
      } else if (Math.abs(total - 100) < 0.05) {
        tip.style.background = "#e6f4ff";
        tip.style.borderColor = "#91caff";
        tip.style.color = "#0958d9";
        tip.innerHTML = "原始权重合计恰好 <strong>100</strong>。智能占比：形成性 <strong>" +
          fmtPct(f) + "</strong> + 终结性 <strong>" + fmtPct(s) + "</strong> = 100%。";
      } else {
        tip.style.background = "#fff7e6";
        tip.style.borderColor = "#ffd591";
        tip.style.color = "#ad6800";
        tip.innerHTML = "原始权重合计为 <strong>" + (Math.round(total * 10) / 10) +
          "</strong>（" + (total < 100 ? "不足" : "超过") + " 100）。系统已按合计 <strong>智能归一化到 100%</strong>：" +
          "形成性 <strong>" + fmtPct(f) + "</strong>（" + (Math.round(st.fRaw * 10) / 10) + "/" +
          (Math.round(total * 10) / 10) + "）+ 终结性 <strong>" + fmtPct(s) + "</strong>（" +
          (Math.round(st.sRaw * 10) / 10) + "/" + (Math.round(total * 10) / 10) + "）。" +
          "登分统计将按该智能占比执行；也可点上方按钮把各任务权重改写成合计 100%。";
      }
    }

    // 更新每行「归一化后%」
    document.querySelectorAll("#formativeBody tr[data-kind], #summativeBody tr[data-kind]").forEach(function (tr) {
      var kind = tr.getAttribute("data-kind");
      var idx = Number(tr.getAttribute("data-idx"));
      var cell = tr.querySelector("[data-norm]");
      var list = schemeTasks[kind];
      if (!cell || !list || !list[idx]) return;
      cell.textContent = fmtPct(itemNormPct(list[idx].weight, total));
    });

    var desc = document.getElementById("scoreStatDesc");
    if (desc) {
      desc.textContent = "按智能归一化后的形成性 " + fmtPct(f) + " / 终结性 " + fmtPct(s) + " 汇总成绩，生成总评与等级";
    }

    refreshSchemeTasks();
    return st;
  }

  window.normalizeSchemeWeights = function () {
    var st = getSchemeRatioState();
    if (st.total <= 0) {
      toast("当前权重合计为 0，无法归一化");
      return;
    }
    if (Math.abs(st.total - 100) < 0.05) {
      toast("权重合计已是 100，无需归一化");
      return;
    }
    // 按比例缩放，最后一项微调保证合计精确为 100
    var all = [];
    schemeTasks.f.forEach(function (t, i) { all.push({ kind: "f", i: i, t: t }); });
    schemeTasks.s.forEach(function (t, i) { all.push({ kind: "s", i: i, t: t }); });
    var assigned = 0;
    all.forEach(function (item, idx) {
      if (idx === all.length - 1) {
        item.t.weight = Math.round((100 - assigned) * 10) / 10;
      } else {
        var w = Math.round((Number(item.t.weight) || 0) / st.total * 1000) / 10;
        item.t.weight = w;
        assigned += w;
      }
    });
    renderSchemeTables();
    markSchemeChanged();
    toast("已将各任务权重按比例归一化为合计 100%（形成性 " +
      fmtPct(getSchemeRatioState().fRatio) + " / 终结性 " + fmtPct(getSchemeRatioState().sRatio) + "）");
  };

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function optionsHtml(opts, selected) {
    return opts.map(function (o) {
      return "<option" + (o === selected ? " selected" : "") + ">" + o + "</option>";
    }).join("");
  }

  function renderSchemeTables() {
    var fBody = document.getElementById("formativeBody");
    var sBody = document.getElementById("summativeBody");
    if (!fBody || !sBody) return;
    var total = sumWeights(schemeTasks.f) + sumWeights(schemeTasks.s);

    fBody.innerHTML = schemeTasks.f.map(function (t, i) {
      return schemeRowHtml("f", i, t, FORM_OPTS_F, total);
    }).join("") || emptyRow("暂无形成性任务，请点击上方添加");

    sBody.innerHTML = schemeTasks.s.map(function (t, i) {
      return schemeRowHtml("s", i, t, FORM_OPTS_S, total);
    }).join("") || emptyRow("暂无终结性任务，请点击上方添加");

    bindSchemeRowEvents();
    recalcSchemeRatios();
  }

  function emptyRow(msg) {
    return "<tr><td colspan='6' style='text-align:center;color:#999;'>" + msg + "</td></tr>";
  }

  function schemeRowHtml(kind, index, t, opts, total) {
    var norm = itemNormPct(t.weight, total || 0);
    return (
      "<tr data-kind='" + kind + "' data-idx='" + index + "'>" +
      "<td><input data-field='name' value='" + escapeAttr(t.name) + "' /></td>" +
      "<td><select data-field='form'>" + optionsHtml(opts, t.form) + "</select></td>" +
      "<td><input data-field='weight' type='number' min='0' step='0.5' value='" + t.weight + "' style='width:90px' title='相对权重，不必合计恰好100' /></td>" +
      "<td><strong data-norm='1'>" + fmtPct(norm) + "</strong></td>" +
      "<td><input data-field='std' value='" + escapeAttr(t.std) + "' /></td>" +
      "<td class='ops'><button type='button' class='btn-link' data-del='" + kind + "' data-i='" + index + "'>删除</button></td>" +
      "</tr>"
    );
  }

  function escapeAttr(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function bindSchemeRowEvents() {
    var root = document.getElementById("page-scheme");
    if (!root) return;

    root.querySelectorAll("#formativeBody tr, #summativeBody tr").forEach(function (tr) {
      var kind = tr.getAttribute("data-kind");
      var idx = Number(tr.getAttribute("data-idx"));
      if (!kind || isNaN(idx)) return;

      tr.querySelectorAll("[data-field]").forEach(function (el) {
        var handler = function () {
          var field = el.getAttribute("data-field");
          var list = schemeTasks[kind];
          if (!list || !list[idx]) return;
          if (field === "weight") {
            list[idx].weight = Number(el.value) || 0;
            recalcSchemeRatios();
          } else {
            list[idx][field] = el.value;
          }
          markSchemeChanged();
        };
        el.addEventListener("input", handler);
        el.addEventListener("change", handler);
      });
    });

    root.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kind = btn.getAttribute("data-del");
        var i = Number(btn.getAttribute("data-i"));
        var list = schemeTasks[kind];
        if (!list || !list[i]) return;
        if (list.length <= 1) {
          toast(kind === "f" ? "形成性至少保留 1 项任务" : "终结性至少保留 1 项任务");
          return;
        }
        list.splice(i, 1);
        renderSchemeTables();
        markSchemeChanged();
        toast("已删除任务，占比已重新识别");
      });
    });
  }

  function markSchemeChanged() {
    setSchemeDirty(snapshotScheme() !== schemeBaseline);
  }

  window.addSchemeTask = function (kind) {
    var list = schemeTasks[kind];
    if (!list) return;
    if (kind === "f") {
      list.push({ name: "新形成性任务", form: "线上作业", weight: 5, std: "请填写评定标准" });
    } else {
      list.push({ name: "新终结性任务", form: "纸笔考试", weight: 10, std: "请填写评定标准" });
    }
    renderSchemeTables();
    markSchemeChanged();
    toast("已添加任务，请设置权重，系统将自动识别形成性/终结性占比");
  };

  function setSchemeDirty(dirty) {
    schemeDirty = dirty;
    var hint = document.getElementById("schemeDirtyHint");
    var btn = document.getElementById("btnSchemeSubmit");
    if (hint) {
      hint.textContent = dirty
        ? "方案已修改 · 需重新提交后才会关联最新考核任务"
        : "当前方案与已生效版本一致 · 无需重复提交";
      hint.style.color = dirty ? "#fa8c16" : "#999";
    }
    if (btn) {
      btn.disabled = !dirty;
      btn.title = dirty ? "" : "方案未变更，无需重复提交";
      btn.style.opacity = dirty ? "1" : "0.55";
    }
    refreshSchemeTasks();
  }

  function refreshSchemeTasks() {
    var forms = schemeTasks.f.concat(schemeTasks.s).map(function (t) { return t.form || ""; });
    var needOnlineExam = forms.some(function (f) { return f.indexOf("在线考试") >= 0; });
    var needOnlineMark = forms.some(function (f) {
      return f.indexOf("网上阅卷") >= 0 || f.indexOf("纸笔") >= 0;
    });
    var st = getSchemeRatioState();

    setTask("onlineMark", needOnlineMark,
      needOnlineMark ? "将自动关联" : "本方案不触发（未含纸笔/网上阅卷）");
    setTask("onlineExam", needOnlineExam,
      needOnlineExam ? "将自动关联" : "本方案不触发（未选用在线考试）");
    setTask("scoreStat", st.total > 0,
      st.total > 0
        ? "将自动关联（按智能占比 " + fmtPct(st.fRatio) + " / " + fmtPct(st.sRatio) + " 汇总）"
        : "权重无效，暂无法关联登分统计");
  }

  function setTask(key, on, statusText) {
    var el = document.querySelector('.task-link-item[data-task="' + key + '"]');
    if (!el) return;
    el.classList.toggle("on", on);
    el.classList.toggle("off", !on);
    var st = el.querySelector(".task-status");
    if (st) st.textContent = statusText;
  }

  window.saveSchemeDraft = function () {
    toast("草稿已保存（历史版本库已记录临时稿，未变更生效方案）");
  };

  window.submitScheme = function () {
    if (!schemeDirty) {
      toast("方案内容未变更，无需重复提交");
      return;
    }
    var st = recalcSchemeRatios();
    if (st.total <= 0) {
      toast("权重合计为 0，请先填写形成性/终结性任务权重");
      return;
    }
    schemeBaseline = snapshotScheme();
    setSchemeDirty(false);
    var tasks = [];
    document.querySelectorAll(".task-link-item.on .task-title").forEach(function (t) {
      tasks.push(t.textContent);
    });
    var tip = Math.abs(st.total - 100) < 0.05
      ? ""
      : "（原始合计 " + (Math.round(st.total * 10) / 10) + "，已智能归一化）";
    toast("方案已提交。形成性 " + fmtPct(st.fRatio) + " / 终结性 " + fmtPct(st.sRatio) +
      tip + "。已关联：" + tasks.join("、"));
  };

  window.viewHistoryScheme = function (ver) {
    var detail = document.getElementById("historyDetail");
    var data = HISTORY_SCHEMES[ver];
    if (!detail || !data) return;
    var fSum = sumWeights(data.tasks.f);
    var sSum = sumWeights(data.tasks.s);
    detail.style.display = "block";
    detail.innerHTML =
      "<strong>查看：" + data.title + "</strong>" +
      "<div class='hint' style='margin:8px 0'>可一键覆盖到当前填报表；覆盖后需重新提交才会正式生效。</div>" +
      "<p style='font-size:13px;line-height:1.8'>" +
      "成绩类型：" + (SCORE_TYPE_LABELS[data.scoreType] || data.scoreType) +
      (data.scoreDetailText ? "（" + data.scoreDetailText + "）" : "") + "<br/>" +
      "一票否决：" + data.veto + "<br/>" +
      "形成性（" + fmtPct(fSum) + "）：" + data.formative + "<br/>" +
      "终结性（" + fmtPct(sSum) + "）：" + data.summative + "<br/>" +
      "当时关联任务：" + data.linkTasks +
      "</p>" +
      "<div class='btn-group' style='margin-top:10px'>" +
      "<button type='button' class='btn btn-primary' onclick=\"applyHistoryScheme('" + ver + "')\">一键覆盖使用此版本</button>" +
      "</div>";
  };

  window.applyHistoryScheme = function (ver) {
    var data = HISTORY_SCHEMES[ver];
    if (!data) return;
    if (!confirm("确认用「" + data.title + "」一键覆盖当前填报内容？\n覆盖后当前未提交的修改将丢失，需重新提交才会生效。")) {
      return;
    }

    var courseEl = document.getElementById("schemeCourse");
    var creditEl = document.getElementById("schemeCredit");
    var scoreEl = document.getElementById("schemeScoreType");
    var vetoEl = document.getElementById("schemeVeto");
    var nameEl = document.getElementById("schemeCourseName");

    if (courseEl) courseEl.value = data.course;
    if (creditEl) creditEl.value = data.credit;
    if (scoreEl) scoreEl.value = data.scoreType;
    if (vetoEl) {
      vetoEl.value = data.veto.indexOf("是") === 0
        ? "是（终结性不及格则总评不及格）"
        : "否";
      Array.prototype.some.call(vetoEl.options, function (opt) {
        if (opt.value.indexOf(data.veto.charAt(0)) === 0) {
          vetoEl.value = opt.value;
          return true;
        }
        return false;
      });
    }
    if (nameEl) nameEl.textContent = data.course;

    schemeTasks.f = data.tasks.f.map(cloneTask);
    schemeTasks.s = data.tasks.s.map(cloneTask);
    renderSchemeTables();
    renderSchemeScoreDetail();
    if (data.scoreDetail) applyScoreDetailValues(data.scoreDetail);
    markSchemeChanged();
    closeModal("modalHistory");
    toast("已用「" + data.title + "」覆盖当前方案，占比已自动识别，请确认后提交");
  };

  function cloneTask(t) {
    return { name: t.name, form: t.form, weight: t.weight, std: t.std };
  }

  var HISTORY_SCHEMES = {
    v3: {
      title: "V3（当前生效）· 2026-03-10",
      course: "大学英语",
      credit: "4 / 64",
      scoreType: "score-100",
      scoreDetail: { passLine: "60", excellentLine: "90" },
      scoreDetailText: "及格线60 / 优秀线90",
      veto: "是",
      formative: "平时作业15% + 课堂表现10% + 阶段测验15%",
      summative: "期末考试（纸笔+网上阅卷）60%",
      linkTasks: "网上阅卷、在线考试、成绩登分与自动统计",
      tasks: {
        f: [
          { name: "平时作业", form: "线上作业", weight: 15, std: "按时完成且正确率≥60%" },
          { name: "课堂表现", form: "教师评定", weight: 10, std: "考勤+发言综合评分" },
          { name: "阶段测验", form: "在线考试", weight: 15, std: "百分制折算" }
        ],
        s: [
          { name: "期末考试", form: "纸笔+网上阅卷", weight: 60, std: "闭卷，百分制" }
        ]
      }
    },
    v2: {
      title: "V2 · 2025-09-01",
      course: "大学英语",
      credit: "4 / 64",
      scoreType: "score-150",
      scoreDetail: { passLine: "90", excellentLine: "135" },
      scoreDetailText: "满分150 · 及格线90 / 优秀线135",
      veto: "否",
      formative: "平时作业20% + 课堂表现10% + 阶段测验20%",
      summative: "期末考试（纸笔考试）50%",
      linkTasks: "成绩登分与自动统计",
      tasks: {
        f: [
          { name: "平时作业", form: "线上作业", weight: 20, std: "按时完成且正确率≥60%" },
          { name: "课堂表现", form: "考勤+互动", weight: 10, std: "考勤+发言综合评分" },
          { name: "阶段测验", form: "纸笔考试", weight: 20, std: "百分制折算" }
        ],
        s: [
          { name: "期末考试", form: "纸笔考试", weight: 50, std: "闭卷，百分制" }
        ]
      }
    },
    v1: {
      title: "V1 · 2025-02-20",
      course: "大学英语",
      credit: "4 / 64",
      scoreType: "grade-jia",
      scoreDetail: { jia: "90 – 100", yi: "80 – 89", bing: "70 – 79", ding: "60 – 69" },
      scoreDetailText: "甲乙丙丁及对应分数区间",
      veto: "是",
      formative: "平时作业15% + 课堂表现10% + 阶段测验15%",
      summative: "期末考试（在线考试）60%",
      linkTasks: "在线考试、成绩登分与自动统计",
      tasks: {
        f: [
          { name: "平时作业", form: "线下提交", weight: 15, std: "按时完成" },
          { name: "课堂表现", form: "教师评定", weight: 10, std: "教师综合评分" },
          { name: "阶段测验", form: "在线考试", weight: 15, std: "等级折算" }
        ],
        s: [
          { name: "期末考试", form: "在线考试", weight: 60, std: "等级制评定" }
        ]
      }
    }
  };

  function bindSchemeWatchers() {
    var root = document.getElementById("page-scheme");
    if (!root) return;
    ["schemeCourse", "schemeCredit", "schemeScoreType", "schemeVeto"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("change", function () {
        if (id === "schemeCourse") {
          document.getElementById("schemeCourseName").textContent = el.value;
        }
        if (id === "schemeScoreType") {
          renderSchemeScoreDetail();
        }
        markSchemeChanged();
      });
      el.addEventListener("input", markSchemeChanged);
    });
    renderSchemeTables();
    renderSchemeScoreDetail();
    schemeBaseline = snapshotScheme();
    setSchemeDirty(false);
  }

  /* ========== 2. 答题卡 ========== */
  var PAPERS = {
    math: {
      title: "高等数学期末考试 答题卡",
      struct: "单选20 · 多选5 · 填空8 · 解答4",
      sections: [
        { type: "omr", title: "一、单选题（OMR填涂）", count: 20, opts: "ABCD" },
        { type: "omr", title: "二、多选题（OMR填涂）", count: 5, opts: "ABCDE" },
        { type: "ocr", title: "三、填空题（OCR手写）", lines: ["21. ________", "22. ________", "23. ________", "… 至第28题"] },
        { type: "subj", title: "四、解答题（答题区）", note: "第29–32题作答区，请在虚线框内书写过程与结论。" }
      ]
    },
    eng: {
      title: "大学英语期末考试 答题卡",
      struct: "听力10 · 阅读15 · 完形10 · 写作2",
      sections: [
        { type: "omr", title: "一、听力理解（OMR）", count: 10, opts: "ABCD" },
        { type: "omr", title: "二、阅读理解（OMR）", count: 15, opts: "ABCD" },
        { type: "omr", title: "三、完形填空（OMR）", count: 10, opts: "ABCD" },
        { type: "ocr", title: "四、单词拼写（OCR字母）", lines: ["36. ________（8字母）", "37. ________", "38. ________"] },
        { type: "subj", title: "五、写作（答题区）", note: "Task 1 / Task 2 写作区，不少于规定词数。" }
      ]
    },
    cs: {
      title: "程序设计基础期末考试 答题卡",
      struct: "单选15 · 判断10 · 程序填空6 · 编程3",
      sections: [
        { type: "omr", title: "一、单选题（OMR）", count: 15, opts: "ABCD" },
        { type: "ocr", title: "二、判断题（OCR：对/错 或 √/×）", lines: ["16. ____", "17. ____", "18. ____", "… 至第25题"] },
        { type: "ocr", title: "三、程序填空（OCR字母/关键字）", lines: ["26. ________", "27. ________", "28. ________"] },
        { type: "subj", title: "四、编程题（答题区）", note: "第29–31题请写出完整代码与关键注释。" }
      ]
    },
    phy: {
      title: "大学物理期中考试 答题卡",
      struct: "单选12 · 多选6 · 计算题5",
      sections: [
        { type: "omr", title: "一、单选题（OMR）", count: 12, opts: "ABCD" },
        { type: "omr", title: "二、多选题（OMR）", count: 6, opts: "ABCDE" },
        { type: "ocr", title: "三、不等式/符号判断（OCR）", lines: ["19. ____（> / < / =）", "20. ____", "21. ____"] },
        { type: "subj", title: "四、计算题（答题区）", note: "第22–26题写出公式推导与数值结果。" }
      ]
    }
  };

  var TPL_META = {
    "a4-v": { name: "A4纵向", tip: "预设模板：A4纵向单栏 — 生成后按纵向单栏排版（客观题在上、主观题在下）" },
    "a4-h": { name: "A4横向双栏", tip: "预设模板：A4横向双栏 — 生成后客观题左右分栏排版" },
    "a3": { name: "A3双栏", tip: "预设模板：A3双栏 — 左侧客观题、右侧主观/手写区" },
    "eng-tpl": { name: "英语专用分区", tip: "预设模板：英语专用 — 听力区 / 阅读区 / 写作区独立分区" },
    "cs-tpl": { name: "程设专用分区", tip: "预设模板：程设专用 — 单选 / 判断 / 程序填空 / 编程分区" }
  };

  var sheetState = {
    paper: "math",
    mode: "mix",
    template: "a4-v",
    title: "",
    header: "姓名：________　学号：________　考号：________",
    showQr: true,
    showOmr: true,
    showOcr: true,
    subjNote: "",
    generated: false
  };

  function updateSheetStructHint() {
    var paper = document.getElementById("sheetPaper");
    var hint = document.getElementById("sheetStructHint");
    if (!paper || !hint) return;
    var p = PAPERS[paper.value];
    hint.textContent = "当前试卷结构：" + (p ? p.struct : "—");
  }

  function updateSheetTplHint() {
    var tpl = document.getElementById("sheetTemplate");
    var hint = document.getElementById("sheetTplHint");
    if (!tpl || !hint) return;
    var meta = TPL_META[tpl.value];
    hint.textContent = meta ? meta.tip : "";
  }

  function omrRowsHtml(count, opts, start, compact) {
    var letters = (opts || "ABCD").split("");
    var html = compact ? '<div class="omr-compact">' : "";
    var show = Math.min(count, compact ? 8 : 4);
    for (var i = 0; i < show; i++) {
      html += '<div class="omr-row">' + (start + i) + ". <span class=\"omr-opts\">" +
        letters.map(function (L) { return "<i>" + L + "</i>"; }).join("") +
        "</span></div>";
    }
    if (count > show) {
      html += '<div class="omr-row">… 至第' + (start + count - 1) + "题</div>";
    }
    if (compact) html += "</div>";
    return html;
  }

  function collectSectionsByType(sections) {
    var omr = [];
    var ocr = [];
    var subj = [];
    var qStart = 1;
    sections.forEach(function (sec) {
      if (sec.type === "omr") {
        omr.push({ sec: sec, start: qStart });
        qStart += sec.count;
      } else if (sec.type === "ocr") {
        ocr.push(sec);
      } else if (sec.type === "subj") {
        subj.push(sec);
      }
    });
    return { omr: omr, ocr: ocr, subj: subj };
  }

  function renderOmrBlock(omrList, compact) {
    if (!sheetState.showOmr || sheetState.mode === "ocr" || !omrList.length) return "";
    return omrList.map(function (item) {
      return '<div class="sec-title">' + item.sec.title + "</div>" +
        omrRowsHtml(item.sec.count, item.sec.opts, item.start, compact);
    }).join("");
  }

  function renderOcrBlock(ocrList) {
    if (!sheetState.showOcr || sheetState.mode === "omr" || !ocrList.length) return "";
    return ocrList.map(function (sec) {
      return '<div class="sec-title">' + sec.title + "</div>" +
        (sec.lines || []).map(function (line) {
          return '<div class="ocr-line">' + line + "</div>";
        }).join("");
    }).join("");
  }

  function renderSubjBlock(subjList) {
    if (!subjList.length) return "";
    return subjList.map(function (sec) {
      return '<div class="sec-title">' + sec.title + "</div>" +
        '<div class="ocr-line">' + (sheetState.subjNote || sec.note) + "</div>" +
        '<div style="border:1px dashed #999;height:64px;margin-top:6px;"></div>';
    }).join("");
  }

  function sheetHeaderHtml(p) {
    var modeLabel = { omr: "OMR", ocr: "OCR", mix: "混合" }[sheetState.mode] || sheetState.mode;
    var tplLabel = (TPL_META[sheetState.template] || {}).name || sheetState.template;
    var html = "";
    if (sheetState.showQr) html += '<div class="qr">考试<br/>二维码</div>';
    html += '<div class="sheet-hd">' + (sheetState.title || p.title) +
      '<span class="sheet-tpl-badge">' + tplLabel + "</span></div>";
    html += "<div>" + sheetState.header + "</div>";
    html += '<div class="hint" style="clear:both;margin-top:6px;">模式：' + modeLabel +
      " · 模板：" + tplLabel + " · 结构：" + p.struct + "</div>";
    return html;
  }

  function buildSheetHtml() {
    var p = PAPERS[sheetState.paper];
    if (!p) return "";
    var parts = collectSectionsByType(p.sections);
    var tpl = sheetState.template || "a4-v";
    var html = sheetHeaderHtml(p);

    if (tpl === "a4-h") {
      // 横向：客观题双栏
      if (parts.omr.length === 0) {
        html += '<div class="hint">本卷无 OMR 客观题，横向双栏主要用于客观填涂区。</div>';
      } else if (parts.omr.length === 1) {
        var only = parts.omr[0];
        var half = Math.ceil(only.sec.count / 2);
        html += '<div class="sheet-dual">';
        html += '<div class="col"><div class="col-title">左栏 · 客观题</div>' +
          '<div class="sec-title">' + only.sec.title + "</div>" +
          omrRowsHtml(half, only.sec.opts, only.start, true) + "</div>";
        html += '<div class="col"><div class="col-title">右栏 · 客观题</div>' +
          '<div class="sec-title">' + only.sec.title + "（续）</div>" +
          omrRowsHtml(only.sec.count - half, only.sec.opts, only.start + half, true) + "</div>";
        html += "</div>";
      } else {
        var mid = Math.ceil(parts.omr.length / 2);
        html += '<div class="sheet-dual">';
        html += '<div class="col"><div class="col-title">左栏 · 客观题</div>' +
          renderOmrBlock(parts.omr.slice(0, mid), true) + "</div>";
        html += '<div class="col"><div class="col-title">右栏 · 客观题</div>' +
          renderOmrBlock(parts.omr.slice(mid), true) + "</div>";
        html += "</div>";
      }
      html += renderOcrBlock(parts.ocr);
      html += renderSubjBlock(parts.subj);
    } else if (tpl === "a3") {
      // A3：左客观，右手写/主观
      html += '<div class="sheet-dual">';
      html += '<div class="col"><div class="col-title">左侧 · 客观题区</div>' +
        renderOmrBlock(parts.omr, true) + "</div>";
      html += '<div class="col"><div class="col-title">右侧 · 手写 / 主观区</div>' +
        renderOcrBlock(parts.ocr) + renderSubjBlock(parts.subj) + "</div>";
      html += "</div>";
    } else if (tpl === "eng-tpl") {
      html += '<div class="sheet-zone"><div class="zone-hd">听力理解区</div>' +
        renderOmrBlock(parts.omr.filter(function (x) { return x.sec.title.indexOf("听力") >= 0; }), false) +
        (parts.omr.some(function (x) { return x.sec.title.indexOf("听力") >= 0; }) ? "" :
          '<div class="hint">（本卷无听力题，显示首组客观题）</div>' + renderOmrBlock(parts.omr.slice(0, 1), false)) +
        "</div>";
      html += '<div class="sheet-zone"><div class="zone-hd">阅读 / 完形填涂区</div>' +
        renderOmrBlock(parts.omr.filter(function (x) {
          return x.sec.title.indexOf("阅读") >= 0 || x.sec.title.indexOf("完形") >= 0;
        }), true) +
        (parts.omr.filter(function (x) {
          return x.sec.title.indexOf("阅读") >= 0 || x.sec.title.indexOf("完形") >= 0;
        }).length ? "" : renderOmrBlock(parts.omr.slice(1), true)) +
        "</div>";
      html += '<div class="sheet-zone"><div class="zone-hd">单词拼写 / 写作区</div>' +
        renderOcrBlock(parts.ocr) + renderSubjBlock(parts.subj) + "</div>";
    } else if (tpl === "cs-tpl") {
      html += '<div class="sheet-zone"><div class="zone-hd">单选填涂区</div>' +
        renderOmrBlock(parts.omr, false) + "</div>";
      html += '<div class="sheet-dual">';
      html += '<div class="col"><div class="col-title">判断题手写区</div>' +
        renderOcrBlock(parts.ocr.slice(0, 1)) + "</div>";
      html += '<div class="col"><div class="col-title">程序填空手写区</div>' +
        renderOcrBlock(parts.ocr.slice(1)) + "</div>";
      html += "</div>";
      html += '<div class="sheet-zone"><div class="zone-hd">编程题答题区</div>' +
        renderSubjBlock(parts.subj) + "</div>";
    } else {
      // a4-v 纵向单栏
      html += renderOmrBlock(parts.omr, false);
      html += renderOcrBlock(parts.ocr);
      html += renderSubjBlock(parts.subj);
    }

    html += '<div class="hint" style="margin-top:10px;clear:both;">扫描二维码可直接关联本场考试并上传识别数据</div>';
    return html;
  }

  function renderSheet() {
    var preview = document.getElementById("sheetPreview");
    var area = document.getElementById("sheetWorkArea");
    var tag = document.getElementById("sheetModeTag");
    var tplTag = document.getElementById("sheetTplTag");
    if (!preview || !area) return;
    area.style.display = "grid";
    preview.className = "sheet-preview tpl-" + (sheetState.template || "a4-v");
    preview.innerHTML = buildSheetHtml();
    if (tag) {
      tag.textContent = { omr: "OMR模式", ocr: "OCR模式", mix: "混合模式" }[sheetState.mode] || sheetState.mode;
    }
    if (tplTag) {
      tplTag.textContent = (TPL_META[sheetState.template] || {}).name || sheetState.template;
    }
    sheetState.generated = true;
  }

  window.genSheet = function () {
    var paperEl = document.getElementById("sheetPaper");
    var modeEl = document.getElementById("sheetMode");
    var genMode = document.getElementById("sheetGenMode");
    var tpl = document.getElementById("sheetTemplate");
    sheetState.paper = paperEl ? paperEl.value : "math";
    sheetState.mode = modeEl ? modeEl.value : "mix";
    sheetState.template = tpl ? tpl.value : "a4-v";
    sheetState.showOmr = true;
    sheetState.showOcr = true;
    sheetState.showQr = true;

    var p = PAPERS[sheetState.paper];
    sheetState.title = p.title;
    sheetState.subjNote = "";
    p.sections.forEach(function (s) {
      if (s.type === "subj") sheetState.subjNote = s.note;
    });

    // 按模板设定页眉与默认模式
    if (sheetState.template === "a4-h") {
      sheetState.header = "考场_____ 座号_____　学号________　考号________";
    } else if (sheetState.template === "a3") {
      sheetState.header = "姓名：________　学号：________　考号：________　座位号：____";
    } else if (sheetState.template === "eng-tpl") {
      sheetState.header = "Name: ________　Student No.: ________　Exam No.: ________";
      sheetState.mode = sheetState.mode || "mix";
    } else if (sheetState.template === "cs-tpl") {
      sheetState.header = "姓名：________　学号：________　考号：________";
      sheetState.showOcr = true;
    } else {
      sheetState.header = "姓名：________　学号：________　考号：________";
    }

    var titleInput = document.getElementById("editSheetTitle");
    var headerInput = document.getElementById("editSheetHeader");
    var noteInput = document.getElementById("editSubjNote");
    var showQr = document.getElementById("editShowQr");
    var showOmr = document.getElementById("editShowOmr");
    var showOcr = document.getElementById("editShowOcr");
    if (titleInput) titleInput.value = sheetState.title;
    if (headerInput) headerInput.value = sheetState.header;
    if (noteInput) noteInput.value = sheetState.subjNote;
    if (showQr) showQr.checked = sheetState.showQr;
    if (showOmr) showOmr.checked = sheetState.showOmr;
    if (showOcr) showOcr.checked = sheetState.showOcr;

    renderSheet();
    var tplName = (TPL_META[sheetState.template] || {}).name || sheetState.template;
    var how = genMode && genMode.value === "template" ? "按预设模板" : "按试卷结构解析并套用模板版式";
    toast("已" + how + "生成：「" + tplName + "」· " + p.struct);
  };

  window.toggleSheetEdit = function (force) {
    if (!sheetState.generated) {
      toast("请先生成答题卡");
      return;
    }
    var panel = document.getElementById("sheetEditPanel");
    var preview = document.getElementById("sheetPreview");
    if (!panel) return;
    var show = typeof force === "boolean" ? force : panel.style.display === "none";
    panel.style.display = show ? "block" : "none";
    if (preview) preview.contentEditable = show ? "true" : "false";
    toast(show ? "已进入二次编辑：可改右侧参数或直接点选预览区文字" : "已退出二次编辑");
  };

  window.applySheetEdit = function () {
    sheetState.title = val("editSheetTitle") || sheetState.title;
    sheetState.header = val("editSheetHeader") || sheetState.header;
    sheetState.subjNote = val("editSubjNote") || sheetState.subjNote;
    sheetState.showQr = !!(document.getElementById("editShowQr") || {}).checked;
    sheetState.showOmr = !!(document.getElementById("editShowOmr") || {}).checked;
    sheetState.showOcr = !!(document.getElementById("editShowOcr") || {}).checked;
    renderSheet();
    toast("二次编辑已应用到预览");
  };

  window.exportSheet = function (fmt) {
    if (!sheetState.generated) {
      toast("请先生成答题卡再导出");
      return;
    }
    var preview = document.getElementById("sheetPreview");
    if (!preview) {
      toast("未找到答题卡预览");
      return;
    }
    var tplName = (TPL_META[sheetState.template] || {}).name || "";
    var fileBase = (sheetState.title || "答题卡").replace(/[\\/:*?"<>|]/g, "_") + "_" + tplName;

    if (fmt === "docx" || fmt === "doc") {
      exportSheetAsWord(preview, fileBase + ".doc");
      toast("已导出 Word 文档（.doc，可用 Word / WPS 打开）");
      return;
    }

    // PDF：下载真实 PDF + 打开打印预览（可选另存）
    exportSheetAsPdf(preview, fileBase + ".pdf", function (ok) {
      if (ok) toast("已导出 PDF 答题卡");
      else toast("PDF 生成失败，已打开打印预览，请选择「存储为 PDF」");
    });
  };

  function getSheetExportHtml(preview) {
    var css = [
      "body{font-family:'SimSun','Songti SC',serif;padding:24px;color:#111;}",
      ".sheet-preview{border:2px solid #333;padding:16px;max-width:720px;margin:0 auto;}",
      ".sheet-hd{text-align:center;font-size:18px;font-weight:700;margin-bottom:8px;}",
      ".sheet-tpl-badge{display:inline-block;font-size:11px;margin-left:8px;border:1px solid #99c;padding:1px 6px;font-family:sans-serif;}",
      ".qr{width:56px;height:56px;border:1px solid #333;float:right;display:flex;align-items:center;justify-content:center;font-size:10px;}",
      ".sec-title{margin-top:12px;font-weight:700;clear:both;}",
      ".omr-row{margin:6px 0;}",
      ".omr-opts{display:inline-flex;gap:8px;margin-left:8px;}",
      ".omr-opts i{display:inline-block;width:14px;height:14px;border:1px solid #333;border-radius:50%;text-align:center;line-height:12px;font-style:normal;font-size:10px;}",
      ".sheet-dual{display:grid;grid-template-columns:1fr 1fr;gap:12px;clear:both;margin-top:10px;}",
      ".sheet-dual .col{border:1px dashed #999;padding:8px;}",
      ".sheet-dual .col-title{font-weight:700;margin-bottom:6px;border-bottom:1px solid #ddd;padding-bottom:4px;}",
      ".sheet-zone{border:1px solid #999;padding:8px;margin-top:10px;clear:both;}",
      ".sheet-zone .zone-hd{font-weight:700;margin-bottom:6px;background:#f5f5f5;padding:4px 6px;}",
      ".hint{color:#666;font-size:12px;}",
      ".ocr-line{margin:6px 0;}"
    ].join("");
    return "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>" +
      (sheetState.title || "答题卡") + "</title><style>" + css + "</style></head><body>" +
      preview.outerHTML + "</body></html>";
  }

  function exportSheetAsWord(preview, filename) {
    var html =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'>" +
      "<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->" +
      "<style>" +
      "body{font-family:SimSun,宋体,serif;font-size:12pt;}" +
      ".sheet-preview{border:2px solid #000;padding:16px;}" +
      ".sheet-hd{text-align:center;font-size:16pt;font-weight:bold;margin-bottom:8px;}" +
      ".qr{width:56px;height:56px;border:1px solid #000;float:right;text-align:center;font-size:9pt;}" +
      ".sec-title{margin-top:12px;font-weight:bold;clear:both;}" +
      ".omr-opts i{display:inline-block;width:14px;height:14px;border:1px solid #000;border-radius:50%;text-align:center;font-style:normal;font-size:9pt;margin-right:4px;}" +
      ".sheet-dual{width:100%;} .sheet-dual .col{border:1px dashed #666;padding:8px;vertical-align:top;}" +
      ".sheet-zone{border:1px solid #666;padding:8px;margin-top:10px;}" +
      "</style></head><body>" +
      "<p><b>" + (sheetState.title || "答题卡") + "</b> · 模板：" +
      ((TPL_META[sheetState.template] || {}).name || "") + "</p>" +
      preview.outerHTML +
      "</body></html>";

    var blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }

  function exportSheetAsPdf(preview, filename, done) {
    // 打印预览（含完整版式，可另存 PDF）
    var w = window.open("", "_blank", "width=900,height=700");
    if (w) {
      w.document.open();
      w.document.write(getSheetExportHtml(preview) +
        "<script>setTimeout(function(){try{window.print()}catch(e){}},400)</" + "script>");
      w.document.close();
    }

    // 下载真实 .pdf：将预览绘制到 canvas 后嵌入
    renderDomToJpeg(preview, function (jpegBinary, imgW, imgH) {
      if (!jpegBinary) {
        // 降级：用纯文本画布生成 PDF
        var text = preview.innerText || sheetState.title || "答题卡";
        fallbackSheetPdf(filename, text, done);
        return;
      }
      try {
        var pdf = buildPdfWithJpeg(jpegBinary, imgW, imgH);
        var blob = new Blob([pdf], { type: "application/pdf" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
        if (done) done(true);
      } catch (e) {
        console.error(e);
        fallbackSheetPdf(filename, preview.innerText || "", done);
      }
    });
  }

  function fallbackSheetPdf(filename, text, done) {
    try {
      var canvas = document.createElement("canvas");
      var lines = (("答题卡导出\n" + (sheetState.title || "") + "\n\n" + text).split("\n"));
      canvas.width = 794;
      canvas.height = Math.max(1123, 80 + lines.length * 18);
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#111";
      ctx.font = "14px Microsoft YaHei, SimSun, sans-serif";
      var y = 40;
      lines.forEach(function (line) {
        ctx.fillText(line.slice(0, 80), 40, y);
        y += 18;
      });
      var dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      var jpeg = atob(dataUrl.split(",")[1]);
      var pdf = buildPdfWithJpeg(jpeg, canvas.width, canvas.height);
      var blob = new Blob([pdf], { type: "application/pdf" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
      if (done) done(true);
    } catch (e) {
      console.error(e);
      if (done) done(false);
    }
  }

  function renderDomToJpeg(el, callback) {
    try {
      var rect = el.getBoundingClientRect();
      var width = Math.ceil(Math.max(el.scrollWidth, rect.width, 420));
      var height = Math.ceil(Math.max(el.scrollHeight, rect.height, 500));
      var clone = el.cloneNode(true);
      clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      // 内联关键样式，保证 SVG foreignObject 可渲染
      var style = document.createElement("style");
      style.textContent = [
        ".sheet-preview{box-sizing:border-box;border:2px solid #333;background:#fff;padding:16px;width:" + width + "px;font-family:SimSun,serif;font-size:12px;color:#111;}",
        ".sheet-hd{text-align:center;font-size:16px;font-weight:700;margin-bottom:8px;}",
        ".sheet-tpl-badge{display:inline-block;font-size:11px;margin-left:6px;border:1px solid #99c;padding:1px 6px;}",
        ".qr{width:56px;height:56px;border:1px solid #333;float:right;display:flex;align-items:center;justify-content:center;font-size:10px;}",
        ".sec-title{margin-top:12px;font-weight:700;clear:both;}",
        ".omr-row{margin:6px 0;}",
        ".omr-opts{display:inline-flex;gap:8px;margin-left:8px;}",
        ".omr-opts i{display:inline-block;width:14px;height:14px;border:1px solid #333;border-radius:50%;text-align:center;line-height:12px;font-style:normal;font-size:10px;}",
        ".sheet-dual{display:grid;grid-template-columns:1fr 1fr;gap:12px;clear:both;margin-top:10px;}",
        ".sheet-dual .col{border:1px dashed #999;padding:8px;}",
        ".col-title{font-weight:700;margin-bottom:6px;}",
        ".sheet-zone{border:1px solid #999;padding:8px;margin-top:10px;clear:both;}",
        ".zone-hd{font-weight:700;margin-bottom:6px;background:#f5f5f5;padding:4px 6px;}",
        ".hint{color:#666;font-size:12px;}",
        ".ocr-line{margin:6px 0;}"
      ].join("");
      clone.insertBefore(style, clone.firstChild);

      var xhtml = new XMLSerializer().serializeToString(clone);
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
        '<foreignObject width="100%" height="100%">' + xhtml + "</foreignObject></svg>";

      var img = new Image();
      img.onload = function () {
        try {
          var canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0);
          var dataUrl = canvas.toDataURL("image/jpeg", 0.92);
          var jpeg = atob(dataUrl.split(",")[1]);
          callback(jpeg, width, height);
        } catch (e) {
          console.error(e);
          callback(null);
        }
      };
      img.onerror = function () { callback(null); };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    } catch (e) {
      console.error(e);
      callback(null);
    }
  }

  var sheetPaper = document.getElementById("sheetPaper");
  if (sheetPaper) sheetPaper.addEventListener("change", updateSheetStructHint);
  var sheetTpl = document.getElementById("sheetTemplate");
  if (sheetTpl) {
    sheetTpl.addEventListener("change", function () {
      updateSheetTplHint();
      // 已生成过则切换模板后可提示重新生成；若已有预览则即时按新模板重渲
      if (sheetState.generated) {
        sheetState.template = sheetTpl.value;
        if (sheetState.template === "a4-h") {
          sheetState.header = "考场_____ 座号_____　学号________　考号________";
        } else if (sheetState.template === "a3") {
          sheetState.header = "姓名：________　学号：________　考号：________　座位号：____";
        } else if (sheetState.template === "eng-tpl") {
          sheetState.header = "Name: ________　Student No.: ________　Exam No.: ________";
        } else {
          sheetState.header = "姓名：________　学号：________　考号：________";
        }
        var headerInput = document.getElementById("editSheetHeader");
        if (headerInput) headerInput.value = sheetState.header;
        renderSheet();
        toast("已切换为「" + ((TPL_META[sheetState.template] || {}).name || "") + "」版式");
      }
    });
  }
  updateSheetTplHint();

  /* ========== 3. OCR ========== */
  var OCR_EXAMS = {
    math: {
      keyHtml:
        "<table class='data'><thead><tr><th>题号</th><th>类型</th><th>正确答案</th><th>分值</th></tr></thead><tbody>" +
        "<tr><td>填空21</td><td>字母/符号</td><td>2x+1</td><td>2</td></tr>" +
        "<tr><td>填空22</td><td>字母/符号</td><td>π/2</td><td>2</td></tr>" +
        "<tr><td>判断19</td><td>判断</td><td>&gt;</td><td>1</td></tr>" +
        "<tr><td>判断20</td><td>判断</td><td>对</td><td>1</td></tr>" +
        "</tbody></table>",
      results: [
        { field: "学号", type: "学号", got: "2024010235", ans: "—", conf: "98%", score: "—" },
        { field: "考号", type: "考号", got: "A1035", ans: "—", conf: "96%", score: "—" },
        { field: "填空21", type: "字母题", got: "2x+1", ans: "2x+1", conf: "94%", score: "✓ 2分" },
        { field: "填空22", type: "字母题", got: "pi/2", ans: "π/2", conf: "88%", score: "✓ 2分（等价）" },
        { field: "判断19", type: "判断题", got: ">", ans: ">", conf: "95%", score: "✓ 1分" },
        { field: "判断20", type: "判断题", got: "错", ans: "对", conf: "91%", score: "✗ 0分" }
      ],
      summary: "OCR 自动评分：5 / 6 分（选择题由 OMR 另行计分，未计入）"
    },
    eng: {
      keyHtml:
        "<table class='data'><thead><tr><th>题号</th><th>类型</th><th>正确答案</th><th>分值</th></tr></thead><tbody>" +
        "<tr><td>拼写36</td><td>字母题(单词)</td><td>necessary</td><td>1</td></tr>" +
        "<tr><td>拼写37</td><td>字母题(单词)</td><td>environment</td><td>1</td></tr>" +
        "<tr><td>判断41</td><td>判断(True/False)</td><td>True</td><td>1</td></tr>" +
        "<tr><td>判断42</td><td>判断</td><td>False</td><td>1</td></tr>" +
        "</tbody></table>",
      results: [
        { field: "学号", type: "学号", got: "2024020118", ans: "—", conf: "97%", score: "—" },
        { field: "考号", type: "考号", got: "E2018", ans: "—", conf: "95%", score: "—" },
        { field: "拼写36", type: "字母题", got: "necessary", ans: "necessary", conf: "93%", score: "✓ 1分" },
        { field: "拼写37", type: "字母题", got: "enviroment", ans: "environment", conf: "86%", score: "✗ 0分" },
        { field: "判断41", type: "判断题", got: "True", ans: "True", conf: "98%", score: "✓ 1分" },
        { field: "判断42", type: "判断题", got: "False", ans: "False", conf: "96%", score: "✓ 1分" }
      ],
      summary: "OCR 自动评分：3 / 4 分（阅读/听力涂黑题由 OMR 计分）"
    },
    cs: {
      keyHtml:
        "<table class='data'><thead><tr><th>题号</th><th>类型</th><th>正确答案</th><th>分值</th></tr></thead><tbody>" +
        "<tr><td>判断16</td><td>判断</td><td>√</td><td>1</td></tr>" +
        "<tr><td>判断17</td><td>判断</td><td>×</td><td>1</td></tr>" +
        "<tr><td>填空26</td><td>字母题(关键字)</td><td>printf</td><td>2</td></tr>" +
        "<tr><td>填空27</td><td>字母题</td><td>NULL</td><td>2</td></tr>" +
        "</tbody></table>",
      results: [
        { field: "学号", type: "学号", got: "2024030306", ans: "—", conf: "99%", score: "—" },
        { field: "考号", type: "考号", got: "C3006", ans: "—", conf: "97%", score: "—" },
        { field: "判断16", type: "判断题", got: "√", ans: "√", conf: "94%", score: "✓ 1分" },
        { field: "判断17", type: "判断题", got: "对", ans: "×", conf: "90%", score: "✗ 0分" },
        { field: "填空26", type: "字母题", got: "printf", ans: "printf", conf: "96%", score: "✓ 2分" },
        { field: "填空27", type: "字母题", got: "null", ans: "NULL", conf: "92%", score: "✓ 2分（大小写容忍）" }
      ],
      summary: "OCR 自动评分：5 / 6 分"
    },
    phy: {
      keyHtml:
        "<table class='data'><thead><tr><th>题号</th><th>类型</th><th>正确答案</th><th>分值</th></tr></thead><tbody>" +
        "<tr><td>判断19</td><td>判断(&gt;/&lt;)</td><td>&gt;</td><td>1</td></tr>" +
        "<tr><td>判断20</td><td>判断</td><td>&lt;</td><td>1</td></tr>" +
        "<tr><td>符号21</td><td>字母题</td><td>Δv</td><td>2</td></tr>" +
        "</tbody></table>",
      results: [
        { field: "学号", type: "学号", got: "2024040412", ans: "—", conf: "98%", score: "—" },
        { field: "考号", type: "考号", got: "P4012", ans: "—", conf: "95%", score: "—" },
        { field: "判断19", type: "判断题", got: ">", ans: ">", conf: "97%", score: "✓ 1分" },
        { field: "判断20", type: "判断题", got: "<", ans: "<", conf: "96%", score: "✓ 1分" },
        { field: "符号21", type: "字母题", got: "Δv", ans: "Δv", conf: "89%", score: "✓ 2分" }
      ],
      summary: "OCR 自动评分：4 / 4 分"
    }
  };

  function renderOcrAnswerKey() {
    var exam = document.getElementById("ocrExam");
    var box = document.getElementById("ocrAnswerKey");
    if (!exam || !box) return;
    var data = OCR_EXAMS[exam.value] || OCR_EXAMS.math;
    box.innerHTML = data.keyHtml;
  }

  window.runOcr = function () {
    var exam = document.getElementById("ocrExam");
    var key = exam ? exam.value : "math";
    var data = OCR_EXAMS[key] || OCR_EXAMS.math;
    var body = document.getElementById("ocrResultBody");
    var sum = document.getElementById("ocrScoreSummary");
    if (!body) return;
    body.innerHTML = data.results.map(function (r) {
      var scoreCell = r.score.indexOf("✓") >= 0
        ? '<span class="tag tag-green">' + r.score + "</span>"
        : r.score.indexOf("✗") >= 0
          ? '<span class="tag tag-red">' + r.score + "</span>"
          : r.score;
      return "<tr><td>" + r.field + "</td><td>" + r.type + "</td><td>" + r.got +
        "</td><td>" + r.ans + "</td><td>" + r.conf + "</td><td>" + scoreCell + "</td></tr>";
    }).join("");
    if (sum) {
      sum.innerHTML = '<div class="lbl">自动评分汇总（对照正确答案）</div><div class="num" style="font-size:16px;margin-top:6px;">' +
        data.summary + "</div>";
    }
    toast("OCR 识别完成，已对照正确答案自动评分");
  };

  var ocrExam = document.getElementById("ocrExam");
  if (ocrExam) ocrExam.addEventListener("change", renderOcrAnswerKey);

  /* ========== 4. 分析导出 PDF ========== */
  window.exportAnalysis = function (kind) {
    var paneMap = {
      paper: "tab-paper",
      course: "tab-course",
      class: "tab-class"
    };
    var titles = {
      paper: "试卷分析报告",
      course: "课程总体成绩分析报告",
      class: "班级考核数据分析报告"
    };
    var paneId = paneMap[kind];
    var title = titles[kind] || "成绩分析报告";
    var pane = paneId ? document.getElementById(paneId) : null;
    if (!pane) {
      toast("未找到可导出的分析内容");
      return;
    }

    // 1) 打开含图表的打印页，用户可「存储为 PDF」
    var printHtml = buildAnalysisPrintHtml(title, pane);
    var w = window.open("", "_blank", "width=960,height=720");
    if (w) {
      w.document.open();
      w.document.write(printHtml);
      w.document.close();
      setTimeout(function () {
        try { w.focus(); w.print(); } catch (e) {}
      }, 350);
    }

    // 2) 同时下载一份 PDF 文件（含关键指标与表格文字，便于归档）
    var textReport = buildAnalysisTextReport(kind, title, pane);
    downloadSimplePdf(title + ".pdf", title, textReport);

    toast("已打开 PDF 打印预览（含图表），并下载分析报告 PDF");
  };

  function buildAnalysisPrintHtml(title, pane) {
    var clone = pane.cloneNode(true);
    // 去掉导出按钮，避免打印进 PDF
    clone.querySelectorAll("button").forEach(function (btn) { btn.remove(); });
    return "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>" + title + "</title>" +
      "<style>" +
      "body{font-family:'Microsoft YaHei','PingFang SC',sans-serif;padding:24px;color:#222;}" +
      "h1{font-size:20px;margin:0 0 8px;} .meta{color:#888;font-size:12px;margin-bottom:18px;}" +
      ".card{border:1px solid #ddd;border-radius:4px;margin-bottom:14px;page-break-inside:avoid;}" +
      ".card-hd{padding:10px 12px;border-bottom:1px solid #eee;font-weight:700;}" +
      ".card-bd{padding:12px;} table{width:100%;border-collapse:collapse;font-size:12px;}" +
      "th,td{border:1px solid #e5e5e5;padding:6px 8px;text-align:left;} th{background:#fafafa;}" +
      ".stat-box{display:inline-block;border:1px solid #eee;padding:10px 14px;margin:0 8px 8px 0;min-width:100px;}" +
      ".stat-box .num{font-size:18px;font-weight:700;color:#1677ff;} .stat-box .lbl{font-size:11px;color:#888;}" +
      ".grid-2,.grid-3{display:block;} .chart-box{border:1px dashed #ccc;padding:12px;margin:8px 0;}" +
      ".bar-chart{display:flex;align-items:flex-end;gap:8px;height:120px;}" +
      ".bar-chart .bar{flex:1;background:#1677ff;position:relative;min-width:16px;}" +
      ".bar-chart .bar span{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:10px;white-space:nowrap;}" +
      ".bar-chart .bar em{position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:10px;font-style:normal;}" +
      ".toolbar,.tabs,.hint{display:none;} select{display:none;}" +
      "@media print{body{padding:0;} button{display:none!important;}}" +
      "</style></head><body>" +
      "<h1>" + title + "</h1>" +
      "<div class='meta'>导出时间：" + new Date().toLocaleString() + " · 考试管理系统 · 标星参数陪标原型</div>" +
      "<p style='font-size:12px;color:#666;'>提示：在打印对话框中选择「存储为 PDF / Save as PDF」即可保存带图表的 PDF。</p>" +
      clone.innerHTML +
      "</body></html>";
  }

  function buildAnalysisTextReport(kind, title, pane) {
    var lines = [];
    lines.push(title);
    lines.push("导出时间：" + new Date().toLocaleString());
    lines.push("----------------------------------------");
    // 提取统计数字与表格文本
    pane.querySelectorAll(".stat-box").forEach(function (box) {
      var num = (box.querySelector(".num") || {}).textContent || "";
      var lbl = (box.querySelector(".lbl") || {}).textContent || "";
      if (num || lbl) lines.push(lbl + "：" + num);
    });
    lines.push("----------------------------------------");
    pane.querySelectorAll("table.data").forEach(function (table, ti) {
      lines.push("【表格 " + (ti + 1) + "】");
      table.querySelectorAll("tr").forEach(function (tr) {
        var cells = [];
        tr.querySelectorAll("th,td").forEach(function (c) {
          cells.push((c.textContent || "").replace(/\s+/g, " ").trim());
        });
        if (cells.length) lines.push(cells.join(" | "));
      });
      lines.push("");
    });
    if (kind === "paper") {
      lines.push("说明：含难度/信度/效度/区分度、小题得分、题型、知识点、成绩分布、缺考等。");
    } else if (kind === "course") {
      lines.push("说明：含甲乙丙丁等级分布及正态性分析。");
    } else if (kind === "class") {
      lines.push("说明：含各课程最高分/最低分/平均分/优秀率/及格率/不及格率/方差对比。");
    }
    lines.push("（完整带图表版本请使用打印预览中的「存储为 PDF」）");
    return lines.join("\n");
  }

  function downloadSimplePdf(filename, title, bodyText) {
    try {
      var canvas = document.createElement("canvas");
      var lineH = 18;
      var lines = bodyText.split("\n");
      var padding = 40;
      var canvasW = 794;
      var canvasH = Math.max(1123, padding * 2 + lines.length * lineH + 60);
      canvas.width = canvasW;
      canvas.height = canvasH;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.fillStyle = "#111111";
      ctx.font = "bold 20px Microsoft YaHei, PingFang SC, sans-serif";
      ctx.fillText(title, padding, padding + 10);
      ctx.font = "13px Microsoft YaHei, PingFang SC, sans-serif";
      ctx.fillStyle = "#333333";
      var y = padding + 40;
      lines.forEach(function (line) {
        var maxW = canvasW - padding * 2;
        var rest = line;
        while (rest.length && y <= canvasH - padding) {
          var slice = rest;
          while (ctx.measureText(slice).width > maxW && slice.length > 1) {
            slice = slice.slice(0, -1);
          }
          ctx.fillText(slice, padding, y);
          y += lineH;
          rest = rest.slice(slice.length);
        }
      });

      var jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      var jpeg = atob(jpegDataUrl.split(",")[1]);
      var pdf = buildPdfWithJpeg(jpeg, canvasW, canvasH);
      var blob = new Blob([pdf], { type: "application/pdf" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    } catch (err) {
      console.error(err);
    }
  }

  function buildPdfWithJpeg(jpegBinary, imgW, imgH) {
    var pageW = 595;
    var drawW = pageW - 40;
    var drawH = imgH * drawW / imgW;
    var pageH = Math.ceil(drawH) + 40;

    var strToBytes = function (s) {
      var arr = [];
      for (var i = 0; i < s.length; i++) arr.push(s.charCodeAt(i) & 0xff);
      return arr;
    };
    var concat = function (arrays) {
      var len = 0;
      arrays.forEach(function (a) { len += a.length; });
      var out = new Uint8Array(len);
      var off = 0;
      arrays.forEach(function (a) {
        out.set(a instanceof Uint8Array ? a : new Uint8Array(a), off);
        off += a.length;
      });
      return out;
    };

    var jpegBytes = [];
    for (var i = 0; i < jpegBinary.length; i++) jpegBytes.push(jpegBinary.charCodeAt(i) & 0xff);

    var contentStream = "q\n" + drawW.toFixed(2) + " 0 0 " + drawH.toFixed(2) + " 20 20 cm\n/Im0 Do\nQ\n";
    var contentBytes = strToBytes(contentStream);

    var parts = [];
    var offsets = [0];
    var push = function (bytes) {
      parts.push(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
    };
    push(strToBytes("%PDF-1.4\n"));

    function writeObj(num, bodyArr) {
      offsets[num] = parts.reduce(function (s, p) { return s + p.length; }, 0);
      push(strToBytes(num + " 0 obj\n"));
      push(bodyArr);
      push(strToBytes("\nendobj\n"));
    }

    writeObj(1, strToBytes("<< /Type /Catalog /Pages 2 0 R >>"));
    writeObj(2, strToBytes("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
    writeObj(3, strToBytes(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pageW + " " + pageH +
      "] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>"
    ));
    writeObj(4, concat([
      strToBytes("<< /Length " + contentBytes.length + " >>\nstream\n"),
      contentBytes,
      strToBytes("\nendstream")
    ]));
    writeObj(5, concat([
      strToBytes("<< /Type /XObject /Subtype /Image /Width " + imgW +
        " /Height " + imgH + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " +
        jpegBytes.length + " >>\nstream\n"),
      new Uint8Array(jpegBytes),
      strToBytes("\nendstream")
    ]));

    var xrefStart = parts.reduce(function (s, p) { return s + p.length; }, 0);
    var xref = "xref\n0 6\n0000000000 65535 f \n";
    for (var n = 1; n <= 5; n++) {
      var off = String(offsets[n] || 0);
      while (off.length < 10) off = "0" + off;
      xref += off + " 00000 n \n";
    }
    push(strToBytes(xref));
    push(strToBytes("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xrefStart + "\n%%EOF"));
    return concat(parts);
  }

  /* ========== 5. 权限控制 ========== */
  var roleEditId = null;
  var rolesData = [
    {
      id: "r1",
      name: "系统管理员",
      desc: "全系统配置与运维",
      people: [
        { name: "陈主任", uid: "A1001", dept: "教务处", phone: "138****1001" },
        { name: "刘老师", uid: "A1002", dept: "信息中心", phone: "139****1002" }
      ]
    },
    {
      id: "r2",
      name: "部门管理员",
      desc: "本学院考试项目与督导",
      people: [
        { name: "周秘书", uid: "B2001", dept: "外国语学院", phone: "137****2001" },
        { name: "吴老师", uid: "B2002", dept: "理学院", phone: "136****2002" },
        { name: "郑老师", uid: "B2003", dept: "计算机学院", phone: "135****2003" }
      ]
    },
    {
      id: "r3",
      name: "课程管理员",
      desc: "课程考核方案与题库管理",
      people: [
        { name: "张老师", uid: "C3001", dept: "理学院·高等数学", phone: "133****3001" },
        { name: "李老师", uid: "C3002", dept: "外国语学院·英语", phone: "132****3002" },
        { name: "王老师", uid: "C3003", dept: "计算机学院·程设", phone: "131****3003" }
      ]
    }
  ];

  var bankMembers = [
    { id: "bm1", name: "赵老师", dept: "理学院", role: "题库管理员", allowed: true },
    { id: "bm2", name: "钱老师", dept: "理学院", role: "成员", allowed: true },
    { id: "bm3", name: "外来教师甲", dept: "外聘", role: "非成员", allowed: false }
  ];

  function findRole(id) {
    for (var i = 0; i < rolesData.length; i++) {
      if (rolesData[i].id === id) return rolesData[i];
    }
    return null;
  }

  function renderRoles() {
    var body = document.getElementById("roleTableBody");
    if (!body) return;
    if (!rolesData.length) {
      body.innerHTML = "<tr><td colspan='5' style='text-align:center;color:#999;'>暂无角色，请点击「新增角色」</td></tr>";
      return;
    }
    body.innerHTML = rolesData.map(function (r) {
      var names = r.people.map(function (p) { return p.name; }).join("、") || "—";
      if (names.length > 24) names = names.slice(0, 24) + "…";
      return "<tr>" +
        "<td><strong>" + escapeAttr(r.name) + "</strong></td>" +
        "<td>" + escapeAttr(r.desc) + "</td>" +
        "<td>" + r.people.length + "</td>" +
        "<td style='max-width:220px;'>" + escapeAttr(names) + "</td>" +
        "<td class='ops'>" +
        "<button type='button' class='btn-link' onclick=\"openRoleEditor('" + r.id + "')\">编辑</button>" +
        "<button type='button' class='btn-link' onclick=\"deleteRole('" + r.id + "')\">删除</button>" +
        "</td></tr>";
    }).join("");
  }

  window.openRoleEditor = function (id) {
    roleEditId = id || null;
    var title = document.getElementById("roleModalTitle");
    var nameInput = document.getElementById("roleNameInput");
    var descInput = document.getElementById("roleDescInput");
    var peopleBody = document.getElementById("rolePeopleBody");
    if (!nameInput || !descInput || !peopleBody) return;

    if (id) {
      var role = findRole(id);
      if (!role) return;
      if (title) title.textContent = "编辑角色 · " + role.name;
      nameInput.value = role.name;
      descInput.value = role.desc;
      peopleBody.innerHTML = role.people.map(function (p) {
        return rolePersonRowHtml(p);
      }).join("") || rolePersonRowHtml({});
    } else {
      if (title) title.textContent = "新增角色";
      nameInput.value = "";
      descInput.value = "";
      peopleBody.innerHTML = rolePersonRowHtml({});
    }
    openModal("modalRoleEdit");
  };

  function rolePersonRowHtml(p) {
    p = p || {};
    return "<tr>" +
      "<td><input data-p='name' value='" + escapeAttr(p.name || "") + "' placeholder='姓名' /></td>" +
      "<td><input data-p='uid' value='" + escapeAttr(p.uid || "") + "' placeholder='工号' /></td>" +
      "<td><input data-p='dept' value='" + escapeAttr(p.dept || "") + "' placeholder='部门' /></td>" +
      "<td><input data-p='phone' value='" + escapeAttr(p.phone || "") + "' placeholder='联系方式' /></td>" +
      "<td><button type='button' class='btn-link' onclick='this.closest(\"tr\").remove()'>删除</button></td>" +
      "</tr>";
  }

  window.addRolePersonRow = function () {
    var body = document.getElementById("rolePeopleBody");
    if (!body) return;
    body.insertAdjacentHTML("beforeend", rolePersonRowHtml({}));
  };

  window.saveRoleEditor = function () {
    var name = (document.getElementById("roleNameInput") || {}).value || "";
    name = name.trim();
    if (!name) {
      toast("请填写角色名称");
      return;
    }
    var desc = ((document.getElementById("roleDescInput") || {}).value || "").trim();
    var people = [];
    document.querySelectorAll("#rolePeopleBody tr").forEach(function (tr) {
      var get = function (k) {
        var el = tr.querySelector("[data-p='" + k + "']");
        return el ? el.value.trim() : "";
      };
      var person = { name: get("name"), uid: get("uid"), dept: get("dept"), phone: get("phone") };
      if (person.name) people.push(person);
    });

    if (roleEditId) {
      var role = findRole(roleEditId);
      if (!role) return;
      role.name = name;
      role.desc = desc;
      role.people = people;
      toast("角色「" + name + "」已更新（" + people.length + " 人）");
    } else {
      rolesData.push({
        id: "r" + Date.now(),
        name: name,
        desc: desc || "自定义角色",
        people: people
      });
      toast("已新增角色「" + name + "」（" + people.length + " 人）");
    }
    closeModal("modalRoleEdit");
    renderRoles();
  };

  window.deleteRole = function (id) {
    var role = findRole(id);
    if (!role) return;
    if (!confirm("确认删除角色「" + role.name + "」？其下人员授权将一并移除。")) return;
    rolesData = rolesData.filter(function (r) { return r.id !== id; });
    renderRoles();
    toast("已删除角色「" + role.name + "」");
  };

  function renderBankMembers() {
    var body = document.getElementById("bankMemberBody");
    if (!body) return;
    if (!bankMembers.length) {
      body.innerHTML = "<tr><td colspan='5' style='text-align:center;color:#999;'>暂无成员，请添加</td></tr>";
      return;
    }
    body.innerHTML = bankMembers.map(function (m) {
      var access = m.allowed
        ? "<span class='tag tag-green'>允许</span>"
        : "<span class='tag tag-red'>无权访问</span>";
      var op = m.allowed
        ? "<button type='button' class='btn-link' onclick=\"removeBankMember('" + m.id + "')\">移除</button>"
        : "<button type='button' class='btn-link' onclick=\"promoteBankMember('" + m.id + "')\">添加为成员</button>";
      return "<tr>" +
        "<td>" + escapeAttr(m.name) + "</td>" +
        "<td>" + escapeAttr(m.dept || "—") + "</td>" +
        "<td>" + escapeAttr(m.role) + "</td>" +
        "<td>" + access + "</td>" +
        "<td class='ops'>" + op + "</td></tr>";
    }).join("");
  }

  window.removeBankMember = function (id) {
    var m = null;
    for (var i = 0; i < bankMembers.length; i++) {
      if (bankMembers[i].id === id) { m = bankMembers[i]; break; }
    }
    if (!m) return;
    if (m.role === "题库管理员") {
      var adminCount = bankMembers.filter(function (x) { return x.allowed && x.role === "题库管理员"; }).length;
      if (adminCount <= 1) {
        toast("至少保留 1 位题库管理员");
        return;
      }
    }
    if (!confirm("确认将「" + m.name + "」从题库成员中移除？移除后将无权访问。")) return;
    m.allowed = false;
    m.role = "非成员";
    renderBankMembers();
    toast("已移除「" + m.name + "」，现为无权访问");
  };

  window.promoteBankMember = function (id) {
    var m = null;
    for (var i = 0; i < bankMembers.length; i++) {
      if (bankMembers[i].id === id) { m = bankMembers[i]; break; }
    }
    if (!m) return;
    m.allowed = true;
    m.role = "成员";
    renderBankMembers();
    toast("已将「" + m.name + "」添加为题库成员");
  };

  window.openAddBankMember = function () {
    var n = document.getElementById("bankAddName");
    var d = document.getElementById("bankAddDept");
    var r = document.getElementById("bankAddRole");
    if (n) n.value = "";
    if (d) d.value = "";
    if (r) r.value = "成员";
    openModal("modalBankAdd");
  };

  window.confirmAddBankMember = function () {
    var name = ((document.getElementById("bankAddName") || {}).value || "").trim();
    if (!name) {
      toast("请填写姓名");
      return;
    }
    var dept = ((document.getElementById("bankAddDept") || {}).value || "").trim() || "—";
    var role = ((document.getElementById("bankAddRole") || {}).value || "成员");
    // 若已有同名非成员，直接提升
    var existed = null;
    for (var i = 0; i < bankMembers.length; i++) {
      if (bankMembers[i].name === name) { existed = bankMembers[i]; break; }
    }
    if (existed) {
      existed.allowed = true;
      existed.role = role;
      existed.dept = dept;
      toast("已更新「" + name + "」为" + role);
    } else {
      bankMembers.push({
        id: "bm" + Date.now(),
        name: name,
        dept: dept,
        role: role,
        allowed: true
      });
      toast("已添加题库成员「" + name + "」");
    }
    closeModal("modalBankAdd");
    renderBankMembers();
  };

  /* 课程权限：先选学科，再选课程，再配置 */
  var COURSE_PERM_ITEMS = ["录题", "审题", "删改试题", "管理组卷方案", "组卷", "导出试卷文档", "安排考试"];
  var SUBJECT_COURSES = {
    math: { label: "理学", courses: [
      { id: "gaoshu", name: "高等数学" },
      { id: "xianxing", name: "线性代数" },
      { id: "gailv", name: "概率论与数理统计" }
    ]},
    eng: { label: "外语", courses: [
      { id: "daxueyingyu", name: "大学英语" },
      { id: "yingyutingli", name: "英语听力" }
    ]},
    cs: { label: "工学·计算机", courses: [
      { id: "chengshe", name: "程序设计基础" },
      { id: "shuju", name: "数据结构" },
      { id: "caozuo", name: "操作系统" }
    ]},
    phy: { label: "理学·物理", courses: [
      { id: "daxuewuli", name: "大学物理" },
      { id: "wulishiyan", name: "大学物理实验" }
    ]}
  };
  var coursePermStore = {
    // 预置示例：不同课程默认权限可不同
    gaoshu: { "录题": true, "审题": true, "删改试题": true, "管理组卷方案": true, "组卷": true, "导出试卷文档": true, "安排考试": true },
    chengshe: { "录题": true, "审题": true, "删改试题": false, "管理组卷方案": true, "组卷": true, "导出试卷文档": false, "安排考试": true },
    daxueyingyu: { "录题": true, "审题": false, "删改试题": false, "管理组卷方案": true, "组卷": true, "导出试卷文档": true, "安排考试": true }
  };

  function defaultCoursePerm() {
    var o = {};
    COURSE_PERM_ITEMS.forEach(function (k) { o[k] = true; });
    return o;
  }

  function getCoursePerm(courseId) {
    if (!coursePermStore[courseId]) {
      coursePermStore[courseId] = defaultCoursePerm();
    }
    return coursePermStore[courseId];
  }

  function bindCoursePermSelectors() {
    var subjectEl = document.getElementById("coursePermSubject");
    var courseEl = document.getElementById("coursePermCourse");
    if (!subjectEl || !courseEl) return;

    subjectEl.addEventListener("change", function () {
      var sid = subjectEl.value;
      var hint = document.getElementById("coursePermSelectHint");
      var card = document.getElementById("coursePermConfigCard");
      courseEl.innerHTML = "";
      if (!sid || !SUBJECT_COURSES[sid]) {
        courseEl.disabled = true;
        courseEl.innerHTML = "<option value=''>请先选择学科</option>";
        if (card) card.style.display = "none";
        if (hint) hint.textContent = "请先选择学科，再选择具体课程，然后配置该课程权限。";
        return;
      }
      courseEl.disabled = false;
      var list = SUBJECT_COURSES[sid].courses;
      courseEl.innerHTML = "<option value=''>请选择课程</option>" + list.map(function (c) {
        return "<option value='" + c.id + "'>" + c.name + "</option>";
      }).join("");
      if (card) card.style.display = "none";
      if (hint) hint.textContent = "已选学科「" + SUBJECT_COURSES[sid].label + "」，请继续选择课程。";
    });

    courseEl.addEventListener("change", function () {
      loadCoursePermUI();
    });
  }

  function loadCoursePermUI() {
    var subjectEl = document.getElementById("coursePermSubject");
    var courseEl = document.getElementById("coursePermCourse");
    var card = document.getElementById("coursePermConfigCard");
    var title = document.getElementById("coursePermTitle");
    var path = document.getElementById("coursePermPath");
    var hint = document.getElementById("coursePermSelectHint");
    if (!subjectEl || !courseEl || !card) return;

    var sid = subjectEl.value;
    var cid = courseEl.value;
    if (!sid || !cid || !SUBJECT_COURSES[sid]) {
      card.style.display = "none";
      return;
    }
    var course = null;
    SUBJECT_COURSES[sid].courses.forEach(function (c) {
      if (c.id === cid) course = c;
    });
    if (!course) {
      card.style.display = "none";
      return;
    }

    card.style.display = "block";
    if (title) title.textContent = course.name;
    if (path) path.textContent = SUBJECT_COURSES[sid].label + " / " + course.name;
    if (hint) hint.textContent = "正在配置：「" + course.name + "」。修改勾选后请点击保存。";

    var perms = getCoursePerm(cid);
    document.querySelectorAll("#coursePermChecks input[data-perm]").forEach(function (cb) {
      var key = cb.getAttribute("data-perm");
      cb.checked = !!perms[key];
    });
  }

  window.saveCoursePerm = function () {
    var courseEl = document.getElementById("coursePermCourse");
    var subjectEl = document.getElementById("coursePermSubject");
    if (!courseEl || !courseEl.value) {
      toast("请先选择学科和课程");
      return;
    }
    var cid = courseEl.value;
    var perms = getCoursePerm(cid);
    document.querySelectorAll("#coursePermChecks input[data-perm]").forEach(function (cb) {
      perms[cb.getAttribute("data-perm")] = cb.checked;
    });
    var courseName = courseEl.options[courseEl.selectedIndex].text;
    var enabled = COURSE_PERM_ITEMS.filter(function (k) { return perms[k]; });
    toast("已保存「" + courseName + "」权限（已启用 " + enabled.length + "/" + COURSE_PERM_ITEMS.length + " 项）");
  };

  window.resetCoursePerm = function () {
    var courseEl = document.getElementById("coursePermCourse");
    if (!courseEl || !courseEl.value) {
      toast("请先选择课程");
      return;
    }
    coursePermStore[courseEl.value] = defaultCoursePerm();
    loadCoursePermUI();
    toast("已恢复为默认全开，记得点击保存");
  };

  /* ========== 6. 试题动态标签筛选 ========== */
  var qTagQuestions = [
    { id: "Q10021", stem: "求极限 lim…", status: "在用", useCount: 12, scoreRate: "88%", planned: "易", actualHtml: "<span class='tag tag-blue'>偏易 (0.88)</span>" },
    { id: "Q10088", stem: "讨论级数敛散性…", status: "在用", useCount: 7, scoreRate: "41%", planned: "中", actualHtml: "<span class='tag tag-red'>偏难 (0.41)</span>" },
    { id: "Q10055", stem: "计算二重积分…", status: "在用", useCount: 3, scoreRate: "63%", planned: "中", actualHtml: "<span class='tag tag-gold'>接近标定 (0.63)</span>" },
    { id: "Q10102", stem: "证明中值定理应用…", status: "闲置", useCount: 0, scoreRate: "—", planned: "难", actualHtml: "<span class='tag tag-gray'>暂无数据</span>" },
    { id: "Q10118", stem: "求曲线弧长…", status: "闲置", useCount: 0, scoreRate: "—", planned: "中", actualHtml: "<span class='tag tag-gray'>暂无数据</span>" },
    { id: "Q10033", stem: "旧版导数定义辨析…", status: "停用", useCount: 15, scoreRate: "52%", planned: "中", actualHtml: "<span class='tag tag-orange'>已停用不再组卷</span>" },
    { id: "Q10071", stem: "含超纲内容的积分题…", status: "停用", useCount: 2, scoreRate: "29%", planned: "难", actualHtml: "<span class='tag tag-red'>超纲停用</span>" }
  ];

  function statusTagHtml(status) {
    var cls = status === "在用" ? "tag-green" : status === "闲置" ? "tag-gray" : "tag-orange";
    return "<span class='tag " + cls + "'>" + status + "</span>";
  }

  function renderQTagTable() {
    var body = document.getElementById("qTagTableBody");
    var statusEl = document.getElementById("qTagStatusFilter");
    var kwEl = document.getElementById("qTagKeyword");
    var hint = document.getElementById("qTagCountHint");
    if (!body) return;

    var status = statusEl ? statusEl.value : "";
    var kw = kwEl ? kwEl.value.trim() : "";
    var list = qTagQuestions.filter(function (q) {
      if (status && q.status !== status) return false;
      if (kw && q.stem.indexOf(kw) < 0 && q.id.indexOf(kw) < 0) return false;
      return true;
    });

    if (hint) {
      hint.textContent = status
        ? "（" + status + " " + list.length + " 题 / 共 " + qTagQuestions.length + " 题）"
        : "（共 " + list.length + " 题）";
    }

    if (!list.length) {
      body.innerHTML = "<tr><td colspan='8' style='text-align:center;color:#999;'>当前筛选条件下暂无试题</td></tr>";
      return;
    }

    body.innerHTML = list.map(function (q) {
      return "<tr>" +
        "<td>" + q.id + "</td>" +
        "<td>" + escapeAttr(q.stem) + "</td>" +
        "<td>" + statusTagHtml(q.status) + "</td>" +
        "<td>" + q.useCount + "</td>" +
        "<td>" + q.scoreRate + "</td>" +
        "<td>" + q.planned + "</td>" +
        "<td>" + q.actualHtml + "</td>" +
        "<td><button type='button' class='btn-link' onclick=\"openModal('modalFixTag')\">修正属性</button></td>" +
        "</tr>";
    }).join("");
  }

  function bindQTagFilters() {
    var statusEl = document.getElementById("qTagStatusFilter");
    var kwEl = document.getElementById("qTagKeyword");
    if (statusEl) statusEl.addEventListener("change", renderQTagTable);
    if (kwEl) {
      kwEl.addEventListener("input", renderQTagTable);
      kwEl.addEventListener("search", renderQTagTable);
    }
  }

  /* ========== 7. 建库申请 ========== */
  var createdBanks = [
    {
      id: "QB-HS-001",
      name: "高等数学题库",
      type: "课程题库",
      courses: ["高等数学"],
      questions: 820,
      target: 800,
      locked: false,
      applyId: "BK2026008",
      createdAt: "2026-03-02 10:06",
      admins: ["张老师"],
      members: ["赵老师", "钱老师"],
      typeDist: "单选40% / 多选20% / 填空20% / 解答20%",
      diffDist: "易30% / 中50% / 难20%",
      auditIn: true
    },
    {
      id: "QB-YY-002",
      name: "大学英语题库",
      type: "课程题库",
      courses: ["大学英语"],
      questions: 560,
      target: 600,
      locked: true,
      applyId: "BK2026003",
      createdAt: "2026-01-18 15:22",
      admins: ["李老师"],
      members: ["孙老师"],
      typeDist: "单选35% / 多选15% / 填空25% / 写作25%",
      diffDist: "易25% / 中55% / 难20%",
      auditIn: true
    },
    {
      id: "QB-CS-003",
      name: "程序设计基础题库",
      type: "课程题库",
      courses: ["程序设计基础"],
      questions: 410,
      target: 500,
      locked: false,
      applyId: "BK2026005",
      createdAt: "2026-02-11 09:40",
      admins: ["王老师"],
      members: ["周老师", "吴老师"],
      typeDist: "单选30% / 判断20% / 填空20% / 编程30%",
      diffDist: "易30% / 中40% / 难30%",
      auditIn: false
    }
  ];

  var bankApplyRecords = [
    {
      id: "BK2026008",
      courses: ["高等数学"],
      type: "课程题库",
      target: 800,
      status: "已通过",
      result: "已按参数自动建库",
      bankId: "QB-HS-001",
      currentStep: 3,
      flow: [
        { name: "课程负责人提交", actor: "张老师", status: "已完成", time: "2026-03-01 09:12", comment: "提交建库申请" },
        { name: "教研室主任审核", actor: "陈主任", status: "已通过", time: "2026-03-01 14:20", comment: "题量目标合理，同意" },
        { name: "学院教学秘书复核", actor: "周秘书", status: "已通过", time: "2026-03-02 10:05", comment: "同意建库" },
        { name: "系统自动建库", actor: "系统", status: "已完成", time: "2026-03-02 10:06", comment: "已按参数创建题库" }
      ]
    },
    {
      id: "BK2026009",
      courses: ["高等数学", "线性代数", "概率论与数理统计"],
      type: "综合题库",
      target: 2000,
      status: "审批中",
      result: "—",
      bankId: null,
      currentStep: 1,
      flow: [
        { name: "课程负责人提交", actor: "李老师", status: "已完成", time: "2026-07-10 11:30", comment: "申请公共基础综合库" },
        { name: "教研室主任审核", actor: "陈主任", status: "审批中", time: "—", comment: "等待处理" },
        { name: "学院教学秘书复核", actor: "周秘书", status: "待流转", time: "—", comment: "—" },
        { name: "系统自动建库", actor: "系统", status: "待执行", time: "—", comment: "通过后自动建库" }
      ]
    },
    {
      id: "BK2026010",
      courses: ["程序设计基础"],
      type: "课程题库",
      target: 600,
      status: "已驳回",
      result: "题型分布需调整后重提",
      bankId: null,
      currentStep: 1,
      flow: [
        { name: "课程负责人提交", actor: "王老师", status: "已完成", time: "2026-07-08 16:02", comment: "提交建库" },
        { name: "教研室主任审核", actor: "钱主任", status: "已驳回", time: "2026-07-09 09:40", comment: "主观题占比偏低，请调整后重提" },
        { name: "学院教学秘书复核", actor: "周秘书", status: "已终止", time: "—", comment: "—" },
        { name: "系统自动建库", actor: "系统", status: "已终止", time: "—", comment: "—" }
      ]
    }
  ];

  function syncBankCourseMode() {
    var typeEl = document.getElementById("bankApplyType");
    var singleWrap = document.getElementById("bankCourseSingleWrap");
    var multiWrap = document.getElementById("bankCourseMultiWrap");
    if (!typeEl) return;
    var isMulti = typeEl.value === "multi";
    if (singleWrap) singleWrap.style.display = isMulti ? "none" : "flex";
    if (multiWrap) multiWrap.style.display = isMulti ? "block" : "none";
    updateBankCourseMultiHint();
  }

  function updateBankCourseMultiHint() {
    var hint = document.getElementById("bankCourseMultiHint");
    var n = document.querySelectorAll("#bankCourseMultiList input:checked").length;
    if (hint) hint.textContent = "已选 " + n + " 门";
  }

  function bindBankApplyForm() {
    var typeEl = document.getElementById("bankApplyType");
    if (typeEl) typeEl.addEventListener("change", syncBankCourseMode);
    document.querySelectorAll("#bankCourseMultiList input[type=checkbox]").forEach(function (cb) {
      cb.addEventListener("change", updateBankCourseMultiHint);
    });
    var kw = document.getElementById("createdBankKeyword");
    if (kw) {
      kw.addEventListener("input", renderCreatedBanks);
      kw.addEventListener("search", renderCreatedBanks);
    }
    syncBankCourseMode();
  }

  function statusTagForBank(status) {
    var cls = status === "已通过" ? "tag-green" : status === "审批中" ? "tag-orange" : status === "已驳回" ? "tag-red" : "tag-gray";
    return "<span class='tag " + cls + "'>" + status + "</span>";
  }

  function findCreatedBank(id) {
    for (var i = 0; i < createdBanks.length; i++) {
      if (createdBanks[i].id === id) return createdBanks[i];
    }
    return null;
  }

  function renderBankApplyRecords() {
    var body = document.getElementById("bankApplyBody");
    if (!body) return;
    body.innerHTML = bankApplyRecords.map(function (r, idx) {
      var op = r.bankId
        ? "<button type='button' class='btn-link' onclick=\"viewCreatedBank('" + r.bankId + "')\">查看建成库</button>"
        : "<span class='hint'>—</span>";
      return "<tr>" +
        "<td>" + r.id + "</td>" +
        "<td>" + escapeAttr(r.courses.join("、")) + "</td>" +
        "<td>" + r.type + "</td>" +
        "<td>" + r.target + "</td>" +
        "<td><button type='button' class='btn-link' onclick='viewBankApplyFlow(" + idx + ")' title='查看审批流程'>" +
        statusTagForBank(r.status) + "</button></td>" +
        "<td>" + escapeAttr(r.result) + "</td>" +
        "<td class='ops'>" + op + "</td></tr>";
    }).join("");
  }

  function renderCreatedBanks() {
    var body = document.getElementById("createdBankBody");
    var hint = document.getElementById("createdBankCountHint");
    var kwEl = document.getElementById("createdBankKeyword");
    if (!body) return;
    var kw = kwEl ? kwEl.value.trim() : "";
    var list = createdBanks.filter(function (b) {
      if (!kw) return true;
      return b.name.indexOf(kw) >= 0 || b.courses.join("、").indexOf(kw) >= 0 || b.id.indexOf(kw) >= 0;
    });
    if (hint) hint.textContent = "（" + list.length + " / " + createdBanks.length + "）";
    if (!list.length) {
      body.innerHTML = "<tr><td colspan='8' style='text-align:center;color:#999;'>暂无已建成题库</td></tr>";
      return;
    }
    body.innerHTML = list.map(function (b) {
      return "<tr>" +
        "<td><strong>" + escapeAttr(b.name) + "</strong><div class='hint'>" + b.id + "</div></td>" +
        "<td>" + b.type + "</td>" +
        "<td>" + escapeAttr(b.courses.join("、")) + "</td>" +
        "<td>" + b.questions + " / " + b.target + "</td>" +
        "<td>" + (b.locked ? "<span class='tag tag-orange'>密码锁</span>" : "<span class='tag tag-green'>未锁定</span>") + "</td>" +
        "<td>" + (b.applyId || "—") + "</td>" +
        "<td>" + b.createdAt + "</td>" +
        "<td class='ops'>" +
        "<button type='button' class='btn-link' onclick=\"viewCreatedBank('" + b.id + "')\">查看</button>" +
        "<button type='button' class='btn-link' onclick=\"enterCreatedBank('" + b.id + "')\">进入</button>" +
        "</td></tr>";
    }).join("");
  }

  window.enterCreatedBank = function (bankId) {
    var b = findCreatedBank(bankId);
    if (!b) return;
    toast("已进入题库「" + b.name + "」（演示）");
  };

  window.viewCreatedBank = function (bankId) {
    var b = findCreatedBank(bankId);
    if (!b) {
      toast("未找到对应建成题库");
      return;
    }
    var title = document.getElementById("bankDetailTitle");
    var body = document.getElementById("bankDetailBody");
    var enterBtn = document.getElementById("bankDetailEnterBtn");
    if (title) title.textContent = "已建成题库 · " + b.name;
    if (body) {
      body.innerHTML =
        "<div class='grid-2' style='margin-bottom:12px;'>" +
        "<div class='stat-box'><div class='num' style='font-size:18px'>" + b.questions + "</div><div class='lbl'>当前题量</div></div>" +
        "<div class='stat-box'><div class='num' style='font-size:18px'>" + b.target + "</div><div class='lbl'>建设目标</div></div>" +
        "</div>" +
        "<p style='font-size:13px;line-height:1.9'>" +
        "题库编号：<strong>" + b.id + "</strong><br/>" +
        "类型：<strong>" + b.type + "</strong><br/>" +
        "关联课程：<strong>" + escapeAttr(b.courses.join("、")) + "</strong><br/>" +
        "密码锁定：<strong>" + (b.locked ? "已启用" : "未启用") + "</strong><br/>" +
        "入库审核：<strong>" + (b.auditIn ? "已启用" : "未启用") + "</strong><br/>" +
        "题型分布：" + escapeAttr(b.typeDist) + "<br/>" +
        "难易度分布：" + escapeAttr(b.diffDist) + "<br/>" +
        "管理员：" + escapeAttr(b.admins.join("、")) + "<br/>" +
        "成员：" + escapeAttr(b.members.join("、")) + "<br/>" +
        "来源申请：" + (b.applyId || "—") + "<br/>" +
        "建成时间：" + b.createdAt +
        "</p>";
    }
    if (enterBtn) {
      enterBtn.onclick = function () {
        closeModal("modalBankDetail");
        toast("已进入题库「" + b.name + "」（演示）");
      };
    }
    openModal("modalBankDetail");
  };

  window.submitBankApply = function () {
    var typeEl = document.getElementById("bankApplyType");
    var isMulti = typeEl && typeEl.value === "multi";
    var courses = [];
    if (isMulti) {
      document.querySelectorAll("#bankCourseMultiList input:checked").forEach(function (cb) {
        courses.push(cb.value);
      });
      if (courses.length < 2) {
        toast("综合题库请至少勾选 2 门关联课程");
        return;
      }
    } else {
      var single = document.getElementById("bankCourseSingle");
      courses = [single ? single.value : "高等数学"];
    }

    var target = Number((document.getElementById("bankApplyTarget") || {}).value) || 800;
    var id = "BK2026" + String(100 + bankApplyRecords.length).slice(-3);
    bankApplyRecords.unshift({
      id: id,
      courses: courses,
      type: isMulti ? "综合题库" : "课程题库",
      target: target,
      status: "审批中",
      result: "—",
      bankId: null,
      currentStep: 1,
      flow: [
        { name: "课程负责人提交", actor: "当前用户", status: "已完成", time: new Date().toLocaleString(), comment: "新提交建库申请" },
        { name: "教研室主任审核", actor: "待分配", status: "审批中", time: "—", comment: "等待处理" },
        { name: "学院教学秘书复核", actor: "周秘书", status: "待流转", time: "—", comment: "—" },
        { name: "系统自动建库", actor: "系统", status: "待执行", time: "—", comment: "通过后按参数自动建库" }
      ]
    });
    renderBankApplyRecords();
    toast("建库申请 " + id + " 已提交（关联：" + courses.join("、") + "），可点击状态查看审批流程");
  };

  window.viewBankApplyFlow = function (idx) {
    var r = bankApplyRecords[idx];
    if (!r) return;
    var title = document.getElementById("bankFlowTitle");
    var meta = document.getElementById("bankFlowMeta");
    var nodes = document.getElementById("bankFlowNodes");
    var detail = document.getElementById("bankFlowDetailBody");

    if (title) title.textContent = "审批流程 · " + r.id;
    if (meta) {
      meta.innerHTML = "类型：<strong>" + r.type + "</strong> · 关联课程：<strong>" +
        escapeAttr(r.courses.join("、")) + "</strong> · 当前状态：" + statusTagForBank(r.status) +
        " · 当前节点：第 " + (r.currentStep + 1) + " 步「" + r.flow[r.currentStep].name + "」" +
        (r.bankId ? " · <button type='button' class='btn-link' onclick=\"closeModal('modalBankFlow');viewCreatedBank('" + r.bankId + "')\">查看已建成题库</button>" : "");
    }
    if (nodes) {
      nodes.innerHTML = r.flow.map(function (step, i) {
        var cls = "flow-node";
        if (step.status === "已通过" || step.status === "已完成") cls += " done-node";
        if (i === r.currentStep && (r.status === "审批中")) cls += " active-node";
        if (step.status === "已驳回") cls += " reject-node";
        var html = "<div class='" + cls + "'><strong>" + (i + 1) + ". " + step.name + "</strong>" +
          step.actor + "<br/><span class='hint'>" + step.status + "</span></div>";
        if (i < r.flow.length - 1) html += "<div class='flow-arrow'>→</div>";
        return html;
      }).join("");
    }
    if (detail) {
      detail.innerHTML = r.flow.map(function (step) {
        return "<tr><td>" + step.name + "</td><td>" + step.actor + "</td><td>" +
          statusTagForBank(step.status === "审批中" ? "审批中" : step.status === "已驳回" ? "已驳回" : step.status === "已通过" || step.status === "已完成" ? "已通过" : step.status) +
          "</td><td>" + step.time + "</td><td>" + escapeAttr(step.comment) + "</td></tr>";
      }).join("");
    }
    openModal("modalBankFlow");
  };

  // init
  bindSchemeWatchers();
  updateSheetStructHint();
  renderOcrAnswerKey();
  renderRoles();
  renderBankMembers();
  bindCoursePermSelectors();
  bindQTagFilters();
  renderQTagTable();
  bindDupBankChecks();
  bindBankApplyForm();
  renderBankApplyRecords();
  renderCreatedBanks();

  window.__wjyShowPageHook = function (id) {
    try {
      if (id === "ocr") renderOcrAnswerKey();
      if (id === "answerSheet") updateSheetStructHint();
      if (id === "permission") { renderRoles(); renderBankMembers(); }
      if (id === "bankApply") { renderBankApplyRecords(); renderCreatedBanks(); }
      if (id === "qTag") renderQTagTable();
      if (id === "scheme" && typeof recalcSchemeRatios === "function") recalcSchemeRatios();
      if (id === "paperDup" && typeof bindDupBankChecks === "function") bindDupBankChecks();
    } catch (e) { console.warn("wjy page hook", e); }
  };
})();
