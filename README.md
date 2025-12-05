<p align="center">
  <img src="app/favicon.ico" alt="Logo" width="200" />
</p>

# Super-Fast Groq AI Chat

Aplikasi chat AI modern yang menggunakan model **GPT-OSS 120B** (atau Llama 3.1) yang super cepat melalui **Groq API**, dibangun dengan **Next.js 16** dan tampilan yang familiar seperti aplikasi Chat AI pada umumnya.

## Teknologi

- **Next.js 16** - React framework dengan App Router (Diperbarui ke versi terbaru untuk keamanan)
- **TypeScript** - Menjamin type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Groq API** - Platform inferensi super cepat untuk model *open-source*
- **GPT-OSS 120B / Llama 3.1** - Model Bahasa Besar yang digunakan
- **Lucide React** - Ikon modern dan ringan

## Fitur

- 🎨 UI modern mirip Chat AI pada umumnya dengan dark theme
- 💬 Multiple chat conversations dengan sidebar
- 🤖 Integrasi dengan model AI melalui **Groq API** (GPT-OSS 120B)
- ⚡ **Kecepatan Respons Ekstrem** berkat Groq LPU
- 📱 Responsive design untuk mobile dan desktop
- ✨ Smooth animations dan transitions
- 🔄 Auto-scroll ke pesan terbaru
- ⌨️ Keyboard shortcuts (Enter to send, Shift+Enter for new line)

## Setup Project

### 1. Clone/Download Files

```bash
git clone https://github.com/username/groq-chat-ai.git
cd groq-chat-ai
```

### 2. Install Dependencies

```bash
npm install
# atau
yarn install
```

### 3. Environment Variables

Buat file `.env.local` di root project:

```bash
GROQ_API_KEY="gsk_token_api_groq_anda"
```

**⚠️ Penting:** Pastikan mengganti dengan token API Groq yang valid. Token Replicate yang lama tidak akan bekerja.

### 4. Run Development Server

```bash
npm run dev
# atau
yarn dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 🧠 AI Support Explanation

Aplikasi ini menggunakan **Groq API** untuk menyediakan respons AI yang sangat cepat (low-latency). Model yang digunakan saat ini adalah **GPT-OSS 120B** (atau model Llama 3.1, tergantung konfigurasi `api/chat/route.ts`).

* Model dipanggil dari endpoint `app/api/chat/route.ts`.
* Parameter default yang digunakan:
  * `max_tokens`: 512
  * `temperature`: 0.6
* **System Message**: Model dikontrol menggunakan system message (didefinisikan di `api/chat/route.ts`) untuk mengatur perilaku, kepribadian, dan **bahasa** yang digunakan AI (misalnya, Bahasa Indonesia atau Inggris).

## 📜 License

MIT License – bebas digunakan untuk proyek personal maupun komersial.