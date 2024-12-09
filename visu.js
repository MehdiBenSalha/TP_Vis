

// Les variables du jeu de donnes :
const variables = [
    "fixed acidity",
    "volatile acidity",
    "citric acid",
    "residual sugar",
    "chlorides",
    "free sulfur dioxide",
    "total sulfur dioxide",
    "density",
    "pH",
    "sulphates",
    "alcohol"
];



let color, circle, scatterSvg , parallelSvg ,
    HistDisSvg , selectedCol = variables[0] , BinVal = 20 , KernelVal = 1 ;

/* scatterplot */
function scatterPlotMatrix() {
    
    const width = 3100;
    const height = 3100;
    const padding = 45;
    let path;
    const size =
        (width - (variables.length + 1) * padding) / variables.length + padding;

    const x = variables.map((c) =>
        d3
            .scaleLinear()
            .domain(d3.extent(data, (d) => d[c]))
            .rangeRound([padding / 2, size - padding / 2])
    );

    const y = x.map((x) => x.copy().range([size - padding / 2, padding / 2]));

    color = d3
        .scaleOrdinal()
        .domain(data.map((d) => d.Diagnosis))
        .range(["#95d0fc", "#fb9a99"]);

    const axisx = d3.axisBottom().ticks(6).tickSize(size * variables.length);
    const xAxis = (g) =>
        g
            .selectAll("g")
            .data(x)
            .join("g")
            .attr("transform", (d, i) => `translate(${i * size},0)`)
            .each(function (d) {
                return d3.select(this).call(axisx.scale(d));
            })
            .call((g) => g.select(".domain").remove())
            .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));

    const axisy = d3.axisLeft().ticks(6).tickSize(-size * variables.length);
    const yAxis = (g) =>
        g
            .selectAll("g")
            .data(y)
            .join("g")
            .attr("transform", (d, i) => `translate(0,${i * size})`)
            .each(function (d) {
                return d3.select(this).call(axisy.scale(d));
            })
            .call((g) => g.select(".domain").remove())
            .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-padding, 0, width, height]);

    svg.append("style").text(`circle.hidden { fill: #000; fill-opacity: 1; r: 1px; }`);

    svg.append("g").call(xAxis);

    svg.append("g").call(yAxis);

    const cell = svg
        .append("g")
        .selectAll("g")
        .data(d3.cross(d3.range(variables.length), d3.range(variables.length)))
        .join("g")
        .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`);

    cell
        .append("rect")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("x", padding / 2 + 0.5)
        .attr("y", padding / 2 + 0.5)
        .attr("width", size - padding)
        .attr("height", size - padding);

    cell.each(function ([i, j]) {
        const currentPath = d3.select(this)
            .selectAll("circle")
            .data(data.filter((d) => !isNaN(d[variables[i]]) && !isNaN(d[variables[j]])))
            .join("circle")
            .attr("cx", (d) => x[i](d[variables[i]]))
            .attr("cy", (d) => y[j](d[variables[j]]));

        if (i === 0 && j === 1) {
            path = currentPath;
        }
    });

    circle = cell
        .selectAll("circle")
        .attr("r", 3.5)
        .attr("fill-opacity", 0.7)
        .attr("fill", (d) => color(d.Diagnosis));

    brushS(cell, circle, svg, { padding, size, x, y, variables, path });

    svg
        .append("g")
        .style("font", "bold 10px sans-serif")
        .style("pointer-events", "none")
        .selectAll("text")
        .data(variables)
        .join("text")
        .attr("transform", (d, i) => `translate(${i * size},${i * size})`)
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text((d) => d);

    svg.property("value", []);

    scatterSvg = svg;
    document.getElementById("scatterplot_matrix").appendChild(svg.node());

}

/***** Fonction  pour crier les coordonnees paralelles *****/
function parallelCoordinatesPlot() {
    // Constants and configurations
    const width = variables.length * 120;
    const height = 928;
    const marginTop = 20;
    const marginRight = 10;
    const marginBottom = 20;
    const marginLeft = 10;


    const y = new Map(
        variables.map((key) => [
            key,
            d3.scaleLinear().domain(d3.extent(data, (d) => d[key])).range([marginTop, height - marginBottom]),
        ])
    );

    const x = d3.scalePoint(variables, [marginLeft, width - marginRight]);


    color = d3
        .scaleOrdinal()
        .domain(data.map((d) => d.Diagnosis))
        .range(["#95d0fc", "#fb9a99"]);

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto;");

    // Append Legend:
    const legendY = height - marginBottom - 20;
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${0},${legendY})`);

    const legendData = [{ label: "Healthy", color: "#95d0fc" }, { label: "Mesothelioma", color: "#fb9a99" }];

    const legendItem = legend
        .selectAll(".legend-item")
        .data(legendData)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(${i * 100}, 0)`);

    legendItem
        .append("rect")
        .attr("x", 0)
        .attr("width", 12)
        .attr("height", 12)
        .style("fill", (d) => d.color);

    legendItem
        .append("text")
        .attr("x", 20)
        .attr("y", 10)
        .text((d) => d.label)
        .attr("alignment-baseline", "middle");

    // Append lines:
    const line = d3.line()
        .defined(([ , value ]) => value !== null)
        .y(([ key, value ]) => y.get(key)(value))
        .x(([ key ]) => x(key));

    const path = svg.append("g")
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.4)
        .selectAll("path")
        .data(data)
        .join("path")
        .attr("stroke", (d) => color(d.Diagnosis))
        .attr("d", (d) => line(d3.cross(variables, [ d ], (key, d) => [ key, d[key] ])))
        .call((path) => path.append("title").text((d) => d.name));


    const axes = svg.append("g")
        .selectAll("g")
        .data(variables)
        .join("g")
        .attr("transform", (d) => `translate(${x(d)}, 0)`)
        .each(function(d) {
            d3.select(this).call(d3.axisLeft(y.get(d)));
        })
        .call((g) => g.append("text")
            .attr("x", 0)
            .attr("y", marginTop - 6)
            .attr("text-anchor", "middle")
            .attr("fill", "currentColor")
            .text((d) => d))
        .call((g) => g.selectAll("text")
            .clone(true).lower()
            .attr("fill", "none")
            .attr("stroke-width", 5)
            .attr("stroke-linejoin", "round")
            .attr("stroke", "white"));

    brushP(svg, x, y, variables, color, path, marginTop, marginBottom, height, axes)
    parallelSvg = svg;

    const chart = Object.assign(svg.property("value", data).node(), { scales: { color } });

    document.getElementById("parallel_coordinates").appendChild(chart);
}

/***** Fonction  pour crier l'Histogramme et la courbe de densite *****/

// Fonctions de la courbe de densite
function kernelGaussian(bandwidth) {
    return function(v) {
        return Math.exp(-0.5 * (v * v) / (bandwidth * bandwidth)) / (Math.sqrt(2 * Math.PI) * bandwidth);
    };
}
function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(function(x) {
            return [x, d3.mean(V, function(v) { return kernel(x - v); }) *1000 /*: to scale it */];
        });
    };
}

// parametres de set up pour l'histogramme :
const margin = ({ top: 10, right: 20, bottom: 50, left: 80 });
const width = 3000;
const scatter_sq = width * 0.45;
const histoWidth = width * 0.33;
const num_hist = 4;
const histoHeight = (scatter_sq / num_hist) - (6 * num_hist);
let Brushed = data ;

function histogramDensityPlot() {

    const svg = d3.create('svg')
        .attr('width', histoWidth + margin.left + margin.right)
        .attr('height', histoHeight + margin.top + margin.bottom);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)

    //// Dropdown liste des variables  /////////////////////////////
    const dropdown = d3.select("#variables")
        .append("select")
        .classed("form-select mb-3", true)
        .on("change", function () {
            const selectedVariable = this.value;
            selectedCol = selectedVariable ;
            update(selectedVariable, BinVal , KernelVal ,Brushed);
        });

    dropdown.selectAll("option")
        .data(variables)
        .enter().append("option")
        .attr("value", function (d) {
            return d;
        })
        .text(function (d) {
            return d;
        });

    //// Slider pour le nombre de barres + valeur /////////////////////////////
    const slider_bin = d3.select("#bin-slider")
        .append("input")
        .classed("form-range", true)
        .attr("type", "range")
        .attr("min", 1)
        .attr("max", 50)
        .attr("value", 20) // valeur par defaut
        .on("input", function() {
            const selectedBins = +this.value;
            BinVal = selectedBins;
            update(selectedCol, selectedBins, KernelVal, Brushed);
            d3.select("#bin-value").text(selectedBins);
        });

    d3.select("#bin-slider")
        .append("span")
        .attr("id", "bin-value")
        .text(slider_bin.property("value"));

    //// Slider pour la Largeur du noyau gaussien + valeur /////////////////////////////
    const slider_kernel = d3.select("#kernel-slider")
        .append("input")
        .classed("form-range", true)
        .attr("type", "range")
        .attr("min", 1)
        .attr("max", 50)
        .attr("value", 1) // valeur par defaut
        .on("input", function() {
            const selectedKernel = +this.value;
            KernelVal = selectedKernel;
            update(selectedCol, BinVal, selectedKernel, Brushed);
            d3.select("#kernel-value").text(selectedKernel);
        });

    d3.select("#kernel-slider")
        .append("span")
        .attr("id", "kernel-value")
        .text(slider_kernel.property("value"));


    let col = variables[0];

    let x , y ;
    // fonction de mise à jour de l'histogramme et de la densite :
    function update(selectedVar,binsVar , KernelVar , selectedData) {

        col = selectedVar;
        Brushed = selectedData ;
        KernelVal = KernelVar ;

        g.selectAll("*").remove();

        x = d3.scaleLinear()
            .range([0, histoWidth])
            .domain(d3.extent(data, d => d[col])).nice();

        const histogram = d3.bin()
            .value(d => d[col])
            .domain(x.domain())
            .thresholds(binsVar);

         const bins = histogram(data);

        y = d3.scaleLinear()
            .range([histoHeight, 0])
            .domain([0, d3.max(bins, d => d.length)]).nice();

        var filteredBins ;
         if (selectedData === data) filteredBins  = bins ;
        else filteredBins =  histogram(selectedData) ;

        const xAxis = g.append("g")
            .attr("transform", `translate(0, ${histoHeight})`);
        const yAxis = g.append("g");

        const backgroundBars = g.append("g");

        backgroundBars.selectAll("rect")
            .data(bins)
            .join("rect")
            .attr("fill", "#ECECEC")
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => x(d.x1) - x(d.x0) - 1)
            .attr("y", d => y(d.length))
            .attr("height", d => histoHeight - y(d.length));

        const barsGroup = g.append("g")

        const t = svg.transition()
            .ease(d3.easeLinear)
            .duration(0);

        barsGroup.selectAll("rect")
            .data(filteredBins)
            .join("rect")
            .attr("fill", "#ca80e9")
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => x(d.x1) - x(d.x0) - 1)
            .transition(t)
            .attr("y", d => y(d.length))
            .attr("height", d => histoHeight - y(d.length))


        /// courbe de densite  ////////////////////////////////////
        const density = kernelDensityEstimator(kernelGaussian(KernelVar), x.ticks(100))(data.map(d => d[col]));
        const densityCurve = d3.line()
            .x(d => x(d[0]))
            .y(d => y(d[1]));

        const densityLine = g.append("g");

        densityLine.selectAll(".density-path")
            .data([density])
            .join("path")
            .attr("class", "density-path")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("d", densityCurve);

        xAxis.call(d3.axisBottom(x));
        yAxis.call(d3.axisLeft(y).ticks(3))
            .call(g => g.selectAll('.tick line')
                .clone()
                .attr('stroke', '#d3d3d3')
                .attr('x1', 0)
                .attr('x2', histoWidth));
        brushH(g, x, y);
    }


    update(variables[0],20 , 1 , data );
    return Object.assign(svg.property("value", data).node() , { scales: { color } , update });
}



/***** Fonctions de brush *****/
// Pour la matrice de scatterplot
function brushS(cell, circle, svg, { padding, size, x, y, variables, path }) {
    const brush = d3
        .brush()
        .extent([
            [padding / 2, padding / 2],
            [size - padding / 2, size - padding / 2],
        ])
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

    cell.call(brush);

    let brushCell;

    function brushstarted() {
        if (brushCell !== this) {
            d3.select(brushCell).call(brush.move, null);
            brushCell = this;
        }
    }

    function brushed({ selection }, [i, j]) {
        const selectedData = [];
        if (selection) {
            const [[x0, y0], [x1, y1]] = selection;
            circle.classed(
                "hidden",
                (d) =>
                    x0 > x[i](d[variables[i]]) ||
                    x1 < x[i](d[variables[i]]) ||
                    y0 > y[j](d[variables[j]]) ||
                    y1 < y[j](d[variables[j]])
            );

            selectedData.push(
                ...data.filter(
                    (d) =>
                        x0 < x[i](d[variables[i]]) &&
                        x1 > x[i](d[variables[i]]) &&
                        y0 < y[j](d[variables[j]]) &&
                        y1 > y[j](d[variables[j]])
                )
            );
            console.log("Selected Data in Scatter Plot:", selectedData);
        }

        svg.property("value", selectedData).dispatch("input");

        // update des coordonnees paralleles:
        parallelSvg.selectAll("path")
            .style("stroke", (d) =>
                selectedData.includes(d) ? color(d.Diagnosis) : "#FB193D")
            .style("stroke-width", (d) =>
                selectedData.includes(d) ? 2 : 1);

        // update de l'histogramme :
        HistDisSvg.update(selectedCol,BinVal,KernelVal,selectedData);

    }


    function brushended({ selection }) {
        if (selection) return;
        svg.property("value", []).dispatch("input");
        circle.classed("hidden", false);

        parallelSvg.selectAll("path")
            .style("stroke", (d) => (d && d.Diagnosis ? color(d.Diagnosis) : "#FB193D"))
            .style("stroke-width", (d) => (d && d.Diagnosis ? 2 : 1));

        HistDisSvg.update(selectedCol,BinVal,KernelVal,data);

    }
}

//Pour les coordonnees paralleles
function brushP(svg, x, y, variables, color, path, marginTop, marginBottom, height,axes) {
    const brushWidth = 50;
    const brush = d3.brushY()
        .extent([
            [-(brushWidth / 2), marginTop],
            [brushWidth / 2, height - marginBottom]
        ])
        .on("start brush end", brushed);

    axes.call(brush);

    const selections = new Map();

    function brushed({selection}, key) {
        if (selection === null) selections.delete(key);
        else selections.set(key, selection.map(y.get(key).invert));
        const selected = [];
        path.each(function (d) {
            const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
            d3.select(this).style("stroke", active ? color(d.Diagnosis) : "#FB193D");
            if (active) {
                d3.select(this).raise();
                selected.push(d);
            }
        });
        console.log("Selected Data in Parallel Coordinates:", selected);
        svg.property("value", selected).dispatch("input");

        //update de la matrice de scatter plot
        scatterSvg.selectAll("circle").classed("hidden", (d) => !selected.includes(d));

        // update de l'histogramme :
        HistDisSvg.update(selectedCol,BinVal,KernelVal,selected);

    }
}


//Pour l'histogramme
function brushH(g, x, y) {
    const brush = d3.brushX()
        .extent([
            [0, 0],
            [histoWidth, histoHeight]
        ])
        .on("start brush end", brushed)
        .on("end", brushended);

    g.call(brush);

    function brushed({ selection }) {
        const selectedData = [];

        if (selection) {
            const [x0, x1] = selection.map(x.invert);

            selectedData.push(
                ...data.filter((d) => d[selectedCol] >= x0 && d[selectedCol] <= x1)
            );

            console.log("Selected Data in Histogram:", selectedData);
        }

        // Update les coordonnees paralleles
        parallelSvg.selectAll("path")
            .style("stroke", (d) =>
                selectedData.length === 0 || selectedData.includes(d) ? color(d.Diagnosis) : "#FB193D")
            .style("stroke-width", (d) =>
                selectedData.length === 0 || selectedData.includes(d) ? 2 : 1);

        // Update de matrice de scatter plot
        scatterSvg.selectAll("circle")
            .classed("hidden", (d) => selectedData.length === 0 || !selectedData.includes(d));

    }

    function brushended({ selection }) {
        if (selection) return;
        scatterSvg.property("value", []).dispatch("input");
        circle.classed("hidden", false);
    }


}


document.addEventListener("DOMContentLoaded", function () {
    start();
});

function start() {
    scatterPlotMatrix();
    parallelCoordinatesPlot();
    HistDisSvg = histogramDensityPlot();
    document.getElementById("histogram_density").appendChild(HistDisSvg);
}