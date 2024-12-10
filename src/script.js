document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("options").addEventListener("click", () => {
        loadOptionsContent();
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "popupReady") {
            sendResponse({ status: "ready" });
        } else if (request.data) {
            fetchData(request.data);
        }
    });

    function loadOptionsContent() {
        fetch(browser.runtime.getURL("options/index.html"))
            .then(response => response.text())
            .then(html => {
                document.body.innerHTML = html;
                const script = document.createElement("script");
                script.src = browser.runtime.getURL("options/options.js");
                script.defer = true;
                document.body.appendChild(script);
            })
            .catch(error => {
                console.error("Failed to load options content:", error);
            });
    }

    async function fetchData(data) { 
        const storageconfig = await chrome.storage.sync.get(["stats", "showNotabilities"]);
        let selectedConfig;
    
        if(!storageconfig?.stats?.length){
            const rawconfig = await fetch("default.json");
            const configjson = await rawconfig.json();
            await chrome.storage.sync.set(configjson);
            selectedConfig = configjson;
        }
        else selectedConfig = storageconfig;
    
        const selectedStats = selectedConfig.stats;
    
        for (s of selectedStats) {
            document.getElementById("headers").innerHTML += `<th style="width: 70px">${s.name}</th>`;
        }
        if(selectedConfig.showNotabilities) document.getElementById("headers").innerHTML += "<th>Notabilities/Policies</th>";
    
    
        if (data === "Issue page not detected!") {
            document.getElementById("issue-title").innerText = "Issue page not detected!";
            return;
        }
    
        const res = await fetch(`http://www.mwq.dds.nl/ns/results/${data}.html`)
        const restext = await res.text();
        const reshtml = document.createElement("html");
        reshtml.innerHTML = restext;
    
        document.getElementById("issue-title").innerText = reshtml.querySelector("body > h2").innerText;
    
        let tableNodelist = reshtml.querySelector("body > table > tbody").childNodes;
        let tableArray = [];
    
        for (let i = 0; i < tableNodelist.length; i++) {
            tableArray[i] = tableNodelist.item(i);
        }
        tableArray.shift();
    
        for (e of tableArray) {
            if (!e?.innerHTML) continue;
    
            let statArray = e.querySelector("td:nth-child(2)")?.innerText.split("\n");
            let outputhtml = `<tr><td>${e.querySelector("td:nth-child(1)").innerText}</td>`;
            let notabilities = "<td><ul>";
            let enteredStat = [];
            for (stat of statArray) {
                let detectedStat = testStat(selectedStats, stat);
    
                if (detectedStat.index !== -1) {
                    enteredStat[detectedStat.index] = stat.replace(detectedStat.name + " ", "");
                }
                else if (/(adds|removes)/.test(stat)) {
                    notabilities += `<li>` + stat.replace("adds", `<span class=word-positive><b>adds</b></span>`).replace("removes", `<span class=word-negative><b>removes</b></span>`).replace(": ", ": <b>") + "</b></li>";
                }
            }
    
            for (let i = 0; i < selectedStats.length; i++) {
                if (enteredStat[i]) {
                    let mean = parseFloat(enteredStat[i].replace(/(.* \(mean |\))/, ""));
                    let colorclass = selectedStats[i].isPositive ? (mean < 0 ? "background-negative" : "background-positive") : (mean > 0 ? "background-negative" : "background-positive");
                    outputhtml += `<td class=${colorclass}>` + enteredStat[i] + "</td>";
                }
                else {
                    outputhtml += "<td></td>"
                }
            }
    
            notabilities += "</ul></td>";
    
            document.getElementById("table-content").innerHTML += outputhtml + (selectedConfig.showNotabilities ? notabilities : '') + "</tr>";
        }
    
    }
    
    function testStat(selectedStats, stat) {
        let detectedStatName = "";
        let detectedStatIndex = -1;
        for (s of selectedStats) {
            let statRegex = new RegExp(`[0-9]+ ${s.name} \\(mean`);
            if (statRegex.test(stat)) {
                detectedStatName = s.name;
                detectedStatIndex = selectedStats.indexOf(s);
                break;
            }
        }
        return {name: detectedStatName, index: detectedStatIndex};
    }
});













