# CHECKLIST TRIỂN KHAI TÍNH NĂNG NÂNG CAO NON-AI (SNOTE)

| ID | Nhiệm vụ kỹ thuật | File liên quan | Trạng thái | Tiêu chí nghiệm thu |
| :---: | :--- | :--- | :---: | :--- |
| **NA-01** | Khảo sát kiến trúc & Lập checklist tính năng nâng cao non-AI | `DOCS/non_ai_advanced_features_checklist.md` | [x] | Tuân thủ Điều 6 & Điều 7 RULES.md |
| **NA-02** | Nâng cấp Prisma Schema: Model `ResourceShare`, Composite Indexes, Cascade Policies | `backend/prisma/schema.prisma` | [x] | Thêm `ResourceShare`, đánh composite index tối ưu đa học kỳ |
| **NA-03** | Xây dựng Phân hệ Tìm kiếm Nâng cao Toàn cục (Global Search & Multi-criteria Filter) | `backend/src/modules/search/` & `frontend/src/components/common/GlobalSearchModal.tsx` | [x] | Phím tắt `Ctrl+K`, tìm kiếm chéo Notes, Tasks, Projects, Schedule theo text + môn + tag + status + priority + thời gian |
| **NA-04** | Xây dựng Phân hệ Chia sẻ & Phân quyền (Shares & Permissions: VIEW / EDIT / Public Link) | `backend/src/modules/shares/` & `frontend/src/components/common/ShareModal.tsx` | [x] | Chia sẻ Note/Task cho cá nhân (email) hoặc Public Link (`/share/:token`) + Phân quyền VIEW/EDIT |
| **NA-05** | Nâng cấp Phân hệ Sao lưu & Phục hồi Đa Cấp độ (Backup / Restore JSON + Markdown Export) | `backend/src/modules/backup/` & `frontend/src/features/settings/` | [x] | Export/Restore JSON, Xuất Markdown theo Môn/Học kỳ/Toàn bộ |
| **NA-06** | Rà soát & Củng cố Bảo mật Dữ liệu (Ownership Security, Soft-delete & Cascade verification) | Toàn bộ backend repositories & services | [x] | 100% endpoint kiểm tra quyền sở hữu và quyền chia sẻ an toàn |
| **NA-07** | Kiểm thử toàn diện hệ thống (TypeScript Strict Mode, Vite Production Build, API Endpoints) | Toàn hệ thống | [x] | `npm run type-check` và build Vite 0 lỗi (Pass 100%) |
| **NA-08** | Cập nhật `PROJECT_STRUCTURE_AND_MAP.md` và tài liệu tri thức `42_NON_AI_ADVANCED_FEATURES.md` | `DOCS/` | [x] | Tuân thủ 100% Điều 4 & Điều 6 RULES.md |
