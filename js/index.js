let mergedData;

function mergeData(data) {
    let meta = data[0];
    let langCode = data.slice(1);

    result = {
        "headers": [
            "Python",
            "JavaScript"
        ],
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
    return html.join('')
}


Promise.all([
        fetch('https://gist.githubusercontent.com/jaimevp54/b85ca213ce484b1dab56708c51a80f73/raw/4a0431405647aecf1fbc0637cb0d9b52b20b8a09/meta.json'),
        fetch('https://gist.githubusercontent.com/jaimevp54/b85ca213ce484b1dab56708c51a80f73/raw/d55ed558f20b9e14e9d20da935cf0027e0b28080/python.json'),
        fetch('https://gist.githubusercontent.com/jaimevp54/b85ca213ce484b1dab56708c51a80f73/raw/7abef739df786cc914ae20fce5a581a85dd726f6/javascript.json')
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
