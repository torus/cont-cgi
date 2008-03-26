#!/usr/local/bin/gosh

;; (use www.cgi)
;; (use text.html-lite)

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
       (print `(cont.scm ,,index ,@x)))))

(define-macro (cont-lambda args . body)
  `(make-cont (lambda ,args ,@body)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; definitions

(define exp-part
  (cont-lambda
   (x max-n n p prev-fact-n)
   (if (> n max-n)
       ((cont-lambda (res) (print "e = " res)) p)
       (let* ((fact-n (* n prev-fact-n))
	      (v (/. (expt x n) fact-n)))
	 (exp-part x max-n (+ n 1) (+ p v) fact-n)))))

(define calc-e				; default entry point
  (cont-lambda () (exp-part 1 4 1 0 1)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; main

(define (main cmdline)
  (let1 args (cdr cmdline)
    (if (null? args)
	(calc-e)			; default entry point
	(let1 arg-list (map (cut with-input-from-string <> read) args)
	  (apply do-continuation arg-list)
	  ))))

