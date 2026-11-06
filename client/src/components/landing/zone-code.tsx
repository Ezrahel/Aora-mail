"use client";

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { drawSelection, EditorView, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { useEffect, useRef } from "react";

/** A small tokenizer for BIND-style zone files. */
const zoneLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.peek() === ";") {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.peek() === '"') {
      stream.next();
      while (!stream.eol()) {
        if (stream.next() === '"') break;
      }
      return "string";
    }
    if (stream.match(/^(MX|TXT)\b/)) return "keyword";
    if (stream.match(/^\d+\b/)) return "number";
    stream.match(/^[^\s"]+/);
    return "variableName";
  },
});

const highlight = HighlightStyle.define([
  { tag: tags.comment, color: "#828d85" },
  { tag: tags.keyword, color: "#16ff00" },
  { tag: tags.string, color: "#d4dbd4" },
  { tag: tags.number, color: "#99a39b" },
  { tag: tags.variableName, color: "#f2f5f1" },
]);

export default function ZoneCode({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latestChange = useRef(onChange);

  useEffect(() => {
    latestChange.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          drawSelection(),
          lineNumbers(),
          highlightActiveLine(),
          zoneLanguage,
          syntaxHighlighting(highlight),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.contentAttributes.of({ "aria-label": "DNS zone file. Edit a record to see what breaks." }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) latestChange.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
    // The editor owns its document after mount; later values arrive below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = view.current;
    if (!editor || editor.state.doc.toString() === value) return;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value]);

  return <div ref={host} className="cm-host" />;
}
