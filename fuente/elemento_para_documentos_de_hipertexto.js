export default ({ propiedades, identificador_del_grupo }) => {
/*
============================================
= Elemento para un documento de hipertexto =
============================================
*/
    /*
    ---------------------
    - Crear el elemento -
    ---------------------
    */
    /* Primero, verificamos que esté definido el tipo de elemento. */  if (!propiedades || !propiedades.tagName) {
        /* Si no lo está, lanzamos un error. */ throw new Error("El tipo de elemento («tagName») es obligatorio") }

    /* Sabiendo el tipo de elemento, lo creamos. */ const elemento = document.createElement(propiedades.tagName)
    /*
    ---------------------------------------
    - Asignar las propiedades al elemento -
    ---------------------------------------
    */
    /* Una vez creado el elemento, */ for (const nombre_de_la_propiedad in propiedades) {
        /* le agregamos las propiedades. */  if (nombre_de_la_propiedad === "tagName") continue

        /* Está prohibido usar las propiedades «innerHTML» */ if (nombre_de_la_propiedad === "innerHTML") throw new Error("El uso de «innerHTML» está prohibido. Usa composición con «childNodes» y «elemento()».")
        /* y «style» porque dan más problemas que beneficios. */if (nombre_de_la_propiedad === "style") throw new Error("El uso de «style» está prohibido. Usa «estilos()» para definir la apariencia.")

        /* Algunas propiedades debemos procesarlas antes de asignarlas al elemento. */ const propiedad = propiedades[nombre_de_la_propiedad]
        /*
        [ Clases ]
        */
        /* Las clases */ if (nombre_de_la_propiedad === "classList") {
            /* las podemos recibir como una lista. */ if (Array.isArray(propiedad)) {
                /* En ese caso, agregamos las clases al elemento */ propiedad.forEach(clase => {
                    /* una por una. */ return elemento.classList.add(clase) } )

                /* También las podemos recibir como una lista con filtros para las clases que queremos o no queremos asignar. */ } else if (typeof propiedad === "object") {
                /* En ese caso, antes de asignar cada clase, */ Object.keys(propiedad).forEach(clase => {
                    /* filtramos solo las que sí queremos */ if (propiedad[clase]) {
                        /* asignar. */ return elemento.classList.add(clase) } } )

            /* También podemos recibir una clase o una lista de clases como un texto. */ } else if (typeof propiedad === "string") {
                /* En ese caso, también le agregamos las clases al elemento */ propiedad.split(" ").forEach(clase => {
                    /* una por una. */ if (clase) elemento.classList.add(clase) } )

            /* Si la clase o la lista de clases no es lo que esperamos, lanzamos un error. */ } else { throw new Error("Se esperaba una clase («string») o una lista de clases («array», «object» o «string»)") } continue }
        /*
        [ Datos personalizados ]
        */
        /* Los datos personalizados */ if (nombre_de_la_propiedad === "dataset") {
            /* deben ser una lista. */ if (typeof propiedad !== "object") {
                /* Si no son una lista, lanzamos un error. */ throw new Error("Los datos personalizados («dataset») deben de ser una lista («object»)") }

            /* Teniendo listos los datos, los agregamos */ Object.keys(propiedad).forEach(dato => {
                /* al elemento. */ elemento.dataset[dato] = propiedad[dato]  } ); continue }
        /*
        [ Nodos ]
        */
        /* Los nodos */ if (nombre_de_la_propiedad === "childNodes") {
            /* siempre los procesamos como una lista */ const nodos = Array.isArray(propiedad) ? propiedad : [propiedad]

            /* Si recibimos un nodo */ nodos.forEach(nodo => {
                /* que sea un elemento, */ if (nodo instanceof Node) {
                    /* lo agregamos así como viene. */ elemento.appendChild(nodo) }

                /* Si lo recibimos como un texto o número, */ else if (typeof nodo === "string" || typeof nodo === "number") {
                    /* antes de agregarlo lo convertimos en un nodo de texto. */ elemento.appendChild(document.createTextNode(String(nodo) ) ) }

                /* Si el nodo que recibimos no es lo que esperamos, lanzamos un error. */ else { throw new Error("Los nodos recibidos («childNodes») deben ser elementos («Node»), textos («string») o números («number»)") } } ); continue }
        /*
        [ Otros ]
        */
        /* Cualquier otra propiedad, la asignamos directamente al elemento. */ elemento[nombre_de_la_propiedad] = propiedad }
    /*
    ----------------------
    - Marcar el elemento -
    ----------------------
    */
    /* Debemos marcar el elemento con el identificador de su grupo. */  elemento.dataset.identificadorDelGrupo = identificador_del_grupo

    /* Y listo, ya quedó el elemento. */ return elemento }
