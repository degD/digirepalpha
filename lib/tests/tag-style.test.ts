import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tagClassName } from "../tag-style";

describe("tagClassName", () => {
  it("uses fixed colors for known tags", () => {
    assert.equal(
      tagClassName("jazz"),
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    );
    assert.equal(
      tagClassName("blues"),
      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    );
    assert.equal(
      tagClassName("rock"),
      "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300",
    );
  });

  it("is case insensitive for known tags", () => {
    assert.equal(tagClassName("JAZZ"), tagClassName("jazz"));
  });

  it("assigns a stable color to other tags", () => {
    const colored = tagClassName("practice");

    assert.equal(tagClassName("practice"), colored);
    assert.equal(tagClassName("PRACTICE"), colored);
    assert.match(
      colored,
      /^bg-\w+-100 text-\w+-700 dark:bg-\w+-950 dark:text-\w+-300$/,
    );
  });

  it("does not use the neutral color for other tags", () => {
    assert.notEqual(tagClassName("practice"), "bg-zinc-100 text-zinc-600");
  });
});
