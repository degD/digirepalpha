"use client";

import { history, historyKeymap, standardKeymap } from "@codemirror/commands";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { chordEditor, chordProtectedEditing } from "../../lib/chord-editor";
import { chordifySelection, transposeSongChords } from "../../lib/chord-format";
import { longPressWordSelection } from "../../lib/long-press-selection";
import {
  loadSongData,
  normalizeSongTags,
  saveSongData,
  type SongItem,
  updateSongMetadata,
  updateSongText,
} from "../../lib/song-data";
import { tagClassName } from "../../lib/tag-style";

const toolButtonClassName =
  "inline-flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus:outline-zinc-100";

function editorTheme(fontSize: number) {
  return EditorView.theme({
    "&": {
      flex: "1 1 auto",
      minHeight: "0",
      backgroundColor: "var(--editor-bg)",
      color: "var(--editor-fg)",
      border: "1px solid var(--editor-border)",
      borderRadius: "0.75rem",
      overflow: "hidden",
    },
    "&.cm-focused": {
      outline: "2px solid var(--color-indigo-500)",
      outlineOffset: "2px",
    },
    ".cm-content": {
      padding: "1rem",
      fontFamily: "inherit",
      fontSize: `${fontSize}px`,
      caretColor: "var(--editor-fg)",
    },
    ".cm-scroller": {
      flex: "1 1 0%",
      minHeight: "0",
      fontFamily: "inherit",
      overflow: "auto",
    },
    ".cm-selectionBackground": {
      backgroundColor: "var(--editor-selection)",
    },
    ".cm-content ::selection": {
      backgroundColor: "var(--editor-selection)",
    },
    ".digirep-chord": { color: "var(--chord-color)", fontWeight: "600" },
  });
}

function TransposeIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <ellipse cx="6" cy="17.5" fill="currentColor" rx="2.7" ry="2" stroke="none" />
      <path d="M8.7 17.5V5l3.3 1" />
      {direction === "down" ? (
        <path d="M14.5 12.5h6" strokeWidth="2.2" />
      ) : (
        <path d="M17.5 9.5v6M14.5 12.5h6" strokeWidth="2.2" />
      )}
    </svg>
  );
}

function ChordifyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M10.5 2.5 12.6 8l5.4 2.1-5.4 2.1-2.1 5.5-2.1-5.5L3 10.1 8.4 8z" />
      <path d="m18.5 13.5.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" />
    </svg>
  );
}

function FontSizeIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <span aria-hidden="true" className="flex items-center text-zinc-700 dark:text-zinc-200">
      <span className="text-base font-bold leading-none">A</span>
      <span className="ml-0.5 text-xs font-bold leading-none">
        {direction === "up" ? "+" : "−"}
      </span>
    </span>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function SongEditor({ songId }: { songId: number }) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView>(null);
  const fontSizeCompartment = useRef(new Compartment());
  const [fontSize, setFontSize] = useState(16);
  const [song, setSong] = useState<SongItem | null>();
  const [initialSongText, setInitialSongText] = useState<string>();
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [tagSelectKey, setTagSelectKey] = useState(0);
  const [metadataError, setMetadataError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (!cancelled) {
        const loadedSong =
          loadSongData().find((item) => item.id === songId) ?? null;

        setSong(loadedSong);
        setInitialSongText(loadedSong?.song);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [songId]);

  useEffect(() => {
    if (!editorContainerRef.current || initialSongText === undefined) {
      return;
    }

    const editorView = new EditorView({
      state: EditorState.create({
        doc: initialSongText,
        extensions: [
          history(),
          keymap.of([...standardKeymap, ...historyKeymap]),
          EditorView.lineWrapping,
          chordEditor,
          chordProtectedEditing,
          longPressWordSelection,
          EditorView.contentAttributes.of({ "aria-label": "Song text" }),
          fontSizeCompartment.current.of(editorTheme(16)),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) {
              return;
            }

            const currentSongData = loadSongData();
            saveSongData(
              updateSongText(currentSongData, songId, update.state.doc.toString()),
            );
          }),
        ],
      }),
      parent: editorContainerRef.current,
    });

    editorViewRef.current = editorView;

    return () => {
      editorView.destroy();
      editorViewRef.current = null;
    };
  }, [songId, initialSongText]);

  useEffect(() => {
    editorViewRef.current?.dispatch({
      effects: fontSizeCompartment.current.reconfigure(editorTheme(fontSize)),
    });
  }, [fontSize]);

  function handleChordify() {
    const editorView = editorViewRef.current;

    if (!editorView) {
      return;
    }

    const source = editorView.state.doc.toString();
    const selection = editorView.state.selection.main;
    const transformation = chordifySelection(source, {
      from: selection.from,
      to: selection.to,
    });

    if (transformation.source === source) {
      return;
    }

    editorView.dispatch({
      changes: { from: 0, to: source.length, insert: transformation.source },
      selection: {
        anchor: transformation.selection.from,
        head: transformation.selection.to,
      },
      userEvent: "input.chordify",
    });
    editorView.focus();
  }

  function handleTranspose(semitones: number) {
    const editorView = editorViewRef.current;

    if (!editorView) {
      return;
    }

    const source = editorView.state.doc.toString();
    const selection = editorView.state.selection.main;
    const transformation = transposeSongChords(
      source,
      { from: selection.from, to: selection.to },
      semitones,
    );

    if (transformation.source === source) {
      return;
    }

    editorView.dispatch({
      changes: { from: 0, to: source.length, insert: transformation.source },
      selection: {
        anchor: transformation.selection.from,
        head: transformation.selection.to,
      },
      userEvent: "input.transpose",
    });
    editorView.focus();
  }

  function handleEditMetadata() {
    if (!song) {
      return;
    }

    const songData = loadSongData();

    setTitleDraft(song.title);
    setSelectedTags(normalizeSongTags(song.tags));
    setNewTag("");
    setTagOptions(normalizeSongTags(songData.flatMap((item) => item.tags)));
    setTagSelectKey((key) => key + 1);
    setMetadataError("");
    setIsEditingMetadata(true);
  }

  function handleAddTag() {
    const tags = normalizeSongTags([...selectedTags, newTag]);

    setSelectedTags(tags);
    setNewTag("");
  }

  function handleSaveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const currentSongData = loadSongData();
      const updatedSongData = updateSongMetadata(
        currentSongData,
        songId,
        titleDraft,
        selectedTags,
      );
      const updatedSong = updatedSongData.find((item) => item.id === songId);

      if (!updatedSong) {
        throw new Error("This song no longer exists.");
      }

      saveSongData(updatedSongData);
      setSong(updatedSong);
      setIsEditingMetadata(false);
    } catch (error) {
      setMetadataError(
        error instanceof Error ? error.message : "Unable to save song details.",
      );
    }
  }

  if (song === undefined) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading song...</p>;
  }

  if (song === null) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Song not found.</p>;
  }

  const tags = normalizeSongTags(song.tags);

  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{song.title}</h1>
          {tags.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag}>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tagClassName(tag)}`}
                  >
                    {tag}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          className="h-10 shrink-0 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:outline-zinc-100"
          onClick={handleEditMetadata}
          type="button"
        >
          Edit
        </button>
      </header>
      <div aria-label="Editor tools" className="flex flex-wrap gap-3" role="toolbar">
        <button
          aria-label="Transpose -"
          className={toolButtonClassName}
          onClick={() => handleTranspose(-1)}
          type="button"
        >
          <TransposeIcon direction="down" />
        </button>
        <button
          aria-label="Transpose +"
          className={toolButtonClassName}
          onClick={() => handleTranspose(1)}
          type="button"
        >
          <TransposeIcon direction="up" />
        </button>
        <button
          aria-label="Chordify"
          className={toolButtonClassName}
          onClick={handleChordify}
          type="button"
        >
          <ChordifyIcon />
        </button>
        <button
          aria-label="Size -"
          className={toolButtonClassName}
          disabled={fontSize === 12}
          onClick={() => setFontSize((size) => size - 2)}
          type="button"
        >
          <FontSizeIcon direction="down" />
        </button>
        <button
          aria-label="Size +"
          className={toolButtonClassName}
          disabled={fontSize === 32}
          onClick={() => setFontSize((size) => size + 2)}
          type="button"
        >
          <FontSizeIcon direction="up" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col" ref={editorContainerRef} />
      {isEditingMetadata && (
        <div
          aria-labelledby="edit-song-details-title"
          aria-modal="true"
          className="fixed inset-0 z-10 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4 dark:bg-black/60"
          role="dialog"
        >
          <form
            className="w-full max-w-xl rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-zinc-900"
            onSubmit={handleSaveMetadata}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight" id="edit-song-details-title">
                Edit song details
              </h2>
              <button
                className="h-10 shrink-0 rounded-lg bg-zinc-100 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-200 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus:outline-zinc-100"
                onClick={() => setIsEditingMetadata(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
            <label
              className="mt-5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              htmlFor="song-title"
            >
              Title
            </label>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
              id="song-title"
              onChange={(event) => setTitleDraft(event.target.value)}
              value={titleDraft}
            />
            <label
              className="mt-5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              htmlFor="song-tag-select"
            >
              Tags
            </label>
            <select
              className="mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-900"
              defaultValue=""
              id="song-tag-select"
              key={tagSelectKey}
              onChange={(event) => {
                const tag = event.target.value;

                if (!tag) {
                  return;
                }

                setSelectedTags((tags) => normalizeSongTags([...tags, tag]));
                setTagSelectKey((key) => key + 1);
              }}
            >
              <option value="">Select an existing tag</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            {selectedTags.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Current selected tags">
                {selectedTags.map((tag) => (
                  <li key={tag}>
                    <button
                      aria-label={`Remove ${tag}`}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${tagClassName(tag)} transition focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950 dark:focus:outline-zinc-100`}
                      onClick={() =>
                        setSelectedTags((tags) => tags.filter((item) => item !== tag))
                      }
                      type="button"
                    >
                      {tag}
                      <CloseIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label
              className="mt-5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              htmlFor="new-song-tag"
            >
              Add new tag
            </label>
            <div className="mt-2 flex gap-2">
              <input
                className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-indigo-900"
                id="new-song-tag"
                onChange={(event) => setNewTag(event.target.value)}
                placeholder="Enter a tag name..."
                value={newTag}
              />
              <button
                aria-label="Add"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
                onClick={handleAddTag}
                type="button"
              >
                <PlusIcon />
              </button>
            </div>
            {metadataError && (
              <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
                {metadataError}
              </p>
            )}
            <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
              <button
                className="h-11 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
                type="submit"
              >
                Save details
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
