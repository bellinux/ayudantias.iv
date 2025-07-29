// Creando tonos que cambian con el tiempo

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let oscillator;
let gainNode;
const minFrequency = 10; // Frequencia inicial
const maxFrequency = 100; // Frecuencia final
const maxRampDuration = 10; // duración máxima (en segundos)


d3.csv("fastest_cars.csv").then(function(data) {
    const pairedData = data.map(d => ({
        label: `${d.Manufacturer} - ${d.Model}`,
        time: parseFloat(d.Time.trim()) // el tiempo estaba como texto, lo pasamos a int
    }));

    // Ordenar la data por velocidad
    const sortedData = pairedData.sort((a, b) => b.time - a.time);
    const top10Data = sortedData.slice(0, 10);
  
    const sortedLabels = top10Data.map(d => d.label); // Nombres
    const sortedTimes = top10Data.map(d => d.time); // Tiempos de arranque

   let plotData = [{
        x: sortedTimes, 
        y: sortedLabels, 
        type: 'bar',
        orientation: 'h',
        text: sortedLabels,
        textposition: 'inside',
        marker: {
            color: '#ff2800' 
        }
    }];

    let layout = {
        xaxis: { title: "Time (seconds)" },
        yaxis: { title: "Car Models", tickvals: sortedLabels.map((_, index) => `Car ${index + 1}`), ticktext: sortedLabels }, // Optional: Hide the actual labels
        showlegend: false
    };

    Plotly.newPlot('Cars', plotData, layout);
    
    const plotDiv = document.getElementById('Cars');
  // Acciones al estar sobre un valor del gráfico
   plotDiv.on('plotly_hover', function(data) {
        
        const index = data.points[0].pointIndex;
        const timeValue = sortedTimes[index];
     
        const minTime = Math.min(...sortedTimes);
        const maxTime = Math.max(...sortedTimes);

        const baseRamp = 0.1; 
        const dynamicRamp = maxRampDuration * (timeValue - minTime) / (maxTime - minTime);
        const rampDelay = 1;
     
     // Detenemos el sonido anterior
        if (oscillator) {
            oscillator.stop();
        }
     
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();

        oscillator.type = 'sawtooth'; // Es un tipo de tono que se puede ocupar ('square', 'sawtooth', or 'triangle')
        oscillator.frequency.setValueAtTime(minFrequency, audioContext.currentTime); 

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();

        // Delay para empezar el ruido
        oscillator.frequency.setValueAtTime(minFrequency, audioContext.currentTime + rampDelay);
        oscillator.frequency.exponentialRampToValueAtTime(maxFrequency, audioContext.currentTime + rampDelay + dynamicRamp);
    });

    // detiene el ruido
    plotDiv.on('plotly_unhover', function(data) {
        if (oscillator) {
            oscillator.stop(); 
            oscillator = null; 
        }
    });

});

// Transformando datos a notas musicales


// Función que transforma números a notas musicales

function midiToNoteName(midi) {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return note + octave;
}


d3.csv("A_year_of_pizza_sales_from_a_pizza_place_872_68.csv").then(function(data) {
    const salesPerMonth = {};

    data.forEach(function(row) {
        const date = new Date(row.date);
        const month = `${String(date.getMonth() + 1).padStart(2, '0')}`;
        const price = parseFloat(row.price);
        if (!salesPerMonth[month]) {
            salesPerMonth[month] = 0;
        }
        salesPerMonth[month] += price;
    });

    let months = Object.keys(salesPerMonth).sort();
    const totals = months.map(month => salesPerMonth[month]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    months = months.map(m => monthNames[parseInt(m) - 1]);

    const defaultColor = '#CF0F47';
    const highlightColor = '#FF0B55';

    let markerColors = Array(months.length).fill(defaultColor);

    const plotData = [{
    x: months,
    y: totals,
    mode: 'lines+markers',
    type: 'scatter',
    marker: { color: markerColors, size: 10 },
    line: { color: defaultColor }  
}];

    const layout = {
        xaxis: { title: 'Month' },
        yaxis: { title: 'Total Sales ($)' }
    };

    Plotly.newPlot('Pizza', plotData, layout);

    const boton = document.getElementById('button-64');
  // Se activa el plot con un botón externo
    boton.addEventListener('click', async function () {
    await Tone.start();
    console.log('Audio context started');

    const synth = new Tone.Synth().toDestination();

    // Definimos los mínimos y máximos
    const minSales = Math.min(...totals);
    const maxSales = Math.max(...totals);

    for (let i = 0; i < totals.length; i++) {
      // Redondeamos el valor
        const midiNote = Math.floor(48 + (totals[i] - minSales) / (maxSales - minSales) * (72 - 48));
        const note = midiToNoteName(midiNote);
        
        markerColors = Array(months.length).fill(defaultColor);
        markerColors[i] = highlightColor;

        Plotly.restyle('Pizza', { 'marker.color': [markerColors] });

        synth.triggerAttackRelease(note, "8n");

        await new Promise(res => setTimeout(res, 400));
    }
});
});


// Usandos tts (Text-To-Speech)

let personalizedVoice = null;

// Cargar voces al inicio
window.speechSynthesis.onvoiceschanged = () => {
  const voices = window.speechSynthesis.getVoices();
  personalizedVoice = voices.find(voice => voice.name === 'Microsoft Alvaro Online (Natural) - Spanish (Spain)');
};



// Para mapas más personalizados (Chile, Peru, ect.) 
// pueden ocupar topojson

const topojsonClient = window.topojson;

var width = 900;
var height = 500;

var svg = d3.select(".map")
    .attr("width", width)
    .attr("height", height);

var projection = d3.geoMercator()
    .scale(1)
    .translate([0, 0]);

var path = d3.geoPath().projection(projection);


d3.csv("festivales_musica_2023.csv").then(function(data) {
  
  const normalize = str => str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim();

  const festivalCountByComunidad = d3.rollup(
    data,
    v => v.length,
    d => normalize(d.comunidad_autonoma)
  );
  
  

  d3.json("https://raw.githubusercontent.com/piwodlaiwo/TopoJSON-Data/master/diva-gis/ESP_adm/ESP_adm1.topo.json").then(function(topo) {
    var spain = topojsonClient.feature(topo, topo.objects.states);
    var features = spain.features;

    var b = path.bounds(spain),
        s = 0.95 / Math.max(
            (b[1][0] - b[0][0]) / width,
            (b[1][1] - b[0][1]) / height
        ),
        t = [
            (width - s * (b[1][0] + b[0][0])) / 2,
            (height - s * (b[1][1] + b[0][1])) / 2
        ];

    projection.scale(s).translate(t);

    const maxCount = d3.max(Array.from(festivalCountByComunidad.values()));
   const colorScale = d3.scaleLinear()
  .domain([0, maxCount])
  .range(["#FFD700", "#ff2800"]);

    svg.selectAll("path")
      .data(features)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", function(d) {
        const comunidadNombre = normalize(d.properties.NAME_1);
        const count = festivalCountByComunidad.get(comunidadNombre) || 0;
        return colorScale(count);
      })
      .attr("stroke", "#333")
    // Evento on click con tts
      .on("click", function(event, d) {
  const comunidadNombre = normalize(d.properties.NAME_1);
  const count = festivalCountByComunidad.get(comunidadNombre) || 0;

  var msg = new SpeechSynthesisUtterance();
  msg.text = `La comunidad independiente de ${d.properties.NAME_1} tuvo ${count} festivales`;
  // Asignar la voz si está disponible (No es obligatorio)
  if (personalizedVoice) {
    msg.voice = personalizedVoice;
  } else {
    console.log("Voz no disponible.");
  }

  msg.pitch = 1;
  msg.rate = 1;

  window.speechSynthesis.speak(msg);
})
      .append("title")
      .text(function(d) {
        const comunidadNombre = normalize(d.properties.NAME_1);
        const count = festivalCountByComunidad.get(comunidadNombre) || 0;
        return `${d.properties.NAME_1}\nFestivales: ${count}`;
      });

    const legendScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([0, 100]);

    const legendAxis = d3.axisRight(legendScale)
      .ticks(5)
      .tickFormat(d3.format("d"));

    legend.selectAll("rect")
      .data(d3.range(0, maxCount + 1))
      .enter().append("rect")
      .attr("y", d => legendScale(d))
      .attr("width", 20)
      .attr("height", 1)
      .attr("fill", d => colorScale(d));

    legend.append("g")
      .attr("transform", "translate(20,0)")
      .call(legendAxis);
    
    
  });
});

// Para audios personalizados

// Definimos los links a los audios

const artistAudioMap = {
        "Beyoncé": "https://cdn.whyp.it/216d8eb5-3099-490b-8894-df689f8b6b99.mp3?token=1pCcDjVN5IoO5ckjnrurxwR9Y1aowiqCUYfrsFfK5o8&expires=1745224644",
        "U2": "https://cdn.whyp.it/54c1327f-30cd-4431-969c-d9508811c26e.mp3?token=Eak_PEMh0Kn5ubnYq-0qE65simNobQXA6Ba6oWlngs8&expires=1745224644",
        "Aretha Franklin": "https://cdn.whyp.it/e537910d-4b73-47ae-846b-7c1a472a1151.mp3?token=5plLmQYWcyExOGFtwxeKIQhIkTe3bqk_RnC1eFrUe-Y&expires=1745224644",
        "Vince Gill": "https://cdn.whyp.it/13acd74d-25c9-4dc4-9cff-9c6800eef81b.mp3?token=hPCIghtbT47tlDdN2lmMNqMrdIyf-9xKyHAX9AHxPCo&expires=1745225801",
        "Bruce Springsteen": "https://cdn.whyp.it/7a633974-60bd-46bb-9523-08d51a088a40.mp3?token=kz199M3xEaLYGRUKLa7zYwMZUZCGT1uAlvXK-DwVzQ0&expires=1745225315",
        "Stevie Wonder": "https://cdn.whyp.it/558949d9-480e-4dbc-bf26-86b50d922225.mp3?token=GjgG_ni_6JdCb8gb1foNJcFKEL4bq0AqIxH5dHXxMuA&expires=1745224644",
        "Ella Fitzgerald": "https://cdn.whyp.it/28240a87-3c07-4521-9269-1b742dc379bf.mp3?token=t59YwzsAcYqnSYjJTjoryHPWzY9NZTd8L5cXtdsNPrY&expires=1745224644",
        "Adele": "https://cdn.whyp.it/50b90120-f08a-41a0-9c1d-9db63cc815b9.mp3?token=0vjJTo3jhpR1nNLDAq-hd7QzaJuHV9xkyicqL2TQRcM&expires=1745224644",
        "Foo Fighters": "https://cdn.whyp.it/648cd52e-8c98-4ac9-945f-ac248c0b13ee.mp3?token=Vm7JBOWlI3MhyWMuxExiYBGgbQe6bhCBrRVrzvlNjO0&expires=1745224644",
        "Eminem": "https://cdn.whyp.it/589b3172-ba05-4efc-a08f-49e036a39298.mp3?token=SiyZhX1ws07ElfWZR8IuOpsPSKLKraVHJ2X0UkO4itk&expires=1745224644"
};





d3.csv("top_grammy_winners.csv").then(function(data) {
    var grammys = data.map(d => +d.Grammys);
    var	artist = data.map(d => d.Artist); 

    var pieData = [{
        type: "pie",
        labels: artist,
        values: grammys,
        textinfo: "label+percent", 
        insidetextorientation: "radial",
        marker: {
            colors: [
               "#ffadad",  "#ffd6a5,  #fdffb6",  "#caffbf",  "#9bf6ff",  "#a0c4ff",  "#bdb2ff","#ffc6ff", "#a5ceff", "#bcffa5"
            ]
        }
    }];

    var layout = {
        showlegend: false, 
        height: 400,
        width: 500
    };

    Plotly.newPlot("Chess", pieData, layout);

    // Añadimos el evento plotly-click
    var pieChart = document.getElementById('Chess');
    pieChart.on('plotly_click', function(data) {var point = data.points[0];
        var artist = point.label;
        var audioPath = artistAudioMap[artist];

        console.log(`Artist: ${artist}, Count: ${point.value}`);

        if (audioPath) {
            var player = document.getElementById('player');
            player.src = audioPath;
            player.play();
        } else {
            console.warn("No audio file mapped for this artist.");
        }
                                               });
});