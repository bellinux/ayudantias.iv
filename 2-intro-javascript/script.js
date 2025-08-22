// Definiendo variables que se pueden reasignar

let miVariable = 1;
miVariable = 5;
console.log(miVariable);



let cochayuyo = "";

// Variables que no se pueden reasignar
const miVariableConstante = 1;
// La siguiente línea de código arrojará un error
// miVariableConstante = 4;

// Definiendo strings
const nombre = "Wolverine";

// Concatenación de strings, hay distintas formas de hacerlo
const saludo1 = "¡Hola " + nombre + "!";
const saludo2 = `¡Hola ${nombre}!`;

// Imprimirá solo el nombre
console.log(nombre);
// Imprimirá el saludo completo
console.log(saludo1);
console.log(saludo2);


// Arrays

let arreglo = ["hola", "hello", "bonjour", "hallo"];
//Accedemos al primer elemento de nuestro array
const variable = arreglo[0]; // "hola"
console.log(variable)

// Agregar un nuevo elemento al final del arreglo
arreglo.push("ciao");
const largo = arreglo.length; // 5
console.log(largo)
console.log(arreglo)

// Creando objetos (basicamente son diccionarios)
let mejorPelicula = {
  titulo: "Anora",
  año: 2024,
  genero: ["Drama", "Comedia", "Romántico"],
};

const titulo = mejorPelicula["titulo"]; // "Anora"
const año = mejorPelicula.año; // 2024
const me_gusta_por = mejorPelicula["genero"][0]; // "Drama" 
console.log(titulo)
console.log(año)
console.log(me_gusta_por)

// Podemos agregar nuevos atributos a un objeto
mejorPelicula.director = "Sean Baker";
mejorPelicula["país"] = "Estados Unidos";
mejorPelicula["protagonista"] = "Mikey Madison";


// Imprimir el objeto completo
console.log(mejorPelicula);



// IF, ELSE IF, ELSE

let x = 10;

if (x < 5) {
  console.log("x es menor que 5");
} else if (x === 5) {
  console.log("x es igual a 5");
} else {
  console.log("x es mayor que 5");
}

const edad = 20;
let esMayorDeEdad = (edad >= 18) ? true : false;
console.log("Es mayor de edad = " + esMayorDeEdad); // Output: true


//Ciclos

for (let i = 0; i < 5; i++) {
  console.log("For", + i); 
}




let y = 0;
while (y < 5) {
  console.log("While", + y);
  y++;
}


// Funciones
function sumar9(numero) {
  return numero + 9;
}

console.log("Resultado de la function sumar9(6)):", sumar9(6));
console.log("Resultado de la function sumar9(sumar9(6)):", sumar9(sumar9(6)));


const sumar10 = function (numero) {
  console.log("Sumado")
  return numero + 10;
};
console.log("Resultado de la function sumar10(6)):", sumar10(6));
console.log("Resultado de la function sumar10(sumar9(6)):", sumar10(sumar9(6)));



// Funciones con varios argumentos
function sumar(a, b) {
  return a + b;
}
console.log("Resultado de la function sumar(6, 4)):", sumar(6, 4));
console.log("Resultado de la function sumar(6, sumar9(4)):", sumar(6, sumar9(4)));


// funciones de texto
function saludar(nombre) {
    return "Hola, " + nombre + "!";
}

console.log(saludar("Javiera"));

const saludos = (nombre) => {
    return "Hola, " + nombre + "!";
};

console.log(saludos("Jaime"));



//Otros ejemplos

let a = 10;
let b = 5;
let max_value = Math.max(a, b);
console.log(max_value);


let lista = [1, 5, 3, 9, 2];
max_value = Math.max(...lista);
console.log(max_value);


//console.log(...lista)
