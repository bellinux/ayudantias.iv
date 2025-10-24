/* 
Chile: https://raw.githubusercontent.com/Fernanda-Bley/Ejemplos-Ayudantias-IIC2026/refs/heads/main/chile_names.csv
Italy: https://raw.githubusercontent.com/Fernanda-Bley/Ejemplos-Ayudantias-IIC2026/refs/heads/main/italy_names.csv
Japan: https://raw.githubusercontent.com/Fernanda-Bley/Ejemplos-Ayudantias-IIC2026/refs/heads/main/japan_names.csv
Australia: https://raw.githubusercontent.com/Fernanda-Bley/Ejemplos-Ayudantias-IIC2026/refs/heads/main/australia_names.csv
*/

const countries = [
  {
    name: "Chile",
    url: "https://raw.githubusercontent.com/Fernanda-Bley/Ejemplos-Ayudantias-IIC2026/refs/heads/main/chile_names.csv",
    container: "chart-chile",
    color: "#FF5733"  // bright orange-red
  },
  {
    name: "Italy",
    url: "https://raw.githubusercontent.com/Fernanda-Bley/Ejemplos-Ayudantias-IIC2026/refs/heads/main/italy_names.csv",
    container: "chart-italy",
    color: "#3399FF"  // nice blue
  },
  {
    name: "Japan",
    url: "https://raw.githubusercontent.com/Fernanda-Bley/Ejemplos-Ayudantias-IIC2026/refs/heads/main/japan_names.csv",
    container: "chart-japan",
    color: "#33CC33"  // green
  },
  {
    name: "Australia",
    url: "https://raw.githubusercontent.com/Fernanda-Bley/Ejemplos-Ayudantias-IIC2026/refs/heads/main/australia_names.csv",
    container: "chart-australia",
    color: "#FFCC00"  // golden yellow
  }
];

function plotTop10(data, containerId, color, title) {
  data.sort((a, b) => +b.Count - +a.Count);
  const top10 = data.slice(0, 10);

  const names = top10.map(d => d["Localized Name"]);
  const values = top10.map(d => +d.Count);

  const trace = {
    x: values.reverse(),
    y: names.reverse(),
    type: 'bar',
    orientation: 'h',
    marker: { color: color }
  };

  const layout = {
    title: { text: `Most common surnames in ${title}`, font: { size: 24 } },  // Add title here
    margin: {l: 120, r: 30, t: 60, b: 30},       // increase top margin for title
    xaxis: {title: 'Count'},
    yaxis: {automargin: true},
    height: 350,
  };

  Plotly.newPlot(containerId, [trace], layout, {responsive: true});
}


    // Load CSV and plot for each country
countries.forEach(({name, url, container, color}) => {
  d3.csv(url).then(data => {
    plotTop10(data, container, color, name);

    // Show Chile by default after loaded
    if (container === 'chart-chile') {
      showChart('chart-chile');
    }
  }).catch(err => {
    document.getElementById(container).innerText = `Failed to load data for ${name}`;
    console.error(err);
  });
});



function showChart(idToShow) {
  document.querySelectorAll('.chart-container').forEach(div => {
    div.style.display = (div.id === idToShow) ? 'block' : 'none';
  });
}


Protobject.Core.onReceived(function(message) {
    if (!message) return;

    // For demo, just show an alert
    alert('Received message: ' + message);

    // Or here you would call your showChart function:
    // showChartForCountry(message);
  });



Protobject.Core.onReceived(function (message) {
  if (message && typeof message === 'string') {
    const country = message.trim().toLowerCase();

    const countryToChartId = {
      chile: 'chart-chile',
      italy: 'chart-italy',
      japan: 'chart-japan',
      australia: 'chart-australia'
    };

    const chartId = countryToChartId[country];

    if (chartId) {
      showChart(chartId);
    }}
});