/**
 * HOW TO PLAY + win/lose rules per chapter — bilingual vi/en.
 */

export const HOW_TO_PLAY = {
  1: {
    title: { vi: 'Cội Nguồn Đông Sơn', en: 'Dong Son Origins' },
    era: { vi: 'Văn Lang — Âu Lạc', en: 'Van Lang — Au Lac' },
    action: { vi: 'CHẠM 1 lần khi chấm xanh chạm vòng vàng', en: 'TAP once when the green dot hits the gold ring' },
    win: [{ vi: 'Chạm đúng đủ 8 nốt trên Trống Đồng', en: 'Hit all 8 notes on the Dong Son drum' }],
    lose: [{ vi: 'Miss quá 5 lần (bấm trượt hoặc bỏ lỡ nốt)', en: 'More than 5 misses (early/late tap or missed notes)' }],
    steps: [
      { vi: 'Chấm xanh lá rơi thẳng từ trên xuống.', en: 'Green dots fall straight from the top.' },
      { vi: 'Vòng vàng cố định giữa màn hình — đó là điểm cần trúng.', en: 'The gold ring stays in the center — that is your target.' },
      { vi: 'Chạm màn hình đúng 1 lần khi chấm chạm vòng (không bấm liên tục).', en: 'Tap once when the dot hits the ring (no spam tapping).' },
    ],
    mistakes: [
      { vi: 'Bấm sớm hoặc muộn', en: 'Tapping too early or late' },
      { vi: 'Bấm nhiều lần liên tiếp', en: 'Tapping repeatedly' },
      { vi: 'Để chấm rơi qua vòng mà không bấm', en: 'Letting a dot pass the ring untapped' },
    ],
  },
  2: {
    title: { vi: 'Sóng Cuộn Bạch Đằng', en: 'Bach Dang Rising Tide' },
    era: { vi: '938 — Ngô Quyền', en: '938 — Ngo Quyen' },
    action: {
      vi: 'CHẠM khi vạch trắng nằm trong vùng vàng/xanh trên thanh',
      en: 'TAP when the white marker is in the yellow/green zone on the bar',
    },
    win: [{ vi: 'Đóng đủ 10 cọc xuống sông Bạch Đằng', en: 'Drive all 10 stakes into the Bach Dang river' }],
    lose: [{ vi: 'Quá 2 thuyền giặc lọt qua (lần thứ 3 = thua ngay)', en: 'More than 2 enemy ships escape (3rd = instant loss)' }],
    steps: [
      { vi: 'Nhìn thanh ngang giữa màn — vạch trắng chạy qua lại.', en: 'Watch the horizontal bar — the white marker moves back and forth.' },
      { vi: 'Vùng sáng (vàng/xanh) ở giữa thanh là vùng đúng.', en: 'The bright (yellow/green) zone in the center is the sweet spot.' },
      { vi: 'Chạm màn hình khi vạch trắng nằm trong vùng sáng.', en: 'Tap when the white marker is inside the bright zone.' },
      {
        vi: 'Vừa đóng cọc vừa chú ý thuyền đỏ chạy ngang — đừng để lọt quá 2 lần.',
        en: 'Drive stakes while watching red ships — do not let more than 2 escape.',
      },
    ],
    mistakes: [
      { vi: 'Chạm khi vạch còn ở ngoài vùng sáng', en: 'Tapping outside the bright zone' },
      { vi: 'Bấm liên tục không nhìn thanh', en: 'Spam tapping without watching the bar' },
      { vi: 'Bỏ qua đếm Giặc lọt trên HUD', en: 'Ignoring the ships-escaped counter on the HUD' },
    ],
  },
  3: {
    title: { vi: 'Thời kỳ Đông A', en: 'Dong A Era' },
    era: { vi: 'Lý — Trần · Diên Hồng', en: 'Ly — Tran · Dien Hong' },
    action: { vi: 'BẤM nút ĐÁNH hoặc HÒA trước khi hết thanh giờ', en: 'PRESS FIGHT or PEACE before the timer runs out' },
    win: [{ vi: 'Chọn ĐÁNH ít nhất 6/8 lần', en: 'Choose FIGHT at least 6/8 times' }],
    lose: [
      { vi: 'Chọn HÒA quá 2 lần (lần thứ 3 HÒA = thua)', en: 'Choose PEACE more than 2 times (3rd PEACE = loss)' },
      { vi: 'Hoặc hết 8 vòng mà chưa đủ 6 lần ĐÁNH', en: 'Or finish 8 rounds with fewer than 6 FIGHT choices' },
    ],
    steps: [
      { vi: 'Đọc câu hỏi lịch sử trên màn hình.', en: 'Read the history question on screen.' },
      { vi: 'Chọn ĐÁNH (chiến đấu) hoặc HÒA (cầu hòa) bằng hai nút lớn.', en: 'Choose FIGHT (war) or PEACE (truce) with the two large buttons.' },
      { vi: 'Phải bấm trước khi thanh vàng đếm ngược hết.', en: 'You must choose before the gold countdown bar empties.' },
    ],
    mistakes: [
      { vi: 'Chạm giữa màn (không có tác dụng)', en: 'Tapping the middle of the screen (does nothing)' },
      { vi: 'Để hết giờ không chọn', en: 'Letting the timer expire without choosing' },
      { vi: 'Chọn HÒA quá nhiều lần', en: 'Choosing PEACE too often' },
    ],
  },
  4: {
    title: { vi: 'Lam Sơn & Tây Sơn', en: 'Lam Son & Tay Son' },
    era: { vi: '1407 — 1789', en: '1407 — 1789' },
    action: { vi: 'VUỐT ngón theo hướng mũi tên ↑ ↓ ← →', en: 'SWIPE in the arrow direction ↑ ↓ ← →' },
    win: [{ vi: 'Vuốt đúng đủ 12 mũi tên', en: 'Swipe correctly on all 12 arrows' }],
    lose: [{ vi: 'Miss quá 4 lần (vuốt sai hoặc quá chậm)', en: 'More than 4 misses (wrong or too slow swipe)' }],
    steps: [
      { vi: 'Mũi tên lớn xuất hiện giữa màn (↑ ↓ ← →).', en: 'A large arrow appears in the center (↑ ↓ ← →).' },
      { vi: 'Chạm màn → kéo ngón theo đúng hướng mũi tên → nhả.', en: 'Touch → drag in the arrow direction → release.' },
      { vi: 'Vuốt phải đủ xa (không chỉ chạm nhẹ).', en: 'Swipe far enough (not just a light tap).' },
    ],
    mistakes: [
      { vi: 'Chỉ chạm (tap) thay vì vuốt', en: 'Tapping instead of swiping' },
      { vi: 'Vuốt ngược hoặc chéo hướng', en: 'Swiping the wrong or diagonal direction' },
      { vi: 'Vuốt quá ngắn', en: 'Swipe too short' },
    ],
  },
  5: {
    title: { vi: 'Mở Cõi Nam Tiến', en: 'Opening the South' },
    era: { vi: 'Gia Long — Minh Mạng', en: 'Gia Long — Minh Mang' },
    action: {
      vi: 'KÉO ngón nối các điểm theo thứ tự thời gian — tránh vùng bão xanh',
      en: 'DRAG to connect points in chronological order — avoid blue storms',
    },
    win: [
      {
        vi: 'Nối đủ 8 giai đoạn Nam tiến và giữ ngón tại Biển Đông để cắm cờ',
        en: 'Connect all 8 Nam Tien stages and hold at East Sea to plant the flag',
      },
    ],
    lose: [
      { vi: 'Dính bão quá 2 lần', en: 'Hit storms more than 2 times' },
      { vi: 'Hoặc nhả tay giữa đường / không giữ cờ cuối', en: 'Or release mid-path / fail the final flag hold' },
    ],
    steps: [
      {
        vi: 'Chạm điểm đầu (Thuận Hóa · 1306) — đọc thẻ giai đoạn rồi TIẾP TỤC.',
        en: 'Tap the first point (Thuan Hoa · 1306) — read the stage card then CONTINUE.',
      },
      {
        vi: 'Nối lần lượt từng điểm theo dòng thời gian Nam tiến (Bắc → Nam → biển đảo).',
        en: 'Connect each point in Nam Tien order (North → South → islands).',
      },
      {
        vi: 'Mỗi điểm có khoảng thời gian và tóm tắt đặc trưng — đọc để nắm luồng lịch sử.',
        en: 'Each point shows dates and a summary — read to follow the history flow.',
      },
      { vi: 'Tránh kéo qua vùng bão xanh.', en: 'Avoid dragging through blue storm zones.' },
      { vi: 'Đến Biển Đông (điểm cuối): giữ ngón ~1 giây để cắm cờ.', en: 'At East Sea (final point): hold ~1 second to plant the flag.' },
    ],
    mistakes: [
      { vi: 'Chạm từng điểm rời (tap) thay vì kéo', en: 'Tapping points individually instead of dragging' },
      { vi: 'Nhả tay giữa đường', en: 'Releasing finger mid-path' },
      { vi: 'Kéo xuyên qua vùng bão', en: 'Dragging through storm zones' },
    ],
  },
  6: {
    title: { vi: 'Điện Biên — Xe tăng 843', en: 'Dien Bien — Tank 843' },
    era: { vi: '1945 — 1975', en: '1945 — 1975' },
    action: {
      vi: 'Giai đoạn 1: chọn lane · Giai đoạn 2: bấm NHẢY khi nút sáng',
      en: 'Phase 1: pick lane · Phase 2: JUMP when the button glows',
    },
    win: [{ vi: 'Thu đủ 6 gạo vàng (G), né đủ 5 rào bằng xe tăng', en: 'Collect 6 rice (G), dodge 5 barriers with the tank' }],
    lose: [
      { vi: 'Tiếp tế: >3 lỗi hoặc hết giờ chưa đủ 6 gạo', en: 'Supply: >3 misses or time up before 6 rice' },
      { vi: 'Xe tăng: bỏ lỡ 1 rào (không bấm NHẢY kịp)', en: 'Tank: miss 1 barrier (no JUMP in time)' },
    ],
    steps: [
      { vi: 'Giai đoạn 1: chạm cột lane hoặc ◀ ▶ — thu chấm vàng (G), tránh đỏ (!).', en: 'Phase 1: tap lane columns or ◀ ▶ — collect gold G, avoid red (!).' },
      { vi: 'Giai đoạn 2: xe tự chạy, bạn không điều khiển hướng.', en: 'Phase 2: tank auto-runs, you do not steer.' },
      { vi: 'Khi nút vàng CHẠM ĐỂ NHẢY sáng → bấm 1 lần để nhảy qua rào.', en: 'When gold TAP TO JUMP glows → tap once to jump the barrier.' },
      { vi: 'Né đủ 5/5 rào trước hết đường = thắng.', en: 'Dodge 5/5 barriers before the end = win.' },
    ],
    mistakes: [
      { vi: 'Chạm ô xanh liên tục (phải chạm cột lane khác)', en: 'Tapping the same lane repeatedly (switch lanes)' },
      { vi: 'Bấm NHẢY khi nút xám (chưa tới rào)', en: 'Jumping when the button is gray (barrier not near)' },
      { vi: 'Không bấm khi nút vàng sáng', en: 'Not tapping when the gold button glows' },
    ],
  },
};
