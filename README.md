# 🎓 Web Trả Bài Từ Vựng Tiếng Anh - Unit 1: Life Story We Admire

Ứng dụng web trắc nghiệm và ôn luyện từ vựng Tiếng Anh lớp 12 mới (Global Success) - **Unit 1: Life Story We Admire**, được số hóa toàn bộ từ 5 trang tài liệu học tập (từ phần I đến phần VIII).

Ứng dụng được thiết kế tối ưu, có thể **đưa thẳng lên GitHub và deploy lên GitHub Pages hoàn toàn miễn phí** với 0 chi phí duy trì backend!

---

## 🌟 Tính Năng Nổi Bật

1. **Trắc nghiệm đa dạng (Quiz Modes)**:
   - 🇬🇧 ➔ 🇻🇳 Tiếng Anh sang nghĩa Tiếng Việt (kèm phiên âm IPA & loại từ).
   - 🇻🇳 ➔ 🇬🇧 Nghĩa Tiếng Việt sang Tiếng Anh.
   - ✨ **Dạng từ (Word Family)**: Hỏi biến thể danh từ, động từ, tính từ, trạng từ (vd: *admire ➔ admiration, admirable*).
   - 🔗 **Cụm từ & Giới từ (Collocations / Prepositions)**: Ôn tập giới từ đi kèm như *volunteer to V*, *be based on*, *devote to*, *operate on*, *pass away*, v.v.
   - 📝 **Điền từ vào ngữ cảnh**: Câu ví dụ thực tế minh họa ý nghĩa từ.
   - 🎧 **Luyện nghe & chọn từ**: Tích hợp phát âm audio chuẩn US/UK qua Web Speech API.

2. **Chế độ Luyện tập vs Thi tính giờ**:
   - **Luyện tập tự do**: Xem ngay giải thích chi tiết sau từng câu, không áp lực thời gian.
   - **Thi trắc nghiệm tính giờ**: Bấm giờ làm bài, chấm điểm thang 10 & tỷ lệ %, xem lại chi tiết bài làm.
   - **Luyện lại câu sai**: Nút 1-click để chỉ làm lại những từ đã trả lời sai.

3. **Thẻ ghi nhớ Flashcard 3D**:
   - Lật thẻ xem từ vựng, phiên âm IPA, ý nghĩa, câu ví dụ và từ họ hàng.
   - Đánh dấu "Đã thuộc" và "Chưa thuộc" để theo dõi tiến độ.

4. **Sổ tay từ điển số hóa đầy đủ**:
   - Tra cứu tức thì toàn bộ 116+ từ vựng từ trang 1 đến trang 5.
   - Phân loại rõ theo 8 mục:
     - *I. Getting Started*
     - *II. Language*
     - *III. Reading*
     - *IV. Speaking*
     - *V. Listening*
     - *VI. Writing*
     - *VII. Communication and Culture/CLIL*
     - *VIII. Looking Back*
   - Tính năng đánh dấu sao ⭐ các từ khó để ưu tiên ôn luyện.

5. **Âm thanh & Trải nghiệm người dùng**:
   - Hiệu ứng âm thanh bằng Web Audio API (ting khi đúng, buzz khi sai, nhạc ăn mừng điểm cao).
   - Hiệu ứng pháo hoa Confetti khi đạt điểm cao.
   - Phím tắt tiện lợi: Bấm phím **1, 2, 3, 4** hoặc **A, B, C, D** để chọn đáp án; phím **Enter** để chuyển câu; phím **Space** để lật thẻ flashcard.

---

## 🚀 Hướng Dẫn Đưa Lên GitHub & Deploy GitHub Pages

### 1. Đẩy mã nguồn lên GitHub Repo
Mở Terminal tại thư mục dự án và chạy:

```bash
# 1. Khởi tạo Git
git init

# 2. Thêm tất cả file
git add .

# 3. Tạo commit đầu tiên
git commit -m "feat: complete English quiz app Unit 1"

# 4. Đổi tên nhánh sang main
git branch -M main

# 5. Liên kết tới kho lưu trữ GitHub của bạn
git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/TÊN_KHO_LƯU_TRỮ.git

# 6. Đẩy mã nguồn lên
git push -u origin main
```

### 2. Kích hoạt GitHub Pages (Miễn phí)
Dự án đã được tích hợp sẵn file cấu hình tự động: `.github/workflows/deploy.yml` và cấu hình `base: './'` trong `vite.config.ts`.

1. Vào trang GitHub repo của bạn.
2. Bấm vào tab **Settings** (Cài đặt) ➔ Chọn menu **Pages** ở cột bên trái.
3. Trong mục **Build and deployment**, ở ô **Source**, chọn: **GitHub Actions**.
4. GitHub sẽ tự động build và chạy trang web của bạn tại địa chỉ:
   ```
   https://TÊN_GITHUB_CỦA_BẠN.github.io/TÊN_KHO_LƯU_TRỮ/
   ```

---

## 💻 Chạy Thử Trên Máy Tính (Localhost)

Yêu cầu máy tính có cài đặt [Node.js](https://nodejs.org/) (phiên bản 18 trở lên).

```bash
# 1. Cài đặt các thư viện cần thiết
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev
```

Mở trình duyệt truy cập `http://localhost:3000` để trải nghiệm ứng dụng.

---

## 🛠️ Công Nghệ Sử Dụng

- **React 19** & **TypeScript**
- **Vite** (Build cực nhanh, tối ưu hóa kích thước bundle)
- **Tailwind CSS** (Giao diện hiện đại, responsive hoàn hảo trên máy tính và điện thoại)
- **Lucide React** (Bộ icon trực quan, sắc nét)
- **Web Speech API** (Phát âm tiếng Anh tự nhiên không cần file âm thanh nặng)
- **Web Audio API** (Bộ tổng hợp âm thanh không phụ thuộc tài nguyên bên ngoài)
- **LocalStorage API** (Lưu trữ từ đánh dấu sao và lịch sử điểm số trên trình duyệt)

---

Chúc bạn ôn tập từ vựng thật tốt và đạt điểm cao trong các bài kiểm tra tiếng Anh! 🎉
