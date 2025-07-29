
    // Player sound controller
    const player = {
      audio: null,
      play: function (url, loop = false) {
        if (!this.audio) this.audio = new Audio(url);
        this.audio.src = url;
        this.audio.loop = loop;
        this.audio.play();
      },
      stop: function () {
        if (this.audio) {
          this.audio.pause();
          this.audio.currentTime = 0;
        }
      },
    };

    // Data arrays
    let m_dates = [], m_goals = [];
    let c_dates = [], c_goals = [];

    let filteredDates = [], filteredMGoals = [], filteredCGoals = [];

    let sliderMaxValue = 0;

    let sliderOne = document.getElementById("slider-1");
    let sliderTwo = document.getElementById("slider-2");
    const minGap = 3;

    // Load Messi data
    Papa.parse("https://raw.githubusercontent.com/Fernanda-Bley/Ejemplos-Ayudantias-IIC2026/refs/heads/main/messi_goals_per_year.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        m_dates = results.data.map(row => row["Year"]);
        m_goals = results.data.map(row => parseInt(row["Goals"]));
        initializeSlidersAndPlot();
      }
    });

    // Load CR7 data
    Papa.parse("https://raw.githubusercontent.com/Fernanda-Bley/Ejemplos-Ayudantias-IIC2026/refs/heads/main/cr_goals_per_year.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        c_dates = results.data.map(row => row["Year"]);
        c_goals = results.data.map(row => parseInt(row["Goals"]));
        initializeSlidersAndPlot();
      }
    });

    function initializeSlidersAndPlot() {
      if (m_dates.length === 0 || c_dates.length === 0) return;

      sliderMaxValue = Math.min(m_dates.length, c_dates.length);

      sliderOne.max = sliderMaxValue;
      sliderTwo.max = sliderMaxValue;
      sliderTwo.value = sliderMaxValue;

      updateSliders();
    }

    function filterDataBySlider(min, max) {
      filteredDates = m_dates.slice(min, max);
      filteredMGoals = m_goals.slice(min, max);
      filteredCGoals = c_goals.slice(min, max);
    }

    function plotData() {
      const trace1 = {
        type: "scatter",
        mode: "lines+markers",
        name: "Messi Goals",
        x: filteredDates,
        y: filteredMGoals,
        line: { color: "#17BECF" },
      };

      const trace2 = {
        type: "scatter",
        mode: "lines+markers",
        name: "CR7 Goals",
        x: filteredDates,
        y: filteredCGoals,
        line: { color: "#B22222" },
      };

      const layout = {
        title: "Goals Per Year",
        showlegend: true,
        xaxis: {
          title: "Year",
          range: [filteredDates[0], filteredDates[filteredDates.length - 1]],
        },
        yaxis: {
          title: "Goals",
          range: [
            Math.min(...filteredMGoals.concat(filteredCGoals)) - 5,
            Math.max(...filteredMGoals.concat(filteredCGoals)) + 5,
          ],
        },
      };

      Plotly.newPlot("myDiv", [trace1, trace2], layout);
    }

    function updateSliders() {
      if (parseInt(sliderTwo.value) - parseInt(sliderOne.value) <= minGap) {
        if (this === sliderOne) {
          sliderOne.value = parseInt(sliderTwo.value) - minGap;
        } else {
          sliderTwo.value = parseInt(sliderOne.value) + minGap;
        }
      }

      filterDataBySlider(parseInt(sliderOne.value), parseInt(sliderTwo.value));
      plotData();
    }

    function updateSlidersByFactors(zoomFactor, movingFactor) {
      const range = sliderMaxValue;
      const adjustedRange = range * ((100 - zoomFactor) / 100);
      const minSliderValue = parseInt((movingFactor / 100) * (range - adjustedRange));
      const maxSliderValue = parseInt(minSliderValue + adjustedRange);

      if (
        Math.abs(minSliderValue - sliderOne.value) > 2 ||
        Math.abs(maxSliderValue - sliderTwo.value) > 2
      ) {
        sliderOne.value = minSliderValue;
        sliderTwo.value = maxSliderValue;

        filterDataBySlider(minSliderValue, maxSliderValue);
        plotData();
      }
    }

    // Handle slider changes manually
    sliderOne.addEventListener("input", updateSliders);
    sliderTwo.addEventListener("input", updateSliders);

    // === PHONE ORIENTATION INTEGRATION ===
    let apertura = 0;
    const minAngle = 0;
    const maxAngle = 90;

// Update sliders based on angle
    function updateSlidersByAngle(angle) {
  // Clamp angle between min and max
  angle = Math.max(minAngle, Math.min(maxAngle, angle));

  // Map angle to zoom factor (less angle = more zoom)
  const zoomFactor = 100 - (angle / maxAngle) * 80; // Map 0-90 -> 100%-20%
  const movingFactor = (angle / maxAngle) * 100;     // Map 0-90 -> 0%-100%

  updateSlidersByFactors(zoomFactor, movingFactor);
}

      apertura = 0;

      // Realiza la estimación también cuando llegan nuevos datos sobre la apertura de la puerta.
      Protobject.Core.onReceived((data) => {
        apertura = data; // Actualiza el ángulo de apertura
        console.log(`${data}°`)
        updateSlidersByAngle(data)
        
      });
