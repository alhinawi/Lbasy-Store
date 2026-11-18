const enc = new TextEncoder();
const hex = (b: ArrayBuffer | Uint8Array) =>
  Array.from(b instanceof Uint8Array ? b : new Uint8Array(b), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
export const randomToken = () =>
  hex(crypto.getRandomValues(new Uint8Array(32)));
export const hashToken = async (token: string) =>
  hex(await crypto.subtle.digest("SHA-256", enc.encode(token)));
export async function hashPassword(password: string, salt = randomToken()) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 100000,
      salt: enc.encode(salt),
    },
    key,
    256,
  );
  return `pbkdf2-sha256$100000$${salt}$${hex(bits)}`;
}
export async function checkPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (
    parts.length !== 4 ||
    parts[0] !== "pbkdf2-sha256" ||
    parts[1] !== "100000"
  )
    return false;
  const actual = await hashPassword(password, parts[2]);
  let mismatch = actual.length ^ stored.length;
  for (let i = 0; i < actual.length; i++)
    mismatch |= actual.charCodeAt(i) ^ (stored.charCodeAt(i) || 0);
  return mismatch === 0;
}
