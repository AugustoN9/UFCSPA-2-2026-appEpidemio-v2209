 // Base de dados simulada do estudo
      const dataStore = {
        estrita: {
          todos: {
            a: 102,
            b: 203,
            c: 152,
            d: 813,
            casos: 254,
            controles: 1016,
          },
          sem_drc: {
            a: 45,
            b: 135,
            c: 102,
            d: 693,
            casos: 147,
            controles: 828,
          },
          com_drc: { a: 57, b: 68, c: 50, d: 120, casos: 107, controles: 188 },
        },
        qualquer: {
          todos: {
            a: 125,
            b: 420,
            c: 129,
            d: 596,
            casos: 254,
            controles: 1016,
          },
          sem_drc: { a: 60, b: 310, c: 87, d: 518, casos: 147, controles: 828 },
          com_drc: { a: 65, b: 110, c: 42, d: 78, casos: 107, controles: 188 },
        },
      };

      let chartPrevalenciaInstance = null;

      document.addEventListener("DOMContentLoaded", function () {
        initChart();
        atualizarDashboard();
      });

      function atualizarDashboard() {
        const janela = document.getElementById("selectJanela").value;
        const drc = document.getElementById("selectDRC").value;

        const currentData = dataStore[janela][drc];
        const { a, b, c, d, casos, controles } = currentData;

        // Cálculos estatísticos
        const prevCasosVal = ((a / casos) * 100).toFixed(1);
        const prevControlesVal = ((b / controles) * 100).toFixed(1);

        const or = (a * d) / (b * c);
        const seLnOR = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
        const icInf = Math.exp(Math.log(or) - 1.96 * seLnOR).toFixed(2);
        const icSup = Math.exp(Math.log(or) + 1.96 * seLnOR).toFixed(2);

        // Atualização da UI
        document.getElementById("kpiCasos").innerText = casos;
        document.getElementById("prevCasos").innerText =
          `Expostos: ${prevCasosVal}% (${a})`;

        document.getElementById("kpiControles").innerText = controles;
        document.getElementById("prevControles").innerText =
          `Expostos: ${prevControlesVal}% (${b})`;

        document.getElementById("kpiOR").innerText = or.toFixed(2);
        document.getElementById("kpiIC95").innerText = `[${icInf} - ${icSup}]`;

        // Rótulo de interpretação
        let interText = "Efeito Nulo";
        if (or > 1.2) interText = "Risco Aumentado";
        else if (or < 0.8) interText = "Efeito Protetor";
        document.getElementById("kpiInterpretation").innerText = interText;

        // Atualizar Células da Tabela 2x2
        document.getElementById("cell_a").innerText = a;
        document.getElementById("cell_b").innerText = b;
        document.getElementById("cell_c").innerText = c;
        document.getElementById("cell_d").innerText = d;

        document.getElementById("cell_exp_total").innerText = a + b;
        document.getElementById("cell_noexp_total").innerText = c + d;
        document.getElementById("cell_cases_total").innerText = casos;
        document.getElementById("cell_controls_total").innerText = controles;
        document.getElementById("cell_grand_total").innerText =
          casos + controles;

        // Atualizar Demonstração da Fórmula MathJax
        atualizarMathJaxFormula(a, b, c, d, or);

        // Atualizar Gráfico
        updateChart(prevCasosVal, prevControlesVal);
      }

      function atualizarMathJaxFormula(a, b, c, d, orVal) {
        const prod1 = (a * d).toLocaleString("pt-BR");
        const prod2 = (b * c).toLocaleString("pt-BR");
        const orFormatted = orVal.toFixed(2).replace(".", ",");

        const demoElement = document.getElementById("math-demo");
        if (demoElement) {
          demoElement.innerHTML = `$$\\text{OR} = \\frac{${a} \\times ${d}}{${b} \\times ${c}} = \\frac{${prod1}}{${prod2}} \\approx ${orFormatted}$$`;

          if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise([demoElement]);
          }
        }
      }

      function initChart() {
        const ctx = document
          .getElementById("chartPrevalencia")
          .getContext("2d");
        chartPrevalenciaInstance = new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Casos (Hipoglicemia)", "Controles (Sem Hipoglicemia)"],
            datasets: [
              {
                label: "% Exposto a Sulfonilureias",
                data: [0, 0],
                backgroundColor: ["#d93025", "#007ac1"],
                borderRadius: 8,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: { callback: (value) => value + "%" },
              },
            },
            plugins: {
              legend: { display: false },
            },
          },
        });
      }

      function updateChart(prevCasos, prevControles) {
        if (chartPrevalenciaInstance) {
          chartPrevalenciaInstance.data.datasets[0].data = [
            prevCasos,
            prevControles,
          ];
          chartPrevalenciaInstance.update();
        }
      }

      function resetFiltros() {
        document.getElementById("selectJanela").value = "estrita";
        document.getElementById("selectDRC").value = "todos";
        atualizarDashboard();
        Swal.fire({
          icon: "success",
          title: "Filtros Resetados",
          text: "A visualização retornou à análise bruta estrita (90 dias).",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      function mostrarConceitoEstudo() {
        Swal.fire({
          title: "<strong>Conceitos Epidemiológicos Chave</strong>",
          icon: "info",
          width: "700px",
          html: `
            <div class="text-start">
                <p><strong>1. Caso-Controle Aninhado (Nested Case-Control):</strong></p>
                <p class="small text-muted mb-2">Sorteia controles no momento exato (Risk Set) em que cada caso surge na coorte[cite: 2].</p>
                
                <p><strong>2. Caso-Coorte (Case-Cohort):</strong></p>
                <p class="small text-muted mb-2">Sorteia uma subcoorte de controles no início do estudo (Baseline), que servirá como grupo de comparação para múltiplos desfechos ao longo da pesquisa.</p>
                
                <p><strong>3. Vantagem dos Desenhos Aninhados em Coortes:</strong></p>
                <p class="small text-muted mb-0">Economizam recursos computacionais e humanos mantendo a alta validade interna e temporal da coorte original[cite: 2].</p>
            </div>
          `,
          confirmButtonText: "Entendi",
        });
      }