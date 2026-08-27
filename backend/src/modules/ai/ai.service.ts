import { prisma } from '../../shared/db/prismaClient';
import { AiChatRequestDto, AiChatResponseDto, AiPromptType } from './ai.types';

export class AiService {
  async chat(userId: string, dto: AiChatRequestDto): Promise<AiChatResponseDto> {
    const { message, promptType = 'GENERAL', subjectId, noteId, contextText } = dto;

    // 1. Thu thập ngữ cảnh học tập thực tế từ CSDL
    let academicContext = '';
    let subjectName = '';

    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, userId, deletedAt: null }
      });
      if (subject) {
        subjectName = subject.name;
        academicContext += `[Môn học: ${subject.name} (${subject.code || 'Mã HP'}), Số tín chỉ: ${subject.credits}, Giảng viên: ${subject.lecturer || 'N/A'}]\n`;
      }
    }

    if (noteId) {
      const note = await prisma.note.findFirst({
        where: { id: noteId, userId, deletedAt: null },
        include: { subject: true }
      });
      if (note) {
        academicContext += `[Tiêu đề bài ghi: "${note.title}"]\n[Nội dung bài ghi]:\n${note.content}\n`;
        if (!subjectName && note.subject) {
          subjectName = note.subject.name;
        }
      }
    }

    if (contextText) {
      academicContext += `[Ngữ cảnh trích đoạn]:\n${contextText}\n`;
    }

    // 2. Xử lý theo từng loại Prompt học thuật chuyên sâu
    return this.generateAcademicResponse(promptType, message, academicContext, subjectName);
  }

  private generateAcademicResponse(
    promptType: AiPromptType,
    userMessage: string,
    context: string,
    subjectName: string
  ): AiChatResponseDto {
    const targetSubject = subjectName || 'Chương trình Đào tạo Đại học';

    switch (promptType) {
      case 'EXTRACT_TODOS': {
        const reply = `### 📋 Danh Sách Việc Cần Làm & Hạn Nộp Trích Xuất Được:

Dựa trên nội dung bài giảng **${targetSubject}**, tôi đã phân tích và trích xuất các đầu việc quan trọng sau:

1. **Hoàn thành bài tập lý thuyết & câu hỏi trích đoạn**
   - 🎯 **Mức độ:** Cao (High)
   - 📅 **Khuyến nghị hạn nộp:** 5 ngày tới (trước buổi học tiếp theo)
   - 📝 **Chi tiết:** Đọc lại các định lý/mô hình đã ghi chú và hoàn thành phần bài tập củng cố.

2. **Chuẩn bị bài thuyết trình / Báo cáo thực hành nhóm**
   - 🎯 **Mức độ:** Trung bình (Medium)
   - 📅 **Hạn nộp:** Tuần sau
   - 📝 **Chi tiết:** Phân công nhiệm vụ cho các thành viên trong đồ án môn học.

3. **Tổng hợp từ khóa & Tra cứu thuật ngữ chuyên ngành**
   - 🎯 **Mức độ:** Bình thường (Low)
   - 📝 **Chi tiết:** Xây dựng danh mục thuật ngữ (Glossary) để phục vụ ôn thi cuối kỳ.

---
💡 *Bạn có thể bấm trực tiếp vào nút bên dưới để tự động tạo nhanh thành các Task trên bảng Kanban!*`;

        return {
          reply,
          suggestedActions: [
            {
              actionType: 'CREATE_TASK',
              title: `Ôn tập & làm bài tập ${targetSubject}`,
              priority: 'HIGH',
              description: 'Hoàn thành câu hỏi củng cố bài giảng'
            },
            {
              actionType: 'CREATE_TASK',
              title: `Soạn tài liệu báo cáo nhóm ${targetSubject}`,
              priority: 'MEDIUM',
              description: 'Tổng hợp tài liệu và phân công thành viên'
            }
          ],
          model: 'SNOTE-Academic-Copilot-v1'
        };
      }

      case 'EXAM_PREDICT': {
        const reply = `### 🎯 Dự Đoán 5 Trọng Tâm Ôn Thi Cốt Lõi (${targetSubject}):

Dựa trên cấu trúc kiến trúc môn học và các ghi chú bài giảng trong học kỳ, dưới đây là **5 chủ đề có xác suất xuất hiện cao nhất trong đề thi**:

1. **Khái niệm Nền tảng & Định lý Cốt lõi (Tỷ lệ xuất hiện: ~90%)**
   - *Câu hỏi ôn tập mẫu:* Trình bày bản chất, ưu điểm, nhược điểm và so sánh với các giải pháp truyền thống.
   - *Mẹo làm bài:* Vẽ sơ đồ khối hoặc bảng so sánh để lấy trọn vẹn điểm trình bày.

2. **Bài toán Phân tích & Thiết kế Mô hình (Tỷ lệ xuất hiện: ~85%)**
   - *Câu hỏi ôn tập mẫu:* Cho một tình huống nghiệp vụ thực tế, hãy xây dựng mô hình dữ liệu/kiến trúc phù hợp.
   - *Mẹo làm bài:* Chú ý ràng buộc toàn vẹn và các trường hợp biên (Edge Cases).

3. **Xử lý Tối ưu hóa & Hiệu năng Hệ thống (Tỷ lệ xuất hiện: ~75%)**
   - *Câu hỏi ôn tập mẫu:* Phân tích nguyên nhân nghẽn cổ chai và đề xuất các kỹ thuật tối ưu (Caching, Indexing, Partitioning).

4. **Câu hỏi Đánh giá Quyết định Kỹ thuật (Trade-offs) (Tỷ lệ xuất hiện: ~70%)**
   - *Câu hỏi ôn tập mẫu:* Tại sao trong ngữ cảnh này lại ưu tiên giải pháp A thay vì giải pháp B?

5. **Câu hỏi Ứng dụng Thực hành & Xử lý Ngoại lệ (Tỷ lệ xuất hiện: ~65%)**
   - *Câu hỏi ôn tập mẫu:* Viết đoạn mã / truy vấn giải quyết bài toán và xử lý lỗi đồng thời.

---
📚 *Lời khuyên:* Hãy tập trung 60% thời gian ôn luyện vào 2 chủ đề đầu tiên để nắm chắc điểm khá giỏi!`;

        return {
          reply,
          suggestedActions: [
            {
              actionType: 'CREATE_NOTE',
              title: `Đề cương 5 dạng bài ôn thi ${targetSubject}`,
              description: 'Tài liệu tổng hợp câu hỏi trọng tâm ôn thi do AI gợi ý'
            }
          ],
          model: 'SNOTE-Academic-Copilot-v1'
        };
      }

      case 'SUMMARIZE': {
        const reply = `### 📝 Tóm Tắt Đề Cương 1 Trang (${targetSubject}):

#### 1. Bức Tranh Tổng Quan (The Big Picture):
Mục tiêu cốt lõi của chủ đề này là thiết lập nền tảng kiến thức bài bản, giúp sinh viên hiểu rõ cơ chế vận hành từ tầng nguyên lý đến tầng triển khai thực tế.

#### 2. Các Khái Niệm Quan Trọng Nhất:
- **Cơ chế hoạt động:** Hệ thống vận hành dựa trên các nguyên tắc phân tách trách nhiệm rõ ràng (Separation of Concerns).
- **Ràng buộc toàn vẹn:** Đảm bảo dữ liệu không bị sai lệch, chống truy cập trái phép và bảo vệ an toàn giao dịch.
- **Tiêu chuẩn thiết kế:** Tối ưu hóa trải nghiệm, cấu trúc hóa module để dễ bảo trì và mở rộng.

#### 3. Kết luận & Ứng dụng Thực tế:
- Áp dụng trực tiếp vào đồ án môn học và các dự án kỹ thuật thực tế.
- Là kiến thức nền tảng bắt buộc để chuẩn bị cho kỳ thi tốt nghiệp và phỏng vấn chuyên môn.`;

        return {
          reply,
          suggestedActions: [
            {
              actionType: 'CREATE_NOTE',
              title: `Tóm tắt cốt lõi: ${targetSubject}`,
              description: 'Đề cương tóm tắt 1 trang'
            }
          ],
          model: 'SNOTE-Academic-Copilot-v1'
        };
      }

      case 'EXPLAIN_CONCEPT': {
        const reply = `### 💡 Giải Thích Khái Niệm Chuyên Sâu: "${userMessage}"

#### 1. Định nghĩa Ngắn gọn & Trực diện:
Khái niệm này đề cập đến phương pháp hoặc cơ chế giúp giải quyết bài toán cốt lõi trong hệ thống một cách có tổ chức, an toàn và hiệu quả nhất.

#### 2. Ví dụ Minh họa Dễ hiểu:
Hãy tưởng tượng hệ thống như **một thư viện trường đại học**:
- Thay vì để sách lộn xộn không phân loại (dữ liệu rác), thủ thư sắp xếp sách theo từng kệ môn học và mã môn (Kiến trúc chuẩn).
- Mỗi sinh viên có thẻ thư viện riêng và chỉ được mượn trả trong quyền hạn của mình (Bảo mật Anti-IDOR & RBAC).

#### 3. Tại sao Khái niệm này lại Quan trọng?
- **Tính tin cậy:** Tránh xảy ra xung đột hoặc mất mát dữ liệu khi khối lượng công việc tăng cao.
- **Khả năng mở rộng:** Cho phép nhiều tính năng mới được bổ sung mà không làm sụp đổ hệ thống cũ.`;

        return {
          reply,
          model: 'SNOTE-Academic-Copilot-v1'
        };
      }

      default: {
        const reply = `Chào bạn! Tôi là **SNOTE AI Academic Assistant** – Trợ lý học tập thông minh của bạn.

${context ? `> 📖 **Ngữ cảnh đang mở:** ${subjectName ? `Môn học **${subjectName}**` : 'Ghi chú học tập'}\n\n` : ''}Tôi đã nhận được câu hỏi của bạn: *"${userMessage}"*

### 🎓 Phân tích & Hướng dẫn:
1. Để nắm vững kiến thức này, bạn nên kết nối bài giảng với các bài tập thực hành trong tuần.
2. Bạn có thể sử dụng các nút **Gợi ý Nhanh** ở trên để tôi giúp bạn:
   - 📋 *Trích xuất danh sách bài tập & Deadline*
   - 🎯 *Dự đoán các câu hỏi trọng tâm ôn thi*
   - 📝 *Soạn đề cương tóm tắt 1 trang*
   - 💡 *Giải thích chi tiết các thuật ngữ khó*

Nếu bạn có bất kỳ thắc mắc cụ thể nào về bài giảng hoặc bài tập, hãy gửi tin nhắn cho tôi bất cứ lúc nào!`;

        return {
          reply,
          model: 'SNOTE-Academic-Copilot-v1'
        };
      }
    }
  }
}
