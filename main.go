package main

import (
	"log"
	"net/http"
)

func main() {

	fs := http.FileServer(http.Dir("."))

	http.Handle("/", fs)

	port := ":8000"
	log.Printf("Server running at http://localhost%s/", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
