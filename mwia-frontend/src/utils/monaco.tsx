import React from "react";
import { useEffect, useRef } from "react";
import { editor as monacoeditor } from 'monaco-editor/esm/vs/editor/editor.api'
//import './monaco.ttl';
import "@datavillage-me/monaco-language-turtle";
import * as rdflib from 'rdflib';
import {CONTENT_TYPES} from "@spw-dig/mwia-core";


// @ts-ignore
/*
self.MonacoEnvironment = {
  getWorkerUrl: function (_moduleId: any, label: string) {

    if (label === 'turtle') {
      return './turtle.worker.bundle.js';
    }
    if (label === 'json') {
      return './json.worker.bundle.js';
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return './css.worker.bundle.js';
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return './html.worker.bundle.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return './ts.worker.bundle.js';
    }
    return './editor.worker.bundle.js';
  }
};

 */



function parseRdf(str: string) {
  const store = rdflib.graph();
  try {
    str && rdflib.parse(str, store, "http://datavillage.me/", CONTENT_TYPES.turtle);
  } catch (err) {
    console.warn("Failed to parse turtle: ");
    console.error(err);
  }

  return store;
}

export const MonacoEditor = (props: {text: string, onChange?: (newText: string) => void, language?: string}) => {
  const divEl = useRef<HTMLDivElement>(null);
  let editor: monacoeditor.IStandaloneCodeEditor;

  const language = props.language || 'turtle';

  useEffect(() => {
    if (divEl.current) {

      editor?.dispose();
      editor = monacoeditor.create(divEl.current, {
        //hover: {sticky: false},
        theme: language == 'turtle' ? 'turtleTheme' : undefined,
        value: props.text,
        language,
        wordWrap: 'on'
      });
      editor.onDidChangeModelContent((e) => {
        props.onChange && props.onChange(editor.getValue());
        if (language == 'turtle') (editor.getModel() as any).rdfGraph = parseRdf(editor.getValue());
      });

      if (language == 'turtle')(editor.getModel() as any).rdfGraph = parseRdf(props.text);
    }

    return () => {
      editor.dispose();
    };
  }, [divEl.current, props.onChange, props.text]);


  return <div ref={divEl} style={{marginTop: "5px", height: "600px", minHeight: "100px", border: "1px solid #ccc"}}></div>;
}
