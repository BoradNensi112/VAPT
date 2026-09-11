import ExcelJS from 'exceljs';

const BORDER_STYLE = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

const HAIR_BORDER_STYLE = {
  top: { style: 'hair', color: { argb: 'FF000000' } },
  left: { style: 'hair', color: { argb: 'FF000000' } },
  bottom: { style: 'hair', color: { argb: 'FF000000' } },
  right: { style: 'hair', color: { argb: 'FF000000' } }
};

// Exact colors from E:/VAPT/Report Draft.xlsx
const GREEN_BG = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFB6D7A8' } // Exact draft green
};

const BLUE_HEADER_BG = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFA4C2F4' } // Exact draft header blue
};

const SEVERITY_ORDER = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3
};

const formatDate = (val) => {
  if (!val) return new Date().toLocaleDateString('en-GB');
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

export async function generateVaptExcelReport({
  project = {},
  findings = [],
  remarks = [],
  retestFindings = [],
  assessmentDate = null
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BISAG-N (MeitY) VAPT Security Team';
  workbook.lastModifiedBy = 'CyberShield VAPT System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Sheet1', {
    views: [{ showGridLines: true }]
  });

  worksheet.columns = [
    { width: 8 },   // A: S.No
    { width: 34 },  // B: Vulnerability Name
    { width: 44 },  // C: Description
    { width: 44 },  // D: Step to reproduce
    { width: 44 },  // E: Remediation
    { width: 14 },  // F: Severity
    { width: 30 },  // G: Reference
    { width: 26 },  // H: OWASP Category – CWE number
    { width: 36 }   // I: CWE Reference
  ];

  // Rows 2-5: Merged A2:C5 Title block matching Report Draft.xlsx
  worksheet.mergeCells('A2:C5');
  const titleCell = worksheet.getCell('A2');
  titleCell.value = 'Manual Testing Report (VAPT)';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  
  for (let r = 2; r <= 5; r++) {
    worksheet.getRow(r).height = 18;
    for (let c = 1; c <= 3; c++) {
      worksheet.getRow(r).getCell(c).border = BORDER_STYLE;
    }
  }

  const dateStr = formatDate(assessmentDate || project.assessmentDate || project.created_at);
  const projectName = project.projectName || project.project_name || 'VAPT Assessment Target';
  const targetUrl = project.projectUrl || project.target_url || 'http://target.gov.in';
  const department = project.department || 'Software';
  const analysts = Array.isArray(project.analysts)
    ? project.analysts.join(', ')
    : project.security_analysts || 'Ankit Nandaniya';

  // Format Concern Project Manager (Right: "Concern Project Manager: Shri ...")
  let concernPm = project.concernProjectManager || '';
  if (!concernPm) {
    concernPm = 'Concern Project Manager: Shri ';
  } else if (!concernPm.startsWith('Concern Project Manager:')) {
    concernPm = concernPm.startsWith('Shri ')
      ? `Concern Project Manager: ${concernPm}`
      : `Concern Project Manager: Shri ${concernPm}`;
  }

  // Format Concern Additional Director (Right: "Concern Additional Director: Shri ...")
  let concernDirector = project.concernDirector || project.ciso_name || '';
  if (!concernDirector) {
    concernDirector = 'Concern Additional Director: Shri ';
  } else if (!concernDirector.startsWith('Concern Additional Director:')) {
    concernDirector = concernDirector.startsWith('Shri ')
      ? `Concern Additional Director: ${concernDirector}`
      : `Concern Additional Director: Shri ${concernDirector}`;
  }

  // Helper function for applying green metadata rows with exact draft styling
  const applyGreenRow = (rowNumber, leftMerge, leftText, rightMerge = null, rightText = null) => {
    worksheet.mergeCells(leftMerge);
    const leftCell = worksheet.getCell(leftMerge.split(':')[0]);
    leftCell.value = leftText;
    leftCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    leftCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF000000' } };

    if (rightMerge && rightText !== null) {
      worksheet.mergeCells(rightMerge);
      const rightCell = worksheet.getCell(rightMerge.split(':')[0]);
      rightCell.value = rightText;
      rightCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      rightCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF000000' } };
    }

    for (let col = 1; col <= 9; col++) {
      const cell = worksheet.getRow(rowNumber).getCell(col);
      cell.fill = GREEN_BG;
      cell.border = BORDER_STYLE;
    }
    worksheet.getRow(rowNumber).height = 22;
  };

  // Row 8: Left: Project Name & Department | Right: Date: DD/MM/YYYY
  applyGreenRow(
    8,
    'A8:E8',
    `Project Name: ${projectName}    Department: ${department}`,
    'F8:I8',
    `Date: ${dateStr}`
  );

  // Row 9: URL: ...
  const urlLabel = targetUrl.toLowerCase().endsWith('.apk') ? 'APK' : 'URL';
  applyGreenRow(9, 'A9:I9', `${urlLabel}: ${targetUrl}`);

  // Row 10: Left: Security Analyst: ... | Right: Concern Project Manager: Shri ...
  applyGreenRow(
    10,
    'A10:E10',
    `Security Analyst: ${analysts}`,
    'F10:I10',
    concernPm
  );

  // Row 11: Concern Additional Director: Shri ... (Row 11 Left PM and Row 12 CISO removed per user request)
  applyGreenRow(
    11,
    'A11:I11',
    concernDirector
  );

  // Row 14: Findings Headers (Blue Header #A4C2F4)
  const headerRowIdx = 14;
  const headers = [
    'S.No',
    'Vulnerability Name',
    'Description',
    'Step to reproduce',
    'Remediation',
    'Severity',
    'Reference',
    'OWASP Category – CWE number',
    'CWE Reference'
  ];

  const headerRow = worksheet.getRow(headerRowIdx);
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.fill = BLUE_HEADER_BG;
    cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF000000' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER_STYLE;
  });
  headerRow.height = 28;

  // Rows 15+: Findings
  let currentRowIdx = 15;
  const sortedFindings = [...findings].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.reportSeverity || a.severity] ?? 99) -
      (SEVERITY_ORDER[b.reportSeverity || b.severity] ?? 99)
  );

  sortedFindings.forEach((f, idx) => {
    const row = worksheet.getRow(currentRowIdx);
    const stepsFormatted = (f.steps_to_reproduce || f.steps || '').replaceAll(
      '$$',
      targetUrl.trim()
    );

    // Col 1: S.No
    const c1 = row.getCell(1);
    c1.value = idx + 1;
    c1.alignment = { vertical: 'center', horizontal: 'center' };

    // Col 2: Vulnerability Name
    const c2 = row.getCell(2);
    c2.value = f.vulnerability_name || f.name || 'Security Finding';
    c2.alignment = { vertical: 'center', horizontal: 'center', wrapText: true };

    // Col 3: Description
    const c3 = row.getCell(3);
    c3.value = f.description || f.desc || '';
    c3.alignment = { vertical: 'center', horizontal: 'left', wrapText: true };

    // Col 4: Step to reproduce
    const c4 = row.getCell(4);
    c4.value = stepsFormatted;
    c4.alignment = { vertical: 'center', horizontal: 'left', wrapText: true };

    // Col 5: Remediation
    const c5 = row.getCell(5);
    c5.value = f.remediation || '';
    c5.alignment = { vertical: 'center', horizontal: 'left', wrapText: true };

    // Col 6: Severity
    const c6 = row.getCell(6);
    c6.value = f.reportSeverity || f.severity || 'Medium';
    c6.alignment = { vertical: 'center', horizontal: 'center' };

    // Col 7: Reference (Clickable Hyperlink)
    const c7 = row.getCell(7);
    const refText = f.reference || f.name || f.vulnerability_name || 'OWASP / CWE';
    const refUrl = f.reference_url || f.cwe_url || f.cwe_ref_url;
    if (refUrl) {
      c7.value = { text: refText, hyperlink: refUrl };
      c7.font = { name: 'Times New Roman', size: 10, color: { argb: 'FF0000FF' }, underline: true };
    } else {
      c7.value = refText;
    }
    c7.alignment = { vertical: 'center', horizontal: 'center', wrapText: true };

    // Col 8: OWASP Category
    const c8 = row.getCell(8);
    c8.value = f.owasp_category || f.owasp || 'A03:2021-Injection';
    c8.alignment = { vertical: 'center', horizontal: 'center', wrapText: true };

    // Col 9: CWE Reference (Clickable Hyperlink)
    const c9 = row.getCell(9);
    const cweText = f.cwe_number || f.cwe_ref || 'CWE-79';
    const cweUrl = f.cwe_url || f.cwe_ref_url || (cweText.includes('CWE') ? `https://cwe.mitre.org/data/definitions/${cweText.replace(/\D/g, '')}.html` : 'https://cwe.mitre.org');
    c9.value = { text: cweText, hyperlink: cweUrl };
    c9.font = { name: 'Times New Roman', size: 10, color: { argb: 'FF0000FF' }, underline: true };
    c9.alignment = { vertical: 'center', horizontal: 'center', wrapText: true };

    for (let col = 1; col <= 9; col++) {
      const c = row.getCell(col);
      c.border = BORDER_STYLE;
      if (!c.font || !c.font.color) {
        c.font = { name: 'Times New Roman', size: 10 };
      }
    }

    row.height = 75;
    currentRowIdx++;
  });

  if (sortedFindings.length === 0) {
    const row = worksheet.getRow(currentRowIdx);
    row.getCell(1).value = 'No vulnerabilities reported for this assessment target.';
    worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(1).font = { name: 'Times New Roman', size: 10, italic: true };
    for (let col = 1; col <= 9; col++) worksheet.getRow(currentRowIdx).getCell(col).border = BORDER_STYLE;
    row.height = 30;
    currentRowIdx++;
  }

  // Row for Form No.
  currentRowIdx += 1;
  worksheet.getCell(`A${currentRowIdx}`).value = 'Form No. BISAG-SD/FR-207/201';
  worksheet.getCell(`A${currentRowIdx}`).font = { name: 'Times New Roman', size: 8, italic: true };
  currentRowIdx += 2;

  // Remarks Section
  worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
  const remarksHeaderCell = worksheet.getCell(`A${currentRowIdx}`);
  remarksHeaderCell.value = 'Remarks:';
  remarksHeaderCell.fill = GREEN_BG;
  remarksHeaderCell.font = { name: 'Times New Roman', size: 10, bold: true };
  remarksHeaderCell.border = BORDER_STYLE;
  for (let c = 1; c <= 9; c++) worksheet.getRow(currentRowIdx).getCell(c).border = BORDER_STYLE;
  worksheet.getRow(currentRowIdx).height = 24;
  currentRowIdx++;

  worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
  const remarksContentCell = worksheet.getCell(`A${currentRowIdx}`);
  const remarkText = Array.isArray(remarks) && remarks.length > 0
    ? remarks.map((r, i) => `${i + 1}. ${r}`).join('\n')
    : project.remarks || '1. Functional Bugs are attached to in the Findings folder Under !';
  remarksContentCell.value = remarkText;
  remarksContentCell.font = { name: 'Times New Roman', size: 9 };
  remarksContentCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  for (let c = 1; c <= 9; c++) worksheet.getRow(currentRowIdx).getCell(c).border = BORDER_STYLE;
  worksheet.getRow(currentRowIdx).height = Math.max(45, (remarkText.split('\n').length || 1) * 20);
  currentRowIdx += 2;

  // Last Reported Vulnerabilities Status Section (Retest Table)
  const retestList = Array.isArray(retestFindings) && retestFindings.length > 0
    ? retestFindings
    : sortedFindings;

  if (retestList.length > 0) {
    worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
    const statusHeaderCell = worksheet.getCell(`A${currentRowIdx}`);
    statusHeaderCell.value = `According to Last Reported Vulnerabilities on Date: ${dateStr}`;
    statusHeaderCell.fill = GREEN_BG;
    statusHeaderCell.font = { name: 'Times New Roman', size: 10, bold: true };
    statusHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
    for (let c = 1; c <= 9; c++) worksheet.getRow(currentRowIdx).getCell(c).border = BORDER_STYLE;
    worksheet.getRow(currentRowIdx).height = 24;
    currentRowIdx++;

    // Subheader: No | Vulnerability Name | Status
    worksheet.getCell(`B${currentRowIdx}`).value = 'No';
    worksheet.getCell(`B${currentRowIdx}`).font = { name: 'Times New Roman', size: 10, bold: true };
    worksheet.getCell(`B${currentRowIdx}`).border = BORDER_STYLE;
    worksheet.getCell(`B${currentRowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells(`C${currentRowIdx}:E${currentRowIdx}`);
    const vulnHeader = worksheet.getCell(`C${currentRowIdx}`);
    vulnHeader.value = 'Vulnerability Name';
    vulnHeader.font = { name: 'Times New Roman', size: 10, bold: true };
    vulnHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    ['C', 'D', 'E'].forEach((col) => (worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE));

    worksheet.mergeCells(`F${currentRowIdx}:G${currentRowIdx}`);
    const statusCol = worksheet.getCell(`F${currentRowIdx}`);
    statusCol.value = 'Status';
    statusCol.font = { name: 'Times New Roman', size: 10, bold: true };
    statusCol.alignment = { vertical: 'middle', horizontal: 'center' };
    ['F', 'G'].forEach((col) => (worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE));
    worksheet.getRow(currentRowIdx).height = 22;
    currentRowIdx++;

    // Items in Re-test Table
    retestList.forEach((f, idx) => {
      worksheet.getCell(`B${currentRowIdx}`).value = idx + 1;
      worksheet.getCell(`B${currentRowIdx}`).border = BORDER_STYLE;
      worksheet.getCell(`B${currentRowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getCell(`B${currentRowIdx}`).font = { name: 'Times New Roman', size: 9 };

      worksheet.mergeCells(`C${currentRowIdx}:E${currentRowIdx}`);
      const vCell = worksheet.getCell(`C${currentRowIdx}`);
      vCell.value = f.vulnerability_name || f.name || 'Security Finding';
      vCell.border = BORDER_STYLE;
      vCell.font = { name: 'Times New Roman', size: 9 };
      ['C', 'D', 'E'].forEach((col) => (worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE));

      worksheet.mergeCells(`F${currentRowIdx}:G${currentRowIdx}`);
      const sCell = worksheet.getCell(`F${currentRowIdx}`);
      sCell.value = f.status || 'Open';
      sCell.border = BORDER_STYLE;
      sCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sCell.font = {
        name: 'Times New Roman',
        size: 9,
        bold: true,
        color: { argb: (f.status || '').toLowerCase() === 'closed' ? 'FF10B981' : 'FFEF4444' }
      };
      ['F', 'G'].forEach((col) => (worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE));

      worksheet.getRow(currentRowIdx).height = 20;
      currentRowIdx++;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, projectName };
}

export async function downloadVaptExcelReport(options) {
  const { buffer, projectName } = await generateVaptExcelReport(options);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeProjectName =
    String(projectName || 'VAPT_Report')
      .trim()
      .replace(/[^a-z0-9-_]+/gi, '_') || 'VAPT_Report';
  const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  link.download = `${safeProjectName}-${todayStr}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
