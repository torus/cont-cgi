var cont_tasklist = document.getElementById("cont-list").firstChild.nodeValue;
var cont_donelist = document.getElementById("cont-list-done").firstChild.nodeValue;
var cont_create = document.getElementById("cont-create").firstChild.nodeValue;

var form = document.getElementById ("create-form");
form.onsubmit = function () {
    var text = document.getElementById("create-content").value;
    if (text.length > 0) {
	document.getElementById("create-content").value = "";
	create_submit (text, cont_create);
    }
    return false;
};

var ul_elem_todo;
var ul_elem_done;

call_cont (cont_tasklist, make_tasklist_func ("TODO", gen_task, set_todo_elem));
call_cont (cont_donelist, make_tasklist_func ("DONE", gen_task_done, set_done_elem));

function set_todo_elem (elem) {
    ul_elem_todo = elem;
}

function set_done_elem (elem) {
    ul_elem_done = elem;
}

function get_todo_elem () {return ul_elem_todo;}
function get_done_elem () {return ul_elem_done;}

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

function debug_out (txt) {
    var elem = document.getElementById("debug");
    var textelem = document.createTextNode("\n" + txt);

    elem.appendChild(textelem);
}

function make_tasklist_func (label, task_func, elem_setter) {
    var dest = document.getElementById ("main");
//     debug_out ("dest: " + dest);
    var todo_h2 = document.createElement ("h2");
    var todo_label = document.createTextNode (label);
    todo_h2.appendChild (todo_label);
    dest.appendChild (todo_h2);
    var ul = document.createElement ("ul");
    dest.appendChild (ul);

    elem_setter (ul);

    return function (res) {
	var nodes = res.documentElement.childNodes;

	if (nodes.length > 0) {
// 	    debug_out (nodes.length);
	    for (var i = 0; i < nodes.length; i ++) {
		if (nodes[i].nodeType != 1) continue;
		var cont = nodes[i].firstChild.nodeValue;
// 		debug_out (i + ": " + cont);

		var li = document.createElement ("li");
		ul.appendChild (li);

		task_func (cont, li);
	    }
	}
    }
}

function call_cont (cont, callback) {
    var xmlhttp = gen_xmlhttp ();

    xmlhttp.open("GET", "./index.cgi?p=" + cont, "True");
    xmlhttp.onreadystatechange = function() {
	if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
	    callback (xmlhttp.responseXML);
	}
    };
    xmlhttp.send(null);
}

function create_submit (text, cont) {
    // FIXME: surrogate pair is not applicable
    var enc = escape(text).replace (/%u/g, "\\u").replace (/%/g, "\\x");
//     debug_out (enc);

    var req = cont.replace ("?", enc);

    debug_out ("submit: " + req);

    var func = function (res) {
	debug_out ("Created: " + res.documentElement);
	var nodes = res.documentElement.childNodes;
	var elems = filter_element_nodes (nodes);
	var cont = elems[0].firstChild.nodeValue;

	var li = document.createElement ("li");
	var ul = get_todo_elem ();
	ul.insertBefore (li, ul.firstChild);

	gen_task (cont, li);
    };

    call_cont (req, func);
}

function gen_task (cont, target_elem) {
    var func = function (dom) {
	var nodes = dom.documentElement.childNodes;
	var elems = filter_element_nodes (nodes);
	var content = elems[0].firstChild.nodeValue;
	var text_span = document.createElement ("span");
	var text = document.createTextNode (content);

	text_span.appendChild (text);
	target_elem.appendChild (text_span);

	var form = document.createElement ("form");
	form.style.display = "none";

	///////////
	text_span.onclick = function () {
	    form.style.display = "inline";
	    text_span.style.display = "none";
	};

	////////////
	var input = document.createElement ("input");
	input.setAttribute ("type", "text");
	input.setAttribute ("value", content);
	form.onsubmit = function () {
	    debug_out ("Edit -> " + input.value);

	    var edit_cont = elems[1].firstChild.nodeValue;

// 	    create_submit (input.value, edit_cont, form, text_span);

	    return false;
	};
	form.appendChild (input);
	target_elem.appendChild (form);

	///////
	make_action ("cancel", "[cancel]",
		     elems[2].firstChild.nodeValue,
		     click_cancel (target_elem, content), target_elem);
	make_action ("done", "[done]",
		     elems[3].firstChild.nodeValue,
		     click_done (target_elem, content), target_elem);

    };

    call_cont (cont, func);
}

function append_to_done_list (content) {
    var li = document.createElement ("li");
    var text = document.createTextNode (content);

    li.appendChild (text);
    ul = get_done_elem ();

    ul.insertBefore (li, ul.firstChild);
}

function append_to_cancel_list (content) {
    var li = document.createElement ("li");
    var del = document.createElement ("del");
    var text = document.createTextNode (content);

    del.appendChild (text);
    li.appendChild (del);
    ul = get_done_elem ();

    ul.insertBefore (li, ul.firstChild);
}

function gen_task_done (cont, target_elem) {
    var func = function (dom) {
	var nodes = dom.documentElement.childNodes;
	var elems = filter_element_nodes (nodes);
	var content = elems[0].firstChild.nodeValue;
	var text = document.createTextNode (content);

	target_elem.appendChild (text);
    };

    call_cont (cont, func);
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

function click_done (elem, content) {
    var func = function (res) {
	var par = elem.parentNode;
	par.removeChild (elem);
// 	get_done_elem ().appendChild (elem);

// 	var ul = get_done_elem ();
// 	ul.insertBefore (elem, ul.firstChild);
	append_to_done_list (content);

	debug_out ("Done: "
		   + res.documentElement);
    };

    return function (cont, target_elem) {
	debug_out ("DONE! " + [cont, target_elem]);
	call_cont (cont, func);
    };
}

function click_cancel (elem, content) {
    var func = function (res) {
	var par = elem.parentNode;
	par.removeChild (elem);
// 	get_done_elem ().appendChild (elem);

	append_to_cancel_list (content);
// 	var ul = get_done_elem ();
// 	ul.insertBefore (elem, ul.firstChild);

	debug_out ("Canceled: " + [res.documentElement, elem]);
    };

    return function (cont, target_elem) {
	debug_out ("CANCEL! " + [cont, target_elem]);
	call_cont (cont, func);
    };
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
