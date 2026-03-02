import { createHmac } from "crypto";

function getSecret() {
  return process.env.JWT_SECRET || "fallback-dev-secret";
}

export function makeAccessToken(tournamentId: string, viewPassword: string) {
  return createHmac("sha256", getSecret())
    .update(`${tournamentId}:${viewPassword}`)
    .digest("hex");
}

export function verifyAccessToken(
  tournamentId: string,
  viewPassword: string,
  token: string
) {
  const expected = makeAccessToken(tournamentId, viewPassword);
  return expected === token;
}
