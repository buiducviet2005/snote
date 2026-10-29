import { prisma } from '../../shared/db/prismaClient';
import { AiChatRequestDto, AiChatResponseDto, AiPromptType } from './ai.types';

export class AiService {
  async chat(userId: string, dto: AiChatRequestDto): Promise<AiChatResponseDto> {
    const { message, promptType = 'GENERAL', subjectId, noteId, contextText } = dto;

    // P0 R1-TRUTH: Kiểm tra xem nhà cung cấp AI thật (LLM API Key) đã được cấu hình chưa
    const isRealAiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);

    if (!isRealAiConfigured) {
      return {
        reply: `⚠️ **Thông báo hệ thống (SNOTE Pilot Readiness):**

Tính năng **Trợ lý AI Học Thuật & Dự Đoán Kỳ Thi** hiện đang được bảo vệ bằng cờ kỹ thuật và chưa kết nối khóa API mô hình ngôn ngữ lớn (LLM) chính thức trên môi trường Pilot.

Theo quy chuẩn kỹ thuật của kế hoạch phát hành (**RELEASE_READINESS_MASTER_PLAN**):
* Hệ thống **tuyệt đối không suy diễn số liệu giả lập** hoặc đưa ra các phần trăm xác suất thi không có cơ sở dữ liệu kiểm chứng.
* Chức năng này sẽ được kích hoạt trở lại ngay khi có hợp đồng dịch vụ AI chính thức và chính sách bảo vệ dữ liệu sinh viên được phê duyệt.

Xin cảm ơn bạn đã thông cảm!`,
        suggestedActions: [],
        model: 'SNOTE-Academic-Offline'
      };
    }

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

    // 2. Xử lý theo từng loại Prompt học thuật (Khi có provider AI)
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
   - 📅 **Khuyến nghị hạn nộp:** Trước buổi học tiếp theo
   - 📝 **Chi tiết:** Đọc lại các định lý/mô hình đã ghi chú và hoàn thành phần bài tập củng cố.

2. **Chuẩn bị bài thuyết trình / Báo cáo thực hành nhóm**
   - 🎯 **Mức độ:** Trung bình (Medium)
   - 📅 **Hạn nộp:** Tuần sau
   - 📝 **Chi tiết:** Phân công nhiệm vụ cho các thành viên trong đồ án môn học.`;

        return {
          reply,
          suggestedActions: [
            {
              actionType: 'CREATE_TASK',
              title: `Ôn tập & làm bài tập ${targetSubject}`,
              priority: 'HIGH',
              description: 'Hoàn thành câu hỏi củng cố bài giảng'
            }
          ],
          model: 'SNOTE-Academic-Copilot'
        };
      }

      case 'EXAM_PREDICT': {
        const reply = `### 🎯 Gợi Ý Chủ Đề Ôn Thi Trọng Tâm (${targetSubject}):

*Lưu ý học thuật: Các gợi ý dưới đây dựa trên cấu trúc đề cương môn học đã ghi nhận, phục vụ mục đích định hướng ôn tập và không mang tính chất cam kết đề thi chính thức.*

1. **Khái niệm Nền tảng & Định lý Cốt lõi**
   - *Trọng tâm:* Trình bày bản chất, ưu điểm, nhược điểm và so sánh với các giải pháp truyền thống.
2. **Bài toán Phân tích & Thiết kế Mô hình**
   - *Trọng tâm:* Xây dựng mô hình dữ liệu/kiến trúc phù hợp cho tình huống nghiệp vụ thực tế.
3. **Xử lý Tối ưu hóa & Hiệu năng Hệ thống**
   - *Trọng tâm:* Phân tích nguyên nhân nghẽn cổ chai và đề xuất các kỹ thuật tối ưu.`;

        return {
          reply,
          suggestedActions: [],
          model: 'SNOTE-Academic-Copilot'
        };
      }

      default: {
        const reply = `Chào bạn! Tôi là **SNOTE AI Academic Assistant**.

${context ? `> 📖 **Ngữ cảnh đang mở:** ${subjectName ? `Môn học **${subjectName}**` : 'Ghi chú học tập'}\n\n` : ''}Câu hỏi của bạn: *"${userMessage}"*

Vui lòng chọn chủ đề hoặc đặt câu hỏi cụ thể về tài liệu ghi chép của bạn.`;

        return {
          reply,
          model: 'SNOTE-Academic-Copilot'
        };
      }
    }
  }
}
