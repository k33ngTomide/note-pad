import { useEffect, useState } from "react";
import { writeTextFile, readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import "./App.css";

type Note = {
  id: string;
  title: string;
  content: string;
};

const FILE_NAME = "notes.json";

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeNote = notes.find(n => n.id === activeId);

  // Load notes on startup
  useEffect(() => {
    async function load() {
      try {
        const data = await readTextFile(FILE_NAME, {
          baseDir: BaseDirectory.AppData
        });
        const parsed: Note[] = JSON.parse(data);
        setNotes(parsed);
        if (parsed.length) setActiveId(parsed[0].id);
      } catch {
        // file doesn't exist yet
      }
    }
    load();
  }, []);

  // Save notes whenever they change
  useEffect(() => {
    async function save() {
      await writeTextFile(FILE_NAME, JSON.stringify(notes), {
        baseDir: BaseDirectory.AppData
      });
    }
    save();
  }, [notes]);

  function createNote() {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "Untitled",
      content: ""
    };
    setNotes([newNote, ...notes]);
    setActiveId(newNote.id);
  }

  function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    if (activeId === id) setActiveId(updated[0]?.id ?? null);
  }

  function updateNote(field: "title" | "content", value: string) {
    setNotes(notes.map(n =>
      n.id === activeId ? { ...n, [field]: value } : n
    ));
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Notes</h2>
          <button className="new-btn" onClick={createNote}>＋</button>
        </div>

        <div className="notes-list">
          {notes.map(n => (
            <div
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={`note-item ${n.id === activeId ? "active" : ""}`}
            >
              <div className="note-title">{n.title || "Untitled"}</div>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(n.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="editor">
        {activeNote ? (
          <>
            <input
              className="title-input"
              value={activeNote.title}
              onChange={e => updateNote("title", e.target.value)}
            />
            <textarea
              className="content-input"
              value={activeNote.content}
              onChange={e => updateNote("content", e.target.value)}
            />
          </>
        ) : (
          <div className="empty">Create or select a note</div>
        )}
      </main>
    </div>
  );
}