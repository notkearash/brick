import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { Editor } from "@tiptap/react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

export interface DocRow {
  id: number;
  position: number;
  content: string;
  is_title: number;
  type: string;
  attrs: string | null;
}

interface Block {
  id?: number;
  position: number;
  content: string;
  is_title: boolean;
  type: string;
  attrs?: Record<string, any> | null;
}

type SaveStatus = "saved" | "saving" | "unsaved";

function sanitizeTitle(title: string): string {
  let s = title
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 50);
  if (/^\d/.test(s)) s = `_${s}`;
  return s || "untitled";
}

const extensions = [StarterKit.configure({ heading: { levels: [1, 2, 3] } })];

function extractBodyBlocks(editor: Editor): Block[] {
  const json = editor.getJSON();
  if (!json.content) return [];

  const blocks: Block[] = [];
  let position = 2;

  for (const node of json.content) {
    const html = generateHTML({ type: "doc", content: [node] }, extensions);
    const type = node.type || "paragraph";
    const attrs =
      node.attrs && Object.keys(node.attrs).length ? node.attrs : null;

    blocks.push({ position, content: html, is_title: false, type, attrs });
    position++;
  }

  return blocks;
}

export function useDocumentEditor(tableName: string | undefined) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [title, setTitleState] = useState("Untitled");

  const titleRowIdRef = useRef<number | null>(null);
  const bodyIdMapRef = useRef<Map<number, number>>(new Map());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef<Editor | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const tableNameRef = useRef(tableName);
  const navigateRef = useRef(navigate);
  const titleRef = useRef(title);

  tableNameRef.current = tableName;
  navigateRef.current = navigate;
  titleRef.current = title;

  const initFromRows = useCallback((rows: DocRow[]) => {
    const sorted = [...rows].sort((a, b) => a.position - b.position);
    const titleRow = sorted.find((r) => r.is_title);
    const bodyRows = sorted.filter((r) => !r.is_title);

    if (titleRow) {
      titleRowIdRef.current = titleRow.id;
      setTitleState(titleRow.content);
      titleRef.current = titleRow.content;
    }

    const map = new Map<number, number>();
    bodyRows.forEach((row, i) => map.set(i, row.id));
    bodyIdMapRef.current = map;
  }, []);

  async function doSave(editor: Editor) {
    if (!tableNameRef.current) return;
    if (savingRef.current) {
      pendingSaveRef.current = editor;
      return;
    }

    savingRef.current = true;
    setStatus("saving");

    const bodyBlocks = extractBodyBlocks(editor);
    const titleBlock: Block = {
      id: titleRowIdRef.current ?? undefined,
      position: 1,
      content: titleRef.current,
      is_title: true,
      type: "paragraph",
      attrs: null,
    };

    const allBlocks = [titleBlock, ...bodyBlocks.map((block, i) => ({
      ...block,
      id: bodyIdMapRef.current.get(i),
    }))];

    try {
      const res = await fetch(`/api/tables/${tableNameRef.current}/sync`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: allBlocks }),
      });
      if (!res.ok) {
        setStatus("unsaved");
        return;
      }
      const data = await res.json();
      if (data.rows) {
        const sorted = (data.rows as any[]).sort((a: any, b: any) => a.position - b.position);
        const newTitleRow = sorted.find((r: any) => r.is_title);
        const newBodyRows = sorted.filter((r: any) => !r.is_title);
        if (newTitleRow) titleRowIdRef.current = newTitleRow.id;
        const newMap = new Map<number, number>();
        newBodyRows.forEach((row: any, i: number) => newMap.set(i, row.id));
        bodyIdMapRef.current = newMap;
      }
      setStatus("saved");
    } catch {
      setStatus("unsaved");
    } finally {
      savingRef.current = false;
      if (pendingSaveRef.current) {
        const queued = pendingSaveRef.current;
        pendingSaveRef.current = null;
        doSave(queued);
      }
    }
  }

  function onEditorUpdate(editor: Editor) {
    editorRef.current = editor;
    setStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(editor), 1500);
  }

  function onTitleChange(newTitle: string) {
    setTitleState(newTitle);
    titleRef.current = newTitle;
    setStatus("unsaved");

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (editorRef.current) {
      const editor = editorRef.current;
      saveTimerRef.current = setTimeout(() => doSave(editor), 1500);
    }

    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      if (!tableNameRef.current) return;

      await fetch("/api/brick/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "display_name", scope: tableNameRef.current, value: newTitle }),
      });

      const newName = sanitizeTitle(newTitle);
      if (newName && newName !== tableNameRef.current) {
        try {
          const res = await fetch(`/api/tables/${tableNameRef.current}/rename`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newName }),
          });
          if (res.ok) {
            tableNameRef.current = newName;
            navigateRef.current(`/document/${newName}`, { replace: true });
          }
        } catch {
          // rename failed
        }
      }

      window.dispatchEvent(new CustomEvent("brick:refresh-tables"));
    }, 2000);
  }

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      if (editorRef.current) {
        doSave(editorRef.current);
      }
    };
  }, []);

  return { status, title, onTitleChange, onEditorUpdate, initFromRows };
}
