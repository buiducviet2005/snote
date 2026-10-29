import { NoteType } from '@snote/shared';

/**
 * THUẬT TOÁN ĐỊNH DẠNG VĂN BẢN THUẦN TÚY THUẦN CHƯƠNG TRÌNH (DETERMINISTIC ALGORITHM - NO AI)
 * Xây dựng bằng biểu thức chính quy (Regex) & bộ phân tích dòng (Line Tokenizer):
 * 1. Thuật toán nhận diện và làm nổi bật đường dẫn URL (Link Highlighting & Domain Parsing)
 * 2. Thuật toán phân cấp danh sách thụt lề đa bậc (Indented Nested Lists)
 * 3. Thuật toán nhận diện danh sách đánh số / ký tự đặc biệt (Bullet & Numbered Lists)
 * 4. Thuật toán nhận diện hộp kiểm công việc (Todos / Checklists)
 * 5. Thuật toán phân loại ghi chú theo trọng số từ khóa (Weighted Keyword Classification)
 */

/**
 * Danh sách mẫu nhận diện tên miền phổ biến để gắn biểu tượng trực quan
 */
function getDomainBadge(hostname: string): string {
  const host = hostname.toLowerCase().replace('www.', '');
  if (host.includes('github.com')) return 'GitHub';
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
  if (host.includes('drive.google.com')) return 'Google Drive';
  if (host.includes('docs.google.com')) return 'Google Docs';
  if (host.includes('notion.so') || host.includes('notion.site')) return 'Notion';
  if (host.includes('figma.com')) return 'Figma';
  if (host.includes('stackoverflow.com')) return 'StackOverflow';
  if (host.includes('canva.com')) return 'Canva';
  if (host.includes('wikipedia.org')) return 'Wikipedia';
  return host;
}

/**
 * Thuật toán tách và làm sạch URL khỏi dấu câu ở cuối câu (.,;!?)\)
 */
function cleanUrlTrailingPunctuation(rawUrl: string): { url: string; trailing: string } {
  let url = rawUrl;
  let trailing = '';
  while (url.length > 0 && /[.,;:!?\)>\]]$/.test(url)) {
    trailing = url[url.length - 1] + trailing;
    url = url.slice(0, -1);
  }
  return { url, trailing };
}

/**
 * Thuật toán phân tích văn bản thuần túy thành văn bản có cấu trúc hiển thị
 */
export function autoFormatPlainTextToMarkdown(rawText: string = ''): string {
  if (!rawText || !rawText.trim()) return '';

  const lines = rawText.split('\n');
  const processedLines: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Không can thiệp nếu dòng nằm trong khối code
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      processedLines.push(line);
      continue;
    }

    if (inCodeBlock) {
      processedLines.push(line);
      continue;
    }

    // 1. Phân tích khoảng thụt lề đầu dòng (Bảo toàn thụt lề phân cấp đa tầng)
    const indentMatch = line.match(/^(\s*)/);
    const leadingSpaces = indentMatch ? indentMatch[1].replace(/\t/g, '  ') : '';
    const trimmed = line.trim();

    if (!trimmed) {
      processedLines.push('');
      continue;
    }

    let formattedLine = trimmed;

    // 2. Thuật toán nhận diện Checkbox / Checklist việc cần làm (Mọi biến thể tiền tố: bullets, numbering, blockquotes, raw checkbox [ ], [x], [X], [v], [✓], [✔])
    const taskMatch = formattedLine.match(/^(>{1,3}\s*)?(?:(?:[-*+•⁃◦▪▫▸►=>/]|(?:\(?\d+(?:[\.\/]\d+)*[\.\)]?)|(?:\(?[a-zA-Z][\.\)]))\s*)?\[(\s*|[xXvV✓✔\+\*])\]\s*(.*)$/);
    const todoKeywordMatch = formattedLine.match(/^(>{1,3}\s*)?(?:(?:[-*+•⁃◦▪▫▸►]|\d+[\.\)])\s*)?(todo|cần làm|chưa làm|nhiệm vụ):\s*(.*)$/i);
    const doneKeywordMatch = formattedLine.match(/^(>{1,3}\s*)?(?:(?:[-*+•⁃◦▪▫▸►]|\d+[\.\)])\s*)?(done|đã làm|hoàn thành):\s*(.*)$/i);

    if (taskMatch) {
      const quotePrefix = taskMatch[1] || '';
      const markContent = taskMatch[2] || '';
      const taskBody = taskMatch[3] || '';
      const isChecked = Boolean(markContent.trim() !== '');
      const mark = isChecked ? 'x' : ' ';
      formattedLine = `${quotePrefix}- [${mark}] ${taskBody}`;
    } else if (todoKeywordMatch) {
      const quotePrefix = todoKeywordMatch[1] || '';
      const keyword = todoKeywordMatch[2] || 'Cần làm';
      const taskBody = todoKeywordMatch[3] || '';
      formattedLine = `${quotePrefix}- [ ] **${keyword}:** ${taskBody}`;
    } else if (doneKeywordMatch) {
      const quotePrefix = doneKeywordMatch[1] || '';
      const keyword = doneKeywordMatch[2] || 'Đã làm';
      const taskBody = doneKeywordMatch[3] || '';
      formattedLine = `${quotePrefix}- [x] **${keyword}:** ${taskBody}`;
    }
    // 3. Thuật toán nhận diện Bullet lists các loại ký tự đặc biệt
    else if (/^[•⁃◦▪▫▸►]\s*(.*)$/.test(formattedLine)) {
      const match = formattedLine.match(/^[•⁃◦▪▫▸►]\s*(.*)$/);
      if (match) {
        formattedLine = `- ${match[1]}`;
      }
    } else if (/^[-*+]\s*(.*)$/.test(formattedLine)) {
      // Giữ nguyên danh sách gạch đầu dòng
    } else if (/^(=>|->)\s*(.*)$/.test(formattedLine)) {
      const match = formattedLine.match(/^(=>|->)\s*(.*)$/);
      if (match) {
        formattedLine = `  - → ${match[2]}`;
      }
    }
    // 4. Thuật toán nhận diện danh sách có thứ tự (1., 1), 1/, a., a), 1.1)
    else if (/^(\d+)[\)\/]\s*(.*)$/.test(formattedLine)) {
      const match = formattedLine.match(/^(\d+)[\)\/]\s*(.*)$/);
      if (match) {
        formattedLine = `${match[1]}. ${match[2]}`;
      }
    } else if (/^([a-zA-Z])[\.\)]\s*(.*)$/.test(formattedLine)) {
      const match = formattedLine.match(/^([a-zA-Z])[\.\)]\s*(.*)$/);
      if (match) {
        formattedLine = `  - **${match[1].toUpperCase()}.** ${match[2]}`;
      }
    } else if (/^(\d+\.\d+(\.\d+)?)\s*(.*)$/.test(formattedLine)) {
      const match = formattedLine.match(/^(\d+\.\d+(\.\d+)?)\s*(.*)$/);
      if (match) {
        formattedLine = `  - **${match[1]}** ${match[3]}`;
      }
    }
    // 5. Thuật toán nhận diện Tiêu đề phân mục
    else if (
      /^(Chương|Bài|Phần|Mục|Lưu ý|Chú ý|Ghi nhớ|Tổng kết|Công thức|Định lý|Định nghĩa|Tài liệu tham khảo|Nguồn):\s*(.*)$/i.test(
        formattedLine
      )
    ) {
      const match = formattedLine.match(
        /^(Chương|Bài|Phần|Mục|Lưu ý|Chú ý|Ghi nhớ|Tổng kết|Công thức|Định lý|Định nghĩa|Tài liệu tham khảo|Nguồn):\s*(.*)$/i
      );
      if (match) {
        formattedLine = `### ${match[1]}: ${match[2]}`;
      }
    } else if (
      formattedLine.endsWith(':') &&
      formattedLine.length < 50 &&
      !formattedLine.includes('\n') &&
      !formattedLine.startsWith('#')
    ) {
      formattedLine = `**${formattedLine}**`;
    }

    // 6. Thuật toán Nhận diện Đường dẫn URL & Tên Miền Không Cần https:// (Bare Domain Link Detection)
    // Tự động nhận diện cả google.com, youtube.com, github.com/abc, localhost:3000,...
    formattedLine = formattedLine.replace(
      /(?<!\]\()(?<!\[)(?<!@)\b((?:https?:\/\/|www\.)[^\s<>"'{}|\\^`[\]]+|(?:[a-zA-Z0-9](?:[-a-zA-Z0-9]*[a-zA-Z0-9])?\.)+(?:com|net|org|edu|gov|io|dev|app|vn|ai|co|info|me|tech|site|online|store|tv|xyz|cc|to|so|page|link|space|club|pro|biz|live|top|us|uk|jp|de|fr)(?::\d+)?(?:\/[^\s<>"'{}|\\^`[\]]*)?|localhost:\d+(?:\/[^\s<>"'{}|\\^`[\]]*)?)/gi,
      (rawMatch) => {
        const { url, trailing } = cleanUrlTrailingPunctuation(rawMatch);
        let fullUrl = url;
        if (url.startsWith('localhost:')) {
          fullUrl = `http://${url}`;
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
          fullUrl = `https://${url}`;
        }

        try {
          const parsed = new URL(fullUrl);
          const badgeText = getDomainBadge(parsed.hostname);
          return `[${badgeText} ↗](${fullUrl})${trailing}`;
        } catch {
          return `[${url} ↗](${fullUrl})${trailing}`;
        }
      }
    );

    // 7. Thuật toán nhận diện Obsidian [[Wiki Links]] (Liên kết hai chiều)
    formattedLine = formattedLine.replace(/\[\[([^\]\|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
      const cleanTarget = target.trim();
      const label = (alias || cleanTarget).trim();
      return `[${label} ↗](#wiki:${encodeURIComponent(cleanTarget)})`;
    });

    // 8. Thuật toán nhận diện Hashtags (#tag)
    formattedLine = formattedLine.replace(/(^|\s)#([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF-]+)(?=\s|$|[.,;:!?])/g, (_, space, tag) => {
      if (/^\d+$/.test(tag)) return `${space}#${tag}`;
      return `${space}[#${tag}](#tag:${encodeURIComponent(tag)})`;
    });

    processedLines.push(`${leadingSpaces}${formattedLine}`);
  }

  return processedLines.join('\n');
}

/**
 * THUẬT TOÁN PHÂN LOẠI GHI CHÚ THEO TRỌNG SỐ TỪ KHÓA (WEIGHTED KEYWORD HEURISTIC CLASSIFIER - NO AI)
 * Thuật toán tính điểm tần suất xuất hiện từ vựng để xác định chính xác thể loại ghi chú
 */
export function detectNoteType(title: string = '', content: string = ''): NoteType {
  const text = `${title} ${content}`.toLowerCase();

  const rules: { type: NoteType; keywords: string[]; weight: number }[] = [
    {
      type: NoteType.EXAM_PREP,
      keywords: ['ôn thi', 'đề thi', 'câu hỏi', 'trắc nghiệm', 'giải đề', 'công thức', 'định lý', 'flashcard', 'đề cương', 'review kiến thức'],
      weight: 1.5
    },
    {
      type: NoteType.LAB_REPORT,
      keywords: ['thực hành', 'lab', 'thí nghiệm', 'báo cáo lab', 'cài đặt', 'setup', 'hướng dẫn cài', 'terminal', 'mã lỗi', 'kết quả thực nghiệm'],
      weight: 1.3
    },
    {
      type: NoteType.MEETING_MINUTES,
      keywords: ['họp', 'meeting', 'biên bản', 'thảo luận nhóm', 'gặp mặt', 'phân công', 'thành viên', 'thống nhất ý kiến'],
      weight: 1.4
    },
    {
      type: NoteType.PROJECT_LOG,
      keywords: ['đồ án', 'project', 'btl', 'bài tập lớn', 'sprint', 'tiến độ', 'task', 'tính năng', 'database', 'backend', 'frontend', 'deploy'],
      weight: 1.2
    },
    {
      type: NoteType.LECTURE,
      keywords: ['bài giảng', 'chương', 'tiết', 'buổi', 'lý thuyết', 'slide', 'giảng viên', 'định nghĩa', 'khái niệm'],
      weight: 1.0
    }
  ];

  let bestType = NoteType.GENERAL;
  let maxScore = 0;

  for (const rule of rules) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        score += rule.weight;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestType = rule.type;
    }
  }

  return bestType;
}

/**
 * Trích xuất toàn bộ đặc tính nội dung ghi chú bằng Regex Deterministic
 */
export function extractNoteFeatures(content: string = '') {
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  const bareUrlRegex = /(?<!@)\b((?:https?:\/\/|www\.)[^\s<>"'{}|\\^`[\]]+|(?:[a-zA-Z0-9](?:[-a-zA-Z0-9]*[a-zA-Z0-9])?\.)+(?:com|net|org|edu|gov|io|dev|app|vn|ai|co|info|me|tech|site|online|store|tv|xyz|cc|to|so|page|link|space|club|pro|biz|live|top|us|uk|jp|de|fr)(?::\d+)?(?:\/[^\s<>"'{}|\\^`[\]]*)?|localhost:\d+(?:\/[^\s<>"'{}|\\^`[\]]*)?)/gi;
  const foundLinks: { text?: string; url: string }[] = [];

  let match;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    foundLinks.push({ text: match[1], url: match[2] });
  }
  if (foundLinks.length === 0) {
    while ((match = bareUrlRegex.exec(content)) !== null) {
      const { url } = cleanUrlTrailingPunctuation(match[1]);
      let fullUrl = url;
      if (url.startsWith('localhost:')) {
        fullUrl = `http://${url}`;
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = `https://${url}`;
      }
      foundLinks.push({ url: fullUrl });
    }
  }

  // Checklist detection (Loại trừ các dòng nằm trong code blocks)
  const contentWithoutCode = content.replace(/```[\s\S]*?```/g, '');
  const checklistRegex = /^(\s*(?:>{1,3}\s*)?(?:(?:[-*+•⁃◦▪▫▸►=>/]|(?:\(?\d+(?:[\.\/]\d+)*[\.\)]?)|(?:\(?[a-zA-Z][\.\)]))\s*)?\[(\s*|[xXvV✓✔\+\*])\]|\s*(?:>{1,3}\s*)?(?:(?:[-*+•⁃◦▪▫▸►]|\d+[\.\)])\s*)?(?:todo|done|cần làm|đã làm|chưa làm|nhiệm vụ|hoàn thành):)/gmi;
  const doneRegex = /^(\s*(?:>{1,3}\s*)?(?:(?:[-*+•⁃◦▪▫▸►=>/]|(?:\(?\d+(?:[\.\/]\d+)*[\.\)]?)|(?:\(?[a-zA-Z][\.\)]))\s*)?\[[xXvV✓✔\+\*]\]|\s*(?:>{1,3}\s*)?(?:(?:[-*+•⁃◦▪▫▸►]|\d+[\.\)])\s*)?(?:done|đã làm|hoàn thành):)/gmi;

  const totalMatches = contentWithoutCode.match(checklistRegex) || [];
  const doneMatches = contentWithoutCode.match(doneRegex) || [];

  const hasImages =
    /!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)/.test(content) ||
    /\.(png|jpe?g|webp|svg|gif)(\?[^\s]*)?/i.test(content);

  const hasCode = /```[\s\S]*?```/.test(content);
  const hasFiles = /\.(pdf|docx?|pptx?|xlsx?|zip|rar|tar|gz)(\?[^\s]*)?/i.test(content);
  const hasTables = /\|.+\|.+\|/.test(content);

  return {
    links: foundLinks,
    firstLink: foundLinks[0]?.url || null,
    checklist: {
      total: totalMatches.length,
      done: doneMatches.length,
      active: totalMatches.length > 0
    },
    hasImages,
    hasCode,
    hasFiles,
      hasTables
  };
}

/**
 * Đảo trạng thái một dòng đơn lẻ (Task Line Toggler):
 * - Hộp kiểm: [ ] <-> [x], [X], [v], [✓], [✔]
 * - Từ khóa: todo: <-> done:, cần làm: <-> đã làm:, nhiệm vụ: <-> hoàn thành:
 */
export function toggleSingleTaskLine(line: string): string {
  // 1. Dạng hộp kiểm chuẩn Markdown và mọi biến thể bullet (•, -, *, +, 1., 1.1., a., (1), blockquotes > [ ], v.v...)
  const taskMatch = line.match(/^(\s*(?:>{1,3}\s*)?(?:(?:[-*+•⁃◦▪▫▸►=>/]|(?:\(?\d+(?:[\.\/]\d+)*[\.\)]?)|(?:\(?[a-zA-Z][\.\)]))\s*)?\[)(\s*|[xXvV✓✔\+\*])(\]\s*.*)$/);
  if (taskMatch) {
    const markContent = taskMatch[2] || '';
    const isDone = Boolean(markContent.trim() !== '');
    const newMark = isDone ? ' ' : 'x';
    return `${taskMatch[1]}${newMark}${taskMatch[3]}`;
  }

  // 2. Dạng từ khóa tự nhiên: todo / cần làm / nhiệm vụ / chưa làm -> chuyển thành done
  const todoMatch = line.match(/^(\s*(?:>{1,3}\s*)?(?:(?:[-*+•⁃◦▪▫▸►]|(?:\d+[\.\)])\s*)?))(todo|cần làm|chưa làm|nhiệm vụ)(:\s*.*)$/i);
  if (todoMatch) {
    return `${todoMatch[1]}done${todoMatch[3]}`;
  }

  // 3. Dạng từ khóa tự nhiên: done / đã làm / hoàn thành -> chuyển thành todo
  const doneMatch = line.match(/^(\s*(?:>{1,3}\s*)?(?:(?:[-*+•⁃◦▪▫▸►]|(?:\d+[\.\)])\s*)?))(done|đã làm|hoàn thành)(:\s*.*)$/i);
  if (doneMatch) {
    return `${doneMatch[1]}todo${doneMatch[3]}`;
  }

  return line;
}

/**
 * Đảo trạng thái dòng theo CHỈ MỤC DÒNG CHÍNH XÁC (Exact Line Number Indexing - O(1)):
 * Trực tiếp thay đổi dòng lineIndex mà không cần duyệt đoán chỉ mục toàn văn bản.
 */
export function toggleLineAtIndex(content: string, lineIndex: number): string {
  if (!content) return '';
  const lines = content.split('\n');
  if (lineIndex < 0 || lineIndex >= lines.length) return content;

  lines[lineIndex] = toggleSingleTaskLine(lines[lineIndex]);
  return lines.join('\n');
}

/**
 * Thuật toán đảo trạng thái Checklist tổng quát (Hỗ trợ cả Line Index lẫn Sequential Todo Index)
 */
export function toggleChecklistItem(content: string, targetIndex: number): string {
  if (!content) return '';
  const lines = content.split('\n');

  // Nếu targetIndex là chỉ mục dòng hợp lệ và trỏ đúng vào 1 task line, thực thi O(1) ngay lập tức
  if (targetIndex >= 0 && targetIndex < lines.length) {
    const toggled = toggleSingleTaskLine(lines[targetIndex]);
    if (toggled !== lines[targetIndex]) {
      lines[targetIndex] = toggled;
      return lines.join('\n');
    }
  }

  // Fallback: Tìm task line thứ targetIndex tuần tự
  let currentIndex = 0;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }

    const toggled = toggleSingleTaskLine(line);
    if (toggled !== line) {
      if (currentIndex === targetIndex) {
        lines[i] = toggled;
        return lines.join('\n');
      }
      currentIndex++;
    }
  }

  return content;
}

/**
 * HỆ THỐNG LIÊN KẾT TRI THỨC VÀ GẮN THẺ KIỂU OBSIDIAN (OBSIDIAN KNOWLEDGE ENGINE)
 */
export interface WikiLink {
  raw: string;
  target: string;
  alias?: string;
}

export function extractWikiLinks(content: string = ''): WikiLink[] {
  if (!content) return [];
  const regex = /\[\[([^\]\|]+)(?:\|([^\]]+))?\]\]/g;
  const links: WikiLink[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    links.push({
      raw: match[0],
      target: match[1].trim(),
      alias: match[2]?.trim()
    });
  }
  return links;
}

export function extractTags(content: string = ''): string[] {
  if (!content) return [];
  const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF-]+)(?=\s|$|[.,;:!?])/g;
  const tags = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1].trim();
    if (tag && !/^\d+$/.test(tag)) {
      tags.add(tag);
    }
  }
  return Array.from(tags);
}

export interface OutlineHeading {
  level: number;
  title: string;
  lineIndex: number;
}

export function extractOutline(content: string = ''): OutlineHeading[] {
  if (!content) return [];
  const lines = content.split('\n');
  const headings: OutlineHeading[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        title: match[2].trim(),
        lineIndex: i
      });
    }
  }
  return headings;
}
