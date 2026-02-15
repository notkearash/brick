import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";

interface TipTapEditorProps {
  initialContent: string;
  onUpdate: (editor: Editor) => void;
}

export function TipTapEditor({ initialContent, onUpdate }: TipTapEditorProps) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      onUpdateRef.current(ed);
    },
  });

  useEffect(() => {
    if (editor && initialContent && !editor.isFocused) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent]);

  if (!editor) return null;

  return (
    <EditorContent
      editor={editor}
      className="brick-editor prose prose-sm max-w-none"
    />
  );
}
