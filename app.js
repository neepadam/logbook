// Initialize localforage
localforage.config({
    name: 'AnaestheticLogbook'
});

let cases = [];

// Load existing cases from storage
localforage.getItem('cases').then(data => {
    if (data) {
        cases = data;
        renderCases();
        renderCharts();
    }
}).catch(err => console.error(err));

// Form elements
const form = document.getElementById('logbookForm');
const casesDiv = document.getElementById('cases');
const duplicateBtn = document.getElementById('duplicateCase');
const exportBtn = document.getElementById('exportCSV');
const importInput = document.getElementById('importCSV');
const todayBtn = document.getElementById('todayBtn');
const yesterdayBtn = document.getElementById('yesterdayBtn');

// Date buttons
todayBtn.addEventListener('click', () => {
    document.getElementById('date').valueAsDate = new Date();
});
yesterdayBtn.addEventListener('click', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    document.getElementById('date').valueAsDate = d;
});

// Add new case
form.addEventListener('submit', e => {
    e.preventDefault();
    const newCase = getFormData();
    cases.push(newCase);
    saveCases();
    renderCases();
    renderCharts();
    form.reset();
});

// Duplicate last case
duplicateBtn.addEventListener('click', () => {
    if (cases.length === 0) return;
    const lastCase = Object.assign({}, cases[cases.length - 1]);
    cases.push(lastCase);
    saveCases();
    renderCases();
    renderCharts();
});

// Export CSV
exportBtn.addEventListener('click', () => {
    const csv = Papa.unparse(cases);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anaesthetic_logbook.csv';
    link.click();
});

// Import CSV
importInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
        header: true,
        complete: results => {
            cases = cases.concat(results.data);
            saveCases();
            renderCases();
            renderCharts();
        }
    });
});

// Get data from form
function getFormData() {
    return {
        date: document.getElementById('date').value,
        session: document.getElementById('session').value,
        specialty: document.getElementById('specialty').value === 'Other' ? document.getElementById('specialtyOther').value : document.getElementById('specialty').value,
        operation: document.getElementById('operation').value,
        priority: document.getElementById('priority').value,
        asa: document.getElementById('asa').value,
        age: document.getElementById('age').value,
        anaestheticType: document.getElementById('anaestheticType').value,
        airway: document.getElementById('airway').value,
        regional: document.getElementById('regional').value === 'Other' ? document.getElementById('regionalOther').value : document.getElementById('regional').value,
        procedures: getProcedures(),
        teaching: document.getElementById('teaching').value,
        location: document.getElementById('location').value,
        incidents: document.getElementById('incidents').value
    };
}

// Get procedures
function getProcedures() {
    const procedures = [];
    if (document.getElementById('arterialLine').checked) procedures.push('Arterial Line');
    if (document.getElementById('centralLine').checked) procedures.push('Central Line');
    if (document.getElementById('vasCath').checked) procedures.push('Vas Cath');
    if (document.getElementById('gasInduction').checked) procedures.push('Gas Induction');
    if (document.getElementById('nasalIntubation').checked) procedures.push('Nasal Intubation');
    if (document.getElementById('fiberopticAwake').checked) procedures.push('Fibreoptic Awake');
    if (document.getElementById('fiberopticAsleep').checked) procedures.push('Fibreoptic Asleep');
    return procedures.join(', ');
}

// Save cases to localforage
function saveCases() {
    localforage.setItem('cases', cases).catch(err => console.error(err));
}

// Render cases in list
function renderCases() {
    casesDiv.innerHTML = '';
    cases.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = 'case-entry';
        div.innerHTML = `<strong>${c.date} - ${c.operation}</strong> (${c.specialty})<br>
                         Session: ${c.session}, Priority: ${c.priority}, ASA: ${c.asa}, Age: ${c.age}<br>
                         Anaesthetic: ${c.anaestheticType}, Airway: ${c.airway}, Regional: ${c.regional}<br>
                         Procedures: ${c.procedures}<br>
                         Teaching: ${c.teaching}, Location: ${c.location}<br>
                         Incidents: ${c.incidents}`;
        casesDiv.appendChild(div);
    });
}

// Render charts
function renderCharts() {
    // Cases per month
    const casesPerMonth = {};
    cases.forEach(c => {
        const month = c.date ? c.date.substr(0, 7) : 'Unknown';
        casesPerMonth[month] = (casesPerMonth[month] || 0) + 1;
    });
    const months = Object.keys(casesPerMonth).sort();
    const counts = months.map(m => casesPerMonth[m]);

    if (window.chartCasesPerMonth) window.chartCasesPerMonth.destroy();
    const ctx1 = document.getElementById('chartCasesPerMonth').getContext('2d');
    window.chartCasesPerMonth = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Cases per Month',
                data: counts,
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
            }]
        }
    });

    // Anaesthetic type breakdown
    const anaestheticCounts = {};
    cases.forEach(c => {
        anaestheticCounts[c.anaestheticType] = (anaestheticCounts[c.anaestheticType] || 0) + 1;
    });
    const types = Object.keys(anaestheticCounts);
    const typeCounts = types.map(t => anaestheticCounts[t]);

    if (window.chartAnaestheticType) window.chartAnaestheticType.destroy();
    const ctx2 = document.getElementById('chartAnaestheticType').getContext('2d');
    window.chartAnaestheticType = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: types,
            datasets: [{
                data: typeCounts,
                backgroundColor: ['rgba(255,99,132,0.6)','rgba(54,162,235,0.6)','rgba(255,206,86,0.6)','rgba(75,192,192,0.6)']
            }]
        }
    });
}
