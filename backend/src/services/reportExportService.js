const ExcelJS = require('exceljs');
const ProjectModel = require('../models/Project');
const FindingModel = require('../models/Finding');
const db = require('../config/db');

class ReportExportService {
  static async generateProjectExcel(projectId) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }

    const findings = await FindingModel.findByProjectId(projectId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BISAG-N (MeitY) VAPT Platform';
    workbook.lastModifiedBy = 'BISAG-N Security Team';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet('Sheet1', {
      views: [{ showGridLines: true }]
    });

    const BORDER_STYLE = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    const GREEN_BG = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC8E6C9' } // Official BISAG-N VAPT Green
    };

    const BLUE_HEADER_BG = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD0E1FD' } // Official BISAG-N VAPT Header Blue
    };

    worksheet.columns = [
      { width: 8 },   // A: S.No
      { width: 34 },  // B: Vulnerability Name
      { width: 44 },  // C: Description
      { width: 44 },  // D: Step to reproduce
      { width: 44 },  // E: Remediation
      { width: 14 },  // F: Severity
      { width: 30 },  // G: Reference
      { width: 22 },  // H: OWASP Category – CWE number
      { width: 36 }   // I: CWE Reference
    ];

    // Row 5: Title
    worksheet.mergeCells('B5:D5');
    const titleCell = worksheet.getCell('B5');
    titleCell.value = 'Manual Testing Report (VAPT)';
    titleCell.font = { name: 'Times New Roman', size: 11, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    ['B5', 'C5', 'D5'].forEach(cell => {
      worksheet.getCell(cell).border = BORDER_STYLE;
    });
    worksheet.getRow(5).height = 24;

    const dateStr = project.created_at ? new Date(project.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const projectName = project.project_name || 'VAPT Assessment Target';
    const targetUrl = project.target_url || 'http://target.gov.in';
    const analysts = project.security_analysts || 'Ankit Nandaniya';

    // Format Project Manager (Left: "Project Manager: ABCD, WXYZ")
    let pmLeft = project.project_managers || 'ABCD, WXYZ';
    if (!pmLeft.startsWith('Project Manager:')) {
      pmLeft = `Project Manager: ${pmLeft}`;
    }

    // Format Concern Project Manager (Right: "Concern Project Manager: Shri ...")
    let concernPm = 'Concern Project Manager: Shri ';
    if (project.project_managers && project.project_managers.includes('Concern Project Manager:')) {
      concernPm = project.project_managers;
    }

    // Format Concern Additional Director (Right: "Concern Additional Director: Shri ...")
    let concernDirector = 'Concern Additional Director: Shri ';
    if (project.ciso_name) {
      concernDirector = project.ciso_name.startsWith('Concern Additional Director:')
        ? project.ciso_name
        : project.ciso_name.startsWith('Shri ')
        ? `Concern Additional Director: ${project.ciso_name}`
        : `Concern Additional Director: Shri ${project.ciso_name}`;
    }

    // Format Additional Director cum CISO (Left: "Additional Director cum CISO: Shri ...")
    let cisoName = project.ciso_name || 'Shri ABCD';
    if (!cisoName.startsWith('Additional Director cum CISO:')) {
      cisoName = cisoName.startsWith('Shri ')
        ? `Additional Director cum CISO: ${cisoName}`
        : `Additional Director cum CISO: Shri ${cisoName}`;
    }

    // Helper to apply green rows
    const applyGreenRow = (rowNumber, leftMerge, leftText, rightMerge = null, rightText = null) => {
      worksheet.mergeCells(leftMerge);
      const leftCell = worksheet.getCell(leftMerge.split(':')[0]);
      leftCell.value = leftText;
      leftCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      leftCell.font = { name: 'Times New Roman', size: 10, bold: true };

      if (rightMerge && rightText !== null) {
        worksheet.mergeCells(rightMerge);
        const rightCell = worksheet.getCell(rightMerge.split(':')[0]);
        rightCell.value = rightText;
        rightCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        rightCell.font = { name: 'Times New Roman', size: 10, bold: true };
      }

      for (let col = 1; col <= 9; col++) {
        const cell = worksheet.getRow(rowNumber).getCell(col);
        cell.fill = GREEN_BG;
        cell.border = BORDER_STYLE;
        if (!cell.font) {
          cell.font = { name: 'Times New Roman', size: 10, bold: true };
        }
      }
      worksheet.getRow(rowNumber).height = 24;
    };

    // Row 8: Left: Project Name | Right: Date: 00/00/2026
    applyGreenRow(8, 'A8:C8', `Project Name: ${projectName}`, 'D8:I8', `Date: ${dateStr}`);

    // Row 9: URL: ...
    const urlLabel = targetUrl.toLowerCase().endsWith('.apk') ? 'APK' : 'URL';
    applyGreenRow(9, 'A9:I9', `${urlLabel}: ${targetUrl}`);

    // Row 10: Left: Security Analyst: ... | Right: Concern Project Manager: Shri ...
    applyGreenRow(10, 'A10:C10', `Security Analyst: ${analysts}`, 'D10:I10', concernPm);

    // Row 11: Left: Project Manager: ABCD, WXYZ | Right: Concern Additional Director: Shri ...
    applyGreenRow(11, 'A11:C11', pmLeft, 'D11:I11', concernDirector);

    // Row 12: Additional Director cum CISO: Shri ...
    applyGreenRow(12, 'A12:I12', cisoName);

    // Row 14: Findings Header (Blue Header)
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
      cell.font = { name: 'Times New Roman', size: 10, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = BORDER_STYLE;
    });
    headerRow.height = 28;

    // Rows 15+: Findings Data
    let currentRowIdx = 15;
    findings.forEach((f, idx) => {
      const row = worksheet.getRow(currentRowIdx);
      const stepsFormatted = (f.steps_to_reproduce || f.steps || '').replaceAll('$$', targetUrl.trim());

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

      // Col 4: Steps
      const c4 = row.getCell(4);
      c4.value = stepsFormatted;
      c4.alignment = { vertical: 'center', horizontal: 'left', wrapText: true };

      // Col 5: Remediation
      const c5 = row.getCell(5);
      c5.value = f.remediation || '';
      c5.alignment = { vertical: 'center', horizontal: 'left', wrapText: true };

      // Col 6: Severity
      const c6 = row.getCell(6);
      c6.value = f.severity || 'Medium';
      c6.alignment = { vertical: 'center', horizontal: 'center' };

      // Col 7: Reference
      const c7 = row.getCell(7);
      const refText = f.reference || f.vulnerability_name || 'OWASP / CWE';
      if (f.cwe_url) {
        c7.value = { text: refText, hyperlink: f.cwe_url };
        c7.font = { name: 'Times New Roman', size: 10, color: { argb: 'FF0000FF' }, underline: true };
      } else {
        c7.value = refText;
      }
      c7.alignment = { vertical: 'center', horizontal: 'center', wrapText: true };

      // Col 8: OWASP Category
      const c8 = row.getCell(8);
      c8.value = f.owasp_category || 'A03:2021-Injection';
      c8.alignment = { vertical: 'center', horizontal: 'center', wrapText: true };

      // Col 9: CWE Ref
      const c9 = row.getCell(9);
      const cweText = f.cwe_number || 'CWE-79';
      const cweUrl = f.cwe_url || (cweText.includes('CWE') ? `https://cwe.mitre.org/data/definitions/${cweText.replace(/\D/g, '')}.html` : 'https://cwe.mitre.org');
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

    if (findings.length === 0) {
      const row = worksheet.getRow(currentRowIdx);
      row.getCell(1).value = 'No vulnerabilities reported for this assessment target.';
      worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(1).font = { name: 'Times New Roman', size: 10, italic: true };
      for (let col = 1; col <= 9; col++) row.getCell(col).border = BORDER_STYLE;
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
    remarksContentCell.value = project.remarks || '1. Functional Bugs are attached to in the Findings folder Under !';
    remarksContentCell.font = { name: 'Times New Roman', size: 9 };
    remarksContentCell.border = BORDER_STYLE;
    for (let c = 1; c <= 9; c++) worksheet.getRow(currentRowIdx).getCell(c).border = BORDER_STYLE;
    worksheet.getRow(currentRowIdx).height = 45;
    currentRowIdx += 2;

    // Last Reported Vulnerabilities Status Section
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
    ['C', 'D', 'E'].forEach(col => worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE);

    worksheet.mergeCells(`F${currentRowIdx}:G${currentRowIdx}`);
    const statusCol = worksheet.getCell(`F${currentRowIdx}`);
    statusCol.value = 'Status';
    statusCol.font = { name: 'Times New Roman', size: 10, bold: true };
    statusCol.alignment = { vertical: 'middle', horizontal: 'center' };
    ['F', 'G'].forEach(col => worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE);
    worksheet.getRow(currentRowIdx).height = 22;
    currentRowIdx++;

    // Items list in Re-test Table
    findings.forEach((f, idx) => {
      worksheet.getCell(`B${currentRowIdx}`).value = idx + 1;
      worksheet.getCell(`B${currentRowIdx}`).border = BORDER_STYLE;
      worksheet.getCell(`B${currentRowIdx}`).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getCell(`B${currentRowIdx}`).font = { name: 'Times New Roman', size: 9 };

      worksheet.mergeCells(`C${currentRowIdx}:E${currentRowIdx}`);
      const vCell = worksheet.getCell(`C${currentRowIdx}`);
      vCell.value = f.vulnerability_name || f.name || 'Security Finding';
      vCell.border = BORDER_STYLE;
      vCell.font = { name: 'Times New Roman', size: 9 };
      ['C', 'D', 'E'].forEach(col => worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE);

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
      ['F', 'G'].forEach(col => worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE);

      worksheet.getRow(currentRowIdx).height = 20;
      currentRowIdx++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer, projectName };
  }

  static async getAnalytics(user) {
    // 1. Findings Stats
    const statsQuery = `
      SELECT
        COUNT(*) AS total_findings,
        COUNT(CASE WHEN severity = 'Critical' THEN 1 END) AS critical,
        COUNT(CASE WHEN severity = 'High' THEN 1 END) AS high,
        COUNT(CASE WHEN severity = 'Medium' THEN 1 END) AS medium,
        COUNT(CASE WHEN severity = 'Low' THEN 1 END) AS low,
        COUNT(CASE WHEN status = 'Open' THEN 1 END) AS open,
        COUNT(CASE WHEN status = 'Closed' THEN 1 END) AS closed
      FROM findings;
    `;
    const stats = await db.query(statsQuery);

    // 2. Total Assessments (Projects Count)
    const projectsCountQuery = `
      SELECT
        COUNT(*) AS total_projects,
        COUNT(CASE WHEN target_url LIKE '%.apk%' THEN 1 END) AS apk_count,
        COUNT(CASE WHEN target_url NOT LIKE '%.apk%' THEN 1 END) AS web_count
      FROM projects;
    `;
    const projectsStats = await db.query(projectsCountQuery);

    // 3. OWASP Breakdown
    const owaspQuery = `
      SELECT owasp_category, COUNT(*) AS count
      FROM findings
      WHERE owasp_category IS NOT NULL AND owasp_category != ''
      GROUP BY owasp_category
      ORDER BY count DESC
      LIMIT 10;
    `;
    const owasp = await db.query(owaspQuery);

    // 4. CWE Breakdown
    const cweQuery = `
      SELECT cwe_number, COUNT(*) AS count
      FROM findings
      WHERE cwe_number IS NOT NULL AND cwe_number != ''
      GROUP BY cwe_number
      ORDER BY count DESC
      LIMIT 6;
    `;
    const cwe = await db.query(cweQuery);

    // 5. Recent Projects with Findings Counts
    const projectQuery = `
      SELECT p.*,
        COUNT(f.id) AS total_findings,
        COUNT(CASE WHEN f.severity = 'Critical' THEN 1 END) AS crit,
        COUNT(CASE WHEN f.severity = 'High' THEN 1 END) AS high,
        COUNT(CASE WHEN f.severity = 'Medium' THEN 1 END) AS med,
        COUNT(CASE WHEN f.severity = 'Low' THEN 1 END) AS low,
        COUNT(CASE WHEN f.status = 'Closed' THEN 1 END) AS closed_count
      FROM projects p
      LEFT JOIN findings f ON p.id = f.project_id
      GROUP BY p.id
      ORDER BY p.id DESC
      LIMIT 10;
    `;
    const recentProjects = await db.query(projectQuery);

    // 6. Recent Activity Timeline (Role-Based Scoped)
    let logsQuery = 'SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100;';
    let queryParams = [];
    if (user && user.role !== 'Admin' && user.role !== 'CISO' && user.role !== 'Super Admin') {
      logsQuery = 'SELECT * FROM activity_logs WHERE username = $1 OR user_id = $2 ORDER BY timestamp DESC LIMIT 100;';
      queryParams = [user.username, user.id];
    }
    const activityLogs = await db.query(logsQuery, queryParams);

    const statsRow = stats.rows[0] || {};
    const projStatsRow = projectsStats.rows[0] || {};

    const totalFindings = parseInt(statsRow.total_findings || 0, 10);
    const critical = parseInt(statsRow.critical || 0, 10);
    const high = parseInt(statsRow.high || 0, 10);
    const medium = parseInt(statsRow.medium || 0, 10);
    const low = parseInt(statsRow.low || 0, 10);
    const open = parseInt(statsRow.open || 0, 10);
    const closed = parseInt(statsRow.closed || 0, 10);
    const totalProjects = parseInt(projStatsRow.total_projects || 0, 10);

    const fixRate = totalFindings > 0 ? ((closed / totalFindings) * 100).toFixed(1) : '100.0';

    let threatScore = 100 - (critical * 25 + high * 15 + medium * 5 + low * 2);
    if (threatScore < 10) threatScore = 10;
    if (totalFindings === 0) threatScore = 98;

    let grade = 'A';
    if (threatScore < 70) grade = 'B';
    if (threatScore < 50) grade = 'C';
    if (threatScore < 30) grade = 'F';

    return {
      stats: {
        total_findings: totalFindings,
        critical,
        high,
        medium,
        low,
        open,
        closed,
        total_projects: totalProjects,
        fix_rate: fixRate
      },
      owaspBreakdown: owasp.rows || [],
      cweBreakdown: cwe.rows || [],
      recentProjects: recentProjects.rows || [],
      activityLogs: activityLogs.rows || [],
      threatScore,
      grade
    };
  }

  static async compareProjects(baseProjectId, compareProjectId) {
    const baseProject = await ProjectModel.findById(baseProjectId);
    const compareProject = await ProjectModel.findById(compareProjectId);

    if (!baseProject || !compareProject) {
      throw { status: 404, message: 'One or both comparison projects not found' };
    }

    const baseFindings = await FindingModel.findByProjectId(baseProjectId);
    const compareFindings = await FindingModel.findByProjectId(compareProjectId);

    const baseNames = new Set(baseFindings.map(f => f.vulnerability_name));
    const compNames = new Set(compareFindings.map(f => f.vulnerability_name));

    const resolved = baseFindings.filter(f => !compNames.has(f.vulnerability_name));
    const newFindings = compareFindings.filter(f => !baseNames.has(f.vulnerability_name));
    const persisting = compareFindings.filter(f => baseNames.has(f.vulnerability_name));

    const totalBase = baseFindings.length || 1;
    const reduction = Math.max(0, Math.round(((resolved.length - newFindings.length) / totalBase) * 100));

    return {
      baseProject,
      compareProject,
      deltaStats: {
        resolvedCount: resolved.length,
        newCount: newFindings.length,
        persistingCount: persisting.length,
        riskReductionPercent: reduction
      },
      commonFindings: persisting,
      newFindings,
      resolvedFindings: resolved
    };
  }
}

module.exports = ReportExportService;
