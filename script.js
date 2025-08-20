tinymce.init({
    selector: '#lecTinyMCE',
    height: 400,
    content_css: '/style.css',
    //entity_encoding: 'raw', /* wenn aktiviert: NICHT anzeigen von &nbsp; */
    plugins: [
        // Core editing features
        'anchor', 'charmap', 'codesample', 'emoticons', 'lists', 'searchreplace', 'table', 'visualblocks', 'wordcount', 'save', 'code'
    ],
    paste_as_text: true, /************* WICHTIG FÜR only <p></p> durch pasten von Text *******************/
    toolbar: 'abc | code | save | highlight | textmarkierung | tagger | undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
});

let categories = [];
const labeledMarker = { label: "", color: "" };
let markingFlag = 0;
let deleteMode = false;
let user = 0;
let modi = 0;
let tolerancePointsValue = 0;
let incorrectAssignValue = 0;
let toleranceValue = 0;
let pointDeduction = false;


// Starte die Initialisierung nach DOM-Load
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initializeHighlighter, 500);

    let btn1 = { name: "Satz", label: "S", color: "red", extra: "Satz", points: 1 };
    let btn2 = { name: "Nominalphrase", label: "NP", color: "green", extra: "Nominalphrase", points: 1 };
    let btn3 = { name: "Verbalphrase", label: "VP", color: "blue", extra: "Verbalphrase", points: 2 };
    //let btn4 = {name:"Verb", label:"v", color:"orange", extra:"Verb"};

    let btnlist = [btn1, btn2, btn3];

    btnlist.forEach(btn => createCategory(btn.name, btn.label, btn.color, btn.extra, btn.points));

});


document.getElementById("goToStudent").addEventListener('click', (e) => {
    e.preventDefault();

    const editor = tinymce.get("lecTinyMCE");

    if (document.getElementById("markierungenLec").innerHTML === "") {
        extractSolution(editor.getBody(), user);
    }


    user = 1;
    pointDeduction = document.getElementById("pntdeduction").checked ? 'true' : 'false';
    document.getElementById('lecturerView').hidden = true;
    document.getElementById('studentView').hidden = false;
    prepStudButtons();
    prepStudExercise();
    initializeHighlighter();

})

document.getElementById("studEingabe").addEventListener('click', (e) => {
    e.preventDefault();

    categories.forEach(category => category.solutionStud = []);
    document.getElementById("ergebnis").innerHTML = "";

    const body = document.getElementById('studentExercise');
    extractSolution(body, 1);
    const report = evaluate(categories)
    console.log(report);
    printEvaluation();
})

document.getElementById('categoryForm').addEventListener('submit', (e) => {
    e.preventDefault(); //verhinder redirect

    const data = new FormData(e.target);
    const name = data.get("name");
    const label = data.get("label");
    const color = data.get("color");
    const extra = data.get("extra");
    const points = data.get("points");

    if (!checkCategoryDuplette(name, label, color)) {
        return;
    } else {
        createCategory(name, label, color, extra, points);
        document.getElementById('categoryForm').reset();
    }

})

document.getElementById("dom-virtualisation").addEventListener('click', (e) => {
    e.preventDefault();

    document.getElementById("dom-virtualisation").textContent = "Übersicht aktualisieren"

    const editor = tinymce.get("lecTinyMCE");
    const isEmpty = document.getElementById("markierungenLec").innerHTML === "";
    if (isEmpty) {
        clearSolutionList(user);
        extractSolution(editor.getBody(), user);
        renderMarkierungen(user);
    } else {
        if (alertUndoChanges()) {
            clearSolutionList(user);
            extractSolution(editor.getBody(), user);
            renderMarkierungen(user);
        } else {
            return;
        }
    }

});


document.getElementById("dom-virtualisationStud").addEventListener('click', (e) => {
    e.preventDefault();

    document.getElementById("dom-virtualisationStud").textContent = "Übersicht aktualisieren"

    const body = document.getElementById("studentExercise");

    clearSolutionList(user);
    extractSolution(body, user);
    renderMarkierungen(user);

});


document.getElementById('evaModis').addEventListener('change', (e) => {
    e.preventDefault();
    const modisSetup = document.querySelector(".modisSetup");
    removeAllChildNodes(modisSetup);

    function setupTolerance() {
        const div = document.createElement("div");

        const tolerance = document.createElement("input");
        tolerance.style = "margin-left: 5px; width:120px;";
        tolerance.placeholder = "Toleranzbereich"
        tolerance.textcontent = "Toleranz";
        tolerance.type = "number";
        tolerance.min = 1;
        tolerance.max = 10;


        const tolerancePointsLabel = document.createElement("label");
        tolerancePointsLabel.textContent = "Bepunktung bei Markierungen im Toleranzbereich: ";
        const tolerancePointsInput = document.createElement("input");
        tolerancePointsInput.type = "number";
        tolerancePointsInput.step = 0.1;
        tolerancePointsInput.min = 0;
        tolerancePointsInput.max = 1;

        div.appendChild(tolerancePointsLabel);
        div.appendChild(tolerancePointsInput);
        div.appendChild(tolerance);
        document.querySelector(".modisSetup").appendChild(div);

        tolerancePointsInput.addEventListener("input", (e) => {
            tolerancePointsValue = parseFloat(e.target.value);
        })

        tolerance.addEventListener("input", (e) => {
            toleranceValue = parseInt(e.target.value);
        })

    }

    function setupIncorrectAssign() {
        const div = document.createElement("div");
        const incorrectAssignPointsLabel = document.createElement("label");
        incorrectAssignPointsLabel.textContent = "Bepunktung bei Markierungen mit falscher Zuweisung: ";
        const incorrectAssignPointsInput = document.createElement("input");
        incorrectAssignPointsInput.type = "number";
        incorrectAssignPointsInput.step = 0.1;
        incorrectAssignPointsInput.min = 0;
        incorrectAssignPointsInput.max = 0.9;
        div.appendChild(incorrectAssignPointsLabel);
        div.appendChild(incorrectAssignPointsInput);
        document.querySelector(".modisSetup").appendChild(div);

        incorrectAssignPointsInput.addEventListener("input", (e) => {
            incorrectAssignValue = parseFloat(e.target.value);
        })
    }

    function resetSetupValues() {
        incorrectAssignValue = 0;
        tolerancePointsValue = 0;
        toleranceValue = 0;
    }

    if (e.target.value === "tolerance-range") {
        console.log(1);
        resetSetupValues();
        setupTolerance();
        modi = 1;
    } else if (e.target.value === "incorrect-assignment") {
        console.log(2);
        setupIncorrectAssign();
        resetSetupValues();
        modi = 2;
    } else if (e.target.value === "all") {
        console.log(3);
        resetSetupValues();
        setupTolerance();
        setupIncorrectAssign();
        modi = 3;
    } else {
        console.log(0);
        resetSetupValues();
        modi = 0;
    }
})


function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function alertUndoChanges() {
    if (confirm("Modifizierte Bepunktung geht verloren.")) {
        return true;
    } else {
        return false;
    }
}

function deleteModeTrigger() {
    deleteMode = !deleteMode;
    if (user === 0) {
        const deleteBtn = document.getElementById("deleteModeBtn");

        deleteBtn.textContent = deleteMode ? "Lösch-Modus beenden" : "Markierung löschen";
        deleteBtn.style.background = deleteMode ? "darkred" : "";
    } else {
        const deleteBtn = document.getElementById("deleteModeBtnStud");
        deleteBtn.textContent = deleteMode ? "Lösch-Modus beenden" : "Markierung löschen";
        deleteBtn.style.background = deleteMode ? "darkred" : "";
    }


    if (deleteMode) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.opacity = "100%";
        });

        labeledMarker.color = null;
        labeledMarker.label = null;
        tinymce.get('lecTinyMCE').contentDocument.body.style.caretColor = "";
    }
}


function createCategory(name, label, color, extra, points) {
    categories.push({ name, label, color, points, extra, solutionLec: [], solutionStud: [] });

    let btn = document.createElement("button");
    btn.className = `category-btn`;
    let textNode = document.createTextNode(name);
    btn.appendChild(textNode);
    btn.style.background = color;
    btn.style.marginRight = "5px";

    document.getElementById("lecButtons").appendChild(btn);

    btn.addEventListener('click', function () {
        const deacBtn = document.querySelectorAll('.active');
        const isActive = btn.classList.contains('active');

        labeledMarker.label = label;
        labeledMarker.color = color;

        deacBtn.forEach(btn => {
            btn.classList.remove('active');
            btn.style.opacity = "100%";
        });

        if (deleteMode) {
            deleteModeTrigger();
        }
        categoryTrigger(!isActive, btn);
        console.log(labeledMarker);
    })
}

function categoryTrigger(isActive, btn) {
    if (isActive) {
        btn.classList.add('active');
        tinymce.get('lecTinyMCE').contentDocument.body.style.caretColor = labeledMarker.color;
        btn.style.opacity = "50%";
    } else {
        btn.classList.remove('active');
        labeledMarker.color = null;
        labeledMarker.label = null;
        tinymce.get('lecTinyMCE').contentDocument.body.style.caretColor = "";
        btn.style.opacity = "100%";
    }
}

function checkCategoryDuplette(name, label, color) {
    const exists = categories.some(category => {
        if (category.name.toLowerCase() === name.toLowerCase()) {
            alert("Bezeichnung existiert bereits");
            return true;
        }
        else if (category.label.toLowerCase() === label.toLowerCase()) {
            alert("Label existiert bereits");
            return true;
        }
        else if (category.color.toLowerCase() === color.toLowerCase()) {
            alert("Farbe existiert bereits");
            return true;
        }
        return false;
    });

    if (!exists) {
        alert("Kategorie wurde gespeichert");
    }
    return !exists;
}

function initializeHighlighter() {
    initHighlightView()
}

function viewFocus() {
    if (user === 0) {
        return tinymce.get('lecTinyMCE');
    } else {
        return document.getElementById('studentExercise');
    }
}

function initHighlightView() {
    const checkEditor = setInterval(() => {
        const editor = viewFocus();

        let editorBody = null;
        user === 0 ? editorBody = editor.getBody() : editorBody = editor;

        if (editor && editorBody) {
            clearInterval(checkEditor);
            console.log("Highlighter initialisiert");

            editorBody.addEventListener("click", function (e) {
                if (deleteMode && e.target.closest('span[data-label]')) {
                    e.preventDefault();
                    e.stopPropagation();
                    removeHighlight(e.target.closest('span[data-label]'));
                }
            }, true);

            mouseSelecting(editorBody);
            shiftSelecting(editorBody);
        }
    }, 1000);
}

function shiftSelecting(editorBody) {
    let shiftSelectingActive = false;
    let highlightLock = false;

    editorBody.addEventListener("keydown", e => {
        if (e.shiftKey) {
            shiftSelectingActive = true;
        }
    }, false);

    editorBody.addEventListener("keyup", e => {
        if (e.key === "Shift" && shiftSelectingActive) {
            if (labeledMarker.label && labeledMarker.color) {
                if (!highlightLock) {
                    highlightLock = true;
                    setTimeout(() => {
                        highlightSelection();
                        collapseSelection();
                        setTimeout(() => highlightLock = false, 200);
                    }, 10);
                }
            }
            shiftSelectingActive = false;
        }
    }, false);
}

function mouseSelecting(editorBody) {
    let highlightLock = false;

    editorBody.addEventListener("mousedown", function () {
        markingFlag = 0;
    }, false)

    editorBody.addEventListener("mousemove", function () {
        markingFlag = 1;
    }, false);

    editorBody.addEventListener("mouseup", function () {
        if (markingFlag === 1 && labeledMarker.label && labeledMarker.color) {
            if (highlightLock) return;
            highlightLock = true;
            setTimeout(() => {
                highlightSelection();
                collapseSelection();
                setTimeout(() =>
                    highlightLock = false, 200);
            }, 10); // Kurze Verzögerung für saubere Selektion
        }
    }, false);
}

function collapseSelection() {
    if (user === 0) {
        const editor = tinymce.get("lecTinyMCE")
        editor.selection.collapse();
    } else {
        const selection = window.getSelection();
        const rng = selection.getRangeAt(0);
        rng.collapse(false);
    }
}

/*
Bedingungen:
- Prüfe ob Range einen Knoten hat.. wenn ja, speichern, und diese einen neuen Knoten als Parent zuweisen

- NOPE Nur ganzes Wort ??? 
- CHECK Nur Verschachtelung - Keine Überlappung
- CHECK Kein Leerzeichen/Kein "" 
- CHECK Erweiterung/Zusammenfassung: Hier müssen "childNodes" extrahiert und neu zugeordnet werden
    - vollständig umschlossen (eine Markierung bekommt ein neuen Elternknoten)
    - vollständig umhüllt (mehrere Markierungen werden umhüllt/zusammengefasst)
        - Umsetzung: es müssen alle "Knoten" ausfinding gemacht werden
        - alle Knoten müssen einer neuen Range zugeordet werden
        - diese Range wird
- CHECK keine Markierung von Block-Level (<p>, <div>, <h1>...) Elementen: köännte zu falschen Rendering führen
    - traversal Durchlauf (DFS) - alle Elemente/Knoten prüfen (nodeType, tagName, ELEMENT_NODE)
- NOPE bei doppel Markierung, Markierung entfernen ?! Wäre nicht schlecht
    */

function highlightSelection() {
    let editor = null;
    let selection = null;
    let rng = null;

    if (user === 0) {
        editor = tinymce.get("lecTinyMCE");
        selection = editor.selection;
        rng = selection.getRng();

        if (selection.getNode().nodeName === "DIV") {
            alert("Block-Element");
            return;
        }

    } else {
        editor = document.getElementById('studentExercise');
        selection = window.getSelection();
        rng = selection.getRangeAt(0);
    }

    if (rng.toString().trim() === "") {
        console.log("leerbereich");
        return;
    }

    if (isSelectionBetweenBracketAndSub()) {
        console.log("bracket sub")
        return;
    }

    if (bracketCounter(rng.toString())) {
        wrapping(rng);
    } else {
        console.log("überlappunt")
        return;
    }
}

/*
negativ = überlappung
positiv = überlappung
0 = korrekt
*/
function bracketCounter(str) {
    let depth = 0;

    for (const ch of str) {
        if (ch === '[') {
            depth++;
        } else if (ch === ']') {
            depth--;

            if (depth < 0) {
                return false;
            }
        }
    }
    return depth === 0;
}

function wrapping(rng) {
    const text = rng.extractContents();

    const wrapperSpan = document.createElement("span");
    wrapperSpan.setAttribute("data-label", labeledMarker.label);
    wrapperSpan.setAttribute("style", `color: ${labeledMarker.color}`);

    const wrapperSub = document.createElement("sub");
    wrapperSub.className = "unselectable";
    wrapperSub.setAttribute("contenteditable", "false");
    wrapperSub.setAttribute("draggable", "false");
    wrapperSub.setAttribute("style", `font-size: 14px;`);
    makeUnselectable(wrapperSub);

    const labelTextNode = document.createTextNode(`${labeledMarker.label} `);
    wrapperSub.appendChild(labelTextNode);


    const openingBr = document.createTextNode("[");
    const closingBr = document.createTextNode("]");

    wrapperSpan.appendChild(openingBr)
    wrapperSpan.appendChild(wrapperSub);
    wrapperSpan.appendChild(text);
    wrapperSpan.appendChild(closingBr);

    rng.insertNode(wrapperSpan);
}

function makeUnselectable(el) {
    el.style.pointerEvents = 'none';
    el.style.userSelect = 'none';

    el.style.setProperty('-webkit-touch-callout', 'none');
    el.style.setProperty('-webkit-user-select', 'none');
    el.style.setProperty('-khtml-user-select', 'none');
    el.style.setProperty('-moz-user-select', 'none');
    el.style.setProperty('-ms-user-select', 'none');
}

function removeHighlight(span) {
    const editor = tinymce.get("lecTinyMCE");

    if (!span.hasAttribute("data-label")) return;

    const fragment = document.createDocumentFragment();

    span.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            // Entferne Klammern
            let text = node.textContent;
            text = text.replace("[", "").replace("]", "");
            if (text.trim()) {
                fragment.appendChild(document.createTextNode(text));
            }
        } else if (node.nodeName !== "SUB") {
            // Behalte alles, was kein <sub> ist
            fragment.appendChild(node.cloneNode(true));
        }
    });

    const parent = span.parentNode;
    const next = span.nextSibling;
    parent.removeChild(span);
    parent.insertBefore(fragment, next);
    parent.normalize();
    editor.nodeChanged();
}


function traverseTree1(element, user) {
    if (element.nodeType !== Node.ELEMENT_NODE) return;

    if (element.nodeName === "SPAN" && element.dataset.label) {
        const label = element.dataset.label;
        const text = extractLabeledText(element);

        if (!text || text.trim() === "") return;

        if (user == 0) {
            console.log("lec Eingaben")
            categories.filter(category => category.label === label)
                .forEach(category => category.solutionLec.push(text));
        } else {
            console.log("stud Eigaben");
            categories.filter(category => category.label === label)
                .forEach(category => category.solutionStud.push(text));
        }

    }
    element.childNodes.forEach(child => traverseTree(child, user));
}

function extractLabeledText(span) {
    let result = "";

    span.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SUB") return;
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.nodeValue;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            result += extractLabeledText(node);
        }
    });

    return result.replace(/^\[|\]$/g, "");
}

function isSelectionBetweenBracketAndSub() {
    let rng = null;

    if (user === 0) {
        rng = tinymce.activeEditor.selection.getRng();
    } else {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;
        rng = sel.getRangeAt(0);
    }

    let container = rng.startContainer;
    let offset = rng.startOffset;

    console.log("StartContainer:", container);
    console.log("Offset:", offset);
    console.log("Text:", container.nodeValue);

    // Fall 1: Wir sind in einem TextNode wie "[" direkt vor <sub>
    if (container.nodeType === Node.TEXT_NODE) {
        const text = container.nodeValue;

        // Prüfung: Cursor ganz am Ende des Texts, und Text ist nur "["
        if (offset > 0 && text[offset - 1] === "[") {
            const next = container.nextSibling;
            if (next && next.nodeName === "SUB") {
                return true;
            }
        }
    }
    return false;
}

function prepStudButtons() {
    const bar = document.getElementById("studButtons");

    categories.forEach(category => {
        let btn = document.createElement("button");
        btn.className = "category-btn";
        btn.style.background = category.color;
        let text = document.createTextNode(category.name);
        btn.style.marginRight = "5px";
        btn.appendChild(text);
        bar.appendChild(btn);

        btn.addEventListener('click', function () {
            const deacBtn = document.querySelectorAll('.active');
            const isActive = btn.classList.contains('active');

            labeledMarker.label = category.label;
            labeledMarker.color = category.color;

            deacBtn.forEach(btn => {
                btn.classList.remove('active');
                btn.style.opacity = "100%";
            });

            if (deleteMode) {
                deleteModeTrigger();
            }
            categoryTrigger(!isActive, btn);
            console.log(labeledMarker);
        })
    })
}

function prepStudExercise() {
    let exerciseText = collectCleanText(tinymce.get("lecTinyMCE").getBody());
    let exercsise = document.getElementById('studentExercise');
    exercsise.innerHTML = exerciseText;
}

function collectCleanText(root) {
    let result = "";
    const singleTags = new Set(['BR']);

    function traverse(node) {

        //Text übernehmen, ohne Klammern
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.nodeValue.replace(/\[|\]/g, "");
            return;
        }

        //Sub überspringen
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SUB") return;

        //Element Knoten
        if (node.nodeType === Node.ELEMENT_NODE) {
            //SPAN Element
            if (node.tagName === "SPAN" && node.hasAttribute("data-label")) {
                node.childNodes.forEach(traverse);
                return;
            }
            //Bestimmte SingleTags und dessen Attribute -> SingleTags haben kein />
            if (singleTags.has(node.tagName)) {
                result += `<${node.tagName.toLowerCase()}`;
                for (const attr of node.attributes) {
                    result += ` ${attr.name}="${attr.value}"`;
                }
                result += ">";
                return
            }

            //alle anderen Elemente und dessen Attribute und closing Tag
            result += `<${node.tagName.toLowerCase()}`;
            for (const attr of node.attributes) {
                result += ` ${attr.name}="${attr.value}"`
            }
            result += ">";
            node.childNodes.forEach(traverse);
            result += `</${node.tagName.toLowerCase()}>`
        }
    }
    traverse(root);
    return result;

}

function collectCleanText1(element) {
    let result = "";
    const singleTags = new Set(['BR']);

    element.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            result += node.nodeValue.replace(/\[|\]/g, "");
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === "SUB") {
                return;

            } else if (node.tagName === "SPAN" && node.hasAttribute("data-label")) {
                result += collectCleanText(node);

            } else if (singleTags.has(node.tagName)) {
                result += `</${node.tagName.toLowerCase()}>`;
                result += collectCleanText(node);

            } else {

                result += `<${node.tagName.toLowerCase()}`;

                if (node.attributes.length > 0) {
                    for (let attr of node.attributes) {
                        result += `${attr.name}="${attr.value}"`;
                    }
                }
                result += ">";
                result += collectCleanText(node);
                result += `</${node.tagName.toLowerCase()}>`;

            }
        }
    });

    return result;
}


function clearSolutionList(user) {
    user === 0 ?
        categories.forEach(cat => cat.solutionLec = []) : categories.forEach(cat => cat.solutionStud = []);

}


//Bewertung

function extractSolution(root, user) {

    const pos = { count: 0 };

    //hilfsfunktion
    const addVisible = txt =>
        (pos.count += txt.replace(/\[|\]/g, "").length);

    function traverseTree(node) {

        /*Text-Knoten */
        if (node.nodeType === Node.TEXT_NODE) {
            addVisible(node.nodeValue || "");
            return;
        }

        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SUB") return;

        if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === "P") pos.count += 1;

            if (node.tagName === "SPAN" && node.dataset.label) {
                const label = node.dataset.label;
                const startIndex = pos.count;

                //Inhalt Span
                node.childNodes.forEach(traverseTree);

                const endIndex = pos.count - 1;
                const text = extractLabeledText(node);

                if (text.trim() !== "") {
                    const actualCategory = categories.find(c => c.label === label);
                    if (actualCategory) {
                        const entry = {
                            text,
                            start: startIndex,
                            end: endIndex,
                            points: actualCategory.points
                        };
                        (user === 0 ? actualCategory.solutionLec : actualCategory.solutionStud).push(entry);
                    }
                }
                return;
            }
            //nächstes Element
            node.childNodes.forEach(traverseTree);
        }
    }
    //Startt
    traverseTree(root);
}


function filterEvaluation(categories) {
    return categories.filter(categories => categories.missing != 0);
}

function updateTree() {
    let domText = ""
    if (user === 0) {
        const editor = tinymce.get("lecTinyMCE");
        domText = editor.getBody();
        document.getElementById("tree").appendChild(domTreeVirtualisation(domText));

    } else {
        domText = document.getElementById("studentExercise");
        document.getElementById("tree").appendChild(domTreeVirtualisation(domText));

    }
}

/**
 * - Nur data-label + Text anzeigen? - horizontal? 
 * 
 *              / text
 * - DFS -root 
 *              \ text
 *               
 * welche Bedingugnen müssen erfüllt sein?
 * - element muss ELEMENT_NODE sein
 * - element darf kein SUB oder BODY Node sein
 *      - element muss TEXT_NODE sein
 * 
 * was muss mit übergebenen Element passieren?
 *  - copy von element erstellen damit dies modifiziert werden kann -> element.cloneNode(true);
 *  - content extrahieren
 *  - [] entfernen -> replace(/\[|\]/g, "")
 *  - SUB-Element entfernen 
 *  - node Obj. erstellen mit label?, name/content, children: []
 * 
 * was passiert, wenn element bearbeitet wurde?
 * - element wurde sozusagen als "parent" deklariert und dann müssen alle childNodes bearbeitet werden
 *  - jedes childNode Element muss convertiert werden (rekursiv)
 *  - es müssen null Element rausgefiltert werden filter(x => x != null)
 *  - jedes verbleibende Element muss dann in node.children gespeichert werden
 * 
 * rückgabe des nodes
 */


//Auflistung aller Markierungen

function renderMarkierungen(user) {
    let container;

    user === 0 ? container = document.getElementById("markierungenLec")
        : container = document.getElementById("markierungenStud");

    container.innerHTML = ""; // Reset

    categories.forEach((cat) => {
        const col = document.createElement("div");
        col.style.border = `1px solid ${cat.color}`;
        col.style.padding = "8px";
        col.style.minWidth = "200px";
        col.style.maxWidth = "50%"

        const header = document.createElement("h4");
        header.textContent = cat.label;
        header.style.color = cat.color;
        col.appendChild(header);

        if (user === 0) {
            cat.solutionLec.forEach((mark) => {
                const markDiv = document.createElement("div");
                markDiv.style.marginBottom = "8px";

                // Anzeige
                const textSpan = document.createElement("span");
                textSpan.textContent = `"${mark.text}"`
                markDiv.appendChild(textSpan);

                // Input für Punkte
                const input = document.createElement("input");
                input.type = "number";
                input.value = mark.points !== undefined ? mark.points : cat.points;
                input.style.margin = "0 8px";
                input.style.width = "50px";
                input.addEventListener("input", (e) => {
                    mark.points = parseFloat(e.target.value);
                });
                markDiv.appendChild(input);

                // Reset Button
                const resetBtn = document.createElement("button");
                resetBtn.textContent = "Reset";
                resetBtn.addEventListener("click", () => {
                    input.value = cat.points;
                    mark.points = cat.points;
                });

                markDiv.appendChild(resetBtn);

                col.appendChild(markDiv);
            });
        } else {
            cat.solutionStud.forEach((mark) => {
                const markDiv = document.createElement("div");
                markDiv.style.marginBottom = "8px";

                // Anzeige
                const textSpan = document.createElement("span");
                textSpan.textContent = `"${mark.text}"`

                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "X";
                deleteBtn.style.marginLeft = "8px";
                deleteBtn.style.color = "red";
                deleteBtn.addEventListener("click", () => {
                    removeStudentHighlightByStartIndex(mark.start, cat.label);
                    clearSolutionList(user);
                    extractSolution(document.getElementById("studentExercise"), user);
                    renderMarkierungen(user);
                });

                markDiv.appendChild(textSpan);
                markDiv.appendChild(deleteBtn);
                col.appendChild(markDiv);
            })
        }
        container.appendChild(col);
    });
}

function removeStudentHighlightByStartIndex(startIndex, label) {
    const root = document.getElementById("studentExercise");
    let pos = { count: 0 };
    let found = false;

    const addVisible = txt => {
        pos.count += txt.replace(/\[|\]/g, "").length;
    };

    function traverse(node) {
        if (found) return;

        if (node.nodeType === Node.TEXT_NODE) {
            addVisible(node.nodeValue || "");
            return;
        }

        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SUB") return;

        if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === "P") pos.count += 1;

            if (node.tagName === "SPAN" && node.dataset.label === label) {
                const currentStart = pos.count;

                let tempPos = { count: pos.count };
                node.childNodes.forEach(n => {
                    if (n.nodeType === Node.TEXT_NODE) {
                        tempPos.count += n.nodeValue.replace(/\[|\]/g, "").length;
                    } else if (n.nodeType === Node.ELEMENT_NODE && n.tagName !== "SUB") {
                        const tempText = extractLabeledText(n);
                        tempPos.count += tempText.replace(/\[|\]/g, "").length;
                    }
                });

                if (currentStart === startIndex) {
                    const fragment = document.createDocumentFragment();

                    node.childNodes.forEach(child => {
                        if (child.nodeType === Node.TEXT_NODE) {
                            let t = child.textContent.replace("[", "").replace("]", "");
                            if (t.trim()) {
                                fragment.appendChild(document.createTextNode(t));
                            }
                        } else if (child.nodeName !== "SUB") {
                            fragment.appendChild(child.cloneNode(true));
                        }
                    });

                    const parent = node.parentNode;
                    const next = node.nextSibling;
                    parent.removeChild(node);
                    parent.insertBefore(fragment, next);
                    parent.normalize();
                    found = true;
                    return;
                }

                node.childNodes.forEach(traverse);
                return;
            }

            node.childNodes.forEach(traverse);
        }
    }

    traverse(root);
}

// --- Helpers: Range/Text Match ---
function rangesMatch(a, b, tol) {
    return Math.abs(a.start - b.start) <= tol && Math.abs(a.end - b.end) <= tol;
}
function textsEqual(a, b) {
    return (a.text || "").toLowerCase() === (b.text || "").toLowerCase();
}

function findBestStudMatchForLecMark(lecMark, catLabel, categories, usedStudIndices) {
    const tol = toleranceValue || 0;
    const allowTol = (modi === 1 || modi === 3);
    const allowMis = (modi === 2 || modi === 3);

    //alle Markierungen
    const studAll = [];
    categories.forEach((c, ci) => {
        c.solutionStud.forEach((st, si) => {
            if (!usedStudIndices.has(`${ci}:${si}`)) {
                studAll.push({ label: c.label, mark: st, ci, si });
            }
        });
    });

    // 1) exact (gleiche Kategorie, tol=0, text gleich)
    for (const s of studAll) {
        if (s.label === catLabel && rangesMatch(lecMark, s.mark, 0) && textsEqual(lecMark, s.mark)) {
            return { idxStud: `${s.ci}:${s.si}`, bucket: "exact" };
        }
    }

    // 2) tolerance only (gleiche Kategorie, tol>0)
    if (allowTol && tol > 0) {
        for (const s of studAll) {
            if (s.label === catLabel && rangesMatch(lecMark, s.mark, tol)) {
                return { idxStud: `${s.ci}:${s.si}`, bucket: "tolerance" };
            }
        }
    }

    // 3) misassigned exact (andere Kategorie, tol=0, "relevante Textstelle getroffen")
    if (allowMis) {
        for (const s of studAll) {
            if (s.label !== catLabel && rangesMatch(lecMark, s.mark, 0) && textsEqual(lecMark, s.mark)) {
                return { idxStud: `${s.ci}:${s.si}`, bucket: "misassigned" };
            }
        }
    }

    // 4) both (andere Kategorie + Toleranz)
    if (allowMis && allowTol && tol > 0) {
        for (const s of studAll) {
            if (s.label !== catLabel && rangesMatch(lecMark, s.mark, tol)) {
                return { idxStud: `${s.ci}:${s.si}`, bucket: "both" };
            }
        }
    }

    return { idxStud: null, bucket: null };
}

function evaluate(categories) {
    const x = Number.isFinite(tolerancePointsValue) ? tolerancePointsValue : 0;
    const y = Number.isFinite(incorrectAssignValue) ? incorrectAssignValue : 0;

    const reportPerCat = [];
    let totalEarned = 0;
    let totalMax = 0;
    let totalPenalty = 0;

    const usedStud = new Set();

    categories.forEach((cat, ci) => {
        const MPdefault = num(cat.points);
        const catMax = cat.solutionLec.reduce((sum, lec) => {
            const p = num(lec.points) || MPdefault;
            return sum + p;
        }, 0);

        const exact = [], tolerance = [], misassigned = [], both = [], missing = [], wrong = [];
        let earned = 0;

        cat.solutionLec.forEach(lec => {
            const markPoints = num(lec.points) || MPdefault;
            const { idxStud, bucket } = findBestStudMatchForLecMark(lec, cat.label, categories, usedStud);

            if (!bucket) { missing.push(lec); return; }

            usedStud.add(idxStud);

            if (bucket === "exact") {
                exact.push({ lec, idxStud });
                earned += markPoints;
            } else if (bucket === "tolerance") {
                tolerance.push({ lec, idxStud });
                earned += markPoints * x;
            } else if (bucket === "misassigned") {
                misassigned.push({ lec, idxStud });
                earned += markPoints * y;
            } else if (bucket === "both") {
                both.push({ lec, idxStud });
                earned += markPoints * x * y;
            }
        });

        cat.solutionStud.forEach((st, si) => {
            const key = `${ci}:${si}`;
            if (!usedStud.has(key)) {
                wrong.push(st);
            }
        });

        function overlapsAnyGold(stMark, tol) {
            return categories.some(c =>
                c.solutionLec.some(lec => rangesMatch(lec, stMark, tol))
            );
        }
        if (pointDeduction === true || pointDeduction === 'true') {
            wrong.forEach(st => {
                if (!overlapsAnyGold(st, toleranceValue || 0)) {
                    const stPoints = num(st.points) || MPdefault;
                    totalPenalty -= stPoints;
                }
            });
        }

        totalEarned += earned;
        totalMax += catMax;

        reportPerCat.push({
            label: cat.label,
            name: cat.name,
            color: cat.color,
            extra: cat.extra,
            pointsPerMark: MPdefault,
            counts: { exact: exact.length, tolerance: tolerance.length, misassigned: misassigned.length, both: both.length, missing: missing.length, wrong: wrong.length },
            lists: { exact, tolerance, misassigned, both, missing, wrong },
            earned,
            max: catMax
        });
    });

    const grandTotal = Math.max(0, totalEarned + totalPenalty);
    return {
        perCategory: reportPerCat,
        totals: {
            earned: totalEarned,
            penalty: totalPenalty,
            final: grandTotal,
            max: totalMax
        }
    };
}

function num(n) { return Number.isFinite(n) ? n : 0; }

function printEvaluation() {
    const report = evaluate(categories);

    const container = document.getElementById("ergebnis");
    container.innerHTML = "";

    const p1 = document.createElement("p");
    p1.textContent = `Ergebnis: ${report.totals.final.toFixed(2)} / ${report.totals.max.toFixed(2)}`;
    container.appendChild(p1);

    if (report.totals.penalty < 0) {
        const p2 = document.createElement("p");
        p2.textContent = `Abzüge: ${report.totals.penalty.toFixed(2)}`;
        container.appendChild(p2);
    }


    
    report.perCategory.forEach(cat => {
        if(cat.counts.wrong > 0 || cat.counts.tolerance > 0 || cat.counts.misassigned > 0 || cat.counts.missing > 0 || cat.counts.both > 0){

            const div = document.createElement("div");
            div.style.borderLeft = `4px solid ${cat.color}`;
            div.style.paddingLeft = "8px";
            div.style.margin = "6px 0";

            const pHint = document.createElement("p");
            pHint.textContent = `Hinweis zu ${cat.name}: ${cat.extra}`;
            div.appendChild(pHint);

            container.appendChild(div);
        }


        //const h = document.createElement("strong");
        //h.textContent = `${cat.name} (${cat.label}) — ${cat.earned.toFixed(2)} / ${cat.max.toFixed(2)}`;
        //div.appendChild(h);

        //const small = document.createElement("div");
        //const c = cat.counts;
        //small.textContent = `✓ exakt: ${c.exact}, ± tol: ${c.tolerance}, falsche Kat.: ${c.misassigned}, beides: ${c.both}, fehlend: ${c.missing}, falsch: ${c.wrong}`;
        //div.appendChild(small);

        
    });
    
}

function printEvaluation1() {
    const report = evaluate(categories, toleranceValue);

    let wrongCounter, missingCounter;
    let tip;

    wrongCounter = report.reduce((sum, cat) => sum += cat.wrong.length, 0);
    missingCounter = report.reduce((sum, cat) => sum += cat.missing.length, 0);
    tip = report
        .filter(cat => cat.wrong.length || cat.missing.length)
        .map(cat => cat.extra)
        .join('; ');

    const missings = document.createElement("P");
    const wrongs = document.createElement("P");
    const tips = document.createElement("p");
    const success = document.createElement("p");

    const textMissings = document.createTextNode(`Fehlende Markierung: ${missingCounter}`);
    const textWrongs = document.createTextNode(`Falsche Markierung: ${wrongCounter}`);
    const textTips = document.createTextNode(`Hinweise: ${tip}`);
    const textSuccess = document.createTextNode("Alles richtig");


    missings.appendChild(textMissings);
    wrongs.appendChild(textWrongs);
    tips.appendChild(textTips);
    success.appendChild(textSuccess);

    const container = document.getElementById("ergebnis");

    if (missingCounter) container.appendChild(missings);
    if (wrongCounter) container.appendChild(wrongs);
    if (missingCounter || wrongCounter) container.appendChild(tips);
    if (!missingCounter && !wrongCounter) container.appendChild(success);


}
