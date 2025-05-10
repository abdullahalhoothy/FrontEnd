import React, { useCallback, useMemo } from 'react';
import { createEditor, Descendant, BaseEditor } from 'slate';
import {
  Slate,
  Editable,
  withReact,
  RenderElementProps,
  RenderLeafProps,
  ReactEditor,
} from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import { css } from '@emotion/css';
import EditorToolbar from './EditorToolbar';
import ChartRenderer from './ChartRenderer';

export type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'block-quote' | 'chart-container' | 'image';
  children: CustomText[];
  chartId?: string;
  placeholder?: string;
  placeholderType?: 'demographic' | 'pyramid' | 'trend';
  direction?: 'ltr' | 'rtl' | 'auto';
  align?: 'left' | 'center' | 'right';
  url?: string;
  alt?: string;
};

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface RichTextEditorProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  className = '',
}) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const renderElement = useCallback((props: RenderElementProps) => {
    const elementStyle: React.CSSProperties = {};
    if (props.element.align) {
      elementStyle.textAlign = props.element.align;
    }

    const attributes = { ...props.attributes, dir: props.element.direction };

    switch (props.element.type) {
      case 'heading-one':
        return (
          <h1 className="text-2xl font-bold mb-2" {...attributes} style={elementStyle}>
            {props.children}
          </h1>
        );
      case 'heading-two':
        return (
          <h2 className="text-xl font-semibold mb-2" {...attributes} style={elementStyle}>
            {props.children}
          </h2>
        );
      case 'block-quote':
        return (
          <blockquote
            className="pl-4 border-l-4 border-gem-dark italic text-gray-700"
            {...attributes}
            style={elementStyle}
          >
            {props.children}
          </blockquote>
        );
      case 'chart-container':
        return (
          <div className="my-4 p-4 border border-gray-200 rounded-md bg-gray-50" {...attributes}>
            <div contentEditable={false}>
              {props.element.chartId ? (
                <ChartRenderer chartId={props.element.chartId} title="Demographic Data" />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <div className="text-gray-600 font-medium mb-1">
                    {props.element.placeholderType
                      ? `${props.element.placeholderType.charAt(0).toUpperCase() + props.element.placeholderType.slice(1)} Chart Placeholder`
                      : 'Chart Placeholder'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {props.element.placeholder ||
                      'This chart will be replaced with actual data later'}
                  </div>
                </div>
              )}
            </div>
            {props.children}
          </div>
        );
      case 'image':
        return (
          <div className="my-4" {...attributes} style={elementStyle}>
            <div contentEditable={false}>
              {props.element.url ? (
                <img
                  src={props.element.url}
                  alt={props.element.alt || ''}
                  className="max-w-full h-auto rounded-md"
                  style={{ display: 'block', margin: '0 auto' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center bg-gray-50 rounded-md border border-gray-200">
                  <div className="text-4xl mb-2">🖼️</div>
                  <div className="text-gray-600 font-medium mb-1">Image Placeholder</div>
                  <div className="text-sm text-gray-500">
                    This image will be replaced with actual content later
                  </div>
                </div>
              )}
            </div>
            {props.children}
          </div>
        );
      default:
        return (
          <p className="mb-3" {...attributes} style={elementStyle}>
            {props.children}
          </p>
        );
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    let { children } = props;
    const leafStyle: React.CSSProperties = {};

    if (props.leaf.bold) {
      children = <strong>{children}</strong>;
    }
    if (props.leaf.italic) {
      children = <em>{children}</em>;
    }
    if (props.leaf.underline) {
      children = <u>{children}</u>;
    }
    if (props.leaf.color) {
      leafStyle.color = props.leaf.color;
    }
    if (props.leaf.backgroundColor) {
      leafStyle.backgroundColor = props.leaf.backgroundColor;
    }
    if (props.leaf.fontSize) {
      leafStyle.fontSize = props.leaf.fontSize;
    }

    return (
      <span {...props.attributes} style={leafStyle}>
        {children}
      </span>
    );
  }, []);

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      <Slate editor={editor} initialValue={value} onChange={onChange}>
        <div className="px-4 py-2 border-b border-gray-300 bg-gray-50">
          <EditorToolbar />
        </div>
        <Editable
          className={css`
            padding: 1rem;
            min-height: 300px;
            & > * + * {
              margin-top: 1em;
            }
          `}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder}
        />
      </Slate>
    </div>
  );
};

export const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

export default RichTextEditor;
