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

var cont_tasklist = document.getElementById("cont-list").firstChild.nodeValue;
var cont_create = document.getElementById("cont-create").firstChild.nodeValue;

function debug_out (txt) {
    var elem = document.getElementById("debug");
    var textelem = document.createTextNode("\n" + txt);

    elem.appendChild(textelem);
}

// debug_out (cont_tasklist);
// debug_out (cont_create);

var form = document.getElementById ("create-form");
form.onsubmit = function () {
    var text = document.getElementById("create-content").value;
    if (text.length > 0) {
	document.getElementById("create-content").value = "";
	create_submit (text, cont_create);
    }
    return false;
};

xmlhttp.open("GET", "./index.cgi?p=" + cont_tasklist, "True");
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

function call_cont (cont, callback) {
    xmlhttp.open("GET", "./index.cgi?p=" + cont, "True");
    xmlhttp.onreadystatechange = function() {
	if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
	    callback (xmlhttp.responseXML);
	}
    };
    xmlhttp.send(null);
}

function create_submit (text, cont) {
    var req = cont.replace ("?", text);

    debug_out ("submit: " + req);

    call_cont (req,
	       function (res) {
		   debug_out ("Submitted: "
			      + res.documentElement);
	       });
}

function gen_task (cont, target_elem) {
    var xmlhttp = gen_xmlhttp ();

    xmlhttp.open ("GET", "./index.cgi?p=" + cont);
    xmlhttp.onreadystatechange = function () {
	if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
	    var dom = xmlhttp.responseXML;
	    var nodes = dom.documentElement.childNodes;
	    var elems = filter_element_nodes (nodes);
	    var text = document.createTextNode (elems[0].firstChild.nodeValue);

	    target_elem.appendChild (text);

	    make_action ("cancel", "[cancel]",
			 elems[2].firstChild.nodeValue, click_cancel, target_elem);
	    make_action ("done", "[done]",
			 elems[3].firstChild.nodeValue, click_done, target_elem);
	}
    }
    xmlhttp.send (null);
}

function make_action (act, disp, cont, func, target_elem) {
    var text_act = document.createTextNode (disp);
    var act = document.createElement ("span");
    var cont_act = cont;
    act.onclick = function () {func (cont_act, target_elem)};
    act.setAttribute ("class", act);
    act.appendChild (text_act);
	    
    target_elem.appendChild (act);
}

function click_done (cont, target_elem) {
    call_cont (cont,
	       function (res) {
		   debug_out ("Done: "
			      + res.documentElement);
		   debug_out ("DONE! " + [cont, target_elem]);
	       });
}

function click_cancel (cont, target_elem) {
    call_cont (cont,
	       function (res) {
		   debug_out ("Canceled: "
			      + res.documentElement);
		   debug_out ("CANCEL! " + [cont, target_elem]);
	       });
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
