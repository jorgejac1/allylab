export interface SSOAttributeMapping {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface SSOConfig {
  enabled: boolean;
  provider: 'saml' | 'oidc';
  entityId: string;
  ssoUrl: string;
  certificate: string;
  signatureAlgorithm: 'sha256' | 'sha512';
  nameIdFormat: string;
  attributeMapping: SSOAttributeMapping;
  metadataUrl?: string;
}

export interface SSOConnection {
  id: string;
  organizationId: string;
  config: SSOConfig;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt?: string;
  lastTestedAt?: string;
  testResult?: { success: boolean; message: string };
}

export const DEFAULT_SSO_CONFIG: SSOConfig = {
  enabled: false,
  provider: 'saml',
  entityId: '',
  ssoUrl: '',
  certificate: '',
  signatureAlgorithm: 'sha256',
  nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  attributeMapping: {
    email: 'email',
    firstName: 'firstName',
    lastName: 'lastName',
    role: 'role',
  },
};
