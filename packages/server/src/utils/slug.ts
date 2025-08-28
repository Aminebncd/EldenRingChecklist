export async function slugifyUnique(
  title: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(title);
  if (!(await exists(base))) return base;

  let i = 2;
  // try incrementing suffixes until available
  while (await exists(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function slugify(input: string): string {
  const s = (input || '')
    .toLowerCase()
    // split accented characters into base + diacritics, then remove diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // replace non alphanumeric with dashes
    .replace(/[^a-z0-9]+/g, '-')
    // trim leading/trailing dashes
    .replace(/^-+|-+$/g, '');

  return s.length ? s : 'item';
}

export default slugifyUnique;

