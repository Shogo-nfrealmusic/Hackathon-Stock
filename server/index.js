import { encode, decode } from "gpt-tokenizer"; // decode を追加
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";


dotenv.config();

// OpenAIの設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

// CORSの設定を明示的に追加
app.use(
  cors({
    origin: "http://localhost:3000", // フロントエンドのURLを指定
    methods: ["GET", "POST"], // 許可するHTTPメソッド
    allowedHeaders: ["Content-Type"], // 許可するHTTPヘッダー
  })
);

const upload = multer({ storage: multer.memoryStorage() });

app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    console.log("File received:", req.file);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const textContent = req.file.buffer.toString("utf-8");
    console.log("Extracted text content length:", textContent.length);

    // トークン数を計算
    const tokens = encode(textContent);
    const maxTokens = 120000; // トークン制限
    console.log("Extracted text token count:", tokens.length);

    // トークン数が制限を超えている場合、切り詰める
    let trimmedTextContent = textContent;
    if (tokens.length > maxTokens) {
      console.log("Trimming text to fit within token limit.");
      const trimmedTokens = tokens.slice(0, maxTokens);
      trimmedTextContent = decode(trimmedTokens); // トークンをデコードして文字列に変換
    }

    const prompt = `
      You are an investment analyst.
      Analyze the following 10-K report text and decide if an investor should invest in this company or not.
      Return only:
      1) Score: one of (-1, 0, 1)
      2) Reason: a short reason (1-2 sentences).

      10-K report content:
      ${trimmedTextContent}
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });
      
      console.log("Full OpenAI response object:", response);
      
      // choices 配列と message の中身を詳細に確認
      console.log("Choices[0]:", response.choices[0]);
      console.log("Message in Choices[0]:", response.choices[0]?.message);
      
      // message.content を安全に取得
      const fullText = response.choices[0]?.message?.content;
      if (!fullText) {
        throw new Error("Response does not contain valid message content in choices[0].message.content");
      }
      
      console.log("Extracted content from response:", fullText);
      
      const scoreMatch = fullText.match(/Score:\s*(-1|0|1)/i);
      const reasonMatch = fullText.match(/Reason:\s*(.*)/i);
      
      const score = scoreMatch ? scoreMatch[1] : "0";
      const reason = reasonMatch ? reasonMatch[1] : "No reason found.";
      
      res.json({ score, reason });
  } catch (error) {
    console.error("Error during analysis:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
