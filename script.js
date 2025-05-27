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