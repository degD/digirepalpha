"use client";

import { history, historyKeymap, standardKeymap } from "@codemirror/commands";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { chordEditor, chordProtectedEditing } from "../../lib/chord-editor";
import { chordifySelection, transposeSongChords } from "../../lib/chord-format";
import { demoSongData } from "../../lib/demo-song-data";
import {
  initializeSongData,
  normalizeSongTags,
  saveSongData,
  type SongItem,
  updateSongMetadata,
  updateSongText,
} from "../../lib/song-data";

function editorTheme(fontSize: number) {
  return EditorView.theme({
    "&": {
      minHeight: "24rem",
      border: "1px solid var(--color-zinc-300)",
      borderRadius: "0.25rem",
    },
    "&.cm-focused": { outline: "2px solid var(--color-zinc-950)", outlineOffset: "2px" },
    ".cm-content": {
      minHeight: "24rem",
      padding: "0.75rem",
      fontFamily: "inherit",
      fontSize: `${fontSize}px`,
    },
    ".cm-scroller": { fontFamily: "inherit" },
    ".digirep-chord": { color: "#7c3aed", fontWeight: "600" },
  });
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
  const [metadataError, setMetadataError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (!cancelled) {
        const loadedSong =
          initializeSongData(demoSongData).find((item) => item.id === songId) ?? null;

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
          EditorView.contentAttributes.of({ "aria-label": "Song text" }),
          fontSizeCompartment.current.of(editorTheme(16)),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) {
              return;
            }

            const currentSongData = initializeSongData(demoSongData);
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

    const songData = initializeSongData(demoSongData);

    setTitleDraft(song.title);
    setSelectedTags(song.tags);
    setNewTag("");
    setTagOptions(normalizeSongTags(songData.flatMap((item) => item.tags)));
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
      const currentSongData = initializeSongData(demoSongData);
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
    return <p className="text-sm text-zinc-600">Loading song...</p>;
  }

  if (song === null) {
    return <p className="text-sm text-zinc-600">Song not found.</p>;
  }

  return (
    <>
      <header>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{song.title}</h1>
            <p className="text-sm text-zinc-600">{song.tags.join(", ")}</p>
          </div>
          <button
            className="h-10 shrink-0 rounded border border-zinc-300 px-3 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
            onClick={handleEditMetadata}
            type="button"
          >
            Edit
          </button>
        </div>
      </header>
      <div aria-label="Editor tools" className="flex flex-wrap gap-2">
        <button
          className="h-10 rounded border border-zinc-300 px-3 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
          onClick={() => handleTranspose(-1)}
          type="button"
        >
          Transpose -
        </button>
        <button
          className="h-10 rounded border border-zinc-300 px-3 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
          onClick={() => handleTranspose(1)}
          type="button"
        >
          Transpose +
        </button>
        <button
          className="h-10 rounded border border-zinc-300 px-3 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
          onClick={handleChordify}
          type="button"
        >
          Chordify
        </button>
        <button
          className="h-10 rounded border border-zinc-300 px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled={fontSize === 12}
          onClick={() => setFontSize((size) => size - 2)}
          type="button"
        >
          Size -
        </button>
        <button
          className="h-10 rounded border border-zinc-300 px-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled={fontSize === 32}
          onClick={() => setFontSize((size) => size + 2)}
          type="button"
        >
          Size +
        </button>
      </div>
      <div ref={editorContainerRef} />
      {isEditingMetadata && (
        <div
          aria-labelledby="edit-song-details-title"
          aria-modal="true"
          className="fixed inset-0 z-10 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4"
          role="dialog"
        >
          <form
            className="w-full max-w-md rounded-t-lg bg-white p-4 shadow-lg sm:rounded-lg"
            onSubmit={handleSaveMetadata}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold" id="edit-song-details-title">
                Edit song details
              </h2>
              <button
                className="h-10 rounded border border-zinc-300 px-3 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                onClick={() => setIsEditingMetadata(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium" htmlFor="song-title">
              Title
            </label>
            <input
              className="mt-1 h-10 w-full rounded border border-zinc-300 px-3 outline-none focus:border-zinc-950"
              id="song-title"
              onChange={(event) => setTitleDraft(event.target.value)}
              value={titleDraft}
            />
            <label className="mt-4 block text-sm font-medium" htmlFor="song-tag-select">
              Tags
            </label>
            <select
              className="mt-1 h-10 w-full rounded border border-zinc-300 bg-white px-3 outline-none focus:border-zinc-950"
              id="song-tag-select"
              onChange={(event) => {
                if (event.target.value) {
                  setSelectedTags(
                    normalizeSongTags([...selectedTags, event.target.value]),
                  );
                  event.target.value = "";
                }
              }}
              value=""
            >
              <option value="">Select an existing tag</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            {selectedTags.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2" aria-label="Current selected tags">
                {selectedTags.map((tag) => (
                  <li key={tag}>
                    <button
                      className="rounded bg-zinc-100 px-2 py-1 text-sm focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                      onClick={() =>
                        setSelectedTags((tags) => tags.filter((item) => item !== tag))
                      }
                      type="button"
                    >
                      Remove {tag}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="mt-4 block text-sm font-medium" htmlFor="new-song-tag">
              Add new tag
            </label>
            <div className="mt-1 flex gap-2">
              <input
                className="h-10 min-w-0 flex-1 rounded border border-zinc-300 px-3 outline-none focus:border-zinc-950"
                id="new-song-tag"
                onChange={(event) => setNewTag(event.target.value)}
                value={newTag}
              />
              <button
                className="h-10 rounded border border-zinc-300 px-3 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                onClick={handleAddTag}
                type="button"
              >
                Add
              </button>
            </div>
            {metadataError && (
              <p className="mt-3 text-sm text-red-700" role="alert">
                {metadataError}
              </p>
            )}
            <button
              className="mt-4 h-10 rounded bg-zinc-950 px-3 font-medium text-white focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
              type="submit"
            >
              Save details
            </button>
          </form>
        </div>
      )}
    </>
  );
}
