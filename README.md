# Página académica de Esteban Ospino Tafur

Sitio estático (HTML, CSS y JavaScript, sin compilación) listo para GitHub Pages.

## Contenido

| Archivo | Qué es |
|---|---|
| `index.html` | Portada: presentación, resumen de la tesis, CV y contacto |
| `explorador.html` | Explorador interactivo: cuantización toroidal, traslaciones y regularidad elíptica |
| `assets/style.css` | Colores, tipografía y diseño de ambas páginas |
| `assets/site.js` | Cambio de idioma (ES / EN / PT), el toro de la portada y la figura de muestra |
| `assets/explorer.js` | Los cálculos y gráficos del explorador |
| `assets/katex/` | KaTeX 0.16 para las fórmulas (incluido, no depende de internet; licencia MIT) |
| `tesis-pregrado.pdf` | La tesis, enlazada desde la portada y el CV |

## Publicarlo en GitHub Pages

1. Crea una cuenta en GitHub si no tienes una. Tu usuario define la dirección: `eospino12.github.io`.
2. Crea un repositorio **público** llamado exactamente `eospino12.github.io`.
3. En el repositorio: *Add file → Upload files*, arrastra **todo el contenido** de esta carpeta (no la carpeta en sí: `index.html` debe quedar en la raíz) y pulsa *Commit changes*.
4. Ve a *Settings → Pages*. En *Build and deployment* elige *Deploy from a branch*, rama `main`, carpeta `/ (root)` y guarda.
5. En uno o dos minutos la página estará en `https://eospino12.github.io`.

## Datos por completar

Para no publicar espacios vacíos, estos datos se dejaron fuera por ahora:

- Correo: está comentado en la sección Contacto de `index.html` (busca `Correo: descomenta`).
- Año de inicio del pregrado y fechas de Outlier AI, monitoría y divulgación: las celdas `<div class="when"></div>` vacías del CV.
- Institución y cursos de la monitoría.
- Verificar los niveles de portugués (avanzado) e inglés (intermedio).

Si quieres marcar algo pendiente mientras editas, envuélvelo en `<span class="todo">…</span>` y se verá resaltado en amarillo. Recuerda que cada texto existe en tres idiomas (`lang="es"`, `lang="en"`, `lang="pt"`): cambia las tres versiones.

## Editar

- **Textos**: cada párrafo aparece tres veces, uno por idioma, con el atributo `lang`. El botón ES / EN / PT muestra solo el idioma elegido.
- **Fórmulas**: se escriben en LaTeX entre `\( … \)` (en línea) o `\[ … \]` (centradas).
- **Agregar una foto**: pon el archivo en `assets/` y añade `<img src="assets/foto.jpg" alt="Esteban Ospino">` donde quieras.
- **Probar en tu computador**: abre `index.html` en el navegador, o ejecuta `python -m http.server` en la carpeta y entra a `http://localhost:8000`.
