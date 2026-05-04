import express from "express";
import cors from "cors";
import { prisma } from "./config/prisma.js";
import importacaoRoutes from "./routes/importacao.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api", importacaoRoutes);

app.get("/", (req, res) => {
  res.redirect("/home.html");
});

app.post("/teste-importacao", async (req, res) => {
  try {
    const importacao = await prisma.importacaoCsv.create({
      data: {
        nomeArquivo: "arquivo-teste.csv",
        competencia: "JAN/26",
        municipio: "SANTA CRUZ DO RIO PARDO",
      },
    });

    return res.status(201).json(importacao);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao criar importaÃ§Ã£o de teste",
    });
  }
});

app.get("/importacoes", async (req, res) => {
  try {
    const importacoes = await prisma.importacaoCsv.findMany({
      orderBy: {
        criadoEm: "desc",
      },
    });

    return res.json(importacoes);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao buscar importaÃ§Ãµes",
    });
  }
});

export default app;
