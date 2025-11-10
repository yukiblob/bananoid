package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"sort"
	"strconv"
	"time"
)

type ScoreEntry struct {
	Name      string `json:"name"`
	Score     int    `json:"score"`
	Time      int    `json:"time"` // Time in seconds
	Timestamp int64  `json:"timestamp"`
}

type Scoreboard struct {
	Scores []ScoreEntry `json:"scores"`
}

type ScoreResponse struct {
	Rank       int          `json:"rank"`
	Total      int          `json:"total"`
	Percentile int          `json:"percentile"`
	Scores     []ScoreEntry `json:"scores"`
	Page       int          `json:"page"`
	TotalPages int          `json:"totalPages"`
}

var scoreboard Scoreboard

func init() {
	loadScoreboard()
}

// Scoreboard API handlers
func handleScoreboard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	switch r.Method {
	case "GET":
		handleGetScores(w, r)
	case "POST":
		handlePostScore(w, r)
	default:
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func handleGetScores(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	pageSizeStr := r.URL.Query().Get("pageSize")

	page := 1
	pageSize := 5

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 {
			pageSize = ps
		}
	}

	// Sort scores by score descending
	sort.Slice(scoreboard.Scores, func(i, j int) bool {
		return scoreboard.Scores[i].Score > scoreboard.Scores[j].Score
	})

	totalScores := len(scoreboard.Scores)
	totalPages := (totalScores + pageSize - 1) / pageSize

	if page > totalPages {
		page = totalPages
	}

	start := (page - 1) * pageSize
	end := start + pageSize
	if end > totalScores {
		end = totalScores
	}

	var pageScores []ScoreEntry
	if start < totalScores {
		pageScores = scoreboard.Scores[start:end]
	}

	response := ScoreResponse{
		Scores:     pageScores,
		Page:       page,
		TotalPages: totalPages,
		Total:      totalScores,
	}

	json.NewEncoder(w).Encode(response)
}

func handlePostScore(w http.ResponseWriter, r *http.Request) {
	var newScore ScoreEntry
	if err := json.NewDecoder(r.Body).Decode(&newScore); err != nil {
		http.Error(w, `{"error": "Invalid JSON"}`, http.StatusBadRequest)
		return
	}

	// Validate required fields
	if newScore.Name == "" || newScore.Score < 0 || newScore.Time < 0 {
		http.Error(w, `{"error": "Missing required fields"}`, http.StatusBadRequest)
		return
	}

	// Add timestamp
	newScore.Timestamp = time.Now().Unix()

	// Add to scoreboard
	scoreboard.Scores = append(scoreboard.Scores, newScore)

	// Sort and keep only top 1000 scores to prevent file from growing too large
	sort.Slice(scoreboard.Scores, func(i, j int) bool {
		return scoreboard.Scores[i].Score > scoreboard.Scores[j].Score
	})

	if len(scoreboard.Scores) > 1000 {
		scoreboard.Scores = scoreboard.Scores[:1000]
	}

	// Save to file
	if err := saveScoreboard(); err != nil {
		http.Error(w, `{"error": "Failed to save score"}`, http.StatusInternalServerError)
		return
	}

	// Find the rank of the newly added score
	rank := 1
	for i, score := range scoreboard.Scores {
		if score.Score == newScore.Score && score.Timestamp == newScore.Timestamp {
			rank = i + 1
			break
		}
	}

	total := len(scoreboard.Scores)
	percentile := 100 - ((rank * 100) / total)

	response := map[string]interface{}{
		"status":     "success",
		"rank":       rank,
		"total":      total,
		"percentile": percentile,
	}

	json.NewEncoder(w).Encode(response)
}

func loadScoreboard() {
	data, err := ioutil.ReadFile("scoreboard.json")
	if err != nil {
		if os.IsNotExist(err) {
			// Create empty scoreboard file
			scoreboard = Scoreboard{Scores: []ScoreEntry{}}
			saveScoreboard()
			return
		}
		fmt.Printf("Error loading scoreboard: %v\n", err)
		scoreboard = Scoreboard{Scores: []ScoreEntry{}}
		return
	}

	if err := json.Unmarshal(data, &scoreboard); err != nil {
		fmt.Printf("Error parsing scoreboard: %v\n", err)
		scoreboard = Scoreboard{Scores: []ScoreEntry{}}
	}
}

func saveScoreboard() error {
	data, err := json.MarshalIndent(scoreboard, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile("scoreboard.json", data, 0644)
}
