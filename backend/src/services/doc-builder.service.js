/**
 * doc-builder.service.js
 *
 * Converts the rich document model (built by doc-generator.service.js) into a
 * Word (.docx) file using the `docx` npm package.
 *
 * Install: npm install docx
 *
 * The builder mirrors the section structure of the original Java Spire.Doc
 * implementation, producing a structurally faithful DOCX output.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  PageBreak,
  ShadingType,
  TableOfContents,
  Footer,
  Header,
  Tab,
} from 'docx';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function text(content, opts = {}) {
  return new TextRun({ text: content || '', ...opts });
}

function para(runs, opts = {}) {
  const r = Array.isArray(runs) ? runs : [text(runs)];
  return new Paragraph({ children: r, ...opts });
}

function heading1(content) {
  return new Paragraph({
    text: content || '',
    heading: HeadingLevel.HEADING_1,
  });
}

function heading2(content) {
  return new Paragraph({
    text: content || '',
    heading: HeadingLevel.HEADING_2,
  });
}

function numbered(index, content, opts = {}) {
  return new Paragraph({
    children: [text(`${index}\t${content}`)],
    ...opts,
  });
}

function emptyPara() {
  return para('');
}

function cell(content, opts = {}) {
  return new TableCell({
    children: [typeof content === 'string' ? para(content) : content],
    ...opts,
  });
}

function greyCell(content) {
  return new TableCell({
    children: [para(content)],
    shading: { type: ShadingType.SOLID, color: 'D9D9D9' },
  });
}

function simpleTable(rows) {
  return new Table({
    rows: rows.map(
      (cols) =>
        new TableRow({
          children: cols.map((c) =>
            new TableCell({
              children: [typeof c === 'string' ? para(c) : c],
            })
          ),
        })
    ),
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildCoverSection(model) {
  const { meta, cover, botanicalNamesTable } = model;
  const children = [];

  children.push(
    para([text(meta.tgReference, { bold: true })]),
    para([text(meta.mainCommonName.toUpperCase(), { bold: true })]),
    emptyPara(),
  );

  if (cover.upovCodes) {
    children.push(para([text('UPOV Code: '), text(cover.upovCodes)]));
  }

  if (cover.excludeUpovCodes) {
    children.push(para([text('Excluding: '), text(cover.excludeUpovCodes)]));
  }

  if (cover.botanicalNameHtml) {
    children.push(para(cover.botanicalNameHtml));
  }

  if (cover.excludeBotanicalNames) {
    children.push(para(cover.excludeBotanicalNames));
  }

  if (cover.nameAssoDocInfo) {
    children.push(para([text(cover.associatedDocsLabel, { bold: true })]));
    children.push(para(cover.nameAssoDocInfo));
  }

  if (cover.technical_working_party) {
    children.push(para([text(cover.technical_working_party)]));
  }

  if (cover.cpi_atits) {
    children.push(para([text(cover.cpi_atits)]));
  }

  if (cover.cpi_date_from) {
    children.push(para([text(`${cover.cpi_date_from} – ${cover.cpi_date_to || ''}`)]))
  }

  // Botanical Names Table (cover page)
  if (botanicalNamesTable.length > 0) {
    children.push(emptyPara());
    const headerRow = new TableRow({
      children: ['Botanical name', 'English', 'français', 'deutsch', 'español'].map(h =>
        new TableCell({
          children: [para([text(h, { italics: true, size: 18 })])],
        })
      ),
      tableHeader: true,
    });
    const dataRows = botanicalNamesTable.map(
      entry =>
        new TableRow({
          children: [
            new TableCell({ children: [para(entry.altnametable)] }),
            new TableCell({ children: [para(entry.en || '')] }),
            new TableCell({ children: [para(entry.fr || '')] }),
            new TableCell({ children: [para(entry.de || '')] }),
            new TableCell({ children: [para(entry.es || '')] }),
          ],
        })
    );
    children.push(
      new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } })
    );
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Table of contents placeholder
  children.push(
    para([text(model.tableOfContentsLabel, { underline: {}, size: 20 })]),
    new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  return children;
}

function buildSection1(s1) {
  const children = [heading1(s1.heading)];
  for (const item of s1.items) {
    if (item.botanicalNames) {
      children.push(para(`\t${s1.applyToAll} ${item.botanicalNames}.`));
    }
    if (item.subjectSpeciesCategory) {
      children.push(emptyPara());
      children.push(para(`\t${s1.guidanceLabel.replace('{0}', item.subjectSpeciesCategory)}`));
    }
    if (item.subDDValue) {
      children.push(emptyPara());
      children.push(para(`\t${s1.particularVarieties.replace('{0}', item.subDDValue)}`));
    }
  }
  children.push(emptyPara(), emptyPara());
  return children;
}

function buildSection2(s2) {
  const children = [
    heading1(s2.heading),
    numbered('2.1', s2.para2_1),
    emptyPara(),
    numbered('2.2', s2.para2_2),
    emptyPara(),
    numbered('2.3', s2.para2_3),
    emptyPara(),
  ];

  if (s2.minPlantMaterial) {
    children.push(para(s2.minPlantMaterial));
    children.push(emptyPara());
  }

  if (s2.seedQualityReq) {
    const sl = s2.seedLabels;
    if (s2.seedQualityReq === 'ASW1(a)') {
      children.push(para(`${sl.MATERIAL_5} ${sl.MATERIAL_6} ${sl.MATERIAL_7}`));
    } else if (s2.seedQualityReq === 'ASW2(a)') {
      children.push(para(`${sl.MATERIAL_8} ${sl.MATERIAL_9}`));
    } else if (s2.seedQualityReq === 'ASW1(b)') {
      children.push(para(`${sl.MATERIAL_5} ${sl.MATERIAL_10}`));
    } else if (s2.seedQualityReq === 'ASW2(b)') {
      children.push(para(`${sl.MATERIAL_8} ${sl.MATERIAL_10}`));
    }
    children.push(emptyPara());
  }

  if (s2.materialAddInfo) {
    children.push(para(s2.materialAddInfo));
    children.push(emptyPara());
  }

  children.push(numbered('2.4', s2.para2_4));
  children.push(emptyPara());
  children.push(numbered('2.5', s2.para2_5));
  children.push(emptyPara(), emptyPara());
  return children;
}

function buildSection3(s3) {
  const { examination: ex, propItems, labels: L } = s3;
  const children = [
    heading1(s3.heading),
    heading2(L.EXAMINATION_2),
  ];

  let idx311 = 1;
  const prefix311 = '3.1';

  if (ex.growingCycle === 'Single') {
    children.push(numbered(`${prefix311}.${idx311++}`, L.EXAMINATION_3));
    children.push(emptyPara());
  } else if (ex.growingCycle === 'Two') {
    children.push(numbered(`${prefix311}.${idx311++}`, L.EXAMINATION_4));
    children.push(emptyPara());
  }

  if (ex.plantingForm === 'from a single planting') {
    children.push(numbered(`${prefix311}.${idx311++}`, L.EXAMINATION_5));
  } else if (ex.plantingForm === 'in the form of two separate plantings') {
    children.push(numbered(`${prefix311}.${idx311++}`, L.EXAMINATION_6));
  }

  if (ex.otherGrowingCycleInfo) {
    children.push(numbered(`${prefix311}.${idx311++}`, ex.otherGrowingCycleInfo));
  }

  if (ex.cropType || ex.cropTypeOtherInfo) {
    const ct = ex.cropType || ex.cropTypeOtherInfo;
    children.push(numbered(`${prefix311}.${idx311++}`, `${L.EXAMINATION_7} ${ct} ${L.EXAMINATION_8}`));
    children.push(emptyPara());
  }

  if (['Defined', 'Not defined', 'Evergreen'].includes(ex.fruitDormantPeriod)) {
    const map = { Defined: L.EXAMINATION_9, 'Not defined': L.EXAMINATION_10, Evergreen: L.EXAMINATION_11 };
    children.push(numbered(`${prefix311}.${idx311++}`, map[ex.fruitDormantPeriod]));
    children.push(emptyPara());
  }

  if (ex.growingCycleAddInfo) {
    children.push(numbered(`${prefix311}.${idx311++}`, ex.growingCycleAddInfo));
  }

  children.push(numbered(`${prefix311}.${idx311}`, L.EXAMINATION_12));

  // 3.2
  children.push(heading2(L.EXAMINATION_13));
  children.push(para(`\t${L.EXAMINATION_14}`));

  // 3.3
  children.push(heading2(L.EXAMINATION_15));

  let idx33 = 2;
  children.push(para(`\t${L.EXAMINATION_16}`));

  if (ex.devlopmentstage?.toUpperCase() === 'Y') {
    children.push(numbered(`3.3.${idx33++}`, L.EXAMINATION_17));
  }
  if (ex.plotTypeA) {
    children.push(numbered(`3.3.${idx33++}`, L.EXAMINATION_18));
    children.push(para(`\t\tA: ${ex.plotTypeA}`));
    if (ex.plotTypeB) children.push(para(`\t\tB: ${ex.plotTypeB}`));
    if (ex.plotTypeC) children.push(para(`\t\tC: ${ex.plotTypeC}`));
    if (ex.plotTypeD) children.push(para(`\t\tD: ${ex.plotTypeD}`));
    children.push(emptyPara());
  }
  if (ex.eyeColorObservation?.toUpperCase() === 'Y') {
    children.push(numbered(`3.3.${idx33++}`, L.EXAMINATION_19));
  }
  if (ex.conditionAddInfo) {
    children.push(numbered(`3.3.${idx33++}`, ex.conditionAddInfo));
  }

  // 3.4
  children.push(heading2(L.EXAMINATION_20));

  const isPlantRemoval = ex.plantRemoval?.toUpperCase() === 'Y';
  const isTestDesignAddInfo = !!ex.testDesignAddInfo;
  const singleProp = propItems.length === 1 && !isPlantRemoval && !isTestDesignAddInfo;

  let count34 = 1;
  for (const item of propItems) {
    if (item.plotDesign?.toLowerCase() === 'diffplot') {
      for (const [pt, pn, rs, td] of [
        [item.plantTypeA || item.otherPlantTypeA, item.plantNumberA, item.rowPlotSizeA, item.testDesignPlotTypeA],
        [item.plantTypeB || item.otherPlantTypeB, item.plantNumberB, item.rowPlotSizeB, item.testDesignPlotTypeB],
        [item.plantTypeC || item.otherPlantTypeC, item.plantNumberC, item.rowPlotSizeC, item.testDesignPlotTypeC],
        [item.plantTypeD || item.otherPlantTypeD, item.plantNumberD, item.rowPlotSizeD, item.testDesignPlotTypeD],
      ]) {
        if (pn) {
          children.push(numbered(`3.4.${count34++}`, L.EXAMINATION_23.replace('{0}', td || '').replace('{1}', pn).replace('{2}', pt || '').replace('{3}', rs || '')));
          children.push(emptyPara());
        }
      }
    } else {
      const plantType = item.plantType || item.otherPlantType || '';
      const prefix = singleProp ? '\t' : `3.4.${count34++}\t`;

      if (item.propogationMethod && item.propogationMethod.toLowerCase() !== 'undefined') {
        const sentence = L.EXAMINATION_29.replace('{0}', item.propogationMethod);
        if (item.plotDesign?.toLowerCase() === 'singleplot' && item.plantNumber) {
          children.push(para(`${prefix}${sentence}, ${L.EACH} ${L.EXAMINATION_21.replace('{0}', item.plantNumber).replace('{1}', plantType)}`));
        } else if (item.plotDesign?.toLowerCase() === 'onerepplot' && item.plantNumber) {
          children.push(para(`${prefix}${sentence}, ${L.EACH} ${L.EXAMINATION_22.replace('{0}', item.plantNumber).replace('{1}', plantType).replace('{2}', item.replicatenum || '')}`));
        } else {
          children.push(para(`${prefix}${sentence}`));
        }
        children.push(emptyPara());
      }
    }
  }

  if (isPlantRemoval) {
    const mushPart = ex.isMushroom === 'N' ? L.EXAMINATION_24 : L.EXAMINATION_25;
    children.push(singleProp
      ? para(`\t${L.EXAMINATION_26.replace('{0}', mushPart)}`)
      : numbered(`3.4.${count34++}`, L.EXAMINATION_26.replace('{0}', mushPart))
    );
    children.push(emptyPara());
  }

  if (isTestDesignAddInfo) {
    children.push(singleProp
      ? para(`\t${ex.testDesignAddInfo}`)
      : numbered(`3.4.${count34}`, ex.testDesignAddInfo)
    );
    children.push(emptyPara());
  }

  children.push(heading2(L.EXAMINATION_27));
  children.push(para(`\t${L.EXAMINATION_28}`));
  children.push(emptyPara());
  return children;
}

function buildSection4(s4) {
  const { assessment: a, plantMethods, labels: L } = s4;
  const children = [heading1(s4.heading)];

  // 4.1 Distinctness
  children.push(heading2(L.ASSESSEMENT_2));
  children.push(heading2(L.ASSESSEMENT_3));
  children.push(numbered('4.1.1', L.ASSESSEMENT_4));

  if (a.IsHybridParentFormula === 'Y') {
    children.push(numbered('4.1.2', L.ASSESSEMENT_5));
    children.push(para(`\t${L.ASSESSEMENT_6}`));
    children.push(para(`\t${L.ASSESSEMENT_7}`));
    children.push(para(`\t${L.ASSESSEMENT_8}`));
    children.push(para(`\t${L.ASSESSEMENT_9}`));
    children.push(numbered('4.1.3', L.ASSESSEMENT_10));
  }

  if (a.DistinctnessHybridAddInfo) {
    children.push(para(a.DistinctnessHybridAddInfo));
  }

  children.push(heading2(L.ASSESSEMENT_11));
  children.push(para(`\t${L.ASSESSEMENT_12}`));
  children.push(heading2(L.ASSESSEMENT_13));
  children.push(para(`\t${L.ASSESSEMENT_14}`));

  // Distinctness observation section
  const isMushroom = String(a.IsMushroom || '').toUpperCase() !== 'Y';
  const objLabel = isMushroom ? L.ASSESSEMENT_15 : L.ASSESSEMENT_16;
  const numLabel = isMushroom ? L.ASSESSEMENT_17 : L.ASSESSEMENT_17;

  children.push(heading2(objLabel));

  // Number of plants to examine
  if (a.SinglePlant || a.PartsPlant) {
    const pl = isMushroom ? L.ASSESSEMENT_18 : L.ASSESSEMENT_19;
    children.push(para(`\t${numLabel.replace('{0}', pl)}`));
    if (a.SinglePlant) {
      const sent = isMushroom
        ? L.ASSESSEMENT_22.replace('{0}', a.SinglePlant).replace('{1}', a.SinglePlant)
        : L.ASSESSEMENT_22_1.replace('{0}', a.SinglePlant).replace('{1}', a.SinglePlant);
      children.push(para(`\t${sent}`));
    }
    if (a.PartsPlant) {
      const sent = isMushroom
        ? L.ASSESSEMENT_23.replace('{0}', a.PartsPlant)
        : L.ASSESSEMENT_23_1.replace('{0}', a.PartsPlant);
      children.push(para(`\t${sent}`));
    }
  }

  if (a.DistinctnessAddInfo) {
    children.push(para(a.DistinctnessAddInfo));
  }

  // Method of Observation
  children.push(heading2(L.ASSESSEMENT_28));
  children.push(para(`\t${L.ASSESSEMENT_29}`));
  children.push(para(`\t${isMushroom ? L.ASSESSEMENT_30 : L.ASSESSEMENT_30_1}`));
  children.push(para(`\t${isMushroom ? L.ASSESSEMENT_31 : L.ASSESSEMENT_31_1}`));
  children.push(para(`\t${isMushroom ? L.ASSESSEMENT_32 : L.ASSESSEMENT_32_1}`));
  children.push(para(`\t${isMushroom ? L.ASSESSEMENT_33 : L.ASSESSEMENT_33_1}`));
  children.push(para(`\t${L.ASSESSEMENT_34}`));
  children.push(para(`\t${L.ASSESSEMENT_35}`));
  children.push(para(`\t${isMushroom ? L.ASSESSEMENT_36 : L.ASSESSEMENT_36_1}`));
  children.push(para(`\t${isMushroom ? L.ASSESSEMENT_39 : L.ASSESSEMENT_39_1}`));
  children.push(para(`\t${L.ASSESSEMENT_40}`));

  // 4.2 Uniformity
  children.push(heading2(L.ASSESSEMENT_41));
  children.push(para(`\t${L.ASSESSEMENT_42}`));

  if (a.typeOfPropagation) {
    children.push(para(`\t${L.ASSESSEMENT_43.replace('{0}', a.typeOfPropagation)}`));
  }

  if (a.CrossPolinattedVarieties === 'Y') {
    children.push(para(`\t${L.ASSESSEMENT_44}`));
  }

  if (a.IsHybridVariety === 'Y') {
    children.push(para(`\t${L.ASSESSEMENT_46}`));
    if (a.IsParentLineAssessed === 'Y') {
      children.push(para(`\t${L.ASSESSEMENT_47}`));
    }
  }

  // Uniformity assessment details for plant methods
  for (const pm of plantMethods) {
    const pm_method = pm.PropogationMethod || pm.propogationMethod || '';
    if (a.PopulationStandard && a.AcceptanceProbability && a.PlantSampleSize) {
      const offType = parseInt(a.OffType || '0');
      const offLabel = offType === 1 ? L.ASSESSEMENT_48 : L.ASSESSEMENT_49;
      children.push(para(`\t${L.ASSESSEMENT_50
        .replace('{0}', pm_method || s4.extraLabels.PLANT)
        .replace('{1}', a.PopulationStandard)
        .replace('{2}', a.AcceptanceProbability)
        .replace('{3}', a.PlantSampleSize)
        .replace('{4}', isMushroom ? L.ASSESSEMENT_20 : L.ASSESSEMENT_21)
        .replace('{5}', offType)
        .replace('{6}', offLabel)
        .replace('{7}', a.UniformityOfftypeAllPlantsAddSentence || '')}`));
    }
  }

  if (a.UniformityAddInfo) {
    children.push(para(a.UniformityAddInfo));
  }

  // 4.3 Stability
  children.push(heading2(L.ASSESSEMENT_57));
  children.push(para(`\t${L.ASSESSEMENT_58}`));

  const stabLabel = isMushroom ? L.ASSESSEMENT_61 : (a.typeOfPropagation?.includes('seed') ? L.ASSESSEMENT_60 : L.ASSESSEMENT_61);
  children.push(para(`\t${stabLabel}`));

  if (a.IsHybridVariety === 'Y') {
    children.push(para(`\t${L.ASSESSEMENT_62}`));
  }

  if (a.StabilityAddInfo) {
    children.push(para(a.StabilityAddInfo));
  }

  children.push(emptyPara(), emptyPara());
  return children;
}

function buildSection5(s5) {
  const children = [
    heading1(s5.heading),
    numbered('5.1', s5.para5_1),
    emptyPara(),
    numbered('5.2', s5.para5_2),
    emptyPara(),
    numbered('5.3', s5.para5_3),
    emptyPara(),
  ];

  for (const ch of s5.characteristics) {
    const rowNum = ch.rowNumber || '';
    const tocName = ch.tocName || '';
    const order = ch.characteristicOrder || '';
    const groupingText = ch.groupingText || '';
    children.push(para(`(${rowNum})\t${tocName} (${s5.characteristicLabel} ${order}) ${groupingText}`));
  }

  for (const txt of s5.groupingSummaryTexts) {
    children.push(emptyPara());
    children.push(para(txt));
  }

  children.push(emptyPara());
  children.push(numbered('5.4', s5.para5_4));
  children.push(emptyPara(), emptyPara());
  return children;
}

function buildSection6(s6) {
  const L = s6.labels;
  const children = [
    heading1(s6.heading),
    heading2(L.CHARAINTRO_2),
    numbered('6.1.1', L.CHARAINTRO_3),
    para(`\t${L.CHARAINTRO_4}`),
    emptyPara(),
    numbered('6.1.2', L.CHARAINTRO_5),
    para(`\t${L.CHARAINTRO_6}`),
    emptyPara(),
    heading2(L.CHARAINTRO_7),
    numbered('6.2.1', L.CHARAINTRO_8),
    emptyPara(),
    numbered('6.2.2', L.CHARAINTRO_9),
    emptyPara(),
    numbered('6.2.3', L.CHARAINTRO_10),
    emptyPara(),
    heading2(L.CHARAINTRO_11),
    para(`\t${L.CHARAINTRO_12}`),
    emptyPara(),
    heading2(L.CHARAINTRO_13),
    para(`\t${L.CHARAINTRO_14}`),
    emptyPara(),
  ];

  if (s6.exampleVarietyText) {
    children.push(para(s6.exampleVarietyText));
    children.push(emptyPara());
  }

  // 6.5 Legend
  children.push(heading2(L.CHARAINTRO_25));

  // Simplified legend table
  const legendHeader = new TableRow({
    children: ['', 'English', 'français', 'deutsch', 'español', 'Example Varieties\nExemples\nBeispielssorten\nVariedades ejemplo', 'Note/\nNota'].map(h =>
      new TableCell({ children: [para([text(h, { italics: true, size: 16 })])] })
    ),
    tableHeader: true,
  });
  children.push(new Table({
    rows: [legendHeader],
    width: { size: 100, type: WidthType.PERCENTAGE },
  }));

  children.push(emptyPara());
  children.push(para(`1\t${L.CHARAINTRO_15}`));
  children.push(emptyPara());
  children.push(para(`2\t(*)\t\t${L.CHARAINTRO_16}\t– ${L.CHARAINTRO_17} 6.1.2`));
  children.push(emptyPara());
  children.push(para(`3\t${L.CHARAINTRO_18}`));
  children.push(para(`\tQL\t\t${L.CHARAINTRO_19}\t– ${L.CHARAINTRO_17} 6.3`));
  children.push(para(`\tQN\t\t${L.CHARAINTRO_20}\t– ${L.CHARAINTRO_17} 6.3`));
  children.push(para(`\tPQ\t\t${L.CHARAINTRO_21}\t– ${L.CHARAINTRO_17} 6.3`));
  children.push(emptyPara());
  children.push(para(`4\t${L.CHARAINTRO_22}`));
  children.push(para(`\tMG, MS, VG, VS\t– ${L.CHARAINTRO_17} 4.1.5`));
  children.push(emptyPara());
  children.push(para(`5\t(+)\t\t${L.CHARAINTRO_23} 8.2`));
  children.push(emptyPara());

  // Indication label
  if (s6.maxIndicationLabel == null) {
    children.push(para(`6\t${s6.notApplicable}`));
  } else {
    const range = s6.maxIndicationLabel === 'a' ? '(a)' : `(a)-(${s6.maxIndicationLabel})`;
    children.push(para(`6\t${range}\t\t${L.CHARAINTRO_23} 8.1`));
  }

  children.push(emptyPara());
  children.push(
    s6.growthStage
      ? para(`7\t${L.CHARAINTRO_24}\t\t${L.CHARAINTRO_23} 8.3`)
      : para(`7\t${s6.notApplicable}`)
  );

  if (s6.characteristicLegend) {
    children.push(emptyPara());
    children.push(para(s6.characteristicLegend));
  }

  children.push(emptyPara(), emptyPara());
  return children;
}

function buildSection7(s7) {
  const children = [heading1(s7.heading)];

  const headerRow = new TableRow({
    children: s7.tableHeaders.map(h =>
      new TableCell({ children: [para([text(h, { size: 16 })])] })
    ),
    tableHeader: true,
  });

  const dataRows = [];
  let seqNum = 1;

  for (const tocGroup of s7.characteristics) {
    const first = tocGroup[0];

    // Grey header row for this characteristic
    const greyRow = new TableRow({
      children: [
        greyCell(`${seqNum++}.`),
        greyCell(first.asterisk === 'Y' ? '(*)' : ''),
        greyCell(first.expressionType || ''),
        greyCell((first.observationMPlotT || '').replace(/#/g, '/')),
        greyCell(parseInt(first.indivFlag || '0') !== 0 ? '(+)' : ''),
        greyCell(first.fullIND || ''),
        greyCell(first.growthStages || ''),
      ],
    });
    dataRows.push(greyRow);

    // Name row
    dataRows.push(new TableRow({
      children: [
        new TableCell({ children: [emptyPara()] }),
        new TableCell({ children: [para([text(first.tocName || '', { bold: true, size: 16 })])] }),
        new TableCell({ children: [para([text(first.charFR || '', { bold: true, size: 16 })])] }),
        new TableCell({ children: [para([text(first.charDE || '', { bold: true, size: 16 })])] }),
        new TableCell({ children: [para([text(first.charES || '', { bold: true, size: 16 })])] }),
        new TableCell({ children: [emptyPara()] }),
        new TableCell({ children: [emptyPara()] }),
      ],
    }));

    // Expression rows
    for (const item of tocGroup) {
      const noteDisplay = item.notes === '999' || item.notes === '0' ? '' : (item.notes || '');
      dataRows.push(new TableRow({
        children: [
          new TableCell({ children: [emptyPara()] }),
          new TableCell({ children: [para([text(item.expEN || '', { size: 16 })])] }),
          new TableCell({ children: [para([text(item.expFR || '', { size: 16 })])] }),
          new TableCell({ children: [para([text(item.expDE || '', { size: 16 })])] }),
          new TableCell({ children: [para([text(item.expES || '', { size: 16 })])] }),
          new TableCell({ children: [para([text((item.orderedExampleVarieties || '').replace(/,/g, ', '), { size: 16 })])] }),
          new TableCell({ children: [para([text(noteDisplay, { size: 16 })])] }),
        ],
      }));
    }
  }

  children.push(new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  }));

  children.push(emptyPara(), emptyPara());
  return children;
}

function buildSection8(s8) {
  const children = [heading1(s8.heading)];

  if (s8.numMultiple > 0) {
    if (s8.generalExplanation) {
      children.push(para(s8.generalExplanation));
      children.push(emptyPara());
    }
    children.push(heading2(s8.severalCharsHeading));
    children.push(para(s8.severalCharsIntro));
    children.push(emptyPara());
    for (const item of s8.severalChars) {
      children.push(para(`(${item.indicationLabel})\t${item.labelExplanation}`));
      children.push(emptyPara());
    }
  }

  children.push(heading2(s8.individualCharsHeading));
  for (const item of s8.tocChars) {
    children.push(para([text(`${item.characteristicOrder}. ${item.tocName}`, { bold: true })]));
    children.push(para(item.explanationText));
    children.push(emptyPara());
  }

  if (s8.additionalCharReferences.length > 0) {
    children.push(heading2(s8.additionalExplanationsHeading));
    for (const ref of s8.additionalCharReferences) {
      children.push(para(ref));
    }
  }

  children.push(emptyPara(), emptyPara());
  return children;
}

function buildSection9(s9) {
  const children = [heading1(s9.heading)];
  for (const entry of s9.entries) {
    if (entry.literatureReferences) {
      children.push(para(entry.literatureReferences));
      children.push(emptyPara());
    }
  }
  children.push(emptyPara());
  return children;
}

function buildSection10(s10) {
  const L = s10.labels;
  const PL = s10.propLabels;
  const ML = s10.miscLabels;
  const tq = s10.tq;
  const children = [heading1(s10.heading)];

  // TQ cover info
  children.push(para([text(L.TQ_7, { bold: true })]));
  children.push(para(`${L.TQ_8}:`));
  children.push(para(`${L.TQ_9}:`));
  children.push(emptyPara());

  children.push(para([text(L.TQ_10, { bold: true })]));
  children.push(para(`${L.TQ_11}:`));
  children.push(para(`${L.TQ_12}:`));
  children.push(para(`${L.TQ_13}:`));
  children.push(para(`${L.TQ_14}:`));
  children.push(emptyPara());

  children.push(para(`${L.TQ_15}:`));
  children.push(emptyPara());
  children.push(para([text(L.TQ_16, { bold: true })]));
  children.push(para(`${L.TQ_17}:`));
  children.push(para(`${L.TQ_18}:`));
  children.push(emptyPara());

  // Section: Subjects
  children.push(para([text(L.TQ_7, { bold: true })]));
  for (const subj of s10.subjects) {
    children.push(para(`${L.TQ_8}: ${subj.botanicalName}`));
    children.push(para(`${L.TQ_9}: ${subj.commonName}`));
    if (subj.additionalInfo) {
      children.push(para(subj.additionalInfo));
    }
    children.push(emptyPara());
  }

  // Breeding scheme
  children.push(para([text(L.TQ_19, { bold: true })]));
  children.push(para([text(L.TQ_20, { bold: true })]));
  children.push(para(`${L.TQ_21}:`));
  children.push(para(`\t${L.TQ_22}`)); // controlled cross

  if (tq.TqHybridVariety === 'Y') {
    children.push(para(`\t${L.TQ_34}`));
  }

  if (s10.breedingSchemes.length > 0) {
    const bsRows = s10.breedingSchemes.map(bs =>
      new TableRow({
        children: [
          new TableCell({ children: [para(bs.methodDesc || '')] }),
          new TableCell({ children: [para(bs.otherDetails || '')] }),
        ],
      })
    );
    children.push(new Table({ rows: bsRows, width: { size: 80, type: WidthType.PERCENTAGE } }));
  }

  // Propagation methods
  children.push(emptyPara());
  children.push(para([text(L.TQ_33, { bold: true })]));
  for (const pv of s10.propVarieties) {
    const label = PL[pv.propagationMethodId] || pv.propagationMethodId || '';
    children.push(para(`\t${pv.rowNumber || ''}\t${label} ${pv.otherDetails || ''}`));
  }

  // Table of characteristics
  children.push(emptyPara());
  children.push(para([text(L.TQ_37, { bold: true })]));

  if (s10.tableOfChars.length > 0) {
    const headerRow = new TableRow({
      children: [L.TQ_38, L.TQ_39, L.TQ_40].map(h =>
        new TableCell({ children: [para([text(h, { bold: true })])] })
      ),
      tableHeader: true,
    });

    const dataRows = s10.tableOfChars.map(ch =>
      new TableRow({
        children: [
          new TableCell({ children: [para([text(ch.existingSeqNumber ? String(ch.existingSeqNumber) : '', { size: 16 }), text(` ${ch.name || ''}`, { size: 16 })])] }),
          new TableCell({ children: [para([text(ch.exampleVarieties || '', { size: 16 })])] }),
          new TableCell({ children: [para([text(ch.expressionNotes || '', { size: 16 })])] }),
        ],
      })
    );

    children.push(new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }));
  }

  // Similar varieties
  children.push(emptyPara());
  children.push(para([text(L.TQ_41, { bold: true })]));
  children.push(para(L.TQ_42));
  children.push(emptyPara());

  const similarTable = new Table({
    rows: [
      new TableRow({
        children: [L.TQ_43, L.TQ_44, L.TQ_45, L.TQ_46].map(h =>
          new TableCell({ children: [para([text(h, { bold: true })])] })
        ),
        tableHeader: true,
      }),
      new TableRow({
        children: ['', '', '', ''].map(v =>
          new TableCell({ children: [para(v)] })
        ),
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
  children.push(similarTable);

  // Additional info / questionnaire fields
  children.push(emptyPara());
  children.push(para([text(L.TQ_48, { bold: true })]));
  children.push(para(L.TQ_49));

  if (tq.DiffCharacteristic) {
    children.push(para(tq.DiffCharacteristic));
  }

  children.push(emptyPara());
  children.push(para(L.TQ_51));
  children.push(emptyPara());
  children.push(para(L.TQ_52));

  // Color image
  if (tq.IsTqColorImage === 'Y') {
    children.push(para([text(L.TQ_73, { italics: true })]));
    children.push(para(L.TQ_74));
    children.push(para(`• ${L.TQ_75}`));
    children.push(para(`• ${L.TQ_76}`));
    children.push(para(`• ${L.TQ_77}`));
  }

  // Virus / Pathogens
  children.push(emptyPara());
  children.push(para([text(L.TQ_57, { bold: true })]));
  children.push(para(L.TQ_58));
  children.push(para(L.TQ_59));
  children.push(para(`${L.TQ_60}:\t${ML.YES} / ${ML.NO}`));
  children.push(para(`${L.TQ_61}:\t${ML.YES} / ${ML.NO}`));
  children.push(para(`${L.TQ_62}:\t${ML.YES} / ${ML.NO}`));
  children.push(para(`${L.TQ_63}:\t${ML.YES} / ${ML.NO}`));
  children.push(para(L.TQ_64));
  children.push(emptyPara());
  children.push(para(`${L.TQ_65}:\t${ML.YES} / ${ML.NO}`));
  children.push(emptyPara());

  // Declaration
  children.push(para(L.TQ_68));
  children.push(para(`${L.TQ_69}:`));
  children.push(para(`${L.TQ_70}:`));
  children.push(para(`${L.TQ_71}:`));
  children.push(emptyPara());
  children.push(para([text(L.TQ_72, { bold: true })]));

  children.push(emptyPara(), emptyPara());
  return children;
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

export async function buildDocx(model) {
  const { meta, sections, annexes } = model;

  const allChildren = [
    ...buildCoverSection(model),
    ...buildSection1(sections.s1),
    ...buildSection2(sections.s2),
    ...buildSection3(sections.s3),
    ...buildSection4(sections.s4),
    ...buildSection5(sections.s5),
    ...buildSection6(sections.s6),
    ...buildSection7(sections.s7),
    ...buildSection8(sections.s8),
    ...buildSection9(sections.s9),
    ...buildSection10(sections.s10),
  ];

  // Annexes
  for (const annexText of annexes) {
    allChildren.push(new Paragraph({ children: [new PageBreak()] }));
    allChildren.push(para([text('Annex', { underline: {}, size: 20 })]));
    allChildren.push(emptyPara());
    allChildren.push(para(annexText));
  }

  const doc = new Document({
    title: meta.tgReference,
    description: `TG Document for ${meta.tgReference}`,
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 910, right: 910 },
          },
        },
        headers: {
          default: new Header({
            children: [
              para([
                text(meta.tgReference, { bold: true }),
                new Tab(),
                text(meta.mainCommonName),
                new Tab(),
                text(meta.headerDate),
              ]),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [para([text(model.firstPageFooter, { size: 16 })])],
          }),
        },
        children: allChildren,
      },
    ],
  });

  return Packer.toBuffer(doc);
}