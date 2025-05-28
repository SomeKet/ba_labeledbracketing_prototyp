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

function highlightSelection(labeledMarker) {
    const editor = tinymce.get("lecTinyMCE");
    const selection = editor.selection;
    const selectedText = selection.getContent({ format: 'text' });
    

    if(selectedText === ""){
        return;
    }else if( selectedText === " "){
        alert("Sollen 'Leerzeichen' einzeln markiert werden können?");
        return;
    }

    const selectedHTML = selection.getContent({ format: 'html' });

    if(selectedHTML.includes('data-label') ||
    selectedHTML.includes('<sub') ||
    selectedHTML[0]===" " ||
    selectedHTML[0]==="[" ||
    selectedHTML[selectedHTML.length - 1]==="]" ||
    selectedHTML[selectedHTML.length - 1]===" "){
        alert("Markierung darf nicht mit Leerzeichen, Klammer, oder Label starten oder enden");
        return;
    }

    console.log(selection.getNode().nodeName);
    console.log("Selektierter Text:", selectedText);
    
    const highlightedHTML = `<span data-label="${labeledMarker.label}" style="color: ${labeledMarker.color};">[<sub style="font-size: 14px";>${labeledMarker.label}</sub> ${selectedText} ]</span>`;
    //const highlightedHTML = `<span data-label="${labeledMarker.label}">[<sub style=" color: ${labeledMarker.color}; font-size: 14px";>${labeledMarker.label}</sub> ${selectedText} ]</span>`;
    
    selection.setContent(highlightedHTML);
}