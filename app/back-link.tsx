import Link from "next/link";

export function BackLink() {
  return (
    <Link
      className="inline-flex w-fit items-center gap-1.5 rounded-lg font-medium text-indigo-600 transition hover:text-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
      href="/"
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
      </svg>
      Back
    </Link>
  );
}
