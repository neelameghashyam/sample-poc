import { query, queryOne } from '../utils/db.js';

// Helper: named params like :tgId -> ? with ordered values
function namedQuery(sql, params) {
  const values = [];
  const converted = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    values.push(params[name]);
    return '?';
  });
  return { sql: converted, values };
}

async function queryNamed(sql, params) {
  const { sql: converted, values } = namedQuery(sql, params);
  return query(converted, values);
}

async function queryNamedOne(sql, params) {
  const rows = await queryNamed(sql, params);
  return rows[0] || null;
}

// ─── Header Details ───────────────────────────────────────────────────────────

export async function getHeaderDetails(tgId, language) {
  if (language === 'en') return getHeaderDetailsEn(tgId);
  return getHeaderDetailsTranslation(tgId, language);
}

async function getHeaderDetailsEn(tgId) {
  const sql = `
    SELECT
      TG.TG_ID AS TG_ID,
      TG.TG_Reference AS TG_Reference,
      TG.TG_Name AS TG_Name,
      TG.Language_Code AS Language_Code,
      TG.Cpi_DraftingCountry AS Cpi_DraftingCountry,
      TG.Name_AssoDocInfo AS Name_AssoDocInfo,
      tb.CPI_Tobeheldin AS CPI_Tobeheldin,
      TG.Status_Code AS Status_Code,
      TG.TG_AdoptionDate AS TG_AdoptionDate
    FROM TG
      LEFT JOIN technical_body tb
        ON tb.TB_Code = TG.CPI_TechWorkParty
        AND tb.TB_Year = TG.CPI_Year
    WHERE TG.TG_ID = ?`;
  const rows = await query(sql, [tgId]);
  return rows[0] || null;
}

async function getHeaderDetailsTranslation(tgId, language) {
  const sql = `
    SELECT
      TG.TG_ID AS TG_ID,
      TG.TG_Reference AS TG_Reference,
      TR.TG_Name AS TG_Name,
      TR.Language_Code AS Language_Code,
      TR.Cpi_DraftingCountry AS Cpi_DraftingCountry,
      TR.Name_AssoDocInfo AS Name_AssoDocInfo,
      TR.CPI_TobeheldIn AS CPI_Tobeheldin,
      TG.Status_Code AS Status_Code,
      TG.TG_AdoptionDate AS TG_AdoptionDate
    FROM TG
    LEFT JOIN TG_Translation TR
      ON TR.TG_ID = TG.TG_ID
      AND TR.Language_Code = ?
    WHERE TG.TG_ID = ?`;
  const rows = await query(sql, [language, tgId]);
  return rows[0] || null;
}

// ─── UPOV Codes ───────────────────────────────────────────────────────────────

export async function getUpovCodesList(tgId) {
  const sql = `
    SELECT
      TG_UPOVCode.TG_ID,
      GROUP_CONCAT(DISTINCT alternative_names.Upov_Code ORDER BY TG_UPOVCode.seqNumber SEPARATOR ';') AS UPOV_CODES,
      GROUP_CONCAT(DISTINCT alternative_names.Principal_Botanical_Name ORDER BY TG_UPOVCode.seqNumber SEPARATOR ';') AS title1,
      GROUP_CONCAT(DISTINCT alternative_names.Alternative_Botanical_Name ORDER BY TG_UPOVCode.seqNumber SEPARATOR ';') AS title2,
      GROUP_CONCAT(TGS.Excluding_UPOVCode) AS EXCLUDE_UPOVCODES,
      GROUP_CONCAT(TGS.Excluding_BotanicalName) AS EXCLUDE_BOTANICAL_NAMES,
      tg.Exluding_UPOVCode AS Exclude_UPOV_CODE_COMMENTS,
      tg.Excluding_BotanicalName AS Exlude_Botanical_Names_COMMENTS
    FROM TG tg
      LEFT JOIN TG_UPOVCode ON tg.tg_id = TG_UPOVCode.TG_ID
      LEFT JOIN alternative_names ON alternative_names.UPOVCODE_ID = TG_UPOVCode.UpovCode_ID
      LEFT JOIN TG_Translation TGS ON TG_UPOVCode.TG_ID = TGS.TG_ID
    WHERE TG_UPOVCode.TG_ID = ?
    GROUP BY TG_UPOVCode.TG_ID`;
  return query(sql, [tgId]);
}

// ─── CPI Details ──────────────────────────────────────────────────────────────

export async function getCpiDetailsList(tgId, language) {
  if (language === 'en') return getCpiDetailsListEn(tgId);
  return getCpiDetailsListTranslation(tgId, language);
}

async function getCpiDetailsListEn(tgId) {
  const sql = `
    SELECT
      IFNULL(tb.CPI_AtIts, TG.CPI_AtIts) AS CPI_AtIts,
      IFNULL(tb.CPI_DateFrom, TG.CPI_DateFrom) AS CPI_DateFrom,
      IFNULL(tb.CPI_DateTo, TG.CPI_DateTo) AS CPI_DateTo,
      tb.TB_Desc
    FROM TG
      LEFT JOIN technical_body tb
        ON tb.TB_Code = TG.CPI_TechWorkParty
        AND tb.TB_Year = TG.CPI_Year
    WHERE TG.TG_ID = ?`;
  return query(sql, [tgId]);
}

async function getCpiDetailsListTranslation(tgId, language) {
  const sql = `
    SELECT
      TR.CPI_AtIts,
      IFNULL(tb.CPI_DateFrom, TG.CPI_DateFrom) AS CPI_DateFrom,
      IFNULL(tb.CPI_DateTo, TG.CPI_DateTo) AS CPI_DateTo,
      TR.TB_Desc
    FROM TG
    LEFT JOIN TG_Translation TR ON TR.TG_ID = TG.TG_ID AND TR.Language_Code = :lang
    LEFT JOIN technical_body tb ON tb.TB_Code = TG.CPI_TechWorkParty AND tb.TB_Year = TG.CPI_Year
    WHERE TG.TG_ID = :tgId`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Botanical Names ──────────────────────────────────────────────────────────

export async function getBotanicalNames(tgId) {
  const sql = `
    SELECT
      alternative_names.Principal_Botanical_Name AS pr_botanical_name,
      alternative_names.en_botanical_name AS en_botanical_name,
      alternative_names.fr_botanical_name AS fr_botanical_name,
      alternative_names.es_botanical_name AS es_botanical_name,
      alternative_names.de_botanical_name AS de_botanical_name,
      IF(Alternative_Botanical_Name = '', alternative_names.Principal_Botanical_Name,
        CONCAT(alternative_names.Principal_Botanical_Name, '; </br>', Alternative_Botanical_Name)) AS title,
      IF(Alternative_Botanical_Name = '', alternative_names.Principal_Botanical_Name,
        CONCAT(alternative_names.Principal_Botanical_Name, ', ', Alternative_Botanical_Name)) AS altnametable,
      TG_UPOVCode.seqNumber
    FROM TG_UPOVCode
      JOIN alternative_names ON alternative_names.UpovCode_ID = TG_UPOVCode.UpovCode_ID
    WHERE TG_UPOVCode.TG_ID = ?
    ORDER BY TG_UPOVCode.seqNumber`;
  return query(sql, [tgId]);
}

// ─── Section One (Subject) ────────────────────────────────────────────────────

export async function getSectionOne(tgId, language) {
  if (language === 'en') return getSectionOneEn(tgId);
  return getSectionOneTranslation(tgId, language);
}

async function getSectionOneEn(tgId) {
  const sql = `
    SELECT
      info.Sub_OtherInfo,
      info.Sub_DD_Value,
      info.Other_Sub_DD_Value,
      info.SubjectSpeciesCategory,
      Botanical_Names.Botanical_Names,
      Botanical_Names.TG_ID
    FROM (
      SELECT
        tu.TG_ID,
        GROUP_CONCAT(an.PRINCIPAL_BOTANICAL_NAME ORDER BY tu.seqNumber SEPARATOR ', ') AS Botanical_Names
      FROM TG_UPOVCode tu
        JOIN alternative_names an ON tu.UPOVCode_ID = an.UPOVCode_ID
      WHERE tu.TG_ID = ?
      GROUP BY tu.TG_ID
    ) AS Botanical_Names
    LEFT JOIN TG_Sub_Add_Info info ON Botanical_Names.TG_ID = info.TG_ID`;
  return query(sql, [tgId]);
}

async function getSectionOneTranslation(tgId, language) {
  const sql = `
    SELECT
      TR.Sub_OtherInfo,
      TR.Other_Sub_DD_Value,
      TR.Sub_DD_Value,
      TR.SubjectSpeciesCategory,
      (
        SELECT GROUP_CONCAT(an.PRINCIPAL_BOTANICAL_NAME ORDER BY tu.seqNumber SEPARATOR ', ')
        FROM TG_UPOVCode tu
        JOIN alternative_names an ON tu.UPOVCode_ID = an.UPOVCode_ID
        WHERE tu.TG_ID = info.TG_ID
      ) AS Botanical_Names,
      info.TG_ID
    FROM TG_Sub_Add_Info info
    LEFT JOIN TG_Sub_Add_Info_Translation TR
      ON TR.TG_ID = info.TG_ID
      AND TR.Language_Code = :lang
    WHERE info.TG_ID = :tgId`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Annex ────────────────────────────────────────────────────────────────────

export async function getAnnexList(tgId, language) {
  if (language === 'en') return getAnnexListEn(tgId);
  return getAnnexListTranslation(tgId, language);
}

async function getAnnexListEn(tgId) {
  return query('SELECT annexRefData FROM TG_Annex WHERE TG_ID = ?', [tgId]);
}

async function getAnnexListTranslation(tgId, language) {
  const sql = 'SELECT annexRefData FROM TG_Annex_Translation WHERE TG_ID = ? AND Language_Code = ?';
  return query(sql, [tgId, language]);
}

// ─── Material Details ─────────────────────────────────────────────────────────

export async function getMaterialDetailsList(tgId, language) {
  if (language === 'en') return getMaterialDetailsListEn(tgId);
  return getMaterialDetailsListTranslation(tgId, language);
}

async function getMaterialDetailsListEn(tgId) {
  const sql = `
    SELECT
      TG_Material.Material_Supplied,
      TG_Material.Min_Plant_Material,
      TG_Material.Material_AddInfo,
      TG_Material.SeedQualityReq,
      TG_Extended.isMushroom
    FROM TG_Material
    INNER JOIN TG_Extended ON TG_Material.TG_ID = TG_Extended.TG_ID
    WHERE TG_Extended.TG_ID = ?`;
  return query(sql, [tgId]);
}

async function getMaterialDetailsListTranslation(tgId, language) {
  const sql = `
    SELECT
      TR.Material_Supplied,
      TR.Min_Plant_Material,
      TR.Material_AddInfo,
      TG_Material.SeedQualityReq,
      TG_Extended.isMushroom
    FROM TG_Material
    LEFT JOIN TG_Material_Translation TR ON TR.TG_ID = :tgId AND TR.Language_Code = :lang
    INNER JOIN TG_Extended ON TG_Material.TG_ID = TG_Extended.TG_ID
    WHERE TG_Extended.TG_ID = :tgId`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Method of Examination ────────────────────────────────────────────────────

export async function getMethodOfExaminationList(tgId, language) {
  if (language === 'en') return getMethodOfExaminationListEn(tgId);
  return getMethodOfExaminationListTranslation(tgId, language);
}

async function getMethodOfExaminationListEn(tgId) {
  const sql = `
    SELECT
      TG_Examination.GrowingCycle,
      TG_Examination.PlantingForm,
      TG_Examination.OtherGrowingCycleInfo,
      TG_Examination.CropType,
      TG_Examination.CropTypeOtherInfo,
      TG_Examination.FruitDormantPeriod,
      TG_Examination.Devlopmentstage,
      TG_Examination.PlotTypeA,
      TG_Examination.PlotTypeB,
      TG_Examination.PlotTypeC,
      TG_Examination.PlotTypeD,
      TG_Examination.EyeColorObservation,
      TG_Examination.PlotDesign,
      TG_Examination.PlantRemoval,
      TG_Examination.TestDesignAddInfo,
      TG_Examination.GrowingCycleAddInfo,
      TG_Examination.ConditionAddInfo,
      TG_Examination.IsOneMethodOfPropogation,
      TG_Extended.isMushroom
    FROM TG_Examination
    INNER JOIN TG_Extended ON TG_Examination.TG_ID = TG_Extended.TG_ID
    WHERE TG_Extended.TG_ID = ?`;
  return query(sql, [tgId]);
}

async function getMethodOfExaminationListTranslation(tgId, language) {
  const sql = `
    SELECT
      TG_Examination.GrowingCycle,
      TG_Examination.PlantingForm,
      TR.OtherGrowingCycleInfo,
      TG_Examination.CropType,
      TR.CropTypeOtherInfo,
      TG_Examination.FruitDormantPeriod,
      TG_Examination.Devlopmentstage,
      TR.PlotTypeA,
      TR.PlotTypeB,
      TR.PlotTypeC,
      TR.PlotTypeD,
      TG_Examination.EyeColorObservation,
      TG_Examination.PlotDesign,
      TG_Examination.PlantRemoval,
      TR.TestDesignAddInfo,
      TR.GrowingCycleAddInfo,
      TR.ConditionAddInfo,
      TG_Examination.IsOneMethodOfPropogation,
      TG_Extended.isMushroom
    FROM TG_Examination
    INNER JOIN TG_Extended ON TG_Examination.TG_ID = TG_Extended.TG_ID
    LEFT JOIN TG_Examination_Translation TR ON TR.TG_ID = :tgId AND TR.Language_Code = :lang
    WHERE TG_Extended.TG_ID = :tgId`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Propagation Method ───────────────────────────────────────────────────────

export async function getPropogationMethodList(tgId, language) {
  if (language === 'en') return getPropogationMethodListEn(tgId);
  return getPropogationMethodListTranslation(tgId, language);
}

async function getPropogationMethodListEn(tgId) {
  const sql = `
    SELECT
      amp.PropogationMethod, amp.PlotDesign, amp.OtherPropogationMethodInfo,
      amp.PlantType, amp.PlantNumber, amp.Replicatenum,
      amp.PlantNumberA, amp.PlantNumberB, amp.PlantNumberC, amp.PlantNumberD,
      amp.RowPlotSizeA, amp.RowPlotSizeB, amp.RowPlotSizeC, amp.RowPlotSizeD,
      amp.PlantTypeA, amp.PlantTypeB, amp.PlantTypeC, amp.PlantTypeD,
      amp.TestDesignPlotTypeA, amp.TestDesignPlotTypeB, amp.TestDesignPlotTypeC, amp.TestDesignPlotTypeD,
      amp.OtherPlantType, amp.OtherPlantTypeA, amp.OtherPlantTypeB, amp.OtherPlantTypeC, amp.OtherPlantTypeD,
      a.TG_ID
    FROM ExaminationPropagationMethod amp
    JOIN TG_Examination a ON a.examination_ID = amp.examination_ID AND a.TG_ID = ?`;
  return query(sql, [tgId]);
}

async function getPropogationMethodListTranslation(tgId, language) {
  const sql = `
    SELECT
      TR.PropogationMethod, amp.PlotDesign, amp.OtherPropogationMethodInfo,
      amp.PlantType, amp.PlantNumber, amp.Replicatenum,
      amp.PlantNumberA, amp.PlantNumberB, amp.PlantNumberC, amp.PlantNumberD,
      amp.RowPlotSizeA, amp.RowPlotSizeB, amp.RowPlotSizeC, amp.RowPlotSizeD,
      amp.PlantTypeA, amp.PlantTypeB, amp.PlantTypeC, amp.PlantTypeD,
      TR.TestDesignPlotTypeA, TR.TestDesignPlotTypeB, TR.TestDesignPlotTypeC, TR.TestDesignPlotTypeD,
      TR.OtherPlantType, TR.OtherPlantTypeA, TR.OtherPlantTypeB, TR.OtherPlantTypeC, TR.OtherPlantTypeD,
      a.TG_ID
    FROM ExaminationPropagationMethod amp
    JOIN TG_Examination a ON a.examination_ID = amp.examination_ID AND a.TG_ID = :tgId
    LEFT JOIN ExaminationPropagationMethodTranslation TR
      ON TR.TG_ID = :tgId AND TR.Language_Code = :lang
      AND TR.ExaminationPropagationMethod_ID = amp.ExaminationPropagationMethod_ID`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Characteristics (Grouping) ───────────────────────────────────────────────

export async function getCharacteristicsList(tgId, language) {
  if (language === 'en') return getCharacteristicsListEn(tgId);
  return getCharacteristicsListTranslation(tgId, language);
}

async function getCharacteristicsListEn(tgId) {
  const sql = `
    SELECT
      CharacteristicOrder,
      TOC_Name,
      Grouping_Text,
      CHAR((@rownumber := @rownumber + 1) USING utf8) AS rowNumber
    FROM TG_Characteristics,
         (SELECT @rownumber := (ORD('a') - 1)) AS rownum
    WHERE TG_ID = ?
      AND \`Grouping\` = 'Y'
    ORDER BY CharacteristicOrder`;
  return query(sql, [tgId]);
}

async function getCharacteristicsListTranslation(tgId, language) {
  const sql = `
    SELECT
      TG.CharacteristicOrder,
      TR.Field_Value as TOC_Name,
      TR.Grouping_Text,
      CHAR((@rownum := @rownum + 1) + ORD('a') - 1 USING utf8) AS rowNumber
    FROM TG_Characteristics TG
    JOIN TOC_Characteristics_Translation TR
      ON TR.TOC_ID = TG.TOC_ID AND TR.Field_Desc = 'CHAR'
      AND TR.TG_ID = :tgId AND TR.Language_Code = :lang
    CROSS JOIN (SELECT @rownum := 0) AS r
    WHERE TG.TG_ID = :tgId AND TR.Language_Code = :lang AND TG.\`Grouping\` = 'Y'
    ORDER BY TG.CharacteristicOrder`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Grouping Summary Text ────────────────────────────────────────────────────

export async function getGroupingSummaryTextList(tgId, language) {
  if (language === 'en') {
    return query('SELECT GroupingSummaryText FROM TG WHERE TG_ID = ?', [tgId]);
  }
  return queryNamed(
    'SELECT GroupingSummaryText FROM TG_Translation WHERE TG_ID = :tgId AND Language_Code = :lang',
    { tgId, lang: language }
  );
}

// ─── Additional Characteristics ───────────────────────────────────────────────

export async function getAdditionalCharacteristicsList(tgId, language) {
  if (language === 'en') {
    return query('SELECT TG.ExampleVarietyText, TG.CharacteristicLegend FROM TG WHERE TG.TG_ID = ?', [tgId]);
  }
  return queryNamed(
    'SELECT ExampleVarietyText, CharacteristicLegend FROM TG_Translation WHERE TG_ID = :tgId AND Language_Code = :lang',
    { tgId, lang: language }
  );
}

// ─── Section 7 - Table of Characteristics ─────────────────────────────────────

export async function getSevenTableCharacteristicsList(tgId) {
  const sql = `
    SELECT
      TG_Characteristics.TOC_ID,
      TG_Characteristics.Asterisk,
      TG_Characteristics.Grouping,
      TG_Characteristics.Expression_Type,
      TG_Characteristics.Growth_Stages,
      TG_Characteristics.Grouping_Text,
      TG_Characteristics.TOC_Name,
      TG_Characteristics.ObservationM_PlotT,
      TG_Characteristics.Add_To_TQ5,
      TG_Characteristics.IsAdoptedTG,
      TG_Characteristics.IsAdoptedTGModify,
      TG_Characteristics.CharacteristicOrder,
      TG_Characteristics.TG_ID,
      GET_INDIV(TG_Characteristics.TOC_ID) AS indivFlag,
      GET_CHARACTERISTIC('FR', TG_Characteristics.TG_ID, TG_Characteristics.TOC_ID) AS CHAR_FR,
      GET_CHARACTERISTIC('DE', TG_Characteristics.TG_ID, TG_Characteristics.TOC_ID) AS CHAR_DE,
      GET_CHARACTERISTIC('ES', TG_Characteristics.TG_ID, TG_Characteristics.TOC_ID) AS CHAR_ES,
      GET_INDICATION(TG_Characteristics.TG_ID, TG_Characteristics.TOC_ID) AS FULL_IND,
      GET_NOTES(TG_Characteristics.TOC_ID, Ev.EXP_EN) AS NOTES,
      Ev.EXP_EN,
      GET_EXPRESSION('ES', TG_Characteristics.TG_ID, TG_Characteristics.TOC_ID, GET_NOTES(TG_Characteristics.TOC_ID, Ev.EXP_EN)) AS EXP_ES,
      GET_EXPRESSION('DE', TG_Characteristics.TG_ID, TG_Characteristics.TOC_ID, GET_NOTES(TG_Characteristics.TOC_ID, Ev.EXP_EN)) AS EXP_DE,
      GET_EXPRESSION('FR', TG_Characteristics.TG_ID, TG_Characteristics.TOC_ID, GET_NOTES(TG_Characteristics.TOC_ID, Ev.EXP_EN)) AS EXP_FR,
      ORDER_EXAMPLE_VARIETY(TRIM(Ev.Unordered_Example_Varieties)) AS ORDERED_Example_Varieties
    FROM TG_Characteristics
    JOIN (
      SELECT
        TOC_Expression_Notes.TOC_ID,
        TOC_Expression_Notes.State_of_expression AS EXP_EN,
        GROUP_CONCAT(
          GET_EXAMPLE_VARIETY(
            SUBSTRING_INDEX(SUBSTRING_INDEX(TOC_Expression_Notes.Example_Varieties, ',', numbers.number), ',', -1)
          ) SEPARATOR ','
        ) AS Unordered_Example_Varieties
      FROM numbers, TOC_Expression_Notes
      WHERE CHAR_LENGTH(TOC_Expression_Notes.Example_Varieties)
            - CHAR_LENGTH(REPLACE(TOC_Expression_Notes.Example_Varieties, ',', ''))
            >= numbers.Number - 1
      GROUP BY TOC_Expression_Notes.TOC_ID, TOC_Expression_Notes.State_of_expression
    ) Ev ON Ev.TOC_ID = TG_Characteristics.TOC_ID
    AND TG_Characteristics.TG_ID = ?
    ORDER BY CharacteristicOrder, CAST(NOTES AS DECIMAL)`;
  return query(sql, [tgId]);
}

// ─── Characteristics Explanation ──────────────────────────────────────────────

export async function getCharacteristicsExplanationList(tgId) {
  const sql = `
    SELECT
      TG.TG_ID,
      COUNT(gcl.TG_ID) AS NumberOfMultipleCharacteristicsExplanations
    FROM TG
    LEFT JOIN GroupCharacteristicLabel gcl ON gcl.TG_ID = TG.TG_ID
    WHERE TG.TG_ID = ?`;
  return query(sql, [tgId]);
}

export async function getCharacteristicsExpList(tgId, language) {
  if (language === 'en') {
    return query('SELECT TG.TG_ID, TG.ExplanationText FROM TG WHERE TG.TG_ID = ?', [tgId]);
  }
  return queryNamed(
    'SELECT TG_ID, ExplanationText FROM TG_Translation WHERE TG_ID = :tgId AND Language_Code = :lang',
    { tgId, lang: language }
  );
}

export async function getSeveralCharsList(tgId, language) {
  if (language === 'en') {
    return query(
      'SELECT IndicationLabel, LabelExplanation FROM GroupCharacteristicLabel WHERE TG_ID = ? ORDER BY IndicationLabel',
      [tgId]
    );
  }
  return queryNamed(
    'SELECT IndicationLabel, LabelExplanation FROM GroupCharacteristicLabel_Translation WHERE TG_ID = :tgId AND Language_Code = :lang ORDER BY IndicationLabel',
    { tgId, lang: language }
  );
}

// ─── Literature ───────────────────────────────────────────────────────────────

export async function getTableCharacteristicsList(tgId) {
  return query(
    'SELECT * FROM TG_Literature WHERE TG_ID = ? ORDER BY LiteratureReferences',
    [tgId]
  );
}

// ─── TOC Characteristics (Explanations) ──────────────────────────────────────

export async function getTocCharacteristics(tgId, language) {
  if (language === 'en') return getTocCharacteristicsEn(tgId);
  return getTocCharacteristicsTranslation(tgId, language);
}

async function getTocCharacteristicsEn(tgId) {
  const sql = `
    SELECT
      toc.TOC_Name,
      toc.CharacteristicOrder,
      tce.Explaination_Text
    FROM TG_Characteristics toc
    JOIN TOC_Characteristic_Explanation tce ON tce.TOC_ID = toc.TOC_ID
    WHERE toc.TG_ID = ? AND tce.Explaination_Text != ''
    ORDER BY toc.CharacteristicOrder`;
  return query(sql, [tgId]);
}

async function getTocCharacteristicsTranslation(tgId, language) {
  const sql = `
    SELECT
      tr.Field_Value as TOC_Name,
      toc.CharacteristicOrder,
      tce.Explanation_Text as Explaination_Text
    FROM TG_Characteristics toc
    JOIN TOC_Characteristic_Explanation_Translation tce
      ON tce.TOC_ID = toc.TOC_ID AND tce.Language_Code = :lang
    JOIN TOC_Characteristics_Translation tr
      ON tr.TOC_ID = toc.TOC_ID AND tr.Field_Desc = 'CHAR' AND tr.Language_Code = :lang
    WHERE toc.TG_ID = :tgId AND tce.Explanation_Text != ''
    ORDER BY toc.CharacteristicOrder`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Additional Char References ───────────────────────────────────────────────

export async function getAdditionCharaReference(tgId, language) {
  if (language === 'en') {
    return query(
      "SELECT additionalCharacteriticsReferences FROM TG_AdditionalCharacteristics WHERE TG_ID = ? AND additionalCharacteriticsReferences <> ''",
      [tgId]
    );
  }
  return queryNamed(
    "SELECT additionalCharacteriticsReferences FROM TG_AdditionalCharacteristics_Translation WHERE TG_ID = :tgId AND additionalCharacteriticsReferences <> ''",
    { tgId, lang: language }
  );
}

// ─── Technical Questionnaire ──────────────────────────────────────────────────

export async function getTechnicalQuestionnaire(tgId, language) {
  if (language === 'en') return getTechnicalQuestionnaireEn(tgId);
  return getTechnicalQuestionnaireTranslation(tgId, language);
}

async function getTechnicalQuestionnaireEn(tgId) {
  const sql = `
    SELECT
      tq.TqHybridVariety, tq.BreedingSchemeInfo, tq.DiffCharacteristic,
      tq.SimilarVarietyExpression, tq.CandidateVarietyExpression,
      tq.IsTqColorImage, tq.ColorImageInfo, tq.ProvideVirusPresence,
      tq.VirusPresenceInfo, tq.ProdSchemeInfo, tq.ExaminationAddInfo,
      te.isMushroom
    FROM TG_TechQuestionaire tq
    INNER JOIN TG_Extended te ON tq.TG_ID = te.TG_ID
    WHERE te.TG_ID = ?`;
  return query(sql, [tgId]);
}

async function getTechnicalQuestionnaireTranslation(tgId, language) {
  const sql = `
    SELECT
      tq.TqHybridVariety, TR.BreedingSchemeInfo, TR.DiffCharacteristic,
      TR.SimilarVarietyExpression, TR.CandidateVarietyExpression,
      tq.IsTqColorImage, tq.ColorImageInfo, tq.ProvideVirusPresence,
      TR.VirusPresenceInfo, TR.ProdSchemeInfo, TR.ExaminationAddInfo,
      te.isMushroom
    FROM TG_TechQuestionaire tq
    LEFT JOIN TechnicalQuestionnaire_Translation TR ON TR.TG_ID = :tgId AND TR.Language_Code = :lang
    INNER JOIN TG_Extended te ON tq.TG_ID = te.TG_ID
    WHERE te.TG_ID = :tgId`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export async function getAssessmentList(tgId, language) {
  if (language === 'en') return getAssessmentListEn(tgId);
  return getAssessmentListTranslation(tgId, language);
}

async function getAssessmentListEn(tgId) {
  const sql = `
    SELECT
      TG_Assessment.Assessment_Id,
      TG_Assessment.IsHybridParentFormula, TG_Assessment.DistinctnessHybridAddInfo,
      TG_Assessment.IsOneMethodOfPropogation, TG_Assessment.SinglePlant,
      TG_Assessment.PartsPlant, TG_Assessment.DistinctnessAddInfo,
      TG_Assessment.CrossPolinattedVarieties, TG_Assessment.TypesOfVariety,
      TG_Assessment.OtherVarietyTypes, TG_Assessment.UniformityCrossPollinatedAddInfo,
      TG_Assessment.IsHybridVariety, TG_Assessment.UniformityHybridAddInfo,
      TG_Assessment.UniformityAssessmentParentFormula,
      TG_Assessment.UniformityParentFormulaAddInfo,
      TG_Assessment.UniformityAssessmentSameSample,
      TG_Assessment.OtherUniformityPropogationType,
      TG_Assessment.UniformityPropogationType,
      TG_Assessment.PopulationStandard, TG_Assessment.AcceptanceProbability,
      TG_Assessment.PlantSampleSize, TG_Assessment.OffType,
      TG_Assessment.UniformityOfftypeAllPlantsAddSentence,
      TG_Assessment.UniformityOfftypeAllPlantsAddInfo,
      TG_Assessment.UniformityOfftypeSameSampleAddSentence,
      TG_Assessment.UniformityOfftypeSameSampleAddInfo,
      TG_Assessment.UniformityAssessmentDifferentSample,
      TG_Assessment.DiffUniformityPlantSample, TG_Assessment.DiffPopulationStandard,
      TG_Assessment.DiffAcceptanceProbability, TG_Assessment.DiffPlantSampleSize,
      TG_Assessment.DiffOffType, TG_Assessment.SubSampleType,
      TG_Assessment.SubSamplePopulationStandard, TG_Assessment.SubSampleAcceptanceProbability,
      TG_Assessment.SubSampleSize, TG_Assessment.SubSampleOffType,
      TG_Assessment.RowSubSampleType,
      TG_Assessment.UniformityOfftypeSubSampleAddSentence,
      TG_Assessment.UniformityOfftypeSubSampleAddInfo,
      TG_Assessment.UniformityAddInfo, TG_Assessment.TGCovering,
      TG_Assessment.IsParentLineAssessed, TG_Assessment.StabilityAddInfo,
      TG_Assessment.SubSampleTypeA, TG_Assessment.SubSampleTypeB,
      TG_Assessment.SubSampleTypeC, TG_Assessment.RowsSubSampleTypeA,
      TG_Assessment.RowsSubSampleTypeB, TG_Assessment.RowsSubSampleTypeC,
      TG_Assessment.OtherRowsSubSampleTypeA, TG_Assessment.OtherRowsSubSampleTypeB,
      TG_Assessment.OtherRowsSubSampleTypeC,
      TG_Assessment.typeOfPropagation, TG_Assessment.OtherTypeOfPropagation,
      TG_Extended.IsMushroom
    FROM TG_Assessment
    INNER JOIN TG_Extended ON TG_Assessment.TG_ID = TG_Extended.TG_ID
    WHERE TG_Extended.TG_ID = ?`;
  return query(sql, [tgId]);
}

async function getAssessmentListTranslation(tgId, language) {
  const sql = `
    SELECT
      TG_Assessment.Assessment_Id,
      TG_Assessment.IsHybridParentFormula, TR.DistinctnessHybridAddInfo,
      TG_Assessment.IsOneMethodOfPropogation, TG_Assessment.SinglePlant,
      TG_Assessment.PartsPlant, TR.DistinctnessAddInfo,
      TG_Assessment.CrossPolinattedVarieties, TG_Assessment.TypesOfVariety,
      TR.OtherVarietyTypes, TR.UniformityCrossPollinatedAddInfo,
      TG_Assessment.IsHybridVariety, TR.UniformityHybridAddInfo,
      TG_Assessment.UniformityAssessmentParentFormula,
      TR.UniformityParentFormulaAddInfo,
      TG_Assessment.UniformityAssessmentSameSample,
      TR.OtherUniformityPropogationType, TR.UniformityPropogationType,
      TG_Assessment.PopulationStandard, TG_Assessment.AcceptanceProbability,
      TG_Assessment.PlantSampleSize, TG_Assessment.OffType,
      TR.UniformityOfftypeAllPlantsAddSentence, TR.UniformityOfftypeAllPlantsAddInfo,
      TR.UniformityOfftypeSameSampleAddSentence, TR.UniformityOfftypeSameSampleAddInfo,
      TG_Assessment.UniformityAssessmentDifferentSample,
      TG_Assessment.DiffUniformityPlantSample, TG_Assessment.DiffPopulationStandard,
      TG_Assessment.DiffAcceptanceProbability, TG_Assessment.DiffPlantSampleSize,
      TG_Assessment.DiffOffType, TG_Assessment.SubSampleType,
      TG_Assessment.SubSamplePopulationStandard, TG_Assessment.SubSampleAcceptanceProbability,
      TG_Assessment.SubSampleSize, TG_Assessment.SubSampleOffType,
      TG_Assessment.RowSubSampleType,
      TR.UniformityOfftypeSubSampleAddSentence, TR.UniformityOfftypeSubSampleAddInfo,
      TR.UniformityAddInfo, TG_Assessment.TGCovering,
      TG_Assessment.IsParentLineAssessed, TR.StabilityAddInfo,
      TR.SubSampleTypeA, TR.SubSampleTypeB, TR.SubSampleTypeC,
      TR.RowsSubSampleTypeA, TR.RowsSubSampleTypeB, TR.RowsSubSampleTypeC,
      TR.OtherRowsSubSampleTypeA, TR.OtherRowsSubSampleTypeB, TR.OtherRowsSubSampleTypeC,
      TR.typeOfPropagation, TR.OtherTypeOfPropagation,
      TG_Extended.IsMushroom
    FROM TG_Assessment
    INNER JOIN TG_Extended ON TG_Assessment.TG_ID = TG_Extended.TG_ID
    JOIN TG_Assessment_Translation TR ON TR.TG_ID = :tgId AND TR.Language_Code = :lang
    WHERE TG_Extended.TG_ID = :tgId`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Number of Plants ─────────────────────────────────────────────────────────

export async function getNumberOfPlants(tgId) {
  const sql = `
    SELECT
      amp.PropogationMethod, amp.NumberOfPlants, amp.NumberOfPartsOfPlants,
      amp.isPartsOfSinglePlants
    FROM AssesmentMethodPropogation amp
    JOIN TG_Assessment a ON a.Assessment_ID = amp.Assessment_ID
    WHERE a.TG_ID = ?`;
  return query(sql, [tgId]);
}

// ─── TQ - Subjects ────────────────────────────────────────────────────────────

export async function getTgCharacteristics(tgId, language) {
  if (language === 'en') return getTgCharacteristicsEn(tgId);
  return getTgCharacteristicsTranslation(tgId, language);
}

async function getTgCharacteristicsEn(tgId) {
  const sql = `
    SELECT DISTINCT
      TqSubject.TqBotanicalName, TqSubject.TqCommonName,
      TqSubject.TqAddSentence, TqSubject.TqAdditionalInfo,
      TqSubject.insert_order, TG_TechQuestionaire.TqHybridVariety
    FROM TG_TechQuestionaire
    JOIN TqSubject ON TqSubject.TechQu_ID = TG_TechQuestionaire.TechQu_ID
    WHERE TG_TechQuestionaire.TG_ID = ?
    ORDER BY TqSubject.insert_order`;
  return query(sql, [tgId]);
}

async function getTgCharacteristicsTranslation(tgId, language) {
  const sql = `
    SELECT DISTINCT
      TqSubject.TqBotanicalName, TR.TqCommonName, TR.TqAdditionalInfo,
      TqSubject.insert_order, TG_TechQuestionaire.TqHybridVariety
    FROM TG_TechQuestionaire
    JOIN TqSubject ON TqSubject.TechQu_ID = TG_TechQuestionaire.TechQu_ID
    JOIN TqSubjectTranslation TR
      ON TR.TG_ID = :tgId AND Language_Code = :lang
      AND TqSubject.TqSubjectID = TR.TqSubjectID
    WHERE TG_TechQuestionaire.TG_ID = :tgId
    ORDER BY TqSubject.insert_order`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Propagation Varieties ────────────────────────────────────────────────────

export async function getPropagationVarietiesList(tgId, language) {
  if (language === 'en') return getPropagationVarietiesListEn(tgId);
  return getPropagationVarietiesListTranslation(tgId, language);
}

async function getPropagationVarietiesListEn(tgId) {
  const sql = `
    SELECT P.*, CHAR((@rownumber := @rownumber + 1) USING utf8) AS rowNumber
    FROM (
      SELECT DISTINCT
        TqPropagationMethod.TqVarietyPropagationMethodID,
        TqPropagationMethod.TqPMethodOtherDetails,
        TqVarietyPropagationMethod.SeqId,
        LEFT(TqPropagationMethod.TqVarietyPropagationMethodID, 3) AS level1
      FROM TG_TechQuestionaire
      JOIN TqPropagationMethod
        ON TG_TechQuestionaire.TechQu_ID = TqPropagationMethod.TechQu_ID
        AND TG_TechQuestionaire.TG_ID = ?
      JOIN TqVarietyPropagationMethod
        ON TqPropagationMethod.TqVarietyPropagationMethodID = TqVarietyPropagationMethod.TqVarietyPropagationMethodID
    ) AS P, (SELECT @rownumber := (ORD('a') - 1)) AS rownum
    ORDER BY SeqId`;
  return query(sql, [tgId]);
}

async function getPropagationVarietiesListTranslation(tgId, language) {
  const sql = `
    SELECT P.*, CHAR((@rownumber := @rownumber + 1) USING utf8) AS rowNumber
    FROM (
      SELECT DISTINCT
        pm.TqVarietyPropagationMethodID,
        TR.TqPMethodOtherDetails,
        TqVarietyPropagationMethod.SeqId,
        LEFT(pm.TqVarietyPropagationMethodID, 3) AS level1
      FROM TG_TechQuestionaire
      JOIN TqPropagationMethod pm
        ON TG_TechQuestionaire.TechQu_ID = pm.TechQu_ID
        AND TG_TechQuestionaire.TG_ID = :tgId
      LEFT JOIN tqpropagationmethod_translation TR
        ON TR.TG_ID = :tgId AND TR.Language_Code = :lang
        AND TR.TqVarietyPropagationMethodID = pm.TqVarietyPropagationMethodID
      JOIN TqVarietyPropagationMethod
        ON pm.TqVarietyPropagationMethodID = TqVarietyPropagationMethod.TqVarietyPropagationMethodID
    ) AS P, (SELECT @rownumber := (ORD('a') - 1)) AS rownum
    ORDER BY SeqId`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Existing Sequences ───────────────────────────────────────────────────────

export async function getExistingSequences(tgId) {
  const sql = `
    SELECT
      c.Name AS Name,
      CONVERT(c.ExistingSeqNumber, UNSIGNED INTEGER) AS Existing_Seq_Num,
      COUNT(CONVERT(c.ExistingSeqNumber, UNSIGNED INTEGER)) AS Existing_Seq_Number_Count
    FROM TG_TechQuestionaire tq
    JOIN TQ_Characteristics c ON tq.TechQu_ID = c.TechQu_ID
    JOIN TQ_ExpressionNotes e ON e.TQ_CharacteristicsID = c.TQ_CharacteristicsID
    WHERE tq.TG_ID = ?
    GROUP BY c.ExistingSeqNumber, c.Name
    ORDER BY Existing_Seq_Num DESC`;
  return query(sql, [tgId]);
}

// ─── Table of Characteristics (TQ) ───────────────────────────────────────────

export async function getTableOfCharacteristics(tgId, language) {
  if (language === 'en') return getTableOfCharacteristicsEn(tgId);
  return getTableOfCharacteristicsTranslation(tgId, language);
}

async function getTableOfCharacteristicsEn(tgId) {
  const sql = `
    SELECT
      CONVERT(c.ExistingSeqNumber, UNSIGNED INTEGER) AS ExistingSeqNumber,
      c.Name, c.TQ_CharacteristicsID,
      e.StateOfExpression, e.ExampleVarieties, e.ExpressionNotes,
      GET_CHARCOLOR(c.TQ_CharacteristicsID) AS ColorCharIndicator,
      GET_CHARNONCOLOR(c.TQ_CharacteristicsID) AS NonColorCharIndicator
    FROM TG_TechQuestionaire tq
    JOIN TQ_Characteristics c ON tq.TechQu_ID = c.TechQu_ID
    JOIN TQ_ExpressionNotes e ON e.TQ_CharacteristicsID = c.TQ_CharacteristicsID
    WHERE tq.TG_ID = ?
    ORDER BY (ExistingSeqNumber IS NULL) ASC, ExistingSeqNumber ASC, e.ExpressionNotes ASC`;
  return query(sql, [tgId]);
}

async function getTableOfCharacteristicsTranslation(tgId, language) {
  const sql = `
    SELECT
      CONVERT(c.ExistingSeqNumber, UNSIGNED INTEGER) AS ExistingSeqNumber,
      TR.TOC_ID,
      (SELECT Field_Value FROM TQ_Characteristics_Translation
       WHERE TOC_ID = c.TOC_ID AND Language_Code = :lang AND Field_Desc = 'CHAR') AS Name,
      c.TQ_CharacteristicsID,
      TR.Field_Value AS StateOfExpression,
      e.ExampleVarieties, e.ExpressionNotes,
      GET_CHARCOLOR(c.TQ_CharacteristicsID) AS ColorCharIndicator,
      GET_CHARNONCOLOR(c.TQ_CharacteristicsID) AS NonColorCharIndicator
    FROM TG_TechQuestionaire tq
    JOIN TQ_Characteristics c ON tq.TechQu_ID = c.TechQu_ID
    JOIN TQ_ExpressionNotes e ON e.TQ_CharacteristicsID = c.TQ_CharacteristicsID
    INNER JOIN TQ_Characteristics_Translation TR
      ON TR.TOC_ID = c.TOC_ID AND TR.Field_Desc = 'SOE'
      AND TR.ExpressionNotes = e.ExpressionNotes AND TR.Language_Code = :lang
    WHERE tq.TG_ID = :tgId
    ORDER BY (ExistingSeqNumber IS NULL) ASC, ExistingSeqNumber ASC, e.ExpressionNotes ASC`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Breeding Schemes ─────────────────────────────────────────────────────────

export async function getIndexFourTableofCharacteristicsList(tgId, language) {
  if (language === 'en') return getIndexFourTableofCharacteristicsListEn(tgId);
  return getIndexFourTableofCharacteristicsListTranslation(tgId, language);
}

async function getIndexFourTableofCharacteristicsListEn(tgId) {
  const sql = `
    SELECT
      TqBreedingSchemeMethodMethodDesc, TqBreedingSchemeOtherDetails,
      vpm.tqBreedingSchememethodid, vpm.SeqId
    FROM TG_TechQuestionaire tq
    JOIN TqBreedingScheme tpm ON tpm.techqu_id = tq.techqu_id
    JOIN TQBreedingSchemeMethod vpm ON vpm.tqBreedingSchememethodid = tpm.TqBreedingSchemeMethodid
    WHERE tq.TG_ID = ? AND vpm.IsActive = 'A'
    ORDER BY vpm.SeqId`;
  return query(sql, [tgId]);
}

async function getIndexFourTableofCharacteristicsListTranslation(tgId, language) {
  const sql = `
    SELECT
      vpm.TqBreedingSchemeMethodMethodDesc, TR.TqBreedingSchemeOtherDetails,
      vpm.tqBreedingSchememethodid, vpm.SeqId
    FROM TG_TechQuestionaire tq
    JOIN TqBreedingScheme tpm ON tpm.techqu_id = tq.techqu_id
    JOIN TQBreedingSchemeMethod vpm ON vpm.tqBreedingSchememethodid = tpm.TqBreedingSchemeMethodid
    LEFT JOIN tqbreedingscheme_translation TR
      ON TR.TG_ID = tq.TG_ID AND TR.Language_Code = :lang
      AND TR.tqBreedingSchememethodid = vpm.tqBreedingSchememethodid
    WHERE tq.TG_ID = :tgId AND vpm.IsActive = 'A'
    ORDER BY vpm.SeqId`;
  return queryNamed(sql, { tgId, lang: language });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function getTableHybridList(tgId) {
  return query('SELECT TqHybridVariety FROM TG_TechQuestionaire WHERE TG_ID = ?', [tgId]);
}

export async function getMaxIndicationLabel(tgId) {
  const sql = `
    SELECT max(IndicationLabel) AS maxLabel
    FROM GroupCharacteristicLabel
    WHERE GroupLabelID IN (
      SELECT DISTINCT(GroupLabelID) FROM TOC_GroupCharacteristic WHERE tg_id = ?
    )`;
  const rows = await query(sql, [tgId]);
  return rows[0]?.maxLabel ?? null;
}

export async function isGrowthStage(tgId) {
  const sql = `
    SELECT (COUNT(*) > 0) AS has_data
    FROM TG_Characteristics
    WHERE Growth_Stages <> '' AND TG_ID = ?`;
  const rows = await query(sql, [tgId]);
  return !!rows[0]?.has_data;
}