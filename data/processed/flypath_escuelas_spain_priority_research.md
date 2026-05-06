# FlyPath - Investigación detallada bloque prioritario (España)

Fecha de consulta: 2026-05-06  
Base: `data/processed/flypath_escuelas_spain_entity_index.md`  
Alcance: solo entidades prioritarias solicitadas (10).  
Criterio: solo fuentes oficiales (web oficial, PDF oficial, página de programa/precio y universidad oficial cuando aplica).  
Nota metodológica: cuando un dato no aparece explícitamente en fuente oficial, se marca como **no publicado**.

---

## 1) Adventia (USAL)

### 1. Identidad
- nombre: Adventia (European College of Aeronautics)
- slug sugerido: `adventia-usal`
- tipo_entidad: `centro_adscrito` (a USAL)
- ciudad: Salamanca
- comunidad autónoma: Castilla y León
- aeropuerto/base: Salamanca-Matacan (contexto USAL/Adventia)
- web oficial: https://adventia.usal.es

### 2. Formación
- routeType: `university_plus_license`
- programas publicados: Grado en Piloto de Aviacion Comercial y Operaciones Aereas (240 ECTS)
- licencias/resultados publicados: licencia profesional + ATPL frozen en el marco del grado (USAL/Adventia)
- duracion publicada: 4 cursos
- idioma formacion: espanol e ingles (USAL)
- Class 1 requerido cuando: antes de formalizar matricula (excluyente)

### 3. Costes
- precio publicado: **138.219,18 EUR** (documento de precios 2021/22; indica consultar definitivo)
- deposito/matricula: reserva de plaza **500 EUR** (reembolsable solo si no supera reconocimiento medico)
- calendario de pagos: pago unico o fraccionado (45% + tasas secretaria, 35% diciembre, 20% febrero)
- financiacion: no publicado en fuente revisada
- que esta incluido: no publicado de forma cerrada en fuente revisada
- que no esta incluido: tasas AESA y tasas de secretaria (segun PDF)
- notas de coste: documento indica actualizacion por IPC para cursos posteriores

### 4. Condiciones
- contrato antes de pagar: no publicado
- politica de reembolso: reembolso de reserva/matricula primer curso si no supera Class 1 (USAL/Adventia)
- cancelacion: no publicado
- cambios de precio: posible actualizacion por IPC/condiciones universitarias
- proteccion del alumno: no publicado

### 5. Operacion
- flota: no publicado en las fuentes usadas en esta pasada
- simuladores: no publicado en las fuentes usadas en esta pasada
- disponibilidad de aviones: no publicado
- ratio alumno/avion: no publicado
- ratio instructor/alumno: no publicado
- mantenimiento: no publicado

### 6. Empleo / marketing
- apoyo empleo: no publicado de forma contractual en fuente oficial consultada
- convenios: no publicado en esta pasada
- promesas laborales: no publicado
- garantia entrevista: no publicado
- garantia trabajo: no publicado
- claims comerciales relevantes: grado oficial + licencia profesional, acceso a salidas en transporte aereo

### 7. Control de datos
- sourceUrl:
  - https://usal.es/grado-en-piloto-de-aviacion-comercial-y-operaciones-aereas
  - https://adventia.usal.es/wp-content/uploads/2021/03/Grado_Precios21.pdf
- sourceLabel:
  - USAL - Grado oficial
  - Adventia - PDF precios
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - PDF de precios antiguo (2021/22), no necesariamente vigente
  - faltan condiciones contractuales completas
- pendingData:
  - precio vigente por convocatoria
  - contrato y clausulas de cancelacion/reembolso
  - detalle de incluidos/excluidos actualizado
- keyQuestions:
  - Cual es el precio oficial 2026/27 completo y por anualidad?
  - Existe contrato previo con politica de cancelacion detallada?
  - Que costes no academicos quedan fuera (examenes, alojamiento, etc.)?
- internalNotes: buena trazabilidad academica oficial; bloque economico necesita confirmacion vigente.

---

## 2) FTE Jerez

### 1. Identidad
- nombre: FTE Jerez
- slug sugerido: `fte-jerez`
- tipo_entidad: `ATO`
- ciudad: Jerez de la Frontera
- comunidad autónoma: Andalucia
- aeropuerto/base: Jerez (operacion tambien en entorno Malaga/Sevilla/Faro para training)
- web oficial: https://www.ftejerez.com

### 2. Formación
- routeType: `integrated`
- programas publicados: Airline First Officer Programme (AFOP)
- licencias/resultados publicados: ATPL route integrada; opcion doble licencia EASA + UK CAA
- duracion publicada: 62 semanas de entrenamiento
- idioma formacion: ingles (explicitado en requisitos AFOP)
- Class 1 requerido cuando: requisito de admision/aptitud medica

### 3. Costes
- precio publicado: **129.500 EUR** (EASA)
- deposito/matricula: **5.500 EUR** al firmar contrato
- calendario de pagos: 5 plazos + deposito (con semanas de vencimiento publicadas)
- financiacion: no publicado (si "fees and instalments")
- que esta incluido: alojamiento en campus en regimen completo (duracion curso), uniforme (sin zapatos), primer intento examenes, renovacion Class 1, material, landing/navigation fees
- que no esta incluido: posibles horas extra fuera de syllabus
- notas de coste: precio sujeto a cambios; posible ajuste por errores tipograficos o cambios regulatorios

### 4. Condiciones
- contrato antes de pagar: si (deposito due on signature of contract)
- politica de reembolso: no publicado en las paginas revisadas
- cancelacion: no publicado
- cambios de precio: se reservan derecho de ajuste/actualizacion (notas price sheet)
- proteccion del alumno: no publicado

### 5. Operacion
- flota: no publicada de forma cerrada en estas URLs revisadas
- simuladores: FNPT2 + APS MCC A320/B737 (horas publicadas)
- disponibilidad de aviones: no publicado
- ratio alumno/avion: no publicado (solo claim de ratio instructor favorable)
- ratio instructor/alumno: claim cualitativo, sin cifra publicada
- mantenimiento: no publicado

### 6. Empleo / marketing
- apoyo empleo: si (Career Service descrito)
- convenios: partners de aerolineas y visitas de reclutamiento
- promesas laborales: "assist you in landing first job", pools de talento
- garantia entrevista: no publicada como garantia formal
- garantia trabajo: no publicada como garantia contractual
- claims comerciales relevantes: endorsed by airlines; alta colocacion historica

### 7. Control de datos
- sourceUrl:
  - https://www.ftejerez.com/integrated.php
  - https://www.ftejerez.com/price-sheet.php
- sourceLabel:
  - FTEJerez - AFOP page
  - FTEJerez - AFOP Price Sheet
- fecha consulta: 2026-05-06
- dataConfidence: `high`
- dataStatus: `verified`
- redFlags:
  - no se publica politica de reembolso/cancelacion en las paginas revisadas
- pendingData:
  - clausulas contractuales de baja/cancelacion
  - detalle de extras por reentrenamiento
- keyQuestions:
  - Hay politica publica de reembolso por baja voluntaria/medica?
  - Cuales son tarifas exactas de horas adicionales?
  - Existe proteccion economica del alumno ante interrupcion del curso?
- internalNotes: una de las entidades mas completas en estructura de datos.

---

## 3) European Flyers

### 1. Identidad
- nombre: European Flyers
- slug sugerido: `european-flyers`
- tipo_entidad: `ATO`
- ciudad: Madrid / Alicante
- comunidad autónoma: Comunidad de Madrid / Comunitat Valenciana
- aeropuerto/base: Cuatro Vientos / Mutxamel (segun pagina curso)
- web oficial: https://europeanflyers.com

### 2. Formación
- routeType: `mixed`
- programas publicados: Curso integrado ATPL 180h; teoria ATPL modular (pagina separada)
- licencias/resultados publicados: CPL(A) + teoria ATPL (ATPL frozen)
- duracion publicada: 20-24 meses (faq del curso ATPL integrado)
- idioma formacion: no publicado de forma explicita (si prueba de ingles B2)
- Class 1 requerido cuando: requisito de matriculacion

### 3. Costes
- precio publicado: **85.000 EUR** (ATPL integrado 180h; condiciones vinculadas a diptico)
- deposito/matricula: no publicado explicitamente en pagina revisada
- calendario de pagos: no publicado
- financiacion: si (acuerdos con entidades; Ibercaja/La Caixa enlazados)
- que esta incluido: iPad, material didactico, material vuelo, uniforme, reconocimiento medico inicial + renovacion, tasas examen teorico y vuelo 1er intento, examen ICAO, preparacion entrevistas, costes relacionados al vuelo
- que no esta incluido: no publicado de forma cerrada
- notas de coste: pagina remite a "condiciones de oferta" en PDF

### 4. Condiciones
- contrato antes de pagar: no publicado
- politica de reembolso: no publicado
- cancelacion: no publicado
- cambios de precio: no publicado (mas alla de vigencia de oferta)
- proteccion del alumno: no publicado

### 5. Operacion
- flota: Cessna 172 G1000 y Diamond DA42 NG (tabla curso)
- simuladores: G1000 trainer, ALSIM C172 FNPT-I, ALSIM DA42 FNPT-II, A320 MCC APS
- disponibilidad de aviones: no publicado
- ratio alumno/avion: no publicado
- ratio instructor/alumno: no publicado
- mantenimiento: no publicado

### 6. Empleo / marketing
- apoyo empleo: curso preparacion entrevistas y seleccion
- convenios: logos/acuerdos mostrados con empresas y actores del sector
- promesas laborales: discurso de "garantia de exito" comercial
- garantia entrevista: no publicada como garantia formal
- garantia trabajo: no publicada como garantia formal
- claims comerciales relevantes: "mas de 30 anos", "centro de referencia"

### 7. Control de datos
- sourceUrl:
  - https://europeanflyers.com/cursos-piloto-avion/curso-piloto-comercial-atpl
  - https://europeanflyers.com/cursos-piloto-avion/teoria-atpl
- sourceLabel:
  - European Flyers - ATPL integrado
  - European Flyers - Teoria ATPL
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - ausencia de politica publica clara de reembolso/cancelacion
  - faltan detalles de calendario de pagos en pagina principal
- pendingData:
  - condiciones economicas completas (deposito/plazos)
  - clausulado contractual previo
- keyQuestions:
  - Se firma contrato antes de pagar matricula? disponible para revision?
  - Cuales son hitos exactos de pago y penalizaciones por baja?
  - Que costes pueden variar fuera de la oferta base?
- internalNotes: buen detalle academico y de incluidos, debil en condiciones legales/publicacion de contrato.

---

## 4) AEROTEC

### 1. Identidad
- nombre: AEROTEC Escuela de Pilotos
- slug sugerido: `aerotec`
- tipo_entidad: `ATO`
- ciudad: Madrid / Sevilla (y presencia en Palma segun web corporativa)
- comunidad autónoma: Comunidad de Madrid / Andalucia / Illes Balears
- aeropuerto/base: Cuatro Vientos / Sevilla / Son Bonet
- web oficial: https://www.aerotec.es

### 2. Formación
- routeType: `mixed`
- programas publicados: curso integrado ATPL; oferta modular/PPL en el ecosistema de cursos
- licencias/resultados publicados: PPL, CPL, IR, SE, ME, radiotelefonista, ATPL teorico, MCC
- duracion publicada: 2 anos (intensivo)
- idioma formacion: no publicado
- Class 1 requerido cuando: requisito de acceso (test fisico-psiquico CIMA)

### 3. Costes
- precio publicado: no publicado en pagina oficial revisada
- deposito/matricula: no publicado
- calendario de pagos: no publicado
- financiacion: no publicado
- que esta incluido: no publicado de forma cerrada
- que no esta incluido: no publicado
- notas de coste: bloque economico ausente en las URLs revisadas

### 4. Condiciones
- contrato antes de pagar: no publicado
- politica de reembolso: no publicado
- cancelacion: no publicado
- cambios de precio: no publicado
- proteccion del alumno: no publicado

### 5. Operacion
- flota: no publicado en la pagina de curso revisada (sí referencias generales en web)
- simuladores: horas simulador en opciones 205h/245h del integrado
- disponibilidad de aviones: no publicado
- ratio alumno/avion: no publicado
- ratio instructor/alumno: no publicado
- mantenimiento: no publicado

### 6. Empleo / marketing
- apoyo empleo: acuerdo exclusivo anunciado con Swiftair
- convenios: Swiftair
- promesas laborales: prioridad de seleccion de antiguos alumnos (claim de la escuela)
- garantia entrevista: no publicada como garantia formal
- garantia trabajo: no publicada como garantia formal
- claims comerciales relevantes: beca excelencia + posible contratacion como instructor

### 7. Control de datos
- sourceUrl:
  - https://aerotec.es/nuestros-cursos/piloto/
  - https://aerotec.es/
- sourceLabel:
  - AEROTEC - Curso integrado
  - AEROTEC - Home
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - ausencia de precio y condiciones publicadas del curso en pagina revisada
- pendingData:
  - precio oficial y plazos
  - contrato/reembolso/cancelacion
  - incluidos/no incluidos
- keyQuestions:
  - Cual es precio vigente de opcion 205h y 245h?
  - Cuales son clausulas de reembolso y cambios de precio?
  - Que incluye exactamente la matricula?
- internalNotes: fuerte en estructura academica, flojo en bloque economico/legal.

---

## 5) One Air

### 1. Identidad
- nombre: One Air Aviacion
- slug sugerido: `one-air`
- tipo_entidad: `ATO`
- ciudad: Malaga
- comunidad autónoma: Andalucia
- aeropuerto/base: Malaga Internacional + La Axarquia (segun web)
- web oficial: https://www.oneair.es

### 2. Formación
- routeType: `mixed`
- programas publicados: Integrated ATPL, Airline Pilot Programme ATPL, International Airline Pilot University Programme ATPL
- licencias/resultados publicados: CPL + ATPL frozen + habilitaciones (segun programa)
- duracion publicada: 16-24 meses (segun programa/FAQ)
- idioma formacion: bilingue (claims en web)
- Class 1 requerido cuando: requisito de acceso

### 3. Costes
- precio publicado:
  - Integrated ATPL: **86.500 EUR**
  - Airline Pilot Programme: **desde 79.500 EUR** (precio promocional; precio final indicado 92.500 EUR)
  - International Airline Pilot University Programme: **132.500 EUR**
- deposito/matricula: no publicado explicitamente
- calendario de pagos: pagos aplazados al 0% (sin cronograma detallado publico)
- financiacion: si (0%, convenios bancarios, financiacion a medida)
- que esta incluido: muy detallado por programa (tasas 1ra convocatoria, material, varios cursos/habilitaciones, seguros segun programa)
- que no esta incluido: alojamiento y desplazamiento (FAQ)
- notas de coste: precios con promociones y condiciones; recomiendan confirmar detalle final

### 4. Condiciones
- contrato antes de pagar: no publicado explicitamente en fuente revisada
- politica de reembolso: no publicado
- cancelacion: no publicado
- cambios de precio: publicado que hay promociones/plazas limitadas
- proteccion del alumno: seguro de estudios/licencia (claim comercial)

### 5. Operacion
- flota: >30 aeronaves (Diamond, Cirrus, Tecnam)
- simuladores: A320/B737 FTD, FNPT II ALSIM, Redbird Xwind, SimLab
- disponibilidad de aviones: claim de alta disponibilidad, sin KPI numerico publico
- ratio alumno/avion: no publicado
- ratio instructor/alumno: no publicado
- mantenimiento: centro de mantenimiento propio (claim)

### 6. Empleo / marketing
- apoyo empleo: preparacion entrevistas + departamento pilot recruitment
- convenios: no listados con clausulas publicas en estas fuentes
- promesas laborales: "garantia de trabajo por contrato" (claim comercial destacado)
- garantia entrevista: no publicada formalmente
- garantia trabajo: se anuncia; condiciones detalladas no publicadas en pagina general
- claims comerciales relevantes: multiples reconocimientos, infraestructura premium

### 7. Control de datos
- sourceUrl:
  - https://www.oneair.es/curso-piloto-comercial/
  - https://www.oneair.es/curso-atpl-airline-pilot-programme/
- sourceLabel:
  - One Air - CPL/ATPL programas y precios
  - One Air - articulo/licencia ATPL
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - parte de info viene en formato marketing/blog
  - no se publica politica contractual de reembolso/cancelacion
- pendingData:
  - contrato y condiciones de la "garantia de trabajo"
  - calendario de pagos exacto por programa
  - politicas de baja/cambios de precio aplicables
- keyQuestions:
  - Se puede compartir contrato tipo previo a matricula?
  - Cuales son supuestos exactos y limites de la garantia laboral?
  - Que cargos adicionales pueden aparecer fuera del precio publicado?
- internalNotes: gran densidad de datos operativos y de precio, pero falta clausulado legal detallado.

---

## 6) EAS Barcelona

### 1. Identidad
- nombre: EAS Barcelona
- slug sugerido: `eas-barcelona`
- tipo_entidad: `ATO`
- ciudad: Barcelona / Sabadell
- comunidad autónoma: Catalunya
- aeropuerto/base: Sabadell
- web oficial: https://easbcn.com

### 2. Formación
- routeType: `mixed`
- programas publicados: integrado ATPL(A), ATPL teorico modular + cursos CPL/IR/MEP
- licencias/resultados publicados: CPL + SEP/MEP/IR + MCC; teoria ATPL acreditada tras examenes
- duracion publicada: integrado 16 meses; teoria ATPL modular 32 semanas
- idioma formacion: no publicado
- Class 1 requerido cuando: requisito de entrada

### 3. Costes
- precio publicado: no publicado en web oficial consultada
- deposito/matricula: pago de matricula requerido en inscripcion (sin importe)
- calendario de pagos: no publicado
- financiacion: no publicado explicitamente
- que esta incluido: fase teorica/vuelo, tasas aterrizaje, tasas examenes 1ra convocatoria, material escolar, iPad, uniforme, ICAO
- que no esta incluido: no publicado
- notas de coste: sin cifra oficial en URLs consultadas

### 4. Condiciones
- contrato antes de pagar: si (firma de contrato de formacion en matricula)
- politica de reembolso: no publicado
- cancelacion: no publicado
- cambios de precio: no publicado
- proteccion del alumno: no publicado

### 5. Operacion
- flota: menciona aviones nuevos/glass cockpit (sin listado completo en pagina revisada)
- simuladores: FNPT II MEP + FNPT II A320 MCC
- disponibilidad de aviones: no publicado
- ratio alumno/avion: no publicado
- ratio instructor/alumno: no publicado
- mantenimiento: no publicado

### 6. Empleo / marketing
- apoyo empleo: asesoramiento y preparacion para pruebas de seleccion tras licencia
- convenios: no publicados con detalle contractual
- promesas laborales: no publica garantia de trabajo
- garantia entrevista: no publicada
- garantia trabajo: no publicada
- claims comerciales relevantes: orientacion a insercion y habilitaciones de tipo posteriores

### 7. Control de datos
- sourceUrl:
  - https://easbcn.com/curso-de-piloto-de-avion-comercial/
  - https://easbcn.com/c/curso-atpl-modular/
- sourceLabel:
  - EAS - Curso integrado ATPL
  - EAS - ATPL modular teorico
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - precio no publicado de forma oficial en las paginas revisadas
  - faltan condiciones de reembolso/cancelacion
- pendingData:
  - precio y estructura de pagos
  - politica contractual de baja/cambios
- keyQuestions:
  - Cual es el precio oficial vigente del integrado y modular?
  - Se facilita politica de devoluciones por escrito antes de firmar?
  - Que gastos quedan fuera del paquete incluido?
- internalNotes: base academica clara; faltan piezas economico-legales clave.

---

## 7) Barcelona Flight School (BFS)

### 1. Identidad
- nombre: Barcelona Flight School
- slug sugerido: `barcelona-flight-school`
- tipo_entidad: `ATO`
- ciudad: Sabadell
- comunidad autónoma: Catalunya
- aeropuerto/base: Sabadell
- web oficial: https://barcelonaflightschool.com

### 2. Formación
- routeType: `mixed`
- programas publicados: Integrated ATPL fast track, Modular Plus ATPL, PPL, CPL, IR, MCC, FI
- licencias/resultados publicados: CPL + ME-IR + teoria ATPL (frozen) + APS MCC
- duracion publicada: 18-24 meses (programa completo)
- idioma formacion: no publicado explicitamente en pagina consultada
- Class 1 requerido cuando: requisito de entrada

### 3. Costes
- precio publicado: no publicado en pagina oficial consultada
- deposito/matricula: no publicado
- calendario de pagos: no publicado
- financiacion: no publicado
- que esta incluido: iPad/material online, UPRT avanzado, soporte tutorado (segun descripcion programa)
- que no esta incluido: no publicado
- notas de coste: requiere contacto directo para precio vigente

### 4. Condiciones
- contrato antes de pagar: no publicado
- politica de reembolso: no publicado
- cancelacion: no publicado
- cambios de precio: no publicado
- proteccion del alumno: no publicado

### 5. Operacion
- flota: hasta 5 tipos (C152/P92, C172R-S, P2006T y simuladores asociados)
- simuladores: FNPTII P2006T y FNPTII B737-800NG APS MCC
- disponibilidad de aviones: claim de max flight line availability (sin KPI)
- ratio alumno/avion: no publicado
- ratio instructor/alumno: no publicado
- mantenimiento: no publicado

### 6. Empleo / marketing
- apoyo empleo: menciona preparacion para entrevista aerolinea
- convenios: no publicados con detalle contractual
- promesas laborales: no garantia formal publicada
- garantia entrevista: no publicada
- garantia trabajo: no publicada
- claims comerciales relevantes: fast track y trayectoria de experiencia

### 7. Control de datos
- sourceUrl:
  - https://barcelonaflightschool.com/pilot-training/integrated-airline-transport-pilot-atpl-fast-track-course/
  - https://barcelonaflightschool.com/
- sourceLabel:
  - BFS - Integrated ATPL
  - BFS - Home
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - ausencia de precio publicado
  - sin politica contractual visible en la pagina revisada
- pendingData:
  - precio y pagos por programa
  - terminos de cancelacion/reembolso
- keyQuestions:
  - Precio oficial del integrado y modular 2026?
  - Existe contrato tipo con clausulas de baja?
  - Cuales son los costes adicionales fuera de curso base?
- internalNotes: datos tecnicos del programa bien definidos; economia y condiciones, incompletas.

---

## 8) Canavia

### 1. Identidad
- nombre: Canavia Flight School
- slug sugerido: `canavia`
- tipo_entidad: `ATO`
- ciudad: Gran Canaria / Tenerife
- comunidad autónoma: Canarias
- aeropuerto/base: red Canarias (incluye Gran Canaria y Tenerife)
- web oficial: https://flycanavia.com

### 2. Formación
- routeType: `mixed`
- programas publicados: ATPL integrado (y modular en otras paginas), paquetes Standard/Advanced/First Officer
- licencias/resultados publicados: CPL, IR+PBN, SEP, MEP, ATPL teorico, MCC, UPRT, ICAO
- duracion publicada: 16 meses (integrado)
- idioma formacion: apoyo formativo en ingles (PadPilot); idioma principal no cerrado de forma unica
- Class 1 requerido cuando: requisito de acceso

### 3. Costes
- precio publicado:
  - Integrado Standard: **70.995 EUR**
  - Advanced: **73.095 EUR**
  - First Officer: **95.095 EUR**
- deposito/matricula: no publicado en importe
- calendario de pagos: hasta 15 meses sin intereses
- financiacion: si (BBVA colectivos / Microbank, segun enlaces)
- que esta incluido: 800h teoria, 228h entrenamiento (Standard), tasas examen 13 asignaturas 1er intento, MCC, material PadPilot, pruebas pericia, equipo, ICAO, UPRT
- que no esta incluido: Class 1 aprox 650 EUR, tasas examen posteriores, seguro formacion obligatorio 300 EUR (incluido solo en pago unico)
- notas de coste: incluye opciones con horas adicionales y type rating en paquete First Officer

### 4. Condiciones
- contrato antes de pagar: no publicado explicitamente
- politica de reembolso: no publicado
- cancelacion: no publicado
- cambios de precio: no publicado explicitamente
- proteccion del alumno: no publicado (mas alla de notas de seguro formacion)

### 5. Operacion
- flota: mas de 14 aviones (claim), glass cockpit
- simuladores: Airbus A320, Boeing B737, FNPT-II, G1000
- disponibilidad de aviones: claim favorable, sin KPI
- ratio alumno/avion: no publicado
- ratio instructor/alumno: no publicado
- mantenimiento: mantenimiento propio ES.CAO.026

### 6. Empleo / marketing
- apoyo empleo: enfoque "orientado a aerolineas", no garantia formal publicada
- convenios: no publicados con detalle contractual en la pagina revisada
- promesas laborales: no garantia formal explicita de trabajo en esta URL
- garantia entrevista: no publicada
- garantia trabajo: no publicada
- claims comerciales relevantes: "curso mas completo del mercado", clima y ubicacion clave

### 7. Control de datos
- sourceUrl:
  - https://flycanavia.com/es/curso-de-piloto-profesional-y-transporte-de-lineas-aereas-atpl.html
  - https://flycanavia.com/
- sourceLabel:
  - Canavia - ATPL integrado
  - Canavia - Home
- fecha consulta: 2026-05-06
- dataConfidence: `high`
- dataStatus: `verified`
- redFlags:
  - politica de reembolso/cancelacion no visible en la pagina revisada
- pendingData:
  - contrato y clausulas de baja
  - terminos de cambio de precio por convocatoria
- keyQuestions:
  - Existe contrato tipo previo a pago con politicas de desistimiento?
  - Cual es la politica de devolucion si el alumno abandona?
  - Cuales son cargos recurrentes extra no incluidos?
- internalNotes: muy buen nivel de detalle en precio/incluidos/excluidos.

---

## 9) Aerodynamics Academy

### 1. Identidad
- nombre: Aerodynamics Academy
- slug sugerido: `aerodynamics-academy`
- tipo_entidad: `ATO`
- ciudad: Malaga (con presencia adicional Granada/Madrid en web)
- comunidad autónoma: Andalucia / Comunidad de Madrid
- aeropuerto/base: area Malaga / Velez-Malaga (referencias de escuela)
- web oficial: https://aerodynamics.es

### 2. Formación
- routeType: `integrated` (pagina revisada centrada en integrado)
- programas publicados: Classic Integrated ATPL, Platinum Integrated ATPL
- licencias/resultados publicados: CPL, MEIR, A-UPRT, APS MCC A320 (y FI en Platinum)
- duracion publicada: Classic 16-18 meses; Platinum 20-24 meses
- idioma formacion: requisito ingles B2 (idioma de imparticion no totalmente cerrado en pagina)
- Class 1 requerido cuando: requisito de acceso

### 3. Costes
- precio publicado: no publicado en pagina oficial revisada
- deposito/matricula: no publicado
- calendario de pagos: no publicado
- financiacion: no publicado
- que esta incluido: no publicado de forma economica cerrada (si bloques formativos de cada programa)
- que no esta incluido: no publicado
- notas de coste: requiere solicitud directa

### 4. Condiciones
- contrato antes de pagar: no publicado
- politica de reembolso: no publicado
- cancelacion: no publicado
- cambios de precio: no publicado
- proteccion del alumno: no publicado

### 5. Operacion
- flota: no publicada de forma cerrada en la pagina revisada
- simuladores: se menciona uso de simuladores de ultima generacion y A320 en programas
- disponibilidad de aviones: no publicado
- ratio alumno/avion: no publicado
- ratio instructor/alumno: no publicado
- mantenimiento: no publicado

### 6. Empleo / marketing
- apoyo empleo: talleres CV/entrevistas/orientacion laboral (Platinum)
- convenios: no publicados con detalle en la pagina revisada
- promesas laborales: orientado a empleabilidad, sin garantia formal publicada
- garantia entrevista: no publicada
- garantia trabajo: no publicada
- claims comerciales relevantes: "mejor escuela" y foco en aerolineas europeas

### 7. Control de datos
- sourceUrl:
  - https://aerodynamics.es/curso-de-piloto-comercial/
  - https://aerodynamics.es/
- sourceLabel:
  - Aerodynamics - Curso piloto comercial
  - Aerodynamics - Home
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - sin precio oficial publicado en pagina de programa revisada
  - condiciones contractuales no publicadas
- pendingData:
  - precio, pagos y financiacion
  - clausulas de reembolso/cancelacion
  - detalle operativo cuantitativo (ratios/disponibilidad)
- keyQuestions:
  - Precio oficial Classic y Platinum por convocatoria?
  - Que incluye/no incluye cada programa por contrato?
  - Hay politicas publicas de desistimiento y devolucion?
- internalNotes: academico claro, economico-legal incompleto.

---

## 10) CESDA / URV

### 1. Identidad
- nombre: CESDA / Universitat Rovira i Virgili
- slug sugerido: `cesda-urv`
- tipo_entidad: `universidad`
- ciudad: Reus
- comunidad autónoma: Catalunya
- aeropuerto/base: Reus
- web oficial: https://www.cesda.com

### 2. Formación
- routeType: `university_plus_license`
- programas publicados: Grado en Piloto de Aviacion Comercial y Operaciones Aereas
- licencias/resultados publicados: licencia EASA hasta ATPL frozen + grado universitario
- duracion publicada: grado universitario (4 anos; detalle completo en plan/guia)
- idioma formacion: no publicado de forma cerrada en paginas revisadas (se requiere ampliar con guia academica)
- Class 1 requerido cuando: no explicitado en estas paginas concretas; probable en proceso de admision del grado (pendiente confirmacion documental)

### 3. Costes
- precio publicado: no publicado en cifra exacta en pagina principal (remite a "servicios y precio" descargable)
- deposito/matricula: no publicado en estas paginas (si normativa y manuales enlazados)
- calendario de pagos: fraccionamiento hasta 9 cuotas sin intereses (publicado en financiacion)
- financiacion: si (convenios entidades financieras + contacto dedic ado)
- que esta incluido: se publica referencia a servicios/precio en dossier descargable
- que no esta incluido: no publicado en detalle en estas URLs
- notas de coste: requiere descarga y validacion del documento de precio vigente

### 4. Condiciones
- contrato antes de pagar: no publicado explicitamente (proceso de matricula guiado por secretaria/tutor)
- politica de reembolso: no publicado en pagina consultada
- cancelacion: no publicado
- cambios de precio: no publicado
- proteccion del alumno: existe normativa de matricula enlazada (pendiente extraer clausulas)

### 5. Operacion
- flota: no publicada en detalle en las URLs revisadas
- simuladores: se publica 60h MCC A320 + 55h simulador basico (en presentacion del grado)
- disponibilidad de aviones: no publicado
- ratio alumno/avion: no publicado
- ratio instructor/alumno: no publicado
- mantenimiento: no publicado

### 6. Empleo / marketing
- apoyo empleo: claims de alta insercion y red de contactos
- convenios: menciona apoyo de aerolineas/colegio oficial
- promesas laborales: no garantia contractual de trabajo publicada
- garantia entrevista: no publicada
- garantia trabajo: no publicada
- claims comerciales relevantes: grado oficial + licencia EASA + insercion alta

### 7. Control de datos
- sourceUrl:
  - https://www.cesda.com/grado-piloto/presentacion
  - https://www.cesda.com/grado-piloto/futuros-estudiantes/financiacion
  - https://www.cesda.com/grado-piloto/futuros-estudiantes/preinscripcion-y-matricula
  - https://www.cesda.com/grado-piloto/estudiantes/normativa-de-matricula
- sourceLabel:
  - CESDA - Presentacion grado
  - CESDA - Financiacion
  - CESDA - Preinscripcion y matricula
  - CESDA - Normativa de matricula
- fecha consulta: 2026-05-06
- dataConfidence: `medium`
- dataStatus: `partial`
- redFlags:
  - precio exacto no visible en pagina principal (remite a descargable externo)
  - clausulas de reembolso/cancelacion no extraidas aun de normativa PDF
- pendingData:
  - precio exacto vigente desglosado
  - clausulas de reembolso/cancelacion en normativa PDF
  - detalle operativo cuantitativo (flota/ratios)
- keyQuestions:
  - Cual es precio oficial total y por curso 2026/27?
  - Que politica de devolucion aplica tras matricula?
  - Que costes externos a matricula debe prever el alumno?
- internalNotes: muy relevante para routeType universitario; necesita segunda pasada documental sobre PDF normativo/precios.

---

## Tabla resumen (10 entidades prioritarias)

| entidad | routeType | precio publicado | contrato antes de pagar | reembolso publicado | dataConfidence | dataStatus | recomendacion |
|---|---|---|---|---|---|---|---|
| Adventia (USAL) | university_plus_license | si (PDF historico) | no publicado | parcial (Class 1 no apto) | medium | partial | revision manual |
| FTE Jerez | integrated | si | si | no publicado | high | verified | lista para conversion (con huecos legales) |
| European Flyers | mixed | si | no publicado | no publicado | medium | partial | revision manual |
| AEROTEC | mixed | no publicado | no publicado | no publicado | medium | partial | revision manual |
| One Air | mixed | si | no publicado | no publicado | medium | partial | revision manual |
| EAS Barcelona | mixed | no publicado | si | no publicado | medium | partial | revision manual |
| Barcelona Flight School | mixed | no publicado | no publicado | no publicado | medium | partial | revision manual |
| Canavia | mixed | si | no publicado | no publicado | high | verified | lista para conversion (con huecos legales) |
| Aerodynamics Academy | integrated | no publicado | no publicado | no publicado | medium | partial | revision manual |
| CESDA / URV | university_plus_license | parcial (sin cifra visible en pagina) | no publicado | no publicado | medium | partial | revision manual |

---

## Entidades listas para conversion a `SchoolEntry` (preliminar)

Criterio usado: identidad + formacion + coste principal + fuentes oficiales suficientes para V1 sin inventar.

- FTE Jerez (`high`, `verified`)
- Canavia (`high`, `verified`)

## Entidades que necesitan revision manual antes de conversion

- Adventia (precio vigente y clausulas actuales)
- European Flyers (condiciones legales y pagos detallados)
- AEROTEC (precio y condiciones ausentes)
- One Air (validar condiciones contractuales, promociones y garantia laboral)
- EAS Barcelona (precio y clausulas de reembolso)
- Barcelona Flight School (precio y clausulas)
- Aerodynamics Academy (precio y clausulas)
- CESDA/URV (extraer precio/normativa detallada desde PDFs enlazados)

---

## Campos mas debiles detectados (transversal)

1. Politica de reembolso/cancelacion publicada.
2. Contrato previo accesible antes de pago.
3. Calendario de pagos con hitos exactos.
4. Ratio alumno/avion e instructor/alumno (KPI operativos).
5. Delimitacion clara de incluidos vs no incluidos en coste final.

---

## Recomendaciones de preguntas por email (plantilla de cierre de huecos)

1. **Precio y pagos**
   - Cual es el precio final 2026/27 del programa principal y su desglose?
   - Que deposito/matricula inicial se exige y cuando vence cada pago?

2. **Contrato y proteccion**
   - Comparten contrato tipo antes de la reserva?
   - Cual es la politica de cancelacion y reembolso por baja voluntaria, medica o no aptitud?
   - Hay clausulas de cambios de precio una vez matriculado?

3. **Incluidos / no incluidos**
   - Que tasas, examenes, material, seguros y renovaciones se incluyen exactamente?
   - Que conceptos quedan fuera (alojamiento, transporte, reintentos, horas extra)?

4. **Operacion**
   - Cual es la flota activa dedicada a alumnos CPL/ATPL?
   - Cual es el ratio alumno/avion y alumno/instructor promedio?
   - Cual es el tiempo medio para completar fase de vuelo en condiciones normales?

5. **Salida profesional**
   - Hay convenios firmados con aerolineas? pueden detallar alcance?
   - Si anuncian garantia de trabajo/entrevista, cuales son condiciones exactas y excepciones?

