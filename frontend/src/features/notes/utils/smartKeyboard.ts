import React from 'react';

/**
 * THUẬT TOÁN TỰ ĐỘNG NỐI DÒNG & THỤT LỀ DANH SÁCH BÀN PHÍM (SMART KEYBOARD LIST CONTROLLER)
 * 1. Nhấn Enter:
 *    - Tự động sinh mục danh sách tiếp theo cùng cấp thụt lề (•, 1., 2., [ ]).
 *    - Đang ở dòng danh sách rỗng -> Bấm Enter tự động thoát danh sách và xuống dòng sạch.
 * 2. Nhấn Tab:
 *    - Thụt lề vào trong 1 cấp (2 khoảng trắng).
 * 3. Nhấn Shift + Tab:
 *    - Lùi ra ngoài 1 cấp (2 khoảng trắng).
 */
export function handleSmartListKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  content: string,
  setContent: (newContent: string) => void
) {
  const textarea = e.currentTarget;
  const cursorPos = textarea.selectionStart;
  const cursorEnd = textarea.selectionEnd;

  // 1. Xử lý phím TAB / SHIFT + TAB (Tăng / Giảm bậc thụt lề danh sách)
  if (e.key === 'Tab') {
    e.preventDefault();

    const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
    const lineEnd = content.indexOf('\n', cursorPos);
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
    const currentLine = content.substring(lineStart, actualLineEnd);

    if (e.shiftKey) {
      // Shift + Tab: Lùi ra ngoài 1 cấp (Xóa tối đa 2 khoảng trắng đầu dòng)
      if (currentLine.startsWith('  ')) {
        const newContent = content.substring(0, lineStart) + currentLine.substring(2) + content.substring(actualLineEnd);
        setContent(newContent);
        setTimeout(() => {
          textarea.setSelectionRange(Math.max(lineStart, cursorPos - 2), Math.max(lineStart, cursorEnd - 2));
        }, 0);
      } else if (currentLine.startsWith('\t')) {
        const newContent = content.substring(0, lineStart) + currentLine.substring(1) + content.substring(actualLineEnd);
        setContent(newContent);
        setTimeout(() => {
          textarea.setSelectionRange(Math.max(lineStart, cursorPos - 1), Math.max(lineStart, cursorEnd - 1));
        }, 0);
      }
    } else {
      // Tab: Thụt lề vào trong 1 cấp (Thêm 2 khoảng trắng đầu dòng)
      const newContent = content.substring(0, lineStart) + '  ' + currentLine + content.substring(actualLineEnd);
      setContent(newContent);
      setTimeout(() => {
        textarea.setSelectionRange(cursorPos + 2, cursorEnd + 2);
      }, 0);
    }
    return;
  }

  // 2. Xử lý phím BACKSPACE (Xóa tiền tố danh sách rỗng trực tiếp về đầu dòng)
  if (e.key === 'Backspace' && !e.shiftKey && !e.ctrlKey && !e.altKey && cursorPos === cursorEnd) {
    const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
    const textBeforeCursor = content.substring(lineStart, cursorPos);
    const isPureBulletPrefix = /^(\s*(?:[•⁃◦▪▫▸►\-\*+]|\d+[\.\)]|(?:-\s*)?\[[ xX]\])\s*)$/.test(textBeforeCursor);
    if (isPureBulletPrefix) {
      e.preventDefault();
      const newContent = content.substring(0, lineStart) + content.substring(cursorPos);
      setContent(newContent);
      setTimeout(() => {
        textarea.setSelectionRange(lineStart, lineStart);
      }, 0);
      return;
    }
  }

  // 3. Xử lý phím ENTER (Tự động nối dòng thông minh)
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
    const lineEnd = content.indexOf('\n', cursorPos);
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
    const currentLine = content.substring(lineStart, actualLineEnd);
    const textBeforeCursor = content.substring(lineStart, cursorPos);

    // Lấy khoảng trắng thụt lề đầu dòng
    const indentMatch = currentLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    const trimmedLine = currentLine.trim();

    // 2.1. Trường hợp: Dòng danh sách đang RỖNG (Người dùng bấm Enter để THOÁT danh sách)
    const isEmptyBullet =
      trimmedLine === '•' ||
      trimmedLine === '-' ||
      trimmedLine === '*' ||
      trimmedLine === '+' ||
      trimmedLine === '[ ]' ||
      trimmedLine === '[x]' ||
      trimmedLine === '- [ ]' ||
      trimmedLine === '- [x]' ||
      /^\d+[\.\)]$/.test(trimmedLine);

    if (isEmptyBullet) {
      e.preventDefault();
      // Xóa ký tự bullet rỗng và chuyển thành dòng trống sạch
      const newContent = content.substring(0, lineStart) + '' + content.substring(actualLineEnd);
      setContent(newContent);
      setTimeout(() => {
        textarea.setSelectionRange(lineStart, lineStart);
      }, 0);
      return;
    }

    // 2.2. Trường hợp: Danh sách việc cần làm (Checkbox: [ ] hoặc - [ ])
    const taskMatch = textBeforeCursor.match(/^(\s*(?:-\s*)?\[([ xX])\]\s*)(.*)$/);
    if (taskMatch) {
      e.preventDefault();
      const hadDash = /^\s*-\s*\[/.test(textBeforeCursor);
      const prefix = hadDash ? `${indent}- [ ] ` : `${indent}[ ] `;
      const newContent = content.substring(0, cursorPos) + '\n' + prefix + content.substring(cursorPos);
      setContent(newContent);
      setTimeout(() => {
        const nextPos = cursorPos + 1 + prefix.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 0);
      return;
    }

    // 2.3. Trường hợp: Danh sách gạch đầu dòng (Bullet: •, -, *, +)
    const bulletMatch = textBeforeCursor.match(/^(\s*([•⁃◦▪▫▸►\-\*+])\s*)(.*)$/);
    if (bulletMatch) {
      e.preventDefault();
      const symbol = bulletMatch[2] === '-' || bulletMatch[2] === '*' ? bulletMatch[2] : '•';
      const prefix = `${indent}${symbol} `;
      const newContent = content.substring(0, cursorPos) + '\n' + prefix + content.substring(cursorPos);
      setContent(newContent);
      setTimeout(() => {
        const nextPos = cursorPos + 1 + prefix.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 0);
      return;
    }

    // 2.4. Trường hợp: Danh sách đánh số thứ tự (Numbered list: 1., 2., 1), 2))
    const numberMatch = textBeforeCursor.match(/^(\s*(\d+)([\.\)])\s*)(.*)$/);
    if (numberMatch) {
      e.preventDefault();
      const nextNumber = parseInt(numberMatch[2], 10) + 1;
      const delimiter = numberMatch[3];
      const prefix = `${indent}${nextNumber}${delimiter} `;
      const newContent = content.substring(0, cursorPos) + '\n' + prefix + content.substring(cursorPos);
      setContent(newContent);
      setTimeout(() => {
        const nextPos = cursorPos + 1 + prefix.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 0);
      return;
    }
  }
}
