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
      fgColor: { argb: 'FFC8E6C9' }
    };

    const BLUE_HEADER_BG = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD0E1FD' }
    };

    worksheet.columns = [
      { width: 8 },   // A: S.No
      { width: 32 },  // B: Vulnerability Name
      { width: 45 },  // C: Description
      { width: 45 },  // D: Step to reproduce
      { width: 45 },  // E: Remediation
      { width: 14 },  // F: Severity
      { width: 30 },  // G: Reference
      { width: 22 },  // H: OWASP Category - CWE
      { width: 35 }   // I: CWE Reference
    ];

    // Row 5: Title
    worksheet.mergeCells('B5:D5');
    const titleCell = worksheet.getCell('B5');
    titleCell.value = 'Manual Testing Report (VAPT)';
    titleCell.font = { name: 'Arial', size: 11, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    ['B5', 'C5', 'D5'].forEach(cell => {
      worksheet.getCell(cell).border = BORDER_STYLE;
    });

    // Row 8 to 12: Project Metadata (Green Table)
    const metaRows = [
      { row: 8, label: 'Project Name:', value: project.project_name },
      { row: 9, label: 'URL:', value: project.target_url },
      { row: 10, label: 'Security Analyst:', value: project.security_analysts },
      { row: 11, label: 'Project Manager:', value: project.project_managers },
      { row: 12, label: 'Additional Director cum CISO:', value: project.ciso_name }
    ];

    metaRows.forEach(m => {
      worksheet.mergeCells(`A${m.row}:I${m.row}`);
      const rowCell = worksheet.getCell(`A${m.row}`);
      rowCell.value = `${m.label} ${m.value || ''}`;
      rowCell.fill = GREEN_BG;
      rowCell.font = { name: 'Arial', size: 10, bold: true };
      rowCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      for (let col = 1; col <= 9; col++) {
        worksheet.getRow(m.row).getCell(col).border = BORDER_STYLE;
      }
    });

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
      cell.font = { name: 'Arial', size: 9, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = BORDER_STYLE;
    });
    headerRow.height = 28;

    // Rows 15+: Findings Data
    let currentRowIdx = 15;
    findings.forEach((f, idx) => {
      const row = worksheet.getRow(currentRowIdx);

      const values = [
        idx + 1,
        f.vulnerability_name,
        f.description,
        f.steps_to_reproduce,
        f.remediation,
        f.severity,
        f.reference || f.vulnerability_name,
        f.owasp_category,
        f.cwe_url
      ];

      values.forEach((val, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = val;
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = {
          vertical: 'top',
          horizontal: cIdx === 0 || cIdx === 5 ? 'center' : 'left',
          wrapText: true
        };
        cell.border = BORDER_STYLE;
      });

      currentRowIdx++;
    });

    if (findings.length === 0) {
      const row = worksheet.getRow(currentRowIdx);
      row.getCell(1).value = 'No vulnerabilities reported for this project.';
      worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
      row.getCell(1).alignment = { horizontal: 'center' };
      for (let col = 1; col <= 9; col++) row.getCell(col).border = BORDER_STYLE;
      currentRowIdx++;
    }

    // Row for Form No.
    currentRowIdx += 1;
    worksheet.getCell(`A${currentRowIdx}`).value = 'Form No. BISAG-SD/FR-207/201';
    worksheet.getCell(`A${currentRowIdx}`).font = { name: 'Arial', size: 8, italic: true };
    currentRowIdx += 2;

    // Remarks Section
    worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
    const remarksHeaderCell = worksheet.getCell(`A${currentRowIdx}`);
    remarksHeaderCell.value = 'Remarks:';
    remarksHeaderCell.fill = GREEN_BG;
    remarksHeaderCell.font = { name: 'Arial', size: 10, bold: true };
    remarksHeaderCell.border = BORDER_STYLE;
    currentRowIdx++;

    worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
    const remarksContentCell = worksheet.getCell(`A${currentRowIdx}`);
    remarksContentCell.value = project.remarks || '1. Functional Bugs are attached to in the Findings folder Under !';
    remarksContentCell.font = { name: 'Arial', size: 9 };
    remarksContentCell.border = BORDER_STYLE;
    currentRowIdx += 2;

    // Last Reported Vulnerabilities Status Section
    const todayStr = new Date().toLocaleDateString('en-GB');
    worksheet.mergeCells(`A${currentRowIdx}:I${currentRowIdx}`);
    const statusHeaderCell = worksheet.getCell(`A${currentRowIdx}`);
    statusHeaderCell.value = `According to Last Reported Vulnerabilities on Date: ${todayStr}`;
    statusHeaderCell.fill = GREEN_BG;
    statusHeaderCell.font = { name: 'Arial', size: 10, bold: true };
    statusHeaderCell.alignment = { horizontal: 'center' };
    for (let c = 1; c <= 9; c++) worksheet.getRow(currentRowIdx).getCell(c).border = BORDER_STYLE;
    currentRowIdx++;

    // Subheader: No | Vulnerability Name | Status
    worksheet.getCell(`B${currentRowIdx}`).value = 'No';
    worksheet.getCell(`B${currentRowIdx}`).font = { bold: true };
    worksheet.getCell(`B${currentRowIdx}`).border = BORDER_STYLE;
    worksheet.getCell(`B${currentRowIdx}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`C${currentRowIdx}:E${currentRowIdx}`);
    const vulnHeader = worksheet.getCell(`C${currentRowIdx}`);
    vulnHeader.value = 'Vulnerability Name';
    vulnHeader.font = { bold: true };
    vulnHeader.alignment = { horizontal: 'center' };
    ['C', 'D', 'E'].forEach(col => worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE);

    worksheet.mergeCells(`F${currentRowIdx}:G${currentRowIdx}`);
    const statusCol = worksheet.getCell(`F${currentRowIdx}`);
    statusCol.value = 'Status';
    statusCol.font = { bold: true };
    statusCol.alignment = { horizontal: 'center' };
    ['F', 'G'].forEach(col => worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE);
    currentRowIdx++;

    // Items list in Re-test Table
    findings.forEach((f, idx) => {
      worksheet.getCell(`B${currentRowIdx}`).value = idx + 1;
      worksheet.getCell(`B${currentRowIdx}`).border = BORDER_STYLE;
      worksheet.getCell(`B${currentRowIdx}`).alignment = { horizontal: 'center' };

      worksheet.mergeCells(`C${currentRowIdx}:E${currentRowIdx}`);
      const vCell = worksheet.getCell(`C${currentRowIdx}`);
      vCell.value = f.vulnerability_name;
      vCell.border = BORDER_STYLE;
      ['C', 'D', 'E'].forEach(col => worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE);

      worksheet.mergeCells(`F${currentRowIdx}:G${currentRowIdx}`);
      const sCell = worksheet.getCell(`F${currentRowIdx}`);
      sCell.value = f.status || 'Open';
      sCell.border = BORDER_STYLE;
      sCell.alignment = { horizontal: 'center' };
      ['F', 'G'].forEach(col => worksheet.getCell(`${col}${currentRowIdx}`).border = BORDER_STYLE);

      currentRowIdx++;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer, projectName: project.project_name };
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
    const baseFindings = await db.query('SELECT * FROM findings WHERE project_id = $1', [baseProjectId]);
    const compareFindings = await db.query('SELECT * FROM findings WHERE project_id = $1', [compareProjectId]);

    const baseRows = baseFindings.rows || [];
    const compareRows = compareFindings.rows || [];

    const baseMap = new Map();
    baseRows.forEach(f => baseMap.set(f.vulnerability_name.toLowerCase(), f));

    const compareMap = new Map();
    compareRows.forEach(f => compareMap.set(f.vulnerability_name.toLowerCase(), f));

    const remediated = [];
    const recurring = [];
    const newFindings = [];

    baseRows.forEach(bf => {
      const match = compareMap.get(bf.vulnerability_name.toLowerCase());
      if (!match || match.status === 'Closed') {
        remediated.push(bf);
      } else {
        recurring.push({ initial: bf, current: match });
      }
    });

    compareRows.forEach(cf => {
      if (!baseMap.has(cf.vulnerability_name.toLowerCase())) {
        newFindings.push(cf);
      }
    });

    return {
      remediated,
      recurring,
      newFindings,
      summary: {
        totalInitial: baseRows.length,
        totalCurrent: compareRows.length,
        remediatedCount: remediated.length,
        recurringCount: recurring.length,
        newCount: newFindings.length
      }
    };
  }
}

module.exports = ReportExportService;
