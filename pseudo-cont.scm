(define-module pseudo-cont
  (export pcont-lambda do-continuation))
(select-module pseudo-cont)

(define *COUNT* 0)

(define *cont-vec* (make-vector 20))

(define (do-continuation index . args)
  (apply (vector-ref *cont-vec* index) args))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; macros

(define-macro (make-cont proc)
  (let1 index *COUNT*
    (inc! *COUNT*)
    (vector-set! *cont-vec* index (eval proc (interaction-environment)))
    `(lambda x
       (list 'cont
	     (with-output-to-string
	       (cut write `(,,index ,@x)))))))

(define-macro (pcont-lambda args . body)
  `(with-module pseudo-cont (make-cont (lambda ,args ,@body))))

(provide "pseudo-cont")
