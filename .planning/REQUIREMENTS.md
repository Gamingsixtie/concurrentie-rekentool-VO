# Requirements: Rekentool VO

**Defined:** 2026-03-20
**Core Value:** Scholen en accountmanagers kunnen in minuten een onderbouwde, eerlijke vergelijking maken die zowel financieel als in tijdsbesparing concreet maakt waarom het (nieuwe) Cito-platform de beste keuze is.

## v1 Requirements

### Schoolprofiel

- [ ] **PROF-01**: Gebruiker kan schooltype selecteren (welke niveaus: vmbo-b, vmbo-k, vmbo-gt, havo, vwo)
- [ ] **PROF-02**: Gebruiker kan leerlingaantal invoeren per leerjaar en per niveau
- [ ] **PROF-03**: Gebruiker kan relevante modules selecteren (LVS Rekenen, LVS Taal, Engels, Capaciteitentest, Sociaal-emotioneel, etc.)
- [ ] **PROF-04**: Gebruiker kan scenario kiezen: A (Cito vs. concurrentie) of B (huidig → nieuw Cito-platform)

### Prijsvergelijking (Scenario A)

- [ ] **PRIJS-01**: Gebruiker ziet modulaire prijsvergelijking Cito vs. DIA en JIJ (IEP) op basis van publicatieprijzen
- [ ] **PRIJS-02**: Gebruiker ziet kosten per leerling per aanbieder per module
- [ ] **PRIJS-03**: Gebruiker ziet totaaloverzicht per aanbieder (alle geselecteerde modules)
- [ ] **PRIJS-04**: Gebruiker ziet visuele vergelijking via staafdiagram
- [ ] **PRIJS-05**: Gebruiker ziet onderscheidend vermogen per module: wat biedt Cito dat de concurrent niet biedt (en omgekeerd)
- [ ] **PRIJS-06**: Gebruiker kan inputs aanpassen zonder opnieuw te beginnen (reactieve herberekening)

### Business Case (Scenario B)

- [ ] **BCASE-01**: Gebruiker ziet financieel verschil huidig Cito-platform vs. nieuw Cito-platform per module en totaal
- [ ] **BCASE-02**: Gebruiker kan tijdswinst per taak invoeren of standaardprofiel kiezen (klein/middelgroot/groot VO)
- [ ] **BCASE-03**: Tijdswinst-calculator toont concrete uren bespaard per taak: rechten verlenen, toetsen resetten, inloggen, planning, leerling-/docentkoppeling
- [ ] **BCASE-04**: Gebruiker kan uurtarief instellen (default €50/uur) voor uren-naar-euro's conversie
- [ ] **BCASE-05**: Gebruiker ziet totale waarde overstap: financieel verschil + waarde tijdsbesparing gecombineerd
- [ ] **BCASE-06**: Gebruiker ziet meerjarenprojectie over 1, 3 en 5 jaar met cumulatieve besparing
- [ ] **BCASE-07**: Gebruiker ziet terugverdientijd (break-even punt) visueel weergegeven

### Data & Transparantie

- [ ] **DATA-01**: Elke prijs toont bronvermelding (publicatielijst / handmatig ingevoerd / AI-opgezocht)
- [ ] **DATA-02**: Elke prijs toont verificatiedatum met visuele indicator (groen/oranje/rood op basis van ouderdom)
- [ ] **DATA-03**: Prijzen ouder dan 6 maanden krijgen automatische waarschuwing "mogelijk verouderd"
- [ ] **DATA-04**: Gebruiker kan berekeningsdetails uitklappen per module (toon formule en inputs)
- [ ] **DATA-05**: Alle aannames zijn zichtbaar en aanpasbaar (uurtarief, tijdsschattingen, etc.)
- [ ] **DATA-06**: Publicatieprijs wordt expliciet aangeduid als bovengrens ("werkelijke prijs kan lager zijn")

### Prijsinvoer

- [ ] **INPUT-01**: Gebruiker kan prijzen handmatig invoeren of overschrijven
- [ ] **INPUT-02**: Gebruiker kan prijsdocumenten uploaden (PDF/Excel prijslijsten) voor automatische extractie
- [ ] **INPUT-03**: Gebruiker kan AI-agent inzetten om prijzen op te zoeken

### Modi

- [ ] **MODE-01**: Externe modus: objectieve, neutrale vergelijking op basis van publicatieprijzen, formeel "u"-vorm
- [ ] **MODE-02**: Interne modus: sales-signalen per module ("benadruk prijs" / "focus op kwaliteit" / "focus op meerwaarde")
- [ ] **MODE-03**: Interne modus: gevoeligheidsanalyse die automatisch 10%/20% kortingsscenario's doorrekent
- [ ] **MODE-04**: Interne modus: marktgemiddelde per modulecombinatie (zit Cito boven of onder het gemiddelde)
- [ ] **MODE-05**: Interne modus: mogelijkheid om bekende werkelijke concurrentprijzen in te voeren

### Doelgroep-perspectieven

- [ ] **DOELGR-01**: Coördinator/docent-perspectief: nadruk op tijdswinst in concrete dagelijkse taken
- [ ] **DOELGR-02**: Directie-perspectief: overzicht en onderbouwing voor besluitvorming
- [ ] **DOELGR-03**: Finance/budget-perspectief: euro's, meerjarenprojectie, jaarlijkse budgetimpact

### Export

- [ ] **EXPORT-01**: Gebruiker kan resultaat printen (alle secties uitgevouwen, print-geoptimaliseerde layout)
- [ ] **EXPORT-02**: Gebruiker kan samenvatting kopiëren naar clipboard

### AI-ondersteuning

- [ ] **AI-01**: AI valideert invoer: signaleert onrealistische prijzen, ontbrekende modules, en inconsistenties (bijv. "bij DIA zit module X inbegrepen bij Y")
- [ ] **AI-02**: AI genereert onderscheidend vermogen per module op basis van productinformatie (wat biedt Cito dat concurrent niet biedt, en omgekeerd)
- [ ] **AI-03**: AI schrijft samenvatting van de vergelijking in begrijpelijke taal, afgestemd op doelgroep (coördinator/directie/finance)

### UX & Interactie

- [ ] **UX-01**: Tool is bruikbaar op tablet tijdens schoolbezoek (responsief, touch-friendly)
- [ ] **UX-02**: Invoervelden tonen guidance en defaults (tooltips, "typische waarde" hints)
- [ ] **UX-03**: Volledig Nederlandstalige interface
- [ ] **UX-04**: Cito-huisstijl: Primary #003082, Accent #FF6600, Background #F8F9FA

## v2 Requirements

### Scenario C

- **SCENAR-01**: Concurrentie → nieuw Cito-platform: combinatie van scenario A en B in één overzicht

### Geavanceerde data

- **ADVDATA-01**: Prijsverificatie-workflow voor intern databeheer
- **ADVDATA-02**: Automatische staleness-monitoring dashboard

### Uitgebreide export

- **EXPPLUS-01**: Export naar PDF met Cito-branding
- **EXPPLUS-02**: Opslaan en delen van vergelijkingen via link

## Out of Scope

| Feature | Reason |
|---------|--------|
| Gebruikersaccounts / opgeslagen vergelijkingen | Stateless tool; geen GDPR-complexiteit, geen onderhoudslast |
| Real-time prijsscraping concurrenten | Juridisch twijfelachtig, technisch fragiel, valse nauwkeurigheid |
| Contract-/offertefunctionaliteit | Ander product, andere complexiteit — tool informeert, sluit niet |
| Korting-calculator voor Cito's eigen pricing | Zou interne prijsstrategie blootleggen |
| Feature-voor-feature productmatrix | Onderhoudsnachtmerrie; onderscheidend vermogen in proza is effectiever |
| Meertaligheid | Nederlands-only markt |
| Complexe interactieve datavisualisaties | Doelgroep wil simpele antwoorden, geen analyst-dashboards |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROF-01 | — | Pending |
| PROF-02 | — | Pending |
| PROF-03 | — | Pending |
| PROF-04 | — | Pending |
| PRIJS-01 | — | Pending |
| PRIJS-02 | — | Pending |
| PRIJS-03 | — | Pending |
| PRIJS-04 | — | Pending |
| PRIJS-05 | — | Pending |
| PRIJS-06 | — | Pending |
| BCASE-01 | — | Pending |
| BCASE-02 | — | Pending |
| BCASE-03 | — | Pending |
| BCASE-04 | — | Pending |
| BCASE-05 | — | Pending |
| BCASE-06 | — | Pending |
| BCASE-07 | — | Pending |
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| DATA-04 | — | Pending |
| DATA-05 | — | Pending |
| DATA-06 | — | Pending |
| INPUT-01 | — | Pending |
| INPUT-02 | — | Pending |
| INPUT-03 | — | Pending |
| MODE-01 | — | Pending |
| MODE-02 | — | Pending |
| MODE-03 | — | Pending |
| MODE-04 | — | Pending |
| MODE-05 | — | Pending |
| DOELGR-01 | — | Pending |
| DOELGR-02 | — | Pending |
| DOELGR-03 | — | Pending |
| EXPORT-01 | — | Pending |
| EXPORT-02 | — | Pending |
| AI-01 | — | Pending |
| AI-02 | — | Pending |
| AI-03 | — | Pending |
| UX-01 | — | Pending |
| UX-02 | — | Pending |
| UX-03 | — | Pending |
| UX-04 | — | Pending |

**Coverage:**
- v1 requirements: 43 total
- Mapped to phases: 0
- Unmapped: 43 ⚠️

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
