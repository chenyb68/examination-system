# MERGE_NOTES (wjy.html → 标星参数陪标原型)

Source HTML: `g:\拓维实习资料\wjy-考试系统标星功能原型\鏍囨槦鍙傛暟闄爣鍘熷瀷\wjy.html`

## Extracted HTML line ranges (wjy.html)

| Section ID | Output file | Lines (inclusive) | Approx. size |
|---|---|---|---:|
| `page-scheme` | `scheme.html` | 455–558 | 6590 B |
| `page-answerSheet` | `answerSheet.html` | 561–641 | 4962 B |
| `page-ocr` | `ocr.html` | 644–700 | 3476 B |
| `page-analysis` | `analysis.html` | 703–1032 | 21375 B |
| `page-permission` | `permission.html` | 1035–1118 | 4863 B |
| `page-bankApply` | `bankApply.html` | 1121–1209 | 5448 B |
| `page-qTag` | `qTag.html` | 1212–1239 | 1386 B |
| `page-paperDup` | `paperDup.html` | 1242–1283 | 3105 B |

## Related modals (`modals.html`, `modal-mask` only)

Excluded: `modalAudit`, `modalSupervise`, `modalType` (audit/supervise/type flows).

- `modalHistory`: wjy.html lines 1341–1380
- `modalRoleEdit`: wjy.html lines 1382–1406
- `modalBankAdd`: wjy.html lines 1408–1425
- `modalDupLocate`: wjy.html lines 1427–1444
- `modalBankDetail`: wjy.html lines 1446–1458
- `modalBankFlow`: wjy.html lines 1460–1480
- `modalDupEdit`: wjy.html lines 1482–1507
- `modalFixTag`: wjy.html lines 1509–1524

## Page diff vs user `index.html` (structural)

| Page ID | In user index? | User section chars | Colleague extract chars | Δ |
|---|---|---:|---:|---:|
| `page-scheme` | yes | 4803 | 5581 | +778 |
| `page-answerSheet` | yes | 2000 | 4310 | +2310 |
| `page-ocr` | yes | 2430 | 2917 | +487 |
| `page-analysis` | yes | 6028 | 19724 | +13696 |
| `page-permission` | yes | 2374 | 4163 | +1789 |
| `page-bankApply` | yes | 3120 | 4630 | +1510 |
| `page-qTag` | yes | 1218 | 1170 | -48 |
| `page-paperDup` | yes | 2374 | 2628 | +254 |

## 1. Colleague `js/app.js` — functions not in user `app.js` (by module signals)

### scheme
- `bindSchemeRowEvents`
- `bindSchemeWatchers`
- `buildAnalysisPrintHtml (also: analysis)`
- `collectScoreDetail`
- `getSchemeRatioState`
- `markSchemeChanged`
- `recalcSchemeRatios`
- `refreshSchemeTasks`
- `renderSchemeScoreDetail`
- `renderSchemeTables`
- `schemeRowHtml`
- `setSchemeDirty`
- `snapshotScheme`

### answerSheet
- `buildSheetHtml (also: ocr)`
- `exportSheetAsPdf`
- `exportSheetAsWord (also: ocr)`
- `fallbackSheetPdf`
- `getSheetExportHtml (also: ocr)`
- `renderSheet (also: ocr)`
- `updateSheetStructHint`
- `updateSheetTplHint`

### ocr
- `collectSectionsByType`
- `omrRowsHtml`
- `renderDomToJpeg`
- `renderOcrAnswerKey`
- `renderOcrBlock`
- `renderOmrBlock`
- `renderSubjBlock`
- `sheetHeaderHtml`

### analysis
- `buildAnalysisTextReport`

### permission
- `findRole`
- `rolePersonRowHtml`

### bankApply
- `bindBankApplyForm`
- `renderBankApplyRecords`
- `syncBankCourseMode`

### qTag
- `bindQTagFilters`
- `renderQTagTable`

### paperDup
- `bindDupBankChecks`
- `estimateDupSim`
- `getSelectedDupBanks`
- `refreshDupResultTable`
- `runDupCheckInternal`
- `showDupLocateModal`
- `updateDupSelectedHint`

### Shared / unassigned (still only in colleague `app.js`)

- `applyScoreDetailValues`
- `bindCoursePermSelectors`
- `buildPdfWithJpeg`
- `cloneTask`
- `defaultCoursePerm`
- `downloadSimplePdf`
- `emptyRow`
- `escapeAttr`
- `findCreatedBank`
- `fmtPct`
- `getCoursePerm`
- `itemNormPct`
- `loadCoursePermUI`
- `optionsHtml`
- `renderCreatedBanks`
- `setTask`
- `setText`
- `statusTagForBank`
- `statusTagHtml`
- `sumWeights`
- `updateBankCourseMultiHint`
- `val`

Key element IDs in extracts **absent** from user `index.html`: **76** total; examples:

- `bankApplyAudit`
- `bankApplyDiff`
- `bankApplyLock`
- `bankApplyTarget`
- `bankApplyType`
- `bankApplyTypes`
- `bankCourseMultiHint`
- `bankCourseMultiList`
- `bankCourseMultiWrap`
- `bankCourseSingle`
- `bankCourseSingleWrap`
- `btnSchemeSave`
- `btnSchemeSubmit`
- `btnSheetEdit`
- `coursePermChecks`
- `coursePermConfigCard`
- `coursePermCourse`
- `coursePermPath`
- `coursePermSelectHint`
- `coursePermSubject`
- `coursePermTitle`
- `createdBankBody`
- `createdBankCountHint`
- `createdBankKeyword`
- `dupBankList`

Duplicate IDs (already in user index): **23** — merge requires selective update. Examples: `bankApplyBody, bankMemberBody, dupResult, formativeBody, ocrResultBody, page-analysis, page-answerSheet, page-bankApply, page-ocr, page-paperDup, page-permission, page-qTag`

## 2. `enhance.js` conflict check

- Duplicate function `sumWeights`: colleague app.js vs user enhance.js
- Duplicate function `bindSchemeRowEvents`: colleague app.js vs user enhance.js
- Both touch `openModal` — merge router/modal hooks carefully
- User `enhance.js` typically wraps navigation and demo data; colleague handlers call the same global function names (`openModal`, page init on `showPage`). Prefer: keep user enhance patches, port colleague module init blocks behind the same page IDs.
- If both files register `DOMContentLoaded` listeners that bind the same `#id`, last script wins — check script order (`enhance.js` after `app.js`).

## 3. CSS classes in extracts present in colleague `common.css` but missing in user `common.css`

- `.dup-bank-item`
- `.dup-bank-list`
- `.flex-hd`
- `.normal-chart-wrap`
- `.on`
- `.task-desc`
- `.task-link-grid`
- `.task-link-item`
- `.task-status`
- `.task-title`
