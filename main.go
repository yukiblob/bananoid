package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
)

type Level struct {
	Data [][]int `json:"data"`
	Name string  `json:"name"`
}

type LevelsResponse struct {
	Levels []Level `json:"levels"`
}

func main() {
	fs := http.FileServer(http.Dir("."))
	http.Handle("/", fs)

	// API endpoints
	http.HandleFunc("/api/levels", handleLevels)
	http.HandleFunc("/api/levels/save", handleSaveLevel)

	fmt.Println("Server running on http://localhost:8081")
	log.Fatal(http.ListenAndServe(":8081", nil))
}

func handleLevels(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	levels, err := loadLevels()
	if err != nil {
		fmt.Printf("Error loading levels: %v\n", err)
		http.Error(w, `{"error": "Failed to load levels"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(levels)
}

func handleSaveLevel(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method != "POST" {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var level Level
	if err := json.NewDecoder(r.Body).Decode(&level); err != nil {
		fmt.Printf("Invalid JSON: %v\n", err)
		http.Error(w, `{"error": "Invalid JSON"}`, http.StatusBadRequest)
		return
	}

	if err := saveLevel(level); err != nil {
		fmt.Printf("Error saving level: %v\n", err)
		http.Error(w, `{"error": "Failed to save level"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func loadLevels() (LevelsResponse, error) {
	var response LevelsResponse

	// Read custom_levels.js
	data, err := ioutil.ReadFile("js/custom_levels.js")
	if err != nil {
		if os.IsNotExist(err) {
			// File doesn't exist yet, create it with empty array
			initialContent := "window.levels = [];"
			if writeErr := ioutil.WriteFile("js/custom_levels.js", []byte(initialContent), 0644); writeErr != nil {
				return response, writeErr
			}
			fmt.Println("Created new custom_levels.js file")
			return response, nil
		}
		return response, err
	}

	// Extract JSON from the JavaScript file
	jsonStr := string(data)

	// More robust parsing
	jsonStr = strings.TrimSpace(jsonStr)
	jsonStr = strings.TrimPrefix(jsonStr, "window.levels")
	jsonStr = strings.TrimSpace(jsonStr)
	jsonStr = strings.TrimPrefix(jsonStr, "=")
	jsonStr = strings.TrimSpace(jsonStr)
	jsonStr = strings.TrimSuffix(jsonStr, ";")
	jsonStr = strings.TrimSpace(jsonStr)

	fmt.Printf("Parsing JSON: %s\n", jsonStr)

	// Handle empty file case
	if jsonStr == "" {
		return response, nil
	}

	var levels []Level
	if err := json.Unmarshal([]byte(jsonStr), &levels); err != nil {
		fmt.Printf("Error parsing JSON from custom_levels.js: %v\n", err)
		// Instead of failing, return empty levels and reset the file
		fmt.Println("Resetting custom_levels.js due to parse error")
		resetErr := ioutil.WriteFile("js/custom_levels.js", []byte("window.levels = [];"), 0644)
		if resetErr != nil {
			fmt.Printf("Error resetting file: %v\n", resetErr)
		}
		return response, nil
	}

	response.Levels = levels
	return response, nil
}

func saveLevel(level Level) error {
	// Load existing levels
	existingLevels, err := loadLevels()
	if err != nil {
		return err
	}

	// Add new level
	existingLevels.Levels = append(existingLevels.Levels, level)

	// Convert to JavaScript format
	jsContent := "window.levels = " + toJSONString(existingLevels.Levels) + ";"

	// Write to file
	fmt.Printf("Writing to js/custom_levels.js: %d levels\n", len(existingLevels.Levels))
	return ioutil.WriteFile("js/custom_levels.js", []byte(jsContent), 0644)
}

func toJSONString(v interface{}) string {
	b, err := json.MarshalIndent(v, "", "    ")
	if err != nil {
		fmt.Printf("Error marshaling JSON: %v\n", err)
		return "[]"
	}
	return string(b)
}
