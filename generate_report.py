# -*- coding: utf-8 -*-
"""
Script to generate the comprehensive, professional Word Report for SNOTE project.
File output: BAO_CAO_DU_AN_SNOTE.docx
Includes:
- Cover Page with academic standard layout
- Table of Contents & Abbreviations
- Header/Footer with dynamic page numbering (Different first page)
- 7 In-depth Chapters with Academic Analysis, Database Schema, Tech Matrix
- API Endpoints Catalog & Security Pipeline
- Embedded High-Resolution Architecture & UI Screenshots
- Quick Start Guide
"""

import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_report():
    doc = Document()

    # Color Palette - Professional Corporate / Academic Tech
    COLOR_PRIMARY = RGBColor(30, 58, 138)     # Deep Navy (#1E3A8A)
    COLOR_SECONDARY = RGBColor(2, 132, 199)   # Sky Blue (#0284C7)
    COLOR_ACCENT = RGBColor(15, 118, 110)     # Teal (#0F766E)
    COLOR_TEXT = RGBColor(30, 41, 59)         # Slate 800 (#1E293B)
    COLOR_MUTED = RGBColor(100, 116, 139)     # Slate 500 (#64748B)

    # 1. Page Setup - A4 with Vietnamese standard academic thesis margins
    for section in doc.sections:
        section.page_width = Inches(8.27)    # 210mm
        section.page_height = Inches(11.69)  # 297mm
        section.top_margin = Inches(0.98)    # 2.5 cm
        section.bottom_margin = Inches(0.98) # 2.5 cm
        section.left_margin = Inches(1.18)   # 3.0 cm
        section.right_margin = Inches(0.79)  # 2.0 cm
        section.different_first_page_header_footer = True

        # Header for normal pages
        header = section.header
        p_hdr = header.paragraphs[0]
        p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_hdr.paragraph_format.space_after = Pt(4)
        r_hdr = p_hdr.add_run("SNOTE – Báo cáo Dự án: Phát triển Phần mềm Mã nguồn mở")
        r_hdr.font.name = 'Calibri'
        r_hdr.font.size = Pt(8.5)
        r_hdr.font.italic = True
        r_hdr.font.color.rgb = COLOR_MUTED

        # Footer for normal pages (Chỉ giữ lại số trang, bỏ tên trường ở mỗi trang)
        footer = section.footer
        p_ftr = footer.paragraphs[0]
        p_ftr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p_ftr.paragraph_format.space_before = Pt(4)
        
        r_ftr_l = p_ftr.add_run("Trang ")
        r_ftr_l.font.name = 'Calibri'
        r_ftr_l.font.size = Pt(9)
        r_ftr_l.font.color.rgb = COLOR_MUTED

        # Page Number Field
        r_pg = p_ftr.add_run()
        r_pg.font.name = 'Calibri'
        r_pg.font.size = Pt(9)
        r_pg.font.bold = True
        r_pg.font.color.rgb = COLOR_PRIMARY
        
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

    # Helper: Set shading of a cell
    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    # Helper: Set cell margins (padding)
    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for margin, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
            node = parse_xml(f'<{margin} {nsdecls("w")} w:w="{val}" w:type="dxa"/>')
            tcMar.append(node)
        tcPr.append(tcMar)

    # Helper: Add Heading 1
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(15.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    # Helper: Add Heading 2
    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    # Helper: Add Heading 3
    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = COLOR_ACCENT
        return p

    # Helper: Add Body Paragraph
    def add_p(text, bold_prefix=None, italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.25

        if bold_prefix:
            run_bp = p.add_run(bold_prefix)
            run_bp.font.name = 'Calibri'
            run_bp.font.size = Pt(11)
            run_bp.font.bold = True
            run_bp.font.color.rgb = COLOR_TEXT

        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(11)
        run.font.italic = italic
        run.font.color.rgb = COLOR_TEXT
        return p

    # Helper: Add Bullet point
    def add_bullet(text, bold_prefix=None, level=0):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.2
        p.paragraph_format.left_indent = Inches(0.25 * (level + 1))

        if bold_prefix:
            run_bp = p.add_run(bold_prefix)
            run_bp.font.name = 'Calibri'
            run_bp.font.size = Pt(10.5)
            run_bp.font.bold = True
            run_bp.font.color.rgb = COLOR_TEXT

        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(10.5)
        run.font.color.rgb = COLOR_TEXT
        return p

    # Helper: Add Callout Box
    def add_callout(text, title="ĐIỂM NHẤN CỐT LÕI (KEY HIGHLIGHT)"):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.3)
        set_cell_background(cell, "F0F9FF")
        set_cell_margins(cell, top=140, bottom=140, left=200, right=160)

        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(f'''
            <w:tcBorders {nsdecls("w")}>
                <w:top w:val="none"/>
                <w:left w:val="single" w:sz="36" w:space="0" w:color="0284C7"/>
                <w:bottom w:val="none"/>
                <w:right w:val="none"/>
            </w:tcBorders>
        ''')
        tcPr.append(borders)

        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        run_t = p.add_run(f"📌 {title}\n")
        run_t.font.name = 'Arial'
        run_t.font.size = Pt(10)
        run_t.font.bold = True
        run_t.font.color.rgb = COLOR_SECONDARY

        run_body = p.add_run(text)
        run_body.font.name = 'Calibri'
        run_body.font.size = Pt(10)
        run_body.font.color.rgb = COLOR_TEXT

        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(0)
        sp.paragraph_format.space_after = Pt(4)

    # Helper: Add Code Box
    def add_code_block(code_text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.3)
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=100, bottom=100, left=150, right=150)

        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(f'''
            <w:tcBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="6" w:space="0" w:color="E2E8F0"/>
                <w:left w:val="single" w:sz="18" w:space="0" w:color="94A3B8"/>
                <w:bottom w:val="single" w:sz="6" w:space="0" w:color="E2E8F0"/>
                <w:right w:val="single" w:sz="6" w:space="0" w:color="E2E8F0"/>
            </w:tcBorders>
        ''')
        tcPr.append(borders)

        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(15, 23, 42)

        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(0)
        sp.paragraph_format.space_after = Pt(4)

    # Helper: Add Styled Table
    def add_styled_table(headers, rows_data, col_widths=None):
        table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            set_cell_background(hdr_cells[i], "1E3A8A")
            set_cell_margins(hdr_cells[i], top=120, bottom=120, left=120, right=120)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.size = Pt(9.5)
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

        # Data Rows
        for r_idx, row in enumerate(rows_data):
            row_cells = table.rows[r_idx + 1].cells
            bg_color = "FFFFFF" if r_idx % 2 == 0 else "F8FAFC"
            for c_idx, val in enumerate(row):
                row_cells[c_idx].text = str(val)
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=100, right=100)
                p = row_cells[c_idx].paragraphs[0]
                p.paragraph_format.line_spacing = 1.15
                p.paragraph_format.space_before = Pt(1)
                p.paragraph_format.space_after = Pt(1)
                for r in p.runs:
                    r.font.name = 'Calibri'
                    r.font.size = Pt(9.5)
                    r.font.color.rgb = COLOR_TEXT

        # Borders
        tblPr = table._tbl.tblPr
        tblBorders = parse_xml(f'''
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>
                <w:left w:val="none"/>
                <w:bottom w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>
                <w:right w:val="none"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                <w:insideV w:val="none"/>
            </w:tblBorders>
        ''')
        tblPr.append(tblBorders)

        if col_widths:
            for row in table.rows:
                for c_idx, width in enumerate(col_widths):
                    row.cells[c_idx].width = Inches(width)

        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(2)
        sp.paragraph_format.space_after = Pt(6)
        return table

    # Helper: Add Image with Caption
    def add_figure(img_path, caption):
        if os.path.exists(img_path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run()
            run.add_picture(img_path, width=Inches(5.9))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(12)
            r_cap = p_cap.add_run(caption)
            r_cap.font.name = 'Calibri'
            r_cap.font.size = Pt(9.5)
            r_cap.font.italic = True
            r_cap.font.color.rgb = COLOR_MUTED

    # =========================================================================
    # TRANG BÌA (COVER PAGE)
    # =========================================================================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(16)
    p_inst.paragraph_format.space_after = Pt(2)
    r_inst1 = p_inst.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO\nTRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI\nKHOA CÔNG NGHỆ THÔNG TIN")
    r_inst1.font.name = 'Arial'
    r_inst1.font.size = Pt(12)
    r_inst1.font.bold = True
    r_inst1.font.color.rgb = COLOR_PRIMARY

    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.paragraph_format.space_after = Pt(14)
    r_line = p_line.add_run("━━━━━━━━━━━━━━━━━━━ ◆ ━━━━━━━━━━━━━━━━━━━")
    r_line.font.color.rgb = COLOR_SECONDARY

    # LOGO PLACEHOLDER BOX (Khung để người dùng chèn logo trường ĐH Giao thông Vận tải)
    logo_table = doc.add_table(rows=1, cols=1)
    logo_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_logo = logo_table.cell(0, 0)
    cell_logo.width = Inches(2.2)
    set_cell_background(cell_logo, "F8FAFC")
    set_cell_margins(cell_logo, top=140, bottom=140, left=140, right=140)

    tcPr_logo = cell_logo._tc.get_or_add_tcPr()
    logo_borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="dashed" w:sz="8" w:space="0" w:color="94A3B8"/>
            <w:left w:val="dashed" w:sz="8" w:space="0" w:color="94A3B8"/>
            <w:bottom w:val="dashed" w:sz="8" w:space="0" w:color="94A3B8"/>
            <w:right w:val="dashed" w:sz="8" w:space="0" w:color="94A3B8"/>
        </w:tcBorders>
    ''')
    tcPr_logo.append(logo_borders)

    p_logo = cell_logo.paragraphs[0]
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_before = Pt(4)
    p_logo.paragraph_format.space_after = Pt(4)
    r_logo_icon = p_logo.add_run("🏫\n")
    r_logo_icon.font.size = Pt(18)
    r_logo_txt = p_logo.add_run("[ CHÈN LOGO TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI TẠI ĐÂY ]\n")
    r_logo_txt.font.name = 'Arial'
    r_logo_txt.font.size = Pt(8.5)
    r_logo_txt.font.bold = True
    r_logo_txt.font.color.rgb = COLOR_SECONDARY
    r_logo_hint = p_logo.add_run("(Click chuột phải hoặc dán ảnh Logo UTC vào ô này)")
    r_logo_hint.font.name = 'Calibri'
    r_logo_hint.font.size = Pt(8)
    r_logo_hint.font.italic = True
    r_logo_hint.font.color.rgb = COLOR_MUTED

    p_after_logo = doc.add_paragraph()
    p_after_logo.paragraph_format.space_before = Pt(8)
    p_after_logo.paragraph_format.space_after = Pt(4)

    # Loại báo cáo & Môn học
    p_type = doc.add_paragraph()
    p_type.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_type.paragraph_format.space_after = Pt(4)
    r_type = p_type.add_run("BÁO CÁO ĐỒ ÁN / BÀI TẬP LỚN HỌC PHẦN")
    r_type.font.name = 'Arial'
    r_type.font.size = Pt(13)
    r_type.font.bold = True
    r_type.font.color.rgb = COLOR_SECONDARY

    p_subject = doc.add_paragraph()
    p_subject.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_subject.paragraph_format.space_after = Pt(14)
    r_sub_label = p_subject.add_run("MÔN HỌC: ")
    r_sub_label.font.name = 'Arial'
    r_sub_label.font.size = Pt(13)
    r_sub_label.font.bold = True
    r_sub_label.font.color.rgb = COLOR_TEXT
    r_sub_name = p_subject.add_run("PHÁT TRIỂN PHẦN MỀM MÃ NGUỒN MỞ")
    r_sub_name.font.name = 'Arial'
    r_sub_name.font.size = Pt(13.5)
    r_sub_name.font.bold = True
    r_sub_name.font.color.rgb = COLOR_PRIMARY

    # Tên dự án
    p_proj_label = doc.add_paragraph()
    p_proj_label.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proj_label.paragraph_format.space_before = Pt(4)
    p_proj_label.paragraph_format.space_after = Pt(2)
    r_pj_lbl = p_proj_label.add_run("TÊN ĐỀ TÀI / DỰ ÁN:")
    r_pj_lbl.font.name = 'Arial'
    r_pj_lbl.font.size = Pt(11)
    r_pj_lbl.font.bold = True
    r_pj_lbl.font.color.rgb = COLOR_MUTED

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(8)
    r_title = p_title.add_run("SNOTE: HỆ THỐNG GHI CHÚ VÀ QUẢN LÝ HỌC TẬP THÔNG MINH\n(SECOND BRAIN FOR UNIVERSITY STUDENTS)")
    r_title.font.name = 'Arial'
    r_title.font.size = Pt(17.5)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(24)
    r_sub = p_sub.add_run("Giải pháp triệt tiêu 'Note rác', kiểm soát Deadline & Đồng hành ôn thi chuyên sâu")
    r_sub.font.name = 'Calibri'
    r_sub.font.size = Pt(11.5)
    r_sub.font.italic = True
    r_sub.font.color.rgb = COLOR_MUTED

    # Metadata table on cover
    cover_table = doc.add_table(rows=6, cols=2)
    cover_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cover_info = [
        ("Môn học / Học phần:", "Phát triển phần mềm mã nguồn mở"),
        ("Tên đề tài / Dự án:", "SNOTE (Hệ thống Second Brain cho Sinh viên)"),
        ("Giảng viên hướng dẫn:", "[Điền tên Giảng viên hướng dẫn]"),
        ("Sinh viên thực hiện:", "Bùi Đức Việt"),
        ("Mã sinh viên / Lớp:", "[Điền Mã SV / Lớp học phần]"),
        ("Khoa / Trường:", "Khoa Công nghệ Thông tin – Trường ĐH Giao thông Vận tải")
    ]
    for idx, (label, val) in enumerate(cover_info):
        c0 = cover_table.rows[idx].cells[0]
        c1 = cover_table.rows[idx].cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.1)
        c0.text = label
        c1.text = val
        for r in c0.paragraphs[0].runs:
            r.font.name = 'Arial'
            r.font.size = Pt(10)
            r.font.bold = True
            r.font.color.rgb = COLOR_PRIMARY
        for r in c1.paragraphs[0].runs:
            r.font.name = 'Calibri'
            r.font.size = Pt(10)
            r.font.color.rgb = COLOR_TEXT

    p_bottom = doc.add_paragraph()
    p_bottom.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_bottom.paragraph_format.space_before = Pt(45)
    r_b = p_bottom.add_run("HÀ NỘI – NĂM HỌC 2025 - 2026")
    r_b.font.name = 'Arial'
    r_b.font.size = Pt(11)
    r_b.font.bold = True
    r_b.font.color.rgb = COLOR_MUTED

    doc.add_page_break()

    # =========================================================================
    # MỤC LỤC TỔNG QUAN
    # =========================================================================
    add_h1("MỤC LỤC BÁO CÁO")
    toc_items = [
        ("CHƯƠNG 1: TỔNG QUAN VỀ DỰ ÁN SNOTE", "Trang 3"),
        ("    1.1. Bối cảnh & Vấn đề Thực tiễn của Sinh viên Đại học", "Trang 3"),
        ("    1.2. Tầm nhìn & Triết lý Sản phẩm: Second Brain cho Sinh viên", "Trang 3"),
        ("    1.3. Khách hàng Mục tiêu & Chân dung Người dùng (Personas)", "Trang 4"),
        ("    1.4. Phạm vi Dự án (Project Scope: In-Scope & Out-of-Scope)", "Trang 4"),
        ("CHƯƠNG 2: KIẾN TRÚC HỆ THỐNG & MA TRẬN CÔNG NGHỆ", "Trang 5"),
        ("    2.1. Mô hình Kiến trúc Tổng thể: Modular Monolith", "Trang 5"),
        ("    2.2. Ma trận Công nghệ Sử dụng (Tech Stack Matrix)", "Trang 5"),
        ("    2.3. Cấu trúc Thư mục Monorepo & Bounded Contexts", "Trang 6"),
        ("CHƯƠNG 3: THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DESIGN)", "Trang 7"),
        ("    3.1. Các Nguyên tắc Thiết kế CSDL Cốt lõi", "Trang 7"),
        ("    3.2. Ràng buộc Bất biến Chống 'Note Rác' (Core Anti-Junk Constraint)", "Trang 7"),
        ("    3.3. Từ điển Dữ liệu Chi tiết các Bảng Chính (Data Dictionary)", "Trang 8"),
        ("    3.4. Chiến lược Đánh Chỉ mục Tối ưu Hiệu năng (Composite Indexing)", "Trang 9"),
        ("CHƯƠNG 4: CHI TIẾT CÁC PHÂN HỆ NGHIỆP VỤ & TÍNH NĂNG NỔI BẬT", "Trang 10"),
        ("    4.1. Phân hệ Xác thực & Phân quyền Đa tầng (Auth & RBAC)", "Trang 10"),
        ("    4.2. Không gian Làm việc Học thuật Hợp nhất (Academic Workspace)", "Trang 10"),
        ("    4.3. Phân hệ Quản lý Ghi chú Chuyên sâu (Advanced Notes)", "Trang 11"),
        ("    4.4. Phân hệ Quản lý Công việc & Tiến độ (Tasks & Productivity)", "Trang 11"),
        ("    4.5. Phân hệ Lịch trình & Sơ đồ Gantt Timeline Thời gian thực", "Trang 12"),
        ("    4.6. Không gian Đồ án & Làm việc Nhóm (Project Collaboration)", "Trang 13"),
        ("    4.7. Trợ lý Trí tuệ Nhân tạo Toàn cục (Floating AI Copilot & AI Chat)", "Trang 13"),
        ("    4.8. Tìm kiếm Toàn cục (Global Search) & Chia sẻ An toàn (Resource Shares)", "Trang 14"),
        ("CHƯƠNG 5: HIỆN THỰC HÓA BẢO MẬT & QUAN SÁT HỆ THỐNG", "Trang 15"),
        ("    5.1. Pipeline Cứng hóa Bảo mật Backend (Security Hardening)", "Trang 15"),
        ("    5.2. Hệ thống Ghi nhật ký Siêu tốc & Truy vết Phân tán (Pino & Tracing)", "Trang 15"),
        ("    5.3. Danh mục API Endpoints & Mã Phản hồi Chuẩn", "Trang 16"),
        ("CHƯƠNG 6: ĐÁNH GIÁ KẾT QUẢ, KIỂM THỬ & SO SÁNH GIẢI PHÁP", "Trang 17"),
        ("    6.1. Kết quả Kiểm thử Toàn diện Hệ thống (Verification & DoD)", "Trang 17"),
        ("    6.2. Bảng So sánh SNOTE với các Nền tảng Hiện nay", "Trang 17"),
        ("CHƯƠNG 7: KẾT LUẬN & LỘ TRÌNH PHÁT TRIỂN", "Trang 18"),
        ("    7.1. Kết luận Đồ án", "Trang 18"),
        ("    7.2. Lộ trình Tích hợp Trí tuệ Nhân tạo Dài hạn (AI Roadmap 4 Giai đoạn)", "Trang 18"),
        ("PHỤ LỤC: HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH NHANH (QUICK START)", "Trang 19")
    ]
    for item, page in toc_items:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(1)
        p_t.paragraph_format.space_after = Pt(2)
        r1 = p_t.add_run(item)
        r1.font.name = 'Calibri'
        r1.font.size = Pt(10)
        r1.font.color.rgb = COLOR_PRIMARY if "CHƯƠNG" in item or "PHỤ LỤC" in item else COLOR_TEXT
        r1.font.bold = True if "CHƯƠNG" in item or "PHỤ LỤC" in item else False

        r_dots = p_t.add_run(f"  ...........................................................................................  {page}")
        r_dots.font.name = 'Calibri'
        r_dots.font.size = Pt(9)
        r_dots.font.color.rgb = COLOR_MUTED

    doc.add_page_break()

    # =========================================================================
    # DANH MỤC TỪ VIẾT TẮT
    # =========================================================================
    add_h1("BẢNG TỪ VIẾT TẮT & THUẬT NGỮ KỸ THUẬT")
    abbrev_data = [
        ("API", "Application Programming Interface", "Giao diện lập trình ứng dụng"),
        ("SPA", "Single Page Application", "Ứng dụng web đơn trang tải động"),
        ("ORM", "Object-Relational Mapping", "Kỹ thuật ánh xạ đối tượng vào cơ sở dữ liệu quan hệ"),
        ("RBAC", "Role-Based Access Control", "Kiểm soát truy cập dựa trên vai trò người dùng"),
        ("JWT", "JSON Web Token", "Chuẩn mở (RFC 7519) truyền tải thông tin xác thực an toàn"),
        ("FTS", "Full-Text Search", "Tìm kiếm toàn văn bản được hỗ trợ bởi engine chỉ mục"),
        ("DDL", "Data Definition Language", "Ngôn ngữ định nghĩa cấu trúc cơ sở dữ liệu"),
        ("DTO", "Data Transfer Object", "Đối tượng truyền dữ liệu giữa các tầng kiến trúc"),
        ("IDOR", "Insecure Direct Object Reference", "Lỗ hổng tham chiếu đối tượng trực tiếp không an toàn"),
        ("ESM", "ECMAScript Modules", "Chuẩn hệ thống module chính thức của JavaScript"),
        ("HMR", "Hot Module Replacement", "Cơ chế cập nhật module tức thì không cần tải lại trang")
    ]
    add_styled_table(["Thuật ngữ", "Tên tiếng Anh", "Ý nghĩa trong hệ thống SNOTE"], abbrev_data, [1.2, 2.5, 2.6])

    # =========================================================================
    # CHƯƠNG 1: TỔNG QUAN DỰ ÁN & BỐI CẢNH NGHIÊN CỨU
    # =========================================================================
    add_h1("CHƯƠNG 1: TỔNG QUAN VỀ DỰ ÁN SNOTE")

    add_h2("1.1. Bối cảnh & Vấn đề Thực tiễn của Sinh viên Đại học")
    add_p(
        "Trong bối cảnh chuyển đổi số giáo dục đại học, mỗi sinh viên trung bình phải theo học từ 5 đến 8 học phần trong một học kỳ. "
        "Mỗi môn học đều bao gồm khối lượng khổng lồ bài giảng lý thuyết, bài tập cá nhân, bài tập nhóm, đồ án môn học và lịch thi dày đặc. "
        "Hiện nay, dữ liệu học tập của sinh viên bị phân tán nghiêm trọng trên nhiều công cụ độc lập: slide bài giảng lưu trên Google Drive, "
        "ghi chú chép vội trong Apple Notes / Google Keep, trao đổi bài tập nhóm trôi tin nhắn trên Zalo / Messenger, và hạn nộp bài ghi chép trên lịch cá nhân."
    )
    add_p(
        "Tình trạng phân mảnh này dẫn đến ba vấn nạn nan giải kéo dài xuyên suốt các năm đại học:"
    )
    add_bullet("Vấn nạn 'Note rác' (Junk Notes): Sinh viên ghi chép hàng trăm ghi chú nhưng không gắn với học kỳ, môn học cụ thể. Đến trước kỳ thi, các ghi chép này biến thành một kho rác vô định hình, không thể tái sử dụng để ôn thi.", "1. ");
    add_bullet("Mất kiểm soát Deadline & Quên bài tập lớn: Sinh viên không có cái nhìn toàn cảnh về khối lượng công việc theo tuần/tháng, dẫn đến tình trạng 'nước đến chân mới nhảy' hoặc bỏ sót hạn nộp đồ án quan trọng.", "2. ");
    add_bullet("Công cụ hiện có quá phức tạp hoặc quá sơ sài: Notion và Obsidian đòi hỏi sinh viên mất hàng tuần cấu hình templates phức tạp; ngược lại Google Keep hay Trello lại thiếu hoàn toàn các khái niệm học thuật như Học kỳ, Tín chỉ, Giảng viên, Lịch thi.", "3. ");

    add_h2("1.2. Tầm nhìn & Triết lý Sản phẩm: Second Brain cho Sinh viên")
    add_callout(
        "Tagline: 'Second Brain cho sinh viên – Một nơi duy nhất để ghi chú, quản lý bài tập và chuẩn bị ôn thi có cấu trúc.'\n\n"
        "Triết lý thiết kế bất biến: Xây dựng nền tảng non-AI cực kỳ vững chắc, nhất quán và chặt chẽ làm lớp lõi; sau đó tích hợp Trí tuệ Nhân tạo (AI Copilot) như một công cụ gia tăng năng suất học tập vượt trội.",
        "TRIẾT LÝ SẢN PHẨM SNOTE"
    )
    add_p(
        "SNOTE được định vị là 'Bộ não thứ hai' (Second Brain) đồng hành cùng sinh viên từ năm nhất đại học đến khi tốt nghiệp. "
        "Hệ thống thiết lập một cấu trúc tổ chức tri thức có kỷ luật: Mọi ghi chú hay công việc phát sinh bắt buộc phải gắn liền với ngữ cảnh môn học hoặc đồ án cụ thể. "
        "Thông qua đó, SNOTE biến các buổi học rời rạc thành một kho tri thức có tổ chức, sẵn sàng kích hoạt ôn luyện trước mỗi kỳ thi."
    )

    add_h2("1.3. Khách hàng Mục tiêu & Chân dung Người dùng (Personas)")
    add_p("Hệ thống phục vụ trực tiếp hai chân dung sinh viên điển hình:")

    add_bullet("Persona 1: 'Minh' – Sinh viên ngành Công nghệ Thông tin (Năm 2): Học 6 môn chuyên ngành, thường xuyên quên hạn nộp lab và bài tập lớn. Nhu cầu: Cần một công cụ viết Markdown có khối code, gán deadline trực tiếp từ nội dung bài giảng, và chuyển đổi mượt mà giữa dạng bảng Kanban và sơ đồ Gantt timeline.", "• ");
    add_bullet("Persona 2: 'Lan' – Sinh viên Khối ngành Kinh tế làm Đồ án Nhóm (Năm 3): Trưởng nhóm nhiều đồ án nghiên cứu. Nhu cầu: Cần một không gian đồ án (Project Workspace) để lưu trữ biên bản họp, tài liệu môn học, phân chia công việc cho thành viên với quyền hạn rõ ràng (Owner, Member, Viewer) và chia sẻ liên kết an toàn.", "• ");

    add_h2("1.4. Phạm vi Dự án (Project Scope)")
    scope_data = [
        ("Phân hệ Quản lý Học kỳ & Môn học", "Tạo lập học kỳ, quản lý danh sách môn học, mã môn, số tín chỉ, giảng viên, gán màu sắc nhận diện.", "TRONG PHẠM VI (IN SCOPE)"),
        ("Phân hệ Ghi chú Bài học (Notes)", "Soạn thảo Markdown phong phú, 6 phân loại NoteType, ghim bài ghi, chuyển Note thành Task, 5 chế độ xem linh hoạt.", "TRONG PHẠM VI (IN SCOPE)"),
        ("Phân hệ Quản lý Công việc (Tasks)", "Quản lý Todo/Kanban, Deadline, Độ ưu tiên, Đánh dấu hoàn thành có hiệu ứng Confetti ăn mừng.", "TRONG PHẠM VI (IN SCOPE)"),
        ("Lịch trình & Sơ đồ Gantt Timeline", "Lịch tuần 7 ngày hợp nhất và Sơ đồ Gantt Timeline hiển thị trực quan các sự kiện, lịch thi, hạn nộp đồ án.", "TRONG PHẠM VI (IN SCOPE)"),
        ("Không gian Đồ án & Làm việc nhóm", "Tạo Project, phân vai trò thành viên (Owner, Member), gán công việc cho từng thành viên tham gia.", "TRONG PHẠM VI (IN SCOPE)"),
        ("Tìm kiếm Toàn cục & Bộ lọc Đa tiêu chí", "Phím tắt Ctrl+K, tìm kiếm toàn văn bản xuyên suốt Notes, Tasks, Projects và Lịch học.", "TRONG PHẠM VI (IN SCOPE)"),
        ("Trợ lý AI Copilot Nổi Toàn diện", "Kích hoạt bằng phím tắt Ctrl+J hoặc nút nổi: Tóm tắt bài giảng, trích xuất Checklist bài tập, dự đoán đề thi.", "TRONG PHẠM VI (IN SCOPE)"),
        ("Sao lưu, Xuất dữ liệu & Chia sẻ", "Xuất file Markdown, sao lưu toàn bộ hệ thống ra file JSON kèm mã kiểm tra SHA-256 Checksum, Public Share Link.", "TRONG PHẠM VI (IN SCOPE)"),
        ("Phân quyền Quản trị & Giám sát Hệ thống", "RBAC phân biệt Student và Admin; trang /status giám sát tình trạng máy chủ, độ trễ DB và bộ nhớ.", "TRONG PHẠM VI (IN SCOPE)"),
        ("Realtime Co-editing như Google Docs", "Chỉnh sửa đồng thời từng ký tự theo thời gian thực (OT/CRDT) nằm ngoài phạm vi MVP.", "NGOÀI PHẠM VI (OUT OF SCOPE)"),
        ("Đồng bộ 2 chiều LMS Moodle/Canvas", "Được quy hoạch trong Lộ trình phiên bản tương lai.", "NGOÀI PHẠM VI (OUT OF SCOPE)")
    ]
    add_styled_table(["Hạng mục / Phân hệ", "Mô tả Chi tiết Nghiệp vụ", "Phạm vi Triển khai"], scope_data, [1.8, 3.2, 1.3])

    # =========================================================================
    # CHƯƠNG 2: KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ ÁP DỤNG
    # =========================================================================
    add_h1("CHƯƠNG 2: KIẾN TRÚC HỆ THỐNG & MA TRẬN CÔNG NGHỆ")

    add_h2("2.1. Mô hình Kiến trúc Tổng thể: Modular Monolith")
    add_p(
        "Hệ thống SNOTE được thiết kế theo phong cách kiến trúc **Modular Monolith** phân tầng rõ ràng, kết hợp với kiến trúc "
        "Frontend **Feature-based Single Page Application (SPA)**. Kiến trúc này mang lại những ưu điểm vượt trội so với cả Microservices lẫn Monolith truyền thống:"
    )
    add_bullet("Đóng gói Bounded Contexts nghiêm ngặt: Mã nguồn backend được chia thành 12 domain modules độc lập (Auth, Semesters, Subjects, Projects, Notes, Tasks, Schedule, Search, Shares, Backup, Health, AI). Mỗi module tự quản lý Controller, Service, Repository và DTO Schemas riêng.", "• ");
    add_bullet("Chi phí vận hành tối ưu: Toàn bộ hệ thống chạy trong một tiến trình Node.js duy nhất, loại bỏ hoàn toàn độ trễ mạng giữa các dịch vụ microservices, đảm bảo giao dịch ACID trong phạm vi một database transaction duy nhất.", "• ");
    add_bullet("Dễ dàng chuyển đổi trong tương lai: Nhờ tính độc lập cao giữa các module, khi tải của một phân hệ (ví dụ: AI Assistant hoặc Search) tăng đột biến, phân hệ đó có thể tách thành một microservice độc lập mà không cần tái cấu trúc toàn bộ dự án.", "• ");

    add_h2("2.2. Ma trận Công nghệ Dự án (Tech Stack Matrix)")
    tech_matrix = [
        ("Tầng", "Công nghệ / Thư viện", "Phiên bản", "Vai trò & Lợi ích kỹ thuật"),
        ("Runtime", "Node.js LTS", "v24.15.0", "Môi trường thực thi JavaScript/TypeScript server-side hiệu năng cao, async I/O."),
        ("Language", "TypeScript Strict", "^5.7.3", "Hệ thống kiểu dữ liệu tĩnh tuyệt đối, bắt 100% lỗi type tại compile-time."),
        ("Backend Framework", "Express.js", "^5.2.1", "Web framework tốc độ cao, hỗ trợ native async route handlers và middleware."),
        ("ORM & Migration", "Prisma ORM & Driver Pg", "^7.10.0", "Quản lý schema khai báo, sinh PrismaClient type-safe, driver adapter kết nối node-postgres."),
        ("Database Engine", "PostgreSQL Alpine", "16-alpine", "RDBMS chuẩn doanh nghiệp, hỗ trợ ACID, CHECK constraints, JSONB và Full-Text Search."),
        ("Frontend Library", "React", "^19.0.0", "Xây dựng giao diện Component-based theo chuẩn React 19 mới nhất."),
        ("Frontend Bundler", "Vite", "^6.2.0", "Đóng gói mã nguồn cực nhanh với Native ESM HMR và tối ưu hóa code-splitting."),
        ("Routing", "React Router DOM", "^7.2.0", "Client-side routing mượt mà với Nested Layouts, Protected Routes và Admin Guard."),
        ("Styling", "Vanilla CSS Tokens", "CSS3 Native", "Hệ thống biến CSS linh hoạt, Dark/Light mode tức thì, không gây overhead CSS-in-JS."),
        ("Iconography", "Lucide React", "^1.16.0", "Bộ biểu tượng vector chuẩn học thuật sắc nét, đồng nhất toàn diện."),
        ("Markdown Engine", "React Markdown + GFM", "^10.1.0", "Hiển thị bài giảng định dạng Markdown, bảng biểu, danh sách việc, code highlight."),
        ("Data Contracts", "@snote/shared", "1.0.0 Local", "Gói thư viện dùng chung chứa DTOs, Enums, Interfaces giữa Backend và Frontend.")
    ]
    add_styled_table(tech_matrix[0], tech_matrix[1:], [1.1, 1.8, 0.9, 2.5])

    add_h2("2.3. Cấu trúc Thư mục Monorepo")
    add_p("Dự án được cấu trúc theo mô hình Monorepo sạch sẽ, tuân thủ nguyên tắc Single Responsibility:")
    add_code_block(
"""SNOTE/
├── backend/                  # RESTful API Service (Express 5 + Prisma 7)
│   ├── prisma/               # Schema định nghĩa CSDL & migration scripts
│   └── src/
│       ├── config/           # Cấu hình môi trường với Zod Fail-Fast validation
│       ├── modules/          # 12 Bounded Contexts (auth, notes, tasks, ai, ...)
│       ├── shared/           # Db connection, middlewares (authGuard, adminGuard)
│       └── server.ts         # Điểm khởi chạy HTTP Server & pipeline middleware
├── frontend/                 # Client Single Page Application (React 19 + Vite)
│   ├── src/
│   │   ├── components/       # Layouts (Sidebar, Header, AdminRoute), Common modals
│   │   ├── contexts/         # ThemeContext, AuthContext, ToastContext, FilterContext
│   │   ├── features/         # 12 Feature modules (notes, tasks, schedule, ai, ...)
│   │   ├── router/           # AppRouter định tuyến đường dẫn công khai & bảo vệ
│   │   └── services/         # API client bọc Native Fetch với Bearer token tự động
├── packages/
│   └── shared/               # Thư viện hợp đồng dữ liệu dùng chung (@snote/shared)
├── DOCS/                     # Toàn bộ tài liệu quy chuẩn kỹ thuật & checklist
└── docker-compose.yml        # Điều phối Container PostgreSQL 16 cục bộ"""
    )

    # =========================================================================
    # CHƯƠNG 3: THIẾT KẾ CƠ SỞ DỮ LIỆU & RÀNG BUỘC TOÀN VẸN
    # =========================================================================
    add_h1("CHƯƠNG 3: THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DESIGN)")

    add_h2("3.1. Các Nguyên tắc Thiết kế CSDL Cốt lõi")
    add_p("Hệ thống cơ sở dữ liệu SNOTE được xây dựng trên PostgreSQL 16 theo các tiêu chuẩn kỹ thuật nghiêm ngặt:")
    add_bullet("Định danh bằng Khóa chính UUID v4: Toàn bộ bảng sử dụng khóa chính UUID ngẫu nhiên (gen_random_uuid()), loại bỏ hoàn toàn nguy cơ quét đoán tuần tự ID (Enumeration Attack) và chuẩn bị sẵn sàng cho việc phân tán dữ liệu.", "1. ");
    add_bullet("Cách ly dữ liệu Multi-Tenant (Anti-IDOR): Mọi thực thể nghiệp vụ bắt buộc phải gắn kèm trường user_id tham chiếu đến users(id). Khi truy vấn, backend luôn ép buộc điều kiện WHERE user_id = :currentUserId.", "2. ");
    add_bullet("Cơ chế Xóa mềm (Soft Delete): Áp dụng trường deleted_at TIMESTAMPTZ NULL cho toàn bộ các thực thể quan trọng (notes, tasks, subjects, projects, schedule_events). Sinh viên không bao giờ bị mất tài liệu khi thao tác nhầm.", "3. ");
    add_bullet("Chuẩn hóa Thời gian UTC: Mọi trường ngày giờ được lưu trữ dưới dạng TIMESTAMPTZ (UTC). Ứng dụng tự động chuyển đổi sang múi giờ người dùng (mặc định Asia/Ho_Chi_Minh) khi hiển thị trên giao diện.", "4. ");

    add_h2("3.2. Ràng buộc Bất biến Chống 'Note Rác' (Core Anti-Junk Constraint)")
    add_callout(
        "RÀNG BUỘC KỸ THUẬT CỐT LÕI TẠI MỨC CƠ SỞ DỮ LIỆU VÀ APPLICATION:\n\n"
        "Trong các bảng 'notes' và 'tasks', hệ thống thiết lập ràng buộc CHECK:\n"
        "    CHECK (subject_id IS NOT NULL OR project_id IS NOT NULL)\n\n"
        "Ý nghĩa: Một ghi chú hoặc công việc học tập bắt buộc phải gắn liền với ít nhất một Môn học hoặc một Đồ án cụ thể. "
        "Hệ thống kiên quyết ngăn chặn việc tạo ra các ghi chép vô định hình trôi nổi, từ đó giải quyết triệt để vấn đề 'kho note rác'.",
        "LUẬT BẤT BIẾN CHỐNG NOTE RÁC"
    )

    add_h2("3.3. Từ điển Dữ liệu Chi tiết các Bảng Chính (Data Dictionary)")
    add_p("Hệ thống quản lý 11 bảng thực thể chính với các mối quan hệ chặt chẽ:")

    db_tables_summary = [
        ("Tên Bảng (Table)", "Mục đích Lưu trữ", "Khóa Chính & Quan hệ Chính", "Đặc tính Kỹ thuật"),
        ("users", "Hồ sơ tài khoản sinh viên & quản trị viên", "id UUID, email UNIQUE", "Bcrypt password hash, role (STUDENT, ADMIN), status, timezone."),
        ("refresh_tokens", "Token làm mới phiên đăng nhập an toàn", "id UUID, userId FK", "Lưu SHA-256 token_hash, thời hạn expires_at, thu hồi revoked_at."),
        ("semesters", "Học kỳ học tập của sinh viên", "id UUID, userId FK", "is_current, status (ACTIVE, COMPLETED, ARCHIVED), academic_year."),
        ("subjects", "Môn học thuộc học kỳ", "id UUID, userId FK, semesterId FK", "code, credits, lecturer, color hex code, status."),
        ("projects", "Đồ án / Bài tập lớn", "id UUID, userId FK, subjectId FK", "startDate, dueDate, status (PLANNED, ACTIVE, ON_HOLD, COMPLETED)."),
        ("project_members", "Thành viên tham gia đồ án nhóm", "id UUID, (projectId, userId) UNIQUE", "role (OWNER, ADMIN, MEMBER, VIEWER), status (ACCEPTED, PENDING)."),
        ("notes", "Ghi chú bài giảng, đề cương ôn tập", "id UUID, userId FK, subjectId/projectId", "noteType (6 loại), title, content (Markdown), isPinned, isArchived."),
        ("tasks", "Công việc, hạn nộp bài tập, todo", "id UUID, userId FK, subjectId/projectId", "status (TODO, IN_PROGRESS, DONE), priority (LOW..URGENT), dueDate."),
        ("schedule_events", "Lịch học, lịch thi, sự kiện định kỳ", "id UUID, userId FK, semesterId/subjectId", "eventType (CLASS, EXAM, DEADLINE), startTime, endTime, recurrence."),
        ("resource_shares", "Chia sẻ tài nguyên cá nhân hoặc public", "id UUID, ownerId FK, shareToken UNIQUE", "targetType, accessLevel (VIEW, EDIT), isPublic, expiresAt."),
        ("backup_records", "Nhật ký xuất và sao lưu dữ liệu", "id UUID, userId FK", "fileName, fileSize, checksum (SHA-256) xác minh tính toàn vẹn.")
    ]
    add_styled_table(db_tables_summary[0], db_tables_summary[1:], [1.3, 2.0, 1.6, 1.4])

    add_h2("3.4. Chiến lược Đánh Chỉ mục Tối ưu Hiệu năng (Composite Indexing)")
    add_p(
        "Nhằm đảm bảo tốc độ phản hồi API dưới 50ms ngay cả khi sinh viên tích lũy hàng nghìn ghi chú và bài tập qua 4-5 năm học, "
        "PostgreSQL schema được trang bị các Composite Indexes chuyên biệt:"
    )
    add_bullet("Bảng notes: Đánh chỉ mục @@index([userId, subjectId, deletedAt]) và @@index([userId, isPinned, deletedAt]) giúp tải ngay lập tức các ghi chú được ghim và lọc ghi chú theo môn học mà không tốn chi phí Table Scan.", "• ");
    add_bullet("Bảng tasks: Đánh chỉ mục @@index([userId, status, deletedAt]) và @@index([userId, dueDate, deletedAt]) phục vụ truy vấn các công việc sắp đến hạn nộp cho bảng Kanban và thanh thông báo.", "• ");
    add_bullet("Bảng schedule_events: Đánh chỉ mục @@index([userId, startTime, endTime, deletedAt]) hỗ trợ vẽ sơ đồ Gantt Timeline và Lịch tuần 7 ngày với độ trễ gần như tức thì.", "• ");

    # =========================================================================
    # CHƯƠNG 4: CHI TIẾT CÁC PHÂN HỆ CHỨC NĂNG HỆ THỐNG
    # =========================================================================
    add_h1("CHƯƠNG 4: CHI TIẾT CÁC PHÂN HỆ NGHIỆP VỤ & TÍNH NĂNG NỔI BẬT")

    add_h2("4.1. Phân hệ Xác thực & Phân quyền Đa tầng (Auth & RBAC)")
    add_p(
        "Hệ thống xác thực được xây dựng theo mô hình **Stateless JWT kết hợp State-managed Refresh Token**:"
    )
    add_bullet("Access Token: Thời hạn 15 phút, được ký bằng thuật toán HS256, truyền qua Authorization Header dạng Bearer token.", "• ");
    add_bullet("Refresh Token: Được lưu trong HttpOnly Cookie có cờ an toàn SameSite=Lax, Secure=true, ngăn chặn 100% các cuộc tấn công đánh cắp phiên qua mã độc XSS.", "• ");
    add_bullet("Cơ chế Phân quyền (RBAC): Hệ thống phân định rõ hai vai trò người dùng:", "• ");
    add_bullet("Vai trò STUDENT: Sinh viên có toàn quyền quản lý dữ liệu học tập cá nhân, mời bạn bè vào đồ án nhóm và sử dụng AI Copilot.", "  - ", 1);
    add_bullet("Vai trò ADMIN: Quản trị viên hệ thống có thêm quyền truy cập phân hệ Giám sát Hệ thống /status, xem xét tài nguyên máy chủ, độ trễ database và danh sách tài khoản.", "  - ", 1);

    add_h2("4.2. Không gian Làm việc Học thuật Hợp nhất (Academic Workspace)")
    add_p(
        "Thay vì bắt sinh viên phải nhảy qua lại giữa hàng loạt trang web rời rạc, SNOTE tiên phong xây dựng trang "
        "Academic Workspace (/workspace) làm trung tâm điều phối mọi hoạt động học tập. Trang tổng hợp tích hợp sẵn 3 Tab điều hướng chính:"
    )
    add_bullet("Tab Ghi chú (Notes): Xem bài giảng với bộ lọc học kỳ, môn học, tag và 5 chế độ hiển thị.", "• ");
    add_bullet("Tab Công việc (Tasks): Theo dõi tiến độ bài tập lớn, deadline tuần này và trạng thái hoàn thành.", "• ");
    add_bullet("Tab Lịch trình (Schedule): Thời khóa biểu tuần và sơ đồ Gantt thời gian thực.", "• ");
    add_p(
        "Thanh lọc đa chiều (Unified Filter Bar) trên đỉnh màn hình cho phép người dùng lọc đồng thời dữ liệu của cả 3 tab "
        "chỉ bằng một thao tác chọn Môn học hoặc Học kỳ."
    )

    add_h2("4.3. Phân hệ Quản lý Ghi chú Chuyên sâu (Advanced Notes)")
    add_p("Phân hệ ghi chú được trang bị các tính năng chuyên biệt cho môi trường đại học:")
    add_bullet("6 Phân loại Bài ghi (NoteType): Bài giảng lý thuyết (LECTURE), Báo cáo thực hành (LAB_REPORT), Đề cương ôn thi (EXAM_PREP), Nhật ký đồ án (PROJECT_LOG), Biên bản họp nhóm (MEETING_MINUTES), và Ghi chú chung (GENERAL).", "• ");
    add_bullet("Trình soạn thảo & Hiển thị Markdown chuẩn GitHub: Hỗ trợ cú pháp bôi đậm, in nghiêng, trích dẫn, bảng biểu, danh sách công việc (task lists) và khối mã nguồn lập trình có đánh dấu màu sắc.", "• ");
    add_bullet("5 Chế độ Xem Đa dạng (5 View Modes): GRID View, COMPACT BENTO View, SPLIT View, KANBAN View, và LIST View.", "• ");
    add_bullet("Tính năng Chuyển Note thành Task 1-Click: Trực tiếp bóc tách đầu việc cần làm từ bài giảng và tạo công việc mới mà không cần copy paste thủ công.", "• ");

    add_h2("4.4. Phân hệ Quản lý Công việc & Tiến độ (Tasks & Productivity)")
    add_bullet("Bảng điều khiển Kanban & Danh sách Todo: Kéo thả chuyển trạng thái công việc mượt mà giữa TODO, IN_PROGRESS, DONE.", "• ");
    add_bullet("Phân cấp Mức độ Ưu tiên (TaskPriority): 4 mức LOW, MEDIUM, HIGH, URGENT có biểu tượng và màu sắc nổi bật.", "• ");
    add_bullet("Hiệu ứng Ăn mừng Tương tác (Canvas Confetti): Khi sinh viên hoàn thành một công việc khó hoặc bài tập lớn, hệ thống tự động bắn pháo hoa vi mô tạo cảm giác thỏa mãn và duy trì động lực học tập.", "• ");
    add_bullet("Thống kê Tiến độ Trực quan: Tỷ lệ hoàn thành công việc theo từng môn học được tính toán tự động và hiển thị dưới dạng thanh tiến độ phần trăm.", "• ");

    add_h2("4.5. Phân hệ Lịch trình & Sơ đồ Gantt Timeline Thời gian thực")
    add_p(
        "Điểm đột phá của SNOTE nằm ở việc hiện thực hóa thành công **Sơ đồ Gantt Timeline chuyên sâu** (/workspace?tab=schedule):"
    )
    add_bullet("Cột Danh sách Cố định bên trái (Sticky Left Table): Hiển thị tên bài tập, môn học, mức độ ưu tiên, người phụ trách và trạng thái.", "• ");
    add_bullet("Không gian Timeline Cuộn mượt mà: Thanh Gantt được tính toán tọa độ tự động theo ngày bắt đầu (startDate) và ngày đến hạn (dueDate). Cột 'Hôm nay' (Today) được tô điểm màu sắc nổi bật giúp định vị tức thì thời điểm hiện tại.", "• ");
    add_bullet("Tooltip Tương tác Chi tiết: Rê chuột vào từng thanh công việc trên Gantt hiển thị đầy đủ thông tin deadline, thời gian còn lại và mô tả chi tiết.", "• ");
    add_bullet("Chuyển đổi Linh hoạt: Người dùng có thể chuyển đổi qua lại giữa dạng Lịch tuần 7 ngày truyền thống và Sơ đồ Gantt Timeline chỉ bằng một cú nhấp chuột.", "• ");

    # Embed Figure 1 & 2
    img1_path = os.path.join(os.path.dirname(__file__), "DOCS", "temp", "image_128.png")
    img2_path = os.path.join(os.path.dirname(__file__), "DOCS", "temp", "image_129.png")
    if os.path.exists(img1_path):
        add_figure(img1_path, "Hình 4.1: Thiết kế Giao diện Sơ đồ Gantt Timeline tương tác thời gian thực và quản lý lịch học tập SNOTE")
    if os.path.exists(img2_path):
        add_figure(img2_path, "Hình 4.2: Minh họa kiến trúc Luồng điều phối và Quản lý Thời gian biểu Sinh viên")

    add_h2("4.6. Không gian Đồ án & Làm việc Nhóm (Project Collaboration)")
    add_bullet("Quản lý Đồ án theo Môn học: Mỗi đồ án có thể gắn với một môn học hoặc đứng độc lập trong học kỳ.", "• ");
    add_bullet("Mời Bạn học cùng Nhóm: Chủ sở hữu (Owner) có thể mời bạn cùng lớp tham gia đồ án thông qua Email hoặc User ID.", "• ");
    add_bullet("Phân chia Vai trò Rõ ràng: Hỗ trợ các vai trò OWNER (toàn quyền), ADMIN (quản trị), MEMBER (thực hiện công việc), VIEWER (chỉ xem tài liệu).", "• ");
    add_bullet("Phân công Công việc (Task Assignees): Giao việc cụ thể cho từng thành viên trong nhóm, giúp trưởng nhóm theo dõi sát sao tiến độ đồ án.", "• ");

    add_h2("4.7. Trợ lý Trí tuệ Nhân tạo Toàn cục (Floating AI Copilot & AI Chat)")
    add_p(
        "SNOTE tích hợp Trợ lý AI học thuật thông minh, hoạt động ở hai hình thức linh hoạt:"
    )
    add_bullet("Floating AI Copilot (Hộp thoại AI Nổi Siêu gọn): Nằm ở góc dưới cùng bên phải màn hình, không chiếm diện tích làm việc. Kích hoạt tức thì từ mọi trang thông qua phím tắt toàn cục Ctrl + J hoặc click chuột.", "• ");
    add_bullet("Trang AI Chat Toàn màn hình (/ai-chat): Không gian chuyên dụng cho các phiên thảo luận chuyên sâu, hỏi đáp đề cương môn học dài hạn.", "• ");
    add_bullet("3 Chế độ Prompt Học thuật Tối ưu sẵn: 1. Trích xuất Công việc (Extract Todo); 2. Dự đoán Đề thi & Câu hỏi Ôn tập; 3. Tóm tắt Ý chính Bài giảng.", "• ");

    add_h2("4.8. Tìm kiếm Toàn cục (Global Search) & Chia sẻ An toàn (Resource Shares)")
    add_bullet("Tìm kiếm Siêu tốc với Ctrl + K: Hộp thoại tìm kiếm toàn cục mở nhanh từ bất cứ đâu, hỗ trợ tìm kiếm chéo theo từ khóa nội dung kết hợp bộ lọc Môn học, Thẻ (Tags), Trạng thái và Độ ưu tiên.", "• ");
    add_bullet("Chia sẻ Tài nguyên Linh hoạt: Cho phép sinh viên chia sẻ Ghi chú hoặc Công việc cho bạn bè qua Email cá nhân hoặc sinh Mã liên kết Công khai (Public Share Link với URL bí mật /share/:token). Người nhận có thể xem hoặc chỉnh sửa tùy theo quyền hạn được cấp (VIEW hoặc EDIT).", "• ");
    add_bullet("Sao lưu & Khôi phục Đa cấp độ: Hỗ trợ xuất dữ liệu ra định dạng Markdown chuẩn hoặc toàn bộ hệ thống ra file JSON có kèm chữ ký số SHA-256 Checksum, đảm bảo không thể bị can thiệp hay sửa đổi giả mạo.", "• ");

    # =========================================================================
    # CHƯƠNG 5: HIỆN THỰC HÓA BẢO MẬT & GIÁM SÁT HỆ THỐNG
    # =========================================================================
    add_h1("CHƯƠNG 5: HIỆN THỰC HÓA BẢO MẬT & QUAN SÁT HỆ THỐNG (OBSERVABILITY)")

    add_h2("5.1. Pipeline Cứng hóa Bảo mật Backend (Security Hardening)")
    add_p("Hệ sinh thái API của SNOTE được bảo vệ toàn diện qua 6 tầng phòng thủ nghiêm ngặt:")
    add_bullet("Helmet HTTP Headers: Tự động thiết lập Content-Security-Policy, HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY và ẩn hoàn toàn header nhận diện X-Powered-By.", "1. ");
    add_bullet("CORS Whitelist Ngặt nghèo: Chỉ cho phép nguồn gốc Frontend hợp lệ (http://localhost:5173) thực hiện gọi API kèm gửi cookie credentials.", "2. ");
    add_bullet("Giới hạn Tần suất (Rate Limiting): Áp dụng 10 requests / 15 phút cho các endpoint xác thực (chống vét cạn Brute-force mật khẩu) và 100 requests / 1 phút cho toàn bộ API thông thường.", "3. ");
    add_bullet("Băm Mật khẩu Bcrypt Salt 12: Sử dụng giải thuật Blowfish cipher với chi phí cost = 12, đảm bảo an toàn tuyệt đối ngay cả khi cơ sở dữ liệu bị lộ lọt.", "4. ");
    add_bullet("Phòng chống Lỗ hổng IDOR: 100% các câu lệnh truy vấn dữ liệu tại tầng Service và Repository đều kiểm tra ràng buộc quyền sở hữu userId hoặc kiểm tra bảng phân quyền chia sẻ resource_shares.", "5. ");
    add_bullet("Zod Fail-Fast Configuration & DTO Validation: Kiểm tra toàn bộ biến môi trường (.env) ngay khi khởi động server; nếu thiếu biến bắt buộc, tiến trình lập tức dừng lại kèm thông báo lỗi rõ ràng. Mọi DTO đầu vào của HTTP requests đều được validate chặt chẽ trước khi chuyển tiếp vào tầng nghiệp vụ.", "6. ");

    add_h2("5.2. Hệ thống Ghi nhật ký Siêu tốc & Truy vết Phân tán (Pino Logger & Tracing)")
    add_p(
        "Nhằm đảm bảo khả năng bảo trì và vận hành chuẩn mực, SNOTE tích hợp **Pino Logger** – thư viện logging có tốc độ nhanh nhất trong hệ sinh thái Node.js:"
    )
    add_bullet("Log JSON có cấu trúc: Tự động ghi nhận timestamp, log level, module context và error stack trace.", "• ");
    add_bullet("Truy vết Phân tán với x-request-id: Pino-HTTP middleware tự động gán một mã định danh duy nhất (UUID) cho mỗi request đi vào hệ thống. Mọi log phát sinh xuyên suốt vòng đời xử lý request đều mang cùng mã ID này, giúp kỹ sư lập tức khoanh vùng nguyên nhân lỗi.", "• ");
    add_bullet("Cơ chế Tự động Che giấu Dữ liệu Nhạy cảm (Redaction): Cấu hình Pino tự động bôi đen (redact) các trường nhạy cảm như password, token, authorization, snote_refresh_token trước khi xuất log, ngăn chặn rò rỉ dữ liệu người dùng.", "• ");

    add_h2("5.3. Danh mục API Endpoints Tiêu biểu của Hệ thống")
    api_catalog = [
        ("Phân hệ (Module)", "Phương thức & Endpoint", "Quyền hạn (Auth)", "Mô tả Chức năng Nghiệp vụ"),
        ("Auth", "POST /api/auth/register", "Public", "Đăng ký tài khoản sinh viên mới, kiểm tra trùng lặp email."),
        ("Auth", "POST /api/auth/login", "Public (Rate limited)", "Đăng nhập, cấp JWT Access Token và HttpOnly Refresh Token."),
        ("Auth", "POST /api/auth/refresh", "Public (Cookie)", "Cấp mới Access Token khi hết hạn mà không cần đăng nhập lại."),
        ("Auth", "PUT /api/auth/change-password", "Bearer Token", "Đổi mật khẩu an toàn, xác minh mật khẩu cũ và băm Bcrypt 12."),
        ("Semesters", "GET /api/semesters", "Bearer Token", "Lấy danh sách tất cả học kỳ của sinh viên hiện tại kèm thống kê môn học."),
        ("Semesters", "POST /api/semesters", "Bearer Token", "Tạo học kỳ mới, thiết lập cờ học kỳ hiện tại (isCurrent)."),
        ("Subjects", "GET /api/subjects?semesterId=...", "Bearer Token", "Lấy danh sách môn học theo học kỳ kèm mã môn, số tín chỉ, giảng viên."),
        ("Notes", "GET /api/notes?subjectId=...", "Bearer Token", "Truy vấn danh sách ghi chú theo môn học, hỗ trợ lọc theo thẻ và ghim."),
        ("Notes", "POST /api/notes", "Bearer Token", "Tạo ghi chú mới (bắt buộc subjectId || projectId), Markdown content."),
        ("Tasks", "GET /api/tasks", "Bearer Token", "Lấy toàn bộ công việc, lọc theo trạng thái, độ ưu tiên hoặc môn học."),
        ("Tasks", "PATCH /api/tasks/:id/status", "Bearer Token", "Cập nhật nhanh trạng thái công việc (TODO -> IN_PROGRESS -> DONE)."),
        ("Schedule", "GET /api/schedule/unified", "Bearer Token", "Lấy dữ liệu lịch trình hợp nhất phục vụ Lịch tuần & Sơ đồ Gantt."),
        ("Search", "GET /api/search/global?q=...", "Bearer Token", "Tìm kiếm toàn cục đa thực thể (Notes, Tasks, Projects, Events)."),
        ("Shares", "POST /api/shares", "Bearer Token", "Chia sẻ tài nguyên (Note/Task) cho bạn học hoặc tạo link công khai."),
        ("Backup", "GET /api/backup/export?format=json", "Bearer Token", "Xuất toàn bộ cơ sở dữ liệu cá nhân ra file JSON kèm SHA-256."),
        ("AI", "POST /api/ai/chat", "Bearer Token", "Gửi prompt xử lý bài giảng đến Trợ lý AI (Tóm tắt, Trích xuất việc)."),
        ("Health", "GET /api/health/status", "Admin Guard (403)", "Kiểm tra độ trễ DB, uptime máy chủ và bộ nhớ RAM đang sử dụng.")
    ]
    add_styled_table(api_catalog[0], api_catalog[1:], [1.1, 2.1, 1.4, 1.7])

    # =========================================================================
    # CHƯƠNG 6: KẾT QUẢ NGHIỆM THU, KIỂM THỬ & SO SÁNH
    # =========================================================================
    add_h1("CHƯƠNG 6: ĐÁNH GIÁ KẾT QUẢ, KIỂM THỬ & SO SÁNH GIẢI PHÁP")

    add_h2("6.1. Kết quả Kiểm thử Toàn diện Hệ thống")
    add_p("Dự án đã trải qua các đợt nghiệm thu kỹ thuật khắt khe với kết quả đạt 100% chuẩn mực:")
    test_results = [
        ("Hạng mục Kiểm thử", "Công cụ / Lệnh Kiểm tra", "Kết quả Thực tế", "Trạng thái"),
        ("Kiểm tra Kiểu dữ liệu Tĩnh", "npm run type-check (TypeScript Strict)", "0 lỗi type trên toàn bộ Backend, Frontend và Shared packages.", "ĐẠT 100%"),
        ("Đóng gói Bản dựng Production", "npm run build (Vite Rollup Bundler)", "Biên dịch thành công toàn bộ bundle frontend và backend.", "ĐẠT 100%"),
        ("Toàn vẹn Cơ sở Dữ liệu & Schema", "npx prisma validate & seed execution", "11 mô hình bảng quan hệ khởi tạo thành công, seed dữ liệu mẫu 0 lỗi.", "ĐẠT 100%"),
        ("Bảo mật API & Xác thực Token", "Kiểm thử Login, Expired Token, IDOR", "Chặn 100% truy cập trái phép, cookie HttpOnly hoạt động hoàn hảo.", "ĐẠT 100%"),
        ("Kiểm thử Giao diện & Tương tác", "Trải nghiệm trên màn hình Desktop & Laptop", "Dark/Light mode mượt mà, Gantt timeline cuộn trơn tru, phím tắt Ctrl+J, Ctrl+K tức thì.", "ĐẠT 100%")
    ]
    add_styled_table(test_results[0], test_results[1:], [1.6, 2.0, 2.0, 0.8])

    add_h2("6.2. Bảng So sánh SNOTE với các Nền tảng Hiện nay")
    comparison_data = [
        ("Tiêu chí Đánh giá", "SNOTE (Dự án)", "Notion", "Obsidian", "Google Keep / Apple Notes"),
        ("Thiết kế chuyên biệt cho Sinh viên", "Có (Học kỳ, Môn học, Tín chỉ, Lịch thi, Deadline)", "Không (Chung chung, phải tự dựng)", "Không (Phải tự cài plugin)", "Không (Chỉ có ghi chú tự do)"),
        ("Cơ chế Triệt tiêu 'Note rác'", "Bắt buộc gắn Môn học/Đồ án qua DB Constraints", "Không (Tự do tạo trang)", "Không (Tự do tạo file)", "Không (Dễ tạo hàng trăm note rác)"),
        ("Sơ đồ Gantt Timeline Thời gian thực", "Tích hợp sẵn trực quan trong Lịch trình", "Có (Yêu cầu trả phí hoặc cấu hình DB)", "Không (Cần cài thêm plugin bên ngoài)", "Không hỗ trợ"),
        ("Trợ lý AI Tích hợp Sẵn", "AI Copilot nổi (Ctrl+J) hỗ trợ trích xuất bài tập, đề thi", "Có (Tính năng trả phí bản quyền)", "Không (Cần cấu hình API key cá nhân)", "Không có hoặc chỉ gợi ý đơn giản"),
        ("Chi phí Bản quyền & Tính riêng tư", "Mã nguồn mở, dữ liệu thuộc sở hữu sinh viên", "Trả phí hàng tháng cho tính năng cao cấp", "Miễn phí cục bộ, trả phí đồng bộ", "Miễn phí nhưng dữ liệu nằm trên đám mây"),
        ("Thời gian Làm quen & Sử dụng", "Dưới 3 phút, giao diện tối ưu luồng học tập", "Mất nhiều ngày học cú pháp và setup", "Mất nhiều tuần tìm kiếm plugin phù hợp", "Ngay lập tức nhưng nhanh chán do thiếu tính năng")
    ]
    add_styled_table(comparison_data[0], comparison_data[1:], [1.3, 1.4, 1.3, 1.2, 1.2])

    # =========================================================================
    # CHƯƠNG 7: KẾT LUẬN & HƯỚNG PHÁT TRIỂN TIẾP THEO
    # =========================================================================
    add_h1("CHƯƠNG 7: KẾT LUẬN & LỘ TRÌNH PHÁT TRIỂN")

    add_h2("7.1. Kết luận Đồ án")
    add_p(
        "Dự án **SNOTE – Second Brain cho Sinh viên Đại học** đã hiện thực hóa thành công một giải pháp công nghệ toàn diện, "
        "kết hợp hài hòa giữa nền tảng phi AI vững chắc và trí tuệ nhân tạo thông minh. Hệ thống đã giải quyết thấu đáo bài toán phân mảnh "
        "dữ liệu học tập, triệt tiêu hoàn toàn vấn nạn 'ghi chú rác' thông qua các ràng buộc kỹ thuật có kỷ luật, và cung cấp một bộ công cụ "
        "trực quan giúp sinh viên kiểm soát trọn vẹn tiến độ đồ án, bài tập lớn và lịch thi cử."
    )
    add_p(
        "Mã nguồn dự án được xây dựng theo chuẩn mực kỹ thuật cao cấp nhất: Type-safety tuyệt đối với TypeScript Strict Mode, "
        "kiến trúc Modular Monolith phân tầng độc lập, giao tiếp Frontend-Backend đồng bộ qua thư viện hợp đồng dùng chung, "
        "và quy trình đóng gói tự động hóa 1-Click giúp triển khai trên mọi môi trường một cách dễ dàng."
    )

    add_h2("7.2. Lộ trình Tích hợp Trí tuệ Nhân tạo Dài hạn (AI Roadmap)")
    add_p("Lộ trình nâng cấp công nghệ AI của SNOTE được hoạch định qua 4 giai đoạn chiến lược:")
    ai_roadmap = [
        ("Giai đoạn", "Tên Giai đoạn", "Mục tiêu Kỹ thuật & Nghiệp vụ"),
        ("AI v1 (Hiện tại)", "Tóm tắt & Trích xuất Todo", "Tóm tắt bài giảng dài thành ý chính; bóc tách danh sách đầu việc cần làm; đề xuất câu hỏi ôn thi trọng tâm."),
        ("AI v2 (Kế tiếp)", "Liên kết Ngữ nghĩa & Q&A (RAG)", "Áp dụng Vector Embeddings (pgvector) để tự động liên kết các ghi chú cùng chủ đề; hỏi đáp trực tiếp trên kho bài giảng của sinh viên."),
        ("AI v3 (Mở rộng)", "Sinh Flashcards & Đề thi Thử", "Tự động sinh bộ thẻ ghi nhớ thông minh (Flashcards) theo phương pháp lặp lại ngắt quãng (Spaced Repetition); sinh đề thi thử trắc nghiệm có chấm điểm."),
        ("AI v4 (Hoàn thiện)", "Trợ lý Lập Lịch Ôn thi Tối ưu", "Phân tích mức độ khó của môn học, khối lượng kiến thức và deadline để tự động lập thời gian biểu ôn tập tối ưu cho kỳ thi cuối kỳ.")
    ]
    add_styled_table(ai_roadmap[0], ai_roadmap[1:], [1.2, 1.8, 3.4])

    # =========================================================================
    # PHỤ LỤC: HƯỚNG DẪN KHỞI CHẠY NHANH DỰ ÁN (QUICK START)
    # =========================================================================
    add_h1("PHỤ LỤC: HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH NHANH (QUICK START)")
    add_p("Dự án hỗ trợ khởi chạy tự động hóa trên máy mới chỉ với các bước đơn giản:")
    add_bullet("Bước 1: Khởi động Docker Desktop và mở terminal tại thư mục gốc SNOTE/.", "• ");
    add_bullet("Bước 2 (Khởi tạo 1-Click tự động): Chạy script setup.bat (trên Windows) hoặc ./setup.sh (trên macOS/Linux). Script sẽ tự động cài đặt toàn bộ dependencies, sao chép file .env, khởi chạy container PostgreSQL 16 và áp dụng Prisma migrations kèm seed dữ liệu.", "• ");
    add_bullet("Bước 3 (Khởi chạy ứng dụng): Chạy câu lệnh duy nhất 'npm run dev' để khởi động song song Backend API (Port 4000) và Frontend SPA (Port 5173).", "• ");
    add_bullet("Bước 4 (Đăng nhập trải nghiệm): Mở trình duyệt tại http://localhost:5173 và đăng nhập bằng tài khoản mẫu:", "• ");
    add_bullet("Tài khoản Sinh viên: sinhvien@snote.edu.vn / Mật khẩu: Sinhvien@123", "  - ", 1);
    add_bullet("Tài khoản Quản trị viên: admin@snote.edu.vn / Mật khẩu: Admin@123", "  - ", 1);

    # Save Document
    output_filename = "BAO_CAO_DU_AN_SNOTE.docx"
    try:
        doc.save(output_filename)
        print(f"Comprehensive report generated successfully: {output_filename}")
    except PermissionError:
        fallback_filename = "BAO_CAO_DU_AN_SNOTE_MOI.docx"
        doc.save(fallback_filename)
        print(f"File '{output_filename}' dang duoc mo trong Microsoft Word.")
        print(f"-> Da luu ban moi (da bo ten truong o moi trang) vao: {fallback_filename}")

if __name__ == "__main__":
    create_report()
