const tagClassNames: Record<string, string> = {
  jazz: "bg-violet-100 text-violet-700",
  blues: "bg-blue-100 text-blue-700",
  rock: "bg-red-100 text-red-600",
};

const tagPalette = [
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
  "bg-orange-100 text-orange-700",
  "bg-sky-100 text-sky-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-lime-100 text-lime-700",
  "bg-rose-100 text-rose-700",
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
