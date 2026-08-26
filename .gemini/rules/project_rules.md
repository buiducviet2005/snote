# QUY TẮC PHÁT TRIỂN DỰ ÁN SNOTE (PROJECT RULES)

1. Dự án gồm 6 bước lớn. Bước 3 lớn gồm đúng 7 bước nhỏ (3.1 đến 3.7).
2. Mọi chi tiết kỹ thuật của các bước nhỏ trong bước lớn đều phải được cập nhật vào `DOCS/`.
3. Tài liệu phải được sàng lọc, không chứa rác hội thoại, prompt phụ, link trích dẫn chatbot lộn xộn hay code trùng lặp.
4. Bắt buộc duy trì và cập nhật `DOCS/PROJECT_STRUCTURE_AND_MAP.md` mỗi khi thêm/sửa/xóa bất kỳ file, folder, chức năng hay công nghệ nào.
5. Duy trì bảng theo dõi tiến độ checklist (`step_3_setup_checklist.md`).
6. Kiến trúc Modular Monolith, PostgreSQL 16, Prisma ORM + Raw SQL, React Vite SPA Feature-based, ràng buộc chống note rác (`subject_id IS NOT NULL OR project_id IS NOT NULL`), anti-IDOR qua Service layer, Fail-Fast Zod config.
7. Không commit `.env`, `node_modules/`, `dist/`. Remote repo: `https://github.com/naverisme/snote.git`.
