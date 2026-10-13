# BRADESCARD · Control de cobertura

Adaptación del panel de Control de cobertura. Por ahora utiliza únicamente la base de tiendas y el archivo de asistencias semanal; no requiere Pandape ni MAAT.

Panel compartido: https://vicenteqm.github.io/bradescard-control-cobertura/

Diseño Halloween pixel de los 80 con fondo negro, naranja y morado pastel. Los personajes conservan sus colores originales: calabaza naranja con tallo verde, fantasma y calavera blancos, murciélago morado. Los personajes están animados y el botón Pausar animación permite detenerlos; se respeta la preferencia del sistema de reducir movimiento.

Abre `site/index.html` para consultar el panel local.

## Actualizar

Instala las dependencias de `requirements.txt` y ejecuta:

```powershell
python actualizar.py --base "inputs/BASE DE TIENDAS BRADESCARD (7).xlsx" --asistencia "inputs/ASISTENCIA BRADESCARD.xlsb" --periodo 2026-10
```

El periodo es explícito. Sustituye las copias de los archivos en `inputs` cuando recibas nuevas versiones. Los originales no se modifican. El resultado reemplaza `site/data.js` solamente después de completar la validación.

## Reglas

- Base: hoja `BASE BRADESCARD`. El cruce utiliza SOCIO + NUMERO DE TIENDA.
- La cobertura considera exclusivamente tiendas OPERANDO. ENTREGADA y otros estatus se muestran separados, siguiendo la regla del proyecto anterior.
- Requeridos: PROMOTORES REQUERIDOS + primera columna SUBLIDER, que es numérica.
- Activos: estatus ACTIVO y puesto exacto PROMOTOR, PROMOTOR DE CREDITO (nombre utilizado por la fuente) o SUBLIDER. Se normalizan mayúsculas, acentos y espacios. SUBLIDER 2, TEAM LEADER y cualquier otro puesto quedan excluidos.
- La plantilla y asignación provienen de la pestaña semanal más reciente del mes. Las otras pestañas aportan los días anteriores de esa misma población; no se presenta una plantilla histórica independiente.
- Se identifican personas por nómina + nombre. En días repetidos prevalece la pestaña semanal más reciente, incluso cuando su captura está vacía. No se suman pestañas superpuestas.
- Los encabezados diarios anteriores al mes de cierre semanal se excluyen del periodo. Por ejemplo, 24–30 de septiembre no se atribuyen a octubre.
- Cada día tiene código, Entr, Sal y Hrs Pro. Se leen las primeras tres columnas; Hrs Pro no se utiliza como checada.
- Los códigos sin catálogo se muestran tal como están. Los días vacíos no se convierten en faltas.
- Vacantes y plazas cubiertas se calculan por tienda y perfil. Los excedentes no compensan otros faltantes.
- Se muestran advertencias por personas sin tienda en la base o fuera de operación. No se publican nóminas, nombres ni datos de contacto.

GitHub Pages publica únicamente `site/`. Los archivos Excel originales, las dependencias locales y los registros del proceso quedan excluidos del repositorio. Para publicar cambios usa `python publicar_github.py` con una sesión de GitHub configurada en Git Credential Manager.
