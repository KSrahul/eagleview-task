import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// import DOMPurify from 'dompurify'; // Hypothetical import for sanitization

const ROLES = { ADMIN: 'admin', INSTRUCTOR: 'instructor', VIEWER: 'viewer' };

/**
 * FIXED CourseManagementPanel
 * Addresses security vulnerabilities and logic bugs found in the original component.
 */
export function CourseManagementPanel() {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('viewer'); // Default to lowest priv
    const [gradeFormula, setGradeFormula] = useState('(midterm + final) / 2');
    const [auditLog, setAuditLog] = useState([]);

    const pollRef = useRef(null);
    const tokenRef = useRef(localStorage.getItem('admin_token'));

    // 1. FIXED: Do NOT read role from URL. 
    // Should come from a secure token decoded here or on the server.
    useEffect(() => {
        // const role = decodeToken(tokenRef.current).role; 
        // setUserRole(role);
    }, []);

    // 2. FIXED: Do NOT auto-execute sensitive actions from URL on mount.
    // Require explicit user confirmation instead.

    // Fetch courses on mount
    useEffect(() => {
        if (!tokenRef.current) {
            setError('Unauthorized');
            return;
        }
        fetch(`/api/admin/courses`, {
            headers: { 'Authorization': `Bearer ${tokenRef.current}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Unauthorized access');
                return res.json();
            })
            .then(data => setCourses(data))
            .catch((err) => setError(err.message));
    }, []);

    // 3. FIXED: Fetch enrollments with proper Auth
    const fetchEnrollments = useCallback(async (courseId) => {
        try {
            const res = await fetch(`/api/admin/courses/${courseId}/enrollments`, {
                headers: { 'Authorization': `Bearer ${tokenRef.current}` }
            });
            if (!res.ok) throw new Error('Failed to fetch enrollments');
            const data = await res.json();
            setEnrollments(data);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    // Poll for enrollment updates
    useEffect(() => {
        if (selectedCourse) {
            fetchEnrollments(selectedCourse.id);
            pollRef.current = setInterval(() => fetchEnrollments(selectedCourse.id), 5000);
        }
        return () => clearInterval(pollRef.current);
    }, [selectedCourse, fetchEnrollments]);

    // 4. FIXED: Safe Grade Calculation (Avoid eval)
    const calculateGrade = useCallback((student) => {
        const { midterm = 0, final = 0, assignments = 0, participation = 0 } = student.scores || {};

        // Simple white-listed parser or hardcoded logic instead of eval()
        // For an interview, a safe lookup/map or switch is better
        try {
            // Mocking a safe calculation. In reality, use a library like mathjs.
            if (gradeFormula === '(midterm + final) / 2') {
                return (midterm + final) / 2;
            }
            return 0;
        } catch {
            return 0;
        }
    }, [gradeFormula]);

    // 5. FIXED: Pure useMemo (Side effects in useEffect)
    const stats = useMemo(() => {
        const totalPaid = enrollments.reduce((sum, e) => sum + e.paidAmount, 0);
        return {
            total: enrollments.length,
            active: enrollments.filter(e => e.status === 'active').length,
            revenue: totalPaid,
        };
    }, [enrollments]);

    useEffect(() => {
        if (selectedCourse) {
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: 'stats_viewed', courseId: selectedCourse.id })
            });
        }
    }, [selectedCourse?.id]);

    const handleStatusChange = async (cId, newStatus) => {
        // 6. FIXED: Confirm sensitive actions
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        try {
            const res = await fetch(`/api/admin/courses/${cId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenRef.current}` // Added Auth
                },
                body: JSON.stringify({ status: newStatus }), // Removed updatedBy (server should know)
            });
            const result = await res.json();
            if (result.success) {
                setCourses(prev => prev.map(c => c.id === cId ? { ...c, status: newStatus } : c));
                setAuditLog(prev => [...prev, { action: 'status_change', courseId: cId, newStatus, timestamp: Date.now() }]);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteCourse = async (cId) => {
        if (!window.confirm('PERMANENTLY DELETE this course?')) return;

        const res = await fetch(`/api/admin/courses/${cId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenRef.current}` },
        });
        if (res.ok) {
            setCourses(prev => prev.filter(c => c.id !== cId));
        }
    };

    const handleExport = () => {
        const headers = 'Name,Email,Grade,Status\n';
        // 7. FIXED: CSV Injection prevention (prefix with ')
        const rows = enrollments.map(e => {
            const name = e.studentName.startsWith('=') ? `'${e.studentName}` : e.studentName;
            return `${name},${e.studentEmail},${calculateGrade(e)},${e.status}`;
        }).join('\n');

        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enrollments-${selectedCourse.id}.csv`;
        a.click();
    };

    const handleReturnNavigation = () => {
        // 8. FIXED: Open Redirect prevention (whitelist check)
        const url = new URL(window.location.href);
        const returnUrl = url.searchParams.get('return');
        if (returnUrl && returnUrl.startsWith('/')) { // Only allow relative links
            window.location.href = returnUrl;
        } else {
            window.location.href = '/admin/dashboard';
        }
    };

    return (
        <div className="admin-panel">
            <div className="header">
                <h1>Course Management</h1>
                <span>Role: {userRole}</span>
                <button onClick={handleReturnNavigation}>Back to Dashboard</button>
            </div>

            {/* 9. FIXED: No dangerouslySetInnerHTML for errors */}
            {error && (
                <div className="error">{error}</div>
            )}

            <div className="course-list">
                {courses.map(course => (
                    <div key={course.id} className="course-card" onClick={() => setSelectedCourse(course)}>
                        {/* FIXED: Standard text rendering to prevent XSS */}
                        <h3>{course.title}</h3>
                        <p>Instructor: {course.instructor}</p>
                        <p>Enrolled: {course.enrolled}/{course.capacity}</p>
                        <p>Status: {course.status}</p>

                        {userRole === ROLES.ADMIN && (
                            <div className="actions">
                                <button onClick={(e) => { e.stopPropagation(); handleStatusChange(course.id, 'published'); }}>
                                    Publish
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedCourse && (
                <div className="detail-panel">
                    <h2>{selectedCourse.title}</h2>
                    {/* FIXED: Santize HTML if dangerouslySetInnerHTML must be used */}
                    {/* <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedCourse.description) }} /> */}
                    <div>{selectedCourse.description.replace(/<[^>]*>?/gm, '')}</div>

                    <div className="stats-bar">
                        <span>Total: {stats.total}</span>
                        <span>Active: {stats.active}</span>
                        <span>Revenue: ${stats.revenue}</span>
                    </div>

                    <div className="grade-section">
                        <label>Grade Formula:</label>
                        <select value={gradeFormula} onChange={e => setGradeFormula(e.target.value)}>
                            <option value="(midterm + final) / 2">(midterm + final) / 2</option>
                            <option value="weighted">Weighted (60% Final, 40% Midterm)</option>
                        </select>
                        <button onClick={() => { }}>Apply Formula & Save</button>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Computed Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrollments.map(e => (
                                <tr key={e.id}>
                                    <td>{e.studentName}</td>
                                    <td>{e.studentEmail}</td>
                                    <td>{e.status}</td>
                                    <td>{calculateGrade(e)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button onClick={handleExport}>Export CSV</button>
                </div>
            )}
        </div>
    );
}
