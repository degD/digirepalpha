const defaultTagClassName = "bg-zinc-100 text-zinc-600";

const tagClassNames: Record<string, string> = {
  jazz: "bg-violet-100 text-violet-700",
  blues: "bg-blue-100 text-blue-700",
  rock: "bg-red-100 text-red-600",
};

export function tagClassName(tag: string): string {
  return tagClassNames[tag.toLowerCase()] ?? defaultTagClassName;
}
