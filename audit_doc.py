# -*- coding: utf-8 -*-
import docx
doc = docx.Document("SNOTE_backup.docx")

print("=== DOCUMENT SECTIONS ===")
for idx, sec in enumerate(doc.sections):
    print(f"Section {idx}: top={sec.top_margin.pt}pt, bottom={sec.bottom_margin.pt}pt, left={sec.left_margin.pt}pt, right={sec.right_margin.pt}pt, page_w={sec.page_width.pt}pt, page_h={sec.page_height.pt}pt")

print("\n=== PARAGRAPHS AUDIT (First 35) ===")
for i in range(min(45, len(doc.paragraphs))):
    p = doc.paragraphs[i]
    t = p.text.strip()
    r = p.runs[0] if p.runs else None
    fname = r.font.name if r else None
    fsize = r.font.size.pt if (r and r.font.size) else None
    fbold = r.font.bold if r else None
    fcol = r.font.color.rgb if (r and r.font.color) else None
    print(f"P{i:2d} | al={str(p.alignment):10s} | sty={p.style.name:12s} | font={str(fname):12s} | sz={str(fsize):4s} | b={str(fbold):5s} | col={str(fcol):10s} | text={t[:45]}")
