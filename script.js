tinymce.init({
    selector: '#lecTinyMCE',
    height: 400,
    content_css: '/stylesheet.css',
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

function deleteModeTrigger(){
        deleteMode = !deleteMode;
        let deleteBtn = document.getElementById("deleteModeBtn");
        deleteBtn.textContent = deleteMode ? "Lösch-Modus beenden" : "Markierung löschen";
        deleteBtn.style.background = deleteMode ? "darkred" : "";
        console.log(deleteMode);
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
    categories.push({name, label, color, extra});

    let btn = document.createElement("button");
    btn.className=`${label}`;
    let textNode = document.createTextNode(name);
    btn.appendChild(textNode);
    btn.style.background = color;
    document.getElementById("lecButtons").appendChild(btn);

    btn.addEventListener('click', function (){
        labeledMarker.label = label;
        labeledMarker.color = color;
        if(deleteMode){
            deleteModeTrigger();
        }
        console.log(labeledMarker);
    })
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
        const checkEditor = setInterval(() => {
        const editor = tinymce.get("lecTinyMCE");
        
        if(editor && editor.getBody()) {
            clearInterval(checkEditor);
            console.log("Highlighter initialisiert");
            
            const editorBody = editor.getBody();

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
            
            editorBody.addEventListener("mouseup", function () {
                if (markingFlag === 1 && labeledMarker.label && labeledMarker.color) {
                    setTimeout(() => {
                        highlightSelection(labeledMarker);
                    }, 10); // Kurze Verzögerung für saubere Selektion
                }
            }, false);
        }
    }, 1000);
}

function highlightSelection(labeledMarker){
    const editor = tinymce.get("lecTinyMCE");
    const selection = editor.selection;
    const rng = selection.getRng();

    wrapping(rng, labeledMarker.label, labeledMarker.color);
}

function wrapping(rng, label, color){
    const text = rng.extractContents();

    const wrapperSpan = document.createElement("span");
    wrapperSpan.setAttribute("data-label", labeledMarker.label);
    wrapperSpan.setAttribute("style", `color: ${color}`);

    const wrapperSub = document.createElement("sub");
    wrapperSub.setAttribute("style", `font-size: 14px;`);
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

function removeHighlight(span) {
    const editor = tinymce.get("lecTinyMCE");

    let html = span.innerHTML;

    // Das <sub> Tag und die eckigen Klammern entfernen, aber alle anderen Inhalte erhalten
    html = html.replace(/^\[\s*<sub[^>]*>[^<]*<\/sub>/, ''); // nur am Anfang!
    html = html.replace(/\]$/, ''); // nur die letzte schließende Klammer am Ende entfernen

    // Neuen Container für das "entklammerte" HTML erstellen
    const fragment = document.createElement("span");
    fragment.innerHTML = html;

    // Falls verschachtelte Spans drin sind, bleiben diese erhalten!
    // Aber unnötigen Wrapper entfernen:
    while (fragment.childNodes.length === 1 && fragment.firstChild.nodeType === Node.ELEMENT_NODE) {
        fragment.replaceWith(fragment.firstChild);
    }

    // Das ursprüngliche Markierungsspan ersetzen:
    span.parentNode.replaceChild(fragment, span);

    editor.nodeChanged();
}