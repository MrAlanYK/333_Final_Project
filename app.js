// Global variables
var allData = [];
var filteredData = [];
var selectedData = [];
// var samplingEnabled = true; // sampling disabled for now
var samplingEnabled = false;
var bmiRangeDefaults = {min: 15, max: 40};

function mapExperienceLevel(val) {
    var num = parseFloat(val);
    if (isNaN(num)) return 'All';
    if (num < 2) return 'Beginner';
    if (num < 3) return 'Intermediate';
    return 'Advanced';
}

function syncAgeRange(changedId) {
    var ageMinEl = document.getElementById('age-min');
    var ageMaxEl = document.getElementById('age-max');
    var minVal = +ageMinEl.value;
    var maxVal = +ageMaxEl.value;

    if (minVal > maxVal) {
        if (changedId === 'age-min') {
            maxVal = minVal;
            ageMaxEl.value = maxVal;
        } else {
            minVal = maxVal;
            ageMinEl.value = minVal;
        }
    }

    document.getElementById('age-range-value').textContent = minVal + ' - ' + maxVal;
}

function syncBmiRange(changedId) {
    var bmiMinEl = document.getElementById('bmi-min');
    var bmiMaxEl = document.getElementById('bmi-max');
    var minVal = +bmiMinEl.value;
    var maxVal = +bmiMaxEl.value;

    if (minVal > maxVal) {
        if (changedId === 'bmi-min') {
            maxVal = minVal;
            bmiMaxEl.value = maxVal;
        } else {
            minVal = maxVal;
            bmiMinEl.value = minVal;
        }
    }

    document.getElementById('bmi-range-value').textContent = minVal + ' - ' + maxVal;
}

function getBaseData() {
    return selectedData.length > 0 ? selectedData : filteredData;
}

function getDisplayData() {
    var baseData = getBaseData();
    if (!samplingEnabled || selectedData.length > 0 || baseData.length <= 2000) {
        return baseData;
    }

    var step = Math.ceil(baseData.length / 2000);
    var sample = [];
    for (var i = 0; i < baseData.length; i++) {
        if (i % step === 0) {
            sample.push(baseData[i]);
        }
    }
    return sample;
}

// Color schemes
var workoutColors = {
    'HIIT': '#e74c3c',
    'Strength': '#3498db',
    'Cardio': '#2ecc71',
    'Yoga': '#f39c12'
};

var hrZoneColors = ['#d5f4e6', '#ffeaa7', '#fdcb6e', '#e17055', '#d63031'];

// Load data when page loads
d3.csv('Final_data.csv').then(function(data) {
    allData = data.map(function(d) {
        return {
            age: +d.Age,
            gender: d.Gender,
            weight: +d['Weight (kg)'],
            height: +d['Height (m)'],
            calories: +d.Calories_Burned,
            duration: +d['Session_Duration (hours)'],
            workoutType: d.Workout_Type,
            intensity: +d.pct_HRR * 100,
            bmi: +d.BMI,
            experienceLevel: mapExperienceLevel(d.Experience_Level),
            workoutName: d.Workout || d['Workout'],
            targetMuscle: d['Target Muscle Group'],
            difficulty: d.Difficulty_Level,
            equipment: d['Equipment Needed'],
            restingBPM: +d['Resting_BPM'],
            maxBPM: +d['Max_BPM']
        };
    });

    filteredData = allData;
    setBmiSliderBounds();
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    setupFilters();
    updateAllViews();
});

function setBmiSliderBounds() {
    if (!allData.length) return;

    var extent = d3.extent(allData, function(d) { return d.bmi; });
    var minVal = Math.floor(extent[0]);
    var maxVal = Math.ceil(extent[1]);
    bmiRangeDefaults = {min: minVal, max: maxVal};

    var bmiMinEl = document.getElementById('bmi-min');
    var bmiMaxEl = document.getElementById('bmi-max');

    bmiMinEl.min = minVal;
    bmiMaxEl.min = minVal;
    bmiMinEl.max = maxVal;
    bmiMaxEl.max = maxVal;
    bmiMinEl.value = minVal;
    bmiMaxEl.value = maxVal;
    syncBmiRange();
}

function setupFilters() {
    document.getElementById('age-min').addEventListener('input', function() {
        syncAgeRange('age-min');
        applyFilters();
    });
    document.getElementById('age-max').addEventListener('input', function() {
        syncAgeRange('age-max');
        applyFilters();
    });

    document.querySelectorAll('.gender-filter').forEach(function(cb) {
        cb.addEventListener('change', applyFilters);
    });

    document.querySelectorAll('.workout-filter').forEach(function(cb) {
        cb.addEventListener('change', applyFilters);
    });

    document.getElementById('experience-filter').addEventListener('change', applyFilters);

    document.getElementById('bmi-min').addEventListener('input', function() {
        syncBmiRange('bmi-min');
        applyFilters();
    });
    document.getElementById('bmi-max').addEventListener('input', function() {
        syncBmiRange('bmi-max');
        applyFilters();
    });

    // Sampling toggle disabled for now
    // document.getElementById('sampling-toggle').addEventListener('change', function() {
    //     samplingEnabled = this.checked;
    //     selectedData = [];
    //     updateAllViews();
    // });

    document.getElementById('reset-filters').addEventListener('click', resetFilters);

    syncAgeRange();
    syncBmiRange();
}

function applyFilters() {
    var ageMin = +document.getElementById('age-min').value;
    var ageMax = +document.getElementById('age-max').value;
    var bmiMin = +document.getElementById('bmi-min').value;
    var bmiMax = +document.getElementById('bmi-max').value;

    var genders = [];
    document.querySelectorAll('.gender-filter:checked').forEach(function(cb) {
        genders.push(cb.value);
    });

    var workoutTypes = [];
    document.querySelectorAll('.workout-filter:checked').forEach(function(cb) {
        workoutTypes.push(cb.value);
    });
    var experience = document.getElementById('experience-filter').value;

    filteredData = allData.filter(function(d) {
        return d.age >= ageMin && d.age <= ageMax &&
               d.bmi >= bmiMin && d.bmi <= bmiMax &&
               genders.includes(d.gender) &&
               workoutTypes.includes(d.workoutType) &&
               (experience === 'All' || d.experienceLevel === experience);
    });

    selectedData = [];
    updateAllViews();
}

function resetFilters() {
    document.getElementById('age-min').value = 18;
    document.getElementById('age-max').value = 60;
    document.querySelectorAll('.gender-filter').forEach(function(cb) {
        cb.checked = true;
    });
    document.querySelectorAll('.workout-filter').forEach(function(cb) {
        cb.checked = true;
    });
    document.getElementById('experience-filter').value = 'All';
    document.getElementById('bmi-min').value = bmiRangeDefaults.min;
    document.getElementById('bmi-max').value = bmiRangeDefaults.max;
    syncAgeRange();
    syncBmiRange();
    applyFilters();
}

function updateAllViews() {
    updateMetrics();
    updateScatterPlot();
    updateBarChart();
    updateDonutChart();
    updateLineChart();
    updateExerciseTable();
    updateHistograms();
    updateCounts();
}

function updateCounts() {
    document.getElementById('total-count').textContent = allData.length;
    document.getElementById('filtered-count').textContent = filteredData.length;
    document.getElementById('selected-count').textContent = selectedData.length;
}

function updateMetrics() {
    var data = getDisplayData();

    var sumCal = 0;
    var sumInt = 0;
    var sumDur = 0;
    for (var i = 0; i < data.length; i++) {
        sumCal += data[i].calories;
        sumInt += data[i].intensity;
        sumDur += data[i].duration;
    }
    var avgCalories = data.length ? sumCal / data.length : 0;
    var avgIntensity = data.length ? sumInt / data.length : 0;
    var avgDuration = data.length ? sumDur / data.length : 0;

    document.getElementById('avg-calories').textContent = Math.round(avgCalories);
    document.getElementById('avg-intensity').textContent = Math.round(avgIntensity) + '%';
    document.getElementById('avg-duration').textContent = avgDuration.toFixed(2) + ' hrs';
    document.getElementById('workout-count').textContent = data.length;
}

function updateScatterPlot() {
    var container = document.getElementById('scatter-plot');
    container.innerHTML = '';

    var margin = {top: 20, right: 20, bottom: 50, left: 60};
    var width = 1200 - margin.left - margin.right;
    var height = 450 - margin.top - margin.bottom;

    var svg = d3.select('#scatter-plot')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var baseData = getBaseData();
    var dataToPlot = getDisplayData();

    var xScale = d3.scaleLinear()
        .domain([0, d3.max(baseData, function(d) { return d.duration; })])
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(baseData, function(d) { return d.calories; })])
        .range([height, 0]);

    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'axis')
        .call(yAxis);

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .style('text-anchor', 'middle')
        .text('Duration (hours)');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .style('text-anchor', 'middle')
        .text('Calories Burned');

    if (samplingEnabled && selectedData.length === 0 && baseData.length > dataToPlot.length) {
        svg.append('text')
            .attr('x', width - 10)
            .attr('y', 15)
            .style('text-anchor', 'end')
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('Showing ' + dataToPlot.length + ' of ' + baseData.length + ' points');
    }

    var brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on('end', brushed);

    var brushGroup = svg.append('g')
        .attr('class', 'brush')
        .call(brush);

    var circles = svg.selectAll('circle')
        .data(dataToPlot)
        .enter()
        .append('circle')
        .attr('cx', function(d) { return xScale(d.duration); })
        .attr('cy', function(d) { return yScale(d.calories); })
        .attr('r', 4)
        .attr('fill', function(d) { return workoutColors[d.workoutType]; })
        .attr('opacity', 0.5)
        .attr('stroke', function(d) {
            return selectedData.includes(d) ? '#000' : 'none';
        })
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
            var tooltip = document.getElementById('tooltip');
            tooltip.innerHTML = '<strong>' + d.workoutType + '</strong><br>' +
                'Duration: ' + d.duration.toFixed(2) + ' hrs<br>' +
                'Calories: ' + Math.round(d.calories) + '<br>' +
                'Intensity: ' + Math.round(d.intensity) + '%<br>' +
                'Age: ' + d.age + ', ' + d.gender;
            tooltip.style.display = 'block';
            tooltip.style.left = (event.pageX + 10) + 'px';
            tooltip.style.top = (event.pageY - 10) + 'px';
        })
        .on('mouseout', function() {
            document.getElementById('tooltip').style.display = 'none';
        });

    var legend = svg.append('g')
        .attr('transform', 'translate(' + (width - 80) + ', ' + (height - 80) + ')');

    var workoutTypes = ['HIIT', 'Strength', 'Cardio', 'Yoga'];
    workoutTypes.forEach(function(type, i) {
        legend.append('circle')
            .attr('cx', 0)
            .attr('cy', i * 20)
            .attr('r', 5)
            .attr('fill', workoutColors[type]);

        legend.append('text')
            .attr('x', 10)
            .attr('y', i * 20 + 5)
            .style('font-size', '12px')
            .text(type);
    });

    function brushed(event) {
        if (!event.selection) {
            selectedData = [];
            circles.attr('stroke', 'none');
            updateMetrics();
            updateBarChart();
            updateDonutChart();
            updateLineChart();
            updateExerciseTable();
            updateHistograms();
            updateCounts();
            return;
        }

        var x0 = event.selection[0][0];
        var y0 = event.selection[0][1];
        var x1 = event.selection[1][0];
        var y1 = event.selection[1][1];

        selectedData = baseData.filter(function(d) {
            var cx = xScale(d.duration);
            var cy = yScale(d.calories);
            return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
        });

        circles.attr('stroke', function(d) {
            return selectedData.includes(d) ? '#000' : 'none';
        });

        updateMetrics();
        updateBarChart();
        updateDonutChart();
        updateLineChart();
        updateExerciseTable();
        updateHistograms();
        updateCounts();
    }
}

function updateBarChart() {
    var container = document.getElementById('bar-chart');
    container.innerHTML = '';

    var margin = {top: 20, right: 20, bottom: 50, left: 100};
    var containerWidth = container.clientWidth || 350;
    var width = containerWidth - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    var data = getDisplayData();

    var grouped = {};
    for (var i = 0; i < data.length; i++) {
        var w = data[i].workoutType;
        if (!grouped[w]) {
            grouped[w] = {sum: 0, count: 0};
        }
        grouped[w].sum += data[i].calories;
        grouped[w].count += 1;
    }

    var barData = [];
    for (var key in grouped) {
        barData.push({type: key, avgCalories: grouped[key].sum / grouped[key].count});
    }
    barData.sort(function(a, b) { return b.avgCalories - a.avgCalories; });

    var svg = d3.select('#bar-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xScale = d3.scaleLinear()
        .domain([0, d3.max(barData, function(d) { return d.avgCalories; })])
        .nice()
        .range([0, width]);

    var yItems = barData.map(function(d) { return d.type; });
    var yScale = d3.scaleBand()
        .domain(yItems)
        .range([0, height])
        .padding(0.2);

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(xScale)
            .ticks(6)
            .tickFormat(d3.format('~s')));

    svg.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale));

    svg.selectAll('rect')
        .data(barData)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', function(d) { return yScale(d.type); })
        .attr('width', function(d) { return xScale(d.avgCalories); })
        .attr('height', yScale.bandwidth())
        .attr('fill', function(d) { return workoutColors[d.type]; })
        .on('mouseover', function(event, d) {
            var tooltip = document.getElementById('tooltip');
            tooltip.innerHTML = '<strong>' + d.type + '</strong><br>' +
                'Avg Calories: ' + Math.round(d.avgCalories);
            tooltip.style.display = 'block';
            tooltip.style.left = (event.pageX + 10) + 'px';
            tooltip.style.top = (event.pageY - 10) + 'px';
        })
        .on('mouseout', function() {
            document.getElementById('tooltip').style.display = 'none';
        });

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Average Calories Burned');
}

function updateDonutChart() {
    var container = document.getElementById('donut-chart');
    container.innerHTML = '';

    var width = Math.max(container.clientWidth || 0, 450);
    var height = 300;
    var radius = Math.min(width, height) / 2 - 20;

    var data = getDisplayData();

    var zones = [
        {name: 'Very Light', min: 0, max: 50},
        {name: 'Light', min: 50, max: 60},
        {name: 'Moderate', min: 60, max: 70},
        {name: 'Hard', min: 70, max: 80},
        {name: 'Maximum', min: 80, max: 100}
    ];

    var zoneCounts = zones.map(function(zone) {
        var count = 0;
        for (var i = 0; i < data.length; i++) {
            if (data[i].intensity >= zone.min && data[i].intensity < zone.max) {
                count++;
            }
        }
        return {name: zone.name, count: count};
    });

    var svg = d3.select('#donut-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + width/2 + ',' + height/2 + ')');

    var pie = d3.pie()
        .value(function(d) { return d.count; });

    var arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);

    var arcs = svg.selectAll('arc')
        .data(pie(zoneCounts))
        .enter()
        .append('g');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', function(d, i) { return hrZoneColors[i]; })
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
            var tooltip = document.getElementById('tooltip');
            var percent = (d.data.count / data.length * 100).toFixed(1);
            tooltip.innerHTML = '<strong>' + d.data.name + '</strong><br>' +
                'Count: ' + d.data.count + '<br>' +
                'Percentage: ' + percent + '%';
            tooltip.style.display = 'block';
            tooltip.style.left = (event.pageX + 10) + 'px';
            tooltip.style.top = (event.pageY - 10) + 'px';
        })
        .on('mouseout', function() {
            document.getElementById('tooltip').style.display = 'none';
        });

    var legend = svg.append('g')
        .attr('transform', 'translate(' + (radius + 20) + ', ' + (-radius) + ')');

    zones.forEach(function(zone, i) {
        legend.append('rect')
            .attr('x', 0)
            .attr('y', i * 20)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', hrZoneColors[i]);

        legend.append('text')
            .attr('x', 20)
            .attr('y', i * 20 + 12)
            .style('font-size', '11px')
            .text(zone.name);
    });
}

function updateLineChart() {
    var container = document.getElementById('line-chart');
    container.innerHTML = '';

    var margin = {top: 20, right: 100, bottom: 50, left: 60};
    var width = 350 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    var data = getDisplayData();

    var ageGroups = ['18-25', '26-35', '36-45', '46-55', '56+'];

    function getAgeGroup(age) {
        if (age < 26) return '18-25';
        if (age < 36) return '26-35';
        if (age < 46) return '36-45';
        if (age < 56) return '46-55';
        return '56+';
    }

    function buildSeries(gender, color) {
        var genderData = [];
        data.forEach(function(d) {
            if (d.gender === gender) {
                genderData.push(d);
            }
        });
        if (genderData.length === 0) return null;
        var series = [];
        ageGroups.forEach(function(group) {
            var total = 0;
            var count = 0;
            for (var i = 0; i < genderData.length; i++) {
                if (getAgeGroup(genderData[i].age) === group) {
                    total += genderData[i].calories;
                    count++;
                }
            }
            series.push({
                ageGroup: group,
                avgCalories: count > 0 ? total / count : null
            });
        });
        return {gender: gender, color: color, series: series};
    }

    var seriesList = [
        buildSeries('Male', '#3498db'),
        buildSeries('Female', '#e74c3c')
    ].filter(Boolean);

    if (seriesList.length === 0) {
        container.innerHTML = '<p class="empty-state">No data for the selected filters.</p>';
        return;
    }

    var svg = d3.select('#line-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xScale = d3.scalePoint()
        .domain(ageGroups)
        .range([0, width]);

    var allValues = [];
    seriesList.forEach(function(s) {
        s.series.forEach(function(d) {
            if (d.avgCalories !== null) {
                allValues.push(d.avgCalories);
            }
        });
    });
    var maxCalories = d3.max(allValues);
    var minCalories = d3.min(allValues);

    var yScale = d3.scaleLinear()
        .domain([Math.floor(minCalories * 0.95), Math.ceil(maxCalories * 1.05)])
        .range([height, 0]);

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(xScale));

    svg.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale));

    var line = d3.line()
        .x(function(d) { return xScale(d.ageGroup); })
        .y(function(d) { return yScale(d.avgCalories); })
        .defined(function(d) { return d.avgCalories !== null; });

    seriesList.forEach(function(series) {
        svg.append('path')
            .datum(series.series)
            .attr('fill', 'none')
            .attr('stroke', series.color)
            .attr('stroke-width', 2)
            .attr('d', line);

        svg.selectAll('.circle-' + series.gender)
            .data(series.series.filter(function(d) { return d.avgCalories !== null; }))
            .enter()
            .append('circle')
            .attr('cx', function(d) { return xScale(d.ageGroup); })
            .attr('cy', function(d) { return yScale(d.avgCalories); })
            .attr('r', 4)
            .attr('fill', series.color);
    });

    var legend = svg.append('g')
        .attr('transform', 'translate(' + (width + 10) + ', 20)');

    seriesList.forEach(function(series, i) {
        var yOffset = i * 20;
        legend.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', yOffset)
            .attr('y2', yOffset)
            .attr('stroke', series.color)
            .attr('stroke-width', 2);

        legend.append('text')
            .attr('x', 25)
            .attr('y', yOffset + 5)
            .style('font-size', '12px')
            .text(series.gender);
    });

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Age Group');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Avg Calories');
}

function updateExerciseTable() {
    var container = document.getElementById('exercise-table');

    var data = getDisplayData();

    var exerciseMap = new Map();
    data.forEach(function(d) {
        var key = d.workoutName || 'Unknown';
        if (!exerciseMap.has(key)) {
            exerciseMap.set(key, {
                name: key,
                calories: d.calories / (d.duration * 2),
                equipment: d.equipment,
                count: 1,
                typeCounts: new Map([[d.workoutType, 1]])
            });
            return;
        }

        var existing = exerciseMap.get(key);
        existing.calories = (existing.calories * existing.count + d.calories / (d.duration * 2)) / (existing.count + 1);
        existing.count++;
        existing.typeCounts.set(d.workoutType, (existing.typeCounts.get(d.workoutType) || 0) + 1);
    });

    var exerciseData = [];
    exerciseMap.forEach(function(entry) {
        exerciseData.push({
            name: entry.name,
            calories: entry.calories,
            equipment: entry.equipment
        });
    });

    exerciseData.sort(function(a, b) { return b.calories - a.calories; });

    var html = '<table><thead><tr>' +
        '<th>Workout Name</th>' +
        '<th>Cal/30min</th>' +
        '<th>Equipment Needed</th>' +
        '</tr></thead><tbody>';

    exerciseData.forEach(function(d) {
        html += '<tr>' +
            '<td>' + d.name + '</td>' +
            '<td>' + Math.round(d.calories) + '</td>' +
            '<td>' + d.equipment + '</td>' +
            '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function updateHistograms() {
    updateViolinPlot();
}

function updateViolinPlot() {
    var container = document.getElementById('violin-plot');
    container.innerHTML = '';

    var margin = {top: 30, right: 20, bottom: 70, left: 60};
    var width = 750 - margin.left - margin.right;
    var height = 320 - margin.top - margin.bottom;

    var data = getDisplayData();

    var svg = d3.select('#violin-plot')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var variables = [
        {name: 'Calories', key: 'calories', color: '#3498db'},
        {name: 'Duration (hrs)', key: 'duration', color: '#2ecc71'},
        {name: 'Intensity (%)', key: 'intensity', color: '#e74c3c'}
    ];

    var violinWidth = width / variables.length - 30;

    for (var i = 0; i < variables.length; i++) {
        var variable = variables[i];
        var values = [];
        for (var j = 0; j < data.length; j++) {
            values.push(data[j][variable.key]);
        }
        var min = d3.min(values);
        var max = d3.max(values);

        var yScale = d3.scaleLinear()
            .domain([min, max])
            .range([height, 0]);

        var histogram = d3.histogram()
            .domain(yScale.domain())
            .thresholds(25)
            .value(function(d) { return d; });

        var bins = histogram(values);

        var maxNum = d3.max(bins, function(d) { return d.length; });
        var xNum = d3.scaleLinear()
            .range([0, violinWidth / 2])
            .domain([0, maxNum]);

        var xPos = i * (width / variables.length) + (width / variables.length) / 2;

        var area = d3.area()
            .x0(function(d) { return xPos - xNum(d.length); })
            .x1(function(d) { return xPos + xNum(d.length); })
            .y(function(d) { return yScale((d.x0 + d.x1) / 2); })
            .curve(d3.curveCatmullRom);

        svg.append('path')
            .datum(bins)
            .attr('d', area)
            .attr('fill', variable.color)
            .attr('opacity', 0.7)
            .attr('stroke', variable.color)
            .attr('stroke-width', 1);

        svg.append('line')
            .attr('x1', xPos)
            .attr('x2', xPos)
            .attr('y1', yScale(min))
            .attr('y2', yScale(max))
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        var mean = d3.mean(values);
        svg.append('circle')
            .attr('cx', xPos)
            .attr('cy', yScale(mean))
            .attr('r', 4)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + (xPos - violinWidth / 2 - 10) + ', 0)')
            .call(d3.axisLeft(yScale).ticks(4));

        svg.append('text')
            .attr('x', xPos)
            .attr('y', height + 40)
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .text(variable.name);
    }
}
