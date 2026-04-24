import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

/** キャンバス／サイドバー共通のフォーカス連携（同じ state に束ねる） */
export type EditorFieldLinkHandlers = {
  onFieldFocus: (fieldId: string) => void;
  onFieldBlur: () => void;
};

/**
 * キャンバス上の contentEditable と右パネルの入力欄を対応づけるラッパー。
 * `linkedFieldId === fieldId` のときスクロール表示し、枠で強調します。
 * `fieldLink` があると、内部コントロールにフォーカスしたときも同じ ID を通知します。
 */
export function EditorField({
  fieldId,
  linkedFieldId,
  fieldLink,
  className,
  children,
}: {
  fieldId: string;
  linkedFieldId: string | null;
  fieldLink?: EditorFieldLinkHandlers;
  className?: string;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const active = linkedFieldId !== null && linkedFieldId === fieldId;

  useEffect(() => {
    if (!active || !wrapRef.current) return;
    wrapRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [active]);

  const handleBlurCapture = () => {
    window.setTimeout(() => {
      const ae = document.activeElement;
      if (!wrapRef.current?.contains(ae)) {
        fieldLink?.onFieldBlur();
      }
    }, 0);
  };

  return (
    <div
      ref={wrapRef}
      data-vode-editor-field={fieldId}
      onFocusCapture={() => fieldLink?.onFieldFocus(fieldId)}
      onBlurCapture={fieldLink ? handleBlurCapture : undefined}
      className={cn(
        'rounded-lg border border-transparent transition-[box-shadow,background-color,border-color] duration-200',
        active && 'border-[#1C1C1E]/30 bg-[#5b5c64]/10 shadow-[inset_0_0_0_1px_rgba(28,28,30,0.15)]',
        className
      )}
    >
      {children}
    </div>
  );
}
