import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Executive VAPT PDF Report Generator
 * Generates an industry-standard, multi-page VAPT Audit Report
 */
export const generateVaptPdfReport = ({
  project = {},
  findings = [],
  scopeType = 'Web Application VAPT',
  executiveSummary = '',
  analysts = []
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const projectName = project.project_name || project.name || 'Enterprise VAPT Assessment';
  const targetUrl = project.target_url || project.url || 'https://target.scope';
  const projectCode = project.project_code || `VAPT-${String(project.id || '001').padStart(3, '0')}`;
  const assessmentDate = project.start_date || new Date().toISOString().slice(0, 10);
  const department = project.department || 'Cyber Security Assurance Wing';

  // Finding counts
  const critCount = findings.filter(f => (f.severity || '').toLowerCase() === 'critical').length;
  const highCount = findings.filter(f => (f.severity || '').toLowerCase() === 'high').length;
  const medCount = findings.filter(f => (f.severity || '').toLowerCase() === 'medium').length;
  const lowCount = findings.filter(f => (f.severity || '').toLowerCase() === 'low').length;
  const totalFindings = findings.length;

  // Posture Score calculation
  const score = Math.max(0, 100 - (critCount * 25 + highCount * 15 + medCount * 5 + lowCount * 2));
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 50 ? 'C' : 'F';
  const verdict = critCount > 0 || highCount > 2 ? 'BLOCK PRODUCTION' : (highCount > 0 || medCount > 3) ? 'CONDITIONAL PASS' : 'CLEAR FOR PRODUCTION';

  // Helper colors
  const primaryColor = [15, 23, 42]; // Slate 900
  const cyanColor = [0, 180, 216]; // Cyan
  const darkNavy = [11, 15, 25];

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  // Dark cyber background header banner
  doc.setFillColor(...darkNavy);
  doc.rect(0, 0, pageWidth, 95, 'F');

  // Top glowing cyan accent bar
  doc.setFillColor(...cyanColor);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Title & Header Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 229, 255);
  doc.text('CYBERSHIELD ASSURANCE • CONFIDENTIAL SECURITY AUDIT', 20, 22);

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('VULNERABILITY ASSESSMENT &', 20, 35);
  doc.text('PENETRATION TESTING REPORT', 20, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text(`Scope Type: ${scopeType} | Standard: OWASP ASVS v4.0 & CERT-In`, 20, 56);

  // Security Clearance Badge on Cover
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(20, 68, 65, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 229, 255);
  doc.text(`REF: ${projectCode}`, 26, 77);

  // Project Target Details Card
  let yPos = 115;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('Target & Governance Scope', 20, yPos);

  yPos += 8;
  autoTable(doc, {
    startY: yPos,
    margin: { left: 20, right: 20 },
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3.5 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 50 },
      1: { cellWidth: 'auto' }
    },
    body: [
      ['Target System / Project', projectName],
      ['Primary Target URL', targetUrl],
      ['Audit Scope Classification', scopeType],
      ['Assessment Period / Date', assessmentDate],
      ['Governing Department', department],
      ['Lead Security Analyst(s)', analysts.length > 0 ? analysts.join(', ') : 'BISAG-N Cyber Security Team']
    ]
  });

  // Posture Score Overview on Cover Page
  yPos = doc.lastAutoTable.finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('Executive Threat Verdict', 20, yPos);

  yPos += 6;
  doc.setFillColor(score < 50 ? 254 : 240, score < 50 ? 242 : 253, score < 50 ? 242 : 244);
  doc.roundedRect(20, yPos, pageWidth - 40, 28, 3, 3, 'F');
  doc.setDrawColor(score < 50 ? 239 : 16, score < 50 ? 68 : 185, score < 50 ? 68 : 129);
  doc.roundedRect(20, yPos, pageWidth - 40, 28, 3, 3, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(score < 50 ? 185 : 15, score < 50 ? 28 : 118, score < 50 ? 28 : 110);
  doc.text(`SECURITY GRADE: ${grade} (${score}/100)  —  VERDICT: ${verdict}`, 26, yPos + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Identified ${totalFindings} finding(s) [Critical: ${critCount}, High: ${highCount}, Medium: ${medCount}, Low: ${lowCount}]. ` +
    (critCount > 0 ? 'Immediate remediation required prior to production authorization.' : 'Manageable risk profile. Follow remediation timeline.'),
    26,
    yPos + 20
  );

  // Cover Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('BISAG-N • Ministry of Electronics and Information Technology (MeitY) • Confidential', 20, pageHeight - 12);
  doc.text('Page 1', pageWidth - 28, pageHeight - 12);

  // ==========================================
  // PAGE 2: EXECUTIVE SUMMARY & SEVERITY STATS
  // ==========================================
  doc.addPage();
  addHeaderFooter(doc, 'Executive Summary & Threat Distribution', 2, projectCode);

  yPos = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text('1. Executive Overview & Methodology', 20, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const methodologyText =
    `This report provides the technical and executive findings from the security assessment performed against ${targetUrl}. ` +
    `Testing was conducted using industry-recognized security assessment methodologies including the OWASP Web Security Testing Guide (WSTG v4.2), ` +
    `NIST SP 800-115, and CERT-In compliance guidelines. The goal was to identify exploitable security vulnerabilities, configuration weaknesses, ` +
    `and cryptographic flaws before malicious actors could compromise application data, integrity, or service availability.`;

  const splitMethodology = doc.splitTextToSize(methodologyText, pageWidth - 40);
  doc.text(splitMethodology, 20, yPos);
  yPos += (splitMethodology.length * 4.8) + 6;

  // Severity Distribution Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text('2. Severity Breakdown & Risk Rating Matrix', 20, yPos);

  yPos += 5;
  autoTable(doc, {
    startY: yPos,
    margin: { left: 20, right: 20 },
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    body: [
      ['Critical Severity (CVSS 9.0 - 10.0)', String(critCount), 'Direct remote code execution, full database takeover, or total authentication bypass.'],
      ['High Severity (CVSS 7.0 - 8.9)', String(highCount), 'Privilege escalation, SQL Injection, SSRF, sensitive credential exposure.'],
      ['Medium Severity (CVSS 4.0 - 6.9)', String(medCount), 'Reflected XSS, CSRF, Insecure Direct Object References, CORS misconfigurations.'],
      ['Low Severity (CVSS 0.1 - 3.9)', String(lowCount), 'Missing security headers, verbose banner disclosure, SSL cipher deprecation.'],
      ['Total Actionable Findings', String(totalFindings), 'All active vulnerabilities requiring development team remediation.']
    ]
  });

  yPos = doc.lastAutoTable.finalY + 12;

  // Compliance statement box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(20, yPos, pageWidth - 40, 32, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('Compliance & Remediation SLA Standard', 26, yPos + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('• Critical Flaws: Fix within 48 Hours | Re-test mandatory before production release.', 26, yPos + 15);
  doc.text('• High Severity: Fix within 7 Business Days.', 26, yPos + 21);
  doc.text('• Medium & Low: Remediate in next deployment cycle (within 30 days).', 26, yPos + 27);

  // ==========================================
  // PAGES 3+: DETAILED FINDINGS BREAKDOWN
  // ==========================================
  doc.addPage();
  let currentPage = 3;
  addHeaderFooter(doc, 'Detailed Vulnerability Findings & Remediation', currentPage, projectCode);

  yPos = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text('3. Detailed Technical Findings', 20, yPos);
  yPos += 8;

  if (findings.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No vulnerabilities documented for this assessment cycle. Target demonstrates hardened security posture.', 20, yPos);
  } else {
    findings.forEach((finding, index) => {
      // Check if we need a new page
      if (yPos > pageHeight - 65) {
        doc.addPage();
        currentPage++;
        addHeaderFooter(doc, 'Detailed Vulnerability Findings (Cont.)', currentPage, projectCode);
        yPos = 28;
      }

      const sev = (finding.severity || 'Medium').toUpperCase();
      const sevColor = sev === 'CRITICAL' ? [220, 38, 38] : sev === 'HIGH' ? [234, 88, 12] : sev === 'MEDIUM' ? [202, 138, 4] : [37, 99, 235];

      // Finding Item Header Bar
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, yPos, pageWidth - 40, 9, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(20, yPos, pageWidth - 40, 9, 1.5, 1.5, 'D');

      // Severity Pill
      doc.setFillColor(...sevColor);
      doc.roundedRect(22, yPos + 1.5, 20, 6, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(sev, 24, yPos + 5.7);

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...primaryColor);
      const title = `${index + 1}. ${finding.vulnerability_name || finding.name || 'Unnamed Vulnerability'}`;
      doc.text(doc.splitTextToSize(title, pageWidth - 90)[0], 46, yPos + 6);

      // CWE & OWASP badge text
      const cwe = finding.cwe_number || finding.cweNumber || 'CWE-200';
      const owasp = (finding.owasp_category || finding.owaspCategory || 'OWASP Top 10').split('-')[0].trim();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${cwe} | ${owasp}`, pageWidth - 65, yPos + 6);

      yPos += 13;

      // Table for Finding Details
      const desc = finding.description || finding.desc || 'No detailed description provided.';
      const steps = finding.steps_to_reproduce || finding.steps || finding.evidence || 'Follow standard penetration testing procedures.';
      const remediation = finding.remediation || 'Apply input validation and principle of least privilege.';

      autoTable(doc, {
        startY: yPos,
        margin: { left: 20, right: 20 },
        theme: 'grid',
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.8 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 38 },
          1: { cellWidth: 'auto' }
        },
        body: [
          ['Description & Impact', desc],
          ['Proof of Concept / Steps', steps],
          ['Remediation Guidance', remediation]
        ]
      });

      yPos = doc.lastAutoTable.finalY + 8;
    });
  }

  // Save the generated PDF
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${projectCode}_${sanitizedName}_VAPT_Report.pdf`);
};

// Helper: Standard Header and Footer for Inner Pages
function addHeaderFooter(doc, title, pageNum, projectCode) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 14, 'F');
  doc.setFillColor(0, 229, 255);
  doc.rect(0, 13, pageWidth, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 229, 255);
  doc.text('CYBERSHIELD VAPT AUDIT', 20, 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`•  ${title}`, 65, 9);
  doc.text(`REF: ${projectCode}`, pageWidth - 45, 9);

  // Bottom footer
  doc.setDrawColor(226, 232, 240);
  doc.line(20, pageHeight - 12, pageWidth - 20, pageHeight - 12);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('CONFIDENTIAL • BISAG-N MeitY VAPT Assurance Framework', 20, pageHeight - 6);
  doc.text(`Page ${pageNum}`, pageWidth - 28, pageHeight - 6);
}
