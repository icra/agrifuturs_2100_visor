const scenarios = {
    present: { label: "Present", source: "agrifutures_2100", suffix: "PRESENT" },
    rcp45: { label: "RCP4.5", source: "agrifutures_cat", suffix: "RCP45" },
    rcp85: { label: "RCP8.5", source: "agrifutures_cat", suffix: "RCP85" },
    ssp245: { label: "SSP2-4.5", source: "agrifutures_2100", suffix: "SSP245" },
    ssp585: { label: "SSP5-8.5", source: "agrifutures_2100", suffix: "SSP585" },
};

// Els dos repositoris fan servir codis diferents per als tipus d'estiu i d'hivern.
const classifications = {
    LLIUR_GEL: { label: "Període lliure de gelades" },
    PRESCOTT: { label: "Índex de Prescott" },
    REG_HUM: { label: "Règim d'humitat" },
    TIP_EST: { label: "Tipus d'estiu", cat: "TIPUS_ESTIU" },
    TIP_HIV: { label: "Tipus d'hivern", cat: "TIPUS_HIVER" },
    WINKLER: { label: "Índex de Winkler" },
};

function mapUrl(category, variable, scenarioKey) {
    const { source, suffix } = scenarios[scenarioKey];
    let code = variable;
    let ending = suffix;

    if (category === "climate_classifications") {
        if (scenarioKey === "present") {
            ending = "2020";
        }
        if (source === "agrifutures_cat") {
            code = classifications[variable].cat ?? variable;
        }
    }
    if (category === "nbr") {
        code += "_R";
    }

    return `assets/${source}/${category}/AGRICULTURA_${code}_${ending}.png`;
}

const viewer = document.querySelector("#visor");
const category = viewer.dataset.category;
const climate = category === "climate_classifications";

viewer.innerHTML = `
    <div class="map-variable">
        <label for="variable">${climate ? "Classificació" : "Cultiu"}</label>
        <select id="variable"></select>
    </div>
    <div class="comparison" hidden>
        <div class="map-panel">
            <label for="scenario-1">Escenari del mapa 1</label>
            <select id="scenario-1"></select>
            <div class="map-result"></div>
        </div>
        <div class="map-panel">
            <label for="scenario-2">Escenari del mapa 2</label>
            <select id="scenario-2"></select>
            <div class="map-result"></div>
        </div>
    </div>`;

const variable = viewer.querySelector("#variable");
const comparison = viewer.querySelector(".comparison");
variable.add(new Option(climate ? "Tria una classificació" : "Tria un cultiu", ""));
const variables = climate
    ? Object.entries(classifications).map(([code, { label }]) => [code, label])
    : cultius;
for (const [code, label] of variables) {
    variable.add(new Option(label, code));
}

function updateMap(select, result) {
    if (!variable.value) {
        result.replaceChildren();
        return;
    }

    const caption = `${variable.selectedOptions[0].text} · ${scenarios[select.value].label}`;
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.textContent = "Carregant el mapa…";
    result.replaceChildren(status);

    const map = new Image();
    map.alt = caption;
    map.addEventListener("load", () => status.replaceWith(map), { once: true });
    map.addEventListener("error", () => {
        status.textContent = `Mapa no disponible (${caption}).`;
    }, { once: true });
    map.src = mapUrl(category, variable.value, select.value);
}

const refreshMaps = Array.from(viewer.querySelectorAll(".map-panel"), (panel, index) => {
    const select = panel.querySelector("select");
    const result = panel.querySelector(".map-result");
    for (const [key, { label }] of Object.entries(scenarios)) {
        select.add(new Option(label, key));
    }
    select.value = index === 0 ? "present" : "ssp585";
    const refresh = () => updateMap(select, result);
    select.addEventListener("change", refresh);
    return refresh;
});

function updateComparison() {
    comparison.hidden = !variable.value;
    refreshMaps.forEach((refresh) => refresh());
}

variable.addEventListener("change", updateComparison);
updateComparison();
