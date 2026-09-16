import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  loadPreferences,
  PREFERENCES_STORAGE_KEY,
  savePreferences,
  type PreferencesStorage,
} from "../preferences";

function createStorage(initialValue: string | null = null): PreferencesStorage {
  let value = initialValue;

  return {
    getItem: (key) => (key === PREFERENCES_STORAGE_KEY ? value : null),
    setItem: (key, newValue) => {
      if (key === PREFERENCES_STORAGE_KEY) {
        value = newValue;
      }
    },
  };
}

describe("preferences storage", () => {
  it("defaults to the light color scheme", () => {
    assert.deepEqual(loadPreferences(createStorage()), { colorScheme: "light" });
  });

  it("round-trips a saved color scheme", () => {
    const storage = createStorage();

    savePreferences({ colorScheme: "dark" }, storage);

    assert.deepEqual(loadPreferences(storage), { colorScheme: "dark" });
  });

  it("falls back to defaults for missing or malformed data", () => {
    for (const value of ["", "not json", "[]", "null", "42", '"dark"']) {
      assert.deepEqual(loadPreferences(createStorage(value)), {
        colorScheme: "light",
      });
    }
  });

  it("ignores an unknown color scheme", () => {
    const storage = createStorage(JSON.stringify({ colorScheme: "sepia" }));

    assert.deepEqual(loadPreferences(storage), { colorScheme: "light" });
  });

  it("survives storage read and write failures", () => {
    const failingStorage: PreferencesStorage = {
      getItem: () => {
        throw new Error("unavailable");
      },
      setItem: () => {
        throw new Error("unavailable");
      },
    };

    assert.deepEqual(loadPreferences(failingStorage), { colorScheme: "light" });
    assert.doesNotThrow(() =>
      savePreferences({ colorScheme: "dark" }, failingStorage),
    );
  });
});
