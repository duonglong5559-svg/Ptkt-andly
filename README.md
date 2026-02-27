# Ptkt-andly

Dashboard phân tích Crypto + Forex với bộ lọc kèo xác suất cao theo LLM.

## Điểm mới chính

- Thêm cặp `XAUUSD` từ thị trường Forex.
- Chuẩn hóa phân tích pivot/trend (PP/R1/S1/R2/S2, EMA, RSI, MACD, ATR).
- Chỉ hiển thị vùng hỗ trợ/kháng cự cứng (confidence cao, RR tốt, test count đủ).
- Tích hợp Liquidity Heatmap API (LiquiHeart) qua React Query, có fallback demo.
- Biểu đồ nến hỗ trợ zoom/pan (kéo dãn và kéo ngang).

## Chạy local

```bash
npm install
npm run dev
```

## Build và kiểm tra

```bash
npm run lint
npm run test
npm run build
```

## Cấu hình LiquiHeart API

Tạo file `.env`:

```bash
VITE_LIQUIHEAT_API_URL=https://your-liquiheart-endpoint.example/api/heatmap
```

Nếu chưa cấu hình biến này, app sẽ dùng dữ liệu fallback để demo thanh khoản.
