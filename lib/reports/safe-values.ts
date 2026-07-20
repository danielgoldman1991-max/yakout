export function requiredNumber(value: unknown, label: string): number {
  if (value === null || value === undefined || value === "") {
    throw new Error(`Donnée numérique obligatoire indisponible : ${label}`);
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`Donnée numérique invalide : ${label}`);
  }

  return numberValue;
}

export function optionalNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    throw new Error("Donnée numérique absente : rapport non certifiable.");
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error("Donnée numérique invalide : rapport non certifiable.");
  }
  return numberValue;
}

export function optionalInteger(value: unknown): number {
  return Math.round(optionalNumber(value));
}
