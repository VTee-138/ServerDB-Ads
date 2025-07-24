const express = require('express');
const pool = require('./database');
const cors = require("cors");
const dayjs = require('dayjs');
const app = express();  
app.use(express.json())

// app.use(cors({
//   origin: 'http://localhost:5174',
// }));

const port = 5000;
// const scrape = "Select * from scrape_ads";

// app.get('/tuychon1', async (req, res) => {
//   try {
//     const result = await pool.query(scrape);
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

app.post('/scrape_ads', async (req, res) => {
  const { data } = req.body;
  
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ hoặc không phải là mảng' });
  }

  console.log('Received data:', data); // Kiểm tra dữ liệu "data"
  
  try {
    const results = [];
    
    // Insert từng record trong data array
    for (const item of data) {
      const { query, values } = scrape_data(item);
      const result = await pool.query(query, values);
      results.push(result.rowCount);
    }
    
    res.json({ 
      success: true, 
      message: `Đã insert thành công ${results.length} records`,
      insertedCount: results.reduce((sum, count) => sum + count, 0)
    });
    
  } catch (err) {
    console.error('Lỗi khi insert data:', err);
    res.status(500).json({ error: 'Lỗi server: ' + err.message });
  }
});

app.listen(port, () => {
  console.log(`Server chạy ở http://localhost:${port}`);
});

const scrape_data = (data) => {
  // Câu lệnh SQL với tham số placeholder
  const query = `
    INSERT INTO scrape_ads (
      brand, 
      status, 
      start_data, 
      time_running, 
      ads_format, 
      ads_platforms, 
      image_url, 
      video_url, 
      caption
    ) 
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    );
  `;
  
  // Tham số sẽ truyền vào
  const values = [
    data.brand || null,
    data.status || null,
    data.start_data || null,
    data.time_running || null,
    data.ads_format || null,
    data.ads_platforms || null,
    data.image_url || null,
    data.video_url || null,
    data.caption || null
  ];

  return { query, values };
};
