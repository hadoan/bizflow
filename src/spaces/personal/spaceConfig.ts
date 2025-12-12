export interface SpaceModule {
  id: string;
  label: string;
  enabled: boolean;
}

export interface SpaceUIConfig {
  showClients: boolean;
  showTaxReports: boolean;
  showInbox: boolean;
  showDocuments: boolean;
}

export interface SpaceFinanceConfig {
  supportsVAT: boolean;
  isDefaultCountryDE: boolean;
  defaultCurrency: string;
}

export interface SpaceConfig {
  id: string;
  label: string;
  description: string;
  enabledModules: string[];
  finance: SpaceFinanceConfig;
  ui: SpaceUIConfig;
}

export const personalSpaceConfig: SpaceConfig = {
  id: "personal",
  label: "Bizflow Personal",
  description: "AI back office for a 1-person business in Germany",
  enabledModules: ["finance", "crm", "tasks"],
  finance: {
    supportsVAT: true,
    isDefaultCountryDE: true,
    defaultCurrency: "EUR",
  },
  ui: {
    showClients: true,
    showTaxReports: true,
    showInbox: true,
    showDocuments: true,
  },
};

export function getSpaceConfig(spaceType: string): SpaceConfig {
  switch (spaceType.toLowerCase()) {
    case "personal":
      return personalSpaceConfig;
    default:
      return personalSpaceConfig;
  }
}
