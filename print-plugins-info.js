// list of plugins used in both demos and in ppt
// a=demo-config, b=demo-ppt, c=ppt
console.log("plugins used in environments:");
console.log("a=demo-config, b=demo-ppt, c=ppt");
var a=["a11yhelp","about","basicstyles","bidi","blockquote","button","clipboard","colorbutton","contextmenu","copyformatting","detectConflict","dialog","dialogadvtab","dialogui","elementspath","enterkey","entities","fakeobjects","filebrowser","filetools","find","flite","floatingspace","floatpanel","font","format","forms","horizontalrule","htmlwriter","iframe","image","justify","language","lineutils","link","listblock","liststyle","magicline","maximize","menu","menubutton","newpage","notification","notificationaggregator","panel","panelbutton","pastetext","popup","preview","print","removeformat","resize","richcombo","save","scayt","selectall","showborders","smiley","sourcearea","stylescombo","tab","table","tableselection","tabletools","toolbar","undo","uploadimage","uploadwidget","widget","widgetselection","wsc","wysiwygarea"];
var b=["a11yhelp","about","base64image","basicstyles","blockquote","button","capitalizeLetter","clipboard","colorbutton","contextmenu","copyformatting","customFormat","customTab","detectConflict","dialog","dialogui","enterkey","entities","fakeobjects","filebrowser","filetools","flite","floatingspace","floatpanel","font","horizontalrule","htmlwriter","indent","indentlist","justify","lance","lineutils","link","list","listblock","magicline","maximize","menu","menubutton","notification","notificationaggregator","pagebreak","panel","panelbutton","pasteFromGoogleDoc","pastefromword","pastetext","popup","removeformat","resize","richcombo","save","scayt","showborders","sourcearea","specialchar","stylescombo","table","tableselection","tabletools","toolbar","undo","uploadimage","uploadwidget","widget","widgetselection","wsc","wysiwygarea"];
var c=["a11yhelp","about","base64image","basicstyles","blockquote","button","capitalizeLetter","clipboard","colorbutton","contextmenu","copyformatting","customFormat","customTab","detectConflict","dialog","dialogui","enterkey","entities","fakeobjects","filebrowser","filetools","flite","floatingspace","floatpanel","font","horizontalrule","htmlwriter","indent","indentlist","justify","lance","lineutils","link","list","listblock","magicline","maximize","menu","menubutton","notification","notificationaggregator","pagebreak","panel","panelbutton","pasteFromGoogleDoc","pastefromword","pastetext","popup","removeformat","resize","richcombo","save","scayt","showborders","sourcearea","specialchar","stylescombo","table","tableselection","tabletools","toolbar","undo","uploadimage","uploadwidget","widget","widgetselection","wsc","wysiwygarea"];
var c2=["a11yhelp","about","adobeair","ajax","autocomplete","autoembed","autogrow","autolink","balloonpanel","balloontoolbar","base64image","bbcode","bidi","capitalizeLetter","clipboard","cloudservices","codesnippet","codesnippetgeshi","colorbutton","colordialog","copyformatting","customFormat","customTab","devtools","dialog","dialogadvtab","div","divarea","docprops","easyimage","embed","embedbase","embedsemantic","emoji","find","flash","flite","font","forms","iframe","iframedialog","image","image2","imagebase","indentblock","justify","lance","language","link","liststyle","magicline","mathjax","mentions","mergeFields","newpage","pagebreak","panelbutton","pasteFromGoogleDoc","pastefromword","placeholder","preview","print","save","scayt","selectall","sharedspace","showblocks","smiley","sourcedialog","specialchar","stylesheetparser","table","tableresize","tableselection","tabletools","templates","textmatch","textwatcher","uicolor","uploadfile","widget","wsc","xml"]

var abc = b.filter(x => a.includes(x) && c.includes(x));
var ab = b.filter(x => a.includes(x) && !c.includes(x));
var ac = a.filter(x => c.includes(x) && !b.includes(x));
var bc = b.filter(x => c.includes(x) && !a.includes(x));
var aa = a.filter(x => !c.includes(x) && !b.includes(x));
var bb = b.filter(x => !c.includes(x) && !a.includes(x));
var cc = c.filter(x => !a.includes(x) && !b.includes(x));
var cc2 = c2.filter(x => !c.includes(x));

console.log("abc=" + abc + " length=" + abc.length);
console.log("ab=" + ab + " length=" + ab.length);
console.log("ac=" + ac + " length=" + ac.length);
console.log("bc=" + bc + " length=" + bc.length);
console.log("a=" + aa + " length=" + aa.length);
console.log("b=" + bb + " length=" + bb.length);
console.log("c=" + cc + " length=" + cc.length);
console.log("cc2=" + cc2 + " length=" + cc2.length);
