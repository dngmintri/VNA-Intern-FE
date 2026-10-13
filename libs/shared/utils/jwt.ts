export interface DecodedToken {
  sub: number;
  username: string;
  accountType: string;
  roleCode: string | null;
  permissions: string[];
  exp?: number;
  iat?: number;
}

export function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    const raw = typeof window === 'undefined'
      ? Buffer.from(base64, 'base64').toString('utf-8')
      : atob(base64);

    const jsonPayload = decodeURIComponent(
      raw
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as DecodedToken;
  } catch (error) {
    return null;
  }
}
