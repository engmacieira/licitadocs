export const APP_CONFIG = {
  name: 'LicitaDocs',
  version: 'v2.0.4',
  copyrightYear: new Date().getFullYear(),
  address: 'Braúnas, MG - Brasil',
} as const;

export const CONTACT_CONFIG = {
  supportEmail: 'suporte@licitadocs.com.br',
  whatsapp: {
    link: '5531999999999',
    display: '(31) 99999-9999',
  },
} as const;

export const PRICING_CONFIG = {
  plans: {
    PRO: {
      annualPrice: 178.80,
      monthlyEquivalent: 14.90,
    },
  },
} as const;

export const LEGAL_CONFIG = {
  termsOfUseUrl: '/termos',
  privacyPolicyUrl: '/privacidade',
} as const;
