export interface GoogleIdentity {
  googleAccountId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface IGoogleVerifier {
  verify(credential: string): Promise<GoogleIdentity | null>;
}
