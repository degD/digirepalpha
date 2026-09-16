const tagClassNames: Record<string, string> = {
  jazz: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  blues: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  rock: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300",
};

const tagPalette = [
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
];

function tagHash(tag: string): number {
  let hash = 0;

  for (let index = 0; index < tag.length; index += 1) {
    hash = (hash * 31 + tag.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function tagClassName(tag: string): string {
  const normalizedTag = tag.toLowerCase();

  return (
    tagClassNames[normalizedTag] ?? tagPalette[tagHash(normalizedTag) % tagPalette.length]
  );
}
