function gen_xmlhttp () {

    var xmlhttp = false;
    if(typeof ActiveXObject != "undefined"){
	try {
	    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	} catch (e) {
	    xmlhttp = false;
	}
    }
    if(!xmlhttp && typeof XMLHttpRequest != "undefined") {
	xmlhttp = new XMLHttpRequest();
    }

    return xmlhttp;
}

var xmlhttp = gen_xmlhttp ();

var cont = document.getElementById("cont").innerText;

function debug_out (txt) {
    var elem = document.getElementById("debug");
    elem.innerText += "\n" + txt;
}

debug_out (cont);

xmlhttp.open("GET", "./index.cgi?p=" + cont, "True");
xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
// 	var disp = document.getElementById("debug");
// 	disp.innerHTML = xmlhttp.responseText;

	var dom = xmlhttp.responseXML;
	var nodes = dom.documentElement.childNodes;

	if (nodes.length > 0) {
	    debug_out (nodes.length);
	    for (var i = 0; i < nodes.length; i ++) {
		if (nodes[i].nodeType != 1) continue;
		var cont = nodes[i].firstChild.nodeValue;
		debug_out (i + ": " + cont);

		gen_task (cont);
	    }
	}
    }
};
xmlhttp.send(null);

function gen_task (cont) {
    var xmlhttp = gen_xmlhttp ();
    xmlhttp.open ("GET", "./index.cgi?p=" + cont);
    xmlhttp.onreadystatechange = function () {
	if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
	    var dom = xmlhttp.responseXML;
	    var nodes = dom.documentElement.childNodes;

	    debug_out ("nodes: " + nodes);

	    var elems = [];
	    (function (i) {
// 		debug_out ("nodes.length: " + nodes.length);
// 		debug_out ("callee: " + arguments.callee);
		if (i < nodes.length) {
// 			debug_out ("elem: " + nodes[i]);
		    if (nodes[i].nodeType == 1) {
			elems.push (nodes[i]);
		    }
		    arguments.callee (i + 1);
		} else {
		    return;
		}
	    }) (0);

	    debug_out ("elems: " + elems);
	}
    }
    xmlhttp.send (null);
}
