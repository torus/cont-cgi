#!/usr/local/bin/gosh
; -*- scheme -*-

(use srfi-1)
(use util.list)
(use www.cgi)
(use text.html-lite)
(use text.tree)
(use sxml.serializer)

(define *COUNT* 0)

(define *cont-vec* (make-vector 20))

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
      ((edit) (task-edit! index newcontent))
      ((cancel) (task-cancel! index)))))

(define show-task
  (cont-lambda (index)
    (list
     (list 'content (task-content index))

     ;; edit
     ((cont-lambda (index newcontent)
	(task-edit! index newcontent))
      index "?")

     ;; cancel
     ((cont-lambda (index) (task-cancel! index)) index)

     ;; done
     ((cont-lambda (index) (task-done! index)) index)

     ;; suspend
     ((cont-lambda (index) (task-suspend! index)) index)

     )
    ))

(define (task-list flag)
  (let loop ((tasks *tasks*)
	     (filterd ()))
    (if (null? tasks)
	(reverse filterd)
	(loop (cdr tasks)
	      (let1 key (caar tasks)
		(if (eq? flag (cadar tasks))
		    (cons (show-task key) filterd)
		    filterd))))))

;; ((label content) ...)

;; new format:
;; ((key label content) ...)

(define *file* "task.data")
(define *tasks*
  (guard (e (else '()))
	 (with-input-from-file *file* read)))

(define (write-data)
  (with-output-to-file *file* (cut write *tasks*)))

(define (get-task key) (assoc-ref *tasks* key))

(define (task-content key)
  (cadr (get-task key)))

(define (task-edit! key newcontent)
  (set-car! (cdr (get-task key)) newcontent)
  (write-data)
  '((ok)))

(define (task-cancel! key)
  (set-car! (get-task key) 'canceled)
  (write-data)
  '((ok)))

(define (task-done! key)
  (set-car! (get-task key) 'done)
  (write-data)
  '((ok)))

(define (task-suspend! key)
  (set-car! (get-task key) 'pending)
  (write-data)
  '((ok)))

(define (gen-key)
  (length+ *tasks*))

(define (task-create! content)
  (let1 key (gen-key)
    (set! *tasks* (alist-cons key `(todo ,content) *tasks*))
    (write-data)
    `(,(show-task key))))

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
	       (html:head
		(html:title "Task list")
		(html:link :rel "stylesheet" :href "styles.css"
			   :type "text/css" :media "screen"))
	       (html:body
		(html:form
		 :id "create-form"
		 (html:p "Add new task: "
			 (html:input :type "text" :id "create-content")))
		(html:div :id "main")
		(html:div :id "cont-list" :class "invisible"
			  (tree->string (cdr ((cont-lambda () (task-list 'todo))))))
		(html:div :id "cont-list-done" :class "invisible"
			  (tree->string (cdr ((cont-lambda () (task-list 'done))))))
		(html:div :id "cont-list-canceled" :class "invisible"
			  (tree->string (cdr ((cont-lambda () (task-list 'canceled))))))
		(html:div :id "cont-list-pending" :class "invisible"
			  (tree->string (cdr ((cont-lambda () (task-list 'pending))))))
		(html:div :id "cont-create" :class "invisible"
			  (tree->string (cdr ((cont-lambda (x) (task-create! x)) "?"))))
		(html:pre :id "debug")
		(html:script :src "./script.js")
		)
	       )))))))

;;;
;; (put 'cont-lambda 'scheme-indent-function 1)
