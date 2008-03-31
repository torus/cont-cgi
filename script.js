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

	var dest = document.getElementById ("main");
	debug_out ("dest: " + dest);
	var ul = document.createElement ("ul");
	dest.appendChild (ul);

	if (nodes.length > 0) {
	    debug_out (nodes.length);
	    for (var i = 0; i < nodes.length; i ++) {
		if (nodes[i].nodeType != 1) continue;
		var cont = nodes[i].firstChild.nodeValue;
		debug_out (i + ": " + cont);

		var li = document.createElement ("li");
		ul.appendChild (li);

		gen_task (cont, li);
	    }
	}
    }
};
xmlhttp.send(null);

function gen_task (cont, target_elem) {
    var xmlhttp = gen_xmlhttp ();

    xmlhttp.open ("GET", "./index.cgi?p=" + cont);
    xmlhttp.onreadystatechange = function () {
	if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
	    var dom = xmlhttp.responseXML;
	    var nodes = dom.documentElement.childNodes;

	    debug_out ("nodes: " + nodes);

	    var elems = filter_element_nodes (nodes);

	    debug_out ("elems: " + elems);

	    var text = document.createTextNode (elems[0].firstChild.nodeValue);
	    target_elem.appendChild (text);

	    make_action ("cancel",
			 elems[2].firstChild.nodeValue, click_cancel, target_elem);
	    make_action ("done", elems[3].firstChild.nodeValue, click_done, target_elem);
	}
    }
    xmlhttp.send (null);
}

function make_action (act, cont, func, target_elem) {
    var text_done = document.createTextNode (act);
    var done = document.createElement ("span");
    var cont_done = cont;
    done.onclick = function () {func (cont_done, target_elem)};
    done.setAttribute ("class", act);
    done.appendChild (text_done);
	    
    target_elem.appendChild (done);
    debug_out ("cont_done: " + cont_done);
    debug_out ("done: " + typeof (done.setAttribute));
    debug_out ("text_done: " + text_done);
}

function click_done (cont, target_elem) {
    debug_out ("DONE! " + [cont, target_elem]);
}

function click_cancel (cont, target_elem) {
    debug_out ("CANCEL! " + [cont, target_elem]);
}

function filter_element_nodes (nodes) {
    var elems = [];

    for (var i = 0; i < nodes.length; i ++) {
	if (nodes[i].nodeType == 1) {
	    elems.push (nodes[i]);
	}
    }

    return elems;
}
