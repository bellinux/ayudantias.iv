// =================== SECCIÓN 1: SONIFICACIÓN DE DATOS DISNEY VS GHIBLI ===================
// Esta sección convierte datos de ingresos de películas en sonidos musicales

/**
 * Configuración de Audio Context:
 * El AudioContext es la interfaz principal de la Web Audio API
 * Es necesario para reproducir sonidos de manera programática en el navegador
 */
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

/**
 * URLs de los instrumentos musicales:
 * Utilizamos soundfonts (muestras de audio) de instrumentos reales
 * - Piano: para representar los datos de Disney
 * - Ocarina: para representar los datos de Ghibli
 */
const pianoBaseURL = "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/";
const ocarinaBaseURL = "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/ocarina-mp3/";

/**
 * Cache para optimizar la carga de sonidos:
 * Guardamos los archivos de audio ya descargados para no volver a descargarlos
 */
const cache = {};

/**
 * Variables para almacenar los datos y controlar el rango de años
 */
let disneyData = [], ghibliData = [];
let startYear = 1985;
let maxYear = 2020;

    /**
     * Función para convertir valores MIDI a nombres de notas musicales:
     * 
     * En música digital, las notas se representan con números (MIDI):
     * - 60 = Do medio (C4)
     * - 61 = Do# (C#4)
     * - etc.
     * 
     * Esta función convierte esos números a nombres legibles como "C4", "D5", etc.
     * Solo utiliza notas naturales (sin sostenidos/bemoles) para simplificar
     */
    function midiToNaturalNoteName(midi) {
      // Notas naturales en orden (Do, Re, Mi, Fa, Sol, La, Si)
      const naturalNotes = ["C", "D", "E", "F", "G", "A", "B"];
      
      // Posiciones de las notas naturales en la escala cromática (12 semitonos)
      const naturalOffsets = [0, 2, 4, 5, 7, 9, 11];
      
      // Calcular la octava (cada 12 semitonos = 1 octava)
      const octave = Math.floor(midi / 12) - 1;
      
      // Encontrar la nota natural más cercana al valor MIDI
      const closestNatural = naturalOffsets.reduce((prev, curr) =>
        Math.abs(curr - (midi % 12)) < Math.abs(prev - (midi % 12)) ? curr : prev
      );
      
      // Obtener el nombre de la nota
      const note = naturalNotes[naturalOffsets.indexOf(closestNatural)];
      
      // Retornar el nombre completo (nota + octava): ej. "C4"
      return note + octave;
    }

    /**
     * Función principal para reproducir una nota musical:
     * 
     * Esta función utiliza la Web Audio API para cargar y reproducir sonidos
     * Es el corazón de la sonificación de datos
     */
    async function playNote(noteName, instrumentURL, delay = 0) {
      // Verificar si el contexto de audio está suspendido (por políticas del navegador)
      // Los navegadores modernos requieren interacción del usuario antes de reproducir audio
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Construir la URL completa del archivo de sonido
      // Ej: "https://...piano.../C4.mp3"
      const url = instrumentURL + noteName + ".mp3";

      // Sistema de cache para optimizar rendimiento:
      // Si ya descargamos este sonido antes, lo reutilizamos
      if (!cache[url]) {
        // Primera vez: descargar y decodificar el archivo de audio
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        // Decodificar el MP3 a datos de audio que el navegador puede usar
        cache[url] = await audioContext.decodeAudioData(arrayBuffer);
      }

      // Crear un nuevo reproductor de audio (buffer source)
      const source = audioContext.createBufferSource();
      // Asignar el sonido que queremos reproducir
      source.buffer = cache[url];
      // Conectar el reproductor a los altavoces
      source.connect(audioContext.destination);
      // Programar cuándo debe sonar (ahora + delay en segundos)
      source.start(audioContext.currentTime + delay);
    }

    /**
     * Función para actualizar el gráfico con Plotly.js:
     * 
     * Plotly.js es una biblioteca de visualización que permite crear gráficos interactivos
     * Esta función filtra los datos según el rango de años seleccionado y crea el gráfico
     */
    function updateGraph() {
      // Filtrar datos según el rango de años actual
      // Solo mostramos películas entre startYear y maxYear
      const filteredDisney = disneyData.filter(d => d.year >= startYear && d.year <= maxYear);
      const filteredGhibli = ghibliData.filter(d => d.year >= startYear && d.year <= maxYear);

      /**
       * Configuración del primer "trace" (serie de datos) para Disney:
       * - x: años de las películas
       * - y: ingresos de taquilla
       * - type: 'scatter' crea un gráfico de líneas/puntos
       * - line.color: color rojo para Disney
       */
      const trace1 = {
        x: filteredDisney.map(d => d.year),
        y: filteredDisney.map(d => d.revenue),
        type: 'scatter',
        name: 'Disney',
        line: { color: '#f94346' }
      };

      /**
       * Configuración del segundo "trace" para Ghibli:
       * Similar a Disney pero con color verde
       */
      const trace2 = {
        x: filteredGhibli.map(d => d.year),
        y: filteredGhibli.map(d => d.revenue),
        type: 'scatter',
        name: 'Ghibli',
        line: { color: '#5f9b7a' }
      };

      /**
       * Plotly.newPlot() es la función principal para crear/actualizar gráficos:
       * - 'Movies': ID del elemento HTML donde se dibujará el gráfico
       * - [trace1, trace2]: array con las series de datos a mostrar
       */
      Plotly.newPlot('Movies', [trace1, trace2]);
    }

    /**
     * Event Listener para el slider de años:
     * 
     * Cuando el usuario mueve el slider, actualizamos automáticamente:
     * 1. El año de inicio (startYear)
     * 2. La etiqueta que muestra el rango
     * 3. El gráfico con los nuevos datos filtrados
     */
    document.getElementById("yearRange").addEventListener("input", function () {
      // Convertir el valor del slider a número con el operador +
      startYear = +this.value;
      
      // Actualizar el texto que muestra el rango actual
      document.getElementById("yearLabel").textContent = `From ${startYear} to ${maxYear}`;
      
      // Redibujar el gráfico con el nuevo filtro de años
      updateGraph();
    });

    /**
     * Carga inicial de datos usando D3.js y Promises:
     * 
     * Promise.all() permite cargar múltiples archivos CSV simultáneamente
     * D3.csv() es una función de D3.js para leer archivos CSV de forma asíncrona
     */
    Promise.all([
      // Cargar datos de Disney y transformar cada fila
      d3.csv('disney_revenue.csv', d => ({
        year: +d.Year,              // Convertir año a número
        revenue: +d.total_gross     // Convertir ingresos a número
      })),
      // Cargar datos de Ghibli con estructura ligeramente diferente
      d3.csv('ghibli_revenue.csv', d => ({
        year: +d.Year,
        revenue: +d.Revenue         // Nota: columna diferente en el CSV de Ghibli
      }))
    ]).then(([disney, ghibli]) => {
      // Cuando ambos archivos se cargan exitosamente, ejecutar este código
      
      // Guardar los datos en las variables globales
      disneyData = disney;
      ghibliData = ghibli;

      // Encontrar el año más reciente entre todos los datos
      const allYears = disney.map(d => d.year).concat(ghibli.map(d => d.year));
      maxYear = Math.max(...allYears);  // Operador spread (...) para encontrar el máximo

      // Configurar el slider HTML con los valores apropiados
      const slider = document.getElementById("yearRange");
      slider.min = 1985;           // Año mínimo
      slider.max = maxYear;        // Año máximo encontrado en los datos
      slider.value = 1985;         // Valor inicial del slider
      startYear = 1985;            // Sincronizar variable JavaScript

      // Actualizar interfaz inicial
      document.getElementById("yearLabel").textContent = `From ${startYear} to ${maxYear}`;
      updateGraph();  // Dibujar el gráfico por primera vez
    });

    /**
     * SONIFICACIÓN DE DATOS - Botón para "escuchar" los datos:
     * 
     * Esta es la parte más interesante: convertir números (ingresos) en sonidos
     * Cada película se convierte en una nota musical proporcional a sus ingresos
     */
    document.getElementById("button-64").addEventListener("click", async () => {
      // Filtrar datos según el rango de años actual
      const dFiltered = disneyData.filter(d => d.year >= startYear && d.year <= maxYear);
      const gFiltered = ghibliData.filter(d => d.year >= startYear && d.year <= maxYear);

      // Verificar que tengamos datos para reproducir
      if (!dFiltered.length || !gFiltered.length) {
        alert("No data to play in the selected year range.");
        return;
      }

      // Limitar la cantidad de notas para evitar saturación de audio
      const count = Math.min(dFiltered.length, gFiltered.length, 20);

      // Reproducir cada película como una nota musical
      for (let i = 0; i < count; i++) {
        // ALGORITMO DE CONVERSIÓN DATOS → MÚSICA:
        
        // 1. Convertir ingresos a valor MIDI (60 = Do medio)
        // Dividimos entre 10 millones para escalar los valores grandes
        const dNote = 60 + Math.floor(dFiltered[i].revenue / 10000000);
        const gNote = 60 + Math.floor(gFiltered[i].revenue / 10000000);
        
        // 2. Limitar el rango musical (48-84 = 3 octavas aprox.)
        // Math.max/min aseguran que las notas estén en un rango audible agradable
        const dName = midiToNaturalNoteName(Math.max(48, Math.min(84, dNote)));
        const gName = midiToNaturalNoteName(Math.max(48, Math.min(84, gNote)));

        // 3. Reproducir las notas con timing específico:
        // - Disney (piano): cada 0.6 segundos
        // - Ghibli (ocarina): 0.3 segundos después de Disney
        // Esto crea una "melodía" donde se puede distinguir cada estudio
        playNote(dName, pianoBaseURL, i * 0.6);
        playNote(gName, ocarinaBaseURL, i * 0.6 + 0.3);
      }
    });



// =================== SECCIÓN 2: SÍNTESIS DE VOZ PARA ACCESIBILIDAD ===================
// Esta sección configura la síntesis de voz para hacer la visualización más accesible

/**
 * Variable para almacenar la voz preferida del sistema
 * Utilizamos una voz en español para mejorar la experiencia del usuario
 */
let personalizedVoice = null;

/**
 * Configuración de la síntesis de voz:
 * 
 * window.speechSynthesis es la API nativa del navegador para texto a voz
 * El evento 'onvoiceschanged' se dispara cuando las voces están disponibles
 */
window.speechSynthesis.onvoiceschanged = () => {
  // Obtener todas las voces disponibles en el sistema
  const voices = speechSynthesis.getVoices();
  
  // Buscar una voz específica en español (Microsoft Alonso)
  personalizedVoice = voices.find(voice => voice.name === 'Microsoft Alonso Online (Natural) - Spanish (United States)');
  
  // Mensaje de depuración si no está disponible
  if (!personalizedVoice){
    console.log("No esta disponible esa voz")
  }
};

/**
 * Función principal para convertir texto a voz:
 * 
 * Esta función mejora la accesibilidad de la visualización
 * permitiendo que los usuarios "escuchen" información sobre los datos
 */
function speak(text) {
  // Crear un objeto de síntesis de voz con el texto proporcionado
  const utterance = new SpeechSynthesisUtterance(text);

  // Configurar la voz preferida si está disponible
  if (personalizedVoice) {
    utterance.voice = personalizedVoice;
  } else {
    // Sistema de respaldo: buscar cualquier voz en español
    const fallback = speechSynthesis.getVoices().find(v => v.lang.startsWith("es"));
    if (fallback) utterance.voice = fallback;
  }

  // Detener cualquier síntesis de voz en curso antes de comenzar
  speechSynthesis.cancel();
  
  // Iniciar la síntesis de voz
  speechSynthesis.speak(utterance);
}

// =================== SECCIÓN 3: GRÁFICO INTERACTIVO DE CONSOLAS ===================
// Esta sección utiliza Chart.js para crear un gráfico de barras interactivo

/**
 * Configuración inicial del gráfico:
 * - chart: variable para almacenar la instancia del gráfico
 * - canvas: elemento HTML donde se dibujará el gráfico
 * - ctx: contexto 2D del canvas (requerido por Chart.js)
 */
let chart;
const canvas = document.getElementById("consoleChart");
const ctx = canvas.getContext("2d");

/**
 * Función principal para actualizar el gráfico de consolas:
 * 
 * Esta función demuestra cómo usar Chart.js para crear visualizaciones interactivas
 * que responden a la selección del usuario y proporcionan retroalimentación de audio
 */
function updateChart(data) {
  // Obtener la compañía seleccionada por el usuario (Nintendo, Sony, Microsoft)
  const selectedFirm = document.getElementById("companySelect").value;
  
  // Filtrar datos solo para la compañía seleccionada
  const filteredData = data.filter(item => item.Firm === selectedFirm);
  
  // Ordenar por ventas (mayor a menor) para mejor visualización
  const sortedData = filteredData.sort((a, b) => b["Units Sold (M)"] - a["Units Sold (M)"]);

  // Preparar datos para Chart.js
  const labels = sortedData.map(item => item.Platform);                    // Nombres de consolas (eje X)
  const unitsSold = sortedData.map(item => parseFloat(item["Units Sold (M)"])); // Ventas (eje Y)

  // Destruir gráfico anterior si existe (para evitar superposición)
  if (chart) chart.destroy();

  /**
   * Configuración base de Chart.js:
   * Define opciones comunes para todos los gráficos
   */
  const baseOptions = {
    scales: {
      y: {
        beginAtZero: true  // El eje Y siempre empieza en 0
      }
    }
  };

  /**
   * Mapa de colores corporativos:
   * Cada compañía tiene colores específicos para mantener consistencia visual
   */
  const colorMap = {
    Nintendo: { bg: '#e60012', border: '#8a0011' },    // Rojo Nintendo
    Sony: { bg: '#003791', border: '#0055ff' },        // Azul PlayStation
    Microsoft: { bg: '#107c11', border: '#7eb900' }    // Verde Xbox
  };

  // Solo crear gráfico si tenemos colores definidos para la compañía
  if (colorMap[selectedFirm]) {
    const { bg, border } = colorMap[selectedFirm];
    
    /**
     * Crear nuevo gráfico con Chart.js:
     * 
     * Chart.js es una biblioteca popular para crear gráficos interactivos
     * Aquí configuramos un gráfico de barras con datos de ventas de consolas
     */
    chart = new Chart(ctx, {
      type: 'bar',           // Tipo de gráfico: barras verticales
      data: {
        labels,              // Etiquetas del eje X (nombres de consolas)
        datasets: [{
          label: 'Units Sold (Millions)',
          data: unitsSold,   // Datos del eje Y (ventas en millones)
          backgroundColor: bg,    // Color de relleno de las barras
          borderColor: border,    // Color del borde de las barras
          borderWidth: 1
        }]
      },
      options: baseOptions
    });

    /**
     * INTERACTIVIDAD CON SÍNTESIS DE VOZ:
     * 
     * Agregamos un event listener para hacer el gráfico accesible
     * Cuando el usuario hace clic en una barra, escucha información sobre esa consola
     */
    chart.canvas.addEventListener('click', (event) => {
      // Obtener el elemento del gráfico más cercano al clic
      const activePoints = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true });
      
      if (activePoints.length > 0) {
        // Extraer información del elemento clickeado
        const index = activePoints[0].index;
        const label = labels[index];       // Nombre de la consola
        const sales = unitsSold[index];    // Ventas en millones
        
        // Usar síntesis de voz para comunicar la información
        speak(`Plataforma: ${label}, Ventas: ${sales} millones`);
      }
    });

  } else {
    // Si no hay colores definidos, mostrar fondo blanco
    canvas.style.backgroundColor = "#FFFFFF";
  }
}

/**
 * Función para cargar y procesar datos CSV:
 * 
 * Utiliza Papa Parse (biblioteca externa) para convertir texto CSV en objetos JavaScript
 * Esta es una alternativa a D3.csv() y es muy útil para archivos CSV complejos
 */
function fetchCSVFile() {
  // Usar Fetch API para obtener el archivo CSV
  fetch('most_sold_game.csv')
    .then(response => response.text())  // Convertir respuesta a texto plano
    .then(csvData => {
      /**
       * Papa.parse() es una biblioteca especializada en parsear CSV:
       * 
       * Configuración:
       * - header: true = usar primera fila como nombres de columnas
       * - skipEmptyLines: true = ignorar líneas vacías
       * - dynamicTyping: true = convertir automáticamente números y booleans
       * - complete: función callback que se ejecuta al terminar el parseo
       */
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function(results) {
          // Cuando el parseo esté completo, actualizar el gráfico
          updateChart(results.data);
        }
      });
    })
    .catch(error => console.error("Error fetching CSV file:", error));
}

/**
 * Event Listener para el selector de compañías:
 * 
 * Cuando el usuario cambia la selección en el dropdown,
 * automáticamente recargamos y actualizamos el gráfico
 */
document.getElementById("companySelect")
  .addEventListener("change", fetchCSVFile);

// Cargar datos inicialmente cuando la página se carga
fetchCSVFile();


// =================== SECCIÓN 4: MAPA INTERACTIVO DE VOLCANES DE JAPÓN ===================
// Esta sección utiliza D3.js para crear un mapa geográfico con datos de volcanes y audio espacial

/**
 * Configuración inicial del mapa con D3.js:
 * 
 * D3.js es una biblioteca poderosa para manipular documentos basados en datos
 * Aquí la usamos para crear un mapa geográfico interactivo
 */
var svg = d3.select("svg.map");               // Seleccionar elemento SVG específico del mapa
var width = +svg.attr("width") || 1200;      // Obtener ancho del SVG (fallback a 1200)
var height = +svg.attr("height") || 800;     // Obtener alto del SVG (fallback a 800)

console.log(`Dimensiones del SVG aumentadas: ${width} x ${height}`);

/**
 * Configuración de la proyección geográfica MEJORADA:
 * 
 * Una proyección convierte coordenadas geográficas (latitud/longitud)
 * en coordenadas de pantalla (x, y pixels)
 * 
 * Parámetros ajustados para mostrar Japón completo y centrado en 1200x800
 */
var projection = d3.geoMercator()
    .center([138, 37])                        // Centro ajustado para mejor visualización de Japón
    .scale(Math.min(width, height) * 1.0)     // Escala aumentada para aprovechar el espacio (era 0.8)
    .translate([width / 2, height / 2]);      // Centrar el mapa en el SVG

console.log(`Proyección configurada - Centro: [138, 37], Escala aumentada: ${Math.min(width, height) * 1.0}`);

/**
 * Generador de rutas geográficas:
 * 
 * d3.geoPath() convierte datos GeoJSON en elementos SVG <path>
 * que el navegador puede dibujar como formas geográficas
 */
var path = d3.geoPath().projection(projection);

/**
 * Carga y renderizado del mapa base de Japón:
 * 
 * GeoJSON es un formato estándar para representar datos geográficos
 * Contiene las formas (polígonos) de las prefecturas de Japón
 */
d3.json("https://fernanda-bley.github.io/Ejemplos-Ayudantias-IIC2026/ayudantia-7/japan.geojson")
.then(function(japan) {
    console.log("GeoJSON de Japón cargado exitosamente:", japan);
    
    // Verificar que tenemos datos válidos
    if (!japan || !japan.features || japan.features.length === 0) {
        console.error("Error: GeoJSON de Japón no contiene datos válidos");
        return;
    }
    /**
     * Patrón de Data Join de D3.js:
     * 
     * Este es el patrón fundamental de D3: vincular datos con elementos del DOM
     * 1. selectAll(): seleccionar elementos (aunque no existan aún)
     * 2. data(): vincular datos a los elementos
     * 3. enter(): crear elementos para datos que no tienen elemento asociado
     * 4. append(): crear el elemento SVG
     * 5. attr(): configurar atributos del elemento
     */
    svg.selectAll("path")
        .data(japan.features)                 // japan.features contiene los polígonos de las prefecturas
        .enter().append("path")               // Crear un <path> por cada prefectura
        .attr("d", path)                      // Usar el generador de rutas para dibujar la forma
        .attr("stroke", "#aaa")               // Color del borde (gris claro)
        .attr("stroke-width", 0.5)            // Grosor del borde
        .attr("fill", "none");                // Sin relleno (solo contornos)

    /**
     * Configuración del tooltip interactivo:
     * 
     * Un tooltip es una ventana emergente que muestra información adicional
     * cuando el usuario interactúa con elementos del mapa
     * 
     * NOTA: Usamos el tooltip que ya existe en el HTML en lugar de crear uno nuevo
     */
    const tooltip = d3.select("#tooltip");

    /**
     * AUDIO ESPACIAL PARA VOLCANES:
     * 
     * Configuramos diferentes sonidos según la altura del volcán
     * Esto es una forma de "sonificación categórica" - diferentes categorías = diferentes sonidos
     * 
     * SOLUCIÓN DE AUDIO: Usamos Web Audio API en lugar de elementos <audio>
     * para mayor compatibilidad y control sobre la reproducción
     */
    
    // Función helper para reproducir sonidos de volcanes usando Web Audio API
    async function playVolcanoSound(frequency, duration = 0.5) {
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configurar diferentes frecuencias según la categoría del volcán
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine'; // Sonido suave tipo sine wave
        
        // Envelope para evitar clicks
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    /**
     * Carga y procesamiento de datos de volcanes:
     * 
     * Utilizamos D3.csv() para cargar datos de volcanes desde un archivo CSV
     * Luego procesamos los datos para asegurar tipos correctos y validez geográfica
     */
    d3.csv("japan_volcano.csv").then(volcanoes => {
        console.log("Datos de volcanes cargados:", volcanoes.length, "volcanes");
        
        // Verificar que tenemos datos
        if (!volcanoes || volcanoes.length === 0) {
            console.error("Error: No se pudieron cargar los datos de volcanes");
            return;
        }
        /**
         * Procesamiento de datos CSV:
         * 
         * Los datos CSV llegan como strings, necesitamos convertir
         * las coordenadas y elevaciones a números para poder trabajar con ellos
         */
        volcanoes.forEach(d => {
            d.Latitude = +d.Latitude;                    // Convertir latitud a número
            d.Longitude = +d.Longitude;                  // Convertir longitud a número
            d.Elevation_meters = +d.Elevation_meters;    // Convertir elevación a número
        });

        /**
         * Filtrado de datos válidos:
         * 
         * Solo incluimos volcanes que:
         * 1. Tienen coordenadas válidas (no NaN)
         * 2. Están geográficamente dentro de Japón (d3.geoContains)
         */
        const validVolcanoes = volcanoes.filter(d => {
            const coords = [d.Longitude, d.Latitude];    // GeoJSON usa [lng, lat], no [lat, lng]
            return !isNaN(d.Latitude) && 
                   !isNaN(d.Longitude) && 
                   d3.geoContains(japan, coords);        // Verificar si el punto está dentro del polígono de Japón
        });

        /**
         * Encontrar la elevación máxima:
         * 
         * Necesario para crear la visualización comparativa en el tooltip
         * (comparar cada volcán con el Monte Fuji, el más alto)
         */
        const maxElevation = d3.max(validVolcanoes, d => d.Elevation_meters || 0);
        
        console.log(`Volcanes válidos: ${validVolcanoes.length}`);
        console.log(`Elevación máxima: ${maxElevation}m`);
        
        // Verificar que tenemos volcanes válidos para mostrar
        if (validVolcanoes.length === 0) {
            console.error("Error: No hay volcanes válidos para mostrar en el mapa");
            return;
        }

        /**
         * Creación de elementos visuales para volcanes:
         * 
         * Aquí aplicamos el patrón Data Join de D3 para crear círculos
         * que representan volcanes en el mapa
         */
        svg.selectAll("circle.volcano")
            .data(validVolcanoes)                        // Vincular datos de volcanes
            .enter()                                     // Para cada volcán que no tiene círculo
            .append("circle")                            // Crear un círculo SVG
            .attr("class", "volcano")                    // Clase CSS para styling
            .attr("cx", d => projection([d.Longitude, d.Latitude])[0])  // Posición X (usar proyección)
            .attr("cy", d => projection([d.Longitude, d.Latitude])[1])  // Posición Y (usar proyección)
            .attr("r", 5)                                // Radio aumentado para mejor visibilidad
            .attr("fill", "red")                         // Color rojo para volcanes
            .attr("stroke", "black")                     // Borde negro
            .attr("stroke-width", 1.5)                   // Borde más grueso para mayor visibilidad
            .style("cursor", "pointer")                  // Indicar que es clickeable
            
            /**
             * EVENT LISTENER: mouseover (hover)
             * 
             * Cuando el usuario pasa el mouse sobre un volcán:
             * 1. Calculamos la altura relativa
             * 2. Seleccionamos el audio apropiado
             * 3. Reproducimos el sonido
             * 4. Mostramos el tooltip con información
             */
            .on("mouseover", (event, d) => {
                // Calcular altura relativa comparada con el volcán más alto (Monte Fuji)
                const heightPercent = d.Elevation_meters / maxElevation;
                
                // Dimensiones para la visualización en el tooltip
                const svgWidth = 100;
                const svgHeight = 60;
                const peakY = svgHeight * (1 - heightPercent);

                /**
                 * LÓGICA DE SONIFICACIÓN CATEGÓRICA MEJORADA:
                 * 
                 * Dividimos volcanes en 3 categorías según altura y asignamos frecuencias:
                 * - Alto (>3000m): Frecuencia baja (grave) = más dramático
                 * - Mediano (1000-3000m): Frecuencia media
                 * - Pequeño (<1000m): Frecuencia alta (agudo) = más sutil
                 */
                let frequency;
                if (d.Elevation_meters > 3000) {
                    frequency = 200;  // Sonido grave para volcanes altos
                } else if (d.Elevation_meters > 1000) {
                    frequency = 400;  // Sonido medio para volcanes medianos
                } else {
                    frequency = 800;  // Sonido agudo para volcanes pequeños
                }

                // Reproducir el sonido correspondiente a la categoría del volcán
                // Usamos try-catch para manejar errores de audio graciosamente
                try {
                    playVolcanoSound(frequency, 0.3);
                } catch (error) {
                    console.log("Error reproduciendo sonido de volcán:", error);
                }

                /**
                 * VISUALIZACIÓN COMPARATIVA EN EL TOOLTIP:
                 * 
                 * Creamos un mini-gráfico SVG que muestra dos triángulos:
                 * 1. Monte Fuji (referencia, el volcán más alto de Japón)
                 * 2. El volcán actual (para comparación visual)
                 * 
                 * Esta es una técnica de "small multiples" - gráficos pequeños para comparación
                 */
                const svgChart = `
                    <svg width="${svgWidth * 2}" height="${svgHeight}">
                        <!-- Triángulo de referencia: Monte Fuji (altura máxima) -->
                        <polygon points="0,${svgHeight} ${svgWidth/2},0 ${svgWidth},${svgHeight}" fill="#f2faef"/>
                        <!-- Etiqueta para identificar la referencia -->
                        <text x="${svgWidth/2}" y="20" text-anchor="middle" font-size="12" fill="black">Mount Fuji</text>
                        
                        <!-- Triángulo del volcán actual (altura proporcional) -->
                        <polygon points="${svgWidth+20},${svgHeight} ${svgWidth*1.5},${peakY} ${svgWidth*2-20},${svgHeight}" fill="#e63746"/>
                        <!-- Etiqueta con la altura exacta -->
                        <text x="${svgWidth * 1.5}" y="${peakY - 5}" text-anchor="middle" font-size="10" fill="black">
                            ${d.Elevation_meters} m
                        </text>
                    </svg>`;

                /**
                 * Mostrar tooltip con información completa:
                 * 
                 * Incluimos:
                 * - Nombre del volcán
                 * - Datos técnicos (elevación, coordenadas)
                 * - Visualización comparativa (los triángulos)
                 */
                tooltip
                    .style("visibility", "visible")
                    .html(`
                        <strong>${d.Name}</strong><br/>
                        Elevation: ${d.Elevation_meters} m<br/>
                        Latitude: ${d.Latitude}<br/>
                        Longitude: ${d.Longitude}<br/><br/>
                        ${svgChart}  <!-- Gráfico comparativo integrado -->
                    `);
            })
            
            /**
             * EVENT LISTENER: mousemove
             * 
             * Actualizar posición del tooltip para que siga el cursor del mouse
             */
            .on("mousemove", event => {
                tooltip
                    .style("top", (event.pageY + 10) + "px")      // 10px debajo del cursor
                    .style("left", (event.pageX + 10) + "px");    // 10px a la derecha del cursor
            })
            
            /**
             * EVENT LISTENER: mouseout
             * 
             * Ocultar tooltip cuando el mouse sale del volcán
             */
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

    /**
     * Manejo de errores:
     * 
     * Si hay problemas cargando el archivo CSV de volcanes,
     * mostramos un mensaje de error en la consola para debugging
     */
    }).catch(function(error) {
        console.error("Error al cargar el archivo CSV de volcanes", error);
    });

/**
 * Fin del bloque de carga del GeoJSON de Japón
 * 
 * Todo el código de volcanes se ejecuta dentro del .then() del GeoJSON
 * para asegurar que el mapa base esté cargado antes de agregar los volcanes
 */
})
.catch(function(error) {
    console.error("Error cargando el mapa de Japón:", error);
    
    // Mostrar mensaje de error al usuario
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "red")
        .text("Error cargando el mapa de Japón. Verifica tu conexión a internet.");
});
