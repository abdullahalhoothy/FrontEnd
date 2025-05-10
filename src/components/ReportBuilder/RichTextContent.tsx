import React from 'react';
import { Descendant, Text, Element } from 'slate';
import ChartRenderer from './ChartRenderer';
import { CustomElement, CustomText } from './RichTextEditor';

interface RichTextContentProps {
  value: Descendant[];
  className?: string;
}

const RichTextContent: React.FC<RichTextContentProps> = ({ value, className = '' }) => {
  const renderLeaf = (leaf: CustomText): JSX.Element => {
    let result: React.ReactNode = leaf.text;

    const inlineStyles: React.CSSProperties = {};
    if (leaf.color) inlineStyles.color = leaf.color;
    if (leaf.backgroundColor) inlineStyles.backgroundColor = leaf.backgroundColor;
    if (leaf.fontSize) inlineStyles.fontSize = leaf.fontSize;

    const hasInlineStyles = Object.keys(inlineStyles).length > 0;

    if (leaf.bold) {
      result = <strong>{result}</strong>;
    }

    if (leaf.italic) {
      result = <em>{result}</em>;
    }

    if (leaf.underline) {
      result = <u>{result}</u>;
    }

    if (hasInlineStyles) {
      result = <span style={inlineStyles}>{result}</span>;
    }

    return <>{result}</>;
  };

  const renderElement = (element: CustomElement, index: number) => {
    const children = element.children.map((node, i) => {
      if (Text.isText(node)) {
        return <React.Fragment key={i}>{renderLeaf(node as CustomText)}</React.Fragment>;
      }
      return null;
    });

    const elementStyle: React.CSSProperties = {};
    const elementProps: React.HTMLAttributes<HTMLElement> = {};

    if (element.align) {
      elementStyle.textAlign = element.align;
    }

    if (element.direction) {
      elementProps.dir = element.direction;
    }

    switch (element.type) {
      case 'heading-one':
        return (
          <h1
            key={index}
            className="text-2xl font-bold text-gem-dark mb-4"
            style={elementStyle}
            {...elementProps}
          >
            {children}
          </h1>
        );
      case 'heading-two':
        return (
          <h2
            key={index}
            className="text-xl font-semibold text-gem-dark mb-3"
            style={elementStyle}
            {...elementProps}
          >
            {children}
          </h2>
        );
      case 'block-quote':
        return (
          <blockquote
            key={index}
            className="pl-4 border-l-4 border-gem-dark italic text-gray-700 my-4"
            style={elementStyle}
            {...elementProps}
          >
            {children}
          </blockquote>
        );
      case 'chart-container':
        return (
          <div key={index} className="my-6" style={elementStyle} {...elementProps}>
            {element.chartId ? (
              <ChartRenderer chartId={element.chartId} />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center bg-gray-50 rounded-md border border-gray-200">
                <div className="text-4xl mb-2">📊</div>
                <div className="text-gray-600 font-medium mb-1">
                  {element.placeholderType
                    ? `${element.placeholderType.charAt(0).toUpperCase() + element.placeholderType.slice(1)} Chart Placeholder`
                    : 'Chart Placeholder'}
                </div>
                <div className="text-sm text-gray-500">
                  {element.placeholder || 'This chart will be replaced with actual data later'}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <p key={index} className="mb-3 text-gray-700" style={elementStyle} {...elementProps}>
            {children}
          </p>
        );
    }
  };

  return (
    <div className={`rich-text-content ${className}`}>
      {value.map((node, i) => {
        if (!Element.isElement(node)) return null;
        return renderElement(node as CustomElement, i);
      })}
    </div>
  );
};

export default RichTextContent;
