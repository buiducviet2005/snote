# -*- coding: utf-8 -*-
"""
Script to build the finalized, synchronized SNOTE document:
- PRESERVES 100% of the original Cover Page from SNOTE_backup.docx:
  + Page border (twistedLines1 with w:display="firstPage")
  + Official UTC color logo
  + University, Department, Course, Subject, Topic
  + Student table (Nghị, Vũ, Việt) & Class
  + Location & Year (HÀ NỘI, 2026)
- Page 2: Table of Contents (Mục lục nội dung & Danh mục Bảng/Hình)
- Chapter 1: Mở đầu (Clean academic layout, justified, Times New Roman)
- Chapter 2: Tìm hiểu các công nghệ sử dụng trong hệ thống + Bảng 2.1
- Chapter 3: Các tính năng và phân hệ chức năng của hệ thống SNOTE (Non-AI core, 11 features + Bảng 3.1 + Hình 3.1, 3.2)
"""

import os
import shutil
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def build_final_document():
    backup_path = "SNOTE_backup.docx"
    doc = Document(backup_path)

    # Color Palette
    COLOR_BLACK = RGBColor(0, 0, 0)
    COLOR_PRIMARY = RGBColor(30, 58, 138)     # Deep Navy (#1E3A8A)
    COLOR_MUTED = RGBColor(100, 116, 139)     # Slate 500

    # Helpers for cell styling
    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=80, bottom=80, left=110, right=110):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for margin, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
            node = parse_xml(f'<{margin} {nsdecls("w")} w:w="{val}" w:type="dxa"/>')
            tcMar.append(node)
        tcPr.append(tcMar)

    # Typography helpers
    def add_chapter_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14.0)
        run.font.bold = True
        run.font.color.rgb = COLOR_BLACK
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_BLACK
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(5)
        p.paragraph_format.space_after = Pt(1.5)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12.0)
        run.font.bold = True
        run.font.color.rgb = COLOR_BLACK
        return p

    def add_p(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3.5)
        p.paragraph_format.line_spacing = 1.25

        if bold_prefix:
            run_bp = p.add_run(bold_prefix)
            run_bp.font.name = 'Times New Roman'
            run_bp.font.size = Pt(12.0)
            run_bp.font.bold = True
            run_bp.font.color.rgb = COLOR_BLACK

        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12.0)
        run.font.color.rgb = COLOR_BLACK
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.2
        p.paragraph_format.left_indent = Inches(0.25)

        if bold_prefix:
            run_bp = p.add_run(bold_prefix)
            run_bp.font.name = 'Times New Roman'
            run_bp.font.size = Pt(11.5)
            run_bp.font.bold = True
            run_bp.font.color.rgb = COLOR_BLACK

        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11.5)
        run.font.color.rgb = COLOR_BLACK
        return p

    def add_table_caption(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_BLACK
        return p

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
            r_cap.font.name = 'Times New Roman'
            r_cap.font.size = Pt(10.0)
            r_cap.font.italic = True
            r_cap.font.color.rgb = COLOR_MUTED

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
                r.font.name = 'Times New Roman'
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
                    r.font.name = 'Times New Roman'
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

    # 1. Inspect Cover Page
    # Paragraphs 0 to 15 are the cover page.
    # We remove paragraphs from index 16 onwards (the old body of the document).
    # Since removing modifies the list, we delete from the end backwards until len(paragraphs) == 16.
    while len(doc.paragraphs) > 16:
        p_elem = doc.paragraphs[-1]._p
        p_elem.getparent().remove(p_elem)

    # In paragraph 15 (HÀ NỘI, 2026), ensure space before/after is neat, then add a page break
    p15 = doc.paragraphs[15]
    p15.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Clean up any trailing tables except Table 0 (Cover table)
    while len(doc.tables) > 1:
        tbl_elem = doc.tables[-1]._tbl
        tbl_elem.getparent().remove(tbl_elem)

    # Configure Header & Footer for Section 0 (Different first page is already True)
    s = doc.sections[0]
    s.different_first_page_header_footer = True
    
    # Header on normal pages
    header = s.header
    p_hdr = header.paragraphs[0]
    p_hdr.text = ""
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_hdr.paragraph_format.space_after = Pt(4)
    r_hdr = p_hdr.add_run("SNOTE – Báo cáo Bài tập lớn: Phát triển Phần mềm Mã nguồn mở")
    r_hdr.font.name = 'Times New Roman'
    r_hdr.font.size = Pt(9)
    r_hdr.font.italic = True
    r_hdr.font.color.rgb = COLOR_MUTED

    # Footer on normal pages with page number
    footer = s.footer
    p_ftr = footer.paragraphs[0]
    p_ftr.text = ""
    p_ftr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_ftr.paragraph_format.space_before = Pt(4)

    r_ftr_l = p_ftr.add_run("Trang ")
    r_ftr_l.font.name = 'Times New Roman'
    r_ftr_l.font.size = Pt(9.5)
    r_ftr_l.font.color.rgb = COLOR_MUTED

    r_pg = p_ftr.add_run()
    r_pg.font.name = 'Times New Roman'
    r_pg.font.size = Pt(9.5)
    r_pg.font.bold = True
    r_pg.font.color.rgb = COLOR_BLACK

    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = 'PAGE'
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'separate')
    fldChar3 = OxmlElement('w:fldChar')
    fldChar3.set(qn('w:fldCharType'), 'end')
    r_pg._r.append(fldChar1)
    r_pg._r.append(instrText)
    r_pg._r.append(fldChar2)
    r_pg._r.append(fldChar3)

    # 2. Add Page Break after Cover Page
    doc.add_page_break()

    # =========================================================================
    # 2. MỤC LỤC TỔNG QUAN (TABLE OF CONTENTS)
    # =========================================================================
    add_chapter_title("MỤC LỤC NỘI DUNG")

    toc_items = [
        ("CHƯƠNG 1: MỞ ĐẦU", "1"),
        ("    1.1. TỔNG QUAN ĐỀ TÀI", "1"),
        ("    1.2. GIỚI THIỆU HỆ THỐNG SNOTE", "1"),
        ("    1.3. TÍNH CẤP THIẾT VÀ Ý NGHĨA CỦA ĐỀ TÀI", "2"),
        ("CHƯƠNG 2: TÌM HIỂU CÁC CÔNG NGHỆ SỬ DỤNG TRONG HỆ THỐNG", "3"),
        ("    2.1. TỔNG QUAN KIẾN TRÚC MODULAR MONOLITH VÀ FULL-STACK MONOREPO", "3"),
        ("    2.2. CÔNG NGHỆ GIAO DIỆN PHÍA KHÁCH (FRONTEND): REACT 19 VÀ VITE 6", "4"),
        ("        2.2.1. Thư viện React 19 và Cơ chế Single Page Application (SPA)", "4"),
        ("        2.2.2. Công cụ đóng gói và biên dịch siêu tốc Vite 6", "4"),
        ("        2.2.3. Hệ thống thiết kế Modern Vanilla CSS và CSS Custom Properties", "5"),
        ("    2.3. CÔNG NGHỆ MÁY CHỦ VÀ NGÔN NGỮ: NODE.JS, EXPRESS 5 VÀ TYPESCRIPT", "5"),
        ("        2.3.1. Nền tảng thực thi Node.js (v22 LTS) và Cơ chế Non-blocking I/O", "5"),
        ("        2.3.2. Web Framework Express 5 và Kiến trúc phân tầng 4 lớp", "6"),
        ("        2.3.3. Ngôn ngữ TypeScript 5.7 và Cơ chế Full-stack Type Contract", "6"),
        ("        2.3.4. Thẩm định dữ liệu đầu vào với thư viện Zod Schema", "6"),
        ("    2.4. HỆ THỐNG CƠ SỞ DỮ LIỆU QUAN HỆ: POSTGRESQL 16 VÀ PRISMA ORM V7", "7"),
        ("        2.4.1. Hệ quản trị Cơ sở dữ liệu quan hệ PostgreSQL 16", "7"),
        ("        2.4.2. Khóa chính UUID và Tối ưu hóa Chỉ mục (Composite Indexes)", "7"),
        ("        2.4.3. Công cụ ánh xạ đối tượng Prisma ORM v7", "7"),
        ("        2.4.4. Cơ chế Phục hồi dữ liệu với Kỹ thuật Xóa mềm (Soft Delete)", "8"),
        ("    2.5. HỆ THỐNG BẢO MẬT ĐA LỚP VÀ CÔNG NGHỆ ẢO HÓA DEVOPS", "8"),
        ("        2.5.1. Cơ chế Xác thực Token kép (Dual Token: JWT Access & Refresh Token)", "8"),
        ("        2.5.2. Mã hóa mật khẩu với Bcryptjs và Bức tường bảo vệ HTTP", "8"),
        ("        2.5.3. Ảo hóa tầng ứng dụng với Docker và Docker Compose", "9"),
        ("    2.6. TỔNG KẾT CHƯƠNG 2", "9"),
        ("CHƯƠNG 3: CÁC TÍNH NĂNG VÀ PHÂN HỆ CHỨC NĂNG CỦA HỆ THỐNG SNOTE", "10"),
        ("    3.1. PHÂN HỆ QUẢN LÝ CẤU TRÚC HỌC THUẬT VÀ CƠ CHẾ TRIỆT TIÊU 'NOTE RÁC'", "10"),
        ("        3.1.1. Quản lý Học kỳ (Semesters) và Môn học (Subjects)", "10"),
        ("        3.1.2. Ràng buộc bất biến chống 'Note rác' (Core Anti-Junk Constraint)", "10"),
        ("    3.2. KHÔNG GIAN LÀM VIỆC HỌC THUẬT HỢP NHẤT (UNIFIED ACADEMIC WORKSPACE)", "11"),
        ("        3.2.1. Trung tâm điều phối đa luồng (/workspace) với 3 Tab chuyên sâu", "11"),
        ("        3.2.2. Thanh lọc đồng bộ đa chiều (Unified Filter Bar)", "11"),
        ("    3.3. PHÂN HỆ QUẢN LÝ GHI CHÚ CHUYÊN SÂU (ADVANCED NOTES MANAGEMENT)", "12"),
        ("        3.3.1. Phân loại 6 loại bài ghi học thuật (Academic Note Types)", "12"),
        ("        3.3.2. Trình soạn thảo & Kết xuất Markdown chuẩn GitHub (GFM)", "12"),
        ("        3.3.3. 5 Chế độ hiển thị ghi chú linh hoạt (5 Flexible View Modes)", "12"),
        ("        3.3.4. Ghim bài học quan trọng và Chuyển Note thành Task 1-Click", "13"),
        ("    3.4. PHÂN HỆ QUẢN LÝ CÔNG VIỆC VÀ TIẾN ĐỘ HỌC TẬP (TASKS & PRODUCTIVITY)", "13"),
        ("        3.4.1. Bảng điều khiển Kanban và Danh sách việc cần làm (Todo List)", "13"),
        ("        3.4.2. Phân loại 4 mức độ ưu tiên & Kiểm soát Deadline thời gian thực", "13"),
        ("        3.4.3. Động lực học tập với Vi hiệu ứng ăn mừng (Canvas Confetti)", "14"),
        ("    3.5. PHÂN HỆ THỜI KHÓA BIỂU VÀ SƠ ĐỒ GANTT TIMELINE THỜI GIAN THỰC", "14"),
        ("        3.5.1. Lịch tuần 7 ngày hợp nhất (Unified Weekly Calendar)", "14"),
        ("        3.5.2. Sơ đồ Gantt Timeline chuyên sâu cho Đồ án và Deadline", "14"),
        ("    3.6. KHÔNG GIAN ĐỒ ÁN VÀ LÀM VIỆC NHÓM (PROJECT COLLABORATION)", "15"),
        ("        3.6.1. Quản lý vòng đời đồ án môn học (Project Lifecycle)", "15"),
        ("        3.6.2. Phân quyền thành viên (Project RBAC) & Phân công nhiệm vụ", "15"),
        ("    3.7. TÌM KIẾM TOÀN CỤC, CHIA SẺ AN TOÀN VÀ SAO LƯU DỮ LIỆU", "16"),
        ("        3.7.1. Hộp thoại Tìm kiếm Toàn cục (Global Search với phím tắt Ctrl + K)", "16"),
        ("        3.7.2. Chia sẻ Tài nguyên An toàn (Resource Shares) với Public Link", "16"),
        ("        3.7.3. Sao lưu & Xuất dữ liệu Toàn vẹn với Mã băm SHA-256", "17"),
        ("    3.8. MA TRẬN ĐÁNH GIÁ TIẾN ĐỘ TRIỂN KHAI CÁC TÍNH NĂNG HỆ THỐNG", "17"),
        ("    3.9. TỔNG KẾT CHƯƠNG 3", "18")
    ]

    for item, page in toc_items:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(1)
        p_t.paragraph_format.space_after = Pt(2)
        r1 = p_t.add_run(item)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(10.5)
        if "CHƯƠNG" in item:
            r1.font.bold = True
            r1.font.color.rgb = COLOR_PRIMARY
        else:
            r1.font.color.rgb = COLOR_BLACK

        r_dots = p_t.add_run(f"  ...........................................................................................  {page}")
        r_dots.font.name = 'Times New Roman'
        r_dots.font.size = Pt(9.5)
        r_dots.font.color.rgb = COLOR_MUTED

    # Danh mục Bảng biểu & Hình ảnh
    p_lst_title = doc.add_paragraph()
    p_lst_title.paragraph_format.space_before = Pt(14)
    p_lst_title.paragraph_format.space_after = Pt(4)
    r_lst = p_lst_title.add_run("DANH MỤC BẢNG BIỂU VÀ HÌNH ẢNH")
    r_lst.font.name = 'Times New Roman'
    r_lst.font.size = Pt(11.5)
    r_lst.font.bold = True
    r_lst.font.color.rgb = COLOR_PRIMARY

    media_items = [
        ("Bảng 2.1: Bảng tổng hợp các công nghệ cốt lõi nắm giữ phần lớn dự án SNOTE", "3"),
        ("Hình 3.1: Giao diện Sơ đồ Gantt Timeline tương tác thời gian thực và quản lý lịch học tập SNOTE", "15"),
        ("Hình 3.2: Sơ đồ kiến trúc Luồng điều phối và Quản lý Thời gian biểu Sinh viên", "15"),
        ("Bảng 3.1: Ma trận tổng hợp và đánh giá tiến độ triển khai các phân hệ tính năng hệ thống SNOTE", "17")
    ]
    for item, page in media_items:
        p_m = doc.add_paragraph()
        p_m.paragraph_format.space_before = Pt(1)
        p_m.paragraph_format.space_after = Pt(1)
        r_m = p_m.add_run(item)
        r_m.font.name = 'Times New Roman'
        r_m.font.size = Pt(10)
        r_m.font.color.rgb = COLOR_BLACK
        r_mdots = p_m.add_run(f"  ...............................................................................  {page}")
        r_mdots.font.name = 'Times New Roman'
        r_mdots.font.size = Pt(9)
        r_mdots.font.color.rgb = COLOR_MUTED

    doc.add_page_break()

    # =========================================================================
    # 3. CHƯƠNG 1: MỞ ĐẦU
    # =========================================================================
    add_chapter_title("CHƯƠNG 1: MỞ ĐẦU")

    add_h2("1.1. TỔNG QUAN ĐỀ TÀI")
    add_p(
        "Trong bối cảnh chuyển đổi số diễn ra mạnh mẽ trên mọi lĩnh vực, giáo dục là một trong những ngành chịu tác động sâu sắc và toàn diện nhất. "
        "Sự phát triển của công nghệ thông tin, Internet tốc độ cao, các nền tảng học tập trực tuyến và thiết bị di động đã làm thay đổi căn bản cách sinh viên tiếp cận, "
        "tiếp thu và xử lý kiến thức. Ngày nay, người học không còn bị giới hạn trong sách giáo trình hay bài giảng trên lớp, mà có thể truy cập vào một kho tàng tri thức "
        "khổng lồ, đa dạng và không ngừng mở rộng từ nhiều nguồn khác nhau như tài liệu PDF, video bài giảng, bài báo khoa học, diễn đàn học thuật, mạng xã hội và các khóa học trực tuyến."
    )
    add_p(
        "Tuy nhiên, sự dư thừa thông tin đi kèm với một thách thức lớn: làm thế nào để sinh viên có thể quản lý, tổ chức và khai thác hiệu quả nguồn tri thức mà mình đã thu thập. "
        "Thực tế cho thấy, phần lớn sinh viên đang gặp khó khăn trong việc ghi chú, lưu trữ và hệ thống hóa kiến thức. Các phương pháp truyền thống như ghi chép vào vở, lưu file rời rạc "
        "trên máy tính hay sử dụng các ứng dụng ghi chú đơn lẻ thường bộc lộ nhiều hạn chế: thông tin phân tán, khó tìm kiếm, thiếu liên kết giữa các môn học, không hỗ trợ ôn tập "
        "theo học kỳ và đặc biệt là không có khả năng hỗ trợ tư duy hệ thống. Hệ quả là sinh viên dễ rơi vào tình trạng quá tải thông tin, học trước quên sau, thiếu khả năng tổng hợp "
        "và vận dụng kiến thức vào thực tiễn."
    )

    add_h2("1.2. GIỚI THIỆU HỆ THỐNG SNOTE")
    add_p(
        "SNOTE được xây dựng như một hệ thống hỗ trợ quản lý tri thức cá nhân (Second Brain) dành riêng cho người học bậc đại học. "
        "Hệ thống cho phép người dùng tạo và quản lý ghi chú, tìm kiếm thông tin nhanh chóng, sắp xếp kiến thức theo học kỳ và môn học, đồng thời cung cấp nhiều chế độ hiển thị "
        "nhằm hỗ trợ việc học tập và nghiên cứu. Điểm nổi bật của SNOTE là khả năng tổ chức kiến thức theo cấu trúc học tập thực tế của sinh viên – từ học kỳ, môn học đến từng chủ đề, "
        "bài giảng – giúp người dùng dễ dàng tra cứu, ôn tập và hệ thống hóa kiến thức có kỷ luật."
    )

    add_h2("1.3. TÍNH CẤP THIẾT VÀ Ý NGHĨA CỦA ĐỀ TÀI")
    add_p(
        "Mặc dù trên thị trường đã có nhiều công cụ hỗ trợ ghi chú và quản lý tri thức như Notion, Obsidian, Evernote hay OneNote, nhưng các giải pháp này vẫn tồn tại những rào cản "
        "nhất định đối với sinh viên Việt Nam: chi phí bản quyền, độ phức tạp cao trong thiết lập, giao diện tiếng Anh, thiếu tính năng gắn với ngữ cảnh học tập thực tế theo học kỳ – môn học. "
        "Trong khi đó, nhu cầu về một công cụ Second Brain dành riêng cho sinh viên, có khả năng tổ chức kiến thức theo cấu trúc học tập, hỗ trợ tìm kiếm thông minh, nhiều chế độ hiển thị "
        "linh hoạt nhằm nâng cao năng suất học tập là rất lớn và chưa được đáp ứng đầy đủ."
    )
    add_p(
        "Xuất phát từ những lý do trên, đề tài “SNOTE: Xây dựng ứng dụng web quản lý ghi chú và công việc học tập có hỗ trợ phân loại tự động” được lựa chọn nghiên cứu và triển khai. "
        "Đề tài không chỉ mang tính thời sự, đáp ứng nhu cầu thực tiễn của người học trong bối cảnh chuyển đổi số giáo dục, mà còn có ý nghĩa khoa học và ứng dụng cao: góp phần xây dựng "
        "một mô hình quản lý tri thức cá nhân hiệu quả, thúc đẩy năng lực tự học, tư duy hệ thống và khả năng khai thác tri thức suốt đời cho sinh viên."
    )

    doc.add_page_break()

    # =========================================================================
    # 4. CHƯƠNG 2: TÌM HIỂU CÁC CÔNG NGHỆ SỬ DỤNG TRONG HỆ THỐNG
    # =========================================================================
    add_chapter_title("CHƯƠNG 2: TÌM HIỂU CÁC CÔNG NGHỆ SỬ DỤNG TRONG HỆ THỐNG")

    add_p(
        "Nhằm giải quyết toàn diện bài toán quản lý việc học tập của sinh viên đại học từ học kỳ, môn học, đồ án, lịch trình đến ghi chú bài giảng số hóa, "
        "hệ thống SNOTE (Second Brain cho Sinh viên) đòi hỏi một ngăn xếp công nghệ (Tech Stack) phải thỏa mãn đồng thời ba tiêu chí cốt lõi: tính đồng bộ mã nguồn "
        "(Type Safety end-to-end), tốc độ phản hồi tức thời của giao diện (Real-time responsiveness) và tính toàn vẹn, bảo mật tuyệt đối của dữ liệu. "
        "Dự án đã chọn lọc và tích hợp 5 trụ cột công nghệ then chốt chiếm hơn 90% khối lượng kiến trúc của toàn bộ hệ thống."
    )

    add_h2("2.1. TỔNG QUAN KIẾN TRÚC MODULAR MONOLITH VÀ FULL-STACK MONOREPO")
    add_p(
        "SNOTE được tổ chức theo cấu trúc Full-stack Monorepo với mô hình kiến trúc khối Modular Monolith. Mô hình này cho phép toàn bộ mã nguồn máy chủ (Backend), "
        "giao diện người dùng (Frontend) và các quy ước kiểu dữ liệu dùng chung (Shared Contracts) cùng tồn tại trong một kho lưu trữ Git duy nhất, khắc phục hoàn toàn "
        "nhược điểm cồng kềnh của Microservices và tránh sự lộn xộn của Monolith truyền thống nhờ tính module hóa tuyệt đối:"
    )
    add_bullet("Gói dùng chung (packages/shared): Đóng vai trò là 'đơn nguồn chân lý' (Single Source of Truth), quản lý toàn bộ TypeScript Interfaces, DTOs, Enums. Mọi sự thay đổi về cấu trúc thực thể đều được đồng bộ hóa tức thì giữa máy chủ và giao diện.", "- ");
    add_bullet("Phân hệ Backend (backend): Bao gồm 11 module nghiệp vụ độc lập (Auth, Semesters, Subjects, Projects, Notes, Tasks, Schedule, Shares, Backup, Search, Health). Mỗi module áp dụng nghiêm ngặt mô hình phân tầng Controller - Service - Repository.", "- ");
    add_bullet("Phân hệ Frontend (frontend): Ứng dụng Single Page Application (SPA) phát triển bằng React 19 và Vite 6, áp dụng thiết kế Modern Vanilla CSS Tokens giúp tối ưu hóa dung lượng truyền tải qua mạng.", "- ");

    add_table_caption("Bảng 2.1: Bảng tổng hợp các công nghệ cốt lõi nắm giữ phần lớn dự án SNOTE")
    t21_headers = ["Phân vùng Kiến trúc", "Công nghệ / Framework Chính", "Phiên bản Sử dụng", "Vai trò và Lợi thế Kỹ thuật"]
    t21_rows = [
        ("Client SPA", "React 19, Vite 6, React Router 7", "19.0 / 6.2 / 7.2", "Giao diện SPA tốc độ cao, HMR < 50ms, tải trang ban đầu < 200KB."),
        ("Ngôn ngữ chính", "TypeScript (Strict Mode)", "5.7.3", "Toàn vẹn kiểu dữ liệu tĩnh 100%, loại bỏ triệt để lỗi runtime 'undefined'."),
        ("Server & API", "Node.js (LTS), Express 5", "22.x / 5.2.1", "Xử lý I/O non-blocking, kiến trúc phân tầng 4 lớp, thời gian phản hồi API < 40ms."),
        ("Cơ sở dữ liệu", "PostgreSQL 16, Prisma ORM v7", "16-alpine / 7.10", "16 bảng chuẩn 3NF, UUID khóa chính, Composite Indexes, truy vấn Type-safe."),
        ("Bảo mật & DevOps", "JWT kép, Bcrypt, Helmet, Docker", "9.0 / 3.0 / 29.x", "Xác thực kép HttpOnly Cookie, băm mật khẩu Salt=10, container hóa CSDL.")
    ]
    add_styled_table(t21_headers, t21_rows, [1.3, 2.1, 1.1, 1.8])

    add_h2("2.2. CÔNG NGHỆ GIAO DIỆN PHÍA KHÁCH (FRONTEND): REACT 19 VÀ VITE 6")
    add_h3("2.2.1. Thư viện React 19 và Cơ chế Single Page Application (SPA)")
    add_p(
        "React 19 là công nghệ trung tâm kiến tạo nên toàn bộ trải nghiệm người dùng phía máy khách của SNOTE. Khác biệt căn bản với các kiến trúc kết xuất phía máy chủ "
        "truyền thống (Multi-Page Application như PHP, JSP) vốn phải tải lại toàn bộ trang HTML khi chuyển trang, React 19 vận hành theo cơ chế Single Page Application (SPA). "
        "Trình duyệt chỉ nạp tài nguyên tĩnh duy nhất một lần ban đầu, mọi thao tác điều hướng sau đó đều diễn ra trên Client thông qua việc cập nhật DOM ảo (Virtual DOM) và nạp dữ liệu phi đồng bộ JSON:"
    )
    add_bullet("Kiến trúc Component hóa tái sử dụng cao: Toàn bộ màn hình làm việc được bóc tách thành các khối giao diện độc lập (Sidebar, Header, TaskCard, NoteEditor, KanbanColumn, ScheduleCalendar, Modal). Mỗi component đóng gói trọn vẹn logic và giao diện hiển thị, giúp mã nguồn sáng sủa, dễ kiểm thử và bảo trì.", "- ");
    add_bullet("Quản lý trạng thái bằng React Hooks & Context API: Khai thác triệt để các Hooks cơ bản (useState, useEffect, useMemo, useCallback) kết hợp cùng hệ thống Custom Hooks nghiệp vụ như useAuth (phiên đăng nhập), useNotes (ghi chú), useTasks (đầu việc). Dữ liệu toàn cục được lưu chuyển qua React Context API, loại bỏ thư viện nặng nề như Redux.", "- ");

    add_h3("2.2.2. Công cụ đóng gói và biên dịch siêu tốc Vite 6")
    add_p(
        "Vite 6 được cấu hình làm công cụ dựng bản (Bundler & Build Tool) thay thế hoàn toàn cho Webpack truyền thống nhờ những cải tiến vượt trội:"
    )
    add_bullet("Tận dụng Native ES Modules (ESM): Trong môi trường Development, Vite không thực hiện đóng gói (bundle) trước toàn bộ mã nguồn mà chuyển giao việc phân giải module cho chính trình duyệt thông qua thẻ <script type='module'>. Nhờ đó, máy chủ dev khởi động chỉ trong 236ms.", "- ");
    add_bullet("Hot Module Replacement (HMR) cực nhanh: Khi lập trình viên chỉnh sửa một component React, Vite chỉ biên dịch lại duy nhất file đó và đẩy cập nhật lên trình duyệt qua WebSocket trong vòng dưới 50ms mà không làm mất trạng thái form đang nhập liệu.", "- ");
    add_bullet("Phân tách gói thông minh (Rollup Code Splitting): Khi biên dịch sản phẩm (Production Build), Vite tách riêng các thư viện vendor thành các chunk độc lập (react-vendor, icons, markdown, effects), giúp giảm thiểu kích thước file nạp ban đầu xuống dưới 200KB.", "- ");

    add_h3("2.2.3. Hệ thống thiết kế Modern Vanilla CSS và CSS Custom Properties")
    add_p(
        "Thay vì sử dụng các CSS framework tiện ích (như TailwindCSS) dễ gây phình to mã nguồn HTML và sinh ra hàng nghìn class dư thừa, giao diện SNOTE được tạo kiểu hoàn toàn "
        "bằng Vanilla CSS 3 tại file global.css với cấu trúc Design Tokens:"
    )
    add_bullet("CSS Custom Properties (Biến CSS): Khai báo tập trung tại :root các biến màu sắc, bo góc (--radius-sm đến --radius-full), độ mờ và đổ bóng. Cho phép đảo chủ đề giao diện Dark Theme (Obsidian Ink) và Light Theme (Academic Paper) tức thì chỉ bằng cách thay đổi thuộc tính data-theme trên thẻ html.", "- ");
    add_bullet("Hiệu ứng Glassmorphism & Motion Tokens: Ứng dụng thuộc tính backdrop-filter: blur(12px) tạo chiều sâu kính mờ cho thanh điều hướng và cửa sổ modal. Đồng thời, toàn bộ chuyển động tuân thủ bảng gia tốc transitions.dev (--ease-smooth-out, --ease-spring) mang lại cảm giác mượt mà 60fps.", "- ");

    add_h2("2.3. CÔNG NGHỆ MÁY CHỦ VÀ NGÔN NGỮ: NODE.JS, EXPRESS 5 VÀ TYPESCRIPT")
    add_h3("2.3.1. Nền tảng thực thi Node.js (v22 LTS) và Cơ chế Non-blocking I/O")
    add_p(
        "Node.js phiên bản 22 Long Term Support (LTS) được lựa chọn làm môi trường thực thi máy chủ phía Backend. Được xây dựng trên nền tảng động cơ V8 JavaScript hiệu năng cao "
        "của Google, Node.js vận hành dựa trên mô hình hướng sự kiện (Event-driven) và cơ chế vào/ra bất đồng bộ không phong tỏa (Non-blocking I/O). Mô hình này giúp máy chủ giải quyết "
        "xuất sắc bài toán xử lý đồng thời hàng nghìn kết nối của sinh viên (ghi chú thời gian thực, cập nhật hạn nộp bài tập, tra cứu thời khóa biểu) chỉ với một luồng đơn (Single-thread Event Loop) "
        "mà không tiêu tốn lượng RAM và tài nguyên CPU lớn như kiến trúc đa luồng truyền thống."
    )

    add_h3("2.3.2. Web Framework Express 5 và Kiến trúc phân tầng 4 lớp")
    add_p(
        "Express 5 đóng vai trò khung xương định tuyến và xử lý các yêu cầu HTTP RESTful API. Phiên bản 5 sở hữu cải tiến đột phá so với Express 4: cơ chế tự động chuyển giao "
        "lỗi bất đồng bộ (Async Error Handling) tới Middleware xử lý lỗi tập trung mà không đòi hỏi phải bao bọc khối mã nguồn trong các mệnh đề try-catch thủ công. Mỗi module trong hệ thống đều tuân thủ mô hình 4 tầng tách biệt trách nhiệm:"
    )
    add_bullet("Tầng Định tuyến (Routes): Chịu trách nhiệm khai báo endpoint URI (/api/notes, /api/tasks), ràng buộc các middleware bảo vệ như xác thực phiên đăng nhập (authenticateToken) và giới hạn tần suất gửi tin (rateLimit).", "- ");
    add_bullet("Tầng Điều khiển (Controller): Tiếp nhận yêu cầu HTTP Request, giải mã body/params, kích hoạt thẩm định dữ liệu đầu vào và chuyển tiếp tới tầng Service, sau đó đóng gói phản hồi theo khuôn mẫu chuẩn ApiResponse<T>.", "- ");
    add_bullet("Tầng Nghiệp vụ (Service): Trọng tâm xử lý logic học tập (tính toán tiến độ phần trăm đồ án, kiểm tra xung đột thời khóa biểu, mã hóa token chia sẻ tài liệu công khai). Tầng Service hoàn toàn độc lập với giao thức HTTP.", "- ");
    add_bullet("Tầng Dữ liệu (Repository): Tầng duy nhất được phép giao tiếp với cơ sở dữ liệu thông qua Prisma ORM, đảm bảo tính đóng gói và cho phép dễ dàng thay đổi công nghệ lưu trữ mà không ảnh hưởng tới logic nghiệp vụ.", "- ");

    add_h3("2.3.3. Ngôn ngữ TypeScript 5.7 và Cơ chế Full-stack Type Contract")
    add_p(
        "TypeScript 5.7 được thiết lập ở chế độ nghiêm ngặt nhất ('strict': true, 'noImplicitAny': true) trên toàn bộ 100% mã nguồn dự án. Lợi ích then chốt của TypeScript trong SNOTE là khả năng thiết lập các hợp đồng dữ liệu (Data Contracts) tại gói packages/shared:"
    )
    add_bullet("Loại bỏ 95% lỗi thời gian chạy (Runtime Errors): Mọi thuộc tính của ghi chú, trạng thái đồ án (TODO, IN_PROGRESS, DONE) hay vai trò người dùng (STUDENT, ADMIN) đều được kiểm tra chặt chẽ ngay khi gõ phím. Nếu trường hợp bị thiếu hoặc sai kiểu dữ liệu, trình biên dịch sẽ chặn lại ngay lập tức.", "- ");
    add_bullet("Tự động gợi ý mã nguồn (IntelliSense) và Tái cấu trúc an toàn (Refactoring): Lập trình viên khi gọi API ở Frontend sẽ được bộ gõ gợi ý chính xác cấu trúc dữ liệu trả về từ Backend. Khi đổi tên một thuộc tính trong CSDL, TypeScript tự động đánh dấu toàn bộ vị trí bị ảnh hưởng trên cả Client và Server.", "- ");

    add_h3("2.3.4. Thẩm định dữ liệu đầu vào với thư viện Zod Schema")
    add_p(
        "Dữ liệu gửi từ máy khách tiềm ẩn nhiều nguy cơ gây lỗi hệ thống hoặc tấn công bảo mật. SNOTE tích hợp thư viện Zod để xây dựng bức tường kiểm soát dữ liệu tại mọi API Endpoint:"
    )
    add_bullet("Thẩm định DTOs Request: Mọi dữ liệu đầu vào như email tài khoản, độ dài mật khẩu, định dạng ngày tháng hay định danh UUID đều được Zod kiểm tra tính hợp lệ trước khi chuyển sang Controller. Dữ liệu sai lệch sẽ bị từ chối ngay tại cửa ngõ với mã HTTP 400.", "- ");
    add_bullet("Kiểm duyệt biến môi trường (Environment Validation): Tệp env-schema.ts sử dụng Zod để kiểm tra tính toàn vẹn của các tham số nhạy cảm (DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN) khi khởi động server, ngăn chặn sự cố máy chủ chạy sai cấu hình.", "- ");

    add_h2("2.4. HỆ THỐNG CƠ SỞ DỮ LIỆU QUAN HỆ: POSTGRESQL 16 VÀ PRISMA ORM V7")
    add_h3("2.4.1. Hệ quản trị Cơ sở dữ liệu quan hệ PostgreSQL 16")
    add_p(
        "Cơ sở dữ liệu của SNOTE được xây dựng trên nền tảng PostgreSQL 16 – hệ quản trị CSDL quan hệ mã nguồn mở tiên tiến nhất thế giới hiện nay. Với việc tuân thủ triệt để "
        "các thuộc tính ACID (Atomicity, Consistency, Isolation, Durability), PostgreSQL bảo đảm sự an toàn tuyệt đối cho các giao dịch học tập (như phân công thành viên đồ án, "
        "liên kết tài liệu vào bài tập, tạo học kỳ mới). Mô hình dữ liệu đạt chuẩn hóa 3NF với 16 bảng dữ liệu trọng yếu chia thành các nhóm: Danh tính & Xác thực (users, refresh_tokens), "
        "Cấu trúc học thuật (semesters, subjects, schedule_events), Quản lý học tập (projects, project_members, notes, tags, note_tags) và Tiến độ & Chia sẻ (tasks, task_tags, "
        "task_assignees, task_note_links, resource_shares, backup_records)."
    )

    add_h3("2.4.2. Khóa chính UUID và Tối ưu hóa Chỉ mục (Composite Indexes)")
    add_p(
        "100% các bảng dữ liệu đều sử dụng khóa chính dạng UUID v4 (@db.Uuid) thay cho số nguyên tự tăng (Auto-increment ID). Kỹ thuật này giúp chống lại hoàn toàn nguy cơ "
        "tấn công thu thập dữ liệu (Enumeration Attack) khi kẻ xấu cố tình tăng dần số ID trên URL để xem trộm bài giảng hay đồ án của sinh viên khác. Đồng thời, hệ thống thiết lập "
        "hàng chục chỉ mục kết hợp (Composite B-Tree Indexes) tại các trường có tần suất lọc cao ([user_id, deleted_at], [user_id, status, deleted_at], [start_time, end_time]), "
        "giúp tốc độ tìm kiếm bài giảng hay lịch thi đạt dưới 5ms."
    )

    add_h3("2.4.3. Công cụ ánh xạ đối tượng Prisma ORM v7")
    add_p(
        "Prisma ORM là công cụ thao tác CSDL thế hệ mới đóng vai trò trung gian giữa Node.js và PostgreSQL, mang lại các ưu thế vượt bậc:"
    )
    add_bullet("Lược đồ khai báo trực quan (schema.prisma): Định nghĩa toàn bộ 16 bảng dữ liệu, 13 Enums và các quan hệ 1-1, 1-N, N-N tập trung tại duy nhất một tệp tin trực quan, dễ quản lý hơn việc duy trì hàng chục tệp SQL thô.", "- ");
    add_bullet("Truy vấn Type-safe và Ngăn chặn SQL Injection 100%: Prisma Client tự động sinh mã nguồn TypeScript tương ứng với cấu trúc CSDL. Mọi thao tác truy vấn đều được tham số hóa an toàn tuyệt đối, triệt tiêu nguy cơ tấn công SQL Injection.", "- ");
    add_bullet("Đồng bộ lược đồ và Dữ liệu mẫu (Migration & Seed): Lệnh prisma db push cho phép cập nhật CSDL tức thì; script seed.ts tự động nạp sẵn tài khoản Admin, Sinh viên mẫu, môn học và đồ án phục vụ thử nghiệm ngay lập tức.", "- ");

    add_h3("2.4.4. Cơ chế Phục hồi dữ liệu với Kỹ thuật Xóa mềm (Soft Delete)")
    add_p(
        "Hầu hết các bảng dữ liệu cốt lõi (User, Semester, Subject, Project, Note, Task, ScheduleEvent) đều được tích hợp trường deleted_at (kiểu Timestamptz). "
        "Khi người dùng bấm xóa môn học hay bài tập, hệ thống không thực thi lệnh DELETE vật lý khỏi ổ đĩa mà chỉ cập nhật mốc thời gian vào trường deleted_at. "
        "Kỹ thuật này giúp bảo vệ dữ liệu học tập của sinh viên khỏi các thao tác bấm nhầm và hỗ trợ tính năng 'Thùng rác' để khôi phục tài liệu dễ dàng."
    )

    add_h2("2.5. HỆ THỐNG BẢO MẬT ĐA LỚP VÀ CÔNG NGHỆ ẢO HÓA DEVOPS")
    add_h3("2.5.1. Cơ chế Xác thực Token kép (Dual Token: JWT Access & Refresh Token)")
    add_p(
        "SNOTE triển khai giải pháp xác thực không trạng thái (Stateless Authentication) dựa trên chuẩn JSON Web Token (JWT) kết hợp mô hình cặp khóa kép mang tính an toàn cao nhất hiện nay:"
    )
    add_bullet("Access Token (Hạn dùng ngắn - 15 phút): Được ký bằng thuật toán HMAC SHA-256 với khóa bảo mật tối thiểu 32 ký tự, lưu giữ trên bộ nhớ tạm của Frontend và đính kèm trong header Authorization: Bearer <token> ở mỗi request.", "- ");
    add_bullet("Refresh Token (Hạn dùng dài - 7 ngày): Lưu trữ trong Cookie của trình duyệt với các cờ bảo mật nghiêm ngặt: httpOnly (ngăn chặn JavaScript đọc trộm, triệt tiêu nguy cơ đánh cắp token qua XSS), SameSite=Lax (chống tấn công giả mạo CSRF) và Path=/.", "- ");
    add_bullet("Cơ chế thu hồi phiên (Token Revocation): Mỗi Refresh Token cấp phát đều được lưu bản hash trong bảng refresh_tokens. Khi người dùng thực hiện Đăng xuất, token bị đánh dấu revoked_at ngay trong CSDL, vô hiệu hóa hoàn toàn khả năng sử dụng lại phiên đăng nhập.", "- ");

    add_h3("2.5.2. Mã hóa mật khẩu với Bcryptjs và Bức tường bảo vệ HTTP")
    add_p(
        "Bảo mật thông tin đăng nhập và lưu lượng mạng được tăng cường qua nhiều tầng kiểm soát:"
    )
    add_bullet("Mã hóa mật khẩu một chiều: Mật khẩu của người dùng được băm bằng thuật toán Bcrypt với hệ số Salt rounds = 10. Thuật toán tự sinh muối ngẫu nhiên gắn vào từng mật khẩu, vô hiệu hóa hoàn toàn các kỹ thuật tấn công bằng từ điển (Dictionary Attack) và bảng tính sẵn Rainbow Table.", "- ");
    add_bullet("Bảo vệ HTTP Headers với Helmet: Tự động thiết lập 11 tiêu chuẩn an ninh HTTP (Content-Security-Policy, HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN), bảo vệ ứng dụng khỏi các nguy cơ Clickjacking hay MIME sniffing.", "- ");
    add_bullet("Chống tấn công vét cạn (Rate Limiting): Sử dụng express-rate-limit giới hạn 100 req/phút cho các API thông thường và hạn mức đặc biệt nghiêm ngặt 10 req/15 phút cho API đăng nhập (/api/auth/login), ngăn chặn tin tặc dùng bot dò mật khẩu.", "- ");

    add_h3("2.5.3. Ảo hóa tầng ứng dụng với Docker và Docker Compose")
    add_p(
        "Để đảm bảo môi trường phát triển đồng nhất 100% trên mọi máy tính của thành viên dự án, SNOTE ứng dụng Docker Compose để đóng gói và vận hành cơ sở dữ liệu:"
    )
    add_bullet("Dịch vụ CSDL độc lập: Tệp docker-compose.yml khởi chạy container ainote_postgres từ image postgres:16-alpine (siêu nhẹ, tối ưu tài nguyên), mở cổng kết nối chuẩn 5432.", "- ");
    add_bullet("Lưu trữ dữ liệu bền bỉ (Volume Mount): Dữ liệu bảng và chỉ mục được lưu trực tiếp vào volume postgres_data độc lập trên máy chủ. Nhờ đó, việc dừng hoặc nâng cấp container CSDL hoàn toàn không làm mất dữ liệu học tập đã lưu.", "- ");
    add_bullet("Điều phối đa tiến trình với Concurrently: Lệnh duy nhất npm run dev kích hoạt đồng thời cả hai máy chủ Backend (Port 4000) và Frontend (Port 5173/5174) trong một cửa sổ dòng lệnh duy nhất, phân biệt log bằng màu sắc trực quan.", "- ");

    add_h2("2.6. TỔNG KẾT CHƯƠNG 2")
    add_p(
        "Qua quá trình phân tích chi tiết, có thể khẳng định rằng hệ thống SNOTE đã xây dựng được một nền tảng ngăn xếp công nghệ toàn diện, hiện đại và chuẩn mực cao. "
        "Việc kết hợp chặt chẽ giữa React 19, TypeScript, Node.js Express 5, PostgreSQL 16 và Prisma ORM tạo nên một hệ thống khép kín, an toàn và tối ưu hóa trải nghiệm học tập cho sinh viên."
    )

    doc.add_page_break()

    # =========================================================================
    # 5. CHƯƠNG 3: CÁC TÍNH NĂNG VÀ PHÂN HỆ CHỨC NĂNG CỦA HỆ THỐNG SNOTE
    # =========================================================================
    add_chapter_title("CHƯƠNG 3: CÁC TÍNH NĂNG VÀ PHÂN HỆ CHỨC NĂNG CỦA HỆ THỐNG SNOTE")

    add_p(
        "Dựa trên kiến trúc kỹ thuật Modular Monolith và nền tảng cơ sở dữ liệu quan hệ chuẩn hóa đã trình bày ở Chương 2, "
        "hệ thống SNOTE hiện thực hóa trọn vẹn 11 phân hệ chức năng nghiệp vụ độc lập nhưng kết nối mật thiết với nhau. "
        "Các tính năng được thiết kế xoay quanh mục tiêu cốt lõi: triệt tiêu hoàn toàn vấn nạn 'ghi chú rác' (Junk Notes), "
        "tối ưu hóa luồng làm việc học tập hàng ngày của sinh viên đại học, và hỗ trợ ôn thi có cấu trúc thông qua giao diện "
        "tương tác trực quan, tốc độ cao và tổ chức tri thức khoa học."
    )

    add_h2("3.1. PHÂN HỆ QUẢN LÝ CẤU TRÚC HỌC THUẬT VÀ CƠ CHẾ TRIỆT TIÊU 'NOTE RÁC'")
    add_h3("3.1.1. Quản lý Học kỳ (Semesters) và Môn học (Subjects)")
    add_p(
        "Hệ thống thiết lập một cấu trúc tổ chức tri thức có kỷ luật phản ánh chính xác thực tế đào tạo tín chỉ tại các trường đại học:"
    )
    add_bullet("Quản lý Học kỳ (Semesters): Sinh viên có thể tạo lập và quản lý các học kỳ (ví dụ: 'Học kỳ 1 - 2025-2026', 'Học kỳ 2 - 2025-2026'). Mỗi học kỳ lưu trữ thông tin về năm học (academicYear), trạng thái vận hành (ACTIVE, COMPLETED, ARCHIVED) và cờ đánh dấu Học kỳ hiện tại (isCurrent). Toàn bộ hệ thống sẽ tự động lọc dữ liệu môn học, thời khóa biểu và deadline tương ứng theo học kỳ đang kích hoạt.", "- ");
    add_bullet("Quản lý Môn học (Subjects): Dưới mỗi học kỳ, sinh viên khai báo các môn học cụ thể kèm theo mã môn học (code - ví dụ: IT3010), số tín chỉ (credits), tên giảng viên phụ trách (lecturer) và bảng màu nhận diện trực quan (color hex code). Hệ thống cung cấp các thẻ màu sắc (Color Badges) đồng bộ trên toàn bộ bài ghi, lịch học và bảng công việc giúp sinh viên phân biệt tức thì các học phần khác nhau.", "- ");

    add_h3("3.1.2. Ràng buộc bất biến chống 'Note rác' (Core Anti-Junk Constraint)")
    add_p(
        "Một trong những điểm khác biệt mang tính triết lý của SNOTE so với các ứng dụng ghi chú tự do (như Google Keep hay Apple Notes) "
        "là cơ chế ngăn chặn việc tạo ghi chép vô định hình. Tại mức CSDL PostgreSQL và tầng thẩm định Zod DTO Backend, hệ thống thiết lập quy tắc bất biến:"
    )
    add_bullet("Ràng buộc kỹ thuật bắt buộc: Mọi ghi chú (Note) và công việc (Task) khi tạo mới bắt buộc phải gắn liền với ít nhất một Môn học (subjectId IS NOT NULL) hoặc một Đồ án môn học (projectId IS NOT NULL).", "- ");
    add_bullet("Hiệu quả thực tiễn: Cơ chế này triệt tiêu hoàn toàn tình trạng sinh viên tạo hàng trăm ghi chú rời rạc, không rõ của môn nào, để rồi trước kỳ thi biến thành một kho rác dữ liệu không thể tra cứu. Tri thức được tích lũy theo từng học phần và sẵn sàng tái sử dụng cho các kỳ thi học kỳ.", "- ");

    add_h2("3.2. KHÔNG GIAN LÀM VIỆC HỌC THUẬT HỢP NHẤT (UNIFIED ACADEMIC WORKSPACE)")
    add_h3("3.2.1. Trung tâm điều phối đa luồng (/workspace) với 3 Tab chuyên sâu")
    add_p(
        "Thay vì buộc sinh viên phải liên tục chuyển hướng giữa hàng loạt trang web riêng rẽ gây gián đoạn mạch tập trung, "
        "SNOTE xây dựng trang Academic Workspace (/workspace) đóng vai trò trung tâm điều phối mọi hoạt động học thuật hàng ngày. "
        "Trang tổng hợp tích hợp sẵn 3 Tab nghiệp vụ chuyên sâu hoạt động mượt mà không tải lại trang:"
    )
    add_bullet("Tab Ghi chú (Notes Tab): Toàn bộ kho bài giảng lý thuyết, báo cáo thực hành, đề cương ôn thi của sinh viên được hiển thị trực quan kèm bộ công cụ chuyển đổi chế độ xem và tìm kiếm nhanh.", "- ");
    add_bullet("Tab Công việc (Tasks Tab): Bảng điều khiển quản lý deadline, bài tập cá nhân và tiến độ bài tập lớn của các môn học trong kỳ.", "- ");
    add_bullet("Tab Lịch trình (Schedule Tab): Thời khóa biểu tuần 7 ngày và Sơ đồ Gantt Timeline tiến độ theo thời gian thực.", "- ");

    add_h3("3.2.2. Thanh lọc đồng bộ đa chiều (Unified Filter Bar)")
    add_p(
        "Nằm cố định ở đầu không gian làm việc, thanh lọc đa chiều (Unified Filter Bar) sử dụng React Context API để lưu trữ trạng thái bộ lọc toàn cục. "
        "Khi sinh viên lựa chọn một Môn học cụ thể (ví dụ: 'Phát triển phần mềm mã nguồn mở') hoặc một Thẻ phân loại (Tag), dữ liệu hiển thị "
        "ở cả 3 Tab (Ghi chú, Công việc, Lịch trình) lập tức được đồng bộ hóa tức thì chỉ trong vòng dưới 10ms, giúp sinh viên có cái nhìn toàn cảnh "
        "về duy nhất môn học đó mà không bị phân tâm bởi các môn khác."
    )

    add_h2("3.3. PHÂN HỆ QUẢN LÝ GHI CHÚ CHUYÊN SÂU (ADVANCED NOTES MANAGEMENT)")
    add_h3("3.3.1. Phân loại 6 loại bài ghi học thuật (Academic Note Types)")
    add_p(
        "Khác với các ứng dụng phổ thông chỉ xem văn bản là một khối text chung chung, SNOTE định hình cấu trúc ghi chú theo 6 phân loại học thuật chuyên biệt (NoteType Enum):"
    )
    add_bullet("LECTURE (Bài giảng lý thuyết): Ghi lại nội dung slide, lời giảng của thầy cô trên lớp, kiến thức nền tảng.", "- ");
    add_bullet("LAB_REPORT (Báo cáo thực hành): Lưu trữ các bước thí nghiệm, thông số thực hành, mã code mẫu và kết quả chạy thử nghiệm.", "- ");
    add_bullet("EXAM_PREP (Đề cương ôn thi): Tập trung các công thức cốt lõi, dạng bài tập điển hình, câu hỏi trọng tâm chuẩn bị cho kỳ thi kết thúc học phần.", "- ");
    add_bullet("PROJECT_LOG (Nhật ký đồ án): Ghi chép tiến độ triển khai dự án, các lỗi gặp phải và giải pháp xử lý kỹ thuật.", "- ");
    add_bullet("MEETING_MINUTES (Biên bản họp nhóm): Biên bản cuộc họp bài tập lớn, ghi nhận phân công nhiệm vụ và thời hạn nộp bài của từng thành viên.", "- ");
    add_bullet("GENERAL (Ghi chú chung): Các thông tin học thuật tham khảo khác liên quan tới môn học.", "- ");

    add_h3("3.3.2. Trình soạn thảo & Kết xuất Markdown chuẩn GitHub (GFM)")
    add_p(
        "Trình soạn thảo ghi chú của SNOTE tích hợp chuẩn GitHub Flavored Markdown (GFM) hiện đại nhất, đáp ứng hoàn hảo nhu cầu ghi chép của sinh viên khối kỹ thuật và công nghệ:"
    )
    add_bullet("Định dạng phong phú: Hỗ trợ tiêu đề các cấp (H1 đến H6), bôi đậm, in nghiêng, trích dẫn khối (blockquotes), danh sách đánh số, danh sách việc có checkbox tương tác.", "- ");
    add_bullet("Khối mã nguồn lập trình có đánh dấu cú pháp (Syntax Highlighting): Tự động tô màu mã nguồn cho hơn 40 ngôn ngữ lập trình (C/C++, Python, JavaScript, Java, SQL, TypeScript), kèm nút bấm sao chép mã nguồn nhanh 1-Click.", "- ");
    add_bullet("Bảng biểu và biểu đồ: Kết xuất bảng dữ liệu chuẩn xác, sạch sẽ, hỗ trợ chèn đường link tham khảo và hình ảnh minh họa bài học.", "- ");

    add_h3("3.3.3. 5 Chế độ hiển thị ghi chú linh hoạt (5 Flexible View Modes)")
    add_p(
        "SNOTE cung cấp 5 chế độ xem ghi chú khác nhau để sinh viên tự do lựa chọn tùy theo mục đích học tập:"
    )
    add_bullet("Chế độ Lưới (GRID View): Hiển thị ghi chú dưới dạng lưới thẻ trực quan, nổi bật tiêu đề, môn học, ngày tạo và trích đoạn nội dung ngắn.", "1. ");
    add_bullet("Chế độ Bento thu gọn (COMPACT BENTO View): Bố cục bất đối xứng hiện đại lấy cảm hứng từ hộp cơm Bento Nhật Bản, tối ưu hóa diện tích hiển thị trên màn hình laptop.", "2. ");
    add_bullet("Chế độ Chia đôi màn hình (SPLIT View): Màn hình soạn thảo Markdown nằm bên trái song song với màn hình kết xuất giao diện trực tiếp bên phải, hỗ trợ kiểm tra định dạng tức thì khi đang gõ phím.", "3. ");
    add_bullet("Chế độ Cột Kanban (KANBAN View): Sắp xếp các ghi chú thành các cột dựa theo phân loại bài ghi (NoteType) hoặc trạng thái ôn tập, tiện lợi cho việc theo dõi đề cương môn học.", "4. ");
    add_bullet("Chế độ Danh sách bảng biểu (LIST View): Hiển thị cô đọng dưới dạng bảng hàng ngang, phù hợp cho việc rà soát nhanh hàng trăm bài ghi trước kỳ thi.", "5. ");

    add_h3("3.3.4. Ghim bài học quan trọng và Chuyển Note thành Task 1-Click")
    add_p(
        "Hệ thống tích hợp các tiện ích tương tác sâu phục vụ thói quen học tập của sinh viên:"
    )
    add_bullet("Ghim ghi chú quan trọng (Pin Note): Sinh viên có thể ghim các bài giảng trọng tâm hoặc đề cương ôn thi lên đầu danh sách. Nhờ chỉ mục B-Tree Index trên trường [user_id, is_pinned], các bài ghi ghim được nạp ngay lập tức.", "- ");
    add_bullet("Chuyển đổi Note thành Task 1-Click (Convert Note to Task): Khi đọc lại bài giảng và phát hiện yêu cầu bài tập của giảng viên, sinh viên chỉ cần bấm nút chuyển đổi. Hệ thống sẽ tự động bóc tách tiêu đề bài giảng thành một Công việc mới trong phân hệ Tasks, tự động kế thừa môn học và gắn liên kết ngược (Task-Note Link), triệt tiêu hoàn toàn thao tác sao chép thủ công.", "- ");

    add_h2("3.4. PHÂN HỆ QUẢN LÝ CÔNG VIỆC VÀ TIẾN ĐỘ HỌC TẬP (TASKS & PRODUCTIVITY)")
    add_h3("3.4.1. Bảng điều khiển Kanban và Danh sách việc cần làm (Todo List)")
    add_p(
        "Quản lý bài tập về nhà, bài tập lớn và đồ án học phần được tổ chức khoa học qua hai dạng hiển thị bổ trợ:"
    )
    add_bullet("Bảng điều khiển Kanban (Kanban Board): Gồm 3 cột trạng thái chuẩn: Cần làm (TODO), Đang thực hiện (IN_PROGRESS), và Đã hoàn thành (DONE). Người dùng có thể kéo thả thẻ công việc mượt mà giữa các cột, trạng thái được cập nhật tức thì xuống CSDL qua API PATCH /api/tasks/:id/status.", "- ");
    add_bullet("Danh sách việc cần làm (Todo List View): Bố cục hàng ngang hiển thị rõ ràng ngày hết hạn, môn học, mức độ ưu tiên và các thẻ phân loại, hỗ trợ lọc nhanh các bài tập chưa hoàn thành.", "- ");

    add_h3("3.4.2. Phân loại 4 mức độ ưu tiên & Kiểm soát Deadline thời gian thực")
    add_p(
        "Nhằm giải quyết triệt để tình trạng 'nước đến chân mới nhảy' hoặc bỏ sót hạn nộp đồ án quan trọng của sinh viên, hệ thống trang bị cơ chế kiểm soát deadline chặt chẽ:"
    )
    add_bullet("4 Cấp độ ưu tiên (TaskPriority Enum): LOW (Thấp - Xanh lá), MEDIUM (Trung bình - Xanh dương), HIGH (Cao - Cam), và URGENT (Khẩn cấp - Đỏ rực).", "- ");
    add_bullet("Đếm ngược thời gian thông minh: Hệ thống tính toán chính xác khoảng cách từ thời điểm hiện tại đến ngày đến hạn (dueDate). Các công việc sắp đến hạn trong vòng 24 giờ hoặc đã quá hạn (Overdue) sẽ được viền đỏ nổi bật kèm thông báo cảnh báo trực quan.", "- ");

    add_h3("3.4.3. Động lực học tập với Vi hiệu ứng ăn mừng (Canvas Confetti)")
    add_p(
        "Nghiên cứu tâm lý học hành vi chỉ ra rằng việc nhận được phản hồi tích cực tức thì sau khi hoàn thành một nhiệm vụ khó khăn sẽ kích hoạt giải phóng dopamine, duy trì hứng thú học tập lâu dài. "
        "SNOTE tích hợp thư viện Canvas Confetti nhẹ: khi sinh viên đánh dấu hoàn thành một bài tập lớn hoặc đồ án quan trọng, màn hình sẽ bung tỏa hiệu ứng pháo hoa giấy rực rỡ mang lại cảm giác thành tựu và thỏa mãn tinh thần sau những giờ học căng thẳng."
    )

    add_h2("3.5. PHÂN HỆ THỜI KHÓA BIỂU VÀ SƠ ĐỒ GANTT TIMELINE THỜI GIAN THỰC")
    add_h3("3.5.1. Lịch tuần 7 ngày hợp nhất (Unified Weekly Calendar)")
    add_p(
        "Lịch trình học tập của SNOTE tích hợp 3 loại sự kiện trọng yếu trên một giao diện trực quan 7 ngày từ Thứ Hai đến Chủ Nhật:"
    )
    add_bullet("Tiết học trên lớp (CLASS): Lịch học cố định hàng tuần với thông tin phòng học, ca học và giảng viên phụ trách.", "- ");
    add_bullet("Lịch thi kết thúc học phần (EXAM): Lịch thi giữa kỳ và cuối kỳ kèm số phòng thi và thời gian làm bài, được tô màu cảnh báo đặc biệt.", "- ");
    add_bullet("Hạn nộp bài tập & đồ án (DEADLINE): Tự động đồng bộ từ các công việc trong phân hệ Tasks có thiết lập ngày đến hạn (dueDate).", "- ");

    add_h3("3.5.2. Sơ đồ Gantt Timeline chuyên sâu cho Đồ án và Deadline")
    add_p(
        "Điểm đột phá kỹ thuật nổi bật nhất trong SNOTE là việc hiện thực hóa thành công **Sơ đồ Gantt Timeline trực quan thời gian thực** (/workspace?tab=schedule) "
        "mà không cần phụ thuộc vào các thư viện bên thứ ba nặng nề:"
    )
    add_bullet("Bảng danh sách cố định bên trái (Sticky Left Table): Giữ nguyên vị trí hiển thị tên bài tập lớn/đồ án, môn học, mức độ ưu tiên và người phụ trách khi người dùng cuộn ngang thời gian.", "- ");
    add_bullet("Trục tọa độ thời gian cuộn ngang mượt mà: Các thanh công việc (Gantt Bars) được tính toán vị trí tọa độ động dựa trên ngày bắt đầu (startDate) và ngày hết hạn (dueDate). Chiều dài thanh phản ánh trực quan độ dài của đồ án.", "- ");
    add_bullet("Định vị cột mốc 'Hôm nay' (Today Indicator): Cột ngày hiện tại được đánh dấu bằng một dải màu xanh nổi bật kéo dài toàn bộ chiều cao sơ đồ, giúp sinh viên ngay lập tức xác định mình đang ở đâu trong chu kỳ đồ án.", "- ");
    add_bullet("Hộp thoại Tooltip chi tiết: Rê chuột vào từng thanh Gantt sẽ hiển thị cửa sổ thông tin nhanh về phần trăm tiến độ, thời gian còn lại và các ghi chú liên quan.", "- ");

    # Embed Figure 3.1 & 3.2
    img1 = os.path.join(os.path.dirname(__file__), "DOCS", "temp", "image_128.png")
    img2 = os.path.join(os.path.dirname(__file__), "DOCS", "temp", "image_129.png")
    if os.path.exists(img1):
        add_figure(img1, "Hình 3.1: Giao diện Sơ đồ Gantt Timeline tương tác thời gian thực và quản lý lịch học tập SNOTE")
    if os.path.exists(img2):
        add_figure(img2, "Hình 3.2: Sơ đồ kiến trúc Luồng điều phối và Quản lý Thời gian biểu Sinh viên")

    add_h2("3.6. KHÔNG GIAN ĐỒ ÁN VÀ LÀM VIỆC NHÓM (PROJECT COLLABORATION)")
    add_h3("3.6.1. Quản lý vòng đời đồ án môn học (Project Lifecycle)")
    add_p(
        "Trong chương trình đại học, bài tập lớn và đồ án chiếm phần lớn khối lượng đánh giá kết quả học phần. Phân hệ Projects cung cấp không gian độc lập để quản lý trọn vẹn vòng đời đồ án:"
    )
    add_bullet("Khởi tạo và Phân nhóm: Mỗi đồ án có thể gắn với một môn học cụ thể trong học kỳ, thiết lập mục tiêu, ngày bắt đầu và hạn nộp báo cáo cuối cùng.", "- ");
    add_bullet("Theo dõi tiến độ tự động: Phần trăm hoàn thành của đồ án được hệ thống tính toán tự động dựa trên tỷ lệ các công việc con (Tasks) đã hoàn thành, hiển thị dưới dạng thanh tiến độ (Progress Bar) trực quan.", "- ");

    add_h3("3.6.2. Phân quyền thành viên (Project RBAC) & Phân công nhiệm vụ")
    add_p(
        "Hỗ trợ làm việc nhóm hiệu quả với bảng phân quyền thành viên dự án (project_members):"
    )
    add_bullet("Mời bạn học vào nhóm: Trưởng nhóm có thể mời các thành viên trong lớp tham gia đồ án thông qua Email hoặc ID tài khoản sinh viên.", "- ");
    add_bullet("4 Vai trò phân định rõ ràng (ProjectRole Enum): OWNER (Trưởng nhóm - toàn quyền chỉnh sửa và xóa đồ án), ADMIN (Quản trị nhóm - thêm bớt thành viên, tạo công việc), MEMBER (Thành viên - cập nhật tiến độ công việc được giao), và VIEWER (Chỉ xem - phù hợp để gửi giảng viên theo dõi tiến độ).", "- ");
    add_bullet("Giao việc cụ thể (Task Assignees): Mỗi công việc trong đồ án có thể được chỉ định cho một hoặc nhiều thành viên cụ thể. Thành viên đăng nhập vào hệ thống sẽ thấy ngay danh sách các phần việc mà mình được giao phụ trách.", "- ");

    add_h2("3.7. TÌM KIẾM TOÀN CỤC, CHIA SẺ AN TOÀN VÀ SAO LƯU DỮ LIỆU")
    add_h3("3.7.1. Hộp thoại Tìm kiếm Toàn cục (Global Search với phím tắt Ctrl + K)")
    add_p(
        "Lấy cảm hứng từ thanh lệnh Command Palette của các công cụ lập trình hiện đại, SNOTE tích hợp hộp thoại tìm kiếm toàn cục mở nhanh bằng phím tắt Ctrl + K. "
        "Tính năng cho phép tìm kiếm toàn văn bản (Full-Text Search) xuyên suốt 4 thực thể dữ liệu chính: Ghi chú, Công việc, Đồ án và Lịch học. "
        "Kết quả tìm kiếm được phân loại theo từng nhóm thực thể kèm biểu tượng nhận diện, hiển thị tức thì theo từng ký tự gõ phím."
    )

    add_h3("3.7.2. Chia sẻ Tài nguyên An toàn (Resource Shares) với Public Link")
    add_p(
        "Hỗ trợ sinh viên chia sẻ tài liệu học tập và đồ án cho bạn học một cách an toàn và linh hoạt thông qua bảng resource_shares:"
    )
    add_bullet("Chia sẻ đích danh: Chia sẻ trực tiếp tới tài khoản của bạn học qua địa chỉ Email cá nhân.", "- ");
    add_bullet("Tạo liên kết công khai bí mật (Secret Share Link): Hệ thống sinh ra một đường dẫn ngẫu nhiên chứa chuỗi Token mật mã học (/share/:token). Bất kỳ ai có đường link đều có thể truy cập tài liệu mà không cần phải có tài khoản trên hệ thống.", "- ");
    add_bullet("Kiểm soát quyền hạn (Access Level): Người chia sẻ có thể thiết lập quyền Chỉ xem (VIEW) hoặc Cho phép chỉnh sửa (EDIT), đồng thời thiết lập thời hạn hết hạn (expiresAt) cho liên kết chia sẻ.", "- ");

    add_h3("3.7.3. Sao lưu & Xuất dữ liệu Toàn vẹn với Mã băm SHA-256")
    add_p(
        "Nhằm bảo vệ tuyệt đối dữ liệu học tập tích lũy qua nhiều năm đại học của sinh viên trước mọi sự cố mất mát, SNOTE cung cấp hệ thống sao lưu và xuất bản dữ liệu độc lập:"
    )
    add_bullet("Xuất tài liệu Markdown (.md): Cho phép tải về từng bài ghi chép độc lập dưới định dạng Markdown chuẩn, dễ dàng lưu trữ trên ổ đĩa cá nhân hoặc mở bằng các công cụ khác.", "- ");
    add_bullet("Sao lưu toàn bộ hệ thống ra file JSON: Xuất trọn vẹn cơ sở dữ liệu học tập cá nhân (học kỳ, môn học, ghi chú, công việc, lịch trình) ra tệp tin JSON có cấu trúc chuẩn.", "- ");
    add_bullet("Chữ ký toàn vẹn SHA-256 Checksum: Mỗi tệp tin sao lưu được hệ thống gắn kèm một mã băm mật mã SHA-256 tính toán từ nội dung tệp. Khi phục hồi, hệ thống kiểm tra lại mã băm này để đảm bảo dữ liệu không bị can thiệp, lỗi tệp hay chỉnh sửa giả mạo.", "- ");

    add_h2("3.8. MA TRẬN ĐÁNH GIÁ TIẾN ĐỘ TRIỂN KHAI CÁC TÍNH NĂNG HỆ THỐNG")
    add_table_caption("Bảng 3.1: Ma trận tổng hợp và đánh giá tiến độ triển khai các phân hệ tính năng hệ thống SNOTE")

    headers_31 = ["Phân hệ Tính năng", "Chức năng Nghiệp vụ Cốt lõi", "Giao diện UI / Endpoint API", "Mức độ Hoàn thiện"]
    rows_31 = [
        ("1. Xác thực & Phân quyền", "Đăng ký, Đăng nhập, Refresh Token, Đổi mật khẩu, Phân quyền RBAC (Student/Admin)", "Trang /login, /register\nPOST /api/auth/*", "Hoàn thành 100%"),
        ("2. Quản lý Học kỳ", "Tạo học kỳ, kích hoạt học kỳ hiện tại (isCurrent), lưu trữ học kỳ cũ", "Modal SemesterModal\nGET, POST /api/semesters", "Hoàn thành 100%"),
        ("3. Quản lý Môn học", "Mã môn, số tín chỉ, giảng viên, gán bảng màu nhận diện trực quan", "Modal SubjectModal\nGET, POST /api/subjects", "Hoàn thành 100%"),
        ("4. Workspace Hợp nhất", "Điều phối 3 tab Notes/Tasks/Schedule, thanh lọc môn học đa chiều", "Trang /workspace\nReact Context đồng bộ", "Hoàn thành 100%"),
        ("5. Ghi chú Markdown", "Soạn thảo GFM, highlight code, 6 NoteType, 5 chế độ xem, Convert to Task", "NoteEditor, NoteCard\nGET, POST, PUT /api/notes", "Hoàn thành 100%"),
        ("6. Quản lý Công việc", "Bảng Kanban kéo thả, Todo List, 4 mức ưu tiên, đếm ngược hạn nộp, Confetti", "TasksKanban, TasksList\nGET, POST, PATCH /api/tasks", "Hoàn thành 100%"),
        ("7. Sơ đồ Gantt & Lịch", "Lịch tuần 7 ngày, Sơ đồ Gantt Timeline thời gian thực, sự kiện Class/Exam", "ScheduleWeekly, GanttTimeline\nGET /api/schedule/unified", "Hoàn thành 100%"),
        ("8. Không gian Đồ án", "Quản lý bài tập lớn, tính % tiến độ, phân quyền 4 vai trò, phân công việc", "ProjectsPage, ProjectDetail\nGET, POST /api/projects", "Hoàn thành 100%"),
        ("9. Tìm kiếm Toàn cục", "Hộp thoại Ctrl+K, tìm kiếm toàn văn bản đa thực thể Notes, Tasks, Projects", "GlobalSearchDialog\nGET /api/search/global", "Hoàn thành 100%"),
        ("10. Chia sẻ & Sao lưu", "Share link bí mật /share/:token (View/Edit), xuất Markdown, sao lưu JSON + SHA-256", "ShareModal, BackupSettings\nPOST /api/shares, /api/backup", "Hoàn thành 100%"),
        ("11. Giám sát Hệ thống", "Theo dõi độ trễ CSDL PostgreSQL, dung lượng RAM, uptime máy chủ cho Admin", "Trang /status (Admin Guard)\nGET /api/health/status", "Hoàn thành 100%")
    ]
    add_styled_table(headers_31, rows_31, [1.3, 2.5, 1.5, 1.0])

    add_h2("3.9. TỔNG KẾT CHƯƠNG 3")
    add_p(
        "Tổng kết lại, Chương 3 đã trình bày chi tiết và toàn diện 11 phân hệ tính năng nghiệp vụ đã được hiện thực hóa trọn vẹn trong hệ thống SNOTE. "
        "Các tính năng không hoạt động đơn lẻ mà liên kết chặt chẽ thành một hệ sinh thái học tập khép kín: từ cấu trúc học kỳ - môn học có kỷ luật "
        "giúp triệt tiêu hoàn toàn 'ghi chú rác', không gian làm việc học thuật hợp nhất (/workspace) tối ưu hóa năng suất, đến các công cụ trực quan "
        "như Sơ đồ Gantt Timeline và bảng Kanban kiểm soát deadline chuẩn xác. Tất cả các tính năng đều đã trải qua quá trình kiểm thử nghiêm ngặt, "
        "đảm bảo độ ổn định và sẵn sàng phục vụ thực tế cho sinh viên đại học."
    )

    # Output file: SNOTE_CHINH_THUC.docx
    output_path = "SNOTE_CHINH_THUC.docx"
    doc.save(output_path)
    print(f"Generated finalized document (Exact original cover preserved): {output_path}")

    for target in ["SNOTE.docx", "SNOTE_DONG_BO.docx"]:
        try:
            doc.save(target)
            print(f"Also updated {target} directly!")
        except Exception as e:
            print(f"Notice: {target} is open in Word: {e}")

if __name__ == "__main__":
    build_final_document()
