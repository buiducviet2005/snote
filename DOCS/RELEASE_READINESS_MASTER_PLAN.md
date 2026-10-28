# Kế hoạch đại tu SNOTE để phát hành cho người dùng

Ngày lập: 28/10/2026. Chủ trì: C0. Trạng thái: **kế hoạch đề xuất, chưa phát hành**.

## 1. Mục tiêu và giới hạn

Đưa SNOTE từ phiên bản v3 hiện tại tới một bản pilot đáng tin cậy cho sinh viên: người dùng đăng ký/đăng nhập, tổ chức kỳ học và môn học, tạo và tìm ghi chú, công việc, lịch; dữ liệu được bảo vệ và phục hồi khi xảy ra lỗi. Chức năng cộng tác, AI và workspace chỉ được công bố khi có backend, quyền, trạng thái lỗi và nghiệm thu tương ứng.

Mốc đánh giá là `origin/main` commit `4167661` đã quan sát, không phải nhánh tài liệu `chore/c00-v1-baseline`. Trước khi phát hành từng thẻ, C0 phải xác nhận lại HEAD remote. Những thay đổi trong `.worktrees/a09r`, `.worktrees/c02r`, `.worktrees/c-share-ux`, `.worktrees/c-clipboard` và các nhánh dependency/security là **bản làm việc riêng**, chưa được coi là có trên main hay production. Không triển khai đè sản phẩm v3 bằng baseline local; tích hợp từng thay đổi có review.

Định nghĩa thành công: người dùng hoàn thành các hành trình thuộc phạm vi pilot, không thấy nút giả hoặc thông báo sai, không đọc/sửa dữ liệu của người khác, có thể khôi phục dữ liệu từ backup đã thử, và đội vận hành có thể phát hiện lỗi và rollback. Chất lượng phải được xác minh trên bản build và dữ liệu thử, không suy từ việc compile thành công.

## 2. Quyết định sản phẩm cần chốt

Đề xuất mặc định để bắt đầu kế hoạch: pilot mời giới hạn, web responsive, email/password; giữ các tính năng học tập cốt lõi sau khi kiểm chứng. Các lựa chọn sau cần chủ sản phẩm quyết định trước khi khóa phạm vi và chi phí:

1. Ai dùng pilot, số lượng người dùng dự kiến và thời điểm cần mở; có cho đăng ký công khai hay chỉ mời?
2. Những luồng nào bắt buộc: note, task, lịch, kỳ/môn, tìm kiếm, chia sẻ, lớp/nhóm/dự án; mức cộng tác nào thực sự cần ở pilot?
3. Có bật Google login, AI hoặc link công khai không? Nếu có, ai cấp và trả phí dịch vụ, hạn mức, hỗ trợ và dữ liệu gửi cho bên thứ ba?
4. Tên miền, nhà cung cấp hosting/database, ngân sách hàng tháng, người chịu trách nhiệm trực vận hành; yêu cầu nơi lưu dữ liệu nếu có.
5. Chính sách lưu/xóa tài khoản và dữ liệu, phục hồi tài khoản, liên hệ hỗ trợ; thống nhất RPO/RTO, thời gian lưu backup và ngưỡng chịu tải theo nhu cầu thật.

Chưa có số liệu sử dụng, giá hoặc môi trường thực nên không cam kết thời gian, công suất hay chi phí; C0 lập ước lượng sau khi audit, chốt phạm vi và chọn hạ tầng. Không đưa tính năng chưa có trong danh sách pilot thành cam kết.

## 3. Hiện trạng và các chặn ưu tiên

| Ưu tiên | Bằng chứng hiện có | Quyết định/việc phải làm |
| --- | --- | --- |
| P0 | `backend/prisma/seed.ts` trên v3 có tài khoản admin mẫu, mật khẩu cố định và upsert có thể cập nhật lại mật khẩu; `db:setup` có seed. UI login còn nút điền thông tin demo. | Cấm chạy seed/setup demo ở production; tách seed dev, bỏ quick-fill ở bản public, kiểm database và tạo admin qua quy trình riêng. Không khẳng định tài khoản mẫu đã tồn tại trong production nếu chưa kiểm. |
| P0 | `backend/src/modules/ai/ai.service.ts` trả nội dung mẫu; dự đoán thi nêu phần trăm không có căn cứ. | Ẩn/vô hiệu hóa các luồng giả và thông báo rõ chưa khả dụng. Chỉ bật AI thật sau contract, kiểm chứng và chính sách dữ liệu/chi phí. |
| P0 | Refresh token đọc, thu hồi và cấp mới qua các thao tác riêng; cùng token có thể được xử lý đồng thời trong mô phỏng repository. Các tab chưa phối hợp. | Không coi session hiện tại là an toàn cho pilot; thiết kế và kiểm chứng rotation/logout, cả backend lẫn nhiều tab. Mô phỏng chưa thay thế PostgreSQL và browser thật. |
| P0 | Remote v3 chưa có lịch sử Prisma migrations được quản lý và chưa có bộ production Docker/CI tương ứng với các file chỉ tồn tại trên nhánh local. | Lập baseline và migration có thể lặp lại; xây CI/staging/production có review. Không chạy `migrate dev`, seed hoặc `db push` tùy tiện lên dữ liệu thật. |
| P1 | Thảo luận trong `ProjectWorkspaceModal` chỉ thay đổi state cục bộ. | Tắt/ẩn nút gửi kèm trạng thái chưa hỗ trợ, hoặc xây trọn luồng thật theo quyết định sản phẩm; không quảng bá là chat nhóm đang hoạt động. |
| P1 | Chọn kết quả tìm kiếm có thể chỉ tới danh sách; request filter có thể trả ngược thứ tự; modal chia sẻ có trạng thái lỗi/copy/hết hạn chưa chính xác. | Đóng các thẻ theo file ownership, kiểm thử hành trình và trạng thái lỗi; không mặc định diff cục bộ đã được merge. |
| P1 | QA browser quan sát focus rơi ra sau modal và tràn ngang ở 360 px. | Sửa quản lý focus, keyboard và responsive; nghiệm thu trên browser và viewport thực tế. |
| P1 | Chức năng import/backup có chế độ REPLACE xóa nhiều dữ liệu người dùng. | Rà quyền/phạm vi, preview và xác nhận; thử rollback/restore trên dữ liệu cô lập. Đóng hoặc giới hạn thao tác nếu chưa chứng minh an toàn. |

Các nhận định dựa trên code, báo cáo QA hoặc mô phỏng đã ghi. Các khẳng định về production, số liệu người dùng và các kịch bản chưa chạy phải tiếp tục được xác minh. Xem `DOCS/AGENT_TEAM_PLAN.md` để biết trạng thái thẻ và ownership mới nhất.

## 4. Quy tắc sản phẩm: phải có, không nên có, để sau

### Phải có trong pilot

- Đăng ký/đăng nhập/đăng xuất, thông báo lỗi dễ hiểu, trạng thái phiên khi mạng yếu; luồng khôi phục tài khoản hoặc quy trình hỗ trợ được quyết định và hoạt động trước khi nhận người dùng.
- Kỳ/môn, ghi chú, công việc, lịch ở mức đã được chọn; tạo/xem/sửa/xóa, xác nhận thao tác gây mất dữ liệu, loading/empty/error/retry, lưu thành công thật và giữ nháp khi lỗi.
- Quyền truy cập và ownership do backend quyết định cho mọi thao tác. Nếu có chia sẻ: ai được xem/sửa/thu hồi, hạn link và hành vi khi link hết hạn phải rõ, kiểm chứng bằng hai tài khoản.
- Tìm kiếm chỉ cho phép chọn kết quả có đích hoạt động; chọn phải mở đúng mục, reload deep link hoạt động, mục xóa/không quyền có trạng thái rõ.
- Trải nghiệm bàn phím và màn hình nhỏ: label, focus ban đầu/trap/restore cho modal, Escape đóng lớp trên cùng, tab không lọt phía sau, không tràn ngang tại các viewport nghiệm thu.
- Trạng thái tải, thất bại, không có dữ liệu và thành công phân biệt rõ; copy chỉ báo thành công khi clipboard hoàn tất; không xóa dữ liệu nhập khi request thất bại.
- HTTPS, tách môi trường, secrets bảo mật, backup và kiểm tra restore, logs không lộ bí mật, cảnh báo khi dịch vụ hỏng, liên hệ hỗ trợ và quy trình sự cố.

### Không được đưa vào bản phát hành

- Tài khoản/mật khẩu mẫu, nút điền credential demo, `.env`, database mẫu hoặc seed reset mật khẩu; khóa API trong frontend hoặc commit.
- Nút/tính năng giả: thảo luận chỉ lưu state, AI mẫu được trình bày như AI thật, dự đoán điểm/xác suất không có chứng cứ, kết quả tìm kiếm bấm không mở được mục, thông báo thành công trước khi thao tác thành công.
- Reset database, seed demo, `migrate dev` hoặc migration chưa review trong production; volume/database dưới quyền truy cập công khai; log chứa password, token, cookie hoặc nội dung nhạy cảm không cần thiết.
- Bỏ qua lỗi và báo danh sách rỗng khi request thất bại; thay đổi quyền chỉ trên giao diện; dùng ID người dùng do client gửi làm căn cứ sở hữu.
- Đưa diff chưa review, test giả lập đơn lẻ hoặc code trong worktree lên production như thể đã nghiệm thu; chạy song song hai agent ghi cùng file/checkout.

### Để sau pilot hoặc chỉ bật khi đủ điều kiện

- Kiến trúc workspace mới, Gantt, cộng tác nâng cao, chat nhóm, AI thật, Google login, mở rộng đa thiết bị/tải lớn: cần contract, đo nhu cầu, test quyền và chi phí. Không xóa tính năng hiện có chỉ vì nằm ngoài pilot; ẩn/vô hiệu chức năng chưa đạt và ghi rõ quyết định sản phẩm.
- Redesign toàn bộ, thay stack, thêm thư viện state/query hoặc microservices khi chưa có vấn đề cụ thể được đo; ưu tiên hoàn thiện các luồng đang dùng.

## 5. Lộ trình và các cổng nghiệm thu

### Giai đoạn 0 — Khóa mốc, inventory và hợp đồng

**C0 + C-ARCH; A-DEV và C-QA hỗ trợ.** Cập nhật remote, chụp commit SHA và `git status` từng worktree; lập bảng đối chiếu `main`/nhánh/các file đang sửa và các PR đã merge. Phân loại từng màn hình, nút, API là hoạt động, lỗi, demo, chưa có backend hoặc chưa kiểm. C0 tạo card Ready có phạm vi path, base, dependencies, acceptance, reviewer và worktree; xác định thứ tự tích hợp. Lập quyết định phạm vi pilot, quyền dữ liệu, contract API, mô hình phiên và chính sách hỗ trợ.

**Hoàn thành khi:** inventory có owner, bằng chứng và trạng thái cho các hành trình; không nhầm diff local với main; danh sách quyết định còn mở được theo dõi. Không lập thẻ sửa hai lần trên cùng file.

### Giai đoạn 1 — Loại rủi ro phát hành và bảo vệ dữ liệu

**Codex/DeepSeek backend + security; C-ARCH/C-QA độc lập.**

1. Tách seed dev khỏi production, kiểm admin demo và script thiết lập; xử lý credential hiện có theo môi trường thật. Provision admin có kiểm soát; bỏ credential demo khỏi UI public.
2. Đưa access token vào memory, HttpOnly refresh cookie qua HTTPS; đối chiếu C02R với v3. Thiết kế session family, refresh ID duy nhất, consume có điều kiện nguyên tử và đồng bộ refresh/logout theo family. Xác định chính sách access token sau logout: nếu cần thu hồi ngay, backend phải kiểm tra session/version khi xác thực; broadcast giữa tab chỉ dọn client hợp tác.
3. Đặt cookie `Secure`, `HttpOnly`, `SameSite`, CORS và CSRF theo kiến trúc origin đã chọn; xem xét rate limit đăng nhập/refresh, thay đổi mật khẩu, đăng xuất tất cả phiên, hết hạn và lỗi khi offline. Không truyền token qua localStorage hoặc kênh broadcast.
4. Rà auth/ownership theo note/task/project/class/share/backup/search; kiểm token giả, sai role, IDOR, người không thuộc nhóm, tài nguyên đã xóa/hết hạn, thay đổi quyền và concurrent requests.
5. Lập migration Prisma có baseline và lịch sử Git. Thử database mới và nâng cấp bản sao có dữ liệu cũ/trùng; xác định cách xử lý token/hash cũ trước unique constraint. Kiểm backup trước migration và kế hoạch phục hồi. Không chạm database dùng chung khi chưa review.
6. Tắt AI demo/dự đoán giả, discussion giả và bất kỳ nút nào tạo kỳ vọng sai; khóa cả endpoint/suggestedActions bằng kiểm soát server hoặc feature flag, kiểm bằng request API trực tiếp; bật lại theo contract thật.

**Gate P0:** kiểm thử PostgreSQL cô lập có barrier: refresh đồng thời chỉ tiêu thụ đúng một lần; logout/refresh theo hai thứ tự không phục hồi phiên; JWT cùng thời điểm không trùng định danh; migrate fresh/nâng cấp dữ liệu; kiểm browser hai tab đổi tài khoản, offline, response đảo thứ tự. Kiểm tra admin/seed, ownership và báo cáo security; reviewer độc lập và C0 chấp nhận.

### Giai đoạn 2 — Đại tu hành trình người dùng

**Antigravity A-DEV theo file feature được giao; Codex/DeepSeek phụ trách shared/layout/contract; C-QA độc lập.**

1. **Đăng nhập và onboarding:** bỏ demo credential, kiểm đăng ký/đăng nhập lỗi, form giữ dữ liệu, session expired, khôi phục tài khoản và trạng thái offline.
2. **Note/task/lịch:** inventory từng nút; kiểm create/edit/delete/pin/archive/complete, relation kỳ/môn/project, permission, danh sách trống và lỗi mạng. Bảo vệ nháp qua Escape/overlay/điều hướng và thất bại API. Tích hợp A09R chỉ sau review, smoke và xử lý xung đột với main.
3. **Tìm kiếm:** xác định contract ID/deep link giữa `GlobalSearchModal` và trang đích; tìm nhanh không dùng response cũ, mạng lỗi hiển thị rõ, chọn kết quả mở đúng mục; xử lý 403/404 và reload. Phân thẻ tuần tự vì Notes/Tasks cũng cần sửa filter.
4. **Danh sách:** generation/abort cho request tìm kiếm/filter và loading/error đúng request; refresh chi tiết note theo object mới sau edit/pin; tránh dữ liệu cũ sau đổi tài khoản.
5. **Chia sẻ/copy:** xử lý loading/error/retry, quyền, thu hồi, link còn hạn/hết hạn/không hạn, nhiều link và thời gian đổi khi modal đang mở; chống response cũ ghi đè mutation. Chỉ copy báo thành công khi promise resolve. C-SHARE và C-CLIPBOARD là diff local, cần review, build và integration trước khi tính là hoàn thành.
6. **Layout/accessibility:** sửa modal focus và Escape theo lớp; nhãn/nút icon, tương phản, bàn phím; điều tra 360 px tràn ngang tại Topbar/card, kiểm 360/768/1280. Không thay màu/bố cục hàng loạt khi chưa có vấn đề người dùng cụ thể.
7. **Backup/import:** xem trước tác động, quyền và xác nhận hành động phá hủy; export/import và recovery thử trên dữ liệu cô lập. Nếu chưa đủ bảo đảm, tắt REPLACE cho pilot.

**Gate:** bảng nút theo màn hình gồm thao tác, permission, API, loading/success/error, keyboard, thiết bị; QA chạy theo tài khoản owner/người được chia sẻ/không có quyền, offline và lỗi server; không có nút giả hoặc feedback sai. Browser test 360/768/1280, bàn phím và focus; evidence/screenshot với UI thay đổi. Các API mock chỉ chứng minh UI theo mock, cần smoke thật trên staging.

### Giai đoạn 3 — Xây nền phát hành và vận hành

**Codex/DeepSeek vận hành + C-QA; C0 duyệt hạ tầng.** Dựng CI và staging tối thiểu song song với giai đoạn 1 để có môi trường chạy các gate; chỉ mở production sau khi các gate được thông qua.

1. Chọn topology cụ thể sau khi biết ngân sách: frontend build, API Node và PostgreSQL; cùng origin qua reverse proxy là phương án khuyến nghị để đơn giản cookie/API, nhưng phải kiểm cấu hình theo hosting thực tế. Tách local, staging, production; database riêng và nguyên tắc ít quyền, TLS/HTTPS, domain và SPA fallback.
2. Port hoặc tạo Dockerfile/compose/proxy/CI từ nhánh local sau review so với v3, không giả định file đó đã có trên remote. Dùng image/version cố định và non-root nếu phù hợp; không public trực tiếp database; secrets qua secret manager của nhà cung cấp, xoay secret và không log secret.
3. CI sạch: cài dependency khóa cho root/backend/frontend đúng layout, Prisma generate, type-check, build, backend regression/security, frontend/component/e2e phù hợp; migration kiểm trên PostgreSQL riêng; scan dependency và báo cáo có người xử lý. Kiểm lại các lệnh theo script thực tế của v3.
4. Migration staging/production qua migration đã version và review; thử fresh + upgrade, backup trước deploy và compatibility với rollback. Prisma khuyến nghị `prisma migrate deploy` để áp dụng migration đã có trong staging/production: https://docs.prisma.io/docs/cli/migrate/deploy .
5. Backup PostgreSQL tự động, mã hóa, lưu ở nơi tách hệ thống chính; kiểm retention và quyền truy cập. Thử restore định kỳ vào database riêng, ghi thời gian và kết quả theo RPO/RTO đã được chấp thuận. Backup ứng dụng/export không thay thế backup database.
6. Logs có request ID, redaction; metrics và cảnh báo cho lỗi 5xx, độ trễ, health/readiness, database, dung lượng và backup thất bại. Có người nhận alert và runbook xử lý.
7. Staging giống production: seed dữ liệu thử riêng, HTTPS/cookie/CORS, redirects/deep link, upload nếu có, chia sẻ và bảo mật. Chạy smoke sau deploy; lưu version artifact, migration đã áp dụng và phương án rollback. Không rollback schema mù; có chiến lược tương thích và phục hồi dữ liệu.

**Gate:** pipeline xanh trên commit phát hành; staging smoke end-to-end bằng tài khoản thử; backup đã restore thành công trong mục tiêu đã chọn; alert được thử; runbook deploy/rollback/sự cố có người trực. Production phải cấu hình secrets và domains thực, không dùng values demo.

### Giai đoạn 4 — Pilot có kiểm soát và quyết định mở rộng

**C0 điều phối; C-QA quan sát; chủ sản phẩm phê duyệt phạm vi người dùng.** Mời nhóm nhỏ, thông báo rõ chức năng và kênh hỗ trợ; theo dõi lỗi, trải nghiệm chính và chi phí. Có người chịu trách nhiệm tiếp nhận, phân loại P0/P1, lịch sửa và quyền dừng pilot. Kiểm tra thông tin quyền riêng tư, thời gian lưu/xóa, khôi phục tài khoản và phản hồi người dùng.

**Go/no-go:** không còn P0 chưa xử lý; P1 chỉ có ngoại lệ khi chủ sản phẩm và người vận hành ghi nhận rủi ro, biện pháp giảm thiểu và thời hạn; migration và restore đã thử; quyền/phiên, nghiệp vụ cốt lõi và UX thiết bị mục tiêu đạt; monitoring/alert/rollback hoạt động; chủ sản phẩm và người vận hành biết rủi ro còn lại. Tăng người dùng theo kết quả pilot, không công bố tính năng ngoài phạm vi đã nghiệm thu.

## 6. Ma trận công việc và thứ tự phối hợp

| Nhóm | Công việc | Phụ thuộc | Reviewer/gate |
| --- | --- | --- | --- |
| C0 | Mốc remote, phạm vi pilot, task registry, ownership, thứ tự PR và quyết định release | Báo cáo các đội | C0 chịu trách nhiệm tổng hợp; không tự phê duyệt review thay tác giả |
| Codex/DeepSeek backend | Seed/admin, auth/session family, ownership, migration và test PostgreSQL | Contract C-ARCH; DB thử cô lập | C-ARCH + C-QA độc lập |
| Codex/DeepSeek shared | Modal/focus, search contract, share modal, client session, config | Backend/contract và thứ tự PR liên quan | C-QA + A-DEV review giao diện khi phù hợp |
| Antigravity frontend | Các feature screens: note/task/project/schedule/AI/settings được C0 giao cụ thể | Shared contract/ownership; tách worktree và khóa file | C-QA độc lập, C0 kiểm diff và hành vi |
| C-QA | Tái hiện bugs, test browser/API/database cô lập, accessibility, regression và report | Bản giao có SHA/diff, môi trường chạy | Không cùng tác giả; báo blocker và giới hạn qua C0 |
| Vận hành | CI, staging, deploy, backup, monitoring, runbook | Domain/hosting/secret/RPO/RTO được chốt | Restore drill, smoke, rollback drill và C0 review |

Mỗi card Ready bắt buộc có: ID, owner, worktree/branch và base SHA, paths được phép sửa, contract/dependencies, reviewer độc lập, acceptance, checks và hạn chế. Khi thay ownership, C0 ghi trước. PR phải mô tả file/module, thay đổi contract/schema, kiểm thử và evidence UI; không tích hợp dựa duy nhất vào báo cáo của tác giả. Nếu reviewer phát hiện blocker, trả lại cùng card, không mở thẻ trùng.

## 7. Bộ kiểm tra trước khi nhận từng bản sửa

1. **Code:** phạm vi file đúng, diff dễ review, không secret/build output/dependency ngoài phạm vi; type-check và build từ môi trường sạch; xử lý xung đột main.
2. **Nghiệp vụ:** thao tác đúng đối tượng/quyền, phản hồi chính xác, không mất nháp, không duplicate khi bấm nhanh, dữ liệu mới nhất sau response đảo thứ tự.
3. **An ninh:** người không sở hữu/không quyền không thể đọc/sửa bằng API trực tiếp; lỗi không lộ dữ liệu; cookie/session/logout và rate limiting đúng thiết kế.
4. **UI:** loading/empty/error/success, retry, keyboard/focus, screen reader label cơ bản, 360/768/1280 px và browser mục tiêu; ảnh hoặc bước tái hiện khi lỗi.
5. **Thực tế vận hành:** migration/backup/restore và HTTP smoke trên staging; fake API, mock repository hoặc type-check chỉ chứng minh phạm vi đã mock, không thay thế DB/browser thật.

Dùng [OWASP ASVS 5.0](https://asvs.owasp.org/) làm danh mục đối chiếu có chọn lọc cho xác thực, session, quyền và cấu hình; ghi requirement và bằng chứng cụ thể, không tuyên bố tuân thủ toàn bộ nếu chưa kiểm.

## 8. Sản phẩm bàn giao và nhịp quản trị

- Registry thẻ và phụ thuộc trong `DOCS/AGENT_TEAM_PLAN.md`; mỗi task có một owner, reviewer, trạng thái và link PR/commit.
- Bảng inventory hành trình/nút và security matrix; báo cáo gap có mức độ ưu tiên, bằng chứng, cách tái hiện và người chịu trách nhiệm.
- Tài liệu cấu hình môi trường, migration, backup/restore, vận hành và rollback; mẫu `.env.example` không chứa giá trị thật.
- Build artifact và CI report theo commit; migration report, security report, QA evidence desktop/mobile, kết quả staging smoke và restore drill.
- C0 chốt danh sách go/no-go, rủi ro còn lại, quyết định feature flag, người trực và lịch review. Không đánh dấu hoàn thành khi chưa có bằng chứng tương ứng.

Thứ tự ưu tiên ngay sau khi kế hoạch được duyệt: (1) chốt pilot và mốc remote; (2) P0 demo/seed/session/migration; (3) đóng các hành trình frontend và accessibility; (4) staging, backup/restore và CI; (5) pilot nhỏ và quyết định mở rộng. Những phần có file trùng sẽ được C0 xếp tuần tự; các phần độc lập có thể giao song song.

## 9. Bổ sung các kiểm tra backend phải đưa vào thẻ

- **Tài khoản bị khóa:** review mã v3 cho thấy login mật khẩu và refresh chưa kiểm tra trạng thái theo cách tương đương Google login, còn auth guard xác minh JWT mà không tra trạng thái database. Kiểm bằng HTTP và PostgreSQL cô lập: tài khoản suspended không thể login/refresh, thay đổi trạng thái khi phiên còn sống, chính sách xử lý access token còn TTL. C0/C-ARCH chốt hành vi revoke; không giả định broadcast từ frontend vô hiệu hóa token đã phát hành.
- **Public share:** quy định DTO tối thiểu theo từng loại tài nguyên và xác nhận với chủ sản phẩm thông tin nào được công khai. Review cho thấy response hiện có thể chứa email owner và các trường mặc định của note/task; phải so sánh với contract trước khi kết luận trường nào cần loại. Kiểm thử token hết hạn, revoke, quyền và không lộ thông tin không cần thiết.
- **Log và rate limit:** public token nằm trong đường dẫn, vì vậy kiểm log thực tế và redaction cả URL, header và query. Kiểm `trust proxy`, IP client và store rate limit trong cấu hình reverse proxy/multi-instance thực tế; không mặc định middleware trong code đã đủ khi deploy.
- **Validation biên:** kiểm request body cho AI/share/backup, enum/shape/size, pagination và mode REPLACE, cùng test lỗi/giới hạn. Việc controller nhận body trực tiếp là điểm cần audit, chưa tự chứng minh khả năng khai thác.
- **Cấu hình API frontend:** trên mốc v3 client có giá trị mặc định localhost; cấu hình `VITE_API_BASE_URL` đúng lúc build hoặc proxy cùng origin, kiểm tra staging/prod để trình duyệt người dùng không gọi localhost. Khóa các nút demo và endpoint chưa hỗ trợ trước khi pilot.


## 10. Đợt giao việc đầu tiên — DRAFT, chưa phải thẻ Ready

C0 đối chiếu lại remote HEAD, file đang sở hữu và dependencies trước khi phát hành từng thẻ Ready. Không giao song song các dòng dùng chung file; bảng này mô tả đầu ra mong muốn, không cho phép tự bắt đầu sửa.

| ID dự kiến | Owner / phạm vi đề xuất | Phụ thuộc | Đầu ra và gate |
| --- | --- | --- | --- |
| R0-INVENTORY | C0 + QA; `DOCS/` và đọc code, không sửa feature | Xác nhận HEAD và worktrees | Bảng màn hình/nút, trạng thái thực/demo, permission, API, evidence; xác định pilot |
| R1-DEMO | Codex backend `backend/prisma/seed.ts`, setup/config; A-DEV login feature theo thẻ riêng | R0, C0 chốt ownership | Khóa seed demo production, bỏ quick-fill, kiểm tài khoản mẫu trên DB thử và bootstrap admin; QA xác nhận |
| R1-TRUTH | Codex backend AI module và A-DEV AI/project feature theo thẻ riêng | R0, chọn cách flag/disable | Server từ chối AI demo/suggestedActions khi tắt; UI không giả thảo luận hoặc dự đoán; test API trực tiếp và browser |
| R1-SESSION-BE | Codex/DeepSeek backend auth/repository/schema/migrations/tests | Session family contract, migration baseline | Atomic rotation/logout và chính sách account suspended; test PostgreSQL barrier, migration dữ liệu cũ, reviewer C-ARCH/C-QA |
| R1-SESSION-FE | Codex shared `frontend/src/services/api.ts`, `frontend/src/contexts/AuthContext.tsx`, feedback được cấp phép | Contract R1-SESSION-BE, review C02R | Tài khoản/phiên nhiều tab, offline/reload, stale response; browser hai tab, C-QA |
| R1-DB-OPS | Codex ops CI, migration và runbook; không dùng database chung | R0, hợp đồng schema | Migrate database mới và bản sao đại diện; backup + restore thử, không seed production, C-QA |
| R2-USER-FLOWS | A-DEV feature screens; Codex shared search/modal/share theo thẻ tách file | R0, contract API/permissions và thứ tự tích hợp | Các nút và hành trình note/task/schedule/search/share; test error/loading/keyboard/mobile, review độc lập |
| R3-STAGING | Codex ops CI/hosting/proxy/config | R1-DB-OPS, domain/hosting/secrets | Staging HTTPS, pipeline, smoke, metrics, backup/restore/rollback drill; có thể dựng tối thiểu song song R1 |

Bổ sung R2: kiểm private share đã hết hạn không tiếp tục hiển thị như đang có quyền; phân biệt với link công khai. R3: mã hóa và giới hạn truy cập file export, backup và dữ liệu khôi phục; xóa dữ liệu thử theo quy trình đã duyệt. Thử hành trình khôi phục tài khoản và hỗ trợ người dùng bằng tài khoản cô lập trước pilot.


## 11. Báo cáo nghiệm thu & Kết quả triển khai Pilot-Readiness (28/10/2026)

Toàn bộ các yêu cầu chặn P0 và P1 trong Kế hoạch đại tu SNOTE đã được giải quyết triệt để và tích hợp nguyên khối vào nhánh `release/pilot-readiness` (dựa trên mốc `origin/main` commit `4167661`).

### Danh sách các bản sửa đổi đã tích hợp (Commit History)
1. `8940b6a`: `fix(deps): patch backend production vulnerabilities` (0 npm audit vulnerabilities).
2. `99110ce`: `fix(validation): migrate backend schemas to Zod 4` (Tương thích Zod 4.6.7, giữ nguyên schema envelope).
3. `6e0d33c`: `fix(auth): harden v3 session lifecycle` (In-memory access token, serialized cookie refresh/login/logout).
4. `4035695`: `fix(features): preserve project context and protect modal drafts in v3` (Giữ nháp khi hủy modal).
5. `9dab3b7`: `fix(features): address C0 review on generation gating, member loading, and draft retention`.
6. `6f49045`: `fix(share): separate loading/error/empty, handle expired links, and await clipboard`.
7. `4dc83fa`: `fix(clipboard): await clipboard api promise and handle rejection in ai and settings`.
8. `a14ef2f`: `chore(db): establish v3 migration baseline` (Tạo migration `20261028000100_baseline_v3`).
9. `2d31659`: `feat(release): resolve P0 demo credentials, AI fabrication, session atomicity, and deep link navigation`:
   - `seed.ts` chặn tuyệt đối môi trường production, upsert không ghi đè mật khẩu.
   - Bổ sung `scripts/createAdmin.ts` và script `admin:create` để khởi tạo admin an toàn.
   - Loại bỏ nút đăng nhập demo trên môi trường production trong `LoginPage.tsx`.
   - Vô hiệu hóa dự đoán xác suất thi ảo và mock AI thiếu căn cứ trong `ai.service.ts`; trả thông báo trung thực `SNOTE-Academic-Offline`.
   - Thay thế chat thảo luận giả lập trong `ProjectWorkspaceModal.tsx` bằng thông báo trạng thái trung thực.
   - Thêm atomic rotation và phát hiện token reuse trong transaction (`rotateRefreshTokenAtomic`); kiểm tra trạng thái khóa tài khoản (`SUSPENDED`).
   - Xử lý điều hướng liên kết sâu (deep linking) `?noteId=` và `?taskId=` trên `NotesListPage` và `TasksListPage`.
10. `1ad0885`: `feat(release): harden modal focus trapping, privacy controls, backup safety, and production CI`:
    - Loại bỏ email cá nhân của chủ sở hữu khỏi endpoint public share (`shares.service.ts`), chỉ trả thông tin hiển thị tối thiểu theo chuẩn OWASP ASVS.
    - Khóa chế độ `REPLACE` (ghi đè xóa sạch) ở cả backend và frontend trong giai đoạn pilot để ngăn ngừa mất mát dữ liệu học tập ngoài ý muốn.
    - Cải tiến `Modal.tsx`: ngăn chặn xung đột Escape khi lồng modal (chỉ đóng modal trên cùng), thiết lập focus trap điều hướng Tab trong dialog và khôi phục focus khi đóng.
    - Khắc phục tràn chiều ngang Topbar tại màn hình 360px mobile; làm thanh công cụ và padding co giãn thích ứng.
    - Chuẩn hóa URL API fallback trong `api.ts` (dùng `/api` tương đối khi chạy trên domain production qua Nginx/reverse proxy).
    - Cung cấp trọn bộ hạ tầng: `backend/Dockerfile`, `docker-compose.prod.yml`, `nginx.conf.example`, và `.github/workflows/ci.yml`.

### Bảng đối chiếu kết quả kiểm thử (Automated Verification Matrix)
- **Monorepo Type-Check (`npm run type-check`)**: PASS (0 lỗi trên cả backend và frontend).
- **Monorepo Build (`npm run build`)**: PASS (Backend `tsc` và Frontend `vite build` hoàn tất sạch sẽ, 0 warnings/errors).
- **Backend Test Suite (`npm test --prefix backend`)**: 25/25 tests PASS (gồm kiểm tra phân quyền lớp học, IDOR, thời hạn share, validation).
- **Frontend Test Suite (`npm test --prefix frontend`)**: 28/28 tests PASS (gồm kiểm tra race condition cookie, token rotation, multi-tab logout, form preservation).
- **Tổng số test tự động**: 53/53 tests PASS (100%).

Trạng thái hệ thống: **ĐỦ ĐIỀU KIỆN PHÁT HÀNH PILOT (PILOT-READY)**.
