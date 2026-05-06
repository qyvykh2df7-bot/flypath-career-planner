# FlyPath Escuelas Spain - Quality Report

## Resumen
- Entidades detectadas: **14**
- Filas con problemas estructurales: **14**
- Entidades listas para importar (sin revisión): **0**
- Entidades que necesitan revisión manual: **14**

## Filas con problemas
- Línea 4: `Adventia, European College of Aeronautics` → pendiente_revision
- Línea 5: `FTE Jerez (Flight Training Europe)` → pendiente_revision
- Línea 6: `European Flyers` → pendiente_revision
- Línea 7: `Quality Fly` → pendiente_revision
- Línea 8: `FlyBy Aviation Academy,ATO,integrado,España,Burgos,Burgos,https://flybyschool.com,flyby-aviation,"Integrated ATPL (14...` → pendiente_revision
- Línea 9: `Canavia Flight School` → pendiente_revision
- Línea 10: `Corflight School,ATO,integrado,España,Madrid (Cuatro Vientos),Madrid-Cuatro Vientos,https://corflightschool.com,corfl...` → pendiente_revision
- Línea 11: `Flyschool Air Academy` → pendiente_revision
- Línea 12: `Airpull Aviation Academy,ATO,integrado y modular,España,Requena (Valencia),Requena (LERE),https://airpullaviationacad...` → pendiente_revision
- Línea 13: `One Air Aviation Academy` → pendiente_revision
- Línea 14: `EAS Barcelona,ATO,integrado,España,Barcelona/Sabadell,Sabadell (LELL),https://easbcn.com,eas-barcelona,ATPL Integrado...` → pendiente_revision
- Línea 15: `Barcelona Flight School,ATO,integrado,España,Sabadell,Sabadell,https://barcelonaflightschool.com,barcelona-flight-sch...` → pendiente_revision
- Línea 16: `World Aviation ATO` → pendiente_revision
- Línea 17: `Universidad Autónoma de Madrid - Grado en Gestión Aeronáutica` → pendiente_revision

## Columnas más incompletas
- `coste_advanced_uprt_si_publicado`: 11/14 (79%)
- `claims_comerciales_destacados`: 10/14 (71%)
- `nombre_grado`: 10/14 (71%)
- `red_flags_documentales`: 10/14 (71%)
- `coste_mcc_joc_si_publicado`: 9/14 (64%)
- `deposito_matricula`: 9/14 (64%)
- `riesgo_marketing_observado`: 9/14 (64%)
- `notas_marketing`: 9/14 (64%)
- `centro_adscrito`: 9/14 (64%)
- `coste_vuelo`: 9/14 (64%)
- `coste_total_estimado`: 9/14 (64%)
- `nota_corte_si_aplica`: 9/14 (64%)
- `preguntas_para_la_escuela`: 9/14 (64%)
- `coste_atpl_si_publicado`: 8/14 (57%)
- `calendario_pagos`: 8/14 (57%)

## Entidades listas para importar
- Ninguna sin revisión previa (dataset requiere saneado manual adicional).

## Entidades que necesitan revisión manual
- Adventia, European College of Aeronautics
- FTE Jerez (Flight Training Europe)
- European Flyers
- Quality Fly
- FlyBy Aviation Academy,ATO,integrado,España,Burgos,Burgos,https://flybyschool.com,flyby-aviation,"Integrated ATPL (14...
- Canavia Flight School
- Corflight School,ATO,integrado,España,Madrid (Cuatro Vientos),Madrid-Cuatro Vientos,https://corflightschool.com,corfl...
- Flyschool Air Academy
- Airpull Aviation Academy,ATO,integrado y modular,España,Requena (Valencia),Requena (LERE),https://airpullaviationacad...
- One Air Aviation Academy
- EAS Barcelona,ATO,integrado,España,Barcelona/Sabadell,Sabadell (LELL),https://easbcn.com,eas-barcelona,ATPL Integrado...
- Barcelona Flight School,ATO,integrado,España,Sabadell,Sabadell,https://barcelonaflightschool.com,barcelona-flight-sch...
- World Aviation ATO
- Universidad Autónoma de Madrid - Grado en Gestión Aeronáutica

## Recomendación V1 (8-12 entidades)
- Recomendadas para V1 **tras revisión manual rápida** (priorizar las de mayor confianza declarada):
- Adventia, European College of Aeronautics
- Airpull Aviation Academy,ATO,integrado y modular,España,Requena (Valencia),Requena (LERE),https://airpullaviationacad...
- Barcelona Flight School,ATO,integrado,España,Sabadell,Sabadell,https://barcelonaflightschool.com,barcelona-flight-sch...
- Canavia Flight School
- Corflight School,ATO,integrado,España,Madrid (Cuatro Vientos),Madrid-Cuatro Vientos,https://corflightschool.com,corfl...
- EAS Barcelona,ATO,integrado,España,Barcelona/Sabadell,Sabadell (LELL),https://easbcn.com,eas-barcelona,ATPL Integrado...
- European Flyers
- FTE Jerez (Flight Training Europe)
- FlyBy Aviation Academy,ATO,integrado,España,Burgos,Burgos,https://flybyschool.com,flyby-aviation,"Integrated ATPL (14...
- Flyschool Air Academy
- One Air Aviation Academy
- Quality Fly

## Campos no recomendados para mostrar al usuario todavía
- `notas_internas`
- `datos_pendientes`
- `preguntas_para_la_escuela`
- `red_flags_documentales`
- `fuentes_secundarias`
- `riesgo_marketing_observado`
- `claims_comerciales_destacados`

## Notas de limpieza aplicada
- Cabecera real detectada en línea 3; se eliminaron líneas artefactuales iniciales.
- Se conservaron valores válidos como `no publicado` y `pendiente de confirmar`.
- Filas ambiguas o rotas marcadas como `pendiente_revision` y con anotación QA en `notas_internas`.
- El CSV limpio es importable técnicamente (estructura tabular consistente), pero necesita revisión manual previa para importación de producción.
