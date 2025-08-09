const express = require('express');
const pool = require('./database'); // Đảm bảo file database.js cấu hình đúng kết nối Postgres
const cors = require("cors");
const app = express();
app.use(express.json());

// Cho phép request từ mọi nguồn gốc, bạn có thể giới hạn lại nếu cần
app.use(cors());

const port = 5000;

app.post('/scrape_ads', async (req, res) => {
  const { data } = req.body;
  
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ hoặc không phải là một mảng' });
  }

  console.log(`Nhận được yêu cầu insert ${data.length} records.`);
  
  try {
    const results = [];
    const today = new Date();

    // Insert từng record trong mảng data
    for (const item of data) {
      // Tính time_running (số ngày)
      let time_running = null;
      if (item.start_date) {
        const startDate = new Date(item.start_date);
        const diffMs = today - startDate;
        const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        time_running = diffDays; // kiểu int
      }
      // Gán lại vào item
      item.time_running = time_running;

      const { query, values } = scrape_data(item);
      const result = await pool.query(query, values);
      results.push(result.rowCount);
    }
    
    const totalInserted = results.reduce((sum, count) => sum + count, 0);
    
    res.json({ 
      success: true, 
      message: `Đã xử lý xong ${results.length} records.`,
      insertedCount: totalInserted
    });
    
  } catch (err) {
    console.error('Lỗi khi insert data:', err);
    res.status(500).json({ error: 'Lỗi server: ' + err.message });
  }
});

app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});

// Hàm này tạo câu lệnh SQL và các giá trị từ một object item
// Nó đã xử lý tốt các giá trị null
const scrape_data = (data) => {
  const query = `
    INSERT INTO ads_scrape (
      brand, 
      status, 
      start_date, 
      time_running, 
      ads_format, 
      ads_platforms, 
      image_url, 
      video_url, 
      caption
    ) 
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    )
    ON CONFLICT DO NOTHING; -- Tùy chọn: Bỏ qua nếu có lỗi trùng lặp (ví dụ: dựa trên một unique constraint)
  `;
  
  const values = [
    data.brand || null,
    data.status || null,
    data.start_date || null,
    data.time_running || null,
    data.ads_format || null,
    data.ads_platforms || null,
    data.image_url || null,
    data.video_url || null,
    data.caption || null
  ];

  return { query, values };
};