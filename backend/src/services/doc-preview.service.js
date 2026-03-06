/**
 * doc-preview.service.js
 *
 * Node.js equivalent of the Java approach:
 *   1. Build full document model (reusing doc-generator.service.js section builders)
 *   2. Render ALL chapters to HTML (equivalent to Spire.Doc saveToStream(Html))
 *   3. Return the requested chapter slice (equivalent to jsoup h1-boundary extraction)
 *
 * Route: GET /api/doc-generate/:id/chapter/:chapterNumber?lang=en|fr|de|es
 */

import { LabelService } from '../utils/labels.js';
import * as repo from '../repositories/doc-generator.repo.js';
import { stripHtml } from './doc-generator.service.js';

// ─── Utilities ────────────────────────────────────────────────────────────────

function s(entry, key) {
  const v = entry?.[key];
  return v == null ? '' : String(v);
}

function d(dateVal) {
  if (!dateVal) return '';
  return String(dateVal).split('T')[0].replace('00:00:00.0', '').trim();
}

/** Safe HTML-escape for plain-text values */
function e(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getHeaderDate(reportDate, adoptionDate, statusCode) {
  if (statusCode === 'ADT' && adoptionDate) {
    return new Date(adoptionDate).toISOString().split('T')[0];
  }
  return (reportDate ? new Date(reportDate) : new Date()).toISOString().split('T')[0];
}

// ─── Shared CSS (mirrors Spire.Doc embedded stylesheet) ──────────────────────

const SHARED_STYLE = `<style>
  body  { font-family: Arial, sans-serif; font-size: 13px; color: #222;
          line-height: 1.65; max-width: 960px; margin: 24px auto; padding: 0 24px; }
  h1    { font-size: 14px; font-weight: bold; text-transform: uppercase;
          border-bottom: 2px solid #3a5a8a; color: #3a5a8a;
          padding-bottom: 4px; margin: 0 0 14px; }
  h2    { font-size: 13px; font-weight: bold; margin: 18px 0 6px; }
  p     { margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th    { background: #d0d7e8; border: 1px solid #9aabcc;
          padding: 5px 8px; text-align: left; font-weight: bold; }
  td    { border: 1px solid #c5ccd8; padding: 5px 8px; vertical-align: top; }
  tr:nth-child(even) td { background: #f7f8fb; }
  .grey-row td   { background: #e4e8ef !important; font-weight: bold; }
  .sub-expr td   { background: #fdfdfd; }
  .num           { color: #666; font-size: 11px; }
  .note          { font-style: italic; color: #555; }
  em             { color: #2a4a2a; }
  ul             { margin: 4px 0 4px 20px; }
  li             { margin: 3px 0; }
  .cover-row     { display: flex; gap: 16px; margin: 5px 0; }
  .cover-label   { font-weight: bold; min-width: 180px; color: #3a5a8a; }
  .cover-block   { border: 1px solid #c5ccd8; padding: 14px 18px;
                   background: #f9fafc; border-radius: 4px; margin-bottom: 18px; }
  hr             { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
</style>`;

/**
 * Wraps an HTML fragment into a full document with the chapter h1 heading.
 * Mirrors the <html><head><style>...</style></head><body> wrapper that
 * Spire.Doc produces when calling saveToStream(FileFormat.Html).
 */
function wrapChapter(headingText, bodyFragment) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${e(headingText)}</title>
  ${SHARED_STYLE}
</head>
<body>
<h1>${e(headingText)}</h1>
${bodyFragment}
</body>
</html>`;
}

// ─── Section renderers (one per chapter, returns { heading, html } ) ──────────
// Each renderer is the Node.js equivalent of the corresponding Java
// appendChapterN() block inside buildTGDocument().

async function renderCover(tgId, lang, labels, header) {
  const [upovList, cpiList, botList] = await Promise.all([
    repo.getUpovCodesList(tgId),
    repo.getCpiDetailsList(tgId, lang),
    repo.getBotanicalNames(tgId),
  ]);

  const tgRef  = s(header, 'TG_Reference');
  const tgName = s(header, 'TG_Name');
  const assoDoc = stripHtml(s(header, 'Name_AssoDocInfo'));
  const statusCode  = s(header, 'Status_Code');
  const adoptionDate = header.TG_AdoptionDate;
  const headerDate = getHeaderDate(null, adoptionDate, statusCode);

  let upovCodes = '', botHtml = '', excUpov = '', excBot = '';
  for (const row of upovList) {
    upovCodes = s(row, 'UPOV_CODES').replace(/ ;/g, '; ').replace(/;/g, '; ').replace(/  /g, ' ');
    const eu = s(row, 'Exclude_UPOV_CODE_COMMENTS');
    if (eu && eu !== 'Add comment,  if appropriate') excUpov = stripHtml(eu);
    botHtml = s(row, 'title1').replace(/<p>/g, '').replace(/<\/p>/g, '').replace(/\r\n/g, '');
    const eb = s(row, 'Exlude_Botanical_Names_COMMENTS');
    if (eb?.trim()) excBot = stripHtml(eb);
  }

  const cpi = cpiList[0] || {};

  const infoRows = [
    ['TG Reference',          e(tgRef)],
    ['Common Name',           e(tgName)],
    ['UPOV Codes',            e(upovCodes)],
    ['Botanical Names',       botHtml || '—'],
    ...(excUpov  ? [['Excluding UPOV Codes',      e(excUpov)]]  : []),
    ...(excBot   ? [['Excluding Botanical Names',  e(excBot)]]   : []),
    ...(assoDoc  ? [['Associated Documents',       e(assoDoc)]]  : []),
    ['Technical Working Party', e(s(cpi, 'TB_Desc'))],
    ['Session',               e(s(cpi, 'CPI_AtIts'))],
    ['Date',                  e(headerDate)],
    ['Date From',             e(d(cpi.CPI_DateFrom))],
    ['Date To',               e(d(cpi.CPI_DateTo))],
  ].filter(([, v]) => v && v !== '—');

  let html = `<div class="cover-block">`;
  for (const [label, val] of infoRows) {
    html += `<div class="cover-row"><span class="cover-label">${label}</span><span>${val}</span></div>`;
  }
  html += `</div>`;

  if (botList.length) {
    html += `<h2>Botanical Names</h2>
<table>
  <thead><tr><th>Type</th><th>English</th><th>Français</th><th>Deutsch</th><th>Español</th></tr></thead>
  <tbody>`;
    for (const r of botList) {
      html += `<tr>
    <td>${e(stripHtml(s(r, 'altnametable')))}</td>
    <td><em>${e(s(r, 'en_botanical_name'))}</em></td>
    <td><em>${e(s(r, 'fr_botanical_name'))}</em></td>
    <td><em>${e(s(r, 'de_botanical_name'))}</em></td>
    <td><em>${e(s(r, 'es_botanical_name'))}</em></td>
  </tr>`;
    }
    html += `</tbody></table>`;
  }

  return { heading: `${tgRef} — ${tgName}`, html };
}

async function renderChapter1(tgId, lang, labels) {
  const rows = await repo.getSectionOne(tgId, lang);
  let html = `<p>${e(labels.getLabel('TG_APPLY_TO_ALL_VARIETIES'))}</p>`;

  if (rows.length) {
    html += `<table>
  <thead><tr><th>Botanical Names</th><th>Sub DD Value</th><th>Other Info</th><th>Species Category</th></tr></thead>
  <tbody>`;
    for (const r of rows) {
      html += `<tr>
    <td><em>${e(s(r, 'Botanical_Names'))}</em></td>
    <td>${e(s(r, 'Sub_DD_Value'))}</td>
    <td>${e(s(r, 'Sub_OtherInfo'))}</td>
    <td>${e(s(r, 'SubjectSpeciesCategory'))}</td>
  </tr>`;
    }
    html += `</tbody></table>`;
  } else {
    html += `<p class="note">No subject data available.</p>`;
  }

  return { heading: `1.  ${labels.getLabel('SUBJECT_TEST_GUIDELINES')}`, html };
}

async function renderChapter2(tgId, lang, labels) {
  const rows = await repo.getMaterialDetailsList(tgId, lang);
  const entry = rows[0] || {};
  const isMushroom = s(entry, 'isMushroom') || 'N';
  const matLabel   = isMushroom === 'N' ? labels.getLabel('PLANT_MATERIAL') : labels.getLabel('MATERIAL');
  const ms         = stripHtml(s(entry, 'Material_Supplied')).replace(/\.$/, '');
  const minPlant   = stripHtml(s(entry, 'Min_Plant_Material'));
  const seedQual   = s(entry, 'SeedQualityReq');
  const addInfo    = stripHtml(s(entry, 'Material_AddInfo'));

  let html = `
<p>${e(labels.getLabel('MATERIAL_2', matLabel))}</p>
<p>${e(labels.getLabel('MATERIAL_3', ms))}</p>
<p>${e(labels.getLabel('MATERIAL_4', matLabel))}</p>`;

  if (minPlant) {
    html += `<p><strong>${e(labels.getLabel('MATERIAL_5'))}:</strong> ${e(minPlant)}</p>`;
  }

  if (seedQual) {
    html += `<h2>${e(labels.getLabel('MATERIAL_6'))}</h2><ul>
  <li>${e(labels.getLabel('MATERIAL_7'))}</li>
  <li>${e(labels.getLabel('MATERIAL_8'))}</li>
  <li>${e(labels.getLabel('MATERIAL_9'))}</li>
  <li>${e(labels.getLabel('MATERIAL_10'))}</li>
</ul>`;
  }

  if (addInfo) html += `<p>${e(addInfo)}</p>`;

  html += `<p>${e(labels.getLabel('MATERIAL_11', matLabel))}</p>
<p>${e(labels.getLabel('MATERIAL_12', matLabel))}</p>`;

  return { heading: `2.  ${labels.getLabel('MATERIAL_1')}`, html };
}

async function renderChapter3(tgId, lang, labels) {
  const [examRows, propRows] = await Promise.all([
    repo.getMethodOfExaminationList(tgId, lang),
    repo.getPropogationMethodList(tgId, lang),
  ]);
  const ex = examRows[0] || {};

  const fields = [
    ['EXAMINATION_2',  'GrowingCycle'],
    ['EXAMINATION_3',  'PlantingForm'],
    ['EXAMINATION_7',  'CropType'],
    ['EXAMINATION_8',  'FruitDormantPeriod'],
    ['EXAMINATION_9',  'GrowingCycleAddInfo'],
    ['EXAMINATION_10', 'Devlopmentstage'],
    ['EXAMINATION_14', 'EyeColorObservation'],
    ['EXAMINATION_15', 'ConditionAddInfo'],
    ['EXAMINATION_17', 'PlantRemoval'],
    ['EXAMINATION_18', 'TestDesignAddInfo'],
  ];

  let html = `<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>`;
  for (const [lk, fk] of fields) {
    const val = s(ex, fk) || s(ex, fk.charAt(0).toUpperCase() + fk.slice(1));
    if (val) html += `<tr><td>${e(labels.getLabel(lk))}</td><td>${e(val)}</td></tr>`;
  }
  html += `</tbody></table>`;

  if (propRows.length) {
    html += `<h2>${e(labels.getLabel('EXAMINATION_19'))}</h2>
<table>
  <thead><tr>
    <th>${e(labels.getLabel('EXAMINATION_20'))}</th>
    <th>${e(labels.getLabel('EXAMINATION_21'))}</th>
    <th>${e(labels.getLabel('EXAMINATION_22'))}</th>
    <th>${e(labels.getLabel('EXAMINATION_23'))}</th>
    <th>${e(labels.getLabel('EACH'))}</th>
  </tr></thead>
  <tbody>`;
    for (const r of propRows) {
      html += `<tr>
    <td>${e(s(r, 'PropogationMethod'))}</td>
    <td>${e(s(r, 'PlotDesign'))}</td>
    <td>${e(s(r, 'PlantType'))}</td>
    <td>${e(s(r, 'PlantNumber'))}</td>
    <td>${e(s(r, 'Replicatenum'))}</td>
  </tr>`;
    }
    html += `</tbody></table>`;
  }

  return { heading: `3.  ${labels.getLabel('EXAMINATION_1')}`, html };
}

async function renderChapter4(tgId, lang, labels) {
  const [assessRows, plantRows] = await Promise.all([
    repo.getAssessmentList(tgId, lang),
    repo.getNumberOfPlants(tgId),
  ]);
  const assessment = assessRows[0] || {};
  const yesNo = (v) => v === 'Y' ? labels.getLabel('YES') : v === 'N' ? labels.getLabel('NO') : (v || '—');

  const fields = [
    ['ASSESSEMENT_2',  'IsHybridParentFormula'],
    ['ASSESSEMENT_5',  'SinglePlant'],
    ['ASSESSEMENT_10', 'DistinctnessAddInfo'],
    ['ASSESSEMENT_22', 'CrossPolinattedVarieties'],
    ['ASSESSEMENT_33', 'UniformityAssessmentSameSample'],
    ['ASSESSEMENT_36', 'UniformityAssessmentDifferentSample'],
    ['ASSESSEMENT_39', 'StabilityAddInfo'],
  ];

  let html = `<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>`;
  for (const [lk, fk] of fields) {
    const val = s(assessment, fk);
    if (val) html += `<tr><td>${e(labels.getLabel(lk))}</td><td>${e(yesNo(val))}</td></tr>`;
  }
  html += `</tbody></table>`;

  if (plantRows.length) {
    html += `<h2>${e(labels.getLabel('ASSESSEMENT_20'))}</h2>
<table><thead><tr><th>${e(labels.getLabel('PLANT'))}</th><th>Count</th></tr></thead><tbody>`;
    for (const r of plantRows) {
      const method = s(r, 'PropogationMethod') || s(r, 'PlantType') || s(r, 'PlotDesign') || '';
      const count  = s(r, 'PlantNumber') || s(r, 'NumberOfPlants') || '';
      if (method || count) {
        html += `<tr><td>${e(method)}</td><td>${e(count)}</td></tr>`;
      }
    }
    html += `</tbody></table>`;
  }

  return { heading: `4.  ${labels.getLabel('ASSESSEMENT_1')}`, html };
}

async function renderChapter5(tgId, lang, labels) {
  const [charRows, summaryRows] = await Promise.all([
    repo.getCharacteristicsList(tgId, lang),
    repo.getGroupingSummaryTextList(tgId, lang),
  ]);

  let html = `<p>${e(labels.getLabel('GROUPINGVAR_2'))}</p>
<p>${e(labels.getLabel('GROUPINGVAR_3'))}</p>`;

  const summaries = summaryRows.map(r => s(r, 'GroupingSummaryText')).filter(Boolean);
  if (summaries.length) {
    html += `<ul>${summaries.map(t => `<li>${e(t)}</li>`).join('')}</ul>`;
  }

  if (charRows.length) {
    html += `<h2>${e(labels.getLabel('GROUPINGVAR_4'))}</h2>
<table>
  <thead><tr><th>#</th><th>${e(labels.getLabel('CHARACTERISTIC'))}</th><th>Grouping Text</th></tr></thead>
  <tbody>`;
    for (const r of charRows) {
      html += `<tr>
    <td class="num">${e(s(r, 'CharacteristicOrder'))}</td>
    <td>${e(s(r, 'TOC_Name'))}</td>
    <td>${e(s(r, 'Grouping_Text'))}</td>
  </tr>`;
    }
    html += `</tbody></table>`;
  } else {
    html += `<p class="note">No grouping characteristics defined.</p>`;
  }

  return { heading: `5.  ${labels.getLabel('GROUPINGVAR_1')}`, html };
}

async function renderChapter6(tgId, lang, labels) {
  const [addlRows, maxLabel, growthStage] = await Promise.all([
    repo.getAdditionalCharacteristicsList(tgId, lang),
    repo.getMaxIndicationLabel(tgId),
    repo.isGrowthStage(tgId),
  ]);

  const entry = addlRows[0] || {};
  const exampleText  = stripHtml(s(entry, 'ExampleVarietyText'));
  const legend       = stripHtml(s(entry, 'CharacteristicLegend'));

  let html = `<ul>`;
  for (let i = 2; i <= 20; i++) {
    const lbl = labels.getLabel(`CHARAINTRO_${i}`);
    if (lbl) html += `<li>${e(lbl)}</li>`;
  }
  html += `</ul>`;

  if (legend)      html += `<p><strong>Legend:</strong> ${e(legend)}</p>`;
  if (exampleText) html += `<p><strong>${e(labels.getLabel('CHARAINTRO_22'))}:</strong> ${e(exampleText)}</p>`;
  if (maxLabel)    html += `<p><strong>Max Indication:</strong> ${e(String(maxLabel))}</p>`;
  if (growthStage) html += `<p>${e(labels.getLabel('CHARAINTRO_21'))}</p>`;

  return { heading: `6.  ${labels.getLabel('CHARAINTRO_1')}`, html };
}

async function renderChapter7(tgId, lang, labels) {
  const rows = await repo.getSevenTableCharacteristicsList(tgId);

  // Pick language column — mirrors Java's 4-language column logic
  const langNameCol = { en: 'TOC_Name', fr: 'CHAR_FR', de: 'CHAR_DE', es: 'CHAR_ES' }[lang] || 'TOC_Name';
  const langExpCol  = { en: 'EXP_EN',   fr: 'EXP_FR',  de: 'EXP_DE',  es: 'EXP_ES'  }[lang] || 'EXP_EN';

  // Group by TOC_ID (preserves insertion order — same as Java LinkedHashMap)
  const grouped = new Map();
  for (const row of rows) {
    const tocId = row.TOC_ID != null ? String(row.TOC_ID) : '0';
    if (!grouped.has(tocId)) grouped.set(tocId, []);
    grouped.get(tocId).push(row);
  }

  let html = `<table>
  <thead><tr>
    <th>#</th><th>*</th>
    <th>Characteristic</th>
    <th>State of Expression</th>
    <th>Example Varieties</th>
    <th class="num">Note</th>
  </tr></thead>
  <tbody>`;

  for (const [, entries] of grouped) {
    const first = entries[0];
    const name  = s(first, langNameCol) || s(first, 'TOC_Name');

    if (entries.length === 1) {
      const exp = s(first, langExpCol) || s(first, 'EXP_EN');
      html += `<tr>
    <td class="num">${e(s(first, 'CharacteristicOrder'))}</td>
    <td>${e(s(first, 'Asterisk'))}</td>
    <td>${e(name)}</td>
    <td>${e(exp)}</td>
    <td class="note">${e(s(first, 'ORDERED_Example_Varieties'))}</td>
    <td class="num">${e(s(first, 'NOTES'))}</td>
  </tr>`;
    } else {
      // Multi-expression characteristic — heading row + sub-rows
      html += `<tr class="grey-row">
    <td class="num">${e(s(first, 'CharacteristicOrder'))}</td>
    <td>${e(s(first, 'Asterisk'))}</td>
    <td colspan="4">${e(name)}</td>
  </tr>`;
      for (const entry of entries) {
        const exp = s(entry, langExpCol) || s(entry, 'EXP_EN');
        html += `<tr class="sub-expr">
    <td></td><td></td>
    <td class="note">&nbsp;&nbsp;${e(exp)}</td>
    <td></td>
    <td class="note">${e(s(entry, 'ORDERED_Example_Varieties'))}</td>
    <td class="num">${e(s(entry, 'NOTES'))}</td>
  </tr>`;
      }
    }
  }

  html += `</tbody></table>`;
  return { heading: `7.  Table of Characteristics / Tableau des caractères / Merkmalstabelle / Tabla de caracteres`, html };
}

async function renderChapter8(tgId, lang, labels) {
  const [expText, severalChars, tocChars, addlRefs] = await Promise.all([
    repo.getCharacteristicsExpList(tgId, lang),
    repo.getSeveralCharsList(tgId, lang),
    repo.getTocCharacteristics(tgId, lang),
    repo.getAdditionCharaReference(tgId, lang),
  ]);

  const genExp = expText[0]?.ExplanationText ? stripHtml(String(expText[0].ExplanationText)) : '';
  let html = '';

  if (genExp) html += `<p>${e(genExp)}</p>`;

  if (severalChars.length) {
    html += `<h2>${e(labels.getLabel('CHARACTERISTIC_2'))}</h2>
<p>${e(labels.getLabel('CHARACTERISTIC_3'))}</p>
<table>
  <thead><tr><th>Indication</th><th>Explanation</th></tr></thead>
  <tbody>`;
    for (const r of severalChars) {
      html += `<tr>
    <td>${e(s(r, 'IndicationLabel'))}</td>
    <td>${e(stripHtml(s(r, 'LabelExplanation')))}</td>
  </tr>`;
    }
    html += `</tbody></table>`;
  }

  if (tocChars.length) {
    html += `<h2>${e(labels.getLabel('CHARACTERISTIC_4'))}</h2>`;
    for (const r of tocChars) {
      const order = s(r, 'CharacteristicOrder');
      const name  = s(r, 'TOC_Name');
      const text  = stripHtml(s(r, 'Explaination_Text'));
      if (text) {
        html += `<p><strong><span class="num">${e(order)}</span>&nbsp;${e(name)}:</strong> ${e(text)}</p>`;
      }
    }
  }

  const refs = addlRefs.map(r => s(r, 'additionalCharacteriticsReferences')).filter(Boolean);
  if (refs.length) {
    html += `<h2>${e(labels.getLabel('CHARACTERISTIC_5'))}</h2><ul>`;
    refs.forEach(ref => { html += `<li>${e(ref)}</li>`; });
    html += `</ul>`;
  }

  return { heading: `8.  ${labels.getLabel('CHARACTERISTIC_1')}`, html };
}

async function renderChapter9(tgId, lang, labels) {
  const rows = await repo.getTableCharacteristicsList(tgId);
  let html = '';

  if (rows.length) {
    html += `<ul>`;
    for (const r of rows) {
      const ref = s(r, 'LiteratureReferences');
      if (ref) html += `<li>${e(ref)}</li>`;
    }
    html += `</ul>`;
  } else {
    html += `<p class="note">No literature references.</p>`;
  }

  return { heading: `9.  ${labels.getLabel('LITERATURE')}`, html };
}

async function renderChapter10(tgId, lang, labels) {
  const [tqRows, subjects, propVarieties, tableOfChars, breedingSchemes] = await Promise.all([
    repo.getTechnicalQuestionnaire(tgId, lang),
    repo.getTgCharacteristics(tgId, lang),
    repo.getPropagationVarietiesList(tgId, lang),
    repo.getTableOfCharacteristics(tgId, lang),
    repo.getIndexFourTableofCharacteristicsList(tgId, lang),
  ]);

  const tq    = tqRows[0] || {};
  const yesNo = (v) => v === 'Y' ? labels.getLabel('YES') : v === 'N' ? labels.getLabel('NO') : (v || '—');

  let html = '';

  // Subject / botanical names
  if (subjects.length) {
    html += `<h2>${e(labels.getLabel('TQ_2'))}</h2>
<table>
  <thead><tr><th>Botanical Name</th><th>Common Name</th><th>Additional Info</th></tr></thead>
  <tbody>`;
    for (const r of subjects) {
      html += `<tr>
    <td><em>${e(s(r, 'TqBotanicalName'))}</em></td>
    <td>${e(s(r, 'TqCommonName'))}</td>
    <td>${e(s(r, 'TqAdditionalInfo'))}</td>
  </tr>`;
    }
    html += `</tbody></table>`;
  }

  // Propagation methods
  if (propVarieties.length) {
    const methodLabels = {
      '1': 'SEED_PROPAGATED_VARIETIES', '2': 'TUBER', '3': 'CUTTINGS',
      '4': 'IN_VITRO_PROPAGATION',      '5': 'BUDDING_OR_GRAFTING',
      '6': 'DIVISION',                  '7': 'RHIZOMES',
    };
    html += `<h2>${e(labels.getLabel('TQ_10'))}</h2><ul>`;
    for (const r of propVarieties) {
      const mid   = s(r, 'TqVarietyPropagationMethodID');
      const lk    = methodLabels[mid] || 'OTHER_PROVIDE_DETAILS';
      const other = s(r, 'TqPMethodOtherDetails');
      html += `<li>${e(labels.getLabel(lk))}${other ? ': ' + e(other) : ''}</li>`;
    }
    html += `</ul>`;
  }

  // Breeding schemes
  if (breedingSchemes.length) {
    html += `<h2>${e(labels.getLabel('TQ_20'))}</h2>
<table>
  <thead><tr><th>Method</th><th>Other Details</th></tr></thead>
  <tbody>`;
    for (const r of breedingSchemes) {
      html += `<tr>
    <td>${e(s(r, 'TqBreedingSchemeMethodMethodDesc') || s(r, 'methodDesc') || '')}</td>
    <td>${e(s(r, 'TqBreedingSchemeOtherDetails') || s(r, 'otherDetails') || '')}</td>
  </tr>`;
    }
    html += `</tbody></table>`;
  }

  // TQ flag fields
  const tqFields = [
    ['TQ_30', 'IsHybridParentFormula'],
    ['TQ_31', 'IsStandardBreedingScheme'],
    ['TQ_50', 'DiffCharacteristic'],
    ['TQ_60', 'IsTqColorImage'],
    ['TQ_70', 'ProvideVirusPresence'],
  ];
  html += `<h2>${e(labels.getLabel('TQ_40'))}</h2>
<table><thead><tr><th>Question</th><th>Answer</th></tr></thead><tbody>`;
  for (const [lk, fk] of tqFields) {
    const val = s(tq, fk);
    const lbl = labels.getLabel(lk);
    if (val && lbl) html += `<tr><td>${e(lbl)}</td><td>${e(yesNo(val))}</td></tr>`;
  }
  html += `</tbody></table>`;

  // Characteristics table (TQ section 5)
  if (tableOfChars.length) {
    html += `<h2>${e(labels.getLabel('TQ_56'))}</h2>
<table>
  <thead><tr>
    <th>#</th><th>Characteristic</th><th>State of Expression</th>
    <th>Example Varieties</th><th class="num">Notes</th>
  </tr></thead>
  <tbody>`;
    for (const r of tableOfChars) {
      html += `<tr>
    <td class="num">${e(String(r.ExistingSeqNumber ?? ''))}</td>
    <td>${e(s(r, 'Name'))}</td>
    <td>${e(s(r, 'StateOfExpression'))}</td>
    <td class="note">${e(s(r, 'ExampleVarieties'))}</td>
    <td class="num">${e(s(r, 'ExpressionNotes'))}</td>
  </tr>`;
    }
    html += `</tbody></table>`;
  }

  return { heading: `10.  ${labels.getLabel('TECHNICAL_QUESTIONNAIRE')}`, html };
}

async function renderAnnex(tgId, lang, labels) {
  const rows   = await repo.getAnnexList(tgId, lang);
  const annexes = rows.map(r => s(r, 'annexRefData')).filter(Boolean);

  let html = '';
  if (annexes.length) {
    // annexRefData may contain rich HTML from the editor — render as-is
    annexes.forEach((content, i) => {
      if (i > 0) html += `<hr>`;
      html += `<div>${content}</div>`;
    });
  } else {
    html += `<p class="note">No annex data available.</p>`;
  }

  return { heading: `Annex`, html };
}

// ─── Chapter registry ─────────────────────────────────────────────────────────
// Mirrors Java's chapter numbering: chapters 1-10 + annex (chapter 11 / "annex")

const CHAPTER_RENDERERS = {
  0:    renderCover,
  1:    renderChapter1,
  2:    renderChapter2,
  3:    renderChapter3,
  4:    renderChapter4,
  5:    renderChapter5,
  6:    renderChapter6,
  7:    renderChapter7,
  8:    renderChapter8,
  9:    renderChapter9,
  10:   renderChapter10,
  11:   renderAnnex,
};

export const VALID_CHAPTER_NUMBERS = Object.keys(CHAPTER_RENDERERS).map(Number);
export const MIN_CHAPTER = 0;
export const MAX_CHAPTER = 11;

/**
 * Main entry point.
 *
 * Equivalent to the Java flow:
 *   buildTGDocument() → saveToStream(Html) → extractChapter(html, n)
 *
 * @param {number} tgId          - Test Guideline ID
 * @param {number} chapterNumber - Chapter to return (0 = cover, 1-10 = chapters, 11 = annex)
 * @param {string} lang          - Language code: en | fr | de | es
 * @returns {Promise<string|null>} Full HTML document string, or null if TG not found
 */
export async function generateChapterHtml(tgId, chapterNumber, lang = 'en') {
  const renderer = CHAPTER_RENDERERS[chapterNumber];
  if (!renderer) {
    throw new Error(`Chapter ${chapterNumber} not found. Valid range: ${MIN_CHAPTER}–${MAX_CHAPTER}`);
  }

  // Verify TG exists (equivalent to Java's early-exit on missing header)
  const header = await repo.getHeaderDetails(tgId, lang);
  if (!header) return null;

  const labels = new LabelService(lang);

  // Render the chapter — equivalent to extractChapter(fullHtml, chapterNumber)
  const { heading, html } = await renderer(tgId, lang, labels, header);

  // Wrap with shared CSS — mirrors Spire.Doc's <head><style>...</style></head> output
  return wrapChapter(heading, html);
}