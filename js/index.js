let rootURL = window.location.href;
let languages = [
    {
        name: "python",
        displayName: "Python",
        isActive: true
    },
    {
        name: "javascript",
        displayName: "JavaScript",
        isActive: true
    },
    {
        name: "csharp",
        displayName: "C#",
        isActive: false
    },
    {
        name: "ruby",
        displayName: "Ruby",
        isActive: false
    }
]
let activeLangs = () => languages.filter(lang => lang.isActive).map(lang => lang.name)
let activeLangDisplayNames = () => languages.filter(lang => lang.isActive).map(lang => lang.displayName)

let mergedData;
function htmlEntityEncode(str){
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mergeData(data) {
    let meta = data[0];
    let langCode = data.slice(1);

    result = {
        "headers": activeLangDisplayNames(),
        "rows": {}
    }
    let allKeys = new Set(langCode.map(e => Object.keys(e)).reduce((acc, arr) => [...acc, ...arr], []));

    Object.keys(meta).forEach(key => {
        if (allKeys.has(key)){
            result.rows[key] = [meta[key].title]
            langCode.forEach(e => {
                try {
                    result.rows[key].push(e[key][0] || [])
                } catch (error) {
                    result.rows[key].push([])
                }
            })
        }
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
        data.rows[key].slice(1).forEach((codeText, index) => {
            html.push(`<td><code class="${activeLangs()[index]}">${htmlEntityEncode(codeText.join("\n"))}</td></code>`);
        })
        html.push(`</tr>`);
    })
    html.push("</tbody>");

    document.querySelector('#main-table').innerHTML = html.join('');
    document.querySelectorAll('code').forEach((block) => {
        hljs.highlightBlock(block);
    });
}

function initLangs(){
    html = []
    languages.forEach(lang => {
        html.push(`<div id="${lang.name}" class="lang glass ${lang.isActive? 'active': ''}">${lang.displayName}</div>`);
    })
    document.querySelector('#lang-selector').innerHTML = html.join('');
}

function initComparison(){
    Promise.all([
            ...[fetch(`${rootURL}dictionaries/meta.json`)],
            ...activeLangs().map(lang => fetch(`${rootURL}dictionaries/${lang}.json`))
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
        let index = languages.findIndex(lang => lang.name==e.target.id);
        languages[index].isActive ^= true; // XOR -> alternate value between true and false
        e.target.classList.toggle('active');
        initComparison();
    })
})
