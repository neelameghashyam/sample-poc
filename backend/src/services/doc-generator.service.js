/**
 * TG Word Document Generator Service
 * Ported from Java TGWordDocGeneratorService to Node.js / Hono
 *
 * Orchestrates all data fetching from the repository and builds a rich
 * document data model that is then passed to the document builder.
 */

import { LabelService } from '../utils/labels.js';
import * as repo from '../repositories/doc-generator.repo.js';
import { buildDocx } from './doc-builder.service.js';

// ─── HTML stripping utility ───────────────────────────────────────────────────

export function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&times;/g, '×')
    .replace(/\r\n/g, ' ')
    .trim();
}

function getString(entry, key) {
  const val = entry?.[key];
  return val == null ? '' : String(val);
}

function getDate(dateVal) {
  if (!dateVal) return null;
  const s = String(dateVal).split('T')[0].replace('00:00:00.0', '').trim();
  return s || null;
}

// ─── Header date logic (mirrors Java getHeaderDate) ──────────────────────────

function getHeaderDate(reportDate, adoptionDate, statusCode) {
  const ADOPTED = 'ADT';
  if (statusCode === ADOPTED && adoptionDate) {
    const d = new Date(adoptionDate);
    return d.toISOString().split('T')[0];
  }
  const d = reportDate ? new Date(reportDate) : new Date();
  return d.toISOString().split('T')[0];
}

// ─── Section 1: Subject of Test Guidelines ───────────────────────────────────

async function buildSection1(tgId, lang, labels) {
  const rows = await repo.getSectionOne(tgId, lang);
  const items = [];
  for (const entry of rows) {
    items.push({
      botanicalNames: getString(entry, 'Botanical_Names'),
      subDDValue: getString(entry, 'Sub_DD_Value'),
      subOtherInfo: getString(entry, 'Sub_OtherInfo'),
      subjectSpeciesCategory: getString(entry, 'SubjectSpeciesCategory'),
    });
  }
  return {
    heading: labels.getLabel('SUBJECT_TEST_GUIDELINES'),
    applyToAll: labels.getLabel('TG_APPLY_TO_ALL_VARIETIES'),
    andLabel: labels.getLabel('AND'),
    guidanceLabel: labels.getLabel('GUIDANCE'),
    particularVarieties: labels.getLabel('PARTICULAR_VARIETIES'),
    items,
  };
}

// ─── Section 2: Material Required ────────────────────────────────────────────

async function buildSection2(tgId, lang, labels) {
  const rows = await repo.getMaterialDetailsList(tgId, lang);
  let isMushroom = 'N', materialSupplied = '', minPlantMaterial = '',
    seedQualityReq = '', materialAddInfo = '';

  for (const entry of rows) {
    isMushroom = getString(entry, 'isMushroom') || 'N';
    materialSupplied = getString(entry, 'Material_Supplied');
    minPlantMaterial = getString(entry, 'Min_Plant_Material');
    seedQualityReq = getString(entry, 'SeedQualityReq');
    materialAddInfo = getString(entry, 'Material_AddInfo');
  }

  const materialLabel = isMushroom === 'N'
    ? labels.getLabel('PLANT_MATERIAL')
    : labels.getLabel('MATERIAL');

  const ms = materialSupplied.endsWith('.')
    ? materialSupplied.slice(0, -1)
    : materialSupplied;

  return {
    heading: labels.getLabel('MATERIAL_1'),
    isMushroom,
    materialLabel,
    para2_1: labels.getLabel('MATERIAL_2', materialLabel),
    para2_2: labels.getLabel('MATERIAL_3', stripHtml(ms)),
    para2_3: labels.getLabel('MATERIAL_4', materialLabel),
    minPlantMaterial: stripHtml(minPlantMaterial),
    seedQualityReq,
    seedLabels: {
      MATERIAL_5: labels.getLabel('MATERIAL_5'),
      MATERIAL_6: labels.getLabel('MATERIAL_6'),
      MATERIAL_7: labels.getLabel('MATERIAL_7'),
      MATERIAL_8: labels.getLabel('MATERIAL_8'),
      MATERIAL_9: labels.getLabel('MATERIAL_9'),
      MATERIAL_10: labels.getLabel('MATERIAL_10'),
    },
    materialAddInfo: stripHtml(materialAddInfo),
    para2_4: labels.getLabel('MATERIAL_11', materialLabel),
    para2_5: labels.getLabel('MATERIAL_12', materialLabel),
  };
}

// ─── Section 3: Method of Examination ────────────────────────────────────────

async function buildSection3(tgId, lang, labels) {
  const examRows = await repo.getMethodOfExaminationList(tgId, lang);
  const propRows = await repo.getPropogationMethodList(tgId, lang);

  let ex = {
    growingCycle: '', plantingForm: '', otherGrowingCycleInfo: '',
    cropType: '', cropTypeOtherInfo: '', growingCycleAddInfo: '',
    fruitDormantPeriod: '', devlopmentstage: '',
    plotTypeA: '', plotTypeB: '', plotTypeC: '', plotTypeD: '',
    eyeColorObservation: '', conditionAddInfo: '', plantRemoval: '',
    testDesignAddInfo: '', isMushroom: 'N',
  };

  for (const entry of examRows) {
    for (const key of Object.keys(ex)) {
      const raw = getString(entry, key.charAt(0).toUpperCase() + key.slice(1)) ||
                  getString(entry, key);
      if (raw) ex[key] = raw;
    }
    if (getString(entry, 'isMushroom') !== 'N') ex.isMushroom = 'Y';
  }

  // Build propagation entries
  const propItems = propRows.map(entry => ({
    propogationMethod: getString(entry, 'PropogationMethod'),
    plotDesign: getString(entry, 'PlotDesign'),
    plantType: getString(entry, 'PlantType'),
    plantNumber: getString(entry, 'PlantNumber'),
    replicatenum: getString(entry, 'Replicatenum'),
    plantNumberA: getString(entry, 'PlantNumberA'),
    plantNumberB: getString(entry, 'PlantNumberB'),
    plantNumberC: getString(entry, 'PlantNumberC'),
    plantNumberD: getString(entry, 'PlantNumberD'),
    rowPlotSizeA: getString(entry, 'RowPlotSizeA'),
    rowPlotSizeB: getString(entry, 'RowPlotSizeB'),
    rowPlotSizeC: getString(entry, 'RowPlotSizeC'),
    rowPlotSizeD: getString(entry, 'RowPlotSizeD'),
    plantTypeA: getString(entry, 'PlantTypeA'),
    plantTypeB: getString(entry, 'PlantTypeB'),
    plantTypeC: getString(entry, 'PlantTypeC'),
    plantTypeD: getString(entry, 'PlantTypeD'),
    testDesignPlotTypeA: getString(entry, 'TestDesignPlotTypeA'),
    testDesignPlotTypeB: getString(entry, 'TestDesignPlotTypeB'),
    testDesignPlotTypeC: getString(entry, 'TestDesignPlotTypeC'),
    testDesignPlotTypeD: getString(entry, 'TestDesignPlotTypeD'),
    otherPlantType: getString(entry, 'OtherPlantType'),
    otherPlantTypeA: getString(entry, 'OtherPlantTypeA'),
    otherPlantTypeB: getString(entry, 'OtherPlantTypeB'),
    otherPlantTypeC: getString(entry, 'OtherPlantTypeC'),
    otherPlantTypeD: getString(entry, 'OtherPlantTypeD'),
  }));

  return {
    heading: labels.getLabel('EXAMINATION_1'),
    examination: ex,
    propItems,
    labels: {
      EXAMINATION_2: labels.getLabel('EXAMINATION_2'),
      EXAMINATION_3: labels.getLabel('EXAMINATION_3'),
      EXAMINATION_4: labels.getLabel('EXAMINATION_4'),
      EXAMINATION_5: labels.getLabel('EXAMINATION_5'),
      EXAMINATION_6: labels.getLabel('EXAMINATION_6'),
      EXAMINATION_7: labels.getLabel('EXAMINATION_7'),
      EXAMINATION_8: labels.getLabel('EXAMINATION_8'),
      EXAMINATION_9: labels.getLabel('EXAMINATION_9'),
      EXAMINATION_10: labels.getLabel('EXAMINATION_10'),
      EXAMINATION_11: labels.getLabel('EXAMINATION_11'),
      EXAMINATION_12: labels.getLabel('EXAMINATION_12'),
      EXAMINATION_13: labels.getLabel('EXAMINATION_13'),
      EXAMINATION_14: labels.getLabel('EXAMINATION_14'),
      EXAMINATION_15: labels.getLabel('EXAMINATION_15'),
      EXAMINATION_16: labels.getLabel('EXAMINATION_16'),
      EXAMINATION_17: labels.getLabel('EXAMINATION_17'),
      EXAMINATION_18: labels.getLabel('EXAMINATION_18'),
      EXAMINATION_19: labels.getLabel('EXAMINATION_19'),
      EXAMINATION_20: labels.getLabel('EXAMINATION_20'),
      EXAMINATION_21: labels.getLabel('EXAMINATION_21'),
      EXAMINATION_22: labels.getLabel('EXAMINATION_22'),
      EXAMINATION_23: labels.getLabel('EXAMINATION_23'),
      EXAMINATION_24: labels.getLabel('EXAMINATION_24'),
      EXAMINATION_25: labels.getLabel('EXAMINATION_25'),
      EXAMINATION_26: labels.getLabel('EXAMINATION_26'),
      EXAMINATION_27: labels.getLabel('EXAMINATION_27'),
      EXAMINATION_28: labels.getLabel('EXAMINATION_28'),
      EXAMINATION_29: labels.getLabel('EXAMINATION_29'),
      EXAMINATION_30: labels.getLabel('EXAMINATION_30'),
      EACH: labels.getLabel('EACH'),
    },
  };
}

// ─── Section 4: Assessment of DUS ────────────────────────────────────────────

async function buildSection4(tgId, lang, labels) {
  const [assessRows, plantRows] = await Promise.all([
    repo.getAssessmentList(tgId, lang),
    repo.getNumberOfPlants(tgId),
  ]);

  const assessment = assessRows[0] || {};
  const plantMethods = plantRows;

  // Build relevant label map (just keys needed for doc builder)
  const labelKeys = [];
  for (let i = 1; i <= 62; i++) {
    const key = `ASSESSEMENT_${i}`;
    labelKeys.push([key, labels.getLabel(key)]);
  }
  for (const suffix of ['22_1','23_1','26_1','27_1','27_2','27_3','30_1','31_1','32_1','33_1',
                         '36_1','39_1','48_1','49_1','50_1','51_1','52_1','53_1','61_1']) {
    const key = `ASSESSEMENT_${suffix}`;
    labelKeys.push([key, labels.getLabel(key)]);
  }

  return {
    heading: labels.getLabel('ASSESSEMENT_1'),
    assessment,
    plantMethods,
    labels: Object.fromEntries(labelKeys),
    extraLabels: {
      YES: labels.getLabel('YES'),
      NO: labels.getLabel('NO'),
      PLANT: labels.getLabel('PLANT'),
    },
  };
}

// ─── Section 5: Grouping of Varieties ────────────────────────────────────────

async function buildSection5(tgId, lang, labels) {
  const [charRows, summaryRows] = await Promise.all([
    repo.getCharacteristicsList(tgId, lang),
    repo.getGroupingSummaryTextList(tgId, lang),
  ]);

  return {
    heading: labels.getLabel('GROUPINGVAR_1'),
    para5_1: labels.getLabel('GROUPINGVAR_2'),
    para5_2: labels.getLabel('GROUPINGVAR_3'),
    para5_3: labels.getLabel('GROUPINGVAR_4'),
    para5_4: labels.getLabel('GROUPINGVAR_5'),
    characteristicLabel: labels.getLabel('CHARACTERISTIC'),
    characteristics: charRows.map(r => ({
      characteristicOrder: getString(r, 'CharacteristicOrder'),
      tocName: getString(r, 'TOC_Name'),
      groupingText: getString(r, 'Grouping_Text'),
      rowNumber: getString(r, 'rowNumber'),
    })),
    groupingSummaryTexts: summaryRows
      .map(r => getString(r, 'GroupingSummaryText'))
      .filter(Boolean),
  };
}

// ─── Section 6: Categories of Characteristics ────────────────────────────────

async function buildSection6(tgId, lang, labels) {
  const [addlRows, maxLabel, growthStage] = await Promise.all([
    repo.getAdditionalCharacteristicsList(tgId, lang),
    repo.getMaxIndicationLabel(tgId),
    repo.isGrowthStage(tgId),
  ]);

  let exampleVarietyText = '';
  let characteristicLegend = '';
  for (const entry of addlRows) {
    if (getString(entry, 'ExampleVarietyText')) exampleVarietyText = getString(entry, 'ExampleVarietyText');
    if (getString(entry, 'CharacteristicLegend')) characteristicLegend = getString(entry, 'CharacteristicLegend');
  }

  const charIntroLabels = {};
  for (let i = 1; i <= 25; i++) {
    charIntroLabels[`CHARAINTRO_${i}`] = labels.getLabel(`CHARAINTRO_${i}`);
  }

  return {
    heading: labels.getLabel('CHARAINTRO_1'),
    exampleVarietyText: stripHtml(exampleVarietyText),
    characteristicLegend: stripHtml(characteristicLegend),
    maxIndicationLabel: maxLabel,
    growthStage,
    notApplicable: labels.getLabel('NOT_APPLICABLE'),
    labels: charIntroLabels,
  };
}

// ─── Section 7: Table of Characteristics ─────────────────────────────────────

async function buildSection7(tgId) {
  const rows = await repo.getSevenTableCharacteristicsList(tgId);

  // Group by TOC_ID (preserving insertion order like Java LinkedHashMap)
  const grouped = new Map();
  for (const entry of rows) {
    const tocId = entry.TOC_ID != null ? String(entry.TOC_ID) : '0';
    if (!grouped.has(tocId)) grouped.set(tocId, []);
    grouped.get(tocId).push({
      tocId: getString(entry, 'TOC_ID'),
      asterisk: getString(entry, 'Asterisk'),
      grouping: getString(entry, 'Grouping'),
      expressionType: getString(entry, 'Expression_Type'),
      growthStages: getString(entry, 'Growth_Stages'),
      groupingText: getString(entry, 'Grouping_Text'),
      tocName: getString(entry, 'TOC_Name'),
      observationMPlotT: getString(entry, 'ObservationM_PlotT'),
      addToTQ5: getString(entry, 'Add_To_TQ5'),
      isAdoptedTG: getString(entry, 'IsAdoptedTG'),
      isAdoptedTGModify: getString(entry, 'IsAdoptedTGModify'),
      characteristicOrder: getString(entry, 'CharacteristicOrder'),
      tgId: getString(entry, 'TG_ID'),
      indivFlag: getString(entry, 'indivFlag'),
      charFR: getString(entry, 'CHAR_FR'),
      charDE: getString(entry, 'CHAR_DE'),
      charES: getString(entry, 'CHAR_ES'),
      fullIND: getString(entry, 'FULL_IND'),
      notes: getString(entry, 'NOTES'),
      expEN: getString(entry, 'EXP_EN'),
      expES: getString(entry, 'EXP_ES'),
      expDE: getString(entry, 'EXP_DE'),
      expFR: getString(entry, 'EXP_FR'),
      orderedExampleVarieties: getString(entry, 'ORDERED_Example_Varieties'),
    });
  }

  return {
    heading: 'Table of Characteristics/Tableau des caracteres/Merkmalstabelle/Tabla de caracteres',
    tableHeaders: ['', 'English', 'français', 'deutsch', 'español', 'Example Varieties\nExemples\nBeispielssorten\nVariedades ejemplo', 'Note/\nNota'],
    characteristics: Array.from(grouped.values()),
  };
}

// ─── Section 8: Explanations on the Table of Characteristics ─────────────────

async function buildSection8(tgId, lang, labels) {
  const [explCount, expText, severalChars, tocChars, addlRefs] = await Promise.all([
    repo.getCharacteristicsExplanationList(tgId),
    repo.getCharacteristicsExpList(tgId, lang),
    repo.getSeveralCharsList(tgId, lang),
    repo.getTocCharacteristics(tgId, lang),
    repo.getAdditionCharaReference(tgId, lang),
  ]);

  const numMultiple = explCount[0]?.NumberOfMultipleCharacteristicsExplanations
    ? parseInt(explCount[0].NumberOfMultipleCharacteristicsExplanations, 10) : 0;
  const generalExplanation = expText[0]?.ExplanationText
    ? String(expText[0].ExplanationText) : '';

  return {
    heading: labels.getLabel('CHARACTERISTIC_1'),
    numMultiple,
    generalExplanation: stripHtml(generalExplanation),
    severalCharsHeading: labels.getLabel('CHARACTERISTIC_2'),
    severalCharsIntro: labels.getLabel('CHARACTERISTIC_3'),
    severalChars: severalChars.map(r => ({
      indicationLabel: getString(r, 'IndicationLabel'),
      labelExplanation: stripHtml(getString(r, 'LabelExplanation')),
    })),
    individualCharsHeading: labels.getLabel('CHARACTERISTIC_4'),
    tocChars: tocChars.map(r => ({
      tocName: getString(r, 'TOC_Name'),
      characteristicOrder: getString(r, 'CharacteristicOrder'),
      explanationText: stripHtml(getString(r, 'Explaination_Text')),
    })),
    additionalExplanationsHeading: labels.getLabel('CHARACTERISTIC_5'),
    additionalCharReferences: addlRefs
      .map(r => getString(r, 'additionalCharacteriticsReferences'))
      .filter(Boolean),
  };
}

// ─── Section 9: Literature ────────────────────────────────────────────────────

async function buildSection9(tgId, labels) {
  const rows = await repo.getTableCharacteristicsList(tgId);
  return {
    heading: labels.getLabel('LITERATURE'),
    entries: rows.map(r => ({
      literatureReferences: getString(r, 'LiteratureReferences'),
    })),
  };
}

// ─── Section 10: Technical Questionnaire ─────────────────────────────────────

async function buildSection10(tgId, lang, labels) {
  const [tqRows, subjects, propVarieties, existingSeqs, tableOfChars, breedingSchemes, hybridList] =
    await Promise.all([
      repo.getTechnicalQuestionnaire(tgId, lang),
      repo.getTgCharacteristics(tgId, lang),
      repo.getPropagationVarietiesList(tgId, lang),
      repo.getExistingSequences(tgId),
      repo.getTableOfCharacteristics(tgId, lang),
      repo.getIndexFourTableofCharacteristicsList(tgId, lang),
      repo.getTableHybridList(tgId),
    ]);

  const tq = tqRows[0] || {};

  const tqLabels = {};
  for (let i = 1; i <= 80; i++) tqLabels[`TQ_${i}`] = labels.getLabel(`TQ_${i}`);
  tqLabels['TQ_23_1'] = labels.getLabel('TQ_23_1');

  const propLabels = {};
  for (const key of [
    'CROSS','SELF_POLLINATION','CROSS_POLLINATION','POPULATION','SYNTHETIC_VARIETY',
    'SINGLE_HYBRID','HYBRID','THREE_WAY_HYBRID','DOUBLE_HYBRID','MALE_STERILE_HYBRID',
    'MALE_FERTILE_HYBRID','INBRED_LINE','MALE_STERILE_LINE','MALE_FERTILE_LINE',
    'APOMICTIC_VARIETY','TUBER','CUTTINGS','IN_VITRO_PROPAGATION','BUDDING_OR_GRAFTING',
    'DIVISION','RHIZOMES','OTHER_STATE_METHOD','OTHER_PROVIDE_DETAILS','SEED_PROPAGATED_VARIETIES',
  ]) {
    propLabels[key] = labels.getLabel(key);
  }

  return {
    heading: labels.getLabel('TECHNICAL_QUESTIONNAIRE'),
    tq,
    subjects: subjects.map(r => ({
      botanicalName: getString(r, 'TqBotanicalName'),
      commonName: getString(r, 'TqCommonName'),
      addSentence: getString(r, 'TqAddSentence'),
      additionalInfo: getString(r, 'TqAdditionalInfo'),
      insertOrder: getString(r, 'insert_order'),
      hybridVariety: getString(r, 'TqHybridVariety'),
    })),
    propVarieties: propVarieties.map(r => ({
      propagationMethodId: getString(r, 'TqVarietyPropagationMethodID'),
      otherDetails: getString(r, 'TqPMethodOtherDetails'),
      seqId: getString(r, 'SeqId'),
      level1: getString(r, 'level1'),
      rowNumber: getString(r, 'rowNumber'),
    })),
    existingSeqs: existingSeqs.map(r => ({
      name: getString(r, 'Name'),
      existingSeqNum: r.Existing_Seq_Num,
      count: r.Existing_Seq_Number_Count,
    })),
    tableOfChars: tableOfChars.map(r => ({
      existingSeqNumber: r.ExistingSeqNumber,
      name: getString(r, 'Name'),
      tqCharacteristicsId: getString(r, 'TQ_CharacteristicsID'),
      stateOfExpression: getString(r, 'StateOfExpression'),
      exampleVarieties: getString(r, 'ExampleVarieties'),
      expressionNotes: getString(r, 'ExpressionNotes'),
      colorCharIndicator: getString(r, 'ColorCharIndicator'),
      nonColorCharIndicator: getString(r, 'NonColorCharIndicator'),
    })),
    breedingSchemes: breedingSchemes.map(r => ({
      methodDesc: getString(r, 'TqBreedingSchemeMethodMethodDesc'),
      otherDetails: getString(r, 'TqBreedingSchemeOtherDetails'),
      methodId: getString(r, 'tqBreedingSchememethodid'),
      seqId: getString(r, 'SeqId'),
    })),
    hybridList: hybridList.map(r => getString(r, 'TqHybridVariety')).filter(Boolean),
    labels: tqLabels,
    propLabels,
    miscLabels: {
      YES: labels.getLabel('YES'),
      NO: labels.getLabel('NO'),
      COMMENTS: labels.getLabel('COMMENTS'),
      ADDRESS: labels.getLabel('ADDRESS'),
    },
  };
}

// ─── Main generate function ───────────────────────────────────────────────────

export async function generateTGWordDocument(tgId, reportDate, lang = 'en') {
  // Fetch header details
  const header = await repo.getHeaderDetails(tgId, lang);
  if (!header) {
    console.warn(`[DocGen] No record found for TG_ID=${tgId}`);
    return null;
  }

  const labels = new LabelService(lang);

  const statusCode = getString(header, 'Status_Code');
  const tgReference = getString(header, 'TG_Reference');
  const mainCommonName = getString(header, 'TG_Name');
  const draftingCountry = getString(header, 'Cpi_DraftingCountry');
  const toBeHeldIn = getString(header, 'CPI_Tobeheldin');
  const nameAssoDocInfo = getString(header, 'Name_AssoDocInfo');
  const adoptionDate = header.TG_AdoptionDate;

  const headerDate = getHeaderDate(reportDate, adoptionDate, statusCode);

  // Fetch all data in parallel where possible
  const [
    upovCodesList,
    cpiDetailsList,
    botanicalNamesList,
    section1,
    section2,
    section3,
    section4,
    section5,
    section6,
    section7,
    section8,
    section9,
    section10,
    annexList,
  ] = await Promise.all([
    repo.getUpovCodesList(tgId),
    repo.getCpiDetailsList(tgId, lang),
    repo.getBotanicalNames(tgId),
    buildSection1(tgId, lang, labels),
    buildSection2(tgId, lang, labels),
    buildSection3(tgId, lang, labels),
    buildSection4(tgId, lang, labels),
    buildSection5(tgId, lang, labels),
    buildSection6(tgId, lang, labels),
    buildSection7(tgId),
    buildSection8(tgId, lang, labels),
    buildSection9(tgId, labels),
    buildSection10(tgId, lang, labels),
    repo.getAnnexList(tgId, lang),
  ]);

  // Build cover page data
  let upovCodes = '';
  let excludeUpovCodes = '';
  let botanicalNameHtml = '';
  let excludeBotanicalNames = '';

  for (const entry of upovCodesList) {
    const codes = getString(entry, 'UPOV_CODES');
    upovCodes = codes.replace(/ ;/g, '; ').replace(/;/g, '; ').replace(/  /g, ' ');

    const excUPOV = getString(entry, 'Exclude_UPOV_CODE_COMMENTS');
    if (excUPOV && excUPOV !== 'Add comment,  if appropriate') {
      excludeUpovCodes = stripHtml(excUPOV).replace(/\r\n/g, '');
    }

    const title1 = getString(entry, 'title1');
    botanicalNameHtml = title1.replace(/<p>/g, '').replace(/<\/p>/g, '').replace(/\r\n/g, '');

    const excBot = getString(entry, 'Exlude_Botanical_Names_COMMENTS');
    if (excBot && excBot.trim()) {
      excludeBotanicalNames = stripHtml(excBot.replace(/<p>/g, '').replace(/<\/p>/g, '').replace(/\r\n/g, ''));
    }
  }

  const cpi = cpiDetailsList[0] || {};

  // Botanical names table data
  const botanicalNamesTable = botanicalNamesList.map(entry => ({
    altnametable: stripHtml(getString(entry, 'altnametable')),
    en: getString(entry, 'en_botanical_name'),
    fr: getString(entry, 'fr_botanical_name'),
    de: getString(entry, 'de_botanical_name'),
    es: getString(entry, 'es_botanical_name'),
  }));

  const annexes = annexList
    .map(r => getString(r, 'annexRefData'))
    .filter(Boolean);

  // Assemble the full document model
  const docModel = {
    meta: {
      tgId,
      tgReference,
      mainCommonName,
      draftingCountry,
      toBeHeldIn,
      headerDate,
      statusCode,
      lang,
    },
    cover: {
      upovCodes,
      excludeUpovCodes,
      botanicalNameHtml,
      excludeBotanicalNames,
      nameAssoDocInfo: stripHtml(nameAssoDocInfo),
      associatedDocsLabel: labels.getLabel('OTHER_ASSOCIATED_UPOV_DOCUMENTS'),
      technical_working_party: getString(cpi, 'TB_Desc'),
      cpi_atits: getString(cpi, 'CPI_AtIts'),
      cpi_date_from: getDate(cpi.CPI_DateFrom),
      cpi_date_to: getDate(cpi.CPI_DateTo),
    },
    botanicalNamesTable,
    tableOfContentsLabel: labels.getLabel('TABLE_OF_CONTENTS'),
    pageLabel: labels.getLabel('PAGE'),
    firstPageFooter: labels.getLabel('FIRST_PAGE_FOOTER'),
    tqFooter: labels.getLabel('TQ_FOOTER'),
    sections: {
      s1: section1,
      s2: section2,
      s3: section3,
      s4: section4,
      s5: section5,
      s6: section6,
      s7: section7,
      s8: section8,
      s9: section9,
      s10: section10,
    },
    annexes,
  };

  // Delegate to doc builder
  return buildDocx(docModel);
}