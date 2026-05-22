package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/basketikun/infinite-canvas/config"
	"github.com/basketikun/infinite-canvas/router"
	"github.com/basketikun/infinite-canvas/service"
	"github.com/gin-gonic/gin"
)

func main() {
	if err := config.Load(); err != nil {
		log.Fatal(err)
	}
	if err := service.EnsureDefaultAdmin(); err != nil {
		log.Fatal(err)
	}

	// Create Gin engine
	r := gin.Default()

	// Serve static files from Next.js output
	staticDir := "./web/out"
	if _, err := os.Stat(staticDir); err == nil {
		r.Static("/_next", filepath.Join(staticDir, "_next"))
		r.Static("/messages", filepath.Join(staticDir, "messages"))
		r.Static("/favicon.ico", filepath.Join(staticDir, "favicon.ico"))

		// SPA fallback - serve index.html for all non-API routes
		r.NoRoute(func(c *gin.Context) {
			path := c.Request.URL.Path
			if !hasPrefix(path, "/api") && !hasPrefix(path, "/_next") {
				indexPath := filepath.Join(staticDir, "index.html")
				if _, err := os.Stat(indexPath); err == nil {
					c.File(indexPath)
					return
				}
			}
			c.Status(http.StatusNotFound)
		})
	}

	// Mount API routes
	router.New().ServeHTTP(r)

	log.Fatal(r.Run(":" + config.Cfg.Port))
}

func hasPrefix(s, prefix string) bool {
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
}
