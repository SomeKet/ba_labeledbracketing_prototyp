tinymce.init({
    selector: '#lecTinyMCE',
    height: 400,
    content_css: '/style.css',
    //entity_encoding: 'raw', /* wenn aktiviert: NICHT anzeigen von &nbsp; */
    plugins: [
      // Core editing features
      'anchor', 'charmap', 'codesample', 'emoticons', 'lists', 'searchreplace', 'table', 'visualblocks', 'wordcount','save', 'code'
    ],
    paste_as_text: true, /************* WICHTIG FÜR only <p></p> durch pasten von Text *******************/
    toolbar: 'abc | code | save | highlight | textmarkierung | tagger | undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',

}); 

let categories = [];
const labeledMarker = {label:"", color:""};
let markingFlag = 0;
let deleteMode = false;
let user = 0;


    // Starte die Initialisierung nach DOM-Load
document.addEventListener('DOMContentLoaded', function(){
    setTimeout(initializeHighlighter, 500);

    let btn1 = {name:"Satz", label:"s", color:"red", extra:"Satz"};
    let btn2 = {name:"Nominalphrase", label:"np", color:"green", extra:"Nominalphrase"};
    let btn3 = {name:"Verbalphrase", label:"vp", color:"blue", extra:"Verbalphrase"};
    let btn4 = {name:"Verb", label:"v", color:"orange", extra:"Verb"};

    let btnlist = [btn1, btn2, btn3, btn4];

    btnlist.forEach(btn => createCategory(btn.name, btn.label, btn.color, btn.extra));

});


document.getElementById("solution").addEventListener('click', (e)=>{
    e.preventDefault();

    const editor = tinymce.get("lecTinyMCE");
    extractSolution(editor.getBody(), 0);
    categories.forEach(c => {
        console.log(`Kategorie: ${c.label}`, c.solution);
    });
    
    user = 1;
    document.getElementById('lecturerView').hidden = true;
    document.getElementById('studentView').hidden = false;
    prepStudButtons();
    prepStudExercise();
    initializeHighlighter();
    
})

function deleteModeTrigger(){
        deleteMode = !deleteMode;
        const deleteBtn = document.getElementById("deleteModeBtn");

        deleteBtn.textContent = deleteMode ? "Lösch-Modus beenden" : "Markierung löschen";
        deleteBtn.style.background = deleteMode ? "darkred" : "";

        if(deleteMode){
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.style.opacity="100%";
            });

            labeledMarker.color = null;
            labeledMarker.label = null;
            tinymce.get('lecTinyMCE').contentDocument.body.style.caretColor = "";
        }
}

document.getElementById('categoryForm').addEventListener('submit', (e) => {
    e.preventDefault(); //verhinder redirect

    const data = new FormData(e.target);
    const name = data.get("name");
    const label = data.get("label");
    const color = data.get("color");
    const extra = data.get("extra");

    if(!checkCategoryDuplette(name, label, color)){
        return;    
    }else{
        console.log(name, label, color, extra);
        createCategory(name, label, color, extra);
        document.getElementById('categoryForm').reset();
    }

})

function createCategory(name, label, color, extra){
    categories.push({name, label, color, extra,solutionLec:[], solutionStud:[]});

    let btn = document.createElement("button");
    btn.className=`category-btn`;
    let textNode = document.createTextNode(name);
    btn.appendChild(textNode);
    btn.style.background = color;
    btn.style.marginRight= "5px";

    document.getElementById("lecButtons").appendChild(btn);

    btn.addEventListener('click', function (){
        const deacBtn = document.querySelectorAll('.active');
        const isActive = btn.classList.contains('active');

        labeledMarker.label = label;
        labeledMarker.color = color;

        deacBtn.forEach(btn => {
            btn.classList.remove('active');
            btn.style.opacity="100%";
        });

        if(deleteMode){
            deleteModeTrigger();
        }
        categoryTrigger(!isActive, btn);
        console.log(labeledMarker);
    })
}

function categoryTrigger(isActive, btn){
    if(isActive){
        btn.classList.add('active');
        tinymce.get('lecTinyMCE').contentDocument.body.style.caretColor = labeledMarker.color;
        btn.style.opacity="50%";
    }else{
        btn.classList.remove('active');
        labeledMarker.color = null;
        labeledMarker.label = null;
        tinymce.get('lecTinyMCE').contentDocument.body.style.caretColor = "";
        btn.style.opacity="100%";
    }
}

function checkCategoryDuplette(name, label, color){
    const exists = categories.some(category => {
        if(category.name.toLowerCase() === name.toLowerCase()){
            alert("Bezeichnung existiert bereits");
            return true;
        }
        else if(category.label.toLowerCase() === label.toLowerCase()){
            alert("Label existiert bereits");
            return true;
        }
        else if(category.color.toLowerCase() === color.toLowerCase()){
            alert("Farbe existiert bereits");
            return true;
        }
        return false;
    });
    
    if(!exists){
        alert("Kategorie wurde gespeichert");
    }
    return !exists;
}

function initializeHighlighter() {
    initHighlightView()
}

function viewFocus(){
    if(user === 0){
        return tinymce.get('lecTinyMCE');
    }else{
        return document.getElementById('studentExercise');
    }
}


function initHighlightView(){
    const checkEditor = setInterval(() => {
        const editor = viewFocus();
        
        let editorBody = null;
        user === 0 ? editorBody = editor.getBody() : editorBody = editor; 

        if(editor && editorBody) {
            clearInterval(checkEditor);
            console.log("Highlighter initialisiert");
        
            editorBody.addEventListener("click", function(e) {
                if(deleteMode && e.target.closest('span[data-label]')) {
                    e.preventDefault();
                    e.stopPropagation();
                    removeHighlight(e.target.closest('span[data-label]'));
                }
            }, true);
            
            editorBody.addEventListener("mousedown", function () {
                markingFlag = 0;
            }, false);
            
            editorBody.addEventListener("mousemove", function () {
                markingFlag = 1;
            }, false);
            
            let highlightLock = false;
            editorBody.addEventListener("mouseup", function () {
                if(markingFlag === 1 && labeledMarker.label && labeledMarker.color) {
                    if(highlightLock) return;

                    highlightLock = true;

                    setTimeout(() => {
                        user === 0 ? highlightSelection(labeledMarker) : highlightSelectionStudent();
                        setTimeout(()=> {
                            highlightLock = false;
                        }, 200);
                    }, 10); // Kurze Verzögerung für saubere Selektion
                }
            }, false);
        }
    }, 1000);
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

function highlightSelection(labeledMarker){
    const editor = tinymce.get("lecTinyMCE");
    const selection = editor.selection;
    const rng = selection.getRng(); //tinymce range objekt

    if(rng.toString().trim() === ""){
        return;
    }

    console.log(selection.getNode().nodeName);
    if(selection.getNode().nodeName !== "P" && selection.getNode().nodeName !== "SPAN"){
        alert("Block-Element");
        return;
    }

    if(isSelectionBetweenBracketAndSub()){
        return;
    }
    

    const countOpenBrac = rng.toString().match(/\[/g) || [];
    const countClosedBrac = rng.toString().match(/\]/g) || [];

    // normale markierung -> [0][0]
    // Zusammenfassen -> [x][x]
    // 1 markierung übermarkieren -> [1][1]

    if((countOpenBrac.length === 0 && countClosedBrac.length === 0) ||
        (countOpenBrac.length === countClosedBrac.length)){
            wrapping(rng, labeledMarker.label, labeledMarker.color);
        }else{
            console.log("überlappung");
            return;
        }

}

function highlightSelectionStudent(){
    const container = document.getElementById('studentExercise');
    const selection = window.getSelection();
    const rng = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if(!container.contains(selection.anchorNode)){
        console.log("anchor fail");
        return;
    }

    if(!rng || rng.toString().trim() === ""){
        console.log("leerbereich");
        return;
    }

        const countOpenBrac = rng.toString().match(/\[/g) || [];
    const countClosedBrac = rng.toString().match(/\]/g) || [];

    if((countOpenBrac.length === 0 && countClosedBrac.length === 0) ||
        (countOpenBrac.length === countClosedBrac.length)){
            wrappingStudent(rng);
        }else{
            console.log("überlappung");
            return;
    }
    
}

function wrappingStudent(rng){
    const selectedText = rng.toString();

    if(!selectedText.trim() === "")return;

    const wrapperText = document.createTextNode(selectedText);

    const wrapperSpan = document.createElement("span");
    wrapperSpan.style.color = labeledMarker.color;
    wrapperSpan.setAttribute("data-label", labeledMarker.label);

    const wrapperSub = document.createElement("sub");
    wrapperSub.className="unselectable";
    wrapperSub.setAttribute("contenteditable", "false");
    wrapperSub.setAttribute("draggable", "false");
    wrapperSub.setAttribute("style", `font-size: 14px;`);
    makeUnselectable(wrapperSub);

    const labelText = document.createTextNode(labeledMarker.label);
    wrapperSub.appendChild(labelText);

    const openingBr = document.createTextNode("[");
    const closingBr = document.createTextNode("]");

    rng.deleteContents();
    wrapperSpan.appendChild(openingBr);
    wrapperSpan.appendChild(wrapperSub);
    wrapperSpan.appendChild(wrapperText);
    wrapperSpan.appendChild(closingBr);

    rng.insertNode(wrapperSpan);
    
}

function wrapping(rng, label, color){
    const text = rng.extractContents();

    const wrapperSpan = document.createElement("span");
    wrapperSpan.setAttribute("data-label", label);
    wrapperSpan.setAttribute("style", `color: ${color}`);

    const wrapperSub = document.createElement("sub");
    wrapperSub.className = "unselectable";
    wrapperSub.setAttribute("contenteditable", "false");
    wrapperSub.setAttribute("draggable", "false");
    wrapperSub.setAttribute("style", `font-size: 14px;`);
    makeUnselectable(wrapperSub);

    const labelTextNode = document.createTextNode(label);
    wrapperSub.appendChild(labelTextNode);


    const openingBr = document.createTextNode("[");
    const closingBr = document.createTextNode("]");

    wrapperSpan.appendChild(openingBr)
    wrapperSpan.appendChild(wrapperSub);
    wrapperSpan.appendChild(text);
    wrapperSpan.appendChild(closingBr);

    rng.insertNode(wrapperSpan);
}

function makeUnselectable(el){
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

    if(!span.hasAttribute("data-label")) return;

    const fragment = document.createDocumentFragment();

    span.childNodes.forEach(node => {
        if(node.nodeType === Node.TEXT_NODE) {
            // Entferne Klammern
            let text = node.textContent;
            text = text.replace("[", "").replace("]", "");
            if (text.trim()) {
                fragment.appendChild(document.createTextNode(text));
            }
        }else if (node.nodeName !== "SUB") {
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


function extractSolution(root, user){
    traverseTree(root, user);
}

function traverseTree(element, user){
    if(element.nodeType !== Node.ELEMENT_NODE)return;

    if(element.nodeName === "SPAN" && element.dataset.label){
        const label = element.dataset.label;
        const text = extractTextContent(element);

        if(!text || text.trim() === "")return;

        if(user == 0){
            categories.filter(category => category.label === label)
            .forEach(category => category.solutionLec.push(text));
        }else{
            categories.filter(category => category.label === label)
            .forEach(category => category.solutionStud.push(text));
        }
        
    }
    element.childNodes.forEach(child => traverseTree(child,user));
}

function extractTextContent(span) {
    let result = "";

    span.childNodes.forEach(node => {
        if(node.nodeType === Node.ELEMENT_NODE && node.tagName === "SUB") return;
        if(node.nodeType === Node.TEXT_NODE) {
            result += node.nodeValue;
        }else if(node.nodeType === Node.ELEMENT_NODE) {
            result += extractTextContent(node);
        }
    });

    return result.replace(/^\[|\]$/g, "").trim();
}

function isSelectionBetweenBracketAndSub() {
    const rng = tinymce.activeEditor.selection.getRng();
    const container = rng.startContainer;
    const offset = rng.startOffset;

    // Fall 1: Wir sind in einem TextNode wie "[" direkt vor <sub>
    if(container.nodeType === Node.TEXT_NODE) {
        const text = container.nodeValue;

        // Prüfung: Cursor ganz am Ende des Texts, und Text ist nur "["
        if(text === "[" && offset === 1) {
            const next = container.nextSibling;
            if(next && next.nodeName === "SUB") {
                return true;
            }
        }
    }

    return false;
}

function prepStudButtons(){
    const bar = document.getElementById("studButtons");

    categories.forEach(category => {
        let btn = document.createElement("button");
        btn.className = "category-btn";
        btn.style.background = category.color;
        let text = document.createTextNode(category.name);
        btn.style.marginRight= "5px";
        btn.appendChild(text);
        bar.appendChild(btn);

        btn.addEventListener('click', function (){
        const deacBtn = document.querySelectorAll('.active');
        const isActive = btn.classList.contains('active');

        labeledMarker.label = category.label;
        labeledMarker.color = category.color;

        deacBtn.forEach(btn => {
            btn.classList.remove('active');
            btn.style.opacity="100%";
        });

        if(deleteMode){
            deleteModeTrigger();
        }
        categoryTrigger(!isActive, btn);
        console.log(labeledMarker);
        })
    })
}

function prepStudExercise(){
    let exerciseText = collectCleanText(tinymce.get("lecTinyMCE").getBody());
    let p = document.createElement('p');
    p.innerHTML = exerciseText;

    let exercsise = document.getElementById('studentExercise');
    container.style.width = "400px";
    container.style.height= "auto";
    container.style.marginBottom = "20px";

    exercsise.appendChild(p);
}

function collectCleanText(element) {
    let result = "";

    element.childNodes.forEach(node => {
        if(node.nodeType === Node.TEXT_NODE) {
            // Entferne eckige Klammern direkt hier
            result += node.nodeValue.replace(/\[|\]/g, "");
        }else if(node.nodeType === Node.ELEMENT_NODE) {
            if(node.tagName === "SUB") {
                // SUB-Elemente komplett ignorieren
                return;
            }else{
                // Rekursiv weiter durchlaufen
                result += collectCleanText(node);
            }
        }
    });

    return result;
}

