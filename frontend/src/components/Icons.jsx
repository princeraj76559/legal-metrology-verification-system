import React from "react";

export function Icon({ name, size = 20, className = "", color = "currentColor", ...props }) {
  const strokeWidth = 2;
  const stroke = color;
  const fill = "none";

  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
      </svg>
    ),
    product: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
    instruments: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    applications: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    newApplication: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    certificates: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    users: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    audit: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    jobs: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    history: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    profile: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    logout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    info: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    brandLogo: (
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
        <circle cx="17" cy="17" r="16" fill="#1A1D1F" />
        <path d="M17 1V33M1 17H33" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.4" />
        <path d="M17 1A16 16 0 0 1 33 17H17V1Z" fill="#33383F" />
        <path d="M1 17A16 16 0 0 1 17 33V17H1Z" fill="#33383F" />
      </svg>
    ),
    /* ── Tailored Metric Visual Badges ── */
    metricInstruments: (
      <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
        <rect x="2" y="16" width="6" height="10" rx="2" fill="#E8F3FF" stroke="#2A85FF" strokeWidth="1.5" />
        <rect x="12" y="10" width="6" height="16" rx="2" fill="#E8F3FF" stroke="#2A85FF" strokeWidth="1.5" />
        <rect x="22" y="4" width="6" height="22" rx="2" fill="#2A85FF" stroke="#2A85FF" strokeWidth="1.5" />
        <rect x="32" y="8" width="6" height="18" rx="2" fill="#E8F3FF" stroke="#2A85FF" strokeWidth="1.5" />
        <rect x="42" y="12" width="4" height="14" rx="2" fill="#E8F3FF" stroke="#2A85FF" strokeWidth="1.5" />
      </svg>
    ),
    metricApplications: (
      <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
        <path d="M4 14C12 6 20 22 28 14C36 6 40 18 46 10" stroke="#7F56D9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="28" cy="14" r="3" fill="#7F56D9" />
      </svg>
    ),
    metricCertificates: (
      <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
        <path d="M4 20C12 20 16 26 24 26C32 26 36 6 42 6C45 6 46 12 47 12" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="42" cy="6" r="3" fill="#10B981" />
      </svg>
    ),
    metricJobs: (
      <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
        <rect x="4" y="6" width="40" height="16" rx="8" fill="#F4F5F6" stroke="#1A1D1F" strokeWidth="1.5" />
        <circle cx="16" cy="14" r="4" fill="#2A85FF" />
        <circle cx="28" cy="14" r="4" fill="#E6E8EC" />
        <circle cx="38" cy="14" r="4" fill="#E6E8EC" />
      </svg>
    ),
    metricCompleted: (
      <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
        <path d="M6 14L16 24L42 4" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    metricUsers: (
      <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
        <circle cx="16" cy="12" r="6" stroke="#2A85FF" strokeWidth="2" />
        <circle cx="32" cy="12" r="6" stroke="#7F56D9" strokeWidth="2" />
        <path d="M6 26C6 21 10 18 16 18C22 18 26 21 26 26" stroke="#2A85FF" strokeWidth="2" strokeLinecap="round" />
        <path d="M26 18C30 18 36 19 42 26" stroke="#7F56D9" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    metricAlert: (
      <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
        <path d="M24 4L42 24H6L24 4Z" stroke="#FF6A55" strokeWidth="2" strokeLinejoin="round" fill="#FFECE5" />
        <line x1="24" y1="11" x2="24" y2="17" stroke="#FF6A55" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="20" r="1" fill="#FF6A55" />
      </svg>
    ),
    metricCalendar: (
      <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
        <rect x="8" y="4" width="32" height="22" rx="4" stroke="#D97706" strokeWidth="2" fill="#FFF4E5" />
        <line x1="8" y1="10" x2="40" y2="10" stroke="#D97706" strokeWidth="2" />
        <circle cx="16" cy="16" r="2" fill="#D97706" />
        <circle cx="24" cy="16" r="2" fill="#D97706" />
        <circle cx="32" cy="16" r="2" fill="#D97706" />
      </svg>
    ),
  };

  return icons[name] || null;
}
