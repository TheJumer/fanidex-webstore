package services

import "time"

// timeNow is a small indirection to ease testing.
func timeNow() time.Time { return time.Now() }
