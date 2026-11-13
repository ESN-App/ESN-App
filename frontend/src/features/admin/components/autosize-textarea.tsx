import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';

interface AutosizeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}

// Lets the existing `textarea[cdkTextareaAutosize]` selectors keep matching.
const AUTOSIZE_ATTRIBUTE = { cdktextareaautosize: '' } as Record<string, string>;

/** Textarea that grows with its content, like the CDK `cdkTextareaAutosize` directive. */
export function AutosizeTextarea({ minRows = 1, value, ...props }: AutosizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) {
      return;
    }
    const style = getComputedStyle(textarea);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const contentBox = style.boxSizing === 'content-box';

    textarea.style.height = 'auto';
    const contentHeight = Math.max(lineHeight * minRows, textarea.scrollHeight - padding);
    textarea.style.height = `${contentBox ? contentHeight : contentHeight + padding}px`;
  }, [value, minRows]);

  return <textarea ref={ref} rows={1} value={value} {...AUTOSIZE_ATTRIBUTE} {...props} />;
}
