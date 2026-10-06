// Ícones de traço usados na landing (mesmo estilo: 24x24, traço 1.8, cor do texto).
type P = { className?: string };
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, "aria-hidden": true } as const;

export const IconeAlbum = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3 16 5-5 4 4 3-3 6 6" strokeLinejoin="round" />
    <circle cx="16" cy="9" r="1.5" />
  </svg>
);
export const IconeQr = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3m4 0v4h-4m0-4h-3v4" strokeLinejoin="round" />
  </svg>
);
export const IconeCelular = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <path d="M10.5 18.5h3" strokeLinecap="round" />
    <path d="M12 13V7m0 0-2.5 2.5M12 7l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconeDrive = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M3 18 9 7h6l6 11H3Z" strokeLinejoin="round" />
    <path d="M9 7l6 11M15 7 9 18" strokeLinejoin="round" />
  </svg>
);
export const IconeSemApp = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <path d="m4 4 16 16" strokeLinecap="round" />
  </svg>
);
export const IconeSemLogin = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c1-3.5 3.8-5.5 7-5.5s6 2 7 5.5" strokeLinecap="round" />
    <path d="m4 4 16 16" strokeLinecap="round" />
  </svg>
);
export const IconeQualidade = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16l-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3Z" strokeLinejoin="round" />
  </svg>
);
export const IconeRetomar = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconePainel = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 13h3m-3 3h6" strokeLinecap="round" />
  </svg>
);
export const IconeMensagem = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 5h16v11H9l-5 4V5Z" strokeLinejoin="round" />
    <path d="M8 9.5h8M8 12.5h5" strokeLinecap="round" />
  </svg>
);
export const IconeImpressao = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M7 8V3h10v5M7 17H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7h-3" strokeLinejoin="round" />
    <rect x="7" y="14" width="10" height="7" rx="1" />
  </svg>
);
export const IconeEmail = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6 8.5 7 8.5-7" strokeLinejoin="round" />
  </svg>
);
export const IconeTelao = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="2.5" y="4" width="19" height="12.5" rx="1.5" />
    <path d="M8 20h8M12 16.5V20" strokeLinecap="round" />
  </svg>
);
export const IconeCadeado = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);
export const IconePasta = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" strokeLinejoin="round" />
  </svg>
);
export const IconeCheck = ({ className }: P) => (
  <svg {...base} strokeWidth={2.4} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconeSeta = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M5 12h14m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
