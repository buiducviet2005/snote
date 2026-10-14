# Chọn bộ kỹ năng cho SNOTE

Khảo sát ngày 13–14/10/2026. Mục tiêu là cải thiện luồng học tập, quản trị lớp và chất lượng giao diện mà không làm agent hoặc runtime phình ra.

| Nguồn | Đánh giá cho SNOTE | Quyết định |
| --- | --- | --- |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Có dữ liệu tra cứu UX, accessibility, React và thiết kế; MIT. | Đã cài bản skill vào [`.agents/skills/ui-ux-pro-max`](../.agents/skills/ui-ux-pro-max/SKILL.md), giữ dữ liệu và script tra cứu, bỏ test nội bộ của repo nguồn. |
| [OpenAI skills](https://github.com/openai/skills) | Nguồn chính thức cho mẫu cấu trúc skill và skill bảo mật; một số mục phù hợp khi audit chuyên sâu. | Tham khảo cấu trúc, chưa sao chép nhiều skill vào dự án. |
| [Superpowers](https://github.com/obra/superpowers) | Mạnh về debug và xác minh, nhưng toàn bộ framework có nhiều quy trình/agent ngoài nhu cầu SNOTE. | Chọn nguyên tắc điều tra nguyên nhân và xác minh; không cài trọn bộ. |

Repo UI UX Pro Max được tải dưới dạng ZIP từ nhánh `main`, SHA-256 của ZIP: `CEF224248149A524D702F6D6E0BC74686F3427088103BBC18FE0FA413F0E6CA0`. HEAD của repo lúc kiểm tra: `7246805992a42b7bba37d4cac83b01416f0c6c44`. Skill giữ [giấy phép MIT](../.agents/skills/ui-ux-pro-max/LICENSE); đường dẫn ví dụ được đổi từ Claude plugin sang `.agents/skills/ui-ux-pro-max` cho Codex/SNOTE. Script tra cứu cần Python 3, hiện máy phát triển không có Python thực thi; agent có thể đọc `references/quick-reference.md` và dữ liệu tĩnh khi cần, không phải cài thêm runtime cho ứng dụng.

Agent phù hợp cho repo này là một agent kỹ sư sản phẩm làm theo lát cắt hành vi: xác định vai trò và nhu cầu, kiểm tra quyền ở API, cập nhật giao diện tương ứng, rồi chạy build/test. `RULES.md` giữ các ràng buộc kiến trúc; `AGENTS.md` chỉ dẫn đường tới skill cần thiết. Không thêm bộ agent phân tầng hay framework orchestration vào mã nguồn.
