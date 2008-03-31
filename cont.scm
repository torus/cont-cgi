#!/usr/local/bin/gosh

(use www.cgi)
(use text.html-lite)
(use text.tree)
(use sxml.serializer)

(define *COUNT* 0)

(define *cont-vec* (make-vector 10))

(define (do-continuation index . args)
  (apply (vector-ref *cont-vec* index) args))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; macros

(define-macro (make-cont proc)
  (let1 index *COUNT*
    (inc! *COUNT*)
    (vector-set! *cont-vec* index (eval proc ()))
    `(lambda x
       (list 'cont
	     (with-output-to-string
	       (cut write `(,,index ,@x)))))))

(define-macro (cont-lambda args . body)
  `(make-cont (lambda ,args ,@body)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; definitions

(define proccess-task
  (cont-lambda (cmd index)
    (case cmd
      ((edit) (task-edit index newcontent))
      ((cancel) (task-cancel index)))))

(define show-task
  (cont-lambda (index)
    (list
     (list 'content (task-content index))

     ;; edit
     ((cont-lambda (index newcontent)
	(task-edit index newcontent))
      index "?")

     ;; cancel
     ((cont-lambda (index) (task-cancel index)) index)

     ;; cancel
     ((cont-lambda (index) (task-done index)) index)

     )
    ))

(define (task-list flag)
  (let loop ((k 0)
	     (tasks *tasks*)
	     (filterd ()))
    (if (null? tasks)
	(reverse filterd)
	(loop (+ k 1)
	      (cdr tasks)
	      (if (eq? flag (caar tasks))
		  (cons (show-task k) filterd)
		  filterd)))))

(define *tasks* '((todo "ほげ") (done "task2") (todo "task3")
		  (todo "task4") (canceled "task5") (todo "task6")))

(define (get-task index) (list-ref *tasks* index))

(define (task-content index)
  (cadr (get-task index)))

(define (task-edit index newcontent)
  (set-car! (cdr (get-task index)) newcontent)
  '((ok)))

(define (task-cancel index)
  (set-car! (get-task index) 'canceled)
  '((ok)))

(define (task-done index)
  (set-car! (get-task index) 'done)
  '((ok)))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; main

(define (main args)
  (cgi-main
   (lambda (params)
     (let1 p (cgi-get-parameter "p" params)
       (if p
	   `(,(cgi-header :content-type "text/xml")
	     ,(srl:sxml->xml
	       `(*TOP* (*PI* xml "version=\"1.0\" encoding=\"UTF-8\"")
		       (res ,@(let1 arg-list (with-input-from-string p read)
				(apply do-continuation arg-list))
			    ))))
	   `(,(cgi-header)
	     ,(html-doctype)
	     ,(html:html
	       (html:head (html:title "Task list"))
	       (html:body
		(html:div :id "main")
		(html:div :id "cont"
			  (tree->string (cdr ((cont-lambda () (task-list 'todo))))))
		(html:pre :id "debug")
		(html:script :src "./script.js")
		)
	       )))))))

;;;
;; (put 'cont-lambda 'scheme-indent-function 1)
