export function formatAmount(mistVal: string | number | bigint): string {
  const mist = typeof mistVal === "string" ? parseFloat(mistVal) : Number(mistVal);
  if (isNaN(mist) || mist === 0) return "0.00 SUI";
  const sui = mist / 1_000_000_000;
  return `${sui.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SUI`;
}

export function truncateId(id: string): string {
  if (!id) return "";
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}...${id.slice(-8)}`;
}

export function truncateDigest(digest: string): string {
  if (!digest) return "";
  if (digest.length <= 12) return digest;
  return `${digest.slice(0, 6)}...${digest.slice(-6)}`;
}
