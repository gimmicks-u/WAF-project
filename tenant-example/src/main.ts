import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Tenant example');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server on: http://localhost:${PORT}`);
});

export default app;
