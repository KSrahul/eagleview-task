import React, { useState, useEffect, useRef } from 'react';
import './EagleAdminDashboard.css';

// ─── SIMULATED BACKEND (STARTER CODE) ───────────────────────────────────────

const delay = (ms) => new Promise(r => setTimeout(r, ms));
const maybe = (failRate = 0.1) => Math.random() > failRate;

const MOCK_COURSES = [
    {
        id: 'c-001', title: 'Advanced React Patterns', instructor: 'Dr. Sarah Chen',
        category: 'Engineering', capacity: 30, enrolled: 28, status: 'published',
        startDate: '2026-05-01', endDate: '2026-08-01', price: 4999,
        description: '<p>Deep dive into <strong>advanced React</strong> patterns including render props and compound components</p>',
    },
    {
        id: 'c-002', title: 'Data Science Fundamentals', instructor: 'Prof. James Liu',
        category: 'Data', capacity: 50, enrolled: 45, status: 'published',
        startDate: '2026-04-15', endDate: '2026-07-15', price: 3999,
        description: '<p>Comprehensive introduction to <em>data science</em> with Python</p>',
    },
    {
        id: 'c-003', title: 'UX Design Masterclass', instructor: 'Maya Patel',
        category: 'Design', capacity: 25, enrolled: 25, status: 'published',
        startDate: '2026-06-01', endDate: '2026-09-01', price: 5999,
        description: '<p>Industry-level UX design training with portfolio projects</p>',
    },
    {
        id: 'c-004', title: 'Cloud Architecture', instructor: 'Alex Thompson',
        category: 'Engineering', capacity: 40, enrolled: 12, status: 'draft',
        startDate: '2026-09-01', endDate: '2026-12-01', price: 6999,
        description: '<p>AWS, GCP, and Azure architecture patterns for production systems</p>',
    },
    {
        id: 'c-005', title: 'Legacy Systems Migration', instructor: 'TBD',
        category: 'Engineering', capacity: 0, enrolled: 0, status: 'archived',
        startDate: '2025-01-01', endDate: '2025-04-01', price: 2999,
        description: '<p>Archived — this course is no longer offered</p>',
    },
    {
        id: 'c-006', title: 'App Security Basics',
        instructor: 'Dr. Eve Hacker', category: 'Security',
        capacity: 20, enrolled: 23, status: 'published',
        startDate: '2026-04-01', endDate: '2026-07-01', price: -500,
        description: '<p>Learn web security fundamentals hands-on</p>',
    },
];

const MOCK_ENROLLMENTS = {
    'c-001': [
        { id: 'e-001', studentName: 'Alice Wang', studentEmail: 'alice@university.edu', enrolledAt: '2026-03-15', status: 'active', grade: 92, paidAmount: 4999 },
        { id: 'e-002', studentName: 'Bob Martinez', studentEmail: 'bob@university.edu', enrolledAt: '2026-03-16', status: 'pending', grade: null, paidAmount: 0 },
        { id: 'e-003', studentName: 'Carol Zhang', studentEmail: 'carol@university.edu', enrolledAt: '2026-03-17', status: 'active', grade: 88, paidAmount: 4999 },
        { id: 'e-004', studentName: 'David Kim', studentEmail: 'david@university.edu', enrolledAt: '2026-03-18', status: 'waitlisted', grade: null, paidAmount: 0 },
        { id: 'e-005', studentName: 'Eva Johansson', studentEmail: 'eva@university.edu', enrolledAt: '2026-03-19', status: 'dropped', grade: 45, paidAmount: 4999 },
    ],
    'c-002': [
        { id: 'e-006', studentName: 'Frank Obi', studentEmail: 'frank@university.edu', enrolledAt: '2026-03-10', status: 'active', grade: 78, paidAmount: 3999 },
        { id: 'e-007', studentName: 'Grace Lee', studentEmail: 'grace@university.edu', enrolledAt: '2026-03-11', status: 'active', grade: 95, paidAmount: 3999 },
        { id: 'e-008', studentName: 'Hiro Tanaka', studentEmail: 'hiro@university.edu', enrolledAt: '2026-03-12', status: 'pending', grade: null, paidAmount: 0 },
    ],
    'c-003': [
        { id: 'e-009', studentName: 'Isla Rodriguez', studentEmail: 'isla@university.edu', enrolledAt: '2026-02-28', status: 'active', grade: 91, paidAmount: 5999 },
        { id: 'e-010', studentName: 'Jack Patel', studentEmail: 'jack@university.edu', enrolledAt: '2026-03-01', status: 'active', grade: 87, paidAmount: 5999 },
    ],
    'c-004': [
        { id: 'e-011', studentName: 'Kira Novak', studentEmail: 'kira@university.edu', enrolledAt: '2026-04-01', status: 'pending', grade: null, paidAmount: 0 },
    ],
    'c-005': [],
    'c-006': [
        { id: 'e-012', studentName: 'Liam O\'Connor', studentEmail: 'liam@university.edu', enrolledAt: '2026-03-20', status: 'active', grade: 76, paidAmount: 0 },
        { id: 'e-013', studentName: 'Mia Svensson', studentEmail: 'mia@university.edu', enrolledAt: '2026-03-21', status: 'pending', grade: null, paidAmount: 0 },
    ],
};

const api = {
    async searchCourses(query, filters = {}, signal) {
        await delay(300 + Math.random() * 500);
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        if (!maybe()) throw new Error('Course service temporarily unavailable');
        let results = [...MOCK_COURSES];
        if (query) {
            const q = query.toLowerCase();
            results = results.filter(c =>
                c.title.toLowerCase().includes(q) ||
                c.instructor.toLowerCase().includes(q) ||
                c.category.toLowerCase().includes(q)
            );
        }
        if (filters.status) results = results.filter(c => c.status === filters.status);
        return results;
    },

    async fetchEnrollments(courseId) {
        await delay(200 + Math.random() * 300);
        if (!maybe(0.05)) throw new Error('Enrollment service down');
        const course = MOCK_COURSES.find(c => c.id === courseId);
        if (!course) throw new Error('Course not found');
        if (course.status === 'archived') return { enrollments: [], archived: true };
        const enrollments = MOCK_ENROLLMENTS[courseId] || [];
        return { enrollments };
    },

    async enrollStudent(courseId, studentData) {
        await delay(400 + Math.random() * 600);
        if (!maybe(0.15)) throw new Error('Enrollment service error');
        const course = MOCK_COURSES.find(c => c.id === courseId);
        const isAtCapacity = course.enrolled >= course.capacity;
        const enrollment = {
            id: `e-${Date.now().toString(36)}`,
            studentName: studentData.name,
            studentEmail: studentData.email,
            status: isAtCapacity ? 'waitlisted' : 'pending',
            paidAmount: isAtCapacity ? 0 : course.price,
        };
        return { enrollment, waitlisted: isAtCapacity };
    },

    async updateCourseStatus(courseId, newStatus) {
        await delay(300 + Math.random() * 300);
        if (!maybe(0.1)) throw new Error('Status update failed');
        const course = MOCK_COURSES.find(c => c.id === courseId);
        if (newStatus === 'published' && course.instructor === 'TBD') return { success: false, error: 'Cannot publish without instructor' };
        if (newStatus === 'archived') {
            const enrollments = MOCK_ENROLLMENTS[courseId] || [];
            if (enrollments.some(e => e.status === 'pending')) return { success: false, error: 'Resolve pending enrollments first' };
        }
        return { success: true };
    },

    async bulkUpdateEnrollments(courseId, enrollmentIds, action) {
        await delay(500 + Math.random() * 1000);
        const results = enrollmentIds.map(id => ({ id, success: maybe(0.1) }));
        return { results };
    },

    async fetchCourseStats(courseId) {
        await delay(400 + Math.random() * 400);
        if (!maybe(0.05)) throw new Error('Stats unavailable');
        const course = MOCK_COURSES.find(c => c.id === courseId);
        const enrollments = MOCK_ENROLLMENTS[courseId] || [];
        const active = enrollments.filter(e => e.status === 'active');
        return {
            totalRevenue: enrollments.reduce((sum, e) => sum + e.paidAmount, 0),
            completionRate: active.length > 0 ? 88 : 0,
            avgGrade: active.length > 0 ? 82 : null,
        };
    },
};

// ─── DASHBOARD COMPONENT ────────────────────────────────────────────────────

export const CourseAdminDashboard = () => {
    const [courses, setCourses] = useState([]);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const [loading, setLoading] = useState({ courses: false, detail: false, action: false, stats: false });
    const [errors, setErrors] = useState({ courses: null, detail: null, action: null, stats: null });

    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [bulkResults, setBulkResults] = useState({});
    const [enrollForm, setEnrollForm] = useState({ name: '', email: '' });
    const [enrollStatus, setEnrollStatus] = useState(null);

    const [undoStack, setUndoStack] = useState([]);
    const [retryTrigger, setRetryTrigger] = useState(0);
    const abortControllerRef = useRef(null);
    const pollingRef = useRef(null);

    // Initial load & Search
    useEffect(() => {
        const fetchCourses = async () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
            abortControllerRef.current = new AbortController();
            setLoading(prev => ({ ...prev, courses: true }));
            setErrors(prev => ({ ...prev, courses: null }));
            try {
                const results = await api.searchCourses(query, { status: statusFilter }, abortControllerRef.current.signal);
                setCourses(results);
            } catch (err) {
                if (err.name !== 'AbortError') setErrors(prev => ({ ...prev, courses: err.message }));
            } finally {
                if (!abortControllerRef.current?.signal.aborted) setLoading(prev => ({ ...prev, courses: false }));
            }
        };
        const timer = setTimeout(fetchCourses, 300);
        return () => clearTimeout(timer);
    }, [query, statusFilter, retryTrigger]);

    // Detail load
    useEffect(() => {
        if (!selectedCourse) return;
        let ignore = false;
        const load = async () => {
            setLoading(prev => ({ ...prev, detail: true }));
            setErrors(prev => ({ ...prev, detail: null }));
            setEnrollments([]);
            setAnalytics(null);
            try {
                const res = await api.fetchEnrollments(selectedCourse.id);
                if (!ignore) {
                    setEnrollments(res.enrollments);
                    if (res.archived) setErrors(prev => ({ ...prev, detail: "Course is archived. No new enrollments allowed." }));
                    startPolling(selectedCourse.id);
                }
            } catch (err) {
                if (!ignore) setErrors(prev => ({ ...prev, detail: err.message }));
            } finally {
                if (!ignore) setLoading(prev => ({ ...prev, detail: false }));
            }
        };
        load();
        return () => {
            ignore = true;
            stopPolling();
        };
    }, [selectedCourse?.id, retryTrigger]);

    const startPolling = (courseId) => {
        stopPolling();
        const fetch = async (initial = false) => {
            if (initial) setLoading(prev => ({ ...prev, stats: true }));
            try {
                const stats = await api.fetchCourseStats(courseId);
                setAnalytics(stats);
                setLastUpdated(new Date().toLocaleTimeString());
                setErrors(prev => ({ ...prev, stats: null }));
            } catch (err) {
                setErrors(prev => ({ ...prev, stats: "Refresh failed" }));
            } finally {
                if (initial) setLoading(prev => ({ ...prev, stats: false }));
            }
        };
        fetch(true);
        pollingRef.current = setInterval(() => fetch(false), 10000);
    };

    const stopPolling = () => pollingRef.current && clearInterval(pollingRef.current);

    const handleUndo = async () => {
        const stack = [...undoStack];
        const action = stack.shift();
        if (action) {
            setUndoStack(stack);
            await action();
        }
    };

    const handleStatusChange = async (newStatus) => {
        const oldStatus = selectedCourse.status;
        setErrors(prev => ({ ...prev, action: null }));
        setSelectedCourse(prev => ({ ...prev, status: newStatus }));
        setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, status: newStatus } : c));

        try {
            const res = await api.updateCourseStatus(selectedCourse.id, newStatus);
            if (!res.success) throw new Error(res.error);

            setUndoStack(prev => [async () => {
                await api.updateCourseStatus(selectedCourse.id, oldStatus);
                setSelectedCourse(p => ({ ...p, status: oldStatus }));
                setCourses(p => p.map(c => c.id === selectedCourse.id ? { ...c, status: oldStatus } : c));
            }, ...prev].slice(0, 5));
        } catch (err) {
            setSelectedCourse(prev => ({ ...prev, status: oldStatus }));
            setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, status: oldStatus } : c));
            setErrors(prev => ({ ...prev, action: err.message }));
        }
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        setLoading(prev => ({ ...prev, action: true }));
        try {
            const { enrollment, waitlisted } = await api.enrollStudent(selectedCourse.id, enrollForm);
            setEnrollments(prev => [...prev, enrollment]);
            setEnrollStatus(waitlisted ? 'Waitlisted' : 'Enrolled Successfully');
            setEnrollForm({ name: '', email: '' });
        } catch (err) {
            setErrors(prev => ({ ...prev, action: err.message }));
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    const handleBulkAction = async (action) => {
        setLoading(prev => ({ ...prev, action: true }));
        try {
            const { results } = await api.bulkUpdateEnrollments(selectedCourse.id, Array.from(selectedStudents), action);
            results.forEach(res => {
                if (res.success) {
                    setEnrollments(prev => prev.map(e => e.id === res.id ? { ...e, status: action === 'approve' ? 'active' : 'dropped' } : e));
                }
                setBulkResults(prev => ({ ...prev, [res.id]: res }));
            });
        } finally {
            setLoading(prev => ({ ...prev, action: false }));
        }
    };

    return (
        <div className="dashboard-wrapper">
            {/* <div className="top-banner">
                Check out the latest Eagleview One™ event to learn about interactive full-exterior 3D property models. <a href="#">Watch Now</a>
            </div> */}
            <header className="nav-header">
                <div className="nav-container">
                    <div className="nav-left">
                        <div className="brand">
                            <svg id="logo-dark" width="226" height="25" viewBox="0 0 226 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M222.95 18.8393V19.1752H222V21.66H221.614V19.1752H220.663V18.8393H222.95Z" fill="#7C9ABF"></path>
                                <path d="M223.292 18.8393H223.839L224.65 21.2243L225.456 18.8393H226V21.66H225.635V19.9952C225.635 19.9374 225.636 19.8426 225.639 19.7094C225.641 19.5753 225.642 19.4335 225.642 19.2806L224.837 21.66H224.458L223.645 19.2806V19.3668C223.645 19.4362 223.647 19.5411 223.651 19.6829C223.655 19.8247 223.657 19.9284 223.657 19.9952V21.66H223.292V18.8393H223.292Z" fill="#7C9ABF"></path>
                                <path d="M78.1598 8.79556C78.417 8.79556 78.5454 8.94276 78.49 9.18114L78.2153 10.8164C78.1598 11.0551 77.9942 11.202 77.737 11.202H68.6244L68.1101 13.9943H75.79C76.0472 13.9943 76.1944 14.1227 76.1387 14.3799L75.863 15.9606C75.8261 16.1993 75.6428 16.3462 75.3857 16.3462H67.7057L67.1914 19.2488H76.3041C76.5797 19.2488 76.6896 19.396 76.6527 19.6343L76.3595 21.2696C76.3225 21.5083 76.1569 21.6552 75.8997 21.6552H64.2147C63.9391 21.6552 63.8291 21.508 63.8661 21.2696L65.9972 9.18054C66.0517 8.94187 66.1989 8.79497 66.4745 8.79497H78.1595L78.1598 8.79556Z" fill="white"></path>
                                <path d="M92.7855 19.1939H85.8409L83.5924 23.1066C83.464 23.3647 83.2798 23.4746 82.9857 23.4746H80.5975C80.3588 23.4746 80.2858 23.2905 80.4318 23.0703L88.9276 9.16267C89.0736 8.90552 89.2578 8.79556 89.5703 8.79556H92.6931C93.0057 8.79556 93.1344 8.90552 93.2083 9.16267L96.441 21.2517C96.4964 21.4719 96.3865 21.6561 96.1654 21.6561H93.8325C93.52 21.6561 93.3728 21.5461 93.3182 21.289L92.7855 19.1939ZM87.2554 16.8426H92.216L90.7649 11.0181L87.2557 16.8426H87.2554Z" fill="white"></path>
                                <path d="M107.212 11.2026C105.853 11.2026 105.54 11.4413 105.338 12.5807L104.401 17.8715C104.364 18.1102 104.328 18.2943 104.328 18.4597C104.328 19.1024 104.695 19.2496 105.779 19.2496H110.647C111.273 19.2496 111.585 18.974 111.677 18.4043L111.971 16.8244H108.81C108.535 16.8244 108.425 16.6772 108.462 16.4389L108.737 14.8775C108.792 14.6194 108.958 14.4722 109.215 14.4722H114.855C115.131 14.4722 115.241 14.6194 115.204 14.8775L114.505 18.7902C114.138 20.9037 113.771 21.6567 111.015 21.6567H103.85C102.067 21.6567 101.204 20.9955 101.204 19.544C101.204 19.2869 101.223 19.0113 101.277 18.7172L102.509 11.7357C102.858 9.71451 103.464 8.79616 106.109 8.79616H113.275C115.093 8.79616 115.865 9.31046 115.865 10.6886C115.865 10.9827 115.846 11.2944 115.773 11.6627L115.608 12.5071C115.553 12.7643 115.388 12.9115 115.13 12.9115H113.072C112.797 12.9115 112.668 12.7643 112.724 12.5071L112.815 12.0482C112.834 11.9743 112.834 11.8826 112.834 11.8271C112.834 11.4055 112.595 11.2029 112.081 11.2029H107.212L107.212 11.2026Z" fill="white"></path>
                                <path d="M123.896 19.2493H132.273C132.549 19.2493 132.659 19.3965 132.623 19.6349L132.329 21.2702C132.292 21.5089 132.127 21.6558 131.869 21.6558H120.919C120.644 21.6558 120.534 21.5086 120.571 21.2702L122.702 9.18114C122.756 8.94246 122.903 8.79556 123.179 8.79556H125.329C125.586 8.79556 125.733 8.94276 125.678 9.18114L123.896 19.2493H123.896Z" fill="white"></path>
                                <path d="M151.624 8.79556C151.881 8.79556 152.01 8.94276 151.955 9.18114L151.679 10.8164C151.624 11.0551 151.458 11.202 151.201 11.202H142.089L141.574 13.9943H149.254C149.511 13.9943 149.659 14.1227 149.603 14.3799L149.327 15.9606C149.29 16.1993 149.107 16.3462 148.85 16.3462H141.17L140.656 19.2488H149.768C150.044 19.2488 150.154 19.396 150.117 19.6343L149.823 21.2696C149.787 21.5083 149.621 21.6552 149.364 21.6552H137.679C137.403 21.6552 137.293 21.508 137.33 21.2696L139.461 9.18054C139.516 8.94187 139.663 8.79497 139.939 8.79497H151.624L151.624 8.79556Z" fill="white"></path>
                                <path d="M160.444 21.6561C160.131 21.6561 159.984 21.5461 159.929 21.289L157.008 9.19991C156.953 8.97971 157.081 8.79556 157.32 8.79556H159.598C159.929 8.79556 160.058 8.90552 160.114 9.16267L162.355 19.2863L168.257 9.16267C168.404 8.90552 168.569 8.79556 168.882 8.79556H171.289C171.527 8.79556 171.582 8.97971 171.454 9.19991L164.192 21.289C164.063 21.5461 163.898 21.6561 163.586 21.6561H160.444Z" fill="#7C9ABF"></path>
                                <path d="M177.432 21.2705C177.395 21.5092 177.212 21.6561 176.954 21.6561H174.805C174.53 21.6561 174.42 21.5089 174.456 21.2705L176.587 9.18145C176.642 8.94277 176.789 8.79587 177.065 8.79587H179.215C179.472 8.79587 179.619 8.94307 179.563 9.18145L177.432 21.2705Z" fill="#7C9ABF"></path>
                                <path d="M198.432 8.79556C198.689 8.79556 198.818 8.94276 198.763 9.18114L198.487 10.8164C198.432 11.0551 198.266 11.202 198.009 11.202H188.897L188.382 13.9943H196.062C196.319 13.9943 196.467 14.1227 196.411 14.3799L196.135 15.9606C196.098 16.1993 195.915 16.3462 195.658 16.3462H187.978L187.464 19.2488H196.576C196.852 19.2488 196.962 19.396 196.925 19.6343L196.631 21.2696C196.595 21.5083 196.429 21.6552 196.172 21.6552H184.487C184.211 21.6552 184.101 21.508 184.138 21.2696L186.269 9.18054C186.324 8.94187 186.471 8.79497 186.747 8.79497H198.432L198.432 8.79556Z" fill="#7C9ABF"></path>
                                <path d="M213.575 21.6561C213.281 21.6561 213.153 21.5276 213.116 21.2705L212.381 12.2124L208.449 21.2705C208.358 21.5276 208.173 21.6561 207.88 21.6561H204.463C204.187 21.6561 204.021 21.5276 204.004 21.2705L202.754 9.18144C202.735 8.94276 202.864 8.79586 203.121 8.79586H205.344C205.638 8.79586 205.785 8.92429 205.785 9.18144L206.667 19.2312L210.984 9.18144C211.095 8.92429 211.278 8.79586 211.572 8.79586H214.346C214.64 8.79586 214.787 8.92429 214.806 9.18144L215.559 19.2496L220.978 6.83579C221.088 6.57864 221.291 6.45022 221.584 6.45022H223.862C224.102 6.45022 224.193 6.59742 224.083 6.83579L217.561 21.2705C217.47 21.5276 217.286 21.6561 216.993 21.6561H213.575H213.575Z" fill="#7C9ABF"></path>
                                <path d="M31.404 24.3852H31.7529H40.5714L36.8867 18.9746C42.5047 22.1254 48.1864 19.1248 48.1953 19.1311C47.6405 18.761 45.6837 17.8751 42.7371 16.6188C46.6489 17.0703 52.5669 17.0077 53.67 14.851L46.2228 12.6698C54.2215 13.823 58.8604 12.469 60.139 8.60725H47.8774C57.7209 8.10636 62.8103 5.40374 63.1464 0.5L34.8333 9.31017C34.7079 9.86052 34.5738 10.7544 34.5404 12.1242C34.485 14.3963 32.6578 15.792 32.6578 15.792C32.4469 17.8903 32.0899 18.3185 31.8995 18.6576C31.7818 18.8674 31.6266 19.014 31.5732 19.014C31.5199 19.014 31.3646 18.8674 31.2469 18.6576C31.0565 18.3185 30.6996 17.8903 30.4886 15.792C30.4886 15.792 28.6614 14.3963 28.606 12.1242C28.5726 10.7547 28.4385 9.86052 28.3131 9.31017L0 0.500298C0.336113 5.40434 5.42549 8.10665 15.269 8.60755H3.00744C4.28604 12.4693 8.92488 13.8233 16.9237 12.6701L9.47643 14.8513C10.5798 17.008 16.4979 17.0706 20.4094 16.6191C17.4627 17.8754 15.5059 18.7613 14.9511 19.1314C14.96 19.1254 20.6418 22.1257 26.2598 18.9749L22.575 24.3855H31.7425" fill="#3b82f6"></path>
                            </svg>
                        </div>
                        <nav className="nav-links">
                            <span>Products</span>
                            <span>Solutions</span>
                            <span>Developer</span>
                            <span>Resources</span>
                        </nav>
                    </div>
                    <div className="nav-right">
                        <div className="header-search-container">
                            <input
                                type="text"
                                className="header-search-input"
                                placeholder="Search"
                            // value={query}
                            // onChange={(e) => setQuery(e.target.value)}
                            />
                            <svg className="header-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <div className="header-right-links">
                            <span>Talk To Us</span>
                            <span>Buy</span>
                            <span>Login</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="dashboard-container">
                <header className="header">
                    <h1>Course Admin Dashboard</h1>
                    <button
                        onClick={handleUndo}
                        disabled={undoStack.length === 0}
                        className="btn btn-orange"
                    >
                        Undo Last Action ({undoStack.length})
                    </button>
                </header>

                <div className="main-grid">
                    {/* Sidebar */}
                    <aside className="card sidebar-container">
                        <h2 className="section-title">Courses</h2>
                        <div className="search-box">
                            <input
                                type="text"
                                className="input"
                                placeholder="Search title or instructor..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <select
                                className="input"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div style={{ position: 'relative', minHeight: '400px' }}>
                            <table className="table sidebar-table">
                                <thead>
                                    <tr><th>Course</th><th>Enrolled</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {loading.courses && courses.length === 0 ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i}>
                                                <td><div className="skeleton skeleton-row" style={{ width: '80%' }}></div></td>
                                                <td><div className="skeleton skeleton-row" style={{ width: '40%' }}></div></td>
                                                <td><div className="skeleton skeleton-row" style={{ width: '60%' }}></div></td>
                                            </tr>
                                        ))
                                    ) : courses.length === 0 && query.trim() !== '' ? (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>No data found</div>
                                                <div style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting your search or filters</div>
                                            </td>
                                        </tr>
                                    ) : courses.length === 0 ? null : (
                                        courses.map(c => (
                                            <tr
                                                key={c.id}
                                                className={`row-clickable ${selectedCourse?.id === c.id ? 'row-active' : ''}`}
                                                onClick={() => setSelectedCourse(c)}
                                            >
                                                <td style={{ paddingRight: '12px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginBottom: '4px', lineHeight: 1.2, wordBreak: 'break-word' }}>{c.title}</div>
                                                    <div style={{ fontSize: '13px', color: '#6b7280', wordBreak: 'break-word' }}>{c.instructor}</div>
                                                </td>
                                                <td style={{ fontWeight: 500, color: '#111827' }}>{c.enrolled} / {c.capacity}</td>
                                                <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {errors.courses && (
                                <div className="overlay" style={{ background: 'rgba(255,255,255,0.95)', flexDirection: 'column', gap: '12px', zIndex: 10 }}>
                                    <div style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>{errors.courses}</div>
                                    <button className="btn btn-primary btn-sm" onClick={() => setRetryTrigger(prev => prev + 1)}>Retry</button>
                                </div>
                            )}
                            {loading.courses && courses.length > 0 && <div className="overlay" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '0 0 8px 8px' }}><div className="spinner"></div></div>}
                        </div>
                    </aside>

                    {/* Detail View */}
                    <main className="card">
                        {!selectedCourse ? (
                            <div className="empty-state">
                                <img src="./empty_state.png" alt="Empty State" />
                                <h3>Select a Course</h3>
                                <p>Click on any course in the sidebar to view detailed metrics, enrollments, and manage status.</p>
                            </div>
                        ) : (
                            <div>
                                <div className="detail-header">
                                    <div>
                                        <h2 style={{ margin: 0, fontWeight: 700 }}>{selectedCourse.title}</h2>
                                        <div style={{ color: '#6b7280', marginTop: '6px', fontSize: '14px' }}>{selectedCourse.category} • {selectedCourse.instructor}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-primary"
                                            disabled={selectedCourse.status === 'published'}
                                            onClick={() => handleStatusChange('published')}
                                        >
                                            Publish
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            disabled={selectedCourse.status === 'archived'}
                                            onClick={() => handleStatusChange('archived')}
                                        >
                                            Archive
                                        </button>
                                    </div>
                                </div>

                                {errors.detail && (
                                    <div style={{ background: errors.detail.includes('archived') ? '#f3f4f6' : '#fef2f2', border: errors.detail.includes('archived') ? '1px solid #e5e7eb' : '1px solid #fecaca', padding: '16px', borderRadius: '4px', margin: '20px 0', textAlign: 'center' }}>
                                        <div style={{ color: errors.detail.includes('archived') ? '#374151' : '#991b1b', marginBottom: '8px' }}>{errors.detail}</div>
                                        {!errors.detail.includes('archived') && <button className="btn btn-outline" onClick={() => setRetryTrigger(prev => prev + 1)}>Retry Loading Details</button>}
                                    </div>
                                )}

                                <div className="info-bar">
                                    <div className="info-item"><b>Price:</b> ${selectedCourse.price}</div>
                                    <div className="info-item"><b>Timeline:</b> {selectedCourse.startDate} to {selectedCourse.endDate}</div>
                                </div>

                                <div className="detail-body">
                                    <div className="detail-desc" dangerouslySetInnerHTML={{ __html: selectedCourse.description }} />

                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <div className="stat-label">Total Revenue</div>
                                            {!analytics ? (
                                                <div className="skeleton skeleton-text" style={{ marginTop: '8px' }}></div>
                                            ) : (
                                                <div className="stat-value">${analytics.totalRevenue}</div>
                                            )}
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">Completion Rate</div>
                                            {!analytics ? (
                                                <div className="skeleton skeleton-text" style={{ marginTop: '8px' }}></div>
                                            ) : (
                                                <div className="stat-value">{analytics.completionRate}%</div>
                                            )}
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">Average Grade</div>
                                            {!analytics ? (
                                                <div className="skeleton skeleton-text" style={{ marginTop: '8px' }}></div>
                                            ) : (
                                                <div className="stat-value">{analytics.avgGrade || 'N/A'}</div>
                                            )}
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">Last Sink</div>
                                            {!analytics ? (
                                                <div className="skeleton skeleton-text" style={{ marginTop: '8px' }}></div>
                                            ) : (
                                                <>
                                                    <div className="stat-value" style={{ fontSize: '14px', paddingTop: '8px' }}>{lastUpdated || '--'}</div>
                                                    {errors.stats && <div style={{ color: 'red', fontSize: '10px' }}>Refresher offline</div>}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="enroll-section">
                                        <div className="enroll-controls">
                                            <h3 style={{ margin: 0 }}>Enrollments ({enrollments.length})</h3>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {errors.action && <div style={{ color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', marginRight: '8px' }}>{errors.action}</div>}
                                                <button className="btn btn-outline" disabled={selectedStudents.size === 0 || loading.action} onClick={() => handleBulkAction('approve')}>Approve</button>
                                                <button className="btn btn-outline" disabled={selectedStudents.size === 0 || loading.action} onClick={() => handleBulkAction('drop')}>Drop</button>
                                            </div>
                                        </div>
                                        {enrollStatus && (
                                            <div style={{ background: enrollStatus.includes('Waitlisted') ? '#fff7ed' : '#f0fdf4', color: enrollStatus.includes('Waitlisted') ? '#c2410c' : '#15803d', padding: '10px 16px', borderRadius: '4px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 500, border: enrollStatus.includes('Waitlisted') ? '1px solid #ffedd5' : '1px solid #dcfce7' }}>
                                                <span>{enrollStatus}</span>
                                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }} onClick={() => setEnrollStatus(null)}>✕</button>
                                            </div>
                                        )}

                                        <div style={{ position: 'relative', minHeight: '300px', border: '1px solid #eee', borderRadius: '4px' }}>
                                            <table className="table">
                                                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1, boxShadow: '0 1px 0 #eee' }}>
                                                    <tr>
                                                        <th style={{ width: '40px' }}><input type="checkbox" onChange={(e) => setSelectedStudents(e.target.checked ? new Set(enrollments.map(en => en.id)) : new Set())} /></th>
                                                        <th>Student</th>
                                                        <th style={{ width: '100px' }}>Status</th>
                                                        <th style={{ width: '60px' }}>Result</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loading.detail && enrollments.length === 0 ? (
                                                        [1, 2, 3, 4, 5, 6].map(i => (
                                                            <tr key={i}>
                                                                <td><div className="skeleton skeleton-row" style={{ width: '20px' }}></div></td>
                                                                <td><div className="skeleton skeleton-row" style={{ width: '80%' }}></div></td>
                                                                <td><div className="skeleton skeleton-row" style={{ width: '40%' }}></div></td>
                                                                <td><div className="skeleton skeleton-row" style={{ width: '20px' }}></div></td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        enrollments.map(e => (
                                                            <tr key={e.id}>
                                                                <td><input type="checkbox" checked={selectedStudents.has(e.id)} onChange={() => {
                                                                    const next = new Set(selectedStudents);
                                                                    if (next.has(e.id)) next.delete(e.id); else next.add(e.id);
                                                                    setSelectedStudents(next);
                                                                }} /></td>
                                                                <td>{e.studentName}</td>
                                                                <td><span style={{ fontSize: '12px' }}>{e.status}</span></td>
                                                                <td>{bulkResults[e.id] && (res => <span style={{ color: res.success ? 'green' : 'red', fontSize: '11px' }}>{res.success ? '✓' : '✗'}</span>)(bulkResults[e.id])}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                            {loading.detail && enrollments.length > 0 && <div className="overlay" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '0 0 4px 4px' }}><div className="spinner"></div></div>}
                                        </div>

                                        <div className="enroll-form">
                                            <h4 style={{ margin: '0 0 16px 0' }}>Manually Enroll Student</h4>
                                            <form onSubmit={handleEnroll} style={{ display: 'flex', gap: '12px' }}>
                                                <input type="text" className="input" style={{ flex: 1 }} placeholder="Name" value={enrollForm.name} onChange={e => setEnrollForm(p => ({ ...p, name: e.target.value }))} required />
                                                <input type="email" className="input" style={{ flex: 1 }} placeholder="Email" value={enrollForm.email} onChange={e => setEnrollForm(p => ({ ...p, email: e.target.value }))} required />
                                                <button className="btn btn-primary" type="submit">Enroll</button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
