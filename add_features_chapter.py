# -*- coding: utf-8 -*-
"""
Script to append Chapter 3 (Features & Modules) into SNOTE.docx
Matching the exact formatting, font sizing, and styling of Chapter 1 & 2.
"""

import os
import shutil
import docx
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def build_chapter_3():
    # 1. Restore from clean backup
    backup_path = "SNOTE_backup.docx"
    doc_path = "SNOTE.docx"
    shutil.copyfile(backup_path, doc_path)

    doc = Document(doc_path)

    # Color definitions matching academic standards
    COLOR_BLACK = RGBColor(0, 0, 0)
    COLOR_MUTED = RGBColor(100, 116, 139)

    # Helper: Set shading of a cell
    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    # Helper: Set cell margins (padding)
    def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for margin, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
            node = parse_xml(f'<{margin} {nsdecls("w")} w:w="{val}" w:type="dxa"/>')
            tcMar.append(node)
        tcPr.append(tcMar)

    # Helper: Add Chapter Heading (Heading 1 style in SNOTE.docx)
    def add_chapter_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(14.0)
        run.font.bold = True
        run.font.color.rgb = COLOR_BLACK
        return p

    # Helper: Add Heading 2 (e.g., 3.1.)
    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_BLACK
        return p

    # Helper: Add Heading 3 (e.g., 3.1.1.)
    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(12.0)
        run.font.bold = True
        run.font.color.rgb = COLOR_BLACK
        return p

    # Helper: Add Body Paragraph
    def add_body(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        if bold_prefix:
            run_bp = p.add_run(bold_prefix)
            run_bp.font.size = Pt(12.0)
            run_bp.font.bold = True
            run_bp.font.color.rgb = COLOR_BLACK

        run = p.add_run(text)
        run.font.size = Pt(12.0)
        run.font.color.rgb = COLOR_BLACK
        return p

    # Helper: Add Bullet point
    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(1.5)
        p.paragraph_format.line_spacing = 1.15
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        if bold_prefix:
            run_bp = p.add_run(bold_prefix)
            run_bp.font.size = Pt(11.5)
            run_bp.font.bold = True
            run_bp.font.color.rgb = COLOR_BLACK

        run = p.add_run(text)
        run.font.size = Pt(11.5)
        run.font.color.rgb = COLOR_BLACK
        return p

    # Helper: Add Figure
    def add_figure(img_path, caption):
        if os.path.exists(img_path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run()
            run.add_picture(img_path, width=Inches(5.8))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(8)
            r_cap = p_cap.add_run(caption)
            r_cap.font.size = Pt(10.0)
            r_cap.font.italic = True
            r_cap.font.color.rgb = COLOR_MUTED

    # Helper: Add Table
    def add_styled_table(headers, rows_data, col_widths=None):
        table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            set_cell_background(hdr_cells[i], "1E3A8A")
            set_cell_margins(hdr_cells[i], top=90, bottom=90, left=100, right=100)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.size = Pt(10.0)
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

        # Data Rows
        for r_idx, row in enumerate(rows_data):
            row_cells = table.rows[r_idx + 1].cells
            bg_color = "FFFFFF" if r_idx % 2 == 0 else "F8FAFC"
            for c_idx, val in enumerate(row):
                row_cells[c_idx].text = str(val)
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_margins(row_cells[c_idx], top=70, bottom=70, left=90, right=90)
                p = row_cells[c_idx].paragraphs[0]
                p.paragraph_format.line_spacing = 1.15
                p.paragraph_format.space_before = Pt(1)
                p.paragraph_format.space_after = Pt(1)
                for r in p.runs:
                    r.font.size = Pt(10.0)
                    r.font.color.rgb = COLOR_BLACK

        # Borders
        tblPr = table._tbl.tblPr
        tblBorders = parse_xml(f'''
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>
                <w:left w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                <w:bottom w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>
                <w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            </w:tblBorders>
        ''')
        tblPr.append(tblBorders)

        if col_widths:
            for row in table.rows:
                for c_idx, width in enumerate(col_widths):
                    row.cells[c_idx].width = Inches(width)

        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(2)
        sp.paragraph_format.space_after = Pt(4)
        return table

    # Remove any trailing empty paragraphs at the end of doc
    while len(doc.paragraphs) > 0 and not doc.paragraphs[-1].text.strip():
        p_elem = doc.paragraphs[-1]._p
        p_elem.getparent().remove(p_elem)

    # =========================================================================
    # CHƯƠNG 3: CÁC TÍNH NĂNG VÀ PHÂN HỆ CHỨC NĂNG CỦA HỆ THỐNG SNOTE
    # =========================================================================
    doc.add_page_break()

    add_chapter_title("CHƯƠNG 3: CÁC TÍNH NĂNG VÀ PHÂN HỆ CHỨC NĂNG CỦA HỆ THỐNG SNOTE")

    add_body(
        "Dựa trên kiến trúc kỹ thuật Modular Monolith và nền tảng cơ sở dữ liệu quan hệ chuẩn hóa đã trình bày ở Chương 2, "
        "hệ thống SNOTE hiện thực hóa trọn vẹn 12 phân hệ chức năng nghiệp vụ độc lập nhưng kết nối mật thiết với nhau. "
        "Các tính năng được thiết kế xoay quanh mục tiêu cốt lõi: triệt tiêu hoàn toàn vấn nạn 'ghi chú rác' (Junk Notes), "
        "tối ưu hóa luồng làm việc học tập hàng ngày của sinh viên đại học, và hỗ trợ ôn thi có cấu trúc thông qua sự kết hợp "
        "giữa giao diện tương tác tốc độ cao và trí tuệ nhân tạo (AI Copilot)."
    )

    # 3.1
    add_h2("3.1. Phân hệ Quản lý Cấu trúc Học thuật (Academic Hierarchy) & Cơ chế Triệt tiêu 'Note Rác'")
    add_h3("3.1.1. Quản lý Học kỳ (Semesters) và Môn học (Subjects)")
    add_body(
        "Hệ thống thiết lập một cấu trúc tổ chức tri thức có kỷ luật phản ánh chính xác thực tế đào tạo tín chỉ tại các trường đại học:"
    )
    add_bullet("Quản lý Học kỳ (Semesters): Sinh viên có thể tạo lập và quản lý các học kỳ (ví dụ: 'Học kỳ 1 - 2025-2026', 'Học kỳ 2 - 2025-2026'). Mỗi học kỳ lưu trữ thông tin về năm học (academicYear), trạng thái vận hành (ACTIVE, COMPLETED, ARCHIVED) và cờ đánh dấu Học kỳ hiện tại (isCurrent). Toàn bộ hệ thống sẽ tự động lọc dữ liệu môn học, thời khóa biểu và deadline tương ứng theo học kỳ đang kích hoạt.", "- ");
    add_bullet("Quản lý Môn học (Subjects): Dưới mỗi học kỳ, sinh viên khai báo các môn học cụ thể kèm theo mã môn học (code - ví dụ: IT3010), số tín chỉ (credits), tên giảng viên phụ trách (lecturer) và bảng màu nhận diện trực quan (color hex code). Hệ thống cung cấp các thẻ màu sắc (Color Badges) đồng bộ trên toàn bộ bài ghi, lịch học và bảng công việc giúp sinh viên phân biệt tức thì các học phần khác nhau.", "- ");

    add_h3("3.1.2. Ràng buộc bất biến chống 'Note rác' (Core Anti-Junk Constraint)")
    add_body(
        "Một trong những điểm khác biệt mang tính triết lý của SNOTE so với các ứng dụng ghi chú tự do (như Google Keep hay Apple Notes) "
        "là cơ chế ngăn chặn việc tạo ghi chép vô định hình. Tại mức CSDL PostgreSQL và tầng thẩm định Zod DTO Backend, hệ thống thiết lập quy tắc bất biến:"
    )
    add_bullet("Ràng buộc kỹ thuật bắt buộc: Mọi ghi chú (Note) và công việc (Task) khi tạo mới bắt buộc phải gắn liền với ít nhất một Môn học (subjectId IS NOT NULL) hoặc một Đồ án môn học (projectId IS NOT NULL).", "• ");
    add_bullet("Hiệu quả thực tiễn: Cơ chế này triệt tiêu hoàn toàn tình trạng sinh viên tạo hàng trăm ghi chú rời rạc, không rõ của môn nào, để rồi trước kỳ thi biến thành một kho rác dữ liệu không thể tra cứu. Tri thức được tích lũy theo từng học phần và sẵn sàng tái sử dụng cho các kỳ thi học kỳ.", "• ");

    # 3.2
    add_h2("3.2. Không gian Làm việc Học thuật Hợp nhất (Unified Academic Workspace)")
    add_h3("3.2.1. Trung tâm điều phối đa luồng (/workspace) với 3 Tab chuyên sâu")
    add_body(
        "Thay vì buộc sinh viên phải liên tục chuyển hướng giữa hàng loạt trang web riêng rẽ gây gián đoạn mạch tập trung, "
        "SNOTE xây dựng trang Academic Workspace (/workspace) đóng vai trò trung tâm điều phối mọi hoạt động học thuật hàng ngày. "
        "Trang tổng hợp tích hợp sẵn 3 Tab nghiệp vụ chuyên sâu hoạt động mượt mà không tải lại trang:"
    )
    add_bullet("Tab Ghi chú (Notes Tab): Toàn bộ kho bài giảng lý thuyết, báo cáo thực hành, đề cương ôn thi của sinh viên được hiển thị trực quan kèm bộ công cụ chuyển đổi chế độ xem và tìm kiếm nhanh.", "• ");
    add_bullet("Tab Công việc (Tasks Tab): Bảng điều khiển quản lý deadline, bài tập cá nhân và tiến độ bài tập lớn của các môn học trong kỳ.", "• ");
    add_bullet("Tab Lịch trình (Schedule Tab): Thời khóa biểu tuần 7 ngày và Sơ đồ Gantt Timeline tiến độ theo thời gian thực.", "• ");

    add_h3("3.2.2. Thanh lọc đồng bộ đa chiều (Unified Filter Bar)")
    add_body(
        "Nằm cố định ở đầu không gian làm việc, thanh lọc đa chiều (Unified Filter Bar) sử dụng React Context API để lưu trữ trạng thái bộ lọc toàn cục. "
        "Khi sinh viên lựa chọn một Môn học cụ thể (ví dụ: 'Phát triển phần mềm mã nguồn mở') hoặc một Thẻ phân loại (Tag), dữ liệu hiển thị "
        "ở cả 3 Tab (Ghi chú, Công việc, Lịch trình) lập tức được đồng bộ hóa tức thì chỉ trong vòng dưới 10ms, giúp sinh viên có cái nhìn toàn cảnh "
        "về duy nhất môn học đó mà không bị phân tâm bởi các môn khác."
    )

    # 3.3
    add_h2("3.3. Phân hệ Quản lý Ghi chú Chuyên sâu (Advanced Notes Management)")
    add_h3("3.3.1. Phân loại 6 loại bài ghi học thuật (Academic Note Types)")
    add_body(
        "Khác với các ứng dụng phổ thông chỉ xem văn bản là một khối text chung chung, SNOTE định hình cấu trúc ghi chú theo 6 phân loại học thuật chuyên biệt (NoteType Enum):"
    )
    add_bullet("LECTURE (Bài giảng lý thuyết): Ghi lại nội dung slide, lời giảng của thầy cô trên lớp, kiến thức nền tảng.", "- ");
    add_bullet("LAB_REPORT (Báo cáo thực hành): Lưu trữ các bước thí nghiệm, thông số thực hành, mã code mẫu và kết quả chạy thử nghiệm.", "- ");
    add_bullet("EXAM_PREP (Đề cương ôn thi): Tập trung các công thức cốt lõi, dạng bài tập điển hình, câu hỏi trọng tâm chuẩn bị cho kỳ thi kết thúc học phần.", "- ");
    add_bullet("PROJECT_LOG (Nhật ký đồ án): Ghi chép tiến độ triển khai dự án, các lỗi gặp phải và giải pháp xử lý kỹ thuật.", "- ");
    add_bullet("MEETING_MINUTES (Biên bản họp nhóm): Biên bản cuộc họp bài tập lớn, ghi nhận phân công nhiệm vụ và thời hạn nộp bài của từng thành viên.", "- ");
    add_bullet("GENERAL (Ghi chú chung): Các thông tin học thuật tham khảo khác liên quan tới môn học.", "- ");

    add_h3("3.3.2. Trình soạn thảo & Kết xuất Markdown chuẩn GitHub (GFM)")
    add_body(
        "Trình soạn thảo ghi chú của SNOTE tích hợp chuẩn GitHub Flavored Markdown (GFM) hiện đại nhất, đáp ứng hoàn hảo nhu cầu ghi chép của sinh viên khối kỹ thuật và công nghệ:"
    )
    add_bullet("Định dạng phong phú: Hỗ trợ tiêu đề các cấp (H1 đến H6), bôi đậm, in nghiêng, trích dẫn khối (blockquotes), danh sách đánh số, danh sách việc có checkbox tương tác.", "• ");
    add_bullet("Khối mã nguồn lập trình có đánh dấu cú pháp (Syntax Highlighting): Tự động tô màu mã nguồn cho hơn 40 ngôn ngữ lập trình (C/C++, Python, JavaScript, Java, SQL, TypeScript), kèm nút bấm sao chép mã nguồn nhanh 1-Click.", "• ");
    add_bullet("Bảng biểu và biểu đồ: Kết xuất bảng dữ liệu chuẩn xác, sạch sẽ, hỗ trợ chèn đường link tham khảo và hình ảnh minh họa bài học.", "• ");

    add_h3("3.3.3. 5 Chế độ hiển thị ghi chú linh hoạt (5 Flexible View Modes)")
    add_body(
        "SNOTE cung cấp 5 chế độ xem ghi chú khác nhau để sinh viên tự do lựa chọn tùy theo mục đích học tập:"
    )
    add_bullet("Chế độ Lưới (GRID View): Hiển thị ghi chú dưới dạng lưới thẻ trực quan, nổi bật tiêu đề, môn học, ngày tạo và trích đoạn nội dung ngắn.", "1. ");
    add_bullet("Chế độ Bento thu gọn (COMPACT BENTO View): Bố cục bất đối xứng hiện đại lấy cảm hứng từ hộp cơm Bento Nhật Bản, tối ưu hóa diện tích hiển thị trên màn hình laptop.", "2. ");
    add_bullet("Chế độ Chia đôi màn hình (SPLIT View): Màn hình soạn thảo Markdown nằm bên trái song song với màn hình kết xuất giao diện trực tiếp bên phải, hỗ trợ kiểm tra định dạng tức thì khi đang gõ phím.", "3. ");
    add_bullet("Chế độ Cột Kanban (KANBAN View): Sắp xếp các ghi chú thành các cột dựa theo phân loại bài ghi (NoteType) hoặc trạng thái ôn tập, tiện lợi cho việc theo dõi đề cương môn học.", "4. ");
    add_bullet("Chế độ Danh sách bảng biểu (LIST View): Hiển thị cô đọng dưới dạng bảng hàng ngang, phù hợp cho việc rà soát nhanh hàng trăm bài ghi trước kỳ thi.", "5. ");

    add_h3("3.3.4. Ghim bài học quan trọng và Chuyển Note thành Task 1-Click")
    add_body(
        "Hệ thống tích hợp các tiện ích tương tác sâu phục vụ thói quen học tập của sinh viên:"
    )
    add_bullet("Ghim ghi chú quan trọng (Pin Note): Sinh viên có thể ghim các bài giảng trọng tâm hoặc đề cương ôn thi lên đầu danh sách. Nhờ chỉ mục B-Tree Index trên trường [user_id, is_pinned], các bài ghi ghim được nạp ngay lập tức.", "• ");
    add_bullet("Chuyển đổi Note thành Task 1-Click (Convert Note to Task): Khi đọc lại bài giảng và phát hiện yêu cầu bài tập của giảng viên, sinh viên chỉ cần bấm nút chuyển đổi. Hệ thống sẽ tự động bóc tách tiêu đề bài giảng thành một Công việc mới trong phân hệ Tasks, tự động kế thừa môn học và gắn liên kết ngược (Task-Note Link), triệt tiêu hoàn toàn thao tác sao chép thủ công.", "• ");

    # 3.4
    add_h2("3.4. Phân hệ Quản lý Công việc & Tiến độ Học tập (Tasks & Productivity)")
    add_h3("3.4.1. Bảng điều khiển Kanban và Danh sách việc cần làm (Todo List)")
    add_body(
        "Quản lý bài tập về nhà, bài tập lớn và đồ án học phần được tổ chức khoa học qua hai dạng hiển thị bổ trợ:"
    )
    add_bullet("Bảng điều khiển Kanban (Kanban Board): Gồm 3 cột trạng thái chuẩn: Cần làm (TODO), Đang thực hiện (IN_PROGRESS), và Đã hoàn thành (DONE). Người dùng có thể kéo thả thẻ công việc mượt mà giữa các cột, trạng thái được cập nhật tức thì xuống CSDL qua API PATCH /api/tasks/:id/status.", "• ");
    add_bullet("Danh sách việc cần làm (Todo List View): Bố cục hàng ngang hiển thị rõ ràng ngày hết hạn, môn học, mức độ ưu tiên và các thẻ phân loại, hỗ trợ lọc nhanh các bài tập chưa hoàn thành.", "• ");

    add_h3("3.4.2. Phân loại 4 mức độ ưu tiên & Kiểm soát Deadline thời gian thực")
    add_body(
        "Nhằm giải quyết triệt để tình trạng 'nước đến chân mới nhảy' hoặc bỏ sót hạn nộp đồ án quan trọng của sinh viên, hệ thống trang bị cơ chế kiểm soát deadline chặt chẽ:"
    )
    add_bullet("4 Cấp độ ưu tiên (TaskPriority Enum): LOW (Thấp - Xanh lá), MEDIUM (Trung bình - Xanh dương), HIGH (Cao - Cam), và URGENT (Khẩn cấp - Đỏ rực).", "• ");
    add_bullet("Đếm ngược thời gian thông minh: Hệ thống tính toán chính xác khoảng cách từ thời điểm hiện tại đến ngày đến hạn (dueDate). Các công việc sắp đến hạn trong vòng 24 giờ hoặc đã quá hạn (Overdue) sẽ được viền đỏ nổi bật kèm thông báo cảnh báo trực quan.", "• ");

    add_h3("3.4.3. Động lực học tập với Vi hiệu ứng ăn mừng (Canvas Confetti)")
    add_body(
        "Nghiên cứu tâm lý học hành vi chỉ ra rằng việc nhận được phản hồi tích cực tức thì sau khi hoàn thành một nhiệm vụ khó khăn sẽ kích hoạt giải phóng dopamine, duy trì hứng thú học tập lâu dài. "
        "SNOTE tích hợp thư viện Canvas Confetti nhẹ: khi sinh viên đánh dấu hoàn thành một bài tập lớn hoặc đồ án quan trọng, màn hình sẽ bung tỏa hiệu ứng pháo hoa giấy rực rỡ mang lại cảm giác thành tựu và thỏa mãn tinh thần sau những giờ học căng thẳng."
    )

    # 3.5
    add_h2("3.5. Phân hệ Thời khóa biểu & Sơ đồ Gantt Timeline Thời gian thực (Gantt Schedule)")
    add_h3("3.5.1. Lịch tuần 7 ngày hợp nhất (Unified Weekly Calendar)")
    add_body(
        "Lịch trình học tập của SNOTE tích hợp 3 loại sự kiện trọng yếu trên một giao diện trực quan 7 ngày từ Thứ Hai đến Chủ Nhật:"
    )
    add_bullet("Tiết học trên lớp (CLASS): Lịch học cố định hàng tuần với thông tin phòng học, ca học và giảng viên phụ trách.", "• ");
    add_bullet("Lịch thi kết thúc học phần (EXAM): Lịch thi giữa kỳ và cuối kỳ kèm số phòng thi và thời gian làm bài, được tô màu cảnh báo đặc biệt.", "• ");
    add_bullet("Hạn nộp bài tập & đồ án (DEADLINE): Tự động đồng bộ từ các công việc trong phân hệ Tasks có thiết lập ngày đến hạn (dueDate).", "• ");

    add_h3("3.5.2. Sơ đồ Gantt Timeline chuyên sâu cho Đồ án và Deadline")
    add_body(
        "Điểm đột phá kỹ thuật nổi bật nhất trong SNOTE là việc hiện thực hóa thành công **Sơ đồ Gantt Timeline trực quan thời gian thực** (/workspace?tab=schedule) "
        "mà không cần phụ thuộc vào các thư viện bên thứ ba nặng nề:"
    )
    add_bullet("Bảng danh sách cố định bên trái (Sticky Left Table): Giữ nguyên vị trí hiển thị tên bài tập lớn/đồ án, môn học, mức độ ưu tiên và người phụ trách khi người dùng cuộn ngang thời gian.", "• ");
    add_bullet("Trục tọa độ thời gian cuộn ngang mượt mà: Các thanh công việc (Gantt Bars) được tính toán vị trí tọa độ động dựa trên ngày bắt đầu (startDate) và ngày hết hạn (dueDate). Chiều dài thanh phản ánh trực quan độ dài của đồ án.", "• ");
    add_bullet("Định vị cột mốc 'Hôm nay' (Today Indicator): Cột ngày hiện tại được đánh dấu bằng một dải màu xanh nổi bật kéo dài toàn bộ chiều cao sơ đồ, giúp sinh viên ngay lập tức xác định mình đang ở đâu trong chu kỳ đồ án.", "• ");
    add_bullet("Hộp thoại Tooltip chi tiết: Rê chuột vào từng thanh Gantt sẽ hiển thị cửa sổ thông tin nhanh về phần trăm tiến độ, thời gian còn lại và các ghi chú liên quan.", "• ");

    # Embed Figure 3.1 & 3.2
    img1 = os.path.join(os.path.dirname(__file__), "DOCS", "temp", "image_128.png")
    img2 = os.path.join(os.path.dirname(__file__), "DOCS", "temp", "image_129.png")
    if os.path.exists(img1):
        add_figure(img1, "Hình 3.1: Giao diện Sơ đồ Gantt Timeline tương tác thời gian thực và quản lý lịch học tập SNOTE")
    if os.path.exists(img2):
        add_figure(img2, "Hình 3.2: Sơ đồ kiến trúc Luồng điều phối và Quản lý Thời gian biểu Sinh viên")

    # 3.6
    add_h2("3.6. Không gian Đồ án & Làm việc Nhóm (Project Collaboration Workspace)")
    add_h3("3.6.1. Quản lý vòng đời đồ án môn học (Project Lifecycle)")
    add_body(
        "Trong chương trình đại học, bài tập lớn và đồ án chiếm phần lớn khối lượng đánh giá kết quả học phần. Phân hệ Projects cung cấp không gian độc lập để quản lý trọn vẹn vòng đời đồ án:"
    )
    add_bullet("Khởi tạo và Phân nhóm: Mỗi đồ án có thể gắn với một môn học cụ thể trong học kỳ, thiết lập mục tiêu, ngày bắt đầu và hạn nộp báo cáo cuối cùng.", "• ");
    add_bullet("Theo dõi tiến độ tự động: Phần trăm hoàn thành của đồ án được hệ thống tính toán tự động dựa trên tỷ lệ các công việc con (Tasks) đã hoàn thành, hiển thị dưới dạng thanh tiến độ (Progress Bar) trực quan.", "• ");

    add_h3("3.6.2. Phân quyền thành viên (Project RBAC) & Phân công nhiệm vụ")
    add_body(
        "Hỗ trợ làm việc nhóm hiệu quả với bảng phân quyền thành viên dự án (project_members):"
    )
    add_bullet("Mời bạn học vào nhóm: Trưởng nhóm có thể mời các thành viên trong lớp tham gia đồ án thông qua Email hoặc ID tài khoản sinh viên.", "• ");
    add_bullet("4 Vai trò phân định rõ ràng (ProjectRole Enum): OWNER (Trưởng nhóm - toàn quyền chỉnh sửa và xóa đồ án), ADMIN (Quản trị nhóm - thêm bớt thành viên, tạo công việc), MEMBER (Thành viên - cập nhật tiến độ công việc được giao), và VIEWER (Chỉ xem - phù hợp để gửi giảng viên theo dõi tiến độ).", "• ");
    add_bullet("Giao việc cụ thể (Task Assignees): Mỗi công việc trong đồ án có thể được chỉ định cho một hoặc nhiều thành viên cụ thể. Thành viên đăng nhập vào hệ thống sẽ thấy ngay danh sách các phần việc mà mình được giao phụ trách.", "• ");

    # 3.7
    add_h2("3.7. Trợ lý Trí tuệ Nhân tạo Toàn cục (AI Academic Copilot)")
    add_h3("3.7.1. Hộp thoại AI Nổi (Floating Copilot) & Trang AI Chat chuyên sâu")
    add_body(
        "Không để AI tách rời khỏi quy trình học tập, SNOTE tích hợp Trợ lý Trí tuệ Nhân tạo học thuật theo hai phương thức tương tác tiện lợi:"
    )
    add_bullet("Hộp thoại AI Nổi (Floating AI Copilot): Nằm khiêm tốn ở góc dưới cùng bên phải màn hình, không chiếm dụng không gian đọc bài giảng. Sinh viên có thể kích hoạt tức thì từ bất kỳ trang nào bằng phím tắt toàn cục Ctrl + J hoặc nhấp chuột vào biểu tượng AI.", "• ");
    add_bullet("Trang AI Chat Toàn màn hình (/ai-chat): Không gian đối thoại mở rộng phục vụ các phiên thảo luận chuyên sâu, hỏi đáp đề cương môn học dài hạn hoặc phân tích tài liệu phức tạp.", "• ");

    add_h3("3.7.2. 3 Chế độ Prompt học thuật tối ưu sẵn (3 Academic AI Modes)")
    add_body(
        "SNOTE tích hợp sẵn 3 khuôn mẫu câu lệnh (Prompt Templates) được tinh chỉnh riêng cho sinh viên:"
    )
    add_bullet("1. Trích xuất Công việc (Extract Todo): AI tự động phân tích văn bản bài giảng dài hoặc đề cương bài tập, trích xuất ra danh sách các đầu việc cần làm, bài tập về nhà và hạn nộp dự kiến.", "- ");
    add_bullet("2. Dự đoán Đề thi & Câu hỏi Ôn tập (Exam Prep Questions): Phân tích nội dung ghi chú môn học để tạo ra bộ câu hỏi lý thuyết và bài tập trắc nghiệm mô phỏng cấu trúc đề thi học kỳ.", "- ");
    add_bullet("3. Tóm tắt Ý chính Bài giảng (Lecture Summary): Rút gọn các bài giảng dài hàng chục trang thành các gạch đầu dòng cô đọng, nêu bật các định nghĩa và công thức then chốt.", "- ");

    # 3.8
    add_h2("3.8. Tìm kiếm Toàn cục, Chia sẻ An toàn & Sao lưu Dữ liệu Toàn vẹn")
    add_h3("3.8.1. Hộp thoại Tìm kiếm Toàn cục (Global Search với phím tắt Ctrl + K)")
    add_body(
        "Lấy cảm hứng từ thanh lệnh Command Palette của các công cụ lập trình hiện đại, SNOTE tích hợp hộp thoại tìm kiếm toàn cục mở nhanh bằng phím tắt Ctrl + K. "
        "Tính năng cho phép tìm kiếm toàn văn bản (Full-Text Search) xuyên suốt 4 thực thể dữ liệu chính: Ghi chú, Công việc, Đồ án và Lịch học. "
        "Kết quả tìm kiếm được phân loại theo từng nhóm thực thể kèm biểu tượng nhận diện, hiển thị tức thì theo từng ký tự gõ phím."
    )

    add_h3("3.8.2. Chia sẻ Tài nguyên An toàn (Resource Shares) với Public Link")
    add_body(
        "Hỗ trợ sinh viên chia sẻ tài liệu học tập và đồ án cho bạn học một cách an toàn và linh hoạt thông qua bảng resource_shares:"
    )
    add_bullet("Chia sẻ đích danh: Chia sẻ trực tiếp tới tài khoản của bạn học qua địa chỉ Email cá nhân.", "• ");
    add_bullet("Tạo liên kết công khai bí mật (Secret Share Link): Hệ thống sinh ra một đường dẫn ngẫu nhiên chứa chuỗi Token mật mã học (/share/:token). Bất kỳ ai có đường link đều có thể truy cập tài liệu mà không cần phải có tài khoản trên hệ thống.", "• ");
    add_bullet("Kiểm soát quyền hạn (Access Level): Người chia sẻ có thể thiết lập quyền Chỉ xem (VIEW) hoặc Cho phép chỉnh sửa (EDIT), đồng thời thiết lập thời hạn hết hạn (expiresAt) cho liên kết chia sẻ.", "• ");

    add_h3("3.8.3. Sao lưu & Xuất dữ liệu Toàn vẹn với Mã băm SHA-256")
    add_body(
        "Nhằm bảo vệ tuyệt đối dữ liệu học tập tích lũy qua nhiều năm đại học của sinh viên trước mọi sự cố mất mát, SNOTE cung cấp hệ thống sao lưu và xuất bản dữ liệu độc lập:"
    )
    add_bullet("Xuất tài liệu Markdown (.md): Cho phép tải về từng bài ghi chép độc lập dưới định dạng Markdown chuẩn, dễ dàng lưu trữ trên ổ đĩa cá nhân hoặc mở bằng các công cụ khác.", "• ");
    add_bullet("Sao lưu toàn bộ hệ thống ra file JSON: Xuất trọn vẹn cơ sở dữ liệu học tập cá nhân (học kỳ, môn học, ghi chú, công việc, lịch trình) ra tệp tin JSON có cấu trúc chuẩn.", "• ");
    add_bullet("Chữ ký toàn vẹn SHA-256 Checksum: Mỗi tệp tin sao lưu được hệ thống gắn kèm một mã băm mật mã SHA-256 tính toán từ nội dung tệp. Khi phục hồi, hệ thống kiểm tra lại mã băm này để đảm bảo dữ liệu không bị can thiệp, lỗi tệp hay chỉnh sửa giả mạo.", "• ");

    # 3.9
    add_h2("3.9. Ma trận Đánh giá Tiến độ Triển khai các Tính năng Hệ thống")
    
    p_cap = doc.add_paragraph()
    p_cap.paragraph_format.space_before = Pt(4)
    p_cap.paragraph_format.space_after = Pt(2)
    r_cap = p_cap.add_run("Bảng 3.1: Ma trận tổng hợp và đánh giá tiến độ triển khai các phân hệ tính năng hệ thống SNOTE")
    r_cap.font.size = Pt(10.5)

    headers = ["Phân hệ Tính năng", "Chức năng Nghiệp vụ Cốt lõi", "Giao diện UI / Endpoint API", "Mức độ Hoàn thiện"]
    rows_data = [
        ("1. Xác thực & Phân quyền", "Đăng ký, Đăng nhập, Refresh Token, Đổi mật khẩu, Phân quyền RBAC (Student/Admin)", "Trang /login, /register\nPOST /api/auth/*", "Hoàn thành 100%"),
        ("2. Quản lý Học kỳ", "Tạo học kỳ, kích hoạt học kỳ hiện tại (isCurrent), lưu trữ học kỳ cũ", "Modal SemesterModal\nGET, POST /api/semesters", "Hoàn thành 100%"),
        ("3. Quản lý Môn học", "Mã môn, số tín chỉ, giảng viên, gán bảng màu nhận diện trực quan", "Modal SubjectModal\nGET, POST /api/subjects", "Hoàn thành 100%"),
        ("4. Workspace Hợp nhất", "Điều phối 3 tab Notes/Tasks/Schedule, thanh lọc môn học đa chiều", "Trang /workspace\nReact Context đồng bộ", "Hoàn thành 100%"),
        ("5. Ghi chú Markdown", "Soạn thảo GFM, highlight code, 6 NoteType, 5 chế độ xem, Convert to Task", "NoteEditor, NoteCard\nGET, POST, PUT /api/notes", "Hoàn thành 100%"),
        ("6. Quản lý Công việc", "Bảng Kanban kéo thả, Todo List, 4 mức ưu tiên, đếm ngược hạn nộp, Confetti", "TasksKanban, TasksList\nGET, POST, PATCH /api/tasks", "Hoàn thành 100%"),
        ("7. Sơ đồ Gantt & Lịch", "Lịch tuần 7 ngày, Sơ đồ Gantt Timeline thời gian thực, sự kiện Class/Exam", "ScheduleWeekly, GanttTimeline\nGET /api/schedule/unified", "Hoàn thành 100%"),
        ("8. Không gian Đồ án", "Quản lý bài tập lớn, tính % tiến độ, phân quyền 4 vai trò, phân công việc", "ProjectsPage, ProjectDetail\nGET, POST /api/projects", "Hoàn thành 100%"),
        ("9. Trợ lý AI Copilot", "Hộp thoại nổi Ctrl+J, AI Chat toàn màn hình, trích xuất Todo, tóm tắt bài giảng", "FloatingAiCopilot, /ai-chat\nPOST /api/ai/chat", "Hoàn thành 100%"),
        ("10. Tìm kiếm Toàn cục", "Hộp thoại Ctrl+K, tìm kiếm toàn văn bản đa thực thể Notes, Tasks, Projects", "GlobalSearchDialog\nGET /api/search/global", "Hoàn thành 100%"),
        ("11. Chia sẻ & Sao lưu", "Share link bí mật /share/:token (View/Edit), xuất Markdown, sao lưu JSON + SHA-256", "ShareModal, BackupSettings\nPOST /api/shares, /api/backup", "Hoàn thành 100%"),
        ("12. Giám sát Hệ thống", "Theo dõi độ trễ CSDL PostgreSQL, dung lượng RAM, uptime máy chủ cho Admin", "Trang /status (Admin Guard)\nGET /api/health/status", "Hoàn thành 100%")
    ]

    add_styled_table(headers, rows_data, [1.3, 2.5, 1.5, 1.0])

    # 3.10
    add_h2("3.10. Tổng kết Chương 3")
    add_body(
        "Tổng kết lại, Chương 3 đã trình bày chi tiết và toàn diện 12 phân hệ tính năng nghiệp vụ đã được hiện thực hóa trọn vẹn trong hệ thống SNOTE. "
        "Các tính năng không hoạt động đơn lẻ mà liên kết chặt chẽ thành một hệ sinh thái học tập khép kín: từ cấu trúc học kỳ - môn học có kỷ luật "
        "giúp triệt tiêu hoàn toàn 'ghi chú rác', không gian làm việc học thuật hợp nhất (/workspace) tối ưu hóa năng suất, các công cụ trực quan "
        "như Sơ đồ Gantt Timeline và bảng Kanban kiểm soát deadline chuẩn xác, đến sự đồng hành thông minh của Trợ lý AI Copilot. "
        "Tất cả các tính năng đều đã trải qua quá trình kiểm thử nghiêm ngặt, đảm bảo độ ổn định và sẵn sàng phục vụ thực tế cho sinh viên đại học."
    )

    # Save to SNOTE.docx
    doc.save(doc_path)
    print(f"Successfully built and updated Chapter 3 in {doc_path}!")

if __name__ == "__main__":
    build_chapter_3()
