const ToolsService = require('../services/toolsService');
const ActivityLogModel = require('../models/ActivityLog');

exports.checkHeaders = async (req, res) => {
  try {
    const result = await ToolsService.checkSecurityHeaders(req.body);
    const target = req.body.targetUrl || req.body.url || 'Target Application';
    if (req.user) {
      await ActivityLogModel.create({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        action: 'Security Headers Audit',
        details: `Ran shcheck security headers scan on '${target}'`
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.scanPorts = async (req, res) => {
  try {
    const result = await ToolsService.scanPorts(req.body);
    const target = req.body.targetHost || req.body.host || req.body.targetUrl || 'Target Host';
    if (req.user) {
      await ActivityLogModel.create({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        action: 'Port Scan Executed',
        details: `Ran port & service scan on '${target}'`
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.reconDns = async (req, res) => {
  try {
    const result = await ToolsService.reconDnsAndSubdomains(req.body);
    const target = req.body.targetDomain || req.body.domain || 'Target Domain';
    if (req.user) {
      await ActivityLogModel.create({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        action: 'DNS & Subdomain Recon',
        details: `Ran DNS reconnaissance & subdomain lookup on '${target}'`
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.inspectSsl = async (req, res) => {
  try {
    const result = await ToolsService.inspectSslCertificate(req.body);
    const target = req.body.targetDomain || req.body.domain || 'Target Domain';
    if (req.user) {
      await ActivityLogModel.create({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        action: 'SSL/TLS Certificate Inspection',
        details: `Inspected SSL/TLS certificate validity & cipher strength on '${target}'`
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.probeSensitiveFiles = async (req, res) => {
  try {
    const result = await ToolsService.probeSensitiveFiles(req.body);
    const target = req.body.targetUrl || req.body.url || 'Target URL';
    if (req.user) {
      await ActivityLogModel.create({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        action: 'Sensitive Files Probe',
        details: `Scanned for sensitive files & exposed git/config backups on '${target}'`
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.testCors = async (req, res) => {
  try {
    const result = await ToolsService.testCorsMisconfig(req.body);
    const target = req.body.targetUrl || req.body.url || 'Target URL';
    if (req.user) {
      await ActivityLogModel.create({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        action: 'CORS Security Audit',
        details: `Tested CORS origin reflection & wildcard credentials on '${target}'`
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.runToolScan = async (req, res) => {
  try {
    const result = await ToolsService.executeToolScan(req.body);
    const target = req.body.targetUrl || req.body.url || 'Target Scope';
    if (req.user) {
      await ActivityLogModel.create({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        action: 'Automated Tool Scan',
        details: `Executed multi-module security scan on '${target}'`
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};


