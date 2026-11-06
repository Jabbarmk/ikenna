const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9',
  leads: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1M19 8v4m2-2h-4',
  clients: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9 10v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75',
  quotations: 'M8 3h8l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v4h4M9 13h6M9 17h6M9 9h2',
  stock: 'm21 8-9-5-9 5 9 5 9-5Zm0 0v8l-9 5m9-13-9 5m0 8-9-5V8m9 13V8',
  suppliers: 'M3 17h2l1-5h9l2 5h2M6 12V7a1 1 0 0 1 1-1h6l3 4M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  purchases: 'M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h7.2a2 2 0 0 0 2-1.6L21 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  sales: 'M9 14h6M9 10h6M9 18h3M7 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm8 0v4h4',
  returns: 'M3 10h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H9M3 10l4-4M3 10l4 4',
  accounts: 'M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7Zm0 0 1-3h14l1 3M12 11a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  reports: 'M4 20V10m6 10V4m6 16v-7',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a7.98 7.98 0 0 0-.2-1.8l2-1.6-2-3.4-2.4.8a8.1 8.1 0 0 0-3.1-1.8L14 2h-4l-.3 2.4a8.1 8.1 0 0 0-3.1 1.8l-2.4-.8-2 3.4 2 1.6A7.98 7.98 0 0 0 4 12c0 .6.1 1.2.2 1.8l-2 1.6 2 3.4 2.4-.8a8.1 8.1 0 0 0 3.1 1.8L10 22h4l.3-2.4a8.1 8.1 0 0 0 3.1-1.8l2.4.8 2-3.4-2-1.6c.1-.6.2-1.2.2-1.8Z',
  logout: 'M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9',
  search: 'm21 21-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  close: 'M18 6 6 18M6 6l12 12',
  chevronRight: 'm9 18 6-6-6-6',
  plus: 'M12 5v14M5 12h14',
  edit: 'M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5M18.5 2.5a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5Z',
  trash: 'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m-9 0v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6H7Zm3 5v6m4-6v6',
  alert: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a1.8 1.8 0 0 0 1.6 2.7h17.2a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z',
  check: 'm5 13 4 4L19 7',
  money: 'M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7Zm8 2v8m-3-3a3 3 0 0 0 6 0',
  trend: 'm3 17 6-6 4 4 8-8M15 7h6v6',
  box: 'm21 8-9-5-9 5 9 5 9-5Zm0 0v8l-9 5m9-13-9 5m0 8-9-5V8m9 13V8',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  bell: 'M10 21h4M6 8a6 6 0 1 1 12 0c0 4.5 1.5 6 2 7H4c.5-1 2-2.5 2-7Z',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a13.2 13.2 0 0 1-3.1 3.6M6.1 6.1C3.4 7.9 1 12 1 12a13.1 13.1 0 0 0 5 5.3',
  download: 'M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
};

export default function Icon({ name, className = 'w-5 h-5', strokeWidth = 1.8 }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
