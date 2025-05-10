import React, { useEffect, useState, useRef } from 'react';
import { createContext, useContext } from 'react';
import DemographicChart from '../DemographicChart/DemographicChart';
import PopulationPyramid from '../DemographicChart/PopulationPyramid';
import TrendChart from '../DemographicChart/TrendChart';
import RichTextEditor, { initialValue } from '../ReportBuilder/RichTextEditor';
import RichTextContent from '../ReportBuilder/RichTextContent';
import { Descendant, Text, Element } from 'slate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

console.log('[File: CaseStudyPanel.tsx] Module loaded'); // Log when the module itself is loaded

export const CaseStudyContext = createContext<{
  showCaseStudy: boolean;
  setShowCaseStudy: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  showCaseStudy: false, // Default to false, actual state will be from Provider
  setShowCaseStudy: () => {
    console.warn('[DefaultContext] setShowCaseStudy called on default CaseStudyContext');
  },
});

export const useCaseStudy = () => useContext(CaseStudyContext);

export const CaseStudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[CaseStudyProvider] Mounted'); // Log when Provider component mounts
  const [showCaseStudy, setShowCaseStudy] = useState(false);
  console.log('[CaseStudyProvider] State in Provider:', showCaseStudy);

  useEffect(() => {
    console.log('[CaseStudyProvider] showCaseStudy state changed to:', showCaseStudy);
  }, [showCaseStudy]);

  return (
    <CaseStudyContext.Provider value={{ showCaseStudy, setShowCaseStudy }}>
      {children}
    </CaseStudyContext.Provider>
  );
};

const regionData = [
  { ageGroup: '0-14', male: 10, female: 9 },
  { ageGroup: '15-24', male: 12, female: 11 },
  { ageGroup: '25-34', male: 15, female: 14 },
  { ageGroup: '35-44', male: 13, female: 14 },
  { ageGroup: '45-54', male: 11, female: 12 },
  { ageGroup: '55-64', male: 8, female: 9 },
  { ageGroup: '65+', male: 7, female: 9 },
];

const defaultCaseStudyContent: Descendant[] = [
  {
    type: 'heading-one',
    children: [{ text: 'Demographic Analysis' }],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'This region shows interesting demographic patterns that may influence business and policy decisions.',
      },
    ],
  },
  {
    type: 'chart-container',
    placeholderType: 'demographic',
    placeholder: 'Sample demographic analysis chart. Edit to insert a specific chart.',
    children: [{ text: '' }],
  },
  {
    type: 'heading-two',
    children: [{ text: 'Key Insights' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Working age population (25-54) comprises 47% of the total population', bold: true },
    ],
  },
  {
    type: 'paragraph',
    children: [{ text: 'Gender distribution is relatively balanced across all age groups' }],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Growing senior population (65+) indicates potential need for related services' },
    ],
  },
  {
    type: 'paragraph',
    children: [{ text: 'Projected shift from youth to elderly demographic over the next decade' }],
  },
  {
    type: 'heading-two',
    children: [{ text: 'Analysis' }],
  },
  {
    type: 'chart-container',
    placeholderType: 'trend',
    placeholder: 'Sample trend analysis chart. Edit to insert a specific chart.',
    children: [{ text: '' }],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'The demographic profile suggests a mature market with a solid base of working-age individuals. The balanced gender distribution across age groups indicates similar service needs for both demographics. The growing senior segment creates opportunities in healthcare, leisure, and retirement services.',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: 'Trend analysis indicates a gradual aging of the population over time, with implications for workforce planning, healthcare demand, and housing needs. Businesses should consider these demographic shifts when developing long-term strategies for this region.',
      },
    ],
  },
];

export const CaseStudyPanel: React.FC = () => {
  console.log('[CaseStudyPanel Component] Mounted'); // Log when Panel component mounts
  const { showCaseStudy, setShowCaseStudy } = useCaseStudy();
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'pyramid' | 'trend'>('chart');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editorContent, setEditorContent] = useState<Descendant[]>(defaultCaseStudyContent);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  const activeChartContainerRef = useRef<HTMLDivElement>(null);

  console.log('[CaseStudyPanel Component] Received showCaseStudy from context:', showCaseStudy);

  useEffect(() => {
    console.log(
      '[CaseStudyPanel Component] useEffect - showCaseStudy is now:',
      showCaseStudy,
      ', isInitialRender:',
      isInitialRender
    );
    if (isInitialRender) {
      setIsInitialRender(false);
    }
  }, [showCaseStudy, isInitialRender]);

  const handleInternalClose = () => {
    console.log(
      '[CaseStudyPanel Component] Internal close clicked. Current showCaseStudy:',
      showCaseStudy
    );
    setShowCaseStudy(false);
    console.log('[CaseStudyPanel Component] Internal close - new showCaseStudy set to: false');
  };

  const togglePanelExpansion = () => {
    setIsPanelExpanded(!isPanelExpanded);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleExportToPdf = async () => {
    if (isEditMode) {
      alert(
        'PDF export is best used in view mode to capture the displayed chart. Please switch to view mode.'
      );
      return;
    }

    let arabicFontBase64 = '';
    let arabicBoldFontBase64 = '';

    try {
      const fontResponse = await fetch('/DINNextLTArabic Regular.ttf');
      if (!fontResponse.ok) {
        throw new Error('Arabic font not found');
      }
      const fontBlob = await fontResponse.arrayBuffer();
      arabicFontBase64 = btoa(
        new Uint8Array(fontBlob).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      console.log('Arabic font loaded successfully');
    } catch (error) {
      console.error('Error loading Arabic font:', error);
      alert('Could not load Arabic font. PDF export may not render Arabic text correctly.');
    }

    try {
      const boldFontResponse = await fetch('/DINNextLTArabic Bold.ttf').catch(() => null);
      if (boldFontResponse && boldFontResponse.ok) {
        const fontBlob = await boldFontResponse.arrayBuffer();
        arabicBoldFontBase64 = btoa(
          new Uint8Array(fontBlob).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        console.log('Arabic bold font loaded successfully');
      }
    } catch (error) {
      console.warn('Arabic bold font not available, will use regular font for bold text:', error);
    }

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4',
    });

    const ARABIC_FONT_NAME = 'DINNextLTArabic'; // Name for the font in jsPDF
    let hasBoldArabicFont = false;

    if (arabicFontBase64) {
      try {
        pdf.addFileToVFS('DINNextLTArabic-Regular.ttf', arabicFontBase64);
        pdf.addFont('DINNextLTArabic-Regular.ttf', ARABIC_FONT_NAME, 'normal');

        if (arabicBoldFontBase64) {
          pdf.addFileToVFS('DINNextLTArabic-Bold.ttf', arabicBoldFontBase64);
          pdf.addFont('DINNextLTArabic-Bold.ttf', ARABIC_FONT_NAME, 'bold');
          hasBoldArabicFont = true;
          console.log('Added bold Arabic font variant to PDF');
        }
      } catch (e) {
        console.error('Error setting up Arabic font:', e);
      }
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    let yPos = margin;
    const lineHeightMultiplier = 1.4;
    const spaceAfterParagraph = 10;
    const spaceAfterHeading = 8;

    const containsArabic = (text: string): boolean => {
      const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
      return arabicPattern.test(text);
    };

    const addTextToPdf = (
      text: string,
      fontSize: number = 10,
      isBold: boolean = false,
      isItalic: boolean = false,
      color: string = '#000000',
      backgroundColor: string = '',
      fontNameToUse: string = 'helvetica',
      isRTL: boolean = false,
      textAlign: 'left' | 'center' | 'right' | 'justify' | undefined = 'left'
    ) => {
      if (!text || text.trim() === '') return;

      const hasArabicChars = containsArabic(text);
      if (hasArabicChars && !isRTL) {
        isRTL = true;
        if (arabicFontBase64) {
          fontNameToUse = ARABIC_FONT_NAME;
        }
      }

      let processedText = text;

      if (isRTL && fontNameToUse === ARABIC_FONT_NAME) {
        if ((pdf as any).processArabic) {
          processedText = (pdf as any).processArabic(text);
        }
      }

      const textLines = pdf.splitTextToSize(processedText, pageWidth - 2 * margin);
      const textBlockHeight = textLines.length * fontSize * lineHeightMultiplier;

      if (yPos + textBlockHeight > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(fontSize);

      if (fontNameToUse === ARABIC_FONT_NAME) {
        if (isBold && hasBoldArabicFont) {
          pdf.setFont(fontNameToUse, 'bold');
        } else {
          pdf.setFont(fontNameToUse, 'normal');

          if (isBold && !hasBoldArabicFont) {
            pdf.setFontSize(fontSize * 1.1);
          }
        }
      } else {
        pdf.setFont(
          fontNameToUse,
          isBold ? (isItalic ? 'bolditalic' : 'bold') : isItalic ? 'italic' : 'normal'
        );
      }

      pdf.setTextColor(color);

      if (backgroundColor && backgroundColor !== '') {
        console.warn(
          'Text background color is not directly supported by jsPDF for text elements and will be ignored.'
        );
      }

      let effectiveAlign = textAlign;
      if (!textAlign) {
        effectiveAlign = isRTL ? 'right' : 'left';
      }

      const textOptions: any = {
        baseline: 'top',
        align: effectiveAlign,
      };

      const xPos =
        effectiveAlign === 'right'
          ? pageWidth - margin
          : effectiveAlign === 'center'
            ? pageWidth / 2
            : margin;

      try {
        pdf.text(textLines, xPos, yPos, textOptions);
      } catch (error) {
        console.error('Error rendering text:', error, 'Text:', text);
        pdf.setFont('helvetica', 'normal');
        pdf.text(text, xPos, yPos);
      }

      yPos += textBlockHeight;
    };

    const processNode = (node: Descendant) => {
      let currentFont = 'helvetica'; // Default font
      let isRTL = false;
      let nodeTextAlign: 'left' | 'center' | 'right' | 'justify' | undefined = undefined;

      if (Element.isElement(node)) {
        if (node.direction === 'rtl') {
          isRTL = true;
          if (arabicFontBase64) {
            currentFont = ARABIC_FONT_NAME;
          }
        } else if (node.children && node.children.length > 0) {
          const nodeText = node.children
            .filter(child => Text.isText(child))
            .map(child => (child as any).text)
            .join('');

          if (containsArabic(nodeText)) {
            isRTL = true;
            if (arabicFontBase64) {
              currentFont = ARABIC_FONT_NAME;
            }
          }
        }

        if (node.align) {
          nodeTextAlign = node.align;
        } else if (isRTL) {
          nodeTextAlign = 'right';
        } else {
          nodeTextAlign = 'left';
        }

        const processChildren = (children: Descendant[]) => {
          children.forEach(childNode => {
            if (Text.isText(childNode)) {
              const textNode = childNode as CustomText;
              const textHasArabic = containsArabic(textNode.text);
              const textFont = textHasArabic && arabicFontBase64 ? ARABIC_FONT_NAME : currentFont;
              const textDirection = textHasArabic ? true : isRTL;

              if (textHasArabic && (textNode.bold || textNode.italic)) {
                console.log(
                  'Styled Arabic text detected:',
                  textNode.text,
                  'Bold:',
                  !!textNode.bold,
                  'Italic:',
                  !!textNode.italic
                );
              }

              addTextToPdf(
                textNode.text,
                parseInt(textNode.fontSize || '10'), // Default to 10pt
                !!textNode.bold,
                !!textNode.italic,
                textNode.color || '#000000',
                textNode.backgroundColor || '',
                textFont,
                textDirection,
                nodeTextAlign
              );
            } else if (Element.isElement(childNode)) {
              processNode(childNode);
            }
          });
        };

        switch (node.type) {
          case 'heading-one':
            node.children.forEach(child => {
              if (Text.isText(child)) {
                const textChild = child as CustomText;
                const textHasArabic = containsArabic(textChild.text);
                const headingFont =
                  textHasArabic && arabicFontBase64 ? ARABIC_FONT_NAME : currentFont;

                addTextToPdf(
                  textChild.text,
                  parseInt(textChild.fontSize || '18'),
                  textChild.bold !== undefined ? !!textChild.bold : true,
                  !!textChild.italic,
                  textChild.color || '#000000',
                  textChild.backgroundColor || '',
                  headingFont,
                  textHasArabic || isRTL,
                  nodeTextAlign
                );
              }
            });
            yPos += spaceAfterHeading;
            break;
          case 'heading-two':
            node.children.forEach(child => {
              if (Text.isText(child)) {
                const textChild = child as CustomText;
                const textHasArabic = containsArabic(textChild.text);
                const headingFont =
                  textHasArabic && arabicFontBase64 ? ARABIC_FONT_NAME : currentFont;

                addTextToPdf(
                  textChild.text,
                  parseInt(textChild.fontSize || '14'),
                  textChild.bold !== undefined ? !!textChild.bold : true,
                  !!textChild.italic,
                  textChild.color || '#000000',
                  textChild.backgroundColor || '',
                  headingFont,
                  textHasArabic || isRTL,
                  nodeTextAlign
                );
              }
            });
            yPos += spaceAfterHeading;
            break;
          case 'paragraph':
          case 'block-quote':
            processChildren(node.children);
            yPos += spaceAfterParagraph;
            break;
          case 'chart-container':
            addTextToPdf(
              `[Chart: ${node.placeholderType || 'Generic Chart'}]`,
              10,
              false,
              true,
              '#888888',
              '',
              'helvetica',
              false,
              'left'
            );
            yPos += spaceAfterParagraph;
            break;
          case 'image':
            if (node.url) {
              try {
                const imgProps = pdf.getImageProperties(node.url);
                const imgWidth = pageWidth - 2 * margin;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                const spaceForImage = imgHeight + 20; // Image height + some padding

                if (yPos + spaceForImage > pageHeight - margin) {
                  pdf.addPage();
                  yPos = margin;
                }

                pdf.addImage(node.url, 'PNG', margin, yPos, imgWidth, imgHeight);
                yPos += imgHeight + spaceAfterParagraph;
              } catch (error) {
                console.error('Error adding image to PDF:', error);
                addTextToPdf(
                  '[Error adding image to PDF]',
                  10,
                  true,
                  false,
                  '#FF0000',
                  '',
                  'helvetica',
                  false,
                  'left'
                );
              }
            }
            break;
          default:
            processChildren(node.children);
        }
      }
    };

    type CustomText = {
      text: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      color?: string;
      backgroundColor?: string;
      fontSize?: string;
    };

    editorContent.forEach(processNode);

    if (activeChartContainerRef.current) {
      try {
        const canvas = await html2canvas(activeChartContainerRef.current, {
          scale: 2, // Higher scale for better image quality
          useCORS: true, // If charts load external images/fonts
          backgroundColor: '#ffffff', // Ensure background for transparency issues
        });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        const spaceForChart = imgHeight + 20; // Image height + some padding

        if (yPos + spaceForChart > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + spaceAfterParagraph;
      } catch (error) {
        console.error('Error capturing chart:', error);
        addTextToPdf(
          '[Error capturing chart image]',
          10,
          true,
          false,
          '#FF0000',
          '',
          'helvetica',
          false,
          'left'
        );
      }
    } else {
      addTextToPdf(
        '[Active chart element not found for capture]',
        10,
        false,
        true,
        '#888888',
        '',
        'helvetica',
        false,
        'left'
      );
    }

    pdf.save('case-study-export.pdf');
  };

  const handleEditorChange = (value: Descendant[]) => {
    setEditorContent(value);
  };

  return (
    <div
      className={`
        flex-1 flex-col sm:flex-row bg-white border-l border-gray-200
        overflow-hidden transition-all duration-500 ease-in-out
        ${showCaseStudy ? 'translate-x-0 opacity-100 shadow-xl' : 'translate-x-full opacity-0'}
        ${isInitialRender ? 'transition-none' : ''}
        ${showCaseStudy ? 'pointer-events-auto' : 'pointer-events-none'}
        absolute top-0 right-0 bottom-0 z-20
        h-full
        w-full ${isPanelExpanded ? ' md:max-w-none' : 'md:w-3/5 max-w-[750px]'}
      `}
    >
      <div className="h-full p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gem">Case Study</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePanelExpansion}
              className="text-gray-500 hover:text-gem transition-colors p-1.5 border border-gray-300 rounded"
              aria-label={isPanelExpanded ? 'Minimize panel' : 'Expand panel'}
            >
              {isPanelExpanded ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9V4.5M15 9h4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9.75 9.75M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L14.25 9.75M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9.75 14.25m10.5 6.00v-4.5m0 4.5h-4.5m4.5 0L14.25 14.25"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={handleExportToPdf}
              className="text-gray-500 hover:text-gem transition-colors px-3 py-1 border border-gray-300 rounded"
              aria-label="Export to PDF"
            >
              Export PDF
            </button>
            <button
              onClick={toggleEditMode}
              className="text-gray-500 hover:text-gem transition-colors px-3 py-1 border border-gray-300 rounded"
              aria-label={isEditMode ? 'View Mode' : 'Edit Mode'}
            >
              {isEditMode ? 'Save & Exit' : 'Edit'}
            </button>
            <button
              onClick={handleInternalClose}
              className="text-gray-500 hover:text-gem transition-colors"
              aria-label="Close case study panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {isEditMode ? (
          <div className="space-y-4">
            <RichTextEditor
              value={editorContent}
              onChange={handleEditorChange}
              className="min-h-[500px]"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <RichTextContent value={editorContent} className="space-y-4" />

            {/* Tab buttons for switching between visualization types */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'chart'
                    ? 'text-gem border-b-2 border-gem'
                    : 'text-gray-500 hover:text-gem'
                }`}
                onClick={() => setActiveTab('chart')}
              >
                Bar Chart
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'pyramid'
                    ? 'text-gem border-b-2 border-gem'
                    : 'text-gray-500 hover:text-gem'
                }`}
                onClick={() => setActiveTab('pyramid')}
              >
                Pyramid
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'trend'
                    ? 'text-gem border-b-2 border-gem'
                    : 'text-gray-500 hover:text-gem'
                }`}
                onClick={() => setActiveTab('trend')}
              >
                Trends
              </button>
            </div>

            {/* Assign ref to this container to capture the active chart */}
            <div ref={activeChartContainerRef} className="active-chart-container">
              {/* Demographic visualizations */}
              {activeTab === 'chart' && (
                <DemographicChart
                  title="Age Distribution by Gender"
                  data={regionData}
                  className="my-4"
                />
              )}

              {activeTab === 'pyramid' && (
                <PopulationPyramid
                  title="Population Structure"
                  data={regionData}
                  className="my-4"
                />
              )}

              {activeTab === 'trend' && (
                <TrendChart title="Demographic Trends (2000-2025)" className="my-4" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
