let root = window.location.href;
let languages = {
    "python": true,
    "javascript": true,
    "c#": false,
    "ruby": false
}
let activeLangs = () => Object.entries(languages).filter(entry => entry[1]==true).map(entry => entry[0])

let mergedData;

function mergeData(data) {
    let meta = data[0];
    let langCode = data.slice(1);

    result = {
        "headers": activeLangs(),
        "rows": {}
    }
    let allKeys = new Set(langCode.map(e => Object.keys(e)).reduce((acc, arr) => [...acc, ...arr], []));

    allKeys.forEach(key => {
        result.rows[key] = [meta[key].title]
    })

    allKeys.forEach(key => {
        langCode.forEach(e => {
            try {
                result.rows[key].push(e[key][0])
            } catch (error) {
                result.rows[key].push(["N/A"])
            }
        })
    })
    mergedData = result;
    return result
}

function displayTableBody(data, included_ids = []) {
    html = []
    html.push("<thead>");
    html.push("<th></th>");
    data.headers.forEach(header => {
        html.push(`<th>${header}</th>`);
    });
    html.push("</thead>");
    html.push("<tbody>");
    Object.keys(data.rows).forEach(key => {
        if (included_ids.length && !included_ids.includes(key)) {
            return; //continue
        }
        html.push(`<tr id=${key}>`);
        html.push(`<th>${data.rows[key][0]}</th>`);
        data.rows[key].slice(1).forEach(codeText => {
            html.push(`<td><code>${codeText.join("\n")}</td></code>`);
        })
        html.push(`</tr>`);
    })
    html.push("</tbody>");
    document.querySelector('#main-table').innerHTML = html.join('');
}

function initLangs(){
    html = []
    Object.entries(languages).forEach(entry => {
        lang = entry[0];
        isActive = entry[1];
        html.push(`<div class="lang glass ${isActive? 'active': ''}">${lang}</div>`);
    })
    document.querySelector('#lang-selector').innerHTML = html.join('');
}

function initComparison(){
    Promise.all([
            ...[fetch('https://gist.githubusercontent.com/jaimevp54/b85ca213ce484b1dab56708c51a80f73/raw/4a0431405647aecf1fbc0637cb0d9b52b20b8a09/meta.json')],
            ...activeLangs().map(lang => fetch(`https://gist.githubusercontent.com/jaimevp54/b85ca213ce484b1dab56708c51a80f73/raw/4a0431405647aecf1fbc0637cb0d9b52b20b8a09/${lang}.json`))
    ])
        .then(responses => Promise.all(responses.map(response => response.json())))
        .then(mergeData)
        .then(displayTableBody)
        .then(() => {
            // prepare data so it can be indexed
            let documents = [];
            Object.entries(mergedData.rows).forEach(entry => {
                key = entry[0];
                value = entry[1];
                documents.push({
                    "id": key,
                    "title": value[0],
                    "code": value.slice(1).join(" ")
                })
            })

            const fuse = new Fuse(documents, {
                keys: ['title', 'code']
            })
            document.querySelector('#search').addEventListener('keyup', (event) => {
                let searchTerm = event.target.value;
                matched = fuse.search(searchTerm).map(match => match.item.id);
                displayTableBody(mergedData, matched);
            })
        });
}


initLangs();
initComparison();

document.querySelectorAll("#lang-selector .lang").forEach(element => {
    element.addEventListener('click', (e) => {
        languages[e.target.textContent.toLowerCase()] ^= true; // XOR -> alternate value between true and false
        e.target.classList.toggle('active');
        initComparison();
    })
})
