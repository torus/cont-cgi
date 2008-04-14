var cont_tasklist = document.getElementById("cont-list").firstChild.nodeValue;
var cont_donelist = document.getElementById("cont-list-done").firstChild.nodeValue;
var cont_canceledlist = document.getElementById("cont-list-canceled").firstChild.nodeValue;
var cont_pendinglist = document.getElementById("cont-list-pending").firstChild.nodeValue;
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
var ul_elem_canceled;
var ul_elem_pending;

call_cont (cont_tasklist, make_tasklist_func ("TODO", gen_task, set_todo_elem));
call_cont (cont_pendinglist, make_tasklist_func ("PENDING", gen_task_done, set_pending_elem));
call_cont (cont_donelist, make_tasklist_func ("DONE", gen_task_done, set_done_elem));
call_cont (cont_canceledlist, make_tasklist_func ("CANCELED", gen_task_done, set_canceled_elem));

function set_todo_elem (elem) {
    ul_elem_todo = elem;
}

function set_done_elem (elem) {
    ul_elem_done = elem;
}

function set_canceled_elem (elem) {
    ul_elem_canceled = elem;
}

function set_pending_elem (elem) {
    ul_elem_pending = elem;
}

function get_todo_elem () {return ul_elem_todo;}
function get_done_elem () {return ul_elem_done;}
function get_pending_elem () {return ul_elem_pending;}
function get_canceled_elem () {return ul_elem_canceled;}

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

		var li = document.createElement ("li");
		li.className = "color-" + (i % 5);
		ul.appendChild (li);

		task_func (cont, li);
	    }
	}
    }
}

function call_cont (cont, callback) {
    var xmlhttp = gen_xmlhttp ();

    xmlhttp.open("GET", "./todo.cgi?p=" + cont, "True");
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

function edit_submit (text, cont, input_elem, text_span_elem) {
    // FIXME: surrogate pair is not applicable
    var enc = escape(text).replace (/%u/g, "\\u").replace (/%/g, "\\x");
//     debug_out (enc);

    var req = cont.replace ("?", enc);

    debug_out ("submit: " + req);

    var func = function (res) {
	debug_out ("Edited: " + res.documentElement);
	text_span_elem.firstChild.nodeValue = text;
	input_elem.onblur ();
    };

    call_cont (req, func);
}

function make_input (content, edit_cont, target_elem) {
    var text_span = document.createElement ("span");
    text_span.className = "task-desc";
    var text = document.createTextNode (content);

    text_span.appendChild (text);
    target_elem.appendChild (text_span);

    var form = document.createElement ("form");
    form.style.display = "none";

    var input = document.createElement ("input");
    input.setAttribute ("type", "text");
    input.setAttribute ("value", content);
    form.onsubmit = function () {
	debug_out ("Edit -> " + input.value);

	edit_submit (input.value, edit_cont, input, text_span);

	return false;
    };

    ///////////
    text_span.onclick = function () {
	form.style.display = "inline";
	text_span.style.display = "none";
	input.focus ();
    };

    ////////
    input.onblur = function () {
	form.style.display = "none";
	text_span.style.display = "inline";
	debug_out ("blur: " + input);
    }

    form.appendChild (input);
    target_elem.appendChild (form);

    return input;
}

function gen_task (cont, target_elem) {
    var func = function (dom) {
	var nodes = dom.documentElement.childNodes;
	var elems = filter_element_nodes (nodes);
	var content = elems[0].firstChild.nodeValue;

	make_input (content, elems[1].firstChild.nodeValue,
		    target_elem);


	///////
	make_action ("done", "[done]", elems[3].firstChild.nodeValue,
		     make_click_handler (target_elem, content, get_done_elem ()),
		     target_elem);
// 		     click_done (target_elem, content), target_elem);

	make_action ("pending", "[suspend]", elems[4].firstChild.nodeValue,
		     make_click_handler (target_elem, content, get_pending_elem ()),
		     target_elem);
// 		     click_suspend (target_elem, content), target_elem);

	make_action ("cancel", "[cancel]", elems[2].firstChild.nodeValue,
		     make_click_handler (target_elem, content, get_canceled_elem ()),
		     target_elem);
// 		     click_cancel (target_elem, content), target_elem);
    };

    call_cont (cont, func);
}

function append_to_simple_list (content, ul_elem) {
    var li = document.createElement ("li");
    var text = document.createTextNode (content);

    li.appendChild (text);

    ul_elem.insertBefore (li, ul_elem.firstChild);
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

function make_action (act_name, disp, cont, func, target_elem) {
    var text_act = document.createTextNode (disp);
    var act = document.createElement ("span");
    var cont_act = cont;

    act.onclick = function () {func (cont_act, target_elem)};
    act.className = act_name;
    act.appendChild (text_act);
	    
    target_elem.appendChild (act);
}

function make_click_handler (elem, content, target_list_elem) {
    var func = function (res) {
	var par = elem.parentNode;
	par.removeChild (elem);
	append_to_simple_list (content, target_list_elem);


	debug_out ("Done: "
		   + res.documentElement);
    };

    return function (cont, target_elem) {
	debug_out ("DONE! " + [cont, target_elem]);
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
