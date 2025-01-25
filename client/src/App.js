import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null); // 選択されたファイル
  const [result, setResult] = useState(null); // 分析結果
  const [isLoading, setIsLoading] = useState(false); // ローディング状態

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // ファイルをセット
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true); // ローディング状態開始

    try {
      const response = await fetch("http://localhost:5001/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setResult(data); // 結果をセット
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file.");
    } finally {
      setIsLoading(false); // ローディング状態終了
    }
  };

  const scoreColor =
    result && result.score === "-1"
      ? "red"
      : result && result.score === "0"
      ? "orange"
      : "green";

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>10-K Investment Analyzer</h1>
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <input type="file" onChange={handleFileChange} />
        <button
          onClick={handleUpload}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Analyze
        </button>
      </div>
      {isLoading && (
        <p style={{ textAlign: "center", color: "gray" }}>Processing...</p>
      )}
      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2>Analysis Result</h2>
          <p style={{ color: scoreColor }}>
            <strong>Score:</strong> {result.score}
          </p>
          <p>
            <strong>Reason:</strong> {result.reason}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
