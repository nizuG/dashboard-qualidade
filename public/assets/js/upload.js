const form = document.getElementById("uploadForm");
    const inputArquivos = document.getElementById("arquivos");
    const resultado = document.getElementById("resultado");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const arquivos = inputArquivos.files;

      if (!arquivos.length) {
        resultado.textContent = "Selecione pelo menos um arquivo CSV.";
        return;
      }

      const formData = new FormData();

      for (const arquivo of arquivos) {
        formData.append("arquivos", arquivo);
      }

      resultado.textContent = "Enviando arquivos...";

      try {
        const response = await fetch("/api/importar-csv", {
          method: "POST",
          body: formData
        });

        const data = await response.json();

        resultado.textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        console.error(error);
        resultado.textContent = "Erro ao enviar arquivos: " + error.message;
      }
    });
