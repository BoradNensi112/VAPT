const initialVulnerabilities = [
  {
    vulnerability_name: "Cross Site Scripting (XSS) [Stored / Reflected]",
    description: "Cross-Site Scripting attacks occur when malicious scripts are injected into otherwise trusted websites. An attacker can use XSS to send a malicious script to an unsuspecting user.",
    steps_to_reproduce: "1. Go to Collection Details.\n2. Enter the necessary details.\n3. Intercept the request.\n4. Replace the remarks value with an XSS payload.\n5. Observe that it is stored and executed in the browser.",
    remediation: "1. Filter input on arrival.\n2. Encode data on output.\n3. Use appropriate response headers.\n4. Implement Content Security Policy.",
    severity: "High",
    reference: "Cross Site Scripting (XSS) [Stored / Reflected]",
    owasp_category: "A03 - (CWE-79)",
    cwe_number: "CWE-79",
    cwe_url: "https://cwe.mitre.org/data/definitions/79.html"
  },
  {
    vulnerability_name: "Cross Site Scripting (XSS) via File Upload",
    description: "XSS through file upload occurs when uploaded content is insufficiently validated or encoded and can be interpreted as active content (e.g., SVG, HTML file upload).",
    steps_to_reproduce: "1. Login using the provided credentials.\n2. Navigate to the relevant module.\n3. Upload a malicious file (e.g., test.svg with script).\n4. Intercept and modify the request using Burp Suite.\n5. Observe successful storage and rendering of the file.",
    remediation: "1. Strictly validate uploaded files.\n2. Validate content type and extension.\n3. Store uploads outside executable web paths.\n4. Encode output and serve with Content-Disposition: attachment.\n5. Use Content Security Policy.",
    severity: "High",
    reference: "Cross Site Scripting (XSS) [Stored / Reflected]",
    owasp_category: "A03 - (CWE-79)",
    cwe_number: "CWE-79",
    cwe_url: "https://cwe.mitre.org/data/definitions/79.html"
  },
  {
    vulnerability_name: "Deprecated X-XSS-Protection Header",
    description: "The application uses the deprecated X-XSS-Protection HTTP response header. Modern browsers have removed support for this header because it can introduce security vulnerabilities in certain contexts.",
    steps_to_reproduce: "1. Visit target URL: http://localhost:5173/report-generator\n2. Intercept the request.\n3. Send to Repeater.\n4. Inspect the response headers.",
    remediation: "1. Remove deprecated X-XSS-Protection header.\n2. Implement Content Security Policy (CSP).\n3. Implement input validation and output encoding.\n4. Configure secure cookie settings.",
    severity: "Low",
    reference: "Deprecated X-XSS-Protection Header",
    owasp_category: "A05 - (CWE-1021)",
    cwe_number: "CWE-1021",
    cwe_url: "https://cwe.mitre.org/data/definitions/1021.html"
  },
  {
    vulnerability_name: "SQL Injection (Blind / Error-Based)",
    description: "SQL injection is a web security vulnerability that allows an attacker to interfere with the queries that an application makes to its database, allowing unauthorized data retrieval or modification.",
    steps_to_reproduce: "1. Navigate to search or login parameter.\n2. Inject payload: ' OR '1'='1.\n3. Observe database error or authentication bypass.",
    remediation: "1. Use parameterized queries / prepared statements for all SQL execution.\n2. Use Object Relational Mapping (ORM) safely.\n3. Enforce principle of least privilege on database accounts.",
    severity: "Critical",
    reference: "SQL Injection",
    owasp_category: "A03 - (CWE-89)",
    cwe_number: "CWE-89",
    cwe_url: "https://cwe.mitre.org/data/definitions/89.html"
  },
  {
    vulnerability_name: "Missing Strict-Transport-Security (HSTS) Header",
    description: "HTTP Strict Transport Security (HSTS) enforces secure HTTPS connections, preventing Man-in-the-Middle (MITM) and SSL-stripping attacks.",
    steps_to_reproduce: "1. Send a request to the application over HTTPS.\n2. Analyze response headers.\n3. Note absence of Strict-Transport-Security header.",
    remediation: "1. Add Strict-Transport-Security header: max-age=31536000; includeSubDomains; preload.",
    severity: "Low",
    reference: "HSTS Header",
    owasp_category: "A05 - (CWE-319)",
    cwe_number: "CWE-319",
    cwe_url: "https://cwe.mitre.org/data/definitions/319.html"
  },
  {
    vulnerability_name: "CORS Misconfiguration (Arbitrary Origin Allowed)",
    description: "The application's Cross-Origin Resource Sharing (CORS) policy reflects arbitrary origins or allows wildcard with credentials, enabling malicious third-party websites to extract sensitive user data.",
    steps_to_reproduce: "1. Send request with header 'Origin: https://attacker.com'.\n2. Check response for 'Access-Control-Allow-Origin: https://attacker.com' and 'Access-Control-Allow-Credentials: true'.",
    remediation: "1. Whitelist only trusted domains for CORS.\n2. Do not reflect arbitrary Origin headers when Access-Control-Allow-Credentials is true.",
    severity: "Medium",
    reference: "CORS Misconfiguration",
    owasp_category: "A07 - (CWE-942)",
    cwe_number: "CWE-942",
    cwe_url: "https://cwe.mitre.org/data/definitions/942.html"
  },
  {
    vulnerability_name: "Insecure Direct Object Reference (IDOR)",
    description: "The application uses user-supplied input to access objects directly without proper access control checks, allowing unauthorized users to view or modify records belonging to other users.",
    steps_to_reproduce: "1. Login as User A and view profile with ID 101.\n2. Change request parameter ID to 102.\n3. Observe unauthorized access to User B's sensitive data.",
    remediation: "1. Implement robust server-side authorization checks on all resource endpoints.\n2. Use non-sequential random identifiers (UUIDs) where applicable.",
    severity: "High",
    reference: "Broken Object Level Authorization (BOLA/IDOR)",
    owasp_category: "A01 - (CWE-639)",
    cwe_number: "CWE-639",
    cwe_url: "https://cwe.mitre.org/data/definitions/639.html"
  },
  {
    vulnerability_name: "Clickjacking / Missing X-Frame-Options",
    description: "The web page does not restrict framing via X-Frame-Options or Content-Security-Policy frame-ancestors, enabling attackers to render the page inside a transparent iframe and trick users into clicking buttons.",
    steps_to_reproduce: "1. Create an HTML file with <iframe src='TARGET_URL'></iframe>.\n2. Open in browser and verify the application renders successfully within the iframe.",
    remediation: "1. Configure 'X-Frame-Options: DENY' or 'SAMEORIGIN'.\n2. Implement Content Security Policy with 'frame-ancestors 'self''.",
    severity: "Medium",
    reference: "Clickjacking Protection",
    owasp_category: "A05 - (CWE-1021)",
    cwe_number: "CWE-1021",
    cwe_url: "https://cwe.mitre.org/data/definitions/1021.html"
  }
];

const initialAnalysts = [
  { name: 'Ankit Nandaniya', department: 'Software' },
  { name: 'Arpan Goswami', department: 'Software' },
  { name: 'Gaurav Kadam', department: 'Defence' },
  { name: 'Divyansh Gohil', department: 'SATCOM' },
  { name: 'Jay Patel', department: 'Software' },
  { name: 'Jui Mehta', department: 'General' },
  { name: 'Purvadeep Sinh Jadeja', department: 'GIS' },
  { name: 'Ravi Barot', department: 'Infrastructure' }
];

module.exports = { initialVulnerabilities, initialAnalysts };
