(function () {

    if (typeof (CKEDITOR) === "undefined") {
        return;
    }

    CKEDITOR.plugins.add("capitalizeLetter", {
        init: function (editor) {

            editor.on('change',
                function(){
                    if (editor && editor.getSelection() && editor.getSelection().getStartElement()) {
                        var range = editor.getSelection().getRanges()[0];
                        var rangeElement = range.startContainer.$;

                        if (rangeElement && rangeElement.length === range.startOffset) {
                            capitalizeFirstLetterOfParagraph(editor);
                            checkForCapitalizingSymbol(editor);
                        }
                    }
                }
            );

        }
    });

    function capitalizeFirstLetterOfParagraph(editor) {
        var currentParagraph = editor.getSelection().getStartElement();
        var hasInvisibleSymbols = !!currentParagraph.$.innerText.match(/\u200B/g)
        if (currentParagraph.$.nodeName === 'TD') { return }
        if (currentParagraph.$.innerText.length !== 1 && !hasInvisibleSymbols) { return; }
        if (currentParagraph.$.innerText.length !== 8 && hasInvisibleSymbols) { return; }

        var range = editor.getSelection().getRanges()[0];
        var startOffset = range.startOffset;
        var endOffset = range.endOffset;

        //avoiding chrome bug
        if (hasInvisibleSymbols) {
            var capitalizedText = currentParagraph.$.innerText.slice(0, 7) + currentParagraph.$.innerText.charAt(7).toUpperCase();
            currentParagraph.$.innerText = capitalizedText;
            editor.getSelection().selectElement(currentParagraph);
            range = editor.getSelection().getRanges()[0];
            range.startOffset = range.endOffset
        } else {
            var capitalizedText = currentParagraph.$.innerText.charAt(0).toUpperCase() + currentParagraph.$.innerText.slice(1);
            currentParagraph.$.innerText = capitalizedText;
            range = editor.getSelection().getRanges()[0];
            range.startOffset = startOffset;
            range.endOffset = endOffset;
        }
        range.select();
    }


    function checkForCapitalizingSymbol(editor) {
        var range = editor.getSelection().getRanges()[0];
        var currentParagraphText;

        if (range.startContainer.$.nodeValue) {
            currentParagraphText = range.startContainer.$.nodeValue;
        } else {
            currentParagraphText = range.startContainer.$.innerText;
        }

        if (!currentParagraphText || range.startContainer.$.nextSibling) {
            return;
        }

        var currentlyCheckedText = currentParagraphText.slice(-5);
        var dotLocation = currentlyCheckedText.indexOf('. ');
        var exclamationLocation = currentlyCheckedText.indexOf('! ');
        var questionmarkLocation = currentlyCheckedText.indexOf('? ');

        if (dotLocation !== -1) {
            capitalizeFirstLetterOfSentence(editor, dotLocation);
        }
        if (exclamationLocation !== -1) {
            capitalizeFirstLetterOfSentence(editor, exclamationLocation);
        }
        if (questionmarkLocation !== -1) {
            capitalizeFirstLetterOfSentence(editor, questionmarkLocation);
        }
    }

    function capitalizeFirstLetterOfSentence(editor, symbolLocation) {
        var range = editor.getSelection().getRanges()[0];
        var startOffset = range.startOffset;
        var endOffset = range.endOffset;
        var currentParagraph = range.startContainer.$;
        var currentParagraphText;

        if (range.startContainer.$.nodeValue) {
            currentParagraphText = range.startContainer.$.nodeValue;
            currentParagraph.nodeValue = capitalizeLetter(symbolLocation, currentParagraph, currentParagraphText);
        } else {
            currentParagraphText = range.startContainer.$.innerText;
            currentParagraph.innerText = capitalizeLetter(symbolLocation, currentParagraph, currentParagraphText);
        }

        range = editor.getSelection().getRanges()[0];
        range.startOffset = startOffset;
        range.endOffset = endOffset;
        range.select();
    }

    function capitalizeLetter(symbolLocation, currentParagraph, currentParagraphText) {
        var letterToCapitalize = currentParagraphText.charAt(currentParagraphText.length - 3 + symbolLocation);
        var textBeforeSymbol;
        var textAfterSymbol;

        if (currentParagraph.nodeValue) {
            textBeforeSymbol = currentParagraph.nodeValue.slice(0, currentParagraphText.length - 3 + symbolLocation);
            textAfterSymbol = (symbolLocation !== 2) ? (currentParagraph.nodeValue.slice(currentParagraphText.length - 2 + symbolLocation)) : ('');
        } else {
            textBeforeSymbol = currentParagraph.innerText.slice(0, currentParagraphText.length - 3 + symbolLocation);
            textAfterSymbol = (symbolLocation !== 2) ? (currentParagraph.innerText.slice(currentParagraphText.length - 2 + symbolLocation)) : ('');
        }
        var capitalizedText = textBeforeSymbol + letterToCapitalize.toUpperCase() + textAfterSymbol;
        return capitalizedText;
    }

})();
