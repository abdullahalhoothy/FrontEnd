import React, { useState, useRef } from 'react';
import { Editor, Element as SlateElement, Transforms, Node } from 'slate';
import { useSlate } from 'slate-react';
import { CustomElement, CustomText } from './RichTextEditor';

interface ToolbarButtonProps {
  format: string;
  icon: React.ReactNode;
  tooltip: string;
  isActive?: boolean;
  onClick: () => void;
}

type MarkFormat = 'bold' | 'italic' | 'underline' | 'color' | 'backgroundColor' | 'fontSize';
type BlockFormat = 'paragraph' | 'heading-one' | 'heading-two' | 'block-quote' | 'chart-container';
type AlignFormat = 'left' | 'center' | 'right';
type DirectionFormat = 'ltr' | 'rtl' | 'auto';

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  format,
  icon,
  tooltip,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      title={tooltip}
      onClick={onClick}
      className={`p-2 mx-1 rounded hover:bg-gray-200 transition-colors ${
        isActive ? 'bg-gray-200 text-gem-dark' : 'text-gray-600'
      }`}
      data-format={format}
    >
      {icon}
    </button>
  );
};

const ColorPicker: React.FC<{
  format: 'color' | 'backgroundColor';
  currentValue: string;
  onChange: (value: string) => void;
  tooltip: string;
}> = ({ format, currentValue, onChange, tooltip }) => {
  const [showPicker, setShowPicker] = useState(false);

  const colorOptions = [
    '#000000',
    '#5c5c5c',
    '#8a8a8a',
    '#cfcfcf',
    '#ffffff',
    '#ff0000',
    '#ff8000',
    '#ffff00',
    '#80ff00',
    '#00ff00',
    '#00ff80',
    '#00ffff',
    '#0080ff',
    '#0000ff',
    '#8000ff',
    '#ff00ff',
    '#ff0080',
    '#4a86e8',
    '#ff9900',
    '#44aa66',
  ];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        title={tooltip}
        onClick={() => setShowPicker(!showPicker)}
        className="p-2 mx-1 rounded hover:bg-gray-200 transition-colors flex items-center"
      >
        <span className="mr-1">{format === 'color' ? 'A' : 'BG'}</span>
        <div
          className="w-4 h-4 border border-gray-300"
          style={{
            backgroundColor: currentValue || (format === 'color' ? '#000000' : 'transparent'),
          }}
        />
      </button>

      {showPicker && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white shadow-lg rounded-md border border-gray-200 z-20 w-48">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {format === 'color' ? 'Text Color' : 'Background Color'}:
          </div>
          <div className="grid grid-cols-5 gap-1">
            {colorOptions.map(color => (
              <button
                key={color}
                title={color}
                onClick={() => {
                  onChange(color);
                  setShowPicker(false);
                }}
                className="w-7 h-7 rounded-sm border border-gray-300 hover:border-gray-500"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              title="Remove color"
              onClick={() => {
                onChange('');
                setShowPicker(false);
              }}
              className="w-7 h-7 rounded-sm border border-gray-300 hover:border-gray-500 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FontSizeSelector: React.FC<{
  currentValue: string;
  onChange: (value: string) => void;
}> = ({ currentValue, onChange }) => {
  const [showSelector, setShowSelector] = useState(false);

  const fontSizeOptions = [
    '10px',
    '12px',
    '14px',
    '16px',
    '18px',
    '20px',
    '24px',
    '28px',
    '32px',
    '36px',
    '48px',
  ];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        title="Font Size"
        onClick={() => setShowSelector(!showSelector)}
        className="p-2 mx-1 rounded hover:bg-gray-200 transition-colors flex items-center"
      >
        <span className="text-sm">Size: {currentValue || 'Default'}</span>
      </button>

      {showSelector && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white shadow-lg rounded-md border border-gray-200 z-20 w-32">
          <div className="text-sm font-medium text-gray-700 mb-2">Font Size:</div>
          <div className="flex flex-col gap-1">
            {fontSizeOptions.map(size => (
              <button
                key={size}
                onClick={() => {
                  onChange(size);
                  setShowSelector(false);
                }}
                className={`px-2 py-1 text-left rounded hover:bg-gray-100 ${
                  currentValue === size ? 'bg-gray-100 font-medium' : ''
                }`}
              >
                {size}
              </button>
            ))}
            <button
              onClick={() => {
                onChange('');
                setShowSelector(false);
              }}
              className="px-2 py-1 text-left rounded hover:bg-gray-100"
            >
              Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const EditorToolbar: React.FC = () => {
  const editor = useSlate();
  const [showChartOptions, setShowChartOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMarkActive = (format: MarkFormat) => {
    const marks = Editor.marks(editor) as Partial<CustomText> | null;
    return marks ? marks[format] === true : false;
  };

  const getMarkValue = (format: 'color' | 'backgroundColor' | 'fontSize') => {
    const marks = Editor.marks(editor) as Partial<CustomText> | null;
    return marks && marks[format] ? marks[format] : '';
  };

  const isBlockActive = (format: BlockFormat) => {
    const [match] = Editor.nodes(editor, {
      match: n => SlateElement.isElement(n) && n.type === format,
    });
    return !!match;
  };

  const isAlignActive = (format: AlignFormat) => {
    const [match] = Editor.nodes(editor, {
      match: n => SlateElement.isElement(n) && n.align === format,
    });
    return !!match;
  };

  const isDirectionActive = (format: DirectionFormat) => {
    const [match] = Editor.nodes(editor, {
      match: n => SlateElement.isElement(n) && n.direction === format,
    });
    return !!match;
  };

  const toggleMark = (format: MarkFormat) => {
    const isActive = isMarkActive(format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const setMark = (format: 'color' | 'backgroundColor' | 'fontSize', value: string) => {
    if (value === '') {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, value);
    }
  };

  const toggleBlock = (format: BlockFormat) => {
    const isActive = isBlockActive(format);

    Transforms.setNodes(
      editor,
      { type: isActive ? 'paragraph' : format } as Partial<CustomElement>,
      { match: (n: Node) => SlateElement.isElement(n) && !Editor.isEditor(n) }
    );
  };

  const toggleAlign = (format: AlignFormat) => {
    const isActive = isAlignActive(format);

    Transforms.setNodes(
      editor,
      { align: isActive ? undefined : format } as Partial<CustomElement>,
      { match: (n: Node) => SlateElement.isElement(n) && !Editor.isEditor(n) }
    );
  };

  const toggleDirection = (format: DirectionFormat) => {
    const isActive = isDirectionActive(format);

    Transforms.setNodes(
      editor,
      { direction: isActive ? undefined : format } as Partial<CustomElement>,
      { match: (n: Node) => SlateElement.isElement(n) && !Editor.isEditor(n) }
    );
  };

  const insertChart = (chartType: 'demographic-chart' | 'population-pyramid' | 'trend-chart') => {
    const chartId = `${Date.now()}-${chartType}`;

    let phType: 'demographic' | 'pyramid' | 'trend';
    let phText: string;

    switch (chartType) {
      case 'demographic-chart':
        phType = 'demographic';
        phText = 'Demographic Chart';
        break;
      case 'population-pyramid':
        phType = 'pyramid';
        phText = 'Population Pyramid';
        break;
      case 'trend-chart':
        phType = 'trend';
        phText = 'Trend Chart';
        break;
      default:
        phType = 'demographic';
        phText = 'Chart';
        break;
    }

    Transforms.insertNodes(editor, {
      type: 'chart-container',
      chartId,
      placeholderType: phType,
      placeholder: `This ${phText} will be replaced with actual data later`,
      children: [{ text: '' }],
    } as CustomElement);
    setShowChartOptions(false);
  };

  const insertImage = (url: string) => {
    const imageNode: CustomElement = {
      type: 'image',
      url,
      alt: 'Uploaded image',
      children: [{ text: '' }],
    };
    Transforms.insertNodes(editor, imageNode);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const url = e.target?.result as string;
        insertImage(url);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-wrap items-center">
      <div className="flex items-center">
        <ToolbarButton
          format="bold"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            </svg>
          }
          isActive={isMarkActive('bold')}
          onClick={() => toggleMark('bold')}
          tooltip="Bold"
        />

        <ToolbarButton
          format="italic"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <line x1="19" y1="4" x2="10" y2="4"></line>
              <line x1="14" y1="20" x2="5" y2="20"></line>
              <line x1="15" y1="4" x2="9" y2="20"></line>
            </svg>
          }
          isActive={isMarkActive('italic')}
          onClick={() => toggleMark('italic')}
          tooltip="Italic"
        />

        <ToolbarButton
          format="underline"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
              <line x1="4" y1="21" x2="20" y2="21"></line>
            </svg>
          }
          isActive={isMarkActive('underline')}
          onClick={() => toggleMark('underline')}
          tooltip="Underline"
        />

        <FontSizeSelector
          currentValue={getMarkValue('fontSize') as string}
          onChange={value => setMark('fontSize', value)}
        />

        <ColorPicker
          format="color"
          currentValue={getMarkValue('color') as string}
          onChange={value => setMark('color', value)}
          tooltip="Text Color"
        />

        <ColorPicker
          format="backgroundColor"
          currentValue={getMarkValue('backgroundColor') as string}
          onChange={value => setMark('backgroundColor', value)}
          tooltip="Background Color"
        />
        <div className="mx-2 h-6 w-px bg-gray-300" />
        <ToolbarButton
          format="heading-one"
          icon={<span className="font-bold">H1</span>}
          tooltip="Heading 1"
          isActive={isBlockActive('heading-one')}
          onClick={() => toggleBlock('heading-one')}
        />
        <ToolbarButton
          format="heading-two"
          icon={<span className="font-bold">H2</span>}
          tooltip="Heading 2"
          isActive={isBlockActive('heading-two')}
          onClick={() => toggleBlock('heading-two')}
        />
        <ToolbarButton
          format="block-quote"
          icon={<span className="font-bold">"</span>}
          tooltip="Quote"
          isActive={isBlockActive('block-quote')}
          onClick={() => toggleBlock('block-quote')}
        />
        <div className="mx-2 h-6 w-px bg-gray-300" />
        <ToolbarButton
          format="align-left"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 448 512">
              <path d="M288 64c0 17.7-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32H256c17.7 0 32 14.3 32 32zm0 256c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H256c17.7 0 32 14.3 32 32zM0 192c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
            </svg>
          }
          tooltip="Align Left"
          isActive={isAlignActive('left')}
          onClick={() => toggleAlign('left')}
        />
        <ToolbarButton
          format="align-center"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 448 512">
              <path d="M352 64c0-17.7-14.3-32-32-32H128c-17.7 0-32 14.3-32 32s14.3 32 32 32h192c17.7 0 32-14.3 32-32zm0 384c0-17.7-14.3-32-32-32H128c-17.7 0-32 14.3-32 32s14.3 32 32 32h192c17.7 0 32-14.3 32-32zM0 192c0 17.7 14.3 32 32 32H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H32c-17.7 0-32 14.3-32 32zM448 448c0-17.7-14.3-32-32-32H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H416c17.7 0 32-14.3 32-32z" />
            </svg>
          }
          tooltip="Align Center"
          isActive={isAlignActive('center')}
          onClick={() => toggleAlign('center')}
        />
        <ToolbarButton
          format="align-right"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 448 512">
              <path d="M448 64c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32zm0 256c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32zM0 192c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
            </svg>
          }
          tooltip="Align Right"
          isActive={isAlignActive('right')}
          onClick={() => toggleAlign('right')}
        />
        <div className="mx-2 h-6 w-px bg-gray-300" />
        <ToolbarButton
          format="direction-ltr"
          icon={<span className="font-mono">LTR</span>}
          tooltip="Left to Right"
          isActive={isDirectionActive('ltr')}
          onClick={() => toggleDirection('ltr')}
        />
        <ToolbarButton
          format="direction-rtl"
          icon={<span className="font-mono">RTL</span>}
          tooltip="Right to Left"
          isActive={isDirectionActive('rtl')}
          onClick={() => toggleDirection('rtl')}
        />
        <div className="mx-2 h-6 w-px bg-gray-300" />
        <div className="relative">
          <ToolbarButton
            format="chart-container"
            icon={<span className="font-bold">📊</span>}
            tooltip="Insert Chart"
            onClick={() => setShowChartOptions(!showChartOptions)}
          />

          {showChartOptions && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white shadow-lg rounded-md border border-gray-200 z-10">
              <div className="text-sm font-medium text-gray-700 mb-2">Select Chart Type:</div>
              <div className="space-y-1">
                <button
                  className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100"
                  onClick={() => insertChart('demographic-chart')}
                >
                  Age Distribution
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100"
                  onClick={() => insertChart('population-pyramid')}
                >
                  Population Pyramid
                </button>
                <button
                  className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100"
                  onClick={() => insertChart('trend-chart')}
                >
                  Demographic Trends
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mx-2 h-6 w-px bg-gray-300" />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <ToolbarButton
          format="image"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          }
          tooltip="Insert Image"
          onClick={() => fileInputRef.current?.click()}
        />
      </div>
    </div>
  );
};

export default EditorToolbar;
