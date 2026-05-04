import app from "./app.js";
import { PORT } from "./config/server.config.js";

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
