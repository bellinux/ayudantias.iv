// ====== SECCIÓN 1: CONFIGURACIÓN INICIAL DE AUDIO ======
// Esta sección configura el contexto de audio para generar sonidos dinámicos

// Creamos un contexto de audio que nos permite generar y manipular sonidos
// AudioContext es la base para cualquier aplicación de audio en el navegador
let audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Variables globales para manejar el oscilador (generador de tonos) y el control de volumen
let oscillator;    // Genera las ondas sonoras con diferentes frecuencias
let gainNode;      // Controla el volumen del sonido

// Definimos el rango de frecuencias que usaremos para la sonificación de datos
const minFrequency = 10;       // Frecuencia más baja (sonido grave) en Hz
const maxFrequency = 100;      // Frecuencia más alta (sonido agudo) en Hz
const maxRampDuration = 10;    // Tiempo máximo para cambiar de frecuencia baja a alta (en segundos)


// ====== SECCIÓN 2: GRÁFICO INTERACTIVO DE AUTOS MÁS RÁPIDOS CON SONIFICACIÓN ======
// Cargamos datos de autos y creamos un gráfico de barras con sonidos interactivos

d3.csv("fastest_cars.csv").then(function(data) {
    // Procesamos los datos del CSV: combinamos fabricante y modelo, y convertimos tiempo a número
    const pairedData = data.map(d => ({
        label: `${d.Manufacturer} - ${d.Model}`,           // Etiqueta legible: "Ferrari - F50"
        time: parseFloat(d.Time.trim())                    // Convertimos el tiempo de texto a número decimal
    }));

    // Ordenamos los autos de mayor a menor tiempo (los más lentos primero)
    const sortedData = pairedData.sort((a, b) => b.time - a.time);
    
    // Tomamos solo los 10 autos más lentos para el gráfico
    const top10Data = sortedData.slice(0, 10);
  
    // Separamos los datos en arrays para usar con Plotly
    const sortedLabels = top10Data.map(d => d.label);    // Array con nombres de autos
    const sortedTimes = top10Data.map(d => d.time);      // Array con tiempos de aceleración

    // Configuramos los datos para el gráfico de barras horizontales de Plotly
    let plotData = [{
        x: sortedTimes,           // Valores numéricos van en el eje X
        y: sortedLabels,          // Etiquetas van en el eje Y
        type: 'bar',              // Tipo de gráfico: barras
        orientation: 'h',         // Barras horizontales
        text: sortedLabels,       // Texto que aparece en cada barra
        textposition: 'inside',   // Posición del texto dentro de la barra
        marker: {
            color: '#ff2800'      // Color rojo para todas las barras
        }
    }];

    // Configuramos el diseño y títulos del gráfico
    let layout = {
        xaxis: { title: "Time (seconds)" },                    // Título del eje X
        yaxis: { 
            title: "Car Models",                               // Título del eje Y
            tickvals: sortedLabels.map((_, index) => `Car ${index + 1}`), 
            ticktext: sortedLabels                             // Etiquetas personalizadas del eje Y
        },
        showlegend: false                                      // No mostrar leyenda
    };

    // Creamos el gráfico en el elemento HTML con id 'Cars'
    Plotly.newPlot('Cars', plotData, layout);
    
    // Obtenemos referencia al gráfico para agregar interactividad
    const plotDiv = document.getElementById('Cars');
    
    // *** EVENTO HOVER: Cuando el mouse pasa sobre una barra ***
    // Este evento genera sonidos que representan los datos visualmente
    plotDiv.on('plotly_hover', function(data) {
        
        // Obtenemos el índice de la barra sobre la que está el mouse
        const index = data.points[0].pointIndex;
        const timeValue = sortedTimes[index];        // Valor de tiempo de esa barra
     
        // Calculamos los valores mínimo y máximo para normalizar el sonido
        const minTime = Math.min(...sortedTimes);   // Tiempo más rápido
        const maxTime = Math.max(...sortedTimes);   // Tiempo más lento

        // Calculamos cuánto tiempo tardará el sonido en cambiar de grave a agudo
        // Los autos más lentos tendrán rampas más largas (sonido más lento)
        const baseRamp = 0.1;    // Tiempo base mínimo
        const dynamicRamp = maxRampDuration * (timeValue - minTime) / (maxTime - minTime);
        const rampDelay = 1;     // Retraso antes de empezar el cambio de frecuencia
     
        // Detenemos cualquier sonido anterior que esté reproduciéndose
        if (oscillator) {
            oscillator.stop();
        }
     
        // Creamos un nuevo oscilador (generador de tonos) y un nodo de ganancia (volumen)
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();

        // Configuramos el tipo de onda sonora - 'sawtooth' produce un sonido "áspero"
        // Otras opciones: 'sine' (suave), 'square' (digital), 'triangle' (intermedio)
        oscillator.type = 'sawtooth';
        
        // Establecemos la frecuencia inicial (sonido grave)
        oscillator.frequency.setValueAtTime(minFrequency, audioContext.currentTime); 

        // Conectamos el oscilador al control de volumen, y este a los altavoces
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Iniciamos la reproducción del sonido
        oscillator.start();

        // Programamos el cambio de frecuencia: empezamos grave y subimos a agudo
        // La velocidad de cambio depende del valor de los datos (autos más lentos = sonido más lento)
        oscillator.frequency.setValueAtTime(minFrequency, audioContext.currentTime + rampDelay);
        oscillator.frequency.exponentialRampToValueAtTime(maxFrequency, audioContext.currentTime + rampDelay + dynamicRamp);
    });

    // *** EVENTO UNHOVER: Cuando el mouse sale de la barra ***
    // Detenemos el sonido para evitar que se acumulen múltiples sonidos
    plotDiv.on('plotly_unhover', function(data) {
        if (oscillator) {
            oscillator.stop();      // Detenemos la reproducción
            oscillator = null;      // Limpiamos la referencia
        }
    });

}); // Fin de la carga de datos de autos

// ====== SECCIÓN 3: CONVERSIÓN DE DATOS A NOTAS MUSICALES ======
// Esta sección usa Tone.js para convertir datos numéricos en secuencias musicales

// Función utilitaria que convierte números MIDI a nombres de notas musicales
// MIDI es un estándar donde cada número representa una nota específica
function midiToNoteName(midi) {
    // Array con las 12 notas de una octava (Do, Do#, Re, Re#, etc.)
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    
    // Calculamos la octava: MIDI 60 = C4 (Do central)
    const octave = Math.floor(midi / 12) - 1;
    
    // Encontramos la nota dentro de la octava usando el resto de la división
    const note = notes[midi % 12];
    
    // Devolvemos la nota con su octava: ej. "C4", "F#5"
    return note + octave;
}


// ====== SECCIÓN 4: GRÁFICO DE VENTAS DE PIZZA CON MELODÍA INTERACTIVA ======
// Cargamos datos de ventas de pizza y creamos una melodía que representa las ventas mensuales

d3.csv("A_year_of_pizza_sales_from_a_pizza_place_872_68.csv").then(function(data) {
    // Objeto para acumular las ventas totales por mes
    const salesPerMonth = {};

    // Procesamos cada fila del CSV para agrupar ventas por mes
    data.forEach(function(row) {
        const date = new Date(row.date);                          // Convertimos la fecha a objeto Date
        const month = `${String(date.getMonth() + 1).padStart(2, '0')}`; // Extraemos el mes (01-12)
        const price = parseFloat(row.price);                      // Convertimos el precio a número
        
        // Si es la primera venta del mes, inicializamos en 0
        if (!salesPerMonth[month]) {
            salesPerMonth[month] = 0;
        }
        // Acumulamos el precio al total del mes
        salesPerMonth[month] += price;
    });

    // Ordenamos los meses y obtenemos los totales correspondientes
    let months = Object.keys(salesPerMonth).sort();              // Array de meses ordenados
    const totals = months.map(month => salesPerMonth[month]);    // Array de totales de ventas

    // Convertimos números de mes a nombres abreviados para mejor legibilidad
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    months = months.map(m => monthNames[parseInt(m) - 1]);

    // Definimos colores para el gráfico: normal y resaltado
    const defaultColor = '#CF0F47';    // Color rosa/rojo normal
    const highlightColor = '#FF0B55';  // Color más brillante para resaltar

    // Inicializamos todos los puntos con el color por defecto
    let markerColors = Array(months.length).fill(defaultColor);

    // Configuramos los datos para un gráfico de líneas con puntos
    const plotData = [{
        x: months,                           // Meses en el eje X
        y: totals,                           // Ventas totales en el eje Y
        mode: 'lines+markers',               // Mostramos líneas conectando puntos Y los puntos
        type: 'scatter',                     // Tipo de gráfico: dispersión/línea
        marker: { color: markerColors, size: 10 },  // Configuración de los puntos
        line: { color: defaultColor }        // Color de la línea conectora
    }];

    // Configuramos el diseño del gráfico
    const layout = {
        xaxis: { title: 'Month' },           // Título del eje X
        yaxis: { title: 'Total Sales ($)' }  // Título del eje Y
    };

    // Creamos el gráfico en el elemento HTML con id 'Pizza'
    Plotly.newPlot('Pizza', plotData, layout);

    // Obtenemos referencia al botón que activará la melodía
    const boton = document.getElementById('button-64');
    
    // *** EVENTO CLICK DEL BOTÓN: Reproduce una melodía de los datos ***
    // Cuando el usuario hace clic, se reproduce una secuencia musical
    boton.addEventListener('click', async function () {
        // IMPORTANTE: Tone.js requiere activación por interacción del usuario
        await Tone.start();
        console.log('Audio context started');

        // Creamos un sintetizador (instrumento virtual) conectado a los altavoces
        const synth = new Tone.Synth().toDestination();

        // Calculamos el rango de ventas para mapear a notas musicales
        const minSales = Math.min(...totals);    // Ventas más bajas
        const maxSales = Math.max(...totals);    // Ventas más altas

        // Reproducimos una nota por cada mes, creando una melodía
        for (let i = 0; i < totals.length; i++) {
            // Convertimos las ventas a una nota MIDI entre 48 (C3) y 72 (C5)
            // Las ventas más altas se convierten en notas más agudas
            const midiNote = Math.floor(48 + (totals[i] - minSales) / (maxSales - minSales) * (72 - 48));
            const note = midiToNoteName(midiNote);    // Convertimos a nombre de nota
            
            // Actualizamos el gráfico para resaltar el mes actual
            markerColors = Array(months.length).fill(defaultColor);
            markerColors[i] = highlightColor;         // Resaltamos el punto actual
            Plotly.restyle('Pizza', { 'marker.color': [markerColors] });

            // Reproducimos la nota durante 1/8 de tiempo (corchea)
            synth.triggerAttackRelease(note, "8n");

            // Esperamos 400ms antes de la siguiente nota para crear ritmo
            await new Promise(res => setTimeout(res, 400));
        }
    });
}); // Fin de la carga de datos de pizza


// ====== SECCIÓN 5: CONFIGURACIÓN DE SÍNTESIS DE VOZ (TTS) ======
// Text-To-Speech permite que el navegador "hable" información de los datos

// Variable global para almacenar la voz personalizada que queremos usar
let personalizedVoice = null;

// Evento que se dispara cuando las voces del sistema están disponibles
// Las voces se cargan de forma asíncrona, por eso necesitamos este evento
window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();    // Obtenemos todas las voces disponibles
    
    // Buscamos una voz específica en español (España) - puedes cambiar esto
    personalizedVoice = voices.find(voice => voice.name === 'Microsoft Alvaro Online (Natural) - Spanish (Spain)');
    
    // Si no encuentras esta voz, puedes buscar otras voces en español:
    // voice.lang.includes('es') encontraría cualquier voz en español
};



// ====== SECCIÓN 6: MAPA INTERACTIVO CON SÍNTESIS DE VOZ ======
// Creamos un mapa de España que "habla" información cuando hacemos clic en las regiones

// Para crear mapas de países específicos (Chile, Perú, etc.) necesitamos archivos TopoJSON
// TopoJSON es un formato que contiene información geográfica comprimida
const topojsonClient = window.topojson;

// Definimos las dimensiones del mapa
var width = 900;    // Ancho en píxeles
var height = 500;   // Alto en píxeles

// Creamos el contenedor SVG donde dibujaremos el mapa
// SVG es ideal para gráficos vectoriales que se pueden escalar sin perder calidad
var svg = d3.select(".map")       // Seleccionamos elemento con clase "map"
    .attr("width", width)         // Establecemos ancho
    .attr("height", height);      // Establecemos alto

// Configuramos la proyección geográfica (cómo convertir coordenadas 3D del globo a 2D)
// Mercator es una proyección común que mantiene las formas pero distorsiona el tamaño
var projection = d3.geoMercator()
    .scale(1)              // Escala inicial (la ajustaremos después)
    .translate([0, 0]);    // Posición inicial (la centraremos después)

// Creamos el generador de rutas que convierte coordenadas geográficas a paths SVG
var path = d3.geoPath().projection(projection);


d3.csv("festivales_musica_2023.csv").then(function(data) {
    
    // Función auxiliar para normalizar nombres de regiones
    // Esto es importante porque los nombres en el CSV y en el mapa pueden tener diferencias
    const normalize = str => str
        .normalize("NFD")                    // Separa caracteres con acentos
        .replace(/[\u0300-\u036f]/g, "")     // Elimina los acentos
        .toLowerCase()                       // Convierte a minúsculas
        .trim();                            // Elimina espacios extra

    // Agrupamos los datos: contamos cuántos festivales hay por comunidad autónoma
    // d3.rollup es como GROUP BY en SQL - agrupa y aplica una función
    const festivalCountByComunidad = d3.rollup(
        data,                               // Datos a agrupar
        v => v.length,                      // Función de agregación: contar elementos
        d => normalize(d.comunidad_autonoma) // Función de agrupación: por comunidad normalizada
    );
  
  

    // Cargamos el archivo TopoJSON que contiene las formas geográficas de España
    d3.json("https://raw.githubusercontent.com/piwodlaiwo/TopoJSON-Data/master/diva-gis/ESP_adm/ESP_adm1.topo.json").then(function(topo) {
        
        // Convertimos TopoJSON a GeoJSON para poder trabajar con D3
        var spain = topojsonClient.feature(topo, topo.objects.states);
        var features = spain.features;    // Array con todas las comunidades autónomas

        // Calculamos automáticamente el zoom y centrado para que España ocupe todo el SVG
        var b = path.bounds(spain);       // Obtenemos los límites del mapa
        
        // Calculamos la escala necesaria para ajustar España al contenedor
        var s = 0.95 / Math.max(
            (b[1][0] - b[0][0]) / width,   // Proporción horizontal
            (b[1][1] - b[0][1]) / height   // Proporción vertical
        );
        
        // Calculamos la traslación para centrar el mapa
        var t = [
            (width - s * (b[1][0] + b[0][0])) / 2,    // Centrado horizontal
            (height - s * (b[1][1] + b[0][1])) / 2    // Centrado vertical
        ];

        // Aplicamos la escala y traslación calculadas a la proyección
        projection.scale(s).translate(t);

        // Encontramos el número máximo de festivales para configurar la escala de colores
        const maxCount = d3.max(Array.from(festivalCountByComunidad.values()));
        
        // Creamos el contenedor SVG para la leyenda del mapa
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(750, 50)");
        
        // Creamos una escala de colores: de dorado (pocos festivales) a rojo (muchos festivales)
        const colorScale = d3.scaleLinear()
            .domain([0, maxCount])        // Rango de datos: de 0 al máximo
            .range(["#FFD700", "#ff2800"]); // Rango de colores: dorado a rojo

        // Creamos las formas del mapa - una por cada comunidad autónoma
        svg.selectAll("path")
            .data(features)               // Asociamos cada feature con un elemento path
            .enter().append("path")       // Creamos elementos path para nuevos datos
            .attr("d", path)              // Generamos la forma geográfica usando nuestro generador
            .attr("fill", function(d) {   // Asignamos color basado en número de festivales
                const comunidadNombre = normalize(d.properties.NAME_1);
                const count = festivalCountByComunidad.get(comunidadNombre) || 0;
                return colorScale(count); // Más festivales = color más rojo
            })
            .attr("stroke", "#333")       // Borde gris oscuro para separar regiones
            // *** EVENTO CLICK: Síntesis de voz cuando se hace clic en una región ***
            .on("click", function(event, d) {
                // Obtenemos el nombre normalizado y el conteo de festivales
                const comunidadNombre = normalize(d.properties.NAME_1);
                const count = festivalCountByComunidad.get(comunidadNombre) || 0;

                // Creamos un objeto de síntesis de voz
                var msg = new SpeechSynthesisUtterance();
                
                // Configuramos el texto que se va a "hablar"
                msg.text = `La comunidad autónoma de ${d.properties.NAME_1} tuvo ${count} festivales`;
                
                // Asignamos la voz personalizada si está disponible
                if (personalizedVoice) {
                    msg.voice = personalizedVoice;
                } else {
                    console.log("Voz personalizada no disponible, usando voz por defecto.");
                }

                // Configuramos parámetros de la voz
                msg.pitch = 1;    // Tono normal (0.1 = grave, 2 = agudo)
                msg.rate = 1;     // Velocidad normal (0.1 = lento, 10 = rápido)

                // Ejecutamos la síntesis de voz
                window.speechSynthesis.speak(msg);
            })
            // Agregamos tooltips (información que aparece al pasar el mouse)
            .append("title")
            .text(function(d) {
                const comunidadNombre = normalize(d.properties.NAME_1);
                const count = festivalCountByComunidad.get(comunidadNombre) || 0;
                return `${d.properties.NAME_1}\nFestivales: ${count}`;
            });

        // *** CREACIÓN DE LEYENDA DE COLORES ***
        // La leyenda ayuda a interpretar qué significan los colores del mapa
        
        // Escala para posicionar elementos de la leyenda verticalmente
        const legendScale = d3.scaleLinear()
            .domain([0, maxCount])    // Rango de datos
            .range([0, 100]);         // Rango de píxeles para la leyenda

        // Configuramos el eje de la leyenda con números
        const legendAxis = d3.axisRight(legendScale)
            .ticks(5)                           // 5 marcas en la leyenda
            .tickFormat(d3.format("d"));        // Formato de números enteros

        // Creamos rectángulos de colores para la leyenda
        legend.selectAll("rect")
            .data(d3.range(0, maxCount + 1))    // Un rectángulo por cada valor posible
            .enter().append("rect")
            .attr("y", d => legendScale(d))     // Posición vertical basada en el valor
            .attr("width", 20)                  // Ancho fijo
            .attr("height", 1)                  // Alto pequeño para crear gradiente
            .attr("fill", d => colorScale(d));  // Color correspondiente al valor

        // Agregamos el eje numérico a la leyenda
        legend.append("g")
            .attr("transform", "translate(20,0)")  // Posicionamos el eje a la derecha
            .call(legendAxis);
        
    }); // Fin de la carga del archivo TopoJSON
}); // Fin de la carga de datos de festivales

